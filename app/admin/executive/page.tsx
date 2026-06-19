'use client'
// app/admin/executive/page.tsx
// ══════════════════════════════════════════════════════════════
// Executive Dashboard — single-page KPI summary untuk Owner
// 
// Data source: GET /api/admin/executive (cached 60s)
// Empty state handling: kalau payment_events kosong, tampil onboarding
// ══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { 
  RefreshCw, TrendingUp, TrendingDown, DollarSign, Users, 
  CreditCard, Activity, AlertCircle, Crown, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import {
  PageHeader, Card, Button, Badge, Toast, EmptyState, D,
} from '@/components/admin/shared/ui'
import { Sparkline, LineChart, CHART_COLORS } from '@/components/admin/charts'

interface ExecutiveData {
  revenue: {
    today:        number
    month:        number
    last_month:   number
    year:         number
    mrr:          number
    arr:          number
    growth_mom_pct: number | null
  }
  cogs: {
    today: number
    month: number
  }
  profit: {
    today:           number
    month:           number
    gross_margin_pct: number | null
  }
  users: {
    total:        number
    paid:         number
    active_30d:   number
    new_30d:      number
    paid_conversion_pct: number
  }
  subscriptions: {
    active:         number
    cancelled_30d:  number
    churn_rate_30d: number
  }
  meta: {
    computed_at:      string
    has_payment_data: boolean
  }
}

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<ExecutiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sparkData, setSparkData] = useState<number[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setRefreshing(true)
    setError(null)
    try {
      const [executiveRes, revenueRes] = await Promise.all([
        fetch('/api/admin/executive', { credentials: 'include' }),
        fetch('/api/admin/revenue?days=30&view=timeseries', { credentials: 'include' }),
      ])
      
      const executiveData = await executiveRes.json()
      const revenueData = await revenueRes.json()
      
      if (executiveData.error) throw new Error(executiveData.error)
      setData(executiveData)
      
      // Build sparkline data dari timeseries (revenue 30 hari)
      const sparkPoints = (revenueData.timeseries ?? []).map((d: any) => Number(d.revenue_idr ?? 0))
      setSparkData(sparkPoints)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="Executive Summary 👑"
        description={
          data?.meta?.computed_at 
            ? `Last updated: ${formatTime(data.meta.computed_at)}`
            : 'Real-time business overview untuk Owner'
        }
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

      {loading && (
        <Card><EmptyState icon="⏳" title="Loading executive data..."/></Card>
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

      {!loading && data && (
        <>
          {/* Onboarding banner kalau belum ada payment data */}
          {!data.meta.has_payment_data && (
            <OnboardingBanner/>
          )}

          {/* Section 1: Revenue */}
          <SectionTitle 
            icon="💰" 
            title="Revenue"
            link={{ label: 'Lihat Analytics Lengkap', href: '/admin/revenue' }}
          />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14, marginBottom: 24,
          }}>
            <KPICard
              icon={DollarSign} color={D.green}
              label="Revenue Today"
              value={fmtIDR(data.revenue.today)}
            />
            <KPICard
              icon={DollarSign} color={D.green}
              label="Revenue This Month"
              value={fmtIDR(data.revenue.month)}
              growth={data.revenue.growth_mom_pct}
              growthLabel="vs last month"
            />
            <KPICard
              icon={TrendingUp} color={D.purple}
              label="MRR (Monthly Recurring)"
              value={fmtIDR(data.revenue.mrr)}
              sub={`${data.subscriptions.active} active subs`}
            />
            <KPICard
              icon={TrendingUp} color={D.blue}
              label="ARR (Projected)"
              value={fmtIDR(data.revenue.arr)}
              sub="MRR × 12"
            />
          </div>

          {/* Revenue trend sparkline (kalau ada data) */}
          {sparkData.length > 0 && sparkData.some(d => d > 0) && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: D.textMute, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
                    REVENUE TREND
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: D.text, margin: 0 }}>
                    Last 30 days
                  </h3>
                </div>
                <Link href="/admin/revenue" style={{
                  fontSize: 12, color: D.purple, fontWeight: 700,
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  Detail <ArrowRight size={12}/>
                </Link>
              </div>
              <Sparkline 
                values={sparkData} 
                color={CHART_COLORS.success} 
                height={80}
              />
            </Card>
          )}

          {/* Section 2: Profit & COGS */}
          <SectionTitle icon="📈" title="Profit & COGS"/>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14, marginBottom: 24,
          }}>
            <KPICard
              icon={TrendingUp} 
              color={data.profit.month > 0 ? D.green : D.red}
              label="Profit This Month"
              value={fmtIDR(data.profit.month)}
              sub={data.profit.month > 0 ? '✓ Profitable' : '⚠ Loss'}
            />
            <KPICard
              icon={Activity}
              color={data.profit.gross_margin_pct && data.profit.gross_margin_pct >= 30 ? D.green : data.profit.gross_margin_pct && data.profit.gross_margin_pct >= 0 ? D.amber : D.red}
              label="Gross Margin"
              value={data.profit.gross_margin_pct !== null ? `${data.profit.gross_margin_pct}%` : '—'}
              sub={marginLabel(data.profit.gross_margin_pct)}
            />
            <KPICard
              icon={CreditCard} color={D.amber}
              label="COGS Today"
              value={fmtIDR(data.cogs.today)}
              sub={`Bulan ini: ${fmtIDR(data.cogs.month)}`}
            />
            <KPICard
              icon={DollarSign} color={D.amber}
              label="COGS This Month"
              value={fmtIDR(data.cogs.month)}
              sub={revenueRatio(data.cogs.month, data.revenue.month)}
            />
          </div>

          {/* Section 3: Users */}
          <SectionTitle 
            icon="👥" 
            title="Users"
            link={{ label: 'Manage Users', href: '/admin/users' }}
          />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14, marginBottom: 24,
          }}>
            <KPICard
              icon={Users} color={D.blue}
              label="Total Users"
              value={data.users.total.toLocaleString('id-ID')}
              sub={`${data.users.new_30d} new (30d)`}
            />
            <KPICard
              icon={Crown} color={D.purple}
              label="Paid Users"
              value={data.users.paid.toLocaleString('id-ID')}
              sub={`${data.users.paid_conversion_pct}% conversion`}
            />
            <KPICard
              icon={Activity} color={D.green}
              label="Active Users (30d)"
              value={data.users.active_30d.toLocaleString('id-ID')}
              sub={activityRatio(data.users.active_30d, data.users.total)}
            />
            <KPICard
              icon={TrendingDown}
              color={data.subscriptions.churn_rate_30d < 5 ? D.green : data.subscriptions.churn_rate_30d < 10 ? D.amber : D.red}
              label="Churn Rate (30d)"
              value={`${data.subscriptions.churn_rate_30d}%`}
              sub={`${data.subscriptions.cancelled_30d} cancelled`}
            />
          </div>

          {/* Section 4: Quick Actions */}
          <SectionTitle icon="⚡" title="Quick Actions"/>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12, marginBottom: 24,
          }}>
            <QuickAction
              href="/admin/revenue"
              icon="📊"
              label="Revenue Analytics"
              desc="Time-series chart + tier breakdown"
            />
            <QuickAction
              href="/admin/users"
              icon="👥"
              label="User Management"
              desc="Suspend, adjust credit, change tier"
            />
            <QuickAction
              href="/admin/pricing"
              icon="💰"
              label="Pricing Editor"
              desc="Edit plans, limits, credit costs"
            />
            <QuickAction
              href="/admin/feature-flags"
              icon="🚦"
              label="Feature Flags"
              desc="On/off tools real-time"
            />
          </div>

          {/* Disclaimer */}
          <Card>
            <div style={{ fontSize: 11, color: D.textMute, lineHeight: 1.6 }}>
              <strong style={{ color: D.textDim }}>📌 Catatan akurasi data:</strong>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: 18 }}>
                <li>MRR/ARR baru meaningful setelah ada subscription aktif di table <code>subscriptions</code></li>
                <li>Churn rate 0% kalau belum ada cancellation</li>
                <li>COGS = sum dari <code>api_cost_log</code> (auto-populated saat API routes call <code>log_api_cost()</code>)</li>
                <li>Revenue = sum dari <code>payment_events</code> dengan <code>event_type</code> subscription/topup</li>
                <li>Data di-cache 60 detik untuk performa</li>
              </ul>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

function SectionTitle({ icon, title, link }: { 
  icon: string; title: string
  link?: { label: string; href: string }
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 32, marginBottom: 14,
    }}>
      <h2 style={{ 
        fontSize: 16, fontWeight: 800, color: D.text, margin: 0,
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {title}
      </h2>
      {link && (
        <Link href={link.href} style={{
          fontSize: 12, color: D.purple, fontWeight: 700,
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {link.label} <ArrowRight size={12}/>
        </Link>
      )}
    </div>
  )
}

function KPICard({ icon: Icon, color, label, value, sub, growth, growthLabel }: any) {
  const showGrowth = growth !== null && growth !== undefined
  const growthColor = showGrowth && growth > 0 ? D.green : showGrowth && growth < 0 ? D.red : D.textDim
  
  return (
    <div style={{
      padding: '16px 18px', borderRadius: 12,
      background: D.bg800, border: `1px solid ${D.border}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16}/>
        </div>
        {showGrowth && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: growthColor,
            background: `${growthColor}15`, padding: '2px 8px', borderRadius: 99,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            {growth > 0 ? '↑' : growth < 0 ? '↓' : '→'} {Math.abs(growth)}%
          </span>
        )}
      </div>
      <div style={{
        fontSize: 10, color: D.textMute, fontWeight: 700,
        letterSpacing: '0.08em', marginBottom: 4,
      }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 800, color: D.text,
        lineHeight: 1.2, marginBottom: 4,
        wordBreak: 'break-word',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: D.textDim }}>{sub}</div>
      )}
      {showGrowth && growthLabel && !sub && (
        <div style={{ fontSize: 11, color: D.textDim }}>{growthLabel}</div>
      )}
    </div>
  )
}

function QuickAction({ href, icon, label, desc }: any) {
  return (
    <Link href={href} style={{
      display: 'block', padding: '14px 16px', borderRadius: 10,
      background: D.bg800, border: `1px solid ${D.border}`,
      textDecoration: 'none',
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: D.textDim }}>{desc}</div>
    </Link>
  )
}

function OnboardingBanner() {
  return (
    <div style={{
      padding: '16px 20px', borderRadius: 12,
      background: `${D.amber}10`, border: `1px solid ${D.amber}40`,
      marginBottom: 24,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <AlertCircle size={20} color={D.amber} style={{ marginTop: 2, flexShrink: 0 }}/>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: D.text, marginBottom: 4 }}>
          Belum ada data payment
        </div>
        <div style={{ fontSize: 12, color: D.textDim, lineHeight: 1.5, marginBottom: 8 }}>
          Revenue dashboard akan jadi meaningful setelah ada transaksi pertama. 
          Untuk sekarang, MRR/ARR = 0 dan growth = N/A.
        </div>
        <div style={{ fontSize: 11, color: D.textMute }}>
          Setup: integrasikan Midtrans webhook → INSERT ke <code>payment_events</code> + <code>subscriptions</code>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function fmtIDR(n: number): string {
  if (n === null || n === undefined) return 'Rp 0'
  
  // Compact format untuk angka besar
  if (n >= 1_000_000_000) {
    return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  }
  if (n >= 1_000_000) {
    return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  }
  if (n >= 100_000) {
    return `Rp ${(n / 1000).toFixed(0)}K`
  }
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatTime(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }) + ' WIB'
  } catch {
    return iso
  }
}

function marginLabel(pct: number | null): string {
  if (pct === null) return 'Belum ada revenue'
  if (pct >= 50) return '🟢 Excellent'
  if (pct >= 30) return '🟢 Healthy'
  if (pct >= 10) return '🟡 OK'
  if (pct >= 0)  return '🟠 Thin'
  return '🔴 Losing money'
}

function revenueRatio(cogs: number, revenue: number): string {
  if (revenue === 0) return 'No revenue yet'
  const pct = (cogs / revenue * 100).toFixed(1)
  return `${pct}% dari revenue`
}

function activityRatio(active: number, total: number): string {
  if (total === 0) return 'No users yet'
  const pct = (active / total * 100).toFixed(1)
  return `${pct}% dari total`
}