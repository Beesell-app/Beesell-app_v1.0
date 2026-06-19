// apps/web-app/app/api/oauth/instagram/callback/route.ts
// GET /api/oauth/instagram/callback?code=...&state=...
// Handle OAuth callback: verify state → exchange code → get profile → store encrypted
import { NextResponse }          from 'next/server'
import { createClient }          from '@/lib/supabase/server'
import { db }                    from '@/lib/db'
import { getPlatformAdapter }    from '@/lib/platform/adapter'
import { encryptTokenBundle }    from '@/lib/platform/token-encryption'
import { OAuthError }            from '@/lib/platform/instagram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REDIRECT_URI    = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram/callback`
const SUCCESS_REDIRECT = '/settings/connections?connected=instagram'
const ERROR_REDIRECT   = '/settings/connections?error='

export async function GET(req: Request) {
  const url    = new URL(req.url)
  const code   = url.searchParams.get('code')
  const state  = url.searchParams.get('state')
  const errParam = url.searchParams.get('error')

  // ── 1. User denied / platform error ────────────────────────
  if (errParam) {
    const desc = url.searchParams.get('error_description') ?? errParam
    console.warn('[oauth/instagram/callback] User denied or error:', desc)
    return NextResponse.redirect(
      new URL(ERROR_REDIRECT + encodeURIComponent(desc), req.url),
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(ERROR_REDIRECT + 'missing_params', req.url),
    )
  }

  try {
    // ── 2. Auth check ─────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const dbUser = await db.user.findUnique({
      where:  { id: user.id },
      select: { tenant_id: true },
    })
    if (!dbUser) return NextResponse.redirect(new URL('/login', req.url))

    // ── 3. CSRF state verification ─────────────────────────────
    const cookies   = req.headers.get('cookie') ?? ''
    const cookieMap = Object.fromEntries(
      cookies.split(';').map(c => c.trim().split('=').map(decodeURIComponent)),
    )
    const storedState = cookieMap['oauth_state_instagram']

    if (!storedState || storedState !== state) {
      console.error('[oauth/instagram/callback] State mismatch — possible CSRF attack')
      return NextResponse.redirect(
        new URL(ERROR_REDIRECT + 'state_mismatch', req.url),
      )
    }

    // ── 4. Exchange code for tokens ───────────────────────────
    const adapter = getPlatformAdapter('instagram')
    const tokens  = await adapter.exchangeCodeForTokens({ code, redirectUri: REDIRECT_URI })

    // ── 5. Fetch user profile ─────────────────────────────────
    let profile
    try {
      profile = await adapter.getUserProfile(tokens.accessToken)
    } catch (profileErr) {
      // Non-fatal: store connection even if profile fetch fails
      console.warn('[oauth/instagram/callback] Profile fetch failed:', profileErr)
      profile = null
    }

    // ── 6. Encrypt tokens ─────────────────────────────────────
    const encrypted = encryptTokenBundle({
      access_token:  tokens.accessToken,
      refresh_token: tokens.refresh_token ?? null,
      expiresAt:    tokens.expiresAt    ?? null,
      scope:        tokens.scope        ?? null,
    })

    // ── 7. Upsert platform_connections ───────────────────────
    await db.platformConnection.upsert({
      where: {
        tenant_id_platform: {
          tenant_id: dbUser.tenant_id,
          platform: 'instagram',
        },
      },
      create: {
        tenant_id:       dbUser.tenant_id,
        platform:       'instagram',
        account_id:      profile?.platformUserId ?? null,
        account_name:    profile?.username        ?? null,
        account_avatar:  profile?.profilePicture  ?? null,
        // Store encrypted tokens in existing text fields
        access_token:    encrypted.accessTokenEnc,
        refresh_token:   encrypted.refresh_token:Enc,
        token_expires_at: encrypted.expiresAt ? new Date(encrypted.expiresAt) : null,
        scope:          encrypted.scope,
        status:         'connected',
        last_verified_at: new Date(),
        metadata: {
          accountType:   profile?.accountType,
          followerCount: profile?.followerCount,
          encryptedAt:   new Date().toISOString(),
          adapter:       'instagram_graph_api',
        } as any,
      },
      update: {
        account_id:      profile?.platformUserId ?? undefined,
        account_name:    profile?.username        ?? undefined,
        account_avatar:  profile?.profilePicture  ?? undefined,
        access_token:    encrypted.accessTokenEnc,
        refresh_token:   encrypted.refresh_token:Enc,
        token_expires_at: encrypted.expiresAt ? new Date(encrypted.expiresAt) : null,
        scope:          encrypted.scope,
        status:         'connected',
        last_verified_at: new Date(),
        error_message:   null,
        error_Code:      null,
        metadata: {
          accountType:   profile?.accountType,
          followerCount: profile?.followerCount,
          encryptedAt:   new Date().toISOString(),
          adapter:       'instagram_graph_api',
        } as any,
      },
    })

    // ── 8. Clear state cookie + redirect to success ───────────
    const response = NextResponse.redirect(new URL(SUCCESS_REDIRECT, req.url))
    response.cookies.delete('oauth_state_instagram')
    return response

  } catch (err: any) {
    console.error('[oauth/instagram/callback] Error:', err)

    const isOAuthErr = err instanceof OAuthError
    const code_      = isOAuthErr ? err.code : 'INTERNAL'
    const msg        = isOAuthErr ? err.message : 'Terjadi kesalahan. Coba lagi.'

    // Log connection error to DB
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { tenant_id: true } })
        if (dbUser) {
          await db.platformConnection.upsert({
            where: { tenant_id_platform: { tenant_id: dbUser.tenant_id, platform: 'instagram' } },
            create: {
              tenant_id:     dbUser.tenant_id,
              platform:     'instagram',
              status:       'error',
              error_message: msg,
              error_Code:    code_,
            },
            update: {
              status:       'error',
              error_message: msg,
              error_Code:    code_,
            },
          })
        }
      }
    } catch {}

    return NextResponse.redirect(
      new URL(ERROR_REDIRECT + encodeURIComponent(msg), req.url),
    )
  }
}