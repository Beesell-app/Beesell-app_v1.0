// middleware.ts  (root of project, NOT inside /app)
// ─────────────────────────────────────────────────────────────────────────────
// Auth guard + onboarding redirect.
//
// CRITICAL RULES that prevent "invalid link" errors:
//
//  1. /auth/* routes MUST be skipped entirely — never intercept them.
//     These routes handle the Supabase PKCE code exchange.
//     Intercepting them can corrupt the code_verifier cookie → "invalid code".
//
//  2. The supabase client cookie setAll MUST:
//     a) mutate req.cookies (so downstream handlers see updated session)
//     b) rebuild supabaseResponse with the mutated request
//     c) set cookies on supabaseResponse (so browser receives them)
//     This is the ONLY correct pattern per Supabase SSR docs.
//
//  3. When redirecting, ALWAYS copy cookies from supabaseResponse
//     to the redirect response. Otherwise session is lost.
//
//  4. ALWAYS call supabase.auth.getUser() even if you only need session check.
//     This refreshes the token and updates the cookies.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'

// Routes that don't need any auth logic
const ALWAYS_ALLOW = [
  '/auth',           // /auth/callback, /auth/confirm — MUST pass through
  '/_next',
  '/favicon',
  '/robots',
  '/sitemap',
]

// Routes accessible without login
const PUBLIC_ROUTES = new Set([
  '/', '/login', '/register', '/forgot-password', '/pricing', '/about', '/terms', '/privacy',
])

// App routes that need session + onboarding check
const APP_PREFIXES = [
  '/dashboard', '/quick-tools', '/studio', '/library', '/billing',
  '/settings', '/caption', '/campaign', '/automation', '/marketplace',
  '/affiliate', '/trend', '/analytics', '/brand', '/team',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── 1. Pass through: auth routes & static files ───────────
  if (ALWAYS_ALLOW.some(p => pathname.startsWith(p)) || pathname.includes('.')) {
    return NextResponse.next()
  }

  // ── 2. Create supabase client with correct cookie pattern ──
  let supabaseResponse = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // a) mutate req so subsequent code in this middleware sees the session
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          // b) rebuild response with the mutated request headers
          supabaseResponse = NextResponse.next({ request: req })
          // c) set cookies on response so browser receives & stores them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── 3. Refresh session (MUST NOT be removed) ───────────────
  // getUser() validates JWT, refreshes if needed, updates cookies
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // ── 4. Public routes ───────────────────────────────────────
  if (PUBLIC_ROUTES.has(pathname)) {
    // Logged-in user hitting auth pages → send to app
    if (user && (pathname === '/login' || pathname === '/register')) {
      const dest = await getOnboardingDest(supabase, user.id)
      return makeRedirect(new URL(dest, req.url), supabaseResponse)
    }
    return supabaseResponse
  }

  // ── 5. Onboarding page ─────────────────────────────────────
  if (pathname.startsWith('/onboarding')) {
    if (!user) return makeRedirect(new URL('/login?next=/onboarding', req.url), supabaseResponse)

    // If already done onboarding, don't let them back in
    const dest = await getOnboardingDest(supabase, user.id)
    if (dest === '/dashboard') return makeRedirect(new URL('/dashboard', req.url), supabaseResponse)

    return supabaseResponse
  }

  // ── 6. App routes — require session ───────────────────────
  const isAppRoute = APP_PREFIXES.some(p => pathname.startsWith(p))
  if (isAppRoute) {
    if (!user) {
      const url = new URL('/login', req.url)
      url.searchParams.set('next', pathname)
      return makeRedirect(url, supabaseResponse)
    }

    // Check onboarding — redirect to /onboarding if not done
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('onboarding_done')
      .eq('id', user.id)
      .maybeSingle()
      

    if (profileError) {
      console.error('[confirm] profile error:', profileError.message)
    }
    const dest = profile?.onboarding_done
      ? '/dashboard'
      : '/onboarding'
  }

  // ── 7. API routes ──────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const isProtectedApi = [
      '/api/generate', '/api/library', '/api/onboarding',
      '/api/dashboard', '/api/settings', '/api/user',
    ].some(p => pathname.startsWith(p))

    if (isProtectedApi && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return supabaseResponse
  }

  return supabaseResponse
}

// ── Helpers ────────────────────────────────────────────────────
function makeRedirect(url: URL | string, sbResponse: NextResponse): NextResponse {
  const res = NextResponse.redirect(url)
  // Forward all session cookies to the redirect response
  sbResponse.cookies.getAll().forEach(({ name, value, ...rest }) =>
    res.cookies.set(name, value, { path: '/', ...rest })
  )
  return res
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
  // Run on all routes except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)).*)',
  ],
}