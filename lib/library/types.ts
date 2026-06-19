// lib/library/types.ts
// ══════════════════════════════════════════════════════════════
// ASSET LIBRARY — Types, Constants, Tool Registry
// ══════════════════════════════════════════════════════════════

// ── Asset types ───────────────────────────────────────────────
export type AssetType =
  // Image AI
  | 'image' | 'packshot' | 'photoshoot' | 'product-to-model'
  | 'tryon' | 'model-swap' | 'face-swap' | 'enhancer'
  // Quick Tools
  | 'remove-bg' | 'upscale' | 'resize' | 'relight' | 'remove-object'
  // Video AI
  | 'video' | 'ugc-video' | 'image-to-video'
  // Marketing Kit
  | 'caption' | 'hook' | 'cta' | 'description' | 'hashtag'
  | 'ad-copy' | 'wa-reply' | 'soft-selling' | 'hard-selling'
  | 'marketplace-copy' | 'headline' | 'bio'
  | 'other'

export type AssetMediaKind = 'image' | 'video' | 'text'
export type FilterTab = 'all' | 'image' | 'video' | 'text' | 'liked'
export type SortBy  = 'newest' | 'oldest' | 'size' | 'type'
export type ExportFormat = 'original' | 'jpeg' | 'png' | 'webp'

// ── Asset record (from DB) ────────────────────────────────────
export interface Asset {
  id:              string
  user_id:         string
  type:            AssetType
  tool_name:       string
  title:           string | null
  file_url:        string | null
  file_size_bytes: number
  file_format:     string | null
  width:           number | null
  height:          number | null
  duration_sec:    number | null
  text_content:    string | null
  prompt:          string | null
  source_urls:     string[] | null
  preset_used:     string | null
  parameters:      Record<string, unknown>
  is_liked:        boolean
  download_count:  number
  tags:            string[]
  expires_at:      string | null
  expiry_warned:   boolean
  is_deleted:      boolean
  created_at:      string
  collection_ids:  string[] | null
}

// ── Collection record ─────────────────────────────────────────
export interface Collection {
  id:          string
  user_id:     string
  name:        string
  description: string | null
  cover_url:   string | null
  item_count:  number
  color:       string
  is_pinned:   boolean
  created_at:  string
  updated_at:  string
}

// ── Storage usage ─────────────────────────────────────────────
export interface StorageUsage {
  user_id:         string
  used_bytes:      number
  limit_bytes:     number
  asset_count:     number
  image_count:     number
  video_count:     number
  text_count:      number
  pct_used:        number
  available_bytes: number
}

// ── Pagination ────────────────────────────────────────────────
export interface PaginatedAssets {
  items:      Asset[]
  total:      number
  page:       number
  perPage:    number
  totalPages: number
}

// ── Export settings ───────────────────────────────────────────
export interface ExportSettings {
  format:  ExportFormat
  quality: number   // 1-100
}

// ── Notification types ────────────────────────────────────────
export type NotificationType =
  | 'storage_80pct' | 'storage_95pct' | 'storage_full'
  | 'plan_expiry_14days' | 'plan_expiry_3days' | 'plan_expiry_1day' | 'plan_expired'
  | 'assets_expiry_warning' | 'assets_deleted'
  | 'quota_80pct' | 'quota_depleted'
  | 'welcome' | 'plan_upgraded' | 'plan_downgraded'

// ══════════════════════════════════════════════════════════════
// TOOL REGISTRY — All tools that generate assets
// Add new tools here — they'll automatically appear in filters
// ══════════════════════════════════════════════════════════════
export interface ToolMeta {
  type:      AssetType
  label:     string
  icon:      string
  kind:      AssetMediaKind
  color:     string
  colorLt:   string
  route:     string   // deep-link to use-in
  phase:     1 | 2 | 3 | 4
}

export const TOOL_REGISTRY: Record<AssetType, ToolMeta> = {
  // ── AI Image ─────────────────────────────────────────────
  image: {
    type:'image', label:'Gambar AI', icon:'🖼️', kind:'image',
    color:'#7C3AED', colorLt:'#F5F3FF', route:'/studio', phase:1,
  },
  packshot: {
    type:'packshot', label:'AI Packshot', icon:'📦', kind:'image',
    color:'#7C3AED', colorLt:'#F5F3FF', route:'/studio/image/packshot', phase:1,
  },
  photoshoot: {
    type:'photoshoot', label:'AI Photoshoot', icon:'🌟', kind:'image',
    color:'#F59E0B', colorLt:'#FFFBEB', route:'/studio/image/photoshoot', phase:1,
  },
  'product-to-model': {
    type:'product-to-model', label:'Product to Model', icon:'🧑‍🦰', kind:'image',
    color:'#DB2777', colorLt:'#FDF2F8', route:'/studio/image/product-to-model', phase:1,
  },
  tryon: {
    type:'tryon', label:'AI Try-On', icon:'👗', kind:'image',
    color:'#7C3AED', colorLt:'#F5F3FF', route:'/studio/image/tryon', phase:1,
  },
  'model-swap': {
    type:'model-swap', label:'Model Swap', icon:'🔄', kind:'image',
    color:'#10B981', colorLt:'#ECFDF5', route:'/studio/image/model-swap', phase:1,
  },
  'face-swap': {
    type:'face-swap', label:'Face Swap', icon:'😊', kind:'image',
    color:'#F43F5E', colorLt:'#FFF1F2', route:'/studio/image/face-swap', phase:1,
  },
  enhancer: {
    type:'enhancer', label:'AI Enhancer', icon:'✨', kind:'image',
    color:'#9333EA', colorLt:'#FDF4FF', route:'/studio/image/enhancer', phase:1,
  },
  // ── Quick Tools ────────────────────────────────────────────
  'remove-bg': {
    type:'remove-bg', label:'Remove Background', icon:'🪄', kind:'image',
    color:'#7C3AED', colorLt:'#F5F3FF', route:'/quick-tools', phase:1,
  },
  upscale: {
    type:'upscale', label:'AI Upscale', icon:'🔍', kind:'image',
    color:'#2563EB', colorLt:'#EFF6FF', route:'/quick-tools', phase:1,
  },
  resize: {
    type:'resize', label:'Resize Smart', icon:'📐', kind:'image',
    color:'#059669', colorLt:'#ECFDF5', route:'/quick-tools', phase:1,
  },
  relight: {
    type:'relight', label:'AI Relight', icon:'💡', kind:'image',
    color:'#D97706', colorLt:'#FEF3C7', route:'/quick-tools', phase:1,
  },
  'remove-object': {
    type:'remove-object', label:'Remove Object', icon:'✏️', kind:'image',
    color:'#DB2777', colorLt:'#FDF2F8', route:'/quick-tools', phase:1,
  },
  // ── Video AI ───────────────────────────────────────────────
  video: {
    type:'video', label:'Video AI', icon:'🎬', kind:'video',
    color:'#8B5CF6', colorLt:'#F5F3FF', route:'/studio/video', phase:1,
  },
  'ugc-video': {
    type:'ugc-video', label:'UGC Video', icon:'🎭', kind:'video',
    color:'#10B981', colorLt:'#ECFDF5', route:'/studio/video/ugc', phase:1,
  },
  'image-to-video': {
    type:'image-to-video', label:'Image to Video', icon:'🎥', kind:'video',
    color:'#8B5CF6', colorLt:'#F5F3FF', route:'/studio/video/image-to-video', phase:1,
  },
  // ── Marketing Kit ──────────────────────────────────────────
  caption: {
    type:'caption', label:'Caption', icon:'✍️', kind:'text',
    color:'#F59E0B', colorLt:'#FFFBEB', route:'/marketing-kit?t=caption', phase:1,
  },
  hook: {
    type:'hook', label:'Hook', icon:'🎣', kind:'text',
    color:'#EF4444', colorLt:'#FEF2F2', route:'/marketing-kit?t=hook', phase:1,
  },
  cta: {
    type:'cta', label:'CTA', icon:'🎯', kind:'text',
    color:'#F97316', colorLt:'#FFF7ED', route:'/marketing-kit?t=cta', phase:1,
  },
  description: {
    type:'description', label:'Deskripsi', icon:'📋', kind:'text',
    color:'#059669', colorLt:'#ECFDF5', route:'/marketing-kit?t=desc', phase:1,
  },
  hashtag: {
    type:'hashtag', label:'Hashtag', icon:'#️⃣', kind:'text',
    color:'#3B82F6', colorLt:'#EFF6FF', route:'/marketing-kit?t=hashtag', phase:1,
  },
  'ad-copy': {
    type:'ad-copy', label:'Ad Copy', icon:'📈', kind:'text',
    color:'#7C3AED', colorLt:'#F5F3FF', route:'/marketing-kit?t=ad-copy', phase:1,
  },
  'wa-reply': {
    type:'wa-reply', label:'WA Reply', icon:'💬', kind:'text',
    color:'#16A34A', colorLt:'#ECFDF5', route:'/marketing-kit?t=wa', phase:1,
  },
  'soft-selling': {
    type:'soft-selling', label:'Soft Selling', icon:'💫', kind:'text',
    color:'#8B5CF6', colorLt:'#F5F3FF', route:'/marketing-kit?t=soft', phase:1,
  },
  'hard-selling': {
    type:'hard-selling', label:'Hard Selling', icon:'🔥', kind:'text',
    color:'#DC2626', colorLt:'#FEF2F2', route:'/marketing-kit?t=hard', phase:1,
  },
  'marketplace-copy': {
    type:'marketplace-copy', label:'Marketplace Copy', icon:'🛍️', kind:'text',
    color:'#0284C7', colorLt:'#E0F2FE', route:'/marketing-kit?t=marketplace', phase:1,
  },
  headline: {
    type:'headline', label:'Headline', icon:'📰', kind:'text',
    color:'#7C3AED', colorLt:'#F5F3FF', route:'/marketing-kit?t=headline', phase:1,
  },
  bio: {
    type:'bio', label:'Bio', icon:'👤', kind:'text',
    color:'#059669', colorLt:'#ECFDF5', route:'/marketing-kit?t=bio', phase:1,
  },
  other: {
    type:'other', label:'Lainnya', icon:'📄', kind:'text',
    color:'#6B7280', colorLt:'#F3F4F6', route:'/library', phase:1,
  },
}

// ── Storage limits per plan (bytes) ──────────────────────────
export const STORAGE_LIMITS: Record<string, number> = {
  starter:   524_288_000,         // 500 MB
  basic:     5_368_709_120,       // 5 GB
  pro:       21_474_836_480,      // 20 GB
  business:  107_374_182_400,     // 100 GB
}

// ── Utility: bytes → human readable ──────────────────────────
export function fmtBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k,i)).toFixed(1))} ${sizes[i]}`
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export function mediaKind(type: AssetType): AssetMediaKind {
  return TOOL_REGISTRY[type]?.kind ?? 'text'
}

// Days until expiry
export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}