// apps/web-app/lib/platform/instagram.ts
// ── Instagram Graph API adapter ───────────────────────────────
// Uses Meta's Instagram Graph API (replaces deprecated Basic Display API)
//
// API reference: https://developers.facebook.com/docs/instagram-api
//
// Required scopes:
//   instagram_basic               — read profile + media
//   instagram_content_publish     — create posts (Phase 2)
//   pages_read_engagement         — read engagement stats
//   pages_show_list               — list pages
//
// NOTE: Requires Meta App Review before going live.
//       During development: test with added Test Users in Meta App Dashboard.
import type {
  PlatformAdapter, OAuthTokens, PlatformUser, MediaPost,
} from './adapter'

const INSTAGRAM_CLIENT_ID     = process.env.INSTAGRAM_CLIENT_ID     ?? ''
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET ?? ''
const APP_URL                 = process.env.NEXT_PUBLIC_APP_URL      ?? 'http://localhost:3000'

const META_AUTH_URL    = 'https://www.facebook.com/v18.0/dialog/oauth'
const META_TOKEN_URL   = 'https://graph.facebook.com/v18.0/oauth/access_token'
const META_REFRESH_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const GRAPH_BASE       = 'https://graph.facebook.com/v18.0'

// Long-lived token exchange (short-lived 1h → long-lived 60 days)
const EXCHANGE_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'

// ── Default scopes ────────────────────────────────────────────
const DEFAULT_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_read_engagement',
  'pages_show_list',
]

export class InstagramAdapter implements PlatformAdapter {
  readonly platformId           = 'instagram'
  readonly displayName          = 'Instagram'
  readonly refreshThresholdDays = 7     // refresh when <7 days left
  readonly defaultTokenTtlDays  = 60    // long-lived token = 60 days

  // ── Build OAuth URL ─────────────────────────────────────────
  getAuthorizationUrl({ state, redirectUri, scopes }: {
    state:       string
    redirectUri: string
    scopes?:     string[]
  }): string {
    const params = new URLSearchParams({
      client_id:     INSTAGRAM_CLIENT_ID,
      redirect_uri:  redirectUri,
      state,
      scope:         (scopes ?? DEFAULT_SCOPES).join(','),
      response_type: 'code',
    })

    return `${META_AUTH_URL}?${params.toString()}`
  }

  // ── Exchange code for short-lived token, then upgrade to long-lived ──
  async exchangeCodeForTokens({ code, redirectUri }: {
    code:        string
    redirectUri: string
  }): Promise<OAuthTokens> {
    // Step 1: Get short-lived access token (~1 hour)
    const shortLivedRes = await fetch(META_TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        redirect_uri:  redirectUri,
        code,
        grant_type:    'authorization_code',
      }),
    })

    if (!shortLivedRes.ok) {
      const err = await shortLivedRes.json().catch(() => ({}))
      throw new OAuthError(
        err.error?.code ?? 'TOKEN_EXCHANGE_FAILED',
        err.error?.message ?? `HTTP ${shortLivedRes.status}`,
        'auth',
      )
    }

    const shortToken = await shortLivedRes.json()

    // Step 2: Exchange short-lived for long-lived (~60 days)
    const longLivedRes = await fetch(
      `${EXCHANGE_URL}?${new URLSearchParams({
        grant_type:        'fb_exchange_token',
        client_id:         INSTAGRAM_CLIENT_ID,
        client_secret:     INSTAGRAM_CLIENT_SECRET,
        fb_exchange_token: shortToken.access_token,
      })}`,
    )

    if (!longLivedRes.ok) {
      // Fall back to short-lived token if exchange fails
      console.warn('[instagram] Long-lived token exchange failed, using short-lived')
      return {
        access_token: shortToken.access_token,
        tokenType:   shortToken.token_type ?? 'bearer',
        expiresIn:   shortToken.expires_in ?? 3600,
        expiresAt:   new Date(Date.now() + 3600 * 1000),
        scope:       shortToken.scope,
      }
    }

    const longToken = await longLivedRes.json()
    const expiresIn = longToken.expires_in ?? this.defaultTokenTtlDays * 86400

    return {
      access_token: longToken.access_token,
      tokenType:   longToken.token_type ?? 'bearer',
      expiresIn,
      expiresAt:   new Date(Date.now() + expiresIn * 1000),
      scope:       shortToken.scope ?? DEFAULT_SCOPES.join(','),
    }
  }

  // ── Refresh long-lived token (before expiry) ──────────────
  // Meta long-lived tokens are refreshed by re-hitting exchange endpoint
  async refreshAccessToken({ accessToken }: {
    refresh_token: string
    accessToken?: string
  }): Promise<OAuthTokens> {
    const token = accessToken
    if (!token) throw new OAuthError('NO_TOKEN', 'Access token required for refresh', 'auth')

    const res = await fetch(
      `${META_REFRESH_URL}?${new URLSearchParams({
        grant_type:        'fb_exchange_token',
        client_id:         INSTAGRAM_CLIENT_ID,
        client_secret:     INSTAGRAM_CLIENT_SECRET,
        fb_exchange_token: token,
      })}`,
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new OAuthError(
        err.error?.code ?? 'REFRESH_FAILED',
        err.error?.message ?? `HTTP ${res.status}`,
        'auth',
      )
    }

    const data      = await res.json()
    const expiresIn = data.expires_in ?? this.defaultTokenTtlDays * 86400

    return {
      access_token: data.access_token,
      tokenType:   data.token_type ?? 'bearer',
      expiresIn,
      expiresAt:   new Date(Date.now() + expiresIn * 1000),
    }
  }

  // ── Token health check ─────────────────────────────────────
  async verifyToken(access_token: string): Promise<boolean> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/debug_token?${new URLSearchParams({
          input_token:  accessToken,
          access_token: `${INSTAGRAM_CLIENT_ID}|${INSTAGRAM_CLIENT_SECRET}`,
        })}`,
      )
      if (!res.ok) return false
      const data = await res.json()
      return data.data?.is_valid === true
    } catch {
      return false
    }
  }

  // ── Get user profile (Instagram Business/Creator account) ──
  async getUserProfile(access_token: string): Promise<PlatformUser> {
    // First get linked Facebook pages → then Instagram Business accounts
    const pagesRes = await graphGet('/me/accounts', accessToken, {
      fields: 'instagram_business_account,name,id',
    })

    const pages = pagesRes.data ?? []
    const pageWithIG = pages.find((p: any) => p.instagram_business_account)

    if (!pageWithIG?.instagram_business_account) {
      // Fallback: try /me for basic profile (personal testing accounts)
      return this._getPersonalProfile(accessToken)
    }

    const igaccount_id = pageWithIG.instagram_business_account.id

    const igRes = await graphGet(`/${igaccount_id}`, accessToken, {
      fields: 'id,username,name,profile_picture_url,followers_count,account_type',
    })

    return {
      platformUserId:  igRes.id,
      username:        igRes.username,
      displayName:     igRes.name,
      profilePicture:  igRes.profile_picture_url,
      accountType:     (igRes.account_type?.toLowerCase() ?? 'business') as PlatformUser['accountType'],
      followerCount:   igRes.followers_count,
    }
  }

  private async _getPersonalProfile(access_token: string): Promise<PlatformUser> {
    const res = await graphGet('/me', accessToken, { fields: 'id,name' })
    return {
      platformUserId: res.id,
      username:       res.name ?? res.id,
      displayName:    res.name,
    }
  }

  // ── Get recent media posts ─────────────────────────────────
  async getRecentPosts({ accessToken, limit = 12 }: {
    access_token: string
    limit?:      number
  }): Promise<MediaPost[]> {
    // Get Instagram Business Account ID first
    const pagesRes = await graphGet('/me/accounts', accessToken, {
      fields: 'instagram_business_account',
    })

    const page = pagesRes.data?.find((p: any) => p.instagram_business_account)
    if (!page) return []

    const igaccount_id = page.instagram_business_account.id

    const mediaRes = await graphGet(`/${igaccount_id}/media`, accessToken, {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      limit:  String(limit),
    })

    return (mediaRes.data ?? []).map((item: any): MediaPost => ({
      platformPostId: item.id,
      permalink:      item.permalink,
      mediaType:      item.media_type,
      caption:        item.caption,
      thumbnailUrl:   item.thumbnail_url ?? item.media_url,
      mediaUrl:       item.media_url,
      timestamp:      item.timestamp ? new Date(item.timestamp) : undefined,
      likeCount:      item.like_count,
      commentCount:   item.comments_count,
    }))
  }
}

// ── Graph API helper ───────────────────────────────────────────
async function graphGet(
  endpoint:    string,
  access_token: string,
  params:      Record<string, string> = {},
): Promise<any> {
  const url = new URL(`${GRAPH_BASE}${endpoint}`)
  url.searchParams.set('access_token', accessToken)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },   // never cache in Next.js
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    const code = data.error?.code ?? res.status
    const msg  = data.error?.message ?? `HTTP ${res.status}`
    const type = data.error?.type

    throw new OAuthError(String(code), msg, mapErrorType(type, code))
  }

  return data
}

function mapErrorType(type: string | undefined, code: number | string): OAuthError['type'] {
  if (code === 190 || type === 'OAuthException') return 'auth'
  if (code === 32 || code === 4 || type === 'OAuthRateLimited') return 'rate_limit'
  if (code === 200 || type === 'GraphMethodException') return 'permission'
  if (code === 100) return 'not_found'
  return 'server'
}

// ── Custom error class ─────────────────────────────────────────
export class OAuthError extends Error {
  constructor(
    public readonly code:    string,
    message:                 string,
    public readonly type:    'auth' | 'rate_limit' | 'permission' | 'not_found' | 'server' = 'server',
  ) {
    super(message)
    this.name = 'OAuthError'
  }

  toJSON() {
    return { code: this.code, message: this.message, type: this.type }
  }
}