// apps/web-app/lib/middleware/plan-check.ts
// ── Plan check middleware helpers ─────────────────────────────
// Used in API route handlers (not Next.js middleware.ts — that's edge)
// Call withQuotaCheck() to wrap any generation endpoint.
import { NextResponse }    from 'next/server'
import { createClient }    from '@/lib/supabase/server'
import { db }              from '@/lib/db'
import {
  checkQuota,
  decrementQuota,
  refundQuota,
  type QuotaType,
} from '@/lib/quota/quota-service'
import { getPlanLimits, needsWatermark, isFeatureAllowed } from '@/lib/quota/plans'
import type { QuotaMetric } from '@/lib/quota/plans'

// ── Auth + plan resolution ────────────────────────────────────
export interface AuthenticatedContext {
  userId:    string
  tenant_id:  string
  plan:      string
  limits:    ReturnType<typeof getPlanLimits>
  needsWatermark: boolean
}

export async function resolveAuthContext(): Promise<AuthenticatedContext | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const dbUser = await db.user.findUnique({
    where: {
      id: user.id,
    },

    select: {
      tenant_id: true,

      tenants: {
        select: {
          plan: true,
        },
      },
    },
  })

  if (!dbUser) return null

  const plan = dbUser.tenants?.plan ?? 'free'

  return {
    userId: user.id,
    tenant_id: dbUser.tenant_id,
    plan,
    limits: getPlanLimits(plan as any),
    needsWatermark: plan === 'free',
  }
}
// ── Feature gate ──────────────────────────────────────────────
export function requireFeature(
  ctx:     AuthenticatedContext,
  feature: keyof ReturnType<typeof getPlanLimits>,
): NextResponse | null {
  if (!isFeatureAllowed(ctx.plan, feature)) {
    return NextResponse.json({
      error:         'PLAN_LIMIT',
      feature:       String(feature),
      currentPlan:   ctx.plan,
      message:       `Fitur ini tidak tersedia di plan ${ctx.plan}. Upgrade untuk menggunakannya.`,
      upgradeUrl:    '/settings/billing',
    }, { status: 403 })
  }
  return null
}

// ── Quota check middleware ─────────────────────────────────────
export interface QuotaCheckOptions {
  metric:     QuotaMetric
  amount?:    number      // default 1
}

export type HandlerFn = (
  req:     Request,
  ctx:     AuthenticatedContext,
  params?: any,
) => Promise<NextResponse>



// Higher-order function: wraps a handler with quota check
export function withQuotaCheck(
  opts:    QuotaCheckOptions,
  handler: HandlerFn,
): (req: Request, params?: any) => Promise<NextResponse> {

  return async (req: Request, params?: any) => {

    // 1. Auth
    const ctx = await resolveAuthContext()
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const amount = opts.amount ?? 1

    // 2. Quota check (Redis, fast)
    const quota = await checkQuota(
      ctx.tenant_id,
      opts.metric as QuotaType
    )

    if (!quota.allowed) {
        const dailyExceeded =
          quota.blockReason === 'daily_exceeded'

        const resetTime = quota.monthly.resetAt
          ? new Date(quota.monthly.resetAt).toLocaleString(
              'id-ID',
              {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Jakarta',
              },
            )
          : 'bulan depan'

      return NextResponse.json({
        error: 'QUOTA_EXCEEDED',

          metric: opts.metric,

          used: dailyExceeded
            ? quota.daily.used
            : quota.monthly.used,

          limit: dailyExceeded
            ? quota.daily.max
            : quota.monthly.max,

          remaining: dailyExceeded
            ? quota.daily.remaining
            : quota.monthly.remaining,

          resetAt: dailyExceeded
            ? null
            : quota.monthly.resetAt,

          warningLevel: quota.warningLevel,

          message: dailyExceeded
            ? `Batas harian ${opts.metric} (${quota.daily.max}/hari) tercapai. Reset pukul 00:00 WIB.`
            : `Batas bulanan ${opts.metric} (${quota.monthly.max}/bulan) tercapai. Reset ${resetTime}.`,

          upgradeUrl: '/settings/billing',
          currentPlan: ctx.plan,
        },
        {
          status: 429,
        headers: {
            'X-Quota-Used': String(
              dailyExceeded
                ? quota.daily.used ?? 0
                : quota.monthly.used ?? 0,
            ),

            'X-Quota-Limit': String(
              dailyExceeded
                ? quota.daily.max
                : quota.monthly.max,
            ),

            'X-Plan': ctx.plan,
          },
      })
    }
    // 4. Debit quota before handler
    const debit = await decrementQuota(
      ctx.tenant_id,
      opts.metric as QuotaType,
      amount,
    )

    if (!debit.success) {
      return NextResponse.json(
        {
          error: 'QUOTA_DEBIT_FAILED',
        },
        {
          status: 500,
        },
      )
    }
    // 3. Call handler
    let response: NextResponse
     try {
      response = await handler(req, ctx, params)
    } catch (err) {
      // rollback quota if handler failed
      await refundQuota(
        ctx.tenant_id,
        opts.metric as QuotaType,
        amount,
      )

      throw err
    }
// 6. rollback if response failed
    if (!response.ok) {
      await refundQuota(
        ctx.tenant_id,
        opts.metric as QuotaType,
        amount,
      )
    }

    // 7. Success headers
    response.headers.set(
      'X-Plan',
      ctx.plan,
    )

    response.headers.set(
      'X-Quota-Daily-Remaining',
      String(quota.daily.remaining ?? 0),
    )

    response.headers.set(
      'X-Quota-Monthly-Remaining',
      String(quota.monthly.remaining ?? 0),
    )

    return response
  }
}

export async function rollbackQuota(
  tenant_id: string,
  metric: QuotaMetric,
  amount: number = 1,
  ): Promise<void> {
  await refundQuota(
    tenant_id,
    metric as QuotaType,
    amount,
    )
  }