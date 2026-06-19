'use client'
// app/(dashboard)/analytics/page.tsx
// ══════════════════════════════════════════════════════════════
// BEESELL ANALYTICS AI — Clean (NO DUMMY DATA)
//
// • Semua trend palsu DIHAPUS — hanya ditampilkan kalau ada
//   periode pembanding nyata (sekarang tidak ada → tidak tampil).
// • Fallback hardcoded di affiliate/marketplace/competitor DIHAPUS.
// • AI Content Score per-row hardcoded DIHAPUS.
// • Layout BeeScore card diperbaiki — tidak keluar garis.
// • Empty states di semua section yang belum punya data.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  RefreshCw, Loader2, Brain, AlertTriangle, ChevronRight,
  Info, Plus, X, Save, CheckCircle2, Sparkles,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { useUserRole } from '@/hooks/use-user-role'

// ── Tokens ────────────────────────────────────────────────────
const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5',
  blue:'#3B82F6',   blueLt:'#EFF6FF',
  purple:'#7C3AED', purpleLt:'#F5F3FF',
  red:'#EF4444',    redLt:'#FEF2F2',
  orange:'#F97316', orangeLt:'#FFF7ED',
  teal:'#0D9488',
  sh:'0 1px 3px rgba(0,0,0,.06)',
  sm:'0 4px 16px rgba(0,0,0,.07)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

type Tab    = 'overview'|'content'|'product'|'affiliate'|'marketplace'|'funnel'|'competitor'
type Period = '7d'|'30d'|'90d'

const ROUTES = {
  studio:       '/dashboard/studio',
  tiktokScript: '/dashboard/studio/video/tiktok',
  ugcVideo:     '/dashboard/studio/video/ugc',
  enhancer:     '/dashboard/studio/image/enhancer',
  billing:      '/billing',
}

// ── Format helpers ────────────────────────────────────────────
const fmtN  = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(Math.round(n))
const fmtRp = (n: number) => n >= 1e9 ? `Rp${(n/1e9).toFixed(1)}M` : n >= 1e6 ? `Rp${(n/1e6).toFixed(1)}Jt` : n >= 1000 ? `Rp${(n/1000).toFixed(0)}K` : `Rp${n}`
const fmtPct = (n: number) => `${(+n||0).toFixed(1)}%`

// ── Atoms ─────────────────────────────────────────────────────
function Sk({ w='100%', h='14px', r='6px' }: {w?:string;h?:string;r?:string}) {
  return <div style={{ width:w, height:h, borderRadius:r, background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }}/>
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:C.sh, ...style }}>{children}</div>
}

function CardHeader({ title, sub, badge, color=C.amber, icon }: { title:string; sub?:string; badge?:string; color?:string; icon?:string }) {
  return (
    <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:9 }}>
      {icon && <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
        {sub && <div style={{ fontSize:10, color:C.inkMuted, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</div>}
      </div>
      {badge && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:`${color}15`, color, flexShrink:0 }}>{badge}</span>}
    </div>
  )
}

// ── KPI Card — NO TREND palsu ─────────────────────────────────
function KpiCard({ icon, label, value, sub, color, loading }: {
  icon:string; label:string; value:string; sub:string; color:string; loading:boolean
}) {
  return (
    <Card style={{ padding:'16px 18px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
      </div>
      {loading
        ? <><Sk h="24px" w="80px" r="4px"/><div style={{marginTop:5}}><Sk h="11px" w="110px" r="3px"/></div></>
        : <>
          <div style={{ fontSize:'clamp(20px,2.5vw,26px)', fontWeight:900, color:C.ink, letterSpacing:'-0.03em', lineHeight:1, marginBottom:2 }}>{value}</div>
          <div style={{ fontSize:12, fontWeight:600, color:C.inkMuted }}>{label}</div>
          <div style={{ fontSize:10, color:C.inkDim, marginTop:2 }}>{sub}</div>
        </>}
    </Card>
  )
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:'9px 12px', boxShadow:C.sm, fontSize:12 }}>
      <div style={{ fontWeight:700, color:C.ink, marginBottom:5 }}>{label}</div>
      {payload.map((p:any, i:number) => (
        <div key={i} style={{ display:'flex', gap:6, alignItems:'center', marginBottom:2 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color }}/>
          <span style={{ color:C.inkMuted }}>{p.name}:</span>
          <strong style={{ color:C.ink }}>{p.value > 1000000 ? fmtRp(p.value) : p.value > 1000 ? fmtN(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── BeeScore Ring — kompak, tidak overflow ────────────────────
function BeeRing({ score, label, color=C.amber }: { score:number; label:string; color?:string }) {
  const r = 18, circ = 2*Math.PI*r, dash = (score/100)*circ
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:0 }}>
      <svg width="46" height="46" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="23" cy="23" r={r} fill="none" stroke={C.border} strokeWidth="4"/>
        <circle cx="23" cy="23" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray .7s ease' }}/>
      </svg>
      <div style={{ textAlign:'center', marginTop:-2 }}>
        <div style={{ fontSize:13, fontWeight:800, color:C.ink, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:9, color:C.inkMuted, marginTop:1, lineHeight:1.2 }}>{label}</div>
      </div>
    </div>
  )
}

function Insight({ text, color=C.amber, priority }: { text:string; color?:string; priority?:string }) {
  return (
    <div style={{ padding:'10px 13px', borderRadius:10, background:`${color}08`, border:`1px solid ${color}25`, display:'flex', gap:8, alignItems:'flex-start' }}>
      <Brain size={13} color={color} style={{ flexShrink:0, marginTop:1 }}/>
      <div style={{ fontSize:12, color:C.inkSub, lineHeight:1.6, flex:1 }}>{text}</div>
      {priority === 'high' && <span style={{ fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4, background:C.red, color:'#fff', flexShrink:0 }}>PRIORITAS</span>}
    </div>
  )
}

function FunnelBar({ stage, value, pct, maxVal, color, isLeak }: {
  stage:string; value:number; pct:number; maxVal:number; color:string; isLeak?:boolean
}) {
  const w = maxVal > 0 ? Math.max(4, (value/maxVal)*100) : 0
  return (
    <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:7 }}>
      <div style={{ width:110, fontSize:11, color:isLeak?C.red:C.inkMuted, flexShrink:0, textAlign:'right', fontWeight:isLeak?700:400 }}>{stage}</div>
      <div style={{ flex:1, height:34, background:C.bg, borderRadius:9, overflow:'hidden', position:'relative', border:`1px solid ${isLeak?C.red+'30':C.border}` }}>
        <div style={{ position:'absolute', top:0, left:0, height:'100%', width:`${w}%`, background:`linear-gradient(90deg,${color}bb,${color})`, borderRadius:9, transition:'width .7s ease' }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', paddingLeft:10, gap:6 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,.5)' }}>{fmtN(value)}</span>
          {isLeak && <span style={{ fontSize:9, fontWeight:700, color:'#fff', background:C.red, padding:'1px 5px', borderRadius:4 }}>⚠ BOCOR</span>}
        </div>
      </div>
      <div style={{ width:44, fontSize:11, fontWeight:700, color, flexShrink:0 }}>{pct}%</div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ icon, title, desc, cta }: { icon:string; title:string; desc:string; cta?:{label:string;href:string} | {label:string;onClick:()=>void} }) {
  return (
    <div style={{ padding:'32px 16px', textAlign:'center' }}>
      <div style={{ fontSize:38, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:12, color:C.inkMuted, lineHeight:1.55, maxWidth:380, margin:'0 auto 14px' }}>{desc}</div>
      {cta && 'href' in cta && (
        <Link href={cta.href} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:9, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none', boxShadow:C.sa }}>
          {cta.label} <ChevronRight size={12}/>
        </Link>
      )}
      {cta && 'onClick' in cta && (
        <button onClick={cta.onClick} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit' }}>
          {cta.label} <Plus size={12}/>
        </button>
      )}
    </div>
  )
}

// ── Metrics input modal ───────────────────────────────────────
function MetricsModal({ assetId, onClose, onSaved }: { assetId?:string; onClose:()=>void; onSaved:()=>void }) {
  const [form, setForm] = useState({ platform:'tiktok', date:new Date().toISOString().split('T')[0], views:'', clicks:'', sales:'', revenue:'', likes:'', comments:'', shares:'', is_boosted:false, ad_spend:'' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    if (!form.views && !form.sales) { setErr('Minimal isi Views atau Sales'); return }
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...form, asset_id:assetId }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      onSaved()
    } catch(e:any) { setErr(e.message) } finally { setSaving(false) }
  }

  const PLATFORMS = [['tiktok','🎵 TikTok'],['shopee','🛍️ Shopee'],['instagram','📸 Instagram'],['tokopedia','🛒 Tokopedia'],['facebook','👥 Facebook']]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.surface, borderRadius:18, border:`1px solid ${C.border}`, width:460, maxWidth:'100%', boxShadow:C.sm, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>📊 Input Metrik Manual</div>
          <button onClick={onClose} style={{ width:26, height:26, borderRadius:7, border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={13}/></button>
        </div>
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.inkMuted, display:'block', marginBottom:4 }}>Platform *</label>
              <select value={form.platform} onChange={e=>setForm(p=>({...p,platform:e.target.value}))}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, fontFamily:'inherit', outline:'none', background:C.white }}>
                {PLATFORMS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.inkMuted, display:'block', marginBottom:4 }}>Tanggal *</label>
              <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[['views','👁️ Views'],['clicks','🖱️ Klik'],['sales','🛍️ Sales'],['revenue','💰 Revenue (Rp)'],['likes','❤️ Likes'],['comments','💬 Komentar'],['shares','↗️ Share'],['ad_spend','📢 Ad Spend (Rp)']].map(([k,l]) => (
              <div key={k}>
                <label style={{ fontSize:10, fontWeight:700, color:C.inkMuted, display:'block', marginBottom:3 }}>{l}</label>
                <input type="number" min="0" value={(form as any)[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  placeholder="0" style={{ width:'100%', padding:'7px 9px', borderRadius:7, border:`1px solid ${C.border}`, fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
              </div>
            ))}
          </div>
          {err && <div style={{ fontSize:11, color:C.red, padding:'7px 10px', borderRadius:7, background:C.redLt }}>{err}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:4 }}>
            <button onClick={onClose} style={{ padding:10, borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, fontSize:13, fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>Batal</button>
            <button onClick={save} disabled={saving}
              style={{ padding:10, borderRadius:9, border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {saving ? <Loader2 size={13} style={{ animation:'spin .8s linear infinite' }}/> : <Save size={13}/>} Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AnalyticsPage() {
  const { isSuperuser } = useUserRole()
  const [period,     setPeriod]     = useState<Period>('30d')
  const [tab,        setTab]        = useState<Tab>('overview')
  const [data,       setData]       = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [chartMetric,setChartMetric]= useState<'views'|'clicks'|'sales'|'revenue'>('views')

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`/api/analytics?period=${period}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e:any) {
      setError(e.message ?? 'Gagal memuat data')
    } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const kpi             = data?.kpi             ?? {}
  const beeScore        = data?.beeScore        ?? {}
  const chartData       = data?.chartData       ?? []
  const contentTable    = data?.contentTable    ?? []
  const topContent      = data?.topContent      ?? []
  const winners         = data?.winningCreatives ?? []
  const funnel          = data?.funnel          ?? []
  const leakStage       = data?.leakStage       ?? ''
  const productPerf     = data?.productPerf     ?? []
  const affiliate       = data?.affiliate       ?? {}
  const platformData    = data?.platformData    ?? []
  const recommendations = data?.recommendations ?? []
  const competitor      = data?.competitor      ?? {}
  const hasRealData     = kpi.hasRealData       ?? false
  const assetsCreated   = kpi.assetsCreated     ?? 0

  const TABS: { id:Tab; label:string; icon:string }[] = [
    { id:'overview',    label:'Overview',     icon:'📊' },
    { id:'content',     label:'Konten',       icon:'🎬' },
    { id:'product',     label:'Produk',       icon:'📦' },
    { id:'affiliate',   label:'Affiliate',    icon:'🔗' },
    { id:'marketplace', label:'Marketplace',  icon:'🛍️' },
    { id:'funnel',      label:'Sales Funnel', icon:'🔽' },
    { id:'competitor',  label:'Kompetitor',   icon:'🔍' },
  ]
  const PERIODS = [
    { id:'7d' as Period, l:'7 Hari' },
    { id:'30d'as Period, l:'30 Hari' },
    { id:'90d'as Period, l:'90 Hari' },
  ]

  const beeColor = (beeScore.total??0) >= 80 ? C.green : (beeScore.total??0) >= 60 ? C.amber : C.red
  const CHART_COLORS = { views:C.blue, clicks:C.amber, sales:C.green, revenue:C.purple }
  const CHART_LABELS = { views:'Views', clicks:'Klik', sales:'Order', revenue:'Revenue' }

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* Header */}
      <div style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:C.ink, letterSpacing:'-0.04em', marginBottom:4 }}>
            🐝 BeeSell Analytics AI
          </h1>
          <p style={{ fontSize:12, color:C.inkMuted, lineHeight:1.5, margin:0 }}>
            {isSuperuser ? 'Mode SUPERUSER — view data nyata user.' : 'AI Growth Assistant — Konten mana yang menghasilkan penjualan?'}
          </p>
        </div>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', gap:3, background:C.bg, padding:3, borderRadius:8, border:`1px solid ${C.border}` }}>
            {PERIODS.map(p => (
              <button key={p.id} type="button" onClick={()=>setPeriod(p.id)}
                style={{ padding:'5px 11px', borderRadius:6, border:'none', background:period===p.id?C.surface:'transparent', fontSize:12, fontWeight:period===p.id?700:500, color:period===p.id?C.ink:C.inkMuted, cursor:'pointer', boxShadow:period===p.id?C.sh:'none', fontFamily:'inherit' }}>
                {p.l}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, border:`1px solid ${C.amber}30`, background:C.amberXlt, color:C.amberDk, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <Plus size={13}/> Input Metrik
          </button>
          <button onClick={fetchData} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding:'12px 14px', background:C.redLt, border:`1px solid ${C.red}30`, borderRadius:10, marginBottom:16, fontSize:12, color:C.red, display:'flex', gap:7, alignItems:'center' }}>
          <AlertTriangle size={14}/> {error}
          <button onClick={fetchData} style={{ color:C.red, background:'none', border:'none', cursor:'pointer', fontWeight:700, fontFamily:'inherit', fontSize:12, marginLeft:4 }}>Retry</button>
        </div>
      )}

      {/* No real data banner */}
      {!loading && !hasRealData && (
        <div style={{ padding:'12px 16px', background:C.amberXlt, border:`1px solid ${C.amber}30`, borderRadius:12, marginBottom:16, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <Info size={15} color={C.amber}/>
          <div style={{ fontSize:12, color:C.amberDk, flex:1, lineHeight:1.5, minWidth:200 }}>
            <strong>Belum ada metrik nyata.</strong> {assetsCreated > 0
              ? `${assetsCreated} konten kamu belum punya metrik — klik "Input Metrik" untuk tambah views/clicks/sales.`
              : 'Buat konten dulu di Studio, lalu input metrik dari TikTok/Shopee/Instagram.'}
          </div>
          {assetsCreated === 0 ? (
            <Link href={ROUTES.studio} style={{ padding:'6px 12px', borderRadius:7, background:C.surface, border:`1px solid ${C.amber}40`, color:C.amberDk, fontSize:11, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>
              Buka Studio →
            </Link>
          ) : (
            <button onClick={()=>setShowModal(true)} style={{ padding:'6px 12px', borderRadius:7, background:C.amber, border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              Input Sekarang →
            </button>
          )}
        </div>
      )}

      {!loading && hasRealData && (
        <div style={{ padding:'9px 14px', background:C.greenLt, border:`1px solid ${C.green}25`, borderRadius:10, marginBottom:16, fontSize:12, color:C.green, display:'flex', gap:7, alignItems:'center', fontWeight:600 }}>
          <CheckCircle2 size={14}/> Menampilkan data nyata dari metrik yang kamu input.
        </div>
      )}

      {/* ── BeeScore + KPI — LAYOUT DIPERBAIKI ──────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(300px, 340px) 1fr', gap:14, marginBottom:18 }} className="top-row">
        {/* BeeScore card */}
        <Card>
          <CardHeader title="BeeScore™" badge="Skor Bisnis" color={beeColor} icon="⭐"/>
          <div style={{ padding:'16px 18px' }}>
            {loading ? <div style={{ display:'flex', justifyContent:'center', padding:16 }}><Sk w="80px" h="80px" r="50%"/></div> : (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:46, fontWeight:900, color:beeColor, letterSpacing:'-0.05em', lineHeight:1 }}>{beeScore.total ?? 0}</div>
                    <div style={{ fontSize:10, color:C.inkMuted, marginTop:2 }}>/100</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:beeColor, marginBottom:3 }}>
                      {(beeScore.total??0) === 0 ? '— Belum ada data' :
                       (beeScore.total??0) >= 80 ? '🔥 Performa Bagus!' :
                       (beeScore.total??0) >= 60 ? '📈 Sedang Tumbuh' :
                                                   '⚠️ Perlu Perhatian'}
                    </div>
                    <div style={{ fontSize:10, color:C.inkMuted, lineHeight:1.5 }}>
                      Komposit 5 dimensi performa
                    </div>
                  </div>
                </div>
                {/* Ring grid — minmax cegah overflow */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:4 }}>
                  <BeeRing score={beeScore.traffic    ?? 0} label="Traffic" color={C.blue}/>
                  <BeeRing score={beeScore.content    ?? 0} label="Content" color={C.purple}/>
                  <BeeRing score={beeScore.ctr        ?? 0} label="CTR"     color={C.amber}/>
                  <BeeRing score={beeScore.conversion ?? 0} label="Conv."   color={C.green}/>
                  <BeeRing score={beeScore.growth     ?? 0} label="Growth"  color={C.teal}/>
                </div>
                {recommendations[0] && (
                  <div style={{ marginTop:12 }}>
                    <Insight text={recommendations[0].text ?? recommendations[0]} color={beeColor} priority={recommendations[0].priority}/>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* KPI Grid — NO trend palsu */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10 }} className="kpi-grid">
          <KpiCard icon="👁️" label="Total Views"  value={loading?'—':fmtN(kpi.totalViews??0)}   sub={`${period} terakhir`}                  color={C.blue}   loading={loading}/>
          <KpiCard icon="🖱️" label="Total Klik"   value={loading?'—':fmtN(kpi.totalClicks??0)}  sub={`Avg CTR ${fmtPct(kpi.avgCtr??0)}`}    color={C.amber}  loading={loading}/>
          <KpiCard icon="🛍️" label="Total Order"  value={loading?'—':fmtN(kpi.totalSales??0)}   sub={`CVR ${fmtPct(kpi.avgCvr??0)}`}        color={C.green}  loading={loading}/>
          <KpiCard icon="💰" label="Est. Revenue" value={loading?'—':fmtRp(kpi.totalRevenue??0)} sub={`${assetsCreated} konten dibuat`}     color={C.purple} loading={loading}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:5, marginBottom:16, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' } as any}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={()=>setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 15px', borderRadius:99, border:`1.5px solid ${tab===t.id?C.amber:C.border}`, background:tab===t.id?C.amberXlt:C.surface, fontSize:12, fontWeight:tab===t.id?700:500, color:tab===t.id?C.amberDk:C.inkMuted, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', flexShrink:0, boxShadow:tab===t.id?C.sa:C.sh }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>📈 Tren Performa Konten</div>
                <div style={{ fontSize:10, color:C.inkMuted }}>Per hari dalam periode {period}</div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {(['views','clicks','sales','revenue'] as const).map(m => (
                  <button key={m} type="button" onClick={()=>setChartMetric(m)}
                    style={{ padding:'4px 10px', borderRadius:7, border:`1px solid ${chartMetric===m?(CHART_COLORS as any)[m]:C.border}`, background:chartMetric===m?`${(CHART_COLORS as any)[m]}12`:C.surface, fontSize:10, fontWeight:chartMetric===m?700:500, color:chartMetric===m?(CHART_COLORS as any)[m]:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                    {(CHART_LABELS as any)[m]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding:'16px 18px' }}>
              {loading ? <Sk h="220px"/> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                    <defs>
                      <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={(CHART_COLORS as any)[chartMetric]} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={(CHART_COLORS as any)[chartMetric]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="label" tick={{ fontSize:10, fill:C.inkMuted }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:C.inkMuted }} axisLine={false} tickLine={false} tickFormatter={v=>fmtN(v)} allowDecimals={false}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Area type="monotone" dataKey={chartMetric} name={(CHART_LABELS as any)[chartMetric]} stroke={(CHART_COLORS as any)[chartMetric]} fill="url(#gArea)" strokeWidth={2.5} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }} className="two-col">
            <Card>
              <CardHeader title="🏆 Winning Creative Detector" sub="Tipe konten dengan performa terbaik" badge="AI" color={C.amber}/>
              <div style={{ padding:'14px 18px' }}>
                {loading
                  ? <div style={{ display:'flex', flexDirection:'column', gap:7 }}>{[1,2,3].map(i=><Sk key={i} h="52px" r="9px"/>)}</div>
                  : winners.length === 0
                  ? <EmptyState icon="🏆" title="Belum ada data konten" desc="Buat konten lalu input metriknya untuk lihat tipe mana yang paling perform." cta={{ label:'Buka Studio', href:ROUTES.studio }}/>
                  : (
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {winners.slice(0,5).map((wc:any, i:number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', borderRadius:10, border:`1px solid ${i===0?C.amber+'30':C.border}`, background:i===0?C.amberXlt:C.bg }}>
                          <div style={{ width:24, height:24, borderRadius:7, background:i===0?`linear-gradient(135deg,${C.amber},${C.amberDk})`:`${C.amber}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:i===0?'#fff':C.amberDk, flexShrink:0 }}>{i+1}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wc.label}</div>
                            <div style={{ fontSize:10, color:C.inkMuted }}>{wc.count} konten dibuat</div>
                          </div>
                          <div style={{ display:'flex', gap:12, fontSize:11, flexShrink:0 }}>
                            <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>CTR</div><div style={{ fontWeight:700, color:C.amber }}>{fmtPct(wc.avgCtr)}</div></div>
                            <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>CVR</div><div style={{ fontWeight:700, color:C.green }}>{fmtPct(wc.avgCvr)}</div></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </Card>

            <Card>
              <CardHeader title="🤖 AI Recommendation" sub="Rekomendasi kontekstual" badge="Claude AI" color={C.purple}/>
              <div style={{ padding:'14px 18px' }}>
                {loading
                  ? <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{[1,2,3,4].map(i=><Sk key={i} h="40px" r="8px"/>)}</div>
                  : recommendations.length === 0
                  ? <EmptyState icon="🤖" title="Belum ada rekomendasi" desc="Rekomendasi akan muncul setelah ada data metrik dari konten kamu."/>
                  : (
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {recommendations.map((rec:any, i:number) => (
                        <div key={i} style={{ display:'flex', gap:9, padding:'10px 12px', borderRadius:10, background:i===0?C.amberXlt:C.bg, border:`1px solid ${i===0?C.amber+'30':C.border}` }}>
                          <div style={{ width:20, height:20, borderRadius:6, background:i===0?`linear-gradient(135deg,${C.amber},${C.amberDk})`:`${C.amber}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:i===0?'#fff':C.amberDk, flexShrink:0, marginTop:1 }}>{i+1}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, color:C.inkSub, lineHeight:1.55 }}>{rec.text ?? rec}</div>
                            {rec.action && (
                              <Link href={rec.link ?? ROUTES.studio} style={{ display:'inline-flex', alignItems:'center', gap:3, marginTop:5, fontSize:10, fontWeight:700, color:C.amber, textDecoration:'none' }}>
                                {rec.action} <ChevronRight size={10}/>
                              </Link>
                            )}
                          </div>
                          {rec.priority === 'high' && <span style={{ fontSize:8, fontWeight:800, padding:'2px 5px', borderRadius:3, background:C.red, color:'#fff', flexShrink:0, alignSelf:'flex-start' }}>HOT</span>}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      {tab === 'content' && (
        <Card>
          <CardHeader title="🎬 Content Performance" sub="Semua konten + metrik real-time" badge={`${contentTable.length} konten`}/>
          <div style={{ padding:'14px 18px' }}>
            {loading
              ? <div style={{ display:'flex', flexDirection:'column', gap:7 }}>{[1,2,3,4,5].map(i=><Sk key={i} h="52px" r="7px"/>)}</div>
              : contentTable.length === 0
              ? <EmptyState icon="🎬" title="Belum ada konten" desc="Mulai buat konten di Studio. Setelah posting, input metrik via tombol di atas." cta={{ label:'Buka Studio', href:ROUTES.studio }}/>
              : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:`2px solid ${C.border}` }}>
                        {['#','Konten','Tipe','Views','CTR','CVR','Sales','Revenue','Aksi'].map(h => (
                          <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:10, fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contentTable.slice(0,15).map((row:any, i:number) => (
                        <tr key={row.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                          <td style={{ padding:'9px 10px', color:C.inkMuted, fontWeight:700 }}>{i < 3 ? ['🥇','🥈','🥉'][i] : i+1}</td>
                          <td style={{ padding:'9px 10px' }}>
                            <div style={{ fontWeight:600, color:C.ink, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.title}</div>
                            <div style={{ fontSize:10, color:C.inkDim }}>{new Date(row.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</div>
                          </td>
                          <td style={{ padding:'9px 10px' }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:`${C.amber}15`, color:C.amberDk, whiteSpace:'nowrap' }}>{row.tool_name}</span>
                          </td>
                          <td style={{ padding:'9px 10px', fontWeight:600 }}>{fmtN(row.views)}</td>
                          <td style={{ padding:'9px 10px' }}>
                            <span style={{ fontWeight:700, color: row.ctr>=5?C.green: row.ctr>=3?C.amber: C.red }}>{fmtPct(row.ctr)}</span>
                          </td>
                          <td style={{ padding:'9px 10px', fontWeight:600, color: row.cvr>=2?C.green:C.inkMuted }}>{fmtPct(row.cvr)}</td>
                          <td style={{ padding:'9px 10px', fontWeight:600 }}>{fmtN(row.sales)}</td>
                          <td style={{ padding:'9px 10px', fontWeight:700, color:C.purple }}>{fmtRp(row.revenue)}</td>
                          <td style={{ padding:'9px 10px' }}>
                            <button type="button" onClick={()=>setShowModal(true)}
                              style={{ display:'flex', alignItems:'center', gap:2, padding:'4px 7px', borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, fontSize:10, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                              <Plus size={10}/> Metrik
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </Card>
      )}

      {/* ═══ PRODUCT ═══ */}
      {tab === 'product' && (
        <Card>
          <CardHeader title="📦 Product Performance" sub="Produk terlaris, CTR, dan performa"/>
          <div style={{ padding:'14px 18px' }}>
            {loading ? <Sk h="200px"/> : productPerf.length === 0 ? (
              <EmptyState icon="📦" title="Belum ada data produk" desc="Buat konten yang dikaitkan dengan produk, lalu input metrik untuk melihat performa per produk." cta={{ label:'Buka Studio', href:ROUTES.studio }}/>
            ) : (
              <>
                <div style={{ marginBottom:16 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={productPerf.slice(0,8)} margin={{ top:4, right:4, bottom:0, left:-15 }} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="label" tick={{ fontSize:9, fill:C.inkMuted }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize:10, fill:C.inkMuted }} axisLine={false} tickLine={false} tickFormatter={v=>fmtRp(v)}/>
                      <Tooltip content={<ChartTip/>}/>
                      <Bar dataKey="avgRev" name="Avg Revenue" radius={[6,6,0,0]}>
                        {productPerf.slice(0,8).map((_:any, i:number) => (
                          <Cell key={i} fill={[C.amber,C.purple,C.blue,C.green,C.teal,C.orange,C.red,C.blue][i%8]}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {productPerf.slice(0,6).map((p:any, i:number) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, border:`1px solid ${i===0?C.amber+'30':C.border}`, background:i===0?C.amberXlt:C.bg }}>
                      <span style={{ fontSize:16 }}>{['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'][i]}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:C.ink }}>{p.label}</div>
                        <div style={{ fontSize:10, color:C.inkMuted }}>{p.count} konten dibuat</div>
                      </div>
                      <div style={{ display:'flex', gap:16, fontSize:11 }}>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>CTR</div><div style={{ fontWeight:700, color:C.amber }}>{fmtPct(p.avgCtr)}</div></div>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>Avg Rev</div><div style={{ fontWeight:700, color:C.purple }}>{fmtRp(p.avgRev)}</div></div>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>Sales</div><div style={{ fontWeight:700, color:C.green }}>{fmtN(p.totalSales)}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* ═══ AFFILIATE ═══ */}
      {tab === 'affiliate' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10 }} className="kpi-grid">
            <KpiCard icon="🔗" label="Total Klik"    value={loading?'—':fmtN(affiliate.totalClicks??0)}      sub="Semua link"        color={C.blue}   loading={loading}/>
            <KpiCard icon="💵" label="Total Komisi"  value={loading?'—':fmtRp(affiliate.totalCommission??0)} sub="Komisi earned"     color={C.green}  loading={loading}/>
            <KpiCard icon="⚡" label="EPC"           value={loading?'—':`Rp${fmtN(affiliate.globalEpc??0)}`} sub="Earning per click" color={C.amber}  loading={loading}/>
            <KpiCard icon="🎯" label="Total Sales"   value={loading?'—':fmtN(affiliate.totalSales??0)}       sub="Dari semua link"   color={C.purple} loading={loading}/>
          </div>

          <Card>
            <CardHeader title="🏆 Top Kategori by EPC" sub="Earning per click per kategori"/>
            <div style={{ padding:'14px 18px' }}>
              {loading ? <Sk h="180px"/> : !affiliate.byCat || affiliate.byCat.length === 0 ? (
                <EmptyState
                  icon="🔗"
                  title="Belum ada link affiliate"
                  desc="Tambahkan affiliate link kamu untuk melihat performa komisi, EPC, dan kategori terbaik."
                />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {affiliate.byCat.map((cat:any, i:number) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:11, border:`1px solid ${i===0?C.amber+'30':C.border}`, background:i===0?C.amberXlt:C.bg }}>
                      <span style={{ fontSize:18 }}>{['🥇','🥈','🥉','4️⃣'][i] ?? `${i+1}`}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>{cat.category}</div>
                        <div style={{ fontSize:10, color:C.inkMuted }}>{fmtN(cat.clicks)} klik · {fmtN(cat.sales)} sales</div>
                      </div>
                      <div style={{ display:'flex', gap:18, fontSize:11 }}>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>Komisi</div><div style={{ fontWeight:700, color:C.green }}>{fmtRp(cat.commission)}</div></div>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>EPC</div><div style={{ fontWeight:700, color:C.amber }}>Rp{cat.epc}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══ MARKETPLACE ═══ */}
      {tab === 'marketplace' && (
        <Card>
          <CardHeader title="🛍️ Marketplace Analytics" sub="Performa per platform"/>
          <div style={{ padding:'14px 18px' }}>
            {loading ? <Sk h="180px"/> : platformData.length === 0 ? (
              <EmptyState
                icon="🛍️"
                title="Belum ada data per platform"
                desc="Saat input metrik, pilih platform (TikTok/Shopee/IG/dll). Datanya akan muncul terpisah di sini."
                cta={{ label:'Input Metrik', onClick:()=>setShowModal(true) }}
              />
            ) : (
              <>
                {platformData.map((p:any, i:number) => {
                  const platMeta: Record<string,{icon:string;color:string}> = {
                    tiktok:{icon:'🎵',color:'#010101'}, shopee:{icon:'🛍️',color:'#EE4D2D'},
                    instagram:{icon:'📸',color:'#E1306C'}, tokopedia:{icon:'🛒',color:'#42B549'},
                    facebook:{icon:'👥',color:'#1877F2'},
                  }
                  const m = platMeta[p.platform] ?? { icon:'📱', color:C.amber }
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', borderRadius:11, border:`1px solid ${C.border}`, background:C.bg, marginBottom:8 }}>
                      <div style={{ width:40, height:40, borderRadius:11, background:`${m.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{m.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.ink, textTransform:'capitalize', marginBottom:2 }}>{p.platform}</div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, fontSize:11, flexShrink:0 }}>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>Views</div><div style={{ fontWeight:700 }}>{fmtN(p.views)}</div></div>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>CTR</div><div style={{ fontWeight:700, color:C.amber }}>{fmtPct(p.ctr)}</div></div>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>Orders</div><div style={{ fontWeight:700, color:C.green }}>{fmtN(p.sales)}</div></div>
                        <div style={{ textAlign:'center' }}><div style={{ color:C.inkDim, fontSize:9 }}>Revenue</div><div style={{ fontWeight:700, color:C.purple }}>{fmtRp(p.revenue)}</div></div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </Card>
      )}

      {/* ═══ FUNNEL ═══ */}
      {tab === 'funnel' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }} className="two-col">
          <Card>
            <CardHeader title="🔽 Sales Funnel" sub="Alur konten → views → klik → beli"/>
            <div style={{ padding:'14px 18px' }}>
              {loading ? <Sk h="280px"/> : funnel.length === 0 || (funnel[0]?.value ?? 0) === 0 ? (
                <EmptyState icon="🔽" title="Belum ada funnel data" desc="Input metrik konten (views, clicks, sales) untuk melihat funnel dan titik bocor." cta={{ label:'Input Metrik', onClick:()=>setShowModal(true) }}/>
              ) : (
                <>
                  <div style={{ marginBottom:14 }}>
                    {funnel.map((f:any, i:number) => (
                      <FunnelBar
                        key={f.stage} stage={f.stage} value={f.value}
                        pct={parseFloat(((f.value / (funnel[0]?.value || 1)) * 100).toFixed(1))}
                        maxVal={funnel[0]?.value ?? 1}
                        color={f.color ?? [C.blue,C.amber,C.purple,C.orange,C.green][i]}
                        isLeak={f.stage === leakStage}
                      />
                    ))}
                  </div>
                  {leakStage && (
                    <div style={{ padding:'12px 14px', borderRadius:10, background:C.redLt, border:`1px solid ${C.red}25` }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.red, marginBottom:4 }}>🔍 Titik Kebocoran: {leakStage}</div>
                      <div style={{ fontSize:11, color:'#B91C1C', lineHeight:1.6 }}>
                        Tahap dengan drop-off tertinggi. Fokus optimasi di sini.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="📊 Benchmark Industri ID" sub="Rata-rata platform Indonesia"/>
            <div style={{ padding:'14px 18px' }}>
              {[
                { label:'CTR TikTok Organic',     yours:fmtPct(kpi.avgCtr??0),         bench:'4-8%', good:(kpi.avgCtr??0)>=4 },
                { label:'CTR Shopee Marketplace', yours:fmtPct(kpi.avgCtr??0),         bench:'2-5%', good:(kpi.avgCtr??0)>=2 },
                { label:'CVR E-commerce ID',      yours:fmtPct(kpi.avgCvr??0),         bench:'1-3%', good:(kpi.avgCvr??0)>=1 },
                { label:'Engagement Rate',        yours:fmtPct(kpi.avgEngagement??0),  bench:'3-8%', good:(kpi.avgEngagement??0)>=3 },
              ].map((row, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:i<3?`1px solid ${C.border}`:'none' }}>
                  <div style={{ flex:1, fontSize:11, color:C.inkMuted }}>{row.label}</div>
                  <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:11 }}>
                    <span style={{ fontWeight:700, color: hasRealData ? (row.good?C.green:C.orange) : C.inkDim }}>{loading?'—':row.yours}</span>
                    <span style={{ color:C.inkDim }}>vs {row.bench}</span>
                    {!loading && hasRealData && (row.good ? <CheckCircle2 size={12} color={C.green}/> : <AlertTriangle size={12} color={C.orange}/>)}
                  </div>
                </div>
              ))}
              {!hasRealData && (
                <div style={{ marginTop:10, fontSize:10, color:C.inkDim, fontStyle:'italic', textAlign:'center' }}>
                  Benchmark akan dibandingkan setelah ada metrik nyata.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══ COMPETITOR ═══ */}
      {tab === 'competitor' && (
        <Card>
          <CardHeader title="🔍 Competitor Analytics" sub="AI memantau tren kompetitor" badge="Soon" color={C.purple}/>
          <div style={{ padding:'14px 18px' }}>
            {(!competitor.topFormats || competitor.topFormats.length === 0) ? (
              <EmptyState
                icon="🔍"
                title="Competitor Analytics — Segera Hadir"
                desc="Fitur untuk memantau tren konten kompetitor di niche kamu. Sedang dalam pengembangan."
              />
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }} className="comp-grid">
                  {[
                    { label:'Top Format',  items:competitor.topFormats,    icon:'🎬', color:C.blue },
                    { label:'Top Hooks',   items:competitor.topHooks,      icon:'🎣', color:C.amber },
                    { label:'Top CTA',     items:competitor.topCTA,        icon:'🎯', color:C.green },
                    { label:'Tren Visual', items:competitor.trendVisuals,  icon:'🎨', color:C.purple },
                  ].map((sec, i) => (
                    <div key={i} style={{ padding:13, borderRadius:12, border:`1px solid ${C.border}`, background:C.bg }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.ink, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                        <span>{sec.icon}</span>{sec.label}
                      </div>
                      {(sec.items ?? []).map((item:string, j:number) => (
                        <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:6, padding:'4px 0', borderBottom:`1px solid ${C.border}`, fontSize:11, color:C.inkSub, lineHeight:1.4 }}>
                          <span style={{ color:sec.color, fontWeight:700, flexShrink:0 }}>#{j+1}</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {competitor.insight && <Insight text={competitor.insight} color={C.purple}/>}
              </>
            )}
          </div>
        </Card>
      )}

      {showModal && (
        <MetricsModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData() }}
        />
      )}

      <div style={{ height:32 }}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
        input::placeholder { color:#9CA3AF }

        .top-row  { grid-template-columns: minmax(300px, 340px) 1fr !important }
        .kpi-grid { grid-template-columns: repeat(4, minmax(0,1fr)) !important }
        .two-col  { grid-template-columns: 1fr 1fr !important }
        .comp-grid{ grid-template-columns: repeat(4,1fr) !important }

        @media (max-width:1100px) {
          .top-row   { grid-template-columns: 1fr !important }
          .comp-grid { grid-template-columns: repeat(2,1fr) !important }
        }
        @media (max-width:768px) {
          .kpi-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important }
          .two-col  { grid-template-columns: 1fr !important }
          .comp-grid{ grid-template-columns: 1fr !important }
        }
      `}</style>
    </div>
  )
}