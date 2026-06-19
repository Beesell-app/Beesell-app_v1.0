// app/api/studio/image/upscale/route.ts
// ══════════════════════════════════════════════════════════════
// AI Upscale 4x — Real-ESRGAN
// Daily limit: Basic 2 | Pro 6 | Business 18
// COGS: Rp106 (KEEP — sudah optimal, no cheaper alternative)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { runReplicate } from '@/lib/api-clients/replicate'

export const runtime = 'edge'
export const maxDuration = 90

interface RequestBody {
  image_url: string
  scale?:    2 | 4         // 2x atau 4x
  face_enhance?: boolean   // untuk foto dengan wajah
}

export const POST = withDailyLimit(
  'upscale',
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

  try {
    const output = await runReplicate<string>('real-esrgan', {
      image: body.image_url,
      scale: body.scale ?? 4,
      face_enhance: body.face_enhance ?? false,
    })

    if (!output) {
      return NextResponse.json({ error: 'no_output' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      result_url: output,
      scale: body.scale ?? 4,
      meta: { model: 'nightmareai/real-esrgan' },
    })
  } catch (err) {
    console.error('[upscale] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})