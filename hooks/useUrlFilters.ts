'use client'
// apps/web-app/lib/hooks/useUrlFilters.ts
// Sync filter state dengan URL search params
// Browser back/forward → restore filter
// Refresh → preserve filter
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { LibraryFilters, ContentType, ContentStatus, ContentPlatform, SortOrder } from '@/lib/library-types'

export function useUrlFilters() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()

  // ── Read filters from URL ──────────────────────────────
  const filters: LibraryFilters = useMemo(() => {
    return {
      q:        searchParams.get('q')        ?? '',
      type:     (searchParams.get('type')     ?? 'all') as ContentType,
      status:   (searchParams.get('status')   ?? 'all') as ContentStatus,
      platform: (searchParams.get('platform') ?? 'all') as ContentPlatform,
      sort:     (searchParams.get('sort')     ?? 'newest') as SortOrder,
    }
  }, [searchParams])

  // ── Update filter (replace URL) ────────────────────────
  const setFilter = useCallback((key: keyof LibraryFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    // Remove kalau default value
    if (value === 'all' || value === '' || value === 'newest') {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname

    router.replace(url, { scroll: false })
  }, [searchParams, pathname, router])

  // ── Update multiple filters at once ────────────────────
  const setFilters = useCallback((updates: Partial<LibraryFilters>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || value === '' || value === 'newest' || value === undefined) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname

    router.replace(url, { scroll: false })
  }, [searchParams, pathname, router])

  // ── Clear all filters ──────────────────────────────────
  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  // ── Active filters count (untuk badge) ─────────────────
  const activeFiltersCount = [
    filters.q,
    filters.type !== 'all' ? filters.type : null,
    filters.status !== 'all' ? filters.status : null,
    filters.platform !== 'all' ? filters.platform : null,
  ].filter(Boolean).length

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    activeFiltersCount,
  }
}