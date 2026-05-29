// apps/web-app/app/api/jobs/process-image/route.ts
// QStash worker — dipicu oleh QStash setelah dispatch dari /api/generate/image
//
// Flow:
//   1. Verify QStash signature (security: cuma QStash boleh hit endpoint ini)
//   2. Update AiJob status: pending → processing
//   3. Build Replicate prompt + dispatch prediction (async dengan webhook)
//   4. Save predictionId ke AiJob
//   5. Return 200 OK ke QStash
//   6. Replicate akan callback ke /api/webhooks/replicate saat selesai
//
// Note: kalau function ini fail (5xx), QStash auto-retry 3x dengan backoff
import { NextResponse } from 'next/server'
import { db }            from '@/lib/db'
import { verifyQStashSignature } from '@/lib/qstash'
import { buildImagePrompt, createImagePrediction } from '@/lib/replicate'
import { refundQuota } from '@/lib/quota/quota-service'
import { markFailed }  from '@/lib/content/content-service'
import { withQuotaCheck } from '@/lib/middleware/plan-check'
import { requireFeature } from '@/lib/middleware/plan-check'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30   // 30s cukup untuk dispatch ke Replicate

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

interface JobPayload {
  jobId:     string
  contentId: string
  tenant_id:  string
  userId:    string
  webhookId: string
  input: {
    productName:     string
    productBenefits?: string
    style:           'product_studio' | 'lifestyle' | 'flat_lay' | 'aesthetic' | 'minimalist'
    customPrompt?:   string
    useTurbo:        boolean
  }
}

export async function POST(req: Request) {
  // ── 1. Verify QStash signature ─────────────────────────
  const signature = req.headers.get('upstash-signature')
  const body      = await req.text()
  const url       = `${APP_URL}/api/jobs/process-image`

  const isValid = await verifyQStashSignature(signature, body, url)
  if (!isValid) {
    console.warn('[process-image] Invalid QStash signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: JobPayload
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { jobId, contentId, tenant_id, webhookId, input } = payload

  console.log(`[process-image] Processing job ${jobId} for content ${contentId}`)

  try {
    // ── 2. Update AiJob status ─────────────────────────
    const job = await db.aiJob.findUnique({
      where:  { id: jobId },
      select: { status: true, tenant_id: true },
    })

    if (!job) {
      console.error(`[process-image] Job ${jobId} not found`)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Idempotency: kalau status bukan pending, mungkin retry dari QStash
    if (job.status !== 'pending') {
      console.warn(`[process-image] Job ${jobId} already in status: ${job.status}, skipping`)
      return NextResponse.json({ ok: true, skipped: true })
    }

    await db.aiJob.update({
      where: { id: jobId },
      data:  { status: 'processing', startedAt: new Date() },
    })

    // ── 3. Build prompt ────────────────────────────────
    const { prompt, negativePrompt, width, height } = buildImagePrompt({
      productName:     input.productName,
      productBenefits: input.productBenefits,
      style:           input.style,
      customPrompt:    input.customPrompt,
    })

    // ── 4. Dispatch ke Replicate (async dengan webhook) ──
    const webhookUrl = `${APP_URL}/api/webhooks/replicate`

    const { predictionId, estimatedTime } = await createImagePrediction({
      prompt,
      negativePrompt,
      width,
      height,
      webhookUrl,
      webhookId,         // di-include sebagai query param di webhook URL
      useTurbo:          input.useTurbo,
    })

    console.log(`[process-image] Replicate prediction ${predictionId} dispatched (ETA ${estimatedTime}s)`)

    // ── 5. Save predictionId + prompt ke AiJob ──────────
    await db.aiJob.update({
      where: { id: jobId },
      data: {
        // Pakai outputData untuk track replicate prediction
        outputData: {
          predictionId,
          prompt,
          negativePrompt,
          width,
          height,
          estimatedTime,
          dispatchedAt: new Date().toISOString(),
        } as any,
      },
    })

    // ── 6. Return 200 OK ke QStash ──────────────────────
    return NextResponse.json({
      ok:           true,
      predictionId,
      estimatedTime,
    })

  } catch (err: any) {
    console.error('[process-image] Error:', err)

    // Mark job + content sebagai failed
    await db.aiJob.update({
      where: { id: jobId },
      data: {
        status:       'failed',
        error_message: err.message ?? 'Unknown error',
        completedAt:  new Date(),
      },
    }).catch(() => {})

    await markFailed({
      contentId,
      tenant_id,
      error_message: err.message ?? 'Replicate dispatch failed',
    })

    // Refund quota karena gagal
    await refundQuota(tenant_id, 'content', 1).catch(() => {})

    // Return 500 supaya QStash retry. Kalau retry-pun gagal, QStash kasih ke DLQ
    return NextResponse.json(
      { error: 'PROCESSING_FAILED', message: err.message },
      { status: 500 },
    )
  }
}