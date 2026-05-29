// apps/web-app/lib/ai/embedding.ts
// ── OpenAI text-embedding-3-small wrapper ────────────────────
// Cost: $0.00002 per 1k tokens (super murah, hampir Rp 0)
// Speed: ~100ms per call
// Dimension: 1536 (default), bisa di-reduce ke 512 untuk save storage
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('[embedding] OPENAI_API_KEY not set')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Embedding dimension
// 1536 = max accuracy, default
// 512  = lighter storage, hampir sama accurate
export const EMBEDDING_DIM = 1536
export const EMBEDDING_MODEL = 'text-embedding-3-small'

// ══════════════════════════════════════════════════════════════
// CORE: embed single text
// ══════════════════════════════════════════════════════════════
export async function embed(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text')
  }

  const response = await openai.embeddings.create({
    model:           EMBEDDING_MODEL,
    input:           text.trim().slice(0, 8000),  // limit untuk safety
    dimensions:      EMBEDDING_DIM,
    encoding_format: 'float',
  })

  return response.data[0].embedding
}

// ══════════════════════════════════════════════════════════════
// BATCH: embed multiple texts in 1 API call
// ══════════════════════════════════════════════════════════════
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  // Filter empty
  const cleaned = texts
    .map(t => t?.trim().slice(0, 8000))
    .filter(t => t && t.length > 0)

  if (cleaned.length === 0) return []

  const response = await openai.embeddings.create({
    model:           EMBEDDING_MODEL,
    input:           cleaned,
    dimensions:      EMBEDDING_DIM,
    encoding_format: 'float',
  })

  return response.data.map(d => d.embedding)
}

// ══════════════════════════════════════════════════════════════
// COMPOSE: prompt + config → embedding-ready text
// ══════════════════════════════════════════════════════════════
// Strategy: cuma yang affect output ke embedding text.
// Field yang IGNORE: variants count (cuma affect berapa banyak output),
// brandKeywords/avoidWords (jarang berubah per request).
export interface PromptForEmbedding {
  productName: string

  productPrice?: string
  productBenefits?: string
  targetAudience?: string

  tone?: string
  language?: string
  emoji?: string
  ctaStyle?: string
  contentGoal?: string
  platform?: string
}

export function composeEmbeddingText(p: PromptForEmbedding): string {
  const lines: string[] = []

  lines.push(`Product: ${p.productName}`)
  if (p.productPrice)    lines.push(`Price: ${p.productPrice}`)
  if (p.productBenefits) lines.push(`Benefits: ${p.productBenefits.slice(0, 200)}`)
  if (p.targetAudience)  lines.push(`Audience: ${p.targetAudience}`)

  lines.push(`Platform: ${p.platform}`)
  lines.push(`Tone: ${p.tone}`)
  lines.push(`Language: ${p.language}`)
  lines.push(`Emoji: ${p.emoji}`)
  lines.push(`CTA: ${p.ctaStyle}`)
  if (p.contentGoal) lines.push(`Goal: ${p.contentGoal}`)

  return lines.join('\n')
}

// ══════════════════════════════════════════════════════════════
// COST CALCULATION (untuk telemetry)
// ══════════════════════════════════════════════════════════════
export function calculateEmbeddingCost(textChars: number): number {
  // text-embedding-3-small: $0.00002 per 1k tokens
  // ~4 chars per token (rough estimate)
  const estimatedTokens = textChars / 4
  return (estimatedTokens / 1000) * 0.00002
}