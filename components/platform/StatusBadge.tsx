'use client'
// apps/web-app/components/platform/StatusBadge.tsx
// Status: Terhubung (hijau) / Expired (merah) / Tidak Terhubung (abu) / Error / Pending
import { getStatusColor, getStatusLabel } from '@/lib/platform/platform-config'
import type { ConnectionStatus } from '@/lib/platform/platform-config'

interface Props {
  status:  ConnectionStatus
  size?:   'sm' | 'md'
  pulse?:  boolean   // animate dot (for connected/pending)
}

export function ConnectionStatusBadge({ status, size = 'md', pulse }: Props) {
  const c    = getStatusColor(status)
  const label = getStatusLabel(status)
  const px   = size === 'sm' ? '3px 8px' : '4px 10px'
  const fs   = size === 'sm' ? '10px' : '11px'
  const dotW = size === 'sm' ? '5px' : '6px'

  const shouldPulse = pulse && (status === 'connected' || status === 'pending')

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      padding:      px,
      background:   c.bg,
      color:        c.text,
      border:       `1px solid ${c.border}`,
      borderRadius: '99px',
      fontSize:     fs,
      fontWeight:   600,
      fontFamily:   "'DM Sans', sans-serif",
      whiteSpace:   'nowrap',
    }}>
      <span style={{
        width:        dotW,
        height:       dotW,
        borderRadius: '50%',
        background:   c.dot,
        display:      'inline-block',
        flexShrink:   0,
        animation:    shouldPulse ? 'statusPulse 2s ease-in-out infinite' : 'none',
      }} />
      {label}
      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .5; transform: scale(.8); }
        }
      `}</style>
    </span>
  )
}

// ── Compact dot-only version ──────────────────────────────────
export function StatusDot({ status }: { status: ConnectionStatus }) {
  const c = getStatusColor(status)
  return (
    <span
      title={getStatusLabel(status)}
      style={{
        display:      'inline-block',
        width:        '8px',
        height:       '8px',
        borderRadius: '50%',
        background:   c.dot,
        flexShrink:   0,
      }}
    />
  )
}