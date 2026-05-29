// apps/web-app/app/api/quota/route.ts
// ── GET /api/quota ───────────────────────────────────────────
// Return quota status untuk UI (banner + progress bar)
// Di-poll setiap 30 detik dari Zustand store
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { checkQuota }    from '@/lib/quota/quota-service'
import { NextResponse }  from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant ID
    const dbUser = await db.user.findUnique({
      where:  { id: authUser.id },
      select: { tenant_id: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Query param ?type=content|video
    const url  = new URL(request.url)
    const type = (url.searchParams.get('type') ?? 'content') as 'content' | 'video'

    const status = await checkQuota(dbUser.tenant_id, type)

    return NextResponse.json(
      { success: true, data: status },
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