// app/api/studio/video/generator/route.ts
// ══════════════════════════════════════════════════════════════
// AI VIDEO GENERATOR — Backend API
// ══════════════════════════════════════════════════════════════
//
// POST ?action=script      → generate marketing script via Claude
// POST ?action=subtitle    → generate timed subtitle from script
// POST ?action=sounds      → get trending sound recommendations
// POST ?action=tts-preview → ElevenLabs TTS preview (avatar voice)
// POST ?action=video       → full video dispatch to QStash worker
//
// Video generation pipeline (async via QStash):
//   Slideshow     → Creatomate / FFmpeg API
//   Talking Head  → D-ID API (avatar + lipsync)
//   Combined      → Slideshow background + D-ID PiP overlay

import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import Anthropic         from '@anthropic-ai/sdk'
import {
  AVATAR_PRESETS, TRENDING_SOUNDS, SUBTITLE_STYLES,
  generateScriptTemplate, generateSlideTexts,
  getRecommendedSounds,
  type VideoModuleId, type DurationSec, type PlatformId,
  type NicheId, type AvatarId, type SubtitleStyle,
  type SlideLayout, type TransitionId,
} from '@/lib/studio/video/video-generator-presets'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

// ── ElevenLabs TTS voice map (ID → real voice ID) ─────────────
const ELEVEN_VOICE_MAP: Record<AvatarId, string> = {
  'f-indo-young':  '21m00Tcm4TlvDq8ikWAM', // Rachel
  'f-indo-mature': 'AZnzlk1XvdvUeBnXmlld', // Bella
  'f-hijab':       'EXAVITQu4vr4xnSDxMaL', // Elli
  'f-asia':        'ErXwobaYiN019PkySvjV', // Antoni
  'f-pro':         'MF3mGyEYCl7XYWbV9V6O', // Domi
  'm-indo-young':  'TxGEqnHWrfWFTfGW9XjX', // Josh
  'm-indo-mature': 'VR6AewLTigWG4xSOukaG', // Adam
  'm-pro':         'pNInz6obpgDQGcFmaJgB', // Sam
  'm-casual':      'yoZ06aMxZJJ28mfd3POQ', // Callum
}

// ── D-ID avatar URL map ────────────────────────────────────────
const DID_AVATAR_MAP: Record<AvatarId, string> = {
  'f-indo-young':  'https://clips.d-id.com/alice_white/image.jpeg',
  'f-indo-mature': 'https://clips.d-id.com/amy-jc9/image.jpeg',
  'f-hijab':       'https://clips.d-id.com/alice_white/image.jpeg',
  'f-asia':        'https://clips.d-id.com/alice_white/image.jpeg',
  'f-pro':         'https://clips.d-id.com/amy-jc9/image.jpeg',
  'm-indo-young':  'https://clips.d-id.com/api-docs-img/dr.jpg',
  'm-indo-mature': 'https://clips.d-id.com/api-docs-img/mr.jpg',
  'm-pro':         'https://clips.d-id.com/api-docs-img/mr.jpg',
  'm-casual':      'https://clips.d-id.com/api-docs-img/dr.jpg',
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── POST handler ──────────────────────────────────────────────
export async function POST(req: Request) {
  const t0  = Date.now()
  const url = new URL(req.url)
  const action = url.searchParams.get('action') ?? 'script'

  try {
    const supabase = await createClient()
    const { data:{ user }, error:authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

    // ── action=script: generate marketing script ──────────────
    if (action === 'script') {
      const body = await req.json()
      const { productName, productPrice, benefit, painPoint, cta, niche, platform, duration, avatarId, tone, language } = body

      if (!productName?.trim()) return NextResponse.json({ error:'Nama produk wajib diisi' }, { status:400 })

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const systemPrompt = `You are BeeSell AI Video Script Generator for Indonesian e-commerce.
Generate a ${duration}-second marketing video script optimized for ${platform}.
Language: ${language === 'indonesia' ? 'bahasa Indonesia natural, casual, relatable' : 'English'}.
Tone: ${tone ?? 'energik dan friendly'}.

Rules:
- Script harus sesuai durasi: ${duration}s = max ${Math.floor(duration * 2.5)} kata spoken
- Hook kuat di kalimat pertama (3 detik pertama = stop-scroll)
- Natural seperti orang bicara, bukan kaku
- Sertakan CTA yang spesifik di akhir
- Format: script langsung tanpa stage directions, hanya kata yang diucapkan

Output JSON: { "script": string, "hooks": string[] (3 variants), "slideTexts": [{heading, sub}] (max 7 slides), "hashtags": string[] (5 relevant) }`

      const msg = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 800,
        system:     systemPrompt,
        messages:   [{
          role:    'user',
          content: `Product: ${productName} | Price: ${productPrice ?? 'kompetitif'} | Benefit: ${benefit ?? 'kualitas terjamin'} | Pain: ${painPoint ?? ''} | CTA: ${cta ?? 'Order sekarang!'} | Niche: ${niche} | Duration: ${duration}s | Platform: ${platform}\n\nGenerate marketing video script. JSON only.`,
        }],
      })

      const raw   = (msg.content[0] as any).text ?? '{}'
      const clean = raw.replace(/```json?|```/g,'').trim()
      let parsed: any = {}
      try { parsed = JSON.parse(clean) }
      catch {
        // Fallback
        const fallbackScript = generateScriptTemplate({ niche: niche as NicheId, productName, benefit: benefit ?? '', cta: cta ?? 'Order sekarang!', duration: duration as DurationSec, platform: platform as PlatformId })
        parsed = {
          script:     fallbackScript,
          hooks:      [`Ini dia ${productName} yang viral!`, `Jangan scroll dulu, ini penting!`, `Review jujur ${productName}:`],
          slideTexts: generateSlideTexts({ productName, benefit:benefit??'', price:productPrice??'', cta:cta??'Order sekarang!', duration:duration as DurationSec, niche:niche as NicheId }),
          hashtags:   [`#${productName.replace(/\s/g,'')}`, '#TikTokShop', '#Shopee', '#BeeSellAI', '#ViralProduct'],
        }
      }

      // Word count & estimated speak time
      const wordCount = (parsed.script ?? '').split(/\s+/).filter(Boolean).length
      const estSpeakSec = Math.round(wordCount / 2.5)

      return NextResponse.json({
        success:     true,
        script:      parsed.script ?? '',
        hooks:       parsed.hooks  ?? [],
        slideTexts:  parsed.slideTexts ?? [],
        hashtags:    parsed.hashtags ?? [],
        wordCount,
        estSpeakSec,
        elapsedMs:   Date.now() - t0,
      })
    }

    // ── action=subtitle: generate timed subtitles ─────────────
    if (action === 'subtitle') {
      const body = await req.json()
      const { script, duration, style } = body as {
        script:   string
        duration: number
        style:    SubtitleStyle
      }

      if (!script?.trim()) return NextResponse.json({ error:'Script wajib diisi' }, { status:400 })

      // Break script into timed segments
      const words      = script.split(/\s+/).filter(Boolean)
      const wpm        = 150  // words per minute speaking rate
      const secPerWord = 60 / wpm

      // Group into subtitle lines (5-7 words each)
      const WORDS_PER_LINE = 6
      const subtitles: { id:number; start:number; end:number; text:string; words:string[] }[] = []

      let timeOffset = 0
      for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
        const lineWords = words.slice(i, i + WORDS_PER_LINE)
        const lineDur   = lineWords.length * secPerWord
        subtitles.push({
          id:    subtitles.length + 1,
          start: parseFloat(timeOffset.toFixed(2)),
          end:   parseFloat((timeOffset + lineDur).toFixed(2)),
          text:  lineWords.join(' '),
          words: lineWords,
        })
        timeOffset += lineDur
      }

      // Apply emoji injection for emoji-flow style
      const processedSubs = subtitles.map(sub => {
        let text = sub.text
        if (style === 'emoji-flow') {
          const emojiMap: Record<string,string> = {
            'produk':'📦','bagus':'✨','viral':'🔥','murah':'💰','harga':'💵',
            'beli':'🛒','keren':'😎','suka':'❤️','gratis':'🎁',
            'hari':'📅','order':'✅','coba':'👆','terbukti':'💪','natural':'🌿',
          }
          Object.entries(emojiMap).forEach(([word, emoji]) => {
            text = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), `${word} ${emoji}`)
          })
        }
        if (style === 'tiktok-bold') text = text.toUpperCase()
        return { ...sub, text }
      })

      // Generate SRT format
      const srt = processedSubs.map(s => {
        const toSRTTime = (sec: number) => {
          const h   = Math.floor(sec / 3600)
          const m   = Math.floor((sec % 3600) / 60)
          const ss  = Math.floor(sec % 60)
          const ms  = Math.round((sec % 1) * 1000)
          return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')},${String(ms).padStart(3,'0')}`
        }
        return `${s.id}\n${toSRTTime(s.start)} --> ${toSRTTime(s.end)}\n${s.text}`
      }).join('\n\n')

      return NextResponse.json({ success:true, subtitles:processedSubs, srt, styleId:style, totalLines:subtitles.length })
    }

    // ── action=sounds: get trending sound recommendations ─────
    if (action === 'sounds') {
      const body = await req.json()
      const { niche, platform, duration } = body as { niche:NicheId; platform:PlatformId; duration:DurationSec }

      const sounds = getRecommendedSounds(niche, platform, duration)

      // Add AI insight about sound selection
      const insight = sounds.length > 0
        ? `${sounds[0].title} dengan mood "${sounds[0].mood}" sangat cocok untuk konten ${niche} di ${platform}. Lagu ini memiliki ${sounds[0].bpm} BPM yang optimal untuk durasi ${duration}s.`
        : 'Pilih musik yang sesuai dengan mood produk kamu untuk meningkatkan engagement.'

      return NextResponse.json({ success:true, sounds, insight, total:sounds.length })
    }

    // ── action=tts-preview: ElevenLabs voice preview ──────────
    if (action === 'tts-preview') {
      const body  = await req.json()
      const { text, avatarId, language } = body as { text:string; avatarId:AvatarId; language?:string }

      const apiKey = process.env.ELEVENLABS_API_KEY
      if (!apiKey) return NextResponse.json({ error:'ElevenLabs API key tidak tersedia' }, { status:503 })

      const voiceId = ELEVEN_VOICE_MAP[avatarId] ?? '21m00Tcm4TlvDq8ikWAM'

      // Limit preview text to first 100 chars
      const previewText = text.substring(0, 100).trim()

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method:  'POST',
        headers: { 'xi-api-key':apiKey, 'Content-Type':'application/json' },
        body:    JSON.stringify({
          text:           previewText,
          model_id:       'eleven_multilingual_v2',
          voice_settings: { stability:0.5, similarity_boost:0.8 },
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error:`TTS error: ${err}` }, { status:502 })
      }

      const audioBuffer = await res.arrayBuffer()
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type':  'audio/mpeg',
          'Content-Length': String(audioBuffer.byteLength),
        },
      })
    }

    // ── action=video: dispatch full video job ─────────────────
    if (action === 'video') {
      const formData = await req.formData()

      const moduleId  = formData.get('module')    as VideoModuleId
      const platform  = formData.get('platform')  as PlatformId
      const duration  = parseInt(formData.get('duration') as string) as DurationSec
      const script    = formData.get('script')    as string
      const avatarId  = formData.get('avatarId')  as AvatarId | null
      const soundId   = formData.get('soundId')   as string | null
      const subtitleStyle = formData.get('subtitleStyle') as SubtitleStyle
      const slideTextsRaw = formData.get('slideTexts')   as string | null
      const niche     = formData.get('niche')     as NicheId

      if (!moduleId) return NextResponse.json({ error:'Module wajib dipilih' }, { status:400 })
      if (!script?.trim() && moduleId !== 'slideshow') return NextResponse.json({ error:'Script wajib diisi' }, { status:400 })

      // Check plan
      const { data:profile } = await supabase.from('profiles').select('plan, video_used, video_limit').eq('id', user.id).single()
      if (!profile) return NextResponse.json({ error:'Profil tidak ditemukan' }, { status:404 })
      if (!['basic','pro','business'].includes(profile.plan ?? '')) {
        return NextResponse.json({ error:'Fitur video memerlukan minimal plan Basic.', upgrade:true }, { status:403 })
      }
      const used = profile.video_used ?? 0; const limit = profile.video_limit ?? 5
      if (used >= limit) return NextResponse.json({ error:`Kuota video habis (${used}/${limit}).`, quotaExceeded:true }, { status:429 })

      // Upload product images to storage
      const imageUrls: string[] = []
      for (let i = 0; i < 10; i++) {
        const f = formData.get(`image${i}`) as File | null
        if (!f) break
        const ext  = f.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/video-slides/${Date.now()}-${i}.${ext}`
        const buf  = await f.arrayBuffer()
        const { error:upErr } = await supabase.storage.from('ai-assets').upload(path, buf, { contentType:f.type })
        if (!upErr) {
          const { data:{ publicUrl } } = supabase.storage.from('ai-assets').getPublicUrl(path)
          imageUrls.push(publicUrl)
        }
      }

      // Dispatch to QStash (async worker)
      const jobId     = `vgen_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
      const appUrl    = process.env.NEXT_PUBLIC_APP_URL
      const workerUrl = `${appUrl}/api/video/process`

      const jobPayload = {
        type:          'ai_video_generator',
        jobId,
        userId:        user.id,
        moduleId,
        platform,
        duration,
        script:        script?.trim() ?? '',
        avatarId,
        avatarUrl:     avatarId ? DID_AVATAR_MAP[avatarId] : null,
        voiceId:       avatarId ? ELEVEN_VOICE_MAP[avatarId] : null,
        soundId,
        subtitleStyle,
        slideTexts:    slideTextsRaw ? JSON.parse(slideTextsRaw) : [],
        imageUrls,
        niche,
        webhookUrl:    `${appUrl}/api/video/webhook`,
        runwayModel:   'gen3a_turbo',
      }

      // Save job to DB
      await supabase.from('ai_video_jobs').insert({
        id:            jobId,
        user_id:       user.id,
        type:          'ai_video_generator',
        status:        'pending',
        payload:       jobPayload,
        estimated_sec: Math.floor(duration * 3 + 30),
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      })

      // Pre-deduct quota
      await supabase.from('profiles').update({ video_used: used + 1 }).eq('id', user.id)

      // Publish to QStash
      try {
        const { Client:QStashClient } = await import('@upstash/qstash')
        const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! })
        await qstash.publishJSON({
          url:     workerUrl,
          body:    jobPayload,
          headers: { 'X-BeeSell-Job-Secret': process.env.JOB_SECRET ?? '' },
          retries: 3,
        })
      } catch (qErr) {
        // Rollback
        await supabase.from('ai_video_jobs').delete().eq('id', jobId)
        await supabase.from('profiles').update({ video_used: used }).eq('id', user.id)
        console.error('[video-gen] QStash error:', qErr)
        return NextResponse.json({ error:'Gagal mengirim job ke queue. Coba lagi.' }, { status:503 })
      }

      const estSec = Math.floor(duration * 3 + 30)
      return NextResponse.json({
        success:      true,
        jobId,
        status:       'pending',
        estimatedSec: estSec,
        message:      `Video ${duration}s sedang diproses AI. Estimasi selesai ${estSec}s.`,
      }, { status:202 })
    }

    return NextResponse.json({ error:`Action '${action}' tidak dikenal` }, { status:400 })

  } catch (err: any) {
    console.error('[video-generator]', err)
    return NextResponse.json({ error:err?.message ?? 'Server error' }, { status:500 })
  }
}