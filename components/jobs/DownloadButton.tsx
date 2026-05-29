'use client'
// apps/web-app/components/jobs/DownloadButton.tsx
// Download button dengan popover untuk pilih format + size + save to library
//
// Two modes (auto-detected):
//   1. media_url mode  — download dari URL Supabase Storage
//   2. canvas mode    — export dari Fabric/HTMLCanvas
import { useState, useRef, useEffect } from 'react'
import { Download, Check, Loader2, ChevronDown, FileImage, Save, Library } from 'lucide-react'
import { useImageDownload, SIZE_PRESETS } from '@/lib/hooks/useImageDownload'
import type { DownloadFormat, DownloadSize } from '@/lib/hooks/useImageDownload'
import { useSaveUrlToLibrary, useSaveBlobToLibrary } from '@/lib/hooks/useSaveToLibrary'

interface Props {
  // Source — provide ONE of these:
  media_url?:  string                  // dari Replicate/Supabase
  canvas?:    HTMLCanvasElement       // dari Fabric editor

  // Save to library
  contentId?: string                  // attach ke existing content
  source?:    'template_editor' | 'image_generator' | 'upload' | 'unknown'
  title?:     string
  metadata?:  Record<string, any>     // canvas JSON, prompt, dll

  // UI
  variant?:   'primary' | 'secondary'
  label?:     string
}

export function DownloadButton({
  media_url,
  canvas,
  contentId,
  source = 'unknown',
  title,
  metadata,
  variant = 'primary',
  label = 'Download',
}: Props) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<DownloadFormat>('png')
  const [size, setSize]     = useState<DownloadSize>('full')
  const [saveToLibrary, setSaveToLibrary] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { downloadFromUrl, downloadFromCanvas, isDownloading } = useImageDownload()
  const saveUrl  = useSaveUrlToLibrary()
  const saveBlob = useSaveBlobToLibrary()

  const isSaving = saveUrl.isPending || saveBlob.isPending
  const isPending = isDownloading || isSaving

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [open])

  // Reset success state setelah popover close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setSavedSuccess(false), 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // ── Download + optional save ──────────────────────────
  const handleDownload = async () => {
    setSavedSuccess(false)

    let downloadResult: { success: boolean; blob?: Blob; sizeBytes?: number } = { success: false }

    // 1. Download
    if (canvas) {
      downloadResult = await downloadFromCanvas(canvas, { format, size })
    } else if (media_url) {
      downloadResult = await downloadFromUrl(media_url, { format, size })
    } else {
      console.warn('[DownloadButton] No media_url or canvas provided')
      return
    }

    if (!downloadResult.success) {
      // Error sudah di-handle oleh hook
      return
    }

    // 2. Save to library (kalau dipilih)
    if (saveToLibrary) {
      try {
        if (downloadResult.blob && canvas) {
          // Canvas mode — upload blob baru
          await saveBlob.mutateAsync({
            blob:     downloadResult.blob,
            filename: `${title ?? 'design'}-${size}.${format}`,
            title:    title ?? `Design ${new Date().toLocaleDateString('id-ID')}`,
            source,
            metadata: {
              ...metadata,
              format,
              size,
              sizeBytes: downloadResult.sizeBytes,
            },
          })
        } else if (media_url) {
          // URL mode — save reference (image sudah di Storage)
          await saveUrl.mutateAsync({
            media_url,
            title:     title ?? `Image ${new Date().toLocaleDateString('id-ID')}`,
            format,
            sizeBytes: downloadResult.sizeBytes,
            contentId,
            source,
            metadata,
          })
        }
        setSavedSuccess(true)

        // Auto-close popover setelah success
        setTimeout(() => setOpen(false), 1500)

      } catch (err: any) {
        console.error('[DownloadButton] Save failed:', err)
        // User tetap dapat file download — saving silently failed
        // Bisa tambah toast notification kalau perlu
      }
    } else {
      // Tanpa save — close popover
      setOpen(false)
    }
  }

  const buttonStyles = variant === 'primary'
    ? {
        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
        color: '#fff',
        border: 'none',
        boxShadow: '0 2px 8px rgba(37,99,235,.25)',
      }
    : {
        background: '#fff',
        color: '#475569',
        border: '1px solid #E2E8F0',
        boxShadow: 'none',
      }

  const saveError = saveUrl.error || saveBlob.error

  return (
    <div ref={popoverRef} style={{ position: 'relative', display: 'inline-block' }}>

      {/* Button */}
      <button
        onClick={() => !isPending && setOpen(!open)}
        disabled={isPending || (!media_url && !canvas)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          opacity: isPending ? 0.7 : 1,
          transition: 'all .15s',
          ...buttonStyles,
        }}
      >
        {isPending ? (
          <>
            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            {isDownloading ? 'Mengunduh...' : 'Menyimpan...'}
          </>
        ) : savedSuccess ? (
          <>
            <Check size={13} />
            Tersimpan
          </>
        ) : (
          <>
            <Download size={13} />
            {label}
            <ChevronDown size={11} style={{ opacity: .7 }} />
          </>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          width: '300px',
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(15,23,42,.15)',
          padding: '16px',
          zIndex: 30,
          fontFamily: "'DM Sans', sans-serif",
        }}>

          {/* Format selector */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <FormatChip
                active={format === 'png'}
                onClick={() => setFormat('png')}
                title="PNG"
                desc="Transparan support"
              />
              <FormatChip
                active={format === 'jpg'}
                onClick={() => setFormat('jpg')}
                title="JPG"
                desc="File lebih kecil"
              />
            </div>
          </div>

          {/* Size selector */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Ukuran</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(Object.keys(SIZE_PRESETS) as DownloadSize[]).map(key => (
                <SizeOption
                  key={key}
                  active={size === key}
                  onClick={() => setSize(key)}
                  label={SIZE_PRESETS[key].label}
                  recommended={key === 'full'}
                />
              ))}
            </div>
          </div>

          {/* Save to library toggle */}
          <div style={{
            marginBottom: '14px',
            padding: '10px 12px',
            background: saveToLibrary ? '#F0FDF4' : '#F8FAFC',
            border: `1px solid ${saveToLibrary ? '#86EFAC' : '#E2E8F0'}`,
            borderRadius: '9px',
            transition: 'all .15s',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={e => setSaveToLibrary(e.target.checked)}
                style={{
                  marginTop: '2px',
                  accentColor: '#16A34A',
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginBottom: '2px',
                }}>
                  <Library size={11} />
                  Simpan ke Library
                </div>
                <p style={{ fontSize: '10px', color: '#64748B', lineHeight: 1.4 }}>
                  Bisa diakses lagi nanti di menu Konten Saya
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {saveError && (
            <div style={{
              marginBottom: '10px',
              padding: '8px 10px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '7px',
              fontSize: '11px',
              color: '#991B1B',
            }}>
              ⚠️ Save gagal: {saveError.message}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#475569',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Batal
            </button>
            <button
              onClick={handleDownload}
              disabled={isPending}
              style={{
                flex: 2,
                padding: '8px 12px',
                background: isPending ? '#CBD5E1' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: !isPending ? '0 2px 6px rgba(37,99,235,.25)' : 'none',
              }}
            >
              {isPending ? (
                <>
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                  Proses...
                </>
              ) : (
                <>
                  <Download size={11} />
                  {saveToLibrary ? 'Download & Simpan' : 'Download'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

function FormatChip({ active, onClick, title, desc }: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 10px',
        background: active ? '#EFF6FF' : '#fff',
        border: `1px solid ${active ? '#2563EB' : '#E2E8F0'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all .15s',
      }}
    >
      <div style={{
        fontSize: '12px',
        fontWeight: 700,
        color: active ? '#2563EB' : '#0F172A',
        marginBottom: '1px',
      }}>
        {title}
      </div>
      <div style={{ fontSize: '10px', color: active ? '#3B82F6' : '#94A3B8' }}>
        {desc}
      </div>
    </button>
  )
}

function SizeOption({ active, onClick, label, recommended }: {
  active: boolean
  onClick: () => void
  label: string
  recommended?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 10px',
        background: active ? '#EFF6FF' : 'transparent',
        border: `1px solid ${active ? '#BFDBFE' : 'transparent'}`,
        borderRadius: '7px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        color: active ? '#2563EB' : '#475569',
        textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        width: '100%',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = '#F8FAFC'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        border: `1.5px solid ${active ? '#2563EB' : '#CBD5E1'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {active && (
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#2563EB',
          }} />
        )}
      </div>
      <span style={{ flex: 1 }}>{label}</span>
      {recommended && (
        <span style={{
          fontSize: '9px',
          fontWeight: 600,
          padding: '1px 6px',
          background: active ? '#2563EB' : '#16A34A',
          color: '#fff',
          borderRadius: '4px',
          letterSpacing: '0.02em',
        }}>
          REKOMENDASI
        </span>
      )}
    </button>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  color: '#64748B',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}