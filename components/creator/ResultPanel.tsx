'use client'
// apps/web-app/components/creator/ResultPanel.tsx
// Result panel — 3 variasi tabs + edit-in-place + auto-save
//
// Features:
// - Tab navigation per variant (responsive horizontal scroll di mobile)
// - Caption editable inline (textarea auto-grow)
// - Hashtag chips edit-in-place (add/remove)
// - CTA editable
// - Copy menu: Caption only / Hashtags only / All combined
// - Auto-save 1.5s debounce dengan status indicator
import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Copy, Check, Loader2, AlertCircle, RefreshCw,
  Save, ChevronDown, FileText, Hash as HashIcon,
} from 'lucide-react'
import type { CaptionVariant } from '@/lib/ai/prompts'
import { HashtagChips }      from './HashtagChips'
import { useAutoSaveContent, type SaveStatus } from '@/hooks/useAutoSaveContent'

interface Props {
  isStreaming: boolean
  rawText:     string
  initialVariants: CaptionVariant[]   // dari hook generate
  error:       string | null
  cached:      boolean
  model:       string | null
  contentId:   string | null
  onRetry:     () => void
}

export function ResultPanel({
  isStreaming,
  rawText,
  initialVariants,
  error,
  cached,
  model,
  contentId,
  onRetry,
}: Props) {
  const [activeIndex, setActiveIndex]   = useState(0)
  const [variants,    setVariants]      = useState<CaptionVariant[]>(initialVariants)
  const [copyMenuOpen, setCopyMenuOpen] = useState<number | null>(null)
  const [copiedText,  setCopiedText]    = useState<string | null>(null)

  // Auto-save hook
  const { status: saveStatus, error: saveError, triggerSave } = useAutoSaveContent({
    contentId,
    debounceMs: 1500,
  })

  // Sync ke local state saat initialVariants berubah (generate baru selesai)
  useEffect(() => {
    if (initialVariants.length > 0) {
      setVariants(initialVariants)
      setActiveIndex(0)
    }
  }, [initialVariants])

  // Trigger auto-save kalau variants berubah (dan ada contentId)
  useEffect(() => {
    if (contentId && variants.length > 0 && !isStreaming) {
      triggerSave({ variants })
    }
  }, [variants, contentId, isStreaming, triggerSave])

  // ── Update single variant ───────────────────────────────
  const updateVariant = (index: number, patch: Partial<CaptionVariant>) => {
    setVariants(prev => prev.map((v, i) =>
      i === index ? { ...v, ...patch } : v,
    ))
  }

  // ── Copy handlers ──────────────────────────────────────
  const handleCopy = (variant: CaptionVariant, mode: 'caption' | 'hashtags' | 'all') => {
    let text = ''
    if (mode === 'caption') {
      text = variant.caption + (variant.cta ? `\n\n${variant.cta}` : '')
    } else if (mode === 'hashtags') {
      text = variant.hashtags.map(t => `#${t}`).join(' ')
    } else {
      text = [
        variant.caption,
        variant.cta && `\n\n${variant.cta}`,
        variant.hashtags.length > 0 && `\n\n${variant.hashtags.map(t => `#${t}`).join(' ')}`,
      ].filter(Boolean).join('')
    }

    navigator.clipboard.writeText(text)
    setCopiedText(mode)
    setCopyMenuOpen(null)
    setTimeout(() => setCopiedText(null), 1500)
  }

  // ════════════════════════════════════════════════════════
  // EMPTY STATE
  // ════════════════════════════════════════════════════════
  if (!isStreaming && !rawText && initialVariants.length === 0 && !error) {
    return <EmptyResultState />
  }

  // ════════════════════════════════════════════════════════
  // ERROR STATE
  // ════════════════════════════════════════════════════════
  if (error) {
    return <ErrorResultState error={error} onRetry={onRetry} />
  }

  // ════════════════════════════════════════════════════════
  // STREAMING STATE
  // ════════════════════════════════════════════════════════
  if (isStreaming && rawText) {
    return <StreamingState rawText={rawText} model={model} />
  }

  // ════════════════════════════════════════════════════════
  // RESULT STATE (variants ready, editable)
  // ════════════════════════════════════════════════════════
  const activeVariant = variants[activeIndex]
  if (!activeVariant) return null

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            color: '#94A3B8', letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {variants.length} variasi siap pakai
          </span>
          {model && (
            <span style={{
              fontSize: '10px', fontWeight: 600,
              padding: '2px 8px', borderRadius: '5px',
              background: cached ? '#F0FDF4' : '#EFF6FF',
              color: cached ? '#15803D' : '#2563EB',
              border: cached ? '1px solid #BBF7D0' : '1px solid #DBEAFE',
            }}>
              {model} {cached && '· cache'}
            </span>
          )}
        </div>

        <SaveIndicator status={saveStatus} error={saveError} />
      </div>

      {/* ── Tabs (1 tab per variant) ──────────────── */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '12px',
        background: '#F1F5F9',
        padding: '4px',
        borderRadius: '10px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {variants.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            style={{
              flex: '1 0 auto',
              minWidth: '80px',
              padding: '8px 14px',
              background: activeIndex === i ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: activeIndex === i ? 600 : 500,
              color: activeIndex === i ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: activeIndex === i ? '0 1px 3px rgba(15,23,42,.08)' : 'none',
              transition: 'all .15s',
              whiteSpace: 'nowrap',
            }}
          >
            Variasi {i + 1}
          </button>
        ))}
      </div>

      {/* ── Active variant editor ─────────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>

        {/* Top action bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            fontSize: '10px', fontWeight: 700,
            color: '#94A3B8', letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Variasi {activeIndex + 1} · {activeVariant.caption.length} char
          </span>

          {/* Copy menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCopyMenuOpen(copyMenuOpen === activeIndex ? null : activeIndex)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px',
                background: copiedText ? '#16A34A' : '#F8FAFC',
                border: copiedText ? 'none' : '1px solid #E2E8F0',
                borderRadius: '7px',
                fontSize: '11px', fontWeight: 600,
                color: copiedText ? '#fff' : '#475569',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all .15s',
              }}
            >
              {copiedText
                ? <><Check size={11} /> Copied</>
                : <><Copy size={11} /> Copy <ChevronDown size={10} /></>
              }
            </button>

            {copyMenuOpen === activeIndex && (
              <>
                <div
                  onClick={() => setCopyMenuOpen(null)}
                  style={{ position: 'fixed', inset: 0, zIndex: 5 }}
                />
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)', right: 0,
                  width: '200px',
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(15,23,42,.12)',
                  padding: '4px',
                  zIndex: 10,
                }}>
                  <CopyMenuItem
                    icon={<FileText size={12} />}
                    label="Caption + CTA"
                    sub="Tanpa hashtag"
                    onClick={() => handleCopy(activeVariant, 'caption')}
                  />
                  <CopyMenuItem
                    icon={<HashIcon size={12} />}
                    label="Hashtags saja"
                    sub={`${activeVariant.hashtags.length} tag`}
                    onClick={() => handleCopy(activeVariant, 'hashtags')}
                  />
                  <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
                  <CopyMenuItem
                    icon={<Copy size={12} />}
                    label="Semua"
                    sub="Caption + CTA + hashtag"
                    onClick={() => handleCopy(activeVariant, 'all')}
                    primary
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Caption editable */}
        <div>
          <label style={fieldLabel}>Caption</label>
          <AutoGrowTextarea
            value={activeVariant.caption}
            onChange={val => updateVariant(activeIndex, { caption: val })}
            placeholder="Caption..."
          />
        </div>

        {/* CTA editable */}
        <div>
          <label style={fieldLabel}>Call-to-Action</label>
          <input
            type="text"
            value={activeVariant.cta}
            onChange={e => updateVariant(activeIndex, { cta: e.target.value })}
            placeholder="Contoh: Order sekarang via WA"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '9px',
              fontSize: '13px',
              color: '#0F172A',
              background: '#EFF6FF',
              borderColor: '#DBEAFE',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
            }}
          />
        </div>

        {/* Hashtag chips */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '6px',
          }}>
            <label style={fieldLabel}>Hashtags</label>
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>
              Klik chip untuk hapus
            </span>
          </div>

          <div style={{
            padding: '10px 12px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '9px',
            minHeight: '46px',
          }}>
            <HashtagChips
              hashtags={activeVariant.hashtags}
              onChange={hashtags => updateVariant(activeIndex, { hashtags })}
            />
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

function SaveIndicator({ status, error }: { status: SaveStatus; error: string | null }) {
  const config: Record<SaveStatus, { icon: React.ReactNode; label: string; color: string }> = {
    idle:   { icon: <Save size={11} />, label: 'Tersimpan', color: '#94A3B8' },
    saving: { icon: <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />, label: 'Menyimpan...', color: '#2563EB' },
    saved:  { icon: <Check size={11} />, label: 'Tersimpan', color: '#16A34A' },
    error:  { icon: <AlertCircle size={11} />, label: error ?? 'Gagal save', color: '#DC2626' },
  }

  const { icon, label, color } = config[status]

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px',
      fontSize: '11px',
      fontWeight: 500,
      color,
      transition: 'all .2s',
    }}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

function CopyMenuItem({ icon, label, sub, onClick, primary }: {
  icon:  React.ReactNode
  label: string
  sub:   string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px',
        background: 'transparent', border: 'none',
        borderRadius: '7px',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'background .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = primary ? '#EFF6FF' : '#F8FAFC'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ color: primary ? '#2563EB' : '#64748B', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: primary ? '#2563EB' : '#0F172A' }}>
          {label}
        </span>
        <span style={{ display: 'block', fontSize: '10px', color: '#94A3B8', marginTop: '1px' }}>
          {sub}
        </span>
      </span>
    </button>
  )
}

// Auto-grow textarea
function AutoGrowTextarea({ value, onChange, placeholder }: {
  value: string
  onChange: (val: string) => void
  placeholder: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-resize on value change
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight + 2}px`
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #E2E8F0',
        borderRadius: '9px',
        fontSize: '13px',
        color: '#0F172A',
        background: '#fff',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: 1.6,
        fontFamily: "'DM Sans', sans-serif",
        minHeight: '90px',
        transition: 'border-color .15s, box-shadow .15s',
      }}
    />
  )
}

// ── Empty state ─────────────────────────────────────────────
function EmptyResultState() {
  return (
    <div style={{
      padding: '60px 24px',
      background: '#F8FAFC',
      border: '2px dashed #CBD5E1',
      borderRadius: '14px',
      textAlign: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '52px', height: '52px',
        background: '#fff',
        borderRadius: '14px',
        display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '12px',
        boxShadow: '0 1px 3px rgba(15,23,42,.06)',
      }}>
        <Sparkles size={22} color="#2563EB" />
      </div>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
        Hasil akan muncul di sini
      </p>
      <p style={{ fontSize: '12px', color: '#94A3B8' }}>
        Isi info produk + pilih config, lalu klik Generate
      </p>
    </div>
  )
}

// ── Error state ─────────────────────────────────────────────
function ErrorResultState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{
      padding: '20px',
      background: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: '14px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>
            Gagal generate
          </p>
          <p style={{ fontSize: '12px', color: '#B91C1C', lineHeight: 1.5 }}>
            {error}
          </p>
        </div>
      </div>

      <button
        onClick={onRetry}
        style={{
          padding: '8px 14px',
          background: '#fff',
          border: '1px solid #FCA5A5',
          borderRadius: '9px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#991B1B',
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <RefreshCw size={12} /> Coba lagi
      </button>
    </div>
  )
}

// ── Streaming state ─────────────────────────────────────────
function StreamingState({ rawText, model }: { rawText: string; model: string | null }) {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '12px',
        padding: '8px 14px',
        background: '#EFF6FF',
        border: '1px solid #DBEAFE',
        borderRadius: '9px',
      }}>
        <Loader2 size={14} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '12px', color: '#1E3A8A', fontWeight: 500 }}>
          AI lagi nulis caption... {model && `(${model})`}
        </span>
      </div>

      <div style={{
        padding: '16px',
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        fontSize: '12px',
        color: '#475569',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        maxHeight: '500px',
        overflowY: 'auto',
        fontFamily: "'DM Mono', monospace",
      }}>
        {rawText}
        <span style={{
          display: 'inline-block',
          width: '6px', height: '14px',
          background: '#2563EB',
          marginLeft: '2px',
          verticalAlign: 'middle',
          animation: 'blink 1s infinite',
        }} />
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes blink { 50% { opacity: 0 } }
      `}</style>
    </div>
  )
}

// ── Shared styles ────────────────────────────────────────────
const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748B',
  marginBottom: '6px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
}