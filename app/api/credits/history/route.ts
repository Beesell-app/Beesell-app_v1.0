// app/api/credits/history/route.ts
// ══════════════════════════════════════════════════════════════
// GET /api/credits/history?limit=20&before=ledger_id&type=deduct
// ══════════════════════════════════════════════════════════════
// Return ledger entries untuk transaction history page.
// Support pagination via cursor (before) dan filter type.
// ══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_TYPES = ['monthly_grant', 'purchase', 'deduct', 'refund', 'admin_adjust', 'expire']

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Silakan login dulu.' },
        { status: 401 },
      )
    }

    // ── Parse query params ────────────────────────────────────
    const url    = new URL(req.url)
    const limit  = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20'), 1), 100)
    const before = url.searchParams.get('before')   // cursor for pagination
    const type   = url.searchParams.get('type')     // optional filter

    // ── Build query ───────────────────────────────────────────
    let query = supabase
      .from('credit_ledger')
      .select(`
        id,
        txn_type,
        status,
        amount,
        balance_before,
        balance_after,
        tool_id,
        job_id,
        pack_id,
        description,
        metadata,
        created_at
      `)
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(limit)

    if (before) {
      const beforeId = parseInt(before)
      if (!isNaN(beforeId)) query = query.lt('id', beforeId)
    }

    if (type && VALID_TYPES.includes(type)) {
      query = query.eq('txn_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('[history] query error:', error.message)
      return NextResponse.json(
        { error: 'QUERY_FAILED', message: 'Gagal ambil riwayat transaksi.' },
        { status: 500 },
      )
    }

    // ── Resolve tool labels (join lokal vs DB call) ──────────
    const TOOL_LABELS: Record<string, string> = {
      'ugc-generator':    'UGC Video Generator',
      'talking-head':     'AI Talking Head',
      'image-to-video':   'Image to Video',
      'virtual-tryon':    'Virtual Try-On',
      'product-to-model': 'Product to Model',
    }

    const items = (data ?? []).map(row => ({
      ...row,
      tool_label: row.tool_id ? (TOOL_LABELS[row.tool_id] ?? row.tool_id) : null,
      // Human-friendly description (Indonesian)
      display_text: buildDisplayText(row),
    }))

    return NextResponse.json({
      items,
      next_cursor: items.length === limit ? items[items.length - 1].id : null,
      has_more:    items.length === limit,
    })
  } catch (err: any) {
    console.error('[GET /api/credits/history]', err?.message)
    return NextResponse.json(
      { error: 'INTERNAL', message: 'Gagal ambil riwayat.' },
      { status: 500 },
    )
  }
}

// ── Helper: build display text dalam Bahasa Indonesia ────────
function buildDisplayText(row: any): string {
  const amount = Math.abs(row.amount)

  switch (row.txn_type) {
    case 'monthly_grant':
      return `+${amount} credit dari grant bulanan`
    case 'purchase':
      return `+${amount} credit dari topup`
    case 'deduct':
      const toolLabel = row.tool_id ? (
        row.tool_id === 'ugc-generator'    ? 'UGC Video Generator' :
        row.tool_id === 'talking-head'     ? 'AI Talking Head' :
        row.tool_id === 'image-to-video'   ? 'Image to Video' :
        row.tool_id === 'virtual-tryon'    ? 'Virtual Try-On' :
        row.tool_id === 'product-to-model' ? 'Product to Model' :
        row.tool_id
      ) : 'tool'
      return `-${amount} credit untuk ${toolLabel}`
    case 'refund':
      return `+${amount} credit dikembalikan (${row.description ?? 'generate gagal'})`
    case 'admin_adjust':
      return `${row.amount > 0 ? '+' : '-'}${amount} credit (${row.description ?? 'penyesuaian admin'})`
    case 'expire':
      return `-${amount} credit hangus (reset bulanan)`
    default:
      return row.description ?? 'Transaksi credit'
  }
}