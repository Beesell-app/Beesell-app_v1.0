// app/api/studio/writing/caption/route.ts
// ══════════════════════════════════════════════════════════════
// Caption Generator — Claude Haiku 4.5
// Daily limit: Basic 5 | Pro 15 | Business 40
// COGS: Rp48 per call (PMSE PPN included)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { generateLight, parseClaudeJSON } from '@/lib/api-clients/anthropic'
import { CAPTION_SYSTEM, buildCaptionPrompt } from '@/lib/prompts/writing'

export const runtime = 'edge'
export const maxDuration = 30

interface RequestBody {
  product:   string
  audience?: string
  tone?:     string
  platform?: 'shopee' | 'tokopedia' | 'tiktok-shop' | 'instagram'
}

interface CaptionVariant {
  style:   string
  caption: string
}

export const POST = withDailyLimit('caption', async (req: NextRequest) => {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // ── Validate input ─────────────────────────────────────────
  if (!body.product || body.product.trim().length < 3) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'Nama produk wajib (min 3 karakter)' },
      { status: 400 }
    )
  }
  if (body.product.length > 500) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'Deskripsi produk terlalu panjang (max 500 karakter)' },
      { status: 400 }
    )
  }

  // ── Generate via Haiku ─────────────────────────────────────
  try {
    const { text, usage } = await generateLight({
      systemPrompt: CAPTION_SYSTEM,
      userPrompt:   buildCaptionPrompt(body),
      maxTokens:    800,
      temperature:  0.8,
    })

    const captions = parseClaudeJSON<CaptionVariant[]>(text)
    if (!captions || !Array.isArray(captions) || captions.length === 0) {
      return NextResponse.json(
        { error: 'parse_failed', message: 'Gagal parse output AI', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success:  true,
      captions,
      meta: {
        model:        'claude-haiku-4-5',
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
      },
    })
  } catch (err) {
    console.error('[caption] Generation error:', err)
    return NextResponse.json(
      { 
        error: 'generation_failed', 
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})