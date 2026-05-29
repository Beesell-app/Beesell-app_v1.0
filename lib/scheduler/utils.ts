// apps/web-app/lib/scheduler/utils.ts
import {
  startOfWeek, endOfWeek, addDays, format, getDay,
  startOfDay, addHours, addMinutes, differenceInMinutes,
  isSameDay, isWithinInterval, parseISO,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { CalendarEvent, WeekRange, ScheduleSlot } from './types'
import { GRID_START_HOUR, GRID_END_HOUR, HOUR_HEIGHT_PX } from './types'

// ── Week navigation ───────────────────────────────────────────
export function getWeekRange(referenceDate: Date): WeekRange {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 })  // Monday
  const end   = endOfWeek(referenceDate,   { weekStartsOn: 1 })  // Sunday
  const days  = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  return { start, end, days }
}

export function weekLabel(range: WeekRange): string {
  const s = format(range.start, 'd MMM', { locale: idLocale })
  const e = format(range.end,   'd MMM yyyy', { locale: idLocale })
  return `${s} – ${e}`
}

export function formatDayHeader(date: Date): { day: string; num: string; isToday: boolean } {
  const today = new Date()
  return {
    day:     format(date, 'EEE', { locale: idLocale }),
    num:     format(date, 'd'),
    isToday: isSameDay(date, today),
  }
}

// ── Slot math ─────────────────────────────────────────────────
// dayIndex: 0=Mon, 1=Tue … 6=Sun (matches WeekRange.days index)
export function slotToDate(slot: ScheduleSlot): Date {
  return addHours(startOfDay(slot.date), slot.hour)
}

export function dateToSlot(date: Date, weekDays: Date[]): ScheduleSlot {
  const dayIndex = weekDays.findIndex(d => isSameDay(d, date))
  return {
    date,
    dayIndex: dayIndex >= 0 ? dayIndex : 0,
    hour:     date.getHours(),
  }
}

// ── Pixel math ────────────────────────────────────────────────
// Given an event's scheduledFor time, return top offset in pixels
export function timeToTopPx(date: Date): number {
  const h = date.getHours()
  const m = date.getMinutes()
  const relativeHour = h + m / 60 - GRID_START_HOUR
  return Math.max(0, relativeHour * HOUR_HEIGHT_PX)
}

// Duration in minutes → height in pixels
export function durationToPx(durationMin: number): number {
  return (durationMin / 60) * HOUR_HEIGHT_PX
}

// Pixels from top → time
export function topPxToTime(px: number, dayDate: Date): Date {
  const totalHours  = GRID_START_HOUR + px / HOUR_HEIGHT_PX
  const hours       = Math.floor(totalHours)
  const mins        = Math.round((totalHours - hours) * 60 / 15) * 15  // snap 15 min
  const clamped     = Math.min(Math.max(hours, GRID_START_HOUR), GRID_END_HOUR - 1)
  return addMinutes(addHours(startOfDay(dayDate), clamped), mins)
}

// ── Overlap layout (multiple events in same column) ───────────
interface Positioned extends CalendarEvent {
  leftPercent:  number
  widthPercent: number
}

export function layoutOverlappingEvents(events: CalendarEvent[]): Positioned[] {
  if (events.length === 0) return []

  // Sort by start time
  const sorted = [...events].sort(
    (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime(),
  )

  const columns: CalendarEvent[][] = []

  for (const evt of sorted) {
    const evtEnd = addMinutes(evt.scheduledFor, evt.durationMin)

    // Find first column where this event doesn't overlap with last event
    let placed = false
    for (const col of columns) {
      const lastEvt    = col[col.length - 1]
      const lastEnd    = addMinutes(lastEvt.scheduledFor, lastEvt.durationMin)
      if (evt.scheduledFor >= lastEnd) {
        col.push(evt)
        placed = true
        break
      }
    }
    if (!placed) columns.push([evt])
  }

  const totalCols = columns.length

  return sorted.map(evt => {
    const colIdx = columns.findIndex(col => col.some(e => e.id === evt.id))
    return {
      ...evt,
      leftPercent:  colIdx / totalCols * 100,
      widthPercent: 100 / totalCols,
    }
  })
}

// ── Filter events for a specific day ─────────────────────────
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter(e => isSameDay(e.scheduledFor, day))
}

// ── Format time label ─────────────────────────────────────────
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function formatEventTime(date: Date, durationMin: number): string {
  const end = addMinutes(date, durationMin)
  return `${format(date, 'HH:mm')} – ${format(end, 'HH:mm')}`
}

// ── Snap to 15-min grid ───────────────────────────────────────
export function snapTo15Min(date: Date): Date {
  const mins = date.getMinutes()
  const snapped = Math.round(mins / 15) * 15
  const result  = new Date(date)
  result.setMinutes(snapped, 0, 0)
  return result
}

// ── Hours array for grid rows ──────────────────────────────────
export function getGridHours(): number[] {
  return Array.from(
    { length: GRID_END_HOUR - GRID_START_HOUR },
    (_, i) => GRID_START_HOUR + i,
  )
}

// ── Total grid height ─────────────────────────────────────────
export function totalGridHeight(): number {
  return (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX
}