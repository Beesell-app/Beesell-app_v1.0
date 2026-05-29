// app/api/tools/remove-bg/route.ts
// ── Quick Tools: Remove Background ───────────────────────────
// POST multipart/form-data: { image: File, option?: 'transparent'|'white'|'black' }
// Returns: image/png binary (langsung), atau JSON { url } kalau pakai storage
//
// Flow:
//   1. Auth check
//   2. Receive image file dari FormData
//   3. Validate (type, size)
//   4. Call Remove.bg API
//   5. Return PNG binary langsung ke browser (tidak perlu upload ke storage dulu)
//
// Kenapa binary langsung (bukan URL):
//   - Quick Tools butuh preview instant, tidak butuh persist
//   - User bisa download dari browser
//   - Lebih cepat (tidak ada round-trip storage)

import { NextResponse }      from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { removeBackground }  from '@/lib/remove-bg'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED  = ['image/jpeg','image/jpg','image/png','image/webp']

export async function POST(req: Request) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Silakan login terlebih dahulu.' }, { status: 401 })
    }

    // ── 2. Parse FormData ─────────────────────────────────────
    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error: 'INVALID_FORM', message: 'Format request tidak valid.' }, { status: 400 }) }

    const imageFile = formData.get('image') as File | null
    const bgOption  = (formData.get('option') as string) ?? 'transparent'
    // bgOption: 'transparent' | 'white' | 'black' | 'custom:#hexcolor'

    if (!imageFile || typeof imageFile === 'string') {
      return NextResponse.json({ error: 'NO_FILE', message: 'File gambar tidak ditemukan.' }, { status: 400 })
    }

    // ── 3. Validate ────────────────────────────────────────────
    if (!ALLOWED.includes(imageFile.type)) {
      return NextResponse.json({
        error: 'INVALID_TYPE',
        message: `Format tidak didukung: ${imageFile.type}. Gunakan JPG, PNG, atau WebP.`,
      }, { status: 400 })
    }

    if (imageFile.size > MAX_SIZE) {
      return NextResponse.json({
        error: 'FILE_TOO_LARGE',
        message: `File terlalu besar (${(imageFile.size/1024/1024).toFixed(1)}MB). Maksimal 10MB.`,
      }, { status: 400 })
    }

    if (imageFile.size < 1000) {
      return NextResponse.json({ error: 'FILE_TOO_SMALL', message: 'File terlalu kecil.' }, { status: 400 })
    }

    // ── 4. Read buffer ────────────────────────────────────────
    const buffer = Buffer.from(await imageFile.arrayBuffer())

    // ── 5. Determine bg color option ──────────────────────────
    let bgColor: string | undefined
    if (bgOption === 'white')   bgColor = 'ffffff'
    if (bgOption === 'black')   bgColor = '000000'
    if (bgOption.startsWith('custom:')) bgColor = bgOption.replace('custom:#', '').replace('#','')

    // ── 6. Call Remove.bg ─────────────────────────────────────
    console.log('[tools/remove-bg] processing:', imageFile.name, imageFile.type, `${(imageFile.size/1024).toFixed(0)}KB`)

    let result: { buffer: Buffer; creditsUsed: number; type: string }
    try {
      result = await removeBackground(buffer, {
        size:    'auto',
        type:    'product',   // optimized for product photos
        format:  'png',       // always PNG for transparency support
        bgColor,
      })
    } catch (e: any) {
      console.error('[tools/remove-bg] Remove.bg error:', e.message)

      // Map specific errors to user-friendly messages
      if (e.message?.includes('credits')) {
        return NextResponse.json({
          error: 'NO_CREDITS',
          message: 'Kredit Remove.bg habis. Hubungi admin atau isi ulang di remove.bg/dashboard.',
        }, { status: 402 })
      }
      if (e.message?.includes('API key') || e.message?.includes('tidak valid')) {
        return NextResponse.json({
          error: 'CONFIG_ERROR',
          message: 'Layanan remove background belum dikonfigurasi. Hubungi admin.',
        }, { status: 500 })
      }
      if (e.message?.includes('rate limit')) {
        return NextResponse.json({
          error: 'RATE_LIMITED',
          message: 'Terlalu banyak request. Tunggu 1 menit lalu coba lagi.',
        }, { status: 429 })
      }

      return NextResponse.json({
        error:   'REMOVE_BG_FAILED',
        message: e.message ?? 'Gagal menghapus background. Coba lagi.',
      }, { status: 500 })
    }

    console.log('[tools/remove-bg] success:', `${result.creditsUsed} credit used, type: ${result.type}`)

    // ── 7. Return PNG binary langsung ─────────────────────────
    return new NextResponse(result.buffer, {
      status:  200,
      headers: {
        'Content-Type':        'image/png',
        'Content-Disposition': `attachment; filename="beesell-nobg-${Date.now()}.png"`,
        'X-Credits-Used':      String(result.creditsUsed),
        'X-Detected-Type':     result.type,
        'Cache-Control':       'no-store',
      },
    })

  } catch (err: any) {
    console.error('[POST /api/tools/remove-bg] unhandled:', err?.message)
    return NextResponse.json({
      error: 'INTERNAL',
      message: err?.message ?? 'Terjadi kesalahan server.',
    }, { status: 500 })
  }
}