// apps/web-app/lib/library-types.ts
// Type definitions untuk Content Library
// Platform: HANYA instagram / instagram_reels / tiktok (sesuai platform restriction sprint)

export type ContentType     = 'caption' | 'image' | 'video' | 'bulk' | 'all'
export type ContentStatus   = 'ready' | 'draft' | 'failed' | 'scheduled' | 'published' | 'generating' | 'archived' | 'all'
export type ContentPlatform = 'instagram' | 'instagram_reels' | 'tiktok' | 'all'
export type SortOrder       = 'newest' | 'oldest' | 'a-z'
export type ViewMode        = 'grid' | 'list'

export interface LibraryFilters {
  q?:        string
  type?:     ContentType
  status?:   ContentStatus
  platform?: ContentPlatform
  sort?:     SortOrder
  starred?:  boolean
  folderId?: string
  
}

export interface ContentListItem {
  id:              string
  type:            ContentType
  status:          ContentStatus
  title:           string | null
  caption_text:     string | null
  media_url:        string | null
  imageThumbUrl:   string | null
  thumbnailUrl:    string | null
  primary_platform: ContentPlatform | null
  isStarred:       boolean
  tags:            string[]
  folderId:        string | null
  created_at:       string
  updated_at:       string
  captionPreview?: string | null
  caption?: string
  platform?: string
  contentType?: string
  productPrice?: number | null
  productName?: string | null
  productUrl?: string | null
  affiliateUrl?: string | null
  currency?: string | null
}

export interface LibraryPage {
  items:      ContentListItem[]
  nextCursor: string | null
  total:      number           // total filtered count
  hasMore:    boolean
}

export interface LibraryResponse {
  success: boolean
  data:    LibraryPage
}
export interface FilterOptionItem {
  label: string
  value: string

  emoji?: string
  color?: string
}
export const TYPE_OPTIONS: FilterOptionItem[] = [
  { emoji: '📦', label: 'Semua', value: 'all' },
  { emoji: '🖼️', label: 'Image', value: 'image' },
  { emoji: '🎬', label: 'Video', value: 'video' },
  { emoji: '📝', label: 'Text', value: 'text' },
]

export const STATUS_OPTIONS: FilterOptionItem[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

export const PLATFORM_OPTIONS: FilterOptionItem[] = [
  { label: 'All Platforms', value: 'all' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Shopee', value: 'shopee' },
  { label: 'Tokopedia', value: 'tokopedia' },
]

export const SORT_OPTIONS: FilterOptionItem[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Most Popular', value: 'popular' },
]