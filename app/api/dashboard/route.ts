// app/api/dashboard/route.ts
// ══════════════════════════════════════════════════════════════
// BeeSell Dashboard API — Unified (Supabase only)
//
// REPLACES old Prisma+Redis version. Stack tunggal: Supabase.
// Tidak butuh: @upstash/redis, date-fns, lib/db (Prisma).
//
// GET → { user, store, kpi, credit, chartData, recent, upcoming }
// Semua data NYATA dari DB. Kosong = 0. Tidak ada dummy.
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ── Type bucket untuk chart ───────────────────────────────────
const TYPE_BUCKET = {
  image: ['image','photo','packshot','enhancer','virtual-tryon','product-to-model','ai-image-generator'],
  video: ['video','ugc-generator','image-to-video','talking-head','ai-video-generator','tiktok-script'],
  text:  ['caption','hook','hashtag','text','copy'],
}

function bucketOf(t: string | null | undefined): 'image'|'video'|'text'|'other' {
  const s = (t ?? '').toLowerCase()
  if (TYPE_BUCKET.image.some(k => s.includes(k))) return 'image'
  if (TYPE_BUCKET.video.some(k => s.includes(k))) return 'video'
  if (TYPE_BUCKET.text.some(k  => s.includes(k))) return 'text'
  return 'other'
}

// ── Tier config (statis — dari pricing strategy) ──────────────
const PLAN_LABELS: Record<string, string> = {
  free:'Gratis', starter:'Starter', basic:'Basic', pro:'Pro', business:'Business',
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const now     = new Date()
    const since30 = new Date(now); since30.setDate(since30.getDate() - 30)

    // ── Parallel fetch (defensif) ─────────────────────────────
    const [creditsR, assetsR, profileR, tenantR, memoryR] = await Promise.all([
      supabase.from('user_credits')
        .select('plan_tier,current_balance,monthly_quota,total_used_this_month')
        .eq('user_id', user.id).maybeSingle(),
      supabase.from('ai_assets')
        .select('id,type,tool_name,title,file_url,created_at')
        .eq('user_id', user.id).eq('is_deleted', false)
        .gte('created_at', since30.toISOString())
        .order('created_at', { ascending:false }).limit(500),
      supabase.from('profiles')
        .select('plan,store_name,seller_type')
        .eq('id', user.id).maybeSingle()
        .then(r => r, () => ({ data:null })),
      supabase.from('tenants')
        .select('id,name,niche,slug,created_at')
        .eq('user_id', user.id).maybeSingle()
        .then(r => r, () => ({ data:null })),
      supabase.from('ai_memory')
        .select('platforms,tone')
        .eq('user_id', user.id).maybeSingle()
        .then(r => r, () => ({ data:null })),
    ])

    const credits  = creditsR.data ?? null
    const assets   = assetsR.data  ?? []
    const profile  = (profileR as any).data ?? null
    const tenant   = (tenantR as any).data  ?? null
    const memory   = (memoryR as any).data  ?? null

    const tier      = credits?.plan_tier ?? profile?.plan ?? 'starter'
    const planLabel = PLAN_LABELS[tier] ?? tier

    // ── User info ─────────────────────────────────────────────
    const userData = {
      id:    user.id,
      name:  user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Seller',
      email: user.email ?? '',
      avatar_url: user.user_metadata?.avatar_url ?? null,
    }

    // ── Store info ────────────────────────────────────────────
    const storeData = {
      id:               tenant?.id ?? null,
      name:             tenant?.name ?? profile?.store_name ?? null,
      plan:             tier,
      planLabel,
      slug:             tenant?.slug ?? null,
      niche:            tenant?.niche ?? null,
      sellerType:       profile?.seller_type ?? null,
      platforms:        (memory?.platforms as string[]) ?? [],
      tone:             memory?.tone ?? 'casual',
      memberSince:      tenant?.created_at ?? null,
    }

    // ── KPI counts (30 hari) ──────────────────────────────────
    let cImage = 0, cVideo = 0, cText = 0
    for (const a of assets) {
      const b = bucketOf(a.type ?? a.tool_name)
      if (b === 'image') cImage++
      else if (b === 'video') cVideo++
      else if (b === 'text')  cText++
    }

    // ── Chart 7 hari ──────────────────────────────────────────
    const dayLabels: string[] = []
    const dayKeys:   string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      dayKeys.push(d.toISOString().split('T')[0])
      dayLabels.push(d.toLocaleDateString('id-ID', { weekday:'short' }))
    }
    const chartData = dayKeys.map((_, i) => ({ day: dayLabels[i], gambar:0, video:0, teks:0 }))
    for (const a of assets) {
      const dayStr = (a.created_at ?? '').split('T')[0]
      const idx = dayKeys.indexOf(dayStr)
      if (idx < 0) continue
      const b = bucketOf(a.type ?? a.tool_name)
      if (b === 'image') chartData[idx].gambar++
      else if (b === 'video') chartData[idx].video++
      else if (b === 'text')  chartData[idx].teks++
    }

    // ── Recent 6 ──────────────────────────────────────────────
    const recent = assets.slice(0, 6).map(a => {
      const b = bucketOf(a.type ?? a.tool_name)
      const created = new Date(a.created_at)
      const diffMs  = now.getTime() - created.getTime()
      const diffH   = Math.floor(diffMs / 36e5)
      const diffD   = Math.floor(diffMs / 864e5)
      const rel = diffH < 1 ? 'baru saja'
        : diffH < 24        ? `${diffH} jam lalu`
        : diffD === 1       ? '1 hari lalu'
        :                     `${diffD} hari lalu`
      return {
        id:       a.id,
        title:    a.title ?? a.tool_name ?? 'Konten',
        bucket:   b,
        tool:     a.tool_name ?? a.type ?? '—',
        file_url: a.file_url,
        created:  rel,
      }
    })

    // ── Upcoming scheduled (defensif) ─────────────────────────
    let upcoming: Array<{ time:string; platform:string; title:string }> = []
    try {
      const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0)
      const dayAfter = new Date(tomorrow); dayAfter.setDate(dayAfter.getDate() + 1)
      const { data: sched } = await supabase
        .from('scheduled_posts')
        .select('scheduled_at,platform,title')
        .eq('user_id', user.id)
        .gte('scheduled_at', tomorrow.toISOString())
        .lt('scheduled_at',  dayAfter.toISOString())
        .order('scheduled_at', { ascending:true }).limit(5)
      upcoming = (sched ?? []).map(s => ({
        time:     new Date(s.scheduled_at).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }),
        platform: s.platform ?? 'unknown',
        title:    s.title ?? 'Post',
      }))
    } catch { /* scheduled_posts belum ada */ }

    // ── Response (compatible with both old & new dashboard page) ──
    return NextResponse.json({
      success: true,

      // Format baru (dashboard page v2)
      tier,
      credit: {
        balance: credits?.current_balance       ?? 0,
        quota:   credits?.monthly_quota         ?? 0,
        used:    credits?.total_used_this_month ?? 0,
      },
      counts: { image: cImage, video: cVideo, text: cText, total: assets.length },
      chartData,
      recent,
      upcoming,

      // Format lama (backward compat — kalau ada page lain yang masih pakai)
      data: {
        user:   userData,
        store:  storeData,
        totalContents:      assets.length,
        contentsThisMonth:  assets.length,
        imageCount:         cImage,
        captionsGenerated:  cText,
        scheduledCount:     upcoming.length,
        dailyUsed:          0,
        dailyMax:           tier === 'business' ? 200 : tier === 'pro' ? 50 : tier === 'basic' ? 15 : 3,
        dailyPercent:       0,
        monthlyUsed:        credits?.total_used_this_month ?? 0,
        monthlyMax:         credits?.monthly_quota ?? 50,
        monthlyPercent:     credits?.monthly_quota ? Math.round(((credits?.total_used_this_month ?? 0) / credits.monthly_quota) * 100) : 0,
        chartData,
        recentContents:     recent.map(r => ({
          id: r.id, type: r.bucket, status: 'ready',
          title: r.title, media_url: r.file_url,
          primary_platform: null, created_at: null,
        })),
        generatedAt: now.toISOString(),
      },
    })

  } catch (err: any) {
    console.error('[/api/dashboard]', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}