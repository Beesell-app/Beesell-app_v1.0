// app/auth/callback/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Handles ALL Supabase auth redirects:
//  • Email verification  (code= query param, PKCE flow)
//  • Google OAuth        (code= query param)
//  • Password reset      (code= + type=recovery)
//  • Token-hash flow     (token_hash= — Supabase default template)
//
// WHY "Link tidak valid" happened:
//  PKCE flow: signUp() stores code_verifier in a cookie.
//  When /auth/callback receives ?code=xxx, it must send code_verifier
//  alongside the code to Supabase. If the cookie is missing or corrupted
//  (e.g. middleware intercepted /auth/* and mutated cookies),
//  Supabase returns "invalid code" error.
//
// FIX — cookieJar pattern:
//  • Read cookies from the original request (code_verifier is there)
//  • Collect cookies Supabase wants to SET during exchange (session cookies)
//  • After exchange succeeds, build ONE new redirect response
//  • Attach all collected cookies to that response
//  • Return it — browser now has both code_verifier (already had it)
//    and the new session cookies
//
// This avoids the bug where response.headers.set('Location', ...)
// was called AFTER NextResponse.redirect() was created — that
// modifies headers but does NOT change the actual redirect target.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'
import type { EmailOtpType }   from '@supabase/supabase-js'

type CookieItem = { name: string; value: string; options: Record<string, unknown> }

// ── Entry point ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const url       = new URL(request.url)
  const origin    = url.origin
  const code      = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type      = url.searchParams.get('type')
  const oError    = url.searchParams.get('error')
  const oErrDesc  = url.searchParams.get('error_description')

  // ── A. OAuth / Supabase provider error in the URL ─────────
  if (oError) {
    console.error('[callback] provider error:', oError, oErrDesc)
    if (oError === 'access_denied') {
      return NextResponse.redirect(new URL('/login', origin))
    }
    const msg = oErrDesc?.includes('expired')
      ? 'Link verifikasi sudah kedaluwarsa. Silakan minta link baru.'
      : (oErrDesc ?? 'Terjadi kesalahan. Silakan coba lagi.')
    return NextResponse.redirect(errUrl(origin, msg))
  }

  // ── B. Token-hash flow ────────────────────────────────────
  // Supabase default email template: {{ .SiteURL }}/auth/callback?token_hash=...&type=email
  if (tokenHash && !code) {
    return handleTokenHash(request, origin, tokenHash, (type ?? 'email') as EmailOtpType)
  }

  // ── C. No code and no token_hash ─────────────────────────
  if (!code) {
    console.error('[callback] no code or token_hash in URL:', request.url)
    return NextResponse.redirect(errUrl(origin, 'Link tidak valid. Silakan register ulang.'))
  }

  // ── D. PKCE code flow ─────────────────────────────────────
  return handlePKCECode(request, origin, code, type)
}

// ── D. PKCE Code Exchange ─────────────────────────────────────
async function handlePKCECode(
  request: NextRequest,
  origin:  string,
  code:    string,
  type:    string | null
) {
  const jar: CookieItem[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read from the original request — code_verifier cookie MUST be here
        getAll:  ()     => request.cookies.getAll(),
        // Collect cookies that Supabase wants to set (session tokens)
        // Do NOT set them yet — we'll attach to the final response
        setAll:  (toSet) => toSet.forEach(c => jar.push(c as CookieItem)),
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  // ── Exchange failed ───────────────────────────────────────
  if (error) {
    console.error('[callback] exchangeCodeForSession error:', error.message)

    const alreadyUsed = error.message.includes('already been used')
    const pkceInvalid = error.message.includes('code challenge') || error.message.includes('pkce')
    const invalid     = error.message.includes('invalid')
    const expired     = error.message.includes('expired') || error.message.includes('otp_expired')

    // Code was reused (user refreshed callback page) — check if session still exists
    if (alreadyUsed || pkceInvalid || invalid) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('[callback] code reused but session valid, routing:', user.email)
        const dest = await getOnboardingDest(supabase, user.id)
        return buildRedirect(origin, dest, jar)
      }
    }

    if (expired) {
      return NextResponse.redirect(
        errUrl(origin, 'Link verifikasi sudah kedaluwarsa. Klik "Kirim ulang email" untuk mendapatkan link baru.')
      )
    }

    return NextResponse.redirect(
      errUrl(origin, 'Link tidak valid. Silakan login atau daftar ulang.')
    )
  }

  // ── Exchange succeeded but no session ─────────────────────
  if (!data.session || !data.user) {
    console.error('[callback] exchange OK but no session')
    return NextResponse.redirect(errUrl(origin, 'Sesi gagal dibuat. Silakan coba lagi.'))
  }

  console.log('[callback] PKCE success:', data.user.email, '| type:', type)

  // Password recovery → reset password page
  if (type === 'recovery') {
    return buildRedirect(origin, '/auth/reset-password', jar)
  }

  // Determine where to send user
  const dest = await getOnboardingDest(supabase, data.user.id)
  console.log('[callback] redirecting to:', dest)

  return buildRedirect(origin, dest, jar)
}

// ── B. Token-hash OTP verification ───────────────────────────
async function handleTokenHash(
  request:   NextRequest,
  origin:    string,
  tokenHash: string,
  type:      EmailOtpType
) {
  const jar: CookieItem[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  ()      => request.cookies.getAll(),
        setAll:  (toSet) => toSet.forEach(c => jar.push(c as CookieItem)),
      },
    }
  )

  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

  if (error) {
    console.error('[callback/token_hash] verifyOtp error:', error.message)
    const expired = error.message.includes('expired') || error.message.includes('otp_expired')
    return NextResponse.redirect(
      errUrl(origin, expired
        ? 'Link verifikasi sudah kedaluwarsa. Klik "Kirim ulang email".'
        : 'Verifikasi gagal. Silakan coba lagi.'
      )
    )
  }

  if (!data.user) {
    return NextResponse.redirect(errUrl(origin, 'Sesi tidak terbentuk. Silakan coba lagi.'))
  }

  console.log('[callback/token_hash] success:', data.user.email, '| type:', type)

  if (type === 'recovery') return buildRedirect(origin, '/auth/reset-password', jar)

  const dest = await getOnboardingDest(supabase, data.user.id)
  return buildRedirect(origin, dest, jar)
}

// ── Helpers ───────────────────────────────────────────────────

/** Build a redirect response and attach all session cookies */
function buildRedirect(origin: string, path: string, cookies: CookieItem[]): NextResponse {
  const location = path.startsWith('http') ? path : `${origin}${path}`
  const response = NextResponse.redirect(location)
  cookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, {
      path:     '/',
      sameSite: 'lax',
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      ...(options as any),
    })
  )
  return response
}

/** Build a login redirect URL with an error message */
function errUrl(origin: string, message: string): URL {
  return new URL(`/login?error=${encodeURIComponent(message)}`, origin)
}

/** Check onboarding status and return destination path */
async function getOnboardingDest(supabase: any, userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_done')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[callback] getOnboardingDest DB error:', error.message)
      return '/onboarding'
    }

    // data === null: user not yet in public.users
    // Happens if trigger 016 hasn't run or there's a race condition
    // Safe default: /onboarding (they'll set up their profile there)
    if (data === null) {
      console.warn('[callback] user not in public.users, defaulting to /onboarding. userId:', userId)
      return '/onboarding'
    }

    return data.onboarding_done ? '/dashboard' : '/onboarding'
  } catch (e: any) {
    console.error('[callback] getOnboardingDest exception:', e?.message)
    return '/onboarding'
  }
}