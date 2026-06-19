// app/api/admin/top-tools/route.ts
// ⚡ FIX: RPC pakai authClient (session) supaya auth.uid() works
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { authClient } = auth

  const params = new URL(req.url).searchParams
  const days  = Math.min(Math.max(parseInt(params.get('days') || '30'), 1), 365)
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '10'), 1), 50)
  const sortRaw = (params.get('sort') || 'usage').toLowerCase()
  const sort = ['usage', 'cost', 'margin'].includes(sortRaw) ? sortRaw : 'usage'

  const { data, error } = await authClient.rpc('admin_get_top_tools', {
    p_days: days, p_limit: limit, p_sort: sort,
  })

  if (error) {
    console.error('[top-tools] RPC error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ days, limit, sort, ...data }, {
    headers: { 'Cache-Control': 'private, max-age=120' },
  })
}