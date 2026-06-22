// app/api/studio/video/tiktok/connection/route.ts
// ══════════════════════════════════════════════════════════════
// TIKTOK CONNECTION STATUS
// GET    → { connected, username, scope, expiresAt, needReauth }
// DELETE → putuskan koneksi (hapus row)
// Dipakai UI untuk nampilin tombol "Hubungkan TikTok" vs "Terhubung".
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('tiktok_connections')
    .select('open_id, creator_username, scope, expires_at, refresh_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return NextResponse.json({ connected: false })

  const refreshValid = new Date(data.refresh_expires_at).getTime() > Date.now()
  return NextResponse.json({
    connected:  refreshValid,
    username:   data.creator_username ?? null,
    scope:      data.scope,
    expiresAt:  data.expires_at,
    needReauth: !refreshValid, // refresh token kadaluarsa (>365 hari) → connect ulang
  })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('tiktok_connections')
    .delete()
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ disconnected: true })
}