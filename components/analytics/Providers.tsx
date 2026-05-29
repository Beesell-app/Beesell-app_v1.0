'use client'
// apps/web-app/components/analytics/Providers.tsx
// ── Analytics providers ────────────────────────────────────────
// Handles: PostHog init, page view tracking, user identification
// Mounted once in app/(dashboard)/layout.tsx
import { useEffect, useRef } from 'react'
import { usePathname }       from 'next/navigation'
import { initPostHog, identifyUser, track, resetUser } from '@/lib/analytics/posthog'
import * as Sentry           from '@sentry/nextjs'

interface Props {
  userId?:   string
  tenant_id?: string
  plan?:     string
  email?:    string
  name?:     string
}

export function AnalyticsProviders({ userId, tenant_id, plan, email, name }: Props) {
  const pathname    = usePathname()
  const initialized = useRef(false)
  const lastPath    = useRef('')

  // ── Init PostHog once ────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initPostHog()
  }, [])

  // ── Identify user when logged in ─────────────────────────────
  useEffect(() => {
    if (!userId || !tenant_id) return

    // PostHog identity
    identifyUser({ userId, tenant_id, plan: plan ?? 'free', email, name })

    // Sentry user context
    Sentry.setUser({
      id:       userId,
      email,
      username: name,
    })

    Sentry.setTag('plan',      plan ?? 'free')
    Sentry.setTag('tenant_id', tenant_id)

    return () => {
      // Cleanup on unmount (logout)
      Sentry.setUser(null)
    }
  }, [userId, tenant_id, plan, email, name])

  // ── Track page views on route change ─────────────────────────
  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    lastPath.current = pathname

    track.page_viewed({
      path:  pathname,
      title: document.title,
    })
  }, [pathname])

  return null
}

// ── Public-facing analytics (landing page) ────────────────────
// Lighter version — no user identification, just page views
export function PublicAnalytics() {
  const pathname = usePathname()
  const lastPath = useRef('')

  useEffect(() => {
    initPostHog()
  }, [])

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    lastPath.current = pathname
    track.page_viewed({ path: pathname })
  }, [pathname])

  return null
}