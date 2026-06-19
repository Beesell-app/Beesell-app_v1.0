// app/api/dashboard/summary/route.ts
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Forward ke /api/dashboard
  const url = new URL('/api/dashboard', req.url)
  const res = await fetch(url, { headers: req.headers })
  return new Response(res.body, { status: res.status, headers: res.headers })
}