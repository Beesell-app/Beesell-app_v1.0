// apps/web-app/app/api/contents/route.ts
// GET  /api/contents           → list dengan filter
// POST /api/contents           → create draft manual
import { createClient } from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import {
  createDraft,
  listContents,
  InvalidTransitionError,
  ContentNotFoundError,
} from '@/lib/content/content-service'
import { z }             from 'zod'
import { NextResponse }  from 'next/server'
import type { ContentStatus, ContentType } from '@/lib/types/content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── GET: list dengan filter ─────────────────────────────────
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Parse query params
    const url = new URL(req.url)

    const statusParam = url.searchParams.get('status')
    const status = statusParam
      ? (statusParam.includes(',')
          ? statusParam.split(',') as ContentStatus[]
          : statusParam as ContentStatus)
      : undefined

    const result = await listContents({
      tenant_id:  dbUser.tenant_id,
      status,
      type:      (url.searchParams.get('type') ?? undefined) as ContentType | undefined,
      folderId:  url.searchParams.get('folderId') ?? undefined,
      search:    url.searchParams.get('search') ?? undefined,
      isStarred: url.searchParams.get('starred') === 'true' ? true : undefined,
      limit:     Number(url.searchParams.get('limit')) || 20,
      cursor:    url.searchParams.get('cursor') ?? undefined,
      orderBy:   (url.searchParams.get('orderBy') as 'created' | 'updated') ?? 'created',
    })

    return NextResponse.json({ success: true, ...result })

  } catch (err: any) {
    console.error('[GET /api/contents]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── POST: create draft ──────────────────────────────────────
const CreateSchema = z.object({
  type: z.enum(['caption', 'image', 'video', 'carousel', 'thread', 'ad_copy']),
  title: z.string().max(200).optional(),
  productUrl: z.string().url().optional(),

  // ✅ FIX ZOD
  productData: z.record(z.string(), z.any()).optional(),
  generationConfig: z.record(z.string(), z.any()).optional(),

  brandKitId: z.string().uuid().optional(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await db.user.findUnique({
      where:  { id: user.id },
      select: { tenant_id: true },
    })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.issues },
        { status: 400 },
      )
    }

    const content = await createDraft({
      tenant_id: dbUser.tenant_id,
      userId: user.id,

      // ✅ wajib
      type: parsed.data.type as ContentType,

      // ✅ optional (sesuai service kamu)
      title: parsed.data.title,
      productUrl: parsed.data.productUrl,
      productData: parsed.data.productData,
      generationConfig: parsed.data.generationConfig,
      brandKitId: parsed.data.brandKitId,
    })

    return NextResponse.json({ success: true, data: content }, { status: 201 })

  } catch (err: any) {
    console.error('[POST /api/contents]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}