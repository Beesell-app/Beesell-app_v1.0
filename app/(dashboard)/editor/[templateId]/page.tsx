'use client'
// apps/web-app/app/(dashboard)/editor/[templateId]/page.tsx
// ── Main template editor page ─────────────────────────────────
import { use, useRef, useCallback } from 'react'
import Link from 'next/link'
import * as fabric from 'fabric'
import type { Canvas } from 'fabric'
import { ArrowLeft } from 'lucide-react'
import { useCanvasEditorStore } from '@/store/canvasEditorStore'
import { CanvasEditor, type CanvasEditorHandle } from '@/components/editor/CanvasEditor'
import { CanvasToolbar }  from '@/components/editor/CanvasToolbar'
import { LayerPanel }     from '@/components/editor/LayerPanel'
import { PropertyPanel }  from '@/components/editor/PropertyPanel'
import { addBackground, addOverlay, addProductPhoto } from '@/lib/canvas/layers'
import { CANVAS_PRESETS, DISPLAY_SCALE } from '@/lib/canvas/fabric-config'

// Preset selector (komponen kecil, inline agar tidak perlu file terpisah)
function PresetSelector() {
  const { preset, setPreset } = useCanvasEditorStore()

  return (
    <div style={{ display: 'flex', gap: '4px', padding: '6px 12px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', overflowX: 'auto' }}>
      {(Object.entries(CANVAS_PRESETS) as [string, typeof CANVAS_PRESETS[keyof typeof CANVAS_PRESETS]][]).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => setPreset(key as any)}
          style={{
            padding:        '5px 12px',
            background:     preset === key ? '#EFF6FF' : '#fff',
            border:         `1px solid ${preset === key ? '#BFDBFE' : '#E2E8F0'}`,
            borderRadius:   '7px',
            fontSize:       '11px',
            fontWeight:     preset === key ? 600 : 500,
            color:          preset === key ? '#2563EB' : '#64748B',
            cursor:         'pointer',
            fontFamily:     "'DM Sans', sans-serif",
            whiteSpace:     'nowrap',
            transition:     'all .15s',
          }}
        >
          {cfg.icon} {cfg.label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function EditorPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params)
  const editorRef      = useRef<CanvasEditorHandle>(null)
  const { preset }     = useCanvasEditorStore()

  const cfg = CANVAS_PRESETS[preset]
  const displayH = Math.round(cfg.height * DISPLAY_SCALE)

  const getCanvas = useCallback((): Canvas | null => {
    return editorRef.current?.getCanvas() ?? null
  }, [])

  // ── Called when Fabric.js canvas is ready ────────────────
  const handleCanvasReady = useCallback(async (fc: Canvas) => {
    // Add default layers
    addBackground(fc, '#2563EB', preset)
    addOverlay(fc, '#000000', 0, preset)

    // If templateId references a photo URL (e.g. from content library), load it
    if (templateId !== 'new' && templateId.startsWith('http')) {
      await addProductPhoto(fc, templateId, preset)
    }

    fc.renderAll()
  }, [preset, templateId])

  // ── Upload product photo to canvas ───────────────────────
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fc = getCanvas()
    if (!fc) return

    const url = URL.createObjectURL(file)
    await addProductPhoto(fc, url, preset)
    fc.renderAll()
    URL.revokeObjectURL(url)
    e.target.value = ''
  }, [getCanvas, preset])

  return (
    <div style={{
      display:    'flex',
      flexDirection: 'column',
      height:     '100vh',
      background: '#F8FAFC',
      fontFamily: "'DM Sans', sans-serif",
      overflow:   'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
        padding:      '10px 16px',
        background:   '#fff',
        borderBottom: '1px solid #E2E8F0',
        zIndex:       10,
      }}>
        <Link href="/content/new" style={{
          display:    'inline-flex', alignItems: 'center', gap: '6px',
          fontSize:   '12px', color: '#64748B', textDecoration: 'none',
        }}>
          <ArrowLeft size={13} /> Kembali
        </Link>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
            Template Editor
          </h1>
          <p style={{ fontSize: '11px', color: '#94A3B8' }}>
            {cfg.label} · {cfg.width}×{cfg.height}px
          </p>
        </div>

        {/* Upload foto produk shortcut */}
        <label style={{
          display:      'inline-flex', alignItems: 'center', gap: '6px',
          padding:      '7px 14px',
          background:   '#F1F5F9', border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize:     '12px', fontWeight: 500, color: '#475569',
          cursor:       'pointer',
        }}>
          📷 Upload Foto Produk
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
        </label>
      </div>

      {/* ── Preset selector ──────────────────────────────── */}
      <PresetSelector />

      {/* ── Main layout: Left panel | Canvas | Right panel ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Layers + toolbar */}
        <aside style={{
          width:        '220px',
          background:   '#fff',
          borderRight:  '1px solid #E2E8F0',
          display:      'flex',
          flexDirection: 'column',
          overflow:     'hidden',
        }}>
          <CanvasToolbar editorRef={editorRef as any} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
            <LayerPanel getCanvas={getCanvas} />
          </div>
        </aside>

        {/* Center: Canvas */}
        <main style={{
          flex:           1,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          overflow:       'auto',
          padding:        '24px',
          background:     'repeating-conic-gradient(#F1F5F9 0% 25%, #fff 0% 50%) 0 0 / 20px 20px',
        }}>
          <CanvasEditor
            ref={editorRef}
            preset={preset}
            onReady={handleCanvasReady}
          />
        </main>

        {/* Right: Property panel */}
        <aside style={{
          width:        '220px',
          background:   '#fff',
          borderLeft:   '1px solid #E2E8F0',
          overflowY:    'auto',
        }}>
          <div style={{
            padding:      '12px 10px',
            borderBottom: '1px solid #F1F5F9',
            fontSize:     '11px',
            fontWeight:   700,
            color:        '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Properties
          </div>
          <PropertyPanel getCanvas={getCanvas} />
        </aside>
      </div>
    </div>
  )
}