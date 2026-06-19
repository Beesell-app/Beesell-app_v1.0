// app/api/admin/users/[userId]/action/route.ts
// ══════════════════════════════════════════════════════════════
// POST /api/admin/users/[userId]/action
// Body: { action: 'adjust_credit'|'change_tier'|'suspend', ...params }
// 
// ⚡ FIXED untuk Next.js 16
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  // ⚡ Next.js 16: params Promise
  const { userId } = await params

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const { action, ...actionParams } = body

  switch (action) {
    case 'adjust_credit': {
      if (typeof actionParams.amount !== 'number') {
        return NextResponse.json({ error: 'amount required (number)' }, { status: 400 })
      }
      if (!actionParams.reason || actionParams.reason.length < 3) {
        return NextResponse.json({ error: 'reason required (min 3 char)' }, { status: 400 })
      }
      
      const { data, error } = await supabase.rpc('admin_adjust_credit', {
        p_user_id: userId,
        p_amount:  actionParams.amount,
        p_reason:  actionParams.reason,
      })
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, result: data })
    }

    case 'change_tier': {
      if (!['starter', 'basic', 'pro', 'business'].includes(actionParams.new_tier)) {
        return NextResponse.json({ error: 'invalid_tier' }, { status: 400 })
      }
      
      const { data, error } = await supabase.rpc('admin_change_user_tier', {
        p_user_id:  userId,
        p_new_tier: actionParams.new_tier,
        p_reason:   actionParams.reason || null,
      })
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, result: data })
    }

    case 'suspend': {
      const status = actionParams.status || 'suspended'
      if (!['active', 'suspended', 'banned'].includes(status)) {
        return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
      }
      if (status !== 'active' && (!actionParams.reason || actionParams.reason.length < 3)) {
        return NextResponse.json({ error: 'reason required' }, { status: 400 })
      }
      
      const { data, error } = await supabase.rpc('admin_suspend_user', {
        p_user_id: userId,
        p_status:  status,
        p_reason:  actionParams.reason || null,
      })
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, result: data })
    }

    default:
      return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
  }
}