'use client'
// app/(dashboard)/quick-tools/page.tsx — Visual AI Quick Tools v2
// Remove Background · AI Upscale · Resize · AI Relight · Remove Object

import { useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Upload, Download, RefreshCw, AlertCircle, Check,
  X, Loader2, Zap, ChevronRight, SplitSquareHorizontal,
} from 'lucide-react'

const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  pink:'#DB2777', pnk50:'#FDF2F8',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569', slate500:'#64748B',
  slate400:'#94A3B8', slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#fff',
  slate300:'#CBD5E1'
}
type ToolOptionItem = {
  v: string
  l: string
  desc?: string
}

type ToolOptions = {
  label: string
  key: string
  items: ToolOptionItem[]
}

type ToolItem = {
  id: string
  icon: string
  label: string
  desc: string
  shortDesc?: string

  color: string
  bg: string

  badge?: string | null
  badgeBg?: string | null

  endpoint: string
  outputFormat: string

  tips: readonly string[]

  hasOptions: boolean

  options?: ToolOptions
}

// ── Tool definitions ──────────────────────────────────────────
const TOOLS: ToolItem[] = [
  {
    id: 'remove-bg', icon: '🪄', label: 'Remove Background',
    desc: 'Hapus background produk otomatis dalam 1 detik',
    shortDesc: 'Background otomatis',
    color: C.brand, bg: C.brand50, badge: 'Populer', badgeBg: C.brand,
    endpoint: '/api/tools/remove-bg', outputFormat: 'PNG transparan',
    tips: [
      'Foto produk dengan latar polos menghasilkan output terbaik',
      'Format PNG output mendukung background transparan',
      'Cocok untuk marketplace: Shopee, Tokopedia, Lazada',
    ],
    hasOptions: true,
    options: {
      label: 'Background Output',
      key:   'option',
      items: [
        { v:'transparent', l:'⬜ Transparan (PNG)', desc:'Background dihapus total' },
        { v:'white',       l:'⬜ Putih Solid',      desc:'Background putih bersih' },
        { v:'black',       l:'⬛ Hitam Solid',      desc:'Background hitam elegan' },
      ],
    },
  },
  {
    id: 'upscale', icon: '🔍', label: 'AI Upscale',
    desc: 'Tingkatkan resolusi foto produk jadi HD & 4K tanpa blur',
    shortDesc: 'HD & 4K',
    color: C.purple, bg: C.pur50, badge: 'AI Powered', badgeBg: C.purple,
    endpoint: '/api/tools/upscale', outputFormat: 'HD / 4K Image',
    tips: [
      'Foto 500×500px dengan 4× → jadi 2000×2000px (4K quality)',
      'Proses 2× butuh ~10 detik · 4× butuh ~30 detik',
      'Terbaik untuk foto produk dari HP low-res atau screenshot',
      'Hasil bebas noise dan artefak — AI menambah detail asli',
    ],
    hasOptions: true,
    options: {
      label: 'Skala Peningkatan',
      key:   'option',
      items: [
        { v:'2', l:'2× Upscale — HD',   desc:'2x resolusi · ~10 detik · cocok untuk produk standar' },
        { v:'4', l:'4× Upscale — 4K',   desc:'4x resolusi · ~30 detik · kualitas premium & tajam' },
      ],
    },
  },
  {
    id: 'resize', icon: '📐', label: 'Resize Image',
    desc: 'Ubah ukuran gambar untuk marketplace & sosial media',
    shortDesc: 'Siap marketplace',
    color: C.green, bg: C.grn50, badge: null, badgeBg: null,
    endpoint: '/api/tools/resize', outputFormat: 'JPG siap upload',
    tips: [
      'Pilih preset platform — ukuran otomatis sesuai standar',
      'Aspect ratio dipertahankan — tidak ada distorsi',
    ],
    hasOptions: true,
    options: {
      label: 'Preset Platform',
      key:   'option',
      items: [
        { v:'shopee',         l:'🛍️ Shopee Produk',         desc:'800×800px' },
        { v:'tokopedia',      l:'🛒 Tokopedia Produk',       desc:'700×700px' },
        { v:'lazada',         l:'📦 Lazada Produk',          desc:'800×800px' },
        { v:'instagram-sq',   l:'📸 Instagram Square',       desc:'1080×1080px' },
        { v:'instagram-port', l:'📸 Instagram Portrait',     desc:'1080×1350px' },
        { v:'tiktok',         l:'🎵 TikTok / Reels',         desc:'1080×1920px' },
        { v:'whatsapp',       l:'💬 WhatsApp Catalog',       desc:'800×800px' },
        { v:'facebook',       l:'👥 Facebook Post',          desc:'1200×630px' },
        { v:'youtube-thumb',  l:'▶️  YouTube Thumbnail',     desc:'1280×720px' },
      ],
    },
  },
  {
    id: 'relight', icon: '💡', label: 'AI Relight',
    desc: 'Perbaiki pencahayaan foto produk dengan AI',
    shortDesc: 'Cahaya lebih bagus',
    color: C.amber, bg: C.amb50, badge: 'Beta', badgeBg: C.amber,
    endpoint: '/api/tools/relight', outputFormat: 'Pencahayaan optimal',
    tips: [
      'Terbaik untuk foto indoor dengan pencahayaan tidak merata',
      'Mood Studio = cahaya putih bersih seperti studio foto',
    ],
    hasOptions: true,
    options: {
      label: 'Mood Pencahayaan',
      key:   'option',
      items: [
        { v:'studio',   l:'🏢 Studio',   desc:'Putih bersih, profesional' },
        { v:'natural',  l:'🌿 Natural',  desc:'Hangat, alami, nyaman' },
        { v:'golden',   l:'✨ Golden',   desc:'Dramatis, premium, mewah' },
        { v:'dramatic', l:'🌙 Dramatic', desc:'Kontras tinggi, bold' },
      ],
    },
  },
  {
    id: 'remove-object', icon: '✏️', label: 'Remove Object',
    desc: 'Hapus objek mengganggu dari foto produk dengan AI',
    shortDesc: 'Hapus objek',
    color: C.pink, bg: C.pnk50, badge: 'AI Magic', badgeBg: C.pink,
    endpoint: '/api/tools/remove-object', outputFormat: 'Objek terhapus',
    tips: [
      'Upload foto produk — AI otomatis deteksi objek mengganggu',
      'Terbaik untuk hapus watermark, tangan, atau latar berantakan',
    ],
    hasOptions: false,
  },
]

type ToolId = typeof TOOLS[number]['id']
type ToolDef = ToolItem

// ── Upload Zone ───────────────────────────────────────────────
function DropZone({ onFile, preview, disabled }: {
  onFile:   (f: File) => void
  preview:  string | null
  disabled: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) onFile(f)
  }, [onFile])

  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      style={{
        width: '100%', aspectRatio: '1/1', maxHeight: '320px',
        borderRadius: '16px', overflow: 'hidden', cursor: disabled ? 'default' : 'pointer',
        border: `2px dashed ${drag ? C.brand : C.slate200}`,
        background: drag ? C.brand50 : preview ? '#000' : C.slate50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', transition: 'all .15s',
      }}
    >
      {preview
        ? <img src={preview} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
        : (
          <div style={{ textAlign:'center', padding:'24px' }}>
            <div style={{ fontSize:'40px', marginBottom:'10px' }}>📸</div>
            <div style={{ fontSize:'14px', fontWeight:700, color:C.slate700, marginBottom:'4px' }}>Drop foto di sini</div>
            <div style={{ fontSize:'12px', color:C.slate400, marginBottom:'14px' }}>atau klik untuk pilih gambar</div>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'8px 18px', borderRadius:'10px', background:C.brand, color:'#fff', fontSize:'12px', fontWeight:700 }}>
              <Upload size={13}/> Pilih Gambar
            </span>
            <div style={{ fontSize:'10px', color:C.slate400, marginTop:'10px' }}>PNG, JPG, WEBP · Maks 10MB</div>
          </div>
        )
      }
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}/>
    </div>
  )
}

// ── Result Image ──────────────────────────────────────────────
function ResultImage({ result, label, isTransparent }: {
  result:        string
  label:         string
  isTransparent: boolean
}) {
  const [zoomed, setZoomed] = useState(false)
  return (
    <>
      <div
        style={{
          width:'100%', aspectRatio:'1/1', maxHeight:'320px',
          borderRadius:'16px', overflow:'hidden', cursor:'zoom-in', position:'relative',
          // Checkerboard for transparent PNG
          background: isTransparent
            ? 'repeating-conic-gradient(#E2E8F0 0% 25%, #fff 0% 50%) 0 0 / 20px 20px'
            : '#000',
        }}
        onClick={() => setZoomed(true)}
      >
        <img src={result} alt="Result" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
        <div style={{ position:'absolute', bottom:'8px', left:'8px', padding:'3px 9px', borderRadius:'6px', background:'rgba(0,0,0,.55)', fontSize:'10px', color:'#fff', fontWeight:600, backdropFilter:'blur(4px)' }}>
          {label} · Klik zoom
        </div>
      </div>
      {zoomed && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
          onClick={() => setZoomed(false)}>
          <img src={result} alt="" style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:'12px',
            background: isTransparent ? 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 0 0 / 24px 24px' : undefined }}/>
          <button onClick={e => { e.stopPropagation(); setZoomed(false) }}
            style={{ position:'absolute', top:'16px', right:'16px', width:'38px', height:'38px', borderRadius:'50%', border:'none', background:'rgba(255,255,255,.2)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={17}/>
          </button>
        </div>
      )}
    </>
  )
}

// ── MAIN CONTENT ──────────────────────────────────────────────
function QuickToolsContent() {
  const searchParams = useSearchParams()
  const defaultTool  = (searchParams.get('tool') ?? 'remove-bg') as ToolId

  const [activeId,  setActiveId]  = useState<ToolId>(defaultTool)
  const [file,      setFile]      = useState<File | null>(null)
  const [previewSrc,setPreviewSrc]= useState<string | null>(null)
  const [resultSrc, setResultSrc] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [option,    setOption]    = useState<string>('')
  const [dragging,  setDragging]  = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [showBefore,setShowBefore]= useState(false) // before/after toggle
  const [upscaleMeta, setUpscaleMeta] = useState<{scale:number;inputKB:number;outputKB:number;timeSec:string}|null>(null)
  const [inputDims, setInputDims]     = useState<{w:number;h:number}|null>(null)

  const tool = TOOLS.find(t => t.id === activeId)! as ToolDef

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) { setError('File terlalu besar. Maks 10MB.'); return }
    setFile(f)
    const objUrl = URL.createObjectURL(f)
    setPreviewSrc(objUrl)
    setResultSrc(null); setError(''); setProgress(0); setShowBefore(false); setUpscaleMeta(null); setInputDims(null)
    // Read image dimensions
    const img = new window.Image()
    img.onload = () => setInputDims({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = objUrl
    const t = TOOLS.find(x => x.id === activeId)!
    setOption(t.hasOptions ? (t as any).options.items[0].v : '')
  }, [activeId])

  const switchTool = (id: ToolId) => {
    setActiveId(id); setFile(null); setPreviewSrc(null); setResultSrc(null)
    setError(''); setProgress(0); setShowBefore(false)
    const t = TOOLS.find(x => x.id === id)!
    setOption(t.hasOptions ? (t as any).options.items[0].v : '')
  }

  const process = async () => {
    if (!file) { setError('Upload gambar dulu ya!'); return }
    setLoading(true); setError(''); setResultSrc(null); setProgress(10); setShowBefore(false)

    try {
      const fd = new FormData()
      fd.append('image', file)
      if (option) fd.append('option', option)

      const progInterval = setInterval(() => setProgress(p => p < 80 ? p + 10 : p), 700)
      const res = await fetch(tool.endpoint, { method:'POST', body: fd })
      clearInterval(progInterval); setProgress(92)

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message ?? j.error ?? `Error ${res.status}`)
      }

      const ct = res.headers.get('content-type') ?? ''
      let blobUrl: string

      if (ct.startsWith('image/') || ct.includes('octet-stream')) {
        const blob = await res.blob()
        blobUrl = URL.createObjectURL(blob)
      } else {
        const j = await res.json()
        blobUrl = j.url ?? j.imageUrl ?? j.output
        if (!blobUrl) throw new Error('Tidak ada hasil dari server.')
      }

      setResultSrc(blobUrl); setProgress(100)
      // Capture upscale metadata from response headers
      if (activeId === 'upscale') {
        const sc = parseInt(res.headers.get('X-Scale') ?? '0')
        const ik = parseInt(res.headers.get('X-Input-Size-KB') ?? '0')
        const ok = parseInt(res.headers.get('X-Output-Size-KB') ?? '0')
        const ts = res.headers.get('X-Process-Time-Sec') ?? ''
        if (sc) setUpscaleMeta({ scale: sc, inputKB: ik, outputKB: ok, timeSec: ts })
      }
    } catch (e: any) {
      setError(e.message ?? 'Gagal memproses. Coba lagi.')
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!resultSrc) return
    const a = document.createElement('a')
    a.href     = resultSrc
    const isRemoveBg  = activeId === 'remove-bg'
    const optionLabel = option ? `-${option}` : ''
    a.download = `beesell-${activeId}${optionLabel}-${Date.now()}.${isRemoveBg ? 'png' : 'jpg'}`
    a.click()
  }

  const reset = () => {
    setFile(null); setPreviewSrc(null); setResultSrc(null); setError(''); setProgress(0); setShowBefore(false); setUpscaleMeta(null); setInputDims(null)
  }

  const isTransparent = activeId === 'remove-bg' && option === 'transparent'

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'4px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={16} color="#fff"/>
          </div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:C.slate900 }}>Quick Tools</h1>
          <span style={{ padding:'3px 9px', borderRadius:'20px', background:'linear-gradient(135deg,#FEF3C7,#FDE68A)', border:'1px solid #FCD34D', fontSize:'11px', fontWeight:700, color:C.amber }}>
            ⚡ Visual AI
          </span>
        </div>
        <p style={{ fontSize:'13px', color:C.slate500 }}>Edit foto produk dengan AI — cepat, sekali klik, siap upload marketplace</p>
      </div>

      {/* ── Tool Selector ──────────────────────────────────── */}
      <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'10px', marginBottom:'20px', scrollbarWidth:'none' }}>
        {TOOLS.map((t: ToolItem) => {
          const active = activeId === t.id
          return (
            <button key={t.id} type="button" onClick={() => switchTool(t.id as ToolId)}
              style={{
                display:'flex', flexDirection:'column', gap:'5px',
                padding:'12px 14px', borderRadius:'14px', flexShrink:0, minWidth:'155px',
                border:`2px solid ${active ? t.color : C.slate200}`,
                background: active ? `${t.color}0d` : C.white,
                cursor:'pointer', textAlign:'left', position:'relative',
                boxShadow: active ? `0 4px 16px ${t.color}25` : 'none',
                transition:'all .14s',
              }}>
              {t.badge && (
                <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background:t.badgeBg || t.color, color:'#fff' }}>
                  {t.badge}
                </div>
              )}
              <span style={{ fontSize:'22px' }}>{t.icon}</span>
              <span style={{ fontSize:'12px', fontWeight:700, color:active ? t.color : C.slate900 }}>{t.label}</span>
              <span style={{ fontSize:'10px', color:C.slate400, lineHeight:1.4 }}>{t.shortDesc}</span>
            </button>
          )
        })}
      </div>

      {/* ── Workspace Grid ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }}>

        {/* LEFT: Upload + Options ──────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Tool description bar */}
          <div style={{ padding:'12px 14px', borderRadius:'12px', background:`${tool.color}0d`, border:`1.5px solid ${tool.color}25` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
              <span style={{ fontSize:'18px' }}>{tool.icon}</span>
              <span style={{ fontSize:'14px', fontWeight:700, color:tool.color }}>{tool.label}</span>
            </div>
            <p style={{ fontSize:'12px', color:C.slate500, margin:0 }}>{tool.desc}</p>
          </div>

          {/* Upload zone */}
          <DropZone onFile={handleFile} preview={previewSrc} disabled={loading}/>

          {/* File info */}
          {file && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', background:C.slate50, borderRadius:'8px', border:`1px solid ${C.slate200}` }}>
              <span style={{ fontSize:'11px', color:C.slate600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{file.name}</span>
              <span style={{ fontSize:'11px', color:C.slate400, marginLeft:'8px', flexShrink:0 }}>{(file.size/1024/1024).toFixed(1)} MB</span>
              <button onClick={reset} style={{ background:'none', border:'none', cursor:'pointer', color:C.slate400, marginLeft:'6px', padding:0, display:'flex' }}>
                <X size={13}/>
              </button>
            </div>
          )}

          {/* Options */}
          {tool.hasOptions && (tool as any).options && (
            <div>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.slate600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'7px' }}>
                {(tool as any).options.label}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {(tool as any).options.items.map((opt: any) => (
                  <button key={opt.v} type="button" onClick={() => setOption(opt.v)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 13px', borderRadius:'10px', border:`1.5px solid ${option===opt.v ? tool.color : C.slate200}`, background:option===opt.v ? tool.bg : C.white, cursor:'pointer', transition:'all .12s', textAlign:'left' }}>
                    <div>
                      <div style={{ fontSize:'12px', fontWeight:option===opt.v?700:500, color:option===opt.v?tool.color:C.slate900 }}>{opt.l}</div>
                      {opt.desc && <div style={{ fontSize:'10px', color:C.slate400 }}>{opt.desc}</div>}
                    </div>
                    {option===opt.v && <Check size={13} color={tool.color}/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upscale info card — tampil saat tool upscale aktif dan ada file */}
          {activeId === 'upscale' && file && inputDims && (
            <div style={{ padding:'12px 14px', background:'linear-gradient(135deg,#F5F3FF,#EFF6FF)', border:`1.5px solid ${C.purple}30`, borderRadius:'12px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.purple, marginBottom:'8px', display:'flex', alignItems:'center', gap:'5px' }}>
                🔍 Estimasi Resolusi Output
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'8px', alignItems:'center' }}>
                {/* Input */}
                <div style={{ padding:'8px', borderRadius:'8px', background:C.white, border:`1px solid ${C.slate200}`, textAlign:'center' }}>
                  <div style={{ fontSize:'9px', color:C.slate400, marginBottom:'3px', fontWeight:600 }}>INPUT</div>
                  <div style={{ fontSize:'13px', fontWeight:800, color:C.slate900 }}>{inputDims.w}<span style={{ color:C.slate400, fontWeight:400 }}>×</span>{inputDims.h}</div>
                  <div style={{ fontSize:'9px', color:C.slate500, marginTop:'1px' }}>{(file.size/1024).toFixed(0)} KB</div>
                </div>
                {/* Arrow */}
                <div style={{ textAlign:'center', color:C.purple, fontWeight:700, fontSize:'16px' }}>→</div>
                {/* Output */}
                <div style={{ padding:'8px', borderRadius:'8px', background:C.pur50, border:`1.5px solid ${C.purple}40`, textAlign:'center' }}>
                  <div style={{ fontSize:'9px', color:C.purple, marginBottom:'3px', fontWeight:700 }}>OUTPUT {option}×</div>
                  <div style={{ fontSize:'13px', fontWeight:800, color:C.purple }}>
                    {inputDims.w * parseInt(option || '4')}<span style={{ color:C.purple, opacity:.6, fontWeight:400 }}>×</span>{inputDims.h * parseInt(option || '4')}
                  </div>
                  <div style={{ fontSize:'9px', color:C.purple, marginTop:'1px', opacity:.8 }}>
                    {option === '4' ? '4K Quality' : 'HD Quality'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop:'8px', fontSize:'10px', color:C.slate500, textAlign:'center' }}>
                ⏱️ Estimasi proses: {option === '4' ? '20-40 detik' : '8-15 detik'}
              </div>
            </div>
          )}

          {/* Upscale result stats — tampil setelah selesai */}
          {activeId === 'upscale' && upscaleMeta && (
            <div style={{ padding:'10px 13px', background:C.grn50, border:`1px solid #BBF7D0`, borderRadius:'10px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.green, marginBottom:'6px', display:'flex', alignItems:'center', gap:'5px' }}>
                <Check size={12}/> Upscale berhasil!
              </div>
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'11px', color:C.slate600 }}>
                  Skala: <b style={{ color:C.slate900 }}>{upscaleMeta.scale}×</b>
                </span>
                <span style={{ fontSize:'11px', color:C.slate600 }}>
                  Ukuran: <b style={{ color:C.slate900 }}>{upscaleMeta.inputKB}KB → {upscaleMeta.outputKB}KB</b>
                </span>
                <span style={{ fontSize:'11px', color:C.slate600 }}>
                  Waktu: <b style={{ color:C.slate900 }}>{upscaleMeta.timeSec}s</b>
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding:'10px 13px', background:C.red50, border:`1px solid #FECACA`, borderRadius:'10px', fontSize:'12px', color:C.red, display:'flex', gap:'7px', alignItems:'flex-start' }}>
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>{error}
            </div>
          )}

          {/* CTA button */}
          <button onClick={process} disabled={!file || loading}
            style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none', fontSize:'14px', fontWeight:700, cursor:!file||loading?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all .15s',
              background: !file||loading ? C.slate200 : `linear-gradient(135deg, ${tool.color}, ${tool.color}cc)`,
              color: !file||loading ? C.slate400 : '#fff',
              boxShadow: !file||loading ? 'none' : `0 5px 18px ${tool.color}35`,
            }}>
            {loading
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Memproses...</>
              : activeId === 'upscale'
                  ? <><span style={{fontSize:'15px'}}>🔍</span> Upscale {option}× {option==='4'?'(4K)':'(HD)'}</>
                  : <><Zap size={15}/> Proses Sekarang</>
            }
          </button>

          {/* Progress */}
          {loading && (
            <div>
              <div style={{ height:'4px', borderRadius:'2px', background:C.slate100, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, borderRadius:'2px', transition:'width .5s ease', background:`linear-gradient(90deg, ${tool.color}, ${tool.color}80)` }}/>
              </div>
              <div style={{ fontSize:'10px', color:C.slate400, textAlign:'center', marginTop:'4px' }}>
                {activeId === 'upscale'
                  ? `🔍 AI sedang upscale ${option}×... estimasi ${option==='4'?'20-40':'8-15'} detik`
                  : 'AI sedang memproses gambar...'
                }
              </div>
            </div>
          )}

          {/* Tips */}
          <div style={{ padding:'10px 13px', background:C.slate50, borderRadius:'10px', border:`1px solid ${C.slate200}` }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:C.slate500, marginBottom:'6px' }}>💡 Tips {tool.label}</div>
            {tool.tips.map((tip, i) => (
              <div key={i} style={{ fontSize:'11px', color:C.slate600, display:'flex', gap:'5px', marginBottom: i < tool.tips.length-1 ? '4px' : 0 }}>
                <span style={{ color:tool.color, fontWeight:700, flexShrink:0 }}>{i+1}.</span>{tip}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Result ───────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Result header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.06em' }}>Hasil</div>
            {resultSrc && previewSrc && (
              <button onClick={() => setShowBefore(p => !p)}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:showBefore?C.slate100:C.white, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
                <SplitSquareHorizontal size={12}/> {showBefore ? 'Tampilkan Hasil' : 'Tampilkan Asli'}
              </button>
            )}
          </div>

          {/* Result / placeholder */}
          {resultSrc && !showBefore ? (
            <ResultImage
              result={resultSrc}
              label={activeId === 'upscale' && upscaleMeta ? `${upscaleMeta.scale}× Upscale — ${upscaleMeta.scale === 4 ? '4K' : 'HD'}` : tool.outputFormat}
              isTransparent={isTransparent}
            />
          ) : previewSrc && showBefore ? (
            <div style={{ width:'100%', aspectRatio:'1/1', maxHeight:'320px', borderRadius:'16px', overflow:'hidden', background:'#000', position:'relative' }}>
              <img src={previewSrc} alt="Original" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
              <div style={{ position:'absolute', top:'8px', left:'8px', padding:'3px 9px', borderRadius:'6px', background:'rgba(0,0,0,.55)', fontSize:'10px', color:'#fff', fontWeight:600 }}>Gambar Asli</div>
            </div>
          ) : (
            <div style={{ width:'100%', aspectRatio:'1/1', maxHeight:'320px', borderRadius:'16px', border:`2px dashed ${C.slate200}`, background:C.slate50, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'10px' }}>
              {loading ? (
                <>
                  <div style={{ width:'48px', height:'48px', borderRadius:'50%', border:`3px solid ${tool.color}30`, borderTop:`3px solid ${tool.color}`, animation:'spin 1s linear infinite' }}/>
                  <div style={{ fontSize:'13px', color:C.slate500, fontWeight:600 }}>AI sedang bekerja...</div>
                  <div style={{ fontSize:'11px', color:C.slate400 }}>3-30 detik</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'40px' }}>✨</div>
                  <div style={{ fontSize:'13px', color:C.slate400 }}>Hasil tampil di sini</div>
                </>
              )}
            </div>
          )}

          {/* Download + actions */}
          {resultSrc && (
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={download}
                style={{ flex:1, padding:'11px', borderRadius:'11px', border:'none', background:'linear-gradient(135deg,#059669,#0D9488)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', boxShadow:'0 4px 12px rgba(5,150,105,.25)', fontFamily:"'DM Sans',sans-serif" }}>
                <Download size={14}/> Download
              </button>
              <button onClick={reset}
                style={{ padding:'11px 14px', borderRadius:'11px', border:`1.5px solid ${C.slate200}`, background:C.white, color:C.slate600, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                <RefreshCw size={13}/> Proses Baru
              </button>
            </div>
          )}

          {/* Other tools quick access */}
          {!resultSrc && !loading && (
            <div>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>Tools Lain</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {TOOLS.filter(t => t.id !== activeId).slice(0, 4).map(t => (
                  <button key={t.id} type="button" onClick={() => switchTool(t.id as ToolId)}
                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'10px', border:`1.5px solid ${C.slate200}`, background:C.white, cursor:'pointer', textAlign:'left', transition:'all .12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = t.color; (e.currentTarget as HTMLElement).style.background = t.bg }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200; (e.currentTarget as HTMLElement).style.background = C.white }}
                  >
                    <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>{t.icon}</div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:C.slate900 }}>{t.label}</div>
                      <div style={{ fontSize:'10px', color:C.slate400 }}>{t.shortDesc}</div>
                    </div>
                    <ChevronRight size={13} color={C.slate300}/>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box }
        ::-webkit-scrollbar { display: none }
        @media (max-width: 640px) {
          div[style*="grid-template-columns:1fr 1fr"] { grid-template-columns: 1fr !important }
        }
      `}</style>
    </div>
  )
}

export default function QuickToolsPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'400px', gap:'10px' }}>
        <Loader2 size={22} color="#2563EB" style={{ animation:'spin 1s linear infinite' }}/>
        <span style={{ fontSize:'13px', color:'#64748B', fontFamily:"'DM Sans',sans-serif" }}>Loading...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <QuickToolsContent/>
    </Suspense>
  )
}