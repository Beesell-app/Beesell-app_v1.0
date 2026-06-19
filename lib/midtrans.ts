// lib/midtrans.ts
// ══════════════════════════════════════════════════════════════
// Midtrans Snap — server helper (raw fetch, tanpa SDK)
// 
// ENV yang dibutuhkan (.env.local):
//   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx      (server only, RAHASIA)
//   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
//   MIDTRANS_IS_PRODUCTION=false                 (true kalau sudah live)
// 
// Ambil key di: dashboard.midtrans.com → Settings → Access Keys
// ══════════════════════════════════════════════════════════════

const IS_PROD = process.env.MIDTRANS_IS_PRODUCTION === 'true'

const SNAP_BASE = IS_PROD
  ? 'https://app.midtrans.com'
  : 'https://app.sandbox.midtrans.com'

export interface SnapItem {
  id:       string
  price:    number
  quantity: number
  name:     string
}

export interface CreateSnapParams {
  orderRef:  string
  amount:    number
  items:     SnapItem[]
  customer?: { first_name?: string; email?: string }
}

export interface SnapResult {
  token:        string
  redirect_url: string
}

/**
 * Bikin transaksi Snap. Return token + redirect_url.
 * Throw Error kalau gagal.
 */
export async function createSnapTransaction(params: CreateSnapParams): Promise<SnapResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY belum di-set di .env.local')
  }

  // Midtrans pakai HTTP Basic Auth: base64(serverKey + ':')
  const auth = Buffer.from(`${serverKey}:`).toString('base64')

  const payload = {
    transaction_details: {
      order_id:     params.orderRef,
      gross_amount: params.amount,          // wajib integer
    },
    item_details: params.items.map(it => ({
      id:       it.id,
      price:    it.price,
      quantity: it.quantity,
      name:     it.name.slice(0, 50),       // Midtrans batasi 50 char
    })),
    customer_details: params.customer ?? {},
    credit_card: { secure: true },
  }

  const res = await fetch(`${SNAP_BASE}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = Array.isArray(data?.error_messages)
      ? data.error_messages.join('; ')
      : (data?.status_message || `Midtrans error ${res.status}`)
    throw new Error(msg)
  }

  return { token: data.token, redirect_url: data.redirect_url }
}

/**
 * Verify signature_key dari webhook notification Midtrans.
 * signature = sha512(order_id + status_code + gross_amount + server_key)
 */
export async function verifySignature(
  orderId: string, statusCode: string, grossAmount: string, signatureKey: string,
): Promise<boolean> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? ''
  const crypto = await import('crypto')
  const expected = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex')
  return expected === signatureKey
}