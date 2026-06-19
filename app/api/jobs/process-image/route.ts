// apps/web-app/app/api/jobs/process-image/route.ts
import { NextResponse } from 'next/server'
import { db }           from '@/lib/db'
import { dispatchImageGeneration } from '@/lib/providers/image-provider'
import { FLUX_MODELS, buildFluxInput, aspectFromWH, isFluxModelKey } from '@/lib/ai/image/flux-models'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

interface WorkerPayload {
  jobId:          string
  tenantId:       string
  userId:         string
  plan:           string
  prompt:         string
  negativePrompt: string
  width:          number
  height:         number
  provider:       'replicate' | 'openai' | 'stability' | 'flux'
  model?:         string   // flux-schnell | flux-dev | flux-pro (dari route)
  quality?:       string
  refImageUrl?:   string
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

// ── Panggil Replicate (model resmi → tanpa version; atau pin version hash) ──
async function createReplicatePrediction(
  def: typeof FLUX_MODELS[keyof typeof FLUX_MODELS],
  input: Record<string, unknown>,
  webhookUrl: string,
) {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN tidak di-set')

  const url = def.version
    ? 'https://api.replicate.com/v1/predictions'
    : `https://api.replicate.com/v1/models/${def.replicate}/predictions`

  const payload = def.version
    ? { version: def.version, input, webhook: webhookUrl, webhook_events_filter: ['completed'] }
    : { input, webhook: webhookUrl, webhook_events_filter: ['completed'] }

  const res = await fetch(url, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Replicate ${res.status}: ${t.slice(0, 300)}`)
  }
  return res.json() as Promise<{ id: string; status: string }>
}

export async function POST(req: Request) {
  let jobId = 'unknown'

  try {
    const body: WorkerPayload = await req.json()
    jobId = body.jobId

    // Tandai processing
    await db.aiJob.update({ where: { id: jobId }, data: { status: 'processing', started_at: new Date() } })
    await db.$executeRaw`
      UPDATE image_generations SET status='processing', started_at=NOW() WHERE id=${jobId}::uuid
    `

    const isReplicateFamily = body.provider === 'replicate' || body.provider === 'flux'

    // ── Replicate/Flux (async via webhook) ────────────────
    if (isReplicateFamily) {
      const modelKey = isFluxModelKey(body.model) ? body.model : 'flux-schnell'
      const def      = FLUX_MODELS[modelKey]
      const aspect   = aspectFromWH(body.width, body.height)
      const input    = buildFluxInput(modelKey, {
        prompt:      body.prompt,
        aspectRatio: aspect,
        outputFormat:'png',
        refImageUrl: body.refImageUrl,   // dipakai hanya oleh dev & pro
      })

      const webhookUrl  = `${APP_URL}/api/webhooks/replicate`
      const prediction  = await createReplicatePrediction(def, input, webhookUrl)

      await db.aiJob.update({
        where: { id: jobId },
        data:  {
          model: def.replicate,
          output_data: { predictionId: prediction.id, provider: body.provider, model: def.replicate } as any,
        },
      })
      await db.$executeRaw`
        UPDATE image_generations
        SET prediction_id=${prediction.id}, model_id=${def.replicate}, status='processing'
        WHERE id=${jobId}::uuid
      `
      // Webhook Replicate yang akan menyelesaikan & simpan hasil
      return NextResponse.json({ status: 'processing', predictionId: prediction.id, model: def.replicate })
    }

    // ── Provider sync (OpenAI/Stability) ──────────────────
    const result = await dispatchImageGeneration({
      prompt:         body.prompt,
      negativePrompt: body.negativePrompt,
      width:          body.width,
      height:         body.height,
      refImageUrl:    body.refImageUrl,
    }, body.provider)

    if (result.imageUrl) {
      await saveImageResult(jobId, body.tenantId, body.userId, result.imageUrl, body.width, body.height)
      return NextResponse.json({ status: 'completed' })
    }

    throw new Error('Provider sync tidak mengembalikan imageUrl')

  } catch (err: any) {
    console.error(`[process-image] Job ${jobId} failed:`, err?.message)

    await db.aiJob.update({
      where: { id: jobId },
      data:  { status: 'failed', error_message: err?.message?.slice(0, 500) },
    }).catch(() => {})

    await db.$executeRaw`
      UPDATE image_generations
      SET status='failed', error_message=${err?.message?.slice(0, 500)}
      WHERE id=${jobId}::uuid
    `.catch(() => {})

    return NextResponse.json({ error: 'WORKER_FAILED', message: err?.message }, { status: 500 })
  }
}

// ── Simpan hasil (provider sync) ke DB + Supabase Storage ──
async function saveImageResult(
  jobId: string, tenantId: string, _userId: string, imageUrl: string, width: number, height: number,
) {
  let storageCdnUrl = imageUrl

  try {
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const imgRes = await fetch(imageUrl)
    if (imgRes.ok) {
      const buffer  = await imgRes.arrayBuffer()
      const fileKey = `generated/${tenantId}/${jobId}.png`
      const { data, error: uploadErr } = await supabase.storage
        .from('images').upload(fileKey, buffer, { contentType: 'image/png', upsert: true })
      if (!uploadErr && data) {
        const { data: publicData } = supabase.storage.from('images').getPublicUrl(fileKey)
        storageCdnUrl = publicData.publicUrl
      }
    }
  } catch (storageErr: any) {
    console.warn('[process-image] Storage upload gagal (non-fatal):', storageErr?.message)
  }

  const resultId = crypto.randomUUID()
  await db.$executeRaw`
    INSERT INTO image_results (id, generation_id, tenant_id, cdn_url, original_url, width_px, height_px)
    VALUES (${resultId}::uuid, ${jobId}::uuid, ${tenantId}::uuid, ${storageCdnUrl}, ${imageUrl}, ${width}, ${height})
  `

  await db.aiJob.update({
    where: { id: jobId },
    data:  { status: 'completed', completed_at: new Date(), output_data: { imageUrl: storageCdnUrl, resultId } as any },
  })

  await db.$executeRaw`
    UPDATE image_generations
    SET status='completed', completed_at=NOW(),
        processing_ms=EXTRACT(EPOCH FROM (NOW()-started_at))*1000
    WHERE id=${jobId}::uuid
  `
}