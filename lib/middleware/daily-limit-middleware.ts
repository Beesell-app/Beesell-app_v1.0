// lib/middleware/daily-limit-middleware.ts
// ══════════════════════════════════════════════════════════════
// withDailyLimit() — Middleware untuk wrap API routes
//
// Usage:
//   export const POST = withDailyLimit('caption', async (req) => {
//     // generation logic
//     return NextResponse.json({ ... })
//   })
//
// Flow:
//   1. Get user_id dari session
//   2. Call check_daily_limit(user_id, tool_id) — RPC ke Supabase
//   3. Kalau hit limit → return 429 dengan upgrade suggestion
//   4. Run handler (generation)
//   5. Kalau success → call increment_daily_usage(user_id, tool_id)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isToolEnabled, getDisabledReason } from '@/lib/feature-flags'

type Handler = (req: NextRequest, ctx?: any) => Promise<NextResponse>

interface LimitCheckResult {
  allowed:    boolean
  unlimited?: boolean
  tier?:      string
  limit?:     number
  current?:   number
  remaining?: number
  reset_at?:  string
  error?:     string
  message?:   string
}

// ══════════════════════════════════════════════════════════════
// MAIN MIDDLEWARE
// ══════════════════════════════════════════════════════════════
export function withDailyLimit(toolId: string, handler: Handler): Handler {
  return async (req: NextRequest, ctx?: any) => {
    // ── 0. Check feature flag ─────────────────────────────────
    if (!isToolEnabled(toolId)) {
      return NextResponse.json(
        {
          error: 'tool_disabled',
          tool_id: toolId,
          message: getDisabledReason(toolId) || 'Tool sedang tidak tersedia',
        },
        { status: 503 }
      )
    }

    // ── 1. Get user dari Supabase session ─────────────────────
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Silakan login dulu' },
        { status: 401 }
      )
    }

    // ── 2. Check daily limit via RPC ──────────────────────────
    const { data: limitCheck, error: rpcError } = await supabase
      .rpc('check_daily_limit', {
        p_user_id: user.id,
        p_tool_id: toolId,
      })

    if (rpcError) {
      console.error('[daily-limit] RPC error:', rpcError)
      return NextResponse.json(
        { error: 'limit_check_failed', message: 'Gagal cek limit' },
        { status: 500 }
      )
    }

    const result = limitCheck as LimitCheckResult

    // ── 3. Kalau hit limit → 429 dengan upgrade suggestion ───
    if (!result.allowed) {
      const upgrade = getUpgradeSuggestion(result.tier!, toolId)
      
      return NextResponse.json(
        {
          error: 'daily_limit_exceeded',
          tool_id: toolId,
          current_tier: result.tier,
          limit: result.limit,
          current: result.current,
          message: result.message || `Limit harian ${result.limit}/${toolId} sudah tercapai`,
          reset_at: result.reset_at,
          upgrade_suggestion: upgrade,
        },
        { status: 429 }
      )
    }

    // ── 4. Run handler ────────────────────────────────────────
    let response: NextResponse
    try {
      response = await handler(req, ctx)
    } catch (err) {
      console.error(`[${toolId}] Handler error:`, err)
      return NextResponse.json(
        { error: 'handler_failed', message: String(err) },
        { status: 500 }
      )
    }

    // ── 5. Kalau success → increment usage ────────────────────
    if (response.status === 200 || response.status === 201) {
      const { error: incError } = await supabase
        .rpc('increment_daily_usage', {
          p_user_id: user.id,
          p_tool_id: toolId,
        })
      
      if (incError) {
        console.warn(`[${toolId}] Failed to increment usage:`, incError)
        // Don't fail the request, just log
      }
    }

    return response
  }
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},     // Not needed for API routes
        remove: () => {},
      },
    }
  )
}

function getUpgradeSuggestion(currentTier: string, toolId: string) {
  const upgradeMap: Record<string, any> = {
    starter: {
      from_tier:    'starter',
      to_tier:      'basic',
      multiplier:   5,
      cta_text:     'Upgrade ke Basic Rp149K',
      upgrade_url:  '/billing?upgrade=basic',
    },
    basic: {
      from_tier:    'basic',
      to_tier:      'pro',
      multiplier:   3,
      cta_text:     'Upgrade ke Pro Rp549K',
      upgrade_url:  '/billing?upgrade=pro',
    },
    pro: {
      from_tier:    'pro',
      to_tier:      'business',
      multiplier:   2.5,
      cta_text:     'Upgrade ke Business Rp1.499K',
      upgrade_url:  '/billing?upgrade=business',
    },
  }
  
  return upgradeMap[currentTier] ?? null
}