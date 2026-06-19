'use client'
// hooks/use-feature-gate.ts
import { useMemo } from 'react'
import { getFeatureById, meetsTier, type FeatureItem } from '@/components/dashboard/studio-menu-config'
import { useFeatures } from '@/hooks/use-features'

export interface FeatureGateResult {
  status: 'loading' | 'allowed' | 'locked' | 'disabled'
  loading: boolean
  found: boolean
  enabled: boolean
  locked: boolean
  isSuperuser: boolean
  tierRequired: string
  userTier: string
  credit: number
  isMetered: boolean
  upgradeHref: string
  reason: string
  feature: FeatureItem | null
}

export function useFeatureGate(featureId: string): FeatureGateResult {
  const { all, access, tier, isSuperuser, loaded } = useFeatures()

  return useMemo(() => {
    const feature = getFeatureById(featureId) ?? null
    const raw     = (access as any)?.[featureId]          // { status, available, locked, reason, beta }
    const inAll   = all.find(f => f.id === featureId) ?? null

    const userTier     = tier ?? 'starter'
    const tierRequired = feature?.tierRequired ?? 'starter'
    const adminStatus  = raw?.status ?? 'enabled'         // fail-open

    const enabled = isSuperuser
      ? true
      : adminStatus !== 'disabled' && adminStatus !== 'coming-soon'

    // pakai hasil useFeatures kalau ada, fallback ke meetsTier dari registry
    const tierLocked = !meetsTier(userTier, tierRequired)
    const locked = isSuperuser ? false : (raw?.locked ?? inAll?.locked ?? tierLocked)

    const status: FeatureGateResult['status'] =
      !loaded  ? 'loading'  :
      !enabled ? 'disabled' :
      locked   ? 'locked'   :
                 'allowed'

    return {
      status,
      loading: !loaded,
      found: !!feature,
      enabled, locked, isSuperuser,
      tierRequired, userTier,
      credit: feature?.credit ?? 0,
      isMetered: feature?.isMetered ?? false,
      upgradeHref: `/billing?upgrade=${tierRequired}`,
      reason: raw?.reason ?? inAll?.reason ?? '',
      feature,
    }
  }, [featureId, all, access, tier, isSuperuser, loaded])
}