'use client'
// app/admin/health/page.tsx
// ══════════════════════════════════════════════════════════════
// System Health — status service, vitals DB, performa AI
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155', border:'#334155',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', purple:'#A78BFA', blue:'#60A5FA',
}
const num = (n: number | null) => n === null ? '—' : Math.round(n).toLocaleString('id-ID')

export default function HealthPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/health', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.details || d.error); else setData(d) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const dbLatency = data?.db?.latency_ms ?? 0
  const dbHealthy = dbLatency < 800
  const configByGroup: Record<string, any[]> = {}
  for (const c of data?.config ?? []) {
    (configByGroup[c.group] ??= []).push(c)
  }
  const missingCount = (data?.config ?? []).filter((c: any) => !c.set).length

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: D.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            🩺 System Health
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: D.green + '20', color: D.green }}>PHASE 5 LIVE</span>
          </h1>
          <p style={{ fontSize: 12, color: D.textMute, marginTop: 2 }}>Status service, koneksi DB, dan performa pemakaian AI.</p>
        </div>
        <button onClick={load} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${D.border}`, background: D.bg800, color: D.textDim, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Refresh</button>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#7F1D1D40', border: '1px solid #B91C1C', color: '#FCA5A5', fontSize: 13, marginBottom: 14 }}>ⓘ {error}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute }}>Memeriksa sistem...</div>
      ) : (
        <>
          {/* Vitals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 18 }}>
            <Vital label="DATABASE" value={dbHealthy ? 'Sehat' : 'Lambat'} sub={`${dbLatency}ms response`} color={dbHealthy ? D.green : D.amber} dot />
            <Vital label="SERVICE CONFIG" value={missingCount === 0 ? 'Lengkap' : `${missingCount} kurang`} sub={`${(data?.config?.length ?? 0) - missingCount}/${data?.config?.length ?? 0} ter-set`} color={missingCount === 0 ? D.green : D.red} dot />
            <Vital label="REQUEST (30 HR)" value={num(data?.usage?.total_requests)} sub="total request AI" color={D.blue} />
            <Vital label="CACHE HIT RATE" value={data?.usage?.cache_rate !== null ? `${data?.usage?.cache_rate?.toFixed(0)}%` : '—'} sub="hemat biaya AI" color={D.purple} />
          </div>

          {/* Config status */}
          <Card title="🔌 Status Konfigurasi Service">
            {Object.entries(configByGroup).map(([group, items]) => (
              <div key={group} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: D.textMute, marginBottom: 6, letterSpacing: '0.05em' }}>{group.toUpperCase()}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
                  {items.map(c => (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: D.bg900, border: `1px solid ${c.set ? D.border : D.red + '60'}` }}>
                      <span style={{ fontSize: 12, color: D.textDim }}>{c.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: c.set ? D.green : D.red }}>{c.set ? '● SET' : '○ MISSING'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: D.textMute, marginTop: 4 }}>* "MISSING" mungkin karena nama env kamu beda. Edit daftar di <code style={{ color: D.textDim }}>api/admin/health/route.ts</code> (ENV_CHECKS).</div>
          </Card>

          {/* DB row counts */}
          <Card title="🗄️ Vitals Database">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
              {Object.entries(data?.db?.counts ?? {}).map(([tbl, cnt]) => (
                <div key={tbl} style={{ padding: '10px 12px', borderRadius: 9, background: D.bg900, border: `1px solid ${D.border}` }}>
                  <div style={{ fontSize: 11, color: D.textMute }}>{tbl}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: cnt === null ? D.red : D.text, marginTop: 2 }}>{cnt === null ? 'N/A' : num(cnt as number)}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Provider performance */}
          <Card title="⚡ Performa per Provider AI (30 hari)">
            {data?.usage?.has_data ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Provider', 'Requests', 'Cache Hits', 'Avg Latency', 'Cost (USD)'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: D.textMute, textAlign: i === 0 ? 'left' : 'right', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {data.usage.providers.map((p: any) => (
                      <tr key={p.provider}>
                        <td style={{ padding: 10, fontSize: 12, fontWeight: 600, borderTop: `1px solid ${D.border}` }}>{p.provider}</td>
                        <td style={{ padding: 10, fontSize: 12, textAlign: 'right', borderTop: `1px solid ${D.border}` }}>{num(p.requests)}</td>
                        <td style={{ padding: 10, fontSize: 12, textAlign: 'right', borderTop: `1px solid ${D.border}` }}>{num(p.cache_hits)}</td>
                        <td style={{ padding: 10, fontSize: 12, textAlign: 'right', borderTop: `1px solid ${D.border}`, color: p.avg_latency_ms && p.avg_latency_ms > 5000 ? D.red : D.text }}>{p.avg_latency_ms ? `${num(p.avg_latency_ms)}ms` : '—'}</td>
                        <td style={{ padding: 10, fontSize: 12, textAlign: 'right', borderTop: `1px solid ${D.border}` }}>${p.cost_usd?.toFixed(2) ?? '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: D.textMute, fontSize: 12 }}>
                Belum ada data di <code>ai_usage_daily</code>. Data muncul setelah cost-logging AI aktif (lihat catatan COGS aktual).
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function Vital({ label, value, sub, color, dot }: { label: string; value: string; sub: string; color: string; dot?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: D.bg800, border: `1px solid ${D.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: D.textMute, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: 99, background: color }} />}{value}
      </div>
      <div style={{ fontSize: 10, color: D.textMute, marginTop: 2 }}>{sub}</div>
    </div>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 14, background: D.bg800, border: `1px solid ${D.border}`, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}