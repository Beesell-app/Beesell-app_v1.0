'use client'
// app/admin/revenue/page.tsx
// ══════════════════════════════════════════════════════════════
// Revenue Analytics — deep-dive dengan filter periode + breakdown
//
// Data sources:
//   GET /api/admin/revenue?days=N&view=both     (timeseries + by_tier)
//   GET /api/admin/user-growth?days=N           (user signup trend)
// ══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { RefreshCw, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import {
  PageHeader, Card, Button, Toast, EmptyState, D,
} from '@/components/admin/shared/ui'
import { LineChart, HorizontalBarChart, DonutChart, CHART_COLORS } from '@/components/admin/charts'

interface TimeseriesPoint {
  date:        string
  revenue_idr: number
  txn_count:   number
}

interface TierBreakdown {
  tier:           string
  revenue_idr:    number
  txn_count:      number
  active_subs:    number
}

interface UserGrowthPoint {
  date:        string
  total_users: number
  new_users:   number
}

type Period = 7 | 30 | 90
// ── Route map terpusat (ubah di sini kalau ada yang 404) ──────
const ROUTES = {
  studio:       '/dashboard/studio',
  tiktokScript: '/dashboard/studio/video/tiktok',
  ugcVideo:     '/dashboard/studio/video/ugc',
  enhancer:     '/dashboard/studio/image/enhancer',
  billing:      '/billing',           // cek: mungkin /dashboard/billing
  scheduler:    '/dashboard/scheduler',
  campaign:     '/dashboard/campaign-builder',
}
export default function RevenueAnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30)
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([])
  const [byTier, setByTier] = useState<TierBreakdown[]>([])
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success'|'error'; msg: string } | null>(null)

  useEffect(() => { fetchData() }, [period])

  async function fetchData() {
    setRefreshing(true)
    setError(null)
    try {
      const [revRes, growthRes] = await Promise.all([
        fetch(`/api/admin/revenue?days=${period}&view=both`, { credentials: 'include' }),
        fetch(`/api/admin/user-growth?days=${period}`, { credentials: 'include' }),
      ])
      
      const revData = await revRes.json()
      const growthData = await growthRes.json()
      
      if (revData.error) throw new Error(revData.error)
      
      setTimeseries(revData.timeseries ?? [])
      setByTier(revData.by_tier ?? [])
      setUserGrowth(growthData.data ?? growthData.timeseries ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Aggregates dari timeseries
  const totalRevenue = timeseries.reduce((sum, t) => sum + Number(t.revenue_idr ?? 0), 0)
  const totalTxn = timeseries.reduce((sum, t) => sum + Number(t.txn_count ?? 0), 0)
  const avgDailyRevenue = timeseries.length > 0 ? totalRevenue / timeseries.length : 0

  // Chart data prep
  const revenueChartData = timeseries.map(t => ({
    label: formatChartDate(t.date),
    value: Number(t.revenue_idr ?? 0),
  }))

  const userGrowthChartData = userGrowth.map(g => ({
    label: formatChartDate(g.date),
    value: Number(g.total_users ?? 0),
  }))

  const tierBarData = byTier.map((t, i) => ({
    label: t.tier.toUpperCase(),
    value: Number(t.revenue_idr ?? 0),
    color: tierColor(t.tier),
  }))

  const tierDonutData = byTier
    .filter(t => Number(t.revenue_idr) > 0)
    .map(t => ({
      label: t.tier.toUpperCase(),
      value: Number(t.revenue_idr ?? 0),
      color: tierColor(t.tier),
    }))

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="Revenue Analytics 📊"
        description={`Last ${period} days · Time-series trend, tier breakdown, user growth`}
        badge={{ label: 'PHASE 3 LIVE', color: D.green }}
        actions={
          <Button 
            variant="secondary" size="sm" icon={RefreshCw}
            loading={refreshing}
            onClick={fetchData}>
            Refresh
          </Button>
        }
      />

      {/* Period selector */}
      <Card>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: D.textDim, fontSize: 13 }}>
            <Calendar size={14}/>
            Period:
          </div>
          {([7, 30, 90] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: period === p ? `${D.purple}25` : D.bg700,
                color: period === p ? D.purple : D.textDim,
                border: `1px solid ${period === p ? D.purple : D.border}`,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
              {p === 7 ? '7 hari' : p === 30 ? '30 hari' : '90 hari'}
            </button>
          ))}
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Link href="/admin/executive" style={{
              fontSize: 12, color: D.textDim, textDecoration: 'none',
              padding: '6px 12px', borderRadius: 8,
              background: D.bg700, border: `1px solid ${D.border}`,
            }}>
              ← Executive Summary
            </Link>
          </div>
        </div>
      </Card>

      {loading && (
        <Card><EmptyState icon="⏳" title="Loading analytics..."/></Card>
      )}

      {error && (
        <Card>
          <div style={{ 
            padding: '14px 18px', background: `${D.red}15`, borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertCircle size={18} color={D.red}/>
            <div style={{ fontSize: 13, color: D.red }}>{error}</div>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Summary stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14, marginTop: 16, marginBottom: 24,
          }}>
            <StatBlock
              label="Total Revenue"
              value={fmtIDR(totalRevenue)}
              sub={`${period} hari terakhir`}
              color={D.green}
            />
            <StatBlock
              label="Total Transactions"
              value={totalTxn.toLocaleString('id-ID')}
              sub={`Avg ${(totalTxn / period).toFixed(1)}/hari`}
              color={D.blue}
            />
            <StatBlock
              label="Avg Daily Revenue"
              value={fmtIDR(avgDailyRevenue)}
              sub="Mean per hari"
              color={D.purple}
            />
            <StatBlock
              label="Avg Transaction Value"
              value={totalTxn > 0 ? fmtIDR(totalRevenue / totalTxn) : '—'}
              sub="Rev / Txn"
              color={D.amber}
            />
          </div>

          {/* Empty data warning */}
          {totalRevenue === 0 && (
            <Card>
              <div style={{
                padding: '16px 20px', borderRadius: 8,
                background: `${D.amber}10`, border: `1px solid ${D.amber}30`,
                display: 'flex', alignItems: 'flex-start', gap: 12,
                marginBottom: 24,
              }}>
                <AlertCircle size={20} color={D.amber} style={{ flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 4 }}>
                    Belum ada data revenue
                  </div>
                  <div style={{ fontSize: 12, color: D.textDim, lineHeight: 1.5 }}>
                    Table <code>payment_events</code> kosong. Charts akan tampil flat zero sampai ada transaksi.
                    User growth chart akan jalan kalau ada user terdaftar.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Revenue Timeseries */}
          <ChartCard title="Revenue Trend" subtitle={`Daily revenue · last ${period} days`}>
            {revenueChartData.length === 0 ? (
              <EmptyState icon="📊" title="Belum ada data untuk periode ini"/>
            ) : (
              <LineChart
                data={revenueChartData}
                color={CHART_COLORS.green}
                height={260}
                yLabel="IDR"
                yFormat={(v) => fmtIDRCompact(v)}
                showArea
              />
            )}
          </ChartCard>

          {/* Revenue by Tier — 2 column */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 14, marginBottom: 24,
          }}>
            <ChartCard title="Revenue by Tier" subtitle="Distribution per plan">
              {tierBarData.length === 0 ? (
                <EmptyState icon="📊" title="No data"/>
              ) : (
                <HorizontalBarChart 
                  data={tierBarData}
                  height={200}
                  valueFormat={(v) => fmtIDRCompact(v)}
                />
              )}
            </ChartCard>

            <ChartCard title="Revenue Share" subtitle="% per tier">
              {tierDonutData.length === 0 ? (
                <EmptyState icon="🥯" title="No revenue data"/>
              ) : (
                <DonutChart 
                  data={tierDonutData}
                  size={200}
                  centerLabel={fmtIDRCompact(totalRevenue)}
                  centerSub="Total"
                />
              )}
            </ChartCard>
          </div>

          {/* Tier breakdown table */}
          <ChartCard title="Tier Breakdown" subtitle="Detail per plan">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                  <th style={tableHeaderStyle}>TIER</th>
                  <th style={tableHeaderStyle}>REVENUE</th>
                  <th style={tableHeaderStyle}>TRANSACTIONS</th>
                  <th style={tableHeaderStyle}>ACTIVE SUBS</th>
                  <th style={tableHeaderStyle}>SHARE</th>
                </tr>
              </thead>
              <tbody>
                {byTier.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: D.textMute }}>
                      No tier data
                    </td>
                  </tr>
                ) : (
                  byTier.map(t => {
                    const share = totalRevenue > 0 
                      ? (Number(t.revenue_idr) / totalRevenue * 100).toFixed(1) 
                      : '0.0'
                    return (
                      <tr key={t.tier} style={{ borderBottom: `1px solid ${D.border}` }}>
                        <td style={tableCellStyle}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99,
                            background: `${tierColor(t.tier)}20`,
                            color: tierColor(t.tier),
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {t.tier.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, color: D.text, fontWeight: 700 }}>
                          {fmtIDR(Number(t.revenue_idr ?? 0))}
                        </td>
                        <td style={tableCellStyle}>
                          {Number(t.txn_count ?? 0).toLocaleString('id-ID')}
                        </td>
                        <td style={tableCellStyle}>
                          {Number(t.active_subs ?? 0).toLocaleString('id-ID')}
                        </td>
                        <td style={tableCellStyle}>
                          {share}%
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </ChartCard>

          {/* User Growth */}
          <ChartCard title="User Growth" subtitle={`Total users trend · last ${period} days`}>
            {userGrowthChartData.length === 0 ? (
              <EmptyState icon="👥" title="No user data"/>
            ) : (
              <LineChart 
                data={userGrowthChartData}
                color={CHART_COLORS.blue}
                height={220}
                yLabel="Users"
                showArea
              />
            )}
          </ChartCard>

          {/* Footer disclaimer */}
          <Card>
            <div style={{ fontSize: 11, color: D.textMute, lineHeight: 1.6 }}>
              <strong style={{ color: D.textDim }}>📌 Catatan akurasi data:</strong>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: 18 }}>
                <li>Revenue dihitung dari <code>payment_events</code> dengan event_type subscription/topup</li>
                <li>Active subs = <code>subscriptions.status = 'active'</code></li>
                <li>User growth = COUNT distinct user_id dari <code>auth.users</code> per hari</li>
                <li>Data di-cache 2 menit untuk performa</li>
                <li>Trend baru meaningful setelah accumulate 14+ hari data</li>
              </ul>
            </div>
          </Card>
        </>
      )}

      {toast && (
        <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)}/>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════
function StatBlock({ label, value, sub, color }: any) {
  return (
    <Card padding="14px 18px">
      <div style={{ 
        fontSize: 10, color: D.textMute, fontWeight: 700, 
        letterSpacing: '0.08em', marginBottom: 6,
      }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 800, color,
        marginBottom: 4, lineHeight: 1.1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: D.textDim }}>{sub}</div>
    </Card>
  )
}

function ChartCard({ title, subtitle, children }: any) {
  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{
          fontSize: 14, fontWeight: 800, color: D.text, margin: 0,
        }}>
          {title}
        </h3>
        {subtitle && (
          <div style={{ fontSize: 11, color: D.textMute, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </Card>
  )
}

const tableHeaderStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left',
  fontSize: 10, color: D.textMute, fontWeight: 700,
  letterSpacing: '0.06em',
}

const tableCellStyle: React.CSSProperties = {
  padding: '12px', fontSize: 12, color: D.textDim,
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function fmtIDR(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return 'Rp 0'
  return 'Rp ' + n.toLocaleString('id-ID')
}

function fmtIDRCompact(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return 'Rp 0'
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1000)          return `Rp ${(n / 1000).toFixed(0)}K`
  return `Rp ${n}`
}

function formatChartDate(iso: string): string {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  } catch {
    return iso
  }
}

function tierColor(tier: string): string {
  return ({
    starter:  D.textDim,
    basic:    D.amber,
    pro:      D.purple,
    business: D.blue,
  } as any)[tier] || D.textMute
}