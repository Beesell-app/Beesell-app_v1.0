'use client'
// apps/web-app/app/(auth)/forgot-password/page.tsx — BeeSell AI Premium Forgot Password Portal v7.0
// Copywriting: Fully aligned for Individual Online Sellers & Affiliate Marketers (Perorangan)
// Design Specification: Ultra-Luxury SaaS (Minimalist Centered Glassmorphism Architecture)
// Animation Hub: 2D Mindblowing Quantum Nodes, Matrix Circuit Flows, and Reactive Neon Glow Trails

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '@/lib/auth/actions'
import { Loader2, AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import Image from 'next/image'

// 1. BRAND LUXURY ARCHITECTURE LIGHT-MODE COLOR TOKENS
const C = {
  brand: '#2563EB',         // Primary Core Blue
  brandLight: '#DBEAFE',    // Ambient light accent
  brandBg: '#EFF6FF',       // Pure backdrop node
  slate900: '#0F172A',      // High contrast deep luxury neutral
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  white: '#FFFFFF',
  error: '#DC2626',
  error50: '#FEF2F2',
  green: '#059669',
  green50: '#ECFDF5',
  amber: '#D97706',
  amber50: '#FFFBEB',
  g1: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  cyberDark: '#0F172A',     // Anchor capsule for landscape branding
}

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null)
  const [email, setEmail] = useState('')

  const inp = (err: boolean): React.CSSProperties => ({
    width: '100%', 
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderRadius: '12px',
    border: `1.5px solid ${err ? C.error : 'rgba(15, 23, 42, 0.12)'}`,
    background: err ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(4px)',
    fontSize: '14px', 
    fontFamily: "'DM Sans', sans-serif",
    color: C.slate900, 
    outline: 'none', 
    boxSizing: 'border-box',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  })

  return (
    <div className="cyber-matrix-mesh" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', padding: 'clamp(16px, 4vw, 32px)', position: 'relative', overflow: 'hidden' }}>
      
      {/* MINDBLOWING 2D HIGH-TECH SIRKUIT DECORATION BACKGROUND NODES */}
      <div className="quantum-ambient-node color-1" style={{ position: 'absolute', top: '15%', left: '10%', width: '28vw', height: '28vw', background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(35px)' }} />
      <div className="quantum-ambient-node color-2" style={{ position: 'absolute', bottom: '10%', right: '5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(0,242,254,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(45px)' }} />

      {/* FLOATING 2D GEOMETRIC TECH CHIPS */}
      <div className="floating-tech-chip chip-1" style={{ position: 'absolute', top: '25%', left: '15%', width: '32px', height: '32px', border: '1.5px dashed rgba(37,99,235,0.25)', borderRadius: '8px', zIndex: 1, pointerEvents: 'none' }} />
      <div className="floating-tech-chip chip-2" style={{ position: 'absolute', bottom: '25%', right: '12%', width: '48px', height: '48px', border: '1.5px solid rgba(0,242,254,0.15)', borderRadius: '12px', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ maxWidth: '445px', width: '100%', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>

        {/* HEADER BRANDING INJECTOR */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '144px', height: '42px', paddingTop: '5px', paddingBottom: '5px', paddingLeft: '12px', paddingRight: '12px', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} className="brand-logo-capsule">
              <Image
                src="/logo-beesell-white.png"
                alt="BeeSell AI Logo"
                width={154}
                height={44}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          </Link>
        </div>

        {/* LUXURY MINIMALIST CENTERED GLASSMORPHISM CONTAINER CARD */}
        <div className="luxury-glass-card" style={{ background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.5)', paddingTop: '32px', paddingBottom: '32px', paddingLeft: 'clamp(20px, 5vw, 32px)', paddingRight: 'clamp(20px, 5vw, 32px)', boxShadow: '0 30px 70px -20px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.6)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Quantum Fusion Laser Scanner Line Overlay */}
          <div className="tech-laser-scanline" />

          {state?.success ? (
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(5,150,105,0.06)' }}>
                <Mail size={26} color={C.green} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: C.slate900, marginBottom: '10px', letterSpacing: '-0.02em' }}>Cek Email Masuk Anda!</h3>
              <p style={{ fontSize: '14px', color: C.slate500, lineHeight: 1.6, marginBottom: '4px' }}>
                Jika alamat email <b>{email}</b> terdaftar di sistem BeeSell AI,
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: C.slate900, marginBottom: '24px' }}>
                Tautan pemulihan sandi sudah meluncur.
              </p>
              <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '14px', border: `1px solid ${C.slate200}`, marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ fontSize: '13px', color: C.slate700, lineHeight: 1.75 }}>
                  <b style={{ color: C.slate900, display: 'block', marginBottom: '6px' }}>Prosedur Pengaturan Ulang:</b>
                  1. Buka kotak masuk layanan email Anda<br/>
                  2. Cari pesan pemulihan dari <b>BeeSell AI</b><br/>
                  3. Akses tombol berlabel <b>"Reset Password"</b><br/>
                  4. Buat kata sandi baru untuk kembali amankan toko ✨
                </div>
              </div>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: C.brand, fontWeight: 700, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }} className="link-cyber-hover">
                <ArrowLeft size={14} /> Kembali ke Gerbang Login
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
                <Link href="/login" style={{ width: '32px', height: '32px', borderRadius: '10px', border: `1px solid ${C.slate200}`, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="btn-cyber-action">
                  <ArrowLeft size={14} color={C.slate600} />
                </Link>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.slate900, letterSpacing: '-0.01em' }}>Pemulihan Kunci Akses</h3>
                  <p style={{ fontSize: '12px', color: C.slate500, fontWeight: 500 }}>Masukkan email terdaftar untuk menyetel ulang password</p>
                </div>
              </div>

              {state?.error && (
                <div style={{ padding: '12px 14px', background: 'rgba(220, 38, 38, 0.05)', border: `1px solid rgba(220, 38, 38, 0.15)`, borderRadius: '12px', marginBottom: '18px', fontSize: '13px', color: C.error, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />{state.error}
                </div>
              )}

              <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 10 }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.slate600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Email Seller / Affiliator Anda
                  </label>
                  <input name="email" type="email" placeholder="nama@emailanda.com" required autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={inp(!!state?.error)}
                    className="input-cyber-lux"
                  />
                </div>
                <button type="submit" disabled={pending} className="btn-luxury" style={{
                  width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                  background: pending ? C.slate200 : C.g1,
                  color: pending ? C.slate400 : C.white,
                  fontSize: '14px', fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: pending ? 'none' : '0 8px 24px -6px rgba(37,99,235,0.35)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  {pending ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Memproses Jaringan Otentikasi...</span>
                    </>
                  ) : (
                    <span>Kirim Link Reset Pemulihan Toko</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ── HIGH TECH LUXURY INTERACTIVE SAAS STYLE ENGINE ── */}
      <style>{`
        * { box-sizing: border-box; }
        
        /* Interactive Tech Grid Circuit Mesh Backing Moving Animation */
        .cyber-matrix-mesh {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
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
          box-shadow: 0 45px 85px -25px rgba(15,23,42,0.1), 0 15px 30px -15px rgba(37,99,235,0.06), inset 0 1px 0 rgba(255,255,255,0.85) !important;
          border-color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Advanced Dual Precision Laser Scanning Line Beam Overlay */
        .tech-laser-scanline {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 2.5px;
          background: linear-gradient(90deg, transparent, #2563EB, #00F2FE, #2563EB, transparent);
          animation: laserSlideDown 5.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          opacity: 0.7;
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
          border-color: #2563EB !important;
          background: rgba(255, 255, 255, 0.9) !important;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.07) !important;
          transform: translateY(-0.5px);
        }

        /* Micro-Animations and Scale Elements */
        .btn-luxury:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(37,99,235,0.4) !important;
          filter: brightness(1.03);
        }
        .brand-logo-capsule:hover {
          transform: scale(1.02) translateY(-0.5px);
          box-shadow: 0 14px 32px rgba(15,23,42,0.18) !important;
          border-color: #334155 !important;
        }
        .btn-cyber-action:hover {
          background: rgba(255, 255, 255, 0.9) !important;
          border-color: #CBD5E1 !important;
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