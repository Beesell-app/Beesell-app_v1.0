// apps/web-app/app/api/health/route.ts
// Health check — dipakai Vercel, uptime monitor, dan load balancer
import { db }           from '@/lib/db'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  // Cek koneksi DB
  let dbOk    = false
  let dbError = ''
  try {
    await db.$queryRaw`SELECT 1`
    dbOk = true
  } catch (e: any) {
    dbError = e.message
  }

  const elapsed = Date.now() - start
  const status  = dbOk ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    latencyMs: elapsed,
    services: {
      database: dbOk ? 'ok' : `error: ${dbError}`,
    },
    env:    process.env.NEXT_PUBLIC_ENV ?? 'unknown',
    region: process.env.VERCEL_REGION   ?? 'local',
  }, {
    status: dbOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}