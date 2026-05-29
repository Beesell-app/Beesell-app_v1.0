// apps/web-app/lib/scheduler/types.ts

export type Platform = 'instagram' | 'instagram_reels' | 'tiktok'

export interface CalendarEvent {
  id:          string           // content.id
  contentId:   string
  title:       string
  caption?:    string           // preview text
  media_url?:   string | null
  platform:    Platform
  scheduledFor: Date            // start time
  durationMin: number           // default 60 min (visual height)
  status:      'scheduled' | 'published' | 'failed' | 'draft'
  // UI state
  column?:     number           // 0-6 (Mon-Sun), computed from scheduledFor
  row?:        number           // pixel offset from top, computed
  isNew?:      boolean          // just dropped, show save animation
}

export interface ScheduleSlot {
  date: Date      // absolute datetime
  dayIndex: number  // 0=Mon … 6=Sun
  hour:     number  // 0-23
}

export interface WeekRange {
  start: Date   // Monday 00:00
  end:   Date   // Sunday 23:59
  days:  Date[] // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

// Drag data payload (from library → calendar OR event → calendar)
export interface DragPayload {
  type:       'library_item' | 'calendar_event'
  contentId:  string
  title:      string
  platform:   Platform
  media_url?:  string | null
  caption?:   string
  // Only for calendar_event:
  eventId?:   string
  originalSlot?: ScheduleSlot
}

export interface QuickAddState {
  open:     boolean
  slot:     ScheduleSlot | null
  anchorEl: { x: number; y: number } | null
}

// Platform config
export const PLATFORM_META: Record<Platform, {
  label:    string
  icon:     string
  color:    string
  bg:       string
  border:   string
}> = {
  instagram: {
    label:  'Instagram Feed',
    icon:   '📷',
    color:  '#E1306C',
    bg:     '#FDF2F8',
    border: '#FBCFE8',
  },
  instagram_reels: {
    label:  'Reels',
    icon:   '🎬',
    color:  '#833AB4',
    bg:     '#FAF5FF',
    border: '#E9D5FF',
  },
  tiktok: {
    label:  'TikTok',
    icon:   '🎵',
    color:  '#010101',
    bg:     '#F1F5F9',
    border: '#CBD5E1',
  },
}

// Hour range shown in grid (06:00 – 23:00)
export const GRID_START_HOUR = 6
export const GRID_END_HOUR   = 23
export const HOUR_HEIGHT_PX  = 64   // px per hour slot
export const MIN_EVENT_MIN   = 30   // minimum event duration in minutes