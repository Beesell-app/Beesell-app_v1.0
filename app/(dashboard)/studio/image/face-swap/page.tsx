'use client'
// app/(dashboard)/studio/image/face-swap/page.tsx
// ══════════════════════════════════════════════════════════════
// FACE SWAP AI — Ganti wajah model dengan wajah sendiri
// ══════════════════════════════════════════════════════════════
//
// Per spec:
//   - Upload target photo (fashion/product photo with model)
//   - Upload face reference (your face / brand face / campaign face)
//   - Choose match mode:
//       Match Reference: max resemblance, keep ref expression & angle
//       Match Current Model: natural look, adapt face to body
//   - AI replaces ONLY the face — outfit, pose, lighting unchanged
//   - Max 2K resolution output

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, RefreshCw, X, Loader2, Sparkles,
  AlertCircle, ChevronRight, Info, ZoomIn, CheckCircle2,
  Camera, User, Maximize2, RotateCcw, Lightbulb, AlertTriangle,
} from 'lucide-react'

// ── Tokens — dark studio (distinct pink/rose accent for face swap) ─
const T = {
  bg:       '#09090B',
  surface:  '#111115',
  card:     '#18181C',
  border:   '#27272A',
  borderHi: '#3F3F46',
  accent:   '#F43F5E',   // rose-500 — face swap identity color
  accent2:  '#E11D48',
  accentLo: '#F43F5E12',
  accentMd: '#F43F5E28',
  gold:     '#F59E0B',
  goldLo:   '#F59E0B15',
  blue:     '#3B82F6',
  blueLo:   '#3B82F612',
  green:    '#10B981',
  greenLo:  '#10B98112',
  orange:   '#F97316',
  red:      '#EF4444',
  redLo:    '#EF444415',
  muted:    '#52525B',
  dimmed:   '#71717A',
  sub:      '#A1A1AA',
  text:     '#E4E4E7',
  white:    '#FAFAFA',
}

// ── Face quality tips ─────────────────────────────────────────
const FACE_TIPS = [
  { icon:'😊', tip:'Wajah menghadap kamera (frontal / 3/4 angle)' },
  { icon:'💡', tip:'Pencahayaan merata, tidak ada bayangan gelap di wajah' },
  { icon:'📐', tip:'Angle wajah referensi = angle wajah di foto target untuk hasil terbaik' },
  { icon:'🖼️', tip:'Resolusi min 400×400px, tidak buram atau pixelated' },
  { icon:'👓', tip:'Tidak ada aksesori yang menutupi wajah (masker, kacamata gelap)' },
]

const MATCH_MODES = [
  {
    id:    'match_reference',
    label: 'Match Reference',
    desc:  'Pertahankan ekspresi, angle & arah pandang dari foto wajah referensi. Pilih ini untuk maksimal kemiripan.',
    icon:  '🎯',
    badge: 'Maks Kemiripan',
    color: T.accent,
  },
  {
    id:    'match_current_model',
    label: 'Match Current Model',
    desc:  'Adaptasi wajah referensi ke pose & ekspresi model saat ini. Pilih ini untuk hasil yang lebih natural.',
    icon:  '🌿',
    badge: 'Lebih Natural',
    color: T.green,
  },
]

// ── Upload Zone ───────────────────────────────────────────────
interface UploadZoneProps {
  label:     string
  sublabel:  string
  icon:      string
  badge?:    string
  preview:   string | null
  onFile:    (f: File) => void
  onClear:   () => void
  accent:    string
  required?: boolean
  tips?:     string[]
  compact?:  boolean
}

function UploadZone({ label, sublabel, icon, badge, preview, onFile, onClear, accent, required, tips, compact }: UploadZoneProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const pick = () => ref.current?.click()
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = '' }
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'12px', fontWeight:600, color:T.text }}>{label}</span>
          {badge && <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', background:`${accent}20`, color:accent, textTransform:'uppercase', letterSpacing:'0.06em' }}>{badge}</span>}
          {required && <span style={{ fontSize:'9px', fontWeight:700, color:T.accent, padding:'2px 5px', borderRadius:'4px', background:`${T.accent}15` }}>WAJIB</span>}
        </div>
        {preview && (
          <button onClick={onClear} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:T.dimmed, background:'none', border:'none', cursor:'pointer', padding:'2px 5px', borderRadius:'4px', transition:'color .12s' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T.red}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T.dimmed}>
            <X size={11}/> Hapus
          </button>
        )}
      </div>
      <div
        onClick={pick}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={handleDrop}
        style={{ borderRadius:'12px', border:`1.5px dashed ${drag ? accent : preview ? `${accent}50` : T.border}`, background:drag ? `${accent}07` : preview ? T.surface : 'rgba(255,255,255,.018)', cursor:'pointer', overflow:'hidden', transition:'all .18s', minHeight:compact ? '140px' : '190px', position:'relative' }}>
        {preview ? (
          <img src={preview} alt={label} style={{ width:'100%', minHeight:compact ? '140px' : '190px', objectFit:'cover', display:'block' }}/>
        ) : (
          <div style={{ padding:compact ? '24px 16px' : '32px 18px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px', minHeight:compact ? '140px' : '190px' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${accent}12`, border:`1.5px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>{icon}</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'12px', fontWeight:600, color:T.text, marginBottom:'3px' }}>{label}</div>
              <div style={{ fontSize:'10px', color:T.dimmed, lineHeight:1.5 }}>{sublabel}</div>
            </div>
            {tips && !compact && (
              <div style={{ display:'flex', flexDirection:'column', gap:'3px', width:'100%', maxWidth:'220px' }}>
                {tips.slice(0,3).map((tip, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'5px', fontSize:'9px', color:T.muted }}>
                    <span style={{ color:accent, flexShrink:0 }}>·</span>
                    <span style={{ lineHeight:1.4 }}>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {drag && (
          <div style={{ position:'absolute', inset:0, background:`${accent}10`, border:`2px solid ${accent}`, borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:accent }}>Drop di sini ✓</div>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={handleChange}/>
    </div>
  )
}

// ── Before/After slider ───────────────────────────────────────
function BASlider({ before, after, labelA='Asli', labelB='Swap' }: { before:string; after:string; labelA?:string; labelB?:string }) {
  const [pos, setPos]   = useState(50)
  const track           = useRef<HTMLDivElement>(null)
  const dragging        = useRef(false)

  const update = (cx: number) => {
    if (!track.current) return
    const r = track.current.getBoundingClientRect()
    setPos(Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100)))
  }

  return (
    <div ref={track}
      style={{ position:'relative', borderRadius:'12px', overflow:'hidden', cursor:'col-resize', userSelect:'none', touchAction:'none', aspectRatio:'4/5', background:T.card }}
      onMouseDown={e=>{ dragging.current=true; update(e.clientX) }}
      onMouseMove={e=>{ if(dragging.current) update(e.clientX) }}
      onMouseUp={()=>{ dragging.current=false }}
      onMouseLeave={()=>{ dragging.current=false }}
      onTouchStart={e=>{ dragging.current=true; update(e.touches[0].clientX) }}
      onTouchMove={e=>{ if(dragging.current) update(e.touches[0].clientX) }}
      onTouchEnd={()=>{ dragging.current=false }}>
      {/* After image — full */}
      <img src={after} alt="Setelah" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
      {/* Before — clipped left */}
      <div style={{ position:'absolute', inset:0, clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <img src={before} alt="Sebelum" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
      </div>
      {/* Divider */}
      <div style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, width:'2px', background:'rgba(255,255,255,.9)', transform:'translateX(-50%)', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'30px', height:'30px', borderRadius:'50%', background:T.white, border:`2px solid ${T.accent}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(0,0,0,.5)', fontSize:'12px' }}>⇄</div>
      </div>
      {/* Labels */}
      <div style={{ position:'absolute', top:'10px', left:'10px', padding:'3px 8px', borderRadius:'5px', background:'rgba(0,0,0,.65)', fontSize:'10px', fontWeight:700, color:T.white, backdropFilter:'blur(4px)' }}>{labelA}</div>
      <div style={{ position:'absolute', top:'10px', right:'10px', padding:'3px 8px', borderRadius:'5px', background:`${T.accent}dd`, fontSize:'10px', fontWeight:700, color:T.white }}>{labelB}</div>
      <div style={{ position:'absolute', bottom:'10px', left:'50%', transform:'translateX(-50%)', padding:'3px 10px', borderRadius:'5px', background:'rgba(0,0,0,.55)', fontSize:'9px', color:T.sub, whiteSpace:'nowrap', backdropFilter:'blur(4px)' }}>← Drag untuk perbandingan →</div>
    </div>
  )
}

// ── Face quality checker indicator ────────────────────────────
function FaceQualityHint({ hasFile }: { hasFile: boolean }) {
  if (!hasFile) return null
  return (
    <div style={{ marginTop:'6px', display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', color:T.green }}>
      <CheckCircle2 size={11}/>
      <span>Wajah referensi siap — AI akan menganalisis face landmarks</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function FaceSwapPage() {
  // Files
  const [targetFile,   setTargetFile]   = useState<File | null>(null)
  const [faceFile,     setFaceFile]     = useState<File | null>(null)
  const [targetPreview,setTargetPreview]= useState<string | null>(null)
  const [facePreview,  setFacePreview]  = useState<string | null>(null)

  // Config
  const [matchMode,    setMatchMode]    = useState<'match_reference' | 'match_current_model'>('match_current_model')

  // Result
  const [generating,   setGenerating]   = useState(false)
  const [result,       setResult]       = useState<string | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [elapsed,      setElapsed]      = useState<number | null>(null)
  const [showBA,       setShowBA]       = useState(false)
  const [quotaInfo,    setQuotaInfo]    = useState<{ used: number; limit: number } | null>(null)

  const [seconds, setSeconds]           = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // Handlers
  const handleTarget = useCallback((f: File) => {
    setTargetFile(f); setResult(null); setError(null); setShowBA(false)
    const url = URL.createObjectURL(f); setTargetPreview(url)
  }, [])
  const handleFace = useCallback((f: File) => {
    setFaceFile(f)
    const url = URL.createObjectURL(f); setFacePreview(url)
  }, [])
  const clearTarget = useCallback(() => { setTargetFile(null); setTargetPreview(null); setResult(null); setShowBA(false) }, [])
  const clearFace   = useCallback(() => { setFaceFile(null);   setFacePreview(null) }, [])

  // Generate
  const generate = useCallback(async () => {
    if (!targetFile || !faceFile) return
    setGenerating(true); setError(null); setResult(null); setElapsed(null); setShowBA(false); setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    try {
      const fd = new FormData()
      fd.append('target',    targetFile)
      fd.append('face',      faceFile)
      fd.append('matchMode', matchMode)

      const res = await fetch('/api/studio/face-swap', { method: 'POST', body: fd })

      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.upgrade) {
          setError('🔒 Face Swap hanya tersedia di plan Pro dan Business.')
        } else if (data.quotaExceeded) {
          setError(`⚠️ ${data.error}`)
        } else {
          setError(data.error ?? `Error ${res.status}`)
        }
        return
      }

      const contentType = res.headers.get('content-type') ?? ''
      const ms = parseInt(res.headers.get('x-elapsed-ms') ?? '0')
      const qU = parseInt(res.headers.get('x-quota-used') ?? '0')
      const qL = parseInt(res.headers.get('x-quota-limit') ?? '0')
      setElapsed(Math.round(ms / 1000))
      if (qU > 0) setQuotaInfo({ used: qU, limit: qL })

      if (contentType.startsWith('image/')) {
        const blob = await res.blob()
        setResult(URL.createObjectURL(blob))
        setShowBA(true)
      } else {
        const data = await res.json()
        if (data.url) { setResult(data.url); setShowBA(true) }
        else setError('Tidak ada output dari AI. Coba lagi.')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Kesalahan tak terduga')
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setGenerating(false)
    }
  }, [targetFile, faceFile, matchMode])

  const download = useCallback(() => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result; a.download = `beesell-face-swap-${matchMode}.png`; a.click()
  }, [result, matchMode])

  const currentMode = MATCH_MODES.find(m => m.id === matchMode)!
  const canGenerate = !!targetFile && !!faceFile && !generating

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:T.text }}>

      {/* Top bar */}
      <div style={{ borderBottom:`1px solid ${T.border}`, padding:'13px 20px', display:'flex', alignItems:'center', gap:'14px', background:T.surface, position:'sticky', top:0, zIndex:100 }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'6px', color:T.sub, textDecoration:'none', fontSize:'13px', transition:'color .12s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T.text}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T.sub}>
          <ArrowLeft size={15}/> Studio
        </Link>
        <div style={{ width:'1px', height:'16px', background:T.border }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:`${T.accent}15`, border:`1px solid ${T.accent}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>😊</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:T.white }}>Face Swap AI</div>
            <div style={{ fontSize:'10px', color:T.muted }}>Ganti wajah model, outfit & pose tetap</div>
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
          {quotaInfo && (
            <div style={{ padding:'4px 10px', borderRadius:'6px', background:T.card, border:`1px solid ${T.border}`, fontSize:'11px', color:T.sub }}>
              {quotaInfo.used}/{quotaInfo.limit} swap/bln
            </div>
          )}
          <div style={{ padding:'4px 10px', borderRadius:'6px', background:`${T.accent}12`, border:`1px solid ${T.accent}30`, fontSize:'11px', fontWeight:600, color:T.accent }}>Pro+ Only</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'360px 1fr', gap:'20px', alignItems:'flex-start' }}>

        {/* ════ LEFT — Controls ════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Concept card */}
          <div style={{ padding:'14px', borderRadius:'12px', background:`${T.accent}07`, border:`1px solid ${T.accent}25` }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:T.accent, marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
              <Info size={13}/> Face Swap — Hanya Wajah
            </div>
            <div style={{ fontSize:'11px', color:T.sub, lineHeight:1.7 }}>
              <span style={{ color:T.accent }}>✓ Dipertahankan:</span> outfit, pose, body shape, lighting, background<br/>
              <span style={{ color:'#FB923C' }}>🔄 Diganti:</span> wajah saja<br/>
              <span style={{ color:T.muted }}>Max resolusi output: 2K (per spec)</span>
            </div>
          </div>

          {/* ── Target photo ─────────────────────────────── */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <Camera size={14} color={T.accent}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Foto Target</span>
              <span style={{ fontSize:'9px', color:T.accent, fontWeight:700, padding:'2px 6px', borderRadius:'4px', background:`${T.accent}15` }}>WAJIB</span>
            </div>
            <UploadZone
              label="Foto Fashion dengan Model"
              sublabel="Foto dengan model yang wajahnya ingin diganti. Outfit & pose dari foto ini dipertahankan."
              icon="📸"
              preview={targetPreview}
              onFile={handleTarget}
              onClear={clearTarget}
              accent={T.accent}
              required
              tips={['Full body atau half body model','Wajah terlihat jelas di foto','Resolusi min 800×800px']}
            />
            <div style={{ marginTop:'9px', padding:'9px 11px', borderRadius:'8px', background:`${T.blue}10`, border:`1px solid ${T.blue}25`, display:'flex', gap:'7px', alignItems:'flex-start' }}>
              <Lightbulb size={12} color={T.blue} style={{ flexShrink:0, marginTop:'1px' }}/>
              <div style={{ fontSize:'10px', color:'#93C5FD', lineHeight:1.6 }}>
                Untuk hasil terbaik, pastikan angle wajah di foto target <strong>mirip</strong> dengan angle di foto wajah referensi.
              </div>
            </div>
          </div>

          {/* ── Face reference ───────────────────────────── */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <User size={14} color={T.accent}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Wajah Referensi</span>
              <span style={{ fontSize:'9px', color:T.accent, fontWeight:700, padding:'2px 6px', borderRadius:'4px', background:`${T.accent}15` }}>WAJIB</span>
            </div>
            <UploadZone
              label="Upload Foto Wajah"
              sublabel="Foto wajah yang akan di-paste ke foto target. Frontal atau 3/4 angle, pencahayaan merata."
              icon="😊"
              preview={facePreview}
              onFile={handleFace}
              onClear={clearFace}
              accent={T.accent}
              required
              tips={['Wajah depan atau 3/4 angle','Pencahayaan merata, tidak ada bayangan','Min. 400×400px, wajah jelas']}
            />
            <FaceQualityHint hasFile={!!faceFile}/>

            {/* Face tips */}
            <div style={{ marginTop:'10px', padding:'10px 12px', borderRadius:'8px', background:`${T.accent}08`, border:`1px solid ${T.accent}20` }}>
              <div style={{ fontSize:'10px', fontWeight:700, color:T.accent, marginBottom:'7px' }}>💡 Tips Foto Wajah Terbaik</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                {FACE_TIPS.map((t, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'6px', fontSize:'10px', color:T.sub }}>
                    <span style={{ fontSize:'11px', flexShrink:0 }}>{t.icon}</span>
                    <span style={{ lineHeight:1.5 }}>{t.tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Match Mode ──────────────────────────────── */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <Sparkles size={14} color={T.accent}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Match Mode</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {MATCH_MODES.map(m => {
                const sel = matchMode === m.id
                return (
                  <button key={m.id} type="button" onClick={() => setMatchMode(m.id as any)}
                    style={{ padding:'12px 13px', borderRadius:'11px', border:`1.5px solid ${sel ? m.color : T.border}`, background:sel ? `${m.color}10` : 'rgba(255,255,255,.018)', cursor:'pointer', textAlign:'left', transition:'all .15s', boxShadow:sel ? `0 0 0 1px ${m.color}30` : 'none' }}
                    onMouseEnter={e=>{ if(!sel)(e.currentTarget as HTMLElement).style.borderColor=T.borderHi }}
                    onMouseLeave={e=>{ if(!sel)(e.currentTarget as HTMLElement).style.borderColor=T.border }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'5px' }}>
                      <span style={{ fontSize:'17px' }}>{m.icon}</span>
                      <span style={{ fontSize:'12px', fontWeight:700, color:sel ? m.color : T.text }}>{m.label}</span>
                      <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', background:`${m.color}20`, color:m.color, marginLeft:'auto' }}>{m.badge}</span>
                    </div>
                    <div style={{ fontSize:'11px', color:T.sub, lineHeight:1.5, paddingLeft:'24px' }}>{m.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Limitation note */}
          <div style={{ padding:'11px 13px', borderRadius:'10px', background:T.card, border:`1px solid ${T.border}`, display:'flex', gap:'8px', alignItems:'flex-start' }}>
            <AlertTriangle size={13} color={T.gold} style={{ flexShrink:0, marginTop:'1px' }}/>
            <div style={{ fontSize:'10px', color:T.sub, lineHeight:1.6 }}>
              <strong style={{ color:T.gold }}>Batasan:</strong> Output maksimal resolusi 2K.
              Face Swap hanya cocok jika model target dan wajah referensi memiliki <strong>gender, usia & etnis yang sama</strong>.
              Untuk perbedaan besar → gunakan <Link href="/studio/image/model-swap" style={{ color:T.accent, textDecoration:'none' }}>Model Swap</Link>.
            </div>
          </div>

          {/* Vs comparison */}
          <div style={{ padding:'12px 14px', borderRadius:'10px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:T.sub, marginBottom:'8px' }}>Face Swap vs Fitur Lain</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
              {[
                { icon:'😊', color:T.accent,  label:'Face Swap',        desc:'Ganti wajah saja' },
                { icon:'🔄', color:'#10B981', label:'Model Swap',        desc:'Ganti seluruh orang + wajah' },
                { icon:'👗', color:'#A855F7', label:'AI Try-On',         desc:'Ganti pakaian di foto model' },
                { icon:'🧑‍🦰', color:'#EC4899', label:'Product to Model', desc:'Produk + tambah model baru' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'10px', color:T.muted }}>
                  <span style={{ fontSize:'13px' }}>{item.icon}</span>
                  <span style={{ color:item.color, fontWeight:600, minWidth:'90px' }}>{item.label}</span>
                  <span>→ {item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button type="button" onClick={generate} disabled={!canGenerate}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'14px', borderRadius:'12px', width:'100%', border:'none', cursor:canGenerate ? 'pointer' : 'not-allowed', background:canGenerate ? `linear-gradient(135deg,${T.accent},${T.accent2})` : T.muted, color:'#fff', fontSize:'14px', fontWeight:700, opacity:canGenerate ? 1 : .45, transition:'all .18s', boxShadow:canGenerate ? `0 4px 20px ${T.accent}35` : 'none', fontFamily:'inherit' }}
            onMouseEnter={e=>{ if(canGenerate)(e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}>
            {generating ? (
              <><Loader2 size={16} style={{ animation:'spin .8s linear infinite' }}/> Face Swap sedang berjalan... {seconds}s</>
            ) : (
              <><Sparkles size={16}/> Jalankan Face Swap</>
            )}
          </button>
          {(!targetFile || !faceFile) && !generating && (
            <div style={{ fontSize:'10px', color:T.muted, textAlign:'center', marginTop:'-4px' }}>
              {!targetFile && !faceFile ? 'Upload foto target + foto wajah untuk memulai' : !targetFile ? 'Upload foto target terlebih dulu' : 'Upload foto wajah referensi terlebih dulu'}
            </div>
          )}
        </div>

        {/* ════ RIGHT — Results ════ */}
        <div>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <div>
              <div style={{ fontSize:'15px', fontWeight:700, color:T.white }}>Hasil Face Swap</div>
              <div style={{ fontSize:'11px', color:T.muted, marginTop:'2px' }}>
                {result
                  ? `${currentMode.label} · ${elapsed ? `${elapsed}s` : '–'} · Max 2K`
                  : 'Upload kedua foto dan pilih mode untuk memulai'}
              </div>
            </div>
            {result && (
              <div style={{ display:'flex', gap:'7px' }}>
                <button type="button" onClick={() => setShowBA(!showBA)}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${showBA ? T.accent : T.border}`, background:showBA ? `${T.accent}12` : 'transparent', color:showBA ? T.accent : T.sub, fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all .12s', fontFamily:'inherit' }}>
                  <ZoomIn size={13}/> Before/After
                </button>
                <button type="button" onClick={generate} disabled={!canGenerate}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'transparent', color:T.sub, fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all .12s', fontFamily:'inherit' }}>
                  <RefreshCw size={13}/> Ulang
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'14px', borderRadius:'12px', background:`${T.red}10`, border:`1px solid ${T.red}35`, display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'14px' }}>
              <AlertCircle size={16} color={T.red} style={{ flexShrink:0, marginTop:'1px' }}/>
              <div>
                <div style={{ fontSize:'13px', fontWeight:600, color:T.red, marginBottom:'3px' }}>Generate Gagal</div>
                <div style={{ fontSize:'12px', color:'#FCA5A5', lineHeight:1.5 }}>{error}</div>
                {error.includes('Pro') && (
                  <Link href="/billing" style={{ display:'inline-flex', alignItems:'center', gap:'4px', marginTop:'8px', padding:'6px 12px', borderRadius:'7px', background:`linear-gradient(135deg,${T.gold},#D97706)`, color:'#fff', fontSize:'11px', fontWeight:700, textDecoration:'none' }}>
                    <ChevronRight size={11}/> Upgrade ke Pro
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Loading */}
          {generating && (
            <div style={{ borderRadius:'16px', background:T.card, border:`1px solid ${T.border}`, padding:'52px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'18px' }}>
              <div style={{ position:'relative', width:'68px', height:'68px' }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid ${T.accent}20` }}/>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid transparent`, borderTopColor:T.accent, animation:'spin .9s linear infinite' }}/>
                <div style={{ position:'absolute', inset:'16px', borderRadius:'50%', background:`${T.accent}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>😊</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:T.white, marginBottom:'6px' }}>AI sedang mengganti wajah...</div>
                <div style={{ fontSize:'12px', color:T.muted, marginBottom:'4px' }}>Mode: {currentMode.label}</div>
                <div style={{ fontSize:'11px', color:T.dimmed }}>Outfit, pose & background dipertahankan · {seconds}s</div>
              </div>
              <div style={{ display:'flex', gap:'10px', alignItems:'center', fontSize:'10px', color:T.muted }}>
                {['Deteksi wajah', 'Extract features', 'Swap & restore'].map((step, i) => {
                  const done = seconds > [3,8,15][i]
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px', color:done ? T.accent : T.muted }}>
                      {done ? <CheckCircle2 size={11} color={T.accent}/> : <div style={{ width:'11px', height:'11px', borderRadius:'50%', border:`1.5px solid ${T.border}` }}/>}
                      {step}
                      {i < 2 && <span style={{ color:T.border }}>→</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty */}
          {!generating && !result && !error && (
            <div style={{ borderRadius:'16px', background:T.card, border:`1.5px dashed ${T.border}`, padding:'52px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ width:'68px', height:'68px', borderRadius:'18px', background:`${T.accent}10`, border:`1.5px dashed ${T.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px' }}>😊</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'16px', fontWeight:700, color:T.sub, marginBottom:'8px' }}>Hasil Face Swap Muncul di Sini</div>
                <div style={{ fontSize:'12px', color:T.muted, lineHeight:1.7, maxWidth:'340px' }}>
                  Upload foto fashion + foto wajah referensi →<br/>
                  Pilih match mode →<br/>
                  AI ganti hanya wajah, pertahankan semua yang lain
                </div>
              </div>
              {/* Flow diagram */}
              <div style={{ display:'flex', gap:'8px', alignItems:'center', marginTop:'8px', padding:'14px 20px', borderRadius:'12px', background:'rgba(255,255,255,.02)', border:`1px solid ${T.border}` }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'24px', marginBottom:'4px' }}>📸</div>
                  <div style={{ fontSize:'9px', color:T.muted }}>Foto Target</div>
                  <div style={{ fontSize:'8px', color:T.dimmed }}>outfit + pose asli</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', color:T.muted, fontSize:'11px' }}>
                  <span>+</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'24px', marginBottom:'4px' }}>😊</div>
                  <div style={{ fontSize:'9px', color:T.muted }}>Foto Wajah</div>
                  <div style={{ fontSize:'8px', color:T.dimmed }}>identitas baru</div>
                </div>
                <div style={{ fontSize:'16px', color:T.accent }}>→</div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'24px', marginBottom:'4px' }}>✨</div>
                  <div style={{ fontSize:'9px', color:T.accent, fontWeight:600 }}>Face Swap</div>
                  <div style={{ fontSize:'8px', color:T.dimmed }}>wajah baru, outfit asli</div>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && !generating && (
            <div>
              {/* BA toggle / main image */}
              {showBA && targetPreview ? (
                <div style={{ marginBottom:'12px' }}>
                  <BASlider before={targetPreview} after={result} labelA="Asli" labelB="Face Swap"/>
                </div>
              ) : (
                <div style={{ borderRadius:'14px', overflow:'hidden', border:`1px solid ${T.border}`, marginBottom:'12px', position:'relative', background:T.surface }}>
                  <img src={result} alt="Face Swap Result" style={{ width:'100%', display:'block', maxHeight:'640px', objectFit:'contain' }}/>
                  {/* Badges */}
                  <div style={{ position:'absolute', top:'12px', left:'12px', padding:'4px 10px', borderRadius:'7px', background:'rgba(0,0,0,.65)', fontSize:'10px', fontWeight:700, color:T.accent, backdropFilter:'blur(6px)' }}>
                    😊 {currentMode.label}
                  </div>
                  {/* Overlay actions */}
                  <div style={{ position:'absolute', bottom:'12px', right:'12px', display:'flex', gap:'6px' }}>
                    <button type="button" onClick={() => setShowBA(!showBA)}
                      style={{ width:'34px', height:'34px', borderRadius:'8px', background:'rgba(0,0,0,.65)', border:`1px solid rgba(255,255,255,.15)`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <ZoomIn size={15} color={T.white}/>
                    </button>
                    <button type="button" onClick={download}
                      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:`linear-gradient(135deg,${T.accent},${T.accent2})`, border:'none', color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', boxShadow:`0 2px 12px ${T.accent}40`, fontFamily:'inherit' }}>
                      <Download size={13}/> Download
                    </button>
                  </div>
                </div>
              )}

              {/* Action row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'7px', marginBottom:'12px' }}>
                {[
                  { icon:<Download size={14}/>,   label:'Download',     action:download,            color:T.accent },
                  { icon:<ZoomIn size={14}/>,     label:'Before/After', action:()=>setShowBA(!showBA), color:T.blue },
                  { icon:<RefreshCw size={14}/>,  label:'Ulang',        action:generate,             color:T.sub },
                  { icon:<Maximize2 size={14}/>,  label:'Upscale 4K',   action:()=>{},               color:T.gold },
                ].map((btn, i) => (
                  <button key={i} type="button" onClick={btn.action}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', padding:'10px 5px', borderRadius:'10px', border:`1px solid ${T.border}`, background:T.card, color:btn.color, cursor:'pointer', transition:'all .15s', fontFamily:'inherit' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=btn.color;(e.currentTarget as HTMLElement).style.background=`${btn.color}10`}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=T.border;(e.currentTarget as HTMLElement).style.background=T.card}}>
                    {btn.icon}
                    <span style={{ fontSize:'10px', fontWeight:600 }}>{btn.label}</span>
                  </button>
                ))}
              </div>

              {/* Success info */}
              <div style={{ padding:'13px 14px', borderRadius:'11px', background:`${T.accent}07`, border:`1px solid ${T.accent}22`, display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'12px' }}>
                <CheckCircle2 size={16} color={T.accent} style={{ flexShrink:0, marginTop:'1px' }}/>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:T.accent, marginBottom:'3px' }}>
                    Face Swap Selesai — {currentMode.label} · {elapsed}s
                  </div>
                  <div style={{ fontSize:'11px', color:T.sub, lineHeight:1.6 }}>
                    Wajah berhasil diganti. Outfit, body shape, pose, lighting & background tetap terjaga.
                  </div>
                  <div style={{ display:'flex', gap:'6px', marginTop:'7px', flexWrap:'wrap' }}>
                    {['✅ Outfit terjaga','✅ Pose tetap','✅ Lighting sama','🔄 Wajah baru'].map(tag=>(
                      <span key={tag} style={{ fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'99px', background:'rgba(255,255,255,.06)', color:T.sub }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Troubleshoot */}
              <div style={{ padding:'12px 14px', borderRadius:'11px', background:T.card, border:`1px solid ${T.border}`, marginBottom:'12px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:T.sub, marginBottom:'8px', display:'flex', alignItems:'center', gap:'5px' }}>
                  <AlertTriangle size={12} color={T.gold}/> Hasil kurang tepat?
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                  {[
                    { prob:'Wajah tidak cocok di ukuran', sol:'Gunakan wajah referensi yang ukurannya mirip dengan wajah di foto target' },
                    { prob:'Ekspresi tidak natural',      sol:'Coba switch ke "Match Current Model" mode' },
                    { prob:'Wajah berbeda etnis/usia',    sol:'Gunakan Model Swap untuk perubahan yang lebih besar' },
                    { prob:'Wajah buram atau artefak',    sol:'Upload foto wajah referensi yang lebih sharp dan pencahayaan merata' },
                  ].map((item, i) => (
                    <div key={i} style={{ fontSize:'10px', color:T.muted, lineHeight:1.5 }}>
                      <span style={{ color:T.orange }}>· {item.prob}:</span> {item.sol}
                    </div>
                  ))}
                </div>
              </div>

              {/* Next steps */}
              <div style={{ padding:'13px 14px', borderRadius:'11px', background:T.card, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:T.white, marginBottom:'10px' }}>Langkah Selanjutnya</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
                  {[
                    { icon:'🔍', label:'Upscale 4K',       href:'/studio/image/upscale',     color:T.gold },
                    { icon:'✍️', label:'Edit & Adjust',    href:'/studio/image/edit',         color:T.blue },
                    { icon:'📐', label:'Crop Marketplace', href:'/quick-tools',               color:T.accent },
                  ].map((item, i) => (
                    <Link key={i} href={item.href}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', padding:'10px 5px', borderRadius:'9px', border:`1px solid ${T.border}`, background:'rgba(255,255,255,.02)', textDecoration:'none', transition:'all .15s' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=item.color;(e.currentTarget as HTMLElement).style.background=`${item.color}10`}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=T.border;(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.02)'}}>
                      <span style={{ fontSize:'16px' }}>{item.icon}</span>
                      <span style={{ fontSize:'10px', fontWeight:600, color:item.color, textAlign:'center' }}>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box }
        @keyframes spin { to { transform:rotate(360deg) } }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-thumb { background:#3F3F46; border-radius:3px }
        @media (max-width:860px) {
          div[style*="grid-template-columns: 360px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}