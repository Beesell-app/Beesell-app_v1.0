'use client'
// components/daily-limit/usage-progress-badge.tsx
// ══════════════════════════════════════════════════════════════
// Usage Progress Badge — Tampil di tool pages
// Variant: 'full' (untuk header) | 'compact' (untuk card grid)
// ══════════════════════════════════════════════════════════════

import { useDailyUsage } from '@/hooks/use-daily-usage'
import { Clock } from 'lucide-react'

const C = {
  purple: '#7C3AED', purpleBg: '#F5F3FF',
  green:  '#10B981', greenBg:  '#D1FAE5',
  amber:  '#F59E0B', amberBg:  '#FEF3C7',
  red:    '#EF4444', redBg:    '#FEE2E2',
  slate900: '#0F172A', slate600: '#475569',
  slate500: '#64748B', slate400: '#94A3B8',
  slate200: '#E2E8F0', slate100: '#F1F5F9',
}

interface Props {
  toolId:   string
  variant?: 'full' | 'compact'
}

export function UsageProgressBadge({ toolId, variant = 'full' }: Props) {
  const { getToolUsage, isLoading } = useDailyUsage()
  
  if (isLoading) {
    return (
      <div style={{
        padding: variant === 'compact' ? '4px 8px' : '6px 12px',
        background: C.slate100,
        borderRadius: 99,
        fontSize: 11, color: C.slate400,
      }}>
        Loading...
      </div>
    )
  }

  const usage = getToolUsage(toolId)
  
  // Tool unlimited (no daily limit config)
  if (!usage) {
    if (variant === 'compact') return null
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 99,
        background: C.greenBg, color: C.green,
        fontSize: 11, fontWeight: 700,
      }}>
        ✨ Unlimited
      </div>
    )
  }

  // Choose color based on usage percentage
  const isWarning  = usage.pct_used >= 80 && usage.pct_used < 100
  const isAtLimit  = usage.pct_used >= 100
  
  const color = isAtLimit ? C.red : isWarning ? C.amber : C.purple
  const bg    = isAtLimit ? C.redBg : isWarning ? C.amberBg : C.purpleBg

  if (variant === 'compact') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 99,
        background: bg, color,
        fontSize: 10, fontWeight: 700,
      }}>
        {usage.current}/{usage.limit}
      </span>
    )
  }

  // Full variant
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 99,
      background: bg, color,
      fontSize: 12, fontWeight: 700,
    }}>
      <Clock size={13}/>
      <span>
        <strong>{usage.current}</strong>
        <span style={{ color: C.slate500, fontWeight: 500 }}>/{usage.limit}</span>
        <span style={{ marginLeft: 4 }}>hari ini</span>
      </span>
      {isAtLimit && (
        <span style={{
          fontSize: 9, fontWeight: 800,
          padding: '2px 6px', borderRadius: 99,
          background: color, color: '#fff',
        }}>
          LIMIT
        </span>
      )}
    </div>
  )
}