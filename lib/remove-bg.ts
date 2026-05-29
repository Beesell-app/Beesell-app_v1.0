// app/api/tools/upscale/route.ts
// ── Quick Tools: AI Upscale ───────────────────────────────────
// POST: { image: File, option: '2'|'4' }
// Uses Replicate Real-ESRGAN model — best for product photos
// Cost: ~$0.002-0.01 per image (Replicate pay-per-second)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED  = ['image/jpeg','image/jpg','image/png','image/webp']

// Replicate Real-ESRGAN model
const REPLICATE_MODEL = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b'

async function toBase64(buffer: Buffer, mimeType: string): Promise<string> {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (!replicateKey) {
      return NextResponse.json({
        error: 'CONFIG_ERROR',
        message: 'REPLICATE_API_TOKEN belum dikonfigurasi.',
      }, { status: 500 })
    }

    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error: 'INVALID_FORM' }, { status: 400 }) }

    const imageFile = formData.get('image') as File | null
    const scale     = parseInt((formData.get('option') as string) ?? '2')

    if (!imageFile) return NextResponse.json({ error: 'NO_FILE', message: 'File tidak ditemukan.' }, { status: 400 })
    if (!ALLOWED.includes(imageFile.type)) return NextResponse.json({ error: 'INVALID_TYPE' }, { status: 400 })
    if (imageFile.size > MAX_SIZE) return NextResponse.json({ error: 'FILE_TOO_LARGE', message: 'Maks 10MB.' }, { status: 400 })
    if (![2, 4].includes(scale)) return NextResponse.json({ error: 'INVALID_SCALE' }, { status: 400 })

    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const b64    = await toBase64(buffer, imageFile.type)

    console.log('[tools/upscale] starting:', `${scale}x`, `${(imageFile.size/1024).toFixed(0)}KB`)

    // Start Replicate prediction
    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method:  'POST',
      headers: {
        'Authorization': `Token ${replicateKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL,
        input: {
          image:    b64,
          scale,
          face_enhance: false, // product mode, not portrait
        },
      }),
    })

    if (!startRes.ok) {
      const j = await startRes.json().catch(() => ({}))
      throw new Error(j.detail ?? `Replicate start error: ${startRes.status}`)
    }

    const prediction = await startRes.json()
    const predId     = prediction.id

    // Poll until done (max 55s)
    const pollUrl = `https://api.replicate.com/v1/predictions/${predId}`
    let output: string | null = null
    const deadline = Date.now() + 55_000

    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 2000))
      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': `Token ${replicateKey}` },
      })
      const pollData = await pollRes.json()

      if (pollData.status === 'succeeded') {
        output = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output
        break
      }
      if (pollData.status === 'failed' || pollData.status === 'canceled') {
        throw new Error(pollData.error ?? 'Upscale gagal di Replicate.')
      }
    }

    if (!output) throw new Error('Upscale timeout. Coba lagi dengan gambar lebih kecil.')

    // Fetch the output image and return as binary
    const imgRes = await fetch(output)
    if (!imgRes.ok) throw new Error('Gagal mengambil hasil upscale.')

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    const imgType   = imgRes.headers.get('content-type') ?? 'image/png'

    console.log('[tools/upscale] success:', `${scale}x`, `${(imgBuffer.length/1024).toFixed(0)}KB`)

    return new NextResponse(imgBuffer, {
      status: 200,
      headers: {
        'Content-Type':        imgType,
        'Content-Disposition': `attachment; filename="beesell-upscale-${scale}x-${Date.now()}.png"`,
        'X-Scale':             String(scale),
        'Cache-Control':       'no-store',
      },
    })

  } catch (err: any) {
    console.error('[POST /api/tools/upscale]', err?.message)
    return NextResponse.json({ error: 'INTERNAL', message: err?.message ?? 'Terjadi kesalahan.' }, { status: 500 })
  }
}