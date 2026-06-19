// apps/web-app/app/api/generate/caption/route.ts
// ── BeeSell AI — Caption Generator API (Production) ──────────
// • 18-dimension input schema
// • AI Memory injection from Supabase
// • GPT-4o Vision for image analysis (Dim 14)
// • Model selection: gpt-4o for complex, gpt-4o-mini for simple
// • Quota check + decrement
// • Save to content library

import { NextResponse }   from 'next/server'
import { z }              from 'zod'
import { generateText }   from 'ai'
import { openai }         from '@ai-sdk/openai'
import { createClient }   from '@/lib/supabase/server'
import { db }             from '@/lib/db'
import { decrementQuota } from '@/lib/quota/quota-service'
import {
  buildCaptionPrompt, CAPTION_SYSTEM_PROMPT,
  type ProductInput, type CaptionConfig,
  type CaptionEngine, type MarketingObjective,
} from '@/lib/ai/caption-prompt-builder'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

// ── Full 18-dimension schema ──────────────────────────────────
const Schema = z.object({
  // Engine
  engine: z.enum([
    'caption','hook','cta','soft-selling','hard-selling','viral',
    'affiliate','storytelling','engagement','description','marketplace',
    'launching','rewrite',
  ]).default('caption'),

  // Dim 1 — Product (REQUIRED)
  productName:       z.string().min(2).max(300),
  productType:       z.string().max(100).optional(),
  productCategory:   z.string().max(100).optional(),
  productDesc:       z.string().max(1000).optional(),
  productFunction:   z.string().max(300).optional(),
  productHighlights: z.string().max(500).optional(),
  productUSP:        z.string().max(300).optional(),
  productBenefits:   z.string().max(500).optional(),
  productProblem:    z.string().max(300).optional(),
  productPrice:      z.string().max(100).optional(),
  productPromo:      z.string().max(200).optional(),
  productGuarantee:  z.string().max(200).optional(),
  productPackaging:  z.string().max(200).optional(),
  productCert:       z.string().max(200).optional(),

  // Dim 2 — Objective
  objective: z.enum([
    'hard-selling','soft-selling','branding','awareness','engagement',
    'viral','affiliate','lead-gen','marketplace-convert','launching','flash-sale',
  ]).default('hard-selling'),

  // Dim 3 — Platform
  platform: z.string().default('instagram'),

  // Dim 4 — Audience
  targetAudience: z.union([z.string(), z.array(z.string())]).optional(),

  // Dim 5 — Tone
  tone: z.string().default('casual'),

  // Dim 6 — Caption style
  style: z.enum([
    'storytelling','problem-solution','pas','aida','hook-viral','listicle',
    'testimonial','edukasi','fomo','cta-heavy','minimalis','cinematic',
  ]).optional(),

  // Dim 7 — Hook
  hookType: z.enum([
    'question','shock','pain-point','curiosity','statistic','viral','emotional','humor','fomo',
  ]).optional(),

  // Dim 8 — CTA
  ctaText:  z.string().max(200).optional(),
  ctaStyle: z.enum(['soft','medium','aggressive']).default('medium'),

  // Dim 9 — Keywords
  keywords: z.string().max(300).optional(),

  // Dim 10 — Language
  language: z.string().default('indonesian-casual'),

  // Dim 11 — Length
  length: z.enum(['short','medium','long','thread','carousel']).default('medium'),

  // Dim 12 — Emoji
  emoji: z.enum(['none','minimal','moderate','heavy']).default('moderate'),

  // Dim 13 — Hashtag
  generateHashtag: z.boolean().default(true),

  // Dim 14 — Visual context
  visualContext: z.object({
    imageUrl:       z.string().url().optional(),
    imageMode:      z.string().optional(),
    imageStyle:     z.string().optional(),
    aiDescription:  z.string().optional(),
    dominantColors: z.array(z.string()).optional(),
    mood:           z.string().optional(),
    hasModel:       z.boolean().optional(),
    background:     z.string().optional(),
  }).optional(),

  // Dim 15 — Emotion target
  emotionTarget: z.enum([
    'penasaran','percaya','urgent','excited','fomo','nyaman','premium','inspired',
  ]).optional(),

  // Dim 16 — Competitor style
  competitorStyle: z.string().max(200).optional(),

  // Dim 17 — Brand override
  brandOverride: z.object({
    name:        z.string().optional(),
    tagline:     z.string().optional(),
    positioning: z.string().optional(),
    keywords:    z.string().optional(),
    avoidWords:  z.string().optional(),
    personality: z.string().optional(),
  }).optional(),

  // Dim 18 — KPI
  conversionKPI: z.enum(['ctr','save-share','checkout','engagement','affiliate-click']).optional(),

  // Output
  variants: z.number().int().min(1).max(6).default(3),

  // Rewrite mode
  originalCaption: z.string().max(2000).optional(),

  // Use AI Memory
  useAIMemory: z.boolean().default(true),
})

// ── Vision analysis for Dim 14 ────────────────────────────────
async function analyzeImageWithVision(imageUrl: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            image: imageUrl,
          },
          {
            type: 'text',
            text: `Analisis gambar produk ini untuk kebutuhan copywriting marketing Indonesia. Berikan:
1. Deskripsi produk yang terlihat
2. Warna dominan (max 3 warna)
3. Mood/atmosphere (elegant, energetic, cozy, fresh, luxury, dll)
4. Background setting
5. Ada model/orang: ya/tidak
6. Kesan keseluruhan yang cocok untuk caption

Format: JSON singkat {"description":"...","colors":["warna1","warna2"],"mood":"...","background":"...","hasModel":true/false,"impression":"..."}`,
          },
        ],
      }],
      maxOutputTokens: 300,
    })
    return text
  } catch {
    return ''
  }
}

// ── Parse output by engine ────────────────────────────────────
function parseOutput(engine: string, raw: string) {
  const makeId = () => Math.random().toString(36).slice(2, 8)
  let parsed: any = {}

  // Try JSON parse
  try {
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    // Try extract JSON object
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]) } catch {}
    }
  }

  switch (engine) {
    case 'hook':
      return {
        type: 'hooks',
        items: (parsed.hooks ?? []).map((h: any) => ({
          id:   makeId(),
          text: typeof h === 'string' ? h : (h.text ?? ''),
          meta: {
            type:  h.type ?? '',
            score: String(h.virality_score ?? h.score ?? '8'),
          },
        })),
      }
    case 'cta':
      return {
        type: 'ctas',
        items: (parsed.ctas ?? []).map((c: any) => ({
          id:   makeId(),
          text: typeof c === 'string' ? c : (c.text ?? ''),
          meta: {
            style:    c.style ?? '',
            best_for: c.best_for ?? '',
          },
        })),
      }
    case 'marketplace':
      return {
        type: 'marketplace',
        items: (parsed.variants ?? []).map((v: any) => ({
          id:   makeId(),
          text: `${v.title ?? ''}\n\n${v.description ?? ''}`,
          meta: {
            title:    v.title ?? '',
            hashtags: (v.hashtags ?? []).join(' '),
            bullets:  (v.bullets ?? []).join('|||'),
          },
        })),
      }
    default: {
      const list = parsed.captions ?? parsed.items ?? []
      // If AI returned list of strings
      if (Array.isArray(list) && list.length > 0) {
        return {
          type:  'captions',
          items: list.map((t: any) => ({
            id:   makeId(),
            text: typeof t === 'string' ? t : JSON.stringify(t),
            meta: {},
          })),
        }
      }
      // Fallback: split by double newline
      if (raw.trim().length > 30) {
        const fallback = raw
          .split(/\n{2,}/)
          .map(t => t.trim())
          .filter(t => t.length > 20 && !t.startsWith('{') && !t.startsWith('['))
          .map(t => ({ id: makeId(), text: t, meta: {} }))
        if (fallback.length > 0) return { type: 'captions', items: fallback }
      }
      return { type: 'captions', items: [] }
    }
  }
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse + validate
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION', details: parsed.error.issues }, { status: 400 })
    }
    const d = parsed.data

    // Get user + tenant + AI Memory
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        tenant_id: true,
        tenants: {
          select: {
            plan: true,
            name: true,
            ai_memory: true,
            settings: true,
          },
        },
      },
    })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { tenant_id } = dbUser
    const aiMem = (dbUser.tenants?.ai_memory as any) ?? {}
    const s     = (dbUser.tenants?.settings as any) ?? {}
    const brandName = dbUser.tenants?.name ?? ''
    // ── Quota check ──────────────────────────────────────────
    const quota = await decrementQuota(tenant_id, 'content', 1)
    if (!quota.success) {
      return NextResponse.json({
        error:   quota.reason === 'daily' ? 'DAILY_QUOTA_EXCEEDED' : 'MONTHLY_QUOTA_EXCEEDED',
        message: quota.reason === 'daily'
          ? 'Kuota caption harian habis. Reset tengah malam WIB.'
          : 'Kuota caption bulanan habis. Upgrade plan untuk lebih.',
      }, { status: 429 })
    }

    // ── Dim 17: AI Memory → Brand Identity ───────────────────
    const voice    = aiMem.voice    ?? {}
    const identity = aiMem.identity ?? {}
    const product  = aiMem.product  ?? {}
    const visual   = aiMem.visual   ?? {}

    const brandIdentity: CaptionConfig['brandIdentity'] = {
      name:        dbUser.tenants.name ?? '',
      tagline:     visual.brandTagline ?? s.brandTagline ?? '',
      primaryColor:visual.primaryColor ?? s.primaryColor ?? '#2563EB',
      personality: voice.tone ?? s.defaultTone ?? 'casual',
      positioning: identity.sellerType ? `${identity.sellerType} di niche ${product.niche ?? 'umum'}` : '',
      keywords:    voice.brandKeywords ?? s.brandKeywords ?? '',
      avoidWords:  voice.avoidWords ?? s.avoidWords ?? '',
      niche:       product.niche ?? s.niche ?? '',
      sellerType:  identity.sellerType ?? s.sellerType ?? '',
      usp:         product.usp ?? voice.usp ?? s.usp ?? '',
      ...d.brandOverride,
    }

    // ── Dim 14: Vision analysis if image provided ─────────────
    let visualCtx = d.visualContext
    if (visualCtx?.imageUrl && !visualCtx.aiDescription) {
      const visionResult = await analyzeImageWithVision(visualCtx.imageUrl)
      if (visionResult) {
        try {
          const vData = JSON.parse(visionResult.replace(/```json\n?|\n?```/g,'').trim())
          visualCtx = {
            ...visualCtx,
            aiDescription:  vData.description ?? '',
            dominantColors: vData.colors ?? [],
            mood:           vData.mood ?? '',
            background:     vData.background ?? '',
            hasModel:       vData.hasModel,
          }
        } catch {
          visualCtx = { ...visualCtx, aiDescription: visionResult }
        }
      }
    }

    // ── Build ProductInput ────────────────────────────────────
    const productInput: ProductInput = {
      name:          d.productName,
      type:          d.productType     ?? product.productType,
      category:      d.productCategory ?? product.niche ?? s.niche,
      description:   d.productDesc,
      function:      d.productFunction,
      highlights:    d.productHighlights,
      usp:           d.productUSP      ?? product.usp ?? voice.usp,
      benefits:      d.productBenefits,
      problemSolved: d.productProblem,
      price:         d.productPrice,
      promo:         d.productPromo,
      guarantee:     d.productGuarantee,
      packaging:     d.productPackaging,
      certification: d.productCert,
    }

    // ── Build CaptionConfig with AI Memory fallback ───────────
    const captionConfig: CaptionConfig = {
      engine:         d.engine as CaptionEngine,
      objective:      d.objective as MarketingObjective,
      platform:       d.platform,
      targetAudience: d.targetAudience ?? product.targetAudience ?? (s.targetAudience ?? ['umum']),
      tone:           d.tone !== 'casual' ? d.tone : (voice.tone ?? s.defaultTone ?? 'casual'),
      style:          d.style as any,
      hookType:       d.hookType as any,
      ctaText:        d.ctaText,
      ctaStyle:       d.ctaStyle !== 'medium' ? d.ctaStyle : ((voice.ctaStyle ?? s.defaultCtaStyle ?? 'medium') as any),
      keywords:       d.keywords,
      language:       d.language !== 'indonesian-casual' ? d.language : (voice.language ?? s.defaultLanguage ?? 'indonesian-casual'),
      length:         d.length,
      emoji:          d.emoji !== 'moderate' ? d.emoji : ((voice.emoji ?? s.defaultEmoji ?? 'moderate') as any),
      generateHashtag:d.generateHashtag,
      visualContext:  visualCtx,
      emotionTarget:  d.emotionTarget as any,
      competitorStyle:d.competitorStyle,
      brandIdentity,
      conversionKPI:  d.conversionKPI as any,
      variants:       d.variants,
      originalCaption:d.originalCaption,
    }

    // ── Build prompt ──────────────────────────────────────────
    const prompt = buildCaptionPrompt(productInput, captionConfig)

    // ── Model selection ───────────────────────────────────────
    // Use GPT-4o for engines needing deep creativity/storytelling
    const needsGPT4o = ['storytelling','viral','affiliate','launching','rewrite'].includes(d.engine)
      || !!visualCtx?.imageUrl
      || d.variants >= 5
    const modelId = needsGPT4o ? 'gpt-4o' : 'gpt-4o-mini'

    // ── Generate ──────────────────────────────────────────────
    const { text } = await generateText({
      model:       openai(modelId),
      system:      CAPTION_SYSTEM_PROMPT,
      prompt,
      temperature: 0.88,
      maxOutputTokens:   2400,
    })

    // ── Parse output ──────────────────────────────────────────
    const result = parseOutput(d.engine, text)

    if (result.items.length === 0) {
      return NextResponse.json({
        error:   'EMPTY_OUTPUT',
        message: 'AI tidak menghasilkan output yang valid. Tambahkan deskripsi produk yang lebih detail.',
      }, { status: 500 })
    }

    // ── Save first result to library (non-fatal) ──────────────
    try {
      await db.content.create({
        data: {
          tenant_id,
          userId:          user.id,
          type:            'caption',
          engine:          d.engine,
          status:          'ready',
          primaryPlatform: d.platform,
          captionText:     result.items[0].text,
          captionVariants: result.items as any,
          title:           `${d.productName} — ${d.engine}`,
          aiModel:         modelId,
        },
      })
    } catch (dbErr: any) {
      console.warn('[caption] DB save failed (non-fatal):', dbErr?.message)
    }

    return NextResponse.json({
      success: true,
      engine:  d.engine,
      type:    result.type,
      items:   result.items,
      count:   result.items.length,
      model:   modelId,
      // AI Memory transparency
      memoryApplied: {
        tone:        captionConfig.tone,
        language:    captionConfig.language,
        emoji:       captionConfig.emoji,
        ctaStyle:    captionConfig.ctaStyle,
        brandName:   brandIdentity?.name,
        niche:       brandIdentity?.niche,
        hasVisualAI: !!visualCtx?.aiDescription,
      },
    })

  } catch (err: any) {
    console.error('[POST /api/generate/caption]', err?.message)
    if (err?.status === 429) {
      return NextResponse.json({ error:'AI_BUSY', message:'AI sedang sibuk. Coba 30 detik lagi.' }, { status:503 })
    }
    return NextResponse.json({ error:'INTERNAL', message: err?.message ?? 'Terjadi kesalahan.' }, { status:500 })
  }
}