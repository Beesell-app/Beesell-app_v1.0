// app/api/studio/product-to-model/route.ts
// ── Product to Model AI API ───────────────────────────────────
// Flow: Upload product image → select model preset → AI places model wearing product
//
// Strategy per Fashn.ai guidance:
//   1. Prompt focuses on model description + pose + background
//   2. Do NOT describe the product — AI reads from uploaded image
//   3. Use customPrompt ONLY for product interaction details
//
// Model: Replicate SDXL img2img
//   - High prompt_strength (0.75) = model changes significantly while keeping product
//   - Lower prompt_strength would keep more of original image
//
// Pipeline:
//   1. Receive product image
//   2. Build Fashn.ai-style prompt from presets
//   3. Send to Replicate SDXL for generation
//   4. Return binary PNG result

import { NextResponse }   from 'next/server'
import { createClient }   from '@/lib/supabase/server'
import {
  MODEL_PRESET_MAP, POSE_MAP, BG_MAP,
  buildProductToModelPrompt, buildNegativePrompt,
} from '@/lib/studio/model-presets'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const MAX_BYTES  = 15 * 1024 * 1024
const ALLOWED    = new Set(['image/jpeg','image/jpg','image/png','image/webp'])

// Replicate SDXL — best for fashion/model generation
const SDXL_MODEL = 'stability-ai/sdxl:39ed52f2319f9b0cf0680e9e61d616f9dbf7c7c9ca1f1cf4ff14e50d8e78ae17'

// Lighting options
const LIGHTING_MAP: Record<string,string> = {
  'studio-soft':   'soft even studio lighting, professional photography lighting setup',
  'natural-window':'soft natural window light, diffused daylight from the side',
  'outdoor-bright':'bright natural outdoor sunlight, clear day',
  'dramatic-rim':  'dramatic rim lighting, high contrast, fashion editorial lighting',
  'warm-golden':   'warm golden hour light, warm tones, atmospheric',
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function pollReplicate(predId: string, apiKey: string, timeout = 110_000): Promise<string> {
  const url = `https://api.replicate.com/v1/predictions/${predId}`
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    await sleep(3000)
    const res  = await fetch(url, { headers: { Authorization: `Token ${apiKey}` } })
    const data = await res.json()

    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[0] : data.output
      if (!out) throw new Error('Output kosong dari AI')
      return out as string
    }
    if (data.status === 'failed')   throw new Error(data.error ?? 'Generate gagal')
    if (data.status === 'canceled') throw new Error('Proses dibatalkan')
  }
  throw new Error('Timeout — coba lagi dengan gambar lebih kecil')
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    // ── Auth ────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Silakan login.' }, { status: 401 })
    }

    // ── Check env ────────────────────────────────────────────────
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (!replicateKey) {
      return NextResponse.json({ error: 'CONFIG', message: 'REPLICATE_API_TOKEN belum dikonfigurasi.' }, { status: 500 })
    }

    // ── Parse FormData ────────────────────────────────────────────
    let fd: FormData
    try { fd = await req.formData() }
    catch { return NextResponse.json({ error: 'INVALID_FORM' }, { status: 400 }) }

    const imageFile    = fd.get('image')        as File | null
    const modelId      = fd.get('modelPreset')  as string ?? 'wanita-asia-muda'
    const poseId       = fd.get('pose')         as string ?? 'full-body-relaxed'
    const bgId         = fd.get('background')   as string ?? 'white-studio'
    const lightingId   = fd.get('lighting')     as string ?? 'studio-soft'
    const customPrompt = fd.get('customPrompt') as string ?? ''
    // strength: how much to transform (0.6 = keep product, 0.85 = more creative freedom)
    const strengthRaw  = parseFloat(fd.get('strength') as string ?? '0.72')
    const strength     = Math.max(0.55, Math.min(0.9, strengthRaw))

    // ── Validate ──────────────────────────────────────────────────
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ error: 'NO_FILE', message: 'Upload foto produk terlebih dahulu.' }, { status: 400 })
    }
    if (!ALLOWED.has(imageFile.type)) {
      return NextResponse.json({ error: 'INVALID_TYPE', message: `Format tidak didukung: ${imageFile.type}` }, { status: 400 })
    }
    if (imageFile.size > MAX_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE', message: 'Maks 15MB.' }, { status: 400 })
    }

    const modelPreset = MODEL_PRESET_MAP[modelId]
    const posePreset  = POSE_MAP[poseId]
    const bgPreset    = BG_MAP[bgId]

    if (!modelPreset) return NextResponse.json({ error: 'INVALID_MODEL', message: `Model tidak dikenal: ${modelId}` }, { status: 400 })
    if (!posePreset)  return NextResponse.json({ error: 'INVALID_POSE',  message: `Pose tidak dikenal: ${poseId}` }, { status: 400 })
    if (!bgPreset)    return NextResponse.json({ error: 'INVALID_BG',    message: `Background tidak dikenal: ${bgId}` }, { status: 400 })

    console.log(`[product-to-model] START user:${user.id} model:${modelId} pose:${poseId} bg:${bgId} strength:${strength}`)

    // ── Build prompt ──────────────────────────────────────────────
    const lighting    = LIGHTING_MAP[lightingId] ?? LIGHTING_MAP['studio-soft']
    const finalPrompt = buildProductToModelPrompt({
      model:       modelPreset,
      pose:        posePreset,
      background:  bgPreset,
      customPrompt,
      lighting,
    })
    const negPrompt = buildNegativePrompt()

    console.log(`[product-to-model] prompt (${finalPrompt.length} chars): ${finalPrompt.slice(0,150)}...`)

    // ── Convert image to base64 ───────────────────────────────────
    const inputBuffer = Buffer.from(await imageFile.arrayBuffer())
    const imageB64    = `data:${imageFile.type};base64,${inputBuffer.toString('base64')}`

    // ── Create Replicate prediction ───────────────────────────────
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
            image:               imageB64,
            prompt:              finalPrompt,
            negative_prompt:     negPrompt,
            prompt_strength:     strength,    // key param: how much to change the image
            num_inference_steps: 35,          // more steps = better quality
            guidance_scale:      8.0,         // higher = more prompt adherence
            width:               832,         // portrait optimized
            height:              1216,        // 2:3 ratio for fashion
            refine:              'expert_ensemble_refiner',
            high_noise_frac:     0.8,
            num_outputs:         1,
          },
        }),
      })
    } catch (e: any) {
      throw new Error(`Koneksi ke AI server gagal: ${e.message}`)
    }

    if (!startRes.ok) {
      const j = await startRes.json().catch(() => ({}))
      const msg = j.detail ?? j.error ?? `Replicate error ${startRes.status}`
      if (startRes.status === 401) throw new Error('REPLICATE_API_TOKEN tidak valid. Cek di replicate.com')
      throw new Error(msg)
    }

    const prediction = await startRes.json()
    console.log(`[product-to-model] prediction: ${prediction.id}`)

    // ── Poll ──────────────────────────────────────────────────────
    const outputUrl = await pollReplicate(prediction.id, replicateKey, 110_000)

    // ── Download result ───────────────────────────────────────────
    const dlRes = await fetch(outputUrl)
    if (!dlRes.ok) throw new Error(`Download hasil AI gagal: ${dlRes.status}`)

    const resultBuf  = Buffer.from(await dlRes.arrayBuffer())
    const resultType = dlRes.headers.get('content-type') ?? 'image/png'
    const elapsed    = ((Date.now() - t0) / 1000).toFixed(1)

    console.log(`[product-to-model] SUCCESS ${modelId} | ${Math.round(resultBuf.length/1024)}KB | ${elapsed}s`)

    return new NextResponse(resultBuf, {
      status: 200,
      headers: {
        'Content-Type':        resultType,
        'Content-Disposition': `attachment; filename="beesell-model-${modelId}-${Date.now()}.png"`,
        'Cache-Control':       'no-store',
        'X-Model-Id':          modelId,
        'X-Model-Label':       modelPreset.label,
        'X-Process-Time-Sec':  elapsed,
      },
    })

  } catch (err: any) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    console.error(`[POST /api/studio/product-to-model] ${elapsed}s`, err?.message)
    return NextResponse.json({
      error:   'GENERATE_FAILED',
      message: err?.message ?? 'Generate gagal. Coba lagi atau ganti preset model.',
    }, { status: 500 })
  }
}