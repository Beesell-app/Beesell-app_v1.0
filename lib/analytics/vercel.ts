// apps/web-app/lib/analytics/vercel.ts
// ── Vercel Analytics + Speed Insights ────────────────────────
// inject() initializes Web Vitals collection automatically.
// Components used in app/layout.tsx.

// Vercel Analytics (page views, custom events)
export { Analytics as VercelAnalytics } from '@vercel/analytics/react'

// Vercel Speed Insights (Core Web Vitals: LCP, CLS, FID, INP)
export { SpeedInsights } from '@vercel/speed-insights/next'

// Custom Vercel event (complements PostHog for funnel tracking)
export { track as trackVercel } from '@vercel/analytics'

// Usage examples:
//
// In app/layout.tsx:
//   import { VercelAnalytics, SpeedInsights } from '@/lib/analytics/vercel'
//   <VercelAnalytics />
//   <SpeedInsights />
//
// Custom event (e.g. after generate):
//   import { trackVercel } from '@/lib/analytics/vercel'
//   trackVercel('caption_generated', { plan: 'free', platform: 'instagram' })