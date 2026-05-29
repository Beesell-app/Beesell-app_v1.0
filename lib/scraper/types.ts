// apps/web-app/lib/scraper/types.ts
// Shared types untuk semua scraper strategy

export type Marketplace = 'shopee' | 'tokopedia' | 'lazada' | 'blibli' | 'tiktokshop' | 'unknown'

export interface ScrapedProduct {
  // Core fields
  name:         string
  price:        string | null    // format asli, e.g. "Rp 99.000", parsing di frontend
  priceNumeric: number | null    // 99000 (untuk perhitungan)
  description:  string | null
  images:       string[]         // array URL (max 5)

  // Metadata
  marketplace:  Marketplace
  url:          string
  sellerName:   string | null
  rating:       number | null    // 0-5
  soldCount:    number | null    // jumlah terjual
  location:     string | null    // kota seller

  // Scraper metadata
  scrapedAt:    string           // ISO datetime
  strategy:     ScrapeStrategy
  elapsedMs:    number
}

export type ScrapeStrategy = 'firecrawl' | 'cheerio' | 'playwright' | 'manual'

export interface ScrapeResult {
  success:  boolean
  data?:    ScrapedProduct
  error?:   ScrapeError
  fallback?: 'manual_required'
}

export type ScrapeError =
  | 'invalid_url'
  | 'unsupported_marketplace'
  | 'timeout'
  | 'blocked'            // CAPTCHA, login wall, IP ban
  | 'not_found'          // produk sudah dihapus
  | 'parse_failed'       // HTML ada tapi struktur berubah
  | 'api_error'          // Firecrawl error
  | 'rate_limited'
  | 'unknown'

export const SCRAPE_TIMEOUT_MS = 10_000  // 10 detik max