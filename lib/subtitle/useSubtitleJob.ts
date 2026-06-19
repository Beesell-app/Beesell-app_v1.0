// lib/subtitle/useSubtitleJob.ts
// ══════════════════════════════════════════════════════════════
// SUBTITLE JOB HOOK — React hook for full lifecycle management
// ══════════════════════════════════════════════════════════════
//
// Handles:
//   - transcribe(file, style, language) → dispatch to Lambda
//   - burn(videoUrl, srtContent, style) → burn SRT onto video
//   - Supabase Realtime subscription for instant completion notify
//   - Poll fallback every 5s
//   - Progress estimation (client-side)
//
// Usage:
//   const { transcribe, burn, status, progress, outputUrl, srtContent,
//           srtUrl, segments, error, isWorking, cancel, reset } = useSubtitleJob()
//
//   // Transcribe video/audio:
//   const fd = new FormData()
//   fd.append('file', videoFile)
//   fd.append('style', 'tiktok-bold')
//   fd.append('language', 'id')
//   await transcribe(fd)
//
//   // Burn existing SRT:
//   await burn(videoUrl, srtContent, 'neon')

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────
export type SubJobStatus = 'idle'|'pending'|'processing'|'completed'|'failed'

export interface SubtitleJobState {
  jobId:          string | null
  status:         SubJobStatus
  progress:       number          // 0-100
  outputUrl:      string | null   // burned video URL
  srtUrl:         string | null   // raw SRT file URL
  srtContent:     string | null   // SRT text content
  segments:       number | null   // number of subtitle lines
  audioDuration:  number | null   // seconds
  style:          string | null
  language:       string | null
  error:          string | null
  elapsedSec:     number
  estimatedSec:   number
  remainingSec:   number
}

const POLL_INTERVAL_MS = 5_000
const MAX_WAIT_MS      = 300_000   // 5 min

// ════════════════════════════════════════════════════════════════
export function useSubtitleJob() {
  const [state, setState] = useState<SubtitleJobState>({
    jobId:null, status:'idle', progress:0, outputUrl:null,
    srtUrl:null, srtContent:null, segments:null, audioDuration:null,
    style:null, language:null, error:null,
    elapsedSec:0, estimatedSec:45, remainingSec:45,
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
      if (Date.now() - startMsRef.current > MAX_WAIT_MS) {
        cleanup()
        setState(s => ({ ...s, status:'failed', error:'Timeout — proses terlalu lama', progress:0 }))
        return
      }
      try {
        const res  = await fetch(`/api/subtitle/status?jobId=${jobId}`)
        const data = await res.json()
        if (!res.ok) return
        setState(s => ({
          ...s,
          status:       data.status as SubJobStatus,
          progress:     data.progress     ?? s.progress,
          outputUrl:    data.outputUrl    ?? s.outputUrl,
          srtUrl:       data.srtUrl       ?? s.srtUrl,
          srtContent:   data.srtContent   ?? s.srtContent,
          segments:     data.segments     ?? s.segments,
          audioDuration:data.duration     ?? s.audioDuration,
          error:        data.error        ?? s.error,
          elapsedSec:   data.elapsedSec   ?? s.elapsedSec,
          remainingSec: data.remainingSec ?? s.remainingSec,
        }))
        if (['completed','failed'].includes(data.status)) cleanup()
      } catch { /* transient error → keep polling */ }
    }, POLL_INTERVAL_MS)
  }, [cleanup])

  // ── Supabase Realtime ────────────────────────────────────────
  const subscribeRealtime = useCallback((jobId: string) => {
    const supabase = createClient()
    const channel  = supabase.channel(`subtitle-job-${jobId}`)
    channel
      .on('broadcast', { event:'subtitle_completed' }, ({ payload }) => {
        cleanup()
        setState(s => ({
          ...s,
          status:       'completed',
          progress:     100,
          outputUrl:    payload.outputUrl   ?? s.outputUrl,
          srtUrl:       payload.srtUrl      ?? s.srtUrl,
          srtContent:   payload.srtContent  ?? s.srtContent,
          segments:     payload.segments    ?? s.segments,
          audioDuration:payload.duration    ?? s.audioDuration,
          error:        null,
          remainingSec: 0,
        }))
      })
      .on('broadcast', { event:'subtitle_failed' }, ({ payload }) => {
        cleanup()
        setState(s => ({
          ...s,
          status: 'failed',
          progress: 0,
          error:  payload.error ?? 'Subtitle generation gagal',
        }))
      })
      .subscribe()
    channelRef.current = channel
  }, [cleanup])

  // ── Transcribe (audio/video → Whisper → SRT → burn) ──────────
  const transcribe = useCallback(async (formData: FormData): Promise<void> => {
    cleanup()
    setState({
      jobId:null, status:'pending', progress:3,
      outputUrl:null, srtUrl:null, srtContent:null,
      segments:null, audioDuration:null,
      style: formData.get('style') as string ?? 'tiktok-bold',
      language: formData.get('language') as string ?? 'id',
      error:null, elapsedSec:0, estimatedSec:45, remainingSec:45,
    })
    startMsRef.current = Date.now()
    try {
      const res  = await fetch('/api/subtitle/transcribe', { method:'POST', body:formData })
      const data = await res.json()
      if (!res.ok) {
        setState(s => ({ ...s, status:'failed', error:data.error ?? `HTTP ${res.status}`, progress:0 }))
        return
      }
      jobIdRef.current = data.jobId
      setState(s => ({ ...s, jobId:data.jobId, status:'pending', progress:5, estimatedSec:data.estimatedSec ?? 45, remainingSec:data.estimatedSec ?? 45 }))
      subscribeRealtime(data.jobId)
      startPolling(data.jobId, data.estimatedSec ?? 45)
    } catch (err: any) {
      setState(s => ({ ...s, status:'failed', error:err?.message ?? 'Request gagal', progress:0 }))
    }
  }, [cleanup, subscribeRealtime, startPolling])

  // ── Burn (SRT → video, skip Whisper) ─────────────────────────
  const burn = useCallback(async (videoUrl: string, srtContent: string, style = 'tiktok-bold', language = 'id'): Promise<void> => {
    cleanup()
    setState({ jobId:null, status:'pending', progress:5, outputUrl:null, srtUrl:null, srtContent, segments:null, audioDuration:null, style, language, error:null, elapsedSec:0, estimatedSec:45, remainingSec:45 })
    startMsRef.current = Date.now()
    try {
      const res  = await fetch('/api/subtitle/burn', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ videoUrl, srtContent, style, language }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState(s => ({ ...s, status:'failed', error:data.error ?? `HTTP ${res.status}`, progress:0 }))
        return
      }
      jobIdRef.current = data.jobId
      setState(s => ({ ...s, jobId:data.jobId, status:'pending', progress:5, estimatedSec:45, remainingSec:45 }))
      subscribeRealtime(data.jobId)
      startPolling(data.jobId, 45)
    } catch (err: any) {
      setState(s => ({ ...s, status:'failed', error:err?.message ?? 'Request gagal', progress:0 }))
    }
  }, [cleanup, subscribeRealtime, startPolling])

  // ── Reset ─────────────────────────────────────────────────────
  const reset = useCallback(() => {
    cleanup(); jobIdRef.current = null
    setState({ jobId:null, status:'idle', progress:0, outputUrl:null, srtUrl:null, srtContent:null, segments:null, audioDuration:null, style:null, language:null, error:null, elapsedSec:0, estimatedSec:45, remainingSec:45 })
  }, [cleanup])

  // ── Client-side elapsed timer ─────────────────────────────────
  useEffect(() => {
    if (!['pending','processing'].includes(state.status)) return
    const timer = setInterval(() => {
      if (!startMsRef.current) return
      const elapsed = Math.round((Date.now() - startMsRef.current) / 1000)
      setState(s => {
        if (!['pending','processing'].includes(s.status)) return s
        return {
          ...s,
          elapsedSec:   elapsed,
          remainingSec: Math.max(0, s.estimatedSec - elapsed),
          progress:     s.status === 'processing'
            ? Math.min(90, Math.round((elapsed / s.estimatedSec) * 100))
            : Math.min(10, s.progress + 1),
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [state.status])

  return {
    ...state,
    transcribe,
    burn,
    reset,
    isWorking: state.status === 'pending' || state.status === 'processing',
  }
}