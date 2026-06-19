'use client'
// apps/web-app/lib/hooks/useQuotaStatus.ts
// Polling quota status dari /api/quota setiap 30 detik
// Lebih akurat dari Zustand store karena include daily counter
import { useQuery } from '@tanstack/react-query'

export interface QuotaStatus {
  allowed: boolean
  daily: {
    used:       number
    max:        number
    remaining:  number
    pct:        number
    resetInSec: number
  }
  monthly: {
    used:      number
    max:       number
    remaining: number
    pct:       number
    resetAt:   string
  }
  warningLevel: 'none' | 'warning' | 'critical'
  blockReason:  'daily_exceeded' | 'monthly_exceeded' | null
}

async function fetchQuotaStatus(type: 'content' | 'video' = 'content'): Promise<QuotaStatus> {
  const res = await fetch(`/api/quota?type=${type}`, { credentials: 'same-origin' })
  if (!res.ok) throw new Error('Failed to fetch quota')
  const data = await res.json()
  if (!data.success) throw new Error(data.error ?? 'Unknown error')
  return data.data
}

export function useQuotaStatus(type: 'content' | 'video' = 'content', options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['quota', type],
    queryFn:  () => fetchQuotaStatus(type),
    enabled:  options.enabled ?? true,

    // Polling setiap 30 detik — cukup untuk UI update
    refetchInterval: 30 * 1000,

    // Stale setelah 10 detik — force refetch jika user buka tab
    staleTime: 10 * 1000,

    refetchOnWindowFocus: true,
    refetchOnReconnect:   true,
    retry: 1,
  })
}