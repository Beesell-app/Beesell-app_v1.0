// app/api/studio/model-swap/route.ts  ← TIMPA file lama
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceToolAccess, consumeCredits, logToolUsage } from '@/lib/tools/enforce'
import { predict, getOutputUrl, toDataUri } from '@/lib/replicate'
import {
  IDENTITY_PRESETS,
  buildSwapPrompt,
  buildNegativePrompt,
  SWAP_PARAMS,
  type IdentityPresetId,
  type SkinToneId,
  type HairstyleId,
  type BodyTypeId,
} from '@/lib/studio/model-swap-presets'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 180

const TOOL_ID      = 'model-swap'
const SDXL_VERSION = '39ed52f2319f9b0cf0680e9e61d616f9dbf7c7c9ca1f1cf4ff14e50d8e78ae17'
const MAX_BYTES    = 15 * 1024 * 1024
const ALLOWED      = new Set(['image/jpeg','image/jpg','image/png','image/webp'])
const COST_USD_PER_IMG = 0.012 // estimasi COGS SDXL — sesuaikan

export async function POST(req: Request) {
  const t0 = Date.now()
  const supabase = await createClient()

  // 1) Auth
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Silakan login dulu.' }, { status: 401 })

  // 2) Enforce: feature flag admin + tier + limit harian + saldo kredit. Superuser auto-lolos.
  const access = await enforceToolAccess(supabase, user.id, TOOL_ID)
  if (!access.allowed) {
    const r = access.reason || 'Akses ditolak.'
    const creditOrLimit = access.status === 429 || /kredit tidak cukup|limit harian|kuota/i.test(r)
    return NextResponse.json(
      creditOrLimit ? { quotaExceeded: true, error: r } : { upgrade: true, error: r },
      { status: access.status },
    )
  }

  // 3) Parse + validasi
  let form: FormData
  try { form = await req.formData() }
  catch { return NextResponse.json({ error: 'Body harus multipart/form-data.' }, { status: 400 }) }

  const source = form.get('source')
  if (!(source instanceof File)) return NextResponse.json({ error: 'Foto sumber wajib diupload.' }, { status: 400 })
  if (!ALLOWED.has(source.type)) return NextResponse.json({ error: 'Format harus JPG, PNG, atau WEBP.' }, { status: 400 })
  if (source.size > MAX_BYTES)   return NextResponse.json({ error: 'Ukuran gambar maksimal 15MB.' }, { status: 400 })

  const presetId   = String(form.get('preset') ?? 'wanita-indo-muda') as IdentityPresetId
  const skinTone   = (form.get('skinTone') ? String(form.get('skinTone')) : undefined) as SkinToneId | undefined
  const hairstyle  = String(form.get('hairstyle') ?? 'natural') as HairstyleId
  const bodyType   = String(form.get('bodyType') ?? 'slim') as BodyTypeId
  const swapMode   = String(form.get('swapMode') ?? 'balanced')
  const custom     = String(form.get('custom') ?? '')
  const numResults = Math.min(4, Math.max(1, parseInt(String(form.get('numResults') ?? '1')) || 1))
  const faceRef    = form.get('faceRef') instanceof File ? (form.get('faceRef') as File) : null

  const preset = IDENTITY_PRESETS[presetId]
  if (!preset) return NextResponse.json({ error: `Preset '${presetId}' tidak ditemukan.` }, { status: 400 })

  try {
    // 4) Prompt + gambar → data URI
    const positive = buildSwapPrompt({ preset, skinToneOverride: skinTone, hairstyle, bodyType, customPrompt: custom, faceRef: !!faceRef })
    const negative = buildNegativePrompt()
    const dataUri  = await toDataUri(Buffer.from(await source.arrayBuffer()), source.type || 'image/jpeg')
    const sp       = (SWAP_PARAMS as any)[swapMode] ?? (SWAP_PARAMS as any).balanced

    // 5) Generate paralel (maks 4)
    const seeds = Array.from({ length: numResults }, (_, i) => 42 + i * 7919)
    const urls  = await Promise.all(seeds.map(async seed => {
      const pred = await predict(SDXL_VERSION, {
        image: dataUri,
        prompt: positive,
        negative_prompt: negative,
        prompt_strength: sp.promptStrength,
        guidance_scale: sp.guidanceScale,
        num_inference_steps: sp.inferenceSteps,
        scheduler: sp.scheduler,
        num_outputs: 1,
        width: 1024, height: 1024,
        apply_watermark: false,
        seed,
      })
      return getOutputUrl(pred)
    }))

    // 6) Potong kredit (superuser di-skip) + catat COGS
    if (!access.isSuperuser) {
      await consumeCredits(supabase, user.id, TOOL_ID, access.creditCost * numResults, { description: `Model Swap ×${numResults} (${presetId})` })
    }
    await logToolUsage(supabase, user.id, TOOL_ID, 'replicate', COST_USD_PER_IMG * numResults, Date.now() - t0)

    // 7) Simpan ke library (non-blocking; URL Replicate sementara — lihat catatan)
    supabase.from('ai_assets').insert({
      user_id: user.id, type: 'model-swap',
      prompt: positive.slice(0, 500), output_url: urls[0],
      preset: presetId, metadata: { swapMode, hairstyle, bodyType, skinTone, numResults },
      created_at: new Date().toISOString(),
    }).then(() => {}, () => {})

    const elapsed    = Date.now() - t0
    const quotaUsed  = access.dailyUsed + 1
    const quotaLimit = access.dailyLimit

    // 8) 1 hasil = binary PNG (tampil cepat), banyak = JSON
    if (numResults === 1) {
      const imgRes = await fetch(urls[0])
      if (imgRes.ok) {
        const out = Buffer.from(await imgRes.arrayBuffer())
        return new NextResponse(out, { status: 200, headers: {
          'Content-Type': 'image/png',
          'x-elapsed-ms': String(elapsed),
          'x-quota-used': String(quotaUsed),
          'x-quota-limit': String(quotaLimit),
        }})
      }
    }
    return NextResponse.json(
      { urls, quotaUsed, quotaLimit, elapsedMs: elapsed },
      { status: 200, headers: {
        'x-elapsed-ms': String(elapsed),
        'x-quota-used': String(quotaUsed),
        'x-quota-limit': String(quotaLimit),
      }},
    )
  } catch (err: any) {
    console.error('[api/studio/model-swap]', err)
    return NextResponse.json({ error: `Generate gagal: ${err?.message ?? 'error tak terduga'}` }, { status: 502 })
  }
}