// apps/web-app/app/api/image/upscale/route.ts
// POST /api/image/upscale — upscale image 2x or 4x via Real-ESRGAN

import { NextResponse } from 'next/server'
import { z }            from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db }           from '@/lib/db'
import { upscaleImage } from '@/lib/providers/image-provider'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const Schema = z.object({
  resultId:  z.string().uuid(),
  imageUrl:  z.string().url(),
  scale:     z.union([z.literal(2), z.literal(4)]).default(4),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'UNAUTHORIZED' }, { status:401 })

  const body = await req.json().catch(() => ({}))
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error:'VALIDATION_ERROR', details:parsed.error.issues }, { status:400 })

  const d = parsed.data

  // Check upscale quota
  const dbUser = await db.user.findUnique({
    where:  { id:user.id },
    select: { tenantId:true, tenant:{ select:{ upscaleCreditUsed:true, upscaleCreditMax:true } } },
  })
  if (!dbUser) return NextResponse.json({ error:'NOT_FOUND' }, { status:404 })

  const used = dbUser.tenant.upscaleCreditUsed ?? 0
  const max  = dbUser.tenant.upscaleCreditMax  ?? 0

  if (max === 0) {
    return NextResponse.json({
      error:'UPSCALE_NOT_AVAILABLE',
      message:'Fitur upscale tidak tersedia di plan kamu. Upgrade ke Basic atau lebih tinggi.',
    }, { status:403 })
  }

  if (used >= max) {
    return NextResponse.json({
      error:'UPSCALE_QUOTA_EXCEEDED',
      message:`Kuota upscale habis (${used}/${max}). Reset bulan depan atau upgrade plan.`,
    }, { status:429 })
  }

  try {
    // Deduct credit
    await db.$executeRaw`
      UPDATE tenants SET upscale_credits_used = upscale_credits_used + 1 WHERE id = ${dbUser.tenantId}::uuid
    `

    // Run upscale
    const upscaledUrl = await upscaleImage(d.imageUrl, d.scale as 2|4)

    // Save upscaled URL
    await db.$executeRaw`
      UPDATE image_results
      SET is_upscaled = true, upscaled_url = ${upscaledUrl}, upscale_factor = ${d.scale}
      WHERE id = ${d.resultId}::uuid
    `

    return NextResponse.json({ success:true, upscaledUrl, scale:d.scale })

  } catch (err: any) {
    // Refund
    await db.$executeRaw`
      UPDATE tenants SET upscale_credits_used = GREATEST(0, upscale_credits_used - 1) WHERE id = ${dbUser.tenantId}::uuid
    `.catch(() => {})

    return NextResponse.json({ error:'UPSCALE_FAILED', message:err?.message }, { status:500 })
  }
}