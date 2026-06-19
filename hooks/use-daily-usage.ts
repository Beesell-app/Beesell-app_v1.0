'use client'
// hooks/use-daily-usage.ts
// ══════════════════════════════════════════════════════════════
// useDailyUsage — Daily limit dengan SUPERUSER BYPASS
// 
// Untuk superuser: getToolUsage() return unlimited untuk semua tool
// ══════════════════════════════════════════════════════════════

import useSWR from 'swr'
import { useUserRole } from './use-user-role'

export interface ToolUsage {
  tool_id:    string
  limit:      number
  current:    number
  remaining:  number
  pct_used:   number
  unlimited?: boolean
}

export interface DailyUsageData {
  tier:           'starter' | 'basic' | 'pro' | 'business'
  date_wib:       string
  reset_at:       string
  tools:          ToolUsage[]
  credit_balance: number
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) {
    if (res.status === 401) return null
    throw new Error(`Failed to fetch daily usage: ${res.status}`)
  }
  return res.json()
}

export function useDailyUsage() {
  const { isSuperuser, isAdmin, role } = useUserRole()

  const { data, error, isLoading, mutate } = useSWR<DailyUsageData | null>(
    '/api/usage/daily',
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    }
  )

  const isUnlimited = isSuperuser || isAdmin

  return {
    data,
    tools:     data?.tools ?? [],
    tier:      data?.tier ?? 'starter',
    isLoading,
    error,

    // Superuser-aware
    isSuperuser,
    isUnlimited,
    role,
    credits: data?.credit_balance ?? 0,
    /** Get usage info untuk specific tool — superuser ALWAYS return unlimited */
    getToolUsage: (toolId: string): ToolUsage | undefined => {
      if (isUnlimited) {
        return {
          tool_id:   toolId,
          limit:     999999,
          current:   0,
          remaining: 999999,
          pct_used:  0,
          unlimited: true,
        }
      }
      return data?.tools?.find(t => t.tool_id === toolId)
    },

    refresh: () => mutate(),
  }
}