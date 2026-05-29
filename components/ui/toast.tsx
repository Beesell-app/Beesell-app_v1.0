'use client'
// apps/web-app/components/ui/Toast.tsx
// ── Global toast system ───────────────────────────────────────
// Supports: success, error, warning, info
// Usage:
//   import { toast } from '@/components/ui/Toast'
//   toast.success('Caption berhasil dibuat!')
//   toast.error('Quota harian habis. Upgrade plan kamu.')
//   toast.error('...', { action: { label: 'Upgrade', onClick: () => router.push('/settings/billing') } })
import { create }                from 'zustand'
import { useEffect, useCallback } from 'react'
import { X, Check, AlertTriangle, Info, Loader2 } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastAction {
  label:   string
  onClick: () => void
}

export interface ToastItem {
  id:       string
  type:     ToastType
  message:  string
  action?:  ToastAction
  duration: number    // ms, 0 = persistent
}

// ── Store ──────────────────────────────────────────────────────
interface ToastStore {
  toasts: ToastItem[]
  add:    (item: Omit<ToastItem, 'id'>) => string
  remove: (id: string) => void
  clear:  () => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (item) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    set(s => ({ toasts: [...s.toasts.slice(-4), { ...item, id }] }))  // max 5
    return id
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  clear:  ()   => set({ toasts: [] }),
}))

// ── Imperative API ─────────────────────────────────────────────
const DURATION: Record<ToastType, number> = {
  success: 3_000,
  error:   6_000,
  warning: 4_500,
  info:    4_000,
  loading: 0,    // persistent until dismissed
}

function createToastApi() {
  const show = (type: ToastType, message: string, opts?: { action?: ToastAction; duration?: number }) => {
    const store = useToastStore.getState()
    const id    = store.add({
      type,
      message,
      action:   opts?.action,
      duration: opts?.duration ?? DURATION[type],
    })
    return id
  }

  return {
    success: (msg: string, opts?: { action?: ToastAction })     => show('success', msg, opts),
    error:   (msg: string, opts?: { action?: ToastAction })     => show('error',   msg, opts),
    warning: (msg: string, opts?: { action?: ToastAction })     => show('warning', msg, opts),
    info:    (msg: string, opts?: { action?: ToastAction })     => show('info',    msg, opts),
    loading: (msg: string)                                      => show('loading', msg),
    dismiss: (id: string)                                       => useToastStore.getState().remove(id),
    clear:   ()                                                 => useToastStore.getState().clear(),

    // Promise convenience (like react-hot-toast)
    promise: async <T,>(
      promise: Promise<T>,
      messages: { loading: string; success: string; error: string },
    ): Promise<T> => {
      const id = show('loading', messages.loading)
      try {
        const result = await promise
        useToastStore.getState().remove(id)
        show('success', messages.success)
        return result
      } catch (err) {
        useToastStore.getState().remove(id)
        show('error', messages.error)
        throw err
      }
    },
  }
}

export const toast = createToastApi()

// ── Toast renderer ─────────────────────────────────────────────
export function Toaster() {
  const toasts = useToastStore(s => s.toasts)
  const remove = useToastStore(s => s.remove)

  return (
    <div style={{
      position:   'fixed',
      bottom:     '80px',    // above bottom nav
      right:      '16px',
      zIndex:     80,
      display:    'flex',
      flexDirection: 'column',
      gap:        '8px',
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={remove} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  // Auto-dismiss
  useEffect(() => {
    if (t.duration === 0) return
    const timer = setTimeout(() => onDismiss(t.id), t.duration)
    return () => clearTimeout(timer)
  }, [t.id, t.duration, onDismiss])

  const config = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: <Check size={14} strokeWidth={3} />, iconBg: '#16A34A' },
    error:   { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', icon: <X size={14} strokeWidth={3} />,     iconBg: '#DC2626' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', icon: <AlertTriangle size={14} />,         iconBg: '#F59E0B' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', icon: <Info size={14} />,                  iconBg: '#2563EB' },
    loading: { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', icon: <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />, iconBg: '#64748B' },
  }[t.type]

  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          '10px',
        padding:      '12px 14px',
        background:   config.bg,
        border:       `1px solid ${config.border}`,
        borderRadius: '12px',
        boxShadow:    '0 4px 16px rgba(15,23,42,.1)',
        maxWidth:     '360px',
        minWidth:     '240px',
        pointerEvents: 'all',
        animation:    'slideInRight .2s ease',
        fontFamily:   "'DM Sans', sans-serif",
      }}
    >
      {/* Icon */}
      <div style={{
        width:          '22px',
        height:         '22px',
        borderRadius:   '50%',
        background:     config.iconBg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          '#fff',
        flexShrink:     0,
        marginTop:      '1px',
      }}>
        {config.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize:   '13px',
          fontWeight: 600,
          color:      '#0F172A',
          lineHeight: 1.4,
          margin:     0,
        }}>
          {t.message}
        </p>

        {t.action && (
          <button
            onClick={() => { t.action!.onClick(); onDismiss(t.id) }}
            style={{
              marginTop:  '6px',
              padding:    '0',
              background: 'transparent',
              border:     'none',
              cursor:     'pointer',
              fontSize:   '12px',
              fontWeight: 700,
              color:      config.text,
              fontFamily: "'DM Sans', sans-serif",
              textDecoration: 'underline',
            }}
          >
            {t.action.label} →
          </button>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onDismiss(t.id)}
        style={{
          background:  'transparent',
          border:      'none',
          cursor:      'pointer',
          color:       '#94A3B8',
          padding:     '0',
          flexShrink:  0,
          display:     'flex',
          alignItems:  'center',
        }}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(12px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}