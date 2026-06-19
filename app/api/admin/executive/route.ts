// app/api/admin/executive/route.ts
// ⚡ FIX: RPC pakai authClient (session) supaya auth.uid() works
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export const revalidate = 60

export async function GET() {
  const auth = await requireAdminApi()
  if (auth === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (auth instanceof NextResponse) return auth
  const { authClient } = auth

  const { data, error } = await authClient.rpc('admin_get_executive_summary')

  if (error) {
    console.error('[executive] RPC error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  })
}