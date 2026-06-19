'use client'
// apps/web-app/components/auth/LogoutButton.tsx — BeeSell AI Premium Logout & Session Engine v7.0
// ── Logout Button + Token Refresh Logic ───────────────────────
//
// 1. LogoutButton — komponen siap pakai untuk sidebar/topbar
// 2. useSessionRefresh — hook untuk auto-refresh token di background
//    Supabase auto-refresh sesungguhnya built-in, tapi hook ini
//    tambahkan: detect expired session, force refresh, redirect ke /login
// Design Specification: Ultra-Luxury SaaS (Minimalist Centered Glassmorphism Architecture)
// Animation Hub: 2D Mindblowing Quantum Nodes, Matrix Circuit Flows, and Reactive Neon Glow Trails

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { logoutAction } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'

// 1. BRAND LUXURY ARCHITECTURE LIGHT-MODE COLOR TOKENS
const C = {
  brand: '#F59E0B',        // Bee Gold
  brandDark: '#D97706',    // Honey Deep
  brandLight: '#FEF3C7',   // Honey Cream
  brandBg: '#FFFBEB',      // Honey Mist

  // Bee Accent
  pollen: '#FBBF24',
  honey: '#F59E0B',
  nectar: '#FCD34D',

  // Hive Neutrals
  hive900: '#111827',
  hive800: '#1F2937',
  hive700: '#374151',
  hive600: '#4B5563',
  hive500: '#6B7280',
  hive400: '#9CA3AF',
  hive300: '#D1D5DB',
  hive200: '#E5E7EB',
  hive100: '#F3F4F6',

  // Semantic
  success: '#10B981',
  danger: '#EF4444',       // Replaced generic red with structured semantic tokens
  dangerBg: '#FEF2F2',
  dangerDark: '#DC2626',

  // Surface
  white: '#FFFFFF',
  bg: '#FAFAF9',
}

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
        className="logout-sidebar-btn link-cyber-lux"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1.5px solid transparent',
          background: 'rgba(220, 38, 38, 0.02)',
          color: C.dangerDark,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          boxSizing: 'border-box',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="logout-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {loading ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <LogOut size={18} />
          )}
        </div>

        {!collapsed && (
          <div className="logout-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span className="logout-title">
              {loading ? 'Keluar...' : 'Keluar'}
            </span>
            {!loading && (
              <span className="logout-subtitle" style={{ fontSize: '11px', color: C.hive400, fontWeight: 500, marginTop: '1px' }}>
                Kembali ke Gerbang Login
              </span>
            )}
          </div>
        )}
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
        className="btn-cyber-action"
        style={{
          width:          '36px',
          height:         '36px',
          borderRadius:   '12px',
          border:         `1.5px solid rgba(217, 119, 6, 0.15)`,
          background:     loading ? C.brandBg : C.white,
          cursor:         loading ? 'not-allowed' : 'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          C.dangerDark,
          opacity:        loading ? 0.6 : 1,
          boxSizing:      'border-box',
          transition:     'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {loading
          ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          : <LogOut size={16} />
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
        className="btn-dropdown-logout"
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '10px',
          width:       '100%',
          padding:     '11px 16px',
          border:      'none',
          background:  'transparent',
          cursor:      loading ? 'not-allowed' : 'pointer',
          fontFamily:  "'DM Sans', sans-serif",
          fontSize:    '13px',
          fontWeight:  700,
          color:       C.dangerDark,
          textAlign:   'left',
          borderTop:   `1px solid rgba(217, 119, 6, 0.1)`,
          marginTop:   '6px',
          opacity:     loading ? 0.6 : 1,
          transition:  'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {loading
          ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          : <LogOut size={16} />
        }
        {loading ? 'Keluar...' : 'Keluar dari akun'}
      </button>
    )
  }

  // ── Variant: topbar (text + icon) ────────────────topbar──
  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn-cyber-action"
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '8px',
        padding:     '8px 14px',
        borderRadius:'12px',
        border:      `1.5px solid rgba(217, 119, 6, 0.15)`,
        background:  C.white,
        cursor:      loading ? 'not-allowed' : 'pointer',
        fontSize:    '13px',
        fontWeight:  700,
        color:       C.dangerDark,
        fontFamily:  "'DM Sans', sans-serif",
        opacity:     loading ? 0.6 : 1,
        transition:  'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {loading
        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        : <LogOut size={14} />
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
  return (
    <>
      {children}
      {/* ── HIGH TECH LUXURY INTERACTIVE SAAS STYLE ENGINE ── */}
      <style>{`
        .btn-cyber-action:hover {
          background: ${C.dangerBg} !important;
          border-color: rgba(220, 38, 38, 0.25) !important;
          transform: translateY(-0.5px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.05);
        }

        .logout-sidebar-btn:hover {
          background: ${C.dangerBg} !important;
          border-color: rgba(220, 38, 38, 0.2) !important;
          transform: perspective(1400px) rotateX(1deg) translateY(-1px);
          box-shadow: 0 8px 20px -6px rgba(220, 38, 38, 0.1) !important;
        }

        .btn-dropdown-logout:hover {
          background: ${C.dangerBg} !important;
          padding-left: 18px !important;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}