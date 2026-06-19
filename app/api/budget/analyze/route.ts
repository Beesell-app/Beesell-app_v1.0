// app/api/budget/analyze/route.ts
// ══════════════════════════════════════════════════════════════
// BUDGET OPTIMIZER — Analyze API
// ══════════════════════════════════════════════════════════════
//
// POST /api/budget/analyze
// Body: {
//   campaignId?, creatives: CreativeMetric[],
//   config: GuardianConfig,
//   currentSpend: number, currentHour: number,
//   platform: PlatformId
// }
//
// Returns full OptimizerResult:
//   - allocations (per creative with action + reasoning)
//   - alerts (sorted by severity)
//   - health score + status
//   - AI insights (Claude — 5 strategic tips)
//   - winners + losers classified

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  computeAllocations, generateAlerts, calcHealthScore,
  calcPerformanceScore, classifyStatus, expectedSpendPct,
  PLATFORM_BENCHMARKS, ALLOCATION_RULES,
  fmtRp, fmtROAS,
  type CreativeMetric, type GuardianConfig,
  type OptimizerResult, type PlatformId,
} from '@/lib/budget/types'

export const dynamic     = 'force-dynamic'
export const maxDuration = 45

const getAI = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function generateInsights(params: {
  result:       Omit<OptimizerResult, 'insights'>
  platform:     PlatformId
  niche:        string
  targetROAS:   number
}): Promise<string[]> {
  try {
    const ai  = getAI()
    const { result } = params

    const msg = await ai.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 800,
      system: `You are a performance marketing budget strategist for Indonesian e-commerce sellers.
Generate 5 specific, actionable budget optimization insights in bahasa Indonesia.
Reference specific numbers from the data.
Output ONLY valid JSON array of strings. No markdown.`,
      messages: [{
        role: 'user',
        content: `Budget optimization analysis:
Platform: ${params.platform} | Niche: ${params.niche}
Health Score: ${result.healthScore}/100 (${result.health})
Total Budget: ${fmtRp(result.totalBudget)}/day
Current Spend: ${fmtRp(result.currentSpend)} (${((result.currentSpend/result.totalBudget)*100).toFixed(0)}%)
Overall ROAS: ${result.totalROAS.toFixed(1)}x (target: ${params.targetROAS}x)
Winners: ${result.winners.length} creative (avg ROAS: ${result.winners.length ? (result.winners.reduce((s,c)=>s+c.roas,0)/result.winners.length).toFixed(1) : 0}x)
Losers: ${result.losers.length} creative (avg ROAS: ${result.losers.length ? (result.losers.reduce((s,c)=>s+c.roas,0)/result.losers.length).toFixed(1) : 0}x)
Alerts: ${result.alerts.map(a => a.title).join('; ')}
Budget actions: ${result.allocations.map(a => `${a.creativeName}: ${a.action} (${a.changePct > 0 ? '+' : ''}${a.changePct}%)`).join('; ')}

Generate 5 specific insights. JSON array of strings only.`,
      }],
    })

    const raw  = (msg.content[0] as any).text ?? '[]'
    const arr  = JSON.parse(raw.replace(/```json?|```/g, '').trim())
    return Array.isArray(arr) ? arr.slice(0, 5) : []
  } catch {
    // Fallback insights
    const { result } = params
    const fb: string[] = []
    if (result.winners.length > 0) {
      fb.push(`🚀 ${result.winners.length} creative winner dengan ROAS ${result.winners[0]?.roas.toFixed(1)}x — alokasikan 70%+ budget ke creative ini untuk maksimalkan revenue.`)
    }
    if (result.losers.length > 0) {
      fb.push(`⏸️ ${result.losers.length} creative underperforming — pause untuk hemat ${fmtRp(result.losers.reduce((s,c)=>s+c.budget,0))}/hari dan realokasikan ke winner.`)
    }
    fb.push(`💡 ROAS keseluruhan ${result.totalROAS.toFixed(1)}x vs target ${params.targetROAS}x — ${result.totalROAS >= params.targetROAS ? 'sudah on target, pertimbangkan scale budget total' : 'fokus pada pengurangan spend di creative ROAS rendah'}.`)
    fb.push(`📊 Health score ${result.healthScore}/100 — ${result.healthScore >= 70 ? 'campaign sehat, lanjutkan optimasi mingguan' : 'butuh perhatian segera: review creative, audience, dan bid strategy'}.`)
    fb.push(`🔄 Jalankan A/B test 2-3 creative baru setiap minggu agar selalu ada pipeline winner untuk di-scale.`)
    return fb.slice(0, 5)
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const body = await req.json()
    let {
      campaignId, platform = 'meta', niche = 'general',
      creatives = [] as CreativeMetric[],
      config    = {} as Partial<GuardianConfig>,
      currentSpend = 0,
      currentHour  = new Date().getHours(),
    } = body

    // Fill defaults for guardian config
    const guardianConfig: GuardianConfig = {
      campaignId:            campaignId ?? 'unknown',
      totalDailyBudget:      config.totalDailyBudget ?? creatives.reduce((s:number,c:any)=>s+(c.budget||0),0),
      softCap:               config.softCap           ?? 80,
      hardCap:               config.hardCap           ?? 95,
      roasFloor:             config.roasFloor          ?? PLATFORM_BENCHMARKS[platform as PlatformId].minROAS,
      roasCeiling:           config.roasCeiling        ?? PLATFORM_BENCHMARKS[platform as PlatformId].greatROAS,
      cpaTarget:             config.cpaTarget,
      frequencyCapWarning:   config.frequencyCapWarning ?? ALLOCATION_RULES.fatigueFrequencyMax,
      ctrDropThreshold:      config.ctrDropThreshold   ?? 20,
      spendSpikeThreshold:   config.spendSpikeThreshold ?? 30,
      autoPauseEnabled:      config.autoPauseEnabled   ?? false,
      autoScaleEnabled:      config.autoScaleEnabled   ?? false,
      notifyEmail:           config.notifyEmail        ?? true,
      notifyWhatsapp:        config.notifyWhatsapp      ?? false,
      checkIntervalMin:      config.checkIntervalMin   ?? 60,
    }

    if (guardianConfig.totalDailyBudget === 0) {
      return NextResponse.json({ error:'totalDailyBudget tidak boleh 0' }, { status:400 })
    }

    // Enrich creatives with computed scores
    const enriched: CreativeMetric[] = creatives.map((c: any) => {
      const ctr  = c.impressions > 0 ? (c.clicks   / c.impressions) * 100 : 0
      const cpm  = c.impressions > 0 ? (c.spend    / c.impressions) * 1000 : 0
      const cpc  = c.clicks      > 0 ? c.spend     / c.clicks       : 0
      const roas = c.spend       > 0 ? c.revenue   / c.spend        : 0
      const cvr  = c.clicks      > 0 ? (c.conversions / c.clicks)   * 100 : 0
      const cpa  = c.conversions > 0 ? c.spend     / c.conversions  : 0
      const aov  = c.conversions > 0 ? c.revenue   / c.conversions  : 0

      const enrichedC: CreativeMetric = {
        ...c, ctr, cpm, cpc, roas, cvr, cpa, aov,
        roasDelta: c.roasDelta ?? 0,
        spendDelta:c.spendDelta ?? 0,
        ctrDelta:  c.ctrDelta  ?? 0,
        daysSince: c.daysSince ?? 3,
        frequency: c.frequency ?? 1.5,
        budgetPct: guardianConfig.totalDailyBudget > 0
          ? (c.budget / guardianConfig.totalDailyBudget) * 100 : 0,
        performanceScore: 0,
        status:    c.status ?? 'monitoring',
        lastUpdated: c.lastUpdated ?? new Date().toISOString(),
      }
      enrichedC.performanceScore = calcPerformanceScore(enrichedC, platform as PlatformId)
      enrichedC.status           = classifyStatus(enrichedC, platform as PlatformId)
      return enrichedC
    })

    // Compute allocations
    const allocations = computeAllocations(
      enriched, guardianConfig.totalDailyBudget, platform as PlatformId
    )

    // Generate alerts
    const alerts = generateAlerts(enriched, guardianConfig, currentSpend, currentHour)

    // Classify winners / losers
    const bench    = PLATFORM_BENCHMARKS[platform as PlatformId]
    const winners  = enriched.filter(c => c.status === 'scaling' || c.roas >= bench.goodROAS)
    const losers   = enriched.filter(c => c.status === 'underperforming' || c.status === 'paused')

    // Totals
    const totalROAS    = enriched.length > 0
      ? enriched.reduce((s,c) => s + c.roas, 0) / enriched.length : 0
    const totalRevenue = enriched.reduce((s,c) => s + c.revenue, 0)
    const projectedSpend = allocations.reduce((s,a) => s + (a.targetBudget ?? 0), 0)

    // Health score
    const { score:healthScore, health } = calcHealthScore(
      enriched, currentSpend, guardianConfig.totalDailyBudget, guardianConfig.roasFloor, currentHour
    )

    const partialResult = {
      campaignId:     campaignId ?? 'manual',
      runAt:          new Date().toISOString(),
      totalBudget:    guardianConfig.totalDailyBudget,
      currentSpend,
      projectedSpend,
      totalROAS:      parseFloat(totalROAS.toFixed(2)),
      totalRevenue,
      targetROAS:     guardianConfig.roasFloor,
      health,
      healthScore,
      allocations,
      alerts,
      winners,
      losers,
      nextCheckAt: new Date(Date.now() + guardianConfig.checkIntervalMin * 60 * 1000).toISOString(),
    }

    // AI insights (parallel)
    const insights = await generateInsights({
      result: partialResult,
      platform: platform as PlatformId,
      niche,
      targetROAS: guardianConfig.roasFloor,
    })

    const result: OptimizerResult = { ...partialResult, insights }

    // Optionally save to DB
    if (campaignId) {
      try {
        await supabase.from('budget_optimizer_runs').insert({
          user_id:       user.id,
          campaign_id:   campaignId,
          health_score:  healthScore,
          total_roas:    totalROAS,
          total_spend:   currentSpend,
          alerts_count:  alerts.length,
          winner_count:  winners.length,
          loser_count:   losers.length,
          result_json:   result,
          created_at:    new Date().toISOString(),
        })
      } catch {}  // non-blocking
    }

    return NextResponse.json({ success:true, ...result })

  } catch (err: any) {
    console.error('[budget/analyze]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status:500 })
  }
}