// apps/web-app/app/api/settings/profile/route.ts
// PATCH /api/settings/profile — update user name + store info
import { NextResponse } from 'next/server'
import { z }            from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db }           from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Schema = z.object({
  name:      z.string().min(1).max(60).optional(),
  storeName: z.string().min(1).max(100).optional(),
  whatsapp:  z.string().max(20).optional(),
})

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body   = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const d = parsed.data

    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { tenant_id: true } })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await Promise.all([
      d.name && db.user.update({ where: { id: user.id }, data: { name: d.name } }),
      (d.storeName || d.whatsapp) && db.tenant.update({
        where: { id: dbUser.tenant_id },
        data: {
          ...(d.storeName && { name: d.storeName }),
          ...(d.whatsapp  && {
            metadata: { update: { whatsapp: d.whatsapp } } as any,
          }),
        },
      }),
    ].filter(Boolean))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[PATCH /api/settings/profile]', err?.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}