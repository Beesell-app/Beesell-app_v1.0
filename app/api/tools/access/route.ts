// app/api/tools/access/route.ts
// ── User-facing: akses tool untuk user saat ini ───────────────
// GET → { tier, access: { [toolId]: ToolAccess } }
// Dipakai UI (Quick Tools dll) untuk menampilkan status tool
// sesuai Feature Flag yang di-set admin.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { isSuperuserEmail } from '@/lib/feature-flags'
import { getToolAccessMap } from '@/lib/tools/access'
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  return NextResponse.json(await getToolAccessMap(user.id))
}