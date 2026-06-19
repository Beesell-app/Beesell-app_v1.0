// app/api/video/status/route.ts
// ══════════════════════════════════════════════════════════════
// VIDEO STATUS — Job status polling + cancel
// ══════════════════════════════════════════════════════════════
//
// GET  /api/video/status?jobId={id}   → returns current job state
// DELETE /api/video/status?jobId={id} → cancel pending/processing job
//
// Client polling strategy:
//   - Poll every 5s while status=pending|processing
//   - Stop when status=completed|failed
//   - Realtime (Supabase broadcast) fires immediately on completion
//     so polling is a fallback only

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ── GET — job status ──────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url   = new URL(req.url)
    const jobId = url.searchParams.get('jobId')
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    const { data: job, error } = await supabase
      .from('ai_video_jobs')
      .select('id, status, video_url, thumbnail_url, error_message, estimated_sec, created_at, updated_at, completed_at, type, runway_task_id')
      .eq('id', jobId)
      .eq('user_id', user.id)   // ownership check
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job tidak ditemukan' }, { status: 404 })
    }

    // Compute elapsed and remaining estimate
    const startedAt    = new Date(job.created_at).getTime()
    const elapsedSec   = Math.round((Date.now() - startedAt) / 1000)
    const remainingSec = Math.max(0, (job.estimated_sec ?? 90) - elapsedSec)

    return NextResponse.json({
      jobId:          job.id,
      status:         job.status,
      videoUrl:       job.video_url    ?? null,
      thumbnailUrl:   job.thumbnail_url ?? null,
      errorMessage:   job.error_message ?? null,
      elapsedSec,
      estimatedSec:   job.estimated_sec ?? 90,
      remainingSec,
      completedAt:    job.completed_at  ?? null,
      // Progress estimation (0-100)
      progress:       job.status === 'completed' ? 100
        : job.status === 'failed'    ? 0
        : job.status === 'processing'
          ? Math.min(90, Math.round((elapsedSec / (job.estimated_sec ?? 90)) * 100))
          : 5,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

// ── DELETE — cancel job ───────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url   = new URL(req.url)
    const jobId = url.searchParams.get('jobId')
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    // Fetch job (ownership + status check)
    const { data: job } = await supabase
      .from('ai_video_jobs')
      .select('status, type, runway_task_id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (!job) return NextResponse.json({ error: 'Job tidak ditemukan' }, { status: 404 })

    if (['completed', 'failed'].includes(job.status)) {
      return NextResponse.json({ error: `Job sudah ${job.status}, tidak bisa dibatalkan` }, { status: 409 })
    }

    // Cancel Runway task if it was submitted
    if (job.runway_task_id && process.env.RUNWAYML_API_SECRET) {
      try {
        const { createRunwayClient } = await import('@/lib/runway/client')
        const runway = createRunwayClient()
        await runway.cancelTask(job.runway_task_id)
      } catch (e) {
        console.warn('[status] Failed to cancel Runway task:', e)
      }
    }

    // Update status
    await supabase.from('ai_video_jobs').update({
      status:     'failed',
      error_message: 'Dibatalkan oleh user',
      updated_at: new Date().toISOString(),
    }).eq('id', jobId)

    // Refund quota
    const quotaField = job.type === 'ugc_video' ? 'ugc_used' : 'video_used'
    const { data: profile } = await supabase
      .from('profiles').select(quotaField).eq('id', user.id).single()
    if (profile) {
      const current = (profile as any)[quotaField] ?? 1
      await supabase.from('profiles')
        .update({ [quotaField]: Math.max(0, current - 1) })
        .eq('id', user.id)
    }

    return NextResponse.json({ success: true, jobId, status: 'cancelled' })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}