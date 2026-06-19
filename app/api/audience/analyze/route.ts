// app/api/audience/analyze/route.ts
// ══════════════════════════════════════════════════════════════
// AUDIENCE INTELLIGENCE — Analyze API (single unified endpoint)
// ══════════════════════════════════════════════════════════════
//
// POST /api/audience/analyze
// Body: {
//   action: 'interests' | 'lookalike' | 'retarget' | 'full'
//   niche, platforms[], productName, productDesc
//   // For lookalike:
//   customerData?: { count, avgAge, genderSplit, topLocations, avgOrderValue, interests }
//   // For retarget:
//   pixelId?, websiteUrl?, platforms[]
// }
//
// Returns contextual AI analysis + configured audience specs

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  INTEREST_TAXONOMY, PIXEL_EVENTS, RETARGET_STRATEGIES,
  BASE_PIXEL_SCRIPTS, getTopInterests,
  type NicheId, type PlatformId, type RetargetWindowDay,
  type PixelEventType, type PixelEventConfig, type LookalikeAudience, type RetargetAudience,
} from '@/lib/audience/types'

export const dynamic     = 'force-dynamic'
export const maxDuration = 45

const getAI = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── 1. Interest Mapping ────────────────────────────────────────
async function analyzeInterests(params: {
  niche:       NicheId
  platforms:   PlatformId[]
  productName: string
  productDesc: string
}) {
  const ai         = getAI()
  const allInterests = params.platforms.flatMap(p =>
    getTopInterests(params.niche, p, 8)
  )

  // Remove duplicates
  const unique = Array.from(
    new Map(allInterests.map(i => [i.id, i])).values()
  )

  const msg = await ai.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1200,
    system: `You are a digital advertising targeting expert for Indonesian market.
Analyze product and recommend interest targeting strategy.
Output ONLY valid JSON, no markdown.`,
    messages: [{
      role:    'user',
      content: `Product: ${params.productName}
Description: ${params.productDesc}
Niche: ${params.niche}
Platforms: ${params.platforms.join(', ')}

Available interests: ${JSON.stringify(unique.map(i => ({ id:i.id, name:i.name, affinity:i.affinity, audienceSize:i.audienceSize, competition:i.competition })))}

Output JSON:
{
  "topRecommended": [interest ids - max 5, sorted by strategic priority],
  "avoidInterests": [interest ids that might waste budget],
  "strategy": "2-3 sentence targeting strategy in bahasa Indonesia",
  "stackingTip": "advice on stacking/combining interests in bahasa Indonesia",
  "audienceSizeWarning": "warning if audience too small or too large, bahasa Indonesia",
  "estimatedDailyReach": { "min": number, "max": number },
  "expectedCPM": number,
  "abTestSuggestion": "A/B test recommendation in bahasa Indonesia"
}`,
    }],
  })

  const raw  = (msg.content[0] as any).text ?? '{}'
  const data = JSON.parse(raw.replace(/```json?|```/g,'').trim())

  return {
    allInterests:    unique,
    recommended:     unique.filter(i => (data.topRecommended ?? []).includes(i.id)),
    avoid:           unique.filter(i => (data.avoidInterests ?? []).includes(i.id)),
    strategy:        data.strategy ?? '',
    stackingTip:     data.stackingTip ?? '',
    sizeWarning:     data.audienceSizeWarning ?? '',
    estimatedReach:  data.estimatedDailyReach ?? { min:50000, max:200000 },
    expectedCPM:     data.expectedCPM ?? 15000,
    abTestSuggestion:data.abTestSuggestion ?? '',
  }
}

// ── 2. Lookalike Builder ───────────────────────────────────────
async function buildLookalike(params: {
  niche:        NicheId
  platforms:    PlatformId[]
  productName:  string
  customerData: {
    count:         number
    avgAge?:       string
    genderSplit?:  string
    topLocations?: string[]
    avgOrderValue?:number
    interests?:    string[]
    sourceType:    'customer_list' | 'website_visitors' | 'engagement' | 'purchase_events'
  }
}): Promise<{ audiences: LookalikeAudience[]; insights: string[]; uploadInstructions: string }> {
  const ai    = getAI()
  const sizes: (1|2|3|5|10)[] = params.customerData.count >= 1000 ? [1,2,3] : [2,5,10]

  const msg = await ai.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `You are a Facebook/Meta Ads audience specialist.
Generate lookalike audience recommendations for Indonesian market.
Output ONLY valid JSON.`,
    messages: [{
      role:    'user',
      content: `Create lookalike audience strategy for:
Product: ${params.productName} | Niche: ${params.niche}
Source: ${params.customerData.sourceType}
Seed size: ${params.customerData.count} ${params.customerData.sourceType === 'customer_list' ? 'customers' : 'visitors'}
Customer profile: ${JSON.stringify(params.customerData)}
Platforms: ${params.platforms.join(', ')}

Output JSON:
{
  "recommendedSizes": [1,2,3] (percentages, smaller = more similar),
  "qualityScore": 0-100 (based on seed size - 1000+ is ideal),
  "insights": ["3 specific insights in bahasa Indonesia about this lookalike"],
  "uploadInstructions": "step-by-step in bahasa Indonesia how to upload customer list to Meta",
  "hashingNote": "note about data hashing for privacy",
  "bestSourceType": "which source type would give best results for this product"
}`,
    }],
  })

  const raw  = (msg.content[0] as any).text ?? '{}'
  const data = JSON.parse(raw.replace(/```json?|```/g,'').trim())

  // Build audience objects
  const now = new Date().toISOString()
  const popIndonesia = 220_000_000  // adult population estimate

  const audiences: LookalikeAudience[] = sizes.map(size => ({
    id:            `lal_${size}pct_${Date.now()}`,
    name:          `LAL ${size}% — ${params.productName} ${params.customerData.sourceType}`,
    sourceType:    params.customerData.sourceType,
    sourceSize:    params.customerData.count,
    country:       'Indonesia',
    size,
    estimatedReach:{
      min: Math.floor(popIndonesia * (size/100) * 0.7),
      max: Math.floor(popIndonesia * (size/100) * 1.1),
    },
    platform:      params.platforms[0],
    similarity:    size === 1 ? 95 : size === 2 ? 88 : size === 3 ? 80 : 70,
    excludeSource: true,
    createdAt:     now,
  }))

  return {
    audiences,
    insights:           data.insights ?? [],
    uploadInstructions: data.uploadInstructions ?? '',
  }
}

// ── 3. Retargeting Setup ──────────────────────────────────────
async function setupRetargeting(params: {
  niche:      NicheId
  platforms:  PlatformId[]
  productName:string
  pixelIds?:  Partial<Record<PlatformId, string>>
  websiteUrl?:string
}): Promise<{
  audiences:         RetargetAudience[]
  pixelSetup:        Record<PlatformId, { baseScript:string; priorityEvents:PixelEventConfig[] }>
  funnelStrategy:    string[]
  implementationTip: string
}> {
  const ai = getAI()
  const now = new Date().toISOString()

  // Build recommended retargeting audiences
  const audiences: RetargetAudience[] = []
  const hot   = RETARGET_STRATEGIES.filter(s => s.priority === 'hot')
  const warm  = RETARGET_STRATEGIES.filter(s => s.priority === 'warm').slice(0,1)

  for (const platform of params.platforms) {
    // Hot: Add to Cart but no Purchase (30 days)
    audiences.push({
      id:            `rt_cart_${platform}_${Date.now()}`,
      name:          `🔥 AddToCart – NoPurchase (30d) — ${platform}`,
      platform,
      type:          'website',
      windowDays:    30,
      pixelEvents:   ['AddToCart'],
      filters:       [{ field:'events', operator:'NOT_CONTAINS', value:'Purchase' }],
      estimatedSize: { min:500, max:5000 },
      description:   'User yang menambah ke keranjang tapi belum beli — highest intent',
      priority:      'hot',
      recommendedBid:'high',
      createdAt:     now,
    })

    // Hot: ViewContent no Purchase (14 days)
    audiences.push({
      id:            `rt_view_${platform}_${Date.now()}`,
      name:          `🔥 ViewContent – NoPurchase (14d) — ${platform}`,
      platform,
      type:          'website',
      windowDays:    14,
      pixelEvents:   ['ViewContent'],
      filters:       [{ field:'events', operator:'NOT_CONTAINS', value:'Purchase' }],
      estimatedSize: { min:2000, max:15000 },
      description:   'Melihat produk tapi belum beli — warm interest',
      priority:      'hot',
      recommendedBid:'high',
      createdAt:     now,
    })

    // Warm: All website visitors 30d
    audiences.push({
      id:            `rt_all_${platform}_${Date.now()}`,
      name:          `♨️ All Website Visitors (30d) — ${platform}`,
      platform,
      type:          'website',
      windowDays:    30,
      pixelEvents:   ['PageView'],
      estimatedSize: { min:5000, max:50000 },
      description:   'Semua pengunjung website 30 hari — nurturing audience',
      priority:      'warm',
      recommendedBid:'medium',
      createdAt:     now,
    })

    // Cold: Past purchasers (upsell)
    audiences.push({
      id:            `rt_purchase_${platform}_${Date.now()}`,
      name:          `💰 Past Purchasers (180d) — ${platform}`,
      platform,
      type:          'website',
      windowDays:    180,
      pixelEvents:   ['Purchase'],
      estimatedSize: { min:200, max:3000 },
      description:   'Customer yang sudah beli — upsell & repeat purchase',
      priority:      'cold',
      recommendedBid:'normal',
      createdAt:     now,
    })

    // Engagement: Video viewers (TikTok/Meta)
    if (platform !== 'google') {
      audiences.push({
        id:            `rt_video_${platform}_${Date.now()}`,
        name:          `📹 Video Viewers 75% (30d) — ${platform}`,
        platform,
        type:          'video_viewers',
        windowDays:    30,
        pixelEvents:   [],
        estimatedSize: { min:3000, max:25000 },
        description:   'Menonton video 75% hingga selesai — highly engaged',
        priority:      'warm',
        recommendedBid:'medium',
        createdAt:     now,
      })
    }
  }

  // Build pixel setup per platform
  const pixelSetup: Record<string, any> = {}
  for (const platform of params.platforms) {
    const pixelId = params.pixelIds?.[platform] ?? `YOUR_${platform.toUpperCase()}_PIXEL_ID`
    const niche   = params.niche

    // Priority events based on niche (e-commerce focus)
    const priorityEventIds: PixelEventType[] = niche === 'baby' || niche === 'health'
      ? ['ViewContent','Lead','Purchase']
      : ['ViewContent','AddToCart','InitiateCheckout','Purchase']

    pixelSetup[platform] = {
      baseScript:     BASE_PIXEL_SCRIPTS[platform](pixelId),
      priorityEvents: priorityEventIds.map(e => PIXEL_EVENTS[e]),
    }
  }

  // AI funnel strategy
  const msg = await ai.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 600,
    system: `You are a performance marketing expert for Indonesian e-commerce. Respond in bahasa Indonesia.`,
    messages: [{
      role:    'user',
      content: `Create a 5-step retargeting funnel strategy for:
Product: ${params.productName} | Niche: ${params.niche}
Platforms: ${params.platforms.join(', ')}

Output JSON: {
  "funnelSteps": ["5 tactical steps in bahasa Indonesia, each starting with action verb"],
  "implementationTip": "1 key implementation tip in bahasa Indonesia"
}`,
    }],
  })

  const raw  = (msg.content[0] as any).text ?? '{}'
  const aiData = JSON.parse(raw.replace(/```json?|```/g,'').trim())

  return {
    audiences,
    pixelSetup,
    funnelStrategy:    aiData.funnelSteps ?? [],
    implementationTip: aiData.implementationTip ?? '',
  }
}

// ── Pre-built audience segments ───────────────────────────────
function buildAudienceSegments(niche: NicheId, platforms: PlatformId[]) {
  const SEGMENT_PRESETS: Partial<Record<NicheId, { name:string; desc:string; interests:string[]; estimatedSize:string; cpmIndex:number; priority:number }[]> = {
    fashion: [
      { name: 'Fashion Enthusiasts 25-34',
      desc: 'Core fashion buyer',
      interests: ['Fashion & Style'],
      estimatedSize: '8-15M',
      cpmIndex: 1.2,
      priority: 1, },
      { name:'Trendsetter Youth 18-24',        desc:'Gen-Z fashion, TikTok-first, low AOV but high volume',   interests:['Street Fashion','Fashion Influencers','Online Shopping'], estimatedSize:'5-10M', cpmIndex:0.9, priority:2 },
      { name:'Premium Fashion Buyer',          desc:'Higher AOV, brand-conscious, quality over price',        interests:['Fashion & Style','Online Shopping'],                       estimatedSize:'3-6M',  cpmIndex:1.4, priority:3 },
    ],
    beauty: [
      { name:'Beauty Enthusiast Core',         desc:'Daily makeup, skincare routine, high engagement',        interests:['Beauty & Cosmetics','Makeup Tutorials'],                  estimatedSize:'10-18M',cpmIndex:1.2, priority:1 },
      { name:'K-Beauty Follower',              desc:'Korean beauty trend, willing to try new brands',         interests:['K-Beauty','Skincare Routine'],                            estimatedSize:'4-8M',  cpmIndex:1.0, priority:2 },
      { name:'Halal Beauty Seeker',            desc:'Halal-certified products, Muslim audience',              interests:['Halal Cosmetics','Muslim Lifestyle'],                     estimatedSize:'3-7M',  cpmIndex:1.0, priority:3 },
    ],
    skincare: [
      { name:'Skincare Routine Addict',        desc:'Daily routine, multiple products, research-heavy buyer', interests:['Skin Care','Skincare Routine'],                           estimatedSize:'8-14M', cpmIndex:1.3, priority:1 },
      { name:'Acne Solution Seeker',           desc:'Problem-solution buyer, high intent for specific fix',   interests:['Acne Treatment','Dermatology & Skin Issues'],             estimatedSize:'4-8M',  cpmIndex:1.0, priority:2 },
      { name:'Anti-Aging Early Adopter',       desc:'35+ female, preventing wrinkles, premium-willing',      interests:['Anti-Aging','Skin Care'],                                 estimatedSize:'5-9M',  cpmIndex:1.1, priority:3 },
    ],
    food: [
      { name:'Foodie & Culinary Explorer',     desc:'Tries new food actively, shares content, food social',   interests:['Food & Beverage','Indonesian Food'],                      estimatedSize:'12-20M',cpmIndex:0.8, priority:1 },
      { name:'Healthy Eating Conscious',       desc:'Checks nutrition, prefers natural/organic',              interests:['Healthy Eating','Herbal & Traditional'],                  estimatedSize:'4-8M',  cpmIndex:0.9, priority:2 },
      { name:'Coffee Culture',                 desc:'Daily coffee habit, cafe-goer, premium willing',        interests:['Coffee Enthusiasts','Food Delivery'],                     estimatedSize:'5-9M',  cpmIndex:1.0, priority:3 },
    ],
    general: [
      { name:'Online Shopper Core',            desc:'Frequent marketplace buyer, deal-conscious, mobile-first',interests:['Online Shopping','Shopee & Tokopedia Users'],            estimatedSize:'20-35M',cpmIndex:1.2, priority:1 },
      { name:'TikTok Shop Live Buyer',         desc:'Buys during live stream, impulse buyer, social proof',  interests:['TikTok Shop Buyers'],                                    estimatedSize:'10-18M',cpmIndex:1.2, priority:2 },
      { name:'Deal Hunter',                    desc:'Promo-driven, waits for discount, high volume',         interests:['Deal Hunters & Promo'],                                  estimatedSize:'10-18M',cpmIndex:1.0, priority:3 },
    ],
    gadget: [
      { name:'Gadget Enthusiast Core',    desc:'Pembeli elektronik aktif, riset spesifikasi, sering upgrade', interests:['Gadgets & Electronics','Online Shopping'],   estimatedSize:'10-18M', cpmIndex:1.1, priority:1 },
      { name:'Early Tech Adopter',        desc:'Selalu mau produk terbaru, brand-conscious, AOV tinggi',      interests:['Smartphones','Tech Reviews'],                estimatedSize:'5-9M',   cpmIndex:1.3, priority:2 },
      { name:'Budget Tech Shopper',       desc:'Cari value, tunggu promo, sensitif harga',                    interests:['Online Shopping','Deal Hunters & Promo'],    estimatedSize:'8-14M',  cpmIndex:0.9, priority:3 },
    ],
    health: [
      { name:'Health & Wellness Core',    desc:'Peduli kesehatan, rutin konsumsi suplemen',                   interests:['Health & Wellness','Healthy Eating'],        estimatedSize:'8-15M',  cpmIndex:1.1, priority:1 },
      { name:'Supplement & Vitamin Buyer',desc:'Pembeli vitamin/herbal, problem-solution',                    interests:['Supplements & Vitamins','Herbal & Traditional'], estimatedSize:'4-8M', cpmIndex:1.0, priority:2 },
      { name:'Fitness Active',            desc:'Olahraga rutin, gym/home workout, protein & nutrisi',         interests:['Fitness & Gym','Healthy Eating'],            estimatedSize:'5-9M',   cpmIndex:1.0, priority:3 },
    ],
    home: [
      { name:'Home Decor Enthusiast',     desc:'Suka dekor rumah, estetik, sering belanja perabot',           interests:['Home & Living','Interior Design'],           estimatedSize:'8-14M',  cpmIndex:1.0, priority:1 },
      { name:'New Homeowner / Newlywed',  desc:'Baru punya rumah/menikah, kebutuhan rumah tinggi',            interests:['Home & Living','Online Shopping'],           estimatedSize:'4-7M',   cpmIndex:1.1, priority:2 },
      { name:'Smart Home Adopter',        desc:'Tertarik perangkat smart home, tech-savvy',                   interests:['Smart Home','Gadgets & Electronics'],        estimatedSize:'3-6M',   cpmIndex:1.2, priority:3 },
    ],
    baby: [
      { name:'New Parent Core (0-2thn)',  desc:'Orang tua baru, kebutuhan bayi rutin, high intent',           interests:['Baby & Kids','Parenting'],                   estimatedSize:'6-11M',  cpmIndex:1.1, priority:1 },
      { name:'Expecting Mother',          desc:'Ibu hamil, persiapan kelahiran, riset produk',                interests:['Pregnancy','Parenting'],                     estimatedSize:'3-6M',   cpmIndex:1.2, priority:2 },
      { name:'Toddler Parent',            desc:'Anak balita, mainan edukatif & kebutuhan harian',             interests:['Baby & Kids','Educational Toys'],            estimatedSize:'5-9M',   cpmIndex:1.0, priority:3 },
    ],
    hijab: [
      { name:'Hijab Fashion Core',        desc:'Pemakai hijab harian, fashion modest, repeat buyer',          interests:['Hijab Fashion','Muslim Lifestyle'],          estimatedSize:'10-18M', cpmIndex:1.0, priority:1 },
      { name:'Modest Fashion Trendsetter',desc:'Gen-Z muslimah, trend-driven, TikTok-first',                  interests:['Modest Fashion','Fashion Influencers'],      estimatedSize:'5-10M',  cpmIndex:0.9, priority:2 },
      { name:'Premium Hijab Buyer',       desc:'AOV tinggi, bahan premium, brand-conscious',                  interests:['Hijab Fashion','Fashion & Style'],           estimatedSize:'3-6M',   cpmIndex:1.2, priority:3 },
    ],
  }

  const segs = SEGMENT_PRESETS[niche] ?? SEGMENT_PRESETS.general
  return segs.map((s, i) => ({ ...s, id:`seg_${i}_${niche}`, platform:platforms[0] }))
}

// ── Overlap estimator ─────────────────────────────────────────
// Estimates audience overlap when stacking multiple interests
function estimateOverlap(interestIds: string[], niche: NicheId): {
  overlapPct:    number
  warningLevel:  'none' | 'low' | 'medium' | 'high'
  recommendation:string
  estimatedReach:{ min:number; max:number }
} {
  const count = interestIds.length
  // More interests stacked = more overlap (diminishing reach)
  // Indonesian market audience sizes
  const baseReach = 15_000_000
  const overlapPct = count <= 1 ? 0 : count === 2 ? 15 : count === 3 ? 28 : count <= 5 ? 40 : 55
  const netReach   = Math.floor(baseReach * (1 - overlapPct/100))

  let warningLevel: 'none'|'low'|'medium'|'high' = 'none'
  let recommendation = 'Ukuran audience ideal — lanjutkan.'
  if (count === 0) { recommendation = 'Pilih minimal 1 interest untuk mulai.' }
  else if (overlapPct < 20) { warningLevel = 'low';    recommendation = 'Overlap rendah — kombinasi interest ini bagus untuk jangkauan luas.' }
  else if (overlapPct < 35) { warningLevel = 'medium'; recommendation = 'Overlap sedang — pertimbangkan A/B test: narrow vs broad targeting.' }
  else                       { warningLevel = 'high';   recommendation = 'Overlap tinggi — audience terlalu sempit. Coba pisah ke beberapa ad set berbeda.' }

  return {
    overlapPct,
    warningLevel,
    recommendation,
    estimatedReach: { min:Math.floor(netReach*0.8), max:Math.floor(netReach*1.2) },
  }
}


// ══════════════════════════════════════════════════════════════
// HANDLER
// ══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const body = await req.json()
    const {
      action       = 'full',
      niche        = 'general',
      platforms    = ['meta'],
      productName  = '',
      productDesc  = '',
      customerData,
      pixelIds,
      websiteUrl,
    } = body

    const validActions = ['interests','lookalike','retarget','full','segments','overlap']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error:`Action '${action}' tidak valid` }, { status:400 })
    }

    const results: Record<string, any> = {}

    if (action === 'interests' || action === 'full') {
      results.interests = await analyzeInterests({ niche, platforms, productName, productDesc })
    }
    if ((action === 'lookalike' || action === 'full') && customerData) {
      results.lookalike = await buildLookalike({ niche, platforms, productName, customerData })
    }
    if (action === 'retarget' || action === 'full') {
      results.retarget  = await setupRetargeting({ niche, platforms, productName, pixelIds, websiteUrl })
    }
    if (action === 'segments') {
      results.segments  = buildAudienceSegments(niche, platforms)
    }
    if (action === 'overlap') {
      const { selectedInterestIds } = body
      results.overlap   = estimateOverlap(selectedInterestIds ?? [], niche)
    }

    return NextResponse.json({ success:true, ...results })

  } catch (err: any) {
    console.error('[audience/analyze]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status:500 })
  }
}