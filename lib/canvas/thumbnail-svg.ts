// apps/web-app/lib/canvas/thumbnail-svg.ts
// ── SVG thumbnail generator ──────────────────────────────────
// Generate inline SVG preview dari template definition.
// Tidak butuh Fabric.js — pure SVG.
// Dipakai di gallery untuk fast preview sebelum load editor.
import type { TemplateDefinition, TemplateLayer } from './templates'

export function generateTemplateSvg(
  template: TemplateDefinition,
  thumbW:   number = 360,
  thumbH:   number = 360,
): string {
  const { canvas: { width: CW, height: CH }, layers } = template
  const aspect = CH / CW
  const tw      = thumbW
  const th      = Math.round(tw * aspect)

  const svgLayers = layers.map(layer => renderLayerSvg(layer, CW, CH, tw, th)).filter(Boolean).join('\n  ')

  // Clip path for canvas boundaries
  return `<svg width="${tw}" height="${th}" viewBox="0 0 ${tw} ${th}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="canvas-clip"><rect width="${tw}" height="${th}" /></clipPath>
  </defs>
  <g clip-path="url(#canvas-clip)">
  ${svgLayers}
  </g>
</svg>`
}

function renderLayerSvg(
  layer: TemplateLayer,
  CW:   number, CH: number,
  TW:   number, TH: number,
): string {
  const x = (layer.x * TW)
  const y = (layer.y * TH)
  const w = (layer.w * TW)
  const h = (layer.h * TH)
  const opacity = layer.opacity ?? 1

  switch (layer.type) {
    case 'rect': {
      const rx = layer.rx ? Math.min(w, h) * layer.rx : 0
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${layer.fill ?? '#000'}" rx="${f(rx)}" opacity="${opacity}" />`
    }

    case 'gradient_rect': {
      const id      = `g_${Math.random().toString(36).slice(2, 7)}`
      const [x1, y1, x2, y2] = gradCoords(layer.gradientDir ?? 'v')
      const c2 = layer.fill2 === 'transparent' ? 'rgba(0,0,0,0)' : (layer.fill2 ?? 'rgba(0,0,0,0)')

      return `<defs>
    <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="${layer.fill ?? '#000'}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#${id})" opacity="${opacity}" />`
    }

    case 'circle': {
      const cx = x + w / 2
      const cy = y + h / 2
      const rx = w / 2
      const ry = h / 2

      return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${layer.fill ?? '#000'}" opacity="${opacity}" />`
    }

    case 'text': {
      const fontSize = (layer.fontSize ?? 0.04) * TH
      const anchor   = layer.textAlign === 'center' ? 'middle'
                     : layer.textAlign === 'right'  ? 'end'
                     : 'start'
      const textX    = layer.textAlign === 'center' ? x + w / 2
                     : layer.textAlign === 'right'  ? x + w
                     : x

      // Multi-line support (split by \n)
      const lines = (layer.text ?? '').split('\n')
      const lineH = fontSize * 1.2

      if (lines.length === 1) {
        return `<text x="${f(textX)}" y="${f(y + fontSize)}" font-size="${f(fontSize)}" font-family="${layer.fontFamily ?? 'DM Sans'}" font-weight="${layer.fontWeight ?? 'normal'}" fill="${layer.fill ?? '#fff'}" text-anchor="${anchor}" opacity="${opacity}" style="letter-spacing:${layer.letterSpacing ?? 0}px">${escapeXml(lines[0])}</text>`
      }

      const tspans = lines.map((line, i) =>
        `<tspan x="${f(textX)}" dy="${i === 0 ? '0' : lineH + 'px'}">${escapeXml(line)}</tspan>`,
      ).join('')

      return `<text x="${f(textX)}" y="${f(y + fontSize)}" font-size="${f(fontSize)}" font-family="${layer.fontFamily ?? 'DM Sans'}" font-weight="${layer.fontWeight ?? 'normal'}" fill="${layer.fill ?? '#fff'}" text-anchor="${anchor}" opacity="${opacity}">${tspans}</text>`
    }

    case 'image_placeholder': {
      const color = layer.imageTag === 'product_photo' ? '#CBD5E1' : '#E2E8F0'
      const icon  = layer.imageTag === 'product_photo' ? '🖼' : '⭐'
      const cx    = x + w / 2
      const cy    = y + h / 2
      const fs    = Math.min(w, h) * 0.28

      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${color}" rx="4" opacity="0.6" />
  <text x="${f(cx)}" y="${f(cy + fs * 0.4)}" text-anchor="middle" font-size="${f(fs)}">${icon}</text>`
    }

    case 'line': {
      const sw = (layer.strokeWidth ?? 0.003) * TH
      return `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + w)}" y2="${f(y)}" stroke="${layer.strokeColor ?? '#fff'}" stroke-width="${f(sw)}" opacity="${opacity}" />`
    }

    default:
      return ''
  }
}

// ── Helpers ──────────────────────────────────────────────────
function f(n: number): string { return n.toFixed(2) }

function gradCoords(dir: 'v' | 'h' | 'diagonal'): [string, string, string, string] {
  if (dir === 'h')        return ['0%', '50%', '100%', '50%']
  if (dir === 'diagonal') return ['0%', '0%', '100%', '100%']
  return ['50%', '0%', '50%', '100%']
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Batch generate all ────────────────────────────────────────
export function generateAllThumbnails(
  templates: TemplateDefinition[],
  thumbW = 280,
): Array<{ id: string; svg: string }> {
  return templates.map(t => ({
    id:  t.id,
    svg: generateTemplateSvg(t, thumbW),
  }))
}