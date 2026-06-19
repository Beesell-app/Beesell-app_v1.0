// app/api/usage/daily/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/usage/daily — Fetch user's daily usage status
// Dipakai oleh useDailyUsage hook + UsageProgressBadge
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

  // ── Auth check ────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401 }
    )
  }

  // ── Call RPC ──────────────────────────────────────────────
  const { data, error } = await supabase
    .rpc('get_user_daily_usage', { p_user_id: user.id })

  if (error) {
    console.error('[usage/daily] RPC error:', error)
    return NextResponse.json(
      { error: 'fetch_failed', message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=30',  // 30 detik cache
    },
  })
}