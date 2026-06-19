'use client'
// app/(dashboard)/marketing-kit/page.tsx
// ══════════════════════════════════════════════════════════════
// MARKETING KIT — Caption, Hook, CTA, Deskripsi, Hashtag, Ad Copy, WA Reply
// Light theme · Amber primary · Tab navigation · Responsive
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Copy, Check, RefreshCw, Sparkles, ChevronDown } from 'lucide-react'

const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB', borderHi:'#D1D5DB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5',
  blue:'#3B82F6',  blueLt:'#EFF6FF',
  purple:'#7C3AED',purpleLt:'#F5F3FF',
  red:'#EF4444',   redLt:'#FEF2F2',
  orange:'#F97316',orangeLt:'#FFF7ED',
  sh:'0 1px 3px rgba(0,0,0,.06)',
  sm:'0 4px 16px rgba(0,0,0,.07)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

const TOOLS = [
  { id:'caption',     icon:'✍️', label:'Caption',          color:C.amber,   desc:'Caption lengkap siap post, soft & hard selling' },
  { id:'hook',        icon:'🎣', label:'Hook Generator',   color:'#EF4444', desc:'Baris pertama yang bikin stop scroll' },
  { id:'cta',         icon:'🎯', label:'CTA Generator',    color:C.orange,  desc:'Call-to-action yang mendorong beli' },
  { id:'desc',        icon:'📋', label:'Deskripsi Produk', color:C.green,   desc:'Detail produk + benefit + spesifikasi' },
  { id:'hashtag',     icon:'#️⃣', label:'Hashtag AI',      color:C.blue,    desc:'Hashtag trending per niche & platform' },
  { id:'ad-copy',     icon:'📈', label:'Ad Copy',          color:C.purple,  desc:'Copy iklan Facebook Ads, TikTok Ads, Shopee Ads' },
  { id:'wa',          icon:'💬', label:'WA Reply AI',      color:'#16A34A', desc:'Template reply WhatsApp profesional & personal' },
  { id:'soft',        icon:'💫', label:'Soft Selling',     color:'#8B5CF6', desc:'Edukasi → nurturing → closing halus' },
  { id:'hard',        icon:'🔥', label:'Hard Selling',     color:'#DC2626', desc:'Direct offer + urgency + FOMO tinggi' },
  { id:'marketplace', icon:'🛍️', label:'Marketplace Copy', color:'#0284C7', desc:'Judul SEO + deskripsi untuk Shopee/Tokopedia' },
  { id:'headline',    icon:'📰', label:'Headline',         color:C.purple,  desc:'Judul artikel & konten yang menarik' },
  { id:'bio',         icon:'👤', label:'Bio Generator',    color:C.green,   desc:'Bio profil Instagram/TikTok yang menarik' },
]

const TONES = [
  { id:'casual',       label:'Kasual' },
  { id:'energetic',    label:'Energetik' },
  { id:'professional', label:'Profesional' },
  { id:'luxury',       label:'Luxury' },
  { id:'playful',      label:'Playful' },
  { id:'gen-z',        label:'Gen-Z' },
  { id:'islami',       label:'Islami' },
]

const PLATFORMS = [
  { id:'instagram',  label:'Instagram',   icon:'📸' },
  { id:'tiktok',     label:'TikTok',      icon:'🎵' },
  { id:'tiktok-shop',label:'TikTok Shop', icon:'🛒' },
  { id:'shopee',     label:'Shopee',      icon:'🛍️' },
  { id:'tokopedia',  label:'Tokopedia',   icon:'🟢' },
  { id:'facebook',   label:'Facebook',    icon:'📘' },
  { id:'whatsapp',   label:'WhatsApp',    icon:'💬' },
]

function Pill({ label, selected, onClick, color = C.amber }: { label:string; selected:boolean; onClick:()=>void; color?:string }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'5px 12px', borderRadius:'99px', border:`1.5px solid ${selected?color:C.border}`, background:selected?`${color}12`:C.surface, color:selected?color:C.inkMuted, fontSize:'12px', fontWeight:selected?700:500, cursor:'pointer', transition:'all .12s', fontFamily:'inherit', whiteSpace:'nowrap' }}>
      {label}
    </button>
  )
}

function ResultCard({ text, idx, copiedId, onCopy }: { text:string; idx:number; copiedId:string|null; onCopy:(t:string,i:string)=>void }) {
  const id = `r-${idx}`
  const copied = copiedId === id
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'12px', padding:'14px 16px', position:'relative', transition:'border-color .15s' }}
      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=C.amber}
      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.border}>
      <div style={{ paddingRight:'36px', fontSize:'13px', color:C.inkSub, lineHeight:1.75, whiteSpace:'pre-wrap' }}>{text}</div>
      <button onClick={() => onCopy(text, id)}
        style={{ position:'absolute', top:'12px', right:'12px', width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.border}`, background:copied?C.greenLt:C.surface, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
        {copied ? <Check size={13} color={C.green}/> : <Copy size={13} color={C.inkDim}/>}
      </button>
    </div>
  )
}

function MarketingKitInner() {
  const searchParams = useSearchParams()
  const [activeTool, setActiveTool] = useState(searchParams.get('t') ?? 'caption')
  const [productName,   setProductName]   = useState('')
  const [productDesc,   setProductDesc]   = useState('')
  const [productPrice,  setProductPrice]  = useState('')
  const [tone,          setTone]          = useState('casual')
  const [platform,      setPlatform]      = useState('instagram')
  const [variants,      setVariants]      = useState(3)
  const [loading,       setLoading]       = useState(false)
  const [results,       setResults]       = useState<string[]>([])
  const [error,         setError]         = useState('')
  const [copiedId,      setCopiedId]      = useState<string|null>(null)
  const [showAdvanced,  setShowAdvanced]  = useState(false)

  const tool = TOOLS.find(t => t.id === activeTool) ?? TOOLS[0]

  useEffect(() => { setResults([]); setError('') }, [activeTool])

  const copyText = useCallback(async (text:string, id:string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(()=>setCopiedId(null), 2000) } catch{}
  }, [])

  const generate = async () => {
    if (!productName.trim()) { setError('Masukkan nama produk terlebih dulu'); return }
    setError(''); setLoading(true); setResults([])
    try {
      const res = await fetch('/api/generate/content-suite', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          engine: activeTool === 'soft' ? 'soft-selling' : activeTool === 'hard' ? 'hard-selling' : activeTool,
          productName: productName.trim(),
          productDesc: productDesc || undefined,
          productPrice: productPrice || undefined,
          tone, platform, variants,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.message ?? `HTTP ${res.status}`) }
      const data = await res.json()
      setResults((data.items ?? []).map((i:any) => i.text ?? i))
    } catch(e:any) {
      setError(e.message ?? 'Generate gagal')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'clamp(18px,3vw,24px)', fontWeight:800, color:C.ink, letterSpacing:'-0.03em', marginBottom:'4px' }}>✍️ Marketing Kit</h1>
        <p style={{ fontSize:'13px', color:C.inkMuted }}>Generate caption, hook, CTA, deskripsi, hashtag & iklan dalam sekejap.</p>
      </div>

      {/* Tool tabs — scrollable */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'20px', overflowX:'auto', paddingBottom:'4px', scrollbarWidth:'none' } as React.CSSProperties}>
        {TOOLS.map(t => {
          const sel = activeTool === t.id
          return (
            <button key={t.id} type="button" onClick={() => setActiveTool(t.id)}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'99px', border:`1.5px solid ${sel?t.color:C.border}`, background:sel?`${t.color}12`:C.surface, color:sel?t.color:C.inkMuted, fontSize:'12px', fontWeight:sel?700:500, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap', flexShrink:0, fontFamily:'inherit', boxShadow:sel?`0 0 0 1px ${t.color}20`:'none' }}>
              <span>{t.icon}</span>{t.label}
            </button>
          )
        })}
      </div>

      {/* 2-col layout */}
      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:'20px', alignItems:'flex-start' }} className="mkit-layout">

        {/* LEFT: Form */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {/* Tool info */}
          <div style={{ padding:'14px 16px', borderRadius:'12px', background:`${tool.color}10`, border:`1px solid ${tool.color}25` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'5px' }}>
              <span style={{ fontSize:'18px' }}>{tool.icon}</span>
              <span style={{ fontSize:'14px', fontWeight:700, color:tool.color }}>{tool.label}</span>
            </div>
            <div style={{ fontSize:'11px', color:C.inkMuted, lineHeight:1.5 }}>{tool.desc}</div>
          </div>

          {/* Inputs */}
          <div style={{ background:C.surface, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.sh, padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
            {[
              { label:'Nama Produk *', ph:'Contoh: Serum Vitamin C 30ml', val:productName, set:setProductName, required:true },
              { label:'Deskripsi Produk', ph:'Benefit utama, bahan, keunggulan...', val:productDesc, set:setProductDesc, textarea:true },
              { label:'Harga Produk', ph:'Contoh: Rp99.000', val:productPrice, set:setProductPrice },
            ].map(item => (
              <div key={item.label}>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'5px' }}>{item.label}</label>
                {item.textarea ? (
                  <textarea value={item.val} onChange={e=>item.set(e.target.value)} placeholder={item.ph} rows={3}
                    style={{ width:'100%', padding:'9px 11px', borderRadius:'8px', border:`1px solid ${C.border}`, fontSize:'12px', color:C.ink, outline:'none', resize:'vertical', fontFamily:'inherit', lineHeight:1.5, transition:'border-color .15s', boxSizing:'border-box' }}
                    onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                    onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                ) : (
                  <input value={item.val} onChange={e=>item.set(e.target.value)} placeholder={item.ph}
                    style={{ width:'100%', padding:'9px 11px', borderRadius:'8px', border:`1px solid ${C.border}`, fontSize:'12px', color:C.ink, outline:'none', fontFamily:'inherit', transition:'border-color .15s', boxSizing:'border-box' }}
                    onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                    onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                )}
              </div>
            ))}

            {/* Tone */}
            <div>
              <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>Tone & Gaya</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {TONES.map(t => <Pill key={t.id} label={t.label} selected={tone===t.id} onClick={()=>setTone(t.id)}/>)}
              </div>
            </div>

            {/* Platform */}
            <div>
              <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>Platform Target</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {PLATFORMS.map(p => (
                  <Pill key={p.id} label={`${p.icon} ${p.label}`} selected={platform===p.id} onClick={()=>setPlatform(p.id)} color={C.blue}/>
                ))}
              </div>
            </div>

            {/* Advanced toggle */}
            <button type="button" onClick={()=>setShowAdvanced(p=>!p)}
              style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:C.inkMuted, background:'none', border:'none', cursor:'pointer', padding:'0', fontFamily:'inherit' }}>
              <ChevronDown size={12} style={{ transform:showAdvanced?'rotate(180deg)':'rotate(0)', transition:'transform .2s' }}/> Pengaturan Lanjutan
            </button>
            {showAdvanced && (
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>Jumlah Variasi: {variants}</label>
                <input type="range" min={1} max={5} value={variants} onChange={e=>setVariants(+e.target.value)} style={{ width:'100%', accentColor:C.amber }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:C.inkDim, marginTop:'2px' }}><span>1</span><span>5</span></div>
              </div>
            )}

            {error && <div style={{ padding:'9px 11px', borderRadius:'8px', background:C.redLt, border:`1px solid #FCA5A5`, fontSize:'12px', color:'#B91C1C' }}>{error}</div>}

            <button type="button" onClick={generate} disabled={loading}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'12px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, boxShadow:C.sa, fontFamily:'inherit', transition:'all .15s' }}
              onMouseEnter={e=>{ if(!loading)(e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}>
              {loading ? <><Loader2 size={14} style={{ animation:'spin .8s linear infinite' }}/> Generating...</> : <><Sparkles size={14}/> Generate {tool.label}</>}
            </button>
          </div>
        </div>

        {/* RIGHT: Results */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={{ fontSize:'14px', fontWeight:700, color:C.ink }}>
              {results.length > 0 ? `${results.length} Hasil ${tool.label}` : `Hasil ${tool.label}`}
            </div>
            {results.length > 0 && (
              <button type="button" onClick={generate} disabled={loading}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <RefreshCw size={12}/> Ulang
              </button>
            )}
          </div>

          {results.length === 0 && !loading ? (
            <div style={{ borderRadius:'14px', border:`1.5px dashed ${C.border}`, background:C.surface, padding:'48px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', textAlign:'center' }}>
              <span style={{ fontSize:'40px' }}>{tool.icon}</span>
              <div style={{ fontSize:'15px', fontWeight:700, color:C.inkMuted }}>Hasil {tool.label} Muncul di Sini</div>
              <div style={{ fontSize:'12px', color:C.inkDim, maxWidth:'280px', lineHeight:1.6 }}>
                Isi nama produk di panel kiri dan klik Generate untuk mulai.
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {loading ? (
                Array.from({length:variants}).map((_,i) => (
                  <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'12px', padding:'14px 16px' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {Array.from({length:4}).map((_,j) => (
                        <div key={j} style={{ height:'13px', background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite', borderRadius:'4px', width:`${70+j*8}%` }}/>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                results.map((text, i) => <ResultCard key={i} text={text} idx={i} copiedId={copiedId} onCopy={copyText}/>)
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing:border-box }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        textarea::placeholder, input::placeholder { color:#9CA3AF }
        .mkit-layout { grid-template-columns: 360px 1fr !important }
        @media (max-width:900px) { .mkit-layout { grid-template-columns: 1fr !important } }
      `}</style>
    </div>
  )
}

export default function MarketingKitPage() {
  return (
    <Suspense>
      <MarketingKitInner/>
    </Suspense>
  )
}