'use client'
// app/(dashboard)/dashboard/page.tsx
// ══════════════════════════════════════════════════════════════
// BeeSell AI — Dashboard Home (NO DUMMY DATA)
//
// Semua angka & list dari DB:
//   • Tier         → useDailyUsage().tier  (user_credits.plan_tier)
//   • Superuser    → useUserRole().isSuperuser (besties.aegle@gmail.com)
//   • KPI counts   → /api/dashboard/summary (ai_assets per type, 30 hari)
//   • Quota        → /api/dashboard/summary (user_credits balance/quota)
//   • Chart 7 hari → ai_assets group by day
//   • Recent      → ai_assets order created_at desc limit 6
//   • Upcoming     → scheduled_posts besok (defensif)
//
// User baru tanpa data → semua nol/empty state (BUKAN angka palsu).
// Superuser tanpa data → tetap empty state, tapi quota strip "∞".
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight, RefreshCw, Sparkles, Crown, CreditCard, AlertTriangle,
  Download, Plus, ChevronRight, Infinity as InfinityIcon,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useUserRole }   from '@/hooks/use-user-role'
import { useDailyUsage } from '@/hooks/use-daily-usage'

// ── Tokens (amber lebah) ──────────────────────────────────────
const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5',
  blue:'#3B82F6',  blueLt:'#EFF6FF',
  purple:'#7C3AED', purpleLt:'#F5F3FF',
  red:'#EF4444',   redLt:'#FEF2F2',
  orange:'#F97316', orangeLt:'#FFF7ED',
  sky:'#0284C7',   skyLt:'#E0F2FE',
  sh:'0 1px 3px rgba(0,0,0,.06)',
  sm:'0 4px 16px rgba(0,0,0,.07)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

const BUCKET_META: Record<string, { icon:string; color:string; bg:string; label:string }> = {
  image: { icon:'🖼️', color:C.amber,  bg:C.amberXlt, label:'Gambar' },
  video: { icon:'🎬', color:C.purple, bg:C.purpleLt, label:'Video' },
  text:  { icon:'✍️', color:C.blue,   bg:C.blueLt,   label:'Teks' },
  other: { icon:'📄', color:C.inkMuted,bg:C.bg,      label:'Lainnya' },
}

// ── Skeleton ──────────────────────────────────────────────────
function Sk({ w='100%', h='14px', r='6px' }: { w?:string; h?:string; r?:string }) {
  return (
    <div style={{ width:w, height:h, borderRadius:r, background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite' }}/>
  )
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:C.sh, padding:'18px 20px', ...style }}>
      {children}
    </div>
  )
}

// ── KPI card (no trend palsu) ─────────────────────────────────
function KpiCard({ label, value, sub, icon, color, loading, unlimited }: {
  label:string; value:string; sub:string; icon:string; color:string;
  loading:boolean; unlimited?:boolean
}) {
  return (
    <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:C.sh, padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>{icon}</div>
        {!loading && unlimited && (
          <div style={{ fontSize:11, fontWeight:700, color:C.amberDk, padding:'2px 7px', borderRadius:99, background:C.amberLt, display:'inline-flex', alignItems:'center', gap:3 }}>
            <InfinityIcon size={10}/>
          </div>
        )}
      </div>
      {loading
        ? <><Sk h="26px" w="80px" r="5px"/><div style={{ marginTop:5 }}><Sk h="11px" w="120px" r="4px"/></div></>
        : <>
            <div style={{ fontSize:22, fontWeight:800, color:C.ink, letterSpacing:'-0.03em', lineHeight:1, marginBottom:3 }}>{value}</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.inkMuted }}>{label}</div>
            <div style={{ fontSize:10, color:C.inkDim, marginTop:2 }}>{sub}</div>
          </>}
    </div>
  )
}

// ── Quota ring ────────────────────────────────────────────────
function QuotaRing({ pct, label, color, sub }: { pct:number; label:string; color:string; sub:string }) {
  const r=28, c=2*Math.PI*r, dash=(pct/100)*c
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, background:C.bg, border:`1px solid ${C.border}` }}>
      <svg width="68" height="68" viewBox="0 0 72 72" style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke={`${color}20`} strokeWidth="5"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{ transition:'stroke-dasharray .6s' }}/>
      </svg>
      <div>
        <div style={{ fontSize:20, fontWeight:800, color:C.ink, letterSpacing:'-0.03em' }}>{pct}%</div>
        <div style={{ fontSize:11, fontWeight:600, color:C.inkMuted, marginTop:1 }}>{label}</div>
        <div style={{ fontSize:10, color:C.inkDim, marginTop:1 }}>{sub}</div>
      </div>
    </div>
  )
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:'9px 12px', boxShadow:C.sm, fontSize:12 }}>
      <div style={{ fontWeight:700, color:C.ink, marginBottom:4 }}>{label}</div>
      {payload.map((p:any, i:number) => (
        <div key={i} style={{ color:p.color, display:'flex', gap:6, alignItems:'center', marginTop:2 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color, flexShrink:0 }}/>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── Empty state component ─────────────────────────────────────
function EmptyState({ icon, title, desc, cta }: { icon:string; title:string; desc:string; cta?:{label:string;href:string} }) {
  return (
    <div style={{ padding:'24px 16px', textAlign:'center', borderRadius:11, background:C.bg, border:`1px dashed ${C.border}` }}>
      <div style={{ fontSize:32, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:3 }}>{title}</div>
      <div style={{ fontSize:11, color:C.inkMuted, lineHeight:1.5, marginBottom:cta?12:0 }}>{desc}</div>
      {cta && (
        <Link href={cta.href} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none' }}>
          {cta.label} <ArrowRight size={11}/>
        </Link>
      )}
    </div>
  )
}

// ── Quick actions (navigasi statis — bukan data user) ────────
const QUICK_ACTIONS_AI = [
  { href:'/studio/image/packshot',        icon:'📦', label:'AI Packshot',     desc:'Foto produk profesional',  color:C.purple,  bg:C.purpleLt },
  { href:'/studio/image/product-to-model',icon:'🧑',  label:'To Model',        desc:'Produk ke foto model',     color:'#DB2777', bg:'#FDF2F8'  },
  { href:'/studio/image/enhancer',        icon:'✨',  label:'Product Enhancer',desc:'20 preset visual iklan',   color:C.amber,   bg:C.amberXlt },
  { href:'/studio/video/ugc',             icon:'🎬',  label:'UGC Video',       desc:'Video konten creator',     color:C.green,   bg:C.greenLt  },
  { href:'/studio/video/tiktok',          icon:'🎵',  label:'TikTok Reels',    desc:'Reels script + video',     color:'#010101', bg:'#F3F4F6'  },
  { href:'/studio/video/generator',       icon:'🎥',  label:'AI Video Gen',    desc:'7-step video wizard',      color:C.blue,    bg:C.blueLt   },
  { href:'/marketing-kit?t=caption',      icon:'✍️',  label:'Caption AI',      desc:'Caption siap post',        color:C.orange,  bg:C.orangeLt },
  { href:'/quick-tools',                  icon:'⚡',  label:'Quick Tools',     desc:'Remove BG, resize, dll',   color:C.sky,     bg:C.skyLt    },
]

const QUICK_ACTIONS_ADS = [
  { href:'/campaign',         icon:'📢', label:'Campaign Builder', desc:'Meta + TikTok + Google',   color:'#2563EB', bg:C.blueLt    },
  { href:'/audience',         icon:'🎯', label:'Audience Intel',   desc:'Lookalike · Interest',      color:C.purple,  bg:C.purpleLt  },
  { href:'/budget-optimizer', icon:'💰', label:'Budget Optimizer', desc:'ROAS + Auto-Bidding',       color:C.green,   bg:C.greenLt   },
  { href:'/analytics',        icon:'📊', label:'Analytics AI',     desc:'BeeScore™ · Insights',      color:C.amber,   bg:C.amberXlt  },
  { href:'/scheduler',        icon:'📅', label:'Scheduler',        desc:'6 platform · Auto-Repost',  color:C.sky,     bg:C.skyLt     },
  { href:'/help',             icon:'❓', label:'Help Center',      desc:'Panduan semua fitur',        color:C.inkMuted,bg:C.bg        },
]

// ══════════════════════════════════════════════════════════════
export default function DashboardHome() {
  const { isSuperuser, role } = useUserRole()
  const { tier: dailyTier }   = useDailyUsage()

  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [chartType, setChartType] = useState<'area'|'bar'>('area')
  const [activeTab, setActiveTab] = useState<'ai'|'ads'>('ai')
  const [data,      setData]      = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/dashboard/summary', { credentials:'include' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setData(await r.json())
    } catch (e:any) {
      setError(e?.message ?? 'Gagal memuat data')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Sumber tier final (prioritas: response API > useDailyUsage)
  const tier = (data?.tier ?? dailyTier ?? 'starter').toString().toLowerCase()

  const counts  = data?.counts  ?? { image:0, video:0, text:0, total:0 }
  const credit  = data?.credit  ?? { balance:0, quota:0, used:0 }
  const chartD  = data?.chartData ?? Array.from({length:7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return { day: d.toLocaleDateString('id-ID', {weekday:'short'}), gambar:0, video:0, teks:0 }
  })
  const recent   = data?.recent   ?? []
  const upcoming = data?.upcoming ?? []

  const hour     = new Date().getHours()
  const greeting = hour < 11 ? '🌅 Selamat pagi' : hour < 15 ? '☀️ Selamat siang' : hour < 18 ? '🌤️ Selamat sore' : '🌙 Selamat malam'
  const todayStr = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' })
  const tierLabel = (tier.charAt(0).toUpperCase() + tier.slice(1))

  // Quota %
  const creditPct = credit.quota > 0
    ? Math.min(100, Math.round((credit.used / credit.quota) * 100))
    : 0
  const lowCredit = !isSuperuser && credit.quota > 0 && credit.balance < credit.quota * 0.2

  const hasAnyData = counts.total > 0 || recent.length > 0
  const chartTotal = chartD.reduce((s:number, d:any) => s + d.gambar + d.video + d.teks, 0)

  return (
    <div style={{ maxWidth:1160, margin:'0 auto', fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* ── HEADER ───────────────────────────────────────── */}
      <div style={{ marginBottom:22, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'clamp(18px,2.5vw,24px)', fontWeight:800, color:C.ink, letterSpacing:'-0.03em', marginBottom:3 }}>
            {greeting}, {isSuperuser ? 'Admin' : 'Seller'} 👋
          </h1>
          <p style={{ fontSize:13, color:C.inkMuted, margin:0 }}>
            {todayStr} · {isSuperuser ? 'Mode SUPERUSER — akses penuh.' : 'BeeSell AI siap membantu kamu jualan lebih cepat.'}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
          <button onClick={load} title="Refresh"
            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:9, border:`1px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:C.sh }}>
            <RefreshCw size={12}/> Refresh
          </button>
          <Link href="/billing" style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:9, border:`1px solid ${isSuperuser?C.amber+'60':C.border}`, background: isSuperuser ? `linear-gradient(135deg,${C.amber}15,${C.amberLt})` : C.surface, color: isSuperuser ? C.amberDk : C.inkMuted, fontSize:12, fontWeight:600, textDecoration:'none', boxShadow:C.sh }}>
            <Crown size={13} color={C.amber}/> {isSuperuser ? 'SUPERUSER' : `Plan ${tierLabel}`}
          </Link>
          <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:9, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none', boxShadow:C.sa }}>
            <Sparkles size={13}/> Buat Konten
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ padding:'10px 14px', background:C.redLt, border:`1px solid ${C.red}30`, borderRadius:10, marginBottom:14, fontSize:12, color:C.red, display:'flex', alignItems:'center', gap:7 }}>
          <AlertTriangle size={13}/> {error}
        </div>
      )}

      {/* ── KPI ROW (data nyata, tanpa trend palsu) ───────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }} className="kpi-strip">
        <KpiCard
          label="Gambar AI" icon="🖼️" color={C.amber} loading={loading}
          value={String(counts.image)}
          sub={counts.image === 0 ? 'Belum ada — buat sekarang' : '30 hari terakhir'}
          unlimited={isSuperuser}
        />
        <KpiCard
          label="Video AI" icon="🎬" color={C.purple} loading={loading}
          value={String(counts.video)}
          sub={counts.video === 0 ? 'Belum ada — buat sekarang' : '30 hari terakhir'}
          unlimited={isSuperuser}
        />
        <KpiCard
          label="Caption & Teks" icon="✍️" color={C.blue} loading={loading}
          value={String(counts.text)}
          sub={counts.text === 0 ? 'Belum ada — buat sekarang' : '30 hari terakhir'}
          unlimited={isSuperuser}
        />
        <KpiCard
          label="Total Konten" icon="📦" color={C.green} loading={loading}
          value={String(counts.total)}
          sub={counts.total === 0 ? 'Mulai dari Studio →' : '30 hari terakhir'}
          unlimited={isSuperuser}
        />
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────── */}
      <Card style={{ marginBottom:18, padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>🚀 Aksi Cepat</div>
          <div style={{ display:'flex', gap:3, background:C.bg, padding:2, borderRadius:8, border:`1px solid ${C.border}` }}>
            {([['ai','🎨 AI Studio'],['ads','📢 Ads & Grow']] as const).map(([t,l]) => (
              <button key={t} type="button" onClick={() => setActiveTab(t)}
                style={{ padding:'5px 12px', borderRadius:6, border:'none', background:activeTab===t?C.surface:'transparent', fontSize:11, fontWeight:activeTab===t?700:500, color:activeTab===t?C.ink:C.inkMuted, cursor:'pointer', fontFamily:'inherit', boxShadow:activeTab===t?C.sh:'none' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'ai' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }} className="actions-grid">
            {QUICK_ACTIONS_AI.map((a, i) => (
              <Link key={i} href={a.href} style={{ textDecoration:'none' }}>
                <div style={{ padding:'11px 12px', borderRadius:11, background:a.bg, border:`1px solid ${a.color}18`, display:'flex', gap:8, alignItems:'flex-start', transition:'all .18s', cursor:'pointer' }}
                  onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 6px 18px ${a.color}20` }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}>
                  <span style={{ fontSize:19, flexShrink:0 }}>{a.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:a.color, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.label}</div>
                    <div style={{ fontSize:10, color:C.inkMuted, lineHeight:1.4 }}>{a.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'ads' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }} className="ads-actions-grid">
            {QUICK_ACTIONS_ADS.map((a, i) => (
              <Link key={i} href={a.href} style={{ textDecoration:'none' }}>
                <div style={{ padding:12, borderRadius:11, background:a.bg, border:`1px solid ${a.color}20`, transition:'all .18s', cursor:'pointer' }}
                  onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 6px 18px ${a.color}20` }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}>
                  <div style={{ fontSize:22, marginBottom:7 }}>{a.icon}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:a.color, marginBottom:2 }}>{a.label}</div>
                  <div style={{ fontSize:10, color:C.inkMuted, lineHeight:1.4 }}>{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* ── CHART + QUOTA ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginBottom:18 }} className="main-grid">

        {/* Chart */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>📊 Aktivitas 7 Hari</div>
              <div style={{ fontSize:11, color:C.inkMuted, marginTop:1 }}>
                {chartTotal === 0 ? 'Belum ada konten dalam 7 hari terakhir' : `${chartTotal} konten di-generate`}
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {(['area','bar'] as const).map(t => (
                <button key={t} type="button" onClick={()=>setChartType(t)}
                  style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${chartType===t?C.amber:C.border}`, background:chartType===t?C.amberXlt:C.surface, fontSize:11, fontWeight:chartType===t?700:500, color:chartType===t?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                  {t === 'area' ? 'Area' : 'Bar'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ height:200 }}><Sk w="100%" h="200px" r="8px"/></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              {chartType === 'area' ? (
                <AreaChart data={chartD} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                  <defs>
                    {[['G',C.amber],['T',C.blue],['V',C.purple]].map(([k,c]) => (
                      <linearGradient key={k} id={`c${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c as string} stopOpacity={0.18}/>
                        <stop offset="95%" stopColor={c as string} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="day" tick={{ fontSize:11, fill:C.inkMuted }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:C.inkMuted }} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="gambar" name="Gambar" stroke={C.amber}  fill="url(#cG)" strokeWidth={2} dot={false}/>
                  <Area type="monotone" dataKey="teks"   name="Teks"   stroke={C.blue}   fill="url(#cT)" strokeWidth={2} dot={false}/>
                  <Area type="monotone" dataKey="video"  name="Video"  stroke={C.purple} fill="url(#cV)" strokeWidth={2} dot={false}/>
                </AreaChart>
              ) : (
                <BarChart data={chartD} margin={{ top:4, right:4, bottom:0, left:-20 }} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="day" tick={{ fontSize:11, fill:C.inkMuted }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:C.inkMuted }} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="gambar" name="Gambar" fill={C.amber}  radius={[4,4,0,0]}/>
                  <Bar dataKey="teks"   name="Teks"   fill={C.blue}   radius={[4,4,0,0]}/>
                  <Bar dataKey="video"  name="Video"  fill={C.purple} radius={[4,4,0,0]}/>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}

          <div style={{ display:'flex', gap:14, justifyContent:'center', marginTop:8 }}>
            {[['Gambar',C.amber],['Teks',C.blue],['Video',C.purple]].map(([l,c]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:C.inkMuted }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:c as string }}/>
                {l}
              </div>
            ))}
          </div>
        </Card>

        {/* Quota & Add-on */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ display:'flex', gap:5, alignItems:'center' }}><Crown size={13} color={C.amber}/> Kuota Bulan Ini</span>
              <Link href="/billing" style={{ fontSize:10, color:C.amber, fontWeight:700, textDecoration:'none' }}>Kelola</Link>
            </div>

            {isSuperuser ? (
              <div style={{ padding:'18px 12px', borderRadius:10, background:`linear-gradient(135deg,${C.amber}15,${C.amberLt})`, border:`1px solid ${C.amber}30`, textAlign:'center' }}>
                <InfinityIcon size={28} color={C.amberDk} style={{ marginBottom:6 }}/>
                <div style={{ fontSize:13, fontWeight:800, color:C.amberDk }}>Unlimited Access</div>
                <div style={{ fontSize:10, color:C.inkMuted, marginTop:2 }}>Mode Superuser — tanpa batas</div>
              </div>
            ) : credit.quota > 0 ? (
              <>
                <QuotaRing
                  pct={creditPct}
                  label="Kredit terpakai"
                  sub={`${credit.used}/${credit.quota} kredit · sisa ${credit.balance}`}
                  color={lowCredit ? C.red : C.amber}
                />
                {lowCredit && (
                  <div style={{ marginTop:10, padding:'8px 10px', borderRadius:9, background:C.amberXlt, border:`1px solid ${C.amber}30`, display:'flex', gap:6, alignItems:'flex-start', fontSize:11, color:C.amberDk }}>
                    <AlertTriangle size={12} style={{ flexShrink:0, marginTop:1 }}/> Kredit hampir habis!
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding:14, borderRadius:10, background:C.bg, border:`1px dashed ${C.border}`, textAlign:'center' }}>
                <div style={{ fontSize:11, color:C.inkMuted, lineHeight:1.5 }}>Belum ada kuota aktif</div>
              </div>
            )}

            {!isSuperuser && (
              <Link href="/billing" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:10, padding:8, borderRadius:9, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none', boxShadow:C.sa }}>
                <CreditCard size={12}/> Topup / Upgrade
              </Link>
            )}
          </Card>

          {/* Add-on katalog (harga statis dari pricing config — bukan data user) */}
          {!isSuperuser && (
            <Card style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.ink, marginBottom:9 }}>⚡ Add-On Cepat</div>
              {[
                { label:'Topup 50 kredit',   price:'Rp49K',  color:C.amber  },
                { label:'Video Pack 5×',     price:'Rp89K',  color:C.purple },
                { label:'Topup 200 kredit',  price:'Rp149K', color:C.green  },
              ].map((item, i) => (
                <Link key={i} href="/billing" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, textDecoration:'none', marginBottom:i<2?6:0 }}
                  onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.amber; (e.currentTarget as HTMLElement).style.background=C.amberXlt }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.border; (e.currentTarget as HTMLElement).style.background=C.bg }}>
                  <span style={{ fontSize:11, color:C.inkSub, fontWeight:500 }}>{item.label}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:item.color }}>{item.price}</span>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* ── RECENT + UPCOMING ─────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, marginBottom:18 }} className="bottom-grid">

        {/* Recent assets — nyata, dengan empty state */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>🕐 Aktivitas Terbaru</div>
            {recent.length > 0 && (
              <Link href="/library" style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:C.amber, textDecoration:'none', fontWeight:600 }}>
                Lihat semua <ArrowRight size={12}/>
              </Link>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {loading ? (
              Array.from({length:5}).map((_,i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 10px', borderRadius:9, background:C.bg }}>
                  <Sk w="38px" h="38px" r="9px"/>
                  <div style={{ flex:1 }}><Sk w="65%" h="12px" r="4px"/><div style={{ marginTop:5 }}><Sk w="40%" h="10px" r="4px"/></div></div>
                </div>
              ))
            ) : recent.length === 0 ? (
              <EmptyState
                icon="📭"
                title="Belum ada konten"
                desc="Mulai buat gambar, video, atau caption pertamamu dari Studio. Aktivitasmu akan muncul di sini."
                cta={{ label:'Buka Studio', href:'/studio' }}
              />
            ) : (
              recent.map((item: any) => {
                const meta = BUCKET_META[item.bucket] ?? BUCKET_META.other
                return (
                  <div key={item.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'10px 11px', borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, transition:'all .15s' }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=C.bg; (e.currentTarget as HTMLElement).style.borderColor=C.amber }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background=C.surface; (e.currentTarget as HTMLElement).style.borderColor=C.border }}>
                    <div style={{ width:38, height:38, borderRadius:9, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{meta.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:3 }}>
                        <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4, background:`${meta.color}18`, color:meta.color }}>{item.tool}</span>
                        <span style={{ fontSize:10, color:C.inkDim }}>{item.created}</span>
                      </div>
                    </div>
                    {item.file_url && (
                      <a href={item.file_url} target="_blank" rel="noreferrer" download
                        style={{ padding:5, borderRadius:7, color:C.inkDim, textDecoration:'none', flexShrink:0 }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.amber}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.inkDim}>
                        <Download size={13}/>
                      </a>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Upcoming scheduled — nyata, dengan empty state */}
        <Card style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.ink, marginBottom:9, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>📅 Posting Besok</span>
            {upcoming.length > 0 && (
              <Link href="/scheduler" style={{ fontSize:10, color:C.sky, fontWeight:700, textDecoration:'none' }}>Lihat semua →</Link>
            )}
          </div>
          {loading ? (
            <Sk h="80px" r="8px"/>
          ) : upcoming.length === 0 ? (
            <div style={{ padding:'14px 8px', textAlign:'center', fontSize:11, color:C.inkMuted, lineHeight:1.5 }}>
              Belum ada posting terjadwal untuk besok. <Link href="/scheduler" style={{ color:C.sky, fontWeight:700, textDecoration:'none' }}>Jadwalkan →</Link>
            </div>
          ) : (
            upcoming.map((p: any, i: number) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 0', borderBottom:i<upcoming.length-1?`1px solid ${C.border}`:'none' }}>
                <span style={{ fontSize:10, fontWeight:800, color:C.sky, width:42, flexShrink:0 }}>{p.time}</span>
                <span style={{ fontSize:11, color:C.inkMuted, flexShrink:0, textTransform:'capitalize' }}>{p.platform}</span>
                <span style={{ fontSize:11, color:C.inkSub, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</span>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* ── UPGRADE BANNER — hidden untuk superuser ──────── */}
      {!isSuperuser && (
        <div style={{ borderRadius:16, background:`linear-gradient(135deg,${C.amber} 0%,${C.amberDk} 60%,#B45309 100%)`, padding:'18px 24px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', boxShadow:C.sa }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:3 }}>
              🚀 Upgrade ke paket lebih tinggi
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.85)', lineHeight:1.6 }}>
              Buka lebih banyak kredit, video AI, dan fitur premium. Lihat paket yang cocok untuk skala bisnismu.
            </div>
          </div>
          <Link href="/billing" style={{ padding:'9px 20px', borderRadius:10, background:'#fff', color:C.amberDk, fontSize:13, fontWeight:800, textDecoration:'none', flexShrink:0, whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
            Lihat Paket →
          </Link>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .kpi-strip        { grid-template-columns:repeat(4,1fr) !important }
        .actions-grid     { grid-template-columns:repeat(4,1fr) !important }
        .ads-actions-grid { grid-template-columns:repeat(6,1fr) !important }
        .main-grid        { grid-template-columns:1fr 300px !important }
        .bottom-grid      { grid-template-columns:1fr 340px !important }

        @media (max-width:1100px) {
          .kpi-strip        { grid-template-columns:repeat(2,1fr) !important }
          .ads-actions-grid { grid-template-columns:repeat(3,1fr) !important }
          .main-grid        { grid-template-columns:1fr !important }
          .bottom-grid      { grid-template-columns:1fr !important }
        }
        @media (max-width:640px) {
          .actions-grid     { grid-template-columns:repeat(2,1fr) !important }
          .ads-actions-grid { grid-template-columns:repeat(2,1fr) !important }
        }
      `}</style>
    </div>
  )
}