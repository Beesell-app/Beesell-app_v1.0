'use client'
// apps/web-app/components/library/ContentRow.tsx
// List view row untuk content
import Link from 'next/link'
import { Image as ImageIcon, Type, Video, FileText, ArrowRight } from 'lucide-react'
import type { ContentListItem } from '@/lib/library-types'

interface Props {
  item:    ContentListItem
  onClick?: () => void
  selected?: boolean
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  caption: <Type size={14} />,
  image:   <ImageIcon size={14} />,
  video:   <Video size={14} />,
  story:   <ImageIcon size={14} />,
}

const TYPE_COLORS: Record<string, string> = {
  caption: '#2563EB',
  image:   '#7C3AED',
  video:   '#DB2777',
  story:   '#F59E0B',
}

const STATUS_COLORS: Record<string, string> = {
  ready:      '#16A34A',
  draft:      '#94A3B8',
  failed:     '#DC2626',
  scheduled:  '#F59E0B',
  posted:     '#2563EB',
  processing: '#7C3AED',
}

const STATUS_LABELS: Record<string, string> = {
  ready:      'Siap',
  draft:      'Draft',
  failed:     'Gagal',
  scheduled:  'Terjadwal',
  posted:     'Tayang',
  processing: 'Memproses',
}

export function ContentRow({ item, onClick, selected }: Props) {
  return (
    <Link
      href={`/library/${item.id}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 14px',
        background: selected ? '#EFF6FF' : '#fff',
        border: `1px solid ${selected ? '#BFDBFE' : '#E2E8F0'}`,
        borderRadius: '10px',
        textDecoration: 'none',
        color: 'inherit',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all .15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#CBD5E1'
          e.currentTarget.style.background = '#F8FAFC'
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#E2E8F0'
          e.currentTarget.style.background = '#fff'
        }
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#F1F5F9',
        flexShrink: 0,
        position: 'relative',
      }}>
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl || item.media_url || undefined}
            alt={item.title || 'Thumbnail'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${TYPE_COLORS[item.type] ?? '#94A3B8'}15`,
            color: TYPE_COLORS[item.type] ?? '#94A3B8',
          }}>
            {item.type === 'caption' ? <FileText size={22} /> : TYPE_ICONS[item.type]}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#0F172A',
          marginBottom: '3px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {item.title}
        </h3>

        {item.captionPreview && (
          <p style={{
            fontSize: '12px',
            color: '#64748B',
            marginBottom: '6px',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.captionPreview}
          </p>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11px',
          color: '#94A3B8',
          flexWrap: 'wrap',
        }}>
          {/* Type pill */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 7px',
            background: `${TYPE_COLORS[item.type] ?? '#94A3B8'}15`,
            color: TYPE_COLORS[item.type] ?? '#475569',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}>
            {TYPE_ICONS[item.type]}
            {item.type}
          </span>

          {/* Status pill */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: STATUS_COLORS[item.status] ?? '#94A3B8',
            fontWeight: 600,
            fontSize: '10px',
          }}>
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: STATUS_COLORS[item.status] ?? '#94A3B8',
            }} />
            {STATUS_LABELS[item.status] ?? item.status}
          </span>

          {item.primary_platform && (
            <>
              <span>·</span>
              <span style={{ textTransform: 'capitalize' }}>{item.primary_platform}</span>
            </>
          )}

          <span>·</span>
          <span style={{ fontFamily: "'DM Mono', monospace" }}>
            {formatRelativeTime(item.created_at)}
          </span>

          {item.productPrice && (
            <>
              <span>·</span>
              <span style={{ fontWeight: 600, color: '#16A34A' }}>
                {item.productPrice}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <ArrowRight size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
    </Link>
  )
}

function formatRelativeTime(isoDate: string): string {
  const target = new Date(isoDate).getTime()
  const diffMs = Date.now() - target
  const min    = Math.floor(diffMs / (1000 * 60))

  if (min < 1)    return 'baru saja'
  if (min < 60)   return `${min}m lalu`
  const hour = Math.floor(min / 60)
  if (hour < 24)  return `${hour}j lalu`
  const day = Math.floor(hour / 24)
  if (day < 7)    return `${day} hari lalu`
  if (day < 30)   return `${Math.floor(day / 7)} minggu lalu`
  if (day < 365)  return `${Math.floor(day / 30)} bulan lalu`
  return `${Math.floor(day / 365)} tahun lalu`
}