// supabase/functions/daily-limit-reset/index.ts
// ══════════════════════════════════════════════════════════════
// Edge Function: Daily Limit Reset
// ══════════════════════════════════════════════════════════════
//
// Jalan tiap hari jam 00:01 WIB (17:01 UTC sebelumnya = 00:01 WIB next day)
// Schedule via Supabase Dashboard atau pg_cron:
//
//   SELECT cron.schedule(
//     'daily-limit-reset-wib',
//     '1 17 * * *',  -- 17:01 UTC = 00:01 WIB next day
//     $$ SELECT net.http_post('https://yourproject.supabase.co/functions/v1/daily-limit-reset', '{}', '{}'); $$
--   );
//
// FUNGSI:
//   1. Delete daily_usage records yang usage_date < today_WIB
//   2. Log statistik (how many users hit limit kemarin)
//   3. Trigger upgrade-nudge emails untuk user yang sering hit limit
//
// ══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

serve(async (req) => {
  // ── Auth check ──────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') || ''
  const isSupabaseSchedule = authHeader === `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
  const isCronCall = req.headers.get('X-Cron-Secret') === CRON_SECRET

  if (!isSupabaseSchedule && !isCronCall) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ── Init Supabase admin client ──────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const startTime = Date.now()

  try {
    // ── 1. Calculate "today" in WIB ──────────────────────────
    const nowUTC = new Date()
    const nowWIB = new Date(nowUTC.getTime() + (7 * 60 * 60 * 1000))
    const todayWIB = nowWIB.toISOString().split('T')[0]  // YYYY-MM-DD

    console.log(`[daily-reset] Running at ${nowUTC.toISOString()} UTC (${todayWIB} WIB)`)

    // ── 2. Stats: count users hit limit kemarin ──────────────
    const yesterdayWIB = new Date(nowWIB.getTime() - 86400000).toISOString().split('T')[0]

    const { data: stats, error: statsErr } = await supabase
      .from('daily_usage')
      .select('user_id, tool_id, count')
      .eq('usage_date', yesterdayWIB)

    if (statsErr) {
      console.error('[daily-reset] Stats query error:', statsErr)
    }

    let usersHitLimit  = new Set<string>()
    let totalGenerations = 0
    
    if (stats) {
      // Get limit config untuk compare
      const { data: limits } = await supabase
        .from('daily_limit_config')
        .select('tier, tool_id, daily_limit')

      // Get user tiers
      const userIds = [...new Set(stats.map(s => s.user_id))]
      const { data: usersTier } = await supabase
        .from('user_credits')
        .select('user_id, plan_tier')
        .in('user_id', userIds)

      const userTierMap = new Map(usersTier?.map(u => [u.user_id, u.plan_tier]) ?? [])
      const limitMap = new Map(
        limits?.map(l => [`${l.tier}:${l.tool_id}`, l.daily_limit]) ?? []
      )

      for (const entry of stats) {
        totalGenerations += entry.count
        const tier  = userTierMap.get(entry.user_id)
        if (!tier) continue
        const limit = limitMap.get(`${tier}:${entry.tool_id}`)
        if (limit && entry.count >= limit) {
          usersHitLimit.add(entry.user_id)
        }
      }
    }

    // ── 3. Cleanup old daily_usage records (keep 7 hari history) ─
    const sevenDaysAgoWIB = new Date(nowWIB.getTime() - 7 * 86400000).toISOString().split('T')[0]

    const { error: deleteErr, count: deletedCount } = await supabase
      .from('daily_usage')
      .delete({ count: 'exact' })
      .lt('usage_date', sevenDaysAgoWIB)

    if (deleteErr) {
      console.error('[daily-reset] Delete error:', deleteErr)
    }

    // ── 4. Optional: log to admin_alerts kalau ada user yang sering hit limit ─
    // (Skip kalau admin_alerts table belum ada)

    const elapsed = Date.now() - startTime

    const result = {
      success: true,
      ran_at_utc:        nowUTC.toISOString(),
      ran_at_wib:        nowWIB.toISOString(),
      today_wib:         todayWIB,
      yesterday_stats: {
        total_users_with_activity: stats?.length ? new Set(stats.map(s => s.user_id)).size : 0,
        total_generations:         totalGenerations,
        users_hit_limit:           usersHitLimit.size,
      },
      cleanup: {
        deleted_old_records: deletedCount ?? 0,
        retention_days:      7,
      },
      elapsed_ms: elapsed,
    }

    console.log('[daily-reset] Complete:', JSON.stringify(result))

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[daily-reset] Fatal error:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error:   err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/*
 * DEPLOY:
 *   supabase functions deploy daily-limit-reset
 *
 * SETUP SCHEDULE (di Supabase Dashboard):
 *   Schedule: 1 17 * * *   (17:01 UTC = 00:01 WIB next day)
 *
 * Atau via pg_cron:
 *   SELECT cron.schedule(
 *     'daily-limit-reset-wib',
 *     '1 17 * * *',
 *     $$ SELECT net.http_post(
 *       'https://yourproject.supabase.co/functions/v1/daily-limit-reset',
 *       '{}'::jsonb,
 *       '{"X-Cron-Secret": "your-cron-secret-here"}'::jsonb
 *     ); $$
 *   );
 *
 * TEST MANUAL:
 *   curl -X POST https://yourproject.supabase.co/functions/v1/daily-limit-reset \
 *     -H "X-Cron-Secret: your-cron-secret-here"
 */