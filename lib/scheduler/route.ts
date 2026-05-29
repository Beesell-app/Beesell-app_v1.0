// apps/web-app/app/api/scheduler/route.ts
// GET /api/scheduler?weekStart=2026-01-20  → events for that week
// POST /api/scheduler                      → schedule a content
import { NextResponse }  from 'next/server'
import { z }             from 'zod'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { startOfWeek, endOfWeek, addDays } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await db.user.findUnique({
    where: { id: user.id },

    select: {
      tenant_id: true,
      name: true,

      tenants: {
        select: {
          plan: true,
          name: true,
        },
      },
    },
  })
  return dbUser ? { userId: user.id, tenant_id: dbUser.tenant_id } : null
}

// ── GET: week events ─────────────────────────────────────────
export async function GET(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekStartStr = searchParams.get('weekStart')

  // Default to current week if not provided
  const weekStart = weekStartStr
    ? startOfWeek(new Date(weekStartStr), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 })

  const weekEnd = addDays(weekStart, 7)

  const contents = await db.content.findMany({
    where: {
      tenant_id:    me.tenant_id,
      deleted_at:   null,
      status:      { in: ['scheduled', 'published', 'failed'] },
      scheduledFor: {
        gte: weekStart,
        lt:  weekEnd,
      },
    },
    orderBy: { scheduledFor: 'asc' },
    select: {
      id:              true,
      title:           true,
      caption_text:     true,
      media_url:        true,
      primary_platform: true,
      status:          true,
      scheduledFor:    true,
    },
  })

  const events = contents.map(c => ({
    id:          c.id,
    contentId:   c.id,
    title:       c.title || c.caption_text?.slice(0, 50) || 'Untitled',
    caption:     c.caption_text?.slice(0, 100),
    media_url:    c.media_url,
    platform:    c.primary_platform ?? 'instagram',
    scheduledFor: c.scheduledFor?.toISOString(),
    durationMin: 60,
    status:      c.status,
  }))

  return NextResponse.json({ success: true, events })
}

// ── POST: schedule content ────────────────────────────────────
const ScheduleSchema = z.object({
  contentId:   z.string().uuid(),
  scheduledFor: z.string().datetime(),
  durationMin: z.number().min(30).max(480).default(60),
})

export async function POST(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = ScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  const { contentId, scheduledFor, durationMin } = parsed.data

  // Verify content belongs to this tenant
  const content = await db.content.findFirst({
    where: { id: contentId, tenant_id: me.tenant_id, deleted_at: null },
  })
  if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.content.update({
    where: { id: contentId },
    data: {
      status:      'scheduled',
      scheduledFor: new Date(scheduledFor),
    },
    select: {
      id: true, status: true, scheduledFor: true, primary_platform: true,
    },
  })

  return NextResponse.json({ success: true, data: updated }, { status: 201 })
}