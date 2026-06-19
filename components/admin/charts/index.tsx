'use client'
// components/admin/charts/index.tsx
// ══════════════════════════════════════════════════════════════
// Native SVG Charts — no dependency
// ⚡ DEFENSIVE: semua chart handle undefined/null/empty tanpa crash
// ══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'

const D = {
  bg900:'#0F172A', bg800:'#1E293B', bg700:'#334155',
  border:'#334155', text:'#F1F5F9',
  textDim:'#94A3B8', textMute:'#64748B',
  purple:'#A78BFA', pink:'#F472B6',
  amber:'#FBBF24', green:'#34D399', red:'#F87171', blue:'#60A5FA',
  emerald:'#10B981', indigo:'#818CF8',
}

// ══════════════════════════════════════════════════════════════
// LINE CHART
// ══════════════════════════════════════════════════════════════
interface LineSeries {
  name:   string
  color:  string
  data:   Array<{ x: string; y: number }>
}

export function LineChart({ 
  series, height = 240, formatY,
}: { 
  series: LineSeries[]
  height?: number
  formatY?: (v: number) => string
}) {
  const [hover, setHover] = useState<{ idx: number; series: number } | null>(null)

  // ⚡ DEFENSIVE: sanitize series jadi array valid, buang yang tidak punya data
  const safeSeries: LineSeries[] = useMemo(() => {
    if (!Array.isArray(series)) return []
    return series
      .filter(s => s && Array.isArray(s.data))
      .map(s => ({
        name: s.name ?? '',
        color: s.color ?? D.purple,
        data: s.data.filter(d => d && typeof d.y === 'number' && !isNaN(d.y)),
      }))
      .filter(s => s.data.length > 0)
  }, [series])

  const dimensions = useMemo(() => {
    // ⚡ Guard: pakai safeSeries (sudah dipastikan valid)
    if (safeSeries.length === 0 || safeSeries[0].data.length === 0) {
      return null
    }
    
    const allValues = safeSeries.flatMap(s => s.data.map(d => d.y))
    const yMin = 0
    const yMax = Math.max(...allValues, 1)
    const yPad = yMax * 0.1
    const yMaxPadded = yMax + yPad
    
    const xLabels = safeSeries[0].data.map(d => d.x)
    
    return { yMin, yMax: yMaxPadded, xLabels, count: xLabels.length }
  }, [safeSeries])

  // Y-axis ticks — selalu dipanggil (hooks order konsisten)
  const yTicks = useMemo(() => {
    if (!dimensions) return []
    const ticks: number[] = []
    for (let i = 0; i <= 4; i++) {
      ticks.push(dimensions.yMin + (i / 4) * (dimensions.yMax - dimensions.yMin))
    }
    return ticks
  }, [dimensions])

  if (!dimensions) {
    return (
      <div style={{
        height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: D.textMute, fontSize: 12,
      }}>
        Tidak ada data
      </div>
    )
  }

  const width = 800
  const padding = { top: 20, right: 20, bottom: 36, left: 56 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const xScale = (i: number) => 
    padding.left + (dimensions.count > 1 ? (i / (dimensions.count - 1)) * chartWidth : chartWidth / 2)
  
  const yScale = (v: number) => 
    padding.top + chartHeight - ((v - dimensions.yMin) / (dimensions.yMax - dimensions.yMin)) * chartHeight

  const xLabelStep = Math.max(1, Math.floor(dimensions.count / 6))

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      {safeSeries.length > 1 && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 11 }}>
          {safeSeries.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color }}/>
              <span style={{ color: D.textDim, fontWeight: 600 }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <svg 
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={() => setHover(null)}>
        
        {/* Y grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line 
              x1={padding.left} x2={width - padding.right}
              y1={yScale(v)} y2={yScale(v)}
              stroke={D.border} strokeWidth="0.5" strokeDasharray={i === 0 ? '' : '2 4'}
            />
            <text 
              x={padding.left - 8} y={yScale(v)} 
              fill={D.textMute} fontSize="10" textAnchor="end" dominantBaseline="middle"
              fontFamily="'DM Sans', sans-serif">
              {formatY ? formatY(v) : Math.round(v).toLocaleString('id-ID')}
            </text>
          </g>
        ))}

        {/* X labels */}
        {dimensions.xLabels.map((label, i) => {
          if (i % xLabelStep !== 0 && i !== dimensions.count - 1) return null
          return (
            <text 
              key={i}
              x={xScale(i)} y={height - padding.bottom + 16}
              fill={D.textMute} fontSize="10" textAnchor="middle"
              fontFamily="'DM Sans', sans-serif">
              {label}
            </text>
          )
        })}

        {/* Series lines */}
        {safeSeries.map((s, si) => {
          const points = s.data.map((d, i) => `${xScale(i)},${yScale(d.y)}`).join(' ')
          
          const areaPath = `M ${xScale(0)},${yScale(s.data[0].y)} ` +
            s.data.slice(1).map((d, i) => `L ${xScale(i + 1)},${yScale(d.y)}`).join(' ') +
            ` L ${xScale(s.data.length - 1)},${height - padding.bottom} ` +
            ` L ${xScale(0)},${height - padding.bottom} Z`

          return (
            <g key={s.name}>
              {safeSeries.length === 1 && (
                <>
                  <defs>
                    <linearGradient id={`area-${si}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={s.color} stopOpacity="0.3"/>
                      <stop offset="100%" stopColor={s.color} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill={`url(#area-${si})`}/>
                </>
              )}
              
              <polyline 
                points={points}
                fill="none" stroke={s.color} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              />
              
              {s.data.map((d, i) => (
                <circle 
                  key={i}
                  cx={xScale(i)} cy={yScale(d.y)}
                  r={hover?.idx === i && hover?.series === si ? 5 : 3}
                  fill={s.color} stroke={D.bg900} strokeWidth="2"
                  onMouseEnter={() => setHover({ idx: i, series: si })}
                  style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                />
              ))}
            </g>
          )
        })}

        {/* Tooltip */}
        {hover && safeSeries[hover.series]?.data[hover.idx] && (() => {
          const s = safeSeries[hover.series]
          const d = s.data[hover.idx]
          const x = xScale(hover.idx)
          const y = yScale(d.y)
          const tooltipWidth = 130
          const tooltipX = Math.min(x + 10, width - tooltipWidth)
          
          return (
            <g pointerEvents="none">
              <rect x={tooltipX} y={y - 38} width={tooltipWidth} height={32}
                fill={D.bg800} stroke={D.border} rx="6"/>
              <text x={tooltipX + 8} y={y - 24} fill={D.textDim} fontSize="10"
                fontFamily="'DM Sans', sans-serif">{d.x}</text>
              <text x={tooltipX + 8} y={y - 12} fill={s.color} fontSize="11" fontWeight="700"
                fontFamily="'DM Sans', sans-serif">
                {formatY ? formatY(d.y) : d.y.toLocaleString('id-ID')}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// HORIZONTAL BAR CHART
// ══════════════════════════════════════════════════════════════
export function HorizontalBarChart({ 
  data, formatValue, maxHeight = 320,
}: { 
  data: Array<{ label: string; value: number; sublabel?: string; color?: string }>
  formatValue?: (v: number) => string
  maxHeight?: number
}) {
  // ⚡ DEFENSIVE
  const safeData = Array.isArray(data) ? data.filter(d => d && typeof d.value === 'number') : []
  
  if (safeData.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: D.textMute, fontSize: 12 }}>
        Tidak ada data
      </div>
    )
  }

  const maxValue = Math.max(...safeData.map(d => d.value), 1)

  return (
    <div style={{ maxHeight, overflowY: 'auto' }}>
      {safeData.map((item, i) => {
        const pct = (item.value / maxValue) * 100
        const color = item.color ?? D.purple
        return (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <div style={{ color: D.text, fontWeight: 600 }}>
                {item.label}
                {item.sublabel && (
                  <span style={{ color: D.textMute, marginLeft: 6, fontSize: 11, fontWeight: 500 }}>
                    {item.sublabel}
                  </span>
                )}
              </div>
              <div style={{ color: D.text, fontWeight: 700 }}>
                {formatValue ? formatValue(item.value) : item.value.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 99, background: D.bg900, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 99,
                background: `linear-gradient(90deg, ${color}, ${color}80)`,
                transition: 'width 0.5s ease',
              }}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// DONUT CHART
// ══════════════════════════════════════════════════════════════
export function DonutChart({ 
  data, size = 200, centerLabel, centerValue,
}: { 
  data: Array<{ label: string; value: number; color: string }>
  size?: number
  centerLabel?: string
  centerValue?: string
}) {
  // ⚡ DEFENSIVE
  const safeData = Array.isArray(data) ? data.filter(d => d && typeof d.value === 'number') : []
  const total = safeData.reduce((s, d) => s + d.value, 0)
  
  if (total === 0) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `8px solid ${D.bg700}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: D.textMute, fontSize: 12,
      }}>
        Tidak ada data
      </div>
    )
  }

  const radius = (size - 20) / 2
  const innerRadius = radius * 0.62
  const center = size / 2
  let cumulative = 0
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {safeData.map((item, i) => {
          if (item.value === 0) return null
          const pct = item.value / total
          const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
          cumulative += pct
          const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
          
          const x1 = center + radius * Math.cos(startAngle)
          const y1 = center + radius * Math.sin(startAngle)
          const x2 = center + radius * Math.cos(endAngle)
          const y2 = center + radius * Math.sin(endAngle)
          const ix1 = center + innerRadius * Math.cos(startAngle)
          const iy1 = center + innerRadius * Math.sin(startAngle)
          const ix2 = center + innerRadius * Math.cos(endAngle)
          const iy2 = center + innerRadius * Math.sin(endAngle)
          const largeArc = pct > 0.5 ? 1 : 0
          
          const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
          return <path key={i} d={path} fill={item.color}/>
        })}
      </svg>
      
      {(centerLabel || centerValue) && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {centerLabel && (
            <div style={{ fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 2 }}>
              {centerLabel}
            </div>
          )}
          {centerValue && (
            <div style={{ fontSize: 20, color: D.text, fontWeight: 800 }}>{centerValue}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SPARKLINE
// ══════════════════════════════════════════════════════════════
export function Sparkline({ 
  values, color = D.purple, width = 80, height = 24,
}: { 
  values: number[]
  color?: string
  width?: number
  height?: number
}) {
  // ⚡ DEFENSIVE
  const safeValues = Array.isArray(values) ? values.filter(v => typeof v === 'number' && !isNaN(v)) : []
  
  if (safeValues.length < 2) {
    return <div style={{ width, height, color: D.textMute, fontSize: 10 }}>—</div>
  }
  
  const min = Math.min(...safeValues)
  const max = Math.max(...safeValues)
  const range = max - min || 1
  
  const points = safeValues
    .map((v, i) => {
      const x = (i / (safeValues.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════
// COLOR PALETTE
// ══════════════════════════════════════════════════════════════
export const CHART_COLORS = {
  primary:   D.purple,
  secondary: D.pink,
  success:   D.green,
  warning:   D.amber,
  danger:    D.red,
  info:      D.blue,
  tier: {
    starter:  D.textDim,
    basic:    D.amber,
    pro:      D.purple,
    business: D.blue,
  } as Record<string, string>,
  sequential: [
    D.purple, D.pink, D.amber, D.green, D.blue, D.indigo, D.emerald, D.red,
  ],
}