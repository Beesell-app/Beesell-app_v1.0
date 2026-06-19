// app/api/campaign/generate/route.ts
// ══════════════════════════════════════════════════════════════
// CAMPAIGN BUILDER AI — Generate API
// ══════════════════════════════════════════════════════════════
//
// POST /api/campaign/generate
// Body: {
//   productName, productDesc, productUrl?, productPrice,
//   objective, platforms[], budget, days, audience,
//   niche, language
// }
//
// Returns:
//   - campaign structure (ad sets per platform)
//   - adCopyVariants (5 A/B variants with headline + text + CTA)
//   - creativeVariants (5-10 visual briefs)
//   - estimatedReach, CPM, CTR estimates
//   - aiInsights (5 strategic recommendations)
//
// Uses Claude claude-sonnet-4-20250514 for all AI generation
// Plan: Pro+

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic        from '@anthropic-ai/sdk'
import {
  PLATFORMS, OBJECTIVES, CTA_OPTIONS, COPY_ANGLES,
  CREATIVE_FORMATS, estimateReach, estimateCPM,
  type PlatformId, type ObjectiveId,
  type AdCopyVariant, type CreativeVariant, type AdSet,
} from '@/lib/campaign/types'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Generate copy variants ─────────────────────────────────────
async function generateCopyVariants(params: {
  productName:  string
  productDesc:  string
  productPrice: string
  objective:    ObjectiveId
  platforms:    PlatformId[]
  niche:        string
  language:     string
  count:        number
}): Promise<AdCopyVariant[]> {
  const anthropic = getAnthropic()
  const objCfg    = OBJECTIVES[params.objective]
  const ctaList   = [...new Set(params.platforms.flatMap(p => CTA_OPTIONS[p]))]

  const msg = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `You are an expert digital advertising copywriter specializing in Indonesian e-commerce.
Generate highly converting ad copy for Facebook, Instagram, TikTok, and Google Display Ads.
Output ONLY valid JSON array. No markdown, no preamble.
Each variant must use a different psychological angle.
Language: ${params.language === 'en' ? 'English' : 'bahasa Indonesia natural, conversational'}.`,
    messages: [{
      role:    'user',
      content: `Generate ${params.count} ad copy variants for:
Product: ${params.productName}
Description: ${params.productDesc}
Price: ${params.productPrice}
Objective: ${objCfg.label} (KPI: ${objCfg.kpi})
Niche: ${params.niche}
Platforms: ${params.platforms.join(', ')}
Available CTAs: ${ctaList.slice(0,6).join(', ')}

Output JSON array of ${params.count} objects:
[{
  "id": "copy_1",
  "label": "Version A",
  "headline": "max 40 chars, attention-grabbing",
  "primaryText": "max 125 chars, benefit-focused, conversational",
  "description": "max 30 chars optional tagline",
  "cta": "one of the CTAs provided",
  "angle": "psychological angle name",
  "score": 0-100 predicted CTR score
}]

Make each variant use a completely different angle: curiosity, pain point, social proof, urgency, benefit, story, before/after, authority.
JSON array only.`,
    }],
  })

  const raw   = (msg.content[0] as any).text ?? '[]'
  const clean = raw.replace(/```json?|```/g, '').trim()
  try {
    const arr = JSON.parse(clean)
    return Array.isArray(arr) ? arr.slice(0, params.count) : []
  } catch {
    // Fallback variants
    return COPY_ANGLES.slice(0, params.count).map((angle, i) => ({
      id:          `copy_${i+1}`,
      label:       `Version ${['A','B','C','D','E'][i]}`,
      headline:    `${params.productName} — ${angle.desc.split(',')[0]}`,
      primaryText: `Dapatkan ${params.productName} dengan harga ${params.productPrice}. ${angle.desc}.`,
      description: 'Kualitas terjamin ✅',
      cta:         ctaList[0] ?? 'Shop Now',
      angle:       angle.label,
      score:       70 + Math.floor(Math.random() * 20),
    }))
  }
}

// ── Generate creative variants ─────────────────────────────────
async function generateCreativeVariants(params: {
  productName:  string
  productDesc:  string
  productImage: string
  platforms:    PlatformId[]
  objective:    ObjectiveId
  niche:        string
  count:        number
}): Promise<CreativeVariant[]> {
  const anthropic = getAnthropic()

  // Select relevant formats
  const relevantFormats = CREATIVE_FORMATS.filter(f =>
    f.platforms.some(p => params.platforms.includes(p as PlatformId))
  )

  const ENHANCER_PRESETS = [
    'shopee-clean','tiktok-viral','luxury-brand','lifestyle-outdoor',
    'dark-premium','minimalist-ecommerce','before-after','floating-product',
    'marketplace-booster','neon-ads','studio-professional','viral-ad-creative',
  ]

  const msg = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `You are a creative director for digital advertising in Indonesia.
Generate creative visual concepts for A/B testing.
Each variant must be visually distinct and target different psychological triggers.
Output ONLY valid JSON array.`,
    messages: [{
      role:    'user',
      content: `Generate ${params.count} creative visual ad variants for:
Product: ${params.productName}
Description: ${params.productDesc}
Objective: ${OBJECTIVES[params.objective].label}
Niche: ${params.niche}
Platforms: ${params.platforms.join(', ')}
Available formats: ${relevantFormats.map(f => `${f.label} (${f.ratio})`).join(', ')}
Available enhancer presets: ${ENHANCER_PRESETS.join(', ')}

Output JSON array of ${params.count} objects:
[{
  "id": "creative_1",
  "label": "Variant A — Style Name",
  "type": "image" or "video" or "carousel",
  "format": "one of: ${relevantFormats.map(f=>f.id).join(', ')}",
  "presetId": "one of the enhancer presets",
  "promptText": "Specific image generation prompt for this variant (30-50 words)",
  "headline": "paired headline for this visual",
  "description": "visual concept description in 1 sentence"
}]

Make each variant visually distinct: different backgrounds, lighting, composition, style.
JSON array only.`,
    }],
  })

  const raw   = (msg.content[0] as any).text ?? '[]'
  const clean = raw.replace(/```json?|```/g, '').trim()
  try {
    const arr = JSON.parse(clean)
    return (Array.isArray(arr) ? arr.slice(0, params.count) : []).map((v: any) => ({
      ...v,
      status:   'pending',
      imageUrl: undefined,
      platform: params.platforms,
    }))
  } catch {
    // Fallback creatives
    const presets   = ENHANCER_PRESETS.slice(0, params.count)
    const fmts      = relevantFormats.slice(0, params.count)
    return presets.map((preset, i) => ({
      id:          `creative_${i+1}`,
      label:       `Variant ${['A','B','C','D','E','F','G','H','I','J'][i]} — ${preset}`,
      type:        'image' as const,
      format:      fmts[i % fmts.length]?.id ?? 'feed-square',
      platform:    params.platforms,
      presetId:    preset,
      promptText:  `Professional ${params.niche} product photo of ${params.productName}, ${preset} style, high quality commercial photography`,
      headline:    `${params.productName} — Variant ${i+1}`,
      description: `Visual concept using ${preset} style for ${params.platforms.join('/')}`,
      status:      'pending' as const,
    }))
  }
}

// ── Generate campaign structure + insights ─────────────────────
async function generateCampaignStructure(params: {
  productName:  string
  productDesc:  string
  objective:    ObjectiveId
  platforms:    PlatformId[]
  totalBudget:  number
  days:         number
  audience:     any
  niche:        string
}): Promise<{ adSets: Partial<AdSet>[]; insights: string[] }> {
  const anthropic = getAnthropic()
  const objCfg    = OBJECTIVES[params.objective]

  const msg = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `You are a performance marketing strategist for Indonesian digital advertising.
Generate optimal campaign structure and strategic insights.
Output ONLY valid JSON.`,
    messages: [{
      role:    'user',
      content: `Generate campaign structure for:
Product: ${params.productName} | Niche: ${params.niche}
Objective: ${objCfg.label} (KPI: ${objCfg.kpi})
Platforms: ${params.platforms.join(', ')}
Total Budget: Rp ${params.totalBudget.toLocaleString()} | Duration: ${params.days} days
Daily Budget: Rp ${Math.floor(params.totalBudget / params.days).toLocaleString()}
Target Audience: ${JSON.stringify(params.audience)}

Output JSON:
{
  "adSets": [
    {
      "name": "descriptive ad set name",
      "platform": "meta|tiktok|google-display",
      "audience_focus": "brief audience description",
      "budget_pct": number (% of total budget),
      "placements": ["placement1","placement2"],
      "bid_strategy": "lowest-cost|cost-cap|target-roas"
    }
  ],
  "insights": [
    "5 specific strategic insights in bahasa Indonesia, referencing the product, budget, and platform"
  ]
}

Create ${params.platforms.length * 2} ad sets (2 per platform, different audiences).
Budget split: ${params.platforms.length > 1 ? 'distribute proportionally' : '100% single platform'}.
JSON only.`,
    }],
  })

  const raw   = (msg.content[0] as any).text ?? '{}'
  const clean = raw.replace(/```json?|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    return {
      adSets: params.platforms.flatMap(platform => [
        { name:`${platform} — Cold Audience`, platform, audience_focus:'New audience', budget_pct: Math.floor(60/params.platforms.length), placements:PLATFORMS.find(p=>p.id===platform)?.placements.slice(0,2) ?? [], bid_strategy:'lowest-cost' },
        { name:`${platform} — Retargeting`,   platform, audience_focus:'Warm/Retarget', budget_pct:Math.floor(40/params.platforms.length), placements:PLATFORMS.find(p=>p.id===platform)?.placements.slice(0,2) ?? [], bid_strategy:'cost-cap' },
      ]),
      insights: [
        `💡 Budget Rp${(params.totalBudget/1000000).toFixed(1)}Jt selama ${params.days} hari = Rp${Math.floor(params.totalBudget/params.days/1000)}K/hari — cukup untuk testing 2-3 audience berbeda.`,
        `🎯 Mulai dengan objective ${objCfg.label} dan optimize setelah 3-5 hari data terkumpul.`,
        `📊 Alokasikan 60% budget untuk cold audience (reach baru) dan 40% untuk retargeting.`,
        `⚡ A/B test minimal 5 variasi copy dan creative untuk menemukan winner dalam 7 hari pertama.`,
        `🚀 Setelah menemukan winning creative, scale budget 20-30% setiap 48 jam untuk hindari ad fatigue.`,
      ],
    }
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  const t0 = Date.now()
  try {
    const supabase = await createClient()
    const { data:{ user }, error:authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    // Plan check — Pro+
    const { data:profile } = await supabase.from('profiles')
      .select('plan').eq('id', user.id).single()
    if (!['pro','business'].includes(profile?.plan ?? '')) {
      return NextResponse.json({ error:'Campaign Builder memerlukan plan Pro atau Business.', upgrade:true }, { status:403 })
    }

    const body = await req.json()
    const {
      productName, productDesc = '', productUrl, productPrice = 'kompetitif',
      productImage, objective = 'sales',
      platforms = ['meta'],
      totalBudget = 1_500_000, days = 14,
      audience = {}, niche = 'general',
      language = 'id',
      copyCount = 5, creativeCount = 8,
    } = body

    if (!productName?.trim()) {
      return NextResponse.json({ error:'Nama produk wajib diisi' }, { status:400 })
    }
    if (!platforms?.length) {
      return NextResponse.json({ error:'Pilih minimal 1 platform' }, { status:400 })
    }

    // ── Run all AI tasks in parallel ──────────────────────────
    const [copyResult, creativeResult, structureResult] = await Promise.all([
      generateCopyVariants({ productName, productDesc, productPrice, objective, platforms, niche, language, count: copyCount }),
      generateCreativeVariants({ productName, productDesc, productImage: productImage ?? '', platforms, objective, niche, count: creativeCount }),
      generateCampaignStructure({ productName, productDesc, objective, platforms, totalBudget, days, audience, niche }),
    ])

    // ── Compute reach / CPM estimates ──────────────────────────
    const primaryPlatform = platforms[0] as PlatformId
    const reach           = estimateReach(totalBudget, primaryPlatform)
    const avgCPM          = estimateCPM(primaryPlatform)
    const platCfg         = PLATFORMS.find(p => p.id === primaryPlatform)!
    const estCTR          = platCfg.ctrBenchmark

    // ── Build full ad sets ─────────────────────────────────────
    const adSets: AdSet[] = (structureResult.adSets ?? []).map((s: any, i: number) => {
      const platConf = PLATFORMS.find(p => p.id === s.platform)!
      return {
        id:          `adset_${i+1}`,
        name:        s.name ?? `Ad Set ${i+1}`,
        platform:    (s.platform ?? primaryPlatform) as PlatformId,
        objective:   objective as ObjectiveId,
        audience:    {
          ageRange:  audience.ageRange  ?? ['25-34','35-44'],
          gender:    audience.gender    ?? 'all',
          interests: audience.interests ?? [],
          locations: audience.locations ?? ['Indonesia'],
          languages: audience.languages ?? ['id'],
          behaviors: audience.behaviors ?? [],
        },
        budget: {
          total:    Math.floor(totalBudget * ((s.budget_pct ?? 50) / 100)),
          daily:    Math.floor(totalBudget * ((s.budget_pct ?? 50) / 100) / days),
          days,
          currency: 'IDR',
          type:     'lifetime',
        },
        placements:  s.placements ?? platConf.placements.slice(0, 2),
        bidStrategy: (s.bid_strategy ?? 'lowest-cost') as any,
      }
    })

    // ── Build campaign ID ──────────────────────────────────────
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    // ── Save draft to DB ───────────────────────────────────────
    await supabase.from('campaigns').insert({
      id:                campaignId,
      user_id:           user.id,
      name:              `${productName} — ${OBJECTIVES[objective as ObjectiveId].label}`,
      product_name:      productName,
      product_desc:      productDesc,
      product_url:       productUrl ?? null,
      product_image:     productImage ?? null,
      objective,
      platforms,
      total_budget:      totalBudget,
      days,
      ad_sets:           adSets,
      copy_variants:     copyResult,
      creative_variants: creativeResult,
      ai_insights:       structureResult.insights ?? [],
      estimated_reach_min: reach.min,
      estimated_reach_max: reach.max,
      estimated_cpm:     avgCPM,
      estimated_ctr:     estCTR,
      status:            'draft',
      created_at:        new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }).catch(e => console.warn('[campaign/generate] DB insert warning:', e?.message))

    return NextResponse.json({
      success:          true,
      campaignId,
      name:             `${productName} — ${OBJECTIVES[objective as ObjectiveId].label}`,
      objective,
      platforms,
      adSets,
      copyVariants:     copyResult,
      creativeVariants: creativeResult,
      estimatedReach:   reach,
      estimatedCPM:     avgCPM,
      estimatedCTR:     estCTR,
      totalBudget,
      days,
      dailyBudget:      Math.floor(totalBudget / days),
      aiInsights:       structureResult.insights ?? [],
      elapsedMs:        Date.now() - t0,
    })

  } catch (err: any) {
    console.error('[campaign/generate]', err)
    return NextResponse.json({ error: err?.message ?? 'Generate gagal. Coba lagi.' }, { status:500 })
  }
}