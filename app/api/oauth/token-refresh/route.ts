// apps/web-app/app/api/oauth/token-refresh/route.ts
// GET /api/oauth/token-refresh  — refresh expiring tokens
//
// Triggered by:
//   1. Vercel Cron (daily) — set in vercel.json
//   2. Manual trigger from admin panel
//
// Security: CRON_SECRET header required
import { NextResponse } from 'next/server'
import { refreshExpiringSoonTokens } from '@/lib/platform/token-refresh-job'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'
export const maxDuration = 60  // max 60 sec (Vercel Hobby limit)

export async function GET(req: Request) {
  // ── Security: verify cron secret ──────────────────────────
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[token-refresh] CRON_SECRET not set')
    return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dryRun = searchParams.get('dry_run') === 'true'

  console.log(`[token-refresh] Starting${dryRun ? ' (DRY RUN)' : ''}...`)

  try {
    const startAt = Date.now()
    const result  = await refreshExpiringSoonTokens({ dryRun, thresholdDays: 7 })
    const elapsed = Date.now() - startAt

    console.log(
      `[token-refresh] Done in ${elapsed}ms — ` +
      `checked: ${result.checked}, refreshed: ${result.refreshed}, failed: ${result.failed}`,
    )

    return NextResponse.json({
      success:   true,
      dryRun,
      elapsed,
      ...result,
    })

  } catch (err: any) {
    console.error('[token-refresh] Job error:', err)
    return NextResponse.json({ error: 'INTERNAL', message: err.message }, { status: 500 })
  }
}

// ── POST: refresh single connection ─────────────────────────
import { refreshConnectionToken } from '@/lib/platform/token-refresh-job'
import { createClient }           from '@/lib/supabase/server'
import { db }                     from '@/lib/db'

export async function POST(req: Request) {
  // Manual refresh for a specific connection (from settings UI)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { tenant_id: true } })
  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { connectionId } = await req.json()
  if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })

  // Verify connection belongs to this tenant
  const conn = await db.platformConnection.findFirst({
    where: { id: connectionId, tenant_id: dbUser.tenant_id },
  })
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = await refreshConnectionToken(connectionId)
  return NextResponse.json({ success: result.status === 'refreshed', result })
}