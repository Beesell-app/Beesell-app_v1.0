'use client'
// components/dashboard/TopBar.tsx
// ══════════════════════════════════════════════════════════════
// User Dashboard Top Bar — Purple theme + Superuser Integration
// 
// CHANGES (Phase 3 Integration):
//   1. useUserRole() integrate
//   2. Credit widget show ∞ untuk superuser
//   3. SUPERUSER pill di samping avatar
//   4. Avatar special crown color untuk superuser
// ══════════════════════════════════════════════════════════════

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Bell, Plus, CreditCard, ChevronRight, Crown, Shield, 
  Infinity as InfinityIcon,
} from 'lucide-react'
import { useCredits } from '@/hooks/use-credits'
import { useDailyUsage } from '@/hooks/use-daily-usage'
import { useUserRole } from '@/hooks/use-user-role'
import { 
  getToolByPath,
  CATEGORY_INFO,
  type Category,
} from './studio-menu-config'

const C = {
  purple:'#7C3AED', purpleBg:'#F5F3FF',
  pink:'#EC4899', amber:'#F59E0B', green:'#10B981', red:'#EF4444',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC',
  white:'#FFFFFF',
}

export function DashboardTopbar() {
  const pathname = usePathname()
  const { balance, monthly_quota } = useCredits()
  const { tier } = useDailyUsage()
  const { isSuperuser, email } = useUserRole()

  const breadcrumb = parsePathToBreadcrumb(pathname)

  return (
    <div style={{
      background: C.white, borderBottom:`1px solid ${C.slate200}`,
      padding:'12px 24px 12px 64px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:30,
      gap: 12, minHeight: 60,
    }}>
      <style>{`
        @media (min-width: 768px) {
          .topbar-content { padding-left: 24px !important; }
        }
      `}</style>

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
            {i > 0 && <ChevronRight size={12} color={C.slate400}/>}
            {crumb.href ? (
              <Link href={crumb.href} style={{
                color: C.slate500, textDecoration:'none',
                fontWeight: i === breadcrumb.length - 1 ? 700 : 500,
              }}>
                {crumb.label}
              </Link>
            ) : (
              <span style={{
                color: C.slate900, fontWeight:700,
                overflow:'hidden', textOverflow:'ellipsis',
              }}>{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* Right: Credit + Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        {/* ⚡ Superuser badge (paling kiri) */}
        {isSuperuser && (
          <Link href="/admin" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'6px 12px', borderRadius:99,
            background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
            color:'#fff', fontSize:11, fontWeight:800,
            textDecoration:'none', letterSpacing:'0.04em',
          }}>
            <Crown size={12}/>
            SUPERUSER
          </Link>
        )}

        {/* Credit widget — superuser show ∞, regular Pro/Business show balance */}
        {isSuperuser ? (
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'7px 12px', borderRadius:99,
            background: C.purpleBg, color: C.purple,
            fontSize:12, fontWeight:700,
          }}>
            <CreditCard size={13}/>
            <InfinityIcon size={14} style={{ marginTop: -1 }}/>
            <span style={{ fontSize: 11, color: C.slate500, fontWeight: 500 }}>
              Unlimited
            </span>
          </div>
        ) : (tier === 'pro' || tier === 'business') && balance !== undefined ? (
          <Link href="/billing/credits" style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'7px 12px', borderRadius:99,
            background: C.purpleBg, color: C.purple,
            fontSize:12, fontWeight:700, textDecoration:'none',
          }}>
            <CreditCard size={13}/>
            <span>
              <strong>{balance}</strong>
              <span style={{ color: C.slate500, fontWeight:500, marginLeft:3 }}>
                /{monthly_quota}
              </span>
            </span>
            <Plus size={11}/>
          </Link>
        ) : null}

        {/* Notification */}
        <button style={{
          width:36, height:36, borderRadius:99,
          background: C.slate100, border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Bell size={16} color={C.slate600}/>
        </button>

        {/* User avatar — special crown color untuk superuser */}
        <div style={{
          width:36, height:36, borderRadius:99,
          background: isSuperuser 
            ? `linear-gradient(135deg, ${C.purple}, ${C.pink})`
            : `linear-gradient(135deg, ${C.slate700}, ${C.slate900})`,
          color:'#fff', fontWeight:800, fontSize:13,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', position: 'relative',
          border: isSuperuser ? `2px solid ${C.purple}` : 'none',
        }}>
          {isSuperuser ? (
            <Crown size={16}/>
          ) : (
            <span>{(email?.[0] ?? 'U').toUpperCase()}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// BREADCRUMB PARSER (no require() — proper ES import)
// ══════════════════════════════════════════════════════════════
function parsePathToBreadcrumb(path: string): Array<{ label: string; href?: string }> {
  const segments = path.split('/').filter(Boolean)
  const crumbs: Array<{ label: string; href?: string }> = []
  
  if (segments.length === 0) {
    return [{ label: 'Home' }]
  }

  if (segments[0] === 'studio') {
    if (segments.length === 1) {
      return [{ label: 'Studio' }]
    }

    crumbs.push({ label: 'Studio', href: '/studio' })
    
    if (segments.length >= 2) {
      const categorySlug = segments[1] as Category
      const catInfo = CATEGORY_INFO[categorySlug]
      const categoryName = catInfo?.label ?? capitalize(segments[1])
      
      if (segments.length === 2) {
        crumbs.push({ label: categoryName })
        return crumbs
      }
      
      crumbs.push({ 
        label: categoryName, 
        href: `/studio?category=${segments[1]}` 
      })
      
      const toolPath = '/' + segments.slice(0, 3).join('/')
      const tool = getToolByPath(toolPath)
      crumbs.push({ label: tool?.label ?? capitalize(segments[2]) })
    }
    
    return crumbs
  }

  const topLevelLabels: Record<string, string> = {
    'billing':   'Billing',
    'settings':  'Settings',
    'library':   'Asset Library',
    'help':      'Help Center',
    'dashboard': 'Dashboard',
  }
  
  const firstLabel = topLevelLabels[segments[0]] ?? capitalize(segments[0])
  
  if (segments.length === 1) {
    return [{ label: firstLabel }]
  }
  
  crumbs.push({ label: firstLabel, href: `/${segments[0]}` })
  crumbs.push({ label: capitalize(segments[1]) })
  
  return crumbs
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
}