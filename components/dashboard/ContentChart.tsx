'use client'
// apps/web-app/components/dashboard/ContentChart.tsx
// ── Recharts stacked bar chart: konten per hari (30 hari) ────
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts'
import type { ChartDay } from '@/hooks/useDashboard'

interface Props {
  data:    ChartDay[]
  loading: boolean
}

type Period = '7d' | '30d'
// ── Route map terpusat (ubah di sini kalau ada yang 404) ──────
const ROUTES = {
  studio:       '/dashboard/studio',
  tiktokScript: '/dashboard/studio/video/tiktok',
  ugcVideo:     '/dashboard/studio/video/ugc',
  enhancer:     '/dashboard/studio/image/enhancer',
  billing:      '/billing',           // cek: mungkin /dashboard/billing
  scheduler:    '/dashboard/scheduler',
  campaign:     '/dashboard/campaign-builder',
}
export function ContentChart({ data, loading }: Props) {
  const [period, setPeriod] = useState<Period>('7d')

  const filtered = period === '7d' ? data.slice(-7) : data

  if (loading) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px',
        padding: '20px', height: '280px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={shimmer('150px', '20px')} />
          <div style={shimmer('120px', '28px', '8px')} />
        </div>
        <div style={{
          flex: 1,
          background: 'linear-gradient(90deg,#F8FAFC 25%,#F1F5F9 50%,#F8FAFC 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '8px',
        }} />
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    )
  }

  const isEmpty = !data.length || data.every(d => d.total === 0)

  return (
    <div style={{
      background:   '#fff',
      border:       '1px solid #E2E8F0',
      borderRadius: '14px',
      padding:      '20px',
      fontFamily:   "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '16px',
        flexWrap:       'wrap',
        gap:            '10px',
      }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
            Konten Dibuat
          </h3>
          <p style={{ fontSize: '11px', color: '#94A3B8' }}>
            Caption + gambar per hari
          </p>
        </div>

        {/* Period toggle */}
        <div style={{
          display:      'flex',
          background:   '#F1F5F9',
          borderRadius: '8px',
          padding:      '3px',
        }}>
          {(['7d', '30d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding:      '5px 12px',
                background:   period === p ? '#fff' : 'transparent',
                border:       'none',
                borderRadius: '6px',
                fontSize:     '11px',
                fontWeight:   period === p ? 600 : 500,
                color:        period === p ? '#0F172A' : '#64748B',
                cursor:       'pointer',
                fontFamily:   "'DM Sans', sans-serif",
                boxShadow:    period === p ? '0 1px 2px rgba(15,23,42,.08)' : 'none',
                transition:   'all .15s',
              }}
            >
              {p === '7d' ? '7 Hari' : '30 Hari'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {isEmpty ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={filtered}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            barSize={period === '7d' ? 32 : 14}
            barCategoryGap="25%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'DM Sans' }}
              axisLine={false}
              tickLine={false}
              interval={period === '30d' ? 4 : 0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'DM Sans' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
            <Bar dataKey="captions" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} name="Caption" />
            <Bar dataKey="images" stackId="a" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Gambar" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      {!isEmpty && (
        <div style={{
          display:    'flex',
          gap:        '16px',
          marginTop:  '12px',
          justifyContent: 'center',
        }}>
          <LegendDot color="#2563EB" label="Caption" />
          <LegendDot color="#7C3AED" label="Gambar" />
        </div>
      )}
    </div>
  )
}

// ── Custom tooltip ──────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const captions = payload.find((p: any) => p.dataKey === 'captions')?.value ?? 0
  const images   = payload.find((p: any) => p.dataKey === 'images')?.value   ?? 0
  const total    = captions + images

  return (
    <div style={{
      background:   '#fff',
      border:       '1px solid #E2E8F0',
      borderRadius: '10px',
      padding:      '10px 14px',
      boxShadow:    '0 4px 16px rgba(15,23,42,.1)',
      fontFamily:   "'DM Sans', sans-serif",
      minWidth:     '140px',
    }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
        {label}
      </p>
      {captions > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '11px', marginBottom: '3px' }}>
          <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', background: '#2563EB', borderRadius: '2px', display: 'inline-block' }} />
            Caption
          </span>
          <span style={{ fontWeight: 700, color: '#2563EB' }}>{captions}</span>
        </div>
      )}
      {images > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '11px', marginBottom: '3px' }}>
          <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', background: '#7C3AED', borderRadius: '2px', display: 'inline-block' }} />
            Gambar
          </span>
          <span style={{ fontWeight: 700, color: '#7C3AED' }}>{images}</span>
        </div>
      )}
      <div style={{
        marginTop:  '6px',
        paddingTop: '6px',
        borderTop:  '1px solid #F1F5F9',
        display:    'flex',
        justifyContent: 'space-between',
        fontSize:   '11px',
        fontWeight: 700,
        color:      '#0F172A',
      }}>
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  )
}

// ── Legend dot ──────────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748B' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
      {label}
    </div>
  )
}

// ── Empty state ─────────────────────────────────────────────
function EmptyChart() {
  return (
    <div style={{
      height:         '200px',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '8px',
      color:          '#94A3B8',
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="20" width="6" height="14" rx="2" fill="#E2E8F0" />
        <rect x="17" y="12" width="6" height="22" rx="2" fill="#E2E8F0" />
        <rect x="28" y="16" width="6" height="18" rx="2" fill="#E2E8F0" />
      </svg>
      <p style={{ fontSize: '13px', fontWeight: 500 }}>Belum ada data</p>
      <p style={{ fontSize: '11px' }}>Buat konten pertama kamu</p>
    </div>
  )
}

function shimmer(w: string, h: string, br = '6px'): React.CSSProperties {
  return {
    width: w, height: h, borderRadius: br,
    background: 'linear-gradient(90deg,#F8FAFC 25%,#F1F5F9 50%,#F8FAFC 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }
}