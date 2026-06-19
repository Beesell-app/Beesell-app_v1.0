// app/api/admin/users/[userId]/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/admin/users/[userId]  — full user detail
// 
// ⚡ FIXED untuk Next.js 16:
//    - await cookies() via helper
//    - params sekarang Promise (must await)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  // ⚡ Next.js 16: params adalah Promise, harus await
  const { userId } = await params

  const { data, error } = await supabase.rpc('admin_user_detail', {
    p_user_id: userId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}