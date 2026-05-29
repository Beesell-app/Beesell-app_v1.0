// apps/web-app/app/api/search/route.ts
// GET /api/search?q=tas+wanita&type=caption&limit=20&offset=0
// Dedicated full-text search endpoint (separate from /api/library for clarity)
import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { searchContents, searchSuggestions } from '@/lib/search/search-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function authenticate() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: { tenant_id: true },
  })
  return dbUser ? { userId: user.id, tenant_id: dbUser.tenant_id } : null
}

export async function GET(req: Request) {
  try {
    const me = await authenticate()
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)

    const q        = searchParams.get('q')        ?? ''
    const type     = searchParams.get('type')     || null
    const status   = searchParams.get('status')   || null
    const platform = searchParams.get('platform') || null
    const limit    = Math.min(Number(searchParams.get('limit')  ?? '20'), 50)
    const offset   = Math.max(Number(searchParams.get('offset') ?? '0'),   0)
    const suggest  = searchParams.get('suggest') === 'true'

    // Suggestions mode (autocomplete)
    if (suggest) {
      const suggestions = await searchSuggestions(me.tenant_id, q, 6)
      return NextResponse.json({ success: true, suggestions })
    }

    // Full search
    const result = await searchContents({
      tenant_id: me.tenant_id,
      q,
      limit,
      offset,
      type:     type !== 'all' ? type : null,
      status:   status !== 'all' ? status : null,
      platform: platform !== 'all' ? platform : null,
    })

    return NextResponse.json({
      success:   true,
      query:     result.query,
      matchType: result.matchType,
      total:     result.total,
      hasMore:   result.hasMore,
      items:     result.items,
    }, {
      headers: {
        // No cache for search results (personalized)
        'Cache-Control': 'no-store',
      },
    })

  } catch (err) {
    console.error('[GET /api/search]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}