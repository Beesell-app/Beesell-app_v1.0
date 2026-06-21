'use client'
// app/(dashboard)/studio/image/packshot/page.tsx
// ── AI Packshot Generator — Full Feature Page ─────────────────
// Upload foto produk → pilih preset scene → AI generate foto studio premium

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  Upload, Download, RefreshCw, X, Loader2, Sparkles,
  ChevronRight, ArrowLeft, Check, AlertCircle, Copy,
  RotateCcw, ZoomIn, Share2, BookOpen, Info
} from 'lucide-react'
import {
  PACKSHOT_PRESETS, CATEGORIES, POPULAR_PRESETS, getPresetsByCategory,
  type PackshotPreset,
} from '@/lib/studio/packshot-presets'

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
      style={{ position:'relative', width:'100%', aspectRatio:'1/1', borderRadius:'16px', overflow:'hidden', cursor:'col-resize', userSelect:'none', border: `1px solid ${C.slate200}` }}
      onMouseDown={() => setDrag(true)}
      onTouchStart={() => setDrag(true)}
    >
      {/* After (full) */}
      <img src={after} alt="After" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', background:C.slate50 }}/>
      {/* Before (clipped) */}
      <div style={{ position:'absolute', inset:0, clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <img src={before} alt="Before" style={{ width:'100%', height:'100%', objectFit:'contain', background:C.slate100 }}/>
      </div>
      {/* Divider */}
      <div style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, width:'3px', background:'#fff', transform:'translateX(-50%)', boxShadow:'0 0 10px rgba(0,0,0,.3)' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'36px', height:'36px', borderRadius:'50%', background:'#fff', boxShadow:'0 4px 14px rgba(0,0,0,.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'col-resize', border: `2px solid ${C.brand}` }}>
          <span style={{ fontSize:'16px', color:C.brand }}>⇔</span>
        </div>
      </div>
      {/* Labels */}
      <div style={{ position:'absolute', top:'12px', left:'12px', padding:'4px 10px', borderRadius:'8px', background:'rgba(15,23,42,.7)', fontSize:'11px', color:'#fff', fontWeight:600, backdropFilter:'blur(4px)' }}>Sebelum</div>
      <div style={{ position:'absolute', top:'12px', right:'12px', padding:'4px 10px', borderRadius:'8px', background:`rgba(245,158,11,.9)`, fontSize:'11px', color:'#fff', fontWeight:700, backdropFilter:'blur(4px)', boxShadow: '0 2px 8px rgba(245,158,11,.4)' }}>Hasil AI ✨</div>
    </div>
  )
}

// ── Preset Card ───────────────────────────────────────────────
function PresetCard({ p, selected, onClick }: {
  p: PackshotPreset; selected: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ 
        display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'flex-start',
        padding: '14px', borderRadius: '14px', 
        border: `2px solid ${selected ? C.brand : C.slate200}`, 
        background: selected ? C.brandXlt : C.w, 
        cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
        boxShadow: selected ? `0 4px 12px ${C.brand}15` : '0 2px 4px rgba(0,0,0,0.02)'
      }}
    >
      {/* Badge Populer */}
      {p.popular && !selected && (
        <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'9px', fontWeight:800, padding:'2px 6px', borderRadius:'20px', background:C.brand, color:'#fff' }}>⭐</div>
      )}
      
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>{p.icon}</div>
      
      {/* Label - Biarkan 1 baris agar tidak merusak layout */}
      <div style={{ 
        fontSize: '12px', fontWeight: 800, color: selected ? C.brandDk : C.slate800, 
        marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' 
      }}>
        {p.label}
      </div>

      {/* Teks Deskripsi (Desc) - Teknik Line Clamp */}
      <div style={{ 
        fontSize: '11px', 
        color: selected ? C.brandDk : C.slate500, 
        lineHeight: '1.5', 
        // ⚡ CSS Modern untuk memotong teks secara otomatis
        display: '-webkit-box', 
        WebkitLineClamp: 3,           // Maksimal 3 baris
        WebkitBoxOrient: 'vertical', 
        overflow: 'hidden',
        textAlign: 'left',
        width: '100%',
        marginTop: '4px'
      }}>
        {p.desc}
</div>
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
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      {/* Tabs */}
      <div style={{ display:'flex', gap:'6px', background:C.slate100, borderRadius:'12px', padding:'4px' }}>
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            style={{ 
              flex:1, padding:'8px', borderRadius:'10px', border:'none', 
              background:activeTab===t.key?C.w:'transparent', 
              fontSize:'12px', fontWeight:activeTab===t.key?700:600, 
              color:activeTab===t.key?C.brandDk:C.slate500, 
              cursor:'pointer', transition:'all .2s ease',
              boxShadow: activeTab===t.key ? '0 2px 6px rgba(0,0,0,.05)' : 'none'
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {Object.entries(assets[activeTab]).map(([key, text]) => (
          <div key={key} style={{ padding:'14px 16px', background:C.w, borderRadius:'12px', border:`1px solid ${C.slate200}`, transition:'all .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
              <span style={{ fontSize:'11px', fontWeight:800, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <button onClick={() => copyText(text, key)} 
                style={{ 
                  display:'flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'8px', 
                  border:`1px solid ${copiedKey===key?C.green:C.slate200}`, 
                  background:copiedKey===key?C.g50:C.slate50, 
                  fontSize:'11px', fontWeight:600, color:copiedKey===key?C.green:C.slate600, 
                  cursor:'pointer', transition:'all .2s' 
                }}>
                {copiedKey===key ? <><Check size={12}/> Disalin!</> : <><Copy size={12}/> Salin</>}
              </button>
            </div>
            
            {activeTab === 'hashtag' ? (
               <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                 {text.split(' ').map((tag, i) => (
                   <span key={i} style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background:C.brandXlt, color:C.brandDk, fontWeight:600, border:`1px solid ${C.brandLt}` }}>{tag}</span>
                 ))}
               </div>
            ) : (
               <p style={{ fontSize:'13px', color:C.slate700, lineHeight:1.6, whiteSpace:'pre-wrap', margin:0, fontWeight: activeTab === 'hook' ? 600 : 400 }}>{text}</p>
            )}
          </div>
        ))}
      </div>
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

  const categoryPresets = activeCategory === 'popular'
    ? PACKSHOT_PRESETS.filter(p => p.popular)
    : PACKSHOT_PRESETS.filter(p => p.category === activeCategory)

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif", paddingBottom:'40px' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', flexWrap:'wrap' }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:600, color:C.slate500, textDecoration:'none', transition:'color .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color=C.brandDk)}
              onMouseLeave={e=>(e.currentTarget.style.color=C.slate500)}>
          <ArrowLeft size={14}/> AI Studio
        </Link>
        <span style={{ color:C.slate300 }}>/</span>
        <Link href="/studio/image" style={{ fontSize:'13px', fontWeight:600, color:C.slate500, textDecoration:'none', transition:'color .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color=C.brandDk)}
              onMouseLeave={e=>(e.currentTarget.style.color=C.slate500)}>
          AI Visual Marketing Engine
        </Link>
        <span style={{ color:C.slate300 }}>/</span>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`linear-gradient(135deg, ${C.brand}, ${C.brandDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', boxShadow:`0 4px 12px ${C.brand}40` }}>📦</div>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:C.slate900, lineHeight:1, margin:0 }}>AI Packshot Generator</h1>
            <p style={{ fontSize:'12px', color:C.slate500, marginTop:'4px', marginBottom:0, fontWeight:500 }}>Foto produk biasa → foto studio ecommerce premium</p>
          </div>
        </div>
      </div>

      {/* ── STEP INDICATOR ─────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'0', marginBottom:'24px', background:C.w, borderRadius:'16px', padding:'14px 20px', border:`1px solid ${C.slate200}`, boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
        {[
          { n:'1', label:'Upload Foto Produk',    done:!!file },
          { n:'2', label:'Pilih Preset Style',    done:!!selectedId },
          { n:'3', label:'Generate AI',           done:!!result },
          { n:'4', label:'Download & Marketing',  done:false },
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', flex: i < 3 ? '1' : 'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
              <div style={{ 
                width:'24px', height:'24px', borderRadius:'50%', 
                background: s.done ? C.green : i===0&&!file ? C.brand : C.slate100, 
                color: s.done||(i===0&&!file)?'#fff':C.slate400, 
                fontSize:'11px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: s.done ? `0 2px 8px ${C.green}40` : i===0&&!file ? `0 2px 8px ${C.brand}40` : 'none'
              }}>
                {s.done ? <Check size={12} strokeWidth={3}/> : s.n}
              </div>
              <span style={{ fontSize:'12px', fontWeight:s.done||(i===0&&!file)?700:600, color:s.done?C.green:i===0&&!file?C.slate800:C.slate400, whiteSpace:'nowrap' }}>{s.label}</span>
            </div>
            {i < 3 && <div style={{ flex:1, height:'2px', background:s.done?C.green:C.slate100, margin:'0 12px', borderRadius:'2px' }}/>}
          </div>
        ))}
      </div>

      {/* ── PACKSHOT DEFINITION ─────────────────────────────── */}
      <div style={{ marginBottom:'24px', borderRadius:'16px', border:`1px solid ${C.brandLt}`, background:`linear-gradient(135deg, ${C.w}, ${C.brandXlt})`, overflow:'hidden', boxShadow:'0 4px 16px rgba(245,158,11,0.05)' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.brandLt}`, display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.brand}, ${C.brandDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, boxShadow:`0 2px 8px ${C.brand}30` }}>
            <Info size={20} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:'15px', fontWeight:800, color:C.slate900 }}>Apa itu Packshot?</div>
            <div style={{ fontSize:'12px', color:C.slate600, marginTop:'2px', fontWeight:500 }}>Standar foto produk untuk catalog, PDP, dan marketplace listing</div>
          </div>
        </div>
        <div style={{ padding:'18px 20px' }}>
          <p style={{ fontSize:'13px', color:C.slate700, lineHeight:1.7, margin:'0 0 16px', borderLeft:`3px solid ${C.brand}`, paddingLeft:'14px' }}>
            A product photo built for <strong>catalogs, PDPs, and marketplace listings</strong>. In fashion, it shows a single product with <strong>consistent lighting</strong>, <strong>accurate color</strong>, and a <strong>clear silhouette</strong>. Common variants: ghost mannequin, on-hanger, flat-lay, and floating.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'12px' }}>
            {[
              { icon:'👗', variant:'Ghost Mannequin', use:'PDP wajib fashion', color:C.slate800, preset:'ghost-mannequin', desc:'Pakaian pada invisible mannequin — bentuk 3D tanpa model nyata.' },
              { icon:'🪝', variant:'On-Hanger',        use:'TikTok Shop & IG',  color:C.slate800, preset:'on-hanger',        desc:'Pakaian tergantung natural — authentic, populer di TikTok Shop.' },
              { icon:'👕', variant:'Flat-Lay',         use:'Editorial & IG',   color:C.slate800, preset:'flat-lay-fashion', desc:'Foto dari atas, pakaian digelar rapi — bersih dan editorial.' },
              { icon:'✨', variant:'Floating',         use:'Meta & TikTok Ads', color:C.brandDk,  preset:'floating-fashion', desc:'Pakaian melayang dramatis — efek stop-scroll untuk iklan.' },
            ].map(v => (
              <div key={v.variant}
                onClick={() => { setSelectedId(v.preset); setActiveCat('fashion') }}
                style={{ padding:'14px', borderRadius:'12px', background:C.w, border:`1px solid ${C.slate200}`, cursor:'pointer', transition:'all .2s ease' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=C.brand; el.style.transform='translateY(-2px)'; el.style.boxShadow=`0 4px 12px ${C.brand}15` }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=C.slate200; el.style.transform=''; el.style.boxShadow='' }}
              >
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'8px' }}>
                  <span style={{ fontSize:'24px', lineHeight:1 }}>{v.icon}</span>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:800, color:C.slate900 }}>{v.variant}</div>
                    <div style={{ fontSize:'10px', fontWeight:700, color:v.color, opacity:.8, marginTop:'2px', textTransform:'uppercase' }}>{v.use}</div>
                  </div>
                </div>
                <p style={{ fontSize:'11px', color:C.slate500, lineHeight:1.6, margin:'0 0 10px' }}>{v.desc}</p>
                <div style={{ fontSize:'11px', fontWeight:700, color:C.brandDk, display:'flex', alignItems:'center', gap:'4px' }}>Pakai preset ini <ChevronRight size={12}/></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'16px', padding:'12px 16px', borderRadius:'10px', background:C.brandXlt, border:`1px dashed ${C.brand}`, fontSize:'12px', color:C.brandDk, lineHeight:1.6, fontWeight:500 }}>
            💡 <strong>Tips fashion:</strong> Gunakan <em>Ghost Mannequin</em> sebagai foto utama PDP + <em>Flat Lay</em> untuk carousel. Kombinasi ini memenuhi standar Shopee Mall, Tokopedia Official, dan Lazada.
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'360px minmax(0, 1fr)', gap:'24px', alignItems:'flex-start' }}>

        {/* ══ LEFT PANEL ════════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px', position:'sticky', top:'24px' }}>

          {/* Upload zone */}
          <div style={{ borderRadius:'16px', border:`2px dashed ${preview ? C.brand : C.slate300}`, background:C.w, overflow:'hidden', cursor:loading?'default':'pointer', transition:'all .2s' }}
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = C.brand; (e.currentTarget as HTMLElement).style.background = C.brandXlt }}
            onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = preview ? C.brand : C.slate300; (e.currentTarget as HTMLElement).style.background = C.w }}
            onDrop={e => { (e.currentTarget as HTMLElement).style.borderColor = C.brand; (e.currentTarget as HTMLElement).style.background = C.w; onDrop(e) }}
            onClick={() => !loading && fileRef.current?.click()}
            onMouseEnter={e => { if(!loading && !preview) (e.currentTarget as HTMLElement).style.borderColor = C.brand }}
            onMouseLeave={e => { if(!loading && !preview) (e.currentTarget as HTMLElement).style.borderColor = C.slate300 }}
          >
            {preview ? (
              <div style={{ position:'relative' }}>
                <img src={preview} alt="" style={{ width:'100%', height:'240px', objectFit:'contain', background:C.slate50, display:'block' }}/>
                <button onClick={e => { e.stopPropagation(); reset() }}
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
                <div style={{ fontSize:'12px', color:C.slate500, marginBottom:'20px' }}>PNG, JPG, WEBP · Maks 10MB</div>
                <span style={{ padding:'10px 24px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.brand}, ${C.brandDk})`, color:'#fff', fontSize:'13px', fontWeight:700, display:'inline-flex', gap:'8px', alignItems:'center', boxShadow:`0 4px 12px ${C.brand}30` }}>
                   Pilih Foto
                </span>
                <div style={{ marginTop:'20px', fontSize:'11px', color:C.slate500, lineHeight:1.6, background:C.slate50, padding:'8px 12px', borderRadius:'8px' }}>
                  💡 <strong>Tips:</strong> Foto dengan background polos atau sudah di-remove bg menghasilkan output paling presisi.
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
          </div>

          {/* Selected preset info */}
          {preset && (
            <div style={{ padding:'16px', borderRadius:'14px', background:C.brandXlt, border:`1px solid ${C.brandLt}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                <span style={{ fontSize:'24px' }}>{preset.icon}</span>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:800, color:C.brandDk }}>{preset.label}</div>
                  <div style={{ fontSize:'11px', color:C.slate600, fontWeight:500, marginTop:'2px' }}>Lighting: {preset.lightingStyle} · Shadow: {preset.shadowStyle}</div>
                </div>
              </div>
              <p style={{ fontSize:'12px', color:C.slate700, lineHeight:1.6, margin:'0 0 10px' }}>{preset.desc}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {preset.tags.map(t => (
                  <span key={t} style={{ fontSize:'10px', padding:'3px 10px', borderRadius:'20px', background:C.w, border:`1px solid ${C.brandLt}`, color:C.brandDk, fontWeight:700 }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop:'12px', fontSize:'11px', color:C.slate600, padding:'8px 12px', background:C.w, borderRadius:'8px', border:`1px solid ${C.slate100}`, fontWeight:500, display:'flex', gap:'6px' }}>
                <span style={{flexShrink:0}}>💡</span> <span>{preset.outputTip}</span>
              </div>
            </div>
          )}

          {/* Custom prompt toggle */}
          <div>
            <button type="button" onClick={() => setShowCustom(p => !p)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:'12px', border:`1px solid ${showCustom ? C.brand : C.slate200}`, background:showCustom?C.brandXlt:C.w, fontSize:'13px', fontWeight:700, color:showCustom?C.brandDk:C.slate700, cursor:'pointer', transition:'all .2s' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'8px' }}>✏️ Custom Prompt <span style={{fontSize:'10px', fontWeight:600, color:C.slate400, background:C.slate100, padding:'2px 6px', borderRadius:'4px'}}>(Opsional)</span></span>
              <span style={{ color:C.slate400, transform:showCustom?'rotate(180deg)':'rotate(0)', transition:'transform .2s' }}>▼</span>
            </button>
            {showCustom && (
              <div style={{ marginTop:'8px', animation:'fadeIn .2s ease' }}>
                <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={3}
                  placeholder="Contoh: luxury white marble surface with gold accents, dramatic side lighting, premium skincare photography..."
                  style={{ width:'100%', padding:'14px', borderRadius:'12px', border:`1px solid ${C.slate300}`, fontSize:'12px', fontFamily:"'DM Sans',sans-serif", color:C.slate900, outline:'none', resize:'vertical', lineHeight:1.6, boxSizing:'border-box', boxShadow:'inset 0 2px 4px rgba(0,0,0,.02)' }}
                  onFocus={e=>(e.currentTarget.style.borderColor=C.brand)}
                  onBlur={e=>(e.currentTarget.style.borderColor=C.slate300)}
                />
                <div style={{ fontSize:'11px', color:C.slate500, marginTop:'6px', display:'flex', alignItems:'center', gap:'4px' }}>
                  <Info size={12}/> Custom prompt akan digabung dengan preset style yang dipilih
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
              ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/>Sedang Memproses...</>
              : <><Sparkles size={18}/> Generate Packshot AI</>
            }
          </button>

          {/* Progress */}
          {loading && (
            <div style={{ padding:'16px', background:C.w, borderRadius:'12px', border:`1px solid ${C.slate200}` }}>
              <div style={{ height:'6px', borderRadius:'3px', background:C.slate100, overflow:'hidden', marginBottom:'10px' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg, ${C.brand}, ${C.brandDk})`, borderRadius:'3px', transition:'width .5s ease' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:'12px', fontWeight:600, color:C.slate700 }}>
                  {progressMsg}
                </div>
                <div style={{ fontSize:'12px', fontWeight:800, color:C.brandDk }}>{progress}%</div>
              </div>
              <div style={{ fontSize:'11px', color:C.slate400, marginTop:'6px', display:'flex', alignItems:'center', gap:'4px' }}>
                ⏱️ Estimasi: 20-40 detik
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL ═══════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Preset selector */}
          <div style={{ background:C.w, borderRadius:'16px', border:`1px solid ${C.slate200}`, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
            {/* Category tabs */}
            <div style={{ 
                display: 'flex', 
                borderBottom: `1px solid ${C.slate200}`, 
                background: C.slate50, 
                overflowX: 'auto',       // Tetap scrollable di mobile
                padding: '0 4px',        // Padding kiri kanan agar tidak terlalu nempel
                scrollbarWidth: 'none',  // Hide scrollbar di Firefox
                msOverflowStyle: 'none'  // Hide scrollbar di IE/Edge
              }}>
                            
              <style>{`
                div::-webkit-scrollbar { display: none; }
              `}</style>
              {[{ key:'popular', label:'⭐ Populer', icon:'' }, ...Object.entries(CATEGORIES).map(([k,v]) => ({ key:k, label:`${v.icon} ${v.label}`, icon:v.icon }))].map(cat => (
                <button key={cat.key} type="button" onClick={() => setActiveCat(cat.key)}
                  style={{ 
                    padding: '16px 16px', 
                    border: 'none', 
                    background: 'none', 
                    cursor: 'pointer', 
                    fontSize: '12px',      // Sedikit diperkecil agar lebih pas di mobile
                    fontWeight: activeCategory === cat.key ? 800 : 600, 
                    color: activeCategory === cat.key ? C.brandDk : C.slate500, 
                    // Menggunakan border-bottom yang lebih rapi
                    borderBottom: `2px solid ${activeCategory === cat.key ? C.brand : 'transparent'}`, 
                    transition: 'all 0.2s ease', 
                    whiteSpace: 'nowrap', 
                    flexShrink: 0,
                    position: 'relative',
                    marginTop: '1px'       // Mengimbangi border bottom agar presisi
                  }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Preset grid dengan spacing premium */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', // Dibuat lebih lebar
                gap: '16px', // Gap diperlebar agar tidak terlihat menumpuk
                padding: '16px' 
              }}>
                {categoryPresets.map(p => (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <PresetCard p={p} selected={selectedId===p.id} onClick={() => setSelectedId(p.id)}/>
                  </div>
                ))}
              </div>
            {/* Selected preset best for (Re-styled menjadi info panel) */}
            {preset && (
              <div style={{ 
                padding: '14px 20px',
                borderTop: `1px solid ${C.slate100}`, 
                background: '#FAFAFA', // Subtle off-white untuk pembeda
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px', 
                flexWrap: 'wrap' 
              }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  color: C.slate400, 
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}>
                  Optimized for:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {preset.bestFor.slice(0,4).map(b => (
                    <span key={b} style={{ 
                      fontSize: '11px', 
                      padding: '4px 12px', 
                      borderRadius: '20px', // Pill shape untuk kesan modern
                      background: C.w, 
                      border: `1px solid ${C.slate200}`, 
                      color: C.slate700, 
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ color: C.brand }}>•</span> {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Result area */}
          {result ? (
            <div style={{ background:C.w, borderRadius:'16px', border:`1px solid ${C.slate200}`, padding:'20px', boxShadow:'0 4px 12px rgba(0,0,0,0.03)' }}>
              {/* Result header tabs */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'12px' }}>
                <div style={{ display:'flex', gap:'6px', background:C.slate100, borderRadius:'12px', padding:'4px' }}>
                  {[
                    { k:'preview',   l:'🖼️ Preview Visual' },
                    { k:'marketing', l:'⚡ Aset Marketing' },
                  ].map(t => (
                    <button key={t.k} type="button" onClick={() => setActiveTab(t.k as any)}
                      style={{ 
                        padding:'8px 16px', borderRadius:'10px', border:'none', 
                        background:activeTab===t.k?C.w:'transparent', 
                        fontSize:'13px', fontWeight:activeTab===t.k?800:600, 
                        color:activeTab===t.k?C.slate900:C.slate500, 
                        cursor:'pointer', transition:'all .2s ease',
                        boxShadow: activeTab===t.k ? '0 2px 6px rgba(0,0,0,.05)' : 'none'
                      }}>
                      {t.l}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  {activeTab === 'preview' && (
                    <button onClick={() => setShowBefore(p => !p)}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'10px', border:`1px solid ${showBefore ? C.brand : C.slate200}`, background:showBefore?C.brandXlt:C.w, fontSize:'12px', fontWeight:700, color:showBefore?C.brandDk:C.slate700, cursor:'pointer', transition:'all .2s' }}>
                      ⇔ {showBefore ? 'Mode Gambar Biasa' : 'Mode Before/After'}
                    </button>
                  )}
                  <button onClick={download}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 20px', borderRadius:'10px', border:'none', background:C.green, color:'#fff', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:'0 4px 12px rgba(16,185,129,.3)', fontFamily:"'DM Sans',sans-serif", transition:'transform .15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-1px)')}
                    onMouseLeave={e=>(e.currentTarget.style.transform='none')}>
                    <Download size={16}/> Download Hasil
                  </button>
                  <button onClick={() => { setResult(null); setShowBefore(false) }} title="Reset"
                    style={{ padding:'8px 12px', borderRadius:'10px', border:`1px solid ${C.slate200}`, background:C.w, color:C.slate600, cursor:'pointer', display:'flex', alignItems:'center', transition:'all .2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background=C.slate50)}
                    onMouseLeave={e=>(e.currentTarget.style.background=C.w)}>
                    <RotateCcw size={16}/>
                  </button>
                </div>
              </div>

              {/* Preview tab */}
              {activeTab === 'preview' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  {showBefore && preview
                    ? <BeforeAfterSlider before={preview} after={result}/>
                    : (
                      <div style={{ position:'relative', borderRadius:'16px', overflow:'hidden', background:C.slate50, border:`1px solid ${C.slate200}`, cursor:'zoom-in', transition:'all .2s' }}
                        onClick={() => setZoomed(true)}
                        onMouseEnter={e=>(e.currentTarget.style.borderColor=C.brand)}
                        onMouseLeave={e=>(e.currentTarget.style.borderColor=C.slate200)}>
                        <img src={result} alt="Result" style={{ width:'100%', maxHeight:'500px', objectFit:'contain', display:'block' }}/>
                        <div style={{ position:'absolute', bottom:'12px', left:'12px', padding:'6px 14px', borderRadius:'10px', background:'rgba(15,23,42,.75)', fontSize:'12px', color:'#fff', fontWeight:600, backdropFilter:'blur(4px)', display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{color:C.brand}}>✨</span> {preset.label} <span style={{opacity:0.5, margin:'0 4px'}}>|</span> <ZoomIn size={12}/> Klik untuk zoom
                        </div>
                      </div>
                    )
                  }

                  {/* Meta info */}
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    {[
                      { l:'Style Preset', v:preset.label },
                      { l:'Kategori', v:CATEGORIES[preset.category as keyof typeof CATEGORIES]?.label },
                      { l:'Resolusi Format', v:'PNG · 1024 × 1024' },
                    ].map(m => (
                      <div key={m.l} style={{ padding:'10px 14px', borderRadius:'12px', background:C.slate50, border:`1px solid ${C.slate200}`, flex:1, minWidth:'120px' }}>
                        <div style={{ fontSize:'10px', color:C.slate500, fontWeight:800, textTransform:'uppercase', marginBottom:'4px', letterSpacing:'0.05em' }}>{m.l}</div>
                        <div style={{ fontSize:'13px', fontWeight:800, color:C.slate900 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Regenerate + Save to library */}
                  <div style={{ display:'flex', gap:'10px' }}>
                    <button onClick={generate}
                      style={{ flex:1, padding:'14px', borderRadius:'12px', border:`2px solid ${C.brand}`, background:C.brandXlt, color:C.brandDk, fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:"'DM Sans',sans-serif", transition:'all .2s' }}
                      onMouseEnter={e=>{(e.currentTarget.style.background=C.brand);(e.currentTarget.style.color='#fff')}}
                      onMouseLeave={e=>{(e.currentTarget.style.background=C.brandXlt);(e.currentTarget.style.color=C.brandDk)}}>
                      <RefreshCw size={16}/> Buat Variasi Baru
                    </button>
                    <button style={{ flex:1, padding:'14px', borderRadius:'12px', border:`2px solid ${C.slate200}`, background:C.w, color:C.slate700, fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:"'DM Sans',sans-serif", transition:'background .2s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background=C.slate50)}
                      onMouseLeave={e=>(e.currentTarget.style.background=C.w)}>
                      <BookOpen size={16}/> Simpan ke Library
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
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'500px', textAlign:'center', border:`2px dashed ${C.slate200}`, borderRadius:'16px', background:C.w, padding:'40px' }}>
              {loading ? (
                <>
                  <div style={{ position:'relative', marginBottom:'24px' }}>
                    <div style={{ width:'80px', height:'80px', borderRadius:'50%', border:`4px solid ${C.slate100}`, borderTop:`4px solid ${C.brand}`, animation:'spin 1s linear infinite' }}/>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' }}>📦</div>
                  </div>
                  <div style={{ fontSize:'18px', fontWeight:800, color:C.slate900, marginBottom:'8px' }}>AI Sedang Bekerja...</div>
                  <div style={{ fontSize:'14px', color:C.slate600, maxWidth:'300px', lineHeight:1.6, fontWeight:500 }}>{progressMsg}</div>
                  <div style={{ padding:'6px 12px', background:C.slate50, borderRadius:'20px', fontSize:'12px', color:C.slate500, marginTop:'16px', fontWeight:600, border:`1px solid ${C.slate200}` }}>
                    Biasanya selesai dalam 20-40 detik
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width:'80px', height:'80px', borderRadius:'20px', background:C.brandXlt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', marginBottom:'20px', color:C.brand, boxShadow:`0 8px 24px ${C.brand}20` }}>
                    <Sparkles size={40} strokeWidth={1.5}/>
                  </div>
                  <div style={{ fontSize:'20px', fontWeight:800, color:C.slate900, marginBottom:'8px' }}>Area Hasil AI Packshot</div>
                  <div style={{ fontSize:'14px', color:C.slate500, lineHeight:1.6, maxWidth:'380px', marginBottom:'24px' }}>
                    Upload foto produk di panel kiri, pilih preset studio yang kamu inginkan, lalu klik tombol <b>Generate Packshot AI</b>.
                  </div>
                  
                  <div style={{ width:'100%', maxWidth:'400px', height:'1px', background:C.slate200, marginBottom:'20px' }}/>
                  
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>Coba Preset Populer Ini:</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', maxWidth:'420px' }}>
                    {PACKSHOT_PRESETS.filter(p => p.popular).slice(0,4).map(p => (
                      <button key={p.id} type="button" onClick={() => setSelectedId(p.id)}
                        style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'99px', border:`1.5px solid ${selectedId===p.id?C.brand:C.slate200}`, background:selectedId===p.id?C.brandXlt:C.w, cursor:'pointer', fontSize:'12px', fontWeight:700, color:selectedId===p.id?C.brandDk:C.slate600, transition:'all .2s' }}
                        onMouseEnter={e=>{if(selectedId!==p.id) e.currentTarget.style.background=C.slate50}}
                        onMouseLeave={e=>{if(selectedId!==p.id) e.currentTarget.style.background=C.w}}>
                        <span style={{fontSize:'14px'}}>{p.icon}</span> {p.label}
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
        @keyframes fadeIn { from { opacity:0; transform:translateY(-5px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:6px; height:6px }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:3px }
        ::-webkit-scrollbar-thumb:hover { background:#94A3B8 }
        @media (max-width:860px) {
          div[style*="grid-template-columns:360px"] { grid-template-columns:1fr !important }
        }
      `}</style>
    </div>
  )
}