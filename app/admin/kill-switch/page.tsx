'use client'
// app/admin/kill-switch/page.tsx
// ══════════════════════════════════════════════════════════════
// Kill Switch — skema Phase 1 (scope/target/is_killed)
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155', border:'#334155',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', purple:'#A78BFA', blue:'#60A5FA',
}

// target → label friendly
const LABEL: Record<string, { name: string; desc: string }> = {
  all:        { name: '🛑 STOP SEMUA AI',     desc: 'Matikan semua generasi AI seketika (darurat)' },
  anthropic:  { name: 'Anthropic / Claude',   desc: 'Matikan call ke Claude (caption, reasoning)' },
  replicate:  { name: 'Replicate',            desc: 'Matikan model di Replicate (gambar/video)' },
  fal:        { name: 'Fal.ai',               desc: 'Matikan model di Fal.ai' },
  deepgram:   { name: 'Deepgram',             desc: 'Matikan transkripsi/subtitle audio' },
  elevenlabs: { name: 'ElevenLabs',           desc: 'Matikan voice/TTS' },
  did:        { name: 'D-ID',                 desc: 'Matikan talking-head video' },
}
const labelOf = (t: string) => LABEL[t] || { name: t, desc: `Provider ${t}` }

export default function KillSwitchPage() {
  const [switches, setSwitches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/kill-switch', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setSwitches(d.switches ?? []) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggle = async (sw: any) => {
    const turningOn = !sw.is_killed
    let reason: string | null = null
    if (turningOn) {
      reason = window.prompt(`Matikan "${labelOf(sw.target).name}"?\n\nAlasan (opsional):`, '')
      if (reason === null) return
    } else if (!window.confirm(`Aktifkan kembali "${labelOf(sw.target).name}"?`)) return

    setBusyId(sw.id)
    try {
      const res = await fetch('/api/admin/kill-switch', {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sw.id, is_killed: turningOn, reason }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.message || d.error); return }
      load()
    } catch (e) { setError(String(e)) }
    finally { setBusyId(null) }
  }

  const global = switches.find(s => s.scope === 'global')
  const providers = switches.filter(s => s.scope !== 'global')
  const anyKilled = switches.some(s => s.is_killed)

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: D.text }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          💀 Kill Switch
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: D.green + '20', color: D.green }}>PHASE 6 LIVE</span>
        </h1>
        <p style={{ fontSize: 12, color: D.textMute, marginTop: 2 }}>Matikan provider AI / semua generasi secara darurat.</p>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#7F1D1D40', border: '1px solid #B91C1C', color: '#FCA5A5', fontSize: 13, marginBottom: 14 }}>ⓘ {error}</div>}

      {anyKilled && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#7F1D1D40', border: `1px solid ${D.red}`, marginBottom: 16, fontSize: 13, color: '#FCA5A5', fontWeight: 600 }}>
          ⚠️ Ada switch aktif — sebagian layanan sedang dimatikan.
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: D.textMute }}>Memuat switch...</div>
      ) : (
        <>
          {global && (
            <div style={{ padding: '20px 24px', borderRadius: 16, marginBottom: 16, background: global.is_killed ? '#7F1D1D40' : D.bg800, border: `2px solid ${global.is_killed ? D.red : D.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: global.is_killed ? D.red : D.text }}>{labelOf(global.target).name}</div>
                  <div style={{ fontSize: 12, color: D.textDim, marginTop: 2 }}>{labelOf(global.target).desc}</div>
                  {global.is_killed && global.reason && <div style={{ fontSize: 11, color: D.red, marginTop: 4 }}>Alasan: {global.reason}</div>}
                </div>
                <Toggle on={global.is_killed} busy={busyId === global.id} onClick={() => toggle(global)} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
            {providers.map(sw => {
              const l = labelOf(sw.target)
              return (
                <div key={sw.id} style={{ padding: '16px 18px', borderRadius: 13, background: sw.is_killed ? '#7F1D1D30' : D.bg800, border: `1px solid ${sw.is_killed ? D.red + '80' : D.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sw.is_killed ? D.red : D.text }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: D.textMute, marginTop: 2 }}>{l.desc}</div>
                    </div>
                    <Toggle on={sw.is_killed} busy={busyId === sw.id} onClick={() => toggle(sw)} />
                  </div>
                  {sw.is_killed && (
                    <div style={{ fontSize: 10, color: D.red, marginTop: 4 }}>
                      Dimatikan {sw.killed_at ? new Date(sw.killed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}{sw.reason ? ` · ${sw.reason}` : ''}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ fontSize: 11, color: D.textMute, marginTop: 14 }}>
            💡 Switch tersimpan di DB. Agar benar-benar memblokir, route AI perlu cek <code>kill_switches</code> (scope+target) sebelum panggil provider.
          </div>
        </>
      )}
    </div>
  )
}

function Toggle({ on, busy, onClick }: { on: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy} style={{
      minWidth: 92, padding: '9px 14px', borderRadius: 9, border: 'none', cursor: busy ? 'wait' : 'pointer',
      background: on ? '#DC2626' : '#334155', color: on ? '#fff' : '#94A3B8',
      fontSize: 12, fontWeight: 800, fontFamily: 'inherit', boxShadow: on ? '0 0 0 1px #F87171' : 'none',
    }}>{busy ? '...' : on ? '● MATI' : '○ Nyala'}</button>
  )
}