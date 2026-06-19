// app/api/payment/create/route.ts
// ══════════════════════════════════════════════════════════════
// POST /api/payment/create
// 
// Body: { type: 'plan'|'addon', id: string, billing?: 'monthly'|'yearly' }
// 
// ⚡ KEAMANAN: harga DIAMBIL DARI DB (bukan dari client) → anti-tamper.
// Return: { token, redirect_url, order_ref }
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServiceClient } from '@/lib/supabase/admin-server'
import { createSnapTransaction } from '@/lib/midtrans'

export async function POST(req: NextRequest) {
  // ── 1. Auth: user harus login ──────────────────────────────
  const authClient = await createAdminSupabaseClient()
  const { data: { user }, error: authErr } = await authClient.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized', message: 'Login dulu untuk membayar' }, { status: 401 })
  }

  // ── 2. Parse body ──────────────────────────────────────────
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { type, id, billing } = body
  if (!['plan', 'addon'].includes(type) || !id) {
    return NextResponse.json({ error: 'invalid_input', message: 'type (plan|addon) + id wajib' }, { status: 400 })
  }

  const supabase = createServiceClient()  // bypass RLS untuk lookup + insert order

  // ── 3. Lookup harga DARI DB (anti-tamper) ──────────────────
  let amount = 0
  let label  = ''

  if (type === 'plan') {
    const { data: plan, error } = await supabase
      .from('plan_config')
      .select('display_name, price_monthly, price_yearly')
      .eq('tier', id)
      .eq('is_active', true)
      .maybeSingle()
    if (error || !plan) {
      return NextResponse.json({ error: 'plan_not_found', message: `Plan ${id} tidak ada` }, { status: 404 })
    }
    const isYearly = billing === 'yearly'
    amount = isYearly ? Number(plan.price_yearly) : Number(plan.price_monthly)
    label  = `${plan.display_name} (${isYearly ? 'Tahunan' : 'Bulanan'})`
  } else {
    const { data: addon, error } = await supabase
      .from('addon_config')
      .select('label, price')
      .eq('addon_id', id)
      .eq('is_active', true)
      .maybeSingle()
    if (error || !addon) {
      return NextResponse.json({ error: 'addon_not_found', message: `Add-on ${id} tidak ada` }, { status: 404 })
    }
    amount = Number(addon.price)
    label  = addon.label
  }

  if (!amount || amount < 1) {
    return NextResponse.json({ error: 'invalid_amount', message: 'Item ini gratis / harga tidak valid' }, { status: 400 })
  }

  // ── 4. Bikin order_ref unik ────────────────────────────────
  const orderRef = `BEE-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  // ── 5. Insert order (pending) ──────────────────────────────
  const { error: insErr } = await supabase.from('orders').insert({
    order_ref:     orderRef,
    user_id:       user.id,
    item_type:     type,
    item_id:       id,
    item_label:    label,
    amount,
    billing_cycle: type === 'plan' ? (billing ?? 'monthly') : null,
    status:        'pending',
  })
  if (insErr) {
    return NextResponse.json({ error: 'order_insert_failed', message: insErr.message }, { status: 500 })
  }

  // ── 6. Bikin Snap transaction ──────────────────────────────
  try {
    const snap = await createSnapTransaction({
      orderRef,
      amount,
      items: [{ id: String(id), price: amount, quantity: 1, name: label }],
      customer: { email: user.email ?? undefined },
    })

    // Simpan token ke order
    await supabase.from('orders')
      .update({ midtrans_token: snap.token, updated_at: new Date().toISOString() })
      .eq('order_ref', orderRef)

    return NextResponse.json({ token: snap.token, redirect_url: snap.redirect_url, order_ref: orderRef })
  } catch (e: any) {
    await supabase.from('orders')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('order_ref', orderRef)
    return NextResponse.json({ error: 'midtrans_failed', message: e.message }, { status: 502 })
  }
}