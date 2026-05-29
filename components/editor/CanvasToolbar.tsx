'use client'
// apps/web-app/components/editor/CanvasToolbar.tsx
// ── Top toolbar: undo/redo, grid, snap, export ───────────────
import { Undo2, Redo2, Grid3x3, Magnet, Download, Loader2, MousePointer2, Type } from 'lucide-react'
import { useCanvasEditorStore } from '@/store/canvasEditorStore'
import type { CanvasEditorHandle } from './CanvasEditor'
import type { RefObject } from 'react'

interface Props {
  editorRef: RefObject<CanvasEditorHandle>
}

export function CanvasToolbar({ editorRef }: Props) {
  const {
    canUndo, canRedo,
    showGrid, snapEnabled, isExporting, activeTool,
    setShowGrid, setSnapEnabled, setActiveTool, setIsExporting,
  } = useCanvasEditorStore()

  const handleUndo = () => {
    // Dispatch Ctrl+Z programmatically
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
  }

  const handleRedo = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }))
  }

  const handleExport = async () => {
    const canvas = editorRef.current
    if (!canvas) return

    setIsExporting(true)
    try {
      // Small delay untuk ensure UI updates
      await new Promise(r => setTimeout(r, 50))

      const dataUrl = canvas.exportImage(2)   // 2× = 1080px
      if (!dataUrl) return

      const link    = document.createElement('a')
      link.href     = dataUrl
      link.download = `beesell-template-${Date.now()}.png`
      link.click()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '4px',
      padding:        '8px 12px',
      background:     '#fff',
      borderBottom:   '1px solid #E2E8F0',
      fontFamily:     "'DM Sans', sans-serif",
    }}>
      {/* ── Active tool ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: '2px', marginRight: '6px' }}>
        <ToolBtn
          icon={<MousePointer2 size={15} />}
          label="Select"
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
        />
        <ToolBtn
          icon={<Type size={15} />}
          label="Text"
          active={activeTool === 'text'}
          onClick={() => setActiveTool('text')}
        />
      </div>

      <Sep />

      {/* ── Undo / Redo ─────────────────────────────── */}
      <ToolBtn
        icon={<Undo2 size={15} />}
        label="Undo (Ctrl+Z)"
        disabled={!canUndo}
        onClick={handleUndo}
      />
      <ToolBtn
        icon={<Redo2 size={15} />}
        label="Redo (Ctrl+Shift+Z)"
        disabled={!canRedo}
        onClick={handleRedo}
      />

      <Sep />

      {/* ── Grid ─────────────────────────────────────── */}
      <ToolBtn
        icon={<Grid3x3 size={15} />}
        label="Tampilkan grid"
        active={showGrid}
        onClick={() => setShowGrid(!showGrid)}
      />

      {/* ── Snap ─────────────────────────────────────── */}
      <ToolBtn
        icon={<Magnet size={15} />}
        label="Snap to grid"
        active={snapEnabled}
        onClick={() => setSnapEnabled(!snapEnabled)}
      />

      {/* ── Spacer ───────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Export ──────────────────────────────────── */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            '6px',
          padding:        '7px 14px',
          background:     isExporting ? '#CBD5E1' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          color:          '#fff',
          border:         'none',
          borderRadius:   '8px',
          fontSize:       '12px',
          fontWeight:     600,
          cursor:         isExporting ? 'not-allowed' : 'pointer',
          fontFamily:     "'DM Sans', sans-serif",
          boxShadow:      isExporting ? 'none' : '0 2px 8px rgba(37,99,235,.3)',
          transition:     'all .15s',
        }}
      >
        {isExporting
          ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Exporting...</>
          : <><Download size={13} /> Export PNG</>
        }
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Tool button ──────────────────────────────────────────────
function ToolBtn({ icon, label, active, disabled, onClick }: {
  icon:      React.ReactNode
  label:     string
  active?:   boolean
  disabled?: boolean
  onClick:   () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        width:         '30px',
        height:        '30px',
        display:       'inline-flex',
        alignItems:    'center',
        justifyContent: 'center',
        background:    active ? '#EFF6FF' : 'transparent',
        color:         disabled ? '#CBD5E1' : (active ? '#2563EB' : '#64748B'),
        border:        `1px solid ${active ? '#BFDBFE' : 'transparent'}`,
        borderRadius:  '6px',
        cursor:        disabled ? 'not-allowed' : 'pointer',
        transition:    'all .15s',
      }}
    >
      {icon}
    </button>
  )
}

function Sep() {
  return <div style={{ width: '1px', height: '20px', background: '#E2E8F0', margin: '0 4px' }} />
}