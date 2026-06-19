// lib/pricing.ts
// ══════════════════════════════════════════════════════════════
// Pricing helpers — v2: + kuota dinamis + formatQuotaNote
// ══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

export interface PlanData {
  tier:          'starter' | 'basic' | 'pro' | 'business'
  display_name:  string
  price_monthly: number
  price_yearly:  number
  tagline:       string
  features:      string[]
  is_popular:    boolean
  is_active:     boolean
  sort_order:    number
  // kuota
  monthly_credit_quota?: number
  image_quota?:  number
  video_quota?:  number
  tryon_quota?:  number
}

export interface DailyLimitData { tier: string; tool_id: string; daily_limit: number }
export interface CreditCostData { tool_id: string; credit_cost: number; display_name: string }

export interface PricingData {
  source:       'db' | 'fallback'
  updated_at:   string | null
  plans:        PlanData[]
  daily_limits: DailyLimitData[]
  credit_costs: CreditCostData[]
}

const SELECT_COLS = 'tier, display_name, price_monthly, price_yearly, tagline, features, is_popular, is_active, sort_order, monthly_credit_quota, image_quota, video_quota, tryon_quota'

export async function getPricing(): Promise<PricingData> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: plans, error } = await supabase
    .from('plan_config')
    .select(SELECT_COLS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !plans?.length) {
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const res = await fetch(`${base}/api/public/pricing`, { next: { revalidate: 60 } })
      if (res.ok) return res.json()
    } catch { /* ignore */ }
    return { source: 'fallback', updated_at: null, plans: [], daily_limits: [], credit_costs: [] }
  }

  const [limitsRes, costsRes] = await Promise.all([
    supabase.from('daily_limit_config').select('tier, tool_id, daily_limit'),
    supabase.from('tool_credit_cost').select('tool_id, credit_cost, display_name'),
  ])

  return {
    source: 'db',
    updated_at: new Date().toISOString(),
    plans: plans as PlanData[],
    daily_limits: (limitsRes.data ?? []) as DailyLimitData[],
    credit_costs: (costsRes.data ?? []) as CreditCostData[],
  }
}

/** 149000 → 'Rp149K' | 0 → 'Gratis' */
export function formatRupiah(amount: number, opts?: { full?: boolean }): string {
  if (amount === 0) return 'Gratis'
  if (opts?.full) return 'Rp' + amount.toLocaleString('id-ID')
  return 'Rp' + Math.round(amount / 1000).toLocaleString('id-ID') + 'K'
}

export function yearlyDiscount(priceMonthly: number, priceYearly: number): number {
  if (!priceMonthly || !priceYearly) return 0
  return Math.round((1 - priceYearly / (priceMonthly * 12)) * 100)
}

export function getDailyLimit(limits: DailyLimitData[], tier: string, toolId: string): number | null {
  return limits.find(l => l.tier === tier && l.tool_id === toolId)?.daily_limit ?? null
}

/**
 * Build quota note string dari kuota DB.
 * starter        → '5 generate total (lifetime)'
 * 1 kuota (img)  → '200 generate/bulan'
 * multi          → '400 img + 5 video + 20 try-on/bln'
 */
export function formatQuotaNote(plan: PlanData): string {
  const img   = plan.image_quota ?? 0
  const vid   = plan.video_quota ?? 0
  const tryon = plan.tryon_quota ?? 0

  if (plan.tier === 'starter') {
    return `${img} generate total (lifetime)`
  }

  const parts: string[] = []
  if (img)   parts.push(`${img.toLocaleString('id-ID')} img`)
  if (vid)   parts.push(`${vid} video`)
  if (tryon) parts.push(`${tryon} try-on`)

  if (parts.length === 0) return '—'
  if (parts.length === 1) return `${img.toLocaleString('id-ID')} generate/bulan`
  return parts.join(' + ') + '/bln'
}