// apps/web-app/app/api/brand-kits/route.ts
// GET /api/brand-kits  → list brand kits for tenant
// POST /api/brand-kits → create new kit
import { NextResponse }  from 'next/server'
import { z }             from 'zod'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: { tenant_id: true, role: true },
  })
  if (!dbUser) return null

  return { userId: user.id, tenant_id: dbUser.tenant_id, role: dbUser.role }
}

// ── GET ──────────────────────────────────────────────────────
export async function GET() {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const kits = await db.brandKit.findMany({
    where: {
      tenant_id:  me.tenant_id,
      deleted_at: null,
      isActive:  true,
    },
    orderBy: [
      { isDefault: 'desc' },
      { created_at: 'desc' },
    ],
  })

  return NextResponse.json({ success: true, data: kits })
}

// ── POST ─────────────────────────────────────────────────────
const CreateSchema = z.object({
  name:            z.string().min(1).max(100),
  description:     z.string().max(500).optional(),
  logoUrl:         z.string().url().optional().nullable(),
  logoStoragePath: z.string().optional().nullable(),
  primaryColor:    z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#2563EB'),
  secondaryColor:  z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1D4ED8'),
  accentColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFE600'),
  bgColor:         z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
  textColor:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0F172A'),
  primaryFont:     z.string().max(100).default('DM Sans'),
  secondaryFont:   z.string().max(100).default('Fraunces'),
  defaultTone:     z.enum(['casual','friendly','professional','energetic','luxury','playful','authoritative']).default('casual'),
  defaultLanguage: z.enum(['indonesian_casual','indonesian_formal','mixed_english','full_english']).default('indonesian_casual'),
  brandKeywords:   z.string().max(500).optional().nullable(),
  avoidWords:      z.string().max(500).optional().nullable(),
  isDefault:       z.boolean().default(false),
})

export async function POST(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  // Cek jumlah kit existing (max 5 per tenant)
  const existing = await db.brandKit.count({
    where: { tenant_id: me.tenant_id, deleted_at: null },
  })
  if (existing >= 5) {
    return NextResponse.json({ error: 'MAX_KITS', message: 'Maksimal 5 brand kit per akun.' }, { status: 422 })
  }

  const kit = await db.brandKit.create({
    data: {
      tenant_id: me.tenant_id,
      ...parsed.data,
    },
  })

  return NextResponse.json({ success: true, data: kit }, { status: 201 })
}