// lib/middleware/daily-limit-middleware.ts
// ══════════════════════════════════════════════════════════════
// withDailyLimit() — UPDATED dengan:
//   1. Superuser BYPASS (no limit, no usage increment)
//   2. Kill switch check (per tool + global + provider)
//   3. Cost guardrail check (warn/throttle/kill berdasarkan budget)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isToolEnabled, getDisabledReason } from '@/lib/feature-flags'

type Handler = (req: NextRequest, ctx?: any) => Promise<NextResponse>

export function withDailyLimit(toolId: string, handler: Handler): Handler {
  return async (req: NextRequest, ctx?: any) => {
    // ── 0. Feature flag check ─────────────────────────────────
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
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Silakan login dulu' },
        { status: 401 }
      )
    }

    // ── 2. Check user role — SUPERUSER BYPASS ─────────────────
    const { data: userRole } = await supabase.rpc('check_user_role', {
      p_user_id: user.id,
    })

    const isSuperuser = userRole === 'superuser'

    // ── 3. KILL SWITCH check (apply ke semua, termasuk superuser) ─
    const { data: globalKilled } = await supabase.rpc('is_killed', {
      p_scope: 'global', p_target: 'all',
    })
    
    if (globalKilled) {
      return NextResponse.json(
        {
          error: 'service_killed',
          message: '⚠️ Sistem sedang di-maintenance darurat. Hubungi support.',
        },
        { status: 503 }
      )
    }

    const { data: toolKilled } = await supabase.rpc('is_killed', {
      p_scope: 'tool', p_target: toolId,
    })
    
    if (toolKilled) {
      return NextResponse.json(
        {
          error: 'tool_killed',
          tool_id: toolId,
          message: 'Tool sedang dimatikan sementara. Coba lagi nanti.',
        },
        { status: 503 }
      )
    }

    // ── 4. COST GUARDRAIL check ─────────────────────────────────
    // Skip untuk superuser (mereka testing, tidak ke-count budget)
    if (!isSuperuser) {
      const { data: guardrail } = await supabase.rpc('check_cost_guardrail', {
        p_scope: 'global', p_target: 'all',
      })
      
      // Kalau ada budget yang exceeded dengan action 'kill', stop
      const guardrailData = guardrail as Record<string, any>
      const exceededPeriod = Object.entries(guardrailData ?? {}).find(
        ([_, v]: any) => v.is_exceeded && v.action_on_exceed === 'kill'
      )
      
      if (exceededPeriod) {
        return NextResponse.json(
          {
            error: 'budget_exceeded',
            message: `Budget ${exceededPeriod[0]} sudah tercapai. Tool sementara di-throttle.`,
            details: exceededPeriod[1],
          },
          { status: 503 }
        )
      }
    }

    // ── 5. SUPERUSER BYPASS: skip daily limit check ──────────
    if (isSuperuser) {
      console.log(`[${toolId}] 🔓 SUPERUSER BYPASS — no limit check for ${user.email}`)
      
      try {
        const response = await handler(req, ctx)
        // Tidak increment usage
        return response
      } catch (err) {
        console.error(`[${toolId}] Handler error (superuser):`, err)
        return NextResponse.json(
          { error: 'handler_failed', message: String(err) },
          { status: 500 }
        )
      }
    }

    // ── 6. Regular user: check daily limit via RPC ────────────
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

    const result = limitCheck as any

    if (!result.allowed) {
      const upgrade = getUpgradeSuggestion(result.tier!, toolId)
      
      return NextResponse.json(
        {
          error: 'daily_limit_exceeded',
          tool_id: toolId,
          current_tier: result.tier,
          limit: result.limit,
          current: result.current,
          message: result.message,
          reset_at: result.reset_at,
          upgrade_suggestion: upgrade,
        },
        { status: 429 }
      )
    }

    // ── 7. Run handler ────────────────────────────────────────
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

    // ── 8. Kalau success → increment usage ────────────────────
    if (response.status === 200 || response.status === 201) {
      const { error: incError } = await supabase
        .rpc('increment_daily_usage', {
          p_user_id: user.id,
          p_tool_id: toolId,
        })
      
      if (incError) {
        console.warn(`[${toolId}] Failed to increment usage:`, incError)
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
        set: () => {},
        remove: () => {},
      },
    }
  )
}

function getUpgradeSuggestion(currentTier: string, toolId: string) {
  const upgradeMap: Record<string, any> = {
    starter: {
      from_tier: 'starter', to_tier: 'basic', multiplier: 5,
      cta_text: 'Upgrade ke Basic Rp149K',
      upgrade_url: '/billing?upgrade=basic',
    },
    basic: {
      from_tier: 'basic', to_tier: 'pro', multiplier: 3,
      cta_text: 'Upgrade ke Pro Rp549K',
      upgrade_url: '/billing?upgrade=pro',
    },
    pro: {
      from_tier: 'pro', to_tier: 'business', multiplier: 2.5,
      cta_text: 'Upgrade ke Business Rp1.499K',
      upgrade_url: '/billing?upgrade=business',
    },
  }
  
  return upgradeMap[currentTier] ?? null
}