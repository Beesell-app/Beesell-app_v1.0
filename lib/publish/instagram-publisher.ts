// apps/web-app/lib/publish/instagram-publisher.ts
// ── Instagram Graph API publisher ────────────────────────────
// Supports: IMAGE, REELS, CAROUSEL
//
// Flow for IMAGE:
//   1. POST /{ig-account-id}/media        → get container_id
//   2. Poll container until ready
//   3. POST /{ig-account-id}/media_publish → get media_id
//
// Flow for REELS: same but type=REELS, video_url required
// Flow for CAROUSEL: create N child containers, then parent

import { buildPublishError, type PublishError } from './retry'

const GRAPH = 'https://graph.facebook.com/v18.0'
const POLL_INTERVAL_MS = 3_000
const POLL_MAX_ATTEMPTS = 20   // max 60 seconds

export type MediaType = 'IMAGE' | 'REELS' | 'CAROUSEL'

export interface PublishParams {
  access_token:   string
  account_id:     string    // IG Business Account ID
  mediaType:     MediaType
  // Content
  media_url?:     string
  videoUrl?:     string
  caption:       string
  hashtags?:     string[]
  // Carousel children (IMAGE urls)
  carouselItems?: string[]
  // Options
  locationId?:   string
  userTags?:     Array<{ username: string; x: number; y: number }>
}

export interface PublishResult {
  success:        boolean
  platformPostId?: string
  permalink?:     string
  error?:         PublishError
}

// ── Main publish function ─────────────────────────────────────
export async function publishToInstagram(params: PublishParams): Promise<PublishResult> {
  const { accessToken, account_id, mediaType } = params

  // Build full caption with hashtags
  const fullCaption = buildCaption(params.caption, params.hashtags)

  try {
    let mediaId: string

    if (mediaType === 'CAROUSEL' && params.carouselItems?.length) {
      mediaId = await publishCarousel(params, fullCaption)
    } else if (mediaType === 'REELS') {
      mediaId = await publishReels(params, fullCaption)
    } else {
      mediaId = await publishImage(params, fullCaption)
    }

    // Get permalink
    const permalink = await getPermalink(mediaId, accessToken)

    return { success: true, platformPostId: mediaId, permalink }

  } catch (err: any) {
    const code    = err.code    ?? err.error?.code    ?? 'UNKNOWN'
    const message = err.message ?? err.error?.message ?? 'Unknown error'
    return { success: false, error: buildPublishError(code, message) }
  }
}

// ── IMAGE publish ─────────────────────────────────────────────
async function publishImage(params: PublishParams, caption: string): Promise<string> {
  if (!params.media_url) throw new Error('media_url required for IMAGE post')

  // Step 1: Create container
  const containerBody: Record<string, string> = {
    media_url:    params.media_url,
    caption,
    access_token: params.accessToken,
  }

  if (params.locationId) containerBody.location_id = params.locationId

  const container = await graphPost(
    `/${params.account_id}/media`,
    containerBody,
  )

  const containerId = container.id
  if (!containerId) throw Object.assign(new Error('No container id returned'), { code: 'NO_CONTAINER' })

  // Step 2: Wait for container to be ready
  await pollUntilReady(containerId, params.accessToken)

  // Step 3: Publish
  const published = await graphPost(`/${params.account_id}/media_publish`, {
    creation_id:  containerId,
    access_token: params.accessToken,
  })

  if (!published.id) throw Object.assign(new Error('No media id returned'), { code: 'NO_MEDIA_ID' })
  return published.id
}

// ── REELS publish ─────────────────────────────────────────────
async function publishReels(params: PublishParams, caption: string): Promise<string> {
  if (!params.videoUrl) throw new Error('videoUrl required for REELS post')

  const container = await graphPost(`/${params.account_id}/media`, {
    media_type:   'REELS',
    video_url:    params.videoUrl,
    caption,
    access_token: params.accessToken,
  })

  await pollUntilReady(container.id, params.accessToken, POLL_MAX_ATTEMPTS * 2)  // video takes longer

  const published = await graphPost(`/${params.account_id}/media_publish`, {
    creation_id:  container.id,
    access_token: params.accessToken,
  })

  return published.id
}

// ── CAROUSEL publish ──────────────────────────────────────────
async function publishCarousel(params: PublishParams, caption: string): Promise<string> {
  const items = params.carouselItems ?? []
  if (items.length < 2) throw new Error('Carousel requires at least 2 images')
  if (items.length > 10) throw new Error('Carousel maximum 10 images')

  // Step 1: Create child containers
  const childIds: string[] = []
  for (const media_url of items) {
    const child = await graphPost(`/${params.account_id}/media`, {
      media_url:       media_url,
      is_carousel_item: 'true',
      access_token:    params.accessToken,
    })
    childIds.push(child.id)
  }

  // Step 2: Create parent container
  const parent = await graphPost(`/${params.account_id}/media`, {
    media_type:  'CAROUSEL',
    children:    childIds.join(','),
    caption,
    access_token: params.accessToken,
  })

  await pollUntilReady(parent.id, params.accessToken)

  // Step 3: Publish
  const published = await graphPost(`/${params.account_id}/media_publish`, {
    creation_id:  parent.id,
    access_token: params.accessToken,
  })

  return published.id
}

// ── Poll container status ─────────────────────────────────────
async function pollUntilReady(
  containerId: string,
  access_token: string,
  maxAttempts: number = POLL_MAX_ATTEMPTS,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await graphGet(`/${containerId}`, accessToken, {
      fields: 'status_code,status',
    })

    if (res.status_code === 'FINISHED') return
    if (res.status_code === 'ERROR' || res.status_code === 'EXPIRED') {
      throw Object.assign(
        new Error(`Container ${containerId} failed: ${res.status_code}`),
        { code: res.status_code },
      )
    }

    // INPROGRESS or IN_PROGRESS → wait
    await sleep(POLL_INTERVAL_MS)
  }

  throw Object.assign(
    new Error(`Container ${containerId} not ready after ${maxAttempts} polls`),
    { code: 'TIMEOUT' },
  )
}

// ── Get permalink ─────────────────────────────────────────────
async function getPermalink(mediaId: string, access_token: string): Promise<string | undefined> {
  try {
    const res = await graphGet(`/${mediaId}`, accessToken, { fields: 'permalink' })
    return res.permalink
  } catch {
    return undefined
  }
}

// ── Caption builder ───────────────────────────────────────────
function buildCaption(caption: string, hashtags?: string[]): string {
  if (!hashtags?.length) return caption
  const tags = hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')
  return `${caption}\n\n${tags}`
}

// ── Graph API helpers ─────────────────────────────────────────
async function graphPost(endpoint: string, body: Record<string, string>): Promise<any> {
  const res = await fetch(`${GRAPH}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams(body).toString(),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    const err = data.error ?? {}
    throw Object.assign(
      new Error(err.message ?? `Graph API error ${res.status}`),
      { code: String(err.code ?? res.status) },
    )
  }

  return data
}

async function graphGet(
  endpoint:    string,
  access_token: string,
  params:      Record<string, string> = {},
): Promise<any> {
  const url = new URL(`${GRAPH}${endpoint}`)
  url.searchParams.set('access_token', accessToken)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res  = await fetch(url.toString())
  const data = await res.json()

  if (!res.ok || data.error) {
    const err = data.error ?? {}
    throw Object.assign(
      new Error(err.message ?? `Graph API ${res.status}`),
      { code: String(err.code ?? res.status) },
    )
  }

  return data
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}