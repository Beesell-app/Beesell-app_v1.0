// app/api/tools/upscale/route.ts
// ── Quick Tools: AI Upscale ───────────────────────────────────
//
// Model: Real-ESRGAN via Replicate (nightmareai/real-esrgan)
//   - 2x: Foto jadi 2x resolusi asli
//   - 4x: Foto jadi 4x resolusi → 1080p foto jadi 4320p (4K)
//
// Use case:
//   - Foto produk kamera HP low-res → jadi HD/4K untuk marketplace
//   - Foto blur/kecil → ditajamkan + diperbesar
//   - Screenshot produk → diupscale untuk print/banner
//
// Cost: ~$0.002–0.005 per image (Replicate pay-per-second GPU)
// Env: REPLICATE_API_TOKEN (sudah ada di .env.local)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 120  // 4x bisa butuh sampai 2 menit untuk gambar besar

const MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB
const ALLOWED_TYPES  = new Set(['image/jpeg','image/jpg','image/png','image/webp'])

// ── Replicate model versions ──────────────────────────────────
// Real-ESRGAN: best untuk product photos (no face enhancement)
// Latest stable version per 2024
const MODELS = {
  'real-esrgan': 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
} as const

// ── Scale options & their expected output ─────────────────────
const SCALE_OPTIONS = {
  2: { label: '2× HD',  desc: '2x resolusi — cepat & bagus',   gpuSec: 5  },
  4: { label: '4× 4K',  desc: '4x resolusi — kualitas terbaik', gpuSec: 15 },
} as const

// ── Helpers ───────────────────────────────────────────────────
function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// Poll Replicate prediction until done or timeout
async function pollPrediction(
  predId:       string,
  apiKey:       string,
  timeoutMs:    number = 100_000,
  intervalMs:   number = 2_500,
): Promise<string> {
  const url      = `https://api.replicate.com/v1/predictions/${predId}`
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    await sleep(intervalMs)

    const res  = await fetch(url, {
      headers: { Authorization: `Token ${apiKey}` },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Replicate poll error ${res.status}: ${text}`)
    }

    const data = await res.json()

    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[0] : data.output
      if (!out) throw new Error('Replicate succeeded tapi output kosong.')
      return out as string
    }

    if (data.status === 'failed') {
      throw new Error(data.error ?? 'Replicate: proses gagal.')
    }

    if (data.status === 'canceled') {
      throw new Error('Replicate: proses dibatalkan.')
    }

    // status: 'starting' | 'processing' → continue polling
  }

  throw new Error('Timeout: upscale melebihi batas waktu. Coba gambar lebih kecil.')
}

// ── POST Handler ──────────────────────────────────────────────
export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    // ── 1. Auth ────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({
        error:   'Unauthorized',
        message: 'Silakan login terlebih dahulu.',
      }, { status: 401 })
    }

    // ── 2. Check Replicate API key ─────────────────────────────
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (!replicateKey || replicateKey.length < 10) {
      return NextResponse.json({
        error:   'CONFIG_ERROR',
        message: 'REPLICATE_API_TOKEN belum dikonfigurasi di .env.local',
      }, { status: 500 })
    }

    // ── 3. Parse FormData ──────────────────────────────────────
    let fd: FormData
    try { fd = await req.formData() }
    catch {
      return NextResponse.json({
        error: 'INVALID_FORM', message: 'Format request tidak valid.',
      }, { status: 400 })
    }

    const imageFile = fd.get('image') as File | null
    const scaleStr  = (fd.get('option') as string | null) ?? '4'
    const scale     = parseInt(scaleStr)

    // ── 4. Validate ────────────────────────────────────────────
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ error: 'NO_FILE', message: 'File gambar tidak ditemukan.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(imageFile.type)) {
      return NextResponse.json({
        error:   'INVALID_TYPE',
        message: `Format tidak didukung: ${imageFile.type}. Gunakan JPG, PNG, atau WebP.`,
      }, { status: 400 })
    }

    if (imageFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json({
        error:   'FILE_TOO_LARGE',
        message: `File terlalu besar (${(imageFile.size/1024/1024).toFixed(1)}MB). Maksimal 10MB.`,
      }, { status: 400 })
    }

    if (imageFile.size < 500) {
      return NextResponse.json({ error: 'FILE_TOO_SMALL', message: 'File terlalu kecil.' }, { status: 400 })
    }

    if (![2, 4].includes(scale)) {
      return NextResponse.json({
        error: 'INVALID_SCALE', message: 'Scale harus 2 atau 4.',
      }, { status: 400 })
    }

    // ── 5. Read buffer + estimate dimensions ───────────────────
    const inputBuffer  = Buffer.from(await imageFile.arrayBuffer())
    const inputSizeKB  = Math.round(inputBuffer.length / 1024)
    const dataUrl      = toDataUrl(inputBuffer, imageFile.type)

    console.log(`[upscale] START user:${user.id} scale:${scale}x size:${inputSizeKB}KB type:${imageFile.type}`)

    // ── 6. Create Replicate prediction ────────────────────────
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method:  'POST',
      headers: {
        Authorization:  `Token ${replicateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: MODELS['real-esrgan'],
        input: {
          image:        dataUrl,
          scale,
          face_enhance: false,  // false = product/object mode (lebih akurat untuk produk)
        },
      }),
    })

    if (!createRes.ok) {
      const errBody = await createRes.json().catch(() => ({}))
      const msg     = errBody.detail ?? errBody.error ?? `Replicate error ${createRes.status}`
      console.error('[upscale] create prediction failed:', msg)

      if (createRes.status === 401) {
        return NextResponse.json({
          error: 'INVALID_API_KEY',
          message: 'REPLICATE_API_TOKEN tidak valid. Cek di replicate.com/account/api-tokens',
        }, { status: 500 })
      }

      return NextResponse.json({ error: 'REPLICATE_ERROR', message: msg }, { status: 502 })
    }

    const prediction = await createRes.json()
    const predId     = prediction.id as string

    console.log(`[upscale] prediction created: ${predId}`)

    // ── 7. Poll until done ─────────────────────────────────────
    let outputUrl: string
    try {
      outputUrl = await pollPrediction(
        predId,
        replicateKey,
        110_000,   // 110s timeout
        scale === 4 ? 3000 : 2000,  // 4x lebih lama → poll lebih jarang
      )
    } catch (pollErr: any) {
      console.error('[upscale] poll failed:', pollErr.message)
      return NextResponse.json({
        error:   'UPSCALE_FAILED',
        message: pollErr.message ?? 'Upscale gagal. Coba dengan gambar lebih kecil.',
      }, { status: 500 })
    }

    // ── 8. Download result from Replicate CDN ──────────────────
    const dlRes = await fetch(outputUrl)
    if (!dlRes.ok) {
      throw new Error(`Gagal mengambil hasil dari Replicate: ${dlRes.status}`)
    }

    const outputBuffer = Buffer.from(await dlRes.arrayBuffer())
    const outputType   = dlRes.headers.get('content-type') ?? 'image/png'
    const outputSizeKB = Math.round(outputBuffer.length / 1024)
    const elapsedSec   = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`[upscale] SUCCESS ${scale}x | ${inputSizeKB}KB → ${outputSizeKB}KB | ${elapsedSec}s`)

    // ── 9. Return binary image ─────────────────────────────────
    // Return langsung sebagai binary — client buat Blob URL
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type':        outputType,
        'Content-Disposition': `attachment; filename="beesell-${scale}x-hd-${Date.now()}.png"`,
        'Cache-Control':       'no-store',
        // Metadata untuk client
        'X-Scale':             String(scale),
        'X-Input-Size-KB':     String(inputSizeKB),
        'X-Output-Size-KB':    String(outputSizeKB),
        'X-Process-Time-Sec':  elapsedSec,
      },
    })

  } catch (err: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.error(`[POST /api/tools/upscale] ${elapsed}s`, err?.message)
    return NextResponse.json({
      error:   'INTERNAL',
      message: err?.message ?? 'Terjadi kesalahan server.',
    }, { status: 500 })
  }
}