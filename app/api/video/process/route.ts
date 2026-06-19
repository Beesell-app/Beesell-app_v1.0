// app/api/video/process/route.ts
// ══════════════════════════════════════════════════════════════
// VIDEO PROCESS — QStash Background Worker
// ══════════════════════════════════════════════════════════════
//
// Called BY QStash (not by the client directly).
// QStash retries this up to 3× on failure with exponential backoff.
//
// Flow:
//   1. Verify QStash signature (security)
//   2. Parse job payload from request body
//   3. Update DB: status → processing
//   4. Route to correct AI provider:
//        image_to_video      → Runway Gen-3 Alpha
//        ugc_video           → D-ID API (avatar + lipsync)
//        tiktok_reels_video  → Runway Gen-3 (text/image to video)
//   5. Poll AI until completed (max 170s internal timeout,
//      leaving buffer for QStash's 300s window)
//   6. Update DB: status → completed, video_url = result
//   7. Trigger Supabase Realtime notification
//   8. Return 200 to QStash (prevents retry)
//      On any error: return 500 → QStash will retry
//
// Security:
//   QStash sends "Upstash-Signature" header.
//   We verify it using @upstash/qstash Receiver.

import { NextResponse }  from 'next/server'
import { Receiver }      from '@upstash/qstash'
import { createClient }  from '@/lib/supabase/server'
import { createRunwayClient, buildRunwayPrompt } from '@/lib/runway/client'
import type { VideoJob, ImageToVideoJob, UgcVideoJob, TikTokReelsVideoJob } from '@/lib/qstash/publisher'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
// Vercel max on Pro plan; covers Runway polling + D-ID
export const maxDuration = 300

// ── QStash signature verifier ─────────────────────────────────
function getReceiver(): Receiver {
  return new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? '',
    nextSigningKey:    process.env.QSTASH_NEXT_SIGNING_KEY    ?? '',
  })
}

// ── Sleep ─────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ── Runway Gen-3 polling (max 170s) ───────────────────────────
async function pollRunwayTask(
  taskId:    string,
  runway:    ReturnType<typeof createRunwayClient>,
  maxMs:     number = 170_000,
): Promise<string> {
  const deadline = Date.now() + maxMs
  let interval   = 4_000  // start at 4s, increase

  while (Date.now() < deadline) {
    await sleep(interval)
    interval = Math.min(interval * 1.3, 12_000)   // exponential up to 12s

    const task = await runway.getTask(taskId)

    switch (task.status) {
      case 'SUCCEEDED': {
        const url = task.output?.[0]
        if (!url) throw new Error('Runway task succeeded but output is empty')
        return url
      }
      case 'FAILED':
        throw new Error(`Runway task failed: ${task.failure ?? 'unknown reason'}`)
      case 'CANCELLED':
        throw new Error('Runway task was cancelled')
      case 'THROTTLED':
        // Throttled → wait longer before next poll
        await sleep(8_000)
        break
      default:
        // PENDING or RUNNING → continue polling
        break
    }
  }
  throw new Error('Runway polling timeout — exceeded 170s')
}

// ── D-ID polling (UGC avatar video) ───────────────────────────
async function pollDIDTask(
  talkId: string,
  apiKey: string,
  maxMs:  number = 170_000,
): Promise<string> {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    await sleep(5_000)
    const res  = await fetch(`https://api.d-id.com/talks/${talkId}`, {
      headers: { Authorization: `Basic ${apiKey}`, 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data.status === 'done')  return data.result_url as string
    if (data.status === 'error') throw new Error(data.error?.description ?? 'D-ID error')
  }
  throw new Error('D-ID polling timeout')
}

// ── Image to Video via Runway ─────────────────────────────────
async function processImageToVideo(job: ImageToVideoJob): Promise<string> {
  const runway = createRunwayClient(job.runwayModel ?? 'gen3a_turbo')

  // Map resolution to Runway ratio
  const ratioMap: Record<string, '768:1280' | '1280:768' | '1:1'> = {
    '480p':  '768:1280',
    '720p':  '768:1280',
    '1080p': '768:1280',
  }

  const task = await runway.createImageToVideoTask({
    imageUri:     job.imageUrl,
    endImageUri:  job.endImageUrl,
    promptText:   job.promptText,
    duration:     job.duration,
    ratio:        ratioMap[job.resolution] ?? '768:1280',
  })

  return pollRunwayTask(task.id, runway)
}

// ── UGC Video via D-ID ────────────────────────────────────────
async function processUgcVideo(job: UgcVideoJob): Promise<string> {
  const didKey = process.env.DID_API_KEY
  if (!didKey) throw new Error('DID_API_KEY not configured')

  // Voice mapping
  const voiceMap: Record<string, string> = {
    'natural-id': 'id-ID-GadisNeural',
    'formal-id':  'id-ID-ArdiNeural',
    'casual-id':  'id-ID-GadisNeural',
    'american-en':'en-US-JennyNeural',
    'british-en': 'en-GB-SoniaNeural',
  }
  const voiceId = voiceMap[job.accent] ?? 'id-ID-GadisNeural'

  const body = {
    script: {
      type:     'text',
      input:    job.script.substring(0, 4000), // D-ID limit
      provider: { type: 'microsoft', voice_id: voiceId },
    },
    // In production: use actual avatar URL from character preset
    source_url: `https://clips.d-id.com/alice_white/image.jpeg`,
    config: { fluent: true, pad_audio: 0.0 },
  }

  const createRes = await fetch('https://api.d-id.com/talks', {
    method:  'POST',
    headers: { Authorization: `Basic ${didKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!createRes.ok) {
    const e = await createRes.json().catch(() => ({}))
    throw new Error(`D-ID create talk failed: ${e.description ?? createRes.status}`)
  }
  const talk = await createRes.json()
  if (!talk.id) throw new Error('D-ID did not return talk ID')

  return pollDIDTask(talk.id, didKey)
}

// ── TikTok Reels Video via Runway ─────────────────────────────
async function processTikTokReelsVideo(job: TikTokReelsVideoJob): Promise<string> {
  const runway = createRunwayClient(job.runwayModel ?? 'gen3a_turbo')

  if (job.productImageUrl) {
    // Image + prompt → video
    const task = await runway.createImageToVideoTask({
      imageUri:   job.productImageUrl,
      promptText: job.promptText || buildRunwayPrompt(job.scriptVariantId),
      duration:   job.duration <= 10 ? (job.duration <= 5 ? 5 : 10) : 10,
      ratio:      '768:1280',
    })
    return pollRunwayTask(task.id, runway)
  } else {
    // Text only → text to video
    const task = await runway.createTextToVideoTask({
      promptText: job.promptText || buildRunwayPrompt(job.scriptVariantId),
      duration:   job.duration <= 5 ? 5 : 10,
      ratio:      '768:1280',
    })
    return pollRunwayTask(task.id, runway)
  }
}

// ── Save thumbnail via Runway URL ─────────────────────────────
// (In production: use sharp/ffmpeg frame extract)
function deriveThumbnailUrl(videoUrl: string): string {
  // Runway video URLs work as-is; for thumbnail we'd normally extract frame 0
  // Placeholder: return same URL with .jpg suffix attempt
  return videoUrl
}

// ══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  const startedAt = Date.now()

  // ── 1. Verify QStash signature ────────────────────────────
  const rawBody = await req.text()
  const signature = req.headers.get('upstash-signature') ?? ''

  if (process.env.NODE_ENV === 'production') {
    try {
      const receiver = getReceiver()
      const isValid  = await receiver.verify({
        signature,
        body: rawBody,
        url:  `${process.env.NEXT_PUBLIC_APP_URL}/api/video/process`,
      })
      if (!isValid) {
        console.error('[process] Invalid QStash signature — rejecting request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch (sigErr) {
      console.error('[process] Signature verification error:', sigErr)
      return NextResponse.json({ error: 'Signature error' }, { status: 401 })
    }
  } else {
    // Development: also accept X-BeeSell-Job-Secret header directly
    const jobSecret = req.headers.get('x-beesell-job-secret')
    if (jobSecret !== process.env.JOB_SECRET && process.env.JOB_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── 2. Parse job payload ──────────────────────────────────
  let job: VideoJob
  try {
    job = JSON.parse(rawBody) as VideoJob
  } catch {
    console.error('[process] Invalid JSON body')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { jobId, userId } = job
  console.log(`[process] Starting job ${jobId} (type=${job.type})`)

  const supabase = await createClient()

  // ── 3. Update status → processing ────────────────────────
  await supabase.from('ai_video_jobs').update({
    status:     'processing',
    updated_at: new Date().toISOString(),
  }).eq('id', jobId)

  // ── 4. Run AI generation ──────────────────────────────────
  let videoUrl: string
  let runwayTaskId: string | undefined

  try {
    if (job.type === 'image_to_video') {
      // Create Runway task and get taskId for tracking
      const runway  = createRunwayClient(job.runwayModel ?? 'gen3a_turbo')
      const ratioMap: Record<string, '768:1280' | '1280:768' | '1:1'> = {
        '480p':'768:1280', '720p':'768:1280', '1080p':'768:1280',
      }
      const task = await runway.createImageToVideoTask({
        imageUri:    job.imageUrl,
        endImageUri: job.endImageUrl,
        promptText:  job.promptText,
        duration:    job.duration,
        ratio:       ratioMap[job.resolution] ?? '768:1280',
      })

      runwayTaskId = task.id
      // Persist Runway task ID so /api/video/status can check Runway directly if needed
      await supabase.from('ai_video_jobs').update({
        runway_task_id: runwayTaskId,
        updated_at:     new Date().toISOString(),
      }).eq('id', jobId)

      videoUrl = await pollRunwayTask(task.id, runway)

    } else if (job.type === 'ugc_video') {
      videoUrl = await processUgcVideo(job)

    } else if (job.type === 'tiktok_reels_video') {
      videoUrl = await processTikTokReelsVideo(job)

    } else {
      throw new Error(`Unknown job type: ${(job as any).type}`)
    }

  } catch (aiErr: any) {
    const errMsg = aiErr?.message ?? 'AI generation failed'
    console.error(`[process] Job ${jobId} AI error:`, errMsg)

    // Update DB: failed
    await supabase.from('ai_video_jobs').update({
      status:        'failed',
      error_message: errMsg.substring(0, 500),
      updated_at:    new Date().toISOString(),
    }).eq('id', jobId)

    // Refund quota
    const quotaField = job.type === 'ugc_video' ? 'ugc_used' : 'video_used'
    const { data: profile } = await supabase
      .from('profiles').select(quotaField).eq('id', userId).single()
    if (profile) {
      const current = (profile as any)[quotaField] ?? 1
      await supabase.from('profiles')
        .update({ [quotaField]: Math.max(0, current - 1) })
        .eq('id', userId)
    }

    // Notify client of failure via Supabase realtime (broadcast)
    await supabase.channel(`video-job-${jobId}`).send({
      type:    'broadcast',
      event:   'video_failed',
      payload: { jobId, error: errMsg },
    }).catch(() => {})

    // Return 500 → QStash will retry (up to 3 total attempts)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }

  // ── 5. Save result to DB ──────────────────────────────────
  const thumbnailUrl  = deriveThumbnailUrl(videoUrl)
  const completedAt   = new Date().toISOString()
  const elapsedMs     = Date.now() - startedAt

  await supabase.from('ai_video_jobs').update({
    status:        'completed',
    video_url:     videoUrl,
    thumbnail_url: thumbnailUrl,
    completed_at:  completedAt,
    updated_at:    completedAt,
  }).eq('id', jobId)

  // ── 6. Save to asset library ──────────────────────────────
  const assetType = job.type === 'ugc_video' ? 'ugc-video'
    : job.type === 'tiktok_reels_video' ? 'image-to-video'
    : 'image-to-video'

  await supabase.from('ai_assets').insert({
    user_id:         userId,
    type:            assetType,
    tool_name:       job.type === 'ugc_video' ? 'UGC Video' : 'Image to Video',
    file_url:        videoUrl,
    file_format:     'mp4',
    parameters:      { jobId, jobType: job.type },
    created_at:      completedAt,
    updated_at:      completedAt,
  }).catch(e => console.warn('[process] Asset library insert failed:', e?.message))

  // ── 7. Notify client via Supabase Realtime ────────────────
  await supabase.channel(`video-job-${jobId}`).send({
    type:    'broadcast',
    event:   'video_completed',
    payload: {
      jobId,
      videoUrl,
      thumbnailUrl,
      elapsedMs,
      completedAt,
    },
  }).catch(rtErr => console.warn('[process] Realtime broadcast failed:', rtErr?.message))

  console.log(`[process] Job ${jobId} completed in ${Math.round(elapsedMs/1000)}s → ${videoUrl}`)

  // ── 8. Return 200 to QStash (do not retry) ────────────────
  return NextResponse.json({
    success:      true,
    jobId,
    videoUrl,
    elapsedMs,
  })
}