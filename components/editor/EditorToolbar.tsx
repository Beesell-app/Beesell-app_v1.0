'use client'
// apps/web-app/components/editor/EditorToolbar.tsx
// v3: Replace simple Download PNG button dengan DownloadButton (canvas mode)
// User dapat pilih PNG/JPG, ukuran, dan opsi save to library
import * as fabric from 'fabric'
import Link from 'next/link'
import { useEditorStore } from '@/store/editorStore'
import { BrandKitToggle } from './BrandKitToggle'
import { DownloadButton } from '@/components/jobs/DownloadButton'
import {
  ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Grid, Save,
} from 'lucide-react'

interface Props {
  canvas: fabric.Canvas | null
  onSave?: () => Promise<void>
  isSaving?: boolean
  onUndo:   () => void
  onRedo:   () => void
  canUndo:  boolean
  canRedo:  boolean
}

export function EditorToolbar({ canvas, onSave, isSaving, onUndo, onRedo, canUndo, canRedo }: Props) {
  const zoom        = useEditorStore(s => s.zoom)
  const setZoom     = useEditorStore(s => s.setZoom)
  const showGrid    = useEditorStore(s => s.showGrid)
  const toggleGrid  = useEditorStore(s => s.toggleGrid)

  // ── Get HTMLCanvasElement dari Fabric (untuk DownloadButton canvas mode) ──
  // Fabric v6: canvas.getElement() returns lower canvas; tapi kita perlu yang punya semua objects
  // Pakai canvas.toCanvasElement() untuk dapat snapshot full
  const getCanvasElement = (): HTMLCanvasElement | undefined => {
    if (!canvas) return undefined
    // toCanvasElement: render semua objects ke fresh canvas (multiplier 1 = original size)
    return canvas.toCanvasElement(1) as HTMLCanvasElement
  }

  return (
    <header style={{
      height: '52px',
      background: '#fff',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '8px',
      fontFamily: "'DM Sans', sans-serif",
      flexShrink: 0,
    }}>

      <Link href="/dashboard" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: '#64748B',
        textDecoration: 'none',
        padding: '6px 10px',
        borderRadius: '6px',
      }}>
        <ArrowLeft size={13} />
        Kembali
      </Link>

      <Divider />

      <ToolbarButton icon={<Undo2 size={14} />} onClick={onUndo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)" />
      <ToolbarButton icon={<Redo2 size={14} />} onClick={onRedo} disabled={!canRedo} tooltip="Redo (Ctrl+Y)" />

      <Divider />

      <ToolbarButton
        icon={<ZoomOut size={14} />}
        onClick={() => setZoom(zoom - 0.1)}
        disabled={zoom <= 0.2}
        tooltip="Zoom out"
      />

      <span style={{
        fontSize: '11px',
        color: '#64748B',
        fontFamily: "'DM Mono', monospace",
        padding: '0 6px',
        minWidth: '46px',
        textAlign: 'center',
        cursor: 'pointer',
      }} onClick={() => setZoom(0.6)} title="Reset zoom">
        {Math.round(zoom * 100)}%
      </span>

      <ToolbarButton
        icon={<ZoomIn size={14} />}
        onClick={() => setZoom(zoom + 0.1)}
        disabled={zoom >= 3}
        tooltip="Zoom in"
      />

      <Divider />

      <ToolbarButton
        icon={<Grid size={14} />}
        onClick={toggleGrid}
        active={showGrid}
        tooltip="Toggle grid"
      />

      <Divider />

      {/* Brand Kit Toggle */}
      <BrandKitToggle canvas={canvas} />

      <div style={{ flex: 1 }} />

      {/* Save */}
      {onSave && (
        <button
          onClick={() => onSave()}
          disabled={isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 12px',
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '7px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#475569',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          <Save size={13} />
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </button>
      )}

      {/* Download dengan format/size + save to library */}
      <DownloadButton
        canvas={canvas ? getCanvasElement() : undefined}
        source="template_editor"
        variant="primary"
        label="Download"
      />
    </header>
  )
}

function ToolbarButton({ icon, onClick, disabled, active, tooltip }: {
  icon:      React.ReactNode
  onClick:   () => void
  disabled?: boolean
  active?:   boolean
  tooltip?:  string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      style={{
        width: '30px', height: '30px',
        background: active ? '#EFF6FF' : 'transparent',
        border: active ? '1px solid #BFDBFE' : '1px solid transparent',
        borderRadius: '7px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: active ? '#2563EB' : (disabled ? '#CBD5E1' : '#475569'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
    </button>
  )
}

function Divider() {
  return <div style={{ width: '1px', height: '24px', background: '#E2E8F0', margin: '0 4px' }} />
}