// apps/web-app/app/api/generate/image/route.ts
import { NextResponse }  from 'next/server'
import { z }             from 'zod'
import { Ratelimit }     from '@upstash/ratelimit'
import { Redis }         from '@upstash/redis'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { buildImagePrompt, ratioDimensions, PLAN_IMAGE_LIMITS } from '@/lib/ai/image/prompt-builder'
import { PROVIDER_COST } from '@/lib/providers/image-provider'
import { randomUUID }    from 'crypto'
import {
  IMAGE_QUALITY, resolveQuality, StyleInput, scaleDimsForQuality, QUALITY_POLICY,
} from '@/lib/ai/image/quality-tiers'
import { getFeatureFlag } from '@/lib/tools/access'
import { isSuperuserEmail } from '@/lib/feature-flags'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

const redis     = Redis.fromEnv()
const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1m'), prefix:'beesell:img:rl' })

const SUPERUSER_IDS = (process.env.BEESELL_SUPERUSER_IDS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)
const SUPERUSER_EMAILS = (process.env.BEESELL_SUPERUSER_EMAILS ?? '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

const Schema = z.object({
  productName:     z.string().min(2).max(300),
  productDesc:     z.string().max(500).optional(),

  quality:         z.enum(['standard','high','ultra']).default('standard'),
  style:           z.string().max(40).optional(),
  bgColor:         z.string().max(20).optional(),

  category:        z.string().max(50).optional(),
  contentType:     z.string().max(50).optional(),
  visualStyle:     z.string().max(50).optional(),
  productType:     z.string().max(50).optional(),
  targetAudience:  z.string().max(50).optional(),
  platform:        z.string().max(50).optional(),
  bgStyle:         z.string().max(50).optional(),
  colorTone:       z.string().max(50).optional(),
  moodTone:        z.string().max(50).optional(),
  lightingStyle:   z.string().max(50).optional(),
  composition:     z.string().max(50).optional(),
  cameraStyle:     z.string().max(50).optional(),

  ratio:           z.enum(['1:1','4:5','9:16','16:9','4:3']).default('1:1'),
  count:           z.number().int().min(1).max(4).default(1),

  customPrompt:    z.string().max(1000).optional(),
  negativePrompt:  z.string().max(500).optional(),
  uploadedImageUrl:z.string().url().optional(),
  // provider/model/tier/resolution dari client → di-strip Zod (anti-bypass)
})

export async function POST(req: Request) {
  const startMs = Date.now()
  
  // 1. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'UNAUTHORIZED' }, { status:401 })

  const flag = await getFeatureFlag('ai-image-generator')
  if (flag && (flag.status === 'disabled' || flag.status === 'coming-soon')) {
    return NextResponse.json(
      { error: 'TOOL_DISABLED', message: flag.reason || 'Fitur sedang dinonaktifkan.' },
      { status: 403 },
    )
  }

  // 2. Rate limit
  const { success: rlOk } = await ratelimit.limit(user.id)
  if (!rlOk) return NextResponse.json({ error:'RATE_LIMITED', message:'Terlalu banyak request. Tunggu 1 menit.' }, { status:429 })

  // 3. Validate
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error:'INVALID_JSON' }, { status:400 }) }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error:'VALIDATION_ERROR',
      details: parsed.error.issues.map(i => ({ field:i.path.join('.'), msg:i.message })),
    }, { status:400 })
  }
  const d = parsed.data

  // 4. Tenant + tier (OTORITAS dari DB) — nama field snake_case sesuai schema
  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: {
      id: true, tenant_id: true,
      tenants: { select: { plan: true, image_credits_used: true, image_credits_max: true } },
    },
  })
  if (!dbUser) return NextResponse.json({ error:'USER_NOT_FOUND' }, { status:404 })

  const tenantId    = dbUser.tenant_id
  const tenant      = dbUser.tenants
  const plan        = tenant.plan as string
  const isSuperuser =
  SUPERUSER_IDS.includes(user.id) ||
  (user.email ? SUPERUSER_EMAILS.includes(user.email.toLowerCase()) : false)
  const limits      = PLAN_IMAGE_LIMITS[plan] ?? PLAN_IMAGE_LIMITS.free

  // ⚡ Clamp quality ke tier
  const rq = resolveQuality(plan, d.quality, isSuperuser)
  if (!rq.allowed && QUALITY_POLICY === 'reject') {
    return NextResponse.json({
      error:'QUALITY_NOT_ALLOWED', upgrade:true, requiredTier: rq.requiredTier,
      message:`Kualitas ${IMAGE_QUALITY[rq.requested].label} butuh plan ${rq.requiredTier.toUpperCase()}. Upgrade untuk lanjut.`,
    }, { status:402 })
  }
  const Q       = rq.tier
  const credits = Q.cost * d.count

  // Kuota bulanan
  const usedM = tenant.image_credits_used ?? 0
  const maxM  = tenant.image_credits_max  ?? limits.monthly
  if (!isSuperuser && usedM + credits > maxM) {
    return NextResponse.json({
      error:'IMAGE_QUOTA_EXCEEDED',
      message:`Kuota gambar bulanan habis (${usedM}/${maxM}). Upgrade plan untuk lebih banyak.`,
      used: usedM, max: maxM,
    }, { status:429 })
  }

  // Kuota harian (Redis)
  const today     = new Date().toISOString().slice(0,10)
  const dailyKey  = `beesell:img:daily:${tenantId}:${today}`
  const dailyUsed = Number(await redis.get(dailyKey).catch(() => 0)) || 0
  if (!isSuperuser && dailyUsed + credits > limits.daily) {
    return NextResponse.json({
      error:'DAILY_IMAGE_QUOTA_EXCEEDED',
      message:`Kuota gambar harian habis (${dailyUsed}/${limits.daily}). Reset tengah malam WIB.`,
      dailyUsed, dailyMax: limits.daily,
    }, { status:429 })
  }

  // 5. Build prompt
  const sp = StyleInput(d.style)
  const styleBoost = [sp.boost, Q.boost, d.bgColor ? `background color ${d.bgColor}` : '']
    .filter(Boolean).join(', ')

  const { prompt, negativePrompt, recommendedRatio } = buildImagePrompt({
    productName:    d.productName,
    productDesc:    d.productDesc,
    category:       d.category,
    contentType:    d.contentType   ?? sp.contentType,
    visualStyle:    d.visualStyle   ?? sp.visualStyle,
    productType:    d.productType,
    targetAudience: d.targetAudience,
    platform:       d.platform,
    bgStyle:        d.bgStyle        ?? sp.bgStyle,
    colorTone:      d.colorTone,
    moodTone:       d.moodTone       ?? sp.moodTone,
    lightingStyle:  d.lightingStyle  ?? sp.lightingStyle,
    composition:    d.composition    ?? sp.composition,
    cameraStyle:    d.cameraStyle,
    ratio:          d.ratio,
    customPrompt:   [d.customPrompt, styleBoost].filter(Boolean).join(', '),
    negativePrompt: d.negativePrompt,
    uploadedImageUrl: d.uploadedImageUrl,
  })

  const finalRatio = d.ratio ?? recommendedRatio
  const dims       = scaleDimsForQuality(ratioDimensions(finalRatio), Q)
  const provider   = Q.provider
  const model      = Q.model

  // 6. Charge (skip superuser)
  if (!isSuperuser) {
    await Promise.all([
      db.tenant.update({ where:{ id: tenantId }, data:{ image_credits_used:{ increment: credits } } }),
      redis.incrby(dailyKey, credits),
      redis.expire(dailyKey, 86400),
    ])
  }

  // 7. Records + dispatch
  const generationIds: string[] = []
  try {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/,'')

    for (let i = 0; i < d.count; i++) {
      const genId = randomUUID()
      generationIds.push(genId)

      await db.$executeRaw`
        INSERT INTO image_generations (
          id, tenant_id, user_id,
          product_name, product_desc, category, content_type,
          visual_style, product_type, target_audience, platform,
          bg_style, color_tone, mood_tone, lighting_style, composition, camera_style,
          ratio, count, raw_prompt, enhanced_prompt, negative_prompt,
          status, provider, model_id, credits_used, cost_usd
        ) VALUES (
          ${genId}::uuid, ${tenantId}::uuid, ${user.id}::uuid,
          ${d.productName}, ${d.productDesc ?? null}, ${d.category ?? null}, ${d.contentType ?? sp.contentType ?? null},
          ${d.visualStyle ?? sp.visualStyle ?? null}, ${d.productType ?? null}, ${d.targetAudience ?? null}, ${d.platform ?? null},
          ${d.bgStyle ?? sp.bgStyle ?? null}, ${d.colorTone ?? null}, ${d.moodTone ?? sp.moodTone ?? null}, ${d.lightingStyle ?? sp.lightingStyle ?? null},
          ${d.composition ?? sp.composition ?? null}, ${d.cameraStyle ?? null},
          ${finalRatio}, 1, ${prompt}, ${prompt}, ${negativePrompt},
          'queued', ${provider}, ${model}, ${Q.cost}, ${PROVIDER_COST[provider] ?? 0}
        )
      `

      await db.aiJob.create({
        data: {
          id: genId,
          tenant_id: tenantId,
          user_id:   user.id,
          job_type:  'image_generation',
          status:    'queued',
          provider,
          model,
          input_data: {
            prompt, negativePrompt, width: dims.width, height: dims.height,
            provider, model, quality: rq.effective, imageGenId: genId,
          } as any,
        },
      })

      await db.$executeRaw`
        INSERT INTO prompt_histories (id, tenant_id, generation_id, prompt_text)
        VALUES (gen_random_uuid(), ${tenantId}::uuid, ${genId}::uuid, ${prompt})
        ON CONFLICT DO NOTHING
      `

      const qstashToken = process.env.QSTASH_TOKEN
      const workerUrl   = `${appUrl}/api/jobs/process-image`
      const dispatchPayload = {
        jobId: genId, tenantId, userId: user.id, plan,
        prompt, negativePrompt, width: dims.width, height: dims.height,
        provider, model, quality: rq.effective, refImageUrl: d.uploadedImageUrl,
      }

      if (qstashToken) {
        await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(workerUrl)}`, {
          method:'POST',
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            'Content-Type':'application/json',
            'Upstash-Retries':'2',
            'Upstash-Delay': `${i * 500}ms`,
          },
          body: JSON.stringify(dispatchPayload),
        })
      } else {
        fetch(workerUrl, {
          method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(dispatchPayload),
        }).catch(e => console.error('[generate/image] worker call failed:', e?.message))
      }
    }

    await db.$executeRaw`
      INSERT INTO api_logs (id, tenant_id, user_id, endpoint, method, status_code, latency_ms, provider)
      VALUES (gen_random_uuid(), ${tenantId}::uuid, ${user.id}::uuid, '/api/generate/image', 'POST', 200, ${Date.now()-startMs}, ${provider})
    `.catch(() => {})

    return NextResponse.json({
      success:true, jobIds:generationIds, count:d.count,
      provider, model, quality: rq.effective, clamped: rq.clamped,
      prompt, dimensions: dims, ratio: finalRatio, creditsUsed: credits,
      estimatedMs: provider === 'openai' ? 15_000 : 30_000,
    })

  } catch (err: any) {
    if (!isSuperuser) {
      await Promise.all([
        db.tenant.update({ where:{ id: tenantId }, data:{ image_credits_used:{ decrement: credits } } }).catch(() => {}),
        redis.decrby(dailyKey, credits).catch(() => {}),
      ])
    }
    await db.$executeRaw`
      INSERT INTO api_logs (id, tenant_id, user_id, endpoint, method, status_code, latency_ms, error_code)
      VALUES (gen_random_uuid(), ${tenantId}::uuid, ${user.id}::uuid, '/api/generate/image', 'POST', 500, ${Date.now()-startMs}, ${err?.message?.slice(0,100)})
    `.catch(() => {})

    console.error('[POST /api/generate/image]', err?.message)
    return NextResponse.json({ error:'GENERATION_FAILED', message: err?.message ?? 'Terjadi kesalahan. Coba lagi.' }, { status:500 })
  }
}