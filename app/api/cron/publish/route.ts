// apps/web-app/app/api/cron/publish/route.ts
// ── Vercel Cron: publish scheduled posts ─────────────────────
// Triggered every 1 minute by Vercel Cron (vercel.json).
// On Vercel Hobby: min 1/day. On Pro: 1/minute supported.
//
// vercel.json:
// {
//   "crons": [
//     { "path": "/api/cron/publish", "schedule": "* * * * *" }
//   ]
// }
//
// Security: Vercel adds Authorization: Bearer $CRON_SECRET automatically.
// Set CRON_SECRET in Vercel env vars (same secret used for other crons).
import { NextResponse }         from 'next/server'
import { runPublishEngine } from '@/lib/publish/publisher'

export const runtime    = 'nodejs'
export const dynamic    = 'force-dynamic'
export const maxDuration = 60    // max 60s execution (Vercel limit)

export async function GET(req: Request) {
  // ── Security: verify cron secret ──────────────────────────
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[cron/publish] CRON_SECRET not configured')
    return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 503 })
  }

  // Allow both "Bearer token" and plain token (for Vercel's automatic header)
  const token = authHeader?.replace('Bearer ', '') ?? ''
  if (token !== cronSecret) {
    console.warn('[cron/publish] Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dryRun = searchParams.get('dry_run') === 'true'
  const limit  = parseInt(searchParams.get('limit') ?? '50')

  const runStart = Date.now()
  console.log(`[cron/publish] Starting${dryRun ? ' (DRY RUN)' : ''} at ${new Date().toISOString()}`)

  try {
    const result = await runPublishEngine({
      dryRun,
      limit,
    })

    return NextResponse.json({
      ok:        true,
      dryRun,
      timestamp: new Date().toISOString(),
      ...result,
    })

  } catch (err: any) {
    console.error('[cron/publish] Engine error:', err)
    return NextResponse.json({
      ok:        false,
      error:     err.message ?? 'Internal error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}