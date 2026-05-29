// apps/web-app/lib/prefetch.ts
// ── Route prefetch strategy ───────────────────────────────────
// Next.js App Router already prefetches <Link> on hover by default.
// This file handles:
//   1. Manual router.prefetch() for non-link navigation
//   2. Prefetch priority hints based on user context
//   3. Critical route preloading on dashboard load

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ── Route priority map ────────────────────────────────────────
// Adjacent routes to prefetch based on current route
// (high-probability next destination from each page)
export const PREFETCH_ADJACENCY: Record<string, string[]> = {
  '/dashboard': [
    '/content/new',   // CTA from dashboard
    '/library',       // common next page
  ],
  '/library': [
    '/content/new',   // "Buat Konten" button
    '/editor',        // template editor
  ],
  '/content/new': [
    '/library',       // after generate → go to library
    '/jobs',          // job status
  ],
  '/editor': [
    '/library',       // after save → library
    '/content/new',   // back to creator
  ],
  '/settings': [
    '/settings/brand-kit',
    '/settings/connections',
  ],
  '/settings/connections': [
    '/settings/brand-kit',
    '/settings',
  ],
}

// ── Hook: auto-prefetch adjacent routes ───────────────────────
// Add to layout.tsx to prefetch on route change
export function usePrefetchAdjacentRoutes() {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Normalize pathname to base (strip dynamic segments)
    const base = '/' + pathname.split('/').slice(1, 2).join('/')
    const adjacent = PREFETCH_ADJACENCY[base] ?? []

    // Stagger prefetches to not block current page render
    adjacent.forEach((route, i) => {
      const delay = 500 + i * 200   // 500ms, 700ms, 900ms...
      const timer = setTimeout(() => {
        router.prefetch(route)
      }, delay)

      return () => clearTimeout(timer)
    })
  }, [pathname, router])
}

// ── Prefetch on hover (programmatic, no <Link>) ───────────────
// Usage: <button onMouseEnter={() => prefetchOnHover('/content/new')}>
export function usePrefetchOnHover() {
  const router = useRouter()
  const prefetched = new Set<string>()

  return (href: string) => {
    if (!prefetched.has(href)) {
      router.prefetch(href)
      prefetched.add(href)
    }
  }
}