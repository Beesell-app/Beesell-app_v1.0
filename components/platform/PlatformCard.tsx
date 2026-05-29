'use client'
// apps/web-app/components/platform/PlatformCard.tsx
// ── Platform connection card ──────────────────────────────────
// States: disconnected → pending → connected ↔ expired → re-auth → connected
import { useState, useEffect } from 'react'
import { ExternalLink, LogOut, RefreshCw, AlertTriangle, Lock, Loader2, CheckCircle } from 'lucide-react'
import {
  PLATFORM_CONFIG, isTokenExpiredOrExpiringSoon,
  type SupportedPlatform, type ConnectionStatus,
} from '@/lib/platform/platform-config'
import { ConnectionStatusBadge } from './StatusBadge'
import { useDisconnectPlatform } from '@/lib/hooks/usePlatformConnections'
import type { PlatformConnectionRecord } from '@/lib/hooks/usePlatformConnections'

interface Props {
  platform:   SupportedPlatform
  connection: PlatformConnectionRecord | null
}

export function PlatformCard({ platform, connection }: Props) {
  const cfg      = PLATFORM_CONFIG[platform]
  const { mutate: disconnect, isPending: disconnecting } = useDisconnectPlatform()

  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [oauthLoading,      setOauthLoading]      = useState(false)
  const [justConnected,     setJustConnected]      = useState(false)

  const status = (connection?.status ?? 'disconnected') as ConnectionStatus
  const isConnected    = status === 'connected'
  const isExpired      = status === 'expired'
  const isDisconnected = status === 'disconnected'
  const isError        = status === 'error'

  // Expiry warning (token valid but expiring soon)
  const expiringSoon = isConnected && isTokenExpiredOrExpiringSoon(connection?.token_expires_at)
  const daysUntilExpiry = connection?.token_expires_at
    ? Math.ceil((new Date(connection.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // ── OAuth connect ──────────────────────────────────────
  const handleConnect = () => {
    if (!cfg.oauthEnabled || !cfg.oauthUrl) return

    setOauthLoading(true)
    const popup = window.open(
      cfg.oauthUrl,
      `oauth_${platform}`,
      'width=600,height=700,scrollbars=yes,resizable=yes',
    )

    // Poll for popup close → refetch connections
    const poll = setInterval(() => {
      if (popup?.closed) {
        clearInterval(poll)
        setOauthLoading(false)
        setJustConnected(true)
        setTimeout(() => setJustConnected(false), 3000)
        // Parent will re-fetch via refetchOnWindowFocus
      }
    }, 500)
  }

  // ── Manual token (fallback for MVP) ───────────────────
  const handleManualToken = () => {
    // For MVP: open a simple modal / form to paste access token
    // This is a placeholder — replace with ManualTokenDialog component
    alert('Fitur ini membutuhkan akun Instagram Business.\nHubungi support@beesell.id untuk setup.')
  }

  // ── Disconnect ────────────────────────────────────────
  const handleDisconnect = () => {
    if (!connection?.id) return
    disconnect(connection.id, {
      onSuccess: () => setConfirmDisconnect(false),
    })
  }

  return (
    <div style={{
      background:   '#fff',
      border:       `1px solid ${
        isExpired || isError ? '#FECACA'
        : expiringSoon ? '#FDE68A'
        : isConnected ? '#BBF7D0'
        : '#E2E8F0'
      }`,
      borderRadius: '16px',
      overflow:     'hidden',
      fontFamily:   "'DM Sans', sans-serif",
      transition:   'box-shadow .15s',
      boxShadow:    '0 1px 3px rgba(15,23,42,.05)',
    }}>

      {/* ── Alert stripe (expired / expiring soon) ────── */}
      {(isExpired || isError) && (
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '8px',
          padding:    '8px 16px',
          background: '#FEF2F2',
          borderBottom: '1px solid #FECACA',
          fontSize:   '12px',
          color:      '#DC2626',
          fontWeight: 500,
        }}>
          <AlertTriangle size={13} />
          {isExpired
            ? 'Token expired — koneksi terputus otomatis. Sambungkan ulang untuk melanjutkan.'
            : `Error: ${connection?.error_message ?? 'Koneksi bermasalah.'}`
          }
        </div>
      )}

      {expiringSoon && !isExpired && (
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '8px',
          padding:    '7px 16px',
          background: '#FFFBEB',
          borderBottom: '1px solid #FDE68A',
          fontSize:   '11px',
          color:      '#D97706',
          fontWeight: 500,
        }}>
          <AlertTriangle size={12} />
          Token akan expired dalam {daysUntilExpiry} hari — perbarui koneksi sebelum {new Date(connection!.token_expires_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}.
        </div>
      )}

      {/* ── Main content ──────────────────────────────── */}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

          {/* Platform icon (gradient bg) */}
          <div style={{
            width:          '52px',
            height:         '52px',
            borderRadius:   '14px',
            background:     cfg.gradient,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '22px',
            flexShrink:     0,
            boxShadow:      '0 2px 8px rgba(0,0,0,.12)',
          }}>
            {cfg.icon}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <h3 style={{
                fontSize:   '15px',
                fontWeight: 700,
                color:      '#0F172A',
                margin:     0,
              }}>
                {cfg.label}
              </h3>
              <ConnectionStatusBadge status={isExpired ? 'expired' : status} pulse />
            </div>

            {/* Account info (when connected) */}
            {isConnected && connection?.account_name && (
              <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                {connection.account_avatar && (
                  <img
                    src={connection.account_avatar}
                    alt=""
                    style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      display: 'inline-block', verticalAlign: 'middle',
                      marginRight: '5px', objectFit: 'cover',
                    }}
                  />
                )}
                @{connection.account_name}
              </p>
            )}

            {/* Description when disconnected */}
            {isDisconnected && (
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.4 }}>
                {cfg.description}
              </p>
            )}

            {/* Expiry info */}
            {isConnected && connection?.token_expires_at && !expiringSoon && (
              <p style={{ fontSize: '11px', color: '#94A3B8' }}>
                Token valid hingga {new Date(connection.token_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Just-connected success tick */}
          {justConnected && (
            <CheckCircle size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
        </div>

        {/* Features list (disconnected only) */}
        {isDisconnected && (
          <div style={{
            display:    'flex',
            flexWrap:   'wrap',
            gap:        '5px',
            marginTop:  '12px',
          }}>
            {cfg.features.map(f => (
              <span key={f} style={{
                fontSize:     '10px',
                padding:      '2px 8px',
                background:   '#F8FAFC',
                border:       '1px solid #E2E8F0',
                borderRadius: '5px',
                color:        '#64748B',
              }}>
                ✓ {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer actions ─────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '8px',
        padding:        '12px 20px',
        borderTop:      '1px solid #F1F5F9',
        background:     '#FAFAFA',
      }}>

        {/* ── DISCONNECTED / ERROR: Connect button ─── */}
        {(isDisconnected || isError) && (
          <>
            {cfg.oauthEnabled ? (
              <button
                onClick={handleConnect}
                disabled={oauthLoading}
                style={{
                  flex:        1,
                  display:     'flex',
                  alignItems:  'center',
                  justifyContent: 'center',
                  gap:         '6px',
                  padding:     '9px 16px',
                  background:  oauthLoading
                    ? '#CBD5E1'
                    : `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`,
                  color:       '#fff',
                  border:      'none',
                  borderRadius: '10px',
                  fontSize:    '13px',
                  fontWeight:  700,
                  cursor:      oauthLoading ? 'not-allowed' : 'pointer',
                  fontFamily:  "'DM Sans', sans-serif",
                  transition:  'all .15s',
                }}
              >
                {oauthLoading ? (
                  <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Menghubungkan...</>
                ) : (
                  <>Hubungkan {cfg.labelShort}</>
                )}
              </button>
            ) : (
              // OAuth not yet configured (no client ID/secret)
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '6px',
                  padding:    '9px 14px',
                  background: '#F1F5F9',
                  border:     '1px dashed #CBD5E1',
                  borderRadius: '10px',
                  fontSize:   '12px',
                  color:      '#64748B',
                }}>
                  <Lock size={13} />
                  <span>
                    <strong>Segera hadir</strong> — Butuh persetujuan Meta/TikTok Business
                  </span>
                </div>
                <button
                  onClick={handleManualToken}
                  style={{
                    padding:    '7px 12px',
                    background: 'transparent',
                    border:     '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize:   '11px',
                    fontWeight: 500,
                    color:      '#64748B',
                    cursor:     'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Minta Akses Manual →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── EXPIRED: Re-auth button ──────────────── */}
        {isExpired && (
          <>
            {cfg.oauthEnabled ? (
              <button
                onClick={handleConnect}
                disabled={oauthLoading}
                style={{
                  flex:        1,
                  display:     'flex',
                  alignItems:  'center',
                  justifyContent: 'center',
                  gap:         '6px',
                  padding:     '9px 16px',
                  background:  oauthLoading ? '#CBD5E1' : '#DC2626',
                  color:       '#fff',
                  border:      'none',
                  borderRadius: '10px',
                  fontSize:    '13px',
                  fontWeight:  700,
                  cursor:      oauthLoading ? 'not-allowed' : 'pointer',
                  fontFamily:  "'DM Sans', sans-serif",
                }}
              >
                {oauthLoading
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Menghubungkan...</>
                  : <><RefreshCw size={13} /> Sambungkan Ulang</>
                }
              </button>
            ) : (
              <div style={{
                flex: 1, padding: '9px 14px',
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: '10px', fontSize: '12px', color: '#DC2626',
              }}>
                Hubungi support untuk re-connect.
              </div>
            )}
          </>
        )}

        {/* ── CONNECTED: status + expiring warning + disconnect ── */}
        {isConnected && (
          <>
            {expiringSoon && cfg.oauthEnabled && (
              <button
                onClick={handleConnect}
                disabled={oauthLoading}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '5px',
                  padding:    '8px 14px',
                  background: '#FFFBEB',
                  border:     '1px solid #FDE68A',
                  borderRadius: '9px',
                  fontSize:   '12px',
                  fontWeight: 600,
                  color:      '#D97706',
                  cursor:     'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <RefreshCw size={12} /> Perbarui Token
              </button>
            )}

            <div style={{ flex: 1 }} />

            {/* Docs link */}
            <a
              href={cfg.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: '#94A3B8', textDecoration: 'none',
              }}
            >
              <ExternalLink size={11} /> Docs
            </a>

            {/* Disconnect */}
            {!confirmDisconnect ? (
              <button
                onClick={() => setConfirmDisconnect(true)}
                style={{
                  display:    'inline-flex',
                  alignItems: 'center',
                  gap:        '5px',
                  padding:    '7px 12px',
                  background: '#fff',
                  border:     '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize:   '11px',
                  fontWeight: 600,
                  color:      '#64748B',
                  cursor:     'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all .12s',
                }}
              >
                <LogOut size={11} /> Disconnect
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Yakin?</span>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  style={{
                    padding: '6px 12px',
                    background: '#DC2626', color: '#fff',
                    border: 'none', borderRadius: '7px',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {disconnecting ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : 'Ya, Disconnect'}
                </button>
                <button
                  onClick={() => setConfirmDisconnect(false)}
                  style={{
                    padding: '6px 10px',
                    background: '#fff', border: '1px solid #E2E8F0',
                    borderRadius: '7px', fontSize: '11px', color: '#64748B',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Batal
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}