'use client'
// apps/web-app/lib/hooks/useSearch.ts
// ── Full-text search hook ─────────────────────────────────────
// Debounce 300ms → TanStack Query → returns items with highlights
import { useState, useEffect, useCallback } from 'react'
import { useQuery }                          from '@tanstack/react-query'

export interface SearchItem {
  id:               string
  type:             string
  status:           string
  title:            string | null
  caption_text:      string | null
  media_url:         string | null
  imageThumbUrl:    string | null
  primary_platform:  string | null
  isStarred:        boolean
  tags:             string[]
  folderId:         string | null
  created_at:        string
  updated_at:        string
  rank:             number | null
  matchType:        'fts' | 'trigram' | null
  highlightCaption: string | null
  hashtags?: string[] | null
  mentions?: string[] | null
  keywords?: string[] | null
  platform?: string | null
  thumbnailUrl?: string | null
  captionPreview?: string | null
  
}

export interface SearchMeta {
  query:     string
  matchType: 'fts' | 'trigram' | 'none'
}

interface SearchResponse {
  items:      SearchItem[]
  total:      number
  hasMore:    boolean
  searchMeta: SearchMeta | null
}

// ── Fetch ──────────────────────────────────────────────────
async function fetchSearch(params: {
  q:        string
  type?:    string
  status?:  string
  platform?: string
}): Promise<SearchResponse> {
  const sp = new URLSearchParams()
  sp.set('q', params.q)
  if (params.type     && params.type     !== 'all') sp.set('type',     params.type)
  if (params.status   && params.status   !== 'all') sp.set('status',   params.status)
  if (params.platform && params.platform !== 'all') sp.set('platform', params.platform)
  sp.set('limit', '20')

  const res = await fetch(`/api/search?${sp.toString()}`)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()

  return {
    items:      data.items ?? [],
    total:      data.total ?? 0,
    hasMore:    data.hasMore ?? false,
    searchMeta: data.matchType
      ? { query: data.query, matchType: data.matchType }
      : null,
  }
}

// ── Autocomplete suggestions fetch ────────────────────────
async function fetchSuggestions(q: string): Promise<Array<{ id: string; title: string; type: string }>> {
  if (q.length < 2) return []
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&suggest=true`)
  if (!res.ok) return []
  const data = await res.json()
  return data.suggestions ?? []
}

// ── Main search hook ───────────────────────────────────────
export function useSearch(params: {
  q:        string
  type?:    string
  status?:  string
  platform?: string
  enabled?: boolean
}) {
  const [debouncedQ, setDebouncedQ] = useState(params.q)

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(params.q), 300)
    return () => clearTimeout(timer)
  }, [params.q])

  const shouldSearch = (params.enabled ?? true) && debouncedQ.trim().length >= 1

  return useQuery({
    queryKey:  ['search', debouncedQ, params.type, params.status, params.platform],
    queryFn:   () => fetchSearch({
      q:        debouncedQ,
      type:     params.type,
      status:   params.status,
      platform: params.platform,
    }),
    enabled:   shouldSearch,
    staleTime: 30_000,   // 30 sec (search results cached briefly)
    placeholderData: (prev) => prev,   // keep previous results while typing
  })
}

// ── Suggestion hook (lighter, no debounce needed separately) ──
export function useSearchSuggestions(q: string) {
  const [debouncedQ, setDebouncedQ] = useState(q)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 200)  // 200ms for suggestions
    return () => clearTimeout(timer)
  }, [q])

  return useQuery({
    queryKey: ['search-suggestions', debouncedQ],
    queryFn:  () => fetchSuggestions(debouncedQ),
    enabled:  debouncedQ.length >= 2,
    staleTime: 10_000,
  })
}

// ── Utility: is currently in search mode ──────────────────
export function useIsSearching(q: string) {
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    if (!q.trim()) { setIsDebouncing(false); return }
    setIsDebouncing(true)
    const t = setTimeout(() => setIsDebouncing(false), 300)
    return () => clearTimeout(t)
  }, [q])

  return isDebouncing
}