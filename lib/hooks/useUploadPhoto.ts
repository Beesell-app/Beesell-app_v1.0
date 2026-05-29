'use client'
// apps/web-app/lib/hooks/useUploadPhoto.ts
// Hook untuk upload foto dengan optional bg removal
// Pakai TanStack Query mutation untuk state management
import { useMutation } from '@tanstack/react-query'

export interface UploadPhotoInput {
  file:       File
  removeBg?:  boolean
  contentId?: string
}

export interface UploadPhotoResponse {
  success:  boolean
  uploadId: string
  original: {
    url:       string
    path:      string
    sizeBytes: number
  }
  processed: {
    url:         string
    path:        string
    creditsUsed: number
  } | null
  bgRemovalError: string | null
}

interface UploadPhotoError {
  error:   string
  message: string
}

async function uploadPhoto(input: UploadPhotoInput): Promise<UploadPhotoResponse> {
  const formData = new FormData()
  formData.append('file', input.file)

  if (input.removeBg) {
    formData.append('removeBg', 'true')
  }
  if (input.contentId) {
    formData.append('contentId', input.contentId)
  }

  const res = await fetch('/api/upload/photo', {
    method: 'POST',
    body:   formData,
  })

  if (!res.ok) {
    let errBody: UploadPhotoError
    try {
      errBody = await res.json()
    } catch {
      errBody = { error: 'UNKNOWN', message: `HTTP ${res.status}` }
    }
    throw new Error(errBody.message)
  }

  return res.json()
}

// ── Main hook ────────────────────────────────────────────
export function useUploadPhoto() {
  return useMutation<UploadPhotoResponse, Error, UploadPhotoInput>({
    mutationFn: uploadPhoto,
  })
}