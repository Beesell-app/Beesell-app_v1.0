// apps/web-app/store/canvasEditorStore.ts
// ── Zustand state for editor UI state (separate from canvas state) ──
// Canvas objects live in Fabric.js instance.
// Zustand handles: UI panels, layer visibility, active tool, etc.
import { create } from 'zustand'
import type { LayerId, CanvasPreset } from '@/lib/canvas/fabric-config'

export type ActiveTool = 'select' | 'text' | 'pan'
export type PanelTab   = 'layers' | 'text' | 'background' | 'overlay' | 'upload'

interface LayerState {
  visible: boolean
  locked:  boolean
}

interface CanvasEditorState {
  // ── Canvas config ────────────────────────────────────────
  preset:          CanvasPreset
  canvasWidth:     number
  canvasHeight:    number

  // ── Tools ────────────────────────────────────────────────
  activeTool:      ActiveTool
  showGrid:        boolean
  snapEnabled:     boolean

  // ── Layer UI state ───────────────────────────────────────
  layers:          Record<LayerId, LayerState>
  activeLayerId:   LayerId | null

  // ── Selection ────────────────────────────────────────────
  selectedObjectId: string | null   // Fabric.js object id

  // ── Panels ───────────────────────────────────────────────
  activePanelTab:  PanelTab
  propertiesDirty: boolean   // flag untuk re-render PropertyPanel

  // ── History ─────────────────────────────────────────────
  canUndo:  boolean
  canRedo:  boolean

  // ── Export state ─────────────────────────────────────────
  isExporting: boolean

  // ── Actions ─────────────────────────────────────────────
  setPreset:         (preset: CanvasPreset) => void
  setActiveTool:     (tool: ActiveTool) => void
  setShowGrid:       (show: boolean) => void
  setSnapEnabled:    (snap: boolean) => void
  setLayerVisible:   (id: LayerId, visible: boolean) => void
  setLayerLocked:    (id: LayerId, locked: boolean) => void
  setActiveLayer:    (id: LayerId | null) => void
  setSelectedObject: (id: string | null) => void
  setActivePanelTab: (tab: PanelTab) => void
  setPropertiesDirty: () => void
  setHistoryState:   (canUndo: boolean, canRedo: boolean) => void
  setIsExporting:    (v: boolean) => void
}

const DEFAULT_LAYER_STATE: LayerState = { visible: true, locked: false }

const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
  bg:      { ...DEFAULT_LAYER_STATE },
  photo:   { ...DEFAULT_LAYER_STATE },
  overlay: { ...DEFAULT_LAYER_STATE },
  text:    { ...DEFAULT_LAYER_STATE },
  logo:    { ...DEFAULT_LAYER_STATE },
}

export const useCanvasEditorStore = create<CanvasEditorState>((set) => ({
  preset:           'instagram_feed',
  canvasWidth:      1080,
  canvasHeight:     1080,

  activeTool:       'select',
  showGrid:         true,
  snapEnabled:      true,

  layers:           DEFAULT_LAYERS,
  activeLayerId:    null,

  selectedObjectId: null,
  activePanelTab:   'layers',
  propertiesDirty:  false,

  canUndo:          false,
  canRedo:          false,
  isExporting:      false,

  setPreset: (preset) => {
    const sizes: Record<CanvasPreset, { w: number; h: number }> = {
      instagram_feed:   { w: 1080, h: 1080 },
      instagram_reels:  { w: 1080, h: 1920 },
      tiktok:           { w: 1080, h: 1920 },
    }
    const s = sizes[preset]
    set({ preset, canvasWidth: s.w, canvasHeight: s.h })
  },

  setActiveTool:     tool      => set({ activeTool: tool }),
  setShowGrid:       show      => set({ showGrid: show }),
  setSnapEnabled:    snap      => set({ snapEnabled: snap }),

  setLayerVisible: (id, visible) =>
    set(s => ({ layers: { ...s.layers, [id]: { ...s.layers[id], visible } } })),
  setLayerLocked: (id, locked) =>
    set(s => ({ layers: { ...s.layers, [id]: { ...s.layers[id], locked } } })),

  setActiveLayer:    id        => set({ activeLayerId: id }),
  setSelectedObject: id        => set({ selectedObjectId: id }),
  setActivePanelTab: tab       => set({ activePanelTab: tab }),
  setPropertiesDirty:()        => set(s => ({ propertiesDirty: !s.propertiesDirty })),
  setHistoryState:   (u, r)   => set({ canUndo: u, canRedo: r }),
  setIsExporting:    v         => set({ isExporting: v }),
}))