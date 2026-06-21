// apps/web-app/lib/platform/adapter.ts
// ── Platform Adapter Interface ────────────────────────────────
// Contract yang harus di-implement semua platform adapters.
// Pattern: Strategy + Factory.
//
// Adding new platform (e.g. TikTok):
//   1. Create lib/platform/tiktok.ts implementing PlatformAdapter
//   2. Register in getPlatformAdapter()
//   3. Add OAuth routes under /api/oauth/tiktok/

// ── Core types ────────────────────────────────────────────────
export interface OAuthTokens {
  access_token:    string
  refresh_token?:   string
  tokenType?:     string
  expiresIn?:     number    // seconds from now
  expiresAt?:     Date
  scope?:         string
}

export interface PlatformUser {
  platformUserId:  string
  username:        string
  displayName?:    string
  profilePicture?: string
  accountType?:    'personal' | 'business' | 'creator'
  followerCount?:  number
}

export interface MediaPost {
  platformPostId: string
  permalink?:     string
  mediaType:      'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS'
  caption?:       string
  thumbnailUrl?:  string
  mediaUrl?:      string
  timestamp?:     Date
  likeCount?:     number
  commentCount?:  number
}

export interface PlatformError {
  code:    string
  message: string
  type?:   'auth' | 'rate_limit' | 'permission' | 'not_found' | 'server'
}

// ── Platform Adapter Interface ────────────────────────────────
export interface PlatformAdapter {
  readonly platformId: string       // 'instagram' | 'tiktok' | etc
  readonly displayName: string

  // ── OAuth ──────────────────────────────────────────────────
  // Build authorization URL for redirect
  getAuthorizationUrl(params: {
    state:       string             // CSRF token
    redirectUri: string
    scopes?:     string[]
  }): string

  // Exchange authorization code for tokens
  exchangeCodeForTokens(params: {
    code:        string
    redirectUri: string
  }): Promise<OAuthTokens>

  // Refresh access token using refresh token
  refreshAccessToken(params: {
    refresh_token: string
    accessToken?: string            // some platforms need current AT for refresh
  }): Promise<OAuthTokens>

  // Check if token is still valid (optional health check)
  verifyToken?(access_token: string): Promise<boolean>

  // ── User profile ───────────────────────────────────────────
  getUserProfile(access_token: string): Promise<PlatformUser>

  // ── Posts ──────────────────────────────────────────────────
  // Get recent posts (for dashboard preview)
  getRecentPosts(params: {
    access_token: string
    limit?:      number
  }): Promise<MediaPost[]>

  // ── Token lifecycle ────────────────────────────────────────
  // How many days before expiry to trigger refresh
  readonly refreshThresholdDays: number

  // Platform-specific token TTL (for calculating expiresAt)
  readonly defaultTokenTtlDays: number
}

// ── Factory function ──────────────────────────────────────────
import { InstagramAdapter } from './instagram'

const adapters = new Map<string, PlatformAdapter>()

// Lazy init — avoid instantiating until needed
export function getPlatformAdapter(platformId: string): PlatformAdapter {
  if (!adapters.has(platformId)) {
    switch (platformId) {
      case 'instagram':
      case 'instagram_reels':
        adapters.set(platformId, new InstagramAdapter())
        break
      // case 'tiktok':
      //   adapters.set(platformId, new TikTokAdapter())
      //   break
      default:
        throw new Error(`No adapter registered for platform: ${platformId}`)
    }
  }
  return adapters.get(platformId)!
}

export function listSupportedPlatforms(): string[] {
  return ['instagram', 'instagram_reels']
  // Add 'tiktok' when TikTokAdapter is ready
}