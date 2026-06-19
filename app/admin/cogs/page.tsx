'use client'
// app/admin/cogs/page.tsx
// ══════════════════════════════════════════════════════════════
// COGS Monitoring — Unit Economics
// 
// Per tool: biaya (est_cogs_idr) vs pendapatan (credit_cost × nilai kredit)
// → margin per use, flag tool RUGI / GRATIS-tapi-mahal.
// Data: /api/admin/cogs (tool_credit_cost + plan_config)
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import { HorizontalBarChart } from '@/components/admin/charts'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155', border:'#334155',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', purple:'#A78BFA', blue:'#60A5FA',
}

const rp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')

interface Tool {
  tool_id: string; display_name: string | null; credit_cost: number
  est_cogs_idr: number; category: string | null; is_metered: boolean
}
interface Plan {
  tier: string; display_name: string; price_monthly: number; monthly_credit_quota: number
}

export default function CogsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/cogs', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.details || d.error); else { setTools(d.tools ?? []); setPlans(d.plans ?? []) } })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  // ── Nilai 1 kredit (IDR) — rata-rata dari paid plans ───────
  const creditValue = useMemo(() => {
    const paid = plans.filter(p => p.price_monthly > 0 && p.monthly_credit_quota > 0)
    if (!paid.length) return 0
    const sum = paid.reduce((s, p) => s + p.price_monthly / p.monthly_credit_quota, 0)
    return sum / paid.length
  }, [plans])

  // ── Hitung unit economics per tool ─────────────────────────
  const rows = useMemo(() => tools.map(t => {
    const revenuePerUse = t.credit_cost * creditValue   // pendapatan saat user pakai
    const marginIdr = revenuePerUse - t.est_cogs_idr
    const marginPct = revenuePerUse > 0 ? (marginIdr / revenuePerUse) * 100 : null
    let status: 'profit' | 'loss' | 'free' | 'breakeven'
    if (t.credit_cost === 0) status = 'free'              // gratis untuk user, tetap ada biaya
    else if (marginIdr > 0) status = 'profit'
    else if (marginIdr < 0) status = 'loss'
    else status = 'breakeven'
    return { ...t, revenuePerUse, marginIdr, marginPct, status }
  }), [tools, creditValue])

  const metered = rows.filter(r => r.credit_cost > 0)
  const freeTools = rows.filter(r => r.credit_cost === 0)
  const lossCount = metered.filter(r => r.status === 'loss').length
  const profitCount = metered.filter(r => r.status === 'profit').length
  const priciest = [...rows].sort((a, b) => b.est_cogs_idr - a.est_cogs_idr)[0]

  // Bar chart: COGS per use (tool termahal)
  const costBars = rows
    .filter(r => r.est_cogs_idr > 0)
    .slice(0, 10)
    .map(r => ({
      label: r.display_name || r.tool_id,
      value: r.est_cogs_idr,
      sublabel: r.is_metered ? `${r.credit_cost} kredit` : 'gratis',
      color: r.status === 'loss' ? D.red : r.status === 'free' ? D.amber : D.green,
    }))

  const statusBadge = (s: string) => {
    const map: Record<string, [string, string, string]> = {
      profit:    [D.green + '22', D.green, '🟢 Untung'],
      loss:      [D.red + '22',   D.red,   '🔴 Rugi'],
      free:      [D.amber + '22', D.amber, '⚪ Gratis'],
      breakeven: [D.bg700,        D.textDim,'➖ Impas'],
    }
    const [bg, color, label] = map[s] ?? map.breakeven
    return <span style={{ background: bg, color, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: D.text }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          📉 COGS Monitoring
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: D.green + '20', color: D.green }}>PHASE 4 LIVE</span>
        </h1>
        <p style={{ fontSize: 12, color: D.textMute, marginTop: 2 }}>
          Unit economics per tool — biaya AI vs pendapatan kredit. Deteksi tool yang boncos.
        </p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#7F1D1D40', border: '1px solid #B91C1C', color: '#FCA5A5', fontSize: 13, marginBottom: 14 }}>
          ⓘ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute }}>Menghitung unit economics...</div>
      ) : (
        <>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 18 }}>
            <Kpi label="NILAI 1 KREDIT" value={rp(creditValue)} sub="rata-rata paid plan" color={D.blue} />
            <Kpi label="TOOL UNTUNG" value={`${profitCount}`} sub={`dari ${metered.length} metered`} color={D.green} />
            <Kpi label="TOOL RUGI" value={`${lossCount}`} sub={lossCount > 0 ? '⚠️ perlu naik harga' : 'aman'} color={lossCount > 0 ? D.red : D.green} />
            <Kpi label="TOOL TERMAHAL" value={priciest ? rp(priciest.est_cogs_idr) : '-'} sub={priciest?.display_name || priciest?.tool_id || ''} color={D.amber} />
          </div>

          {/* Alert tool rugi */}
          {lossCount > 0 && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: '#7F1D1D30', border: `1px solid ${D.red}`, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: D.red, marginBottom: 6 }}>⚠️ {lossCount} tool rugi di harga sekarang</div>
              <div style={{ fontSize: 12, color: D.textDim, lineHeight: 1.6 }}>
                {metered.filter(r => r.status === 'loss').map(r => (
                  <div key={r.tool_id}>
                    • <b>{r.display_name || r.tool_id}</b>: charge {r.credit_cost} kredit (≈{rp(r.revenuePerUse)}) tapi biaya {rp(r.est_cogs_idr)} → rugi {rp(Math.abs(r.marginIdr))}/use.
                    Saran: naikkan ke ≥{Math.ceil(r.est_cogs_idr / creditValue)} kredit.
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart: COGS per use */}
          <Card title="💸 Biaya (COGS) per Penggunaan" subtitle="Tool termahal di atas">
            <HorizontalBarChart data={costBars} formatValue={rp} />
          </Card>

          {/* Tabel metered */}
          <Card title="⚡ Tool Berbayar (Metered) — Margin per Use">
            <Table rows={metered} creditValue={creditValue} statusBadge={statusBadge} />
          </Card>

          {/* Tabel gratis */}
          {freeTools.length > 0 && (
            <Card title="🆓 Tool Gratis — Cost Center" subtitle="Tidak charge kredit tapi tetap ada biaya">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
                {freeTools.map(t => (
                  <div key={t.tool_id} style={{ padding: '10px 12px', borderRadius: 9, background: D.bg900, border: `1px solid ${D.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: D.text }}>{t.display_name || t.tool_id}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: D.amber, marginTop: 2 }}>{rp(t.est_cogs_idr)}<span style={{ fontSize: 10, color: D.textMute, fontWeight: 500 }}>/use</span></div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div style={{ fontSize: 11, color: D.textMute, marginTop: 6 }}>
            💡 "Nilai 1 kredit" = rata-rata (harga plan ÷ kuota kredit) dari semua paket berbayar. Margin = (kredit × nilai) − biaya COGS. Edit harga/kredit di Pricing Editor untuk perbaiki margin.
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: D.bg800, border: `1px solid ${D.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: D.textMute, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: D.textMute, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 14, background: D.bg800, border: `1px solid ${D.border}`, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: D.textMute }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

function Table({ rows, creditValue, statusBadge }: { rows: any[]; creditValue: number; statusBadge: (s: string) => React.ReactNode }) {
  const th: React.CSSProperties = { padding: '8px 10px', fontSize: 10, fontWeight: 700, color: D.textMute, textAlign: 'right', letterSpacing: '0.04em' }
  const td: React.CSSProperties = { padding: '10px', fontSize: 12, textAlign: 'right', borderTop: `1px solid ${D.border}` }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left' }}>Tool</th>
            <th style={th}>Kredit</th>
            <th style={th}>Pendapatan/use</th>
            <th style={th}>COGS/use</th>
            <th style={th}>Margin/use</th>
            <th style={th}>Margin %</th>
            <th style={{ ...th, textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.tool_id}>
              <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{r.display_name || r.tool_id}</td>
              <td style={td}>{r.credit_cost}</td>
              <td style={td}>{rp(r.revenuePerUse)}</td>
              <td style={td}>{rp(r.est_cogs_idr)}</td>
              <td style={{ ...td, color: r.marginIdr >= 0 ? D.green : D.red, fontWeight: 700 }}>
                {r.marginIdr >= 0 ? '+' : '−'}{rp(Math.abs(r.marginIdr))}
              </td>
              <td style={{ ...td, color: r.marginIdr >= 0 ? D.green : D.red }}>
                {r.marginPct !== null ? `${r.marginPct.toFixed(0)}%` : '-'}
              </td>
              <td style={{ ...td, textAlign: 'center' }}>{statusBadge(r.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}