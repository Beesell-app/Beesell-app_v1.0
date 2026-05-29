// lib/studio/model-swap-presets.ts
// ══════════════════════════════════════════════════════════════
// MODEL SWAP AI — Identity Presets & Prompt Builders
// ══════════════════════════════════════════════════════════════
//
// Reference (from docs):
//   Model Swap = identity transformation
//   - Replace person's look (face, hair, skin, body type)
//   - KEEP: outfit, pose, lighting, background exactly
//   - NOT: re-pose, change clothes, change background
//
// Strategy:
//   Use SDXL img2img with:
//   - prompt_strength 0.55–0.70 (keep structure, change identity)
//   - Strong negative for clothing/pose change
//   - Identity-focused positive prompt
//   - Optional face_reference for campaign consistency

// ── Types ─────────────────────────────────────────────────────
export type IdentityPresetId =
  | 'wanita-indo-muda'
  | 'wanita-hijab'
  | 'wanita-hijab-casual'
  | 'wanita-mature'
  | 'pria-indo-muda'
  | 'pria-mature'
  | 'remaja-wanita'
  | 'remaja-pria'
  | 'anak-perempuan'
  | 'anak-laki'
  | 'wanita-western'
  | 'pria-western'
  | 'wanita-asia-east'
  | 'pria-asia-east'

export type SkinToneId    = 'fair' | 'medium' | 'tan' | 'brown' | 'dark'
export type HairstyleId   = 'natural' | 'straight-long' | 'wavy-medium' | 'short-pixie' | 'bun-neat' | 'curly' | 'hijab-simple' | 'hijab-pashmina' | 'hijab-voluminous'
export type BodyTypeId    = 'slim' | 'average' | 'athletic' | 'curvy'
export type GenderId      = 'female' | 'male' | 'child-female' | 'child-male'

export interface IdentityPreset {
  id:          IdentityPresetId
  label:       string
  icon:        string
  gender:      GenderId
  ageGroup:    'adult' | 'teen' | 'kid'
  desc:        string
  category:    'lokal-wanita' | 'lokal-pria' | 'hijab' | 'teen' | 'anak' | 'global'
  promptCore:  string  // identity description for AI
  skinTone:    SkinToneId
}

export interface SwapParams {
  promptStrength:   number  // 0.50–0.72 — lower = keep more of original
  guidanceScale:    number  // 7–12
  inferenceSteps:   number  // 30–50
  scheduler:        string
}

// ── Identity Presets ──────────────────────────────────────────
export const IDENTITY_PRESETS: Record<IdentityPresetId, IdentityPreset> = {

  // ── Wanita Lokal Indonesia ────────────────────────────────
  'wanita-indo-muda': {
    id: 'wanita-indo-muda', label: 'Wanita Asia Muda', icon: '👩', gender: 'female', ageGroup: 'adult',
    category: 'lokal-wanita', skinTone: 'tan',
    desc: 'Wanita Indonesia 20-28 tahun, slim, tampilan segar',
    promptCore: 'young Indonesian woman, 22-27 years old, tan warm skin tone, Southeast Asian features, natural dark hair, slim figure, fresh approachable look, professional model',
  },
  'wanita-mature': {
    id: 'wanita-mature', label: 'Wanita Mature', icon: '👩‍🦱', gender: 'female', ageGroup: 'adult',
    category: 'lokal-wanita', skinTone: 'medium',
    desc: 'Wanita Indonesia 30-42 tahun, professional, elegan',
    promptCore: 'mature Indonesian woman, 33-40 years old, warm medium skin tone, Southeast Asian features, elegant appearance, well-groomed dark hair, professional sophisticated look',
  },

  // ── Hijab ─────────────────────────────────────────────────
  'wanita-hijab': {
    id: 'wanita-hijab', label: 'Hijab Modern', icon: '🧕', gender: 'female', ageGroup: 'adult',
    category: 'hijab', skinTone: 'medium',
    desc: 'Wanita berhijab 22-30 tahun, hijab modern simpel',
    promptCore: 'young Indonesian Muslim woman wearing elegant simple hijab, 24-30 years old, warm medium skin tone, Southeast Asian features, modern modest fashion, neatly draped hijab covering hair and neck, bright expressive eyes, clean contemporary look',
  },
  'wanita-hijab-casual': {
    id: 'wanita-hijab-casual', label: 'Hijab Kasual', icon: '🧕', gender: 'female', ageGroup: 'adult',
    category: 'hijab', skinTone: 'tan',
    desc: 'Wanita berhijab kasual, gaya santai sehari-hari',
    promptCore: 'young Indonesian Muslim woman wearing casual pashmina hijab, 22-28 years old, tan warm skin tone, Southeast Asian features, everyday modest fashion, loosely draped pashmina-style hijab, approachable friendly expression, youthful natural look',
  },

  // ── Pria Lokal Indonesia ───────────────────────────────────
  'pria-indo-muda': {
    id: 'pria-indo-muda', label: 'Pria Asia Muda', icon: '👨', gender: 'male', ageGroup: 'adult',
    category: 'lokal-pria', skinTone: 'tan',
    desc: 'Pria Indonesia 22-28 tahun, atletis, tampilan bersih',
    promptCore: 'young Indonesian man, 23-28 years old, tan warm skin tone, Southeast Asian features, clean short dark hair, athletic slim build, fresh confident look, professional male model',
  },
  'pria-mature': {
    id: 'pria-mature', label: 'Pria Mature', icon: '👨‍🦱', gender: 'male', ageGroup: 'adult',
    category: 'lokal-pria', skinTone: 'medium',
    desc: 'Pria Indonesia 32-45 tahun, professional, berkarisma',
    promptCore: 'mature Indonesian man, 35-45 years old, warm medium skin tone, Southeast Asian features, well-groomed hair, professional charismatic appearance, confident executive look',
  },

  // ── Remaja ────────────────────────────────────────────────
  'remaja-wanita': {
    id: 'remaja-wanita', label: 'Remaja Wanita', icon: '👧', gender: 'female', ageGroup: 'teen',
    category: 'teen', skinTone: 'medium',
    desc: 'Remaja wanita 14-17 tahun, Asia, gaya kasual',
    promptCore: 'teenage Asian girl, 15-17 years old, medium skin tone, Southeast Asian features, casual youthful style, natural dark hair, fresh school or casual fashion look',
  },
  'remaja-pria': {
    id: 'remaja-pria', label: 'Remaja Pria', icon: '👦', gender: 'male', ageGroup: 'teen',
    category: 'teen', skinTone: 'medium',
    desc: 'Remaja pria 14-17 tahun, Asia, gaya kasual',
    promptCore: 'teenage Asian boy, 15-17 years old, medium skin tone, Southeast Asian features, casual youthful style, clean short hair, sporty or casual fashion look',
  },

  // ── Anak ──────────────────────────────────────────────────
  'anak-perempuan': {
    id: 'anak-perempuan', label: 'Anak Perempuan', icon: '🧒', gender: 'child-female', ageGroup: 'kid',
    category: 'anak', skinTone: 'tan',
    desc: 'Anak perempuan 5-10 tahun, Indonesia, lucu',
    promptCore: 'Indonesian little girl, 6-9 years old, tan warm skin tone, Southeast Asian features, natural dark hair, cute innocent expression, casual children\'s fashion',
  },
  'anak-laki': {
    id: 'anak-laki', label: 'Anak Laki-laki', icon: '🧒', gender: 'child-male', ageGroup: 'kid',
    category: 'anak', skinTone: 'tan',
    desc: 'Anak laki-laki 5-10 tahun, Indonesia, aktif',
    promptCore: 'Indonesian little boy, 6-9 years old, tan warm skin tone, Southeast Asian features, short dark hair, active playful expression, casual children\'s fashion',
  },

  // ── Global ────────────────────────────────────────────────
  'wanita-western': {
    id: 'wanita-western', label: 'Wanita Western', icon: '👱‍♀️', gender: 'female', ageGroup: 'adult',
    category: 'global', skinTone: 'fair',
    desc: 'Wanita Eropa/Amerika 22-30 tahun, light skin',
    promptCore: 'young Western Caucasian woman, 23-29 years old, fair light skin tone, European features, blonde or light brown hair, professional fashion model look, magazine editorial style',
  },
  'pria-western': {
    id: 'pria-western', label: 'Pria Western', icon: '👱‍♂️', gender: 'male', ageGroup: 'adult',
    category: 'global', skinTone: 'fair',
    desc: 'Pria Eropa/Amerika 24-32 tahun, light skin',
    promptCore: 'young Western Caucasian man, 25-32 years old, fair light skin tone, European features, clean groomed appearance, professional male model, athletic build',
  },
  'wanita-asia-east': {
    id: 'wanita-asia-east', label: 'Wanita Asia Timur', icon: '👩‍🦰', gender: 'female', ageGroup: 'adult',
    category: 'global', skinTone: 'fair',
    desc: 'Wanita Korea/Jepang/China 20-28 tahun',
    promptCore: 'young East Asian woman, 22-28 years old, fair porcelain skin tone, Korean Japanese or Chinese features, straight silky dark hair, K-fashion or clean minimal style, bright expressive eyes',
  },
  'pria-asia-east': {
    id: 'pria-asia-east', label: 'Pria Asia Timur', icon: '👨‍🦱', gender: 'male', ageGroup: 'adult',
    category: 'global', skinTone: 'fair',
    desc: 'Pria Korea/Jepang/China 22-30 tahun',
    promptCore: 'young East Asian man, 23-30 years old, fair skin tone, Korean Japanese or Chinese features, stylish dark hair, K-fashion clean contemporary style',
  },
}

// ── Category groups untuk UI ──────────────────────────────────
export const IDENTITY_CATEGORIES = [
  {
    id:     'lokal-wanita',
    label:  'Wanita Lokal',
    icon:   '🇮🇩',
    presets: ['wanita-indo-muda', 'wanita-mature'] as IdentityPresetId[],
  },
  {
    id:     'hijab',
    label:  'Hijab',
    icon:   '🧕',
    presets: ['wanita-hijab', 'wanita-hijab-casual'] as IdentityPresetId[],
  },
  {
    id:     'lokal-pria',
    label:  'Pria Lokal',
    icon:   '👨',
    presets: ['pria-indo-muda', 'pria-mature'] as IdentityPresetId[],
  },
  {
    id:     'teen',
    label:  'Remaja',
    icon:   '🧑',
    presets: ['remaja-wanita', 'remaja-pria'] as IdentityPresetId[],
  },
  {
    id:     'anak',
    label:  'Anak-anak',
    icon:   '👶',
    presets: ['anak-perempuan', 'anak-laki'] as IdentityPresetId[],
  },
  {
    id:     'global',
    label:  'Global',
    icon:   '🌍',
    presets: ['wanita-western', 'pria-western', 'wanita-asia-east', 'pria-asia-east'] as IdentityPresetId[],
  },
]

// ── Skin tone options ─────────────────────────────────────────
export const SKIN_TONE_OPTIONS: { id: SkinToneId; label: string; hex: string; prompt: string }[] = [
  { id: 'fair',   label: 'Fair',   hex: '#FBEADF', prompt: 'very fair porcelain skin tone' },
  { id: 'medium', label: 'Medium', hex: '#D4A77A', prompt: 'warm medium skin tone' },
  { id: 'tan',    label: 'Tan',    hex: '#C08050', prompt: 'warm tan brown skin tone' },
  { id: 'brown',  label: 'Brown',  hex: '#8B5E3C', prompt: 'rich warm brown skin tone' },
  { id: 'dark',   label: 'Dark',   hex: '#4A2E20', prompt: 'deep dark skin tone, even complexion' },
]

// ── Hairstyle options ─────────────────────────────────────────
export const HAIRSTYLE_OPTIONS: { id: HairstyleId; label: string; icon: string; prompt: string }[] = [
  { id: 'natural',          label: 'Default (Auto)',     icon: '✨', prompt: '' },
  { id: 'straight-long',    label: 'Lurus Panjang',      icon: '💇‍♀️', prompt: 'long straight silky dark hair down to shoulders' },
  { id: 'wavy-medium',      label: 'Bergelombang',       icon: '〰️', prompt: 'medium wavy dark hair, natural waves' },
  { id: 'short-pixie',      label: 'Pendek Pixie',       icon: '✂️', prompt: 'short pixie cut dark hair, modern styling' },
  { id: 'bun-neat',         label: 'Sanggul Rapi',       icon: '🪮', prompt: 'neat hair bun, professional updo hairstyle' },
  { id: 'curly',            label: 'Keriting',           icon: '🌀', prompt: 'natural curly voluminous dark hair' },
  { id: 'hijab-simple',     label: 'Hijab Simple',       icon: '🧕', prompt: 'simple elegant hijab, neatly pinned, covering hair and neck' },
  { id: 'hijab-pashmina',   label: 'Hijab Pashmina',     icon: '🧣', prompt: 'casually draped pashmina hijab, layered folds, modern casual hijab style' },
  { id: 'hijab-voluminous', label: 'Hijab Voluminous',   icon: '👑', prompt: 'voluminous hijab style, full shape, elegant draping, modern Indonesian hijab fashion' },
]

// ── Body type options ─────────────────────────────────────────
export const BODY_TYPE_OPTIONS: { id: BodyTypeId; label: string; prompt: string }[] = [
  { id: 'slim',    label: 'Slim (Default)',  prompt: 'slim slender figure' },
  { id: 'average', label: 'Average',        prompt: 'average healthy figure' },
  { id: 'athletic',label: 'Atletis',        prompt: 'athletic toned figure' },
  { id: 'curvy',   label: 'Curvy Plus',     prompt: 'curvy plus-size figure, body-positive representation' },
]

// ── Number of results ─────────────────────────────────────────
export const RESULT_COUNT_OPTIONS = [
  { value: 1, label: '1 variasi' },
  { value: 2, label: '2 variasi' },
  { value: 3, label: '3 variasi' },
  { value: 4, label: '4 variasi' },
]

// ── SDXL params per swap mode ─────────────────────────────────
export const SWAP_PARAMS: Record<string, SwapParams> = {
  subtle: {
    promptStrength: 0.55,
    guidanceScale:  8,
    inferenceSteps: 35,
    scheduler:      'DPMSolverMultistep',
  },
  balanced: {
    promptStrength: 0.63,
    guidanceScale:  9,
    inferenceSteps: 40,
    scheduler:      'DPMSolverMultistep',
  },
  strong: {
    promptStrength: 0.70,
    guidanceScale:  10,
    inferenceSteps: 45,
    scheduler:      'DPMSolverMultistep',
  },
}

// ── Prompt builder ────────────────────────────────────────────
export interface BuildPromptInput {
  preset:         IdentityPreset
  skinToneOverride?: SkinToneId    // optional skin tone override
  hairstyle?:     HairstyleId
  bodyType?:      BodyTypeId
  customPrompt?:  string           // extra identity details
  faceRef?:       boolean          // face reference used
}

export function buildSwapPrompt(input: BuildPromptInput): string {
  const { preset, skinToneOverride, hairstyle, bodyType, customPrompt } = input

  const parts: string[] = []

  // 1. Core identity
  parts.push(preset.promptCore)

  // 2. Skin tone override if different from preset default
  if (skinToneOverride && skinToneOverride !== preset.skinTone) {
    const tone = SKIN_TONE_OPTIONS.find(t => t.id === skinToneOverride)
    if (tone) parts.push(tone.prompt)
  }

  // 3. Hairstyle override
  if (hairstyle && hairstyle !== 'natural') {
    const hair = HAIRSTYLE_OPTIONS.find(h => h.id === hairstyle)
    if (hair?.prompt) parts.push(hair.prompt)
  }

  // 4. Body type
  if (bodyType && bodyType !== 'slim') {
    const bt = BODY_TYPE_OPTIONS.find(b => b.id === bodyType)
    if (bt?.prompt) parts.push(bt.prompt)
  }

  // 5. Custom
  if (customPrompt?.trim()) parts.push(customPrompt.trim())

  // 6. CRITICAL quality suffixes — always last
  parts.push('professional fashion photography, studio quality, sharp focus on face, realistic skin texture, high resolution model photography, same outfit same pose same background')

  return parts.join(', ')
}

export function buildNegativePrompt(): string {
  return [
    // DO NOT change these
    'different outfit, different clothes, different garment, changed clothing',
    'different pose, different position, moved arms, different body language',
    'different background, changed scenery, different setting',
    'different lighting, changed illumination',
    // Quality
    'deformed, distorted, disfigured, bad anatomy, extra limbs, mutation',
    'blurry, low quality, pixelated, watermark, signature',
    'cartoon, anime, illustration, drawing, painting',
    'nude, nsfw, explicit',
    // Face
    'bad face, deformed face, asymmetrical face, bad eyes, cross-eyed',
    'cloned face, duplicate, ugly, ugly face',
  ].join(', ')
}

// ── Tips per ageGroup ─────────────────────────────────────────
export const TIPS_BY_PRESET: Record<string, string[]> = {
  'wanita-indo-muda': [
    'Ideal untuk pakaian wanita kasual & formal',
    'Hasil terbaik dengan foto model tegak menghadap kamera',
    'Skin tone warm tan cocok untuk brand lokal Indonesia',
  ],
  'wanita-hijab': [
    'Hijab akan di-generate secara AI, hasil tergantung kualitas foto',
    'Paling cocok untuk pakaian modest fashion & gamis',
    'Gunakan foto sumber dengan latar bersih untuk hasil terbaik',
  ],
  'anak-perempuan': [
    'Ideal untuk brand pakaian anak & bayi',
    'Pilih foto produk dengan ukuran & proporsi anak-anak',
    'Ekspresi lucu & natural akan dipertahankan AI',
  ],
  default: [
    'Gunakan foto sumber resolusi tinggi (min 800px)',
    'Pose, outfit, dan background tetap terjaga oleh AI',
    'Jalankan 2-4 variasi untuk pilihan terbaik',
  ],
}