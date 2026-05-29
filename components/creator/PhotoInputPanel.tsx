'use client'
// apps/web-app/components/creator/PhotoInputPanel.tsx
// v2: Real upload dengan PhotoUploadZone (react-dropzone + Remove.bg)
// Menggantikan placeholder "Foto Upload Segera" dari Phase 1
import { useContentCreatorStore } from '@/store/contentCreatorStore'
import { PhotoUploadZone } from './PhotoUploadZone'

export function PhotoInputPanel() {
  const setMode           = useContentCreatorStore(s => s.setMode)
  const setPhotoFile      = useContentCreatorStore(s => s.setPhotoFile)
  const setPhotoExtracted = useContentCreatorStore(s => s.setPhotoExtracted)

  const handleUploadComplete = (urls: { original: string; processed: string | null }) => {
    // Simpan metadata di store
    setPhotoExtracted({
      originalUrl:  urls.original,
      removedBgUrl: urls.processed,
    })

    // Preview URL: prefer removed-bg kalau ada
    setPhotoFile(urls.processed ?? urls.original)

    // Auto-switch ke tab Manual untuk isi nama + harga + benefit
    setMode('manual')
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* How-to banner */}
      <div style={{
        marginBottom: '14px',
        padding:      '10px 14px',
        background:   '#EFF6FF',
        border:       '1px solid #BFDBFE',
        borderRadius: '10px',
        fontSize:     '12px',
        color:        '#1E3A8A',
        lineHeight:   1.5,
      }}>
        <strong>Cara pakai:</strong> Upload foto produk kamu →{' '}
        AI hapus background otomatis (opsional) →{' '}
        Pindah ke tab <strong>Manual</strong> untuk isi nama + harga + benefit →{' '}
        Klik <strong>Generate Caption</strong>
      </div>

      {/* Dropzone + preview + bg removal */}
      <PhotoUploadZone onUploadComplete={handleUploadComplete} />

      {/* Photo tips */}
      <div style={{
        marginTop:           '14px',
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 '8px',
      }}>
        {[
          { icon: '📸', label: 'Foto jelas, pencahayaan cukup' },
          { icon: '🎯', label: 'Fokus ke produk, background simple' },
          { icon: '📐', label: 'Resolusi minimal 500×500px' },
          { icon: '⚡', label: 'Background dihapus otomatis AI' },
        ].map(tip => (
          <div
            key={tip.label}
            style={{
              padding:      '8px 10px',
              background:   '#F8FAFC',
              borderRadius: '8px',
              fontSize:     '11px',
              color:        '#475569',
              display:      'flex',
              alignItems:   'flex-start',
              gap:          '6px',
              lineHeight:   1.4,
            }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{tip.icon}</span>
            {tip.label}
          </div>
        ))}
      </div>
    </div>
  )
}