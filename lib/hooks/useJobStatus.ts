'use client'
// apps/web-app/lib/hooks/useJobStatus.ts
// ── SSE job status hook with HTTP polling fallback ───────────
// Priority: SSE stream → HTTP polling every 3s → error state
// Reconnect: max 3 attempts on disconnect
import { useEffect, useRef, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────
export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'canceled'

export type JobType =
  | 'text_generation'
  | 'image_generation'
  | 'video_generation'
  | 'bulk_generation'
  | 'background_removal'

export interface JobResult {
  // For image generation
  media_url?:        string
  imageThumbUrl?:   string
  // For caption generation
  variants?:        Array<{ caption: string; hashtags: string[]; cta: string }>
  // Link to created content
  contentId?:       string
}

export interface JobState {
  jobId:        string | null
  jobType:      JobType | null
  status:       JobStatus
  progress:     number           // 0-100 (estimated)
  elapsedMs:    number
  estimatedMs:  number           // avg total duration for this job type
  result:       JobResult | null
  error:        string | null
  model:        string | null
  cost_usd:      number | null
}

// Avg expected duration per job type (ms) — used for progress estimation
const AVG_DURATION: Record<string, number> = {
  text_generation:  5_000,
  image_generation: 10_000,
  video_generation: 60_000,
  bulk_generation:  20_000,
}

// ── Config ──────────────────────────────────────────────────
const MAX_SSE_RECONNECTS = 3
const POLL_INTERVAL_MS   = 3_000
const SSE_TIMEOUT_MS     = 90_000   // max time to wait for SSE

// ── HTTP poll: fetch job status ─────────────────────────────
async function pollJobStatus(jobId: string): Promise<{
  status:  JobStatus
  result?: JobResult
  error?:  string
  model?:  string
  cost_usd?: number
}> {
  const res = await fetch(`/api/jobs/${jobId}/status`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Main hook ───────────────────────────────────────────────
export function useJobStatus(jobId: string | null) {
  const [state, setState] = useState<JobState>({
    jobId:        jobId,
    jobType:      null,
    status:       'pending',
    progress:     0,
    elapsedMs:    0,
    estimatedMs:  10_000,
    result:       null,
    error:        null,
    model:        null,
    cost_usd:      null,
  })

  const startTimeRef     = useRef<number>(Date.now())
  const reconnectCount   = useRef(0)
  const sseRef           = useRef<EventSource | null>(null)
  const pollTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTerminalRef    = useRef(false)

  // ── Cleanup ────────────────────────────────────────────
  const cleanup = useCallback(() => {
    sseRef.current?.close()
    sseRef.current = null
    if (pollTimerRef.current)     clearInterval(pollTimerRef.current)
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
  }, [])

  // ── Progress estimation ticker ─────────────────────────
  const startProgressTicker = useCallback((estimatedMs: number) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      // Sigmoid-like curve: fast start, slow finish (never reaches 100 until complete)
      const rawPct = elapsed / estimatedMs
      const progress = Math.min(Math.round(100 * (1 - Math.exp(-2.5 * rawPct))), 94)

      setState(prev => ({
        ...prev,
        elapsedMs: elapsed,
        progress: isTerminalRef.current ? prev.progress : progress,
      }))
    }, 250)
  }, [])

  // ── Handle terminal state (done or failed) ─────────────
  const handleTerminal = useCallback((
    status:  JobStatus,
    result?: JobResult,
    error?:  string,
    extra?:  { model?: string; cost_usd?: number },
  ) => {
    isTerminalRef.current = true
    cleanup()

    setState(prev => ({
      ...prev,
      status,
      progress: status === 'completed' ? 100 : prev.progress,
      result:   result ?? null,
      error:    error ?? null,
      model:    extra?.model ?? prev.model,
      cost_usd:  extra?.cost_usd ?? prev.cost_usd,
    }))
  }, [cleanup])

  // ── Start HTTP polling fallback ────────────────────────
  const startPolling = useCallback(() => {
    if (!jobId || isTerminalRef.current) return

    if (pollTimerRef.current) clearInterval(pollTimerRef.current)

    pollTimerRef.current = setInterval(async () => {
      if (!jobId || isTerminalRef.current) return

      try {
        const data = await pollJobStatus(jobId)

        setState(prev => ({ ...prev, status: data.status }))

        if (data.status === 'completed') {
          handleTerminal('completed', data.result, undefined, {
            model:   data.model,
            cost_usd: data.cost_usd,
          })
        } else if (data.status === 'failed' || data.status === 'canceled') {
          handleTerminal(data.status, undefined, data.error ?? 'Gagal')
        }
      } catch (err) {
        console.error('[useJobStatus] Poll error:', err)
      }
    }, POLL_INTERVAL_MS)
  }, [jobId, handleTerminal])

  // ── Connect SSE ───────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (!jobId || isTerminalRef.current) return
    if (sseRef.current) sseRef.current.close()

    const streamUrl = `/api/jobs/${jobId}/stream`
    const es = new EventSource(streamUrl)
    sseRef.current = es

    // SSE opened — use SSE, stop HTTP polling
    es.onopen = () => {
      reconnectCount.current = 0
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }

    // Progress events from server
    es.addEventListener('progress', (ev) => {
      try {
        const data = JSON.parse(ev.data)
        setState(prev => ({
          ...prev,
          status:      'processing',
          jobType:     data.jobType ?? prev.jobType,
          estimatedMs: data.estimatedMs ?? prev.estimatedMs,
          model:       data.model ?? prev.model,
        }))

        // Restart progress ticker if estimatedMs changed
        if (data.estimatedMs) {
          startProgressTicker(data.estimatedMs)
        }
      } catch {}
    })

    // Completed
    es.addEventListener('completed', (ev) => {
      try {
        const data = JSON.parse(ev.data)
        handleTerminal('completed', data.result, undefined, {
          model:   data.model,
          cost_usd: data.cost_usd,
        })
      } catch {
        handleTerminal('completed')
      }
      es.close()
    })

    // Failed
    es.addEventListener('failed', (ev) => {
      try {
        const data = JSON.parse(ev.data)
        handleTerminal('failed', undefined, data.error ?? 'Gagal')
      } catch {
        handleTerminal('failed', undefined, 'Terjadi kesalahan')
      }
      es.close()
    })

    // SSE error → reconnect or fallback to polling
    es.onerror = () => {
      es.close()
      sseRef.current = null

      if (isTerminalRef.current) return

      if (reconnectCount.current < MAX_SSE_RECONNECTS) {
        reconnectCount.current++
        const delay = reconnectCount.current * 1000
        setTimeout(() => connectSSE(), delay)
      } else {
        // Fallback to polling
        console.warn('[useJobStatus] SSE failed, switching to HTTP polling')
        startPolling()
      }
    }

    // Safety timeout — force polling after SSE_TIMEOUT_MS
    setTimeout(() => {
      if (!isTerminalRef.current) {
        es.close()
        startPolling()
      }
    }, SSE_TIMEOUT_MS)
  }, [jobId, handleTerminal, startPolling, startProgressTicker])

  // ── Effect: start when jobId changes ──────────────────
  useEffect(() => {
    if (!jobId) return

    isTerminalRef.current = false
    startTimeRef.current  = Date.now()
    reconnectCount.current = 0

    setState({
      jobId,
      jobType:      null,
      status:       'pending',
      progress:     0,
      elapsedMs:    0,
      estimatedMs:  AVG_DURATION.image_generation,
      result:       null,
      error:        null,
      model:        null,
      cost_usd:      null,
    })

    // Start progress ticker immediately
    startProgressTicker(AVG_DURATION.image_generation)

    // Try SSE first; if server does not support, fallback handled by onerror
    connectSSE()

    return cleanup
  }, [jobId])

  // ── Retry (manual) ────────────────────────────────────
  const retry = useCallback(() => {
    if (!jobId) return
    isTerminalRef.current  = false
    reconnectCount.current = 0
    startTimeRef.current   = Date.now()

    setState(prev => ({
      ...prev,
      status:   'pending',
      progress: 0,
      error:    null,
      result:   null,
    }))

    startProgressTicker(state.estimatedMs)
    connectSSE()
  }, [jobId, connectSSE, startProgressTicker, state.estimatedMs])

  return { ...state, retry }
}

// ── Standalone: HTTP GET /api/jobs/[id]/status ─────────────
// Simple endpoint untuk polling fallback — tambahkan ke route.ts
// GET /api/jobs/[id]/status
// Returns: { status, result?, error?, model?, cost_usd? }