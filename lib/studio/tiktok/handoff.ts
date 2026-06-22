// lib/studio/tiktok/handoff.ts
// ══════════════════════════════════════════════════════════════
// BEESELL AI — HANDOFF UGC → TIKTOK PUBLISH
// ──────────────────────────────────────────────────────────────
// Kontrak data antar-halaman (sessionStorage). Halaman sumber
// (UGC Video / Face Swap / dll) menulis handoff lalu navigasi ke
// /studio/video/tiktok. Halaman TikTok meng-konsumsi & auto-isi.
//
// Catatan: caption sebaiknya SUDAH lengkap (termasuk hashtag),
// karena title TikTok = caption apa adanya (tanpa append ganda).
// ══════════════════════════════════════════════════════════════

export interface TikTokPublishHandoff {
  videoUrl:     string       // URL .mp4 publik (mis. hasil render di R2)
  caption?:     string       // caption final siap pakai (boleh ada hashtag)
  productName?: string       // opsional, untuk konteks
  source?:      string       // 'ugc' | 'face-swap' | 'model-swap' | ...
  ts?:          number       // diisi otomatis saat set
}

const KEY = 'beesell:tiktok-publish-handoff'
const TTL_MS = 30 * 60_000   // handoff kedaluwarsa 30 menit

// ── Tulis handoff (dipanggil di halaman sumber sebelum navigasi) ──
export function setPublishHandoff(data: TikTokPublishHandoff): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ ...data, ts: Date.now() }))
  } catch { /* sessionStorage tidak tersedia → abaikan */ }
}

// ── Ambil + hapus handoff (dipanggil sekali di halaman TikTok) ──
export function consumePublishHandoff(): TikTokPublishHandoff | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    window.sessionStorage.removeItem(KEY)
    const data = JSON.parse(raw) as TikTokPublishHandoff
    if (data?.ts && Date.now() - data.ts > TTL_MS) return null
    return data?.videoUrl ? data : null
  } catch {
    return null
  }
}

// ── Intip handoff tanpa menghapus (opsional) ──────────────────
export function peekPublishHandoff(): TikTokPublishHandoff | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as TikTokPublishHandoff
    if (data?.ts && Date.now() - data.ts > TTL_MS) return null
    return data?.videoUrl ? data : null
  } catch {
    return null
  }
}