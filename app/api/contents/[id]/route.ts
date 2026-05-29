// apps/web-app/app/api/contents/[id]/route.ts
// GET    /api/contents/[id]  → detail
// PATCH  /api/contents/[id]  → update (caption, hashtags, variants, title, etc)
// DELETE /api/contents/[id]  → soft delete
//
// v2: PATCH support captionVariants struct full (untuk edit-in-place)
import { createClient } from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import {
  getContent,
  updateContent,
  deleteContent,
  ContentNotFoundError,
} from '@/lib/content/content-service'
import { z }             from 'zod'
import { NextResponse }  from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function authenticate() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

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

  if (!dbUser) return null

  return {
    userId: user.id,
    tenant_id: null,
    role: dbUser.role,
  }
}

// ── GET: detail ─────────────────────────────────────────────
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticate()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const content = await getContent(id, auth.tenant_id ?? '')
    if (!content) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: content })

  } catch (err: any) {
    console.error('[GET /api/contents/[id]]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── PATCH: update ───────────────────────────────────────────
// v2: support captionVariants struct full
const VariantSchema = z.object({
  caption:  z.string(),
  hashtags: z.array(z.string()).max(30),
  cta:      z.string(),
  // Optional metadata
  platform:       z.string().optional(),
  tone:           z.string().optional(),
  language:       z.string().optional(),
  characterCount: z.number().optional(),
  variantIndex:   z.number().optional(),
})

const UpdateSchema = z.object({
  caption_text:     z.string().max(5000).optional(),
  captionVariants: z.array(VariantSchema).max(5).optional(),
  hashtags:        z.array(z.string()).max(30).optional(),
  title:           z.string().max(200).optional(),
  tags:            z.array(z.string()).max(20).optional(),
  folderId:        z.string().uuid().nullable().optional(),
  isStarred:       z.boolean().optional(),
}).strict()

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticate()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const body   = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.issues },
        { status: 400 },
      )
    }

    const data = parsed.data

    // ── Custom logic: kalau update captionVariants, sync field lain ──
    // caption_text = variant[0].caption (untuk preview di list)
    // hashtags top-level = variant[0].hashtags
    if (data.captionVariants && data.captionVariants.length > 0) {
      const v0 = data.captionVariants[0]

      // Smart sync: kalau client tidak kasih caption_text/hashtags eksplisit,
      // pakai dari variant 1
      if (data.caption_text === undefined) {
        data.caption_text = v0.caption
      }
      if (data.hashtags === undefined) {
        data.hashtags = v0.hashtags
      }

      // Save variants ke DB pakai raw Prisma (karena content-service belum support variants)
      const existing = await db.content.findFirst({
        where: {
        id,
        tenant_id: auth.tenant_id ?? '',
        deleted_at: null
      },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      // Status downgrade: published → ready saat edit
      const newStatus = existing.status === 'published' ? 'ready' : existing.status

      const updated = await db.content.update({
        where: { id },
        data: {
          caption_text:     data.caption_text,
          captionVariants: data.captionVariants as any,
          hashtags:        data.hashtags ?? [],
          ...(data.title    !== undefined && { title: data.title }),
          ...(data.tags     !== undefined && { tags: data.tags }),
          ...(data.folderId !== undefined && { folderId: data.folderId }),
          ...(data.isStarred !== undefined && { isStarred: data.isStarred }),
          status:          newStatus,
        },
      })

      return NextResponse.json({ success: true, data: updated })
    }

    // ── Default flow: pakai content-service (untuk update simple) ──
    const updated = await updateContent({
      contentId: id,
      tenant_id:  '',
      userId:    auth.userId,
      caption_text: data.caption_text,
      hashtags:    data.hashtags,
      title:       data.title,
      tags:        data.tags,
      folderId:    data.folderId,
      isStarred:   data.isStarred,
    })

    return NextResponse.json({ success: true, data: updated })

  } catch (err: any) {
    if (err instanceof ContentNotFoundError) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[PATCH /api/contents/[id]]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── DELETE: soft delete ─────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticate()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    await deleteContent(id, auth.tenant_id ?? '')

    return NextResponse.json({ success: true })

  } catch (err: any) {
    if (err instanceof ContentNotFoundError) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[DELETE /api/contents/[id]]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}