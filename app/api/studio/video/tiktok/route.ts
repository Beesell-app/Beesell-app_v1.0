// app/api/studio/video/tiktok/route.ts
// ══════════════════════════════════════════════════════════════
// TIKTOK REELS AI — API Route
// POST ?action=analyze   → parse URL / product info with AI
// POST ?action=script    → generate full script + hooks + captions + hashtags
// POST ?action=variants  → generate 3 A/B hook variants (all 12 script types at once)
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildScriptPrompt, buildHookVariants, buildHashtags,
  SCRIPT_VARIANTS, PLATFORMS, VISUAL_SEQUENCES,
  extractPlatformFromUrl,
  type ScriptVariantId, type PlatformId, type NicheId,
  type DurationSec,
} from '@/lib/studio/tiktok/presets'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 90

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ── Parse Claude response into sections ────────────────────────
function parseSections(raw: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const tags = ['HOOK', 'SCRIPT', 'CAPTION', 'CTA', 'VISUAL_NOTES']
  tags.forEach(tag => {
    const re    = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[(?:${tags.join('|')})\\]|$)`, 'i')
    const match = raw.match(re)
    if (match) sections[tag.toLowerCase()] = match[1].trim()
  })
  return sections
}

// ── Handler ────────────────────────────────────────────────────
export async function POST(req: Request) {
  const t0     = Date.now()
  const url    = new URL(req.url)
  const action = url.searchParams.get('action') ?? 'script'

  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── action=analyze: extract product info from URL ─────────
    if (action === 'analyze') {
      const body = await req.json()
      const { productUrl } = body as { productUrl: string }

      if (!productUrl?.trim()) {
        return NextResponse.json({ error: 'URL produk wajib diisi' }, { status: 400 })
      }

      const platform = extractPlatformFromUrl(productUrl)

      // Use Claude to analyze/simulate product extraction
      // In production: call Shopee/TikTok API or web-scrape
      const anthropic = getAnthropic()
      const msg = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 600,
        system: `You are a product analyst for Indonesian e-commerce. 
Extract or infer realistic product information from a marketplace URL.
Always respond ONLY in JSON format with these exact keys:
{
  "productName": string,
  "price": string (in Rupiah, e.g. "Rp 89.000"),
  "mainBenefit": string (1 sentence),
  "painPoint": string (1 sentence problem it solves),
  "targetMarket": string (demographic description),
  "socialProof": string (ratings/sold count estimation),
  "niche": one of: fashion|beauty|skincare|food|gadget|health|home|baby|hijab|general,
  "competitors": string (1-2 common alternatives)
}
If the URL seems like a product page, make realistic estimates. Never refuse.`,
        messages: [{ role: 'user', content: `Analyze this ${platform} product URL and extract info: ${productUrl}\n\nRespond with JSON only, no markdown.` }],
      })

      const raw  = (msg.content[0] as any).text ?? '{}'
      const clean = raw.replace(/```json?|```/g, '').trim()

      try {
        const data = JSON.parse(clean)
        return NextResponse.json({ success: true, platform, ...data, elapsedMs: Date.now() - t0 })
      } catch {
        return NextResponse.json({ success: true, platform, productName: '', price: '', mainBenefit: '', painPoint: '', targetMarket: '', socialProof: '', niche: 'general', competitors: '' })
      }
    }

    // ── action=script: generate single script ─────────────────
    if (action === 'script') {
      const body = await req.json()
      const {
        variantId, platform, duration, productName, productPrice,
        targetMarket, mainBenefit, painPoint, socialProof,
        niche, language, tone, affiliateCode,
      } = body as {
        variantId:     ScriptVariantId
        platform:      PlatformId
        duration:      DurationSec
        productName:   string
        productPrice:  string
        targetMarket:  string
        mainBenefit:   string
        painPoint:     string
        socialProof:   string
        niche:         NicheId
        language:      'indonesia' | 'english'
        tone:          string
        affiliateCode?:string
      }

      if (!productName?.trim()) return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 })
      if (!variantId)           return NextResponse.json({ error: 'Pilih jenis script' },      { status: 400 })

      const prompt    = buildScriptPrompt({ variantId, platform, duration, productName, productPrice, targetMarket, mainBenefit, painPoint, socialProof, niche, language: language ?? 'indonesia', tone: tone ?? 'casual', affiliateCode })
      const hooks     = buildHookVariants(productName, niche ?? 'general', productPrice ?? '')
      const hashtags  = buildHashtags(niche ?? 'general', platform ?? 'tiktok', productName)
      const scenes    = VISUAL_SEQUENCES[variantId] ?? []

      const anthropic = getAnthropic()
      const msg = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 1200,
        system:     'You are an expert TikTok/Reels viral content creator. Write authentic, engaging scripts that convert. Follow the exact output format requested.',
        messages:   [{ role: 'user', content: prompt }],
      })

      const raw      = (msg.content[0] as any).text ?? ''
      const sections = parseSections(raw)

      return NextResponse.json({
        success: true,
        script: {
          hook:         sections.hook        ?? '',
          fullScript:   sections.script      ?? raw,
          caption:      sections.caption     ?? '',
          cta:          sections.cta         ?? '',
          visualNotes:  sections.visual_notes ?? '',
          visualScenes: scenes,
        },
        hooks,
        hashtags,
        variantId,
        platform,
        duration,
        elapsedMs: Date.now() - t0,
      })
    }

    // ── action=variants: generate ALL 12 scripts at once ──────
    if (action === 'variants') {
      const body = await req.json()
      const { productName, productPrice, targetMarket, mainBenefit, painPoint, socialProof, niche, platform, duration } = body

      if (!productName?.trim()) return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 })

      const anthropic = getAnthropic()

      // Build a compact multi-script prompt
      const systemPrompt = `You are an expert TikTok/Reels viral scriptwriter for Indonesian e-commerce.
Generate 12 different video scripts for the same product — one for each format.
Product: ${productName} | Price: ${productPrice || 'competitively priced'} | Benefit: ${mainBenefit} | Pain point: ${painPoint} | Target: ${targetMarket}

For each script type, write ONLY: [TYPE_ID] then 2-3 sentences hook + script. Keep each under 80 words.
Output 12 entries, one per line, in this format:
[soft-selling] <hook> ... <script snippet>
[hard-selling] <hook> ... <script snippet>
[storytelling] <hook> ... <script snippet>
[ugc-review] <hook> ... <script snippet>
[product-review] <hook> ... <script snippet>
[comparison] <hook> ... <script snippet>
[affiliate] <hook> ... <script snippet>
[problem-solution] <hook> ... <script snippet>
[before-after] <hook> ... <script snippet>
[tutorial] <hook> ... <script snippet>
[unboxing] <hook> ... <script snippet>
[testimonial] <hook> ... <script snippet>

Write in bahasa Indonesia. Make each hook unique and compelling. No extra text.`

      const msg = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 2000,
        messages:   [{ role: 'user', content: systemPrompt }],
      })

      const raw     = (msg.content[0] as any).text ?? ''
      const hooks   = buildHookVariants(productName, niche ?? 'general', productPrice ?? '')
      const hashObj = buildHashtags(niche ?? 'general', platform ?? 'tiktok', productName)

      // Parse each variant
      const variantScripts: Record<string, string> = {}
      SCRIPT_VARIANTS.forEach(v => {
        const re    = new RegExp(`\\[${v.id}\\]([^\\[]+)`, 'i')
        const match = raw.match(re)
        variantScripts[v.id] = match ? match[1].trim() : ''
      })

      return NextResponse.json({
        success:        true,
        variantScripts,
        hookVariants:   hooks,
        hashtags:       hashObj,
        totalVariants:  SCRIPT_VARIANTS.length,
        elapsedMs:      Date.now() - t0,
      })
    }

    return NextResponse.json({ error: `Action '${action}' tidak dikenal` }, { status: 400 })

  } catch (err: any) {
    console.error('[tiktok-reels] error:', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}