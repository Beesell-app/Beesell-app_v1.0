'use client'
// apps/web-app/app/auth/reset-password/page.tsx
// Halaman ini dibuka dari link email reset password
// Supabase set session otomatis dari hash di URL
import { useFormState, useFormStatus } from 'react-dom'
import { useState }                     from 'react'
import { resetPasswordAction }          from '@/lib/actions/auth'
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} style={{
      width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
      background: pending ? '#CBD5E1' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      color: pending ? '#94A3B8' : '#fff',
      fontSize: '15px', fontWeight: 600,
      cursor: pending ? 'not-allowed' : 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    }}>
      {pending ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : 'Simpan Password Baru'}
    </button>
  )
}

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(resetPasswordAction, null)
  const [show1, setShow1]   = useState(false)
  const [show2, setShow2]   = useState(false)

  const inp: React.CSSProperties = { width: '100%', padding: '10px 44px 10px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', color: '#0F172A', outline: 'none', fontFamily: "'DM Sans', sans-serif" }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF, #F8FAFC, #F5F3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #2563EB, #7C3AED)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>BeeSell <span style={{ color: '#2563EB' }}>AI</span></span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(15,23,42,.08)', padding: '28px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Buat password baru</h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Password baru minimal 8 karakter, 1 huruf kapital, 1 angka.</p>

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {state?.error && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: '#B91C1C' }}>{state.error}</div>
            )}

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Password baru</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={show1 ? 'text' : 'password'} autoComplete="new-password" style={inp} />
                <button type="button" onClick={() => setShow1(!show1)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {show1 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Konfirmasi password</label>
              <div style={{ position: 'relative' }}>
                <input name="passwordConfirm" type={show2 ? 'text' : 'password'} autoComplete="new-password" style={inp} />
                <button type="button" onClick={() => setShow2(!show2)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {show2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {state?.field === 'passwordConfirm' && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{state.error}</p>}
            </div>

            <SubmitButton />
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
