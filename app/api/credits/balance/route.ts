// app/api/credits/balance/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/credits/balance — Fetch user's credit balance
// Dipakai oleh useCredits hook
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'edge'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ── Get credit balance ────────────────────────────────────
  const { data: credits, error } = await supabase
    .from('user_credits')
    .select(`
      current_balance,
      monthly_quota,
      plan_tier,
      next_reset_at,
      total_used_this_month,
      total_topup_balance
    `)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[credits/balance] error:', error)
    return NextResponse.json(
      { error: 'fetch_failed', message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(credits, {
    headers: {
      'Cache-Control': 'private, max-age=60',  // 1 menit cache
    },
  })
}