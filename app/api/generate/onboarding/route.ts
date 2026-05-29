// apps/web-app/app/api/generate/onboarding/route.ts
// ── Onboarding-specific caption generator ─────────────────────
// Endpoint khusus untuk StepFirstContent di wizard onboarding.
// - Tidak ada auth header requirement (session cookie cukup)
// - Return JSON biasa (bukan streaming) agar mudah di-parse
// - Pakai semua data dari onboarding store sebagai context prompt
// - Tidak increment quota (onboarding = free trial)

import { NextResponse } from 'next/server'
import { z }            from 'zod'
import { openai }       from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 45

// ── Schema — match persis dengan apa yang StepFirstContent kirim ──
const Schema = z.object({
  // Produk
  productName:      z.string().min(1).max(300),
  productPrice:     z.string().optional(),
  highlights:       z.string().max(500).optional(),  // field name dari StepFirstContent
  targetAudience:   z.string().max(200).optional(),

  // Brand kit (dari onboarding store)
  tone:             z.string().default('casual'),
  language:         z.string().default('indonesian-casual'),  // hyphen OK
  emoji:            z.string().default('moderate'),
  ctaStyle:         z.string().default('medium'),
  brandKeywords:    z.string().optional(),
  avoidWords:       z.string().optional(),

  // Profil bisnis (dari onboarding store)
  storeName:        z.string().optional(),
  niche:            z.string().optional(),
  subNiche:         z.string().optional(),
  sellerType:       z.string().optional(),
  mainGoals:        z.array(z.string()).optional(),

  // Platform
  platform:         z.string().default('instagram'),
  primary_platform:  z.string().optional(),
  platforms:        z.array(z.string()).optional(),

  // Config
  variants:         z.number().int().min(1).max(5).default(3),
  inputType:        z.string().default('product-name'),
})

// ── Language mapper (hyphen → natural language di prompt) ────
function getLanguageInstruction(lang: string): string {
  const map: Record<string, string> = {
    'indonesian-casual': 'Bahasa Indonesia yang santai, gaul, dan relate dengan pembeli muda',
    'indonesian-formal': 'Bahasa Indonesia yang formal dan profesional',
    'mixed-english':     'Campuran Bahasa Indonesia dan English yang natural',
    'full-english':      'English yang natural dan engaging',
    // underscore variants (fallback)
    'indonesian_casual': 'Bahasa Indonesia yang santai, gaul, dan relate',
    'indonesian_formal': 'Bahasa Indonesia yang formal dan profesional',
    'mixed_english':     'Campuran Bahasa Indonesia dan English yang natural',
    'full_english':      'English yang natural dan engaging',
  }
  return map[lang] ?? 'Bahasa Indonesia yang santai'
}

function getPlatformInstruction(platform: string): string {
  const map: Record<string, string> = {
    'instagram':    'Instagram Feed — maksimal 2200 karakter, gunakan baris baru, hashtag di akhir',
    'tiktok-shop':  'TikTok/Reels — energik, pendek, hook kuat di baris pertama',
    'shopee':       'Shopee — informasi lengkap, keywords SEO, CTA ke toko',
    'tokopedia':    'Tokopedia — informasi produk detail, benefit utama, CTA jelas',
    'whatsapp':     'WhatsApp broadcast — personal, langsung, tidak terlalu panjang',
    'facebook':     'Facebook — natural storytelling, emotional trigger, CTA share',
    'twitter':      'X/Twitter — maksimal 280 karakter, catchy dan relatable',
    'threads':      'Threads — casual storytelling, conversational',
    'linkedin':     'LinkedIn — profesional, data-driven, thought leadership',
  }
  return map[platform] ?? 'Social media — engaging, informatif, ada CTA'
}

function getToneInstruction(tone: string): string {
  const map: Record<string, string> = {
    'casual':        'tone santai dan akrab seperti ngobrol dengan teman',
    'friendly':      'tone ramah dan hangat penuh perhatian',
    'professional':  'tone profesional, terpercaya, dan formal',
    'energetic':     'tone penuh semangat, hype, dan menciptakan FOMO',
    'luxury':        'tone mewah, eksklusif, dan prestisius',
    'playful':       'tone lucu, menyenangkan, dan fun',
    'authoritative': 'tone otoritatif dan expert di bidangnya',
  }
  return map[tone] ?? 'tone santai dan akrab'
}

function getEmojiInstruction(emoji: string): string {
  const map: Record<string, string> = {
    'heavy':    'Gunakan emoji banyak (3-5 per paragraf) untuk kesan fun dan colorful',
    'moderate': 'Gunakan emoji secukupnya (1-3 per caption) di tempat yang tepat',
    'minimal':  'Gunakan emoji sangat minimal (0-1 per caption) hanya jika perlu',
    'none':     'Jangan gunakan emoji sama sekali',
  }
  return map[emoji] ?? 'Gunakan emoji secukupnya'
}

function getCTAInstruction(cta: string): string {
  const map: Record<string, string> = {
    'soft':       'CTA lembut: "Yuk lihat produknya", "Bisa DM untuk info lebih"',
    'medium':     'CTA jelas: "Order sekarang di link bio", "Klik keranjang sekarang"',
    'aggressive': 'CTA kuat: "BURUAN ORDER sekarang!", "Stok terbatas, jangan nyesel!"',
  }
  return map[cta] ?? 'CTA yang jelas dan mengajak'
}

// ── Prompt builder ────────────────────────────────────────────
function buildOnboardingPrompt(data: z.infer<typeof Schema>): string {
  const platform = data.primary_platform ?? data.platform

  const lines: string[] = [
    `Kamu adalah copywriter profesional untuk ${data.storeName ? `toko "${data.storeName}"` : 'toko online'} di Indonesia.`,
    '',
    '=== BRIEF PRODUK ===',
    `Produk: ${data.productName}`,
    data.productPrice  ? `Harga: ${data.productPrice}` : '',
    data.niche         ? `Kategori: ${data.niche}${data.subNiche ? ` > ${data.subNiche}` : ''}` : '',
    data.highlights    ? `Keunggulan: ${data.highlights}` : '',
    data.targetAudience? `Target pembeli: ${data.targetAudience}` : '',
    '',
    '=== PROFIL SELLER ===',
    data.sellerType    ? `Tipe seller: ${data.sellerType}` : '',
    data.mainGoals?.length
      ? `Tujuan bisnis: ${data.mainGoals.join(', ')}`
      : '',
    '',
    '=== BRAND VOICE ===',
    `Gunakan ${getToneInstruction(data.tone)}.`,
    `Bahasa: ${getLanguageInstruction(data.language)}.`,
    getEmojiInstruction(data.emoji) + '.',
    getCTAInstruction(data.ctaStyle) + '.',
    data.brandKeywords ? `Sertakan kata kunci brand: ${data.brandKeywords}` : '',
    data.avoidWords    ? `HINDARI kata-kata ini: ${data.avoidWords}` : '',
    '',
    '=== TARGET PLATFORM ===',
    `Format untuk: ${getPlatformInstruction(platform)}`,
    '',
    '=== INSTRUKSI OUTPUT ===',
    `Buat TEPAT ${data.variants} variasi caption yang berbeda-beda dalam hal pendekatan dan angle.`,
    'Setiap caption harus:',
    '- Punya hook yang kuat di kalimat pertama',
    '- Relevan dengan platform yang dituju',
    '- Menggunakan brand voice yang konsisten',
    '- Diakhiri dengan CTA yang jelas',
    '',
    'PENTING: Return HANYA JSON valid berikut, tanpa markdown, tanpa penjelasan:',
    `{"captions": ["caption 1 lengkap", "caption 2 lengkap", "caption 3 lengkap"]}`,
  ]

  return lines.filter(l => l !== undefined).join('\n').trim()
}

// ── Handler ───────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // Auth check (session cookie)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse + validate
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.issues },
        { status: 400 },
      )
    }

    const data = parsed.data

    // Build prompt
    const prompt = buildOnboardingPrompt(data)

    // Generate (non-streaming, JSON output)
    const { text } = await generateText({
      model:       openai('gpt-4o-mini'),   // fast + cheap untuk onboarding
      system:      'Kamu adalah copywriter profesional untuk marketplace Indonesia. Selalu return valid JSON.',
      prompt,
      temperature: 0.85,
      maxTokens:   1200,
    })

    // Parse JSON response
    let captions: string[] = []

    // Try direct JSON parse
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed  = JSON.parse(cleaned)
      captions      = parsed.captions ?? []
    } catch {
      // Try extract JSON dari text
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          captions = JSON.parse(match[0]).captions ?? []
        } catch {}
      }
    }

    // Fallback: split by double newline jika JSON gagal
    if (captions.length === 0) {
      captions = text
        .split(/\n\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 20)
        .slice(0, data.variants)
    }

    if (captions.length === 0) {
      return NextResponse.json(
        { error: 'EMPTY_OUTPUT', message: 'AI tidak menghasilkan output. Coba lagi.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success:  true,
      captions,
      platform: data.platform,
      model:    'gpt-4o-mini',
    })

  } catch (err: any) {
    console.error('[POST /api/generate/onboarding]', err?.message)

    if (err?.status === 429) {
      return NextResponse.json(
        { error: 'AI_BUSY', message: 'AI sedang ramai. Coba 30 detik lagi.' },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL', message: err?.message ?? 'Terjadi kesalahan. Coba lagi.' },
      { status: 500 },
    )
  }
}