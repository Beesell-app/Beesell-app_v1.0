// apps/web-app/app/api/invite-codes/route.ts
// GET /api/invite-codes?code=ABC123  → validate code (public, no auth)
// POST /api/invite-codes/redeem      → redeem on registration
import { NextResponse }  from 'next/server'
import { z }             from 'zod'
import { db }            from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── GET: validate code (called before registration) ──────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')?.trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ valid: false, error: 'Kode invite diperlukan' })
  }

  const result = await db.$queryRaw<Array<{
    id:          string
    code:        string
    label:       string | null
    max_uses:    number
    used_count:  number
    expires_at:  Date | null
    is_active:   boolean
    plan_granted: string | null
  }>>`
    SELECT id, code, label, max_uses, used_count, expires_at, is_active, plan_granted
    FROM invite_codes
    WHERE UPPER(code) = ${code}
    LIMIT 1
  `

  const inv = result[0]

  if (!inv) {
    return NextResponse.json({ valid: false, error: 'Kode invite tidak ditemukan' })
  }
  if (!inv.is_active) {
    return NextResponse.json({ valid: false, error: 'Kode invite tidak aktif' })
  }
  if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Kode invite sudah kedaluwarsa' })
  }
  if (inv.used_count >= inv.max_uses) {
    return NextResponse.json({ valid: false, error: 'Kode invite sudah penuh' })
  }

  return NextResponse.json({
    valid:       true,
    code:        inv.code,
    label:       inv.label,
    planGranted: inv.plan_granted ?? 'basic',
    spotsLeft:   inv.max_uses - inv.used_count,
  })
}