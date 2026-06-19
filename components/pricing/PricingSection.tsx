'use client'
// components/pricing/PricingSection.tsx
// ══════════════════════════════════════════════════════════════
// PricingSection — Shared pricing cards
// 
// Dipakai di:
//   1. Landing page:  <PricingSection variant="landing"/>
//   2. /billing:      <PricingSection variant="billing" currentTier="pro"/>
// 
// Data: usePricing() hook → /api/public/pricing → DB
// Edit via /admin/pricing otomatis reflected (cache 60s)
// Amber theme (#F59E0B) konsisten dengan dashboard
// ══════════════════════════════════════════════════════════════

import { useState } from 'react'
import Link from 'next/link'
import { Check, Crown, Zap, Sparkles } from 'lucide-react'
import { usePricing } from '@/hooks/use-pricing'
import { formatRupiah, yearlyDiscount } from '@/lib/pricing'

const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberXlt:'#FFFBEB',
  bg:'#F9FAFB', surface:'#FFFFFF', border:'#E5E7EB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', purple:'#7C3AED',
  sh:'0 1px 3px rgba(0,0,0,.06)', sm:'0 4px 16px rgba(0,0,0,.07)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

interface PricingSectionProps {
  variant?:    'landing' | 'billing'
  currentTier?: string          // untuk billing: highlight plan aktif
  onSelect?:   (tier: string) => void  // custom handler (billing checkout)
}

export function PricingSection({ variant = 'landing', currentTier, onSelect }: PricingSectionProps) {
  const { plans, isLoading, isFallback } = usePricing()
  const [yearly, setYearly] = useState(false)

  if (isLoading) {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'16px', padding:'8px 0' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height:'420px', borderRadius:'16px', background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'pshimmer 1.4s infinite' }}/>
        ))}
        <style>{`@keyframes pshimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    )
  }

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      
      {/* Toggle bulanan/tahunan */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'24px' }}>
        <div style={{ display:'flex', gap:'4px', background:C.bg, padding:'4px', borderRadius:'12px', border:`1px solid ${C.border}` }}>
          {([['Bulanan', false], ['Tahunan', true]] as const).map(([label, isYearly]) => (
            <button key={label} type="button" onClick={() => setYearly(isYearly)}
              style={{
                padding:'8px 20px', borderRadius:'9px', border:'none', cursor:'pointer',
                background: yearly === isYearly ? C.surface : 'transparent',
                fontWeight: yearly === isYearly ? 700 : 500,
                fontSize:'13px', color: yearly === isYearly ? C.ink : C.inkMuted,
                boxShadow: yearly === isYearly ? C.sh : 'none',
                fontFamily:'inherit', transition:'all .15s',
                display:'flex', alignItems:'center', gap:'6px',
              }}>
              {label}
              {isYearly && (
                <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 6px', borderRadius:'99px', background:C.green, color:'#fff' }}>
                  HEMAT 20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'16px', alignItems:'stretch' }}>
        {plans.map(plan => {
          const isCurrent = currentTier === plan.tier
          const price = yearly ? Math.round(plan.price_yearly / 12) : plan.price_monthly
          const discount = yearlyDiscount(plan.price_monthly, plan.price_yearly)

          return (
            <div key={plan.tier} style={{
              position:'relative', display:'flex', flexDirection:'column',
              padding:'24px 22px', borderRadius:'16px',
              background: plan.is_popular ? `linear-gradient(180deg,${C.amberXlt},${C.surface})` : C.surface,
              border: plan.is_popular ? `2px solid ${C.amber}` : isCurrent ? `2px solid ${C.green}` : `1px solid ${C.border}`,
              boxShadow: plan.is_popular ? C.sa : C.sh,
            }}>
              {/* Popular badge */}
              {plan.is_popular && (
                <div style={{
                  position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)',
                  padding:'4px 14px', borderRadius:'99px',
                  background:`linear-gradient(135deg,${C.amber},${C.amberDk})`,
                  color:'#fff', fontSize:'10px', fontWeight:800, letterSpacing:'0.05em',
                  display:'flex', alignItems:'center', gap:'4px', whiteSpace:'nowrap',
                  boxShadow:C.sa,
                }}>
                  <Sparkles size={10}/> PALING LARIS
                </div>
              )}

              {/* Current plan badge (billing) */}
              {isCurrent && variant === 'billing' && (
                <div style={{
                  position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)',
                  padding:'4px 14px', borderRadius:'99px', background:C.green,
                  color:'#fff', fontSize:'10px', fontWeight:800, whiteSpace:'nowrap',
                }}>
                  ✓ PLAN AKTIF
                </div>
              )}

              {/* Header */}
              <div style={{ marginBottom:'14px' }}>
                <div style={{ fontSize:'15px', fontWeight:800, color:C.ink, display:'flex', alignItems:'center', gap:'6px' }}>
                  {plan.tier === 'business' || plan.tier === 'pro' 
                    ? <Crown size={15} color={C.amber}/> 
                    : <Zap size={15} color={C.inkMuted}/>}
                  {plan.display_name}
                </div>
                <div style={{ fontSize:'11px', color:C.inkMuted, marginTop:'3px' }}>{plan.tagline}</div>
              </div>

              {/* Price */}
              <div style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
                  <span style={{ fontSize:'28px', fontWeight:900, color:C.ink, letterSpacing:'-0.03em' }}>
                    {formatRupiah(price)}
                  </span>
                  {price > 0 && <span style={{ fontSize:'12px', color:C.inkMuted }}>/bulan</span>}
                </div>
                {yearly && price > 0 && discount > 0 && (
                  <div style={{ fontSize:'10px', color:C.green, fontWeight:700, marginTop:'3px' }}>
                    Hemat {discount}% — bayar tahunan {formatRupiah(plan.price_yearly)}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 20px 0', flex:1, display:'flex', flexDirection:'column', gap:'8px' }}>
                {(plan.features ?? []).map((f, i) => (
                  <li key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', fontSize:'12px', color:C.inkSub, lineHeight:1.5 }}>
                    <Check size={13} color={C.green} style={{ flexShrink:0, marginTop:'2px' }}/>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {onSelect ? (
                <button type="button" onClick={() => onSelect(plan.tier)}
                  disabled={isCurrent}
                  style={{
                    padding:'11px', borderRadius:'10px', border:'none', cursor:isCurrent?'default':'pointer',
                    background: isCurrent ? C.bg : plan.is_popular ? `linear-gradient(135deg,${C.amber},${C.amberDk})` : C.ink,
                    color: isCurrent ? C.inkMuted : '#fff',
                    fontSize:'13px', fontWeight:700, fontFamily:'inherit',
                    boxShadow: plan.is_popular && !isCurrent ? C.sa : 'none',
                    transition:'transform .15s',
                  }}>
                  {isCurrent ? 'Plan Aktif Kamu' : plan.price_monthly === 0 ? 'Mulai Gratis' : `Pilih ${plan.display_name}`}
                </button>
              ) : (
                <Link href={plan.price_monthly === 0 ? '/signup' : `/signup?plan=${plan.tier}`}
                  style={{
                    padding:'11px', borderRadius:'10px', textAlign:'center', textDecoration:'none',
                    background: plan.is_popular ? `linear-gradient(135deg,${C.amber},${C.amberDk})` : C.ink,
                    color:'#fff', fontSize:'13px', fontWeight:700,
                    boxShadow: plan.is_popular ? C.sa : 'none',
                    display:'block',
                  }}>
                  {plan.price_monthly === 0 ? 'Mulai Gratis' : `Pilih ${plan.display_name}`}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Fallback warning (dev only) */}
      {isFallback && process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop:'14px', padding:'10px 14px', borderRadius:'10px', background:'#FEF2F2', border:'1px solid #FCA5A5', fontSize:'11px', color:'#B91C1C' }}>
          ⚠️ DEV: Pricing dari FALLBACK hardcoded (DB tidak tersedia). Run migration Phase 2 + seed plan_config.
        </div>
      )}
    </div>
  )
}