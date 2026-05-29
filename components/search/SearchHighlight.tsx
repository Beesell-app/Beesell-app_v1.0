'use client'
// apps/web-app/components/search/SearchHighlight.tsx
// ── Render ts_headline output (<mark> tags) safely ────────────
// + MatchType badge (FTS vs Trigram)
import DOMPurify from 'isomorphic-dompurify'

// ── Highlight component ───────────────────────────────────────
interface HighlightProps {
  html:      string | null    // ts_headline output: "...kata <mark>produk</mark> kamu..."
  fallback?: string | null    // plain text fallback
  maxLength?: number
}

export function SearchHighlight({ html, fallback, maxLength = 160 }: HighlightProps) {
  // If no highlight from ts_headline, fall back to plain text
  const raw = html || fallback || ''

  // Sanitize: allow only <mark> tag (from ts_headline)
  const clean = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS:  ['mark'],
    ALLOWED_ATTR:  [],
  })

  // Truncate if too long (ts_headline may be long)
  const truncated = clean.length > maxLength
    ? clean.slice(0, maxLength).trimEnd() + '...'
    : clean

  return (
    <>
      <span
        dangerouslySetInnerHTML={{ __html: truncated }}
        style={{
          fontSize:   '12px',
          color:      '#64748B',
          lineHeight: 1.5,
        }}
      />
      <style>{`
        /* Style <mark> tags from ts_headline */
        mark {
          background:    #FEF08A;
          color:         #713F12;
          borderRadius:  2px;
          padding:       0 1px;
          fontWeight:    600;
        }
      `}</style>
    </>
  )
}

// ── Match type badge ──────────────────────────────────────────
interface MatchBadgeProps {
  matchType: 'fts' | 'trigram' | null
  rank?:     number
}

export function MatchBadge({ matchType, rank }: MatchBadgeProps) {
  if (!matchType) return null

  const isFts = matchType === 'fts'

  return (
    <span
      title={isFts
        ? `Full-text search match (relevance: ${rank ? (rank * 100).toFixed(0) : '?'}%)`
        : 'Fuzzy match (similarity search)'
      }
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '3px',
        padding:      '1px 6px',
        fontSize:     '9px',
        fontWeight:   700,
        letterSpacing: '0.03em',
        borderRadius: '4px',
        background:   isFts ? '#EFF6FF' : '#FFF7ED',
        color:        isFts ? '#2563EB' : '#D97706',
        border:       `1px solid ${isFts ? '#BFDBFE' : '#FDE68A'}`,
        textTransform: 'uppercase',
        fontFamily:   "'DM Mono', monospace",
        flexShrink:   0,
      }}
    >
      {isFts ? '⚡ FTS' : '〜 Fuzzy'}
    </span>
  )
}

// ── Plain highlight: fallback when no ts_headline ─────────────
// Wraps matched portions of plain text in <mark> client-side
export function HighlightText({
  text,
  query,
  maxLength = 160,
}: {
  text:      string | null
  query:     string
  maxLength?: number
}) {
  if (!text) return null

  const truncated = text.length > maxLength
    ? text.slice(0, maxLength) + '...'
    : text

  if (!query.trim()) {
    return (
      <span style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
        {truncated}
      </span>
    )
  }

  // Simple client-side highlight for non-FTS fallback
  const parts = truncated.split(new RegExp(`(${escapeRegex(query.trim())})`, 'gi'))

  return (
    <span style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} style={{
            background: '#FEF08A', color: '#713F12',
            borderRadius: '2px', padding: '0 1px', fontWeight: 600,
          }}>
            {part}
          </mark>
        ) : part,
      )}
    </span>
  )
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}