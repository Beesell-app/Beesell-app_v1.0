// components/dashboard/studio-menu-config.ts
// ══════════════════════════════════════════════════════════════
// FEATURE REGISTRY — Single Source of Truth (SSoT)
//
// Semua fitur app didefinisikan DI SINI saja. Halaman Sidebar,
// Studio, Dashboard, dan Admin Feature Flag membaca dari file ini.
// Tambah fitur baru = tambah satu entry di FEATURES.
//
// Definisi statis (id, route, kategori, tier required) tinggal di file ini.
// Toggle ON/OFF dinamis (per tool, per tier) → feature_flags_db (Admin).
// Penggabungannya: lib/tools/access.ts.
// ══════════════════════════════════════════════════════════════

// ── Kategori utama ────────────────────────────────────────────
export const CATEGORY_ORDER = ['quick', 'writing', 'marketing', 'studio'] as const
export type Category = typeof CATEGORY_ORDER[number]

// Subkategori HANYA untuk 'studio' (image/video). Kategori lain undefined.
export type StudioSub = 'image' | 'video'
export type SubCategory = StudioSub | undefined

export const CATEGORY_INFO: Record<Category, {
  label: string
  emoji: string
  description: string
  gradient: string
}> = {
  quick: {
    label:       'Quick Tools',
    emoji:       '⚡',
    description: 'Tool cepat untuk editing foto produk',
    gradient:    'linear-gradient(135deg,#0284C7,#0EA5E9)',
  },
  writing: {
    label:       'Writing Tools',
    emoji:       '✍️',
    description: 'Copywriting AI untuk jualan',
    gradient:    'linear-gradient(135deg,#F97316,#FB923C)',
  },
  marketing: {
    label:       'Marketing Tools',
    emoji:       '📢',
    description: 'Campaign, audience, budget, analytics',
    gradient:    'linear-gradient(135deg,#2563EB,#3B82F6)',
  },
  studio: {
    label:       'Studio Tools',
    emoji:       '🎨',
    description: 'Konten visual & video AI',
    gradient:    'linear-gradient(135deg,#7C3AED,#EC4899)',
  },
}
/** Jumlah tool aktif — untuk teks marketing "X+ tools" */
export function getEnabledToolCount(): number {
  return FEATURES.filter(f => f.enabled !== false).length
}
/** Tool unggulan (badge POPULAR) untuk landing */
export function getFeaturedTools(): FeatureItem[] {
  return sortFeatures(FEATURES.filter(f => f.enabled !== false && f.badge === 'POPULAR'))
}
// Label untuk subkategori (dipakai sidebar untuk group dalam Studio)
export const SUB_INFO: Record<StudioSub, { label: string; emoji: string }> = {
  image: { label: 'Image AI', emoji: '🖼️' },
  video: { label: 'Video AI', emoji: '🎬' },
}

// ── Tier & badge ──────────────────────────────────────────────
export type Tier   = 'starter' | 'basic' | 'pro' | 'business'
export type Badge  = 'NEW' | 'BETA' | 'POPULAR' | 'PRO' | 'BUSINESS' | null
export type Role   = 'owner' | 'admin' | 'editor' | 'viewer'

// ── Bentuk item ───────────────────────────────────────────────
export interface FeatureItem {
  /** Stable ID — HARUS sama dengan tool_id di feature_flags_db */
  id:            string
  /** Nama tampil */
  name:          string
  /** Alias lama (sidebar/dashboard pakai `label`). Tetap diisi == name. */
  label:         string
  /** Deskripsi pendek (1 kalimat) */
  description:   string
  /** Ikon emoji */
  icon:          string
  /** URL tujuan */
  href:          string
  /** Kategori utama */
  category:      Category
  /** Subkategori (HANYA untuk category 'studio': 'image' | 'video') */
  subCategory?:  StudioSub
  /** Tier minimum yang bisa pakai */
  tierRequired:  Tier
  /** Pakai kredit per generate? (image/video AI yang berbayar) */
  isMetered:     boolean
  /** Jumlah kredit (kalau metered) */
  credit?:       number
  /** Badge tampilan */
  badge?:        Badge
  /** Role yang boleh akses (default: semua role bisa) */
  allowedRoles?: Role[]
  /** Urutan dalam kategori (kecil dulu); default = 100 */
  sortOrder?:    number
  /** Override hard-off di code (jarang dipakai — pakai admin feature flag) */
  enabled?:      boolean
}

// ══════════════════════════════════════════════════════════════
// REGISTRY — tambah/edit fitur di sini saja
// ══════════════════════════════════════════════════════════════
export const FEATURES: FeatureItem[] = [
  // ───────────── QUICK TOOLS ─────────────
  { id:'remove-bg',     name:'Remove Background', label:'Remove Background', description:'Hapus background foto produk otomatis dengan AI.', icon:'🗑️', href:'/quick-tools?t=remove-bg',     category:'quick', tierRequired:'starter', isMetered:false, badge:'POPULAR', sortOrder:10 },
  { id:'upscale',       name:'AI Upscale 4×',     label:'AI Upscale 4×',     description:'Perbesar foto hingga 4× resolusi tanpa blur.',     icon:'🔍', href:'/quick-tools?t=upscale',       category:'quick', tierRequired:'basic',   isMetered:false, sortOrder:20 },
  { id:'resize',        name:'Resize & Crop',     label:'Resize & Crop',     description:'Sesuaikan ukuran foto ke format platform.',         icon:'📐', href:'/quick-tools?t=resize',        category:'quick', tierRequired:'starter', isMetered:false, sortOrder:30 },
  { id:'relight',       name:'AI Relight',        label:'AI Relight',        description:'Perbaiki pencahayaan foto produk.',                  icon:'💡', href:'/quick-tools?t=relight',       category:'quick', tierRequired:'basic',   isMetered:false, badge:'BETA', sortOrder:40 },
  { id:'remove-object', name:'Remove Object',     label:'Remove Object',     description:'Hapus objek dari foto dengan brush AI inpaint.',     icon:'✏️', href:'/quick-tools?t=remove-object', category:'quick', tierRequired:'pro',     isMetered:true, credit:10, badge:'PRO', sortOrder:50 },
  { id:'subtitle',      name:'AI Subtitle',       label:'AI Subtitle',       description:'Generate subtitle otomatis untuk video.',           icon:'📝', href:'/quick-tools?t=subtitle',      category:'quick', tierRequired:'basic',   isMetered:false, sortOrder:60 },

  // ───────────── WRITING TOOLS ─────────────
  { id:'caption',       name:'Caption Generator', label:'Caption Generator', description:'Caption Instagram/TikTok siap post.',         icon:'✍️', href:'/marketing-kit?t=caption', category:'writing', tierRequired:'starter', isMetered:false, badge:'POPULAR', sortOrder:10 },
  { id:'hook',          name:'Hook Generator',    label:'Hook Generator',    description:'Hook 3 detik pertama untuk stop scroll.',     icon:'🎣', href:'/marketing-kit?t=hook',    category:'writing', tierRequired:'starter', isMetered:false, sortOrder:20 },
  { id:'hashtag',       name:'Hashtag AI',        label:'Hashtag AI',        description:'Hashtag relevan untuk reach maksimal.',        icon:'#️⃣', href:'/marketing-kit?t=hashtag', category:'writing', tierRequired:'starter', isMetered:false, sortOrder:30 },
  { id:'tiktok-script', name:'TikTok Script',     label:'TikTok Script',     description:'Naskah video TikTok 15-60 detik siap rekam.', icon:'🎵', href:'/studio/video/tiktok',     category:'writing', tierRequired:'basic',   isMetered:false, badge:'POPULAR', sortOrder:40 },

  // ───────────── MARKETING TOOLS ─────────────
  { id:'campaign-builder', name:'Campaign Builder', label:'Campaign Builder', description:'Generate struktur campaign Meta/TikTok/Google + copy.', icon:'📢', href:'/campaign',         category:'marketing', tierRequired:'pro',   isMetered:false, badge:'PRO', sortOrder:10 },
  { id:'audience-intel',   name:'Audience Intel',   label:'Audience Intel',   description:'Lookalike, interest mapping, dan retargeting pixel.',   icon:'🎯', href:'/audience',         category:'marketing', tierRequired:'pro',   isMetered:false, badge:'PRO', sortOrder:20 },
  { id:'budget-optimizer', name:'Budget Optimizer', label:'Budget Optimizer', description:'ROAS + smart allocation + daily guardian.',              icon:'💰', href:'/budget-optimizer', category:'marketing', tierRequired:'pro',   isMetered:false, badge:'PRO', sortOrder:30 },
  { id:'analytics',        name:'Analytics AI',     label:'Analytics AI',     description:'BeeScore™ 100pt + 10 section analytics + insights.',    icon:'📊', href:'/analytics',        category:'marketing', tierRequired:'basic', isMetered:false, badge:'NEW', sortOrder:40 },
  { id:'scheduler',        name:'Multi-Platform Scheduler', label:'Scheduler', description:'Jadwalkan posting ke 6 platform + best time AI.',       icon:'📅', href:'/scheduler',        category:'marketing', tierRequired:'basic', isMetered:false, badge:'NEW', sortOrder:50 },

  // ───────────── STUDIO — Image ─────────────
  { id:'ai-image-generator', name:'AI Visual Marketing Engine', label:'AI Visual Marketing Engine', description:'Generate foto produk, banner & konten visual dari teks.', icon:'🖼️', href:'/content/new',                category:'studio', subCategory:'image', tierRequired:'starter', isMetered:true, credit:5,  badge:'POPULAR', sortOrder:5 },
  { id:'packshot',           name:'AI Packshot',        label:'AI Packshot',        description:'Foto produk studio quality dalam 30 detik.',             icon:'📦', href:'/studio/image/packshot',         category:'studio', subCategory:'image', tierRequired:'starter', isMetered:true, credit:5,  badge:'POPULAR', sortOrder:10 },
  { id:'enhancer',           name:'Product Enhancer',   label:'Product Enhancer',   description:'20 preset visual iklan untuk foto produk.',               icon:'✨', href:'/studio/image/enhancer',         category:'studio', subCategory:'image', tierRequired:'basic',   isMetered:false, sortOrder:20 },
  { id:'product-to-model',   name:'Product to Model',   label:'Product to Model',   description:'Ubah produk jadi foto bersama model AI.',                 icon:'🧑', href:'/studio/image/product-to-model', category:'studio', subCategory:'image', tierRequired:'pro',     isMetered:true, credit:5,  badge:'PRO', sortOrder:30 },
  { id:'virtual-tryon',      name:'Virtual Try-On',     label:'Virtual Try-On',     description:'Coba baju/aksesori di model virtual.',                    icon:'👔', href:'/studio/image/virtual-tryon',    category:'studio', subCategory:'image', tierRequired:'pro',     isMetered:true, credit:10, badge:'PRO', sortOrder:40 },
  { id:'face-swap',          name:'Face Swap',          label:'Face Swap',          description:'Ganti wajah model dengan wajah referensi, outfit tetap.', icon:'😊', href:'/studio/image/face-swap',        category:'studio', subCategory:'image', tierRequired:'pro',     isMetered:true, credit:8,  badge:'PRO', sortOrder:50 },
  { id:'model-swap',         name:'Model Swap',         label:'Model Swap',         description:'Ganti model di foto fashion, pertahankan outfit & pose.', icon:'🔄', href:'/studio/image/model-swap',       category:'studio', subCategory:'image', tierRequired:'pro',     isMetered:true, credit:8,  badge:'PRO', sortOrder:60 },

  // ───────────── STUDIO — Video ─────────────
  { id:'ugc-generator',  name:'UGC Video Generator', label:'UGC Video Generator', description:'Video creator-style buatan AI untuk produkmu.', icon:'🎬', href:'/studio/video/ugc',          category:'studio', subCategory:'video', tierRequired:'pro',      isMetered:true, credit:30, badge:'PRO', sortOrder:10 },
  { id:'image-to-video', name:'Image to Video',      label:'Image to Video',      description:'Foto produk → video animasi singkat.',          icon:'🎥', href:'/studio/video/generator',    category:'studio', subCategory:'video', tierRequired:'pro',      isMetered:true, credit:35, badge:'PRO', sortOrder:20 },
  { id:'talking-head',   name:'Talking Head',        label:'Talking Head',        description:'Avatar AI bicara untuk testimoni/iklan.',       icon:'🗣️', href:'/studio/video/talking-head', category:'studio', subCategory:'video', tierRequired:'business', isMetered:true, credit:20, badge:'BUSINESS', sortOrder:30 },
]

// ══════════════════════════════════════════════════════════════
// BACKWARD COMPAT — alias agar import lama tetap jalan
// ══════════════════════════════════════════════════════════════
/** @deprecated gunakan `FeatureItem` */
export type StudioMenuItem = FeatureItem

// ══════════════════════════════════════════════════════════════
// SELECTOR / HELPER (server-side aman; tidak ada hook React)
// ══════════════════════════════════════════════════════════════

const TIER_ORDER: Record<Tier, number> = { starter:0, basic:1, pro:2, business:3 }

/** Apakah user dengan `userTier` memenuhi `required`? */
export function meetsTier(userTier: string, required: Tier): boolean {
  return (TIER_ORDER[userTier as Tier] ?? 0) >= (TIER_ORDER[required] ?? 0)
}

/** Filter fitur menurut role */
export function rolePermits(item: FeatureItem, role?: string): boolean {
  if (!item.allowedRoles || item.allowedRoles.length === 0) return true
  return item.allowedRoles.includes((role ?? 'viewer') as Role)
}

/** Apakah item ini bisa muncul untuk user (gabungan: enabled override + role) */
export function isFeatureVisible(item: FeatureItem, role?: string): boolean {
  if (item.enabled === false) return false
  return rolePermits(item, role)
}

/** Sort: by sortOrder lalu name */
export function sortFeatures(items: FeatureItem[]): FeatureItem[] {
  return [...items].sort((a, b) => {
    const so = (a.sortOrder ?? 100) - (b.sortOrder ?? 100)
    return so !== 0 ? so : a.name.localeCompare(b.name)
  })
}

/** Group fitur menurut kategori utama (preserves CATEGORY_ORDER) */
export function getMenuByCategory(
  items: FeatureItem[] = FEATURES,
): Record<Category, FeatureItem[]> {
  const out = { quick:[], writing:[], marketing:[], studio:[] } as Record<Category, FeatureItem[]>
  for (const f of items) out[f.category]?.push(f)
  for (const k of CATEGORY_ORDER) out[k] = sortFeatures(out[k])
  return out
}

/** Group fitur Studio menurut subkategori (image/video) */
export function getStudioBySub(items: FeatureItem[] = FEATURES): Record<StudioSub, FeatureItem[]> {
  const out: Record<StudioSub, FeatureItem[]> = { image: [], video: [] }
  for (const f of items) {
    if (f.category !== 'studio') continue
    const sub = f.subCategory ?? 'image'
    out[sub].push(f)
  }
  out.image = sortFeatures(out.image)
  out.video = sortFeatures(out.video)
  return out
}

/** Cari satu fitur by id */
export function getFeatureById(id: string): FeatureItem | undefined {
  return FEATURES.find(f => f.id === id)
}

// ── Alias backward-compat untuk import lama ───────────────────
/** @deprecated gunakan getMenuByCategory */
export const getStudioMenuByCategory = getMenuByCategory