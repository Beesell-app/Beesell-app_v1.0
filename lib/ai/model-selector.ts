// apps/web-app/lib/ai/model-selector.ts
// ── Model selector — COGS optimization ───────────────────────

import type { PlanType } from '@/types/session'

export type ModelQuality = 'fast' | 'high'
export type ModelId = 'gpt-4o-mini' | 'gpt-4o'

export interface ModelConfig {
  id: ModelId
  displayName: string
  inputCostPer1M: number
  outputCostPer1M: number
  maxTokens: number
  requestedQuality?: string
  
}

export const MODEL_REGISTRY: Record<
  ModelId,
  ModelConfig
> = {
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    displayName: 'Cepat',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    maxTokens: 2000,
  },

  'gpt-4o': {
    id: 'gpt-4o',
    displayName: 'Kualitas',
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    maxTokens: 2500,
  },
}

// ── Plan → allowed qualities ─────────────────────────────────

const PLAN_ACCESS: Record<
  PlanType,
  ModelQuality[]
> = {
  free: ['fast'],
  basic: ['fast'],
  pro: ['fast', 'high'],
  business: ['fast', 'high'],
  enterprise: ['fast', 'high'],
}

// ── Main selector ────────────────────────────────────────────

export function selectModel({
  
  plan,
  requestedModel,
}: {
  plan: PlanType
  useCase?: string
  requestedModel?: ModelQuality
}): ModelConfig {
  const CHEAP_MODEL =
    MODEL_REGISTRY['gpt-4o-mini']

  const PREMIUM_MODEL =
    MODEL_REGISTRY['gpt-4o']

  // Free/basic selalu mini
  if (
    plan === 'free' ||
    plan === 'basic'
  ) {
    return CHEAP_MODEL
  }

  // Explicit fast request
  if (requestedModel === 'fast') {
    return CHEAP_MODEL
  }

  // Pro/business/enterprise → premium
  if (
    plan === 'pro' ||
    plan === 'business' ||
    plan === 'enterprise'
  ) {
    return PREMIUM_MODEL
  }

  return CHEAP_MODEL
}

// ── Cost calculator ──────────────────────────────────────────

export function calculateCost(
  modelId: string,
  usage: {
    inputTokens: number
    outputTokens: number
  },
): number {
  const model =
    MODEL_REGISTRY[modelId as ModelId]

  if (!model) {
    return 0
  }

  const input =
    (usage.inputTokens / 1_000_000) *
    model.inputCostPer1M

  const output =
    (usage.outputTokens / 1_000_000) *
    model.outputCostPer1M

  return Number(
    (input + output).toFixed(6),
  )
}