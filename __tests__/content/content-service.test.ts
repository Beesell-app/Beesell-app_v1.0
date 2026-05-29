// apps/web-app/__tests__/content/content-service.test.ts
// ── Content service: state machine + CRUD ──────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, makeMockContent, resetPrismaMock } from '../_helpers/mock-prisma'

import {
  createDraft,
  markGenerating,
  markReady,
  markFailed,
  updateContent,
  archiveContent,
  restoreContent,
  deleteContent,
  getContent,
  InvalidTransitionError,
  ContentNotFoundError,
} from '@/lib/content/content-service'

const TENANT_ID = 'tenant-test-1'
const USER_ID   = 'user-test-1'
const CONTENT_ID = 'content-test-1'

beforeEach(() => {
  resetPrismaMock()
})

// ══════════════════════════════════════════════════════════════
// CREATE DRAFT
// ══════════════════════════════════════════════════════════════
describe('createDraft', () => {

  it('creates content with status=draft', async () => {
    const draft = makeMockContent({ status: 'draft', type: 'caption' })
    prismaMock.content.create.mockResolvedValue(draft as any)

    const result = await createDraft({
      tenant_id: TENANT_ID,
      userId:   USER_ID,
      type:     'caption',
    })

    expect(result.status).toBe('draft')
    expect(prismaMock.content.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenant_id: TENANT_ID,
          userId:   USER_ID,
          status:   'draft',
          type:     'caption',
        }),
      }),
    )
  })

  it('accepts optional fields', async () => {
    prismaMock.content.create.mockResolvedValue(makeMockContent() as any)

    await createDraft({
      tenant_id: TENANT_ID,
      userId:   USER_ID,
      type:     'caption',
      title:    'My Draft',
      productData: { name: 'Tas', price: 'Rp 100k' },
      generationConfig: { tone: 'casual', platform: 'instagram' },
    })

    expect(prismaMock.content.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'My Draft',
          productData: { name: 'Tas', price: 'Rp 100k' },
        }),
      }),
    )
  })
})

// ══════════════════════════════════════════════════════════════
// STATE TRANSITIONS
// ══════════════════════════════════════════════════════════════
describe('State transitions', () => {

  it('draft → generating allowed', async () => {
    const draft = makeMockContent({ status: 'draft' })
    prismaMock.content.findFirst.mockResolvedValue(draft as any)
    prismaMock.content.update.mockResolvedValue({ ...draft, status: 'generating' } as any)

    const result = await markGenerating(CONTENT_ID, TENANT_ID)
    expect(result.status).toBe('generating')
  })

  it('generating → ready allowed', async () => {
    const gen = makeMockContent({ status: 'generating' })
    prismaMock.content.findFirst.mockResolvedValue(gen as any)
    prismaMock.content.update.mockResolvedValue({ ...gen, status: 'ready' } as any)

    const result = await markReady({
      contentId:       CONTENT_ID,
      tenant_id:        TENANT_ID,
      caption_text:     'Test caption',
      hashtags:        ['tag1', 'tag2'],
      captionVariants: [{ caption: 'x', hashtags: [], cta: '', variantIndex: 0 }] as any,
    })
    expect(result.status).toBe('ready')
  })

  it('generating → failed allowed', async () => {
    const gen = makeMockContent({ status: 'generating' })
    prismaMock.content.findFirst.mockResolvedValue(gen as any)
    prismaMock.content.update.mockResolvedValue({ ...gen, status: 'failed' } as any)

    const result = await markFailed({
      contentId:    CONTENT_ID,
      tenant_id:     TENANT_ID,
      error_message: 'Timeout error',
    })
    expect(result.status).toBe('failed')
  })

  it('throws InvalidTransitionError: draft → ready (skip generating)', async () => {
    const draft = makeMockContent({ status: 'draft' })
    prismaMock.content.findFirst.mockResolvedValue(draft as any)

    await expect(
      markReady({
        contentId:       CONTENT_ID,
        tenant_id:        TENANT_ID,
        caption_text:     'x',
        hashtags:        [],
        captionVariants: [],
      }),
    ).rejects.toThrow(InvalidTransitionError)
  })

  it('throws InvalidTransitionError: ready → generating', async () => {
    const ready = makeMockContent({ status: 'ready' })
    prismaMock.content.findFirst.mockResolvedValue(ready as any)

    await expect(markGenerating(CONTENT_ID, TENANT_ID)).rejects.toThrow(InvalidTransitionError)
  })

  it('throws ContentNotFoundError when content does not exist', async () => {
    prismaMock.content.findFirst.mockResolvedValue(null)

    await expect(markGenerating(CONTENT_ID, TENANT_ID)).rejects.toThrow(ContentNotFoundError)
  })
})

// ══════════════════════════════════════════════════════════════
// UPDATE CONTENT
// ══════════════════════════════════════════════════════════════
describe('updateContent', () => {

  it('updates caption text and hashtags', async () => {
    const existing = makeMockContent({ status: 'ready' })
    prismaMock.content.findFirst.mockResolvedValue(existing as any)
    prismaMock.content.update.mockResolvedValue({
      ...existing,
      caption_text: 'Updated caption',
      hashtags: ['new1', 'new2'],
    } as any)

    const result = await updateContent({
      contentId:   CONTENT_ID,
      tenant_id:    TENANT_ID,
      userId:      USER_ID,
      caption_text: 'Updated caption',
      hashtags:    ['new1', 'new2'],
    })

    expect(result.caption_text).toBe('Updated caption')
    expect(result.hashtags).toEqual(['new1', 'new2'])
  })

  it('downgrades published → ready on edit', async () => {
    const published = makeMockContent({ status: 'published' })
    prismaMock.content.findFirst.mockResolvedValue(published as any)
    prismaMock.content.update.mockResolvedValue({ ...published, status: 'ready' } as any)

    await updateContent({
      contentId:   CONTENT_ID,
      tenant_id:    TENANT_ID,
      userId:      USER_ID,
      caption_text: 'edited',
    })

    expect(prismaMock.content.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ready' }),
      }),
    )
  })

  it('keeps existing status if not published', async () => {
    const ready = makeMockContent({ status: 'ready' })
    prismaMock.content.findFirst.mockResolvedValue(ready as any)
    prismaMock.content.update.mockResolvedValue(ready as any)

    await updateContent({
      contentId:   CONTENT_ID,
      tenant_id:    TENANT_ID,
      userId:      USER_ID,
      caption_text: 'edited',
    })

    // Status should not be forced to ready (already is ready)
    const updateCall = prismaMock.content.update.mock.calls[0]?.[0]
    expect(updateCall?.data?.status).toBeUndefined()
  })

  it('throws ContentNotFoundError when content missing', async () => {
    prismaMock.content.findFirst.mockResolvedValue(null)

    await expect(
      updateContent({
        contentId:   CONTENT_ID,
        tenant_id:    TENANT_ID,
        userId:      USER_ID,
        caption_text: 'x',
      }),
    ).rejects.toThrow(ContentNotFoundError)
  })
})

// ══════════════════════════════════════════════════════════════
// ARCHIVE / RESTORE / DELETE
// ══════════════════════════════════════════════════════════════
describe('Archive flow', () => {

  it('archives content', async () => {
    const ready = makeMockContent({ status: 'ready' })
    prismaMock.content.findFirst.mockResolvedValue(ready as any)
    prismaMock.content.update.mockResolvedValue({ ...ready, status: 'archived' } as any)

    const result = await archiveContent(CONTENT_ID, TENANT_ID)
    expect(result.status).toBe('archived')
  })

  it('restores archived content to ready', async () => {
    const archived = makeMockContent({ status: 'archived' })
    prismaMock.content.findFirst.mockResolvedValue(archived as any)
    prismaMock.content.update.mockResolvedValue({ ...archived, status: 'ready' } as any)

    const result = await restoreContent(CONTENT_ID, TENANT_ID)
    expect(result.status).toBe('ready')
  })

  it('archive throws on missing content', async () => {
    prismaMock.content.findFirst.mockResolvedValue(null)

    await expect(archiveContent(CONTENT_ID, TENANT_ID)).rejects.toThrow(ContentNotFoundError)
  })
})

describe('Soft delete', () => {

  it('sets deleted_at timestamp', async () => {
    const ready = makeMockContent({ status: 'ready' })
    prismaMock.content.findFirst.mockResolvedValue(ready as any)
    prismaMock.content.update.mockResolvedValue({ ...ready, deleted_at: new Date() } as any)

    await deleteContent(CONTENT_ID, TENANT_ID)

    expect(prismaMock.content.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deleted_at: expect.any(Date),
        }),
      }),
    )
  })

  it('throws on already-deleted content', async () => {
    prismaMock.content.findFirst.mockResolvedValue(null)  // findFirst excludes deleted_at

    await expect(deleteContent(CONTENT_ID, TENANT_ID)).rejects.toThrow(ContentNotFoundError)
  })
})

// ══════════════════════════════════════════════════════════════
// GET CONTENT
// ══════════════════════════════════════════════════════════════
describe('getContent', () => {

  it('returns content when found', async () => {
    const content = makeMockContent()
    prismaMock.content.findFirst.mockResolvedValue(content as any)

    const result = await getContent(CONTENT_ID, TENANT_ID)
    expect(result).toEqual(content)
  })

  it('returns null when not found', async () => {
    prismaMock.content.findFirst.mockResolvedValue(null)

    const result = await getContent(CONTENT_ID, TENANT_ID)
    expect(result).toBeNull()
  })

  it('excludes soft-deleted content (deleted_at filter applied)', async () => {
    prismaMock.content.findFirst.mockResolvedValue(null)

    await getContent(CONTENT_ID, TENANT_ID)

    expect(prismaMock.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deleted_at: null,
        }),
      }),
    )
  })

  it('enforces tenant isolation (tenant_id in where)', async () => {
    prismaMock.content.findFirst.mockResolvedValue(null)

    await getContent(CONTENT_ID, TENANT_ID)

    expect(prismaMock.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenant_id: TENANT_ID,
        }),
      }),
    )
  })
})