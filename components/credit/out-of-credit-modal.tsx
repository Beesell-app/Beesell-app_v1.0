'use client'
// components/credit/out-of-credit-modal.tsx
// ══════════════════════════════════════════════════════════════
// Out of Credit / Upgrade Modal
// ══════════════════════════════════════════════════════════════
//
// 2 MODE:
//
// Mode 'insufficient' (saldo kurang):
//   ┌──────────────────────────────────┐
//   │ ⚠️ Credit Tidak Cukup            │
//   │ Butuh 40, saldo kamu 15           │
//   │                                   │
//   │ Pilih top-up:                     │
//   │ [100 credit  Rp49K] [500 Rp199K]  │
//   │ [1000 Rp349K]                     │
//   │ atau                              │
//   │ [↗ Upgrade Plan]                  │
//   └──────────────────────────────────┘
//
// Mode 'upgrade-required' (tool tidak ada di plan):
//   ┌──────────────────────────────────┐
//   │ 🚀 Tool ini eksklusif Pro+       │
//   │ UGC Video Generator butuh Pro    │
//   │ atau Business plan.               │
//   │                                   │
//   │ [↗ Upgrade ke Pro Rp399K/bln]    │
//   └──────────────────────────────────┘
//
// ══════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import Link from 'next/link'
import { X, Zap, ArrowUpRight, Plus, Sparkles, Crown } from 'lucide-react'
import { formatCredit, formatRupiah, planLabel } from '@/hooks/use-credits'

interface Props {
  mode:           'insufficient' | 'upgrade-required'
  toolId:         string
  requiredCredit: number
  currentBalance: number
  currentPlan?:   string
  onClose:        () => void
}

// ── Top-up packs (sync dengan credit_packs table di DB) ──────
const TOPUP_PACKS = [
  { id: 'pack-100',  credits: 100,  price: 49000,  badge: null,           perCredit: 490 },
  { id: 'pack-500',  credits: 500,  price: 199000, badge: 'POPULER',      perCredit: 398 },
  { id: 'pack-1000', credits: 1000, price: 349000, badge: 'PALING HEMAT', perCredit: 349 },
]

// ── Suggested upgrade based on current plan ──────────────────
const upgradePath: Record<string, { tier: string; price: number; benefits: string[] }> = {
  starter: {
    tier: 'Pro',
    price: 399000,
    benefits: [
      'Semua AI Image (Packshot, Enhancer, Try-On)',
      '200 credit/bulan untuk video',
      'Marketing tools (Campaign Builder + Audience Intel)',
      'Multi-platform scheduler',
    ],
  },
  basic: {
    tier: 'Pro',
    price: 399000,
    benefits: [
      'Akses semua video AI (UGC, Talking Head, Image to Video)',
      '200 credit/bulan',
      'Virtual Try-On + Product to Model',
      'Marketing tools',
    ],
  },
  pro: {
    tier: 'Business',
    price: 999000,
    benefits: [
      '600 credit/bulan (3x lipat Pro)',
      'Team access 5 anggota',
      'Budget Optimizer AI',
      'API access + dedicated manager',
    ],
  },
}

const C = {
  amber: '#F59E0B',  amberDk: '#D97706', amber50: '#FFFBEB',
  red:   '#DC2626',  red50: '#FEF2F2',
  blue:  '#2563EB',  blue50: '#EFF6FF',
  purple:'#7C3AED',  pur50:'#F5F3FF',
  green: '#059669',  grn50:'#ECFDF5',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC',
  white: '#FFFFFF',
}

export default function OutOfCreditModal({
  mode, toolId, requiredCredit, currentBalance, currentPlan = 'starter', onClose,
}: Props) {

  // ── ESC to close ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const upgrade = upgradePath[currentPlan] ?? upgradePath.starter
  const shortageCredit = Math.max(0, requiredCredit - currentBalance)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', backdropFilter: 'blur(4px)',
        animation: 'modalFadeIn 0.15s ease-out',
      }}>

      <style>{`
        @keyframes modalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlide { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          background: C.white, borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          overflow: 'hidden', fontFamily: 'inherit',
          animation: 'modalSlide 0.2s ease-out',
        }}>

        {/* ── HEADER ────────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 16px',
          background: mode === 'insufficient'
            ? `linear-gradient(135deg, ${C.red50}, ${C.white})`
            : `linear-gradient(135deg, ${C.amber50}, ${C.white})`,
          borderBottom: `1px solid ${C.slate100}`,
          position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '6px', borderRadius: '6px', color: C.slate500,
          }}>
            <X size={18}/>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: mode === 'insufficient' ? C.red50 : C.amber50,
              border: `1.5px solid ${mode === 'insufficient' ? C.red : C.amber}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {mode === 'insufficient'
                ? <Zap size={20} color={C.red}/>
                : <Crown size={20} color={C.amberDk}/>}
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: C.slate900, marginBottom: '2px' }}>
                {mode === 'insufficient' ? 'Credit Tidak Cukup' : 'Tool Eksklusif Pro+'}
              </h2>
              <p style={{ fontSize: '12px', color: C.slate500 }}>
                {mode === 'insufficient'
                  ? `Butuh ${requiredCredit} credit, saldo kamu ${formatCredit(currentBalance)}`
                  : `Tool ini hanya tersedia di plan Pro atau Business`}
              </p>
            </div>
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────── */}
        <div style={{ padding: '20px 24px' }}>

          {/* INSUFFICIENT MODE: show top-up packs */}
          {mode === 'insufficient' && (
            <>
              <div style={{
                marginBottom: '16px', padding: '12px 14px',
                borderRadius: '10px', background: C.red50,
                border: `1px solid ${C.red}20`,
                fontSize: '12px', color: C.slate700, lineHeight: 1.55,
              }}>
                Kamu butuh tambahan <strong style={{ color: C.red }}>
                  {formatCredit(shortageCredit)} credit
                </strong> untuk generate. Pilih top-up di bawah:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {TOPUP_PACKS.map(pack => (
                  <Link key={pack.id} href={`/settings/credits/topup?pack=${pack.id}`}
                    onClick={onClose}
                    style={{
                      padding: '12px 10px', borderRadius: '11px',
                      background: pack.badge === 'POPULER' ? C.amber50 : C.white,
                      border: `1.5px solid ${pack.badge === 'POPULER' ? C.amber : C.slate200}`,
                      textDecoration: 'none', position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = C.amber
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = pack.badge === 'POPULER' ? C.amber : C.slate200
                      ;(e.currentTarget as HTMLElement).style.transform = ''
                    }}>
                    {pack.badge && (
                      <span style={{
                        position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)',
                        padding: '2px 7px', borderRadius: '99px',
                        background: pack.badge === 'POPULER' ? C.amber : C.green,
                        color: C.white, fontSize: '8px', fontWeight: 800, letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}>
                        {pack.badge}
                      </span>
                    )}
                    <Zap size={16} fill={C.amber} color={C.amber} style={{ marginBottom: '4px' }}/>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: C.slate900 }}>{pack.credits}</div>
                    <div style={{ fontSize: '9px', color: C.slate500, marginTop: '1px' }}>credit</div>
                    <div style={{
                      marginTop: '6px', padding: '3px 8px', borderRadius: '99px',
                      background: C.slate100, fontSize: '10px', fontWeight: 700, color: C.slate700,
                    }}>
                      {formatRupiah(pack.price)}
                    </div>
                    <div style={{ marginTop: '3px', fontSize: '8px', color: C.slate400 }}>
                      Rp{pack.perCredit}/credit
                    </div>
                  </Link>
                ))}
              </div>

              <div style={{ textAlign: 'center', fontSize: '11px', color: C.slate400, marginBottom: '14px' }}>
                atau
              </div>
            </>
          )}

          {/* Upgrade plan CTA (always shown) */}
          <div style={{
            padding: '14px 16px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${C.pur50}, ${C.amber50})`,
            border: `1.5px solid ${C.purple}30`,
            marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={14} color={C.purple}/>
              <strong style={{ fontSize: '12px', color: C.purple, letterSpacing: '0.02em' }}>
                UPGRADE KE {upgrade.tier.toUpperCase()}
              </strong>
              <span style={{
                marginLeft: 'auto', fontSize: '13px', fontWeight: 800, color: C.slate900,
              }}>
                {formatRupiah(upgrade.price)}<span style={{ fontSize: '10px', color: C.slate500, fontWeight: 500 }}>/bln</span>
              </span>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: '11px', color: C.slate700, lineHeight: 1.6 }}>
              {upgrade.benefits.map(b => (
                <li key={b} style={{ marginBottom: '2px' }}>{b}</li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/pricing" onClick={onClose}
              style={{
                flex: 1, padding: '12px',
                borderRadius: '10px', textAlign: 'center', textDecoration: 'none',
                background: `linear-gradient(135deg, ${C.purple}, ${C.amber})`,
                color: C.white, fontSize: '13px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
              <ArrowUpRight size={14}/> Upgrade ke {upgrade.tier}
            </Link>
            <button onClick={onClose}
              style={{
                padding: '12px 18px', borderRadius: '10px',
                background: C.white, border: `1.5px solid ${C.slate200}`,
                color: C.slate600, fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}