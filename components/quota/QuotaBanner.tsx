'use client'
// apps/web-app/components/quota/QuotaBanner.tsx
// Warning banner: tampil jika quota < 10% atau habis
import Link from 'next/link'
import { AlertTriangle, Zap, X, Clock } from 'lucide-react'
import { useState }       from 'react'
import { useQuotaStatus } from '@/lib/hooks/useQuotaStatus'

export function QuotaBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { data: quota } = useQuotaStatus('content')

  if (!quota || quota.warningLevel === 'none') return null
  if (quota.warningLevel === 'warning' && dismissed) return null

  const isCritical = quota.warningLevel === 'critical'

  const hoursLeft   = Math.floor(quota.daily.resetInSec / 3600)
  const minutesLeft = Math.floor((quota.daily.resetInSec % 3600) / 60)
  const resetLabel  = hoursLeft > 0 ? `${hoursLeft} jam ${minutesLeft} menit` : `${minutesLeft} menit`

  return (
    <div style={{
      padding: '12px 20px',
      background: isCritical
        ? 'linear-gradient(90deg, #FEF2F2 0%, #FECACA 100%)'
        : 'linear-gradient(90deg, #FFFBEB 0%, #FDE68A 100%)',
      border: `1px solid ${isCritical ? '#FCA5A5' : '#FCD34D'}`,
      borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '14px',
      fontFamily: "'DM Sans', sans-serif",
      marginBottom: '16px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: isCritical ? '#DC2626' : '#D97706',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isCritical
          ? <AlertTriangle size={18} color="#fff" strokeWidth={2.5} />
          : <Zap size={18} color="#fff" strokeWidth={2.5} />
        }
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '13px', fontWeight: 700,
          color: isCritical ? '#7F1D1D' : '#78350F',
          marginBottom: '2px',
        }}>
          {isCritical
            ? (quota.blockReason === 'daily_exceeded'
                ? '🚫 Kuota harian habis'
                : '🚫 Kuota bulanan habis')
            : `⚠️ Kuota tinggal ${100 - quota.daily.pct}% (${quota.daily.remaining} kredit)`
          }
        </div>
        <div style={{ fontSize: '11px', color: isCritical ? '#991B1B' : '#92400E' }}>
          {quota.blockReason === 'daily_exceeded' && (
            <>
              <Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />
              Reset dalam {resetLabel}, atau upgrade untuk lanjut sekarang
            </>
          )}
          {quota.blockReason === 'monthly_exceeded' && (
            <>Reset tanggal {new Date(quota.monthly.resetAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}, atau upgrade plan</>
          )}
          {!isCritical && <>Upgrade ke Pro untuk dapat 50 kredit/hari dan fitur lengkap</>}
        </div>
      </div>

      <Link href="/settings/billing" style={{
        padding: '8px 16px',
        background: isCritical ? '#DC2626' : '#D97706',
        color: '#fff', borderRadius: '8px',
        fontSize: '12px', fontWeight: 600,
        textDecoration: 'none', whiteSpace: 'nowrap',
      }}>
        Upgrade →
      </Link>

      {!isCritical && (
        <button
          onClick={() => setDismissed(true)}
          style={{
            width: '28px', height: '28px',
            background: 'transparent', border: 'none',
            cursor: 'pointer', color: '#92400E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Tutup"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}