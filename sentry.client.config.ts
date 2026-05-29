// sentry.client.config.ts

import * as Sentry from '@sentry/nextjs'

// Prevent duplicate init during HMR / Fast Refresh
if (!Sentry.getClient()) {

  Sentry.init({

    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment:
      process.env.NODE_ENV,

    enabled:
      process.env.NODE_ENV === 'production',

    tracesSampleRate: 1.0,

    replaysSessionSampleRate: 0.1,

    replaysOnErrorSampleRate: 1.0,

    integrations: [

      // Prevent duplicate replay instance
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],

    beforeSend(event) {

      // Remove sensitive headers
      if (event.request?.headers) {

        delete event.request.headers.Authorization
        delete event.request.headers.Cookie
      }

      return event
    },
  })
}