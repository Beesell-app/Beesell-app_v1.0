// lib/replicate.ts
// ══════════════════════════════════════════════════════════════
// Shared Replicate API helper untuk Quick Tools.
// Handles: auth, prediction create, polling, image→data URI.
//
// ENV required: REPLICATE_API_TOKEN
// ══════════════════════════════════════════════════════════════

const API = 'https://api.replicate.com/v1'

function token() {
  const t = process.env.REPLICATE_API_TOKEN
  if (!t) throw new Error('REPLICATE_API_TOKEN belum di-set di .env.local')
  return t
}

function headers() {
  return {
    'Authorization': `Bearer ${token()}`,
    'Content-Type':  'application/json',
    'Prefer':        'wait',  // sync mode (tunggu sampai selesai, max 60s)
  }
}

/** Convert File/Buffer → data URI (base64) untuk Replicate input */
export async function toDataUri(buffer: Buffer, mime: string): Promise<string> {
  return `data:${mime};base64,${buffer.toString('base64')}`
}

/** Create prediction dan tunggu hasilnya (sync mode via Prefer: wait) */
export async function predict(
  modelVersion: string,
  input: Record<string, any>,
  timeoutMs = 120_000,
): Promise<any> {
  // Coba sync mode dulu (Prefer: wait)
  const res = await fetch(`${API}/predictions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ version: modelVersion, input }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? err.title ?? `Replicate API error ${res.status}`)
  }

  let pred = await res.json()

  // Kalau sync mode langsung selesai
  if (pred.status === 'succeeded') return pred
  if (pred.status === 'failed' || pred.status === 'canceled') {
    throw new Error(pred.error ?? 'Prediction failed')
  }

  // Fallback: polling (kalau Prefer:wait tidak didukung model)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000))
    const pollRes = await fetch(pred.urls.get, { headers: { 'Authorization': `Bearer ${token()}` } })
    if (!pollRes.ok) throw new Error(`Poll error ${pollRes.status}`)
    pred = await pollRes.json()
    if (pred.status === 'succeeded') return pred
    if (pred.status === 'failed' || pred.status === 'canceled') {
      throw new Error(pred.error ?? 'Prediction failed')
    }
  }
  throw new Error('Prediction timeout — coba lagi nanti.')
}

/** Ambil output image URL dari prediction result.
 *  Beberapa model return string, beberapa return array. */
export function getOutputUrl(pred: any): string {
  const out = pred.output
  if (typeof out === 'string') return out
  if (Array.isArray(out) && out.length > 0) return out[out.length - 1] // ambil hasil akhir
  throw new Error('Model tidak mengembalikan gambar output.')
}

/** Fetch image dari URL → Buffer */
export async function fetchImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Gagal download hasil: ${res.status}`)
  const contentType = res.headers.get('content-type') ?? 'image/png'
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, contentType }
}