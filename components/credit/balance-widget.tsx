'use client'
// components/credit/balance-widget.tsx
// ══════════════════════════════════════════════════════════════
// Credit Balance Widget — di Header Dashboard
// ══════════════════════════════════════════════════════════════
//
// Tampilan:
//   [⚡ 247 credit  •  Pro  ▾]      ← collapsed pill
//
// Klik → dropdown panel:
//   ┌──────────────────────────────┐
//   │ ⚡ 247 credit  ───  PRO        │
//   │ ████████░░  60% quota         │
//   │ Reset dalam 18 hari            │
//   │                                │
//   │ [+ Top-up Credit]              │
//   │ [↗ Upgrade Plan]               │
//   │ → Lihat history transaksi      │
//   └──────────────────────────────┘
//
// ══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Zap, ChevronDown, Plus, ArrowUpRight, History, AlertTriangle } from 'lucide-react'

import {
  useCredits,
  formatCredit,
  formatRupiah,
  planLabel,
  planColor,
} from '@/hooks/use-credits'

// ── Color tokens ─────────────────────────────────────────────
const C = {
  amber: '#F59E0B',  amberDk: '#D97706', amber50: '#FFFBEB', amber100: '#FEF3C7',
  red:   '#DC2626',  red50: '#FEF2F2',
  green: '#059669',  green50: '#ECFDF5',
  blue:  '#2563EB',  blue50: '#EFF6FF',
  slate900: '#0F172A', slate700: '#334155', slate600: '#475569',
  slate500: '#64748B', slate400: '#94A3B8', slate300: '#CBD5E1',
  slate200: '#E2E8F0', slate100: '#F1F5F9', slate50: '#F8FAFC',
  white: '#FFFFFF',
}

export default function CreditBalanceWidget() {
  const {
    data: credits,
    isLoading,
    isError,
    } = useCredits()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // ── Close on outside click ────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 14px', borderRadius: '10px',
        background: C.slate100, border: `1px solid ${C.slate200}`,
        fontSize: '13px', color: C.slate400, fontFamily: 'inherit',
      }}>
        <Zap size={14} style={{ opacity: 0.5 }}/>
        <span>Memuat...</span>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────
  if (isError || !credits) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 14px', borderRadius: '10px',
        background: C.red50, border: `1px solid ${C.red}30`,
        fontSize: '13px', color: C.red, fontFamily: 'inherit',
      }}>
        <AlertTriangle size={14}/>
        <span>Credit error</span>
      </div>
    )
  }

  // ── Derived state ─────────────────────────────────────────
  const plan = planColor(credits.plan_tier)
  const quotaPercent = credits.monthly_quota > 0
    ? Math.min(100, (credits.current_balance / credits.monthly_quota) * 100)
    : 0
  const isLow      = credits.monthly_quota > 0 && quotaPercent < 20
  const isCritical = credits.current_balance < 30 && credits.monthly_quota > 0

  // ══════════════════════════════════════════════════════════
  return (
    <div ref={wrapRef} style={{ position: 'relative', fontFamily: 'inherit' }}>

      {/* ── COLLAPSED PILL ──────────────────────────────────── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '7px 12px 7px 14px', borderRadius: '10px',
          background: open ? C.amber50 : C.white,
          border: `1.5px solid ${open ? C.amber : C.slate200}`,
          fontSize: '13px', fontWeight: 700, color: C.slate900,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all .15s',
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.borderColor = C.amber
            ;(e.currentTarget as HTMLElement).style.background = C.amber50
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.borderColor = C.slate200
            ;(e.currentTarget as HTMLElement).style.background = C.white
          }
        }}
      >
        {/* Credit amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} fill={C.amber} color={C.amber}/>
          <span style={{
            color: isCritical ? C.red : C.slate900,
            animation: isCritical ? 'pulse 2s infinite' : 'none',
          }}>
            {formatCredit(credits.current_balance)}
          </span>
        </div>

        {/* Plan badge */}
        <span style={{
          padding: '2px 8px', borderRadius: '99px',
          background: plan.light, color: plan.primary,
          fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {planLabel(credits.plan_tier)}
        </span>

        <ChevronDown size={14} color={C.slate500} style={{
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform .15s',
        }}/>
      </button>

      {/* ── DROPDOWN PANEL ──────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '320px', borderRadius: '14px',
          background: C.white, border: `1px solid ${C.slate200}`,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          zIndex: 100, overflow: 'hidden',
        }}>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>

          {/* Header — balance + plan */}
          <div style={{
            padding: '18px 20px 16px',
            background: `linear-gradient(135deg, ${C.amber50}, ${C.white})`,
            borderBottom: `1px solid ${C.slate100}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <Zap size={20} fill={C.amber} color={C.amber}/>
              <span style={{ fontSize: '26px', fontWeight: 800, color: C.slate900, letterSpacing: '-0.02em' }}>
                {formatCredit(credits.current_balance)}
              </span>
              <span style={{ fontSize: '13px', color: C.slate500, fontWeight: 500 }}>credit</span>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '3px 10px', borderRadius: '99px',
                background: plan.light, color: plan.primary,
                fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                Plan {planLabel(credits.plan_tier)}
              </span>
              {credits.plan_price > 0 && (
                <span style={{ fontSize: '11px', color: C.slate500 }}>
                  {formatRupiah(credits.plan_price)}/bln
                </span>
              )}
            </div>
          </div>

          {/* Quota progress (only if metered plan) */}
          {credits.monthly_quota > 0 && (
            <div style={{ padding: '14px 20px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: C.slate500, fontWeight: 600 }}>Kuota bulanan</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: isLow ? C.red : C.slate700 }}>
                  {formatCredit(credits.current_balance)} / {formatCredit(credits.monthly_quota)}
                </span>
              </div>
              <div style={{ height: '6px', background: C.slate100, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${quotaPercent}%`,
                  background: isLow ? C.red : `linear-gradient(90deg, ${C.amber}, ${C.amberDk})`,
                  transition: 'width .3s',
                }}/>
              </div>
              {credits.days_until_reset !== null && credits.days_until_reset > 0 && (
                <div style={{ marginTop: '6px', fontSize: '10px', color: C.slate500 }}>
                  Reset dalam <strong style={{ color: C.slate700 }}>{credits.days_until_reset} hari</strong>
                </div>
              )}
            </div>
          )}

          {/* Starter / Basic: highlight CTA upgrade */}
          {credits.monthly_quota === 0 && (
            <div style={{
              margin: '14px 20px 0', padding: '12px 14px',
              borderRadius: '10px', background: C.blue50,
              border: `1px solid ${C.blue}20`,
              fontSize: '11px', color: C.slate700, lineHeight: 1.6,
            }}>
              {credits.plan_tier === 'starter'
                ? 'Plan Starter hanya gratis untuk Quick Tools. Upgrade ke Pro untuk video AI dan credit bulanan.'
                : 'Plan Basic tidak include credit video. Upgrade ke Pro untuk UGC Generator & Talking Head.'}
            </div>
          )}

          {/* Stats: total consumed + purchased */}
          {(credits.total_consumed > 0 || credits.total_purchased > 0) && (
            <div style={{
              padding: '10px 20px',
              display: 'flex', gap: '20px',
              borderTop: `1px solid ${C.slate100}`,
              fontSize: '10px', color: C.slate500,
            }}>
              <div>
                <div style={{ fontWeight: 700, color: C.slate700 }}>{formatCredit(credits.total_consumed)}</div>
                <div>Sudah dipakai</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: C.slate700 }}>{formatCredit(credits.total_purchased)}</div>
                <div>Sudah dibeli</div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/settings/credits/topup" onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', borderRadius: '9px',
                background: `linear-gradient(135deg, ${C.amber}, ${C.amberDk})`,
                color: C.white, fontSize: '12px', fontWeight: 700,
                textDecoration: 'none',
              }}>
              <Plus size={14}/> Top-up Credit
            </Link>

            {credits.plan_tier !== 'business' && (
              <Link href="/pricing" onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px', borderRadius: '9px',
                  background: C.white, border: `1.5px solid ${C.slate200}`,
                  color: C.slate700, fontSize: '12px', fontWeight: 700,
                  textDecoration: 'none',
                }}>
                <ArrowUpRight size={14}/> Upgrade Plan
              </Link>
            )}

            <Link href="/settings/credits" onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '6px', marginTop: '4px',
                fontSize: '11px', fontWeight: 600,
                color: C.slate500, textDecoration: 'none',
              }}>
              <History size={11}/> Lihat history transaksi
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}