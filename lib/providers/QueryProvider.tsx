'use client'
// apps/web-app/lib/providers/QueryProvider.tsx
// ── TanStack Query Provider + Supabase Auth Listener ─────────
// Satu provider yang handle:
//   1. TanStack QueryClient dengan config optimal
//   2. Supabase auth state listener → sync ke Zustand + invalidate query
//   3. ReactQueryDevtools (dev only)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools }                from '@tanstack/react-query-devtools'
import { ReactNode, useEffect, useRef, useState }       from 'react'
import { createClient }                      from '@/lib/supabase/client'
import { useSessionStore }                   from '@/store/sessionStore'
import { SESSION_KEY }                       from '@/hooks/useSession'



function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stale setelah 10 menit
        staleTime:            10 * 60 * 1000,
        // Keep in cache 15 menit setelah tidak ada subscriber
        gcTime:               15 * 60 * 1000,
        // Retry max 2x, jangan retry error 4xx
        retry:                (count, error: any) => {
          if (error?.status >= 400 && error?.status < 500) return false
          return count < 2
        },
        retryDelay:           (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        refetchOnWindowFocus: true,
        refetchOnReconnect:   true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

// ── Supabase Auth Listener ────────────────────────────────────
function SupabaseAuthListener({ queryClient }: { queryClient: QueryClient }) {
  const clearSession = useSessionStore(s => s.clearSession)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Session baru / refresh → invalidate agar TanStack Query fetch ulang
          queryClient.invalidateQueries({ queryKey: SESSION_KEY })
        }

        if (event === 'SIGNED_OUT') {
          // Logout → clear semua cache + Zustand store
          clearSession()
          queryClient.clear()
        }

        if (event === 'USER_UPDATED') {
          // User update (email change, dll) → refresh session
          queryClient.invalidateQueries({ queryKey: SESSION_KEY })
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [queryClient, clearSession])

  return null
}

// ── Provider ─────────────────────────────────────────────────

interface Props {
  children: ReactNode
}
export function QueryProvider({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthListener queryClient={queryClient} />
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
