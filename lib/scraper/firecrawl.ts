// apps/web-app/lib/scraper/firecrawl.ts
// ── Firecrawl scraper — primary strategy ──────────────────────
// Handles JavaScript rendering + CAPTCHA bypass + residential proxy
// Paling reliable untuk Shopee/Tokopedia. Mahal: ~5 credit/scrape
// (~$0.008/scrape di paid tier)
//
// Docs: https://docs.firecrawl.dev
import { SCRAPE_TIMEOUT_MS } from './types'
import type { Marketplace } from './types'

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape'

// ── Schema per marketplace — Firecrawl extract via LLM ───────
// Firecrawl pakai GPT-4o-mini under the hood untuk parse HTML → JSON
const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    name:        { type: 'string',  description: 'Nama produk lengkap' },
    price:       { type: 'string',  description: 'Harga produk dalam format asli, contoh: "Rp 99.000"' },
    priceNumeric:{ type: 'number',  description: 'Harga dalam angka (int), contoh: 99000' },
    description: { type: 'string',  description: 'Deskripsi produk singkat (max 500 kata)' },
    images:      { type: 'array',   items: { type: 'string' }, description: 'Array URL gambar produk (max 5)' },
    sellerName:  { type: 'string',  description: 'Nama toko/seller' },
    rating:      { type: 'number',  description: 'Rating 0-5' },
    soldCount:   { type: 'number',  description: 'Jumlah terjual (angka saja)' },
    location:    { type: 'string',  description: 'Kota/lokasi seller' },
  },
  required: ['name', 'price'],
}

interface FirecrawlResponse {
  success: boolean
  data?: {
    extract?:   Record<string, any>
    metadata?:  { title?: string; description?: string; ogImage?: string }
    markdown?:  string
    html?:      string
    error?:     string
    statusCode?: number
  }
  error?: string
}

export interface FirecrawlScrapeResult {
  success:     boolean
  data?:       {
    name:         string
    price:        string | null
    priceNumeric: number | null
    description:  string | null
    images:       string[]
    sellerName:   string | null
    rating:       number | null
    soldCount:    number | null
    location:     string | null
  }
  error?: 'timeout' | 'blocked' | 'api_error' | 'parse_failed' | 'rate_limited'
  statusCode?: number
}

// ── Main scraper ─────────────────────────────────────────────
export async function scrapeWithFirecrawl(
  url: string,
  marketplace: Marketplace,
): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    console.error('[firecrawl] FIRECRAWL_API_KEY not set')
    return { success: false, error: 'api_error' }
  }

  // AbortController untuk timeout 10 detik
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS)

  try {
    // ── Request body Firecrawl v1 ─────────────────────────
    // formats: ['extract'] → AI extraction via JSON schema
    // waitFor:  tunggu JS render (Shopee butuh ~2-3 detik)
    // proxy:    'stealth' = residential proxy (untuk Shopee block)
    const body = {
      url,
      formats:         ['extract'],
      onlyMainContent: true,
      waitFor:         marketplace === 'shopee' ? 3000 : 2000,
      timeout:         SCRAPE_TIMEOUT_MS - 1000,  // Firecrawl timeout lebih pendek dari kita
      blockAds:        true,
      removeBase64Images: true,
      // Stealth mode = residential proxy (lebih mahal tapi perlu untuk Shopee)
      proxy:           marketplace === 'shopee' ? 'stealth' : 'basic',
      // Location Indonesia untuk lolos geo-check
      location:        { country: 'ID' },
      extract: {
        schema:  EXTRACTION_SCHEMA,
        prompt:  `Ekstrak informasi produk dari halaman ${marketplace}. Pastikan harga dalam format asli Indonesia (Rp) dan konversi ke angka untuk priceNumeric.`,
      },
    }

    const res = await fetch(FIRECRAWL_API_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    })

    clearTimeout(timeout)

    // ── Error handling ───────────────────────────────────
    if (res.status === 429) {
      return { success: false, error: 'rate_limited', statusCode: 429 }
    }

    if (res.status === 403 || res.status === 401) {
      return { success: false, error: 'api_error', statusCode: res.status }
    }

    const json: FirecrawlResponse = await res.json()

    if (!json.success || !json.data) {
      // Firecrawl returned error tapi HTTP 200
      const errMsg = json.error ?? json.data?.error ?? ''
      if (errMsg.toLowerCase().includes('blocked') || errMsg.toLowerCase().includes('captcha')) {
        return { success: false, error: 'blocked' }
      }
      return { success: false, error: 'parse_failed' }
    }

    const extract = json.data.extract
    if (!extract || !extract.name) {
      return { success: false, error: 'parse_failed' }
    }

    // ── Normalize output ─────────────────────────────────
    return {
      success: true,
      data: {
        name:         String(extract.name).trim(),
        price:        extract.price ? String(extract.price).trim() : null,
        priceNumeric: typeof extract.priceNumeric === 'number'
                        ? Math.round(extract.priceNumeric)
                        : null,
        description:  extract.description ? String(extract.description).trim().slice(0, 2000) : null,
        images:       Array.isArray(extract.images)
                        ? extract.images.filter((u: any) => typeof u === 'string' && u.startsWith('http')).slice(0, 5)
                        : [],
        sellerName:   extract.sellerName ? String(extract.sellerName).trim() : null,
        rating:       typeof extract.rating === 'number' ? extract.rating : null,
        soldCount:    typeof extract.soldCount === 'number' ? extract.soldCount : null,
        location:     extract.location ? String(extract.location).trim() : null,
      },
    }

  } catch (err: any) {
    clearTimeout(timeout)

    if (err.name === 'AbortError') {
      return { success: false, error: 'timeout' }
    }

    console.error('[firecrawl] error:', err.message)
    return { success: false, error: 'api_error' }
  }
}