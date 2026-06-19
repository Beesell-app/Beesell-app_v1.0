'use client'
// hooks/use-pricing.ts
// ══════════════════════════════════════════════════════════════
// usePricing — FINAL (plans + quota + features + addons)
// 
// Single source of truth client-side. Semua helper typed, no `any`.
// Tinggal overwrite file lama dengan ini.
// ══════════════════════════════════════════════════════════════

import useSWR from 'swr'
import { type PricingData, type PlanData, formatQuotaNote } from '@/lib/pricing'

// ── Feature flag (dari feature_flags_db) ──────────────────────
export interface FeatureFlag {
  tool_id:            string
  display_name:       string
  category:           string
  description:        string | null
  status:             'enabled' | 'disabled' | 'coming-soon' | 'beta'
  available_starter:  boolean
  available_basic:    boolean
  available_pro:      boolean
  available_business: boolean
  sort_order:         number
}

// ── Add-on (dari addon_config) ────────────────────────────────
export interface Addon {
  addon_id:   string
  label:      string
  qty:        string | null
  price:      number
  icon:       string | null
  color:      string | null
  badge:      string | null
  kind:       'active' | 'coming-soon'
  eta:        string | null
  sort_order: number
}

// Response gabungan dari /api/public/pricing
type PricingResponse = PricingData & {
  features?: FeatureFlag[]
  addons?:   Addon[]
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`Pricing fetch failed: ${r.status}`)
  return r.json()
})

const TIER_KEY: Record<string, keyof FeatureFlag> = {
  starter:  'available_starter',
  basic:    'available_basic',
  pro:      'available_pro',
  business: 'available_business',
}

export function usePricing() {
  const { data, error, isLoading, mutate } = useSWR<PricingResponse>(
    '/api/public/pricing',
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  const plans    = data?.plans ?? []
  const features = data?.features ?? []
  const addons   = data?.addons ?? []

  return {
    data,
    plans,
    features,
    addons,
    dailyLimits: data?.daily_limits ?? [],
    creditCosts: data?.credit_costs ?? [],
    isLoading,
    error,
    isFallback: data?.source === 'fallback',

    // ── Plan & harga ──────────────────────────────────────────
    getPlan: (tier: string): PlanData | undefined => plans.find(p => p.tier === tier),
    getPrice: (tier: string): number => plans.find(p => p.tier === tier)?.price_monthly ?? 0,

    // ── Kuota ─────────────────────────────────────────────────
    getQuota: (tier: string) => {
      const p = plans.find(pl => pl.tier === tier)
      return {
        image:   p?.image_quota ?? 0,
        video:   p?.video_quota ?? 0,
        tryon:   p?.tryon_quota ?? 0,
        credits: p?.monthly_credit_quota ?? 0,
      }
    },
    getCreditQuota: (tier: string): number =>
      plans.find(p => p.tier === tier)?.monthly_credit_quota ?? 0,
    getQuotaNote: (tier: string): string => {
      const p = plans.find(pl => pl.tier === tier)
      return p ? formatQuotaNote(p) : ''
    },

    // ── Credit cost & daily limit per tool ────────────────────
    getCreditCost: (toolId: string): number =>
      data?.credit_costs?.find(c => c.tool_id === toolId)?.credit_cost ?? 0,
    getDailyLimit: (tier: string, toolId: string): number | null =>
      data?.daily_limits?.find(l => l.tier === tier && l.tool_id === toolId)?.daily_limit ?? null,

    // ── Feature flags ─────────────────────────────────────────
    isAvailable: (toolId: string, tier: string): boolean => {
      const f = features.find(ff => ff.tool_id === toolId)
      if (!f) return false
      const key = TIER_KEY[tier]
      return key ? Boolean(f[key]) : false
    },
    getFeatureMatrix: () => {
      const byCat = new Map<string, FeatureFlag[]>()
      for (const f of features) {
        if (!byCat.has(f.category)) byCat.set(f.category, [])
        byCat.get(f.category)!.push(f)
      }
      return Array.from(byCat.entries()).map(([category, rows]) => ({
        category,
        rows: rows.map(f => ({
          tool_id: f.tool_id, label: f.display_name, status: f.status,
          s: f.available_starter, b: f.available_basic, p: f.available_pro, biz: f.available_business,
        })),
      }))
    },
    getFeatureList: (tier: string): string[] => {
      const key = TIER_KEY[tier]
      if (!key) return []
      return features.filter(f => f.status === 'enabled' && Boolean(f[key])).map(f => f.display_name)
    },

    // ── Add-ons ───────────────────────────────────────────────
    getAddons: (kind: 'active' | 'coming-soon' = 'active'): Addon[] =>
      addons.filter(a => a.kind === kind),

    refresh: () => mutate(),
  }
}