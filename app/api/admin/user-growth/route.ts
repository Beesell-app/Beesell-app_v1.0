// app/api/admin/user-growth/route.ts
// ⚡ FIX: RPC pakai authClient (session) supaya auth.uid() works
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { authClient } = auth

  const params = new URL(req.url).searchParams
  const days = Math.min(Math.max(parseInt(params.get('days') || '30'), 1), 365)

  const { data, error } = await authClient.rpc('admin_get_user_growth', { p_days: days })

  if (error) {
    console.error('[user-growth] RPC error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ days, data }, {
    headers: { 'Cache-Control': 'private, max-age=120' },
  })
}