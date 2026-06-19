'use client'
// app/admin/cost-guardrail/page.tsx
// ══════════════════════════════════════════════════════════════
// Cost Guardrails — skema Phase 1 (cap_idr, IDR)
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155', border:'#334155',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', purple:'#A78BFA', blue:'#60A5FA',
}
const rp = (n: number) => 'Rp' + Math.round(n || 0).toLocaleString('id-ID')
const PERIOD_LABEL: Record<string, string> = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' }
const targetLabel = (t: string) => t === 'all' ? 'Semua' : t

export default function CostGuardrailPage() {
  const [guardrails, setGuardrails] = useState<any[]>([])
  const [spend, setSpend] = useState<{ daily: number; weekly: number; monthly: number }>({ daily: 0, weekly: 0, monthly: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/cost-guardrail', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setGuardrails(d.guardrails ?? []); setSpend(d.spend_idr ?? { daily: 0, weekly: 0, monthly: 0 }) } })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const patch = (id: string, field: string, value: unknown) =>
    setGuardrails(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))

  const save = async (g: any) => {
    setSavingId(g.id)
    try {
      const res = await fetch('/api/admin/cost-guardrail', {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: g.id, updates: { cap_idr: Number(g.cap_idr), warn_threshold_pct: Number(g.warn_threshold_pct), action_on_exceed: g.action_on_exceed, is_active: g.is_active } }),
      })
      const d = await res.json()
      if (!res.ok) setError(d.error || d.message)
    } catch (e) { setError(String(e)) }
    finally { setSavingId(null) }
  }

  const input: React.CSSProperties = { background: D.bg900, border: `1px solid ${D.border}`, borderRadius: 7, color: D.text, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', width: 120 }

  // hanya tampilkan guardrail global (per-provider bisa banyak; fokus yang utama)
  const sorted = [...guardrails].sort((a, b) => {
    const order: Record<string, number> = { daily: 0, weekly: 1, monthly: 2 }
    return (a.scope === 'global' ? 0 : 1) - (b.scope === 'global' ? 0 : 1) || (order[a.period] ?? 9) - (order[b.period] ?? 9)
  })

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: D.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛡️ Cost Guardrails
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: D.green + '20', color: D.green }}>PHASE 6 LIVE</span>
          </h1>
          <p style={{ fontSize: 12, color: D.textMute, marginTop: 2 }}>Batas biaya AI (IDR). Spend aktual dari ai_usage_daily (kurs $1≈Rp16.000).</p>
        </div>
        <button onClick={load} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${D.border}`, background: D.bg800, color: D.textDim, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Refresh</button>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#7F1D1D40', border: '1px solid #B91C1C', color: '#FCA5A5', fontSize: 13, marginBottom: 14 }}>ⓘ {error}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute }}>Memuat guardrails...</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {sorted.map(g => {
            const actual = g.scope === 'global'
              ? (spend as any)[g.period] ?? 0
              : 0 // spend per-provider/tool butuh breakdown; tampil 0 untuk non-global
            const cap = Number(g.cap_idr) || 0
            const pct = cap > 0 ? (actual / cap) * 100 : 0
            const over = pct >= 100
            const warn = pct >= (g.warn_threshold_pct ?? 80)
            const barColor = over ? D.red : warn ? D.amber : D.green
            const isGlobal = g.scope === 'global'
            return (
              <div key={g.id} style={{ padding: '16px 20px', borderRadius: 14, background: D.bg800, border: `1px solid ${over ? D.red : D.border}`, opacity: g.is_active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {PERIOD_LABEL[g.period] || g.period} · <span style={{ color: D.textDim }}>{g.scope}:{targetLabel(g.target)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: D.textMute }}>Aksi saat lewat: {g.action_on_exceed}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isGlobal ? (
                      <div style={{ fontSize: 18, fontWeight: 900, color: barColor }}>{rp(actual)} <span style={{ fontSize: 12, color: D.textMute, fontWeight: 500 }}>/ {rp(cap)}</span></div>
                    ) : (
                      <div style={{ fontSize: 13, color: D.textMute }}>cap {rp(cap)}</div>
                    )}
                  </div>
                </div>

                {isGlobal && (
                  <>
                    <div style={{ height: 8, borderRadius: 99, background: D.bg900, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, transition: 'width .3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: D.textMute, marginBottom: 12 }}>
                      <span>{pct.toFixed(0)}% terpakai</span>
                      {over && <span style={{ color: D.red, fontWeight: 700 }}>⚠️ LIMIT TERLAMPAUI</span>}
                      {!over && warn && <span style={{ color: D.amber, fontWeight: 700 }}>⚠️ Mendekati limit</span>}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', paddingTop: 12, borderTop: `1px solid ${D.border}` }}>
                  <label style={{ fontSize: 11, color: D.textDim }}>Cap Rp<input style={input} type="number" value={g.cap_idr} onChange={e => patch(g.id, 'cap_idr', e.target.value)} /></label>
                  <label style={{ fontSize: 11, color: D.textDim }}>Warn %<input style={{ ...input, width: 60 }} type="number" value={g.warn_threshold_pct} onChange={e => patch(g.id, 'warn_threshold_pct', e.target.value)} /></label>
                  <label style={{ fontSize: 11, color: D.textDim }}>Aksi
                    <select value={g.action_on_exceed} onChange={e => patch(g.id, 'action_on_exceed', e.target.value)} style={{ ...input, width: 110, marginLeft: 4 }}>
                      <option value="warn">Warn saja</option>
                      <option value="throttle">Throttle</option>
                      <option value="kill">Kill (stop)</option>
                    </select>
                  </label>
                  <button onClick={() => save(g)} disabled={savingId === g.id} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, border: 'none', background: D.amber, color: '#0F172A', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {savingId === g.id ? '...' : 'Simpan'}
                  </button>
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 11, color: D.textMute }}>
            💡 Spend ditampilkan untuk guardrail <b>global</b>. Guardrail per-provider/tool butuh breakdown biaya per target (belum ada di ai_usage_daily per-target) — tampil cap-nya saja. Enforcement (benar-benar stop) perlu cek di route AI.
          </div>
        </div>
      )}
    </div>
  )
}