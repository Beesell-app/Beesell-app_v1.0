'use client'
// apps/web-app/app/(dashboard)/content/image/page.tsx
// ── Generate Gambar AI — dedicated page ───────────────────────
// Terpisah dari caption generator
// Pakai Replicate / Stable Diffusion via /api/generate/image (async + QStash)

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Image as ImageIcon, Sparkles, Download, RefreshCw,
  ArrowLeft, Check, Loader2, AlertCircle, Info,
  ChevronDown, ChevronUp, BookmarkPlus, Eye,
} from 'lucide-react'

const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#ffffff',
}

const STYLES = [
  { value:'product-photo',  label:'Foto Produk',   icon:'📸', desc:'Background putih bersih' },
  { value:'lifestyle',      label:'Lifestyle',      icon:'🌿', desc:'Nuansa natural & aesthetic' },
  { value:'banner',         label:'Banner Promo',   icon:'🎯', desc:'Teks CTA + warna mencolok' },
  { value:'infographic',    label:'Infografis',     icon:'📊', desc:'Poin benefit visual' },
  { value:'social-media',   label:'Social Media',   icon:'📱', desc:'Square/portrait social' },
  { value:'thumbnail',      label:'Thumbnail',      icon:'🎬', desc:'TikTok & YouTube thumbnail' },
]

const RATIOS = [
  { value:'1:1',    label:'Square',    desc:'Instagram, Feed', w:1, h:1 },
  { value:'4:5',    label:'Portrait',  desc:'Instagram Story', w:4, h:5 },
  { value:'9:16',   label:'Vertikal',  desc:'Reels, TikTok',  w:9, h:16 },
  { value:'16:9',   label:'Landscape', desc:'YouTube, Web',    w:16, h:9 },
  { value:'4:3',    label:'Shopee',    desc:'Shopee / Tokopedia', w:4, h:3 },
]

const COLORS = [
  '#ffffff','#F8FAFC','#FEF3C7','#FEE2E2','#EDE9FE','#DBEAFE',
  '#D1FAE5','#FCE7F3','#1E1B4B','#0F172A','#F59E0B','#EF4444',
]

export default function ImageGeneratorPage() {
  const [productName,  setProductName]  = useState('')
  const [productDesc,  setProductDesc]  = useState('')
  const [style,        setStyle]        = useState('product-photo')
  const [ratio,        setRatio]        = useState('1:1')
  const [bgColor,      setBgColor]      = useState('#ffffff')
  const [negative,     setNegative]     = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [loading,  setLoading]  = useState(false)
  const [jobId,    setJobId]    = useState<string|null>(null)
  const [polling,  setPolling]  = useState(false)
  const [media_url, setmedia_url] = useState<string|null>(null)
  const [error,    setError]    = useState('')
  const [saved,    setSaved]    = useState(false)
  const [progress, setProgress] = useState(0)

  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const generate = async () => {
    if (!productName.trim()) { setError('Masukkan nama produk dulu'); return }
    setError(''); setLoading(true); setmedia_url(null); setSaved(false); setProgress(10)

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          productDesc: productDesc.trim() || undefined,
          style, ratio, bgColor,
          negativePrompt: negative || undefined,
        }),
      })

      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e?.message ?? `HTTP ${res.status}`)
      }

      const { jobId: id } = await res.json()
      setJobId(id)
      setLoading(false)
      setPolling(true)
      setProgress(30)
      startPolling(id)

    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan. Coba lagi.')
      setLoading(false)
      setProgress(0)
    }
  }

  const startPolling = (id: string) => {
    let count = 0
    const MAX  = 40   // 40 × 3s = 2 menit
    pollRef.current = setInterval(async () => {
      count++
      setProgress(Math.min(30 + count * 2, 90))

      if (count >= MAX) {
        clearInterval(pollRef.current!)
        setPolling(false)
        setError('Timeout. Coba generate ulang.')
        setProgress(0)
        return
      }

      try {
        const r   = await fetch(`/api/jobs/${id}/status`)
        const { status, media_url: url, error: jobError } = await r.json()

        if (status === 'completed' && url) {
          clearInterval(pollRef.current!)
          setPolling(false)
          setmedia_url(url)
          setProgress(100)
        } else if (status === 'failed') {
          clearInterval(pollRef.current!)
          setPolling(false)
          setError(jobError || 'Generate gambar gagal. Coba lagi.')
          setProgress(0)
        }
      } catch {}
    }, 3000)
  }

  const downloadImage = async () => {
    if (!media_url) return
    try {
      const res  = await fetch(media_url)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `beesell-${productName.replace(/\s+/g,'-').toLowerCase()}-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch { window.open(media_url, '_blank') }
  }

  const saveToLibrary = async () => {
    if (!media_url || !jobId) return
    try {
      await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, media_url, productName }),
      })
      setSaved(true)
    } catch {}
  }

  const isGenerating = loading || polling
  const selectedRatio = RATIOS.find(r => r.value === ratio)!

  const inp: React.CSSProperties = {
    width:'100%', padding:'10px 13px', borderRadius:'10px',
    border:`1.5px solid ${C.slate200}`, fontSize:'14px',
    fontFamily:"'DM Sans', sans-serif", color:C.slate900,
    outline:'none', boxSizing:'border-box', background:C.white,
  }

  return (
    <div style={{ maxWidth:'1040px', margin:'0 auto', fontFamily:"'DM Sans', sans-serif" }}>

      {/* Back */}
      <Link href="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', color:C.slate400, textDecoration:'none', marginBottom:'16px' }}>
        <ArrowLeft size={13}/> Dashboard
      </Link>

      {/* Title */}
      <div style={{ marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg, #7C3AED, #2563EB)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ImageIcon size={18} color="white"/>
          </div>
          <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(20px,4vw,26px)', fontWeight:600, color:C.slate900, letterSpacing:'-0.02em' }}>
            Generate Gambar AI
          </h1>
        </div>
        <p style={{ fontSize:'13px', color:C.slate500, paddingLeft:'46px' }}>
          Buat foto produk, banner promo, dan konten visual dalam detik
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,380px) minmax(0,1fr)', gap:'20px', alignItems:'start' }}>

        {/* ── LEFT: Config Panel ─────────────────────────── */}
        <div style={{ background:C.white, borderRadius:'16px', border:`1px solid ${C.slate200}`, padding:'20px', display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Nama produk */}
          <div>
            <label style={{ fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>
              Nama Produk <span style={{ color:C.red }}>*</span>
            </label>
            <input value={productName} onChange={e => { setProductName(e.target.value); setError('') }}
              placeholder="Contoh: Serum Vitamin C 30ml" style={inp}
              onKeyDown={e => e.key === 'Enter' && !isGenerating && generate()}
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label style={{ fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>
              Deskripsi / Keunggulan
            </label>
            <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)}
              placeholder="Kandungan, warna, ukuran, benefit utama..." rows={2}
              style={{ ...inp, resize:'vertical' }}
            />
          </div>

          {/* Style */}
          <div>
            <label style={{ fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'8px' }}>
              Gaya Gambar
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
              {STYLES.map(s => (
                <button key={s.value} type="button" onClick={() => setStyle(s.value)}
                  style={{ padding:'8px 10px', borderRadius:'10px', border:`1.5px solid ${style===s.value ? C.purple : C.slate200}`, background:style===s.value ? C.pur50 : C.white, cursor:'pointer', textAlign:'left', transition:'all .12s' }}>
                  <div style={{ fontSize:'15px', marginBottom:'2px' }}>{s.icon}</div>
                  <div style={{ fontSize:'11px', fontWeight:700, color:style===s.value ? C.purple : C.slate700 }}>{s.label}</div>
                  <div style={{ fontSize:'9px', color:C.slate400 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ratio */}
          <div>
            <label style={{ fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'8px' }}>
              Ukuran / Rasio
            </label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {RATIOS.map(r => (
                <button key={r.value} type="button" onClick={() => setRatio(r.value)}
                  style={{ padding:'6px 10px', borderRadius:'8px', border:`1.5px solid ${ratio===r.value ? C.brand : C.slate200}`, background:ratio===r.value ? C.brand50 : C.white, cursor:'pointer', fontSize:'11px', fontWeight:700, color:ratio===r.value ? C.brand : C.slate600, transition:'all .12s', whiteSpace:'nowrap' }}>
                  {r.label} <span style={{ fontWeight:400, opacity:.7 }}>{r.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BG color */}
          <div>
            <label style={{ fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'8px' }}>
              Warna Background
            </label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {COLORS.map(col => (
                <button key={col} type="button" onClick={() => setBgColor(col)}
                  style={{ width:'28px', height:'28px', borderRadius:'7px', background:col, border:`2px solid ${bgColor===col ? C.brand : col==='#ffffff' ? C.slate200 : col}`, cursor:'pointer', transition:'all .12s', outline:bgColor===col ? `2px solid ${C.brand}` : 'none', outlineOffset:'2px' }}
                />
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div style={{ border:`1px solid ${C.slate100}`, borderRadius:'10px', overflow:'hidden' }}>
            <button type="button" onClick={() => setShowAdvanced(s => !s)}
              style={{ width:'100%', padding:'9px 12px', background:C.slate50, border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'11px', fontWeight:700, color:C.slate500, fontFamily:"'DM Sans', sans-serif" }}>
              <span>Pengaturan Lanjutan</span>
              {showAdvanced ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            {showAdvanced && (
              <div style={{ padding:'12px' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.slate500, display:'block', marginBottom:'5px' }}>Hindari (negative prompt)</label>
                <input value={negative} onChange={e => setNegative(e.target.value)}
                  placeholder="blurry, distorted, watermark, text..." style={{ ...inp, fontSize:'12px' }}
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'10px 12px', background:C.red50, borderRadius:'9px', border:`1px solid #FECACA`, fontSize:'12px', color:C.red, display:'flex', alignItems:'flex-start', gap:'6px' }}>
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/> {error}
            </div>
          )}

          {/* Generate button */}
          <button type="button" onClick={generate} disabled={isGenerating || !productName.trim()}
            style={{ width:'100%', padding:'13px', borderRadius:'12px', border:'none',
              background: isGenerating || !productName.trim() ? C.slate200 : 'linear-gradient(135deg, #7C3AED, #2563EB)',
              color: isGenerating || !productName.trim() ? C.slate400 : C.white,
              fontSize:'14px', fontWeight:700, cursor: isGenerating || !productName.trim() ? 'not-allowed' : 'pointer',
              fontFamily:"'DM Sans', sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              boxShadow: isGenerating ? 'none' : '0 4px 14px rgba(124,58,237,.35)',
              transition:'all .15s',
            }}>
            {isGenerating ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> {loading ? 'Memproses...' : `Generating... (~${40 - Math.floor(progress/2)}s)`}</> : <><ImageIcon size={15}/> Generate Gambar AI</>}
          </button>

        </div>

        {/* ── RIGHT: Preview Panel ────────────────────────── */}
        <div style={{ background:C.white, borderRadius:'16px', border:`1px solid ${C.slate200}`, overflow:'hidden' }}>

          {/* Header */}
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.slate100}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>Preview Gambar</div>
            {media_url && (
              <div style={{ display:'flex', gap:'6px' }}>
                <button onClick={saveToLibrary} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:saved ? C.grn50 : C.white, fontSize:'11px', fontWeight:600, color:saved ? C.green : C.slate600, cursor:'pointer' }}>
                  {saved ? <><Check size={11}/>Tersimpan</> : <><BookmarkPlus size={11}/>Simpan</>}
                </button>
                <button onClick={downloadImage} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'8px', border:'none', background:'linear-gradient(135deg, #7C3AED, #2563EB)', fontSize:'11px', fontWeight:700, color:C.white, cursor:'pointer' }}>
                  <Download size={11}/> Download
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {isGenerating && (
            <div style={{ height:'3px', background:C.slate100 }}>
              <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg, #7C3AED, #2563EB)', transition:'width .5s ease' }}/>
            </div>
          )}

          {/* Image area */}
          <div style={{ padding:'20px', display:'flex', flexDirection:'column', alignItems:'center' }}>

            {/* Aspect ratio container */}
            <div style={{
              width:'100%', maxWidth:'480px',
              aspectRatio:`${selectedRatio.w}/${selectedRatio.h}`,
              borderRadius:'12px', overflow:'hidden', position:'relative',
              background: media_url ? 'transparent' : `linear-gradient(135deg, ${C.pur50}, ${C.brand50})`,
              border:`1px solid ${C.slate200}`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {media_url ? (
                <img src={media_url} alt={productName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              ) : isGenerating ? (
                <div style={{ textAlign:'center', color:C.slate500 }}>
                  <div style={{ fontSize:'32px', marginBottom:'12px' }}>🎨</div>
                  <div style={{ fontSize:'13px', fontWeight:600, marginBottom:'4px' }}>AI sedang menggambar...</div>
                  <div style={{ fontSize:'11px', color:C.slate400 }}>Estimasi 30-60 detik</div>
                  <div style={{ display:'flex', justifyContent:'center', gap:'4px', marginTop:'16px' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:C.purple, animation:`bounce 1.2s ease-in-out ${i*.2}s infinite` }}/>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', color:C.slate400, padding:'20px' }}>
                  <div style={{ fontSize:'48px', marginBottom:'12px', opacity:.4 }}>🖼️</div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:C.slate500, marginBottom:'4px' }}>Gambar akan muncul di sini</div>
                  <div style={{ fontSize:'11px' }}>Isi form kiri, klik Generate</div>
                </div>
              )}
            </div>

            {/* Ratio label */}
            <div style={{ marginTop:'10px', fontSize:'11px', color:C.slate400, display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ padding:'2px 7px', borderRadius:'5px', background:C.slate100, fontWeight:600 }}>{ratio}</span>
              <span>{selectedRatio.label}</span>
              <span>·</span>
              <span>{selectedRatio.desc}</span>
            </div>

            {/* Generate lagi */}
            {media_url && (
              <button type="button" onClick={generate}
                style={{ marginTop:'16px', display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'10px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
                <RefreshCw size={13}/> Generate Ulang
              </button>
            )}
          </div>

          {/* Tips */}
          {!media_url && !isGenerating && (
            <div style={{ padding:'14px 18px', borderTop:`1px solid ${C.slate100}`, background:C.slate50 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'11px', color:C.slate500 }}>
                <Info size={13} style={{ flexShrink:0, marginTop:'1px', color:C.brand }}/>
                <span><strong>Tips:</strong> Makin detail deskripsi produk, makin akurat gambarnya. Sebutkan warna, material, dan keunggulan produk.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width:767px) {
          div[style*="grid-template-columns:minmax(0,380px)"] {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}