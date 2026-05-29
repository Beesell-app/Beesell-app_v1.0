'use client'
// apps/web-app/components/scheduler/EventCard.tsx
// Draggable + resizable calendar event card
import { useRef, useState, useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { X, GripVertical } from 'lucide-react'
import {
  PLATFORM_META, HOUR_HEIGHT_PX, MIN_EVENT_MIN,
  type CalendarEvent,
} from '@/lib/scheduler/types'
import {
  formatEventTime, timeToTopPx, durationToPx,
} from '@/lib/scheduler/utils'
import { addMinutes } from 'date-fns'

interface Props {
  event:        CalendarEvent
  dayDate:      Date
  leftPercent:  number
  widthPercent: number
  onUnschedule: (id: string) => void
  onResize:     (id: string, newDurationMin: number) => void
}

export function EventCard({
  event, dayDate, leftPercent, widthPercent, onUnschedule, onResize,
}: Props) {
  const pm     = PLATFORM_META[event.platform] ?? PLATFORM_META.instagram
  const top    = timeToTopPx(event.scheduledFor)
  const height = Math.max(durationToPx(event.durationMin), durationToPx(MIN_EVENT_MIN))

  // ── dnd-kit draggable ──────────────────────────────────────
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id:   event.id,
    data: {
      type:      'calendar_event',
      contentId: event.contentId,
      eventId:   event.id,
      title:     event.title,
      platform:  event.platform,
      media_url:  event.media_url,
      caption:   event.caption,
      originalSlot: {
        date:     event.scheduledFor,
        dayIndex: -1,
        hour:     event.scheduledFor.getHours(),
      },
    },
  })

  // ── Resize logic ───────────────────────────────────────────
  const resizeStartY   = useRef<number>(0)
  const resizeStartDur = useRef<number>(event.durationMin)
  const [isResizing, setIsResizing]     = useState(false)
  const [localDuration, setLocalDuration] = useState(event.durationMin)

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    resizeStartY.current   = e.clientY
    resizeStartDur.current = localDuration
    setIsResizing(true)

    const onMouseMove = (ev: MouseEvent) => {
      const deltaY    = ev.clientY - resizeStartY.current
      const deltaMins = Math.round((deltaY / HOUR_HEIGHT_PX) * 60 / 15) * 15
      const newDur    = Math.max(MIN_EVENT_MIN, resizeStartDur.current + deltaMins)
      setLocalDuration(newDur)
    }

    const onMouseUp = (ev: MouseEvent) => {
      const deltaY    = ev.clientY - resizeStartY.current
      const deltaMins = Math.round((deltaY / HOUR_HEIGHT_PX) * 60 / 15) * 15
      const newDur    = Math.max(MIN_EVENT_MIN, resizeStartDur.current + deltaMins)
      setIsResizing(false)
      onResize(event.id, newDur)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
  }, [event.id, localDuration, onResize])

  const effectiveDuration = isResizing ? localDuration : event.durationMin
  const effectiveHeight   = Math.max(durationToPx(effectiveDuration), durationToPx(MIN_EVENT_MIN))

  const isShort = effectiveHeight < 52

  // Status-based opacity
  const opacity = event.status === 'published' ? 0.6
               : isDragging     ? 0.3
               : event.isNew    ? 0.8
               : 1

  return (
    <div
      ref={setNodeRef}
      style={{
        position:  'absolute',
        top:       `${top}px`,
        left:      `calc(${leftPercent}% + 2px)`,
        width:     `calc(${widthPercent}% - 4px)`,
        height:    `${effectiveHeight}px`,
        zIndex:    isDragging ? 50 : 10,
        opacity,
        transition: isResizing ? 'none' : 'opacity .15s',
        cursor:    isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Card body */}
      <div style={{
        height:       '100%',
        background:   pm.bg,
        border:       `1.5px solid ${pm.border}`,
        borderLeft:   `3px solid ${pm.color}`,
        borderRadius: '6px',
        overflow:     'hidden',
        display:      'flex',
        flexDirection: 'column',
        boxShadow:    isDragging ? '0 8px 20px rgba(0,0,0,.15)' : '0 1px 3px rgba(0,0,0,.08)',
      }}>

        {/* Drag handle + header */}
        <div
          {...listeners}
          {...attributes}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '4px',
            padding:    isShort ? '3px 5px' : '5px 7px',
            cursor:     'grab',
            minHeight:  '24px',
          }}
        >
          <GripVertical size={10} color={pm.color} style={{ flexShrink: 0, opacity: .5 }} />

          <span style={{ fontSize: '10px', flexShrink: 0 }}>{pm.icon}</span>

          <span style={{
            fontSize:     '11px',
            fontWeight:   600,
            color:        '#0F172A',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            flex:         1,
            fontFamily:   "'DM Sans', sans-serif",
          }}>
            {event.title}
          </span>

          {/* Unschedule button */}
          <button
            onMouseDown={e => { e.stopPropagation(); onUnschedule(event.id) }}
            style={{
              width:          '16px',
              height:         '16px',
              background:     'transparent',
              border:         'none',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          '#94A3B8',
              flexShrink:     0,
              padding:        0,
              borderRadius:   '3px',
            }}
          >
            <X size={10} />
          </button>
        </div>

        {/* Time + platform (only if tall enough) */}
        {!isShort && (
          <div style={{
            padding:   '0 7px 4px',
            fontSize:  '10px',
            color:     '#64748B',
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
          }}>
            {formatEventTime(event.scheduledFor, effectiveDuration)}
          </div>
        )}

        {/* Status badge */}
        {event.status === 'published' && !isShort && (
          <div style={{
            margin:       '0 7px 4px',
            padding:      '1px 5px',
            background:   '#DCFCE7',
            color:        '#15803D',
            borderRadius: '3px',
            fontSize:     '9px',
            fontWeight:   700,
            width:        'fit-content',
            fontFamily:   "'DM Sans', sans-serif",
          }}>
            ✓ Published
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            height:     '8px',
            cursor:     'ns-resize',
            background: `${pm.color}20`,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{
            width:        '20px',
            height:       '2px',
            background:   pm.color,
            borderRadius: '1px',
            opacity:      0.4,
          }} />
        </div>
      </div>
    </div>
  )
}