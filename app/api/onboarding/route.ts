// apps/web-app/app/api/onboarding/route.ts
import { NextResponse } from 'next/server'
import { z }            from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db }           from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STEPS = [
  { key: 'step_profile',   label: 'Lengkapi profil',          desc: 'Isi nama toko dan tipe seller', href: '/settings' },
  { key: 'step_brand_kit', label: 'Buat Brand Kit',           desc: 'Warna, font, dan tone brand',   href: '/settings/brand-kit' },
  { key: 'step_first_gen', label: 'Generate caption pertama', desc: 'Coba AI caption generator',     href: '/content/new' },
  { key: 'step_library',   label: 'Lihat Content Library',    desc: 'Kelola semua konten kamu',      href: '/library' },
  { key: 'step_template',  label: 'Pakai template editor',    desc: 'Buat gambar produk visual',     href: '/editor' },
]

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      tenant_id: true,
      name: true,
      tenants: {
        select: {
          plan: true,
          name: true,
        },
      },
    },
  })
  return dbUser ? { userId: user.id, tenant_id: dbUser.tenant_id } : null
}

// ── GET: progress ────────────────────────────────────────────
export async function GET() {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ensure row exists
  await db.$executeRaw`
    INSERT INTO onboarding_progress (tenant_id)
    VALUES (${me.tenant_id}::uuid)
    ON CONFLICT (tenant_id) DO NOTHING
  `

  const rows = await db.$queryRaw<any[]>`
    SELECT * FROM onboarding_progress
    WHERE tenant_id = ${me.tenant_id}::uuid
    LIMIT 1
  `

  const progress = rows[0] ?? {}

  const steps = STEPS.map(s => ({
    ...s,
    done:   Boolean(progress[s.key]),
    doneAt: progress[s.key + '_at'] ?? null,
  }))

  const completedCount = steps.filter(s => s.done).length

  return NextResponse.json({
    steps,
    completedCount,
    totalSteps:  STEPS.length,
    allDone:     completedCount === STEPS.length,
    completedAt: progress.completed_at ?? null,
  })
}

// ── POST: mark step complete ──────────────────────────────────
const StepSchema = z.object({
  step: z.enum(['step_profile', 'step_brand_kit', 'step_first_gen', 'step_library', 'step_template']),
})

export async function POST(req: Request) {
  const me = await auth()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = StepSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const step = parsed.data.step

  // Ensure row exists
  await db.$executeRaw`
    INSERT INTO onboarding_progress (tenant_id)
    VALUES (${me.tenant_id}::uuid)
    ON CONFLICT (tenant_id) DO NOTHING
  `

  // Update the specific step — each branch is a separate raw query
  // (Prisma.join di dalam template literal menyebabkan syntax error TS)
  if (step === 'step_profile') {
    await db.$executeRaw`
      UPDATE onboarding_progress
      SET step_profile = TRUE, profile_at = NOW()
      WHERE tenant_id = ${me.tenant_id}::uuid
    `
  } else if (step === 'step_brand_kit') {
    await db.$executeRaw`
      UPDATE onboarding_progress
      SET step_brand_kit = TRUE, brand_kit_at = NOW()
      WHERE tenant_id = ${me.tenant_id}::uuid
    `
  } else if (step === 'step_first_gen') {
    await db.$executeRaw`
      UPDATE onboarding_progress
      SET step_first_gen = TRUE, first_gen_at = NOW()
      WHERE tenant_id = ${me.tenant_id}::uuid
    `
  } else if (step === 'step_library') {
    await db.$executeRaw`
      UPDATE onboarding_progress
      SET step_library = TRUE, library_at = NOW()
      WHERE tenant_id = ${me.tenant_id}::uuid
    `
  } else if (step === 'step_template') {
    await db.$executeRaw`
      UPDATE onboarding_progress
      SET step_template = TRUE, template_at = NOW()
      WHERE tenant_id = ${me.tenant_id}::uuid
    `
  }

  // Check if all 5 steps done → set completed_at
  const rows = await db.$queryRaw<any[]>`
    SELECT step_profile, step_brand_kit, step_first_gen, step_library, step_template, completed_at
    FROM onboarding_progress
    WHERE tenant_id = ${me.tenant_id}::uuid
    LIMIT 1
  `

  const prog = rows[0]
  if (
    prog &&
    prog.step_profile &&
    prog.step_brand_kit &&
    prog.step_first_gen &&
    prog.step_library &&
    prog.step_template &&
    !prog.completed_at
  ) {
    await db.$executeRaw`
      UPDATE onboarding_progress
      SET completed_at = NOW()
      WHERE tenant_id = ${me.tenant_id}::uuid
    `
  }

  return NextResponse.json({ success: true, step })
}