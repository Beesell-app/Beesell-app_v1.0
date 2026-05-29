// apps/web-app/app/api/quota/route.ts
// ── GET /api/quota ───────────────────────────────────────────
// Return quota status untuk UI (banner + progress bar)
// Di-poll setiap 30 detik dari Zustand store
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { checkQuota }    from '@/lib/quota/quota-service'
import { NextResponse }  from 'next/server'
import { resolveAuthContext } from '@/lib/middleware/plan-check'
import { getUsageSnapshot }   from '@/lib/quota/quota-service'
import { getPlanLimits }      from '@/lib/quota/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const ctx = await resolveAuthContext()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant ID
    const dbUser = await db.user.findUnique({
      where: {
        id: authUser.id,
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

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Query param ?type=content|video
    const url  = new URL(request.url)
    const type = (url.searchParams.get('type') ?? 'content') as 'content' | 'video'

    const status = await checkQuota(dbUser.tenant_id, type)
    const usage = await getUsageSnapshot(dbUser.tenant_id)
    return NextResponse.json(
      { success: true,
        usage,
        allowed: status.allowed,
        daily: status.daily,
        monthly: status.monthly,
        warningLevel: status.warningLevel,
        blockReason: status.blockReason 
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    )

  } catch (err: any) {
    console.error('[GET /api/quota]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}