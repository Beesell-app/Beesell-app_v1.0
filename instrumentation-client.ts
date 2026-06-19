// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://737b53ce2c68286d42b2f56a0a8d543f@o4511421366140928.ingest.de.sentry.io/4511421368238160",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
// sentry.client.config.ts

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