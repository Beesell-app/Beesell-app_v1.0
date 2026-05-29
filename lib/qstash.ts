// apps/web-app/lib/qstash.ts
// QStash dispatcher + webhook signature verification
// QStash = Upstash message queue dengan HTTP delivery
// https://upstash.com/docs/qstash/overall/getstarted
import { Client } from '@upstash/qstash'
import { Receiver } from '@upstash/qstash'

const QSTASH_TOKEN = process.env.QSTASH_TOKEN
const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY
const QSTASH_NEXT_SIGNING_KEY    = process.env.QSTASH_NEXT_SIGNING_KEY

if (!QSTASH_TOKEN) {
  console.warn('[qstash] QSTASH_TOKEN not set — async jobs akan gagal')
}

// ── Publisher ────────────────────────────────────────────────
export const qstash = new Client({
  token: QSTASH_TOKEN ?? '',
})

// ── Webhook receiver (untuk verify signature dari QStash) ────
export const qstashReceiver = QSTASH_CURRENT_SIGNING_KEY && QSTASH_NEXT_SIGNING_KEY
  ? new Receiver({
      currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey:    QSTASH_NEXT_SIGNING_KEY,
    })
  : null

// ── Verify QStash webhook signature ─────────────────────────
// Setiap request dari QStash punya header `Upstash-Signature`
// Verify untuk mencegah orang lain hit endpoint kita pretend-as-QStash
export async function verifyQStashSignature(
  signature: string | null,
  body: string,
  url: string,
): Promise<boolean> {
  if (!qstashReceiver) {
    console.error('[qstash] Receiver not configured')
    return false
  }
  if (!signature) return false

  try {
    const isValid = await qstashReceiver.verify({
      signature,
      body,
      url,
    })
    return isValid
  } catch (err) {
    console.error('[qstash] Signature verify failed:', err)
    return false
  }
}

// ── Dispatch job to worker endpoint ─────────────────────────
// QStash akan POST ke `url` dengan `body` setelah `delay` detik
// Kalau worker fail (5xx), QStash auto-retry sampai 3x dengan exponential backoff
export async function dispatchJob<T = any>(params: {
  url:        string                // worker endpoint full URL
  body:       T                     // payload akan di-JSON.stringify
  delay?:     number                 // detik (default 0 = immediate)
  retries?:   number                 // default 3
  deduplicationId?: string          // hindari double-dispatch
}): Promise<{ messageId: string }> {
  const result = await qstash.publishJSON({
    url:     params.url,
    body:    params.body,
    delay:   params.delay,
    retries: params.retries ?? 3,
    ...(params.deduplicationId && { deduplicationId: params.deduplicationId }),
  })

  return { messageId: result.messageId }
}