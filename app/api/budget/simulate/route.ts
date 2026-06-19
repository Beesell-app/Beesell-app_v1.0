// app/api/budget/simulate/route.ts
// ══════════════════════════════════════════════════════════════
// BUDGET SIMULATOR — Project performance under budget scenarios
// ══════════════════════════════════════════════════════════════
//
// POST /api/budget/simulate
// Body: {
//   creatives:     CreativeMetric[]
//   totalBudget:   number            // current daily budget IDR
//   scenarios?:    { multiplier: number; label: string }[]
//   platform:      PlatformId
//   daysAhead:     number            // 7 | 14 | 30
// }
//
// Returns per scenario:
//   - projectedSpend, projectedRevenue, projectedROAS
//   - perCreativeAlloc (how budget distributes)
//   - confidenceLevel (based on data age / volume)
//   - risk level
//   - AI narrative summary

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic     = 'force-dynamic'
export const maxDuration = 30

type CreativeStatus = 'winning' | 'losing' | 'paused' | string

type CreativeMetric = {
  id: string
  name: string
  roas: number
  ctr: number
  cvr: number
  revenue: number
  spend: number
  budget: number
  impressions: number
  daysSince: number
  status: CreativeStatus
}

type PlatformId = 'meta' | 'tiktok' | 'google'

interface BudgetScenario {
  multiplier: number
  label: string
}

interface PerCreativeAllocation {
  id: string
  name: string
  dailyBudget: number
  dailyRevenue: number
  roas: number
  changePct: number
}

type ConfidenceLevel = 'high' | 'medium' | 'low'

type RiskLevel = 'low' | 'medium' | 'high'

interface SimulationScenarioResult {
  multiplier: number
  dailyBudget: number
  totalSpend: number
  totalRevenue: number
  dailyRevenue: number
  blendedROAS: number
  dailyProfit: number
  totalProfit: number
  perCreative: PerCreativeAllocation[]
  riskLevel: RiskLevel
}

interface ScenarioResult extends SimulationScenarioResult {
  label: string
  icon: string
  confidence: ConfidenceLevel
}

interface TrendPoint {
  day: string
  conservative: number
  statusQuo: number
  aggressive: number
}

interface SimulationRequestBody {
  creatives?: CreativeMetric[]
  totalBudget?: number
  platform?: PlatformId
  daysAhead?: number
  scenarios?: BudgetScenario[]
}

// ── Revenue response curve (diminishing returns) ─────────────
// At 2x budget, ROAS decreases ~15% due to audience saturation
// At 0.5x budget, ROAS increases ~10% (more selective bidding)
function roasAtMultiplier(baseROAS: number, multiplier: number): number {
  if (multiplier <= 0) return 0
  // Diminishing returns: ln-based curve
  const factor = multiplier <= 1
    ? 1 + (1 - multiplier) * 0.12       // budget reduction → slight ROAS boost
    : 1 - Math.log(multiplier) * 0.15   // budget increase → ROAS compression
  return Math.max(0.3, baseROAS * factor)
}

// ── Confidence level based on data quality ────────────────────
function getConfidence(creatives: CreativeMetric[]): ConfidenceLevel {
  const avgDays   = creatives.reduce((s, c) => s + c.daysSince, 0) / (creatives.length || 1)
  const avgImpr   = creatives.reduce((s, c) => s + c.impressions, 0) / (creatives.length || 1)
  if (avgDays >= 7 && avgImpr >= 10000) return 'high'
  if (avgDays >= 3 && avgImpr >= 3000)  return 'medium'
  return 'low'
}

// ── Simulate one scenario ─────────────────────────────────────
function simulateScenario(params: {
  creatives:   CreativeMetric[]
  multiplier:  number
  baseBudget:  number
  daysAhead:   number
  platform:    PlatformId
}): SimulationScenarioResult {
  const { creatives, multiplier, baseBudget, daysAhead } = params

  // Compute scores to distribute budget proportionally
  const scored = creatives.map(c => ({
    ...c,
    score: Math.max(0, c.roas * 0.6 + c.ctr * 0.2 + (c.status === 'winning' ? 20 : 0)),
  }))
  const totalScore = scored.reduce((s, c) => s + c.score, 0) || 1

  const newDailyBudget = baseBudget * multiplier

  const perCreative = scored.map(c => {
    const sharePct    = (c.score / totalScore)
    const dailyBudget = newDailyBudget * sharePct
    const newROAS     = roasAtMultiplier(c.roas, multiplier)
    const dailyRev    = dailyBudget * newROAS
    return {
      id:           c.id,
      name:         c.name,
      dailyBudget:  Math.round(dailyBudget),
      dailyRevenue: Math.round(dailyRev),
      roas:         parseFloat(newROAS.toFixed(2)),
      changePct:    Math.round((multiplier - 1) * 100),
    }
  })

  const totalDailySpend   = newDailyBudget
  const totalDailyRevenue = perCreative.reduce((s, c) => s + c.dailyRevenue, 0)
  const blendedROAS       = totalDailySpend > 0 ? totalDailyRevenue / totalDailySpend : 0

  return {
    multiplier,
    dailyBudget:    Math.round(newDailyBudget),
    totalSpend:     Math.round(newDailyBudget * daysAhead),
    totalRevenue:   Math.round(totalDailyRevenue * daysAhead),
    dailyRevenue:   Math.round(totalDailyRevenue),
    blendedROAS:    parseFloat(blendedROAS.toFixed(2)),
    dailyProfit:    Math.round(totalDailyRevenue - newDailyBudget),
    totalProfit:    Math.round((totalDailyRevenue - newDailyBudget) * daysAhead),
    perCreative,
    riskLevel:      multiplier >= 1.5 ? 'high' : multiplier >= 1.2 ? 'medium' : 'low',
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const body = await req.json() as SimulationRequestBody
    const {
      creatives   = [] as CreativeMetric[],
      totalBudget = 1_500_000,
      platform    = 'meta',
      daysAhead   = 14,
      scenarios   = [
        { multiplier:0.5,  label:'-50% Budget'  },
        { multiplier:0.8,  label:'-20% Budget'  },
        { multiplier:1.0,  label:'Status Quo'   },
        { multiplier:1.2,  label:'+20% Budget'  },
        { multiplier:1.5,  label:'+50% Budget'  },
        { multiplier:2.0,  label:'+100% Budget' },
      ],
    } = body

    if (!creatives.length) {
      return NextResponse.json({ error:'Minimal 1 creative diperlukan untuk simulasi' }, { status:400 })
    }

    // Run all scenarios
    const results: ScenarioResult[] = scenarios.map((s: BudgetScenario) => ({
      ...simulateScenario({ creatives, multiplier:s.multiplier, baseBudget:totalBudget, daysAhead, platform }),
      label:      s.label,
      icon:       s.multiplier < 1 ? '📉' : s.multiplier > 1.1 ? '📈' : '📊',
      confidence: getConfidence(creatives),
    }))

    // Find optimal (best ROAS * Revenue balance)
    const optimal = results.reduce((best, curr) => {
      const score = curr.blendedROAS * 0.6 + (curr.totalProfit / 1_000_000) * 0.4
      const bscore = best.blendedROAS * 0.6 + (best.totalProfit / 1_000_000) * 0.4
      return score > bscore ? curr : best
    }, results[0])

    // Trend chart: daily projection over daysAhead
    const trendDays = Math.min(daysAhead, 30)
    const statusQuo = results.find(r => r.multiplier === 1.0) ?? results[Math.floor(results.length/2)]
    const aggressive = results[results.length - 1]
    const conservative = results[0]

    const trendChart = Array.from({ length:trendDays }, (_, i) => {
      const day = i + 1
      // Revenue accumulates with slight momentum effect
      const momentum = Math.min(1.1, 1 + i * 0.005)
      return {
        day: `D${day}`,
        conservative: Math.round(conservative.dailyRevenue * day * momentum),
        statusQuo:    Math.round(statusQuo.dailyRevenue    * day * momentum),
        aggressive:   Math.round(aggressive.dailyRevenue   * day * momentum),
      }
    })

    // AI summary (quick, no streaming needed)
    let aiSummary = ''
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{
          role:    'user',
          content: `Indonesian e-commerce campaign budget simulation results:
Current budget: Rp${Math.round(totalBudget/1000)}K/day | Platform: ${platform} | Days: ${daysAhead}
Status quo ROAS: ${statusQuo.blendedROAS}x | Revenue: Rp${Math.round(statusQuo.totalRevenue/1000000*10)/10}Jt
Optimal scenario: ${optimal.label} | ROAS: ${optimal.blendedROAS}x | Revenue: Rp${Math.round(optimal.totalRevenue/1000000*10)/10}Jt
Confidence: ${getConfidence(creatives)}

Write a 2-sentence strategic recommendation in bahasa Indonesia. Be specific about which scenario to choose and why. No markdown.`,
        }],
      })
      aiSummary = (msg.content[0] as any).text ?? ''
    } catch { /* silent */ }

    return NextResponse.json({
      success:     true,
      scenarios:   results,
      optimalIdx:  results.findIndex(r => r.multiplier === optimal.multiplier),
      optimal,
      trendChart,
      daysAhead,
      totalBudget,
      platform,
      confidence:  getConfidence(creatives),
      aiSummary,
    })

  } catch (err: any) {
    console.error('[budget/simulate]', err)
    return NextResponse.json({ error:err?.message ?? 'Simulation gagal' }, { status:500 })
  }
}