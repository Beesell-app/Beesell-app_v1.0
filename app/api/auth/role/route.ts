// app/api/auth/role/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/auth/role
// 
// Returns current user role dengan DUAL-CHECK:
//   1. Role dari database (user_roles table via RPC)
//   2. Fallback: hardcoded SUPERUSER_EMAILS di lib/feature-flags
// 
// Cache 5 menit via Cache-Control header
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isSuperuserEmail, type UserRole } from '@/lib/feature-flags'

export const runtime = 'edge'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({
      role: 'guest' as UserRole,
      authenticated: false,
    })
  }

  // ── Step 1: Try DB role first ─────────────────────────────
  let dbRole: UserRole = 'user'
  try {
    const { data } = await supabase.rpc('check_user_role', {
      p_user_id: user.id,
    })
    if (data) dbRole = data as UserRole
  } catch {
    // RPC mungkin belum ada (Phase 1 migration belum jalan)
    // Tetap proceed dengan fallback check
  }

  let role: UserRole = dbRole

  // ── Step 2: Fallback — kalau bukan superuser tapi email match → upgrade ──
  if (role !== 'superuser' && isSuperuserEmail(user.email)) {
    role = 'superuser'

    // Log warning supaya admin tahu DB seed needs update
    console.warn(
      `[/api/auth/role] ⚠️  Email ${user.email} di SUPERUSER_EMAILS tapi belum punya role superuser di DB.`,
      `Run: INSERT INTO user_roles (user_id, role) VALUES ('${user.id}', 'superuser') ON CONFLICT (user_id) DO UPDATE SET role = 'superuser';`
    )
  }

  return NextResponse.json({
    role,
    authenticated: true,
    email: user.email,
  }, {
    headers: {
      'Cache-Control': 'private, max-age=300',  // 5 menit
    },
  })
}