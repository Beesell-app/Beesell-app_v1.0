'use client'
// apps/web-app/components/creator/InputModeTabs.tsx
// Tab navigation: URL / Foto / Manual
// Mobile responsive — auto compact di layar sempit
import { useContentCreatorStore } from '@/store/contentCreatorStore'
import type { InputMode } from '@/store/contentCreatorStore'
import { Link2, Image as ImageIcon, Type } from 'lucide-react'

interface TabConfig {
  value:    InputMode
  label:    string
  icon:     React.ReactNode
  desc:     string
  badge?:   string
}

const TABS: TabConfig[] = [
  { value: 'url',    label: 'Link Produk', icon: <Link2 size={16} />,      desc: 'Auto-extract dari Shopee/Tokopedia/Lazada' },
  { value: 'photo',  label: 'Upload Foto', icon: <ImageIcon size={16} />,  desc: 'AI baca foto produk kamu', badge: 'Segera' },
  { value: 'manual', label: 'Manual',      icon: <Type size={16} />,       desc: 'Input nama + benefit sendiri' },
]

export function InputModeTabs() {
  const mode    = useContentCreatorStore(s => s.mode)
  const setMode = useContentCreatorStore(s => s.setMode)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
      gap: '6px',
      padding: '5px',
      background: '#F1F5F9',
      borderRadius: '12px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {TABS.map(tab => {
        const active = mode === tab.value
        const disabled = !!tab.badge

        return (
          <button
            key={tab.value}
            onClick={() => !disabled && setMode(tab.value)}
            disabled={disabled}
            style={{
              padding: '10px 12px',
              background: active ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: '9px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontFamily: "'DM Sans', sans-serif",
              opacity: disabled ? 0.5 : 1,
              boxShadow: active ? '0 1px 3px rgba(15,23,42,.08)' : 'none',
              transition: 'all .15s',
              position: 'relative',
            }}
            title={tab.desc}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: active ? '#2563EB' : '#64748B' }}>{tab.icon}</span>
              <span style={{
                fontSize: '13px',
                fontWeight: active ? 600 : 500,
                color: active ? '#0F172A' : '#475569',
              }} className="tab-label-desktop">
                {tab.label}
              </span>
            </div>

            {tab.badge && (
              <span style={{
                fontSize: '9px', fontWeight: 600,
                background: '#FEF3C7', color: '#92400E',
                padding: '1px 6px', borderRadius: '4px',
                letterSpacing: '0.02em',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}

      <style>{`
        @media (max-width: 480px) {
          .tab-label-desktop { display: none; }
        }
      `}</style>
    </div>
  )
}