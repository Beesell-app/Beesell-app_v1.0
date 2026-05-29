'use client'
// apps/web-app/components/brand-kit/BrandKitSelector.tsx
// ── Brand kit toggle untuk ConfigPanel ────────────────────────
// Tampil di atas ConfigPanel.
// Kalau brand kit active → auto-inject tone/language/keywords ke form store.
// Toggle off → revert ke nilai sebelumnya.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronDown, ChevronUp, Settings, Check, X } from 'lucide-react'
import { useContentCreatorStore }  from '@/store/contentCreatorStore'
import { useBrandKitList, useDefaultBrandKit } from '@/lib/hooks/useBrandKit'
import type { BrandKit } from '@/lib/hooks/useBrandKit'
import { BrandKitPreview } from './BrandKitPreview'

export function BrandKitSelector() {
  const { data: kits = [], isLoading } = useBrandKitList()
  const defaultKit = useDefaultBrandKit()

  // Store actions
  
  const brandKitEnabled    = (useContentCreatorStore as any)((s: any) => s.brandKitEnabled ?? true)
  const activeBrandKitId   = (useContentCreatorStore as any)((s: any) => s.activeBrandKitId ?? null)
  const setBrandKitEnabled  = (useContentCreatorStore as any)((s: any) => s.setBrandKitEnabled)
  const setActiveBrandKitId = (useContentCreatorStore as any)((s: any) => s.setActiveBrandKitId)
  const applyBrandKit       = (useContentCreatorStore as any)((s: any) => s.applyBrandKit)
  const clearBrandKit       = (useContentCreatorStore as any)((s: any) => s.clearBrandKit)

  // Persist previous values to restore on toggle-off
  const setTone            = useContentCreatorStore((s: any) => s.setTone)
  const setLanguage        = useContentCreatorStore((s: any) => s.setLanguage)
  const setBrandKeywords   = useContentCreatorStore((s: any) => s.setBrandKeywords)
  const setAvoidWords      = useContentCreatorStore((s: any) => s.setAvoidWords)

  const [expanded, setExpanded] = useState(false)
  const activeKit = kits.find(k => k.id === activeBrandKitId) ?? defaultKit

  // Auto-apply default brand kit on first load
  useEffect(() => {
    if (!defaultKit || activeBrandKitId !== null) return
    if (brandKitEnabled) {
      applyBrandKit(defaultKit)
    }
  }, [defaultKit?.id])

  // Apply / unapply when toggle changes
  const handleToggle = () => {
    const newEnabled = !brandKitEnabled
    setBrandKitEnabled(newEnabled)

    if (newEnabled && activeKit) {
      injectKitValues(activeKit)
    } else {
      clearBrandKit?.()
    }
  }

  const injectKitValues = (kit: BrandKit) => {
    setTone(kit.defaultTone as any)
    setLanguage(kit.defaultLanguage as any)
    setBrandKeywords(kit.brandKeywords ?? '')
    setAvoidWords(kit.avoidWords ?? '')
    setActiveBrandKitId(kit.id)
    applyBrandKit?.(kit)
  }

  const handleSelectKit = (kit: BrandKit) => {
    injectKitValues(kit)
    setExpanded(false)
  }

  if (isLoading) return null
  if (kits.length === 0) {
    return (
      <div style={{
        padding:      '10px 12px',
        background:   '#F8FAFC',
        borderRadius: '10px',
        border:       '1px dashed #CBD5E1',
        marginBottom: '16px',
        fontFamily:   "'DM Sans', sans-serif",
      }}>
        <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px' }}>
          Belum ada brand kit
        </p>
        <Link
          href="/settings/brand-kit"
          style={{
            fontSize:       '11px',
            fontWeight:     600,
            color:          '#2563EB',
            textDecoration: 'none',
          }}
        >
          + Buat Brand Kit →
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      marginBottom: '16px',
      fontFamily:   "'DM Sans', sans-serif",
    }}>
      {/* ── Toggle row ──────────────────────────────── */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
        padding:      '10px 12px',
        background:   brandKitEnabled ? 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' : '#F8FAFC',
        borderRadius: expanded ? '10px 10px 0 0' : '10px',
        border:       `1px solid ${brandKitEnabled ? '#BFDBFE' : '#E2E8F0'}`,
        borderBottom: expanded ? 'none' : undefined,
        cursor:       'pointer',
        transition:   'all .15s',
      }}
      onClick={() => setExpanded(!expanded)}
      >
        <Sparkles size={14} color={brandKitEnabled ? '#2563EB' : '#94A3B8'} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize:   '12px',
            fontWeight: 700,
            color:      brandKitEnabled ? '#1E3A8A' : '#475569',
            marginBottom: '1px',
          }}>
            Brand Kit
          </p>
          <p style={{
            fontSize: '10px',
            color:    brandKitEnabled ? '#3B82F6' : '#94A3B8',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {brandKitEnabled && activeKit ? activeKit.name : 'Nonaktif'}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          onClick={e => { e.stopPropagation(); handleToggle() }}
          style={{
            width:        '36px',
            height:       '20px',
            borderRadius: '99px',
            background:   brandKitEnabled ? '#2563EB' : '#CBD5E1',
            border:       'none',
            cursor:       'pointer',
            position:     'relative',
            flexShrink:   0,
            transition:   'background .2s',
          }}
        >
          <span style={{
            position:   'absolute',
            top:        '2px',
            left:       brandKitEnabled ? '18px' : '2px',
            width:      '16px',
            height:     '16px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left .2s',
            boxShadow:  '0 1px 3px rgba(0,0,0,.2)',
          }} />
        </button>

        {expanded ? <ChevronUp size={13} color="#64748B" /> : <ChevronDown size={13} color="#64748B" />}
      </div>

      {/* ── Kit selector dropdown ──────────────────── */}
      {expanded && (
        <div style={{
          border:       '1px solid #BFDBFE',
          borderTop:    'none',
          borderRadius: '0 0 10px 10px',
          background:   '#fff',
          padding:      '10px',
        }}>
          <p style={{
            fontSize:     '10px',
            fontWeight:   700,
            color:        '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}>
            Pilih Kit
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {kits.map(kit => {
              const isActive = kit.id === activeKit?.id

              return (
                <button
                  key={kit.id}
                  onClick={() => handleSelectKit(kit)}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            '10px',
                    padding:        '8px 10px',
                    background:     isActive ? '#EFF6FF' : '#F8FAFC',
                    border:         `1px solid ${isActive ? '#2563EB' : '#E2E8F0'}`,
                    borderRadius:   '8px',
                    cursor:         'pointer',
                    textAlign:      'left',
                    fontFamily:     "'DM Sans', sans-serif",
                    transition:     'all .12s',
                  }}
                >
                  {/* Color swatches */}
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[kit.primaryColor, kit.secondaryColor, kit.accentColor].map((c, i) => (
                      <div key={i} style={{
                        width:        '12px',
                        height:       '12px',
                        borderRadius: '50%',
                        background:   c,
                        border:       '1px solid rgba(255,255,255,.7)',
                        boxShadow:    '0 0 0 1px #E2E8F0',
                      }} />
                    ))}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                      {kit.name}
                      {kit.isDefault && (
                        <span style={{ marginLeft: '6px', fontSize: '9px', background: '#DBEAFE', color: '#1E40AF', padding: '1px 5px', borderRadius: '3px' }}>
                          Default
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: '10px', color: '#64748B' }}>
                      {kit.primaryFont} · {kit.defaultTone}
                    </p>
                  </div>

                  {isActive && brandKitEnabled && (
                    <Check size={13} color="#2563EB" />
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '8px', paddingTop: '8px' }}>
            <Link
              href="/settings/brand-kit"
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '5px',
                fontSize:       '11px',
                fontWeight:     600,
                color:          '#2563EB',
                textDecoration: 'none',
              }}
            >
              <Settings size={11} /> Kelola Brand Kit →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}