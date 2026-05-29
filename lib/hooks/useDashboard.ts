'use client'
// apps/web-app/lib/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query'

export interface ChartDay { date: string; label: string; captions: number; images: number; total: number }

export interface DashboardData {
  user: { id: string; name: string; email: string; avatar_url: string | null; onboarding_done: boolean; onboarding_step: number }
  store: {
    id: string; name: string; plan: string; planLabel: string; slug: string; memberSince: string | null
    niche: string | null; subNiche: string | null; sellerType: string | null
    primary_platform: string | null; platforms: string[]; tone: string; language: string
    mainGoals: string[]; whatsapp: string | null
  }
  totalContents: number; contentsThisMonth: number; scheduledCount: number; imageCount: number
  captionsGenerated: number
  dailyUsed: number; dailyMax: number; dailyPercent: number
  monthlyUsed: number; monthlyMax: number; monthlyPercent: number
  dailyReset: string; monthlyReset: string
  chartData: ChartDay[]
  platformStats: Array<{ platform: string | null; count: number }>
  recentContents: Array<{ id: string; type: string; status: string; title: string; media_url: string | null; primary_platform: string | null; created_at: string }>
  generatedAt: string
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard', { cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status}`)
  const { data } = await res.json()
  return data
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 3 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}