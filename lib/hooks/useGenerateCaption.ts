'use client'
// apps/web-app/lib/hooks/useGenerateCaption.ts
// ── Hook untuk konsumsi /api/generate/text streaming ─────────
// Pakai di komponen Caption Generator form
//
// Usage:
//   const { generate, text, isStreaming, error } = useGenerateCaption()
//   await generate({ productName: 'Tas wanita', platform: 'instagram', ... })
//   {text}  // real-time streaming text
import { useState, useCallback } from 'react'
import { useSessionStore }       from '@/store/sessionStore'


export interface GenerateParams {
  productName:     string
  productPrice?:   string
  productBenefits?: string
  targetAudience?: string
  tone?:           'casual' | 'friendly' | 'professional' | 'energetic' | 'luxury' | 'playful' | 'authoritative'
  language?:       'indonesian_casual' | 'indonesian_formal' | 'mixed_english' | 'full_english'
  emoji?:          'heavy' | 'moderate' | 'minimal' | 'none'
  ctaStyle?:       'soft' | 'medium' | 'aggressive'
  brandKeywords?:  string
  productUrl?: string
  avoidWords?:     string
  storeName?:      string
  niche?:          string
  platform?:       string
  variants?:       number
  quality?:        'fast' | 'high'   // hanya dihormati untuk Pro+ plan
}

interface GenerateState {
  text:        string            // streaming text accumulator
  captions:    string[]          // parsed variasi (setelah selesai)
  isStreaming: boolean
  error:       string | null
  model:       string | null     // "Cepat" atau "Kualitas"
  cached:      boolean           // true jika dari cache
}

export function useGenerateCaption() {
  const [state, setState] = useState<GenerateState>({
    text:        '',
    captions:    [],
    isStreaming: false,
    error:       null,
    model:       null,
    cached:      false,
  })
  const {
  text,
  error,
} = state

  const updateQuota = useSessionStore(s => s.updateQuota)

  const generate = useCallback(async (params: GenerateParams) => {
    setState({
      text: '', captions: [], isStreaming: true,
      error: null, model: null, cached: false,
    })

    try {
      const res = await fetch('/api/generate/text', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      })

      // ── Handle non-streaming error responses ──
      if (!res.ok && res.headers.get('Content-Type')?.includes('application/json')) {
        const err = await res.json()

        // Quota exceeded
        if (err.error === 'QUOTA_EXCEEDED') {
          setState(s => ({ ...s, isStreaming: false, error: err.message ?? 'Kuota habis.' }))
          return
        }
        // Rate limited
        if (err.error === 'RATE_LIMITED') {
          setState(s => ({ ...s, isStreaming: false, error: 'Terlalu cepat. Tunggu 1 menit.' }))
          return
        }
        // Auth
        if (res.status === 401) {
          setState(s => ({ ...s, isStreaming: false, error: 'Session habis. Login ulang.' }))
          return
        }
        // AI busy (OpenAI 429/503)
        if (err.error === 'AI_BUSY') {
          setState(s => ({ ...s, isStreaming: false, error: err.message }))
          return
        }
        // Validation
        setState(s => ({ ...s, isStreaming: false, error: err.message ?? 'Gagal generate.' }))
        return
      }

      // ── Cached response (JSON, not stream) ──
      const contentType = res.headers.get('Content-Type') ?? ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        setState({
          text:        data.captions?.join('\n\n') ?? '',
          captions:    data.captions ?? [],
          isStreaming: false,
          error:       null,
          model:       data.model ?? null,
          cached:      data.cached ?? false,
        })
        return
      }

      // ── Streaming response ──
      const model     = res.headers.get('X-AI-Model')
      const remaining = res.headers.get('X-RateLimit-Remaining')
      setState(s => ({ ...s, model }))

      const reader  = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk

        // Update state setiap chunk untuk real-time display
        setState(s => ({ ...s, text: accumulated }))
      }

      // Setelah streaming selesai, parse JSON untuk dapat captions array
      let captions: string[] = []
      try {
        const parsed = JSON.parse(accumulated)
        captions = parsed.captions ?? []
      } catch {
        const match = accumulated.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            captions = JSON.parse(match[0]).captions ?? []
          } catch {}
        }
        // Fallback: treat entire text as single caption
        if (captions.length === 0) captions = [accumulated.trim()]
      }

      setState(s => ({ ...s, captions, isStreaming: false }))

      // Optimistic quota update — kurangi 1 di Zustand agar progress bar
      // langsung update tanpa tunggu refetch session
      updateQuota('content', 1)

    } catch (err: any) {
      console.error('[useGenerateCaption]', err)
      setState(s => ({
        ...s,
        isStreaming: false,
        error:       err.message ?? 'Koneksi bermasalah. Coba lagi.',
      }))
    }
  }, [updateQuota])

  const reset = useCallback(() => {
    setState({
      text: '', captions: [], isStreaming: false,
      error: null, model: null, cached: false,
    })
  }, [])
  

const captions: string[] = []

const variants = captions.map(
  (caption, index) => ({
    id: String(index),

    caption,

    hashtags: [],

    cta: '',
  })
)

const isStreaming = false
const model = null
const cached = false

return {
  generate,
  reset,

  // old API
  text,
  captions,
  contentId: null,
  // new API
  rawText:
    typeof text === 'string'
      ? text
      : '',

  variants,

  isStreaming,
  error,
  model,
  cached,
}
}