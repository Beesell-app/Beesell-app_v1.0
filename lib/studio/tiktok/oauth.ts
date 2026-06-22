// lib/studio/tiktok/oauth.ts
// ══════════════════════════════════════════════════════════════
// BEESELL AI — TIKTOK OAUTH & CONTENT POSTING HELPERS
// ──────────────────────────────────────────────────────────────
// OAuth 2.0 (scope video.publish) + token refresh + simpan koneksi
// ke tabel public.tiktok_connections (lihat migration SQL).
//
// ENV yang dibutuhkan:
//   TIKTOK_CLIENT_KEY      = client key dari TikTok for Developers
//   TIKTOK_CLIENT_SECRET   = client secret
//   TIKTOK_REDIRECT_URI    = (opsional) override redirect URI penuh
//   NEXT_PUBLIC_APP_URL    = base URL app (dipakai jika REDIRECT_URI kosong)
//
// Endpoint resmi (open.tiktokapis.com):
//   POST /v2/oauth/token/                       → tukar code / refresh
//   POST /v2/post/publish/creator_info/query/   → privacy options + username
//   POST /v2/post/publish/video/init/           → init Direct Post
//   POST /v2/post/publish/status/fetch/         → cek status publish
// ══════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js'

export const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
export const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2'
export const TIKTOK_SCOPES   = 'user.info.basic,video.publish'

export const TIKTOK_ENDPOINTS = {
  token:       `${TIKTOK_API_BASE}/oauth/token/`,
  creatorInfo: `${TIKTOK_API_BASE}/post/publish/creator_info/query/`,
  videoInit:   `${TIKTOK_API_BASE}/post/publish/video/init/`,
  statusFetch: `${TIKTOK_API_BASE}/post/publish/status/fetch/`,
} as const

export interface TikTokTokenResponse {
  access_token:       string
  expires_in:         number
  open_id:            string
  refresh_token:      string
  refresh_expires_in: number
  scope:              string
  token_type:         string
}

export interface TikTokConnection {
  user_id:            string
  open_id:            string
  access_token:       string
  refresh_token:      string
  scope:              string
  expires_at:         string
  refresh_expires_at: string
  creator_username?:  string | null
}

// ── Kredensial dari ENV ───────────────────────────────────────
function getClientCreds() {
  const clientKey    = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    throw new Error('TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET belum di-set di environment')
  }
  return { clientKey, clientSecret }
}

export function getRedirectUri(): string {
  const explicit = process.env.TIKTOK_REDIRECT_URI
  if (explicit) return explicit
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!base) throw new Error('Set TIKTOK_REDIRECT_URI atau NEXT_PUBLIC_APP_URL di environment')
  return `${base}/api/studio/video/tiktok/auth/callback`
}

// ── URL authorize (langkah 1 OAuth) ───────────────────────────
export function buildAuthorizeUrl(state: string): string {
  const { clientKey } = getClientCreds()
  const params = new URLSearchParams({
    client_key:    clientKey,
    scope:         TIKTOK_SCOPES,
    response_type: 'code',
    redirect_uri:  getRedirectUri(),
    state,
  })
  return `${TIKTOK_AUTH_URL}?${params.toString()}`
}

// ── Tukar authorization code → token (langkah 2) ──────────────
export async function exchangeCodeForToken(code: string): Promise<TikTokTokenResponse> {
  const { clientKey, clientSecret } = getClientCreds()
  const res = await fetch(TIKTOK_ENDPOINTS.token, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key:    clientKey,
      client_secret: clientSecret,
      code,
      grant_type:    'authorization_code',
      redirect_uri:  getRedirectUri(),
    }),
  })
  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || `Token exchange gagal (${res.status})`)
  }
  return json as TikTokTokenResponse
}

// ── Refresh access token ──────────────────────────────────────
export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
  const { clientKey, clientSecret } = getClientCreds()
  const res = await fetch(TIKTOK_ENDPOINTS.token, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key:    clientKey,
      client_secret: clientSecret,
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || `Refresh token gagal (${res.status})`)
  }
  return json as TikTokTokenResponse
}

// ── Simpan / update koneksi (upsert by user_id) ───────────────
export async function saveConnection(
  supabase: SupabaseClient,
  userId: string,
  token: TikTokTokenResponse,
  creatorUsername?: string,
): Promise<void> {
  const now = Date.now()
  const row = {
    user_id:            userId,
    open_id:            token.open_id,
    access_token:       token.access_token,
    refresh_token:      token.refresh_token,
    scope:              token.scope,
    expires_at:         new Date(now + token.expires_in * 1000).toISOString(),
    refresh_expires_at: new Date(now + token.refresh_expires_in * 1000).toISOString(),
    ...(creatorUsername ? { creator_username: creatorUsername } : {}),
    updated_at:         new Date().toISOString(),
  }
  const { error } = await supabase
    .from('tiktok_connections')
    .upsert(row, { onConflict: 'user_id' })
  if (error) throw new Error(`Gagal simpan koneksi TikTok: ${error.message}`)
}

// ── Ambil koneksi valid (auto-refresh jika hampir expired) ────
export async function getValidConnection(
  supabase: SupabaseClient,
  userId: string,
): Promise<TikTokConnection | null> {
  const { data, error } = await supabase
    .from('tiktok_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null

  const conn = data as TikTokConnection

  // Refresh jika token tinggal < 2 menit
  if (new Date(conn.expires_at).getTime() - Date.now() < 120_000) {
    try {
      const refreshed = await refreshAccessToken(conn.refresh_token)
      await saveConnection(supabase, userId, refreshed, conn.creator_username ?? undefined)
      return {
        ...conn,
        access_token:  refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at:    new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      }
    } catch {
      return null // refresh gagal → user harus re-connect
    }
  }
  return conn
}

// ── Helper POST ke TikTok API (JSON) ──────────────────────────
export async function tiktokPost(
  endpoint: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; json: any }> {
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

// Cek envelope error TikTok ({ error: { code, message } })
export function tiktokHasError(json: any): boolean {
  return !!json?.error?.code && json.error.code !== 'ok'
}