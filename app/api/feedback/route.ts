// apps/web-app/app/api/feedback/route.ts
// POST /api/feedback — submit feedback from any context
import { NextResponse }  from 'next/server'
import { z }             from 'zod'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Schema = z.object({
  type:    z.enum(['general', 'logout', 'bug', 'feature', 'nps_comment']).default('general'),
  rating:  z.number().int().min(1).max(5).optional(),
  message: z.string().min(1).max(2000),
  url:     z.string().max(500).optional(),
})

export async function POST(req: Request) {
  const body   = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  // Get tenant if logged in (optional for feedback)
  let tenant_id: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { tenant_id: true } })
      tenant_id = dbUser?.tenant_id ?? null
    }
  } catch {}

  const { type, rating, message, url } = parsed.data

  await db.$executeRaw`
    INSERT INTO feedback (tenant_id, type, rating, message, url, ua)
    VALUES (
      ${tenant_id}::uuid,
      ${type},
      ${rating ?? null}::smallint,
      ${message},
      ${url ?? null},
      ${req.headers.get('user-agent')?.slice(0, 300) ?? null}
    )
  `

  return NextResponse.json({ success: true })
}