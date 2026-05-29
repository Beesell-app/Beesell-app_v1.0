'use client'
// apps/web-app/components/dashboard/KpiCard.tsx
import type { ReactNode } from 'react'

interface Props {
  label:        string
  value:        string | number
  subValue?:    string
  icon:         ReactNode
  iconBg?:      string
  iconColor?:   string
  trend?:       { value: number; label: string }  // +23% vs last month
  alert?:       boolean   // highlight merah kalau warning
  loading?:     boolean
  action?:      { label: string; href: string }
}

export function KpiCard({
  label, value, subValue, icon, iconBg = '#EFF6FF', iconColor = '#2563EB',
  trend, alert, loading, action,
}: Props) {
  if (loading) return <KpiCardSkeleton />

  const trendPositive = (trend?.value ?? 0) >= 0
  const trendColor    = alert ? '#DC2626' : (trendPositive ? '#16A34A' : '#DC2626')

  return (
    <div style={{
      padding:      '18px 20px',
      background:   '#fff',
      border:       `1px solid ${alert ? '#FECACA' : '#E2E8F0'}`,
      borderRadius: '14px',
      boxShadow:    alert
        ? '0 1px 2px rgba(220,38,38,.06)'
        : '0 1px 2px rgba(15,23,42,.04)',
      display:        'flex',
      flexDirection:  'column',
      gap:            '12px',
      fontFamily:     "'DM Sans', sans-serif",
      transition:     'box-shadow .15s',
      position:       'relative',
      overflow:       'hidden',
    }}>
      {/* Alert stripe */}
      {alert && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px', background: '#DC2626',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width:        '36px',
          height:       '36px',
          borderRadius: '10px',
          background:   alert ? '#FEE2E2' : iconBg,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          color:        alert ? '#DC2626' : iconColor,
          flexShrink:   0,
        }}>
          {icon}
        </div>

        {trend && (
          <span style={{
            fontSize:   '11px',
            fontWeight: 600,
            color:      trendColor,
            background: alert ? '#FEE2E2' : (trendPositive ? '#F0FDF4' : '#FEF2F2'),
            padding:    '2px 8px',
            borderRadius: '6px',
          }}>
            {trendPositive ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p style={{
          fontFamily:    "'Fraunces', serif",
          fontSize:      '28px',
          fontWeight:    600,
          color:         alert ? '#DC2626' : '#0F172A',
          letterSpacing: '-0.02em',
          lineHeight:    1.1,
          marginBottom:  '4px',
        }}>
          {value}
        </p>

        <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
          {label}
        </p>

        {subValue && (
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            {subValue}
          </p>
        )}
      </div>

      {/* Action link */}
      {action && (
        <a
          href={action.href}
          style={{
            fontSize:       '11px',
            fontWeight:     600,
            color:          '#2563EB',
            textDecoration: 'none',
            marginTop:      '-4px',
          }}
        >
          {action.label} →
        </a>
      )}
    </div>
  )
}

// ── Skeleton ────────────────────────────────────────────────
export function KpiCardSkeleton() {
  return (
    <div style={{
      padding:      '18px 20px',
      background:   '#fff',
      border:       '1px solid #E2E8F0',
      borderRadius: '14px',
      display:      'flex',
      flexDirection: 'column',
      gap:          '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={shimmer('36px', '36px', '10px')} />
        <div style={shimmer('60px', '20px')} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={shimmer('80px', '28px')} />
        <div style={shimmer('120px', '14px')} />
      </div>
      <style>{SHIMMER_CSS}</style>
    </div>
  )
}

function shimmer(w: string, h: string, br = '6px'): React.CSSProperties {
  return {
    width:          w,
    height:         h,
    borderRadius:   br,
    background:     'linear-gradient(90deg,#F8FAFC 25%,#F1F5F9 50%,#F8FAFC 75%)',
    backgroundSize: '200% 100%',
    animation:      'shimmer 1.5s infinite',
  }
}

const SHIMMER_CSS = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`