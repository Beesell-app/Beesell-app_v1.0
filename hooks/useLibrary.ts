'use client'
// apps/web-app/lib/hooks/useLibrary.ts
// Infinite scroll dengan TanStack useInfiniteQuery
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { LibraryFilters, LibraryPage, LibraryResponse } from '@/lib/library-types'

// ── Query key factory ──────────────────────────────────────
export const libraryKeys = {
  all:   ['library'] as const,
  list:  (filters: LibraryFilters) => ['library', 'list', filters] as const,
  item:  (id: string) => ['library', 'item', id] as const,
}

// ── Fetch single page ─────────────────────────────────────
async function fetchLibraryPage({
  pageParam,
  filters,
}: {
  pageParam: string | null
  filters:   LibraryFilters
}): Promise<LibraryPage> {
  const params = new URLSearchParams()
  if (pageParam)         params.set('cursor', pageParam)
  if (filters.q)         params.set('q', filters.q)
  if (filters.type)      params.set('type', filters.type)
  if (filters.status)    params.set('status', filters.status)
  if (filters.platform)  params.set('platform', filters.platform)
  if (filters.sort)      params.set('sort', filters.sort)

  const res = await fetch(`/api/library?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Failed to load library')
  }

  const json: LibraryResponse = await res.json()
  return json.data
}

// ── Main hook: useInfiniteQuery ────────────────────────────
export function useLibrary(filters: LibraryFilters) {
  return useInfiniteQuery({
    queryKey: libraryKeys.list(filters),
    queryFn: ({ pageParam }) => fetchLibraryPage({ pageParam, filters }),

    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,

    staleTime: 60 * 1000,       // 1 menit
    gcTime: 5 * 60 * 1000,       // 5 menit di cache

    // Don't refetch saat user balik tab (bisa annoying kalau ada banyak data)
    refetchOnWindowFocus: false,
  })
}

// ── Helper: invalidate list (pakai setelah create/update/delete) ──
export function useInvalidateLibrary() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: libraryKeys.all })
}

// ── Helper: get flat items dari semua pages ────────────────
export function getFlatItems(data: ReturnType<typeof useLibrary>['data']) {
  return data?.pages.flatMap(p => p.items) ?? []
}