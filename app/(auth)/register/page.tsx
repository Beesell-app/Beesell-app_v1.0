'use client'
// app/(auth)/register/page.tsx — SMTP-AWARE

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  registerAction, googleSignInAction, resendVerificationAction,
} from '@/lib/auth/actions'
import type { AuthResult } from '@/lib/auth/actions'
import { Eye, EyeOff, Loader2, AlertCircle, Mail, RefreshCw, CheckCircle2, ArrowRight, MailX, Wifi } from 'lucide-react'

const C = {
  brand:'#2563EB', b50:'#EFF6FF', b100:'#DBEAFE',
  green:'#059669', g50:'#ECFDF5',
  amber:'#D97706', a50:'#FFFBEB',
  red:'#DC2626', r50:'#FEF2F2',
  purple:'#7C3AED', p50:'#F5F3FF',
  s900:'#0F172A', s700:'#334155', s600:'#475569', s500:'#64748B',
  s400:'#94A3B8', s200:'#E2E8F0', s100:'#F1F5F9', w:'#fff',
}

// ── Shared helpers ─────────────────────────────────────────────
function inputStyle(err?: string): React.CSSProperties {
  return {
    width:'100%', padding:'11px 14px', borderRadius:'10px',
    border:`1.5px solid ${err ? C.red : C.s200}`,
    background: err ? C.r50 : C.w, fontSize:'14px',
    fontFamily:"'DM Sans',sans-serif", color:C.s900,
    outline:'none', boxSizing:'border-box' as const, transition:'border-color .15s',
  }
}
function onFocus(e: React.FocusEvent<HTMLInputElement>, err?: string) {
  if (!err) e.currentTarget.style.borderColor = C.brand
}
function onBlur(e: React.FocusEvent<HTMLInputElement>, err?: string) {
  if (!err) e.currentTarget.style.borderColor = C.s200
}

// ── Password strength ──────────────────────────────────────────
function PwStrength({ pw }: { pw: string }) {
  if (!pw) return null
  const c = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw)]
  const n = c.filter(Boolean).length
  const col = ['',C.red,C.amber,C.green][n]
  const lbl = ['','Lemah','Cukup','Kuat'][n]
  return (
    <div style={{ marginTop:'6px' }}>
      <div style={{ display:'flex', gap:'4px', marginBottom:'5px' }}>
        {[1,2,3].map(i => <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background:i<=n?col:C.s200, transition:'background .2s' }}/>)}
      </div>
      <div style={{ display:'flex', gap:'12px', fontSize:'10px' }}>
        {['≥8 char','1 kapital','1 angka'].map((l,i) => (
          <span key={l} style={{ color:c[i]?C.green:C.s400 }}>{c[i]?'✓':'○'} {l}</span>
        ))}
        {n>0 && <span style={{ marginLeft:'auto', fontWeight:700, color:col }}>{lbl}</span>}
      </div>
    </div>
  )
}

// ── Resend form (shared by both verify + email-failed screens) ─
function ResendForm({ email }: { email: string }) {
  const [rs, ra, rp] = useActionState(resendVerificationAction, null)
  const [cd, setCd]  = useState(0)

  useEffect(() => {
    if (cd <= 0) return
    const t = setTimeout(() => setCd(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [cd])

  function onResend(fd: FormData) {
    if (cd > 0 || rp) return
    setCd(60)
    ra(fd)
  }

  if (rs?.success) {
    return (
      <div style={{ display:'flex', gap:'8px', alignItems:'center', padding:'10px 14px', background:C.g50, borderRadius:'10px', fontSize:'13px', color:C.green, fontWeight:600 }}>
        <CheckCircle2 size={15}/>Email verifikasi berhasil dikirim ulang! Cek inbox.
      </div>
    )
  }

  return (
    <form action={onResend}>
      <input type="hidden" name="email" value={email}/>
      {rs?.error && (
        <div style={{ padding:'8px 12px', background:C.r50, borderRadius:'8px', fontSize:'12px', color:C.red, marginBottom:'10px' }}>
          {rs.error}
        </div>
      )}
      <button type="submit" disabled={rp || cd > 0}
        style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'10px', border:`1.5px solid ${cd>0 ? C.s200 : C.brand}`, background:cd>0?C.s100:C.b50, fontSize:'13px', fontWeight:700, color:cd>0?C.s400:C.brand, cursor:cd>0||rp?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s' }}>
        {rp ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>Mengirim...</>
           : cd > 0 ? `⏱ Kirim ulang dalam ${cd}s`
           : <><RefreshCw size={14}/>Kirim ulang email verifikasi</>}
      </button>
    </form>
  )
}

// ── Screen: verify email (normal flow) ────────────────────────
function VerifyScreen({ email }: { email: string }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:C.b50, border:`2px solid ${C.b100}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
        <Mail size={28} color={C.brand}/>
      </div>
      <h2 style={{ fontSize:'21px', fontWeight:700, color:C.s900, marginBottom:'8px' }}>Cek email kamu 📬</h2>
      <p style={{ fontSize:'13px', color:C.s500, marginBottom:'4px' }}>Link verifikasi dikirim ke:</p>
      <p style={{ fontSize:'15px', fontWeight:700, color:C.s900, marginBottom:'22px', wordBreak:'break-all' }}>{email}</p>

      <div style={{ padding:'14px 16px', background:C.b50, borderRadius:'12px', border:`1px solid ${C.b100}`, marginBottom:'14px', textAlign:'left' }}>
        <div style={{ fontSize:'12px', fontWeight:700, color:C.brand, marginBottom:'10px' }}>Langkah selanjutnya:</div>
        {[
          'Buka email kamu',
          'Cari email dari BeeSell AI — cek juga folder Spam/Junk/Promosi',
          'Klik tombol "Konfirmasi Email"',
          'Kamu otomatis login dan masuk ke onboarding ✨',
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginBottom: i<3?'8px':0 }}>
            <div style={{ width:'19px', height:'19px', borderRadius:'50%', background:C.brand, color:'#fff', fontSize:'10px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>{i+1}</div>
            <span style={{ fontSize:'12px', color:C.s700, lineHeight:1.5 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ padding:'10px 14px', background:C.a50, border:`1px solid #FCD34D`, borderRadius:'9px', fontSize:'12px', color:C.amber, marginBottom:'20px', textAlign:'left' }}>
        💡 Email dikirim dari <code style={{ background:'rgba(0,0,0,.06)', padding:'1px 5px', borderRadius:'4px' }}>noreply@mail.app.supabase.io</code>
      </div>

      <ResendForm email={email}/>

      <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:`1px solid ${C.s200}` }}>
        <Link href="/login" style={{ fontSize:'13px', color:C.brand, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'5px' }}>
          <ArrowRight size={13}/>Sudah verifikasi? Login sekarang
        </Link>
      </div>
    </div>
  )
}

// ── Screen: email failed (SMTP error) ─────────────────────────
function EmailFailedScreen({ email }: { email: string }) {
  return (
    <div style={{ textAlign:'center' }}>
      {/* Icon */}
      <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#FFF7ED', border:'2px solid #FED7AA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
        <MailX size={28} color="#EA580C"/>
      </div>

      <h2 style={{ fontSize:'20px', fontWeight:700, color:C.s900, marginBottom:'8px' }}>Akun dibuat, email gagal terkirim</h2>
      <p style={{ fontSize:'13px', color:C.s500, marginBottom:'4px' }}>Akun sudah berhasil dibuat untuk:</p>
      <p style={{ fontSize:'15px', fontWeight:700, color:C.s900, marginBottom:'22px', wordBreak:'break-all' }}>{email}</p>

      {/* Explanation */}
      <div style={{ padding:'14px 16px', background:'#FFF7ED', borderRadius:'12px', border:'1px solid #FED7AA', marginBottom:'16px', textAlign:'left' }}>
        <div style={{ fontSize:'12px', fontWeight:700, color:'#EA580C', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
          <Wifi size={13}/>Kenapa ini terjadi?
        </div>
        <p style={{ fontSize:'12px', color:C.s700, lineHeight:1.6, margin:0 }}>
          Supabase memiliki limit pengiriman email di free tier (<strong>4 email/jam</strong>). 
          Akun kamu sudah berhasil dibuat, tapi email verifikasi tidak bisa terkirim saat ini.
          Klik tombol di bawah untuk coba kirim ulang.
        </p>
      </div>

      {/* Resend */}
      <div style={{ marginBottom:'20px' }}>
        <p style={{ fontSize:'13px', color:C.s600, marginBottom:'12px', fontWeight:500 }}>
          Coba kirim ulang email verifikasi:
        </p>
        <ResendForm email={email}/>
      </div>

      {/* Alternative: use Google */}
      <div style={{ padding:'12px 16px', background:C.p50, borderRadius:'10px', border:`1px solid #DDD6FE`, textAlign:'left', marginBottom:'16px' }}>
        <div style={{ fontSize:'12px', fontWeight:700, color:C.purple, marginBottom:'6px' }}>💡 Alternatif lebih cepat</div>
        <p style={{ fontSize:'12px', color:C.s700, margin:'0 0 10px' }}>
          Gunakan Google Sign In dengan email yang sama — tidak perlu verifikasi email.
        </p>
        <GoogleBtn small/>
      </div>

      <div style={{ paddingTop:'14px', borderTop:`1px solid ${C.s200}` }}>
        <Link href="/login" style={{ fontSize:'13px', color:C.brand, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'5px' }}>
          <ArrowRight size={13}/>Coba login setelah verifikasi
        </Link>
      </div>
    </div>
  )
}

// ── Google button ──────────────────────────────────────────────
function GoogleBtn({ small }: { small?: boolean }) {
  const [loading, setLoading] = useState(false)
  return (
    <button type="button" disabled={loading}
      onClick={async () => { setLoading(true); await googleSignInAction() }}
      style={{
        width:'100%', padding: small ? '9px 14px' : '11px 16px',
        borderRadius:'10px', border:`1.5px solid ${C.s200}`,
        background: loading ? C.s100 : C.w,
        display:'flex', alignItems:'center', justifyContent:'center', gap:'9px',
        fontSize: small ? '13px' : '14px', fontWeight:600, color:C.s700,
        cursor:loading?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif",
        opacity:loading?.7:1, transition:'background .15s',
      }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = C.s100 }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = loading?C.s100:C.w }}
    >
      {loading
        ? <Loader2 size={small?14:17} style={{ animation:'spin 1s linear infinite' }}/>
        : <svg width="17" height="17" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.12-6.12C34.46 3.18 29.5 1 24 1 14.82 1 7.07 6.56 3.9 14.3l7.15 5.55C12.73 13.64 17.92 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.9 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.87c-.55 2.95-2.22 5.44-4.73 7.12l7.35 5.7C43.47 37.38 46.9 31.45 46.9 24.5z"/>
            <path fill="#FBBC05" d="M11.05 28.35A14.57 14.57 0 0 1 9.5 24c0-1.51.27-2.97.75-4.35L3.1 14.1A23.8 23.8 0 0 0 1 24c0 3.79.9 7.36 2.5 10.52l7.55-6.17z"/>
            <path fill="#34A853" d="M24 47c5.98 0 11-.2 14.73-5.52l-7.35-5.7C29.5 37.6 26.9 38.5 24 38.5c-6.08 0-11.27-4.14-13-9.85l-7.5 5.83C6.88 42.42 14.74 47 24 47z"/>
          </svg>
      }
      {loading ? 'Menghubungkan...' : 'Daftar dengan Google'}
    </button>
  )
}

// ── Auth wrapper ───────────────────────────────────────────────
function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 60%,#F0FDF4 100%)', padding:'20px', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:'440px' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🐝</div>
            <span style={{ fontFamily:'Georgia,serif', fontSize:'19px', fontWeight:700, color:C.s900 }}>BeeSell AI</span>
          </Link>
          {title && <h1 style={{ fontSize:'22px', fontWeight:700, color:C.s900, marginTop:'16px', marginBottom:'2px' }}>{title}</h1>}
          {subtitle && <p style={{ fontSize:'13px', color:C.s500, marginTop:'4px' }}>{subtitle}</p>}
        </div>
        <div style={{ background:C.w, borderRadius:'20px', border:'1px solid #E2E8F0', padding:'28px', boxShadow:'0 4px 24px rgba(37,99,235,.07)' }}>
          {children}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, null)
  const [showPw, setShowPw]      = useState(false)
  const [pw,     setPw]          = useState('')
  const [email,  setEmail]       = useState('')

  // ── Render verify-email screen ──────────────────────────────
  if (state?.hint === 'verify-email') {
    return (
      <AuthCard title="">
        <VerifyScreen email={state.email ?? email}/>
      </AuthCard>
    )
  }

  // ── Render email-failed screen (SMTP error) ─────────────────
  if (state?.hint === 'email-failed') {
    return (
      <AuthCard title="">
        <EmailFailedScreen email={state.email ?? email}/>
      </AuthCard>
    )
  }

  // ── Render register form ────────────────────────────────────
  const errName  = state?.field === 'name'     ? state.error : undefined
  const errEmail = state?.field === 'email'    ? state.error : undefined
  const errPw    = state?.field === 'password' ? state.error : undefined
  const errGen   = !state?.field && !state?.success && state?.error ? state.error : undefined
  const isDupe   = state?.hint === 'duplicate'

  return (
    <AuthCard title="Daftar Gratis" subtitle="Tidak perlu kartu kredit · Setup 5 menit">

      <GoogleBtn/>

      {/* Divider */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'16px 0' }}>
        <div style={{ flex:1, height:'1px', background:C.s200 }}/>
        <span style={{ fontSize:'12px', color:C.s400 }}>atau dengan email</span>
        <div style={{ flex:1, height:'1px', background:C.s200 }}/>
      </div>

      {/* Duplicate email */}
      {isDupe && errEmail && (
        <div style={{ padding:'12px 14px', background:C.a50, border:`1px solid #FCD34D`, borderRadius:'11px', marginBottom:'14px' }}>
          <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
            <AlertCircle size={15} color={C.amber} style={{ flexShrink:0, marginTop:'1px' }}/>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:C.amber, marginBottom:'5px' }}>Email sudah terdaftar</div>
              <div style={{ fontSize:'12px', color:C.s700, marginBottom:'12px' }}>{errEmail}</div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                <Link href="/login" style={{ padding:'6px 16px', borderRadius:'8px', background:C.brand, color:'#fff', textDecoration:'none', fontSize:'12px', fontWeight:700 }}>Login sekarang</Link>
                <Link href="/forgot-password" style={{ padding:'6px 16px', borderRadius:'8px', border:`1px solid ${C.s200}`, background:C.w, color:C.s700, textDecoration:'none', fontSize:'12px', fontWeight:600 }}>Lupa password?</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General error */}
      {errGen && !isDupe && (
        <div style={{ padding:'10px 13px', background:C.r50, border:'1px solid #FECACA', borderRadius:'9px', marginBottom:'14px', fontSize:'12px', color:C.red, display:'flex', gap:'7px', alignItems:'center' }}>
          <AlertCircle size={13}/>{errGen}
        </div>
      )}

      {/* Form */}
      {!isDupe && (
        <form action={action} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:C.s600, display:'block', marginBottom:'6px' }}>
              Nama Lengkap <span style={{ color:C.red }}>*</span>
            </label>
            <input name="name" type="text" placeholder="Nama lengkap kamu"
              required autoComplete="name"
              style={inputStyle(errName)}
              onFocus={e => onFocus(e, errName)} onBlur={e => onBlur(e, errName)}
            />
            {errName && <p style={{ fontSize:'11px', color:C.red, marginTop:'4px', display:'flex', gap:'4px', alignItems:'center' }}><AlertCircle size={10}/>{errName}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:C.s600, display:'block', marginBottom:'6px' }}>
              Email <span style={{ color:C.red }}>*</span>
            </label>
            <input name="email" type="email" placeholder="email@kamu.com"
              required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle(errEmail && !isDupe ? errEmail : undefined)}
              onFocus={e => onFocus(e, errEmail)} onBlur={e => onBlur(e, errEmail)}
            />
            {errEmail && !isDupe && <p style={{ fontSize:'11px', color:C.red, marginTop:'4px', display:'flex', gap:'4px', alignItems:'center' }}><AlertCircle size={10}/>{errEmail}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:C.s600, display:'block', marginBottom:'6px' }}>
              Password <span style={{ color:C.red }}>*</span>
            </label>
            <div style={{ position:'relative' }}>
              <input name="password" type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 karakter, 1 kapital, 1 angka"
                required autoComplete="new-password"
                value={pw} onChange={e => setPw(e.target.value)}
                style={{ ...inputStyle(errPw), paddingRight:'44px' }}
                onFocus={e => onFocus(e, errPw)} onBlur={e => onBlur(e, errPw)}
              />
              <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.s400, display:'flex', padding:0 }}>
                {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
            {errPw && <p style={{ fontSize:'11px', color:C.red, marginTop:'4px', display:'flex', gap:'4px', alignItems:'center' }}><AlertCircle size={10}/>{errPw}</p>}
            <PwStrength pw={pw}/>
          </div>

          {/* Submit */}
          <button type="submit" disabled={pending}
            style={{ width:'100%', padding:'13px', borderRadius:'11px', border:'none', background:pending?C.s200:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:pending?C.s400:'#fff', fontSize:'14px', fontWeight:700, cursor:pending?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:pending?'none':'0 4px 14px rgba(37,99,235,.35)', marginTop:'4px', transition:'all .15s' }}>
            {pending
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Membuat akun...</>
              : 'Buat Akun Gratis →'
            }
          </button>
        </form>
      )}

      <p style={{ textAlign:'center', fontSize:'13px', color:C.s500, marginTop:'16px' }}>
        Sudah punya akun? <Link href="/login" style={{ color:C.brand, fontWeight:600, textDecoration:'none' }}>Login</Link>
      </p>
      <p style={{ textAlign:'center', fontSize:'11px', color:C.s400, marginTop:'8px', lineHeight:1.5 }}>
        Dengan mendaftar kamu setuju dengan <Link href="/terms" style={{ color:C.s400, textDecoration:'underline' }}>Ketentuan</Link> &amp; <Link href="/privacy" style={{ color:C.s400, textDecoration:'underline' }}>Privasi</Link>.
      </p>
    </AuthCard>
  )
}