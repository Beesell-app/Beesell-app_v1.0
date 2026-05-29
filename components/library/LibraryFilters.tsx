'use client'
// apps/web-app/components/library/LibraryFilters.tsx
// Sidebar filter panel: type, status, platform, sort
import { useState } from 'react'
import { X, ChevronDown, Filter, RotateCcw } from 'lucide-react'
import {
  TYPE_OPTIONS, STATUS_OPTIONS, PLATFORM_OPTIONS, SORT_OPTIONS,
} from '@/lib/library-types'
import type { LibraryFilters } from '@/lib/library-types'

interface FilterOptionItem {
  emoji?: string
  label: string
  value: string
}

interface Props {
  filters: LibraryFilters
  setFilter: (key: keyof LibraryFilters, value: string) => void
  clearFilters: () => void
  activeFiltersCount: number
}

export function LibraryFilters({ filters, setFilter, clearFilters, activeFiltersCount }: Props) {
  const [collapsed, setCollapsed] = useState({
    type:     false,
    status:   false,
    platform: false,
    sort:     false,
  })

  const toggleSection = (key: keyof typeof collapsed) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }
  
  const typeOptions: FilterOptionItem[] = [
  {
    emoji: '📦',
    label: 'Semua',
    value: 'all',
  },
  {
    emoji: '🖼️',
    label: 'Image',
    value: 'image',
  },
  {
    emoji: '🎬',
    label: 'Video',
    value: 'video',
  },
]
  return (
    <aside style={{
      width: '220px',
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: '14px',
      padding: '14px',
      fontFamily: "'DM Sans', sans-serif",
      flexShrink: 0,
      alignSelf: 'flex-start',
      position: 'sticky',
      top: '14px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        paddingBottom: '10px',
        borderBottom: '1px solid #F1F5F9',
      }}>
        <h2 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <Filter size={13} />
          Filter
          {activeFiltersCount > 0 && (
            <span style={{
              padding: '1px 6px',
              background: '#2563EB',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '99px',
              fontFamily: "'DM Mono', monospace",
            }}>
              {activeFiltersCount}
            </span>
          )}
        </h2>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            title="Clear all (Esc)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '5px',
              fontSize: '10px',
              color: '#64748B',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>

      

      {/* Type filter */}
      <FilterSection
        title="Tipe"
        collapsed={collapsed.type}
        onToggle={() => toggleSection('type')}
      >
        {TYPE_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={`${opt.emoji} ${opt.label}`}
            value={opt.value}
            active={filters.type === opt.value}
            onClick={() => setFilter('type', opt.value)}
          />
        ))}
      </FilterSection>

      {/* Status filter */}
      <FilterSection
        title="Status"
        collapsed={collapsed.status}
        onToggle={() => toggleSection('status')}
      >
        {STATUS_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={opt.label}
            value={opt.value}
            active={filters.status === opt.value}
            onClick={() => setFilter('status', opt.value)}
            dotColor={opt.color}
          />
        ))}
      </FilterSection>

      {/* Platform filter */}
      <FilterSection
        title="Platform"
        collapsed={collapsed.platform}
        onToggle={() => toggleSection('platform')}
      >
        {PLATFORM_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={opt.label}
            value={opt.value}
            active={filters.platform === opt.value}
            onClick={() => setFilter('platform', opt.value)}
          />
        ))}
      </FilterSection>

      {/* Sort */}
      <FilterSection
        title="Urutan"
        collapsed={collapsed.sort}
        onToggle={() => toggleSection('sort')}
      >
        {SORT_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={opt.label}
            value={opt.value}
            active={filters.sort === opt.value}
            onClick={() => setFilter('sort', opt.value)}
          />
        ))}
      </FilterSection>
    </aside>
  )
}

// ── Sub-components ─────────────────────────────────────────
function FilterSection({ title, collapsed, onToggle, children }: {
  title:     string
  collapsed: boolean
  onToggle:  () => void
  children:  React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {title}
        <ChevronDown
          size={12}
          style={{
            transition: 'transform .2s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)',
          }}
        />
      </button>

      {!collapsed && (
        <div style={{ marginTop: '6px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FilterOption({ label, value, active, onClick, dotColor }: {
  label:    string
  value:    string
  active:   boolean
  onClick:  () => void
  dotColor?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        background: active ? '#EFF6FF' : 'transparent',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        color: active ? '#1E3A8A' : '#475569',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        marginBottom: '1px',
        transition: 'background .15s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F8FAFC' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {dotColor && (
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }} />
      )}
      {label}
    </button>
  )
}