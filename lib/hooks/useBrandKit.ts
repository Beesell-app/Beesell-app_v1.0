'use client'
// apps/web-app/lib/hooks/useBrandKit.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ── Types ──────────────────────────────────────────────────
export interface BrandKit {
  id:              string
  tenant_id:        string
  name:            string
  description:     string | null
  logoUrl:         string | null
  logoStoragePath: string | null
  primaryColor:    string
  secondaryColor:  string
  accentColor:     string
  bgColor:         string
  textColor:       string
  primaryFont:     string
  secondaryFont:   string
  defaultTone:     string
  defaultLanguage: string
  brandKeywords:   string | null
  avoidWords:      string | null
  isDefault:       boolean
  isActive:        boolean
  created_at:       string
  updated_at:       string
}

export type BrandKitInput = Partial<Omit<BrandKit, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>

// ── API helpers ────────────────────────────────────────────
const fetchList = async (): Promise<BrandKit[]> => {
  const res = await fetch('/api/brand-kits')
  if (!res.ok) throw new Error('Failed to load brand kits')
  return (await res.json()).data
}

const fetchOne = async (id: string): Promise<BrandKit> => {
  const res = await fetch(`/api/brand-kits/${id}`)
  if (!res.ok) throw new Error('Not found')
  return (await res.json()).data
}

const createKit = async (data: BrandKitInput): Promise<BrandKit> => {
  const res = await fetch('/api/brand-kits', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Failed to create')
  return json.data
}

const updateKit = async ({ id, ...data }: BrandKitInput & { id: string }): Promise<BrandKit> => {
  const res = await fetch(`/api/brand-kits/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Failed to update')
  return json.data
}

const deleteKit = async (id: string): Promise<void> => {
  const res = await fetch(`/api/brand-kits/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
}

// ── Hooks ──────────────────────────────────────────────────
export function useBrandKitList() {
  return useQuery({
    queryKey:  ['brand-kits'],
    queryFn:   fetchList,
    staleTime: 5 * 60_000,
  })
}

export function useBrandKit(id: string | null) {
  return useQuery({
    queryKey:  ['brand-kits', id],
    queryFn:   () => fetchOne(id!),
    enabled:   !!id,
    staleTime: 5 * 60_000,
  })
}

// Returns the default kit, or first kit, or null
export function useDefaultBrandKit(): BrandKit | null {
  const { data } = useBrandKitList()
  if (!data?.length) return null
  return data.find(k => k.isDefault) ?? data[0]
}

export function useCreateBrandKit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createKit,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['brand-kits'] }),
  })
}

export function useUpdateBrandKit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateKit,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['brand-kits'] }),
  })
}

export function useDeleteBrandKit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteKit,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['brand-kits'] }),
  })
}

// Convenience: set a kit as default
export function useSetDefaultKit() {
  const { mutate } = useUpdateBrandKit()
  return (id: string) => mutate({ id, isDefault: true })
}