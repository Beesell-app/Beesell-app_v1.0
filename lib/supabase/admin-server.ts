// lib/supabase/admin-server.ts
// ══════════════════════════════════════════════════════════════
// Supabase server helpers + admin guard (v3 — email allowlist SSoT)
// ══════════════════════════════════════════════════════════════

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isSuperuserEmail } from '@/lib/feature-flags'

/** ANON client + cookies — untuk baca session user (auth check) */
export async function createAdminSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch { /* Server Component — ignore */ }
        },
      },
    },
  )
}

/** SERVICE ROLE client — bypass RLS. HANYA dipakai setelah auth diverifikasi. */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY tidak ada di .env. ' +
      'Ambil dari Supabase Dashboard → Settings → API → service_role key.',
    )
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Verifikasi caller adalah admin/superuser.
 * Superuser SSoT = email allowlist (isSuperuserEmail), konsisten dengan
 * /api/auth/role & lib/tools/access.ts. RPC check_user_role boleh jawab 'user'.
 */
export async function requireAdminApi() {
  // 1. Auth check pakai anon client (baca cookies session)
  const authClient = await createAdminSupabaseClient()

  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized', message: 'Silakan login dulu' }, { status: 401 })
  }

  // 2. Role dari DB (setelah fix, ini 'user' untuk semua orang — itu normal)
  let role = 'user'
  try {
    const { data } = await authClient.rpc('check_user_role', { p_user_id: user.id })
    if (data) role = String(data)
  } catch (e: any) {
    console.error('[requireAdminApi] check_user_role error:', e?.message)
  }

  // 3. ⚡ Fallback email = SSoT superuser
  if (isSuperuserEmail(user.email)) role = 'superuser'

  // 4. Hanya superuser/admin yang lolos
  if (!['superuser', 'admin'].includes(role)) {
    console.warn(`[requireAdminApi] DITOLAK — email=${user.email} role=${role}`)
    return NextResponse.json({
      error: 'forbidden',
      message: `Akun "${user.email}" (role: ${role}) tidak punya akses admin.`,
    }, { status: 403 })
  }

  // 5. Service client untuk operasi DB (bypass RLS) — aman, sudah auth-checked
  const supabase = createServiceClient()
  return { supabase, authClient, user, role }
}