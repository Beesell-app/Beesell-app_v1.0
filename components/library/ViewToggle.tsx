'use client'
// apps/web-app/components/library/ViewToggle.tsx
// Grid/List view switcher dengan localStorage persist + keyboard shortcut
import { LayoutGrid, List } from 'lucide-react'
import type { ViewMode } from '@/lib/library-types'

interface Props {
  value:    ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div style={{
      display: 'inline-flex',
      background: '#F1F5F9',
      borderRadius: '8px',
      padding: '3px',
      gap: '2px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <ToggleButton
        active={value === 'grid'}
        onClick={() => onChange('grid')}
        icon={<LayoutGrid size={13} />}
        label="Grid"
        kbd="G"
      />
      <ToggleButton
        active={value === 'list'}
        onClick={() => onChange('list')}
        icon={<List size={13} />}
        label="List"
        kbd="L"
      />
    </div>
  )
}

function ToggleButton({ active, onClick, icon, label, kbd }: {
  active:  boolean
  onClick: () => void
  icon:    React.ReactNode
  label:   string
  kbd?:    string
}) {
  return (
    <button
      onClick={onClick}
      title={kbd ? `${label} (${kbd})` : label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        background: active ? '#fff' : 'transparent',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        color: active ? '#0F172A' : '#64748B',
        cursor: 'pointer',
        boxShadow: active ? '0 1px 3px rgba(15,23,42,.08)' : 'none',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all .15s',
      }}
    >
      {icon}
      {label}
    </button>
  )
}