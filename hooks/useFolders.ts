'use client'
// apps/web-app/lib/hooks/useFolders.ts
// TanStack Query hooks untuk folder system
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Folder, CreateFolderInput, UpdateFolderInput, MoveContentInput, BreadcrumbItem,
} from '@/lib/folder-types'

// ── Query keys ─────────────────────────────────────────────
export const folderKeys = {
  all:  ['folders'] as const,
  tree: () => ['folders', 'tree'] as const,
}

// ── Tree response ──────────────────────────────────────────
interface FolderTreeResponse {
  roots:            Folder[]
  rootContentCount: number
  totalFolders:     number
}

// ── Fetch tree ─────────────────────────────────────────────
async function fetchTree(): Promise<FolderTreeResponse> {
  const res = await fetch('/api/folders')
  if (!res.ok) throw new Error('Failed to fetch folders')
  const json = await res.json()
  return json.data
}

export function useFolders() {
  return useQuery({
    queryKey: folderKeys.tree(),
    queryFn:  fetchTree,
    staleTime: 60 * 1000,            // 1 menit
    gcTime:    5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ── Create folder ──────────────────────────────────────────
async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const res = await fetch('/api/folders', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Failed to create folder')
  }

  const json = await res.json()
  return json.data
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.tree() })
    },
  })
}

// ── Update folder (rename / move / color) ──────────────────
async function updateFolder(input: UpdateFolderInput & { id: string }): Promise<Folder> {
  const { id, ...rest } = input
  const res = await fetch(`/api/folders/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(rest),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Failed to update folder')
  }

  const json = await res.json()
  return json.data
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.tree() })
    },
  })
}

// ── Delete folder ──────────────────────────────────────────
async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Failed to delete folder')
  }
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.tree() })
      queryClient.invalidateQueries({ queryKey: ['library'] })  // contents pindah
    },
  })
}

// ── Move content to folder ─────────────────────────────────
async function moveContent(input: MoveContentInput): Promise<void> {
  const res = await fetch(`/api/contents/${input.contentId}/move`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ folderId: input.folderId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Failed to move content')
  }
}

export function useMoveContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: moveContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.tree() })
      queryClient.invalidateQueries({ queryKey: ['library'] })
    },
  })
}

// ── Helper: build breadcrumb path dari folderId ────────────
export function buildBreadcrumb(
  folders: Folder[],
  folderId: string | null,
): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [{ id: null, name: 'Library', color: '#94A3B8' }]

  if (!folderId) return path

  // Flatten tree → map untuk lookup cepat
  const map = new Map<string, Folder>()
  const walk = (items: Folder[]) => {
    items.forEach(f => {
      map.set(f.id, f)
      if (f.children) walk(f.children)
    })
  }
  walk(folders)

  // Backtrack dari current folder ke root
  const chain: Folder[] = []
  let current = map.get(folderId)
  while (current) {
    chain.unshift(current)
    current = current.parentId ? map.get(current.parentId) : undefined
  }

  chain.forEach(f => {
    path.push({ id: f.id, name: f.name, color: f.color })
  })

  return path
}

// ── Helper: get all subfolder IDs (untuk recursive operations) ──
export function getDescendantIds(folder: Folder): string[] {
  const ids = [folder.id]
  if (folder.children) {
    folder.children.forEach(child => {
      ids.push(...getDescendantIds(child))
    })
  }
  return ids
}