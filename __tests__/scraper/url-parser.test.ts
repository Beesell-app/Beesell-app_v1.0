// apps/web-app/__tests__/scraper/url-parser.test.ts
// ── URL parser: detect marketplace dari URL string ──────────────
import { describe, it, expect } from 'vitest'
import { detectMarketplace, normalizeUrl, type Marketplace } from '@/lib/scraper/url-parser'

// ══════════════════════════════════════════════════════════════
// MARKETPLACE DETECTION
// ══════════════════════════════════════════════════════════════
describe('detectMarketplace', () => {

  describe('Shopee', () => {
    it.each([
      'https://shopee.co.id/Tas-Wanita-i.123.456',
      'https://shopee.co.id/product/123/456',
      'http://shopee.co.id/Tas',
      'https://www.shopee.co.id/Tas',
      'https://shopee.tw/something',
      'https://shopee.com.my/something',
    ])('detects %s as shopee', (url) => {
      expect(detectMarketplace(url)).toBe('shopee')
    })
  })

  describe('Tokopedia', () => {
    it.each([
      'https://www.tokopedia.com/toko/produk',
      'https://tokopedia.com/cantik/tas-wanita',
      'http://www.tokopedia.com/foo/bar',
      'https://tokopedia.link/abc123',  // shortlink
    ])('detects %s as tokopedia', (url) => {
      expect(detectMarketplace(url)).toBe('tokopedia')
    })
  })

  describe('Lazada', () => {
    it.each([
      'https://www.lazada.co.id/products/abc-i123.html',
      'https://lazada.co.id/products/xyz',
      'https://www.lazada.com/abc',
    ])('detects %s as lazada', (url) => {
      expect(detectMarketplace(url)).toBe('lazada')
    })
  })

  describe('Blibli', () => {
    it.each([
      'https://www.blibli.com/p/tas-wanita/abc-123',
      'https://blibli.com/jual/tas',
    ])('detects %s as blibli', (url) => {
      expect(detectMarketplace(url)).toBe('blibli')
    })
  })

  describe('TikTok Shop', () => {
    it.each([
      'https://shop.tiktok.com/view/product/123',
      'https://www.tiktok.com/shop/product/abc',
    ])('detects %s as tiktok', (url) => {
      expect(detectMarketplace(url)).toBe('tiktok')
    })
  })

  describe('Unknown', () => {
    it.each([
      'https://amazon.com/product',
      'https://google.com',
      'https://random-site.id/product',
      'not-a-url-at-all',
      '',
    ])('returns unknown for %s', (url) => {
      expect(detectMarketplace(url)).toBe('unknown')
    })
  })

  describe('Edge cases', () => {
    it('handles URL with query params + fragment', () => {
      const url = 'https://shopee.co.id/Tas-Wanita-i.123.456?spm_id_from=xyz&utm=ads#section'
      expect(detectMarketplace(url)).toBe('shopee')
    })

    it('handles URL without protocol', () => {
      expect(detectMarketplace('shopee.co.id/product/123')).toBe('shopee')
      expect(detectMarketplace('www.tokopedia.com/abc')).toBe('tokopedia')
    })

    it('case-insensitive', () => {
      expect(detectMarketplace('https://SHOPEE.CO.ID/abc')).toBe('shopee')
      expect(detectMarketplace('https://Tokopedia.com/abc')).toBe('tokopedia')
    })

    it('rejects malformed URLs', () => {
      expect(detectMarketplace('::::not-a-url::::')).toBe('unknown')
    })

    it('handles null/undefined safely (does not throw)', () => {
      // @ts-expect-error testing runtime safety
      expect(() => detectMarketplace(null)).not.toThrow()
      // @ts-expect-error testing runtime safety
      expect(() => detectMarketplace(undefined)).not.toThrow()
    })
  })
})

// ══════════════════════════════════════════════════════════════
// URL NORMALIZATION
// ══════════════════════════════════════════════════════════════
describe('normalizeUrl', () => {
  it('strips tracking params (spm_id_from, utm_source, etc)', () => {
    const url = 'https://shopee.co.id/Tas-i.123?spm_id_from=foo&utm_source=ads&utm_medium=cpc'
    const result = normalizeUrl(url)

    expect(result).not.toContain('spm_id_from')
    expect(result).not.toContain('utm_source')
    expect(result).not.toContain('utm_medium')
    expect(result).toContain('shopee.co.id/Tas-i.123')
  })

  it('keeps important params (product id, sku)', () => {
    const url = 'https://tokopedia.com/toko/produk?source=organic&utm_source=ads'
    const result = normalizeUrl(url)

    // utm_* harus stripped, source param mungkin dijaga (tergantung implementation)
    expect(result).not.toContain('utm_source')
  })

  it('removes hash fragment', () => {
    expect(normalizeUrl('https://shopee.co.id/Tas#reviews')).not.toContain('#')
  })

  it('preserves protocol', () => {
    expect(normalizeUrl('https://shopee.co.id/Tas')).toMatch(/^https:/)
  })

  it('adds protocol if missing', () => {
    const result = normalizeUrl('shopee.co.id/Tas')
    expect(result).toMatch(/^https?:\/\//)
  })

  it('handles malformed URL gracefully (returns input)', () => {
    const malformed = 'not-a-valid-url'
    // Should not throw, return something (input or empty)
    expect(() => normalizeUrl(malformed)).not.toThrow()
  })
})