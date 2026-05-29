// apps/web-app/app/api/notifications/subscribe/route.ts
// POST /api/notifications/subscribe — save FCM push token
// DELETE /api/notifications/subscribe — remove token (unsubscribe)
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

const SubscribeSchema = z.object({
  token:    z.string().min(10).max(500),
  platform: z.enum(['web', 'android', 'ios']).default('web'),
  ua:       z.string().max(300).optional(),
})

// ── POST: save token ──────────────────────────────────────────
export async function POST(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = SubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { token, platform, ua } = parsed.data

  // Ensure table exists (auto-create on first use)
  await ensurePushSubsTable()

  // Upsert token
  await db.$executeRaw`
    INSERT INTO push_subscriptions (tenant_id, user_id, token, platform, ua)
    VALUES (${me.tenant_id}::uuid, ${me.userId}::uuid, ${token}, ${platform}, ${ua ?? null})
    ON CONFLICT (token) DO UPDATE SET
      tenant_id  = EXCLUDED.tenant_id,
      user_id    = EXCLUDED.user_id,
      platform   = EXCLUDED.platform,
      ua         = EXCLUDED.ua,
      is_active  = TRUE,
      updated_at = NOW()
  `

  return NextResponse.json({ success: true })
}

// ── DELETE: unsubscribe ───────────────────────────────────────
export async function DELETE(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  await db.$executeRaw`
    UPDATE push_subscriptions SET is_active = FALSE
    WHERE token = ${token} AND tenant_id = ${me.tenant_id}::uuid
  `

  return NextResponse.json({ success: true })
}

// ── Auto-create table ─────────────────────────────────────────
async function ensurePushSubsTable() {
  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id  UUID        NOT NULL,
      user_id    UUID,
      token      TEXT        NOT NULL UNIQUE,
      platform   VARCHAR(20) NOT NULL DEFAULT 'web',
      ua         VARCHAR(300),
      is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch(() => {})  // ignore if already exists
}