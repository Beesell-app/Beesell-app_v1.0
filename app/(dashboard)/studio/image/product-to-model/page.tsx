'use client'
// app/(dashboard)/studio/image/product-to-model/page.tsx
// Product to Model AI — Upload foto produk → model memakai produk

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Upload, Download, RefreshCw, X, Loader2, Sparkles,
  ChevronRight, ArrowLeft, Check, AlertCircle, Info,
  RotateCcw, BookOpen, Copy,
} from 'lucide-react'
import {
  MODEL_PRESETS, MODEL_CATEGORIES, POSE_PRESETS, BACKGROUND_PRESETS,
  POPULAR_MODELS, MODEL_PRESET_MAP, type ModelPreset,
} from '@/lib/studio/model-presets'

const C = {
  brand:'#2563EB', b50:'#EFF6FF', b100:'#DBEAFE',
  purple:'#7C3AED', p50:'#F5F3FF',
  green:'#059669', g50:'#ECFDF5',
  amber:'#D97706', a50:'#FFFBEB',
  red:'#DC2626', r50:'#FEF2F2',
  pink:'#DB2777', pk50:'#FDF2F8',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569', slate500:'#64748B',
  slate400:'#94A3B8', slate300:'#CBD5E1', slate200:'#E2E8F0',
  slate100:'#F1F5F9', slate50:'#F8FAFC', w:'#fff',
}

// ── Strength slider ───────────────────────────────────────────
function StrengthSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct  = Math.round((value - 0.55) / (0.9 - 0.55) * 100)
  const label = value < 0.65 ? 'Produk dipertahankan kuat'
    : value < 0.78 ? 'Seimbang (rekomendasi)'
    : 'Kreativitas AI tinggi'
  const color = value < 0.65 ? C.green : value < 0.78 ? C.brand : C.amber

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'7px' }}>
        <span style={{ fontSize:'11px', fontWeight:700, color:C.slate600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          AI Strength
        </span>
        <span style={{ fontSize:'11px', fontWeight:700, color, padding:'2px 8px', borderRadius:'20px', background:`${color}15` }}>{label}</span>
      </div>
      <input type="range" min="55" max="90" value={Math.round(value*100)}
        onChange={e => onChange(parseInt(e.target.value)/100)}
        style={{ width:'100%', accentColor:color, cursor:'pointer' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:C.slate400, marginTop:'3px' }}>
        <span>🔒 Produk tetap</span>
        <span>⚖️ Seimbang</span>
        <span>🎨 Bebas AI</span>
      </div>
    </div>
  )
}

// ── Model Card ────────────────────────────────────────────────
function ModelCard({ m, selected, onClick }: { m: ModelPreset; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'10px', borderRadius:'12px', border:`2px solid ${selected?C.purple:C.slate200}`, background:selected?C.p50:C.w, cursor:'pointer', textAlign:'left', transition:'all .13s', position:'relative',
        boxShadow:selected?`0 4px 14px ${C.purple}25`:'none' }}>
      {m.popular && !selected && (
        <div style={{ position:'absolute', top:'5px', right:'5px', fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'20px', background:C.amber, color:'#fff' }}>⭐</div>
      )}
      {selected && (
        <div style={{ position:'absolute', top:'5px', right:'5px', width:'16px', height:'16px', borderRadius:'50%', background:C.purple, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Check size={10} color="#fff"/>
        </div>
      )}
      <div style={{ fontSize:'24px', marginBottom:'5px' }}>{m.icon}</div>
      <div style={{ fontSize:'11px', fontWeight:700, color:selected?C.purple:C.slate900, lineHeight:1.2, marginBottom:'2px' }}>{m.label}</div>
      <div style={{ fontSize:'9px', color:C.slate400, lineHeight:1.4 }}>{m.ageRange}</div>
      <div style={{ fontSize:'9px', color:C.slate500, marginTop:'3px' }}>{m.skinTone}</div>
    </button>
  )
}

// ── Option Chip ───────────────────────────────────────────────
function Chip({ icon, label, active, onClick, color=C.brand }: {
  icon:string; label:string; active:boolean; onClick:()=>void; color?:string
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'9px', border:`1.5px solid ${active?color:C.slate200}`, background:active?`${color}12`:C.w, cursor:'pointer', fontSize:'11px', fontWeight:active?700:500, color:active?color:C.slate700, transition:'all .12s', whiteSpace:'nowrap' }}>
      <span>{icon}</span> {label}
      {active && <Check size={10} color={color}/>}
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
      style={{ position:'relative', width:'100%', aspectRatio:'2/3', maxHeight:'520px', borderRadius:'16px', overflow:'hidden', cursor:'col-resize', userSelect:'none' }}
      onMouseDown={() => setDrag(true)}
      onMouseMove={e => drag && move(e.clientX)}
      onMouseUp={() => setDrag(false)}
      onTouchStart={() => setDrag(true)}
      onTouchMove={e => drag && move(e.touches[0].clientX)}
      onTouchEnd={() => setDrag(false)}
    >
      <img src={after}  alt="After"  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', background:'#111' }}/>
      <div style={{ position:'absolute', inset:0, clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <img src={before} alt="Before" style={{ width:'100%', height:'100%', objectFit:'contain', background:C.slate100 }}/>
      </div>
      <div style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, width:'2px', background:'#fff', transform:'translateX(-50%)', boxShadow:'0 0 8px rgba(0,0,0,.4)' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'30px', height:'30px', borderRadius:'50%', background:'#fff', boxShadow:'0 2px 10px rgba(0,0,0,.25)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'col-resize' }}>
          <span style={{ fontSize:'12px', color:C.slate700 }}>⇔</span>
        </div>
      </div>
      <div style={{ position:'absolute', top:'10px', left:'10px', padding:'3px 8px', borderRadius:'6px', background:'rgba(0,0,0,.55)', fontSize:'10px', color:'#fff', fontWeight:700 }}>Produk</div>
      <div style={{ position:'absolute', top:'10px', right:'10px', padding:'3px 8px', borderRadius:'6px', background:`rgba(124,58,237,.85)`, fontSize:'10px', color:'#fff', fontWeight:700 }}>Model AI ✨</div>
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
  const fileRef = useRef<HTMLInputElement>(null)

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
      { pct:75, msg:'Rendering detail...' },
      { pct:90, msg:'Finishing...' },
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

  const lbl: React.CSSProperties = { fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'7px' }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'12px', color:C.slate500, textDecoration:'none' }}>
          <ArrowLeft size={13}/> AI Studio
        </Link>
        <span style={{ color:C.slate300 }}>/</span>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,#DB2777,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🧑‍🦰</div>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:700, color:C.slate900, lineHeight:1 }}>Product to Model AI</h1>
            <p style={{ fontSize:'11px', color:C.slate500, marginTop:'2px' }}>Foto produk → foto model memakai produk — 20 model pilihan</p>
          </div>
        </div>
      </div>

      {/* ── Fashn.ai tip banner ────────────────────────────── */}
      <div style={{ padding:'11px 14px', background:C.b50, border:`1px solid ${C.b100}`, borderRadius:'11px', marginBottom:'18px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
        <Info size={14} color={C.brand} style={{ flexShrink:0, marginTop:'1px' }}/>
        <div style={{ fontSize:'11px', color:C.slate700, lineHeight:1.6 }}>
          <b>Tips (Fashn.ai style):</b> Untuk hasil terbaik, coba <b>generate tanpa custom prompt</b> dulu — AI akan baca produk dari gambar upload. Tambahkan custom prompt HANYA jika ingin model berinteraksi spesifik dengan produk (misal: "jaket dipakai terbuka di atas kaos").
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:'18px', alignItems:'flex-start' }}>

        {/* ══ LEFT PANEL ════════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = C.purple }}
            onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200 }}
            onDrop={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200; onDrop(e) }}
            onClick={() => !loading && fileRef.current?.click()}
            style={{ borderRadius:'14px', border:`2px dashed ${C.slate200}`, background:C.slate50, overflow:'hidden', cursor:loading?'default':'pointer', transition:'border-color .15s' }}>
            {preview ? (
              <div style={{ position:'relative' }}>
                <img src={preview} alt="" style={{ width:'100%', height:'220px', objectFit:'contain', background:'#000', display:'block' }}/>
                <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null) }}
                  style={{ position:'absolute', top:'8px', right:'8px', width:'26px', height:'26px', borderRadius:'50%', border:'none', background:'rgba(0,0,0,.6)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={12}/>
                </button>
                {file && (
                  <div style={{ position:'absolute', bottom:'8px', left:'8px', padding:'3px 8px', borderRadius:'5px', background:'rgba(0,0,0,.6)', fontSize:'9px', color:'#fff', fontWeight:600 }}>
                    {file.name.slice(0,22)} · {(file.size/1024).toFixed(0)}KB
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'28px 16px' }}>
                <div style={{ fontSize:'38px', marginBottom:'8px' }}>📸</div>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.slate700, marginBottom:'3px' }}>Upload foto produk</div>
                <div style={{ fontSize:'11px', color:C.slate400, marginBottom:'10px' }}>Kaos, dress, jaket, celana, aksesori</div>
                <span style={{ padding:'7px 16px', borderRadius:'9px', background:C.purple, color:'#fff', fontSize:'12px', fontWeight:700, display:'inline-flex', gap:'5px', alignItems:'center' }}>
                  <Upload size={12}/> Pilih Foto Produk
                </span>
                <div style={{ fontSize:'10px', color:C.slate400, marginTop:'9px' }}>PNG, JPG, WEBP · Maks 15MB</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
          </div>

          {/* Settings / Prompt Tips tab */}
          <div style={{ background:C.w, borderRadius:'14px', border:`1px solid ${C.slate200}`, overflow:'hidden' }}>
            <div style={{ display:'flex', background:C.slate50, borderBottom:`1px solid ${C.slate100}` }}>
              {[{k:'settings',l:'⚙️ Pengaturan'},{k:'prompt-tips',l:'💡 Prompt Tips'}].map(t => (
                <button key={t.k} type="button" onClick={() => setActiveTab(t.k as any)}
                  style={{ flex:1, padding:'9px', border:'none', background:'none', cursor:'pointer', fontSize:'11px', fontWeight:activeTab===t.k?700:500, color:activeTab===t.k?C.brand:C.slate500, borderBottom:`2px solid ${activeTab===t.k?C.brand:'transparent'}` }}>
                  {t.l}
                </button>
              ))}
            </div>

            {activeTab === 'settings' && (
              <div style={{ padding:'13px', display:'flex', flexDirection:'column', gap:'13px' }}>

                {/* Pose */}
                <div>
                  <label style={lbl}>Pose Model</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {POSE_PRESETS.map(p => (
                      <Chip key={p.id} icon={p.icon} label={p.label} active={poseId===p.id} onClick={() => setPoseId(p.id)} color={C.brand}/>
                    ))}
                  </div>
                  {poseId && <div style={{ fontSize:'10px', color:C.slate400, marginTop:'4px' }}>{POSE_PRESETS.find(p=>p.id===poseId)?.desc}</div>}
                </div>

                {/* Background */}
                <div>
                  <label style={lbl}>Background</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', maxHeight:'120px', overflowY:'auto' }}>
                    {BACKGROUND_PRESETS.map(b => (
                      <Chip key={b.id} icon={b.icon} label={b.label} active={bgId===b.id} onClick={() => setBgId(b.id)} color={C.green}/>
                    ))}
                  </div>
                </div>

                {/* Lighting */}
                <div>
                  <label style={lbl}>Pencahayaan</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {[
                      { id:'studio-soft',   l:'☀️ Studio Soft',  desc:'Lembut merata' },
                      { id:'natural-window',l:'🪟 Natural Window',desc:'Cahaya jendela' },
                      { id:'outdoor-bright',l:'🌞 Outdoor',       desc:'Sinar matahari' },
                      { id:'dramatic-rim',  l:'🎭 Dramatic',      desc:'Rim lighting' },
                      { id:'warm-golden',   l:'✨ Golden Hour',   desc:'Hangat premium' },
                    ].map(l => (
                      <Chip key={l.id} icon='' label={l.l} active={lightingId===l.id} onClick={() => setLightingId(l.id)} color={C.amber}/>
                    ))}
                  </div>
                </div>

                {/* AI Strength */}
                <StrengthSlider value={strength} onChange={setStrength}/>

                {/* Custom Prompt */}
                <div>
                  <button type="button" onClick={() => setShowCustom(p=>!p)}
                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:showCustom?C.slate50:C.w, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
                    <span>✏️ Custom Prompt (Opsional)</span>
                    <span style={{ color:C.slate400 }}>{showCustom?'▲':'▼'}</span>
                  </button>
                  {showCustom && (
                    <div style={{ marginTop:'7px' }}>
                      <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} rows={3}
                        placeholder={'Contoh: "jaket dipakai terbuka di atas kaos putih"\nAtau: "dense chunky fabric with visible texture"\nKosongkan untuk hasil default terbaik'}
                        style={{ width:'100%', padding:'9px 11px', borderRadius:'9px', border:`1px solid ${C.slate200}`, fontSize:'11px', fontFamily:"'DM Sans',sans-serif", color:C.slate900, outline:'none', resize:'vertical', lineHeight:1.5, boxSizing:'border-box' }}/>
                      <div style={{ fontSize:'9px', color:C.slate400, marginTop:'3px', lineHeight:1.4 }}>
                        💡 Deskripsikan HANYA bagaimana model berinteraksi dengan produk — bukan warna/tekstur produk (AI sudah baca dari gambar)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'prompt-tips' && (
              <div style={{ padding:'13px', display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { title:'✅ Kapan pakai Custom Prompt', content:'Hanya saat model tidak wearing produk dengan benar di hasil pertama, atau ingin interaksi spesifik ("jaket dibuka", "syal dililit sekali")' },
                  { title:'❌ Jangan describe produk', content:'AI sudah baca warna, pola, dan tekstur dari foto upload. Menyebut produk justru bisa mengubahnya.' },
                  { title:'💡 Tips iterasi', content:'Run pertama tanpa prompt. Kalau ada yang salah, tambahkan HANYA detail yang kurang, bukan describe ulang dari awal.' },
                  { title:'🎯 Tips pose', content:'"Full body" untuk dress/celana, "Upper body" untuk kaos/blouse/aksesori, "Three-quarter" untuk tampilan dinamis' },
                  { title:'📐 AI Strength', content:'Rendah (55-65%): produk lebih terjaga aslinya. Tinggi (80-90%): AI lebih kreatif tapi produk bisa berubah.' },
                ].map((tip, i) => (
                  <div key={i} style={{ padding:'9px 11px', background:C.slate50, borderRadius:'9px', border:`1px solid ${C.slate200}` }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:C.slate900, marginBottom:'4px' }}>{tip.title}</div>
                    <div style={{ fontSize:'11px', color:C.slate600, lineHeight:1.5 }}>{tip.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'10px 13px', background:C.r50, border:`1px solid #FECACA`, borderRadius:'10px', fontSize:'12px', color:C.red, display:'flex', gap:'7px', alignItems:'flex-start' }}>
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>{error}
            </div>
          )}

          {/* Generate button */}
          <button type="button" onClick={generate} disabled={!file || loading}
            style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'none', fontSize:'14px', fontWeight:700, cursor:!file||loading?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all .15s',
              background: !file||loading ? C.slate200 : 'linear-gradient(135deg,#DB2777,#7C3AED)',
              color: !file||loading ? C.slate400 : '#fff',
              boxShadow: !file||loading ? 'none' : '0 6px 22px rgba(219,39,119,.35)',
            }}>
            {loading
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Generating AI Model...</>
              : <><Sparkles size={15}/> Generate Model AI</>
            }
          </button>

          {/* Progress */}
          {loading && (
            <div>
              <div style={{ height:'5px', borderRadius:'3px', background:C.slate100, overflow:'hidden', marginBottom:'5px' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#DB2777,#7C3AED)', borderRadius:'3px', transition:'width .8s ease' }}/>
              </div>
              <div style={{ fontSize:'11px', color:C.slate500, textAlign:'center' }}>{progressMsg} ({progress}%)</div>
              <div style={{ fontSize:'10px', color:C.slate400, textAlign:'center', marginTop:'2px' }}>⏱️ Estimasi 25-45 detik</div>
            </div>
          )}

          {/* Selected model info */}
          {model && (
            <div style={{ padding:'11px 13px', borderRadius:'11px', background:`${C.pink}08`, border:`1px solid ${C.pink}25` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                <span style={{ fontSize:'20px' }}>{model.icon}</span>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.pink }}>{model.label}</div>
                  <div style={{ fontSize:'10px', color:C.slate500 }}>{model.ageRange} · {model.bodyType}</div>
                </div>
              </div>
              <div style={{ fontSize:'10px', color:C.slate600, lineHeight:1.4, marginBottom:'6px' }}>
                Kulit: {model.skinTone} · Rambut: {model.hairDesc}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {model.bestFor.slice(0,4).map(b => (
                  <span key={b} style={{ fontSize:'9px', padding:'2px 7px', borderRadius:'20px', background:C.pk50, color:C.pink, fontWeight:600 }}>✓ {b}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL ═══════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

          {/* Model selector */}
          <div style={{ background:C.w, borderRadius:'14px', border:`1px solid ${C.slate200}`, overflow:'hidden' }}>
            {/* Category tabs */}
            <div style={{ display:'flex', borderBottom:`1px solid ${C.slate100}`, background:C.slate50, overflowX:'auto' }}>
              {[{ key:'popular', label:'⭐ Populer' }, ...Object.entries(MODEL_CATEGORIES).map(([k,v]) => ({ key:k, label:`${v.icon} ${v.label}` }))].map(cat => (
                <button key={cat.key} type="button" onClick={() => setActiveCat(cat.key)}
                  style={{ padding:'8px 12px', border:'none', background:'none', cursor:'pointer', fontSize:'11px', fontWeight:activeCat===cat.key?700:500, color:activeCat===cat.key?C.purple:C.slate500, borderBottom:`2px solid ${activeCat===cat.key?C.purple:'transparent'}`, whiteSpace:'nowrap', flexShrink:0, transition:'all .12s' }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Model grid */}
            <div style={{ padding:'12px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px,1fr))', gap:'8px', maxHeight:'260px', overflowY:'auto' }}>
              {catModels.map(m => (
                <ModelCard key={m.id} m={m} selected={modelId===m.id} onClick={() => setModelId(m.id)}/>
              ))}
              {catModels.length === 0 && (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'20px', color:C.slate400, fontSize:'12px' }}>
                  Tidak ada model di kategori ini
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          {result ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>
                  ✨ Hasil — {model.label}
                </div>
                <div style={{ display:'flex', gap:'7px' }}>
                  <button onClick={() => setShowBefore(p=>!p)}
                    style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 12px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:showBefore?C.slate100:C.w, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
                    ⇔ Before/After
                  </button>
                  <button onClick={download}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'9px', border:'none', background:C.green, color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                    <Download size={13}/> Download
                  </button>
                  <button onClick={() => { setResult(null); setShowBefore(false) }}
                    style={{ padding:'7px 10px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.w, cursor:'pointer', display:'flex', alignItems:'center' }}>
                    <RotateCcw size={13} color={C.slate500}/>
                  </button>
                </div>
              </div>

              {showBefore && preview
                ? <BASlider before={preview} after={result}/>
                : (
                  <div style={{ position:'relative', borderRadius:'16px', overflow:'hidden', cursor:'zoom-in' }}
                    onClick={() => setZoomed(true)}>
                    <img src={result} alt="Model" style={{ width:'100%', maxHeight:'560px', objectFit:'contain', background:'#111', display:'block' }}/>
                    <div style={{ position:'absolute', bottom:'10px', left:'10px', padding:'4px 10px', borderRadius:'7px', background:'rgba(0,0,0,.55)', fontSize:'10px', color:'#fff', fontWeight:600, backdropFilter:'blur(4px)' }}>
                      {model.label} · {POSE_PRESETS.find(p=>p.id===poseId)?.label} · Klik zoom
                    </div>
                  </div>
                )
              }

              <div style={{ display:'flex', gap:'7px' }}>
                <button onClick={generate}
                  style={{ flex:1, padding:'10px', borderRadius:'10px', border:`1.5px solid ${C.purple}`, background:C.p50, color:C.purple, fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', fontFamily:"'DM Sans',sans-serif" }}>
                  <RefreshCw size={12}/> Regenerate Variasi
                </button>
                <button style={{ flex:1, padding:'10px', borderRadius:'10px', border:`1.5px solid ${C.slate200}`, background:C.w, color:C.slate600, fontSize:'12px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', fontFamily:"'DM Sans',sans-serif" }}>
                  <BookOpen size={12}/> Simpan ke Library
                </button>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'440px', textAlign:'center', border:`2px dashed ${C.slate200}`, borderRadius:'16px', background:C.slate50 }}>
              {loading ? (
                <>
                  <div style={{ position:'relative', marginBottom:'20px' }}>
                    <div style={{ width:'72px', height:'72px', borderRadius:'50%', border:`4px solid ${C.slate200}`, borderTop:`4px solid ${C.pink}`, animation:'spin 1s linear infinite' }}/>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>🧑‍🦰</div>
                  </div>
                  <div style={{ fontSize:'15px', fontWeight:700, color:C.slate900, marginBottom:'5px' }}>AI sedang fitting produk ke model...</div>
                  <div style={{ fontSize:'12px', color:C.slate500 }}>{progressMsg}</div>
                  <div style={{ fontSize:'11px', color:C.slate400, marginTop:'5px' }}>⏱️ Estimasi 25-45 detik</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'56px', marginBottom:'14px' }}>🧑‍🦰</div>
                  <div style={{ fontSize:'15px', fontWeight:700, color:C.slate900, marginBottom:'6px' }}>Product to Model AI</div>
                  <div style={{ fontSize:'12px', color:C.slate500, lineHeight:1.6, maxWidth:'320px', marginBottom:'16px' }}>
                    Upload foto produk fashion, pilih model dari 20+ pilihan, lalu klik Generate. AI akan fitting produk ke model secara realistis.
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center' }}>
                    {MODEL_PRESETS.filter(m=>m.popular).slice(0,6).map(m => (
                      <button key={m.id} type="button" onClick={() => setModelId(m.id)}
                        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', borderRadius:'99px', border:`1.5px solid ${modelId===m.id?C.purple:C.slate200}`, background:modelId===m.id?C.p50:C.w, cursor:'pointer', fontSize:'11px', color:C.slate700 }}>
                        {m.icon} {m.label}
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.9)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
          onClick={() => setZoomed(false)}>
          <img src={result} alt="" style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:'12px' }}/>
          <button onClick={() => setZoomed(false)}
            style={{ position:'absolute', top:'16px', right:'16px', width:'38px', height:'38px', borderRadius:'50%', border:'none', background:'rgba(255,255,255,.2)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={17}/>
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:2px }
        @media (max-width:860px) {
          div[style*="grid-template-columns:360px"] { grid-template-columns:1fr !important }
        }
      `}</style>
    </div>
  )
}