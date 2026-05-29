// apps/web-app/app/api/jobs/[id]/status/route.ts
// ── GET /api/jobs/[id]/status ─────────────────────────────────
// Polling fallback kalau SSE tidak tersedia atau terputus.
// Returns simplified status + result.
import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { db }            from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await db.user.findUnique({
      where:  { id: user.id },
      select: { tenant_id: true },
    })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { id } = await params

    const job = await db.aiJob.findFirst({
      where:  { id, tenant_id: dbUser.tenant_id },
      select: {
        id:           true,
        status:       true,
        jobType:      true,
        model:        true,
        cost_usd:      true,
        error_message: true,
        outputData:   true,
        contentId:    true,
        content: {
          select: {
            media_url:      true,
            imageThumbUrl: true,
            captionVariants: true,
            caption_text:   true,
          },
        },
        startedAt:    true,
        completedAt:  true,
      },
    })

    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Build result object
    let result = null
    if (job.status === 'completed' && job.content) {
      result = {
        media_url:      job.content.media_url,
        imageThumbUrl: job.content.imageThumbUrl,
        variants:      job.content.captionVariants,
        contentId:     job.contentId,
      }
    }

    const durationMs = job.completedAt && job.startedAt
      ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
      : null

    return NextResponse.json({
      id:          job.id,
      status:      job.status,
      jobType:     job.jobType,
      model:       job.model,
      cost_usd:     job.cost_usd ? Number(job.cost_usd) : null,
      error:       job.error_message,
      result,
      durationMs,
    })

  } catch (err) {
    console.error('[GET /api/jobs/[id]/status]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}