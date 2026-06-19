import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }           from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const u = await db.user.findUnique({
    where:  { id: user.id },
    select: { tenants: { select: {
      plan: true, image_credits_used: true, image_credits_max: true,
      quota_video_used: true, quota_video_max: true,
    } } },
  })
  const t = u?.tenants
  return NextResponse.json({
    plan:               t?.plan ?? 'free',
    image_credits_used: t?.image_credits_used ?? 0,
    image_credits_max:  t?.image_credits_max  ?? 0,
    quota_video_used:   t?.quota_video_used   ?? 0,
    quota_video_max:    t?.quota_video_max    ?? 0,
  })
}