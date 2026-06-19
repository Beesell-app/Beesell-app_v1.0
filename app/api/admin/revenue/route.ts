// app/api/admin/revenue/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/admin/revenue?days=30&view=both
// 
// ⚡ FIX: RPC analytics dipanggil pakai authClient (anon + session)
//    supaya auth.uid() di dalam RPC guard terisi.
//    Service client (supabase) TIDAK punya session → auth.uid() NULL → Forbidden.
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

interface RpcResult<T = unknown> {
  data:  T | null
  error: { message: string } | null
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  if (typeof auth !== 'object' || auth === null || !('authClient' in auth)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ⚡ Pakai authClient (punya session), BUKAN supabase (service role)
  const { authClient } = auth

  const params = new URL(req.url).searchParams
  const daysRaw = parseInt(params.get('days') || '30')
  const days = Math.min(Math.max(daysRaw, 1), 365)
  const view = params.get('view') || 'both'

  const tasks: Array<PromiseLike<RpcResult>> = []

  if (view === 'timeseries' || view === 'both') {
    tasks.push(
      authClient.rpc('admin_get_revenue_timeseries', { p_days: days }).then(r => r as RpcResult)
    )
  }
  if (view === 'by_tier' || view === 'both') {
    tasks.push(
      authClient.rpc('admin_get_revenue_by_tier', { p_days: days }).then(r => r as RpcResult)
    )
  }

  const results = await Promise.all(tasks)

  for (const r of results) {
    if (r.error) {
      console.error('[revenue] RPC error:', r.error)
      return NextResponse.json({ error: r.error.message }, { status: 500 })
    }
  }

  const response: Record<string, unknown> = { days }
  let idx = 0
  if (view === 'timeseries' || view === 'both') response.timeseries = results[idx++].data
  if (view === 'by_tier' || view === 'both')    response.by_tier    = results[idx++].data

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'private, max-age=120' },
  })
}