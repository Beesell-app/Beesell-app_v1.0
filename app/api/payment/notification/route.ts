// app/api/payment/notification/route.ts
// ══════════════════════════════════════════════════════════════
// POST /api/payment/notification — webhook dari Midtrans
// 
// Set URL ini di: dashboard.midtrans.com → Settings → Configuration
//   Payment Notification URL: https://DOMAIN-KAMU/api/payment/notification
// 
// Verify signature → update status order. Webhook ini SUMBER KEBENARAN
// status bayar (jangan percaya callback client).
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin-server'
import { verifySignature } from '@/lib/midtrans'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const {
    order_id, status_code, gross_amount, signature_key,
    transaction_status, fraud_status,
  } = body

  if (!order_id || !signature_key) {
    return NextResponse.json({ error: 'invalid_notification' }, { status: 400 })
  }

  // ── 1. Verify signature (anti spoofing) ────────────────────
  const valid = await verifySignature(order_id, status_code, gross_amount, signature_key)
  if (!valid) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 403 })
  }

  // ── 2. Map transaction_status → status order ───────────────
  let status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' = 'pending'

  if (transaction_status === 'capture') {
    status = fraud_status === 'challenge' ? 'pending' : 'paid'
  } else if (transaction_status === 'settlement') {
    status = 'paid'
  } else if (transaction_status === 'pending') {
    status = 'pending'
  } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
    status = 'cancelled'
  } else if (transaction_status === 'expire') {
    status = 'expired'
  } else {
    status = 'failed'
  }

  // ── 3. Update order ────────────────────────────────────────
  const supabase = createServiceClient()
  const { data: order, error } = await supabase.from('orders')
    .update({ status, midtrans_response: body, updated_at: new Date().toISOString() })
    .eq('order_ref', order_id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 })
  }

  // ── 4. FULFILLMENT saat paid ───────────────────────────────
  // ⚠️ TODO: terapkan efek pembayaran ke user, sesuaikan dengan skema kamu.
  // Contoh yang perlu diisi:
  //   - type 'plan'  → update users/subscriptions: set tier = order.item_id,
  //                    perpanjang masa aktif, reset kuota bulanan.
  //   - type 'addon' → tambah kredit/kuota:
  //                    topup-50 → +50 generate, video-5 → +5 video, dst.
  // Karena skema credits/subscriptions kamu spesifik, bagian ini sengaja
  // dikosongkan supaya tidak salah tulis. Minta Claude buatkan kalau perlu.
  if (status === 'paid' && order) {
    console.log(`[payment] PAID: ${order.order_ref} — ${order.item_type}:${order.item_id} user:${order.user_id}`)
    // await fulfillOrder(supabase, order)   // ← implement sesuai skema
  }

  // Midtrans expect 200 OK
  return NextResponse.json({ received: true })
}