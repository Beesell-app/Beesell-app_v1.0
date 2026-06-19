// lib/campaign/types.ts
// ══════════════════════════════════════════════════════════════
// CAMPAIGN BUILDER AI — Types, Constants, Platform Configs
// ══════════════════════════════════════════════════════════════

// ── Platform IDs ──────────────────────────────────────────────
export type PlatformId =
  | 'meta'          // Facebook + Instagram (single campaign)
  | 'tiktok'        // TikTok Ads
  | 'google-display' // Google Display Network

// ── Ad copy types ─────────────────────────────────────────────
export type ObjectiveId =
  | 'awareness'     // Brand awareness, reach
  | 'traffic'       // Website clicks, landing page views
  | 'engagement'    // Likes, comments, shares, video views
  | 'leads'         // Lead gen form, WhatsApp, DM
  | 'sales'         // Conversions, purchases, ROAS

export type AudienceAgeRange =
  | '18-24' | '25-34' | '35-44' | '45-54' | '55+'

export type DeviceTarget  = 'all' | 'mobile' | 'desktop'
export type BidStrategy   = 'lowest-cost' | 'cost-cap' | 'bid-cap' | 'target-roas'

// ── Budget ─────────────────────────────────────────────────────
export interface BudgetConfig {
  total:       number   // total campaign budget IDR
  daily:       number   // computed daily (total / days)
  days:        number
  currency:    'IDR'
  type:        'daily' | 'lifetime'
}

// ── Audience ──────────────────────────────────────────────────
export interface AudienceConfig {
  ageRange:     AudienceAgeRange[]
  gender:       'all' | 'female' | 'male'
  interests:    string[]     // free-form interest tags
  locations:    string[]     // city / province names
  languages:    string[]     // ['id','en']
  customAudience?: string    // lookalike, retargeting description
  behaviors:    string[]     // e.g. "frequent online shoppers"
}

// ── Ad copy variant ────────────────────────────────────────────
export interface AdCopyVariant {
  id:           string
  label:        string       // 'Version A', 'Version B', ...
  headline:     string       // max 40 chars
  primaryText:  string       // max 125 chars
  description?: string       // max 30 chars (optional)
  cta:          string       // button label
  angle:        string       // copywriting angle used
  score?:       number       // predicted CTR score 0-100
}

// ── Creative variant ───────────────────────────────────────────
export interface CreativeVariant {
  id:           string
  label:        string
  type:         'image' | 'video' | 'carousel' | 'story'
  format:       string       // '1:1', '9:16', '1.91:1', '4:5'
  platform:     PlatformId[]
  presetId:     string       // enhancer preset to use
  promptText:   string       // generation prompt
  headline:     string       // paired headline
  description:  string       // visual concept description
  imageUrl?:    string       // generated image URL
  status:       'pending' | 'generating' | 'done' | 'failed'
}

// ── Ad set ─────────────────────────────────────────────────────
export interface AdSet {
  id:           string
  name:         string
  platform:     PlatformId
  objective:    ObjectiveId
  audience:     AudienceConfig
  budget:       BudgetConfig
  placements:   string[]
  bidStrategy:  BidStrategy
  startDate?:   string
  endDate?:     string
}

// ── Full campaign ──────────────────────────────────────────────
export interface Campaign {
  id:           string
  userId:       string
  name:         string
  productName:  string
  productUrl?:  string
  productImage?:string
  objective:    ObjectiveId
  platforms:    PlatformId[]

  // AI-generated structure
  adSets:       AdSet[]
  copyVariants: AdCopyVariant[]
  creativeVariants: CreativeVariant[]

  // Meta
  totalBudget:  number
  estimatedReach:{ min:number; max:number }
  estimatedCPM: number
  estimatedCTR: number
  aiInsights:   string[]

  status:       'draft' | 'ready' | 'active' | 'paused' | 'completed'
  createdAt:    string
  updatedAt:    string
}

// ── Platform configs ──────────────────────────────────────────
export interface PlatformConfig {
  id:           PlatformId
  label:        string
  icon:         string
  color:        string
  colorLt:      string
  desc:         string
  minBudget:    number   // IDR/day
  adFormats:    string[]
  placements:   string[]
  objectives:   ObjectiveId[]
  cpmRange:     { min:number; max:number }   // IDR
  ctrBenchmark: number                       // %
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id:          'meta',
    label:       'Meta Ads',
    icon:        '📘',
    color:       '#1877F2',
    colorLt:     '#EFF6FF',
    desc:        'Facebook + Instagram — Jangkauan terbesar di Indonesia',
    minBudget:   15000,
    adFormats:   ['Single Image','Carousel','Video','Story','Reels'],
    placements:  ['Facebook Feed','Instagram Feed','Instagram Story','Reels','Audience Network'],
    objectives:  ['awareness','traffic','engagement','leads','sales'],
    cpmRange:    { min:8000, max:35000 },
    ctrBenchmark:1.8,
  },
  {
    id:          'tiktok',
    label:       'TikTok Ads',
    icon:        '🎵',
    color:       '#010101',
    colorLt:     '#F3F4F6',
    desc:        'TikTok — Viral reach untuk audience muda Indonesia',
    minBudget:   50000,
    adFormats:   ['TopView','In-Feed Ad','Branded Hashtag','Spark Ads'],
    placements:  ['For You Page','Search','TikTok Shop'],
    objectives:  ['awareness','traffic','engagement','sales'],
    cpmRange:    { min:12000, max:60000 },
    ctrBenchmark:2.4,
  },
  {
    id:          'google-display',
    label:       'Google Display',
    icon:        '🔍',
    color:       '#4285F4',
    colorLt:     '#EFF6FF',
    desc:        'Google Display Network — Retargeting + Intent audiences',
    minBudget:   25000,
    adFormats:   ['Responsive Display','Banner','Smart Display'],
    placements:  ['Google Display Network','YouTube','Gmail'],
    objectives:  ['awareness','traffic','leads','sales'],
    cpmRange:    { min:5000, max:20000 },
    ctrBenchmark:0.46,
  },
]

// ── Objective configs ──────────────────────────────────────────
export const OBJECTIVES: Record<ObjectiveId, {
  label:   string
  icon:    string
  desc:    string
  kpi:     string
  color:   string
}> = {
  awareness: { label:'Brand Awareness',    icon:'📢', desc:'Kenalkan brand ke audience baru', kpi:'Reach & Impressions',         color:'#7C3AED' },
  traffic:   { label:'Traffic',            icon:'🖱️', desc:'Drive kunjungan ke website/toko', kpi:'Clicks & Landing Page Views', color:'#3B82F6' },
  engagement:{ label:'Engagement',         icon:'❤️', desc:'Tingkatkan interaksi konten',     kpi:'Likes, Comments, Shares',     color:'#EC4899' },
  leads:     { label:'Lead Generation',    icon:'📋', desc:'Kumpulkan data calon pelanggan',  kpi:'Cost Per Lead (CPL)',          color:'#F59E0B' },
  sales:     { label:'Conversions/Sales',  icon:'💰', desc:'Tingkatkan penjualan langsung',   kpi:'ROAS & Cost Per Purchase',     color:'#059669' },
}

// ── CTA options per platform ───────────────────────────────────
export const CTA_OPTIONS: Record<PlatformId, string[]> = {
  'meta':           ['Shop Now','Learn More','Sign Up','Contact Us','Order Now','Get Quote','Download','Book Now','Subscribe'],
  'tiktok':         ['Shop Now','Learn More','Visit Store','Order Now','Download','Sign Up'],
  'google-display': ['Shop Now','Learn More','Get Offer','Sign Up','Buy Now','Apply Now'],
}

// ── Copywriting angles ────────────────────────────────────────
export const COPY_ANGLES = [
  { id:'curiosity',   label:'Curiosity Gap',    icon:'🤔', desc:'Buat penasaran, jawaban ada setelah klik' },
  { id:'pain',        label:'Pain Point',       icon:'😤', desc:'Identifikasi masalah, tawarkan solusi' },
  { id:'social-proof',label:'Social Proof',     icon:'⭐', desc:'Rating, testimonial, jumlah pembeli' },
  { id:'urgency',     label:'Urgency/Scarcity', icon:'⏰', desc:'Batas waktu, stok terbatas, last chance' },
  { id:'benefit',     label:'Benefit-led',      icon:'✅', desc:'Highlight benefit konkret dan spesifik' },
  { id:'story',       label:'Micro-Story',      icon:'📖', desc:'Cerita singkat yang relatable' },
  { id:'contrast',    label:'Before/After',     icon:'🔄', desc:'Perbandingan keadaan sebelum & sesudah' },
  { id:'authority',   label:'Authority/Expert', icon:'👨‍⚕️', desc:'Klaim expertise, sertifikasi, atau dr rekomendasi' },
]

// ── Creative format specs ─────────────────────────────────────
export const CREATIVE_FORMATS = [
  { id:'feed-square',   ratio:'1:1',     w:1080, h:1080, platforms:['meta'],              label:'Feed Square',   desc:'Facebook & Instagram Feed' },
  { id:'feed-portrait', ratio:'4:5',     w:1080, h:1350, platforms:['meta'],              label:'Feed Portrait', desc:'Optimal reach di mobile' },
  { id:'story',         ratio:'9:16',    w:1080, h:1920, platforms:['meta','tiktok'],      label:'Story/Reels',   desc:'Full screen immersive' },
  { id:'landscape',     ratio:'1.91:1',  w:1200, h:628,  platforms:['meta','google-display'],label:'Landscape',  desc:'Link ads & Display Network' },
  { id:'tiktok-feed',   ratio:'9:16',    w:1080, h:1920, platforms:['tiktok'],             label:'TikTok In-Feed',desc:'Native TikTok format' },
  { id:'banner-leaderboard', ratio:'728:90',w:728,h:90,  platforms:['google-display'],    label:'Leaderboard',   desc:'728×90 Google Display' },
  { id:'banner-rectangle',   ratio:'300:250',w:300,h:250,platforms:['google-display'],    label:'Rectangle',     desc:'300×250 most used display' },
]

// ── Budget presets ─────────────────────────────────────────────
export const BUDGET_PRESETS = [
  { label:'Testing',   icon:'🔬', total:500_000,   days:7,  desc:'Rp500K · 7 hari · Test audience' },
  { label:'Starter',  icon:'🚀', total:1_500_000, days:14, desc:'Rp1,5Jt · 14 hari · Scale winner' },
  { label:'Growth',   icon:'📈', total:5_000_000, days:30, desc:'Rp5Jt · 30 hari · Full funnel' },
  { label:'Custom',   icon:'⚙️', total:0,         days:0,  desc:'Tentukan sendiri' },
]

// ── Helpers ───────────────────────────────────────────────────
export const fmtRp = (n: number) =>
  n >= 1_000_000 ? `Rp ${(n/1_000_000).toFixed(1)}Jt` :
  n >= 1_000     ? `Rp ${(n/1_000).toFixed(0)}K`      : `Rp ${n}`

export const fmtN = (n: number) =>
  n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` :
  n >= 1_000     ? `${(n/1_000).toFixed(0)}K`      : String(n)

export function estimateReach(budget: number, platform: PlatformId): { min:number; max:number } {
  const cfg = PLATFORMS.find(p => p.id === platform)!
  return {
    min: Math.floor(budget / cfg.cpmRange.max * 1000),
    max: Math.floor(budget / cfg.cpmRange.min * 1000),
  }
}

export function estimateCPM(platform: PlatformId): number {
  const cfg = PLATFORMS.find(p => p.id === platform)!
  return Math.floor((cfg.cpmRange.min + cfg.cpmRange.max) / 2)
}