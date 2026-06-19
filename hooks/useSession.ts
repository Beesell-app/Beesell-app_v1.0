// apps/web-app/lib/hooks/useSession.ts
// Rule: hook ini TIDAK pernah redirect ke /login saat 401
// Redirect adalah tanggung jawab middleware.ts (server-side)
// Hook ini hanya fetch + sync ke Zustand
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import type { AppSession, SessionResponse, UserPreferences } from '@/types/session'

export const SESSION_KEY = ['session'] as const

async function fetchSession(): Promise<AppSession> {
  const res = await fetch('/api/auth/session', { credentials: 'same-origin' })

  // 401 = belum login, bukan error — throw agar TanStack Query tahu
  if (res.status === 401) {
    const err = new Error('UNAUTHORIZED') as any
    err.status = 401
    throw err
  }

  if (!res.ok) throw new Error('fetch_session_failed')

  const data: SessionResponse = await res.json()
  if (!data.success || !data.data) throw new Error(data.error ?? 'no_data')

  return data.data
}

async function updateMeFn(patch: {
  name?:        string
  avatar_url?:   string | null
  preferences?: Partial<UserPreferences>
}) {
  const res = await fetch('/api/auth/me', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('update_me_failed')
  return res.json()
}

// ── useSession ────────────────────────────────────────────────
// Aman dipanggil dari halaman apapun termasuk /login
// Tidak akan menyebabkan redirect loop
export function useSession({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient()
  const store       = useSessionStore()

  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn:  fetchSession,
    enabled,                          // caller tentukan kapan fetch
    staleTime:            10 * 60 * 1000,
    gcTime:               15 * 60 * 1000,
    refetchOnWindowFocus: enabled,
    refetchOnReconnect:   enabled,
    // Tidak retry kalau 401 — bukan transient error
    retry: (count, err: any) => err?.status !== 401 && count < 2,
  })

  // Sync data ke Zustand saat berhasil
  useEffect(() => {
    if (query.data) store.setSession(query.data)
  }, [query.data])

  // 401 → clear store saja, TIDAK redirect
  // Middleware server-side yang akan redirect ke /login
  useEffect(() => {
    const err = query.error as any
    if (err?.status === 401 || err?.message === 'UNAUTHORIZED') {
      store.clearSession()
      queryClient.removeQueries({ queryKey: SESSION_KEY })
    }
  }, [query.error])

  useEffect(() => {
    store.setLoading(query.isLoading)
  }, [query.isLoading])

  return {
    session:   query.data ?? null,
    user:      query.data?.user   ?? store.user,
    tenant:    query.data?.tenant ?? store.tenant,
    isLoading: query.isPending && !store.isLoaded,
    isError:   query.isError,
    refetch:   () => queryClient.invalidateQueries({ queryKey: SESSION_KEY }),
  }
}

// ── useUpdateMe ───────────────────────────────────────────────
export function useUpdateMe() {
  const queryClient = useQueryClient()
  const updateUser  = useSessionStore(s => s.updateUser)
  const updatePrefs = useSessionStore(s => s.updatePreferences)

  return useMutation({
    mutationFn: updateMeFn,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: SESSION_KEY })
      const prev = queryClient.getQueryData<AppSession>(SESSION_KEY)
      if (patch.name)                   updateUser({ name: patch.name })
      if (patch.avatar_url !== undefined) updateUser({ avatar_url: patch.avatar_url })
      if (patch.preferences)            updatePrefs(patch.preferences)
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(SESSION_KEY, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEY })
    },
  })
}

// ── useInvalidateSession ──────────────────────────────────────
export function useInvalidateSession() {
  const queryClient = useQueryClient()
  const clearStore  = useSessionStore(s => s.clearSession)
  return () => {
    clearStore()
    queryClient.removeQueries({ queryKey: SESSION_KEY })
  }
}