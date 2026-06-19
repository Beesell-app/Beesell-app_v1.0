// app/api/studio/video/ugc/route.ts
// ══════════════════════════════════════════════════════════════
// UGC Video Generator API Route
// 
// Supported actions:
// - action=script: Generate script (FREE, unlimited)
// - action=default: Generate video (30 credits)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const POST = async (req: NextRequest) => {
  try {
    // ── 1. EXTRACT ACTION PARAM ────────────────────────────
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'default'

    // ── 2. AUTHENTICATE USER ──────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user?.id) {
      console.error('[ugc-api] Auth error:', authErr)
      return NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'auth_failed',
          message: 'Silakan login terlebih dahulu',
        },
        { status: 401 }
      )
    }

    const userId = user.id

    // ── 3. ROUTE BY ACTION ────────────────────────────────
    if (action === 'script') {
      return await handleGenerateScript(req, userId, supabase)
    } else {
      return await handleGenerateVideo(req, userId, supabase)
    }
  } catch (err: any) {
    console.error('[ugc-api] Unexpected error:', err)
    return NextResponse.json(
      {
        error: 'Server error',
        code: 'internal_error',
        message: err.message,
      },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTION 1: GENERATE SCRIPT (FREE)
// ═══════════════════════════════════════════════════════════════

async function handleGenerateScript(
  req: NextRequest,
  userId: string,
  supabase: any
) {
  try {
    // Parse request
    const body = await req.json()

    const {
      contentType,
      language,
      productName,
      mainBenefit,
      painPoint,
      targetMarket,
      productCategory,
    } = body

    // Validate inputs
    if (!contentType || !language || !productName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['contentType', 'language', 'productName'],
        },
        { status: 400 }
      )
    }

    // ── Generate script using Claude API ──────────────────
    // Using Anthropic SDK or fetch
    const scriptResponse = await generateScriptWithClaude({
      contentType,
      language,
      productName,
      mainBenefit: mainBenefit || 'quality',
      painPoint: painPoint || 'not satisfying',
      targetMarket: targetMarket || 'general',
      productCategory: productCategory || 'general',
    })

    if (!scriptResponse.success) {
      throw new Error(scriptResponse.error || 'Failed to generate script')
    }

    // ── Return script ──────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        script: scriptResponse.script,
        wordCount: scriptResponse.wordCount,
        estimatedDuration: scriptResponse.estimatedDuration,
        hook: scriptResponse.hook,
        story: scriptResponse.story,
        cta: scriptResponse.cta,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[handleGenerateScript] Error:', err)
    return NextResponse.json(
      {
        error: 'Failed to generate script',
        message: err.message,
      },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTION 2: GENERATE VIDEO (30 CREDITS)
// ═══════════════════════════════════════════════════════════════

async function handleGenerateVideo(
  req: NextRequest,
  userId: string,
  supabase: any
) {
  try {
    // Parse FormData
    const fd = await req.formData()

    const characterId = fd.get('characterId') as string
    const script = fd.get('script') as string
    const language = fd.get('language') as string
    const videoPreset = fd.get('videoPreset') as string
    const duration = parseInt(fd.get('duration') as string) || 30
    const subtitle = fd.get('subtitle') as string
    const cta = fd.get('cta') as string
    const music = fd.get('music') as string
    const resolution = fd.get('resolution') as string
    const image = fd.get('image') as File

    // Validate inputs
    if (!characterId || !script || !language) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['characterId', 'script', 'language'],
        },
        { status: 400 }
      )
    }

    // ── CHECK CREDITS ──────────────────────────────────────
    const creditCost = duration // 1 credit per second
    // Note: Could use RECOMMENDED_CREDITS_BY_DURATION[duration] for fixed tiers

    const { data: userCredits, error: creditsErr } = await supabase
      .from('user_credits')
      .select('balance, plan_tier')
      .eq('user_id', userId)
      .single()

    if (creditsErr || !userCredits) {
      return NextResponse.json(
        {
          error: 'Unable to check credits',
          code: 'credits_check_failed',
        },
        { status: 500 }
      )
    }

    const currentBalance = userCredits.balance || 0

    // Check if sufficient credits
    if (currentBalance < creditCost) {
      return NextResponse.json(
        {
          error: 'insufficient_credits',
          current: currentBalance,
          required: creditCost,
          message: `Butuh ${creditCost} kredit, saldo ${currentBalance}. Belanja kredit di billing.`,
        },
        { status: 402 } // Payment Required
      )
    }

    // ── DEDUCT CREDITS ────────────────────────────────────
    const newBalance = currentBalance - creditCost

    const { error: updateErr } = await supabase
      .from('user_credits')
      .update({ balance: newBalance })
      .eq('user_id', userId)

    if (updateErr) {
      console.error('[handleGenerateVideo] Credit deduction error:', updateErr)
      return NextResponse.json(
        {
          error: 'Failed to deduct credits',
          code: 'deduction_failed',
        },
        { status: 500 }
      )
    }

    // ── LOG TRANSACTION ────────────────────────────────────
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'ugc_video_generation',
        amount: -creditCost,
        balance_after: newBalance,
        metadata: {
          duration,
          character_id: characterId,
        },
      })
      .catch((err: unknown) => console.error('[handleGenerateVideo] Log error:', err))

    // ── GENERATE VIDEO ────────────────────────────────────
    let jobId: string
    let statusUrl: string

    try {
      const videoResult = await generateVideoWithDID({
        characterId,
        script,
        language,
        videoPreset: videoPreset || 'authentic-story',
        duration,
        subtitle: subtitle || 'auto',
        cta,
        music: music || 'none',
        resolution: resolution || 'vertical',
      })

      jobId = videoResult.jobId
      statusUrl = videoResult.statusUrl
    } catch (videoErr: any) {
      // Refund credits on failure
      console.error('[handleGenerateVideo] Generation error:', videoErr)

      await supabase
        .from('user_credits')
        .update({ balance: currentBalance })
        .eq('user_id', userId)
        .catch((err: any) => console.error('[refund] Error:', err))

      // Log refund
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type: 'ugc_video_refund',
          amount: creditCost,
          balance_after: currentBalance,
          metadata: { reason: 'generation_failed' },
        })
        .catch((err: any) => console.error('[refund-log] Error:', err))

      return NextResponse.json(
        {
          error: 'video_generation_failed',
          message: videoErr.message || 'Failed to generate video',
        },
        { status: 500 }
      )
    }

    // ── SAVE JOB RECORD ────────────────────────────────────
    const { data: job, error: jobErr } = await supabase
      .from('ugc_generation_jobs')
      .insert({
        user_id: userId,
        job_id: jobId,
        status: 'processing',
        character_id: characterId,
        script,
        language,
        video_preset: videoPreset,
        duration_seconds: duration,
        credits_charged: creditCost,
        api_cost_rp: estimateAPICost(duration),
        metadata: {
          subtitle,
          cta,
          music,
          resolution,
        },
      })
      .select()
      .single()

    if (jobErr) {
      console.error('[handleGenerateVideo] Job record error:', jobErr)
      // Don't fail — video is already generating
    }

    // ── RETURN SUCCESS ────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        jobId,
        status: 'processing',
        statusUrl,
        creditUsed: creditCost,
        estimatedWaitMs: duration * 4000, // Rough estimate
        balanceAfter: newBalance,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[handleGenerateVideo] Error:', err)
    return NextResponse.json(
      {
        error: 'Server error',
        message: err.message,
      },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Generate script with Claude
// ═══════════════════════════════════════════════════════════════

interface ScriptGenerationResult {
  success: boolean
  script?: string
  wordCount?: number
  estimatedDuration?: number
  hook?: string
  story?: string
  cta?: string
  error?: string
}

async function generateScriptWithClaude(params: {
  contentType: string
  language: string
  productName: string
  mainBenefit: string
  painPoint: string
  targetMarket: string
  productCategory: string
}): Promise<ScriptGenerationResult> {
  try {
    // TODO: Implement using Anthropic SDK
    // For now, return mock data

    const mockScript = `
Halo! Aku mau cerita tentang ${params.productName}.
Sebelumnya aku selalu ${params.painPoint}.
Tapi semenjak pakai ${params.productName}, semuanya jadi ${params.mainBenefit}!

${params.mainBenefit}, lihat sendiri perbedaannya.
Yuk, coba ${params.productName} sekarang juga di Shopee dan Tokopedia.
    `.trim()

    const words = mockScript.split(' ').length

    return {
      success: true,
      script: mockScript,
      wordCount: words,
      estimatedDuration: Math.ceil((words / 150) * 60), // ~150 words per minute
      hook: `Halo! Aku mau cerita tentang ${params.productName}.`,
      story: `Sebelumnya aku selalu ${params.painPoint}. Tapi semenjak pakai ${params.productName}, semuanya jadi ${params.mainBenefit}!`,
      cta: `Yuk, coba ${params.productName} sekarang juga.`,
    }
  } catch (err: any) {
    console.error('[generateScriptWithClaude] Error:', err)
    return {
      success: false,
      error: err.message,
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Generate video with D-ID
// ═══════════════════════════════════════════════════════════════

interface VideoGenerationResult {
  jobId: string
  statusUrl: string
}

async function generateVideoWithDID(params: {
  characterId: string
  script: string
  language: string
  videoPreset: string
  duration: number
  subtitle: string
  cta?: string
  music?: string
  resolution?: string
}): Promise<VideoGenerationResult> {
  try {
    // TODO: Implement using D-ID API
    // For now, return mock data

    const mockJobId = `talk-${Date.now()}-${Math.random().toString(36).substring(7)}`

    return {
      jobId: mockJobId,
      statusUrl: `https://api.d-id.com/talks/${mockJobId}`,
    }
  } catch (err: any) {
    console.error('[generateVideoWithDID] Error:', err)
    throw new Error(`D-ID API error: ${err.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Estimate API cost
// ═══════════════════════════════════════════════════════════════

function estimateAPICost(durationSeconds: number): number {
  // Rough COGS estimate
  // Base: Claude (200) + Deepgram (200) + R2 (100)
  // Variable: ElevenLabs (~106.67 per second) + D-ID (~90 per second)

  const baseColor = 500 // Claude + Deepgram + R2
  const elevenLabsCost = durationSeconds * 106.67
  const didCost = durationSeconds * 90

  return Math.ceil(baseColor + elevenLabsCost + didCost)
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

export const config = {
  maxDuration: 120, // 2 minutes timeout for video generation
}