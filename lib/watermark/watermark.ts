// apps/web-app/lib/watermark/watermark.ts
// ── Sharp server-side watermark ───────────────────────────────
// Applies "BeeSell AI" text watermark + logo to generated images
// Only called for free plan users.
// Runs server-side only (Sharp = Node.js, never browser)
import sharp from 'sharp'

export interface WatermarkOptions {
  opacity?:  number    // 0-1, default 0.35
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center'
  size?:     'small' | 'medium' | 'large'   // relative to image size
}

// ── SVG watermark template ────────────────────────────────────
function buildWatermarkSvg(
  imgWidth:  number,
  imgHeight: number,
  opts:      WatermarkOptions,
): Buffer {
  const size     = opts.size ?? 'medium'
  const fontSize = size === 'small' ? 20 : size === 'large' ? 36 : 26
  const padding  = Math.round(imgWidth * 0.03)

  // Logo area size
  const logoSize = fontSize + 4
  const textW    = Math.round(fontSize * 6.5)   // "BeeSell AI" approx width
  const totalW   = logoSize + 6 + textW
  const totalH   = fontSize + 16

  // Compute position
  let x: number, y: number
  const pos = opts.position ?? 'bottom-right'

  if (pos === 'bottom-right') {
    x = imgWidth  - totalW - padding
    y = imgHeight - totalH - padding
  } else if (pos === 'bottom-left') {
    x = padding
    y = imgHeight - totalH - padding
  } else if (pos === 'bottom-center') {
    x = (imgWidth - totalW) / 2
    y = imgHeight - totalH - padding
  } else {
    x = (imgWidth  - totalW) / 2
    y = (imgHeight - totalH) / 2
  }

  const alpha = opts.opacity ?? 0.35

  return Buffer.from(`
    <svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.4)" flood-opacity="1"/>
        </filter>
      </defs>
      <g opacity="${alpha}" transform="translate(${x}, ${y})">
        <!-- Background pill -->
        <rect
          x="0" y="0"
          width="${totalW}" height="${totalH}"
          rx="${totalH / 2}"
          fill="rgba(15,23,42,0.65)"
        />

        <!-- Sparkle icon (✨ approximation via paths) -->
        <text
          x="${logoSize / 2 + 6}"
          y="${totalH / 2 + fontSize * 0.38}"
          text-anchor="middle"
          font-family="system-ui, sans-serif"
          font-size="${fontSize * 0.85}"
          fill="white"
        >✨</text>

        <!-- Brand name text -->
        <text
          x="${logoSize + 10}"
          y="${totalH / 2 + fontSize * 0.38}"
          font-family="DM Sans, system-ui, -apple-system, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          fill="white"
          letter-spacing="-0.5"
        >BeeSell AI</text>
      </g>
    </svg>
  `)
}

// ── Main watermark function ───────────────────────────────────
export async function applyWatermark(
  inputBuffer: Buffer,
  opts:        WatermarkOptions = {},
): Promise<Buffer> {
  // Get image dimensions
  const metadata = await sharp(inputBuffer).metadata()
  const { width = 1080, height = 1080 } = metadata

  // Build SVG watermark
  const watermarkSvg = buildWatermarkSvg(width, height, opts)

  // Composite watermark onto image
  const result = await sharp(inputBuffer)
    .composite([{
      input:   watermarkSvg,
      blend:   'over',
      gravity: 'northwest',  // position handled by SVG coordinates
    }])
    .jpeg({ quality: 92 })
    .toBuffer()

  return result
}

// ── Apply to image URL (fetch → watermark → return buffer) ────
export async function applyWatermarkToUrl(
  media_url: string,
  opts:     WatermarkOptions = {},
): Promise<Buffer> {
  const res = await fetch(media_url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)

  const arrayBuffer = await res.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  return applyWatermark(buffer, opts)
}

// ── Upload watermarked image to storage ───────────────────────
// Returns new URL of watermarked image in Supabase Storage
export async function watermarkAndStore(
  media_url:  string,
  tenant_id:  string,
  contentId: string,
  opts:      WatermarkOptions = {},
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const watermarked = await applyWatermarkToUrl(media_url, opts)

  const path = `${tenant_id}/${contentId}/watermarked.jpg`

  const { error } = await supabase.storage
    .from('media')
    .upload(path, watermarked, {
      contentType: 'image/jpeg',
      upsert:      true,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return data.publicUrl
}