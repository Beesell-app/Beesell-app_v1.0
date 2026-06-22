// app/api/studio/video/tiktok/publish/route.ts
// ══════════════════════════════════════════════════════════════
// TIKTOK PUBLISH — Content Posting API (Direct Post)
// POST ?action=publish      → init Direct Post (PULL_FROM_URL)
// POST ?action=creator-info → ambil username + privacy options (UX wajib)
// POST ?action=status       → poll status publish (publish_id)
// ──────────────────────────────────────────────────────────────
// Catatan TikTok:
//   • Client BELUM di-audit → semua post dipaksa SELF_ONLY (private).
//   • privacy_level wajib termasuk creator.privacy_level_options.
//   • PULL_FROM_URL: domain video_url WAJIB diverifikasi di Dev Portal.
//   • Branded content tidak boleh SELF_ONLY → di-guard otomatis.
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import {
  getValidConnection, buildAuthorizeUrl, tiktokPost, tiktokHasError,
  TIKTOK_ENDPOINTS,
} from '@/lib/studio/tiktok/oauth'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const t0     = Date.now()
  const url    = new URL(req.url)
  const action = url.searchParams.get('action') ?? 'publish'

  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pastikan akun TikTok terhubung (auto-refresh token bila perlu)
    const conn = await getValidConnection(supabase, user.id)
    if (!conn) {
      let authUrl = ''
      try { authUrl = buildAuthorizeUrl(randomBytes(16).toString('hex')) } catch { /* env belum lengkap */ }
      return NextResponse.json(
        { error: 'Akun TikTok belum terhubung', needAuth: true, authUrl },
        { status: 409 },
      )
    }

    // ── action=creator-info: untuk render UX sebelum posting ──
    if (action === 'creator-info') {
      const { json } = await tiktokPost(TIKTOK_ENDPOINTS.creatorInfo, conn.access_token, {})
      if (tiktokHasError(json)) {
        return NextResponse.json({ error: json.error.message ?? 'Gagal ambil creator info', raw: json.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, creator: json?.data, elapsedMs: Date.now() - t0 })
    }

    // ── action=status: poll status publish ───────────────────
    if (action === 'status') {
      const { publishId } = (await req.json()) as { publishId?: string }
      if (!publishId) return NextResponse.json({ error: 'publishId wajib diisi' }, { status: 400 })

      const { json } = await tiktokPost(TIKTOK_ENDPOINTS.statusFetch, conn.access_token, { publish_id: publishId })
      if (tiktokHasError(json)) {
        return NextResponse.json({ error: json.error.message ?? 'Gagal cek status', raw: json.error }, { status: 400 })
      }
      return NextResponse.json({
        success:  true,
        status:   json?.data?.status,        // PROCESSING_* | PUBLISH_COMPLETE | FAILED | ...
        detail:   json?.data,
        elapsedMs: Date.now() - t0,
      })
    }

    // ── action=publish (default): init Direct Post ───────────
    const body = (await req.json()) as {
      videoUrl?:           string
      title?:              string
      privacyLevel?:       string
      disableComment?:     boolean
      disableDuet?:        boolean
      disableStitch?:      boolean
      brandContentToggle?: boolean
      brandOrganicToggle?: boolean
      coverTimestampMs?:   number
    }

    const {
      videoUrl, title,
      privacyLevel       = 'SELF_ONLY',
      disableComment     = false,
      disableDuet        = false,
      disableStitch      = false,
      brandContentToggle = false,
      brandOrganicToggle = false,
      coverTimestampMs   = 1000,
    } = body

    if (!videoUrl?.trim()) {
      return NextResponse.json(
        { error: 'videoUrl wajib diisi — URL video publik (mis. dari Cloudflare R2) yang domainnya sudah diverifikasi di TikTok Developer Portal' },
        { status: 400 },
      )
    }

    // 1) Ambil creator info → validasi privacy yang diizinkan akun/app
    const ci = await tiktokPost(TIKTOK_ENDPOINTS.creatorInfo, conn.access_token, {})
    if (tiktokHasError(ci.json)) {
      return NextResponse.json({ error: ci.json.error.message ?? 'Gagal validasi creator info', raw: ci.json.error }, { status: 400 })
    }
    const allowed: string[] = ci.json?.data?.privacy_level_options ?? []
    const finalPrivacy = allowed.includes(privacyLevel) ? privacyLevel : (allowed[0] ?? 'SELF_ONLY')

    // Branded content TIDAK boleh private → matikan toggle bila SELF_ONLY
    const isSelfOnly  = finalPrivacy === 'SELF_ONLY'
    const brandContent = isSelfOnly ? false : brandContentToggle
    const brandOrganic = isSelfOnly ? false : brandOrganicToggle

    // 2) Init Direct Post
    const initBody = {
      post_info: {
        title:                    (title ?? '').slice(0, 2200),
        privacy_level:            finalPrivacy,
        disable_comment:          disableComment,
        disable_duet:             disableDuet,
        disable_stitch:           disableStitch,
        video_cover_timestamp_ms: coverTimestampMs,
        brand_content_toggle:     brandContent,
        brand_organic_toggle:     brandOrganic,
      },
      source_info: {
        source:    'PULL_FROM_URL',
        video_url: videoUrl,
      },
    }

    const { json } = await tiktokPost(TIKTOK_ENDPOINTS.videoInit, conn.access_token, initBody)
    if (tiktokHasError(json)) {
      return NextResponse.json({ error: json.error.message ?? 'Gagal init publish', raw: json.error }, { status: 400 })
    }

    // (Opsional) sambungkan ke logToolUsage milikmu di sini untuk tracking COGS
    // await logToolUsage({ userId: user.id, toolId: 'tiktok-publish', meta: { publishId: json?.data?.publish_id } })

    return NextResponse.json({
      success:          true,
      publishId:        json?.data?.publish_id,
      privacyUsed:      finalPrivacy,
      privacyRequested: privacyLevel,
      note: finalPrivacy !== privacyLevel
        ? 'Privacy disesuaikan dengan batasan akun/app TikTok (mis. app belum di-audit → dipaksa SELF_ONLY).'
        : undefined,
      elapsedMs: Date.now() - t0,
    })

  } catch (err: any) {
    console.error('[tiktok-publish] error:', err?.message ?? err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}