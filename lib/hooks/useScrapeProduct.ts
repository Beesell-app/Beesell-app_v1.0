'use client'
// apps/web-app/lib/hooks/useScrapeProduct.ts
// Hook untuk input URL produk → auto-scrape atau fallback manual
import { useState, useCallback } from 'react'

export interface ScrapedProduct {
  name:         string
  price:        string | null
  priceNumeric: number | null
  description:  string | null
  images:       string[]
  marketplace:  string
  url:          string
  sellerName:   string | null
  rating:       number | null
  soldCount:    number | null
  location:     string | null
  strategy:     string
  elapsedMs:    number
}

type ScrapeState =
  | { status: 'idle' }
  | { status: 'scraping' }
  | { status: 'success'; data: ScrapedProduct }
  | { status: 'fallback'; reason: string; message: string }  // user input manual
  | { status: 'error'; error: string; message: string }

export function useScrapeProduct() {
  const [state, setState] = useState<ScrapeState>({ status: 'idle' })

  const scrape = useCallback(async (url: string) => {
    setState({ status: 'scraping' })

    try {
      const res = await fetch('/api/scrape/product', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url }),
      })

      if (res.status === 401) {
        setState({ status: 'error', error: 'unauthorized', message: 'Session expired. Login ulang.' })
        return
      }

      if (res.status === 429) {
        const data = await res.json()
        setState({ status: 'error', error: 'rate_limited', message: data.message ?? 'Terlalu banyak request.' })
        return
      }

      const data = await res.json()

      // Backend return fallback → user harus input manual
      if (data.fallback === 'manual_required') {
        setState({
          status:  'fallback',
          reason:  data.error ?? 'unknown',
          message: data.message ?? 'Silakan input produk secara manual.',
        })
        return
      }

      if (data.success && data.data) {
        setState({ status: 'success', data: data.data })
        return
      }

      // Other errors
      setState({
        status:  'error',
        error:   data.error ?? 'unknown',
        message: data.message ?? 'Terjadi kesalahan.',
      })

    } catch (err: any) {
      console.error('[useScrapeProduct]', err)
      setState({
        status:  'error',
        error:   'network',
        message: 'Koneksi bermasalah. Coba lagi.',
      })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  return {
    state,
    scrape,
    reset,

    // Shortcut helpers
    isIdle:     state.status === 'idle',
    isScraping: state.status === 'scraping',
    isSuccess:  state.status === 'success',
    isFallback: state.status === 'fallback',
    isError:    state.status === 'error',

    data:       state.status === 'success'  ? state.data    : null,
    error:      state.status === 'error'    ? state.message : null,
    fallbackMsg: state.status === 'fallback' ? state.message : null,
  }
}