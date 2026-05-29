'use client'
// apps/web-app/components/feedback/NpsSurvey.tsx
// NPS survey modal — shown at D+3, D+7, D+30
// Triggered from useNpsSurvey hook on dashboard load
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Props {
  surveyDay: number
  onClose:   () => void
}

export function NpsSurvey({ surveyDay, onClose }: Props) {
  const [score,   setScore]   = useState<number | null>(null)
  const [reason,  setReason]  = useState('')
  const [step,    setStep]    = useState<'score' | 'reason' | 'done'>('score')
  const [loading, setLoading] = useState(false)

  const handleScore = (s: number) => {
    setScore(s)
    setStep('reason')
  }

  const handleSubmit = async () => {
    if (score === null) return
    setLoading(true)

    await fetch('/api/nps', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ score, reason: reason.trim() || undefined, surveyDay }),
    }).catch(() => {})

    setStep('done')
    setLoading(false)
    setTimeout(onClose, 2500)
  }

  const scoreColor = (s: number) =>
    s <= 6  ? '#DC2626' :
    s <= 8  ? '#F59E0B' :
    '#16A34A'

  const scoreLabel = score === null ? '' :
    score <= 6  ? 'Perlu banyak perbaikan 😕' :
    score <= 8  ? 'Cukup bagus, tapi bisa lebih baik 🙂' :
    'Senang kamu suka! 🎉'

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(15,23,42,.4)',
        backdropFilter: 'blur(4px)',
      }} onClick={step !== 'score' ? onClose : undefined} />

      <div style={{
        position:     'fixed',
        bottom:       '50%',
        right:        '50%',
        transform:    'translate(50%, 50%)',
        width:        'min(440px, 94vw)',
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
          background:   'linear-gradient(135deg, #0F172A, #1E1B4B)',
          padding:      '20px 22px',
          position:     'relative',
        }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Beta Feedback · Hari ke-{surveyDay}
          </p>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            Seberapa besar kemungkinan kamu merekomendasikan BeeSell AI ke teman?
          </h3>
          <button onClick={onClose} style={{
            position:       'absolute', top: '16px', right: '16px',
            width:          '28px', height: '28px',
            background:     'rgba(255,255,255,.1)', border: 'none',
            borderRadius:   '50%', cursor: 'pointer', color: '#fff',
            display:        'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px 24px' }}>

          {step === 'score' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Tidak mungkin sama sekali</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Sangat mungkin</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: '4px', marginBottom: '16px' }}>
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleScore(i)}
                    style={{
                      padding:      '10px 0',
                      background:   score === i ? scoreColor(i) : '#F8FAFC',
                      border:       `1.5px solid ${score === i ? scoreColor(i) : '#E2E8F0'}`,
                      borderRadius: '8px',
                      fontSize:     '13px',
                      fontWeight:   700,
                      color:        score === i ? '#fff' : '#64748B',
                      cursor:       'pointer',
                      fontFamily:   "'DM Sans', sans-serif",
                      transition:   'all .1s',
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>

              {score !== null && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: scoreColor(score), fontWeight: 600 }}>
                  {scoreLabel}
                </p>
              )}
            </>
          )}

          {step === 'reason' && (
            <>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                {score !== null && score <= 6
                  ? 'Apa yang perlu kami perbaiki?'
                  : score !== null && score <= 8
                    ? 'Apa yang bisa kami tingkatkan?'
                    : 'Apa yang paling kamu suka?'
                }
              </p>

              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Cerita sedikit ya... (opsional)"
                rows={3}
                autoFocus
                style={{
                  width:        '100%',
                  padding:      '10px 12px',
                  border:       '1px solid #E2E8F0',
                  borderRadius: '10px',
                  fontSize:     '13px',
                  color:        '#0F172A',
                  resize:       'vertical',
                  outline:      'none',
                  fontFamily:   "'DM Sans', sans-serif",
                  boxSizing:    'border-box',
                  marginBottom: '14px',
                }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    flex:         1,
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    gap:          '6px',
                    padding:      '12px',
                    background:   'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    border:       'none',
                    borderRadius: '10px',
                    fontSize:     '14px',
                    fontWeight:   700,
                    color:        '#fff',
                    cursor:       loading ? 'not-allowed' : 'pointer',
                    fontFamily:   "'DM Sans', sans-serif",
                  }}
                >
                  {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Kirim →'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding:      '12px 16px',
                    background:   '#F8FAFC',
                    border:       '1px solid #E2E8F0',
                    borderRadius: '10px',
                    fontSize:     '13px',
                    color:        '#94A3B8',
                    cursor:       'pointer',
                    fontFamily:   "'DM Sans', sans-serif",
                  }}
                >
                  Lewati
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🙏</div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                Terima kasih!
              </p>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Feedback kamu membantu kami berkembang.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popIn { from { opacity: 0; transform: translate(50%, 54%) scale(.96) } to { opacity: 1; transform: translate(50%, 50%) scale(1) } }
        @keyframes spin  { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}