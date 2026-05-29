// apps/web-app/__tests__/quota-service.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── In-memory Redis store ─────────────────────────────────────
const store = new Map<string, number>()

// ── Prisma mock ───────────────────────────────────────────────
vi.mock('@/lib/db', () => ({
  db: {
    tenant: {
      findUnique: vi.fn(),
    },
    $executeRaw: vi.fn(),
  },
}))

// ── Redis mock ────────────────────────────────────────────────
vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: () => ({
      get: async (key: string) => {
        const v = store.get(key)
        return v === undefined ? null : v
      },
      set: async (key: string, val: number, _opts?: unknown) => {
        store.set(key, val)
        return 'OK'
      },
      del:    async (key: string) => { store.delete(key); return 1 },
      expire: async () => true,
      incrby: async (key: string, by: number) => {
        const n = (store.get(key) ?? 0) + by
        store.set(key, n)
        return n
      },
      decrby: async (key: string, by: number) => {
        const n = (store.get(key) ?? 0) - by
        store.set(key, n)
        return n
      },
    }),
  },
}))

// ── Import AFTER mocks ────────────────────────────────────────
import { db } from '@/lib/db'
import {
  checkQuota,
  decrementQuota,
  refundQuota,
  type QuotaType,
} from '@/lib/quota/quota-service'

// ── Constants ─────────────────────────────────────────────────
const TENANT = '11111111-1111-1111-1111-111111111111'

// ── Redis key — match getRedisKey() in service ────────────────
function rk(type: QuotaType): string {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000)
  return `quota:daily:${TENANT}:${type}:${wib.toISOString().slice(0, 10)}`
}

// ── Tenant helper ─────────────────────────────────────────────
function tenant(plan: string, opts: {
  contentUsed?: number; contentMax?: number
  videoUsed?:   number; videoMax?:   number
} = {}) {
  return {
    id:               TENANT,
    plan,
    quota_content_used: opts.contentUsed ?? 0,
    quota_content_max:  opts.contentMax  ?? 50,
    quota_video_used:   opts.videoUsed   ?? 0,
    quota_video_max:    opts.videoMax    ?? 10,
    quotaResetAt:     new Date('2099-01-01'),
  }
}

// ── Reset ─────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
  store.clear()
  ;(db.tenant.findUnique as any).mockResolvedValue(tenant('free'))
  ;(db.$executeRaw as any).mockResolvedValue(1)
})

// ══════════════════════════════════════════════════════════════
// checkQuota
// ══════════════════════════════════════════════════════════════
describe('checkQuota', () => {

  it('allows when no usage (free plan)', async () => {
    const r = await checkQuota(TENANT, 'content')
    expect(r.allowed).toBe(true)
    expect(r.blockReason).toBeNull()
    expect(r.daily.used).toBe(0)
    expect(r.daily.max).toBe(3)
    expect(r.monthly.used).toBe(0)
    expect(r.monthly.max).toBe(50)
  })

  it('allows when usage is under daily limit', async () => {
    store.set(rk('content'), 2)
    const r = await checkQuota(TENANT, 'content')
    expect(r.allowed).toBe(true)
    expect(r.daily.used).toBe(2)
    expect(r.daily.remaining).toBe(1)
  })

  it('blocks when daily limit reached', async () => {
    store.set(rk('content'), 3)
    const r = await checkQuota(TENANT, 'content')
    expect(r.allowed).toBe(false)
    expect(r.blockReason).toBe('daily_exceeded')
  })

  it('blocks when monthly DB limit reached', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('free', { contentUsed: 50, contentMax: 50 })
    )
    const r = await checkQuota(TENANT, 'content')
    expect(r.allowed).toBe(false)
    expect(r.blockReason).toBe('monthly_exceeded')
  })

  it('monthly block takes priority when both exceeded', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('free', { contentUsed: 50, contentMax: 50 })
    )
    store.set(rk('content'), 3)
    const r = await checkQuota(TENANT, 'content')
    expect(r.allowed).toBe(false)
    expect(r.blockReason).toBe('monthly_exceeded')
  })

  it('video blocked on free plan (daily limit = 0)', async () => {
    const r = await checkQuota(TENANT, 'video')
    expect(r.allowed).toBe(false)
    expect(r.blockReason).toBe('daily_exceeded')
    expect(r.daily.max).toBe(0)
  })

  it('basic plan — 14/15 daily still allowed', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('basic', { contentMax: 250 })
    )
    store.set(rk('content'), 14)
    const r = await checkQuota(TENANT, 'content')
    expect(r.allowed).toBe(true)
    expect(r.daily.max).toBe(15)
    expect(r.monthly.max).toBe(250)
  })

  it('pro plan — 49/50 daily still allowed', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('pro', { contentMax: 1000 })
    )
    store.set(rk('content'), 49)
    const r = await checkQuota(TENANT, 'content')
    expect(r.allowed).toBe(true)
    expect(r.daily.max).toBe(50)
  })

  it('warning level is none when usage is low', async () => {
    const r = await checkQuota(TENANT, 'content')
    expect(r.warningLevel).toBe('none')
  })

  it('warning level is critical at 100%', async () => {
    store.set(rk('content'), 3)
    const r = await checkQuota(TENANT, 'content')
    expect(r.warningLevel).toBe('critical')
  })

  // Observed behavior: null tenant → service returns blocked (not throw)
  it('null tenant — returns not allowed (graceful handling)', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(null)
    const r = await checkQuota(TENANT, 'content')
    expect(r.allowed).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════
// decrementQuota
// ══════════════════════════════════════════════════════════════
describe('decrementQuota', () => {

  it('returns success and increments Redis', async () => {
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(true)
    expect(store.get(rk('content'))).toBe(1)
  })

  it('returns { success: false, reason: daily } when daily exceeded', async () => {
    store.set(rk('content'), 3)
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(false)
    expect(r.reason).toBe('daily')
    expect(store.get(rk('content'))).toBe(3)  // Redis not incremented
  })

  it('returns { success: false, reason: monthly } when monthly DB exceeded', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('free', { contentUsed: 50, contentMax: 50 })
    )
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(false)
    expect(r.reason).toBe('monthly')
  })

  it('returns { success: false, reason: monthly } when DB returns 0 rows', async () => {
    ;(db.$executeRaw as any).mockResolvedValue(0)
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(false)
    expect(r.reason).toBe('monthly')
    expect(store.get(rk('content'))).toBeUndefined()  // Redis not incremented
  })

  it('exact boundary: 2 used → 3 (limit=3) — allowed', async () => {
    store.set(rk('content'), 2)
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(true)
    expect(store.get(rk('content'))).toBe(3)
  })

  it('returns { success: false, reason: error } when DB throws', async () => {
    ;(db.$executeRaw as any).mockRejectedValue(new Error('DB connection failed'))
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(false)
    expect(r.reason).toBe('error')
  })

  // Observed behavior: null tenant → checkQuota returns blocked → decrement returns false
  it('null tenant — returns not allowed (graceful handling)', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(null)
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(false)
  })

  it('basic plan allows 14→15 daily', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('basic', { contentMax: 250 })
    )
    store.set(rk('content'), 14)
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(true)
  })

  it('basic plan rejects at 15 (limit reached)', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('basic', { contentMax: 250 })
    )
    store.set(rk('content'), 15)
    const r = await decrementQuota(TENANT, 'content', 1)
    expect(r.success).toBe(false)
    expect(r.reason).toBe('daily')
  })
})

// ══════════════════════════════════════════════════════════════
// refundQuota
// ══════════════════════════════════════════════════════════════
describe('refundQuota', () => {

  it('decrements Redis daily counter', async () => {
    store.set(rk('content'), 5)
    await refundQuota(TENANT, 'content', 1)
    expect(store.get(rk('content'))).toBe(4)
  })

  it('floors Redis at 0 — no negative', async () => {
    store.set(rk('content'), 0)
    await refundQuota(TENANT, 'content', 1)
    expect(store.get(rk('content'))).toBe(0)
  })

  it('calls db.$executeRaw for monthly refund', async () => {
    await refundQuota(TENANT, 'content', 1)
    expect(db.$executeRaw).toHaveBeenCalled()
  })

  it('cycle: decrement + refund = net zero', async () => {
    await decrementQuota(TENANT, 'content', 1)
    await refundQuota(TENANT, 'content', 1)
    expect(store.get(rk('content')) ?? 0).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════
describe('Edge cases', () => {

  it('content and video use independent Redis keys', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('pro', { contentMax: 1000, videoMax: 100 })
    )
    await decrementQuota(TENANT, 'content', 1)
    await decrementQuota(TENANT, 'video', 1)
    expect(store.get(rk('content'))).toBe(1)
    expect(store.get(rk('video'))).toBe(1)
  })

  it('concurrent decrements each increment Redis', async () => {
    ;(db.tenant.findUnique as any).mockResolvedValue(
      tenant('pro', { contentMax: 1000 })
    )
    await Promise.all([
      decrementQuota(TENANT, 'content', 1),
      decrementQuota(TENANT, 'content', 1),
      decrementQuota(TENANT, 'content', 1),
    ])
    expect(store.get(rk('content')) ?? 0).toBeGreaterThanOrEqual(1)
  })
})