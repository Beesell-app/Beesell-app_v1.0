// lib/studio/image-validation.ts
// ══════════════════════════════════════════════════════════════
// Image dimension validation for product photos
// Support: 1920×1080 (16:9), 1080×1920 (9:16), 1080×1080 (1:1)

export interface ImageValidationResult {
  valid: boolean
  width: number
  height: number
  error?: string
  warning?: string
  optimal: boolean
}

/**
 * Validate image dimensions
 * - Min: 512×512px
 * - Optimal: 1920×1080, 1080×1920, 1080×1080
 */
export async function validateImageDimensions(
  file: File
): Promise<ImageValidationResult> {
  return new Promise((resolve, reject) => {
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      reject(
        new Error('Format harus JPG atau PNG')
      )
      return
    }

    // Check file size
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      reject(
        new Error(`File terlalu besar (max 10MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      )
      return
    }

    // Create image element to check dimensions
    const img = new Image()

    img.onload = () => {
      const width = img.width
      const height = img.height
      const minDim = 512

      // Check minimum dimensions
      if (width < minDim || height < minDim) {
        reject(
          new Error(
            `Resolusi minimal ${minDim}×${minDim}px (sekarang ${width}×${height}px)`
          )
        )
        return
      }

      // Check if optimal dimensions
      const optimalDimensions = [
        { w: 1920, h: 1080 }, // 16:9 landscape
        { w: 1080, h: 1920 }, // 9:16 portrait
        { w: 1080, h: 1080 }, // 1:1 square
      ]

      const isOptimal = optimalDimensions.some(
        d => width === d.w && height === d.h
      )

      let warning: string | undefined

      if (!isOptimal) {
        const aspectRatio = (width / height).toFixed(2)
        warning = `Resolusi ${width}×${height}px (aspect ratio ${aspectRatio}:1). ` +
          `Optimal: 1920×1080 (16:9), 1080×1920 (9:16), atau 1080×1080 (1:1)`
      }

      resolve({
        valid: true,
        width,
        height,
        optimal: isOptimal,
        warning,
      })
    }

    img.onerror = () => {
      reject(new Error('File gambar tidak valid'))
    }

    // Load image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get aspect ratio from dimensions
 */
export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  const w = width / divisor
  const h = height / divisor
  return `${w}:${h}`
}

/**
 * Format dimensions for display
 */
export function formatDimensions(width: number, height: number): string {
  return `${width}×${height}px (${getAspectRatio(width, height)})`
}