// apps/web-app/lib/quota/quota-service.ts
// ── Quota Service ─────────────────────────────────────────────
// Arsitektur 2 layer:
//   Layer 1 — Redis: fast daily counter, reset midnight WIB (auto TTL)
//   Layer 2 — DB:    monthly persistent, source of truth untuk billing
//
// Kenapa 2 layer?
//   - Redis INCR ~100x lebih cepat dari Postgres UPDATE untuk rate-checking
//   - DB tetap jadi SOT — Redis down tidak boleh bypass quota
//   - Daily limit mencegah 1 user habiskan monthly quota dalam 1 jam (anti-abuse)
// ─────────────────────────────────────────────────────────────
import { Redis } from '@upstash/redis'
import { db }    from '@/lib/db'


const redis = Redis.fromEnv()

export type QuotaType = 'content' | 'video'
export interface UsageSnapshot {
  postsUsed: number
  postsLimit: number
  aiCreditsUsed: number
  aiCreditsLimit: number
}

export async function getUsageSnapshot(
  tenant_id: string,
): Promise<UsageSnapshot> {

  // contoh query sederhana
   const tenant = await db.tenant.findUnique({
    where: {
      id: tenant_id,
    },
    select: {
      plan: true,

      quota_content_used: true,
      quota_content_max: true,

      quota_video_used: true,
      quota_video_max: true,
    },
  })

  if (!tenant) {
    return {
      postsUsed: 0,
      postsLimit: 0,
      aiCreditsUsed: 0,
      aiCreditsLimit: 0,
    }
  }

  // sementara hardcoded
  // nanti bisa disesuaikan dengan getPlanLimits()

  return {
    postsUsed: tenant.quota_content_used ?? 0,
    postsLimit: tenant.quota_content_max ?? 0,

    aiCreditsUsed: tenant.quota_video_used ?? 0,
    aiCreditsLimit: tenant.quota_video_max ?? 0,
  }
}
// ── Daily limits per plan ────────────────────────────────────
// Monthly limit ada di DB. Daily limit di sini untuk mencegah burst abuse.
const DAILY_LIMITS: Record<string, { content: number; video: number }> = {
  free:       { content: 3,    video: 0    },
  basic:      { content: 15,   video: 3    },
  pro:        { content: 50,   video: 10   },
  business:   { content: 200,  video: 50   },
  enterprise: { content: 9999, video: 9999 },
}

// ── Warning thresholds ───────────────────────────────────────
export const WARNING_THRESHOLD_PCT  = 90   // banner warning
export const CRITICAL_THRESHOLD_PCT = 100  // hard block

// ── WIB (UTC+7) helpers ──────────────────────────────────────
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

function getRedisKey(tenant_id: string, type: QuotaType): string {
  // Pakai tanggal WIB, bukan UTC — supaya reset midnight lokal
  const nowWib = new Date(Date.now() + WIB_OFFSET_MS)
  const dateStr = nowWib.toISOString().slice(0, 10)  // YYYY-MM-DD
  return `quota:daily:${tenant_id}:${type}:${dateStr}`
}
function getMonthlyRedisKey(
  tenant_id: string,
  type: QuotaType,
): string {
  const nowWib = new Date(Date.now() + WIB_OFFSET_MS)
  const monthStr = nowWib.toISOString().slice(0, 7)

  return `quota:monthly:${tenant_id}:${type}:${monthStr}`
}

function getSecondsUntilMidnightWib(): number {
  const nowWib = new Date(Date.now() + WIB_OFFSET_MS)
  const midnightWib = new Date(nowWib)
  midnightWib.setUTCHours(24, 0, 0, 0)   // 00:00 besok WIB
  const diffMs = midnightWib.getTime() - nowWib.getTime()
  return Math.max(Math.ceil(diffMs / 1000), 60)
}
function getSecondsUntilMonthResetWib(): number {
  const nowWib = new Date(Date.now() + WIB_OFFSET_MS)

  const nextMonth = new Date(nowWib)

  nextMonth.setUTCMonth(
    nowWib.getUTCMonth() + 1,
    1,
  )

  nextMonth.setUTCHours(0, 0, 0, 0)

  const diffMs =
    nextMonth.getTime() - nowWib.getTime()

  return Math.max(
    Math.ceil(diffMs / 1000),
    60,
  )
}

// ── Status shape untuk API + UI ──────────────────────────────
export interface QuotaStatus {
  allowed: boolean
  daily: {
    used?:      number
    limit?:     number
    max:        number
    remaining?:  number
    pct:        number
    resetInSec: number
    resetAt?: string | Date | null
    reason?:     'daily' | 'monthly' | 'error'
  }
  monthly: {
    used?:      number
    limit?:     number
    max:       number
    remaining?: number
    pct:       number
    resetAt?: string | Date | null
    reason?:     'daily' | 'monthly' | 'error'
  }
  warningLevel: 'none' | 'warning' | 'critical'
  blockReason:  'daily_exceeded' | 'monthly_exceeded' | null
}

// ================================================================
// checkQuota — read-only
// ================================================================
export async function checkQuota(
  tenant_id: string,
  type: QuotaType = 'content',
): Promise<QuotaStatus> {
  const tenant = await db.tenant.findUnique({
    where:  { id: tenant_id },
    select: {
      plan:             true,
      quota_content_used: true,
      quota_content_max:  true,
      quota_video_used:   true,
      quota_video_max:    true,
      quotaResetAt:     true,
    },
  })

  if (!tenant) {
  return {
    allowed: false,

    daily: {
      used: 0,
      max: 0,
      remaining: 0,
      pct: 100,
      resetInSec: 0,
    },

    monthly: {
      used: 0,
      max: 0,
      remaining: 0,
      pct: 100,
      resetAt: '',
    },

    warningLevel: 'critical',
    blockReason: 'monthly_exceeded',
  }
}

  const dailyLimits = DAILY_LIMITS[tenant.plan] ?? DAILY_LIMITS.free
  const dailyMax    = type === 'content' ? dailyLimits.content : dailyLimits.video

 let monthlyUsed = type === 'content'
  ? tenant.quota_content_used
  : tenant.quota_video_used
  const monthlyMax  = type === 'content' ? tenant.quota_content_max  : tenant.quota_video_max

  // Read Redis (null jika belum pernah INCR hari ini)
  let dailyUsed = 0
  try {
    const [dailyCached, monthlyCached] =
  await Promise.all([
    redis.get<number>(
      getRedisKey(tenant_id, type),
    ),
    redis.get<number>(
      getMonthlyRedisKey(tenant_id, type),
    ),
  ])

  dailyUsed = dailyCached ?? 0

  monthlyUsed =
  monthlyCached ?? monthlyUsed
  } catch (err) {
    console.warn('[quota] Redis read error, DB-only mode:', err)
    // Redis down → fallback ke DB saja, user tetap bisa generate
  }

  const dailyRemaining   = Math.max(dailyMax   - dailyUsed,   0)
  const monthlyRemaining = Math.max(monthlyMax - monthlyUsed, 0)

  const dailyPct   = dailyMax   > 0 ? Math.round((dailyUsed   / dailyMax)   * 100) : 100
  const monthlyPct = monthlyMax > 0 ? Math.round((monthlyUsed / monthlyMax) * 100) : 100

  const worstPct = Math.max(dailyPct, monthlyPct)

  let warningLevel: QuotaStatus['warningLevel'] = 'none'
  if      (worstPct >= CRITICAL_THRESHOLD_PCT) warningLevel = 'critical'
  else if (worstPct >= WARNING_THRESHOLD_PCT)  warningLevel = 'warning'

  let blockReason: QuotaStatus['blockReason'] = null
  let allowed = true
  if (monthlyRemaining <= 0) {
    allowed = false
    blockReason = 'monthly_exceeded'
  } else if (dailyRemaining <= 0) {
    allowed = false
    blockReason = 'daily_exceeded'
  }

  return {
    allowed,
    daily: {
      used:       dailyUsed,
      max:        dailyMax,
      remaining:  dailyRemaining,
      pct:        dailyPct,
      resetInSec: getSecondsUntilMidnightWib(),
    },
    monthly: {
      used:      monthlyUsed,
      max:       monthlyMax,
      remaining: monthlyRemaining,
      pct:       monthlyPct,
      resetAt: tenant.quotaResetAt?.toISOString() ?? '',
    },
    warningLevel,
    blockReason,
  }
}

// ================================================================
// decrementQuota — atomic debit (DB first, Redis second)
// Return { success, reason? }
// ================================================================
export async function decrementQuota(
  tenant_id: string,
  type: QuotaType = 'content',
  amount = 1,
): Promise<{ success: boolean; reason?: 'daily' | 'monthly' | 'error' }> {

  // ── Step 1: Pre-check daily limit di Redis ──────────────
  // Ini cepat (1 Redis GET) dan block burst abuse sebelum sentuh DB
  const status = await checkQuota(tenant_id, type)
  if (!status.allowed) {
    return {
      success: false,
      reason:  status.blockReason === 'daily_exceeded' ? 'daily' : 'monthly',
    }
  }

  // ── Step 2: Atomic debit DB via conditional UPDATE ──────
  // Pattern: UPDATE ... WHERE quota_used + amount <= quota_max
  // Jika row count = 0, artinya kondisi tidak terpenuhi → quota habis
  try {
    let rowsUpdated: number

    if (type === 'content') {
      rowsUpdated = await db.$executeRaw`
        UPDATE tenants
        SET    quota_content_used = quota_content_used + ${amount}
        WHERE  id = ${tenant_id}::uuid
          AND  quota_content_used + ${amount} <= quota_content_max
      `
    } else {
      rowsUpdated = await db.$executeRaw`
        UPDATE tenants
        SET    quota_video_used = quota_video_used + ${amount}
        WHERE  id = ${tenant_id}::uuid
          AND  quota_video_used + ${amount} <= quota_video_max
      `
    }

    if (rowsUpdated === 0) {
      return { success: false, reason: 'monthly' }
    }

  } catch (err) {
    console.error('[quota] DB decrement error:', err)
    return { success: false, reason: 'error' }
  }

  // ── Step 3: INCR Redis daily counter (non-critical) ────
  // Kalau Redis gagal, user tetap bisa lanjut — DB sudah debit
  try {
    const dailyRedisKey =
      getRedisKey(tenant_id, type)

    const monthlyRedisKey =
      getMonthlyRedisKey(tenant_id, type)

    const [newDailyCount, newMonthlyCount] =
      await Promise.all([
        redis.incrby(dailyRedisKey, amount),
        redis.incrby(monthlyRedisKey, amount),
      ])

    if (newDailyCount === amount) {
      await redis.expire(
        dailyRedisKey,
        getSecondsUntilMidnightWib(),
      )
    }

    if (newMonthlyCount === amount) {
      await redis.expire(
        monthlyRedisKey,
        getSecondsUntilMonthResetWib(),
      )
    }
  } catch (err) {
    console.warn('[quota] Redis INCR error (DB already updated):', err)
    // Tidak rollback DB — Redis hanya cache, DB is SOT
  }

  return { success: true }
}

// ================================================================
// refundQuota — kalau generation gagal, kembalikan 1 credit
// Dipanggil di streamText onError callback
// ================================================================
export async function refundQuota(
  tenant_id: string,
  type: QuotaType = 'content',
  amount = 1,
): Promise<void> {
  // Redis DECR
  try {
    const dailyRedisKey =
      getRedisKey(tenant_id, type)

    const monthlyRedisKey =
      getMonthlyRedisKey(tenant_id, type)

    const [dailyResult, monthlyResult] =
      await Promise.all([
        redis.decrby(dailyRedisKey, amount),
        redis.decrby(monthlyRedisKey, amount),
      ])

    // Floor daily ke 0
    if (dailyResult < 0) {
      await redis.set(
        dailyRedisKey,
        0,
        { ex: getSecondsUntilMidnightWib() },
  )
}

// Floor monthly ke 0
if (monthlyResult < 0) {
  await redis.set(
    monthlyRedisKey,
    0,
    { ex: getSecondsUntilMonthResetWib() },
  )
}
  } catch (err) {
    console.warn('[quota] Redis DECR error:', err)
  }

  // DB floor di 0 pakai GREATEST
  try {
    if (type === 'content') {
      await db.$executeRaw`
        UPDATE tenants
        SET    quota_content_used = GREATEST(quota_content_used - ${amount}, 0)
        WHERE  id = ${tenant_id}::uuid
      `
    } else {
      await db.$executeRaw`
        UPDATE tenants
        SET    quota_video_used = GREATEST(quota_video_used - ${amount}, 0)
        WHERE  id = ${tenant_id}::uuid
      `
    }
  } catch (err) {
    console.error('[quota] DB refund error:', err)
  }
}

// ================================================================
// resetDailyQuota — manual reset (dev/testing only)
// Production: Redis TTL yang handle reset otomatis
// ================================================================
export async function resetDailyQuota(
  tenant_id: string,
  type: QuotaType = 'content',
): Promise<void> {
  await redis.del(getRedisKey(tenant_id, type))
}

export async function getQuotaStatus(
  tenant_id: string,
  type: QuotaType = 'content',
) {
  const tenant = await db.tenant.findUnique({
    where: {
      id: tenant_id,
    },

    select: {
      plan: true,

      quota_content_max: true,
      quota_video_max: true,
    },
  })

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  const plan =
    tenant.plan ?? 'free'

  const limits =
    DAILY_LIMITS[plan] ?? DAILY_LIMITS.free

  const dailyMax =
    type === 'content'
      ? limits.content
      : limits.video

  const monthlyMax =
    type === 'content'
      ? tenant.quota_content_max
      : tenant.quota_video_max

  const dailyUsed = Number(
    (await redis.get(
      getRedisKey(tenant_id, type),
    )) ?? 0,
  )

  const monthlyUsed = Number(
    (await redis.get(
      getMonthlyRedisKey(tenant_id, type),
    )) ?? 0,
  )

  return {
    plan,
    type,

    dailyUsed,
    monthlyUsed,

    dailyMax,
    monthlyMax,

    dailyRemaining:
      Math.max(
        0,
        dailyMax - dailyUsed,
      ),

    monthlyRemaining:
      Math.max(
        0,
        monthlyMax - monthlyUsed,
      ),
  }
}