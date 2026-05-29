// apps/web-app/lib/ai/prompts.ts

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface CaptionPromptParams {
  productName: string
  productPrice?: string
  productBenefits?: string
  targetAudience?: string

  tone: string
  language: string
  emoji: string
  ctaStyle: string

  brandKeywords?: string
  avoidWords?: string

  storeName?: string
  niche?: string

  platform: Platform
  variants: number
}

export interface CaptionVariant {
  caption: string
  hashtags: string[]
  cta: string
}

export interface GenerationOutput {
  variants: CaptionVariant[]
}

export type Platform =
  | 'instagram'
  | 'instagram_reels'
  | 'tiktok'
  | 'tiktok_shop'
  | 'facebook'
  | 'shopee'
  | 'tokopedia'
  | 'whatsapp'
  | 'threads'

// ─────────────────────────────────────────────────────────────
// TONE MAP
// ─────────────────────────────────────────────────────────────

const TONE_MAP: Record<string, string> = {
  casual:
    'casual - santai, gaul, seperti ngobrol sama teman sebaya. Boleh pakai "gue/lo", "bestie", "guys"',

  friendly:
    'friendly - hangat, ramah, empatik seperti sahabat peduli. Pakai "kamu", "aku", "sis/kak"',

  professional:
    'professional - profesional, rapi, kredibel, jelas, dan meyakinkan',

  energetic:
    'energetic - semangat tinggi, hype, urgency, bikin FOMO. Pakai capslock strategis dan exclamation',

  luxury:
    'luxury - mewah, eksklusif, prestisius. Highlight premium quality dan sophistication',

  playful:
    'playful - lucu, menyenangkan, relatable. Boleh pakai humor ringan dan Gen Z references',

  authoritative:
    'authoritative - ahli, edukatif, berdasarkan fakta. Pakai data, angka, studi, dan before-after',
}

// ─────────────────────────────────────────────────────────────
// LANGUAGE MAP
// ─────────────────────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  indonesian_casual:
    'Bahasa Indonesia informal dengan selipan gaul (kamu, aku, bestie, gue/lo boleh)',

  indonesian_formal:
    'Bahasa Indonesia formal (Anda, kami, hindari slang)',

  mixed_english:
    'Campur Indonesia-English gaya Gen Z (30% English untuk hook/hashtag, 70% Indonesia)',

  full_english:
    'Bahasa Inggris penuh, native fluent style',
}

// ─────────────────────────────────────────────────────────────
// EMOJI MAP
// ─────────────────────────────────────────────────────────────

const EMOJI_MAP: Record<string, string> = {
  heavy:
    'BANYAK emoji (4-6 per caption). Tempatkan di hook, benefit, CTA',

  moderate:
    'Emoji secukupnya (1-3 per caption). Tidak berlebihan',

  minimal:
    'Emoji sangat sedikit (0-1 per caption). Hanya aksen penting',

  none:
    'TIDAK PAKAI EMOJI SAMA SEKALI',
}

// ─────────────────────────────────────────────────────────────
// CTA MAP
// ─────────────────────────────────────────────────────────────

const CTA_MAP: Record<string, string> = {
  soft:
    'CTA lembut persuasif. Contoh: "cek link bio ya", "boleh DM kalo minat"',

  medium:
    'CTA jelas actionable. Contoh: "Order sekarang via WA", "Klik link di bio"',

  aggressive:
    'CTA urgent + scarcity. Contoh: "STOK TERBATAS!", "BESOK HARGA NAIK"',
}

// ─────────────────────────────────────────────────────────────
// PLATFORM CONFIG
// ─────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
  Platform,
  {
    desc: string
    hashtagCount: [number, number]
    captionMax: number
    hashtagStyle: string
  }
> = {
  instagram: {
    desc:
      'Feed post style. Hook kuat di baris 1.',

    hashtagCount: [10, 20],

    captionMax: 1500,

    hashtagStyle:
      'Mix hashtag populer + niche relevant.',
  },

  instagram_reels: {
    desc:
      'Reels caption pendek dengan hook cepat.',

    hashtagCount: [5, 8],

    captionMax: 500,

    hashtagStyle:
      'Mix trending reels hashtags.',
  },

  tiktok: {
    desc:
      'TikTok short viral style, Gen Z language.',

    hashtagCount: [3, 5],

    captionMax: 300,

    hashtagStyle:
      'WAJIB #fyp + niche hashtags.',
  },

  tiktok_shop: {
    desc:
      'TikTok Shop selling style. Fokus keranjang kuning, promo, checkout cepat.',

    hashtagCount: [3, 5],

    captionMax: 500,

    hashtagStyle:
      'Trending TikTok Shop hashtags.',
  },

  facebook: {
    desc:
      'Storytelling panjang dan emotional.',

    hashtagCount: [5, 10],

    captionMax: 2200,

    hashtagStyle:
      'Community & storytelling hashtags.',
  },

  shopee: {
    desc:
      'Marketplace hard selling style.',

    hashtagCount: [0, 0],

    captionMax: 3000,

    hashtagStyle:
      'TIDAK PAKAI HASHTAG',
  },

  tokopedia: {
    desc:
      'Marketplace trust-building style.',

    hashtagCount: [0, 0],

    captionMax: 3000,

    hashtagStyle:
      'TIDAK PAKAI HASHTAG',
  },

  whatsapp: {
    desc:
      'Broadcast WhatsApp style. Singkat dan langsung.',

    hashtagCount: [0, 0],

    captionMax: 500,

    hashtagStyle:
      'TIDAK PAKAI HASHTAG',
  },

  threads: {
    desc:
      'Conversational style. Pakai pertanyaan dan opini.',

    hashtagCount: [10, 20],

    captionMax: 2200,

    hashtagStyle:
      'hashtags conversational style.',
  },
}

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `
Kamu adalah copywriter expert untuk online seller Indonesia.

Fokus platform:
- Instagram
- TikTok
- Shopee
- Tokopedia
- Threads
- Facebook
- WhatsApp

WAJIB return JSON valid.

Output harus memiliki:
- caption
- hashtags
- cta

Jangan gunakan markdown.
Jangan gunakan code block.

Hindari caption clich\u00e9, terlalu generik, dan hard-selling murahan.

Format:
{
  "variants": [
    {
      "caption": "isi caption",
      "hashtags": ["tag1"],
      "cta": "call to action"
    }
  ]
}
`.trim()

// ─────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────

export function buildCaptionPrompt(
  p: CaptionPromptParams
): string {
  const tone =
    TONE_MAP[p.tone] ?? p.tone

  const language =
    LANG_MAP[p.language] ?? p.language

  const emoji =
    EMOJI_MAP[p.emoji] ?? p.emoji

  const cta =
    CTA_MAP[p.ctaStyle] ?? p.ctaStyle

  const platformCfg =
    PLATFORM_CONFIG[p.platform] ??
    PLATFORM_CONFIG.instagram

  const [hashMin, hashMax] =
    platformCfg.hashtagCount

  const hashtagInstruction =
    hashMin === 0
      ? 'TIDAK PAKAI HASHTAG'
      : `hashtags: array ${hashMin}-${hashMax} hashtag. ${platformCfg.hashtagStyle}`

  const variants =
    Math.min(Math.max(p.variants, 1), 5)

  const platformName =
    p.platform === 'instagram_reels'
      ? 'INSTAGRAM REELS'
      : p.platform.toUpperCase()

  return `
Buat ${variants} variasi caption yang BERBEDA satu sama lain untuk produk berikut:

═══ INFO PRODUK ═══
Nama          : ${p.productName}
${p.productPrice ? `Harga         : ${p.productPrice}` : ''}
${p.productBenefits ? `Keunggulan    : ${p.productBenefits}` : ''}
${p.targetAudience ? `Target audiens: ${p.targetAudience}` : ''}
${p.storeName ? `Nama toko     : ${p.storeName}` : ''}
${p.niche ? `Kategori      : ${p.niche}` : ''}

═══ STYLE ═══
Tone     : ${tone}
Bahasa   : ${language}
Emoji    : ${emoji}
CTA style: ${cta}

═══ PLATFORM: ${platformName} ═══
${platformCfg.desc}

Caption max: ${platformCfg.captionMax}
Hashtag    : ${hashtagInstruction}

${p.brandKeywords ? `═══ WAJIB INCLUDE ═══\n${p.brandKeywords}\n` : ''}
${p.avoidWords ? `═══ WAJIB HINDARI ═══\n${p.avoidWords}\n` : ''}

═══ OUTPUT FORMAT (JSON STRICT) ═══
{
  "variants": [
    {
      "caption": "caption body",
      "hashtags": ["tag1"],
      "cta": "call to action"
    }
  ]
}

Pastikan output HANYA JSON.
`.trim()
}

// ─────────────────────────────────────────────────────────────
// PARSER
// ─────────────────────────────────────────────────────────────

export function parseGenerationOutput(
  rawText: string
): CaptionVariant[] {
  try {
    const parsed = JSON.parse(rawText)

    if (Array.isArray(parsed.variants)) {
      return normalizeVariants(parsed.variants)
    }
  } catch {}

  const stripped = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()

  try {
    const parsed = JSON.parse(stripped)

    if (Array.isArray(parsed.variants)) {
      return normalizeVariants(parsed.variants)
    }
  } catch {}

  const match = rawText.match(/\{[\s\S]*\}/)

  if (match) {
    try {
      const parsed = JSON.parse(match[0])

      if (Array.isArray(parsed.variants)) {
        return normalizeVariants(parsed.variants)
      }
    } catch {}
  }

  return [
    {
      caption: rawText.trim(),
      hashtags: [],
      cta: '',
    },
  ]
}

function normalizeVariants(
  raw: any[]
): CaptionVariant[] {
  return raw
    .map((v) => ({
      caption:
        typeof v.caption === 'string'
          ? v.caption.trim()
          : '',

      hashtags: Array.isArray(v.hashtags)
        ? v.hashtags
            .map((h: any) =>
              String(h)
                .replace(/^#+/, '')
                .trim()
            )
            .filter((h: string) => h.length > 0)
            .slice(0, 30)
        : [],

      cta:
        typeof v.cta === 'string'
          ? v.cta.trim()
          : '',
    }))
    .filter((v) => v.caption.length > 0)
}