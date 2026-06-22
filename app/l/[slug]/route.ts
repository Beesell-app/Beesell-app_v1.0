import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashIp, parseDevice, getVisitorId } from '@/lib/smart-links/attribution'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: link } = await supabase
    .from('smart_links').select('id, destination, is_active').eq('slug', slug).single()

  if (!link || !link.is_active) return NextResponse.redirect(new URL('/', req.url))

  const { visitorId, isNew } = getVisitorId(req)
  const ua = req.headers.get('user-agent') ?? ''

  const { data: click } = await supabase.from('smart_link_clicks').insert({
    smart_link_id: link.id,
    visitor_id:    visitorId,
    ip_hash:       hashIp(req),
    user_agent:    ua,
    referrer:      req.headers.get('referer') ?? '',
    country:       req.headers.get('x-vercel-ip-country') ?? '',
    device:        parseDevice(ua),
    utm_source:    req.nextUrl.searchParams.get('utm_source'),
    utm_medium:    req.nextUrl.searchParams.get('utm_medium'),
    utm_campaign:  req.nextUrl.searchParams.get('utm_campaign'),
  }).select('id').single()

  // Inject click_id sebagai 'bsl' supaya bisa di-round-trip jadi sub-id affiliate
  const dest = new URL(link.destination)
  if (click?.id) dest.searchParams.set('bsl', click.id)

  const res = NextResponse.redirect(dest.toString(), 302)
  if (isNew) res.cookies.set('bsl_vid', visitorId, {
    maxAge: 60 * 60 * 24 * 90, httpOnly: true, sameSite: 'lax', path: '/',
  })
  return res
}