'use client'
// apps/web-app/app/(dashboard)/editor/page.tsx
// ── Gallery page: pilih template → buka editor ───────────────
import { useRouter } from 'next/navigation'
import Link          from 'next/link'
import { Plus, Layers } from 'lucide-react'
import { TemplateGallery } from '@/components/editor/TemplateGallery'

export default function EditorGalleryPage() {
  const router = useRouter()

  const handleSelect = (templateId: string) => {
    router.push(`/editor/${templateId}`)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-end',
        marginBottom:   '24px',
        flexWrap:       'wrap',
        gap:            '14px',
      }}>
        <div>
          <h1 style={{
            fontFamily:    "'Fraunces', serif",
            fontSize:      '28px',
            fontWeight:    600,
            color:         '#0F172A',
            letterSpacing: '-0.02em',
            marginBottom:  '4px',
          }}>
            Template Desain
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Pilih template siap pakai, lalu edit sesuai produk kamu
          </p>
        </div>

        {/* Blank canvas CTA */}
        <Link
          href="/editor/new"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '6px',
            padding:        '10px 18px',
            background:     '#fff',
            border:         '1px solid #E2E8F0',
            borderRadius:   '10px',
            fontSize:       '13px',
            fontWeight:     500,
            color:          '#475569',
            textDecoration: 'none',
            transition:     'all .15s',
          }}
        >
          <Plus size={14} /> Mulai dari Nol
        </Link>
      </div>

      {/* ── Quick actions ──────────────────────────── */}
      <div style={{
        display:      'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap:          '10px',
        marginBottom: '28px',
      }}>
        {QUICK_LINKS.map(ql => (
          <Link
            key={ql.href}
            href={ql.href}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '10px',
              padding:        '14px 16px',
              background:     '#fff',
              border:         '1px solid #E2E8F0',
              borderRadius:   '12px',
              textDecoration: 'none',
              color:          '#334155',
              fontSize:       '13px',
              fontWeight:     500,
              transition:     'all .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#BFDBFE'
              e.currentTarget.style.background  = '#F8FAFF'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E2E8F0'
              e.currentTarget.style.background  = '#fff'
            }}
          >
            <span style={{ fontSize: '18px' }}>{ql.icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '1px' }}>{ql.label}</p>
              <p style={{ fontSize: '10px', color: '#94A3B8' }}>{ql.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Template gallery ───────────────────────── */}
      <TemplateGallery onSelect={handleSelect} />
    </div>
  )
}

const QUICK_LINKS = [
  {
    href:  '/editor/new?preset=instagram_feed',
    icon:  '📷',
    label: 'Instagram Feed',
    desc:  '1080×1080 · Square',
  },
  {
    href:  '/editor/new?preset=instagram_story',
    icon:  '🎬',
    label: 'Instagram Story',
    desc:  '1080×1920 · 9:16',
  },
  {
    href:  '/editor/new?preset=tiktok',
    icon:  '🎵',
    label: 'TikTok',
    desc:  '1080×1920 · 9:16',
  },
  {
    href:  '/editor/new?preset=shopee_banner',
    icon:  '🛒',
    label: 'Shopee Banner',
    desc:  '800×400 · Landscape',
  },
]