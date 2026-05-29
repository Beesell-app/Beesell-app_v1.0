// apps/web-app/lib/publish/publisher.ts
// ── Publish orchestrator ──────────────────────────────────────
// Called from cron endpoint every minute.
// 1. Lock + fetch due posts (atomic)
// 2. Dispatch to platform publisher
// 3. Handle success / failure / retry
import { db }                     from '@/lib/db'
import { decryptToken }           from '@/lib/platform/token-encryption'
import { publishToInstagram }     from './instagram-publisher'
import {
  getNextRetryAt, shouldRetry, buildPublishError,
  DEFAULT_RETRY_CONFIG,
} from './retry'
import type { MediaType }         from './instagram-publisher'
import { sendPublishNotification } from '@/lib/notifications/sender'
// ── Types ─────────────────────────────────────────────────────
export interface ScheduledPost {
  id:                  string
  tenant_id:            string
  contentId:           string | null
  platform:            string
  platformaccount_id:   string | null
  caption:             string | null
  hashtags:            string[]
  media_url:            string | null
  videoUrl:            string | null
  mediaType:           string
  scheduledAt:         Date
  retryCount:          number
  maxRetries:          number
  carouselItems:       string[] | null
}

export interface PublishSummary {
  processed: number
  published: number
  failed:    number
  retrying:  number
  skipped:   number
  results:   Array<{
    postId:    string
    status:    'published' | 'failed' | 'retrying' | 'skipped'
    platform:  string
    error?:    string
  }>
  elapsedMs: number
}

const BATCH_SIZE = 10   // max posts per cron run

type PublishEngineOptions = {
  dryRun?: boolean
  limit?: number
}
// ── Main run function ─────────────────────────────────────────
export async function runPublishEngine(options: PublishEngineOptions = {}): Promise<PublishSummary> {
  const start   = Date.now()
   const {
    dryRun = false,
    limit = 10,
  } = options
  const summary: PublishSummary = {
    processed: 0, published: 0, failed: 0, retrying: 0, skipped: 0,
    results:   [], elapsedMs: 0,
    
  }
  console.log('dryRun:', dryRun)
  console.log('limit:', limit)
  // ── 1. Fetch + lock due posts (atomic via FOR UPDATE SKIP LOCKED) ──
  const posts = await db.$queryRaw<ScheduledPost[]>`
    SELECT
      id,
      tenant_id         AS "tenant_id",
      content_id        AS "contentId",
      platform,
      platform_account_id AS "platformaccount_id",
      caption,
      hashtags,
      media_url         AS "media_url",
      video_url         AS "videoUrl",
      media_type        AS "mediaType",
      scheduled_at      AS "scheduledAt",
      retry_count       AS "retryCount",
      max_retries       AS "maxRetries",
      metadata->>'carouselItems' AS "carouselItemsJson"
    FROM scheduled_posts
    WHERE
      status IN ('queued')
      AND retry_count < max_retries
      AND (
        scheduled_at   <= NOW()
        OR next_retry_at <= NOW()
      )
    ORDER BY scheduled_at ASC
    LIMIT ${BATCH_SIZE}
    FOR UPDATE SKIP LOCKED
  `

  if (posts.length === 0) {
    summary.elapsedMs = Date.now() - start
    return summary
  }

  // ── 2. Lock all fetched posts immediately (status=processing) ──
  const postIds = posts.map(p => p.id)
  await db.$executeRaw`
    UPDATE scheduled_posts
    SET status = 'processing', last_attempted_at = NOW()
    WHERE id = ANY(${postIds}::uuid[])
  `

  // ── 3. Process each post ──────────────────────────────────────
  for (const post of posts) {
    summary.processed++
    const result = await processPost(post)

    summary.results.push({
      postId:   post.id,
      status:   result.status,
      platform: post.platform,
      error:    result.error,
    })

    if (result.status === 'published') summary.published++
    else if (result.status === 'failed') summary.failed++
    else if (result.status === 'retrying') summary.retrying++
    else summary.skipped++
  }

  summary.elapsedMs = Date.now() - start
  return summary
}

// ── Process single post ───────────────────────────────────────
async function processPost(post: ScheduledPost): Promise<{
  status: 'published' | 'failed' | 'retrying' | 'skipped'
  error?: string
}> {
  // Get platform connection token
  const connection = await db.$queryRaw<Array<{
    access_token:    string | null
    refresh_token:   string | null
    status:         string
    account_id:      string | null
  }>>`
    SELECT
      access_token   AS "accessToken",
      refresh_token  AS "refresh_token:",
      status,
      account_id     AS "account_id"
    FROM platform_connections
    WHERE
      tenant_id = ${post.tenant_id}::uuid
      AND platform  = ${post.platform}
    LIMIT 1
  `

  const conn = connection[0]

  // No connection or expired → fail (not retryable)
  if (!conn || !conn.accessToken) {
    await markFailed(post.id, 'NO_CONNECTION', 'Platform tidak terhubung. Hubungkan ulang di Pengaturan.')
    return { status: 'failed', error: 'No connection' }
  }

  if (conn.status === 'expired' || conn.status === 'disconnected') {
    await markFailed(post.id, 'TOKEN_EXPIRED', 'Token expired. Sambungkan ulang akun Instagram kamu.')
    return { status: 'failed', error: 'Token expired' }
  }

  // Decrypt token
  let access_token: string
  try {
    accessToken = decryptToken(conn.accessToken)
  } catch {
    await markFailed(post.id, 'DECRYPT_ERROR', 'Gagal dekripsi token. Hubungi support.')
    return { status: 'failed', error: 'Decrypt error' }
  }

  // Get IG business account id
  const account_id = post.platformaccount_id ?? conn.account_id
  if (!account_id) {
    await markFailed(post.id, 'NO_ACCOUNT_ID', 'Instagram account ID tidak ditemukan.')
    return { status: 'failed', error: 'No account ID' }
  }

  // Parse carousel items
  let carouselItems: string[] | undefined
  try {
    if ((post as any).carouselItemsJson) {
      carouselItems = JSON.parse((post as any).carouselItemsJson)
    }
  } catch (err: any) {
    
    const nextRetry = new Date(Date.now() + 15 * 60 * 1000)
    
    await markFailed(
      post.id,
      err?.code ?? 'INVALID_CAROUSEL',
      err?.message ?? 'Invalid carousel data'
    )

    await sendPublishNotification({
      tenant_id: post.tenant_id,
      postId: post.id,
      contentId: post.contentId,
      platform: post.platform,
      status: 'failed',
      error_message: err.message,
      error_Code: err.code,
      retryAt: nextRetry,
      caption: post.caption ?? undefined,
      }).catch(() => {})

      return {
        status: 'failed',
        error: err?.message ?? 'Unknown error'
      }
    }


  // ── Call publisher ────────────────────────────────────────
let publishResult!: Awaited<ReturnType<typeof publishToInstagram>>

  if (post.platform === 'instagram' || post.platform === 'instagram_reels') {
    publishResult = await publishToInstagram({
      accessToken,
      account_id,
      mediaType:     (post.mediaType as MediaType) ?? 'IMAGE',
      media_url:      post.media_url ?? undefined,
      videoUrl:      post.videoUrl ?? undefined,
      caption:       post.caption ?? '',
      hashtags:      post.hashtags ?? [],
      carouselItems,
    })
  } else {
    await markFailed(
    post.id,
    'UNSUPPORTED_PLATFORM',
    'Platform tidak didukung'
  )
  return {
      status: 'failed',
      error: 'Unsupported platform'
  }
}
  // ── Handle result ─────────────────────────────────────────
    if (publishResult.success) {
        await markPublished(
          post.id,
          post,
          publishResult.platformPostId ?? '',
          publishResult.permalink
        )
      await syncToContent(post.contentId, publishResult.platformPostId, publishResult.permalink)
      return { status: 'published' }
    }
  
  // Failed — decide retry or give up
  const err = publishResult.error!
  const nextRetry = getNextRetryAt(post.retryCount + 1, DEFAULT_RETRY_CONFIG)
  const canRetry  = shouldRetry(post.retryCount + 1, err.code)

  if (canRetry && nextRetry) {
    await markRetry(post.id, err.code, err.message, post.retryCount + 1, nextRetry)
    return { status: 'retrying', error: err.message }
  } else {
    await markFailed(post.id, err.code, err.message)
    return { status: 'failed', error: 'Unsupported platform' }
  }

// ── DB update helpers ─────────────────────────────────────────
async function markPublished(
  id: string,
  post: ScheduledPost,
  platformPostId: string,
  permalink?: string,
) {
  await db.$executeRaw`
    UPDATE scheduled_posts 
    SET
      status             = 'published',
      published_at       = NOW(),
      platform_post_id   = ${platformPostId},
      platform_permalink = ${permalink ?? null},
      error_message      = NULL,
      error_code         = NULL
    WHERE id = ${id}::uuid
  `

// Setelah markPublished():
// Notify
  await sendPublishNotification({
    tenant_id: post.tenant_id,
    postId: post.id,
    contentId: post.contentId,
    platform: post.platform,

    status: 'published',

    permalink: permalink ?? undefined,
    platformPostId: platformPostId ?? undefined,

    caption: post.caption ?? undefined,
    media_url: post.media_url ?? undefined,
    scheduledAt: post.scheduledAt,
  }).catch(err =>
    console.error('[notify] Failed:', err)
  )
}

async function markRetry(
  id:           string,
  code:         string,
  message:      string,
  retryCount:   number,
  nextRetryAt:  Date,
) {
  await db.$executeRaw`
    UPDATE scheduled_posts SET
      status        = 'queued',
      retry_count   = ${retryCount}::smallint,
      next_retry_at = ${nextRetryAt}::timestamptz,
      error_message = ${message},
      error_code    = ${code}
    WHERE id = ${id}::uuid
  `
}

async function markFailed(id: string, code: string, message: string) {
  await db.$executeRaw`
    UPDATE scheduled_posts SET
      status        = 'failed',
      error_message = ${message},
      error_code    = ${code}
    WHERE id = ${id}::uuid
  `
}}


// Sync result back to content record
async function syncToContent(
  contentId:       string | null,
  platformPostId?: string,
  permalink?:      string,
) {
  if (!contentId) return
  try {
    await db.$executeRaw`
      UPDATE contents 
      SET
        status       = 'published',
        published_at = NOW()
      WHERE id = ${contentId}::uuid
    `
  } catch (err) {
    console.error('[syncToContent]', err)
  }
}