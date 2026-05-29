'use client'
// apps/web-app/components/search/GlobalSearch.tsx
// ── Global search overlay (Ctrl+K or ⌘K) ─────────────────────
// Opens a command-palette style modal with:
// - Search input (debounced 300ms)
// - Real-time results with highlights
// - Keyboard navigation (↑↓ Enter)
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter }          from 'next/navigation'
import { Search, X, Loader2, ArrowRight, FileText, Image, Video, Clock } from 'lucide-react'
import { useSearch, useIsSearching } from '@/lib/hooks/useSearch'
import { SearchHighlight, MatchBadge } from './SearchHighlight'

// ── Trigger: button to open (put in TopBar) ───────────────────
export function SearchTrigger() {
  const [open, setOpen] = useState(false)

  // Keyboard shortcut: Ctrl+K / ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          padding:        '7px 12px',
          background:     '#F8FAFC',
          border:         '1px solid #E2E8F0',
          borderRadius:   '9px',
          cursor:         'pointer',
          color:          '#94A3B8',
          fontSize:       '12px',
          fontFamily:     "'DM Sans', sans-serif",
          transition:     'all .12s',
          minWidth:       '160px',
        }}
      >
        <Search size={13} />
        <span style={{ flex: 1, textAlign: 'left' }}>Cari konten...</span>
        <kbd style={{
          padding:        '1px 5px',
          background:     '#fff',
          border:         '1px solid #E2E8F0',
          borderRadius:   '4px',
          fontSize:       '10px',
          color:          '#64748B',
          fontFamily:     "'DM Mono', monospace",
        }}>
          ⌘K
        </kbd>
      </button>

      {open && <GlobalSearchModal onClose={() => setOpen(false)} />}
    </>
  )
}

// ── Modal ─────────────────────────────────────────────────────
function GlobalSearchModal({ onClose }: { onClose: () => void }) {
  const router       = useRouter()
  const inputRef     = useRef<HTMLInputElement>(null)
  const listRef      = useRef<HTMLDivElement>(null)
  const [q, setQ]    = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)

  const isDebouncing = useIsSearching(q)
  const { data, isFetching } = useSearch({ q, enabled: q.length >= 1 })
  const items   = data?.items ?? []
  const total   = data?.total ?? 0

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const item = items[activeIdx]
      if (item) {
        router.push(`/content/${item.id}`)
        onClose()
      }
    }
  }, [items, activeIdx, router, onClose])

  const typeIcon: Record<string, React.ReactNode> = {
    caption: <FileText size={14} color="#2563EB" />,
    image:   <Image    size={14} color="#7C3AED" />,
    video:   <Video    size={14} color="#DC2626" />,
  }

  const isLoading = isFetching || isDebouncing

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:       'fixed',
          inset:          0,
          background:     'rgba(15,23,42,.5)',
          zIndex:         60,
          backdropFilter: 'blur(3px)',
          animation:      'fadeIn .12s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position:   'fixed',
          top:        '15vh',
          left:       '50%',
          transform:  'translateX(-50%)',
          zIndex:     61,
          width:      '100%',
          maxWidth:   '580px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow:  '0 20px 60px rgba(15,23,42,.2)',
          overflow:   'hidden',
          animation:  'slideDown .15s ease',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '12px',
          padding:     '14px 16px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          {isLoading
            ? <Loader2 size={18} color="#2563EB" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            : <Search size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
          }

          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setActiveIdx(-1) }}
            placeholder="Cari caption, produk, hashtag..."
            style={{
              flex:       1,
              fontSize:   '15px',
              color:      '#0F172A',
              border:     'none',
              outline:    'none',
              fontFamily: "'DM Sans', sans-serif",
              background: 'transparent',
            }}
          />

          {q && (
            <button
              onClick={() => { setQ(''); setActiveIdx(-1); inputRef.current?.focus() }}
              style={{
                width:          '24px',
                height:         '24px',
                background:     '#F1F5F9',
                border:         'none',
                borderRadius:   '50%',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
                color:          '#64748B',
              }}
            >
              <X size={12} />
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding:      '4px 8px',
              background:   '#F8FAFC',
              border:       '1px solid #E2E8F0',
              borderRadius: '5px',
              cursor:       'pointer',
              fontSize:     '11px',
              color:        '#64748B',
              fontFamily:   "'DM Mono', monospace",
            }}
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight:  '420px',
            overflowY:  'auto',
          }}
        >
          {/* Empty state */}
          {!q.trim() && (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <Search size={24} color="#E2E8F0" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '13px', color: '#94A3B8' }}>
                Ketik untuk cari caption, produk, atau hashtag
              </p>
              <p style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '4px' }}>
                Didukung full-text search Indonesia + typo tolerance
              </p>
            </div>
          )}

          {/* No results */}
          {q.trim() && !isLoading && items.length === 0 && (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Tidak ditemukan untuk "{q}"
              </p>
              <p style={{ fontSize: '11px', color: '#94A3B8' }}>
                Coba kata kunci lain atau singkat pencarian
              </p>
            </div>
          )}

          {/* Results list */}
          {items.length > 0 && (
            <div>
              {/* Result count + match type */}
              <div style={{
                padding:      '8px 16px 4px',
                fontSize:     '10px',
                color:        '#94A3B8',
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
              }}>
                <span>{total} hasil</span>
                {data?.searchMeta?.matchType && (
                  <MatchBadge
                    matchType={
                      data.searchMeta.matchType === 'none'
                        ? null
                        : data.searchMeta.matchType
                    }
                  />
                )}
                <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace" }}>
                  ↑↓ navigasi · Enter buka
                </span>
              </div>

              {items.map((item, idx) => {
                const isActive = idx === activeIdx
                return (
                  <button
                    key={item.id}
                    onClick={() => { router.push(`/content/${item.id}`); onClose() }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    style={{
                      width:        '100%',
                      display:      'flex',
                      alignItems:   'flex-start',
                      gap:          '12px',
                      padding:      '10px 16px',
                      background:   isActive ? '#F0F9FF' : 'transparent',
                      border:       'none',
                      cursor:       'pointer',
                      textAlign:    'left',
                      borderLeft:   isActive ? '3px solid #2563EB' : '3px solid transparent',
                      transition:   'all .08s',
                    }}
                  >
                    {/* Type icon */}
                    <div style={{
                      width:          '32px',
                      height:         '32px',
                      borderRadius:   '8px',
                      background:     item.type === 'image' ? '#F5F3FF' : '#EFF6FF',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      flexShrink:     0,
                    }}>
                      {item.media_url ? (
                        <img
                          src={item.imageThumbUrl ?? item.media_url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      ) : (typeIcon[item.type] ?? <FileText size={14} color="#64748B" />)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display:    'flex',
                        alignItems: 'center',
                        gap:        '6px',
                        marginBottom: '3px',
                      }}>
                        <span style={{
                          fontSize:     '13px',
                          fontWeight:   600,
                          color:        '#0F172A',
                          overflow:     'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace:   'nowrap',
                          maxWidth:     '300px',
                        }}>
                          {item.title || item.caption_text?.slice(0, 50) || 'Untitled'}
                        </span>

                        {item.matchType && (
                          <MatchBadge matchType={item.matchType} rank={item.rank ?? undefined} />
                        )}
                      </div>

                      {/* Highlighted snippet */}
                      <div style={{ maxWidth: '440px' }}>
                        <SearchHighlight
                          html={item.highlightCaption}
                          fallback={item.caption_text}
                          maxLength={120}
                        />
                      </div>

                      {/* Meta */}
                      <div style={{
                        display:    'flex',
                        gap:        '8px',
                        marginTop:  '4px',
                        alignItems: 'center',
                        fontSize:   '10px',
                        color:      '#94A3B8',
                      }}>
                        <Clock size={10} />
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {item.primary_platform && (
                          <span style={{ textTransform: 'capitalize' }}>
                            · {item.primary_platform.replace('_', ' ')}
                          </span>
                        )}
                        {(item.hashtags ?? []).slice(0, 2).map(h => (
                          <span key={h} style={{ color: '#CBD5E1' }}>#{h}</span>
                        ))}
                      </div>
                    </div>

                    <ArrowRight size={14} color={isActive ? '#2563EB' : '#E2E8F0'} style={{ flexShrink: 0, marginTop: '8px' }} />
                  </button>
                )
              })}

              {/* View all in library */}
              {total > 5 && (
                <button
                  onClick={() => {
                    router.push(`/library?q=${encodeURIComponent(q)}`)
                    onClose()
                  }}
                  style={{
                    width:          '100%',
                    padding:        '12px 16px',
                    background:     '#F8FAFC',
                    border:         'none',
                    borderTop:      '1px solid #F1F5F9',
                    cursor:         'pointer',
                    fontSize:       '12px',
                    fontWeight:     600,
                    color:          '#2563EB',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '6px',
                    fontFamily:     "'DM Sans', sans-serif",
                    transition:     'background .12s',
                  }}
                >
                  Lihat semua {total} hasil di Library <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -12px) } to { opacity: 1; transform: translate(-50%, 0) } }
        @keyframes spin      { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}