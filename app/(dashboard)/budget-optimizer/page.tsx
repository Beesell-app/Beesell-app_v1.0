'use client'
// app/(dashboard)/budget-optimizer/page.tsx
// ══════════════════════════════════════════════════════════════
// BUDGET OPTIMIZER & AUTO-BIDDING
// Panel 1 — Smart Budget Allocation
// Panel 2 — ROAS Optimizer (winners/losers)
// Panel 3 — Daily Budget Guardian (alerts + pacing)
// Light theme · Amber primary
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Sparkles, Loader2, Check, AlertTriangle,
  AlertCircle, CheckCircle2, RefreshCw, Plus, X,
  TrendingUp, TrendingDown, Zap, Shield, Bell,
  BellOff, Play, Pause, ChevronDown, ChevronUp,
  Settings, Info, BarChart3, Target, DollarSign, Brain
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine, Cell,
} from 'recharts'
import {
  STATUS_CONFIG, ACTION_CONFIG,
  PLATFORM_BENCHMARKS, ALLOCATION_RULES,
  PACING_MULTIPLIERS, expectedSpendPct,
  fmtRp, fmtN, fmtPct, fmtROAS,
  type CreativeMetric, type CreativeStatus,
  type BidAction, type GuardianConfig,
  type BudgetAlert, type BudgetAllocation,
  type OptimizerResult,
} from '@/lib/budget/types'
import type { PlatformId } from '@/lib/campaign/types'
// ── Design tokens ─────────────────────────────────────────────
const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB', borderHi:'#D1D5DB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5', greenXlt:'#D1FAE5',
  blue:'#3B82F6', blueLt:'#EFF6FF',
  purple:'#7C3AED', purpleLt:'#F5F3FF',
  red:'#EF4444', redLt:'#FEF2F2',
  orange:'#F97316', orangeLt:'#FFF7ED',
  teal:'#0D9488', tealLt:'#F0FDFA',
  sh:'0 1px 3px rgba(0,0,0,.06)',
  sm:'0 4px 16px rgba(0,0,0,.07)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

// ── Types ─────────────────────────────────────────────────────
type ActiveTab = 'allocation' | 'roas' | 'guardian' | 'simulate' | 'autobid'

// ── Demo data ─────────────────────────────────────────────────
function makeDemoCreatives(platform: PlatformId): CreativeMetric[] {
  const now = new Date().toISOString()
  return [
    { id:'c1', name:'UGC Wanita Muda — Hook Pertanyaan', platform, adSetId:'as1', campaignId:'camp1',
      impressions:45200, reach:38000, clicks:2034, spend:820000, revenue:4100000, conversions:82,
      frequency:1.8, ctr:4.5, cpm:18141, cpc:403, roas:5.0, cvr:4.0, cpa:10000, aov:50000,
      roasDelta:0.8, spendDelta:5, ctrDelta:0.3, status:'scaling', daysSince:7,
      budget:120000, budgetPct:20, performanceScore:88, confidenceLevel:92, lastUpdated:now },
    { id:'c2', name:'Slideshow Produk — Before/After', platform, adSetId:'as1', campaignId:'camp1',
      impressions:38500, reach:31000, clicks:1540, spend:693000, revenue:2772000, conversions:55,
      frequency:2.1, ctr:4.0, cpm:18000, cpc:450, roas:4.0, cvr:3.6, cpa:12600, aov:50400,
      roasDelta:0.2, spendDelta:3, ctrDelta:-0.1, status:'stable', daysSince:7,
      budget:100000, budgetPct:17, performanceScore:74, confidenceLevel:88, lastUpdated:now },
    { id:'c3', name:'Talking Head — Avatar Profesional', platform, adSetId:'as2', campaignId:'camp1',
      impressions:52000, reach:44000, clicks:1820, spend:936000, revenue:2808000, conversions:42,
      frequency:1.9, ctr:3.5, cpm:18000, cpc:514, roas:3.0, cvr:2.3, cpa:22286, aov:66857,
      roasDelta:-0.3, spendDelta:8, ctrDelta:-0.5, status:'monitoring', daysSince:5,
      budget:140000, budgetPct:23, performanceScore:55, confidenceLevel:75, lastUpdated:now },
    { id:'c4', name:'Static Image — Lifestyle', platform, adSetId:'as2', campaignId:'camp1',
      impressions:29000, reach:24000, clicks:580, spend:522000, revenue:885400, conversions:17,
      frequency:3.8, ctr:2.0, cpm:18000, cpc:900, roas:1.7, cvr:2.9, cpa:30706, aov:52082,
      roasDelta:-0.8, spendDelta:2, ctrDelta:-1.2, status:'underperforming', daysSince:7,
      budget:78000, budgetPct:13, performanceScore:32, confidenceLevel:80, lastUpdated:now },
    { id:'c5', name:'Video 30s — Produk Demo', platform, adSetId:'as3', campaignId:'camp1',
      impressions:8200, reach:7400, clicks:246, spend:147600, revenue:177120, conversions:6,
      frequency:1.2, ctr:3.0, cpm:18000, cpc:600, roas:1.2, cvr:2.4, cpa:24600, aov:29520,
      roasDelta:0, spendDelta:0, ctrDelta:0, status:'testing', daysSince:2,
      budget:50000, budgetPct:8, performanceScore:28, confidenceLevel:35, lastUpdated:now },
    { id:'c6', name:'Carousel Produk — 5 Slide', platform, adSetId:'as3', campaignId:'camp1',
      impressions:18500, reach:15200, clicks:444, spend:333000, revenue:399600, conversions:8,
      frequency:4.2, ctr:2.4, cpm:18000, cpc:750, roas:1.2, cvr:1.8, cpa:41625, aov:49950,
      roasDelta:-1.2, spendDelta:1, ctrDelta:-0.8, status:'underperforming', daysSince:9,
      budget:112000, budgetPct:19, performanceScore:22, confidenceLevel:90, lastUpdated:now },
  ]
}

// ── Atoms ─────────────────────────────────────────────────────
function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:C.surface, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden', ...style }}>{children}</div>
}

function CardH({ icon, title, sub, badge, color=C.amber, action }: {
  icon:string; title:string; sub?:string; badge?:string; color?:string; action?:React.ReactNode
}) {
  return (
    <div style={{ padding:'13px 18px', borderBottom:`1px solid ${C.border}`, background:C.bg, display:'flex', alignItems:'center', gap:'9px' }}>
      <span style={{ fontSize:'18px' }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>{title}</div>
        {sub && <div style={{ fontSize:'10px', color:C.inkMuted, marginTop:'1px' }}>{sub}</div>}
      </div>
      {badge && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'99px', background:`${color}18`, color }}>{badge}</span>}
      {action}
    </div>
  )
}

function Insight({ text, color=C.amber }: { text:string; color?:string }) {
  return (
    <div style={{ padding:'10px 13px', borderRadius:'10px', background:`${color}08`, border:`1px solid ${color}25`, display:'flex', gap:'8px', alignItems:'flex-start' }}>
      <Sparkles size={13} color={color} style={{ flexShrink:0, marginTop:'1px' }}/>
      <div style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.6 }}>{text}</div>
    </div>
  )
}

// ── Health ring ───────────────────────────────────────────────
function HealthRing({ score, health }: { score:number; health:string }) {
  const r    = 48, circ = 2*Math.PI*r, dash = (score/100)*circ
  const col  = health==='excellent'?C.green:health==='good'?C.blue:health==='needs_attention'?C.orange:C.red
  const label= health==='excellent'?'Excellent':health==='good'?'Good':health==='needs_attention'?'Attention!':'Critical'
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
      <div style={{ position:'relative', width:'110px', height:'110px' }}>
        <svg width="110" height="110" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke={C.border} strokeWidth="8"/>
          <circle cx="55" cy="55" r={r} fill="none" stroke={col} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray .7s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:'26px', fontWeight:900, color:col, letterSpacing:'-0.03em', lineHeight:1 }}>{score}</div>
          <div style={{ fontSize:'9px', color:C.inkDim }}>/ 100</div>
        </div>
      </div>
      <div style={{ fontSize:'13px', fontWeight:700, color:col }}>{label}</div>
    </div>
  )
}

// ── Creative row card ─────────────────────────────────────────
function CreativeRow({ c, allocation, onTogglePause, expanded, onToggleExpand }: {
  c:CreativeMetric; allocation?:BudgetAllocation; onTogglePause:()=>void;
  expanded:boolean; onToggleExpand:()=>void
}) {
  const sc  = STATUS_CONFIG[c.status]
  const ac  = allocation ? ACTION_CONFIG[allocation.action] : null
  const bench = PLATFORM_BENCHMARKS[c.platform]

  return (
    <div style={{ borderRadius:'12px', border:`1.5px solid ${c.status==='scaling'?C.green+'40':c.status==='underperforming'?C.red+'30':C.border}`, background:c.status==='scaling'?C.greenLt:c.status==='underperforming'?`${C.red}03`:C.surface, overflow:'hidden', boxShadow:C.sh }}>
      {/* Row header */}
      <div style={{ padding:'12px 14px', display:'flex', gap:'12px', alignItems:'center' }}>
        {/* Status badge */}
        <div style={{ padding:'3px 9px', borderRadius:'6px', background:sc.bg, color:sc.color, fontSize:'10px', fontWeight:800, flexShrink:0, whiteSpace:'nowrap' }}>
          {sc.icon} {sc.label}
        </div>

        {/* Name */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
          <div style={{ fontSize:'10px', color:C.inkMuted }}>{c.daysSince}h data · {fmtN(c.impressions)} impresi · freq {c.frequency.toFixed(1)}</div>
        </div>

        {/* Key metrics */}
        <div style={{ display:'flex', gap:'16px', fontSize:'11px', flexShrink:0 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:C.inkDim, fontSize:'9px' }}>ROAS</div>
            <div style={{ fontWeight:800, color:c.roas>=bench.goodROAS?C.green:c.roas>=bench.minROAS?C.amber:C.red, fontSize:'14px' }}>{fmtROAS(c.roas)}</div>
            {c.roasDelta !== 0 && <div style={{ fontSize:'9px', color:c.roasDelta>0?C.green:C.red }}>{c.roasDelta>0?'▲':'▼'}{Math.abs(c.roasDelta).toFixed(1)}</div>}
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:C.inkDim, fontSize:'9px' }}>CTR</div>
            <div style={{ fontWeight:700, color:C.ink }}>{c.ctr.toFixed(1)}%</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:C.inkDim, fontSize:'9px' }}>Spend</div>
            <div style={{ fontWeight:700, color:C.ink }}>{fmtRp(c.spend)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:C.inkDim, fontSize:'9px' }}>Score</div>
            <div style={{ fontWeight:700, color:c.performanceScore>=70?C.green:c.performanceScore>=45?C.amber:C.red }}>{c.performanceScore}</div>
          </div>
        </div>

        {/* Allocation action */}
        {ac && (
          <div style={{ padding:'4px 10px', borderRadius:'7px', background:`${ac.color}12`, border:`1px solid ${ac.color}25`, color:ac.color, fontSize:'10px', fontWeight:700, flexShrink:0, display:'flex', alignItems:'center', gap:'4px' }}>
            {ac.icon} {ac.label}
            {allocation && allocation.targetBudget !== allocation.currentBudget && (
              <span style={{ fontSize:'9px' }}>
                {fmtRp(allocation.currentBudget)} → {fmtRp(allocation.targetBudget)}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
          <button type="button" onClick={onTogglePause}
            style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${c.status==='paused'?C.green:C.border}`, background:c.status==='paused'?C.greenLt:C.surface, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}>
            {c.status==='paused' ? <Play size={12} color={C.green}/> : <Pause size={12} color={C.inkMuted}/>}
          </button>
          <button type="button" onClick={onToggleExpand}
            style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            {expanded ? <ChevronUp size={12} color={C.inkMuted}/> : <ChevronDown size={12} color={C.inkMuted}/>}
          </button>
        </div>
      </div>

      {/* Performance bar */}
      <div style={{ height:'4px', background:C.border }}>
        <div style={{ height:'100%', width:`${c.performanceScore}%`, background:c.performanceScore>=70?C.green:c.performanceScore>=45?C.amber:C.red, transition:'width .6s ease' }}/>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding:'12px 14px', borderTop:`1px solid ${C.border}`, background:C.bg }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:'10px', marginBottom:'10px' }}>
            {[
              { l:'Revenue',    v:fmtRp(c.revenue),       color:C.green  },
              { l:'Conversions',v:String(c.conversions),   color:C.blue   },
              { l:'CVR',        v:`${c.cvr.toFixed(1)}%`,  color:C.purple },
              { l:'CPA',        v:fmtRp(c.cpa),            color:C.orange },
              { l:'CPM',        v:fmtRp(c.cpm),            color:C.teal   },
              { l:'CPC',        v:fmtRp(c.cpc),            color:C.ink    },
              { l:'Reach',      v:fmtN(c.reach),           color:C.ink    },
              { l:'AOV',        v:fmtRp(c.aov),            color:C.green  },
            ].map((m, i) => (
              <div key={i} style={{ padding:'8px 10px', borderRadius:'8px', background:C.surface, border:`1px solid ${C.border}`, textAlign:'center' }}>
                <div style={{ fontSize:'14px', fontWeight:800, color:m.color }}>{m.v}</div>
                <div style={{ fontSize:'9px', color:C.inkDim }}>{m.l}</div>
              </div>
            ))}
          </div>
          {/* Allocation reason */}
          {allocation?.reason && (
            <div style={{ padding:'9px 12px', borderRadius:'9px', background:`${ACTION_CONFIG[allocation.action].color}08`, border:`1px solid ${ACTION_CONFIG[allocation.action].color}20`, fontSize:'11px', color:C.inkSub, lineHeight:1.5 }}>
              <span style={{ fontWeight:700, color:ACTION_CONFIG[allocation.action].color }}>{ACTION_CONFIG[allocation.action].icon} Rekomendasi:</span>{' '}{allocation.reason}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Alert card ────────────────────────────────────────────────
function AlertCard({ alert, onDismiss }: { alert:BudgetAlert; onDismiss:()=>void }) {
  const sevBg  = alert.severity==='critical'?C.red:alert.severity==='warning'?C.orange:C.blue
  const sevLt  = alert.severity==='critical'?C.redLt:alert.severity==='warning'?C.orangeLt:C.blueLt
  const SevIcon= alert.severity==='critical'?AlertCircle:alert.severity==='warning'?AlertTriangle:Info
  return (
    <div style={{ padding:'12px 14px', borderRadius:'12px', border:`1.5px solid ${sevBg}25`, background:sevLt, display:'flex', gap:'10px', alignItems:'flex-start' }}>
      <SevIcon size={16} color={sevBg} style={{ flexShrink:0, marginTop:'1px' }}/>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'3px' }}>{alert.title}</div>
        <div style={{ fontSize:'11px', color:C.inkSub, lineHeight:1.5, marginBottom:'5px' }}>{alert.message}</div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
          {alert.metric && <span style={{ fontSize:'9px', fontWeight:600, padding:'1px 6px', borderRadius:'4px', background:`${sevBg}15`, color:sevBg }}>{alert.metric}: {alert.value?.toFixed(1)}</span>}
          {alert.autoActed && <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'4px', background:C.greenLt, color:C.green }}>✅ Auto-acted</span>}
          <span style={{ fontSize:'9px', color:C.inkDim }}>{new Date(alert.timestamp).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      </div>
      <button onClick={onDismiss} style={{ width:'22px', height:'22px', borderRadius:'6px', border:`1px solid ${C.border}`, background:C.surface, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <X size={11} color={C.inkMuted}/>
      </button>
    </div>
  )
}

// ── Chart tooltip ─────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'9px', padding:'9px 12px', boxShadow:C.sm, fontSize:'12px' }}>
      <div style={{ fontWeight:700, color:C.ink, marginBottom:'5px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'2px' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:p.color }}/>
          <span style={{ color:C.inkMuted }}>{p.name}:</span>
          <strong style={{ color:C.ink }}>{typeof p.value === 'number' && p.value > 10000 ? fmtRp(p.value) : typeof p.value === 'number' ? p.value.toFixed(p.value < 10 ? 1 : 0) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function BudgetOptimizerPage() {
  const [activeTab,    setActiveTab]    = useState<ActiveTab>('allocation')
  const [platform,     setPlatform]     = useState<PlatformId>('meta')
  const [creatives,    setCreatives]    = useState<CreativeMetric[]>(() => makeDemoCreatives('meta'))
  const [result,       setResult]       = useState<OptimizerResult | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  // Simulation state
  const [simLoading, setSimLoading] = useState(false)
  const [simResult,  setSimResult]  = useState<any>(null)
  const [simDays,    setSimDays]    = useState(14)
  const [simOptIdx,  setSimOptIdx]  = useState<number|null>(null)

  // Auto-bid rules state
  const [bidRules, setBidRules] = useState([
    { id:'r1', name:'ROAS < 1.5 → Pause',      enabled:true,  condition:{ metric:'roas',       op:'<',  val:1.5,   days:3 }, action:'pause',     magnitude:0,  cooldown:24 },
    { id:'r2', name:'ROAS > 4.0 → Scale +20%', enabled:true,  condition:{ metric:'roas',       op:'>',  val:4.0,   days:7 }, action:'scale',     magnitude:20, cooldown:48 },
    { id:'r3', name:'Frequency > 5 → Pause',   enabled:false, condition:{ metric:'frequency',  op:'>',  val:5.0,   days:7 }, action:'pause',     magnitude:0,  cooldown:24 },
    { id:'r4', name:'CTR Drop 30% → Alert',    enabled:true,  condition:{ metric:'ctr',        op:'<',  val:30,    days:3 }, action:'notify',    magnitude:0,  cooldown:6  },
    { id:'r5', name:'CPC > Rp10K → Lower Bid', enabled:false, condition:{ metric:'cpc',        op:'>',  val:10000, days:7 }, action:'lower-bid', magnitude:15, cooldown:12 },
  ])
  const [showAddRule, setShowAddRule] = useState(false)
  const [bidStrategy, setBidStrategy] = useState<'lowest-cost'|'cost-cap'|'bid-cap'|'target-roas'>('lowest-cost')
  const [targetROAS,  setTargetROAS]  = useState(3.0)
  const [costCapVal,  setCostCapVal]  = useState(50000)

  const [expandedIds,  setExpandedIds]  = useState<Set<string>>(new Set())
  const [alerts,       setAlerts]       = useState<BudgetAlert[]>([])

  // Guardian config
  const [totalDailyBudget, setTotalDailyBudget] = useState(600000)
  const [roasFloor,        setRoasFloor]         = useState(2.5)
  const [roasCeiling,      setRoasCeiling]       = useState(5.0)
  const [softCap,          setSoftCap]            = useState(80)
  const [hardCap,          setHardCap]            = useState(95)
  const [autoPause,        setAutoPause]          = useState(false)
  const [autoScale,        setAutoScale]          = useState(false)
  const [freqCap,          setFreqCap]            = useState(4.0)
  const [ctrDrop,          setCtrDrop]            = useState(20)
  const [spendSpike,       setSpendSpike]         = useState(30)
  const [guardianOn,       setGuardianOn]         = useState(false)

  // Simulate current spend (demo)
  const currentHour  = new Date().getHours()
  const currentSpend = Math.floor(totalDailyBudget * (expectedSpendPct(currentHour)/100) * 0.95)

  const runOptimizer = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const config: Partial<GuardianConfig> = {
        totalDailyBudget, softCap, hardCap,
        roasFloor, roasCeiling,
        frequencyCapWarning: freqCap,
        ctrDropThreshold:    ctrDrop,
        spendSpikeThreshold: spendSpike,
        autoPauseEnabled:    autoPause,
        autoScaleEnabled:    autoScale,
        checkIntervalMin:    60,
      }
      const res  = await fetch('/api/budget/analyze', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({
          platform, creatives, config, currentSpend, currentHour,
          niche: 'fashion',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setAlerts(data.alerts ?? [])
    } catch(e:any) { setError(e.message) }
    finally { setLoading(false) }
  }, [platform, creatives, totalDailyBudget, softCap, hardCap, roasFloor, roasCeiling,
      freqCap, ctrDrop, spendSpike, autoPause, autoScale, currentSpend, currentHour])

  const toggleExpand = (id:string) => setExpandedIds(p => { const s=new Set(p); s.has(id)?s.delete(id):s.add(id); return s })
  const togglePause  = (id:string) => setCreatives(p => p.map(c => c.id===id ? {...c, status:(c.status==='paused'?'monitoring':'paused') as CreativeStatus} : c))
  const dismissAlert = (id:string) => setAlerts(p => p.filter(a => a.id !== id))

  // ── Run budget simulation ─────────────────────────────────────
  const runSimulation = useCallback(async () => {
    setSimLoading(true)
    try {
      const res  = await fetch('/api/budget/simulate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          creatives:   creatives.map(c => ({
            id:c.id, name:c.name, roas:c.roas, ctr:c.ctr, cvr:c.cvr ?? 0,
            revenue:c.revenue, spend:c.spend, budget:c.budget,
            impressions:c.impressions, daysSince:c.daysSince, status:c.status,
          })),
          totalBudget:   totalDailyBudget,
          platform,
          daysAhead:     simDays,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSimResult(data)
        setSimOptIdx(data.optimalIdx ?? null)
      }
    } catch { /* silent */ }
    finally { setSimLoading(false) }
  }, [creatives, totalDailyBudget, platform, simDays])

  // ── Toggle bid rule ───────────────────────────────────────────
  const toggleRule = (id: string) =>
    setBidRules(p => p.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))

  const deleteRule = (id: string) =>
    setBidRules(p => p.filter(r => r.id !== id))

  const applyAllocations = () => {
    if (!result) return
    setCreatives(p => p.map(c => {
      const alloc = result.allocations.find(a => a.creativeId === c.id)
      if (!alloc) return c
      return { ...c, budget:alloc.targetBudget, status:alloc.action==='pause'?'paused':c.status }
    }))
  }

  // Pacing chart data
  const pacingData = Array.from({length:24},(_,h) => ({
    hour:  `${h}:00`,
    expected: parseFloat((expectedSpendPct(h) / 100 * totalDailyBudget / 1000).toFixed(0)),
    actual:   h <= currentHour ? parseFloat((expectedSpendPct(h) / 100 * totalDailyBudget * 0.95 / 1000).toFixed(0)) : null,
  }))

  // ROAS comparison data
  const roasData = creatives.map(c => ({ name:c.name.substring(0,15)+'...', roas:c.roas, target:roasFloor, revenue:c.revenue/1000 }))

  const bench    = PLATFORM_BENCHMARKS[platform]
  const critsCount = alerts.filter(a => a.severity==='critical').length
  const warnCount  = alerts.filter(a => a.severity==='warning').length
  const totalSpend = creatives.reduce((s,c)=>s+c.spend,0)
  const totalRev   = creatives.reduce((s,c)=>s+c.revenue,0)
  const overallROAS= totalSpend > 0 ? totalRev/totalSpend : 0

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
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:C.greenLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>⚡</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>Budget Optimizer & Auto-Bidding</div>
            <div style={{ fontSize:'10px', color:C.inkMuted }}>Smart Allocation · ROAS Optimizer · Daily Guardian</div>
          </div>
        </div>
        {/* Alert badge */}
        {(critsCount + warnCount) > 0 && (
          <div style={{ display:'flex', gap:'6px', marginLeft:'12px' }}>
            {critsCount > 0 && <span style={{ fontSize:'11px', fontWeight:800, padding:'3px 9px', borderRadius:'99px', background:C.red, color:'#fff' }}>{critsCount} Critical</span>}
            {warnCount  > 0 && <span style={{ fontSize:'11px', fontWeight:800, padding:'3px 9px', borderRadius:'99px', background:C.orange, color:'#fff' }}>{warnCount} Warning</span>}
          </div>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap:'8px', alignItems:'center' }}>
          {/* Platform selector */}
          <select value={platform} onChange={e=>{setPlatform(e.target.value as PlatformId); setCreatives(makeDemoCreatives(e.target.value as PlatformId)); setResult(null)}}
            style={{ padding:'6px 10px', borderRadius:'8px', border:`1px solid ${C.border}`, fontSize:'12px', fontFamily:'inherit', background:C.surface, outline:'none', cursor:'pointer' }}>
            <option value="meta">📘 Meta Ads</option>
            <option value="tiktok">🎵 TikTok Ads</option>
            <option value="google-display">🔍 Google</option>
          </select>
          <button type="button" onClick={runOptimizer} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'9px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:C.sa, opacity:loading?.7:1 }}>
            {loading ? <Loader2 size={13} style={{ animation:'spin .8s linear infinite' }}/> : <Sparkles size={13}/>}
            {loading ? 'Analyzing...' : 'Run Optimizer'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'1300px', margin:'0 auto', padding:'20px' }}>

        {error && (
          <div style={{ padding:'12px 14px', background:C.redLt, border:`1px solid ${C.red}30`, borderRadius:'10px', marginBottom:'16px', display:'flex', gap:'8px', alignItems:'center', fontSize:'12px', color:C.red }}>
            <AlertCircle size={14}/>{error}
          </div>
        )}

        {/* ── Summary KPI strip ────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'10px', marginBottom:'18px' }} className="kpi-strip">
          {[
            { l:'Total Budget/hari', v:fmtRp(totalDailyBudget), color:C.amber, icon:'💰' },
            { l:'Total Spend',       v:fmtRp(totalSpend),        color:C.purple, icon:'📤' },
            { l:'Total Revenue',     v:fmtRp(totalRev),           color:C.green,  icon:'💵' },
            { l:'Overall ROAS',      v:fmtROAS(overallROAS),      color:overallROAS>=roasFloor?C.green:C.red, icon:'🎯' },
            { l:'Creatives Active',  v:`${creatives.filter(c=>c.status!=='paused').length}/${creatives.length}`, color:C.blue, icon:'🎨' },
            { l:'Alerts',            v:`${alerts.length} alerts`,  color:critsCount>0?C.red:warnCount>0?C.orange:C.green, icon:'🔔' },
          ].map((k,i) => (
            <div key={i} style={{ padding:'13px 14px', borderRadius:'12px', background:C.surface, border:`1px solid ${C.border}`, boxShadow:C.sh }}>
              <div style={{ fontSize:'18px', marginBottom:'4px' }}>{k.icon}</div>
              <div style={{ fontSize:'clamp(14px,1.5vw,20px)', fontWeight:900, color:k.color, letterSpacing:'-0.03em', lineHeight:1, marginBottom:'2px' }}>{k.v}</div>
              <div style={{ fontSize:'10px', color:C.inkDim }}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────── */}
        <div style={{ display:'flex', gap:'5px', marginBottom:'18px' }}>
          {[
            { id:'allocation' as ActiveTab, l:'💰 Smart Allocation',    badge:result?`${result.allocations.length} creative`:undefined },
            { id:'roas'       as ActiveTab, l:'🎯 ROAS Optimizer',      badge:result?`${result.winners.length}W / ${result.losers.length}L`:undefined },
            { id:'guardian'   as ActiveTab, l:'🛡️ Daily Guardian',     badge:alerts.length>0?`${alerts.length}`:undefined, badgeColor:critsCount>0?C.red:C.orange },
            { id:'simulate'  as ActiveTab, l:'📊 Simulasi Budget',   badge:undefined, badgeColor:C.purple },
            { id:'autobid'   as ActiveTab, l:'🤖 Auto-Bid Rules',    badge:`${bidRules.filter(r=>r.enabled).length}`, badgeColor:C.blue },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 16px', borderRadius:'99px', border:`1.5px solid ${activeTab===t.id?C.amber:C.border}`, background:activeTab===t.id?C.amberXlt:C.surface, fontSize:'12px', fontWeight:activeTab===t.id?700:500, color:activeTab===t.id?C.amberDk:C.inkMuted, cursor:'pointer', transition:'all .15s', fontFamily:'inherit', boxShadow:activeTab===t.id?C.sa:C.sh, flexShrink:0 }}>
              {t.l}
              {t.badge && <span style={{ fontSize:'10px', fontWeight:800, padding:'1px 7px', borderRadius:'99px', background:activeTab===t.id?`${C.amber}30`:(t as any).badgeColor?`${(t as any).badgeColor}20`:C.bg, color:activeTab===t.id?C.amberDk:(t as any).badgeColor??C.ink }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            TAB: SMART ALLOCATION
        ══════════════════════════════════════════════ */}
        {activeTab === 'allocation' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'16px', alignItems:'flex-start' }} className="alloc-grid">
            {/* Left: creative list */}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <Card>
                <CardH icon="💰" title="Creative Budget Allocation" sub="AI-computed budget distribution berdasarkan performance score"
                  badge={`${bench.minROAS}x min ROAS`}
                  action={
                    result && (
                      <button type="button" onClick={applyAllocations}
                        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'8px', border:'none', background:`linear-gradient(135deg,${C.green},${C.teal})`, color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        <Check size={12}/> Apply All
                      </button>
                    )
                  }/>
                <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {loading && !result && (
                    <div style={{ padding:'32px', textAlign:'center' }}>
                      <Loader2 size={28} color={C.amber} style={{ animation:'spin .9s linear infinite', display:'block', margin:'0 auto 12px' }}/>
                      <div style={{ fontSize:'13px', color:C.inkMuted }}>Analyzing {creatives.length} creatives...</div>
                    </div>
                  )}
                  {!loading && !result && (
                    <div style={{ padding:'32px', textAlign:'center', color:C.inkMuted, fontSize:'13px' }}>
                      Klik <strong>"Run Optimizer"</strong> untuk analisis budget allocation AI berdasarkan data performa real kamu.
                    </div>
                  )}
                  {creatives.map(c => (
                    <CreativeRow
                      key={c.id}
                      c={c}
                      allocation={result?.allocations.find(a => a.creativeId === c.id)}
                      onTogglePause={() => togglePause(c.id)}
                      expanded={expandedIds.has(c.id)}
                      onToggleExpand={() => toggleExpand(c.id)}
                    />
                  ))}
                </div>
              </Card>

              {/* AI Insights */}
              {result?.insights && result.insights.length > 0 && (
                <Card>
                  <CardH icon="🧠" title="AI Budget Insights" sub="Rekomendasi spesifik berdasarkan data performa" badge="Claude AI" color={C.purple}/>
                  <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'7px' }}>
                    {result.insights.map((insight, i) => (
                      <Insight key={i} text={insight} color={i===0?C.green:i===1?C.blue:C.amber}/>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right: summary + config */}
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {/* Health score */}
              {result && (
                <Card>
                  <CardH icon="💊" title="Campaign Health" sub="Skor kesehatan keseluruhan campaign"/>
                  <div style={{ padding:'18px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                    <HealthRing score={result.healthScore} health={result.health}/>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%' }}>
                      {[
                        { l:'Overall ROAS', v:fmtROAS(result.totalROAS), color:result.totalROAS>=roasFloor?C.green:C.red },
                        { l:'Target ROAS',  v:fmtROAS(result.targetROAS), color:C.amber },
                        { l:'Winners',      v:`${result.winners.length}`,  color:C.green },
                        { l:'Losers',       v:`${result.losers.length}`,   color:C.red   },
                      ].map((s,i) => (
                        <div key={i} style={{ padding:'9px 10px', borderRadius:'9px', background:C.bg, border:`1px solid ${C.border}`, textAlign:'center' }}>
                          <div style={{ fontSize:'15px', fontWeight:800, color:s.color }}>{s.v}</div>
                          <div style={{ fontSize:'9px', color:C.inkDim }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    {/* Budget flow summary */}
                    {result.allocations.length > 0 && (
                      <div style={{ width:'100%', fontSize:'11px' }}>
                        <div style={{ fontWeight:700, color:C.ink, marginBottom:'7px' }}>Budget Reallocation</div>
                        {result.allocations.filter(a => a.action !== 'hold').slice(0,4).map((a, i) => {
                          const ac = ACTION_CONFIG[a.action]
                          return (
                            <div key={i} style={{ display:'flex', gap:'6px', alignItems:'center', padding:'5px 0', borderBottom:`1px solid ${C.border}` }}>
                              <span style={{ color:ac.color, width:'16px', textAlign:'center' }}>{ac.icon}</span>
                              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:C.inkSub }}>{a.creativeName.substring(0,20)}</span>
                              <span style={{ fontWeight:700, color:a.changePct>0?C.green:a.changePct<0?C.red:C.amber, whiteSpace:'nowrap' }}>
                                {a.changePct>0?'+':''}{a.changePct.toFixed(0)}%
                              </span>
                            </div>
                          )
                        })}
                        <div style={{ marginTop:'8px', padding:'8px 10px', borderRadius:'8px', background:C.greenLt, border:`1px solid ${C.green}25`, fontSize:'10px', color:C.green, fontWeight:700 }}>
                          Projected Revenue: {fmtRp(result.allocations.reduce((s,a)=>s+(a.projectedRev||0),0))}/day
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Budget config */}
              <Card>
                <CardH icon="⚙️" title="Budget Config" sub="Parameter optimasi"/>
                <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  {[
                    { l:'Total Budget/hari', v:totalDailyBudget, set:setTotalDailyBudget, step:50000, fmt:(v:number)=>fmtRp(v) },
                    { l:'ROAS Floor (Pause)', v:roasFloor, set:setRoasFloor, step:0.5, min:0.5, max:10, fmt:(v:number)=>`${v}x` },
                    { l:'ROAS Ceiling (Scale)', v:roasCeiling, set:setRoasCeiling, step:0.5, min:1, max:20, fmt:(v:number)=>`${v}x` },
                  ].map(f => (
                    <div key={f.l}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'4px' }}>
                        <span style={{ fontWeight:600, color:C.inkMuted }}>{f.l}</span>
                        <span style={{ fontWeight:800, color:C.amber }}>{f.fmt(f.v)}</span>
                      </div>
                      <input type="range" min={f.min??10000} max={f.max??5000000} step={f.step}
                        value={f.v} onChange={e=>f.set(parseFloat(e.target.value))}
                        style={{ width:'100%', accentColor:C.amber }}/>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: ROAS OPTIMIZER
        ══════════════════════════════════════════════ */}
        {activeTab === 'roas' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* ROAS chart */}
            <Card>
              <CardH icon="🎯" title="ROAS per Creative" sub={`Target: ${roasFloor}x | Scale signal: ${roasCeiling}x | Platform: ${platform}`}/>
              <div style={{ padding:'16px 18px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={roasData} margin={{ top:4, right:4, bottom:0, left:-15 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize:9, fill:C.inkMuted }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:C.inkMuted }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}x`}/>
                    <Tooltip content={<ChartTip/>}/>
                    <ReferenceLine y={roasFloor}   stroke={C.red}   strokeDasharray="4 3" label={{ value:`Floor ${roasFloor}x`, position:'right', fontSize:10, fill:C.red }}/>
                    <ReferenceLine y={roasCeiling} stroke={C.green} strokeDasharray="4 3" label={{ value:`Scale ${roasCeiling}x`, position:'right', fontSize:10, fill:C.green }}/>
                    <Bar dataKey="roas" name="ROAS" radius={[6,6,0,0]}>
                      {roasData.map((d, i) => (
                        <Cell key={i} fill={d.roas >= roasCeiling ? C.green : d.roas >= roasFloor ? C.blue : C.red}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', gap:'12px', justifyContent:'center', marginTop:'8px', fontSize:'11px' }}>
                  {[[C.green,'Scale Zone'],[C.blue,'On Target'],[C.red,'Below Floor']].map(([c,l]) => (
                    <div key={l} style={{ display:'flex', alignItems:'center', gap:'4px', color:C.inkMuted }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:c as string }}/>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Winners / Losers grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }} className="win-grid">
              {/* Winners */}
              <Card>
                <CardH icon="🏆" title="Winners — Scale These" sub="ROAS di atas target — naikkan budget" badge={`${(result?.winners ?? creatives.filter(c=>c.roas>=bench.goodROAS)).length} winner`} color={C.green}/>
                <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {(result?.winners ?? creatives.filter(c=>c.roas>=bench.goodROAS)).length === 0 ? (
                    <div style={{ padding:'20px', textAlign:'center', color:C.inkMuted, fontSize:'12px' }}>Belum ada winner. Jalankan optimizer untuk identifikasi.</div>
                  ) : (result?.winners ?? creatives.filter(c=>c.roas>=bench.goodROAS)).map(c => (
                    <div key={c.id} style={{ padding:'12px 14px', borderRadius:'12px', border:`1px solid ${C.green}30`, background:C.greenLt }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'8px' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'2px' }}>{c.name}</div>
                          <div style={{ fontSize:'10px', color:C.inkMuted }}>{fmtN(c.impressions)} impresi · {c.daysSince}h data</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'20px', fontWeight:900, color:C.green, lineHeight:1 }}>{fmtROAS(c.roas)}</div>
                          <div style={{ fontSize:'9px', color:C.green??(C.green) }}>ROAS</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', fontSize:'10px' }}>
                        {[
                          { l:'Revenue', v:fmtRp(c.revenue) },
                          { l:'CVR', v:`${c.cvr.toFixed(1)}%` },
                          { l:'Score', v:`${c.performanceScore}/100` },
                        ].map((m,i) => (
                          <div key={i} style={{ flex:1, textAlign:'center', padding:'5px 4px', borderRadius:'7px', background:C.greenXlt??C.greenLt, border:`1px solid ${C.green}20` }}>
                            <div style={{ fontWeight:700, color:C.green }}>{m.v}</div>
                            <div style={{ color:C.inkDim, fontSize:'9px' }}>{m.l}</div>
                          </div>
                        ))}
                      </div>
                      {/* Scale action */}
                      <div style={{ marginTop:'8px', display:'flex', gap:'6px', alignItems:'center', fontSize:'11px' }}>
                        <Zap size={12} color={C.green}/>
                        <span style={{ color:C.green, fontWeight:700 }}>Rekomendasi: scale budget +{ALLOCATION_RULES.maxBudgetIncreasePct}%</span>
                        <button type="button" onClick={() => setCreatives(p => p.map(cr => cr.id===c.id ? {...cr, budget:Math.round(cr.budget*1.2)} : cr))}
                          style={{ marginLeft:'auto', padding:'3px 9px', borderRadius:'6px', border:'none', background:C.green, color:'#fff', fontSize:'10px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          Apply +20%
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Losers */}
              <Card>
                <CardH icon="📉" title="Losers — Pause These" sub="ROAS di bawah floor — pertimbangkan pause" badge={`${(result?.losers ?? creatives.filter(c=>c.roas<bench.minROAS)).length} loser`} color={C.red}/>
                <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {(result?.losers ?? creatives.filter(c=>c.roas<bench.minROAS&&c.status!=='testing')).length === 0 ? (
                    <div style={{ padding:'20px', textAlign:'center', color:C.inkMuted, fontSize:'12px' }}>Semua creative di atas ROAS minimum. 🎉</div>
                  ) : (result?.losers ?? creatives.filter(c=>c.roas<bench.minROAS&&c.status!=='testing')).map(c => (
                    <div key={c.id} style={{ padding:'12px 14px', borderRadius:'12px', border:`1px solid ${C.red}30`, background:C.redLt }}>
                      <div style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom:'8px' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'2px' }}>{c.name}</div>
                          <div style={{ fontSize:'10px', color:C.inkMuted }}>{fmtN(c.impressions)} impresi · Freq {c.frequency.toFixed(1)}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'20px', fontWeight:900, color:C.red, lineHeight:1 }}>{fmtROAS(c.roas)}</div>
                          <div style={{ fontSize:'9px', color:C.red }}>ROAS</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', fontSize:'10px', marginBottom:'8px' }}>
                        {[
                          { l:'Spend Wasted', v:fmtRp(c.spend) },
                          { l:'CPA', v:fmtRp(c.cpa) },
                          { l:'CTR', v:`${c.ctr.toFixed(1)}%` },
                        ].map((m,i) => (
                          <div key={i} style={{ flex:1, textAlign:'center', padding:'5px 4px', borderRadius:'7px', background:'#FEF2F2', border:`1px solid ${C.red}20` }}>
                            <div style={{ fontWeight:700, color:C.red }}>{m.v}</div>
                            <div style={{ color:C.inkDim, fontSize:'9px' }}>{m.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button type="button" onClick={() => togglePause(c.id)}
                          style={{ flex:1, padding:'6px', borderRadius:'8px', border:'none', background:c.status==='paused'?C.greenLt:C.red, color:c.status==='paused'?C.green:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                          {c.status==='paused'?<><Play size={12}/>Resume</>:<><Pause size={12}/>Pause</>}
                        </button>
                        <Link href="/studio" style={{ flex:1, padding:'6px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:'11px', fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                          🎨 Buat Creative Baru
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: DAILY GUARDIAN
        ══════════════════════════════════════════════ */}
        {activeTab === 'guardian' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Guardian toggle + spend pacing */}
            <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'14px' }} className="guard-grid">
              {/* Config panel */}
              <Card>
                <CardH icon="🛡️" title="Budget Guardian" sub="Auto-monitor pengeluaran harian"
                  badge={guardianOn?'ACTIVE':'OFF'} color={guardianOn?C.green:C.inkMuted}/>
                <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  {/* Toggle */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:'11px', background:guardianOn?C.greenLt:C.bg, border:`1.5px solid ${guardianOn?C.green:C.border}`, transition:'all .2s' }}>
                    <div>
                      <div style={{ fontSize:'12px', fontWeight:700, color:guardianOn?C.green:C.ink }}>Guardian {guardianOn?'Aktif':'Nonaktif'}</div>
                      <div style={{ fontSize:'10px', color:C.inkMuted, marginTop:'2px' }}>Monitor budget setiap 1 jam</div>
                    </div>
                    <button type="button" onClick={() => setGuardianOn(p => !p)}
                      style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', background:guardianOn?C.green:C.inkDim, cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:'2px', left:guardianOn?'22px':'2px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.3)' }}/>
                    </button>
                  </div>

                  {/* Threshold configs */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {[
                      { l:`Soft Cap (Alert at ${softCap}%)`, v:softCap, set:setSoftCap, min:50, max:90, step:5, color:C.orange },
                      { l:`Hard Cap (Pause at ${hardCap}%)`, v:hardCap, set:setHardCap, min:70, max:100, step:5, color:C.red },
                      { l:`ROAS Floor (Pause at ${roasFloor}x)`, v:roasFloor, set:setRoasFloor, min:0.5, max:5, step:0.5, color:C.red },
                      { l:`Freq Cap (Alert at ${freqCap})`, v:freqCap, set:setFreqCap, min:2, max:8, step:0.5, color:C.orange },
                      { l:`CTR Drop Threshold (${ctrDrop}%)`, v:ctrDrop, set:setCtrDrop, min:5, max:50, step:5, color:C.blue },
                    ].map(f => (
                      <div key={f.l}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', marginBottom:'3px' }}>
                          <span style={{ color:C.inkMuted }}>{f.l}</span>
                          <span style={{ fontWeight:700, color:f.color }}>{f.v}</span>
                        </div>
                        <input type="range" min={f.min} max={f.max} step={f.step} value={f.v} onChange={e=>f.set(parseFloat(e.target.value))}
                          style={{ width:'100%', accentColor:f.color }}/>
                      </div>
                    ))}
                  </div>

                  {/* Auto actions */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px', padding:'12px', borderRadius:'10px', background:C.bg, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:C.ink, marginBottom:'4px' }}>Auto Actions</div>
                    {[
                      { l:'Auto-pause jika ROAS < floor', v:autoPause, set:setAutoPause, risk:'high' },
                      { l:'Auto-scale jika ROAS > ceiling', v:autoScale, set:setAutoScale, risk:'medium' },
                    ].map(a => (
                      <div key={a.l} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <button type="button" onClick={()=>a.set(p=>!p)}
                          style={{ width:'36px', height:'20px', borderRadius:'10px', border:'none', background:a.v?C.amber:C.inkDim, cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                          <div style={{ position:'absolute', top:'2px', left:a.v?'18px':'2px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                        </button>
                        <span style={{ fontSize:'11px', color:C.inkSub }}>{a.l}</span>
                        <span style={{ fontSize:'9px', padding:'1px 5px', borderRadius:'3px', background:a.risk==='high'?C.redLt:C.amberXlt, color:a.risk==='high'?C.red:C.amberDk, fontWeight:700, marginLeft:'auto' }}>
                          {a.risk === 'high' ? '⚠️ Hati-hati' : '✅ Safe'}
                        </span>
                      </div>
                    ))}
                    {(autoPause || autoScale) && (
                      <div style={{ fontSize:'10px', color:C.orange, lineHeight:1.5, padding:'6px 8px', borderRadius:'7px', background:C.orangeLt, marginTop:'2px' }}>
                        ⚠️ Auto actions akan berjalan saat GuardianOn aktif. Pastikan kamu memahami risikonya sebelum mengaktifkan.
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={runOptimizer} disabled={loading}
                    style={{ padding:'10px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:C.sa }}>
                    Jalankan Check Sekarang
                  </button>
                </div>
              </Card>

              {/* Spend pacing chart */}
              <Card>
                <CardH icon="📈" title="Daily Spend Pacing" sub={`Jam ${currentHour}:00 — ${((currentSpend/totalDailyBudget)*100).toFixed(0)}% budget terpakai (ekspektasi ${expectedSpendPct(currentHour).toFixed(0)}%)`}/>
                <div style={{ padding:'16px 18px' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={pacingData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                      <defs>
                        {[['exp',C.blue],['act',C.amber]].map(([k,col]) => (
                          <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={col as string} stopOpacity={0.18}/>
                            <stop offset="95%" stopColor={col as string} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="hour" tick={{ fontSize:9, fill:C.inkMuted }} axisLine={false} tickLine={false} interval={3}/>
                      <YAxis tick={{ fontSize:10, fill:C.inkMuted }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}K`}/>
                      <Tooltip content={<ChartTip/>}/>
                      <ReferenceLine x={`${currentHour}:00`} stroke={C.orange} strokeDasharray="4 3" label={{ value:'Sekarang', position:'top', fontSize:9, fill:C.orange }}/>
                      <ReferenceLine y={totalDailyBudget/1000*softCap/100} stroke={C.orange} strokeDasharray="3 3"/>
                      <ReferenceLine y={totalDailyBudget/1000*hardCap/100} stroke={C.red} strokeDasharray="3 3"/>
                      <Area type="monotone" dataKey="expected" name="Pacing Normal" stroke={C.blue}  fill="url(#gexp)" strokeWidth={2} strokeDasharray="6 3" dot={false}/>
                      <Area type="monotone" dataKey="actual"   name="Spend Aktual" stroke={C.amber} fill="url(#gact)" strokeWidth={2.5} dot={false} connectNulls={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', gap:'16px', justifyContent:'center', marginTop:'8px', fontSize:'11px' }}>
                    {[[C.blue,'Pacing Normal (Expected)'],[C.amber,'Spend Aktual'],[C.orange,'Soft Cap'],[C.red,'Hard Cap']].map(([c,l]) => (
                      <div key={l} style={{ display:'flex', alignItems:'center', gap:'4px', color:C.inkMuted }}>
                        <div style={{ width:'8px', height:'3px', borderRadius:'2px', background:c as string }}/>
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Alerts */}
            <Card>
              <CardH icon="🔔" title="Active Alerts" sub="Sorted by severity — critical dulu"
                badge={alerts.length > 0 ? `${alerts.length} alert` : 'Clear ✅'} color={critsCount>0?C.red:warnCount>0?C.orange:C.green}
                action={
                  alerts.length > 0 && (
                    <button type="button" onClick={() => setAlerts([])}
                      style={{ padding:'4px 10px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'10px', fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                      Dismiss All
                    </button>
                  )
                }/>
              <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding:'28px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', color:C.inkMuted }}>
                    <CheckCircle2 size={32} color={C.green}/>
                    <div style={{ fontSize:'13px', fontWeight:700, color:C.green }}>Semua bersih! 🎉</div>
                    <div style={{ fontSize:'11px' }}>Tidak ada alert aktif. Guardian memantau campaign kamu.</div>
                  </div>
                ) : (
                  alerts.map(alert => (
                    <AlertCard key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)}/>
                  ))
                )}
                {!result && alerts.length === 0 && (
                  <div style={{ marginTop:'8px' }}>
                    <Insight text="Klik 'Jalankan Check Sekarang' untuk menganalisis campaign dan generate alert berdasarkan data performa aktual." color={C.blue}/>
                  </div>
                )}
              </div>
            </Card>

            {/* Auto-pause log */}
            <Card>
              <CardH icon="📋" title="Auto-Action Log" sub="Riwayat tindakan otomatis Guardian"/>
              <div style={{ padding:'14px 16px' }}>
                {[
                  { time:'12:00', action:'⏸️ Auto-pause', creative:'Carousel Produk — 5 Slide', reason:'ROAS 1.2x < floor 2.5x', autoPaused:true },
                  { time:'10:30', action:'📢 Alert sent', creative:'All campaigns', reason:'Budget 82% terpakai (soft cap: 80%)', autoPaused:false },
                  { time:'08:00', action:'🚀 Scale +20%', creative:'UGC Wanita Muda', reason:'ROAS 5.0x > ceiling 5.0x', autoPaused:false },
                ].map((log, i) => (
                  <div key={i} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'9px 0', borderBottom:i<2?`1px solid ${C.border}`:'none', fontSize:'12px' }}>
                    <span style={{ color:C.inkDim, fontSize:'10px', flexShrink:0, width:'44px' }}>{log.time}</span>
                    <span style={{ fontWeight:600, color:C.ink, flexShrink:0 }}>{log.action}</span>
                    <span style={{ flex:1, color:C.inkMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.creative}</span>
                    <span style={{ fontSize:'10px', color:C.inkDim, flexShrink:0 }}>{log.reason.substring(0,35)}...</span>
                    {log.autoPaused && <span style={{ fontSize:'9px', padding:'1px 6px', borderRadius:'4px', background:C.amberLt, color:C.amberDk, fontWeight:700, flexShrink:0 }}>Auto</span>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
        {/* ══════════════════════════════════════════════
            TAB: BUDGET SIMULATION
        ══════════════════════════════════════════════ */}
        {activeTab === 'simulate' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Scenario controls */}
            <Card>
              <CardH icon="📊" title="Budget Scenario Simulator" sub="Proyeksi ROAS dan revenue di berbagai level budget" badge="AI Powered"/>
              <div style={{ padding:'14px 18px' }}>
                <div style={{ display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap', marginBottom:'14px' }}>
                  <div>
                    <label style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'4px' }}>Proyeksi Ke Depan</label>
                    <div style={{ display:'flex', gap:'4px' }}>
                      {[7,14,30].map(d => (
                        <button key={d} type="button" onClick={() => setSimDays(d)}
                          style={{ padding:'6px 14px', borderRadius:'8px', border:`1.5px solid ${simDays===d?C.amber:C.border}`, background:simDays===d?C.amberXlt:C.surface, fontSize:'12px', fontWeight:simDays===d?700:500, color:simDays===d?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                          {d} hari
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize:'12px', color:C.inkMuted, flex:1 }}>
                    Simulasi berdasarkan {creatives.length} creative aktif · Budget dasar Rp{Math.round(totalDailyBudget/1000)}K/hari
                  </div>
                  <button type="button" onClick={runSimulation} disabled={simLoading || creatives.length===0}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:simLoading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:C.sa, opacity:simLoading?.7:1, flexShrink:0 }}>
                    {simLoading ? <Loader2 size={13} style={{ animation:'spin .8s linear infinite' }}/> : <Sparkles size={13}/>}
                    {simLoading ? 'Simulating...' : 'Run Simulation'}
                  </button>
                </div>

                {/* Scenario cards */}
                {simResult ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }} className="sim-grid">
                    {simResult.scenarios.map((sc: any, i: number) => {
                      const isOpt   = i === simOptIdx
                      const riskCol = sc.riskLevel === 'high' ? C.red : sc.riskLevel === 'medium' ? C.orange : C.green
                      return (
                        <div key={i} style={{ padding:'14px 13px', borderRadius:'13px', border:`2px solid ${isOpt?C.amber:C.border}`, background:isOpt?C.amberXlt:C.surface, boxShadow:isOpt?C.sa:C.sh, position:'relative', transition:'all .2s' }}>
                          {isOpt && <div style={{ position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', fontSize:'9px', fontWeight:800, padding:'2px 10px', borderRadius:'99px', background:C.amber, color:'#fff', whiteSpace:'nowrap' }}>⭐ OPTIMAL</div>}
                          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
                            <span style={{ fontSize:'18px' }}>{sc.icon}</span>
                            <div>
                              <div style={{ fontSize:'12px', fontWeight:700, color:isOpt?C.amberDk:C.ink }}>{sc.label}</div>
                              <div style={{ fontSize:'9px', padding:'1px 6px', borderRadius:'3px', background:`${riskCol}18`, color:riskCol, fontWeight:700, display:'inline-block' }}>Risk: {sc.riskLevel}</div>
                            </div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:'5px', fontSize:'11px' }}>
                            {[
                              { l:'Budget/hari', v:`Rp${Math.round(sc.dailyBudget/1000)}K`, color:C.ink },
                              { l:'ROAS',        v:`${sc.blendedROAS.toFixed(1)}x`,          color:sc.blendedROAS>=3?C.green:sc.blendedROAS>=1.5?C.amber:C.red },
                              { l:'Revenue',     v:`Rp${Math.round(sc.totalRevenue/1000000*10)/10}Jt`, color:C.purple },
                              { l:'Profit',      v:`Rp${Math.round(sc.totalProfit/1000000*10)/10}Jt`,  color:sc.totalProfit>0?C.green:C.red },
                            ].map((m,j) => (
                              <div key={j} style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', borderRadius:'6px', background:C.bg }}>
                                <span style={{ color:C.inkDim }}>{m.l}</span>
                                <span style={{ fontWeight:700, color:m.color }}>{m.v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ padding:'40px', textAlign:'center', color:C.inkMuted, display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'40px' }}>📊</span>
                    <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>Siap simulasi budget</div>
                    <div style={{ fontSize:'11px', lineHeight:1.6, maxWidth:'360px' }}>Klik "Run Simulation" untuk melihat proyeksi ROAS dan revenue di 6 skenario budget berbeda berdasarkan data creative kamu.</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Trend chart */}
            {simResult?.trendChart && (
              <Card>
                <CardH icon="📈" title="Revenue Trend Projection" sub={`${simDays} hari ke depan — 3 skenario`}/>
                <div style={{ padding:'16px 18px' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={simResult.trendChart} margin={{ top:4, right:4, bottom:0, left:-15 }}>
                      <defs>
                        {[['cons',C.blue],['sq',C.amber],['agg',C.green]].map(([k,c]) => (
                          <linearGradient key={k} id={`sg${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c as string} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={c as string} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="day" tick={{ fontSize:9, fill:C.inkMuted }} axisLine={false} tickLine={false} interval={Math.floor(simDays/6)}/>
                      <YAxis tick={{ fontSize:10, fill:C.inkMuted }} axisLine={false} tickLine={false} tickFormatter={v=>`${Math.round(v/1000000*10)/10}Jt`}/>
                      <Tooltip content={<ChartTip/>}/>
                      <Area type="monotone" dataKey="conservative" name="Konservatif (-50%)" stroke={C.blue}   fill="url(#sgcons)" strokeWidth={2} dot={false} strokeDasharray="5 3"/>
                      <Area type="monotone" dataKey="statusQuo"    name="Status Quo"         stroke={C.amber}  fill="url(#sgsq)"   strokeWidth={2.5} dot={false}/>
                      <Area type="monotone" dataKey="aggressive"   name="Agresif (+100%)"    stroke={C.green}  fill="url(#sgagg)"  strokeWidth={2} dot={false} strokeDasharray="5 3"/>
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', gap:'16px', justifyContent:'center', marginTop:'8px', fontSize:'11px' }}>
                    {[[C.blue,'Konservatif'],[C.amber,'Status Quo'],[C.green,'Agresif']].map(([c,l]) => (
                      <div key={l as string} style={{ display:'flex', gap:'4px', alignItems:'center', color:C.inkMuted }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:c as string }}/>
                        {l as string}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* AI Summary */}
            {simResult?.aiSummary && (
              <div style={{ padding:'13px 16px', borderRadius:'12px', background:C.purpleLt, border:`1px solid ${C.purple}25`, display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <Brain size={16} color={C.purple} style={{ flexShrink:0, marginTop:'2px' }}/>
                <div style={{ fontSize:'13px', color:C.inkSub, lineHeight:1.7 }}>{simResult.aiSummary}</div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: AUTO-BID RULES
        ══════════════════════════════════════════════ */}
        {activeTab === 'autobid' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'14px' }} className="autobid-grid">

              {/* Rules list */}
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:700, color:C.ink }}>🤖 ROAS Automation Rules</div>
                    <div style={{ fontSize:'11px', color:C.inkMuted, marginTop:'2px' }}>{bidRules.filter(r=>r.enabled).length} rule aktif — bekerja saat Guardian ON</div>
                  </div>
                  <button type="button" onClick={() => setShowAddRule(p=>!p)}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'9px', border:`1px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    <Plus size={13}/> Tambah Rule
                  </button>
                </div>

                {bidRules.map((rule, i) => {
                  const actionColors: Record<string,string> = { pause:C.red, scale:C.green, notify:C.blue, 'lower-bid':C.orange, 'raise-bid':C.purple }
                  const col = actionColors[rule.action] ?? C.amber
                  return (
                    <div key={rule.id} style={{ padding:'13px 16px', borderRadius:'13px', border:`1.5px solid ${rule.enabled?col+'30':C.border}`, background:rule.enabled?`${col}06`:C.bg, boxShadow:C.sh, transition:'all .2s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        {/* Toggle */}
                        <button type="button" onClick={() => toggleRule(rule.id)}
                          style={{ width:'40px', height:'22px', borderRadius:'11px', border:'none', background:rule.enabled?col:C.inkDim, cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                          <div style={{ position:'absolute', top:'2px', left:rule.enabled?'20px':'2px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 2px rgba(0,0,0,.3)' }}/>
                        </button>

                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color:rule.enabled?C.ink:C.inkMuted, marginBottom:'3px' }}>{rule.name}</div>
                          <div style={{ display:'flex', gap:'8px', fontSize:'10px', color:C.inkMuted, flexWrap:'wrap' }}>
                            <span>📊 {rule.condition.metric} {rule.condition.op} {rule.condition.val}</span>
                            <span>⏱ {rule.condition.days}h window</span>
                            <span>⏳ Cooldown {rule.cooldown}h</span>
                          </div>
                        </div>

                        <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0 }}>
                          <span style={{ fontSize:'10px', fontWeight:800, padding:'2px 8px', borderRadius:'5px', background:`${col}15`, color:col }}>
                            {rule.action}
                            {rule.magnitude > 0 && ` ${rule.magnitude}%`}
                          </span>
                          <button onClick={() => deleteRule(rule.id)}
                            style={{ width:'24px', height:'24px', borderRadius:'6px', border:`1px solid ${C.border}`, background:C.surface, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.inkDim }}>
                            <X size={11}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* How rules work */}
                <div style={{ padding:'12px 14px', borderRadius:'11px', background:C.amberXlt, border:`1px solid ${C.amber}30`, marginTop:'4px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:C.amberDk, marginBottom:'6px' }}>⚡ Bagaimana Auto-Bid Bekerja</div>
                  <div style={{ fontSize:'11px', color:C.amberDk, lineHeight:1.7 }}>
                    Rules dievaluasi setiap <strong>1 jam</strong> saat Guardian aktif. Setiap rule punya cooldown agar tidak overfiring. Action dieksekusi secara berurutan sesuai priority, dan semua tercatat di Auto-Action Log.
                  </div>
                </div>
              </div>

              {/* Bid Strategy Panel */}
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <Card>
                  <CardH icon="💼" title="Bid Strategy" sub="Pilih strategi bidding per platform"/>
                  <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                    {[
                      { id:'lowest-cost' as const, l:'Lowest Cost',  icon:'⚡', desc:'Auto-optimize untuk biaya terendah', riskColor:C.green  },
                      { id:'cost-cap'    as const, l:'Cost Cap',     icon:'🎯', desc:'Set batas max cost per konversi',    riskColor:C.amber  },
                      { id:'bid-cap'     as const, l:'Bid Cap',      icon:'💼', desc:'Kontrol penuh atas bid di auction', riskColor:C.orange },
                      { id:'target-roas' as const, l:'Target ROAS',  icon:'💰', desc:'Otomatis capai target ROAS',        riskColor:C.blue   },
                    ].map(s => (
                      <div key={s.id} onClick={() => setBidStrategy(s.id)}
                        style={{ padding:'10px 12px', borderRadius:'10px', border:`1.5px solid ${bidStrategy===s.id?s.riskColor:C.border}`, background:bidStrategy===s.id?`${s.riskColor}08`:C.surface, cursor:'pointer', transition:'all .15s' }}>
                        <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'3px' }}>
                          <span>{s.icon}</span>
                          <span style={{ fontSize:'12px', fontWeight:700, color:bidStrategy===s.id?s.riskColor:C.ink }}>{s.l}</span>
                          {bidStrategy===s.id && <CheckCircle2 size={13} color={s.riskColor} style={{ marginLeft:'auto' }}/>}
                        </div>
                        <div style={{ fontSize:'10px', color:C.inkMuted }}>{s.desc}</div>
                      </div>
                    ))}

                    {/* Conditional inputs */}
                    {bidStrategy === 'target-roas' && (
                      <div>
                        <label style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, display:'block', marginBottom:'4px' }}>Target ROAS: <strong style={{ color:C.blue }}>{targetROAS.toFixed(1)}x</strong></label>
                        <input type="range" min={1} max={10} step={0.5} value={targetROAS} onChange={e => setTargetROAS(+e.target.value)}
                          style={{ width:'100%', accentColor:C.blue }}/>
                        <div style={{ fontSize:'10px', color:C.inkDim, marginTop:'3px' }}>Butuh min 50 konversi/minggu untuk efektif</div>
                      </div>
                    )}
                    {bidStrategy === 'cost-cap' && (
                      <div>
                        <label style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, display:'block', marginBottom:'4px' }}>Cost Cap: <strong style={{ color:C.amber }}>Rp{Math.round(costCapVal/1000)}K/konversi</strong></label>
                        <input type="range" min={10000} max={500000} step={5000} value={costCapVal} onChange={e => setCostCapVal(+e.target.value)}
                          style={{ width:'100%', accentColor:C.amber }}/>
                      </div>
                    )}

                    <button type="button"
                      style={{ padding:'9px', borderRadius:'9px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:C.sa }}>
                      Terapkan Bid Strategy
                    </button>
                  </div>
                </Card>

                {/* ROAS floor / ceiling quick set */}
                <Card>
                  <CardH icon="⚙️" title="Threshold Quick Set" sub="Sinkron dengan Guardian"/>
                  <div style={{ padding:'13px 15px', display:'flex', flexDirection:'column', gap:'8px' }}>
                    {[
                      { l:`ROAS Floor: pause di ${roasFloor}x`,   v:roasFloor, set:setRoasFloor, min:0.5, max:3, step:0.5, color:C.red   },
                      { l:`ROAS Ceiling: scale di ${roasCeiling}x`,v:roasCeiling,set:setRoasCeiling,min:2,max:8, step:0.5, color:C.green },
                    ].map(f => (
                      <div key={f.l}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', marginBottom:'3px' }}>
                          <span style={{ color:C.inkMuted }}>{f.l}</span>
                          <span style={{ fontWeight:700, color:f.color }}>{f.v}x</span>
                        </div>
                        <input type="range" min={f.min} max={f.max} step={f.step} value={f.v} onChange={e=>f.set(+e.target.value)}
                          style={{ width:'100%', accentColor:f.color }}/>
                      </div>
                    ))}
                    <div style={{ fontSize:'10px', color:C.inkDim, lineHeight:1.5, padding:'7px 10px', borderRadius:'7px', background:C.bg, border:`1px solid ${C.border}` }}>
                      💡 Perubahan threshold otomatis digunakan oleh semua ROAS rules di atas
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
        .kpi-strip  { grid-template-columns:repeat(6,1fr) !important }
        .alloc-grid { grid-template-columns:1fr 320px !important }
        .win-grid   { grid-template-columns:1fr 1fr !important }
        .guard-grid  { grid-template-columns:320px 1fr !important }
        .autobid-grid{ grid-template-columns:1fr 340px !important }
        .sim-grid    { grid-template-columns:repeat(3,1fr) !important }
        @media(max-width:1100px) {
          .kpi-strip  { grid-template-columns:repeat(3,1fr) !important }
          .alloc-grid { grid-template-columns:1fr !important }
          .guard-grid { grid-template-columns:1fr !important }
          .autobid-grid{ grid-template-columns:1fr !important }
          .sim-grid   { grid-template-columns:repeat(2,1fr) !important }
        }
        @media(max-width:768px) {
          .kpi-strip { grid-template-columns:repeat(2,1fr) !important }
          .win-grid  { grid-template-columns:1fr !important }
        }
      `}</style>
    </div>
  )
}