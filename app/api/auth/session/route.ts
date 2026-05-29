// apps/web-app/app/api/auth/session/route.ts
// ── SP 1: GET /api/auth/session ───────────────────────────────
// Return user + tenant data untuk Zustand store + TanStack Query
// Di-cache oleh TanStack Query, di-revalidate saat tab focus / network reconnect
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { NextResponse }  from 'next/server'
import type { AppSession, SessionResponse } from '@/types/session'

export async function GET(): Promise<NextResponse<SessionResponse>> {
  try {
    const supabase = await createClient()

    // Validasi session via Supabase Auth (JWT check ke server)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user + tenant dalam satu query (join via Prisma)
    const user = await db.user.findUnique({
      where:  { id: authUser.id },
      select: {
        id:             true,
        tenant_id:       true,
        name:           true,
        avatar_url:      true,
        role:           true,
        onboarding_done: true,
        onboarding_step: true,
        preferences:    true,
        created_at:      true,
        deleted_at:      true,
        tenant: {
          select: {
            id:               true,
            name:             true,
            slug:             true,
            plan:             true,
            billingCycle:     true,
            quota_content_used: true,
            quota_content_max:  true,
            quota_video_used:   true,
            quota_video_max:    true,
            quotaResetAt:     true,
            niche:            true,
            sellerType:       true,
            timezone:         true,
            locale:           true,
            isActive:         true,
          },
        },
      },
    })

    if (!user || user.deleted_at) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const session: AppSession = {
      user: {
        id:             user.id,
        tenant_id:       user.tenant_id,
        email:          authUser.email ?? '',
        name:           user.name,
        avatar_url:      user.avatar_url,
        role:           user.role as any,
        onboarding_done: user.onboarding_done,
        onboarding_step: user.onboarding_step,
        preferences:    (user.preferences as any) ?? {},
        created_at:      user.created_at.toISOString(),
      },
      tenant: {
        id:               user.tenant.id,
        name:             user.tenant.name,
        slug: user.tenant.slug ?? '',
        plan:             user.tenant.plan as any,
        billingCycle:     user.tenant.billingCycle as any,
        quota_content_used: user.tenant.quota_content_used,
        quota_content_max:  user.tenant.quota_content_max,
        quota_video_used:   user.tenant.quota_video_used,
        quota_video_max:    user.tenant.quota_video_max,
        quotaResetAt: user.tenant.quotaResetAt?.toISOString() ?? '',
        niche:            user.tenant.niche ?? undefined,
        sellerType:       user.tenant.sellerType ?? undefined,
        timezone:         user.tenant.timezone,
        locale:           user.tenant.locale,
        isActive:         user.tenant.isActive,
      },
    }

    return NextResponse.json(
      { success: true, data: session },
      {
        headers: {
          // Jangan cache di CDN — data user sensitif
          'Cache-Control': 'private, no-store',
        },
      },
    )

  } catch (error: any) {
    console.error('[GET /api/auth/session]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}