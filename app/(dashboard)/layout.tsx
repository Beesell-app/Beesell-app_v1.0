'use client'
// app/(dashboard)/layout.tsx
// ══════════════════════════════════════════════════════════════
// BEESELL AI — Dashboard Layout v5 (Superuser Integration)
// 
// ⚡ AMBER THEME tetap (#F59E0B)
// ⚡ Sidebar 6 section: Core · Studio · Ads & Growth · Analytics · Locked · Kelola
// ⚡ CMD palette ⌘K (14 actions) · Mobile bottom nav · Quota mini-panel
// ⚡ SUPERUSER INTEGRATION (NEW):
//    - Admin Control banner di sidebar atas (kalau superuser)
//    - SUPERUSER pill di topbar
//    - Unlock SEMUA NAV_LOCKED items
//    - Quota mini: tampil "UNLIMITED ∞" untuk superuser
//    - Hide upgrade CTA
//    - Dual-check: useUserRole() hook (hardcoded + DB)
// ══════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SessionProvider, LogoutButton } from '@/components/auth/LogoutButton'
import { useUserRole } from '@/hooks/use-user-role'
import {
  LayoutDashboard, Zap, Palette, Megaphone, Bot,
  ShoppingBag, Users2, TrendingUp, BarChart3,
  Brush, Archive, UsersRound, CreditCard, Settings,
  ChevronLeft, ChevronRight, Menu, X, Plus, Sparkles,
  Lock, Command, ArrowRight, Target, DollarSign,
  CalendarDays, Brain, Star, Wand2, Video,
  Crown, Shield, Infinity as InfinityIcon,
} from 'lucide-react'

// ── Tokens (Amber theme tetap) ────────────────────────────────
const C = {
  amber:   '#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:   '#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:  '#E5E7EB',
  ink:     '#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:   '#059669', greenLt:'#ECFDF5',
  blue:    '#3B82F6', blueLt:'#EFF6FF',
  purple:  '#7C3AED', purpleLt:'#F5F3FF',
  red:     '#EF4444',
  orange:  '#F97316',
  sky:     '#0284C7',
  // Sidebar
  sideActive:   '#FFFBEB',
  sideText:     '#374151',
  sideBg:       '#FFFFFF',
  sideBorder:   '#E5E7EB',
  // Dark untuk admin banner
  slate900:'#0F172A', slate800:'#1E293B',
  sh: '0 1px 3px rgba(0,0,0,.06)',
  sm: '0 4px 16px rgba(0,0,0,.07)',
  sa: '0 6px 20px rgba(245,158,11,.22)',
}

// ── Nav sections (tetap, route mix /dashboard /campaign /audience /etc) ──
const NAV_CORE = [
  { href:'/dashboard',   label:'Home Dashboard', emoji:'🏠', phase:1 },
  { href:'/quick-tools', label:'Quick Tools',    emoji:'⚡', phase:1 },
]

const NAV_STUDIO = [
  { href:'/studio',                  label:'AI Studio',          emoji:'🎨', phase:1 },
  { href:'/content/image',           label:'AI Image Generator', emoji:'🖼️', phase:1, sub:true }, // ⚡ tambah
  { href:'/studio/image/packshot',   label:'AI Packshot',        emoji:'📦', phase:1, sub:true },
  { href:'/studio/image/enhancer',   label:'Product Enhancer',   emoji:'✨', phase:1, sub:true },
  { href:'/studio/video/ugc',        label:'UGC Video',          emoji:'🎬', phase:1, sub:true },
  { href:'/studio/video/tiktok',     label:'TikTok Reels AI',    emoji:'🎵', phase:1, sub:true },
  { href:'/studio/video/generator',  label:'AI Video Gen',       emoji:'🎥', phase:1, sub:true },
]

const NAV_ADS = [
  { href:'/campaign',          label:'Campaign Builder',   emoji:'📢', phase:1, color:'#2563EB', badge:'New' },
  { href:'/audience',          label:'Audience Intel',     emoji:'🎯', phase:1, color:C.purple,  badge:'New' },
  { href:'/budget-optimizer',  label:'Budget Optimizer',   emoji:'💰', phase:1, color:C.green,   badge:'New' },
  { href:'/scheduler',         label:'Scheduler',          emoji:'📅', phase:1, color:C.sky,     badge:'New' },
]

const NAV_ANALYTICS = [
  { href:'/analytics',  label:'Analytics AI',   emoji:'📊', phase:1, color:C.amber, badge:'New' },
]

// ⚡ NAV_LOCKED — Superuser akan auto-unlock semua ini via shouldShowAsLocked()
const NAV_LOCKED = [
  { href:'/automation',  label:'AI Automation',   emoji:'🤖', phase:2, color:C.purple },
  { href:'/marketplace', label:'Marketplace',     emoji:'🛒', phase:2, color:C.sky    },
  { href:'/affiliate',   label:'Affiliate Center',emoji:'🔗', phase:2, color:C.green  },
  { href:'/trend',       label:'Trend Research',  emoji:'📈', phase:3, color:C.orange },
  { href:'/brand',       label:'Brand Center',    emoji:'✨', phase:4, color:'#DB2777' },
  { href:'/team',        label:'Team Workspace',  emoji:'👥', phase:3, color:C.green  },
]

const NAV_KELOLA = [
  { href:'/library',  label:'Asset Library', emoji:'📁', phase:1 },
  { href:'/billing',  label:'Billing',       emoji:'💳', phase:1 },
  { href:'/settings', label:'Settings',      emoji:'⚙️', phase:1 },
  { href:'https://help.beesell.id', label:'Help Center', emoji:'❓', phase:1, external:true },
]

const PHASE_BADGE: Record<number,string> = { 2:'P2', 3:'P3', 4:'P4' }

// ── Route titles ──────────────────────────────────────────────
const ROUTE_TITLE: Record<string,string> = {
  '/dashboard':                 '🏠 Home Dashboard',
  '/quick-tools':               '⚡ Quick Tools',
  '/content/image':             '🖼️ AI Image Generator',
  '/studio':                    '🎨 AI Studio',
  '/studio/image':              '📸 Generate Gambar',
  '/studio/image/packshot':     '📦 AI Packshot',
  '/studio/image/enhancer':     '✨ Product Enhancer AI',
  '/studio/image/tryon':        '👗 AI Try-On',
  '/studio/image/product-to-model':'🧑 Product to Model',
  '/studio/video':              '🎬 Generate Video',
  '/studio/video/ugc':          '🎭 UGC Video Generator',
  '/studio/video/tiktok':       '🎵 TikTok Reels AI',
  '/studio/video/generator':    '🎬 AI Video Generator',
  '/studio/subtitle':           '📝 AI Subtitle',
  '/campaign':                  '📢 Campaign Builder AI',
  '/audience':                  '🎯 Audience Targeting Intelligence',
  '/budget-optimizer':          '💰 Budget Optimizer & Auto-Bidding',
  '/analytics':                 '📊 Analytics AI — BeeScore™',
  '/scheduler':                 '📅 Multi-Platform Scheduler',
  '/library':                   '📁 Asset Library',
  '/billing':                   '💳 Billing & Credits',
  '/settings':                  '⚙️ Settings',
  '/help':                      '❓ Help Center',
  '/automation':                '🤖 AI Automation',
  '/marketplace':               '🛒 Marketplace',
  '/affiliate':                 '🔗 Affiliate Center',
  '/admin':                     '👑 Super Admin Panel',
}

// ── CMD actions (14 items + Admin Panel kalau superuser) ──────
const CMD_ACTIONS = [
  { label:'Generate Caption AI',     href:'/quick-tools?tool=caption',  icon:'✍️', group:'AI Studio' },
  { label:'AI Image Generator', href:'/content/image', icon:'🖼️', group:'AI Studio' },
  { label:'AI Packshot',             href:'/studio/image/packshot',      icon:'📦', group:'AI Studio' },
  { label:'Product Enhancer AI',     href:'/studio/image/enhancer',      icon:'✨', group:'AI Studio' },
  { label:'UGC Video Generator',     href:'/studio/video/ugc',           icon:'🎭', group:'AI Studio' },
  { label:'TikTok Reels AI',         href:'/studio/video/tiktok',        icon:'🎵', group:'AI Studio' },
  { label:'AI Video Generator',      href:'/studio/video/generator',     icon:'🎥', group:'AI Studio' },
  { label:'Campaign Builder AI',     href:'/campaign',                   icon:'📢', group:'Ads & Growth' },
  { label:'Audience Intelligence',   href:'/audience',                   icon:'🎯', group:'Ads & Growth' },
  { label:'Budget Optimizer',        href:'/budget-optimizer',           icon:'💰', group:'Ads & Growth' },
  { label:'Analytics AI',            href:'/analytics',                  icon:'📊', group:'Analytics' },
  { label:'Multi-Platform Scheduler',href:'/scheduler',                  icon:'📅', group:'Scheduler' },
  { label:'Asset Library',           href:'/library',                    icon:'📂', group:'Kelola' },
  { label:'Billing & Credits',       href:'/billing',                    icon:'💳', group:'Kelola' },
  { label:'Settings',                href:'/settings',                   icon:'⚙️', group:'Kelola' },
  { label:'Help Center',             href:'https://help.beesell.id',     icon:'❓', group:'Kelola', external:true },
]

// Extra CMD untuk superuser
const SUPERUSER_CMD_ACTIONS = [
  { label:'Owner Control Center',    href:'/admin',                      icon:'👑', group:'Admin' },
  { label:'Executive Summary',       href:'/admin/executive',            icon:'📈', group:'Admin' },
  { label:'Revenue Analytics',       href:'/admin/revenue',              icon:'💎', group:'Admin' },
  { label:'Feature Flags',           href:'/admin/feature-flags',        icon:'🚦', group:'Admin' },
  { label:'User Management',         href:'/admin/users',                icon:'👤', group:'Admin' },
  { label:'Pricing Editor',          href:'/admin/pricing',              icon:'💰', group:'Admin' },
]

// ══════════════════════════════════════════════════════════════
function InnerLayout({ children }: { children:React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)
  const [isTablet,    setIsTablet]    = useState(false)
  const [cmdOpen,     setCmdOpen]     = useState(false)
  const [cmdValue,    setCmdValue]    = useState('')
  const [lockedTip,   setLockedTip]   = useState<string|null>(null)
  const [studioOpen,  setStudioOpen]  = useState(true)
  const [quotaInfo, setQuotaInfo] = useState({ imgUsed:0, imgLimit:0, vidUsed:0, vidLimit:0, plan:'' })
  const cmdRef = useRef<HTMLInputElement>(null)

  // ⚡ SUPERUSER DETECTION (dual-check via hook)
  const { isSuperuser, isAdmin, email, role } = useUserRole()

  // Active CMD actions (include admin kalau superuser)
  const activeCmdActions = isSuperuser 
    ? [...SUPERUSER_CMD_ACTIONS, ...CMD_ACTIONS]
    : CMD_ACTIONS

  // Auth guard
  useEffect(() => {
    createClient().auth.getUser().then(({ data:{ user } }) => {
      if (!user) router.replace('/login')
    })
  }, [router])

  // Responsive
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      setIsMobile(w < 640)
      setIsTablet(w >= 640 && w < 1024)
      if (w >= 640 && w < 1024) setCollapsed(true)
      if (w >= 1024) setCollapsed(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
  let alive = true
  fetch('/api/me/usage')
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (alive && d) setQuotaInfo({
        imgUsed:  d.image_credits_used ?? 0,
        imgLimit: d.image_credits_max  ?? 0,
        vidUsed:  d.quota_video_used   ?? 0,
        vidLimit: d.quota_video_max    ?? 0,
        plan:     d.plan ?? '',
      })
    })
    .catch(() => {})
  return () => { alive = false }
}, [])
  // ⌘K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setCmdOpen(o => !o)
        setTimeout(() => cmdRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') { setCmdOpen(false); setCmdValue('') }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])

  const sidebarW = isMobile ? 0 : collapsed ? 56 : 256

  const title = (() => {
    if (ROUTE_TITLE[pathname]) return ROUTE_TITLE[pathname]
    const match = Object.keys(ROUTE_TITLE)
      .filter(k => pathname.startsWith(k) && k !== '/')
      .sort((a,b) => b.length - a.length)[0]
    return ROUTE_TITLE[match ?? ''] ?? 'BeeSell AI'
  })()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const filteredCmds = activeCmdActions.filter(a =>
    !cmdValue || a.label.toLowerCase().includes(cmdValue.toLowerCase())
  )

  const cOnly = collapsed && !isMobile

  // ⚡ Helper: tentukan apakah item locked di-display sebagai locked
  // Superuser: ALL UNLOCKED, regular user: tampil locked
  const shouldShowAsLocked = (_item: typeof NAV_LOCKED[0]) => !isSuperuser && !isAdmin

  // ── NavItem ───────────────────────────────────────────────
  const NavItem = ({ item, badge, color, sub }: {
    item: { href:string; label:string; emoji:string; phase:number; external?:boolean }
    badge?: string; color?: string; sub?: boolean
  }) => {
    const active = isActive(item.href)
    const aColor = color ?? C.amber
    const inner = (
      <div title={cOnly ? item.label : undefined}
        style={{
          display:'flex', alignItems:'center',
          gap:            cOnly ? 0 : '8px',
          justifyContent: cOnly ? 'center' : 'flex-start',
          padding:        cOnly ? '9px 0' : sub ? '5px 10px 5px 26px' : '7px 10px',
          borderRadius:   '9px', margin:'1px 0',
          background:     active ? C.amberXlt : 'transparent',
          color:          active ? C.amberDk : C.sideText,
          fontWeight:     active ? 700 : 500,
          fontSize:       sub ? '12px' : '13px',
          transition:     'all .12s',
          cursor:         'pointer',
          borderLeft:     active && !cOnly ? `2.5px solid ${C.amber}` : '2.5px solid transparent',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.bg }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
        <span style={{ color:active?C.amber:sub?C.inkDim:C.inkMuted, flexShrink:0, fontSize:sub?'13px':'15px' }}>
          {item.emoji}
        </span>
        {!cOnly && (
          <>
            <span style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:active?C.amberDk:sub?C.inkMuted:C.sideText }}>
              {item.label}
            </span>
            {badge && (
              <span style={{ fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'4px', background:`${aColor}20`, color:aColor, flexShrink:0, letterSpacing:'0.03em' }}>
                {badge}
              </span>
            )}
          </>
        )}
      </div>
    )

    // Link eksternal (mis. Help Center) → buka tab baru
    if (item.external) {
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}
          onClick={() => isMobile && setMobileOpen(false)}>
          {inner}
        </a>
      )
    }

    return (
      <Link href={item.href} style={{ textDecoration:'none' }}
        onClick={() => isMobile && setMobileOpen(false)}>
        {inner}
      </Link>
    )
  }

  // ── Locked item — Superuser: render sebagai NavItem normal ──
  const LockedItem = ({ item }: { item: typeof NAV_LOCKED[0] }) => {
    // ⚡ SUPERUSER BYPASS: render sebagai NavItem normal dengan badge UNLOCKED
    if (!shouldShowAsLocked(item)) {
      return (
        <Link href={item.href} style={{ textDecoration:'none' }}
          onClick={() => isMobile && setMobileOpen(false)}>
          <div title={cOnly ? `${item.label} (Superuser unlocked)` : undefined}
            style={{
              display:'flex', alignItems:'center',
              gap: cOnly ? 0 : '8px',
              justifyContent: cOnly ? 'center' : 'flex-start',
              padding: cOnly ? '9px 0' : '7px 10px',
              borderRadius:'9px', margin:'1px 0',
              background: isActive(item.href) ? C.amberXlt : 'transparent',
              color: isActive(item.href) ? C.amberDk : C.sideText,
              fontWeight: isActive(item.href) ? 700 : 500,
              fontSize:'13px',
              transition:'all .12s',
              cursor:'pointer',
              borderLeft: isActive(item.href) && !cOnly ? `2.5px solid ${C.amber}` : '2.5px solid transparent',
            }}
            onMouseEnter={e => { if (!isActive(item.href)) (e.currentTarget as HTMLElement).style.background = C.bg }}
            onMouseLeave={e => { if (!isActive(item.href)) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <span style={{ color: isActive(item.href) ? C.amber : C.inkMuted, flexShrink:0, fontSize:'15px' }}>
              {item.emoji}
            </span>
            {!cOnly && (
              <>
                <span style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {item.label}
                </span>
                <span style={{ 
                  fontSize:'7px', fontWeight:800, padding:'1px 4px', borderRadius:'3px', 
                  background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, 
                  color:'#fff', flexShrink:0, letterSpacing:'0.05em',
                }}>
                  ∞
                </span>
              </>
            )}
          </div>
        </Link>
      )
    }

    // Regular user: tampil locked
    return (
      <div title={cOnly ? `${item.label} (Phase ${item.phase})` : undefined}
        onClick={() => !cOnly && setLockedTip(lockedTip===item.href?null:item.href)}
        style={{ display:'flex', alignItems:'center', gap:cOnly?0:'8px', justifyContent:cOnly?'center':'flex-start', padding:cOnly?'9px 0':'6px 10px', borderRadius:'9px', margin:'1px 0', color:C.inkDim, fontSize:'13px', fontWeight:500, cursor:'pointer', transition:'all .12s', opacity:0.5, position:'relative', borderLeft:'2.5px solid transparent' }}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=C.bg;(e.currentTarget as HTMLElement).style.opacity='0.75'}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.opacity='0.5';setLockedTip(null)}}>
        <span style={{ color:C.inkDim, flexShrink:0, fontSize:'15px' }}>{item.emoji}</span>
        {!cOnly && (
          <>
            <span style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>
            <div style={{ display:'flex', gap:'3px', alignItems:'center', flexShrink:0 }}>
              <Lock size={9} color={C.inkDim}/>
              <span style={{ fontSize:'8px', fontWeight:700, padding:'1px 4px', borderRadius:'3px', background:C.bg, color:C.inkDim }}>{PHASE_BADGE[item.phase]}</span>
            </div>
          </>
        )}
        {lockedTip===item.href && !cOnly && (
          <div style={{ position:'absolute', left:'calc(100% + 8px)', top:'50%', transform:'translateY(-50%)', background:C.ink, color:'#fff', fontSize:'11px', fontWeight:600, padding:'6px 10px', borderRadius:'8px', whiteSpace:'nowrap', zIndex:100, boxShadow:'0 4px 12px rgba(0,0,0,.3)' }}>
            🔒 Segera hadir Phase {item.phase}
            <div style={{ position:'absolute', left:'-4px', top:'50%', transform:'translateY(-50%)', width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', borderRight:`4px solid ${C.ink}` }}/>
          </div>
        )}
      </div>
    )
  }

  // ── Sidebar content ───────────────────────────────────────
  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'0 8px', overflowX:'hidden' }}>

      {/* Logo */}
      <div style={{ padding:cOnly?'14px 0':'14px 6px', display:'flex', alignItems:'center', gap:'8px', justifyContent:cOnly?'center':'flex-start', borderBottom:`1px solid ${C.border}`, marginBottom:'4px', flexShrink:0 }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0, boxShadow:`0 2px 8px ${C.amber}40` }}>🐝</div>
        {!cOnly && (
          <div>
            <div style={{ fontWeight:800, fontSize:'15px', color:C.ink, lineHeight:1, letterSpacing:'-0.02em' }}>BeeSell AI</div>
            <div style={{ fontSize:'9px', color:C.inkMuted, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', marginTop:'1px' }}>AI Sales Platform</div>
          </div>
        )}
      </div>

      {/* ⚡ ADMIN CONTROL BANNER — Superuser only */}
      {isSuperuser && !cOnly && (
        <Link href="/admin" style={{ textDecoration:'none', display:'block', flexShrink:0 }}
          onClick={() => isMobile && setMobileOpen(false)}>
          <div style={{
            margin:'8px 0 5px',
            padding:'9px 11px', borderRadius:'10px',
            background: `linear-gradient(135deg, ${C.slate900}, ${C.slate800})`,
            color:'#fff',
            display:'flex', alignItems:'center', gap:'9px',
            cursor:'pointer', transition:'transform .15s',
            boxShadow:'0 2px 10px rgba(15,23,42,.2)',
          }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform=''}>
            <div style={{
              width:'26px', height:'26px', borderRadius:'7px',
              background:`linear-gradient(135deg,${C.amber},${C.amberDk})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>
              <Crown size={13} color="#fff"/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'9px', fontWeight:800, opacity:0.65, letterSpacing:'0.06em' }}>
                SUPER ADMIN
              </div>
              <div style={{ fontSize:'12px', fontWeight:700, display:'flex', alignItems:'center', gap:'3px' }}>
                Admin Control <ArrowRight size={11}/>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Superuser collapsed: just crown icon */}
      {isSuperuser && cOnly && (
        <Link href="/admin" style={{ textDecoration:'none' }}>
          <div style={{
            margin:'7px 0 4px', padding:'9px 0', borderRadius:'9px',
            background:`linear-gradient(135deg,${C.slate900},${C.slate800})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer',
          }} title="Admin Control">
            <Crown size={14} color={C.amber}/>
          </div>
        </Link>
      )}

      {/* AI Command Bar */}
      {!cOnly ? (
        <button type="button" onClick={() => { setCmdOpen(true); setTimeout(() => cmdRef.current?.focus(), 50) }}
          style={{ margin:'7px 0 5px', padding:'8px 12px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:C.inkMuted, fontFamily:"'DM Sans',sans-serif", transition:'all .15s', flexShrink:0 }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.amber;(e.currentTarget as HTMLElement).style.background=C.amberXlt}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.bg}}>
          <Sparkles size={12} color={C.amber}/>
          <span style={{ flex:1 }}>Buat konten baru...</span>
          <span style={{ fontSize:'9px', background:C.border, padding:'1px 5px', borderRadius:'3px', fontWeight:700, color:C.inkMuted, flexShrink:0 }}>⌘K</span>
        </button>
      ) : (
        <button type="button" onClick={() => setCmdOpen(true)}
          style={{ margin:'7px 0 4px', padding:'9px 0', borderRadius:'9px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:'100%', transition:'all .12s', flexShrink:0 }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=C.amberXlt}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=C.bg}>
          <Command size={14} color={C.amber}/>
        </button>
      )}

      {/* Scrollable nav */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', paddingBottom:'8px' }}>

        {/* Core */}
        {!cOnly && <SectionLabel text="📌 Core" color={C.inkMuted}/>}
        {NAV_CORE.map(item => <NavItem key={item.href} item={item}/>)}

        <Divider/>

        {/* AI Studio */}
        {!cOnly && (
          <button type="button" onClick={() => setStudioOpen(p=>!p)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:'2px' }}>
            <span style={{ fontSize:'9px', fontWeight:800, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.1em', flex:1, textAlign:'left' }}>🎨 AI Studio</span>
            <ChevronDown size={11} color={C.inkMuted} style={{ transition:'transform .2s', transform:studioOpen?'rotate(0)':'rotate(-90deg)' }}/>
          </button>
        )}
        {(studioOpen || cOnly) && NAV_STUDIO.map(item =>
          <NavItem key={item.href} item={item} sub={(item as any).sub}/>
        )}

        <Divider/>

        {/* Ads & Growth */}
        {!cOnly && <SectionLabel text="📢 Ads & Growth" color='#2563EB'/>}
        {NAV_ADS.map(item => <NavItem key={item.href} item={item} badge={(item as any).badge} color={(item as any).color}/>)}

        <Divider/>

        {/* Analytics */}
        {!cOnly && <SectionLabel text="📊 Analytics" color={C.amber}/>}
        {NAV_ANALYTICS.map(item => <NavItem key={item.href} item={item} badge={(item as any).badge} color={(item as any).color}/>)}

        <Divider/>

        {/* Locked → Superuser unlock */}
        {!cOnly && (
          <SectionLabel 
            text={isSuperuser ? "⚡ Unlocked (Superuser)" : "🔒 Segera Hadir"} 
            color={isSuperuser ? C.amber : C.inkDim}
          />
        )}
        {NAV_LOCKED.map(item => <LockedItem key={item.href} item={item}/>)}

        <Divider/>

        {/* Kelola */}
        {!cOnly && <SectionLabel text="⚙️ Kelola" color={C.inkMuted}/>}
        {NAV_KELOLA.map(item => <NavItem key={item.href} item={item}/>)}
      </div>

      {/* ⚡ Quota mini — Superuser: UNLIMITED display */}
      {!cOnly && isSuperuser && (
        <div style={{ 
          margin:'5px 0 3px', padding:'10px 12px',
          background:`linear-gradient(135deg,${C.slate900}08,${C.amber}10)`,
          borderRadius:'10px', border:`1px solid ${C.amber}30`,
          flexShrink:0,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'7px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:C.ink, display:'flex', alignItems:'center', gap:'4px' }}>
              <Crown size={11} color={C.amber}/> SUPERUSER
            </div>
            <span style={{ 
              fontSize:'8px', fontWeight:800, padding:'1px 6px', borderRadius:'99px',
              background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff',
              letterSpacing:'0.04em',
            }}>
              ACTIVE
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'5px' }}>
            <span style={{ fontSize:'9px', color:C.inkMuted }}>🖼️ Gambar AI</span>
            <span style={{ flex:1 }}/>
            <span style={{ fontSize:'10px', fontWeight:800, color:C.amberDk, display:'flex', alignItems:'center', gap:'2px' }}>
              <InfinityIcon size={10}/> Unlimited
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ fontSize:'9px', color:C.inkMuted }}>🎬 Video AI</span>
            <span style={{ flex:1 }}/>
            <span style={{ fontSize:'10px', fontWeight:800, color:C.purple, display:'flex', alignItems:'center', gap:'2px' }}>
              <InfinityIcon size={10}/> Unlimited
            </span>
          </div>
        </div>
      )}

      {/* Quota mini — Regular user */}
      {!cOnly && !isSuperuser && (
        <div style={{ margin:'5px 0 3px', padding:'10px 12px', background:C.amberXlt, borderRadius:'10px', border:`1px solid ${C.amber}25`, flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'7px' }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:C.ink }}>
              🐝 Plan {quotaInfo.plan.charAt(0).toUpperCase()+quotaInfo.plan.slice(1)}
            </div>
            <Link href="/billing" style={{ fontSize:'9px', color:C.amber, fontWeight:700, textDecoration:'none' }}>Upgrade →</Link>
          </div>
          <div style={{ marginBottom:'6px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:C.inkMuted, marginBottom:'3px' }}>
              <span>🖼️ Gambar AI</span>
              <span style={{ fontWeight:700, color:C.ink }}>{quotaInfo.imgUsed}/{quotaInfo.imgLimit}</span>
            </div>
            <div style={{ height:'4px', background:`${C.amber}20`, borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100,(quotaInfo.imgUsed/quotaInfo.imgLimit)*100)}%`, background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, borderRadius:'2px', transition:'width .5s' }}/>
            </div>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:C.inkMuted, marginBottom:'3px' }}>
              <span>🎬 Video AI</span>
              <span style={{ fontWeight:700, color:'#7C3AED' }}>{quotaInfo.vidUsed}/{quotaInfo.vidLimit}</span>
            </div>
            <div style={{ height:'4px', background:'#7C3AED20', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100,(quotaInfo.vidUsed/quotaInfo.vidLimit)*100)}%`, background:'linear-gradient(90deg,#7C3AED,#6D28D9)', borderRadius:'2px', transition:'width .5s' }}/>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:'5px', paddingBottom:'5px', flexShrink:0 }}>
        <LogoutButton variant="sidebar" collapsed={cOnly}/>
        {!isMobile && (
          <button type="button" onClick={() => setCollapsed(c=>!c)}
            style={{ display:'flex', alignItems:'center', justifyContent:cOnly?'center':'flex-start', gap:'6px', padding:'6px 10px', margin:'2px 0 0', borderRadius:'8px', border:'none', background:'transparent', cursor:'pointer', fontSize:'12px', color:C.inkMuted, fontFamily:"'DM Sans',sans-serif", width:'100%', transition:'all .12s' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=C.bg}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
            {cOnly ? <ChevronRight size={14}/> : <><ChevronLeft size={14}/><span>Sembunyikan</span></>}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ position:'fixed', top:0, left:0, bottom:0, width:`${sidebarW}px`, background:C.sideBg, borderRight:`1px solid ${C.sideBorder}`, zIndex:30, transition:'width .2s ease', overflowX:'hidden', overflowY:'auto' }}>
          <SidebarContent/>
        </aside>
      )}

      {/* Mobile drawer */}
      {isMobile && mobileOpen && (
        <>
          <div onClick={()=>setMobileOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:40, backdropFilter:'blur(2px)' }}/>
          <aside style={{ position:'fixed', top:0, left:0, bottom:0, width:'268px', background:C.sideBg, borderRight:`1px solid ${C.sideBorder}`, zIndex:50, overflowY:'auto', animation:'slideIn .2s ease' }}>
            <button type="button" onClick={()=>setMobileOpen(false)} style={{ position:'absolute', top:'10px', right:'10px', width:'26px', height:'26px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.surface, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13} color={C.inkMuted}/>
            </button>
            <SidebarContent/>
          </aside>
        </>
      )}

      {/* Main */}
      <div style={{ marginLeft:isMobile?0:`${sidebarW}px`, transition:'margin-left .2s ease', minHeight:'100vh', display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <header style={{ position:'sticky', top:0, zIndex:20, background:C.surface, borderBottom:`1px solid ${C.border}`, height:'52px', display:'flex', alignItems:'center', padding:'0 20px', gap:'10px', boxShadow:'0 1px 0 rgba(0,0,0,.04)' }}>
          {isMobile && (
            <button type="button" onClick={()=>setMobileOpen(true)} style={{ width:'32px', height:'32px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Menu size={16} color={C.inkMuted}/>
            </button>
          )}
          {isMobile && (
            <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:'6px', textDecoration:'none' }}>
              <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, display:'flex', alignItems:'center', justifyContent:'center' }}>🐝</div>
              <span style={{ fontWeight:800, fontSize:'14px', color:C.ink }}>BeeSell AI</span>
            </Link>
          )}
          {!isMobile && <h1 style={{ fontSize:'14px', fontWeight:700, color:C.ink, flex:1, letterSpacing:'-0.01em' }}>{title}</h1>}
          <div style={{ flex:isMobile?1:'none' }}/>

          {/* Topbar actions */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {/* ⚡ SUPERUSER pill */}
            {isSuperuser && !isMobile && (
              <Link href="/admin" style={{
                display:'inline-flex', alignItems:'center', gap:'5px',
                padding:'5px 11px', borderRadius:'99px',
                background:`linear-gradient(135deg,${C.slate900},${C.slate800})`,
                color:'#fff', fontSize:'10px', fontWeight:800,
                textDecoration:'none', letterSpacing:'0.04em',
                border:`1px solid ${C.amber}50`,
              }}>
                <Crown size={11} color={C.amber}/>
                SUPERUSER
              </Link>
            )}

            {/* Quick nav badges (desktop) */}
            {!isMobile && !isTablet && !isSuperuser && (
              <div style={{ display:'flex', gap:'5px' }}>
                {[
                  { href:'/scheduler', icon:'📅', label:'Scheduler' },
                  { href:'/analytics', icon:'📊', label:'Analytics' },
                  { href:'https://help.beesell.id', icon:'❓', label:'Help', external:true },
                ].map((item:any) => {
                  const active = isActive(item.href)
                  const badge = (
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 9px', borderRadius:'7px', border:`1px solid ${active?C.amber:C.border}`, background:active?C.amberXlt:C.bg, fontSize:'11px', fontWeight:active?700:500, color:active?C.amberDk:C.inkMuted, transition:'all .12s' }}>
                      {item.icon} {item.label}
                    </div>
                  )
                  return item.external ? (
                    <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>{badge}</a>
                  ) : (
                    <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>{badge}</Link>
                  )
                })}
              </div>
            )}

            <button type="button" onClick={()=>{ setCmdOpen(true); setTimeout(()=>cmdRef.current?.focus(),50) }}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 11px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', fontSize:'12px', color:C.inkMuted, fontFamily:"'DM Sans',sans-serif", transition:'all .12s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.amber;(e.currentTarget as HTMLElement).style.background=C.amberXlt}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.bg}}>
              <Sparkles size={12} color={C.amber}/>
              {!isMobile && <><span>Buat konten</span><span style={{ fontSize:'9px', background:C.border, padding:'1px 5px', borderRadius:'3px', fontWeight:700, color:C.inkMuted }}>⌘K</span></>}
            </button>

            <Link href="/studio" style={{ textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 14px', borderRadius:'8px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, whiteSpace:'nowrap', boxShadow:`0 2px 8px ${C.amber}40`, transition:'transform .15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='translateY(0)'}>
                <Plus size={13}/>{!isMobile && ' Buat'}
              </div>
            </Link>

            {isMobile && <LogoutButton variant="icon-only"/>}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding:isMobile?'14px 12px':isTablet?'18px 16px':'22px 28px', paddingBottom:isMobile?'72px':'32px' }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav style={{ position:'fixed', bottom:0, left:0, right:0, height:'58px', background:C.surface, borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', zIndex:30 }}>
          {[
            { href:'/dashboard',        label:'Home',     emoji:'🏠' },
            { href:'/quick-tools',      label:'Tools',    emoji:'⚡' },
            { href:'/studio',           label:'Studio',   emoji:'🎨', fab:true },
            { href:'/analytics',        label:'Analytic', emoji:'📊' },
            ...(isSuperuser 
              ? [{ href:'/admin', label:'Admin', emoji:'👑' }]
              : [{ href:'/scheduler', label:'Schedule', emoji:'📅' }]),
          ].map((item:any) => {
            const active = isActive(item.href)
            if (item.fab) return (
              <Link key={item.href} href={item.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', textDecoration:'none' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 3px 10px ${C.amber}50`, fontSize:'18px' }}>🎨</div>
              </Link>
            )
            return (
              <Link key={item.href} href={item.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', textDecoration:'none', padding:'6px 0', color:active?C.amber:C.inkMuted }}>
                <span style={{ fontSize:'17px', lineHeight:1 }}>{item.emoji}</span>
                <span style={{ fontSize:'9px', fontWeight:active?700:500 }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}

      {/* ── AI Command Palette ──────────────────────────────── */}
      {cmdOpen && (
        <>
          <div onClick={()=>{setCmdOpen(false);setCmdValue('')}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:400, backdropFilter:'blur(4px)' }}/>
          <div style={{ position:'fixed', top:'16%', left:'50%', transform:'translateX(-50%)', width:'min(600px,94vw)', background:C.surface, borderRadius:'18px', boxShadow:'0 25px 60px rgba(0,0,0,.2)', zIndex:401, overflow:'hidden', border:`1px solid ${C.border}` }}>
            {/* Search */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
              <Sparkles size={16} color={C.amber}/>
              <input ref={cmdRef} value={cmdValue} onChange={e=>setCmdValue(e.target.value)}
                placeholder={isSuperuser ? "Cari tools, fitur, admin panel, atau tanya AI..." : "Cari tools, fitur, atau tanyakan apa yang ingin kamu buat..."}
                style={{ flex:1, border:'none', outline:'none', fontSize:'14px', color:C.ink, background:'transparent', fontFamily:"'DM Sans',sans-serif" }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filteredCmds[0]) {
                    const first = filteredCmds[0] as any
                    if (first.external) window.open(first.href, '_blank', 'noopener,noreferrer')
                    else router.push(first.href)
                    setCmdOpen(false); setCmdValue('')
                  }
                }}/>
              <button type="button" onClick={()=>{setCmdOpen(false);setCmdValue('')}} style={{ padding:'3px 8px', borderRadius:'5px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', fontSize:'10px', color:C.inkMuted, fontFamily:'inherit' }}>Esc</button>
            </div>

            {/* Groups */}
            <div style={{ padding:'8px', maxHeight:'400px', overflowY:'auto' }}>
              {cmdValue ? (
                filteredCmds.length > 0 ? filteredCmds.map((a, i) => <CmdItem key={i} a={a} router={router} close={()=>{setCmdOpen(false);setCmdValue('')}}/>) : (
                  <div style={{ padding:'28px', textAlign:'center', color:C.inkMuted, fontSize:'13px' }}>Tidak ada hasil untuk "{cmdValue}"</div>
                )
              ) : (
                ([...(isSuperuser ? ['Admin'] : []), 'AI Studio','Ads & Growth','Analytics','Scheduler','Kelola'] as const).map(group => {
                  const items = activeCmdActions.filter(a => a.group === group)
                  if (!items.length) return null
                  return (
                    <div key={group}>
                      <div style={{ 
                        fontSize:'9px', fontWeight:800, 
                        color: group === 'Admin' ? C.amber : C.inkMuted, 
                        textTransform:'uppercase', letterSpacing:'0.09em', 
                        padding:'8px 10px 4px',
                        display:'flex', alignItems:'center', gap:'5px',
                      }}>
                        {group === 'Admin' && <Crown size={9}/>} {group}
                      </div>
                      {items.map((a, i) => <CmdItem key={i} a={a} router={router} close={()=>{setCmdOpen(false);setCmdValue('')}}/>)}
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ padding:'9px 18px', background:C.bg, borderTop:`1px solid ${C.border}`, fontSize:'10px', color:C.inkMuted, display:'flex', gap:'14px' }}>
              <span>↵ Buka</span><span>Esc Tutup</span><span>⌘K Toggle</span>
              {isSuperuser && (
                <span style={{ marginLeft:'auto', color:C.amber, fontWeight:700, display:'inline-flex', alignItems:'center', gap:'3px' }}>
                  <Crown size={10}/> Superuser access
                </span>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        * { box-sizing:border-box }
        body { margin:0 }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:2px }
        ::-webkit-scrollbar-track { background:transparent }
      `}</style>
    </div>
  )
}

// ── CMD result item ────────────────────────────────────────────
function CmdItem({ a, router, close }: { a:{label:string;href:string;icon:string;group:string;external?:boolean}; router:any; close:()=>void }) {
  const inner = (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'9px', cursor:'pointer', transition:'background .1s' }}
      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FFFBEB'}
      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
      <span style={{ fontSize:'17px', width:'26px', textAlign:'center', flexShrink:0 }}>{a.icon}</span>
      <span style={{ fontSize:'13px', color:'#111827', fontWeight:500, flex:1 }}>{a.label}</span>
      <ArrowRight size={12} color='#E5E7EB' style={{ marginLeft:'auto' }}/>
    </div>
  )
  if (a.external) {
    return <a href={a.href} target="_blank" rel="noopener noreferrer" onClick={close} style={{ textDecoration:'none' }}>{inner}</a>
  }
  return <Link href={a.href} onClick={close} style={{ textDecoration:'none' }}>{inner}</Link>
}

// ── Section label ─────────────────────────────────────────────
function SectionLabel({ text, color }: { text:string; color:string }) {
  return <div style={{ fontSize:'9px', fontWeight:800, color, textTransform:'uppercase', letterSpacing:'0.1em', padding:'8px 10px 3px', userSelect:'none' }}>{text}</div>
}

// ── Divider ───────────────────────────────────────────────────
function Divider() {
  return <div style={{ height:'1px', background:'#E5E7EB', margin:'5px 2px' }}/>
}

// ── ChevronDown (not in lucide default import) ────────────────
function ChevronDown({ size, color, style }: { size:number; color:string; style?:React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="6 9 12 15 18 9"/></svg>
}

// ── Helper: ink/inkSub references untuk ChevronDown ──────────
const ink = '#111827'  // not used outside InnerLayout but kept for safety

// ── Export ────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children:React.ReactNode }) {
  return <SessionProvider><InnerLayout>{children}</InnerLayout></SessionProvider>
}