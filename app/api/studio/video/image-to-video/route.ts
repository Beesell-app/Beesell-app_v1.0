// app/api/studio/video/image-to-video/route.ts
// ══════════════════════════════════════════════════════════════
// IMAGE TO VIDEO AI — API Route
// ══════════════════════════════════════════════════════════════
//
// Per spec:
//   Input:  finished on-model image (from Photoshoot, Try-On, Model Swap)
//   Output: short video clip 5s or 10s
//   Res:    480p / 720p (Basic+) | 1080p (Pro+)
//   End Image: optional (Pro+, 1080p only)
//
// AI Models (Replicate):
//   Primary:  stability-ai/stable-video-diffusion (SVD)
//     → Best for on-model fashion images
//     → Preserves subject, adds natural camera + garment motion
//     → Supports motion_bucket_id for motion intensity control
//
//   1080p+EndImage: lucataco/svd-xt (SVD-XT for longer coherent clips)
//
// Background handling:
//   SVD works best with complete images (non-black bg)
//   → We pre-process by padding/checking the image
//   → Client must send complete scene images (not cut-outs)
import { checkToolAllowed } from '@/lib/tools/access'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCredits } from '@/lib/middleware/credit-middleware'
import {RESOLUTION_OPTIONS,
  MOTION_PRESETS,
  buildSvdParams,
  type ResolutionId,
  type MotionPresetId,
  type DurationOption,
} from '@/lib/studio/video-presets'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 300   // 5 min — video takes longer

const MAX_BYTES = 20 * 1024 * 1024
const ALLOWED   = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

// Replicate SVD — Stable Video Diffusion XT
const SVD_MODEL   = 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438'
const SVD_XT      = 'lucataco/svd-xt:af5a5f09b4e8b2ea0a6cfb9d490c7e14fc1a72f70793bcd87bb0d7e4b3f2cf4c'

// ── Helpers ───────────────────────────────────────────────────
async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function pollReplicate(predId: string, apiKey: string, timeout = 280_000): Promise<string> {
  const url      = `https://api.replicate.com/v1/predictions/${predId}`
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    await sleep(5000)   // video generation needs longer poll intervals
    const res  = await fetch(url, { headers: { Authorization: `Token ${apiKey}` } })
    const data = await res.json()

    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[0] : data.output
      if (!out) throw new Error('Output video kosong dari AI')
      return out as string
    }
    if (data.status === 'failed')   throw new Error(data.error ?? 'Video generation gagal')
    if (data.status === 'canceled') throw new Error('Proses dibatalkan')
  }
  throw new Error('Timeout — video generation terlalu lama. Coba resolusi lebih rendah.')
}

async function fileToDataUri(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const b64 = Buffer.from(buf).toString('base64')
  return `data:${file.type || 'image/jpeg'};base64,${b64}`
}

// ── Video generation ──────────────────────────────────────────
async function generateVideo(params: {
  imageDataUri:    string
  endImageDataUri?: string
  motionPresetId:  MotionPresetId
  duration:        DurationOption
  resolutionId:    ResolutionId
  customPrompt?:   string
  apiKey:          string
}): Promise<string> {
  const preset     = MOTION_PRESETS[params.motionPresetId]
  const resolution = RESOLUTION_OPTIONS[params.resolutionId]
  const svdParams  = buildSvdParams(preset, params.duration, params.resolutionId)

  // Build motion prompt (custom overrides preset)
  const motionPrompt = params.customPrompt?.trim() || preset.prompt || ''

  // Use SVD-XT for 1080p + end image (longer coherence)
  const useXt = params.resolutionId === '1080p' || !!params.endImageDataUri
  const modelVersion = useXt ? SVD_XT.split(':')[1] : SVD_MODEL.split(':')[1]

  // SVD input schema
  const input: Record<string, any> = {
    input_image:      params.imageDataUri,
    motion_bucket_id: svdParams.motion_bucket_id,
    cond_aug:         svdParams.cond_aug,
    fps_id:           svdParams.fps,
    num_frames:       svdParams.num_frames,
    min_cfg:          svdParams.min_cfg,
    decoding_t:       4,      // parallel decoding frames
    // No width/height — SVD uses input image dimensions
  }

  // Optional: end image (Pro+, 1080p only)
  if (params.endImageDataUri && resolution.supportsEndImage) {
    input.end_image = params.endImageDataUri
  }

  // Append motion prompt if exists
  if (motionPrompt) {
    input.prompt = motionPrompt
  }

  const body = {
    version: modelVersion,
    input,
  }

  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method:  'POST',
    headers: {
      Authorization:  `Token ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    throw new Error(err.detail ?? `Replicate error ${createRes.status}`)
  }

  const pred = await createRes.json()
  if (!pred.id) throw new Error(pred.detail ?? 'Gagal membuat prediksi AI')

  return pollReplicate(pred.id, params.apiKey)
}

// ── Main handler ──────────────────────────────────────────────
async function handlePOST(req: Request) {
  const t0 = Date.now()

  try {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Plan check ────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, video_used, video_limit')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil tidak ditemukan' }, { status: 404 })

    const validPlans = ['basic', 'pro', 'business']
    if (!validPlans.includes(profile.plan ?? '')) {
      return NextResponse.json({ error: 'Fitur Video AI tersedia mulai Basic plan.', upgrade: true }, { status: 403 })
    }

    const used  = profile.video_used  ?? 0
    const limit = profile.video_limit ?? 5   // default 5 per bulan untuk Basic

    if (used >= limit) {
      return NextResponse.json({
        error:         `Kuota Video AI habis (${used}/${limit}). Beli Video Add-On untuk tambah kuota.`,
        quotaExceeded: true, quotaUsed: used, quotaLimit: limit,
      }, { status: 429 })
    }

    // ── Parse form ────────────────────────────────────────────
    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error: 'Body harus multipart/form-data' }, { status: 400 }) }

    // Base image (required)
    const imageFile = formData.get('image') as File | null
    if (!imageFile) return NextResponse.json({ error: 'Gambar sumber (image) wajib diupload' }, { status: 400 })
    if (!ALLOWED.has(imageFile.type)) return NextResponse.json({ error: 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.' }, { status: 400 })
    if (imageFile.size > MAX_BYTES) return NextResponse.json({ error: 'Ukuran gambar maksimal 20MB' }, { status: 400 })

    // Optional end image (Pro+ only, 1080p only)
    const endImageFile   = formData.get('endImage') as File | null
    const resolutionId   = (formData.get('resolution') as ResolutionId)    ?? '720p'
    const motionPresetId = (formData.get('preset')     as MotionPresetId)  ?? 'auto'
    const duration       = parseInt(formData.get('duration') as string ?? '5') as DurationOption
    const customPrompt   = (formData.get('customPrompt') as string)         ?? ''

    // Validate resolution plan gate
    const resolution = RESOLUTION_OPTIONS[resolutionId]
    if (!resolution) return NextResponse.json({ error: `Resolusi '${resolutionId}' tidak valid` }, { status: 400 })
    if (resolution.plan === 'pro' && !['pro','business'].includes(profile.plan ?? '')) {
      return NextResponse.json({ error: '1080p hanya tersedia untuk plan Pro dan Business.', upgrade: true }, { status: 403 })
    }

    // End image plan + resolution gate
    if (endImageFile && profile.plan === 'basic') {
      return NextResponse.json({ error: 'End Image hanya tersedia untuk plan Pro dan Business.' }, { status: 403 })
    }
    if (endImageFile && resolutionId !== '1080p') {
      return NextResponse.json({ error: 'End Image hanya support resolusi 1080p. Ubah resolusi ke 1080p.' }, { status: 400 })
    }

    // Validate motion preset
    const preset = MOTION_PRESETS[motionPresetId]
    if (!preset) return NextResponse.json({ error: `Preset '${motionPresetId}' tidak ditemukan` }, { status: 400 })

    // Validate duration
    if (![5, 10].includes(duration)) return NextResponse.json({ error: 'Duration harus 5 atau 10 detik' }, { status: 400 })

    // API key
    const apiKey = process.env.REPLICATE_API_TOKEN
    if (!apiKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    // ── Convert images ────────────────────────────────────────
    const imageDataUri    = await fileToDataUri(imageFile)
    const endImageDataUri = endImageFile ? await fileToDataUri(endImageFile) : undefined

    // ── Generate video ────────────────────────────────────────
    let videoUrl: string
    try {
      videoUrl = await generateVideo({
        imageDataUri,
        endImageDataUri,
        motionPresetId,
        duration,
        resolutionId,
        customPrompt: customPrompt.trim() || undefined,
        apiKey,
      })
    } catch (aiErr: any) {
      console.error('[image-to-video] AI error:', aiErr)
      return NextResponse.json({
        error: `Video generation gagal: ${aiErr.message}. Pastikan gambar memiliki background lengkap (bukan background hitam/transparan).`,
      }, { status: 502 })
    }

    // ── Update quota ──────────────────────────────────────────
    await supabase.from('profiles').update({ video_used: used + 1 }).eq('id', user.id)

    // ── Save to asset library ─────────────────────────────────
    void (async () => {
      try {
        await supabase.from('ai_assets').insert({
          user_id: user.id,
          type: 'image-to-video',
          output_url: videoUrl,
          metadata: {
            preset: motionPresetId,
            duration,
            resolution: resolutionId,
            hasEndImage: !!endImageFile,
            customPrompt,
          },
          created_at: new Date().toISOString(),
        })
      } catch {
        // ignore
      }
    })()

    const elapsed = Date.now() - t0

    // ── Return video URL ──────────────────────────────────────
    // Video files are large — return URL, not binary
    return NextResponse.json({
      success:     true,
      videoUrl,
      preset:      motionPresetId,
      duration,
      resolution:  resolutionId,
      elapsedMs:   elapsed,
      quotaUsed:   used + 1,
      quotaLimit:  limit,
    }, {
      headers: {
        'X-Elapsed-Ms':  String(elapsed),
        'X-Quota-Used':  String(used + 1),
        'X-Quota-Limit': String(limit),
      },
    })

  } catch (err: any) {
    console.error('[image-to-video] Unexpected:', err)
    return NextResponse.json({ error: err?.message ?? 'Server error tak terduga' }, { status: 500 })
  }
}

// ══════════════════════════════════════════════════════════════
// Credit System Wrapper
// ══════════════════════════════════════════════════════════════
// Charge credit otomatis sebelum handlePOST jalan.
// Refund otomatis jika handlePOST throw atau return status >= 300.
// Tool ID: 'image-to-video' — credit cost di-resolve dari lib/credits.ts

export const POST = withCredits(
  'image-to-video',
  async (ctx, req) => {
    // Forward ke handler asli. handlePOST sudah punya semua logic
    // (auth check, validation, AI call, etc). Tidak ada perubahan logic.
    return handlePOST(req)
  },
  {
    description: () => 'Image to Video animation',
  },
)