// app/api/admin/feature-flags/route.ts
// ══════════════════════════════════════════════════════════════
// GET    /api/admin/feature-flags   — list all flags
// PATCH  /api/admin/feature-flags   — update flag
// 
// ⚡ FIXED untuk Next.js 16: pakai requireAdminApi() helper
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'
import { FEATURES, type Tier } from '@/components/dashboard/studio-menu-config'
import { FEATURE_FLAGS } from '@/lib/feature-flags'


const TIER_ORDER: Tier[] = ['starter', 'basic', 'pro', 'business']
function defaultTiers(required: Tier) {
  const i = TIER_ORDER.indexOf(required)
  return {
    available_starter:  i <= 0,
    available_basic:    i <= 1,
    available_pro:      i <= 2,
    available_business: i <= 3,
  }
}
// GET — list all flags
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { data: rows } = await supabase.from('feature_flags_db').select('*')
  const byId = new Map((rows ?? []).map((r: any) => [r.tool_id, r]))

  const flags = FEATURES.map(f => {
    const row = byId.get(f.id)
    const base = row ?? {
      tool_id: f.id,
      status: FEATURE_FLAGS[f.id]?.status ?? 'enabled',
      reason: FEATURE_FLAGS[f.id]?.reason ?? null,
      coming_soon_at: null,
      ...defaultTiers(f.tierRequired),
      updated_at: null,
    }
    return { ...base, name: f.name, category: f.category, subCategory: f.subCategory ?? null }
  })

  return NextResponse.json({ flags })
}

const ALLOWED = ['status', 'available_starter', 'available_basic', 'available_pro', 'available_business', 'reason', 'coming_soon_at'] as const


// PATCH — update flag (toggle status, tier availability)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const { tool_id, ...rest } = body
  if (!tool_id) return NextResponse.json({ error: 'tool_id required' }, { status: 400 })

  const updates = Object.fromEntries(
    Object.entries(rest).filter(([k]) => (ALLOWED as readonly string[]).includes(k)),
  )

  const { data: before } = await supabase.from('feature_flags_db').select('*').eq('tool_id', tool_id).maybeSingle()

  const { data: after, error } = await supabase
    .from('feature_flags_db')
    .upsert({ tool_id, ...updates, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: 'tool_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await supabase.rpc('log_admin_action', {
      p_action: 'update_feature_flag', p_resource_type: 'feature_flag',
      p_resource_id: tool_id, p_before_value: before, p_after_value: after,
    })
  } catch {
    // Ignore logging failures
  }

  return NextResponse.json({ flag: after })
}

