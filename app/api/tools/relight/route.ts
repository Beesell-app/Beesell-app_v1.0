// app/api/tools/relight/route.ts
// ── Quick Tools: AI Relight (Sharp — instant, free) ───────────
// POST multipart: { image: File, option: studio|natural|golden|dramatic|soft|cool }
//
// Menggunakan Sharp untuk adjustment pencahayaan produk.
// Nol COGS — tidak pakai Replicate. Instan.
// Kalau mau AI relighting (IC-Light dll), uncomment blok Replicate di bawah.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceToolAccess, logToolUsage } from '@/lib/tools/enforce'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED  = ['image/jpeg','image/jpg','image/png','image/webp']

interface LightPreset {
  label:       string
  brightness:  number   // 0.5-2.0 (1 = normal)
  saturation:  number   // 0.5-2.0
  gamma:       number   // 0.5-3.0 (< 1 = brighter shadows)
  contrast:    number   // linear stretch: 0.5-2.0 via modulate doesn't exist, we use gamma
  tint?:       { r:number; g:number; b:number }  // color temperature shift
  sharpen?:    boolean
}

const PRESETS: Record<string, LightPreset> = {
  studio: {
    label: 'Studio', brightness: 1.15, saturation: 0.95, gamma: 1.1,
    contrast: 1.1, tint: { r:255, g:252, b:248 }, sharpen: true,
  },
  natural: {
    label: 'Natural', brightness: 1.08, saturation: 1.05, gamma: 1.05,
    contrast: 1.0, tint: { r:255, g:250, b:240 },
  },
  golden: {
    label: 'Golden Hour', brightness: 1.1, saturation: 1.2,  gamma: 1.08,
    contrast: 1.05, tint: { r:255, g:235, b:200 },
  },
  dramatic: {
    label: 'Dramatic', brightness: 0.95, saturation: 1.15, gamma: 1.3,
    contrast: 1.2, tint: { r:240, g:240, b:255 }, sharpen: true,
  },
  soft: {
    label: 'Soft Light', brightness: 1.12, saturation: 0.9, gamma: 1.02,
    contrast: 0.95, tint: { r:255, g:248, b:245 },
  },
  cool: {
    label: 'Cool Tone', brightness: 1.05, saturation: 0.95, gamma: 1.1,
    contrast: 1.05, tint: { r:230, g:240, b:255 },
  },
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const fd = await req.formData()
    const imageFile = fd.get('image') as File | null
    const option    = (fd.get('option') as string) ?? 'studio'
    const enforce = await enforceToolAccess(supabase, user.id, 'relight')
    if (!enforce.allowed) {
      return NextResponse.json({ error:'ACCESS_DENIED', message:enforce.reason }, { status:enforce.status })
    }
    const startTime = Date.now()
    if (!imageFile) return NextResponse.json({ error:'NO_FILE', message:'Upload gambar dulu.' }, { status:400 })
    if (!ALLOWED.includes(imageFile.type)) return NextResponse.json({ error:'INVALID_TYPE' }, { status:400 })
    if (imageFile.size > MAX_SIZE) return NextResponse.json({ error:'FILE_TOO_LARGE', message:'Maksimal 10MB.' }, { status:400 })

    const preset = PRESETS[option] ?? PRESETS.studio

    let sharp: any
    try { sharp = (await import('sharp')).default }
    catch { return NextResponse.json({ error:'SHARP_NOT_FOUND', message:'npm install sharp' }, { status:500 }) }

    const buffer = Buffer.from(await imageFile.arrayBuffer())

    // Pipeline: rotate(exif) → tint → gamma → modulate → sharpen → output
    let pipeline = sharp(buffer, { failOn:'none' }).rotate()

    // Color temperature tint via recomb matrix
    if (preset.tint) {
      const { r, g, b } = preset.tint
      const rr = r / 255, gg = g / 255, bb = b / 255
      // Soft tint via recomb (mix channels proportionally)
      pipeline = pipeline.recomb([
        [rr * 0.95 + 0.05, 0.02, 0.02],
        [0.02, gg * 0.95 + 0.05, 0.02],
        [0.02, 0.02, bb * 0.95 + 0.05],
      ])
    }

    // Gamma correction (< 1 brightens shadows, > 1 deepens)
    pipeline = pipeline.gamma(preset.gamma)

    // Brightness + saturation via modulate
    pipeline = pipeline.modulate({
      brightness: preset.brightness,
      saturation: preset.saturation,
    })
    .normalize()
    .linear(1.05, -5)

    // Sharpening for studio/dramatic
    if (preset.sharpen) {
      pipeline = pipeline.sharpen({ sigma: 1.2, m1: 0.8, m2: 0.4 })
    }

    // Normalize (auto white balance — gentle)
    pipeline = pipeline.normalize({ lower: 1, upper: 99 })

    const output = await pipeline
      .jpeg({ quality: 92, progressive: true, mozjpeg: true })
      .toBuffer()

    console.log('[tools/relight] ok:', option, `${(output.length/1024).toFixed(0)}KB`)
    await logToolUsage(supabase, user.id, 'relight', 'sharp', 0, Date.now() - startTime)
    return new NextResponse(output as any, {
      headers: {
        'Content-Type':        'image/jpeg',
        'Content-Disposition': `attachment; filename="beesell-relight-${option}.jpg"`,
        'X-Preset':            option,
        'Cache-Control':       'no-store',
      },
    })

  } catch (err: any) {
    console.error('[POST /api/tools/relight]', err?.message)
    return NextResponse.json({ error:'PROCESSING_ERROR', message: err?.message ?? 'Gagal mengatur pencahayaan.' }, { status:500 })
  }
}