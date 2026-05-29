'use client'
// apps/web-app/components/dashboard/BottomNav.tsx
// ── Mobile bottom navigation (<768px) ────────────────────────
// 5 items: Dashboard / Library / [+ Buat] / Template / Settings
// Touch-friendly 44px tap targets, safe area bottom (iOS home bar)
import Link       from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Plus, Layers, Settings,
} from 'lucide-react'

interface BottomItem {
  label: string
  href:  string
  icon:  React.ReactNode
  fab?:  boolean   // floating action button style (center + button)
}

const BOTTOM_ITEMS: BottomItem[] = [
  { label: 'Dashboard', href: '/dashboard',   icon: <LayoutDashboard size={20} /> },
  { label: 'Library',   href: '/library',     icon: <FileText size={20} /> },
  { label: 'Buat',      href: '/content/new', icon: <Plus size={22} />, fab: true },
  { label: 'Template',  href: '/editor',      icon: <Layers size={20} /> },
  { label: 'Settings',  href: '/settings',    icon: <Settings size={20} /> },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Safe area spacer so content doesn't hide behind bottom nav */}
      <div className="bottom-nav-spacer" />

      <nav
        className="bottom-nav"
        style={{
          position:   'fixed',
          bottom:     0,
          left:       0,
          right:      0,
          zIndex:     50,
          background: '#fff',
          borderTop:  '1px solid #E2E8F0',
          display:    'flex',
          alignItems: 'stretch',
          // Safe area for iOS home bar
          paddingBottom: 'env(safe-area-inset-bottom)',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow:  '0 -4px 20px rgba(15,23,42,.08)',
        }}
      >
        {BOTTOM_ITEMS.map(item => {
          const active = isActive(item.href)

          if (item.fab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  flex:           1,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  padding:        '6px 0',
                  textDecoration: 'none',
                  color:          '#fff',
                  position:       'relative',
                  // Push FAB up with negative margin trick
                }}
              >
                {/* FAB button */}
                <div style={{
                  width:          '48px',
                  height:         '48px',
                  background:     active
                    ? 'linear-gradient(135deg, #1D4ED8, #5B21B6)'
                    : 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  borderRadius:   '16px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  boxShadow:      '0 4px 14px rgba(37,99,235,.4)',
                  // Push slightly up
                  marginBottom:   '2px',
                  transform:      'translateY(-4px)',
                  transition:     'all .15s',
                }}>
                  <Plus size={22} color="#fff" />
                </div>
                <span style={{
                  fontSize:   '10px',
                  fontWeight: 600,
                  color:      active ? '#2563EB' : '#94A3B8',
                  marginTop:  '-6px',
                }}>
                  Buat
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '3px',
                padding:        '8px 4px',
                minHeight:      '56px',   // 44px touch target + label
                textDecoration: 'none',
                color:          active ? '#2563EB' : '#94A3B8',
                position:       'relative',
                transition:     'color .12s',
                // Explicitly sized touch target
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <span style={{
                  position:     'absolute',
                  top:          '5px',
                  left:         '50%',
                  transform:    'translateX(-50%)',
                  width:        '4px',
                  height:       '4px',
                  borderRadius: '50%',
                  background:   '#2563EB',
                }} />
              )}

              <span style={{
                opacity:    active ? 1 : 0.65,
                lineHeight: 1,
              }}>
                {item.icon}
              </span>

              <span style={{
                fontSize:   '10px',
                fontWeight: active ? 700 : 500,
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <style>{`
        /* Show bottom nav only on mobile */
        .bottom-nav {
          display: flex;
        }
        /* Spacer: same height as bottom nav + safe area */
        .bottom-nav-spacer {
          height: calc(56px + env(safe-area-inset-bottom));
        }
        @media (min-width: 768px) {
          .bottom-nav {
            display: none !important;
          }
          .bottom-nav-spacer {
            display: none;
          }
        }
      `}</style>
    </>
  )
}