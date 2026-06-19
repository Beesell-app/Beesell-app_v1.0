'use client'
// components/credit/cost-preview-button.tsx
// ══════════════════════════════════════════════════════════════
// Cost Preview Button — Generate dengan Credit Info
// ══════════════════════════════════════════════════════════════
//
// Komponen reusable untuk menggantikan tombol "Generate" biasa.
// Otomatis show cost + warning kalau saldo kurang.
//
// USAGE di tool page:
//
//   <CostPreviewButton
//     toolId="ugc-generator"
//     label="Generate Video UGC"
//     loading={renderLoading}
//     onClick={handleGenerate}
//   />
//
// 3 STATE OTOMATIS:
//   1. Saldo cukup → button aktif, show "Generate (40 ⚡)"
//   2. Saldo kurang → button disabled, show "Saldo kurang — Top-up"
//   3. Plan tidak include → "Tool ini perlu Pro+" → CTA upgrade
//
// ══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Zap, Loader2, AlertCircle, ArrowUpRight, Plus } from 'lucide-react'
import {
  useCreditCheck,
  formatCredit,
  type ToolId,
} from '@/hooks/use-credits'
import OutOfCreditModal from '@/components/credit/out-of-credit-modal'

interface Props {
  toolId:      ToolId
  label:       string         // 'Generate Video UGC'
  loading?:    boolean
  disabled?:   boolean        // tambahan untuk validasi lain (e.g. form belum lengkap)
  onClick:     () => void
  size?:       'sm' | 'md' | 'lg'
  fullWidth?:  boolean
  className?:  string
}

const C = {
  amber: '#F59E0B',  amberDk: '#D97706', amber50: '#FFFBEB',
  red:   '#DC2626',  red50: '#FEF2F2',
  green: '#059669',
  purple: '#7C3AED', pink: '#EC4899',
  slate900: '#0F172A', slate700: '#334155', slate600: '#475569',
  slate500: '#64748B', slate400: '#94A3B8', slate300: '#CBD5E1',
  slate200: '#E2E8F0', slate100: '#F1F5F9',
  white: '#FFFFFF',
}

export default function CostPreviewButton({
  toolId, label, loading = false, disabled = false,
  onClick, size = 'md', fullWidth = false, className = '',
}: Props) {
  const check = useCreditCheck(toolId)
  const [modalMode, setModalMode] = useState<null | 'insufficient' | 'upgrade-required'>(null)

  // ── Size variants ──────────────────────────────────────────
  const sizes = {
    sm: { padding: '10px 16px',   fontSize: '12px', iconSize: 12, costSize: '11px' },
    md: { padding: '13px 22px',   fontSize: '14px', iconSize: 15, costSize: '12px' },
    lg: { padding: '16px 28px',   fontSize: '15px', iconSize: 17, costSize: '13px' },
  }
  const s = sizes[size]

  // ── Resolve state ──────────────────────────────────────────
  const isLoading      = check.isLoading || loading
  const isMetered      = check.isMetered
  const requiredCredit = check.requiredCredit
  const isInPlan       = check.isInPlan
  const hasEnough      = check.hasEnough
  const isClickable    = !isLoading && !disabled && hasEnough && isInPlan

  // ── Click handler ──────────────────────────────────────────
  const handleClick = () => {
    if (loading || disabled || check.isLoading) return

    if (!isInPlan) {
      setModalMode('upgrade-required')
      return
    }
    if (!hasEnough) {
      setModalMode('insufficient')
      return
    }
    onClick()
  }

  // ── Resolve button style ───────────────────────────────────
  let bgStyle: string
  let textColor: string
  let cursor: string
  let boxShadow: string

  if (isLoading) {
    bgStyle   = C.slate300
    textColor = C.white
    cursor    = 'wait'
    boxShadow = 'none'
  } else if (disabled || !isInPlan) {
    bgStyle   = C.slate100
    textColor = C.slate400
    cursor    = 'not-allowed'
    boxShadow = 'none'
  } else if (!hasEnough) {
    bgStyle   = `linear-gradient(135deg, ${C.red}, #B91C1C)`
    textColor = C.white
    cursor    = 'pointer'
    boxShadow = `0 4px 12px ${C.red}40`
  } else {
    bgStyle   = `linear-gradient(135deg, ${C.purple}, ${C.pink})`
    textColor = C.white
    cursor    = 'pointer'
    boxShadow = `0 6px 16px ${C.purple}40`
  }

  // ══════════════════════════════════════════════════════════
  return (
    <>
      <div style={{ width: fullWidth ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }} className={className}>

        {/* ── BUTTON ─────────────────────────────────────────── */}
        <button
          onClick={handleClick}
          disabled={isLoading || disabled}
          style={{
            width: fullWidth ? '100%' : 'auto',
            padding: s.padding, borderRadius: '11px', border: 'none',
            background: bgStyle, color: textColor,
            fontSize: s.fontSize, fontWeight: 700,
            cursor, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow, transition: 'all .15s', position: 'relative',
          }}
          onMouseEnter={e => {
            if (isClickable) {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = ''
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={s.iconSize} style={{ animation: 'spin .8s linear infinite' }}/>
              Memproses...
            </>
          ) : !isInPlan ? (
            <>
              <ArrowUpRight size={s.iconSize}/>
              Tool ini perlu Pro+
            </>
          ) : !hasEnough ? (
            <>
              <AlertCircle size={s.iconSize}/>
              Saldo kurang — Top-up
            </>
          ) : (
            <>
              {label}
              {isMetered && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  padding: '2px 8px', borderRadius: '99px',
                  background: 'rgba(255,255,255,0.25)',
                  fontSize: s.costSize, fontWeight: 800,
                }}>
                  <Zap size={s.iconSize - 3} fill="currentColor"/>
                  {requiredCredit}
                </span>
              )}
            </>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </button>

        {/* ── HELPER TEXT BELOW ──────────────────────────────── */}
        {!isLoading && isMetered && isInPlan && (
          <div style={{
            fontSize: '11px', color: hasEnough ? C.slate500 : C.red,
            display: 'flex', alignItems: 'center', gap: '5px',
            justifyContent: fullWidth ? 'center' : 'flex-start',
          }}>
            <Zap size={11} fill="currentColor"/>
            {hasEnough ? (
              <>
                Saldo kamu: <strong>{formatCredit(check.currentBalance)} credit</strong>
                <span style={{ color: C.slate400 }}>
                  — bisa untuk {Math.floor(check.currentBalance / requiredCredit)} generate
                </span>
              </>
            ) : (
              <>
                Butuh <strong>{requiredCredit} credit</strong> — saldo kamu hanya <strong>{formatCredit(check.currentBalance)}</strong>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL OUT OF CREDIT ────────────────────────────────── */}
      {modalMode && (
        <OutOfCreditModal
          mode={modalMode}
          toolId={toolId}
          requiredCredit={requiredCredit}
          currentBalance={check.currentBalance}
          currentPlan={check.planTier}
          onClose={() => setModalMode(null)}
        />
      )}
    </>
  )
}