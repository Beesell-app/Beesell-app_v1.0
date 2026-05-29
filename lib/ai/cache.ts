// apps/web-app/lib/ai/cache.ts
// ── Unified cache: Layer 1 Redis exact + Layer 2 Pinecone semantic ──
//
// Cascade lookup:
//   Layer 1: Redis exact hash match (~10ms, free)
//     ↓ MISS
//   Layer 2: Pinecone semantic similarity ≥0.92 (~150ms, $0.000006)
//     ↓ MISS
//   Layer 3: OpenAI generate (~5s, $0.0003)
//
// Save after generate: write ke kedua layer (Redis + Pinecone).
//
// Total cost saving: ~40% (Redis 10-15% + Pinecone 25-30%)
import { createHash } from 'crypto'
import { Redis }       from '@upstash/redis'
import {
  lookupSemanticCache,
  saveSemanticCache,
  incrementHitCount,
  SEMANTIC_CACHE_ENABLED,
  type SemanticCacheEntry,
} from './semantic-cache'
import type { PromptForEmbedding } from './embedding'
import type { CaptionVariant }      from './prompts'

const redis = Redis.fromEnv()
const REDIS_TTL_SECONDS = 7 * 24 * 60 * 60   // 7 hari

// ══════════════════════════════════════════════════════════════
// LAYER 1: EXACT HASH (Redis)
// ══════════════════════════════════════════════════════════════
export function hashPrompt(params: Record<string, any>): string {
  // Stable JSON serialize untuk konsistensi hash
  const stable = JSON.stringify(params, Object.keys(params).sort())
  return createHash('sha256').update(stable).digest('hex')
}

export interface CacheEntry {
  variants:      CaptionVariant[]
  model:         string
  cached_at:     string
  input_tokens?: number
  output_tokens?: number
}

// ── Exact match get ────────────────────────────────────────
export async function getExactCache(hash: string): Promise<CacheEntry | null> {
  try {
    const raw = await redis.get<CacheEntry>(`cache:exact:${hash}`)
    return raw ?? null
  } catch (err) {
    console.error('[cache/exact/get]', err)
    return null
  }
}

// ── Exact match set ────────────────────────────────────────
export async function setExactCache(hash: string, entry: CacheEntry): Promise<void> {
  try {
    await redis.set(`cache:exact:${hash}`, entry, { ex: REDIS_TTL_SECONDS })
  } catch (err) {
    console.error('[cache/exact/set]', err)
  }
}

// ══════════════════════════════════════════════════════════════
// CASCADE: getCachedCascade — auto check layer 1 + 2
// ══════════════════════════════════════════════════════════════
export interface CascadeCacheResult {
  hit:        boolean
  source:     'exact' | 'semantic' | 'miss'
  similarity?: number              // hanya untuk semantic hit
  matchId?:   string               // hanya untuk semantic hit (untuk increment hit count)
  payload:    CacheEntry | null
}

export async function getCachedCascade(
  hash: string,
  prompt: PromptForEmbedding,
): Promise<CascadeCacheResult> {

  // ── Layer 1: exact hash ──────────────────────────────
  const exact = await getExactCache(hash)
  if (exact) {
    return {
      hit:     true,
      source:  'exact',
      payload: exact,
    }
  }

  // ── Layer 2: semantic similarity ─────────────────────
  if (!SEMANTIC_CACHE_ENABLED) {
    return { hit: false, source: 'miss', payload: null }
  }

  const semantic = await lookupSemanticCache(prompt)
  if (semantic.hit) {
    // Fire & forget: track hit count for popular caches
    incrementHitCount(semantic.matchId).catch(() => {})

    return {
      hit:        true,
      source:     'semantic',
      similarity: semantic.similarity,
      matchId:    semantic.matchId,
      payload:    semantic.payload as CacheEntry,
    }
  }

  return {
    hit:     false,
    source:  'miss',
    payload: null,
  }
}

// ══════════════════════════════════════════════════════════════
// SAVE BOTH LAYERS (after OpenAI generation)
// ══════════════════════════════════════════════════════════════
export async function saveBothLayers(
  hash:    string,
  prompt:  PromptForEmbedding,
  entry:   CacheEntry,
): Promise<void> {
  // Save parallel — kedua layer independen
  await Promise.allSettled([
    setExactCache(hash, entry),
    SEMANTIC_CACHE_ENABLED
      ? saveSemanticCache(prompt, entry as SemanticCacheEntry)
      : Promise.resolve(),
  ])
}

// ══════════════════════════════════════════════════════════════
// LEGACY: keep getCached/setCached untuk backward compat
// (Lama: route.ts pakai ini sebelum cascade. Bisa di-deprecate setelah migrate.)
// ══════════════════════════════════════════════════════════════
export const getCached = getExactCache
export const setCached = setExactCache