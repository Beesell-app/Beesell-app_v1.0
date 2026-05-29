'use client'
// apps/web-app/app/(dashboard)/content/new/page.tsx
// ── BeeSell AI — Unified Content Creator ─────────────────────
// Flow: 1. Input Produk → 2. Generate Gambar AI → 3. Caption Suite (6 engine)
// State dibawa antar step via contentFlowStore (sessionStorage)

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Sparkles, Image as ImageIcon,
  Video, Check, Loader2, Copy, Download, BookmarkPlus,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp, Zap,
  Eye, X, Info,
} from 'lucide-react'
import {
  useContentFlowStore, ENGINE_META,
  type CaptionEngine, type GeneratedImage,
} from '@/store/contentFlowStore'

// ── Design tokens ──────────────────────────────────────────────
const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE', brand700:'#1D4ED8',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  slate900:'#0F172A', slate800:'#1E293B', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#ffffff',
}

// ── Constants ──────────────────────────────────────────────────
const IMAGE_MODES = [
  { id:'product', icon:'📸', label:'Foto Produk',  desc:'Studio, flat lay, lifestyle' },
  { id:'ugc',     icon:'🎬', label:'UGC Content',  desc:'Authentic, user-generated style' },
  { id:'scene',   icon:'🌄', label:'Product Scene',desc:'Produk dalam setting menarik' },
  { id:'before-after',icon:'✨',label:'Before-After',desc:'Transformasi produk' },
]
const IMAGE_STYLES: Record<string,{value:string;label:string;icon:string}[]> = {
  product:       [{value:'studio-white',label:'Studio Putih',icon:'⬜'},{value:'flat-lay',label:'Flat Lay',icon:'🔲'},{value:'lifestyle',label:'Lifestyle',icon:'🌿'},{value:'luxury',label:'Luxury',icon:'💎'}],
  ugc:           [{value:'unboxing',label:'Unboxing',icon:'📦'},{value:'daily-use',label:'Daily Use',icon:'☀️'},{value:'review',label:'Review',icon:'⭐'},{value:'reaction',label:'Reaksi',icon:'😍'}],
  scene:         [{value:'cafe',label:'Cafe',icon:'☕'},{value:'beach',label:'Pantai',icon:'🏖️'},{value:'home',label:'Rumah',icon:'🏠'},{value:'outdoor',label:'Outdoor',icon:'🌳'}],
  'before-after':[{value:'skin-glow',label:'Kulit Glowing',icon:'✨'},{value:'fashion',label:'Fashion',icon:'👗'},{value:'makeup',label:'Makeup',icon:'💄'},{value:'hair',label:'Rambut',icon:'💇'}],
}
const RATIOS = [
  { value:'1:1', label:'Square', desc:'Instagram' },
  { value:'9:16',label:'Vertikal',desc:'Reels/TikTok' },
  { value:'4:5', label:'Portrait',desc:'Feed' },
  { value:'16:9',label:'Landscape',desc:'Banner' },
]
const PLATFORMS = ['instagram','tiktok','tiktok-shop','shopee','tokopedia','facebook','whatsapp']
const TONES     = ['casual','energetic','professional','luxury','playful']
const ENGINES: CaptionEngine[] = ['caption','hook','cta','soft-selling','hard-selling','description','marketplace']

// ── Step indicator ─────────────────────────────────────────────
function StepBar({ current }: { current: 1|2|3 }) {
  const steps = [
    { n:1, label:'Produk & Gambar' },
    { n:2, label:'Pilih Gambar' },
    { n:3, label:'Caption Suite' },
  ]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0', marginBottom:'24px' }}>
      {steps.map((s, i) => (
        <>
          <div key={s.n} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <div style={{
              width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              background: current > s.n ? C.green : current === s.n ? C.brand : C.slate200,
              color:      current >= s.n ? C.white : C.slate500,
              fontSize:   '13px', fontWeight:700, transition:'all .2s',
            }}>
              {current > s.n ? <Check size={14}/> : s.n}
            </div>
            <span style={{ fontSize:'10px', fontWeight:600, color: current === s.n ? C.brand : C.slate400, whiteSpace:'nowrap' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div key={`line-${i}`} style={{ flex:1, height:'2px', background: current > s.n + 0 ? C.green : C.slate200, margin:'0 6px', marginBottom:'14px', transition:'background .3s' }}/>
          )}
        </>
      ))}
    </div>
  )
}

// ── Shimmer ────────────────────────────────────────────────────
function Shimmer({ w='100%', h='14px', r='6px' }: { w?:string; h?:string; r?:string }) {
  return <div style={{ width:w, height:h, borderRadius:r, background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite' }}/>
}

// ── Main Page ──────────────────────────────────────────────────
export default function ContentNewPage() {
  const store = useContentFlowStore()

  // ── Step 1 state ──────────────────────────────────────────
  const [imgMode,    setImgMode]    = useState('product')
  const [imgStyle,   setImgStyle]   = useState('studio-white')
  const [imgRatio,   setImgRatio]   = useState('1:1')
  const [imgCount,   setImgCount]   = useState(4)
  const [genImages,  setGenImages]  = useState<Array<{id:string;url:string;status:'loading'|'ready'|'error';jobId?:string}>>([])
  const [genLoading, setGenLoading] = useState(false)
  const [genError,   setGenError]   = useState('')
  const pollRefs = useRef<Record<string,ReturnType<typeof setInterval>>>({})

  // Step navigation
  const [step, setStep] = useState<1|2|3>(1)
  const [lightbox, setLightbox] = useState<string|null>(null)

  // ── Step 3 state ──────────────────────────────────────────
  const [activeEngine, setActiveEngine] = useState<CaptionEngine>('caption')
  const [capResults,   setCapResults]   = useState<Array<{id:string;engine:CaptionEngine;text:string;meta?:Record<string,string>}>>([])
  const [capLoading,   setCapLoading]   = useState(false)
  const [capError,     setCapError]     = useState('')
  const [copiedId,     setCopiedId]     = useState<string|null>(null)
  const [savedIds,     setSavedIds]     = useState<Set<string>>(new Set())
  const [capPlatform,  setCapPlatform]  = useState('instagram')
  const [capTone,      setCapTone]      = useState('casual')
  const [capVariants,  setCapVariants]  = useState(3)
  const [showCapConf,  setShowCapConf]  = useState(false)

  // ── Shared input ──────────────────────────────────────────
  const productName  = store.productName
  const productDesc  = store.productDesc
  const productPrice = store.productPrice
  const selectedImg  = store.selectedImage

  // Input helpers
  const inp: React.CSSProperties = {
    width:'100%', padding:'10px 13px', borderRadius:'10px',
    border:`1.5px solid ${C.slate200}`, fontSize:'13px',
    fontFamily:"'DM Sans',sans-serif", color:C.slate900,
    outline:'none', boxSizing:'border-box', background:C.white, transition:'border-color .15s',
  }
  const lbl: React.CSSProperties = {
    fontSize:'11px', fontWeight:700, color:C.slate500,
    textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px',
  }

  // ── Poll image job ────────────────────────────────────────
  const pollJob = useCallback((jobId: string, id: string) => {
    let n = 0
    pollRefs.current[id] = setInterval(async () => {
      n++
      if (n >= 40) { clearInterval(pollRefs.current[id]); setGenImages(p => p.map(r => r.id===id ? {...r,status:'error'} : r)); return }
      try {
        const res = await fetch(`/api/jobs/${jobId}/status`)
        if (!res.ok) return
        const { status, imageUrl } = await res.json()
        if (status === 'completed' && imageUrl) {
          clearInterval(pollRefs.current[id])
          const img: GeneratedImage = { id, url:imageUrl, jobId, mode:imgMode, style:imgStyle, ratio:imgRatio }
          setGenImages(p => p.map(r => r.id===id ? {...r,status:'ready',url:imageUrl} : r))
          store.addImage(img)
        } else if (status === 'failed') {
          clearInterval(pollRefs.current[id])
          setGenImages(p => p.map(r => r.id===id ? {...r,status:'error'} : r))
        }
      } catch {}
    }, 3000)
  }, [imgMode, imgStyle, imgRatio, store])

  // ── Generate images ───────────────────────────────────────
  const generateImages = async () => {
    if (!productName.trim()) { setGenError('Masukkan nama produk dulu'); return }
    Object.values(pollRefs.current).forEach(clearInterval)
    pollRefs.current = {}
    setGenError('')
    setGenLoading(true)

    const placeholders = Array.from({ length: imgCount }, (_, i) => ({
      id: `img-${Date.now()}-${i}`, url:'', status:'loading' as const,
    }))
    setGenImages(placeholders)

    await Promise.allSettled(placeholders.map(async (ph, i) => {
      await new Promise(r => setTimeout(r, i * 350))
      try {
        const res = await fetch('/api/generate/image', {
          method:'POST', headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({
            productName: productName.trim(),
            productDesc: productDesc || undefined,
            mode: imgMode, style: imgStyle, ratio: imgRatio,
          }),
        })
        if (!res.ok) { setGenImages(p => p.map(r => r.id===ph.id ? {...r,status:'error'} : r)); return }
        const { jobId } = await res.json()
        setGenImages(p => p.map(r => r.id===ph.id ? {...r,jobId} : r))
        pollJob(jobId, ph.id)
      } catch {
        setGenImages(p => p.map(r => r.id===ph.id ? {...r,status:'error'} : r))
      }
    }))
    setGenLoading(false)
  }

  // ── Proceed from step 1 → 2 ───────────────────────────────
  const proceedToSelect = () => {
    if (genImages.filter(i => i.status === 'ready').length === 0 && genImages.length === 0) {
      // Skip image gen — langsung ke caption
      store.selectImage(null)
      setStep(3)
      return
    }
    setStep(2)
    setTimeout(() => document.getElementById('step2-top')?.scrollIntoView({ behavior:'smooth', block:'start' }), 100)
  }

  // ── Proceed from step 2 → 3 ───────────────────────────────
  const proceedToCaption = (img?: GeneratedImage) => {
    if (img) store.selectImage(img)
    setStep(3)
    setCapResults([])
    setTimeout(() => {
      document.getElementById('caption-panel')?.scrollIntoView({ behavior:'smooth', block:'start' })
    }, 100)
  }

  // ── Generate captions (Step 3) ────────────────────────────
  const generateCaptions = async (eng: CaptionEngine = activeEngine) => {
    if (!productName.trim()) { setCapError('Nama produk tidak ada'); return }
    setCapError(''); setCapLoading(true)

    try {
      const res = await fetch('/api/generate/content-suite', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          engine:       eng,
          productName,
          productDesc:  productDesc  || undefined,
          productPrice: productPrice || undefined,
          tone:         capTone,
          platform:     capPlatform,
          variants:     capVariants,
          imageContext: store.selectedImage ? {
            mode: store.selectedImage.mode,
            style: store.selectedImage.style,
            url:   store.selectedImage.url,
          } : undefined,
        }),
      })

      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e?.message ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      const items = (data.items ?? []).map((item: any) => ({
        ...item, engine: eng,
      }))
      setCapResults(prev => {
        const filtered = prev.filter(c => c.engine !== eng)
        return [...items, ...filtered].slice(0, 20)
      })
    } catch (e: any) {
      setCapError(e.message ?? 'Gagal generate. Coba lagi.')
    } finally {
      setCapLoading(false)
    }
  }

  const copyText = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) } catch {}
  }

  const engineResults = capResults.filter(c => c.engine === activeEngine)
  const readyImgs     = genImages.filter(i => i.status === 'ready')

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:'20px' }}>
        <Link href="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', color:C.slate400, textDecoration:'none', marginBottom:'8px' }}>
          <ArrowLeft size={12}/> Dashboard
        </Link>
        <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(20px,3.5vw,26px)', fontWeight:600, color:C.slate900, letterSpacing:'-0.02em' }}>
          Buat Konten Lengkap
        </h1>
        <p style={{ fontSize:'13px', color:C.slate500, marginTop:'2px' }}>
          Gambar AI → Pilih gambar → Caption Suite — satu alur kerja, konten siap post
        </p>
      </div>

      <StepBar current={step as 1|2|3}/>

      {/* ══════════════════════════════════════════════════════ */}
      {/* STEP 1 — Produk + Generate Gambar                   */}
      {/* ══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,340px) minmax(0,1fr)', gap:'16px', alignItems:'start' }}>

          {/* Config kiri */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

            {/* Produk input */}
            <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, padding:'16px' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:C.slate900, marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
                <Sparkles size={13} color={C.brand}/> Informasi Produk
              </div>

              <label style={lbl}>Nama Produk <span style={{ color:C.red }}>*</span></label>
              <input value={productName} onChange={e => store.setProductContext({ productName:e.target.value })}
                placeholder="Contoh: Serum Vitamin C Brightening 30ml" style={{ ...inp, marginBottom:'10px' }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.brand}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.slate200}
              />

              <label style={lbl}>Deskripsi / Keunggulan</label>
              <textarea value={productDesc} onChange={e => store.setProductContext({ productDesc:e.target.value })}
                placeholder="Kandungan, manfaat, target pengguna..." rows={2}
                style={{ ...inp, resize:'vertical', marginBottom:'10px' }}
              />

              <label style={lbl}>Harga (opsional)</label>
              <input value={productPrice} onChange={e => store.setProductContext({ productPrice:e.target.value })}
                placeholder="Rp 89.000" style={inp}
              />
            </div>

            {/* Image mode */}
            <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, padding:'16px' }}>
              <label style={lbl}><ImageIcon size={11}/>&nbsp;Mode Gambar</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginBottom:'12px' }}>
                {IMAGE_MODES.map(m => (
                  <button key={m.id} type="button" onClick={() => { setImgMode(m.id); setImgStyle(IMAGE_STYLES[m.id]?.[0]?.value ?? '') }}
                    style={{ padding:'9px', borderRadius:'10px', border:`1.5px solid ${imgMode===m.id ? C.brand : C.slate200}`, background: imgMode===m.id ? C.brand50 : C.white, cursor:'pointer', textAlign:'center', transition:'all .12s' }}>
                    <div style={{ fontSize:'18px', marginBottom:'3px' }}>{m.icon}</div>
                    <div style={{ fontSize:'11px', fontWeight:700, color: imgMode===m.id ? C.brand : C.slate700 }}>{m.label}</div>
                  </button>
                ))}
              </div>

              <label style={lbl}>Gaya Visual</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
                {(IMAGE_STYLES[imgMode] ?? []).map(s => (
                  <button key={s.value} type="button" onClick={() => setImgStyle(s.value)}
                    style={{ padding:'5px 10px', borderRadius:'7px', border:`1px solid ${imgStyle===s.value ? C.brand : C.slate200}`, background: imgStyle===s.value ? C.brand50 : C.white, cursor:'pointer', fontSize:'11px', fontWeight:700, color: imgStyle===s.value ? C.brand : C.slate600, transition:'all .12s' }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>

              <label style={lbl}>Ukuran</label>
              <div style={{ display:'flex', gap:'5px', marginBottom:'12px' }}>
                {RATIOS.map(r => (
                  <button key={r.value} type="button" onClick={() => setImgRatio(r.value)}
                    style={{ flex:1, padding:'6px', borderRadius:'8px', border:`1.5px solid ${imgRatio===r.value ? C.brand : C.slate200}`, background: imgRatio===r.value ? C.brand : C.white, cursor:'pointer', fontSize:'10px', fontWeight:700, color: imgRatio===r.value ? C.white : C.slate600 }}>
                    {r.label}
                  </button>
                ))}
              </div>

              <label style={lbl}>Jumlah Gambar</label>
              <div style={{ display:'flex', gap:'6px' }}>
                {[1,2,4].map(n => (
                  <button key={n} type="button" onClick={() => setImgCount(n)}
                    style={{ flex:1, padding:'8px', borderRadius:'9px', border:`1.5px solid ${imgCount===n ? C.brand : C.slate200}`, background: imgCount===n ? C.brand : C.white, cursor:'pointer', fontSize:'14px', fontWeight:700, color: imgCount===n ? C.white : C.slate700 }}>
                    {n}×
                  </button>
                ))}
              </div>
            </div>

            {genError && (
              <div style={{ padding:'10px 12px', background:C.red50, border:`1px solid #FECACA`, borderRadius:'10px', fontSize:'12px', color:C.red, display:'flex', gap:'6px' }}>
                <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>{genError}
              </div>
            )}

            <button type="button" onClick={generateImages} disabled={genLoading || !productName.trim()}
              style={{ width:'100%', padding:'13px', borderRadius:'13px', border:'none', background: genLoading || !productName.trim() ? C.slate200 : `linear-gradient(135deg, ${C.purple}, #5B21B6)`, color: genLoading || !productName.trim() ? C.slate400 : C.white, fontSize:'14px', fontWeight:700, cursor: genLoading || !productName.trim() ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow: genLoading ? 'none' : '0 6px 20px rgba(124,58,237,.35)', transition:'all .15s' }}>
              {genLoading ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Generating...</> : <><ImageIcon size={15}/>Generate {imgCount} Gambar AI</>}
            </button>
          </div>

          {/* Right: image preview grid */}
          <div>
            {genImages.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'360px', borderRadius:'20px', border:`2px dashed ${C.slate200}`, background:C.slate50 }}>
                <div style={{ fontSize:'48px', opacity:.4, marginBottom:'12px' }}>🖼️</div>
                <div style={{ fontSize:'14px', fontWeight:700, color:C.slate700, marginBottom:'5px' }}>Gambar akan muncul di sini</div>
                <div style={{ fontSize:'12px', color:C.slate400, textAlign:'center', maxWidth:'240px', lineHeight:1.5 }}>
                  Isi nama produk, pilih mode & gaya, lalu klik Generate
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>
                    Hasil Generate
                    {genImages.filter(i => i.status==='loading').length > 0 && <span style={{ fontSize:'11px', color:C.amber, marginLeft:'8px' }}>· {genImages.filter(i=>i.status==='loading').length} sedang diproses</span>}
                    {readyImgs.length > 0 && <span style={{ fontSize:'11px', color:C.green, marginLeft:'8px' }}>· {readyImgs.length} siap</span>}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'16px' }}>
                  {genImages.map((img, i) => (
                    <div key={img.id} style={{ borderRadius:'12px', overflow:'hidden', border:`1px solid ${C.slate200}`, background:C.white, boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
                      <div style={{ position:'relative', paddingBottom:'100%', background:C.slate100 }}>
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {img.status === 'loading' ? (
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                              <div style={{ display:'flex', gap:'3px' }}>
                                {[0,1,2].map(j => <div key={j} style={{ width:'5px', height:'5px', borderRadius:'50%', background:C.purple, animation:`bounce 1.2s ease-in-out ${j*.2}s infinite` }}/>)}
                              </div>
                              <span style={{ fontSize:'11px', color:C.slate400 }}>Generating...</span>
                            </div>
                          ) : img.status === 'error' ? (
                            <div style={{ textAlign:'center', color:C.red }}>
                              <AlertCircle size={20}/><br/>
                              <span style={{ fontSize:'11px' }}>Gagal</span>
                            </div>
                          ) : (
                            <img src={img.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', cursor:'pointer' }} onClick={() => setLightbox(img.url)}/>
                          )}
                        </div>
                        <div style={{ position:'absolute', top:'6px', left:'6px', background:'rgba(0,0,0,.5)', color:'#fff', fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'4px' }}>{i+1}</div>
                        {img.status==='ready' && <div style={{ position:'absolute', top:'6px', right:'6px' }}>
                          <button onClick={() => setLightbox(img.url)} style={{ width:'24px', height:'24px', borderRadius:'6px', background:'rgba(0,0,0,.5)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Eye size={11} color="white"/>
                          </button>
                        </div>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* CTA proceed */}
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              {readyImgs.length > 0 && (
                <button type="button" onClick={proceedToSelect}
                  style={{ flex:1, padding:'13px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg, ${C.brand}, ${C.brand700})`, color:C.white, fontSize:'14px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:`0 6px 20px ${C.brand}50`, fontFamily:"'DM Sans',sans-serif" }}>
                  Pilih Gambar → Buat Caption <ArrowRight size={15}/>
                </button>
              )}
              <button type="button" onClick={() => { store.selectImage(null); setStep(3); setTimeout(() => document.getElementById('caption-panel')?.scrollIntoView({behavior:'smooth'}),100) }}
                style={{ padding:'13px 18px', borderRadius:'12px', border:`1.5px solid ${C.slate200}`, background:C.white, color:C.slate700, fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontFamily:"'DM Sans',sans-serif" }}>
                <Sparkles size={13}/> Skip ke Caption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STEP 2 — Pilih Gambar                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div id="step2-top">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', flexWrap:'wrap', gap:'8px' }}>
            <div>
              <h2 style={{ fontSize:'16px', fontWeight:700, color:C.slate900, marginBottom:'2px' }}>Pilih gambar untuk digunakan</h2>
              <p style={{ fontSize:'12px', color:C.slate500 }}>Gambar yang dipilih akan menjadi konteks untuk caption yang dibuat</p>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ padding:'7px 14px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.slate600, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <ArrowLeft size={13}/> Kembali
              </button>
              <button type="button" onClick={() => proceedToCaption(undefined)} style={{ padding:'7px 14px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
                Tanpa gambar →
              </button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,220px),1fr))', gap:'12px', marginBottom:'20px' }}>
            {readyImgs.map(img => (
              <div key={img.url} onClick={() => proceedToCaption({ id:img.id, url:img.url, mode:imgMode, style:imgStyle, ratio:imgRatio })}
                style={{ borderRadius:'14px', overflow:'hidden', border:`2px solid ${selectedImg?.url===img.url ? C.brand : C.slate200}`, cursor:'pointer', transition:'all .15s', boxShadow: selectedImg?.url===img.url ? `0 0 0 2px ${C.brand}` : 'none' }}>
                <div style={{ position:'relative', paddingBottom:'100%' }}>
                  <img src={img.url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
                  {selectedImg?.url === img.url && (
                    <div style={{ position:'absolute', top:'8px', right:'8px', width:'24px', height:'24px', borderRadius:'50%', background:C.brand, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Check size={13} color="white"/>
                    </div>
                  )}
                </div>
                <div style={{ padding:'8px 10px', background:C.white }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:C.slate700 }}>{imgMode} · {imgStyle}</div>
                  <div style={{ fontSize:'10px', color:C.slate400 }}>Klik untuk lanjut buat caption →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STEP 3 — Caption Suite                              */}
      {/* ══════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div id="caption-panel">
          {/* Context bar — gambar yang dipilih */}
          {selectedImg && (
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:C.brand50, borderRadius:'12px', border:`1px solid ${C.brand100}`, marginBottom:'16px' }}>
              <img src={selectedImg.url} alt="" style={{ width:'44px', height:'44px', borderRadius:'8px', objectFit:'cover', flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:C.brand, marginBottom:'2px' }}>
                  ✓ Gambar terpilih sebagai konteks caption
                </div>
                <div style={{ fontSize:'11px', color:C.slate600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {selectedImg.mode} · {selectedImg.style} · {productName}
                </div>
              </div>
              <button onClick={() => setStep(2)} style={{ fontSize:'11px', color:C.brand, fontWeight:600, background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                Ganti gambar
              </button>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
            <div>
              <h2 style={{ fontSize:'16px', fontWeight:700, color:C.slate900, marginBottom:'2px' }}>Caption Suite — 7 Engine AI</h2>
              <p style={{ fontSize:'12px', color:C.slate500 }}>Pilih engine, generate, copy, dan post</p>
            </div>
            <button type="button" onClick={() => setStep(readyImgs.length > 0 ? 2 : 1)} style={{ padding:'7px 14px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.slate600, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
              <ArrowLeft size={13}/> Kembali
            </button>
          </div>

          {/* Engine selector */}
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px' }}>
            {ENGINES.map(eng => {
              const m = ENGINE_META[eng]
              const hasResult = capResults.some(c => c.engine === eng)
              return (
                <button key={eng} type="button" onClick={() => { setActiveEngine(eng); if (!hasResult) generateCaptions(eng) }}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'99px', border:`1.5px solid ${activeEngine===eng ? m.color : hasResult ? m.color+'50' : C.slate200}`, background: activeEngine===eng ? m.bg : hasResult ? m.color+'08' : C.white, cursor:'pointer', fontSize:'12px', fontWeight:700, color: activeEngine===eng ? m.color : hasResult ? m.color : C.slate600, transition:'all .15s', whiteSpace:'nowrap' }}>
                  {m.icon} {m.label}
                  {hasResult && activeEngine !== eng && <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:m.color, flexShrink:0 }}/>}
                </button>
              )
            })}
          </div>

          {/* Active engine info + quick config */}
          <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'14px', flexWrap:'wrap' }}>
            <div style={{ flex:1, padding:'12px 14px', background:ENGINE_META[activeEngine].bg, borderRadius:'12px', border:`1px solid ${ENGINE_META[activeEngine].color}25` }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:ENGINE_META[activeEngine].color, marginBottom:'2px' }}>
                {ENGINE_META[activeEngine].icon} {ENGINE_META[activeEngine].label}
              </div>
              <div style={{ fontSize:'11px', color:C.slate600 }}>{ENGINE_META[activeEngine].desc}</div>
            </div>

            {/* Quick config toggle */}
            <button type="button" onClick={() => setShowCapConf(s => !s)} style={{ padding:'10px 14px', borderRadius:'12px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:700, color:C.slate700, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
              ⚙️ Config {showCapConf ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
          </div>

          {/* Quick config panel */}
          {showCapConf && (
            <div style={{ padding:'14px', background:C.white, borderRadius:'12px', border:`1px solid ${C.slate200}`, marginBottom:'14px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'14px' }}>
              <div>
                <label style={lbl}>Platform</label>
                <select value={capPlatform} onChange={e => setCapPlatform(e.target.value)} style={{ ...inp, padding:'8px 12px', height:'36px' }}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Tone</label>
                <select value={capTone} onChange={e => setCapTone(e.target.value)} style={{ ...inp, padding:'8px 12px', height:'36px' }}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Variasi</label>
                <div style={{ display:'flex', gap:'5px' }}>
                  {[1,2,3,5].map(n => (
                    <button key={n} type="button" onClick={() => setCapVariants(n)} style={{ flex:1, padding:'7px', borderRadius:'8px', border:`1.5px solid ${capVariants===n ? C.brand : C.slate200}`, background: capVariants===n ? C.brand : C.white, color: capVariants===n ? C.white : C.slate700, cursor:'pointer', fontSize:'12px', fontWeight:700 }}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button type="button" onClick={() => generateCaptions(activeEngine)} disabled={capLoading}
            style={{ width:'100%', padding:'13px', borderRadius:'13px', border:'none', background: capLoading ? C.slate200 : `linear-gradient(135deg, ${ENGINE_META[activeEngine].color}, ${ENGINE_META[activeEngine].color}CC)`, color: capLoading ? C.slate400 : C.white, fontSize:'14px', fontWeight:700, cursor: capLoading ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow: capLoading ? 'none' : `0 6px 20px ${ENGINE_META[activeEngine].color}40`, transition:'all .15s', marginBottom:'14px' }}>
            {capLoading
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Generating {ENGINE_META[activeEngine].label}...</>
              : <><Sparkles size={15}/>Generate {ENGINE_META[activeEngine].label}</>
            }
          </button>

          {/* Error */}
          {capError && (
            <div style={{ padding:'10px 12px', background:C.red50, border:`1px solid #FECACA`, borderRadius:'10px', fontSize:'12px', color:C.red, display:'flex', gap:'6px', marginBottom:'14px' }}>
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>{capError}
            </div>
          )}

          {/* Caption loading skeleton */}
          {capLoading && engineResults.length === 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'14px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ padding:'14px', borderRadius:'12px', border:`1px solid ${C.slate200}`, background:C.white }}>
                  <Shimmer w="70%" h="13px" r="4px"/>
                  <div style={{ marginTop:'8px' }}>
                    <Shimmer w="100%" h="11px" r="3px"/>
                    <div style={{ marginTop:'4px' }}><Shimmer w="90%" h="11px" r="3px"/></div>
                    <div style={{ marginTop:'4px' }}><Shimmer w="80%" h="11px" r="3px"/></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {engineResults.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
              {engineResults.map((cap, i) => (
                <div key={cap.id} style={{ padding:'14px 16px', borderRadius:'12px', border:`1.5px solid ${C.slate200}`, background:C.white, transition:'all .12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = ENGINE_META[activeEngine].color+'60' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200 }}
                >
                  {/* Meta header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                    <span style={{ fontSize:'10px', fontWeight:700, color:ENGINE_META[activeEngine].color, background:ENGINE_META[activeEngine].bg, padding:'2px 8px', borderRadius:'4px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {cap.meta?.type || cap.meta?.style || `${ENGINE_META[activeEngine].icon} ${i+1}`}
                    </span>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <button onClick={() => copyText(cap.text, cap.id)} style={{ display:'flex', alignItems:'center', gap:'3px', padding:'4px 10px', borderRadius:'7px', border:`1px solid ${C.slate200}`, background: copiedId===cap.id ? C.grn50 : C.white, fontSize:'11px', fontWeight:600, color: copiedId===cap.id ? C.green : C.slate600, cursor:'pointer' }}>
                        {copiedId===cap.id ? <><Check size={11}/>Tersalin!</> : <><Copy size={11}/>Salin</>}
                      </button>
                      <button onClick={() => { setSavedIds(p => new Set([...p, cap.id])) }} style={{ display:'flex', alignItems:'center', gap:'3px', padding:'4px 10px', borderRadius:'7px', border:`1px solid ${C.slate200}`, background: savedIds.has(cap.id) ? C.grn50 : C.white, fontSize:'11px', fontWeight:600, color: savedIds.has(cap.id) ? C.green : C.slate600, cursor:'pointer' }}>
                        {savedIds.has(cap.id) ? <Check size={11}/> : <BookmarkPlus size={11}/>}
                      </button>
                    </div>
                  </div>
                  {/* Special: marketplace title */}
                  {cap.meta?.title && (
                    <div style={{ fontSize:'12px', fontWeight:700, color:C.slate900, marginBottom:'6px', padding:'6px 10px', background:C.slate50, borderRadius:'7px' }}>
                      📌 {cap.meta.title}
                    </div>
                  )}
                  {/* Caption text */}
                  <p style={{ fontSize:'13px', color:C.slate800, lineHeight:1.7, whiteSpace:'pre-wrap', margin:0 }}>{cap.text}</p>
                  {/* Hashtags for marketplace */}
                  {cap.meta?.hashtags && (
                    <div style={{ marginTop:'8px', fontSize:'11px', color:C.brand, fontWeight:500 }}>
                      {cap.meta.hashtags}
                    </div>
                  )}
                  {/* Char count */}
                  <div style={{ fontSize:'10px', color:C.slate300, marginTop:'8px' }}>{cap.text.length} karakter</div>
                </div>
              ))}
            </div>
          )}

          {/* Generate more engines */}
          {engineResults.length > 0 && (
            <div style={{ padding:'14px 16px', background:C.slate50, borderRadius:'12px', border:`1px solid ${C.slate200}` }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:C.slate700, marginBottom:'10px' }}>
                ⚡ Generate dengan engine lain:
              </div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {ENGINES.filter(e => e !== activeEngine).map(eng => (
                  <button key={eng} type="button" onClick={() => { setActiveEngine(eng); generateCaptions(eng) }}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'99px', border:`1px solid ${ENGINE_META[eng].color}40`, background: capResults.some(c=>c.engine===eng) ? ENGINE_META[eng].bg : C.white, cursor:'pointer', fontSize:'11px', fontWeight:700, color:ENGINE_META[eng].color, whiteSpace:'nowrap', transition:'all .15s' }}>
                    {ENGINE_META[eng].icon} {ENGINE_META[eng].label}
                    {capResults.some(c=>c.engine===eng) && <Check size={10}/>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(6px)' }}>
          <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:'16px', right:'16px', width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,.15)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18} color="white"/>
          </button>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:'12px' }}/>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes bounce  { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (max-width:767px) {
          div[style*="grid-template-columns:minmax(0,340px)"] { grid-template-columns:1fr!important }
        }
        * { box-sizing: border-box }
      `}</style>
    </div>
  )
}