'use client'
// apps/web-app/components/jobs/JobStatusCard.tsx
// Main status card untuk async image generation
// 5 states: dispatching → processing → completed → failed → timeout
//
// Display:
//   - Header: status icon + label + ETA
//   - Content area: skeleton / image preview
//   - Progress bar (saat processing)
//   - Action buttons (saat completed/failed)
import { useState } from 'react'
import {
  Loader2, Sparkles, Check, AlertCircle, Clock, Eye,
  Download, RefreshCw, Maximize2, Wand2,
} from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { JobSkeleton } from './JobSkeleton'
import { ImagePreviewModal } from './ImagePreviewModal'
import { formatEta, formatDuration } from '@/lib/format-time'

interface Props {
  status:        'idle' | 'dispatching' | 'processing' | 'completed' | 'failed' | 'timeout'
  progress:      number
  estimatedTime: number
  elapsedMs:     number
  media_url:      string | null
  error:         string | null
  jobId:         string | null
  onRetry?:      () => void
  onCancel?:     () => void
}

export function JobStatusCard({
  status,
  progress,
  estimatedTime,
  elapsedMs,
  media_url,
  error,
  jobId,
  onRetry,
  onCancel,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)

  // ── State 1: Idle (no job) ────────────────────────────
  if (status === 'idle') return null

  // ── State 2: Dispatching (skeleton) ──────────────────
  if (status === 'dispatching') {
    return (
      <div style={cardStyle()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}>
          <StatusBadge status={status} />
          <span style={metaStyle()}>Mempersiapkan...</span>
        </div>

        <JobSkeleton />
      </div>
    )
  }

  // ── State 3: Processing ──────────────────────────────
  if (status === 'processing') {
    const eta = formatEta(estimatedTime, elapsedMs)
    const elapsed = formatDuration(elapsedMs)

    return (
      <div style={cardStyle()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}>
          <StatusBadge status={status} />
          <span style={metaStyle()}>
            <Clock size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
            {eta}
          </span>
        </div>

        {/* Animated processing illustration */}
        <div style={{
          aspectRatio: '1',
          background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
          borderRadius: '12px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          border: '1px solid #DBEAFE',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Pulsating circles */}
          <div style={{
            position: 'absolute',
            inset: '50% 50% 50% 50%',
            transform: 'translate(-50%, -50%)',
            width: '120px', height: '120px',
            background: 'radial-gradient(circle, rgba(37,99,235,.15), transparent 70%)',
            borderRadius: '50%',
            animation: 'pulse-soft 2s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative',
            width: '60px', height: '60px',
            background: '#fff',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37,99,235,.18)',
          }}>
            <Wand2 size={26} color="#2563EB" style={{ animation: 'wand-wave 2s ease-in-out infinite' }} />
          </div>

          <div style={{ textAlign: 'center', position: 'relative' }}>
            <p style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#1E3A8A',
              marginBottom: '2px',
            }}>
              AI lagi gambar...
            </p>
            <p style={{
              fontSize: '11px',
              color: '#64748B',
              fontFamily: "'DM Mono', monospace",
            }}>
              Telah berjalan {elapsed}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar
          progress={progress}
          elapsedMs={elapsedMs}
          estimatedMs={estimatedTime}
          showLabel value={0}        />

        {/* Footer info */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#94A3B8',
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace" }}>
            Job ID: {jobId?.slice(0, 8)}...
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                padding: '2px 6px',
                borderRadius: '4px',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              Batal
            </button>
          )}
        </div>

        <style>{`
          @keyframes pulse-soft {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: .8 }
            50%      { transform: translate(-50%, -50%) scale(1.4); opacity: .3 }
          }
          @keyframes wand-wave {
            0%, 100% { transform: rotate(-8deg) }
            50%      { transform: rotate(8deg) }
          }
        `}</style>
      </div>
    )
  }

  // ── State 4: Completed ───────────────────────────────
  if (status === 'completed' && media_url) {
    const duration = formatDuration(elapsedMs)

    return (
      <>
        <div style={cardStyle('success')}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}>
            <StatusBadge status={status} />
            <span style={metaStyle()}>
              Selesai dalam {duration}
            </span>
          </div>

          {/* Image preview clickable */}
          <button
            onClick={() => setPreviewOpen(true)}
            style={{
              display: 'block',
              width: '100%',
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: '14px',
            }}
          >
            <div style={{
              aspectRatio: '1',
              background: 'repeating-conic-gradient(#F1F5F9 0% 25%, #fff 0% 50%) 50% / 24px 24px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              position: 'relative',
            }}>
              <img
                src={media_url}
                alt="Generated"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
                referrerPolicy="no-referrer"
              />

              {/* Hover overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15,23,42,0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'all .2s',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
              }}
              className="image-hover-overlay"
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'rgba(15,23,42,.85)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <Maximize2 size={13} /> Klik untuk preview
                </span>
              </div>
            </div>
          </button>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPreviewOpen(true)}
              style={secondaryButton()}
            >
              <Eye size={12} /> Preview
            </button>

            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = media_url
                link.download = `beesell-${Date.now()}.png`
                link.click()
              }}
              style={primaryButton()}
            >
              <Download size={12} /> Download
            </button>
          </div>
        </div>

        <ImagePreviewModal
          open={previewOpen}
          media_url={media_url}
          onClose={() => setPreviewOpen(false)}
        />

        <style>{`
          .image-hover-overlay { opacity: 0 }
          button:hover > div > .image-hover-overlay,
          button:hover .image-hover-overlay { opacity: 1; background: rgba(15,23,42,.4) !important }
        `}</style>
      </>
    )
  }

  // ── State 5: Failed / Timeout ────────────────────────
  if (status === 'failed' || status === 'timeout') {
    const isTimeout = status === 'timeout'

    return (
      <div style={cardStyle('error')}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}>
          <StatusBadge status={status} />
          {jobId && (
            <span style={metaStyle()}>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>
                {jobId.slice(0, 8)}...
              </span>
            </span>
          )}
        </div>

        <div style={{
          padding: '20px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '12px',
          marginBottom: '14px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>
              {isTimeout ? 'Generation timeout' : 'Generation gagal'}
            </p>
            <p style={{ fontSize: '12px', color: '#B91C1C', lineHeight: 1.5 }}>
              {error ?? 'Unknown error'}
            </p>
            {isTimeout && (
              <p style={{ fontSize: '11px', color: '#7F1D1D', marginTop: '8px', fontStyle: 'italic' }}>
                Tip: Server lagi sibuk. Coba 30 detik lagi.
              </p>
            )}
          </div>
        </div>

        {onRetry && (
          <button onClick={onRetry} style={primaryButton()}>
            <RefreshCw size={12} /> Coba Lagi
          </button>
        )}
      </div>
    )
  }

  return null
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
    dispatching: {
      icon:   <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />,
      label:  'Mengirim ke server',
      color:  '#1E3A8A',
      bg:     '#EFF6FF',
      border: '#DBEAFE',
    },
    processing: {
      icon:   <Sparkles size={11} />,
      label:  'AI Processing',
      color:  '#5B21B6',
      bg:     '#F5F3FF',
      border: '#DDD6FE',
    },
    completed: {
      icon:   <Check size={11} />,
      label:  'Selesai',
      color:  '#15803D',
      bg:     '#F0FDF4',
      border: '#BBF7D0',
    },
    failed: {
      icon:   <AlertCircle size={11} />,
      label:  'Gagal',
      color:  '#991B1B',
      bg:     '#FEF2F2',
      border: '#FECACA',
    },
    timeout: {
      icon:   <Clock size={11} />,
      label:  'Timeout',
      color:  '#92400E',
      bg:     '#FEF3C7',
      border: '#FDE68A',
    },
  }

  const c = config[status] ?? config.processing

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 10px',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {c.icon}
      {c.label}
    </div>
  )
}

// ── Style helpers ────────────────────────────────────────
function cardStyle(variant?: 'success' | 'error'): React.CSSProperties {
  const borderColor = variant === 'success' ? '#BBF7D0' :
                      variant === 'error'   ? '#FECACA' :
                      '#E2E8F0'

  return {
    background: '#fff',
    border:     `1px solid ${borderColor}`,
    borderRadius: '14px',
    padding:    '18px',
    fontFamily: "'DM Sans', sans-serif",
  }
}

function metaStyle(): React.CSSProperties {
  return {
    fontSize: '11px',
    color:    '#64748B',
    fontFamily: "'DM Mono', monospace",
  }
}

function primaryButton(): React.CSSProperties {
  return {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '9px 14px',
    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 4px 12px rgba(37,99,235,.25)',
  }
}

function secondaryButton(): React.CSSProperties {
  return {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '9px 14px',
    background: '#fff',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  }
}