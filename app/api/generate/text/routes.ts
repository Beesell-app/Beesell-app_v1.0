// apps/web-app/app/api/generate/text/route.ts — PATCH GUIDE
// ──────────────────────────────────────────────────────────────
// Tambahkan withQuotaCheck wrapper ke route yang sudah ada.
// Copy pattern ini ke generate/text/route.ts dan generate/image/route.ts
//
// BEFORE (tidak ada quota check):
//   export async function POST(req: Request) {
//     const me = await auth()
//     ...generate...
//     return NextResponse.json({ ... })
//   }
//
// AFTER (dengan quota check + watermark):
// ──────────────────────────────────────────────────────────────
import { NextResponse }      from 'next/server'
import { z }                 from 'zod'
import { withQuotaCheck }    from '@/lib/middleware/plan-check'
import type { AuthenticatedContext } from '@/lib/middleware/plan-check'
import { getCachedCascade, saveBothLayers } from '@/lib/ai/cache'
import { buildCaptionPrompt }              from '@/lib/ai/prompts'
import OpenAI                              from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const openai = new OpenAI()

const GenerateSchema = z.object({
  platform:    z.enum(['instagram', 'instagram_reels', 'tiktok']),
  contentGoal: z.enum(['product_launch', 'flash_sale', 'testimonial', 'educational', 'engagement']),
  tone:        z.enum(['casual', 'professional', 'energetic', 'friendly', 'luxury', 'playful']),
  language:    z.enum(['indonesian_casual', 'indonesian_formal', 'mixed_english', 'full_english']),
  productName: z.string().max(200),
  productDesc: z.string().max(1000).optional(),
  price:       z.string().max(50).optional(),
  brandKeywords: z.string().max(500).optional(),
  avoidWords:    z.string().max(200).optional(),
  variants:    z.number().int().min(1).max(5).default(3),
  emoji: z.enum([
    'heavy',
    'moderate',
    'minimal',
    'none',
  ]).default('moderate'),
  ctaStyle: z.enum([
    'soft',
    'medium',
    'aggressive',
  ]).default('medium'),
})

// ── Handler (receives ctx from withQuotaCheck) ─────────────────
async function handleGenerateText(
  req: Request,
  ctx: AuthenticatedContext,
): Promise<NextResponse> {

  const body   = await req.json()
  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  const params = parsed.data

  // Adjust model based on plan
  const model = ctx.limits.captionModel   // 'gpt-4o-mini' | 'gpt-4o'

  // Check semantic cache first
  const cacheKey  = `${params.platform}:${params.contentGoal}:${params.tone}:${params.productName}`
  const cached = await getCachedCascade(cacheKey, {
    productName: params.productName,
    tone: params.tone,
    language: params.language,
    emoji: params.emoji,
    ctaStyle: params.ctaStyle,
    platform: params.platform,
    contentGoal: params.contentGoal,
  })

  if (cached) {
    return NextResponse.json({
      success:  true,
      variants: cached,
      model,
      cached:   true,
      plan:     ctx.plan,
      // Note: quota NOT incremented for cache hits (inject in response header only)
    }, {
      headers: { 'X-Cache-Source': 'semantic' },
    })
  }

  // Build prompt
  const prompt = buildCaptionPrompt(params)

  // Call OpenAI with plan's model
  const completion = await openai.chat.completions.create({
    model,
    messages:    [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens:  1500,
  })

  const content = completion.choices[0]?.message?.content ?? ''

  // Parse response into variants
  const variants = parseVariants(content, params.variants)

  // Cache for next time
  await saveBothLayers(
    cacheKey,
    {
      productName: params.productName,
      tone: params.tone,
      language: params.language,
      emoji: params.emoji,
      ctaStyle: params.ctaStyle,
      platform: params.platform,
      contentGoal: params.contentGoal,
    },
    {
      variants,
      model,
      cached_at: new Date().toISOString(),
    }
  )

  return NextResponse.json({
    success:  true,
    variants,
    model,
    cached:   false,
    plan:     ctx.plan,
    // Watermark info (for UI to show badge)
    watermarked: false,   // text captions don't get watermark
    needsWatermark: ctx.needsWatermark,
  })
}

// Wrap with quota check
export const POST = withQuotaCheck({ metric: 'caption' }, handleGenerateText)

// ── Helper: parse LLM output into structured variants ──────────
function parseVariants(content: string, count: number): Array<{
  caption: string; hashtags: string[]; cta: string
}> {
  // Try JSON parse first (prompt asks for JSON)
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed.slice(0, count)
    if (parsed.variants) return parsed.variants.slice(0, count)
  } catch {}

  // Fallback: split by variant markers
  const parts = content.split(/Variasi \d+:|Variant \d+:/i).filter(Boolean)
  return parts.slice(0, count).map(p => ({
    caption:  p.trim(),
    hashtags: extractHashtags(p),
    cta:      '',
  }))
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) ?? []).map(t => t.slice(1))
}

