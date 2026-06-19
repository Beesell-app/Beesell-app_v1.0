'use client'
// apps/web-app/components/scheduler/QuickAddPopover.tsx
// Popover on slot click: search/pick content → schedule
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { X, Search, FileText, Image, Loader2 } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
// The upstream types module doesn't export ScheduleSlot in some setups.
// Use a local fallback type to avoid build errors.
type ScheduleSlot = any
const PLATFORM_META: Record<string, any> = {}
import { slotToDate } from '@/lib/scheduler/utils'

interface Props {
  slot:       ScheduleSlot
  anchor:     { x: number; y: number }
  onClose:    () => void
  onSchedule: (contentId: string, scheduledFor: Date) => void
}

interface ContentItem {
  id:             string
  type:           string
  title:          string | null
  caption_text:    string | null
  media_url:       string | null
  primary_platform: string | null
  status:         string
}

async function fetchReadyContents(q: string, cursor?: string) {
  const sp = new URLSearchParams({ status: 'ready', limit: '10' })
  if (q)      sp.set('q', q)
  if (cursor) sp.set('cursor', cursor)
  const res = await fetch(`/api/library?${sp}`)
  if (!res.ok) throw new Error('Failed')
  return (await res.json()).data
}

export function QuickAddPopover({ slot, anchor, onClose, onSchedule }: Props) {
  const [q, setQ]               = useState('')
  const [debouncedQ, setDQ]     = useState('')
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  const scheduledFor = slotToDate(slot)
  const timeLabel    = format(scheduledFor, "EEEE, d MMM · HH:mm", { locale: idLocale })

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const { data, isLoading } = useInfiniteQuery({
    queryKey:      ['quick-add-contents', debouncedQ],
    queryFn:       ({ pageParam }) => fetchReadyContents(debouncedQ, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor,
    staleTime:     30_000,
  })

  const items: ContentItem[] = data?.pages.flatMap((p: any) => p.items) ?? []

  // Position: ensure popover stays within viewport
  const popW  = 300
  const popH  = 380
  const left  = Math.min(anchor.x, window.innerWidth  - popW - 20)
  const top   = Math.min(anchor.y, window.innerHeight - popH - 20)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 55 }}
      />

      {/* Popover */}
      <div
        style={{
          position:     'fixed',
          left:         `${Math.max(10, left)}px`,
          top:          `${Math.max(10, top)}px`,
          width:        `${popW}px`,
          background:   '#fff',
          border:       '1px solid #E2E8F0',
          borderRadius: '14px',
          boxShadow:    '0 8px 30px rgba(15,23,42,.15)',
          zIndex:       56,
          overflow:     'hidden',
          fontFamily:   "'DM Sans', sans-serif",
          animation:    'popIn .12s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '12px 14px',
          background:   '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '1px' }}>
              Jadwalkan konten
            </p>
            <p style={{ fontSize: '10px', color: '#64748B' }}>{timeLabel}</p>
          </div>
          <button onClick={onClose} style={{
            width: '24px', height: '24px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: '5px',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '8px',
            padding:     '7px 10px',
            background:  '#F8FAFC',
            border:      '1px solid #E2E8F0',
            borderRadius: '8px',
          }}>
            <Search size={13} color="#94A3B8" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Cari konten..."
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: '12px',
                background: 'transparent', fontFamily: "'DM Sans', sans-serif",
                color: '#0F172A',
              }}
            />
            {isLoading && <Loader2 size={12} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />}
          </div>
        </div>

        {/* Content list */}
        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {items.length === 0 && !isLoading && (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94A3B8' }}>
              {q ? 'Tidak ditemukan' : 'Belum ada konten siap'}
            </div>
          )}

          {items.map((item: ContentItem) => {
            const pm = PLATFORM_META[item.primary_platform as keyof typeof PLATFORM_META]
            const isSelected = selected?.id === item.id

            return (
              <button
                key={item.id}
                onClick={() => setSelected(isSelected ? null : item)}
                style={{
                  width:       '100%',
                  display:     'flex',
                  alignItems:  'center',
                  gap:         '10px',
                  padding:     '9px 14px',
                  background:  isSelected ? '#EFF6FF' : 'transparent',
                  border:      'none',
                  borderBottom: '1px solid #F8FAFC',
                  cursor:      'pointer',
                  textAlign:   'left',
                  transition:  'background .08s',
                  fontFamily:  "'DM Sans', sans-serif",
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width:          '34px',
                  height:         '34px',
                  borderRadius:   '7px',
                  background:     item.media_url ? undefined : (pm?.bg ?? '#F1F5F9'),
                  overflow:       'hidden',
                  flexShrink:     0,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                }}>
                  {item.media_url
                    ? <img src={item.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (item.type === 'image'
                        ? <Image size={14} color={pm?.color ?? '#64748B'} />
                        : <FileText size={14} color={pm?.color ?? '#64748B'} />
                      )
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '12px', fontWeight: 600, color: '#0F172A',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '2px',
                  }}>
                    {item.title || item.caption_text?.slice(0, 40) || 'Untitled'}
                  </p>
                  <p style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {pm?.icon} {pm?.label ?? item.primary_platform}
                  </p>
                </div>

                {/* Checkmark */}
                {isSelected && (
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', background: '#2563EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>✓</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer action */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #F1F5F9' }}>
          <button
            onClick={() => {
              if (selected) {
                onSchedule(selected.id, scheduledFor)
                onClose()
              }
            }}
            disabled={!selected}
            style={{
              width:        '100%',
              padding:      '9px',
              background:   selected
                ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                : '#F1F5F9',
              color:        selected ? '#fff' : '#94A3B8',
              border:       'none',
              borderRadius: '9px',
              fontSize:     '13px',
              fontWeight:   600,
              cursor:       selected ? 'pointer' : 'not-allowed',
              fontFamily:   "'DM Sans', sans-serif",
              transition:   'all .15s',
            }}
          >
            {selected ? `Jadwalkan "${selected.title?.slice(0, 30) || 'konten ini'}"` : 'Pilih konten dulu'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn { from { opacity: 0; transform: scale(.95) } to { opacity: 1; transform: scale(1) } }
        @keyframes spin   { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}