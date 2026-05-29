// apps/web-app/lib/canvas/history.ts
// ── Undo/Redo JSON snapshot stack ────────────────────────────
// Strategy: setiap "committed action" simpan JSON snapshot canvas state.
// Undo: restore previous snapshot
// Redo: restore next snapshot
// Max stack: 30 entries (bisa configurable)
import { HISTORY_MAX_STACK } from './fabric-config'

export class CanvasHistory {
  private stack:     string[] = []   // JSON snapshots
  private pointer:   number  = -1   // current position in stack
  private isPaused:  boolean = false // pause recording during restore

  // ── Pause / resume (untuk saat loading snapshot) ────────
  pause()  { this.isPaused = true  }
  resume() { this.isPaused = false }

  // ── Save current canvas state ───────────────────────────
  push(state: string): void {
    if (this.isPaused) return

    // Hapus "future" states kalau user sudah undo lalu action baru
    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1)
    }

    this.stack.push(state)

    // Trim ke max depth
    if (this.stack.length > HISTORY_MAX_STACK) {
      this.stack.shift()
    } else {
      this.pointer++
    }
  }

  // ── Initialize dengan state awal ────────────────────────
  init(state: string): void {
    this.stack   = [state]
    this.pointer = 0
  }

  // ── Undo: go back one step ───────────────────────────────
  undo(): string | null {
    if (!this.canUndo()) return null
    this.pointer--
    return this.stack[this.pointer]
  }

  // ── Redo: go forward one step ───────────────────────────
  redo(): string | null {
    if (!this.canRedo()) return null
    this.pointer++
    return this.stack[this.pointer]
  }

  canUndo(): boolean { return this.pointer > 0 }
  canRedo(): boolean { return this.pointer < this.stack.length - 1 }

  get size():    number { return this.stack.length }
  get current(): string | null { return this.stack[this.pointer] ?? null }

  clear(): void {
    this.stack   = []
    this.pointer = -1
  }
}