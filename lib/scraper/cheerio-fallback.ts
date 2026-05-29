import * as cheerio from 'cheerio'
import { SCRAPE_TIMEOUT_MS } from './types'
import type { Marketplace } from './types'

interface CheerioResult {
  success: boolean

  // compatibility fields
  name: string
  images: string[]
  price: string | null

  data?: {
    title: string
    content: string
    media_urls: string[]
    priceText: string

    name: string
    price: string | null
    priceNumeric: number | null
    description: string | null
    images: string[]
    sellerName: string | null
    rating: number | null
    soldCount: number | null
    location: string | null
  }

  error?: 'timeout' | 'blocked' | 'not_found' | 'parse_failed'
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function emptyResult(
  error?: 'timeout' | 'blocked' | 'not_found' | 'parse_failed',
): CheerioResult {
  return {
    success: false,
    error,

    name: '',
    images: [],
    price: '',

    data: {
      title: '',
      content: '',
      media_urls: [],
      priceText: '',

      name: '',
      price: '',
      priceNumeric: null,
      description: null,
      images: [],

      sellerName: null,
      rating: null,
      soldCount: null,
      location: null,
    },
  }
}

function parsePrice(priceStr: string | null): {
  formatted: string
  numeric: number | null
} {
  if (!priceStr) {
    return {
      formatted: '',
      numeric: null,
    }
  }

  const cleaned = String(priceStr).replace(/[^\d]/g, '')

  if (!cleaned) {
    return {
      formatted: '',
      numeric: null,
    }
  }

  const numeric = parseInt(cleaned, 10)

  return {
    formatted: `Rp ${numeric}`,
    numeric,
  }
}

export async function scrapeWithCheerio(
  url: string,
  marketplace: Marketplace,
): Promise<CheerioResult> {
  if (marketplace === 'shopee') {
    return emptyResult('blocked')
  }

  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, SCRAPE_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (res.status === 404) {
      return emptyResult('not_found')
    }

    if (!res.ok) {
      return emptyResult('parse_failed')
    }

    const html = await res.text()

    if (!html) {
      return emptyResult('parse_failed')
    }

    const $ = cheerio.load(html)

    let ldJson: any = null

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = $(el).html()

        if (!raw) return

        const parsed = JSON.parse(raw)

        const productSchema = Array.isArray(parsed)
          ? parsed.find((s: any) => s['@type'] === 'Product')
          : parsed?.['@type'] === 'Product'
            ? parsed
            : null

        if (productSchema) {
          ldJson = productSchema
        }
      } catch {
        // ignore malformed JSON
      }
    })

    const ogTitle =
      $('meta[property="og:title"]').attr('content') || ''

    const ogDescription =
      $('meta[property="og:description"]').attr('content') || ''

    const ogImage =
      $('meta[property="og:image"]').attr('content') || ''

    const ogPrice =
      $('meta[property="product:price:amount"]').attr('content') ||
      $('meta[property="og:price:amount"]').attr('content') ||
      null

    const fallbackTitle = $('title').text().trim()

    const name = String(
      ldJson?.name ||
      ogTitle ||
      fallbackTitle ||
      '',
    ).trim()

    let priceStr: string | null = null

    if (ldJson?.offers?.price) {
      priceStr = String(ldJson.offers.price)
    } else if (ldJson?.offers?.[0]?.price) {
      priceStr = String(ldJson.offers[0].price)
    } else if (ogPrice) {
      priceStr = String(ogPrice)
    }

    const {
      formatted: price,
      numeric: priceNumeric,
    } = parsePrice(priceStr)

    const description =
      ldJson?.description
        ? String(ldJson.description).trim()
        : ogDescription
          ? String(ogDescription).trim()
          : null

    let images: string[] = []

    if (ldJson?.image) {
      images = Array.isArray(ldJson.image)
        ? ldJson.image.filter((x: any) => typeof x === 'string')
        : [String(ldJson.image)]
    } else if (ogImage) {
      images = [ogImage]
    }

    images = images
      .filter(Boolean)
      .filter(img => img.startsWith('http'))
      .slice(0, 5)

    return {
      success: true,

      // compatibility fields
      name,
      images,
      price,

      data: {
        title: name,
        content: description ?? '',
        media_urls: images,
        priceText: price,

        name,
        price,
        priceNumeric,

        description,
        images,

        sellerName:
          ldJson?.brand?.name ??
          ldJson?.seller?.name ??
          null,

        rating:
          typeof ldJson?.aggregateRating?.ratingValue === 'number'
            ? ldJson.aggregateRating.ratingValue
            : ldJson?.aggregateRating?.ratingValue
              ? parseFloat(ldJson.aggregateRating.ratingValue)
              : null,

        soldCount: null,
        location: null,
      },
    }
  } catch (err: any) {
    clearTimeout(timeout)

    console.error('[cheerio] error:', err?.message)

    throw err
  }
}