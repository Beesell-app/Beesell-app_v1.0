// app/auth/confirm/route.ts
// Handles Supabase default email template which uses:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
//
// This is a SEPARATE route from /auth/callback for clarity.
// Both routes end up at the same destination logic.
//
// Add this URL to Supabase Redirect URLs:
//   http://localhost:3000/auth/confirm
//   https://yourdomain.com/auth/confirm

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'
import type { EmailOtpType }   from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const url       = new URL(request.url)
  const origin    = url.origin
  const tokenHash = url.searchParams.get('token_hash')
  const type      = url.searchParams.get('type')

  if (!tokenHash || !type) {
    console.error('[confirm] missing token_hash or type')
    return NextResponse.redirect(
      new URL('/login?error=Link+verifikasi+tidak+valid.', origin)
    )
  }

  const jar: Array<{ name: string; value: string; options: any }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  ()      => request.cookies.getAll(),
        setAll:  (toSet) => toSet.forEach(c => jar.push(c)),
      },
    }
  )

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type:       type as EmailOtpType,
  })

  if (error) {
    console.error('[confirm] verifyOtp error:', error.message)
    const expired = error.message.includes('expired') || error.message.includes('otp_expired')
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          expired
            ? 'Link verifikasi sudah kedaluwarsa. Klik "Kirim ulang email" untuk mendapatkan yang baru.'
            : 'Verifikasi email gagal. Silakan coba lagi.'
        )}`,
        origin
      )
    )
  }

  if (!data.user) {
    return NextResponse.redirect(
      new URL('/login?error=Sesi+tidak+terbentuk.', origin)
    )
  }

  console.log('[confirm] verified:', data.user.email, '| type:', type)

  if (type === 'recovery') {
    const res = NextResponse.redirect(new URL('/auth/reset-password', origin))
    jar.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, { path:'/', sameSite:'lax', httpOnly:true, ...options })
    )
    return res
  }

  // Check onboarding status
  const { data: profile, error: profileError } = await supabase
  .from('users')
  .select('onboarding_done')
  .eq('id', data.user.id)
  .maybeSingle()

    if (profileError) {
    console.error('[confirm] profile error:', profileError.message)
    }

  const dest = profile?.onboarding_done ? '/dashboard' : '/onboarding'
  const res  = NextResponse.redirect(new URL(dest, origin))
  jar.forEach(({ name, value, options }) =>
    res.cookies.set(name, value, {
      path:     '/',
      sameSite: 'lax',
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      ...options,
    })
  )
  return res
}