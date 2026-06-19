'use client'
// hooks/use-user-role.ts
// ══════════════════════════════════════════════════════════════
// useUserRole — Client-side role detection (DUAL-CHECK)
// 
// 1. Fetch /api/auth/role (server-side dual-check)
// 2. Fallback client-side: cek user email vs SUPERUSER_EMAILS
//    (kalau API gagal, hardcoded check tetap kasih superuser access)
// 
// Returns:
//   role, email, isSuperuser, isAdmin, isLoading
// ══════════════════════════════════════════════════════════════

import useSWR from 'swr'
import { isSuperuserEmail, type UserRole } from '@/lib/feature-flags'

interface RoleData {
  role:          UserRole
  authenticated: boolean
  email?:        string
}

const fetcher = async (url: string): Promise<RoleData> => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  if (!res.ok) {
    if (res.status === 401) return { role: 'guest', authenticated: false }
    throw new Error(`Failed to fetch role: ${res.status}`)
  }

  return res.json()
}

export function useUserRole() {
  const { data, error, isLoading, mutate } = useSWR<RoleData>(
    '/api/auth/role',
    fetcher,
    {
      refreshInterval: 300_000,  // 5 menit
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30_000,
      fallbackData: { role: 'guest', authenticated: false },
    }
  )

  // ── DUAL CHECK: trust API role, kalau email match → force superuser ──
  let role = data?.role ?? 'guest'
  const email = data?.email ?? null

  // Hardcoded fallback (safety net kalau DB belum di-seed)
  if (role !== 'superuser' && isSuperuserEmail(email)) {
    role = 'superuser'
  }

  return {
    data,
    error,
    isLoading,

    role,
    email,
    authenticated: data?.authenticated ?? false,

    isSuperuser:  role === 'superuser',
    isAdmin:      role === 'superuser' || role === 'admin',
    isGuest:      role === 'guest',

    refresh: () => mutate(),
  }
}