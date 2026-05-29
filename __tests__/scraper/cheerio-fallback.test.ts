// apps/web-app/__tests__/scraper/cheerio-fallback.test.ts
// ── Cheerio fallback: extract product data dari HTML ──────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeWithCheerio } from '@/lib/scraper/cheerio-fallback'

// Mock fetch global
global.fetch = vi.fn() as any

beforeEach(() => {
  vi.mocked(global.fetch).mockReset()
})

function mockFetch(html: string, status = 200) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => html,
    json: async () => ({}),
    headers: new Headers(),
  } as any)
}

// ══════════════════════════════════════════════════════════════
// JSON-LD Schema.org parsing
// ══════════════════════════════════════════════════════════════

describe('scrapeWithCheerio — JSON-LD', () => {
  it('extracts product from JSON-LD schema', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Tas Kulit Premium",
              "description": "Tas wanita kulit asli, muat 14 inch laptop",
              "image": [
                "https://example.com/img1.jpg",
                "https://example.com/img2.jpg"
              ],
              "offers": {
                "@type": "Offer",
                "price": "299000",
                "priceCurrency": "IDR"
              }
            }
          </script>
        </head>
        <body></body>
      </html>
    `

    mockFetch(html)

    const result = await scrapeWithCheerio(
      'https://tokopedia.com/test',
      'tokopedia',
    )

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Tas Kulit Premium')
    expect(result.data?.description).toContain('kulit asli')
    expect(result.data?.images).toHaveLength(2)
    expect(result.data?.price).toMatch(/299/)
  })

  it('handles JSON-LD array format', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          [
            {"@type": "BreadcrumbList"},
            {
              "@type": "Product",
              "name": "Sepatu",
              "offers": {
                "price": "150000"
              }
            }
          ]
          </script>
        </head>
      </html>
    `

    mockFetch(html)

    const result = await scrapeWithCheerio(
      'https://example.com',
      'tokopedia',
    )

    // Array schema should still work
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Sepatu')
  })

  it('handles malformed JSON-LD gracefully', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            { malformed json }
          </script>

          <meta
            property="og:title"
            content="Fallback Title"
          />

          <meta
            property="og:image"
            content="https://example.com/img.jpg"
          />
        </head>
      </html>
    `

    mockFetch(html)

    const result = await scrapeWithCheerio(
      'https://example.com',
      'tokopedia',
    )

    // fallback OG meta
    expect(result.data?.name).toBe('Fallback Title')

    expect(result.data?.images).toContain(
      'https://example.com/img.jpg',
    )
  })
})

// ══════════════════════════════════════════════════════════════
// Open Graph fallback
// ══════════════════════════════════════════════════════════════

describe('scrapeWithCheerio — OG meta fallback', () => {
  it('extracts from OG tags when no JSON-LD', async () => {
    const html = `
      <html>
        <head>
          <meta
            property="og:title"
            content="Tas Wanita Murah"
          />

          <meta
            property="og:description"
            content="Tas kekinian harga terjangkau"
          />

          <meta
            property="og:image"
            content="https://example.com/tas.jpg"
          />

          <meta
            property="product:price:amount"
            content="125000"
          />
        </head>
      </html>
    `

    mockFetch(html)

    const result = await scrapeWithCheerio(
      'https://example.com',
      'tokopedia',
    )

    expect(result.data?.name).toBe('Tas Wanita Murah')

    expect(result.data?.description).toBe(
      'Tas kekinian harga terjangkau',
    )

    expect(result.data?.images).toContain(
      'https://example.com/tas.jpg',
    )
  })

  it('extracts title from <title> tag as last resort', async () => {
    const html = `
      <html>
        <head>
          <title>Sepatu Sneaker Putih | Toko ABC</title>
        </head>
      </html>
    `

    mockFetch(html)

    const result = await scrapeWithCheerio(
      'https://example.com',
      'tokopedia',
    )

    expect(result.data?.name).toBe(
      'Sepatu Sneaker Putih | Toko ABC',
    )
  })
})

// ══════════════════════════════════════════════════════════════
// Error handling
// ══════════════════════════════════════════════════════════════

describe('scrapeWithCheerio — error handling', () => {
  it('returns null/empty data on 404', async () => {
    mockFetch('', 404)

    const result = await scrapeWithCheerio(
      'https://example.com/missing',
      'tokopedia',
    )

    expect(result.name).toBe('')
  })

  it('returns null on network error', async () => {
    vi.mocked(global.fetch).mockRejectedValue(
      new Error('Network timeout'),
    )

    await expect(
      scrapeWithCheerio(
        'https://example.com/timeout',
        'tokopedia',
      ),
    ).rejects.toThrow()
  })

  it('handles empty HTML response', async () => {
    mockFetch('')

    const result = await scrapeWithCheerio(
      'https://example.com/test',
      'tokopedia',
    )

    expect(result.name).toBe('')
  })

  it('handles HTML without any product data', async () => {
    const html = `
      <html>
        <body>
          <p>Just text</p>
        </body>
      </html>
    `

    mockFetch(html)

    const result = await scrapeWithCheerio(
      'https://example.com/test',
      'tokopedia',
    )

    expect(result.name).toBe('')
    expect(result.images).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════
// Price extraction
// ══════════════════════════════════════════════════════════════

describe('Price extraction', () => {
  it('formats price in IDR with Rp prefix', async () => {
    const html = `
      <script type="application/ld+json">
        {
          "@type":"Product",
          "name":"X",
          "offers":{
            "price":"299000",
            "priceCurrency":"IDR"
          }
        }
      </script>
    `

    mockFetch(html)

    const result = await scrapeWithCheerio(
      'https://example.com',
      'tokopedia',
    )

    expect(result.price).toMatch(/Rp.*299/i)
  })

  it('handles missing price', async () => {
    const html = `
      <script type="application/ld+json">
        {
          "@type":"Product",
          "name":"X"
        }
      </script>
    `

    mockFetch(html)

    const result = await scrapeWithCheerio(
      'https://example.com',
      'tokopedia',
    )

    expect(
      result.price === '' ||
      result.price === null ||
      result.price === undefined,
    ).toBe(true)
  })
})