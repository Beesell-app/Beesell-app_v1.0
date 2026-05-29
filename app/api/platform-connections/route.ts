// apps/web-app/app/api/platform-connections/route.ts
// GET  /api/platform-connections        → list all connections for tenant
// POST /api/platform-connections        → upsert (used after OAuth callback)
import { NextResponse }  from 'next/server'
import { z }             from 'zod'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function auth() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
  if (!dbUser) return null
  return {
    userId: user.id,
    tenant_id: dbUser.tenant_id,
    name: dbUser.name,
    tenant: dbUser.tenants,
  }
}

// ── GET: list all 3 platforms (always returns 3 rows) ────────
export async function GET() {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const connections = await db.platformConnection.findMany({
    where:   { tenant_id: me.tenant_id, deleted_at: null },
    orderBy: { platform: 'asc' },
    select: {
      id:              true,
      platform:        true,
      account_id:       true,
      account_name:     true,
      account_avatar:   true,
      status:          true,
      token_expires_at:  true,
      scope:           true,
      last_verified_at:  true,
      error_message:    true,
      created_at:       true,
      updated_at:       true,
    },
  })

  // Always return all 3 platforms; fill missing with disconnected placeholder
  const platforms = ['instagram', 'instagram_reels', 'tiktok']
  const result = platforms.map(platform => {
    const found = connections.find(c => c.platform === platform)
    if (found) return found
    return {
      id:              null,
      platform,
      account_id:       null,
      account_name:     null,
      account_avatar:   null,
      status:          'disconnected',
      token_expires_at:  null,
      scope:           null,
      last_verified_at:  null,
      error_message:    null,
      created_at:       null,
      updated_at:       null,
    }
  })

  return NextResponse.json({ success: true, data: result })
}

// ── POST: upsert connection (after OAuth callback or manual token) ──
const UpsertSchema = z.object({
  platform:      z.enum(['instagram', 'instagram_reels', 'tiktok']),
  account_id:     z.string().optional(),
  account_name:   z.string().optional(),
  account_avatar: z.string().optional(),
  access_token:   z.string().optional(),
  refresh_token:  z.string().optional(),
  token_expires_at: z.string().datetime().optional(),
  scope:         z.string().optional(),
  status:        z.enum(['connected', 'expired', 'disconnected', 'error', 'pending']).default('connected'),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  const d = parsed.data

  const connection = await db.platformConnection.upsert({
    where:  { tenant_id_platform: { tenant_id: me.tenant_id, platform: d.platform } },
    create: {
      tenant_id:       me.tenant_id,
      platform:       d.platform,
      account_id:      d.account_id,
      account_name:    d.account_name,
      account_avatar:  d.account_avatar,
      access_token:    d.access_token,
      refresh_token:   d.refresh_token,
      token_expires_at: d.token_expires_at ? new Date(d.token_expires_at) : null,
      scope:          d.scope,
      status:         d.status,
      metadata:       d.metadata as any,
      last_verified_at: d.status === 'connected' ? new Date() : null,
    },
    update: {
      account_id:      d.account_id,
      account_name:    d.account_name,
      account_avatar:  d.account_avatar,
      access_token:    d.access_token     ?? undefined,
      refresh_token:   d.refresh_token    ?? undefined,
      token_expires_at: d.token_expires_at  ? new Date(d.token_expires_at) : undefined,
      scope:          d.scope           ?? undefined,
      status:         d.status,
      metadata:       d.metadata as any ?? undefined,
      last_verified_at: d.status === 'connected' ? new Date() : undefined,
      error_message:   null,
      error_Code:      null,
    },
    select: { id: true, platform: true, status: true, account_name: true },
  })

  return NextResponse.json({ success: true, data: connection }, { status: 201 })
}