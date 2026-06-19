// app/api/settings/profile/route.ts
// ══════════════════════════════════════════════════════════════
// SETTINGS PROFILE API
// ══════════════════════════════════════════════════════════════
//
// GET  /api/settings/profile
//   → Baca semua data dari: users, profiles, tenants, brand_kits,
//     platform_connections, ai_memory
//   → Gabungkan jadi satu objek flat untuk UI
//
// PATCH /api/settings/profile
//   → Terima patch object (hanya field yang berubah)
//   → Update ke tabel yang tepat berdasarkan field-to-table mapping
//   → Sync kembali ke AI Memory (ai_memory table)
//   → Emit promoting copy hints untuk response

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ── Field → table mapping ─────────────────────────────────────
// Menentukan field mana disimpan ke tabel mana
const FIELD_MAP: Record<string, {
  table:   string
  col:     string
  idField: 'user_id' | 'tenant_id' | 'id'
}> = {
  // ── profiles / users ──────────────────────────────────────
  storeName:    { table:'profiles', col:'store_name',    idField:'id' },
  ownerName:    { table:'profiles', col:'owner_name',    idField:'id' },
  whatsapp:     { table:'profiles', col:'whatsapp',      idField:'id' },
  bio:          { table:'profiles', col:'bio',           idField:'id' },
  avatarUrl:    { table:'profiles', col:'avatar_url',    idField:'id' },
  sellerType:   { table:'profiles', col:'seller_type',   idField:'id' },
  businessScale:{ table:'profiles', col:'business_scale',idField:'id' },
  experience:   { table:'profiles', col:'experience',    idField:'id' },
  // ── tenants (niche, product) ───────────────────────────────
  niche:        { table:'tenants', col:'niche',          idField:'user_id' },
  subNiche:     { table:'tenants', col:'sub_niche',      idField:'user_id' },
  productType:  { table:'tenants', col:'product_type',   idField:'user_id' },
  priceRange:   { table:'tenants', col:'price_range',    idField:'user_id' },
  usp:          { table:'tenants', col:'usp',            idField:'user_id' },
  targetAudience:{ table:'tenants', col:'target_audience',idField:'user_id' },
  mainGoals:    { table:'tenants', col:'main_goals',     idField:'user_id' },
  // ── brand_kits ────────────────────────────────────────────
  visualStyle:  { table:'brand_kits', col:'visual_style',    idField:'tenant_id' },
  colorTone:    { table:'brand_kits', col:'color_tone',      idField:'tenant_id' },
  moodTone:     { table:'brand_kits', col:'mood_tone',       idField:'tenant_id' },
  primaryColor: { table:'brand_kits', col:'primary_color',   idField:'tenant_id' },
  brandTagline: { table:'brand_kits', col:'brand_tagline',   idField:'tenant_id' },
  logoUrl:      { table:'brand_kits', col:'logo_url',        idField:'tenant_id' },
  // ── ai_memory (voice / brand voice) ──────────────────────
  tone:         { table:'ai_memory', col:'tone',             idField:'user_id' },
  language:     { table:'ai_memory', col:'language',         idField:'user_id' },
  emoji:        { table:'ai_memory', col:'emoji_style',      idField:'user_id' },
  ctaStyle:     { table:'ai_memory', col:'cta_style',        idField:'user_id' },
  brandKeywords:{ table:'ai_memory', col:'brand_keywords',   idField:'user_id' },
  avoidWords:   { table:'ai_memory', col:'avoid_words',      idField:'user_id' },
  competitors:  { table:'ai_memory', col:'competitors',      idField:'user_id' },
  // ── Platform: handled separately (pivot table) ────────────
  // platforms, primaryPlatform, postingFrequency, contentTypes
  // ── Notifications: stored in profiles ────────────────────
  notifEmail:    { table:'profiles', col:'notif_email',    idField:'id' },
  notifWhatsapp: { table:'profiles', col:'notif_whatsapp', idField:'id' },
  notifQuota:    { table:'profiles', col:'notif_quota',    idField:'id' },
  notifPlan:     { table:'profiles', col:'notif_plan',     idField:'id' },
}

// Platform fields — handled as pivot
const PLATFORM_FIELDS = new Set(['platforms','primaryPlatform','postingFrequency','contentTypes'])

// ── GET — load all settings ────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    // Parallel fetch all tables
    const [
      profileRes,
      tenantRes,
      brandKitRes,
      memoryRes,
      platformRes,
    ] = await Promise.all([
      supabase.from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabase.from('tenants')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase.from('brand_kits')
        .select('*')
        .eq('tenant_id', user.id)
        .maybeSingle(),
      supabase.from('ai_memory')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('platform_connections')
        .select('platform, is_primary, posting_frequency, content_types')
        .eq('tenant_id', user.id),
    ])

    const profile  = profileRes.data  ?? {}
    const tenant   = tenantRes.data   ?? {}
    const brandKit = brandKitRes.data ?? {}
    const memory   = memoryRes.data   ?? {}
    const platRows = platformRes.data ?? []

    // Build flat settings object for UI
    const data = {
      // Identity
      email:         user.email,
      storeName:     profile.store_name     ?? tenant.name,
      ownerName:     profile.owner_name,
      whatsapp:      profile.whatsapp,
      bio:           profile.bio,
      avatarUrl:     profile.avatar_url,
      sellerType:    profile.seller_type    ?? tenant.seller_type,
      businessScale: profile.business_scale,
      experience:    profile.experience,
      plan:          profile.plan ?? 'starter',
      memberSince:   user.created_at,
      name:          profile.display_name   ?? profile.owner_name,

      // Product / Niche (from tenants)
      niche:         tenant.niche,
      subNiche:      tenant.sub_niche,
      productType:   tenant.product_type,
      priceRange:    tenant.price_range,
      usp:           tenant.usp,
      targetAudience:tenant.target_audience ?? [],
      mainGoals:     tenant.main_goals      ?? [],

      // Platform (from platform_connections)
      platforms:         platRows.map((p: any) => p.platform),
      primaryPlatform:   platRows.find((p: any) => p.is_primary)?.platform ?? null,
      postingFrequency:  platRows[0]?.posting_frequency ?? null,
      contentTypes:      platRows[0]?.content_types     ?? [],

      // Visual (from brand_kits)
      visualStyle:  brandKit.visual_style,
      colorTone:    brandKit.color_tone,
      moodTone:     brandKit.mood_tone,
      primaryColor: brandKit.primary_color  ?? '#F59E0B',
      brandTagline: brandKit.brand_tagline,
      logoUrl:      brandKit.logo_url,

      // Voice (from ai_memory)
      tone:          memory.tone,
      language:      memory.language,
      emoji:         memory.emoji_style,
      ctaStyle:      memory.cta_style,
      brandKeywords: memory.brand_keywords ?? [],
      avoidWords:    memory.avoid_words    ?? [],
      competitors:   memory.competitors    ?? [],

      // Notifications (from profiles)
      notifEmail:    profile.notif_email    ?? true,
      notifWhatsapp: profile.notif_whatsapp ?? false,
      notifQuota:    profile.notif_quota    ?? true,
      notifPlan:     profile.notif_plan     ?? true,
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[settings/profile GET]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status:500 })
  }
}

// ── PATCH — save section patch ─────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const patch = await req.json() as Record<string, unknown>
    if (!patch || typeof patch !== 'object') {
      return NextResponse.json({ error:'Body harus JSON object' }, { status:400 })
    }

    // ── Group fields by destination table ─────────────────────
    const profilePatch:  Record<string,unknown> = {}
    const tenantPatch:   Record<string,unknown> = {}
    const brandKitPatch: Record<string,unknown> = {}
    const memoryPatch:   Record<string,unknown> = {}
    const platformPatch: Record<string,unknown> = {}
    const unhandled:     string[]               = []

    for (const [field, value] of Object.entries(patch)) {
      if (PLATFORM_FIELDS.has(field)) {
        platformPatch[field] = value
        continue
      }
      const mapping = FIELD_MAP[field]
      if (!mapping) { unhandled.push(field); continue }

      switch (mapping.table) {
        case 'profiles':  profilePatch[mapping.col]  = value; break
        case 'tenants':   tenantPatch[mapping.col]   = value; break
        case 'brand_kits':brandKitPatch[mapping.col] = value; break
        case 'ai_memory': memoryPatch[mapping.col]   = value; break
      }
    }

    // ── Execute updates ───────────────────────────────────────
    const ops: Promise<any>[] = []

    if (Object.keys(profilePatch).length > 0) {
      ops.push(
        supabase.from('profiles')
          .update({ ...profilePatch, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .then(({ error }) => { if (error) throw new Error(`profiles: ${error.message}`) })
      )
    }

    if (Object.keys(tenantPatch).length > 0) {
      ops.push(
        supabase.from('tenants')
          .update({ ...tenantPatch, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .then(({ error }) => { if (error) throw new Error(`tenants: ${error.message}`) })
      )
    }

    if (Object.keys(brandKitPatch).length > 0) {
      ops.push(
        supabase.from('brand_kits')
          .upsert(
            { ...brandKitPatch, tenant_id: user.id, updated_at: new Date().toISOString() },
            { onConflict: 'tenant_id' }
          )
          .then(({ error }) => { if (error) throw new Error(`brand_kits: ${error.message}`) })
      )
    }

    if (Object.keys(memoryPatch).length > 0) {
      ops.push(
        supabase.from('ai_memory')
          .upsert(
            { ...memoryPatch, user_id: user.id, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
          .then(({ error }) => { if (error) throw new Error(`ai_memory: ${error.message}`) })
      )
    }

    // ── Platform connections (pivot table) ────────────────────
    if (Object.keys(platformPatch).length > 0) {
      const { platforms, primaryPlatform, postingFrequency, contentTypes } = platformPatch as {
        platforms?:        string[]
        primaryPlatform?:  string
        postingFrequency?: string
        contentTypes?:     string[]
      }

      if (platforms !== undefined) {
        // Delete all → re-insert (simple, safe approach)
        ops.push(
          supabase.from('platform_connections')
            .delete()
            .eq('tenant_id', user.id)
            .then(() =>
              supabase.from('platform_connections').insert(
                (platforms ?? []).map(p => ({
                  tenant_id:         user.id,
                  platform:          p,
                  is_primary:        p === (primaryPlatform ?? platforms?.[0]),
                  posting_frequency: postingFrequency ?? null,
                  content_types:     contentTypes     ?? [],
                  status:            'active',
                  updated_at:        new Date().toISOString(),
                }))
              )
            )
            .then(({ error }) => { if (error) throw new Error(`platform_connections: ${error.message}`) })
        )
      } else {
        // Only update posting_frequency / content_types / primary without re-inserting
        if (primaryPlatform) {
          // Reset all is_primary, then set new one
          ops.push(
            supabase.from('platform_connections')
              .update({ is_primary: false })
              .eq('tenant_id', user.id)
              .then(() =>
                supabase.from('platform_connections')
                  .update({ is_primary: true })
                  .eq('tenant_id', user.id)
                  .eq('platform', primaryPlatform)
              )
          )
        }
        if (postingFrequency !== undefined || contentTypes !== undefined) {
          const upd: Record<string,unknown> = {}
          if (postingFrequency !== undefined) upd.posting_frequency = postingFrequency
          if (contentTypes     !== undefined) upd.content_types     = contentTypes
          ops.push(
            supabase.from('platform_connections')
              .update(upd)
              .eq('tenant_id', user.id)
          )
        }
      }
    }

    // ── Sync to AI Memory (comprehensive) ─────────────────────
    // Build full AI context record from patch for ai_memory
    const aiContextPatch: Record<string,unknown> = {}

    // Identity fields that affect AI Memory
    if (patch.storeName)      aiContextPatch.store_name      = patch.storeName
    if (patch.sellerType)     aiContextPatch.seller_type     = patch.sellerType
    if (patch.niche)          aiContextPatch.niche           = patch.niche
    if (patch.subNiche)       aiContextPatch.sub_niche       = patch.subNiche
    if (patch.usp)            aiContextPatch.usp             = patch.usp
    if (patch.targetAudience) aiContextPatch.target_audience = patch.targetAudience
    if (patch.visualStyle)    aiContextPatch.visual_style    = patch.visualStyle
    if (patch.colorTone)      aiContextPatch.color_tone      = patch.colorTone
    if (patch.brandTagline)   aiContextPatch.brand_tagline   = patch.brandTagline
    if (patch.platforms)      aiContextPatch.platforms       = patch.platforms
    if (patch.tone)           aiContextPatch.tone            = patch.tone
    if (patch.language)       aiContextPatch.language        = patch.language

    if (Object.keys(aiContextPatch).length > 0) {
      ops.push(
        supabase.from('ai_memory')
          .upsert(
            { ...aiContextPatch, user_id: user.id, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
      )
    }

    // ── Run all operations ─────────────────────────────────────
    await Promise.all(ops)

    // ── Build promoting hints based on what was saved ──────────
    const hints = buildPromotingHints(patch)

    if (unhandled.length > 0) {
      console.warn('[settings/profile PATCH] Unhandled fields:', unhandled)
    }

    return NextResponse.json({
      success:  true,
      message:  'Pengaturan berhasil disimpan dan AI Memory diperbarui.',
      hints,
      unhandled: unhandled.length > 0 ? unhandled : undefined,
    })
  } catch (err: any) {
    console.error('[settings/profile PATCH]', err)
    return NextResponse.json({ error: err?.message ?? 'Gagal menyimpan. Coba lagi.' }, { status:500 })
  }
}

// ── Promoting hints generator ─────────────────────────────────
// Contextual copy shown to user after saving specific fields
function buildPromotingHints(patch: Record<string, unknown>): string[] {
  const hints: string[] = []

  if (patch.niche || patch.subNiche) {
    hints.push('🎯 AI sekarang tahu niche kamu — caption dan hook akan lebih spesifik dan relevan untuk target market-mu!')
  }
  if (patch.visualStyle || patch.colorTone) {
    hints.push('🎨 Gaya visual tersimpan — AI Enhancer & Packshot akan generate foto yang konsisten dengan brand identity-mu.')
  }
  if (patch.tone || patch.language) {
    hints.push('🗣️ Tone & bahasa disimpan — semua caption, hook, dan script video akan otomatis pakai gaya bicara brand kamu.')
  }
  if (patch.platforms) {
    const pList = Array.isArray(patch.platforms)
      ? (patch.platforms as string[]).join(', ')
      : String(patch.platforms)
    hints.push(`📱 Platform ${pList} aktif — AI sekarang bisa buat caption yang spesifik untuk format tiap platform.`)
  }
  if (patch.usp) {
    hints.push('⭐ USP tersimpan — AI akan selalu highlight keunggulan unik produkmu di setiap konten yang dibuat.')
  }
  if (patch.brandKeywords) {
    hints.push('🔑 Kata kunci brand tersimpan — AI akan naturally menyisipkan kata-kata ini di setiap caption dan hook.')
  }
  if (patch.targetAudience) {
    hints.push('👥 Target audience tersimpan — hook dan pain point akan otomatis disesuaikan dengan demografi audiensmu.')
  }
  if (patch.storeName) {
    hints.push('🏪 Nama toko tersimpan — konten AI akan menyebut nama brand kamu secara natural dan konsisten.')
  }
  if (patch.primaryColor) {
    hints.push('🌈 Warna brand tersimpan — AI Visual akan maintain konsistensi palet di semua output gambar.')
  }
  if (patch.competitors) {
    hints.push('🎯 Kompetitor tersimpan — AI akan otomatis hindari positioning yang sama dan temukan angle diferensiasi unikmu.')
  }

  return hints
}