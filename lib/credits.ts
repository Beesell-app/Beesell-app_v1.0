// lib/credits.ts
// ══════════════════════════════════════════════════════════════
// BeeSell AI — Credit System Helper (TypeScript)
// ══════════════════════════════════════════════════════════════
//
// USAGE di API route:
//
//   import { chargeCreditOrFail, refundCredit } from '@/lib/credits'
//
//   // STEP 1: Charge dulu sebelum proses
//   const charge = await chargeCreditOrFail(supabase, {
//     userId, toolId: 'ugc-generator', jobId: 'job_abc123'
//   })
//   if (!charge.ok) return charge.errorResponse  // 402 atau 404
//
//   // STEP 2: Proses generate
//   try {
//     const result = await runGenerate(...)
//     return NextResponse.json({ result, creditsCharged: charge.amount })
//   } catch (err) {
//     // STEP 3: Refund kalau gagal
//     await refundCredit(supabase, charge.ledgerId, 'Generate failed: ' + err.message)
//     throw err
//   }
//
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────
export type PlanTier = 'starter' | 'basic' | 'pro' | 'business'

export type ToolId =
  | 'caption' | 'hook' | 'hashtag' | 'resize'
  | 'remove-bg' | 'tiktok-script' | 'subtitle'
  | 'packshot' | 'enhancer' | 'upscale' | 'relight' | 'remove-object'
  | 'campaign-builder' | 'audience-intel' | 'scheduler'
  | 'budget-optimizer'
  | 'virtual-tryon' | 'product-to-model'
  | 'image-to-video' | 'talking-head' | 'ugc-generator'

export interface UserCredits {
  user_id:         string
  plan_tier:       PlanTier
  current_balance: number
  monthly_quota:   number
  reset_date:      string
  total_purchased: number
  total_consumed:  number
}

export interface ToolCost {
  tool_id:      string
  display_name: string
  credit_cost:  number
  is_metered:   boolean
  category:     string
}

export interface ChargeResult {
  ok:             boolean
  amount:         number
  ledgerId:       number | null
  newBalance:     number | null
  errorResponse?: NextResponse
}

// ── Static fallback: tool costs (sync dengan tool_credit_cost table) ──
// Dipakai sebagai cache untuk avoid roundtrip ke DB setiap request
export const TOOL_COSTS: Record<ToolId, { cost: number; metered: boolean; label: string }> = {
  // Unlimited (zero/low COGS)
  'caption':           { cost: 0, metered: false, label: 'Caption Generator'      },
  'hook':              { cost: 0, metered: false, label: 'Hook Generator'         },
  'hashtag':           { cost: 0, metered: false, label: 'Hashtag AI'             },
  'resize':            { cost: 0, metered: false, label: 'Resize & Crop'          },
  'remove-bg':         { cost: 0, metered: false, label: 'Remove Background'      },
  'tiktok-script':     { cost: 0, metered: false, label: 'TikTok Reels Script'    },
  'subtitle':          { cost: 0, metered: false, label: 'AI Subtitle'            },
  'packshot':          { cost: 0, metered: false, label: 'AI Packshot'            },
  'enhancer':          { cost: 0, metered: false, label: 'Product Enhancer'       },
  'upscale':           { cost: 0, metered: false, label: 'AI Upscale'             },
  'relight':           { cost: 0, metered: false, label: 'AI Relight'             },
  'remove-object':     { cost: 0, metered: false, label: 'Remove Object'          },
  'campaign-builder':  { cost: 0, metered: false, label: 'Campaign Builder'       },
  'audience-intel':    { cost: 0, metered: false, label: 'Audience Intel'         },
  'scheduler':         { cost: 0, metered: false, label: 'Scheduler'              },
  'budget-optimizer':  { cost: 0, metered: false, label: 'Budget Optimizer'      },
  // Metered (high COGS)
  'virtual-tryon':     { cost: 10, metered: true, label: 'Virtual Try-On'         },
  'product-to-model':  { cost: 5,  metered: true, label: 'Product to Model'       },
  'image-to-video':    { cost: 50, metered: true, label: 'Image to Video'         },
  'talking-head':      { cost: 30, metered: true, label: 'AI Talking Head'        },
  'ugc-generator':     { cost: 40, metered: true, label: 'UGC Video Generator'    },
}

export const getCreditCost = (toolId: ToolId): number => TOOL_COSTS[toolId]?.cost ?? 0
export const isMetered     = (toolId: ToolId): boolean => TOOL_COSTS[toolId]?.metered ?? false

// ── Helper: Fetch user credit balance ─────────────────────────
export async function getUserCredits(
  supabase: SupabaseClient,
  userId:   string,
): Promise<UserCredits | null> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('[credits] getUserCredits failed:', error.message)
    return null
  }
  return data as UserCredits
}

// ── Helper: Check tool access (apakah tool ada di plan user) ──
export async function canUseTool(
  supabase: SupabaseClient,
  userId:   string,
  toolId:   ToolId,
): Promise<{ allowed: boolean; reason?: string; requiresCredit?: number }> {
  const credits = await getUserCredits(supabase, userId)
  if (!credits) return { allowed: false, reason: 'USER_NOT_FOUND' }

  const { data: plan, error } = await supabase
    .from('plan_config')
    .select('unlimited_tools, metered_tools')
    .eq('tier', credits.plan_tier)
    .single()

  if (error || !plan) return { allowed: false, reason: 'PLAN_NOT_FOUND' }

  // Cek apakah tool ada di plan
  const inUnlimited = (plan.unlimited_tools as string[]).includes(toolId)
  const inMetered   = (plan.metered_tools   as string[]).includes(toolId)

  if (!inUnlimited && !inMetered) {
    return { allowed: false, reason: 'TOOL_NOT_IN_PLAN' }
  }

  // Unlimited tool: langsung allow
  if (inUnlimited) return { allowed: true }

  // Metered tool: cek saldo
  const cost = getCreditCost(toolId)
  if (credits.current_balance < cost) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_CREDIT',
      requiresCredit: cost,
    }
  }
  return { allowed: true, requiresCredit: cost }
}

// ══════════════════════════════════════════════════════════════
// MAIN: chargeCreditOrFail
// ══════════════════════════════════════════════════════════════
// Atomic deduction via RPC. Returns ChargeResult.
// Jika tool unlimited (cost = 0), langsung return ok tanpa deduct.

export async function chargeCreditOrFail(
  supabase: SupabaseClient,
  opts: {
    userId:       string
    toolId:       ToolId
    jobId?:       string
    description?: string
  },
): Promise<ChargeResult> {
  const cost = getCreditCost(opts.toolId)

  // Unlimited tool: skip charging
  if (cost === 0) {
    return { ok: true, amount: 0, ledgerId: null, newBalance: null }
  }

  // Pre-check access (plan + balance)
  const access = await canUseTool(supabase, opts.userId, opts.toolId)
  if (!access.allowed) {
    return buildErrorChargeResult(access.reason ?? 'UNKNOWN', cost)
  }

  // Atomic deduct via RPC
  const { data, error } = await supabase.rpc('deduct_credit', {
    p_user_id:     opts.userId,
    p_amount:      cost,
    p_tool_id:     opts.toolId,
    p_job_id:      opts.jobId ?? null,
    p_description: opts.description ?? null,
  })

  if (error) {
    console.error('[credits] deduct_credit RPC failed:', error.message)
    return buildErrorChargeResult('RPC_FAILED', cost)
  }

  const result = data as {
    ok:              boolean
    error?:          string
    ledger_id?:      number
    balance_after?:  number
    current_balance?:number
    required?:       number
  }

  if (!result.ok) {
    return buildErrorChargeResult(result.error ?? 'UNKNOWN', cost, result.current_balance)
  }

  return {
    ok:         true,
    amount:     cost,
    ledgerId:   result.ledger_id ?? null,
    newBalance: result.balance_after ?? null,
  }
}

// ── Helper: build user-friendly error response ────────────────
function buildErrorChargeResult(
  reason:         string,
  cost:           number,
  currentBalance: number | undefined = undefined,
): ChargeResult {
  const errorMap: Record<string, { status: number; message: string }> = {
    'INSUFFICIENT_CREDIT': {
      status: 402,
      message: currentBalance !== undefined
        ? `Credit tidak cukup. Butuh ${cost} credit, saldo kamu ${currentBalance}. Top-up atau upgrade plan.`
        : `Credit tidak cukup (butuh ${cost}). Top-up atau upgrade plan.`,
    },
    'TOOL_NOT_IN_PLAN': {
      status: 403,
      message: 'Tool ini tidak termasuk dalam plan kamu. Upgrade ke Pro atau Business.',
    },
    'USER_NOT_FOUND': {
      status: 404,
      message: 'Akun user tidak ditemukan. Coba login ulang.',
    },
    'PLAN_NOT_FOUND': {
      status: 500,
      message: 'Konfigurasi plan tidak ditemukan. Hubungi support.',
    },
    'INVALID_AMOUNT': {
      status: 500,
      message: 'Sistem error: amount invalid. Hubungi support.',
    },
    'RPC_FAILED': {
      status: 500,
      message: 'Gagal proses credit. Coba lagi sebentar.',
    },
    'UNKNOWN': {
      status: 500,
      message: 'Terjadi kesalahan sistem credit.',
    },
  }

  const e = errorMap[reason] ?? errorMap['UNKNOWN']

  return {
    ok:         false,
    amount:     cost,
    ledgerId:   null,
    newBalance: currentBalance ?? null,
    errorResponse: NextResponse.json({
      error:           reason,
      message:         e.message,
      requiredCredit:  cost,
      currentBalance,
    }, { status: e.status }),
  }
}

// ══════════════════════════════════════════════════════════════
// refundCredit — kembalikan credit yang sudah di-deduct
// Dipanggil di catch block ketika generate gagal
// ══════════════════════════════════════════════════════════════
export async function refundCredit(
  supabase: SupabaseClient,
  ledgerId: number,
  reason:   string = 'Generate failed',
): Promise<{ ok: boolean; refundedAmount?: number; newBalance?: number; error?: string }> {
  if (!ledgerId) return { ok: false, error: 'NO_LEDGER_ID' }

  const { data, error } = await supabase.rpc('refund_credit', {
    p_ledger_id: ledgerId,
    p_reason:    reason,
  })

  if (error) {
    console.error('[credits] refund_credit RPC failed:', error.message)
    return { ok: false, error: error.message }
  }

  const r = data as {
    ok:              boolean
    error?:          string
    refunded?:       number
    new_balance?:    number
  }

  if (!r.ok) return { ok: false, error: r.error }

  console.log(`[credits] Refunded ${r.refunded} credit (ledger ${ledgerId}): ${reason}`)
  return {
    ok:             true,
    refundedAmount: r.refunded,
    newBalance:     r.new_balance,
  }
}

// ══════════════════════════════════════════════════════════════
// HELPERS untuk UI (read-only, dipakai di components)
// ══════════════════════════════════════════════════════════════

/** Format saldo untuk display: 1234 → "1.234" */
export function formatCredit(n: number): string {
  return n.toLocaleString('id-ID')
}

/** Estimasi berapa generate yang masih bisa dari saldo */
export function estimateRemaining(balance: number, toolId: ToolId): number {
  const cost = getCreditCost(toolId)
  if (cost === 0) return Infinity
  return Math.floor(balance / cost)
}

/** Days until reset_date (untuk UI countdown) */
export function daysUntilReset(resetDate: string): number {
  const ms = new Date(resetDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}