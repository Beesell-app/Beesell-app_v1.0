'use client'
// apps/web-app/app/(dashboard)/scheduler/page.tsx
// ── Full scheduler page ────────────────────────────────────────
import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext, DragOverlay, useSensor, useSensors,
  PointerSensor, closestCenter,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import {
  addWeeks, subWeeks, startOfWeek, format,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus,
  GripVertical, FileText, Image as ImageIcon, Loader2,
} from 'lucide-react'
import { WeekGrid }         from '@/components/scheduler/WeekGrid'
import { QuickAddPopover }  from '@/components/scheduler/QuickAddPopover'
import {
  useWeekEvents, useScheduleContent,
  useRescheduleContent, useUnscheduleContent,
} from '@/hooks/useScheduler'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  getWeekRange, weekLabel, topPxToTime,
} from '@/lib/scheduler/utils'
import {
  SCHEDULE_PLATFORMS,
  type SchedulePlatformId,
} from '@/lib/scheduler/types'

// Local drag payload type (not exported from types module)
type DragPayload =
  | {
      type: 'library_item'
      contentId: string
      title?: string | null
      platform?: SchedulePlatformId | string
      imageUrl?: string | null
      caption?: string | null
    }
  | {
      type: 'calendar_event'
      eventId: string
      title?: string | null
      platform?: SchedulePlatformId | string
    }

type ScheduleSlot = {
  date: Date
  dayIndex: number
  hour: number
}

const PLATFORM_META = Object.fromEntries(
  SCHEDULE_PLATFORMS.map((platform) => [platform.id, platform]),
) as Record<SchedulePlatformId, (typeof SCHEDULE_PLATFORMS)[number]>

// ── Library item (draggable from sidebar) ───────────────────────
function LibraryDraggable({ item }: {
  item: {
    id: string; type: string; title: string | null; captionText: string | null;
    imageUrl: string | null; primaryPlatform: string | null;
  }
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   `lib-${item.id}`,
    data: {
      type:      'library_item',
      contentId: item.id,
      title:     item.title || item.captionText?.slice(0, 40) || 'Untitled',
      platform:  item.primaryPlatform ?? 'instagram',
      imageUrl:  item.imageUrl,
      caption:   item.captionText?.slice(0, 80),
    } satisfies DragPayload,
  })

  const pm    = PLATFORM_META[item.primaryPlatform as keyof typeof PLATFORM_META]
  const title = item.title || item.captionText?.slice(0, 40) || 'Untitled'

  return (
    <div
      ref={setNodeRef}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '8px',
        padding:     '8px 10px',
        background:  '#fff',
        border:      '1px solid #E2E8F0',
        borderRadius: '9px',
        cursor:      'grab',
        opacity:     isDragging ? 0.4 : 1,
        transition:  'opacity .1s',
        userSelect:  'none',
        touchAction: 'none',
      }}
      {...listeners}
      {...attributes}
    >
      <GripVertical size={12} color="#CBD5E1" />
      {item.imageUrl
        ? <img src={item.imageUrl} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '5px', flexShrink: 0 }} />
        : <div style={{
            width: '28px', height: '28px', borderRadius: '5px',
            background: pm?.colorLt ?? '#F1F5F9', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            {item.type === 'image' ? <ImageIcon size={12} color={pm?.color} /> : <FileText size={12} color={pm?.color} />}
          </div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '11px', fontWeight: 600, color: '#0F172A',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </p>
        <p style={{ fontSize: '9px', color: '#94A3B8' }}>
          {pm?.icon} {pm?.label}
        </p>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function SchedulerPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )
  const [quickAdd, setQuickAdd] = useState<{
    open: boolean; slot: ScheduleSlot | null; anchor: { x: number; y: number } | null
  }>({ open: false, slot: null, anchor: null })

  const [draggingPayload, setDraggingPayload] = useState<DragPayload | null>(null)

  const weekRange = getWeekRange(currentWeekStart)

  // ── Data hooks ───────────────────────────────────────────
  const { data: events = [], isLoading: eventsLoading } = useWeekEvents(currentWeekStart)
  const schedule   = useScheduleContent(currentWeekStart)
  const reschedule = useRescheduleContent(currentWeekStart)
  const unschedule = useUnscheduleContent(currentWeekStart)

  // Library panel (ready contents)
  const { data: libData, isLoading: libLoading } = useInfiniteQuery({
    queryKey:      ['library-sidebar', 'ready'],
    queryFn:       async ({ pageParam }) => {
      const sp = new URLSearchParams({ status: 'ready', limit: '30' })
      if (pageParam) sp.set('cursor', pageParam as string)
      const res = await fetch(`/api/library?${sp}`)
      return (await res.json()).data
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => last?.nextCursor ?? undefined,
    staleTime: 60_000,
  })
  const libItems =
  libData?.pages
    ?.filter(Boolean)
    .flatMap((p: any) => p.items ?? []) ?? []

  // ── dnd-kit sensors ──────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },  // 5px drag before activate
    }),
  )

  // ── Drag handlers ────────────────────────────────────────
  const handleDragStart = useCallback((e: DragStartEvent) => {
    setDraggingPayload(e.active.data.current as DragPayload)
  }, [])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setDraggingPayload(null)
    const { over, active } = e
    if (!over) return

    const slotData = over.data.current
    if (slotData?.type !== 'slot') return

    const payload = active.data.current as DragPayload
    const slotDate: Date = slotData.day
    const hour: number   = slotData.hour

    // Compute scheduled time (snap to 15 min within hour)
    const scheduledFor = new Date(slotDate)
    scheduledFor.setHours(hour, 0, 0, 0)

    if (payload.type === 'library_item') {
      // New schedule
      schedule.mutate({ contentId: payload.contentId, scheduledFor })
    } else if (payload.type === 'calendar_event' && payload.eventId) {
      // Reschedule existing
      reschedule.mutate({ id: payload.eventId, scheduledFor })
    }
  }, [schedule, reschedule])

  // ── Quick add ─────────────────────────────────────────────
  const handleSlotClick = useCallback((slot: ScheduleSlot, anchor: { x: number; y: number }) => {
    setQuickAdd({ open: true, slot, anchor })
  }, [])

  const handleScheduleFromPopover = useCallback((contentId: string, scheduledFor: Date) => {
    schedule.mutate({ contentId, scheduledFor })
  }, [schedule])

  // ── Week navigation ───────────────────────────────────────
  const prevWeek = () => setCurrentWeekStart(w => subWeeks(w, 1))
  const nextWeek = () => setCurrentWeekStart(w => addWeeks(w, 1))
  const goToday  = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const isCurrentWeek = weekRange.days.some(
    (d: Date) => d.toDateString() === new Date().toDateString(),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        display:      'flex',
        height:       'calc(100vh - 56px)',
        gap:          '16px',
        fontFamily:   "'DM Sans', sans-serif",
        overflow:     'hidden',
      }}>

        {/* ── Left: Library panel ───────────────────────── */}
        <aside style={{
          width:         '220px',
          flexShrink:    0,
          display:       'flex',
          flexDirection: 'column',
          gap:           '10px',
          overflowY:     'auto',
        }}
        className="scheduler-sidebar"
        >
          <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <p style={{
              fontSize:      '11px',
              fontWeight:    700,
              color:         '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom:  '10px',
            }}>
              Konten Siap
            </p>

            {libLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Loader2 size={18} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}

            {!libLoading && libItems.length === 0 && (
              <div style={{
                padding: '16px', background: '#F8FAFC', border: '1px dashed #CBD5E1',
                borderRadius: '10px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>
                  Belum ada konten siap
                </p>
                <Link href="/content/new" style={{
                  fontSize: '11px', fontWeight: 600, color: '#2563EB', textDecoration: 'none',
                }}>
                  + Buat Konten →
                </Link>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {libItems.map((item: any) => (
                <LibraryDraggable key={item.id} item={item} />
              ))}
            </div>

            {libItems.length > 0 && (
              <p style={{ fontSize: '10px', color: '#CBD5E1', marginTop: '10px', textAlign: 'center' }}>
                Drag ke kalender untuk jadwalkan
              </p>
            )}
          </div>
        </aside>

        {/* ── Right: Calendar ───────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Week navigation */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '10px',
            marginBottom:   '12px',
            flexWrap:       'wrap',
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={prevWeek} style={navBtnStyle}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextWeek} style={navBtnStyle}>
                <ChevronRight size={16} />
              </button>
            </div>

            <h2 style={{
              fontFamily:    "'Fraunces', serif",
              fontSize:      '18px',
              fontWeight:    600,
              color:         '#0F172A',
              letterSpacing: '-0.01em',
              flex:          1,
            }}>
              {weekLabel(weekRange)}
            </h2>

            {!isCurrentWeek && (
              <button onClick={goToday} style={{
                padding:      '6px 14px',
                background:   '#fff',
                border:       '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize:     '12px',
                fontWeight:   600,
                color:        '#475569',
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                gap:          '5px',
                fontFamily:   "'DM Sans', sans-serif",
              }}>
                <CalendarDays size={13} /> Minggu Ini
              </button>
            )}

            <Link href="/content/new" style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '5px',
              padding:        '7px 14px',
              background:     'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color:          '#fff',
              textDecoration: 'none',
              borderRadius:   '9px',
              fontSize:       '12px',
              fontWeight:     600,
            }}>
              <Plus size={13} /> Buat Konten
            </Link>
          </div>

          {/* Calendar grid */}
          <WeekGrid
            weekDays={weekRange.days}
            events={events}
            onSlotClick={handleSlotClick}
            onUnschedule={(id) => unschedule.mutate(id)}
            onResize={(id, dur) => {
              const evt = events.find(e => e.id === id)
              if (evt) reschedule.mutate({ id, scheduledFor: evt.scheduledFor })
            }}
            isLoading={eventsLoading}
          />
        </div>
      </div>

      {/* Drag ghost overlay */}
      <DragOverlay dropAnimation={null}>
        {draggingPayload && (
          <div style={{
            padding:      '8px 12px',
            background:   '#EFF6FF',
            border:       '2px solid #2563EB',
            borderRadius: '9px',
            fontSize:     '12px',
            fontWeight:   600,
            color:        '#1E3A8A',
            boxShadow:    '0 8px 20px rgba(37,99,235,.25)',
            whiteSpace:   'nowrap',
            fontFamily:   "'DM Sans', sans-serif",
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
          }}>
            <span>{PLATFORM_META[draggingPayload.platform as keyof typeof PLATFORM_META]?.icon}</span>
            {(draggingPayload.title ?? 'Untitled').slice(0, 30)}
          </div>
        )}
      </DragOverlay>

      {/* Quick add popover */}
      {quickAdd.open && quickAdd.slot && quickAdd.anchor && (
        <QuickAddPopover
          slot={quickAdd.slot}
          anchor={quickAdd.anchor}
          onClose={() => setQuickAdd({ open: false, slot: null, anchor: null })}
          onSchedule={handleScheduleFromPopover}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 768px) {
          .scheduler-sidebar { display: none; }
        }
      `}</style>
    </DndContext>
  )
}

const navBtnStyle: React.CSSProperties = {
  width:          '32px',
  height:         '32px',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  background:     '#fff',
  border:         '1px solid #E2E8F0',
  borderRadius:   '8px',
  cursor:         'pointer',
  color:          '#475569',
  padding:        0,
  fontFamily:     "'DM Sans', sans-serif",
}