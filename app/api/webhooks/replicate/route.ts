// apps/web-app/app/api/webhooks/replicate/route.ts
// ── Replicate Webhook ─────────────────────────────────────────
// Called by Replicate when image generation completes
// Verifies signature → saves image → updates DB → notifies

import { NextResponse } from 'next/server'
import { db }           from '@/lib/db'
import { createClient } from '@supabase/supabase-js'
import crypto           from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET
  if (!secret) return true  // Skip in dev if not set

  const webhookId        = req.headers.get('webhook-id')        ?? ''
  const webhookTimestamp = req.headers.get('webhook-timestamp')  ?? ''
  const webhookSignature = req.headers.get('webhook-signature')  ?? ''

  const toSign    = `${webhookId}.${webhookTimestamp}.${body}`
  const hmac      = crypto.createHmac('sha256', Buffer.from(secret, 'base64'))
  hmac.update(toSign)
  const computed  = `v1,${hmac.digest('base64')}`

  return webhookSignature.split(' ').some(sig => sig === computed)
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  // Verify signature
  if (process.env.NODE_ENV === 'production') {
    const valid = await verifySignature(req, rawBody)
    if (!valid) {
      console.warn('[replicate webhook] Invalid signature')
      return NextResponse.json({ error:'INVALID_SIGNATURE' }, { status:401 })
    }
  }

  let payload: any
  try { payload = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error:'INVALID_JSON' }, { status:400 })
  }

  const { id: predictionId, status, output, error } = payload

  console.log(`[replicate webhook] prediction=${predictionId} status=${status}`)

  // Find job by prediction_id
  const rows = await db.$queryRaw<Array<{id:string; tenant_id:string; user_id:string; width_px?:number; height_px?:number}>>`
    SELECT id, tenant_id, user_id FROM image_generations WHERE prediction_id = ${predictionId} LIMIT 1
  `

  if (!rows || rows.length === 0) {
    // Might be an older prediction or already processed
    return NextResponse.json({ ok:true, skipped:true })
  }

  const gen = rows[0]
  const jobId    = gen.id
  const tenantId = gen.tenant_id
  const userId   = gen.user_id

  // Handle failure
  if (status === 'failed' || status === 'canceled') {
    await db.aiJob.update({
      where: { id:jobId },
      data:  { status:'failed', error:error?.toString().slice(0,500) },
    }).catch(() => {})

    await db.$executeRaw`
      UPDATE image_generations
      SET status='failed', error_message=${error?.toString().slice(0,200)}
      WHERE id=${jobId}::uuid
    `.catch(() => {})

    // Refund image credit
    await db.$executeRaw`
      UPDATE tenants SET image_credits_used = GREATEST(0, image_credits_used - 1)
      WHERE id=${tenantId}::uuid
    `.catch(() => {})

    return NextResponse.json({ ok:true, status:'failed' })
  }

  // Handle success
  if (status === 'succeeded' && output) {
    const imageUrls: string[] = Array.isArray(output) ? output : [output]
    const firstUrl = imageUrls[0]
    if (!firstUrl) return NextResponse.json({ ok:true, skipped:true })

    // Upload to Supabase Storage
    let storageCdnUrl = firstUrl
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const imgRes = await fetch(firstUrl)
      if (imgRes.ok) {
        const buffer  = await imgRes.arrayBuffer()
        const fileKey = `generated/${tenantId}/${jobId}.png`
        const { error:upErr } = await supabase.storage.from('images').upload(fileKey, buffer, { contentType:'image/png', upsert:true })
        if (!upErr) {
          const { data } = supabase.storage.from('images').getPublicUrl(fileKey)
          storageCdnUrl  = data.publicUrl
        }
      }
    } catch (e: any) {
      console.warn('[replicate webhook] storage upload failed:', e?.message)
    }

    // Save image_result
    const resultId = crypto.randomUUID()
    await db.$executeRaw`
      INSERT INTO image_results (id, generation_id, tenant_id, cdn_url, original_url)
      VALUES (${resultId}::uuid, ${jobId}::uuid, ${tenantId}::uuid, ${storageCdnUrl}, ${firstUrl})
    `.catch(() => {})

    // Update job + generation
    await db.aiJob.update({
      where: { id:jobId },
      data:  { status:'completed', completedAt:new Date(), outputData:{ imageUrl:storageCdnUrl, resultId } as any },
    }).catch(() => {})

    await db.$executeRaw`
      UPDATE image_generations
      SET status='completed', completed_at=NOW(),
          processing_ms=EXTRACT(EPOCH FROM (NOW()-started_at))*1000
      WHERE id=${jobId}::uuid
    `.catch(() => {})

    return NextResponse.json({ ok:true, status:'completed', imageUrl:storageCdnUrl })
  }

  return NextResponse.json({ ok:true, status })
}