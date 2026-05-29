// apps/web-app/__tests__/prompts/prompt-builder.test.ts
// ── 7 tone × 3 platform matrix (21 combinations) + edge cases ─
import { describe, it, expect } from 'vitest'
import { buildCaptionPrompt, parseGenerationOutput, SYSTEM_PROMPT } from '@/lib/ai/prompts'
import type { CaptionPromptParams } from '@/lib/ai/prompts'

const TONES = ['casual', 'friendly', 'professional', 'energetic', 'luxury', 'playful', 'authoritative'] as const

// Pilih 3 platform yang representatif (high-traffic, beda character)
const PLATFORMS = [
  { name: 'instagram', hashtagRange: '10-20', captionMax: 1500 },
  { name: 'tiktok',    hashtagRange: '3-5',   captionMax: 300 },
  { name: 'shopee',    hashtagRange: 'TIDAK', captionMax: 3000 },  // hashtag 0
] as const

const defaults: CaptionPromptParams = {
  productName: 'Tas Wanita Kulit Premium',
  tone:        'casual',
  language:    'indonesian_casual',
  emoji:       'moderate',
  ctaStyle:    'medium',
  platform:    'instagram',
  variants:    3,
}

const withParams = (overrides: Partial<CaptionPromptParams>): CaptionPromptParams => ({
  ...defaults,
  ...overrides,
})

// ══════════════════════════════════════════════════════════════
// MATRIX: 7 TONE × 3 PLATFORM (21 combos)
// ══════════════════════════════════════════════════════════════
describe('Prompt Builder Matrix — 7 tone × 3 platform', () => {
  TONES.forEach(tone => {
    describe(`Tone: ${tone}`, () => {
      PLATFORMS.forEach(platform => {
        it(`× ${platform.name} → builds valid prompt`, () => {
          const prompt = buildCaptionPrompt(withParams({
            tone,
            platform: platform.name,
          }))

          // Sanity: prompt tidak empty
          expect(prompt.length).toBeGreaterThan(200)

          // Tone instruction included
          expect(prompt).toMatch(/═══ STYLE ═══/)

          // Platform header
          expect(prompt).toMatch(new RegExp(`PLATFORM: ${platform.name.toUpperCase()}`))

          // Hashtag rule match platform
          expect(prompt).toMatch(new RegExp(platform.hashtagRange, 'i'))

          // Character max constraint
          expect(prompt).toContain(`Caption max: ${platform.captionMax}`)

          // Variants count
          expect(prompt).toMatch(/Buat 3 variasi/)

          // Product name embedded
          expect(prompt).toContain('Tas Wanita Kulit Premium')

          // Output format requirement (JSON)
          expect(prompt).toMatch(/OUTPUT FORMAT.*JSON/i)
        })
      })
    })
  })
})

// ══════════════════════════════════════════════════════════════
// SYSTEM PROMPT integrity
// ══════════════════════════════════════════════════════════════
describe('SYSTEM_PROMPT', () => {
  it('mentions Indonesian e-commerce context', () => {
    expect(SYSTEM_PROMPT).toMatch(/Indonesia|Shopee|Tokopedia|TikTok/i)
  })

  it('enforces JSON output strictly', () => {
    expect(SYSTEM_PROMPT).toMatch(/JSON/i)
    expect(SYSTEM_PROMPT).toMatch(/return JSON valid/i)
  })

  it('mentions all 3 output fields (caption, hashtags, cta)', () => {
    expect(SYSTEM_PROMPT).toMatch(/caption/)
    expect(SYSTEM_PROMPT).toMatch(/hashtags/)
    expect(SYSTEM_PROMPT).toMatch(/cta/)
  })

  it('prohibits clichés', () => {
    expect(SYSTEM_PROMPT).toMatch(/clich/i)
  })
})

// ══════════════════════════════════════════════════════════════
// Variants edge cases
// ══════════════════════════════════════════════════════════════
describe('Variants clamping', () => {
  it('variants=0 clamps to 1', () => {
    const p = buildCaptionPrompt(withParams({ variants: 0 }))
    expect(p).toMatch(/Buat 1 variasi/)
  })

  it('variants=-5 clamps to 1', () => {
    const p = buildCaptionPrompt(withParams({ variants: -5 }))
    expect(p).toMatch(/Buat 1 variasi/)
  })

  it('variants=100 clamps to 5', () => {
    const p = buildCaptionPrompt(withParams({ variants: 100 }))
    expect(p).toMatch(/Buat 5 variasi/)
  })

  it.each([1, 2, 3, 4, 5])('variants=%i passes through', (n) => {
    const p = buildCaptionPrompt(withParams({ variants: n }))
    expect(p).toMatch(new RegExp(`Buat ${n} variasi`))
  })
})

// ══════════════════════════════════════════════════════════════
// Optional fields handling
// ══════════════════════════════════════════════════════════════
describe('Optional fields', () => {
  it('omits productPrice when undefined', () => {
    const p = buildCaptionPrompt(withParams({ productPrice: undefined }))
    // Should not have "Harga: Rp..." line dengan value
    expect(p).not.toMatch(/Harga\s*:\s*Rp/)
  })

  it('includes productPrice when provided', () => {
    const p = buildCaptionPrompt(withParams({ productPrice: 'Rp 299.000' }))
    expect(p).toContain('Rp 299.000')
  })

  it('includes brandKeywords section when provided', () => {
    const p = buildCaptionPrompt(withParams({ brandKeywords: 'mewah, premium' }))
    expect(p).toContain('WAJIB INCLUDE')
    expect(p).toContain('mewah, premium')
  })

  it('omits brandKeywords section when undefined', () => {
    const p = buildCaptionPrompt(withParams({ brandKeywords: undefined }))
    expect(p).not.toContain('WAJIB INCLUDE')
  })

  it('includes avoidWords when provided', () => {
    const p = buildCaptionPrompt(withParams({ avoidWords: 'murahan' }))
    expect(p).toContain('WAJIB HINDARI')
    expect(p).toContain('murahan')
  })

  it('includes storeName + niche', () => {
    const p = buildCaptionPrompt(withParams({ storeName: 'Cantik Store', niche: 'fashion' }))
    expect(p).toContain('Cantik Store')
    expect(p).toContain('fashion')
  })
})

// ══════════════════════════════════════════════════════════════
// Emoji density mapping
// ══════════════════════════════════════════════════════════════
describe('Emoji density mapping', () => {
  it('heavy → 4-6 emoji instruction', () => {
    const p = buildCaptionPrompt(withParams({ emoji: 'heavy' }))
    expect(p).toMatch(/4-6|BANYAK/i)
  })

  it('moderate → 1-3 emoji', () => {
    const p = buildCaptionPrompt(withParams({ emoji: 'moderate' }))
    expect(p).toMatch(/1-3|secukupnya/i)
  })

  it('minimal → 0-1 emoji', () => {
    const p = buildCaptionPrompt(withParams({ emoji: 'minimal' }))
    expect(p).toMatch(/0-1|sangat sedikit/i)
  })

  it('none → no emoji rule', () => {
    const p = buildCaptionPrompt(withParams({ emoji: 'none' }))
    expect(p).toMatch(/TIDAK PAKAI EMOJI/)
  })
})

// ══════════════════════════════════════════════════════════════
// PARSER edge cases (real-world LLM output)
// ══════════════════════════════════════════════════════════════
describe('parseGenerationOutput', () => {
  it('parses clean JSON', () => {
    const raw = JSON.stringify({
      variants: [
        { caption: 'Hello', hashtags: ['a', 'b'], cta: 'Buy now' },
      ],
    })
    const result = parseGenerationOutput(raw)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ caption: 'Hello', hashtags: ['a', 'b'], cta: 'Buy now' })
  })

  it('strips markdown code block ```json', () => {
    const raw = '```json\n{"variants":[{"caption":"x","hashtags":[],"cta":"y"}]}\n```'
    const result = parseGenerationOutput(raw)
    expect(result[0].caption).toBe('x')
  })

  it('strips # prefix from hashtags', () => {
    const raw = JSON.stringify({
      variants: [{ caption: 'x', hashtags: ['#tag1', '##tag2', '###tag3'], cta: 'y' }],
    })
    const result = parseGenerationOutput(raw)
    expect(result[0].hashtags).toEqual(['tag1', 'tag2', 'tag3'])
  })

  it('filters empty/whitespace hashtags', () => {
    const raw = JSON.stringify({
      variants: [{ caption: 'x', hashtags: ['tag1', '', '   ', '\t', 'tag2'], cta: 'y' }],
    })
    const result = parseGenerationOutput(raw)
    expect(result[0].hashtags).toEqual(['tag1', 'tag2'])
  })

  it('caps hashtags at 30 max', () => {
    const raw = JSON.stringify({
      variants: [{
        caption: 'x',
        hashtags: Array.from({ length: 50 }, (_, i) => `tag${i}`),
        cta: 'y',
      }],
    })
    const result = parseGenerationOutput(raw)
    expect(result[0].hashtags).toHaveLength(30)
  })

  it('defaults missing fields', () => {
    const raw = JSON.stringify({
      variants: [{ caption: 'x' }],  // no hashtags, no cta
    })
    const result = parseGenerationOutput(raw)
    expect(result[0].hashtags).toEqual([])
    expect(result[0].cta).toBe('')
  })

  it('filters variants without caption', () => {
    const raw = JSON.stringify({
      variants: [
        { caption: 'valid', hashtags: [], cta: '' },
        { caption: '', hashtags: ['a'], cta: 'b' },     // empty caption
        { hashtags: ['c'], cta: 'd' },                   // no caption field
      ],
    })
    const result = parseGenerationOutput(raw)
    expect(result).toHaveLength(1)
    expect(result[0].caption).toBe('valid')
  })

  it('extracts JSON embedded in surrounding text', () => {
    const raw = 'Sure! Here you go:\n\n{"variants":[{"caption":"hi","hashtags":[],"cta":""}]}\n\nHope this helps!'
    const result = parseGenerationOutput(raw)
    expect(result[0].caption).toBe('hi')
  })

  it('fallback: invalid JSON treated as 1 caption', () => {
    const raw = 'Beli tas kulit asli sekarang juga'
    const result = parseGenerationOutput(raw)
    expect(result).toHaveLength(1)
    expect(result[0].caption).toBe('Beli tas kulit asli sekarang juga')
    expect(result[0].hashtags).toEqual([])
  })

  it('handles non-string hashtag values (defensive)', () => {
    const raw = JSON.stringify({
      variants: [{ caption: 'x', hashtags: [123, true, 'valid'], cta: '' }],
    })
    const result = parseGenerationOutput(raw)
    // Number+boolean converted to string, all included after dedup
    expect(result[0].hashtags).toContain('valid')
    expect(result[0].hashtags).toContain('123')
  })

  it('handles non-array hashtags (defensive)', () => {
    const raw = JSON.stringify({
      variants: [{ caption: 'x', hashtags: 'not-an-array', cta: '' }],
    })
    const result = parseGenerationOutput(raw)
    expect(result[0].hashtags).toEqual([])
  })

  it('handles non-array variants (defensive)', () => {
    const raw = JSON.stringify({ variants: 'not an array' })
    const result = parseGenerationOutput(raw)
    // Falls through to fallback: treat as 1 caption
    expect(result).toHaveLength(1)
  })
})