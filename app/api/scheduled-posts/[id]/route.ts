// apps/web-app/app/api/scheduled-posts/[id]/route.ts
// GET    /api/scheduled-posts/[id] → single post detail
// PATCH  /api/scheduled-posts/[id] → reschedule or retry
// DELETE /api/scheduled-posts/[id] → cancel
import { NextResponse }  from 'next/server'
import { z }             from 'zod'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'

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
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const rows = await db.$queryRaw<any[]>`
    SELECT sp.*, c.title AS "contentTitle", c.media_url AS "contentmedia_url"
    FROM scheduled_posts sp
    LEFT JOIN contents c ON c.id = sp.content_id
    WHERE sp.id = ${id}::uuid AND sp.tenant_id = ${me.tenant_id}::uuid
    LIMIT 1
  `

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, post: rows[0] })
}

// ── PATCH ─────────────────────────────────────────────────────
const PatchSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  action:      z.enum(['reschedule', 'retry', 'cancel']).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.$queryRaw<[{ status: string; contentId: string | null }]>`
    SELECT status, content_id AS "contentId"
    FROM scheduled_posts
    WHERE id = ${id}::uuid AND tenant_id = ${me.tenant_id}::uuid
    LIMIT 1
  `
  if (!existing[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { action, scheduledAt } = parsed.data

  if (action === 'reschedule' || scheduledAt) {
    const newDate = new Date(scheduledAt!)
    if (newDate < new Date()) {
      return NextResponse.json({ error: 'PAST_DATE', message: 'Waktu jadwal harus di masa depan.' }, { status: 422 })
    }

    await db.$executeRaw`
      UPDATE scheduled_posts SET
        scheduled_at  = ${newDate}::timestamptz,
        status        = 'queued',
        retry_count   = 0,
        next_retry_at = NULL,
        error_message = NULL,
        error_code    = NULL
      WHERE id = ${id}::uuid
    `
  } else if (action === 'retry') {
    // Force immediate retry
    await db.$executeRaw`
      UPDATE scheduled_posts SET
        status        = 'queued',
        next_retry_at = NOW(),
        error_message = NULL,
        error_code    = NULL
      WHERE id = ${id}::uuid AND status = 'failed'
    `
  }

  return NextResponse.json({ success: true })
}

// ── DELETE: cancel ────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const rows = await db.$queryRaw<[{ contentId: string | null }]>`
    SELECT content_id AS "contentId"
    FROM scheduled_posts
    WHERE id = ${id}::uuid AND tenant_id = ${me.tenant_id}::uuid
    LIMIT 1
  `
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.$executeRaw`
    UPDATE scheduled_posts SET
      status      = 'canceled',
      canceled_at = NOW()
    WHERE id = ${id}::uuid
  `

  // Revert content status
  if (rows[0].contentId) {
    await db.content.update({
      where: { id: rows[0].contentId },
      data:  { status: 'ready', scheduledFor: null },
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}