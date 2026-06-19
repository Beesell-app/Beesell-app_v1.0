// app/api/admin/addons/route.ts
// ══════════════════════════════════════════════════════════════
// GET   /api/admin/addons       — list semua addon (incl inactive)
// PATCH /api/admin/addons       — update 1 addon by addon_id
// 
// Pakai requireAdminApi (service role untuk write, bypass RLS)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { data, error } = await supabase
    .from('addon_config')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ addons: data })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const { addon_id, updates } = body
  if (!addon_id || !updates) {
    return NextResponse.json({ error: 'invalid_input', message: 'addon_id + updates wajib' }, { status: 400 })
  }

  // Whitelist field yang boleh diubah
  const ALLOWED = ['label', 'qty', 'price', 'icon', 'color', 'badge', 'kind', 'eta', 'sort_order', 'is_active']
  const safe: Record<string, unknown> = {}
  for (const k of ALLOWED) if (k in updates) safe[k] = updates[k]
  safe.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('addon_config')
    .update(safe)
    .eq('addon_id', addon_id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'not_found', message: `addon ${addon_id} tidak ada` }, { status: 404 })
  }

  return NextResponse.json({ data: data[0] })
}