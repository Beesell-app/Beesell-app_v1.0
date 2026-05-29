'use client'
// apps/web-app/lib/hooks/useScheduler.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfWeek } from 'date-fns'
import type { CalendarEvent } from '@/lib/scheduler/types'

// ── Fetch week events ─────────────────────────────────────────
async function fetchWeekEvents(weekStart: Date): Promise<CalendarEvent[]> {
  const qs  = new URLSearchParams({ weekStart: weekStart.toISOString() })
  const res = await fetch(`/api/scheduler?${qs}`)
  if (!res.ok) throw new Error('Failed to load schedule')
  const { events } = await res.json()

  return (events ?? []).map((e: any) => ({
    ...e,
    scheduledFor: new Date(e.scheduledFor),
  }))
}

// ── Schedule content ──────────────────────────────────────────
async function scheduleContent(data: {
  contentId:   string
  scheduledFor: Date
  durationMin?: number
}): Promise<any> {
  const res = await fetch('/api/scheduler', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      ...data,
      scheduledFor: data.scheduledFor.toISOString(),
    }),
  })
  if (!res.ok) throw new Error('Failed to schedule')
  return (await res.json()).data
}

// ── Reschedule ────────────────────────────────────────────────
async function rescheduleContent(data: {
  id:          string
  scheduledFor: Date
}): Promise<any> {
  const res = await fetch(`/api/scheduler/${data.id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ scheduledFor: data.scheduledFor.toISOString() }),
  })
  if (!res.ok) throw new Error('Failed to reschedule')
  return (await res.json()).data
}

// ── Unschedule ────────────────────────────────────────────────
async function unscheduleContent(id: string): Promise<void> {
  const res = await fetch(`/api/scheduler/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to unschedule')
}

// ── Query key factory ─────────────────────────────────────────
const schedulerKeys = {
  week: (weekStart: Date) => ['scheduler', format(weekStart, 'yyyy-MM-dd')] as const,
}

// ── Main hooks ────────────────────────────────────────────────
export function useWeekEvents(weekStart: Date) {
  return useQuery({
    queryKey: schedulerKeys.week(weekStart),
    queryFn:  () => fetchWeekEvents(weekStart),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useScheduleContent(weekStart: Date) {
  const qc = useQueryClient()
  const key = schedulerKeys.week(weekStart)

  return useMutation({
    mutationFn: scheduleContent,

    // Optimistic: add event immediately before server confirms
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<CalendarEvent[]>(key) ?? []

      const optimisticEvent: CalendarEvent = {
        id:          `optimistic-${Date.now()}`,
        contentId:   newData.contentId,
        title:       'Menjadwalkan...',
        platform:    'instagram',
        scheduledFor: newData.scheduledFor,
        durationMin: newData.durationMin ?? 60,
        status:      'scheduled',
        isNew:       true,
      }

      qc.setQueryData<CalendarEvent[]>(key, [...prev, optimisticEvent])
      return { prev }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useRescheduleContent(weekStart: Date) {
  const qc = useQueryClient()
  const key = schedulerKeys.week(weekStart)

  return useMutation({
    mutationFn: rescheduleContent,

    // Optimistic: update event time immediately
    onMutate: async ({ id, scheduledFor }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<CalendarEvent[]>(key) ?? []

      qc.setQueryData<CalendarEvent[]>(
        key,
        prev.map(e => e.id === id ? { ...e, scheduledFor } : e),
      )
      return { prev }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useUnscheduleContent(weekStart: Date) {
  const qc = useQueryClient()
  const key = schedulerKeys.week(weekStart)

  return useMutation({
    mutationFn: unscheduleContent,

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<CalendarEvent[]>(key) ?? []
      qc.setQueryData<CalendarEvent[]>(key, prev.filter(e => e.id !== id))
      return { prev }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}