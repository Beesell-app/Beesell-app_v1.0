import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // config kamu
}

const sentryOptions = {
  org: 'beesell-ai',
  project: 'beesell-nextjs',

  silent: !process.env.CI,

  widenClientFileUpload: true,

  tunnelRoute: '/monitoring',

  automaticVercelMonitors: true,

  disableLogger: true,
}

export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  sentryOptions
)