'use client'
// apps/web-app/components/jobs/SkeletonLoader.tsx
// ── Skeleton loading state ────────────────────────────────────

interface Props {
  jobType?: 'image_generation' | 'text_generation' | 'video_generation'
  inline?:  boolean
}

export function SkeletonLoader({ jobType = 'image_generation', inline = false }: Props) {
  const isImage = jobType === 'image_generation'

  if (inline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '8px',
          background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={shimmerBar('70%', '14px')} />
          <div style={shimmerBar('45%', '10px')} />
        </div>
        <style>{SHIMMER_CSS}</style>
      </div>
    )
  }

  return (
    <div style={{
      background:   '#fff',
      borderRadius: '16px',
      border:       '1px solid #E2E8F0',
      overflow:     'hidden',
      fontFamily:   "'DM Sans', sans-serif",
    }}>
      {/* Main content area */}
      {isImage ? (
        // Image skeleton: tall square
        <div style={{
          width:     '100%',
          paddingTop: '100%',
          position:  'relative',
          background: 'linear-gradient(90deg, #F8FAFC 25%, #F1F5F9 50%, #F8FAFC 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}>
          {/* Placeholder icon center */}
          <div style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '12px',
          }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#E2E8F0" />
              <path d="M14 30l8-8 5 5 4-4 7 7" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="20" cy="20" r="3" fill="#CBD5E1" />
            </svg>
            <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>
              Menyiapkan...
            </p>
          </div>
        </div>
      ) : (
        // Caption skeleton: lines
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={shimmerBar('85%', '18px')} />
          <div style={shimmerBar('70%', '18px')} />
          <div style={shimmerBar('55%', '18px')} />
          <div style={{ height: '8px' }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            {[60, 80, 50, 70].map((w, i) => (
              <div key={i} style={{
                ...shimmerBar(`${w}px`, '24px'),
                borderRadius: '6px',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={shimmerBar('30%', '12px')} />
        <div style={{ flex: 1 }} />
        <div style={shimmerBar('20%', '28px', '8px')} />
      </div>

      <style>{SHIMMER_CSS}</style>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function shimmerBar(width: string, height: string, borderRadius = '6px'): React.CSSProperties {
  return {
    width,
    height,
    borderRadius,
    background:    'linear-gradient(90deg, #F8FAFC 25%, #F1F5F9 50%, #F8FAFC 75%)',
    backgroundSize: '200% 100%',
    animation:     'shimmer 1.5s infinite',
  }
}

const SHIMMER_CSS = `
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`