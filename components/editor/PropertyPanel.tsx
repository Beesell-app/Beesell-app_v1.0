'use client'
// apps/web-app/components/editor/PropertyPanel.tsx
// ── Right panel: properties for selected object ───────────────
// Different controls per layer type (text vs image vs bg vs overlay)
import { useState, useEffect } from 'react'
import { useCanvasEditorStore } from '@/store/canvasEditorStore'
import { getLayerId }           from '@/lib/canvas/layers'
import { updateBackground, updateOverlay } from '@/lib/canvas/layers'
import { OVERLAY_PRESETS, AVAILABLE_FONTS } from '@/lib/canvas/fabric-config'
import type { Canvas } from 'fabric'
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react'

interface Props {
  getCanvas: () => Canvas | null
}

export function PropertyPanel({ getCanvas }: Props) {
  const { propertiesDirty } = useCanvasEditorStore()
  const [activeObj, setActiveObj] = useState<any>(null)
  const [layerId, setLayerId]     = useState<string | null>(null)

  // Re-read active object whenever selection changes
  useEffect(() => {
    const fc = getCanvas()
    if (!fc) return
    const obj = fc.getActiveObject()
    setActiveObj(obj ?? null)
    setLayerId(obj ? getLayerId(obj) : null)
  }, [propertiesDirty, getCanvas])

  if (!activeObj) {
    return <NoSelection />
  }

  // ── Text properties ─────────────────────────────────────
  if (layerId === 'text') {
    return <TextProperties obj={activeObj} getCanvas={getCanvas} />
  }

  // ── Image properties (photo / logo) ─────────────────────
  if (layerId === 'photo' || layerId === 'logo') {
    return <ImageProperties obj={activeObj} layerId={layerId} getCanvas={getCanvas} />
  }

  // ── Background ──────────────────────────────────────────
  if (layerId === 'bg') {
    return <BackgroundProperties getCanvas={getCanvas} obj={activeObj} />
  }

  // ── Overlay ─────────────────────────────────────────────
  if (layerId === 'overlay') {
    return <OverlayProperties getCanvas={getCanvas} obj={activeObj} />
  }

  return <NoSelection />
}

// ── Text properties ──────────────────────────────────────────
function TextProperties({ obj, getCanvas }: { obj: any; getCanvas: () => Canvas | null }) {
  const [text, setText]         = useState<string>(obj.text ?? '')
  const [fontSize, setFontSize] = useState<number>(obj.fontSize ?? 48)
  const [fill, setFill]         = useState<string>(typeof obj.fill === 'string' ? obj.fill : '#FFFFFF')
  const [fontFamily, setFont]   = useState<string>(obj.fontFamily ?? 'DM Sans')
  const [bold, setBold]         = useState(obj.fontWeight === 'bold')
  const [italic, setItalic]     = useState(obj.fontStyle === 'italic')
  const [align, setAlign]       = useState<string>(obj.textAlign ?? 'center')

  const apply = (patch: Record<string, any>) => {
    const fc = getCanvas()
    if (!fc) return
    const active = fc.getActiveObject()
    if (!active) return
    active.set(patch)
    fc.renderAll()
  }

  return (
    <div style={panelStyle}>
      <SectionTitle>Teks</SectionTitle>

      {/* Content */}
      <Field label="Isi Teks">
        <textarea
          value={text}
          onChange={e => {
            setText(e.target.value)
            apply({ text: e.target.value })
          }}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Field>

      {/* Font family */}
      <Field label="Font">
        <select
          value={fontFamily}
          onChange={e => {
            setFont(e.target.value)
            // Load Google Font dynamically
            const link = document.createElement('link')
            link.rel   = 'stylesheet'
            link.href  = `https://fonts.googleapis.com/css2?family=${e.target.value.replace(/ /g, '+')}&display=swap`
            document.head.appendChild(link)
            apply({ fontFamily: e.target.value })
          }}
          style={inputStyle}
        >
          {AVAILABLE_FONTS.map(f => (
            <option key={f.family} value={f.family}>{f.label}</option>
          ))}
        </select>
      </Field>

      {/* Size */}
      <Field label={`Ukuran: ${fontSize}px`}>
        <input
          type="range"
          min={12}
          max={200}
          value={fontSize}
          onChange={e => {
            const v = Number(e.target.value)
            setFontSize(v)
            apply({ fontSize: v })
          }}
          style={{ width: '100%', accentColor: '#2563EB' }}
        />
      </Field>

      {/* Style */}
      <Field label="Style">
        <div style={{ display: 'flex', gap: '4px' }}>
          <StyleBtn
            icon={<Bold size={13} />}
            active={bold}
            onClick={() => {
              const newVal = !bold
              setBold(newVal)
              apply({ fontWeight: newVal ? 'bold' : 'normal' })
            }}
          />
          <StyleBtn
            icon={<Italic size={13} />}
            active={italic}
            onClick={() => {
              const newVal = !italic
              setItalic(newVal)
              apply({ fontStyle: newVal ? 'italic' : 'normal' })
            }}
          />
          <div style={{ flex: 1 }} />
          {/* Align */}
          {[
            { icon: <AlignLeft size={13} />, value: 'left' },
            { icon: <AlignCenter size={13} />, value: 'center' },
            { icon: <AlignRight size={13} />, value: 'right' },
          ].map(a => (
            <StyleBtn
              key={a.value}
              icon={a.icon}
              active={align === a.value}
              onClick={() => {
                setAlign(a.value)
                apply({ textAlign: a.value })
              }}
            />
          ))}
        </div>
      </Field>

      {/* Color */}
      <Field label="Warna Teks">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="color"
            value={fill}
            onChange={e => {
              setFill(e.target.value)
              apply({ fill: e.target.value })
            }}
            style={{ width: '40px', height: '30px', padding: '0 2px', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={fill}
            onChange={e => {
              setFill(e.target.value)
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                apply({ fill: e.target.value })
              }
            }}
            style={{ ...inputStyle, fontFamily: "'DM Mono', monospace", flex: 1 }}
          />
        </div>
      </Field>
    </div>
  )
}

// ── Image properties ─────────────────────────────────────────
function ImageProperties({ obj, layerId, getCanvas }: { obj: any; layerId: string; getCanvas: () => Canvas | null }) {
  const [opacity, setOpacity] = useState<number>(Math.round((obj.opacity ?? 1) * 100))

  const apply = (patch: Record<string, any>) => {
    const fc = getCanvas()
    if (!fc) return
    fc.getActiveObject()?.set(patch)
    fc.renderAll()
  }

  return (
    <div style={panelStyle}>
      <SectionTitle>{layerId === 'photo' ? 'Foto Produk' : 'Logo'}</SectionTitle>

      <Field label={`Opacity: ${opacity}%`}>
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={e => {
            const v = Number(e.target.value)
            setOpacity(v)
            apply({ opacity: v / 100 })
          }}
          style={{ width: '100%', accentColor: '#2563EB' }}
        />
      </Field>

      <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
        💡 Drag untuk pindah · Resize via sudut · Shift+drag untuk disable snap
      </div>
    </div>
  )
}

// ── Background properties ─────────────────────────────────────
function BackgroundProperties({ getCanvas, obj }: { getCanvas: () => Canvas | null; obj: any }) {
  const [color, setColor] = useState<string>(
    typeof obj.fill === 'string' ? obj.fill : '#2563EB',
  )

  const QUICK_COLORS = [
    '#2563EB', '#0F172A', '#FFFFFF', '#FF5733',
    '#1DB954', '#F59E0B', '#7C3AED', '#E91E63',
  ]

  const applyColor = (c: string) => {
    setColor(c)
    const fc = getCanvas()
    if (!fc) return
    updateBackground(fc, c)
  }

  return (
    <div style={panelStyle}>
      <SectionTitle>Background</SectionTitle>

      <Field label="Warna">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {QUICK_COLORS.map(c => (
            <button
              key={c}
              onClick={() => applyColor(c)}
              style={{
                width:        '28px',
                height:       '28px',
                background:   c,
                border:       `2px solid ${color === c ? '#2563EB' : 'transparent'}`,
                borderRadius: '6px',
                cursor:       'pointer',
                boxSizing:    'border-box',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="color"
            value={color}
            onChange={e => applyColor(e.target.value)}
            style={{ width: '40px', height: '30px', padding: '0 2px', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={color}
            onChange={e => {
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) applyColor(e.target.value)
              else setColor(e.target.value)
            }}
            style={{ ...inputStyle, fontFamily: "'DM Mono', monospace", flex: 1 }}
          />
        </div>
      </Field>
    </div>
  )
}

// ── Overlay properties ────────────────────────────────────────
function OverlayProperties({ getCanvas, obj }: { getCanvas: () => Canvas | null; obj: any }) {
  const [opacity, setOpacity] = useState<number>(Math.round((obj.opacity ?? 0.4) * 100))
  const [color, setColor]     = useState<string>(typeof obj.fill === 'string' ? obj.fill : '#000000')

  const apply = (c?: string, o?: number) => {
    const fc = getCanvas()
    if (!fc) return
    updateOverlay(fc, c, o !== undefined ? o / 100 : undefined)
  }

  return (
    <div style={panelStyle}>
      <SectionTitle>Overlay</SectionTitle>

      <Field label="Preset">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {OVERLAY_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => {
                if (p.color === 'gradient_bottom') return // placeholder
                const newOp = Math.round(p.opacity * 100)
                setColor(p.color)
                setOpacity(newOp)
                apply(p.color, newOp)
              }}
              style={{
                padding:        '6px 10px',
                background:     '#fff',
                border:         '1px solid #E2E8F0',
                borderRadius:   '7px',
                cursor:         'pointer',
                fontSize:       '11px',
                fontWeight:     500,
                color:          '#334155',
                textAlign:      'left',
                fontFamily:     "'DM Sans', sans-serif",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`Opacity: ${opacity}%`}>
        <input
          type="range"
          min={0}
          max={90}
          value={opacity}
          onChange={e => {
            const v = Number(e.target.value)
            setOpacity(v)
            apply(color, v)
          }}
          style={{ width: '100%', accentColor: '#2563EB' }}
        />
      </Field>

      <Field label="Warna">
        <input
          type="color"
          value={color}
          onChange={e => {
            setColor(e.target.value)
            apply(e.target.value, opacity)
          }}
          style={{ width: '100%', height: '30px', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', padding: '0 2px' }}
        />
      </Field>
    </div>
  )
}

// ── No selection placeholder ──────────────────────────────────
function NoSelection() {
  return (
    <div style={{ padding: '20px 14px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
        Klik objek di canvas untuk edit properties
      </p>
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
      {children}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '5px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function StyleBtn({ icon, active, onClick }: { icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '28px', height: '28px',
        background:   active ? '#EFF6FF' : '#fff',
        border:       `1px solid ${active ? '#BFDBFE' : '#E2E8F0'}`,
        borderRadius: '6px',
        cursor:       'pointer',
        display:      'flex', alignItems: 'center', justifyContent: 'center',
        color:        active ? '#2563EB' : '#64748B',
        transition:   'all .12s',
      }}
    >
      {icon}
    </button>
  )
}

const panelStyle: React.CSSProperties = {
  padding:    '14px',
  fontFamily: "'DM Sans', sans-serif",
}

const inputStyle: React.CSSProperties = {
  width:       '100%',
  padding:     '7px 10px',
  border:      '1px solid #E2E8F0',
  borderRadius: '8px',
  fontSize:    '12px',
  color:       '#0F172A',
  outline:     'none',
  fontFamily:  "'DM Sans', sans-serif",
  background:  '#fff',
}