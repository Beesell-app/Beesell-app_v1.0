// lib/studio/ugc/types.ts
// ══════════════════════════════════════════════════════════════
// UGC VIDEO GENERATOR — TypeScript Types
// ══════════════════════════════════════════════════════════════

// ── Step flow ─────────────────────────────────────────────────
export type UgcStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

// ── Content types ─────────────────────────────────────────────
export type ContentTypeId =
  | 'ugc-review'
  | 'ugc-testimonial'
  | 'ugc-problem-solution'
  | 'ugc-unboxing'
  | 'ugc-demonstration'
  | 'ugc-showcase'
  | 'ugc-before-after'
  | 'ugc-affiliate'
  | 'ugc-tiktok-shop'
  | 'ugc-shopee-video'
  | 'ugc-facebook-ads'
  | 'ugc-instagram-reels'

export interface ContentType {
  id:       ContentTypeId
  label:    string
  icon:     string
  desc:     string
  platform: string
  badge?:   string
  color:    string
}

// ── Character ─────────────────────────────────────────────────
export type CharacterGender   = 'female' | 'male'
export type CharacterStyle    = 'indonesian' | 'asian' | 'western' | 'hijab' | 'professional' | 'casual'
export type CharacterAge      = '18-25' | '25-35' | '35-45' | '45+'

export interface CharacterPreset {
  id:      string
  label:   string
  icon:    string
  gender:  CharacterGender
  style:   CharacterStyle
  age:     CharacterAge
  desc:    string
  avatarBg:string
}

// ── Language ──────────────────────────────────────────────────
export type LanguageId = 'indonesia' | 'english'
export type AccentId   =
  | 'natural-id'
  | 'formal-id'
  | 'casual-id'
  | 'american-en'
  | 'british-en'

export interface LanguageOption {
  id:      LanguageId
  label:   string
  flag:    string
  accents: { id: AccentId; label: string }[]
}

// ── Script ────────────────────────────────────────────────────
export type ScriptMode = 'auto' | 'manual'

export interface AutoScriptInput {
  productName:   string
  targetMarket:  string
  mainBenefit:   string
  painPoint:     string
}

// ── Video preset ──────────────────────────────────────────────
export type VideoPresetId =
  | 'viral-tiktok'
  | 'tiktok-shop'
  | 'shopee-video'
  | 'facebook-ads'
  | 'instagram-reels'
  | 'product-review'
  | 'testimonial'
  | 'soft-selling'
  | 'hard-selling'
  | 'storytelling'
  | 'problem-solution'
  | 'affiliate-marketing'

export interface VideoPreset {
  id:           VideoPresetId
  label:        string
  icon:         string
  desc:         string
  toneStyle:    string
  hook:         string
  cta:          string
  durationHint: 15 | 30 | 45 | 60 | 90
  platform:     string
  badge?:       string
}

// ── Duration ──────────────────────────────────────────────────
export type DurationSec = 15 | 30 | 45 | 60 | 90

// ── Additional features ───────────────────────────────────────
export type SubtitleStyle = 'tiktok' | 'reels' | 'minimal' | 'modern' | 'none'
export type CtaOverlay    = 'shop-now' | 'buy-now' | 'order-today' | 'learn-more' | 'whatsapp-now' | 'none'
export type MusicCategory = 'trending' | 'corporate' | 'lifestyle' | 'fashion' | 'beauty' | 'technology' | 'none'

// ── Output resolution ─────────────────────────────────────────
export type OutputResolution = 'vertical' | 'square' | 'landscape' | 'marketplace'

export interface ResolutionOption {
  id:     OutputResolution
  label:  string
  ratio:  string
  size:   string
  desc:   string
  icon:   string
}

// ── Product category (for prompt engine) ─────────────────────
export type ProductCategoryId =
  | 'beauty'
  | 'skincare'
  | 'fashion'
  | 'hijab'
  | 'gadget'
  | 'electronics'
  | 'food'
  | 'beverage'
  | 'herbal'
  | 'furniture'
  | 'home-living'
  | 'pet-products'
  | 'baby-products'
  | 'automotive'

// ── Generation status ─────────────────────────────────────────
export type GenerationStatus = 'idle' | 'preparing' | 'generating' | 'rendering' | 'completed' | 'error'

// ── Full form state ───────────────────────────────────────────
export interface UgcFormState {
  // Step 1
  contentType:     ContentTypeId | null
  // Step 2
  productImages:   File[]
  // Step 3
  character:       string | null  // character preset id
  // Step 4
  language:        LanguageId
  accent:          AccentId
  // Step 5
  scriptMode:      ScriptMode
  autoScriptInput: AutoScriptInput
  manualScript:    string
  generatedScript: string
  // Step 6
  videoPreset:     VideoPresetId | null
  productCategory: ProductCategoryId | null
  // Step 7
  duration:        DurationSec
  // Step 8 extras
  subtitleStyle:   SubtitleStyle
  ctaOverlay:      CtaOverlay
  musicCategory:   MusicCategory
}

// ── API types ─────────────────────────────────────────────────
export interface GenerateScriptRequest {
  productName:   string
  targetMarket:  string
  mainBenefit:   string
  painPoint:     string
  contentType:   ContentTypeId
  videoPreset:   VideoPresetId
  language:      LanguageId
  accent:        AccentId
  duration:      DurationSec
}

export interface GenerateVideoRequest {
  formState:    UgcFormState
  productImages: string[]  // base64
}

export interface GenerateVideoResponse {
  success:    boolean
  videoUrl?:  string
  script?:    string
  elapsedMs?: number
  error?:     string
}

// ── DB schema (for reference) ────────────────────────────────
export interface UgcVideoRecord {
  id:           string
  user_id:      string
  content_type: ContentTypeId
  video_preset: VideoPresetId
  character_id: string
  language:     LanguageId
  duration:     DurationSec
  script:       string
  video_url:    string | null
  status:       GenerationStatus
  metadata:     Record<string, unknown>
  created_at:   string
}