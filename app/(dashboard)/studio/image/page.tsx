'use client'
// apps/web-app/app/(dashboard)/studio/image/page.tsx
// ── BeeSell AI — AI Visual Marketing Engine ──────────────────────
// Full 12-dimension form → AI builds prompt → multi-image output
// Modes: Quick (3 fields) | Advanced (12 fields)

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles, ArrowLeft, Download, BookmarkPlus, RefreshCw,
  ZoomIn, X, Check, Loader2, AlertCircle, Upload,
  ChevronDown, ChevronUp, Wand2, Info, Maximize2,
  History, Star, Settings2,
} from 'lucide-react'

const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE', brand700:'#1D4ED8',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  pink:'#DB2777', pnk50:'#FDF2F8',
  slate900:'#0F172A', slate800:'#1E293B', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#ffffff',
}

// ── All 12 dimension options ───────────────────────────────────
const OPT = {
  category: [
    { v:'fashion',     l:'Fashion',      i:'👗' }, { v:'skincare',   l:'Skincare',     i:'✨' },
    { v:'food',        l:'Makanan',      i:'🍜' }, { v:'minuman',    l:'Minuman',      i:'🥤' },
    { v:'electronics', l:'Elektronik',   i:'📱' }, { v:'furniture',  l:'Furniture',    i:'🪑' },
    { v:'perhiasan',   l:'Perhiasan',    i:'💍' }, { v:'gadget',     l:'Gadget',       i:'💻' },
    { v:'sepatu',      l:'Sepatu',       i:'👟' }, { v:'tas',        l:'Tas',          i:'👜' },
    { v:'jam',         l:'Jam Tangan',   i:'⌚' }, { v:'otomotif',   l:'Otomotif',     i:'🚗' },
  ],
  contentType: [
    { v:'product-ads',      l:'Product Ads',       i:'📢' }, { v:'marketplace',     l:'Marketplace',       i:'🛒' },
    { v:'tiktok-shop',      l:'TikTok Shop',       i:'🎵' }, { v:'shopee',          l:'Shopee Image',      i:'🛍️' },
    { v:'instagram-feed',   l:'Instagram Feed',    i:'📸' }, { v:'ugc',             l:'UGC Content',       i:'🎬' },
    { v:'before-after',     l:'Before-After',      i:'✨' }, { v:'promo-banner',    l:'Promo Banner',      i:'🎯' },
    { v:'branding-campaign',l:'Branding Campaign', i:'🏷️' }, { v:'cinematic-shot',  l:'Cinematic Shot',    i:'🎥' },
    { v:'luxury-branding',  l:'Luxury Branding',   i:'💎' }, { v:'flash-sale',      l:'Flash Sale',        i:'⚡' },
    { v:'soft-selling',     l:'Soft Selling',      i:'💫' }, { v:'hard-selling',    l:'Hard Selling',      i:'🔥' },
  ],
  visualStyle: [
    { v:'hyper-realistic',  l:'Hyper Realistic',   i:'📷' }, { v:'realistic',       l:'Realistic',         i:'🖼️' },
    { v:'luxury',           l:'Luxury',            i:'💎' }, { v:'minimalist',      l:'Minimalist',        i:'◻️' },
    { v:'clean-studio',     l:'Clean Studio',      i:'⬜' }, { v:'korean-style',    l:'Korean Style',      i:'🌸' },
    { v:'japanese',         l:'Japanese Aesthetic', i:'🗻' }, { v:'dark-moody',     l:'Dark Moody',        i:'🌑' },
    { v:'bright-commercial',l:'Bright Commercial', i:'☀️' }, { v:'futuristic',      l:'Futuristic',        i:'🚀' },
    { v:'cinematic',        l:'Cinematic',         i:'🎬' }, { v:'vintage',         l:'Vintage',           i:'📻' },
    { v:'viral-tiktok',     l:'Viral TikTok',      i:'🔥' }, { v:'elegant',         l:'Elegant',           i:'🌹' },
  ],
  bgStyle: [
    { v:'studio-white',   l:'Studio Putih',    i:'⬜' }, { v:'marble',         l:'Marble Luxury',   i:'🤍' },
    { v:'cafe',           l:'Cafe Aesthetic',  i:'☕' }, { v:'outdoor',        l:'Alam Outdoor',    i:'🌿' },
    { v:'dapur',          l:'Dapur Modern',    i:'🍳' }, { v:'bathroom',       l:'Bathroom',        i:'🚿' },
    { v:'neon-cyberpunk', l:'Neon Cyberpunk',  i:'💜' }, { v:'minimal-clean',  l:'Minimal Clean',   i:'🔲' },
    { v:'gradient',       l:'Gradient',        i:'🌈' }, { v:'transparent',    l:'Transparent',     i:'🫥' },
    { v:'dark-premium',   l:'Dark Premium',    i:'⬛' },
  ],
  colorTone: [
    { v:'warm',       l:'Warm Tone',      i:'🟠' }, { v:'pastel',     l:'Soft Pastel',    i:'🌸' },
    { v:'monochrome', l:'Monochrome',     i:'⚫' }, { v:'gold-luxury',l:'Gold Luxury',    i:'✨' },
    { v:'black-premium',l:'Black Premium',i:'🖤' }, { v:'clean-white',l:'Clean White',    i:'🤍' },
    { v:'vibrant',    l:'Vibrant',        i:'🎨' }, { v:'earth-tone', l:'Earth Tone',     i:'🌰' },
  ],
  moodTone: [
    { v:'elegant',     l:'Elegant',       i:'🌹' }, { v:'trustworthy', l:'Trustworthy',   i:'🤝' },
    { v:'premium',     l:'Premium',       i:'💎' }, { v:'happy',       l:'Happy',         i:'😊' },
    { v:'emotional',   l:'Emotional',     i:'💝' }, { v:'fresh',       l:'Fresh',         i:'🌿' },
    { v:'healthy',     l:'Healthy',       i:'💚' }, { v:'luxury',      l:'Luxury',        i:'👑' },
    { v:'energetic',   l:'Energetic',     i:'⚡' }, { v:'calm',        l:'Calm',          i:'🌊' },
    { v:'confident',   l:'Confident',     i:'💪' },
  ],
  lightingStyle: [
    { v:'soft',            l:'Soft Light',      i:'🌤️' }, { v:'studio',         l:'Studio Light',    i:'💡' },
    { v:'natural',         l:'Natural Light',   i:'☀️' }, { v:'golden-hour',    l:'Golden Hour',     i:'🌅' },
    { v:'dramatic',        l:'Dramatic Shadow', i:'🌑' }, { v:'cinematic',      l:'Cinematic',       i:'🎬' },
    { v:'neon-glow',       l:'Neon Glow',       i:'🔴' }, { v:'high-contrast',  l:'High Contrast',   i:'🔲' },
    { v:'bright-commercial',l:'Bright Comm.',   i:'⬜' },
  ],
  composition: [
    { v:'hero-shot',    l:'Hero Shot',       i:'🦸' }, { v:'flat-lay',      l:'Flat Lay',        i:'🔲' },
    { v:'close-up',     l:'Close Up',        i:'🔍' }, { v:'lifestyle',     l:'Lifestyle',       i:'🌿' },
    { v:'floating',     l:'Floating',        i:'🎈' }, { v:'hand-holding',  l:'Hand Holding',    i:'🤲' },
    { v:'macro',        l:'Macro Shot',      i:'🔬' }, { v:'symmetrical',   l:'Symmetrical',     i:'🪞' },
    { v:'rule-of-thirds',l:'Rule of Thirds', i:'📐' }, { v:'wide-cinematic',l:'Wide Cinematic',  i:'🎞️' },
  ],
  cameraStyle: [
    { v:'dslr',          l:'DSLR Commercial', i:'📷' }, { v:'sony-a7r',       l:'Sony A7R',        i:'🎥' },
    { v:'iphone',        l:'iPhone Style',    i:'📱' }, { v:'85mm',           l:'85mm Portrait',   i:'🔭' },
    { v:'macro',         l:'Macro Lens',      i:'🔬' }, { v:'ultra-detailed', l:'Ultra Detailed',  i:'🔍' },
    { v:'bokeh',         l:'Bokeh',           i:'✨' }, { v:'studio-hq',      l:'Studio HQ',       i:'💡' },
  ],
  targetAudience: [
    { v:'gen-z',             l:'Gen Z',           i:'🧑' }, { v:'millennial',      l:'Milenial',        i:'👩‍💼' },
    { v:'ibu-rumah-tangga',  l:'Ibu Rumah Tangga',i:'👩‍👧' }, { v:'wanita-karir',     l:'Wanita Karir',    i:'💼' },
    { v:'pria-dewasa',       l:'Pria Dewasa',     i:'👨' }, { v:'luxury',           l:'Luxury Audience', i:'👑' },
    { v:'remaja',            l:'Remaja',          i:'🧒' }, { v:'pebisnis',         l:'Pebisnis',        i:'🤝' },
    { v:'beauty-enthusiast', l:'Beauty Enthusiast',i:'💄'},{ v:'gamer',            l:'Gamer',           i:'🎮' },
  ],
  platform: [
    { v:'instagram',    l:'Instagram',     i:'📸' }, { v:'tiktok',        l:'TikTok',          i:'🎵' },
    { v:'shopee',       l:'Shopee',        i:'🛍️' }, { v:'tokopedia',     l:'Tokopedia',       i:'🛒' },
    { v:'lazada',       l:'Lazada',        i:'📦' }, { v:'facebook-ads',  l:'Facebook Ads',    i:'👥' },
    { v:'website',      l:'Website',       i:'🌐' }, { v:'whatsapp',      l:'WhatsApp',        i:'💬' },
  ],
}

const RATIOS = [
  { v:'1:1',  l:'1:1 Square',   d:'Instagram, Shopee' },
  { v:'4:5',  l:'4:5 Portrait', d:'Instagram Feed' },
  { v:'9:16', l:'9:16 Vertikal',d:'TikTok, Reels' },
  { v:'16:9', l:'16:9 Landscape',d:'Banner, Web' },
  { v:'4:3',  l:'4:3 Shopee',   d:'Marketplace' },
]

// ── Pill selector ──────────────────────────────────────────────
function PillGroup({ label, options, value, onChange, color=C.brand }: {
  label: string
  options: {v:string; l:string; i:string}[]
  value: string
  onChange: (v:string) => void
  color?: string
}) {
  return (
    <div style={{ marginBottom:'14px' }}>
      <div style={{ fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>{label}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
        {options.map(o => (
          <button key={o.v} type="button" onClick={() => onChange(value === o.v ? '' : o.v)}
            style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 10px', borderRadius:'99px', border:`1px solid ${value===o.v ? color : C.slate200}`, background: value===o.v ? color+'15' : C.white, cursor:'pointer', fontSize:'11px', fontWeight:value===o.v?700:500, color: value===o.v ? color : C.slate600, transition:'all .12s', whiteSpace:'nowrap' }}>
            <span style={{ fontSize:'13px' }}>{o.i}</span>{o.l}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Image result card ──────────────────────────────────────────
function ResultCard({ r, productName, onLightbox, onSave, onUpscale, onRegenerate, savedIds, upscaledIds }: {
  r: { id:string; url:string; status:string; jobId?:string }
  productName: string
  onLightbox: (url:string) => void
  onSave: (id:string, jobId?:string) => void
  onUpscale: (id:string, url:string) => void
  onRegenerate: (id:string) => void
  savedIds: Set<string>
  upscaledIds: Set<string>
}) {
  const [dl, setDl] = useState(false)

  const download = async () => {
    if (!r.url || dl) return
    setDl(true)
    try {
      const res = await fetch(r.url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `beesell-${productName.replace(/\s+/g,'-').toLowerCase()}-${Date.now()}.png`
      a.click()
    } catch { window.open(r.url, '_blank') }
    setDl(false)
  }

  return (
    <div style={{ borderRadius:'14px', overflow:'hidden', border:`1px solid ${C.slate200}`, background:C.white, boxShadow:'0 2px 8px rgba(0,0,0,.04)', transition:'box-shadow .15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow='0 6px 20px rgba(0,0,0,.10)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,.04)'}
    >
      {/* Image */}
      <div style={{ position:'relative', paddingBottom:'100%', background:C.slate100 }}>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {r.status === 'loading' ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ display:'flex', gap:'4px', justifyContent:'center', marginBottom:'10px' }}>
                {[0,1,2].map(j => <div key={j} style={{ width:'6px', height:'6px', borderRadius:'50%', background:C.purple, animation:`bounce 1.2s ease-in-out ${j*.2}s infinite` }}/>)}
              </div>
              <div style={{ fontSize:'11px', color:C.slate400 }}>AI menggambar...</div>
            </div>
          ) : r.status === 'error' ? (
            <div style={{ textAlign:'center', color:C.red }}>
              <AlertCircle size={22}/><br/>
              <span style={{ fontSize:'11px' }}>Gagal</span>
              <br/>
              <button onClick={() => onRegenerate(r.id)} style={{ marginTop:'6px', fontSize:'10px', color:C.brand, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Coba lagi</button>
            </div>
          ) : r.url ? (
            <img src={r.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', cursor:'pointer' }} onClick={() => onLightbox(r.url)}/>
          ) : null}
        </div>

        {/* Overlay actions */}
        {r.url && r.status === 'ready' && (
          <div style={{ position:'absolute', top:'8px', right:'8px', display:'flex', gap:'4px' }}>
            <button onClick={() => onLightbox(r.url)} title="Perbesar"
              style={{ width:'28px', height:'28px', borderRadius:'7px', background:'rgba(0,0,0,.55)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
              <ZoomIn size={13} color="white"/>
            </button>
          </div>
        )}

        {upscaledIds.has(r.id) && (
          <div style={{ position:'absolute', top:'8px', left:'8px', background:'rgba(5,150,105,.9)', color:'white', fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'4px' }}>
            ↑ 4× Upscaled
          </div>
        )}
      </div>

      {/* Actions */}
      {r.url && r.status === 'ready' && (
        <div style={{ padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px', borderTop:`1px solid ${C.slate100}` }}>
          <button onClick={() => onSave(r.id, r.jobId)}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'7px 4px', borderRadius:'8px', border:`1px solid ${savedIds.has(r.id)?C.green:C.slate200}`, background:savedIds.has(r.id)?C.grn50:C.white, fontSize:'10px', fontWeight:700, color:savedIds.has(r.id)?C.green:C.slate600, cursor:'pointer' }}>
            {savedIds.has(r.id) ? <><Check size={10}/>Tersimpan</> : <><BookmarkPlus size={10}/>Simpan</>}
          </button>
          <button onClick={download} disabled={dl}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'7px 4px', borderRadius:'8px', border:'none', background:`linear-gradient(135deg, ${C.purple}, #5B21B6)`, fontSize:'10px', fontWeight:700, color:C.white, cursor:dl?'not-allowed':'pointer' }}>
            {dl ? <Loader2 size={10} style={{ animation:'spin 1s linear infinite' }}/> : <Download size={10}/>}
            Download
          </button>
          {!upscaledIds.has(r.id) && (
            <button onClick={() => onUpscale(r.id, r.url)}
              style={{ gridColumn:'span 2', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding:'6px 4px', borderRadius:'8px', border:`1px solid ${C.purple}40`, background:C.pur50, fontSize:'10px', fontWeight:700, color:C.purple, cursor:'pointer' }}>
              <Maximize2 size={10}/>Upscale 4× (HD)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function AIImageGeneratorPage() {
  // Mode
  const [mode, setMode] = useState<'quick'|'advanced'>('quick')

  // Core inputs
  const [productName,    setProductName]    = useState('')
  const [productDesc,    setProductDesc]    = useState('')
  const [uploadedUrl,    setUploadedUrl]    = useState('')
  const [count,          setCount]          = useState(4)
  const [ratio,          setRatio]          = useState('1:1')
  const [customPrompt,   setCustomPrompt]   = useState('')
  const [negPrompt,      setNegPrompt]      = useState('')
  const [showNeg,        setShowNeg]        = useState(false)
  const [activeTab,      setActiveTab]      = useState<'generate'|'history'>('generate')

  // 12 dimensions
  const [category,       setCategory]       = useState('')
  const [contentType,    setContentType]    = useState('')
  const [visualStyle,    setVisualStyle]    = useState('hyper-realistic')
  const [productType,    setProductType]    = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [platform,       setPlatform]       = useState('instagram')
  const [bgStyle,        setBgStyle]        = useState('studio-white')
  const [colorTone,      setColorTone]      = useState('')
  const [moodTone,       setMoodTone]       = useState('')
  const [lightingStyle,  setLightingStyle]  = useState('studio')
  const [composition,    setComposition]    = useState('hero-shot')
  const [cameraStyle,    setCameraStyle]    = useState('dslr')

  // Results
  const [results, setResults] = useState<Array<{id:string;url:string;status:string;jobId?:string}>>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [lightbox,setLightbox]= useState<string|null>(null)
  const [savedIds,setSavedIds]= useState(new Set<string>())
  const [upscaledIds,setUpscaledIds] = useState(new Set<string>())
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const pollRefs = useRef<Record<string,ReturnType<typeof setInterval>>>({})

  const pollJob = useCallback((jobId: string, id: string) => {
    let n = 0
    pollRefs.current[id] = setInterval(async () => {
      n++
      if (n >= 40) { clearInterval(pollRefs.current[id]); setResults(p => p.map(r => r.id===id?{...r,status:'error'}:r)); return }
      try {
        const res = await fetch(`/api/jobs/${jobId}/status`)
        if (!res.ok) return
        const { status, imageUrl } = await res.json()
        if (status === 'completed' && imageUrl) {
          clearInterval(pollRefs.current[id])
          setResults(p => p.map(r => r.id===id?{...r,status:'ready',url:imageUrl}:r))
        } else if (status === 'failed') {
          clearInterval(pollRefs.current[id])
          setResults(p => p.map(r => r.id===id?{...r,status:'error'}:r))
        }
      } catch {}
    }, 3000)
  }, [])

  const generate = async () => {
    if (!productName.trim()) { setError('Masukkan nama produk dulu'); return }
    Object.values(pollRefs.current).forEach(clearInterval)
    pollRefs.current = {}
    setError(''); setLoading(true)
    setGeneratedPrompt('')

    const placeholders = Array.from({ length:count }, (_,i) => ({
      id:`res-${Date.now()}-${i}`, url:'', status:'loading'
    }))
    setResults(placeholders)

    try {
      const body = {
        productName: productName.trim(),
        productDesc: productDesc || undefined,
        count,
        ratio,
        customPrompt: customPrompt || undefined,
        negativePrompt: negPrompt || undefined,
        uploadedImageUrl: uploadedUrl || undefined,
        ...(mode === 'advanced' ? {
          category:       category       || undefined,
          contentType:    contentType    || undefined,
          visualStyle:    visualStyle    || undefined,
          targetAudience: targetAudience || undefined,
          platform:       platform       || undefined,
          bgStyle:        bgStyle        || undefined,
          colorTone:      colorTone      || undefined,
          moodTone:       moodTone       || undefined,
          lightingStyle:  lightingStyle  || undefined,
          composition:    composition    || undefined,
          cameraStyle:    cameraStyle    || undefined,
        } : {
          visualStyle:    visualStyle    || undefined,
          bgStyle:        bgStyle        || undefined,
          composition:    composition    || undefined,
          platform:       platform       || undefined,
        }),
      }

      const res = await fetch('/api/generate/image', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
      })

      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e?.message ?? `HTTP ${res.status}`)
      }

      const { jobIds, prompt } = await res.json()
      if (prompt) setGeneratedPrompt(prompt)

      jobIds.forEach((jobId: string, i: number) => {
        setResults(p => p.map((r,idx) => idx===i ? {...r,jobId} : r))
        pollJob(jobId, placeholders[i].id)
      })

    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan. Coba lagi.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const saveImage = (id: string, jobId?: string) => {
    setSavedIds(p => new Set([...p, id]))
    // TODO: call /api/library/save
  }

  const upscaleImage = async (id: string, url: string) => {
    try {
      const res = await fetch('/api/image/upscale', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ resultId:id, imageUrl:url, scale:4 }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e?.message); }
      const { upscaledUrl } = await res.json()
      setUpscaledIds(p => new Set([...p, id]))
      setResults(p => p.map(r => r.id===id ? {...r,url:upscaledUrl} : r))
    } catch (e: any) {
      setError(e.message || 'Upscale gagal')
    }
  }

  const readyCount   = results.filter(r => r.status === 'ready').length
  const loadingCount = results.filter(r => r.status === 'loading').length

  const inp: React.CSSProperties = { width:'100%', padding:'10px 13px', borderRadius:'10px', border:`1.5px solid ${C.slate200}`, fontSize:'13px', fontFamily:"'DM Sans',sans-serif", color:C.slate900, outline:'none', boxSizing:'border-box', background:C.white, transition:'border-color .15s' }
  const lbl: React.CSSProperties = { fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }

  return (
    <div style={{ maxWidth:'1280px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:'18px' }}>
        <Link href="/studio" style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', color:C.slate400, textDecoration:'none', marginBottom:'8px' }}>
          <ArrowLeft size={12}/> AI Studio
        </Link>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
          <div>
            <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(20px,3.5vw,26px)', fontWeight:600, color:C.slate900, letterSpacing:'-0.02em', marginBottom:'3px' }}>
              AI Visual Marketing Engine 📸
            </h1>
            <p style={{ fontSize:'13px', color:C.slate500 }}>
              Hyper-realistic product photography — studio quality dalam 30 detik
            </p>
          </div>
          {/* Tab */}
          <div style={{ display:'flex', gap:'6px' }}>
            {(['generate','history'] as const).map(t => (
              <button key={t} type="button" onClick={() => setActiveTab(t)}
                style={{ padding:'7px 16px', borderRadius:'9px', border:`1px solid ${activeTab===t?C.brand:C.slate200}`, background:activeTab===t?C.brand50:C.white, cursor:'pointer', fontSize:'12px', fontWeight:700, color:activeTab===t?C.brand:C.slate600 }}>
                {t==='generate' ? '⚡ Generate' : '📂 Riwayat'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'generate' && (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,340px) minmax(0,1fr)', gap:'16px', alignItems:'start' }}>

          {/* ── LEFT CONFIG ─────────────────────────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

            {/* Mode switch */}
            <div style={{ display:'flex', gap:'6px', padding:'4px', background:C.slate100, borderRadius:'11px' }}>
              {(['quick','advanced'] as const).map(m => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  style={{ flex:1, padding:'8px', borderRadius:'8px', border:'none', background: mode===m?C.white:'transparent', cursor:'pointer', fontSize:'12px', fontWeight:700, color: mode===m?C.brand:C.slate500, boxShadow: mode===m?'0 1px 3px rgba(0,0,0,.1)':'none', transition:'all .15s' }}>
                  {m==='quick' ? '⚡ Quick Mode' : '🔧 Advanced Mode'}
                </button>
              ))}
            </div>

            {/* Product inputs */}
            <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, padding:'16px' }}>
              <label style={lbl}>Nama Produk <span style={{ color:C.red }}>*</span></label>
              <input value={productName} onChange={e => { setProductName(e.target.value); setError('') }}
                placeholder="Contoh: Serum Vitamin C Brightening 30ml" style={{ ...inp, marginBottom:'10px' }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.brand}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.slate200}
              />

              <label style={lbl}>Deskripsi Produk</label>
              <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)}
                placeholder="Warna, ukuran, bahan, keunggulan produk..." rows={2}
                style={{ ...inp, resize:'vertical', marginBottom:'10px' }}
              />

              {/* Upload product image */}
              <label style={lbl}>Upload Gambar Produk (img2img)</label>
              <div style={{ border:`1.5px dashed ${uploadedUrl ? C.green : C.slate200}`, borderRadius:'10px', padding:'12px', textAlign:'center', background: uploadedUrl ? C.grn50 : C.slate50, cursor:'pointer' }}
                onClick={() => document.getElementById('img-upload')?.click()}>
                <input id="img-upload" type="file" accept="image/*" style={{ display:'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    // For now: use object URL as placeholder
                    setUploadedUrl(URL.createObjectURL(file))
                  }}
                />
                {uploadedUrl ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}>
                    <img src={uploadedUrl} alt="" style={{ width:'32px', height:'32px', borderRadius:'6px', objectFit:'cover' }}/>
                    <span style={{ fontSize:'12px', color:C.green, fontWeight:600 }}>Gambar terupload ✓</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setUploadedUrl('') }} style={{ background:'none', border:'none', cursor:'pointer', color:C.red, fontSize:'11px' }}>Hapus</button>
                  </div>
                ) : (
                  <>
                    <Upload size={18} color={C.slate400} style={{ margin:'0 auto 5px' }}/>
                    <div style={{ fontSize:'12px', color:C.slate500 }}>Upload gambar produkmu</div>
                    <div style={{ fontSize:'10px', color:C.slate400 }}>AI akan generate berdasarkan gambar ini (img2img)</div>
                  </>
                )}
              </div>
            </div>

            {/* ── QUICK MODE: 4 key selectors only ─────── */}
            {mode === 'quick' && (
              <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, padding:'16px' }}>
                <PillGroup label="Visual Style" options={OPT.visualStyle.slice(0,6)} value={visualStyle} onChange={setVisualStyle} color={C.purple}/>
                <PillGroup label="Background"   options={OPT.bgStyle.slice(0,6)}     value={bgStyle}     onChange={setBgStyle}     color={C.brand}/>
                <PillGroup label="Composition"  options={OPT.composition.slice(0,5)} value={composition} onChange={setComposition} color={C.green}/>
                <PillGroup label="Platform"     options={OPT.platform.slice(0,4)}    value={platform}    onChange={setPlatform}    color={C.amber}/>
              </div>
            )}

            {/* ── ADVANCED MODE: all 12 dimensions ──────── */}
            {mode === 'advanced' && (
              <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, padding:'16px', maxHeight:'60vh', overflowY:'auto' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:C.purple, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px', display:'flex', alignItems:'center', gap:'5px' }}>
                  <Wand2 size={11}/> 12 Dimension AI Prompt Builder
                </div>
                <PillGroup label="1. Kategori Barang"   options={OPT.category}       value={category}       onChange={setCategory}       color={C.brand}/>
                <PillGroup label="2. Jenis Konten"      options={OPT.contentType}     value={contentType}    onChange={setContentType}    color={C.purple}/>
                <PillGroup label="3. Style Visual"      options={OPT.visualStyle}     value={visualStyle}    onChange={setVisualStyle}    color={C.purple}/>
                <PillGroup label="4. Background"        options={OPT.bgStyle}         value={bgStyle}        onChange={setBgStyle}        color={C.brand}/>
                <PillGroup label="5. Tone Warna"        options={OPT.colorTone}       value={colorTone}      onChange={setColorTone}      color={C.amber}/>
                <PillGroup label="6. Mood / Emosi"      options={OPT.moodTone}        value={moodTone}       onChange={setMoodTone}       color={C.pink}/>
                <PillGroup label="7. Lighting"          options={OPT.lightingStyle}   value={lightingStyle}  onChange={setLightingStyle}  color={C.amber}/>
                <PillGroup label="8. Komposisi"         options={OPT.composition}     value={composition}    onChange={setComposition}    color={C.green}/>
                <PillGroup label="9. Style Kamera"      options={OPT.cameraStyle}     value={cameraStyle}    onChange={setCameraStyle}    color={C.brand}/>
                <PillGroup label="10. Target Audiens"   options={OPT.targetAudience}  value={targetAudience} onChange={setTargetAudience} color={C.purple}/>
                <PillGroup label="11. Platform Target"  options={OPT.platform}        value={platform}       onChange={setPlatform}       color={C.green}/>
              </div>
            )}

            {/* Ratio + Count */}
            <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, padding:'16px' }}>
              <label style={lbl}>Ukuran Gambar</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
                {RATIOS.map(r => (
                  <button key={r.v} type="button" onClick={() => setRatio(r.v)}
                    style={{ padding:'5px 10px', borderRadius:'8px', border:`1.5px solid ${ratio===r.v?C.brand:C.slate200}`, background:ratio===r.v?C.brand:C.white, cursor:'pointer', fontSize:'10px', fontWeight:700, color:ratio===r.v?C.white:C.slate600, transition:'all .12s' }}>
                    {r.l}
                  </button>
                ))}
              </div>

              <label style={lbl}>Jumlah Gambar</label>
              <div style={{ display:'flex', gap:'6px' }}>
                {[1,2,4].map(n => (
                  <button key={n} type="button" onClick={() => setCount(n)}
                    style={{ flex:1, padding:'8px', borderRadius:'9px', border:`1.5px solid ${count===n?C.brand:C.slate200}`, background:count===n?C.brand:C.white, cursor:'pointer', fontSize:'14px', fontWeight:700, color:count===n?C.white:C.slate700 }}>
                    {n}×
                  </button>
                ))}
              </div>
            </div>

            {/* Custom prompt + negative */}
            <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, padding:'16px' }}>
              <label style={lbl}>Tambahan Prompt (opsional)</label>
              <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                placeholder='Contoh: "with floating confetti", "golden ribbon packaging"...' rows={2}
                style={{ ...inp, resize:'vertical', marginBottom:'8px' }}
              />
              <button type="button" onClick={() => setShowNeg(s=>!s)}
                style={{ fontSize:'11px', color:C.slate500, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                {showNeg ? <ChevronUp size={11}/> : <ChevronDown size={11}/>} Negative prompt
              </button>
              {showNeg && (
                <textarea value={negPrompt} onChange={e => setNegPrompt(e.target.value)}
                  placeholder='Hal yang ingin dihindari: "blurry, watermark, text..."' rows={2}
                  style={{ ...inp, resize:'vertical', marginTop:'8px', borderColor:C.red+'60' }}
                />
              )}
            </div>

            {error && (
              <div style={{ padding:'10px 12px', background:C.red50, border:`1px solid #FECACA`, borderRadius:'10px', fontSize:'12px', color:C.red, display:'flex', gap:'6px', alignItems:'flex-start' }}>
                <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>{error}
              </div>
            )}

            {/* Generate button */}
            <button type="button" onClick={generate} disabled={loading || !productName.trim()}
              style={{ width:'100%', padding:'14px', borderRadius:'13px', border:'none', background: loading || !productName.trim() ? C.slate200 : 'linear-gradient(135deg, #7C3AED, #2563EB)', color: loading || !productName.trim() ? C.slate400 : C.white, fontSize:'14px', fontWeight:700, cursor: loading || !productName.trim() ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow: loading || !productName.trim() ? 'none' : '0 6px 20px rgba(124,58,237,.35)', transition:'all .15s' }}>
              {loading ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Generating {count} gambar...</> : <><Sparkles size={15}/>Generate {count} Gambar AI</>}
            </button>

            {/* Prompt preview */}
            {generatedPrompt && (
              <div style={{ padding:'12px', background:'#F8F0FF', borderRadius:'10px', border:`1px solid #DDD6FE` }}>
                <div style={{ fontSize:'10px', fontWeight:700, color:C.purple, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'5px' }}>
                  <Wand2 size={10}/> AI Generated Prompt
                </div>
                <div style={{ fontSize:'10px', color:C.slate700, lineHeight:1.6, wordBreak:'break-word' }}>
                  {generatedPrompt.slice(0, 200)}...
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT RESULTS ──────────────────────────── */}
          <div>
            {results.length > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>
                  Hasil Generate
                  {loadingCount > 0 && <span style={{ marginLeft:'8px', fontSize:'11px', color:C.amber }}>· {loadingCount} sedang diproses</span>}
                  {readyCount > 0 && <span style={{ marginLeft:'8px', fontSize:'11px', color:C.green }}>· {readyCount} siap</span>}
                </div>
                <button type="button" onClick={generate} disabled={loading}
                  style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
                  <RefreshCw size={11}/> Generate Ulang
                </button>
              </div>
            )}

            {results.length > 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:count===1?'1fr':'repeat(2,1fr)', gap:'12px' }}>
                {results.map(r => (
                  <ResultCard key={r.id} r={r} productName={productName}
                    onLightbox={setLightbox}
                    onSave={saveImage}
                    onUpscale={upscaleImage}
                    onRegenerate={id => { /* re-poll or regenerate single */ }}
                    savedIds={savedIds}
                    upscaledIds={upscaledIds}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'400px', borderRadius:'20px', border:`2px dashed ${C.slate200}`, background:C.slate50 }}>
                <div style={{ fontSize:'60px', opacity:.3, marginBottom:'16px' }}>📸</div>
                <div style={{ fontSize:'16px', fontWeight:700, color:C.slate700, marginBottom:'6px' }}>
                 AI Visual Marketing Engine
                </div>
                <div style={{ fontSize:'13px', color:C.slate400, textAlign:'center', maxWidth:'280px', lineHeight:1.6, marginBottom:'20px' }}>
                  Isi nama produk, pilih mode Quick atau Advanced, klik Generate
                </div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', justifyContent:'center' }}>
                  {['📸 Hyper Realistic','💎 Luxury Branding','🎬 UGC Style'].map(s => (
                    <span key={s} style={{ padding:'5px 12px', borderRadius:'20px', background:C.pur50, border:`1px solid ${C.purple}30`, fontSize:'11px', fontWeight:600, color:C.purple }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div style={{ padding:'20px', background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, textAlign:'center', color:C.slate400 }}>
          <History size={32} style={{ margin:'0 auto 10px', opacity:.4 }}/>
          <div style={{ fontSize:'14px', fontWeight:700, color:C.slate700 }}>Riwayat Generate</div>
          <div style={{ fontSize:'12px', marginTop:'4px' }}>Semua gambar yang pernah kamu generate akan muncul di sini</div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(6px)' }}>
          <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:'16px', right:'16px', width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,.15)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18} color="white"/>
          </button>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:'12px', boxShadow:'0 25px 60px rgba(0,0,0,.5)' }}/>
          <div style={{ position:'absolute', bottom:'20px', display:'flex', gap:'10px' }}>
            <button onClick={async () => {
              const res = await fetch(lightbox); const blob = await res.blob()
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
              a.download = `beesell-${Date.now()}.png`; a.click()
            }} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 20px', borderRadius:'10px', background:C.white, border:'none', fontSize:'13px', fontWeight:700, cursor:'pointer', color:C.slate900 }}>
              <Download size={14}/> Download
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @media (max-width:767px) {
          div[style*="grid-template-columns:minmax(0,340px)"] { grid-template-columns:1fr!important }
        }
        * { box-sizing: border-box }
      `}</style>
    </div>
  )
}