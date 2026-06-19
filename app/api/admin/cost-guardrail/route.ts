// app/api/admin/cost-guardrail/route.ts
// ══════════════════════════════════════════════════════════════
// GET   /api/admin/cost-guardrail — guardrails + spend aktual (IDR)
// PATCH /api/admin/cost-guardrail — update cap/warn/action by id
// 
// Skema existing: id, scope, target, period(daily/weekly/monthly),
//   cap_idr, warn_threshold_pct, action_on_exceed, is_active
// ai_usage_daily.cost_usd → IDR (×16000) untuk dibandingkan cap_idr.
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

const USD_TO_IDR = 16000

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [grRes, dayRes, weekRes, monthRes] = await Promise.all([
    supabase.from('cost_guardrails').select('*').order('period', { ascending: true }),
    supabase.from('ai_usage_daily').select('cost_usd').eq('stat_date', today),
    supabase.from('ai_usage_daily').select('cost_usd').gte('stat_date', weekAgo),
    supabase.from('ai_usage_daily').select('cost_usd').gte('stat_date', monthStart),
  ])

  const sumIdr = (rows: any[] | null) => (rows ?? []).reduce((s, r) => s + (r.cost_usd || 0), 0) * USD_TO_IDR

  return NextResponse.json({
    guardrails: grRes.data ?? [],
    spend_idr: { daily: sumIdr(dayRes.data), weekly: sumIdr(weekRes.data), monthly: sumIdr(monthRes.data) },
    error: grRes.error?.message ?? null,
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { id, updates } = body
  if (!id || !updates) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  const ALLOWED = ['cap_idr', 'warn_threshold_pct', 'action_on_exceed', 'is_active']
  const safe: Record<string, unknown> = {}
  for (const k of ALLOWED) if (k in updates) safe[k] = updates[k]
  safe.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from('cost_guardrails').update(safe).eq('id', id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data?.[0] })
}