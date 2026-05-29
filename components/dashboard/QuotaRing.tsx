'use client'
// apps/web-app/components/dashboard/QuotaRing.tsx
// Circular SVG progress ring untuk quota display

interface Props {
  used:     number
  max:      number
  percent:  number
  label:    string   // "Daily" | "Monthly"
  reset:    string   // "Tengah malam WIB"
  loading?: boolean
}

export function QuotaRing({ used, max, percent, label, reset, loading }: Props) {
  const r   = 36        // radius
  const cx  = 48
  const cy  = 48
  const circumference = 2 * Math.PI * r
  const strokeDash    = (percent / 100) * circumference
  const remaining     = max - used

  const color = percent >= 90 ? '#DC2626'
              : percent >= 75 ? '#F59E0B'
              : '#2563EB'

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        padding: '16px',
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px',
      }}>
        <div style={{
          width: '96px', height: '96px', borderRadius: '50%',
          background: 'linear-gradient(90deg,#F8FAFC 25%,#F1F5F9 50%,#F8FAFC 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
        <div style={{
          width: '80px', height: '14px', borderRadius: '4px',
          background: 'linear-gradient(90deg,#F8FAFC 25%,#F1F5F9 50%,#F8FAFC 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    )
  }

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            '10px',
      padding:        '18px 16px',
      background:     '#fff',
      border:         `1px solid ${percent >= 90 ? '#FECACA' : '#E2E8F0'}`,
      borderRadius:   '14px',
      fontFamily:     "'DM Sans', sans-serif",
      textAlign:      'center',
      position:       'relative',
      overflow:       'hidden',
    }}>
      {percent >= 90 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#DC2626' }} />
      )}

      {/* SVG Ring */}
      <svg width="96" height="96" viewBox="0 0 96 96">
        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="8" />

        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />

        {/* Center text */}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16" fontWeight="700"
          fontFamily="DM Sans, sans-serif" fill={percent >= 90 ? '#DC2626' : '#0F172A'}>
          {percent}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10"
          fontFamily="DM Sans, sans-serif" fill="#94A3B8">
          {used}/{max}
        </text>
      </svg>

      {/* Labels */}
      <div>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
          Kuota {label}
        </p>
        <p style={{ fontSize: '11px', color: percent >= 90 ? '#DC2626' : '#64748B' }}>
          {percent >= 90
            ? '⚠️ Hampir habis!'
            : `${remaining} kredit tersisa`
          }
        </p>
        <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
          Reset: {reset}
        </p>
      </div>
    </div>
  )
}