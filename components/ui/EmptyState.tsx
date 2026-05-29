'use client'
// apps/web-app/components/ui/EmptyState.tsx
// ── Consistent empty states across all pages ──────────────────
import Link from 'next/link'

interface EmptyStateProps {
  icon?:       string      // emoji
  title:       string
  description?: string
  action?:     { label: string; href?: string; onClick?: () => void }
  secondaryAction?: { label: string; href?: string; onClick?: () => void }
  size?:       'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
}: EmptyStateProps) {
  const iconSize = size === 'sm' ? '28px' : size === 'lg' ? '48px' : '36px'
  const titleSize = size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px'
  const descSize  = size === 'sm' ? '12px' : '13px'
  const padding   = size === 'sm' ? '24px' : size === 'lg' ? '60px 24px' : '40px 24px'

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding,
      textAlign:      'center',
      fontFamily:     "'DM Sans', sans-serif",
    }}>
      <div style={{
        fontSize:     iconSize,
        marginBottom: '14px',
        lineHeight:   1,
      }}>
        {icon}
      </div>

      <h3 style={{
        fontSize:      titleSize,
        fontWeight:    700,
        color:         '#0F172A',
        letterSpacing: '-0.01em',
        marginBottom:  description ? '6px' : '20px',
      }}>
        {title}
      </h3>

      {description && (
        <p style={{
          fontSize:     descSize,
          color:        '#64748B',
          lineHeight:   1.6,
          marginBottom: '20px',
          maxWidth:     '320px',
        }}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {action && (
            action.href ? (
              <Link href={action.href} style={{
                padding:        '9px 18px',
                background:     'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color:          '#fff',
                textDecoration: 'none',
                borderRadius:   '10px',
                fontSize:       '13px',
                fontWeight:     600,
                boxShadow:      '0 2px 8px rgba(37,99,235,.25)',
              }}>
                {action.label}
              </Link>
            ) : (
              <button onClick={action.onClick} style={{
                padding:      '9px 18px',
                background:   'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color:        '#fff',
                border:       'none',
                borderRadius: '10px',
                fontSize:     '13px',
                fontWeight:   600,
                cursor:       'pointer',
                fontFamily:   "'DM Sans', sans-serif",
              }}>
                {action.label}
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href} style={{
                padding:        '9px 16px',
                background:     '#fff',
                border:         '1px solid #E2E8F0',
                color:          '#475569',
                textDecoration: 'none',
                borderRadius:   '10px',
                fontSize:       '13px',
                fontWeight:     500,
              }}>
                {secondaryAction.label}
              </Link>
            ) : (
              <button onClick={secondaryAction.onClick} style={{
                padding:      '9px 16px',
                background:   '#fff',
                border:       '1px solid #E2E8F0',
                color:        '#475569',
                borderRadius: '10px',
                fontSize:     '13px',
                fontWeight:   500,
                cursor:       'pointer',
                fontFamily:   "'DM Sans', sans-serif",
              }}>
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── Pre-built empty states ────────────────────────────────────
export const EMPTY_STATES = {
  library: {
    icon:        '📝',
    title:       'Belum ada konten',
    description: 'Generate caption atau gambar pertama kamu untuk mulai.',
    action:      { label: '+ Buat Konten', href: '/content/new' },
  },
  search: {
    icon:        '🔍',
    title:       'Tidak ada hasil',
    description: 'Coba kata kunci lain atau hapus filter.',
  },
  scheduler: {
    icon:        '📅',
    title:       'Belum ada jadwal minggu ini',
    description: 'Drag konten dari panel kiri ke slot waktu yang kamu inginkan.',
  },
  notifications: {
    icon:        '🔔',
    title:       'Tidak ada notifikasi',
    description: 'Notifikasi publish success/failed akan muncul di sini.',
  },
  brandKit: {
    icon:        '🎨',
    title:       'Belum ada brand kit',
    description: 'Buat brand kit untuk konsistensi tone dan warna konten kamu.',
    action:      { label: '+ Buat Brand Kit', href: '/settings/brand-kit' },
  },
  connections: {
    icon:        '🔌',
    title:       'Belum ada platform terhubung',
    description: 'Hubungkan Instagram atau TikTok untuk auto-post konten.',
    action:      { label: 'Hubungkan Platform', href: '/settings/connections' },
  },
} as const