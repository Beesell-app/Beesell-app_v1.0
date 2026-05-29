// apps/web-app/lib/canvas/layers.ts
// ── 5-layer management: bg / photo / overlay / text / logo ──
import type { Canvas, FabricObject, FabricText, Rect, Image as FabricImage } from 'fabric'
import * as fabric from 'fabric'
import {
  LAYER_CONFIG,
  TEXT_PRESETS,
  CANVAS_PRESETS,
  type LayerId,
  type TextPreset,
  type CanvasPreset,
} from './fabric-config'

// ── Custom attribute key untuk layer identification ──────────
export const LAYER_ATTR = 'beesell_layer'
export const LAYER_TYPE_ATTR = 'beesell_type'

export function setLayerAttr(obj: FabricObject, layerId: LayerId, type?: string): void {
  obj.set({
    [LAYER_ATTR]:      layerId,
    [LAYER_TYPE_ATTR]: type ?? layerId,
  } as any)
}

export function getLayerId(obj: FabricObject): LayerId | null {
  return (obj as any)[LAYER_ATTR] ?? null
}

export function getObjectsByLayer(canvas: Canvas, layerId: LayerId): FabricObject[] {
  return canvas.getObjects().filter(obj => getLayerId(obj) === layerId)
}

// ══════════════════════════════════════════════════════════════
// LAYER: BACKGROUND
// ══════════════════════════════════════════════════════════════
export function addBackground(
  canvas:       Canvas,
  color:        string = '#2563EB',
  preset:       CanvasPreset = 'instagram_feed',
): Rect {
  const { width, height } = CANVAS_PRESETS[preset]

  const bg = new fabric.Rect({
    left:              0,
    top:               0,
    width,
    height,
    fill:              color,
    selectable:        false,
    evented:           false,    // bisa dilock agar tidak ke-select
    hoverCursor:       'default',
    excludeFromExport: false,
  } as any)

  setLayerAttr(bg, 'bg')

  // BG selalu di bawah — insert at index 0
  canvas.insertAt(0, bg)
  return bg
}

export function updateBackground(canvas: Canvas, color: string): void {
  const bgs = getObjectsByLayer(canvas, 'bg')
  bgs.forEach(bg => bg.set('fill', color))
  canvas.renderAll()
}

// ══════════════════════════════════════════════════════════════
// LAYER: OVERLAY
// ══════════════════════════════════════════════════════════════
export function addOverlay(
  canvas:       Canvas,
  color:        string  = '#000000',
  opacity:      number  = 0.4,
  preset:       CanvasPreset = 'instagram_feed',
): Rect {
  const { width, height } = CANVAS_PRESETS[preset]

  const overlay = new fabric.Rect({
    left:        0,
    top:         0,
    width,
    height,
    fill:        color,
    opacity,
    selectable:  false,
    evented:     false,
  } as any)

  setLayerAttr(overlay, 'overlay')

  // Overlay harus di atas photo (index 2)
  canvas.insertAt(2, overlay)
  return overlay
}

export function updateOverlay(
  canvas:  Canvas,
  color?:  string,
  opacity?: number,
): void {
  const overlays = getObjectsByLayer(canvas, 'overlay')
  overlays.forEach(o => {
    if (color   !== undefined) o.set('fill', color)
    if (opacity !== undefined) o.set('opacity', opacity)
  })
  canvas.renderAll()
}

// ══════════════════════════════════════════════════════════════
// LAYER: PHOTO (product image)
// ══════════════════════════════════════════════════════════════
export async function addProductPhoto(
  canvas:      Canvas,
  media_url:    string,
  preset:      CanvasPreset = 'instagram_feed',
): Promise<FabricImage> {
  const { width, height } = CANVAS_PRESETS[preset]

  const img = await fabric.FabricImage.fromURL(media_url, { crossOrigin: 'anonymous' })

  // Scale to fit canvas, maintain aspect
  const scale = Math.min(width / (img.width ?? 1), height / (img.height ?? 1))
  img.set({
    scaleX:  scale,
    scaleY:  scale,
    left:    (width  - (img.width  ?? 0) * scale) / 2,
    top:     (height - (img.height ?? 0) * scale) / 2,
    originX: 'left',
    originY: 'top',
  })

  setLayerAttr(img, 'photo')
  canvas.insertAt(1, img)    // above bg
  return img
}

// ══════════════════════════════════════════════════════════════
// LAYER: TEXT
// ══════════════════════════════════════════════════════════════
export function addTextElement(
  canvas:  Canvas,
  preset:  TextPreset,
  text?:   string,          // override default text
  canvasWidth:  number = 1080,
  canvasHeight: number = 1080,
): FabricText {
  const config = TEXT_PRESETS[preset]

  const textObj = new fabric.IText(text ?? config.defaultText, {
    left:            canvasWidth  / 2,
    top:             canvasHeight / 2,
    originX:         'center',
    originY:         'center',
    fontSize:        config.fontSize,
    fontWeight:      config.fontWeight,
    textAlign:       config.textAlign,
    fill:            config.fill,
    fontFamily:      'DM Sans',
    editable:        true,
    cornerSize:      10,
    transparentCorners: false,
    cornerColor:     '#2563EB',
    borderColor:     '#2563EB',
  })

  setLayerAttr(textObj, 'text', preset)
  canvas.add(textObj)
  canvas.setActiveObject(textObj)
  return textObj
}

// ══════════════════════════════════════════════════════════════
// LAYER: LOGO
// ══════════════════════════════════════════════════════════════
export async function addLogoElement(
  canvas:      Canvas,
  media_url:    string,
  canvasWidth:  number = 1080,
  canvasHeight: number = 1080,
): Promise<FabricImage> {
  const img = await fabric.FabricImage.fromURL(media_url, { crossOrigin: 'anonymous' })

  // Logo: default 15% of canvas width
  const targetW = canvasWidth * 0.15
  const scale   = targetW / (img.width ?? 1)

  img.set({
    scaleX: scale,
    scaleY: scale,
    left:   canvasWidth  - (img.width  ?? 0) * scale - 40,
    top:    canvasHeight - (img.height ?? 0) * scale - 40,
  })

  setLayerAttr(img, 'logo')
  canvas.add(img)
  canvas.setActiveObject(img)
  return img
}

// ══════════════════════════════════════════════════════════════
// VISIBILITY TOGGLE
// ══════════════════════════════════════════════════════════════
export function setLayerVisibility(
  canvas:    Canvas,
  layerId:   LayerId,
  visible:   boolean,
): void {
  getObjectsByLayer(canvas, layerId).forEach(obj => {
    obj.set({ visible, evented: visible })
  })
  canvas.renderAll()
}

// ══════════════════════════════════════════════════════════════
// LOCK / UNLOCK LAYER
// ══════════════════════════════════════════════════════════════
export function setLayerLock(
  canvas:  Canvas,
  layerId: LayerId,
  locked:  boolean,
): void {
  const selectable = !locked
  getObjectsByLayer(canvas, layerId).forEach(obj => {
    obj.set({
      selectable,
      hasControls: selectable,
      lockMovementX: locked,
      lockMovementY: locked,
    })
  })
  canvas.renderAll()
}

// ══════════════════════════════════════════════════════════════
// SEND SELECTED OBJECT TO CORRECT Z-INDEX FOR ITS LAYER
// ══════════════════════════════════════════════════════════════
export function enforceLayerOrder(canvas: Canvas): void {
  const allObjects = canvas.getObjects()

  const sorted = [...allObjects].sort((a, b) => {
    const aLayer = getLayerId(a)
    const bLayer = getLayerId(b)
    const aZ = aLayer ? LAYER_CONFIG[aLayer].zIndex : 99
    const bZ = bLayer ? LAYER_CONFIG[bLayer].zIndex : 99
    return aZ - bZ
  })

  // Re-stack in correct order
  sorted.forEach((obj, i) => {
    canvas.moveObjectTo(obj, i)
  })
}

// ══════════════════════════════════════════════════════════════
// DELETE SELECTED
// ══════════════════════════════════════════════════════════════
export function deleteSelected(canvas: Canvas): void {
  const active = canvas.getActiveObjects()
  active.forEach(obj => {
    const layerId = getLayerId(obj)
    if (!layerId) return
    if (!LAYER_CONFIG[layerId].canDelete) return
    canvas.remove(obj)
  })
  canvas.discardActiveObject()
  canvas.renderAll()
}