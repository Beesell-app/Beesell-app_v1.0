// apps/web-app/__tests__/ai/semantic-cache.test.ts
// ── Tests untuk semantic cache logic ──────────────────────────
// Mock Pinecone + OpenAI embedding untuk isolated unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Ini akan dieksekusi SEBELUM import lainnya
vi.hoisted(() => {
  process.env.PINECONE_API_KEY = 'mock-api-key'
  process.env.PINECONE_INDEX = 'mock-index'
})

// ── Mock OpenAI embedding ──
vi.mock('@/lib/ai/embedding', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/embedding')>('@/lib/ai/embedding')

  return {
    ...actual,
    // Mock embed: return deterministic vector based on text length
    embed: vi.fn(async (text: string) => {
      // Fake 1536-dim vector dengan signature dari text
      return Array.from({ length: 1536 }, (_, i) => (text.charCodeAt(i % text.length) || 0) / 256)
    }),
  }
})
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
// ── Mock Pinecone ──
const mockQuery   = vi.fn()
const mockUpsert  = vi.fn()
const mockFetch   = vi.fn()
const mockUpdate  = vi.fn()
const mockStats   = vi.fn()

vi.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: class MockPinecone {
      index() {
        return {
          query: mockQuery,
          upsert: mockUpsert,
          fetch: mockFetch,
          update: mockUpdate,
          describeIndexStats: mockStats,
        }
      }
    },
  }
})

// Set env BEFORE importing module under test
process.env.PINECONE_API_KEY    = 'test-key'
process.env.PINECONE_INDEX_NAME = 'test-index'

import {
  lookupSemanticCache,
  saveSemanticCache,
  SEMANTIC_THRESHOLD,
  SEMANTIC_CACHE_ENABLED,
} from '@/lib/ai/semantic-cache'

import type { PromptForEmbedding } from '@/lib/ai/embedding'

beforeEach(() => {
  vi.clearAllMocks()
})

// ══════════════════════════════════════════════════════════════
// SETUP CHECK
// ══════════════════════════════════════════════════════════════
describe('Config', () => {
  it('SEMANTIC_CACHE_ENABLED is true when API key set', () => {
    expect(SEMANTIC_CACHE_ENABLED).toBe(true)
  })

  it('SEMANTIC_THRESHOLD default 0.92', () => {
    expect(SEMANTIC_THRESHOLD).toBe(0.92)
  })
})

// ══════════════════════════════════════════════════════════════
// LOOKUP
// ══════════════════════════════════════════════════════════════
describe('lookupSemanticCache', () => {

  const samplePrompt: PromptForEmbedding = {
    productName: 'Tas Wanita Kulit',
    tone:        'casual',
    language:    'indonesian_casual',
    emoji:       'moderate',
    ctaStyle:    'medium',
    contentGoal: 'soft_selling',
    platform:    'instagram',
  }

  it('returns hit when score >= threshold', async () => {
    const fakePayload = {
      variants: [{ caption: 'Tas keren', hashtags: ['tas'], cta: 'beli' }],
      model: 'gpt-4o-mini',
      cached_at: new Date().toISOString(),
    }

    mockQuery.mockResolvedValue({
      matches: [{
        id:    'cache_xyz',
        score: 0.95,
        metadata: {
          payload:     JSON.stringify(fakePayload),
          platform:    'instagram',
          tone:        'casual',
          contentGoal: 'soft_selling',
          productName: 'Tas',
          created_at:  new Date().toISOString(),
          hit_count:   0,
        },
      }],
    })

    const result = await lookupSemanticCache(samplePrompt)

    expect(result.hit).toBe(true)
    if (result.hit) {
      expect(result.similarity).toBe(0.95)
      expect(result.payload.variants[0].caption).toBe('Tas keren')
      expect(result.matchId).toBe('cache_xyz')
    }
  })

  it('returns miss when score below threshold', async () => {
    mockQuery.mockResolvedValue({
      matches: [{
        id: 'cache_xyz',
        score: 0.85,   // below 0.92
        metadata: { payload: '{}', platform: 'instagram', tone: 'casual', contentGoal: 'soft_selling', productName: 'x', created_at: '', hit_count: 0 },
      }],
    })

    const result = await lookupSemanticCache(samplePrompt)

    expect(result.hit).toBe(false)
    expect(result.similarity).toBe(0.85)
  })

  it('returns miss when no matches', async () => {
    mockQuery.mockResolvedValue({ matches: [] })

    const result = await lookupSemanticCache(samplePrompt)

    expect(result.hit).toBe(false)
    expect(result.similarity).toBe(0)
  })

  it('returns miss when Pinecone errors (graceful)', async () => {
    mockQuery.mockRejectedValue(new Error('Pinecone API down'))

    const result = await lookupSemanticCache(samplePrompt)

    expect(result.hit).toBe(false)
  })

  it('filters by platform + contentGoal', async () => {
    mockQuery.mockResolvedValue({ matches: [] })

    await lookupSemanticCache({
      ...samplePrompt,
      platform:    'tiktok',
      contentGoal: 'hard_selling',
    })

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          platform:    { $eq: 'tiktok' },
          contentGoal: { $eq: 'hard_selling' },
        }),
      }),
    )
  })

  it('returns miss when payload missing in metadata', async () => {
    mockQuery.mockResolvedValue({
      matches: [{
        id: 'cache_xyz',
        score: 0.97,
        metadata: { platform: 'instagram', tone: 'casual', contentGoal: 'soft_selling', productName: 'x', created_at: '', hit_count: 0 },
        // no payload field
      }],
    })

    const result = await lookupSemanticCache(samplePrompt)

    expect(result.hit).toBe(false)
  })

  it('returns miss when payload JSON is corrupted', async () => {
    mockQuery.mockResolvedValue({
      matches: [{
        id: 'cache_xyz',
        score: 0.97,
        metadata: {
          payload: 'not-valid-json-{{{',
          platform: 'instagram', tone: 'casual', contentGoal: 'soft_selling', productName: 'x', created_at: '', hit_count: 0,
        },
      }],
    })

    const result = await lookupSemanticCache(samplePrompt)

    expect(result.hit).toBe(false)
  })

  it('exactly at threshold (0.92) counts as hit', async () => {
    mockQuery.mockResolvedValue({
      matches: [{
        id: 'cache_xyz',
        score: 0.92,
        metadata: {
          payload: JSON.stringify({
            variants: [{ caption: 'x', hashtags: [], cta: '' }],
            model: 'gpt-4o-mini', cached_at: '',
          }),
          platform: 'instagram', tone: 'casual', contentGoal: 'soft_selling', productName: 'x', created_at: '', hit_count: 0,
        },
      }],
    })

    const result = await lookupSemanticCache(samplePrompt)
    expect(result.hit).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════
// SAVE
// ══════════════════════════════════════════════════════════════
describe('saveSemanticCache', () => {

  const samplePrompt: PromptForEmbedding = {
    productName: 'Tas Wanita',
    tone:        'casual',
    language:    'indonesian_casual',
    emoji:       'moderate',
    ctaStyle:    'medium',
    contentGoal: 'soft_selling',
    platform:    'instagram',
  }

  it('upserts vector with metadata', async () => {
    mockUpsert.mockResolvedValue({})

    await saveSemanticCache(samplePrompt, {
      variants:  [{ caption: 'Hello', hashtags: ['a'], cta: 'beli' }],
      model:     'gpt-4o-mini',
      cached_at: '2026-01-01T00:00:00Z',
    })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const call = mockUpsert.mock.calls[0][0].records[0]   // first array, first vector

    expect(call).toMatchObject({
      id: expect.stringMatching(/^cache_\d+_/),
      values: expect.any(Array),
      metadata: expect.objectContaining({
        platform:    'instagram',
        tone:        'casual',
        contentGoal: 'soft_selling',
        hit_count:   0,
      }),
    })

    expect(call.values).toHaveLength(1536)
  })

  it('stores payload as JSON string in metadata', async () => {
    mockUpsert.mockResolvedValue({})

    const payload = {
      variants:  [{ caption: 'Hi', hashtags: [], cta: '' }],
      model:     'gpt-4o-mini',
      cached_at: '2026-01-01',
    }

    await saveSemanticCache(samplePrompt, payload)

    const call = mockUpsert.mock.calls[0][0].records[0]
    const parsed = JSON.parse(call.metadata.payload)
    expect(parsed).toEqual(payload)
  })

  it('graceful: does not throw on upsert error', async () => {
    mockUpsert.mockRejectedValue(new Error('Pinecone down'))

    await expect(
      saveSemanticCache(samplePrompt, {
        variants: [], model: 'x', cached_at: '',
      }),
    ).resolves.not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════════
// EDGE: similarity boundaries
// ══════════════════════════════════════════════════════════════
describe('Similarity threshold boundaries', () => {

  const prompt: PromptForEmbedding = {
    productName: 'Test', tone: 'casual', language: 'indonesian_casual',
    emoji: 'moderate', ctaStyle: 'medium', contentGoal: 'soft_selling', platform: 'instagram',
  }

  const validMatch = (score: number) => ({
    matches: [{
      id: 'cache_x',
      score,
      metadata: {
        payload: JSON.stringify({ variants: [{ caption: 'x', hashtags: [], cta: '' }], model: 'm', cached_at: '' }),
        platform: 'instagram', tone: 'casual', contentGoal: 'soft_selling', productName: 'x', created_at: '', hit_count: 0,
      },
    }],
  })

  it('0.91 = miss (just below threshold)', async () => {
    mockQuery.mockResolvedValue(validMatch(0.91))
    const r = await lookupSemanticCache(prompt)
    expect(r.hit).toBe(false)
  })

  it('0.92 = hit (exact threshold)', async () => {
    mockQuery.mockResolvedValue(validMatch(0.92))
    const r = await lookupSemanticCache(prompt)
    expect(r.hit).toBe(true)
  })

  it('0.99 = hit (very high)', async () => {
    mockQuery.mockResolvedValue(validMatch(0.99))
    const r = await lookupSemanticCache(prompt)
    expect(r.hit).toBe(true)
  })

  it('1.0 = hit (perfect match)', async () => {
    mockQuery.mockResolvedValue(validMatch(1.0))
    const r = await lookupSemanticCache(prompt)
    expect(r.hit).toBe(true)
    if (r.hit) expect(r.similarity).toBe(1.0)
  })
})