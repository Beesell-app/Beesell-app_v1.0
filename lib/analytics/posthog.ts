// apps/web-app/lib/analytics/posthog.ts
// ── PostHog event tracking ────────────────────────────────────
// Typed events → no typo in event names
// All events prefixed by domain: auth_, content_, scheduler_, etc.

import posthog from 'posthog-js'

// ── Init (call once in layout) ────────────────────────────────
export function initPostHog() {
  if (typeof window === 'undefined') return
  if (posthog.__loaded) return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host:       process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false,   // manual — we handle this
    capture_pageleave: true,
    autocapture:    false,     // manual events only (cleaner data)
    persistence:    'localStorage',
    disable_session_recording: process.env.NODE_ENV !== 'production',

    // Sanitize PII from captured data
    sanitize_properties: (props) => {
      delete props.$email
      delete props.$password
      delete props.access_token
      return props
    },

    loaded(ph) {
      if (process.env.NODE_ENV !== 'production') {
        ph.debug()
      }
    },
  })
}

// ── Identify user ─────────────────────────────────────────────
export function identifyUser(params: {
  userId:    string
  tenant_id:  string
  plan:      string
  email?:    string
  name?:     string
  created_at?: string
}) {
  posthog.identify(params.userId, {
    tenant_id:  params.tenant_id,
    plan:       params.plan,
    email:      params.email,
    name:       params.name,
    created_at: params.created_at,
    // Group by tenant
    company_id: params.tenant_id,
  })

  posthog.group('tenant', params.tenant_id, {
    plan: params.plan,
  })
}

export function resetUser() {
  posthog.reset()
}

// ── Typed event catalog ───────────────────────────────────────
// Add new events here — TS will enforce correct usage

// Auth events
export const track = {
  // ── Auth ────────────────────────────────────────
  auth_registered: (props: { plan: string; invite_code?: string }) =>
    capture('auth_registered', props),

  auth_logged_in: () =>
    capture('auth_logged_in'),

  auth_logged_out: (props: { feedback_given: boolean }) =>
    capture('auth_logged_out', props),

  // ── Caption generation ─────────────────────────
  caption_generate_started: (props: {
    platform:     string
    content_goal: string
    tone:         string
    language:     string
    input_mode:   'manual' | 'url' | 'photo'
    has_brand_kit: boolean
    variants:     number
  }) => capture('caption_generate_started', props),

  caption_generate_success: (props: {
    platform:     string
    content_goal: string
    model:        string
    cached:       boolean
    duration_ms:  number
    variants:     number
  }) => capture('caption_generate_success', props),

  caption_generate_failed: (props: {
    error_code: string
    is_quota:   boolean
  }) => capture('caption_generate_failed', props),

  caption_copied: (props: { variant_index: number; platform: string }) =>
    capture('caption_copied', props),

  caption_edited: (props: { field: 'caption' | 'hashtag' | 'cta' }) =>
    capture('caption_edited', props),

  // ── Image generation ─────────────────────────
  image_generate_started: (props: { template_id?: string }) =>
    capture('image_generate_started', props),

  image_generate_success: (props: { duration_ms: number; watermarked: boolean }) =>
    capture('image_generate_success', props),

  image_downloaded: (props: { format: string; size: string }) =>
    capture('image_downloaded', props),

  image_saved_to_library: () =>
    capture('image_saved_to_library'),

  // ── Template editor ──────────────────────────
  template_selected: (props: { template_id: string; category: string }) =>
    capture('template_selected', props),

  template_exported: (props: { template_id: string; format: string }) =>
    capture('template_exported', props),

  // ── Scheduler ────────────────────────────────
  content_scheduled: (props: { platform: string; source: 'drag' | 'quick_add' }) =>
    capture('content_scheduled', props),

  content_rescheduled: () =>
    capture('content_rescheduled'),

  content_unscheduled: () =>
    capture('content_unscheduled'),

  // ── Library ──────────────────────────────────
  library_searched: (props: { match_type: 'fts' | 'trigram'; result_count: number }) =>
    capture('library_searched', props),

  library_filter_applied: (props: { filter: string; value: string }) =>
    capture('library_filter_applied', props),

  // ── Platform connections ──────────────────────
  platform_connect_started: (props: { platform: string }) =>
    capture('platform_connect_started', props),

  platform_connected: (props: { platform: string }) =>
    capture('platform_connected', props),

  platform_disconnected: (props: { platform: string }) =>
    capture('platform_disconnected', props),

  // ── Plan / upgrade ───────────────────────────
  quota_exceeded: (props: { metric: string; limit: number; plan: string }) =>
    capture('quota_exceeded', props),

  upgrade_modal_shown: (props: { current_plan: string; suggested_plan: string }) =>
    capture('upgrade_modal_shown', props),

  upgrade_cta_clicked: (props: { current_plan: string; target_plan: string; source: string }) =>
    capture('upgrade_cta_clicked', props),

  // ── Brand kit ────────────────────────────────
  brand_kit_created: () =>
    capture('brand_kit_created'),

  brand_kit_applied: (props: { kit_id: string; platform: string }) =>
    capture('brand_kit_applied', props),

  // ── Onboarding ───────────────────────────────
  onboarding_step_completed: (props: { step: string; step_number: number }) =>
    capture('onboarding_step_completed', props),

  onboarding_completed: (props: { days_to_complete: number }) =>
    capture('onboarding_completed', props),

  // ── NPS / feedback ───────────────────────────
  nps_submitted: (props: { score: number; category: 'promoter' | 'passive' | 'detractor'; day: number }) =>
    capture('nps_submitted', props),

  feedback_submitted: (props: { type: string; rating?: number }) =>
    capture('feedback_submitted', props),

  // ── Page views (manual) ──────────────────────
  page_viewed: (props: { path: string; title?: string }) =>
    capture('$pageview', { ...props, $current_url: window.location.href }),
}

// ── Internal capture helper ───────────────────────────────────
function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  try {
    posthog.capture(event, {
      ...props,
      $time: Date.now(),
    })
  } catch (err) {
    // Never crash the app due to analytics
    console.warn('[PostHog]', err)
  }
}

// ── Feature flags ─────────────────────────────────────────────
export function isFeatureEnabled(flag: string): boolean {
  try {
    return Boolean(posthog.isFeatureEnabled(flag))
  } catch {
    return false
  }
}

export { posthog }