'use client'
// apps/web-app/components/ui/QuotaExceededModal.tsx
// Shown when user hits quota limit during generate
import Link from 'next/link'
import { X, Zap, Clock, ArrowRight } from 'lucide-react'
import { PLANS } from '@/lib/quota/plans'

interface Props {
  metric:      string    // 'caption' | 'image'
  used:        number
  limit:       number
  resetAt:     string    // ISO string
  currentPlan: string
  onClose:     () => void
}

export function QuotaExceededModal({ metric, used, limit, resetAt, currentPlan, onClose }: Props) {
  const isCaption = metric === 'caption'
  const resetDate = new Date(resetAt)
  const isToday   = resetDate.toDateString() === new Date().toDateString()

  const resetStr = isToday
    ? `pukul 00:00 WIB (tengah malam)`
    : resetDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

  // Next plan suggestion
  const planOrder = ['free', 'basic', 'pro', 'business'] as const
  const currentIdx = planOrder.indexOf(currentPlan as any)
  const nextPlan   = planOrder[currentIdx + 1]
  const nextLimits = nextPlan ? PLANS[nextPlan] : null
  const nextLimit  = nextLimits
    ? (isCaption ? nextLimits.captionsPerMonth : nextLimits.imagesPerMonth)
    : null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', zIndex: 70 }} />

      <div style={{
        position:     'fixed',
        top:          '50%',
        left:         '50%',
        transform:    'translate(-50%, -50%)',
        width:        'min(420px, 94vw)',
        background:   '#fff',
        borderRadius: '20px',
        boxShadow:    '0 20px 60px rgba(15,23,42,.2)',
        zIndex:       71,
        overflow:     'hidden',
        fontFamily:   "'DM Sans', sans-serif",
        animation:    'popIn .2s ease',
      }}>
        {/* Header */}
        <div style={{
          background:   'linear-gradient(135deg, #1E1B4B, #2563EB)',
          padding:      '24px',
          position:     'relative',
        }}>
          <button onClick={onClose} style={{
            position:   'absolute',
            top:        '14px',
            right:      '14px',
            width:      '28px',
            height:     '28px',
            background: 'rgba(255,255,255,.1)',
            border:     'none',
            borderRadius: '50%',
            cursor:     'pointer',
            color:      '#fff',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <X size={14} />
          </button>

          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚀</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Kuota {isCaption ? 'Caption' : 'Gambar'} Habis
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)' }}>
            {used}/{limit} {isCaption ? 'caption' : 'gambar'} sudah dipakai bulan ini
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Reset info */}
          <div style={{
            display:   'flex',
            alignItems: 'center',
            gap:       '10px',
            padding:   '12px 14px',
            background: '#F8FAFC',
            border:    '1px solid #E2E8F0',
            borderRadius: '10px',
            marginBottom: '20px',
          }}>
            <Clock size={16} color="#64748B" />
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                Kuota reset {resetStr}
              </p>
              <p style={{ fontSize: '11px', color: '#64748B' }}>
                Atau upgrade sekarang untuk lanjut generate
              </p>
            </div>
          </div>

          {/* Upgrade CTA */}
          {nextPlan && nextLimit && (
            <div style={{
              background:   'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
              border:       '1px solid #BFDBFE',
              borderRadius: '12px',
              padding:      '16px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Zap size={14} color="#2563EB" fill="#2563EB" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E3A8A' }}>
                  Upgrade ke {nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', lineHeight: 1.5 }}>
                {nextLimit === -1
                  ? `Generate ${isCaption ? 'caption' : 'gambar'} tanpa batas bulan ini`
                  : `Generate hingga ${nextLimit.toLocaleString('id')} ${isCaption ? 'caption' : 'gambar'} per bulan`
                }
                {' '}— mulai{' '}
                <strong>Rp {(PLANS[nextPlan].priceMonthly / 1000).toFixed(0)}K/bln</strong>
              </p>

              <Link
                href={`/settings/billing?upgrade=${nextPlan}`}
                onClick={onClose}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            '6px',
                  padding:        '10px',
                  background:     'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color:          '#fff',
                  textDecoration: 'none',
                  borderRadius:   '9px',
                  fontSize:       '13px',
                  fontWeight:     700,
                }}
              >
                Upgrade Sekarang <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Wait option */}
          <button
            onClick={onClose}
            style={{
              width:        '100%',
              padding:      '10px',
              background:   'transparent',
              border:       'none',
              cursor:       'pointer',
              fontSize:     '13px',
              color:        '#64748B',
              fontFamily:   "'DM Sans', sans-serif",
            }}
          >
            Tunggu reset kuota →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn { from { opacity: 0; transform: translate(-50%, -48%) scale(.96) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
      `}</style>
    </>
  )
}