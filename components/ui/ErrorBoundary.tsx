'use client'
// apps/web-app/components/ui/ErrorBoundary.tsx
// ── React Error Boundary ──────────────────────────────────────
// Catches uncaught errors in component tree.
// Wraps major sections: Dashboard, Library, Editor, Creator
import React from 'react'
import Link  from 'next/link'
import { RefreshCw, AlertTriangle, Home } from 'lucide-react'

interface Props {
  children:  React.ReactNode
  fallback?: React.ReactNode
  section?:  string   // e.g. "Dashboard", "Library"
}

interface State {
  hasError: boolean
  error:    Error | null
  errorId:  string
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorId: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console — in production, send to error tracking
    console.error('[ErrorBoundary]', {
      section:    this.props.section ?? 'Unknown',
      error:      error.message,
      stack:      error.stack,
      component:  info.componentStack?.slice(0, 500),
      errorId:    this.state.errorId,
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '60px 24px',
          textAlign:      'center',
          fontFamily:     "'DM Sans', sans-serif",
          minHeight:      '300px',
        }}>
          <div style={{
            width:          '56px',
            height:         '56px',
            background:     '#FEF2F2',
            borderRadius:   '50%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            marginBottom:   '16px',
          }}>
            <AlertTriangle size={24} color="#DC2626" />
          </div>

          <h2 style={{
            fontSize:      '18px',
            fontWeight:    700,
            color:         '#0F172A',
            marginBottom:  '8px',
            letterSpacing: '-0.01em',
          }}>
            {this.props.section ? `${this.props.section} tidak bisa dimuat` : 'Terjadi kesalahan'}
          </h2>

          <p style={{
            fontSize:     '14px',
            color:        '#64748B',
            lineHeight:   1.6,
            marginBottom: '24px',
            maxWidth:     '360px',
          }}>
            Ada yang error. Coba refresh halaman atau kembali ke dashboard.
          </p>

          {/* Error ID for support */}
          <p style={{
            fontSize:   '11px',
            color:      '#CBD5E1',
            fontFamily: "'DM Mono', monospace",
            marginBottom: '20px',
          }}>
            Error ID: {this.state.errorId}
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                display:     'inline-flex',
                alignItems:  'center',
                gap:         '6px',
                padding:     '10px 18px',
                background:  'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color:       '#fff',
                border:      'none',
                borderRadius: '10px',
                fontSize:    '13px',
                fontWeight:  600,
                cursor:      'pointer',
                fontFamily:  "'DM Sans', sans-serif",
              }}
            >
              <RefreshCw size={14} /> Coba Lagi
            </button>

            <Link href="/dashboard" style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '10px 18px',
              background:     '#fff',
              border:         '1px solid #E2E8F0',
              borderRadius:   '10px',
              fontSize:       '13px',
              fontWeight:     600,
              color:          '#475569',
              textDecoration: 'none',
            }}>
              <Home size={14} /> Dashboard
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ── Functional wrapper for simpler use ────────────────────────
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  section?: string,
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary section={section}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}