// apps/web-app/lib/scraper/url-parser.ts
// Parse URL produk: detect marketplace, normalize, extract IDs

import type { Marketplace } from './types'

// ── Regex per marketplace ────────────────────────────────────
// Shopee:      https://shopee.co.id/Product-Name-i.{shopId}.{itemId}
// Tokopedia:   https://www.tokopedia.com/{store}/{product-slug}
// Lazada:      https://www.lazada.co.id/products/{product}-i{itemId}.html
// Blibli:      https://www.blibli.com/p/{product-slug}/{itemId}
// TikTok:      https://www.tiktok.com/@{seller}/video/{videoId} atau shop URL
const PATTERNS: Record<Exclude<Marketplace, 'unknown'>, RegExp> = {
  shopee:     /shopee\.co\.id\/.*-i\.(\d+)\.(\d+)/,
  tokopedia:  /tokopedia\.com\/([^\/]+)\/([^\/?#]+)/,
  lazada:     /lazada\.co\.id\/products\/.*-i(\d+)/,
  blibli:     /blibli\.com\/p\/[^\/]+\/([A-Za-z0-9-]+)/,
  tiktokshop: /(tiktok\.com\/@|shop\.tiktok\.com|vt\.tiktok\.com)/,
}

export interface ParsedUrl {
  marketplace: Marketplace
  url:         string  // normalized
  valid:       boolean
  productId?:  string
  shopId?:     string
}


// ── Detect marketplace dari URL ──────────────────────────────
export function detectMarketplace(input: string): string {
  try {
    if (!input || typeof input !== 'string') {
      return 'unknown'
    }

    let url = input.trim()

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    const hostname = new URL(url).hostname.toLowerCase()

    if (hostname.includes('shopee')) return 'shopee'
    if (hostname.includes('tokopedia')) return 'tokopedia'
    if (hostname.includes('lazada')) return 'lazada'
    if (hostname.includes('blibli')) return 'blibli'

    if (
      hostname.includes('tiktok.com') ||
      hostname.includes('shop.tiktok.com')
    ) {
      return 'tiktok'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}



// ── Parse + validate URL ─────────────────────────────────────
export function parseProductUrl(url: string): ParsedUrl {
  const trimmed = url.trim()

  // URL format valid?
  try {
    new URL(trimmed)
  } catch {
    return { marketplace: 'unknown', url: trimmed, valid: false }
  }

  const marketplace = detectMarketplace(trimmed)

  if (marketplace === 'unknown') {
    return { marketplace, url: trimmed, valid: false }
  }

  // Shopee: extract shopId + itemId
  if (marketplace === 'shopee') {
    const match = trimmed.match(PATTERNS.shopee)
    if (!match) return { marketplace, url: trimmed, valid: false }
    return {
      marketplace,
      url:       trimmed,
      valid:     true,
      shopId:    match[1],
      productId: match[2],
    }
  }

  // Tokopedia: extract store + slug
  if (marketplace === 'tokopedia') {
    const match = trimmed.match(PATTERNS.tokopedia)
    if (!match) return { marketplace, url: trimmed, valid: false }
    return {
      marketplace,
      url:       trimmed,
      valid:     true,
      shopId:    match[1],
      productId: match[2],
    }
  }

  // Lazada
  if (marketplace === 'lazada') {
    const match = trimmed.match(PATTERNS.lazada)
    if (!match) return { marketplace, url: trimmed, valid: false }
    return {
      marketplace,
      url:       trimmed,
      valid:     true,
      productId: match[1],
    }
  }

  // Others: just check pattern exists
  const pattern = PATTERNS[marketplace as Exclude<Marketplace, 'unknown'>]
  const valid   = pattern ? pattern.test(trimmed) : true

  return {
  marketplace: marketplace as Marketplace,
  url: trimmed,
  valid,
}}

// ── Normalize URL — hapus query tracking params ──────────────
export function normalizeUrl(input: string): string {
  try {
    if (!input) return input

    const withProtocol =
      input.startsWith('http://') || input.startsWith('https://')
        ? input
        : `https://${input}`

    const url = new URL(withProtocol)

    // =========================
    // REMOVE TRACKING PARAMS
    // =========================
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'spm',
      'spm_id_from',
      'fbclid',
      'gclid',
    ]

    trackingParams.forEach((param) => {
      url.searchParams.delete(param)
    })

    // =========================
    // REMOVE HASH FRAGMENT
    // =========================
    url.hash = ''

    // =========================
    // CLEAN EMPTY QUERY
    // =========================
    const query = url.searchParams.toString()

    return `${url.protocol}//${url.host}${url.pathname}${
      query ? `?${query}` : ''
    }`
  } catch {
    return input
  }
}