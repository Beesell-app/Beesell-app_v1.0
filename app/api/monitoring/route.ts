// apps/web-app/app/api/monitoring/route.ts
// ── Sentry tunnel endpoint ────────────────────────────────────
// Proxies Sentry events through our domain to bypass ad-blockers.
// Configured via tunnelRoute: '/api/monitoring' in withSentryConfig.
// Next.js App Router compatible version of the tunnel handler.
import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const SENTRY_DSN    = process.env.NEXT_PUBLIC_SENTRY_DSN ?? ''
const SENTRY_HOST   = 'o*.ingest.sentry.io'
const SENTRY_INGEST = SENTRY_DSN
  ? `https://${new URL(SENTRY_DSN).hostname}`
  : 'https://sentry.io'

export async function POST(req: Request) {
  try {
    const body = await req.text()

    // Basic validation: must contain a Sentry envelope header
    if (!body.startsWith('{')) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    }

    // Extract project ID from envelope header (first line JSON)
    const firstLine = body.split('\n')[0]
    const envelope  = JSON.parse(firstLine)
    const dsn       = new URL(envelope.dsn ?? SENTRY_DSN)
    const projectId = dsn.pathname.slice(1)   // "/PROJECT_ID" → "PROJECT_ID"

    if (!projectId || !/^\d+$/.test(projectId)) {
      return NextResponse.json({ error: 'Invalid DSN' }, { status: 400 })
    }

    // Forward to Sentry ingest
    const sentryUrl = `https://${dsn.hostname}/api/${projectId}/envelope/`

    const sentryRes = await fetch(sentryUrl, {
      method:  'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/x-sentry-envelope',
        'User-Agent':   req.headers.get('user-agent') ?? 'BeeSell-Sentry-Tunnel',
      },
      body,
    })

    return new NextResponse(null, { status: sentryRes.status })

  } catch (err) {
    // Never return 500 for tunnel — Sentry will retry and spam
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}