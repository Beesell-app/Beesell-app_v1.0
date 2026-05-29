'use client'
// apps/web-app/components/editor/CanvasEditor.tsx
// ── Main Fabric.js canvas component ─────────────────────────
// Handles: init, event binding, grid overlay, snap, history, keyboard shortcuts
import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as fabric from 'fabric'
import type { Canvas } from 'fabric'
import { useCanvasEditorStore }  from '@/store/canvasEditorStore'
import { CanvasHistory }          from '@/lib/canvas/history'
import { applyAllSnaps }          from '@/lib/canvas/snap'
import { getLayerId }             from '@/lib/canvas/layers'
import {
  CANVAS_PRESETS,
  DISPLAY_SCALE,
  GRID_SIZE,
  EXPORT_CONFIG,
  type CanvasPreset,
} from '@/lib/canvas/fabric-config'

// ── Ref handle: expose canvas methods to parent ──────────────
export interface CanvasEditorHandle {
  getCanvas:    () => Canvas | null
  exportImage:  (multiplier?: number) => string | null
  loadJSON:     (json: string) => Promise<void>
  toJSON:       () => string
}

interface Props {
  preset:     CanvasPreset
  initialBg?: string           // initial background color
  onReady?:   (canvas: Canvas) => void
}

export const CanvasEditor = forwardRef<CanvasEditorHandle, Props>(
  ({ preset, initialBg = '#2563EB', onReady }, ref) => {
    const htmlCanvasRef = useRef<HTMLCanvasElement>(null)
    const fabricRef     = useRef<Canvas | null>(null)
    const historyRef    = useRef<CanvasHistory>(new CanvasHistory())
    const isRestoringRef = useRef(false)
    const shiftHeldRef   = useRef(false)

    const {
      showGrid, snapEnabled,
      setHistoryState, setSelectedObject, setPropertiesDirty,
    } = useCanvasEditorStore()

    const cfg = CANVAS_PRESETS[preset]
    const displayW = Math.round(cfg.width  * DISPLAY_SCALE)
    const displayH = Math.round(cfg.height * DISPLAY_SCALE)

    // ── Expose handle to parent ────────────────────────────
    useImperativeHandle(ref, () => ({
      getCanvas:   () => fabricRef.current,
      exportImage: (multiplier = EXPORT_CONFIG.multiplier) => {
        if (!fabricRef.current) return null
        return fabricRef.current.toDataURL({
          format:     EXPORT_CONFIG.format,
          multiplier,
          quality:    EXPORT_CONFIG.quality,
        })
      },
      loadJSON: async (json: string) => {
        if (!fabricRef.current) return
        await fabricRef.current.loadFromJSON(JSON.parse(json))
        fabricRef.current.renderAll()
      },
      toJSON: () => {
        if (!fabricRef.current) return '{}'
        return JSON.stringify(
        (fabricRef.current as any).toJSON([
          'beesell_layer',
          'beesell_type',
        ])
      )
      },
    }))

    // ── Save history snapshot ──────────────────────────────
    const saveSnapshot = useCallback(() => {
      const fc = fabricRef.current
      if (!fc || isRestoringRef.current) return
      const json = JSON.stringify(
        (fc as any).toJSON([
          'beesell_layer',
          'beesell_type',
        ])
      )
      historyRef.current.push(json)
      setHistoryState(historyRef.current.canUndo(), historyRef.current.canRedo())
    }, [setHistoryState])

    // ── Undo ─────────────────────────────────────────────
    const undo = useCallback(async () => {
      const fc = fabricRef.current
      if (!fc || !historyRef.current.canUndo()) return
      const prev = historyRef.current.undo()
      if (!prev) return
      isRestoringRef.current = true
      await fc.loadFromJSON(JSON.parse(prev))
      fc.renderAll()
      isRestoringRef.current = false
      setHistoryState(historyRef.current.canUndo(), historyRef.current.canRedo())
    }, [setHistoryState])

    // ── Redo ─────────────────────────────────────────────
    const redo = useCallback(async () => {
      const fc = fabricRef.current
      if (!fc || !historyRef.current.canRedo()) return
      const next = historyRef.current.redo()
      if (!next) return
      isRestoringRef.current = true
      await fc.loadFromJSON(JSON.parse(next))
      fc.renderAll()
      isRestoringRef.current = false
      setHistoryState(historyRef.current.canUndo(), historyRef.current.canRedo())
    }, [setHistoryState])

    // ── Grid overlay drawing ───────────────────────────────
    const drawGrid = useCallback((fc: Canvas) => {
      if (!showGrid) return

      fc.on('after:render', () => {
        const ctx  = fc.getContext()
        const zoom = fc.getZoom()

        ctx.save()
        ctx.strokeStyle = 'rgba(99,102,241,0.12)'
        ctx.lineWidth   = 0.5

        const step = GRID_SIZE * zoom

        // Vertical lines
        for (let x = 0; x < fc.getWidth(); x += step) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, fc.getHeight())
          ctx.stroke()
        }
        // Horizontal lines
        for (let y = 0; y < fc.getHeight(); y += step) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(fc.getWidth(), y)
          ctx.stroke()
        }
        ctx.restore()
      })
    }, [showGrid])

    // ── Initialize Fabric canvas ──────────────────────────
    useEffect(() => {
      const el = htmlCanvasRef.current
      if (!el || fabricRef.current) return

      const fc = new fabric.Canvas(el, {
        width:               displayW,
        height:              displayH,
        backgroundColor:     initialBg,
        selection:           true,
        preserveObjectStacking: true,
        renderOnAddRemove:   false,
        stopContextMenu:     true,
        fireRightClick:      false,
      })

      fabricRef.current = fc

      // Apply display scale
      fc.setZoom(DISPLAY_SCALE)

      // Grid
      drawGrid(fc)

      // ── Event: snap on move ────────────────────────────
      fc.on('object:moving', (e) => {
        if (!snapEnabled || !e.target) return
        applyAllSnaps(
          e.target,
          cfg.width,
          cfg.height,
          shiftHeldRef.current,
        )
      })

      // ── Event: save to history ─────────────────────────
      fc.on('object:modified',  saveSnapshot)
      fc.on('object:added',     saveSnapshot)
      fc.on('object:removed',   saveSnapshot)

      // ── Event: selection → update UI ──────────────────
      fc.on('selection:created', (e) => {
        const obj = e.selected?.[0]
        if (!obj) return
        const layerId = getLayerId(obj)
        setSelectedObject((obj as any).id ?? String(Date.now()))
        setPropertiesDirty()
      })
      fc.on('selection:cleared', () => {
        setSelectedObject(null)
        setPropertiesDirty()
      })
      fc.on('selection:updated', () => {
        setPropertiesDirty()
      })

      // ── Initial snapshot ───────────────────────────────
      const initJson = JSON.stringify(
        (fc as any).toJSON([
          'beesell_layer',
          'beesell_type',
        ])
      )
      historyRef.current.init(initJson)

      fc.renderAll()
      onReady?.(fc)

      return () => {
        fc.dispose()
        fabricRef.current = null
      }
    }, []) // only on mount

    // ── Keyboard shortcuts ────────────────────────────────
    useEffect(() => {
      const handleKeyDown = async (e: KeyboardEvent) => {
        const meta = e.metaKey || e.ctrlKey

        if (e.shiftKey) shiftHeldRef.current = true

        if (meta && !e.shiftKey && e.key === 'z') {
          e.preventDefault()
          await undo()
        }
        if (meta && e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault()
          await redo()
        }
        if (meta && e.key === 'y') {
          e.preventDefault()
          await redo()
        }

        // Delete selected
        if ((e.key === 'Backspace' || e.key === 'Delete') && fabricRef.current) {
          const fc     = fabricRef.current
          const active = fc.getActiveObject()
          // Don't delete if editing text
          if (active && !('isEditing' in active && (active as any).isEditing)) {
            const layerId = getLayerId(active)
            if (layerId && ['text', 'photo', 'logo'].includes(layerId)) {
              fc.remove(active)
              fc.discardActiveObject()
              fc.renderAll()
            }
          }
        }
      }

      const handleKeyUp = (e: KeyboardEvent) => {
        if (!e.shiftKey) shiftHeldRef.current = false
      }

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup',   handleKeyUp)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup',   handleKeyUp)
      }
    }, [undo, redo])

    // ── Sync snapEnabled state ─────────────────────────────
    useEffect(() => {
      // Already referenced via closure in object:moving, no extra binding needed
    }, [snapEnabled])

    return (
      <div
        style={{
          width:    `${displayW}px`,
          height:   `${displayH}px`,
          position: 'relative',
          border:   '1px solid #E2E8F0',
          borderRadius: '4px',
          overflow: 'hidden',
          userSelect: 'none',
          background: '#fff',
          boxShadow: '0 4px 24px rgba(15,23,42,.12)',
        }}
      >
        <canvas ref={htmlCanvasRef} />
      </div>
    )
  },
)

CanvasEditor.displayName = 'CanvasEditor'