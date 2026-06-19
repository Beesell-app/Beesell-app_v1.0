// app/api/video/dispatch/route.ts
// ══════════════════════════════════════════════════════════════
// VIDEO DISPATCH — Entry Point (responds in < 2s)
// ══════════════════════════════════════════════════════════════
//
// Flow:
//   1. Auth + plan check
//   2. Parse multipart form-data
//   3. Upload source image(s) → Supabase Storage (public URL)
//   4. Deduct quota (pre-deduct, refund on failure)
//   5. INSERT video job record → ai_video_jobs (status=pending)
//   6. Publish job payload → QStash → worker URL
//   7. Return 202 Accepted { jobId, estimatedSec }
//
// This endpoint NEVER calls Runway. It returns immediately.
// The actual video generation happens in /api/video/process (background worker).

import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import {
  getPublisher, makeJobId, estimateSeconds,
  type VideoJob, type ImageToVideoJob, type UgcVideoJob, type TikTokReelsVideoJob,
} from '@/lib/qstash/publisher'
import { buildRunwayPrompt } from '@/lib/runway/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Very short — only validates + publishes to QStash
export const maxDuration = 25

const ALLOWED_IMG = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const MAX_BYTES   = 20 * 1024 * 1024

// ── Helpers ───────────────────────────────────────────────────
async function uploadToStorage(
  supabase:  ReturnType<Awaited<typeof createClient>>,
  file:      File,
  userId:    string,
  prefix:    string,
): Promise<string> {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buf  = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('ai-assets')
    .upload(path, buf, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage.from('ai-assets').getPublicUrl(path)
  return publicUrl
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Parse multipart form ──────────────────────────────────
    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error: 'Body harus multipart/form-data' }, { status: 400 }) }

    const jobType = (formData.get('jobType') as string) ?? 'image_to_video'
    const validTypes = ['image_to_video', 'ugc_video', 'tiktok_reels_video']
    if (!validTypes.includes(jobType)) {
      return NextResponse.json({ error: `jobType '${jobType}' tidak valid` }, { status: 400 })
    }

    // ── Plan + quota check ────────────────────────────────────
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('plan, video_used, video_limit, ugc_used, ugc_limit')
      .eq('id', user.id)
      .single()

    if (pErr || !profile) {
      return NextResponse.json({ error: 'Profil tidak ditemukan' }, { status: 404 })
    }

    // Minimum plan: Basic for video, Pro for UGC
    const validPlans = jobType === 'ugc_video'
      ? ['basic', 'pro', 'business']
      : ['basic', 'pro', 'business']

    if (!validPlans.includes(profile.plan ?? '')) {
      return NextResponse.json({
        error:   'Fitur video memerlukan minimal plan Basic.',
        upgrade: true,
      }, { status: 403 })
    }

    // Quota check
    const quotaField = jobType === 'ugc_video' ? 'ugc_used' : 'video_used'
    const limitField = jobType === 'ugc_video' ? 'ugc_limit' : 'video_limit'
    const used  = (profile as any)[quotaField]  ?? 0
    const limit = (profile as any)[limitField]  ?? 5

    if (used >= limit) {
      return NextResponse.json({
        error:         `Kuota ${jobType === 'ugc_video' ? 'UGC' : 'Video'} AI habis (${used}/${limit}). Beli add-on atau upgrade plan.`,
        quotaExceeded: true,
        quotaUsed:     used,
        quotaLimit:    limit,
      }, { status: 429 })
    }

    // ── Upload images ─────────────────────────────────────────
    const imageFile    = formData.get('image')    as File | null
    const endImageFile = formData.get('endImage') as File | null

    // Validate image if provided
    if (imageFile) {
      if (!ALLOWED_IMG.has(imageFile.type)) {
        return NextResponse.json({ error: 'Format gambar tidak didukung' }, { status: 400 })
      }
      if (imageFile.size > MAX_BYTES) {
        return NextResponse.json({ error: 'Gambar maksimal 20MB' }, { status: 400 })
      }
    }

    let imageUrl:    string | undefined
    let endImageUrl: string | undefined

    if (imageFile) {
      imageUrl = await uploadToStorage(supabase as any, imageFile, user.id, 'video-src')
    }
    if (endImageFile && ALLOWED_IMG.has(endImageFile.type)) {
      endImageUrl = await uploadToStorage(supabase as any, endImageFile, user.id, 'video-end')
    }

    // ── Build job payload ─────────────────────────────────────
    const jobId      = makeJobId(jobType.replace('_', '-'))
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.beesell.ai'
    const workerUrl  = `${appUrl}/api/video/process`
    const webhookUrl = `${appUrl}/api/video/webhook`

    let job: VideoJob

    if (jobType === 'image_to_video') {
      if (!imageUrl) {
        return NextResponse.json({ error: 'Gambar sumber wajib diupload' }, { status: 400 })
      }
      const preset     = (formData.get('preset')     as string) ?? 'auto'
      const duration   = parseInt(formData.get('duration')   as string) as 5 | 10
      const resolution = (formData.get('resolution') as string) ?? '720p'

      // 1080p requires Pro+
      if (resolution === '1080p' && !['pro', 'business'].includes(profile.plan ?? '')) {
        return NextResponse.json({ error: '1080p hanya tersedia untuk plan Pro dan Business.' }, { status: 403 })
      }
      // End image requires Pro+, 1080p only
      if (endImageUrl && !['pro', 'business'].includes(profile.plan ?? '')) {
        return NextResponse.json({ error: 'End Image hanya tersedia untuk plan Pro dan Business.' }, { status: 403 })
      }

      const iv: ImageToVideoJob = {
        type:         'image_to_video',
        jobId,
        userId:       user.id,
        imageUrl,
        endImageUrl,
        promptText:   buildRunwayPrompt(preset, (formData.get('customPrompt') as string) ?? ''),
        duration:     [5, 10].includes(duration) ? duration : 5,
        resolution:   resolution as any,
        presetId:     preset,
        webhookUrl,
        runwayModel:  resolution === '1080p' ? 'gen3a' : 'gen3a_turbo',
      }
      job = iv

    } else if (jobType === 'ugc_video') {
      const script = (formData.get('script') as string)?.trim()
      if (!script) {
        return NextResponse.json({ error: 'Script wajib diisi untuk UGC Video' }, { status: 400 })
      }

      const uv: UgcVideoJob = {
        type:             'ugc_video',
        jobId,
        userId:           user.id,
        script,
        characterId:      (formData.get('characterId')  as string) ?? '',
        language:         (formData.get('language')     as string) ?? 'indonesia',
        accent:           (formData.get('accent')       as string) ?? 'natural-id',
        videoPresetId:    (formData.get('videoPreset')  as string) ?? 'viral-tiktok',
        subtitleStyle:    (formData.get('subtitle')     as string) ?? 'tiktok',
        ctaOverlay:       (formData.get('cta')          as string) ?? 'shop-now',
        musicCategory:    (formData.get('music')        as string) ?? 'trending',
        resolution:       (formData.get('resolution')   as string) ?? 'vertical',
        productImageUrl:  imageUrl,
        webhookUrl,
      }
      job = uv

    } else {
      // tiktok_reels_video
      const promptText = (formData.get('promptText') as string)?.trim() ?? ''
      if (!promptText && !imageUrl) {
        return NextResponse.json({ error: 'Prompt atau gambar produk wajib ada' }, { status: 400 })
      }

      const tr: TikTokReelsVideoJob = {
        type:             'tiktok_reels_video',
        jobId,
        userId:           user.id,
        scriptVariantId:  (formData.get('scriptVariantId') as string) ?? 'ugc-review',
        platform:         (formData.get('platform')        as string) ?? 'tiktok',
        duration:         parseInt(formData.get('duration') as string) || 30,
        promptText,
        productImageUrl:  imageUrl,
        webhookUrl,
        runwayModel:      'gen3a_turbo',
      }
      job = tr
    }

    const estimatedSec = estimateSeconds(job)

    // ── Pre-deduct quota (refund on failure via webhook) ──────
    await supabase.from('profiles')
      .update({ [quotaField]: used + 1 })
      .eq('id', user.id)

    // ── Insert job record ─────────────────────────────────────
    const { error: insertErr } = await supabase.from('ai_video_jobs').insert({
      id:            jobId,
      user_id:       user.id,
      type:          jobType,
      status:        'pending',
      payload:       job,
      estimated_sec: estimatedSec,
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    })

    if (insertErr) {
      // Refund quota on DB error
      await supabase.from('profiles').update({ [quotaField]: used }).eq('id', user.id)
      console.error('[dispatch] DB insert error:', insertErr)
      return NextResponse.json({ error: 'Gagal menyimpan job ke database' }, { status: 500 })
    }

    // ── Publish to QStash ─────────────────────────────────────
    const publisher = getPublisher()
    let qstashMessageId: string

    try {
      const res = await publisher.publish(job, workerUrl)
      qstashMessageId = res.messageId
    } catch (qErr: any) {
      // Rollback: delete job + refund quota
      await supabase.from('ai_video_jobs').delete().eq('id', jobId)
      await supabase.from('profiles').update({ [quotaField]: used }).eq('id', user.id)
      console.error('[dispatch] QStash publish failed:', qErr)
      return NextResponse.json({ error: 'Gagal mengirim job ke queue. Coba lagi.' }, { status: 503 })
    }

    // Update job with QStash message ID
    await supabase.from('ai_video_jobs')
      .update({ qstash_message_id: qstashMessageId, updated_at: new Date().toISOString() })
      .eq('id', jobId)

    // ── Return 202 Accepted ───────────────────────────────────
    return NextResponse.json({
      success:        true,
      jobId,
      status:         'pending',
      estimatedSec,
      message:        'Video sedang diproses di background. Cek status via /api/video/status atau Realtime.',
      qstashMessageId,
    }, { status: 202 })

  } catch (err: any) {
    console.error('[dispatch] Unexpected error:', err)
    return NextResponse.json({ error: err?.message ?? 'Server error tak terduga' }, { status: 500 })
  }
}