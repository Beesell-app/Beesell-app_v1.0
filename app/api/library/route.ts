// apps/web-app/app/api/library/route.ts
// GET /api/library?cursor=...&type=...&status=...&platform=...&q=...&sort=...
// ── Replaced LIKE search with tsvector FTS ────────────────────
// When q present: routes to search_contents() Postgres function (ranked)
// When no q: standard cursor pagination (created_at, id composite)
import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { searchContents } from '@/lib/search/search-service'
import type { Prisma }    from '@prisma/client'

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

const PAGE_SIZE = 20

export async function GET(req: Request) {
  try {
    const me = await authenticate()
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)

    const q        = searchParams.get('q')        ?? ''
    const cursor   = searchParams.get('cursor')
    const type     = searchParams.get('type')     ?? 'all'
    const status   = searchParams.get('status')   ?? 'all'
    const platform = searchParams.get('platform') ?? 'all'
    const sort     = searchParams.get('sort')     ?? 'newest'
    const starred  = searchParams.get('starred')  === 'true'
    const folderId = searchParams.get('folderId') ?? null

    // ── SEARCH PATH: use tsvector via search_contents() ───────
    if (q.trim().length >= 1) {
      const offset = cursor ? parseInt(cursor, 10) : 0

      const result = await searchContents({
        tenant_id: me.tenant_id,
        q,
        limit:    PAGE_SIZE,
        offset,
        type:     type !== 'all' ? type : null,
        status:   status !== 'all' ? status : null,
        platform: platform !== 'all' ? platform : null,
      })

      const nextOffset    = offset + PAGE_SIZE
      const nextCursorVal = result.hasMore ? String(nextOffset) : null

      return NextResponse.json({
        success: true,
        data: {
          items: result.items.map(item => ({
            id:               item.id,
            type:             item.type,
            status:           item.status,
            title:            item.title,
            caption_text:      item.caption_text,
            media_url:         item.media_url,
            imageThumbUrl:    item.imageThumbUrl,
            primary_platform:  item.primary_platform,
            isStarred:        item.isStarred,
            tags:             item.tags,
            folderId:         item.folderId,
            created_at:        item.created_at,
            updated_at:        item.updated_at,
            // Search-specific extras
            rank:             item.rank,
            matchType:        item.matchType,
            highlightCaption: item.highlightCaption,
          })),
          nextCursor: nextCursorVal,
          total:      result.total,
          hasMore:    result.hasMore,
          // Let client know FTS is powering this
          searchMeta: {
            query:     result.query,
            matchType: result.matchType,
          },
        },
      })
    }

    // ── BROWSE PATH: standard cursor pagination ───────────────
    // Build where clause
    const where: Prisma.ContentWhereInput = {
      tenant_id:  me.tenant_id,
      deleted_at: null,
    }

    if (type !== 'all')     where.type            = type as any
    if (status !== 'all')   where.status          = status as any
    if (platform !== 'all') where.primary_platform = platform as any
    if (starred)            where.isStarred        = true
    if (folderId)           where.folderId         = folderId

    // Cursor decode (created_at_id composite)
    let cursorWhere: Prisma.ContentWhereInput | undefined
    if (cursor) {
      const [ts, id] = cursor.split('_')
      if (ts && id) {
        const cursorDate = new Date(ts)
        if (!isNaN(cursorDate.getTime())) {
          cursorWhere = {
            OR: [
              { created_at: { lt: cursorDate } },
              { created_at: { equals: cursorDate }, id: { gt: id } },
            ],
          }
        }
      }
    }

    // Sort
    const orderBy: Prisma.ContentOrderByWithRelationInput[] =
      sort === 'oldest'  ? [{ created_at: 'asc'  }, { id: 'asc' }]  :
      sort === 'a-z'     ? [{ title:     'asc'  }, { created_at: 'desc' }] :
      /* newest */         [{ created_at: 'desc' }, { id: 'asc' }]

    // Fetch (limit + 1 to detect hasMore)
    const [items, total] = await Promise.all([
      db.content.findMany({
        where:   cursorWhere ? { AND: [where, cursorWhere] } : where,
        orderBy,
        take:    PAGE_SIZE + 1,
        select: {
          id: true,
          platform: true,

          account_id: true,
          account_name: true,
          account_avatar: true,

          status: true,

          token_expires_at: true,
          token_scope: true,
          last_verified_at: true,

          error_message: true,

          created_at: true,
          updated_at: true,
        },
      }),
      db.content.count({ where }),
    ])

    const hasMore   = items.length > PAGE_SIZE
    const pageItems = hasMore ? items.slice(0, PAGE_SIZE) : items

    const lastItem  = pageItems[pageItems.length - 1]
    const nextCursor = hasMore && lastItem
      ? `${lastItem.created_at.toISOString()}_${lastItem.id}`
      : null

    return NextResponse.json({
      success: true,
      data: {
        items: pageItems.map(item => ({
          ...item,
          rank:             null,
          matchType:        null,
          highlightCaption: null,
        })),
        nextCursor,
        total,
        hasMore,
        searchMeta: null,
      },
    })

  } catch (err) {
    console.error('[GET /api/library]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}