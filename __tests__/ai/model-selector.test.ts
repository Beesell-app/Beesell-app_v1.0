// apps/web-app/__tests__/ai/model-selector.test.ts
// ── Model selector: pilih model AI berdasar plan & use case ────
import { describe, it, expect } from 'vitest'
import { selectModel, calculateCost } from '@/lib/ai/model-selector'

// ══════════════════════════════════════════════════════════════
// MODEL SELECTION BY PLAN
// ══════════════════════════════════════════════════════════════
describe('selectModel — by plan', () => {

  it('free plan → cheap model (gpt-4o-mini)', () => {
    const model = selectModel({ plan: 'free', useCase: 'caption' })
    expect(model.id).toBe('gpt-4o-mini')
  })

  it('basic plan → cheap model', () => {
    const model = selectModel({ plan: 'basic', useCase: 'caption' })
    expect(model.id).toBe('gpt-4o-mini')
  })

  it('pro plan → premium model (gpt-4o)', () => {
    const model = selectModel({ plan: 'pro', useCase: 'caption' })
    expect(model.id).toBe('gpt-4o')
  })

  it('business plan → premium model', () => {
    const model = selectModel({ plan: 'business', useCase: 'caption' })
    expect(model.id).toBe('gpt-4o')
  })
})

// ══════════════════════════════════════════════════════════════
// QUALITY OVERRIDE
// ══════════════════════════════════════════════════════════════
describe('selectModel — quality override', () => {

  it('free + requested high → still gets cheap (plan locks)', () => {
    const model = selectModel({
      plan: 'free',
      requestedModel: 'high',
      useCase: 'caption',
    })
    // Free plan can't access premium
    expect(model.id).toBe('gpt-4o-mini')
  })

  it('pro + requested fast → downgrades to cheap', () => {
    const model = selectModel({
      plan: 'pro',
      requestedModel: 'fast',
      useCase: 'caption',
    })
    expect(model.id).toBe('gpt-4o-mini')
  })

  it('pro + requested high → premium (default for pro)', () => {
    const model = selectModel({
      plan: 'pro',
      requestedModel: 'high',
      useCase: 'caption',
    })
    expect(model.id).toBe('gpt-4o')
  })
})

// ══════════════════════════════════════════════════════════════
// MODEL METADATA
// ══════════════════════════════════════════════════════════════
describe('Model metadata', () => {

  it('returns displayName for UI', () => {
    const model = selectModel({ plan: 'free', useCase: 'caption' })
    expect(model.displayName).toBeTruthy()
    expect(typeof model.displayName).toBe('string')
  })

  it('returns maxTokens for context limit', () => {
    const model = selectModel({ plan: 'pro', useCase: 'caption' })
    expect(model.maxTokens).toBeGreaterThan(0)
  })

  it('returns inputCost + outputCost per 1M tokens', () => {
    const model = selectModel({ plan: 'pro', useCase: 'caption' })
    expect(model.inputCostPer1M).toBeGreaterThan(0)
    expect(model.outputCostPer1M).toBeGreaterThan(0)
  })
})

// ══════════════════════════════════════════════════════════════
// COST CALCULATION
// ══════════════════════════════════════════════════════════════
describe('calculateCost', () => {

  it('gpt-4o-mini: $0.15 input + $0.60 output per 1M', () => {
    const cost = calculateCost('gpt-4o-mini', {
      inputTokens:  1_000_000,
      outputTokens: 1_000_000,
    })
    expect(cost).toBeCloseTo(0.75, 2)  // 0.15 + 0.60
  })

  it('gpt-4o: $2.50 input + $10.00 output per 1M', () => {
    const cost = calculateCost('gpt-4o', {
      inputTokens:  1_000_000,
      outputTokens: 1_000_000,
    })
    expect(cost).toBeCloseTo(12.50, 2)  // 2.50 + 10.00
  })

  it('handles small token counts (typical caption gen)', () => {
    const cost = calculateCost('gpt-4o-mini', {
      inputTokens:  300,
      outputTokens: 200,
    })
    // 300/1M * 0.15 + 200/1M * 0.60 = 0.000045 + 0.00012 = $0.000165
    expect(cost).toBeGreaterThan(0)
    expect(cost).toBeLessThan(0.001)
  })

  it('handles zero tokens', () => {
    const cost = calculateCost('gpt-4o-mini', {
      inputTokens:  0,
      outputTokens: 0,
    })
    expect(cost).toBe(0)
  })

  it('returns 0 for unknown model (graceful fallback)', () => {
    const cost = calculateCost('unknown-model-xyz', {
      inputTokens:  1000,
      outputTokens: 1000,
    })
    expect(cost).toBe(0)
  })
})