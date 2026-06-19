'use client'
// app/admin/audit-log/page.tsx
// ══════════════════════════════════════════════════════════════
// Audit Log — riwayat aksi admin (dari admin_audit_log)
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155', border:'#334155',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', purple:'#A78BFA', blue:'#60A5FA',
}

const ACTION_COLOR: Record<string, string> = {
  adjust_credit: D.amber, suspend_user: D.red, unsuspend_user: D.green,
  update_pricing: D.blue, toggle_feature: D.purple, kill_switch: D.red,
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/admin/audit-log', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setLogs(d.logs ?? []); setUsers(d.users ?? []) } })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const emailOf = useMemo(() => {
    const m = new Map(users.map(u => [u.id, u.email]))
    return (id: string) => m.get(id) || (id ? id.slice(0, 8) : 'system')
  }, [users])

  const actions = useMemo(() => Array.from(new Set(logs.map(l => l.action).filter(Boolean))), [logs])
  const filtered = filter ? logs.filter(l => l.action === filter) : logs

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: D.text }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          📜 Audit Log
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: D.green + '20', color: D.green }}>PHASE 6 LIVE</span>
        </h1>
        <p style={{ fontSize: 12, color: D.textMute, marginTop: 2 }}>Riwayat semua aksi admin — siapa mengubah apa & kapan.</p>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#7F1D1D40', border: '1px solid #B91C1C', color: '#FCA5A5', fontSize: 13, marginBottom: 14 }}>ⓘ {error}</div>}

      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <Chip active={filter === ''} onClick={() => setFilter('')}>Semua ({logs.length})</Chip>
          {actions.map(a => <Chip key={a} active={filter === a} onClick={() => setFilter(a)}>{a}</Chip>)}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute }}>Memuat log...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute, fontSize: 13, background: D.bg800, borderRadius: 14, border: `1px dashed ${D.border}` }}>
          Belum ada aksi admin tercatat. Log akan muncul saat ada perubahan pricing, suspend user, toggle fitur, dll.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((l, i) => {
            const color = ACTION_COLOR[l.action] || D.textDim
            return (
              <div key={l.id ?? i} style={{ padding: '12px 16px', borderRadius: 11, background: D.bg800, border: `1px solid ${D.border}`, borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: color + '22', color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{l.action || 'action'}</span>
                    <span style={{ fontSize: 12, color: D.textDim }}>
                      {l.resource_type}{l.resource_id ? ` · ${String(l.resource_id).slice(0, 16)}` : ''}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: D.textMute }}>{l.created_at ? new Date(l.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                <div style={{ fontSize: 11, color: D.textMute }}>oleh <b style={{ color: D.textDim }}>{emailOf(l.admin_id)}</b></div>
                {(l.before_value || l.after_value) && (
                  <div style={{ marginTop: 6, fontSize: 11, color: D.textDim, fontFamily: 'monospace', background: D.bg900, padding: '6px 10px', borderRadius: 6, overflowX: 'auto' }}>
                    {l.before_value && <div>− {JSON.stringify(l.before_value)}</div>}
                    {l.after_value && <div style={{ color: D.green }}>+ {JSON.stringify(l.after_value)}</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 99, border: `1px solid ${active ? D.blue : D.border}`,
      background: active ? D.blue + '22' : 'transparent', color: active ? D.blue : D.textDim,
      fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    }}>{children}</button>
  )
}