'use client'
// hooks/use-credits.ts
// ══════════════════════════════════════════════════════════════
// useCredits — Credit balance dengan SUPERUSER BYPASS
// 
// Untuk superuser:
//   - displayBalance = '∞'
//   - effectiveBalance = Infinity
//   - isUnlimited = true
// ══════════════════════════════════════════════════════════════

import useSWR from 'swr'
import { useUserRole } from './use-user-role'

export interface CreditsData {
  current_balance:       number
  monthly_quota:         number
  plan_tier:             'starter' | 'basic' | 'pro' | 'business'
  next_reset_at:         string
  total_used_this_month: number
  total_topup_balance:   number
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) {
    if (res.status === 401) return null
    throw new Error(`Failed to fetch credits: ${res.status}`)
  }
  return res.json()
}

export function useCredits() {
  const { isSuperuser, isAdmin } = useUserRole()

  const { data, error, isLoading, mutate } = useSWR<CreditsData | null>(
    '/api/credits/balance',
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  )

  const actualBalance = data?.current_balance ?? 0
  const monthlyQuota = data?.monthly_quota ?? 0

  // Superuser/admin: unlimited display
  const isUnlimited = isSuperuser || isAdmin
  const effectiveBalance = isUnlimited ? Infinity : actualBalance
  const displayBalance = isUnlimited ? '∞' : actualBalance.toLocaleString('id-ID')

  return {
    data,
    isLoading,
    error,

    // Original props
    balance:        actualBalance,
    monthly_quota:  monthlyQuota,
    tier:           data?.plan_tier ?? 'starter',

    // Superuser-aware
    isUnlimited,
    effectiveBalance,
    displayBalance,
    isSuperuser,

    refresh: () => mutate(),
  }
}

export function useTopupCredit() {
  const topup = async (amount: number, payment_method: string) => {
    const res = await fetch('/api/credits/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount, payment_method }),
    })
    if (!res.ok) throw new Error('Topup failed')
    return res.json()
  }
  return { topup }
}