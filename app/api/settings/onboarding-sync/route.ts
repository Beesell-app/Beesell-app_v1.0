// app/api/settings/onboarding-sync/route.ts
// ══════════════════════════════════════════════════════════════
// ONBOARDING SYNC — Bridges Settings ↔ Onboarding Store
// ══════════════════════════════════════════════════════════════
//
// GET  /api/settings/onboarding-sync
//   → Returns data in onboarding store format (ProfilData, PlatformData, etc.)
//   → Used when user clicks "Ulang Onboarding" — pre-fills onboarding
//     with their existing settings so they don't start from zero
//
// POST /api/settings/onboarding-sync
//   → Called when onboarding completes (step 5 final submit)
//   → Writes ALL onboarding data to settings tables
//   → Same as /api/onboarding/complete but also updates ai_memory

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ── GET — export settings as onboarding format ─────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const [profileRes, tenantRes, brandKitRes, memoryRes, platformRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('tenants').select('*').eq('user_id', user.id).single(),
      supabase.from('brand_kits').select('*').eq('tenant_id', user.id).maybeSingle(),
      supabase.from('ai_memory').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('platform_connections').select('platform, is_primary, posting_frequency').eq('tenant_id', user.id),
    ])

    const p  = profileRes.data  ?? {}
    const t  = tenantRes.data   ?? {}
    const bk = brandKitRes.data ?? {}
    const m  = memoryRes.data   ?? {}
    const pl = platformRes.data ?? []

    // Map back to onboarding store format
    const onboardingData = {
      profil: {
        storeName:    p.store_name  ?? t.name ?? '',
        ownerName:    p.owner_name  ?? undefined,
        sellerType:   (p.seller_type ?? t.seller_type ?? 'seller') as any,
        niche:        t.niche ?? '',
        productCount: t.product_count ?? undefined,
      },
      platform: {
        platforms:        pl.map((r: any) => r.platform) as any,
        postingFrequency: pl[0]?.posting_frequency ?? undefined,
      },
      brandKit: {
        logoUrl:      bk.logo_url      ?? undefined,
        primaryColor: bk.primary_color ?? '#F59E0B',
        tone:         (m.tone          ?? 'casual') as any,
      },
      plan: {
        planId:       (p.plan ?? 'free') as any,
      },
      // firstContent is always fresh
      firstContent: null,
    }

    return NextResponse.json({ data: onboardingData })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status:500 })
  }
}

// ── POST — write onboarding data to all settings tables ────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const body = await req.json()
    const { profil, platform, brandKit, plan } = body

    const ops: PromiseLike<any>[] = []

    // ── 1. Profile / tenants ──────────────────────────────────
    if (profil) {
      ops.push(
        supabase
            .from('profiles')
            .update({
            store_name: profil.storeName,
            owner_name: profil.ownerName ?? null,
            seller_type: profil.sellerType ?? null,
            updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .then(r => r)
        )
      ops.push(
        supabase.from('tenants').update({
          name:          profil.storeName,
          niche:         profil.niche     ?? null,
          seller_type:   profil.sellerType ?? null,
          product_count: profil.productCount ?? null,
          updated_at:    new Date().toISOString(),
        }).eq('user_id', user.id)
      )
    }

    // ── 2. Platform connections ───────────────────────────────
    if (platform?.platforms?.length) {
      ops.push(
        supabase.from('platform_connections')
          .delete()
          .eq('tenant_id', user.id)
          .then(() =>
            supabase.from('platform_connections').insert(
              platform.platforms.map((p: string, i: number) => ({
                tenant_id:         user.id,
                platform:          p,
                is_primary:        i === 0,
                posting_frequency: platform.postingFrequency ?? null,
                status:            'active',
              }))
            )
          )
      )
    }

    // ── 3. Brand kit ──────────────────────────────────────────
    if (brandKit) {
      ops.push(
        supabase.from('brand_kits').upsert({
          tenant_id:     user.id,
          logo_url:      brandKit.logoUrl      ?? null,
          primary_color: brandKit.primaryColor ?? '#F59E0B',
          is_default:    true,
          updated_at:    new Date().toISOString(),
        }, { onConflict: 'tenant_id' })
      )
      // Tone goes to ai_memory
      if (brandKit.tone) {
        ops.push(
          supabase.from('ai_memory').upsert({
            user_id:    user.id,
            tone:       brandKit.tone,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        )
      }
    }

    // ── 4. AI Memory — full context from all steps ────────────
    const aiContext: Record<string, unknown> = { user_id: user.id }
    if (profil?.storeName)   aiContext.store_name   = profil.storeName
    if (profil?.sellerType)  aiContext.seller_type  = profil.sellerType
    if (profil?.niche)       aiContext.niche        = profil.niche
    if (platform?.platforms) aiContext.platforms    = platform.platforms
    if (brandKit?.tone)      aiContext.tone         = brandKit.tone
    if (brandKit?.primaryColor) aiContext.primary_color = brandKit.primaryColor
    aiContext.onboarding_synced_at = new Date().toISOString()
    aiContext.updated_at           = new Date().toISOString()

    ops.push(
      supabase.from('ai_memory').upsert(aiContext, { onConflict: 'user_id' })
    )

    // ── 5. Mark onboarding complete ───────────────────────────
    ops.push(
      supabase.from('profiles').update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
    )

    

    // Promoting copy hints based on what was set
    const hints: string[] = []
    if (profil?.niche) {
      hints.push(`🎯 AI Memory sudah mengenal niche "${profil.niche}" kamu — semua konten akan lebih relevan sekarang!`)
    }
    if (platform?.platforms?.length) {
      hints.push(`📱 ${platform.platforms.length} platform tersimpan — caption akan otomatis disesuaikan per platform.`)
    }
    if (brandKit?.tone) {
      hints.push(`🗣️ Tone "${brandKit.tone}" tersimpan — semua output AI akan pakai gaya bicara brand kamu.`)
    }

    return NextResponse.json({
      success: true,
      message: 'Profil bisnis & AI Memory berhasil diperbarui dari onboarding!',
      hints,
    })
  } catch (err: any) {
    console.error('[onboarding-sync POST]', err)
    return NextResponse.json({ error: err?.message ?? 'Sync gagal' }, { status:500 })
  }
}