'use client'
// app/(dashboard)/studio/image/tryon/page.tsx
// AI Try-On Fashion — premium dark-mode studio aesthetic

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  Upload, Download, RefreshCw, X, Loader2, Sparkles,
  ArrowLeft, Check, AlertCircle, ChevronRight,
  RotateCcw, ZoomIn, Info, Play,
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────
const T = {
  bg:       '#FAFAF8',
  surface:  '#FAFAF8',
  card:     '#FAFAF8',
  border:   '#27272A',
  borderHi: '#3F3F46',
  accent:   '#A855F7',   // purple-500
  accent2:  '#EC4899',   // pink-500
  accentLo: '#A855F720',
  gold:     '#F59E0B',
  goldLo:   '#F59E0B20',
  green:    '#10B981',
  greenLo:  '#10B98120',
  red:      '#EF4444',
  redLo:    '#EF444420',
  muted:    '#52525B',
  dimmed:   '#71717A',
  sub:      '#A1A1AA',
  text:     '#E4E4E7',
  white:    '#FAFAFA',
}

// ── Category options ──────────────────────────────────────────
const CATEGORIES = [
  { id:'upper_body', label:'Atasan', icon:'👕', desc:'Kaos, kemeja, blouse, jaket, sweater' },
  { id:'lower_body', label:'Bawahan', icon:'👖', desc:'Celana, rok, legging, shorts' },
  { id:'dresses',    label:'Dress', icon:'👗', desc:'Dress, gamis, jumpsuit, overall' },
]

// ── Setting presets ───────────────────────────────────────────
const PROMPT_PRESETS = [
  { label:'Default (Auto)',      value:'' },
  { label:'Jaket terbuka',       value:'open jacket over shirt' },
  { label:'Baju dimasukkan',     value:'shirt tucked in' },
  { label:'Lengan digulung',     value:'sleeves rolled up' },
  { label:'Collar dibuka',       value:'collar open casually' },
  { label:'Baju dilepas casual', value:'jacket worn loosely off shoulders' },
]

// ── Starter Models (lokal Indonesia focus) ────────────────────
const STARTER_MODELS = [
  { id:'wanita-muda',   label:'Wanita Muda',    icon:'👩', desc:'Indo, 22-28th, slim',    category:'women', age:'adult' },
  { id:'wanita-hijab',  label:'Hijab Wanita',   icon:'🧕', desc:'Indo, berhijab, 24-32th', category:'women', age:'adult' },
  { id:'pria-muda',     label:'Pria Muda',      icon:'👨', desc:'Indo, 22-28th, atletis',  category:'men',   age:'adult' },
  { id:'remaja-wanita', label:'Remaja Wanita',  icon:'👧', desc:'Asia, 14-16th',            category:'women', age:'teen' },
  { id:'remaja-pria',   label:'Remaja Pria',    icon:'👦', desc:'Asia, 14-16th',            category:'men',   age:'teen' },
  { id:'anak-perempuan',label:'Anak Perempuan', icon:'🧒', desc:'Indo, 6-10th',             category:'women', age:'kid' },
  { id:'anak-laki',     label:'Anak Laki-laki', icon:'🧒', desc:'Indo, 6-10th',             category:'men',   age:'kid' },
  { id:'balita',        label:'Balita',         icon:'👶', desc:'2-4 tahun',                category:'women', age:'toddler' },
]

// ── Upload zone component ─────────────────────────────────────
interface UploadZoneProps {
  label:      string
  sublabel:   string
  icon:       string
  preview:    string | null
  onFile:     (f: File) => void
  onClear:    () => void
  disabled?:  boolean
  accent?:    string
  tips?:      string[]
}

function UploadZone({ label, sublabel, icon, preview, onFile, onClear, disabled, accent = T.accent, tips }: UploadZoneProps) {
  const ref        = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) onFile(f)
  }, [onFile])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      {/* Label */}
      <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
        <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:`${accent}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>{icon}</div>
        <div>
          <div style={{ fontSize:'12px', fontWeight:700, color:T.white, letterSpacing:'0.01em' }}>{label}</div>
          <div style={{ fontSize:'10px', color:T.dimmed }}>{sublabel}</div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !disabled && !preview && ref.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!preview) setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          position:    'relative',
          borderRadius:'14px',
          border:      `1.5px dashed ${drag ? accent : preview ? T.borderHi : T.border}`,
          background:  drag ? `${accent}08` : preview ? T.card : T.surface,
          aspectRatio: '3/4',
          display:     'flex',
          alignItems:  'center',
          justifyContent:'center',
          cursor:      disabled || preview ? 'default' : 'pointer',
          overflow:    'hidden',
          transition:  'all .2s',
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
            {/* Overlay on hover */}
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.0)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'background .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.55)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'}
            >
              <button onClick={e => { e.stopPropagation(); ref.current?.click() }}
                style={{ padding:'7px 14px', borderRadius:'8px', border:`1px solid rgba(255,255,255,.3)`, background:'rgba(255,255,255,.15)', color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', backdropFilter:'blur(8px)', opacity:0, transition:'opacity .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0'}
              >
                Ganti Foto
              </button>
              <button onClick={e => { e.stopPropagation(); onClear() }}
                style={{ width:'32px', height:'32px', borderRadius:'50%', border:'none', background:'rgba(239,68,68,.8)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', opacity:0, transition:'opacity .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0'}
              >
                <X size={13}/>
              </button>
            </div>
            {/* Corner badge */}
            <div style={{ position:'absolute', bottom:'8px', left:'8px', padding:'3px 8px', borderRadius:'6px', background:'rgba(0,0,0,.7)', fontSize:'9px', color:'rgba(255,255,255,.8)', fontWeight:600, backdropFilter:'blur(4px)' }}>
              ✓ Siap
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'20px 16px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:`${accent}18`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', margin:'0 auto 12px' }}>
              {icon}
            </div>
            <div style={{ fontSize:'13px', fontWeight:700, color:T.text, marginBottom:'4px' }}>
              {drag ? 'Lepas foto di sini' : 'Upload foto'}
            </div>
            <div style={{ fontSize:'10px', color:T.muted, lineHeight:1.5, marginBottom:'14px' }}>
              {drag ? '✓ Format didukung' : 'Drag & drop atau klik'}
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'7px 16px', borderRadius:'9px', background:`${accent}20`, border:`1px solid ${accent}35`, color:accent, fontSize:'11px', fontWeight:700 }}>
              <Upload size={12}/> Pilih Foto
            </div>
            <div style={{ fontSize:'9px', color:T.muted, marginTop:'10px' }}>PNG JPG WEBP · Maks 15MB</div>
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}/>
      </div>

      {/* Tips */}
      {tips && !preview && (
        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          {tips.map((t, i) => (
            <div key={i} style={{ display:'flex', gap:'6px', alignItems:'flex-start' }}>
              <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:accent, marginTop:'5px', flexShrink:0 }}/>
              <span style={{ fontSize:'10px', color:T.muted, lineHeight:1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Result comparison ─────────────────────────────────────────
function ResultCompare({ before, after }: { before: string; after: string }) {
  const [pos, setPos]   = useState(50)
  const [drag, setDrag] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  const move = useCallback((x: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos(Math.max(2, Math.min(98, (x - r.left) / r.width * 100)))
  }, [])

  useEffect(() => {
    if (!drag) return
    const mm = (e: MouseEvent)  => move(e.clientX)
    const tm = (e: TouchEvent)  => move(e.touches[0].clientX)
    const up = ()               => setDrag(false)
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup',   up)
    window.addEventListener('touchmove', tm, { passive:true })
    window.addEventListener('touchend',  up)
    return () => { window.removeEventListener('mousemove',mm); window.removeEventListener('mouseup',up); window.removeEventListener('touchmove',tm); window.removeEventListener('touchend',up) }
  }, [drag, move])

  return (
    <div ref={ref}
      style={{ position:'relative', width:'100%', aspectRatio:'3/4', borderRadius:'18px', overflow:'hidden', cursor:'col-resize', userSelect:'none', background:'#000' }}
      onMouseDown={() => setDrag(true)}
      onTouchStart={() => setDrag(true)}
    >
      {/* After */}
      <img src={after} alt="After" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain' }}/>
      {/* Before (clipped) */}
      <div style={{ position:'absolute', inset:0, clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <img src={before} alt="Before" style={{ width:'100%', height:'100%', objectFit:'contain', background:T.surface }}/>
      </div>
      {/* Divider line */}
      <div style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, width:'1.5px', background:'rgba(255,255,255,.9)', transform:'translateX(-50%)', boxShadow:'0 0 16px rgba(0,0,0,.8)' }}>
        {/* Handle */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'36px', height:'36px', borderRadius:'50%', background:'#fff', boxShadow:'0 4px 20px rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'col-resize' }}>
          <span style={{ fontSize:'14px', letterSpacing:'-2px', color:'#333' }}>⇔</span>
        </div>
      </div>
      {/* Labels */}
      <div style={{ position:'absolute', top:'12px', left:'12px', padding:'4px 10px', borderRadius:'8px', background:'rgba(0,0,0,.65)', fontSize:'10px', color:'rgba(255,255,255,.9)', fontWeight:700, backdropFilter:'blur(6px)', letterSpacing:'0.03em' }}>
        MODEL
      </div>
      <div style={{ position:'absolute', top:'12px', right:'12px', padding:'4px 10px', borderRadius:'8px', background:`rgba(168,85,247,.85)`, fontSize:'10px', color:'#fff', fontWeight:700, backdropFilter:'blur(6px)', letterSpacing:'0.03em' }}>
        ✨ TRY-ON
      </div>
    </div>
  )
}

// ── Loading animation ─────────────────────────────────────────
function LoadingState({ message }: { message: string }) {
  const steps = [
    'Menganalisis foto model...',
    'Membaca detail pakaian...',
    'AI fitting pakaian ke model...',
    'Menyesuaikan tekstur & ukuran...',
    'Rendering hasil akhir...',
  ]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep(p => p < steps.length - 1 ? p + 1 : p), 6000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', minHeight:'400px', gap:'24px', padding:'40px' }}>
      {/* Animated ring */}
      <div style={{ position:'relative', width:'80px', height:'80px' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`2px solid ${T.border}` }}/>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`2px solid transparent`, borderTopColor:T.accent, animation:'spin 1.2s linear infinite' }}/>
        <div style={{ position:'absolute', inset:'8px', borderRadius:'50%', border:`2px solid transparent`, borderTopColor:T.accent2, animation:'spin 0.8s linear infinite reverse' }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>👗</div>
      </div>
      {/* Progress dots */}
      <div style={{ display:'flex', flexDirection:'column', gap:'6px', width:'100%', maxWidth:'280px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'9px', opacity: i <= step ? 1 : 0.25, transition:'opacity .4s' }}>
            <div style={{ width:'16px', height:'16px', borderRadius:'50%', background: i < step ? T.green : i === step ? T.accent : T.border, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background .3s' }}>
              {i < step && <Check size={9} color="#fff"/>}
              {i === step && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fff', animation:'pulse 1s ease-in-out infinite' }}/>}
            </div>
            <span style={{ fontSize:'11px', color: i <= step ? T.text : T.muted, fontWeight: i === step ? 600 : 400 }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:'11px', color:T.dimmed }}>⏱️ Estimasi 30-50 detik</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function TryOnPage() {
  const [modelFile,    setModelFile]    = useState<File|null>(null)
  const [modelPreview, setModelPreview] = useState<string|null>(null)
  const [garmentFile,  setGarmentFile]  = useState<File|null>(null)
  const [garmentPrev,  setGarmentPrev]  = useState<string|null>(null)
  const [category,     setCategory]     = useState('upper_body')
  const [prompt,       setPrompt]       = useState('')
  const [promptPreset, setPromptPreset] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState<string|null>(null)
  const [error,        setError]        = useState('')
  const [showCompare,  setShowCompare]  = useState(false)
  const [showStarters, setShowStarters] = useState(false)
  const [starterFilter,setStarterFilter]= useState<{gender:string;age:string}>({gender:'all',age:'all'})
  const [zoomed,       setZoomed]       = useState(false)
  const [elapsed,      setElapsed]      = useState('')

  const handleModel = useCallback((f: File) => {
    if (f.size > 15*1024*1024) { setError('Model: maks 15MB'); return }
    setModelFile(f); setModelPreview(URL.createObjectURL(f)); setError(''); setResult(null)
  }, [])

  const handleGarment = useCallback((f: File) => {
    if (f.size > 15*1024*1024) { setError('Pakaian: maks 15MB'); return }
    setGarmentFile(f); setGarmentPrev(URL.createObjectURL(f)); setError(''); setResult(null)
  }, [])

  const generate = async () => {
    if (!modelFile)   { setError('Upload foto model dulu'); return }
    if (!garmentFile) { setError('Upload foto pakaian dulu'); return }
    setLoading(true); setError(''); setResult(null); setShowCompare(false)
    const t0 = Date.now()
    try {
      const fd = new FormData()
      fd.append('modelImage',   modelFile)
      fd.append('garmentImage', garmentFile)
      fd.append('category',     category)
      fd.append('prompt',       prompt || promptPreset)

      const res = await fetch('/api/studio/tryon', { method:'POST', body: fd })
      setElapsed(((Date.now()-t0)/1000).toFixed(1)+'s')
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message ?? `Error ${res.status}`)
      }
      const ct = res.headers.get('content-type') ?? ''
      const blobUrl = ct.startsWith('image/')
        ? URL.createObjectURL(await res.blob())
        : (await res.json()).url
      setResult(blobUrl)
    } catch (e: any) {
      setError(e.message ?? 'Generate gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result; a.download = `beesell-tryon-${Date.now()}.png`; a.click()
  }

  const readyToGenerate = !!modelFile && !!garmentFile && !loading

  const filteredStarters = STARTER_MODELS.filter(m =>
    (starterFilter.gender === 'all' || m.category === starterFilter.gender) &&
    (starterFilter.age    === 'all' || m.age      === starterFilter.age)
  )

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'24px 20px' }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ marginBottom:'28px' }}>
          <Link href="/studio" style={{ display:'inline-flex', alignItems:'center', gap:'6px', color:T.dimmed, textDecoration:'none', fontSize:'12px', marginBottom:'16px' }}>
            <ArrowLeft size={13}/>
            <span>AI Studio</span>
            <ChevronRight size={11}/>
            <span>AI Image Generator</span>
          </Link>

          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:`linear-gradient(135deg, ${T.accent}, ${T.accent2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', boxShadow:`0 8px 24px ${T.accent}40` }}>
                  👗
                </div>
                <div>
                  <h1 style={{ fontSize:'24px', fontWeight:800, color:T.gold, letterSpacing:'-0.03em', lineHeight:1 }}>
                    AI Try-On Fashion
                  </h1>
                  <p style={{ fontSize:'12px', color:T.dimmed, marginTop:'3px' }}>
                    Upload pakaian + model → AI fitting otomatis
                  </p>
                </div>
              </div>
            </div>

            {/* Status pills */}
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {[
                { icon:'⚡', label:'Powered by IDM-VTON' },
                { icon:'🎯', label:'Preserve identity & pose' },
              ].map((p,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', borderRadius:'99px', background:T.surface, border:`1px solid ${T.border}`, fontSize:'10px', color:T.sub, fontWeight:600 }}>
                  <span>{p.icon}</span>{p.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main layout ─────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px', alignItems:'flex-start' }}>

          {/* ════ COL 1: Model Upload ════════════════════════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ padding:'16px', borderRadius:'16px', background:T.card, border:`1px solid ${T.border}` }}>
              {/* Starter Models toggle */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:T.sub, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Step 1
                </div>
                <button onClick={() => setShowStarters(p=>!p)}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', borderRadius:'8px', border:`1px solid ${T.border}`, background:showStarters?`${T.accent}15`:T.surface, color:showStarters?T.accent:T.dimmed, fontSize:'10px', fontWeight:700, cursor:'pointer' }}>
                  👤 Starter Models {showStarters?'▲':'▼'}
                </button>
              </div>

              {/* Starter gallery */}
              {showStarters && (
                <div style={{ marginBottom:'12px', padding:'12px', background:T.surface, borderRadius:'12px', border:`1px solid ${T.border}` }}>
                  {/* Filters */}
                  <div style={{ display:'flex', gap:'5px', marginBottom:'10px', flexWrap:'wrap' }}>
                    {[{k:'gender',v:'all',l:'Semua'},{k:'gender',v:'women',l:'Wanita'},{k:'gender',v:'men',l:'Pria'}].map(f=>(
                      <button key={f.v} type="button"
                        onClick={()=>setStarterFilter(p=>({...p,gender:f.v}))}
                        style={{ padding:'4px 10px', borderRadius:'6px', border:`1px solid ${starterFilter.gender===f.v?T.accent:T.border}`, background:starterFilter.gender===f.v?`${T.accent}20`:T.card, color:starterFilter.gender===f.v?T.accent:T.dimmed, fontSize:'10px', fontWeight:600, cursor:'pointer' }}>
                        {f.l}
                      </button>
                    ))}
                    <div style={{ width:'1px', background:T.border, alignSelf:'stretch', margin:'0 2px' }}/>
                    {[{v:'all',l:'Semua'},{v:'adult',l:'Dewasa'},{v:'teen',l:'Remaja'},{v:'kid',l:'Anak'},{v:'toddler',l:'Balita'}].map(f=>(
                      <button key={f.v} type="button"
                        onClick={()=>setStarterFilter(p=>({...p,age:f.v}))}
                        style={{ padding:'4px 10px', borderRadius:'6px', border:`1px solid ${starterFilter.age===f.v?T.gold:T.border}`, background:starterFilter.age===f.v?`${T.gold}20`:T.card, color:starterFilter.age===f.v?T.gold:T.dimmed, fontSize:'10px', fontWeight:600, cursor:'pointer' }}>
                        {f.l}
                      </button>
                    ))}
                  </div>
                  {/* Model cards */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                    {filteredStarters.map(m => (
                      <button key={m.id} type="button"
                        onClick={() => {
                          // In real app: fetch starter model image
                          setShowStarters(false)
                        }}
                        style={{ padding:'8px', borderRadius:'9px', border:`1px solid ${T.border}`, background:T.card, cursor:'pointer', textAlign:'left', transition:'all .12s' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=T.accent}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=T.border}
                      >
                        <div style={{ fontSize:'20px', marginBottom:'3px' }}>{m.icon}</div>
                        <div style={{ fontSize:'10px', fontWeight:700, color:T.text }}>{m.label}</div>
                        <div style={{ fontSize:'9px', color:T.muted }}>{m.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize:'9px', color:T.muted, marginTop:'8px', textAlign:'center' }}>
                    Atau upload foto model sendiri di bawah →
                  </div>
                </div>
              )}

              <UploadZone
                label="Foto Model"
                sublabel="Orang yang akan memakai pakaian"
                icon="🧑"
                preview={modelPreview}
                onFile={handleModel}
                onClear={() => { setModelFile(null); setModelPreview(null) }}
                accent={T.accent}
                tips={[
                  'Foto full body atau 3/4 badan',
                  'Pakaian asli yang dipakai harus terlihat jelas',
                  'Hindari pose ekstrem atau background ramai',
                  'Rasio 2:3 (portrait) = hasil terbaik',
                ]}
              />
            </div>

            {/* Model best practices hint */}
            <div style={{ padding:'11px 13px', borderRadius:'12px', background:`${T.accent}10`, border:`1px solid ${T.accent}25` }}>
              <div style={{ display:'flex', gap:'7px', alignItems:'flex-start' }}>
                <Info size={13} color={T.accent} style={{ flexShrink:0, marginTop:'1px' }}/>
                <div style={{ fontSize:'10px', color:T.sub, lineHeight:1.6 }}>
                  <b style={{ color:T.accent }}>Best Practice:</b> Gunakan foto standing dengan pakaian yang pas badan agar AI bisa mendeteksi bentuk tubuh dengan akurat.
                </div>
              </div>
            </div>
          </div>

          {/* ════ COL 2: Garment Upload + Settings ══════════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ padding:'16px', borderRadius:'16px', background:T.card, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:T.sub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px' }}>
                Step 2
              </div>

              <UploadZone
                label="Foto Pakaian"
                sublabel="Item fashion yang ingin di-try-on"
                icon="👗"
                preview={garmentPrev}
                onFile={handleGarment}
                onClear={() => { setGarmentFile(null); setGarmentPrev(null) }}
                accent={T.accent2}
                tips={[
                  'Foto on-model = hasil terbaik',
                  'Ghost mannequin juga bagus',
                  'Flat-lay bisa digunakan',
                  'Hindari foto di hanger atau dilipat',
                ]}
              />
            </div>

            {/* Category */}
            <div style={{ padding:'14px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:T.sub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>
                Kategori Pakaian
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 13px', borderRadius:'10px', border:`1.5px solid ${category===cat.id?T.accent2:T.border}`, background:category===cat.id?`${T.accent2}12`:T.surface, cursor:'pointer', textAlign:'left', transition:'all .13s' }}>
                    <span style={{ fontSize:'18px' }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontSize:'12px', fontWeight:category===cat.id?700:500, color:category===cat.id?T.white:T.sub }}>{cat.label}</div>
                      <div style={{ fontSize:'10px', color:T.muted }}>{cat.desc}</div>
                    </div>
                    {category===cat.id && <div style={{ marginLeft:'auto', width:'18px', height:'18px', borderRadius:'50%', background:T.accent2, display:'flex', alignItems:'center', justifyContent:'center' }}><Check size={10} color="#fff"/></div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div style={{ padding:'14px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:T.sub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>
                Styling Prompt <span style={{ color:T.muted, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opsional)</span>
              </div>

              {/* Preset chips */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'9px' }}>
                {PROMPT_PRESETS.map(p => (
                  <button key={p.value} type="button"
                    onClick={() => { setPromptPreset(p.value); setPrompt(p.value) }}
                    style={{ padding:'4px 10px', borderRadius:'6px', border:`1px solid ${promptPreset===p.value?T.gold:T.border}`, background:promptPreset===p.value?`${T.gold}20`:T.surface, color:promptPreset===p.value?T.gold:T.dimmed, fontSize:'10px', fontWeight:promptPreset===p.value?700:500, cursor:'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={2}
                placeholder={'Contoh: "open jacket", "tucked shirt"\nKosongkan untuk hasil default AI'}
                style={{ width:'100%', padding:'10px 12px', borderRadius:'9px', border:`1px solid ${T.border}`, background:T.surface, color:T.text, fontSize:'11px', fontFamily:"'DM Sans', system-ui", resize:'vertical', outline:'none', lineHeight:1.6, boxSizing:'border-box' }}
              />
              <div style={{ fontSize:'9px', color:T.muted, marginTop:'5px', lineHeight:1.5 }}>
                💡 Describe HANYA cara styling — bukan warna/pattern pakaian (AI baca otomatis dari foto)
              </div>
            </div>
          </div>

          {/* ════ COL 3: Result ══════════════════════════════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

            {/* Step 3 label */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:T.sub, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Step 3 — Hasil
              </div>
              {result && (
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={() => setShowCompare(p=>!p)}
                    style={{ padding:'5px 10px', borderRadius:'7px', border:`1px solid ${showCompare?T.accent:T.border}`, background:showCompare?`${T.accent}20`:T.surface, color:showCompare?T.accent:T.dimmed, fontSize:'10px', fontWeight:700, cursor:'pointer' }}>
                    ⇔ Compare
                  </button>
                  <button onClick={() => setZoomed(true)}
                    style={{ padding:'5px 9px', borderRadius:'7px', border:`1px solid ${T.border}`, background:T.surface, color:T.dimmed, fontSize:'10px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                    <ZoomIn size={12}/>
                  </button>
                  <button onClick={download}
                    style={{ padding:'5px 11px', borderRadius:'7px', border:'none', background:T.accent, color:'#fff', fontSize:'10px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontFamily:"'DM Sans',system-ui" }}>
                    <Download size={11}/> Save
                  </button>
                </div>
              )}
            </div>

            {/* Result area */}
            <div style={{ borderRadius:'18px', background:T.card, border:`1px solid ${T.border}`, overflow:'hidden', minHeight:'420px', display:'flex', flexDirection:'column' }}>
              {loading ? (
                <LoadingState message=""/>
              ) : result ? (
                <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  {showCompare && modelPreview
                    ? <ResultCompare before={modelPreview} after={result}/>
                    : (
                      <div style={{ position:'relative', borderRadius:'14px', overflow:'hidden', background:'#000', cursor:'zoom-in' }}
                        onClick={() => setZoomed(true)}>
                        <img src={result} alt="Try-on result" style={{ width:'100%', maxHeight:'500px', objectFit:'contain', display:'block' }}/>
                        <div style={{ position:'absolute', top:'10px', left:'10px', display:'flex', gap:'6px' }}>
                          <div style={{ padding:'3px 9px', borderRadius:'6px', background:`rgba(168,85,247,.9)`, fontSize:'9px', color:'#fff', fontWeight:700, backdropFilter:'blur(4px)' }}>
                            ✨ Try-On Result
                          </div>
                          {elapsed && <div style={{ padding:'3px 9px', borderRadius:'6px', background:'rgba(0,0,0,.65)', fontSize:'9px', color:'rgba(255,255,255,.7)', backdropFilter:'blur(4px)' }}>
                            ⏱ {elapsed}
                          </div>}
                        </div>
                      </div>
                    )
                  }

                  {/* Actions */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                    <button onClick={generate}
                      style={{ padding:'10px', borderRadius:'10px', border:`1px solid ${T.border}`, background:T.surface, color:T.sub, fontSize:'11px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', fontFamily:"'DM Sans',system-ui" }}>
                      <RotateCcw size={12}/> Regenerate
                    </button>
                    <button onClick={download}
                      style={{ padding:'10px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${T.accent},${T.accent2})`, color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', fontFamily:"'DM Sans',system-ui", boxShadow:`0 4px 16px ${T.accent}40` }}>
                      <Download size={12}/> Download PNG
                    </button>
                  </div>

                  {/* Meta info */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                    {[
                      { l:'Model',     v:CATEGORIES.find(c=>c.id===category)?.label ?? category },
                      { l:'Kategori',  v:CATEGORIES.find(c=>c.id===category)?.label ?? '—' },
                    ].map((m,i) => (
                      <div key={i} style={{ padding:'7px 10px', borderRadius:'8px', background:T.surface, border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:'9px', color:T.muted, marginBottom:'2px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{m.l}</div>
                        <div style={{ fontSize:'11px', fontWeight:600, color:T.text }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Empty placeholder */
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', textAlign:'center', gap:'16px' }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ width:'80px', height:'80px', borderRadius:'20px', background:`linear-gradient(135deg, ${T.accent}20, ${T.accent2}20)`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px' }}>👗</div>
                    <div style={{ position:'absolute', bottom:'-4px', right:'-4px', width:'26px', height:'26px', borderRadius:'50%', background:`linear-gradient(135deg,${T.accent},${T.accent2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>✨</div>
                  </div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:700, color:T.white, marginBottom:'6px' }}>Hasil try-on muncul di sini</div>
                    <div style={{ fontSize:'12px', color:T.muted, lineHeight:1.7, maxWidth:'240px' }}>
                      Upload foto model dan pakaian, lalu klik Generate untuk melihat hasilnya
                    </div>
                  </div>
                  {/* Flow preview */}
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 14px', borderRadius:'12px', background:T.surface, border:`1px solid ${T.border}` }}>
                    {['📸 Model', '→', '👗 Pakaian', '→', '✨ Hasil'].map((s,i) => (
                      <span key={i} style={{ fontSize:'11px', color: i%2===0 ? T.sub : T.muted, fontWeight: i%2===0 ? 600 : 400 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate button */}
            <button type="button" onClick={generate} disabled={!readyToGenerate}
              style={{ width:'100%', padding:'15px', borderRadius:'14px', border:'none', fontSize:'14px', fontWeight:800, letterSpacing:'-0.01em', cursor:readyToGenerate?'pointer':'not-allowed', fontFamily:"'DM Sans',system-ui", display:'flex', alignItems:'center', justifyContent:'center', gap:'9px', transition:'all .2s',
                background: readyToGenerate
                  ? `linear-gradient(135deg, ${T.accent} 0%, ${T.accent2} 100%)`
                  : T.surface,
                color: readyToGenerate ? '#fff' : T.muted,
                boxShadow: readyToGenerate ? `0 8px 28px ${T.accent}45` : 'none',
                transform: readyToGenerate ? 'translateY(0)' : 'none',
              }}
              onMouseEnter={e => { if (readyToGenerate) (e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/>Generating Try-On...</>
                : <><Sparkles size={16}/> Generate Try-On Sekarang</>
              }
            </button>

            {/* Progress bar */}
            {loading && (
              <div style={{ height:'3px', borderRadius:'2px', background:T.border, overflow:'hidden' }}>
                <div style={{ height:'100%', background:`linear-gradient(90deg,${T.accent},${T.accent2})`, animation:'progress 3s ease-in-out infinite', borderRadius:'2px' }}/>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding:'11px 14px', borderRadius:'12px', background:T.redLo, border:`1px solid ${T.red}30`, display:'flex', gap:'8px', alignItems:'flex-start' }}>
                <AlertCircle size={14} color={T.red} style={{ flexShrink:0, marginTop:'1px' }}/>
                <div style={{ fontSize:'12px', color:'#FCA5A5', lineHeight:1.5 }}>{error}</div>
              </div>
            )}

            {/* Checklist */}
            {!loading && (
              <div style={{ padding:'12px 14px', borderRadius:'12px', background:T.surface, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:'10px', fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'9px' }}>Status</div>
                {[
                  { label:'Foto model', done:!!modelFile },
                  { label:'Foto pakaian', done:!!garmentFile },
                  { label:'Kategori dipilih', done:!!category },
                ].map((s,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom: i<2?'7px':0 }}>
                    <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:s.done?`${T.green}25`:T.card, border:`1.5px solid ${s.done?T.green:T.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .2s' }}>
                      {s.done && <Check size={9} color={T.green}/>}
                    </div>
                    <span style={{ fontSize:'11px', color:s.done?T.text:T.muted, fontWeight:s.done?600:400 }}>{s.label}</span>
                    {s.done && <div style={{ marginLeft:'auto', fontSize:'9px', color:T.green, fontWeight:700 }}>✓ Siap</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Tips bar ────────────────────────────────────── */}
        <div style={{ marginTop:'20px', padding:'14px 18px', borderRadius:'14px', background:T.surface, border:`1px solid ${T.border}`, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
          {[
            { icon:'✅', title:'Kapan pakai prompt?', body:'Hanya untuk styling spesifik: "jaket terbuka", "baju dimasukkan". Biarkan kosong untuk hasil auto.' },
            { icon:'👕', title:'Format pakaian terbaik', body:'On-model > ghost mannequin > flat-lay. Hindari foto di hanger atau dilipat.' },
            { icon:'🎯', title:'Hasil tidak sempurna?', body:'Tambahkan prompt untuk memperbaiki detail spesifik yang salah, bukan describe ulang semuanya.' },
          ].map((tip,i) => (
            <div key={i} style={{ display:'flex', gap:'10px' }}>
              <div style={{ fontSize:'18px', flexShrink:0, marginTop:'1px' }}>{tip.icon}</div>
              <div>
                <div style={{ fontSize:'11px', fontWeight:700, color:T.text, marginBottom:'3px' }}>{tip.title}</div>
                <div style={{ fontSize:'10px', color:T.muted, lineHeight:1.6 }}>{tip.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Zoom modal ──────────────────────────────────── */}
      {zoomed && result && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.95)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
          onClick={() => setZoomed(false)}>
          <img src={result} alt="Zoom" style={{ maxWidth:'88vw', maxHeight:'88vh', objectFit:'contain', borderRadius:'16px' }}/>
          <button onClick={() => setZoomed(false)}
            style={{ position:'absolute', top:'18px', right:'18px', width:'40px', height:'40px', borderRadius:'50%', border:`1px solid ${T.border}`, background:T.card, color:T.text, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18}/>
          </button>
          <button onClick={download}
            style={{ position:'absolute', bottom:'20px', left:'50%', transform:'translateX(-50%)', padding:'10px 24px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg,${T.accent},${T.accent2})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', fontFamily:"'DM Sans',system-ui", boxShadow:`0 8px 24px ${T.accent}50` }}>
            <Download size={14}/> Download PNG
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin     { to { transform:rotate(360deg) } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes progress { 0%{width:0%;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:${T.surface} }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:2px }
        textarea::placeholder { color:${T.muted} }
        @media (max-width:960px) {
          div[style*="grid-template-columns:1fr 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}