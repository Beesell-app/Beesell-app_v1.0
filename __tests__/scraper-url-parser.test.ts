import {
  describe,
  test,
  expect,
} from 'vitest'

import {
  parseProductUrl,
  detectMarketplace,
} from '@/lib/scraper/url-parser'

describe('URL Parser', () => {
  test('shopee URL', () => {
    const result =
      parseProductUrl(
        'https://shopee.co.id/Tas-Keren-i.123.456'
      )

    expect(result.valid).toBe(true)
    expect(result.marketplace).toBe('shopee')
    expect(result.productId).toBe('456')
  })

  test('tokopedia URL', () => {
    const result =
      parseProductUrl(
        'https://www.tokopedia.com/tokokeren/tas-wanita'
      )

    expect(result.valid).toBe(true)
    expect(result.marketplace).toBe('tokopedia')
  })

  test('invalid URL', () => {
    const result =
      parseProductUrl('https://google.com')

    expect(result.valid).toBe(false)
  })
})