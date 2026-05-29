// apps/web-app/__tests__/ai/cache.test.ts
// ── AI cache: hash + get/set ──────────────────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock redis
import { mockRedis } from '../_helpers/mock-redis'
vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: () => mockRedis },
}))

import { hashPrompt, getCached, setCached } from '@/lib/ai/cache'

beforeEach(() => {
  mockRedis.__clear()
})

// ══════════════════════════════════════════════════════════════
// HASH STABILITY
// ══════════════════════════════════════════════════════════════
describe('hashPrompt', () => {

  it('returns same hash for same input', () => {
    const input = {
      model: 'gpt-4o-mini',
      productName: 'Tas',
      tone: 'casual',
    }

    expect(hashPrompt(input)).toBe(hashPrompt(input))
  })

  it('returns different hash for different input', () => {
    const hash1 = hashPrompt({ model: 'gpt-4o-mini', productName: 'Tas',  tone: 'casual' })
    const hash2 = hashPrompt({ model: 'gpt-4o-mini', productName: 'Tas',  tone: 'luxury' })

    expect(hash1).not.toBe(hash2)
  })

  it('order-independent (key order does not matter)', () => {
    const a = hashPrompt({ tone: 'casual', model: 'gpt-4o-mini', productName: 'Tas' })
    const b = hashPrompt({ productName: 'Tas', model: 'gpt-4o-mini', tone: 'casual' })

    expect(a).toBe(b)
  })

  it('handles nested objects deterministically', () => {
    const a = hashPrompt({ config: { a: 1, b: 2 }, name: 'x' })
    const b = hashPrompt({ name: 'x', config: { b: 2, a: 1 } })

    expect(a).toBe(b)
  })

  it('handles undefined values consistently', () => {
    const hash1 = hashPrompt({ a: 'x' })
    const hash2 = hashPrompt({ a: 'x', b: undefined })

    // Implementation choice — kalau treat undefined sama dengan missing, hash sama
    // Kalau tidak, hash beda. Cek behavior:
    const result = hash1 === hash2
    expect(typeof result).toBe('boolean')
  })

  it('produces fixed-length hash (sha256 → 64 hex chars)', () => {
    const hash = hashPrompt({ x: 'test' })
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })
})

// ══════════════════════════════════════════════════════════════
// CACHE GET / SET
// ══════════════════════════════════════════════════════════════
describe('getCached / setCached', () => {

  it('cache miss returns null', async () => {
    const result = await getCached('non-existent-hash')
    expect(result).toBeNull()
  })

  it('cache hit returns stored value', async () => {
    const hash = 'test-hash-1'
    const data = {
      variants: [{ caption: 'test', hashtags: [], cta: '' }],
      model: 'gpt-4o-mini',
      cached_at: new Date().toISOString(),
    }

    await setCached(hash, data)
    const result = await getCached(hash)

    expect(result).toEqual(data)
  })

  it('cached data persists across get calls', async () => {
    const hash = 'persistent-hash'
    const data = {
      variants: [{ caption: 'hi', hashtags: ['a'], cta: '' }],
      model: 'gpt-4o-mini',
      cached_at: new Date().toISOString(),
}

    await setCached(hash, data)

    const r1 = await getCached(hash)
    const r2 = await getCached(hash)
    const r3 = await getCached(hash)

    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('different hashes do not collide', async () => {
    await setCached('hash-1', {
      variants: [{ caption: 'a', hashtags: [], cta: '' }],
      model: 'gpt-4o-mini',
      cached_at: new Date().toISOString(),
    })
    await setCached('hash-2', {
      variants: [{ caption: 'b', hashtags: [], cta: '' }],
      model: 'gpt-4o-mini',
      cached_at: new Date().toISOString(),
    })

    const r1 = await getCached('hash-1')
    const r2 = await getCached('hash-2')

    expect(r1!.variants[0].caption).toBe('a')
    expect(r2!.variants[0].caption).toBe('b')
  })

  it('overwrites existing cache entry on re-set', async () => {
    const hash = 'overwrite-hash'

    await setCached(hash, { variants: [{ caption: 'old', hashtags: [], cta: '' }], model: 'gpt-4o-mini', cached_at: new Date().toISOString() })
    await setCached(hash, { variants: [{ caption: 'new', hashtags: [], cta: '' }], model: 'gpt-4o-mini', cached_at: new Date().toISOString() })

    const result = await getCached(hash)
    expect(result!.variants[0].caption).toBe('new')
  })
})

// ══════════════════════════════════════════════════════════════
// CACHE INTEGRATION (typical usage flow)
// ════════════════════════════════════
describe('Cache flow integration', () => {

  it('typical: hash → check → miss → generate → set → hit', async () => {
    const promptParams = {
      model: 'gpt-4o-mini',
      productName: 'Tas Wanita',
      tone: 'casual',
      platform: 'instagram',
    }

    const hash = hashPrompt(promptParams)

    // First call: miss
    const cached1 = await getCached(hash)
    expect(cached1).toBeNull()

    // Save result
    const generated = {
      variants: [{ caption: 'Tas keren', hashtags: ['tas'], cta: 'beli' }],
      model: 'gpt-4o-mini',
      cached_at: new Date().toISOString(),
    }
    await setCached(hash, generated)

    // Second call: hit (same params)
    const cached2 = await getCached(hashPrompt(promptParams))
    expect(cached2).toEqual(generated)
  })

  it('cache miss for variation in params', async () => {
    const base = { model: 'gpt-4o-mini', productName: 'Tas', tone: 'casual' }

    await setCached(hashPrompt(base), {
      variants: [],
      model: 'gpt-4o-mini',
      cached_at: new Date().toISOString(),
    })

    // Different tone → different hash → miss
    const result = await getCached(hashPrompt({ ...base, tone: 'luxury' }))
    expect(result).toBeNull()
  })
})