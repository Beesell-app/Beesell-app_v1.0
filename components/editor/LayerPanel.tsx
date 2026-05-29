'use client'
// apps/web-app/components/editor/LayerPanel.tsx
// ── Layer panel: visibility/lock + add text/logo controls ────
import { useRef }    from 'react'
import { Eye, EyeOff, Lock, Unlock, Plus, Upload } from 'lucide-react'
import { useCanvasEditorStore }  from '@/store/canvasEditorStore'
import { LAYER_IDS, LAYER_CONFIG, TEXT_PRESETS, type TextPreset } from '@/lib/canvas/fabric-config'
import {
  setLayerVisibility, setLayerLock, addTextElement, addLogoElement,
} from '@/lib/canvas/layers'
import type { Canvas } from 'fabric'

interface Props {
  getCanvas: () => Canvas | null
}

export function LayerPanel({ getCanvas }: Props) {
  const {
    layers, setLayerVisible, setLayerLocked, setActivePanelTab,
  } = useCanvasEditorStore()

  const logoInputRef = useRef<HTMLInputElement>(null)

  const toggleVisibility = (id: typeof LAYER_IDS[number]) => {
    const fc = getCanvas()
    const newVisible = !layers[id].visible
    if (fc) setLayerVisibility(fc, id, newVisible)
    setLayerVisible(id, newVisible)
  }

  const toggleLock = (id: typeof LAYER_IDS[number]) => {
    const fc = getCanvas()
    const newLocked = !layers[id].locked
    if (fc) setLayerLock(fc, id, newLocked)
    setLayerLocked(id, newLocked)
  }

  const handleAddText = (preset: TextPreset) => {
    const fc = getCanvas()
    if (!fc) return

    const { canvasWidth, canvasHeight } = useCanvasEditorStore.getState()
    addTextElement(fc, preset, undefined, canvasWidth, canvasHeight)
    fc.renderAll()
    setActivePanelTab('text')
  }

  const handleAddLogo = async (file: File) => {
    const fc = getCanvas()
    if (!fc) return

    const url    = URL.createObjectURL(file)
    const { canvasWidth, canvasHeight } = useCanvasEditorStore.getState()

    await addLogoElement(fc, url, canvasWidth, canvasHeight)
    fc.renderAll()

    // Revoke local object URL after loaded
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Layer list */}
      <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Layer
        </p>

        {[...LAYER_IDS].reverse().map(id => {
          const cfg   = LAYER_CONFIG[id]
          const state = layers[id]

          return (
            <div
              key={id}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '8px',
                padding:        '6px 8px',
                borderRadius:   '8px',
                marginBottom:   '2px',
                background:     '#fff',
                border:         '1px solid #E2E8F0',
                opacity:        state.visible ? 1 : 0.5,
                transition:     'opacity .15s',
              }}
            >
              <span style={{ fontSize: '14px' }}>{cfg.icon}</span>
              <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                {cfg.label}
              </span>

              {/* Visibility toggle */}
              <button
                onClick={() => toggleVisibility(id)}
                style={iconBtnStyle}
                title={state.visible ? 'Sembunyikan' : 'Tampilkan'}
              >
                {state.visible
                  ? <Eye size={13} color="#64748B" />
                  : <EyeOff size={13} color="#CBD5E1" />
                }
              </button>

              {/* Lock toggle */}
              {cfg.lockable && (
                <button
                  onClick={() => toggleLock(id)}
                  style={iconBtnStyle}
                  title={state.locked ? 'Unlock' : 'Lock'}
                >
                  {state.locked
                    ? <Lock size={13} color="#F59E0B" />
                    : <Unlock size={13} color="#CBD5E1" />
                  }
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add text presets */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Tambah Teks
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {(Object.entries(TEXT_PRESETS) as [TextPreset, typeof TEXT_PRESETS[TextPreset]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => handleAddText(key)}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '8px',
                padding:        '7px 10px',
                background:     '#fff',
                border:         '1px solid #E2E8F0',
                borderRadius:   '8px',
                cursor:         'pointer',
                textAlign:      'left',
                fontFamily:     "'DM Sans', sans-serif",
                transition:     'all .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#BFDBFE'
                e.currentTarget.style.background  = '#EFF6FF'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0'
                e.currentTarget.style.background  = '#fff'
              }}
            >
              <Plus size={12} color="#2563EB" />
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                {cfg.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Add logo */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Upload Logo
        </p>

        <button
          onClick={() => logoInputRef.current?.click()}
          style={{
            width:          '100%',
            display:        'flex',
            alignItems:     'center',
            gap:            '8px',
            justifyContent: 'center',
            padding:        '10px',
            background:     '#F8FAFC',
            border:         '1.5px dashed #CBD5E1',
            borderRadius:   '9px',
            cursor:         'pointer',
            fontFamily:     "'DM Sans', sans-serif",
            fontSize:       '12px',
            fontWeight:     500,
            color:          '#64748B',
            transition:     'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#CBD5E1'}
        >
          <Upload size={13} /> Upload Logo
        </button>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/webp"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleAddLogo(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width:          '24px',
  height:         '24px',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  background:     'transparent',
  border:         'none',
  cursor:         'pointer',
  borderRadius:   '4px',
  padding:        0,
  transition:     'background .12s',
}