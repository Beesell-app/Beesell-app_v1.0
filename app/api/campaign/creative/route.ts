// app/api/campaign/creative/route.ts
// ══════════════════════════════════════════════════════════════
// CAMPAIGN CREATIVE GENERATOR — Generate visual variants
// POST /api/campaign/creative
// ══════════════════════════════════════════════════════════════
//
// Called for each creative variant to generate the actual image.
// Uses Replicate SDXL img2img (same as Product Enhancer).
// Returns image URL, updates campaign creative status in DB.
//
// Can be called individually (one creative at a time)
// or in batch (all pending creatives for a campaign).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CREATIVE_FORMATS } from '@/lib/campaign/types'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const SDXL_MODEL = 'stability-ai/sdxl:39ed52f2319f9b0cf0680e9e61d616f9dbf7c7c9ca1f1cf4ff14e50d8e78ae17'
const sleep      = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Poll Replicate ────────────────────────────────────────────
async function pollReplicate(predId: string, apiKey: string, timeoutMs = 100_000): Promise<string> {
  const deadline = Date.now() + timeoutMs
  const url      = `https://api.replicate.com/v1/predictions/${predId}`
  while (Date.now() < deadline) {
    await sleep(3500)
    const res  = await fetch(url, { headers:{ Authorization:`Token ${apiKey}` } })
    const data = await res.json()
    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[data.output.length - 1] : data.output
      if (!out) throw new Error('SDXL output kosong')
      return out as string
    }
    if (data.status === 'failed')   throw new Error(data.error ?? 'SDXL failed')
    if (data.status === 'canceled') throw new Error('SDXL canceled')
  }
  throw new Error('SDXL timeout')
}

// ── Run SDXL img2img for creative ────────────────────────────
async function generateCreativeImage(params: {
  sourceImageUrl: string
  promptText:     string
  presetId:       string
  formatId:       string
  apiKey:         string
}): Promise<string> {
  const fmt      = CREATIVE_FORMATS.find(f => f.id === params.formatId)
  const ratio    = fmt ? `${fmt.w}:${fmt.h}` : '1:1'
  const isSquare = ratio === '1080:1080' || fmt?.ratio === '1:1'

  const body = {
    version: SDXL_MODEL.split(':')[1],
    input: {
      image:                params.sourceImageUrl,
      prompt:               [
        params.promptText,
        'professional commercial photography',
        'ecommerce product photo',
        'high quality advertising visual',
        '8K detail sharp',
      ].join(', '),
      negative_prompt:     [
        'blurry','low quality','watermark','text overlay',
        'logo changed','product modified','artifacts',
        'person','human hands','distorted product',
      ].join(', '),
      prompt_strength:      0.52,
      guidance_scale:       12,
      num_inference_steps:  40,
      num_outputs:          1,
      refine:               'expert_ensemble_refiner',
      high_noise_frac:      0.8,
      apply_watermark:      false,
    },
  }

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method:  'POST',
    headers: { Authorization:`Token ${params.apiKey}`, 'Content-Type':'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.detail ?? `Replicate ${res.status}`)
  }
  const pred = await res.json()
  if (!pred.id) throw new Error(pred.detail ?? 'No prediction ID')
  return pollReplicate(pred.id, params.apiKey)
}

// ── Handler ───────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const body = await req.json()
    const { campaignId, creativeId, sourceImageUrl, promptText, presetId, formatId } = body

    if (!sourceImageUrl?.trim()) {
      return NextResponse.json({ error:'sourceImageUrl wajib diisi' }, { status:400 })
    }

    const apiKey = process.env.REPLICATE_API_TOKEN
    if (!apiKey) return NextResponse.json({ error:'REPLICATE_API_TOKEN tidak di-set' }, { status:500 })

    // Generate the creative image
    let imageUrl: string
    try {
      imageUrl = await generateCreativeImage({ sourceImageUrl, promptText, presetId, formatId, apiKey })
    } catch (aiErr: any) {
      return NextResponse.json({ error:`Creative generation gagal: ${aiErr.message}` }, { status:502 })
    }

    // Update campaign creative status in DB
    if (campaignId && creativeId) {
      const { data:campaign } = await supabase
        .from('campaigns')
        .select('creative_variants')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single()

      if (campaign) {
        const variants = (campaign.creative_variants as any[]) ?? []
        const updated  = variants.map((v: any) =>
          v.id === creativeId ? { ...v, imageUrl, status:'done' } : v
        )
        await supabase.from('campaigns')
          .update({ creative_variants:updated, updated_at:new Date().toISOString() })
          .eq('id', campaignId)
      }
    }

    // Save to asset library
    await supabase.from('ai_assets').insert({
      user_id:    user.id,
      type:       'image',
      tool_name:  'Campaign Creative',
      title:      `Campaign Creative — ${formatId ?? 'Ad'}`,
      file_url:   imageUrl,
      preset_used:presetId,
      parameters: { campaignId, creativeId, formatId, presetId },
      created_at: new Date().toISOString(),
    }).catch(() => {})

    return NextResponse.json({ success:true, creativeId, imageUrl, status:'done' })

  } catch (err: any) {
    console.error('[campaign/creative]', err)
    return NextResponse.json({ error:err?.message }, { status:500 })
  }
}