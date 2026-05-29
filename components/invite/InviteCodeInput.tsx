'use client'
// apps/web-app/components/invite/InviteCodeInput.tsx
// Validates invite code in real-time on register page
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, XCircle, Ticket } from 'lucide-react'


interface Props {
  value:    string
  onChange: (code: string) => void
  onValid:  (valid: boolean, planGranted?: string) => void
  required?: boolean
}
const [code, setCode]       = useState('')
const [codeValid, setValid] = useState(false)
type State = 'idle' | 'checking' | 'valid' | 'invalid'

export function InviteCodeInput({ value, onChange, onValid, required = true }: Props) {
  const [state,   setState]   = useState<State>('idle')
  const [message, setMessage] = useState('')
  const [label,   setLabel]   = useState('')

  // Debounce validate
  useEffect(() => {
    const trimmed = value.trim().toUpperCase()
    if (!trimmed) {
      setState('idle')
      onValid(!required)
      return
    }
    if (trimmed.length < 4) return

    setState('checking')
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/invite-codes?code=${encodeURIComponent(trimmed)}`)
        const data = await res.json()

        if (data.valid) {
          setState('valid')
          setLabel(data.label ?? '')
          setMessage(`${data.spotsLeft} slot tersisa${data.label ? ` · ${data.label}` : ''}`)
          onValid(true, data.planGranted)
        } else {
          setState('invalid')
          setMessage(data.error ?? 'Kode tidak valid')
          onValid(false)
        }
      } catch {
        setState('invalid')
        setMessage('Gagal memverifikasi kode')
        onValid(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [value, required])

  const borderColor =
    state === 'valid'   ? '#16A34A' :
    state === 'invalid' ? '#DC2626' :
    '#E2E8F0'

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <label style={{
        display: 'block', fontSize: '13px', fontWeight: 600,
        color: '#374151', marginBottom: '6px',
      }}>
        Kode Invite {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>

      <div style={{ position: 'relative' }}>
        <Ticket size={16} color="#9CA3AF" style={{
          position: 'absolute', left: '12px', top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none',
        }} />

        <input
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          placeholder="Masukkan kode invite"
          maxLength={20}
          style={{
            width:        '100%',
            padding:      '10px 40px 10px 38px',
            border:       `1.5px solid ${borderColor}`,
            borderRadius: '10px',
            fontSize:     '14px',
            fontFamily:   "'DM Mono', monospace",
            letterSpacing: '0.08em',
            outline:      'none',
            color:        '#0F172A',
            background:   state === 'valid' ? '#F0FDF4' : '#fff',
            textTransform: 'uppercase',
            transition:   'border-color .15s, background .15s',
            boxSizing:    'border-box',
          }}
        />

        {/* Status icon */}
        <div style={{
          position: 'absolute', right: '12px', top: '50%',
          transform: 'translateY(-50%)',
        }}>
          {state === 'checking' && (
            <Loader2 size={16} color="#6B7280" style={{ animation: 'spin 1s linear infinite' }} />
          )}
          {state === 'valid' && <CheckCircle size={16} color="#16A34A" />}
          {state === 'invalid' && <XCircle size={16} color="#DC2626" />}
        </div>
      </div>
      <InviteCodeInput
        value={code}
        onChange={setCode}
        onValid={(valid) => setValid(valid)}
        required={true}   // false = optional
      />
      {/* Message */}
      {message && (
        <p style={{
          fontSize:   '12px',
          marginTop:  '5px',
          color:      state === 'valid' ? '#15803D' : '#DC2626',
          display:    'flex',
          alignItems: 'center',
          gap:        '4px',
        }}>
          {state === 'valid' ? '✓' : '✗'} {message}
        </p>
      )}

      {!message && !required && (
        <p style={{ fontSize: '11px', marginTop: '5px', color: '#9CA3AF' }}>
          Punya kode invite? Masukkan untuk dapat akses lebih cepat.
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}