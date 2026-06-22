// app/api/studio/video/tiktok/auth/route.ts
// ══════════════════════════════════════════════════════════════
// TIKTOK OAUTH — START
// GET → redirect user ke halaman authorize TikTok (scope video.publish)
// Menyimpan `state` di cookie httpOnly untuk proteksi CSRF.
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { buildAuthorizeUrl } from '@/lib/studio/tiktok/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = randomBytes(16).toString('hex')

  let authorizeUrl: string
  try {
    authorizeUrl = buildAuthorizeUrl(state)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Konfigurasi TikTok belum lengkap (cek ENV TIKTOK_CLIENT_KEY/SECRET)' },
      { status: 500 },
    )
  }

  const res = NextResponse.redirect(authorizeUrl)
  res.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   600, // 10 menit
  })
  return res
}