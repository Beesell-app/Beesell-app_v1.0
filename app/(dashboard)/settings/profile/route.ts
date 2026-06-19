// apps/web-app/app/api/settings/profile/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Field "AI Memory" disimpan di tenants.metadata (JSON). name→users, storeName→tenants.name.
const META_KEYS = [
  // identity
  'ownerName', 'whatsapp', 'bio', 'sellerType', 'businessScale', 'experience',
  // product
  'niche', 'subNiche', 'productType', 'priceRange', 'usp', 'targetAudience', 'mainGoals',
  // platform
  'platforms', 'primaryPlatform', 'postingFrequency', 'contentTypes',
  // visual
  'visualStyle', 'colorTone', 'moodTone', 'primaryColor', 'brandTagline',
  // voice
  'tone', 'language', 'emoji', 'ctaStyle', 'brandKeywords', 'avoidWords', 'competitors',
  // notif
  'notifEmail', 'notifWhatsapp', 'notifQuota', 'notifPlan',
] as const

// ── GET: baca profil lengkap (user + tenant + metadata) ─────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        tenant_id: true,
        tenants: { select: { name: true, plan: true, metadata: true } },
      },
    })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const meta = (dbUser.tenants?.metadata as Record<string, any> | null) ?? {}

    const data = {
      name:      dbUser.name ?? '',
      email:     dbUser.email ?? user.email ?? '',
      plan:      dbUser.tenants?.plan ?? 'starter',
      storeName: dbUser.tenants?.name ?? '',
      ...meta,                       // semua field AI Memory
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[GET /api/settings/profile]', err?.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── PATCH: simpan per-section (partial save) ────────────────────
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { tenant_id: true, tenants: { select: { metadata: true } } },
    })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // 1) name → users.name
    if (typeof body.name === 'string' && body.name.trim()) {
      await db.user.update({ where: { id: user.id }, data: { name: body.name.trim().slice(0, 60) } })
    }

    // 2) storeName → tenants.name ; META_KEYS → tenants.metadata (read-modify-write)
    const tenantData: Record<string, any> = {}
    if (typeof body.storeName === 'string' && body.storeName.trim()) {
      tenantData.name = body.storeName.trim().slice(0, 100)
    }

    const currentMeta = (dbUser.tenants?.metadata as Record<string, any> | null) ?? {}
    const metaPatch: Record<string, any> = {}
    for (const key of META_KEYS) {
      if (key in body && body[key] !== undefined) metaPatch[key] = body[key]
    }
    if (Object.keys(metaPatch).length > 0) {
      tenantData.metadata = { ...currentMeta, ...metaPatch } as any   // JSON ditulis utuh
    }

    if (Object.keys(tenantData).length > 0) {
      await db.tenant.update({ where: { id: dbUser.tenant_id }, data: tenantData })
    }

    // Hints kontekstual (opsional — tampil di UI setelah simpan)
    const merged = { ...currentMeta, ...metaPatch }
    const hints: string[] = []
    if (merged.niche && !merged.usp)
      hints.push('Tambahkan USP produk supaya caption AI lebih menonjolkan keunggulan brand-mu.')
    if ((merged.platforms?.length ?? 0) > 0 && !merged.primaryPlatform)
      hints.push('Pilih platform utama agar AI memprioritaskan format konten yang tepat.')

    return NextResponse.json({ success: true, hints })
  } catch (err: any) {
    console.error('[PATCH /api/settings/profile]', err?.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}