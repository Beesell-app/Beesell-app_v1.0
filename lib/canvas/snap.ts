// apps/web-app/lib/canvas/snap.ts
// ── Snap-to-grid and snap-to-edge helper ──────────────────
// Dipanggil di Fabric.js 'object:moving' event
import { GRID_SIZE, SNAP_THRESHOLD } from './fabric-config'
import type { FabricObject } from 'fabric'

// ══════════════════════════════════════════════════════════════
// SNAP TO GRID
// ══════════════════════════════════════════════════════════════
export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize
}

export function applyGridSnap(
  obj:       FabricObject,
  shiftHeld: boolean = false,   // Shift = disable snap
): void {
  if (shiftHeld) return

  const left = obj.left ?? 0
  const top  = obj.top  ?? 0

  const snappedLeft = snapToGrid(left)
  const snappedTop  = snapToGrid(top)

  const dLeft = Math.abs(left - snappedLeft)
  const dTop  = Math.abs(top  - snappedTop)

  // Only snap if close enough to grid line (SNAP_THRESHOLD)
  if (dLeft < SNAP_THRESHOLD) obj.set('left', snappedLeft)
  if (dTop  < SNAP_THRESHOLD) obj.set('top',  snappedTop)
}

// ══════════════════════════════════════════════════════════════
// SNAP TO CANVAS CENTER (horizontal + vertical)
// ══════════════════════════════════════════════════════════════
export function applyCenterSnap(
  obj:          FabricObject,
  canvasWidth:  number,
  canvasHeight: number,
  threshold:    number = SNAP_THRESHOLD,
): { snappedH: boolean; snappedV: boolean } {
  const objWidth  = (obj.getScaledWidth()  ?? 0)
  const objHeight = (obj.getScaledHeight() ?? 0)

  const centerX = canvasWidth  / 2
  const centerY = canvasHeight / 2

  const objCenterX = (obj.left ?? 0) + objWidth  / 2
  const objCenterY = (obj.top  ?? 0) + objHeight / 2

  let snappedH = false
  let snappedV = false

  if (Math.abs(objCenterX - centerX) < threshold) {
    obj.set('left', centerX - objWidth / 2)
    snappedH = true
  }

  if (Math.abs(objCenterY - centerY) < threshold) {
    obj.set('top', centerY - objHeight / 2)
    snappedV = true
  }

  return { snappedH, snappedV }
}

// ══════════════════════════════════════════════════════════════
// SNAP TO CANVAS EDGES
// ══════════════════════════════════════════════════════════════
export function applyEdgeSnap(
  obj:          FabricObject,
  canvasWidth:  number,
  canvasHeight: number,
  threshold:    number = SNAP_THRESHOLD,
): void {
  const objWidth  = obj.getScaledWidth()
  const objHeight = obj.getScaledHeight()

  const left   = obj.left ?? 0
  const top    = obj.top  ?? 0
  const right  = left + objWidth
  const bottom = top  + objHeight

  // Left edge
  if (Math.abs(left) < threshold) obj.set('left', 0)
  // Right edge
  if (Math.abs(right - canvasWidth) < threshold) obj.set('left', canvasWidth - objWidth)
  // Top edge
  if (Math.abs(top) < threshold) obj.set('top', 0)
  // Bottom edge
  if (Math.abs(bottom - canvasHeight) < threshold) obj.set('top', canvasHeight - objHeight)
}

// ══════════════════════════════════════════════════════════════
// COMBINED: full snap handler (call in object:moving)
// ══════════════════════════════════════════════════════════════
export function applyAllSnaps(
  obj:          FabricObject,
  canvasWidth:  number,
  canvasHeight: number,
  shiftHeld:    boolean = false,
): void {
  if (shiftHeld) return

  applyGridSnap(obj, shiftHeld)
  applyEdgeSnap(obj, canvasWidth, canvasHeight)
  applyCenterSnap(obj, canvasWidth, canvasHeight)
}