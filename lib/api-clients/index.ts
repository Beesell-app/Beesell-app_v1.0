// lib/api-clients/index.ts
// ══════════════════════════════════════════════════════════════
// Other API Clients — Deepgram, fal.ai, ElevenLabs, D-ID
// ══════════════════════════════════════════════════════════════

// ── DEEPGRAM (untuk AI Subtitle, replacing OpenAI Whisper) ───
export async function deepgramTranscribe(audioUrl: string, opts?: {
  language?: 'id' | 'en'
  smart_format?: boolean
}) {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY not set')

  const params = new URLSearchParams({
    model:        'nova-2',
    language:     opts?.language ?? 'id',
    smart_format: String(opts?.smart_format ?? true),
    punctuate:    'true',
    utterances:   'true',
  })

  const res = await fetch(
    `https://api.deepgram.com/v1/listen?${params}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ url: audioUrl }),
    }
  )

  if (!res.ok) {
    throw new Error(`Deepgram error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
  const utterances = data.results?.utterances ?? []
  
  return { transcript, utterances, raw: data }
}

// ── FAL.AI Kling 2.0 (Image to Video) ────────────────────────
export async function falKlingI2V(input: {
  image_url:  string
  prompt:     string
  duration?:  5 | 10
  aspect_ratio?: '16:9' | '9:16' | '1:1'
}) {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) throw new Error('FAL_API_KEY not set')

  // Use fal.ai REST API directly
  const res = await fetch('https://fal.run/fal-ai/kling-video/v2/image-to-video', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      image_url:    input.image_url,
      prompt:       input.prompt,
      duration:     input.duration ?? 5,
      aspect_ratio: input.aspect_ratio ?? '9:16',
    }),
  })

  if (!res.ok) {
    throw new Error(`fal.ai Kling error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return { video_url: data.video?.url, raw: data }
}

// ── ELEVENLABS TTS (untuk UGC Generator) ─────────────────────
export async function elevenLabsTTS(opts: {
  text:        string
  voice_id?:   string                  // default: Indonesian voice
  model_id?:   string
  stability?:  number
  similarity_boost?: number
}) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set')

  const voiceId = opts.voice_id ?? 'XB0fDUnXU5powFXDhCwa'  // Default Indonesian female
  
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key':    apiKey,
        'Content-Type':  'application/json',
        'Accept':        'audio/mpeg',
      },
      body: JSON.stringify({
        text:     opts.text,
        model_id: opts.model_id ?? 'eleven_multilingual_v2',
        voice_settings: {
          stability:        opts.stability ?? 0.5,
          similarity_boost: opts.similarity_boost ?? 0.75,
        },
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`ElevenLabs error: ${res.status}`)
  }

  const audioBuffer = Buffer.from(await res.arrayBuffer())
  return { audioBuffer, mimeType: 'audio/mpeg' }
}

// ── D-ID TALKS HD (untuk UGC Generator avatar lipsync) ───────
export async function didTalksHD(opts: {
  source_url:  string      // avatar image URL
  audio_url:   string      // ElevenLabs output
}) {
  const apiKey = process.env.DID_API_KEY
  if (!apiKey) throw new Error('DID_API_KEY not set')

  const res = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      source_url: opts.source_url,
      script: {
        type:       'audio',
        audio_url:  opts.audio_url,
      },
      config: {
        result_format: 'mp4',
        stitch:        true,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`D-ID error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return { talk_id: data.id, status_url: data.status_url ?? null }
}

// ── CLOUDFLARE R2 UPLOAD (untuk simpan output) ───────────────
export async function uploadToR2(opts: {
  buffer:      Buffer
  filename:    string
  contentType: string
}): Promise<string> {
  // NOTE: Implementation tergantung setup R2 di project
  // Pakai existing helper kalau sudah ada di project kamu
  throw new Error('uploadToR2: implement in project (use existing R2 helper)')
}