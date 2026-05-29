// apps/web-app/store/contentCreatorStore.ts
// Form state untuk Content Creator dengan persist
// Save draft otomatis — user tidak hilang data kalau accidentally close tab
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type InputMode    = 'url' | 'photo' | 'manual'
export type Tone         = 'casual' | 'friendly' | 'professional' | 'energetic' | 'luxury' | 'playful' | 'authoritative'
export type Language     = 'indonesian_casual' | 'indonesian_formal' | 'mixed_english' | 'full_english'
export type Emoji        = 'heavy' | 'moderate' | 'minimal' | 'none'
export type CtaStyle     = 'soft' | 'medium' | 'aggressive'
export type Platform     = 'instagram' | 'tiktok' | 'tiktok_shop' | 'shopee' | 'tokopedia' | 'whatsapp' | 'facebook' | 'threads'

interface FormState {
  // ── Input mode tab ──
  mode: InputMode

  // ── URL input ──
  productUrl:    string
  scrapedData:   any | null   // { name, price, description, images, marketplace, ... }

  // ── Photo input ──
  photoFile:     string | null   // base64 data URL (untuk preview & persist)
  photoExtractedData: any | null

  // ── Manual input (juga dipakai sebagai final source of truth) ──
  productName:    string
  productPrice:   string
  productBenefits: string
  targetAudience:  string

  // ── Config / style ──
  tone:          Tone
  language:      Language
  emoji:         Emoji
  ctaStyle:      CtaStyle
  platform:      Platform
  variants:      number   // 1-5

  // ── Brand keywords ──
  brandKeywords: string
  avoidWords:    string

  // ── Actions ──
  setMode:           (mode: InputMode) => void
  setProductUrl:     (url: string) => void
  setScrapedData:    (data: any | null) => void
  setPhotoFile:      (data: string | null) => void
  setPhotoExtracted: (data: any | null) => void

  setProductName:     (v: string) => void
  setProductPrice:    (v: string) => void
  setProductBenefits: (v: string) => void
  setTargetAudience:  (v: string) => void

  setTone:     (v: Tone) => void
  setLanguage: (v: Language) => void
  setEmoji:    (v: Emoji) => void
  setCtaStyle: (v: CtaStyle) => void
  setPlatform: (v: Platform) => void
  setVariants: (v: number) => void

  setBrandKeywords: (v: string) => void
  setAvoidWords:    (v: string) => void

  // Apply scraped data ke form fields
  applyScrapedData: () => void

  // Reset form
  reset: () => void
}

const INITIAL_STATE = {
  mode:               'url' as InputMode,
  productUrl:         '',
  scrapedData:        null,
  photoFile:          null,
  photoExtractedData: null,
  productName:        '',
  productPrice:       '',
  productBenefits:    '',
  targetAudience:     '',
  tone:               'casual' as Tone,
  language:           'indonesian_casual' as Language,
  emoji:              'moderate' as Emoji,
  ctaStyle:           'medium' as CtaStyle,
  platform:           'instagram' as Platform,
  variants:           3,
  brandKeywords:      '',
  avoidWords:         '',
}

export const useContentCreatorStore = create<FormState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setMode:           mode => set({ mode }),
      setProductUrl:     productUrl => set({ productUrl }),
      setScrapedData:    scrapedData => set({ scrapedData }),
      setPhotoFile:      photoFile => set({ photoFile }),
      setPhotoExtracted: photoExtractedData => set({ photoExtractedData }),

      setProductName:     productName => set({ productName }),
      setProductPrice:    productPrice => set({ productPrice }),
      setProductBenefits: productBenefits => set({ productBenefits }),
      setTargetAudience:  targetAudience => set({ targetAudience }),

      setTone:     tone => set({ tone }),
      setLanguage: language => set({ language }),
      setEmoji:    emoji => set({ emoji }),
      setCtaStyle: ctaStyle => set({ ctaStyle }),
      setPlatform: platform => set({ platform }),
      setVariants: variants => set({ variants: Math.min(5, Math.max(1, variants)) }),

      setBrandKeywords: brandKeywords => set({ brandKeywords }),
      setAvoidWords:    avoidWords => set({ avoidWords }),

      applyScrapedData: () => {
        const { scrapedData } = get()
        if (!scrapedData) return
        set({
          productName:     scrapedData.name        ?? '',
          productPrice:    scrapedData.price       ?? '',
          productBenefits: scrapedData.description ?? '',
        })
      },

      reset: () => set({ ...INITIAL_STATE }),
    }),
    {
      name:    'beesell-content-creator-v1',
      storage: createJSONStorage(() => localStorage),
      // Persist semua kecuali photoFile (terlalu besar untuk localStorage)
      partialize: (s) => ({
        mode:               s.mode,
        productUrl:         s.productUrl,
        productName:        s.productName,
        productPrice:       s.productPrice,
        productBenefits:    s.productBenefits,
        targetAudience:     s.targetAudience,
        tone:               s.tone,
        language:           s.language,
        emoji:              s.emoji,
        ctaStyle:           s.ctaStyle,
        platform:           s.platform,
        variants:           s.variants,
        brandKeywords:      s.brandKeywords,
        avoidWords:         s.avoidWords,
      }),
    },
  ),
)

// ── Selector helper: derived "ready to submit" check ───────
export function useCanGenerate() {
  return useContentCreatorStore(s => s.productName.trim().length >= 3)
}

// apps/web-app/store/contentCreatorStore.ts — BRAND KIT PATCH
// ─────────────────────────────────────────────────────────────
// Tambahkan field + action ini ke contentCreatorStore yang existing.
// Jangan replace seluruh file — hanya add section baru.
//
// ── Step 1: Tambah ke interface FormState ──
//
//   // Brand kit
//   activeBrandKitId:  string | null
//   brandKitEnabled:   boolean
//   setBrandKitEnabled: (v: boolean) => void
//   setActiveBrandKitId: (id: string | null) => void
//   applyBrandKit:      (kit: BrandKitSnapshot) => void
//   clearBrandKit:      () => void
//
// ── Step 2: Tambah type BrandKitSnapshot (import di file atau definisikan) ──
 
export interface BrandKitSnapshot {
  id:             string
  name:           string
  primaryColor:   string
  secondaryColor: string
  accentColor:    string
  bgColor:        string
  textColor:      string
  primaryFont:    string
  secondaryFont:  string
  defaultTone:    string
  defaultLanguage: string
  brandKeywords:  string | null
  avoidWords:     string | null
  logoUrl:        string | null
}
 
// ── Step 3: Tambah ke INITIAL_STATE ──
//
//   activeBrandKitId: null,
//   brandKitEnabled:  true,   // default ON kalau ada brand kit
//
// ── Step 4: Tambah ke create() actions ──
//
//   setActiveBrandKitId: (id) => set({ activeBrandKitId: id }),
//   setBrandKitEnabled:  (v)  => set({ brandKitEnabled: v }),
//
//   applyBrandKit: (kit) => set({
//     activeBrandKitId: kit.id,
//     // Inject tone + language dari brand kit
//     tone:             kit.defaultTone as any,
//     language:         kit.defaultLanguage as any,
//     // Inject keywords
//     brandKeywords:    kit.brandKeywords ?? '',
//     avoidWords:       kit.avoidWords    ?? '',
//   }),
//
//   clearBrandKit: () => set({
//     activeBrandKitId: null,
//     brandKitEnabled:  false,
//     brandKeywords:    '',
//     avoidWords:       '',
//   }),
//
// ── Step 5: Tambah ke partialize() ──
//
//   activeBrandKitId: s.activeBrandKitId,
//   brandKitEnabled:  s.brandKitEnabled,