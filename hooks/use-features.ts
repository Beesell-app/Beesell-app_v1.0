'use client'
// hooks/use-features.ts
// ══════════════════════════════════════════════════════════════
// useFeatures() — satu hook untuk Sidebar/Dashboard/Studio
//
// Gabungan:
//   1. FEATURES (registry statis) — apa saja fitur yang ada
//   2. feature_flags_db (via /api/tools/access)  — admin toggle ON/OFF + per-tier
//   3. role/permission user
//
// Return:
//   { all, byCategory, studioBySub, access, tier, role, loaded, isSuperuser }
// — `all` = fitur yang VISIBLE untuk user (sudah memperhitungkan admin off,
//   tier, role, dan registry.enabled override).
// — Item locked (status enabled tapi tier kurang) TETAP termasuk supaya
//   bisa ditampilkan dengan ikon kunci. Item disabled/coming-soon di admin
//   TIDAK termasuk → benar-benar hilang dari UI.
// ══════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import {
  FEATURES, CATEGORY_ORDER,
  type Category, type StudioSub, type FeatureItem,
  type Role,
  isFeatureVisible, sortFeatures, getStudioBySub,
} from '@/components/dashboard/studio-menu-config'
import { useToolAccess } from './use-tool-access'
import { useUserRole }   from './use-user-role'

export interface FeatureWithAccess extends FeatureItem {
  /** Apakah user boleh klik tool ini sekarang */
  available: boolean
  /** true = ke-gate tier (perlu upgrade) — bedanya dgn disabled/coming-soon */
  locked:    boolean
  /** Pesan jelas kalau tidak available */
  reason:    string
  /** Status admin: enabled | disabled | coming-soon | beta */
  status:    'enabled' | 'disabled' | 'coming-soon' | 'beta'
}

export function useFeatures() {
  const { access, tier, loaded } = useToolAccess()
  const { isSuperuser, role } = useUserRole()
  
  return useMemo(() => {
    // Map setiap fitur ke FeatureWithAccess, lalu filter:
    //   - hidden by role / enabled:false → buang
    //   - admin status 'disabled' / 'coming-soon' → buang (tidak muncul)
    //   - status enabled/beta: tetap muncul (mungkin locked karena tier)
    //   - superuser: semua available
    const all: FeatureWithAccess[] = []
    for (const item of FEATURES) {
      if (!isFeatureVisible(item, role)) continue

      const a = access[item.id]
      // Default kalau belum ada di feature_flags_db: anggap enabled (fail-open)
      const status   = a?.status ?? 'enabled'
      const beta     = a?.beta ?? false
      let   available = a?.available ?? true
      let   locked    = a?.locked ?? false
      let   reason    = a?.reason ?? ''

      if (isSuperuser) {
        // Superuser bypass semua gating
        available = true
        locked    = false
        reason    = ''
      } else if (status === 'disabled' || status === 'coming-soon') {
        // BENAR-BENAR hilangkan dari UI (per spec: hanya tampil yang enabled)
        continue
      }

      all.push({
        ...item,
        available,
        locked,
        reason,
        status: beta ? 'beta' : (status as FeatureWithAccess['status']),
      })
    }

    // Group by kategori utama (urutan dijaga sesuai CATEGORY_ORDER)
    const byCategory: Record<Category, FeatureWithAccess[]> = {
      quick: [], writing: [], marketing: [], studio: [],
    }
    for (const f of all) byCategory[f.category]?.push(f)
    for (const k of CATEGORY_ORDER) byCategory[k] = sortByOrder(byCategory[k])

    // Group studio by subkategori
    const studioBySub: Record<StudioSub, FeatureWithAccess[]> = {
      image: sortByOrder(byCategory.studio.filter(f => (f.subCategory ?? 'image') === 'image')),
      video: sortByOrder(byCategory.studio.filter(f => f.subCategory === 'video')),
    }

    return {
      all,
      byCategory,
      studioBySub,
      access,
      tier,
      role,
      loaded,
      isSuperuser,
    }
  }, [access, tier, role, loaded, isSuperuser])
}

// helper local biar typed (sortFeatures sudah handle base, ini buat WithAccess[])
function sortByOrder<T extends { sortOrder?: number; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const so = (a.sortOrder ?? 100) - (b.sortOrder ?? 100)
    return so !== 0 ? so : a.name.localeCompare(b.name)
  })
}