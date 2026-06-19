// app/api/admin/credits/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/admin/credits — data untuk Credit Economy
// 
//   - credits: user_credits (saldo, quota, purchased/consumed per user)
//   - plans:   plan_config (untuk nilai kredit + utilisasi)
//   - packs:   credit_packs (paket kredit)
//   - ledger:  credit_ledger recent (untuk top tools + aktivitas)
// 
// Defensive: tabel kosong / belum ada → array kosong, tidak error.
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const [creditsRes, plansRes, packsRes, ledgerRes] = await Promise.all([
    supabase.from('user_credits')
      .select('user_id, plan_tier, current_balance, monthly_quota, total_purchased, total_consumed, total_used_this_month, status'),
    supabase.from('plan_config')
      .select('tier, display_name, price_monthly, monthly_credit_quota, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('credit_packs')
      .select('id, display_name, credits, price_idr, is_active'),
    supabase.from('credit_ledger')
      .select('tool_id, amount, balance_before, balance_after, created_at, description')
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  return NextResponse.json({
    credits: creditsRes.data ?? [],
    plans:   plansRes.data ?? [],
    packs:   packsRes.data ?? [],
    ledger:  ledgerRes.data ?? [],
    errors: {
      credits: creditsRes.error?.message ?? null,
      ledger:  ledgerRes.error?.message ?? null,
    },
  })
}