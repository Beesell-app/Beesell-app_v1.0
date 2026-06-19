// app/api/admin/health/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/admin/health — System Health
// 
//   - config: status env service (set / missing) — TANPA bocorkan value
//   - db: latency query + row counts tabel inti
//   - usage: agregat ai_usage_daily 30 hari (requests, cache, latency)
// 
// Defensive: tabel kosong / belum ada → 0, tidak error.
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/supabase/admin-server'

// Daftar env yang dicek. Sesuaikan nama kalau env kamu beda.
const ENV_CHECKS: { group: string; key: string; label: string }[] = [
  { group: 'Database',  key: 'NEXT_PUBLIC_SUPABASE_URL',        label: 'Supabase URL' },
  { group: 'Database',  key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',   label: 'Supabase Anon Key' },
  { group: 'Database',  key: 'SUPABASE_SERVICE_ROLE_KEY',       label: 'Supabase Service Key' },
  { group: 'Payment',   key: 'MIDTRANS_SERVER_KEY',             label: 'Midtrans Server Key' },
  { group: 'Payment',   key: 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY', label: 'Midtrans Client Key' },
  { group: 'AI',        key: 'OPENAI_API_KEY',                  label: 'OpenAI' },
  { group: 'AI',        key: 'ANTHROPIC_API_KEY',               label: 'Anthropic / Claude' },
  { group: 'AI',        key: 'REPLICATE_API_TOKEN',             label: 'Replicate (SD/video)' },
  { group: 'Storage',   key: 'R2_ACCESS_KEY_ID',                label: 'Cloudflare R2 Key' },
  { group: 'Storage',   key: 'R2_BUCKET',                       label: 'R2 Bucket' },
]

async function countTable(supabase: any, table: string): Promise<number | null> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return error ? null : (count ?? 0)
}

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  // ── Config (cek presence env, jangan kirim value) ──────────
  const config = ENV_CHECKS.map(c => ({
    group: c.group, label: c.label, key: c.key,
    set: Boolean(process.env[c.key] && process.env[c.key]!.length > 3),
  }))

  // ── DB latency ─────────────────────────────────────────────
  const t0 = Date.now()
  await supabase.from('users').select('id', { count: 'exact', head: true })
  const dbLatencyMs = Date.now() - t0

  // ── Row counts tabel inti ──────────────────────────────────
  const [users, subs, orders, credits, ledger, usageRows] = await Promise.all([
    countTable(supabase, 'users'),
    countTable(supabase, 'subscriptions'),
    countTable(supabase, 'orders'),
    countTable(supabase, 'user_credits'),
    countTable(supabase, 'credit_ledger'),
    countTable(supabase, 'ai_usage_daily'),
  ])

  // ── Usage 30 hari (ai_usage_daily) ─────────────────────────
  const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
  const { data: usage } = await supabase
    .from('ai_usage_daily')
    .select('ai_provider, request_count, cache_hits, avg_duration_ms, cost_usd, stat_date')
    .gte('stat_date', since)

  // Agregat per provider
  const byProvider = new Map<string, { req: number; cache: number; durSum: number; durN: number; cost: number }>()
  let totalReq = 0, totalCache = 0
  for (const u of usage ?? []) {
    const p = u.ai_provider || 'unknown'
    const e = byProvider.get(p) || { req: 0, cache: 0, durSum: 0, durN: 0, cost: 0 }
    e.req += u.request_count || 0
    e.cache += u.cache_hits || 0
    e.cost += u.cost_usd || 0
    if (u.avg_duration_ms) { e.durSum += u.avg_duration_ms * (u.request_count || 1); e.durN += (u.request_count || 1) }
    byProvider.set(p, e)
    totalReq += u.request_count || 0
    totalCache += u.cache_hits || 0
  }
  const providers = Array.from(byProvider.entries()).map(([provider, e]) => ({
    provider, requests: e.req, cache_hits: e.cache,
    avg_latency_ms: e.durN > 0 ? Math.round(e.durSum / e.durN) : null,
    cost_usd: e.cost,
  }))

  return NextResponse.json({
    config,
    db: { latency_ms: dbLatencyMs, counts: { users, subscriptions: subs, orders, user_credits: credits, credit_ledger: ledger, ai_usage_daily: usageRows } },
    usage: { total_requests: totalReq, total_cache_hits: totalCache, cache_rate: totalReq > 0 ? (totalCache / totalReq) * 100 : null, providers, has_data: (usage?.length ?? 0) > 0 },
  })
}