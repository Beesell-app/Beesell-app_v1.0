// app/api/analytics/route.ts
// ══════════════════════════════════════════════════════════════
// BEESELL ANALYTICS AI — Complete API (CLEAN — NO DUMMY DATA)
// ══════════════════════════════════════════════════════════════
//
// ATURAN: Semua angka dari DB. Kalau kosong → 0. Tidak ada seed,
// Math.sin, random, atau fallback angka palsu. Competitor data
// TIDAK dikembalikan kalau belum ada sumber nyata.
//
// GET  /api/analytics?period=7d|30d|90d
// POST /api/analytics  → upsert manual metric
// DELETE /api/analytics?id={} → hapus metric row

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic        from '@anthropic-ai/sdk'

export const dynamic     = 'force-dynamic'
export const maxDuration = 30

// ── Helpers ───────────────────────────────────────────────────
function sinceDate(period: string): string {
  const map: Record<string, number> = { '7d':7, '30d':30, '90d':90 }
  const d = new Date()
  d.setDate(d.getDate() - (map[period] ?? 30))
  return d.toISOString().split('T')[0]
}

// BeeScore™ — return 0 kalau tidak ada data
function calcBeeScore(m: {
  avgCtr: number; avgCvr: number; contentCount: number
  avgEngagement: number; hasAnyMetrics: boolean
}) {
  // Kalau belum ada konten atau metrik → semua 0
  if (m.contentCount === 0 || !m.hasAnyMetrics) {
    return { total:0, traffic:0, content:0, ctr:0, conversion:0, growth:0 }
  }

  const ctr  = Math.min(100, Math.round((m.avgCtr / 8) * 100))
  const conv = Math.min(100, Math.round((m.avgCvr / 4) * 100))
  const cont = Math.min(100, Math.round(Math.log10(m.contentCount + 1) * 48))
  const traf = Math.min(100, Math.round((m.avgEngagement / 10) * 100))
  // Growth: tanpa data historis pembanding, set 0 (bukan baseline 50)
  const grow = 0
  const total = Math.round(traf*0.20 + cont*0.20 + ctr*0.22 + conv*0.22 + grow*0.16)
  return { total, traffic:traf, content:cont, ctr, conversion:conv, growth:grow }
}

// AI Recommendations — HANYA dipanggil kalau ada data nyata
async function getAIRecommendations(ctx: {
  beeScore: ReturnType<typeof calcBeeScore>
  topContent: any[]; weakContent: any[]
  winnerType: string; platform: string
  niche: string; period: string
}): Promise<{ text:string; priority:'high'|'medium'|'low'; action:string; link:string }[]> {
  // Skip kalau tidak ada data → return kosong (bukan fallback palsu)
  if (ctx.beeScore.total === 0 && ctx.topContent.length === 0) {
    return []
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 800,
      system: `You are BeeSell AI Analytics Engine for Indonesian e-commerce sellers.
Generate exactly 5 specific, actionable analytics recommendations in bahasa Indonesia.
Focus: CTR improvement, conversion rate, content strategy.
Reference specific numbers from the data.
Output ONLY a JSON array with objects: {text, priority, action, link}
- priority: "high" | "medium" | "low"
- action: short verb phrase in Indonesian (max 4 words)
- link: one of /dashboard/studio/video/tiktok | /dashboard/studio/video/ugc | /dashboard/studio/image/enhancer | /marketing-kit | /dashboard/studio
- text: max 120 chars, specific and actionable
No markdown, no preamble. JSON only.`,
      messages: [{ role:'user', content:
        `Analytics summary (${ctx.period}):
BeeScore: ${ctx.beeScore.total}/100 (CTR:${ctx.beeScore.ctr}, Conv:${ctx.beeScore.conversion}, Growth:${ctx.beeScore.growth})
Top content type: ${ctx.winnerType}
Niche: ${ctx.niche} | Main platform: ${ctx.platform}
Top content: ${JSON.stringify(ctx.topContent.slice(0,2).map(c=>({title:c.title,ctr:c.ctr,sales:c.sales})))}
Weak content: ${JSON.stringify(ctx.weakContent.slice(0,2).map(c=>({title:c.title,ctr:c.ctr})))}
Output JSON array of 5 recommendation objects.`
      }],
    })
    const raw   = (msg.content[0] as any).text ?? '[]'
    const clean = raw.replace(/```json?|```/g,'').trim()
    const arr   = JSON.parse(clean)
    return Array.isArray(arr) ? arr.slice(0,5) : []
  } catch {
    return []
  }
}

// ══════════════════════════════════════════════════════════════
// GET — Main analytics data (semua dari DB, nol kalau kosong)
// ══════════════════════════════════════════════════════════════
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user }, error:authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const url    = new URL(req.url)
    const period = (url.searchParams.get('period') ?? '30d') as string
    const since  = sinceDate(period)

    // ── Parallel fetch (defensif — .catch supaya satu gagal tidak block semua) ─
    const [profileR, tenantR, memoryR, assetsR, analyticsR, affiliateR] = await Promise.all([
      supabase.from('profiles').select('plan, store_name, seller_type').eq('id', user.id).single().then(r=>r, ()=>({data:null})),
      supabase.from('tenants').select('niche').eq('user_id', user.id).single().then(r=>r, ()=>({data:null})),
      supabase.from('ai_memory').select('platforms, tone').eq('user_id', user.id).maybeSingle().then(r=>r, ()=>({data:null})),
      supabase.from('ai_assets')
        .select('id,type,tool_name,title,file_url,created_at,preset_used,parameters,is_liked')
        .eq('user_id', user.id).eq('is_deleted', false)
        .gte('created_at', since).order('created_at', { ascending:false }).limit(200),
      supabase.from('content_analytics')
        .select('*').eq('user_id', user.id).gte('date', since)
        .order('date', { ascending:false }).limit(500),
      supabase.from('affiliate_links')
        .select('*').eq('user_id', user.id).order('total_commission', { ascending:false })
        .then(r=>r, ()=>({data:[]})),
    ])

    const assets    = assetsR.data    ?? []
    const analytics = analyticsR.data ?? []
    const afLinks   = (affiliateR as any).data ?? []
    const niche     = (tenantR as any).data?.niche ?? 'general'
    const platforms = ((memoryR as any).data?.platforms as string[]) ?? ['tiktok','shopee']

    const hasRealMetrics = analytics.length > 0

    // ── Content table (merge assets + analytics) ──────────────
    const contentTable = assets.map(asset => {
      const rows      = analytics.filter((r: any) => r.asset_id === asset.id)
      const sumV      = rows.reduce((s: number, r: any) => s + (r.views ?? 0), 0)
      const sumC      = rows.reduce((s: number, r: any) => s + (r.clicks ?? 0), 0)
      const sumS      = rows.reduce((s: number, r: any) => s + (r.sales ?? 0), 0)
      const sumRev    = rows.reduce((s: number, r: any) => s + (r.revenue ?? 0), 0)
      const sumEngage = rows.reduce((s: number, r: any) => s + (r.likes ?? 0) + (r.comments ?? 0) + (r.shares ?? 0), 0)
      const sumPV     = rows.reduce((s: number, r: any) => s + (r.product_views ?? 0), 0)
      const sumCart   = rows.reduce((s: number, r: any) => s + (r.add_to_cart ?? 0), 0)
      const sumSpend  = rows.reduce((s: number, r: any) => s + (r.ad_spend ?? 0), 0)
      const hasReal   = rows.length > 0

      const ctr  = sumV > 0 ? parseFloat(((sumC / sumV) * 100).toFixed(1)) : 0
      const cvr  = sumC > 0 ? parseFloat(((sumS / sumC) * 100).toFixed(1)) : 0
      const engR = sumV > 0 ? parseFloat(((sumEngage / sumV) * 100).toFixed(1)) : 0

      return {
        id:            asset.id,
        type:          asset.type,
        tool_name:     asset.tool_name ?? asset.type,
        title:         asset.title ?? `${asset.tool_name ?? asset.type} · ${new Date(asset.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}`,
        preset:        asset.preset_used,
        file_url:      asset.file_url,
        created_at:    asset.created_at,
        is_liked:      asset.is_liked,
        has_real_data: hasReal,
        views:         sumV,
        clicks:        sumC,
        sales:         sumS,
        revenue:       sumRev,
        engagement:    sumEngage,
        product_views: sumPV,
        add_to_cart:   sumCart,
        ad_spend:      sumSpend,
        ctr, cvr,
        engagement_rate: engR,
        roas:          sumSpend > 0 ? parseFloat((sumRev / sumSpend).toFixed(1)) : 0,
      }
    })

    // Sort
    const topContent    = [...contentTable].sort((a,b) => b.revenue - a.revenue).slice(0,6)
    const weakContent   = [...contentTable].sort((a,b) => a.ctr - b.ctr).slice(0,3)

    // ── KPI ───────────────────────────────────────────────────
    const totalViews   = contentTable.reduce((s,c) => s + c.views, 0)
    const totalClicks  = contentTable.reduce((s,c) => s + c.clicks, 0)
    const totalSales   = contentTable.reduce((s,c) => s + c.sales, 0)
    const totalRevenue = contentTable.reduce((s,c) => s + c.revenue, 0)
    const totalEngage  = contentTable.reduce((s,c) => s + c.engagement, 0)
    const n = contentTable.length || 1
    const avgCtr = parseFloat((contentTable.reduce((s,c) => s + c.ctr, 0) / n).toFixed(1))
    const avgCvr = parseFloat((contentTable.reduce((s,c) => s + c.cvr, 0) / n).toFixed(1))
    const avgEng = parseFloat((totalViews > 0 ? (totalEngage / totalViews) * 100 : 0).toFixed(1))

    // ── BeeScore™ — 0 kalau tidak ada data ────────────────────
    const beeScore = calcBeeScore({
      avgCtr, avgCvr,
      contentCount: assets.length,
      avgEngagement: avgEng,
      hasAnyMetrics: hasRealMetrics,
    })

    // ── Winning creative detector ─────────────────────────────
    const typeMap: Record<string,{ctr:number[];cvr:number[];rev:number[];count:number}> = {}
    contentTable.forEach(c => {
      const k = c.type
      if (!typeMap[k]) typeMap[k] = { ctr:[], cvr:[], rev:[], count:0 }
      typeMap[k].ctr.push(c.ctr); typeMap[k].cvr.push(c.cvr)
      typeMap[k].rev.push(c.revenue); typeMap[k].count++
    })
    const avg = (arr: number[]) => arr.length ? arr.reduce((s,v) => s + v, 0) / arr.length : 0
    const winningCreatives = Object.entries(typeMap).map(([type, d]) => ({
      type,
      label:  type.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()),
      avgCtr: parseFloat(avg(d.ctr).toFixed(1)),
      avgCvr: parseFloat(avg(d.cvr).toFixed(1)),
      avgRev: Math.round(avg(d.rev)),
      count:  d.count,
    })).sort((a,b) => b.avgCtr - a.avgCtr)

    const winnerType = winningCreatives[0]?.label ?? ''

    // ── Sales funnel ──────────────────────────────────────────
    const totalPV   = contentTable.reduce((s,c) => s + c.product_views, 0)
    const totalCart = contentTable.reduce((s,c) => s + c.add_to_cart, 0)
    const funnel = [
      { stage:'Views',         value:totalViews,  color:'#3B82F6' },
      { stage:'Klik',          value:totalClicks,  color:'#F59E0B' },
      { stage:'Product Views', value:totalPV,      color:'#8B5CF6' },
      { stage:'Add to Cart',   value:totalCart,    color:'#F97316' },
      { stage:'Orders',        value:totalSales,   color:'#059669' },
    ]
    let leakStage = ''
    if (totalViews > 0) {
      let maxLeakIdx = 1
      for (let i = 1; i < funnel.length; i++) {
        const prev = funnel[i-1].value || 1
        const drop = (prev - funnel[i].value) / prev
        const maxPrev = (funnel[maxLeakIdx-1].value || 1)
        const maxDrop = (maxPrev - funnel[maxLeakIdx].value) / maxPrev
        if (drop > maxDrop) maxLeakIdx = i
      }
      leakStage = funnel[maxLeakIdx].stage
    }

    // ── Platform breakdown ────────────────────────────────────
    const platformRows = analytics.reduce<Record<string,{views:number;clicks:number;sales:number;revenue:number;count:number}>>((acc, r: any) => {
      const p = r.platform ?? 'unknown'
      if (!acc[p]) acc[p] = { views:0, clicks:0, sales:0, revenue:0, count:0 }
      acc[p].views   += r.views   ?? 0
      acc[p].clicks  += r.clicks  ?? 0
      acc[p].sales   += r.sales   ?? 0
      acc[p].revenue += r.revenue ?? 0
      acc[p].count++
      return acc
    }, {})
    const platformData = Object.entries(platformRows).map(([platform, d]) => ({
      platform, ...d,
      ctr: d.views > 0 ? parseFloat(((d.clicks / d.views) * 100).toFixed(1)) : 0,
    })).sort((a,b) => b.revenue - a.revenue)

    // ── Affiliate ─────────────────────────────────────────────
    const totalAfClicks = afLinks.reduce((s: number, l: any) => s + (l.total_clicks ?? 0), 0)
    const totalAfComm   = afLinks.reduce((s: number, l: any) => s + (l.total_commission ?? 0), 0)
    const totalAfSales  = afLinks.reduce((s: number, l: any) => s + (l.total_sales ?? 0), 0)
    const globalEpc     = totalAfClicks > 0 ? Math.round(totalAfComm / totalAfClicks) : 0

    const catMap: Record<string,{clicks:number;commission:number;sales:number}> = {}
    afLinks.forEach((l: any) => {
      const cat = l.category ?? 'Lainnya'
      if (!catMap[cat]) catMap[cat] = { clicks:0, commission:0, sales:0 }
      catMap[cat].clicks     += l.total_clicks     ?? 0
      catMap[cat].commission += l.total_commission ?? 0
      catMap[cat].sales      += l.total_sales      ?? 0
    })
    const affiliateByCat = Object.entries(catMap).map(([cat,d]) => ({
      category: cat, clicks: d.clicks, commission: d.commission, sales: d.sales,
      epc: d.clicks > 0 ? Math.round(d.commission / d.clicks) : 0,
    })).sort((a,b) => b.epc - a.epc)

    // ── Chart data (REAL only — 0 kalau tidak ada metrik) ─────
    const days     = period === '7d' ? 7 : period === '30d' ? 30 : 12
    const isWeekly = period === '90d'
    const chartData = Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i) * (isWeekly ? 7 : 1))
      const lbl = isWeekly
        ? `W${i+1}`
        : d.toLocaleDateString('id-ID', { day:'2-digit', month:'short' })
      const dateStr = d.toISOString().split('T')[0]
      const dayRows = analytics.filter((r: any) => {
        if (isWeekly) {
          const rDate = new Date(r.date)
          const weekStart = new Date(d); weekStart.setDate(d.getDate() - 6)
          return rDate >= weekStart && rDate <= d
        }
        return r.date === dateStr
      })
      return {
        label:   lbl,
        views:   dayRows.reduce((s: number, r: any) => s + (r.views ?? 0), 0),
        clicks:  dayRows.reduce((s: number, r: any) => s + (r.clicks ?? 0), 0),
        sales:   dayRows.reduce((s: number, r: any) => s + (r.sales ?? 0), 0),
        revenue: dayRows.reduce((s: number, r: any) => s + (r.revenue ?? 0), 0),
      }
    })

    // ── Product performance ───────────────────────────────────
    const productPerf = winningCreatives.map(wc => ({
      ...wc,
      totalRevenue: contentTable.filter(c => c.type === wc.type).reduce((s,c) => s + c.revenue, 0),
      totalSales:   contentTable.filter(c => c.type === wc.type).reduce((s,c) => s + c.sales, 0),
    }))

    // ── AI Recommendations (HANYA kalau ada data) ─────────────
    const recommendations = await getAIRecommendations({
      beeScore, topContent, weakContent, winnerType,
      platform: platforms[0] ?? 'tiktok',
      niche, period,
    })

    // ── Competitor — KOSONG (belum ada sumber nyata) ──────────
    // Tidak ada data hardcoded. Competitor analytics = future feature.
    const competitorData = {
      topFormats:   [] as string[],
      topHooks:     [] as string[],
      topCTA:       [] as string[],
      trendVisuals: [] as string[],
      insight:      '',
    }

    return NextResponse.json({
      period,
      kpi: {
        totalViews, totalClicks, totalSales, totalRevenue,
        totalEngage, avgCtr, avgCvr, avgEngagement: avgEng,
        assetsCreated: assets.length,
        hasRealData: hasRealMetrics,
      },
      beeScore,
      contentTable:     contentTable.slice(0, 24),
      topContent,       weakContent,
      winningCreatives: winningCreatives.slice(0, 8),
      funnel,           leakStage,
      platformData,
      productPerf:      productPerf.slice(0, 8),
      affiliate: {
        totalClicks: totalAfClicks, totalCommission: totalAfComm,
        totalSales:  totalAfSales,  globalEpc,
        links:       afLinks.slice(0, 20),
        byCat:       affiliateByCat,
      },
      chartData,
      recommendations,
      competitor: competitorData,
      sellerProfile: { niche, platforms },
      generatedAt: new Date().toISOString(),
    })

  } catch (err: any) {
    console.error('[analytics GET]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status:500 })
  }
}

// ── POST — upsert manual metric entry ─────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const body = await req.json()
    const { asset_id, platform, date, views, clicks, sales, revenue, likes, comments, shares, saves, product_views, add_to_cart, ad_spend, is_boosted } = body

    if (!platform || !date) return NextResponse.json({ error:'Platform dan tanggal wajib diisi' }, { status:400 })

    const { data, error } = await supabase.from('content_analytics').upsert({
      user_id: user.id, asset_id: asset_id ?? null,
      platform, date,
      views:         parseInt(views)         || 0,
      clicks:        parseInt(clicks)        || 0,
      sales:         parseInt(sales)         || 0,
      revenue:       parseInt(revenue)       || 0,
      likes:         parseInt(likes)         || 0,
      comments:      parseInt(comments)      || 0,
      shares:        parseInt(shares)        || 0,
      saves:         parseInt(saves)         || 0,
      product_views: parseInt(product_views) || 0,
      add_to_cart:   parseInt(add_to_cart)   || 0,
      ad_spend:      parseInt(ad_spend)      || 0,
      is_boosted:    is_boosted ?? false,
      source:        'manual',
    }, { onConflict:'user_id,asset_id,platform,date' }).select().single()

    if (error) throw error
    return NextResponse.json({ success:true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status:500 })
  }
}

// ── DELETE ─────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error:'id required' }, { status:400 })
    await supabase.from('content_analytics').delete().eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ success:true })
  } catch (err: any) {
    return NextResponse.json({ error:err?.message }, { status:500 })
  }
}