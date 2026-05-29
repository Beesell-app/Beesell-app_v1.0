'use client'
// apps/web-app/components/library/ContentCard.tsx
// Grid view card untuk content
import Link from 'next/link'
import { Image as ImageIcon, Type, Video, Calendar, FileText, Heart } from 'lucide-react'
import type { ContentListItem } from '@/lib/library-types'

interface Props {
  item:    ContentListItem
  onClick?: () => void
  selected?: boolean
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  caption: <Type size={11} />,
  image:   <ImageIcon size={11} />,
  video:   <Video size={11} />,
  story:   <ImageIcon size={11} />,
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

export function ContentCard({ item, onClick, selected }: Props) {
  return (
    <Link
      href={`/library/${item.id}`}
      onClick={onClick}
      style={{
        display: 'block',
        background: '#fff',
        border: `1px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all .15s',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px rgba(37,99,235,.1)' : 'none',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#CBD5E1'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,.06)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#E2E8F0'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {/* Thumbnail */}
      <div style={{
        aspectRatio: '1',
        background: '#F1F5F9',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {(item.thumbnailUrl ?? item.media_url) ? (
        <img
          src={item.thumbnailUrl ?? item.media_url ?? undefined}
          alt={item.title ?? 'Thumbnail'}
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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: item.type === 'caption'
              ? 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)'
              : '#F1F5F9',
            color: '#475569',
          }}>
            {item.type === 'caption' ? (
              <>
                <FileText size={24} style={{ marginBottom: '8px', opacity: 0.6 }} />
                <p style={{
                  fontSize: '11px',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  fontWeight: 500,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {item.captionPreview || '(tanpa caption)'}
                </p>
              </>
            ) : (
              <ImageIcon size={32} style={{ opacity: 0.4 }} />
            )}
          </div>
        )}

        {/* Status badge top-left */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          background: 'rgba(255,255,255,.95)',
          border: `1px solid ${STATUS_COLORS[item.status] ?? '#E2E8F0'}33`,
          borderRadius: '99px',
          fontSize: '10px',
          fontWeight: 600,
          color: STATUS_COLORS[item.status] ?? '#475569',
          backdropFilter: 'blur(4px)',
        }}>
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: STATUS_COLORS[item.status] ?? '#94A3B8',
          }} />
          {STATUS_LABELS[item.status] ?? item.status}
        </div>

        {/* Type badge top-right */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '3px 6px',
          background: 'rgba(15,23,42,.7)',
          borderRadius: '5px',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          textTransform: 'capitalize',
          backdropFilter: 'blur(4px)',
        }}>
          {TYPE_ICONS[item.type]}
          {item.type}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#0F172A',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          {item.title}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '10px',
          color: '#94A3B8',
          flexWrap: 'wrap',
        }}>
          {item.primary_platform && (
            <span style={{ textTransform: 'capitalize' }}>
              {item.primary_platform}
            </span>
          )}
          {item.primary_platform && (
            <span>·</span>
          )}
          <span style={{ fontFamily: "'DM Mono', monospace" }}>
            {formatRelativeTime(item.created_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Helper ────────────────────────────────────────────────
function formatRelativeTime(isoDate: string): string {
  const target = new Date(isoDate).getTime()
  const diffMs = Date.now() - target
  const min    = Math.floor(diffMs / (1000 * 60))

  if (min < 1)    return 'baru saja'
  if (min < 60)   return `${min}m`
  const hour = Math.floor(min / 60)
  if (hour < 24)  return `${hour}j`
  const day = Math.floor(hour / 24)
  if (day < 7)    return `${day}h`
  if (day < 30)   return `${Math.floor(day / 7)}mg`
  if (day < 365)  return `${Math.floor(day / 30)}bln`
  return `${Math.floor(day / 365)}th`
}