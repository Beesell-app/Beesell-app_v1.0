// app/api/settings/profile/route.ts
// GET  → baca semua data AI Memory + settings dari DB
// PATCH → simpan perubahan settings/profile

import { NextResponse }      from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getContentWeight }  from '@/lib/validations/onboarding'

export const dynamic = 'force-dynamic'

// ── GET ────────────────────────────────────────────────────────
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get user
  const { data: dbUser, error: uErr } =
  await (admin.from('users') as any)
    .select('id, tenant_id, name, email, avatar_url, role, onboarding_done, created_at')
    .eq('id', user.id)
    .single()

  if (uErr || !dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Get tenant with all settings
  const { data: tenant, error: tErr } =
  await (admin.from('tenants') as any)
    .select('id, name, plan, settings, ai_memory, niche, seller_type, primary_platform, created_at')
    .eq('id', dbUser.tenant_id)
    .single()

  if (tErr || !tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  // Merge: ai_memory (structured) takes priority, settings (flat) as fallback
  const mem = (tenant.ai_memory as any) ?? {}
  const s   = (tenant.settings  as any) ?? {}

  const identity = mem.identity ?? {}
  const product  = mem.product  ?? {}
  const platform = mem.platform ?? {}
  const visual   = mem.visual   ?? {}
  const voice    = mem.voice    ?? {}

  // Content weight recalculation
  const contentTypes = platform.contentTypes ?? s.contentTypes ?? []
  const contentWeight = platform.contentWeight ?? getContentWeight(contentTypes)

  const profile = {
    // ── User ────────────────────────────────────────
    userId:       dbUser.id,
    name:         dbUser.name ?? s.ownerName ?? identity.ownerName ?? '',
    email:        dbUser.email ?? user.email ?? '',
    avatarUrl:    dbUser.avatar_url ?? user.user_metadata?.avatar_url ?? null,
    role:         dbUser.role ?? 'owner',
    memberSince:  dbUser.created_at ?? tenant.created_at ?? null,
    onboardingDone: dbUser.onboarding_done ?? false,

    // ── Tenant ─────────────────────────────────────
    tenantId:     tenant.id,
    storeName:    identity.storeName ?? tenant.name ?? s.storeName ?? '',
    plan:         tenant.plan ?? 'starter',

    // ── Step 1: Identity ────────────────────────────
    ownerName:     identity.ownerName    ?? s.ownerName    ?? dbUser.name ?? '',
    whatsapp:      identity.whatsapp     ?? s.whatsapp     ?? '',
    sellerType:    identity.sellerType   ?? s.sellerType   ?? tenant.seller_type ?? '',
    businessScale: identity.businessScale?? s.businessScale?? '',
    experience:    identity.experience   ?? s.experience   ?? '',

    // ── Step 2: Product ─────────────────────────────
    niche:          product.niche          ?? s.niche          ?? tenant.niche ?? '',
    subNiche:       product.subNiche       ?? s.subNiche       ?? '',
    productType:    product.productType    ?? s.productType    ?? '',
    productCount:   product.productCount   ?? s.productCount   ?? '',
    priceRange:     product.priceRange     ?? s.priceRange     ?? '',
    targetAudience: product.targetAudience ?? s.targetAudience ?? [],
    mainGoals:      product.mainGoals      ?? s.mainGoals      ?? [],
    usp:            product.usp            ?? s.usp            ?? '',

    // ── Step 3: Platform ────────────────────────────
    platforms:        platform.platforms        ?? s.platforms        ?? [],
    primaryPlatform:  platform.primaryPlatform  ?? s.primaryPlatform  ?? tenant.primary_platform ?? '',
    contentTypes,
    contentWeight,
    postingFrequency: platform.postingFrequency ?? s.postingFrequency ?? '',
    painPoints:       platform.painPoints       ?? s.painPoints       ?? [],

    // ── Step 4: Visual ──────────────────────────────
    visualStyle:  visual.visualStyle  ?? s.visualStyle  ?? '',
    colorTone:    visual.colorTone    ?? s.colorTone    ?? '',
    moodTone:     visual.moodTone     ?? s.moodTone     ?? '',
    primaryColor: visual.primaryColor ?? s.primaryColor ?? '#2563EB',
    brandTagline: visual.brandTagline ?? s.brandTagline ?? '',

    // ── Step 5: Voice ───────────────────────────────
    tone:          voice.tone          ?? s.defaultTone     ?? '',
    language:      voice.language      ?? s.defaultLanguage ?? '',
    emoji:         voice.emoji         ?? s.defaultEmoji    ?? '',
    ctaStyle:      voice.ctaStyle      ?? s.defaultCtaStyle ?? '',
    brandKeywords: voice.brandKeywords ?? s.brandKeywords   ?? '',
    avoidWords:    voice.avoidWords    ?? s.avoidWords      ?? '',
    competitors:   voice.competitors   ?? s.competitors     ?? '',

    // ── AI Memory version info ──────────────────────
    memoryVersion: mem.version ?? null,
    memorySavedAt: mem.savedAt ?? null,
  }

  return NextResponse.json({ success: true, data: profile })
}

// ── PATCH ──────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const admin = createAdminClient()

  // Get current state
  const { data: dbUser } =
    await (admin.from('users') as any)
      .select('tenant_id')
      .eq('id', user.id)
      .single()
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: tenant } =
  await (admin.from('tenants') as any)
    .select('ai_memory, settings')
    .eq('id', dbUser.tenant_id)
    .single()

  const oldMem = (tenant?.ai_memory as any) ?? {}
  const oldS   = (tenant?.settings  as any) ?? {}

  // Recompute content weight if contentTypes changed
  const contentTypes = body.contentTypes ?? oldMem.platform?.contentTypes ?? oldS.contentTypes ?? []
  const contentWeight = getContentWeight(contentTypes)

  // Rebuild ai_memory (merge with existing, overwrite with new values)
  const newMem = {
    ...oldMem,
    version: '2.0',
    savedAt: new Date().toISOString(),
    identity: {
      ...oldMem.identity,
      storeName:     body.storeName      ?? oldMem.identity?.storeName,
      ownerName:     body.ownerName      ?? oldMem.identity?.ownerName,
      whatsapp:      body.whatsapp       ?? oldMem.identity?.whatsapp,
      sellerType:    body.sellerType     ?? oldMem.identity?.sellerType,
      businessScale: body.businessScale  ?? oldMem.identity?.businessScale,
      experience:    body.experience     ?? oldMem.identity?.experience,
    },
    product: {
      ...oldMem.product,
      niche:          body.niche          ?? oldMem.product?.niche,
      subNiche:       body.subNiche       ?? oldMem.product?.subNiche,
      productType:    body.productType    ?? oldMem.product?.productType,
      productCount:   body.productCount   ?? oldMem.product?.productCount,
      priceRange:     body.priceRange     ?? oldMem.product?.priceRange,
      targetAudience: body.targetAudience ?? oldMem.product?.targetAudience ?? [],
      mainGoals:      body.mainGoals      ?? oldMem.product?.mainGoals      ?? [],
      usp:            body.usp            ?? oldMem.product?.usp,
    },
    platform: {
      ...oldMem.platform,
      platforms:        body.platforms        ?? oldMem.platform?.platforms        ?? [],
      primaryPlatform:  body.primaryPlatform  ?? oldMem.platform?.primaryPlatform,
      contentTypes,
      contentWeight,
      postingFrequency: body.postingFrequency ?? oldMem.platform?.postingFrequency,
      painPoints:       body.painPoints       ?? oldMem.platform?.painPoints       ?? [],
    },
    visual: {
      ...oldMem.visual,
      visualStyle:  body.visualStyle  ?? oldMem.visual?.visualStyle,
      colorTone:    body.colorTone    ?? oldMem.visual?.colorTone,
      moodTone:     body.moodTone     ?? oldMem.visual?.moodTone,
      primaryColor: body.primaryColor ?? oldMem.visual?.primaryColor ?? '#2563EB',
      brandTagline: body.brandTagline ?? oldMem.visual?.brandTagline,
    },
    voice: {
      ...oldMem.voice,
      tone:          body.tone          ?? oldMem.voice?.tone,
      language:      body.language      ?? oldMem.voice?.language,
      emoji:         body.emoji         ?? oldMem.voice?.emoji,
      ctaStyle:      body.ctaStyle      ?? oldMem.voice?.ctaStyle,
      brandKeywords: body.brandKeywords ?? oldMem.voice?.brandKeywords,
      avoidWords:    body.avoidWords    ?? oldMem.voice?.avoidWords,
      competitors:   body.competitors   ?? oldMem.voice?.competitors,
    },
  }

  // Rebuild flat settings (same data, flat structure for easy API access)
  const newSettings = {
    ...oldS,
    storeName:        newMem.identity.storeName,
    ownerName:        newMem.identity.ownerName,
    whatsapp:         newMem.identity.whatsapp,
    sellerType:       newMem.identity.sellerType,
    businessScale:    newMem.identity.businessScale,
    experience:       newMem.identity.experience,
    niche:            newMem.product.niche,
    subNiche:         newMem.product.subNiche,
    productType:      newMem.product.productType,
    productCount:     newMem.product.productCount,
    priceRange:       newMem.product.priceRange,
    targetAudience:   newMem.product.targetAudience,
    mainGoals:        newMem.product.mainGoals,
    usp:              newMem.product.usp,
    platforms:        newMem.platform.platforms,
    primaryPlatform:  newMem.platform.primaryPlatform,
    contentTypes:     newMem.platform.contentTypes,
    contentWeight:    newMem.platform.contentWeight,
    postingFrequency: newMem.platform.postingFrequency,
    painPoints:       newMem.platform.painPoints,
    visualStyle:      newMem.visual.visualStyle,
    colorTone:        newMem.visual.colorTone,
    moodTone:         newMem.visual.moodTone,
    primaryColor:     newMem.visual.primaryColor,
    brandTagline:     newMem.visual.brandTagline,
    defaultTone:      newMem.voice.tone,
    defaultLanguage:  newMem.voice.language,
    defaultEmoji:     newMem.voice.emoji,
    defaultCtaStyle:  newMem.voice.ctaStyle,
    brandKeywords:    newMem.voice.brandKeywords,
    avoidWords:       newMem.voice.avoidWords,
    competitors:      newMem.voice.competitors,
  }

  // Update tenant
  await (admin.from('tenants') as any).update({
    name:     body.storeName ?? oldMem.identity?.storeName,
    settings: newSettings,
    ai_memory: newMem,
    ...(body.niche && { niche: body.niche }),
    ...(body.sellerType && { seller_type: body.sellerType }),
    ...(body.primaryPlatform && { primary_platform: body.primaryPlatform }),
  }).eq('id', dbUser.tenant_id)

  // Update user name
  if (body.ownerName || body.name) {
    await (admin.from('users') as any).update({
      name: body.ownerName ?? body.name,
    }).eq('id', user.id)
  }

  return NextResponse.json({ success: true, message: 'Profil berhasil disimpan' })
}