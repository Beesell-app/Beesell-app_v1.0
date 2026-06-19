// app/api/tools/remove-bg/route.ts
// ══════════════════════════════════════════════════════════════
// Quick Tools — Remove Background (BRIA RMBG-2.0)
// ══════════════════════════════════════════════════════════════
//
// POST /api/tools/remove-bg
// Body: multipart/form-data
//   image   File    Gambar produk (JPG/PNG/WebP, max 10MB)
//   option  string  'transparent' | 'white' | 'black' | 'custom:#rrggbb'
//
// Response: PNG binary langsung (Content-Type: image/png)
//
// Provider: BRIA RMBG-2.0 — open source, ~Rp18/gambar
// Env required: REPLICATE_API_TOKEN (sudah ada di project)

import { NextResponse }                    from 'next/server'
import { createClient }                    from '@/lib/supabase/server'
import { removeBackground, parseBgOption } from '@/lib/remove-bg'
import { enforceToolAccess, consumeCredits, logToolUsage } from '@/lib/tools/enforce'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60   // BRIA biasanya 3–8 detik, timeout buffer 60s

const MAX_BYTES  = 10 * 1024 * 1024  // 10 MB
const ALLOWED    = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export async function POST(req: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Silakan login terlebih dahulu.' },
        { status: 401 },
      )
    }
    const enforce = await enforceToolAccess(supabase, user.id, 'remove-bg')
      if (!enforce.allowed) {
        return NextResponse.json({ error:'ACCESS_DENIED', message:enforce.reason }, { status:enforce.status })
      }
    const startTime = Date.now()
    // ── Parse multipart ───────────────────────────────────────
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json(
        { error: 'INVALID_FORM', message: 'Format request tidak valid.' },
        { status: 400 },
      )
    }

    const imageFile = formData.get('image')  as File   | null
    const bgOption  = formData.get('option') as string | null ?? 'transparent'

    if (!imageFile || typeof imageFile === 'string') {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'File gambar tidak ditemukan dalam request.' },
        { status: 400 },
      )
    }

    // ── Validate ──────────────────────────────────────────────
    if (!ALLOWED.has(imageFile.type)) {
      return NextResponse.json({
        error:   'INVALID_TYPE',
        message: `Format tidak didukung: ${imageFile.type}. Gunakan JPG, PNG, atau WebP.`,
      }, { status: 400 })
    }

    if (imageFile.size > MAX_BYTES) {
      return NextResponse.json({
        error:   'FILE_TOO_LARGE',
        message: `Ukuran file terlalu besar (${(imageFile.size / 1024 / 1024).toFixed(1)} MB). Maksimal 10 MB.`,
      }, { status: 413 })
    }

    if (imageFile.size < 1_000) {
      return NextResponse.json(
        { error: 'FILE_TOO_SMALL', message: 'File terlalu kecil atau corrupt.' },
        { status: 400 },
      )
    }

    // ── Remove background ─────────────────────────────────────
    const buffer  = Buffer.from(await imageFile.arrayBuffer())
    const bgColor = parseBgOption(bgOption)

    console.log(
      `[remove-bg] BRIA RMBG-2.0 | file=${imageFile.name}`,
      `size=${(imageFile.size / 1024).toFixed(0)}KB`,
      `bg=${bgOption}`,
    )

    let result: Awaited<ReturnType<typeof removeBackground>>
    try {
      result = await removeBackground(buffer, {
        type:    'product',
        bgColor,
        // provider tidak di-set → default BRIA RMBG-2.0
      })
    } catch (e: any) {
      const msg = e.message ?? ''
      console.error('[remove-bg] error:', msg)

      if (msg.includes('REPLICATE_API_TOKEN')) {
        return NextResponse.json({
          error:   'CONFIG_ERROR',
          message: 'Layanan AI belum dikonfigurasi. Hubungi admin.',
        }, { status: 500 })
      }
      if (msg.includes('timeout')) {
        return NextResponse.json({
          error:   'TIMEOUT',
          message: 'AI sedang sibuk, coba lagi dalam 30 detik.',
        }, { status: 503 })
      }
      if (msg.includes('rate limit')) {
        return NextResponse.json({
          error:   'RATE_LIMITED',
          message: 'Terlalu banyak request. Tunggu 1 menit lalu coba lagi.',
        }, { status: 429 })
      }
      return NextResponse.json({
        error:   'REMOVE_BG_FAILED',
        message: msg || 'Gagal menghapus background. Coba lagi.',
      }, { status: 500 })
    }

    console.log(
      `[remove-bg] OK | provider=${result.provider}`,
      `cost=Rp${result.costIdr}`,
      `size=${result.buffer.length}B`,
    )
if (!enforce.isSuperuser && enforce.creditCost > 0) {
      await consumeCredits(supabase, user.id, 'remove-bg', enforce.creditCost, { description:'Remove Background' })
    }
    await logToolUsage(supabase, user.id, 'remove-bg', result.provider, result.costIdr / 16000, Date.now() - startTime)
    // ── Kembalikan PNG binary langsung ────────────────────────
    return new NextResponse(
  new Uint8Array(result.buffer),
  {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="beesell-nobg-${Date.now()}.png"`,
      'X-Provider': result.provider,
      'X-Cost-Idr': String(result.costIdr),
      'X-Subject-Type': result.type,
      'Cache-Control': 'no-store',
    },
  }
)

  } catch (err: any) {
    console.error('[POST /api/tools/remove-bg] unhandled:', err?.message)
    return NextResponse.json({
      error:   'INTERNAL',
      message: err?.message ?? 'Terjadi kesalahan server.',
    }, { status: 500 })
  }
}