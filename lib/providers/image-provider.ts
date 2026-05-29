// apps/web-app/lib/providers/image-provider.ts
// ── AI Image Provider Abstraction Layer ───────────────────────
// Supports: Replicate (SDXL) | OpenAI (DALL-E 3) | Stability AI
// Switch provider via NEXT_PUBLIC_IMAGE_PROVIDER env var
// Future-ready: Leonardo AI, Midjourney

export type ImageProvider = 'replicate' | 'openai' | 'stability' | 'flux'

export interface GenerateImageParams {
  prompt:         string
  negativePrompt: string
  width:          number
  height:         number
  webhookUrl?:    string  // Replicate async webhook
  refImageUrl?:   string  // img2img source
  steps?:         number  // inference steps
  guidanceScale?: number  // CFG scale
}

export interface GenerateImageResult {
  predictionId?: string  // Replicate prediction ID (async)
  imageUrl?:     string  // Direct URL (sync providers)
  status:        'queued' | 'processing' | 'succeeded' | 'failed'
  error?:        string
  estimatedMs?:  number
}

// ── Replicate SDXL (default, async) ──────────────────────────
async function generateWithReplicate(p: GenerateImageParams): Promise<GenerateImageResult> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN not set')

  const body = {
    version: process.env.REPLICATE_MODEL_VERSION
              ?? 'da77bc59ee60423279fd632efb4795ab731d9e3ca9705d977d3f9b4e44f1f7ef',
    input: {
      prompt:          p.prompt,
      negative_prompt: p.negativePrompt,
      width:           p.width,
      height:          p.height,
      num_outputs:     1,
      num_inference_steps: p.steps ?? 30,
      guidance_scale:  p.guidanceScale ?? 7.5,
      scheduler:       'DPM++2MSDE',
      ...(p.refImageUrl ? {
        image:          p.refImageUrl,
        strength:       0.75,
        prompt_strength:0.8,
      } : {}),
    },
    ...(p.webhookUrl ? {
      webhook:               p.webhookUrl,
      webhook_events_filter: ['completed'],
    } : {}),
  }

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method:  'POST',
    headers: { Authorization:`Token ${token}`, 'Content-Type':'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? `Replicate API error ${res.status}`)
  }

  const data = await res.json()
  return {
    predictionId: data.id,
    status:       'queued',
    estimatedMs:  30_000,
  }
}

// ── OpenAI DALL-E 3 (sync, premium quality) ──────────────────
async function generateWithOpenAI(p: GenerateImageParams): Promise<GenerateImageResult> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY not set')

  // DALL-E 3 supported sizes
  const size = p.width === p.height ? '1024x1024'
    : p.height > p.width ? '1024x1792'
    : '1792x1024'

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method:  'POST',
    headers: { Authorization:`Bearer ${key}`, 'Content-Type':'application/json' },
    body:    JSON.stringify({
      model:   'dall-e-3',
      prompt:  p.prompt.slice(0, 4000),  // DALL-E 3 limit
      n:       1,
      size,
      quality: 'hd',
      style:   'vivid',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`)
  }

  const data = await res.json()
  return {
    imageUrl: data.data?.[0]?.url,
    status:   'succeeded',
    estimatedMs: 0,
  }
}

// ── Stability AI SDXL (sync) ──────────────────────────────────
async function generateWithStability(p: GenerateImageParams): Promise<GenerateImageResult> {
  const key = process.env.STABILITY_API_KEY
  if (!key) throw new Error('STABILITY_API_KEY not set')

  const formData = new FormData()
  formData.append('text_prompts[0][text]', p.prompt)
  formData.append('text_prompts[0][weight]', '1')
  formData.append('text_prompts[1][text]', p.negativePrompt)
  formData.append('text_prompts[1][weight]', '-1')
  formData.append('width',  String(p.width))
  formData.append('height', String(p.height))
  formData.append('samples', '1')
  formData.append('steps',   String(p.steps ?? 30))
  formData.append('cfg_scale', String(p.guidanceScale ?? 7.5))

  const res = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method:  'POST',
    headers: { Authorization:`Bearer ${key}`, Accept:'application/json' },
    body:    formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message ?? `Stability error ${res.status}`)
  }

  const data = await res.json()
  const base64 = data.artifacts?.[0]?.base64
  if (!base64) throw new Error('Stability: no image in response')

  // Return as data URL (caller must upload to storage)
  return {
    imageUrl: `data:image/png;base64,${base64}`,
    status:   'succeeded',
    estimatedMs: 0,
  }
}

// ── Flux (via Replicate) ──────────────────────────────────────
async function generateWithFlux(p: GenerateImageParams): Promise<GenerateImageResult> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN not set')

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method:  'POST',
    headers: { Authorization:`Token ${token}`, 'Content-Type':'application/json' },
    body:    JSON.stringify({
      version: 'black-forest-labs/flux-schnell',
      input: {
        prompt:          p.prompt,
        width:           p.width,
        height:          p.height,
        num_outputs:     1,
        num_inference_steps: p.steps ?? 4,
        go_fast:         true,
      },
      ...(p.webhookUrl ? { webhook:p.webhookUrl, webhook_events_filter:['completed'] } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? `Flux error ${res.status}`)
  }

  const data = await res.json()
  return { predictionId:data.id, status:'queued', estimatedMs:10_000 }
}

// ── Check Replicate prediction status ─────────────────────────
export async function checkReplicatePrediction(predictionId: string): Promise<{
  status: 'starting'|'processing'|'succeeded'|'failed'|'canceled'
  imageUrls?: string[]
  error?: string
}> {
  const token = process.env.REPLICATE_API_TOKEN!
  const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: { Authorization:`Token ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error(`Replicate status check failed: ${res.status}`)
  const data = await res.json()
  return {
    status:    data.status,
    imageUrls: data.output ? (Array.isArray(data.output) ? data.output : [data.output]) : undefined,
    error:     data.error,
  }
}

// ── Upscale (Real-ESRGAN via Replicate) ───────────────────────
export async function upscaleImage(imageUrl: string, scale: 2|4 = 4): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN!

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method:  'POST',
    headers: { Authorization:`Token ${token}`, 'Content-Type':'application/json' },
    body:    JSON.stringify({
      version: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
      input:   { image:imageUrl, scale, face_enhance:false },
    }),
  })

  if (!res.ok) throw new Error('Upscale dispatch failed')
  const pred = await res.json()

  // Poll until done (upscale is fast, ~5s)
  let attempts = 0
  while (attempts < 20) {
    await new Promise(r => setTimeout(r, 3000))
    const check = await checkReplicatePrediction(pred.id)
    if (check.status === 'succeeded' && check.imageUrls?.[0]) {
      return check.imageUrls[0]
    }
    if (check.status === 'failed') throw new Error('Upscale failed: ' + check.error)
    attempts++
  }
  throw new Error('Upscale timeout')
}

// ── Main dispatch function ─────────────────────────────────────
export async function dispatchImageGeneration(
  params:   GenerateImageParams,
  provider: ImageProvider = 'replicate',
): Promise<GenerateImageResult> {
  switch (provider) {
    case 'openai':     return generateWithOpenAI(params)
    case 'stability':  return generateWithStability(params)
    case 'flux':       return generateWithFlux(params)
    case 'replicate':
    default:           return generateWithReplicate(params)
  }
}

// ── Cost per provider per image ────────────────────────────────
export const PROVIDER_COST: Record<ImageProvider, number> = {
  replicate:  0.0023,  // SDXL per image ~$0.0023
  openai:     0.08,    // DALL-E 3 HD per image
  stability:  0.002,   // Stability SDXL
  flux:       0.003,   // Flux Schnell
}