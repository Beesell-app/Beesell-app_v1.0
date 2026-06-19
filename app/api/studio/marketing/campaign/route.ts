// app/api/studio/marketing/campaign/route.ts
// ══════════════════════════════════════════════════════════════
// Campaign Builder — Claude Sonnet 4.5 (heavy reasoning)
// Daily limit: Pro 1 | Business 3
// COGS: Rp507 per call (Sonnet PMSE)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { generateHeavy, parseClaudeJSON } from '@/lib/api-clients/anthropic'
import { CAMPAIGN_SYSTEM, buildCampaignPrompt } from '@/lib/prompts/marketing'

export const runtime = 'edge'
export const maxDuration = 60

interface RequestBody {
  product:     string
  goal:        string
  budget_idr?: number
  platform?:   'meta' | 'tiktok' | 'both'
  duration?:   number
}

export const POST = withDailyLimit('campaign-builder', async (req: NextRequest) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.product || !body.goal) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'product dan goal wajib' },
      { status: 400 }
    )
  }

  try {
    const { text, usage } = await generateHeavy({
      systemPrompt: CAMPAIGN_SYSTEM,
      userPrompt:   buildCampaignPrompt(body),
      maxTokens:    2500,
      temperature:  0.7,
    })

    const campaign = parseClaudeJSON<any>(text)
    if (!campaign?.campaign_name) {
      return NextResponse.json(
        { error: 'parse_failed', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign,
      meta: { model: 'claude-sonnet-4-5', tokens: usage },
    })
  } catch (err) {
    console.error('[campaign] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})