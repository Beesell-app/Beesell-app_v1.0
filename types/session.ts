// apps/web-app/types/session.ts
// Tipe session yang dipakai di Zustand store, TanStack Query, dan server

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type PlanType = 'free' | 'basic' | 'pro' | 'business' | 'enterprise'

// ── Data user dari public.users ───────────────────────────────
export interface SessionUser {
  id:              string   // = auth.uid()
  tenant_id:        string
  email:           string
  name:            string
  avatar_url:       string | null
  role:            UserRole
  onboarding_done:  boolean
  onboarding_step:  number
  preferences:     UserPreferences
  created_at:       string
}

export interface UserPreferences {
  defaultTone?:          string
  defaultLanguage?:      string
  defaultEmoji?:         string
  defaultPlatform?:      string
  emailNotifications?:   boolean
  pushNotifications?:    boolean
}

// ── Data tenant dari public.tenants ───────────────────────────
export interface SessionTenant {
  id:                  string
  name:                string
  slug:                string
  plan:                PlanType
  billingCycle:        'monthly' | 'yearly'
  // Quota
  quota_content_used:    number
  quota_content_max:     number
  quota_video_used:      number
  quota_video_max:       number
  quotaResetAt:        string
  // Onboarding data
  niche?:              string
  sellerType?:         string
  timezone:            string
  locale:              string
  isActive:            boolean
}

// ── Combined session ──────────────────────────────────────────
export interface AppSession {
  user:   SessionUser
  tenant: SessionTenant
}

// ── API response dari /api/auth/session ──────────────────────
export interface SessionResponse {
  success: boolean
  data?:   AppSession
  error?:  string
}