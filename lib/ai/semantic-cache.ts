// apps/web-app/lib/ai/semantic-cache.ts
// ── Pinecone semantic cache ──────────────────────────────────
// Layer 2 cache: vector similarity match untuk capture "similar" requests
// yang Redis exact match miss-kan.
//
// Threshold 0.92 = sweet spot:
//   - >0.95 : terlalu strict, hit rate rendah (~10%)
//   - 0.92  : optimal (~25-30% hit rate, output tetap relevant)
//   - <0.88 : terlalu loose, output bisa off-topic
import { Pinecone, type Index } from '@pinecone-database/pinecone'
import { embed, composeEmbeddingText, type PromptForEmbedding } from './embedding'
import type { CaptionVariant } from './prompts'

// ══════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? 'beesell-cache'

export const SEMANTIC_THRESHOLD = parseFloat(
  process.env.SEMANTIC_CACHE_THRESHOLD ?? '0.92',
)

// Toggle: kalau API key tidak set, fitur disabled (graceful degradation)
export const SEMANTIC_CACHE_ENABLED = !!process.env.PINECONE_API_KEY

// ══════════════════════════════════════════════════════════════
// LAZY CLIENT INIT
// ══════════════════════════════════════════════════════════════
let pineconeClient: Pinecone | null = null
let pineconeIndex: Index | null    = null

function getIndex(): Index | null {
  if (!SEMANTIC_CACHE_ENABLED) return null

  if (!pineconeIndex) {
    try {
      pineconeClient = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
      })
      pineconeIndex = pineconeClient.index(PINECONE_INDEX_NAME)
    } catch (err) {
      console.error('[semantic-cache] Pinecone init failed:', err)
      return null
    }
  }
  return pineconeIndex
}

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════
export interface SemanticCacheEntry {
  variants:      CaptionVariant[]
  model:         string
  cached_at:     string
  input_tokens?: number
  output_tokens?: number
}

interface PineconeMetadata {
  platform:    string
  tone:        string
  contentGoal: string
  productName: string
  payload:     string         // JSON.stringify(SemanticCacheEntry)
  created_at:  string
  hit_count:   number
}

export interface SemanticCacheHit {
  hit:        true
  similarity: number
  payload:    SemanticCacheEntry
  matchId:    string          // untuk update hit_count nanti
}

export interface SemanticCacheMiss {
  hit:        false
  similarity: number
}

export type SemanticCacheResult = SemanticCacheHit | SemanticCacheMiss

// ══════════════════════════════════════════════════════════════
// LOOKUP
// ══════════════════════════════════════════════════════════════
export async function lookupSemanticCache(
  prompt: PromptForEmbedding,
): Promise<SemanticCacheResult> {
  if (!SEMANTIC_CACHE_ENABLED) {
    return { hit: false, similarity: 0 }
  }

  const index = getIndex()
  if (!index) return { hit: false, similarity: 0 }

  try {
    // 1. Build embedding text + vector
    const text = composeEmbeddingText(prompt)
    const vector = await embed(text)

    // 2. Query Pinecone
    const result = await index.query({
      vector,
      topK:            3,                // top-3 untuk safety, take best
      includeMetadata: true,
      filter: {
        // Strict filter: harus exact match platform + contentGoal
        // (cross-platform/cross-goal content beda banget)
        platform:    { $eq: prompt.platform },
        contentGoal: { $eq: prompt.contentGoal ?? 'soft_selling' },
      },
    })

    const topMatch = result.matches?.[0]
    if (!topMatch || typeof topMatch.score !== 'number') {
      return { hit: false, similarity: 0 }
    }

    // 3. Check threshold
    if (topMatch.score < SEMANTIC_THRESHOLD) {
      return { hit: false, similarity: topMatch.score }
    }

    // 4. Parse payload
    const meta = topMatch.metadata as unknown as PineconeMetadata
    if (!meta?.payload) {
      console.warn('[semantic-cache] Match found but payload missing:', topMatch.id)
      return { hit: false, similarity: topMatch.score }
    }

    try {
      const payload = JSON.parse(meta.payload) as SemanticCacheEntry
      return {
        hit:        true,
        similarity: topMatch.score,
        payload,
        matchId:    topMatch.id,
      }
    } catch (err) {
      console.error('[semantic-cache] Parse payload failed:', err)
      return { hit: false, similarity: topMatch.score }
    }
  } catch (err) {
    // Graceful: Pinecone down → return miss, jangan crash request
    console.error('[semantic-cache] Lookup error (non-fatal):', err)
    return { hit: false, similarity: 0 }
  }
}

// ══════════════════════════════════════════════════════════════
// SAVE (after AI generation success)
// ══════════════════════════════════════════════════════════════
export async function saveSemanticCache(
  prompt: PromptForEmbedding,
  payload: SemanticCacheEntry,
): Promise<void> {
  if (!SEMANTIC_CACHE_ENABLED) return

  const index = getIndex()
  if (!index) return

  try {
    const text = composeEmbeddingText(prompt)
    const vector = await embed(text)

    const id = `cache_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const metadata: Record<string, any> = {
      platform: prompt.platform,
      tone: prompt.tone,
      contentGoal: prompt.contentGoal ?? 'soft_selling',
      productName: prompt.productName.slice(0, 100),
      payload: JSON.stringify(payload),
      created_at: new Date().toISOString(),
      hit_count: 0,
    }

    await index.upsert({
      records: [
        {
          id,
          values: vector,
          metadata,
        },
      ],
    })
  } catch (err) {
    // Non-fatal: kalau save gagal, original request tetap success
    console.error('[semantic-cache] Save error (non-fatal):', err)
  }
}

// ══════════════════════════════════════════════════════════════
// INCREMENT HIT COUNT (fire & forget, untuk analytics)
// ══════════════════════════════════════════════════════════════
export async function incrementHitCount(matchId: string): Promise<void> {
  if (!SEMANTIC_CACHE_ENABLED) return

  const index = getIndex()
  if (!index) return

  try {
    // Fetch current to read hit_count
    const result = await index.fetch({
      ids: [matchId],
    })
    const record = result.records?.[matchId]
    if (!record) return

    const currentMeta = record.metadata as unknown as PineconeMetadata
    const newHitCount = (currentMeta.hit_count ?? 0) + 1

    // Update metadata only (no need to re-embed)
    await index.update({
      id: matchId,
      metadata: {
        hit_count: newHitCount,
      } as any,
    })
  } catch (err) {
    // Non-fatal
    console.error('[semantic-cache] Hit count update error:', err)
  }
}

// ══════════════════════════════════════════════════════════════
// STATS (for admin / monitoring)
// ══════════════════════════════════════════════════════════════
export async function getCacheStats() {
  if (!SEMANTIC_CACHE_ENABLED) {
    return { enabled: false }
  }

  const index = getIndex()
  if (!index) return { enabled: false }

  try {
    const stats = await index.describeIndexStats()
    return {
      enabled:      true,
      totalVectors: stats.totalRecordCount ?? 0,
      dimension:    stats.dimension,
      indexFullness: stats.indexFullness ?? 0,
      threshold:    SEMANTIC_THRESHOLD,
    }
  } catch (err) {
    console.error('[semantic-cache] Stats error:', err)
    return { enabled: true, error: 'fetch_failed' }
  }
}