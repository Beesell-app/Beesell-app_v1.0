// apps/web-app/app/api/scrape/product/route.ts
// ── POST /api/scrape/product ──────────────────────────────────
// Body: { url: string }
// Response:
//   200 → { success: true, data: ScrapedProduct }
//   200 → { success: false, fallback: 'manual_required', error: string }
//   401 → unauthorized
//   429 → rate limited
import { createClient } from '@/lib/supabase/server'
import { scrapeProduct } from '@/lib/scraper'
import { z }             from 'zod'
import { Ratelimit }     from '@upstash/ratelimit'
import { Redis }         from '@upstash/redis'
import { NextResponse }  from 'next/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 15  // 15 detik max (scrape timeout 10 + buffer)

// ── Rate limiter: 20 scrape/menit/user ────────────────────────
// Firecrawl mahal (~$0.008/call) → throttle agresif
const rateLimiter = new Ratelimit({
  redis:   Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix:  'rl:scrape',
})

const RequestSchema = z.object({
  url: z.string().url('URL tidak valid').max(500),
})

export async function POST(req: Request) {
  try {
    // ── 1. Auth ───────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Rate limit ─────────────────────────────────────
    const { success: rlOk, remaining } = await rateLimiter.limit(user.id)
    if (!rlOk) {
      return NextResponse.json(
        {
          error:   'RATE_LIMITED',
          message: 'Terlalu banyak request. Tunggu 1 menit.',
        },
        { status: 429 },
      )
    }

    // ── 3. Validate body ──────────────────────────────────
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Input tidak valid',
        },
        { status: 400 },
      )
    }

    // ── 4. Scrape ─────────────────────────────────────────
    const result = await scrapeProduct(parsed.data.url)

    // Bukan error HTTP — selalu return 200 agar client bisa handle fallback mode
    return NextResponse.json(
      {
        success:  result.success,
        data:     result.data     ?? null,
        error:    result.error    ?? null,
        fallback: result.fallback ?? null,
        message:  errorToMessage(result.error),
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
        },
      },
    )

  } catch (err: any) {
    console.error('[POST /api/scrape/product]', err)
    return NextResponse.json(
      {
        success:  false,
        error:    'unknown',
        fallback: 'manual_required',
        message:  'Terjadi kesalahan. Masukkan produk secara manual.',
      },
      { status: 200 },
    )
  }
}

// ── Error → user-friendly message ────────────────────────────
function errorToMessage(error: string | null | undefined): string | null {
  if (!error) return null

  const messages: Record<string, string> = {
    invalid_url:             'URL tidak valid. Cek lagi linknya ya.',
    unsupported_marketplace: 'Marketplace ini belum didukung. Silakan input manual.',
    timeout:                 'Server marketplace lambat. Coba lagi atau input manual.',
    blocked:                 'Marketplace memblokir akses. Silakan input produk manual.',
    not_found:               'Produk tidak ditemukan. Cek URL atau produk mungkin sudah dihapus.',
    parse_failed:            'Gagal membaca data produk. Silakan input manual.',
    api_error:               'Layanan scraping error. Coba lagi atau input manual.',
    rate_limited:            'Terlalu banyak request. Tunggu sebentar.',
    unknown:                 'Gagal mengambil data. Silakan input manual.',
  }

  return messages[error] ?? messages.unknown
}