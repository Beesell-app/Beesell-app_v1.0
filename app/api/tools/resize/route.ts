// app/api/tools/resize/route.ts
// ── Quick Tools: Resize Image ─────────────────────────────────
// POST multipart/form-data: { image: File, option: preset_name }
// Preset sizes for all major marketplaces & social platforms

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 20

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED  = ['image/jpeg','image/jpg','image/png','image/webp']

const PRESETS: Record<string, { w: number; h: number; label: string; fit: 'cover'|'contain'|'fill' }> = {
  'shopee':          { w:800,  h:800,  label:'Shopee Produk',          fit:'contain' },
  'tokopedia':       { w:700,  h:700,  label:'Tokopedia Produk',        fit:'contain' },
  'lazada':          { w:800,  h:800,  label:'Lazada Produk',           fit:'contain' },
  'instagram-sq':    { w:1080, h:1080, label:'Instagram Square',        fit:'cover'   },
  'instagram-port':  { w:1080, h:1350, label:'Instagram Portrait',      fit:'cover'   },
  'instagram-land':  { w:1080, h:608,  label:'Instagram Landscape',     fit:'cover'   },
  'tiktok':          { w:1080, h:1920, label:'TikTok / Reels',          fit:'cover'   },
  'whatsapp':        { w:800,  h:800,  label:'WhatsApp Catalog',        fit:'contain' },
  'facebook':        { w:1200, h:630,  label:'Facebook Post',           fit:'cover'   },
  'youtube-thumb':   { w:1280, h:720,  label:'YouTube Thumbnail',       fit:'cover'   },
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error: 'INVALID_FORM' }, { status: 400 }) }

    const imageFile = formData.get('image') as File | null
    const preset    = (formData.get('option') as string) ?? 'shopee'

    if (!imageFile) return NextResponse.json({ error: 'NO_FILE', message: 'File tidak ditemukan.' }, { status: 400 })
    if (!ALLOWED.includes(imageFile.type)) return NextResponse.json({ error: 'INVALID_TYPE' }, { status: 400 })
    if (imageFile.size > MAX_SIZE) return NextResponse.json({ error: 'FILE_TOO_LARGE', message: 'Maks 10MB.' }, { status: 400 })

    const presetConfig = PRESETS[preset]
    if (!presetConfig) return NextResponse.json({ error: 'INVALID_PRESET', message: `Preset tidak dikenal: ${preset}` }, { status: 400 })

    const buffer = Buffer.from(await imageFile.arrayBuffer())

    // Use Sharp for resize
    let sharp: any
    try {
      sharp = (await import('sharp')).default
    } catch {
      return NextResponse.json({
        error: 'SHARP_NOT_FOUND',
        message: 'Library resize tidak tersedia. Jalankan: npm install sharp',
      }, { status: 500 })
    }

    const { w, h, fit } = presetConfig

    const resized = await sharp(buffer)
      .resize(w, h, {
        fit,
        background: fit === 'contain' ? { r:255, g:255, b:255, alpha:1 } : undefined,
        withoutEnlargement: false,
      })
      .jpeg({ quality: 92, progressive: true })
      .toBuffer()

    console.log('[tools/resize] success:', preset, `${w}×${h}`, `${(resized.length/1024).toFixed(0)}KB`)

    return new NextResponse(resized, {
      status: 200,
      headers: {
        'Content-Type':        'image/jpeg',
        'Content-Disposition': `attachment; filename="beesell-${preset}-${w}x${h}.jpg"`,
        'X-Preset':            preset,
        'X-Dimensions':        `${w}x${h}`,
        'Cache-Control':       'no-store',
      },
    })

  } catch (err: any) {
    console.error('[POST /api/tools/resize]', err?.message)
    return NextResponse.json({ error: 'INTERNAL', message: err?.message ?? 'Terjadi kesalahan.' }, { status: 500 })
  }
}