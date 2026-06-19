// app/api/studio/writing/hashtag/route.ts
// ══════════════════════════════════════════════════════════════
// Hashtag AI — Claude Haiku 4.5
// Daily limit: Basic 5 | Pro 15 | Business 40
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { generateLight, parseClaudeJSON } from '@/lib/api-clients/anthropic'
import { HASHTAG_SYSTEM, buildHashtagPrompt } from '@/lib/prompts/writing'

export const runtime = 'edge'
export const maxDuration = 30

interface RequestBody {
  product:    string
  niche?:     string
  location?:  string
}

interface HashtagOutput {
  high_volume: string[]
  mid_volume:  string[]
  niche:       string[]
}

export const POST = withDailyLimit('hashtag', async (req: NextRequest) => {
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
      systemPrompt: HASHTAG_SYSTEM,
      userPrompt:   buildHashtagPrompt(body),
      maxTokens:    800,
      temperature:  0.5,  // Lower for accuracy
    })

    const hashtags = parseClaudeJSON<HashtagOutput>(text)
    if (!hashtags || !hashtags.high_volume) {
      return NextResponse.json(
        { error: 'parse_failed', raw: text },
        { status: 500 }
      )
    }

    // Ensure semua hashtag dimulai dengan #
    const normalize = (tags: string[]) => 
      tags.map(t => t.startsWith('#') ? t : `#${t}`)

    return NextResponse.json({
      success: true,
      hashtags: {
        high_volume: normalize(hashtags.high_volume),
        mid_volume:  normalize(hashtags.mid_volume),
        niche:       normalize(hashtags.niche),
      },
      meta: { model: 'claude-haiku-4-5', tokens: usage },
    })
  } catch (err) {
    console.error('[hashtag] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})