'use client'
// app/admin/abuse/page.tsx
// ══════════════════════════════════════════════════════════════
// Abuse Detection — sinyal penyalahgunaan
// 
// • User suspended (user_credits.status)
// • Akun terkunci / failed login tinggi (users)
// • Multi-akun 1 IP (users.last_login_ip)
// • Konsumsi abnormal (total_used_this_month)
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155', border:'#334155',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', purple:'#A78BFA', blue:'#60A5FA',
}
const num = (n: number) => Math.round(n || 0).toLocaleString('id-ID')

interface U {
  id: string; email: string; name: string | null; last_login_ip: string | null
  login_count: number; failed_login_count: number; locked_until: string | null
  is_active: boolean; created_at: string
}
interface C {
  user_id: string; plan_tier: string | null; status: string | null
  current_balance: number; total_used_this_month: number
  suspended_at: string | null; suspension_reason: string | null
}

export default function AbusePage() {
  const [users, setUsers] = useState<U[]>([])
  const [credits, setCredits] = useState<C[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/abuse', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.details || d.error); else { setUsers(d.users ?? []); setCredits(d.credits ?? []) } })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const emailOf = useMemo(() => {
    const m = new Map(users.map(u => [u.id, u.email]))
    return (id: string) => m.get(id) || id.slice(0, 8)
  }, [users])

  // 1. Suspended / non-active (status != active & tidak null)
  const suspended = credits.filter(c => c.status && c.status !== 'active')

  // 2. Locked / failed login tinggi
  const now = Date.now()
  const locked = users.filter(u => (u.locked_until && new Date(u.locked_until).getTime() > now) || (u.failed_login_count ?? 0) >= 5)

  // 3. Multi-akun 1 IP
  const ipClusters = useMemo(() => {
    const m = new Map<string, U[]>()
    for (const u of users) {
      if (!u.last_login_ip) continue
      ;(m.get(u.last_login_ip) ?? m.set(u.last_login_ip, []).get(u.last_login_ip)!).push(u)
    }
    return Array.from(m.entries())
      .filter(([, list]) => list.length > 1)
      .map(([ip, list]) => ({ ip, count: list.length, users: list }))
      .sort((a, b) => b.count - a.count)
  }, [users])

  // 4. Heavy consumers
  const heavy = [...credits]
    .filter(c => (c.total_used_this_month ?? 0) > 0)
    .sort((a, b) => (b.total_used_this_month ?? 0) - (a.total_used_this_month ?? 0))
    .slice(0, 10)

  const riskScore = suspended.length * 3 + locked.length * 2 + ipClusters.length

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: D.text }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          🛡️ Abuse Detection
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: D.green + '20', color: D.green }}>PHASE 5 LIVE</span>
        </h1>
        <p style={{ fontSize: 12, color: D.textMute, marginTop: 2 }}>Deteksi penyalahgunaan — suspend, akun terkunci, multi-akun, konsumsi abnormal.</p>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#7F1D1D40', border: '1px solid #B91C1C', color: '#FCA5A5', fontSize: 13, marginBottom: 14 }}>ⓘ {error}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute }}>Memindai sinyal abuse...</div>
      ) : (
        <>
          {/* Risk KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 18 }}>
            <Kpi label="RISK SCORE" value={`${riskScore}`} sub={riskScore === 0 ? 'aman' : riskScore < 5 ? 'rendah' : 'perlu cek'} color={riskScore === 0 ? D.green : riskScore < 5 ? D.amber : D.red} />
            <Kpi label="USER SUSPENDED" value={`${suspended.length}`} sub="status non-aktif" color={suspended.length ? D.red : D.green} />
            <Kpi label="AKUN TERKUNCI" value={`${locked.length}`} sub="locked / gagal login ≥5" color={locked.length ? D.amber : D.green} />
            <Kpi label="IP MULTI-AKUN" value={`${ipClusters.length}`} sub="IP dipakai >1 akun" color={ipClusters.length ? D.amber : D.green} />
          </div>

          {/* Suspended */}
          <Card title="🚫 User Suspended / Non-Aktif" count={suspended.length}>
            {suspended.length ? (
              <Table head={['User', 'Tier', 'Status', 'Alasan', 'Sejak']}>
                {suspended.map(c => (
                  <Row key={c.user_id} cells={[
                    emailOf(c.user_id),
                    c.plan_tier || '—',
                    <Badge color={D.red}>{c.status}</Badge>,
                    c.suspension_reason || '—',
                    c.suspended_at ? new Date(c.suspended_at).toLocaleDateString('id-ID') : '—',
                  ]} />
                ))}
              </Table>
            ) : <Empty text="Tidak ada user suspended. 👍" />}
          </Card>

          {/* Locked */}
          <Card title="🔒 Akun Terkunci / Gagal Login Tinggi" count={locked.length}>
            {locked.length ? (
              <Table head={['User', 'Gagal Login', 'Locked Until', 'Status']}>
                {locked.map(u => (
                  <Row key={u.id} cells={[
                    u.email,
                    <span style={{ color: (u.failed_login_count ?? 0) >= 5 ? D.red : D.text }}>{u.failed_login_count ?? 0}×</span>,
                    u.locked_until && new Date(u.locked_until).getTime() > now ? new Date(u.locked_until).toLocaleString('id-ID') : '—',
                    u.is_active ? <Badge color={D.green}>aktif</Badge> : <Badge color={D.textMute}>nonaktif</Badge>,
                  ]} />
                ))}
              </Table>
            ) : <Empty text="Tidak ada akun bermasalah login. 👍" />}
          </Card>

          {/* IP clusters */}
          <Card title="🌐 Multi-Akun per IP" count={ipClusters.length} subtitle="Indikasi akun ganda / abuse trial gratis">
            {ipClusters.length ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {ipClusters.map(c => (
                  <div key={c.ip} style={{ padding: '10px 14px', borderRadius: 9, background: D.bg900, border: `1px solid ${c.count >= 3 ? D.red + '60' : D.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{c.ip}</span>
                      <Badge color={c.count >= 3 ? D.red : D.amber}>{c.count} akun</Badge>
                    </div>
                    <div style={{ fontSize: 11, color: D.textDim }}>{c.users.map(u => u.email).join(', ')}</div>
                  </div>
                ))}
              </div>
            ) : <Empty text="Tidak ada IP dengan banyak akun. 👍" />}
          </Card>

          {/* Heavy consumers */}
          <Card title="🔥 Konsumsi Tertinggi Bulan Ini" count={heavy.length} subtitle="Pantau pemakaian abnormal">
            {heavy.length ? (
              <Table head={['User', 'Tier', 'Terpakai Bulan Ini', 'Saldo']}>
                {heavy.map(c => (
                  <Row key={c.user_id} cells={[
                    emailOf(c.user_id),
                    c.plan_tier || '—',
                    <b style={{ color: D.amber }}>{num(c.total_used_this_month)} kredit</b>,
                    num(c.current_balance),
                  ]} />
                ))}
              </Table>
            ) : <Empty text="Belum ada konsumsi tercatat bulan ini." />}
          </Card>

          <div style={{ fontSize: 11, color: D.textMute, marginTop: 6 }}>
            💡 Untuk suspend/unsuspend user, gunakan halaman <b>User Management</b>. Halaman ini fokus deteksi & monitoring.
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
function Card({ title, count, subtitle, children }: { title: string; count?: number; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 14, background: D.bg800, border: `1px solid ${D.border}`, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}{count !== undefined && <span style={{ fontSize: 12, color: D.textMute, fontWeight: 500 }}> · {count}</span>}</div>
        {subtitle && <div style={{ fontSize: 11, color: D.textMute }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{head.map((h, i) => <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: D.textMute, textAlign: i === 0 ? 'left' : 'right', letterSpacing: '0.04em' }}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
function Row({ cells }: { cells: React.ReactNode[] }) {
  return (
    <tr>{cells.map((c, i) => <td key={i} style={{ padding: 10, fontSize: 12, textAlign: i === 0 ? 'left' : 'right', borderTop: `1px solid ${D.border}`, fontWeight: i === 0 ? 600 : 400 }}>{c}</td>)}</tr>
  )
}
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ background: color + '22', color, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>{children}</span>
}
function Empty({ text }: { text: string }) {
  return <div style={{ padding: 20, textAlign: 'center', color: D.textMute, fontSize: 12 }}>{text}</div>
}