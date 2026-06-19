// app/api/studio/avatars/upload/route.ts
// ══════════════════════════════════════════════════════════════
// Upload custom avatar photo → save to R2 → queue D-ID processing

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const POST = async (req: NextRequest) => {
  try {
    // ── 1. GET USER AUTH ────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user?.id) {
      console.error('[upload-avatar] Auth error:', authErr)
      return NextResponse.json(
        { error: 'Unauthorized', code: 'auth_failed' },
        { status: 401 }
      )
    }

    const userId = user.id

    // ── 2. PARSE FORMDATA ────────────────────────────────────
    let fd: FormData
    try {
      fd = await req.formData()
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid form data', code: 'parse_error' },
        { status: 400 }
      )
    }

    const file = fd.get('file') as File | null
    const name = (fd.get('name') as string) || 'custom-avatar'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'no_file' },
        { status: 400 }
      )
    }

    // ── 3. VALIDATE FILE TYPE ───────────────────────────────
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Format harus JPG atau PNG',
          code: 'invalid_format',
          received: file.type,
        },
        { status: 400 }
      )
    }

    // ── 4. VALIDATE FILE SIZE ───────────────────────────────
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File terlalu besar (max 10MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
          code: 'file_too_large',
          maxSize,
          received: file.size,
        },
        { status: 400 }
      )
    }

    // ── 5. CONVERT FILE TO BUFFER ───────────────────────────
    let buffer: ArrayBuffer
    try {
      buffer = await file.arrayBuffer()
    } catch (err) {
      console.error('[upload-avatar] Buffer conversion error:', err)
      return NextResponse.json(
        { error: 'Failed to read file', code: 'buffer_error' },
        { status: 500 }
      )
    }

    // ── 6. GENERATE STORAGE KEY ─────────────────────────────
    // Format: avatars/{userId}/{timestamp}-{random}.jpg
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const storageKey = `avatars/${userId}/${timestamp}-${random}.${ext}`

    // ── 7. UPLOAD TO R2 (or Supabase Storage) ───────────────
    // For now, we'll use a placeholder URL
    // In production, integrate with AWS S3 / R2 SDK
    let r2Url = `https://storage.beesell.ai/${storageKey}`

    // Optional: Actually upload to R2
    // const r2Url = await uploadToR2(buffer, storageKey, file.type)
    // if (!r2Url) {
    //   return NextResponse.json(
    //     { error: 'Failed to upload to storage', code: 'upload_failed' },
    //     { status: 500 }
    //   )
    // }

    // ── 8. SAVE TO DATABASE ─────────────────────────────────
    const { data: avatar, error: dbErr } = await supabase
      .from('user_custom_avatars')
      .insert({
        user_id: userId,
        name: name.substring(0, 100), // Max 100 chars
        original_image_url: r2Url,
        processed_image_url: r2Url, // Will update after D-ID
        d_id_image_url: '', // Will set after D-ID processing
        status: 'processing',
        error_message: null,
      })
      .select()
      .single()

    if (dbErr || !avatar) {
      console.error('[upload-avatar] DB insert error:', dbErr)
      return NextResponse.json(
        { error: 'Failed to save avatar', code: 'db_error', details: dbErr?.message },
        { status: 500 }
      )
    }

    // ── 9. QUEUE D-ID PROCESSING (fire and forget) ──────────
    // Don't await — let it process in background
    processAvatarWithDID(avatar.id, r2Url, userId).catch(err =>
      console.error('[upload-avatar] D-ID processing error:', err)
    )

    // ── 10. RETURN SUCCESS ──────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        id: avatar.id,
        status: 'processing',
        original_image_url: r2Url,
        message: 'Avatar sedang diproses. Akan siap dalam 2-3 menit.',
        estimatedWaitMs: 180000, // 3 minutes
      },
      { status: 202 } // 202 Accepted (async processing)
    )
  } catch (err: any) {
    console.error('[upload-avatar] Unexpected error:', err)
    return NextResponse.json(
      {
        error: err.message || 'Server error',
        code: 'server_error',
      },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Upload to R2
// ═══════════════════════════════════════════════════════════════

async function uploadToR2(
  buffer: ArrayBuffer,
  key: string,
  contentType: string
): Promise<string | null> {
  try {
    // TODO: Implement R2 upload using AWS SDK
    // This is a placeholder implementation
    // In production, use:
    // - AWS SDK for S3
    // - Cloudflare SDK for R2
    // - Or Supabase Storage

    // For now, return a mock URL
    const url = `https://r2.beesell.ai/${key}`
    console.log('[uploadToR2] Would upload to:', url)
    return url
  } catch (err) {
    console.error('[uploadToR2] Error:', err)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Process avatar with D-ID (async, non-blocking)
// ═══════════════════════════════════════════════════════════════

async function processAvatarWithDID(
  avatarId: string,
  imageUrl: string,
  userId: string
) {
  try {
    // ── Call D-ID API to process image ──────────────────────
    const didResponse = await fetch('https://api.d-id.com/images', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.DID_API_KEY}:`
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_image_url: imageUrl,
        // Additional D-ID options if needed
      }),
    })

    const didData = await didResponse.json()

    // ── Update database with result ─────────────────────────
    const supabase = await createClient()

    if (didResponse.ok && didData.image_url) {
      // Success: Update with processed image URL
      console.log('[processAvatarWithDID] Success:', avatarId)

      await supabase
        .from('user_custom_avatars')
        .update({
          d_id_image_url: didData.image_url,
          processed_image_url: didData.image_url,
          status: 'ready',
          error_message: null,
        })
        .eq('id', avatarId)
        .eq('user_id', userId)
    } else {
      // Failed: Mark as failed
      console.error('[processAvatarWithDID] D-ID failed:', didData)

      await supabase
        .from('user_custom_avatars')
        .update({
          status: 'failed',
          error_message: didData.error || 'D-ID processing failed',
        })
        .eq('id', avatarId)
        .eq('user_id', userId)
    }
  } catch (err: any) {
    console.error('[processAvatarWithDID] Exception:', err)

    // Try to mark as failed in DB
    try {
      const supabase = await createClient()
      await supabase
        .from('user_custom_avatars')
        .update({
          status: 'failed',
          error_message: err.message || 'Processing error',
        })
        .eq('id', avatarId)
        .eq('user_id', userId)
    } catch (dbErr) {
      console.error('[processAvatarWithDID] Failed to update DB:', dbErr)
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT CONFIG (for Next.js)
// ═══════════════════════════════════════════════════════════════

export const config = {
  maxDuration: 60, // 60 seconds timeout
}