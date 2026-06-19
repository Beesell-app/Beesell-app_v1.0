'use client'
// app/(dashboard)/billing/page.tsx
// ══════════════════════════════════════════════════════════════
// BILLING — Plan, Quota, Add-ons, Topup · Light theme · Amber
// ══════════════════════════════════════════════════════════════

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Crown, Zap, ArrowRight, CreditCard, AlertTriangle, ChevronRight, CheckCircle2, Package, Video, Image, RefreshCw } from 'lucide-react'
import { usePricing } from '@/hooks/use-pricing'
import { startPayment } from '@/lib/payment-client'
import { useUserRole } from '@/hooks/use-user-role'

const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB', ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5', blue:'#3B82F6', blueLt:'#EFF6FF',
  purple:'#7C3AED', purpleLt:'#F5F3FF', red:'#EF4444', redLt:'#FEF2F2',
  sh:'0 1px 3px rgba(0,0,0,.06)', sm:'0 4px 16px rgba(0,0,0,.07)', sa:'0 6px 20px rgba(245,158,11,.22)',
}

const PLANS = [
  {
    id:'starter', name:'Starter', price:0, period:'selamanya', badge:null, highlight:false, cta:'Paket Saat Ini',
    note:'5 generate total lifetime · 1 HP + 1 email',
    features:[
      {ok:true, t:'5 generate total seumur hidup'},{ok:true, t:'Remove BG (3x/hari)'},{ok:true, t:'Resize 3 preset'},
      {ok:true, t:'Watermark wajib'},{ok:false, t:'Packshot'},{ok:false, t:'Video Generator'},
      {ok:false, t:'Marketing Kit'},{ok:false, t:'Asset Library'},
    ],
  },
  {
    id:'basic', name:'Basic', price:149_000, period:'per bulan', badge:'🐝 UMKM', highlight:false, cta:'Upgrade ke Basic',
    note:'200 generate/bulan',
    features:[
      {ok:true, t:'200 generate/bulan'},{ok:true, t:'Semua 5 Quick Tools'},
      {ok:true, t:'AI Packshot (17 preset)'},{ok:true, t:'Caption + Hook + CTA + Hashtag'},{ok:true, t:'Asset Library 5GB'},
      {ok:false, t:'Product to Model & Try-On'},{ok:false, t:'Video Generator'},
    ],
  },
  {
    id:'pro', name:'Pro', price:399_000, period:'per bulan', badge:'🔥 Terlaris', highlight:true, cta:'Upgrade ke Pro',
    note:'400 img + 5 video + 20 try-on/bln',
    features:[
      {ok:true, t:'400 generate/bulan'},{ok:true, t:'5 video + 20 try-on/bulan'},{ok:true, t:'Semua 7 AI Image fitur'},
      {ok:true, t:'Product to Model (16 model)'},{ok:true, t:'AI Try-On + Face Swap + Model Swap'},
      {ok:true, t:'UGC Video Generator'},{ok:true, t:'Semua Marketing Kit'},{ok:true, t:'Asset Library 20GB'},
    ],
  },
  {
    id:'business', name:'Business', price:999_000, period:'per bulan', badge:null, highlight:false, cta:'Upgrade ke Business',
    note:'1.000 img + 20 video + 100 try-on',
    features:[
      {ok:true, t:'1.000 generate/bulan'},{ok:true, t:'20 video + 100 try-on/bulan'},{ok:true, t:'Semua fitur Pro'},
      {ok:true, t:'Team workspace (5 seat)'},{ok:true, t:'Bulk Content Engine'},{ok:true, t:'API Access'},
      {ok:true, t:'White Label'},{ok:true, t:'Asset Library 100GB'},
    ],
  },
]

const ADDONS = [
  { icon:'🎬', label:'Video Pack 5×',     qty:'5 video AI',         price:89_000,  color:C.purple,  badge:null },
  { icon:'🎬', label:'Video Pack 10×',    qty:'10 video AI',        price:149_000, color:C.purple,  badge:'Hemat 22%' },
  { icon:'👗', label:'Try-On Pack 20×',   qty:'20 AI Try-On',       price:99_000,  color:'#DB2777', badge:null },
  { icon:'😊', label:'Face Swap 10×',     qty:'10 face swap',       price:59_000,  color:C.blue,    badge:null },
  { icon:'⚡', label:'Topup 50 generate', qty:'50 img generate',    price:49_000,  color:C.amber,   badge:null },
  { icon:'⚡', label:'Topup 200 generate',qty:'200 img generate',   price:149_000, color:C.amber,   badge:'Hemat 32%' },
]

const COMING_ADDONS = [
  { icon:'📅', label:'Auto-Post Scheduler', price:99_000,  eta:'Q2 2025' },
  { icon:'⚡', label:'Bulk Content Engine', price:299_000, eta:'Q3 2025' },
  { icon:'🔌', label:'API Access',          price:499_000, eta:'Q4 2025' },
  { icon:'🏷️', label:'White Label',        price:999_000, eta:'Q4 2025' },
]

function PlanCard({ plan, currentPlan, billing }: { plan:typeof PLANS[0]; currentPlan:string; billing:'monthly'|'yearly' }) {
  const isCurrent = currentPlan === plan.id
  const displayPrice = billing === 'yearly' && plan.price > 0 ? Math.round(plan.price * 0.8 / 1000) * 1000 : plan.price

  return (
    <div style={{ borderRadius:'18px', overflow:'hidden', background:plan.highlight?`linear-gradient(170deg,${C.amber},${C.amberDk})`:C.surface, border:`2px solid ${plan.highlight?C.amber:isCurrent?C.green:C.border}`, boxShadow:plan.highlight?`0 16px 44px ${C.sa}`:'0 1px 4px rgba(0,0,0,.06)', position:'relative' }}>
      {plan.badge && <div style={{ background:'rgba(0,0,0,.14)', padding:'5px 12px', textAlign:'center', fontSize:'11px', fontWeight:800, color:'#fff' }}>{plan.badge}</div>}
      {isCurrent && !plan.highlight && <div style={{ padding:'5px 12px', textAlign:'center', fontSize:'11px', fontWeight:800, color:C.green, background:C.greenLt }}>✓ Paket Aktif</div>}
      <div style={{ padding:'20px' }}>
        <div style={{ fontSize:'12px', fontWeight:700, color:plan.highlight?'rgba(255,255,255,.75)':C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>{plan.name}</div>
        <div style={{ fontSize:'clamp(24px,3vw,32px)', fontWeight:900, color:plan.highlight?'#fff':C.ink, letterSpacing:'-0.03em', lineHeight:1, marginBottom:'3px' }}>
          {plan.price===0?'Gratis':`Rp ${(displayPrice/1000).toFixed(0)}K`}
        </div>
        {plan.price>0 && (
          <div style={{ fontSize:'11px', color:plan.highlight?'rgba(255,255,255,.65)':C.inkMuted, marginBottom:'5px' }}>
            {billing==='yearly'&&<span style={{ textDecoration:'line-through', marginRight:'5px', opacity:.6 }}>Rp {(plan.price/1000).toFixed(0)}K</span>}
            {plan.period}
          </div>
        )}
        <div style={{ fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'5px', background:plan.highlight?'rgba(255,255,255,.15)':C.amberLt, color:plan.highlight?'#fff':C.amberDk, display:'inline-block', marginBottom:'14px' }}>📊 {plan.note}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'16px' }}>
          {plan.features.map((f,i) => (
            <div key={i} style={{ display:'flex', gap:'7px', alignItems:'flex-start' }}>
              <div style={{ width:'14px', height:'14px', borderRadius:'50%', flexShrink:0, marginTop:'1px', display:'flex', alignItems:'center', justifyContent:'center', background:f.ok?(plan.highlight?'rgba(255,255,255,.2)':C.amberLt):(plan.highlight?'rgba(255,255,255,.07)':C.bg) }}>
                {f.ok?<Check size={8} color={plan.highlight?'#fff':C.amberDk}/>:<X size={7} color={plan.highlight?'rgba(255,255,255,.3)':C.inkDim}/>}
              </div>
              <span style={{ fontSize:'11px', lineHeight:1.4, color:plan.highlight?(f.ok?'#fff':'rgba(255,255,255,.4)'):(f.ok?C.ink:C.inkDim) }}>{f.t}</span>
            </div>
          ))}
        </div>
        <button type="button" disabled={isCurrent}
          onClick={() => {
            if (isCurrent || plan.price <= 0) return
            startPayment({ type:'plan', id:plan.id, billing })
          }}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'10px', borderRadius:'10px', width:'100%', border:'none', background:isCurrent?(plan.highlight?'rgba(255,255,255,.2)':C.bg):plan.highlight?'#fff':`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:isCurrent?(plan.highlight?'rgba(255,255,255,.6)':C.inkMuted):plan.highlight?C.amberDk:'#fff', fontSize:'12px', fontWeight:700, cursor:isCurrent?'not-allowed':'pointer', transition:'all .15s', fontFamily:'inherit', boxShadow:isCurrent?'none':plan.highlight?'none':C.sa }}>
          {isCurrent ? '✓ Paket Aktif' : plan.cta} {!isCurrent && <ArrowRight size={11}/>}
          disabled={isCurrent || plan.price <= 0}
        </button>
      </div>
    </div>
  )
}

export default function BillingPage() {
  const { getPrice, getQuotaNote, getQuota, getAddons } = usePricing()
  const addonsLive = getAddons('active')
  const comingLive = getAddons('coming-soon')
  const ADDONS_DB = addonsLive.length
  ? addonsLive.map(a => ({ addon_id: a.addon_id, icon: a.icon, label: a.label, qty: a.qty, price: a.price, color: a.color, badge: a.badge }))
  : ADDONS
  const COMING_DB = comingLive.length
    ? comingLive.map(a => ({ icon: a.icon, label: a.label, price: a.price, eta: a.eta }))
    : COMING_ADDONS
  const [billing,     setBilling]     = useState<'monthly'|'yearly'>('monthly')
  const { isSuperuser } = useUserRole()
  const realCurrentPlan = 'pro'
  const currentPlan = isSuperuser ? '__none__' : realCurrentPlan
  const plans = PLANS.map(p => {
    const credits = getQuota(p.id).credits
    return {
      ...p,
      price: getPrice(p.id) || p.price,
      note:  getQuotaNote(p.id) || p.note,
      features: credits > 0
        ? [{ ok: true, t: `${credits.toLocaleString('id-ID')} kredit/bulan` }, ...p.features]
        : p.features,
    }
  })
  return (
    
    <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:800, color:C.ink, letterSpacing:'-0.03em', marginBottom:'4px' }}>💳 Billing & Paket</h1>
        <p style={{ fontSize:'13px', color:C.inkMuted }}>Kelola langganan, topup kredit, dan beli add-on.</p>
      </div>
      {isSuperuser && (
        <div style={{ background:'#FFFBEB', border:'1.5px solid #F59E0B', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:20 }}>👑</span>
          <div style={{ fontSize:12, color:'#92400E', lineHeight:1.5 }}>
            <b>Mode Superuser</b> — kamu punya akses unlimited tanpa langganan. Tombol di bawah aktif untuk <b>testing payment</b> (sandbox), bukan langganan asli.
          </div>
        </div>
      )}
      {/* Current plan summary */}
      <div style={{ background:C.surface, borderRadius:'14px', border:`1.5px solid ${C.green}30`, boxShadow:C.sh, padding:'18px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>👑</div>
        <div style={{ flex:1, minWidth:'180px' }}>
          <div style={{ fontSize:'15px', fontWeight:700, color:C.ink, marginBottom:'3px' }}>Plan Pro · Aktif</div>
          <div style={{ fontSize:'12px', color:C.inkMuted }}>Perpanjang otomatis 15 Jun 2025 · Rp399.000/bulan</div>
        </div>
        {/* Quota bars */}
        <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
          {[
            { label:'Gambar', used:178, total:400, color:C.amber },
            { label:'Video',  used:3,   total:5,   color:C.purple },
            { label:'Try-On', used:8,   total:20,  color:'#DB2777' },
          ].map(q => (
            <div key={q.label}>
              <div style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, marginBottom:'4px' }}>{q.label} {q.used}/{q.total}</div>
              <div style={{ width:'90px', height:'5px', borderRadius:'3px', background:C.bg, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.round(q.used/q.total*100)}%`, background:q.color, borderRadius:'3px', transition:'width .4s' }}/>
              </div>
            </div>
          ))}
        </div>
        <Link href="#addons" style={{ padding:'8px 14px', borderRadius:'9px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, textDecoration:'none', boxShadow:C.sa, whiteSpace:'nowrap', flexShrink:0 }}>
          ⚡ Topup Sekarang
        </Link>
      </div>

      {/* Plans */}
      <div style={{ marginBottom:'28px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
          <div style={{ fontSize:'16px', fontWeight:700, color:C.ink }}>📦 Pilih Paket</div>
          {/* Billing toggle */}
          <div style={{ display:'inline-flex', gap:'4px', background:C.bg, borderRadius:'99px', padding:'3px', border:`1px solid ${C.border}` }}>
            {(['monthly','yearly'] as const).map(b => (
              <button key={b} type="button" onClick={()=>setBilling(b)}
                style={{ padding:'6px 16px', borderRadius:'99px', border:'none', background:billing===b?`linear-gradient(135deg,${C.amber},${C.amberDk})`:'transparent', color:billing===b?'#fff':C.inkMuted, fontSize:'12px', fontWeight:700, cursor:'pointer', transition:'all .15s', boxShadow:billing===b?C.sa:'none', fontFamily:'inherit' }}>
                {b==='monthly'?'Bulanan':'Tahunan'}{b==='yearly'&&<span style={{ marginLeft:'5px', fontSize:'10px', opacity:.9 }}>Hemat 20%</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }} className="plans-grid">
          {plans.map(plan => <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} billing={billing}/>)}
        </div>
      </div>

      {/* Add-ons */}
      <div id="addons" style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:C.ink, marginBottom:'6px' }}>⚡ Add-On — Beli Terpisah</div>
        <div style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'16px' }}>Kuota habis di tengah bulan? Beli add-on tanpa harus upgrade plan.</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }} className="addons-grid">
          {ADDONS_DB.map((a, i) => (
            <div key={i} style={{ background:C.surface, borderRadius:'14px', border:`1.5px solid ${C.border}`, boxShadow:C.sh, padding:'16px', display:'flex', gap:'12px', alignItems:'flex-start', transition:'all .18s', position:'relative' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.amber;(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 6px 20px ${C.sa}`}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow=C.sh}}>
              {a.badge && <div style={{ position:'absolute', top:'10px', right:'10px', fontSize:'9px', fontWeight:800, padding:'2px 6px', borderRadius:'99px', background:C.amber, color:'#fff' }}>{a.badge}</div>}
              <div style={{ width:'40px', height:'40px', borderRadius:'11px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{a.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'2px' }}>{a.label}</div>
                <div style={{ fontSize:'10px', color: a.color ?? C.inkMuted, fontWeight:700, marginBottom:'8px' }}>{a.qty}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'16px', fontWeight:900, color:C.ink, letterSpacing:'-0.02em' }}>Rp{(a.price/1000).toFixed(0)}K</span>
                  <button type="button" onClick={() => startPayment({ type:'addon', id: (a as any).addon_id })} style={{ padding:'6px 13px', borderRadius:'8px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit' }}>Beli</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon add-ons */}
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:C.ink, marginBottom:'6px' }}>🚀 Feature Add-On — Akan Datang</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }} className="coming-grid">
          {COMING_DB.map((a, i) => (
            <div key={i} style={{ background:C.purpleLt, borderRadius:'13px', border:`1.5px dashed #7C3AED30`, padding:'14px', display:'flex', gap:'9px', alignItems:'flex-start', transition:'border-style .18s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderStyle='solid'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderStyle='dashed'}>
              <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(124,58,237,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', flexShrink:0 }}>{a.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:C.purple, marginBottom:'3px' }}>{a.label}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'4px' }}>
                  <span style={{ fontSize:'13px', fontWeight:800, color:C.ink }}>Rp{(a.price/1000).toFixed(0)}K</span>
                  <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'99px', background:'rgba(124,58,237,.12)', color:C.purple }}>{a.eta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment methods + guarantee */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'8px' }} className="guarantee-grid">
        {[
          {icon:'🔒', t:'Pembayaran Aman',  d:'SSL encrypted. Visa, Mastercard, Transfer, QRIS, OVO, GoPay.'},
          {icon:'↩️', t:'Garansi 7 Hari',   d:'Tidak puas? Refund penuh dalam 7 hari pertama tanpa tanya.'},
          {icon:'❌', t:'Cancel Kapan Saja', d:'Tidak ada kontrak. Cancel 1 klik dari dashboard, langsung efektif.'},
        ].map((g, i) => (
          <div key={i} style={{ background:C.surface, borderRadius:'12px', border:`1px solid ${C.border}`, padding:'14px 16px', display:'flex', gap:'10px', alignItems:'flex-start', boxShadow:C.sh }}>
            <span style={{ fontSize:'20px', flexShrink:0 }}>{g.icon}</span>
            <div><div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'3px' }}>{g.t}</div><div style={{ fontSize:'11px', color:C.inkMuted, lineHeight:1.5 }}>{g.d}</div></div>
          </div>
        ))}
      </div>

      <style>{`
        * { box-sizing:border-box }
        .plans-grid    { grid-template-columns: repeat(4,1fr) !important }
        .addons-grid   { grid-template-columns: repeat(3,1fr) !important }
        .coming-grid   { grid-template-columns: repeat(4,1fr) !important }
        .guarantee-grid{ grid-template-columns: repeat(3,1fr) !important }
        @media (max-width:1023px) {
          .plans-grid    { grid-template-columns: repeat(2,1fr) !important }
          .coming-grid   { grid-template-columns: repeat(2,1fr) !important }
          .guarantee-grid{ grid-template-columns: repeat(3,1fr) !important }
        }
        @media (max-width:639px) {
          .plans-grid    { grid-template-columns: 1fr !important }
          .addons-grid   { grid-template-columns: 1fr !important }
          .coming-grid   { grid-template-columns: 1fr 1fr !important }
          .guarantee-grid{ grid-template-columns: 1fr !important }
        }
      `}</style>
    </div>
  )
}