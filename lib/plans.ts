// lib/plans.ts
// ══════════════════════════════════════════════════════════════
// BEESELL AI — PRICING SINGLE SOURCE OF TRUTH
// ══════════════════════════════════════════════════════════════
//
// COST BASIS (per generate, USD):
//   Standard image (SDXL/Packshot): $0.02
//   Video (Replicate):              $0.10
//   Try-On (IDM-VTON):              $0.05
//   Face/Model Swap:                $0.04
//   Quick Tools (Remove BG, etc):   $0.003
//
// TARGET MARGIN: 45-60% net per paying plan
//   Basic    cost ~Rp 72K → price Rp 149K → margin 51.7%
//   Pro      cost ~Rp160K → price Rp 399K → margin 59.9%
//   Business cost ~Rp440K → price Rp 999K → margin 56.0%
//
// STARTER: 5 generate TOTAL seumur hidup, 1 email + 1 no HP
//          Max loss ~Rp 9K/user — acceptable acquisition cost

// ── Types ────────────────────────────────────────────────────
export type PlanId = 'starter' | 'basic' | 'pro' | 'business'
export type AddOnId =
  | 'video-5'
  | 'video-10'
  | 'tryon-20'
  | 'face-swap-10'
  | 'topup-50'
  | 'topup-200'
  | 'bulk-engine'
  | 'scheduler'
  | 'api-access'
  | 'white-label'

export interface FeatureAccess {
  // ── Quick Tools ─────────────────────────
  removeBg:         boolean | 'limited'   // Remove Background
  upscale:          boolean | '2x' | '4x' // AI Upscale
  resize:           boolean | number       // Resize (true=all, number=preset count)
  relight:          boolean                // AI Relight
  removeObject:     boolean                // Remove Object

  // ── AI Image Generator ──────────────────
  photoshoot:       boolean                // AI Product Photoshoot
  packshot:         boolean                // AI Packshot Generator
  productToModel:   boolean                // Product to Model AI
  tryon:            boolean                // AI Try-On Fashion
  modelSwap:        boolean                // Model Swap AI
  faceSwap:         boolean                // Face Swap AI
  enhancer:         boolean                // Product Enhancer AI

  // ── AI Video Generator ──────────────────
  videoProduct:     boolean                // Product Video AI
  videoUgc:         boolean                // UGC Video Generator
  videoTiktok:      boolean                // TikTok Reels AI

  // ── Marketing Tools ─────────────────────
  captionGenerator: boolean
  hookGenerator:    boolean
  ctaGenerator:     boolean
  productDesc:      boolean
  hashtagGenerator: boolean
  adCopy:           boolean

  // ── Platform Features ───────────────────
  watermark:        boolean                // true = ada watermark
  resultPage:       boolean                // before/after result page
  assetLibrary:     boolean
  scheduler:        boolean                // auto-post scheduler
  bulkEngine:       boolean
  teamWorkspace:    boolean
  apiAccess:        boolean
  whiteLabel:       boolean
  brandCenter:      boolean
  analytics:        boolean
}

export interface PlanQuota {
  // Monthly limits (Starter = total lifetime)
  imgGenerates:       number    // standard image generates
  videoGenerates:     number    // video generates (Replicate)
  tryonGenerates:     number    // try-on generates
  quickToolsPerDay:   number    // remove bg, upscale, resize per day
  teamSeats:          number    // team members
  storageGB:          number    // asset library storage
  isLifetime:         boolean   // true = kuota adalah lifetime total, bukan per bulan
}

export interface Plan {
  id:          PlanId
  name:        string
  price:       number        // IDR per bulan (0 = gratis)
  period:      string
  badge?:      string
  highlight:   boolean
  cta:         string
  href:        string
  tagline:     string        // one-liner untuk pricing card
  creditNote:  string        // info kredit
  costPerMonth:number        // estimated IDR cost to us (for tracking)
  marginPct:   number        // net margin %
  quota:       PlanQuota
  features:    FeatureAccess
  restrictions: string[]     // list batasan yang perlu diketahui user
}

// ══════════════════════════════════════════════════════════════
// PLAN DEFINITIONS
// ══════════════════════════════════════════════════════════════

export const PLANS: Record<PlanId, Plan> = {

  // ── STARTER — Gratis ─────────────────────────────────────────
  starter: {
    id: 'starter', name: 'Starter', price: 0,
    period: 'selamanya', badge: undefined, highlight: false,
    cta: 'Coba Gratis', href: '/register',
    tagline: 'Coba BeeSell AI — 5 generate seumur hidup',
    creditNote: '5 generate total (lifetime)',
    costPerMonth: 9_000,   // Rp 9K max loss per user
    marginPct: 0,          // loss leader

    quota: {
      imgGenerates:     5,
      videoGenerates:   0,
      tryonGenerates:   0,
      quickToolsPerDay: 3,   // remove bg max 3 per hari
      teamSeats:        1,
      storageGB:        0.5,
      isLifetime:       true, // TOTAL lifetime, bukan per bulan
    },

    features: {
      removeBg:         'limited', // 3x/hari, ada watermark
      upscale:          '2x',      // hanya 2x, bukan 4K
      resize:           3,         // hanya 3 preset (Shopee, Instagram, TikTok)
      relight:          false,
      removeObject:     false,
      photoshoot:       false,
      packshot:         false,
      productToModel:   false,
      tryon:            false,
      modelSwap:        false,
      faceSwap:         false,
      enhancer:         false,
      videoProduct:     false,
      videoUgc:         false,
      videoTiktok:      false,
      captionGenerator: false,
      hookGenerator:    false,
      ctaGenerator:     false,
      productDesc:      false,
      hashtagGenerator: false,
      adCopy:           false,
      watermark:        true,   // WAJIB watermark
      resultPage:       false,
      assetLibrary:     false,
      scheduler:        false,
      bulkEngine:       false,
      teamWorkspace:    false,
      apiAccess:        false,
      whiteLabel:       false,
      brandCenter:      false,
      analytics:        false,
    },

    restrictions: [
      'Hanya 5 generate total — TIDAK reset per bulan',
      '1 akun per nomor HP + 1 email (verifikasi keduanya)',
      'Semua hasil memiliki watermark BeeSell AI',
      'Tidak bisa akses AI Image Generator premium',
      'Tidak bisa download tanpa watermark',
    ],
  },

  // ── BASIC — Rp 149.000/bln ───────────────────────────────────
  basic: {
    id: 'basic', name: 'Basic', price: 149_000,
    period: 'per bulan', badge: '🐝 Untuk UMKM', highlight: false,
    cta: 'Coba 7 Hari Gratis', href: '/register?plan=basic',
    tagline: 'Untuk seller aktif yang butuh konten harian',
    creditNote: '200 generate/bulan',
    costPerMonth: 72_000,  // API Rp64K + overhead Rp8K
    marginPct: 51.7,

    quota: {
      imgGenerates:     200,
      videoGenerates:   0,
      tryonGenerates:   0,
      quickToolsPerDay: 20,
      teamSeats:        1,
      storageGB:        5,
      isLifetime:       false,
    },

    features: {
      removeBg:         true,
      upscale:          '4x',    // sudah bisa 4K
      resize:           true,    // semua 20 preset
      relight:          true,
      removeObject:     true,
      photoshoot:       true,    // ✅
      packshot:         true,    // ✅
      productToModel:   false,   // ❌ perlu Pro
      tryon:            false,   // ❌ perlu Pro
      modelSwap:        false,   // ❌
      faceSwap:         false,   // ❌
      enhancer:         true,    // ✅
      videoProduct:     false,   // ❌
      videoUgc:         false,   // ❌
      videoTiktok:      false,   // ❌
      captionGenerator: true,
      hookGenerator:    true,
      ctaGenerator:     true,
      productDesc:      true,
      hashtagGenerator: true,
      adCopy:           false,   // ❌ Pro only
      watermark:        false,   // tanpa watermark
      resultPage:       true,    // before/after result page
      assetLibrary:     true,
      scheduler:        false,
      bulkEngine:       false,
      teamWorkspace:    false,
      apiAccess:        false,
      whiteLabel:       false,
      brandCenter:      false,
      analytics:        false,
    },

    restrictions: [
      'Video Generator tidak tersedia — upgrade ke Pro',
      'Product to Model & Try-On tidak tersedia — upgrade ke Pro',
      'Face Swap & Model Swap tidak tersedia',
      'Ad Copy Generator tidak tersedia',
      'Tidak ada team workspace — akun individual',
    ],
  },

  // ── PRO — Rp 399.000/bln ─────────────────────────────────────
  pro: {
    id: 'pro', name: 'Pro', price: 399_000,
    period: 'per bulan', badge: '🔥 Terlaris', highlight: true,
    cta: 'Coba 7 Hari Gratis', href: '/register?plan=pro',
    tagline: 'Untuk seller serius & content creator yang scale',
    creditNote: '400 img + 5 video + 20 try-on/bulan',
    costPerMonth: 160_000, // $10 = Rp160K
    marginPct: 59.9,

    quota: {
      imgGenerates:     400,
      videoGenerates:   5,
      tryonGenerates:   20,
      quickToolsPerDay: 50,
      teamSeats:        1,
      storageGB:        20,
      isLifetime:       false,
    },

    features: {
      removeBg:         true,
      upscale:          '4x',
      resize:           true,
      relight:          true,
      removeObject:     true,
      photoshoot:       true,
      packshot:         true,
      productToModel:   true,   // ✅ 16 model Indonesia
      tryon:            true,   // ✅ IDM-VTON
      modelSwap:        true,   // ✅
      faceSwap:         true,   // ✅
      enhancer:         true,
      videoProduct:     true,   // ✅ 5 video/bln
      videoUgc:         true,
      videoTiktok:      true,
      captionGenerator: true,
      hookGenerator:    true,
      ctaGenerator:     true,
      productDesc:      true,
      hashtagGenerator: true,
      adCopy:           true,   // ✅
      watermark:        false,
      resultPage:       true,
      assetLibrary:     true,
      scheduler:        false,  // add-on / phase 2
      bulkEngine:       false,  // Business only
      teamWorkspace:    false,  // Business only
      apiAccess:        false,
      whiteLabel:       false,
      brandCenter:      false,
      analytics:        true,   // basic analytics
    },

    restrictions: [
      'Video Generator: 5 video/bulan — tambah via Video Add-on',
      'Try-On: 20 generate/bulan — tambah via Try-On Add-on',
      'Tidak ada team workspace — akun individual',
      'Tidak ada Bulk Engine — Business only',
      'Scheduler masih dalam pengembangan (Phase 2)',
    ],
  },

  // ── BUSINESS — Rp 999.000/bln ────────────────────────────────
  business: {
    id: 'business', name: 'Business', price: 999_000,
    period: 'per bulan', badge: undefined, highlight: false,
    cta: 'Hubungi Sales', href: '/register?plan=business',
    tagline: 'Untuk agency, brand besar & tim konten',
    creditNote: '1.000 img + 20 video + 100 try-on/bulan',
    costPerMonth: 440_000, // $27.5 = Rp440K
    marginPct: 56.0,

    quota: {
      imgGenerates:     1_000,
      videoGenerates:   20,
      tryonGenerates:   100,
      quickToolsPerDay: 200,
      teamSeats:        5,
      storageGB:        100,
      isLifetime:       false,
    },

    features: {
      removeBg:         true,
      upscale:          '4x',
      resize:           true,
      relight:          true,
      removeObject:     true,
      photoshoot:       true,
      packshot:         true,
      productToModel:   true,
      tryon:            true,
      modelSwap:        true,
      faceSwap:         true,
      enhancer:         true,
      videoProduct:     true,
      videoUgc:         true,
      videoTiktok:      true,
      captionGenerator: true,
      hookGenerator:    true,
      ctaGenerator:     true,
      productDesc:      true,
      hashtagGenerator: true,
      adCopy:           true,
      watermark:        false,
      resultPage:       true,
      assetLibrary:     true,
      scheduler:        true,   // ✅ auto-post (phase 2)
      bulkEngine:       true,   // ✅ 100 produk/batch
      teamWorkspace:    true,   // ✅ 5 seat
      apiAccess:        true,   // ✅
      whiteLabel:       true,   // ✅
      brandCenter:      true,   // ✅
      analytics:        true,
    },

    restrictions: [
      'Fair Usage Policy: hard cap 1.000 img/1.000 + 20 video/bln',
      'Penggunaan di luar kuota → beli Add-on atau hubungi sales',
      'Scheduler & Bulk Engine tersedia saat Phase 2 live (Q2 2025)',
      'White Label: setup minimal 3 bulan berlangganan',
    ],
  },
}

// ══════════════════════════════════════════════════════════════
// ADD-ON DEFINITIONS
// ══════════════════════════════════════════════════════════════
export interface AddOn {
  id:          AddOnId
  label:       string
  icon:        string
  desc:        string
  price:       number     // IDR
  costToUs:    number     // IDR
  marginPct:   number
  qty:         string     // "5 video", "20 generate", dll
  compatible:  PlanId[]   // plan yang bisa beli add-on ini
  category:    'usage' | 'feature' | 'coming-soon'
  etaPhase?:   string
}

export const ADDONS: Record<AddOnId, AddOn> = {
  'video-5': {
    id: 'video-5', label: 'Video Pack — 5 Generate',
    icon: '🎬', qty: '5 video generate',
    desc: 'Tambah 5 generate video AI (Product Video, UGC, TikTok Reels).',
    price: 89_000, costToUs: 8_000, marginPct: 91,
    compatible: ['basic', 'pro', 'business'], category: 'usage',
  },
  'video-10': {
    id: 'video-10', label: 'Video Pack — 10 Generate',
    icon: '🎬', qty: '10 video generate',
    desc: 'Tambah 10 generate video AI. Hemat 25% dibanding beli per 5.',
    price: 149_000, costToUs: 16_000, marginPct: 89,
    compatible: ['basic', 'pro', 'business'], category: 'usage',
  },
  'tryon-20': {
    id: 'tryon-20', label: 'Try-On Pack — 20 Generate',
    icon: '👗', qty: '20 try-on generate',
    desc: 'Tambah 20 AI Try-On Fashion. Fitting otomatis pakaian ke model.',
    price: 99_000, costToUs: 16_000, marginPct: 84,
    compatible: ['basic', 'pro', 'business'], category: 'usage',
  },
  'face-swap-10': {
    id: 'face-swap-10', label: 'Face & Model Swap — 10 Generate',
    icon: '😊', qty: '10 face/model swap',
    desc: 'Ganti wajah atau model AI. Owner branding, affiliate ads.',
    price: 59_000, costToUs: 6_400, marginPct: 89,
    compatible: ['basic', 'pro', 'business'], category: 'usage',
  },
  'topup-50': {
    id: 'topup-50', label: 'Topup 50 Generate',
    icon: '⚡', qty: '50 image generate',
    desc: 'Tambah 50 standard image generate. Berlaku 30 hari.',
    price: 49_000, costToUs: 16_000, marginPct: 67,
    compatible: ['starter', 'basic', 'pro', 'business'], category: 'usage',
  },
  'topup-200': {
    id: 'topup-200', label: 'Topup 200 Generate',
    icon: '⚡', qty: '200 image generate',
    desc: 'Tambah 200 standard image generate. Hemat dibanding topup 50.',
    price: 149_000, costToUs: 64_000, marginPct: 57,
    compatible: ['starter', 'basic', 'pro', 'business'], category: 'usage',
  },
  'bulk-engine': {
    id: 'bulk-engine', label: 'Bulk Content Engine',
    icon: '⚡', qty: 'Batch 100 produk/bulan',
    desc: 'Generate 100 produk sekaligus dalam 1 batch. Untuk agency & reseller.',
    price: 299_000, costToUs: 80_000, marginPct: 73,
    compatible: ['pro'], category: 'coming-soon', etaPhase: 'Q3 2025 · Phase 3',
  },
  'scheduler': {
    id: 'scheduler', label: 'Auto-Post Scheduler',
    icon: '📅', qty: 'Semua platform',
    desc: 'Jadwalkan posting otomatis ke Instagram, TikTok, Shopee, Facebook.',
    price: 99_000, costToUs: 20_000, marginPct: 80,
    compatible: ['basic', 'pro'], category: 'coming-soon', etaPhase: 'Q2 2025 · Phase 2',
  },
  'api-access': {
    id: 'api-access', label: 'API Access',
    icon: '🔌', qty: '10.000 API call/bln',
    desc: 'Integrasikan BeeSell AI ke dalam platform atau aplikasi milikmu.',
    price: 499_000, costToUs: 100_000, marginPct: 80,
    compatible: ['pro', 'business'], category: 'coming-soon', etaPhase: 'Q4 2025 · Phase 4',
  },
  'white-label': {
    id: 'white-label', label: 'White Label',
    icon: '🏷️', qty: 'Custom branding',
    desc: 'Hapus branding BeeSell AI, ganti dengan brand milikmu.',
    price: 999_000, costToUs: 100_000, marginPct: 90,
    compatible: ['business'], category: 'coming-soon', etaPhase: 'Q4 2025 · Phase 4',
  },
}

// ── Helper functions ──────────────────────────────────────────

/** Check apakah feature tertentu tersedia di plan */
export function hasFeature(planId: PlanId, feature: keyof FeatureAccess): boolean | string | number {
  return PLANS[planId].features[feature]
}

/** Check apakah plan bisa akses suatu add-on */
export function canBuyAddon(planId: PlanId, addonId: AddOnId): boolean {
  return ADDONS[addonId].compatible.includes(planId)
}

/** Get plan label untuk UI */
export function getPlanLabel(planId: PlanId): string {
  const plan = PLANS[planId]
  return plan.price === 0 ? plan.name : `${plan.name} — Rp ${(plan.price/1000).toFixed(0)}K/bln`
}

/** Get quota display string */
export function getQuotaDisplay(planId: PlanId): string {
  const q = PLANS[planId].quota
  if (q.isLifetime) return `${q.imgGenerates} generate total (lifetime)`
  const parts = [`${q.imgGenerates} img/bln`]
  if (q.videoGenerates > 0)  parts.push(`${q.videoGenerates} video`)
  if (q.tryonGenerates > 0)  parts.push(`${q.tryonGenerates} try-on`)
  return parts.join(' + ')
}

// ── Exports for landing page (formatted arrays) ───────────────
export const PRICING_ARRAY = Object.values(PLANS)

export const ADDONS_USAGE    = Object.values(ADDONS).filter(a => a.category === 'usage')
export const ADDONS_COMINGSOON = Object.values(ADDONS).filter(a => a.category === 'coming-soon')