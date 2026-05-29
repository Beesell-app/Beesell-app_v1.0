'use client'
// apps/web-app/components/auth/LogoutButton.tsx
// ── Logout Button + Token Refresh Logic ───────────────────────
//
// 1. LogoutButton — komponen siap pakai untuk sidebar/topbar
// 2. useSessionRefresh — hook untuk auto-refresh token di background
//    Supabase auto-refresh sesungguhnya built-in, tapi hook ini
//    tambahkan: detect expired session, force refresh, redirect ke /login

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { logoutAction } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'

// ── useSessionRefresh ─────────────────────────────────────────
// Auto-refresh Supabase session + redirect ke login kalau expired
export function useSessionRefresh() {
  const router   = useRouter()
  const supabase = createClient()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    // Refresh 60 detik sebelum expired
    const msUntilExpiry  = (expiresAt * 1000) - Date.now()
    const msUntilRefresh = Math.max(msUntilExpiry - 60_000, 0)

    timerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()

        if (error || !data.session) {
          // Session tidak bisa direfresh → logout ke login
          console.warn('[useSessionRefresh] Refresh failed, redirecting to login')
          router.push('/login?error=session_expired')
          return
        }

        console.log('[useSessionRefresh] Token refreshed OK')
        // Schedule refresh berikutnya
        scheduleRefresh(data.session.expires_at!)
      } catch {
        router.push('/login?error=session_expired')
      }
    }, msUntilRefresh)
  }, [router, supabase])

  useEffect(() => {
    // Get session awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Tidak ada session → tidak perlu setup refresh
        return
      }
      scheduleRefresh(session.expires_at!)
    })

    // Listen Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[useSessionRefresh] TOKEN_REFRESHED event received')
        scheduleRefresh(session.expires_at!)
      }

      if (event === 'SIGNED_OUT') {
        router.push('/login?message=logged_out')
      }

      if (event === 'USER_UPDATED') {
        console.log('[useSessionRefresh] User updated')
      }
    })

    return () => {
      subscription.unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [scheduleRefresh, supabase, router])
}

// ── LogoutButton Props ────────────────────────────────────────
interface LogoutButtonProps {
  variant?:  'sidebar' | 'topbar' | 'menu-item' | 'icon-only'
  collapsed?: boolean  // sidebar collapsed mode
  className?: string
}

// ── LogoutButton ──────────────────────────────────────────────
export function LogoutButton({ variant = 'sidebar', collapsed = false }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)

    try {
      // Juga clear client-side session lewat Supabase JS
      const supabase = createClient()
      await supabase.auth.signOut({ scope: 'local' })

      // Clear localStorage items BeeSell
      localStorage.removeItem('beesell-onboarding-v2')
      localStorage.removeItem('beesell-onboarding-done')
      sessionStorage.clear()
    } catch {
      // Non-fatal — server action akan handle redirect
    }

    // Server action: invalidate session di server + redirect
    await logoutAction()
  }

  // ── Variant: sidebar (default) ────────────────────────────
  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        title={collapsed ? 'Keluar' : undefined}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            collapsed ? 0 : '10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          width:          '100%',
          padding:        collapsed ? '10px 0' : '9px 12px',
          borderRadius:   '10px',
          border:         'none',
          background:     'transparent',
          cursor:         loading ? 'not-allowed' : 'pointer',
          fontFamily:     "'DM Sans', sans-serif",
          fontSize:       '13px',
          fontWeight:     500,
          color:          '#DC2626',
          opacity:        loading ? 0.6 : 1,
          transition:     'all .12s',
        }}
        onMouseEnter={e => {
          if (!loading) (e.currentTarget as HTMLElement).style.background = '#FEF2F2'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
        }}
      >
        {loading
          ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#DC2626' }} />
          : <LogOut size={18} />
        }
        {!collapsed && <span>{loading ? 'Keluar...' : 'Keluar'}</span>}
      </button>
    )
  }

  // ── Variant: icon-only (kompak) ───────────────────────────
  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        title="Keluar"
        style={{
          width:          '34px',
          height:         '34px',
          borderRadius:   '8px',
          border:         '1px solid #E2E8F0',
          background:     '#fff',
          cursor:         loading ? 'not-allowed' : 'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          '#DC2626',
          opacity:        loading ? 0.6 : 1,
          transition:     'all .12s',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#FEF2F2' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
      >
        {loading
          ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          : <LogOut size={14} />
        }
      </button>
    )
  }

  // ── Variant: menu-item (dropdown menu) ───────────────────
  if (variant === 'menu-item') {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '10px',
          width:       '100%',
          padding:     '9px 14px',
          border:      'none',
          background:  'transparent',
          cursor:      loading ? 'not-allowed' : 'pointer',
          fontFamily:  "'DM Sans', sans-serif",
          fontSize:    '13px',
          fontWeight:  500,
          color:       '#DC2626',
          textAlign:   'left',
          borderTop:   '1px solid #E2E8F0',
          marginTop:   '4px',
          opacity:     loading ? 0.6 : 1,
          transition:  'background .12s',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#FEF2F2' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {loading
          ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
          : <LogOut size={15} />
        }
        {loading ? 'Keluar...' : 'Keluar dari akun'}
      </button>
    )
  }

  // ── Variant: topbar (text + icon) ────────────────────────
  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '6px',
        padding:     '7px 12px',
        borderRadius:'8px',
        border:      '1px solid #E2E8F0',
        background:  '#fff',
        cursor:      loading ? 'not-allowed' : 'pointer',
        fontSize:    '12px',
        fontWeight:  600,
        color:       '#DC2626',
        fontFamily:  "'DM Sans', sans-serif",
        opacity:     loading ? 0.6 : 1,
        transition:  'all .12s',
      }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#FEF2F2' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
    >
      {loading
        ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
        : <LogOut size={13} />
      }
      {loading ? 'Keluar...' : 'Keluar'}
    </button>
  )
}

// ── SessionProvider ───────────────────────────────────────────
// Bungkus di layout dashboard untuk aktifkan auto-refresh
// Usage: <SessionProvider>{children}</SessionProvider>
export function SessionProvider({ children }: { children: React.ReactNode }) {
  useSessionRefresh()
  return <>{children}</>
}