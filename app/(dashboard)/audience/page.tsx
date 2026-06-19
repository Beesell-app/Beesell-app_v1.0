'use client'
// app/(dashboard)/audience/page.tsx
// ══════════════════════════════════════════════════════════════
// AUDIENCE TARGETING INTELLIGENCE
// Tab 1 — Interest Mapping (AI reco + taxonomy browser)
// Tab 2 — Lookalike Builder (customer data → LAL specs)
// Tab 3 — Retargeting Setup (pixel code + audience config)
// Light theme · Amber primary
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Sparkles, Loader2, Copy, Check,
  AlertCircle, ChevronDown, ChevronUp, Upload,
  X, Zap, Target, Users, Code, RefreshCw,
  CheckCircle2, Brain, TrendingUp, Shield,
  Info, BarChart3, Eye,
} from 'lucide-react'
import {
  INTEREST_TAXONOMY, PIXEL_EVENTS, RETARGET_STRATEGIES,
  BASE_PIXEL_SCRIPTS, fmtN,
  type NicheId, type PlatformId, type Interest,
  type LookalikeAudience, type RetargetAudience,
  type PixelEventType,
} from '@/lib/audience/types'

// ── Tokens ────────────────────────────────────────────────────
const C = {
  amber:    '#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:    '#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:   '#E5E7EB', borderHi:'#D1D5DB',
  ink:      '#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:    '#059669', greenLt:'#ECFDF5',
  blue:     '#3B82F6', blueLt:'#EFF6FF',
  purple:   '#7C3AED', purpleLt:'#F5F3FF',
  red:      '#EF4444', redLt:'#FEF2F2',
  orange:   '#F97316', orangeLt:'#FFF7ED',
  teal:     '#0D9488', tealLt:'#F0FDFA',
  meta:     '#1877F2', tiktok:'#010101', google:'#4285F4',
  sh: '0 1px 3px rgba(0,0,0,.06)',
  sm: '0 4px 16px rgba(0,0,0,.07)',
  sa: '0 6px 20px rgba(245,158,11,.22)',
}

type Tab = 'interests' | 'lookalike' | 'retarget'

// ── Helpers ───────────────────────────────────────────────────
const NICHES: { id: NicheId; l: string; icon: string }[] = [
  { id:'general',  l:'Umum',         icon:'🏪' },
  { id:'fashion',  l:'Fashion',      icon:'👗' },
  { id:'beauty',   l:'Beauty',       icon:'💄' },
  { id:'skincare', l:'Skincare',     icon:'🧴' },
  { id:'food',     l:'F&B',          icon:'🍜' },
  { id:'gadget',   l:'Gadget',       icon:'📱' },
  { id:'health',   l:'Kesehatan',    icon:'🌿' },
  { id:'home',     l:'Home Decor',   icon:'🏡' },
  { id:'baby',     l:'Baby & Kids',  icon:'👶' },
  { id:'hijab',    l:'Hijab',        icon:'🧕' },
]

const PLATFORMS: { id:PlatformId; l:string; icon:string; color:string }[] = [
  { id:'meta',   l:'Meta Ads',     icon:'📘', color:C.meta   },
  { id:'tiktok', l:'TikTok Ads',   icon:'🎵', color:C.tiktok },
  { id:'google', l:'Google Ads',   icon:'🔍', color:C.google },
]

const SOURCE_TYPES = [
  { id:'customer_list',     l:'Customer List',     icon:'👥', desc:'Upload CSV email/telepon' },
  { id:'website_visitors',  l:'Website Visitors',  icon:'🌐', desc:'Data pixel pengunjung' },
  { id:'engagement',        l:'Engagement',        icon:'❤️', desc:'Like, comment, follow' },
  { id:'purchase_events',   l:'Purchase Events',   icon:'💰', desc:'Data transaksi' },
]

const PRIORITY_COLORS = {
  hot:    { bg:C.redLt,    text:C.red,    icon:'🔥', label:'Hot (High Intent)' },
  warm:   { bg:C.orangeLt, text:C.orange, icon:'♨️', label:'Warm'              },
  cold:   { bg:C.blueLt,   text:C.blue,   icon:'❄️', label:'Cold'              },
}

// ── Atoms ─────────────────────────────────────────────────────
function Pill({ label, selected, onClick, color=C.amber, icon }: {
  label:string; selected:boolean; onClick:()=>void; color?:string; icon?:string
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 12px', borderRadius:'99px', border:`1.5px solid ${selected?color:C.border}`, background:selected?`${color}12`:C.surface, color:selected?color:C.inkMuted, fontSize:'12px', fontWeight:selected?700:500, cursor:'pointer', transition:'all .12s', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:selected?`0 0 0 1px ${color}20`:'none' }}
      onMouseEnter={e=>{if(!selected)(e.currentTarget as HTMLElement).style.borderColor=color}}
      onMouseLeave={e=>{if(!selected)(e.currentTarget as HTMLElement).style.borderColor=C.border}}>
      {icon && <span>{icon}</span>}{label}
    </button>
  )
}

function CopyBtn({ text, label='Salin', small }: { text:string; label?:string; small?:boolean }) {
  const [cp, setCp] = useState(false)
  const copy = async () => { await navigator.clipboard.writeText(text); setCp(true); setTimeout(()=>setCp(false),2000) }
  return (
    <button onClick={copy}
      style={{ display:'flex', alignItems:'center', gap:'4px', padding:small?'3px 7px':'6px 11px', borderRadius:'7px', border:`1px solid ${cp?C.green:C.border}`, background:cp?C.greenLt:C.surface, color:cp?C.green:C.inkDim, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', flexShrink:0 }}>
      {cp ? <><Check size={11}/> Tersalin</> : <><Copy size={11}/> {label}</>}
    </button>
  )
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:C.surface, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden', ...style }}>{children}</div>
}

function CardH({ icon, title, sub, badge, color=C.amber }: { icon:string; title:string; sub?:string; badge?:string; color?:string }) {
  return (
    <div style={{ padding:'13px 18px', borderBottom:`1px solid ${C.border}`, background:C.bg, display:'flex', alignItems:'center', gap:'9px' }}>
      <span style={{ fontSize:'18px' }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>{title}</div>
        {sub && <div style={{ fontSize:'10px', color:C.inkMuted, marginTop:'1px' }}>{sub}</div>}
      </div>
      {badge && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'99px', background:`${color}18`, color }}>{badge}</span>}
    </div>
  )
}

function Insight({ text, color=C.amber }: { text:string; color?:string }) {
  return (
    <div style={{ padding:'10px 13px', borderRadius:'10px', background:`${color}08`, border:`1px solid ${color}25`, display:'flex', gap:'8px', alignItems:'flex-start' }}>
      <Brain size={13} color={color} style={{ flexShrink:0, marginTop:'1px' }}/>
      <div style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.6 }}>{text}</div>
    </div>
  )
}

// ── Code block ────────────────────────────────────────────────
function CodeBlock({ code, lang='javascript' }: { code:string; lang?:string }) {
  const [collapsed, setCollapsed] = useState(true)
  const lines = code.split('\n')
  const shown = collapsed ? lines.slice(0,8).join('\n') : code
  return (
    <div style={{ borderRadius:'10px', overflow:'hidden', border:`1px solid ${C.border}` }}>
      <div style={{ background:'#1E1E1E', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'10px', color:'#9CA3AF', fontFamily:'monospace' }}>{lang}</span>
        <div style={{ display:'flex', gap:'6px' }}>
          <CopyBtn text={code} small/>
          <button onClick={()=>setCollapsed(p=>!p)} style={{ padding:'2px 7px', borderRadius:'5px', border:`1px solid #374151`, background:'#111827', color:'#9CA3AF', fontSize:'10px', cursor:'pointer', fontFamily:'inherit' }}>
            {collapsed ? `${lines.length - 8} baris lagi` : 'Sembunyikan'}
          </button>
        </div>
      </div>
      <pre style={{ margin:0, padding:'12px', background:'#111827', overflowX:'auto', fontSize:'11px', lineHeight:1.7, color:'#D1D5DB', fontFamily:"'Fira Code','Courier New',monospace", maxHeight:collapsed?'200px':'none', overflow:'auto' }}>
        <code>{shown}{collapsed && lines.length > 8 ? '\n// ...' : ''}</code>
      </pre>
    </div>
  )
}

// ── Interest card ─────────────────────────────────────────────
function InterestCard({ interest, selected, onToggle, isRecommended, isAvoid }: {
  interest:Interest; selected:boolean; onToggle:()=>void; isRecommended?:boolean; isAvoid?:boolean
}) {
  const compColor = interest.competition === 'low' ? C.green : interest.competition === 'medium' ? C.orange : C.red
  const platIcons = interest.platform.map(p => PLATFORMS.find(pl=>pl.id===p)?.icon ?? '').join(' ')
  return (
    <div onClick={onToggle}
      style={{ padding:'12px 13px', borderRadius:'12px', border:`1.5px solid ${selected?C.amber:isRecommended?C.green+'50':isAvoid?C.red+'30':C.border}`, background:selected?C.amberXlt:isRecommended?C.greenLt:isAvoid?`${C.red}05`:C.surface, cursor:'pointer', transition:'all .15s', boxShadow:selected?C.sa:C.sh }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'6px' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:'5px', alignItems:'center', marginBottom:'2px', flexWrap:'wrap' }}>
            {isRecommended && <span style={{ fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'3px', background:C.green, color:'#fff' }}>⭐ REKOMENDASI</span>}
            {isAvoid && <span style={{ fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'3px', background:C.red, color:'#fff' }}>⚠ HINDARI</span>}
            <span style={{ fontSize:'12px', fontWeight:700, color:selected?C.amberDk:C.ink }}>{interest.name}</span>
          </div>
          <div style={{ fontSize:'10px', color:C.inkMuted }}>{interest.category} · {platIcons}</div>
        </div>
        {selected && <CheckCircle2 size={15} color={C.amber} style={{ flexShrink:0 }}/>}
      </div>
      <div style={{ display:'flex', gap:'12px', fontSize:'10px' }}>
        <div>
          <div style={{ color:C.inkDim }}>Audience</div>
          <div style={{ fontWeight:700, color:C.blue }}>{fmtN(interest.audienceSize.min)}–{fmtN(interest.audienceSize.max)}</div>
        </div>
        <div>
          <div style={{ color:C.inkDim }}>Affinitas</div>
          <div style={{ fontWeight:700, color:C.amber }}>{interest.affinity}/100</div>
        </div>
        <div>
          <div style={{ color:C.inkDim }}>Kompetisi</div>
          <div style={{ fontWeight:700, color:compColor, textTransform:'capitalize' }}>{interest.competition}</div>
        </div>
        <div>
          <div style={{ color:C.inkDim }}>CPM Index</div>
          <div style={{ fontWeight:700, color:C.ink }}>{interest.cpmIndex.toFixed(1)}x</div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════

export default function AudiencePage() {
  const [error, setError] = useState('')
  const [tab,          setTab]          = useState<Tab>('interests')
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null)
  // Shared config
  const [niche,        setNiche]        = useState<NicheId>('general')
  const [platforms,    setPlatforms]    = useState<PlatformId[]>(['meta'])
  const [productName,  setProductName]  = useState('')
  const [productDesc,  setProductDesc]  = useState('')

  // Interest state
  const [intLoading,   setIntLoading]   = useState(false)
  const [intResult,    setIntResult]    = useState<any>(null)
  const [selInterests, setSelInterests] = useState<Set<string>>(new Set())

  // Lookalike state
  const [lalLoading,   setLalLoading]   = useState(false)
  const [lalResult,    setLalResult]    = useState<any>(null)
  const [custCount,    setCustCount]    = useState('500')
  const [custSource,   setCustSource]   = useState('customer_list')
  const [custAge,      setCustAge]      = useState('25-35')
  const [custGender,   setCustGender]   = useState('60% wanita, 40% pria')
  const [custAOV,      setCustAOV]      = useState('150000')
  const [csvFile,      setCsvFile]      = useState<File|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Retarget state
  const [rtLoading,     setRtLoading]     = useState(false)
  const [rtResult,      setRtResult]      = useState<any>(null)
  const [pixelMeta,     setPixelMeta]     = useState('')
  const [pixelTiktok,   setPixelTiktok]   = useState('')
  const [pixelGoogle,   setPixelGoogle]   = useState('')
  const [rtWindow,      setRtWindow]      = useState(RETARGET_STRATEGIES[0]?.window ?? 'hot')
  const [activePixelTab, setActivePixelTab] = useState<'events' | 'base' | 'guide'>('events')
  const [selPixelEvent, setSelPixelEvent]  = useState<PixelEventType>('Purchase')
  const [expandedAud,   setExpandedAud]   = useState<string|null>(null)

 

  const togglePlatform = (p:PlatformId) =>
    setPlatforms(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev,p])

  // Live overlap estimation when interests change
  const computeOverlap = useCallback(async (ids: string[]) => {
    if (ids.length < 2) { setOverlapWarning(null); return }
    try {
      const res  = await fetch('/api/audience/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'overlap', niche, selectedInterestIds: ids }),
      })
      const data = await res.json()
      if (data.overlap?.warningLevel && data.overlap.warningLevel !== 'none') {
        setOverlapWarning(`Overlap ${data.overlap.overlapPct}% — ${data.overlap.recommendation}`)
      } else {
        setOverlapWarning(null)
      }
    } catch { setOverlapWarning(null) }
  }, [niche])

  // ── Analyze interests ────────────────────────────────────────
  const analyzeInterests = useCallback(async () => {
    setIntLoading(true); setError('')
    try {
      const res  = await fetch('/api/audience/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ action:'interests', niche, platforms, productName, productDesc }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIntResult(data.interests)
      // Auto-select recommended
      if (data.interests?.recommended) {
        setSelInterests(new Set(data.interests.recommended.map((i:Interest) => i.id)))
      }
    } catch(e:any) { setError(e.message) }
    finally { setIntLoading(false) }
  }, [niche, platforms, productName, productDesc])

  // ── Build lookalike ──────────────────────────────────────────
  const buildLookalike = useCallback(async () => {
    setLalLoading(true); setError('')
    try {
      const res  = await fetch('/api/audience/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          action:'lookalike', niche, platforms, productName,
          customerData:{
            count:         parseInt(custCount)||0,
            sourceType:    custSource,
            avgAge:        custAge,
            genderSplit:   custGender,
            avgOrderValue: parseInt(custAOV)||0,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLalResult(data.lookalike)
    } catch(e:any) { setError(e.message) }
    finally { setLalLoading(false) }
  }, [niche, platforms, productName, custCount, custSource, custAge, custGender, custAOV])

  // ── Setup retargeting ────────────────────────────────────────
  const setupRetarget = useCallback(async () => {
    setRtLoading(true); setError('')
    try {
      const pixelIds: any = {}
      if (pixelMeta)    pixelIds.meta   = pixelMeta
      if (pixelTiktok)  pixelIds.tiktok = pixelTiktok
      if (pixelGoogle)  pixelIds.google = pixelGoogle
      const res  = await fetch('/api/audience/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ action:'retarget', niche, platforms, productName, pixelIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRtResult(data.retarget)
    } catch(e:any) { setError(e.message) }
    finally { setRtLoading(false) }
  }, [niche, platforms, productName, pixelMeta, pixelTiktok, pixelGoogle])

  // Shared loading state
  const isLoading = intLoading || lalLoading || rtLoading
  const currentAction = tab === 'interests' ? analyzeInterests : tab === 'lookalike' ? buildLookalike : setupRetarget
  const currentLoading = tab === 'interests' ? intLoading : tab === 'lookalike' ? lalLoading : rtLoading
  const currentResult  = tab === 'interests' ? intResult  : tab === 'lookalike' ? lalResult  : rtResult

  // All interests for current niche+platform (for browser)
  const browseInterests = platforms.flatMap(p =>
    (INTEREST_TAXONOMY[niche] ?? INTEREST_TAXONOMY.general).filter(i => i.platform.includes(p))
  )
  const uniqueInterests = Array.from(new Map(browseInterests.map(i=>[i.id,i])).values())
  // A/B Testing
  const [abMode, setAbMode] = useState(false)
  const [abStacks, setAbStacks] = useState([
  { name: 'Stack A', interests: [] as string[] },
  { name: 'Stack B', interests: [] as string[] },
])
const [abActiveStack, setAbActiveStack] = useState(0)

// Customer interests
const [custInterests, setCustInterests] = useState('')

// Hash guide
const [showHashGuide, setShowHashGuide] = useState(false)


  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* ── Top bar ──────────────────────────────────── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'11px 20px', display:'flex', alignItems:'center', gap:'14px', position:'sticky', top:0, zIndex:100, boxShadow:C.sh }}>
        <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:'5px', color:C.inkMuted, textDecoration:'none', fontSize:'13px' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.ink}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.inkMuted}>
          <ArrowLeft size={15}/> Dashboard
        </Link>
        <div style={{ width:'1px', height:'16px', background:C.border }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:C.purpleLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🎯</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>Audience Targeting Intelligence</div>
            <div style={{ fontSize:'10px', color:C.inkMuted }}>Lookalike · Interest Mapping · Retargeting Setup</div>
          </div>
        </div>
        <div style={{ marginLeft:'auto', padding:'3px 10px', borderRadius:'6px', background:C.purpleLt, border:`1px solid ${C.purple}25`, fontSize:'11px', fontWeight:600, color:C.purple }}>Pro+</div>
      </div>

      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'24px 20px' }}>

        {/* ── Shared config ────────────────────────────── */}
        <Card style={{ marginBottom:'20px' }}>
          <CardH icon="⚙️" title="Konfigurasi Produk & Platform" sub="Berlaku untuk semua modul di bawah"/>
          <div style={{ padding:'16px 18px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'12px', alignItems:'end', flexWrap:'wrap' }} className="config-grid">
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'5px' }}>Nama Produk</label>
                <input value={productName} onChange={e=>setProductName(e.target.value)} placeholder="Contoh: Serum Vitamin C 30ml"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:C.white }}
                  onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                  onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'5px' }}>Deskripsi Singkat</label>
                <input value={productDesc} onChange={e=>setProductDesc(e.target.value)} placeholder="Benefit utama produk..."
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:C.white }}
                  onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                  onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
              </div>
              {/* Run button */}
              <button type="button" onClick={currentAction} disabled={currentLoading}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:currentLoading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:C.sa, whiteSpace:'nowrap', opacity:currentLoading?.7:1 }}>
                {currentLoading ? <Loader2 size={14} style={{ animation:'spin .8s linear infinite' }}/> : <Sparkles size={14}/>}
                {currentLoading ? 'Analyzing...' : 'Analyze AI'}
              </button>
            </div>

            {/* Niche + Platform */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginTop:'14px' }}>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Niche Produk</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {NICHES.map(n => <Pill key={n.id} label={`${n.icon} ${n.l}`} selected={niche===n.id} onClick={()=>setNiche(n.id)} color={C.purple}/>)}
                </div>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Platform</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {PLATFORMS.map(p => (
                    <div key={p.id} onClick={() => togglePlatform(p.id)}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'9px', border:`1.5px solid ${platforms.includes(p.id)?p.color:C.border}`, background:platforms.includes(p.id)?`${p.color}10`:C.surface, cursor:'pointer', transition:'all .15s', fontSize:'12px', fontWeight:platforms.includes(p.id)?700:500, color:platforms.includes(p.id)?p.color:C.inkMuted }}>
                      {p.icon} {p.l}
                      {platforms.includes(p.id) && <CheckCircle2 size={13} color={p.color}/>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div style={{ padding:'12px 14px', background:C.redLt, border:`1px solid ${C.red}30`, borderRadius:'10px', marginBottom:'16px', display:'flex', gap:'8px', alignItems:'center', fontSize:'12px', color:C.red }}>
            <AlertCircle size={14}/> {error}
          </div>
        )}

        {/* ── Module tabs ──────────────────────────────── */}
        <div style={{ display:'flex', gap:'5px', marginBottom:'20px' }}>
          {[
            { id:'interests' as Tab, l:'🎯 Interest Mapping',   badge:'AI Reco' },
            { id:'lookalike' as Tab, l:'👥 Lookalike Builder',  badge:'Customer Data' },
            { id:'retarget'  as Tab, l:'🔁 Retargeting Setup',  badge:'Pixel Code' },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setError('') }}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'99px', border:`1.5px solid ${tab===t.id?C.amber:C.border}`, background:tab===t.id?C.amberXlt:C.surface, fontSize:'12px', fontWeight:tab===t.id?700:500, color:tab===t.id?C.amberDk:C.inkMuted, cursor:'pointer', transition:'all .15s', fontFamily:'inherit', boxShadow:tab===t.id?C.sa:C.sh, flexShrink:0 }}>
              {t.l}
              {tab===t.id && <span style={{ fontSize:'9px', fontWeight:800, padding:'1px 6px', borderRadius:'99px', background:`${C.amber}30` }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            TAB 1: INTEREST MAPPING
        ══════════════════════════════════════════════ */}
        {tab === 'interests' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Loading */}
            {intLoading && (
              <Card style={{ padding:'40px', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
                <Loader2 size={32} color={C.amber} style={{ animation:'spin .9s linear infinite' }}/>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:700, color:C.ink }}>AI menganalisa interest terbaik...</div>
                  <div style={{ fontSize:'11px', color:C.inkMuted, marginTop:'3px' }}>Memetakan {uniqueInterests.length} interest untuk niche {niche}</div>
                </div>
              </Card>
            )}

            {/* AI Results */}
            {intResult && !intLoading && (
              <>
                {/* Strategy */}
                <Card>
                  <CardH icon="🧠" title="AI Interest Strategy" sub="Analisis dan rekomendasi targeting" badge={`${intResult.recommended?.length ?? 0} rekomendasi`} color={C.green}/>
                  <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:'8px' }}>
                    {intResult.strategy && <Insight text={intResult.strategy} color={C.green}/>}
                    {intResult.stackingTip && <Insight text={`💡 ${intResult.stackingTip}`} color={C.blue}/>}
                    {intResult.sizeWarning && <Insight text={`⚠️ ${intResult.sizeWarning}`} color={C.orange}/>}
                    {intResult.abTestSuggestion && <Insight text={`🔬 ${intResult.abTestSuggestion}`} color={C.purple}/>}

                    {/* Reach estimate */}
                    {intResult.estimatedReach && (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginTop:'4px' }}>
                        {[
                          { l:'Est. Daily Reach', v:`${fmtN(intResult.estimatedReach.min)}–${fmtN(intResult.estimatedReach.max)}`, color:C.blue },
                          { l:'Expected CPM', v:`Rp${fmtN(intResult.expectedCPM)}`, color:C.purple },
                          { l:'Interests Dipilih', v:`${selInterests.size} interest`, color:C.amber },
                        ].map((s,i) => (
                          <div key={i} style={{ padding:'11px', borderRadius:'10px', background:C.bg, border:`1px solid ${C.border}`, textAlign:'center' }}>
                            <div style={{ fontSize:'16px', fontWeight:800, color:s.color, marginBottom:'2px' }}>{s.v}</div>
                            <div style={{ fontSize:'10px', color:C.inkDim }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Export selected */}
                {selInterests.size > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <div style={{ padding:'12px 16px', borderRadius:'12px', background:C.amberXlt, border:`1px solid ${C.amber}30`, display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'12px', fontWeight:700, color:C.amberDk, flex:1 }}>
                        ✅ {selInterests.size} interest dipilih
                        {abMode && <span style={{ marginLeft:'8px', fontSize:'10px', fontWeight:600, color:C.purple }}>A/B Stack Mode ON</span>}
                      </span>
                      <button type="button" onClick={() => setAbMode(p=>!p)}
                        style={{ padding:'5px 11px', borderRadius:'8px', border:`1px solid ${abMode?C.purple:C.border}`, background:abMode?C.purpleLt:C.surface, color:abMode?C.purple:C.inkMuted, fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        {abMode ? '✓ A/B Mode' : '+ A/B Test'}
                      </button>
                      <button type="button" onClick={() => {
                        const rows = uniqueInterests.filter(i => selInterests.has(i.id))
                        const csv = ['Interest,Audience Min,Audience Max,Affinity,Competition,Platform']
                          .concat(rows.map(i => `"${i.name}",${i.audienceSize.min},${i.audienceSize.max},${i.affinity},${i.competition},"${i.platform.join('/')}""`))
                          .join('\n')
                        const blob = new Blob([csv], { type:'text/csv' })
                        const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
                        a.download=`beesell-interests-${niche}-${Date.now()}.csv`; a.click()
                      }}
                        style={{ padding:'5px 11px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'4px' }}>
                        ⬇ CSV Export
                      </button>
                      <CopyBtn text={
                        uniqueInterests.filter(i => selInterests.has(i.id)).map(i => i.name).join('\n')
                      } label="Salin Semua"/>
                      <Link href="/campaign" style={{ padding:'6px 12px', borderRadius:'8px', background:C.amber, color:'#fff', fontSize:'12px', fontWeight:700, textDecoration:'none' }}>
                        Pakai di Campaign →
                      </Link>
                    </div>
                    {/* A/B Stack builder */}
                    {abMode && (
                      <div style={{ padding:'13px 16px', borderRadius:'12px', background:C.purpleLt, border:`1px solid ${C.purple}25` }}>
                        <div style={{ fontSize:'12px', fontWeight:700, color:C.purple, marginBottom:'10px' }}>🔬 A/B Interest Stack Builder</div>
                        <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
                          {abStacks.map((stack, i) => (
                            <button key={i} type="button" onClick={() => setAbActiveStack(i)}
                              style={{ padding:'5px 13px', borderRadius:'7px', border:`1.5px solid ${abActiveStack===i?C.purple:C.border}`, background:abActiveStack===i?`${C.purple}15`:C.surface, color:abActiveStack===i?C.purple:C.inkMuted, fontSize:'11px', fontWeight:abActiveStack===i?700:500, cursor:'pointer', fontFamily:'inherit' }}>
                              {stack.name} ({stack.interests.length})
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize:'11px', color:C.inkMuted, marginBottom:'8px' }}>
                          Klik interest di bawah untuk tambahkan ke <strong>{abStacks[abActiveStack].name}</strong>
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
                          {uniqueInterests.filter(i => selInterests.has(i.id)).map(i => {
                            const inStack = abStacks[abActiveStack].interests.includes(i.id)
                            return (
                              <button key={i.id} type="button" onClick={() => {
                                setAbStacks(prev => prev.map((s, idx) => idx === abActiveStack
                                  ? { ...s, interests: inStack ? s.interests.filter(x=>x!==i.id) : [...s.interests, i.id] }
                                  : s
                                ))
                              }}
                                style={{ padding:'4px 10px', borderRadius:'6px', border:`1px solid ${inStack?C.purple:C.border}`, background:inStack?`${C.purple}12`:C.surface, color:inStack?C.purple:C.inkMuted, fontSize:'11px', fontWeight:inStack?700:400, cursor:'pointer', fontFamily:'inherit' }}>
                                {inStack ? '✓ ' : '+ '}{i.name}
                              </button>
                            )
                          })}
                        </div>
                        {abStacks.every(s => s.interests.length > 0) && (
                          <div style={{ padding:'10px 12px', borderRadius:'9px', background:C.surface, border:`1px solid ${C.purple}20`, fontSize:'11px', color:C.inkSub }}>
                            <strong style={{ color:C.purple }}>Summary A/B:</strong><br/>
                            {abStacks.map(s => `${s.name}: ${uniqueInterests.filter(i=>s.interests.includes(i.id)).map(i=>i.name).join(', ')}`).join(' | ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Overlap warning */}
            {overlapWarning && (
              <div style={{ padding:'10px 14px', borderRadius:'10px', background:C.orangeLt, border:`1px solid ${C.orange}30`, display:'flex', gap:'8px', alignItems:'center', fontSize:'12px', color:C.orange }}>
                <span>⚠️</span> <span style={{ fontWeight:600 }}>Overlap Audience:</span> {overlapWarning}
              </div>
            )}

            {/* Interest browser */}
            <Card>
              <CardH icon="📚" title="Interest Taxonomy Browser" sub={`${uniqueInterests.length} interest tersedia untuk niche ${niche}`} badge="Click to select"/>
              <div style={{ padding:'14px 18px' }}>
                {uniqueInterests.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'28px', color:C.inkMuted, fontSize:'13px' }}>
                    Pilih niche dan platform di atas untuk melihat interest yang tersedia.
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'9px' }}>
                    {uniqueInterests.map(interest => (
                      <InterestCard
                        key={interest.id}
                        interest={interest}
                        selected={selInterests.has(interest.id)}
                        onToggle={() => setSelInterests(p => { const s=new Set(p); s.has(interest.id)?s.delete(interest.id):s.add(interest.id); computeOverlap([...s]); return s })}
                        isRecommended={intResult?.recommended?.some((r:Interest) => r.id === interest.id)}
                        isAvoid={intResult?.avoid?.some((r:Interest) => r.id === interest.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 2: LOOKALIKE BUILDER
        ══════════════════════════════════════════════ */}
        {tab === 'lookalike' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:'16px' }} className="lal-grid">
              {/* Input form */}
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <Card>
                  <CardH icon="👥" title="Data Customer" sub="Sumber data untuk buat Lookalike Audience"/>
                  <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                    {/* Source type */}
                    <div>
                      <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Tipe Sumber Data</label>
                      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                        {SOURCE_TYPES.map(s => (
                          <div key={s.id} onClick={() => setCustSource(s.id)}
                            style={{ display:'flex', gap:'10px', alignItems:'center', padding:'9px 11px', borderRadius:'10px', border:`1.5px solid ${custSource===s.id?C.amber:C.border}`, background:custSource===s.id?C.amberXlt:C.surface, cursor:'pointer', transition:'all .15s' }}>
                            <span style={{ fontSize:'18px' }}>{s.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'12px', fontWeight:600, color:custSource===s.id?C.amberDk:C.ink }}>{s.l}</div>
                              <div style={{ fontSize:'10px', color:C.inkMuted }}>{s.desc}</div>
                            </div>
                            {custSource===s.id && <CheckCircle2 size={14} color={C.amber}/>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer stats */}
                    {[
                      { label:'Jumlah Data', val:custCount, set:setCustCount, placeholder:'Contoh: 1500 (ideal min 1000)', hint:'Min 100, optimal 1000+' },
                      { label:'Rentang Usia Dominan', val:custAge, set:setCustAge, placeholder:'Contoh: 25-35' },
                      { label:'Gender Split', val:custGender, set:setCustGender, placeholder:'Contoh: 60% wanita, 40% pria' },
                      { label:'Average Order Value (IDR)', val:custAOV, set:setCustAOV, placeholder:'Contoh: 150000' },
                    ].map(f => (
                      <div key={f.label}>
                        <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'4px' }}>{f.label}</label>
                        <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder}
                          style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:C.white }}
                          onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                          onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                        {f.hint && <div style={{ fontSize:'10px', color:C.inkDim, marginTop:'3px' }}>{f.hint}</div>}
                      </div>
                    ))}

                    {/* CSV upload (meta) */}
                    {custSource === 'customer_list' && (
                      <div>
                        <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'5px' }}>Upload CSV (Opsional)</label>
                        {csvFile ? (
                          <div style={{ display:'flex', gap:'8px', alignItems:'center', padding:'8px 11px', borderRadius:'9px', border:`1px solid ${C.green}30`, background:C.greenLt }}>
                            <span style={{ fontSize:'12px', color:C.green, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{csvFile.name}</span>
                            <button onClick={() => setCsvFile(null)} style={{ background:'none', border:'none', cursor:'pointer', color:C.inkDim }}><X size={13}/></button>
                          </div>
                        ) : (
                          <div onClick={() => fileRef.current?.click()}
                            style={{ borderRadius:'9px', border:`2px dashed ${C.border}`, background:C.bg, cursor:'pointer', padding:'14px', textAlign:'center', transition:'border-color .15s' }}
                            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=C.amber}
                            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.border}>
                            <Upload size={18} color={C.inkDim} style={{ margin:'0 auto 6px', display:'block' }}/>
                            <div style={{ fontSize:'11px', color:C.inkMuted }}>Upload CSV dengan kolom: email, phone (Meta akan hash otomatis)</div>
                          </div>
                        )}
                        <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => setCsvFile(e.target.files?.[0] ?? null)}/>
                      </div>
                    )}

                    {/* Customer top interests */}
                    <div>
                      <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'4px' }}>Top Interest Customer (Opsional)</label>
                      <input value={custInterests} onChange={e=>setCustInterests(e.target.value)} placeholder="Contoh: fashion, skincare, belanja online"
                        style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:C.white }}
                        onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                        onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                      <div style={{ fontSize:'10px', color:C.inkDim, marginTop:'3px' }}>Membantu AI membuat lookalike yang lebih akurat</div>
                    </div>

                    {/* Hashing guide toggle */}
                    <button type="button" onClick={() => setShowHashGuide(p=>!p)}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 12px', borderRadius:'9px', border:`1px solid ${C.border}`, background:C.bg, color:C.inkMuted, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', width:'100%' }}>
                      🔒 Cara hashing data customer sebelum upload
                      {showHashGuide ? <ChevronUp size={13} style={{ marginLeft:'auto' }}/> : <ChevronDown size={13} style={{ marginLeft:'auto' }}/>}
                    </button>
                    {showHashGuide && (
                      <div style={{ padding:'12px 14px', borderRadius:'10px', background:'#111827', border:`1px solid #374151` }}>
                        <div style={{ fontSize:'11px', fontWeight:700, color:'#F9FAFB', marginBottom:'8px' }}>🔐 Hash Customer Data (SHA-256) — Wajib sebelum upload ke Meta</div>
                        <pre style={{ margin:0, fontSize:'10px', color:'#9CA3AF', fontFamily:'monospace', lineHeight:1.7, overflowX:'auto' }}>{`// Node.js — hash email customer sebelum upload
const crypto = require('crypto')

function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex')
}

// Process CSV
const rows = customers.map(c => ({
  email: hashEmail(c.email),
  phone: hashEmail(c.phone.replace(/\D/g, ''))
}))

// Output: CSV dengan kolom email,phone (sudah di-hash)
// Meta akan match dengan data hashed mereka sendiri`}</pre>
                        <div style={{ marginTop:'8px', fontSize:'10px', color:'#6B7280', lineHeight:1.5 }}>
                          ✅ Meta menerima SHA-256 hash · ✅ Data asli tidak pernah dikirim ke Meta · ✅ GDPR & privacy compliant
                        </div>
                      </div>
                    )}

                    {/* Seed quality indicator */}
                    <div style={{ padding:'10px 12px', borderRadius:'9px', background:parseInt(custCount) >= 1000 ? C.greenLt : parseInt(custCount) >= 500 ? C.amberXlt : C.redLt, border:`1px solid ${parseInt(custCount) >= 1000 ? C.green : parseInt(custCount) >= 500 ? C.amber : C.red}30` }}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:parseInt(custCount) >= 1000 ? C.green : parseInt(custCount) >= 500 ? C.amberDk : C.red }}>
                        {parseInt(custCount) >= 1000 ? '✅ Seed size optimal (1000+)' : parseInt(custCount) >= 500 ? '⚠️ Seed size cukup (500–999)' : '❌ Seed size terlalu kecil (<500)'}
                      </div>
                      <div style={{ fontSize:'10px', color:C.inkMuted, marginTop:'2px' }}>
                        {parseInt(custCount) >= 1000 ? 'Lookalike akan sangat akurat' : 'Tingkatkan ke 1000+ untuk hasil terbaik'}
                      </div>
                    </div>

                    <button type="button" onClick={buildLookalike} disabled={lalLoading}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'12px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:lalLoading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:C.sa, opacity:lalLoading?.7:1 }}>
                      {lalLoading ? <Loader2 size={14} style={{ animation:'spin .8s linear infinite' }}/> : <Sparkles size={14}/>}
                      {lalLoading ? 'Generating...' : 'Build Lookalike Audience'}
                    </button>
                  </div>
                </Card>
              </div>

              {/* LAL Results */}
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {lalLoading && (
                  <Card style={{ padding:'40px', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
                    <Loader2 size={32} color={C.amber} style={{ animation:'spin .9s linear infinite' }}/>
                    <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>AI menganalisa customer data...</div>
                  </Card>
                )}

                {!lalLoading && !lalResult && (
                  <Card style={{ padding:'40px', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px', textAlign:'center' }}>
                    <span style={{ fontSize:'48px' }}>👥</span>
                    <div style={{ fontSize:'14px', fontWeight:700, color:C.ink }}>Lookalike Builder Siap</div>
                    <div style={{ fontSize:'12px', color:C.inkMuted, maxWidth:'320px', lineHeight:1.6 }}>
                      Isi data customer di kiri dan klik "Build" — AI akan generate lookalike audience yang optimal berdasarkan profil customer kamu.
                    </div>
                  </Card>
                )}

                {lalResult && !lalLoading && (
                  <>
                    {/* Audience cards */}
                    <Card>
                      <CardH icon="🎯" title="Lookalike Audiences" sub="Sorted by similarity score — mulai dari yang paling mirip" badge={`${lalResult.audiences?.length ?? 0} audience`} color={C.green}/>
                      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                        {(lalResult.audiences ?? []).map((aud:LookalikeAudience, i:number) => (
                          <div key={aud.id} style={{ padding:'14px 16px', borderRadius:'12px', border:`1.5px solid ${i===0?C.green+'40':C.border}`, background:i===0?C.greenLt:C.surface, boxShadow:i===0?`0 0 0 1px ${C.green}15`:C.sh }}>
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px' }}>
                              <div>
                                {i===0 && <div style={{ fontSize:'9px', fontWeight:800, padding:'1px 6px', borderRadius:'4px', background:C.green, color:'#fff', marginBottom:'5px', display:'inline-block' }}>🏆 MOST SIMILAR</div>}
                                <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>{aud.name}</div>
                                <div style={{ fontSize:'10px', color:C.inkMuted, marginTop:'2px' }}>{aud.country} · Seed: {aud.sourceType.replace('_',' ')}</div>
                              </div>
                              <div style={{ textAlign:'right', flexShrink:0 }}>
                                <div style={{ fontSize:'20px', fontWeight:900, color:C.green }}>{aud.size}%</div>
                                <div style={{ fontSize:'9px', color:C.inkDim }}>populasi</div>
                              </div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', fontSize:'11px' }}>
                              <div>
                                <div style={{ color:C.inkDim }}>Est. Reach</div>
                                <div style={{ fontWeight:700, color:C.blue }}>{fmtN(aud.estimatedReach.min)}–{fmtN(aud.estimatedReach.max)}</div>
                              </div>
                              <div>
                                <div style={{ color:C.inkDim }}>Similarity</div>
                                <div style={{ fontWeight:700, color:C.green }}>{aud.similarity}/100</div>
                              </div>
                              <div>
                                <div style={{ color:C.inkDim }}>Platform</div>
                                <div style={{ fontWeight:700 }}>{PLATFORMS.find(p=>p.id===aud.platform)?.icon} {aud.platform}</div>
                              </div>
                              <div>
                                <div style={{ color:C.inkDim }}>Exclude Source</div>
                                <div style={{ fontWeight:700, color:C.green }}>{aud.excludeSource ? '✅ Ya' : '❌ Tidak'}</div>
                              </div>
                            </div>
                            {/* Similarity bar */}
                            <div style={{ marginTop:'10px' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:C.inkDim, marginBottom:'3px' }}>
                                <span>Similarity score</span><span>{aud.similarity}%</span>
                              </div>
                              <div style={{ height:'5px', background:C.border, borderRadius:'3px', overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${aud.similarity}%`, background:`linear-gradient(90deg,${C.green}80,${C.green})`, borderRadius:'3px', transition:'width .6s' }}/>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* AI Insights */}
                    {lalResult.insights?.length > 0 && (
                      <Card>
                        <CardH icon="💡" title="AI Insights" sub="Rekomendasi berdasarkan profil customer"/>
                        <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'7px' }}>
                          {lalResult.insights.map((insight:string, i:number) => (
                            <Insight key={i} text={insight} color={i===0?C.green:C.blue}/>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Upload instructions */}
                    {lalResult.uploadInstructions && (
                      <Card>
                        <CardH icon="📤" title="Cara Upload ke Meta Ads Manager" sub="Step-by-step instruksi"/>
                        <div style={{ padding:'14px 16px', fontSize:'12px', color:C.inkSub, lineHeight:1.7, whiteSpace:'pre-line' }}>
                          {lalResult.uploadInstructions}
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 3: RETARGETING SETUP
        ══════════════════════════════════════════════ */}
        {tab === 'retarget' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Pixel ID input */}
            <Card>
              <CardH icon="⚡" title="Pixel IDs" sub="Masukkan Pixel ID per platform (opsional — untuk generate kode yang dipersonalisasi)"/>
              <div style={{ padding:'14px 18px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {[
                  { id:'meta', l:'Meta Pixel ID', placeholder:'Contoh: 1234567890123456', val:pixelMeta, set:setPixelMeta, color:C.meta },
                  { id:'tiktok', l:'TikTok Pixel ID', placeholder:'Contoh: CXXXXXXXXXXXXXXXX', val:pixelTiktok, set:setPixelTiktok, color:C.tiktok },
                  { id:'google', l:'Google Tag ID', placeholder:'Contoh: GT-XXXXXXX', val:pixelGoogle, set:setPixelGoogle, color:C.google },
                ].map(f => (
                  <div key={f.id}>
                    <label style={{ fontSize:'11px', fontWeight:700, color:f.color, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'5px' }}>{f.l}</label>
                    <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${f.color}30`, fontSize:'12px', fontFamily:'monospace', outline:'none', boxSizing:'border-box', background:C.white }}
                      onFocus={e=>(e.target as HTMLElement).style.borderColor=f.color}
                      onBlur={e=>(e.target as HTMLElement).style.borderColor=`${f.color}30`}/>
                  </div>
                ))}
              </div>
              <div style={{ padding:'0 18px 14px' }}>
                <button type="button" onClick={setupRetarget} disabled={rtLoading}
                  style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:rtLoading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:C.sa, opacity:rtLoading?.7:1 }}>
                  {rtLoading ? <Loader2 size={14} style={{ animation:'spin .8s linear infinite' }}/> : <Sparkles size={14}/>}
                  {rtLoading ? 'Generating...' : 'Generate Retargeting Setup'}
                </button>
              </div>
            </Card>

            {rtLoading && (
              <Card style={{ padding:'40px', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
                <Loader2 size={32} color={C.amber} style={{ animation:'spin .9s linear infinite' }}/>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>AI mengkonfigurasi retargeting setup...</div>
              </Card>
            )}

            {!rtLoading && !rtResult && (
              <Card style={{ padding:'40px', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px', textAlign:'center' }}>
                <span style={{ fontSize:'48px' }}>🔁</span>
                <div style={{ fontSize:'14px', fontWeight:700, color:C.ink }}>Retargeting Setup Siap</div>
                <div style={{ fontSize:'12px', color:C.inkMuted, maxWidth:'360px', lineHeight:1.6 }}>
                  Masukkan Pixel ID (opsional), pilih platform, dan klik Generate — AI akan buat audience retargeting + pixel code siap pakai.
                </div>
              </Card>
            )}

            {rtResult && !rtLoading && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }} className="rt-grid">
                {/* Left: Audiences */}
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <Card>
                    <CardH icon="👥" title="Retargeting Audiences" sub="Sorted by intent (hot→warm→cold)" badge={`${rtResult.audiences?.length ?? 0} audience`}/>
                    <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                      {(rtResult.audiences ?? []).map((aud:RetargetAudience) => {
                        const pc  = PRIORITY_COLORS[aud.priority]
                        const exp = expandedAud === aud.id
                        return (
                          <div key={aud.id} style={{ borderRadius:'12px', border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:C.sh }}>
                            <div onClick={() => setExpandedAud(exp ? null : aud.id)}
                              style={{ padding:'11px 13px', display:'flex', gap:'10px', alignItems:'center', cursor:'pointer', background:exp?C.bg:C.surface }}>
                              <div style={{ padding:'3px 8px', borderRadius:'6px', background:pc.bg, color:pc.text, fontSize:'10px', fontWeight:800, flexShrink:0 }}>
                                {pc.icon} {aud.priority.toUpperCase()}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{aud.name}</div>
                                <div style={{ fontSize:'10px', color:C.inkMuted }}>{fmtN(aud.estimatedSize.min)}–{fmtN(aud.estimatedSize.max)} est. size · {aud.windowDays}h window</div>
                              </div>
                              {exp ? <ChevronUp size={14} color={C.inkMuted}/> : <ChevronDown size={14} color={C.inkMuted}/>}
                            </div>
                            {exp && (
                              <div style={{ padding:'11px 13px', borderTop:`1px solid ${C.border}`, background:C.bg }}>
                                <div style={{ fontSize:'12px', color:C.inkSub, marginBottom:'10px', lineHeight:1.5 }}>{aud.description}</div>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', fontSize:'11px', marginBottom:'10px' }}>
                                  <div><span style={{ color:C.inkDim }}>Window: </span><strong>{aud.windowDays} hari</strong></div>
                                  <div><span style={{ color:C.inkDim }}>Platform: </span><strong>{PLATFORMS.find(p=>p.id===aud.platform)?.icon} {aud.platform}</strong></div>
                                  <div><span style={{ color:C.inkDim }}>Tipe: </span><strong style={{ textTransform:'capitalize' }}>{aud.type.replace('_',' ')}</strong></div>
                                  <div><span style={{ color:C.inkDim }}>Bid: </span><strong style={{ color:aud.recommendedBid==='high'?C.red:aud.recommendedBid==='medium'?C.orange:C.green, textTransform:'capitalize' }}>{aud.recommendedBid}</strong></div>
                                </div>
                                {aud.filters && aud.filters.length > 0 && (
                                  <div style={{ padding:'8px 10px', borderRadius:'8px', background:C.surface, border:`1px solid ${C.border}`, fontSize:'11px', fontFamily:'monospace', color:C.inkSub }}>
                                    {aud.filters.map((f, i) => (
                                      <div key={i}>{f.field} {f.operator} {f.value}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* Funnel strategy */}
                  {rtResult.funnelStrategy?.length > 0 && (
                    <Card>
                      <CardH icon="🔽" title="Retargeting Funnel Strategy" sub="5 langkah implementasi" color={C.blue}/>
                      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'7px' }}>
                        {rtResult.funnelStrategy.map((step:string, i:number) => (
                          <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'10px 12px', borderRadius:'10px', background:i===0?C.amberXlt:C.bg, border:`1px solid ${i===0?C.amber+'30':C.border}` }}>
                            <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:i===0?`linear-gradient(135deg,${C.amber},${C.amberDk})`:`${C.amber}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:i===0?'#fff':C.amberDk, flexShrink:0 }}>{i+1}</div>
                            <div style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.55 }}>{step}</div>
                          </div>
                        ))}
                        {rtResult.implementationTip && (
                          <Insight text={`💡 ${rtResult.implementationTip}`} color={C.teal}/>
                        )}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Right: Pixel code */}
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {/* Event selector */}
                  <Card>
                    <CardH icon="⚡" title="Pixel Event Code" sub="Kode implementasi siap pakai per event"/>
                    <div style={{ padding:'14px 16px' }}>
                      {/* Retargeting window funnel visualizer */}
                      <div style={{ marginBottom:'14px', padding:'12px 14px', borderRadius:'11px', background:C.bg, border:`1px solid ${C.border}` }}>
                        <div style={{ fontSize:'11px', fontWeight:700, color:C.ink, marginBottom:'9px' }}>🔽 Retargeting Window — Pilih Intent Level</div>
                        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' }}>
                          {RETARGET_STRATEGIES.map(s => {
                            const pc = s.priority === 'hot' ? C.red : s.priority === 'warm' ? C.orange : C.blue
                            return (
                              <button key={s.window} type="button" onClick={() => setRtWindow(s.window)}
                                style={{ padding:'4px 11px', borderRadius:'7px', border:`1.5px solid ${rtWindow===s.window?pc:C.border}`, background:rtWindow===s.window?`${pc}10`:C.surface, color:rtWindow===s.window?pc:C.inkMuted, fontSize:'11px', fontWeight:rtWindow===s.window?700:500, cursor:'pointer', fontFamily:'inherit' }}>
                                {s.label}
                              </button>
                            )
                          })}
                        </div>
                        {(() => {
                          const s = RETARGET_STRATEGIES.find(x => x.window === rtWindow)!
                          const pc = s.priority === 'hot' ? C.red : s.priority === 'warm' ? C.orange : C.blue
                          return (
                            <div style={{ padding:'9px 11px', borderRadius:'9px', background:`${pc}08`, border:`1px solid ${pc}25`, fontSize:'11px', color:C.inkSub, lineHeight:1.5 }}>
                              <span style={{ fontWeight:700, color:pc }}>{s.priority === 'hot' ? '🔥 Hot' : s.priority === 'warm' ? '♨️ Warm' : '❄️ Cold'} — {s.label}:</span>{' '}{s.desc}
                              {' '}<span style={{ padding:'2px 7px', borderRadius:'5px', background:`${pc}18`, color:pc, fontSize:'10px', fontWeight:700 }}>Bid rekomendasi: {s.bid}</span>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Pixel tab switcher */}
                      <div style={{ display:'flex', gap:'4px', marginBottom:'12px', background:C.bg, padding:'3px', borderRadius:'9px', border:`1px solid ${C.border}` }}>
                        {([['events','⚡ Event Code'],['base','📜 Base Script'],['guide','📋 Setup Guide']] as const).map(([id,l]) => (
                          <button key={id} type="button" onClick={() => setActivePixelTab(id as any)}
                            style={{ flex:1, padding:'6px', borderRadius:'7px', border:'none', background:activePixelTab===id?C.surface:'transparent', fontSize:'11px', fontWeight:activePixelTab===id?700:500, color:activePixelTab===id?C.ink:C.inkMuted, cursor:'pointer', boxShadow:activePixelTab===id?C.sh:'none', fontFamily:'inherit' }}>
                            {l}
                          </button>
                        ))}
                      </div>

                      {activePixelTab === 'guide' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'12px' }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'4px' }}>📋 Pixel Implementation Checklist</div>
                          {[
                            ['✅ Pasang base pixel di semua halaman (<head>)', true],
                            ['✅ Fire ViewContent di halaman produk', true],
                            ['✅ Fire AddToCart saat klik keranjang', true],
                            ['✅ Fire Purchase di halaman thank you / confirmation', true],
                            ['⚠️ Test dengan Facebook Pixel Helper (Chrome Extension)', false],
                            ['⚠️ Verifikasi domain di Business Manager', false],
                            ['⚠️ Aktifkan Conversions API untuk iOS 14+ tracking', false],
                          ].map(([step, done], i) => (
                            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'center', padding:'8px 11px', borderRadius:'8px', background:C.bg, border:`1px solid ${C.border}`, fontSize:'12px', color:C.inkSub }}>
                              {step}
                            </div>
                          ))}
                        </div>
                      )}

                      {activePixelTab === 'base' && (
                        <div style={{ fontSize:'11px', color:C.inkMuted, marginBottom:'8px' }}>
                          Pasang kode di bawah di dalam <code style={{ background:C.bg, padding:'1px 5px', borderRadius:'4px', fontFamily:'monospace' }}>&lt;head&gt;</code> setiap halaman — cukup sekali.
                        </div>
                      )}

                      {activePixelTab === 'events' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                          <div style={{ marginBottom:'12px' }}>
                            <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Pilih Event</label>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                              {(Object.keys(PIXEL_EVENTS) as PixelEventType[]).map(ev => {
                                const evData = PIXEL_EVENTS[ev]
                                const funnelColor = evData.funnelStage === 'conversion' ? C.green : evData.funnelStage === 'consideration' ? C.amber : C.blue
                                return (
                                  <button key={ev} type="button" onClick={() => setSelPixelEvent(ev)}
                                    style={{ padding:'4px 10px', borderRadius:'7px', border:`1.5px solid ${selPixelEvent===ev?funnelColor:C.border}`, background:selPixelEvent===ev?`${funnelColor}12`:C.surface, fontSize:'11px', fontWeight:selPixelEvent===ev?700:500, color:selPixelEvent===ev?funnelColor:C.inkMuted, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                                    {ev}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Event info */}
                          {selPixelEvent && (() => {
                            const ev = PIXEL_EVENTS[selPixelEvent]
                            const fColor = ev.funnelStage==='conversion'?C.green:ev.funnelStage==='consideration'?C.amber:C.blue
                            return (
                              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                                <div style={{ padding:'10px 12px', borderRadius:'10px', background:`${fColor}08`, border:`1px solid ${fColor}25` }}>
                                  <div style={{ fontSize:'12px', fontWeight:700, color:fColor, marginBottom:'2px' }}>{ev.event}</div>
                                  <div style={{ fontSize:'11px', color:C.inkSub, marginBottom:'4px' }}>{ev.description}</div>
                                  <div style={{ fontSize:'10px', color:C.inkDim }}>📌 Fire: {ev.whenToFire}</div>
                                </div>

                                {/* Meta code */}
                                {platforms.includes('meta') && (
                                  <div>
                                    <div style={{ fontSize:'11px', fontWeight:700, color:C.meta, marginBottom:'5px' }}>📘 Meta Pixel (fbq)</div>
                                    <CodeBlock code={ev.metaCode} lang="javascript"/>
                                  </div>
                                )}

                                {/* TikTok code */}
                                {platforms.includes('tiktok') && (
                                  <div>
                                    <div style={{ fontSize:'11px', fontWeight:700, color:C.tiktok, marginBottom:'5px' }}>🎵 TikTok Pixel (ttq)</div>
                                    <CodeBlock code={ev.tiktokCode} lang="javascript"/>
                                  </div>
                                )}

                                {/* Google code */}
                                {platforms.includes('google') && (
                                  <div>
                                    <div style={{ fontSize:'11px', fontWeight:700, color:C.google, marginBottom:'5px' }}>🔍 Google Tag (gtag)</div>
                                    <CodeBlock code={ev.gaCode} lang="javascript"/>
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      )} 
                    </div>
                  </Card>

                  {/* Base pixel scripts — shown in 'base' tab only */}
                  {(activePixelTab === 'base' || activePixelTab === 'guide') && (
                  <Card>
                    <CardH icon="📜" title="Base Pixel Script" sub="Pasang di <head> setiap halaman website"/>
                    <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                      {activePixelTab === 'base' && platforms.map(platform => {
                        const pixelId = platform === 'meta' ? (pixelMeta || 'YOUR_META_PIXEL_ID') : platform === 'tiktok' ? (pixelTiktok || 'YOUR_TIKTOK_PIXEL_ID') : (pixelGoogle || 'YOUR_GOOGLE_TAG_ID')
                        const platConf = PLATFORMS.find(p => p.id === platform)!
                        return (
                          <div key={platform}>
                            <div style={{ fontSize:'11px', fontWeight:700, color:platConf.color, marginBottom:'5px' }}>{platConf.icon} {platConf.l} — Base Script</div>
                            <CodeBlock code={BASE_PIXEL_SCRIPTS[platform](pixelId)} lang="html"/>
                          </div>
                        )
                      })}
                      {activePixelTab === 'guide' && (
                        <div style={{ padding:'11px 13px', borderRadius:'10px', background:C.amberXlt, border:`1px solid ${C.amber}30`, fontSize:'12px', color:C.amberDk, lineHeight:1.6 }}>
                          💡 <strong>Tips:</strong> Gunakan Google Tag Manager untuk manage semua pixel dari satu tempat tanpa edit kode setiap kali ada perubahan.
                        </div>
                      )}
                    </div>
                  </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
        * { box-sizing:border-box }
        @keyframes spin    { to{transform:rotate(360deg)} }
        textarea::placeholder, input::placeholder { color:#9CA3AF }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
        .config-grid { grid-template-columns:1fr 1fr auto !important }
        .lal-grid    { grid-template-columns:360px 1fr !important }
        .rt-grid     { grid-template-columns:1fr 1fr !important }
        @media (max-width:1023px) {
          .lal-grid { grid-template-columns:1fr !important }
          .rt-grid  { grid-template-columns:1fr !important }
          .config-grid { grid-template-columns:1fr !important }
        }
      `}</style>
    </div>

    
  )
  
}