// app/api/studio/video/tiktok/auth/callback/route.ts
// ══════════════════════════════════════════════════════════════
// TIKTOK OAUTH — CALLBACK
// GET ?code=&state= → verifikasi state → tukar code → simpan koneksi
// → redirect balik ke /studio/video/tiktok?tiktok=<status>
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken, saveConnection } from '@/lib/studio/tiktok/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REDIRECT_TO = '/studio/video/tiktok'

export async function GET(req: Request) {
  const url   = new URL(req.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const err   = url.searchParams.get('error')
  const cookieState = req.headers.get('cookie')?.match(/tiktok_oauth_state=([^;]+)/)?.[1]

  const back = (status: string) =>
    NextResponse.redirect(new URL(`${REDIRECT_TO}?tiktok=${status}`, url.origin))

  // User menolak / error dari TikTok
  if (err)   return back('denied')
  if (!code) return back('error')

  // Proteksi CSRF
  if (!state || state !== cookieState) return back('state_mismatch')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return back('unauthorized')

  try {
    const token = await exchangeCodeForToken(code)
    await saveConnection(supabase, user.id, token)
    const res = back('connected')
    res.cookies.delete('tiktok_oauth_state')
    return res
  } catch (e: any) {
    console.error('[tiktok-oauth] callback error:', e?.message ?? e)
    return back('error')
  }
}