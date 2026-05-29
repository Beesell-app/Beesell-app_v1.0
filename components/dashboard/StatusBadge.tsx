'use client'
// apps/web-app/components/dashboard/StatusBadge.tsx
// ── Unified Status Badge Component ───────────────────────────
// BeeSell AI Dashboard
// Features:
// - Compact + medium size
// - Full status coverage
// - Prisma type-safe
// - Centralized design system
// - Border + background support
// - Graceful fallback
// - Reusable across dashboard/library/jobs

import type { ContentStatus } from '@prisma/client'

type BadgeSize = 'sm' | 'md'

interface StatusConfig {
  label:  string
  bg:     string
  color:  string
  border: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label:  'Draft',
    bg:     '#F8FAFC',
    color:  '#64748B',
    border: '#CBD5E1',
  },

  generating: {
    label:  'Generating',
    bg:     '#EFF6FF',
    color:  '#2563EB',
    border: '#BFDBFE',
  },

  ready: {
    label:  'Siap',
    bg:     '#F0FDF4',
    color:  '#16A34A',
    border: '#BBF7D0',
  },

  scheduled: {
    label:  'Terjadwal',
    bg:     '#FFF7ED',
    color:  '#D97706',
    border: '#FED7AA',
  },

  published: {
    label:  'Published',
    bg:     '#EFF6FF',
    color:  '#1D4ED8',
    border: '#BFDBFE',
  },

  failed: {
    label:  'Gagal',
    bg:     '#FEF2F2',
    color:  '#DC2626',
    border: '#FECACA',
  },

  archived: {
    label:  'Diarsipkan',
    bg:     '#F1F5F9',
    color:  '#94A3B8',
    border: '#E2E8F0',
  },
}

interface Props {
  status: ContentStatus | string
  size?: BadgeSize

  /**
   * Optional:
   * show border or not
   */
  bordered?: boolean

  /**
   * Optional:
   * force full width
   */
  fullWidth?: boolean

  /**
   * Optional:
   * custom inline style override
   */
  style?: React.CSSProperties
}

export function StatusBadge({
  status,
  size       = 'sm',
  bordered   = true,
  fullWidth  = false,
  style,
}: Props) {

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft

  const isSmall = size === 'sm'

  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',

        width:          fullWidth ? '100%' : 'fit-content',

        padding:        isSmall
          ? '3px 8px'
          : '5px 11px',

        background:     config.bg,
        color:          config.color,

        border: bordered
          ? `1px solid ${config.border}`
          : 'none',

        borderRadius:   isSmall ? '6px' : '8px',

        fontSize:       isSmall ? '10px' : '11px',

        fontWeight:     600,

        letterSpacing:  '0.02em',

        lineHeight:     1.4,

        whiteSpace:     'nowrap',

        fontFamily:     "'DM Sans', sans-serif",

        transition:     'all .15s ease',

        userSelect:     'none',

        ...style,
      }}
    >
      {config.label}
    </span>
  )
}