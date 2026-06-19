// app/api/studio/quick/subtitle/route.ts
// ══════════════════════════════════════════════════════════════
// AI Subtitle — Deepgram Nova-2 (Indonesian)
// Daily limit: Starter — | Basic 2 | Pro 5 | Business 12
// COGS: Rp78 per minute (was Rp109 with Whisper — saving 28%)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { withDailyLimit } from '@/lib/daily-limit-middleware'
import { deepgramTranscribe } from '@/lib/api-clients'

export const runtime = 'edge'
export const maxDuration = 120

interface RequestBody {
  audio_url:  string
  language?:  'id' | 'en'
  format?:    'srt' | 'vtt' | 'plain'
}

export const POST = withDailyLimit('subtitle', async (req: NextRequest) => {
  let body: RequestBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.audio_url || !body.audio_url.startsWith('http')) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'audio_url wajib URL valid' },
      { status: 400 }
    )
  }

  try {
    const { transcript, utterances } = await deepgramTranscribe(body.audio_url, {
      language: body.language ?? 'id',
      smart_format: true,
    })

    // Format ke SRT kalau diminta
    let formattedSubtitle = transcript
    if (body.format === 'srt') {
      formattedSubtitle = formatToSRT(utterances)
    } else if (body.format === 'vtt') {
      formattedSubtitle = formatToVTT(utterances)
    }

    return NextResponse.json({
      success: true,
      transcript,
      subtitle: formattedSubtitle,
      format:   body.format ?? 'plain',
      meta:     { provider: 'deepgram-nova-2' },
    })
  } catch (err) {
    console.error('[subtitle] error:', err)
    return NextResponse.json(
      { error: 'generation_failed', message: String(err) },
      { status: 500 }
    )
  }
})

// ── Format helpers ────────────────────────────────────────────
function formatToSRT(utterances: any[]): string {
  return utterances.map((u, i) => {
    const start = formatTime(u.start)
    const end   = formatTime(u.end)
    return `${i + 1}\n${start} --> ${end}\n${u.transcript}\n`
  }).join('\n')
}

function formatToVTT(utterances: any[]): string {
  const body = utterances.map(u => {
    const start = formatTime(u.start, '.')
    const end   = formatTime(u.end, '.')
    return `${start} --> ${end}\n${u.transcript}\n`
  }).join('\n')
  return `WEBVTT\n\n${body}`
}

function formatTime(seconds: number, msSep = ','): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  const ms = Math.floor((seconds * 1000) % 1000).toString().padStart(3, '0')
  return `${h}:${m}:${s}${msSep}${ms}`
}