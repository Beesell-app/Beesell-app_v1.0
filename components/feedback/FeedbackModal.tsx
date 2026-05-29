'use client'
// apps/web-app/components/feedback/FeedbackModal.tsx
// Triggered: on logout + floating "?" button anywhere in dashboard
import { useState } from 'react'
import { X, MessageSquare, Bug, Lightbulb, Star, Send, Loader2 } from 'lucide-react'

type FeedbackType = 'general' | 'bug' | 'feature' | 'logout'

interface Props {
  onClose:    () => void
  type?:      FeedbackType
  title?:     string
  subtitle?:  string
  onSubmit?:  () => void   // callback after submit (e.g. proceed with logout)
}

const TYPE_CONFIG: Record<FeedbackType, { icon: React.ReactNode; label: string; placeholder: string }> = {
  general: { icon: <MessageSquare size={16} />, label: 'Feedback Umum',    placeholder: 'Ceritain pengalamanmu pakai BeeSell AI...' },
  bug:     { icon: <Bug size={16} />,           label: 'Lapor Bug',        placeholder: 'Deskripsikan bug yang kamu temukan...' },
  feature: { icon: <Lightbulb size={16} />,     label: 'Request Fitur',    placeholder: 'Fitur apa yang kamu inginkan?' },
  logout:  { icon: <MessageSquare size={16} />, label: 'Sebelum Pergi...', placeholder: 'Ada yang bisa kami perbaiki?' },
}

export function FeedbackModal({ onClose, type = 'general', title, subtitle, onSubmit }: Props) {
  const [activeType, setActiveType] = useState<FeedbackType>(type)
  const [rating,     setRating]     = useState<number>(0)
  const [message,    setMessage]    = useState('')
  const [status,     setStatus]     = useState<'idle' | 'loading' | 'done'>('idle')

  const cfg = TYPE_CONFIG[activeType]
  const isLogout = type === 'logout'

  const handleSubmit = async () => {
    if (!message.trim()) return
    setStatus('loading')

    await fetch('/api/feedback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type:    activeType,
        rating:  rating || undefined,
        message: message.trim(),
        url:     window.location.pathname,
      }),
    }).catch(() => {})

    setStatus('done')

    // After 1.5s, close or proceed with logout
    setTimeout(() => {
      onSubmit?.()
      onClose()
    }, 1500)
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={isLogout ? undefined : onClose} style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(15,23,42,.45)',
        backdropFilter: 'blur(4px)',
      }} />

      {/* Modal */}
      <div style={{
        position:     'fixed',
        bottom:       isLogout ? '50%' : '24px',
        right:        isLogout ? '50%' : '24px',
        transform:    isLogout ? 'translate(50%, 50%)' : 'none',
        width:        '360px',
        background:   '#fff',
        borderRadius: '18px',
        boxShadow:    '0 20px 60px rgba(15,23,42,.2)',
        zIndex:       71,
        overflow:     'hidden',
        fontFamily:   "'DM Sans', sans-serif",
        animation:    'slideUp .2s ease',
      }}>

        {/* Header */}
        <div style={{
          background:    'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
          padding:       '20px',
          borderBottom:  '1px solid #E2E8F0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                {title ?? (isLogout ? 'Sebelum kamu pergi...' : 'Kirim Feedback')}
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B' }}>
                {subtitle ?? (isLogout
                  ? 'Feedback kamu sangat berarti untuk kami.'
                  : 'Bantu kami jadi lebih baik.'
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '28px', height: '28px', background: 'rgba(0,0,0,.06)',
                border: 'none', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748B', flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Type selector (only for non-logout) */}
          {!isLogout && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
              {(['general', 'bug', 'feature'] as FeedbackType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '4px',
                    padding:    '5px 10px',
                    background: activeType === t ? '#fff' : 'transparent',
                    border:     `1px solid ${activeType === t ? '#2563EB' : 'transparent'}`,
                    borderRadius: '7px',
                    fontSize:   '11px',
                    fontWeight: 600,
                    color:      activeType === t ? '#2563EB' : '#64748B',
                    cursor:     'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow:  activeType === t ? '0 1px 4px rgba(37,99,235,.15)' : 'none',
                  }}
                >
                  {TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        {status === 'done' ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🙏</div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
              Terima kasih!
            </p>
            <p style={{ fontSize: '13px', color: '#64748B' }}>
              Feedback kamu sangat berarti.
            </p>
          </div>
        ) : (
          <div style={{ padding: '18px 20px 20px' }}>

            {/* Star rating (logout only) */}
            {isLogout && (
              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: 500 }}>
                  Rating pengalamanmu (opsional)
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setRating(n === rating ? 0 : n)}
                      style={{
                        width: '36px', height: '36px', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontSize: '22px', padding: 0,
                        opacity: n <= rating ? 1 : 0.25,
                        transform: n <= rating ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all .1s',
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={cfg.placeholder}
              rows={4}
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
                background:   '#FAFAFA',
              }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {isLogout && (
                <button
                  onClick={() => { onSubmit?.(); onClose() }}
                  style={{
                    flex: 1, padding: '10px',
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    color: '#64748B', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Lewati
                </button>
              )}

              <button
                onClick={handleSubmit}
                disabled={!message.trim() || status === 'loading'}
                style={{
                  flex:         isLogout ? 1.5 : 1,
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  gap:          '6px',
                  padding:      '10px',
                  background:   !message.trim() ? '#F1F5F9' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  border:       'none',
                  borderRadius: '10px',
                  fontSize:     '13px',
                  fontWeight:   700,
                  color:        !message.trim() ? '#94A3B8' : '#fff',
                  cursor:       !message.trim() ? 'not-allowed' : 'pointer',
                  fontFamily:   "'DM Sans', sans-serif",
                  transition:   'all .15s',
                }}
              >
                {status === 'loading'
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <><Send size={13} /> Kirim Feedback</>
                }
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}

// ── Floating trigger button ────────────────────────────────────
export function FeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Kirim feedback"
        style={{
          position:       'fixed',
          bottom:         '80px',    // above bottom nav on mobile
          right:          '20px',
          width:          '44px',
          height:         '44px',
          background:     'linear-gradient(135deg, #2563EB, #7C3AED)',
          border:         'none',
          borderRadius:   '50%',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 4px 14px rgba(37,99,235,.4)',
          zIndex:         40,
          color:          '#fff',
          transition:     'transform .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageSquare size={18} />
      </button>

      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  )
}