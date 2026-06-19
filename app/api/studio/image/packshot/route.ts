// app/api/studio/image/packshot/route.ts
// ══════════════════════════════════════════════════════════════
// AI Packshot — BRIA RMBG + SDXL Lightning (4-step)
// Daily limit: Basic 5 | Pro 15 | Business 45
// COGS: Rp93 (was Rp175 with SDXL standard — saving 47%)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { runReplicate, buildSDXLLightningInput } from '@/lib/api-clients/replicate'

export const runtime = 'edge'
export const maxDuration = 60

interface RequestBody {
  image_url: string
  preset:    PresetId
  size?:     '1024x1024' | '1024x1536' | '1536x1024'
}

type PresetId = 
  | 'studio-white' | 'studio-black' | 'studio-gradient'
  | 'lifestyle-cafe' | 'lifestyle-beach' | 'lifestyle-bedroom'
  | 'minimalist-marble' | 'minimalist-wood' | 'minimalist-fabric'
  | 'luxury-velvet' | 'luxury-marble-gold' | 'luxury-leather'
  | 'nature-forest' | 'nature-flower' | 'nature-stone'
  | 'fashion-runway' | 'fashion-mirror' | 'fashion-rack'
  | 'food-table' | 'food-marble-kitchen' | 'food-wood-rustic'
  | 'tech-desk' | 'tech-neon' | 'tech-minimal'
  | 'beauty-vanity' | 'beauty-flowers' | 'beauty-marble'
  | 'baby-soft-pastel' | 'baby-nursery' | 'baby-toys'

const PRESET_PROMPTS: Record<PresetId, string> = {
  // Studio
  'studio-white':     'professional product photo, pure white seamless background, soft even studio lighting, sharp focus',
  'studio-black':     'professional product photo, deep black background, dramatic key light from above, sharp focus, premium look',
  'studio-gradient':  'professional product photo, smooth gradient background from soft blue to white, studio lighting, premium',

  // Lifestyle
  'lifestyle-cafe':     'product on rustic wooden cafe table, soft natural window light, cozy atmosphere, blurred coffee shop background',
  'lifestyle-beach':    'product on white sand beach, golden hour sunlight, ocean waves softly blurred in background, vacation vibes',
  'lifestyle-bedroom':  'product on soft pastel bed sheet, morning natural light from window, cozy bedroom, dreamy atmosphere',

  // Minimalist
  'minimalist-marble':  'product on pristine white marble surface, soft directional lighting, minimalist composition, premium feel',
  'minimalist-wood':    'product on natural light oak wood surface, soft natural lighting, minimalist composition, warm tone',
  'minimalist-fabric':  'product on soft neutral linen fabric, soft natural lighting, minimalist setup, organic texture',

  // Luxury
  'luxury-velvet':      'product on plush emerald green velvet, dramatic side lighting, jewel tones, opulent premium feel',
  'luxury-marble-gold': 'product on white marble with gold veining, gold accents, soft warm lighting, ultra premium',
  'luxury-leather':     'product on dark cognac leather surface, moody warm lighting, masculine premium feel',

  // Nature
  'nature-forest':  'product surrounded by lush green leaves and ferns, dappled forest sunlight, organic natural setting',
  'nature-flower':  'product surrounded by fresh white and pink flowers, soft morning light, romantic feminine setting',
  'nature-stone':   'product on natural granite stone, soft outdoor lighting, organic earthy tones, grounded feel',

  // Fashion
  'fashion-runway':  'fashion product on white concrete runway, dramatic spotlight, edgy editorial feel, high fashion',
  'fashion-mirror':  'fashion product reflected in vanity mirror, soft glamorous lighting, art deco vibes',
  'fashion-rack':    'fashion product on minimalist clothing rack, soft showroom lighting, retail boutique aesthetic',

  // Food
  'food-table':            'food product on rustic wooden dining table, warm overhead lighting, appetizing food photography',
  'food-marble-kitchen':   'food product on white marble kitchen counter, soft natural window light, modern clean kitchen',
  'food-wood-rustic':      'food product on weathered dark wood, warm directional lighting, artisanal handmade feel',

  // Tech
  'tech-desk':     'tech product on clean modern desk, blue ambient lighting, futuristic workspace setting',
  'tech-neon':     'tech product with cyberpunk neon pink and blue lighting, dark background, futuristic vibes',
  'tech-minimal':  'tech product on white surface, soft cool lighting, minimal Apple-style clean composition',

  // Beauty
  'beauty-vanity':  'beauty product on white vanity with rose gold accents, soft glamorous lighting, feminine luxury',
  'beauty-flowers': 'beauty product surrounded by fresh pink peonies, soft pink lighting, romantic feminine setting',
  'beauty-marble':  'beauty product on white marble with brass accents, soft natural light, clean premium feel',

  // Baby
  'baby-soft-pastel':  'baby product on soft pastel blue and pink background, soft natural lighting, sweet gentle feel',
  'baby-nursery':      'baby product in cozy nursery setting, soft warm lighting, plush blanket, dreamy atmosphere',
  'baby-toys':         'baby product surrounded by colorful wooden toys, bright cheerful lighting, playful setting',
}

export const POST = withDailyLimit('packshot', async (req: NextRequest) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.image_url || !body.image_url.startsWith('http')) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'image_url wajib' },
      { status: 400 }
    )
  }

  const presetPrompt = PRESET_PROMPTS[body.preset]
  if (!presetPrompt) {
    return NextResponse.json(
      { error: 'invalid_preset', message: 'Preset tidak ditemukan', available: Object.keys(PRESET_PROMPTS) },
      { status: 400 }
    )
  }

  try {
    // ── Step 1: Remove background (BRIA RMBG 2.0) ──────────
    const cleanedOutput = await runReplicate<string | string[]>('bria-rmbg', {
      image: body.image_url,
    })
    const cleanedUrl = Array.isArray(cleanedOutput) ? cleanedOutput[0] : cleanedOutput

    if (!cleanedUrl) {
      return NextResponse.json(
        { error: 'remove_bg_failed', message: 'Gagal remove background' },
        { status: 500 }
      )
    }

    // ── Step 2: SDXL Lightning img2img dengan preset prompt ─
    const [w, h] = (body.size ?? '1024x1024').split('x').map(Number)
    
    const finalOutput = await runReplicate<string[]>('sdxl-lightning', 
      buildSDXLLightningInput({
        prompt: `${presetPrompt}, hyper detailed product photography, 8k, professional commercial photo`,
        negative_prompt: 'amateur, blurry, low quality, distorted, watermark, text, logo, signature',
        image:  cleanedUrl,
        width:  w,
        height: h,
        strength: 0.55,  // Preserve subject, change background
        num_inference_steps: 4,
        guidance_scale: 0,
      })
    )

    const resultUrl = Array.isArray(finalOutput) ? finalOutput[0] : finalOutput
    if (!resultUrl) {
      return NextResponse.json(
        { error: 'no_output', message: 'Tidak ada output dari SDXL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result_url: resultUrl,
      preset: body.preset,
      meta: {
        models: ['bria/remove-background-2.0', 'bytedance/sdxl-lightning-4step'],
      },
    })
  } catch (err) {
    console.error('[packshot] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})

// Export presets list untuk UI
export const PRESETS = Object.keys(PRESET_PROMPTS) as PresetId[]