// lib/validations/onboarding.ts
import { z } from 'zod'

// ── Step 1 ────────────────────────────────────────────────────
export const step1Schema = z.object({
  storeName:     z.string().min(2, 'Nama toko minimal 2 karakter').max(60),
  ownerName:     z.string().min(2, 'Nama minimal 2 karakter').max(60),
  whatsapp:      z.string().max(20).optional(),
  sellerType:    z.enum(['seller','affiliator','dropshipper','brand','agency','reseller','creator','umkm'], {
    errorMap: () => ({ message: 'Pilih tipe bisnis' }),
  }),
  businessScale: z.enum(['solo','small','medium','large']).default('solo'),
  experience:    z.enum(['beginner','intermediate','advanced']).default('beginner'),
})
export type Step1Data = z.infer<typeof step1Schema>

// ── Step 2 ────────────────────────────────────────────────────
export const step2Schema = z.object({
  niche:          z.string().max(100).optional(),
  subNiche:       z.string().max(100).optional(),
  productType:    z.enum(['physical','digital','fashion','skincare','food','electronic','furniture','jewelry','bag','shoes','watch','other']).optional().default('physical'),
  productCount:   z.enum(['1-5','6-20','21-100','100+']).optional().default('1-5'),
  priceRange:     z.enum(['<50k','50k-200k','200k-500k','500k-2jt','2jt+']).optional(),
  targetAudience: z.array(z.string()).default([]),
  mainGoals:      z.array(z.string()).default([]),
})
export type Step2Data = z.infer<typeof step2Schema>

// ── Step 3 ────────────────────────────────────────────────────
// Content Engine Format logic:
//   'video-reels' → counts as 2 formats (short-form video + reels content)
//   'feed'        → counts as 2 formats (photo feed + caption copy)
//   'story'       → counts as 1 format
//   'ads'         → counts as 1 format
// Combined: story + ads together = 2 formats (1+1)
// Rationale: video/reels = heavy production (2x effort weight)
//            feed = image + caption writing (2x effort weight)
//            story/ads = single-type output (1x weight each)
export const CONTENT_ENGINE_OPTIONS = [
  {
    v:      'video-reels',
    l:      'Video / Reels',
    i:      '🎬',
    desc:   'Short video, TikTok, Reels, Shorts',
    weight: 2,
    note:   'Dihitung 2 format (video + reels)',
  },
  {
    v:      'feed',
    l:      'Feed Post',
    i:      '🖼️',
    desc:   'Foto produk + caption untuk feed',
    weight: 2,
    note:   'Dihitung 2 format (foto + copy)',
  },
  {
    v:      'story',
    l:      'Daily Story',
    i:      '📸',
    desc:   'Story Instagram / TikTok harian',
    weight: 1,
    note:   'Dihitung 1 format',
  },
  {
    v:      'ads',
    l:      'Sales Copy Ads',
    i:      '📈',
    desc:   'Iklan berbayar: FB Ads, TikTok Ads',
    weight: 1,
    note:   'Dihitung 1 format',
  },
] as const

export type ContentEngineValue = typeof CONTENT_ENGINE_OPTIONS[number]['v']

export function getContentWeight(types: string[]): number {
  return types.reduce((sum, v) => {
    const option = CONTENT_ENGINE_OPTIONS.find(o => o.v === v)
    return sum + (option?.weight ?? 1)
  }, 0)
}

export const step3Schema = z.object({
  platforms:        z.array(z.string()).min(1, 'Pilih minimal 1 platform'),
  primaryPlatform:  z.string().optional(),
  contentTypes:     z.array(z.string()).min(1, 'Pilih minimal 1 format konten'),
  postingFrequency: z.enum(['1-2/week','3-4/week','daily','multiple-daily']).default('3-4/week'),
  painPoints:       z.array(z.string()).default([]),
})
export type Step3Data = z.infer<typeof step3Schema>

// ── Step 4 ────────────────────────────────────────────────────
export const step4Schema = z.object({
  visualStyle:    z.enum([
    'realistic','hyper-realistic','minimalist','luxury','premium',
    'clean-studio','korean','japanese','dark-moody','bright-commercial',
    'futuristic','cinematic','vintage','elegant','modern','viral-tiktok',
  ]).default('realistic'),
  colorTone:     z.enum([
    'warm','soft-pastel','monochrome','gold-luxury','black-premium',
    'clean-white','vibrant','earth-tone',
  ]).default('clean-white'),
  moodTone:      z.enum([
    'happy','elegant','trustworthy','premium','emotional',
    'fresh','clean','healthy','luxury','energetic','calm','confident',
  ]).default('trustworthy'),
  primaryColor:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#2563EB'),
  brandTagline:   z.string().max(100).optional(),
})
export type Step4Data = z.infer<typeof step4Schema>

// ── Step 5 ────────────────────────────────────────────────────
export const step5Schema = z.object({
  tone:          z.enum(['casual','friendly','professional','energetic','luxury','playful','authoritative','islami','motivational']).default('casual'),
  language:      z.enum(['indonesian-casual','indonesian-formal','mixed-english','full-english']).default('indonesian-casual'),
  emoji:         z.enum(['heavy','moderate','minimal','none']).default('moderate'),
  ctaStyle:      z.enum(['soft','medium','aggressive']).default('medium'),
  brandKeywords: z.string().max(300).optional(),
  avoidWords:    z.string().max(200).optional(),
  usp:           z.string().max(300).optional(),
  competitors:   z.string().max(200).optional(),
})
export type Step5Data = z.infer<typeof step5Schema>

// ── Step 6 ────────────────────────────────────────────────────
export const step6Schema = z.object({
  planId:       z.enum(['free','basic','pro','business']).default('free'),
  billingCycle: z.enum(['monthly','yearly']).default('monthly'),
})
export type Step6Data = z.infer<typeof step6Schema>

// ── Full onboarding ───────────────────────────────────────────
export interface OnboardingAllData {
  step1?: Step1Data
  step2?: Step2Data
  step3?: Step3Data
  step4?: Step4Data
  step5?: Step5Data
  step6?: Step6Data
}

// ── Complete AI Memory shape (stored in DB + used by ALL prompts) ──
export interface AIMemoryFull {
  version:  string
  savedAt:  string

  // Identity — WHO the seller is
  identity: {
    storeName:     string
    ownerName:     string
    whatsapp?:     string
    sellerType:    string      // seller | affiliator | brand | agency | umkm…
    businessScale: string      // solo | small | medium | large
    experience:    string      // beginner | intermediate | advanced
  }

  // Product — WHAT they sell
  product: {
    niche?:         string     // skincare | fashion | food | electronics…
    subNiche?:      string
    productType:    string     // physical | digital | fashion…
    productCount:   string     // 1-5 | 6-20 | 21-100 | 100+
    priceRange?:    string     // <50k | 50k-200k…
    targetAudience: string[]   // gen-z | ibu-rt | milenial…
    mainGoals:      string[]   // more-sales | viral | branding…
    usp?:           string     // unique selling proposition
  }

  // Platform — WHERE they post
  platform: {
    platforms:        string[]  // shopee | tokopedia | instagram | tiktok-shop…
    primaryPlatform?: string
    contentTypes:     string[]  // video-reels | feed | story | ads
    contentWeight:    number    // calculated total weight
    postingFrequency: string    // 1-2/week | 3-4/week | daily | multiple-daily
    painPoints:       string[]  // no-time | no-idea | inconsistent…
  }

  // Visual — HOW content looks
  visual: {
    visualStyle:  string   // realistic | luxury | korean | cinematic…
    colorTone:    string   // warm | soft-pastel | gold-luxury…
    moodTone:     string   // elegant | trustworthy | energetic…
    primaryColor: string   // hex color
    brandTagline?: string
  }

  // Voice — HOW they communicate
  voice: {
    tone:          string   // casual | luxury | islami | gen-z…
    language:      string   // indonesian-casual | mixed-english…
    emoji:         string   // none | minimal | moderate | heavy
    ctaStyle:      string   // soft | medium | aggressive
    brandKeywords?: string
    avoidWords?:   string
    competitors?:  string
  }
}