// apps/web-app/lib/platform/token-refresh-job.ts
// ── Token refresh logic ────────────────────────────────────────
// Called from:
//   1. /api/oauth/token-refresh (Vercel cron or manual trigger)
//   2. Direct import in any server context
import { db }                       from '@/lib/db'
import { getPlatformAdapter }       from './adapter'
import { decryptToken, encryptToken } from './token-encryption'
import { OAuthError }               from './instagram'

export interface RefreshResult {
  tenant_id:  string
  platform:  string
  status:    'refreshed' | 'skipped' | 'failed' | 'no_token'
  error?:    string
}

// ── Refresh single connection ─────────────────────────────────
export async function refreshConnectionToken(
  connectionId: string,
): Promise<RefreshResult> {
  const conn = await db.platformConnection.findUnique({
    where:  { id: connectionId },
    select: {
      id:             true,
      tenant_id:       true,
      platform:       true,
      status:         true,
      access_token:    true,
      refresh_token:   true,
      token_expires_at: true,
    },
  })

  if (!conn) return { tenant_id: '', platform: '', status: 'failed', error: 'Not found' }

  // Already disconnected/error — skip
  if (conn.status === 'disconnected') {
    return { tenant_id: conn.tenant_id, platform: conn.platform, status: 'skipped' }
  }

  if (!conn.accessToken) {
    return { tenant_id: conn.tenant_id, platform: conn.platform, status: 'no_token' }
  }

  try {
    const adapter = getPlatformAdapter(conn.platform)

    // Decrypt current tokens
    const currentAccessToken  = decryptToken(conn.accessToken)
    const currentrefresh_token: = conn.refresh_token: ? decryptToken(conn.refresh_token:) : ''

    // Call adapter refresh
    const newTokens = await adapter.refreshAccessToken({
      access_token:  currentAccessToken,
      refresh_token: currentrefresh_token:,
    })

    // Encrypt new tokens
    const encAccessToken  = encryptToken(newTokens.accessToken)
    const encrefresh_token: = newTokens.refresh_token: ? encryptToken(newTokens.refresh_token:) : conn.refresh_token:

    // Update DB
    await db.platformConnection.update({
      where: { id: connectionId },
      data: {
        access_token:    encAccessToken,
        refresh_token:   encrefresh_token:,
        token_expires_at: newTokens.expiresAt ?? null,
        status:         'connected',
        last_verified_at: new Date(),
        error_message:   null,
        error_Code:      null,
      },
    })

    console.log(`[token-refresh] ✓ Refreshed ${conn.platform} for tenant ${conn.tenant_id.slice(0, 8)}`)
    return { tenant_id: conn.tenant_id, platform: conn.platform, status: 'refreshed' }

  } catch (err: any) {
    const isAuth = err instanceof OAuthError && err.type === 'auth'
    const msg    = err instanceof OAuthError ? err.message : String(err)

    // If auth error → mark as expired (needs re-auth by user)
    await db.platformConnection.update({
      where: { id: connectionId },
      data: {
        status:       isAuth ? 'expired' : 'error',
        error_message: msg,
        error_Code:    err instanceof OAuthError ? err.code : 'REFRESH_ERROR',
      },
    })

    console.error(`[token-refresh] ✗ Failed ${conn.platform} for tenant ${conn.tenant_id.slice(0, 8)}: ${msg}`)
    return { tenant_id: conn.tenant_id, platform: conn.platform, status: 'failed', error: msg }
  }
}

// ── Refresh all connections expiring soon (batch) ─────────────
export async function refreshExpiringSoonTokens(options: {
  dryRun?:        boolean
  thresholdDays?: number
}): Promise<{
  checked:   number
  refreshed: number
  failed:    number
  results:   RefreshResult[]
}> {
  const thresholdDays = options.thresholdDays ?? 7
  const cutoffDate    = new Date(Date.now() + thresholdDays * 24 * 60 * 60 * 1000)

  // Find connections where token expires within threshold
  const expiring = await db.platformConnection.findMany({
    where: {
      deleted_at:  null,
      status:     { in: ['connected', 'expired'] },
      access_token: { not: null },
      OR: [
        // Expires within threshold days
        { token_expires_at: { lte: cutoffDate } },
        // No expiry recorded (assume needs refresh)
        { token_expires_at: null },
      ],
    },
    select: {
      id:             true,
      tenant_id:       true,
      platform:       true,
      token_expires_at: true,
      status:         true,
    },
    orderBy: { token_expires_at: 'asc' },
  })

  console.log(`[token-refresh] Found ${expiring.length} connections to refresh`)

  if (options.dryRun) {
    return {
      checked:   expiring.length,
      refreshed: 0,
      failed:    0,
      results:   expiring.map(c => ({ tenant_id: c.tenant_id, platform: c.platform, status: 'skipped' })),
    }
  }

  // Refresh with concurrency limit (avoid rate limits)
  const results: RefreshResult[] = []
  const BATCH_SIZE = 5

  for (let i = 0; i < expiring.length; i += BATCH_SIZE) {
    const batch = expiring.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map(conn => refreshConnectionToken(conn.id)),
    )

    for (const r of batchResults) {
      results.push(r.status === 'fulfilled' ? r.value : {
        tenant_id: '', platform: '', status: 'failed', error: String(r.reason),
      })
    }

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < expiring.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return {
    checked:   expiring.length,
    refreshed: results.filter(r => r.status === 'refreshed').length,
    failed:    results.filter(r => r.status === 'failed').length,
    results,
  }
}