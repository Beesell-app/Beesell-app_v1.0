'use client'
// app/(auth)/login/page.tsx
import { useActionState, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginAction, googleSignInAction, resendVerificationAction } from '@/lib/auth/actions'
import type { AuthResult } from '@/lib/auth/actions'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

const C = {
  brand:'#2563EB', b50:'#EFF6FF', b100:'#DBEAFE',
  green:'#059669', g50:'#ECFDF5',
  amber:'#D97706', a50:'#FFFBEB',
  red:'#DC2626', r50:'#FEF2F2',
  s900:'#0F172A', s700:'#334155', s600:'#475569', s500:'#64748B',
  s400:'#94A3B8', s200:'#E2E8F0', s100:'#F1F5F9', w:'#fff',
}

function inputStyle(hasErr: boolean): React.CSSProperties {
  return { width:'100%', padding:'11px 14px', borderRadius:'10px', border:`1.5px solid ${hasErr?C.red:C.s200}`, background:hasErr?C.r50:C.w, fontSize:'14px', fontFamily:"'DM Sans',sans-serif", color:C.s900, outline:'none', boxSizing:'border-box' as const, transition:'border-color .15s' }
}

function LoginContent() {
  const searchParams = useSearchParams()
  const urlError   = searchParams.get('error')
  const urlMessage = searchParams.get('message')

  const [state, action, pending] = useActionState(loginAction, null)
  const [showPw, setShowPw]      = useState(false)
  const [email,  setEmail]       = useState('')

  const errEmail = state?.field === 'email'    ? state.error : undefined
  const errPw    = state?.field === 'password' ? state.error : undefined
  const errGen   = !state?.field && !state?.success ? state?.error : undefined
  const needsVerify = state?.hint === 'verify-email'

  // Resend verification
  const [rs, ra, rp] = useActionState(resendVerificationAction, null)
  const [cd, setCd]  = useState(0)
  function onResend(fd: FormData) {
    if (cd > 0 || rp) return
    setCd(60)
    const t = setInterval(() => setCd(n => { if (n<=1){clearInterval(t);return 0} return n-1 }), 1000)
    ra(fd)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 60%,#F0FDF4 100%)', padding:'20px', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:'440px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🐝</div>
            <span style={{ fontFamily:'Georgia,serif', fontSize:'19px', fontWeight:700, color:C.s900 }}>BeeSell AI</span>
          </Link>
          <h1 style={{ fontSize:'23px', fontWeight:700, color:C.s900, marginTop:'16px', marginBottom:'2px' }}>Selamat datang kembali</h1>
          <p style={{ fontSize:'13px', color:C.s500 }}>Masuk ke akun BeeSell AI kamu</p>
        </div>

        <div style={{ background:C.w, borderRadius:'20px', border:'1px solid #E2E8F0', padding:'28px', boxShadow:'0 4px 24px rgba(37,99,235,.07)' }}>

          {/* Success message (e.g. after logout) */}
          {urlMessage && (
            <div style={{ padding:'10px 13px', background:C.g50, border:'1px solid #BBF7D0', borderRadius:'9px', marginBottom:'14px', fontSize:'12px', color:C.green, display:'flex', gap:'7px', alignItems:'center' }}>
              <CheckCircle2 size={13}/>{decodeURIComponent(urlMessage)}
            </div>
          )}

          {/* URL error (from callback redirect) */}
          {urlError && (
            <div style={{ padding:'12px 14px', background:C.r50, border:'1px solid #FECACA', borderRadius:'10px', marginBottom:'14px', fontSize:'12px', color:C.red, display:'flex', gap:'7px', alignItems:'flex-start' }}>
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>{decodeURIComponent(urlError)}
            </div>
          )}

          {/* Google */}
          <GoogleBtn/>

          <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'16px 0' }}>
            <div style={{ flex:1, height:'1px', background:C.s200 }}/><span style={{ fontSize:'12px', color:C.s400 }}>atau dengan email</span><div style={{ flex:1, height:'1px', background:C.s200 }}/>
          </div>

          {/* Email not verified warning */}
          {needsVerify && (
            <div style={{ padding:'12px 14px', background:C.a50, border:'1px solid #FCD34D', borderRadius:'10px', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:C.amber, marginBottom:'6px' }}>Email belum diverifikasi</div>
              <div style={{ fontSize:'12px', color:C.s700, marginBottom:'10px' }}>{errEmail}</div>
              {rs?.success
                ? <div style={{ fontSize:'12px', color:C.green, display:'flex', gap:'5px' }}><CheckCircle2 size={13}/>Email verifikasi dikirim! Cek inbox kamu.</div>
                : (
                  <form action={onResend}>
                    <input type="hidden" name="email" value={email}/>
                    {rs?.error && <p style={{ fontSize:'11px', color:C.red, marginBottom:'6px' }}>{rs.error}</p>}
                    <button type="submit" disabled={rp||cd>0}
                      style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'6px 14px', borderRadius:'8px', border:`1px solid ${C.amber}`, background:C.a50, fontSize:'12px', fontWeight:600, color:C.amber, cursor:cd>0||rp?'not-allowed':'pointer' }}>
                      {rp ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/>
                          : <RefreshCw size={11}/>}
                      {cd > 0 ? `Kirim ulang (${cd}s)` : 'Kirim ulang email verifikasi'}
                    </button>
                  </form>
                )
              }
            </div>
          )}

          {/* General error */}
          {errGen && (
            <div style={{ padding:'10px 13px', background:C.r50, border:'1px solid #FECACA', borderRadius:'9px', marginBottom:'14px', fontSize:'12px', color:C.red, display:'flex', gap:'7px', alignItems:'center' }}>
              <AlertCircle size={13}/>{errGen}
            </div>
          )}

          {/* Login form */}
          <form action={action} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ fontSize:'12px', fontWeight:600, color:C.s600, display:'block', marginBottom:'6px' }}>Email <span style={{ color:C.red }}>*</span></label>
              <input name="email" type="email" placeholder="email@kamu.com" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle(!!errEmail && !needsVerify)}
                onFocus={e => { if (!(errEmail && !needsVerify)) e.currentTarget.style.borderColor = C.brand }}
                onBlur={e  => { if (!(errEmail && !needsVerify)) e.currentTarget.style.borderColor = C.s200  }}
              />
              {errEmail && !needsVerify && <p style={{ fontSize:'11px', color:C.red, marginTop:'4px' }}>{errEmail}</p>}
            </div>

            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <label style={{ fontSize:'12px', fontWeight:600, color:C.s600 }}>Password <span style={{ color:C.red }}>*</span></label>
                <Link href="/forgot-password" style={{ fontSize:'12px', color:C.brand, textDecoration:'none', fontWeight:500 }}>Lupa password?</Link>
              </div>
              <div style={{ position:'relative' }}>
                <input name="password" type={showPw?'text':'password'} placeholder="Password kamu" required autoComplete="current-password"
                  style={{ ...inputStyle(!!errPw), paddingRight:'44px' }}
                  onFocus={e => { if (!errPw) e.currentTarget.style.borderColor = C.brand }}
                  onBlur={e  => { if (!errPw) e.currentTarget.style.borderColor = C.s200  }}
                />
                <button type="button" onClick={() => setShowPw(p=>!p)} tabIndex={-1}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.s400, display:'flex', padding:0 }}>
                  {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
              {errPw && (
                <div style={{ marginTop:'4px' }}>
                  <p style={{ fontSize:'11px', color:C.red, marginBottom:'4px' }}>{errPw}</p>
                  {state?.hint === 'reset-password' && (
                    <Link href="/forgot-password" style={{ fontSize:'11px', color:C.brand, fontWeight:600, textDecoration:'none' }}>→ Reset password</Link>
                  )}
                </div>
              )}
            </div>

            <button type="submit" disabled={pending}
              style={{ width:'100%', padding:'13px', borderRadius:'11px', border:'none', background:pending?C.s200:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:pending?C.s400:'#fff', fontSize:'14px', fontWeight:700, cursor:pending?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:pending?'none':'0 4px 14px rgba(37,99,235,.35)', transition:'all .15s' }}>
              {pending ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Masuk...</> : 'Masuk →'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:'13px', color:C.s500, marginTop:'16px' }}>
            Belum punya akun? <Link href="/register" style={{ color:C.brand, fontWeight:600, textDecoration:'none' }}>Daftar gratis</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
    </div>
  )
}

function GoogleBtn() {
  const [loading, setLoading] = useState(false)
  return (
    <button type="button" disabled={loading}
      onClick={async () => { setLoading(true); await googleSignInAction() }}
      style={{ width:'100%', padding:'11px 16px', borderRadius:'11px', border:'1.5px solid #E2E8F0', background:loading?'#F1F5F9':'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'14px', fontWeight:600, color:'#334155', cursor:loading?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", opacity:loading?.7:1 }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = loading ? '#F1F5F9' : '#fff' }}
    >
      {loading ? <Loader2 size={17} style={{ animation:'spin 1s linear infinite' }}/>
               : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.12-6.12C34.46 3.18 29.5 1 24 1 14.82 1 7.07 6.56 3.9 14.3l7.15 5.55C12.73 13.64 17.92 9.5 24 9.5z"/><path fill="#4285F4" d="M46.9 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.87c-.55 2.95-2.22 5.44-4.73 7.12l7.35 5.7C43.47 37.38 46.9 31.45 46.9 24.5z"/><path fill="#FBBC05" d="M11.05 28.35A14.57 14.57 0 0 1 9.5 24c0-1.51.27-2.97.75-4.35L3.1 14.1A23.8 23.8 0 0 0 1 24c0 3.79.9 7.36 2.5 10.52l7.55-6.17z"/><path fill="#34A853" d="M24 47c5.98 0 11-.2 14.73-5.52l-7.35-5.7C29.5 37.6 26.9 38.5 24 38.5c-6.08 0-11.27-4.14-13-9.85l-7.5 5.83C6.88 42.42 14.74 47 24 47z"/></svg>
      }
      {loading ? 'Menghubungkan...' : 'Masuk dengan Google'}
    </button>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><Loader2 size={24} style={{ animation:'spin 1s linear infinite', color:'#2563EB' }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <LoginContent/>
    </Suspense>
  )
}