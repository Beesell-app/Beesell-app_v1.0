// apps/web-app/app/api/auth/me/route.ts
// ── SP 2: PATCH /api/auth/me ──────────────────────────────────
// Update profil user (name, avatar) dan preferences
// Di-invalidate oleh Zustand + TanStack Query setelah sukses
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { NextResponse }  from 'next/server'
import { z }             from 'zod'

const UpdateMeSchema = z.object({
  name:      z.string().min(2).max(60).optional(),
  avatar_url: z.string().url().optional().nullable(),
  preferences: z.object({
    defaultTone:          z.string().optional(),
    defaultLanguage:      z.string().optional(),
    defaultEmoji:         z.string().optional(),
    defaultPlatform:      z.string().optional(),
    emailNotifications:   z.boolean().optional(),
    pushNotifications:    z.boolean().optional(),
  }).optional(),
}).strict()

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = UpdateMeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { name, avatar_url, preferences } = parsed.data

    // Ambil preferences lama lalu merge
    const existing = await db.user.findUnique({
      where: { id: authUser.id },
    })

    const mergedPrefs = preferences
      ? { ...(existing?.preferences as object ?? {}), ...preferences }
      : undefined

    const updated = await db.user.update({
      where: { id: authUser.id },
      data: {
        ...(name      !== undefined && { name }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(mergedPrefs            && { preferences: mergedPrefs }),
      },
      select: {
        id: true, name: true, avatar_url: true,
        role: true, preferences: true,
        onboarding_done: true, onboarding_step: true,
      },
    })

    return NextResponse.json({ success: true, data: updated })

  } catch (error: any) {
    console.error('[PATCH /api/auth/me]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/auth/me — quick profile fetch (lebih ringan dari /session)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where:  { id: authUser.id },
      select: {
        id: true, name: true, avatar_url: true, role: true,
        onboarding_done: true, tenant_id: true, preferences: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: { ...user, email: authUser.email } })

  } catch (error: any) {
    console.error('[GET /api/auth/me]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}