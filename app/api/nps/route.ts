// apps/web-app/app/api/nps/route.ts
// POST /api/nps — submit NPS survey response
// GET  /api/nps/status — check if user should see survey
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
    where: {
      id: user.id,
    },

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

// ── GET: should user see NPS survey? ─────────────────────────
export async function GET(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ show: false })

  const { searchParams } = new URL(req.url)
  const day = parseInt(searchParams.get('day') ?? '3')

  // Check if they already answered this survey day
  const existing = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) AS count FROM nps_responses
    WHERE tenant_id = ${me.tenant_id}::uuid
      AND survey_day = ${day}::smallint
  `

  if (Number(existing[0]?.count ?? 0) > 0) {
    return NextResponse.json({ show: false, reason: 'already_answered' })
  }

  // Check registration date (show D+3 survey)
  const onboarding = await db.$queryRaw<[{ created_at: Date }]>`
    SELECT created_at FROM onboarding_progress
    WHERE tenant_id = ${me.tenant_id}::uuid
    LIMIT 1
  `

  if (!onboarding[0]) return NextResponse.json({ show: false, reason: 'no_onboarding' })

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(onboarding[0].created_at).getTime()) / (1000 * 60 * 60 * 24),
  )

  // Show at D+3, D+7, D+30 (with ±1 day tolerance)
  const surveyDays = [3, 7, 30]
  const shouldShow = surveyDays.some(d => Math.abs(daysSinceJoin - d) <= 1)

  return NextResponse.json({
    show:       shouldShow,
    day:        daysSinceJoin,
    surveyDay:  surveyDays.find(d => Math.abs(daysSinceJoin - d) <= 1) ?? day,
  })
}

// ── POST: submit NPS ──────────────────────────────────────────
const Schema = z.object({
  score:     z.number().int().min(0).max(10),
  reason:    z.string().max(1000).optional(),
  surveyDay: z.number().int().default(3),
})

export async function POST(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { score, reason, surveyDay } = parsed.data

  await db.$executeRaw`
    INSERT INTO nps_responses (tenant_id, score, reason, survey_day)
    VALUES (${me.tenant_id}::uuid, ${score}::smallint, ${reason ?? null}, ${surveyDay}::smallint)
    ON CONFLICT DO NOTHING
  `

  return NextResponse.json({ success: true })
}