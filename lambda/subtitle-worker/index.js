// lambda/subtitle-worker/index.js
// ══════════════════════════════════════════════════════════════
// AWS LAMBDA — Subtitle Worker
// ══════════════════════════════════════════════════════════════
//
// Single Lambda function that does:
//   1. Download video/audio from S3/URL
//   2. Extract audio (FFmpeg) if input is video
//   3. Transcribe audio → Whisper API (OpenAI)
//   4. Convert Whisper segments → SRT with styling tokens
//   5. Burn subtitles into video (FFmpeg drawtext/subtitles filter)
//   6. Upload result to S3 (or Cloudflare R2 via S3-compatible API)
//   7. Notify Next.js webhook with output URL
//
// Trigger: API Gateway POST /subtitle (from Next.js /api/subtitle/burn)
//
// Memory:  2048MB (FFmpeg needs RAM for video processing)
// Timeout: 900s  (15 min — covers long videos; typical < 3 min for 60s clip)
// Runtime: Node.js 20.x
// Layer:   ffmpeg-lambda-layer (https://github.com/nicholasvadivelu/ffmpeg-layer)
//          OR bundled ffmpeg binary at /opt/bin/ffmpeg
//
// ENV:
//   OPENAI_API_KEY          - Whisper API key
//   AWS_S3_BUCKET           - S3 bucket for temp files
//   CLOUDFLARE_R2_ENDPOINT  - Optional: R2 instead of S3 for output
//   CLOUDFLARE_R2_BUCKET    - R2 bucket name
//   CLOUDFLARE_ACCESS_KEY   - R2 access key
//   CLOUDFLARE_SECRET_KEY   - R2 secret key
//   WEBHOOK_SECRET          - Shared secret with Next.js for callback

'use strict'

const { execSync, execFile } = require('child_process')
const fs          = require('fs')
const path        = require('path')
const https       = require('https')
const http        = require('http')
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { OpenAI }  = require('openai')

// ── Config ────────────────────────────────────────────────────
const FFMPEG    = process.env.FFMPEG_PATH || '/opt/bin/ffmpeg'
const FFPROBE   = process.env.FFPROBE_PATH || '/opt/bin/ffprobe'
const TMP       = '/tmp'
const S3_BUCKET = process.env.AWS_S3_BUCKET

// ── S3 client (also handles R2 via endpoint override) ─────────
function makeS3Client(forOutput = false) {
  if (forOutput && process.env.CLOUDFLARE_R2_ENDPOINT) {
    return new S3Client({
      region:      'auto',
      endpoint:    process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId:     process.env.CLOUDFLARE_ACCESS_KEY,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
      },
    })
  }
  return new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-1' })
}

// ── Subtitle style definitions ────────────────────────────────
// These become FFmpeg drawtext filter arguments
const SUBTITLE_STYLES = {
  'tiktok-bold': {
    fontsize:  46,
    fontcolor: 'white',
    borderw:   4,
    bordercolor: 'black',
    bold:      1,
    uppercase: true,
    shadowx:   3,
    shadowy:   3,
    shadowcolor: 'black@0.9',
    y_pos:     'h*0.78',   // 78% from top (near bottom)
  },
  'highlight-pop': {
    fontsize:    38,
    fontcolor:   'white',
    box:         1,
    boxcolor:    'F59E0B@0.92',  // amber
    boxborderw:  12,
    bold:        1,
    y_pos:       'h*0.80',
  },
  'emoji-flow': {
    fontsize:    36,
    fontcolor:   'white',
    borderw:     3,
    bordercolor: 'black',
    bold:        1,
    y_pos:       'h*0.80',
  },
  'minimal': {
    fontsize:    32,
    fontcolor:   'white',
    box:         1,
    boxcolor:    'black@0.55',
    boxborderw:  8,
    y_pos:       'h*0.82',
  },
  'neon': {
    fontsize:    40,
    fontcolor:   '00FFFF',     // cyan
    borderw:     2,
    bordercolor: '0FFFFF',
    bold:        1,
    shadowx:     0,
    shadowy:     0,
    shadowcolor: '00FFFF@0.8',
    y_pos:       'h*0.80',
  },
  'karaoke': {
    fontsize:    38,
    fontcolor:   'white',
    borderw:     3,
    bordercolor: 'black',
    bold:        1,
    y_pos:       'h*0.82',
    // Karaoke effect: word-level timing handled in SRT generation
  },
  'default': {
    fontsize:    36,
    fontcolor:   'white',
    borderw:     3,
    bordercolor: 'black',
    y_pos:       'h*0.80',
  },
}

// ── Helpers ───────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))

function secondsToSRT(sec) {
  const h   = Math.floor(sec / 3600)
  const m   = Math.floor((sec % 3600) / 60)
  const s   = Math.floor(sec % 60)
  const ms  = Math.round((sec % 1) * 1000)
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':') + ',' + String(ms).padStart(3, '0')
}

// Download file from URL to local path
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file     = fs.createWriteStream(dest)
    protocol.get(url, res => {
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err) })
  })
}

// Download from S3
async function downloadS3(s3Key, dest) {
  const s3  = makeS3Client()
  const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }))
  const ws  = fs.createWriteStream(dest)
  return new Promise((resolve, reject) => {
    res.Body.pipe(ws)
    ws.on('finish', resolve)
    ws.on('error', reject)
  })
}

// Upload to S3 or R2
async function uploadOutput(localPath, key, contentType = 'video/mp4') {
  const bucket   = process.env.CLOUDFLARE_R2_BUCKET || S3_BUCKET
  const s3       = makeS3Client(true)
  const fileBody = fs.readFileSync(localPath)
  await s3.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    Body:        fileBody,
    ContentType: contentType,
  }))
  // Return public URL
  if (process.env.CLOUDFLARE_R2_PUBLIC_URL) {
    return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
  }
  return `https://${bucket}.s3.ap-southeast-1.amazonaws.com/${key}`
}

// Notify Next.js webhook
async function notifyWebhook(webhookUrl, payload) {
  const body = JSON.stringify(payload)
  const u    = new URL(webhookUrl)
  const opts = {
    hostname: u.hostname,
    port:     u.port || (u.protocol === 'https:' ? 443 : 80),
    path:     u.pathname + u.search,
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
      'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
    },
  }
  return new Promise((resolve) => {
    const protocol = u.protocol === 'https:' ? https : http
    const req = protocol.request(opts, res => {
      let data = ''
      res.on('data', d => { data += d })
      res.on('end', () => resolve({ status: res.statusCode, data }))
    })
    req.on('error', err => resolve({ status: 0, error: err.message }))
    req.write(body)
    req.end()
  })
}

// ── STEP 1: Extract audio from video ─────────────────────────
function extractAudio(videoPath, audioPath) {
  execSync(
    `${FFMPEG} -y -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`,
    { stdio: 'inherit' }
  )
}

// ── STEP 2: Whisper transcription ────────────────────────────
async function transcribeWithWhisper(audioPath, language = 'id') {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const audioStream = fs.createReadStream(audioPath)
  const response    = await openai.audio.transcriptions.create({
    file:             audioStream,
    model:            'whisper-1',
    language,                      // 'id' = Indonesia, 'en' = English
    response_format:  'verbose_json',
    timestamp_granularities: ['segment', 'word'],
  })

  return response   // Contains .segments[] and .words[] with timestamps
}

// ── STEP 3: Convert Whisper output → SRT ─────────────────────
function whisperToSRT(whisperData, style, injectEmoji = false) {
  const segments = whisperData.segments || []

  // Emoji mapping for emoji-flow style
  const EMOJI_MAP = {
    produk: '📦', bagus: '✨', viral: '🔥', murah: '💰', harga: '💵',
    beli: '🛒', keren: '😎', suka: '❤️', gratis: '🎁', hari: '📅',
    order: '✅', terbukti: '💪', natural: '🌿', cantik: '💄',
    skincare: '🧴', makanan: '🍜', teknologi: '💻', bayi: '👶',
  }

  let srtOutput = ''
  let idx       = 1

  segments.forEach(seg => {
    let text = seg.text.trim()
    if (!text) return

    // Style transformations
    if (style === 'tiktok-bold')   text = text.toUpperCase()
    if (style === 'emoji-flow' || injectEmoji) {
      Object.entries(EMOJI_MAP).forEach(([word, emoji]) => {
        const re = new RegExp(`\\b${word}\\b`, 'gi')
        if (re.test(text)) text = text.replace(re, `${word} ${emoji}`)
      })
    }

    srtOutput += `${idx}\n`
    srtOutput += `${secondsToSRT(seg.start)} --> ${secondsToSRT(seg.end)}\n`
    srtOutput += `${text}\n\n`
    idx++
  })

  return srtOutput
}

// ── Validate style against known options ──────────────────────
function resolveStyle(styleId) {
  return SUBTITLE_STYLES[styleId] || SUBTITLE_STYLES['default']
}

// ── STEP 4: Build FFmpeg subtitle filter ──────────────────────
function buildSubtitleFilter(srtPath, styleId) {
  const style = resolveStyle(styleId)

  // Use ASS-style subtitles filter for rich styling
  // ASS format gives per-event style control
  const style_name = 'BeeSellSub'

  // Build SubStation Alpha (ASS) file
  const assContent = buildASSFile(srtPath, style)
  const assPath    = srtPath.replace('.srt', '.ass')
  fs.writeFileSync(assPath, assContent)

  return { filter: `subtitles='${assPath}'`, assPath }
}

// ── Build ASS subtitle file with styling ─────────────────────
function buildASSFile(srtPath, style) {
  // Parse SRT to events
  const srtContent = fs.readFileSync(srtPath, 'utf8')
  const blocks     = srtContent.trim().split(/\n\n+/)
  const events     = []

  blocks.forEach(block => {
    const lines = block.split('\n')
    if (lines.length < 3) return
    const timeLine = lines[1]
    const text     = lines.slice(2).join('\\N')  // ASS newline
    const [start, end] = timeLine.split(' --> ').map(t => {
      // Convert SRT time (HH:MM:SS,ms) to ASS time (H:MM:SS.cs)
      const [hms, ms] = t.trim().split(',')
      const cs        = Math.round(parseInt(ms) / 10)
      return `${hms}.${String(cs).padStart(2, '0')}`
    })
    events.push(`Dialogue: 0,${start},${end},BeeSellSub,,0,0,0,,${text}`)
  })

  // ASS header with style
  const fontsize    = style.fontsize    || 36
  const fontcolor   = style.fontcolor  || 'white'
  const bold        = style.bold ? -1 : 0
  const outline     = style.borderw    || 3
  const shadow      = style.shadowx    !== undefined ? Math.max(style.shadowx || 0, style.shadowy || 0) : 2
  const alignment   = 2  // centered bottom
  const marginv     = style.y_pos ? '60' : '60'

  // ASS color format: &HAABBGGRR (alpha, blue, green, red)
  const colorToASS  = (hex) => {
    if (!hex || hex === 'white') return '&H00FFFFFF'
    if (hex === 'black')         return '&H00000000'
    if (hex === 'yellow')        return '&H0000FFFF'
    hex = hex.replace('#', '')
    if (hex.length === 6) {
      return `&H00${hex.slice(4,6)}${hex.slice(2,4)}${hex.slice(0,2)}`
    }
    return '&H00FFFFFF'
  }

  const primaryColor  = colorToASS(style.fontcolor)
  const outlineColor  = colorToASS(style.bordercolor || 'black')
  const shadowColor   = colorToASS(style.shadowcolor?.split('@')[0] || 'black')
  const backColor     = style.box ? colorToASS(style.boxcolor?.split('@')[0] || 'black') : '&H00000000'

  const assHeader = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 1
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: BeeSellSub,Impact,${fontsize},${primaryColor},${primaryColor},${outlineColor},${backColor},${bold},0,0,0,100,100,0,0,1,${outline},${shadow},${alignment},20,20,${marginv},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`
  return assHeader
}

// ── STEP 5: FFmpeg burn subtitles ─────────────────────────────
function burnSubtitles(inputVideo, assPath, outputVideo) {
  // Escape path for FFmpeg filter (colons and backslashes)
  const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:')

  const cmd = [
    FFMPEG, '-y',
    '-i', `"${inputVideo}"`,
    '-vf', `"subtitles='${escapedAss}':force_style='Encoding=1'"`,
    '-c:v', 'libx264',
    '-preset', 'fast',          // balance speed/quality
    '-crf', '22',               // quality level (lower = better, 18-28 typical)
    '-c:a', 'copy',             // keep audio unchanged
    '-movflags', '+faststart',  // web-optimized MP4
    `"${outputVideo}"`,
  ].join(' ')

  execSync(cmd, { stdio: 'inherit', timeout: 600_000 }) // 10 min timeout
}

// ── Main Lambda handler ───────────────────────────────────────
exports.handler = async (event) => {
  const startMs = Date.now()

  // Parse request body
  let body = {}
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || event)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const {
    jobId,
    videoUrl,        // source video URL (or S3 key)
    audioUrl,        // optional: separate audio file
    s3Key,           // S3 key if input is in S3
    language  = 'id',
    style     = 'tiktok-bold',
    webhookUrl,
    userId,
    customSRT,       // optional: user-provided SRT string (skip Whisper)
  } = body

  // Validate
  if (!videoUrl && !s3Key && !audioUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'videoUrl, audioUrl, or s3Key required' }),
    }
  }

  const tmpVideo    = path.join(TMP, `${jobId}_input.mp4`)
  const tmpAudio    = path.join(TMP, `${jobId}_audio.wav`)
  const tmpSRT      = path.join(TMP, `${jobId}.srt`)
  const tmpASS      = path.join(TMP, `${jobId}.ass`)
  const tmpOutput   = path.join(TMP, `${jobId}_output.mp4`)

  try {
    console.log(`[subtitle-worker] Job ${jobId} started | style=${style} | lang=${language}`)

    // ── 1. Download input ────────────────────────────────────
    console.log('[subtitle-worker] Downloading input...')
    if (s3Key) {
      await downloadS3(s3Key, tmpVideo)
    } else if (videoUrl) {
      await downloadFile(videoUrl, tmpVideo)
    } else if (audioUrl) {
      await downloadFile(audioUrl, tmpAudio)
    }

    // ── 2. Extract audio (if video input) ───────────────────
    let audioInputPath = tmpAudio
    if (fs.existsSync(tmpVideo) && !fs.existsSync(tmpAudio)) {
      console.log('[subtitle-worker] Extracting audio...')
      extractAudio(tmpVideo, tmpAudio)
    }

    // ── 3. Transcribe or use provided SRT ───────────────────
    let srtContent
    let whisperData = null

    if (customSRT) {
      console.log('[subtitle-worker] Using custom SRT (skipping Whisper)')
      srtContent = customSRT
    } else {
      console.log(`[subtitle-worker] Transcribing with Whisper (lang=${language})...`)
      whisperData  = await transcribeWithWhisper(audioInputPath, language)
      srtContent   = whisperToSRT(whisperData, style, style === 'emoji-flow')
      console.log(`[subtitle-worker] Transcription done: ${whisperData.segments?.length ?? 0} segments`)
    }

    // Write SRT
    fs.writeFileSync(tmpSRT, srtContent)

    // ── 4. Build ASS subtitle file ───────────────────────────
    console.log(`[subtitle-worker] Building ASS style (${style})...`)
    const styleConfig = resolveStyle(style)
    const assContent  = buildASSFile(tmpSRT, styleConfig)
    fs.writeFileSync(tmpASS, assContent)

    // ── 5. Burn subtitles into video ─────────────────────────
    // Only if we have a video file
    let outputUrl = null
    let srtUrl    = null

    // Upload SRT to storage (always — client can use it separately)
    const srtKey = `subtitles/${userId}/${jobId}.srt`
    srtUrl = await uploadOutput(tmpSRT, srtKey, 'text/plain')
    console.log(`[subtitle-worker] SRT uploaded: ${srtUrl}`)

    if (fs.existsSync(tmpVideo)) {
      console.log('[subtitle-worker] Burning subtitles into video...')
      const escapedAss = tmpASS.replace(/\\/g, '/').replace(/:/g, '\\:')
      const cmd = `${FFMPEG} -y -i "${tmpVideo}" -vf "subtitles='${escapedAss}'" -c:v libx264 -preset fast -crf 22 -c:a copy -movflags +faststart "${tmpOutput}"`
      execSync(cmd, { stdio: 'inherit', timeout: 600_000 })

      // ── 6. Upload output video ──────────────────────────
      const outputKey = `videos/${userId}/${jobId}_subtitled.mp4`
      console.log('[subtitle-worker] Uploading output video...')
      outputUrl = await uploadOutput(tmpOutput, outputKey)
      console.log(`[subtitle-worker] Video uploaded: ${outputUrl}`)
    }

    // ── 7. Notify webhook ────────────────────────────────────
    const elapsedMs = Date.now() - startMs
    const payload   = {
      jobId,
      status:      'completed',
      outputUrl,
      srtUrl,
      srtContent,
      language,
      style,
      segments:    whisperData?.segments?.length ?? null,
      duration:    whisperData?.duration         ?? null,
      elapsedMs,
    }

    if (webhookUrl) {
      console.log('[subtitle-worker] Notifying webhook...')
      const notifyRes = await notifyWebhook(webhookUrl, payload)
      console.log(`[subtitle-worker] Webhook response: ${notifyRes.status}`)
    }

    // Cleanup temp files
    for (const f of [tmpVideo, tmpAudio, tmpSRT, tmpASS, tmpOutput]) {
      try { fs.unlinkSync(f) } catch {}
    }

    console.log(`[subtitle-worker] Job ${jobId} completed in ${elapsedMs}ms`)

    return {
      statusCode: 200,
      headers:    { 'Content-Type': 'application/json' },
      body:       JSON.stringify(payload),
    }

  } catch (err) {
    const elapsedMs = Date.now() - startMs
    console.error(`[subtitle-worker] Job ${jobId} FAILED:`, err)

    const errorPayload = {
      jobId,
      status:    'failed',
      error:     err.message,
      elapsedMs,
    }

    if (webhookUrl) {
      await notifyWebhook(webhookUrl, errorPayload).catch(() => {})
    }

    // Cleanup on error
    for (const f of [tmpVideo, tmpAudio, tmpSRT, tmpASS, tmpOutput]) {
      try { fs.unlinkSync(f) } catch {}
    }

    return {
      statusCode: 500,
      body:       JSON.stringify(errorPayload),
    }
  }
}