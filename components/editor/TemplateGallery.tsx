'use client'
// apps/web-app/components/editor/TemplateGallery.tsx
// ── Template gallery: category tabs + SVG thumbnail grid ──────
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import type { TemplateCategory } from '@/lib/canvas/templates'

// API response type
interface TemplateItem {
  id:            string
  name:          string
  description:   string
  category:      string
  categoryLabel: string
  canvas:        { width: number; height: number }
  palette:       { primary: string; secondary: string; bg: string; text: string; accent: string }
  thumbnailSvg:  string
  tags:          string[]
}

interface CategoryItem {
  value: string
  label: string
  count: number
}

interface Props {
  onSelect?: (templateId: string) => void
}

// ── Fetch templates from API ──────────────────────────────────
async function fetchTemplates(category?: string): Promise<{ templates: TemplateItem[]; categories: CategoryItem[] }> {
  const url = category ? `/api/templates?category=${category}` : '/api/templates'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch templates')
  const data = await res.json()
  return data
}

export function TemplateGallery({ onSelect }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery,    setSearchQuery]    = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey:  ['templates', activeCategory],
    queryFn:   () => fetchTemplates(activeCategory === 'all' ? undefined : activeCategory),
    staleTime: 5 * 60_000,   // 5 min cache
  })

  const templates = data?.templates ?? []
  const categories = data?.categories ?? []

  // Client-side search filter
  const filtered = searchQuery
    ? templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : templates

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Search bar ─────────────────────────────── */}
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <Search
          size={15}
          color="#94A3B8"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari template..."
          style={{
            width:        '100%',
            padding:      '10px 14px 10px 36px',
            background:   '#F8FAFC',
            border:       '1px solid #E2E8F0',
            borderRadius: '10px',
            fontSize:     '13px',
            outline:      'none',
            fontFamily:   "'DM Sans', sans-serif",
          }}
        />
      </div>

      {/* ── Category tabs ──────────────────────────── */}
      <div style={{
        display:      'flex',
        gap:          '4px',
        marginBottom: '20px',
        overflowX:    'auto',
        paddingBottom: '4px',
      }}>
        <CategoryTab
          label="Semua"
          count={data?.categories?.reduce((s, c) => s + c.count, 0) ?? 0}
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {categories.map(cat => (
          <CategoryTab
            key={cat.value}
            label={cat.label}
            count={cat.count}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {/* ── Loading ────────────────────────────────── */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2 size={20} color="#2563EB" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '10px' }}>Memuat templates...</p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────── */}
      {error && (
        <div style={{ padding: '20px', background: '#FEF2F2', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#DC2626' }}>Gagal memuat templates. Coba refresh.</p>
        </div>
      )}

      {/* ── Empty search ──────────────────────────── */}
      {!isLoading && filtered.length === 0 && !error && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Tidak ada template yang cocok
          </p>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            Coba kata kunci lain
          </p>
        </div>
      )}

      {/* ── Template grid ─────────────────────────── */}
      {!isLoading && filtered.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────
function TemplateCard({ template, onSelect }: { template: TemplateItem; onSelect?: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)

  // Calculate thumbnail height for aspect ratio
  const aspect = template.canvas.height / template.canvas.width
  const thumbW = 240
  const thumbH = Math.min(Math.round(thumbW * aspect), 280)   // cap height

  return (
    <div
      onClick={() => onSelect?.(template.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   '#fff',
        border:       `1px solid ${hovered ? '#2563EB' : '#E2E8F0'}`,
        borderRadius: '14px',
        overflow:     'hidden',
        cursor:       'pointer',
        transition:   'all .2s ease',
        boxShadow:    hovered ? '0 8px 24px rgba(37,99,235,.15)' : '0 1px 4px rgba(15,23,42,.06)',
        transform:    hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* SVG thumbnail */}
      <div style={{
        background:    '#F8FAFC',
        position:      'relative',
        overflow:      'hidden',
        display:       'flex',
        alignItems:    'center',
        justifyContent: 'center',
        padding:       '10px',
        height:        `${thumbH}px`,
      }}>
        <div
          dangerouslySetInnerHTML={{ __html: template.thumbnailSvg }}
          style={{
            maxWidth:   '100%',
            maxHeight:  `${thumbH - 20}px`,
            borderRadius: '6px',
            overflow:   'hidden',
            boxShadow:  '0 2px 8px rgba(15,23,42,.12)',
          }}
        />

        {/* Hover overlay */}
        {hovered && (
          <div style={{
            position:   'absolute',
            inset:      0,
            background: 'rgba(37,99,235,.08)',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              padding:      '8px 18px',
              background:   '#2563EB',
              color:        '#fff',
              borderRadius: '8px',
              fontSize:     '13px',
              fontWeight:   700,
              boxShadow:    '0 4px 14px rgba(37,99,235,.35)',
            }}>
              Gunakan Template
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h3 style={{
            fontSize:   '13px',
            fontWeight: 700,
            color:      '#0F172A',
            margin:     0,
          }}>
            {template.name}
          </h3>
          <span style={{
            fontSize:   '10px',
            fontWeight: 600,
            color:      '#2563EB',
            background: '#EFF6FF',
            padding:    '2px 7px',
            borderRadius: '5px',
            whiteSpace: 'nowrap',
          }}>
            {template.canvas.width}×{template.canvas.height}
          </span>
        </div>

        <p style={{
          fontSize:   '11px',
          color:      '#64748B',
          margin:     '0 0 8px',
          lineHeight: 1.4,
          display:    '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow:   'hidden',
        }}>
          {template.description}
        </p>

        {/* Color palette */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[template.palette.primary, template.palette.secondary, template.palette.accent].map((c, i) => (
            <div key={i} style={{
              width:        '14px',
              height:       '14px',
              borderRadius: '50%',
              background:   c,
              border:       '1.5px solid #fff',
              boxShadow:    '0 0 0 1px #E2E8F0',
            }} />
          ))}
          <span style={{ fontSize: '10px', color: '#94A3B8', marginLeft: '4px' }}>
            {template.categoryLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Category tab ──────────────────────────────────────────────
function CategoryTab({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      '7px 14px',
        background:   active ? '#EFF6FF' : '#fff',
        border:       `1px solid ${active ? '#2563EB' : '#E2E8F0'}`,
        borderRadius: '8px',
        fontSize:     '12px',
        fontWeight:   active ? 700 : 500,
        color:        active ? '#2563EB' : '#64748B',
        cursor:       'pointer',
        whiteSpace:   'nowrap',
        fontFamily:   "'DM Sans', sans-serif",
        transition:   'all .15s',
        display:      'flex',
        gap:          '5px',
        alignItems:   'center',
      }}
    >
      {label}
      {count > 0 && (
        <span style={{
          fontSize:   '10px',
          background: active ? '#DBEAFE' : '#F1F5F9',
          color:      active ? '#1E40AF' : '#64748B',
          padding:    '1px 6px',
          borderRadius: '4px',
        }}>
          {count}
        </span>
      )}
    </button>
  )
}