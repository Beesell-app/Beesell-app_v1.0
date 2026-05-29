'use client'
// apps/web-app/components/creator/PhotoUploadZone.tsx
// Photo upload dengan react-dropzone + bg removal toggle
// Replace PhotoInputPanel lama yang masih placeholder
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useUploadPhoto } from '@/lib/hooks/useUploadPhoto'
import { useTenant } from '@/store/sessionStore'
import {
  Upload, Image as ImageIcon, X, Loader2, Sparkles,
  Check, AlertCircle, Wand2, Lock,
} from 'lucide-react'

interface Props {
  onUploadComplete?: (urls: { original: string; processed: string | null }) => void
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/webp': ['.webp'],
}

export function PhotoUploadZone({ onUploadComplete }: Props) {
  const tenant = useTenant()
  const [removeBg, setRemoveBg] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const upload = useUploadPhoto()

  const isFreePlan = tenant?.plan === 'free'

  // ── react-dropzone setup ──────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setValidationError(null)

    // Handle rejection
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      const reason = rejection.errors[0]?.code

      if (reason === 'file-too-large') {
        setValidationError('Ukuran file melebihi 10MB')
      } else if (reason === 'file-invalid-type') {
        setValidationError('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
      } else {
        setValidationError(rejection.errors[0]?.message ?? 'File tidak valid')
      }
      return
    }

    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setSelectedFile(file)

    // Generate preview
    const reader = new FileReader()
    reader.onload = e => setPreviewUrl(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept:    ACCEPTED_TYPES,
    maxSize:   MAX_SIZE_BYTES,
    maxFiles:  1,
    multiple:  false,
    disabled:  upload.isPending,
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      const result = await upload.mutateAsync({
        file:     selectedFile,
        removeBg: removeBg && !isFreePlan,
      })

      onUploadComplete?.({
        original:  result.original.url,
        processed: result.processed?.url ?? null,
      })
    } catch (err) {
      // Error sudah di-handle oleh useMutation, tampil di UI dari upload.error
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setValidationError(null)
    upload.reset()
  }

  // ── State 1: No file selected → dropzone ──────────────
  if (!selectedFile && !upload.data) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div
          {...getRootProps()}
          style={{
            padding: '48px 24px',
            border: `2px dashed ${
              isDragReject ? '#DC2626' :
              isDragActive ? '#2563EB' : '#CBD5E1'
            }`,
            background:
              isDragReject ? '#FEF2F2' :
              isDragActive ? '#EFF6FF' : '#F8FAFC',
            borderRadius: '14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all .15s',
          }}
        >
          <input {...getInputProps()} />

          <div style={{
            width: '56px', height: '56px',
            background: '#fff',
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 1px 3px rgba(15,23,42,.06)',
          }}>
            <Upload size={24} color={isDragReject ? '#DC2626' : '#2563EB'} />
          </div>

          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
            {isDragActive
              ? (isDragReject ? 'Format file tidak didukung' : 'Drop foto di sini')
              : 'Drop foto produk di sini'
            }
          </p>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            atau klik untuk pilih file · JPG, PNG, WebP · max 10MB
          </p>

          {/* Bg removal info pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center', gap: '6px',
            marginTop: '14px',
            padding: '5px 11px',
            background: '#F1F5F9',
            borderRadius: '99px',
            fontSize: '11px',
            color: '#475569',
          }}>
            <Wand2 size={11} color="#7C3AED" />
            Bisa hapus background otomatis
          </div>
        </div>

        {validationError && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#991B1B',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertCircle size={14} />
            {validationError}
          </div>
        )}
      </div>
    )
  }

  // ── State 2: File selected, not yet uploaded → preview + options ──
  if (selectedFile && !upload.data) {
    const fileSizeMB = (selectedFile.size / 1024 / 1024).toFixed(1)

    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Preview */}
        <div style={{
          position: 'relative',
          background: '#F8FAFC',
          borderRadius: '14px',
          overflow: 'hidden',
          marginBottom: '14px',
          padding: '16px',
        }}>
          <button
            onClick={handleReset}
            disabled={upload.isPending}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              width: '30px', height: '30px',
              background: 'rgba(15,23,42,.7)',
              color: '#fff', border: 'none',
              borderRadius: '50%',
              cursor: upload.isPending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <X size={14} />
          </button>

          <img
            src={previewUrl ?? ''}
            alt="Preview"
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'contain',
              display: 'block',
              borderRadius: '8px',
              background: '#fff',
            }}
          />

          <div style={{
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#64748B',
          }}>
            <span style={{
              maxWidth: '60%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {selectedFile.name}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>{fileSizeMB} MB</span>
          </div>
        </div>

        {/* BG Removal toggle */}
        <div style={{
          marginBottom: '14px',
          padding: '14px',
          background: removeBg ? '#F5F3FF' : '#fff',
          border: `1px solid ${removeBg ? '#C4B5FD' : '#E2E8F0'}`,
          borderRadius: '12px',
          transition: 'all .15s',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: isFreePlan ? 'not-allowed' : 'pointer',
            opacity: isFreePlan ? 0.6 : 1,
          }}>
            <input
              type="checkbox"
              checked={removeBg && !isFreePlan}
              onChange={e => !isFreePlan && setRemoveBg(e.target.checked)}
              disabled={isFreePlan}
              style={{
                marginTop: '2px',
                accentColor: '#7C3AED',
                cursor: isFreePlan ? 'not-allowed' : 'pointer',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '2px',
              }}>
                <Wand2 size={14} color="#7C3AED" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  Hapus background otomatis
                </span>
                {isFreePlan && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    background: '#FEF3C7',
                    color: '#92400E',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                  }}>
                    <Lock size={9} /> Plan Basic+
                  </span>
                )}
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
                AI hapus background, sisain produk aja. Cocok buat upload Shopee/Tokopedia.
              </p>
              <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                Cost: 1 kredit (~Rp 320) · processing 5-10 detik
              </p>
            </div>
          </label>
        </div>

        {/* Upload error */}
        {upload.error && (
          <div style={{
            marginBottom: '12px',
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#991B1B',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertCircle size={14} />
            {upload.error.message}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReset}
            disabled={upload.isPending}
            style={{
              padding: '11px 20px',
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '13px', fontWeight: 500, color: '#475569',
              cursor: upload.isPending ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Batal
          </button>

          <button
            onClick={handleUpload}
            disabled={upload.isPending}
            style={{
              flex: 1,
              padding: '11px 20px',
              background: upload.isPending
                ? '#CBD5E1'
                : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px', fontWeight: 600,
              cursor: upload.isPending ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: !upload.isPending ? '0 4px 12px rgba(37,99,235,.25)' : 'none',
              transition: 'all .15s',
            }}
          >
            {upload.isPending ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                {removeBg && !isFreePlan ? 'Processing background...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload size={14} />
                Upload {removeBg && !isFreePlan && '+ Hapus BG'}
              </>
            )}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── State 3: Upload completed → show result ────────────
  if (upload.data) {
    const result = upload.data
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Success banner */}
        <div style={{
          padding: '12px 14px',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '10px',
          fontSize: '12px',
          color: '#15803D',
          marginBottom: '14px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Check size={14} />
          <span style={{ flex: 1, fontWeight: 500 }}>
            Upload berhasil
            {result.processed && ' · Background sudah dihapus'}
            {result.bgRemovalError && ' · BG removal gagal (foto original tetap tersimpan)'}
          </span>
        </div>

        {/* Side-by-side preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: result.processed ? '1fr 1fr' : '1fr',
          gap: '12px',
          marginBottom: '14px',
        }}>
          <ImageCard
            label="Original"
            url={result.original.url}
            sublabel={`${(result.original.sizeBytes / 1024 / 1024).toFixed(1)} MB`}
          />

          {result.processed && (
            <ImageCard
              label="Background Removed"
              url={result.processed.url}
              sublabel={`${result.processed.creditsUsed} kredit · Rp ${Math.round(result.processed.creditsUsed * 320)}`}
              checkered
              accent
            />
          )}
        </div>

        {/* BG removal error (kalau original berhasil tapi bg gagal) */}
        {result.bgRemovalError && (
          <div style={{
            padding: '10px 14px',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#92400E',
            marginBottom: '14px',
          }}>
            ⚠️ BG removal gagal: {result.bgRemovalError}
          </div>
        )}

        {/* Reset button */}
        <button
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '11px 20px',
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            fontSize: '13px', fontWeight: 500, color: '#475569',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <ImageIcon size={13} /> Upload foto lain
        </button>
      </div>
    )
  }

  return null
}

// ── Sub-component: Image card ────────────────────────────────
function ImageCard({ label, url, sublabel, checkered, accent }: {
  label:    string
  url:      string
  sublabel: string
  checkered?: boolean   // checkered bg untuk transparent PNG
  accent?:    boolean   // purple accent untuk processed
}) {
  return (
    <div style={{
      background: '#F8FAFC',
      border: `1px solid ${accent ? '#C4B5FD' : '#E2E8F0'}`,
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        aspectRatio: '1',
        background: checkered
          ? 'repeating-conic-gradient(#E2E8F0 0% 25%, #fff 0% 50%) 50% / 16px 16px'
          : '#fff',
        overflow: 'hidden',
      }}>
        <img
          src={url}
          alt={label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          referrerPolicy="no-referrer"
        />

        {accent && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            padding: '3px 8px',
            background: 'rgba(124,58,237,.95)',
            color: '#fff',
            borderRadius: '5px',
            fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', gap: '4px',
            backdropFilter: 'blur(4px)',
          }}>
            <Sparkles size={10} /> AI
          </div>
        )}
      </div>

      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid #E2E8F0',
        background: '#fff',
      }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>
          {label}
        </p>
        <p style={{ fontSize: '10px', color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>
          {sublabel}
        </p>
      </div>
    </div>
  )
}