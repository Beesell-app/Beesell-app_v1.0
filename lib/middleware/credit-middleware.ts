// lib/middleware/credit-middleware.ts
// ══════════════════════════════════════════════════════════════
// withCredits() — UPDATED dengan SUPERUSER BYPASS
// 
// Superuser: tidak deduct credit, log sebagai 'admin_test' di metadata
// Regular user: deduct credit + auto-refund kalau gagal
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type Handler = (req: NextRequest, ctx?: any) => Promise<NextResponse>

export function withCredits(toolId: string, handler: Handler): Handler {
  return async (req: NextRequest, ctx?: any) => {
    const supabase = await createSupabaseServerClient()
    
    // ── 1. Auth check ─────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Silakan login dulu' },
        { status: 401 }
      )
    }

    // ── 2. Check role — SUPERUSER BYPASS ─────────────────────
    const { data: userRole } = await supabase.rpc('check_user_role', {
      p_user_id: user.id,
    })
    
    if (userRole === 'superuser') {
      console.log(`[${toolId}] 🔓 SUPERUSER BYPASS — no credit deduction for ${user.email}`)
      
      try {
        const response = await handler(req, ctx)
        return response
      } catch (err) {
        console.error(`[${toolId}] Handler error (superuser):`, err)
        return NextResponse.json(
          { error: 'handler_failed', message: String(err) },
          { status: 500 }
        )
      }
    }

    // ── 3. Regular user: deduct credit (atomic via RPC) ──────
    const { data: deductData, error: deductError } = await supabase
      .rpc('deduct_credit', {
        p_user_id: user.id,
        p_tool_id: toolId,
      })

    if (deductError) {
      console.error(`[${toolId}] Credit deduct error:`, deductError)
      return NextResponse.json(
        { error: 'credit_deduct_failed', message: String(deductError.message) },
        { status: 500 }
      )
    }

    const deduct = deductData as any
    
    if (!deduct.success) {
      return NextResponse.json(
        {
          error: 'insufficient_credit',
          required: deduct.cost,
          current_balance: deduct.new_balance,
          message: deduct.message || `Butuh ${deduct.cost} credit, sisa kamu tidak cukup`,
          topup_url: '/billing/credits',
        },
        { status: 402 }
      )
    }

    // ── 4. Run handler ────────────────────────────────────────
    let response: NextResponse
    let shouldRefund = false
    
    try {
      response = await handler(req, ctx)
      if (response.status >= 400) shouldRefund = true
    } catch (err) {
      console.error(`[${toolId}] Handler exception:`, err)
      shouldRefund = true
      response = NextResponse.json(
        { error: 'handler_failed', message: String(err) },
        { status: 500 }
      )
    }

    // ── 5. Auto-refund kalau gagal ────────────────────────────
    if (shouldRefund && deduct.ledger_id) {
      const { error: refundError } = await supabase
        .rpc('refund_credit', {
          p_ledger_id: deduct.ledger_id,
          p_reason: `Auto-refund: handler failed for ${toolId}`,
        })
      
      if (refundError) {
        console.error(`[${toolId}] Refund failed:`, refundError)
      }
    }

    return response
  }
}

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