// app/api/studio/tryon/route.ts
// AI Try-On Fashion — upload pakaian + model → AI fitting otomatis
// Model: Replicate CatVTON or IDM-VTON (best virtual try-on models)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED   = new Set(['image/jpeg','image/jpg','image/png','image/webp'])

// IDM-VTON — terbaik untuk virtual try-on, preserve model identity
const TRYON_MODEL = 'cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f'

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function pollReplicate(id: string, key: string, timeout = 110_000): Promise<string> {
  const url = `https://api.replicate.com/v1/predictions/${id}`
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    await sleep(3500)
    const res  = await fetch(url, { headers: { Authorization: `Token ${key}` } })
    const data = await res.json()
    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[0] : data.output
      if (!out) throw new Error('Output AI kosong')
      return out as string
    }
    if (data.status === 'failed')   throw new Error(data.error ?? 'Generate gagal')
    if (data.status === 'canceled') throw new Error('Proses dibatalkan')
  }
  throw new Error('Timeout — coba lagi')
}

export async function POST(req: Request) {
  const t0 = Date.now()
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (!replicateKey) return NextResponse.json({ error: 'CONFIG', message: 'REPLICATE_API_TOKEN belum dikonfigurasi.' }, { status: 500 })

    let fd: FormData
    try { fd = await req.formData() }
    catch { return NextResponse.json({ error: 'INVALID_FORM' }, { status: 400 }) }

    const modelFile   = fd.get('modelImage')   as File | null
    const garmentFile = fd.get('garmentImage') as File | null
    const prompt      = (fd.get('prompt')      as string) ?? ''
    const category    = (fd.get('category')    as string) ?? 'upper_body'

    if (!modelFile   || !(modelFile   instanceof File)) return NextResponse.json({ error: 'NO_MODEL',   message: 'Upload foto model dulu.' }, { status: 400 })
    if (!garmentFile || !(garmentFile instanceof File)) return NextResponse.json({ error: 'NO_GARMENT', message: 'Upload foto pakaian dulu.' }, { status: 400 })
    for (const f of [modelFile, garmentFile]) {
      if (!ALLOWED.has(f.type))  return NextResponse.json({ error: 'INVALID_TYPE', message: `Format tidak didukung: ${f.type}` }, { status: 400 })
      if (f.size > MAX_BYTES)    return NextResponse.json({ error: 'FILE_TOO_LARGE', message: 'Maks 15MB per file.' }, { status: 400 })
    }

    const toB64 = async (f: File) => `data:${f.type};base64,${Buffer.from(await f.arrayBuffer()).toString('base64')}`
    const [modelB64, garmentB64] = await Promise.all([toB64(modelFile), toB64(garmentFile)])

    console.log(`[tryon] START user:${user.id} category:${category}`)

    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { Authorization: `Token ${replicateKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: TRYON_MODEL,
        input: {
          human_img:        modelB64,
          garm_img:         garmentB64,
          garment_des:      prompt || 'a fashionable garment',
          is_checked:       true,
          is_checked_crop:  false,
          denoise_steps:    30,
          seed:             42,
          category,         // upper_body | lower_body | dresses
        },
      }),
    })

    if (!startRes.ok) {
      const j = await startRes.json().catch(() => ({}))
      if (startRes.status === 401) throw new Error('REPLICATE_API_TOKEN tidak valid')
      throw new Error(j.detail ?? j.error ?? `Replicate error ${startRes.status}`)
    }

    const pred = await startRes.json()
    console.log(`[tryon] prediction: ${pred.id}`)

    const outputUrl = await pollReplicate(pred.id, replicateKey)
    const dlRes     = await fetch(outputUrl)
    if (!dlRes.ok)  throw new Error(`Download hasil gagal: ${dlRes.status}`)

    const buf     = Buffer.from(await dlRes.arrayBuffer())
    const ct      = dlRes.headers.get('content-type') ?? 'image/png'
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

    console.log(`[tryon] SUCCESS ${Math.round(buf.length/1024)}KB ${elapsed}s`)

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type':       ct,
        'Content-Disposition':`attachment; filename="beesell-tryon-${Date.now()}.png"`,
        'Cache-Control':      'no-store',
        'X-Process-Time-Sec': elapsed,
      },
    })
  } catch (err: any) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    console.error(`[tryon] ${elapsed}s`, err?.message)
    return NextResponse.json({ error: 'GENERATE_FAILED', message: err?.message ?? 'Generate gagal. Coba lagi.' }, { status: 500 })
  }
}