// lib/studio/video/video-generator-presets.ts
// ══════════════════════════════════════════════════════════════
// AI VIDEO GENERATOR — Presets, Avatars, Subtitles, Sounds, Slides
// ══════════════════════════════════════════════════════════════
//
// Modules:
//   1. Slideshow + Teks + Musik
//   2. AI Talking Head (avatar digital presenter)
//   3. Auto-subtitle (manual + AI with styling)
//   4. Trending Sound Detector
//   5. Duration: 15s / 30s / 60s per platform

// ── Types ─────────────────────────────────────────────────────
export type VideoModuleId = 'slideshow' | 'talking-head' | 'slideshow-avatar'
export type DurationSec   = 15 | 30 | 60
export type PlatformId    = 'tiktok' | 'reels' | 'shorts' | 'shopee' | 'facebook'
export type SubtitleStyle = 'none' | 'tiktok-bold' | 'highlight-pop' | 'emoji-flow' | 'minimal' | 'neon' | 'karaoke' | 'manual'
export type NicheId       = 'fashion' | 'beauty' | 'food' | 'gadget' | 'health' | 'home' | 'baby' | 'general'
export type SlideLayout   = 'product-hero' | 'text-overlay' | 'split' | 'list' | 'before-after' | 'countdown'
export type TransitionId  = 'fade' | 'slide' | 'zoom' | 'swipe' | 'bounce' | 'glitch'
export type AvatarId      = 'f-indo-young' | 'f-indo-mature' | 'f-hijab' | 'f-asia' | 'f-pro' | 'm-indo-young' | 'm-indo-mature' | 'm-pro' | 'm-casual'

// ── Platform config ───────────────────────────────────────────
export interface PlatformConfig {
  id:          PlatformId
  label:       string
  icon:        string
  ratio:       '9:16' | '1:1' | '16:9'
  size:        string
  durations:   DurationSec[]
  hashLimit:   number
  desc:        string
}

export const PLATFORMS: PlatformConfig[] = [
  { id:'tiktok',   label:'TikTok',          icon:'🎵', ratio:'9:16', size:'1080×1920', durations:[15,30,60], hashLimit:10, desc:'FYP organik + TikTok Shop' },
  { id:'reels',    label:'Instagram Reels', icon:'📸', ratio:'9:16', size:'1080×1920', durations:[15,30,60], hashLimit:30, desc:'Reels + Feed + Explore' },
  { id:'shorts',   label:'YouTube Shorts',  icon:'▶️', ratio:'9:16', size:'1080×1920', durations:[15,30,60], hashLimit:15, desc:'Discovery & subscriber grow' },
  { id:'shopee',   label:'Shopee Video',    icon:'🛍️', ratio:'9:16', size:'720×1280',  durations:[15,30,60], hashLimit:5,  desc:'Native Shopee marketplace' },
  { id:'facebook', label:'Facebook Video',  icon:'👥', ratio:'9:16', size:'1080×1920', durations:[30,60],    hashLimit:10, desc:'Feed + Reels Facebook' },
]

// ── Video modules ─────────────────────────────────────────────
export interface VideoModule {
  id:      VideoModuleId
  label:   string
  icon:    string
  desc:    string
  badge?:  string
  color:   string
  colorLt: string
  features:string[]
}

export const VIDEO_MODULES: VideoModule[] = [
  {
    id:'slideshow', label:'Slideshow + Teks + Musik', icon:'🖼️',
    desc:'Foto produk + teks animasi + musik trending = video marketing siap pakai tanpa skill editing',
    badge:'Paling Mudah', color:'#F59E0B', colorLt:'#FFFBEB',
    features:['Upload hingga 10 foto produk','Teks animasi otomatis','Musik trending per niche','Transisi & efek profesional','Subtitle otomatis'],
  },
  {
    id:'talking-head', label:'AI Talking Head', icon:'🎭',
    desc:'Avatar digital presenter membacakan skrip produk kamu — multi bahasa, tanpa kamera',
    badge:'Paling Viral', color:'#7C3AED', colorLt:'#F5F3FF',
    features:['14 avatar digital pilihan','Suara alami Indonesia & Inggris','Lipsync sempurna','Multi-bahasa support','Subtitle otomatis + manual'],
  },
  {
    id:'slideshow-avatar', label:'Slideshow + Avatar', icon:'🎬',
    desc:'Gabungan terbaik — foto produk + avatar presenter di pojok layar + musik',
    badge:'Premium', color:'#059669', colorLt:'#ECFDF5',
    features:['Semua fitur Slideshow','Avatar presenter overlay','Picture-in-picture layout','Narasi + musik','Full branded experience'],
  },
]

// ── Avatar presets (AI Talking Head) ─────────────────────────
export interface AvatarPreset {
  id:       AvatarId
  label:    string
  icon:     string
  gender:   'female' | 'male'
  style:    string
  age:      string
  desc:     string
  bg:       string
  voiceId:  string  // ElevenLabs voice ID
  didAvatarUrl?: string  // D-ID avatar URL
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id:'f-indo-young',  label:'Wanita Indo Muda',   icon:'👩',  gender:'female',
    style:'Indonesia casual', age:'18-25',
    desc:'Energik, relatable, cocok untuk fashion & beauty',
    bg:'#FEF3C7', voiceId:'21m00Tcm4TlvDq8ikWAM',
  },
  {
    id:'f-indo-mature', label:'Wanita Indo Mature',  icon:'👩‍🦱', gender:'female',
    style:'Indonesia professional', age:'25-35',
    desc:'Terpercaya, professional, cocok untuk kesehatan & UMKM',
    bg:'#ECFDF5', voiceId:'AZnzlk1XvdvUeBnXmlld',
  },
  {
    id:'f-hijab',       label:'Hijab Casual',        icon:'🧕',  gender:'female',
    style:'Hijab friendly', age:'18-30',
    desc:'Friendly, modest fashion, cocok untuk produk halal',
    bg:'#F5F3FF', voiceId:'EXAVITQu4vr4xnSDxMaL',
  },
  {
    id:'f-asia',        label:'Asian Trendy',        icon:'👩‍🦰', gender:'female',
    style:'Asian K-pop style', age:'18-25',
    desc:'Trendy, K-pop vibe, cocok untuk skincare & beauty',
    bg:'#FDF2F8', voiceId:'ErXwobaYiN019PkySvjV',
  },
  {
    id:'f-pro',         label:'Profesional Wanita',  icon:'👩‍💼', gender:'female',
    style:'Professional expert', age:'30-40',
    desc:'Expert, authoritative, cocok untuk gadget & B2B',
    bg:'#EFF6FF', voiceId:'MF3mGyEYCl7XYWbV9V6O',
  },
  {
    id:'m-indo-young',  label:'Pria Indo Muda',      icon:'👨',  gender:'male',
    style:'Indonesia casual', age:'18-25',
    desc:'Casual, bro energy, cocok untuk gadget & lifestyle',
    bg:'#FEF3C7', voiceId:'TxGEqnHWrfWFTfGW9XjX',
  },
  {
    id:'m-indo-mature', label:'Pria Indo Mature',    icon:'👨‍🦱', gender:'male',
    style:'Indonesia trusted', age:'25-35',
    desc:'Terpercaya, solid, cocok untuk produk keluarga',
    bg:'#ECFDF5', voiceId:'VR6AewLTigWG4xSOukaG',
  },
  {
    id:'m-pro',         label:'Profesional Pria',    icon:'👨‍💼', gender:'male',
    style:'Professional expert', age:'30-40',
    desc:'Expert authority, cocok untuk teknologi & investasi',
    bg:'#EFF6FF', voiceId:'pNInz6obpgDQGcFmaJgB',
  },
  {
    id:'m-casual',      label:'Kasual Pria',         icon:'🙋‍♂️', gender:'male',
    style:'Casual friendly', age:'18-25',
    desc:'Friendly, everyday vibe, cocok untuk F&B & hobi',
    bg:'#F0FDF4', voiceId:'yoZ06aMxZJJ28mfd3POQ',
  },
]

// ── Subtitle styles ───────────────────────────────────────────
export interface SubtitleStyleConfig {
  id:      SubtitleStyle
  label:   string
  icon:    string
  desc:    string
  preview: string  // CSS class hint / description
  color:   string
}

export const SUBTITLE_STYLES: SubtitleStyleConfig[] = [
  {
    id:'none',          label:'Tanpa Subtitle', icon:'🚫', color:'#6B7280',
    desc:'Tidak ada subtitle',
    preview:'',
  },
  {
    id:'tiktok-bold',   label:'TikTok Bold',    icon:'🔥', color:'#010101',
    desc:'Bold kapital putih dengan shadow hitam tebal — viral TikTok style',
    preview:'font-weight:900; color:#fff; text-shadow:3px 3px 0 #000; font-size:28px; text-transform:uppercase',
  },
  {
    id:'highlight-pop', label:'Highlight Pop',  icon:'✨', color:'#F59E0B',
    desc:'Kata penting di-highlight kuning/amber — eye-catching dan mudah dibaca',
    preview:'color:#fff; background:#F59E0B; border-radius:4px; padding:2px 6px; font-weight:700',
  },
  {
    id:'emoji-flow',    label:'Emoji Flow',     icon:'🎉', color:'#8B5CF6',
    desc:'Subtitle dengan emoji otomatis di setiap kalimat penting',
    preview:'color:#fff; font-weight:700; font-size:22px; + auto emoji injection',
  },
  {
    id:'minimal',       label:'Minimal Clean',  icon:'◻️', color:'#374151',
    desc:'Tipografi bersih, semi-transparent background, elegan',
    preview:'color:#fff; background:rgba(0,0,0,.5); border-radius:6px; padding:4px 12px',
  },
  {
    id:'neon',          label:'Neon Glow',      icon:'💡', color:'#06B6D4',
    desc:'Efek glow neon untuk TikTok cyber/trendy look',
    preview:'color:#00ffff; text-shadow:0 0 10px #00ffff, 0 0 20px #00ffff; font-weight:800',
  },
  {
    id:'karaoke',       label:'Karaoke Live',   icon:'🎤', color:'#EC4899',
    desc:'Kata berubah warna saat diucapkan, seperti karaoke real-time',
    preview:'word-by-word color change: white → yellow timing-synced',
  },
  {
    id:'manual',        label:'Manual Custom',  icon:'✍️', color:'#374151',
    desc:'Tulis subtitle sendiri dengan timing custom',
    preview:'custom input mode',
  },
]

// ── Slide layouts ─────────────────────────────────────────────
export interface SlideLayoutConfig {
  id:      SlideLayout
  label:   string
  icon:    string
  desc:    string
}

export const SLIDE_LAYOUTS: SlideLayoutConfig[] = [
  { id:'product-hero',   label:'Product Hero',    icon:'📸', desc:'Foto produk full screen + teks overlay bawah' },
  { id:'text-overlay',   label:'Text Overlay',    icon:'✍️', desc:'Teks animasi besar di atas foto produk' },
  { id:'split',          label:'Split Screen',    icon:'⚡', desc:'Foto kiri + info produk kanan' },
  { id:'list',           label:'Feature List',    icon:'✅', desc:'Bullet poin manfaat produk dengan animasi' },
  { id:'before-after',   label:'Before & After',  icon:'🔄', desc:'Sebelum & sesudah pakai produk' },
  { id:'countdown',      label:'Promo Countdown', icon:'⏰', desc:'Timer countdown untuk promo terbatas' },
]

// ── Transitions ───────────────────────────────────────────────
export const TRANSITIONS: { id:TransitionId; label:string; icon:string }[] = [
  { id:'fade',   label:'Fade',   icon:'🌅' },
  { id:'slide',  label:'Slide',  icon:'➡️' },
  { id:'zoom',   label:'Zoom',   icon:'🔍' },
  { id:'swipe',  label:'Swipe',  icon:'👆' },
  { id:'bounce', label:'Bounce', icon:'⚡' },
  { id:'glitch', label:'Glitch', icon:'💥' },
]

// ── Trending sounds database per niche ────────────────────────
export interface TrendingSound {
  id:       string
  title:    string
  artist:   string
  duration: number    // seconds
  mood:     string
  bpm:      number
  platform: PlatformId[]
  niches:   NicheId[]
  trending: boolean
  preview:  string    // URL (royalty-free)
  license:  'royalty-free' | 'commercial'
}

export const TRENDING_SOUNDS: TrendingSound[] = [
  // General viral
  { id:'s1', title:'Vibes Rising',     artist:'BeeSell Beats',  duration:30, mood:'energik',    bpm:128, platform:['tiktok','reels'], niches:['general','fashion','beauty'],  trending:true,  preview:'', license:'royalty-free' },
  { id:'s2', title:'Morning Flow',     artist:'Chill Studio',   duration:60, mood:'tenang',     bpm:90,  platform:['reels','shorts'],  niches:['beauty','health','home'],      trending:false, preview:'', license:'royalty-free' },
  { id:'s3', title:'Drop the Bass',    artist:'TikTok Trends',  duration:15, mood:'hype',       bpm:140, platform:['tiktok'],          niches:['gadget','fashion'],            trending:true,  preview:'', license:'royalty-free' },
  { id:'s4', title:'Luxury Ambience',  artist:'Premium Vibes',  duration:60, mood:'premium',    bpm:80,  platform:['reels','facebook'],niches:['home','fashion','beauty'],      trending:false, preview:'', license:'royalty-free' },
  { id:'s5', title:'Street Style',     artist:'Urban Beats',    duration:30, mood:'keren',      bpm:120, platform:['tiktok','reels'],  niches:['fashion','gadget','general'],  trending:true,  preview:'', license:'royalty-free' },
  { id:'s6', title:'Foodie Heaven',    artist:'Appetite Mix',   duration:30, mood:'menggugah',  bpm:100, platform:['tiktok','reels'],  niches:['food'],                        trending:true,  preview:'', license:'royalty-free' },
  { id:'s7', title:'Baby Soft',        artist:'Gentle Tones',   duration:60, mood:'lembut',     bpm:70,  platform:['reels','facebook'],niches:['baby','health'],                trending:false, preview:'', license:'royalty-free' },
  { id:'s8', title:'Promo Hype',       artist:'Sale Beats',     duration:15, mood:'urgent',     bpm:150, platform:['tiktok','shopee'],  niches:['general'],                     trending:true,  preview:'', license:'royalty-free' },
  { id:'s9', title:'Trendy Pop',       artist:'K-vibe Studio',  duration:30, mood:'fun',        bpm:115, platform:['tiktok','reels'],  niches:['beauty','fashion','baby'],     trending:true,  preview:'', license:'royalty-free' },
  { id:'s10',title:'Tech Future',      artist:'Digital Sound',  duration:30, mood:'futuristik', bpm:125, platform:['tiktok','shorts'],  niches:['gadget'],                      trending:false, preview:'', license:'royalty-free' },
  { id:'s11',title:'Herbal Nature',    artist:'Organic Waves',  duration:60, mood:'natural',    bpm:75,  platform:['reels','facebook'],niches:['health','food','baby'],         trending:false, preview:'', license:'royalty-free' },
  { id:'s12',title:'Viral Hook Loop',  artist:'BeeSell Beats',  duration:15, mood:'catchy',     bpm:135, platform:['tiktok'],          niches:['general','fashion','food'],    trending:true,  preview:'', license:'royalty-free' },
]

// Get recommended sounds for niche + platform
export function getRecommendedSounds(niche: NicheId, platform: PlatformId, duration: DurationSec): TrendingSound[] {
  return TRENDING_SOUNDS
    .filter(s =>
      (s.niches.includes(niche) || s.niches.includes('general')) &&
      s.platform.includes(platform) &&
      s.duration <= duration
    )
    .sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0))
    .slice(0, 6)
}

// ── Text animation presets ────────────────────────────────────
export const TEXT_ANIMATIONS = [
  { id:'fade-up',     label:'Fade Up',     icon:'⬆️' },
  { id:'bounce-in',   label:'Bounce In',   icon:'🏀' },
  { id:'typewriter',  label:'Typewriter',  icon:'⌨️' },
  { id:'zoom-in',     label:'Zoom In',     icon:'🔍' },
  { id:'slide-right', label:'Slide Right', icon:'➡️' },
  { id:'glitch',      label:'Glitch',      icon:'💥' },
]

// ── Duration configs ──────────────────────────────────────────
export interface DurationConfig {
  sec:       DurationSec
  label:     string
  icon:      string
  desc:      string
  maxSlides: number
  maxWords:  number
  idealFor:  string
}

export const DURATION_OPTIONS: DurationConfig[] = [
  { sec:15, label:'15 Detik', icon:'⚡', desc:'Hook kuat, single benefit, scroll-stopping', maxSlides:4,  maxWords:30,  idealFor:'Hook, promo flash, brand awareness' },
  { sec:30, label:'30 Detik', icon:'🎯', desc:'Optimal engagement, 2-3 benefit, platform default', maxSlides:7,  maxWords:70,  idealFor:'TikTok, Reels, review singkat' },
  { sec:60, label:'60 Detik', icon:'📖', desc:'Story lengkap, tutorial, review komprehensif', maxSlides:12, maxWords:140, idealFor:'YouTube Shorts, demo produk, tutorial' },
]

// ── Script templates per niche ────────────────────────────────
export function generateScriptTemplate(params: {
  niche:       NicheId
  productName: string
  benefit:     string
  cta:         string
  duration:    DurationSec
  platform:    PlatformId
}): string {
  const d = params.duration
  const templates: Record<NicheId, string[]> = {
    fashion:  [
      `Ini outfit ${params.productName} yang lagi viral banget!`,
      `${params.benefit} — cocok buat kamu yang suka tampil stylish.`,
      `Harga terjangkau, kualitas nggak murahan.`,
      d >= 30 ? `Udah ribuan yang pakai dan puas banget.` : '',
      `${params.cta}`,
    ],
    beauty:   [
      `Skincare yang lagi banyak diincar: ${params.productName}!`,
      `${params.benefit} dalam ${d >= 60 ? '14' : '7'} hari pemakaian.`,
      `Cocok buat semua jenis kulit — udah BPOM certified.`,
      d >= 30 ? `Rating 4.9 bintang dari ribuan pembeli.` : '',
      `${params.cta}`,
    ],
    food:     [
      `${params.productName} ini bikin ketagihan banget!`,
      `${params.benefit} — rasa autentik, bahan alami.`,
      d >= 30 ? `Sempurna buat cemilan seharian atau oleh-oleh.` : '',
      `${params.cta}`,
    ],
    gadget:   [
      `Review jujur ${params.productName} setelah 7 hari pakai.`,
      `${params.benefit} — spesifikasi dewa di harga yang masuk akal.`,
      d >= 30 ? `Cocok buat kamu yang butuh produktivitas lebih.` : '',
      `${params.cta}`,
    ],
    health:   [
      `Supplement yang lagi viral: ${params.productName}.`,
      `${params.benefit} — natural, aman, dan udah terbukti.`,
      d >= 30 ? `Dokter pun merekomendasikan bahan-bahannya.` : '',
      `${params.cta}`,
    ],
    home:     [
      `Room upgrade impian kamu ada di ${params.productName}!`,
      `${params.benefit} — aesthetic sekaligus fungsional.`,
      d >= 30 ? `Bahan premium, tahan lama, mudah dibersihkan.` : '',
      `${params.cta}`,
    ],
    baby:     [
      `Produk bayi yang bikin Bunda tenang: ${params.productName}.`,
      `${params.benefit} — aman untuk si kecil, teruji dermatologis.`,
      d >= 30 ? `Sudah dipercaya ribuan orang tua di Indonesia.` : '',
      `${params.cta}`,
    ],
    general:  [
      `Produk yang lagi banyak dicari: ${params.productName}!`,
      `${params.benefit}.`,
      d >= 30 ? `Kualitas terjamin, harga bersaing.` : '',
      `${params.cta}`,
    ],
  }
  return (templates[params.niche] ?? templates.general)
    .filter(Boolean)
    .join('\n\n')
}

// ── Slide text templates ──────────────────────────────────────
export function generateSlideTexts(params: {
  productName: string
  benefit:     string
  price:       string
  cta:         string
  duration:    DurationSec
  niche:       NicheId
}): { heading:string; sub:string }[] {
  const maxSlides = DURATION_OPTIONS.find(d => d.sec === params.duration)?.maxSlides ?? 7
  const templates = [
    { heading: `✨ ${params.productName}`, sub: 'Produk yang lagi viral!' },
    { heading: params.benefit, sub: 'Bukti nyata, bukan cuma klaim' },
    { heading: '⭐⭐⭐⭐⭐', sub: 'Rating 4.9 · Ribuan terjual' },
    { heading: `💰 Harga ${params.price}`, sub: 'Worth it banget!' },
    { heading: '🚀 PROMO HARI INI', sub: 'Gratis ongkir + bonus spesial' },
    { heading: params.cta, sub: 'Jangan sampai kehabisan! ⚠️' },
    { heading: '🐝 BeeSell AI', sub: 'Konten berkualitas dalam detik' },
  ]
  return templates.slice(0, maxSlides)
}

// ── Niche metadata ────────────────────────────────────────────
export const NICHES: { id:NicheId; label:string; icon:string }[] = [
  { id:'general', label:'Umum',     icon:'🏪' },
  { id:'fashion', label:'Fashion',  icon:'👗' },
  { id:'beauty',  label:'Beauty',   icon:'💄' },
  { id:'food',    label:'F&B',      icon:'🍜' },
  { id:'gadget',  label:'Gadget',   icon:'📱' },
  { id:'health',  label:'Kesehatan',icon:'🌿' },
  { id:'home',    label:'Home',     icon:'🏡' },
  { id:'baby',    label:'Baby',     icon:'👶' },
]