// app/api/admin/cogs/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/admin/cogs
// 
// Return data untuk COGS Unit Economics:
//   - tools: tool_credit_cost (credit_cost + est_cogs_idr) — biaya per tool
//   - plans: plan_config (harga + kuota) — untuk hitung nilai per kredit
// 
// est_cogs_idr = data biaya internal → HANYA admin (bukan public API)
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const [toolsRes, plansRes] = await Promise.all([
    supabase.from('tool_credit_cost')
      .select('tool_id, display_name, credit_cost, est_cogs_idr, category, is_metered')
      .order('est_cogs_idr', { ascending: false }),
    supabase.from('plan_config')
      .select('tier, display_name, price_monthly, monthly_credit_quota, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  if (toolsRes.error || plansRes.error) {
    return NextResponse.json({
      error: 'fetch_failed',
      details: toolsRes.error?.message || plansRes.error?.message,
    }, { status: 500 })
  }

  return NextResponse.json({
    tools: toolsRes.data ?? [],
    plans: plansRes.data ?? [],
  })
}