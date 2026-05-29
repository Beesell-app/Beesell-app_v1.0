// lib/resize/presets.ts
// Semua preset platform marketplace + social media untuk Resize Smart AI

export type FitMode = 'cover' | 'contain' | 'fill'
export type PaddingMode = 'white' | 'black' | 'transparent' | 'blur' | 'color'
export type ExportFormat = 'jpg' | 'png' | 'webp'
export type QualityMode  = 'high' | 'balanced' | 'small'

export interface ResizePreset {
  id:         string
  label:      string
  platform:   string
  category:   'marketplace' | 'social' | 'ads'
  w:          number
  h:          number
  fit:        FitMode
  maxSizeKB:  number       // platform max file size
  minSizeKB?: number
  ratio:      string       // display e.g. "1:1"
  icon:       string
  tips:       string
  bgDefault:  PaddingMode  // recommended background for this platform
  required:   boolean      // wajib untuk platform ini
  exportFmt:  ExportFormat
}

export const PRESETS: ResizePreset[] = [
  // ── MARKETPLACE ──────────────────────────────────────────────
  {
    id:'shopee', label:'Shopee Produk', platform:'Shopee', category:'marketplace',
    w:800, h:800, fit:'contain', ratio:'1:1', icon:'🛍️',
    maxSizeKB:2048, exportFmt:'jpg', bgDefault:'white', required:true,
    tips:'Background putih wajib untuk foto utama Shopee',
  },
  {
    id:'shopee-cover', label:'Shopee Cover', platform:'Shopee', category:'marketplace',
    w:1200, h:800, fit:'cover', ratio:'3:2', icon:'🛍️',
    maxSizeKB:3072, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Untuk cover toko Shopee — tampilan horizontal',
  },
  {
    id:'tokopedia', label:'Tokopedia Produk', platform:'Tokopedia', category:'marketplace',
    w:700, h:700, fit:'contain', ratio:'1:1', icon:'🛒',
    maxSizeKB:2048, exportFmt:'jpg', bgDefault:'white', required:true,
    tips:'Minimum 300×300, rekomendasi 700×700 untuk tampilan optimal',
  },
  {
    id:'lazada', label:'Lazada Produk', platform:'Lazada', category:'marketplace',
    w:800, h:800, fit:'contain', ratio:'1:1', icon:'📦',
    maxSizeKB:1024, exportFmt:'jpg', bgDefault:'white', required:true,
    tips:'Background putih wajib, objek mengisi 80% frame',
  },
  {
    id:'tiktok-shop', label:'TikTok Shop Produk', platform:'TikTok Shop', category:'marketplace',
    w:800, h:800, fit:'contain', ratio:'1:1', icon:'🎵',
    maxSizeKB:5120, exportFmt:'jpg', bgDefault:'white', required:true,
    tips:'Cocok untuk feed TikTok Shop — square format',
  },
  {
    id:'whatsapp-catalog', label:'WhatsApp Catalog', platform:'WhatsApp', category:'marketplace',
    w:800, h:800, fit:'contain', ratio:'1:1', icon:'💬',
    maxSizeKB:5120, exportFmt:'jpg', bgDefault:'white', required:true,
    tips:'Untuk katalog WhatsApp Business — square format',
  },
  // ── SOCIAL MEDIA ─────────────────────────────────────────────
  {
    id:'instagram-sq', label:'Instagram Feed Square', platform:'Instagram', category:'social',
    w:1080, h:1080, fit:'cover', ratio:'1:1', icon:'📸',
    maxSizeKB:8192, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format paling populer untuk feed Instagram',
  },
  {
    id:'instagram-port', label:'Instagram Feed Portrait', platform:'Instagram', category:'social',
    w:1080, h:1350, fit:'cover', ratio:'4:5', icon:'📸',
    maxSizeKB:8192, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format portrait lebih banyak ruang di feed — lebih engaging',
  },
  {
    id:'instagram-land', label:'Instagram Feed Landscape', platform:'Instagram', category:'social',
    w:1080, h:566, fit:'cover', ratio:'1.91:1', icon:'📸',
    maxSizeKB:8192, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format landscape untuk foto panorama atau produk wide',
  },
  {
    id:'instagram-story', label:'Instagram Story', platform:'Instagram', category:'social',
    w:1080, h:1920, fit:'cover', ratio:'9:16', icon:'📸',
    maxSizeKB:8192, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Full-screen story — pastikan konten utama di area tengah',
  },
  {
    id:'tiktok-post', label:'TikTok Post', platform:'TikTok', category:'social',
    w:1080, h:1350, fit:'cover', ratio:'4:5', icon:'🎵',
    maxSizeKB:10240, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Ukuran optimal untuk foto post TikTok',
  },
  {
    id:'tiktok-story', label:'TikTok Story / Reels', platform:'TikTok', category:'social',
    w:1080, h:1920, fit:'cover', ratio:'9:16', icon:'🎵',
    maxSizeKB:10240, exportFmt:'jpg', bgDefault:'black', required:false,
    tips:'Format vertical penuh untuk TikTok video thumbnail & story',
  },
  {
    id:'facebook-post', label:'Facebook Post', platform:'Facebook', category:'social',
    w:1200, h:630, fit:'cover', ratio:'1.91:1', icon:'👥',
    maxSizeKB:4096, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format standar untuk post Facebook — horizontal',
  },
  {
    id:'facebook-story', label:'Facebook Story', platform:'Facebook', category:'social',
    w:1080, h:1920, fit:'cover', ratio:'9:16', icon:'👥',
    maxSizeKB:4096, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Full-screen story Facebook',
  },
  {
    id:'youtube-thumb', label:'YouTube Thumbnail', platform:'YouTube', category:'social',
    w:1280, h:720, fit:'cover', ratio:'16:9', icon:'▶️',
    maxSizeKB:2048, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Resolusi HD standar YouTube — 1280×720 minimum',
  },
  {
    id:'pinterest', label:'Pinterest Pin', platform:'Pinterest', category:'social',
    w:1000, h:1500, fit:'cover', ratio:'2:3', icon:'📌',
    maxSizeKB:10240, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format vertikal 2:3 paling optimal untuk Pinterest',
  },
  {
    id:'twitter-post', label:'X / Twitter Post', platform:'X (Twitter)', category:'social',
    w:1200, h:675, fit:'cover', ratio:'16:9', icon:'𝕏',
    maxSizeKB:5120, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format landscape 16:9 untuk post X/Twitter',
  },
  {
    id:'linkedin-post', label:'LinkedIn Post', platform:'LinkedIn', category:'social',
    w:1200, h:627, fit:'cover', ratio:'1.91:1', icon:'💼',
    maxSizeKB:5120, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format profesional untuk LinkedIn feed',
  },
  // ── ADS ───────────────────────────────────────────────────────
  {
    id:'facebook-ads-sq', label:'Facebook Ads Square', platform:'Facebook Ads', category:'ads',
    w:1080, h:1080, fit:'cover', ratio:'1:1', icon:'📈',
    maxSizeKB:30720, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format square untuk Facebook & Instagram Ads — CTR terbaik',
  },
  {
    id:'facebook-ads-rect', label:'Facebook Ads Rectangle', platform:'Facebook Ads', category:'ads',
    w:1200, h:628, fit:'cover', ratio:'1.91:1', icon:'📈',
    maxSizeKB:30720, exportFmt:'jpg', bgDefault:'white', required:false,
    tips:'Format landscape untuk News Feed Ads',
  },
  {
    id:'tiktok-ads', label:'TikTok Ads', platform:'TikTok Ads', category:'ads',
    w:1080, h:1920, fit:'cover', ratio:'9:16', icon:'🎯',
    maxSizeKB:10240, exportFmt:'jpg', bgDefault:'black', required:false,
    tips:'Full-screen TikTok ads — vertical format',
  },
]

export const PRESET_MAP = Object.fromEntries(PRESETS.map(p => [p.id, p]))

export const CATEGORIES = {
  marketplace: { label: 'Marketplace', icon: '🛍️', color: '#2563EB' },
  social:      { label: 'Social Media', icon: '📱', color: '#7C3AED' },
  ads:         { label: 'Iklan / Ads', icon: '📈', color: '#D97706' },
} as const

export const POPULAR_PRESETS = [
  'shopee','tokopedia','instagram-sq','instagram-story','tiktok-story',
  'facebook-post','whatsapp-catalog','youtube-thumb',
]

export function getPresetsByCategory(cat: keyof typeof CATEGORIES) {
  return PRESETS.filter(p => p.category === cat)
}

export function validateCompliance(
  preset: ResizePreset,
  fileSizeKB: number,
  width: number,
  height: number,
): { ok: boolean; issues: string[] } {
  const issues: string[] = []
  if (fileSizeKB > preset.maxSizeKB) {
    issues.push(`File size ${fileSizeKB}KB melebihi limit ${preset.maxSizeKB}KB platform`)
  }
  if (width < preset.w * 0.9 || height < preset.h * 0.9) {
    issues.push(`Resolusi ${width}×${height} di bawah standar ${preset.w}×${preset.h}`)
  }
  return { ok: issues.length === 0, issues }
}

export function getQualitySettings(mode: QualityMode) {
  return {
    high:     { jpg: 95, png: 9,  webp: 90 },
    balanced: { jpg: 85, png: 6,  webp: 80 },
    small:    { jpg: 72, png: 3,  webp: 65 },
  }[mode]
}