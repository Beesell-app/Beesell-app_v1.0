// apps/web-app/app/api/generate/content-suite/route.ts
// ── Content Suite API — semua 6 caption engine dalam 1 route ──
// Engine: caption | hook | cta | soft-selling | hard-selling | description | marketplace
// Non-streaming → return JSON (cocok untuk multi-variant output)
// Pakai gpt-4o-mini (cepat, murah) untuk semua engine

import { NextResponse }   from 'next/server'
import { z }              from 'zod'
import { generateText }   from 'ai'
import { openai }         from '@ai-sdk/openai'
import { createClient }   from '@/lib/supabase/server'
import { db }             from '@/lib/db'
import { decrementQuota } from '@/lib/quota/quota-service'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 45

const Schema = z.object({
  engine:          z.enum(['caption','hook','cta','soft-selling','hard-selling','description','marketplace']),
  productName:     z.string().min(2).max(300),
  productDesc:     z.string().max(500).optional(),
  productPrice:    z.string().max(100).optional(),
  niche:           z.string().max(100).optional(),
  targetAudience:  z.string().max(200).optional(),
  tone:            z.string().default('casual'),
  language:        z.string().default('indonesian-casual'),
  emoji:           z.string().default('moderate'),
  ctaStyle:        z.string().default('medium'),
  platform:        z.string().default('instagram'),
  variants:        z.number().int().min(1).max(5).default(3),
  // Context dari image/video
  imageContext:    z.object({
    mode:  z.string().optional(),
    style: z.string().optional(),
    url:   z.string().optional(),
  }).optional(),
  videoContext:    z.object({
    url:      z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
  // Brand kit
  storeName:       z.string().max(100).optional(),
  brandKeywords:   z.string().max(300).optional(),
  avoidWords:      z.string().max(200).optional(),
})

// ── Prompt builders per engine ─────────────────────────────────
type D = z.infer<typeof Schema>

const LANG: Record<string, string> = {
  'indonesian-casual':  'Bahasa Indonesia yang santai dan gaul, relate dengan pembeli muda Indonesia',
  'indonesian-formal':  'Bahasa Indonesia yang formal dan profesional',
  'mixed-english':      'Campuran Bahasa Indonesia dan English yang natural',
  'full-english':       'English yang natural dan engaging',
}

const TONE: Record<string, string> = {
  casual:        'santai dan akrab seperti ngobrol dengan teman',
  friendly:      'ramah, hangat, penuh perhatian',
  professional:  'profesional, terpercaya, formal',
  energetic:     'penuh semangat, hype, menciptakan FOMO',
  luxury:        'mewah, eksklusif, prestisius',
  playful:       'lucu, menyenangkan, fun',
  authoritative: 'otoritatif, expert, authority di bidangnya',
}

const EMOJI: Record<string, string> = {
  heavy:    'Gunakan banyak emoji (3–5 per paragraf) untuk kesan colorful',
  moderate: 'Gunakan emoji secukupnya (1–3) di tempat yang pas',
  minimal:  'Gunakan sangat minimal (0–1) hanya jika benar-benar perlu',
  none:     'Jangan pakai emoji sama sekali',
}

const CTA: Record<string, string> = {
  soft:       '"Cek link bio ya", "Boleh DM kami", "Yuk lihat-lihat dulu"',
  medium:     '"Order sekarang", "DM untuk info", "Klik link di bio"',
  aggressive: '"BELI SEKARANG!", "STOK TERBATAS!", "Jangan nyesel!"',
}

const PLATFORM: Record<string, string> = {
  instagram:   'Instagram Feed (max 2200 char, 10–20 hashtag di akhir)',
  tiktok:      'TikTok (hook SANGAT kuat di 2 detik pertama, 3–5 hashtag trending)',
  'tiktok-shop':'TikTok Shop (highlight harga + diskon, CTA ke keranjang)',
  shopee:      'Shopee (judul + deskripsi, keyword SEO, info lengkap)',
  tokopedia:   'Tokopedia (deskripsi produk detail, benefit, spek teknis)',
  facebook:    'Facebook (storytelling, emotional hook, 3–5 hashtag)',
  whatsapp:    'WhatsApp broadcast (personal, langsung, tidak terlalu panjang)',
  twitter:     'X/Twitter (max 280 karakter, catchy dan direct)',
}

function buildSystemPrompt(): string {
  return `Kamu adalah BeeSell AI — copywriter profesional untuk seller online Indonesia.
RULES:
1. Output HANYA JSON valid, tidak ada markdown, tidak ada penjelasan
2. Bahasa harus natural dan langsung bisa dipakai tanpa editing
3. Setiap variasi harus berbeda dalam angle dan pendekatan
4. Selalu ada hook kuat dan CTA yang jelas`
}

function buildEnginePrompt(d: D): string {
  const lang     = LANG[d.language]   ?? d.language
  const tone     = TONE[d.tone]       ?? d.tone
  const emojiInstr = EMOJI[d.emoji]   ?? d.emoji
  const ctaInstr = CTA[d.ctaStyle]    ?? d.ctaStyle
  const platInstr= PLATFORM[d.platform] ?? d.platform

  const baseContext = [
    `Produk: ${d.productName}`,
    d.productDesc  ? `Detail: ${d.productDesc}`       : '',
    d.productPrice ? `Harga: ${d.productPrice}`        : '',
    d.niche        ? `Kategori: ${d.niche}`            : '',
    d.targetAudience ? `Target: ${d.targetAudience}`  : '',
    d.storeName    ? `Toko: ${d.storeName}`            : '',
    d.brandKeywords? `Keyword brand: ${d.brandKeywords}` : '',
    d.avoidWords   ? `Hindari: ${d.avoidWords}`        : '',
    // Context dari visual
    d.imageContext?.mode ? `Tipe gambar: ${d.imageContext.mode} style ${d.imageContext.style ?? ''}` : '',
    d.videoContext ? 'Ada video produk yang menyertai caption ini' : '',
  ].filter(Boolean).join('\n')

  const brandVoice = `
Gunakan tone ${tone}.
Bahasa: ${lang}.
${emojiInstr}.
CTA style: ${ctaInstr}.
Platform: ${platInstr}.`

  switch (d.engine) {
    case 'caption':
      return `${baseContext}
${brandVoice}

Buat ${d.variants} variasi caption LENGKAP yang berbeda angle-nya.
Setiap caption: hook kuat → body (benefit, bukan fitur) → CTA.
Return JSON: {"captions": ["caption1", "caption2", "caption3"]}`

    case 'hook':
      return `${baseContext}
${brandVoice}

Tugasmu: buat ${d.variants * 3} hook pembuka yang berbeda-beda. Hook = 1 kalimat pertama yang bikin orang berhenti scroll.
Gunakan variasi: pertanyaan, statement mengejutkan, FOMO, relatable problem, curiosity gap, statistik, confession.
Return JSON: {
  "hooks": [
    {"text": "hook 1", "type": "question", "score": 8},
    {"text": "hook 2", "type": "fomo", "score": 9}
  ]
}`

    case 'cta':
      return `${baseContext}
${brandVoice}

Buat ${d.variants * 4} variasi CTA yang berbeda kekuatan dan angle-nya.
Variasikan: soft (tidak memaksa), medium (jelas actionable), strong (urgent), dan creative (unik).
Return JSON: {
  "ctas": [
    {"text": "CTA text", "style": "soft|medium|strong|creative", "platform": "instagram"},
    ...
  ]
}`

    case 'soft-selling':
      return `${baseContext}
${brandVoice}

Buat ${d.variants} variasi soft selling copy yang mengikuti formula:
1. Edukasi / sharing value (tidak langsung jualan)
2. Relate dengan masalah pembeli
3. Cerita / testimonial natural
4. Gentle CTA di akhir (tidak memaksa)
Return JSON: {"captions": ["soft selling 1", "soft selling 2"]}`

    case 'hard-selling':
      return `${baseContext}
${brandVoice}

Buat ${d.variants} variasi hard selling copy dengan:
- Opening langsung ke offer / harga / diskon
- Scarcity dan urgency yang kuat (stok terbatas, waktu terbatas)
- Social proof singkat (sudah X pengguna)
- CTA kuat dan langsung
Return JSON: {"captions": ["hard selling 1", "hard selling 2"]}`

    case 'description':
      return `${baseContext}

Buat deskripsi produk yang lengkap dan menarik dalam ${d.variants} versi.
Setiap versi menggunakan angle berbeda (benefit-focused, spec-focused, story-focused).
Bahasa: ${lang}. Tone: ${tone}.
Struktur: tagline → benefits (bullet) → specs → CTA.
Return JSON: {"descriptions": [
  {"title": "tagline", "body": "full description", "bullets": ["benefit1", "benefit2"]},
  ...
]}`

    case 'marketplace':
      return `${baseContext}

Buat copy marketplace untuk ${d.platform === 'tokopedia' ? 'Tokopedia' : 'Shopee'}.
Hasilkan ${d.variants} variasi:
1. Judul produk SEO-friendly (max 70 karakter, sertakan keyword utama)
2. Deskripsi produk lengkap (min 150 kata, sertakan spek, benefit, cara pakai, garansi)
3. 10 keyword hashtag relevan

Return JSON: {"variants": [
  {
    "title": "judul produk SEO",
    "description": "deskripsi lengkap",
    "hashtags": ["#keyword1", "#keyword2"],
    "highlights": ["highlight 1", "highlight 2"]
  }
]}`

    default:
      return `${baseContext}\n${brandVoice}\nBuat ${d.variants} variasi.\nReturn JSON: {"captions": [...]}`
  }
}

// ── Parse response per engine ──────────────────────────────────
function parseResponse(engine: D['engine'], raw: string): {
  type: string; items: Array<{ id: string; text: string; meta?: Record<string,string> }>
} {
  let parsed: any = {}
  try {
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) try { parsed = JSON.parse(match[0]) } catch {}
  }

  const makeId = () => Math.random().toString(36).slice(2, 8)

  switch (engine) {
    case 'hook':
      return {
        type: 'hooks',
        items: (parsed.hooks ?? []).map((h: any) => ({
          id:   makeId(),
          text: typeof h === 'string' ? h : h.text ?? '',
          meta: { type: h.type ?? '', score: String(h.score ?? '') },
        })),
      }
    case 'cta':
      return {
        type: 'ctas',
        items: (parsed.ctas ?? []).map((c: any) => ({
          id:   makeId(),
          text: typeof c === 'string' ? c : c.text ?? '',
          meta: { style: c.style ?? '', platform: c.platform ?? '' },
        })),
      }
    case 'description':
      return {
        type: 'descriptions',
        items: (parsed.descriptions ?? []).map((d: any, i: number) => ({
          id:   makeId(),
          text: d.body ?? d,
          meta: { title: d.title ?? `Versi ${i+1}`, bullets: (d.bullets ?? []).join('|') },
        })),
      }
    case 'marketplace':
      return {
        type: 'marketplace',
        items: (parsed.variants ?? []).map((v: any, i: number) => ({
          id:   makeId(),
          text: `${v.title}\n\n${v.description}`,
          meta: {
            title:      v.title ?? '',
            hashtags:   (v.hashtags ?? []).join(' '),
            highlights: (v.highlights ?? []).join('|'),
          },
        })),
      }
    default: {
      const list = parsed.captions ?? parsed.items ?? []
      return {
        type: 'captions',
        items: list.map((t: string) => ({ id: makeId(), text: t, meta: {} })),
      }
    }
  }
}

// ── Handler ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION', details: parsed.error.issues }, { status: 400 })
    }

    const d = parsed.data

    // Get tenant
    const dbUser = await db.user.findUnique({
      where:  { id: user.id },
      select: { tenantId: true, tenant: { select: { plan:true, name:true, niche:true } } },
    })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { tenantId } = dbUser

    // Quota check (caption = 1 per generate)
    const quotaResult = await decrementQuota(tenantId, 'content', 1)
    if (!quotaResult.success) {
      return NextResponse.json({
        error:   quotaResult.reason === 'daily'   ? 'DAILY_QUOTA_EXCEEDED'
               : quotaResult.reason === 'monthly' ? 'MONTHLY_QUOTA_EXCEEDED'
               : 'QUOTA_ERROR',
        message: quotaResult.reason === 'daily'
          ? 'Kuota harian habis. Reset tengah malam WIB.'
          : 'Kuota bulanan habis. Upgrade plan untuk lebih banyak.',
      }, { status: 429 })
    }

    // Build & generate
    const systemPrompt  = buildSystemPrompt()
    const enginePrompt  = buildEnginePrompt({
      ...d,
      storeName: d.storeName ?? dbUser.tenant.name ?? undefined,
      niche:     d.niche     ?? dbUser.tenant.niche ?? undefined,
    })

    const { text } = await generateText({
      model:       openai('gpt-4o-mini'),
      system:      systemPrompt,
      prompt:      enginePrompt,
      temperature: 0.85,
      maxTokens:   1800,
    })

    const result = parseResponse(d.engine, text)

    if (result.items.length === 0) {
      return NextResponse.json({
        error:   'EMPTY_OUTPUT',
        message: 'AI tidak menghasilkan output. Coba lagi.',
      }, { status: 500 })
    }

    // Save to content library (first item)
    try {
      await db.content.create({
        data: {
          tenantId,
          userId:      user.id,
          type:        'caption',
          engine:      d.engine,
          status:      'ready',
          primaryPlatform: d.platform,
          captionText: result.items[0].text,
          captionVariants: result.items as any,
          title:       `${d.productName} — ${d.engine}`,
        },
      })
    } catch (dbErr: any) {
      console.error('[content-suite] DB save failed (non-fatal):', dbErr?.message)
    }

    return NextResponse.json({
      success: true,
      engine:  d.engine,
      type:    result.type,
      items:   result.items,
      count:   result.items.length,
    })

  } catch (err: any) {
    console.error('[POST /api/generate/content-suite]', err?.message)
    if (err?.status === 429) {
      return NextResponse.json({ error: 'AI_BUSY', message: 'AI sedang sibuk. Coba 30 detik lagi.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'INTERNAL', message: err?.message }, { status: 500 })
  }
}