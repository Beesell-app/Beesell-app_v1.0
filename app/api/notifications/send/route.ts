// apps/web-app/app/api/notifications/send/route.ts
// POST /api/notifications/send — test / manual send (admin only)
import { NextResponse }             from 'next/server'
import { z }                        from 'zod'
import { createClient }             from '@/lib/supabase/server'
import { db }                       from '@/lib/db'
import { sendPublishNotification }  from '@/lib/notifications/sender'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TestSchema = z.object({
  type:     z.enum(['publish_success', 'publish_failed']),
  platform: z.enum(['instagram', 'instagram_reels', 'tiktok']).default('instagram'),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: { tenant_id: true, role: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body   = await req.json()
  const parsed = TestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const isSuccess = parsed.data.type === 'publish_success'

  await sendPublishNotification({
    tenant_id:     dbUser.tenant_id,
    postId:       'test-post-id',
    platform:     parsed.data.platform,
    status:       isSuccess ? 'published' : 'failed',
    caption:      'Produk premium kamu — kualitas terjamin, harga terjangkau! 🔥',
    permalink:    isSuccess ? 'https://www.instagram.com/p/test/' : undefined,
    error_message: isSuccess ? undefined : 'OAuthException: Token expired (code 190)',
    error_Code:    isSuccess ? undefined : '190',
    retryAt:      isSuccess ? undefined : new Date(Date.now() + 5 * 60_000),
    scheduledAt:  new Date(),
  })

  return NextResponse.json({ success: true, type: parsed.data.type })
}