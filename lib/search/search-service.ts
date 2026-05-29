// apps/web-app/lib/search/search-service.ts
// ── Full-text search service ──────────────────────────────────
// Uses PostgreSQL search_contents() function via Prisma $queryRaw
import { db } from '@/lib/db'

export interface SearchParams {
  tenant_id:  string
  q:         string
  limit?:    number
  offset?:   number
  type?:     string | null
  status?:   string | null
  platform?: string | null
}

export interface SearchResultItem {
  id:               string
  type:             string
  status:           string
  title:            string | null
  caption_text:      string | null
  media_url:         string | null
  imageThumbUrl:    string | null
  primary_platform:  string | null
  isStarred:        boolean
  tags:             string[]
  hashtags:         string[]
  folderId:         string | null
  created_at:        Date
  updated_at:        Date
  rank:             number
  matchType:        'fts' | 'trigram'
  highlightCaption: string | null
}

export interface SearchResult {
  items:     SearchResultItem[]
  total:     number
  query:     string
  hasMore:   boolean
  matchType: 'fts' | 'trigram' | 'none'
}

// ── Sanitize: strip SQL special chars, limit length ──────────
function sanitizeQuery(q: string): string {
  return q
    .trim()
    .slice(0, 100)                // max 100 chars
    .replace(/[<>'"\\]/g, ' ')   // strip potential injection chars
    .replace(/\s+/g, ' ')        // normalize whitespace
    .trim()
}

// ── Main search function ──────────────────────────────────────
export async function searchContents(params: SearchParams): Promise<SearchResult> {
  const { tenant_id, q, limit = 20, offset = 0 } = params
  const type     = params.type     ?? null
  const status   = params.status   ?? null
  const platform = params.platform ?? null

  const clean = sanitizeQuery(q)
  if (!clean) {
    return { items: [], total: 0, query: '', hasMore: false, matchType: 'none' }
  }

  // Run search + count in parallel
  const [rows, countResult] = await Promise.all([
    // Search results via Postgres function
    db.$queryRaw<SearchResultItem[]>`
      SELECT * FROM search_contents(
        ${tenant_id}::uuid,
        ${clean}::text,
        ${limit + 1}::int,   -- fetch +1 to detect hasMore
        ${offset}::int,
        ${type}::text,
        ${status}::text,
        ${platform}::text
      )
    `,

    // Total count via Postgres function
    db.$queryRaw<[{ count: bigint }]>`
      SELECT count_search_contents(
        ${tenant_id}::uuid,
        ${clean}::text,
        ${type}::text,
        ${status}::text,
        ${platform}::text
      ) AS count
    `,
  ])

  const total    = Number(countResult[0]?.count ?? 0)
  const hasMore  = rows.length > limit
  const items    = hasMore ? rows.slice(0, limit) : rows
  const matchType = items[0]?.matchType ?? 'none'

  return {
    items:    normalizeRows(items),
    total,
    query:    clean,
    hasMore,
    matchType,
  }
}

// ── Normalize raw Prisma query result ─────────────────────────
function normalizeRows(rows: any[]): SearchResultItem[] {
  return rows.map(r => ({
    id:               r.id,
    type:             r.type,
    status:           r.status,
    title:            r.title ?? null,
    caption_text:      r.caption_text ?? null,
    media_url:         r.media_url ?? null,
    imageThumbUrl:    r.imageThumbUrl ?? null,
    primary_platform:  r.primary_platform ?? null,
    isStarred:        Boolean(r.isStarred),
    tags:             r.tags ?? [],
    hashtags:         r.hashtags ?? [],
    folderId:         r.folderId ?? null,
    created_at:        new Date(r.created_at),
    updated_at:        new Date(r.updated_at),
    rank:             Number(r.rank ?? 0),
    matchType:        (r.matchType as 'fts' | 'trigram') ?? 'fts',
    highlightCaption: r.highlightCaption ?? null,
  }))
}

// ── Autocomplete suggestions (title prefix match) ─────────────
export async function searchSuggestions(
  tenant_id: string,
  q:        string,
  limit:    number = 5,
): Promise<Array<{ id: string; title: string; type: string }>> {
  const clean = sanitizeQuery(q)
  if (!clean || clean.length < 2) return []

  const rows = await db.$queryRaw<Array<{ id: string; title: string; type: string }>>`
    SELECT id, COALESCE(title, LEFT("caption_text", 60)) AS title, type
    FROM "contents"
    WHERE
      "tenant_id"   = ${tenant_id}::uuid
      AND "deleted_at" IS NULL
      AND (
        title ILIKE ${clean + '%'}
        OR "caption_text" ILIKE ${'%' + clean + '%'}
      )
    ORDER BY "created_at" DESC
    LIMIT ${limit}
  `

  return rows
}