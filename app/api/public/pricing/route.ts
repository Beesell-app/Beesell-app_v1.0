// app/api/public/pricing/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/public/pricing  — FINAL (semua integrasi)
// 
// Return: plans (+kuota), daily_limits, credit_costs, features, addons
// Single source of truth — edit via /admin/* → reflected ≤60 detik
// PUBLIC, no auth, cache 60s. Fallback hardcoded kalau DB down.
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

export const revalidate = 60

export async function GET() {
  const supabase = publicClient()

  const [plansRes, limitsRes, costsRes, featuresRes, addonsRes] = await Promise.all([
    supabase.from('plan_config')
      .select('tier, display_name, price_monthly, price_yearly, tagline, features, is_popular, is_active, sort_order, monthly_credit_quota, image_quota, video_quota, tryon_quota')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    supabase.from('daily_limit_config')
      .select('tier, tool_id, daily_limit'),

    supabase.from('tool_credit_cost')
      .select('tool_id, credit_cost, display_name'),

    supabase.from('feature_flags_db')
      .select('tool_id, display_name, category, description, status, available_starter, available_basic, available_pro, available_business, sort_order, show_in_pricing')
      .eq('show_in_pricing', true)
      .order('sort_order', { ascending: true }),

    supabase.from('addon_config')
      .select('addon_id, label, qty, price, icon, color, badge, kind, eta, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  // Plans wajib ada; sisanya optional (graceful kalau tabel belum dibuat)
  if (plansRes.error || !plansRes.data?.length) {
    console.warn('[public/pricing] plans unavailable, fallback:', plansRes.error?.message)
    return NextResponse.json(FALLBACK_PRICING, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    })
  }

  // Tabel feature/addon mungkin belum ada → jangan gagalkan request, kosongkan saja
  if (featuresRes.error) console.warn('[public/pricing] features unavailable:', featuresRes.error.message)
  if (addonsRes.error)   console.warn('[public/pricing] addons unavailable:', addonsRes.error.message)

  return NextResponse.json({
    source: 'db',
    updated_at: new Date().toISOString(),
    plans:        plansRes.data,
    daily_limits: limitsRes.data ?? [],
    credit_costs: costsRes.data ?? [],
    features:     featuresRes.data ?? [],   // matriks fitur per tier
    addons:       addonsRes.data ?? [],     // add-on
  }, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  })
}

// ══════════════════════════════════════════════════════════════
// FALLBACK — dipakai kalau plan_config down / belum di-seed
// ══════════════════════════════════════════════════════════════
const FALLBACK_PRICING = {
  source: 'fallback',
  updated_at: null,
  plans: [
    { tier:'starter', display_name:'Starter', price_monthly:0, price_yearly:0, tagline:'Coba gratis dulu', is_popular:false, is_active:true, sort_order:0, monthly_credit_quota:0, image_quota:5, video_quota:0, tryon_quota:0, features:['5 generate lifetime','Watermark BeeSell'] },
    { tier:'basic', display_name:'Toko Mini', price_monthly:149000, price_yearly:1430000, tagline:'Untuk seller pemula', is_popular:false, is_active:true, sort_order:1, monthly_credit_quota:200, image_quota:200, video_quota:0, tryon_quota:0, features:['200 gambar/bulan','No watermark'] },
    { tier:'pro', display_name:'Toko Aktif', price_monthly:399000, price_yearly:3830000, tagline:'Paling laris', is_popular:true, is_active:true, sort_order:2, monthly_credit_quota:500, image_quota:400, video_quota:5, tryon_quota:20, features:['400 gambar/bulan','5 video','20 try-on'] },
    { tier:'business', display_name:'Brand & Agency', price_monthly:999000, price_yearly:9590000, tagline:'Scale tanpa batas', is_popular:false, is_active:true, sort_order:3, monthly_credit_quota:1500, image_quota:1000, video_quota:20, tryon_quota:100, features:['1.000 gambar/bulan','Team','API'] },
  ],
  daily_limits: [],
  credit_costs: [],
  features: [],
  addons: [],
}