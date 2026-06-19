// app/api/tools/upscale/route.ts
// ── Quick Tools: AI Upscale (Replicate Real-ESRGAN) ───────────
// POST multipart: { image: File, option: 2x|4x|2x-face|4x-denoise }
// Returns: upscaled image binary (JPEG)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { predict, toDataUri, getOutputUrl, fetchImage } from '@/lib/replicate'
import sharp from 'sharp'
import { enforceToolAccess, consumeCredits, logToolUsage } from '@/lib/tools/enforce'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 180

// Real-ESRGAN by nightmareai
const MODEL_VERSION = 'philz1337x/clarity-pro-upscaler'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED  = ['image/jpeg','image/jpg','image/png','image/webp']

interface UpscaleConfig {
  scale_factor: 2 | 4
  creativity: number
  allowProduct?: boolean
}

const PRESETS: Record<string, UpscaleConfig> = {
  '2x':        { scale_factor: 2, creativity: 1, allowProduct: true },
  '4x':        { scale_factor: 4, creativity: 1, allowProduct: true },

  '2x-sharp':  { scale_factor: 2, creativity: 3, allowProduct: false },
  '4x-sharp':  { scale_factor: 4, creativity: 3, allowProduct: false },

  'creative':  { scale_factor: 4, creativity: 5, allowProduct: false },
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const fd = await req.formData()
    const imageFile = fd.get('image') as File | null
    const option    = (fd.get('option') as string) ?? '2x'
    const enforce = await enforceToolAccess(supabase, user.id, 'upscale')
    if (!enforce.allowed) {
      return NextResponse.json({ error:'ACCESS_DENIED', message:enforce.reason }, { status:enforce.status })
    }
    const startTime = Date.now()
    if (!imageFile) return NextResponse.json({ error:'NO_FILE', message:'Upload gambar dulu.' }, { status:400 })
    if (!ALLOWED.includes(imageFile.type)) return NextResponse.json({ error:'INVALID_TYPE', message:'Format harus JPG, PNG, atau WebP.' }, { status:400 })
    if (imageFile.size > MAX_SIZE) return NextResponse.json({ error:'FILE_TOO_LARGE', message:'Maksimal 10MB.' }, { status:400 })

    const config = PRESETS[option] ?? PRESETS['2x']
    
    // Guard untuk foto produk
    if (config.allowProduct === false) {
      return NextResponse.json(
        {
          error: 'INVALID_OPTION',
          message: 'Mode ini tidak tersedia untuk foto produk.',
        },
        { status: 400 }
      )
    }
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const dataUri = await toDataUri(buffer, imageFile.type)

    const pred = await predict(MODEL_VERSION, {
      image: dataUri,
      scale_factor: config.scale_factor,
      creativity: config.creativity,
      output_format: 'png',
    })
    const resultUrl = getOutputUrl(pred)
    const { buffer: resultBuf, contentType } = await fetchImage(resultUrl)

    console.log('[tools/upscale] ok:', option, `${config.scale_factor}x`, `${(resultBuf.length/1024).toFixed(0)}KB`)
    if (!enforce.isSuperuser && enforce.creditCost > 0) {
          await consumeCredits(supabase, user.id, 'upscale', enforce.creditCost, { description:`Upscale ${option}` })
        }
    await logToolUsage(supabase, user.id, 'upscale', 'replicate', 0.005, Date.now() - startTime)
    return new NextResponse(resultBuf as any, {
      headers: {
        'Content-Type': contentType,
        'X-Scale': String(config.scale_factor),
        'X-Creativity': String(config.creativity),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (err: any) {
    console.error('[POST /api/tools/upscale]', err?.message)
    return NextResponse.json({ error:'PROCESSING_ERROR', message: err?.message ?? 'Gagal upscale gambar.' }, { status:500 })
  }
}