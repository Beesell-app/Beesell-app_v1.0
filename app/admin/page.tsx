// app/admin/page.tsx
// ══════════════════════════════════════════════════════════════
// Admin Home — Owner Control Center (Phase 1-6 LIVE)
// Semua halaman admin jadi kartu yang bisa diklik.
// ══════════════════════════════════════════════════════════════

import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  TrendingUp, AlertTriangle, Activity, DollarSign,
  Users, Shield, Crown, ArrowRight,
} from 'lucide-react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155',
  border:'#334155', text:'#F1F5F9',
  textDim:'#94A3B8', textMute:'#64748B',
  purple:'#A78BFA', pink:'#F472B6',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', blue:'#60A5FA',
}

// ══════════════════════════════════════════════════════════════
// DATA FETCH (server component, defensive)
// ══════════════════════════════════════════════════════════════
async function getStats() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {}, remove: () => {},
      },
    }
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [guardrailRes, todayCostsRes, totalUsersRes, killedRes, executiveRes] = await Promise.all([
    supabase.rpc('check_cost_guardrail', { p_scope: 'global', p_target: 'all' })
      .then(r => r, () => ({ data: null, error: 'rpc_not_found' })),

    supabase.from('api_cost_log')
      .select('cost_idr, provider, tool_id')
      .gte('created_at', today.toISOString())
      .eq('status', 'success')
      .then(r => r, () => ({ data: null, error: 'table_not_found' })),

    supabase.from('user_credits').select('*', { count: 'exact', head: true })
      .then(r => r, () => ({ count: 0, error: null })),

    supabase.from('kill_switches').select('*', { count: 'exact', head: true }).eq('is_killed', true)
      .then(r => r, () => ({ count: 0, error: null })),

    supabase.rpc('admin_get_executive_summary')
      .then(r => r, () => ({ data: null, error: 'rpc_not_found' })),
  ])

  const totalCostToday = ((todayCostsRes as any).data ?? []).reduce(
    (sum: number, r: any) => sum + Number(r.cost_idr || 0), 0
  )
  const callsToday = ((todayCostsRes as any).data ?? []).length

  return {
    guardrail: (guardrailRes as any).data,
    totalCostToday,
    callsToday,
    totalUsers: (totalUsersRes as any).count ?? 0,
    killedCount: (killedRes as any).count ?? 0,
    executive: (executiveRes as any).data,
  }
}

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════
export default async function AdminHomePage() {
  const stats = await getStats()

  const fmtIDR = (n: number) => {
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
    if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}K`
    return `Rp ${n.toLocaleString('id-ID')}`
  }

  const dailyGuardrail = stats.guardrail?.daily
  const pctUsed = dailyGuardrail?.pct_used ?? 0
  const alertLevel: 'ok' | 'warning' | 'danger' = pctUsed >= 100 ? 'danger' : pctUsed >= 80 ? 'warning' : 'ok'
  const exec = stats.executive

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: D.text, letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
          Owner Control Center 👑
        </h1>
        <p style={{ fontSize: 13, color: D.textDim, margin: 0 }}>
          Pengendalian penuh BeeSell AI · Phase 1-6 LIVE 🎉
        </p>
      </div>

      {/* Top alert */}
      {alertLevel !== 'ok' && (
        <AlertBanner
          level={alertLevel}
          message={
            alertLevel === 'danger'
              ? `BUDGET HARI INI TERCAPAI ${pctUsed.toFixed(1)}% — Sistem auto-throttled`
              : `Peringatan: Budget hari ini sudah ${pctUsed.toFixed(1)}% terpakai`
          }
        />
      )}

      {/* Executive Summary Widget */}
      {exec && <ExecutiveWidget data={exec} />}

      {/* Quick Stats */}
      <SectionTitle>📊 Quick Stats</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard icon={DollarSign} label="COGS Hari Ini" value={fmtIDR(stats.totalCostToday)} sub={`${stats.callsToday} API calls`} color={D.amber} trend={pctUsed > 80 ? 'up' : 'flat'} />
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers.toLocaleString('id-ID')} sub="terdaftar" color={D.blue} />
        <StatCard icon={Activity} label="Budget Daily" value={`${pctUsed.toFixed(1)}%`} sub={`dari ${fmtIDR(dailyGuardrail?.cap_idr ?? 500000)}`} color={alertLevel === 'danger' ? D.red : alertLevel === 'warning' ? D.amber : D.green} />
        <StatCard icon={Shield} label="Kill Switches Active" value={stats.killedCount.toString()} sub={stats.killedCount > 0 ? '⚠️ Ada fitur dimatikan' : 'Semua sistem normal'} color={stats.killedCount > 0 ? D.red : D.green} />
      </div>

      {/* Status System — semua halaman, clickable */}
      <SectionTitle>✅ Status System — Semua Modul LIVE</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatusCard icon="🔐" title="Superuser Auth + Bypass" description="Login superuser, bypass semua limit/credit untuk testing" status="live" />
        <StatusCard icon="🚦" title="Feature Flag Management" description="On/off tools per tier real-time tanpa redeploy" status="live" href="/admin/feature-flags" />
        <StatusCard icon="💰" title="Pricing Editor" description="Edit plans, daily limits, credit costs via UI" status="live" href="/admin/pricing" />
        <StatusCard icon="⚡" title="Add-on Editor" description="Edit harga & status add-on" status="live" href="/admin/addons" />
        <StatusCard icon="👥" title="User Management" description="Search, suspend, adjust credit, change tier" status="live" href="/admin/users" />
        <StatusCard icon="📊" title="Executive Dashboard" description="Single-page KPI: revenue, MRR, profit, churn" status="live" href="/admin/executive" />
        <StatusCard icon="📈" title="Revenue Analytics" description="Time-series chart, tier breakdown, user growth" status="live" href="/admin/revenue" />
        <StatusCard icon="📉" title="COGS Monitoring" description="Unit economics per tool — margin & deteksi tool boncos" status="live" href="/admin/cogs" />
        <StatusCard icon="💎" title="Credit Economy" description="Liability, issued vs consumed, tool boros kredit" status="live" href="/admin/credits" />
        <StatusCard icon="🩺" title="System Health" description="Status service, koneksi DB, performa AI" status="live" href="/admin/health" />
        <StatusCard icon="🛡️" title="Abuse Detection" description="Suspend, akun terkunci, multi-akun, konsumsi abnormal" status="live" href="/admin/abuse" />
        <StatusCard icon="🛡️" title="Cost Guardrails" description="Batas biaya AI, spend aktual vs limit" status="live" href="/admin/cost-guardrail" />
        <StatusCard icon="💀" title="Kill Switch" description="Matikan provider/global secara darurat" status="live" href="/admin/kill-switch" />
        <StatusCard icon="📜" title="Audit Log" description="Riwayat semua aksi admin" status="live" href="/admin/audit-log" />
      </div>

      {/* Quick Actions */}
      <SectionTitle>⚡ Quick Actions</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 32 }}>
        <ActionCard icon="👑" title="Executive Summary" description="Lihat semua KPI bisnis dalam satu halaman" href="/admin/executive" ctaText="Buka Dashboard" highlight />
        <ActionCard icon="📉" title="COGS Monitoring" description="Cek margin per tool & tool yang boncos" href="/admin/cogs" ctaText="Lihat COGS" />
        <ActionCard icon="🚦" title="Feature Flags" description="On/off tools dan set ketersediaan per tier" href="/admin/feature-flags" ctaText="Manage Flags" />
        <ActionCard icon="💰" title="Pricing & Limits" description="Edit harga plan, daily limit, credit cost" href="/admin/pricing" ctaText="Edit Pricing" />
        <ActionCard icon="👥" title="User Management" description="Suspend, grant credit, change tier" href="/admin/users" ctaText="Manage Users" />
        <ActionCard icon="🧪" title="Test as Superuser" description="Akses semua tools tanpa limit/credit untuk testing" href="/studio" ctaText="Buka Studio" />
      </div>

      {/* SQL Examples */}
      <SectionTitle>💻 SQL Examples — Manual Operations</SectionTitle>
      <SQLExamples />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EXECUTIVE WIDGET
// ══════════════════════════════════════════════════════════════
function ExecutiveWidget({ data }: { data: any }) {
  const fmtIDR = (n: number) => {
    if (!n) return 'Rp 0'
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
    if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}K`
    return `Rp ${n.toLocaleString('id-ID')}`
  }

  return (
    <div style={{ padding: 20, borderRadius: 14, background: `linear-gradient(135deg, ${D.purple}15, ${D.pink}10)`, border: `1px solid ${D.purple}30`, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${D.purple}, ${D.pink})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: D.purple, fontWeight: 800, letterSpacing: '0.06em' }}>EXECUTIVE SUMMARY</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: D.text }}>Business Overview</div>
          </div>
        </div>
        <Link href="/admin/executive" style={{ padding: '8px 14px', borderRadius: 8, background: D.purple, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Full Dashboard <ArrowRight size={12} />
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <MiniStat label="MRR" value={fmtIDR(data.revenue?.mrr ?? 0)} color={D.purple} />
        <MiniStat label="Revenue (Month)" value={fmtIDR(data.revenue?.month ?? 0)} growth={data.revenue?.growth_mom_pct} color={D.green} />
        <MiniStat label="Paid Users" value={(data.users?.paid ?? 0).toLocaleString('id-ID')} sub={`${data.users?.paid_conversion_pct ?? 0}% conv.`} color={D.blue} />
        <MiniStat label="Gross Margin" value={data.profit?.gross_margin_pct !== null && data.profit?.gross_margin_pct !== undefined ? `${data.profit?.gross_margin_pct}%` : '—'} color={(data.profit?.gross_margin_pct ?? 0) >= 30 ? D.green : D.amber} />
        <MiniStat label="Churn (30d)" value={`${data.subscriptions?.churn_rate_30d ?? 0}%`} color={(data.subscriptions?.churn_rate_30d ?? 0) < 5 ? D.green : D.red} />
      </div>
    </div>
  )
}

function MiniStat({ label, value, growth, sub, color }: any) {
  const showGrowth = growth !== null && growth !== undefined
  return (
    <div>
      <div style={{ fontSize: 9, color: D.textMute, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color }}>{value}</span>
        {showGrowth && (
          <span style={{ fontSize: 10, fontWeight: 700, color: growth > 0 ? D.green : growth < 0 ? D.red : D.textDim }}>
            {growth > 0 ? '↑' : growth < 0 ? '↓' : '→'}{Math.abs(growth)}%
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 10, color: D.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════
function AlertBanner({ level, message }: { level: 'warning' | 'danger'; message: string }) {
  const color = level === 'danger' ? D.red : D.amber
  return (
    <div style={{ padding: '14px 18px', borderRadius: 12, background: `${color}15`, border: `1px solid ${color}30`, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
      <AlertTriangle size={20} color={color} />
      <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{message}</div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, trend }: any) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, background: D.bg800, border: `1px solid ${D.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} />
        </div>
        {trend === 'up' && <TrendingUp size={14} color={D.red} />}
      </div>
      <div style={{ fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: D.text, marginBottom: 2, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: D.textDim }}>{sub}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 14, fontWeight: 800, color: D.text, marginBottom: 12, marginTop: 0, letterSpacing: '-0.01em' }}>
      {children}
    </h2>
  )
}

function StatusCard({ icon, title, description, status, partialNote, href }: any) {
  const statusColor = status === 'live' ? D.green : D.amber
  const statusLabel = status === 'live' ? 'LIVE' : 'PARTIAL'

  const inner = (
    <div style={{ padding: '16px 18px', borderRadius: 12, background: D.bg800, border: `1px solid ${D.border}`, height: '100%', transition: 'border-color .15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 24 }}>{icon}</div>
        <span style={{ fontSize: 9, fontWeight: 800, color: statusColor, background: `${statusColor}15`, padding: '3px 8px', borderRadius: 99, letterSpacing: '0.06em' }}>
          {statusLabel}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: D.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: D.textDim, lineHeight: 1.5 }}>{description}</div>
      {partialNote && (
        <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: `${D.amber}10`, fontSize: 11, color: D.amber }}>
          ⚠ {partialNote}
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
  }
  return inner
}

function ActionCard({ icon, title, description, href, ctaText, highlight }: any) {
  return (
    <Link href={href} style={{ display: 'block', padding: '16px 18px', borderRadius: 12, background: highlight ? `${D.purple}10` : D.bg800, border: `1px solid ${highlight ? D.purple : D.border}`, textDecoration: 'none' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: D.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: D.textDim, lineHeight: 1.5, marginBottom: 12 }}>{description}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: D.purple }}>
        {ctaText} <ArrowRight size={12} />
      </div>
    </Link>
  )
}

function SQLExamples() {
  const examples = [
    {
      title: 'Kill Switch — disable provider (manual)',
      code: `UPDATE kill_switches
SET is_killed = true,
    reason = 'Cost spike investigation',
    killed_at = now()
WHERE scope = 'provider' AND target = 'replicate';`,
    },
    {
      title: 'Cek COGS hari ini per provider',
      code: `SELECT ai_provider,
       SUM(cost_usd) as total_usd,
       SUM(request_count) as calls
FROM ai_usage_daily
WHERE stat_date = current_date
GROUP BY ai_provider
ORDER BY total_usd DESC;`,
    },
    {
      title: 'Cek user dengan konsumsi kredit tertinggi',
      code: `SELECT u.email,
       uc.total_used_this_month,
       uc.current_balance
FROM user_credits uc
JOIN users u ON u.id = uc.user_id
ORDER BY uc.total_used_this_month DESC
LIMIT 10;`,
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {examples.map((ex, i) => (
        <div key={i} style={{ padding: '14px 18px', borderRadius: 10, background: D.bg800, border: `1px solid ${D.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: D.purple, marginBottom: 8 }}>{ex.title}</div>
          <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 6, background: D.bg900, color: D.text, fontSize: 11, lineHeight: 1.5, fontFamily: '"Fira Code", "SF Mono", Monaco, monospace', overflow: 'auto' }}>
            <code>{ex.code}</code>
          </pre>
        </div>
      ))}
    </div>
  )
}