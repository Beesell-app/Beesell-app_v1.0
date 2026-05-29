// apps/web-app/lib/content/content-service.ts
// ── Content Service ───────────────────────────────────────────
// Single source of truth untuk CRUD + status management
//
// Status lifecycle (state machine):
//   draft      → generating → ready → scheduled → published
//                              ↓
//                            failed, archived
//
// Valid transitions:
//   draft      → generating, archived, failed
//   generating → ready, failed, draft (kalau user cancel)
//   ready      → scheduled, archived, draft (kalau user edit)
//   scheduled  → published, ready (kalau user cancel jadwal)
//   published  → archived
//   failed     → draft (retry), archived
//   archived   → draft (restore)
// ─────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { PrismaClient, Prisma } from '@prisma/client'
import type { Content, ContentStatus, ContentType } from '@/lib/types/content'

// ── State machine: valid transitions ────────────────────────
const VALID_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft:      ['generating', 'archived', 'failed'],
  generating: ['ready', 'failed', 'draft'],
  ready:      ['scheduled', 'archived', 'draft'],
  scheduled:  ['published', 'ready'],
  published:  ['archived'],
  failed:     ['draft', 'archived'],
  archived:   ['draft'],
}

export class InvalidTransitionError extends Error {
  constructor(public from: ContentStatus, public to: ContentStatus) {
    super(`Invalid status transition: ${from} → ${to}`)
  }
}

export class ContentNotFoundError extends Error {
  constructor(public id: string) {
    super(`Content not found: ${id}`)
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access denied') { super(message) }
}

// ── Helper: validate transition ─────────────────────────────
function assertValidTransition(from: ContentStatus, to: ContentStatus) {
  if (from === to) return   // same-state allowed (idempotent)
  const allowed = VALID_TRANSITIONS[from] ?? []
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError(from, to)
  }
}

// ================================================================
// createDraft — saat user mulai form generate (belum submit)
// ================================================================
export async function createDraft(params: {
  tenant_id:  string
  userId:    string
  type:      ContentType
  title?:    string
  productUrl?: string
  productData?: Record<string, any>
  generationConfig?: Record<string, any>
  brandKitId?: string
}): Promise<Content> {
  return db.content.create({
    data: {
      tenant_id:         params.tenant_id,
      userId:           params.userId,
      type:             params.type as any,
      status:           'draft',
      title:            params.title,
      productUrl:       params.productUrl,
      productData:      params.productData      ?? {},
      generationConfig: params.generationConfig ?? {},
      brandKitId:       params.brandKitId,
      platforms:        [],
      captionVariants:  [],
      hashtags:         [],
      tags:             [],
    },
  }) as Promise<Content>
}

// ================================================================
// markGenerating — dipanggil saat AI generation mulai
// ================================================================
export async function markGenerating(params: {
  contentId: string
  tenant_id:  string
  userId?:   string
  aiJobId?:  string
}): Promise<Content> {
  const existing = await db.content.findFirst({
    where: { id: params.contentId, tenant_id: params.tenant_id, deleted_at: null },
  })

  if (!existing) throw new ContentNotFoundError(params.contentId)

  assertValidTransition(existing.status, 'generating')

  return db.content.update({
    where: { id: params.contentId },
    data:  {
      status:  'generating',
      aiJobId: params.aiJobId,
    },
  }) as Promise<Content>
}

// ================================================================
// markReady — generation selesai, output saved
// ================================================================
export async function markReady(params: {
  contentId:       string
  tenant_id:        string
  caption_text:     string
  captionVariants: Array<{
    text:           string
    platform?:      string
    tone?:          string
    language?:      string
    characterCount: number
    variantIndex:   number
  }>
  hashtags?:       string[]
  mediaUrl?:       string
  thumbnailUrl?:   string
  platforms?:      string[]
  primary_platform?: string
  aiProvider?:     string
  aiModel?:        string
  cost_usd?:        number
}): Promise<Content> {
  const existing = await db.content.findFirst({
    where: { id: params.contentId, tenant_id: params.tenant_id, deleted_at: null },
  })

  if (!existing) throw new ContentNotFoundError(params.contentId)

  // Bisa dari generating atau draft (kalau legacy/direct save)
  assertValidTransition(existing.status, 'ready')

  return db.content.update({
    where: { id: params.contentId },
    data: {
      status:          'ready',
      caption_text:     params.caption_text,
      captionVariants: params.captionVariants as any,
      hashtags:        params.hashtags ?? [],
      mediaUrl:        params.mediaUrl,
      thumbnailUrl:    params.thumbnailUrl,
      platforms:       (params.platforms ?? []) as any,
      primary_platform: params.primary_platform as any,
      aiProvider:      params.aiProvider,
      aiModel:         params.aiModel,
      cost_usd:         params.cost_usd,
    },
  }) as Promise<Content>
}

// ================================================================
// markFailed — generation error
// ================================================================
export async function markFailed(params: {
  contentId:    string
  tenant_id:     string
  userId?:      string
  error_message?: string
}): Promise<Content> {
  const existing = await db.content.findFirst({
    where: { id: params.contentId, tenant_id: params.tenant_id, deleted_at: null },
  })

  if (!existing) throw new ContentNotFoundError(params.contentId)

  // Failed bisa dari state apapun (untuk flexibility error handling)
  return db.content.update({
    where: { id: params.contentId },
    data: {
      status:          'failed',
      generationConfig: {
        ...((existing.generationConfig as any) ?? {}),
        error_message: params.error_message,
        failedAt: new Date().toISOString(),
      },
    },
  }) as Promise<Content>
}

// ================================================================
// updateContent — edit caption setelah ready
// Status otomatis tetap ready (user bisa edit berkali-kali)
// Kalau dari published, balik ke ready (need re-publish)
// ================================================================
export async function updateContent(params: {
  contentId:       string
  tenant_id:        string
  userId:          string     // untuk audit
  caption_text?:    string
  hashtags?:       string[]
  title?:          string
  tags?:           string[]
  folderId?:       string | null
  isStarred?:      boolean
}): Promise<Content> {
  const existing = await db.content.findFirst({
    where: { id: params.contentId, tenant_id: params.tenant_id, deleted_at: null },
  })

  if (!existing) throw new ContentNotFoundError(params.contentId)

  // Dari published → ready, karena konten edited belum re-publish
  const newStatus: ContentStatus = existing.status === 'published' ? 'ready' : existing.status

  return db.content.update({
    where: { id: params.contentId },
    data: {
      ...(params.caption_text !== undefined && { caption_text: params.caption_text }),
      ...(params.hashtags    !== undefined && { hashtags:    params.hashtags }),
      ...(params.title       !== undefined && { title:       params.title }),
      ...(params.tags        !== undefined && { tags:        params.tags }),
      ...(params.folderId    !== undefined && { folderId:    params.folderId }),
      ...(params.isStarred   !== undefined && { isStarred:   params.isStarred }),
      ...(existing.status === 'published' ? { status: 'ready' } : {}),
    },
  }) as Promise<Content>
}

// ================================================================
// archiveContent — soft delete (status = archived, deleted_at=null)
// ================================================================
export async function archiveContent(
  contentId: string,
  tenant_id:  string,
): Promise<Content> {
  const existing = await db.content.findFirst({
    where: { id: contentId, tenant_id, deleted_at: null },
  })

  if (!existing) throw new ContentNotFoundError(contentId)
  assertValidTransition(existing.status, 'archived')

  return db.content.update({
    where: { id: contentId },
    data:  { status: 'archived' },
  }) as Promise<Content>
}

// ================================================================
// restoreContent — dari archived kembali ke draft
// ================================================================
export async function restoreContent(
  contentId: string,
  tenant_id:  string,
): Promise<Content> {
  const existing = await db.content.findFirst({
    where: { id: contentId, tenant_id, deleted_at: null },
  })

  if (!existing) throw new ContentNotFoundError(contentId)
  assertValidTransition(existing.status, 'draft')

  return db.content.update({
    where: { id: contentId },
    data:  { status: 'draft' },
  }) as Promise<Content>
}

// ================================================================
// deleteContent — hard soft-delete (set deleted_at)
// Tidak menghapus row supaya billing record tetap ada
// ================================================================
export async function deleteContent(
  contentId: string,
  tenant_id: string,
): Promise<Content> {
  // Cari content aktif (belum di-soft-delete)
  const existing = await db.content.findFirst({
    where: {
      id: contentId,
      tenant_id,
      deleted_at: null,
    },
  })

  // Kalau tidak ditemukan
  if (!existing) {
    throw new ContentNotFoundError(contentId)
  }

  // Soft delete
  return db.content.update({
    where: {
      id: contentId,
    },

    data: {
      deleted_at: new Date(),
    },
  }) as Promise<Content>
}

// ================================================================
// listContents — paginated list dengan filter
// ================================================================
export async function listContents(params: {
  tenant_id:    string
  status?:     ContentStatus | ContentStatus[]
  type?:       ContentType
  folderId?:   string | null
  search?:     string
  isStarred?:  boolean
  limit?:      number
  cursor?:     string   // ID content terakhir untuk infinite scroll
  orderBy?:    'created' | 'updated'
}): Promise<{ items: Content[]; nextCursor: string | null; total: number }> {
  const limit = Math.min(params.limit ?? 20, 100)

  const where: Prisma.ContentWhereInput = {
    tenant_id:  params.tenant_id,
    deleted_at: null,
    ...(params.status && {
      status: Array.isArray(params.status) ? { in: params.status } : params.status,
    }),
    ...(params.type      && { type: params.type }),
    ...(params.folderId !== undefined && {
      folderId: params.folderId,
    }),
    ...(params.isStarred !== undefined && { isStarred: params.isStarred }),
    ...(params.search && {
      OR: [
        { title:       { contains: params.search, mode: 'insensitive' } },
        { caption_text: { contains: params.search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderByField = params.orderBy === 'updated' ? 'updated_at' : 'created_at'

  const [items, total] = await Promise.all([
    db.content.findMany({
      where,
      orderBy: [{ [orderByField]: 'desc' }, { id: 'desc' }],
      take:    limit + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
    }) as Promise<Content[]>,
    db.content.count({ where }),
  ])

  // Trick: ambil N+1, kalau ada yang ke-N+1 berarti ada halaman berikutnya
  const hasMore    = items.length > limit
  const trimmed    = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null

  return { items: trimmed, nextCursor, total }
}

// ================================================================
// getContent — get single content by ID (with tenant check)
// ================================================================
export async function getContent(
  contentId: string,
  tenant_id:  string,
): Promise<Content | null> {
  return db.content.findFirst({
    where: { id: contentId, tenant_id, deleted_at: null },
  }) as Promise<Content | null>
}