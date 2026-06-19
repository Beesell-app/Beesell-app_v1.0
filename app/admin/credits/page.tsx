'use client'
// app/admin/credits/page.tsx
// ══════════════════════════════════════════════════════════════
// Credit Economy — kesehatan sistem kredit
// 
// Liability (saldo beredar), issued vs consumed, distribusi per tier,
// tool paling boros, aktivitas terbaru. Data: /api/admin/credits
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import { DonutChart, HorizontalBarChart, CHART_COLORS } from '@/components/admin/charts'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155', border:'#334155',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', purple:'#A78BFA', blue:'#60A5FA', pink:'#F472B6',
}

const rp  = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')
const num = (n: number) => Math.round(n).toLocaleString('id-ID')

const TIER_COLOR: Record<string, string> = {
  starter: D.textMute, free: D.textMute, basic: D.blue, pro: D.amber, business: D.purple,
}

interface UserCredit {
  user_id: string; plan_tier: string | null; current_balance: number; monthly_quota: number
  total_purchased: number; total_consumed: number; total_used_this_month: number; status: string | null
}
interface Plan { tier: string; display_name: string; price_monthly: number; monthly_credit_quota: number }
interface Ledger { tool_id: string | null; amount: number; balance_before: number; balance_after: number; created_at: string; description: string | null }

export default function CreditsPage() {
  const [credits, setCredits] = useState<UserCredit[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [ledger, setLedger] = useState<Ledger[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/credits', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.details || d.error); return }
        setCredits(d.credits ?? []); setPlans(d.plans ?? []); setLedger(d.ledger ?? [])
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  // Nilai 1 kredit (avg paid plan) — sama seperti COGS page
  const creditValue = useMemo(() => {
    const paid = plans.filter(p => p.price_monthly > 0 && p.monthly_credit_quota > 0)
    if (!paid.length) return 0
    return paid.reduce((s, p) => s + p.price_monthly / p.monthly_credit_quota, 0) / paid.length
  }, [plans])

  // ── Agregat dari user_credits ──────────────────────────────
  const agg = useMemo(() => {
    const liability  = credits.reduce((s, c) => s + (c.current_balance || 0), 0)
    const issued     = credits.reduce((s, c) => s + (c.total_purchased || 0), 0)
    const consumed   = credits.reduce((s, c) => s + (c.total_consumed || 0), 0)
    const burnMonth  = credits.reduce((s, c) => s + (c.total_used_this_month || 0), 0)
    const withCredit = credits.filter(c => (c.current_balance || 0) > 0).length

    const byTier = new Map<string, { users: number; balance: number; quota: number }>()
    for (const c of credits) {
      const t = c.plan_tier || 'unknown'
      const e = byTier.get(t) || { users: 0, balance: 0, quota: 0 }
      e.users   += 1
      e.balance += c.current_balance || 0
      e.quota   += c.monthly_quota || 0
      byTier.set(t, e)
    }
    return { liability, issued, consumed, burnMonth, withCredit, byTier }
  }, [credits])

  // ── Top tools dari ledger (konsumsi = balance turun) ───────
  const topTools = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of ledger) {
      if (!l.tool_id) continue
      const delta = (l.balance_after ?? 0) - (l.balance_before ?? 0)
      if (delta < 0) m.set(l.tool_id, (m.get(l.tool_id) || 0) + Math.abs(delta))
    }
    return Array.from(m.entries())
      .map(([tool_id, used]) => ({ tool_id, used }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 8)
  }, [ledger])

  const recent = ledger.slice(0, 12)
  const hasLedger = ledger.length > 0

  // Donut: saldo per tier
  const donutData = Array.from(agg.byTier.entries())
    .filter(([, v]) => v.balance > 0)
    .map(([tier, v]) => ({ label: tier, value: v.balance, color: TIER_COLOR[tier] || D.textMute }))

  const barData = topTools.map((t, i) => ({
    label: t.tool_id,
    value: t.used,
    color: CHART_COLORS.sequential?.[i % (CHART_COLORS.sequential.length || 1)] || D.amber,
  }))

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: D.text }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          💎 Credit Economy
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: D.green + '20', color: D.green }}>PHASE 4 LIVE</span>
        </h1>
        <p style={{ fontSize: 12, color: D.textMute, marginTop: 2 }}>
          Kesehatan sistem kredit — saldo beredar, issued vs consumed, tool paling boros.
        </p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#7F1D1D40', border: '1px solid #B91C1C', color: '#FCA5A5', fontSize: 13, marginBottom: 14 }}>ⓘ {error}</div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute }}>Memuat data kredit...</div>
      ) : credits.length === 0 ? (
        <EmptyBox text="Belum ada data user_credits. Begitu user pertama dapat kredit (signup/bayar), data muncul di sini." />
      ) : (
        <>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 12, marginBottom: 18 }}>
            <Kpi label="LIABILITY (SALDO BEREDAR)" value={num(agg.liability)} sub={`≈ ${rp(agg.liability * creditValue)} nilai layanan`} color={D.amber} />
            <Kpi label="TOTAL ISSUED" value={num(agg.issued)} sub="kredit pernah diberikan" color={D.blue} />
            <Kpi label="TOTAL CONSUMED" value={num(agg.consumed)} sub={agg.issued > 0 ? `${((agg.consumed / agg.issued) * 100).toFixed(0)}% dari issued` : ''} color={D.green} />
            <Kpi label="BURN BULAN INI" value={num(agg.burnMonth)} sub="kredit terpakai bulan ini" color={D.pink} />
            <Kpi label="USER PUNYA SALDO" value={`${agg.withCredit}`} sub={`dari ${credits.length} user`} color={D.purple} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginBottom: 16 }}>
            {/* Donut saldo per tier */}
            <Card title="🥧 Saldo Kredit per Tier">
              {donutData.length > 0
                ? <DonutChart data={donutData} />
                : <EmptyInline text="Belum ada saldo." />}
            </Card>

            {/* Bar top tools */}
            <Card title="🔥 Tool Paling Boros Kredit" subtitle={hasLedger ? `dari ${ledger.length} transaksi terakhir` : undefined}>
              {barData.length > 0
                ? <HorizontalBarChart data={barData} />
                : <EmptyInline text={hasLedger ? 'Belum ada konsumsi tool tercatat.' : 'Belum ada transaksi di credit_ledger.'} />}
            </Card>
          </div>

          {/* Tabel per tier */}
          <Card title="📊 Ringkasan per Tier">
            <TierTable byTier={agg.byTier} creditValue={creditValue} />
          </Card>

          {/* Aktivitas terbaru */}
          <Card title="🕐 Aktivitas Kredit Terbaru">
            {recent.length > 0 ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {recent.map((l, i) => {
                  const delta = (l.balance_after ?? 0) - (l.balance_before ?? 0)
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: D.bg900, border: `1px solid ${D.border}` }}>
                      <div style={{ fontSize: 12, color: D.textDim }}>
                        {l.tool_id || l.description || 'transaksi'}
                        <span style={{ color: D.textMute, marginLeft: 8, fontSize: 10 }}>{new Date(l.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: delta >= 0 ? D.green : D.red }}>
                        {delta >= 0 ? '+' : ''}{num(delta)} kredit
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <EmptyInline text="Belum ada aktivitas kredit." />}
          </Card>

          <div style={{ fontSize: 11, color: D.textMute, marginTop: 6 }}>
            💡 <b>Liability</b> = total saldo kredit yang masih dipegang user — ini "utang layanan" kamu: kalau semua user pakai sekarang, itu biaya yang harus kamu tanggung. Pantau agar tidak menumpuk melebihi kemampuan COGS.
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: D.bg800, border: `1px solid ${D.border}` }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: D.textMute, letterSpacing: '0.05em' }}>{label}</div>
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

function TierTable({ byTier, creditValue }: { byTier: Map<string, { users: number; balance: number; quota: number }>; creditValue: number }) {
  const th: React.CSSProperties = { padding: '8px 10px', fontSize: 10, fontWeight: 700, color: D.textMute, textAlign: 'right', letterSpacing: '0.04em' }
  const td: React.CSSProperties = { padding: '10px', fontSize: 12, textAlign: 'right', borderTop: `1px solid ${D.border}` }
  const rows = Array.from(byTier.entries()).sort((a, b) => b[1].balance - a[1].balance)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={{ ...th, textAlign: 'left' }}>Tier</th>
          <th style={th}>User</th>
          <th style={th}>Saldo total</th>
          <th style={th}>Quota total</th>
          <th style={th}>Utilisasi</th>
          <th style={th}>Nilai saldo</th>
        </tr></thead>
        <tbody>
          {rows.map(([tier, v]) => {
            const util = v.quota > 0 ? ((v.quota - v.balance) / v.quota) * 100 : 0
            return (
              <tr key={tier}>
                <td style={{ ...td, textAlign: 'left' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: TIER_COLOR[tier] || D.textMute, marginRight: 8 }} />
                  <b style={{ textTransform: 'capitalize' }}>{tier}</b>
                </td>
                <td style={td}>{v.users}</td>
                <td style={td}>{num(v.balance)}</td>
                <td style={td}>{num(v.quota)}</td>
                <td style={{ ...td, color: util > 80 ? D.red : util > 50 ? D.amber : D.green }}>{util.toFixed(0)}%</td>
                <td style={td}>{rp(v.balance * creditValue)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EmptyBox({ text }: { text: string }) {
  return <div style={{ padding: 40, textAlign: 'center', color: D.textMute, fontSize: 13, background: D.bg800, borderRadius: 14, border: `1px dashed ${D.border}` }}>{text}</div>
}
function EmptyInline({ text }: { text: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: D.textMute, fontSize: 12 }}>{text}</div>
}