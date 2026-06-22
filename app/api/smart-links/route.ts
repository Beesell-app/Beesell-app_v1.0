import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genSlug } from '@/lib/smart-links/attribution'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Silakan login' }, { status: 401 })

  const { destination, title, productName, contentId, platform, campaign } =
    await req.json().catch(() => ({} as any))
  if (!destination || !/^https?:\/\//.test(destination)) {
    return NextResponse.json({ error: 'destination URL wajib & valid' }, { status: 400 })
  }

  let slug = genSlug()
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await supabase.from('smart_links').select('id').eq('slug', slug).maybeSingle()
    if (!exists) break
    slug = genSlug()
  }

  const { data, error } = await supabase.from('smart_links').insert({
    user_id: user.id, slug, destination,
    title: title ?? null, product_name: productName ?? null,
    content_id: contentId ?? null, platform: platform ?? null, campaign: campaign ?? null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  return NextResponse.json({ success: true, link: { ...data, shortUrl: `${base}/l/${slug}` } })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Silakan login' }, { status: 401 })

  const { data: links } = await supabase
    .from('smart_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json({ success: true, links: links ?? [] })
}