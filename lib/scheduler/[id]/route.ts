// apps/web-app/app/api/scheduler/[id]/route.ts
// PATCH /api/scheduler/[id]  → reschedule (new time)
// DELETE /api/scheduler/[id] → unschedule (back to ready)
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

// ── PATCH: reschedule ─────────────────────────────────────────
const PatchSchema = z.object({
  scheduledFor: z.string().datetime(),
  durationMin:  z.number().min(30).max(480).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.content.findFirst({
    where: { id, tenant_id: me.tenant_id, deleted_at: null },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  const updated = await db.content.update({
    where: { id },
    data: {
      scheduledFor: new Date(parsed.data.scheduledFor),
      status:       'scheduled',
    },
    select: { id: true, status: true, scheduledFor: true },
  })

  return NextResponse.json({ success: true, data: updated })
}

// ── DELETE: unschedule ────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.content.findFirst({
    where: { id, tenant_id: me.tenant_id, deleted_at: null },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Revert to 'ready' status, clear scheduledFor
  await db.content.update({
    where: { id },
    data: {
      status:       'ready',
      scheduledFor: null,
    },
  })

  return NextResponse.json({ success: true })
}