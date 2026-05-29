// apps/web-app/app/api/cron/reset-quota/route.ts
// ── SP 1 DevOps: Monthly Quota Reset Cron ────────────────────
// Dipanggil Vercel Cron setiap tanggal 1 jam 00:00 UTC
// Schedule di vercel.json: "0 0 1 * *"
// Memanggil Supabase stored procedure reset_monthly_quota()
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse }      from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60  // max 60 detik (Pro plan)

export async function GET(request: Request) {
  // Verifikasi request dari Vercel Cron — bukan dari luar
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date().toISOString()

  try {
    const supabase = createAdminClient()

    // Panggil stored procedure di Supabase
    // reset_monthly_quota() return table: { tenant_id, plan, content_was, content_now, video_was, video_now }
    type ResetQuotaRow = {
      tenant_id: string
      plan: string
      content_was: number
      content_now: number
      video_was: number
      video_now: number
    }

    const { data, error } = await supabase
      .rpc('reset_monthly_quota')

    if (error) {
      console.error('[cron/reset-quota] Supabase RPC error:', error.message)
      return NextResponse.json({
        success:   false,
        error:     error.message,
        startedAt,
        finishedAt: new Date().toISOString(),
      }, { status: 500 })
    }

    const tenantsReset = Array.isArray(data)
  ? (data as unknown[]).length
  : 0

    console.log(`[cron/reset-quota] Reset ${tenantsReset} tenants at ${startedAt}`)

    return NextResponse.json({
      success:    true,
      startedAt,
      finishedAt: new Date().toISOString(),
      tenantsReset,
      preview: Array.isArray(data)
  ? (data as unknown[]).slice(0, 5)
  : [], // sample 5 tenant
    })

  } catch (err: any) {
    console.error('[cron/reset-quota] Unexpected error:', err.message)
    return NextResponse.json({
      success:    false,
      error:      err.message,
      startedAt,
      finishedAt: new Date().toISOString(),
    }, { status: 500 })
  }
}