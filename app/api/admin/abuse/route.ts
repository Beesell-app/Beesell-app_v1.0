// app/api/admin/abuse/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/admin/abuse — Abuse Detection
// 
//   - users: sinyal keamanan (failed login, locked, IP, signup time)
//   - credits: status suspended + konsumsi (deteksi abuse pemakaian)
// 
// Page yang agregasi (IP cluster, heavy user) client-side.
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const [usersRes, creditsRes] = await Promise.all([
    supabase.from('users')
      .select('id, email, name, last_login_ip, login_count, failed_login_count, locked_until, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase.from('user_credits')
      .select('user_id, plan_tier, status, current_balance, total_used_this_month, suspended_at, suspension_reason')
      .limit(2000),
  ])

  return NextResponse.json({
    users:   usersRes.data ?? [],
    credits: creditsRes.data ?? [],
    errors: { users: usersRes.error?.message ?? null, credits: creditsRes.error?.message ?? null },
  })
}