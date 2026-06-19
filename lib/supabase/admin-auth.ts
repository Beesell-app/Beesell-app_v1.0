// lib/admin-auth.ts
// ══════════════════════════════════════════════════════════════
// Admin Authentication Helpers — WITH EXTENSIVE DEBUG LOGGING
// 
// ⚡ DUAL CHECK:
//    1. DB role via RPC check_user_role
//    2. Hardcoded SUPERUSER_EMAILS fallback
// 
// 🔍 Log semua step ke server console supaya kamu bisa lihat
//    di terminal `npm run dev` kalau ada redirect yang tidak diharapkan
// ══════════════════════════════════════════════════════════════

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isSuperuserEmail, SUPERUSER_EMAILS, type UserRole } from '@/lib/feature-flags'

export type { UserRole }

// ══════════════════════════════════════════════════════════════
// LOG HELPER — toggleable via env var
// ══════════════════════════════════════════════════════════════
const DEBUG = process.env.NEXT_PUBLIC_ADMIN_AUTH_DEBUG !== 'false'
function log(msg: string, data?: any) {
  if (!DEBUG) return
  const ts = new Date().toISOString().slice(11, 19)
  if (data !== undefined) {
    console.log(`[admin-auth ${ts}] ${msg}`, data)
  } else {
    console.log(`[admin-auth ${ts}] ${msg}`)
  }
}

// ══════════════════════════════════════════════════════════════
// SERVER-SIDE: Get current user + role (DUAL CHECK)
// ══════════════════════════════════════════════════════════════
export async function getCurrentUserWithRole() {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  log('🔍 getCurrentUserWithRole() called')
  
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

  // ── Step 1: Get user dari session ──
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    log('❌ supabase.auth.getUser() ERROR', error.message)
    return { user: null, role: 'guest' as UserRole }
  }
  
  if (!user) {
    log('❌ No user in session (not logged in)')
    return { user: null, role: 'guest' as UserRole }
  }

  log('✅ User from session:', {
    id: user.id,
    email: user.email,
    email_lower: user.email?.toLowerCase(),
  })

  // ── Step 2: Try DB role first ──
  let dbRole: UserRole = 'user'
  let rpcSuccess = false
  
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('check_user_role', {
      p_user_id: user.id,
    })
    
    if (rpcError) {
      log('❌ RPC check_user_role ERROR', rpcError.message)
      log('   → Migration Phase 1 mungkin belum jalan, atau RPC tidak return value')
    } else if (rpcResult) {
      dbRole = rpcResult as UserRole
      rpcSuccess = true
      log('✅ DB role from RPC:', dbRole)
    } else {
      log('⚠️  RPC returned NULL — user_roles table tidak ada record')
    }
  } catch (err: any) {
    log('❌ RPC call THROW', err.message)
  }

  let role: UserRole = dbRole

  // ── Step 3: Hardcoded fallback check ──
  log('🔍 SUPERUSER_EMAILS list:', SUPERUSER_EMAILS)
  log('🔍 isSuperuserEmail() check:', {
    user_email: user.email,
    user_email_lower: user.email?.toLowerCase(),
    is_in_list: isSuperuserEmail(user.email),
  })
  
  if (role !== 'superuser' && isSuperuserEmail(user.email)) {
    role = 'superuser'
    log('⚡ FALLBACK ACTIVATED — email match SUPERUSER_EMAILS, force role=superuser')
    log('   ⚠️  Note: DB role masih "' + dbRole + '", run SQL seed:')
    log('   INSERT INTO user_roles (user_id, role) VALUES (\'' + user.id + '\', \'superuser\') ON CONFLICT (user_id) DO UPDATE SET role = \'superuser\';')
  }

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  log('🎯 FINAL ROLE:', role)
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return { user, role }
}

// ══════════════════════════════════════════════════════════════
// SERVER COMPONENT GUARD: redirect kalau bukan superuser
// ══════════════════════════════════════════════════════════════
export async function requireSuperuser() {
  log('🚪 requireSuperuser() — gate check')
  const { user, role } = await getCurrentUserWithRole()
  
  if (!user) {
    log('🔴 NO USER → redirect /login?redirect=/admin')
    redirect('/login?redirect=/admin')
  }
  
  if (role !== 'superuser') {
    log('🔴 ROLE NOT SUPERUSER (got: "' + role + '") → redirect /studio?error=not_authorized')
    log('   user_email: ' + user.email)
    log('   📝 To fix: ')
    log('   1. Run SQL: INSERT INTO user_roles (user_id, role) VALUES (\'' + user.id + '\', \'superuser\') ON CONFLICT (user_id) DO UPDATE SET role = \'superuser\';')
    log('   2. OR add email "' + user.email + '" to SUPERUSER_EMAILS di lib/feature-flags.ts')
    redirect('/studio?error=not_authorized')
  }
  
  log('🟢 ACCESS GRANTED for ' + user.email + ' (role: ' + role + ')')
  return { user, role }
}

// ══════════════════════════════════════════════════════════════
// SERVER COMPONENT GUARD: allow admin OR superuser
// ══════════════════════════════════════════════════════════════
export async function requireAdmin() {
  log('🚪 requireAdmin() — gate check (superuser OR admin allowed)')
  const { user, role } = await getCurrentUserWithRole()
  
  if (!user) {
    log('🔴 NO USER → redirect /login?redirect=/admin')
    redirect('/login?redirect=/admin')
  }
  
  if (!isAdminRole(role)) {
    log('🔴 ROLE NOT ADMIN (got: "' + role + '") → redirect /studio?error=not_authorized')
    redirect('/studio?error=not_authorized')
  }
  
  log('🟢 ACCESS GRANTED for ' + user.email + ' (role: ' + role + ')')
  return { user, role }
}

// ══════════════════════════════════════════════════════════════
// CLIENT-SAFE HELPERS
// ══════════════════════════════════════════════════════════════
export function isAdminRole(role: UserRole): boolean {
  return role === 'superuser' || role === 'admin'
}

export function isSuperuser(role: UserRole): boolean {
  return role === 'superuser'
}

export function getRolePermissions(role: UserRole): string[] {
  const perms: Record<UserRole, string[]> = {
    guest: [],
    user: [],
    support: [
      'admin.access',
      'admin.view_users',
    ],
    admin: [
      'admin.access',
      'admin.view_analytics',
      'admin.manage_users',
      'admin.toggle_feature_flag',
    ],
    superuser: [
      'admin.access',
      'admin.bypass_limits',
      'admin.bypass_credits',
      'admin.toggle_feature_flag',
      'admin.edit_pricing',
      'admin.manage_users',
      'admin.kill_switch',
      'admin.cost_guardrail',
      'admin.view_analytics',
      'admin.audit_log',
    ],
  }
  return perms[role] ?? []
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return getRolePermissions(role).includes(permission)
}

// ══════════════════════════════════════════════════════════════
// Re-export untuk convenience
// ══════════════════════════════════════════════════════════════
export { isSuperuserEmail, SUPERUSER_EMAILS } from '@/lib/feature-flags'