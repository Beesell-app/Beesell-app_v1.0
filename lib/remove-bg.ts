// lib/remove-bg.ts
// ══════════════════════════════════════════════════════════════
// REMOVE BACKGROUND — BRIA RMBG-2.0
// ══════════════════════════════════════════════════════════════
//
// Kenapa BRIA RMBG-2.0?
// ┌─────────────────────┬────────────┬───────────┬──────────────────────────────┐
// │ Model               │ Harga/gambar│ Open Src  │ Quality                      │
// ├─────────────────────┼────────────┼───────────┼──────────────────────────────┤
// │ BRIA RMBG-2.0 ★     │ ~Rp18      │ ✅ Yes     │ SOTA 2024, terbaik produk    │
// │ rembg (cjwbw)       │ ~Rp35      │ ✅ MIT     │ Bagus, lebih mahal           │
// │ inspyrenet          │ ~Rp28      │ ✅ Yes     │ Bagus untuk bg kompleks      │
// │ Remove.bg           │ ~Rp3.200   │ ❌ No      │ Bagus, 178x lebih mahal      │
// └─────────────────────┴────────────┴───────────┴──────────────────────────────┘
//
// Sumber: github.com/bria-ai/RMBG-2.0
// Lisensi: BRIA RMBG-2.0 (bebas untuk komersial dengan attribution)
// Replicate: replicate.com/bria/remove-background
//
// ENV yang dibutuhkan:
//   REPLICATE_API_TOKEN  ← sudah ada di project (dipakai image generation juga)
//
// TIDAK perlu:
//   REMOVE_BG_API_KEY   ← tidak diperlukan lagi
// ══════════════════════════════════════════════════════════════


export type BgProvider = 'bria-rmbg2' | 'removebg'
export type SubjectType = 'product' | 'person' | 'animal' | 'auto'

export interface RemoveBgOptions {
  /** Tipe subjek — membantu model mengoptimalkan segmentasi */
  type?:     SubjectType
  /** Warna background hex TANPA # (contoh: 'ffffff'). Jika tidak di-set → transparent PNG */
  bgColor?:  string
  /** Force ke provider tertentu. Default: 'bria-rmbg2' */
  provider?: BgProvider
}

export interface RemoveBgResult {
  /** Hasil gambar PNG siap kirim ke browser */
  buffer:   Buffer
  /** Provider yang dipakai */
  provider: BgProvider
  /** Estimasi biaya dalam IDR untuk monitoring */
  costIdr:  number
  /** Tipe subjek yang terdeteksi */
  type:     string
}

// ── BRIA RMBG-2.0 config ─────────────────────────────────────
// Pakai model field (bukan version hash) — selalu pakai versi terbaru.
// Format Replicate API baru: { model: "owner/name" } tanpa version.
// Ini menghindari error 422 "version does not exist" saat model di-update.
const BRIA_MODEL = 'bria/remove-background'

const POLL_INTERVAL = 1_500   // ms antar poll
const POLL_TIMEOUT  = 60_000  // ms max tunggu (BRIA biasanya 3-8 detik)

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ── Internal: Download image dari URL → Buffer ────────────────
async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download hasil gagal: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// ── Internal: Tambah background warna ke transparent PNG ──────
// Pakai sharp jika tersedia (biasanya sudah ada di Next.js projects)
async function compositeBackground(
  transparentPng: Buffer,
  hexColor: string,
): Promise<Buffer> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('sharp') as typeof import('sharp')
    const { width, height } = await sharp(transparentPng).metadata()
    const r = parseInt(hexColor.slice(0, 2), 16)
    const g = parseInt(hexColor.slice(2, 4), 16)
    const b = parseInt(hexColor.slice(4, 6), 16)
    return await sharp({
      create: {
        width:    width!,
        height:   height!,
        channels: 3,
        background: { r, g, b },
      },
    })
      .png()
      .composite([{ input: transparentPng, blend: 'over' }])
      .toBuffer()
  } catch {
    // sharp tidak tersedia → kembalikan PNG transparan apa adanya
    // Warna background bisa diapply di client/CSS
    console.warn('[remove-bg] sharp tidak tersedia, skip background composite')
    return transparentPng
  }
}

// ══════════════════════════════════════════════════════════════
// PROVIDER 1 — BRIA RMBG-2.0 via Replicate  (PRIMARY)
// ══════════════════════════════════════════════════════════════
async function runBriaRmbg2(
  imageBuffer: Buffer,
  options:     RemoveBgOptions,
): Promise<RemoveBgResult> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN belum dikonfigurasi di .env.local')
  }

  // Encode gambar ke base64 data URL
  const dataUrl = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

  // ── Buat prediction ─────────────────────────────────────────
  const createRes = await fetch('https://api.replicate.com/v1/models/bria/remove-background/predictions', {
    method:  'POST',
    headers: {
      Authorization:  `Token ${token}`,
      'Content-Type': 'application/json',
      // 'Prefer: wait' minta Replicate tunggu sampai selesai (max 60s)
      // Lebih efisien dari polling jika model cepat
      'Prefer': 'wait=30',
    },
    body: JSON.stringify({
      input: {
        image: dataUrl,
      },
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({})) as Record<string, unknown>
    if (createRes.status === 401)
      throw new Error('REPLICATE_API_TOKEN tidak valid. Periksa .env.local')
    if (createRes.status === 429)
      throw new Error('rate limit')
    throw new Error(
      `Replicate error ${createRes.status}: ${(err.detail as string) ?? JSON.stringify(err)}`,
    )
  }

  let prediction = await createRes.json() as {
    id: string
    status: string
    output: unknown
    error?: string
  }

  // ── Poll jika belum selesai (Prefer:wait bisa timeout duluan) ─
  if (prediction.status !== 'succeeded') {
    const id       = prediction.id
    const deadline = Date.now() + POLL_TIMEOUT

    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL)

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (!pollRes.ok) {
        throw new Error(
          `Gagal polling prediction: HTTP ${pollRes.status}`
        )
      }

      prediction = await pollRes.json()

      if (prediction.status === 'succeeded') break
      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        throw new Error(`BRIA RMBG-2.0 ${prediction.status}: ${prediction.error ?? ''}`)
      }
    }

    if (prediction.status !== 'succeeded') {
      throw new Error('BRIA RMBG-2.0 timeout — coba lagi')
    }
  }

  // ── Ambil URL output ─────────────────────────────────────────
  let outputUrl: string | undefined

  if (typeof prediction.output === 'string') {
    outputUrl = prediction.output
  } else if (Array.isArray(prediction.output)) {
    outputUrl = prediction.output[0]
  } else if (
    prediction.output &&
    typeof prediction.output === 'object' &&
    'image' in prediction.output
  ) {
    outputUrl = String(
      (prediction.output as Record<string, unknown>).image
    )
  }

if (!outputUrl) {
  throw new Error(
    `BRIA output tidak dikenali: ${JSON.stringify(prediction.output)}`
  )
}

  // ── Download PNG transparan ───────────────────────────────────
  let resultBuffer = await fetchImage(outputUrl as string)

  // ── Composite background jika diminta ─────────────────────────
  if (options.bgColor) {
    resultBuffer = await compositeBackground(resultBuffer, options.bgColor)
  }

  return {
    buffer:   resultBuffer,
    provider: 'bria-rmbg2',
    costIdr:  18,   // ~$0.0012 × Rp15.500 ≈ Rp18
    type:     options.type ?? 'product',
  }
}

// ══════════════════════════════════════════════════════════════
// PROVIDER 2 — Remove.bg  (OPSIONAL — tidak direkomendasikan)
// Hanya aktif jika REMOVE_BG_API_KEY di-set di .env
// Dipakai sebagai emergency fallback, bukan primary
// ══════════════════════════════════════════════════════════════
async function runRemoveBg(
  imageBuffer: Buffer,
  options:     RemoveBgOptions,
): Promise<RemoveBgResult> {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey || apiKey === 'YOUR_REMOVE_BG_KEY') {
    throw new Error('REMOVE_BG_API_KEY tidak dikonfigurasi')
  }

  const form = new FormData()
  form.append(
    'image_file',
    new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' }),
    'image.jpg',
  )
  form.append('size',   'auto')
  form.append('type',   options.type ?? 'product')
  form.append('format', 'png')
  if (options.bgColor) form.append('bg_color', options.bgColor)

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method:  'POST',
    headers: { 'X-Api-Key': apiKey },
    body:    form,
  })

  if (!res.ok) {
    if (res.status === 402) throw new Error('credits')
    if (res.status === 429) throw new Error('rate limit')
    if (res.status === 403) throw new Error('Remove.bg API key tidak valid')
    let msg = `Remove.bg HTTP ${res.status}`
    try {
      const j = await res.json() as { errors?: Array<{ title: string }> }
      if (j?.errors?.[0]?.title) msg = j.errors[0].title
    } catch { /* silent */ }
    throw new Error(msg)
  }

  return {
    buffer:   Buffer.from(await res.arrayBuffer()),
    provider: 'removebg',
    costIdr:  3200,
    type:     res.headers.get('X-Type') ?? options.type ?? 'product',
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════

/**
 * Hapus background dari gambar.
 *
 * Default → BRIA RMBG-2.0 (open source, ~Rp18/gambar via Replicate).
 * Hanya membutuhkan REPLICATE_API_TOKEN yang sudah ada di project.
 *
 * @example
 * ```ts
 * import { removeBackground } from '@/lib/remove-bg'
 *
 * const result = await removeBackground(imageBuffer, { type: 'product' })
 * return new Response(result.buffer, { headers: { 'Content-Type': 'image/png' } })
 * ```
 */
export async function removeBackground(
  imageInput: Buffer | ArrayBuffer,
  options:    RemoveBgOptions = {},
): Promise<RemoveBgResult> {
  const buffer = imageInput instanceof Buffer
    ? imageInput
    : Buffer.from(new Uint8Array(imageInput as ArrayBuffer))

  // Force provider jika diminta eksplisit
  if (options.provider === 'removebg') return runRemoveBg(buffer, options)
  if (options.provider === 'bria-rmbg2') return runBriaRmbg2(buffer, options)

  // DEFAULT: BRIA RMBG-2.0
  // Fallback ke Remove.bg hanya jika:
  //   (1) BRIA timeout/transient error  AND
  //   (2) REMOVE_BG_API_KEY dikonfigurasi
  try {
    return await runBriaRmbg2(buffer, options)
  } catch (err: any) {
    const isTransient = /timeout|rate limit/i.test(err.message ?? '')
    const hasRemoveBg = !!process.env.REMOVE_BG_API_KEY &&
      process.env.REMOVE_BG_API_KEY !== 'YOUR_REMOVE_BG_KEY'

    if (isTransient && hasRemoveBg) {
      console.warn('[remove-bg] BRIA transient, fallback ke Remove.bg:', err.message)
      return runRemoveBg(buffer, options)
    }
    throw err
  }
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Parse nilai bgOption dari form ke format bgColor hex.
 *
 * Input  → Output
 * 'transparent'     → undefined  (PNG transparan)
 * 'white'           → 'ffffff'
 * 'black'           → '000000'
 * 'custom:#fa8c16'  → 'fa8c16'
 */
export function parseBgOption(bgOption: string): string | undefined {
  if (!bgOption || bgOption === 'transparent') return undefined
  if (bgOption === 'white') return 'ffffff'
  if (bgOption === 'black') return '000000'
  if (bgOption.startsWith('custom:')) {
    return bgOption.replace('custom:', '').replace('#', '').slice(0, 6) || undefined
  }
  return undefined
}

/** Cek saldo Remove.bg (hanya jika apiKey dikonfigurasi) */
export async function getRemoveBgBalance(): Promise<{ credits: number } | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey || apiKey === 'YOUR_REMOVE_BG_KEY') return null
  try {
    const res = await fetch('https://api.remove.bg/v1.0/account', {
      headers: { 'X-Api-Key': apiKey },
    })
    if (!res.ok) return null
    const data = await res.json() as { data?: { attributes?: { credits?: { total?: number } } } }
    return { credits: data?.data?.attributes?.credits?.total ?? 0 }
  } catch { return null }
}

/** Info provider untuk logging & monitoring */
export const PROVIDER_INFO = {
  'bria-rmbg2': {
    label:    'BRIA RMBG-2.0',
    openSrc:  true,
    costIdr:  18,
    quality:  'SOTA — terbaik untuk product photography',
    version:  BRIA_MODEL,
    url:      'https://github.com/bria-ai/RMBG-2.0',
  },
  removebg: {
    label:    'Remove.bg',
    openSrc:  false,
    costIdr:  3200,
    quality:  'Excellent — commercial API',
    version:  null,
    url:      'https://remove.bg',
  },
} as const