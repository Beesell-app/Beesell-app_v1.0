// apps/web-app/app/api/oauth/instagram/route.ts
// GET /api/oauth/instagram  — initiate OAuth flow
// Generates CSRF state, stores in cookie, redirects to Meta auth URL
import { NextResponse }  from 'next/server'
import { randomBytes }   from 'crypto'
import { createClient }  from '@/lib/supabase/server'
import { getPlatformAdapter } from '@/lib/platform/adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram/callback`

export async function GET(req: Request) {
  try {
    // 1. Auth check — must be logged in to initiate
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // 2. Check env vars configured
    if (!process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
      return NextResponse.json({
        error:   'NOT_CONFIGURED',
        message: 'Instagram OAuth not configured. Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET.',
      }, { status: 503 })
    }

    // 3. Generate CSRF state token
    const state = randomBytes(24).toString('hex')

    // 4. Build auth URL via adapter
    const adapter  = getPlatformAdapter('instagram')
    const authUrl  = adapter.getAuthorizationUrl({ state, redirectUri: REDIRECT_URI })

    // 5. Store state in HTTP-only cookie (expires in 10 min)
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('oauth_state_instagram', state, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   600,   // 10 minutes
      path:     '/',
    })

    return response

  } catch (err: any) {
    console.error('[oauth/instagram] Init error:', err)
    return NextResponse.json({ error: 'INTERNAL', message: err.message }, { status: 500 })
  }
}