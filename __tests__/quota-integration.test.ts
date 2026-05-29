import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
} from 'vitest'

import {
  checkQuota,
  decrementQuota,
  resetDailyQuota,
} from '@/lib/quota/quota-service'

import { db } from '@/lib/db'

// ─────────────────────────────────────────────────────────────
// IMPORTANT
// Gunakan UUID valid
// ─────────────────────────────────────────────────────────────
const TEST_TENANT_ID =
  '11111111-1111-1111-1111-111111111111'

// ─────────────────────────────────────────────────────────────
// Setup helper
// ─────────────────────────────────────────────────────────────
async function ensureTestTenant() {
  const existing =
    await db.tenant.findUnique({
      where: {
        id: TEST_TENANT_ID,
      },
    })

  if (!existing) {
    await db.tenant.create({
      data: {
        id: TEST_TENANT_ID,

        name: 'Vitest Test Tenant',
        slug: 'vitest-test-tenant',

        plan: 'free',

        quota_content_used: 0,
        quota_content_max: 50,

        quota_video_used: 0,
        quota_video_max: 0,

        quotaResetAt: new Date(),
      },
    })
  }
}

// ─────────────────────────────────────────────────────────────
// Test suite
// SKIP sementara karena DB integration belum siap
// ─────────────────────────────────────────────────────────────
describe.skip(
  'Quota Integration (real Redis + DB)',
  () => {
    beforeEach(async () => {
      // Ensure tenant exists
      await ensureTestTenant()

      // Reset Redis counter
      await resetDailyQuota(
        TEST_TENANT_ID,
        'content'
      )

      // Reset DB quota
      await db.tenant.update({
        where: {
          id: TEST_TENANT_ID,
        },

        data: {
          quota_content_used: 0,
          plan: 'free',
        },
      })
    })

    // ─────────────────────────────────────────
    // Race condition test
    // ─────────────────────────────────────────
    it(
      '30 request paralel tetap konsisten (no race)',
      async () => {
        const promises = Array.from(
          { length: 30 },
          () =>
            decrementQuota(
              TEST_TENANT_ID,
              'content',
              1
            )
        )

        const results =
          await Promise.all(promises)

        const successCount =
          results.filter(
            (r) => r.success
          ).length

        // Free plan daily limit = 3
        expect(successCount)
          .toBeLessThanOrEqual(3)

        // Minimal harus ada success
        expect(successCount)
          .toBeGreaterThan(0)
      }
    )

    // ─────────────────────────────────────────
    // TTL test
    // ─────────────────────────────────────────
    it(
      'TTL Redis auto-expire ke midnight WIB',
      async () => {
        await decrementQuota(
          TEST_TENANT_ID,
          'content',
          1
        )

        const status =
          await checkQuota(
            TEST_TENANT_ID,
            'content'
          )

        expect(
          status.daily.resetInSec
        ).toBeGreaterThan(0)

        expect(
          status.daily.resetInSec
        ).toBeLessThanOrEqual(86400)
      }
    )

    // ─────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────
    afterAll(async () => {
      await resetDailyQuota(
        TEST_TENANT_ID,
        'content'
      )

      // Optional:
      // jangan delete tenant kalau dipakai reuse
    })
  }
)