// apps/web-app/app/api/library/save/route.ts
// POST /api/library/save
// Save image (URL atau buffer) sebagai Content record di library
//
// Two modes:
//   1. URL mode  — kirim {media_url} (already in Supabase Storage, e.g. dari Replicate webhook)
//   2. Blob mode — multipart form-data dengan field "file" (untuk upload dari editor canvas)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { uploadBuffer }  from '@/lib/storage'
import { z }             from 'zod'
import { Ratelimit }     from '@upstash/ratelimit'
import { Redis }         from '@upstash/redis'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

// Rate limit: 30 save/menit (lebih longgar dari upload karena bisa save URL existing)
const rateLimiter = new Ratelimit({
  redis:   Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix:  'rl:library-save',
})

// ── Schema untuk URL mode (JSON) ────────────────────────────
const UrlSaveSchema = z.object({
  media_url:    z.string().url('media_url harus URL valid'),
  storagePath: z.string().optional(),  // kalau sudah tau path Supabase
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  tags:        z.array(z.string().max(30)).max(10).optional(),
  format:      z.enum(['png', 'jpg', 'jpeg', 'webp']).default('png'),
  sizeBytes:   z.number().int().min(0).optional(),
  width:       z.number().int().min(1).optional(),
  height:      z.number().int().min(1).optional(),
  contentId:   z.string().uuid().optional(),  // attach ke content existing (image gen)
  source:      z.enum(['template_editor', 'image_generator', 'upload', 'unknown']).default('unknown'),
  metadata:    z.record(z.string(), z.any()).optional(),  // canvas JSON, prompt, dll
})

async function authenticate() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: { tenant_id: true },
  })
  if (!dbUser) return null

  return { userId: user.id, tenant_id: dbUser.tenant_id }
}

// ══════════════════════════════════════════════════════════════
// POST — save to library
// ══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    // ── 1. Auth ─────────────────────────────────────────
    const auth = await authenticate()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Rate limit ───────────────────────────────────
    const { success: rlOk } = await rateLimiter.limit(auth.userId)
    if (!rlOk) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Terlalu banyak save. Tunggu 1 menit.' },
        { status: 429 },
      )
    }

    const contentType = req.headers.get('content-type') ?? ''

    // ── BRANCH A: Multipart (blob upload) ───────────────
    if (contentType.startsWith('multipart/form-data')) {
      return await handleBlobSave(req, auth)
    }

    // ── BRANCH B: JSON (URL mode) ───────────────────────
    return await handleUrlSave(req, auth)

  } catch (err: any) {
    console.error('[POST /api/library/save]', err)
    return NextResponse.json(
      { error: 'INTERNAL', message: err?.message ?? 'Terjadi kesalahan' },
      { status: 500 },
    )
  }
}

// ══════════════════════════════════════════════════════════════
// Handler: URL mode (image URL sudah ada di Supabase Storage)
// ══════════════════════════════════════════════════════════════
async function handleUrlSave(req: Request, auth: { userId: string; tenant_id: string }) {
  const raw    = await req.json()
  const parsed = UrlSaveSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Kalau attach ke contentId existing, update Content tersebut
  if (data.contentId) {
    const existing = await db.content.findFirst({
      where:  { id: data.contentId, tenant_id: auth.tenant_id },
      select: { id: true, media_url: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'CONTENT_NOT_FOUND' },
        { status: 404 },
      )
    }

    // Append image URL ke array existing (jaga kemungkinan multiple images per content)
    const updated = await db.content.update({
      where: { id: data.contentId },

      data: {
        media_url: data.media_url,

        ...(data.metadata && {
          generationConfig: {
            ...(existing as any).generationConfig,
            ...data.metadata,
          },
        }),
      },

      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        caption_text: true,
        media_url: true,
        thumbnail_url: true,
        primary_platform: true,
        created_at: true,
      },
    })

    return NextResponse.json({
      success: true,
      mode:    'attach',
      data:    {
        contentId: updated.id,
        media_url: updated.media_url,
      },
    })
  }

  // Create new Content record
  const content = await db.content.create({
    data: {
      tenant_id:    auth.tenant_id,
      userId:      auth.userId,
      type:        'image',
      status:      'ready',
      title:       data.title       ?? `Image ${new Date().toLocaleDateString('id-ID')}`,
      tags:        data.tags        ?? [],
      media_url:    data.media_url,
      productData: {} as any,
      generationConfig: (data.metadata ?? {}) as any,
      // caption_text optional untuk image-only content
      caption_text: data.description ?? null,
    } as any,
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      caption_text: true,
      media_url: true,
      thumbnail_url: true,
      primary_platform: true,
      created_at: true,
    },
  })

  return NextResponse.json({
    success: true,
    mode:    'create',
    data:    content,
  })
}

// ══════════════════════════════════════════════════════════════
// Handler: Blob mode (upload langsung dari frontend canvas)
// ══════════════════════════════════════════════════════════════
async function handleBlobSave(req: Request, auth: { userId: string; tenant_id: string }) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'INVALID_FORM' },
      { status: 400 },
    )
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'NO_FILE', message: 'File tidak ada di request' },
      { status: 400 },
    )
  }

  // Validate
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'INVALID_TYPE', message: 'File harus image' },
      { status: 400 },
    )
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'TOO_LARGE', message: 'File maksimal 10MB' },
      { status: 400 },
    )
  }

  // Parse optional metadata
  const title       = (formData.get('title') as string) || `Image ${new Date().toLocaleDateString('id-ID')}`
  const description = (formData.get('description') as string) || ''
  const tags        = ((formData.get('tags') as string) || '').split(',').map(t => t.trim()).filter(Boolean)
  const source      = (formData.get('source') as string) || 'unknown'
  const metadataRaw = formData.get('metadata') as string

  let metadata: Record<string, any> = {}
  if (metadataRaw) {
    try {
      metadata = JSON.parse(metadataRaw)
    } catch {
      // ignore malformed
    }
  }

  // Upload buffer to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext    = file.type === 'image/png'  ? 'png'
              :  file.type === 'image/webp' ? 'webp'
              :  'jpg'

  const filename = `library-${Date.now()}.${ext}`

  let uploaded
  try {
    uploaded = await uploadBuffer({
      buffer,
      tenant_id:    auth.tenant_id,
      folder:      'generated',
      filename,
      contentType: file.type,
    })
  } catch (err: any) {
    console.error('[library/save] Upload failed:', err)
    return NextResponse.json(
      { error: 'UPLOAD_FAILED', message: 'Gagal upload ke storage' },
      { status: 500 },
    )
  }

  // Create Content record
  const content = await db.content.create({
    data: {
      tenant_id:    auth.tenant_id,
      userId:      auth.userId,
      type:        'image',
      status:      'ready',
      title,
      tags:        tags.slice(0, 10),
      media_url:    uploaded.publicUrl,
      productData: {} as any,
      generationConfig: {
        source,
        sizeBytes: uploaded.sizeBytes,
        ...metadata,
      } as any,
      caption_text: description || null,
    } as any,
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      caption_text: true,
      media_url: true,
      thumbnail_url: true,
      primary_platform: true,
      created_at: true,
    },
  })

  return NextResponse.json({
    success: true,
    mode:    'upload',
    data:    {
      ...content,
      sizeBytes: uploaded.sizeBytes,
    },
  })
}