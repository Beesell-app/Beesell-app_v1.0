// apps/web-app/lib/ai/image/quality-tiers.ts
// ── Otoritas server untuk Quality preset (anti-bypass) + sinkron client ──
import { meetsTier, type Tier } from '@/components/dashboard/studio-menu-config'

export type ImageQualityId = 'standard' | 'high' | 'ultra'

export interface ImageQualityTier {
  id: ImageQualityId
  label: string; icon: string; desc: string
  minTier:  Tier                                   // gate tier (otoritas)
  provider: 'replicate' | 'flux' | 'stability' | 'openai'
  model:    string                                 // key model (worker map ke versi asli)
  dimScale: number                                 // pengali dimensi dari base ratio
  maxDim:   number                                 // clamp dimensi
  cost:     number                                 // biaya per gambar (unit kuota image)
  boost:    string                                 // tambahan prompt kualitas
}

// ⚠️ cost dalam UNIT yang sama dengan PLAN_IMAGE_LIMITS (image-credit), bukan rupiah.
export const IMAGE_QUALITY: Record<ImageQualityId, ImageQualityTier> = {
  standard: { id:'standard', label:'Standard', icon:'⚡', desc:'Cepat & hemat', minTier:'starter',
    provider:'replicate', model:'flux-schnell', dimScale:1,    maxDim:1024, cost:1,
    boost:'clean commercial product photography, sharp focus, good lighting' },
  high: { id:'high', label:'High', icon:'✨', desc:'Detail lebih tajam', minTier:'basic',
    provider:'replicate', model:'flux-dev', dimScale:1.25, maxDim:1536, cost:2,
    boost:'high detail commercial product photography, crisp sharp focus, studio lighting, 4k, photorealistic' },
  ultra: { id:'ultra', label:'Ultra HD', icon:'💎', desc:'Kualitas komersial', minTier:'pro',
    provider:'flux', model:'flux-pro', dimScale:1.5, maxDim:2048, cost:4,
    boost:'ultra high quality commercial advertising photography, hyper detailed, perfect studio lighting, 8k, photorealistic, award-winning' },
}

export const DEFAULT_QUALITY: ImageQualityId = 'standard'
export const QUALITY_POLICY: 'reject' | 'downgrade' = 'reject'   // ganti ke 'downgrade' bila mau auto-turun

export const isQualityId = (x: unknown): x is ImageQualityId =>
  x === 'standard' || x === 'high' || x === 'ultra'

export interface ResolvedQuality {
  requested: ImageQualityId
  effective: ImageQualityId
  tier: ImageQualityTier
  allowed: boolean   // requested boleh utk plan
  clamped: boolean   // di-downgrade
  requiredTier: Tier
}

/** OTORITAS anti-bypass — quality final ditentukan dari plan DB, bukan client. */
export function resolveQuality(plan: string, requested: unknown, isSuperuser = false): ResolvedQuality {
  const req = isQualityId(requested) ? requested : DEFAULT_QUALITY
  const reqTier = IMAGE_QUALITY[req]
  if (isSuperuser || meetsTier(plan, reqTier.minTier)) {
    return { requested:req, effective:req, tier:reqTier, allowed:true, clamped:false, requiredTier:reqTier.minTier }
  }
  const order: ImageQualityId[] = ['ultra','high','standard']
  const best = order.find(q => meetsTier(plan, IMAGE_QUALITY[q].minTier)) ?? 'standard'
  return { requested:req, effective:best, tier:IMAGE_QUALITY[best], allowed:false, clamped:true, requiredTier:reqTier.minTier }
}

// ── Style preset (sinkron dgn client) → dimensi prompt-builder + boost ──
export const IMAGE_STYLE_PRESETS: Record<string, {
  contentType?:string; visualStyle?:string; bgStyle?:string
  moodTone?:string; lightingStyle?:string; composition?:string; boost:string
}> = {
  'product-photo': { contentType:'product-ads',   visualStyle:'clean-studio',     bgStyle:'studio-white', lightingStyle:'studio', composition:'hero-shot',
    boost:'seamless clean white background, soft studio softbox lighting, crisp reflections' },
  'lifestyle':     { contentType:'instagram-feed', visualStyle:'realistic',         bgStyle:'outdoor', moodTone:'fresh', lightingStyle:'natural', composition:'lifestyle',
    boost:'premium lifestyle setting, natural window light, shallow depth of field, bokeh' },
  'banner':        { contentType:'promo-banner',   visualStyle:'bright-commercial', lightingStyle:'bright-commercial', composition:'hero-shot',
    boost:'bold vibrant promotional composition, dynamic marketing layout, high contrast' },
  'infographic':   { contentType:'marketplace',    visualStyle:'minimalist',        bgStyle:'minimal-clean', composition:'flat-lay',
    boost:'clean organized layout, balanced composition, visual hierarchy' },
  'social-media':  { contentType:'instagram-feed', visualStyle:'bright-commercial', moodTone:'energetic', composition:'hero-shot',
    boost:'scroll-stopping social media composition, trendy aesthetic, vibrant natural color grade' },
  'thumbnail':     { contentType:'cinematic-shot', visualStyle:'viral-tiktok',      lightingStyle:'high-contrast', composition:'close-up',
    boost:'bold high-impact thumbnail composition, strong contrast and saturation' },
}

export interface StyleInput {
  contentType?:   string
  visualStyle?:   string
  bgStyle?:       string
  moodTone?:      string
  lightingStyle?: string
  composition?:   string
  boost?:         string
}

export function StyleInput(styleId?: string): StyleInput {
  return (styleId && IMAGE_STYLE_PRESETS[styleId]) || {}
}

/** Skala dimensi sesuai quality, clamp ke maxDim, bulatkan kelipatan 8. */
export function scaleDimsForQuality(dims: { width:number; height:number }, q: ImageQualityTier) {
  const round8 = (n:number) => Math.max(512, Math.round(n / 8) * 8)
  const cap    = (n:number) => Math.min(n, q.maxDim)
  return { width: round8(cap(dims.width * q.dimScale)), height: round8(cap(dims.height * q.dimScale)) }
}