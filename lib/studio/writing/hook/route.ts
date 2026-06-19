// app/api/studio/writing/hook/route.ts
// ══════════════════════════════════════════════════════════════
// Hook Generator — Claude Haiku 4.5
// Daily limit: Basic 5 | Pro 15 | Business 40
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { generateLight, parseClaudeJSON } from '@/lib/api-clients/anthropic'
import { HOOK_SYSTEM, buildHookPrompt } from '@/lib/prompts/writing'

export const runtime = 'edge'
export const maxDuration = 30

interface RequestBody {
  product:     string
  niche?:      string
  pain_point?: string
}

export const POST = withDailyLimit('hook', async (req: NextRequest) => {
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
      systemPrompt: HOOK_SYSTEM,
      userPrompt:   buildHookPrompt(body),
      maxTokens:    600,
      temperature:  0.9,  // Higher for creativity
    })

    const hooks = parseClaudeJSON<Array<{ hook: string; why: string }>>(text)
    if (!hooks || !Array.isArray(hooks)) {
      return NextResponse.json(
        { error: 'parse_failed', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      hooks,
      meta: { model: 'claude-haiku-4-5', tokens: usage },
    })
  } catch (err) {
    console.error('[hook] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})