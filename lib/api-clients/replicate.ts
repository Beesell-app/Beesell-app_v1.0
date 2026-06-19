// lib/api-clients/replicate.ts
// ══════════════════════════════════════════════════════════════
// Replicate Client — Stack v3 Optimized
// ══════════════════════════════════════════════════════════════
//
// Models yang dipakai (final v3):
//   - bria-rmbg-2.0:        Background removal
//   - sdxl-lightning-4step: Packshot, Enhancer, Relight (4-step = 7.5x faster)
//   - flux-dev-inpainting:  Remove Object (lebih bagus dari SDXL inpaint)
//   - real-esrgan-4x:       Upscale 4x
//   - idm-vton:             Virtual Try-On
//   - sdxl-pose-controlnet: Product to Model (Lightning + ControlNet)
//
// Pattern: dynamic version fetcher dengan caching + fallback
// ══════════════════════════════════════════════════════════════

import Replicate from 'replicate'

if (!process.env.REPLICATE_API_TOKEN) {
  console.warn('⚠️  REPLICATE_API_TOKEN tidak di-set')
}

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN ?? '',
})

// ══════════════════════════════════════════════════════════════
// MODEL REGISTRY (slugs only — version fetched dynamically)
// ══════════════════════════════════════════════════════════════
export const REPLICATE_MODELS = {
  'bria-rmbg':         'bria/remove-background',
  'sdxl-lightning':    'bytedance/sdxl-lightning-4step',
  'flux-inpainting':   'zsxkib/flux-dev-inpainting',
  'real-esrgan':       'nightmareai/real-esrgan',
  'idm-vton':          'cuuupid/idm-vton',
  'sdxl-controlnet':   'lucataco/sdxl-controlnet',
} as const

export type ReplicateModelKey = keyof typeof REPLICATE_MODELS

// ── In-memory cache untuk model versions (refresh per module reload) ──
const versionCache = new Map<string, { version: string; cached_at: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000  // 24 jam

// ── Get latest version dengan caching ─────────────────────────
export async function getModelVersion(modelKey: ReplicateModelKey): Promise<string> {
  const slug = REPLICATE_MODELS[modelKey]
  
  const cached = versionCache.get(slug)
  if (cached && Date.now() - cached.cached_at < CACHE_TTL) {
    return cached.version
  }

  try {
    const [owner, name] = slug.split('/')
    const model = await replicate.models.get(owner, name)
    const version = model.latest_version?.id
    
    if (!version) {
      throw new Error(`No latest version for ${slug}`)
    }

    versionCache.set(slug, { version, cached_at: Date.now() })
    return version
  } catch (err) {
    // Kalau fail, return cached value kalau ada
    if (cached) {
      console.warn(`[replicate] Failed to fetch version for ${slug}, using cached`)
      return cached.version
    }
    throw err
  }
}

// ── Invalidate cache (call kalau dapat 422 error) ─────────────
export function invalidateVersionCache(modelKey?: ReplicateModelKey) {
  if (modelKey) {
    versionCache.delete(REPLICATE_MODELS[modelKey])
  } else {
    versionCache.clear()
  }
}

// ══════════════════════════════════════════════════════════════
// RUN MODEL with auto-retry on version mismatch
// ══════════════════════════════════════════════════════════════
export async function runReplicate<T = any>(
  modelKey: ReplicateModelKey,
  input: Record<string, any>,
  options?: { 
    webhook?: string
    webhook_events_filter?: string[]
  }
): Promise<T> {
  const tryRun = async (): Promise<T> => {
    const version = await getModelVersion(modelKey)
    const slug = `${REPLICATE_MODELS[modelKey]}:${version}` as `${string}/${string}:${string}`

    const output = await replicate.run(slug, {
      input,
      webhook: options?.webhook,
      webhook_events_filter: options?.webhook_events_filter,
    })
    return output as T
  }

  try {
    return await tryRun()
  } catch (err: any) {
    // 422 = version mismatch → invalidate dan retry sekali
    if (err.response?.status === 422 || err.message?.includes('version')) {
      console.warn(`[replicate] Version error, invalidating cache for ${modelKey}`)
      invalidateVersionCache(modelKey)
      return await tryRun()
    }
    throw err
  }
}

// ══════════════════════════════════════════════════════════════
// SDXL LIGHTNING INPUTS (4-step optimized)
// ══════════════════════════════════════════════════════════════
export interface SDXLLightningInput {
  prompt:           string
  negative_prompt?: string
  image?:           string         // for img2img
  width?:           number
  height?:          number
  num_inference_steps?: number    // 4-step is sweet spot for Lightning
  guidance_scale?:  number
  strength?:        number         // for img2img (0.0-1.0)
}

export function buildSDXLLightningInput(opts: SDXLLightningInput) {
  return {
    prompt: opts.prompt,
    negative_prompt: opts.negative_prompt ?? 'low quality, blurry, distorted, ugly',
    image:  opts.image,
    width:  opts.width  ?? 1024,
    height: opts.height ?? 1024,
    num_inference_steps: opts.num_inference_steps ?? 4,  // Lightning sweet spot
    guidance_scale: opts.guidance_scale ?? 0,            // Lightning needs 0
    strength: opts.strength ?? 0.6,
  }
}