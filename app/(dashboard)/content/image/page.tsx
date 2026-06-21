'use client'
// apps/web-app/app/(dashboard)/content/image/page.tsx
// ── Generate Gambar AI — Bee Light Theme + Admin Gate + Tier-aware API ──
// featureId: 'ai-image-generator' (registry SSoT)
// Quality preset menentukan model + resolusi; dikunci per pricing plan.
// PENTING: server (/api/generate/image) WAJIB re-derive tier dari session,
//          clamp model/quality, dan charge credit sesuai quality — JANGAN
//          percaya field `tier`/`model` dari client (anti-bypass).

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Image as ImageIcon, Sparkles, Download, RefreshCw, ArrowLeft, Check,
  Loader2, AlertCircle, Info, ChevronDown, ChevronUp, BookmarkPlus,
  Lock, Crown, Infinity as InfinityIcon,
} from 'lucide-react'
import { ToolGate }        from '@/components/studio/ToolGate'
import { ToolAccessBadge } from '@/components/studio/ToolAccessBadge'
import { useFeatureGate }  from '@/hooks/use-feature-gate'
import { meetsTier }       from '@/components/dashboard/studio-menu-config'

const FEATURE_ID = 'ai-image-generator'

// ── Amber Lebah tokens (light) ────────────────────────────────
const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  honey:'#FDE68A', honeyDk:'#FBBF24',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB', borderHi:'#D1D5DB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', grn50:'#ECFDF5',
  red:'#EF4444', red50:'#FEF2F2',
  sh:'0 1px 3px rgba(0,0,0,.06)', sm:'0 4px 16px rgba(0,0,0,.08)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

// ── Style preset + booster prompt (kualitas tinggi) ───────────
const STYLES = [
  { value:'product-photo', label:'Foto Produk', icon:'📸', desc:'Studio putih bersih',
    boost:'professional commercial product photography, seamless clean white background, soft diffused studio softbox lighting, crisp reflections, ultra sharp focus, high detail, 8k, photorealistic' },
  { value:'lifestyle', label:'Lifestyle', icon:'🌿', desc:'Natural & aesthetic',
    boost:'premium lifestyle product photography, natural window light, warm aesthetic mood, shallow depth of field, bokeh, editorial quality, photorealistic, high detail' },
  { value:'banner', label:'Banner Promo', icon:'🎯', desc:'CTA + warna mencolok',
    boost:'eye-catching promotional banner composition, bold vibrant colors, dynamic layout, marketing hero shot, crisp clean, high contrast, advertising quality' },
  { value:'infographic', label:'Infografis', icon:'📊', desc:'Poin benefit visual',
    boost:'clean infographic layout, organized visual hierarchy, modern flat design accents, sharp typography space, balanced composition, high clarity' },
  { value:'social-media', label:'Social Media', icon:'📱', desc:'Square/portrait social',
    boost:'scroll-stopping social media product shot, trendy aesthetic, vibrant yet natural color grade, sharp focus, instagram quality, photorealistic' },
  { value:'thumbnail', label:'Thumbnail', icon:'🎬', desc:'TikTok & YouTube',
    boost:'high impact thumbnail composition, bold subject, strong contrast and saturation, attention grabbing, crisp detail, professional' },
]

// ── Quality preset → model + resolusi, DIKUNCI per tier ───────
// Mapping model di sini hanya HINT untuk UI; server yang menetapkan versi
// Replicate sebenarnya & meng-clamp ke tier user.
const QUALITY = [
  { id:'standard', label:'Standard', icon:'⚡', desc:'Cepat & hemat',       model:'flux-schnell', resolution:'1024', minTier:'starter' as const, credit:5  },
  { id:'high',     label:'High',     icon:'✨', desc:'Detail lebih tajam',  model:'flux-dev',     resolution:'1536', minTier:'basic'   as const, credit:8  },
  { id:'ultra',    label:'Ultra HD', icon:'💎', desc:'Kualitas komersial',  model:'flux-pro',     resolution:'2048', minTier:'pro'     as const, credit:15 },
]

const DEFAULT_NEGATIVE =
  'blurry, low quality, low resolution, distorted, deformed, watermark, signature, text, logo, jpeg artifacts, oversaturated, bad anatomy, extra limbs, duplicate, cropped'

const RATIOS = [
  { value:'1:1',  label:'Square',    desc:'Instagram, Feed',     w:1,  h:1  },
  { value:'4:5',  label:'Portrait',  desc:'Instagram Story',     w:4,  h:5  },
  { value:'9:16', label:'Vertikal',  desc:'Reels, TikTok',       w:9,  h:16 },
  { value:'16:9', label:'Landscape', desc:'YouTube, Web',        w:16, h:9  },
  { value:'4:3',  label:'Shopee',    desc:'Shopee / Tokopedia',  w:4,  h:3  },
]

const COLORS = [
  '#ffffff','#FFFBEB','#FEF3C7','#FDE68A','#FEE2E2','#EDE9FE',
  '#DBEAFE','#D1FAE5','#FCE7F3','#1E1B4B','#0F172A','#F59E0B',
]

// ══════════════════════════════════════════════════════════════
export default function ImageGeneratorPage() {
  return (
    <ToolGate featureId={FEATURE_ID} theme="light">
      <ImageGeneratorInner/>
    </ToolGate>
  )
}

function ImageGeneratorInner() {
  const router = useRouter()
  const gate   = useFeatureGate(FEATURE_ID)   // userTier, isSuperuser, dll

  const [productName,  setProductName]  = useState('')
  const [productDesc,  setProductDesc]  = useState('')
  const [style,        setStyle]        = useState('product-photo')
  const [quality,      setQuality]      = useState('standard')
  const [ratio,        setRatio]        = useState('1:1')
  const [bgColor,      setBgColor]      = useState('#ffffff')
  const [negative,     setNegative]     = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [loading,   setLoading]   = useState(false)
  const [jobId,     setJobId]     = useState<string|null>(null)
  const [polling,   setPolling]   = useState(false)
  const [media_url, setMediaUrl]  = useState<string|null>(null)
  const [error,     setError]     = useState('')
  const [saved,     setSaved]     = useState(false)
  const [progress,  setProgress]  = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const activeQ      = QUALITY.find(q => q.id === quality) ?? QUALITY[0]
  const activeStyle  = STYLES.find(s => s.value === style) ?? STYLES[0]
  const creditCost   = gate.isSuperuser ? '∞' : String(activeQ.credit)
  const isGenerating = loading || polling
  const selectedRatio= RATIOS.find(r => r.value === ratio)!

  const qLocked = (q: typeof QUALITY[number]) =>
    !gate.isSuperuser && !meetsTier(gate.userTier, q.minTier)

  const onPickQuality = (q: typeof QUALITY[number]) => {
    if (qLocked(q)) { router.push(`/billing?upgrade=${q.minTier}`); return }
    setQuality(q.id)
  }

  // ── Generate ───────────────────────────────────────────────
  const generate = async () => {
    if (!productName.trim()) { setError('Masukkan nama produk dulu'); return }
    if (qLocked(activeQ))    { router.push(`/billing?upgrade=${activeQ.minTier}`); return }
    setError(''); setLoading(true); setMediaUrl(null); setSaved(false); setProgress(10)

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          productDesc: productDesc.trim() || undefined,
          style, ratio, bgColor,
          // ── Tier-aware (server WAJIB validasi & clamp) ──
          quality:         activeQ.id,
          model:           activeQ.model,        // hint
          resolution:      activeQ.resolution,
          promptModifiers: activeStyle.boost,    // booster kualitas
          negativePrompt:  [DEFAULT_NEGATIVE, negative].filter(Boolean).join(', '),
          tier:            gate.userTier,        // hint — server re-derive dari session
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        // 402/403 = perlu upgrade plan
        if (res.status === 402 || res.status === 403 || e?.upgrade) {
          throw new Error('🔒 Quality ini butuh plan lebih tinggi. Upgrade untuk lanjut.')
        }
        throw new Error(e?.message ?? `HTTP ${res.status}`)
      }
      const { jobId: id } = await res.json()
      setJobId(id); setLoading(false); setPolling(true); setProgress(30)
      startPolling(id)
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan. Coba lagi.')
      setLoading(false); setProgress(0)
    }
  }

  const startPolling = (id: string) => {
    let count = 0; const MAX = 40
    pollRef.current = setInterval(async () => {
      count++; setProgress(Math.min(30 + count * 2, 90))
      if (count >= MAX) {
        clearInterval(pollRef.current!); setPolling(false)
        setError('Timeout. Coba generate ulang.'); setProgress(0); return
      }
      try {
        const r = await fetch(`/api/jobs/${id}/status`)
        const { status, media_url: url, error: jobError } = await r.json()
        if (status === 'completed' && url) {
          clearInterval(pollRef.current!); setPolling(false); setMediaUrl(url); setProgress(100)
        } else if (status === 'failed') {
          clearInterval(pollRef.current!); setPolling(false)
          setError(jobError || 'Generate gambar gagal. Coba lagi.'); setProgress(0)
        }
      } catch {}
    }, 3000)
  }

  const downloadImage = async () => {
    if (!media_url) return
    try {
      const blob = await (await fetch(media_url)).blob()
      const url  = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `beesell-${productName.replace(/\s+/g,'-').toLowerCase()}-${Date.now()}.png`
      a.click(); URL.revokeObjectURL(url)
    } catch { window.open(media_url, '_blank') }
  }

  const saveToLibrary = async () => {
    if (!media_url || !jobId) return
    try {
      await fetch('/api/library/save', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ jobId, media_url, productName }),
      })
      setSaved(true)
    } catch {}
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'10px 13px', borderRadius:10, border:`1.5px solid ${C.border}`,
    fontSize:14, fontFamily:"'DM Sans',sans-serif", color:C.ink, outline:'none',
    boxSizing:'border-box', background:C.white,
  }
  const lbl: React.CSSProperties = {
    fontSize:11, fontWeight:700, color:C.inkMuted, textTransform:'uppercase',
    letterSpacing:'0.07em', display:'block', marginBottom:6,
  }

  return (
    <div style={{ maxWidth:1040, margin:'0 auto', fontFamily:"'DM Sans',sans-serif", color:C.ink }}>

      {/* Back */}
      <Link href="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:C.inkDim, textDecoration:'none', marginBottom:16 }}>
        <ArrowLeft size={13}/> Dashboard
      </Link>

      {/* Title */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 12px ${C.amber}40` }}>
              <ImageIcon size={19} color="#fff"/>
            </div>
            <h1 style={{ fontSize:'clamp(20px,4vw,28px)', fontWeight:900, letterSpacing:'-0.03em', color:C.ink, margin:0 }}>
              🐝 Generate Gambar AI
            </h1>
          </div>
          <p style={{ fontSize:13, color:C.inkMuted, paddingLeft:48, margin:0 }}>
            Buat foto produk, banner promo & konten visual berkualitas tinggi dalam detik
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <ToolAccessBadge featureId={FEATURE_ID} theme="light"/>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:99, background:C.amberLt, border:`1px solid ${C.amber}30`, fontSize:11, fontWeight:800, color:C.amberDk }}>
            {gate.isSuperuser ? <Crown size={11}/> : null}
            {creditCost === '∞' ? <InfinityIcon size={12}/> : `${creditCost}⚡`} / gambar
          </span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,380px) minmax(0,1fr)', gap:20, alignItems:'start' }} className="ig-grid">

        {/* ══ LEFT: Config ══ */}
        <div style={{ background:C.surface, borderRadius:16, border:`1px solid ${C.border}`, padding:20, display:'flex', flexDirection:'column', gap:16, boxShadow:C.sh }}>

          <div>
            <label style={lbl}>Nama Produk <span style={{ color:C.red }}>*</span></label>
            <input value={productName} onChange={e => { setProductName(e.target.value); setError('') }}
              placeholder="Contoh: Serum Vitamin C 30ml" style={inp}
              onKeyDown={e => e.key === 'Enter' && !isGenerating && generate()}
              onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
              onBlur ={e => (e.target as HTMLElement).style.borderColor = C.border}/>
          </div>

          <div>
            <label style={lbl}>Deskripsi / Keunggulan</label>
            <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)}
              placeholder="Kandungan, warna, ukuran, benefit utama..." rows={2}
              style={{ ...inp, resize:'vertical' }}/>
          </div>

          {/* Style */}
          <div>
            <label style={lbl}>Gaya Gambar</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {STYLES.map(s => (
                <button key={s.value} type="button" onClick={() => setStyle(s.value)}
                  style={{ padding:'8px 10px', borderRadius:10, border:`1.5px solid ${style===s.value ? C.amber : C.border}`, background:style===s.value ? C.amberXlt : C.white, cursor:'pointer', textAlign:'left', transition:'all .12s' }}>
                  <div style={{ fontSize:15, marginBottom:2 }}>{s.icon}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:style===s.value ? C.amberDk : C.inkSub }}>{s.label}</div>
                  <div style={{ fontSize:9, color:C.inkDim }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality — gated per tier */}
          <div>
            <label style={lbl}>Kualitas Output</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
              {QUALITY.map(q => {
                const locked = qLocked(q)
                const active = quality === q.id
                return (
                  <button key={q.id} type="button" onClick={() => onPickQuality(q)}
                    title={locked ? `Butuh plan ${q.minTier.toUpperCase()}` : q.desc}
                    style={{ position:'relative', padding:'9px 6px', borderRadius:10, border:`1.5px solid ${active ? C.amber : C.border}`, background:active ? C.amberXlt : C.white, cursor:'pointer', textAlign:'center', transition:'all .12s', opacity:locked ? 0.7 : 1 }}>
                    {locked && (
                      <div style={{ position:'absolute', top:6, right:6 }}><Lock size={10} color={C.inkMuted}/></div>
                    )}
                    <div style={{ fontSize:15, marginBottom:2 }}>{q.icon}</div>
                    <div style={{ fontSize:11, fontWeight:800, color:active ? C.amberDk : C.ink }}>{q.label}</div>
                    <div style={{ fontSize:8, color:C.inkDim, lineHeight:1.3, marginTop:1 }}>{q.desc}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:locked ? C.inkMuted : C.amberDk, marginTop:3 }}>
                      {gate.isSuperuser ? '∞' : `${q.credit}⚡`}{locked ? ` · ${q.minTier.toUpperCase()}` : ''}
                    </div>
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize:9, color:C.inkDim, marginTop:5 }}>
              {activeQ.resolution}px · model {activeQ.model}
              {gate.isSuperuser && ' · superuser unlimited'}
            </div>
          </div>

          {/* Ratio */}
          <div>
            <label style={lbl}>Ukuran / Rasio</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {RATIOS.map(r => (
                <button key={r.value} type="button" onClick={() => setRatio(r.value)}
                  style={{ padding:'6px 10px', borderRadius:8, border:`1.5px solid ${ratio===r.value ? C.amber : C.border}`, background:ratio===r.value ? C.amberXlt : C.white, cursor:'pointer', fontSize:11, fontWeight:700, color:ratio===r.value ? C.amberDk : C.inkMuted, whiteSpace:'nowrap' }}>
                  {r.label} <span style={{ fontWeight:400, opacity:.7 }}>{r.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BG color */}
          <div>
            <label style={lbl}>Warna Background</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {COLORS.map(col => (
                <button key={col} type="button" onClick={() => setBgColor(col)}
                  style={{ width:28, height:28, borderRadius:7, background:col, border:`2px solid ${bgColor===col ? C.amber : col==='#ffffff' ? C.border : col}`, cursor:'pointer', outline:bgColor===col ? `2px solid ${C.amber}` : 'none', outlineOffset:2 }}/>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <button type="button" onClick={() => setShowAdvanced(s => !s)}
              style={{ width:'100%', padding:'9px 12px', background:C.bg, border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, fontWeight:700, color:C.inkMuted, fontFamily:'inherit' }}>
              <span>Pengaturan Lanjutan</span>
              {showAdvanced ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            {showAdvanced && (
              <div style={{ padding:12 }}>
                <label style={{ ...lbl, marginBottom:5 }}>Tambahan "Hindari" (negative prompt)</label>
                <input value={negative} onChange={e => setNegative(e.target.value)}
                  placeholder="mis. tangan jelek, teks, watermark..." style={{ ...inp, fontSize:12 }}/>
                <div style={{ fontSize:9, color:C.inkDim, marginTop:5, lineHeight:1.5 }}>
                  Negative prompt kualitas (blur, artifacts, dll) sudah otomatis ditambahkan.
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding:'10px 12px', background:C.red50, borderRadius:9, border:`1px solid #FECACA`, fontSize:12, color:C.red, display:'flex', alignItems:'flex-start', gap:6 }}>
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:1 }}/> {error}
              {error.includes('upgrade') || error.includes('Upgrade') ? (
                <Link href={`/billing?upgrade=${activeQ.minTier}`} style={{ marginLeft:4, fontWeight:700, color:C.amberDk, textDecoration:'none', whiteSpace:'nowrap' }}>Upgrade →</Link>
              ) : null}
            </div>
          )}

          <button type="button" onClick={generate} disabled={isGenerating || !productName.trim()}
            style={{ width:'100%', padding:13, borderRadius:12, border:'none',
              background: isGenerating || !productName.trim() ? C.inkDim : `linear-gradient(135deg,${C.amber},${C.amberDk})`,
              color:'#fff', fontSize:14, fontWeight:800, cursor: isGenerating || !productName.trim() ? 'not-allowed' : 'pointer',
              opacity: isGenerating || !productName.trim() ? .5 : 1,
              fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow: isGenerating || !productName.trim() ? 'none' : C.sa }}>
            {isGenerating
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> {loading ? 'Memproses...' : `Generating... (~${40 - Math.floor(progress/2)}s)`}</>
              : <><Sparkles size={15}/> Generate Gambar — {creditCost === '∞' ? <InfinityIcon size={13}/> : `${creditCost}⚡`}</>}
          </button>
        </div>

        {/* ══ RIGHT: Preview ══ */}
        <div style={{ background:C.surface, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:C.sh }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>Preview Gambar</div>
            {media_url && (
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={saveToLibrary} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:saved ? C.grn50 : C.white, fontSize:11, fontWeight:600, color:saved ? C.green : C.inkMuted, cursor:'pointer' }}>
                  {saved ? <><Check size={11}/>Tersimpan</> : <><BookmarkPlus size={11}/>Simpan</>}
                </button>
                <button onClick={downloadImage} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer' }}>
                  <Download size={11}/> Download
                </button>
              </div>
            )}
          </div>

          {isGenerating && (
            <div style={{ height:3, background:C.amberLt }}>
              <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, transition:'width .5s ease' }}/>
            </div>
          )}

          <div style={{ padding:20, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ width:'100%', maxWidth:480, aspectRatio:`${selectedRatio.w}/${selectedRatio.h}`, borderRadius:12, overflow:'hidden', position:'relative', background: media_url ? 'transparent' : `linear-gradient(135deg,${C.amberXlt},${C.amberLt})`, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {media_url ? (
                <img src={media_url} alt={productName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              ) : isGenerating ? (
                <div style={{ textAlign:'center', color:C.inkMuted }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🎨</div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4, color:C.ink }}>AI sedang menggambar...</div>
                  <div style={{ fontSize:11, color:C.inkDim }}>{activeQ.label} · {activeQ.resolution}px</div>
                  <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:16 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:C.amber, animation:`bounce 1.2s ease-in-out ${i*.2}s infinite` }}/>)}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', color:C.inkDim, padding:20 }}>
                  <div style={{ fontSize:48, marginBottom:12, opacity:.5 }}>🍯</div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.inkMuted, marginBottom:4 }}>Gambar akan muncul di sini</div>
                  <div style={{ fontSize:11 }}>Isi form kiri, klik Generate</div>
                </div>
              )}
            </div>

            <div style={{ marginTop:10, fontSize:11, color:C.inkDim, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ padding:'2px 7px', borderRadius:5, background:C.amberLt, color:C.amberDk, fontWeight:700 }}>{ratio}</span>
              <span>{selectedRatio.label}</span><span>·</span><span>{selectedRatio.desc}</span>
            </div>

            {media_url && (
              <button type="button" onClick={generate}
                style={{ marginTop:16, display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:`1px solid ${C.border}`, background:C.white, fontSize:12, fontWeight:600, color:C.inkMuted, cursor:'pointer' }}>
                <RefreshCw size={13}/> Generate Ulang
              </button>
            )}
          </div>

          {!media_url && !isGenerating && (
            <div style={{ padding:'14px 18px', borderTop:`1px solid ${C.border}`, background:C.amberXlt }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:11, color:C.inkSub }}>
                <Info size={13} style={{ flexShrink:0, marginTop:1, color:C.amberDk }}/>
                <span><strong>Tips:</strong> Makin detail deskripsi (warna, material, benefit) → makin akurat. Pilih <strong>Ultra HD</strong> untuk foto siap iklan berbayar.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @media (max-width:767px) { .ig-grid { grid-template-columns:1fr !important } }
      `}</style>
    </div>
  )
}