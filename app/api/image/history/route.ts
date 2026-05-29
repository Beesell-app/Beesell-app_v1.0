// apps/web-app/app/api/image/history/route.ts
// GET /api/image/history — generation history for current user

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }           from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'UNAUTHORIZED' }, { status:401 })

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(Number(searchParams.get('limit') ?? '20'), 50)
  const offset = Number(searchParams.get('offset') ?? '0')
  const status = searchParams.get('status') // completed|failed|all

  const dbUser = await db.user.findUnique({
    where:  { id:user.id },
    select: { tenantId:true, tenant:{ select:{ imageCreditUsed:true, imageCreditMax:true, plan:true } } },
  })
  if (!dbUser) return NextResponse.json({ error:'NOT_FOUND' }, { status:404 })

  const { tenantId } = dbUser

  // Fetch generations with results
  const generations = await db.$queryRaw<any[]>`
    SELECT
      ig.id, ig.product_name, ig.content_type, ig.visual_style, ig.platform,
      ig.ratio, ig.status, ig.credits_used, ig.provider, ig.created_at,
      ig.error_message,
      ir.cdn_url       AS media_url,
      ir.thumbnail_url,
      ir.is_saved,
      ir.is_upscaled,
      ir.id            AS result_id
    FROM image_generations ig
    LEFT JOIN image_results ir ON ir.generation_id = ig.id
    WHERE ig.tenant_id = ${tenantId}::uuid
      ${status && status !== 'all' ? `AND ig.status = '${status}'` : ''}
    ORDER BY ig.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const total = await db.$queryRaw<[{count:bigint}]>`
    SELECT COUNT(*) FROM image_generations WHERE tenant_id = ${tenantId}::uuid
  `

  return NextResponse.json({
    generations,
    pagination: {
      total:  Number(total[0]?.count ?? 0),
      limit,
      offset,
      hasMore: offset + limit < Number(total[0]?.count ?? 0),
    },
    quota: {
      used:     dbUser.tenant.imageCreditUsed ?? 0,
      max:      dbUser.tenant.imageCreditMax  ?? 5,
      plan:     dbUser.tenant.plan,
    },
  })
}