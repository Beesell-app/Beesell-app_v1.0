// apps/web-app/app/api/generate/image/route.ts
// ── POST /api/generate/image ──────────────────────────────────
// Production-ready image generation with:
// - Auth + quota check + rate limiting
// - Dynamic prompt building (12 dimensions)
// - Provider abstraction (Replicate/OpenAI/Stability)
// - Async job dispatch via QStash
// - DB logging + credit deduction
// - Anti-abuse via Upstash rate limit

import { NextResponse }           from 'next/server'
import { z }                       from 'zod'
import { Ratelimit }               from '@upstash/ratelimit'
import { Redis }                   from '@upstash/redis'
import { createClient }            from '@/lib/supabase/server'
import { db }                      from '@/lib/db'
import { buildImagePrompt, ratioDimensions, IMAGE_CREDITS, PLAN_IMAGE_LIMITS } from '@/lib/ai/image/prompt-builder'
import { dispatchImageGeneration, PROVIDER_COST } from '@/lib/providers/image-provider'
import { randomUUID }              from 'crypto'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

const redis     = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1m'),
  prefix:  'beesell:img:rl',
})

const Schema = z.object({
  // Core
  productName:     z.string().min(2).max(300),
  productDesc:     z.string().max(500).optional(),

  // 12 dimension selectors
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

  // Output config
  ratio:           z.enum(['1:1','4:5','9:16','16:9','4:3']).default('1:1'),
  count:           z.number().int().min(1).max(4).default(1),

  // Custom overrides
  customPrompt:    z.string().max(1000).optional(),
  negativePrompt:  z.string().max(500).optional(),
  uploadedImageUrl:z.string().url().optional(),

  // Provider
  provider:        z.enum(['replicate','openai','stability','flux']).optional(),
})

export async function POST(req: Request) {
  const startMs = Date.now()

  // ── 1. Auth ──────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error:'UNAUTHORIZED' }, { status:401 })
  }

  // ── 2. Rate limit (20 req/min per user) ──────────────────
  const { success: rlOk } = await ratelimit.limit(user.id)
  if (!rlOk) {
    return NextResponse.json({
      error:'RATE_LIMITED',
      message:'Terlalu banyak request. Tunggu 1 menit.',
    }, { status:429 })
  }

  // ── 3. Parse + validate ───────────────────────────────────
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error:'INVALID_JSON' }, { status:400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error:'VALIDATION_ERROR',
      details: parsed.error.issues.map(i => ({ field:i.path.join('.'), msg:i.message })),
    }, { status:400 })
  }

  const d = parsed.data

  // ── 4. Get tenant + check image quota ─────────────────────
  const dbUser = await db.user.findUnique({
    where:  { id:user.id },
    select: {
      id:true, tenantId:true,
      tenant: {
        select: {
          plan:true, name:true, niche:true,
          imageCreditUsed:true, imageCreditMax:true,
        },
      },
    },
  })

  if (!dbUser) {
    return NextResponse.json({ error:'USER_NOT_FOUND' }, { status:404 })
  }

  const { tenantId, tenant } = dbUser
  const plan    = tenant.plan as string
  const limits  = PLAN_IMAGE_LIMITS[plan] ?? PLAN_IMAGE_LIMITS.free
  const credits = IMAGE_CREDITS.generate * d.count

  // Check monthly limit
  const used    = tenant.imageCreditUsed ?? 0
  const max     = tenant.imageCreditMax  ?? limits.monthly
  if (used + credits > max) {
    return NextResponse.json({
      error:   'IMAGE_QUOTA_EXCEEDED',
      message: `Kuota gambar bulanan habis (${used}/${max}). Upgrade plan untuk lebih banyak.`,
      used, max,
    }, { status:429 })
  }

  // Check daily limit via Redis
  const today    = new Date().toISOString().slice(0,10)
  const dailyKey = `beesell:img:daily:${tenantId}:${today}`
  const dailyUsed = Number(await redis.get(dailyKey).catch(() => 0)) || 0
  if (dailyUsed + credits > limits.daily) {
    return NextResponse.json({
      error:   'DAILY_IMAGE_QUOTA_EXCEEDED',
      message: `Kuota gambar harian habis (${dailyUsed}/${limits.daily}). Reset tengah malam WIB.`,
      dailyUsed, dailyMax: limits.daily,
    }, { status:429 })
  }

  // ── 5. Build prompt ───────────────────────────────────────
  const { prompt, negativePrompt, recommendedRatio } = buildImagePrompt({
    productName:    d.productName,
    productDesc:    d.productDesc,
    category:       d.category,
    contentType:    d.contentType,
    visualStyle:    d.visualStyle,
    productType:    d.productType,
    targetAudience: d.targetAudience,
    platform:       d.platform,
    bgStyle:        d.bgStyle,
    colorTone:      d.colorTone,
    moodTone:       d.moodTone,
    lightingStyle:  d.lightingStyle,
    composition:    d.composition,
    cameraStyle:    d.cameraStyle,
    ratio:          d.ratio,
    customPrompt:   d.customPrompt,
    negativePrompt: d.negativePrompt,
    uploadedImageUrl: d.uploadedImageUrl,
  })

  const finalRatio = d.ratio ?? recommendedRatio
  const dims       = ratioDimensions(finalRatio)

  // ── 6. Deduct credits + update daily counter (optimistic) ─
  await Promise.all([
    db.tenant.update({
      where: { id:tenantId },
      data:  { imageCreditUsed: { increment:credits } },
    }),
    redis.incrby(dailyKey, credits),
    redis.expire(dailyKey, 86400),
  ])

  // ── 7. Create generation records in DB ────────────────────
  const provider = d.provider
    ?? (process.env.NEXT_PUBLIC_IMAGE_PROVIDER as any ?? 'replicate')

  // Create N generation records (one per image)
  const generationIds: string[] = []

  try {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/,'')

    for (let i = 0; i < d.count; i++) {
      const genId = randomUUID()
      generationIds.push(genId)

      // Save to image_generations table
      await db.$executeRaw`
        INSERT INTO image_generations (
          id, tenant_id, user_id,
          product_name, product_desc, category, content_type,
          visual_style, product_type, target_audience, platform,
          bg_style, color_tone, mood_tone, lighting_style, composition, camera_style,
          ratio, count, raw_prompt, enhanced_prompt, negative_prompt,
          status, provider, credits_used, cost_usd
        ) VALUES (
          ${genId}::uuid, ${tenantId}::uuid, ${user.id}::uuid,
          ${d.productName}, ${d.productDesc ?? null}, ${d.category ?? null}, ${d.contentType ?? null},
          ${d.visualStyle ?? null}, ${d.productType ?? null}, ${d.targetAudience ?? null}, ${d.platform ?? null},
          ${d.bgStyle ?? null}, ${d.colorTone ?? null}, ${d.moodTone ?? null}, ${d.lightingStyle ?? null},
          ${d.composition ?? null}, ${d.cameraStyle ?? null},
          ${finalRatio}, 1, ${prompt}, ${prompt}, ${negativePrompt},
          'queued', ${provider}, ${IMAGE_CREDITS.generate}, ${PROVIDER_COST[provider] ?? 0}
        )
      `

      // Also create AiJob for status polling compatibility
      await db.aiJob.create({
        data: {
          id:          genId,
          tenantId,
          userId:      user.id,
          type:        'image',
          status:      'queued',
          inputData:   { prompt, negativePrompt, width:dims.width, height:dims.height, provider, imageGenId:genId } as any,
        },
      })

      // Save prompt to history
      await db.$executeRaw`
        INSERT INTO prompt_histories (id, tenant_id, generation_id, prompt_text)
        VALUES (gen_random_uuid(), ${tenantId}::uuid, ${genId}::uuid, ${prompt})
        ON CONFLICT DO NOTHING
      `

      // Dispatch to QStash or direct worker
      const qstashToken = process.env.QSTASH_TOKEN
      const workerUrl   = `${appUrl}/api/jobs/process-image`

      if (qstashToken) {
        await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(workerUrl)}`, {
          method:  'POST',
          headers: {
            Authorization:     `Bearer ${qstashToken}`,
            'Content-Type':    'application/json',
            'Upstash-Retries': '2',
            'Upstash-Delay':   `${i * 500}ms`,  // stagger requests
          },
          body: JSON.stringify({
            jobId:     genId,
            tenantId,
            userId:    user.id,
            plan,
            prompt,
            negativePrompt,
            width:     dims.width,
            height:    dims.height,
            provider,
            refImageUrl: d.uploadedImageUrl,
          }),
        })
      } else {
        // Dev: fire and forget
        fetch(workerUrl, {
          method:  'POST',
          headers: { 'Content-Type':'application/json' },
          body:    JSON.stringify({
            jobId:     genId,
            tenantId,
            userId:    user.id,
            plan,
            prompt,
            negativePrompt,
            width:     dims.width,
            height:    dims.height,
            provider,
            refImageUrl: d.uploadedImageUrl,
          }),
        }).catch(e => console.error('[generate/image] worker call failed:', e?.message))
      }
    }

    // Log API call
    await db.$executeRaw`
      INSERT INTO api_logs (id, tenant_id, user_id, endpoint, method, status_code, latency_ms, provider)
      VALUES (gen_random_uuid(), ${tenantId}::uuid, ${user.id}::uuid, '/api/generate/image', 'POST', 200, ${Date.now()-startMs}, ${provider})
    `.catch(() => {})

    return NextResponse.json({
      success:       true,
      jobIds:        generationIds,
      count:         d.count,
      provider,
      prompt,        // return prompt for transparency
      dimensions:    dims,
      ratio:         finalRatio,
      creditsUsed:   credits,
      estimatedMs:   provider === 'openai' ? 15_000 : 30_000,
    })

  } catch (err: any) {
    // Refund credits on error
    await Promise.all([
      db.tenant.update({ where:{id:tenantId}, data:{ imageCreditUsed:{ decrement:credits } } }).catch(() => {}),
      redis.decrby(dailyKey, credits).catch(() => {}),
    ])

    // Log failed API call
    await db.$executeRaw`
      INSERT INTO api_logs (id, tenant_id, user_id, endpoint, method, status_code, latency_ms, error_code)
      VALUES (gen_random_uuid(), ${tenantId}::uuid, ${user.id}::uuid, '/api/generate/image', 'POST', 500, ${Date.now()-startMs}, ${err?.message?.slice(0,100)})
    `.catch(() => {})

    console.error('[POST /api/generate/image]', err?.message)
    return NextResponse.json({
      error:   'GENERATION_FAILED',
      message: err?.message ?? 'Terjadi kesalahan. Coba lagi.',
    }, { status:500 })
  }
}