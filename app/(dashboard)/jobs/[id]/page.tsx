'use client'
// apps/web-app/app/(dashboard)/jobs/[id]/page.tsx
// ── Standalone job status page (deep link dari notif atau email) ──
import { use } from 'react'
import Link    from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { JobType, useJobStatus }   from '@/hooks/useJobStatus'
import { SkeletonLoader } from '@/components/jobs/SkeletonLoader'
import { ProgressBar }    from '@/components/jobs/ProgressBar'
import { ResultPreview }  from '@/components/jobs/ResultPreview'

interface Props {
  progress: number
  elapsedMs: number
  estimatedMs: number
  jobType?: JobType
  model?: string | null
}

export default function JobStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params)

  const {
    status, jobType, progress, elapsedMs, estimatedMs,
    result, error, model, cost_usd, retry,
  } = useJobStatus(jobId)

  const isPending    = status === 'pending'
  const isProcessing = status === 'processing'
  const isCompleted  = status === 'completed'
  const isFailed     = status === 'failed' || status === 'canceled'

  const jobTypeLabel: Record<string, string> = {
    text_generation:  'Caption AI',
    image_generation: 'Gambar AI',
    video_generation: 'Video AI',
    bulk_generation:  'Bulk Generate',
  }

  return (
    <div style={{
      maxWidth: '680px',
      margin:   '0 auto',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '12px',
        marginBottom: '24px',
      }}>
        <Link href="/content" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: '#64748B', textDecoration: 'none',
        }}>
          <ArrowLeft size={13} /> Konten
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily:    "'Fraunces', serif",
            fontSize:      '22px',
            fontWeight:    600,
            color:         '#0F172A',
            letterSpacing: '-0.02em',
          }}>
            {jobType ? (jobTypeLabel[jobType] ?? 'Proses AI') : 'Status Job'}
          </h1>
          <p style={{ fontSize: '12px', color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>
            {jobId.slice(0, 8)}...
          </p>
        </div>

        {/* Status badge */}
        <StatusBadge status={status} />
      </div>

      {/* ── PENDING: skeleton ─────────────────────────────── */}
      {isPending && (
        <div>
          <SkeletonLoader
            jobType={
              jobType === 'bulk_generation'
                ? 'text_generation'
                : jobType === 'background_removal'
                  ? 'image_generation'
                  : (jobType ?? 'image_generation')
            }
          />
          <p style={{
            textAlign: 'center', fontSize: '13px', color: '#64748B',
            marginTop: '16px',
          }}>
            Job sedang dalam antrian...
          </p>
        </div>
      )}

      {/* ── PROCESSING: progress bar ───────────────────────── */}
      {isProcessing && (
        <ProgressBar
          progress={progress}
          elapsedMs={elapsedMs}
          estimatedMs={estimatedMs}
          jobType={jobType ?? undefined}
          model={model} value={0}        />
      )}

      {/* ── COMPLETED: result preview ──────────────────────── */}
      {isCompleted && result && (
        <div>
          <ResultPreview
            result={result}
            jobType={jobType ?? undefined}
            model={model}
            cost_usd={cost_usd}
            elapsedMs={elapsedMs}
          />

          <div style={{
            display: 'flex', justifyContent: 'center', gap: '12px',
            marginTop: '20px',
          }}>
            <Link
              href="/content/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff', textDecoration: 'none', borderRadius: '10px',
                fontSize: '13px', fontWeight: 600,
                boxShadow: '0 4px 12px rgba(37,99,235,.25)',
              }}
            >
              ✨ Buat Konten Lagi
            </Link>
          </div>
        </div>
      )}

      {/* ── FAILED: error state ────────────────────────────── */}
      {isFailed && (
        <div style={{
          padding:      '32px 24px',
          background:   '#FEF2F2',
          border:       '1px solid #FECACA',
          borderRadius: '16px',
          textAlign:    'center',
        }}>
          <div style={{
            width:   '52px', height: '52px', borderRadius: '50%',
            background: '#FEE2E2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '22px',
          }}>
            ⚠️
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#991B1B', marginBottom: '8px' }}>
            {status === 'canceled' ? 'Job Dibatalkan' : 'Proses Gagal'}
          </h3>
          <p style={{ fontSize: '13px', color: '#B91C1C', lineHeight: 1.5, marginBottom: '20px' }}>
            {error ?? 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'}
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={retry}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px',
                background: '#DC2626', color: '#fff', border: 'none',
                borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <RefreshCw size={13} /> Coba Lagi
            </button>

            <Link
              href="/content/new"
              style={{
                padding: '10px 18px', background: '#fff',
                border: '1px solid #FECACA', borderRadius: '10px',
                fontSize: '13px', fontWeight: 500, color: '#64748B',
                textDecoration: 'none',
              }}
            >
              Buat Baru
            </Link>
          </div>
        </div>
      )}

      {/* ── Processing tips (shows only during processing) ── */}
      {isProcessing && (
        <div style={{
          marginTop:    '16px',
          padding:      '14px 16px',
          background:   '#F8FAFC',
          border:       '1px solid #E2E8F0',
          borderRadius: '12px',
          fontSize:     '12px',
          color:        '#64748B',
          lineHeight:   1.6,
        }}>
          <strong style={{ color: '#0F172A' }}>💡 Tips:</strong> Kamu bisa tutup halaman ini —
          proses tetap berjalan di server. Hasil akan muncul di{' '}
          <Link href="/content" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
            Konten Library
          </Link>{' '}
          setelah selesai.
        </div>
      )}
    </div>
  )
}

// ── Status badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string; border: string }> = {
    pending:    { label: 'Antrian',    bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
    processing: { label: 'Processing', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
    completed:  { label: 'Selesai',   bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
    failed:     { label: 'Gagal',     bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    canceled:   { label: 'Dibatalkan',bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
  }

  const c = config[status] ?? config.pending

  return (
    <span style={{
      padding:      '4px 12px',
      background:   c.bg,
      color:        c.color,
      border:       `1px solid ${c.border}`,
      borderRadius: '8px',
      fontSize:     '12px',
      fontWeight:   600,
      display:      'flex',
      alignItems:   'center',
      gap:          '5px',
    }}>
      {status === 'processing' && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB',
          animation: 'blink 1s infinite',
          display: 'inline-block',
        }} />
      )}
      {c.label}
      <style>{`@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
    </span>
  )
}