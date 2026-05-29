// apps/web-app/app/api/platform-connections/[id]/route.ts
// PATCH  /api/platform-connections/[id]  → update status / refresh token
// DELETE /api/platform-connections/[id]  → disconnect (clear tokens)
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
    where:  { id: user.id },
    select: { tenant_id: true },
  })
  if (!dbUser) return null
  return { userId: user.id, tenant_id: dbUser.tenant_id }
}

// ── PATCH ─────────────────────────────────────────────────────
const PatchSchema = z.object({
  status:        z.enum(['connected', 'expired', 'disconnected', 'error']).optional(),
  error_message:  z.string().optional(),
  error_Code:     z.string().optional(),
  access_token:   z.string().optional(),
  refresh_token:  z.string().optional(),
  token_expires_at: z.string().datetime().optional(),
}).strict()

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.platformConnection.findFirst({
    where: { id, tenant_id: me.tenant_id, deleted_at: null },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  const updated = await db.platformConnection.update({
    where: { id },
    data:  {
      ...parsed.data,
      token_expires_at: parsed.data.token_expires_at
        ? new Date(parsed.data.token_expires_at)
        : undefined,
      last_verified_at: parsed.data.status === 'connected' ? new Date() : undefined,
    },
    select: { id: true, platform: true, status: true, account_name: true, token_expires_at: true },
  })

  return NextResponse.json({ success: true, data: updated })
}

// ── DELETE: disconnect (clear tokens, keep record) ────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.platformConnection.findFirst({
    where: { id, tenant_id: me.tenant_id, deleted_at: null },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Soft-disconnect: clear tokens, set status=disconnected (keep record for audit)
  await db.platformConnection.update({
    where: { id },
    data: {
      status:         'disconnected',
      access_token:    null,
      refresh_token:   null,
      token_expires_at: null,
      scope:          null,
      account_id:      null,
      account_name:    null,
      account_avatar:  null,
      last_verified_at: null,
      error_message:   null,
      error_Code:      null,
    },
  })

  return NextResponse.json({ success: true })
}