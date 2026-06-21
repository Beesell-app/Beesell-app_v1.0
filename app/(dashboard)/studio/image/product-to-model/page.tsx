'use client'
// app/(dashboard)/studio/image/product-to-model/page.tsx
// Product to Model AI — Upload foto produk → model memakai produk

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Upload, Download, RefreshCw, X, Loader2, Sparkles,
  ChevronRight, ChevronLeft, ArrowLeft, Check, AlertCircle, Info,
  RotateCcw, BookOpen, Copy, ZoomIn
} from 'lucide-react'
import {
  MODEL_PRESETS, MODEL_CATEGORIES, POSE_PRESETS, BACKGROUND_PRESETS,
  POPULAR_MODELS, MODEL_PRESET_MAP, type ModelPreset,
} from '@/lib/studio/model-presets'

// ⚡ TEMA LEBAH (AMBER) & LIGHT MODE PALETTE
const C = {
  brand: '#F59E0B',     // Amber utama
  brandDk: '#D97706',   // Amber gelap untuk hover/gradient
  brandLt: '#FEF3C7',   // Amber terang
  brandXlt: '#FFFBEB',  // Amber sangat terang (bg)
  
  slate900: '#0F172A', slate800: '#1E293B', slate700: '#334155',
  slate600: '#475569', slate500: '#64748B', slate400: '#94A3B8',
  slate300: '#CBD5E1', slate200: '#E2E8F0', slate100: '#F1F5F9',
  slate50: '#F8FAFC',  w: '#FFFFFF',
  
  green: '#10B981', g50: '#ECFDF5',
  red: '#EF4444',   r50: '#FEF2F2',
  blue: '#3B82F6',  b50: '#EFF6FF',
}

// ── Strength slider ───────────────────────────────────────────
function StrengthSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct  = Math.round((value - 0.55) / (0.9 - 0.55) * 100)
  const label = value < 0.65 ? 'Produk Terjaga'
    : value < 0.78 ? 'Seimbang (Rekomendasi)'
    : 'Kreativitas AI Bebas'
  const color = value < 0.65 ? C.green : value < 0.78 ? C.brand : '#F97316' // Orange for high

  return (
    <div style={{ padding: '12px 14px', background: C.slate50, borderRadius: '12px', border: `1px solid ${C.slate200}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
        <span style={{ fontSize:'11px', fontWeight:800, color:C.slate600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          AI Strength
        </span>
        <span style={{ fontSize:'10px', fontWeight:700, color, padding:'3px 10px', borderRadius:'20px', background:`${color}15`, border: `1px solid ${color}30` }}>{label}</span>
      </div>
      <input type="range" min="55" max="90" value={Math.round(value*100)}
        onChange={e => onChange(parseInt(e.target.value)/100)}
        style={{ width:'100%', accentColor:color, cursor:'pointer', height:'4px', borderRadius:'2px', outline:'none' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', fontWeight:600, color:C.slate400, marginTop:'8px' }}>
        <span>🔒 Detail Asli</span>
        <span>⚖️ Ideal</span>
        <span>🎨 Bebas Berubah</span>
      </div>
    </div>
  )
}

// ── Model Card ────────────────────────────────────────────────
// ── Model Card (Image Grid & Glassmorphism) ───────────────────
function ModelCard({ m, selected, onClick }: { m: any; selected: boolean; onClick: () => void }) {
  // Fallback image (Ganti m.image dengan URL gambarmu di model-presets.ts nanti)
  const imageUrl = m.image || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`;

  return (
    <button type="button" onClick={onClick}
      className="model-grid-card"
      style={{
        position: 'relative',
        padding: 0,
        borderRadius: '12px',
        border: `2px solid ${selected ? C.brand : 'transparent'}`,
        background: C.slate100,
        cursor: 'pointer',
        textAlign: 'left',
        aspectRatio: '3/4',
        overflow: 'hidden',
        boxShadow: selected ? `0 4px 12px ${C.brand}40` : 'none',
        transition: 'all .2s ease'
      }}
    >
      {/* Gambar Model */}
      <img src={imageUrl} alt={m.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="model-img" />

      {/* Populer Badge */}
      {m.popular && !selected && (
        <div style={{ position:'absolute', top:'6px', left:'6px', fontSize:'8px', fontWeight:800, padding:'2px 6px', borderRadius:'20px', background:C.brand, color:'#fff', boxShadow:'0 2px 4px rgba(0,0,0,0.2)', zIndex:2 }}>⭐</div>
      )}

      {/* Gradient Overlay & Teks */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.4) 60%, transparent 100%)',
        padding: '24px 8px 8px 8px',
        display: 'flex', flexDirection: 'column',
        zIndex:1
      }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', lineHeight: 1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.label}</span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', marginTop: '2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.ageRange} • {m.skinTone}</span>
      </div>

      {/* Indikator Terpilih (Checkmark) */}
      {selected && (
        <div style={{ position: 'absolute', top: '6px', right: '6px', width: '20px', height: '20px', borderRadius: '50%', background: C.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex:2 }}>
          <Check size={12} color="#fff" strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

// ── Option Chip ───────────────────────────────────────────────
function Chip({ icon, label, active, onClick, color=C.brand }: {
  icon:string; label:string; active:boolean; onClick:()=>void; color?:string
}) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'10px',
        border:`1px solid ${active ? color : C.slate200}`,
        background:active ? `${color}12` : C.w,
        cursor:'pointer', fontSize:'12px', fontWeight:active ? 700 : 600,
        color:active ? color : C.slate600, transition:'all .2s ease', whiteSpace:'nowrap',
        boxShadow: active ? `0 2px 8px ${color}15` : 'none'
      }}
      onMouseEnter={e => { if(!active) (e.currentTarget as HTMLElement).style.background = C.slate50 }}
      onMouseLeave={e => { if(!active) (e.currentTarget as HTMLElement).style.background = C.w }}
    >
      {icon && <span>{icon}</span>} {label}
      {active && <Check size={12} color={color} strokeWidth={3}/>}
    </button>
  )
}

// ── Before/After Slider ───────────────────────────────────────
function BASlider({ before, after }: { before:string; after:string }) {
  const [pos, setPos]   = useState(50)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const move = useCallback((x: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos(Math.max(0, Math.min(100, (x - r.left) / r.width * 100)))
  }, [])

  return (
    <div ref={ref}
      style={{ position:'relative', width:'100%', aspectRatio:'2/3', maxHeight:'560px', borderRadius:'16px', overflow:'hidden', cursor:'col-resize', userSelect:'none', border:`1px solid ${C.slate200}` }}
      onMouseDown={() => setDrag(true)}
      onMouseMove={e => drag && move(e.clientX)}
      onMouseUp={() => setDrag(false)}
      onTouchStart={() => setDrag(true)}
      onTouchMove={e => drag && move(e.touches[0].clientX)}
      onTouchEnd={() => setDrag(false)}
    >
      <img src={after}  alt="After"  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', background:C.slate50 }}/>
      <div style={{ position:'absolute', inset:0, clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <img src={before} alt="Before" style={{ width:'100%', height:'100%', objectFit:'contain', background:C.slate100 }}/>
      </div>
      <div style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, width:'3px', background:'#fff', transform:'translateX(-50%)', boxShadow:'0 0 10px rgba(0,0,0,.3)' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'36px', height:'36px', borderRadius:'50%', background:'#fff', boxShadow:'0 4px 14px rgba(0,0,0,.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'col-resize', border: `2px solid ${C.brand}` }}>
          <span style={{ fontSize:'16px', color:C.brand }}>⇔</span>
        </div>
      </div>
      <div style={{ position:'absolute', top:'12px', left:'12px', padding:'4px 10px', borderRadius:'8px', background:'rgba(15,23,42,.7)', fontSize:'11px', color:'#fff', fontWeight:600, backdropFilter:'blur(4px)' }}>Produk Asli</div>
      <div style={{ position:'absolute', top:'12px', right:'12px', padding:'4px 10px', borderRadius:'8px', background:`rgba(245,158,11,.9)`, fontSize:'11px', color:'#fff', fontWeight:700, backdropFilter:'blur(4px)', boxShadow: '0 2px 8px rgba(245,158,11,.4)' }}>Model AI ✨</div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function ProductToModelPage() {
  const [file,          setFile]        = useState<File|null>(null)
  const [preview,       setPreview]     = useState<string|null>(null)
  const [modelId,       setModelId]     = useState('wanita-asia-muda')
  const [poseId,        setPoseId]      = useState('full-body-relaxed')
  const [bgId,          setBgId]        = useState('white-studio')
  const [lightingId,    setLightingId]  = useState('studio-soft')
  const [strength,      setStrength]    = useState(0.72)
  const [customPrompt,  setCustomPrompt]= useState('')
  const [showCustom,    setShowCustom]  = useState(false)
  const [loading,       setLoading]     = useState(false)
  const [progress,      setProgress]    = useState(0)
  const [progressMsg,   setProgressMsg] = useState('')
  const [result,        setResult]      = useState<string|null>(null)
  const [error,         setError]       = useState('')
  const [showBefore,    setShowBefore]  = useState(false)
  const [activeCat,     setActiveCat]   = useState<string>('popular')
  const [zoomed,        setZoomed]      = useState(false)
  const [activeTab,     setActiveTab]   = useState<'settings'|'prompt-tips'>('settings')
  
  // SEMUA REF DAN FUNGSI HARUS DI DALAM SINI
  const fileRef = useRef<HTMLInputElement>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200; // Jarak geser per klik
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const model = MODEL_PRESETS.find(m => m.id === modelId)!

  const handleFile = useCallback((f: File) => {
    if (f.size > 15 * 1024 * 1024) { setError('Maks 15MB'); return }
    if (!f.type.startsWith('image/')) { setError('Hanya file gambar'); return }
    setFile(f); setError(''); setResult(null); setShowBefore(false)
    setPreview(URL.createObjectURL(f))
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [handleFile])

  const generate = async () => {
    if (!file) { setError('Upload foto produk dulu'); return }
    setLoading(true); setError(''); setResult(null); setProgress(5); setProgressMsg('Mempersiapkan...')

    const steps = [
      { pct:15, msg:'Membaca produk dari gambar...' },
      { pct:35, msg:'AI memilih model...' },
      { pct:55, msg:'AI fitting produk ke model...' },
      { pct:75, msg:'Rendering pencahayaan detail...' },
      { pct:90, msg:'Finishing touches...' },
    ]
    let si = 0
    const prog = setInterval(() => {
      if (si < steps.length) { setProgress(steps[si].pct); setProgressMsg(steps[si].msg); si++ }
    }, 5000)

    try {
      const fd = new FormData()
      fd.append('image',       file)
      fd.append('modelPreset', modelId)
      fd.append('pose',        poseId)
      fd.append('background',  bgId)
      fd.append('lighting',    lightingId)
      fd.append('strength',    String(strength))
      if (showCustom && customPrompt.trim()) fd.append('customPrompt', customPrompt)

      const res = await fetch('/api/studio/product-to-model', { method:'POST', body: fd })
      clearInterval(prog); setProgress(98); setProgressMsg('Hampir selesai...')

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message ?? `Error ${res.status}`)
      }

      const ct = res.headers.get('content-type') ?? ''
      const blobUrl = ct.startsWith('image/')
        ? URL.createObjectURL(await res.blob())
        : (await res.json()).url ?? (await res.json()).output

      setResult(blobUrl); setProgress(100); setProgressMsg('Selesai!')
    } catch (e: any) {
      setError(e.message ?? 'Generate gagal. Coba lagi.')
      setProgress(0); setProgressMsg('')
    } finally {
      clearInterval(prog); setLoading(false)
    }
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a'); a.href = result
    a.download = `beesell-model-${modelId}-${Date.now()}.png`; a.click()
  }

  const catModels = activeCat === 'popular'
    ? MODEL_PRESETS.filter(m => m.popular)
    : MODEL_PRESETS.filter(m => m.category === activeCat)

  const lbl: React.CSSProperties = { fontSize:'11px', fontWeight:800, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'8px' }

  return (
    <div style={{ maxWidth:'1080px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif", paddingBottom: '40px', padding: '0 20px' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', flexWrap:'wrap' }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:600, color:C.slate500, textDecoration:'none', transition:'color .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color=C.brandDk)}
              onMouseLeave={e=>(e.currentTarget.style.color=C.slate500)}>
          <ArrowLeft size={14}/> AI Studio
        </Link>
        <span style={{ color:C.slate300 }}>/</span>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`linear-gradient(135deg, ${C.brand}, ${C.brandDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', boxShadow:`0 4px 12px ${C.brand}40` }}>🧑‍🦰</div>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:C.slate900, lineHeight:1, margin:0 }}>Product to Model AI</h1>
            <p style={{ fontSize:'12px', color:C.slate500, marginTop:'4px', marginBottom:0, fontWeight:500 }}>Foto produk → foto model memakai produk secara realistis</p>
          </div>
        </div>
      </div>

      {/* ── Tip banner ────────────────────────────── */}
      <div style={{ padding:'14px 16px', background:C.brandXlt, border:`1px solid ${C.brandLt}`, borderRadius:'14px', marginBottom:'24px', display:'flex', gap:'12px', alignItems:'flex-start', boxShadow:'0 4px 16px rgba(245,158,11,0.05)' }}>
        <div style={{ background:`linear-gradient(135deg, ${C.brand}, ${C.brandDk})`, borderRadius:'50%', padding:'4px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
           <Info size={14} color="#fff" strokeWidth={2.5}/>
        </div>
        <div style={{ fontSize:'13px', color:C.slate700, lineHeight:1.6 }}>
          <b style={{ color: C.brandDk }}>Tips Pro:</b> Untuk hasil terbaik, coba <b>generate tanpa custom prompt</b> dulu — AI akan membaca bentuk dan bahan produk dari gambar. Tambahkan custom prompt HANYA jika ingin model berinteraksi spesifik dengan produk (misal: "jaket dipakai setengah terbuka").
        </div>
      </div>

      <div className="main-layout-grid" style={{ display:'grid', gridTemplateColumns:'340px minmax(0, 1fr)', gap:'24px', alignItems:'flex-start' }}>

        {/* ══ LEFT PANEL ════════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px', position:'sticky', top:'24px' }}>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = C.brand; (e.currentTarget as HTMLElement).style.background = C.brandXlt }}
            onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate300; (e.currentTarget as HTMLElement).style.background = C.w }}
            onDrop={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate300; (e.currentTarget as HTMLElement).style.background = C.w; onDrop(e) }}
            onClick={() => !loading && fileRef.current?.click()}
            onMouseEnter={e => { if(!loading && !preview) (e.currentTarget as HTMLElement).style.borderColor = C.brand }}
            onMouseLeave={e => { if(!loading && !preview) (e.currentTarget as HTMLElement).style.borderColor = C.slate300 }}
            style={{ borderRadius:'16px', border:`2px dashed ${preview ? C.brand : C.slate300}`, background:C.w, overflow:'hidden', cursor:loading?'default':'pointer', transition:'all .2s' }}>
            
            {preview ? (
              <div style={{ position:'relative' }}>
                <img src={preview} alt="" style={{ width:'100%', height:'240px', objectFit:'contain', background:C.slate50, display:'block' }}/>
                <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null) }}
                  style={{ position:'absolute', top:'12px', right:'12px', width:'30px', height:'30px', borderRadius:'50%', border:'none', background:'rgba(15,23,42,.7)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', transition:'background .2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,.9)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='rgba(15,23,42,.7)')}>
                  <X size={14} strokeWidth={3}/>
                </button>
                {file && (
                  <div style={{ position:'absolute', bottom:'12px', left:'12px', padding:'6px 12px', borderRadius:'8px', background:'rgba(15,23,42,.7)', fontSize:'11px', color:'#fff', fontWeight:600, backdropFilter:'blur(4px)' }}>
                    {file.name.slice(0,25)}{file.name.length > 25 ? '...' : ''} · {(file.size/1024).toFixed(0)}KB
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'40px 24px' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:C.brandXlt, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:C.brand }}>
                  <Upload size={28} strokeWidth={2}/>
                </div>
                <div style={{ fontSize:'15px', fontWeight:800, color:C.slate800, marginBottom:'4px' }}>Upload foto produk</div>
                <div style={{ fontSize:'12px', color:C.slate500, marginBottom:'20px' }}>Kaos, dress, jaket, celana, pakaian olahraga</div>
                <span style={{ padding:'10px 24px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.brand}, ${C.brandDk})`, color:'#fff', fontSize:'13px', fontWeight:700, display:'inline-flex', gap:'8px', alignItems:'center', boxShadow:`0 4px 12px ${C.brand}30` }}>
                  Pilih Foto Produk
                </span>
                <div style={{ fontSize:'11px', color:C.slate400, marginTop:'16px' }}>PNG, JPG, WEBP · Maks 15MB</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
          </div>

          {/* Settings / Prompt Tips tab */}
          <div style={{ background:C.w, borderRadius:'16px', border:`1px solid ${C.slate200}`, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display:'flex', background:C.slate50, borderBottom:`1px solid ${C.slate200}` }}>
              {[{k:'settings',l:'⚙️ Pengaturan Render'},{k:'prompt-tips',l:'💡 Custom Prompt'}].map(t => (
                <button key={t.k} type="button" onClick={() => setActiveTab(t.k as any)}
                  style={{
                    flex:1, padding:'14px 12px', border:'none', background:'none', cursor:'pointer',
                    fontSize:'12px', fontWeight:activeTab===t.k?800:600,
                    color:activeTab===t.k?C.brandDk:C.slate500,
                    borderBottom:`3px solid ${activeTab===t.k?C.brand:'transparent'}`,
                    transition:'all .2s ease'
                  }}>
                  {t.l}
                </button>
              ))}
            </div>

            {activeTab === 'settings' && (
              <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'20px' }}>

                {/* Pose */}
                <div>
                  <label style={lbl}>Pose Tubuh Model</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                    {POSE_PRESETS.map(p => (
                      <Chip key={p.id} icon={p.icon} label={p.label} active={poseId===p.id} onClick={() => setPoseId(p.id)} color={C.brand}/>
                    ))}
                  </div>
                  {poseId && <div style={{ fontSize:'11px', color:C.slate500, marginTop:'8px', fontWeight:500 }}>Info: {POSE_PRESETS.find(p=>p.id===poseId)?.desc}</div>}
                </div>

                {/* Background */}
                <div>
                  <label style={lbl}>Lokasi / Latar Belakang</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', maxHeight:'140px', overflowY:'auto', paddingRight:'4px' }}>
                    {BACKGROUND_PRESETS.map(b => (
                      <Chip key={b.id} icon={b.icon} label={b.label} active={bgId===b.id} onClick={() => setBgId(b.id)} color={C.blue}/>
                    ))}
                  </div>
                </div>

                {/* Lighting */}
                <div>
                  <label style={lbl}>Pencahayaan Studio</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                    {[
                      { id:'studio-soft',   l:'☀️ Studio Soft' },
                      { id:'natural-window',l:'🪟 Jendela Natural' },
                      { id:'outdoor-bright',l:'🌞 Outdoor Cerah' },
                      { id:'dramatic-rim',  l:'🎭 Dramatis' },
                      { id:'warm-golden',   l:'✨ Golden Hour' },
                    ].map(l => (
                      <Chip key={l.id} icon='' label={l.l} active={lightingId===l.id} onClick={() => setLightingId(l.id)} color={C.green}/>
                    ))}
                  </div>
                </div>

                {/* AI Strength */}
                <StrengthSlider value={strength} onChange={setStrength}/>

              </div>
            )}

            {activeTab === 'prompt-tips' && (
              <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'16px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {[
                    { title:'✅ Kapan pakai Custom Prompt', content:'Hanya saat model tidak memakai produk dengan gaya yang diinginkan (contoh: "jaket dibiarkan terbuka", "baju dimasukkan sebagian").' },
                    { title:'❌ Jangan describe ciri fisik produk', content:'AI sudah membaca warna, pola, dan tekstur dari foto yang di-upload. Menyebut ciri fisik justru merusak akurasi.' },
                    { title:'💡 Tips Iterasi AI', content:'Lakukan percobaan pertama tanpa prompt. Jika kurang pas, tambahkan prompt HANYA pada detail yang salah.' },
                  ].map((tip, i) => (
                    <div key={i} style={{ padding:'12px 14px', background:C.slate50, borderRadius:'12px', border:`1px solid ${C.slate200}` }}>
                      <div style={{ fontSize:'12px', fontWeight:800, color:C.slate800, marginBottom:'6px' }}>{tip.title}</div>
                      <div style={{ fontSize:'12px', color:C.slate600, lineHeight:1.6 }}>{tip.content}</div>
                    </div>
                  ))}
                </div>
                
                {/* Custom Prompt Input */}
                <div style={{ marginTop:'8px' }}>
                  <label style={lbl}>Input Custom Prompt</label>
                  <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} rows={3}
                    placeholder={'Contoh: "jaket dipakai santai terbuka di atas kaos polos"\nAtau biarkan kosong untuk hasil otomatis terbaik.'}
                    style={{ width:'100%', padding:'14px', borderRadius:'12px', border:`1px solid ${customPrompt ? C.brand : C.slate300}`, fontSize:'13px', fontFamily:"'DM Sans',sans-serif", color:C.slate900, outline:'none', resize:'vertical', lineHeight:1.6, boxSizing:'border-box', boxShadow:'inset 0 2px 4px rgba(0,0,0,.02)' }}
                    onFocus={e=>(e.currentTarget.style.borderColor=C.brand)}
                    onBlur={e=>(e.currentTarget.style.borderColor=customPrompt ? C.brand : C.slate300)}
                  />
                  <div style={{ fontSize:'11px', color:C.slate500, marginTop:'8px', lineHeight:1.5, display:'flex', gap:'6px' }}>
                    <Info size={14} color={C.brand} style={{flexShrink:0}}/> Gunakan Bahasa Inggris untuk respons AI yang lebih akurat (opsional).
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'12px 16px', background:C.r50, border:`1px solid #FECACA`, borderRadius:'12px', fontSize:'13px', fontWeight:600, color:C.red, display:'flex', gap:'8px', alignItems:'flex-start' }}>
              <AlertCircle size={16} style={{ flexShrink:0, marginTop:'2px' }}/>{error}
            </div>
          )}

          {/* Generate button */}
          <button type="button" onClick={generate} disabled={!file || loading}
            style={{
              width:'100%', padding:'16px', borderRadius:'14px', border:'none',
              fontSize:'15px', fontWeight:800, cursor:!file||loading?'not-allowed':'pointer',
              fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              transition:'all .2s ease',
              background: !file||loading ? C.slate200 : `linear-gradient(135deg, ${C.brand}, ${C.brandDk})`,
              color: !file||loading ? C.slate400 : '#fff',
              boxShadow: !file||loading ? 'none' : `0 8px 24px ${C.brand}40`,
              transform: !file||loading ? 'none' : 'translateY(-1px)'
            }}
            onMouseLeave={e => { if(!file||loading) return; (e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
            onMouseDown={e => { if(!file||loading) return; (e.currentTarget as HTMLElement).style.transform='translateY(1px)' }}
            onMouseUp={e => { if(!file||loading) return; (e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
          >
            {loading
              ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/>Sedang Fitting AI...</>
              : <><Sparkles size={18}/> Generate Model AI</>
            }
          </button>

          {/* Progress */}
          {loading && (
            <div style={{ padding:'16px', background:C.w, borderRadius:'12px', border:`1px solid ${C.slate200}` }}>
              <div style={{ height:'6px', borderRadius:'3px', background:C.slate100, overflow:'hidden', marginBottom:'10px' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg, ${C.brand}, ${C.brandDk})`, borderRadius:'3px', transition:'width .5s ease' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:'12px', fontWeight:600, color:C.slate700 }}>{progressMsg}</div>
                <div style={{ fontSize:'12px', fontWeight:800, color:C.brandDk }}>{progress}%</div>
              </div>
              <div style={{ fontSize:'11px', color:C.slate400, marginTop:'6px', display:'flex', alignItems:'center', gap:'4px' }}>
                ⏱️ Estimasi: 25-45 detik
              </div>
            </div>
          )}

          {/* Selected model info summary */}
          {model && !loading && (
            <div style={{ padding:'16px', borderRadius:'14px', background:C.brandXlt, border:`1px solid ${C.brandLt}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                <span style={{ fontSize:'28px' }}>{model.icon}</span>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:800, color:C.brandDk }}>{model.label}</div>
                  <div style={{ fontSize:'11px', color:C.slate600, fontWeight:600, marginTop:'2px' }}>{model.ageRange} · {model.bodyType}</div>
                </div>
              </div>
              <div style={{ fontSize:'12px', color:C.slate700, lineHeight:1.5, marginBottom:'12px' }}>
                Warna kulit: {model.skinTone} · Rambut: {model.hairDesc}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {model.bestFor.slice(0,4).map(b => (
                  <span key={b} style={{ fontSize:'10px', padding:'4px 10px', borderRadius:'20px', background:C.w, border:`1px solid ${C.brandLt}`, color:C.brandDk, fontWeight:700 }}>✓ {b}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL ═══════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Model selector */}
          <div style={{ background:C.w, borderRadius:'16px', border:`1px solid ${C.slate200}`, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
            
            {/* Category tabs - Pindah ke sini dengan Tombol Chevron Navigasi */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C.slate200}`, background: C.slate50 }}>
              
              {/* Tombol Kiri */}
              <button type="button" onClick={() => scrollCategories('left')}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10, background: 'linear-gradient(to right, #F8FAFC 60%, transparent)', border: 'none', cursor: 'pointer', padding: '0 16px 0 8px', display: 'flex', alignItems: 'center', color: C.slate500, transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.brandDk} onMouseLeave={e => e.currentTarget.style.color = C.slate500}>
                <ChevronLeft size={16} />
              </button>

              {/* Scroll Container */}
              <div ref={categoryScrollRef} style={{ display: 'flex', overflowX: 'auto', padding: '0 32px', scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth', width: '100%' }}>
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                {[{ key:'popular', label:'⭐ Populer' }, ...Object.entries(MODEL_CATEGORIES).map(([k,v]) => ({ key:k, label:`${v.icon} ${v.label}` }))].map(cat => (
                  <button key={cat.key} type="button" onClick={() => setActiveCat(cat.key)}
                    style={{
                      padding:'14px 16px', border:'none', background:'none', cursor:'pointer',
                      fontSize:'13px', fontWeight:activeCat===cat.key?800:600,
                      color:activeCat===cat.key?C.brandDk:C.slate500,
                      borderBottom:`3px solid ${activeCat===cat.key?C.brand:'transparent'}`,
                      whiteSpace:'nowrap', flexShrink:0, transition:'all .2s ease',
                      marginTop:'1px'
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Tombol Kanan */}
              <button type="button" onClick={() => scrollCategories('right')}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 10, background: 'linear-gradient(to left, #F8FAFC 60%, transparent)', border: 'none', cursor: 'pointer', padding: '0 8px 0 16px', display: 'flex', alignItems: 'center', color: C.slate500, transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.brandDk} onMouseLeave={e => e.currentTarget.style.color = C.slate500}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Model grid */}
            <div style={{ padding:'16px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(115px, 1fr))', gap:'12px', maxHeight:'340px', overflowY:'auto' }}>
              {catModels.map(m => (
                <ModelCard key={m.id} m={m} selected={modelId===m.id} onClick={() => setModelId(m.id)}/>
              ))}
              {catModels.length === 0 && (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'30px 20px', color:C.slate400, fontSize:'13px', fontWeight:500 }}>
                  <div style={{fontSize:'28px', marginBottom:'8px', opacity:0.5}}>🔍</div>
                  Belum ada model di kategori ini
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          {result ? (
            <div style={{ background:C.w, borderRadius:'16px', border:`1px solid ${C.slate200}`, padding:'16px', boxShadow:'0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px', marginBottom:'14px' }}>
                <div>
                  <h2 style={{ fontSize:'16px', fontWeight:800, color:C.slate900, margin:0 }}>Hasil Model AI</h2>
                  <p style={{ fontSize:'11px', color:C.slate500, marginTop:'2px', marginBottom:0, fontWeight:600 }}>Identitas: {model.label}</p>
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={() => setShowBefore(p=>!p)}
                    style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'8px', border:`1px solid ${showBefore ? C.brand : C.slate200}`, background:showBefore?C.brandXlt:C.w, fontSize:'11px', fontWeight:700, color:showBefore?C.brandDk:C.slate700, cursor:'pointer', transition:'all .2s' }}>
                    ⇔ {showBefore ? 'Fokus AI' : 'Before/After'}
                  </button>
                  <button onClick={download}
                    style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 16px', borderRadius:'8px', border:'none', background:C.green, color:'#fff', fontSize:'11px', fontWeight:800, cursor:'pointer', boxShadow:'0 4px 10px rgba(16,185,129,.25)', fontFamily:"'DM Sans',sans-serif" }}>
                    <Download size={14}/> Save
                  </button>
                </div>
              </div>

              {showBefore && preview
                ? <BASlider before={preview} after={result}/>
                : (
                  <div style={{ position:'relative', borderRadius:'12px', overflow:'hidden', cursor:'zoom-in', background:C.slate50, border:`1px solid ${C.slate200}`, display:'flex', justifyContent:'center', alignItems:'center' }} onClick={() => setZoomed(true)}>
                    <img src={result} alt="Model AI" style={{ maxWidth:'100%', maxHeight:'500px', objectFit:'contain', display:'block' }}/>
                    <div style={{ position:'absolute', bottom:'12px', left:'12px', padding:'4px 12px', borderRadius:'8px', background:'rgba(15,23,42,.75)', fontSize:'10px', color:'#fff', fontWeight:600, backdropFilter:'blur(4px)', display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{color:C.brand}}>✨</span> {model.label} <span style={{opacity:0.5, margin:'0 2px'}}>|</span> <ZoomIn size={10}/> Zoom
                    </div>
                  </div>
                )
              }

              {/* Action Buttons Below Image */}
              <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
                <button onClick={generate}
                  style={{ flex:1, padding:'14px', borderRadius:'12px', border:`2px solid ${C.brand}`, background:C.brandXlt, color:C.brandDk, fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:"'DM Sans',sans-serif", transition:'all .2s' }}
                  onMouseEnter={e=>{(e.currentTarget.style.background=C.brand);(e.currentTarget.style.color='#fff')}}
                  onMouseLeave={e=>{(e.currentTarget.style.background=C.brandXlt);(e.currentTarget.style.color=C.brandDk)}}>
                  <RefreshCw size={16}/> Generate Variasi Lain
                </button>
                <button style={{ flex:1, padding:'14px', borderRadius:'12px', border:`2px solid ${C.slate200}`, background:C.w, color:C.slate700, fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:"'DM Sans',sans-serif", transition:'background .2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background=C.slate50)}
                  onMouseLeave={e=>(e.currentTarget.style.background=C.w)}>
                  <BookOpen size={16}/> Simpan ke Library
                </button>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'360px', textAlign:'center', border:`2px dashed ${C.slate200}`, borderRadius:'16px', background:C.w, padding:'30px' }}>
              {loading ? (
                <>
                  <div style={{ position:'relative', marginBottom:'20px' }}>
                    <div style={{ width:'70px', height:'70px', borderRadius:'50%', border:`3px solid ${C.slate100}`, borderTop:`3px solid ${C.brand}`, animation:'spin 1s linear infinite' }}/>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>✨</div>
                  </div>
                  <div style={{ fontSize:'16px', fontWeight:800, color:C.slate900, marginBottom:'6px' }}>Memakaikan Produk...</div>
                  <div style={{ fontSize:'12px', color:C.slate600, fontWeight:500 }}>{progressMsg}</div>
                </>
              ) : (
                <>
                  <div style={{ width:'80px', height:'80px', borderRadius:'20px', background:C.brandXlt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', marginBottom:'20px', color:C.brand, boxShadow:`0 8px 24px ${C.brand}20` }}>
                    <Sparkles size={40} strokeWidth={1.5}/>
                  </div>
                  <div style={{ fontSize:'20px', fontWeight:800, color:C.slate900, marginBottom:'8px' }}>Area Hasil Model AI</div>
                  <div style={{ fontSize:'14px', color:C.slate500, lineHeight:1.6, maxWidth:'380px', marginBottom:'24px' }}>
                    Upload foto produk di panel kiri, pilih model dari 20+ pilihan di atas, lalu klik tombol <b>Generate Model AI</b>.
                  </div>
                  
                  <div style={{ width:'100%', maxWidth:'400px', height:'1px', background:C.slate200, marginBottom:'20px' }}/>
                  
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>Coba Model Populer Ini:</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', maxWidth:'420px' }}>
                    {MODEL_PRESETS.filter(m=>m.popular).slice(0,4).map(m => (
                      <button key={m.id} type="button" onClick={() => setModelId(m.id)}
                        style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'99px', border:`1.5px solid ${modelId===m.id?C.brand:C.slate200}`, background:modelId===m.id?C.brandXlt:C.w, cursor:'pointer', fontSize:'12px', fontWeight:700, color:modelId===m.id?C.brandDk:C.slate600, transition:'all .2s' }}
                        onMouseEnter={e=>{if(modelId!==m.id) e.currentTarget.style.background=C.slate50}}
                        onMouseLeave={e=>{if(modelId!==m.id) e.currentTarget.style.background=C.w}}>
                        <span style={{fontSize:'16px'}}>{m.icon}</span> {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zoom modal */}
      {zoomed && result && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.95)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(8px)' }}
          onClick={() => setZoomed(false)}>
          <img src={result} alt="Zoom" style={{ maxWidth:'95vw', maxHeight:'95vh', objectFit:'contain', borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,.5)' }}/>
          <button onClick={() => setZoomed(false)}
            style={{ position:'absolute', top:'24px', right:'24px', width:'44px', height:'44px', borderRadius:'50%', border:'none', background:'rgba(255,255,255,.1)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,.1)')}>
            <X size={20} strokeWidth={2.5}/>
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:6px; height:6px }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:3px }
        ::-webkit-scrollbar-thumb:hover { background:#94A3B8 }
        @media (max-width:900px) {
          .main-layout-grid { grid-template-columns: 1fr !important; }
        }
        .model-grid-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.08) !important;
        }
        .model-grid-card .model-img {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .model-grid-card:hover .model-img {
          transform: scale(1.08);
        }
      `}</style>
    </div>
  )
}