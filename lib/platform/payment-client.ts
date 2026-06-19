'use client'
// lib/payment-client.ts
// ══════════════════════════════════════════════════════════════
// startPayment — helper client buat semua tombol bayar
// 
// Auto-load Snap.js, panggil /api/payment/create, buka popup Snap.
// Kalau belum login → redirect ke /login.
// 
// Pakai di tombol:
//   onClick={() => startPayment({ type:'plan', id:'pro', billing:'monthly' })}
//   onClick={() => startPayment({ type:'addon', id:'topup-50' })}
// ══════════════════════════════════════════════════════════════

declare global {
  interface Window { snap?: any }
}

const IS_PROD = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
const SNAP_SCRIPT = IS_PROD
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'

let snapLoading: Promise<void> | null = null

/** Inject snap.js sekali, resolve saat window.snap siap */
function loadSnap(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.snap) return Promise.resolve()
  if (snapLoading) return snapLoading

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
  if (!clientKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum di-set'))
  }

  snapLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SNAP_SCRIPT
    s.setAttribute('data-client-key', clientKey)
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Gagal load Snap.js'))
    document.body.appendChild(s)
  })
  return snapLoading
}

export interface StartPaymentParams {
  type:    'plan' | 'addon'
  id:      string
  billing?: 'monthly' | 'yearly'
  onSuccess?: (result: any) => void
  onPending?: (result: any) => void
  onError?:   (err: any) => void
  onClose?:   () => void
}

/**
 * Mulai pembayaran. Return Promise<void>.
 * Handle: belum login → redirect; item gratis → info; sukses → callback.
 */
export async function startPayment(params: StartPaymentParams): Promise<void> {
  try {
    // 1. Bikin transaksi di server (harga divalidasi server)
    const res = await fetch('/api/payment/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: params.type, id: params.id, billing: params.billing }),
    })

    // Belum login → arahkan ke login, balik lagi ke billing
    if (res.status === 401) {
      const back = encodeURIComponent('/billing')
      window.location.href = `/login?redirect=${back}`
      return
    }

    const data = await res.json()
    if (!res.ok) {
      params.onError?.(data)
      alert(data.message || 'Gagal memulai pembayaran')
      return
    }

    // 2. Load Snap + buka popup
    await loadSnap()
    window.snap.pay(data.token, {
      onSuccess: (r: any) => params.onSuccess?.(r),
      onPending: (r: any) => params.onPending?.(r),
      onError:   (e: any) => { params.onError?.(e); alert('Pembayaran gagal') },
      onClose:   ()       => params.onClose?.(),
    })
  } catch (e: any) {
    params.onError?.(e)
    alert(e.message || 'Terjadi kesalahan')
  }
}