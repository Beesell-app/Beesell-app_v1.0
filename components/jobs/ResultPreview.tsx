'use client'
// apps/web-app/components/jobs/ResultPreview.tsx
// ── Job completed: image/caption preview + download ───────────
import { useState }    from 'react'
import Link            from 'next/link'
import {
  Download, Copy, Check, ExternalLink, ZoomIn, X,
  Hash, ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { JobResult } from '@/lib/hooks/useJobStatus'
import { DownloadButton } from '@/components/jobs/DownloadButton'

interface Props {
  result:       JobResult
  jobType?:     string
  model?:       string | null
  cost_usd?:     number | null
  elapsedMs?:   number
  onRetry?:     () => void
  inline?:      boolean
}

export function ResultPreview({
  result, jobType, model, cost_usd, elapsedMs, onRetry, inline = false,
}: Props) {
  const isImage   = !!result.media_url
  const hasCaption = !!(result.variants?.length)

  if (inline) {
    return <InlineResult result={result} isImage={isImage} hasCaption={hasCaption} />
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isImage && (
        <ImageResult
          media_url={result.media_url!}
          thumbUrl={result.imageThumbUrl}
          contentId={result.contentId}
          model={model}
          cost_usd={cost_usd}
          elapsedMs={elapsedMs}
        />
      )}
      {hasCaption && (
        <CaptionResult
          variants={result.variants!}
          contentId={result.contentId}
          model={model}
          cost_usd={cost_usd}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// IMAGE RESULT
// ══════════════════════════════════════════════════════════════
function ImageResult({ media_url, thumbUrl, contentId, model, cost_usd, elapsedMs }: {
  media_url:   string
  thumbUrl?:  string | null
  contentId?: string | null
  model?:     string | null
  cost_usd?:   number | null
  elapsedMs?: number
}) {
  const [lightbox, setLightbox] = useState(false)
  

  const elapsedSec = elapsedMs ? (elapsedMs / 1000).toFixed(1) : null
  const costRp     = cost_usd ? Math.round(cost_usd * 16000) : null

  return (
    <div style={{
      background:   '#fff',
      borderRadius: '16px',
      border:       '1px solid #E2E8F0',
      overflow:     'hidden',
    }}>
      {/* Success banner */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '8px',
        padding:     '10px 16px',
        background:  '#F0FDF4',
        borderBottom: '1px solid #BBF7D0',
      }}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#16A34A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={11} color="#fff" />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803D' }}>
          Gambar selesai! {elapsedSec && `— ${elapsedSec}s`}
        </span>
        <div style={{ flex: 1 }} />
        {model && (
          <span style={{
            fontSize: '10px', padding: '2px 8px',
            background: '#DCFCE7', color: '#166534',
            borderRadius: '5px', fontWeight: 600,
          }}>
            {model}
          </span>
        )}
      </div>

      {/* Image */}
      <div style={{ position: 'relative', cursor: 'zoom-in' }} onClick={() => setLightbox(true)}>
        <img
          src={thumbUrl ?? media_url}
          alt="Generated"
          style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'contain', background: '#F8FAFC' }}
        />
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'rgba(15,23,42,.5)', borderRadius: '8px',
          padding: '5px 8px',
          display: 'flex', alignItems: 'center', gap: '4px',
          color: '#fff', fontSize: '11px',
        }}>
          <ZoomIn size={12} /> Klik untuk zoom
        </div>
      </div>

      {/* Actions footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid #F1F5F9',
        display: 'flex', gap: '8px', alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <DownloadButton
          media_url={media_url}
          contentId={contentId ?? undefined}
          source="image_generator"
          title="Generated Image"
        />

        {contentId && (
          <Link
            href={`/content/${contentId}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '9px 14px', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: '9px',
              fontSize: '12px', fontWeight: 500, color: '#475569',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} /> Buka di Library
          </Link>
        )}

        {costRp && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94A3B8' }}>
            Biaya: Rp {costRp.toLocaleString('id')}
          </span>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: 'fixed', top: '16px', right: '16px',
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,.15)', border: 'none',
              cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
          <img
            src={media_url}
            alt="Full size"
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// CAPTION RESULT
// ══════════════════════════════════════════════════════════════
function CaptionResult({ variants, contentId, model, cost_usd }: {
  variants:   Array<{ caption: string; hashtags: string[]; cta: string }>
  contentId?: string | null
  model?:     string | null
  cost_usd?:   number | null
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [copied,    setCopied]    = useState(false)

  const v = variants[activeIdx]
  if (!v) return null

  const fullText = [
    v.caption,
    v.cta && `\n\n${v.cta}`,
    v.hashtags?.length > 0 && `\n\n${v.hashtags.map(t => `#${t}`).join(' ')}`,
  ].filter(Boolean).join('')

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const costRp = cost_usd ? Math.round(cost_usd * 16000) : null

  return (
    <div style={{
      background:   '#fff',
      borderRadius: '16px',
      border:       '1px solid #E2E8F0',
      overflow:     'hidden',
    }}>
      {/* Success banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', background: '#F0FDF4', borderBottom: '1px solid #BBF7D0',
      }}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: '#16A34A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={11} color="#fff" />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803D' }}>
          {variants.length} variasi caption siap!
        </span>
        <div style={{ flex: 1 }} />
        {model && (
          <span style={{
            fontSize: '10px', padding: '2px 8px',
            background: '#DCFCE7', color: '#166534',
            borderRadius: '5px', fontWeight: 600,
          }}>
            {model}
          </span>
        )}
      </div>

      {/* Variant tabs */}
      <div style={{
        display: 'flex', gap: '2px', padding: '6px 10px',
        background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
      }}>
        {variants.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            style={{
              padding:      '5px 12px',
              background:   activeIdx === i ? '#fff' : 'transparent',
              border:       `1px solid ${activeIdx === i ? '#BFDBFE' : 'transparent'}`,
              borderRadius: '7px',
              fontSize:     '12px',
              fontWeight:   activeIdx === i ? 600 : 500,
              color:        activeIdx === i ? '#2563EB' : '#64748B',
              cursor:       'pointer',
              fontFamily:   "'DM Sans', sans-serif",
            }}
          >
            Variasi {i + 1}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 12px',
            background: copied ? '#16A34A' : '#fff',
            border: `1px solid ${copied ? '#BBF7D0' : '#E2E8F0'}`,
            borderRadius: '7px',
            fontSize: '11px', fontWeight: 600,
            color: copied ? '#fff' : '#475569',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all .15s',
          }}
        >
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy All</>}
        </button>
      </div>

      {/* Active variant */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '14px', color: '#0F172A', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {v.caption}
        </p>

        {v.cta && (
          <div style={{
            padding: '10px 12px',
            background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '8px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E3A8A' }}>
              👉 {v.cta}
            </p>
          </div>
        )}

        {v.hashtags?.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px',
            paddingTop: '10px', borderTop: '1px solid #F1F5F9',
            alignItems: 'center',
          }}>
            <Hash size={12} color="#94A3B8" />
            {v.hashtags.slice(0, 10).map((tag, i) => (
              <span key={i} style={{
                padding: '2px 8px',
                background: '#F1F5F9', color: '#475569',
                borderRadius: '5px', fontSize: '11px',
                fontFamily: "'DM Mono', monospace",
              }}>
                #{tag}
              </span>
            ))}
            {v.hashtags.length > 10 && (
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                +{v.hashtags.length - 10} lainnya
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #F1F5F9',
        display: 'flex', gap: '8px', alignItems: 'center',
      }}>
        {contentId && (
          <Link
            href={`/content/${contentId}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '8px 14px', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: '9px',
              fontSize: '12px', fontWeight: 500, color: '#475569',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} /> Edit di Library
          </Link>
        )}
        {costRp && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94A3B8' }}>
            Biaya: Rp {costRp.toLocaleString('id')}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Inline compact result (for embedding) ─────────────────────
function InlineResult({ result, isImage, hasCaption }: {
  result: JobResult; isImage: boolean; hasCaption: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = result.variants?.[0]?.caption ?? ''
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px',
      background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px',
    }}>
      {isImage && result.media_url && (
        <img
          src={result.imageThumbUrl ?? result.media_url}
          alt=""
          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
        />
      )}

      {hasCaption && (
        <p style={{
          flex: 1, fontSize: '12px', color: '#15803D',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          ✓ {result.variants?.[0]?.caption?.slice(0, 60)}...
        </p>
      )}

      <div style={{ display: 'flex', gap: '6px' }}>
        {hasCaption && (
          <button
            onClick={handleCopy}
            style={{
              padding: '5px 10px', background: copied ? '#16A34A' : '#fff',
              border: `1px solid ${copied ? '#BBF7D0' : '#E2E8F0'}`,
              borderRadius: '6px', cursor: 'pointer',
              fontSize: '11px', fontWeight: 600,
              color: copied ? '#fff' : '#64748B',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {copied ? '✓' : <Copy size={11} />}
          </button>
        )}

        {result.contentId && (
          <Link
            href={`/content/${result.contentId}`}
            style={{
              padding: '5px 10px', background: '#fff',
              border: '1px solid #E2E8F0', borderRadius: '6px',
              fontSize: '11px', fontWeight: 500, color: '#64748B',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            <ExternalLink size={11} /> Buka
          </Link>
        )}
      </div>
    </div>
  )
}