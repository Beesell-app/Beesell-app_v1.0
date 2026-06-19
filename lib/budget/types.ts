// lib/budget/types.ts
// ══════════════════════════════════════════════════════════════
// BUDGET OPTIMIZER & AUTO-BIDDING — Types & Engine Constants
// ══════════════════════════════════════════════════════════════
//
// Three modules:
//   1. Smart Budget Allocation  — distribute budget to best performers
//   2. ROAS Optimizer           — pause losers, scale winners
//   3. Daily Budget Guardian    — alert + auto-pause on overspend

import type { PlatformId } from '@/lib/campaign/types'

// ── Status types ──────────────────────────────────────────────
export type CreativeStatus =
  | 'scaling'       // ROAS >= threshold × 1.5, budget being increased
  | 'stable'        // performing on target
  | 'monitoring'    // borderline — watch closely
  | 'underperforming' // ROAS < threshold — candidate for pause
  | 'paused'        // auto-paused by optimizer
  | 'testing'       // < minimum data (< 3 days or < 500 impressions)

export type AlertSeverity  = 'critical' | 'warning' | 'info'
export type AlertType =
  | 'budget_exceeded'
  | 'budget_near_limit'
  | 'roas_below_threshold'
  | 'roas_winner_detected'
  | 'spend_spike'
  | 'ctr_drop'
  | 'creative_fatigue'
  | 'daily_cap_hit'
  | 'auto_pause_triggered'
  | 'scale_recommendation'

export type BidAction   = 'increase' | 'decrease' | 'pause' | 'hold' | 'scale'
export type PacingType  = 'standard' | 'accelerated' | 'day_parting'
export type OptStrategy = 'maximize_roas' | 'maximize_conversions' | 'maximize_reach' | 'target_cpa'

// ── Creative performance metric ────────────────────────────────
export interface CreativeMetric {
  id:           string
  name:         string
  platform:     PlatformId
  adSetId?:     string
  campaignId?:  string

  // Core metrics
  impressions:  number
  reach:        number
  clicks:       number
  spend:        number   // IDR
  revenue:      number   // IDR attributed
  conversions:  number
  frequency:    number   // avg times shown per user

  // Computed
  ctr:          number   // clicks/impressions × 100
  cpm:          number   // spend/impressions × 1000
  cpc:          number   // spend/clicks
  roas:         number   // revenue/spend
  cvr:          number   // conversions/clicks × 100
  cpa:          number   // spend/conversions (cost per acquisition)
  aov:          number   // revenue/conversions (avg order value)

  // Trend (vs previous period)
  roasDelta:    number   // +/- change
  spendDelta:   number
  ctrDelta:     number

  // Meta
  status:       CreativeStatus
  daysSince:    number   // days since launch
  budget:       number   // current daily budget IDR
  budgetPct:    number   // % of total campaign budget
  lastUpdated:  string

  // Scoring
  performanceScore: number   // 0-100 composite
  confidenceLevel:  number   // 0-100 (data maturity)
}

// ── Budget allocation plan ────────────────────────────────────
export interface BudgetAllocation {
  creativeId:    string
  creativeName:  string
  currentBudget: number   // IDR/day
  targetBudget:  number   // IDR/day recommended
  changePct:     number   // + increase / - decrease
  action:        BidAction
  reason:        string
  confidence:    number   // 0-100
  projectedROAS: number
  projectedRev:  number
}

// ── Alert ─────────────────────────────────────────────────────
export interface BudgetAlert {
  id:         string
  type:       AlertType
  severity:   AlertSeverity
  title:      string
  message:    string
  creativeId?:string
  platformId?:PlatformId
  metric?:    string     // which metric triggered
  value?:     number     // current value
  threshold?: number     // threshold that was crossed
  action?:    BidAction  // suggested or taken action
  autoActed:  boolean    // did the system auto-act?
  timestamp:  string
  resolved:   boolean
}

// ── Guardian config ────────────────────────────────────────────
export interface GuardianConfig {
  campaignId:          string
  totalDailyBudget:    number   // IDR
  softCap:             number   // % of daily budget (alert at)
  hardCap:             number   // % of daily budget (pause at)
  roasFloor:           number   // minimum acceptable ROAS (e.g. 2.0)
  roasCeiling:         number   // scale trigger (e.g. 4.0)
  cpaTarget?:          number   // IDR — target cost per acquisition
  frequencyCapWarning: number   // alert when avg frequency > this
  ctrDropThreshold:    number   // % drop in CTR to trigger alert
  spendSpikeThreshold: number   // % spike in hourly spend to alert
  autoPauseEnabled:    boolean
  autoScaleEnabled:    boolean
  notifyEmail:         boolean
  notifyWhatsapp:      boolean
  checkIntervalMin:    number   // how often to check (minutes)
}

// ── Optimizer result ──────────────────────────────────────────
export interface OptimizerResult {
  campaignId:    string
  runAt:         string
  totalBudget:   number
  currentSpend:  number
  projectedSpend:number
  totalROAS:     number
  targetROAS:    number
  health:        'excellent' | 'good' | 'needs_attention' | 'critical'
  healthScore:   number     // 0-100
  allocations:   BudgetAllocation[]
  alerts:        BudgetAlert[]
  winners:       CreativeMetric[]
  losers:        CreativeMetric[]
  insights:      string[]   // AI-generated
  nextCheckAt:   string
}

// ── Platform benchmark thresholds ────────────────────────────
export const PLATFORM_BENCHMARKS: Record<PlatformId, {
  minROAS:      number   // minimum acceptable
  goodROAS:     number   // good performance
  greatROAS:    number   // scale signal
  avgCTR:       number   // %
  minCTR:       number   // below = creative fatigue
  avgCPM:       number   // IDR
  avgCVR:       number   // %
  minImpressions:number  // before making decisions
  minDays:      number   // days of data needed
}> = {
  meta: {
    minROAS:1.5, goodROAS:3.0, greatROAS:5.0,
    avgCTR:1.8, minCTR:0.8,
    avgCPM:18000, avgCVR:1.5,
    minImpressions:2000, minDays:3,
  },
  tiktok: {
    minROAS:1.2, goodROAS:2.5, greatROAS:4.5,
    avgCTR:2.4, minCTR:1.0,
    avgCPM:28000, avgCVR:1.2,
    minImpressions:3000, minDays:3,
  },
  'google-display': {
    minROAS:2.0, goodROAS:4.0, greatROAS:7.0,
    avgCTR:0.46, minCTR:0.2,
    avgCPM:10000, avgCVR:2.0,
    minImpressions:5000, minDays:5,
  },
}

// ── Scoring weights ───────────────────────────────────────────
export const SCORE_WEIGHTS = {
  roas:        0.40,   // most important for e-commerce
  cvr:         0.20,
  ctr:         0.15,
  cpa:         0.15,
  frequency:   0.10,   // lower = fresher (inverted)
}

// ── Budget allocation rules ───────────────────────────────────
export const ALLOCATION_RULES = {
  maxBudgetIncreasePct:  30,   // max +30% per optimization cycle
  maxBudgetDecreasePct:  50,   // max -50% per optimization cycle
  minBudgetIDR:          15000,// never go below min (Meta: Rp15K/day)
  winnerShareMin:        0.50, // winners get at least 50% of total
  winnerShareMax:        0.85, // winners get at most 85% of total
  pauseROASThreshold:    0.8,  // pause if ROAS < minROAS × 0.8
  scaleROASThreshold:    1.5,  // scale if ROAS > goodROAS × 1.5
  testingBudgetPct:      0.10, // 10% always reserved for new creatives
  fatigueFrequencyMax:   4.0,  // pause/refresh if frequency > 4
}

// ── Pacing patterns (hour of day multipliers) ─────────────────
// Derived from Indonesian e-commerce purchase data
export const PACING_MULTIPLIERS: Record<number, number> = {
  0:0.2, 1:0.1, 2:0.1, 3:0.1, 4:0.1, 5:0.2,
  6:0.5, 7:0.8, 8:1.0, 9:1.2, 10:1.3, 11:1.2,
  12:1.1, 13:1.0, 14:0.9, 15:0.9, 16:1.0, 17:1.1,
  18:1.3, 19:1.4, 20:1.5, 21:1.4, 22:1.2, 23:0.8,
}

// Expected spend by hour (cumulative %)
export function expectedSpendPct(currentHour: number): number {
  const total = Object.values(PACING_MULTIPLIERS).reduce((s, v) => s + v, 0)
  let cum = 0
  for (let h = 0; h <= currentHour; h++) {
    cum += PACING_MULTIPLIERS[h] ?? 0
  }
  return (cum / total) * 100
}

// ── Performance score calculator ─────────────────────────────
export function calcPerformanceScore(
  metric: Pick<CreativeMetric, 'roas'|'cvr'|'ctr'|'cpa'|'frequency'|'impressions'|'daysSince'>,
  platform: PlatformId
): number {
  const bench = PLATFORM_BENCHMARKS[platform]

  // Not enough data — cap at 40
  if (metric.impressions < bench.minImpressions || metric.daysSince < bench.minDays) {
    return Math.min(40, Math.round((metric.impressions / bench.minImpressions) * 40))
  }

  // ROAS score (0-100)
  const roasScore = Math.min(100,
    metric.roas <= 0 ? 0 :
    metric.roas >= bench.greatROAS ? 100 :
    Math.round((metric.roas / bench.greatROAS) * 100)
  )

  // CVR score
  const cvrScore  = Math.min(100, Math.round((metric.cvr / (bench.avgCVR * 2)) * 100))

  // CTR score
  const ctrScore  = Math.min(100, Math.round((metric.ctr / (bench.avgCTR * 2)) * 100))

  // CPA score (inverted — lower = better)
  const cpaScore  = metric.cpa <= 0 ? 0 :
    Math.min(100, Math.round(100 - Math.min(100, ((metric.cpa - 30000) / 200000) * 100)))

  // Frequency score (inverted — lower = better)
  const freqScore = Math.min(100,
    Math.round(100 - Math.min(100, ((metric.frequency - 1) / (ALLOCATION_RULES.fatigueFrequencyMax - 1)) * 100))
  )

  return Math.round(
    roasScore * SCORE_WEIGHTS.roas +
    cvrScore  * SCORE_WEIGHTS.cvr  +
    ctrScore  * SCORE_WEIGHTS.ctr  +
    cpaScore  * SCORE_WEIGHTS.cpa  +
    freqScore * SCORE_WEIGHTS.frequency
  )
}

// ── Status classifier ─────────────────────────────────────────
export function classifyStatus(
  metric: CreativeMetric,
  platform: PlatformId
): CreativeStatus {
  const bench = PLATFORM_BENCHMARKS[platform]
  if (metric.impressions < bench.minImpressions || metric.daysSince < bench.minDays) return 'testing'
  if (metric.status === 'paused') return 'paused'

  const score = metric.performanceScore
  if (score >= 80 && metric.roas >= bench.goodROAS * 1.5) return 'scaling'
  if (score >= 60) return 'stable'
  if (score >= 40) return 'monitoring'
  if (metric.roas < bench.minROAS * ALLOCATION_RULES.pauseROASThreshold) return 'underperforming'
  return 'monitoring'
}

// ── Budget reallocation engine ────────────────────────────────
export function computeAllocations(
  creatives:   CreativeMetric[],
  totalBudget: number,
  platform:    PlatformId
): BudgetAllocation[] {
  const bench   = PLATFORM_BENCHMARKS[platform]
  const rules   = ALLOCATION_RULES

  // Reserve testing budget
  const testingBudget = Math.floor(totalBudget * rules.testingBudgetPct)
  const operaBudget   = totalBudget - testingBudget

  // Separate by status
  const active  = creatives.filter(c => !['paused','testing'].includes(c.status))
  const testing = creatives.filter(c => c.status === 'testing')

  if (active.length === 0) {
    return creatives.map(c => ({
      creativeId:    c.id,
      creativeName:  c.name,
      currentBudget: c.budget,
      targetBudget:  c.budget,
      changePct:     0,
      action:        'hold' as BidAction,
      reason:        'Semua creative masih dalam fase testing — butuh lebih banyak data.',
      confidence:    20,
      projectedROAS: c.roas,
      projectedRev:  0,
    }))
  }

  // Score-weighted allocation for active creatives
  const totalScore = active.reduce((s, c) => s + Math.max(1, c.performanceScore), 0)

  const allocations: BudgetAllocation[] = active.map(c => {
    const share     = c.performanceScore / totalScore
    const rawBudget = Math.floor(operaBudget * share)

    // Apply caps
    const maxIncrease = c.budget * (1 + rules.maxBudgetIncreasePct / 100)
    const maxDecrease = c.budget * (1 - rules.maxBudgetDecreasePct / 100)
    let targetBudget = Math.max(
      rules.minBudgetIDR,
      Math.min(maxIncrease, Math.max(maxDecrease, rawBudget))
    )

    // Determine action
    let action: BidAction = 'hold'
    let reason = 'Performa stabil, pertahankan budget.'

    const changePct = ((targetBudget - c.budget) / c.budget) * 100

    if (c.status === 'underperforming' || c.roas < bench.minROAS * rules.pauseROASThreshold) {
      action      = 'pause'
      targetBudget= 0
      reason      = `ROAS ${c.roas.toFixed(1)}x di bawah minimum ${(bench.minROAS * rules.pauseROASThreshold).toFixed(1)}x. Auto-pause disarankan.`
    } else if (c.frequency >= rules.fatigueFrequencyMax) {
      action = 'decrease'
      targetBudget = Math.max(rules.minBudgetIDR, Math.floor(c.budget * 0.5))
      reason = `Frequency ${c.frequency.toFixed(1)} terlalu tinggi — tanda creative fatigue. Kurangi budget dan refresh creative.`
    } else if (c.roas >= bench.goodROAS * rules.scaleROASThreshold) {
      action = 'scale'
      targetBudget = Math.min(maxIncrease, targetBudget)
      reason = `ROAS ${c.roas.toFixed(1)}x jauh melebihi target. Scale budget +${Math.round(changePct)}% untuk maksimalkan revenue.`
    } else if (changePct > 5) {
      action = 'increase'
      reason = `Performance score ${c.performanceScore}/100 — naikkan budget untuk capture lebih banyak konversi.`
    } else if (changePct < -5) {
      action = 'decrease'
      reason = `Performance score rendah (${c.performanceScore}/100) — kurangi budget dan alokasikan ke creative dengan ROAS lebih tinggi.`
    }

    const confidence = Math.min(100, Math.round(
      (c.impressions / bench.minImpressions) * 50 +
      (c.daysSince / 7) * 30 +
      (c.performanceScore / 100) * 20
    ))

    return {
      creativeId:    c.id,
      creativeName:  c.name,
      currentBudget: c.budget,
      targetBudget:  Math.round(targetBudget),
      changePct:     parseFloat(changePct.toFixed(1)),
      action,
      reason,
      confidence:    Math.min(100, confidence),
      projectedROAS: c.roas * (1 + (targetBudget - c.budget) / c.budget * 0.15),
      projectedRev:  Math.floor(targetBudget * c.roas),
    }
  })

  // Add testing allocations (even split of testing budget)
  if (testing.length > 0) {
    const perTest = Math.floor(testingBudget / testing.length)
    testing.forEach(c => {
      allocations.push({
        creativeId:    c.id,
        creativeName:  c.name,
        currentBudget: c.budget,
        targetBudget:  Math.max(rules.minBudgetIDR, perTest),
        changePct:     0,
        action:        'hold',
        reason:        `Fase testing — butuh ${bench.minDays - c.daysSince} hari lagi data sebelum dioptimasi.`,
        confidence:    20,
        projectedROAS: 0,
        projectedRev:  0,
      })
    })
  }

  return allocations
}

// ── Alert generator ───────────────────────────────────────────
export function generateAlerts(
  creatives:      CreativeMetric[],
  config:         GuardianConfig,
  currentSpend:   number,
  currentHour:    number
): BudgetAlert[] {
  const alerts: BudgetAlert[] = []
  const now    = new Date().toISOString()
  const bench  = PLATFORM_BENCHMARKS['meta']   // default

  const expectedPct  = expectedSpendPct(currentHour)
  const actualPct    = (currentSpend / config.totalDailyBudget) * 100
  const spendRatio   = actualPct / Math.max(1, expectedPct)

  // 1. Daily budget alerts
  if (actualPct >= config.hardCap) {
    alerts.push({
      id:`alert_hardcap_${Date.now()}`, type:'budget_exceeded',
      severity:'critical', autoActed: config.autoPauseEnabled,
      title:'🚨 Budget Harian Terlampaui!',
      message:`Pengeluaran hari ini Rp${(currentSpend/1000).toFixed(0)}K sudah mencapai ${actualPct.toFixed(0)}% dari budget harian Rp${(config.totalDailyBudget/1000).toFixed(0)}K. ${config.autoPauseEnabled ? 'Semua campaign otomatis dijeda.' : 'Pertimbangkan menjeda campaign sekarang.'}`,
      metric:'spend_pct', value:actualPct, threshold:config.hardCap,
      action: config.autoPauseEnabled ? 'pause' : 'hold',
      timestamp:now, resolved:false,
    })
  } else if (actualPct >= config.softCap) {
    alerts.push({
      id:`alert_softcap_${Date.now()}`, type:'budget_near_limit',
      severity:'warning', autoActed:false,
      title:`⚠️ Budget ${actualPct.toFixed(0)}% Terpakai`,
      message:`Pengeluaran Rp${(currentSpend/1000).toFixed(0)}K sudah ${actualPct.toFixed(0)}% dari budget. Estimasi habis ${Math.ceil((config.totalDailyBudget - currentSpend) / (currentSpend / Math.max(1, currentHour)))} jam lagi.`,
      metric:'spend_pct', value:actualPct, threshold:config.softCap,
      action:'hold', timestamp:now, resolved:false,
    })
  }

  // 2. Spend spike alert (spending much faster than expected)
  if (spendRatio > 1 + config.spendSpikeThreshold / 100) {
    alerts.push({
      id:`alert_spike_${Date.now()}`, type:'spend_spike',
      severity:'warning', autoActed:false,
      title:'📈 Lonjakan Pengeluaran Terdeteksi',
      message:`Pengeluaran ${spendRatio.toFixed(1)}x lebih cepat dari pacing normal. Pada jam ${currentHour}:00, seharusnya baru ${expectedPct.toFixed(0)}% terpakai, tapi sudah ${actualPct.toFixed(0)}%.`,
      metric:'spend_pace', value:spendRatio, threshold:1 + config.spendSpikeThreshold/100,
      action:'hold', timestamp:now, resolved:false,
    })
  }

  // 3. Per-creative alerts
  creatives.forEach(c => {
    // ROAS below floor
    if (c.impressions >= bench.minImpressions && c.roas < config.roasFloor && c.roas > 0) {
      alerts.push({
        id:`alert_roas_low_${c.id}_${Date.now()}`, type:'roas_below_threshold',
        severity: c.roas < config.roasFloor * 0.5 ? 'critical' : 'warning',
        creativeId:c.id, autoActed: config.autoPauseEnabled && c.roas < config.roasFloor * 0.5,
        title:`${c.roas < config.roasFloor * 0.5 ? '🚨' : '⚠️'} ROAS Rendah: ${c.name}`,
        message:`ROAS ${c.roas.toFixed(1)}x (target: ${config.roasFloor}x). ${config.autoPauseEnabled && c.roas < config.roasFloor * 0.5 ? 'Auto-pause aktif.' : 'Pertimbangkan pause atau refresh creative.'}`,
        metric:'roas', value:c.roas, threshold:config.roasFloor,
        action: config.autoPauseEnabled && c.roas < config.roasFloor * 0.5 ? 'pause' : 'hold',
        timestamp:now, resolved:false,
      })
    }

    // ROAS winner — scale
    if (c.roas >= config.roasCeiling && c.status !== 'paused') {
      alerts.push({
        id:`alert_roas_win_${c.id}_${Date.now()}`, type:'roas_winner_detected',
        severity:'info', creativeId:c.id, autoActed: config.autoScaleEnabled,
        title:`🏆 Winner Detected: ${c.name}`,
        message:`ROAS ${c.roas.toFixed(1)}x melebihi target ${config.roasCeiling}x! ${config.autoScaleEnabled ? 'Budget otomatis ditingkatkan 20%.' : 'Rekomendasikan scale budget 20-30%.'}`,
        metric:'roas', value:c.roas, threshold:config.roasCeiling,
        action:'scale', timestamp:now, resolved:false,
      })
    }

    // Creative fatigue
    if (c.frequency >= ALLOCATION_RULES.fatigueFrequencyMax) {
      alerts.push({
        id:`alert_fatigue_${c.id}_${Date.now()}`, type:'creative_fatigue',
        severity:'warning', creativeId:c.id, autoActed:false,
        title:`😴 Creative Fatigue: ${c.name}`,
        message:`Frequency ${c.frequency.toFixed(1)} — setiap orang melihat iklan ini rata-rata ${c.frequency.toFixed(0)}x. Segera refresh creative atau rotate ke variasi baru.`,
        metric:'frequency', value:c.frequency, threshold:ALLOCATION_RULES.fatigueFrequencyMax,
        action:'decrease', timestamp:now, resolved:false,
      })
    }

    // CTR drop
    if (c.ctrDelta < -config.ctrDropThreshold && c.status !== 'testing') {
      alerts.push({
        id:`alert_ctr_${c.id}_${Date.now()}`, type:'ctr_drop',
        severity:'warning', creativeId:c.id, autoActed:false,
        title:`📉 CTR Drop: ${c.name}`,
        message:`CTR turun ${Math.abs(c.ctrDelta).toFixed(1)}% dibanding periode sebelumnya (sekarang ${c.ctr.toFixed(1)}%). Pertanda audience bosan atau audience overlap dengan campaign lain.`,
        metric:'ctr_delta', value:c.ctrDelta, threshold:-config.ctrDropThreshold,
        action:'hold', timestamp:now, resolved:false,
      })
    }
  })

  return alerts.sort((a, b) => {
    const sev = { critical:0, warning:1, info:2 }
    return sev[a.severity] - sev[b.severity]
  })
}

// ── Health score ──────────────────────────────────────────────
export function calcHealthScore(
  creatives:     CreativeMetric[],
  currentSpend:  number,
  dailyBudget:   number,
  targetROAS:    number,
  currentHour:   number
): { score:number; health:'excellent'|'good'|'needs_attention'|'critical' } {
  if (creatives.length === 0) return { score:0, health:'critical' }

  const avgROAS   = creatives.reduce((s,c) => s+c.roas, 0) / creatives.length
  const avgScore  = creatives.reduce((s,c) => s+c.performanceScore, 0) / creatives.length
  const spendPct  = (currentSpend / dailyBudget) * 100
  const expPct    = expectedSpendPct(currentHour)
  const pacingOk  = Math.abs(spendPct - expPct) < 20   // within 20% of expected

  const roasScore  = Math.min(100, Math.round((avgROAS / targetROAS) * 60))
  const perfScore  = Math.round(avgScore * 0.25)
  const pacingScore= pacingOk ? 15 : Math.max(0, 15 - Math.abs(spendPct - expPct) / 2)
  const total      = Math.min(100, roasScore + perfScore + Math.round(pacingScore))

  return {
    score: total,
    health: total >= 80 ? 'excellent' : total >= 60 ? 'good' : total >= 40 ? 'needs_attention' : 'critical',
  }
}

// ── Helpers ───────────────────────────────────────────────────
export const fmtRp    = (n:number) => n>=1e9?`Rp${(n/1e9).toFixed(1)}M`:n>=1e6?`Rp${(n/1e6).toFixed(1)}Jt`:n>=1000?`Rp${(n/1000).toFixed(0)}K`:`Rp${Math.round(n)}`
export const fmtN     = (n:number) => n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(0)}K`:String(Math.round(n))
export const fmtPct   = (n:number) => `${n>0?'+':''}${n.toFixed(1)}%`
export const fmtROAS  = (n:number) => `${n.toFixed(1)}x`

export const STATUS_CONFIG: Record<CreativeStatus, { label:string; icon:string; color:string; bg:string }> = {
  scaling:       { label:'Scaling 🚀',       icon:'🚀', color:'#059669', bg:'#ECFDF5' },
  stable:        { label:'Stable ✅',         icon:'✅', color:'#3B82F6', bg:'#EFF6FF' },
  monitoring:    { label:'Monitoring 👀',     icon:'👀', color:'#F59E0B', bg:'#FFFBEB' },
  underperforming:{ label:'Under 📉',         icon:'📉', color:'#EF4444', bg:'#FEF2F2' },
  paused:        { label:'Paused ⏸️',        icon:'⏸️', color:'#6B7280', bg:'#F3F4F6' },
  testing:       { label:'Testing 🔬',        icon:'🔬', color:'#7C3AED', bg:'#F5F3FF' },
}

export const ACTION_CONFIG: Record<BidAction, { label:string; icon:string; color:string }> = {
  scale:    { label:'Scale',    icon:'🚀', color:'#059669' },
  increase: { label:'Naikan',   icon:'📈', color:'#3B82F6' },
  hold:     { label:'Pertahankan',icon:'✋', color:'#6B7280' },
  decrease: { label:'Kurangi',  icon:'📉', color:'#F59E0B' },
  pause:    { label:'Pause',    icon:'⏸️', color:'#EF4444' },
}