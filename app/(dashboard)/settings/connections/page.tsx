'use client'
// apps/web-app/app/(dashboard)/settings/connections/page.tsx
// ── Platform connections settings page ────────────────────────
import Link from 'next/link'
import { ArrowLeft, Wifi, WifiOff, AlertTriangle, Loader2 } from 'lucide-react'
import { usePlatformConnections, useConnectedCount, useHasExpiredConnection } from '@/hooks/usePlatformConnections'
import { PlatformCard }   from '@/components/platform/PlatformCard'
import { PLATFORM_LIST }  from '@/lib/platform/platform-config'
import type { SupportedPlatform } from '@/lib/platform/platform-config'

export default function ConnectionsPage() {
  const { data: connections, isLoading, refetch, isFetching } = usePlatformConnections()
  const connectedCount = useConnectedCount()
  const hasExpired     = useHasExpiredConnection()

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/settings" style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '6px',
          fontSize:   '12px',
          color:      '#64748B',
          textDecoration: 'none',
        }}>
          <ArrowLeft size={13} /> Pengaturan
        </Link>
        <span style={{ color: '#CBD5E1' }}>/</span>
        <h1 style={{
          fontFamily:    "'Fraunces', serif",
          fontSize:      '22px',
          fontWeight:    600,
          color:         '#0F172A',
          letterSpacing: '-0.02em',
        }}>
          Koneksi Platform
        </h1>
      </div>

      {/* ── Summary bar ─────────────────────────────────── */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
        padding:      '14px 18px',
        background:   hasExpired ? '#FEF2F2' : (connectedCount > 0 ? '#F0FDF4' : '#F8FAFC'),
        border:       `1px solid ${hasExpired ? '#FECACA' : (connectedCount > 0 ? '#BBF7D0' : '#E2E8F0')}`,
        borderRadius: '12px',
        marginBottom: '20px',
      }}>
        {isLoading ? (
          <Loader2 size={16} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
        ) : hasExpired ? (
          <AlertTriangle size={16} color="#DC2626" />
        ) : connectedCount > 0 ? (
          <Wifi size={16} color="#16A34A" />
        ) : (
          <WifiOff size={16} color="#94A3B8" />
        )}

        <div style={{ flex: 1 }}>
          <p style={{
            fontSize:  '13px',
            fontWeight: 700,
            color:     hasExpired ? '#DC2626' : (connectedCount > 0 ? '#15803D' : '#475569'),
          }}>
            {isLoading
              ? 'Memeriksa koneksi...'
              : hasExpired
                ? 'Ada koneksi yang expired — perlu re-auth'
                : connectedCount > 0
                  ? `${connectedCount} dari 3 platform terhubung`
                  : 'Belum ada platform yang terhubung'
            }
          </p>
          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
            {connectedCount > 0 && !hasExpired
              ? 'Auto-post konten ke platform siap.'
              : 'Hubungkan platform untuk bisa auto-post konten.'
            }
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '4px',
            padding:    '5px 10px',
            background: '#fff',
            border:     '1px solid #E2E8F0',
            borderRadius: '7px',
            fontSize:   '11px',
            fontWeight: 500,
            color:      '#64748B',
            cursor:     isFetching ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isFetching ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : '↻'}
          Cek ulang
        </button>
      </div>

      {/* ── Platform cards ───────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PLATFORM_LIST.map(cfg => {
            const connection = connections?.find(c => c.platform === cfg.id) ?? null
            return (
              <PlatformCard
                key={cfg.id}
                platform={cfg.id as SupportedPlatform}
                connection={connection}
              />
            )
          })}
        </div>
      )}

      {/* ── Info section ─────────────────────────────────── */}
      <div style={{
        marginTop:    '28px',
        padding:      '18px 20px',
        background:   '#F8FAFC',
        border:       '1px solid #E2E8F0',
        borderRadius: '14px',
      }}>
        <h3 style={{
          fontSize:     '13px',
          fontWeight:   700,
          color:        '#0F172A',
          marginBottom: '12px',
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
        }}>
          ℹ️ Tentang Koneksi Platform
        </h3>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap:                 '12px',
        }}>
          {[
            { icon: '🔐', title: 'Token aman', desc: 'Access token disimpan terenkripsi. Kami tidak bisa akun akunmu tanpa izin.' },
            { icon: '⏱️', title: 'Token expiry', desc: 'Instagram token 60 hari, TikTok 30 hari. Kamu akan dapat notifikasi sebelum expired.' },
            { icon: '🔄', title: 'Re-auth mudah', desc: 'Klik "Sambungkan Ulang" kapan saja. Konten terjadwal tetap aman.' },
            { icon: '📵', title: 'Disconnect kapan saja', desc: 'Disconnect akan menghapus token. Konten yang sudah posted tidak terpengaruh.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                  {item.title}
                </p>
                <p style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop:    '14px',
          paddingTop:   '14px',
          borderTop:    '1px solid #E2E8F0',
          fontSize:     '11px',
          color:        '#94A3B8',
        }}>
          <strong>Note MVP:</strong> Koneksi OAuth Instagram & TikTok membutuhkan persetujuan Meta/TikTok Business yang sedang diproses.
          {' '}Untuk sementara, hubungi <a href="mailto:support@beesell.id" style={{ color: '#2563EB' }}>support@beesell.id</a> untuk setup manual.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{
      background:   '#fff',
      border:       '1px solid #E2E8F0',
      borderRadius: '16px',
      overflow:     'hidden',
    }}>
      <div style={{ padding: '20px', display: 'flex', gap: '14px' }}>
        <div style={shimmer('52px', '52px', '14px')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={shimmer('120px', '18px')} />
            <div style={shimmer('70px', '18px', '99px')} />
          </div>
          <div style={shimmer('200px', '12px')} />
          <div style={shimmer('160px', '12px')} />
        </div>
      </div>
      <div style={{
        padding:      '12px 20px',
        borderTop:    '1px solid #F1F5F9',
        background:   '#FAFAFA',
        display:      'flex',
        justifyContent: 'flex-end',
      }}>
        <div style={shimmer('110px', '34px', '10px')} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}

function shimmer(w: string, h: string, br = '6px'): React.CSSProperties {
  return {
    width:          w,
    height:         h,
    borderRadius:   br,
    background:     'linear-gradient(90deg,#F8FAFC 25%,#F1F5F9 50%,#F8FAFC 75%)',
    backgroundSize: '200% 100%',
    animation:      'shimmer 1.5s infinite',
  }
}