'use client'
// app/(auth)/register/page.tsx — SMTP-AWARE — BeeSell AI Premium Register Portal v7.0
// Copywriting: Fully aligned for Individual Online Sellers & Affiliate Marketers (Perorangan)
// Design Specification: Ultra-Luxury SaaS (Minimalist Centered Glassmorphism Architecture)
// Animation Hub: 2D Mindblowing Quantum Nodes, Matrix Circuit Flows, and Reactive Neon Glow Trails

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  registerAction, googleSignInAction, resendVerificationAction,
} from '@/lib/auth/actions'
import type { AuthResult } from '@/lib/auth/actions'
import { Eye, EyeOff, Loader2, AlertCircle, Mail, RefreshCw, CheckCircle2, ArrowRight, MailX, Wifi } from 'lucide-react'

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

  // Legacy mappings backup to preserve core rendering variables safely
  amber: '#F59E0B', amberDk: '#D97706', amberLt: '#FEF3C7', amberXlt: '#FFFBEB',
  whiteLg: '#FFFFFF', bgLg: '#F9FAFB', surfaceLg: '#FFFFFF',
  borderLg: '#E5E7EB', borderHiLg: '#D1D5DB',
  ink: '#111827', inkSub: '#374151', inkMuted: '#6B7280', inkDim: '#9CA3AF',
  green: '#059669', greenLt: '#ECFDF5', greenDk: '#047857',
  blue: '#3B82F6',  blueLt: '#EFF6FF',
  purple: '#7C3AED', purpleLt: '#F5F3FF',
  red: '#EF4444',   redLt: '#FEF2F2',
  orange: '#F97316', orangeLt: '#FFF7ED',
  r50: 'rgba(220, 38, 38, 0.05)', g50: 'rgba(16, 185, 129, 0.08)', a50: 'rgba(245, 158, 11, 0.05)', p50: 'rgba(124, 58, 237, 0.05)',
  s900: '#0F172A', s700: '#334155', s600: '#475569', s500: '#64748B',
  s400: '#94A3B8', s200: '#E2E8F0', s100: '#F1F5F9', w: '#fff',
}

// ── Shared helpers ─────────────────────────────────────────────
function inputStyle(err?: string): React.CSSProperties {
  return {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: `1.5px solid ${err ? C.error : 'rgba(217, 119, 6, 0.15)'}`,
    background: err ? C.r50 : 'rgba(255, 255, 255, 0.75)', 
    backdropFilter: 'blur(4px)',
    fontSize: '14px',
    fontFamily: "'DM Sans',sans-serif", color: C.hive900,
    outline: 'none', boxSizing: 'border-box' as const, 
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  }
}
function onFocus(e: React.FocusEvent<HTMLInputElement>, err?: string) {
  if (!err) {
    e.currentTarget.style.borderColor = C.brandDark
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(245,158,11,0.12)'
    e.currentTarget.style.transform = 'translateY(-0.5px)'
  }
}
function onBlur(e: React.FocusEvent<HTMLInputElement>, err?: string) {
  if (!err) {
    e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.15)'
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.75)'
    e.currentTarget.style.boxShadow = 'none'
    e.currentTarget.style.transform = 'none'
  }
}

// ── Password strength ──────────────────────────────────────────
function PwStrength({ pw }: { pw: string }) {
  if (!pw) return null
  const c = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw)]
  const n = c.filter(Boolean).length
  const col = ['', C.red, C.brand, C.success][n]
  const lbl = ['', 'Lemah', 'Cukup', 'Kuat'][n]
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
        {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= n ? col : C.hive200, transition: 'background .2s' }}/>)}
      </div>
      <div style={{ display: 'flex', gap: '12px', fontSize: '10px', fontWeight: 600 }}>
        {['≥8 char', '1 kapital', '1 angka'].map((l, i) => (
          <span key={l} style={{ color: c[i] ? C.success : C.hive400 }}>{c[i] ? '✓' : '○'} {l}</span>
        ))}
        {n > 0 && <span style={{ marginLeft: 'auto', fontWeight: 700, color: col }}>{lbl}</span>}
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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', fontSize: '13px', color: C.success, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
        <CheckCircle2 size={15}/>Email verifikasi berhasil dikirim ulang! Cek inbox.
      </div>
    )
  }

  return (
    <form action={onResend}>
      <input type="hidden" name="email" value={email}/>
      {rs?.error && (
        <div style={{ padding: '12px 14px', background: C.r50, border: `1px solid rgba(220, 38, 38, 0.15)`, borderRadius: '12px', fontSize: '12px', color: C.error, marginBottom: '10px', fontWeight: 600 }}>
          {rs.error}
        </div>
      )}
      <button type="submit" disabled={rp || cd > 0} className="btn-cyber-action"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '10px', border: `1.5px solid ${cd > 0 ? C.hive200 : C.brand}`, background: cd > 0 ? C.hive100 : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 700, color: cd > 0 ? C.hive400 : C.brandDark, cursor: cd > 0 || rp ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s' }}>
        {rp ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/>Mengirim...</>
           : cd > 0 ? `⏱ Kirim ulang dalam ${cd}s`
           : <><RefreshCw size={14}/>Kirim ulang email verifikasi</>}
      </button>
    </form>
  )
}

// ── Screen: verify email (normal flow) ────────────────────────
function VerifyScreen({ email }: { email: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.08)', border: `1px solid rgba(245, 158, 11, 0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 24px rgba(245,158,11,0.06)' }}>
        <Mail size={26} color={C.brandDark}/>
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.hive900, marginBottom: '8px', letterSpacing: '-0.02em' }}>Cek email kamu 📬</h2>
      <p style={{ fontSize: '13px', color: C.hive500, marginBottom: '4px', fontWeight: 500 }}>Link verifikasi dikirim ke:</p>
      <p style={{ fontSize: '15px', fontWeight: 700, color: C.hive900, marginBottom: '22px', wordBreak: 'break-all' }}>{email}</p>

      <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)', borderRadius: '14px', border: `1px solid ${C.hive200}`, marginBottom: '16px', textAlign: 'left' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: C.brandDark, marginBottom: '10px' }}>Langkah selanjutnya:</div>
        {[
          'Buka email kamu',
          'Cari email dari BeeSell AI — cek juga folder Spam/Junk/Promosi',
          'Klik tombol "Konfirmasi Email"',
          'Kamu otomatis login dan masuk ke onboarding ✨',
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: i < 3 ? '8px' : 0 }}>
            <div style={{ width: '19px', height: '19px', borderRadius: '50%', background: C.brand, color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
            <span style={{ fontSize: '12px', color: C.hive700, lineHeight: 1.5, fontWeight: 500 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 14px', background: 'rgba(245, 158, 11, 0.05)', border: `1px solid rgba(245, 158, 11, 0.2)`, borderRadius: '12px', fontSize: '12px', color: C.brandDark, marginBottom: '20px', textAlign: 'left', fontWeight: 500 }}>
        💡 Email dikirim dari <code style={{ background: 'rgba(217,119,6,0.08)', padding: '2px 5px', borderRadius: '4px', fontWeight: 700 }}>noreply@mail.app.supabase.io</code>
      </div>

      <ResendForm email={email}/>

      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid rgba(217, 119, 6, 0.12)` }}>
        <Link href="/login" className="link-cyber-hover" style={{ fontSize: '13px', color: C.brand, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <ArrowRight size={13}/>Sudah verifikasi? Login sekarang
        </Link>
      </div>
    </div>
  )
}

// ── Screen: email failed (SMTP error) ─────────────────────────
function EmailFailedScreen({ email }: { email: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Icon */}
      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 24px rgba(234,88,12,0.06)' }}>
        <MailX size={26} color="#EA580C"/>
      </div>

      <h2 style={{ fontSize: '21px', fontWeight: 800, color: C.hive900, marginBottom: '8px', letterSpacing: '-0.02em' }}>Akun dibuat, email gagal terkirim</h2>
      <p style={{ fontSize: '13px', color: C.hive500, marginBottom: '4px', fontWeight: 500 }}>Akun sudah berhasil dibuat untuk:</p>
      <p style={{ fontSize: '15px', fontWeight: 700, color: C.hive900, marginBottom: '22px', wordBreak: 'break-all' }}>{email}</p>

      {/* Explanation */}
      <div style={{ padding: '14px 16px', background: '#FFF7ED', borderRadius: '14px', border: '1px solid #FED7AA', marginBottom: '16px', textAlign: 'left' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#EA580C', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wifi size={14}/>Kenapa ini terjadi?
        </div>
        <p style={{ fontSize: '12px', color: C.hive700, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
          Supabase memiliki limit pengiriman email di free tier (<strong>4 email/jam</strong>). 
          Akun kamu sudah berhasil dibuat, tapi email verifikasi tidak bisa terkirim saat ini.
          Klik tombol di bawah untuk coba kirim ulang.
        </p>
      </div>

      {/* Resend */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: C.hive600, marginBottom: '12px', fontWeight: 600 }}>
          Coba kirim ulang email verifikasi:
        </p>
        <ResendForm email={email}/>
      </div>

      {/* Alternative: use Google */}
      <div style={{ padding: '14px', background: 'rgba(124, 92, 255, 0.04)', borderRadius: '14px', border: `1px solid #DDD6FE`, textAlign: 'left', marginBottom: '16px', backdropFilter: 'blur(4px)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: C.purple, marginBottom: '6px' }}>💡 Alternatif lebih cepat</div>
        <p style={{ fontSize: '12px', color: C.hive700, margin: '0 0 12px', lineHeight: 1.5, fontWeight: 500 }}>
          Gunakan Google Sign In dengan email yang sama — tidak perlu verifikasi email.
        </p>
        <GoogleBtn small/>
      </div>

      <div style={{ paddingTop: '14px', borderTop: `1px solid rgba(217, 119, 6, 0.12)` }}>
        <Link href="/login" className="link-cyber-hover" style={{ fontSize: '13px', color: C.brand, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
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
      className="btn-cyber-action"
      style={{
        width: '100%', padding: small ? '10px 14px' : '12px 16px',
        borderRadius: '12px', border: `1.5px solid rgba(217, 119, 6, 0.15)`,
        background: loading ? '#FFFBEB' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
        fontSize: small ? '13px' : '14px', fontWeight: 700, color: C.hive700,
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif",
        opacity: loading ? .7 : 1, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {loading
        ? <Loader2 size={small ? 14 : 17} style={{ animation: 'spin 1s linear infinite' }}/>
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
    <div className="cyber-matrix-mesh" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFDF9', padding: 'clamp(16px, 4vw, 32px)', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans',sans-serif" }}>
      
      {/* MINDBLOWING 2D HIGH-TECH SIRKUIT DECORATION BACKGROUND NODES */}
      <div className="quantum-ambient-node color-1" style={{ position: 'absolute', top: '15%', left: '10%', width: '28vw', height: '28vw', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(35px)' }} />
      <div className="quantum-ambient-node color-2" style={{ position: 'absolute', bottom: '10%', right: '5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(45px)' }} />

      {/* FLOATING 2D GEOMETRIC TECH CHIPS */}
      <div className="floating-tech-chip chip-1" style={{ position: 'absolute', top: '25%', left: '15%', width: '32px', height: '32px', border: '1.5px dashed rgba(217,119,6,0.25)', borderRadius: '8px', zIndex: 1, pointerEvents: 'none' }} />
      <div className="floating-tech-chip chip-2" style={{ position: 'absolute', bottom: '25%', right: '12%', width: '48px', height: '48px', border: '1.5px solid rgba(245,158,11,0.2)', borderRadius: '12px', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        
        {/* Logo Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div className="brand-logo-capsule" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 8px 20px rgba(245,158,11,0.2)' }}>🐝</div>
            <span style={{ fontSize: '22px', fontWeight: 800, color: C.hive900, letterSpacing: '-0.02em' }}>BeeSell <span style={{ color: C.brand }}>AI</span></span>
          </Link>
          {title && <h1 style={{ fontSize: '24px', fontWeight: 800, color: C.hive900, marginTop: '18px', marginBottom: '4px', letterSpacing: '-0.02em' }}>{title}</h1>}
          {subtitle && <p style={{ fontSize: '13px', color: C.hive500, fontWeight: 500, marginTop: '4px' }}>{subtitle}</p>}
        </div>

        {/* LUXURY MINIMALIST CENTERED GLASSMORPHISM CONTAINER CARD */}
        <div className="luxury-glass-card" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderRadius: '30px', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '32px', boxShadow: '0 30px 70px -20px rgba(217,119,6,0.1), inset 0 1px 0 rgba(255,255,255,0.8)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Quantum Fusion Laser Scanner Line Overlay */}
          <div className="tech-laser-scanline" />
          
          {children}
        </div>
      </div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(217, 119, 6, 0.12)' }}/>
        <span style={{ fontSize: '12px', color: C.hive400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>atau dengan email</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(217, 119, 6, 0.12)' }}/>
      </div>

      {/* Duplicate email */}
      {isDupe && errEmail && (
        <div style={{ padding: '14px', background: 'rgba(245, 158, 11, 0.05)', border: `1px solid rgba(245, 158, 11, 0.25)`, borderRadius: '14px', marginBottom: '16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={15} color={C.brandDark} style={{ flexShrink: 0, marginTop: '2px' }}/>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: C.brandDark, marginBottom: '5px' }}>Email sudah terdaftar</div>
              <div style={{ fontSize: '12px', color: C.hive700, marginBottom: '12px', lineHeight: 1.5 }}>{errEmail}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link href="/login" className="btn-luxury" style={{ padding: '8px 16px', borderRadius: '10px', background: C.g1, color: '#fff', textDecoration: 'none', fontSize: '12px', fontWeight: 700, boxShadow: '0 4px 12px rgba(217,119,6,0.2)' }}>Login sekarang</Link>
                <Link href="/forgot-password" className="btn-cyber-action" style={{ padding: '8px 16px', borderRadius: '10px', border: `1.5px solid rgba(217, 119, 6, 0.15)`, background: 'rgba(255,255,255,0.6)', color: C.hive700, textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>Lupa password?</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General error */}
      {errGen && !isDupe && (
        <div style={{ padding: '12px 14px', background: C.r50, border: '1px solid rgba(220, 38, 38, 0.15)', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', color: C.error, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
          <AlertCircle size={15}/>{errGen}
        </div>
      )}

      {/* Form */}
      {!isDupe && (
        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.hive600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Nama Lengkap <span style={{ color: C.error }}>*</span>
            </label>
            <input name="name" type="text" placeholder="Nama lengkap kamu"
              required autoComplete="name"
              style={inputStyle(errName)}
              onFocus={e => onFocus(e, errName)} onBlur={e => onBlur(e, errName)}
              className="input-cyber-lux"
            />
            {errName && <p style={{ fontSize: '12px', color: C.error, marginTop: '6px', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 600 }}><AlertCircle size={12}/>{errName}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.hive600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Email <span style={{ color: C.error }}>*</span>
            </label>
            <input name="email" type="email" placeholder="email@kamu.com"
              required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle(errEmail && !isDupe ? errEmail : undefined)}
              onFocus={e => onFocus(e, errEmail)} onBlur={e => onBlur(e, errEmail)}
              className="input-cyber-lux"
            />
            {errEmail && !isDupe && <p style={{ fontSize: '12px', color: C.error, marginTop: '6px', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 600 }}><AlertCircle size={12}/>{errEmail}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.hive600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Password <span style={{ color: C.error }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input name="password" type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 karakter, 1 kapital, 1 angka"
                required autoComplete="new-password"
                value={pw} onChange={e => setPw(e.target.value)}
                style={{ ...inputStyle(errPw), paddingRight: '44px' }}
                onFocus={e => onFocus(e, errPw)} onBlur={e => onBlur(e, errPw)}
                className="input-cyber-lux"
              />
              <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.hive400, display: 'flex', padding: 0 }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {errPw && <p style={{ fontSize: '12px', color: C.error, marginTop: '6px', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 600 }}><AlertCircle size={12}/>{errPw}</p>}
            <PwStrength pw={pw}/>
          </div>

          {/* Submit */}
          <button type="submit" disabled={pending} className="btn-luxury"
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: pending ? C.hive200 : C.g1, color: pending ? C.hive400 : C.white, fontSize: '14px', fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: pending ? 'none' : '0 8px 24px -6px rgba(217,119,6,0.35)', marginTop: '4px', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {pending
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/>Membuat akun...</>
              : 'Buat Akun Gratis →'
            }
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', fontSize: '13px', color: C.hive500, marginTop: '20px', fontWeight: 500 }}>
        Sudah punya akun? <Link href="/login" className="link-cyber-hover" style={{ color: C.brand, fontWeight: 700, textDecoration: 'none' }}>Login</Link>
      </p>
      <p style={{ textAlign: 'center', fontSize: '11px', color: C.hive400, marginTop: '12px', lineHeight: 1.6, fontWeight: 500 }}>
        Dengan mendaftar kamu setuju dengan <Link href="/terms" className="link-cyber-hover" style={{ color: C.hive500, textDecoration: 'underline' }}>Ketentuan</Link> &amp; <Link href="/privacy" className="link-cyber-hover" style={{ color: C.hive500, textDecoration: 'underline' }}>Privasi</Link>.
      </p>
    </AuthCard>
  )
}