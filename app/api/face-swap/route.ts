// app/api/studio/face-swap/route.ts
// ══════════════════════════════════════════════════════════════
// FACE SWAP AI — API Route
// ══════════════════════════════════════════════════════════════
//
// Per spec:
//   Replace ONLY the face in a fashion/product photo.
//   KEEP: outfit, body shape, pose, lighting, composition
//   CHANGE: face only (identity, skin tone of face area)
//
//   Two modes (per docs):
//   A) "match_reference"     → keep face ref expression + head angle
//                              (max resemblance to face reference)
//   B) "match_current_model" → adapt face ref to current model direction
//                              (more natural result on original body)
//
//   Limitation: max 2K resolution output (per spec)
//   Face reference: REQUIRED (not optional like model-swap)
//
// AI Stack:
//   lucataco/faceswap on Replicate
//   - Uses InsightFace + inswapper_128 (industry standard)
//   - target_image = fashion photo (face to replace)
//   - source_image = face reference (face to paste in)
//   - GFPGAN face restoration after swap

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkToolAllowed } from '@/lib/tools/access'
export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 90

const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED   = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

// lucataco/faceswap — InsightFace + inswapper_128 + GFPGAN restoration
const FACESWAP_MODEL = 'lucataco/faceswap:9a4298548422074c3f57258c5d544497a19901a0ae39cc1d797ad9f96f2e96b0'

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function pollReplicate(predId: string, apiKey: string, timeout = 85_000): Promise<string> {
  const url      = `https://api.replicate.com/v1/predictions/${predId}`
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    await sleep(3000)
    const res  = await fetch(url, { headers: { Authorization: `Token ${apiKey}` } })
    const data = await res.json()
    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[0] : data.output
      if (!out) throw new Error('Output AI kosong')
      return out as string
    }
    if (data.status === 'failed')   throw new Error(data.error ?? 'Generate gagal')
    if (data.status === 'canceled') throw new Error('Proses dibatalkan')
  }
  throw new Error('Timeout — AI terlalu lama, coba lagi')
}

async function fileToDataUri(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const b64 = Buffer.from(buf).toString('base64')
  return `data:${file.type || 'image/jpeg'};base64,${b64}`
}

async function runFaceSwap(params: {
  targetUri: string   // foto fashion (wajah yang diganti)
  sourceUri: string   // wajah referensi (wajah yang dipakai)
  matchMode: string
  apiKey:    string
}): Promise<string> {
  // matchMode → gfpgan_strength + codeformer_fidelity tuning
  // match_reference:     lower fidelity → preserve more of reference look
  // match_current_model: higher fidelity → adapt face to body's angle
  const isMatchRef = params.matchMode === 'match_reference'

  const body = {
    version: FACESWAP_MODEL.split(':')[1],
    input: {
      target_image:          params.targetUri,
      source_image:          params.sourceUri,
      face_restore:          true,
      gfpgan_strength:       isMatchRef ? 0.7 : 0.85,
      codeformer_fidelity:   isMatchRef ? 0.6 : 0.75,
      face_index:            0,   // swap first/largest face in target
    },
  }

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method:  'POST',
    headers: { Authorization: `Token ${params.apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `Replicate error ${res.status}`)
  }

  const pred = await res.json()
  if (!pred.id) throw new Error(pred.detail ?? 'Gagal membuat prediksi AI')
  return pollReplicate(pred.id, params.apiKey)
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: Request) {
  const t0 = Date.now()
  try {
    // Auth
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Plan check
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, face_swap_used, face_swap_limit')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil tidak ditemukan' }, { status: 404 })

    if (!['pro', 'business'].includes(profile.plan ?? '')) {
      return NextResponse.json({ error: 'Fitur Face Swap hanya tersedia di plan Pro dan Business.', upgrade: true }, { status: 403 })
    }

    const used  = profile.face_swap_used  ?? 0
    const limit = profile.face_swap_limit ?? 50
    if (used >= limit) {
      return NextResponse.json({ error: `Kuota Face Swap habis (${used}/${limit}). Beli add-on Face Swap.`, quotaExceeded: true, quotaUsed: used, quotaLimit: limit }, { status: 429 })
    }
    const gate = await checkToolAllowed(supabase, user.id, 'face-swap')
    if (!gate.allowed) {
      return NextResponse.json({ error:'TOOL_DISABLED', message: gate.reason || 'Tool ini sedang tidak tersedia.' }, { status: 403 })
    }
    // Parse form
    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error: 'Body harus multipart/form-data' }, { status: 400 }) }

    // target = foto fashion (required)
    const targetFile = formData.get('target') as File | null
    if (!targetFile) return NextResponse.json({ error: 'Foto target wajib diupload (field: target)' }, { status: 400 })
    if (!ALLOWED.has(targetFile.type)) return NextResponse.json({ error: 'Format foto target tidak didukung' }, { status: 400 })
    if (targetFile.size > MAX_BYTES) return NextResponse.json({ error: 'Foto target maksimal 15MB' }, { status: 400 })

    // face = wajah referensi (required untuk face swap)
    const faceFile = formData.get('face') as File | null
    if (!faceFile) return NextResponse.json({ error: 'Foto wajah referensi wajib diupload (field: face). Face Swap memerlukan face reference.' }, { status: 400 })
    if (!ALLOWED.has(faceFile.type)) return NextResponse.json({ error: 'Format wajah referensi tidak didukung' }, { status: 400 })
    if (faceFile.size > MAX_BYTES) return NextResponse.json({ error: 'Wajah referensi maksimal 15MB' }, { status: 400 })

    const matchMode = (formData.get('matchMode') as string) ?? 'match_current_model'

    // API key
    const apiKey = process.env.REPLICATE_API_TOKEN
    if (!apiKey) return NextResponse.json({ error: 'Server config error: REPLICATE_API_TOKEN tidak di-set' }, { status: 500 })

    // Convert to data URIs (both in parallel)
    const [targetUri, sourceUri] = await Promise.all([
      fileToDataUri(targetFile),
      fileToDataUri(faceFile),
    ])

    // Run AI
    let outputUrl: string
    try {
      outputUrl = await runFaceSwap({ targetUri, sourceUri, matchMode, apiKey })
    } catch (aiErr: any) {
      console.error('[face-swap] AI error:', aiErr)
      return NextResponse.json({
        error: `Face swap gagal: ${aiErr.message}. Pastikan ada wajah jelas di kedua foto.`,
      }, { status: 502 })
    }

    // Update quota
    await supabase.from('profiles').update({ face_swap_used: used + 1 }).eq('id', user.id)

    // Save asset (async fire-and-forget)
    try {
      await supabase.from('ai_assets').insert({
          user_id: user.id,
          type: 'face-swap',
          output_url: outputUrl,
          metadata: { matchMode },
          created_at: new Date().toISOString(),
        })
      } catch {
        // ignore
      }

    const elapsed = Date.now() - t0

    // Return binary PNG
    try {
      const imgRes = await fetch(outputUrl)
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer()
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type':  'image/png',
            'X-Elapsed-Ms':  String(elapsed),
            'X-Quota-Used':  String(used + 1),
            'X-Quota-Limit': String(limit),
            'X-Match-Mode':  matchMode,
          },
        })
      }
    } catch {}

    // Fallback JSON
    return NextResponse.json({ success: true, url: outputUrl, elapsedMs: elapsed, quotaUsed: used + 1, quotaLimit: limit })

  } catch (err: any) {
    console.error('[face-swap] Unexpected:', err)
    return NextResponse.json({ error: err?.message ?? 'Server error tak terduga' }, { status: 500 })
  }
}