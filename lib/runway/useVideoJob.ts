// lib/runway/useVideoJob.ts
// ══════════════════════════════════════════════════════════════
// VIDEO JOB — React Hook
// ══════════════════════════════════════════════════════════════
//
// Manages the full async video generation lifecycle:
//   1. dispatch()  → POST /api/video/dispatch → get jobId (202)
//   2. Subscribe   → Supabase Realtime channel for instant notify
//   3. Poll        → GET /api/video/status every 5s as fallback
//   4. Result      → videoUrl, status, progress, error
//
// Usage:
//   const { dispatch, status, progress, videoUrl, error, cancel } = useVideoJob()
//
//   // In handler:
//   const fd = new FormData()
//   fd.append('jobType', 'image_to_video')
//   fd.append('image', file)
//   fd.append('duration', '5')
//   fd.append('preset', 'fabric-sway')
//   fd.append('resolution', '720p')
//   await dispatch(fd)

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────
export type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface VideoJobState {
  jobId:         string | null
  status:        JobStatus
  progress:      number       // 0-100
  videoUrl:      string | null
  thumbnailUrl:  string | null
  error:         string | null
  elapsedSec:    number
  estimatedSec:  number
  remainingSec:  number
}

// ── Polling interval ──────────────────────────────────────────
const POLL_INTERVAL_MS = 5_000   // 5s polling fallback
const MAX_POLL_WAIT_MS = 210_000 // stop polling after 3.5 min (safety)

// ═══════════════════════════════════════════════════════════════
export function useVideoJob() {

  const [state, setState] = useState<VideoJobState>({
    jobId:        null,
    status:       'idle',
    progress:     0,
    videoUrl:     null,
    thumbnailUrl: null,
    error:        null,
    elapsedSec:   0,
    estimatedSec: 90,
    remainingSec: 90,
  })

  const channelRef  = useRef<RealtimeChannel | null>(null)
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const startMsRef  = useRef<number>(0)
  const jobIdRef    = useRef<string | null>(null)

  // ── Cleanup ─────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (pollRef.current)    { clearInterval(pollRef.current); pollRef.current = null }
    if (channelRef.current) { channelRef.current.unsubscribe(); channelRef.current = null }
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  // ── Poll fallback ────────────────────────────────────────────
  const startPolling = useCallback((jobId: string, estimatedSec: number) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      const elapsedMs = Date.now() - startMsRef.current

      // Stop polling if exceeded max wait
      if (elapsedMs > MAX_POLL_WAIT_MS) {
        cleanup()
        setState(s => ({
          ...s,
          status: 'failed',
          error:  'Timeout — video terlalu lama diproses. Coba lagi.',
          progress: 0,
        }))
        return
      }

      try {
        const res  = await fetch(`/api/video/status?jobId=${jobId}`)
        const data = await res.json()
        if (!res.ok) return   // network blip → keep polling

        setState(s => ({
          ...s,
          status:       data.status     as JobStatus,
          progress:     data.progress   ?? s.progress,
          videoUrl:     data.videoUrl   ?? s.videoUrl,
          thumbnailUrl: data.thumbnailUrl ?? s.thumbnailUrl,
          error:        data.errorMessage ?? s.error,
          elapsedSec:   data.elapsedSec   ?? s.elapsedSec,
          remainingSec: data.remainingSec ?? s.remainingSec,
        }))

        // Stop polling when terminal state reached
        if (['completed', 'failed', 'cancelled'].includes(data.status)) {
          cleanup()
        }
      } catch (err) {
        // Transient network error — keep polling
        console.warn('[useVideoJob] Poll error (will retry):', err)
      }
    }, POLL_INTERVAL_MS)
  }, [cleanup])

  // ── Subscribe to Supabase Realtime ───────────────────────────
  const subscribeRealtime = useCallback((jobId: string) => {
    const supabase  = createClient()
    const channel   = supabase.channel(`video-job-${jobId}`)

    channel
      .on('broadcast', { event: 'video_completed' }, ({ payload }) => {
        cleanup()
        setState(s => ({
          ...s,
          status:       'completed',
          progress:     100,
          videoUrl:     payload.videoUrl      ?? s.videoUrl,
          thumbnailUrl: payload.thumbnailUrl  ?? s.thumbnailUrl,
          error:        null,
          elapsedSec:   Math.round((payload.elapsedMs ?? 0) / 1000),
          remainingSec: 0,
        }))
      })
      .on('broadcast', { event: 'video_failed' }, ({ payload }) => {
        cleanup()
        setState(s => ({
          ...s,
          status:   'failed',
          progress: 0,
          error:    payload.error ?? 'Video generation gagal',
        }))
      })
      .subscribe()

    channelRef.current = channel
  }, [cleanup])

  // ── Dispatch ─────────────────────────────────────────────────
  const dispatch = useCallback(async (formData: FormData): Promise<void> => {
    cleanup()
    setState({
      jobId:        null,
      status:       'pending',
      progress:     3,
      videoUrl:     null,
      thumbnailUrl: null,
      error:        null,
      elapsedSec:   0,
      estimatedSec: 90,
      remainingSec: 90,
    })

    try {
      const res  = await fetch('/api/video/dispatch', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setState(s => ({
          ...s,
          status: 'failed',
          error:  data.error ?? `HTTP ${res.status}`,
          progress: 0,
        }))
        return
      }

      // 202 Accepted — job queued
      const { jobId, estimatedSec } = data as { jobId: string; estimatedSec: number }
      jobIdRef.current = jobId
      startMsRef.current = Date.now()

      setState(s => ({
        ...s,
        jobId,
        status:       'pending',
        progress:     5,
        estimatedSec: estimatedSec ?? 90,
        remainingSec: estimatedSec ?? 90,
      }))

      // Subscribe to realtime (instant on completion)
      subscribeRealtime(jobId)

      // Start polling fallback
      startPolling(jobId, estimatedSec ?? 90)

    } catch (err: any) {
      setState(s => ({
        ...s,
        status:   'failed',
        error:    err?.message ?? 'Gagal mengirim request',
        progress: 0,
      }))
    }
  }, [cleanup, subscribeRealtime, startPolling])

  // ── Cancel ────────────────────────────────────────────────────
  const cancel = useCallback(async () => {
    const jobId = jobIdRef.current
    if (!jobId) return
    cleanup()
    try {
      await fetch(`/api/video/status?jobId=${jobId}`, { method: 'DELETE' })
    } catch { /* ignore */ }
    setState(s => ({ ...s, status: 'cancelled', progress: 0 }))
  }, [cleanup])

  // ── Reset ─────────────────────────────────────────────────────
  const reset = useCallback(() => {
    cleanup()
    jobIdRef.current = null
    setState({
      jobId:        null,
      status:       'idle',
      progress:     0,
      videoUrl:     null,
      thumbnailUrl: null,
      error:        null,
      elapsedSec:   0,
      estimatedSec: 90,
      remainingSec: 90,
    })
  }, [cleanup])

  // ── Elapsed timer update (client-side) ────────────────────────
  useEffect(() => {
    if (!['pending', 'processing'].includes(state.status)) return
    const timer = setInterval(() => {
      if (!startMsRef.current) return
      const elapsedSec = Math.round((Date.now() - startMsRef.current) / 1000)
      setState(s => {
        if (!['pending','processing'].includes(s.status)) return s
        const progress = s.status === 'processing'
          ? Math.min(90, Math.round((elapsedSec / s.estimatedSec) * 100))
          : Math.min(10, s.progress + 1)
        return {
          ...s,
          elapsedSec,
          remainingSec: Math.max(0, s.estimatedSec - elapsedSec),
          progress,
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [state.status])

  return {
    ...state,
    dispatch,
    cancel,
    reset,
    isWorking: state.status === 'pending' || state.status === 'processing',
  }
}