'use client'
// apps/web-app/components/dashboard/QuotaBar.tsx
// Quota bar yang pakai selector dari sessionStore — contoh pakai store
import Link          from 'next/link'
import { useQuota }  from '@/store/sessionStore'
import { useTenant } from '@/store/sessionStore'
import { Zap }       from 'lucide-react'

interface Props {
  type?:    'content' | 'video'
  compact?: boolean
}

export function QuotaBar({ type = 'content', compact = false }: Props) {
  const quota  = useQuota(type)
  const tenant = useTenant()

  if (!tenant) return null

  const label = type === 'content'
  ? 'Kredit Konten'
  : 'Kredit Video'

  const isLow = quota.pct >= 90

  const barColor = isLow
    ? '#DC2626'
    : quota.pct >= 75
      ? '#F59E0B'
      : '#2563EB'

  const bgColor = isLow
    ? '#FEF2F2'
    : '#EFF6FF'

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: isLow ? '#DC2626' : '#64748B' }}>
        <div style={{ width: '60px', height: '4px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(quota.pct, 100)}%`, background: barColor, borderRadius: '99px', transition: 'width .3s' }} />
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
          {quota.used}/{quota.max}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      padding: '12px 14px',
      background: bgColor,
      border: `1px solid ${isLow ? '#fecaca' : '#BFDBFE'}`,
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={13} color={barColor} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{label}</span>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: barColor,
          fontFamily: "'DM Mono', monospace",
        }}>
          {quota.used} / {quota.max}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(quota.pct, 100)}%`,
          background: barColor,
          borderRadius: '99px',
          transition: 'width .4s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
          Reset:{' '}
          {new Date(tenant.quotaResetAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
        </span>
        {isLow && (
          <Link href="/settings/billing" style={{ fontSize: '11px', color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
            Upgrade →
          </Link>
        )}
      </div>
    </div>
  )
}
