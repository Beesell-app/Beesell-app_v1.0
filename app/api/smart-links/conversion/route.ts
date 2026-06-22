import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function createAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}
// Postback/manual: header 'x-bsl-secret' + body { ref, type, value, orderId }
//  ref = click_id (dari ?bsl=...) ATAU slug (fallback last-click)
export async function POST(req: NextRequest) {
  if (!process.env.SMART_LINK_INGEST_SECRET ||
      req.headers.get('x-bsl-secret') !== process.env.SMART_LINK_INGEST_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { ref, type = 'order', value = 0, orderId } = await req.json().catch(() => ({} as any))
  if (!ref || !['add_to_cart', 'order'].includes(type)) {
    return NextResponse.json({ error: 'ref & type wajib' }, { status: 400 })
  }

  const supabase = createAdminClient()
  let smartLinkId: string | null = null
  let clickId: string | null = null

  if (/^[0-9a-f-]{36}$/i.test(ref)) {
    const { data: click } = await supabase
      .from('smart_link_clicks').select('id, smart_link_id').eq('id', ref).single()
    if (click) { clickId = click.id; smartLinkId = click.smart_link_id }
  }
  if (!smartLinkId) {
    const { data: link } = await supabase.from('smart_links' as any).select('id').eq('slug', ref).single()
    if (link) {
      smartLinkId = link.id
      const { data: last } = await supabase.from('smart_link_clicks')
        .select('id').eq('smart_link_id', smartLinkId)
        .order('clicked_at', { ascending: false }).limit(1).maybeSingle()
      clickId = last?.id ?? null
    }
  }
  if (!smartLinkId) return NextResponse.json({ error: 'ref tidak dikenali' }, { status: 404 })

  const { error } = await supabase.from('smart_link_conversions').insert({
    smart_link_id: smartLinkId, click_id: clickId, type,
    value_rp: Math.round(Number(value) || 0), order_id: orderId ?? null, source: 'postback',
  })
  if (error && !/duplicate key/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}