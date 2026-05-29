'use client'
// apps/web-app/app/global-error.tsx
// ── Next.js root error boundary ───────────────────────────────
// Catches errors from root layout — last resort
// Shows above the normal layout (no sidebar/nav available)
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error tracking
    console.error('[GlobalError]', error.message, error.digest)
  }, [error])

  return (
    <html lang="id">
      <body style={{
        margin:     0,
        padding:    0,
        background: '#F8FAFC',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight:  '100vh',
        WebkitFontSmoothing: 'antialiased',
      }}>
        <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '480px' }}>
          {/* Logo */}
          <div style={{
            width:          '48px',
            height:         '48px',
            background:     'linear-gradient(135deg, #2563EB, #7C3AED)',
            borderRadius:   '14px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 20px',
            fontSize:       '22px',
          }}>
            ✨
          </div>

          <h1 style={{
            fontSize:      '24px',
            fontWeight:    700,
            color:         '#0F172A',
            letterSpacing: '-0.5px',
            marginBottom:  '10px',
          }}>
            Oops, ada yang error
          </h1>

          <p style={{
            fontSize:     '15px',
            color:        '#64748B',
            lineHeight:   1.6,
            marginBottom: '28px',
          }}>
            Terjadi kesalahan yang tidak terduga. Tim kami sudah diberitahu.
          </p>

          {error.digest && (
            <p style={{
              fontSize:     '11px',
              color:        '#CBD5E1',
              fontFamily:   'monospace',
              marginBottom: '24px',
            }}>
              Error: {error.digest}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding:      '11px 22px',
                background:   'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color:        '#fff',
                border:       'none',
                borderRadius: '11px',
                fontSize:     '14px',
                fontWeight:   600,
                cursor:       'pointer',
                fontFamily:   'inherit',
              }}
            >
              🔄 Coba Lagi
            </button>

            <Link href="/" style={{
              padding:        '11px 22px',
              background:     '#fff',
              border:         '1px solid #E2E8F0',
              borderRadius:   '11px',
              fontSize:       '14px',
              fontWeight:     500,
              color:          '#475569',
              textDecoration: 'none',
            }}>
              Ke Beranda
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}