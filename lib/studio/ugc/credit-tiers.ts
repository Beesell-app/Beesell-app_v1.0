// lib/studio/ugc/credit-tiers.ts
// ══════════════════════════════════════════════════════════════
// UGC Video — Single Source of Truth: durasi → segmen → kredit → COGS
// Dipakai BERSAMA oleh halaman (display) & route (penagihan) supaya
// angka yang dilihat user = angka yang ditagih server.
// ══════════════════════════════════════════════════════════════
//
// Video API generate per-segmen 10 detik. Durasi hasil dikunci oleh
// PANJANG AUDIO (= panjang skrip), bukan jumlah segmen. Segmen = unit
// billing/COGS. Maka skrip di-size ke (durasi × WORDS_PER_SECOND) agar
// audio ≈ durasi → lipsync API = panjang audio → hasil = durasi yang diset.

export const SEGMENT_SECONDS     = 10
export const CREDIT_PER_SEGMENT  = 10
export const COGS_RP_PER_SEGMENT = 2544
export const WORDS_PER_SECOND    = 2.3

export type UgcDurationSec = 15 | 30 | 60

export interface UgcCost {
  duration:    number  // detik
  segments:    number  // ceil(duration / 10)
  credits:     number  // segments × 10
  cogsRp:      number  // segments × 2544
  targetWords: number  // round(duration × 2.3) — untuk sizing skrip
}

export function ugcCost(duration: number): UgcCost {
  const d = Number(duration) || SEGMENT_SECONDS
  const segments = Math.max(1, Math.ceil(d / SEGMENT_SECONDS))
  return {
    duration:    d,
    segments,
    credits:     segments * CREDIT_PER_SEGMENT,
    cogsRp:      segments * COGS_RP_PER_SEGMENT,
    targetWords: Math.round(d * WORDS_PER_SECOND),
  }
}

export const formatRp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')