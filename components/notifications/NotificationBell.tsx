'use client'
// apps/web-app/components/notifications/NotificationBell.tsx
// Bell icon in TopBar — request push permission + show prefs
import { useState, useEffect } from 'react'
import { Bell, BellOff, Check, X, Loader2 } from 'lucide-react'
import { useWebPush } from '@/lib/notifications/firebase-client'

export function NotificationBell() {
  const { state, message, requestPermission, clearMessage } = useWebPush()
  const [showDropdown, setShowDropdown] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean> | null>(null)
  const [saving, setSaving] = useState(false)

  // Load preferences
  useEffect(() => {
    if (!showDropdown) return
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then(d => setPrefs(d.preferences))
      .catch(() => {})
  }, [showDropdown])

  const savePref = async (key: string, value: boolean) => {
    setSaving(true)
    setPrefs(prev => prev ? { ...prev, [key]: value } : { [key]: value })
    await fetch('/api/notifications/preferences', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ [key]: value }),
    }).catch(() => {})
    setSaving(false)
  }

  const isGranted  = state === 'granted'
  const isDenied   = state === 'denied'
  const requesting = state === 'requesting'

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        title={isDenied ? 'Notifikasi diblokir browser' : 'Notifikasi'}
        style={{
          width:          '36px',
          height:         '36px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          background:     showDropdown ? '#EFF6FF' : '#F8FAFC',
          border:         `1px solid ${showDropdown ? '#BFDBFE' : '#E2E8F0'}`,
          borderRadius:   '9px',
          cursor:         'pointer',
          color:          isGranted ? '#2563EB' : '#94A3B8',
          position:       'relative',
          flexShrink:     0,
        }}
      >
        {isDenied ? <BellOff size={16} /> : <Bell size={16} />}

        {/* Active dot */}
        {isGranted && (
          <span style={{
            position:     'absolute',
            top:          '6px',
            right:        '6px',
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   '#16A34A',
            border:       '1.5px solid #fff',
          }} />
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div onClick={() => setShowDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position:     'absolute',
            top:          '44px',
            right:        0,
            width:        '280px',
            background:   '#fff',
            border:       '1px solid #E2E8F0',
            borderRadius: '14px',
            boxShadow:    '0 8px 24px rgba(15,23,42,.12)',
            zIndex:       41,
            overflow:     'hidden',
            fontFamily:   "'DM Sans', sans-serif",
          }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Notifikasi
                </h3>
                <button onClick={() => setShowDropdown(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Permission state */}
            {!isGranted && !isDenied && (
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px', lineHeight: 1.5 }}>
                  Aktifkan notifikasi untuk dapat update saat konten berhasil atau gagal dipublish.
                </p>
                <button
                  onClick={async () => {
                    await requestPermission()
                    setShowDropdown(false)
                  }}
                  disabled={requesting}
                  style={{
                    width:      '100%',
                    padding:    '10px',
                    background: requesting ? '#CBD5E1' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color:      '#fff',
                    border:     'none',
                    borderRadius: '9px',
                    fontSize:   '13px',
                    fontWeight: 700,
                    cursor:     requesting ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    display:    'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap:        '6px',
                  }}
                >
                  {requesting
                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Meminta izin...</>
                    : <><Bell size={13} /> Aktifkan Notifikasi</>
                  }
                </button>
              </div>
            )}

            {isDenied && (
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: '12px', color: '#DC2626', lineHeight: 1.5 }}>
                  ⚠️ Notifikasi diblokir browser. Klik ikon kunci 🔒 di address bar dan izinkan notifikasi.
                </p>
              </div>
            )}

            {/* Preferences (when granted) */}
            {isGranted && prefs && (
              <div style={{ padding: '8px 0' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 16px 2px' }}>
                  Push Notification
                </p>
                <PrefToggle label="✅ Post berhasil dipublish"  value={prefs.push_publish} onChange={v => savePref('push_publish', v)} />
                <PrefToggle label="❌ Post gagal dipublish"    value={prefs.push_failed}  onChange={v => savePref('push_failed', v)} />

                <div style={{ height: '1px', background: '#F1F5F9', margin: '8px 0' }} />

                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 16px 2px' }}>
                  Email
                </p>
                <PrefToggle label="✅ Post berhasil (email)"   value={prefs.email_publish} onChange={v => savePref('email_publish', v)} />
                <PrefToggle label="❌ Post gagal (email)"     value={prefs.email_failed}  onChange={v => savePref('email_failed', v)} />
              </div>
            )}

            {saving && (
              <div style={{ padding: '8px 16px', borderTop: '1px solid #F1F5F9', fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...
              </div>
            )}
          </div>
        </>
      )}

      {/* Foreground message toast */}
      {message && (
        <ForegroundToast message={message} onClose={clearMessage} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function PrefToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '10px',
        padding:     '8px 16px',
        cursor:      'pointer',
      }}
      onClick={() => onChange(!value)}
    >
      <div style={{
        width:          '32px',
        height:         '18px',
        borderRadius:   '99px',
        background:     value ? '#2563EB' : '#CBD5E1',
        position:       'relative',
        flexShrink:     0,
        transition:     'background .15s',
      }}>
        <span style={{
          position:     'absolute',
          top:          '2px',
          left:         value ? '16px' : '2px',
          width:        '14px',
          height:       '14px',
          borderRadius: '50%',
          background:   '#fff',
          transition:   'left .15s',
          boxShadow:    '0 1px 2px rgba(0,0,0,.2)',
        }} />
      </div>
      <span style={{ fontSize: '12px', color: '#334155', flex: 1 }}>{label}</span>
    </div>
  )
}

function ForegroundToast({ message, onClose }: { message: any; onClose: () => void }) {
  const notif = message?.notification ?? {}
  const data  = message?.data ?? {}

  return (
    <div style={{
      position:     'fixed',
      bottom:       '80px',
      right:        '20px',
      width:        '320px',
      background:   '#fff',
      border:       '1px solid #E2E8F0',
      borderRadius: '14px',
      boxShadow:    '0 8px 24px rgba(15,23,42,.15)',
      zIndex:       60,
      overflow:     'hidden',
      fontFamily:   "'DM Sans', sans-serif",
      animation:    'slideUp .2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: data.type === 'publish_failed' ? '#FEF2F2' : '#F0FDF4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0,
        }}>
          {data.type === 'publish_failed' ? '❌' : '✅'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>
            {notif.title ?? 'BeeSell AI'}
          </p>
          <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
            {notif.body}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>
      {data.url && (
        <a href={data.url} style={{
          display: 'block', padding: '8px 16px',
          borderTop: '1px solid #F1F5F9', fontSize: '12px',
          fontWeight: 600, color: '#2563EB', textDecoration: 'none',
        }}>
          Lihat Detail →
        </a>
      )}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  )
}