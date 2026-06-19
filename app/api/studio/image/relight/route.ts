// app/api/studio/image/relight/route.ts
// ══════════════════════════════════════════════════════════════
// AI Relight — SDXL Lightning + Lighting Prompts
// (REPLACE IC-Light yang DEPRECATED dari Replicate)
// Daily limit: Basic 2 | Pro 6 | Business 18
// COGS: Rp76 (was Rp185 with IC-Light — saving 59%)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { runReplicate, buildSDXLLightningInput } from '@/lib/api-clients/replicate'

export const runtime = 'edge'
export const maxDuration = 60

interface RequestBody {
  image_url:  string
  lighting:   LightingType
}

type LightingType = 
  | 'golden-hour'   // warm sunset/sunrise
  | 'studio'        // professional studio softbox
  | 'dramatic'      // dramatic side lighting, high contrast
  | 'natural'       // soft daylight
  | 'product-pdp'   // clean even product photography
  | 'cinematic'     // cinematic mood lighting
  | 'soft-window'   // morning window light
  | 'neon'          // cyberpunk neon lighting

const LIGHTING_PROMPTS: Record<LightingType, string> = {
  'golden-hour':   'warm golden hour lighting, soft directional sunlight from low angle, magic hour atmosphere, cinematic warm tones, hazy glow',
  'studio':        'professional studio lighting, soft box from front, even illumination, white seamless background, commercial photography',
  'dramatic':      'dramatic chiaroscuro lighting, strong key light from side, deep shadows, high contrast, moody atmosphere',
  'natural':       'natural daylight, soft diffused lighting, balanced exposure, realistic daytime ambient',
  'product-pdp':   'clean product photography lighting, perfectly even illumination from all sides, no harsh shadows, optimized for e-commerce listing',
  'cinematic':     'cinematic movie lighting, color grading teal and orange, professional film look, depth and mood',
  'soft-window':   'soft morning window light, gentle directional sunlight from side, dreamy soft shadows, peaceful atmosphere',
  'neon':          'cyberpunk neon lighting, vibrant pink and blue neon reflections, futuristic atmosphere, glossy surfaces',
}

const LIGHTING_LABELS: Record<LightingType, string> = {
  'golden-hour':  'Golden Hour',
  'studio':       'Studio Profesional',
  'dramatic':     'Dramatis',
  'natural':      'Natural Daylight',
  'product-pdp':  'PDP / E-commerce',
  'cinematic':    'Cinematic',
  'soft-window':  'Soft Window',
  'neon':         'Neon Cyberpunk',
}

export const POST = withDailyLimit('relight', async (req: NextRequest) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.image_url || !body.image_url.startsWith('http')) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'image_url wajib' },
      { status: 400 }
    )
  }

  const lightingPrompt = LIGHTING_PROMPTS[body.lighting]
  if (!lightingPrompt) {
    return NextResponse.json(
      { 
        error: 'invalid_lighting', 
        message: 'Lighting type tidak valid',
        available: Object.keys(LIGHTING_PROMPTS),
      },
      { status: 400 }
    )
  }

  try {
    // SDXL Lightning img2img dengan lighting-focused prompt
    const output = await runReplicate<string[]>('sdxl-lightning',
      buildSDXLLightningInput({
        prompt: `${lightingPrompt}, photorealistic, professional photography, detailed`,
        negative_prompt: 'flat lighting, dim, underexposed, overexposed, harsh artificial lighting, low quality',
        image:  body.image_url,
        strength: 0.45,  // Preserve subject, change lighting only
        num_inference_steps: 4,
        guidance_scale: 0,
      })
    )

    const resultUrl = Array.isArray(output) ? output[0] : output
    if (!resultUrl) {
      return NextResponse.json({ error: 'no_output' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      result_url: resultUrl,
      lighting: body.lighting,
      lighting_label: LIGHTING_LABELS[body.lighting],
      meta: { model: 'bytedance/sdxl-lightning-4step', note: 'IC-Light replacement' },
    })
  } catch (err) {
    console.error('[relight] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})

// Export untuk UI dropdown
export const LIGHTING_OPTIONS = Object.entries(LIGHTING_LABELS).map(([id, label]) => ({
  id, label,
}))