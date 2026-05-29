// apps/web-app/lib/notifications/sender.ts
// ── Notification sender ───────────────────────────────────────
// Called from publish engine after each post result.
// Sends: FCM web push + Resend email (both optional, fail-safe)
import { db } from '@/lib/db'

// ── Types ──────────────────────────────────────────────────
export interface PublishNotifPayload {
  tenant_id:    string
  postId:      string
  contentId?:  string | null
  platform:    string
  status:      'published' | 'failed'
  // Success
  permalink?:  string
  platformPostId?: string
  // Failure
  error_message?: string
  error_Code?:   string
  retryAt?:     Date | null
  // Content preview
  caption?:     string
  media_url?:    string
  scheduledAt?: Date
}

// ── Main entry point ──────────────────────────────────────
export async function sendPublishNotification(payload: PublishNotifPayload): Promise<void> {
  // Run both in parallel — neither blocks the other
  await Promise.allSettled([
    sendWebPush(payload),
    sendEmail(payload),
  ])
}

// ════════════════════════════════════════════════════════════
// WEB PUSH (FCM)
// ════════════════════════════════════════════════════════════
async function sendWebPush(payload: PublishNotifPayload): Promise<void> {
  // Get push tokens for this tenant
  const tokens = await db.$queryRaw<Array<{ token: string }>>`
    SELECT token FROM push_subscriptions
    WHERE tenant_id = ${payload.tenant_id}::uuid
      AND is_active = TRUE
    LIMIT 10
  `

  if (!tokens.length) return

  const isSuccess  = payload.status === 'published'
  const platformLabel = platformName(payload.platform)

  const notification = isSuccess ? {
    title: `✅ ${platformLabel} — Post Berhasil Dipublish!`,
    body:  `Konten kamu sudah live${payload.caption ? `: "${truncate(payload.caption, 60)}"` : ''}`,
    icon:  '/icon-192.png',
    data: {
      type:      'publish_success',
      url:       payload.permalink ?? '/scheduler',
      permalink: payload.permalink,
      postId:    payload.postId,
      platform:  payload.platform,
      tag:       `publish-${payload.postId}`,
    },
  } : {
    title: `❌ ${platformLabel} — Gagal Dipublish`,
    body:  payload.error_message
      ? `Error: ${truncate(payload.error_message, 80)}`
      : 'Terjadi kesalahan saat publish. Tap untuk retry.',
    icon:  '/icon-192.png',
    data: {
      type:     'publish_failed',
      url:      `/scheduler?failed=${payload.postId}`,
      postId:   payload.postId,
      platform: payload.platform,
      tag:      `publish-fail-${payload.postId}`,
    },
  }

  // Send via FCM HTTP v1 API
  const fcmResults = await Promise.allSettled(
    tokens.map(t => sendFcmMessage(t.token, notification)),
  )

  // Deactivate invalid tokens
  for (let i = 0; i < fcmResults.length; i++) {
    const result = fcmResults[i]
    if (result.status === 'rejected') {
      const err = (result as any).reason
      if (err?.code === 'messaging/registration-token-not-registered') {
        await db.$executeRaw`
          UPDATE push_subscriptions SET is_active = FALSE
          WHERE token = ${tokens[i].token}
        `.catch(() => {})
      }
    }
  }
}

async function sendFcmMessage(token: string, notification: any): Promise<void> {
  const serverKey = process.env.FIREBASE_SERVER_KEY
  if (!serverKey) {
    console.warn('[FCM] FIREBASE_SERVER_KEY not set — skipping push')
    return
  }

  // Use FCM HTTP v1 API (recommended over legacy)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) return

  const accessToken = await getFcmAccessToken()
  if (!accessToken) return

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: notification.title,
            body:  notification.body,
            image: notification.data?.media_url,
          },
          webpush: {
            notification: {
              title:   notification.title,
              body:    notification.body,
              icon:    notification.icon ?? '/icon-192.png',
              badge:   '/badge-72.png',
              tag:     notification.data?.tag,
              renotify: true,
              requireInteraction: notification.data?.type === 'publish_failed',
              actions: notification.data?.type === 'publish_success'
                ? [{ action: 'view_post', title: '🔗 Lihat Post' }]
                : [{ action: 'retry', title: '🔄 Coba Lagi' }],
            },
            fcm_options: {
              link: notification.data?.url ?? '/',
            },
          },
          data: Object.fromEntries(
            Object.entries(notification.data ?? {}).map(([k, v]) => [k, String(v ?? '')]),
          ),
        },
      }),
    },
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const code = body.error?.details?.[0]?.error_Code ?? body.error?.status
    throw Object.assign(new Error(body.error?.message ?? `FCM ${res.status}`), { code })
  }
}

// Get FCM access token via service account
// For MVP: use FIREBASE_SERVER_KEY (legacy) OR implement OAuth2 service account
async function getFcmAccessToken(): Promise<string | null> {
  // Option 1: Use legacy server key (simpler but deprecated)
  // Option 2: Use service account key + OAuth2
  // For MVP: use server key header (works with v1 API via workaround)

  // If using Google service account:
  try {
    const { GoogleAuth } = await import('google-auth-library')
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '{}'),
      scopes:      ['https://www.googleapis.com/auth/firebase.messaging'],
    })
    const client = await auth.getClient()
    const token  = await client.getAccessToken()
    return token.token ?? null
  } catch {
    // Fallback: skip push (don't crash publish engine)
    console.warn('[FCM] Could not get access token')
    return null
  }
}

// ════════════════════════════════════════════════════════════
// EMAIL (Resend)
// ════════════════════════════════════════════════════════════
async function sendEmail(payload: PublishNotifPayload): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  // Get tenant email
  const tenant = await db.$queryRaw<[{ email: string | null; name: string | null }]>`
    SELECT u.email, u.name
    FROM users u
    WHERE u.tenant_id = ${payload.tenant_id}::uuid
      AND u.role = 'owner'
    LIMIT 1
  `

  const toEmail = tenant[0]?.email
  if (!toEmail) return

  // Check notification preferences
  const prefs = await db.$queryRaw<[{ email_publish: boolean; email_failed: boolean }]>`
    SELECT
      COALESCE((preferences->>'email_publish')::boolean, TRUE) AS email_publish,
      COALESCE((preferences->>'email_failed')::boolean, TRUE)  AS email_failed
    FROM notification_preferences
    WHERE tenant_id = ${payload.tenant_id}::uuid
    LIMIT 1
  `.catch(() => [{ email_publish: true, email_failed: true }])

  const pref = prefs[0] ?? { email_publish: true, email_failed: true }

  if (payload.status === 'published' && !pref.email_publish) return
  if (payload.status === 'failed'    && !pref.email_failed)   return

  const isSuccess   = payload.status === 'published'
  const userName    = tenant[0]?.name?.split(' ')[0] ?? 'Kak'
  const platformLabel = platformName(payload.platform)

  const html = isSuccess
    ? buildSuccessEmail({ userName, platformLabel, payload })
    : buildFailedEmail({ userName, platformLabel, payload })

  const subject = isSuccess
    ? `✅ Post ${platformLabel} berhasil dipublish — BeeSell AI`
    : `❌ Post ${platformLabel} gagal — BeeSell AI`

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'BeeSell AI <notif@beesell.id>',
      to:      toEmail,
      subject,
      html,
    }),
  })
}

// ════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ════════════════════════════════════════════════════════════
function buildSuccessEmail({ userName, platformLabel, payload }: {
  userName: string; platformLabel: string; payload: PublishNotifPayload
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beesell.id'

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Berhasil Dipublish</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <div style="width:32px;height:32px;background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:9px;display:inline-block;vertical-align:middle;"></div>
            <span style="font-size:18px;font-weight:700;color:#0F172A;vertical-align:middle;">BeeSell AI</span>
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">

          <!-- Success banner -->
          <div style="background:linear-gradient(135deg,#15803D,#16A34A);padding:28px 32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:10px;">🎉</div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
              Post Berhasil Dipublish!
            </h1>
            <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,.8);">
              ${platformLabel}
            </p>
          </div>

          <!-- Body -->
          <div style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
              Halo ${userName}! Konten kamu sudah berhasil dipublish ke <strong>${platformLabel}</strong>.
            </p>

            ${payload.caption ? `
            <!-- Caption preview -->
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #2563EB;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Caption</p>
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">${truncate(payload.caption, 200)}</p>
            </div>
            ` : ''}

            ${payload.media_url ? `
            <!-- Image thumbnail -->
            <div style="text-align:center;margin-bottom:20px;">
              <img src="${payload.media_url}" alt="Post image" style="max-width:100%;max-height:200px;object-fit:cover;border-radius:10px;border:1px solid #E2E8F0;">
            </div>
            ` : ''}

            <!-- Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#F8FAFC;">
                <td style="padding:10px 14px;font-size:12px;color:#64748B;border-bottom:1px solid #E2E8F0;">Platform</td>
                <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#0F172A;border-bottom:1px solid #E2E8F0;">${platformLabel}</td>
              </tr>
              ${payload.scheduledAt ? `
              <tr>
                <td style="padding:10px 14px;font-size:12px;color:#64748B;">Waktu Jadwal</td>
                <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#0F172A;">
                  ${new Date(payload.scheduledAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB
                </td>
              </tr>
              ` : ''}
            </table>

            <!-- CTA -->
            <div style="text-align:center;">
              ${payload.permalink ? `
              <a href="${payload.permalink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;margin-bottom:12px;">
                🔗 Lihat Post di ${platformLabel}
              </a>
              <br>
              ` : ''}
              <a href="${appUrl}/library" style="display:inline-block;padding:10px 24px;background:#F8FAFC;color:#2563EB;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #BFDBFE;">
                Buka Content Library →
              </a>
            </div>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94A3B8;">
            Email ini dikirim oleh BeeSell AI.<br>
            <a href="${appUrl}/settings" style="color:#64748B;">Atur preferensi notifikasi</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildFailedEmail({ userName, platformLabel, payload }: {
  userName: string; platformLabel: string; payload: PublishNotifPayload
}): string {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beesell.id'
  const retryLink = `${appUrl}/scheduler?retry=${payload.postId}`

  // Human-readable error hint
  const errorHint = getErrorHint(payload.error_Code)

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Gagal Dipublish</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:18px;font-weight:700;color:#0F172A;">BeeSell AI</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #FECACA;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">

          <!-- Error banner -->
          <div style="background:linear-gradient(135deg,#B91C1C,#DC2626);padding:28px 32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:10px;">⚠️</div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">
              Post Gagal Dipublish
            </h1>
            <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,.8);">
              ${platformLabel}
            </p>
          </div>

          <!-- Body -->
          <div style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
              Halo ${userName}, ada masalah saat mempublish konten kamu ke <strong>${platformLabel}</strong>.
            </p>

            <!-- Error details -->
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;">
                Error ${payload.error_Code ? `(${payload.error_Code})` : ''}
              </p>
              <p style="margin:0 0 10px;font-size:13px;color:#7F1D1D;line-height:1.5;">
                ${payload.error_message ?? 'Terjadi kesalahan yang tidak diketahui.'}
              </p>
              ${errorHint ? `
              <p style="margin:0;font-size:12px;color:#92400E;background:#FFFBEB;border:1px solid #FDE68A;padding:8px 10px;border-radius:6px;">
                💡 <strong>Tips:</strong> ${errorHint}
              </p>
              ` : ''}
            </div>

            ${payload.retryAt ? `
            <p style="font-size:13px;color:#64748B;margin-bottom:20px;">
              🔄 Sistem akan otomatis mencoba lagi pada:
              <strong>${new Date(payload.retryAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB</strong>
            </p>
            ` : `
            <p style="font-size:13px;color:#64748B;margin-bottom:20px;">
              Semua percobaan retry sudah habis. Kamu perlu jadwalkan ulang atau publish manual.
            </p>
            `}

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${retryLink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#DC2626,#B91C1C);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;margin-bottom:12px;">
                🔄 Coba Lagi Sekarang
              </a>
              <br>
              <a href="${appUrl}/settings/connections" style="display:inline-block;padding:10px 20px;background:#F8FAFC;color:#64748B;text-decoration:none;border-radius:10px;font-size:12px;font-weight:600;border:1px solid #E2E8F0;">
                Cek Koneksi Platform →
              </a>
            </div>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94A3B8;">
            <a href="${appUrl}/settings" style="color:#64748B;">Atur preferensi notifikasi</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Helpers ───────────────────────────────────────────────────
function platformName(platform: string): string {
  const map: Record<string, string> = {
    instagram:       'Instagram Feed',
    instagram_reels: 'Instagram Reels',
    tiktok:          'TikTok',
  }
  return map[platform] ?? platform
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}

function getErrorHint(code?: string | null): string {
  if (!code) return ''
  const hints: Record<string, string> = {
    '190':        'Token Instagram kamu sudah expired. Hubungkan ulang akun di Pengaturan → Koneksi Platform.',
    '200':        'Izin publish belum disetujui. Pastikan akun Instagram adalah Business/Creator.',
    '10':         'App belum disetujui Meta. Hubungi support BeeSell.',
    'NO_CONNECTION': 'Akun platform belum terhubung. Buka Pengaturan → Koneksi Platform.',
    'TOKEN_EXPIRED': 'Token Instagram expired. Hubungkan ulang di Pengaturan → Koneksi Platform.',
    '2207001':    'URL gambar tidak bisa diakses Instagram. Pastikan gambar tersimpan di storage publik.',
    '2207003':    'Format gambar tidak didukung. Gunakan JPEG, PNG min 320px.',
    '368':        'Caption melanggar kebijakan Instagram. Edit caption dan coba lagi.',
    'TIMEOUT':    'Proses upload timeout. Coba lagi dengan koneksi yang lebih stabil.',
  }
  return hints[code] ?? ''
}