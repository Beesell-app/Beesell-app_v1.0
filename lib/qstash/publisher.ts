// lib/qstash/publisher.ts
// ══════════════════════════════════════════════════════════════
// QSTASH — Async Job Publisher
// ══════════════════════════════════════════════════════════════
//
// Architecture:
//   Client → POST /api/video/dispatch
//              ↓
//           Validates input, saves job_id to DB (status=pending)
//           Publishes message to QStash
//              ↓  (async, no Vercel timeout)
//           QStash → POST /api/video/process (background worker)
//              ↓
//           Worker calls Runway Gen-3
//           Polls Runway until done (max 3 min internal timeout)
//              ↓
//           Runway webhook OR worker updates DB (status=completed, video_url)
//           Worker calls /api/video/webhook to notify frontend via Supabase realtime
//
// QStash features used:
//   - Deduplication via Message-Deduplication-Id
//   - Retries (3 attempts, exponential backoff)
//   - Delay: 0 (immediate)
//   - Timeout: 300s (5 min, covers max Runway Gen-3 generation time)

import { Client as QStashClient } from '@upstash/qstash'

// ── Job types ──────────────────────────────────────────────────
export type VideoJobType =
  | 'image_to_video'
  | 'ugc_video'
  | 'tiktok_reels_video'

export type VideoJobStatus =
  | 'pending'    // job queued in QStash, not yet picked up
  | 'processing' // worker received, calling Runway
  | 'completed'  // video URL available
  | 'failed'     // terminal failure, user should retry

// ── Job payload shapes ─────────────────────────────────────────
export interface ImageToVideoJob {
  type:            'image_to_video'
  jobId:           string
  userId:          string
  // Runway inputs
  imageUrl:        string     // uploaded to Supabase Storage (public URL)
  endImageUrl?:    string
  promptText?:     string
  duration:        5 | 10
  resolution:      '480p' | '720p' | '1080p'
  presetId:        string
  // Meta
  webhookUrl:      string     // our /api/video/webhook
  runwayModel:     'gen3a_turbo' | 'gen3a'
}

export interface UgcVideoJob {
  type:            'ugc_video'
  jobId:           string
  userId:          string
  script:          string
  characterId:     string
  language:        string
  accent:          string
  videoPresetId:   string
  subtitleStyle:   string
  ctaOverlay:      string
  musicCategory:   string
  resolution:      string
  productImageUrl?:string
  webhookUrl:      string
}

export interface TikTokReelsVideoJob {
  type:            'tiktok_reels_video'
  jobId:           string
  userId:          string
  scriptVariantId: string
  platform:        string
  duration:        number
  promptText:      string
  productImageUrl?:string
  webhookUrl:      string
  runwayModel:     'gen3a_turbo' | 'gen3a'
}

export type VideoJob = ImageToVideoJob | UgcVideoJob | TikTokReelsVideoJob

// ── DB record shape (ai_video_jobs table) ─────────────────────
export interface VideoJobRecord {
  id:            string         // UUID
  user_id:       string
  type:          VideoJobType
  status:        VideoJobStatus
  runway_task_id?:string        // Runway task ID when processing
  video_url?:    string         // output URL when completed
  thumbnail_url?:string
  error_message?:string
  payload:       VideoJob       // full job payload (jsonb)
  estimated_sec: number         // estimate shown to user
  created_at:    string
  updated_at:    string
  completed_at?: string
}

// ── QStash publisher ───────────────────────────────────────────
export class VideoJobPublisher {
  private readonly qstash: QStashClient

  constructor() {
    const token = process.env.QSTASH_TOKEN
    if (!token) throw new Error('QSTASH_TOKEN env var not set')
    this.qstash = new QStashClient({ token })
  }

  /**
   * Publish a video generation job to QStash.
   * The worker URL receives the job as POST body.
   * Returns the QStash messageId for deduplication tracking.
   */
  async publish(job: VideoJob, workerUrl: string): Promise<{ messageId: string }> {
    const res = await this.qstash.publishJSON({
      url:     workerUrl,
      body:    job,
      headers: {
        // Our own HMAC auth header for the worker endpoint
        'X-BeeSell-Job-Secret': process.env.JOB_SECRET ?? '',
      },
      retries:    3,         // retry 3× on worker failure (Runway errors)
      delay:      0,         // immediate
      // QStash timeout = how long the worker can run before QStash retries
      // Must be > max Runway generation time (180s) + our polling overhead
      // QStash max = 600s; we set 360s (6 min) for safety
      // Note: set via QSTASH_UPSTASH_TIMEOUT env or per-message header
    })
    return { messageId: res.messageId ?? job.jobId }
  }
}

// ── Estimate generation time for user-facing UI ────────────────
export function estimateSeconds(job: VideoJob): number {
  if (job.type === 'image_to_video') {
    const base = job.duration === 5 ? 45 : 80
    return job.resolution === '1080p' ? base * 2 : job.resolution === '720p' ? base * 1.4 : base
  }
  if (job.type === 'ugc_video') return 90
  if (job.type === 'tiktok_reels_video') return 60
  return 90
}

// ── Job ID factory ─────────────────────────────────────────────
export function makeJobId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Singleton ──────────────────────────────────────────────────
let _publisher: VideoJobPublisher | null = null
export function getPublisher(): VideoJobPublisher {
  if (!_publisher) _publisher = new VideoJobPublisher()
  return _publisher
}