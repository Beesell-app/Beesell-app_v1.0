'use client'
// apps/web-app/lib/providers/SessionHydrator.tsx
import { usePathname }    from 'next/navigation'
import { useSession }     from '@/lib/hooks/useSession'
import { useSessionStore } from '@/store/sessionStore'

// Halaman yang tidak perlu hydrate session
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/auth/']

// Fetch + sync ke Zustand — hanya di-render di protected pages
function SessionFetcher() {
  useSession()
  return null
}

function SessionSkeleton() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#F8FAFC',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          borderRadius: '12px', margin: '0 auto 16px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <p style={{ fontSize: '13px', color: '#94A3B8' }}>Memuat...</p>
      </div>
      <style>{`
        @keyframes pulse {
          0%,100%{ opacity:1; transform:scale(1); }
          50%    { opacity:.7; transform:scale(.95); }
        }
      `}</style>
    </div>
  )
}

interface Props { children: React.ReactNode }

export function SessionHydrator({ children }: Props) {
  const pathname  = usePathname()
  const isLoaded  = useSessionStore(s => s.isLoaded)
  const isLoading = useSessionStore(s => s.isLoading)

  // FIX: jangan fetch session di halaman auth
  // Ini root cause infinite loop — /login mount SessionFetcher
  // → fetch /api/auth/session → 401 → redirect /login → loop
  const isAuthPage = AUTH_PATHS.some(p => pathname?.startsWith(p))

  // Skeleton hanya saat belum loaded DAN bukan auth page
  const showSkeleton = !isLoaded && isLoading && !isAuthPage

  return (
    <>
      {/* FIX: SessionFetcher TIDAK di-render di halaman auth */}
      {!isAuthPage && <SessionFetcher />}
      {showSkeleton && <SessionSkeleton />}
      {children}
    </>
  )
}
