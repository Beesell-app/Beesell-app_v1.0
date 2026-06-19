// app/api/subtitle/burn/route.ts
// ══════════════════════════════════════════════════════════════
// SUBTITLE BURN — Burn existing SRT into video
// POST /api/subtitle/burn
// ══════════════════════════════════════════════════════════════
//
// Used when:
//   - User has SRT from a previous transcription
//   - User wants to change subtitle style without re-transcribing
//   - User wrote custom SRT manually
//
// Flow:
//   1. Validate SRT + video URL
//   2. Create new job record (reuse = true)
//   3. Invoke Lambda with customSRT (skip Whisper step)
//   4. Return 202 { jobId }

import { NextResponse }   from 'next/server'
import { createClient }   from '@/lib/supabase/server'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { S3Client, PutObjectCommand }  from '@aws-sdk/client-s3'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 20

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
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const body = await req.json()
    const {
      videoUrl,       // video to burn subtitles into (required)
      srtContent,     // SRT string (required)
      sourceJobId,    // optional: reference to original transcription job
      style = 'tiktok-bold',
      language = 'id',
    } = body

    if (!videoUrl?.trim()) return NextResponse.json({ error:'videoUrl wajib diisi' }, { status:400 })
    if (!srtContent?.trim()) return NextResponse.json({ error:'srtContent wajib diisi' }, { status:400 })

    // Validate SRT format (basic check)
    if (!srtContent.includes(' --> ')) {
      return NextResponse.json({ error:'Format SRT tidak valid. Harus berisi timestamp (HH:MM:SS,ms --> HH:MM:SS,ms)' }, { status:400 })
    }

    const jobId = `burn_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    // Insert job
    await supabase.from('subtitle_jobs').insert({
      id:            jobId,
      user_id:       user.id,
      status:        'pending',
      style,
      language,
      video_url:     videoUrl,
      has_video:     true,
      is_burn_only:  true,
      source_job_id: sourceJobId ?? null,
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    })

    // Invoke Lambda (with customSRT → skip Whisper)
    const lambdaPayload = {
      jobId,
      userId:      user.id,
      videoUrl,
      customSRT:   srtContent,
      style,
      language,
      webhookUrl:  `${appUrl}/api/subtitle/webhook`,
    }

    const lambda = makeLambda()
    try {
      await lambda.send(new InvokeCommand({
        FunctionName:   process.env.LAMBDA_SUBTITLE_FUNCTION || 'beesell-subtitle-worker',
        InvocationType: 'Event',
        Payload:        Buffer.from(JSON.stringify({ body: JSON.stringify(lambdaPayload) })),
      }))
    } catch (lambdaErr: any) {
      await supabase.from('subtitle_jobs').delete().eq('id', jobId)
      return NextResponse.json({ error:'Lambda invocation gagal. Coba lagi.' }, { status:503 })
    }

    return NextResponse.json({
      success:      true,
      jobId,
      status:       'pending',
      estimatedSec: 45,
      message:      `Subtitle style "${style}" sedang diburn ke video. Estimasi ~45s.`,
    }, { status:202 })

  } catch (err: any) {
    console.error('[subtitle/burn]', err)
    return NextResponse.json({ error:err?.message }, { status:500 })
  }
}