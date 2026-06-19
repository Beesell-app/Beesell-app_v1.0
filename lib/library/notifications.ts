// lib/library/notifications.ts
// ══════════════════════════════════════════════════════════════
// NOTIFICATION SERVICE — Email alerts for library & plan events
// Uses Resend API (already configured for auth emails)
// ══════════════════════════════════════════════════════════════

import type { NotificationType } from './types'
import { fmtBytes, fmtDate } from './types'

const RESEND_API = 'https://api.resend.com/emails'
const FROM_EMAIL = 'BeeSell AI <notif@beesell.ai>'
const BRAND_COLOR = '#F59E0B'

// ── Email template base ───────────────────────────────────────
function emailBase(title: string, body: string, cta?: { label: string; url: string }): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;overflow:hidden;max-width:100%;">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="font-size:24px;">🐝</span>
              <span style="font-size:18px;font-weight:800;color:#FFFFFF;letter-spacing:-0.03em;margin-left:8px;">BeeSell <span style="opacity:.9">AI</span></span>
            </td>
          </tr>
        </table>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:28px 32px;">
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.02em;">${title}</h1>
        ${body}
        ${cta ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr><td>
            <a href="${cta.url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#F59E0B,#D97706);color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">${cta.label} →</a>
          </td></tr>
        </table>` : ''}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB;">
        <p style="margin:0;font-size:11px;color:#9CA3AF;">
          © 2025 BeeSell AI · Platform AI Visual untuk Seller Indonesia 🇮🇩<br>
          <a href="{{unsubscribe_url}}" style="color:#9CA3AF;">Berhenti berlangganan notifikasi</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Email templates ───────────────────────────────────────────
export interface NotificationPayload {
  type:         NotificationType
  user_email:   string
  user_name:    string
  plan:         string
  // Storage
  used_bytes?:  number
  limit_bytes?: number
  pct_used?:    number
  // Plan
  expires_at?:  string
  days_left?:   number
  // Assets
  asset_count?: number
  // Quota
  quota_type?:  string
  quota_used?:  number
  quota_limit?: number
}

function buildEmail(payload: NotificationPayload): { subject: string; html: string } | null {
  const name     = payload.user_name?.split(' ')[0] || 'Seller'
  const planLabel = payload.plan?.charAt(0).toUpperCase() + (payload.plan?.slice(1) ?? '')
  const dashUrl  = process.env.NEXT_PUBLIC_APP_URL + '/library'
  const billingUrl = process.env.NEXT_PUBLIC_APP_URL + '/billing'
  const storageUrl = process.env.NEXT_PUBLIC_APP_URL + '/library'

  switch (payload.type) {

    // ── Storage 80% ────────────────────────────────────────────
    case 'storage_80pct':
      return {
        subject: `⚠️ Storage Asset Library kamu sudah 80% penuh`,
        html: emailBase(
          `Storage 80% Penuh — Segera Tambah Kapasitas`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Storage Asset Library BeeSell AI kamu sudah mencapai <strong style="color:#F59E0B;">${payload.pct_used}%</strong> dari total kapasitas plan <strong>${planLabel}</strong>.</p>
          <table width="100%" cellpadding="12" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;margin-bottom:16px;">
            <tr>
              <td><strong style="font-size:13px;color:#92400E;">💾 Kapasitas Terpakai</strong><br><span style="font-size:22px;font-weight:800;color:#111827;">${fmtBytes(payload.used_bytes ?? 0)}</span> / ${fmtBytes(payload.limit_bytes ?? 0)}</td>
            </tr>
          </table>
          <p style="font-size:13px;color:#6B7280;line-height:1.6;margin:0 0 8px;">Saat storage penuh, kamu tidak bisa menyimpan konten baru. Upgrade plan untuk mendapat kapasitas lebih besar.</p>
          <ul style="font-size:13px;color:#374151;margin:0 0 12px;padding-left:16px;line-height:1.8;">
            <li>Basic: 5 GB storage</li><li>Pro: 20 GB storage</li><li>Business: 100 GB storage</li>
          </ul>`,
          { label:'Upgrade Plan Sekarang', url:billingUrl }
        ),
      }

    // ── Storage 95% ────────────────────────────────────────────
    case 'storage_95pct':
      return {
        subject: `🔴 URGENT: Storage kamu hampir penuh (${payload.pct_used}%)`,
        html: emailBase(
          `Storage Hampir Penuh — Tindakan Diperlukan!`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="font-size:14px;color:#B91C1C;font-weight:700;margin:0 0 4px;">⚠️ Storage kamu sudah ${payload.pct_used}% penuh!</p>
            <p style="font-size:13px;color:#7F1D1D;margin:0;">Tersisa hanya <strong>${fmtBytes(payload.limit_bytes! - payload.used_bytes!)}</strong> lagi. Segera upgrade atau hapus file yang tidak diperlukan.</p>
          </div>
          <p style="font-size:13px;color:#6B7280;line-height:1.6;margin:0;">Ketika storage penuh: konten baru tidak bisa disimpan, dan hasil generate tidak akan masuk ke Library.</p>`,
          { label:'Upgrade Sekarang', url:billingUrl }
        ),
      }

    // ── Storage full ───────────────────────────────────────────
    case 'storage_full':
      return {
        subject: `🚨 Storage Asset Library PENUH — Konten tidak bisa disimpan`,
        html: emailBase(
          `Storage Penuh — Konten Baru Tidak Bisa Disimpan`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:14px;border-radius:0 8px 8px 0;margin-bottom:16px;">
            <p style="font-size:15px;font-weight:800;color:#DC2626;margin:0 0 4px;">Storage 100% PENUH</p>
            <p style="font-size:13px;color:#7F1D1D;margin:0;">Semua konten yang kamu generate tidak akan tersimpan sampai kapasitas tersedia.</p>
          </div>
          <p style="font-size:14px;color:#374151;line-height:1.7;">Solusi cepat:<br>
          1. <a href="${storageUrl}" style="color:#F59E0B;font-weight:600;">Hapus konten lama</a> yang tidak dibutuhkan<br>
          2. <a href="${billingUrl}" style="color:#F59E0B;font-weight:600;">Upgrade plan</a> untuk kapasitas lebih besar</p>`,
          { label:'Kelola Storage Sekarang', url:storageUrl }
        ),
      }

    // ── Plan expiry 14 days ────────────────────────────────────
    case 'plan_expiry_14days':
      return {
        subject: `📅 Plan BeeSell AI kamu akan berakhir dalam 14 hari`,
        html: emailBase(
          `Reminder: Plan ${planLabel} Berakhir 14 Hari Lagi`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">Plan <strong>${planLabel}</strong> kamu akan berakhir pada <strong style="color:#F59E0B;">${fmtDate(payload.expires_at!)}</strong> (${payload.days_left} hari lagi).</p>
          <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="font-size:13px;color:#92400E;font-weight:700;margin:0 0 6px;">⚠️ Jika tidak diperpanjang dalam 14 hari setelah expired:</p>
            <ul style="font-size:13px;color:#78350F;margin:0;padding-left:16px;line-height:1.8;">
              <li>Semua aset di Asset Library akan <strong>terhapus permanen</strong></li>
              <li>Akses ke fitur premium akan dinonaktifkan</li>
              <li>Data konten yang sudah di-generate tidak bisa dipulihkan</li>
            </ul>
          </div>
          <p style="font-size:13px;color:#6B7280;">Perpanjang sekarang untuk memastikan aset kamu aman.</p>`,
          { label:'Perpanjang Plan Sekarang', url:billingUrl }
        ),
      }

    // ── Plan expiry 3 days ─────────────────────────────────────
    case 'plan_expiry_3days':
      return {
        subject: `🔴 Plan kamu berakhir dalam 3 hari — Perpanjang sekarang!`,
        html: emailBase(
          `URGENT: Plan ${planLabel} Berakhir dalam 3 Hari!`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="font-size:15px;font-weight:800;color:#DC2626;margin:0 0 4px;">⏰ Hanya tersisa ${payload.days_left} hari!</p>
            <p style="font-size:13px;color:#7F1D1D;margin:0;">Plan ${planLabel} kamu berakhir pada <strong>${fmtDate(payload.expires_at!)}</strong>. Perpanjang sekarang untuk menghindari kehilangan aset.</p>
          </div>
          <p style="font-size:13px;color:#374151;line-height:1.7;margin:0;">Aset Library kamu (${payload.asset_count ?? 0} file) akan terhapus permanen <strong>14 hari</strong> setelah plan berakhir jika tidak diperpanjang.</p>`,
          { label:'Perpanjang Plan — Jangan Sampai Terlambat', url:billingUrl }
        ),
      }

    // ── Plan expiry 1 day ──────────────────────────────────────
    case 'plan_expiry_1day':
      return {
        subject: `🚨 LAST CHANCE: Plan kamu berakhir BESOK!`,
        html: emailBase(
          `Plan Berakhir Besok — Perpanjang Sekarang!`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <div style="background:#FEF2F2;border:2px solid #EF4444;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
            <p style="font-size:28px;margin:0 0 4px;">⏰</p>
            <p style="font-size:18px;font-weight:800;color:#DC2626;margin:0 0 4px;">Plan berakhir BESOK!</p>
            <p style="font-size:13px;color:#7F1D1D;margin:0;">${fmtDate(payload.expires_at!)}</p>
          </div>
          <p style="font-size:14px;color:#374151;line-height:1.7;">Jika tidak diperpanjang, aset kamu akan mulai countdown 14 hari menuju penghapusan permanen.</p>`,
          { label:'🚨 Perpanjang Plan SEKARANG', url:billingUrl }
        ),
      }

    // ── Plan expired ───────────────────────────────────────────
    case 'plan_expired':
      return {
        subject: `Plan BeeSell AI kamu telah berakhir — Aset aman 14 hari`,
        html: emailBase(
          `Plan Berakhir — Aset Kamu Masih Aman untuk 14 Hari`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">Plan <strong>${planLabel}</strong> kamu telah berakhir.</p>
          <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="font-size:14px;font-weight:700;color:#92400E;margin:0 0 6px;">⏳ Grace Period: 14 Hari</p>
            <p style="font-size:13px;color:#78350F;margin:0;">Aset kamu <strong>masih aman</strong> selama 14 hari ke depan. Perpanjang plan untuk mempertahankan semua aset.</p>
          </div>
          <p style="font-size:13px;color:#374151;line-height:1.7;">Setelah 14 hari, semua aset di Asset Library (<strong>${payload.asset_count ?? 0} file</strong>) akan <strong style="color:#EF4444;">terhapus permanen</strong> dan tidak bisa dipulihkan.</p>`,
          { label:'Perpanjang Plan — Selamatkan Asetmu', url:billingUrl }
        ),
      }

    // ── Assets expiry warning ──────────────────────────────────
    case 'assets_expiry_warning':
      return {
        subject: `⚠️ ${payload.asset_count} aset di Library akan dihapus dalam 14 hari`,
        html: emailBase(
          `Aset Library Akan Dihapus — Ambil Tindakan!`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="font-size:15px;font-weight:800;color:#DC2626;margin:0 0 4px;">🗑️ ${payload.asset_count} file akan terhapus permanen</p>
            <p style="font-size:13px;color:#7F1D1D;margin:0;">dalam 14 hari karena plan sudah tidak aktif.</p>
          </div>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Sebelum terhapus, kamu bisa:</p>
          <ol style="font-size:13px;color:#374151;margin:0 0 16px;padding-left:20px;line-height:1.9;">
            <li><a href="${storageUrl}" style="color:#F59E0B;font-weight:600;">Download semua aset</a> ke perangkat kamu</li>
            <li><a href="${billingUrl}" style="color:#F59E0B;font-weight:600;">Perpanjang plan</a> untuk mempertahankan semua aset</li>
          </ol>`,
          { label:'Download atau Perpanjang Sekarang', url:dashUrl }
        ),
      }

    // ── Assets deleted ─────────────────────────────────────────
    case 'assets_deleted':
      return {
        subject: `Aset BeeSell AI kamu telah dihapus`,
        html: emailBase(
          `Asset Library Telah Dibersihkan`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">Karena plan BeeSell AI sudah tidak aktif selama lebih dari 14 hari, <strong>${payload.asset_count} aset</strong> di Asset Library kamu telah dihapus secara permanen.</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">Jika ingin mulai menggunakan BeeSell AI kembali, kamu bisa berlangganan ulang kapan saja.</p>`,
          { label:'Berlangganan Kembali', url:billingUrl }
        ),
      }

    // ── Quota 80% ─────────────────────────────────────────────
    case 'quota_80pct':
      return {
        subject: `⚡ Kuota ${payload.quota_type} BeeSell AI kamu sudah 80% terpakai`,
        html: emailBase(
          `Kuota ${payload.quota_type} Hampir Habis`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">Kuota <strong>${payload.quota_type}</strong> kamu sudah terpakai <strong style="color:#F59E0B;">${payload.quota_used}</strong> dari <strong>${payload.quota_limit}</strong> (${Math.round((payload.quota_used!/payload.quota_limit!)*100)}%).</p>
          <p style="font-size:13px;color:#6B7280;margin:0;">Beli topup atau upgrade plan untuk mendapat lebih banyak kuota.</p>`,
          { label:'Beli Topup / Add-On', url:billingUrl }
        ),
      }

    // ── Quota depleted ─────────────────────────────────────────
    case 'quota_depleted':
      return {
        subject: `🚨 Kuota ${payload.quota_type} BeeSell AI HABIS`,
        html: emailBase(
          `Kuota ${payload.quota_type} Habis — Beli Topup`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="font-size:15px;font-weight:800;color:#DC2626;margin:0 0 4px;">⚠️ Kuota ${payload.quota_type} HABIS!</p>
            <p style="font-size:13px;color:#7F1D1D;margin:0;">Kamu tidak bisa generate ${payload.quota_type} baru sampai topup atau upgrade plan.</p>
          </div>`,
          { label:'Beli Topup Sekarang', url:billingUrl }
        ),
      }

    // ── Plan upgraded ──────────────────────────────────────────
    case 'plan_upgraded':
      return {
        subject: `🎉 Selamat! Plan BeeSell AI kamu berhasil di-upgrade ke ${planLabel}`,
        html: emailBase(
          `Upgrade ke ${planLabel} Berhasil! 🎉`,
          `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 12px;">Halo ${name},</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">Selamat! Kamu sekarang menggunakan plan <strong style="color:#F59E0B;">${planLabel}</strong>. Semua fitur dan kuota baru sudah aktif.</p>
          <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="font-size:13px;font-weight:700;color:#065F46;margin:0 0 6px;">✅ Yang kamu dapatkan:</p>
            <ul style="font-size:13px;color:#064E3B;margin:0;padding-left:16px;line-height:1.8;">
              <li>Kuota generate lebih besar</li>
              <li>Storage Asset Library diperbesar</li>
              <li>Akses fitur premium yang baru</li>
            </ul>
          </div>`,
          { label:'Mulai Buat Konten', url: process.env.NEXT_PUBLIC_APP_URL + '/studio' }
        ),
      }

    default:
      return null
  }
}

// ── Send email via Resend ─────────────────────────────────────
export async function sendNotificationEmail(payload: NotificationPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) { console.warn('[notify] RESEND_API_KEY not set'); return false }

  const email = buildEmail(payload)
  if (!email) { console.warn('[notify] No template for type:', payload.type); return false }

  try {
    const res = await fetch(RESEND_API, {
      method:  'POST',
      headers: { Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      payload.user_email,
        subject: email.subject,
        html:    email.html.replace('{{unsubscribe_url}}', `${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`),
      }),
    })
    return res.ok
  } catch (err) {
    console.error('[notify] Send failed:', err)
    return false
  }
}

// ── Queue notification (save to DB + send) ────────────────────
export async function queueNotification(
  supabase: any,
  payload: NotificationPayload
): Promise<void> {
  const email = buildEmail(payload)
  if (!email) return

  // Save to notification_log
  const { data: log } = await supabase.from('notification_log').insert({
    user_id:   payload.user_email, // resolved by app from user profile
    type:      payload.type,
    subject:   email.subject,
    body_html: email.html,
    metadata:  payload,
  }).select('id').single()

  // Send immediately
  const sent = await sendNotificationEmail(payload)

  // Mark as sent
  if (log?.id) {
    await supabase.from('notification_log')
      .update({ is_sent:sent, sent_at:new Date().toISOString() })
      .eq('id', log.id)
  }
}