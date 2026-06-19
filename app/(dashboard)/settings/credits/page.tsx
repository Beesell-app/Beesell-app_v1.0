'use client'
// app/(dashboard)/settings/credits/page.tsx
// ══════════════════════════════════════════════════════════════
// Transaction History Page — Riwayat Credit
// ══════════════════════════════════════════════════════════════
//
// Halaman untuk user lihat semua transaksi credit mereka.
// Endpoint: GET /api/credits/history?limit=20&before=<cursor>&type=<filter>
//
// Fitur:
//   - Header summary (saldo, plan, total konsumsi)
//   - Filter by type: All / Pemakaian / Top-up / Grant / Refund
//   - Pagination cursor-based (load more button)
//   - Empty state untuk new user
//
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowDownRight, ArrowUpRight, RefreshCw, Sparkles,
  Filter, Calendar, Loader2, Receipt, TrendingDown, TrendingUp,
  AlertCircle, RotateCcw, Coins, Settings,
} from 'lucide-react'
import { useCredits, formatCredit, formatRupiah, planLabel, planColor } from '@/hooks/use-credits'

// ── Types ─────────────────────────────────────────────────────
interface LedgerEntry {
  id:             number
  txn_type:       'monthly_grant' | 'purchase' | 'deduct' | 'refund' | 'admin_adjust' | 'expire'
  status:         'pending' | 'completed' | 'cancelled' | 'failed'
  amount:         number
  balance_before: number
  balance_after:  number
  tool_id:        string | null
  tool_label:     string | null
  job_id:         string | null
  description:    string | null
  display_text:   string
  created_at:     string
  metadata:       Record<string, unknown>
}

interface HistoryResponse {
  items:       LedgerEntry[]
  next_cursor: number | null
  has_more:    boolean
}

// ── Filter options ────────────────────────────────────────────
const FILTERS = [
  { id: 'all',           label: 'Semua',      apiValue: null,             icon: Receipt },
  { id: 'deduct',        label: 'Pemakaian',  apiValue: 'deduct',         icon: TrendingDown },
  { id: 'purchase',      label: 'Top-up',     apiValue: 'purchase',       icon: TrendingUp },
  { id: 'monthly_grant', label: 'Grant',      apiValue: 'monthly_grant',  icon: Sparkles },
  { id: 'refund',        label: 'Refund',     apiValue: 'refund',         icon: RotateCcw },
] as const

// ── Helpers ───────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d  = new Date(iso)
  const now = new Date()
  const diffMs   = now.getTime() - d.getTime()
  const diffMin  = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMs / 3_600_000)
  const diffDay  = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1)   return 'Baru saja'
  if (diffMin < 60)  return `${diffMin} menit lalu`
  if (diffHour < 24) return `${diffHour} jam lalu`
  if (diffDay < 7)   return `${diffDay} hari lalu`

  return d.toLocaleDateString('id-ID', {
    day:   'numeric',
    month: 'short',
    year:  d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function txnIcon(type: LedgerEntry['txn_type']): { Icon: any; color: string; bg: string } {
  switch (type) {
    case 'deduct':         return { Icon: ArrowDownRight, color: '#DC2626', bg: '#FEF2F2' }
    case 'purchase':       return { Icon: ArrowUpRight,   color: '#059669', bg: '#ECFDF5' }
    case 'monthly_grant':  return { Icon: Sparkles,       color: '#7C3AED', bg: '#F5F3FF' }
    case 'refund':         return { Icon: RotateCcw,      color: '#0891B2', bg: '#ECFEFF' }
    case 'admin_adjust':   return { Icon: Settings,       color: '#F59E0B', bg: '#FEF3C7' }
    case 'expire':         return { Icon: AlertCircle,    color: '#94A3B8', bg: '#F1F5F9' }
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function CreditsHistoryPage() {
  const { data: balanceData } = useCredits()
  const [items,      setItems]      = useState<LedgerEntry[]>([])
  const [loading,    setLoading]    = useState(true)
  const [loadingMore,setLoadingMore]= useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [cursor,     setCursor]     = useState<number | null>(null)
  const [hasMore,    setHasMore]    = useState(false)
  const [filter,     setFilter]     = useState<typeof FILTERS[number]['id']>('all')

  // ── Fetch history ───────────────────────────────────────────
  const fetchHistory = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setLoading(true)
      setItems([])
      setCursor(null)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const filterCfg = FILTERS.find(f => f.id === filter)
      const params    = new URLSearchParams({ limit: '20' })
      if (filterCfg?.apiValue) params.set('type', filterCfg.apiValue)
      if (!reset && cursor)    params.set('before', String(cursor))

      const res = await fetch(`/api/credits/history?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`Failed to load history (${res.status})`)

      const data = await res.json() as HistoryResponse
      setItems(prev => reset ? data.items : [...prev, ...data.items])
      setCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (err: any) {
      setError(err.message ?? 'Gagal load riwayat')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filter, cursor])

  // ── Refetch saat filter berubah ─────────────────────────────
  useEffect(() => {
    fetchHistory(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const planColors = balanceData ? planColor(balanceData.plan_tier) : planColor('starter')

  return (
    <div style={{ maxWidth:'880px', margin:'0 auto', padding:'24px', fontFamily:"'DM Sans', sans-serif", color:'#0F172A' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
      `}</style>

      {/* ── BREADCRUMB ─────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
        <Link href="/settings" style={{ color:'#64748B', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px', fontSize:'13px' }}>
          <ArrowLeft size={14}/> Settings
        </Link>
        <span style={{ color:'#CBD5E1' }}>/</span>
        <span style={{ fontSize:'13px', color:'#475569' }}>Credit & Riwayat</span>
      </div>

      <h1 style={{ fontSize:'24px', fontWeight:800, letterSpacing:'-.02em', marginBottom:'4px' }}>
        Credit & Riwayat
      </h1>
      <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'24px' }}>
        Pantau saldo dan transparansi semua transaksi credit kamu.
      </p>

      {/* ── SUMMARY CARD ───────────────────────────────────── */}
      {balanceData && (
        <div style={{
          background:'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
          border:`1.5px solid ${planColors.primary}33`,
          borderRadius:'14px',
          padding:'20px',
          marginBottom:'24px',
          display:'grid',
          gridTemplateColumns:'repeat(4, 1fr)',
          gap:'18px',
        }}>
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'4px' }}>Saldo Sekarang</div>
            <div style={{ fontSize:'26px', fontWeight:800, color:'#0F172A', letterSpacing:'-.02em', lineHeight:1, display:'flex', alignItems:'baseline', gap:'4px' }}>
              <Coins size={20} color={planColors.primary} style={{ verticalAlign:'baseline' }}/>
              {formatCredit(balanceData.current_balance)}
            </div>
            <div style={{ fontSize:'10px', color:'#92400E', marginTop:'3px' }}>credit</div>
          </div>

          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'4px' }}>Plan</div>
            <div style={{ fontSize:'17px', fontWeight:800, color:planColors.primary, marginBottom:'2px' }}>
              {planLabel(balanceData.plan_tier)}
            </div>
            <div style={{ fontSize:'10px', color:'#92400E' }}>
              {balanceData.plan_price > 0 ? `${formatRupiah(balanceData.plan_price)}/bln` : 'Gratis'}
            </div>
          </div>

          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'4px' }}>Terpakai (bulan ini)</div>
            <div style={{ fontSize:'20px', fontWeight:800, color:'#0F172A', letterSpacing:'-.01em' }}>
              {formatCredit(balanceData.total_consumed)}
            </div>
            <div style={{ fontSize:'10px', color:'#92400E', marginTop:'2px' }}>credit</div>
          </div>

          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'4px' }}>
              {balanceData.monthly_quota > 0 ? 'Reset dalam' : 'Top-up Lifetime'}
            </div>
            <div style={{ fontSize:'20px', fontWeight:800, color:'#0F172A', letterSpacing:'-.01em' }}>
              {balanceData.monthly_quota > 0
                ? `${balanceData.days_until_reset ?? 0} hari`
                : formatCredit(balanceData.total_purchased)}
            </div>
            <div style={{ fontSize:'10px', color:'#92400E', marginTop:'2px' }}>
              {balanceData.monthly_quota > 0 ? `+ ${formatCredit(balanceData.monthly_quota)} credit` : 'credit'}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA BUTTONS (Top-up + Upgrade) ─────────────────── */}
      {balanceData && (
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
          <Link href="/settings/credits/topup"
            style={{
              padding:'10px 18px', borderRadius:'9px',
              background:'linear-gradient(135deg, #F59E0B, #D97706)',
              color:'#FFFFFF', fontSize:'13px', fontWeight:700,
              textDecoration:'none', display:'flex', alignItems:'center', gap:'6px',
              boxShadow:'0 4px 10px rgba(245,158,11,0.3)',
            }}>
            <Coins size={14}/> Top-up Credit
          </Link>
          {balanceData.plan_tier !== 'business' && (
            <Link href="/pricing"
              style={{
                padding:'10px 18px', borderRadius:'9px',
                background:'#FFFFFF', border:'1.5px solid #E2E8F0',
                color:'#334155', fontSize:'13px', fontWeight:600,
                textDecoration:'none', display:'flex', alignItems:'center', gap:'6px',
              }}>
              <TrendingUp size={14}/> Upgrade Plan
            </Link>
          )}
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', marginBottom:'16px', flexWrap:'wrap' }}>
        {/* Filter pills */}
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          {FILTERS.map(f => {
            const active = filter === f.id
            const Icon = f.icon
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  display:'inline-flex', alignItems:'center', gap:'5px',
                  padding:'7px 12px', borderRadius:'8px',
                  border:`1.5px solid ${active ? planColors.primary : '#E2E8F0'}`,
                  background: active ? planColors.light : '#FFFFFF',
                  color: active ? planColors.primary : '#475569',
                  fontSize:'12px', fontWeight: active ? 700 : 500,
                  fontFamily:'inherit', cursor:'pointer', transition:'all .15s',
                }}
              >
                <Icon size={12}/>
                {f.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => fetchHistory(true)}
          disabled={loading}
          style={{
            display:'inline-flex', alignItems:'center', gap:'5px',
            padding:'7px 12px', borderRadius:'8px',
            border:'1.5px solid #E2E8F0', background:'#FFFFFF',
            color:'#475569', fontSize:'12px', fontWeight:600,
            fontFamily:'inherit', cursor: loading ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={12} style={loading ? { animation:'spin .8s linear infinite' } : undefined}/>
          Refresh
        </button>
      </div>

      {/* ── ERROR ─────────────────────────────────────────── */}
      {error && (
        <div style={{ padding:'12px 16px', borderRadius:'9px', background:'#FEF2F2', border:'1px solid #FCA5A5', color:'#991B1B', fontSize:'13px', marginBottom:'16px', display:'flex', gap:'8px', alignItems:'center' }}>
          <AlertCircle size={14}/> {error}
        </div>
      )}

      {/* ── TIMELINE ──────────────────────────────────────── */}
      <div style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', overflow:'hidden' }}>

        {/* Loading initial */}
        {loading && (
          <div style={{ padding:'40px 24px', textAlign:'center', color:'#94A3B8' }}>
            <Loader2 size={20} style={{ animation:'spin .8s linear infinite', marginBottom:'8px' }}/>
            <div style={{ fontSize:'13px' }}>Memuat riwayat...</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div style={{ padding:'48px 24px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', margin:'0 auto 14px', borderRadius:'50%', background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Receipt size={24} color="#94A3B8"/>
            </div>
            <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'4px' }}>
              {filter === 'all' ? 'Belum ada transaksi' : 'Tidak ada transaksi dengan filter ini'}
            </h3>
            <p style={{ fontSize:'13px', color:'#64748B', maxWidth:'360px', margin:'0 auto' }}>
              {filter === 'all'
                ? 'Mulai generate dengan tools BeeSell — riwayat credit akan muncul di sini.'
                : 'Coba ganti filter atau cek di tab "Semua".'}
            </p>
          </div>
        )}

        {/* Items */}
        {!loading && items.length > 0 && (
          <>
            {items.map((item, idx) => {
              const { Icon, color, bg } = txnIcon(item.txn_type)
              const isPositive = item.amount > 0
              return (
                <div
                  key={item.id}
                  style={{
                    padding:'14px 18px',
                    display:'flex', alignItems:'center', gap:'14px',
                    borderBottom: idx === items.length - 1 ? 'none' : '1px solid #F1F5F9',
                    animation: idx < 20 ? `fadeIn .3s ease ${Math.min(idx * 0.02, 0.3)}s both` : undefined,
                  }}
                >
                  {/* Icon */}
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={16} color={color}/>
                  </div>

                  {/* Description */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#0F172A', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.display_text}
                    </div>
                    <div style={{ fontSize:'11px', color:'#94A3B8', display:'flex', gap:'8px', alignItems:'center' }}>
                      <span>{formatDate(item.created_at)}</span>
                      {item.job_id && <span style={{ fontFamily:'monospace' }}>·  #{item.job_id.slice(-8)}</span>}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'14px', fontWeight:800, color, letterSpacing:'-.01em' }}>
                      {isPositive ? '+' : ''}{formatCredit(item.amount)}
                    </div>
                    <div style={{ fontSize:'10px', color:'#94A3B8' }}>
                      → {formatCredit(item.balance_after)}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load more button */}
            {hasMore && (
              <div style={{ padding:'12px', textAlign:'center', borderTop:'1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => fetchHistory(false)}
                  disabled={loadingMore}
                  style={{
                    padding:'8px 18px', borderRadius:'8px',
                    border:'1.5px solid #E2E8F0', background:'#FFFFFF',
                    color:'#475569', fontSize:'12px', fontWeight:600,
                    fontFamily:'inherit',
                    cursor: loadingMore ? 'wait' : 'pointer',
                    display:'inline-flex', alignItems:'center', gap:'6px',
                  }}
                >
                  {loadingMore
                    ? <><Loader2 size={12} style={{ animation:'spin .8s linear infinite' }}/> Memuat...</>
                    : 'Muat lebih banyak'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer info */}
      <p style={{ marginTop:'16px', fontSize:'11px', color:'#94A3B8', textAlign:'center' }}>
        Riwayat audit lengkap. Jika ada transaksi yang tidak kamu kenali, hubungi support.
      </p>
    </div>
  )
}