// app/api/studio/writing/tiktok-script/route.ts
// ══════════════════════════════════════════════════════════════
// TikTok Script — Claude Haiku 4.5 (single call, no longer 2x)
// Daily limit: Basic 2 | Pro 8 | Business 20
// COGS: Rp48 (was Rp507 with Sonnet 2x calls — saving 90%)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { generateLight, parseClaudeJSON } from '@/lib/api-clients/anthropic'
import { TIKTOK_SCRIPT_SYSTEM, buildTiktokScriptPrompt } from '@/lib/prompts/writing'

export const runtime = 'edge'
export const maxDuration = 30

interface RequestBody {
  product:   string
  goal?:     'awareness' | 'conversion' | 'engagement'
  duration?: 15 | 30 | 60
}

export const POST = withDailyLimit('tiktok-script', async (req: NextRequest) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.product || body.product.trim().length < 3) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'Nama produk wajib' },
      { status: 400 }
    )
  }

  try {
    const { text, usage } = await generateLight({
      systemPrompt: TIKTOK_SCRIPT_SYSTEM,
      userPrompt:   buildTiktokScriptPrompt(body),
      maxTokens:    1500,  // Lebih besar untuk script structured
      temperature:  0.8,
    })

    const script = parseClaudeJSON<any>(text)
    if (!script || !script.segments) {
      return NextResponse.json(
        { error: 'parse_failed', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      script,
      meta: { model: 'claude-haiku-4-5', tokens: usage },
    })
  } catch (err) {
    console.error('[tiktok-script] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})