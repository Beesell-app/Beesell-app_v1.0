// app/api/studio/video/talking-head/route.ts
// ══════════════════════════════════════════════════════════════
// AI TALKING HEAD API
// ══════════════════════════════════════════════════════════════
//
// POST ?action=...
//
// action=generate-script
//   → Claude AI: produk info → script presenter + segmen emosi
//
// action=tts-preview
//   → ElevenLabs: text segment → audio preview URL (30s preview)
//
// action=full-tts
//   → ElevenLabs: full script per segmen → combined audio
//
// action=render-talking-head
//   → D-ID API: avatar + audio → talking head video
//   → QStash async job → webhook saat selesai
//
// action=check-consent
//   → Validate custom avatar upload + consent signature
//
// action=upload-custom-avatar
//   → Upload foto wajah → R2 storage → return URL for D-ID

import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import Anthropic         from '@anthropic-ai/sdk'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { withCredits } from '@/lib/credit-middleware'
import { AVATAR_LIBRARY, VOICE_LIBRARY, EMOTION_SETTINGS, BACKGROUND_PRESETS,
  type TalkingHeadConfig, type ScriptSegment, type VoiceEmotion,
} from '@/lib/avatar/types'

export const dynamic     = 'force-dynamic'
export const maxDuration = 60

// ── Helpers ───────────────────────────────────────────────────
const getAnthropicClient = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function makeR2() {
  return new S3Client({
    region:   'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
    credentials: {
      accessKeyId:     process.env.CLOUDFLARE_ACCESS_KEY!,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY!,
    },
  })
}

// ── ElevenLabs TTS per segment ────────────────────────────────
async function generateTTSSegment(params: {
  text:       string
  voiceId:    string
  emotion:    VoiceEmotion
  speed:      number
  apiKey:     string
}): Promise<Buffer> {
  const emotionCfg = EMOTION_SETTINGS[params.emotion]
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${params.voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key':    params.apiKey,
        'Content-Type':  'application/json',
        'Accept':        'audio/mpeg',
      },
      body: JSON.stringify({
        text:           params.text,
        model_id:       'eleven_multilingual_v2',
        voice_settings: {
          stability:             (emotionCfg.stabilityRange[0] + emotionCfg.stabilityRange[1]) / 2,
          similarity_boost:      emotionCfg.similarityBoost,
          style:                 emotionCfg.styleExaggeration,
          use_speaker_boost:     true,
          speaking_rate:         params.speed,   // 0.75–1.5
        },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ElevenLabs ${res.status}: ${JSON.stringify(err)}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

// ── D-ID Talking Head render ───────────────────────────────────
async function requestDIDVideo(params: {
  avatarImageUrl: string
  audioUrl:       string
  webhookUrl:     string
  jobId:          string
  apiKey:         string
}): Promise<string> {
  const body = {
    source_url:    params.avatarImageUrl,
    driver_url:    'bank://lively',
    script: {
      type:        'audio',
      audio_url:   params.audioUrl,
      subtitles:   false,
    },
    config: {
      stitch:        true,
      fluent:        true,
      pad_audio:     0.0,
      reduce_noise:  false,
      result_format: 'mp4',
    },
    webhook: params.webhookUrl,
    metadata: { jobId: params.jobId },
  }
  const res = await fetch('https://api.d-id.com/talks', {
    method:  'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(params.apiKey+':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(()=>({}))
    throw new Error(`D-ID ${res.status}: ${err.description ?? JSON.stringify(err)}`)
  }
  const data = await res.json()
  return data.id as string   // D-ID talk ID
}

// ══════════════════════════════════════════════════════════════
// HANDLER
// ══════════════════════════════════════════════════════════════
async function handlePOST(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user }, error:authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    const url    = new URL(req.url)
    const action = url.searchParams.get('action') ?? 'render-talking-head'

    // ── Plan check ──────────────────────────────────────────
    const { data:profile } = await supabase.from('profiles')
      .select('plan, video_used, video_limit').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error:'Profil tidak ditemukan' }, { status:404 })

    // ══════════════════════════════════════════════════════════
    // ACTION: generate-script
    // ══════════════════════════════════════════════════════════
    if (action === 'generate-script') {
      const body = await req.json()
      const {
        productName, productDesc, productPrice, productBenefit,
        duration = 30, niche = 'general', platform = 'tiktok',
        language = 'id-formal', avatarStyle = 'casual',
        tone = 'friendly',
      } = body

      if (!productName?.trim()) {
        return NextResponse.json({ error:'Nama produk wajib diisi' }, { status:400 })
      }

      const anthropic = getAnthropicClient()
      const langDesc =
        (
          {
            'id-formal': 'Indonesia formal baku',
            'id-gaul': 'Indonesia gaul/informal Jakarta (bro, bestie, dll)',
            jawa: 'Indonesia dengan logat Jawa ringan',
            sunda: 'Indonesia dengan logat Sunda ringan',
            minang: 'Indonesia dengan logat Minang ringan',
            'mix-en': 'Mix Indonesia-English untuk audiens urban',
          } as Record<string, string>
        )[language] ?? 'Indonesia formal'

      const durationDesc = duration <= 30 ? '30 detik (hook + benefit + CTA)' : duration <= 60 ? '60 detik (hook + masalah + solusi + bukti + CTA)' : '90 detik (storytelling lengkap)'

      const msg = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `Kamu adalah scriptwriter iklan video terbaik Indonesia. Tulis script untuk avatar AI presenter.
Rules:
- Bahasa: ${langDesc}
- Tone: ${tone}
- Platform: ${platform} (${durationDesc})
- Script harus natural seperti orang bicara sungguhan, BUKAN teks iklan kaku
- Gunakan SPASI untuk jeda, [JEDA] untuk pause lebih lama
- Output HANYA JSON, tanpa markdown`,
        messages: [{
          role:    'user',
          content: `Buat script presenter avatar AI untuk:
Produk: ${productName}
Harga: ${productPrice ?? 'kompetitif'}
Deskripsi: ${productDesc ?? ''}
Benefit utama: ${productBenefit ?? 'kualitas terbaik'}
Niche: ${niche}
Durasi target: ${duration} detik

Output JSON:
{
  "script": "full script text dengan [JEDA] untuk pause",
  "segments": [
    {
      "id": "seg1",
      "text": "teks segmen",
      "emotion": "neutral|excited|calm|urgent|empathetic|whispering",
      "speed": 0.75-1.5,
      "pause": 0-2,
      "note": "catatan sutradara singkat"
    }
  ],
  "estimatedDuration": number_seconds,
  "hook": "kalimat hook pertama (5 detik pertama)",
  "cta": "call to action terakhir",
  "directorNotes": "3 saran sutradara untuk delivery terbaik"
}`,
        }],
      })

      const raw  = (msg.content[0] as any).text ?? '{}'
      const clean = raw.replace(/```json?|```/g, '').trim()
      const data  = JSON.parse(clean)

      return NextResponse.json({ success:true, ...data })
    }

    // ══════════════════════════════════════════════════════════
    // ACTION: tts-preview
    // ══════════════════════════════════════════════════════════
    if (action === 'tts-preview') {
      const body = await req.json()
      const { text, voiceId, emotion = 'neutral', speed = 1.0 } = body

      const apiKey = process.env.ELEVENLABS_API_KEY
      if (!apiKey) return NextResponse.json({ error:'ElevenLabs API key tidak di-set' }, { status:503 })

      const voice = VOICE_LIBRARY.find(v => v.id === voiceId)
      const elevId = voice?.elevenLabsId ?? voiceId

      // Limit preview to 200 chars
      const previewText = (text ?? 'Halo, selamat datang di BeeSell AI!').substring(0, 200)

      try {
        const audioBuffer = await generateTTSSegment({
          text:    previewText,
          voiceId: elevId,
          emotion: emotion as VoiceEmotion,
          speed:   Math.min(1.5, Math.max(0.75, speed)),
          apiKey,
        })
        return new Response(
          new Uint8Array(audioBuffer),
          {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'no-store',
            },
          }
        )
      } catch (err: any) {
        return NextResponse.json({ error:`TTS gagal: ${err.message}` }, { status:502 })
      }
    }

    // ══════════════════════════════════════════════════════════
    // ACTION: full-tts
    // Generate full TTS for all segments, upload to R2
    // ══════════════════════════════════════════════════════════
    if (action === 'full-tts') {
      const body = await req.json()
      const { voiceId, segments, jobId } = body as {
        voiceId:  string
        segments: ScriptSegment[]
        jobId:    string
      }

      const apiKey = process.env.ELEVENLABS_API_KEY
      if (!apiKey) return NextResponse.json({ error:'ElevenLabs API key tidak di-set' }, { status:503 })

      const voice = VOICE_LIBRARY.find(v => v.id === voiceId)
      const elevId = voice?.elevenLabsId ?? voiceId

      // Generate each segment
      const audioBuffers: Buffer[] = []
      for (const seg of segments) {
        const buf = await generateTTSSegment({
          text:    seg.text,
          voiceId: elevId,
          emotion: seg.emotion,
          speed:   Math.min(1.5, Math.max(0.75, seg.speed)),
          apiKey,
        })
        audioBuffers.push(buf)
        // Add pause (silence) between segments if needed
        // Simple concatenation — proper mixing done in Lambda
      }

      // Concatenate audio buffers
      const combined = Buffer.concat(audioBuffers)

      // Upload to R2
      const r2    = makeR2()
      const r2Key = `talking-head/audio/${user.id}/${jobId}.mp3`
      await r2.send(new PutObjectCommand({
        Bucket:      process.env.CLOUDFLARE_R2_BUCKET!,
        Key:         r2Key,
        Body:        combined,
        ContentType: 'audio/mpeg',
      }))

      const audioUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`
      return NextResponse.json({ success:true, audioUrl, segments: segments.length, r2Key })
    }

    // ══════════════════════════════════════════════════════════
    // ACTION: render-talking-head
    // ══════════════════════════════════════════════════════════
    if (action === 'render-talking-head') {
      const body = await req.json()
      const config = body as TalkingHeadConfig & { audioUrl:string }

      // Quota check
      const vidUsed  = profile.video_used  ?? 0
      const vidLimit = profile.video_limit ?? 5
      if (vidUsed >= vidLimit && !['pro','business'].includes(profile.plan ?? '')) {
        return NextResponse.json({
          error:        `Kuota video habis (${vidUsed}/${vidLimit}). Beli topup atau upgrade plan.`,
          quotaExceeded:true,
        }, { status:429 })
      }

      const didKey = process.env.DID_API_KEY
      if (!didKey) return NextResponse.json({ error:'D-ID API key tidak di-set' }, { status:503 })

      // Get avatar image URL
      const avatar = AVATAR_LIBRARY.find(a => a.id === config.avatarId)
      let avatarImageUrl = avatar?.didAvatarUrl
      if (config.customImageUrl) {
        if (!config.consentGiven) {
          return NextResponse.json({ error:'Consent wajah diperlukan untuk custom avatar' }, { status:403 })
        }
        avatarImageUrl = config.customImageUrl
      }
      if (!avatarImageUrl) return NextResponse.json({ error:'Avatar tidak ditemukan' }, { status:400 })
      if (!config.audioUrl)  return NextResponse.json({ error:'audioUrl diperlukan (jalankan full-tts dahulu)' }, { status:400 })

      // Create job in DB
      const jobId = `th_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
      await supabase.from('talking_head_jobs').insert({
        id:           jobId,
        user_id:      user.id,
        status:       'pending',
        avatar_id:    config.avatarId,
        voice_id:     config.voiceId,
        audio_url:    config.audioUrl,
        config:       config,
        created_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })

      // Pre-deduct quota
      await supabase.from('profiles').update({ video_used: vidUsed + 1 }).eq('id', user.id)

      // Dispatch to D-ID
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/studio/video/talking-head/webhook`
      let didTalkId: string
      try {
        didTalkId = await requestDIDVideo({
          avatarImageUrl,
          audioUrl:   config.audioUrl,
          webhookUrl: `${webhookUrl}?jobId=${jobId}&secret=${process.env.WEBHOOK_SECRET}`,
          jobId,
          apiKey:     didKey,
        })
      } catch (didErr: any) {
        // Refund quota on error
        await supabase.from('profiles').update({ video_used: vidUsed }).eq('id', user.id)
        await supabase.from('talking_head_jobs').update({ status:'failed', error_message:didErr.message }).eq('id', jobId)
        return NextResponse.json({ error:`D-ID error: ${didErr.message}` }, { status:502 })
      }

      // Update job with D-ID id
      await supabase.from('talking_head_jobs').update({ did_talk_id:didTalkId, status:'processing' }).eq('id', jobId)

      return NextResponse.json({
        success:      true,
        jobId,
        didTalkId,
        status:       'processing',
        message:      'Avatar presenter sedang dirender. Estimasi 2-5 menit.',
        estimatedSec: 180,
      }, { status:202 })
    }

    // ══════════════════════════════════════════════════════════
    // ACTION: check-consent
    // ══════════════════════════════════════════════════════════
    if (action === 'check-consent') {
      // Returns consent form requirements for custom avatar
      return NextResponse.json({
        required: true,
        message:  'Untuk menggunakan wajah sendiri, kamu perlu memberikan consent bahwa wajah tersebut adalah milikmu dan kamu menyetujui penggunaannya untuk avatar AI.',
        points: [
          'Foto yang diupload adalah wajah saya sendiri atau orang yang telah memberikan izin tertulis',
          'Saya memahami bahwa AI akan menganimasikan wajah tersebut untuk berbicara',
          'Saya tidak akan menggunakan fitur ini untuk membuat konten menyesatkan atau merugikan pihak lain',
          'Saya bertanggung jawab penuh atas penggunaan avatar custom ini',
        ],
        consentVersion: '2025-01',
      })
    }

    // ══════════════════════════════════════════════════════════
    // ACTION: upload-custom-avatar
    // ══════════════════════════════════════════════════════════
    if (action === 'upload-custom-avatar') {
      const formData = await req.formData()
      const file     = formData.get('file') as File | null
      const consent  = formData.get('consentGiven') === 'true'

      if (!consent) return NextResponse.json({ error:'Consent diperlukan sebelum upload wajah' }, { status:403 })
      if (!file)    return NextResponse.json({ error:'File wajib diisi' }, { status:400 })

      const allowed = new Set(['image/jpeg','image/jpg','image/png','image/webp'])
      if (!allowed.has(file.type)) return NextResponse.json({ error:'Format harus JPG, PNG, atau WEBP' }, { status:400 })
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error:'Ukuran file maks 10MB' }, { status:413 })

      const ext    = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const key    = `talking-head/custom-avatar/${user.id}/${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const r2     = makeR2()

      await r2.send(new PutObjectCommand({
        Bucket:      process.env.CLOUDFLARE_R2_BUCKET!,
        Key:         key,
        Body:        buffer,
        ContentType: file.type,
      }))

      // Log consent
      try {
        await supabase.from('avatar_consent_log').insert({
          user_id: user.id,
          avatar_key: key,
          consent_given: true,
          consent_version: '2025-01',
          created_at: new Date().toISOString(),
        })
      } catch {
        // ignore consent log failure
      }
      const avatarUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
      return NextResponse.json({ success:true, avatarUrl, key })
    }

    return NextResponse.json({ error:`Action '${action}' tidak dikenal` }, { status:400 })

  } catch (err: any) {
    console.error('[talking-head API]', err)
    return NextResponse.json({ error:err?.message ?? 'Server error' }, { status:500 })
  }
}

// ══════════════════════════════════════════════════════════════
// WEBHOOK: D-ID callback
// GET /api/studio/video/talking-head/webhook?jobId=&secret=
// ══════════════════════════════════════════════════════════════
export async function GET(req: Request) {
  const url = new URL(req.url)

  const jobId = url.searchParams.get('jobId')
  const secret = url.searchParams.get('secret')
  const event = url.searchParams.get('event')

  if (secret !== process.env.WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!jobId) {
    return new Response('Missing jobId', { status: 400 })
  }

  const supabase = await createClient()

  if (event === 'completed') {
    const resultUrl = url.searchParams.get('result_url')

    await supabase
      .from('talking_head_jobs')
      .update({
        status: 'completed',
        output_url: resultUrl,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    const { data: job } = await supabase
      .from('talking_head_jobs')
      .select('user_id, avatar_id')
      .eq('id', jobId)
      .single()

    if (job && resultUrl) {
      try {
        await supabase.from('ai_assets').insert({
          user_id: job.user_id,
          type: 'video',
          tool_name: 'AI Talking Head',
          title: `Avatar Presenter — ${new Date().toLocaleDateString('id-ID')}`,
          file_url: resultUrl,
          parameters: {
            jobId,
            avatarId: job.avatar_id,
          },
          created_at: new Date().toISOString(),
        })
      } catch {
        // ignore asset library failure
      }

      try {
        await supabase.channel(`talking-head-${jobId}`).send({
          type: 'broadcast',
          event: 'completed',
          payload: {
            jobId,
            status: 'completed',
            outputUrl: resultUrl,
          },
        })
      } catch {
        // ignore realtime failure
      }
    }
  }

  else if (event === 'error') {
    const errMsg =
      url.searchParams.get('error') ??
      'Unknown D-ID error'

    await supabase
      .from('talking_head_jobs')
      .update({
        status: 'failed',
        error_message: errMsg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    const { data: job } = await supabase
      .from('talking_head_jobs')
      .select('user_id')
      .eq('id', jobId)
      .single()

    if (job) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('video_used')
        .eq('id', job.user_id)
        .single()

      if ((prof?.video_used ?? 0) > 0) {
        await supabase
          .from('profiles')
          .update({
            video_used: (prof?.video_used ?? 1) - 1,
          })
          .eq('id', job.user_id)
      }
    }

    try {
      await supabase.channel(`talking-head-${jobId}`).send({
        type: 'broadcast',
        event: 'failed',
        payload: {
          jobId,
          status: 'failed',
          error: errMsg,
        },
      })
    } catch {
      // ignore realtime failure
    }
  }

  return new Response('OK', { status: 200 })
}