// app/api/studio/image/product-to-model/route.ts
// ══════════════════════════════════════════════════════════════
// Product to Model — SDXL Lightning + ControlNet Pose
// Credit: 5 per generation
// COGS: Rp146 (was Rp254 with SDXL standard — saving 43%)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withCredits } from '@/lib/credit-middleware'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { runReplicate, buildSDXLLightningInput } from '@/lib/api-clients/replicate'

export const runtime = 'edge'
export const maxDuration = 90

interface RequestBody {
  product_url:  string
  pose:         PoseId
  model_type?:  'female-asian' | 'male-asian' | 'female-mixed' | 'male-mixed'
  background?:  string
}

type PoseId = 
  | 'standing-front' | 'standing-side' | 'standing-back'
  | 'walking' | 'sitting' | 'leaning'
  | 'arms-crossed' | 'hand-on-hip' | 'looking-down'

const POSE_PROMPTS: Record<PoseId, string> = {
  'standing-front':  'standing pose facing camera, professional fashion photography',
  'standing-side':   'standing pose side profile, professional fashion photography',
  'standing-back':   'standing pose back view, professional fashion photography',
  'walking':         'walking pose mid-stride, dynamic motion, professional fashion editorial',
  'sitting':         'sitting pose elegant, relaxed, professional lookbook photography',
  'leaning':         'leaning pose against wall, casual cool, fashion editorial',
  'arms-crossed':    'arms crossed confident pose, fashion lookbook',
  'hand-on-hip':     'hand on hip pose confident, fashion editorial',
  'looking-down':    'looking down thoughtful pose, fashion editorial mood',
}

const MODEL_PROMPTS: Record<string, string> = {
  'female-asian':  'beautiful asian female model, 25 years old, natural beauty, professional model',
  'male-asian':    'handsome asian male model, 28 years old, athletic build, professional model',
  'female-mixed':  'beautiful mixed-race female model, professional model, natural beauty',
  'male-mixed':    'handsome mixed-race male model, professional model, athletic build',
}

export const POST = withDailyLimit(
  'product-to-model',
  withCredits(
    'product-to-model',
    async (ctx, req) => {
    let body: RequestBody
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

    if (!body.product_url?.startsWith('http')) {
      return NextResponse.json(
        { error: 'invalid_input', message: 'product_url wajib' },
        { status: 400 }
      )
    }

    const posePrompt  = POSE_PROMPTS[body.pose]
    const modelPrompt = MODEL_PROMPTS[body.model_type ?? 'female-asian']
    
    if (!posePrompt) {
      return NextResponse.json(
        { error: 'invalid_pose', available: Object.keys(POSE_PROMPTS) },
        { status: 400 }
      )
    }

    const backgroundPrompt = body.background ?? 'clean white studio background'
    const fullPrompt = `${modelPrompt}, ${posePrompt}, wearing the product, ${backgroundPrompt}, fashion photography, soft lighting, sharp focus, full body shot, magazine quality`

    try {
      const output = await runReplicate<string[]>('sdxl-controlnet',
        buildSDXLLightningInput({
          prompt: fullPrompt,
          negative_prompt: 'amateur, blurry, distorted, ugly, low quality, watermark, deformed',
          image:  body.product_url,
          width:  768,
          height: 1024,
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
        pose: body.pose,
        meta: { model: 'lucataco/sdxl-controlnet', credit_used: 5 },
      })
    } catch (err) {
      console.error('[product-to-model] error:', err)
      return NextResponse.json(
        { error: 'generation_failed', message: String(err) },
        { status: 500 }
      )
    }
  })
)

export const POSE_OPTIONS = Object.keys(POSE_PROMPTS) as PoseId[]