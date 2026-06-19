// app/api/studio/image/remove-object/route.ts
// ══════════════════════════════════════════════════════════════
// Remove Object — FLUX.1 [dev] inpainting (replace SDXL inpaint)
// Daily limit: Basic 1 | Pro 4 | Business 12
// COGS: Rp91 (was Rp171 with SDXL — saving 47%, better quality)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { runReplicate } from '@/lib/api-clients/replicate'

export const runtime = 'edge'
export const maxDuration = 90

interface RequestBody {
  image_url:  string
  mask_url:   string         // mask area yang mau dihapus (white = remove, black = keep)
  fill_mode?: 'auto' | 'background'
}

export const POST = withDailyLimit('remove-object', async (req: NextRequest) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.image_url?.startsWith('http')) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'image_url wajib URL valid' },
      { status: 400 }
    )
  }
  if (!body.mask_url?.startsWith('http')) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'mask_url wajib URL valid' },
      { status: 400 }
    )
  }

  try {
    const output = await runReplicate<string | string[]>('flux-inpainting', {
      image:  body.image_url,
      mask:   body.mask_url,
      prompt: 'seamless natural background, no object, clean continuation of surrounding context',
      negative_prompt: 'object, item, foreign elements, artifacts',
      num_inference_steps: 28,
      guidance_scale: 3.5,
      strength: 1.0,
    })

    const resultUrl = Array.isArray(output) ? output[0] : output
    if (!resultUrl) {
      return NextResponse.json({ error: 'no_output' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      result_url: resultUrl,
      meta: { model: 'zsxkib/flux-dev-inpainting' },
    })
  } catch (err) {
    console.error('[remove-object] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})