'use client'
// apps/web-app/components/scheduler/WeekGrid.tsx
// ── Main 7-column week grid ────────────────────────────────────
// Droppable slots + event rendering + time labels
import { useRef, useCallback } from 'react'
import { useDroppable }         from '@dnd-kit/core'
import { format }               from 'date-fns'
import type { CalendarEvent, ScheduleSlot } from '@/lib/scheduler/types'
import { HOUR_HEIGHT_PX }       from '@/lib/scheduler/types'
import {
  getGridHours, totalGridHeight, formatHour, formatDayHeader,
  getEventsForDay, layoutOverlappingEvents, timeToTopPx,
  topPxToTime, snapTo15Min,
} from '@/lib/scheduler/utils'
import { EventCard }            from './EventCard'

interface Props {
  weekDays:    Date[]
  events:      CalendarEvent[]
  onSlotClick: (slot: ScheduleSlot, anchor: { x: number; y: number }) => void
  onUnschedule:(id: string) => void
  onResize:    (id: string, newDurationMin: number) => void
  isLoading?:  boolean
}

// Grid constants
const TIME_COL_W  = 56     // px for time label column
const DAY_MIN_W   = 120    // px min per day column
const TODAY_COLOR = '#EFF6FF'
const TODAY_BORDER = '#2563EB'

export function WeekGrid({
  weekDays, events, onSlotClick, onUnschedule, onResize, isLoading,
}: Props) {
  const hours      = getGridHours()
  const gridHeight = totalGridHeight()
  const gridRef    = useRef<HTMLDivElement>(null)

  // Current time indicator
  const now = new Date()
  const currentTimeTop = timeToTopPx(now)
  const isThisWeek = weekDays.some(d =>
    d.toDateString() === new Date().toDateString(),
  )
  const todayColIdx = weekDays.findIndex(
    d => d.toDateString() === new Date().toDateString(),
  )

  return (
    <div style={{
      flex:     1,
      display:  'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#fff',
      border:   '1px solid #E2E8F0',
      borderRadius: '14px',
    }}>

      {/* ── Day headers row ──────────────────────────────── */}
      <div style={{
        display:          'grid',
        gridTemplateColumns: `${TIME_COL_W}px repeat(7, 1fr)`,
        borderBottom:     '1px solid #E2E8F0',
        background:       '#FAFAFA',
        flexShrink:       0,
        position:         'sticky',
        top:              0,
        zIndex:           20,
      }}>
        {/* Corner */}
        <div style={{ borderRight: '1px solid #E2E8F0' }} />

        {weekDays.map((day, i) => {
          const { day: dayLabel, num, isToday } = formatDayHeader(day)
          return (
            <div
              key={i}
              style={{
                padding:      '10px 8px',
                textAlign:    'center',
                borderRight:  i < 6 ? '1px solid #E2E8F0' : 'none',
                background:   isToday ? TODAY_COLOR : 'transparent',
                fontFamily:   "'DM Sans', sans-serif",
              }}
            >
              <p style={{
                fontSize:    '11px',
                fontWeight:  600,
                color:       isToday ? TODAY_BORDER : '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '2px',
              }}>
                {dayLabel}
              </p>
              <div style={{
                width:          '28px',
                height:         '28px',
                borderRadius:   '50%',
                background:     isToday ? TODAY_BORDER : 'transparent',
                color:          isToday ? '#fff' : '#0F172A',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '14px',
                fontWeight:     isToday ? 700 : 500,
                margin:         '0 auto',
              }}>
                {num}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Scrollable grid body ──────────────────────────── */}
      <div
        ref={gridRef}
        style={{
          flex:      1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position:  'relative',
        }}
      >
        <div style={{
          display:          'grid',
          gridTemplateColumns: `${TIME_COL_W}px repeat(7, 1fr)`,
          height:           `${gridHeight}px`,
          position:         'relative',
        }}>

          {/* Time label column */}
          <div style={{
            borderRight: '1px solid #E2E8F0',
            position:    'sticky',
            left:        0,
            background:  '#fff',
            zIndex:      10,
          }}>
            {hours.map(hour => (
              <div
                key={hour}
                style={{
                  height:      `${HOUR_HEIGHT_PX}px`,
                  display:     'flex',
                  alignItems:  'flex-start',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                  paddingTop:  '4px',
                  boxSizing:   'border-box',
                }}
              >
                <span style={{
                  fontSize:   '10px',
                  color:      '#94A3B8',
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayEvents   = getEventsForDay(events, day)
            const positioned  = layoutOverlappingEvents(dayEvents)
            const { isToday } = formatDayHeader(day)

            return (
              <DayColumn
                key={dayIdx}
                day={day}
                dayIdx={dayIdx}
                hours={hours}
                events={positioned}
                isToday={isToday}
                isLast={dayIdx === 6}
                currentTimeTop={currentTimeTop}
                showCurrentTime={isToday}
                onSlotClick={(hour, e) => {
                  const rect  = (e.currentTarget as HTMLElement)
                    .closest('.week-grid-body')?.getBoundingClientRect()
                    ?? { left: 0, top: 0 }
                  onSlotClick(
                    { date: day, dayIndex: dayIdx, hour },
                    { x: e.clientX, y: e.clientY },
                  )
                }}
                onUnschedule={onUnschedule}
                onResize={onResize}
              />
            )
          })}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div style={{
            position:   'absolute',
            inset:      0,
            background: 'rgba(255,255,255,.6)',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex:     30,
          }}>
            <div style={{
              width: '32px', height: '32px',
              border: '3px solid #E2E8F0', borderTopColor: '#2563EB',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ── Day column ─────────────────────────────────────────────────
function DayColumn({ day, dayIdx, hours, events, isToday, isLast, currentTimeTop, showCurrentTime, onSlotClick, onUnschedule, onResize }: {
  day:              Date
  dayIdx:           number
  hours:            number[]
  events:           Array<CalendarEvent & { leftPercent: number; widthPercent: number }>
  isToday:          boolean
  isLast:           boolean
  currentTimeTop:   number
  showCurrentTime:  boolean
  onSlotClick:      (hour: number, e: React.MouseEvent) => void
  onUnschedule:     (id: string) => void
  onResize:         (id: string, durationMin: number) => void
}) {
  return (
    <div style={{
      position:    'relative',
      borderRight: isLast ? 'none' : '1px solid #E2E8F0',
      background:  isToday ? '#FAFFFE' : 'transparent',
    }}>
      {/* Hour grid lines */}
      {hours.map(hour => (
        <HourSlot
          key={hour}
          hour={hour}
          day={day}
          dayIdx={dayIdx}
          onClick={(e) => onSlotClick(hour, e)}
        />
      ))}

      {/* Current time line */}
      {showCurrentTime && (
        <div style={{
          position:    'absolute',
          top:         `${currentTimeTop}px`,
          left:        0,
          right:       0,
          height:      '2px',
          background:  TODAY_BORDER,
          zIndex:      15,
          pointerEvents: 'none',
        }}>
          <div style={{
            position:     'absolute',
            left:         '-4px',
            top:          '-4px',
            width:        '10px',
            height:       '10px',
            borderRadius: '50%',
            background:   TODAY_BORDER,
          }} />
        </div>
      )}

      {/* Events */}
      {events.map(evt => (
        <EventCard
          key={evt.id}
          event={evt}
          dayDate={day}
          leftPercent={evt.leftPercent}
          widthPercent={evt.widthPercent}
          onUnschedule={onUnschedule}
          onResize={onResize}
        />
      ))}
    </div>
  )
}

// ── Droppable hour slot ─────────────────────────────────────────
function HourSlot({ hour, day, dayIdx, onClick }: {
  hour:    number
  day:     Date
  dayIdx:  number
  onClick: (e: React.MouseEvent) => void
}) {
  const droppableId = `slot-${format(day, 'yyyy-MM-dd')}-${hour}`
  const { setNodeRef, isOver } = useDroppable({
    id:   droppableId,
    data: { type: 'slot', day, hour, dayIdx },
  })

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{
        height:      `${HOUR_HEIGHT_PX}px`,
        borderTop:   hour % 1 === 0 ? '1px solid #F1F5F9' : 'none',
        background:  isOver ? 'rgba(37,99,235,.06)' : 'transparent',
        cursor:      'cell',
        transition:  'background .08s',
        boxSizing:   'border-box',
      }}
    />
  )
}