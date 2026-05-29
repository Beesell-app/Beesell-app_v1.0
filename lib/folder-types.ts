// apps/web-app/lib/folder-types.ts
// Type definitions untuk Folder System

// ── Folder data ────────────────────────────────────────────
export interface Folder {
  id:        string
  tenant_id:  string
  parentId:  string | null
  name:      string
  color:     string                       // hex
  sortOrder: number
  created_at: string
  updated_at: string

  // Hydrated saat fetch tree
  children?:    Folder[]
  contentCount?: number                    // jumlah content di folder ini
}

// ── Folder breadcrumb ──────────────────────────────────────
export interface BreadcrumbItem {
  id:    string | null                    // null = root
  name:  string
  color: string
}

// ── Color presets (8 warna) ────────────────────────────────
export const FOLDER_COLORS = [
  { value: '#94A3B8', label: 'Abu-abu',  emoji: '⬜' },
  { value: '#2563EB', label: 'Biru',     emoji: '🟦' },
  { value: '#7C3AED', label: 'Ungu',     emoji: '🟪' },
  { value: '#DB2777', label: 'Pink',     emoji: '🟪' },
  { value: '#DC2626', label: 'Merah',    emoji: '🟥' },
  { value: '#F59E0B', label: 'Kuning',   emoji: '🟨' },
  { value: '#16A34A', label: 'Hijau',    emoji: '🟩' },
  { value: '#0891B2', label: 'Cyan',     emoji: '🟦' },
] as const

export const DEFAULT_COLOR = '#94A3B8'

// ── Drag-and-drop types ────────────────────────────────────
// data attribute pakai untuk identify drag source/target
export type DragData =
  | { type: 'folder';  folderId: string;  parentId: string | null }
  | { type: 'content'; contentId: string; currentFolderId: string | null }

export type DropData =
  | { type: 'folder-drop';  folderId: string }
  | { type: 'root-drop' }                     // drop ke "Library" root

// ── API request types ──────────────────────────────────────
export interface CreateFolderInput {
  name:      string
  parentId?: string | null
  color?:    string
}

export interface UpdateFolderInput {
  name?:     string
  parentId?: string | null    // untuk move
  color?:    string
  sortOrder?: number
}

export interface MoveContentInput {
  contentId: string
  folderId:  string | null
}