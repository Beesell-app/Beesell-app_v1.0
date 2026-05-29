// app/api/tools/resize-smart/route.ts
// ── Resize Smart AI — Full API ────────────────────────────────
// POST multipart/form-data:
//   image:        File          — gambar input
//   presets:      string        — JSON array of preset IDs (e.g. ["shopee","instagram-sq"])
//   padding:      string        — 'white'|'black'|'transparent'|'blur'|'color'
//   paddingColor: string        — hex color jika padding='color' (e.g. "#FF0000")
//   quality:      string        — 'high'|'balanced'|'small'
//   format:       string        — 'jpg'|'png'|'webp' (override per-preset)
//   sharpen:      string        — 'true'|'false'
//   denoise:      string        — 'true'|'false'
//
// Returns: JSON { results: [{ presetId, url, width, height, sizeKB, format, name }] }
// Each result URL is a base64 data URL (no storage needed for Quick Tools)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  PRESET_MAP, getQualitySettings,
  type ResizePreset, type PaddingMode, type QualityMode, type ExportFormat,
} from '@/lib/resize/presets'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

const MAX_INPUT_BYTES = 20 * 1024 * 1024  // 20MB input
const ALLOWED_TYPES   = new Set(['image/jpeg','image/jpg','image/png','image/webp'])
const MAX_PRESETS     = 20  // max presets per request

// ── Dynamic import Sharp ─────────────────────────────────────
async function getSharp() {
  try {
    return (await import('sharp')).default
  } catch {
    throw new Error('Sharp tidak tersedia. Jalankan: npm install sharp')
  }
}

// ── Build filename ─────────────────────────────────────────────
function buildFilename(
  originalName: string,
  presetId:     string,
  format:       ExportFormat,
): string {
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
  return `${base}-${presetId}.${format}`
}

// ── Process single image for one preset ───────────────────────
async function processOne(opts: {
  inputBuffer:  Buffer
  sharp:        any
  preset:       ResizePreset
  padding:      PaddingMode
  paddingColor: string
  quality:      QualityMode
  format:       ExportFormat
  sharpen:      boolean
  denoise:      boolean
}): Promise<{
  presetId:  string
  dataUrl:   string
  sizeKB:    number
  width:     number
  height:    number
  format:    ExportFormat
}> {
  const { inputBuffer, sharp, preset, padding, paddingColor, quality, format, sharpen, denoise } = opts
  const q = getQualitySettings(quality)

  let pipeline = sharp(inputBuffer)

  // ── Step 1: Resize with smart fit ─────────────────────────
  if (preset.fit === 'contain') {
    // contain: scale down to fit, add padding for remaining space
    const bgColor = (() => {
      if (padding === 'white')       return { r:255, g:255, b:255, alpha:1 }
      if (padding === 'black')       return { r:0,   g:0,   b:0,   alpha:1 }
      if (padding === 'transparent') return { r:0,   g:0,   b:0,   alpha:0 }
      if (padding === 'color') {
        // Parse hex color
        const hex = paddingColor.replace('#', '')
        const r   = parseInt(hex.slice(0, 2), 16) || 255
        const g   = parseInt(hex.slice(2, 4), 16) || 255
        const b   = parseInt(hex.slice(4, 6), 16) || 255
        return { r, g, b, alpha: 1 }
      }
      return { r:255, g:255, b:255, alpha:1 }
    })()

    pipeline = pipeline.resize(preset.w, preset.h, {
      fit:               'contain',
      background:        bgColor,
      withoutEnlargement: false,
    })

    // Blur mode: resize first then blur background
    if (padding === 'blur') {
      // For blur: composite resized image over blurred background
      // 1. Make blurred background
      const blurredBg = await sharp(inputBuffer)
        .resize(preset.w, preset.h, { fit: 'cover' })
        .blur(30)
        .toBuffer()

      // 2. Make contained foreground (transparent bg)
      const fg = await sharp(inputBuffer)
        .resize(preset.w, preset.h, {
          fit:        'contain',
          background: { r:0, g:0, b:0, alpha:0 },
        })
        .png()
        .toBuffer()

      // 3. Composite
      pipeline = sharp(blurredBg).composite([{ input: fg, blend: 'over' }])
    }
  } else if (preset.fit === 'cover') {
    // cover: smart crop — center crop (AI focal point would go here)
    pipeline = pipeline.resize(preset.w, preset.h, {
      fit:      'cover',
      position: 'centre',  // Smart crop: center (entropy-based would need extra logic)
    })
  } else {
    // fill: stretch (rarely used)
    pipeline = pipeline.resize(preset.w, preset.h, { fit: 'fill' })
  }

  // ── Step 2: Enhancement ────────────────────────────────────
  if (sharpen) {
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 2.5 })
  }
  if (denoise) {
    pipeline = pipeline.median(1)  // light denoise
  }

  // ── Step 3: Export format ──────────────────────────────────
  let outputBuffer: Buffer
  let mimeType: string

  const outputFormat = format === 'png' || (format === 'jpg' && padding === 'transparent')
    ? 'png'  // force PNG if transparency needed
    : format

  if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
    outputBuffer = await pipeline
      .jpeg({ quality: q.jpg, progressive: true, mozjpeg: true })
      .toBuffer()
    mimeType = 'image/jpeg'
  } else if (outputFormat === 'webp') {
    outputBuffer = await pipeline
      .webp({ quality: q.webp, effort: 4 })
      .toBuffer()
    mimeType = 'image/webp'
  } else {
    outputBuffer = await pipeline
      .png({ compressionLevel: q.png, progressive: false })
      .toBuffer()
    mimeType = 'image/png'
  }

  const sizeKB = Math.round(outputBuffer.length / 1024)
  const b64    = outputBuffer.toString('base64')

  return {
    presetId: preset.id,
    dataUrl:  `data:${mimeType};base64,${b64}`,
    sizeKB,
    width:    preset.w,
    height:   preset.h,
    format:   outputFormat as ExportFormat,
  }
}

// ── POST Handler ──────────────────────────────────────────────
export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    // ── Auth ────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Silakan login.' }, { status: 401 })
    }

    // ── Parse FormData ──────────────────────────────────────────
    let fd: FormData
    try { fd = await req.formData() }
    catch { return NextResponse.json({ error: 'INVALID_FORM' }, { status: 400 }) }

    const imageFile   = fd.get('image') as File | null
    const presetsRaw  = (fd.get('presets')      as string | null) ?? '["shopee"]'
    const padding     = ((fd.get('padding')      as string | null) ?? 'white')        as PaddingMode
    const paddingColor= (fd.get('paddingColor')  as string | null) ?? '#ffffff'
    const quality     = ((fd.get('quality')      as string | null) ?? 'balanced')     as QualityMode
    const format      = ((fd.get('format')       as string | null) ?? 'jpg')          as ExportFormat
    const sharpen     = (fd.get('sharpen')       as string | null) === 'true'
    const denoise     = (fd.get('denoise')       as string | null) === 'true'

    // ── Validate file ───────────────────────────────────────────
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ error: 'NO_FILE', message: 'File gambar tidak ditemukan.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(imageFile.type)) {
      return NextResponse.json({ error: 'INVALID_TYPE', message: `Format tidak didukung: ${imageFile.type}` }, { status: 400 })
    }
    if (imageFile.size > MAX_INPUT_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE', message: `File terlalu besar. Maks 20MB.` }, { status: 400 })
    }
    if (imageFile.size < 500) {
      return NextResponse.json({ error: 'FILE_TOO_SMALL', message: 'File terlalu kecil.' }, { status: 400 })
    }

    // ── Validate presets ────────────────────────────────────────
    let presetIds: string[]
    try { presetIds = JSON.parse(presetsRaw) }
    catch { return NextResponse.json({ error: 'INVALID_PRESETS', message: 'Format presets tidak valid.' }, { status: 400 }) }

    if (!Array.isArray(presetIds) || presetIds.length === 0) {
      return NextResponse.json({ error: 'NO_PRESETS', message: 'Pilih minimal 1 preset.' }, { status: 400 })
    }
    if (presetIds.length > MAX_PRESETS) {
      return NextResponse.json({ error: 'TOO_MANY_PRESETS', message: `Maksimal ${MAX_PRESETS} preset per request.` }, { status: 400 })
    }

    const validPresets = presetIds
      .map(id => PRESET_MAP[id])
      .filter((p): p is ResizePreset => !!p)

    if (validPresets.length === 0) {
      return NextResponse.json({ error: 'INVALID_PRESETS', message: 'Preset tidak dikenal.' }, { status: 400 })
    }

    // ── Load Sharp & input buffer ───────────────────────────────
    const sharp       = await getSharp()
    const inputBuffer = Buffer.from(await imageFile.arrayBuffer())

    // Get original dimensions
    const meta = await sharp(inputBuffer).metadata()
    const origW = meta.width  ?? 0
    const origH = meta.height ?? 0

    console.log(`[resize-smart] START user:${user.id} presets:${validPresets.length} ${origW}×${origH} ${Math.round(imageFile.size/1024)}KB`)

    // ── Process all presets ─────────────────────────────────────
    // Sequential for memory safety (parallel for larger quotas)
    const results = []

    for (const preset of validPresets) {
      try {
        // Use preset's recommended format unless overridden
        const effectiveFormat = format !== 'jpg' ? format
          : (preset.bgDefault === 'transparent' ? 'png' : preset.exportFmt)

        const res = await processOne({
          inputBuffer,
          sharp,
          preset,
          padding:      preset.fit === 'contain' ? padding : 'white',
          paddingColor,
          quality,
          format:       effectiveFormat,
          sharpen,
          denoise,
        })

        // Validate compliance
        const maxKB = preset.maxSizeKB
        const compliance = {
          ok:     res.sizeKB <= maxKB,
          sizeOk: res.sizeKB <= maxKB,
          issues: res.sizeKB > maxKB
            ? [`File ${res.sizeKB}KB melebihi limit platform (${maxKB}KB) — coba mode "Small"`]
            : [],
        }

        results.push({
          presetId:    preset.id,
          label:       preset.label,
          platform:    preset.platform,
          icon:        preset.icon,
          width:       res.width,
          height:      res.height,
          sizeKB:      res.sizeKB,
          format:      res.format,
          dataUrl:     res.dataUrl,
          filename:    buildFilename(imageFile.name, preset.id, res.format),
          compliance,
          ratio:       preset.ratio,
        })

      } catch (e: any) {
        console.error(`[resize-smart] preset ${preset.id} failed:`, e.message)
        results.push({
          presetId: preset.id,
          label:    preset.label,
          platform: preset.platform,
          icon:     preset.icon,
          error:    e.message ?? 'Gagal memproses preset ini',
        })
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const success = results.filter(r => !('error' in r)).length
    console.log(`[resize-smart] DONE ${success}/${validPresets.length} presets in ${elapsed}s`)

    return NextResponse.json({
      success:    true,
      total:      validPresets.length,
      processed:  success,
      timeSec:    elapsed,
      originalDimensions: { w: origW, h: origH },
      results,
    })

  } catch (err: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.error(`[POST /api/tools/resize-smart] ${elapsed}s`, err?.message)
    return NextResponse.json({
      error:   'INTERNAL',
      message: err?.message ?? 'Terjadi kesalahan server.',
    }, { status: 500 })
  }
}