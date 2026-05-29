// apps/web-app/app/api/notifications/preferences/route.ts
// GET  /api/notifications/preferences → get preferences
// POST /api/notifications/preferences → update preferences
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
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { tenant_id: true } })
  return dbUser ? { userId: user.id, tenant_id: dbUser.tenant_id } : null
}

const DEFAULT_PREFS = {
  push_publish:  true,   // push on success
  push_failed:   true,   // push on failure
  email_publish: false,  // email on success (off by default — too spammy)
  email_failed:  true,   // email on failure
}

// ── GET ──────────────────────────────────────────────────────
export async function GET() {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureTable()

  const rows = await db.$queryRaw<[{ preferences: any }]>`
    SELECT preferences FROM notification_preferences
    WHERE tenant_id = ${me.tenant_id}::uuid LIMIT 1
  `

  const prefs = rows[0]?.preferences ?? DEFAULT_PREFS
  return NextResponse.json({ success: true, preferences: { ...DEFAULT_PREFS, ...prefs } })
}

// ── POST ─────────────────────────────────────────────────────
const PrefsSchema = z.object({
  push_publish:  z.boolean().optional(),
  push_failed:   z.boolean().optional(),
  email_publish: z.boolean().optional(),
  email_failed:  z.boolean().optional(),
})

export async function POST(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = PrefsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  await ensureTable()

  await db.$executeRaw`
    INSERT INTO notification_preferences (tenant_id, preferences)
    VALUES (${me.tenant_id}::uuid, ${JSON.stringify(parsed.data)}::jsonb)
    ON CONFLICT (tenant_id) DO UPDATE SET
      preferences = notification_preferences.preferences || ${JSON.stringify(parsed.data)}::jsonb,
      updated_at  = NOW()
  `

  return NextResponse.json({ success: true })
}

async function ensureTable() {
  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      tenant_id    UUID        PRIMARY KEY,
      preferences  JSONB       NOT NULL DEFAULT '{}',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch(() => {})
}