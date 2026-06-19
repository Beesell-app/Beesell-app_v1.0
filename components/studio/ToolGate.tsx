'use client'
// components/studio/ToolGate.tsx
// Bungkus konten tool page. Render anak hanya saat 'allowed';
// selain itu tampilkan kartu loading / locked / disabled.

import Link from 'next/link'
import { Lock, Loader2, AlertTriangle, ArrowRight } from 'lucide-react'
import { useFeatureGate } from '@/hooks/use-feature-gate'

type Theme = 'light' | 'dark'

const PAL = {
  light: { bg:'#F9FAFB', card:'#FFFFFF', border:'#E5E7EB', ink:'#111827',
           sub:'#6B7280', amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FFFBEB' },
  dark:  { bg:'#09090B', card:'#18181C', border:'#27272A', ink:'#FAFAFA',
           sub:'#A1A1AA', amber:'#F59E0B', amberDk:'#D97706', amberLt:'#F59E0B12' },
}

export function ToolGate({ featureId, theme = 'light', children }: {
  featureId: string; theme?: Theme; children: React.ReactNode
}) {
  const g = useFeatureGate(featureId)
  const c = PAL[theme]

  if (g.status === 'allowed') return <>{children}</>

  const shell = (inner: React.ReactNode) => (
    <div style={{ minHeight:'100vh', background:c.bg, fontFamily:"'DM Sans',system-ui,sans-serif",
      display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ maxWidth:420, width:'100%', textAlign:'center', padding:'32px 24px',
        borderRadius:16, background:c.card, border:`1px solid ${c.border}` }}>{inner}</div>
    </div>
  )

  if (g.status === 'loading') return shell(
    <div style={{ color:c.sub }}>
      <Loader2 size={26} color={c.amber} style={{ animation:'spin .9s linear infinite' }}/>
      <div style={{ marginTop:12, fontSize:13 }}>Memeriksa akses…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (g.status === 'disabled') return shell(<>
    <div style={{ width:52, height:52, borderRadius:14, margin:'0 auto 14px', background:c.amberLt,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <AlertTriangle size={24} color={c.amberDk}/>
    </div>
    <div style={{ fontSize:16, fontWeight:800, color:c.ink, marginBottom:6 }}>
      Fitur sedang dinonaktifkan
    </div>
    <div style={{ fontSize:12, color:c.sub, lineHeight:1.6, marginBottom:18 }}>
      Tool ini dimatikan sementara oleh admin. Coba lagi nanti.
    </div>
    <Link href="/studio" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px',
      borderRadius:10, background:c.amber, color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none' }}>
      Kembali ke Studio
    </Link>
  </>)

  // locked
  return shell(<>
    <div style={{ width:52, height:52, borderRadius:14, margin:'0 auto 14px', background:c.amberLt,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Lock size={22} color={c.amberDk}/>
    </div>
    <div style={{ fontSize:16, fontWeight:800, color:c.ink, marginBottom:6 }}>
      {g.feature?.name ?? 'Fitur terkunci'}
    </div>
    <div style={{ fontSize:12, color:c.sub, lineHeight:1.6, marginBottom:18 }}>
      Butuh plan <strong style={{ color:c.amberDk }}>{g.tierRequired.toUpperCase()}</strong> untuk membuka tool ini.
    </div>
    <Link href={g.upgradeHref} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px',
      borderRadius:10, background:`linear-gradient(135deg,${c.amber},${c.amberDk})`, color:'#fff',
      fontSize:13, fontWeight:800, textDecoration:'none' }}>
      Upgrade ke {g.tierRequired.toUpperCase()} <ArrowRight size={13}/>
    </Link>
  </>)
}