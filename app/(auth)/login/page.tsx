'use client'
// app/(auth)/login/page.tsx — BeeSell AI Premium Login Portal v7.0
// Copywriting: Fully aligned for Individual Online Sellers & Affiliate Marketers (Perorangan)
// Design Specification: Ultra-Luxury SaaS (Minimalist Centered Glassmorphism Architecture)
// Animation Hub: 2D Mindblowing Quantum Nodes, Matrix Circuit Flows, and Reactive Neon Glow Trails

import { useActionState, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginAction, googleSignInAction, resendVerificationAction } from '@/lib/auth/actions'
import type { AuthResult } from '@/lib/auth/actions'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

// 1. BRAND LUXURY ARCHITECTURE LIGHT-MODE COLOR TOKENS
const C = {
  brand: '#F59E0B',        // Bee Gold
  brandDark: '#D97706',    // Honey Deep
  brandLight: '#FEF3C7',   // Honey Cream
  brandBg: '#FFFBEB',      // Honey Mist

  // Bee Accent
  pollen: '#FBBF24',
  honey: '#F59E0B',
  nectar: '#FCD34D',

  // Hive Neutrals
  hive900: '#111827',
  hive800: '#1F2937',
  hive700: '#374151',
  hive600: '#4B5563',
  hive500: '#6B7280',
  hive400: '#9CA3AF',
  hive300: '#D1D5DB',
  hive200: '#E5E7EB',
  hive100: '#F3F4F6',

  // Semantic
  success: '#10B981',
  successBg: '#ECFDF5',

  danger: '#EF4444',
  dangerBg: '#FEF2F2',

  warning: '#F97316',
  warningBg: '#FFF7ED',

  info: '#F59E0B',
  infoBg: '#FFFBEB',

  // Surface
  white: '#FFFFFF',
  bg: '#FAFAF9',
  surface: '#FFFFFF',

  // Effects
  shadow:
    '0 4px 20px rgba(245,158,11,.12)',

  glow:
    '0 0 24px rgba(245,158,11,.25)',

  brandGlow:
    '0 8px 30px rgba(245,158,11,.28)',
  
  error: '#DC2626',
  error50: '#FEF2F2',
 
  green50: '#ECFDF5',
  amber50: '#FFFBEB',
  g1: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Honey Luxury Gradient
  cyberDark: '#1E1B4B',
}

function inputStyle(hasErr: boolean): React.CSSProperties {
  return { 
    width: '100%', 
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderRadius: '12px',
    border: `1.5px solid ${hasErr ? C.error : 'rgba(217, 119, 6, 0.15)'}`,
    background: hasErr ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(4px)',
    fontSize: '14px', 
    fontFamily: "'DM Sans', sans-serif",
    color: C.hive900, 
    outline: 'none', 
    boxSizing: 'border-box' as const, 
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
  }
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
    <div className="cyber-matrix-mesh" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FFFDF9', padding:'clamp(16px, 4vw, 32px)', position: 'relative', overflow: 'hidden', fontFamily:"'DM Sans',sans-serif" }}>
      
      {/* MINDBLOWING 2D HIGH-TECH SIRKUIT DECORATION BACKGROUND NODES */}
      <div className="quantum-ambient-node color-1" style={{ position: 'absolute', top: '15%', left: '10%', width: '28vw', height: '28vw', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(35px)' }} />
      <div className="quantum-ambient-node color-2" style={{ position: 'absolute', bottom: '10%', right: '5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(45px)' }} />

      {/* FLOATING 2D GEOMETRIC TECH CHIPS */}
      <div className="floating-tech-chip chip-1" style={{ position: 'absolute', top: '25%', left: '15%', width: '32px', height: '32px', border: '1.5px dashed rgba(217,119,6,0.25)', borderRadius: '8px', zIndex: 1, pointerEvents: 'none' }} />
      <div className="floating-tech-chip chip-2" style={{ position: 'absolute', bottom: '25%', right: '12%', width: '48px', height: '48px', border: '1.5px solid rgba(245,158,11,0.2)', borderRadius: '12px', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ width:'100%', maxWidth:'440px', position: 'relative', zIndex: 10 }}>

        {/* Logo Branding */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
            <div className="brand-logo-capsule" style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 8px 20px rgba(245,158,11,0.2)' }}>🐝</div>
            <span style={{ fontSize:'22px', fontWeight:800, color:C.hive900, letterSpacing: '-0.02em' }}>BeeSell <span style={{ color: C.brand }}>AI</span></span>
          </Link>
          <h1 style={{ fontSize:'24px', fontWeight:800, color:C.hive900, marginTop:'18px', marginBottom:'4px', letterSpacing: '-0.02em' }}>Selamat datang kembali</h1>
          <p style={{ fontSize:'13px', color:C.hive500, fontWeight: 500 }}>Masuk ke akun BeeSell AI kamu</p>
        </div>

        {/* LUXURY MINIMALIST CENTERED GLASSMORPHISM CONTAINER CARD */}
        <div className="luxury-glass-card" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderRadius: '30px', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '32px', boxShadow: '0 30px 70px -20px rgba(217,119,6,0.1), inset 0 1px 0 rgba(255,255,255,0.8)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Quantum Fusion Laser Scanner Line Overlay */}
          <div className="tech-laser-scanline" />

          {/* Success message (e.g. after logout) */}
          {urlMessage && (
            <div style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', color: C.success, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              <CheckCircle2 size={15}/>{decodeURIComponent(urlMessage)}
            </div>
          )}

          {/* URL error (from callback redirect) */}
          {urlError && (
            <div style={{ padding: '12px 14px', background: 'rgba(220, 38, 38, 0.05)', border: `1px solid rgba(220, 38, 38, 0.15)`, borderRadius: '12px', marginBottom: '16px', fontSize: '13px', color: C.error, display: 'flex', gap: '8px', alignItems: 'flex-start', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:'1px' }}/>{decodeURIComponent(urlError)}
            </div>
          )}

          {/* Google */}
          <GoogleBtn/>

          <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'20px 0' }}>
            <div style={{ flex:1, height:'1px', background:'rgba(217, 119, 6, 0.12)' }}/><span style={{ fontSize:'12px', color:C.hive400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>atau dengan email</span><div style={{ flex:1, height:'1px', background:'rgba(217, 119, 6, 0.12)' }}/>
          </div>

          {/* Email not verified warning */}
          {needsVerify && (
            <div style={{ padding:'14px', background:'rgba(245, 158, 11, 0.05)', border:'1px solid rgba(245, 158, 11, 0.25)', borderRadius:'14px', marginBottom:'16px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:C.brandDark, marginBottom:'4px' }}>Email belum diverifikasi</div>
              <div style={{ fontSize:'12px', color:C.hive600, marginBottom:'12px', lineHeight: 1.5 }}>{errEmail}</div>
              {rs?.success
                ? <div style={{ fontSize:'12px', color:C.success, display:'flex', gap:'6px', fontWeight: 600 }}><CheckCircle2 size={14}/>Email verifikasi dikirim! Cek inbox kamu.</div>
                : (
                  <form action={onResend}>
                    <input type="hidden" name="email" value={email}/>
                    {rs?.error && <p style={{ fontSize:'12px', color:C.error, marginBottom:'8px', fontWeight: 600 }}>{rs.error}</p>}
                    <button type="submit" disabled={rp||cd>0}
                      className="btn-cyber-action"
                      style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'10px', border:`1px solid ${C.brand}`, background:'rgba(255,255,255,0.6)', fontSize:'12px', fontWeight:700, color:C.brandDark, cursor:cd>0||rp?'not-allowed':'pointer', transition: 'all 0.2s' }}>
                      {rp ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/>
                          : <RefreshCw size={12}/>}
                      {cd > 0 ? `Kirim ulang (${cd}s)` : 'Kirim ulang email verifikasi'}
                    </button>
                  </form>
                )
              }
            </div>
          )}

          {/* General error */}
          {errGen && (
            <div style={{ padding: '12px 14px', background: 'rgba(220, 38, 38, 0.05)', border: `1px solid rgba(220, 38, 38, 0.15)`, borderRadius: '12px', marginBottom: '16px', fontSize: '13px', color: C.error, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              <AlertCircle size={15}/>{errGen}
            </div>
          )}

          {/* Login form */}
          <form action={action} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
            <div>
              <label style={{ fontSize:'12px', fontWeight:700, color:C.hive600, display:'block', marginBottom:'6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Email <span style={{ color:C.error }}>*</span></label>
              <input name="email" type="email" placeholder="email@kamu.com" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle(!!errEmail && !needsVerify)}
                className="input-cyber-lux"
              />
              {errEmail && !needsVerify && <p style={{ fontSize:'12px', color:C.error, marginTop:'6px', fontWeight: 600 }}>{errEmail}</p>}
            </div>

            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <label style={{ fontSize:'12px', fontWeight:700, color:C.hive600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Password <span style={{ color:C.error }}>*</span></label>
                <Link href="/forgot-password" className="link-cyber-hover" style={{ fontSize:'12px', color:C.brand, textDecoration:'none', fontWeight:700 }}>Lupa password?</Link>
              </div>
              <div style={{ position:'relative' }}>
                <input name="password" type={showPw?'text':'password'} placeholder="Password kamu" required autoComplete="current-password"
                  style={{ ...inputStyle(!!errPw), paddingRight:'44px' }}
                  className="input-cyber-lux"
                />
                <button type="button" onClick={() => setShowPw(p=>!p)} tabIndex={-1}
                  style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.hive400, display:'flex', padding:0 }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errPw && (
                <div style={{ marginTop:'6px' }}>
                  <p style={{ fontSize:'12px', color:C.error, marginBottom:'6px', fontWeight: 600 }}>{errPw}</p>
                  
                </div>
              )}
            </div>

            <button type="submit" disabled={pending} className="btn-luxury"
              style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'none', background:pending?C.hive200:C.g1, color:pending?C.hive400:C.white, fontSize:'14px', fontWeight:700, cursor:pending?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:pending?'none':'0 8px 24px -6px rgba(217,119,6,0.35)', transition:'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {pending ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/>Masuk...</> : 'Masuk →'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:'13px', color:C.hive500, marginTop:'20px', fontWeight: 500 }}>
            Belum punya akun? <Link href="/register" className="link-cyber-hover" style={{ color:C.brand, fontWeight:700, textDecoration:'none' }}>Daftar gratis</Link>
          </p>
        </div>
      </div>

      {/* ── HIGH TECH LUXURY INTERACTIVE SAAS STYLE ENGINE ── */}
      <style>{`
        * { box-sizing: border-box; }
        
        /* Interactive Honey Grid Circuit Mesh Backing Moving Animation */
        .cyber-matrix-mesh {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(217, 119, 6, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(217, 119, 6, 0.05) 1px, transparent 1px);
          animation: matrixFlow 22s linear infinite;
        }
        @keyframes matrixFlow {
          0% { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }

        /* 2D Mindblowing Floating Quantum and Chip Animations */
        @keyframes driftNodes {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(25px, -20px) rotate(4deg) scale(1.08); }
        }
        .quantum-ambient-node {
          animation: driftNodes 12s ease-in-out infinite;
        }
        .quantum-ambient-node.color-2 {
          animation-duration: 14s;
          animation-delay: -6s;
        }

        @keyframes microRotate {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(180deg); opacity: 0.4; }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        .floating-tech-chip {
          animation: microRotate 16s linear infinite;
        }
        .floating-tech-chip.chip-2 {
          animation-duration: 22s;
          animation-delay: -4s;
        }

        /* Centered Glassmorphism 3D Magnetic Response Frame Effect */
        .luxury-glass-card {
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease, border-color 0.6s ease;
        }
        .luxury-glass-card:hover {
          transform: perspective(1400px) rotateX(1.5deg) rotateY(-0.5deg) translateY(-3px);
          box-shadow: 0 45px 85px -25px rgba(217,119,6,0.08), 0 15px 30px -15px rgba(245,158,11,0.04), inset 0 1px 0 rgba(255,255,255,0.95) !important;
          border-color: rgba(245, 158, 11, 0.3) !important;
        }

        /* Advanced Dual Precision Laser Scanning Line Beam Overlay (Amber Tech Glow) */
        .tech-laser-scanline {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 2.5px;
          background: linear-gradient(90deg, transparent, #F59E0B, #FBBF24, #D97706, transparent);
          animation: laserSlideDown 5.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          opacity: 0.6;
          pointer-events: none;
        }
        @keyframes laserSlideDown {
          0% { transform: translateY(-10px); opacity: 0; }
          4% { opacity: 1; }
          96% { opacity: 1; }
          100% { transform: translateY(640px); opacity: 0; }
        }

        /* High-End Atomic Input Focusing Frames */
        .input-cyber-lux:focus {
          border-color: #D97706 !important;
          background: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 0 0 4px rgba(245,158,11,0.12) !important;
          transform: translateY(-0.5px);
        }

        /* Micro-Animations and Scale Elements */
        .btn-luxury:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(217,119,6,0.45) !important;
          filter: brightness(1.03);
        }
        .brand-logo-capsule:hover {
          transform: scale(1.04) translateY(-1px);
          filter: brightness(1.05);
        }
        .btn-cyber-action:hover {
          background: rgba(255, 255, 255, 0.95) !important;
          border-color: #D97706 !important;
        }
        .link-cyber-hover:hover {
          text-decoration: underline !important;
          filter: brightness(1.15);
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function GoogleBtn() {
  const [loading, setLoading] = useState(false)
  return (
    <button type="button" disabled={loading}
      onClick={async () => { setLoading(true); await googleSignInAction() }}
      className="btn-cyber-action"
      style={{ width:'100%', padding:'12px 16px', borderRadius:'12px', border:'1.5px solid rgba(217, 119, 6, 0.15)', background:loading?'#FFFBEB':'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'14px', fontWeight:700, color:C.hive700, cursor:loading?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", opacity:loading?.7:1, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
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
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: '#FFFDF9' }}><Loader2 size={28} style={{ animation:'spin 1s linear infinite', color:'#F59E0B' }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <LoginContent/>
    </Suspense>
  )
}