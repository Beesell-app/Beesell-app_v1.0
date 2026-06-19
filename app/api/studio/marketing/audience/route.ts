// app/api/studio/marketing/audience/route.ts
// ══════════════════════════════════════════════════════════════
// Audience Intel — Claude Sonnet 4.5
// Daily limit: Pro 1 | Business 3
// COGS: Rp507 per call
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { generateHeavy, parseClaudeJSON } from '@/lib/api-clients/anthropic'
import { AUDIENCE_SYSTEM, buildAudiencePrompt } from '@/lib/prompts/marketing'

export const runtime = 'edge'
export const maxDuration = 60

interface RequestBody {
  product:      string
  niche?:       string
  price_range?: string
}

export const POST = withDailyLimit('audience-intel', async (req: NextRequest) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.product) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'product wajib' },
      { status: 400 }
    )
  }

  try {
    const { text, usage } = await generateHeavy({
      systemPrompt: AUDIENCE_SYSTEM,
      userPrompt:   buildAudiencePrompt(body),
      maxTokens:    2000,
      temperature:  0.7,
    })

    const audience = parseClaudeJSON<any>(text)
    if (!audience?.primary_persona) {
      return NextResponse.json(
        { error: 'parse_failed', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      audience,
      meta: { model: 'claude-sonnet-4-5', tokens: usage },
    })
  } catch (err) {
    console.error('[audience] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})