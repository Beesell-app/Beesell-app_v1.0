'use client'
// apps/web-app/components/dashboard/Sidebar.tsx
import Link               from 'next/link'
import { usePathname }    from 'next/navigation'
import { useState }       from 'react'
import {
  Sparkles, LayoutDashboard, FileText, Calendar, BarChart3,
  Settings, Users, Megaphone, Menu, X, Plus,
} from 'lucide-react'

interface NavItem {
  label:    string
  href:     string
  icon:     React.ReactNode
  badge?:   string  // "Segera" untuk fitur belum ada
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',    icon: <LayoutDashboard size={17} /> },
  { label: 'Konten Saya',  href: '/content',      icon: <FileText size={17} /> },
  { label: 'Jadwal',       href: '/scheduler',    icon: <Calendar size={17} />,    badge: 'Segera' },
  { label: 'Iklan',        href: '/ads',          icon: <Megaphone size={17} />,   badge: 'Segera' },
  { label: 'Affiliate',    href: '/affiliate',    icon: <Users size={17} />,       badge: 'Segera' },
  { label: 'Analytics',    href: '/analytics',    icon: <BarChart3 size={17} />,   badge: 'Segera' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: '14px', left: '14px', zIndex: 30,
          width: '36px', height: '36px',
          background: '#fff', border: '1px solid #E2E8F0',
          borderRadius: '8px', cursor: 'pointer',
          display: 'none', alignItems: 'center', justifyContent: 'center',
          color: '#334155',
        }}
        className="mobile-only"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)',
            zIndex: 20,
          }}
          className="mobile-only"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          background: '#fff',
          borderRight: '1px solid #E2E8F0',
          padding: '20px 14px',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 25,
          fontFamily: "'DM Sans', sans-serif",
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .25s ease',
        }}
        className="sidebar-desktop"
      >
        {/* Logo */}
        <Link href="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '4px 8px', marginBottom: '20px',
          textDecoration: 'none',
        }}>
          <div style={{
            width: '30px', height: '30px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={15} color="#fff" />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            BeeSell <span style={{ color: '#2563EB' }}>AI</span>
          </span>
        </Link>

        {/* CTA: New content */}
        <Link href="/content/new" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          borderRadius: '10px',
          color: '#fff', textDecoration: 'none',
          fontSize: '13px', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(37,99,235,.2)',
          marginBottom: '20px',
          justifyContent: 'center',
        }}>
          <Plus size={14} /> Buat Konten Baru
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            const disabled = !!item.badge

            return (
              <Link
                key={item.href}
                href={disabled ? '#' : item.href}
                onClick={e => disabled && e.preventDefault()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  textDecoration: 'none',
                  background: active ? '#EFF6FF' : 'transparent',
                  color: active ? '#2563EB' : (disabled ? '#94A3B8' : '#475569'),
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all .15s',
                  border: active ? '1px solid #DBEAFE' : '1px solid transparent',
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '10px', fontWeight: 500,
                    background: '#F1F5F9', color: '#64748B',
                    padding: '2px 6px', borderRadius: '4px',
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Settings + footer */}
        <Link href="/settings" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 12px',
          borderRadius: '9px',
          textDecoration: 'none',
          background: isActive('/settings') ? '#EFF6FF' : 'transparent',
          color: isActive('/settings') ? '#2563EB' : '#475569',
          fontSize: '13px',
          fontWeight: isActive('/settings') ? 600 : 500,
        }}>
          <Settings size={17} />
          <span>Pengaturan</span>
        </Link>

        <p style={{
          fontSize: '10px', color: '#94A3B8',
          padding: '8px 12px', marginTop: '8px',
          fontFamily: "'DM Mono', monospace",
        }}>
          v0.1.0 · MVP
        </p>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
          .sidebar-desktop { transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .sidebar-desktop { transform: translateX(0) !important; }
        }
      `}</style>
    </>
  )
}