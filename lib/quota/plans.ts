// apps/web-app/lib/quota/plans.ts
// ── Plan definitions ──────────────────────────────────────────
// Single source of truth for all plan limits

export type PlanId = 'free' | 'basic' | 'pro' | 'business'
export type QuotaMetric = 'caption' | 'image' | 'video' | 'schedule'

export interface PlanLimits {
  // Monthly limits (-1 = unlimited)
  captionsPerMonth:  number
  imagesPerMonth:    number
  scheduledPosts:    number   // concurrent scheduled

  // Daily limits
  captionsPerDay:    number
  imagesPerDay:      number

  // Features
  brandKits:         number   // max brand kits
  templateEditor:    boolean
  removeBackground:  boolean
  imageGeneration:   boolean
  bulkGeneration:    boolean
  apiAccess:         boolean
  watermark:         boolean  // true = watermark applied to outputs
  prioritySupport:   boolean

  // AI model tier
  captionModel:      'gpt-4o-mini' | 'gpt-4o'
  imageModel:        'sdxl-lightning' | 'sdxl'

  // Price (IDR/month)
  priceMonthly:      number
  priceSavingsAnnual: number  // % discount annual
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    captionsPerMonth: 50,
    imagesPerMonth:   0,
    scheduledPosts:   0,
    captionsPerDay:   3,
    imagesPerDay:     0,
    brandKits:        0,
    templateEditor:   false,
    removeBackground: false,
    imageGeneration:  false,
    bulkGeneration:   false,
    apiAccess:        false,
    watermark:        true,    // ← watermark on free
    prioritySupport:  false,
    captionModel:     'gpt-4o-mini',
    imageModel:       'sdxl-lightning',
    priceMonthly:     0,
    priceSavingsAnnual: 0,
  },

  basic: {
    captionsPerMonth: 250,
    imagesPerMonth:   30,
    scheduledPosts:   10,
    captionsPerDay:   15,
    imagesPerDay:     5,
    brandKits:        1,
    templateEditor:   true,
    removeBackground: true,
    imageGeneration:  true,
    bulkGeneration:   false,
    apiAccess:        false,
    watermark:        false,
    prioritySupport:  false,
    captionModel:     'gpt-4o-mini',
    imageModel:       'sdxl-lightning',
    priceMonthly:     49_000,
    priceSavingsAnnual: 20,
  },

  pro: {
    captionsPerMonth: 1_000,
    imagesPerMonth:   200,
    scheduledPosts:   100,
    captionsPerDay:   50,
    imagesPerDay:     20,
    brandKits:        3,
    templateEditor:   true,
    removeBackground: true,
    imageGeneration:  true,
    bulkGeneration:   false,
    apiAccess:        false,
    watermark:        false,
    prioritySupport:  true,
    captionModel:     'gpt-4o',
    imageModel:       'sdxl',
    priceMonthly:     149_000,
    priceSavingsAnnual: 25,
  },

  business: {
    captionsPerMonth: -1,    // unlimited
    imagesPerMonth:   -1,
    scheduledPosts:   -1,
    captionsPerDay:   200,
    imagesPerDay:     -1,
    brandKits:        10,
    templateEditor:   true,
    removeBackground: true,
    imageGeneration:  true,
    bulkGeneration:   true,
    apiAccess:        true,
    watermark:        false,
    prioritySupport:  true,
    captionModel:     'gpt-4o',
    imageModel:       'sdxl',
    priceMonthly:     499_000,
    priceSavingsAnnual: 30,
  },
}

// ── Helper: get plan limits ────────────────────────────────────
export function getPlanLimits(planId: string): PlanLimits {
  return PLANS[planId as PlanId] ?? PLANS.free
}

// ── Helper: check if feature is allowed ───────────────────────
export function isFeatureAllowed(planId: string, feature: keyof PlanLimits): boolean {
  const plan = getPlanLimits(planId)
  const val  = plan[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number')  return val !== 0
  return false
}

// ── Helper: needs watermark? ──────────────────────────────────
export function needsWatermark(planId: string): boolean {
  return getPlanLimits(planId).watermark === true
}

// ── Upgrade path ──────────────────────────────────────────────
export function getUpgradePlan(currentPlan: PlanId): PlanId | null {
  const order: PlanId[] = ['free', 'basic', 'pro', 'business']
  const idx = order.indexOf(currentPlan)
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null
}