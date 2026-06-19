'use client'
// components/studio/ToolAccessBadge.tsx
// Pengganti badge hardcoded "Basic+", "Pro+ Only", dll di top bar.

import { Crown, Infinity as Inf } from 'lucide-react'
import { useFeatureGate } from '@/hooks/use-feature-gate'

export function ToolAccessBadge({ featureId, theme = 'light' }:
  { featureId: string; theme?: 'light' | 'dark' }) {
  const g = useFeatureGate(featureId)
  const amber = '#F59E0B', amberDk = '#D97706'
  const muted = theme === 'dark' ? '#A1A1AA' : '#6B7280'
  const line  = theme === 'dark' ? '#27272A' : '#E5E7EB'
  const soft  = theme === 'dark' ? '#F59E0B12' : '#FEF3C7'

  if (g.isSuperuser) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px',
      borderRadius:99, background:`linear-gradient(135deg,${amber},${amberDk})`, color:'#fff',
      fontSize:11, fontWeight:800 }}>
      <Crown size={11}/> <Inf size={11}/>
    </span>
  )
  if (!g.enabled) return (
    <span style={{ padding:'3px 10px', borderRadius:6, background:soft, color:amberDk,
      fontSize:11, fontWeight:700 }}>Nonaktif</span>
  )
  return (
    <span style={{ padding:'3px 10px', borderRadius:6, border:`1px solid ${line}`,
      background:soft, color:amberDk, fontSize:11, fontWeight:700 }}>
      {g.tierRequired.toUpperCase()}+
    </span>
  )
}