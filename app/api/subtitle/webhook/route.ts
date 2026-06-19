// app/api/subtitle/webhook/route.ts
// ══════════════════════════════════════════════════════════════
// SUBTITLE WEBHOOK — Lambda callback receiver
// POST /api/subtitle/webhook
// Called BY Lambda when transcription + burn-in completes
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // ── Verify webhook secret ─────────────────────────────────
    const secret = req.headers.get('x-webhook-secret') ?? ''
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      console.warn('[subtitle/webhook] Invalid secret')
      return NextResponse.json({ error:'Unauthorized' }, { status:401 })
    }

    const body = await req.json()
    const {
      jobId, status, outputUrl, srtUrl, srtContent,
      language, style, segments, duration, elapsedMs, error: errMsg,
    } = body

    if (!jobId) return NextResponse.json({ error:'jobId required' }, { status:400 })

    // Use service role for webhook (no user session available)
    const supabase = await createClient()

    // ── Update subtitle_jobs ──────────────────────────────────
    const updateData: Record<string, any> = {
      status:         status === 'completed' ? 'completed' : 'failed',
      updated_at:     new Date().toISOString(),
    }

    if (status === 'completed') {
      updateData.output_url     = outputUrl ?? null
      updateData.srt_url        = srtUrl    ?? null
      updateData.srt_content    = srtContent ?? null
      updateData.segment_count  = segments  ?? null
      updateData.audio_duration = duration  ?? null
      updateData.completed_at   = new Date().toISOString()
      updateData.elapsed_ms     = elapsedMs ?? null
    } else {
      updateData.error_message = errMsg?.substring(0, 500) ?? 'Unknown error'
    }

    const { data:job } = await supabase
      .from('subtitle_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select('user_id, has_video, style')
      .single()

    if (!job) {
      console.warn('[subtitle/webhook] Job not found:', jobId)
      return NextResponse.json({ ok:false, reason:'job not found' })
    }

    // ── Save to asset library if completed ────────────────────
    if (status === 'completed' && outputUrl) {
      await supabase.from('ai_assets').insert({
        user_id:    job.user_id,
        type:       'video',
        tool_name:  'AI Subtitle',
        title:      `Subtitle ${job.style} · ${new Date().toLocaleDateString('id-ID')}`,
        file_url:   outputUrl,
        file_format:'mp4',
        parameters: { style, language, srtUrl, segments },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).catch(e => console.warn('[subtitle/webhook] Asset insert error:', e?.message))
    }

    // ── Refund quota on failure ───────────────────────────────
    if (status !== 'completed') {
      const { data:profile } = await supabase
        .from('profiles').select('subtitle_used').eq('id', job.user_id).single()
      if (profile && profile.subtitle_used > 0) {
        await supabase.from('profiles')
          .update({ subtitle_used: profile.subtitle_used - 1 })
          .eq('id', job.user_id)
      }
    }

    // ── Notify client via Supabase Realtime ───────────────────
    await supabase.channel(`subtitle-job-${jobId}`).send({
      type:    'broadcast',
      event:   status === 'completed' ? 'subtitle_completed' : 'subtitle_failed',
      payload: {
        jobId, status, outputUrl, srtUrl, srtContent,
        segments, duration, elapsedMs,
        error: errMsg ?? null,
      },
    }).catch(() => {})

    console.log(`[subtitle/webhook] Job ${jobId} → ${status}`)
    return NextResponse.json({ ok:true, jobId, status })

  } catch (err: any) {
    console.error('[subtitle/webhook]', err)
    return NextResponse.json({ error:err?.message }, { status:500 })
  }
}

// ══════════════════════════════════════════════════════════════
// BURN-IN TRIGGER
// POST /api/subtitle/burn
// Called when user wants to burn existing SRT onto a new video
// (separate flow from auto-transcribe)
// ══════════════════════════════════════════════════════════════
// (Put in a separate route file: app/api/subtitle/burn/route.ts)