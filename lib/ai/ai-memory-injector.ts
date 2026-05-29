// lib/ai/ai-memory-injector.ts
// ── AI Memory Injector ─────────────────────────────────────────────────────
// Central utility: reads user's AI Memory from DB and injects into any prompt.
// Used by ALL generate APIs: caption, image, video, content-suite, etc.
//
// Data flow:
//   Onboarding → DB (tenants.ai_memory + tenants.settings)
//   → aiMemoryInjector.load(userId) → AIMemoryContext
//   → inject into prompt builder → personalized, accurate output

import type { AIMemoryFull } from '@/lib/validations/onboarding'

// ── What gets injected into every prompt ──────────────────────
export interface AIMemoryContext {
  // Quick-access flat fields (most commonly used)
  storeName:        string
  sellerType:       string
  experience:       string
  niche:            string
  subNiche:         string
  productType:      string
  priceRange:       string
  targetAudience:   string[]
  mainGoals:        string[]
  usp:              string
  primaryPlatform:  string
  platforms:        string[]
  contentTypes:     string[]
  contentWeight:    number
  postingFrequency: string
  painPoints:       string[]
  visualStyle:      string
  colorTone:        string
  moodTone:         string
  primaryColor:     string
  brandTagline:     string
  tone:             string
  language:         string
  emoji:            string
  ctaStyle:         string
  brandKeywords:    string
  avoidWords:       string
  competitors:      string
  // Full memory object for advanced usage
  full?: AIMemoryFull
  // Computed context strings for direct prompt injection
  brandContext:    string   // "Brand X, seller skincare, target gen-z"
  voiceContext:    string   // "Tone santai, bahasa Indo casual, emoji moderate"
  platformContext: string   // "Primary: Instagram, juga di: TikTok, Shopee"
  audienceContext: string   // "Gen Z, Wanita Karir, Beauty Enthusiast"
  goalContext:     string   // "Tujuan: Viral content, Tambah sales"
}

// ── Load AI memory from Supabase (server-side) ────────────────
export async function loadAIMemory(
  supabase: any,
  userId: string
): Promise<AIMemoryContext> {
  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single()

    if (!dbUser) return DEFAULT_MEMORY

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, ai_memory, settings')
      .eq('id', dbUser.tenant_id)
      .single()

    if (!tenant) return DEFAULT_MEMORY

    return buildMemoryContext(tenant.name, tenant.ai_memory, tenant.settings)
  } catch (e: any) {
    console.warn('[loadAIMemory] failed:', e?.message)
    return DEFAULT_MEMORY
  }
}

// ── Build memory context from raw DB data ─────────────────────
export function buildMemoryContext(
  tenantName: string,
  aiMemory: any,
  settings: any
): AIMemoryContext {
  const mem = aiMemory ?? {}
  const s   = settings  ?? {}

  const identity = mem.identity ?? {}
  const product  = mem.product  ?? {}
  const platform = mem.platform ?? {}
  const visual   = mem.visual   ?? {}
  const voice    = mem.voice    ?? {}

  // Flat extraction with settings fallback
  const storeName        = tenantName || identity.storeName || s.storeName || ''
  const sellerType       = identity.sellerType   || s.sellerType   || 'seller'
  const experience       = identity.experience   || s.experience   || 'beginner'
  const niche            = product.niche         || s.niche         || ''
  const subNiche         = product.subNiche      || s.subNiche      || ''
  const productType      = product.productType   || s.productType   || 'physical'
  const priceRange       = product.priceRange    || s.priceRange    || ''
  const targetAudience   = product.targetAudience|| s.targetAudience|| []
  const mainGoals        = product.mainGoals     || s.mainGoals     || []
  const usp              = product.usp           || s.usp           || ''
  const primaryPlatform  = platform.primaryPlatform || s.primaryPlatform || 'instagram'
  const platforms        = platform.platforms    || s.platforms     || []
  const contentTypes     = platform.contentTypes || s.contentTypes  || []
  const contentWeight    = platform.contentWeight|| s.contentWeight || contentTypes.length
  const postingFrequency = platform.postingFrequency || s.postingFrequency || '3-4/week'
  const painPoints       = platform.painPoints   || s.painPoints    || []
  const visualStyle      = visual.visualStyle    || s.visualStyle   || 'realistic'
  const colorTone        = visual.colorTone      || s.colorTone     || 'clean-white'
  const moodTone         = visual.moodTone       || s.moodTone      || 'trustworthy'
  const primaryColor     = visual.primaryColor   || s.primaryColor  || '#2563EB'
  const brandTagline     = visual.brandTagline   || s.brandTagline  || ''
  const tone             = voice.tone            || s.defaultTone   || 'casual'
  const language         = voice.language        || s.defaultLanguage || 'indonesian-casual'
  const emoji            = voice.emoji           || s.defaultEmoji  || 'moderate'
  const ctaStyle         = voice.ctaStyle        || s.defaultCtaStyle || 'medium'
  const brandKeywords    = voice.brandKeywords   || s.brandKeywords || ''
  const avoidWords       = voice.avoidWords      || s.avoidWords    || ''
  const competitors      = voice.competitors     || s.competitors   || ''

  // ── Computed context strings ────────────────────────────────
  const audienceList = Array.isArray(targetAudience) ? targetAudience : []
  const goalsList    = Array.isArray(mainGoals)       ? mainGoals       : []
  const platformList = Array.isArray(platforms)       ? platforms       : []

  const brandContext = [
    storeName && `Brand: "${storeName}"`,
    niche     && `Niche: ${niche}${subNiche ? ` (${subNiche})` : ''}`,
    sellerType && `Tipe: ${SELLER_TYPE_LABEL[sellerType] || sellerType}`,
    usp       && `USP: "${usp}"`,
    brandTagline && `Tagline: "${brandTagline}"`,
    brandKeywords && `Keyword brand: ${brandKeywords}`,
    avoidWords && `HINDARI kata: ${avoidWords}`,
  ].filter(Boolean).join(' · ')

  const voiceContext = [
    `Tone ${TONE_LABEL[tone] || tone}`,
    `bahasa ${LANGUAGE_LABEL[language] || language}`,
    `emoji ${emoji}`,
    `CTA ${ctaStyle}`,
  ].join(', ')

  const platformContext = [
    `Platform utama: ${primaryPlatform}`,
    platformList.length > 1
      ? `Juga di: ${platformList.filter(p => p !== primaryPlatform).join(', ')}`
      : '',
  ].filter(Boolean).join(' · ')

  const audienceContext = audienceList.length > 0
    ? audienceList.map(a => AUDIENCE_LABEL[a] || a).join(', ')
    : 'umum'

  const goalContext = goalsList.length > 0
    ? goalsList.map(g => GOAL_LABEL[g] || g).join(', ')
    : 'general marketing'

  const contentContext = contentTypes.length > 0
    ? `Format konten: ${contentTypes.join(', ')} (total weight: ${contentWeight})`
    : ''

  return {
    storeName, sellerType, experience,
    niche, subNiche, productType, priceRange,
    targetAudience: audienceList, mainGoals: goalsList, usp,
    primaryPlatform, platforms: platformList,
    contentTypes, contentWeight, postingFrequency, painPoints,
    visualStyle, colorTone, moodTone, primaryColor, brandTagline,
    tone, language, emoji, ctaStyle,
    brandKeywords, avoidWords, competitors,
    brandContext, voiceContext, platformContext, audienceContext, goalContext,
    full: aiMemory as AIMemoryFull,
  }
}

// ── Build system prompt injection block ────────────────────────
// Injected at the start of EVERY AI prompt across all features
export function buildAIMemoryBlock(ctx: AIMemoryContext): string {
  if (!ctx.storeName && !ctx.niche && !ctx.tone) return ''

  const lines: string[] = [
    '═══ AI MEMORY — PROFIL BRAND (Data dari Onboarding) ═══',
  ]

  if (ctx.brandContext)   lines.push(`🏪 ${ctx.brandContext}`)
  if (ctx.audienceContext)lines.push(`👥 Target Audience: ${ctx.audienceContext}`)
  if (ctx.platformContext)lines.push(`📱 ${ctx.platformContext}`)
  if (ctx.goalContext)    lines.push(`🎯 Tujuan: ${ctx.goalContext}`)
  if (ctx.voiceContext)   lines.push(`🎙️ ${ctx.voiceContext}`)

  if (ctx.contentTypes.length > 0) {
    const ctList = ctx.contentTypes.map(ct => {
      if (ct === 'video-reels') return 'Video/Reels (2 format)'
      if (ct === 'feed')        return 'Feed Post (2 format)'
      return ct
    }).join(', ')
    lines.push(`📋 Format Konten: ${ctList}`)
  }

  if (ctx.visualStyle) {
    lines.push(`🎨 Visual: ${ctx.visualStyle}, ${ctx.colorTone}, mood ${ctx.moodTone}`)
  }

  if (ctx.postingFrequency) {
    lines.push(`📅 Frekuensi: ${FREQ_LABEL[ctx.postingFrequency] || ctx.postingFrequency}`)
  }

  lines.push('═══ END AI MEMORY ═══')
  lines.push('')
  lines.push('INSTRUKSI: Gunakan seluruh data di atas untuk personalisasi output. Output harus terasa seperti dibuat khusus untuk brand ini.')

  return lines.join('\n')
}

// ── Label maps ─────────────────────────────────────────────────
const SELLER_TYPE_LABEL: Record<string, string> = {
  seller:      'Marketplace Seller',
  affiliator:  'Affiliator / Kreator',
  dropshipper: 'Dropshipper',
  brand:       'Brand Owner',
  agency:      'Agency',
  reseller:    'Reseller',
  creator:     'Content Creator',
  umkm:        'UMKM',
}
const TONE_LABEL: Record<string, string> = {
  casual:        'santai & akrab',
  friendly:      'ramah & hangat',
  professional:  'profesional & formal',
  energetic:     'energik & hype',
  luxury:        'mewah & eksklusif',
  playful:       'playful & fun',
  authoritative: 'authority & expert',
  islami:        'Islami & amanah',
  motivational:  'inspiratif & motivasi',
}
const LANGUAGE_LABEL: Record<string, string> = {
  'indonesian-casual': 'Indonesia santai',
  'indonesian-formal': 'Indonesia formal',
  'mixed-english':     'Mix Indo-English',
  'full-english':      'Full English',
}
const AUDIENCE_LABEL: Record<string, string> = {
  remaja:        'Remaja',
  mahasiswa:     'Mahasiswa',
  'ibu-rt':      'Ibu Rumah Tangga',
  'pria-dewasa': 'Pria Dewasa',
  'wanita-karir':'Wanita Karir',
  'gen-z':       'Gen Z',
  milenial:      'Milenial',
  luxury:        'Luxury Buyer',
  pebisnis:      'Pebisnis',
  beauty:        'Beauty Enthusiast',
  gamer:         'Gamer',
}
const GOAL_LABEL: Record<string, string> = {
  'more-sales':           'Tambah sales',
  'save-time':            'Hemat waktu',
  'better-content':       'Konten berkualitas',
  'grow-followers':       'Grow followers',
  'branding':             'Branding',
  'viral-content':        'Konten viral',
  'affiliate-conversion': 'Affiliate conversion',
  'product-launch':       'Launching produk',
}
const FREQ_LABEL: Record<string, string> = {
  '1-2/week':      '1-2x seminggu',
  '3-4/week':      '3-4x seminggu',
  'daily':         'Setiap hari',
  'multiple-daily':'Lebih dari 1x sehari',
}

const DEFAULT_MEMORY: AIMemoryContext = {
  storeName:'', sellerType:'seller', experience:'beginner',
  niche:'', subNiche:'', productType:'physical', priceRange:'',
  targetAudience:[], mainGoals:[], usp:'',
  primaryPlatform:'instagram', platforms:[], contentTypes:[],
  contentWeight:0, postingFrequency:'3-4/week', painPoints:[],
  visualStyle:'realistic', colorTone:'clean-white', moodTone:'trustworthy',
  primaryColor:'#2563EB', brandTagline:'',
  tone:'casual', language:'indonesian-casual', emoji:'moderate', ctaStyle:'medium',
  brandKeywords:'', avoidWords:'', competitors:'',
  brandContext:'', voiceContext:'', platformContext:'',
  audienceContext:'umum', goalContext:'general marketing',
}