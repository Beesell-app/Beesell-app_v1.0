'use client'
// components/admin/admin-topbar.tsx
// ══════════════════════════════════════════════════════════════
// Admin Top Bar — Dark theme
// ══════════════════════════════════════════════════════════════

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Crown, Bell, ChevronRight } from 'lucide-react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155',
  border:'#334155', text:'#F1F5F9',
  textDim:'#94A3B8', textMute:'#64748B',
  purple:'#A78BFA', red:'#F87171', green:'#34D399',
}

interface Props {
  userEmail: string
  role:      string
}

export function AdminTopbar({ userEmail, role }: Props) {
  const pathname = usePathname()
  const breadcrumb = parseBreadcrumb(pathname)

  return (
    <div style={{
      background: D.bg800, borderBottom:`1px solid ${D.border}`,
      padding:'12px 24px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:30,
      gap: 12, minHeight: 60,
    }}>
      {/* Breadcrumb */}
      <div style={{ 
        display:'flex', alignItems:'center', gap:6, fontSize:13,
        flex: 1, minWidth: 0, overflow: 'hidden',
      }}>
        {breadcrumb.map((crumb, i) => (
          <span key={i} style={{ 
            display:'flex', alignItems:'center', gap:6,
            whiteSpace:'nowrap',
          }}>
            {i > 0 && <ChevronRight size={12} color={D.textMute}/>}
            {crumb.href ? (
              <Link href={crumb.href} style={{
                color: D.textDim, textDecoration:'none',
                fontWeight: 500,
              }}>
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: D.text, fontWeight: 700 }}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Right: User info */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        {/* Status pill */}
        <div style={{
          padding:'6px 12px', borderRadius:99,
          background: `${D.green}15`, color: D.green,
          fontSize:11, fontWeight:700,
          display:'inline-flex', alignItems:'center', gap:6,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 99, background: D.green,
            animation: 'pulse 2s infinite',
          }}/>
          System Online
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50%      { opacity: 0.4; }
            }
          `}</style>
        </div>

        {/* Bell */}
        <button style={{
          width:36, height:36, borderRadius:99,
          background: D.bg700, border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Bell size={15} color={D.textDim}/>
        </button>

        {/* User pill */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'6px 12px 6px 6px', borderRadius:99,
          background: D.bg700,
        }}>
          <div style={{
            width:28, height:28, borderRadius:99,
            background: `linear-gradient(135deg, ${D.purple}, #F472B6)`,
            color:'#fff', fontWeight:800, fontSize:12,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Crown size={14}/>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize:11, color: D.text, fontWeight:700 }}>
              {truncateEmail(userEmail)}
            </div>
            <div style={{ fontSize:9, color: D.purple, fontWeight:800, letterSpacing:'0.04em' }}>
              {role.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function parseBreadcrumb(path: string): Array<{ label: string; href?: string }> {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return [{ label: 'Home' }]
  
  if (segments[0] === 'admin') {
    if (segments.length === 1) {
      return [{ label: 'Admin' }]
    }
    
    const labels: Record<string, string> = {
      'executive':      'Executive Summary',
      'revenue':        'Revenue Analytics',
      'cogs':           'COGS Monitoring',
      'credits':        'Credit Economy',
      'feature-flags':  'Feature Flags',
      'pricing':        'Pricing Editor',
      'cost-guardrail': 'Cost Guardrails',
      'kill-switch':    'Kill Switch',
      'users':          'User Management',
      'abuse':          'Abuse Detection',
      'health':         'System Health',
      'audit-log':      'Audit Log',
    }
    
    return [
      { label: 'Admin', href: '/admin' },
      { label: labels[segments[1]] ?? capitalize(segments[1]) },
    ]
  }
  
  return [{ label: capitalize(segments[0]) }]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
}

function truncateEmail(email: string, max = 24): string {
  if (email.length <= max) return email
  const [local, domain] = email.split('@')
  if (!domain) return email.substring(0, max - 2) + '..'
  return `${local.substring(0, 6)}…@${domain}`
}