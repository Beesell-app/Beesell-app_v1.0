// app/api/studio/marketing/budget/route.ts
// ══════════════════════════════════════════════════════════════
// Budget Optimizer — Claude Sonnet 4.5 (deep multi-step)
// Daily limit: Business 1 (EXCLUSIVE)
// COGS: Rp909 per call
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { generateHeavy, parseClaudeJSON } from '@/lib/api-clients/anthropic'
import { BUDGET_SYSTEM, buildBudgetPrompt } from '@/lib/prompts/marketing'

export const runtime = 'edge'
export const maxDuration = 90

interface RequestBody {
  total_budget_idr:  number
  product:           string
  current_channels?: string[]
  goals:             string
}

export const POST = withDailyLimit('budget-optimizer', async (req: NextRequest) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.product || !body.goals || !body.total_budget_idr) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'product, goals, total_budget_idr wajib' },
      { status: 400 }
    )
  }

  if (body.total_budget_idr < 100_000) {
    return NextResponse.json(
      { error: 'invalid_budget', message: 'Minimum budget Rp100.000' },
      { status: 400 }
    )
  }

  try {
    const { text, usage } = await generateHeavy({
      systemPrompt: BUDGET_SYSTEM,
      userPrompt:   buildBudgetPrompt(body),
      maxTokens:    3000,
      temperature:  0.5,  // Lower untuk accuracy financial
    })

    const allocation = parseClaudeJSON<any>(text)
    if (!allocation?.allocation) {
      return NextResponse.json(
        { error: 'parse_failed', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      allocation,
      meta: { 
        model: 'claude-sonnet-4-5', 
        tokens: usage,
        note: 'Business plan exclusive feature',
      },
    })
  } catch (err) {
    console.error('[budget] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})