'use client'
// apps/web-app/lib/hooks/useGenerateImage.ts
// Hook untuk async image generation dengan SSE progress
//
// Usage:
//   const { generate, status, media_url, error, progress } = useGenerateImage()
//   generate({ productName: 'Tas keren', style: 'product_studio' })
//
// Status flow: idle → dispatching → processing → completed/failed
import { useState, useCallback, useEffect, useRef } from 'react'

export type ImageGenStatus = 'idle' | 'dispatching' | 'processing' | 'completed' | 'failed' | 'timeout'

interface GenerateInput {
  productName:     string
  productBenefits?: string
  style?:          'product_studio' | 'lifestyle' | 'flat_lay' | 'aesthetic' | 'minimalist'
  customPrompt?:   string
  contentId?:      string
  useTurbo?:       boolean
}

interface State {
  status:    ImageGenStatus
  jobId:     string | null
  contentId: string | null
  media_url:  string | null
  error:     string | null
  // Estimated progress 0-100 berdasarkan elapsed time + ETA
  progress:  number
  estimatedTime: number   // detik
  elapsedMs: number
}

const INITIAL: State = {
  status:        'idle',
  jobId:         null,
  contentId:     null,
  media_url:      null,
  error:         null,
  progress:      0,
  estimatedTime: 0,
  elapsedMs:     0,
}

export function useGenerateImage() {
  const [state, setState] = useState<State>(INITIAL)

  const eventSourceRef = useRef<EventSource | null>(null)
  const startedAtRef   = useRef<number>(0)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [])

  // ── Reset state ────────────────────────────────────────
  const reset = useCallback(() => {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    progressTimerRef.current = null
    setState(INITIAL)
  }, [])

  // ── Subscribe ke SSE stream ───────────────────────────
  const subscribeToProgress = useCallback((jobId: string, estimatedTime: number) => {
    const es = new EventSource(`/api/jobs/${jobId}/stream`)
    eventSourceRef.current = es

    // Kirim progress estimate berdasarkan elapsed time / ETA
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current
      const totalMs = estimatedTime * 1000
      const pct     = Math.min(95, (elapsed / totalMs) * 100)  // cap 95% sampai webhook done

      setState(prev => ({ ...prev, progress: pct, elapsedMs: elapsed }))
    }, 500)

    es.addEventListener('connected', (e: MessageEvent) => {
      console.log('[SSE] connected', e.data)
    })

    es.addEventListener('status', (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      console.log('[SSE] status update', data)

      if (data.status === 'processing') {
        setState(prev => ({ ...prev, status: 'processing' }))
      }
    })

    es.addEventListener('completed', (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      console.log('[SSE] completed', data)

      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      es.close()

      setState(prev => ({
        ...prev,
        status:    'completed',
        progress:  100,
        media_url:  data.media_url,
        contentId: data.contentId,
      }))
    })

    es.addEventListener('failed', (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      console.error('[SSE] failed', data)

      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      es.close()

      setState(prev => ({
        ...prev,
        status: 'failed',
        error:  data.error,
      }))
    })

    es.addEventListener('timeout', (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      console.warn('[SSE] timeout', data)

      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      es.close()

      setState(prev => ({
        ...prev,
        status: 'timeout',
        error:  data.message,
      }))
    })

    es.addEventListener('heartbeat', () => {
      // Just keep connection alive
    })

    es.onerror = (err) => {
      console.error('[SSE] error', err)
      // Don't immediately fail — EventSource auto-reconnect
      // Only fail kalau readyState = CLOSED
      if (es.readyState === EventSource.CLOSED) {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current)
        setState(prev => ({
          ...prev,
          status: 'failed',
          error:  'Lost connection to server',
        }))
      }
    }
  }, [])

  // ── Trigger generation ────────────────────────────────
  const generate = useCallback(async (input: GenerateInput) => {
    reset()
    startedAtRef.current = Date.now()
    setState({ ...INITIAL, status: 'dispatching' })

    try {
      const res = await fetch('/api/generate/image', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })

      const data = await res.json()

      if (!res.ok) {
        setState({
          ...INITIAL,
          status: 'failed',
          error:  data.message ?? data.error ?? `HTTP ${res.status}`,
        })
        return
      }

      // Dispatch berhasil — subscribe ke SSE
      setState(prev => ({
        ...prev,
        status:        'processing',
        jobId:         data.jobId,
        contentId:     data.contentId,
        estimatedTime: data.estimatedTime,
        progress:      5,   // initial progress 5%
      }))

      subscribeToProgress(data.jobId, data.estimatedTime)

    } catch (err: any) {
      setState({
        ...INITIAL,
        status: 'failed',
        error:  err?.message ?? 'Network error',
      })
    }
  }, [reset, subscribeToProgress])

  // ── Cancel ongoing generation ─────────────────────────
  const cancel = useCallback(() => {
    eventSourceRef.current?.close()
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    setState(prev => ({ ...prev, status: 'idle' }))
  }, [])

  return {
    ...state,
    generate,
    cancel,
    reset,
    isGenerating: state.status === 'dispatching' || state.status === 'processing',
  }
}