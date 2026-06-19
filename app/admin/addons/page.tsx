'use client'
// app/admin/addons/page.tsx
// ══════════════════════════════════════════════════════════════
// Add-on Editor — edit harga, badge, status add-on (single source)
// Perubahan langsung reflected di landing #harga + /billing (≤60s)
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155', border:'#334155',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', purple:'#A78BFA',
}

interface Addon {
  addon_id: string; label: string; qty: string | null; price: number
  icon: string | null; color: string | null; badge: string | null
  kind: 'active' | 'coming-soon'; eta: string | null; sort_order: number
  is_active: boolean
}

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/addons', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setAddons(d.addons ?? []) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const patch = (id: string, field: keyof Addon, value: unknown) => {
    setAddons(prev => prev.map(a => a.addon_id === id ? { ...a, [field]: value } : a))
  }

  const save = async (a: Addon) => {
    setSavingId(a.addon_id)
    setError(null)
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addon_id: a.addon_id,
          updates: { label: a.label, qty: a.qty, price: a.price, badge: a.badge, kind: a.kind, eta: a.eta, is_active: a.is_active, sort_order: a.sort_order },
        }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.message || d.error); return }
      setSavedId(a.addon_id)
      setTimeout(() => setSavedId(null), 1500)
    } catch (e) { setError(String(e)) }
    finally { setSavingId(null) }
  }

  const input: React.CSSProperties = {
    background: D.bg900, border: `1px solid ${D.border}`, borderRadius: 7,
    color: D.text, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', width: '100%',
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: D.text }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>⚡ Add-on Editor</h1>
        <p style={{ fontSize: 12, color: D.textMute, marginTop: 2 }}>
          Edit harga & status add-on. Langsung reflected di landing + billing (≤60 detik).
        </p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#7F1D1D40', border: '1px solid #B91C1C', color: '#FCA5A5', fontSize: 13, marginBottom: 14 }}>
          ⓘ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute }}>Memuat add-on...</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {addons.map(a => (
            <div key={a.addon_id} style={{
              display: 'grid',
              gridTemplateColumns: '32px 1.4fr 1fr 110px 110px 90px 80px',
              gap: 10, alignItems: 'center',
              padding: '12px 14px', borderRadius: 12,
              background: D.bg800, border: `1px solid ${a.kind === 'coming-soon' ? D.purple + '60' : D.border}`,
              opacity: a.is_active ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 20, textAlign: 'center' }}>{a.icon}</div>

              <input style={input} value={a.label} onChange={e => patch(a.addon_id, 'label', e.target.value)} />
              <input style={input} value={a.qty ?? ''} onChange={e => patch(a.addon_id, 'qty', e.target.value)} placeholder="kuantitas" />

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: D.textMute }}>Rp</span>
                <input style={input} type="number" value={a.price}
                  onChange={e => patch(a.addon_id, 'price', parseInt(e.target.value) || 0)} />
              </div>

              {/* Badge */}
              <input style={input} value={a.badge ?? ''} onChange={e => patch(a.addon_id, 'badge', e.target.value || null)} placeholder="badge" />

              {/* Active toggle */}
              <button onClick={() => patch(a.addon_id, 'is_active', !a.is_active)}
                style={{
                  padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: a.is_active ? D.green + '22' : D.bg700,
                  color: a.is_active ? D.green : D.textMute, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                }}>
                {a.is_active ? 'Aktif' : 'Off'}
              </button>

              {/* Save */}
              <button onClick={() => save(a)} disabled={savingId === a.addon_id}
                style={{
                  padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: savedId === a.addon_id ? D.green : D.amber,
                  color: '#0F172A', fontSize: 11, fontWeight: 800, fontFamily: 'inherit',
                }}>
                {savingId === a.addon_id ? '...' : savedId === a.addon_id ? '✓' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 11, color: D.textMute }}>
        💡 Add-on dengan kind <b style={{ color: D.purple }}>coming-soon</b> tampil di section "Akan Datang". Set <b>Off</b> untuk sembunyikan dari landing & billing.
      </div>
    </div>
  )
}