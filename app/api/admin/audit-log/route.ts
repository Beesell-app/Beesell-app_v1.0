// app/api/admin/audit-log/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/admin/audit-log — baca admin_audit_log (sudah ada dari Phase 2)
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const [logRes, usersRes] = await Promise.all([
    supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('users').select('id, email'),
  ])

  return NextResponse.json({
    logs:  logRes.data ?? [],
    users: usersRes.data ?? [],
    error: logRes.error?.message ?? null,
  })
}