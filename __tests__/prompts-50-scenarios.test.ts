// apps/web-app/__tests__/prompts-50-scenarios.test.ts

import { describe, it, expect } from 'vitest'

import {
  buildCaptionPrompt,
  parseGenerationOutput,
  SYSTEM_PROMPT,
} from '@/lib/ai/prompts'

import type { CaptionPromptParams } from '@/lib/ai/prompts'

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────
function withDefaults(
  overrides: Partial<CaptionPromptParams>
): CaptionPromptParams {
  return {
    productName: 'Tas Wanita Kulit Premium',

    tone: 'casual',
    language: 'indonesian_casual',
    emoji: 'moderate',
    ctaStyle: 'medium',
    platform: 'instagram',
    variants: 3,

    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const TONE_EXPECTATIONS = {
  casual: /casual|santai|gaul/i,

  friendly: /friendly|ramah|hangat|empatik/i,

  professional: /professional|profesional|kredibel/i,

  energetic: /energetic|semangat|hype|fomo/i,

  luxury: /luxury|mewah|eksklusif|prestisius/i,

  playful: /playful|lucu|menyenangkan|relatable/i,

  authoritative: /authoritative|ahli|edukatif|fakta/i,
}

const LANGUAGE_EXPECTATIONS = {
  indonesian_casual: /gaul|informal|kamu/i,

  indonesian_formal: /Anda|formal/i,

  mixed_english: /Gen Z|English|campur/i,

  full_english: /Inggris|English|native/i,
}

const EMOJI_EXPECTATIONS = {
  heavy: /4-6|BANYAK/i,

  moderate: /1-3|secukupnya/i,

  minimal: /0-1|sedikit/i,

  none: /TIDAK PAKAI EMOJI|NO EMOJI/i,
}

const CTA_EXPECTATIONS = {
  soft: /lembut|cek|DM kalo/i,

  medium: /Order sekarang|actionable/i,

  aggressive: /urgent|STOK TERBATAS|scarcity/i,
}

const PLATFORM_EXPECTATIONS = {
  instagram: /10-20 hashtag/i,

  tiktok: /3-5 hashtag/i,

  tiktok_shop: /keranjang|diskon/i,

  facebook: /storytelling|panjang/i,

  shopee: /hashtags: \[\]|TIDAK PAKAI HASHTAG/i,

  tokopedia: /hashtags: \[\]|TIDAK PAKAI HASHTAG/i,

  whatsapp: /singkat|broadcast/i,

  threads: /conversational|pertanyaan/i,
}

// ═════════════════════════════════════════════════════════════
// GROUP 1 — TONES
// ═════════════════════════════════════════════════════════════
describe('Tone coverage — 7 variants', () => {
  Object.entries(TONE_EXPECTATIONS).forEach(
    ([tone, regex], i) => {
      it(`${i + 1}. Tone: ${tone}`, () => {
        const prompt = buildCaptionPrompt(
          withDefaults({
            tone: tone as CaptionPromptParams['tone'],
          })
        )

        expect(prompt).toContain('═══ STYLE ═══')

        expect(prompt).toMatch(regex)
      })
    }
  )
})

// ═════════════════════════════════════════════════════════════
// GROUP 2 — LANGUAGES
// ═════════════════════════════════════════════════════════════
describe('Language coverage — 4 variants', () => {
  Object.entries(LANGUAGE_EXPECTATIONS).forEach(
    ([language, regex], i) => {
      it(`${i + 8}. ${language}`, () => {
        const prompt = buildCaptionPrompt(
          withDefaults({
            language:
              language as CaptionPromptParams['language'],
          })
        )

        expect(prompt).toMatch(regex)
      })
    }
  )
})

// ═════════════════════════════════════════════════════════════
// GROUP 3 — EMOJI
// ═════════════════════════════════════════════════════════════
describe('Emoji coverage — 4 densities', () => {
  Object.entries(EMOJI_EXPECTATIONS).forEach(
    ([emoji, regex], i) => {
      it(`${i + 12}. ${emoji}`, () => {
        const prompt = buildCaptionPrompt(
          withDefaults({
            emoji: emoji as CaptionPromptParams['emoji'],
          })
        )

        expect(prompt).toMatch(regex)
      })
    }
  )
})

// ═════════════════════════════════════════════════════════════
// GROUP 4 — CTA
// ═════════════════════════════════════════════════════════════
describe('CTA coverage — 3 styles', () => {
  Object.entries(CTA_EXPECTATIONS).forEach(
    ([ctaStyle, regex], i) => {
      it(`${i + 16}. ${ctaStyle}`, () => {
        const prompt = buildCaptionPrompt(
          withDefaults({
            ctaStyle:
              ctaStyle as CaptionPromptParams['ctaStyle'],
          })
        )

        expect(prompt).toMatch(regex)
      })
    }
  )
})

// ═════════════════════════════════════════════════════════════
// GROUP 5 — PLATFORM
// ═════════════════════════════════════════════════════════════
describe('Platform coverage — 8 platforms', () => {
  Object.entries(PLATFORM_EXPECTATIONS).forEach(
    ([platform, regex], i) => {
      it(`${i + 19}. ${platform}`, () => {
        const prompt = buildCaptionPrompt(
          withDefaults({
            platform:
              platform as CaptionPromptParams['platform'],
          })
        )

        expect(prompt).toMatch(regex)
      })
    }
  )
})

// ═════════════════════════════════════════════════════════════
// GROUP 6 — VARIANTS
// ═════════════════════════════════════════════════════════════
describe('Variant count — 1 to 5', () => {
  ;[1, 2, 3, 4, 5].forEach((n, i) => {
    it(`${27 + i}. variants=${n}`, () => {
      const prompt = buildCaptionPrompt(
        withDefaults({
          variants: n,
        })
      )

      expect(prompt).toMatch(
        new RegExp(`Buat ${n} variasi`, 'i')
      )
    })
  })

  it('32. variants=0 → clamp ke 1', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        variants: 0,
      })
    )

    expect(prompt).toMatch(/Buat 1 variasi/i)
  })

  it('33. variants=10 → clamp ke 5', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        variants: 10,
      })
    )

    expect(prompt).toMatch(/Buat 5 variasi/i)
  })
})

// ═════════════════════════════════════════════════════════════
// GROUP 7 — OPTIONAL FIELDS
// ═════════════════════════════════════════════════════════════
describe('Optional fields handling', () => {
  it('34. no productPrice', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        productPrice: undefined,
      })
    )

    expect(prompt).not.toMatch(/^Harga\s*:/m)
  })

  it('35. dengan productPrice', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        productPrice: 'Rp 299.000',
      })
    )

    expect(prompt).toContain('Rp 299.000')
  })

  it('36. dengan targetAudience', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        targetAudience: 'wanita 25-35 tahun',
      })
    )

    expect(prompt).toContain('wanita 25-35')
  })

  it('37. dengan brandKeywords', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        brandKeywords: 'Chanel, Prada',
      })
    )

    expect(prompt).toContain('WAJIB INCLUDE')
    expect(prompt).toContain('Chanel')
  })

  it('38. dengan avoidWords', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        avoidWords: 'murahan, jelek',
      })
    )

    expect(prompt).toContain('WAJIB HINDARI')
    expect(prompt).toContain('murahan')
  })

  it('39. tanpa brandKeywords', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        brandKeywords: undefined,
      })
    )

    expect(prompt).not.toContain('WAJIB INCLUDE')
  })

  it('40. storeName + niche', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        storeName: 'Cantik Store',
        niche: 'fashion',
      })
    )

    expect(prompt).toContain('Cantik Store')
    expect(prompt).toContain('fashion')
  })
})

// ═════════════════════════════════════════════════════════════
// GROUP 8 — PARSER
// ═════════════════════════════════════════════════════════════
describe('parseGenerationOutput — real-world outputs', () => {
  it('41. Clean JSON', () => {
    const json = JSON.stringify({
      variants: [
        {
          caption: 'Tas kulit keren banget!',
          hashtags: ['tas', 'fashion'],
          cta: 'DM sekarang',
        },
      ],
    })

    const result = parseGenerationOutput(json)

    expect(result).toHaveLength(1)

    expect(result[0].caption).toBe(
      'Tas kulit keren banget!'
    )

    expect(result[0].hashtags).toEqual([
      'tas',
      'fashion',
    ])

    expect(result[0].cta).toBe('DM sekarang')
  })

  it('42. Markdown JSON', () => {
    const raw =
      '```json\n{"variants":[{"caption":"test","hashtags":[],"cta":"beli"}]}\n```'

    const result = parseGenerationOutput(raw)

    expect(result).toHaveLength(1)

    expect(result[0].caption).toBe('test')
  })

  it('43. Strip hashtag prefix', () => {
    const json = JSON.stringify({
      variants: [
        {
          caption: 'x',
          hashtags: ['#tas', '##fashion'],
          cta: 'y',
        },
      ],
    })

    const result = parseGenerationOutput(json)

    expect(result[0].hashtags).toEqual([
      'tas',
      'fashion',
    ])
  })

  it('44. Empty hashtag filtered', () => {
    const json = JSON.stringify({
      variants: [
        {
          caption: 'x',
          hashtags: ['tas', '', '   ', 'fashion'],
          cta: 'y',
        },
      ],
    })

    const result = parseGenerationOutput(json)

    expect(result[0].hashtags).toEqual([
      'tas',
      'fashion',
    ])
  })

  it('45. Missing hashtags', () => {
    const json = JSON.stringify({
      variants: [{ caption: 'x', cta: 'y' }],
    })

    const result = parseGenerationOutput(json)

    expect(result[0].hashtags).toEqual([])
  })

  it('46. Missing CTA', () => {
    const json = JSON.stringify({
      variants: [{ caption: 'x', hashtags: [] }],
    })

    const result = parseGenerationOutput(json)

    expect(result[0].cta).toBe('')
  })

  it('47. Missing caption filtered', () => {
    const json = JSON.stringify({
      variants: [
        { caption: 'valid', hashtags: [], cta: '' },
        { hashtags: ['a'], cta: 'x' },
      ],
    })

    const result = parseGenerationOutput(json)

    expect(result).toHaveLength(1)
  })

  it('48. Invalid JSON fallback', () => {
    const raw =
      'Tas ini keren banget deh beli sekarang'

    const result = parseGenerationOutput(raw)

    expect(result).toHaveLength(1)

    expect(result[0].caption).toBe(raw)
  })

  it('49. JSON extract from noisy text', () => {
    const raw =
      'Berikut hasil:\n{"variants":[{"caption":"x","hashtags":[],"cta":""}]}\nDone'

    const result = parseGenerationOutput(raw)

    expect(result).toHaveLength(1)

    expect(result[0].caption).toBe('x')
  })

  it('50. Trim hashtags >30', () => {
    const many = Array.from(
      { length: 50 },
      (_, i) => `tag${i}`
    )

    const json = JSON.stringify({
      variants: [
        {
          caption: 'x',
          hashtags: many,
          cta: '',
        },
      ],
    })

    const result = parseGenerationOutput(json)

    expect(result[0].hashtags).toHaveLength(30)
  })
})

// ═════════════════════════════════════════════════════════════
// GROUP 9 — SYSTEM PROMPT
// ═════════════════════════════════════════════════════════════
describe('SYSTEM_PROMPT integrity', () => {
  it('51. mention JSON', () => {
    expect(SYSTEM_PROMPT).toMatch(/JSON/i)
  })

  it('52. mention caption structure', () => {
    expect(SYSTEM_PROMPT).toMatch(/caption/i)
    expect(SYSTEM_PROMPT).toMatch(/hashtags/i)
    expect(SYSTEM_PROMPT).toMatch(/cta/i)
  })

  it('53. mention Indonesia context', () => {
    expect(SYSTEM_PROMPT).toMatch(
      /Indonesia|Shopee|Tokopedia|TikTok/i
    )
  })

  it('54. prohibit clichés', () => {
    expect(SYSTEM_PROMPT).toMatch(/clich/i)
  })
})

// ═════════════════════════════════════════════════════════════
// GROUP 10 — EDGE CASES
// ═════════════════════════════════════════════════════════════
describe('Edge case combinations', () => {
  it('55. Shopee + aggressive CTA + variants=5', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        platform: 'shopee',
        ctaStyle: 'aggressive',
        variants: 5,
      })
    )

    expect(prompt).toMatch(
      /TIDAK PAKAI HASHTAG/i
    )

    expect(prompt).toMatch(
      /STOK TERBATAS|urgent/i
    )

    expect(prompt).toMatch(/Buat 5 variasi/i)
  })

  it('56. Luxury + formal + no emoji + soft CTA', () => {
    const prompt = buildCaptionPrompt(
      withDefaults({
        tone: 'luxury',
        language: 'indonesian_formal',
        emoji: 'none',
        ctaStyle: 'soft',
      })
    )

    expect(prompt).toMatch(
      /mewah|prestisius/i
    )

    expect(prompt).toMatch(/formal/i)

    expect(prompt).toMatch(
      /TIDAK PAKAI EMOJI/i
    )

    expect(prompt).toMatch(/lembut/i)
  })
})