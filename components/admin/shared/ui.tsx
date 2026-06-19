'use client'
// components/admin/shared/ui.tsx
// ══════════════════════════════════════════════════════════════
// Admin Shared UI — Dark theme primitives
// Reusable across all admin pages
// ══════════════════════════════════════════════════════════════

import { ReactNode, useState } from 'react'
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155',
  bg600:'#475569', border:'#334155', borderLight:'#475569',
  text:'#F1F5F9', textDim:'#94A3B8', textMute:'#64748B',
  purple:'#A78BFA', pink:'#F472B6',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', blue:'#60A5FA',
}

// ══════════════════════════════════════════════════════════════
// PAGE HEADER
// ══════════════════════════════════════════════════════════════
export function PageHeader({ 
  title, description, badge, actions,
}: { 
  title: string
  description?: string
  badge?: { label: string; color?: string }
  actions?: ReactNode
}) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      gap: 16, marginBottom: 24, flexWrap:'wrap',
    }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: 4 }}>
          <h1 style={{
            fontSize: 24, fontWeight: 900, color: D.text,
            letterSpacing: '-0.02em', margin: 0,
          }}>
            {title}
          </h1>
          {badge && (
            <span style={{
              padding:'3px 10px', borderRadius:99,
              background: `${badge.color ?? D.purple}15`, 
              color: badge.color ?? D.purple,
              fontSize: 10, fontWeight: 800, letterSpacing:'0.06em',
            }}>
              {badge.label}
            </span>
          )}
        </div>
        {description && (
          <p style={{ fontSize: 13, color: D.textDim, margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// CARD
// ══════════════════════════════════════════════════════════════
export function Card({ 
  children, padding = '20px', noBorder, 
}: { 
  children: ReactNode
  padding?: string
  noBorder?: boolean
}) {
  return (
    <div style={{
      padding, borderRadius: 12,
      background: D.bg800,
      border: noBorder ? 'none' : `1px solid ${D.border}`,
    }}>
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// BUTTON
// ══════════════════════════════════════════════════════════════
export function Button({ 
  children, variant = 'primary', size = 'md', 
  onClick, disabled, loading, icon: Icon, type = 'button',
  fullWidth, danger,
}: {
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  icon?: any
  type?: 'button' | 'submit'
  fullWidth?: boolean
  danger?: boolean
}) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '10px 20px', fontSize: 14 },
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: danger ? D.red : `linear-gradient(135deg, ${D.purple}, ${D.pink})`,
      color: '#fff', border: 'none',
    },
    secondary: {
      background: D.bg700, color: D.text,
      border: `1px solid ${D.borderLight}`,
    },
    ghost: {
      background: 'transparent', color: D.textDim,
      border: 'none',
    },
    danger: {
      background: `${D.red}15`, color: D.red,
      border: `1px solid ${D.red}30`,
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...sizes[size],
        ...variants[variant],
        borderRadius: 8,
        fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: disabled ? 0.55 : 1,
        width: fullWidth ? '100%' : 'auto',
        justifyContent: fullWidth ? 'center' : 'flex-start',
        transition: 'all 0.15s',
      }}>
      {loading ? (
        <Loader2 size={size === 'sm' ? 12 : 14} 
          style={{ animation: 'spin 1s linear infinite' }}/>
      ) : Icon && (
        <Icon size={size === 'sm' ? 12 : 14}/>
      )}
      {children}
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </button>
  )
}

// ══════════════════════════════════════════════════════════════
// TOGGLE SWITCH
// ══════════════════════════════════════════════════════════════
export function Toggle({ 
  checked, onChange, disabled, label, 
}: { 
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      <div 
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 99,
          background: checked ? D.green : D.bg600,
          position: 'relative', transition: 'background 0.15s',
        }}>
        <div style={{
          position: 'absolute', top: 2,
          left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: 99,
          background: '#fff',
          transition: 'left 0.15s',
        }}/>
      </div>
      {label && (
        <span style={{ fontSize: 12, color: D.text, fontWeight: 600 }}>
          {label}
        </span>
      )}
    </label>
  )
}

// ══════════════════════════════════════════════════════════════
// INPUT
// ══════════════════════════════════════════════════════════════
export function Input({ 
  label, type = 'text', value, onChange, placeholder, 
  required, disabled, error, hint, suffix,
}: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 11, fontWeight: 700,
          color: D.textDim, marginBottom: 6,
          letterSpacing: '0.04em',
        }}>
          {label} {required && <span style={{ color: D.red }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%', padding: '8px 12px',
            paddingRight: suffix ? 80 : 12,
            borderRadius: 8,
            background: D.bg900, color: D.text,
            border: `1px solid ${error ? D.red : D.border}`,
            fontSize: 13, fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        {suffix && (
          <div style={{
            position: 'absolute', right: 8, top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11, color: D.textMute, fontWeight: 600,
          }}>
            {suffix}
          </div>
        )}
      </div>
      {hint && !error && (
        <div style={{ fontSize: 10, color: D.textMute, marginTop: 4 }}>
          {hint}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 10, color: D.red, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SELECT
// ══════════════════════════════════════════════════════════════
export function Select({ 
  label, value, onChange, options, required, 
}: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 11, fontWeight: 700,
          color: D.textDim, marginBottom: 6,
          letterSpacing: '0.04em',
        }}>
          {label} {required && <span style={{ color: D.red }}>*</span>}
        </label>
      )}
      <select
        value={value ?? ''}
        onChange={onChange}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          background: D.bg900, color: D.text,
          border: `1px solid ${D.border}`,
          fontSize: 13, fontFamily: 'inherit',
          outline: 'none', cursor: 'pointer',
        }}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// BADGE
// ══════════════════════════════════════════════════════════════
export function Badge({ 
  children, color = D.purple, size = 'sm',
}: {
  children: ReactNode
  color?: string
  size?: 'sm' | 'md'
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '2px 8px' : '3px 10px',
      borderRadius: 99,
      background: `${color}15`, color,
      fontSize: size === 'sm' ? 10 : 11,
      fontWeight: 700, letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════════════════
export function Modal({ 
  isOpen, onClose, title, children, size = 'md',
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!isOpen) return null

  const widths = { sm: 400, md: 560, lg: 800 }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: widths[size],
          background: D.bg800, borderRadius: 12,
          border: `1px solid ${D.border}`,
          overflow: 'hidden',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${D.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{
            fontSize: 15, fontWeight: 800, color: D.text, margin: 0,
          }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 99,
            background: D.bg700, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: D.textDim,
          }}>
            <X size={14}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// CONFIRMATION DIALOG
// ══════════════════════════════════════════════════════════════
export function ConfirmDialog({ 
  isOpen, onClose, onConfirm, title, description,
  confirmLabel = 'Konfirmasi', danger,
}: any) {
  const [loading, setLoading] = useState(false)
  
  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ fontSize: 13, color: D.textDim, lineHeight: 1.6, marginTop: 0, marginBottom: 20 }}>
        {description}
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button 
          variant="primary" 
          danger={danger}
          loading={loading}
          onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════
// TOAST (simple)
// ══════════════════════════════════════════════════════════════
export function Toast({ 
  type = 'success', message, onClose,
}: {
  type?: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
}) {
  const colors = { success: D.green, error: D.red, info: D.blue }
  const icons = { success: CheckCircle2, error: AlertCircle, info: AlertCircle }
  const Icon = icons[type]
  
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      padding: '12px 16px', borderRadius: 10,
      background: D.bg800, border: `1px solid ${colors[type]}`,
      display: 'flex', alignItems: 'center', gap: 10,
      maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      animation: 'slide-in 0.2s ease',
    }}>
      <Icon size={16} color={colors[type]}/>
      <span style={{ fontSize: 13, color: D.text, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: D.textMute, display: 'flex',
      }}>
        <X size={14}/>
      </button>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════
export function EmptyState({ 
  icon = '📭', title, description, action,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div style={{
      padding: '60px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 6, margin: '0 0 6px 0' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 13, color: D.textDim, marginBottom: 16, margin: '0 0 16px 0' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}