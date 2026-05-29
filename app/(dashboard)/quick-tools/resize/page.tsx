'use client'
// app/(dashboard)/quick-tools/resize/page.tsx
// ── Resize Smart AI — Full Feature Page ──────────────────────
// Upload 1 gambar → pilih preset platform → resize batch otomatis
// Features: Smart preset, padding mode, quality control, batch download

import { useState, useRef, useCallback } from 'react'
import {
  Upload, Download, RefreshCw, Check, X, Loader2, Zap,
  AlertCircle, ChevronDown, ChevronUp, Package, Image as ImageIcon,
  Settings2, ArrowLeft, Layers, FileImage,
} from 'lucide-react'
import Link from 'next/link'
import {
  PRESETS, CATEGORIES, POPULAR_PRESETS,
  getPresetsByCategory, type ResizePreset,
} from '@/lib/resize/presets'

const C = {
  brand:'#2563EB', b50:'#EFF6FF', b100:'#DBEAFE',
  purple:'#7C3AED', p50:'#F5F3FF',
  green:'#059669', g50:'#ECFDF5',
  amber:'#D97706', a50:'#FFFBEB',
  red:'#DC2626', r50:'#FEF2F2',
  s900:'#0F172A', s700:'#334155', s600:'#475569', s500:'#64748B',
  s400:'#94A3B8', s300:'#CBD5E1', s200:'#E2E8F0', s100:'#F1F5F9', s50:'#F8FAFC', w:'#fff',
}

type PaddingMode  = 'white'|'black'|'transparent'|'blur'|'color'
type QualityMode  = 'high'|'balanced'|'small'
type ExportFmt    = 'jpg'|'png'|'webp'

interface ResizeResult {
  presetId:    string
  label:       string
  platform:    string
  icon:        string
  width?:      number
  height?:     number
  sizeKB?:     number
  format?:     string
  dataUrl?:    string
  filename?:   string
  ratio?:      string
  compliance?: { ok: boolean; issues: string[] }
  error?:      string
}

// ── Preset Chip ────────────────────────────────────────────────
function PresetChip({ p, selected, onClick }: {
  p: ResizePreset; selected: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'9px', border:`1.5px solid ${selected ? C.brand : C.s200}`, background:selected ? C.b50 : C.w, cursor:'pointer', transition:'all .12s', flexShrink:0 }}>
      <span style={{ fontSize:'13px' }}>{p.icon}</span>
      <div style={{ textAlign:'left' }}>
        <div style={{ fontSize:'11px', fontWeight:selected?700:500, color:selected?C.brand:C.s700, lineHeight:1.2 }}>{p.label}</div>
        <div style={{ fontSize:'9px', color:C.s400 }}>{p.w}×{p.h}</div>
      </div>
      {selected && <Check size={11} color={C.brand} style={{ marginLeft:'2px' }}/>}
    </button>
  )
}

// ── Result Card ────────────────────────────────────────────────
function ResultCard({ r, onDownload }: { r: ResizeResult; onDownload: (r: ResizeResult) => void }) {
  const [zoom, setZoom] = useState(false)

  if (r.error) {
    return (
      <div style={{ padding:'10px', borderRadius:'10px', border:`1px solid ${C.red}30`, background:C.r50 }}>
        <div style={{ fontSize:'12px', fontWeight:700, color:C.s700, marginBottom:'3px' }}>{r.icon} {r.label}</div>
        <div style={{ fontSize:'11px', color:C.red }}>{r.error}</div>
      </div>
    )
  }

  const sizeOk = r.compliance?.ok !== false

  return (
    <>
      <div style={{ borderRadius:'12px', border:`1.5px solid ${sizeOk ? C.s200 : C.amber}`, background:C.w, overflow:'hidden', transition:'all .15s' }}>
        {/* Preview */}
        <div style={{ position:'relative', background:C.s100, cursor:'zoom-in', overflow:'hidden' }}
          onClick={() => setZoom(true)}>
          {r.dataUrl && (
            <img src={r.dataUrl} alt={r.label}
              style={{ width:'100%', height:'90px', objectFit:'cover', display:'block' }}/>
          )}
          {/* Dimension badge */}
          <div style={{ position:'absolute', bottom:'4px', left:'4px', padding:'2px 6px', borderRadius:'4px', background:'rgba(0,0,0,.6)', fontSize:'9px', color:'#fff', fontWeight:600 }}>
            {r.width}×{r.height}
          </div>
          {/* Compliance badge */}
          {!sizeOk && (
            <div style={{ position:'absolute', top:'4px', right:'4px', padding:'2px 6px', borderRadius:'4px', background:C.amber, fontSize:'9px', color:'#fff', fontWeight:700 }}>
              ⚠️ Terlalu besar
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding:'8px 10px' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:C.s900, marginBottom:'2px' }}>{r.icon} {r.label}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'10px', color:C.s400 }}>
              {r.ratio} · {r.sizeKB}KB · {r.format?.toUpperCase()}
            </span>
            <button onClick={() => onDownload(r)}
              style={{ display:'flex', alignItems:'center', gap:'3px', padding:'4px 8px', borderRadius:'6px', border:'none', background:C.brand, color:'#fff', fontSize:'10px', fontWeight:700, cursor:'pointer' }}>
              <Download size={10}/> Save
            </button>
          </div>
          {!sizeOk && r.compliance?.issues[0] && (
            <div style={{ fontSize:'9px', color:C.amber, marginTop:'3px', lineHeight:1.3 }}>
              ⚠️ {r.compliance.issues[0]}
            </div>
          )}
        </div>
      </div>

      {/* Zoom modal */}
      {zoom && r.dataUrl && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.9)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
          onClick={() => setZoom(false)}>
          <div style={{ textAlign:'center' }}>
            <img src={r.dataUrl} alt={r.label} style={{ maxWidth:'80vw', maxHeight:'80vh', objectFit:'contain', borderRadius:'10px' }}/>
            <div style={{ color:'#fff', fontSize:'13px', marginTop:'12px', fontWeight:600 }}>
              {r.label} — {r.width}×{r.height}px · {r.sizeKB}KB
            </div>
          </div>
          <button onClick={() => setZoom(false)}
            style={{ position:'absolute', top:'16px', right:'16px', width:'36px', height:'36px', borderRadius:'50%', border:'none', background:'rgba(255,255,255,.2)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16}/>
          </button>
        </div>
      )}
    </>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function ResizeSmartPage() {
  const [file,          setFile]         = useState<File|null>(null)
  const [preview,       setPreview]      = useState<string|null>(null)
  const [inputDims,     setInputDims]    = useState<{w:number;h:number}|null>(null)
  const [selectedIds,   setSelectedIds]  = useState<Set<string>>(new Set(['shopee','tokopedia','instagram-sq','tiktok-story']))
  const [padding,       setPadding]      = useState<PaddingMode>('white')
  const [paddingColor,  setPaddingColor] = useState('#ffffff')
  const [quality,       setQuality]      = useState<QualityMode>('balanced')
  const [format,        setFormat]       = useState<ExportFmt>('jpg')
  const [sharpen,       setSharpen]      = useState(false)
  const [denoise,       setDenoise]      = useState(false)
  const [loading,       setLoading]      = useState(false)
  const [progress,      setProgress]     = useState(0)
  const [error,         setError]        = useState('')
  const [results,       setResults]      = useState<ResizeResult[]>([])
  const [showSettings,  setShowSettings] = useState(false)
  const [activeCategory,setActiveCat]   = useState<string>('marketplace')
  const [drag,          setDrag]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── File handling ────────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (f.size > 20 * 1024 * 1024) { setError('Maks 20MB'); return }
    if (!f.type.startsWith('image/')) { setError('Hanya file gambar yang didukung'); return }
    setFile(f); setError(''); setResults([])
    const url = URL.createObjectURL(f)
    setPreview(url)
    const img = new window.Image()
    img.onload = () => setInputDims({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  // ── Preset toggle ─────────────────────────────────────────────
  const togglePreset = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const selectAll = (ids: string[]) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      ids.forEach(id => n.add(id))
      return n
    })
  }

  const clearAll = () => setSelectedIds(new Set())

  // ── Process ───────────────────────────────────────────────────
  const process = async () => {
    if (!file) { setError('Upload gambar dulu'); return }
    if (selectedIds.size === 0) { setError('Pilih minimal 1 preset'); return }
    setLoading(true); setError(''); setResults([]); setProgress(10)

    const prog = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 600)

    try {
      const fd = new FormData()
      fd.append('image',        file)
      fd.append('presets',      JSON.stringify([...selectedIds]))
      fd.append('padding',      padding)
      fd.append('paddingColor', paddingColor)
      fd.append('quality',      quality)
      fd.append('format',       format)
      fd.append('sharpen',      String(sharpen))
      fd.append('denoise',      String(denoise))

      const res = await fetch('/api/tools/resize-smart', { method:'POST', body: fd })
      clearInterval(prog); setProgress(95)

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message ?? `Error ${res.status}`)
      }

      const data = await res.json()
      setResults(data.results ?? [])
      setProgress(100)
    } catch (e: any) {
      setError(e.message ?? 'Gagal memproses. Coba lagi.')
      setProgress(0)
    } finally {
      clearInterval(prog); setLoading(false)
    }
  }

  // ── Download single ───────────────────────────────────────────
  const downloadOne = (r: ResizeResult) => {
    if (!r.dataUrl) return
    const a = document.createElement('a')
    a.href     = r.dataUrl
    a.download = r.filename ?? `beesell-${r.presetId}.${r.format ?? 'jpg'}`
    a.click()
  }

  // ── Download all as zip (simple multi-download fallback) ──────
  const downloadAll = async () => {
    const ok = results.filter(r => r.dataUrl && !r.error)
    if (ok.length === 0) return

    // Simple: download sequentially with delay
    for (let i = 0; i < ok.length; i++) {
      setTimeout(() => downloadOne(ok[i]), i * 400)
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setInputDims(null)
    setResults([]); setError(''); setProgress(0)
  }

  const successResults = results.filter(r => r.dataUrl && !r.error)
  const errorResults   = results.filter(r => r.error)
  const catPresets     = PRESETS.filter(p => p.category === activeCategory)

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
        <Link href="/quick-tools" style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:C.s500, textDecoration:'none' }}>
          <ArrowLeft size={13}/> Quick Tools
        </Link>
        <span style={{ color:C.s300 }}>/</span>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:'linear-gradient(135deg,#059669,#0D9488)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📐</div>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:700, color:C.s900, lineHeight:1 }}>Resize Smart AI</h1>
            <p style={{ fontSize:'11px', color:C.s500, marginTop:'2px' }}>1 foto → semua ukuran platform otomatis</p>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:'18px', alignItems:'flex-start' }}>

        {/* ── LEFT PANEL: Upload + Config ─────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => !loading && fileRef.current?.click()}
            style={{ borderRadius:'14px', border:`2px dashed ${drag?C.brand:preview?C.s200:C.s200}`, background:drag?C.b50:C.s50, cursor:loading?'default':'pointer', overflow:'hidden', transition:'all .15s', position:'relative', minHeight:'140px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {preview ? (
              <div style={{ position:'relative', width:'100%' }}>
                <img src={preview} alt="" style={{ width:'100%', height:'180px', objectFit:'contain', background:'#000', display:'block' }}/>
                <button onClick={e => { e.stopPropagation(); reset() }}
                  style={{ position:'absolute', top:'8px', right:'8px', width:'26px', height:'26px', borderRadius:'50%', border:'none', background:'rgba(0,0,0,.6)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={12}/>
                </button>
                {inputDims && (
                  <div style={{ position:'absolute', bottom:'8px', left:'8px', padding:'3px 8px', borderRadius:'5px', background:'rgba(0,0,0,.6)', fontSize:'10px', color:'#fff', fontWeight:600 }}>
                    {inputDims.w}×{inputDims.h}px · {(file!.size/1024).toFixed(0)}KB
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'24px' }}>
                <div style={{ fontSize:'36px', marginBottom:'8px' }}>📸</div>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.s700, marginBottom:'3px' }}>Drop foto produk di sini</div>
                <div style={{ fontSize:'11px', color:C.s400, marginBottom:'12px' }}>PNG, JPG, WEBP · Maks 20MB</div>
                <span style={{ padding:'7px 16px', borderRadius:'9px', background:C.brand, color:'#fff', fontSize:'12px', fontWeight:700, display:'inline-flex', gap:'5px', alignItems:'center' }}>
                  <Upload size={12}/> Pilih Gambar
                </span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
          </div>

          {/* Preset selector */}
          <div style={{ background:C.w, borderRadius:'14px', border:`1px solid ${C.s200}`, overflow:'hidden' }}>
            {/* Category tabs */}
            <div style={{ display:'flex', borderBottom:`1px solid ${C.s100}`, background:C.s50 }}>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setActiveCat(k)}
                  style={{ flex:1, padding:'9px 4px', border:'none', background:'none', cursor:'pointer', fontSize:'11px', fontWeight:activeCategory===k?700:500, color:activeCategory===k?v.color:C.s500, borderBottom:`2px solid ${activeCategory===k?v.color:'transparent'}`, transition:'all .12s' }}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>

            {/* Quick select */}
            <div style={{ padding:'8px 10px', borderBottom:`1px solid ${C.s100}`, display:'flex', gap:'5px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'10px', color:C.s400, fontWeight:600 }}>Pilih:</span>
              <button type="button" onClick={() => selectAll(catPresets.map(p=>p.id))}
                style={{ padding:'3px 8px', borderRadius:'6px', border:`1px solid ${C.s200}`, background:C.w, fontSize:'10px', fontWeight:600, color:C.s600, cursor:'pointer' }}>
                Semua {CATEGORIES[activeCategory as keyof typeof CATEGORIES].label}
              </button>
              <button type="button" onClick={() => selectAll(POPULAR_PRESETS)}
                style={{ padding:'3px 8px', borderRadius:'6px', border:`1px solid ${C.brand}`, background:C.b50, fontSize:'10px', fontWeight:600, color:C.brand, cursor:'pointer' }}>
                ⭐ Populer
              </button>
              <button type="button" onClick={clearAll}
                style={{ padding:'3px 8px', borderRadius:'6px', border:`1px solid ${C.s200}`, background:C.w, fontSize:'10px', fontWeight:600, color:C.s500, cursor:'pointer' }}>
                Reset
              </button>
              <span style={{ marginLeft:'auto', fontSize:'10px', fontWeight:700, color:selectedIds.size>0?C.brand:C.s400 }}>
                {selectedIds.size} dipilih
              </span>
            </div>

            {/* Preset list */}
            <div style={{ padding:'8px 10px', maxHeight:'260px', overflowY:'auto', display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {catPresets.map(p => (
                <PresetChip key={p.id} p={p} selected={selectedIds.has(p.id)} onClick={() => togglePreset(p.id)}/>
              ))}
            </div>
          </div>

          {/* Settings panel (collapsible) */}
          <div style={{ background:C.w, borderRadius:'14px', border:`1px solid ${C.s200}` }}>
            <button type="button" onClick={() => setShowSettings(p => !p)}
              style={{ width:'100%', padding:'11px 14px', border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'12px', fontWeight:700, color:C.s700 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                <Settings2 size={13} color={C.s500}/> Pengaturan Resize
              </div>
              {showSettings ? <ChevronUp size={13} color={C.s400}/> : <ChevronDown size={13} color={C.s400}/>}
            </button>

            {showSettings && (
              <div style={{ padding:'0 14px 14px', display:'flex', flexDirection:'column', gap:'12px', borderTop:`1px solid ${C.s100}`, paddingTop:'12px' }}>
                {/* Background / Padding mode */}
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.s600, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'6px' }}>
                    Background (untuk format Contain)
                  </label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {([
                      {v:'white',       l:'⬜ Putih'},
                      {v:'black',       l:'⬛ Hitam'},
                      {v:'transparent', l:'◻️ Transparan'},
                      {v:'blur',        l:'🌫️ Blur'},
                      {v:'color',       l:'🎨 Custom'},
                    ] as const).map(o => (
                      <button key={o.v} type="button" onClick={() => setPadding(o.v)}
                        style={{ padding:'5px 10px', borderRadius:'8px', border:`1.5px solid ${padding===o.v?C.brand:C.s200}`, background:padding===o.v?C.b50:C.w, cursor:'pointer', fontSize:'11px', fontWeight:padding===o.v?700:500, color:padding===o.v?C.brand:C.s700, transition:'all .12s' }}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                  {padding === 'color' && (
                    <div style={{ display:'flex', gap:'7px', alignItems:'center', marginTop:'8px' }}>
                      <input type="color" value={paddingColor} onChange={e=>setPaddingColor(e.target.value)}
                        style={{ width:'36px', height:'36px', borderRadius:'7px', border:`1px solid ${C.s200}`, cursor:'pointer', padding:'2px' }}/>
                      <input value={paddingColor} onChange={e=>setPaddingColor(e.target.value)}
                        style={{ flex:1, padding:'8px 11px', borderRadius:'8px', border:`1px solid ${C.s200}`, fontSize:'12px', fontFamily:"'DM Sans',sans-serif", color:C.s900, outline:'none' }}
                        placeholder="#FFFFFF"/>
                    </div>
                  )}
                </div>

                {/* Quality */}
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.s600, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'6px' }}>Kualitas Output</label>
                  <div style={{ display:'flex', gap:'5px' }}>
                    {([
                      {v:'high',     l:'HD',      desc:'File besar'},
                      {v:'balanced', l:'Balanced', desc:'Rekomendasi'},
                      {v:'small',    l:'Ringan',   desc:'File kecil'},
                    ] as const).map(o => (
                      <button key={o.v} type="button" onClick={() => setQuality(o.v)}
                        style={{ flex:1, padding:'7px 4px', borderRadius:'8px', border:`1.5px solid ${quality===o.v?C.purple:C.s200}`, background:quality===o.v?C.p50:C.w, cursor:'pointer', textAlign:'center', transition:'all .12s' }}>
                        <div style={{ fontSize:'11px', fontWeight:quality===o.v?700:500, color:quality===o.v?C.purple:C.s900 }}>{o.l}</div>
                        <div style={{ fontSize:'9px', color:C.s400 }}>{o.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.s600, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'6px' }}>Format Output</label>
                  <div style={{ display:'flex', gap:'5px' }}>
                    {(['jpg','png','webp'] as const).map(f => (
                      <button key={f} type="button" onClick={() => setFormat(f)}
                        style={{ flex:1, padding:'7px', borderRadius:'8px', border:`1.5px solid ${format===f?C.amber:C.s200}`, background:format===f?C.a50:C.w, cursor:'pointer', fontSize:'11px', fontWeight:format===f?700:500, color:format===f?C.amber:C.s700, textTransform:'uppercase', transition:'all .12s' }}>
                        .{f}
                      </button>
                    ))}
                  </div>
                  {format === 'png' && (
                    <div style={{ fontSize:'10px', color:C.s400, marginTop:'5px' }}>PNG mendukung background transparan</div>
                  )}
                </div>

                {/* Enhancement toggles */}
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.s600, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'6px' }}>Penyempurnaan AI</label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    {[
                      { v:sharpen, set:setSharpen, l:'✨ Sharpen', desc:'Perjelas detail' },
                      { v:denoise, set:setDenoise, l:'🌫️ Denoise', desc:'Kurangi noise' },
                    ].map((o, i) => (
                      <button key={i} type="button" onClick={() => o.set(p => !p)}
                        style={{ flex:1, padding:'8px', borderRadius:'9px', border:`1.5px solid ${o.v?C.green:C.s200}`, background:o.v?C.g50:C.w, cursor:'pointer', textAlign:'center', transition:'all .12s' }}>
                        <div style={{ fontSize:'11px', fontWeight:o.v?700:500, color:o.v?C.green:C.s700 }}>{o.l}</div>
                        <div style={{ fontSize:'9px', color:C.s400 }}>{o.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'10px 13px', background:C.r50, border:`1px solid #FECACA`, borderRadius:'10px', fontSize:'12px', color:C.red, display:'flex', gap:'7px', alignItems:'flex-start' }}>
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>{error}
            </div>
          )}

          {/* Process button */}
          <button type="button" onClick={process} disabled={!file || loading || selectedIds.size===0}
            style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none', fontSize:'14px', fontWeight:700, cursor:!file||loading||selectedIds.size===0?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all .15s',
              background: !file||loading||selectedIds.size===0 ? C.s200 : 'linear-gradient(135deg,#059669,#0D9488)',
              color: !file||loading||selectedIds.size===0 ? C.s400 : '#fff',
              boxShadow: !file||loading||selectedIds.size===0 ? 'none' : '0 5px 18px rgba(5,150,105,.3)',
            }}>
            {loading
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Memproses {selectedIds.size} preset...</>
              : <><Zap size={15}/> Resize {selectedIds.size} Platform Sekaligus</>
            }
          </button>

          {/* Progress bar */}
          {loading && (
            <div>
              <div style={{ height:'5px', borderRadius:'3px', background:C.s100, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#059669,#0D9488)', borderRadius:'3px', transition:'width .5s ease' }}/>
              </div>
              <div style={{ fontSize:'10px', color:C.s400, textAlign:'center', marginTop:'4px' }}>
                AI sedang resize {selectedIds.size} preset secara bersamaan...
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Results ────────────────────────── */}
        <div>

          {/* Result header + actions */}
          {results.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'8px' }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:700, color:C.s900 }}>
                  Hasil — {successResults.length} preset berhasil
                  {errorResults.length > 0 && <span style={{ color:C.red, marginLeft:'6px' }}>· {errorResults.length} gagal</span>}
                </div>
                <div style={{ fontSize:'11px', color:C.s400, marginTop:'2px' }}>
                  Klik gambar untuk zoom · Klik Save untuk download
                </div>
              </div>
              {successResults.length > 0 && (
                <button type="button" onClick={downloadAll}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 16px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(37,99,235,.25)', fontFamily:"'DM Sans',sans-serif" }}>
                  <Download size={13}/> Download Semua ({successResults.length})
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {results.length === 0 && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'400px', textAlign:'center' }}>
              <div style={{ fontSize:'56px', marginBottom:'16px' }}>📐</div>
              <div style={{ fontSize:'16px', fontWeight:700, color:C.s900, marginBottom:'6px' }}>Resize Smart AI</div>
              <div style={{ fontSize:'13px', color:C.s500, lineHeight:1.6, maxWidth:'340px', marginBottom:'20px' }}>
                Upload foto produk, pilih preset platform, lalu klik Resize.<br/>
                1 foto jadi semua ukuran yang dibutuhkan — otomatis!
              </div>
              {/* Platform preview grid */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', maxWidth:'440px' }}>
                {['🛍️ Shopee','🛒 Tokopedia','📸 Instagram','🎵 TikTok','💬 WhatsApp','▶️ YouTube','📌 Pinterest','👥 Facebook'].map(p => (
                  <div key={p} style={{ padding:'5px 12px', borderRadius:'99px', background:C.s100, fontSize:'11px', color:C.s600, fontWeight:500 }}>{p}</div>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'400px', gap:'16px' }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'50%', border:'4px solid #E2E8F0', borderTop:`4px solid ${C.green}`, animation:'spin 1s linear infinite' }}/>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>📐</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:C.s900, marginBottom:'4px' }}>Resizing {selectedIds.size} platform...</div>
                <div style={{ fontSize:'12px', color:C.s400 }}>AI Smart Crop & Padding aktif</div>
              </div>
            </div>
          )}

          {/* Result grid */}
          {!loading && results.length > 0 && (
            <>
              {/* Group by category */}
              {(['marketplace','social','ads'] as const).map(cat => {
                const catResults = results.filter(r => {
                  const preset = PRESETS.find(p => p.id === r.presetId)
                  return preset?.category === cat
                })
                if (catResults.length === 0) return null
                return (
                  <div key={cat} style={{ marginBottom:'20px' }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:C.s500, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px', display:'flex', alignItems:'center', gap:'5px' }}>
                      {CATEGORIES[cat].icon} {CATEGORIES[cat].label}
                      <span style={{ fontSize:'10px', color:C.s400, fontWeight:400 }}>({catResults.length} preset)</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px,1fr))', gap:'8px' }}>
                      {catResults.map(r => (
                        <ResultCard key={r.presetId} r={r} onDownload={downloadOne}/>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:#F1F5F9 }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:2px }
        @media (max-width:860px) {
          div[style*="grid-template-columns:360px"] { grid-template-columns:1fr !important }
        }
      `}</style>
    </div>
  )
}