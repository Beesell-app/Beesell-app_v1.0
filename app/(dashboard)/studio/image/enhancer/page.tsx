'use client'
// app/(dashboard)/studio/image/enhancer/page.tsx
// ══════════════════════════════════════════════════════════════
// PRODUCT ENHANCER AI
// "1 Foto Produk → 20 Gaya Iklan Siap Jual"
// Light theme · Amber primary
// ══════════════════════════════════════════════════════════════
import { ToolGate }        from '@/components/studio/ToolGate'
import { ToolAccessBadge } from '@/components/studio/ToolAccessBadge'
import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, RefreshCw, X, Loader2, Sparkles,
  AlertCircle, Check, ZoomIn, CheckCircle2, Settings2,
  ChevronDown, ChevronUp, Copy, Star, Zap, ArrowRight,
  TrendingUp, Package, AlertTriangle,
} from 'lucide-react'
import {
  ENHANCER_PRESETS, POPULAR_PRESETS, CATEGORIES,
  BACKGROUNDS, LIGHTINGS, ANGLES, QUALITIES,
  type PresetId, type BackgroundId, type LightingId,
  type AngleId, type QualityId, type CategoryId,
} from '@/lib/studio/enhancer-presets'

// ── Design tokens ─────────────────────────────────────────────
const C = {
  amber:    '#F59E0B',
  amberDk:  '#D97706',
  amberLt:  '#FEF3C7',
  amberXlt: '#FFFBEB',
  white:    '#FFFFFF',
  bg:       '#F9FAFB',
  surface:  '#FFFFFF',
  border:   '#E5E7EB',
  borderHi: '#D1D5DB',
  ink:      '#111827',
  inkSub:   '#374151',
  inkMuted: '#6B7280',
  inkDim:   '#9CA3AF',
  green:    '#059669',
  greenLt:  '#ECFDF5',
  blue:     '#3B82F6',
  blueLt:   '#EFF6FF',
  purple:   '#7C3AED',
  purpleLt: '#F5F3FF',
  red:      '#EF4444',
  redLt:    '#FEF2F2',
  orange:   '#F97316',
  sh:  '0 1px 3px rgba(0,0,0,.06)',
  sm:  '0 4px 16px rgba(0,0,0,.07)',
  sa:  '0 6px 20px rgba(245,158,11,.22)',
}

// ── Preset grid card ──────────────────────────────────────────
function PresetCard({ id, selected, onSelect }: { id:PresetId; selected:boolean; onSelect:()=>void }) {
  const p = ENHANCER_PRESETS[id]
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        padding:'11px 10px', borderRadius:'12px', textAlign:'left',
        border:`1.5px solid ${selected ? p.color : C.border}`,
        background:selected ? p.colorLt : C.surface,
        cursor:'pointer', transition:'all .15s', fontFamily:'inherit',
        boxShadow:selected ? `0 0 0 1px ${p.color}30, ${C.sh}` : C.sh,
      }}
      onMouseEnter={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=p.color }}
      onMouseLeave={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=C.border }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'6px' }}>
        <span style={{ fontSize:'20px' }}>{p.icon}</span>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'2px' }}>
          {p.badge && (
            <span style={{ fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'4px', background:p.color, color:'#fff', whiteSpace:'nowrap' }}>
              {p.badge}
            </span>
          )}
          {selected && <CheckCircle2 size={13} color={p.color}/>}
        </div>
      </div>
      <div style={{ fontSize:'11px', fontWeight:700, color:selected ? p.color : C.ink, marginBottom:'2px', lineHeight:1.2 }}>
        {p.label}
      </div>
      <div style={{ fontSize:'9px', color:C.inkMuted, lineHeight:1.35 }}>
        {p.tagline}
      </div>
    </button>
  )
}

// ── Before/After slider ───────────────────────────────────────
function BASlider({ before, after }: { before:string; after:string }) {
  const [pos, setPos] = useState(50)
  const ref           = useRef<HTMLDivElement>(null)
  const dragging      = useRef(false)

  const update = (cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos(Math.max(2, Math.min(98, ((cx - r.left) / r.width) * 100)))
  }

  return (
    <div
      ref={ref}
      style={{ position:'relative', borderRadius:'12px', overflow:'hidden', cursor:'col-resize', userSelect:'none', touchAction:'none', background:C.bg }}
      onMouseDown={e=>{ dragging.current=true; update(e.clientX) }}
      onMouseMove={e=>{ if(dragging.current) update(e.clientX) }}
      onMouseUp={()=>{ dragging.current=false }}
      onMouseLeave={()=>{ dragging.current=false }}
      onTouchStart={e=>{ dragging.current=true; update(e.touches[0].clientX) }}
      onTouchMove={e=>{ if(dragging.current) update(e.touches[0].clientX) }}
      onTouchEnd={()=>{ dragging.current=false }}
    >
      <img src={after}  alt="Enhanced" style={{ width:'100%', display:'block', maxHeight:'540px', objectFit:'contain' }}/>
      <div style={{ position:'absolute', inset:0, clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <img src={before} alt="Original" style={{ width:'100%', maxHeight:'540px', objectFit:'contain', display:'block' }}/>
      </div>
      {/* Divider */}
      <div style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, width:'2.5px', background:'rgba(255,255,255,.95)', transform:'translateX(-50%)', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'34px', height:'34px', borderRadius:'50%', background:C.white, border:`2px solid ${C.amber}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,.25)', fontSize:'12px', fontWeight:700, color:C.amber }}>
          ⇄
        </div>
      </div>
      <div style={{ position:'absolute', top:'10px', left:'10px', padding:'3px 9px', borderRadius:'5px', background:'rgba(0,0,0,.6)', fontSize:'10px', fontWeight:700, color:'#fff' }}>Sebelum</div>
      <div style={{ position:'absolute', top:'10px', right:'10px', padding:'3px 9px', borderRadius:'5px', background:`${C.amber}dd`, fontSize:'10px', fontWeight:700, color:'#fff' }}>Sesudah</div>
      <div style={{ position:'absolute', bottom:'10px', left:'50%', transform:'translateX(-50%)', padding:'3px 10px', borderRadius:'5px', background:'rgba(0,0,0,.5)', fontSize:'9px', color:'rgba(255,255,255,.9)', whiteSpace:'nowrap' }}>← Geser untuk perbandingan →</div>
    </div>
  )
}

// ── Control chip ──────────────────────────────────────────────
function CtrlChip({ label, icon, selected, onClick, color = C.amber }: {
  label:string; icon:string; selected:boolean; onClick:()=>void; color?:string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'99px', border:`1.5px solid ${selected ? color : C.border}`, background:selected ? `${color}12` : C.surface, color:selected ? color : C.inkMuted, fontSize:'11px', fontWeight:selected?700:500, cursor:'pointer', transition:'all .12s', whiteSpace:'nowrap', fontFamily:'inherit' }}
      onMouseEnter={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=color }}
      onMouseLeave={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=C.border }}
    >
      <span style={{ fontSize:'12px' }}>{icon}</span>{label}
    </button>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function ProductEnhancerPage() {
  // Upload
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [drag,  setDrag]  = useState(false)

  // Preset selection
  const [activeCategory,  setActiveCategory]  = useState<CategoryId | 'popular'>('popular')
  const [selectedPreset,  setSelectedPreset]  = useState<PresetId>('shopee-clean')

  // Advanced controls
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [background,   setBackground]   = useState<BackgroundId>('white-clean')
  const [lighting,     setLighting]     = useState<LightingId>('bright-ecommerce')
  const [angle,        setAngle]        = useState<AngleId>('front')
  const [quality,      setQuality]      = useState<QualityId>('high')
  const [customPrompt, setCustomPrompt] = useState('')

  // Output
  const [generating,   setGenerating]   = useState(false)
  const [result,       setResult]       = useState<string | null>(null)
  const [showBA,       setShowBA]       = useState(false)
  const [error,        setError]        = useState('')
  const [elapsed,      setElapsed]      = useState(0)
  const [quotaInfo,    setQuotaInfo]    = useState<{used:number;limit:number}|null>(null)
  const [seconds,      setSeconds]      = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if(timerRef.current) clearInterval(timerRef.current) }, [])

  // Auto-set controls when preset changes
  useEffect(() => {
    const p = ENHANCER_PRESETS[selectedPreset]
    setBackground(p.defaultBackground)
    setLighting(p.defaultLighting)
    setAngle(p.defaultAngle)
  }, [selectedPreset])

  // Upload handlers
  const handleFile = useCallback((f: File) => {
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) return
    setImageFile(f); setResult(null); setError(''); setShowBA(false)
    setImagePreview(URL.createObjectURL(f))
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }

  // Generate
  const generate = useCallback(async () => {
    if (!imageFile) return
    setGenerating(true); setError(''); setResult(null); setShowBA(false); setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    try {
      const fd = new FormData()
      fd.append('image',      imageFile)
      fd.append('preset',     selectedPreset)
      fd.append('background', background)
      fd.append('lighting',   lighting)
      fd.append('angle',      angle)
      fd.append('quality',    quality)
      if (customPrompt.trim()) fd.append('custom', customPrompt.trim())

      const res = await fetch('/api/studio/image/enhancer', { method:'POST', body:fd })
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

      if (!res.ok) {
        const d = await res.json().catch(()=>({}))
        setError(d.upgrade ? '🔒 Upgrade ke Basic untuk akses Product Enhancer.' : d.error ?? `Error ${res.status}`)
        return
      }

      const ct      = res.headers.get('content-type') ?? ''
      const elapsed = parseInt(res.headers.get('x-elapsed-ms') ?? '0')
      const qU      = parseInt(res.headers.get('x-quota-used')  ?? '0')
      const qL      = parseInt(res.headers.get('x-quota-limit') ?? '0')
      setElapsed(Math.round(elapsed/1000))
      if (qU > 0) setQuotaInfo({ used:qU, limit:qL })

      if (ct.startsWith('image/')) {
        const blob = await res.blob()
        setResult(URL.createObjectURL(blob))
        setShowBA(true)
      } else {
        const d = await res.json()
        if (d.url) { setResult(d.url); setShowBA(true) }
        else setError('Tidak ada output dari AI')
      }
    } catch (e: any) {
      setError(e?.message ?? 'Kesalahan tak terduga')
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setGenerating(false)
    }
  }, [imageFile, selectedPreset, background, lighting, angle, quality, customPrompt])

  const download = useCallback(() => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `beesell-enhancer-${selectedPreset}-${Date.now()}.png`
    a.click()
  }, [result, selectedPreset])

  const preset   = ENHANCER_PRESETS[selectedPreset]
  const canGen   = !!imageFile && !generating
  const estTime  = quality === 'commercial' || quality === 'ultra-hd' ? '40-80s' : '20-45s'

  // Preset list for active category
  const categoryPresets = activeCategory === 'popular'
    ? POPULAR_PRESETS
    : (Object.values(ENHANCER_PRESETS) as typeof ENHANCER_PRESETS[PresetId][]).filter(p => p.category === activeCategory).map(p => p.id)

  return (
    <ToolGate featureId="product-enhancer" theme="light">
      <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

        {/* ── Top bar ────────────────────────────────────── */}
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'11px 20px', display:'flex', alignItems:'center', gap:'14px', position:'sticky', top:0, zIndex:100, boxShadow:C.sh }}>
          <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'5px', color:C.inkMuted, textDecoration:'none', fontSize:'13px' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.ink}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.inkMuted}>
            <ArrowLeft size={15}/> Studio
          </Link>
          <div style={{ width:'1px', height:'16px', background:C.border }}/>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:C.amberLt, border:`1px solid ${C.amber}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>✨</div>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>Product Enhancer AI</div>
              <div style={{ fontSize:'10px', color:C.inkMuted }}>1 foto produk → 20 gaya iklan siap jual</div>
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
            {quotaInfo && (
              <div style={{ padding:'3px 10px', borderRadius:'6px', background:C.bg, border:`1px solid ${C.border}`, fontSize:'11px', color:C.inkMuted }}>
                {quotaInfo.used}/{quotaInfo.limit} gambar/bln
              </div>
            )}
            <ToolAccessBadge featureId="product-enhancer" theme="light"/>
          </div>
        </div>

        <div style={{ maxWidth:'1300px', margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'400px 1fr', gap:'20px', alignItems:'flex-start' }} className="enhancer-layout">

          {/* ════ LEFT — Controls ════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

            {/* Upload zone */}
            <div style={{ background:C.surface, borderRadius:'16px', padding:'20px', border:`1px solid ${C.border}`, boxShadow:C.sh }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
              <div style={{ background:C.amberLt, padding:'8px', borderRadius:'8px' }}><Package size={16} color={C.amberDk}/></div>
              <span style={{ fontSize:'14px', fontWeight:800, color:C.ink }}>1. Upload Produk</span>
            </div>
              <div style={{ padding:'14px 16px' }}>
                {imagePreview ? (
                  <div style={{ position:'relative', borderRadius:'10px', overflow:'hidden', border:`1px solid ${C.border}` }}>
                    <img src={imagePreview} alt="Product" style={{ width:'100%', display:'block', maxHeight:'220px', objectFit:'contain', background:C.bg }}/>
                    <button onClick={() => { setImageFile(null); setImagePreview(null); setResult(null); setShowBA(false) }}
                      style={{ position:'absolute', top:'8px', right:'8px', width:'26px', height:'26px', borderRadius:'50%', background:'rgba(0,0,0,.55)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <X size={13}/>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e=>{e.preventDefault();setDrag(true)}}
                    onDragLeave={()=>setDrag(false)}
                    onDrop={handleDrop}
                    style={{ borderRadius:'12px', border:`2px dashed ${drag?C.amber:C.border}`, background:drag?C.amberXlt:C.bg, cursor:'pointer', padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', transition:'all .18s' }}
                  >
                    <div style={{ width:'46px', height:'46px', borderRadius:'12px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>📸</div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'3px' }}>Upload Foto Produk</div>
                      <div style={{ fontSize:'11px', color:C.inkMuted }}>Drag & drop · JPG, PNG, WEBP · Maks 20MB</div>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', justifyContent:'center', marginTop:'4px' }}>
                      {['Shopee','TikTok Shop','Instagram','Marketplace'].map(p => (
                        <span key={p} style={{ fontSize:'9px', fontWeight:600, padding:'2px 7px', borderRadius:'99px', background:C.amberLt, color:C.amberDk }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e=>{ const f=e.target.files?.[0]; if(f)handleFile(f); e.target.value='' }}/>
              </div>
            </div>

            {/* Preset picker */}
            <div style={{ background:C.surface, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                <div style={{ background:C.purpleLt, padding:'8px', borderRadius:'8px' }}><Sparkles size={16} color={C.purple}/></div>
                <span style={{ fontSize:'14px', fontWeight:800, color:C.ink }}>2. Pilih Gaya Iklan</span>
            </div>
              <div style={{ padding:'12px 14px' }}>
                {/* Category tabs */}
                <div style={{ display:'flex', gap:'4px', marginBottom:'12px', flexWrap:'wrap' }}>
                  {[
                    { id:'popular' as const, label:'⭐ Populer' },
                    ...Object.entries(CATEGORIES).map(([id, c]) => ({ id: id as CategoryId, label:`${c.icon} ${c.label}` })),
                  ].map(cat => (
                    <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)}
                      style={{ padding:'4px 10px', borderRadius:'7px', border:`1px solid ${activeCategory===cat.id?C.amber:C.border}`, background:activeCategory===cat.id?C.amberXlt:C.surface, fontSize:'10px', fontWeight:activeCategory===cat.id?700:500, color:activeCategory===cat.id?C.amberDk:C.inkMuted, cursor:'pointer', transition:'all .12s', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                      {cat.label}
                    </button>
                  ))}
                </div>
                {/* Preset grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                  {categoryPresets.map(id => (
                    <PresetCard key={id} id={id} selected={selectedPreset===id} onSelect={() => setSelectedPreset(id)}/>
                  ))}
                </div>
                {/* Selected preset detail */}
                {preset && (
                  <div style={{ marginTop:'12px', padding:'10px 12px', borderRadius:'10px', background:`${preset.color}08`, border:`1px solid ${preset.color}25` }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:preset.color, marginBottom:'3px' }}>
                      {preset.icon} {preset.label}
                    </div>
                    <div style={{ fontSize:'11px', color:C.inkMuted, lineHeight:1.5 }}>{preset.desc}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced controls (collapsible) */}
            <div style={{ background:C.surface, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden' }}>
              <button type="button" onClick={() => setShowAdvanced(p=>!p)}
                style={{ width:'100%', padding:'13px 16px', display:'flex', alignItems:'center', gap:'7px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                <Settings2 size={14} color={C.amberDk}/>
                <span style={{ fontSize:'12px', fontWeight:700, color:C.ink, flex:1, textAlign:'left' }}>Advanced Controls</span>
                {showAdvanced ? <ChevronUp size={14} color={C.inkMuted}/> : <ChevronDown size={14} color={C.inkMuted}/>}
              </button>
              {showAdvanced && (
                <div style={{ padding:'0 14px 14px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>Background Style</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {Object.entries(BACKGROUNDS).map(([id, bg]) => (
                        <CtrlChip key={id} label={bg.label} icon={bg.icon} selected={background===id} onClick={()=>setBackground(id as BackgroundId)}/>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>Lighting Style</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {Object.entries(LIGHTINGS).map(([id, lt]) => (
                        <CtrlChip key={id} label={lt.label} icon={lt.icon} selected={lighting===id} onClick={()=>setLighting(id as LightingId)} color={C.blue}/>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>Camera Angle</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {Object.entries(ANGLES).map(([id, ang]) => (
                        <CtrlChip key={id} label={ang.label} icon={ang.icon} selected={angle===id} onClick={()=>setAngle(id as AngleId)} color={C.purple}/>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>Quality Level</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'5px' }}>
                      {Object.entries(QUALITIES).map(([id, q]) => (
                        <button key={id} type="button" onClick={()=>setQuality(id as QualityId)}
                          style={{ padding:'7px 5px', borderRadius:'8px', border:`1.5px solid ${quality===id?C.amber:C.border}`, background:quality===id?C.amberXlt:C.surface, cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
                          <div style={{ fontSize:'14px', marginBottom:'2px' }}>{q.icon}</div>
                          <div style={{ fontSize:'9px', fontWeight:700, color:quality===id?C.amberDk:C.ink }}>{q.label}</div>
                          <div style={{ fontSize:'8px', color:C.inkDim, lineHeight:1.3, marginTop:'1px' }}>{q.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'5px' }}>Custom Prompt Tambahan</div>
                    <textarea
                      value={customPrompt}
                      onChange={e=>setCustomPrompt(e.target.value)}
                      placeholder='Contoh: "tambahkan daun teh segar di sekitar produk" atau "background warna sage green"'
                      rows={2}
                      style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', border:`1px solid ${C.border}`, fontSize:'11px', color:C.ink, resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.5, boxSizing:'border-box' }}
                      onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                      onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}
                    />
                    <div style={{ fontSize:'9px', color:C.inkDim, marginTop:'3px' }}>{customPrompt.length}/200 karakter</div>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding:'11px 13px', borderRadius:'10px', background:C.redLt, border:`1px solid ${C.red}30`, display:'flex', gap:'7px', alignItems:'flex-start', fontSize:'12px', color:'#B91C1C' }}>
                <AlertCircle size={14} style={{ flexShrink:0, marginTop:'1px' }}/> {error}
                {error.includes('Upgrade') && (
                  <Link href="/billing" style={{ marginLeft:'4px', fontWeight:700, color:C.amber, textDecoration:'none', whiteSpace:'nowrap' }}>Upgrade →</Link>
                )}
              </div>
            )}

            {/* Generate button */}
            <button type="button" onClick={generate} disabled={!canGen}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'14px', borderRadius:'12px', border:'none', background:canGen?`linear-gradient(135deg,${C.amber},${C.amberDk})`:C.inkDim, color:'#fff', fontSize:'14px', fontWeight:800, cursor:canGen?'pointer':'not-allowed', opacity:canGen?1:.4, boxShadow:canGen?C.sa:'none', fontFamily:'inherit', transition:'all .18s' }}
              onMouseEnter={e=>{ if(canGen)(e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}
            >
              {generating
                ? <><Loader2 size={16} style={{ animation:'spin .8s linear infinite' }}/> Enhancing... {seconds}s</>
                : <><Sparkles size={16}/> Enhance Sekarang — {preset?.label}</>
              }
            </button>
            {!imageFile && <div style={{ fontSize:'10px', color:C.inkMuted, textAlign:'center', marginTop:'-4px' }}>Upload foto produk untuk mulai</div>}
            {imageFile && !generating && (
              <div style={{ fontSize:'10px', color:C.inkMuted, textAlign:'center', marginTop:'-4px' }}>
                Estimasi waktu: {estTime} · {QUALITIES[quality].label}
              </div>
            )}
          </div>

          {/* ════ RIGHT — Results ════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {/* Header Hasil */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <h2 style={{ fontSize:'18px', fontWeight:800, color:C.ink, margin:0 }}>Hasil Enhancement</h2>
                <p style={{ fontSize:'12px', color:C.inkMuted, marginTop:'4px' }}>AI telah menyulap foto produkmu menjadi aset profesional</p>
              </div>
              {/* Tombol Aksi di kanan atas */}
              {result && (
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={download} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'10px', background:C.green, color:'#fff', fontWeight:700, fontSize:'12px', border:'none', cursor:'pointer' }}>
                    <Download size={14}/> Download
                  </button>
                </div>
              )}
            </div>

            {/* Loading */}
            {generating && (
              <div style={{ borderRadius:'16px', background:C.surface, border:`1px solid ${C.border}`, padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:'18px', boxShadow:C.sh }}>
                <div style={{ position:'relative', width:'70px', height:'70px' }}>
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid ${C.amber}20` }}/>
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid transparent`, borderTopColor:C.amber, animation:'spin .9s linear infinite' }}/>
                  <div style={{ position:'absolute', inset:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>✨</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'15px', fontWeight:700, color:C.ink, marginBottom:'6px' }}>AI sedang meng-enhance foto produk...</div>
                  <div style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'4px' }}>Preset: {preset?.label} · {QUALITIES[quality].label}</div>
                  <div style={{ fontSize:'11px', color:C.inkDim }}>{seconds}s · Estimasi {estTime}</div>
                </div>
                <div style={{ display:'flex', gap:'8px', alignItems:'center', fontSize:'10px', color:C.inkMuted, flexWrap:'wrap', justifyContent:'center' }}>
                  {['Analisis produk','Apply style','Enhance lighting','Final render'].map((step, i) => {
                    const done = seconds > [3,8,15,22][i]
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px', color:done?C.green:C.inkMuted }}>
                        {done ? <CheckCircle2 size={11} color={C.green}/> : <div style={{ width:'10px', height:'10px', borderRadius:'50%', border:`1.5px solid ${C.border}` }}/>}
                        {step}
                        {i < 3 && <span style={{ color:C.border }}>→</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty */}
            {!generating && !result && (
              <div style={{ borderRadius:'16px', border:`1.5px dashed ${C.border}`, background:C.surface, padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', textAlign:'center', boxShadow:C.sh }}>
                <span style={{ fontSize:'48px' }}>✨</span>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:800, color:C.ink, marginBottom:'8px' }}>
                    1 Foto Produk → 20 Gaya Iklan Siap Jual
                  </div>
                  <div style={{ fontSize:'13px', color:C.inkMuted, lineHeight:1.7, maxWidth:'360px' }}>
                    Upload foto produk seadanya → pilih preset → AI transform jadi visual premium dalam detik
                  </div>
                </div>
                {/* Feature grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', width:'100%', maxWidth:'480px', marginTop:'8px' }}>
                  {[
                    { icon:'🛍️', label:'Shopee Ready', desc:'CTR lebih tinggi' },
                    { icon:'🎵', label:'TikTok Viral', desc:'Scroll-stopping' },
                    { icon:'💎', label:'Luxury Style', desc:'Brand premium' },
                    { icon:'✨', label:'Beauty & Skincare', desc:'Kosmetik premium' },
                    { icon:'🍜', label:'Food Commercial', desc:'Menggugah selera' },
                    { icon:'📢', label:'Ad Creative', desc:'Meta & TikTok Ads' },
                  ].map((f, i) => (
                    <div key={i} style={{ padding:'10px 8px', borderRadius:'10px', background:C.bg, border:`1px solid ${C.border}`, textAlign:'center' }}>
                      <div style={{ fontSize:'18px', marginBottom:'4px' }}>{f.icon}</div>
                      <div style={{ fontSize:'10px', fontWeight:700, color:C.ink, marginBottom:'2px' }}>{f.label}</div>
                      <div style={{ fontSize:'9px', color:C.inkMuted }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:'4px', padding:'10px 16px', borderRadius:'10px', background:C.amberXlt, border:`1px solid ${C.amber}30`, fontSize:'12px', color:C.amberDk, lineHeight:1.6, maxWidth:'400px' }}>
                  💡 <strong>Value BeeSell AI:</strong> Foto produk jelek = CTR rendah = penjualan rendah. Enhancer solusinya.
                </div>
              </div>
            )}
          
            {/* Result */}
            <div style={{ borderRadius:'20px', overflow:'hidden', border:`1px solid ${C.border}`, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', background:C.surface }}>
              {/* Preview Content */}
              {result && !generating ? (
                <div style={{ position:'relative' }}>
                    {showBA ? <BASlider before={imagePreview!} after={result}/> : <img src={result} style={{ width:'100%' }} />}
                    {/* Label status di atas gambar */}
                    <div style={{ position:'absolute', top:'16px', left:'16px', padding:'6px 12px', borderRadius:'20px', background:'rgba(255,255,255,0.9)', backdropFilter:'blur(4px)', fontSize:'11px', fontWeight:700, color:C.amberDk }}>
                      Preset: {preset?.label}
                    </div>
                </div>
              ) : (
                /* Empty state dengan ilustrasi yang bersih */
                <div style={{ padding:'80px 20px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ fontSize:'48px', marginBottom:'16px' }}>✨</div>
                    <h3 style={{ margin:'0 0 8px', color:C.ink }}>Belum ada hasil</h3>
                    <p style={{ color:C.inkMuted, fontSize:'13px', maxWidth:'300px' }}>Upload foto produk dan pilih preset untuk mulai melihat keajaiban AI kami.</p>
                </div>
              )}
            

                {/* Action row */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'7px' }}>
                  {[
                    { icon:<Download size={14}/>,    label:'Download',     action:download,              color:C.amber  },
                    { icon:<ZoomIn size={14}/>,      label:'Before/After', action:()=>setShowBA(p=>!p),  color:C.blue   },
                    { icon:<RefreshCw size={14}/>,   label:'Ulang',        action:generate,              color:C.inkMuted},
                    { icon:<ArrowRight size={14}/>,  label:'Image to Video',action:()=>{},               color:C.purple },
                  ].map((btn, i) => (
                    <button key={i} type="button" onClick={btn.action}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', padding:'10px 5px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.surface, color:btn.color, cursor:'pointer', transition:'all .15s', fontFamily:'inherit', boxShadow:C.sh }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=btn.color;(e.currentTarget as HTMLElement).style.background=`${btn.color}10`}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.surface}}>
                      {btn.icon}
                      <span style={{ fontSize:'10px', fontWeight:600 }}>{btn.label}</span>
                    </button>
                  ))}
                </div>

                {/* Success info */}
                <div style={{ padding:'12px 14px', borderRadius:'11px', background:C.greenLt, border:`1px solid ${C.green}30`, display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <CheckCircle2 size={16} color={C.green} style={{ flexShrink:0, marginTop:'1px' }}/>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:C.green, marginBottom:'3px' }}>
                      Enhancement Selesai — {preset?.label} · {elapsed}s
                    </div>
                    <div style={{ fontSize:'11px', color:'#064E3B', lineHeight:1.6 }}>
                      Foto produk siap digunakan untuk <strong>Shopee, TikTok Shop, Instagram, dan iklan berbayar</strong>. Download atau gunakan di fitur lainnya.
                    </div>
                  </div>
                </div>

                {/* Try other presets */}
                <div style={{ padding:'13px 14px', borderRadius:'11px', background:C.surface, border:`1px solid ${C.border}`, boxShadow:C.sh }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'10px' }}>
                    ✨ Coba Preset Lainnya dengan Foto yang Sama
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {POPULAR_PRESETS.filter(id => id !== selectedPreset).slice(0,6).map(id => {
                      const p = ENHANCER_PRESETS[id]
                      return (
                        <button key={id} type="button" onClick={()=>{ setSelectedPreset(id); generate() }}
                          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'8px', border:`1px solid ${p.color}30`, background:`${p.color}08`, color:p.color, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${p.color}18`}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`${p.color}08`}}>
                          {p.icon} {p.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Next steps */}
                <div style={{ padding:'13px 14px', borderRadius:'11px', background:C.surface, border:`1px solid ${C.border}`, boxShadow:C.sh }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'10px' }}>Langkah Selanjutnya</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
                    {[
                      { icon:'🎬', label:'Image to Video',   href:'/studio/video/image-to-video', color:C.purple },
                      { icon:'🔍', label:'Upscale 4K',        href:'/quick-tools?tool=upscale',    color:C.blue   },
                      { icon:'📁', label:'Simpan ke Library', href:'/library',                     color:C.amber  },
                    ].map((item, i) => (
                      <Link key={i} href={item.href}
                        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', padding:'10px 5px', borderRadius:'9px', border:`1px solid ${C.border}`, background:C.bg, textDecoration:'none', transition:'all .15s' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=item.color;(e.currentTarget as HTMLElement).style.background=`${item.color}10`}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.bg}}>
                        <span style={{ fontSize:'18px' }}>{item.icon}</span>
                        <span style={{ fontSize:'10px', fontWeight:600, color:item.color, textAlign:'center' }}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing:border-box }
          @keyframes spin { to{transform:rotate(360deg)} }
          textarea::placeholder, input::placeholder { color:#9CA3AF }
          ::-webkit-scrollbar { width:4px }
          ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
          .enhancer-layout { grid-template-columns: 400px 1fr !important }
          @media (max-width:1023px) { .enhancer-layout { grid-template-columns: 1fr !important } }
        `}</style>
      </div>
  </ToolGate>
  )
}