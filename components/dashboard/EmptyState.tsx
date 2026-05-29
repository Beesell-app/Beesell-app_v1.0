// apps/web-app/components/dashboard/EmptyState.tsx
import Link from 'next/link'

interface Props {
  icon:        React.ReactNode
  title:       string
  description: string
  ctaLabel?:   string
  ctaHref?:    string
  ctaOnClick?: () => void
}

export function EmptyState({ icon, title, description, ctaLabel, ctaHref, ctaOnClick }: Props) {
  return (
    <div style={{
      padding: '60px 24px',
      textAlign: 'center',
      background: '#fff',
      border: '1px dashed #CBD5E1',
      borderRadius: '14px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '56px', height: '56px',
        background: '#F1F5F9',
        borderRadius: '14px',
        display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
        color: '#94A3B8',
      }}>
        {icon}
      </div>

      <h3 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: '20px', fontWeight: 600,
        color: '#0F172A',
        marginBottom: '6px',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '13px', color: '#64748B',
        maxWidth: '380px', margin: '0 auto 20px',
        lineHeight: 1.5,
      }}>
        {description}
      </p>

      {ctaLabel && (ctaHref ? (
        <Link href={ctaHref} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          color: '#fff', textDecoration: 'none',
          borderRadius: '10px',
          fontSize: '13px', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(37,99,235,.25)',
        }}>
          {ctaLabel}
        </Link>
      ) : (
        <button
          onClick={ctaOnClick}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#fff', border: 'none',
            borderRadius: '10px',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 4px 12px rgba(37,99,235,.25)',
          }}
        >
          {ctaLabel}
        </button>
      ))}
    </div>
  )
}