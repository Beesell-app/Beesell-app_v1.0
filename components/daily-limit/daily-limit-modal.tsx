'use client'
// components/daily-limit/daily-limit-modal.tsx
// ══════════════════════════════════════════════════════════════
// Daily Limit Modal — Tampil saat hit limit dengan upgrade CTA
// ══════════════════════════════════════════════════════════════

import Link from 'next/link'
import { X, Crown, Clock, ArrowRight, AlertCircle } from 'lucide-react'

const C = {
  purple: '#7C3AED', purpleBg: '#F5F3FF', purpleLt: '#A78BFA',
  pink:   '#EC4899', amber:    '#F59E0B', green:    '#10B981',
  red:    '#EF4444', redBg:    '#FEE2E2',
  slate900: '#0F172A', slate700: '#334155',
  slate600: '#475569', slate500: '#64748B',
  slate400: '#94A3B8', slate200: '#E2E8F0',
  slate100: '#F1F5F9', slate50:  '#F8FAFC',
  white: '#FFFFFF',
}

interface UpgradeSuggestion {
  from_tier:    string
  to_tier:      string
  multiplier:   number          // x lipat daily limit
  cta_text:     string
  upgrade_url:  string
}

interface Props {
  isOpen:              boolean
  onClose:             () => void
  toolId:              string
  toolLabel:           string
  currentTier:         string
  limit:               number
  resetAt?:            string         // ISO timestamp
  upgradeSuggestion?:  UpgradeSuggestion
}

export function DailyLimitModal({
  isOpen, onClose, toolId, toolLabel,
  currentTier, limit, resetAt, upgradeSuggestion,
}: Props) {
  if (!isOpen) return null

  // Calculate time until reset
  const resetTime = resetAt ? formatResetTime(resetAt) : '00:01 WIB besok'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: "'DM Sans',sans-serif",
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: C.white, borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: `linear-gradient(135deg, ${C.red}10, ${C.amber}10)`,
          borderBottom: `1px solid ${C.slate100}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 99,
              background: C.redBg, color: C.red,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertCircle size={20}/>
            </div>
            <div>
              <h3 style={{
                fontSize: 16, fontWeight: 800,
                color: C.slate900, marginBottom: 2,
              }}>
                Limit harian tercapai
              </h3>
              <p style={{ fontSize: 12, color: C.slate500 }}>
                {toolLabel}
              </p>
            </div>
          </div>
          
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 99,
            background: C.slate100, border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color={C.slate600}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <p style={{
            fontSize: 14, color: C.slate700, lineHeight: 1.6,
            marginBottom: 16,
          }}>
            Kamu sudah menggunakan <strong>{limit} dari {limit} generation</strong> untuk{' '}
            <strong>{toolLabel}</strong> hari ini di plan{' '}
            <strong style={{ textTransform: 'capitalize' }}>{currentTier}</strong>.
          </p>

          {/* Reset info */}
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: C.slate50, border: `1px solid ${C.slate200}`,
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 20,
          }}>
            <Clock size={18} color={C.slate600}/>
            <div>
              <div style={{ fontSize: 12, color: C.slate500, marginBottom: 2 }}>
                Reset otomatis
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
                {resetTime}
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          {upgradeSuggestion && (
            <div style={{
              padding: '20px 18px', borderRadius: 14,
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 100, height: 100, borderRadius: 99,
                background: 'rgba(255,255,255,0.1)',
              }}/>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, fontWeight: 800, opacity: 0.9,
                  letterSpacing: '0.08em', marginBottom: 8,
                }}>
                  <Crown size={11}/> UPGRADE TERSEDIA
                </div>
                
                <h4 style={{
                  fontSize: 18, fontWeight: 800, marginBottom: 6,
                  letterSpacing: '-0.01em',
                }}>
                  Dapatkan <strong>{upgradeSuggestion.multiplier}x</strong> limit lebih banyak
                </h4>
                
                <p style={{
                  fontSize: 13, opacity: 0.92, lineHeight: 1.5,
                  marginBottom: 16,
                }}>
                  Upgrade dari <strong style={{ textTransform: 'capitalize' }}>{upgradeSuggestion.from_tier}</strong>{' '}
                  ke <strong style={{ textTransform: 'capitalize' }}>{upgradeSuggestion.to_tier}</strong> untuk akses unlimited semua tools
                </p>
                
                <Link 
                  href={upgradeSuggestion.upgrade_url}
                  onClick={onClose}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 10,
                    background: '#fff', color: C.purple,
                    fontSize: 13, fontWeight: 800,
                    textDecoration: 'none',
                  }}>
                  {upgradeSuggestion.cta_text || `Upgrade ke ${upgradeSuggestion.to_tier}`}
                  <ArrowRight size={14}/>
                </Link>
              </div>
            </div>
          )}

          {/* Secondary action */}
          <button onClick={onClose} style={{
            width: '100%', marginTop: 14,
            padding: '12px', borderRadius: 10,
            background: C.white, color: C.slate700,
            border: `1.5px solid ${C.slate200}`,
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Tutup, coba lagi besok
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
function formatResetTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const wibDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    const now = new Date()
    
    const diffMs = wibDate.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `dalam ${diffMins} menit`
    }
    if (diffHours < 24) {
      return `dalam ${diffHours} jam`
    }
    
    return '00:01 WIB besok'
  } catch {
    return '00:01 WIB besok'
  }
}