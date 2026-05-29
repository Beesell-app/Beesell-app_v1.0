// apps/web-app/lib/publish/retry.ts
// ── Retry & backoff logic ─────────────────────────────────────

export interface RetryConfig {
  maxRetries:   number    // default 3
  backoffMs:    number[]  // delay per attempt [5min, 15min, 60min]
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMs:  [
    5  * 60 * 1000,   // attempt 2: +5 min
    15 * 60 * 1000,   // attempt 3: +15 min
    60 * 60 * 1000,   // attempt 4: +60 min (if maxRetries > 3)
  ],
}

// ── Compute next retry time ───────────────────────────────────
export function getNextRetryAt(
  retryCount: number,
  config:     RetryConfig = DEFAULT_RETRY_CONFIG,
): Date | null {
  // retryCount = number of attempts already made
  // If we've hit max, no more retries
  if (retryCount >= config.maxRetries) return null

  const backoff = config.backoffMs[retryCount - 1] ?? config.backoffMs[config.backoffMs.length - 1]
  return new Date(Date.now() + backoff)
}

// ── Should retry? ─────────────────────────────────────────────
export function shouldRetry(
  retryCount: number,
  error_Code:  string,
  config:     RetryConfig = DEFAULT_RETRY_CONFIG,
): boolean {
  // Never retry auth errors (bad token = user needs to re-connect)
  const FATAL_CODES = [
    '190',   // invalid/expired access token
    '200',   // permission missing (not retryable)
    '10',    // app not approved
    '200',   // OAuthException
    'INVALID_TOKEN',
    'TOKEN_EXPIRED',
    'PERMISSION_DENIED',
  ]

  if (FATAL_CODES.includes(error_Code)) return false

  return retryCount < config.maxRetries
}

// ── Error classification ──────────────────────────────────────
export type PublishErrorType =
  | 'auth'          // bad/expired token → user must re-auth
  | 'rate_limit'    // API rate limited → retry with backoff
  | 'media'         // image/video issue → not retryable
  | 'content'       // caption/content violates policy
  | 'network'       // transient network error → retry
  | 'server'        // platform server error → retry
  | 'unknown'

export function classifyError(code: string | number, message: string): PublishErrorType {
  const c = String(code)

  // Token errors
  if (['190', '102'].includes(c) || message.includes('OAuthException')) return 'auth'
  if (message.toLowerCase().includes('token')) return 'auth'

  // Rate limits
  if (['4', '17', '32', '613'].includes(c) || message.includes('rate limit')) return 'rate_limit'

  // Media errors
  if (['2207001', '2207002', '2207003', '2207004'].includes(c)) return 'media'
  if (message.includes('media') || message.includes('image') || message.includes('video')) return 'media'

  // Content policy
  if (['368'].includes(c) || message.includes('spam') || message.includes('policy')) return 'content'

  // Server errors
  if (c.startsWith('5') || ['1', '2'].includes(c)) return 'server'

  return 'unknown'
}

// ── Build error record ────────────────────────────────────────
export interface PublishError {
  code:      string
  message:   string
  type:      PublishErrorType
  retryable: boolean
}

export function buildPublishError(code: string | number, message: string): PublishError {
  const type = classifyError(code, message)
  return {
    code:      String(code),
    message,
    type,
    retryable: type !== 'auth' && type !== 'media' && type !== 'content',
  }
}