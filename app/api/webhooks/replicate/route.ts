// apps/web-app/app/api/webhooks/replicate/route.ts
import { NextResponse } from 'next/server'
import { db }           from '@/lib/db'
import { createClient } from '@supabase/supabase-js'
import { Redis }        from '@upstash/redis'
import crypto           from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const redis = Redis.fromEnv()

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET
  if (!secret) return true

  const webhookId        = req.headers.get('webhook-id')        ?? ''
  const webhookTimestamp = req.headers.get('webhook-timestamp')  ?? ''
  const webhookSignature = req.headers.get('webhook-signature')  ?? ''

  const toSign   = `${webhookId}.${webhookTimestamp}.${body}`
  const hmac     = crypto.createHmac('sha256', Buffer.from(secret, 'base64'))
  hmac.update(toSign)
  const computed = `v1,${hmac.digest('base64')}`
  return webhookSignature.split(' ').some(sig => sig === computed)
}

export async function POST(req: Request) {
  const rawBody = await req.text()

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

  // Ambil juga credits_used + created_at untuk refund yang akurat
  const rows = await db.$queryRaw<Array<{
    id:string; tenant_id:string; user_id:string; credits_used:number | null; created_at:Date | null
  }>>`
    SELECT id, tenant_id, user_id, credits_used, created_at
    FROM image_generations WHERE prediction_id = ${predictionId} LIMIT 1
  `
  if (!rows || rows.length === 0) return NextResponse.json({ ok:true, skipped:true })

  const gen      = rows[0]
  const jobId    = gen.id
  const tenantId = gen.tenant_id
  const refund   = gen.credits_used ?? 1
  const dayKey   = `beesell:img:daily:${tenantId}:${(gen.created_at ?? new Date()).toISOString().slice(0,10)}`

  // ── Gagal / dibatalkan ────────────────────────────────
  if (status === 'failed' || status === 'canceled') {
    await db.aiJob.update({
      where: { id:jobId },
      data:  { status:'failed', error_message: error?.toString().slice(0,500) },
    }).catch(() => {})

    await db.$executeRaw`
      UPDATE image_generations SET status='failed', error_message=${error?.toString().slice(0,200)}
      WHERE id=${jobId}::uuid
    `.catch(() => {})

    // Refund sesuai biaya quality + kembalikan counter harian
    await db.$executeRaw`
      UPDATE tenants SET image_credits_used = GREATEST(0, image_credits_used - ${refund})
      WHERE id=${tenantId}::uuid
    `.catch(() => {})
    await redis.decrby(dayKey, refund).catch(() => {})

    return NextResponse.json({ ok:true, status:'failed', refunded:refund })
  }

  // ── Sukses ────────────────────────────────────────────
  if (status === 'succeeded' && output) {
    const imageUrls: string[] = Array.isArray(output) ? output : [output]
    const firstUrl = imageUrls[0]
    if (!firstUrl) return NextResponse.json({ ok:true, skipped:true })

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
        const { error:upErr } = await supabase.storage.from('images')
          .upload(fileKey, buffer, { contentType:'image/png', upsert:true })
        if (!upErr) {
          const { data } = supabase.storage.from('images').getPublicUrl(fileKey)
          storageCdnUrl  = data.publicUrl
        }
      }
    } catch (e: any) {
      console.warn('[replicate webhook] storage upload failed:', e?.message)
    }

    const resultId = crypto.randomUUID()
    await db.$executeRaw`
      INSERT INTO image_results (id, generation_id, tenant_id, cdn_url, original_url)
      VALUES (${resultId}::uuid, ${jobId}::uuid, ${tenantId}::uuid, ${storageCdnUrl}, ${firstUrl})
    `.catch(() => {})

    await db.aiJob.update({
      where: { id:jobId },
      data:  { status:'completed', completed_at:new Date(), output_data:{ imageUrl:storageCdnUrl, resultId } as any },
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