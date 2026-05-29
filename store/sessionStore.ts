// apps/web-app/store/sessionStore.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createClient } from '@/lib/supabase/client'

import type {
  AppSession,
  SessionUser,
  SessionTenant,
  UserPreferences,
} from '@/types/session'
const supabase = createClient()
const {
  data: { session },
} = await supabase.auth.getSession()
// ── State shape ───────────────────────────────────────────────
interface SessionState {
  user: SessionUser | null
  tenant: SessionTenant | null

  isLoaded: boolean
  isLoading: boolean

  setSession: (session: AppSession) => void
  updateUser: (patch: Partial<SessionUser>) => void
  updateTenant: (patch: Partial<SessionTenant>) => void
  updatePreferences: (prefs: Partial<UserPreferences>) => void
  updateQuota: (type: 'content' | 'video', usedDelta: number) => void
  clearSession: () => void
  setLoading: (v: boolean) => void

  canGenerate: (type?: 'content' | 'video') => boolean
  quotaPct: (type?: 'content' | 'video') => number
  isQuotaLow: (type?: 'content' | 'video') => boolean
  isPro: () => boolean
  isBusiness: () => boolean
  isOwnerOrAdmin: () => boolean
}

const INITIAL_STATE = {
  user: null,
  tenant: null,
  isLoaded: false,
  isLoading: false,
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Actions ─────────────────────────────────────────────
      setSession: (session) =>
        set({
          user: session.user,
          tenant: session.tenant,
          isLoaded: true,
          isLoading: false,
        }),

      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : {})),

      updateTenant: (patch) =>
        set((s) => (s.tenant ? { tenant: { ...s.tenant, ...patch } } : {})),

      updatePreferences: (prefs) =>
        set((s) =>
          s.user
            ? {
                user: {
                  ...s.user,
                  preferences: { ...s.user.preferences, ...prefs },
                },
              }
            : {}
        ),

      updateQuota: (type, usedDelta) =>
        set((s) => {
          if (!s.tenant) return {}

          if (type === 'video') {
            return {
              tenant: {
                ...s.tenant,
                quota_video_used: s.tenant.quota_video_used + usedDelta,
              },
            }
          }

          return {
            tenant: {
              ...s.tenant,
              quota_content_used: s.tenant.quota_content_used + usedDelta,
            },
          }
        }),

      clearSession: () => set({ ...INITIAL_STATE, isLoaded: true }),

      setLoading: (v) => set({ isLoading: v }),

      // ── Computed ─────────────────────────────────────────────
      canGenerate: (type = 'content') => {
        const { tenant } = get()
        if (!tenant) return false

        if (type === 'video')
          return tenant.quota_video_used < tenant.quota_video_max

        return tenant.quota_content_used < tenant.quota_content_max
      },

      quotaPct: (type = 'content') => {
        const { tenant } = get()
        if (!tenant) return 0

        const used =
          type === 'video'
            ? tenant.quota_video_used
            : tenant.quota_content_used

        const max =
          type === 'video'
            ? tenant.quota_video_max
            : tenant.quota_content_max

        if (max === 0) return 100
        return Math.round((used / max) * 100)
      },

      isQuotaLow: (type = 'content') => {
        const pct = get().quotaPct(type)
        return pct >= 90
      },

      isPro: () =>
        ['pro', 'business', 'enterprise'].includes(
          get().tenant?.plan ?? ''
        ),

      isBusiness: () =>
        ['business', 'enterprise'].includes(
          get().tenant?.plan ?? ''
        ),

      isOwnerOrAdmin: () => {
        const role = get().user?.role
        return role === 'owner' || role === 'admin'
      },
    }),

    {
      name: 'beesell-session-v1',
      storage: createJSONStorage(() => localStorage),

      partialize: (s) => ({
        user: s.user
          ? {
              id: s.user.id,
              tenant_id: s.user.tenant_id,
              email: s.user.email,
              name: s.user.name,
              avatar_url: s.user.avatar_url,
              role: s.user.role,
              onboarding_done: s.user.onboarding_done,
              onboarding_step: s.user.onboarding_step,
              preferences: s.user.preferences,
              created_at: s.user.created_at,
            }
          : null,

        tenant: s.tenant
          ? {
              id: s.tenant.id,
              name: s.tenant.name,
              slug: s.tenant.slug,
              plan: s.tenant.plan,
              billingCycle: s.tenant.billingCycle,
              quota_content_used: s.tenant.quota_content_used,
              quota_content_max: s.tenant.quota_content_max,
              quota_video_used: s.tenant.quota_video_used,
              quota_video_max: s.tenant.quota_video_max,
              quotaResetAt: s.tenant.quotaResetAt,
              niche: s.tenant.niche,
              sellerType: s.tenant.sellerType,
              timezone: s.tenant.timezone,
              locale: s.tenant.locale,
              isActive: s.tenant.isActive,
            }
          : null,

        isLoaded: s.isLoaded,
      }),
    }
  )
)

// ── SAFE SELECTORS ─────────────────────────────────────────────

// Primitive selectors (AMAN)
export const useUser = () => useSessionStore((s) => s.user)
export const useTenant = () => useSessionStore((s) => s.tenant)
export const usePlan = () => useSessionStore((s) => s.tenant?.plan ?? 'free')
export const useRole = () => useSessionStore((s) => s.user?.role ?? 'viewer')

// 🔥 FIXED QUOTA SELECTOR (ANTI INFINITE LOOP)
export const useQuota = (type: 'content' | 'video' = 'content') => {
  const used = useSessionStore((s) =>
    type === 'content'
      ? s.tenant?.quota_content_used ?? 0
      : s.tenant?.quota_video_used ?? 0
  )

  const max = useSessionStore((s) =>
    type === 'content'
      ? s.tenant?.quota_content_max ?? 0
      : s.tenant?.quota_video_max ?? 0
  )

  const pct = useSessionStore((s) => s.quotaPct(type))

  return { used, max, pct }
}