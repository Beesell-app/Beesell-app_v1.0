// app/api/studio/image/enhancer/route.ts
// ══════════════════════════════════════════════════════════════
// Product Enhancer — SDXL Lightning img2img
// Daily limit: Basic 3 | Pro 10 | Business 30
// COGS: Rp76 (was Rp158 with SDXL standard — saving 52%)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { runReplicate, buildSDXLLightningInput } from '@/lib/api-clients/replicate'

export const runtime = 'edge'
export const maxDuration = 60

interface RequestBody {
  image_url: string
  mode?:     'enhance' | 'clean' | 'premium' | 'commercial'
}

const ENHANCE_PROMPTS: Record<string, string> = {
  enhance:    'enhanced product photo, sharper details, vibrant colors, professional lighting, commercial grade',
  clean:      'clean professional product photo, removed noise and artifacts, crystal clear, magazine quality',
  premium:    'luxury premium product photo, high-end commercial quality, perfect lighting and composition',
  commercial: 'commercial product photo for e-commerce, optimized for marketplace, sharp focus, premium feel',
}

export const POST = withDailyLimit(
  'enhancer',
  async (_creditCtx, req, _dailyCtx) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.image_url || !body.image_url.startsWith('http')) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'image_url wajib' },
      { status: 400 }
    )
  }

  const prompt = ENHANCE_PROMPTS[body.mode ?? 'enhance']

  try {
    const output = await runReplicate<string[]>('sdxl-lightning', 
      buildSDXLLightningInput({
        prompt,
        negative_prompt: 'low quality, blurry, distorted, watermark, amateur photo',
        image:  body.image_url,
        width:  1024,
        height: 1024,
        strength: 0.35,  // Mild enhancement, preserve original
        num_inference_steps: 4,
        guidance_scale: 0,
      })
    )

    const resultUrl = Array.isArray(output) ? output[0] : output
    if (!resultUrl) {
      return NextResponse.json(
        { error: 'no_output' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result_url: resultUrl,
      mode: body.mode ?? 'enhance',
      meta: { model: 'bytedance/sdxl-lightning-4step' },
    })
  } catch (err) {
    console.error('[enhancer] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})