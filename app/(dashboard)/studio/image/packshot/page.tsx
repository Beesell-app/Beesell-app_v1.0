'use client'
// app/(dashboard)/studio/image/packshot/page.tsx
// ── AI Packshot Generator — Full Feature Page ─────────────────
// Upload foto produk → pilih preset scene → AI generate foto studio premium

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  Upload, Download, RefreshCw, X, Loader2, Sparkles,
  ChevronRight, ArrowLeft, Check, AlertCircle, Copy,
  RotateCcw, ZoomIn, Share2, BookOpen,
} from 'lucide-react'
import {
  PACKSHOT_PRESETS, CATEGORIES, POPULAR_PRESETS, getPresetsByCategory,
  type PackshotPreset,
} from '@/lib/studio/packshot-presets'

const C = {
  brand:'#2563EB', b50:'#EFF6FF', b100:'#DBEAFE',
  purple:'#7C3AED', p50:'#F5F3FF',
  green:'#059669', g50:'#ECFDF5',
  amber:'#D97706', a50:'#FFFBEB',
  red:'#DC2626', r50:'#FEF2F2',
  pink:'#DB2777', pk50:'#FDF2F8',
  cyan:'#0891B2', c50:'#ECFEFF',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569', slate500:'#64748B',
  slate400:'#94A3B8', slate300:'#CBD5E1', slate200:'#E2E8F0',
  slate100:'#F1F5F9', slate50:'#F8FAFC', w:'#fff',
}

// ── Before/After Slider ───────────────────────────────────────
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos]       = useState(50)
  const [dragging, setDrag] = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)

  const onMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX)
    const onTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX)
    const stop        = () => setDrag(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   stop)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend',  stop)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   stop)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend',  stop)
    }
  }, [dragging, onMove])

  return (
    <div ref={containerRef}
      style={{ position:'relative', width:'100%', aspectRatio:'1/1', borderRadius:'16px', overflow:'hidden', cursor:'col-resize', userSelect:'none' }}
      onMouseDown={() => setDrag(true)}
      onTouchStart={() => setDrag(true)}
    >
      {/* After (full) */}
      <img src={after} alt="After" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', background:'#111' }}/>
      {/* Before (clipped) */}
      <div style={{ position:'absolute', inset:0, clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <img src={before} alt="Before" style={{ width:'100%', height:'100%', objectFit:'contain', background:C.slate100 }}/>
      </div>
      {/* Divider */}
      <div style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, width:'2px', background:'#fff', transform:'translateX(-50%)', boxShadow:'0 0 8px rgba(0,0,0,.5)' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'32px', height:'32px', borderRadius:'50%', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'col-resize' }}>
          <span style={{ fontSize:'14px', color:C.slate700 }}>⇔</span>
        </div>
      </div>
      {/* Labels */}
      <div style={{ position:'absolute', top:'10px', left:'10px', padding:'3px 9px', borderRadius:'6px', background:'rgba(0,0,0,.6)', fontSize:'10px', color:'#fff', fontWeight:700 }}>Sebelum</div>
      <div style={{ position:'absolute', top:'10px', right:'10px', padding:'3px 9px', borderRadius:'6px', background:`rgba(37,99,235,.85)`, fontSize:'10px', color:'#fff', fontWeight:700 }}>Hasil AI ✨</div>
    </div>
  )
}

// ── Preset Card ───────────────────────────────────────────────
function PresetCard({ p, selected, onClick }: {
  p: PackshotPreset; selected: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'10px', borderRadius:'12px', border:`2px solid ${selected ? C.brand : C.slate200}`, background:selected ? C.b50 : C.w, cursor:'pointer', textAlign:'left', transition:'all .13s', position:'relative',
        boxShadow: selected ? `0 4px 14px ${C.brand}25` : 'none' }}>
      {p.popular && !selected && (
        <div style={{ position:'absolute', top:'6px', right:'6px', fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'20px', background:C.amber, color:'#fff' }}>⭐</div>
      )}
      {selected && (
        <div style={{ position:'absolute', top:'6px', right:'6px', width:'16px', height:'16px', borderRadius:'50%', background:C.brand, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Check size={10} color="#fff"/>
        </div>
      )}
      <div style={{ fontSize:'20px', marginBottom:'5px' }}>{p.icon}</div>
      <div style={{ fontSize:'11px', fontWeight:700, color:selected ? C.brand : C.slate900, marginBottom:'2px', lineHeight:1.2 }}>{p.label}</div>
      <div style={{ fontSize:'9px', color:C.slate400, lineHeight:1.4 }}>{p.desc.slice(0,50)}...</div>
    </button>
  )
}

// ── Marketing Assets Tab ──────────────────────────────────────
function MarketingAssets({ preset, imageName }: { preset: PackshotPreset; imageName: string }) {
  const [copiedKey, setCopied] = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState<'caption'|'hook'|'hashtag'>('caption')

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key); setTimeout(() => setCopied(null), 2000)
  }

  const productName = imageName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

  const assets = {
    caption: {
      softSelling: `Foto produkku sekarang keliatan beda banget! ✨\n\nSejak pake AI Packshot BeeSell, foto ${productName} langsung tampil premium kayak brand besar. Padahal cuma upload foto biasa 😅\n\nKalau kamu juga mau foto produknya glow up, coba BeeSell AI yuk! 🔥`,
      hardSelling: `STOP pakai foto produk jelek! 📸\n\n${productName} kamu layak tampil PREMIUM.\n\nDengan BeeSell AI Packshot:\n✅ Background studio profesional\n✅ Pencahayaan perfect\n✅ Siap upload marketplace\n✅ Proses < 30 detik\n\nOrder sekarang sebelum competitor kamu duluan! 🛒`,
      storytelling: `Dulu aku minder banget upload foto produk.\n\nFotonya blur, background berantakan, lighting gelap. Jadinya produkku gak laku-laku 😭\n\nTapi setelah coba AI Packshot di BeeSell... WOW.\n\n${productName} langsung keliatan seperti brand internasional! Penjualan naik 3x dalam seminggu 🚀\n\nMau tau caranya?`,
    },
    hook: {
      scrollStopper: `TUNGGU ⛔ Sebelum kamu scroll...\nFoto produk ini dibuat AI dalam 20 detik 🤯`,
      painPoint: `Kenapa foto produk kamu sepi pembeli?\nJawaban: foto jelek = kepercayaan rendah = no sale 💸`,
      curiosity: `Bagaimana foto ${productName} ini bisa keliatan semahal ini padahal cuma modal HP? 👀`,
      fomo: `1.247 seller sudah pakai ini minggu ini\nKamu kapan? ⏰`,
    },
    hashtag: {
      instagram: `#${productName.replace(/\s+/g,'').toLowerCase()} #fotoroduk #seller #jualan #marketplace #shopee #tokopedia #beesellai #aipackshot #productphotography #fotoestetik #contentcreator #onlineshop #umkm #bisnisonline`,
      tiktok: `#jualan #seller #marketplace #fotoproduk #AI #beesellai #fyp #fypシ #viral #bisnisonline #umkm #tips`,
    },
  }

  const tabs = [
    { key:'caption', label:'Caption', icon:'✍️' },
    { key:'hook',    label:'Hook',    icon:'🎣' },
    { key:'hashtag', label:'Hashtag', icon:'#️⃣' },
  ] as const

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', background:C.slate100, borderRadius:'10px', padding:'3px' }}>
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            style={{ flex:1, padding:'6px', borderRadius:'7px', border:'none', background:activeTab===t.key?C.w:'transparent', fontSize:'11px', fontWeight:activeTab===t.key?700:500, color:activeTab===t.key?C.slate900:C.slate500, cursor:'pointer', transition:'all .12s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Caption tab */}
      {activeTab === 'caption' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {Object.entries(assets.caption).map(([key, text]) => (
            <div key={key} style={{ padding:'11px 13px', background:C.slate50, borderRadius:'10px', border:`1px solid ${C.slate200}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <span style={{ fontSize:'10px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {{ softSelling:'Soft Selling', hardSelling:'Hard Selling', storytelling:'Storytelling' }[key]}
                </span>
                <button onClick={() => copyText(text, key)} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'6px', border:`1px solid ${C.slate200}`, background:C.w, fontSize:'10px', fontWeight:600, color:copiedKey===key?C.green:C.slate600, cursor:'pointer' }}>
                  {copiedKey===key ? <><Check size={10}/>Copied!</> : <><Copy size={10}/>Copy</>}
                </button>
              </div>
              <p style={{ fontSize:'11px', color:C.slate700, lineHeight:1.6, whiteSpace:'pre-wrap', margin:0 }}>{text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hook tab */}
      {activeTab === 'hook' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {Object.entries(assets.hook).map(([key, text]) => (
            <div key={key} style={{ padding:'11px 13px', background:C.slate50, borderRadius:'10px', border:`1px solid ${C.slate200}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <span style={{ fontSize:'10px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {{ scrollStopper:'Scroll Stopper', painPoint:'Pain Point', curiosity:'Curiosity', fomo:'FOMO' }[key]}
                </span>
                <button onClick={() => copyText(text, key)} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'6px', border:`1px solid ${C.slate200}`, background:C.w, fontSize:'10px', fontWeight:600, color:copiedKey===key?C.green:C.slate600, cursor:'pointer' }}>
                  {copiedKey===key ? <><Check size={10}/>Copied!</> : <><Copy size={10}/>Copy</>}
                </button>
              </div>
              <p style={{ fontSize:'12px', color:C.slate900, fontWeight:600, lineHeight:1.5, margin:0 }}>{text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hashtag tab */}
      {activeTab === 'hashtag' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {Object.entries(assets.hashtag).map(([key, text]) => (
            <div key={key} style={{ padding:'11px 13px', background:C.slate50, borderRadius:'10px', border:`1px solid ${C.slate200}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'7px' }}>
                <span style={{ fontSize:'10px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {key === 'instagram' ? 'Instagram / Shopee' : 'TikTok'}
                </span>
                <button onClick={() => copyText(text, key)} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'6px', border:`1px solid ${C.slate200}`, background:C.w, fontSize:'10px', fontWeight:600, color:copiedKey===key?C.green:C.slate600, cursor:'pointer' }}>
                  {copiedKey===key ? <><Check size={10}/>Copied!</> : <><Copy size={10}/>Copy</>}
                </button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {text.split(' ').map((tag, i) => (
                  <span key={i} style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'20px', background:C.b50, color:C.brand, fontWeight:600 }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function PackshotPage() {
  const [file,         setFile]       = useState<File|null>(null)
  const [preview,      setPreview]    = useState<string|null>(null)
  const [selectedId,   setSelectedId] = useState<string>('white-studio')
  const [customPrompt, setCustomPrompt]= useState('')
  const [showCustom,   setShowCustom] = useState(false)
  const [loading,      setLoading]    = useState(false)
  const [progress,     setProgress]   = useState(0)
  const [progressMsg,  setProgressMsg]= useState('')
  const [result,       setResult]     = useState<string|null>(null)
  const [error,        setError]      = useState('')
  const [activeTab,    setActiveTab]  = useState<'preview'|'marketing'>('preview')
  const [showBefore,   setShowBefore] = useState(false)
  const [activeCategory, setActiveCat]= useState<string>('popular')
  const [zoomed,       setZoomed]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const preset = PACKSHOT_PRESETS.find(p => p.id === selectedId)!

  // ── File handling ───────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) { setError('Maks 10MB'); return }
    if (!f.type.startsWith('image/')) { setError('Hanya file gambar'); return }
    setFile(f); setError(''); setResult(null); setShowBefore(false)
    setPreview(URL.createObjectURL(f))
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  // ── Generate ────────────────────────────────────────────────
  const generate = async () => {
    if (!file) { setError('Upload foto produk dulu'); return }
    setLoading(true); setError(''); setResult(null); setProgress(5); setProgressMsg('Menghapus background...')

    const steps = [
      { pct:20, msg:'Mempersiapkan produk...' },
      { pct:40, msg:'AI menganalisis preset...' },
      { pct:60, msg:'Generate background scene...' },
      { pct:78, msg:'AI rendering detail...' },
      { pct:90, msg:'Finishing touches...' },
    ]
    let si = 0
    const prog = setInterval(() => {
      if (si < steps.length) {
        setProgress(steps[si].pct); setProgressMsg(steps[si].msg); si++
      }
    }, 4000)

    try {
      const fd = new FormData()
      fd.append('image',  file)
      fd.append('preset', selectedId)
      if (showCustom && customPrompt.trim()) fd.append('customPrompt', customPrompt.trim())

      const res = await fetch('/api/studio/packshot', { method:'POST', body: fd })
      clearInterval(prog); setProgress(98); setProgressMsg('Hampir selesai...')

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message ?? `Error ${res.status}`)
      }

      const ct = res.headers.get('content-type') ?? ''
      let blobUrl: string
      if (ct.startsWith('image/')) {
        blobUrl = URL.createObjectURL(await res.blob())
      } else {
        const j = await res.json()
        blobUrl = j.url ?? j.output
        if (!blobUrl) throw new Error('Tidak ada output dari AI')
      }

      setResult(blobUrl); setProgress(100); setProgressMsg('Selesai!')
      setActiveTab('preview')
    } catch (e: any) {
      setError(e.message ?? 'Generate gagal. Coba lagi.')
      setProgress(0); setProgressMsg('')
    } finally {
      clearInterval(prog); setLoading(false)
    }
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `beesell-packshot-${selectedId}-${Date.now()}.png`
    a.click()
  }

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setError('')
    setProgress(0); setProgressMsg(''); setShowBefore(false)
  }

  // Preset list for current category
  const categoryPresets = activeCategory === 'popular'
    ? PACKSHOT_PRESETS.filter(p => p.popular)
    : PACKSHOT_PRESETS.filter(p => p.category === activeCategory)

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px', flexWrap:'wrap' }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:C.slate500, textDecoration:'none' }}>
          <ArrowLeft size={13}/> AI Studio
        </Link>
        <span style={{ color:C.slate300 }}>/</span>
        <Link href="/studio/image" style={{ fontSize:'12px', color:C.slate500, textDecoration:'none' }}>AI Image Generator</Link>
        <span style={{ color:C.slate300 }}>/</span>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,#7C3AED,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📦</div>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:700, color:C.slate900, lineHeight:1 }}>AI Packshot Generator</h1>
            <p style={{ fontSize:'11px', color:C.slate500, marginTop:'2px' }}>Foto produk biasa → foto studio ecommerce premium</p>
          </div>
        </div>
      </div>

      {/* ── STEP INDICATOR ─────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'0', marginBottom:'22px', background:C.slate50, borderRadius:'12px', padding:'10px 14px', border:`1px solid ${C.slate200}` }}>
        {[
          { n:'1', label:'Upload Foto Produk',    done:!!file },
          { n:'2', label:'Pilih Preset Style',    done:!!selectedId },
          { n:'3', label:'Generate AI',           done:!!result },
          { n:'4', label:'Download & Marketing',  done:false },
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', flex: i < 3 ? '1' : 'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
              <div style={{ width:'22px', height:'22px', borderRadius:'50%', background: s.done ? C.green : i===0&&!file ? C.brand : C.slate200, color: s.done||i===0?'#fff':C.slate400, fontSize:'10px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {s.done ? <Check size={11}/> : s.n}
              </div>
              <span style={{ fontSize:'11px', fontWeight:s.done?700:500, color:s.done?C.green:C.slate500, whiteSpace:'nowrap' }}>{s.label}</span>
            </div>
            {i < 3 && <div style={{ flex:1, height:'1px', background:s.done?C.green:C.slate200, margin:'0 8px' }}/>}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:'18px', alignItems:'flex-start' }}>

        {/* ══ LEFT PANEL ════════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Upload zone */}
          <div style={{ borderRadius:'14px', border:`2px dashed ${C.slate200}`, background:C.slate50, overflow:'hidden' }}
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = C.brand }}
            onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200 }}
            onDrop={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200; onDrop(e) }}
            onClick={() => !loading && fileRef.current?.click()}
            style={{ cursor:loading?'default':'pointer' }}
          >
            {preview ? (
              <div style={{ position:'relative' }}>
                <img src={preview} alt="" style={{ width:'100%', height:'200px', objectFit:'contain', background:'#000', display:'block' }}/>
                <button onClick={e => { e.stopPropagation(); reset() }}
                  style={{ position:'absolute', top:'8px', right:'8px', width:'26px', height:'26px', borderRadius:'50%', border:'none', background:'rgba(0,0,0,.6)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={12}/>
                </button>
                {file && (
                  <div style={{ position:'absolute', bottom:'8px', left:'8px', padding:'3px 8px', borderRadius:'5px', background:'rgba(0,0,0,.6)', fontSize:'9px', color:'#fff', fontWeight:600 }}>
                    {file.name.slice(0,20)} · {(file.size/1024).toFixed(0)}KB
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'28px 20px' }}>
                <div style={{ fontSize:'36px', marginBottom:'8px' }}>📸</div>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.slate700, marginBottom:'3px' }}>Upload foto produk</div>
                <div style={{ fontSize:'11px', color:C.slate400, marginBottom:'12px' }}>PNG, JPG, WEBP · Maks 10MB</div>
                <span style={{ padding:'8px 18px', borderRadius:'9px', background:C.purple, color:'#fff', fontSize:'12px', fontWeight:700, display:'inline-flex', gap:'5px', alignItems:'center' }}>
                  <Upload size={12}/> Pilih Foto
                </span>
                <div style={{ marginTop:'10px', fontSize:'10px', color:C.slate400, lineHeight:1.5 }}>
                  💡 Tips: Foto dengan background polos atau sudah di-remove bg menghasilkan output terbaik
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
          </div>

          {/* Selected preset info */}
          {preset && (
            <div style={{ padding:'12px 14px', borderRadius:'12px', background:`${C.purple}0d`, border:`1.5px solid ${C.purple}25` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                <span style={{ fontSize:'18px' }}>{preset.icon}</span>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:C.purple }}>{preset.label}</div>
                  <div style={{ fontSize:'10px', color:C.slate500 }}>{preset.lightingStyle} · shadow: {preset.shadowStyle}</div>
                </div>
              </div>
              <p style={{ fontSize:'11px', color:C.slate600, lineHeight:1.5, margin:'0 0 7px' }}>{preset.desc}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {preset.tags.map(t => (
                  <span key={t} style={{ fontSize:'9px', padding:'2px 7px', borderRadius:'20px', background:C.p50, color:C.purple, fontWeight:600 }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop:'8px', fontSize:'10px', color:C.slate500, padding:'6px 9px', background:C.slate50, borderRadius:'7px' }}>
                💡 {preset.outputTip}
              </div>
            </div>
          )}

          {/* Custom prompt toggle */}
          <div>
            <button type="button" onClick={() => setShowCustom(p => !p)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:showCustom?C.slate50:C.w, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
              <span>✏️ Custom Prompt (Opsional)</span>
              <span style={{ color:C.slate400 }}>{showCustom ? '▲' : '▼'}</span>
            </button>
            {showCustom && (
              <div style={{ marginTop:'6px' }}>
                <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={3}
                  placeholder="Contoh: luxury white marble surface with gold accents, dramatic side lighting, premium skincare photography..."
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'9px', border:`1px solid ${C.slate200}`, fontSize:'11px', fontFamily:"'DM Sans',sans-serif", color:C.slate900, outline:'none', resize:'vertical', lineHeight:1.5, boxSizing:'border-box' }}/>
                <div style={{ fontSize:'9px', color:C.slate400, marginTop:'4px' }}>Custom prompt akan digabung dengan preset style yang dipilih</div>
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
              background: !file||loading ? C.slate200 : 'linear-gradient(135deg,#7C3AED,#2563EB)',
              color: !file||loading ? C.slate400 : '#fff',
              boxShadow: !file||loading ? 'none' : '0 6px 22px rgba(124,58,237,.35)',
            }}>
            {loading
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Generating...</>
              : <><Sparkles size={15}/> Generate Packshot AI</>
            }
          </button>

          {/* Progress */}
          {loading && (
            <div>
              <div style={{ height:'5px', borderRadius:'3px', background:C.slate100, overflow:'hidden', marginBottom:'6px' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#7C3AED,#2563EB)', borderRadius:'3px', transition:'width .8s ease' }}/>
              </div>
              <div style={{ fontSize:'11px', color:C.slate500, textAlign:'center' }}>
                {progressMsg} ({progress}%)
              </div>
              <div style={{ fontSize:'10px', color:C.slate400, textAlign:'center', marginTop:'3px' }}>
                ⏱️ Estimasi: 20-40 detik
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL ═══════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

          {/* Preset selector */}
          <div style={{ background:C.w, borderRadius:'14px', border:`1px solid ${C.slate200}`, overflow:'hidden' }}>
            {/* Category tabs */}
            <div style={{ display:'flex', borderBottom:`1px solid ${C.slate100}`, background:C.slate50, overflowX:'auto' }}>
              {[{ key:'popular', label:'⭐ Populer', icon:'' }, ...Object.entries(CATEGORIES).map(([k,v]) => ({ key:k, label:`${v.icon} ${v.label}`, icon:v.icon }))].map(cat => (
                <button key={cat.key} type="button" onClick={() => setActiveCat(cat.key)}
                  style={{ padding:'9px 14px', border:'none', background:'none', cursor:'pointer', fontSize:'11px', fontWeight:activeCategory===cat.key?700:500, color:activeCategory===cat.key?C.brand:C.slate500, borderBottom:`2px solid ${activeCategory===cat.key?C.brand:'transparent'}`, transition:'all .12s', whiteSpace:'nowrap', flexShrink:0 }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Preset grid */}
            <div style={{ padding:'12px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px,1fr))', gap:'8px', maxHeight:'280px', overflowY:'auto' }}>
              {categoryPresets.map(p => (
                <PresetCard key={p.id} p={p} selected={selectedId===p.id} onClick={() => setSelectedId(p.id)}/>
              ))}
            </div>

            {/* Selected preset best for */}
            {preset && (
              <div style={{ padding:'9px 12px', borderTop:`1px solid ${C.slate100}`, background:C.slate50, display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontSize:'10px', fontWeight:700, color:C.slate500 }}>Cocok untuk:</span>
                {preset.bestFor.slice(0,4).map(b => (
                  <span key={b} style={{ fontSize:'9px', padding:'2px 7px', borderRadius:'20px', background:C.w, border:`1px solid ${C.slate200}`, color:C.slate600 }}>✓ {b}</span>
                ))}
              </div>
            )}
          </div>

          {/* Result area */}
          {result ? (
            <div>
              {/* Result header tabs */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', flexWrap:'wrap', gap:'8px' }}>
                <div style={{ display:'flex', gap:'4px', background:C.slate100, borderRadius:'10px', padding:'3px' }}>
                  {[
                    { k:'preview',   l:'🖼️ Preview' },
                    { k:'marketing', l:'⚡ Marketing' },
                  ].map(t => (
                    <button key={t.k} type="button" onClick={() => setActiveTab(t.k as any)}
                      style={{ padding:'7px 14px', borderRadius:'7px', border:'none', background:activeTab===t.k?C.w:'transparent', fontSize:'12px', fontWeight:activeTab===t.k?700:500, color:activeTab===t.k?C.slate900:C.slate500, cursor:'pointer', transition:'all .12s' }}>
                      {t.l}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  {activeTab === 'preview' && (
                    <button onClick={() => setShowBefore(p => !p)}
                      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:showBefore?C.slate100:C.w, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
                      ⇔ {showBefore ? 'Slider' : 'Before/After'}
                    </button>
                  )}
                  <button onClick={download}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'9px', border:'none', background:C.green, color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(5,150,105,.25)', fontFamily:"'DM Sans',sans-serif" }}>
                    <Download size={13}/> Download
                  </button>
                  <button onClick={() => { setResult(null); setShowBefore(false) }}
                    style={{ padding:'7px 10px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.w, color:C.slate600, cursor:'pointer', display:'flex', alignItems:'center' }}>
                    <RotateCcw size={13}/>
                  </button>
                </div>
              </div>

              {/* Preview tab */}
              {activeTab === 'preview' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {showBefore && preview
                    ? <BeforeAfterSlider before={preview} after={result}/>
                    : (
                      <div style={{ position:'relative', borderRadius:'16px', overflow:'hidden', background:'#111', cursor:'zoom-in' }}
                        onClick={() => setZoomed(true)}>
                        <img src={result} alt="Result" style={{ width:'100%', maxHeight:'480px', objectFit:'contain', display:'block' }}/>
                        <div style={{ position:'absolute', bottom:'10px', left:'10px', padding:'4px 10px', borderRadius:'7px', background:'rgba(0,0,0,.55)', fontSize:'10px', color:'#fff', fontWeight:600, backdropFilter:'blur(4px)' }}>
                          ✨ {preset.label} · Klik untuk zoom
                        </div>
                      </div>
                    )
                  }

                  {/* Meta info */}
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {[
                      { l:'Preset', v:preset.label },
                      { l:'Category', v:CATEGORIES[preset.category as keyof typeof CATEGORIES]?.label },
                      { l:'Format', v:'PNG · 1024×1024' },
                    ].map(m => (
                      <div key={m.l} style={{ padding:'6px 10px', borderRadius:'8px', background:C.slate50, border:`1px solid ${C.slate200}`, flex:1, minWidth:'100px' }}>
                        <div style={{ fontSize:'9px', color:C.slate400, fontWeight:700, textTransform:'uppercase', marginBottom:'2px' }}>{m.l}</div>
                        <div style={{ fontSize:'12px', fontWeight:700, color:C.slate900 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Regenerate + Save to library */}
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
              )}

              {/* Marketing tab */}
              {activeTab === 'marketing' && (
                <MarketingAssets preset={preset} imageName={file?.name ?? 'produk'}/>
              )}
            </div>
          ) : (
            /* Empty result state */
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'400px', textAlign:'center', border:`2px dashed ${C.slate200}`, borderRadius:'16px', background:C.slate50 }}>
              {loading ? (
                <>
                  <div style={{ position:'relative', marginBottom:'20px' }}>
                    <div style={{ width:'72px', height:'72px', borderRadius:'50%', border:`4px solid ${C.slate200}`, borderTop:`4px solid ${C.purple}`, animation:'spin 1s linear infinite' }}/>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>📦</div>
                  </div>
                  <div style={{ fontSize:'15px', fontWeight:700, color:C.slate900, marginBottom:'5px' }}>AI sedang bekerja...</div>
                  <div style={{ fontSize:'12px', color:C.slate500, maxWidth:'280px', lineHeight:1.5 }}>{progressMsg}</div>
                  <div style={{ fontSize:'11px', color:C.slate400, marginTop:'8px' }}>Biasanya selesai dalam 20-40 detik</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'60px', marginBottom:'16px' }}>📦</div>
                  <div style={{ fontSize:'15px', fontWeight:700, color:C.slate900, marginBottom:'6px' }}>Hasil AI Packshot</div>
                  <div style={{ fontSize:'12px', color:C.slate500, lineHeight:1.6, maxWidth:'320px', marginBottom:'16px' }}>
                    Upload foto produk, pilih preset studio yang kamu inginkan, lalu klik <b>Generate Packshot AI</b>
                  </div>
                  {/* Preset preview hints */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center', maxWidth:'360px' }}>
                    {PACKSHOT_PRESETS.filter(p => p.popular).map(p => (
                      <button key={p.id} type="button" onClick={() => setSelectedId(p.id)}
                        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 12px', borderRadius:'99px', border:`1.5px solid ${selectedId===p.id?C.brand:C.slate200}`, background:selectedId===p.id?C.b50:C.w, cursor:'pointer', fontSize:'11px', fontWeight:500, color:C.slate700 }}>
                        {p.icon} {p.label}
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
          <img src={result} alt="Zoom" style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:'12px' }}/>
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
          div[style*="grid-template-columns:340px"] { grid-template-columns:1fr !important }
        }
      `}</style>
    </div>
  )
}