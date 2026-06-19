// app/api/tools/resize/route.ts
// ── Quick Tools: Resize Image (FIXED) ─────────────────────────
// POST multipart/form-data: { image: File, option: preset_id }
//
// PERBAIKAN: import preset dari lib/resize/presets.ts (SATU sumber kebenaran).
// Tidak ada lagi daftar preset inline yang beda dengan UI → tidak ada
// lagi "INVALID_PRESET" karena key UI = key API = key lib.

import { NextResponse } from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { PRESET_MAP }    from '@/lib/resize/presets'
import { checkToolAllowed } from '@/lib/tools/access'
import { enforceToolAccess, logToolUsage } from '@/lib/tools/enforce'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 20

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(req: Request) {
  try {
    // ── Auth ───────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const gate = await checkToolAllowed(supabase, user.id, 'resize')
    if (!gate.allowed) {
      return NextResponse.json({ error:'TOOL_DISABLED', message: gate.reason || 'Tool ini sedang tidak tersedia.' }, { status: 403 })
    }
    const enforce = await enforceToolAccess(supabase, user.id, 'resize')
    if (!enforce.allowed) {
      return NextResponse.json({ error:'ACCESS_DENIED', message:enforce.reason }, { status:enforce.status })
    }
    const startTime = Date.now()
    // ── Parse form ─────────────────────────────────────────
    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error: 'INVALID_FORM', message: 'Form tidak valid.' }, { status: 400 }) }

    const imageFile = formData.get('image') as File | null
    const preset    = ((formData.get('option') as string) || 'shopee').trim()

    if (!imageFile)                       return NextResponse.json({ error: 'NO_FILE', message: 'File tidak ditemukan.' }, { status: 400 })
    if (!ALLOWED.includes(imageFile.type))return NextResponse.json({ error: 'INVALID_TYPE', message: 'Format harus JPG, PNG, atau WebP.' }, { status: 400 })
    if (imageFile.size > MAX_SIZE)        return NextResponse.json({ error: 'FILE_TOO_LARGE', message: 'Maksimal 10MB.' }, { status: 400 })

    // ── Cari preset di SATU sumber kebenaran ───────────────
    const cfg = PRESET_MAP[preset]
    if (!cfg) {
      return NextResponse.json({
        error:   'INVALID_PRESET',
        message: `Preset "${preset}" tidak dikenal.`,
        valid:   Object.keys(PRESET_MAP),   // bantu debug: daftar key yang sah
      }, { status: 400 })
    }

    // ── Sharp ──────────────────────────────────────────────
    let sharp: any
    try { sharp = (await import('sharp')).default }
    catch {
      return NextResponse.json({
        error:   'SHARP_NOT_FOUND',
        message: 'Library resize tidak tersedia. Jalankan: npm install sharp',
      }, { status: 500 })
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const { w, h, fit, bgDefault, exportFmt } = cfg

    // Background untuk fit 'contain' (padding)
    const isTransparent = bgDefault === 'transparent'
    const bg =
      bgDefault === 'black' ? { r: 0,   g: 0,   b: 0,   alpha: 1 } :
      isTransparent         ? { r: 0,   g: 0,   b: 0,   alpha: 0 } :
                              { r: 255, g: 255, b: 255, alpha: 1 }  // white default (juga utk blur/color)

    let pipeline = sharp(buffer, { failOn: 'none' })
      .rotate()  // hormati EXIF orientation (foto HP tidak miring)
      .resize(w, h, {
        fit,
        position: 'centre',
        background: fit === 'contain' ? bg : undefined,
        withoutEnlargement: false,
      })

    // ── Output format ──────────────────────────────────────
    // Transparan wajib PNG; selain itu ikut exportFmt preset.
    const fmt = isTransparent ? 'png' : exportFmt
    let out: Buffer, contentType: string, ext: string

    if (fmt === 'png') {
      out = await pipeline.png({ compressionLevel: 9 }).toBuffer()
      contentType = 'image/png'; ext = 'png'
    } else if (fmt === 'webp') {
      out = await pipeline.webp({ quality: 90 }).toBuffer()
      contentType = 'image/webp'; ext = 'webp'
    } else {
      out = await pipeline.flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 92, progressive: true, mozjpeg: true }).toBuffer()
      contentType = 'image/jpeg'; ext = 'jpg'
    }

    console.log('[tools/resize] ok:', preset, `${w}x${h}`, `${(out.length / 1024).toFixed(0)}KB`)
    await logToolUsage(supabase, user.id, 'resize', 'sharp', 0, Date.now() - startTime)
    return new NextResponse(out as any, {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="beesell-${preset}-${w}x${h}.${ext}"`,
        'X-Preset':            preset,
        'X-Dimensions':        `${w}x${h}`,
        'X-Output-Ext':        ext,
        'Cache-Control':       'no-store',
      },
    })
    
  } catch (err: any) {
    console.error('[POST /api/tools/resize]', err?.message)
    
    return NextResponse.json({ error: 'INTERNAL', message: err?.message ?? 'Terjadi kesalahan.' }, { status: 500 })
  }
}