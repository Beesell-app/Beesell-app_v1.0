'use client'
// apps/web-app/lib/hooks/usePlatformConnections.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ConnectionStatus } from '@/lib/platform/platform-config'

// ── Types ──────────────────────────────────────────────────
export interface PlatformConnectionRecord {
  id:             string | null
  platform:       string
  account_id:      string | null
  account_name:    string | null
  account_avatar:  string | null
  status:         ConnectionStatus
  token_expires_at: string | null
  scope:          string | null
  last_verified_at: string | null
  error_message:   string | null
  created_at:      string | null
  updated_at:      string | null
}

// ── Fetchers ───────────────────────────────────────────────
const fetchConnections = async (): Promise<PlatformConnectionRecord[]> => {
  const res = await fetch('/api/platform-connections')
  if (!res.ok) throw new Error('Failed to load connections')
  return (await res.json()).data
}

const disconnectPlatform = async (id: string): Promise<void> => {
  const res = await fetch(`/api/platform-connections/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to disconnect')
}

const updateStatus = async ({
  id,
  data,
}: { id: string; data: { status: ConnectionStatus; error_message?: string } }): Promise<void> => {
  const res = await fetch(`/api/platform-connections/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update status')
}

// ── Hooks ──────────────────────────────────────────────────
export function usePlatformConnections() {
  return useQuery({
    queryKey:  ['platform-connections'],
    queryFn:   fetchConnections,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: true,   // re-check after OAuth tab closes
  })
}

export function useConnectionByPlatform(platform: string) {
  const { data } = usePlatformConnections()
  return data?.find(c => c.platform === platform) ?? null
}

export function useDisconnectPlatform() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: disconnectPlatform,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['platform-connections'] }),
  })
}

export function useUpdateConnectionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateStatus,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['platform-connections'] }),
  })
}

// ── Derived: count connected ───────────────────────────────
export function useConnectedCount() {
  const { data } = usePlatformConnections()
  return data?.filter(c => c.status === 'connected').length ?? 0
}

// ── Derived: has any expired ──────────────────────────────
export function useHasExpiredConnection() {
  const { data } = usePlatformConnections()
  return data?.some(c => c.status === 'expired') ?? false
}