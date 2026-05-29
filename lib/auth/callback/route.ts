// apps/web-app/app/auth/callback/route.ts
// ── Auth Callback — FIXED ──────────────────────────────────────
//
// BUG LAMA: selalu redirect /dashboard setelah verify email
// FIX:
//   - User baru (baru verify email / Google) → /onboarding
//   - User lama (sudah onboarding) → /dashboard
//   - Password recovery → /auth/reset-password
//
// PENTING: Gunakan NextResponse + set cookies manual agar
// session tersimpan sebelum middleware jalan

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code      = searchParams.get('code')
  const type      = searchParams.get('type')            // 'recovery' | 'signup' | null
  const error     = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // ── Provider error ─────────────────────────────────────
  if (error) {
    console.error('[callback] provider error:', error, '|', errorDesc)

    if (errorDesc?.includes('expired') || errorDesc?.includes('exchange external code')) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Link sudah kedaluwarsa. Silakan login kembali.')}`, origin),
      )
    }
    if (error === 'access_denied') {
      return NextResponse.redirect(new URL('/login', origin))
    }
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDesc ?? 'Login gagal. Coba lagi.')}`, origin),
    )
  }

  if (!code) {
    console.error('[callback] no code in URL')
    return NextResponse.redirect(
      new URL('/login?error=Link+tidak+valid.+Coba+register+ulang.', origin),
    )
  }

  // ── Buat response dulu, lalu attach cookies ke response itu ─
  // INI KUNCI: cookies harus di-set ke NextResponse, bukan cookieStore
  const response = new NextResponse(null, {
  status: 302,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set ke KEDUA: request (untuk session) DAN response (untuk browser)
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ── Exchange code → session ────────────────────────────
  const { data, error: exchErr } = await supabase.auth.exchangeCodeForSession(code)

  if (exchErr) {
    console.error('[callback] exchange failed:', exchErr.message)

    // Code sudah dipakai (user refresh halaman callback)
    if (
      exchErr.message.includes('already been used') ||
      exchErr.message.includes('invalid') ||
      exchErr.message.includes('exchange') ||
      exchErr.message.includes('code challenge') ||
      exchErr.message.includes('pkce')
    ) {
      // Cek apakah session masih valid
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Session valid → cek onboarding status
        const destination = await getDestination(supabase, user.id)
        return NextResponse.redirect(new URL(destination, origin), { headers: response.headers })
      }
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Link tidak valid atau sudah kedaluwarsa.')}`, origin),
    )
  }

  if (!data.session || !data.user) {
    console.error('[callback] no session after exchange')
    return NextResponse.redirect(
      new URL('/login?error=Session+tidak+terbentuk.+Coba+lagi.', origin),
    )
  }

  const { user } = data
  console.log('[callback] OK:', user.email, '| type:', type, '| provider:', user.app_metadata?.provider)

  // ── Password recovery ──────────────────────────────────
  if (type === 'recovery') {
    response.headers.set('Location', `${origin}/auth/reset-password`)
    return response
  }

  // ── Tentukan destination: onboarding atau dashboard ────
  const destination = await getDestination(supabase, user.id)
  console.log('[callback] destination:', destination)

  // Set redirect ke destination yang benar (cookies sudah di-set ke response)
  return NextResponse.redirect(
  new URL(destination, origin),
  {
    headers: response.headers,
  }
)
}

// ── Helper: cek onboarding_done dari DB ───────────────────────
async function getDestination(supabase: any, userId: string): Promise<string> {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('onboarding_done, onboarding_step')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[callback] getDestination error:', error.message)
      // Kalau table tidak ada atau user tidak ada → onboarding
      // (mungkin trigger 016 belum dijalankan)
      return '/onboarding'
    }

    if (!profile) {
      // User tidak ada di public.users → onboarding
      // Trigger 016 akan create record saat insert ke auth.users
      // Tapi kalau belum dijalankan, fallback ke onboarding
      return '/onboarding'
    }

    return profile.onboarding_done ? '/dashboard' : '/onboarding'

  } catch (err: any) {
    console.error('[callback] getDestination catch:', err?.message)
    return '/onboarding'  // safe default
  }
}