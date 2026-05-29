// apps/web-app/app/api/jobs/[id]/stream/route.ts
// GET /api/jobs/[id]/stream — Server-Sent Events untuk progress update
//
// Frontend pakai EventSource untuk subscribe progress
// Server poll DB setiap 2 detik, push update kalau status berubah
// Stop streaming kalau status final (completed/failed) atau timeout 90 detik
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }            from '@/lib/db'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 120   // SSE bisa long-running (max 2 min)

const POLL_INTERVAL_MS = 2000        // poll DB setiap 2 detik
const TIMEOUT_MS       = 90_000       // timeout 90 detik (lebih dari ETA SDXL)

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: jobId } = await params

  // ── Auth check ─────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get tenant untuk authorization
  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: { tenant_id: true },
  })
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify job belongs to user's tenant
  const job = await db.aiJob.findFirst({
    where:  { id: jobId, tenant_id: dbUser.tenant_id },
    select: { id: true, contentId: true },
  })
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // ── SSE stream ─────────────────────────────────────────
  const encoder = new TextEncoder()
  const startedAt = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      let lastStatus: string | null = null
      let pollCount = 0

      // Helper: kirim event ke client
      const sendEvent = (event: string, data: any) => {
        const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        try {
          controller.enqueue(encoder.encode(msg))
        } catch {
          // controller sudah di-close (client disconnect)
        }
      }

      // Initial status
      sendEvent('connected', { jobId, timestamp: Date.now() })

      // Polling loop
      const pollInterval = setInterval(async () => {
        pollCount++

        try {
          // Check timeout
          if (Date.now() - startedAt > TIMEOUT_MS) {
            sendEvent('timeout', {
              message: 'Generation taking longer than expected. Cek detail konten nanti.',
            })
            clearInterval(pollInterval)
            controller.close()
            return
          }

          // Fetch latest job + content status
          const current = await db.aiJob.findUnique({
            where: { id: jobId },
            select: {
              status:       true,
              error_message: true,
              outputData:   true,
              contentId:    true,
              durationMs:   true,
            },
          })

          if (!current) {
            sendEvent('error', { message: 'Job lost' })
            clearInterval(pollInterval)
            controller.close()
            return
          }

          // Hanya kirim event kalau status berubah
          if (current.status !== lastStatus) {
            lastStatus = current.status

            // Status update event
            sendEvent('status', {
              status:    current.status,
              jobId,
              contentId: current.contentId,
              pollCount,
            })

            // Kalau final state, kirim hasil + close
            if (current.status === 'completed') {
              // Fetch image URL dari content
              const content = current.contentId
                ? await db.content.findUnique({
                    where: { id: current.contentId },
                    select: { media_url: true },
                  })
                : null

              const media_url = content?.media_url

              sendEvent('completed', {
                jobId,
                contentId:  current.contentId,
                media_url,
                durationMs: current.durationMs,
              })

              clearInterval(pollInterval)
              controller.close()
              return
            }

            if (current.status === 'failed') {
              sendEvent('failed', {
                jobId,
                error: current.error_message ?? 'Unknown error',
              })

              clearInterval(pollInterval)
              controller.close()
              return
            }
          }

          // Heartbeat untuk keep connection alive (proxy/CDN bisa close idle conn)
          if (pollCount % 5 === 0) {
            sendEvent('heartbeat', {
              status:  current.status,
              elapsed: Date.now() - startedAt,
            })
          }

        } catch (err: any) {
          console.error('[SSE]', err)
          sendEvent('error', { message: err.message })
        }
      }, POLL_INTERVAL_MS)

      // Cleanup saat client disconnect (signal abort)
      req.signal.addEventListener('abort', () => {
        clearInterval(pollInterval)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':       'text/event-stream',
      'Cache-Control':      'no-cache, no-transform',
      'Connection':         'keep-alive',
      'X-Accel-Buffering':  'no',  // disable nginx buffering
    },
  })
}