// apps/web-app/app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }           from '@/lib/db'
import { Redis }        from '@upstash/redis'
import { subDays, format, startOfDay, startOfMonth } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const redis = Redis.fromEnv()

const PLAN_DAILY: Record<string, number>   = { free: 3, starter: 3, basic: 15, pro: 50, business: 200 }
const PLAN_MONTHLY: Record<string, number> = { free: 50, starter: 50, basic: 250, pro: 1000, business: 5000 }
const PLAN_LABELS: Record<string, string>  = { free: 'Gratis', starter: 'Gratis', basic: 'Basic', pro: 'Pro', business: 'Business' }

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await db.user.findUnique({
  where: {
    id: user.id,
  },

  select: {
    id: true,
    tenant_id: true,

    name: true,
    email: true,

    avatar_url: true,

    onboarding_done: true,
    onboarding_step: true,

    preferences: true,

    tenants: {
      select: {
        id: true,
        name: true,
        plan: true,
        slug: true,

        quota_content_used: true,
        quota_content_max: true,

        quota_video_used: true,
        quota_video_max: true,

        settings: true,
        metadata: true,

        created_at: true,
      },
    },
  },
})
  return dbUser
}

export async function GET() {
  try {
    const me = await auth()
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { tenant_id } = me
    const tenant =
      Array.isArray(me.tenants)
        ? me.tenants[0]
        : me.tenants

    if (!tenant) {
      return NextResponse.json(
        {
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant tidak ditemukan',
        },
        { status: 404 }
      )
    }
    
const plan = tenant.plan as string
    const now        = new Date()
    const todayKey   = format(now, 'yyyy-MM-dd')
    const monthKey   = format(now, 'yyyy-MM')
    const monthStart = startOfMonth(now)
    const ago30      = subDays(now, 29)

    // Onboarding data from settings JSON
    const settings  = (tenant.settings  as any) ?? {}
    const metadata  = (tenant.metadata  as any) ?? {}
    const prefs     = (me.preferences   as any) ?? {}

    const [
      totalContents, contentsThisMonth, scheduledCount,
      aiJobAgg, platformStats, recentContents,
      dailyQ, monthlyQ, imageCount,
    ] = await Promise.all([
      db.content.count({ where: { tenant_id, deleted_at: null, status: { in: ['ready','published','scheduled'] } } }),
      db.content.count({ where: { tenant_id, deleted_at: null, created_at: { gte: monthStart } } }),
      db.content.count({ where: { tenant_id, deleted_at: null, status: 'scheduled' } }),
      db.aiJob.aggregate({
        where: { tenant_id, status: 'completed', created_at: { gte: monthStart } },
        _count: { id: true }, _sum: { cost_usd: true },
      }),
      db.content.groupBy({
        by: ['primary_platform'],
        where: { tenant_id, deleted_at: null, primary_platform: { not: null } },
        _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 4,
      }),
      db.content.findMany({
        where: { tenant_id, deleted_at: null },
        orderBy: { created_at: 'desc' }, take: 6,
        select: { id:true, type:true, status:true, title:true, caption_text:true, media_url:true, primary_platform:true, created_at:true },
      }),
      redis.get<number>(`quota:daily:${tenant_id}:content:${todayKey}`).catch(() => 0),
      redis.get<number>(`quota:monthly:${tenant_id}:content:${monthKey}`).catch(() => 0),
      db.content.count({ where: { tenant_id, deleted_at: null, type: 'image' } }),
    ])

    const chartData = await buildChart(tenant_id, ago30, now)

    const dailyMax    = PLAN_DAILY[plan]   ?? 3
    const monthlyMax  = PLAN_MONTHLY[plan] ?? 50
    const dailyUsed   = Number(dailyQ)   ?? 0
    const monthlyUsed = Number(monthlyQ) ?? 0

    return NextResponse.json({ success: true, data: {
      // User profile
      user: {
        id: me.id, name: me.name || me.email.split('@')[0],
        email: me.email, avatar_url: me.avatar_url,
        onboarding_done: me.onboarding_done, onboarding_step: me.onboarding_step,
      },
      // Tenant / store profile
      store: {
        id: tenant_id, name: tenant.name, plan, planLabel: PLAN_LABELS[plan] ?? plan,
        slug: tenant.slug, memberSince: tenant.created_at?.toISOString() ?? null,
        // Onboarding data (from settings JSON)
        niche:          settings.niche       || metadata.niche       || null,
        subNiche:       settings.subNiche    || metadata.subNiche    || null,
        sellerType:     settings.sellerType  || metadata.sellerType  || null,
        primary_platform:settings.primary_platform || metadata.primary_platform || null,
        platforms:      settings.platforms   || metadata.platforms   || [],
        tone:           settings.defaultTone || metadata.tone        || 'casual',
        language:       settings.defaultLanguage || metadata.language|| 'indonesian-casual',
        mainGoals:      settings.mainGoals   || metadata.mainGoals   || [],
        whatsapp:       settings.whatsapp    || metadata.whatsapp    || null,
      },
      // KPIs
      totalContents, contentsThisMonth, scheduledCount, imageCount,
      captionsGenerated: aiJobAgg._count.id ?? 0,
      // Quota
      dailyUsed, dailyMax,
      dailyPercent:   dailyMax > 0 ? Math.round(dailyUsed / dailyMax * 100) : 0,
      monthlyUsed,    monthlyMax,
      monthlyPercent: monthlyMax > 0 ? Math.round(monthlyUsed / monthlyMax * 100) : 0,
      dailyReset: 'Tengah malam WIB',
      monthlyReset: `1 ${format(new Date(now.getFullYear(), now.getMonth() + 1, 1), 'MMM yyyy')}`,
      // Chart
      chartData,
      // Platform breakdown
      platformStats: platformStats.map(p => ({ platform: p.primary_platform, count: p._count.id })),
      // Recent
      recentContents: recentContents.map(c => ({
        id: c.id, type: c.type, status: c.status,
        title: c.title || c.caption_text?.slice(0, 60) || 'Tanpa judul',
        media_url: c.media_url, primary_platform: c.primary_platform,
        created_at: c.created_at.toISOString(),
      })),
      generatedAt: now.toISOString(),
    }})
  } catch (err) {
    console.error('[/api/dashboard]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function buildChart(tenant_id: string, from: Date, to: Date) {
  const rows = await db.$queryRaw<Array<{ day: string; type: string; cnt: bigint }>>`
    SELECT DATE_TRUNC('day',"created_at" AT TIME ZONE 'Asia/Jakarta')::date::text AS day,
           type, COUNT(*) AS cnt
    FROM   contents
    WHERE  "tenant_id" = ${tenant_id}::uuid AND "deleted_at" IS NULL
      AND  "created_at" >= ${from} AND "created_at" <= ${to}
    GROUP  BY day, type ORDER BY day
  `
  return Array.from({ length: 30 }, (_, i) => {
    const d   = subDays(to, 29 - i)
    const key = format(d, 'yyyy-MM-dd')
    const cap = Number(rows.find(r => r.day === key && r.type === 'caption')?.cnt ?? 0)
    const img = Number(rows.find(r => r.day === key && r.type === 'image')?.cnt   ?? 0)
    return { date: key, label: format(d, 'd MMM'), captions: cap, images: img, total: cap + img }
  })
}