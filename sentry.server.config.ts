// apps/web-app/sentry.server.config.ts
// ── Sentry server SDK ─────────────────────────────────────────
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  environment: process.env.NODE_ENV,
  release:     process.env.NEXT_PUBLIC_APP_VERSION,

  // Don't spam Sentry with expected business errors
  ignoreErrors: [
    'QUOTA_EXCEEDED',
    'PLAN_LIMIT',
    'UNAUTHORIZED',
    'NOT_FOUND',
  ],

  beforeSend(event) {
    // Scrub tokens/secrets from server errors
    if (event.exception?.values) {
      event.exception.values.forEach(ex => {
        if (ex.value?.includes('token') || ex.value?.includes('secret')) {
          ex.value = '[REDACTED] ' + (ex.value?.slice(0, 50) ?? '')
        }
      })
    }
    return event
  },
})