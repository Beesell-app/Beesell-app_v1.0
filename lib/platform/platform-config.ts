// apps/web-app/lib/platform/platform-config.ts
// ── Platform metadata & OAuth configuration ───────────────────
// MVP note: IG & TikTok OAuth butuh business account approval yang memakan waktu.
// UI dibangun sekarang, OAuth URLs akan di-populate setelah approval.
// Untuk MVP demo: pakai "manual token" mode sebagai fallback.

export type SupportedPlatform = 'instagram' | 'instagram_reels' | 'tiktok'
export type ConnectionStatus  = 'connected' | 'expired' | 'disconnected' | 'error' | 'pending'

export const PLATFORM_CONFIG: Record<SupportedPlatform, {
  id:            SupportedPlatform
  label:         string
  labelShort:    string
  icon:          string          // emoji fallback
  color:         string          // brand color
  gradient:      string
  description:   string
  features:      string[]
  oauthEnabled:  boolean         // false = not yet approved/configured
  oauthUrl?:     string          // populated dari env
  scopes:        string[]
  tokenTtlDays:  number          // típical token lifetime
  docsUrl:       string
}> = {
  instagram: {
    id:           'instagram',
    label:        'Instagram Feed',
    labelShort:   'Instagram',
    icon:         '📷',
    color:        '#E1306C',
    gradient:     'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    description:  'Post foto dan carousel langsung ke feed Instagram kamu.',
    features:     ['Auto-post foto', 'Caption + hashtag', 'Schedule post', 'Carousel support'],
    oauthEnabled: !!(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET),
    oauthUrl:     process.env.INSTAGRAM_CLIENT_ID
      ? `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL + '/api/platform-connections/instagram/callback')}&scope=instagram_basic,instagram_content_publish&response_type=code`
      : undefined,
    scopes:       ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
    tokenTtlDays: 60,
    docsUrl:      'https://developers.facebook.com/docs/instagram-api',
  },

  instagram_reels: {
    id:           'instagram_reels',
    label:        'Instagram Reels',
    labelShort:   'Reels',
    icon:         '🎬',
    color:        '#833AB4',
    gradient:     'linear-gradient(45deg, #833AB4, #FD1D1D, #FCB045)',
    description:  'Upload dan schedule video Reels ke Instagram.',
    features:     ['Upload video Reels', 'Caption otomatis', 'Cover image', 'Hashtag'],
    oauthEnabled: !!(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET),
    oauthUrl:     process.env.INSTAGRAM_CLIENT_ID
      ? `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL + '/api/platform-connections/instagram_reels/callback')}&scope=instagram_basic,instagram_content_publish&response_type=code`
      : undefined,
    scopes:       ['instagram_basic', 'instagram_content_publish'],
    tokenTtlDays: 60,
    docsUrl:      'https://developers.facebook.com/docs/instagram-api/guides/reels',
  },

  tiktok: {
    id:           'tiktok',
    label:        'TikTok',
    labelShort:   'TikTok',
    icon:         '🎵',
    color:        '#010101',
    gradient:     'linear-gradient(135deg, #010101, #FE2C55)',
    description:  'Posting konten video dan caption langsung ke TikTok.',
    features:     ['Upload video', 'Caption + hashtag', 'Sound selection', 'Schedule post'],
    oauthEnabled: !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
    oauthUrl:     process.env.TIKTOK_CLIENT_KEY
      ? `https://www.tiktok.com/v2/auth/authorize?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL + '/api/platform-connections/tiktok/callback')}&scope=user.info.basic,video.upload&response_type=code&state=tiktok`
      : undefined,
    scopes:       ['user.info.basic', 'video.upload', 'video.publish'],
    tokenTtlDays: 30,
    docsUrl:      'https://developers.tiktok.com/doc/login-kit-web',
  },
}

export const PLATFORM_LIST = Object.values(PLATFORM_CONFIG) as typeof PLATFORM_CONFIG[SupportedPlatform][]

// ── Status helpers ───────────────────────────────────────────
export function getStatusLabel(status: ConnectionStatus): string {
  return {
    connected:    'Terhubung',
    expired:      'Token Expired',
    disconnected: 'Tidak Terhubung',
    error:        'Error',
    pending:      'Menghubungkan...',
  }[status]
}

export function getStatusColor(status: ConnectionStatus): {
  text: string; bg: string; border: string; dot: string
} {
  const map = {
    connected:    { text: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', dot: '#16A34A' },
    expired:      { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
    disconnected: { text: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', dot: '#94A3B8' },
    error:        { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
    pending:      { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B' },
  }
  return map[status] ?? map.disconnected
}

export function isTokenExpiredOrExpiringSoon(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  // Warn 7 days before expiry
  const warningMs = 7 * 24 * 60 * 60 * 1000
  return new Date(expiresAt).getTime() - Date.now() < warningMs
}