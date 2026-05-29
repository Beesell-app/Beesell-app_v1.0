'use client'
// apps/web-app/components/creator/OutputPanel.tsx
// Output panel — tampilkan hasil generate dengan streaming preview
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Copy, Check, Loader2, Hash, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'

interface Variant {
  caption:  string
  hashtags: string[]
  cta:      string
}

interface Props {
  isStreaming: boolean
  rawText:     string                  // streaming raw text
  variants:    Variant[]               // parsed variants (saat selesai)
  error:       string | null
  cached:      boolean
  model:       string | null
  contentId:   string | null
  onRetry:     () => void
}

export function OutputPanel({
  isStreaming,
  rawText,
  variants,
  error,
  cached,
  model,
  contentId,
  onRetry,
}: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyAll = (v: Variant, index: number) => {
    const fullText = [
      v.caption,
      v.cta && `\n\n${v.cta}`,
      v.hashtags.length > 0 && `\n\n${v.hashtags.map(t => `#${t}`).join(' ')}`,
    ].filter(Boolean).join('')

    navigator.clipboard.writeText(fullText)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  // ── State 1: Empty (belum ada generate) ────────────────
  if (!isStreaming && !rawText && variants.length === 0 && !error) {
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
          Isi info produk + pilih config, lalu klik "Generate"
        </p>
      </div>
    )
  }

  // ── State 2: Error ─────────────────────────────────────
  if (error) {
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <RefreshCw size={12} /> Coba lagi
        </button>
      </div>
    )
  }

  // ── State 3: Streaming (text raw, belum parsed) ────────
  if (isStreaming && rawText) {
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
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes blink { 50% { opacity: 0 } }
        `}</style>
      </div>
    )
  }

  // ── State 4: Done (variants parsed) ────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#94A3B8',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {variants.length} variasi siap pakai
          </span>
          {model && (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '5px',
              background: cached ? '#F0FDF4' : '#EFF6FF',
              color: cached ? '#15803D' : '#2563EB',
              border: cached ? '1px solid #BBF7D0' : '1px solid #DBEAFE',
            }}>
              {model} {cached && '· cache'}
            </span>
          )}
        </div>

        {contentId && (
          <Link
            href={`/content/${contentId}`}
            style={{
              fontSize: '12px',
              color: '#2563EB',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Buka detail <ArrowRight size={11} />
          </Link>
        )}
      </div>

      {/* Variants */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {variants.map((v, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
              transition: 'all .15s',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#94A3B8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                Variasi {i + 1}
              </span>
              <button
                onClick={() => copyAll(v, i)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  background: copiedIndex === i ? '#16A34A' : '#F8FAFC',
                  border: copiedIndex === i ? 'none' : '1px solid #E2E8F0',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: copiedIndex === i ? '#fff' : '#475569',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all .15s',
                }}
              >
                {copiedIndex === i
                  ? <><Check size={11} /> Copied</>
                  : <><Copy size={11} /> Copy</>
                }
              </button>
            </div>

            {/* Caption body */}
            {v.caption && (
              <p style={{
                fontSize: '13px',
                color: '#0F172A',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                marginBottom: v.cta || v.hashtags.length > 0 ? '12px' : 0,
              }}>
                {v.caption}
              </p>
            )}

            {/* CTA */}
            {v.cta && (
              <div style={{
                padding: '8px 12px',
                background: '#EFF6FF',
                border: '1px solid #DBEAFE',
                borderRadius: '8px',
                marginBottom: v.hashtags.length > 0 ? '10px' : 0,
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#1E3A8A',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}>
                  👉 {v.cta}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {v.hashtags.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                paddingTop: '10px',
                borderTop: '1px solid #F1F5F9',
                alignItems: 'center',
              }}>
                <Hash size={11} color="#94A3B8" />
                {v.hashtags.map((tag, ti) => (
                  <span
                    key={ti}
                    style={{
                      padding: '2px 8px',
                      background: '#F1F5F9',
                      color: '#475569',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 500,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}