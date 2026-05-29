'use client'
// apps/web-app/components/dashboard/TopBar.tsx
// ── Responsive top bar ────────────────────────────────────────
// Mobile: hamburger + logo + avatar
// Desktop: breadcrumb / page title + right actions
import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Sparkles, Bell } from 'lucide-react'
import { useSidebarStore } from '@/store/sidebarStore'
import { useHasExpiredConnection } from '@/lib/hooks/usePlatformConnections'
import { useHasExpiredConnection as _hook } from '@/lib/hooks/usePlatformConnections'
import { NotificationBell } from '@/components/notifications/NotificationBell'
// Breadcrumb label per route
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':            'Dashboard',
  '/content':              'Konten Saya',
  '/content/new':          'Buat Konten Baru',
  '/library':              'Content Library',
  '/editor':               'Template Editor',
  '/scheduler':            'Jadwal Post',
  '/settings':             'Pengaturan',
  '/settings/brand-kit':   'Brand Kit',
  '/settings/connections': 'Koneksi Platform',
  '/settings/billing':     'Billing',
  '/analytics':            'Analytics',
}

function usePageTitle(): string {
  const pathname = usePathname()
  // Exact match first
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  // Prefix match (for dynamic routes like /content/[id])
  const prefix = Object.keys(ROUTE_LABELS)
    .filter(k => pathname.startsWith(k) && k !== '/')
    .sort((a, b) => b.length - a.length)[0]
  return ROUTE_LABELS[prefix ?? ''] ?? 'BeeSell AI'
}

export function TopBar() {
  const pageTitle       = usePageTitle()
  const setMobileOpen   = useSidebarStore(s => s.setMobileOpen)
  const collapsed       = useSidebarStore(s => s.collapsed)
  const hasExpired      = useHasExpiredConnection()

  const sidebarW = collapsed ? 64 : 240

  return (
    <header
      style={{
        position:    'sticky',
        top:         0,
        zIndex:      30,
        background:  '#fff',
        borderBottom: '1px solid #E2E8F0',
        height:      '56px',
        display:     'flex',
        alignItems:  'center',
        paddingLeft: '16px',
        paddingRight: '16px',
        gap:         '12px',
        boxShadow:   '0 1px 0 #E2E8F0',
        fontFamily:  "'DM Sans', sans-serif",
      }}
      className="topbar"
    >
      {/* Mobile: hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="topbar-hamburger"
        aria-label="Buka menu"
        style={{
          width:          '44px',
          height:         '44px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'transparent',
          border:         'none',
          borderRadius:   '10px',
          cursor:         'pointer',
          color:          '#334155',
          flexShrink:     0,
          marginLeft:     '-8px',
        }}
      >
        <Menu size={20} />
      </button>
      <NotificationBell />
      {/* Mobile: logo */}
      <Link
        href="/dashboard"
        className="topbar-mobile-logo"
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '7px',
          textDecoration: 'none',
        }}
      >
        <div style={{
          width:          '24px',
          height:         '24px',
          background:     'linear-gradient(135deg, #2563EB, #7C3AED)',
          borderRadius:   '7px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <Sparkles size={12} color="#fff" />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
          BeeSell AI
        </span>
      </Link>

      {/* Desktop: page title */}
      <h1
        className="topbar-title"
        style={{
          fontSize:      '15px',
          fontWeight:    700,
          color:         '#0F172A',
          margin:        0,
          letterSpacing: '-0.01em',
        }}
      >
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Alert bell (expired platform) */}
      {hasExpired && (
        <Link
          href="/settings/connections"
          title="Ada koneksi platform yang expired"
          style={{
            position:       'relative',
            width:          '36px',
            height:         '36px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            background:     '#FEF2F2',
            border:         '1px solid #FECACA',
            borderRadius:   '9px',
            textDecoration: 'none',
            color:          '#DC2626',
            flexShrink:     0,
          }}
        >
          <Bell size={16} />
          <span style={{
            position:     'absolute',
            top:          '-3px',
            right:        '-3px',
            width:        '8px',
            height:       '8px',
            background:   '#DC2626',
            borderRadius: '50%',
            border:       '1.5px solid #fff',
          }} />
        </Link>
      )}

      {/* Avatar / profile (placeholder) */}
      <div style={{
        width:          '32px',
        height:         '32px',
        borderRadius:   '50%',
        background:     'linear-gradient(135deg, #2563EB, #7C3AED)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '13px',
        fontWeight:     700,
        color:          '#fff',
        cursor:         'pointer',
        flexShrink:     0,
      }}>
        B
      </div>

      <style>{`
        /* Mobile: show hamburger + logo, hide title */
        @media (max-width: 767px) {
          .topbar-hamburger { display: flex !important; }
          .topbar-mobile-logo { display: flex !important; }
          .topbar-title { display: none !important; }
        }

        /* Desktop: hide hamburger + logo, show title */
        @media (min-width: 768px) {
          .topbar-hamburger { display: none !important; }
          .topbar-mobile-logo { display: none !important; }
          .topbar-title { display: block !important; }
        }
      `}</style>
    </header>
  )
}