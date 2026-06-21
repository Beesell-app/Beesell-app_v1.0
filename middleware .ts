// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'beesell.ai'
const SITE_HOST = ROOT_DOMAIN
const APP_HOST = `app.${ROOT_DOMAIN}`

// Jangan pernah host-route path ini (aset statis & sistem)
const ALWAYS_ALLOW = ['/auth', '/_next', '/favicon', '/robots', '/sitemap']

// Rute yang bisa diakses tanpa login
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/pricing',
  '/about',
  '/terms',
  '/privacy',
])

// Rute yang WAJIB berada di subdomain app.beesell.ai
const APP_PREFIXES = [
  '/login',
  '/register',
  '/onboarding',
  '/dashboard',
  '/content',
  '/studio',
  '/quick-tools',
  '/marketing-kit',
  '/campaign',
  '/audience',
  '/budget-optimizer',
  '/analytics',
  '/scheduler',
  '/billing',
  '/settings',
  '/admin',
  '/creator',
  '/brand-kit',
  '/credit',
]

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const host = (req.headers.get('host') ?? '').toLowerCase()

  const onApp = host.startsWith('app.')
  const isAppPath = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  
  // Deteksi apakah sedang di production atau localhost
  const isProdHost = host === ROOT_DOMAIN || host === APP_HOST

  // ====================================================
  // 1. PASS THROUGH ASET & EXTENSIONS
  // ====================================================
  if (ALWAYS_ALLOW.some((p) => pathname.startsWith(p)) || pathname.includes('.')) {
    return NextResponse.next()
  }

  // ====================================================
  // 2. STRICT HOST ROUTING (Dua Arah)
  // ====================================================
  if (isProdHost && !pathname.startsWith('/api')) {
    // Skenario A: User akses beesell.ai/dashboard -> Lempar ke app.beesell.ai/dashboard
    if (!onApp && isAppPath) {
      return NextResponse.redirect(`https://${APP_HOST}${pathname}${search}`, 308)
    }

    // Skenario B: User akses app.beesell.ai/pricing -> Lempar ke beesell.ai/pricing
    // Memastikan subdomain 'app' hanya melayani APP_PREFIXES saja.
    if (onApp && !isAppPath) {
      return NextResponse.redirect(`https://${SITE_HOST}${pathname}${search}`, 308)
    }
  }

  // ====================================================
  // 3. SUPABASE SSR & COOKIE SYNC
  // ====================================================
  let supabaseResponse = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update request cookies
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          
          // Refresh response
          supabaseResponse = NextResponse.next({ request: req })
          
          // Update response cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ====================================================
  // 4. REFRESH SESSION & SEO PROTECTIONS
  // ====================================================
  const { data: { user } } = await supabase.auth.getUser()

  // Cegah Google mengindeks halaman di dalam subdomain app.*
  if (onApp) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // ====================================================
  // 5. PUBLIC ROUTES (Login / Register Handling)
  // ====================================================
  if (PUBLIC_ROUTES.has(pathname)) {
    if (user && (pathname === '/login' || pathname === '/register')) {
      const dest = await getOnboardingDest(supabase, user.id)
      return makeRedirect(new URL(dest, req.url), supabaseResponse)
    }
    return supabaseResponse
  }

  // ====================================================
  // 6. ONBOARDING GUARD
  // ====================================================
  if (pathname.startsWith('/onboarding')) {
    if (!user) {
      return makeRedirect(new URL('/login?next=/onboarding', req.url), supabaseResponse)
    }

    const dest = await getOnboardingDest(supabase, user.id)
    if (dest === '/dashboard') {
      return makeRedirect(new URL('/dashboard', req.url), supabaseResponse)
    }
    return supabaseResponse
  }

  // ====================================================
  // 7. APP ROUTES GUARD (Protected)
  // ====================================================
  if (isAppPath) {
    if (!user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return makeRedirect(loginUrl, supabaseResponse)
    }

    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_done')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.onboarding_done) {
      return makeRedirect(new URL('/onboarding', req.url), supabaseResponse)
    }
    return supabaseResponse
  }

  // ====================================================
  // 8. PROTECTED API ROUTES
  // ====================================================
  if (pathname.startsWith('/api/')) {
    const isProtectedApi = [
      '/api/generate',
      '/api/studio',
      '/api/library',
      '/api/onboarding',
      '/api/dashboard',
      '/api/settings',
      '/api/user',
    ].some((p) => pathname.startsWith(p))

    if (isProtectedApi && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return supabaseResponse
  }

  return supabaseResponse
}

// ── Helper Functions ──────────────────────────────────────────

/**
 * Memastikan cookie dari pengecekan Supabase (seperti token refresh)
 * terbawa dengan sempurna ke object NextResponse.redirect().
 */
function makeRedirect(url: URL | string, sbResponse: NextResponse): NextResponse {
  const response = NextResponse.redirect(url)

  sbResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
    response.cookies.set(name, value, {
      path: '/',
      ...rest,
    })
  })

  return response
}

async function getOnboardingDest(supabase: any, userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('users')
      .select('onboarding_done')
      .eq('id', userId)
      .maybeSingle()

    return data?.onboarding_done ? '/dashboard' : '/onboarding'
  } catch {
    return '/onboarding'
  }
}

export const config = {
  matcher: [
    /*
     * Match semua rute KECUALI:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - gambar dan aset statis lainnya
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
}