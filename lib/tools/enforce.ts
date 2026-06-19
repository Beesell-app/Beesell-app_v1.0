// lib/tools/enforce.ts
// ══════════════════════════════════════════════════════════════
// ENFORCEMENT LAYER — Satu tempat untuk semua tool route.
//
// Sebelum proses gambar:
//   enforceToolAccess() → cek feature flag, tier, daily limit, kredit
//
// Setelah proses berhasil:
//   consumeCredits()   → kurangi saldo + catat ledger
//   logToolUsage()     → catat ke ai_usage_daily
//
// Superuser: bypass semua limit & tidak dikurangi kredit.
// Tabel tidak ada: fail-open (tool tetap jalan, log error).
// ══════════════════════════════════════════════════════════════

import { checkToolAllowed } from './access'

// ── Superuser email check (sama dengan use-user-role) ─────────
const SUPERUSER_EMAILS = ['besties.aegle@gmail.com']

async function isSuperuser(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .maybeSingle()
    if (data?.role === 'owner') return true
    if (SUPERUSER_EMAILS.includes(data?.email)) return true
    return false
  } catch {
    return false
  }
}

// ── Get user tier ─────────────────────────────────────────────
async function getUserTier(supabase: any, userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('user_credits')
      .select('plan_tier')
      .eq('user_id', userId)
      .maybeSingle()
    return data?.plan_tier ?? 'starter'
  } catch {
    return 'starter'
  }
}

// ── Get credit cost untuk tool ────────────────────────────────
async function getToolCreditCost(supabase: any, toolId: string): Promise<{ cost: number; isMetered: boolean }> {
  try {
    const { data } = await supabase
      .from('tool_credit_cost')
      .select('credit_cost, is_metered')
      .eq('tool_id', toolId)
      .maybeSingle()
    return {
      cost:      data?.credit_cost ?? 0,
      isMetered: data?.is_metered  ?? false,
    }
  } catch {
    return { cost: 0, isMetered: false }
  }
}

// ── Check daily limit ─────────────────────────────────────────
async function checkDailyLimit(
  supabase: any,
  userId: string,
  toolId: string,
  tier: string,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  try {
    // Get limit dari daily_limit_config
    const { data: limitRow } = await supabase
      .from('daily_limit_config')
      .select('daily_limit')
      .eq('tier', tier)
      .eq('tool_id', toolId)
      .maybeSingle()

    // Kalau tidak ada config → unlimited (fail-open)
    const limit = limitRow?.daily_limit ?? 999

    // Hitung usage hari ini dari credit_ledger
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('credit_ledger')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tool_id', toolId)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at',  `${today}T23:59:59.999`)

    const used = count ?? 0
    return { allowed: used < limit, used, limit }
  } catch {
    // Tabel belum ada atau error → izinkan (fail-open)
    return { allowed: true, used: 0, limit: 999 }
  }
}

// ── Check credit balance ──────────────────────────────────────
async function checkBalance(supabase: any, userId: string, cost: number): Promise<{ allowed: boolean; balance: number }> {
  if (cost <= 0) return { allowed: true, balance: 0 }
  try {
    const { data } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .maybeSingle()
    const balance = data?.current_balance ?? 0
    return { allowed: balance >= cost, balance }
  } catch {
    return { allowed: true, balance: 0 }
  }
}

// ══════════════════════════════════════════════════════════════
// enforceToolAccess — Panggil SEBELUM proses gambar
// ══════════════════════════════════════════════════════════════
export interface EnforceResult {
  allowed:     boolean
  reason:      string
  status:      number    // HTTP status code kalau ditolak
  isSuperuser: boolean
  userId:      string
  tier:        string
  creditCost:  number
  dailyUsed:   number
  dailyLimit:  number
}

export async function enforceToolAccess(
  supabase: any,
  userId: string,
  toolId: string,
): Promise<EnforceResult> {
  const base = {
    userId,
    isSuperuser: false,
    tier:        'starter',
    creditCost:  0,
    dailyUsed:   0,
    dailyLimit:  999,
  }

  // 1. Superuser bypass SEMUA
  const su = await isSuperuser(supabase, userId)
  if (su) {
    const { cost } = await getToolCreditCost(supabase, toolId)
    return {
      ...base,
      allowed: true, reason: '', status: 200,
      isSuperuser: true, creditCost: cost,
    }
  }

  const tier = await getUserTier(supabase, userId)
  base.tier = tier

  // 2. Feature flag + tier check
  const flagResult = await checkToolAllowed(supabase, userId, toolId)
  if (!flagResult.allowed) {
    return {
      ...base,
      allowed: false,
      reason:  flagResult.reason || 'Tool ini tidak tersedia untuk paket kamu.',
      status:  flagResult.status === 'disabled' ? 403 : 402,
    }
  }

  // 3. Daily limit check
  const daily = await checkDailyLimit(supabase, userId, toolId, tier)
  base.dailyUsed  = daily.used
  base.dailyLimit = daily.limit
  if (!daily.allowed) {
    return {
      ...base,
      allowed: false,
      reason:  `Limit harian tercapai (${daily.used}/${daily.limit}). Reset jam 00:01 WIB. Upgrade paket untuk limit lebih tinggi.`,
      status:  429,
    }
  }

  // 4. Credit check (untuk tool metered)
  const { cost, isMetered } = await getToolCreditCost(supabase, toolId)
  base.creditCost = cost
  if (isMetered && cost > 0) {
    const balance = await checkBalance(supabase, userId, cost)
    if (!balance.allowed) {
      return {
        ...base,
        allowed: false,
        reason:  `Kredit tidak cukup (saldo ${balance.balance}, butuh ${cost}). Topup kredit di halaman Billing.`,
        status:  402,
      }
    }
  }

  return { ...base, allowed: true, reason: '', status: 200 }
}

// ══════════════════════════════════════════════════════════════
// consumeCredits — Panggil SETELAH proses berhasil
// ══════════════════════════════════════════════════════════════
export async function consumeCredits(
  supabase: any,
  userId: string,
  toolId: string,
  creditCost: number,
  meta?: {
    jobId?:      string
    description?: string
  },
): Promise<void> {
  if (creditCost <= 0) return

  try {
    // Get current balance
    const { data: uc } = await supabase
      .from('user_credits')
      .select('current_balance, total_consumed, total_used_this_month')
      .eq('user_id', userId)
      .maybeSingle()

    const balanceBefore = uc?.current_balance ?? 0
    const balanceAfter  = Math.max(0, balanceBefore - creditCost)

    // Deduct balance
    await supabase
      .from('user_credits')
      .update({
        current_balance:      balanceAfter,
        total_consumed:       (uc?.total_consumed ?? 0) + creditCost,
        total_used_this_month:(uc?.total_used_this_month ?? 0) + creditCost,
      })
      .eq('user_id', userId)

    // Log to credit_ledger (defensif — enum mismatch silently fails)
    try {
      await supabase.from('credit_ledger').insert({
        user_id:        userId,
        txn_type:       'usage',         // sesuaikan kalau enum berbeda
        status:         'completed',     // sesuaikan kalau enum berbeda
        amount:         -creditCost,
        balance_before: balanceBefore,
        balance_after:  balanceAfter,
        tool_id:        toolId,
        job_id:         meta?.jobId ?? null,
        description:    meta?.description ?? `Quick Tool: ${toolId}`,
      })
    } catch (ledgerErr: any) {
      // Enum mismatch atau tabel belum ada — log tapi jangan gagalkan
      console.warn('[consumeCredits] ledger insert failed (non-fatal):', ledgerErr?.message)
    }
  } catch (err: any) {
    console.error('[consumeCredits] error:', err?.message)
    // Non-fatal: tool sudah berhasil proses, jangan gagalkan response
  }
}

// ══════════════════════════════════════════════════════════════
// logToolUsage — Catat ke ai_usage_daily (agregat harian)
// ══════════════════════════════════════════════════════════════
export async function logToolUsage(
  supabase: any,
  userId: string,
  toolId: string,
  provider: string,
  costUsd: number,
  durationMs: number,
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Cari tenant_id user
    const { data: userRow } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .maybeSingle()

    const tenantId = userRow?.tenant_id ?? userId

    // Upsert ke ai_usage_daily
    const { data: existing } = await supabase
      .from('ai_usage_daily')
      .select('id, request_count, cost_usd, avg_duration_ms')
      .eq('stat_date', today)
      .eq('tenant_id', tenantId)
      .eq('ai_provider', provider)
      .eq('ai_model', toolId)
      .maybeSingle()

    if (existing) {
      const newCount = (existing.request_count ?? 0) + 1
      const newCost  = (existing.cost_usd ?? 0) + costUsd
      const newAvg   = Math.round(
        ((existing.avg_duration_ms ?? 0) * (existing.request_count ?? 0) + durationMs) / newCount
      )
      await supabase
        .from('ai_usage_daily')
        .update({ request_count: newCount, cost_usd: newCost, avg_duration_ms: newAvg })
        .eq('id', existing.id)
    } else {
      await supabase.from('ai_usage_daily').insert({
        stat_date:       today,
        tenant_id:       tenantId,
        ai_provider:     provider,
        ai_model:        toolId,
        request_count:   1,
        cost_usd:        costUsd,
        avg_duration_ms: durationMs,
        tokens_used:     0,
        cache_hits:      0,
      })
    }
  } catch (err: any) {
    // Non-fatal: jangan gagalkan response tool
    console.warn('[logToolUsage] failed (non-fatal):', err?.message)
  }
}