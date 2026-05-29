'use client'
// apps/web-app/lib/hooks/useSaveToLibrary.ts
// Mutation hook untuk save image ke library
// 2 modes: URL (sudah di Supabase) atau Blob (upload baru)
import { useMutation, useQueryClient } from '@tanstack/react-query'

// ── URL save input ──────────────────────────────────────────
export interface SaveUrlInput {
  media_url:    string
  storagePath?: string
  title?:      string
  description?: string
  tags?:       string[]
  format?:     'png' | 'jpg' | 'jpeg' | 'webp'
  sizeBytes?:  number
  width?:      number
  height?:     number
  contentId?:  string                 // attach ke content existing
  source?:     'template_editor' | 'image_generator' | 'upload' | 'unknown'
  metadata?:   Record<string, any>
}

// ── Blob save input ─────────────────────────────────────────
export interface SaveBlobInput {
  blob:        Blob
  filename?:   string
  title?:      string
  description?: string
  tags?:       string[]
  source?:     'template_editor' | 'image_generator' | 'upload' | 'unknown'
  metadata?:   Record<string, any>
}

interface SaveResponse {
  success: boolean
  mode:    'create' | 'attach' | 'upload'
  data: {
    id?:        string
    contentId?: string
    title?:     string
    media_urls:  string[]
    sizeBytes?: number
    created_at?: string
  }
}

// ── Save URL ────────────────────────────────────────────────
async function saveUrl(input: SaveUrlInput): Promise<SaveResponse> {
  const res = await fetch('/api/library/save', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }

  return res.json()
}

// ── Save Blob (upload) ──────────────────────────────────────
async function saveBlob(input: SaveBlobInput): Promise<SaveResponse> {
  const formData = new FormData()

  formData.append('file', input.blob, input.filename ?? 'image.png')

  if (input.title)       formData.append('title', input.title)
  if (input.description) formData.append('description', input.description)
  if (input.tags)        formData.append('tags', input.tags.join(','))
  if (input.source)      formData.append('source', input.source)
  if (input.metadata)    formData.append('metadata', JSON.stringify(input.metadata))

  const res = await fetch('/api/library/save', {
    method: 'POST',
    body:   formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }

  return res.json()
}

// ── Hook: save URL ──────────────────────────────────────────
export function useSaveUrlToLibrary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveUrl,
    onSuccess: () => {
      // Invalidate content list cache
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
  })
}

// ── Hook: save blob ─────────────────────────────────────────
export function useSaveBlobToLibrary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveBlob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
  })
}