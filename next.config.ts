// apps/web-app/next.config.ts
// ── Production-grade Next.js config ──────────────────────────
// Includes: image optimization, bundle analysis, security headers,
//           route prefetch hints, package externals, compression
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
// Bundle analyzer — activated via ANALYZE=true npm run build
// ... (existing nextConfig object stays the same) ...
import path from "path";


const sentryOptions = {
  // Sentry org/project from dashboard
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
 
  // Auth token for source map upload (set in CI/Vercel env)
  authToken: process.env.SENTRY_AUTH_TOKEN,
 
  // Suppress Sentry CLI output in build logs
  silent: process.env.CI === 'true',
 
  // Source maps: upload to Sentry, delete from public bundle
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
    deleteSourcemapsAfterUpload: true,
  },
 
  // Automatically tree-shake Sentry debug code in production
  webpack: {
  treeshake: {
    removeDebugLogging: true,
  },
  
},
 
  // Tunnel Sentry requests through own domain (bypass ad-blockers)
  // tunnelRoute: '/api/monitoring',
 
  // Wrap API routes with Sentry for server-side error capture
  autoInstrumentServerFunctions: true,
}
 
// Chain: withBundleAnalyzer → withSentryConfig

 
// ─────────────────────────────────────────────────────────────
// QUICK PATCH: if you don't want to refactor entire next.config.ts,
// just replace the last line:
//
//   // Old:
//   export default withBundleAnalyzer(nextConfig)
//
//   // New:
//   import { withSentryConfig } from '@sentry/nextjs'
//   const sentryOptions = { org: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT, authToken: process.env.SENTRY_AUTH_TOKEN, silent: true, tunnelRoute: '/api/monitoring', disableLogger: true }
//   export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions)
// ─────────────────────────────────────────────────────────────
 

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true, openAnalyzer: false })
    : (config: NextConfig) => config

const nextConfig: NextConfig = {

  // ── Output ─────────────────────────────────────────────────
  output: 'standalone',    // for Docker/Vercel optimized output
  
  // ── React ──────────────────────────────────────────────────
  reactStrictMode: true,

  outputFileTracingRoot: path.join(__dirname, "../../"),
 

  // ── Turbopack (default in Next 15+) ────────────────────────
  turbopack: {
    root: __dirname,
  },

  // ── External packages ───────────────────────────────────────
  serverExternalPackages: [
    '@prisma/client',
    'bcryptjs',
    'fabric',       // Fabric.js — browser only, never bundle server-side
  ],

  // ── Image optimization ──────────────────────────────────────
  images: {
    // Formats: prefer AVIF (30% smaller than WebP), fall back to WebP
    formats: ['image/avif', 'image/webp'],

    // Device breakpoints for srcSet generation
    deviceSizes:      [390, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes:       [16, 32, 64, 96, 128, 256, 384],
    
    // Supabase Storage
    // Replicate (generated images)
    // Meta (Instagram avatars)
    // TikTok CDN
    // Product marketplace CDNs (for scraping preview)
    remotePatterns: [
      // Supabase Storage (tenant media)
      { protocol: 'https', hostname: '*.supabase.co',         pathname: '/storage/v1/object/**' },
      { protocol: 'https', hostname: '*.supabase.in',         pathname: '/storage/v1/object/**' },
      {
        protocol: 'https',
        hostname: 'GANTI-DENGAN-REF.supabase.co',   // ambil dari NEXT_PUBLIC_SUPABASE_URL kamu
        pathname: '/storage/v1/object/public/**',
      },
      // Replicate (AI generated images, webhook download)
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: '*.replicate.delivery' },
      { protocol: 'https', hostname: 'pbxt.replicate.delivery' },

      // Meta / Instagram (profile pictures, media)
      { protocol: 'https', hostname: '*.cdninstagram.com' },
      { protocol: 'https', hostname: 'scontent*.cdninstagram.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },

      // Google (OAuth avatar)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },

      // Marketplace CDNs (scraping preview thumbnails only)
      { protocol: 'https', hostname: 'cf.shopee.co.id' },
      { protocol: 'https', hostname: 'images.tokopedia.net' },
      { protocol: 'https', hostname: 'img.lazada.co.id' },
    ],

    // Cache optimization
    minimumCacheTTL:   60 * 60 * 24 * 7,   // 7 days in browser cache
    dangerouslyAllowSVG: false,              // security: don't serve SVG via next/image
    contentDispositionType: 'attachment',    // prevent XSS via SVG
  },

  // ── Security + Cache headers ────────────────────────────────
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options',   value: 'nosniff' },
      { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
      { key: 'X-XSS-Protection',         value: '1; mode=block' },
      { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
    ]

    return [
      // Apply security headers to all routes
      {
        source: '/(.*)',
        headers: securityHeaders,
      },

      // API: no cache
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },

      // Static assets: aggressive cache (content-hash in filename = safe forever)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // Images via next/image: cache 7 days
      {
        source: '/_next/image:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },

      // Dashboard pages: no-store (always fresh)
      {
        source: '/(dashboard|library|content|editor|settings)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },

  // ── Redirects ───────────────────────────────────────────────
  async redirects() {
    return [
      // Legacy route compat
      { source: '/home',    destination: '/dashboard', permanent: true },
      { source: '/konten',  destination: '/library',   permanent: true },
    ]
  },

  // ── Webpack config (non-Turbopack builds) ───────────────────
  webpack: (config, { isServer, dev }) => {
    // Client-side: exclude server-only modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:     false,
        net:    false,
        tls:    false,
        crypto: false,
        path:   false,
        stream: false,
      }

      // Exclude Fabric.js server-side build (browser-only)
      config.externals = [
        ...(config.externals ?? []),
        ({ request }: { request: string }, callback: Function) => {
          if (request === 'fabric' && !isServer) callback()
          else callback()
        },
      ]
    }

    // Production: enable module concatenation (tree-shaking)
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds:    'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks:                'all',
          minSize:               20_000,
          maxSize:               244_000,  // 244KB max chunk (Lighthouse threshold)
          cacheGroups: {
            // Vendor: node_modules (split per major lib for better caching)
            reactVendor: {
              test:     /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name:     'vendor-react',
              chunks:   'all',
              priority: 40,
            },
            tanstackVendor: {
              test:     /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              name:     'vendor-tanstack',
              chunks:   'all',
              priority: 35,
            },
            rechartsVendor: {
              test:     /[\\/]node_modules[\\/](recharts|d3|victory)[\\/]/,
              name:     'vendor-charts',
              chunks:   'all',
              priority: 30,
            },
            fabricVendor: {
              test:     /[\\/]node_modules[\\/](fabric)[\\/]/,
              name:     'vendor-fabric',
              chunks:   'all',
              priority: 30,
            },
            commons: {
              name:               'commons',
              chunks:             'all',
              minChunks:          2,
              priority:           20,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },

  // ── Experimental features ───────────────────────────────────
  experimental: {
    // Optimize CSS (critters for critical CSS inlining)
    optimizeCss: true,

    // Partial prerendering (PPR) — stable in Next 15
    ppr: 'incremental',

    // Faster server actions
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '') ?? '',
      ].filter(Boolean),
    },
  },
}
export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  sentryOptions,
)

export {}

