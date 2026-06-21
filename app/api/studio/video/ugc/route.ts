// app/api/studio/video/ugc/route.ts
// ══════════════════════════════════════════════════════════════
// UGC Video Generator API — terintegrasi enforce-layer (admin-dashboard)
//
//   action=script  → buat skrip via Claude (GRATIS utk user, di-size ke durasi)
//   action=default → generate video (kredit BERJENJANG per durasi)
//
// Penagihan: segments = ceil(durasi/10), kredit = segments×10,
//            COGS = segments×2544 (lihat lib/studio/ugc/credit-tiers.ts)
// Superuser: bypass charge TAPI COGS tetap dicatat (tracking infra cost).
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { enforceToolAccess, consumeCredits, logToolUsage } from '@/lib/tools/enforce'
import { ugcCost, WORDS_PER_SECOND } from '@/lib/studio/ugc/credit-tiers'

export const runtime = 'nodejs'
export const maxDuration = 300

// ⚠️ Harus sama PERSIS dengan id fitur UGC di
//    components/dashboard/studio-menu-config.ts
const TOOL_ID    = 'ugc-generator'
const USD_PER_RP = 1 / 16500   // konversi COGS rupiah → costUsd (ai_usage_daily)

// ── Script generation (Claude) ────────────────────────────────


// Default Haiku (sesuai TODO "generateLight" — hemat COGS untuk volume tinggi).
// Mau copy/hook lebih tajam? ganti ke 'claude-sonnet-4-6'.
const SCRIPT_MODEL = 'claude-haiku-4-5-20251001'

// ⚠️ PERKIRAAN — ganti dgn harga aktual model yang kamu pakai (USD / 1 juta token)
const SCRIPT_USD_PER_MTOK_IN  = 1.0
const SCRIPT_USD_PER_MTOK_OUT = 5.0

// ══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const action   = new URL(req.url).searchParams.get('action') || 'default'
    const supabase = await createClient()

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user?.id) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu', code: 'auth_failed' },
        { status: 401 }
      )
    }

    return action === 'script'
      ? handleScript(req, supabase, user.id)
      : handleVideo(req, supabase, user.id)
  } catch (err: any) {
    console.error('[ugc-api] fatal:', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

// ══════════════════════════════════════════════════════════════
// ACTION 1 — SKRIP (Claude, GRATIS utk user, decoupled dari avatar/preset)
// ══════════════════════════════════════════════════════════════
async function handleScript(req: NextRequest, supabase: any, userId: string) {
  const startedAt = Date.now()
console.log('ANTHROPIC key prefix:', process.env.ANTHROPIC_API_KEY?.slice(0, 8))
  if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY belum di-set di environment.' }, { status: 500 })
    }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })   // ⬅️ pindah ke sini

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const {
    productName, productCategory, targetMarket, mainBenefit, painPoint,
    contentType, videoPreset, language = 'indonesia', accent, duration = 30,
  } = body ?? {}

  // Skrip di-size ke durasi (SSoT credit-tiers) → audio ≈ durasi → video = durasi
  const dur = Math.max(10, Math.min(120, Number(duration) || 30))
  const { targetWords } = ugcCost(dur)

  // ── Rangkai fakta produk (yang terisi saja) — productName tidak wajib,
  //    tapi makin lengkap, makin tajam skripnya. ──
  const facts: string[] = []
  if (productName)     facts.push(`Nama produk: ${productName}`)
  if (productCategory) facts.push(`Kategori: ${productCategory}`)
  if (targetMarket)    facts.push(`Target pembeli: ${targetMarket}`)
  if (mainBenefit)     facts.push(`Keunggulan utama: ${mainBenefit}`)
  if (painPoint)       facts.push(`Masalah yang diselesaikan: ${painPoint}`)
  if (contentType)     facts.push(`Tujuan/format konten: ${contentType}`)
  if (videoPreset)     facts.push(`Gaya video: ${videoPreset}`)
  if (accent)          facts.push(`Aksen/tone: ${accent}`)

  const productBlock = facts.length
    ? facts.join('\n')
    : 'Detail produk belum diisi — buat skrip UGC umum namun tetap kuat untuk produk e-commerce.'

  const system = [
    'Kamu adalah BeeSell AI, penulis skrip UGC paling jago untuk seller e-commerce Indonesia (TikTok Shop, Shopee, Reels).',
    'Tugasmu: menulis SKRIP YANG DIUCAPKAN — kata-kata persis yang diucapkan orang di depan kamera. Bukan storyboard, bukan arahan kamera.',
    '',
    'Terapkan struktur ini secara natural (JANGAN tulis labelnya):',
    '1. Hook 3 detik pertama yang bikin berhenti scroll.',
    '2. Sentuh pain point yang relate dengan penonton.',
    '3. Produk sebagai solusi + benefit terbesar.',
    '4. Social proof ringan (jangan mengarang angka palsu).',
    '5. Urgency halus bila relevan.',
    '6. CTA jelas (cek keranjang kuning / klik link / checkout).',
    '',
    'Gaya: ngobrol natural seperti manusia asli, hangat, meyakinkan. BUKAN robotik, BUKAN hardsell lebay.',
    'JANGAN pakai heading, label, tanda kutip pembungkus, emoji berlebihan, atau markdown. Keluarkan HANYA teks skrip yang diucapkan.',
  ].join('\n')

  const userPrompt = [
    `Tulis 1 skrip UGC dalam ${languageName(language)}.`,
    `Panjang ±${targetWords} kata (≈${dur} detik saat diucapkan), jaga rentang ±15%.`,
    '',
    'Detail produk:',
    productBlock,
    '',
    'Keluarkan hanya naskah yang diucapkan, siap diedit. Tanpa basa-basi pembuka.',
  ].join('\n')

  let script = ''
  let usage = { input: 0, output: 0 }
  try {
    const msg = await anthropic.messages.create({
      model: SCRIPT_MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    })
    script = msg.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('\n').trim()
    usage = { input: msg.usage?.input_tokens ?? 0, output: msg.usage?.output_tokens ?? 0 }
  } catch (e: any) {
    console.error('[ugc-api] script gen error:', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Gagal menghubungi AI.' }, { status: 502 })
  }

  if (!script) {
    return NextResponse.json({ error: 'AI tidak menghasilkan skrip. Coba lagi.' }, { status: 502 })
  }

  // ── COGS log token Claude — GRATIS utk user, tapi infra cost tetap dicatat.
  //    Fail-open: kalau logging error, generasi tetap sukses. ──
  const costUsd = (usage.input  / 1_000_000) * SCRIPT_USD_PER_MTOK_IN
                + (usage.output / 1_000_000) * SCRIPT_USD_PER_MTOK_OUT
  try {
    await logToolUsage(
      supabase, userId, TOOL_ID, 'claude-script',
      Number(costUsd.toFixed(6)), Date.now() - startedAt,
    )
  } catch (e: any) {
    console.error('[ugc-api] script usage log:', e?.message)
  }

  const wordCount = script.trim().split(/\s+/).length
  return NextResponse.json({
    success: true,
    script,
    wordCount,
    targetWords,
    estimatedDuration: Math.round(wordCount / WORDS_PER_SECOND),
  })
}

// Map id bahasa → nama bahasa untuk instruksi ke model
function languageName(id?: string) {
  switch ((id ?? '').toLowerCase()) {
    case 'indonesia':
    case 'id':      return 'Bahasa Indonesia (natural, sehari-hari)'
    case 'english':
    case 'en':      return 'English'
    case 'jawa':    return 'Bahasa Jawa'
    case 'sunda':   return 'Bahasa Sunda'
    default:        return id || 'Bahasa Indonesia'
  }
}

// ══════════════════════════════════════════════════════════════
// ACTION 2 — VIDEO (kredit berjenjang + enforce + COGS)
// ══════════════════════════════════════════════════════════════
async function handleVideo(req: NextRequest, supabase: any, userId: string) {
  const startedAt = Date.now()

  const fd          = await req.formData()
  const script      = String(fd.get('script') ?? '')
  const language    = String(fd.get('language') ?? 'indonesia')
  const avatarId    = String(fd.get('avatarId') ?? fd.get('characterId') ?? '')
  const avatarSrc   = String(fd.get('avatarSource') ?? 'preset')
  const videoPreset = String(fd.get('videoPreset') ?? 'authentic-story')
  const subtitle    = String(fd.get('subtitle') ?? 'auto')
  const cta         = String(fd.get('cta') ?? '')
  const music       = String(fd.get('music') ?? 'none')
  const resolution  = String(fd.get('resolution') ?? 'vertical')
  const duration    = parseInt(String(fd.get('duration') ?? '30')) || 30

  if (!avatarId || !script.trim()) {
    return NextResponse.json(
      { error: 'Avatar & skrip wajib diisi', required: ['avatarId', 'script'] },
      { status: 400 }
    )
  }

  // Biaya berjenjang sesuai durasi (sumber kebenaran: credit-tiers.ts)
  const cost = ugcCost(duration)   // { segments, credits, cogsRp, targetWords }

  // ── 1) Enforce: tier + daily-limit + superuser (admin-dashboard) ──
  const access = await enforceToolAccess(supabase, userId, TOOL_ID)
  if (!access.allowed) {
    const isQuota = access.status === 429 ||
      /kredit tidak cukup|limit harian|kuota/i.test(access.reason ?? '')
    return NextResponse.json(
      isQuota ? { error: access.reason, quotaExceeded: true }
              : { error: access.reason, upgrade: true },
      { status: access.status || 403 }
    )
  }

  // ── 2) Cek saldo untuk biaya MULTI-SEGMEN ─────────────────────
  // enforceToolAccess hanya validasi base cost; video panjang butuh
  // kredit lebih → cek manual di sini. (Fail-open kalau tabel error.)
  if (!access.isSuperuser) {
    const { data: wallet } = await supabase
      .from('user_credits').select('balance').eq('user_id', userId).single()
    const balance = wallet?.balance ?? null
    if (balance !== null && balance < cost.credits) {
      return NextResponse.json({
        error: `Butuh ${cost.credits} kredit untuk video ${duration} detik `
             + `(${cost.segments} segmen × 10), saldo kamu ${balance}.`,
        quotaExceeded: true,
        required: cost.credits,
        current:  balance,
      }, { status: 402 })
    }
  }

  // ── 3) Generate video (segment-based, lipsync = panjang audio) ──
  let jobId: string, statusUrl: string
  try {
    const out = await generateUgcVideo({
      avatarId, avatarSrc, script, language, videoPreset,
      duration, segments: cost.segments,
      subtitle, cta, music, resolution,
    })
    jobId = out.jobId; statusUrl = out.statusUrl
  } catch (e: any) {
    console.error('[ugc-api] generation error:', e)
    return NextResponse.json(
      { error: 'video_generation_failed', message: e?.message ?? 'Gagal generate video' },
      { status: 500 }
    )
  }

  // ── 4) Potong kredit (skip superuser) + log COGS (SELALU) ─────
  if (!access.isSuperuser) {
    await consumeCredits(supabase, userId, TOOL_ID, cost.credits, {
      jobId,
      description: `UGC ${duration}s · ${cost.segments} segmen`,
    })
  }
  await logToolUsage(
    supabase, userId, TOOL_ID,
    'did+elevenlabs+claude',
    Number((cost.cogsRp * USD_PER_RP).toFixed(4)), // costUsd ≈ COGS rupiah
    Date.now() - startedAt,
  )

  // ── 5) Catat job (COGS rupiah otoritatif di kolom api_cost_rp) ─
  await supabase.from('ugc_generation_jobs').insert({
    user_id:          userId,
    job_id:           jobId,
    status:           'processing',
    character_id:     avatarId,
    avatar_source:    avatarSrc,
    script,
    language,
    video_preset:     videoPreset,
    duration_seconds: duration,
    segments:         cost.segments,
    credits_charged:  access.isSuperuser ? 0 : cost.credits,
    api_cost_rp:      cost.cogsRp,
    is_superuser:     access.isSuperuser,
    metadata:         { subtitle, cta, music, resolution },
    created_at:       new Date().toISOString(),
  }).then(({ error }: any) => {
    if (error) console.error('[ugc-api] job insert:', error.message)
  })

  return NextResponse.json({
    success:     true,
    jobId,
    status:      'processing',
    statusUrl,
    duration,
    segments:    cost.segments,
    creditUsed:  access.isSuperuser ? 0 : cost.credits,
    cogsRp:      cost.cogsRp,
    isSuperuser: access.isSuperuser,
  })
}

// ══════════════════════════════════════════════════════════════
// HELPER: generate video (placeholder — wiring real di project)
// ══════════════════════════════════════════════════════════════
async function generateUgcVideo(p: {
  avatarId: string; avatarSrc: string; script: string; language: string
  videoPreset: string; duration: number; segments: number
  subtitle: string; cta?: string; music?: string; resolution?: string
}): Promise<{ jobId: string; statusUrl: string }> {
  // ── PIPELINE NYATA (urutan implementasi di project) ───────────
  // 1. TTS ElevenLabs(script)            → audioBuffer (panjang ≈ durasi)
  // 2. Upload audio ke Cloudflare R2     → audioUrl
  // 3a. Jika API support audio penuh:
  //       didTalksHD({ source_url: avatar, audio_url: audioUrl }) → 1 job
  // 3b. Jika API DIBATASI 10 dtk/render:
  //       potong audio jadi p.segments slice @10s → render tiap slice →
  //       stitch (ffmpeg) → 1 video utuh sepanjang durasi.
  // 4. Deepgram subtitle + overlay CTA + musik → upload R2 → return url
  //
  // Durasi hasil = panjang audio = panjang skrip → konsisten dgn yang diset.
  const jobId = `ugc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return { jobId, statusUrl: `/api/studio/video/ugc/status?job=${jobId}` }
}