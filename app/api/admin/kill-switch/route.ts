// app/api/admin/kill-switch/route.ts
// ══════════════════════════════════════════════════════════════
// GET   /api/admin/kill-switch — daftar switch (skema Phase 1)
// PATCH /api/admin/kill-switch — toggle by id { id, is_killed, reason }
// 
// Skema existing: id(uuid), scope, target, is_killed, reason, killed_by, killed_at
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { data, error } = await supabase
    .from('kill_switches')
    .select('id, scope, target, is_killed, reason, killed_at, auto_restore_at')
    .order('scope', { ascending: true })
    .order('target', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ switches: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { id, is_killed, reason } = body
  if (!id || typeof is_killed !== 'boolean') {
    return NextResponse.json({ error: 'invalid_input', message: 'id + is_killed (boolean) wajib' }, { status: 400 })
  }

  const { data, error } = await supabase.from('kill_switches').update({
    is_killed,
    reason:    is_killed ? (reason ?? null) : null,
    killed_at: is_killed ? new Date().toISOString() : null,
    killed_by: is_killed ? (user?.id ?? null) : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data?.[0] })
}