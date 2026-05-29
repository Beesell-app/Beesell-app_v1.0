// apps/web-app/app/og/default.png/route.tsx
// Dynamic OG image 1200×630 — generated server-side
// No external image needed; pure CSS + text
import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt     = 'BeeSell AI — Caption AI untuk Seller Indonesia'
export const size    = { width: 1200, height: 630 }

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width:      '100%',
          height:     '100%',
          display:    'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #312E81 100%)',
          position:   'relative',
          overflow:   'hidden',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background glow blobs */}
        <div style={{
          position:     'absolute',
          top:          '-100px',
          right:        '-100px',
          width:        '500px',
          height:       '500px',
          background:   'radial-gradient(circle, rgba(37,99,235,.4) 0%, transparent 70%)',
          borderRadius: '50%',
          display:      'flex',
        }} />
        <div style={{
          position:     'absolute',
          bottom:       '-80px',
          left:         '-80px',
          width:        '400px',
          height:       '400px',
          background:   'radial-gradient(circle, rgba(124,58,237,.3) 0%, transparent 70%)',
          borderRadius: '50%',
          display:      'flex',
        }} />

        {/* Logo */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '16px',
          marginBottom:   '32px',
        }}>
          <div style={{
            width:          '64px',
            height:         '64px',
            background:     'linear-gradient(135deg, #2563EB, #7C3AED)',
            borderRadius:   '18px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '32px',
          }}>
            ✨
          </div>
          <span style={{
            fontSize:      '40px',
            fontWeight:    700,
            color:         '#fff',
            letterSpacing: '-1px',
          }}>
            BeeSell AI
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize:      '64px',
          fontWeight:    700,
          color:         '#fff',
          textAlign:     'center',
          lineHeight:    1.1,
          margin:        '0 80px 24px',
          letterSpacing: '-2px',
        }}>
          Caption AI untuk{' '}
          <span style={{
            background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            Seller Indonesia
          </span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize:    '28px',
          color:       'rgba(255,255,255,.7)',
          textAlign:   'center',
          margin:      '0 160px 48px',
          lineHeight:  1.4,
        }}>
          Instagram & TikTok caption yang converting — dibuat AI dalam hitungan detik
        </p>

        {/* Platform badges */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {[
            { icon: '📷', label: 'Instagram Feed' },
            { icon: '🎬', label: 'Reels' },
            { icon: '🎵', label: 'TikTok' },
          ].map(p => (
            <div key={p.label} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '10px 20px',
              background:   'rgba(255,255,255,.1)',
              borderRadius: '99px',
              border:       '1px solid rgba(255,255,255,.2)',
              fontSize:     '20px',
              color:        '#fff',
            }}>
              {p.icon} {p.label}
            </div>
          ))}
        </div>

        {/* URL watermark */}
        <p style={{
          position:  'absolute',
          bottom:    '32px',
          fontSize:  '20px',
          color:     'rgba(255,255,255,.4)',
        }}>
          beesell.id
        </p>
      </div>
    ),
    {
      ...size,
    },
  )
}