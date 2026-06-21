// app/api/studio/face-swap/route.ts  ← FILE BARU
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceToolAccess, consumeCredits, logToolUsage } from '@/lib/tools/enforce'
import { predict, getOutputUrl, toDataUri } from '@/lib/replicate'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const TOOL_ID = 'face-swap'
// ⚠️ ISI dengan version hash model face-swap di Replicate-mu (mis. cdingram/face-swap).
//    Kosong = route sengaja menolak biar tidak salah panggil model.
const FACE_SWAP_VERSION = ''
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED   = new Set(['image/jpeg','image/jpg','image/png','image/webp'])
const COST_USD  = 0.01

export async function POST(req: Request) {
  const t0 = Date.now()
  const supabase = await createClient()

  // 1) Auth
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Silakan login dulu.' }, { status: 401 })

  // 2) Enforce
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

  const target = form.get('target')
  const face   = form.get('face')
  if (!(target instanceof File) || !(face instanceof File))
    return NextResponse.json({ error: 'Foto target & wajah referensi wajib diupload.' }, { status: 400 })
  for (const f of [target, face]) {
    if (!ALLOWED.has(f.type)) return NextResponse.json({ error: 'Format harus JPG, PNG, atau WEBP.' }, { status: 400 })
    if (f.size > MAX_BYTES)   return NextResponse.json({ error: 'Ukuran gambar maksimal 15MB.' }, { status: 400 })
  }
  const matchMode = String(form.get('matchMode') ?? 'match_current_model')

  if (!FACE_SWAP_VERSION)
    return NextResponse.json({ error: 'Model face-swap belum dikonfigurasi (FACE_SWAP_VERSION kosong).' }, { status: 500 })

  try {
    const targetUri = await toDataUri(Buffer.from(await target.arrayBuffer()), target.type || 'image/jpeg')
    const faceUri   = await toDataUri(Buffer.from(await face.arrayBuffer()),   face.type   || 'image/jpeg')

    // ⚠️ Nama field input tergantung model — cek docs model di Replicate
    //    (umum: target_image/swap_image atau input_image/swap_image).
    const pred = await predict(FACE_SWAP_VERSION, {
      target_image: targetUri,
      swap_image:   faceUri,
    })
    const url = getOutputUrl(pred)

    // Potong kredit (superuser di-skip) + COGS
    if (!access.isSuperuser) {
      await consumeCredits(supabase, user.id, TOOL_ID, access.creditCost, { description: `Face Swap (${matchMode})` })
    }
    await logToolUsage(supabase, user.id, TOOL_ID, 'replicate', COST_USD, Date.now() - t0)

    supabase.from('ai_assets').insert({
      user_id: user.id, type: 'face-swap', output_url: url,
      metadata: { matchMode }, created_at: new Date().toISOString(),
    }).then(() => {}, () => {})

    const elapsed = Date.now() - t0
    return NextResponse.json(
      { url, quotaUsed: access.dailyUsed + 1, quotaLimit: access.dailyLimit, elapsedMs: elapsed },
      { status: 200, headers: {
        'x-elapsed-ms':  String(elapsed),
        'x-quota-used':  String(access.dailyUsed + 1),
        'x-quota-limit': String(access.dailyLimit),
      }},
    )
  } catch (err: any) {
    console.error('[api/studio/face-swap]', err)
    return NextResponse.json({ error: `Generate gagal: ${err?.message ?? 'error tak terduga'}` }, { status: 502 })
  }
}