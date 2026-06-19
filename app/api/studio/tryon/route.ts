// app/api/studio/image/tryon/route.ts
// ══════════════════════════════════════════════════════════════
// Virtual Try-On — IDM-VTON (KEEP, best quality for fashion)
// Daily limit: Pro+ (Pro 3 max via credit, Business 10 max)
// Credit: 10 per generation
// COGS: Rp892
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withCredits } from '@/lib/credit-middleware'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { runReplicate } from '@/lib/api-clients/replicate'

export const runtime = 'edge'
export const maxDuration = 120

interface RequestBody {
  garment_url:  string      // foto pakaian
  model_url?:   string      // foto model (kalau tidak ada, pakai default)
  category?:    'upper_body' | 'lower_body' | 'dresses'
}

const DEFAULT_MODELS = {
  female: 'https://your-r2-bucket.r2.dev/default-models/female-asian-1.jpg',
  male:   'https://your-r2-bucket.r2.dev/default-models/male-asian-1.jpg',
}

// Double-wrap: credit + daily limit
export const POST = withCredits('virtual-tryon',
  withDailyLimit(
  'virtual-tryon',
  async (creditCtx, req, dailyCtx) => {
    let body: RequestBody
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

    if (!body.garment_url?.startsWith('http')) {
      return NextResponse.json(
        { error: 'invalid_input', message: 'garment_url wajib URL valid' },
        { status: 400 }
      )
    }

    const modelUrl = body.model_url ?? DEFAULT_MODELS.female

    try {
      const output = await runReplicate<string>('idm-vton', {
        human_img:  modelUrl,
        garm_img:   body.garment_url,
        garment_des: body.category === 'dresses' 
          ? 'a beautiful dress'
          : body.category === 'lower_body'
            ? 'a piece of clothing for lower body'
            : 'a piece of clothing for upper body',
        category:   body.category ?? 'upper_body',
        crop:       false,
        seed:       42,
        steps:      30,
      })

      if (!output) {
        return NextResponse.json(
          { error: 'no_output', message: 'IDM-VTON tidak return output' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        result_url: output,
        meta: { model: 'cuuupid/idm-vton', credit_used: 10 },
      })
    } catch (err) {
      console.error('[tryon] error:', err)
      return NextResponse.json(
        { error: 'generation_failed', message: String(err) },
        { status: 500 }
      )
    }
  })
)