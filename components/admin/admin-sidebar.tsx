'use client'
// components/admin/admin-sidebar.tsx
// ══════════════════════════════════════════════════════════════
// Admin Sidebar — Dark theme, owner control center
// UPDATE Phase 3: Executive Summary + Revenue Analytics jadi LIVE
// ══════════════════════════════════════════════════════════════

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Settings, Users, ToggleLeft, Banknote,
  TrendingUp, AlertTriangle, Skull, FileText, Shield,
  Activity, DollarSign, Crown, Home, Package,
} from 'lucide-react'

const D = {
  bg900:    '#0F172A',
  bg800:    '#1E293B',
  bg700:    '#334155',
  border:   '#334155',
  text:     '#F1F5F9',
  textDim:  '#94A3B8',
  textMute: '#64748B',
  purple:   '#A78BFA',
  pink:     '#F472B6',
  amber:    '#FBBF24',
  green:    '#34D399',
  red:      '#F87171',
  blue:     '#60A5FA',
}

interface NavItem {
  href:    string
  label:   string
  icon:    any
  badge?:  'PHASE 2' | 'PHASE 3' | 'PHASE 4' | 'PHASE 5' | 'PHASE 6' | 'LIVE'
  phase:   number
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/admin',           label: 'Home',              icon: LayoutDashboard, phase: 1, badge: 'LIVE' },
      // ▼ Phase 3 LIVE
      { href: '/admin/executive', label: 'Executive Summary', icon: Crown,           phase: 3, badge: 'LIVE' },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      // ▼ Phase 3 LIVE
      { href: '/admin/revenue',   label: 'Revenue Analytics',  icon: DollarSign,     phase: 3, badge: 'LIVE' },
      { href: '/admin/cogs',      label: 'COGS Monitoring',    icon: TrendingUp,     phase: 4, badge: 'LIVE' },
      { href: '/admin/credits',   label: 'Credit Economy',     icon: Banknote,       phase: 4, badge: 'LIVE' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      // ▼ Phase 2 LIVE
      { href: '/admin/feature-flags',  label: 'Feature Flags',    icon: ToggleLeft, phase: 2, badge: 'LIVE' },
      { href: '/admin/pricing',        label: 'Pricing Editor',   icon: Settings,   phase: 2, badge: 'LIVE' },
      { href: '/admin/addons',         label: 'Add-on Editor',    icon: Package,    phase: 2, badge: 'LIVE' },
      { href: '/admin/cost-guardrail', label: 'Cost Guardrails',  icon: Shield,     phase: 6, badge: 'LIVE' },
      { href: '/admin/kill-switch',    label: 'Kill Switch',      icon: Skull,      phase: 6, badge: 'LIVE' },
    ],
  },
  {
    title: 'USERS',
    items: [
      // ▼ Phase 2 LIVE
      { href: '/admin/users',  label: 'User Management',  icon: Users,         phase: 2, badge: 'LIVE' },
      { href: '/admin/abuse',  label: 'Abuse Detection',  icon: AlertTriangle, phase: 5, badge: 'LIVE' },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { href: '/admin/health',    label: 'System Health', icon: Activity, phase: 5, badge: 'LIVE' },
      { href: '/admin/audit-log', label: 'Audit Log',     icon: FileText, phase: 6, badge: 'LIVE' },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width:260, height:'100vh',
      position:'sticky', top:0, flexShrink:0,
      background: D.bg800,
      borderRight:`1px solid ${D.border}`,
      display:'flex', flexDirection:'column',
      overflowY:'auto',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ padding:'18px 18px', borderBottom:`1px solid ${D.border}` }}>
        <Link href="/admin" style={{
          display:'flex', alignItems:'center', gap:10, textDecoration:'none',
        }}>
          <div style={{
            width:34, height:34, borderRadius:8,
            background: `linear-gradient(135deg, ${D.purple}, ${D.pink})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff',
          }}>
            <Crown size={18}/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color: D.text, lineHeight:1.2 }}>
              Admin Control
            </div>
            <div style={{ fontSize:10, color: D.textDim, marginTop:2, fontWeight:600 }}>
              SUPER ADMIN ONLY
            </div>
          </div>
        </Link>
      </div>

      {/* Back to app */}
      <Link href="/studio" style={{
        margin:'10px 12px', padding:'8px 12px', borderRadius:8,
        background: D.bg700, color: D.textDim,
        fontSize:11, fontWeight:700, textDecoration:'none',
        display:'flex', alignItems:'center', gap:8,
        letterSpacing: '0.04em',
      }}>
        <Home size={12}/>
        Kembali ke Aplikasi
      </Link>

      {/* Nav groups */}
      <nav style={{ flex:1, padding:'4px 8px 16px' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginTop: gi === 0 ? 8 : 18 }}>
            <div style={{
              padding:'4px 10px', marginBottom:4,
              fontSize:10, fontWeight:800, color: D.textMute,
              letterSpacing:'0.08em',
            }}>
              {group.title}
            </div>
            
            {group.items.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isComingSoon = item.badge && item.badge !== 'LIVE'
              
              return (
                <Link 
                  key={item.href} 
                  href={isComingSoon ? '#' : item.href}
                  onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 12px', borderRadius:8,
                    fontSize:13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? D.purple : isComingSoon ? D.textMute : D.text,
                    background: isActive ? `${D.purple}15` : 'transparent',
                    textDecoration:'none', marginBottom:2,
                    cursor: isComingSoon ? 'not-allowed' : 'pointer',
                    opacity: isComingSoon ? 0.6 : 1,
                    border: isActive ? `1px solid ${D.purple}30` : '1px solid transparent',
                  }}>
                  <Icon size={15}/>
                  <span style={{ flex:1 }}>{item.label}</span>
                  
                  {item.badge === 'LIVE' && (
                    <span style={{
                      fontSize:8, fontWeight:800, color: D.green,
                      background: `${D.green}15`,
                      padding:'2px 6px', borderRadius:99,
                      letterSpacing:'0.04em',
                    }}>
                      LIVE
                    </span>
                  )}
                  
                  {item.badge && item.badge !== 'LIVE' && (
                    <span style={{
                      fontSize:8, fontWeight:800, color: D.amber,
                      background: `${D.amber}15`,
                      padding:'2px 6px', borderRadius:99,
                      letterSpacing:'0.04em',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding:'12px 18px', borderTop:`1px solid ${D.border}`,
        background: D.bg900,
      }}>
        <div style={{
          padding:'10px 12px', borderRadius:8,
          background: `${D.purple}10`,
          border: `1px solid ${D.purple}30`,
        }}>
          <div style={{ fontSize:10, color: D.purple, fontWeight:800, marginBottom:4, letterSpacing:'0.06em' }}>
            🔓 SUPERUSER MODE
          </div>
          <div style={{ fontSize:11, color: D.textDim, lineHeight:1.5 }}>
            Bypass semua limit, kredit, dan paywall untuk testing
          </div>
        </div>
      </div>
    </aside>
  )
}