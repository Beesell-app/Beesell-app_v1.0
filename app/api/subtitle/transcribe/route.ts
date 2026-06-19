// app/api/subtitle/transcribe/route.ts
// ══════════════════════════════════════════════════════════════
// SUBTITLE TRANSCRIBE API — Next.js entry point
// ══════════════════════════════════════════════════════════════
//
// POST /api/subtitle/transcribe
//   multipart body:
//     file         → audio or video file (mp3, mp4, wav, m4a, webm)
//     style        → subtitle style id
//     language     → 'id' | 'en'
//     videoUrl     → optional: already-hosted video URL (skip upload)
//     customSRT    → optional: user-written SRT (skip Whisper)
//     webhookUrl   → where Lambda calls back (auto-filled)
//
// Flow:
//   1. Validate file + plan
//   2. Upload to S3 (temp storage for Lambda to read)
//   3. Insert subtitle_job record → DB (status=pending)
//   4. Invoke Lambda asynchronously (Event invocation)
//   5. Return 202 { jobId } immediately
//
// Result comes via webhook → /api/subtitle/webhook
// Client polls /api/subtitle/status?jobId={id}

import { NextResponse }   from 'next/server'
import { createClient }   from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { checkToolAllowed } from '@/lib/tools/access'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30   // just upload + lambda kick-off

const MAX_FILE_MB  = 100
const MAX_BYTES    = MAX_FILE_MB * 1024 * 1024
const ALLOWED_MIME = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
  'audio/x-wav', 'audio/m4a', 'audio/mp4',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/webm', 'audio/ogg',
])

function makeS3() {
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

function makeLambda() {
  return new LambdaClient({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

export async function POST(req: Request) {
  const t0 = Date.now()
  try {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data:{ user }, error:authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
    const gate = await checkToolAllowed(supabase, user.id, 'transcribe')
    if (!gate.allowed) {
      return NextResponse.json({ error:'TOOL_DISABLED', message: gate.reason || 'Tool ini sedang tidak tersedia.' }, { status: 403 })
    }
    // ── Parse form ────────────────────────────────────────────
    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error:'Body harus multipart/form-data' }, { status:400 }) }

    const file       = formData.get('file')       as File   | null
    const videoUrl   = formData.get('videoUrl')   as string | null
    const customSRT  = formData.get('customSRT')  as string | null
    const style      = (formData.get('style')     as string) || 'tiktok-bold'
    const language   = (formData.get('language')  as string) || 'id'

    // Validate: need at least one source
    if (!file && !videoUrl && !customSRT) {
      return NextResponse.json({ error:'Upload file audio/video, atau sertakan videoUrl atau customSRT' }, { status:400 })
    }

    if (file) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json({ error:`Format ${file.type} tidak didukung. Gunakan MP3, MP4, WAV, M4A, atau WEBM.` }, { status:400 })
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error:`File maksimal ${MAX_FILE_MB}MB. File kamu: ${(file.size/1024/1024).toFixed(0)}MB` }, { status:413 })
      }
    }

    // ── Plan check ────────────────────────────────────────────
    const { data:profile } = await supabase
      .from('profiles')
      .select('plan, subtitle_used, subtitle_limit')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error:'Profil tidak ditemukan' }, { status:404 })

    const subUsed  = profile.subtitle_used  ?? 0
    const subLimit = profile.subtitle_limit ?? 10
    if (subUsed >= subLimit) {
      return NextResponse.json({ error:`Kuota subtitle habis (${subUsed}/${subLimit}). Upgrade plan untuk lebih banyak.`, quotaExceeded:true }, { status:429 })
    }

    // ── Generate job ID ───────────────────────────────────────
    const jobId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // ── Upload file to S3 (temp input for Lambda) ─────────────
    let s3Key:    string | null = null
    let inputUrl: string | null = videoUrl ?? null

    if (file) {
      const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
      s3Key      = `subtitle-inputs/${user.id}/${jobId}.${ext}`
      const buf  = await file.arrayBuffer()
      const s3   = makeS3()
      await s3.send(new PutObjectCommand({
        Bucket:      process.env.AWS_S3_BUCKET!,
        Key:         s3Key,
        Body:        Buffer.from(buf),
        ContentType: file.type,
      }))
      console.log(`[subtitle/transcribe] Uploaded to S3: ${s3Key}`)
    }

    // ── Determine if input is audio-only ─────────────────────
    const isAudioOnly = file
      ? file.type.startsWith('audio/')
      : false

    // ── App URL (for webhook) ─────────────────────────────────
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL!
    const webhookUrl = `${appUrl}/api/subtitle/webhook`

    // ── Insert DB record ──────────────────────────────────────
    await supabase.from('subtitle_jobs').insert({
      id:           jobId,
      user_id:      user.id,
      status:       'pending',
      style,
      language,
      s3_key:       s3Key,
      video_url:    inputUrl,
      has_video:    !isAudioOnly && !!file,
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })

    // ── Pre-deduct quota ──────────────────────────────────────
    await supabase.from('profiles')
      .update({ subtitle_used: subUsed + 1 })
      .eq('id', user.id)

    // ── Invoke Lambda (asynchronous, Event type) ──────────────
    const lambdaPayload = {
      jobId,
      userId:   user.id,
      s3Key,
      videoUrl: inputUrl,
      style,
      language,
      webhookUrl,
      customSRT: customSRT ?? null,
    }

    const lambda   = makeLambda()
    const funcName = process.env.LAMBDA_SUBTITLE_FUNCTION || 'beesell-subtitle-worker'

    try {
      await lambda.send(new InvokeCommand({
        FunctionName:   funcName,
        InvocationType: 'Event',          // async — Lambda doesn't wait for result
        Payload:        Buffer.from(JSON.stringify({ body: JSON.stringify(lambdaPayload) })),
      }))
      console.log(`[subtitle/transcribe] Lambda invoked: ${jobId}`)
    } catch (lambdaErr: any) {
      // Rollback
      await supabase.from('subtitle_jobs').delete().eq('id', jobId)
      await supabase.from('profiles').update({ subtitle_used: subUsed }).eq('id', user.id)
      console.error('[subtitle/transcribe] Lambda invoke failed:', lambdaErr)
      return NextResponse.json({ error:'Gagal menjalankan AI subtitle. Coba lagi.' }, { status:503 })
    }

    const dispatchMs = Date.now() - t0

    return NextResponse.json({
      success:      true,
      jobId,
      status:       'pending',
      estimatedSec: file ? Math.ceil(file.size / (1024 * 100)) + 15 : 30,
      style,
      language,
      message:      'Subtitle sedang diproses oleh AI. Cek status via /api/subtitle/status.',
      dispatchMs,
    }, { status:202 })

  } catch (err: any) {
    console.error('[subtitle/transcribe]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status:500 })
  }
}