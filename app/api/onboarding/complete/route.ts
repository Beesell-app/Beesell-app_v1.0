// app/api/onboarding/complete/route.ts — v4
// Saves complete AI memory including content engine weight
// Uses admin client (service role) to bypass RLS

import { NextResponse }      from 'next/server'
import { z }                 from 'zod'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getContentWeight }  from '@/lib/validations/onboarding'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Plan mapping: UI value → DB enum (starter | pro | business)
const PLAN_MAP: Record<string, string> = {
  free: 'free',
  starter: 'basic',
  basic: 'basic',
  pro: 'pro',
  business: 'business',
}

const Schema = z.object({
  // Step 1
  storeName:        z.string().min(1).max(100),
  ownerName:        z.string().max(60).optional().default(''),
  whatsapp:         z.string().max(20).optional().default(''),
  sellerType:       z.string().default('seller'),
  businessScale:    z.string().default('solo'),
  experience:       z.string().default('beginner'),
  // Step 2
  niche:            z.string().optional().default(''),
  subNiche:         z.string().optional().default(''),
  productType:      z.string().default('physical'),
  productCount:     z.string().default('1-5'),
  priceRange:       z.string().optional().default(''),
  targetAudience:   z.array(z.string()).default([]),
  mainGoals:        z.array(z.string()).default([]),
  usp:              z.string().optional().default(''),
  // Step 3
  platforms:        z.array(z.string()).default([]),
  primaryPlatform:  z.string().optional().default('instagram'),
  contentTypes:     z.array(z.string()).default([]),
  postingFrequency: z.string().default('3-4/week'),
  painPoints:       z.array(z.string()).default([]),
  // Step 4
  visualStyle:      z.string().default('realistic'),
  colorTone:        z.string().default('clean-white'),
  moodTone:         z.string().default('trustworthy'),
  primaryColor:     z.string().default('#2563EB'),
  brandTagline:     z.string().optional().default(''),
  // Step 5
  tone:             z.string().default('casual'),
  language:         z.string().default('indonesian-casual'),
  emoji:            z.string().default('moderate'),
  ctaStyle:         z.string().default('medium'),
  brandKeywords:    z.string().optional().default(''),
  avoidWords:       z.string().optional().default(''),
  competitors:      z.string().optional().default(''),
  // Step 6
  planId:           z.string().default('free'),
  // Optional first content
  firstCaption:     z.string().optional(),
  firstProduct:     z.string().optional(),
})

export async function POST(req: Request) {
  // ── 1. Auth (anon client) ──────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({
      error: 'Unauthorized', message: 'Sesi habis. Silakan login ulang.',
    }, { status: 401 })
  }

  // ── 2. Parse body ──────────────────────────────────────────
  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    return NextResponse.json({ error: 'VALIDATION', message: msgs.join(' | ') }, { status: 400 })
  }
  const d = parsed.data

  // ── 3. Admin client for all DB writes ─────────────────────
  const admin = createAdminClient()

  // ── 4. Get or auto-create public.users ────────────────────
  let tenantId: string

  const { data: existingUser } = await (admin.from('users') as any)
    .select('id, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingUser) {
    tenantId = existingUser.tenant_id
  } else {
    console.warn('[onboarding/complete] auto-creating user+tenant for:', user.id)

    const userName = [d.ownerName, d.storeName, user.email?.split('@')[0], 'User']
      .find(v => v?.trim()) ?? 'User'

    // Unique slug
    const base = (userName + '-store').toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80) || 'store'
    let slug = base, n = 0
    for (;;) {
      const { data: ex } = await admin.from('tenants').select('id').eq('slug', slug).maybeSingle()
      if (!ex) break
      slug = `${base}-${++n}`
    }

    const { data: newTenant, error: tErr } = await (admin.from('tenants') as any)
      .insert({
        name: d.storeName || `${userName}'s Store`, slug,
        plan: dbPlan, quota_content_max: 50, quota_video_max: 5,
        timezone: 'Asia/Jakarta', locale: 'id-ID', settings: {}, metadata: {},
      })
      .select('id').single()

    if (tErr || !newTenant) {
      console.error('[onboarding/complete] tenant create failed:', tErr?.message)
      return NextResponse.json({
        error: 'TENANT_CREATE_FAILED',
        message: `Gagal membuat data toko: ${tErr?.message ?? 'unknown'}`,
      }, { status: 500 })
    }
    tenantId = newTenant.id

    const { error: uErr } = await (admin.from('users') as any).insert({
      id: user.id, tenant_id: tenantId, email: user.email ?? '',
      name: userName, avatar_url: user.user_metadata?.avatar_url ?? null,
      role: 'owner', onboarding_step: 0, onboarding_done: false,
      preferences: {}, metadata: {},
    })

    if (uErr && uErr.code !== '23505') {
      return NextResponse.json({
        error: 'USER_CREATE_FAILED', message: `Gagal membuat akun: ${uErr.message}`,
      }, { status: 500 })
    }

    if (uErr?.code === '23505') {
      const { data: raced } = await (admin.from('users') as any).select('tenant_id').eq('id', user.id).single()
      if (raced) tenantId = raced.tenant_id
    }
  }

  // ── 5. Compute content weight ──────────────────────────────
  // video-reels = 2, feed = 2, story = 1, ads = 1
  const contentWeight = getContentWeight(d.contentTypes)

  // ── 6. Build complete AI Memory ────────────────────────────
  const aiMemory = {
    version: '2.0',
    savedAt: new Date().toISOString(),
    identity: {
      storeName:     d.storeName,
      ownerName:     d.ownerName,
      whatsapp:      d.whatsapp,
      sellerType:    d.sellerType,
      businessScale: d.businessScale,
      experience:    d.experience,
    },
    product: {
      niche:          d.niche,
      subNiche:       d.subNiche,
      productType:    d.productType,
      productCount:   d.productCount,
      priceRange:     d.priceRange,
      targetAudience: d.targetAudience,
      mainGoals:      d.mainGoals,
      usp:            d.usp,
    },
    platform: {
      platforms:        d.platforms,
      primaryPlatform:  d.primaryPlatform,
      contentTypes:     d.contentTypes,
      contentWeight,                         // ← calculated weight
      postingFrequency: d.postingFrequency,
      painPoints:       d.painPoints,
    },
    visual: {
      visualStyle:  d.visualStyle,
      colorTone:    d.colorTone,
      moodTone:     d.moodTone,
      primaryColor: d.primaryColor,
      brandTagline: d.brandTagline,
    },
    voice: {
      tone:          d.tone,
      language:      d.language,
      emoji:         d.emoji,
      ctaStyle:      d.ctaStyle,
      brandKeywords: d.brandKeywords,
      avoidWords:    d.avoidWords,
      competitors:   d.competitors,
    },
  }

  // ── 7. Flat settings (for settings profile page) ───────────
  // ALL fields stored flat so /settings/profile can read them easily
  const settings = {
    // Identity
    storeName:         d.storeName,
    ownerName:         d.ownerName,
    whatsapp:          d.whatsapp,
    sellerType:        d.sellerType,
    businessScale:     d.businessScale,
    experience:        d.experience,
    // Product
    niche:             d.niche,
    subNiche:          d.subNiche,
    productType:       d.productType,
    productCount:      d.productCount,
    priceRange:        d.priceRange,
    targetAudience:    d.targetAudience,
    mainGoals:         d.mainGoals,
    usp:               d.usp,
    // Platform
    platforms:         d.platforms,
    primaryPlatform:   d.primaryPlatform,
    contentTypes:      d.contentTypes,
    contentWeight,
    postingFrequency:  d.postingFrequency,
    painPoints:        d.painPoints,
    // Visual
    visualStyle:       d.visualStyle,
    colorTone:         d.colorTone,
    moodTone:          d.moodTone,
    primaryColor:      d.primaryColor,
    brandTagline:      d.brandTagline,
    // Voice (prefixed default* for easy API fallback)
    defaultTone:       d.tone,
    defaultLanguage:   d.language,
    defaultEmoji:      d.emoji,
    defaultCtaStyle:   d.ctaStyle,
    brandKeywords:     d.brandKeywords,
    avoidWords:        d.avoidWords,
    competitors:       d.competitors,
  }

  // ── 8. Map plan to valid DB enum ───────────────────────────
  const dbPlan = PLAN_MAP[d.planId] ?? 'starter'

  // ── 9. Update tenant ───────────────────────────────────────
  const tenantBase = { name: d.storeName, plan: dbPlan, settings }

  const { error: tUpdErr } = await (admin.from('tenants') as any)
    .update({
      ...tenantBase,
      // New columns from migration 018 (graceful fallback if missing)
      ai_memory:               aiMemory,
      niche:                   d.niche || null,
      seller_type:             d.sellerType,
      primary_platform:        d.primaryPlatform || null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', tenantId)

  if (tUpdErr) {
    if (tUpdErr.message.includes('column') || tUpdErr.message.includes('does not exist')) {
      // Migration 018 not run yet — fallback to settings only
      const { error: fbErr } = await (admin.from('tenants') as any)
        .update(tenantBase)
        .eq('id', tenantId)
      if (fbErr) {
        return NextResponse.json({ error: 'TENANT_UPDATE_FAILED', message: fbErr.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'TENANT_UPDATE_FAILED', message: tUpdErr.message }, { status: 500 })
    }
  }

  // ── 10. Mark user onboarded ────────────────────────────────
  const userUpd: Record<string, any> = { onboarding_done: true, onboarding_step: 7 }
  if (d.ownerName?.trim()) userUpd.name = d.ownerName.trim()

  const { error: uUpdErr } = await (admin.from('users') as any).update(userUpd).eq('id', user.id)

  if (uUpdErr) {
    return NextResponse.json({ error: 'USER_UPDATE_FAILED', message: uUpdErr.message }, { status: 500 })
  }

  // ── 11. Save first caption (non-fatal) ────────────────────
  if (d.firstCaption && d.firstProduct) {
    await (admin.from('contents') as any).insert({
      tenant_id: tenantId, user_id: user.id,
      type: 'caption', engine: 'caption', status: 'ready',
      title: d.firstProduct, caption_text: d.firstCaption,
      primary_platform: d.primaryPlatform || 'instagram',
    }).then(({ error: e }: any) => {
      if (e) console.warn('[onboarding/complete] first caption (non-fatal):', e.message)
    })
  }

  console.log('[onboarding/complete] ✅ SUCCESS', {
    user: user.id, tenant: tenantId, plan: dbPlan,
    contentTypes: d.contentTypes, contentWeight,
  })

  return NextResponse.json({ success: true, message: 'Onboarding berhasil disimpan!' })
}