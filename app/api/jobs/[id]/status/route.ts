// apps/web-app/app/api/jobs/[id]/status/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }           from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { tenant_id: true } })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { id } = await params

    const job = await db.aiJob.findFirst({
      where:  { id, tenant_id: dbUser.tenant_id },
      select: {
        id: true, status: true, job_type: true, model: true,
        cost_usd: true, error_message: true, started_at: true, completed_at: true,
      },
    })
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Hasil image generator ada di image_results (generation_id == job id)
    const imgRows = await db.$queryRaw<Array<{
      cdn_url: string | null; thumbnail_url: string | null; width_px: number | null; height_px: number | null
    }>>`
      SELECT cdn_url, thumbnail_url, width_px, height_px
      FROM image_results WHERE generation_id = ${id}::uuid
      ORDER BY created_at DESC LIMIT 1
    `
    const img = imgRows[0]

    let result: any = null
    if (job.status === 'completed' && img?.cdn_url) {
      result = { imageUrl: img.cdn_url, thumbnailUrl: img.thumbnail_url, width: img.width_px, height: img.height_px }
    }

    const durationMs = job.completed_at && job.started_at
      ? new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
      : null

    return NextResponse.json({
      id: job.id,
      status: job.status,
      jobType: job.job_type,
      model: job.model,
      cost_usd: job.cost_usd ? Number(job.cost_usd) : null,
      error: job.error_message,
      result,
      durationMs,
    })
  } catch (err) {
    console.error('[GET /api/jobs/[id]/status]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}