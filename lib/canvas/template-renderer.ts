// apps/web-app/lib/canvas/template-renderer.ts
// ── Template JSON → Fabric.js canvas objects ──────────────────
// loadTemplate() dipanggil dari editor saat user pilih template.
// Translate layer descriptors (relative coords 0-1) ke absolute px.
import * as fabric from 'fabric'
import type { Canvas } from 'fabric'
import type { TemplateDefinition, TemplateLayer } from './templates'
import { setLayerAttr } from './layers'

// ══════════════════════════════════════════════════════════════
// MAIN LOADER
// ══════════════════════════════════════════════════════════════
export interface LoadTemplateOptions {
  productPhotoUrl?: string    // URL foto produk (jika sudah ada)
  logoUrl?:         string    // URL logo
  productName?:     string    // pre-fill text placeholder
  productPrice?:    string
  storeName?:       string
}

export async function loadTemplate(
  fc:       Canvas,
  template: TemplateDefinition,
  opts:     LoadTemplateOptions = {},
): Promise<void> {
  const { canvas: { width: W, height: H }, layers } = template

  // ── 1. Clear existing objects ──────────────────────────
  fc.clear()

  // ── 2. Resize canvas ───────────────────────────────────
  // (caller sets up canvas, we just populate objects)

  // ── 3. Render layers in order ──────────────────────────
  const DISPLAY_SCALE = fc.getZoom()   // applied by CanvasEditor

  for (const layer of layers) {
    const obj = await renderLayer(layer, W, H, opts)
    if (obj) {
      fc.add(obj)
    }
  }

  fc.renderAll()
}

// ══════════════════════════════════════════════════════════════
// RENDER SINGLE LAYER
// ══════════════════════════════════════════════════════════════
async function renderLayer(
  layer: TemplateLayer,
  W:     number,
  H:     number,
  opts:  LoadTemplateOptions,
): Promise<fabric.FabricObject | null> {
  // Resolve coordinates (relative 0-1 → absolute px)
  const x = layer.x * W
  const y = layer.y * H
  const w = layer.w * W
  const h = layer.h * H

  switch (layer.type) {
    case 'rect':
      return renderRect(layer, x, y, w, h)

    case 'gradient_rect':
      return renderGradientRect(layer, x, y, w, h, W, H)

    case 'circle':
      return renderCircle(layer, x, y, w, h)

    case 'text':
      return renderText(layer, x, y, w, h, H, opts)

    case 'image_placeholder':
      return await renderImagePlaceholder(layer, x, y, w, h, opts)

    case 'line':
      return renderLine(layer, x, y, w, H)

    default:
      return null
  }
}

// ── Rect ─────────────────────────────────────────────────────
function renderRect(l: TemplateLayer, x: number, y: number, w: number, h: number): fabric.Rect {
  const rx = l.rx ? Math.min(w, h) * l.rx : 0

  const rect = new fabric.Rect({
    left:        x,
    top:         y,
    width:       w,
    height:      h,
    fill:        l.fill ?? '#000000',
    opacity:     l.opacity ?? 1,
    rx, ry:      rx,
    selectable:  l.role !== 'bg' && l.role !== 'decoration',
    evented:     l.role !== 'bg' && l.role !== 'decoration',
  })

  setLayerAttr(rect, l.role as any)
  return rect
}

// ── Gradient rect ─────────────────────────────────────────────
function renderGradientRect(
  l:  TemplateLayer,
  x:  number, y: number, w: number, h: number,
  W:  number, H: number,
): fabric.Rect {
  const coords = l.gradientDir === 'h'
    ? { x1: 0, y1: 0.5, x2: 1, y2: 0.5 }
    : l.gradientDir === 'diagonal'
    ? { x1: 0, y1: 0, x2: 1, y2: 1 }
    : { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }

  const gradient = new fabric.Gradient({
    type:   'linear',
    coords,
    gradientUnits: 'percentage',
    colorStops: [
      { offset: 0,   color: l.fill  ?? '#000000' },
      { offset: 1,   color: (l.fill2 === 'transparent' ? 'rgba(0,0,0,0)' : l.fill2) ?? 'rgba(0,0,0,0)' },
    ],
  })

  const rect = new fabric.Rect({
    left:       x,
    top:        y,
    width:      w,
    height:     h,
    fill:       gradient,
    opacity:    l.opacity ?? 1,
    selectable: l.role !== 'bg' && l.role !== 'overlay',
    evented:    l.role !== 'bg' && l.role !== 'overlay',
  })

  setLayerAttr(rect, l.role as any)
  return rect
}

// ── Circle ───────────────────────────────────────────────────
function renderCircle(l: TemplateLayer, x: number, y: number, w: number, h: number): fabric.Ellipse {
  const ellipse = new fabric.Ellipse({
    left:        x,
    top:         y,
    rx:          w / 2,
    ry:          h / 2,
    fill:        l.fill ?? '#000000',
    opacity:     l.opacity ?? 1,
    selectable:  false,
    evented:     false,
  })

  setLayerAttr(ellipse, l.role as any)
  return ellipse
}

// ── Line ─────────────────────────────────────────────────────
function renderLine(l: TemplateLayer, x: number, y: number, w: number, H: number): fabric.Line {
  const strokeW = l.strokeWidth ? l.strokeWidth * H : 2

  const line = new fabric.Line([x, y, x + w, y], {
    stroke:      l.strokeColor ?? '#000000',
    strokeWidth: strokeW,
    selectable:  false,
    evented:     false,
    opacity:     l.opacity ?? 1,
  })

  setLayerAttr(line, l.role as any)
  return line
}

// ── Text ─────────────────────────────────────────────────────
function renderText(
  l:    TemplateLayer,
  x:    number, y: number, w: number, h: number,
  H:    number,
  opts: LoadTemplateOptions,
): fabric.IText {
  // Resolve dynamic text from opts
  let text = l.text ?? ''
  if (text.includes('Nama Produk') && opts.productName) text = opts.productName
  if (text.includes('Rp 99.000') && opts.productPrice)  text = opts.productPrice
  if (text.includes('Rp 99.000'))                       text = text
  if (text.includes('NAMA TOKO') && opts.storeName)     text = opts.storeName.toUpperCase()
  if (text.includes('@namatoko') && opts.storeName)     text = text.replace('@namatoko', `@${opts.storeName.toLowerCase().replace(/\s/g, '')}`)

  const fs = (l.fontSize ?? 0.04) * H   // relative font size

  const itext = new fabric.IText(text, {
    left:              x,
    top:               y,
    width:             w,
    originX:           'left',
    originY:           'top',
    fontSize:          fs,
    fontWeight:        l.fontWeight  ?? 'normal',
    fontStyle:         l.fontStyle   ?? 'normal',
    fontFamily:        l.fontFamily  ?? 'DM Sans',
    textAlign:         (l.textAlign  ?? 'left') as any,
    fill:              l.fill        ?? '#000000',
    opacity:           l.opacity     ?? 1,
    charSpacing:       l.letterSpacing ? l.letterSpacing * 1000 / fs : 0,
    editable:          true,
    selectable:        true,
    cornerSize:        10,
    transparentCorners: false,
    cornerColor:       '#2563EB',
    borderColor:       '#2563EB',
  })

  setLayerAttr(itext, 'text')
  return itext
}

// ── Image placeholder ─────────────────────────────────────────
async function renderImagePlaceholder(
  l:    TemplateLayer,
  x:    number, y: number, w: number, h: number,
  opts: LoadTemplateOptions,
): Promise<fabric.FabricObject> {
  const url = l.imageTag === 'product_photo'
    ? opts.productPhotoUrl
    : opts.logoUrl

  if (url) {
    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
      applyImageFit(img, x, y, w, h, l.objectFit ?? 'contain')
      setLayerAttr(img, l.role as any)
      return img
    } catch (err) {
      console.warn('[template-renderer] Image load failed, using placeholder rect:', err)
    }
  }

  // Fallback: placeholder rect with pattern
  return renderPlaceholderRect(l, x, y, w, h)
}

function applyImageFit(
  img:  fabric.FabricImage,
  x:    number, y: number, w: number, h: number,
  fit:  'contain' | 'cover',
): void {
  const imgW = img.width  ?? 1
  const imgH = img.height ?? 1

  if (fit === 'contain') {
    const scale = Math.min(w / imgW, h / imgH)
    img.set({
      scaleX: scale,
      scaleY: scale,
      left:   x + (w - imgW * scale) / 2,
      top:    y + (h - imgH * scale) / 2,
    })
  } else {
    // cover
    const scale = Math.max(w / imgW, h / imgH)
    img.set({
      scaleX:    scale,
      scaleY:    scale,
      left:      x + (w - imgW * scale) / 2,
      top:       y + (h - imgH * scale) / 2,
      clipPath:  new fabric.Rect({ left: x, top: y, width: w, height: h, absolutePositioned: true }),
    })
  }
}

function renderPlaceholderRect(l: TemplateLayer, x: number, y: number, w: number, h: number): fabric.Rect {
  const fill = l.imageTag === 'product_photo' ? '#CBD5E1' : '#E2E8F0'

  const rect = new fabric.Rect({
    left:       x,
    top:        y,
    width:      w,
    height:     h,
    fill,
    stroke:     '#94A3B8',
    strokeWidth: 2,
    strokeDashArray: [8, 6],
    selectable: true,
    evented:    true,
    opacity:    0.7,
  })

  setLayerAttr(rect, l.role as any)
  return rect
}