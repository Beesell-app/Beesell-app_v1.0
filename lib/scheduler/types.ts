// lib/scheduler/types.ts
// ══════════════════════════════════════════════════════════════
// MULTI-PLATFORM SCHEDULER — Types & Data
// Instagram · TikTok · Facebook · YouTube Shorts · Shopee · Twitter
// Best Time AI · Drag-Drop Queue · Auto-Repost · Approval Workflow
// ══════════════════════════════════════════════════════════════

export type SchedulePlatformId =
  | 'instagram' | 'tiktok'    | 'facebook'
  | 'youtube'   | 'shopee'    | 'twitter'

export type PostStatus =
  | 'draft'       // belum siap
  | 'queued'      // di queue, belum ada waktu
  | 'scheduled'   // waktu sudah ditentukan
  | 'pending'     // menunggu approval (Business plan)
  | 'approved'    // disetujui manager
  | 'rejected'    // ditolak manager
  | 'publishing'  // sedang diposting
  | 'published'   // sudah live
  | 'failed'      // gagal publish
  | 'paused'      // di-pause manual

export type ContentType = 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'short'
export type ViewMode    = 'week' | 'month' | 'list' | 'queue'
export type ApprovalRole = 'owner' | 'manager' | 'member'

// ── Platform configs ──────────────────────────────────────────
export interface PlatformConfig {
  id:           SchedulePlatformId
  label:        string
  icon:         string
  color:        string
  colorLt:      string
  colorMid:     string
  contentTypes: ContentType[]
  maxChars:     number
  hashtagMax:   number
  ratios:       string[]
  apiSupport:   boolean
  desc:         string
  autoPostNote: string
}

export const SCHEDULE_PLATFORMS: PlatformConfig[] = [
  {
    id:'instagram', label:'Instagram', icon:'📸', color:'#E1306C',
    colorLt:'#FDF2F8', colorMid:'#F9A8D4',
    contentTypes:['image','video','carousel','story','reel'],
    maxChars:2200, hashtagMax:30, ratios:['1:1','4:5','9:16','1.91:1'],
    apiSupport:true, desc:'Feed, Reels, Story',
    autoPostNote:'Meta Graph API — perlu Business Account + akses token',
  },
  {
    id:'tiktok', label:'TikTok', icon:'🎵', color:'#010101',
    colorLt:'#F3F4F6', colorMid:'#D1D5DB',
    contentTypes:['video'],
    maxChars:2200, hashtagMax:10, ratios:['9:16'],
    apiSupport:true, desc:'For You Page & Shop',
    autoPostNote:'TikTok Content Posting API v2 — perlu approval dari TikTok',
  },
  {
    id:'facebook', label:'Facebook', icon:'👥', color:'#1877F2',
    colorLt:'#EFF6FF', colorMid:'#BFDBFE',
    contentTypes:['image','video','carousel'],
    maxChars:63206, hashtagMax:10, ratios:['1:1','1.91:1','9:16'],
    apiSupport:true, desc:'Feed, Reels, Story',
    autoPostNote:'Meta Graph API — sama dengan Instagram, pakai 1 token',
  },
  {
    id:'youtube', label:'YouTube Shorts', icon:'▶️', color:'#FF0000',
    colorLt:'#FEF2F2', colorMid:'#FCA5A5',
    contentTypes:['short','video'],
    maxChars:5000, hashtagMax:15, ratios:['9:16','16:9'],
    apiSupport:false, desc:'Shorts & Long-form',
    autoPostNote:'YouTube Data API v3 — perlu OAuth persetujuan pengguna',
  },
  {
    id:'shopee', label:'Shopee Video', icon:'🛍️', color:'#EE4D2D',
    colorLt:'#FEF2F2', colorMid:'#FCA5A5',
    contentTypes:['video','image'],
    maxChars:1000, hashtagMax:5, ratios:['9:16','1:1'],
    apiSupport:false, desc:'Shopee Video & Produk',
    autoPostNote:'Shopee Open Platform API — tersedia untuk Official Store',
  },
  {
    id:'twitter', label:'Twitter / X', icon:'𝕏', color:'#000000',
    colorLt:'#F9FAFB', colorMid:'#E5E7EB',
    contentTypes:['image','video'],
    maxChars:280, hashtagMax:5, ratios:['16:9','1:1'],
    apiSupport:false, desc:'Tweet & Thread',
    autoPostNote:'Twitter API v2 — Basic plan min $100/bulan',
  },
]

// ── Best time data per platform (WIB UTC+7, Indonesia) ────────
export interface BestTimeSlot {
  hour:      number       // 0–23
  dayOfWeek: number       // 0=Mon … 6=Sun
  score:     number       // 0–100
  label:     string
  reason:    string
  engRate?:  number       // avg engagement rate at this time
}

export const BEST_TIMES: Record<SchedulePlatformId, BestTimeSlot[]> = {
  instagram: [
    { hour:7,  dayOfWeek:1, score:92, label:'Sel 07:00', reason:'Commute scroll peak', engRate:6.2 },
    { hour:12, dayOfWeek:2, score:97, label:'Rab 12:00', reason:'Lunch break — tertinggi bulan ini', engRate:7.8 },
    { hour:19, dayOfWeek:3, score:89, label:'Kam 19:00', reason:'Post-work wind-down', engRate:6.9 },
    { hour:20, dayOfWeek:0, score:91, label:'Sen 20:00', reason:'Prime time malam Senin', engRate:7.1 },
    { hour:21, dayOfWeek:4, score:85, label:'Jum 21:00', reason:'Malam Sabtu — pre-weekend', engRate:6.4 },
    { hour:8,  dayOfWeek:6, score:82, label:'Min 08:00', reason:'Weekend morning scroll', engRate:5.9 },
  ],
  tiktok: [
    { hour:7,  dayOfWeek:0, score:88, label:'Sen 07:00', reason:'Commute FYP scroll', engRate:8.3 },
    { hour:12, dayOfWeek:2, score:93, label:'Rab 12:00', reason:'Lunch break — FYP peak', engRate:9.1 },
    { hour:19, dayOfWeek:1, score:96, label:'Sel 19:00', reason:'After-work — tertinggi keseluruhan', engRate:10.2 },
    { hour:21, dayOfWeek:5, score:90, label:'Sab 21:00', reason:'Saturday night prime time', engRate:8.7 },
    { hour:20, dayOfWeek:3, score:87, label:'Kam 20:00', reason:'Pre-weekend engagement', engRate:8.1 },
    { hour:6,  dayOfWeek:4, score:79, label:'Jum 06:00', reason:'Early bird before work', engRate:6.9 },
  ],
  facebook: [
    { hour:9,  dayOfWeek:2, score:87, label:'Rab 09:00', reason:'Weekday morning — post-coffee', engRate:5.2 },
    { hour:13, dayOfWeek:1, score:92, label:'Sel 13:00', reason:'Lunch scroll peak', engRate:6.1 },
    { hour:15, dayOfWeek:3, score:89, label:'Kam 15:00', reason:'Post-lunch afternoon', engRate:5.8 },
    { hour:20, dayOfWeek:5, score:84, label:'Sab 20:00', reason:'Malam Minggu keluarga', engRate:5.4 },
    { hour:19, dayOfWeek:6, score:81, label:'Min 19:00', reason:'Sunday evening pre-week', engRate:5.1 },
  ],
  youtube: [
    { hour:12, dayOfWeek:5, score:90, label:'Sab 12:00', reason:'Weekend lunch — Shorts spike', engRate:7.4 },
    { hour:15, dayOfWeek:6, score:94, label:'Min 15:00', reason:'Sunday afternoon — tertinggi', engRate:8.2 },
    { hour:17, dayOfWeek:2, score:83, label:'Rab 17:00', reason:'After school / work', engRate:6.8 },
    { hour:20, dayOfWeek:4, score:87, label:'Kam 20:00', reason:'Weeknight prime time', engRate:7.1 },
    { hour:8,  dayOfWeek:6, score:79, label:'Min 08:00', reason:'Weekend morning binge', engRate:6.3 },
  ],
  shopee: [
    { hour:10, dayOfWeek:1, score:83, label:'Sen 10:00', reason:'Senin pagi — buyer aktif', engRate:5.1 },
    { hour:12, dayOfWeek:3, score:89, label:'Kam 12:00', reason:'Lunch-time deal hunter', engRate:6.3 },
    { hour:20, dayOfWeek:4, score:92, label:'Jum 20:00', reason:'Malam belanja pra-weekend', engRate:7.2 },
    { hour:11, dayOfWeek:5, score:86, label:'Sab 11:00', reason:'Sabtu siang — peak transaksi', engRate:6.8 },
    { hour:21, dayOfWeek:6, score:78, label:'Min 21:00', reason:'Weekend evening last purchase', engRate:5.7 },
  ],
  twitter: [
    { hour:8,  dayOfWeek:0, score:86, label:'Sen 08:00', reason:'Monday morning catch-up', engRate:4.8 },
    { hour:12, dayOfWeek:1, score:89, label:'Sel 12:00', reason:'Lunch break engagement', engRate:5.4 },
    { hour:17, dayOfWeek:3, score:84, label:'Kam 17:00', reason:'Post-work commute', engRate:5.1 },
    { hour:21, dayOfWeek:4, score:80, label:'Jum 21:00', reason:'Weekend eve social', engRate:4.7 },
  ],
}

// ── Scheduled post ────────────────────────────────────────────
export interface ScheduledPost {
  id:               string
  userId:           string
  title:            string
  caption:          string
  hashtags:         string[]
  mediaUrls:        string[]
  mediaType:        ContentType
  platforms:        SchedulePlatformId[]
  scheduledAt:      string       // ISO
  timezone:         string       // 'Asia/Jakarta'
  status:           PostStatus
  requiresApproval: boolean
  approvalStatus:   'none' | 'pending' | 'approved' | 'rejected'
  approver?:        { id:string; name:string; avatarUrl?:string }
  approverNote?:    string
  isRepost:         boolean
  originalPostId?:  string
  repostCount:      number
  performanceScore: number       // 0–100 (after published)
  publishedAt?:     string
  assetId?:         string       // linked ai_assets record
  aiCaption?:       boolean      // AI-generated
  createdAt:        string
  updatedAt:        string
}

// ── Queue item (drag-drop) ────────────────────────────────────
export interface QueueItem {
  id:        string
  post:      ScheduledPost
  position:  number
  dayIndex:  number       // 0–6 for week, 0–30 for month
  slotTime:  string       // HH:MM
}

// ── Auto-repost config ────────────────────────────────────────
export interface RepostConfig {
  enabled:           boolean
  minPerformance:    number    // min score to be eligible (0–100)
  minDaysOld:        number    // min days since original publish
  maxReposts:        number    // max times to repost a post
  platforms:         SchedulePlatformId[]
  scheduleGapDays:   number   // days between reposts
  prefixTitle:       string   // e.g. "🔁 " prepended to title
  runAt:             string   // HH:MM daily when to run check
  nextRunAt?:        string   // ISO next run time
}

// ── Approval workflow ─────────────────────────────────────────
export interface ApprovalRequest {
  id:          string
  postId:      string
  post:        ScheduledPost
  requestedBy: { id:string; name:string; avatarUrl?:string }
  requestedAt: string
  reviewedBy?:  { id:string; name:string }
  reviewedAt?:  string
  status:       'pending' | 'approved' | 'rejected'
  note?:        string
  expiresAt:    string   // auto-reject after this time
}

// ── Status config ─────────────────────────────────────────────
export const POST_STATUS_CFG: Record<PostStatus, {
  label:string; icon:string; color:string; bg:string
}> = {
  draft:      { label:'Draft',      icon:'✏️',  color:'#6B7280', bg:'#F3F4F6' },
  queued:     { label:'In Queue',   icon:'📋',  color:'#3B82F6', bg:'#EFF6FF' },
  scheduled:  { label:'Scheduled',  icon:'⏰',  color:'#7C3AED', bg:'#F5F3FF' },
  pending:    { label:'Pending',    icon:'⏳',  color:'#F59E0B', bg:'#FFFBEB' },
  approved:   { label:'Approved',   icon:'✅',  color:'#059669', bg:'#ECFDF5' },
  rejected:   { label:'Rejected',   icon:'❌',  color:'#EF4444', bg:'#FEF2F2' },
  publishing: { label:'Publishing', icon:'📤',  color:'#3B82F6', bg:'#EFF6FF' },
  published:  { label:'Published',  icon:'🟢',  color:'#059669', bg:'#ECFDF5' },
  failed:     { label:'Failed',     icon:'🔴',  color:'#EF4444', bg:'#FEF2F2' },
  paused:     { label:'Paused',     icon:'⏸️',  color:'#6B7280', bg:'#F3F4F6' },
}

// ── Day helpers ───────────────────────────────────────────────
export const DAY_SHORT  = ['Sen','Sel','Rab','Kam','Jum','Sab','Min']
export const DAY_FULL   = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']
export const MONTH_SHORT= ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

export const fmtHour     = (h:number) => h===0?'12 AM':h<12?`${h}:00 AM`:h===12?'12 PM':`${h-12}:00 PM`
export const fmtDateTime = (iso:string) => new Date(iso).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
export const fmtDate     = (iso:string) => new Date(iso).toLocaleDateString('id-ID', { weekday:'short', day:'2-digit', month:'short' })

export function getWeekDates(anchor: Date): Date[] {
  const d = new Date(anchor)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Mon
  return Array.from({ length:7 }, (_, i) => {
    const x = new Date(d); x.setDate(d.getDate() + i); return x
  })
}

export function getMonthDates(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const last  = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  // pad to full weeks
  const start = new Date(first); start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  const end   = new Date(last);  end.setDate(last.getDate()   + ((7 - last.getDay()) % 7 || 7))
  const dates: Date[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }
  return dates
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}