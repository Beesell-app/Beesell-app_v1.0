// apps/web-app/app/api/scheduled-posts/route.ts
// GET  /api/scheduled-posts           → list scheduled posts (week view)
// POST /api/scheduled-posts           → create / schedule a post
import { NextResponse }  from 'next/server'
import { z }             from 'zod'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { subDays, addDays } from 'date-fns'
import { Prisma }        from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await db.user.findUnique({
    where: { id: user.id }, select: { tenant_id: true },
  })
  return dbUser ? { userId: user.id, tenant_id: dbUser.tenant_id } : null
}

// ── GET ──────────────────────────────────────────────────────
export async function GET(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')
  const status = searchParams.get('status') ?? 'all'

  const fromDate = from ? new Date(from) : subDays(new Date(), 1)
  const toDate   = to   ? new Date(to)   : addDays(new Date(), 30)

  const posts = await db.$queryRaw<any[]>`
    SELECT
      sp.id,
      sp.tenant_id        AS "tenant_id",
      sp.content_id       AS "contentId",
      sp.platform,
      sp.platform_account_id AS "platformaccount_id",
      sp.caption,
      sp.hashtags,
      sp.media_url        AS "media_url",
      sp.video_url        AS "videoUrl",
      sp.media_type       AS "mediaType",
      sp.scheduled_at     AS "scheduledAt",
      sp.status,
      sp.retry_count      AS "retryCount",
      sp.next_retry_at    AS "nextRetryAt",
      sp.error_message    AS "error_message",
      sp.error_code       AS "error_Code",
      sp.published_at     AS "publishedAt",
      sp.platform_post_id AS "platformPostId",
      sp.platform_permalink AS "platformPermalink",
      sp.created_at       AS "created_at",
      -- Content details for display
      c.title             AS "contentTitle",
      c.media_url         AS "contentmedia_url"
    FROM scheduled_posts sp
    LEFT JOIN contents c ON c.id = sp.content_id
    WHERE
      sp.tenant_id   = ${me.tenant_id}::uuid
      AND sp.scheduled_at >= ${fromDate}::timestamptz
      AND sp.scheduled_at <= ${toDate}::timestamptz
      ${status !== 'all'
        ? Prisma.sql`AND sp.status = ${status}`
        : Prisma.empty
      }
    ORDER BY sp.scheduled_at ASC
    LIMIT 200
  `

  return NextResponse.json({ success: true, posts })
}

// ── POST ─────────────────────────────────────────────────────
const CreateSchema = z.object({
  contentId:   z.string().uuid(),
  platform:    z.enum(['instagram', 'instagram_reels', 'tiktok']),
  scheduledAt: z.string().datetime(),
  caption:     z.string().max(2200).optional(),
  hashtags:    z.array(z.string()).max(30).optional(),
  media_url:    z.string().url().optional(),
  videoUrl:    z.string().url().optional(),
  mediaType:   z.enum(['IMAGE', 'REELS', 'CAROUSEL']).default('IMAGE'),
  carouselItems: z.array(z.string().url()).max(10).optional(),
})

export async function POST(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  const d = parsed.data

  // Verify content belongs to tenant
  const content = await db.content.findFirst({
    where:  { id: d.contentId, tenant_id: me.tenant_id, deleted_at: null },
    select: { caption_text: true, media_url: true, primary_platform: true },
  })
  if (!content) return NextResponse.json({ error: 'Content not found' }, { status: 404 })

  // Check platform connection exists
  const conn = await db.$queryRaw<[{ id: string; status: string; account_id: string | null }]>`
    SELECT id, status, account_id AS "account_id"
    FROM platform_connections
    WHERE tenant_id = ${me.tenant_id}::uuid AND platform = ${d.platform}
    LIMIT 1
  `

  if (!conn[0] || conn[0].status !== 'connected') {
    return NextResponse.json({
      error:   'PLATFORM_NOT_CONNECTED',
      message: `Platform ${d.platform} belum terhubung. Hubungkan dulu di Pengaturan.`,
    }, { status: 422 })
  }

  // Validate schedule time is in future
  const scheduledAt = new Date(d.scheduledAt)
  if (scheduledAt < new Date()) {
    return NextResponse.json({ error: 'PAST_DATE', message: 'Waktu jadwal harus di masa depan.' }, { status: 422 })
  }

  // Create scheduled post
  const post = await db.$queryRaw<[{ id: string }]>`
    INSERT INTO scheduled_posts (
      tenant_id, content_id, platform, platform_account_id,
      caption, hashtags, media_url, video_url, media_type,
      scheduled_at, metadata
    ) VALUES (
      ${me.tenant_id}::uuid,
      ${d.contentId}::uuid,
      ${d.platform},
      ${conn[0].account_id},
      ${d.caption ?? content.caption_text ?? ''},
      ${d.hashtags ?? []}::text[],
      ${d.media_url ?? content.media_url ?? null},
      ${d.videoUrl ?? null},
      ${d.mediaType},
      ${scheduledAt}::timestamptz,
      ${d.carouselItems ? JSON.stringify({ carouselItems: d.carouselItems }) : null}::jsonb
    )
    RETURNING id
  `

  // Update content status to scheduled
  await db.content.update({
    where: { id: d.contentId },
    data:  { status: 'scheduled', scheduledFor: scheduledAt },
  })

  return NextResponse.json({ success: true, id: post[0].id }, { status: 201 })
}