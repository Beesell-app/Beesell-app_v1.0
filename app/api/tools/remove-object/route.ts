// app/api/tools/remove-object/route.ts
// ══════════════════════════════════════════════════════════════
// Quick Tools — Remove Object (AI Inpainting)
// ══════════════════════════════════════════════════════════════
//
// Model priority (auto-detected at runtime):
//   1. Replicate SDXL Inpainting (stability-ai/stable-diffusion-inpainting)
//   2. lucataco/sdxl-inpainting
//   3. andreasjansson/stable-diffusion-inpainting (SD 1.5, faster)
//
// POST /api/tools/remove-object
// Body: multipart/form-data
//   image   File    Foto asli (JPG/PNG/WebP, max 10MB)
//   mask    File    Mask PNG dari canvas brush (area putih = hapus)
//   prompt  string  Optional: apa yang harus menggantikan objek ('background','blur','auto')
//
// Response: PNG binary langsung
//
// How mask works:
//   - Canvas brush user menghasilkan mask
//   - Area PUTIH (brush) = area yang dihapus dan di-inpaint
//   - Area HITAM = area yang dipertahankan
//   - Model mengisi area putih dengan background yang sesuai
//
// Cost: ~$0.004–0.008/run = ~Rp60–120/gambar
// Env:  REPLICATE_API_TOKEN

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceToolAccess, consumeCredits, logToolUsage } from '@/lib/tools/enforce'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED   = new Set(['image/jpeg','image/jpg','image/png','image/webp'])

// ── Model candidates ──────────────────────────────────────────
const INPAINT_CANDIDATES = [
  'stability-ai/stable-diffusion-inpainting',
  'lucataco/sdxl-inpainting',
  'andreasjansson/stable-diffusion-inpainting',
]

let _cachedModel: { model: string; version: string } | null = null

async function getBestInpaintModel(token: string): Promise<{ model: string; version: string }> {
  if (_cachedModel) return _cachedModel

  for (const model of INPAINT_CANDIDATES) {
    try {
      const res = await fetch(`https://api.replicate.com/v1/models/${model}`, {
        headers: { Authorization: `Token ${token}` },
        signal:  AbortSignal.timeout(6000),
      })
      if (!res.ok) continue

      const data = await res.json() as { latest_version?: { id: string } }
      const version = data.latest_version?.id
      if (!version) continue

      _cachedModel = { model, version }
      console.log('[remove-object] Model:', model, version.slice(0,16)+'...')
      return _cachedModel
    } catch { continue }
  }

  throw new Error('Model inpainting tidak tersedia. Coba lagi nanti.')
}

// ── Build input per model ─────────────────────────────────────
function buildInpaintInput(
  model:       string,
  imageUrl:    string,
  maskUrl:     string,
  fillPrompt:  string,
): Record<string, unknown> {
  const isXL = model.includes('sdxl')

  const basePrompt = `clean background, seamless, high quality product photo, ${fillPrompt}`
  const negPrompt  = 'object, person, hand, watermark, text, logo, blurry, artifacts, seam'

  if (isXL) {
    // SDXL inpainting format
    return {
      image:               imageUrl,
      mask:                maskUrl,
      prompt:              basePrompt,
      negative_prompt:     negPrompt,
      num_inference_steps: 30,
      guidance_scale:      8.0,
      strength:            0.99,
      num_outputs:         1,
    }
  }

  // SD 1.5 inpainting format
  return {
    image:               imageUrl,
    mask:                maskUrl,
    prompt:              basePrompt,
    negative_prompt:     negPrompt,
    num_inference_steps: 25,
    guidance_scale:      7.5,
    num_outputs:         1,
    inpaint_full_res:    true,
  }
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download gagal: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// ═══════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Silakan login terlebih dahulu.' },
        { status: 401 },
      )
    }
     const enforce = await enforceToolAccess(supabase, user.id, 'remove-object')
      if (!enforce.allowed) {
        return NextResponse.json({ error:'ACCESS_DENIED', message:enforce.reason }, { status:enforce.status })
      }
      const startTime = Date.now()
    // ── Parse multipart ───────────────────────────────────────
    let formData: FormData
    try { formData = await req.formData() }
    catch {
      return NextResponse.json(
        { error: 'INVALID_FORM', message: 'Format request tidak valid.' },
        { status: 400 },
      )
    }

    const imageFile  = formData.get('image')  as File   | null
    const maskFile   = formData.get('mask')   as File   | null
    const fillMode   = (formData.get('prompt') as string | null) ?? 'auto'

    // ── Validate image ────────────────────────────────────────
    if (!imageFile || typeof imageFile === 'string') {
      return NextResponse.json(
        { error: 'NO_IMAGE', message: 'File gambar tidak ditemukan.' },
        { status: 400 },
      )
    }
    if (!maskFile || typeof maskFile === 'string') {
      return NextResponse.json(
        { error: 'NO_MASK', message: 'Mask tidak ditemukan. Brush area yang ingin dihapus dulu.' },
        { status: 400 },
      )
    }
    if (!ALLOWED.has(imageFile.type)) {
      return NextResponse.json({
        error:   'INVALID_TYPE',
        message: `Format tidak didukung: ${imageFile.type}. Gunakan JPG, PNG, atau WebP.`,
      }, { status: 400 })
    }
    if (imageFile.size > MAX_BYTES) {
      return NextResponse.json({
        error:   'FILE_TOO_LARGE',
        message: `File terlalu besar (${(imageFile.size/1024/1024).toFixed(1)}MB). Maks 10MB.`,
      }, { status: 413 })
    }

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'CONFIG_ERROR', message: 'REPLICATE_API_TOKEN belum dikonfigurasi.' },
        { status: 500 },
      )
    }

    // ── Encode to data URLs ───────────────────────────────────
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const maskBuffer  = Buffer.from(await maskFile.arrayBuffer())

    const imageDataUrl = `data:${imageFile.type};base64,${imageBuffer.toString('base64')}`
    const maskDataUrl  = `data:image/png;base64,${maskBuffer.toString('base64')}`

    // Fill prompt based on mode
    const fillPrompt = {
      auto:       'natural background, seamless fill',
      background: 'plain white background, clean studio',
      blur:       'soft blurred background, bokeh',
      match:      'matching background texture, seamless',
    }[fillMode] ?? 'natural background, seamless fill'

    console.log(
      `[remove-object] size=${(imageFile.size/1024).toFixed(0)}KB`,
      `mask=${(maskFile.size/1024).toFixed(0)}KB fill=${fillMode}`,
    )

    // ── Get best model ────────────────────────────────────────
    let active: { model: string; version: string }
    try {
      active = await getBestInpaintModel(token)
    } catch (e: any) {
      return NextResponse.json(
        { error: 'MODEL_UNAVAILABLE', message: e.message },
        { status: 503 },
      )
    }

    const input = buildInpaintInput(active.model, imageDataUrl, maskDataUrl, fillPrompt)

    // ── Create prediction ─────────────────────────────────────
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method:  'POST',
      headers: {
        Authorization:  `Token ${token}`,
        'Content-Type': 'application/json',
        'Prefer':       'wait=30',
      },
      body: JSON.stringify({ version: active.version, input }),
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({})) as Record<string,unknown>
      const msg = (err.detail as string) ?? `Replicate ${createRes.status}`
      console.error('[remove-object] create failed:', createRes.status, msg)

      if (createRes.status === 422 && msg.includes('version')) {
        _cachedModel = null
        return NextResponse.json({
          error:   'MODEL_UPDATED',
          message: 'Model diperbarui. Refresh dan coba lagi.',
        }, { status: 503 })
      }
      if (createRes.status === 429) {
        return NextResponse.json(
          { error: 'RATE_LIMITED', message: 'Terlalu banyak request. Tunggu 1 menit.' },
          { status: 429 },
        )
      }
      return NextResponse.json({ error: 'INPAINT_FAILED', message: msg }, { status: 502 })
    }

    let prediction = await createRes.json() as {
      id: string; status: string
      output: string | string[] | null; error?: string
    }

    // ── Poll ──────────────────────────────────────────────────
    if (prediction.status !== 'succeeded') {
      const deadline = Date.now() + 52_000
      while (Date.now() < deadline) {
        await sleep(2_000)
        const pr = await fetch(
          `https://api.replicate.com/v1/predictions/${prediction.id}`,
          { headers: { Authorization: `Token ${token}` } },
        )
        prediction = await pr.json()
        if (prediction.status === 'succeeded') break
        if (prediction.status === 'failed' || prediction.status === 'canceled') {
          if (prediction.error?.includes('version')) _cachedModel = null
          return NextResponse.json({
            error:   'INPAINT_FAILED',
            message: prediction.error ?? 'Model gagal memproses.',
          }, { status: 502 })
        }
      }
      if (prediction.status !== 'succeeded') {
        return NextResponse.json(
          { error: 'TIMEOUT', message: 'Timeout. Coba gambar lebih kecil atau area brush lebih kecil.' },
          { status: 503 },
        )
      }
    }

    // ── Download & return ─────────────────────────────────────
    const outputUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output

    if (!outputUrl) {
      return NextResponse.json(
        { error: 'EMPTY_OUTPUT', message: 'Tidak ada output. Coba lagi.' },
        { status: 502 },
      )
    }

    const resultBuffer = await downloadBuffer(outputUrl as string)
    console.log(`[remove-object] OK model=${active.model.split('/')[1]} size=${resultBuffer.length}B`)
    if (!enforce.isSuperuser && enforce.creditCost > 0) {
          await consumeCredits(supabase, user.id, 'remove-object', enforce.creditCost, { description:`Remove Object (${fillMode})` })
        }
        await logToolUsage(supabase, user.id, 'remove-object', active.model.split('/')[0], 0.006, Date.now() - startTime)
    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'image/png',
        'Content-Disposition': `attachment; filename="beesell-remove-object-${Date.now()}.png"`,
        'X-Fill-Mode':         fillMode,
        'X-Model':             active.model,
        'Cache-Control':       'no-store',
      },
    })

  } catch (err: any) {
    console.error('[POST /api/tools/remove-object] unhandled:', err?.message)
    
    return NextResponse.json({
      error:   'INTERNAL',
      message: err?.message ?? 'Terjadi kesalahan server.',
    }, { status: 500 })
  }
}