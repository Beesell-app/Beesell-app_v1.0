// apps/web-app/lib/replicate.ts
// Replicate SDK wrapper untuk SDXL image generation
// Async pattern: prediction.create + webhook (bukan replicate.run yang blocking)
import Replicate from 'replicate'

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN

if (!REPLICATE_TOKEN) {
  console.warn('[replicate] REPLICATE_API_TOKEN not set — image generation akan gagal')
}

export const replicate = new Replicate({
  auth: REPLICATE_TOKEN ?? '',
})

// ── Model versions ──────────────────────────────────────────
// SDXL: kualitas tinggi, ~20-30 detik
// SDXL-Lightning: 4-step, ~5-8 detik (untuk free tier hemat cost)
export const MODELS = {
  sdxl: {
    id:      'stability-ai/sdxl',
    version: '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
    cost_usd: 0.0035,   // ~Rp 55 per generate (50 steps, 1024x1024)
  },
  sdxlLightning: {
    id:      'bytedance/sdxl-lightning-4step',
    version: '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637',
    cost_usd: 0.0011,   // ~Rp 17 per generate, 4 steps only
  },
} as const

// ── Style presets — Indonesia seller use cases ──────────────
// Tiap preset = combination prompt suffix + parameter optimal
export type ImageStyle =
  | 'product_studio'    // foto produk dengan background bersih
  | 'lifestyle'         // produk in-context (orang pakai)
  | 'flat_lay'          // top-down arrangement
  | 'aesthetic'         // moody, premium feel
  | 'minimalist'        // clean, lots of white space

export const STYLE_PRESETS: Record<ImageStyle, {
  promptSuffix: string
  negativePrompt: string
  width:    number
  height:   number
}> = {
  product_studio: {
    promptSuffix:   'professional product photography, studio lighting, clean white background, high detail, commercial quality',
    negativePrompt: 'blurry, low quality, watermark, text, logo, distorted, ugly, amateur, dark',
    width:  1024, height: 1024,
  },
  lifestyle: {
    promptSuffix:   'lifestyle photography, natural lighting, candid scene, real environment, professional photo, instagram aesthetic',
    negativePrompt: 'studio, plain background, fake, posed, blurry, low quality, watermark, text',
    width:  1024, height: 1024,
  },
  flat_lay: {
    promptSuffix:   'flat lay photography, top-down view, organized arrangement, neutral background, soft natural light, instagram style',
    negativePrompt: 'side angle, perspective, blurry, dark, low quality, watermark',
    width:  1024, height: 1024,
  },
  aesthetic: {
    promptSuffix:   'aesthetic photography, moody lighting, premium feel, dramatic composition, magazine quality, high contrast',
    negativePrompt: 'plain, boring, low quality, watermark, ugly, amateur',
    width:  1024, height: 1024,
  },
  minimalist: {
    promptSuffix:   'minimalist photography, simple composition, lots of negative space, soft pastel colors, modern, clean lines',
    negativePrompt: 'busy, cluttered, dark, blurry, low quality, watermark',
    width:  1024, height: 1024,
  },
}

// ── Build prompt dari product info + style ──────────────────
export function buildImagePrompt(params: {
  productName:     string
  productBenefits?: string
  style:           ImageStyle
  customPrompt?:   string
}): { prompt: string; negativePrompt: string; width: number; height: number } {
  const preset = STYLE_PRESETS[params.style]

  // Custom prompt override (pro user)
  if (params.customPrompt) {
    return {
      prompt:         params.customPrompt + ', ' + preset.promptSuffix,
      negativePrompt: preset.negativePrompt,
      width:          preset.width,
      height:         preset.height,
    }
  }

  const parts = [
    params.productName,
    params.productBenefits,
    preset.promptSuffix,
  ].filter(Boolean)

  return {
    prompt:         parts.join(', '),
    negativePrompt: preset.negativePrompt,
    width:          preset.width,
    height:         preset.height,
  }
}

// ── Create async prediction with webhook ────────────────────
// Returns immediately — actual generation 20-60s di background
// Replicate POST ke webhook URL saat selesai
export async function createImagePrediction(params: {
  prompt:         string
  negativePrompt: string
  width:          number
  height:         number
  webhookUrl:     string
  webhookId:      string   // untuk verify request authentic
  useTurbo?:      boolean  // free tier pakai Lightning
}): Promise<{ predictionId: string; estimatedTime: number }> {
  const model = params.useTurbo ? MODELS.sdxlLightning : MODELS.sdxl

  const prediction = await replicate.predictions.create({
    version: model.version,
    input: {
      prompt:              params.prompt,
      negative_prompt:     params.negativePrompt,
      width:               params.width,
      height:              params.height,
      num_inference_steps: params.useTurbo ? 4 : 30,
      scheduler:           params.useTurbo ? 'K_EULER' : 'DPMSolverMultistep',
      guidance_scale:      params.useTurbo ? 0 : 7.5,
      num_outputs:         1,
    },
    webhook:        `${params.webhookUrl}?webhookId=${params.webhookId}`,
    webhook_events_filter: ['completed'],   // hanya callback saat done (success/failed)
  })

  return {
    predictionId:  prediction.id,
    estimatedTime: params.useTurbo ? 8 : 30,
  }
}

// ── Get prediction status (untuk polling fallback kalau webhook gagal) ──
export async function getPrediction(predictionId: string) {
  return replicate.predictions.get(predictionId)
}

// ── Cancel running prediction (free user yang ganti pikiran) ──
export async function cancelPrediction(predictionId: string) {
  return replicate.predictions.cancel(predictionId)
}

// ── Calculate cost based on model ──────────────────────────
export function calculateImageCost(useTurbo: boolean, count: number = 1): number {
  return (useTurbo ? MODELS.sdxlLightning.cost_usd : MODELS.sdxl.cost_usd) * count
}