'use client'
// apps/web-app/lib/hooks/useAutoSaveContent.ts
// Auto-save dengan debounce 1.5 detik
// Save ke PATCH /api/contents/[id] dengan full captionVariants struct
import { useEffect, useRef, useState, useCallback } from 'react'
import type { CaptionVariant } from '@/lib/ai/prompts'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SaveData {
  variants: CaptionVariant[]
}

interface UseAutoSaveOptions {
  contentId:   string | null
  debounceMs?: number   // default 1500ms
}

export function useAutoSaveContent({ contentId, debounceMs = 1500 }: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError]   = useState<string | null>(null)

  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const abortRef     = useRef<AbortController | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current)   clearTimeout(timeoutRef.current)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (abortRef.current)     abortRef.current.abort()
    }
  }, [])

  // Reset saat contentId berubah
  useEffect(() => {
    setStatus('idle')
    setError(null)
    lastSavedRef.current = ''
  }, [contentId])

  // ── Direct save (no debounce) ─────────────────────────
  const saveNow = useCallback(async (data: SaveData) => {
    if (!contentId) return

    // Abort pending request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('saving')
    setError(null)

    try {
      const payloadVariants = data.variants.map((v, i) => ({
        caption:        v.caption,
        hashtags:       v.hashtags,
        cta:            v.cta,
        characterCount: v.caption.length,
        variantIndex:   i,
      }))

      const res = await fetch(`/api/contents/${contentId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          captionVariants: payloadVariants,
          // caption_text + hashtags top-level akan auto-sync di backend
          // dari variants[0]
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message ?? `HTTP ${res.status}`)
      }

      lastSavedRef.current = JSON.stringify(data)

      setStatus('saved')

      // Fade ke idle setelah 2 detik
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        setStatus(prev => prev === 'saved' ? 'idle' : prev)
      }, 2000)

    } catch (err: any) {
      if (err.name === 'AbortError') return  // user keep typing

      console.error('[useAutoSaveContent]', err)
      setStatus('error')
      setError(err.message ?? 'Gagal save')
    }
  }, [contentId])

  // ── Debounced trigger ─────────────────────────────────
  const triggerSave = useCallback((data: SaveData) => {
    if (!contentId) return

    // Skip kalau data sama dengan last save
    const currentHash = JSON.stringify(data)
    if (currentHash === lastSavedRef.current) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    setStatus('saving')   // optimistic

    timeoutRef.current = setTimeout(() => {
      saveNow(data)
    }, debounceMs)
  }, [contentId, debounceMs, saveNow])

  return { status, error, triggerSave, saveNow }
}