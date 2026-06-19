// lib/studio/video-presets.ts
// ══════════════════════════════════════════════════════════════
// IMAGE TO VIDEO — Presets, Motion Prompts, Resolution Config
// ══════════════════════════════════════════════════════════════
//
// Per spec:
//   Duration: 5s or 10s
//   Resolution: 480p (Basic+), 720p (Basic+), 1080p (Pro+)
//   End Image: Pro+ only, 1080p only
//   Prompt: optional — no prompt = more natural motion
//
// AI Stack strategy:
//   480p/720p → stability-ai/stable-video-diffusion (SVD)
//   1080p     → lucataco/animate-diff-lightning or kling-v1 via API
//   All via Replicate

// ── Types ─────────────────────────────────────────────────────
export type DurationOption = 5 | 10
export type ResolutionId   = '480p' | '720p' | '1080p'
export type MotionPresetId =
  | 'auto'
  | 'subtle-breathe'
  | 'fabric-sway'
  | 'camera-drift-in'
  | 'camera-pan-right'
  | 'camera-orbit'
  | 'garment-flutter'
  | 'hair-wind'
  | 'model-turn'
  | 'model-walk'
  | 'raise-hand'
  | 'tiktok-bounce'
  | 'reels-slow-mo'
  | 'story-zoom'
  | 'product-rotate'
  | 'floating-product'
  | 'packshot-spin'

export interface MotionPreset {
  id:         MotionPresetId
  label:      string
  icon:       string
  category:   'natural' | 'fashion' | 'camera' | 'social' | 'product'
  desc:       string
  prompt:     string       // sent to AI
  badge?:     string
  durationHint: 5 | 10 | null  // null = both work fine
  requiresPro?: boolean
}

export interface ResolutionOption {
  id:       ResolutionId
  label:    string
  desc:     string
  plan:     'basic' | 'pro'
  model:    string    // Replicate model version
  width:    number
  height:   number
  supportsEndImage: boolean
}

// ── Resolution config ─────────────────────────────────────────
export const RESOLUTION_OPTIONS: Record<ResolutionId, ResolutionOption> = {
  '480p': {
    id: '480p', label: '480p', desc: 'Cepat · Cocok untuk story & preview',
    plan: 'basic',
    model: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    width: 854, height: 480, supportsEndImage: false,
  },
  '720p': {
    id: '720p', label: '720p HD', desc: 'HD · Optimal untuk Reels & TikTok',
    plan: 'basic',
    model: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    width: 1280, height: 720, supportsEndImage: false,
  },
  '1080p': {
    id: '1080p', label: '1080p FHD', desc: 'Full HD · End Image support · Pro+',
    plan: 'pro',
    model: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    width: 1920, height: 1080, supportsEndImage: true,
  },
}

// ── Motion presets ────────────────────────────────────────────
export const MOTION_PRESETS: Record<MotionPresetId, MotionPreset> = {

  // ── Natural ────────────────────────────────────────────────
  auto: {
    id: 'auto', label: 'Auto (Recommended)', icon: '✨', category: 'natural',
    desc: 'AI tentukan motion yang paling natural untuk gambar ini. Tidak ada prompt tambahan.',
    prompt: '',  // no prompt = more natural per spec
    badge: 'Terbaik', durationHint: 5,
  },
  'subtle-breathe': {
    id: 'subtle-breathe', label: 'Subtle Breathing', icon: '🫁', category: 'natural',
    desc: 'Gerakan napas halus pada model. Hidup dan realistis untuk foto portrait.',
    prompt: 'subtle natural breathing movement, chest rises and falls gently, still pose',
    durationHint: 5,
  },
  'fabric-sway': {
    id: 'fabric-sway', label: 'Fabric Sway', icon: '🌬️', category: 'natural',
    desc: 'Kain bergerak perlahan seolah terkena angin ringan. Ideal untuk dress & rok.',
    prompt: 'fabric gently swaying in light breeze, soft cloth movement, dress hem flows naturally',
    durationHint: 5,
  },
  'garment-flutter': {
    id: 'garment-flutter', label: 'Garment Flutter', icon: '🪁', category: 'fashion',
    desc: 'Pakaian bergerak ringan, tampilkan tekstur dan draping material.',
    prompt: 'garment fabric flutters softly, natural cloth motion, material texture visible',
    durationHint: 5,
  },
  'hair-wind': {
    id: 'hair-wind', label: 'Hair in Wind', icon: '💨', category: 'fashion',
    desc: 'Rambut bergerak perlahan terkena angin. Cocok untuk fashion editorial.',
    prompt: 'hair gently blowing in wind, model stands still, light breeze hair movement',
    durationHint: 5,
  },
  'model-turn': {
    id: 'model-turn', label: 'Model Turn', icon: '🔄', category: 'fashion',
    desc: 'Model berputar perlahan untuk menampilkan tampilan depan ke samping/belakang.',
    prompt: 'model slowly turns body to show outfit from front to side view, smooth rotation',
    badge: 'Best for 1080p', durationHint: 10, requiresPro: false,
  },
  'model-walk': {
    id: 'model-walk', label: 'Catwalk Walk', icon: '🚶', category: 'fashion',
    desc: 'Model berjalan perlahan ala catwalk, memperlihatkan gerak pakaian saat bergerak.',
    prompt: 'model walks slowly toward camera, catwalk style, natural confident stride, outfit moves naturally',
    durationHint: 10,
  },
  'raise-hand': {
    id: 'raise-hand', label: 'Touch Fabric', icon: '✋', category: 'fashion',
    desc: 'Model mengangkat tangan menyentuh pakaian atau rambut. Natural lifestyle look.',
    prompt: 'model raises hand to touch fabric or hair, natural gesture, soft smooth motion',
    durationHint: 5,
  },

  // ── Camera ─────────────────────────────────────────────────
  'camera-drift-in': {
    id: 'camera-drift-in', label: 'Slow Zoom In', icon: '🔭', category: 'camera',
    desc: 'Kamera perlahan zoom in ke arah model. Efek dramatis untuk highlight produk.',
    prompt: 'slow gentle zoom in toward subject, Ken Burns effect, camera slowly moves closer',
    durationHint: 5,
  },
  'camera-pan-right': {
    id: 'camera-pan-right', label: 'Camera Pan', icon: '📹', category: 'camera',
    desc: 'Kamera gerak perlahan dari kiri ke kanan. Ideal untuk full-body shot.',
    prompt: 'camera pans slowly from left to right, smooth horizontal movement, cinematic pan',
    durationHint: 5,
  },
  'camera-orbit': {
    id: 'camera-orbit', label: 'Orbit Shot', icon: '🌐', category: 'camera',
    desc: 'Kamera bergerak mengelilingi model. Premium fashion editorial effect.',
    prompt: 'camera orbits slowly around subject, circular camera movement, 360 orbit tracking shot',
    badge: 'Pro',
    durationHint: 10, requiresPro: true,
  },

  // ── Social ─────────────────────────────────────────────────
  'tiktok-bounce': {
    id: 'tiktok-bounce', label: 'TikTok Energy', icon: '🎵', category: 'social',
    desc: 'Gerakan energik ala TikTok. Kamera bergerak dinamis dengan slight zoom & pan.',
    prompt: 'dynamic energetic movement, slight camera bounce and zoom, lively fashion video energy',
    durationHint: 5,
  },
  'reels-slow-mo': {
    id: 'reels-slow-mo', label: 'Reels Slow-Mo', icon: '📱', category: 'social',
    desc: 'Slow motion dramatis cocok untuk Reels & Shorts. Model bergerak perlahan.',
    prompt: 'slow motion movement, dramatic slow fashion shot, model moves gracefully in slow-mo',
    durationHint: 10,
  },
  'story-zoom': {
    id: 'story-zoom', label: 'Story Zoom', icon: '📲', category: 'social',
    desc: 'Quick zoom untuk Instagram Story & WhatsApp Status. Eye-catching effect.',
    prompt: 'quick subtle zoom in on subject, attention-grabbing motion, story-format reveal',
    durationHint: 5,
  },

  // ── Product ────────────────────────────────────────────────
  'product-rotate': {
    id: 'product-rotate', label: 'Product Rotate', icon: '🔃', category: 'product',
    desc: 'Produk berputar untuk memperlihatkan semua sisi. Ideal untuk packshot.',
    prompt: 'product slowly rotates 360 degrees, all sides visible, clean product reveal',
    durationHint: 10,
  },
  'floating-product': {
    id: 'floating-product', label: 'Floating Product', icon: '🌟', category: 'product',
    desc: 'Produk melayang dengan efek parallax. Modern premium product video.',
    prompt: 'product floats gently with subtle parallax motion, premium product showcase, depth of field shift',
    durationHint: 5,
  },
  'packshot-spin': {
    id: 'packshot-spin', label: 'Packshot Spin', icon: '💫', category: 'product',
    desc: 'Packshot berputar pelan dengan cahaya yang bergerak. Untuk marketplace.',
    prompt: 'product spins slowly on clean background, studio lighting shifts subtly, e-commerce product spin',
    durationHint: 10,
  },
}

// Category grouping untuk UI
export const MOTION_CATEGORIES = [
  {
    id:      'natural',
    label:   'Natural',
    icon:    '🌿',
    presets: ['auto','subtle-breathe','fabric-sway'] as MotionPresetId[],
  },
  {
    id:      'fashion',
    label:   'Fashion',
    icon:    '👗',
    presets: ['garment-flutter','hair-wind','model-turn','model-walk','raise-hand'] as MotionPresetId[],
  },
  {
    id:      'camera',
    label:   'Kamera',
    icon:    '📹',
    presets: ['camera-drift-in','camera-pan-right','camera-orbit'] as MotionPresetId[],
  },
  {
    id:      'social',
    label:   'Social Media',
    icon:    '📱',
    presets: ['tiktok-bounce','reels-slow-mo','story-zoom'] as MotionPresetId[],
  },
  {
    id:      'product',
    label:   'Produk',
    icon:    '📦',
    presets: ['product-rotate','floating-product','packshot-spin'] as MotionPresetId[],
  },
]

// Platform output tips
export const PLATFORM_TIPS = [
  { platform:'TikTok',         ratio:'9:16', res:'720p+', preset:'tiktok-bounce', icon:'🎵' },
  { platform:'Instagram Reels',ratio:'9:16', res:'720p+', preset:'reels-slow-mo', icon:'📸' },
  { platform:'YouTube Shorts', ratio:'9:16', res:'1080p', preset:'camera-drift-in',icon:'▶️' },
  { platform:'Shopee Banner',  ratio:'16:9', res:'720p',  preset:'floating-product',icon:'🛍️' },
  { platform:'WA Status',      ratio:'9:16', res:'480p',  preset:'story-zoom',    icon:'💬' },
  { platform:'Facebook Reels', ratio:'9:16', res:'720p',  preset:'fabric-sway',   icon:'👥' },
]

// ── Motion strength → SVD parameters ─────────────────────────
// SVD motion_bucket_id: 1-255 (higher = more motion)
// min_cfg: lower = more natural
export interface SvdParams {
  motion_bucket_id: number
  cond_aug:         number  // noise augmentation 0-1
  fps:              number
  num_frames:       number  // 14=≈2s, 25=≈4s at fps
  min_cfg:          number
}

export function buildSvdParams(preset: MotionPreset, duration: DurationOption, resolution: ResolutionId): SvdParams {
  // Base params by category
  const categoryBase: Record<string, Partial<SvdParams>> = {
    natural:  { motion_bucket_id: 40,  cond_aug: 0.02 },
    fashion:  { motion_bucket_id: 80,  cond_aug: 0.05 },
    camera:   { motion_bucket_id: 100, cond_aug: 0.08 },
    social:   { motion_bucket_id: 120, cond_aug: 0.06 },
    product:  { motion_bucket_id: 90,  cond_aug: 0.04 },
  }
  const base = categoryBase[preset.category] ?? { motion_bucket_id: 60, cond_aug: 0.04 }

  // Auto preset → very low motion
  if (preset.id === 'auto') {
    return { motion_bucket_id: 30, cond_aug: 0.02, fps: 8, num_frames: duration === 5 ? 25 : 40, min_cfg: 1.0 }
  }

  const fps = resolution === '480p' ? 8 : resolution === '720p' ? 12 : 16
  const num_frames = duration === 5 ? Math.round(fps * 4.5) : Math.round(fps * 9)

  return {
    motion_bucket_id: base.motion_bucket_id ?? 70,
    cond_aug:         base.cond_aug ?? 0.04,
    fps,
    num_frames,
    min_cfg:          1.5,
  }
}