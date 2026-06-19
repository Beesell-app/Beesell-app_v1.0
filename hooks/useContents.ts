'use client'
// apps/web-app/lib/hooks/useContents.ts
// TanStack Query hooks untuk content CRUD
import {
  useQuery, useMutation, useInfiniteQuery, useQueryClient,
} from '@tanstack/react-query'
import type { Content, ContentStatus, ContentType } from '@/lib/types/content'
// ── Query keys ───────────────────────────────────────────────
export const contentKeys = {
  all:    ['contents'] as const,
  lists:  () => [...contentKeys.all, 'list'] as const,
  list:   (filters: ListFilters) => [...contentKeys.lists(), filters] as const,
  detail: (id: string) => [...contentKeys.all, 'detail', id] as const,
}

interface ListFilters {
  status?:    ContentStatus | ContentStatus[]
  type?:      ContentType
  folderId?:  string | null
  search?:    string
  starred?:   boolean
  orderBy?:   'created' | 'updated'
}

interface ListResponse {
  success:     true
  items:       Content[]
  nextCursor:  string | null
  total:       number
}

// ── useContentList (infinite scroll) ─────────────────────────
export function useContentList(filters: ListFilters = {}) {
  return useInfiniteQuery({
    queryKey: contentKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const url = new URL('/api/contents', window.location.origin)
      if (filters.status)   url.searchParams.set('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status)
      if (filters.type)     url.searchParams.set('type',  filters.type)
      if (filters.folderId !== undefined) url.searchParams.set('folderId', filters.folderId ?? '')
      if (filters.search)   url.searchParams.set('search', filters.search)
      if (filters.starred)  url.searchParams.set('starred', 'true')
      if (filters.orderBy)  url.searchParams.set('orderBy', filters.orderBy)
      if (pageParam)        url.searchParams.set('cursor', pageParam as string)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch contents')
      return res.json() as Promise<ListResponse>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30 * 1000,
  })
}

// ── useContent (single detail) ───────────────────────────────
export function useContent(id: string | null) {
  return useQuery({
    queryKey: contentKeys.detail(id ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/contents/${id}`)
      if (!res.ok) throw new Error('Failed to fetch content')
      const data = await res.json()
      return data.data as Content
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

// ── useUpdateContent ─────────────────────────────────────────
export function useUpdateContent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...patch }: {
      id:          string
      caption_text?: string
      hashtags?:   string[]
      title?:      string
      tags?:       string[]
      folderId?:   string | null
      isStarred?:  boolean
    }) => {
      const res = await fetch(`/api/contents/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Update failed')
      const data = await res.json()
      return data.data as Content
    },
    onSuccess: (updated) => {
      // Update cache untuk detail
      qc.setQueryData(contentKeys.detail(updated.id), updated)
      // Invalidate lists
      qc.invalidateQueries({ queryKey: contentKeys.lists() })
    },
  })
}

// ── useArchiveContent / useRestoreContent ────────────────────
export function useContentAction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'archive' | 'restore' }) => {
      const res = await fetch(`/api/contents/${id}/status`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? 'Action failed')
      }
      const data = await res.json()
      return data.data as Content
    },
    onSuccess: (updated) => {
      qc.setQueryData(contentKeys.detail(updated.id), updated)
      qc.invalidateQueries({ queryKey: contentKeys.lists() })
    },
  })
}

// ── useDeleteContent ─────────────────────────────────────────
export function useDeleteContent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return id
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: contentKeys.detail(id) })
      qc.invalidateQueries({ queryKey: contentKeys.lists() })
    },
  })
}