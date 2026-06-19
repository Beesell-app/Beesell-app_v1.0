// app/api/admin/users/route.ts
// GET /api/admin/users?search=&tier=&status=&limit=&offset=

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'edge'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {}, remove: () => {},
      },
    }
  )
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  
  const { data: role } = await supabase.rpc('check_user_role', { p_user_id: user.id })
  if (!['superuser', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const params = new URL(req.url).searchParams
  const search = params.get('search') || null
  const tier   = params.get('tier') || null
  const status = params.get('status') || null
  const limit  = Math.min(parseInt(params.get('limit') || '50'), 200)
  const offset = parseInt(params.get('offset') || '0')

  const { data, error } = await supabase.rpc('admin_list_users', {
    p_search: search, p_tier: tier, p_status: status,
    p_limit:  limit, p_offset: offset,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = (data?.[0]?.total_count) ?? 0

  return NextResponse.json({
    users: data ?? [],
    pagination: { limit, offset, total: Number(total), has_more: offset + limit < Number(total) },
  })
}