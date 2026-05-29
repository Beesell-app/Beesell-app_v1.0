// app/api/studio/packshot/route.ts
// ── AI Packshot Generator API ─────────────────────────────────
//
// Flow:
//   1. Receive product image upload
//   2. Remove background via Remove.bg
//   3. Send to Replicate (SDXL Inpainting / img2img)
//      — composite product onto AI-generated background scene
//   4. Return result as binary PNG
//
// Models used:
//   - Remove.bg: background removal (REMOVE_BG_API_KEY)
//   - Replicate SDXL: scene generation (REPLICATE_API_TOKEN)
//     Model: stability-ai/sdxl:39ed52f2319f9b0...
//     OR: lucataco/remove-bg + sdxl for best quality
//
// Fallback: if Replicate fails → return remove-bg only result

import { NextResponse }     from 'next/server'
import { createClient }     from '@/lib/supabase/server'
import { removeBackground } from '@/lib/remove-bg'
import { PRESET_MAP, BASE_NEGATIVE } from '@/lib/studio/packshot-presets'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const ALLOWED   = new Set(['image/jpeg','image/jpg','image/png','image/webp'])
const MAX_BYTES = 10 * 1024 * 1024  // 10MB

// Replicate SDXL model (stable, well-tested for product photography)
const SDXL_MODEL = 'stability-ai/sdxl:39ed52f2319f9b0cf0680e9e61d616f9dbf7c7c9ca1f1cf4ff14e50d8e78ae17'

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function pollReplicate(predId: string, apiKey: string, timeoutMs = 100_000): Promise<string> {
  const url      = `https://api.replicate.com/v1/predictions/${predId}`
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    await sleep(3000)
    const res  = await fetch(url, { headers: { Authorization: `Token ${apiKey}` } })
    const data = await res.json()

    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[0] : data.output
      if (!out) throw new Error('Replicate output kosong')
      return out as string
    }
    if (data.status === 'failed')   throw new Error(data.error ?? 'Replicate generate gagal')
    if (data.status === 'canceled') throw new Error('Replicate dibatalkan')
  }
  throw new Error('Timeout: AI terlalu lama. Coba lagi.')
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    // ── 1. Auth ────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Silakan login.' }, { status: 401 })
    }

    // ── 2. Parse form ──────────────────────────────────────────
    let fd: FormData
    try { fd = await req.formData() }
    catch { return NextResponse.json({ error: 'INVALID_FORM' }, { status: 400 }) }

    const imageFile    = fd.get('image')    as File | null
    const presetId     = fd.get('preset')   as string | null ?? 'white-studio'
    const customPrompt = fd.get('customPrompt') as string | null // optional override

    // ── 3. Validate ────────────────────────────────────────────
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ error: 'NO_FILE', message: 'File gambar tidak ditemukan.' }, { status: 400 })
    }
    if (!ALLOWED.has(imageFile.type)) {
      return NextResponse.json({ error: 'INVALID_TYPE', message: `Format tidak didukung: ${imageFile.type}` }, { status: 400 })
    }
    if (imageFile.size > MAX_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE', message: 'Maks 10MB.' }, { status: 400 })
    }

    const preset = PRESET_MAP[presetId]
    if (!preset) {
      return NextResponse.json({ error: 'INVALID_PRESET', message: `Preset tidak dikenal: ${presetId}` }, { status: 400 })
    }

    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (!replicateKey) {
      return NextResponse.json({ error: 'CONFIG', message: 'REPLICATE_API_TOKEN belum dikonfigurasi.' }, { status: 500 })
    }

    console.log(`[packshot] START user:${user.id} preset:${presetId} size:${Math.round(imageFile.size/1024)}KB`)

    // ── 4. Read buffer ─────────────────────────────────────────
    const inputBuffer = Buffer.from(await imageFile.arrayBuffer())

    // ── 5. Remove background first ────────────────────────────
    // This gives us clean product PNG with transparency
    let productPNG: Buffer
    try {
      const bgResult = await removeBackground(inputBuffer, {
        size:   'auto',
        type:   'product',
        format: 'png',
      })
      productPNG = bgResult.buffer
      console.log(`[packshot] bg removed: ${Math.round(productPNG.length/1024)}KB`)
    } catch (e: any) {
      console.error('[packshot] bg removal failed:', e.message)
      // If bg removal fails, use original — AI will still work but less cleanly
      productPNG = inputBuffer
    }

    // ── 6. Build AI prompt ─────────────────────────────────────
    const finalPrompt = customPrompt
      ? `${customPrompt}, professional product photography, high quality, sharp focus`
      : preset.prompt

    const negPrompt = `${BASE_NEGATIVE}, ${preset.negativePrompt ?? ''}`

    // Convert product PNG to base64 data URL for Replicate
    const productB64 = `data:image/png;base64,${productPNG.toString('base64')}`

    // ── 7. Generate background scene via Replicate SDXL ───────
    // Strategy: img2img with high denoising to place product in scene
    let startRes
    try {
      startRes = await fetch('https://api.replicate.com/v1/predictions', {
        method:  'POST',
        headers: {
          Authorization:  `Token ${replicateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: SDXL_MODEL,
          input: {
            image:             productB64,
            prompt:            finalPrompt,
            negative_prompt:   negPrompt,
            prompt_strength:   0.8,        // how much to transform (0=keep original, 1=ignore original)
            num_inference_steps: 30,
            guidance_scale:    7.5,
            width:             1024,
            height:            1024,
            refine:            'expert_ensemble_refiner',
            high_noise_frac:   0.8,
            num_outputs:       1,
          },
        }),
      })
    } catch (e: any) {
      throw new Error(`Koneksi ke AI server gagal: ${e.message}`)
    }

    if (!startRes.ok) {
      const j = await startRes.json().catch(() => ({}))
      const msg = j.detail ?? j.error ?? `Replicate error ${startRes.status}`
      if (startRes.status === 401) throw new Error('REPLICATE_API_TOKEN tidak valid')
      throw new Error(msg)
    }

    const prediction = await startRes.json()
    console.log(`[packshot] prediction started: ${prediction.id}`)

    // ── 8. Poll until done ─────────────────────────────────────
    const outputUrl = await pollReplicate(prediction.id, replicateKey, 110_000)
    console.log(`[packshot] generation done: ${outputUrl}`)

    // ── 9. Download result ─────────────────────────────────────
    const dlRes = await fetch(outputUrl)
    if (!dlRes.ok) throw new Error(`Download hasil gagal: ${dlRes.status}`)

    const resultBuffer = Buffer.from(await dlRes.arrayBuffer())
    const resultType   = dlRes.headers.get('content-type') ?? 'image/png'
    const elapsed      = ((Date.now() - t0) / 1000).toFixed(1)

    console.log(`[packshot] SUCCESS ${presetId} | ${Math.round(resultBuffer.length/1024)}KB | ${elapsed}s`)

    // ── 10. Return binary ──────────────────────────────────────
    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        'Content-Type':           resultType,
        'Content-Disposition':    `attachment; filename="beesell-packshot-${presetId}-${Date.now()}.png"`,
        'Cache-Control':          'no-store',
        'X-Preset-Id':            presetId,
        'X-Preset-Label':         preset.label,
        'X-Process-Time-Sec':     elapsed,
        'X-Model':                'sdxl+remove-bg',
      },
    })

  } catch (err: any) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    console.error(`[POST /api/studio/packshot] ${elapsed}s`, err?.message)
    return NextResponse.json({
      error:   'GENERATE_FAILED',
      message: err?.message ?? 'Generate gagal. Coba preset lain atau upload ulang foto.',
    }, { status: 500 })
  }
}