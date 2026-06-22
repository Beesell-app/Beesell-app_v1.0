import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Silakan login' }, { status: 401 })

  const { data, error } = await supabase
    .from('smart_link_funnel' as any)   // hapus `as any` setelah regen types
    .select('*')
    .order('gmv_rp', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, rows: data ?? [] })
}