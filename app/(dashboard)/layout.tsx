'use client'
// apps/web-app/app/(dashboard)/layout.tsx
// ── BeeSell AI — Dashboard Layout P1 MVP ─────────────────────
// Sidebar 14 menu sesuai struktur final, P2-P4 ditampilkan locked
// AI Command Center di atas sidebar (always visible)
// Responsive: desktop sidebar | tablet collapsed | mobile bottom nav

import { useEffect, useState, useRef } from 'react'
import Link            from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SessionProvider, LogoutButton } from '@/components/auth/LogoutButton'
import {
  LayoutDashboard, Zap, Palette, Megaphone, Bot,
  ShoppingBag, Users2, TrendingUp, BarChart3,
  Brush, Archive, UsersRound, CreditCard, Settings,
  ChevronLeft, ChevronRight, Menu, X, Plus, Sparkles,
  Lock, Command, ArrowRight,
} from 'lucide-react'

const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  slate900:'#0F172A', slate800:'#1E293B', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#ffffff',
}

// ── P1 MVP nav (aktif) ─────────────────────────────────────────
const NAV_P1 = [
  { href:'/dashboard',   label:'Home Dashboard',  icon:<LayoutDashboard size={17}/>, phase:1 },
  { href:'/quick-tools', label:'Quick Tools',      icon:<Zap size={17}/>,            phase:1 },
  { href:'/studio',      label:'AI Studio',        icon:<Palette size={17}/>,        phase:1 },
]

// ── P2-P4 locked menu ──────────────────────────────────────────
const NAV_LOCKED = [
  { href:'/campaign',    label:'Campaign Builder', icon:<Megaphone size={17}/>,  phase:2, color:C.brand },
  { href:'/automation',  label:'AI Automation',    icon:<Bot size={17}/>,         phase:2, color:C.purple },
  { href:'/marketplace', label:'Marketplace',      icon:<ShoppingBag size={17}/>, phase:2, color:'#0284C7' },
  { href:'/affiliate',   label:'Affiliate Center', icon:<Users2 size={17}/>,      phase:2, color:C.green },
  { href:'/trend',       label:'Trend & Research', icon:<TrendingUp size={17}/>,  phase:3, color:C.amber },
  { href:'/analytics',   label:'Analytics',        icon:<BarChart3 size={17}/>,   phase:3, color:C.purple },
  { href:'/brand',       label:'Brand Center',     icon:<Brush size={17}/>,       phase:4, color:'#DB2777' },
  { href:'/team',        label:'Team Workspace',   icon:<UsersRound size={17}/>,  phase:3, color:C.green },
]

// ── P1 bottom nav ──────────────────────────────────────────────
const NAV_BOTTOM_P1 = [
  { href:'/library',              label:'Asset Library', icon:<Archive size={17}/>, phase:1 },
  { href:'/billing',              label:'Billing',       icon:<CreditCard size={17}/>, phase:1 },
  { href:'/settings',             label:'Settings',      icon:<Settings size={17}/>, phase:1 },
]

const PHASE_BADGE: Record<number, string> = { 2:'Phase 2', 3:'Phase 3', 4:'Phase 4' }

const ROUTE_TITLE: Record<string, string> = {
  '/dashboard':              'Home Dashboard',
  '/quick-tools':            'Quick Tools',
  '/studio':                       'AI Studio',
  '/studio/image':                 'AI Image Generator',
  '/studio/image/photoshoot':      'AI Product Photoshoot',
  '/studio/image/packshot':        'AI Packshot Generator',
  '/studio/image/product-to-model':'Product to Model AI',
  '/studio/image/tryon':           'AI Try-On Fashion',
  '/studio/image/model-swap':      'Model Swap AI',
  '/studio/image/face-swap':       'Face Swap AI',
  '/studio/image/enhancer':        'Product Enhancer AI',
  '/studio/video':                 'AI Video Generator',
  '/studio/video/product':         'Product Video AI',
  '/studio/video/ugc':             'UGC Video Generator',
  '/studio/video/tiktok':          'TikTok Reels AI',
  '/library':                'Asset Library',
  '/billing':                'Billing & Credits',
  '/settings':               'Settings',
  '/settings/brand-kit':     'Brand Kit',
  '/settings/connections':   'Koneksi Platform',
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)
  const [isTablet,    setIsTablet]    = useState(false)
  const [cmdOpen,     setCmdOpen]     = useState(false)
  const [cmdValue,    setCmdValue]    = useState('')
  const [lockedTip,   setLockedTip]   = useState<string|null>(null)
  const cmdRef = useRef<HTMLInputElement>(null)

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

  // ⌘K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setCmdOpen(o => !o)
        setTimeout(() => cmdRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setCmdOpen(false)
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])

  const sidebarW = isMobile ? 0 : collapsed ? 60 : 248

  const title = (() => {
    if (ROUTE_TITLE[pathname]) return ROUTE_TITLE[pathname]
    const match = Object.keys(ROUTE_TITLE).filter(k => pathname.startsWith(k) && k !== '/').sort((a,b) => b.length-a.length)[0]
    return ROUTE_TITLE[match ?? ''] ?? 'BeeSell AI'
  })()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  // ── CMD palette quick actions ──────────────────────────────
  const CMD_ACTIONS = [
    { label:'Remove Background',   href:'/quick-tools?tool=remove-bg',     icon:'🪄' },
    { label:'AI Upscale',          href:'/quick-tools?tool=upscale',       icon:'🔍' },
    { label:'Resize Smart AI',     href:'/quick-tools/resize',             icon:'📐' },
    { label:'AI Product Photoshoot',  href:'/studio/image/photoshoot',       icon:'🌟' },
    { label:'AI Packshot Generator',  href:'/studio/image/packshot',         icon:'📦' },
    { label:'Product to Model AI',    href:'/studio/image/product-to-model', icon:'🧑‍🦰' },
    { label:'AI Try-On Fashion',      href:'/studio/image/tryon',            icon:'👗' },
    { label:'Product Enhancer AI',    href:'/studio/image/enhancer',         icon:'✨' },
    { label:'Product Video AI',       href:'/studio/video/product',          icon:'🎬' },
    { label:'TikTok Reels AI',        href:'/studio/video/tiktok',           icon:'🎵' },
    { label:'Asset Library',       href:'/library',                  icon:'📂' },
    { label:'Billing & Credits',   href:'/billing',                  icon:'💳' },
    { label:'Pengaturan',          href:'/settings',                 icon:'⚙️' },
  ].filter(a => !cmdValue || a.label.toLowerCase().includes(cmdValue.toLowerCase()))

  // ── NavItem ────────────────────────────────────────────────
  const NavItem = ({ item }: { item: typeof NAV_P1[0] }) => {
    const active = isActive(item.href)
    const cOnly  = collapsed && !isMobile
    return (
      <Link href={item.href} style={{ textDecoration:'none' }} onClick={() => isMobile && setMobileOpen(false)}>
        <div title={cOnly ? item.label : undefined} style={{
          display:'flex', alignItems:'center', gap: cOnly ? 0 : '9px',
          justifyContent: cOnly ? 'center' : 'flex-start',
          padding: cOnly ? '10px 0' : '8px 11px',
          borderRadius:'10px', margin:'1px 0',
          background: active ? C.brand50 : 'transparent',
          color: active ? C.brand : C.slate600,
          fontWeight: active ? 700 : 500, fontSize:'13px',
          transition:'all .12s', cursor:'pointer',
          borderLeft: active && !cOnly ? `3px solid ${C.brand}` : '3px solid transparent',
        }}
          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.slate100 }}
          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <span style={{ color: active ? C.brand : C.slate400, flexShrink:0 }}>{item.icon}</span>
          {!cOnly && <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>}
        </div>
      </Link>
    )
  }

  // ── Locked NavItem ─────────────────────────────────────────
  const LockedItem = ({ item }: { item: typeof NAV_LOCKED[0] }) => {
    const cOnly = collapsed && !isMobile
    return (
      <div
        title={cOnly ? `${item.label} (${PHASE_BADGE[item.phase]})` : undefined}
        onClick={() => !cOnly && setLockedTip(lockedTip === item.href ? null : item.href)}
        style={{
          display:'flex', alignItems:'center', gap: cOnly ? 0 : '9px',
          justifyContent: cOnly ? 'center' : 'flex-start',
          padding: cOnly ? '10px 0' : '8px 11px',
          borderRadius:'10px', margin:'1px 0',
          color: C.slate400, fontSize:'13px', fontWeight:500,
          cursor:'pointer', transition:'all .12s',
          opacity: 0.6, position:'relative',
          borderLeft: '3px solid transparent',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.slate50}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; setLockedTip(null) }}
      >
        <span style={{ color:C.slate400, flexShrink:0 }}>{item.icon}</span>
        {!cOnly && (
          <>
            <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>{item.label}</span>
            <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', background:C.slate100, color:C.slate400, flexShrink:0, marginLeft:'auto' }}>
              {PHASE_BADGE[item.phase]}
            </span>
          </>
        )}
        {/* Tooltip */}
        {lockedTip === item.href && !cOnly && (
          <div style={{ position:'absolute', left:'calc(100% + 10px)', top:'50%', transform:'translateY(-50%)', background:C.slate900, color:C.white, fontSize:'11px', fontWeight:600, padding:'6px 12px', borderRadius:'8px', whiteSpace:'nowrap', zIndex:100, boxShadow:'0 4px 12px rgba(0,0,0,.3)' }}>
            🔒 Tersedia di {PHASE_BADGE[item.phase]}
            <div style={{ position:'absolute', left:'-5px', top:'50%', transform:'translateY(-50%)', width:0, height:0, borderTop:'5px solid transparent', borderBottom:'5px solid transparent', borderRight:`5px solid ${C.slate900}` }}/>
          </div>
        )}
      </div>
    )
  }

  // ── Sidebar content ────────────────────────────────────────
  const SidebarContent = () => {
    const cOnly = collapsed && !isMobile
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'0 8px' }}>

        {/* Logo */}
        <div style={{ padding: cOnly ? '14px 0' : '14px 4px', display:'flex', alignItems:'center', gap:'8px', justifyContent: cOnly ? 'center' : 'flex-start', marginBottom:'4px', borderBottom:`1px solid ${C.slate100}`, paddingBottom:'14px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg, #2563EB, #7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0 }}>🐝</div>
          {!cOnly && (
            <div>
              <div style={{ fontFamily:'Georgia, serif', fontWeight:700, fontSize:'15px', color:C.slate900, lineHeight:1 }}>BeeSell AI</div>
              <div style={{ fontSize:'9px', color:C.slate400, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginTop:'1px' }}>AI Sales Platform</div>
            </div>
          )}
        </div>

        {/* AI Command Bar */}
        {!cOnly && (
          <button
            onClick={() => { setCmdOpen(true); setTimeout(() => cmdRef.current?.focus(), 50) }}
            style={{ margin:'10px 0 6px', padding:'8px 12px', borderRadius:'10px', border:`1px solid ${C.slate200}`, background:C.slate50, cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:C.slate400, fontFamily:"'DM Sans',sans-serif", textAlign:'left', transition:'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.brand; (e.currentTarget as HTMLElement).style.color = C.slate600 }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200; (e.currentTarget as HTMLElement).style.color = C.slate400 }}
          >
            <Sparkles size={12} color={C.brand}/>
            <span style={{ flex:1 }}>Apa yang ingin dibuat?</span>
            <span style={{ fontSize:'9px', background:C.slate200, padding:'1px 5px', borderRadius:'4px', fontWeight:700, color:C.slate500 }}>⌘K</span>
          </button>
        )}
        {cOnly && (
          <button onClick={() => setCmdOpen(true)} style={{ margin:'8px 0 4px', padding:'10px 0', borderRadius:'10px', border:`1px solid ${C.slate200}`, background:C.slate50, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s', width:'100%' }}>
            <Command size={14} color={C.brand}/>
          </button>
        )}

        {/* Nav scroll area */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', paddingBottom:'8px' }}>

          {/* P1 active */}
          {!cOnly && <div style={{ fontSize:'9px', fontWeight:700, color:C.green, textTransform:'uppercase', letterSpacing:'0.1em', padding:'8px 11px 4px' }}>Phase 1 — Aktif</div>}
          {NAV_P1.map(item => <NavItem key={item.href} item={item} />)}

          {/* Separator */}
          <div style={{ height:'1px', background:C.slate100, margin:'8px 4px' }}/>

          {/* P2-P4 locked */}
          {!cOnly && <div style={{ fontSize:'9px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.1em', padding:'4px 11px 4px' }}>🔒 Segera Hadir</div>}
          {NAV_LOCKED.map(item => <LockedItem key={item.href} item={item} />)}

          {/* Separator */}
          <div style={{ height:'1px', background:C.slate100, margin:'8px 4px' }}/>

          {/* Library + Billing + Settings */}
          {!cOnly && <div style={{ fontSize:'9px', fontWeight:700, color:C.green, textTransform:'uppercase', letterSpacing:'0.1em', padding:'4px 11px 4px' }}>Kelola</div>}
          {NAV_BOTTOM_P1.map(item => <NavItem key={item.href} item={item} />)}
        </div>

        {/* Credits mini */}
        {!cOnly && (
          <div style={{ margin:'6px 0', padding:'10px 12px', background:'linear-gradient(135deg, #EFF6FF, #F5F3FF)', borderRadius:'10px', border:`1px solid ${C.brand100}` }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:C.slate700, marginBottom:'5px' }}>Credits hari ini</div>
            <div style={{ height:'4px', background:C.slate200, borderRadius:'2px', overflow:'hidden', marginBottom:'4px' }}>
              <div style={{ height:'100%', width:'35%', background:'linear-gradient(90deg, #2563EB, #7C3AED)', borderRadius:'2px' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:C.slate500 }}>
              <span>3/50 dipakai</span>
              <Link href="/billing" style={{ color:C.brand, fontWeight:700, textDecoration:'none' }}>Upgrade</Link>
            </div>
          </div>
        )}

        {/* Logout */}
        <div style={{ borderTop:`1px solid ${C.slate100}`, paddingTop:'6px', paddingBottom:'6px' }}>
          <LogoutButton variant="sidebar" collapsed={cOnly} />
        </div>

        {/* Collapse toggle */}
        {!isMobile && (
          <button onClick={() => setCollapsed(c => !c)} style={{ display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-start', gap:'8px', padding:'8px 11px', margin:'0 0 4px', borderRadius:'10px', border:'none', background:'transparent', cursor:'pointer', fontSize:'12px', color:C.slate400, fontFamily:"'DM Sans',sans-serif", width:'100%', transition:'all .12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.slate100}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            {collapsed ? <ChevronRight size={14}/> : <><ChevronLeft size={14}/><span>Sembunyikan</span></>}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:C.slate50, fontFamily:"'DM Sans',sans-serif" }}>

      {/* Desktop/Tablet sidebar */}
      {!isMobile && (
        <aside style={{ position:'fixed', top:0, left:0, bottom:0, width:`${sidebarW}px`, background:C.white, borderRight:`1px solid ${C.slate200}`, zIndex:30, transition:'width .2s ease', overflowX:'hidden', overflowY:'auto' }}>
          <SidebarContent/>
        </aside>
      )}

      {/* Mobile drawer */}
      {isMobile && mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', zIndex:40, backdropFilter:'blur(2px)' }}/>
          <aside style={{ position:'fixed', top:0, left:0, bottom:0, width:'268px', background:C.white, borderRight:`1px solid ${C.slate200}`, zIndex:50, overflowY:'auto', animation:'slideIn .2s ease' }}>
            <div style={{ position:'absolute', top:'12px', right:'12px' }}>
              <button onClick={() => setMobileOpen(false)} style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.slate200}`, background:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={14} color={C.slate500}/>
              </button>
            </div>
            <SidebarContent/>
          </aside>
        </>
      )}

      {/* Main */}
      <div style={{ marginLeft: isMobile ? 0 : `${sidebarW}px`, transition:'margin-left .2s ease', minHeight:'100vh', display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <header style={{ position:'sticky', top:0, zIndex:20, background:C.white, borderBottom:`1px solid ${C.slate200}`, height:'52px', display:'flex', alignItems:'center', padding:'0 16px', gap:'10px' }}>
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} style={{ width:'34px', height:'34px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Menu size={16} color={C.slate600}/>
            </button>
          )}
          {isMobile && (
            <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:'6px', textDecoration:'none' }}>
              <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:'linear-gradient(135deg, #2563EB, #7C3AED)', display:'flex', alignItems:'center', justifyContent:'center' }}>🐝</div>
              <span style={{ fontFamily:'Georgia, serif', fontWeight:700, fontSize:'14px', color:C.slate900 }}>BeeSell AI</span>
            </Link>
          )}
          {!isMobile && <h1 style={{ fontSize:'14px', fontWeight:700, color:C.slate900, flex:1 }}>{title}</h1>}
          <div style={{ flex: isMobile ? 1 : 'none' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {/* AI Command trigger di topbar */}
            <button onClick={() => { setCmdOpen(true); setTimeout(() => cmdRef.current?.focus(), 50) }}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.slate50, cursor:'pointer', fontSize:'12px', color:C.slate500, fontFamily:"'DM Sans',sans-serif" }}>
              <Sparkles size={12} color={C.brand}/>{!isMobile && 'Buat konten'}
              {!isMobile && <span style={{ fontSize:'9px', background:C.slate200, padding:'1px 5px', borderRadius:'3px', fontWeight:700, color:C.slate500 }}>⌘K</span>}
            </button>
            {/* Quick create */}
            <Link href="/quick-tools" style={{ textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'9px', background:'linear-gradient(135deg, #2563EB, #7C3AED)', color:'white', fontSize:'12px', fontWeight:700, whiteSpace:'nowrap' }}>
                <Plus size={13}/>{!isMobile && 'Buat'}
              </div>
            </Link>
            {isMobile && <LogoutButton variant="icon-only"/>}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding: isMobile ? '16px 12px' : isTablet ? '20px 16px' : '24px 24px', paddingBottom: isMobile ? '80px' : '32px' }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav style={{ position:'fixed', bottom:0, left:0, right:0, height:'60px', background:C.white, borderTop:`1px solid ${C.slate200}`, display:'flex', alignItems:'center', zIndex:30, paddingBottom:'env(safe-area-inset-bottom)' }}>
          {[
            { href:'/dashboard',  label:'Home',    icon:<LayoutDashboard size={19}/> },
            { href:'/quick-tools',label:'Tools',   icon:<Zap size={19}/> },
            { href:'/studio',     label:'Studio',  icon:<Palette size={22}/>, fab:true },
            { href:'/library',    label:'Library', icon:<Archive size={19}/> },
            { href:'/settings',   label:'Settings',icon:<Settings size={19}/> },
          ].map(item => {
            const active = isActive(item.href)
            if ((item as any).fab) return (
              <Link key={item.href} href={item.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', textDecoration:'none' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:'linear-gradient(135deg, #2563EB, #7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(37,99,235,.35)' }}>
                  <Palette size={20} color="white"/>
                </div>
              </Link>
            )
            return (
              <Link key={item.href} href={item.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', textDecoration:'none', padding:'6px 0', color: active ? C.brand : C.slate400 }}>
                <span style={{ color: active ? C.brand : C.slate400 }}>{item.icon}</span>
                <span style={{ fontSize:'9px', fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}

      {/* ── AI COMMAND PALETTE ──────────────────────────────── */}
      {cmdOpen && (
        <>
          <div onClick={() => setCmdOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', zIndex:200, backdropFilter:'blur(4px)' }}/>
          <div style={{ position:'fixed', top:'20%', left:'50%', transform:'translateX(-50%)', width:'min(560px, 92vw)', background:C.white, borderRadius:'18px', boxShadow:'0 25px 60px rgba(0,0,0,.2)', zIndex:201, overflow:'hidden' }}>
            {/* Search bar */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 16px', borderBottom:`1px solid ${C.slate100}` }}>
              <Sparkles size={16} color={C.brand}/>
              <input ref={cmdRef} value={cmdValue} onChange={e => setCmdValue(e.target.value)}
                placeholder="Apa yang ingin kamu buat hari ini?"
                style={{ flex:1, border:'none', outline:'none', fontSize:'15px', color:C.slate900, background:'transparent', fontFamily:"'DM Sans',sans-serif" }}
                onKeyDown={e => { if (e.key === 'Enter' && CMD_ACTIONS[0]) { router.push(CMD_ACTIONS[0].href); setCmdOpen(false); setCmdValue('') } }}
              />
              <button onClick={() => setCmdOpen(false)} style={{ width:'24px', height:'24px', borderRadius:'5px', border:`1px solid ${C.slate200}`, background:C.slate50, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:C.slate400 }}>Esc</button>
            </div>

            {/* Quick actions */}
            <div style={{ padding:'8px' }}>
              <div style={{ fontSize:'10px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.08em', padding:'4px 8px 6px' }}>Aksi Cepat</div>
              {CMD_ACTIONS.slice(0, 8).map((a, i) => (
                <Link key={i} href={a.href} onClick={() => { setCmdOpen(false); setCmdValue('') }} style={{ textDecoration:'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'9px', cursor:'pointer', transition:'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.slate50}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <span style={{ fontSize:'16px', width:'24px', textAlign:'center' }}>{a.icon}</span>
                    <span style={{ fontSize:'13px', color:C.slate800, fontWeight:500 }}>{a.label}</span>
                    <ArrowRight size={12} color={C.slate300} style={{ marginLeft:'auto' }}/>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ padding:'10px 16px', background:C.slate50, borderTop:`1px solid ${C.slate100}`, fontSize:'11px', color:C.slate400 }}>
              Enter untuk buka · Esc untuk tutup · ⌘K untuk toggle
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        * { box-sizing: border-box }
        body { margin: 0 }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 2px }
      `}</style>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider><InnerLayout>{children}</InnerLayout></SessionProvider>
}