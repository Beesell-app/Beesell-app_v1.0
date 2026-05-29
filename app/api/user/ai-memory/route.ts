// apps/web-app/app/api/user/ai-memory/route.ts
// GET /api/user/ai-memory
// Kembalikan semua AI memory dari onboarding untuk pre-fill caption generator

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }           from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await db.user.findUnique({
      where:  { id: user.id },
      select: {
        name: true, email: true,
        tenant: {
          select: {
            id: true, name: true, plan: true,
            aiMemory: true, settings: true,
            quotaContentUsed: true, quotaContentMax: true,
          },
        },
      },
    })

    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const mem = (dbUser.tenant.aiMemory as any) ?? {}
    const s   = (dbUser.tenant.settings  as any) ?? {}

    // Flatten memory untuk easy access di frontend
    return NextResponse.json({
      // Identity
      storeName:      dbUser.tenant.name,
      sellerType:     mem.identity?.sellerType  ?? s.sellerType,
      experience:     mem.identity?.experience  ?? s.experience,
      businessScale:  mem.identity?.businessScale ?? s.businessScale,
      // Product context
      niche:          mem.product?.niche        ?? s.niche,
      subNiche:       mem.product?.subNiche     ?? s.subNiche,
      productType:    mem.product?.productType  ?? s.productType,
      productCount:   mem.product?.productCount ?? s.productCount,
      targetAudience: mem.product?.targetAudience ?? s.targetAudience ?? [],
      mainGoals:      mem.product?.mainGoals    ?? s.mainGoals ?? [],
      usp:            mem.product?.usp          ?? s.usp,
      // Platform
      primaryPlatform:mem.platform?.primaryPlatform ?? s.primaryPlatform,
      platforms:      mem.platform?.platforms   ?? s.platforms ?? [],
      contentTypes:   mem.platform?.contentTypes ?? s.contentTypes ?? [],
      postingFrequency:mem.platform?.postingFrequency ?? s.postingFrequency,
      // Visual
      visualStyle:    mem.visual?.visualStyle   ?? s.visualStyle,
      colorTone:      mem.visual?.colorTone     ?? s.colorTone,
      moodTone:       mem.visual?.moodTone      ?? s.moodTone,
      primaryColor:   mem.visual?.primaryColor  ?? s.primaryColor ?? '#2563EB',
      brandTagline:   mem.visual?.brandTagline  ?? s.brandTagline,
      // Voice (most important for caption)
      tone:           mem.voice?.tone           ?? s.defaultTone     ?? 'casual',
      language:       mem.voice?.language       ?? s.defaultLanguage ?? 'indonesian-casual',
      emoji:          mem.voice?.emoji          ?? s.defaultEmoji    ?? 'moderate',
      ctaStyle:       mem.voice?.ctaStyle       ?? s.defaultCtaStyle ?? 'medium',
      brandKeywords:  mem.voice?.brandKeywords  ?? s.brandKeywords,
      avoidWords:     mem.voice?.avoidWords     ?? s.avoidWords,
      // Plan & quota
      plan:           dbUser.tenant.plan,
      quotaUsed:      dbUser.tenant.quotaContentUsed ?? 0,
      quotaMax:       dbUser.tenant.quotaContentMax  ?? 50,
    })
  } catch (err: any) {
    console.error('[GET /api/user/ai-memory]', err?.message)
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}