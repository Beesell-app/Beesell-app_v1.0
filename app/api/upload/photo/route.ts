// apps/web-app/app/api/upload/photo/route.ts
// POST /api/upload/photo
// Multipart form-data dengan field "file" + optional "removeBg" (boolean)
//
// Flow:
//   1. Auth + rate limit (5/min/user — image upload mahal)
//   2. Receive file dari FormData
//   3. Validate file (type, size <10MB)
//   4. Upload original ke Supabase Storage (folder: uploads)
//   5. Optional: call Remove.bg → upload processed (folder: processed)
//   6. Return URLs untuk display
import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { uploadBuffer, validateImageFile } from '@/lib/storage'
import { removeBackground }  from '@/lib/remove-bg'
import { Ratelimit }     from '@upstash/ratelimit'
import { Redis }         from '@upstash/redis'
import { randomUUID }    from 'crypto'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

// Rate limit: 5 upload/menit (10MB × 5 = 50MB bandwidth/min, reasonable)
const rateLimiter = new Ratelimit({
  redis:   Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix:  'rl:upload-photo',
})

export async function POST(req: Request) {
  try {
    // ── 1. Auth ─────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Rate limit ───────────────────────────────────
    const { success: rlOk } = await rateLimiter.limit(user.id)
    if (!rlOk) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Terlalu banyak upload. Tunggu 1 menit.' },
        { status: 429 },
      )
    }

    // ── 3. Get tenant ──────────────────────────────────
    const dbUser = await db.user.findUnique({
      where:  { id: user.id },
      select: { tenant_id: true, tenants: { select: { plan: true } } },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ── 4. Parse multipart form ────────────────────────
    let formData: FormData
    try {
      formData = await req.formData()
    } catch (err: any) {
      return NextResponse.json(
        { error: 'INVALID_FORM', message: 'Format request salah. Gunakan multipart/form-data.' },
        { status: 400 },
      )
    }

    const file = formData.get('file')
    const removeBgFlag = formData.get('removeBg') === 'true'
    const contentId    = formData.get('contentId') as string | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'File tidak ada di request.' },
        { status: 400 },
      )
    }

    // ── 5. Validate file ───────────────────────────────
    const validation = validateImageFile({ type: file.type, size: file.size })
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'INVALID_FILE', message: validation.error },
        { status: 400 },
      )
    }

    // Plan restriction: free user max 5MB
    if (dbUser.tenant.plan === 'free' && file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:   'FILE_TOO_LARGE',
          message: 'Plan Free max 5MB per upload. Upgrade untuk 10MB.',
        },
        { status: 403 },
      )
    }

    // Plan restriction: bg removal hanya untuk Basic+
    if (removeBgFlag && dbUser.tenant.plan === 'free') {
      return NextResponse.json(
        {
          error:   'PLAN_RESTRICTED',
          message: 'Background removal hanya untuk plan Basic+. Upgrade untuk akses.',
        },
        { status: 403 },
      )
    }

    // ── 6. Read file buffer ────────────────────────────
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileExt    = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const uploadId   = randomUUID()

    // ── 7. Upload original ke Supabase ──────────────────
    let originalUpload
    try {
      originalUpload = await uploadBuffer({
        buffer:      fileBuffer,
        tenant_id:    dbUser.tenant_id,
        folder:      'uploads',
        contentId:   contentId ?? undefined,
        filename:    `${uploadId}-original.${fileExt}`,
        contentType: file.type,
      })
    } catch (err: any) {
      console.error('[upload/photo] Original upload failed:', err)
      return NextResponse.json(
        { error: 'UPLOAD_FAILED', message: 'Gagal upload file. Coba lagi.' },
        { status: 500 },
      )
    }

    // ── 8. Optional: Remove background ──────────────────
    let processedUrl:  string | null = null
    let processedPath: string | null = null
    let creditsUsed = 0
    let bgRemovalError: string | null = null

    if (removeBgFlag) {
      try {
        const result = await removeBackground(fileBuffer, {
          size: 'auto',
          type: 'product',     // optimal untuk produk e-commerce
          format: 'png',
        })

        const processedUpload = await uploadBuffer({
          buffer:      result.buffer,
          tenant_id:    dbUser.tenant_id,
          folder:      'processed',
          contentId:   contentId ?? undefined,
          filename:    `${uploadId}-bg-removed.png`,
          contentType: 'image/png',
        })

        processedUrl  = processedUpload.publicUrl
        processedPath = processedUpload.storagePath
        creditsUsed   = result.creditsUsed

        // Track usage di DB (untuk billing nanti)
        await db.aiJob.create({
          data: {
            tenant_id:  dbUser.tenant_id,
            userId:    user.id,
            jobType:   'background_removal',
            status:    'completed',
            provider:  'remove.bg',
            model:     'remove.bg-product',
            inputData: {
              fileSize: file.size,
              fileName: file.name,
            } as any,
            outputData: {
              originalUrl:  originalUpload.publicUrl,
              processedUrl,
              creditsUsed,
            } as any,
            cost_usd:     creditsUsed * 0.20,
            startedAt:   new Date(),
            completedAt: new Date(),
            ...(contentId && { contentId }),
          },
        }).catch(() => {})

      } catch (err: any) {
        console.error('[upload/photo] Remove.bg failed:', err)
        bgRemovalError = err.message ?? 'Background removal gagal'
        // Tidak throw — original tetap berhasil di-upload, return partial success
      }
    }

    // ── 9. Return both URLs ─────────────────────────────
    return NextResponse.json({
      success: true,
      uploadId,
      original: {
        url:       originalUpload.publicUrl,
        path:      originalUpload.storagePath,
        sizeBytes: originalUpload.sizeBytes,
      },
      processed: processedUrl ? {
        url:  processedUrl,
        path: processedPath,
        creditsUsed,
      } : null,
      bgRemovalError,
    })

  } catch (err: any) {
    console.error('[POST /api/upload/photo]', err)
    return NextResponse.json(
      { error: 'INTERNAL', message: err?.message ?? 'Terjadi kesalahan' },
      { status: 500 },
    )
  }
}

