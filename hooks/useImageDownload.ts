'use client'
// apps/web-app/lib/hooks/useImageDownload.ts
// Download image dengan format conversion + resize via offscreen canvas
//
// Use cases:
//   1. Download URL ke disk (pakai blob fetch)
//   2. Convert PNG → JPG dengan quality control
//   3. Resize ke target dimensions (1080 / 720 / 400)
//   4. Trigger Fabric canvas export ke specified format
import { useState, useCallback } from 'react'

// ── Format & size options ───────────────────────────────────
export type DownloadFormat = 'png' | 'jpg'
export type DownloadSize = 'full' | 'web' | 'thumbnail' | 'original'

export const SIZE_PRESETS: Record<DownloadSize, { maxDimension: number; label: string }> = {
  full:      { maxDimension: 1080,    label: 'Full HD (1080px)' },
  web:       { maxDimension: 720,     label: 'Web (720px)' },
  thumbnail: { maxDimension: 400,     label: 'Thumbnail (400px)' },
  original:  { maxDimension: Infinity, label: 'Original size' },
}

interface DownloadOptions {
  format?:    DownloadFormat
  size?:      DownloadSize
  quality?:   number  // JPG quality 0-1, default 0.92
  filename?:  string
  prefix?:    string
}

// ── Helper: load image dari URL ke HTMLImageElement ─────────
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// ── Helper: resize + convert via canvas ─────────────────────
async function processImage(
  source: HTMLImageElement | HTMLCanvasElement,
  options: { format: DownloadFormat; maxDimension: number; quality: number },
): Promise<Blob> {
  const sourceWidth  = 'naturalWidth' in source ? source.naturalWidth  : source.width
  const sourceHeight = 'naturalHeight' in source ? source.naturalHeight : source.height

  // Calculate target dimensions (preserve aspect ratio)
  let targetWidth = sourceWidth
  let targetHeight = sourceHeight

  if (options.maxDimension !== Infinity) {
    const longestSide = Math.max(sourceWidth, sourceHeight)
    if (longestSide > options.maxDimension) {
      const ratio = options.maxDimension / longestSide
      targetWidth  = Math.round(sourceWidth * ratio)
      targetHeight = Math.round(sourceHeight * ratio)
    }
  }

  // Render ke offscreen canvas dengan resize
  const canvas = document.createElement('canvas')
  canvas.width  = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  // Untuk JPG, fill white background dulu (transparent → black kalau tidak)
  if (options.format === 'jpg') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, targetWidth, targetHeight)
  }

  // High-quality scaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

  // Export ke blob
  const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png'
  const blobQuality = options.format === 'jpg' ? options.quality : 1.0

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to convert canvas to blob'))
      },
      mimeType,
      blobQuality,
    )
  })
}

// ── Helper: trigger download dari blob ──────────────────────
function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href     = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(objectUrl), 100)
}

// ── Helper: build filename ──────────────────────────────────
function buildFilename(format: DownloadFormat, size: DownloadSize, customFilename?: string, prefix?: string): string {
  if (customFilename) {
    // Pastikan extension cocok
    const cleanName = customFilename.replace(/\.(png|jpg|jpeg|webp)$/i, '')
    return `${cleanName}.${format}`
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
  const sizeLabel = size !== 'original' ? `-${SIZE_PRESETS[size].maxDimension}` : ''
  return `${prefix ?? 'beesell-'}${timestamp}${sizeLabel}.${format}`
}

// ══════════════════════════════════════════════════════════════
// MAIN HOOK
// ══════════════════════════════════════════════════════════════
export function useImageDownload() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Download dari URL ────────────────────────────────────
  const downloadFromUrl = useCallback(async (
    media_url: string,
    options: DownloadOptions = {},
  ): Promise<{ success: boolean; blob?: Blob; sizeBytes?: number }> => {
    setIsDownloading(true)
    setError(null)

    const format  = options.format  ?? 'png'
    const size    = options.size    ?? 'full'
    const quality = options.quality ?? 0.92

    try {
      // 1. Load image
      const img = await loadImage(media_url)

      // 2. Process (resize + convert format)
      const blob = await processImage(img, {
        format,
        maxDimension: SIZE_PRESETS[size].maxDimension,
        quality,
      })

      // 3. Trigger download
      const filename = buildFilename(format, size, options.filename, options.prefix)
      triggerDownload(blob, filename)

      return { success: true, blob, sizeBytes: blob.size }

    } catch (err: any) {
      console.error('[useImageDownload]', err)
      setError(err?.message ?? 'Download gagal')

      // Fallback: open in new tab kalau CORS atau fetch fail
      try {
        window.open(media_url, '_blank')
        return { success: true }
      } catch {
        return { success: false }
      }
    } finally {
      setIsDownloading(false)
    }
  }, [])

  // ── Download dari Fabric Canvas (untuk template editor) ──
  const downloadFromCanvas = useCallback(async (
    canvas: HTMLCanvasElement,
    options: DownloadOptions = {},
  ): Promise<{ success: boolean; blob?: Blob; sizeBytes?: number }> => {
    setIsDownloading(true)
    setError(null)

    const format  = options.format  ?? 'png'
    const size    = options.size    ?? 'full'
    const quality = options.quality ?? 0.92

    try {
      const blob = await processImage(canvas, {
        format,
        maxDimension: SIZE_PRESETS[size].maxDimension,
        quality,
      })

      const filename = buildFilename(format, size, options.filename, options.prefix)
      triggerDownload(blob, filename)

      return { success: true, blob, sizeBytes: blob.size }

    } catch (err: any) {
      console.error('[useImageDownload-canvas]', err)
      setError(err?.message ?? 'Download gagal')
      return { success: false }
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return {
    downloadFromUrl,
    downloadFromCanvas,
    isDownloading,
    error,
  }
}