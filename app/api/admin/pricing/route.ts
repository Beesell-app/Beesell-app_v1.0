// app/api/admin/pricing/route.ts
// ══════════════════════════════════════════════════════════════
// GET   /api/admin/pricing  — plan_config + daily_limit_config + credit_costs
// PATCH /api/admin/pricing  — update plan/limit/credit_cost
// 
// ⚡ v3 FIX:
//    - maybeSingle() (bukan single) → no PGRST116 crash
//    - Clear error message kalau row tidak ketemu (0 rows)
//    - Detect RLS block: update jalan tapi 0 rows affected
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const [planConfig, dailyLimits, creditCosts] = await Promise.all([
    supabase.from('plan_config').select('*').order('sort_order', { ascending: true }),
    supabase.from('daily_limit_config').select('*').order('tier').order('tool_id'),
    supabase.from('tool_credit_cost').select('*').order('credit_cost'),
  ])

  if (planConfig.error || dailyLimits.error || creditCosts.error) {
    return NextResponse.json({
      error: 'fetch_failed',
      details: planConfig.error?.message || dailyLimits.error?.message || creditCosts.error?.message,
    }, { status: 500 })
  }

  return NextResponse.json({
    plans:        planConfig.data,
    daily_limits: dailyLimits.data,
    credit_costs: creditCosts.data,
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const { resource, where, updates } = body

  if (!resource || !where || !updates) {
    return NextResponse.json({
      error: 'invalid_input',
      message: 'resource, where, updates required',
    }, { status: 400 })
  }

  const VALID_TABLES = ['plan_config', 'daily_limit_config', 'tool_credit_cost']
  if (!VALID_TABLES.includes(resource)) {
    return NextResponse.json({ error: 'invalid_resource' }, { status: 400 })
  }

  // ── 1. Get BEFORE value (maybeSingle: null kalau tidak ada, no crash) ──
  let beforeQuery = supabase.from(resource).select('*')
  for (const [key, value] of Object.entries(where)) {
    beforeQuery = beforeQuery.eq(key, value as any)
  }
  const { data: before, error: beforeError } = await beforeQuery.maybeSingle()

  if (beforeError) {
    return NextResponse.json({
      error: 'fetch_before_failed',
      message: beforeError.message,
    }, { status: 500 })
  }

  // ⚡ Row tidak ketemu — kasih error JELAS (bukan PGRST116 misterius)
  if (!before) {
    return NextResponse.json({
      error: 'row_not_found',
      message: `Tidak ada row di ${resource} dengan kondisi ${JSON.stringify(where)}. ` +
               `Kemungkinan: (a) data belum di-seed, (b) RLS memblok akses. ` +
               `Run SQL seed + fix-rls-admin-write.sql.`,
      where,
    }, { status: 404 })
  }

  // ── 2. UPDATE (pakai .select() tanpa single dulu untuk detect 0 rows) ──
  let updateQuery = supabase.from(resource).update({
    ...updates,
    updated_at: new Date().toISOString(),
  })
  for (const [key, value] of Object.entries(where)) {
    updateQuery = updateQuery.eq(key, value as any)
  }
  const { data: updatedRows, error: updateError } = await updateQuery.select()

  if (updateError) {
    return NextResponse.json({
      error: 'update_failed',
      message: updateError.message,
      hint: updateError.message.includes('column')
        ? 'Kolom tidak ada — run fix-plan-config-columns.sql'
        : undefined,
    }, { status: 500 })
  }

  // ⚡ Update jalan tapi 0 rows affected = RLS block WRITE
  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json({
      error: 'rls_blocked',
      message: `UPDATE diblok RLS policy. Row ada (SELECT ok) tapi WRITE ditolak. ` +
               `Run fix-rls-admin-write.sql untuk tambah policy admin write, ` +
               `dan pastikan user_roles kamu = superuser/admin.`,
    }, { status: 403 })
  }

  const after = updatedRows[0]

  // ── 3. Audit log (best-effort, jangan fail request kalau log gagal) ──
  try {
    await supabase.rpc('log_admin_action', {
      p_action: `update_${resource}`,
      p_resource_type: resource,
      p_resource_id: JSON.stringify(where),
      p_before_value: before,
      p_after_value: after,
    })
  } catch (e) {
    console.warn('[pricing] audit log failed (non-fatal):', e)
  }

  return NextResponse.json({ data: after })
}