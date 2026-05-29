// apps/web-app/app/api/jobs/process-image/route.ts
// ── QStash Worker — Image Generation ─────────────────────────
// Called by QStash → dispatches to Replicate/OpenAI/Stability
// On success: saves to Supabase Storage → updates DB
// On fail: refunds credits + logs error

import { NextResponse }        from 'next/server'
import { db }                  from '@/lib/db'
import { createClient }        from '@/lib/supabase/server'
import { dispatchImageGeneration, checkReplicatePrediction } from '@/lib/providers/image-provider'

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
  refImageUrl?:   string
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export async function POST(req: Request) {
  let jobId = 'unknown'

  try {
    const body: WorkerPayload = await req.json()
    jobId = body.jobId

    // Mark as processing
    await db.aiJob.update({
      where:  { id:jobId },
      data:   { status:'processing', startedAt:new Date() },
    })
    await db.$executeRaw`
      UPDATE image_generations SET status='processing', started_at=NOW() WHERE id=${jobId}::uuid
    `

    // Dispatch to provider
    const webhookUrl = body.provider === 'replicate' || body.provider === 'flux'
      ? `${APP_URL}/api/webhooks/replicate`
      : undefined

    const result = await dispatchImageGeneration({
      prompt:         body.prompt,
      negativePrompt: body.negativePrompt,
      width:          body.width,
      height:         body.height,
      webhookUrl,
      refImageUrl:    body.refImageUrl,
    }, body.provider)

    // ── Async providers (Replicate/Flux) ─────────────────
    if (result.predictionId) {
      await db.aiJob.update({
        where: { id:jobId },
        data:  { metadata:{ predictionId:result.predictionId, provider:body.provider } as any },
      })
      await db.$executeRaw`
        UPDATE image_generations
        SET prediction_id=${result.predictionId}, status='processing'
        WHERE id=${jobId}::uuid
      `
      // Return 200 — Replicate will call webhook when done
      return NextResponse.json({ status:'processing', predictionId:result.predictionId })
    }

    // ── Sync providers (OpenAI/Stability) ─────────────────
    if (result.imageUrl) {
      await saveImageResult(jobId, body.tenantId, body.userId, result.imageUrl, body.width, body.height)
      return NextResponse.json({ status:'completed' })
    }

    throw new Error('Provider returned no predictionId and no imageUrl')

  } catch (err: any) {
    console.error(`[process-image] Job ${jobId} failed:`, err?.message)

    // Mark failed
    await db.aiJob.update({
      where: { id:jobId },
      data:  { status:'failed', error:err?.message?.slice(0,500) },
    }).catch(() => {})

    await db.$executeRaw`
      UPDATE image_generations
      SET status='failed', error_message=${err?.message?.slice(0,500)}
      WHERE id=${jobId}::uuid
    `.catch(() => {})

    return NextResponse.json({ error:'WORKER_FAILED', message:err?.message }, { status:500 })
  }
}

// ── Save image result to DB and Supabase Storage ─────────────
async function saveImageResult(
  jobId:    string,
  tenantId: string,
  userId:   string,
  imageUrl: string,
  width:    number,
  height:   number,
) {
  let storageCdnUrl = imageUrl   // fallback = direct URL

  // Try upload to Supabase Storage
  try {
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Download image from provider
    const imgRes = await fetch(imageUrl)
    if (imgRes.ok) {
      const buffer  = await imgRes.arrayBuffer()
      const fileKey = `generated/${tenantId}/${jobId}.png`

      const { data, error: uploadErr } = await supabase.storage
        .from('images')
        .upload(fileKey, buffer, { contentType:'image/png', upsert:true })

      if (!uploadErr && data) {
        const { data: publicData } = supabase.storage.from('images').getPublicUrl(fileKey)
        storageCdnUrl = publicData.publicUrl
      }
    }
  } catch (storageErr: any) {
    console.warn('[process-image] Storage upload failed (non-fatal):', storageErr?.message)
  }

  // Save image_result record
  const resultId = crypto.randomUUID()
  await db.$executeRaw`
    INSERT INTO image_results (id, generation_id, tenant_id, cdn_url, original_url, width_px, height_px)
    VALUES (${resultId}::uuid, ${jobId}::uuid, ${tenantId}::uuid, ${storageCdnUrl}, ${imageUrl}, ${width}, ${height})
  `

  // Update AiJob
  await db.aiJob.update({
    where: { id:jobId },
    data:  {
      status:      'completed',
      completedAt: new Date(),
      outputData:  { imageUrl:storageCdnUrl, resultId } as any,
    },
  })

  // Update generation record
  await db.$executeRaw`
    UPDATE image_generations
    SET status='completed', completed_at=NOW(),
        processing_ms=EXTRACT(EPOCH FROM (NOW()-started_at))*1000
    WHERE id=${jobId}::uuid
  `
}