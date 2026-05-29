// apps/web-app/lib/scraper/index.ts
// ── Main scraper orchestrator ────────────────────────────────
// Strategy chain:
//   1. Cache check (Redis, TTL 24 jam) — URL sama = return cached
//   2. Cheerio (cepat, gratis) — coba dulu untuk Tokopedia/Blibli
//   3. Firecrawl (premium, reliable) — fallback kalau Cheerio fail
//   4. Manual mode — jika semua gagal, user input sendiri
// ─────────────────────────────────────────────────────────────

import { scrapeWithFirecrawl }            from './firecrawl'
import { scrapeWithCheerio }              from './cheerio-fallback'
import { Redis }                           from '@upstash/redis'
import type { ScrapeResult, ScrapedProduct, ScrapeStrategy } from './types'
import { parseProductUrl, normalizeUrl } from './url-parser'

const redis = Redis.fromEnv()

const CACHE_PREFIX = 'scrape:product:'
const CACHE_TTL    = 60 * 60 * 24  // 24 jam — harga mungkin berubah

// ── Cache helpers ────────────────────────────────────────────
async function getCachedScrape(url: string): Promise<ScrapedProduct | null> {
  try {
    const cached = await redis.get<ScrapedProduct>(CACHE_PREFIX + normalizeUrl(url))
    return cached ?? null
  } catch (err) {
    console.warn('[scraper] Redis cache read error:', err)
    return null
  }
}

async function setCachedScrape(url: string, data: ScrapedProduct): Promise<void> {
  try {
    await redis.set(CACHE_PREFIX + normalizeUrl(url), data, { ex: CACHE_TTL })
  } catch (err) {
    console.warn('[scraper] Redis cache write error:', err)
  }
}

// ================================================================
// scrapeProduct — main entry point
// ================================================================
export async function scrapeProduct(url: string): Promise<ScrapeResult> {
  const startedAt = Date.now()

  // ── 1. Validate + parse URL ──────────────────────────────
  const parsed = parseProductUrl(url)

  if (!parsed.valid) {
    return {
      success:  false,
      error:    parsed.marketplace === 'unknown' ? 'unsupported_marketplace' : 'invalid_url',
      fallback: 'manual_required',
    }
  }

  if (parsed.marketplace === 'unknown') {
    return {
      success:  false,
      error:    'unsupported_marketplace',
      fallback: 'manual_required',
    }
  }

  const normalizedUrl = normalizeUrl(parsed.url)

  // ── 2. Cache check ───────────────────────────────────────
  const cached = await getCachedScrape(normalizedUrl)
  if (cached) {
    return {
      success: true,
      data: { ...cached, elapsedMs: Date.now() - startedAt },
    }
  }

  // ── 3. Strategy chain ────────────────────────────────────
  // Shopee & Lazada → langsung Firecrawl (Cheerio pasti gagal)
  // Tokopedia & Blibli → coba Cheerio dulu, fallback Firecrawl

  const useCheerioFirst = parsed.marketplace === 'tokopedia' || parsed.marketplace === 'blibli'

  // ── Attempt 1: Cheerio (untuk marketplace yang support) ──
  if (useCheerioFirst) {
    const cheerioResult = await scrapeWithCheerio(normalizedUrl, parsed.marketplace)

    if (cheerioResult.success && cheerioResult.data) {
      const scrapedProduct: ScrapedProduct = {
        ...cheerioResult.data,
        marketplace: parsed.marketplace,
        url:         normalizedUrl,
        scrapedAt:   new Date().toISOString(),
        strategy:    'cheerio' as ScrapeStrategy,
        elapsedMs:   Date.now() - startedAt,
      }

      // Validasi kualitas data — kalau name kosong/price kosong, coba Firecrawl
      if (scrapedProduct.name && (scrapedProduct.price || scrapedProduct.priceNumeric)) {
        await setCachedScrape(normalizedUrl, scrapedProduct)
        return { success: true, data: scrapedProduct }
      }
    }

    // Cheerio gagal atau data kurang lengkap → fallthrough ke Firecrawl
  }

  // ── Attempt 2: Firecrawl (primary untuk Shopee, fallback untuk lain) ──
  const fcResult = await scrapeWithFirecrawl(normalizedUrl, parsed.marketplace)

  if (fcResult.success && fcResult.data) {
    const scrapedProduct: ScrapedProduct = {
      ...fcResult.data,
      marketplace: parsed.marketplace,
      url:         normalizedUrl,
      scrapedAt:   new Date().toISOString(),
      strategy:    'firecrawl' as ScrapeStrategy,
      elapsedMs:   Date.now() - startedAt,
    }

    await setCachedScrape(normalizedUrl, scrapedProduct)
    return { success: true, data: scrapedProduct }
  }

  // ── Semua strategi gagal → fallback manual ──────────────
  return {
    success:  false,
    error:    fcResult.error ?? 'unknown',
    fallback: 'manual_required',
  }
}

// Export types + helpers
export type { ScrapeResult, ScrapedProduct, Marketplace } from './types'
export { detectMarketplace, parseProductUrl, normalizeUrl } from './url-parser'

