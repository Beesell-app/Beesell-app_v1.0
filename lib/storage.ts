// apps/web-app/lib/storage.ts
// Storage helper — extended dengan uploadBuffer untuk file uploads
// downloadAndUpload: untuk Replicate URL → Supabase
// uploadBuffer: untuk user upload dari frontend
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL              = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autorefresh_token: false },
})

const BUCKET_NAME = 'content-media'

// ── Download dari URL eksternal lalu upload (existing) ──────
export async function downloadAndUpload(params: {
  sourceUrl: string
  tenant_id:  string
  contentId: string
  filename?: string
}): Promise<{ publicUrl: string; storagePath: string }> {
  const res = await fetch(params.sourceUrl)
  if (!res.ok) {
    throw new Error(`Failed to download image: HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const buffer = await blob.arrayBuffer()

  const ext         = (params.sourceUrl.split('.').pop()?.split('?')[0] || 'png').toLowerCase()
  const contentType = ext === 'png'  ? 'image/png'
                    : ext === 'webp' ? 'image/webp'
                    : 'image/jpeg'

  const filename    = params.filename ?? `${Date.now()}.${ext}`
  const storagePath = `tenants/${params.tenant_id}/contents/${params.contentId}/${filename}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      upsert: false,
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)

  return { publicUrl, storagePath }
}

// ── Upload buffer (untuk user upload dari frontend) ─────────
export async function uploadBuffer(params: {
  buffer:      Buffer | ArrayBuffer | Uint8Array
  tenant_id:    string
  folder:      'uploads' | 'processed' | 'generated'  // organize file
  contentId?:  string                                  // optional, kalau associated dengan content
  filename:    string                                  // sudah include extension
  contentType: string                                  // e.g. 'image/jpeg'
}): Promise<{ publicUrl: string; storagePath: string; sizeBytes: number }> {

  const folderPart = params.contentId
    ? `tenants/${params.tenant_id}/${params.folder}/${params.contentId}`
    : `tenants/${params.tenant_id}/${params.folder}`

  const storagePath = `${folderPart}/${params.filename}`

  // Convert ArrayBuffer/Uint8Array ke Buffer kalau perlu
  let uploadData: Buffer
  if (params.buffer instanceof Buffer) {
    uploadData = params.buffer
  } else if (params.buffer instanceof ArrayBuffer) {
    uploadData = Buffer.from(params.buffer)
  } else {
    uploadData = Buffer.from(params.buffer)
  }

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, uploadData, {
      contentType:  params.contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      upsert:       false,
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)

  return {
    publicUrl,
    storagePath,
    sizeBytes: uploadData.length,
  }
}

// ── Delete file ─────────────────────────────────────────────
export async function deleteStorageFile(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([storagePath])

  if (error) {
    console.error('[storage] Delete failed:', error.message)
  }
}

// ── Bulk delete (untuk content delete) ──────────────────────
export async function deleteStorageFiles(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove(storagePaths)

  if (error) {
    console.error('[storage] Bulk delete failed:', error.message)
  }
}

// ── File size validators ────────────────────────────────────
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export function validateImageFile(file: { type: string; size: number }): {
  valid: boolean
  error?: string
} {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `File type ${file.type} tidak didukung. Gunakan JPG, PNG, atau WebP.`,
    }
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file ${Math.round(file.size / 1024 / 1024)}MB melebihi batas 10MB.`,
    }
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File kosong atau corrupt.',
    }
  }

  return { valid: true }
}