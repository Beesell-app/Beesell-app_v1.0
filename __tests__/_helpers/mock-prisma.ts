// apps/web-app/__tests__/_helpers/mock-prisma.ts
// Prisma mock via vitest-mock-extended
import { vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'

// Mock db dari @/lib/db
vi.mock('@/lib/db', () => ({
  db: mockDeep<PrismaClient>(),
}))

// Import setelah mock
import { db } from '@/lib/db'

export const prismaMock = db as unknown as DeepMockProxy<PrismaClient>

export function resetPrismaMock() {
  mockReset(prismaMock)
  prismaMock.$executeRaw.mockResolvedValue(1)
}

// ── Helpers untuk seed mock data ───────────────────────
export function makeMockUser(overrides: Partial<any> = {}) {
  return {
    id:       'user-test-1',
    email:    'test@example.com',
    name:     'Test User',
    tenant_id: 'tenant-test-1',
    role:     'owner',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

export function makeMockTenant(overrides: Partial<any> = {}) {
  const plan = (overrides.plan ?? 'free') as string
  const defaultQuota = {
    free:      { contentMax: 50,   videoMax: 0 },
    basic:     { contentMax: 250,  videoMax: 50 },
    pro:       { contentMax: 1000, videoMax: 200 },
    business:  { contentMax: 5000, videoMax: 1000 },
    enterprise: { contentMax: 99999, videoMax: 99999 },
  }[plan] ?? { contentMax: 50, videoMax: 0 }

  return {
    id:               'tenant-test-1',
    name:             'Test Store',
    plan:             plan as any,
    niche:            'fashion',
    sellerType:       'SELLER',
    quota_content_used: 0,
    quota_content_max:  defaultQuota.contentMax,
    quota_video_used:   0,
    quota_video_max:    defaultQuota.videoMax,
    quotaResetAt:     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    created_at:        new Date(),
    updated_at:        new Date(),
    ...overrides,
  }
}

export function makeMockContent(overrides: Partial<any> = {}) {
  return {
    id:               'content-test-1',
    contentId:         'content-test-1',
    tenant_id:         'tenant-test-1',
    userId:           'user-test-1',
    type:             'caption',
    status:           'draft',
    publicUrl:        null,
    title:            null,
    caption_text:      null,
    captionVariants:  [],
    hashtags:         [],
    platforms:        [],
    primary_platform:  null,
    productData:      null,
    generationConfig: null,
    aiProvider:       null,
    aiModel:          null,
    cost_usd:          null,
    aiJobId:          null,
    folderId:         null,
    isStarred:        false,
    tags:             [],
    deleted_at:        null,
    created_at:        new Date(),
    updated_at:        new Date(),
    ...overrides,
  }
}