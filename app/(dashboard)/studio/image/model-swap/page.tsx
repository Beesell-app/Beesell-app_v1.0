'use client'
// app/(dashboard)/studio/image/model-swap/page.tsx
// ══════════════════════════════════════════════════════════════
// MODEL SWAP AI — Ganti model di foto fashion yang sudah ada
// ══════════════════════════════════════════════════════════════
//
// Per spec:
//   - Upload source image (outfit + pose + bg defined here)
//   - Select new identity (preset or custom)
//   - Optional: face reference for campaign consistency
//   - AI keeps outfit, pose, lighting, bg — changes person
//   - Run 1-4 variations, compare, download

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  Upload, Download, RefreshCw, X, Loader2, Sparkles,
  ArrowLeft, Check, AlertCircle, ChevronRight, Info,
  User, Shuffle, Camera, Palette, Scissors, ZoomIn,
  AlertTriangle, CheckCircle2, Maximize2,
} from 'lucide-react'
import {
  IDENTITY_PRESETS,
  IDENTITY_CATEGORIES,
  SKIN_TONE_OPTIONS,
  HAIRSTYLE_OPTIONS,
  BODY_TYPE_OPTIONS,
  RESULT_COUNT_OPTIONS,
  TIPS_BY_PRESET,
  type IdentityPresetId,
  type SkinToneId,
  type HairstyleId,
  type BodyTypeId,
} from '@/lib/studio/model-swap-presets'

// ── Design tokens — dark studio ───────────────────────────────
const T = {
  bg:       '#FAFAFA',
  surface:  '#FAFAFA',
  card:     '#FAFAFA',
  border:   '#27272A',
  borderHi: '#3F3F46',
  accent:   '#10B981',   // emerald — distinct from tryon (purple)
  accent2:  '#059669',
  accentLo: '#10B98115',
  accentMd: '#10B98130',
  gold:     '#F59E0B',
  goldLo:   '#F59E0B18',
  amber:    '#F59E0B',
  blue:     '#3B82F6',
  blueLo:   '#3B82F615',
  red:      '#EF4444',
  redLo:    '#EF444415',
  orange:   '#F97316',
  muted:    '#52525B',
  dimmed:   '#71717A',
  sub:      '#A1A1AA',
  text:     '#E4E4E7',
  white:    '#FAFAFA',
}

// ── Upload zone ───────────────────────────────────────────────
interface UploadZoneProps {
  label:     string
  sublabel:  string
  icon:      string
  badge?:    string
  preview:   string | null
  onFile:    (f: File) => void
  onClear:   () => void
  disabled?: boolean
  accent?:   string
  tips?:     string[]
  optional?: boolean
}

function UploadZone({
  label, sublabel, icon, badge, preview, onFile, onClear,
  disabled, accent = T.accent, tips, optional
}: UploadZoneProps) {
  const ref         = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const pick = useCallback(() => { if (!disabled) ref.current?.click() }, [disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [disabled, onFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { onFile(file); e.target.value = '' }
  }, [onFile])

  return (
    <div>
      {/* Label row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'13px', fontWeight:600, color:T.text }}>{label}</span>
          {badge && (
            <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', background:`${accent}20`, color:accent, textTransform:'uppercase', letterSpacing:'0.06em' }}>{badge}</span>
          )}
          {optional && (
            <span style={{ fontSize:'9px', fontWeight:600, padding:'2px 6px', borderRadius:'4px', background:'rgba(255,255,255,.06)', color:T.muted }}>Opsional</span>
          )}
        </div>
        {preview && (
          <button onClick={onClear} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:T.dimmed, background:'none', border:'none', cursor:'pointer', padding:'2px 6px', borderRadius:'4px', transition:'color .12s' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T.red}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T.dimmed}>
            <X size={11}/> Hapus
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onClick={pick}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          borderRadius:'12px', border:`1.5px dashed ${drag ? accent : preview ? `${accent}60` : T.border}`,
          background: drag ? `${accent}08` : preview ? T.surface : 'rgba(255,255,255,.02)',
          cursor: disabled ? 'not-allowed' : 'pointer', overflow:'hidden',
          transition:'all .18s', minHeight:'160px', position:'relative',
          opacity: disabled ? .5 : 1,
        }}
      >
        {preview ? (
          <img src={preview} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:'160px', display:'block' }}/>
        ) : (
          <div style={{ padding:'28px 20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px', minHeight:'160px' }}>
            <div style={{ width:'46px', height:'46px', borderRadius:'12px', background:`${accent}15`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>{icon}</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'13px', fontWeight:600, color:T.text, marginBottom:'3px' }}>{label}</div>
              <div style={{ fontSize:'11px', color:T.dimmed, lineHeight:1.5 }}>{sublabel}</div>
            </div>
            {tips && tips.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:'3px', width:'100%', maxWidth:'220px' }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'5px', fontSize:'10px', color:T.muted }}>
                    <span style={{ color:accent, marginTop:'1px', flexShrink:0 }}>·</span>
                    <span style={{ lineHeight:1.4 }}>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Drag overlay */}
        {drag && (
          <div style={{ position:'absolute', inset:0, background:`${accent}10`, border:`2px solid ${accent}`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:accent }}>Drop gambar di sini ✓</div>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display:'none' }} onChange={handleChange}/>
    </div>
  )
}

// ── Before/After slider ───────────────────────────────────────
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const update = useCallback((clientX: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }, [])

  return (
    <div ref={trackRef}
      style={{ position:'relative', borderRadius:'12px', overflow:'hidden', cursor:'col-resize', userSelect:'none', touchAction:'none' }}
      onMouseDown={e => { dragging.current = true; update(e.clientX) }}
      onMouseMove={e => { if (dragging.current) update(e.clientX) }}
      onMouseUp={() => { dragging.current = false }}
      onMouseLeave={() => { dragging.current = false }}
      onTouchStart={e => { dragging.current = true; update(e.touches[0].clientX) }}
      onTouchMove={e => { if (dragging.current) update(e.touches[0].clientX) }}
      onTouchEnd={() => { dragging.current = false }}>
      {/* After (full) */}
      <img src={after}  alt="Setelah Swap" style={{ display:'block', width:'100%', height:'100%', objectFit:'cover', minHeight:'320px' }}/>
      {/* Before (clipped) */}
      <div style={{ position:'absolute', inset:0, clipPath:`inset(0 ${100-pos}% 0 0)`, pointerEvents:'none' }}>
        <img src={before} alt="Sebelum" style={{ display:'block', width:'100%', height:'100%', objectFit:'cover', minHeight:'320px' }}/>
      </div>
      {/* Divider */}
      <div style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, width:'2px', background:'rgba(255,255,255,.9)', transform:'translateX(-50%)', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'28px', height:'28px', borderRadius:'50%', background:T.white, border:`2px solid ${T.accent}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,.4)' }}>
          <span style={{ fontSize:'10px' }}>⇄</span>
        </div>
      </div>
      {/* Labels */}
      <div style={{ position:'absolute', top:'10px', left:'10px', padding:'3px 8px', borderRadius:'5px', background:'rgba(0,0,0,.6)', fontSize:'10px', fontWeight:700, color:T.white, backdropFilter:'blur(4px)' }}>Asli</div>
      <div style={{ position:'absolute', top:'10px', right:'10px', padding:'3px 8px', borderRadius:'5px', background:`${T.accent}cc`, fontSize:'10px', fontWeight:700, color:T.white }}>Swap</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function ModelSwapPage() {
  // ── State ──────────────────────────────────────────────────
  const [sourceFile,     setSourceFile]     = useState<File | null>(null)
  const [faceRefFile,    setFaceRefFile]    = useState<File | null>(null)
  const [sourcePreview,  setSourcePreview]  = useState<string | null>(null)
  const [faceRefPreview, setFaceRefPreview] = useState<string | null>(null)

  // Identity
  const [activeCat,  setActiveCat]  = useState('lokal-wanita')
  const [presetId,   setPresetId]   = useState<IdentityPresetId>('wanita-indo-muda')
  const [skinTone,   setSkinTone]   = useState<SkinToneId | ''>('')
  const [hairstyle,  setHairstyle]  = useState<HairstyleId>('natural')
  const [bodyType,   setBodyType]   = useState<BodyTypeId>('slim')
  const [swapMode,   setSwapMode]   = useState<'subtle'|'balanced'|'strong'>('balanced')
  const [numResults, setNumResults] = useState(2)
  const [customText, setCustomText] = useState('')

  // Generate state
  const [generating, setGenerating] = useState(false)
  const [results,    setResults]    = useState<string[]>([])
  const [activeResult, setActiveResult] = useState(0)
  const [error,      setError]      = useState<string | null>(null)
  const [elapsed,    setElapsed]    = useState<number | null>(null)
  const [showBA,     setShowBA]     = useState(false)
  const [quotaInfo,  setQuotaInfo]  = useState<{ used: number; limit: number } | null>(null)

  // Timer
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const [seconds,  setSeconds]   = useState(0)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // ── File handlers ──────────────────────────────────────────
  const handleSource = useCallback((f: File) => {
    setSourceFile(f)
    setResults([])
    setError(null)
    setShowBA(false)
    const url = URL.createObjectURL(f)
    setSourcePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [])

  const handleFaceRef = useCallback((f: File) => {
    setFaceRefFile(f)
    const url = URL.createObjectURL(f)
    setFaceRefPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [])

  const clearSource = useCallback(() => {
    setSourceFile(null); setSourcePreview(null)
    setResults([]); setShowBA(false)
  }, [])

  const clearFaceRef = useCallback(() => {
    setFaceRefFile(null); setFaceRefPreview(null)
  }, [])

  // ── Generate ───────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!sourceFile) return

    setGenerating(true)
    setError(null)
    setResults([])
    setElapsed(null)
    setShowBA(false)
    setSeconds(0)

    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    try {
      const fd = new FormData()
      fd.append('source',     sourceFile)
      if (faceRefFile) fd.append('faceRef', faceRefFile)
      fd.append('preset',     presetId)
      fd.append('swapMode',   swapMode)
      fd.append('numResults', String(numResults))
      fd.append('hairstyle',  hairstyle)
      fd.append('bodyType',   bodyType)
      if (skinTone)   fd.append('skinTone',  skinTone)
      if (customText) fd.append('custom',    customText.trim())

      const res = await fetch('/api/studio/model-swap', { method:'POST', body:fd })

      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.upgrade) {
          setError('🔒 Fitur Model Swap hanya untuk plan Pro dan Business. Upgrade untuk akses.')
        } else if (data.quotaExceeded) {
          setError(`⚠️ ${data.error}`)
        } else {
          setError(data.error ?? `Error ${res.status}`)
        }
        return
      }

      const contentType = res.headers.get('content-type') ?? ''
      const elapsedMs   = parseInt(res.headers.get('x-elapsed-ms') ?? '0')
      const qUsed       = parseInt(res.headers.get('x-quota-used') ?? '0')
      const qLimit      = parseInt(res.headers.get('x-quota-limit') ?? '0')

      setElapsed(Math.round(elapsedMs / 1000))
      if (qUsed > 0) setQuotaInfo({ used: qUsed, limit: qLimit })

      if (contentType.startsWith('image/')) {
        // Single result as binary
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        setResults([url])
        setActiveResult(0)
        setShowBA(true)
      } else {
        // Multiple results as JSON
        const data = await res.json()
        if (data.urls?.length > 0) {
          setResults(data.urls)
          setActiveResult(0)
          if (data.urls.length === 1) setShowBA(true)
          if (data.quotaUsed) setQuotaInfo({ used: data.quotaUsed, limit: data.quotaLimit })
        } else {
          setError('Tidak ada output dari AI. Coba lagi.')
        }
      }

    } catch (err: any) {
      console.error('[model-swap] client error:', err)
      setError(err?.message ?? 'Terjadi kesalahan tak terduga')
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setGenerating(false)
    }
  }, [sourceFile, faceRefFile, presetId, swapMode, numResults, hairstyle, bodyType, skinTone, customText])

  // ── Download ───────────────────────────────────────────────
  const download = useCallback((url: string, idx: number) => {
    const a = document.createElement('a')
    a.href     = url
    a.download = `beesell-model-swap-${presetId}-${idx + 1}.png`
    a.click()
  }, [presetId])

  // ── Preset tips ────────────────────────────────────────────
  const currentPreset = IDENTITY_PRESETS[presetId]
  const tips = TIPS_BY_PRESET[presetId] ?? TIPS_BY_PRESET.default

  const swapModeLabel: Record<string, { label: string; desc: string; color: string }> = {
    subtle:   { label: 'Subtle',   desc: 'Perubahan halus, banyak pertahankan wajah asli',  color: T.blue },
    balanced: { label: 'Balanced', desc: 'Keseimbangan antara perubahan & kualitas',         color: T.accent },
    strong:   { label: 'Strong',   desc: 'Perubahan drastis identitas, ganti total',         color: T.orange },
  }

  // ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:T.text }}>

      {/* ── Top bar ────────────────────────────────────────── */}
      <div style={{ borderBottom:`1px solid ${T.border}`, padding:'14px 20px', display:'flex', alignItems:'center', gap:'14px', background:T.surface, position:'sticky', top:0, zIndex:100 }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'6px', color:T.sub, textDecoration:'none', fontSize:'13px', transition:'color .12s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=T.text}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T.sub}>
          <ArrowLeft size={15}/> Studio
        </Link>
        <div style={{ width:'1px', height:'16px', background:T.border }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:`${T.accent}18`, border:`1px solid ${T.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🔄</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:T.gold }}>Model Swap AI</div>
            <div style={{ fontSize:'10px', color:T.muted }}>Ganti model, pertahankan outfit & pose</div>
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
          {quotaInfo && (
            <div style={{ padding:'4px 10px', borderRadius:'6px', background:T.card, border:`1px solid ${T.border}`, fontSize:'11px', color:T.sub }}>
              {quotaInfo.used}/{quotaInfo.limit} swap/bln
            </div>
          )}
          <div style={{ padding:'4px 10px', borderRadius:'6px', background:`${T.accent}15`, border:`1px solid ${T.accent}30`, fontSize:'11px', fontWeight:600, color:T.accent }}>
            Pro+ Only
          </div>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────── */}
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'380px 1fr', gap:'20px', alignItems:'flex-start' }}>

        {/* ════════════════════════════════════════════════════
            LEFT PANEL — Controls
        ════════════════════════════════════════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Source image */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <Camera size={14} color={T.accent}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.gold, textTransform:'uppercase', letterSpacing:'0.06em' }}>Foto Sumber</span>
              <span style={{ fontSize:'9px', color:T.accent, fontWeight:700, padding:'2px 6px', borderRadius:'4px', background:`${T.accent}15` }}>WAJIB</span>
            </div>
            <UploadZone
              label="Upload Foto Fashion"
              sublabel="Foto dengan model/mannequin. Outfit, pose & background dari foto ini yang akan dipertahankan."
              icon="📸"
              preview={sourcePreview}
              onFile={handleSource}
              onClear={clearSource}
              accent={T.accent}
              tips={[
                'Min. resolusi 800×800px',
                'Model tegak, full body atau half body',
                'Background bersih untuk hasil terbaik',
              ]}
            />

            {/* Important note */}
            <div style={{ marginTop:'10px', padding:'10px 12px', borderRadius:'8px', background:'rgba(59,130,246,.08)', border:`1px solid ${T.blueLo}`, display:'flex', gap:'8px', alignItems:'flex-start' }}>
              <Info size={13} color={T.blue} style={{ flexShrink:0, marginTop:'1px' }}/>
              <div style={{ fontSize:'11px', color:'#93C5FD', lineHeight:1.6 }}>
                <strong>Yang dipertahankan AI:</strong> outfit, pose, lighting, background.<br/>
                <strong>Yang diganti:</strong> wajah, kulit, rambut, bentuk tubuh.
              </div>
            </div>
          </div>

          {/* Face reference (optional) */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <User size={14} color={T.gold}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Face Reference</span>
              <span style={{ fontSize:'9px', color:T.muted, fontWeight:600, padding:'2px 6px', borderRadius:'4px', background:'rgba(255,255,255,.06)' }}>Opsional</span>
            </div>
            <UploadZone
              label="Upload Wajah Referensi"
              sublabel="Foto wajah yang ingin digunakan. Cocok untuk konsistensi kampanye brand."
              icon="😊"
              preview={faceRefPreview}
              onFile={handleFaceRef}
              onClear={clearFaceRef}
              accent={T.gold}
              optional
              tips={[
                'Foto wajah depan, pencahayaan merata',
                'Tanpa aksesori yang menutupi wajah',
                'Buat dengan Create Face untuk konsistensi',
              ]}
            />
          </div>

          {/* Identity preset selector */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <Shuffle size={14} color={T.accent}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Pilih Identitas Baru</span>
            </div>

            {/* Category tabs */}
            <div style={{ display:'flex', gap:'4px', marginBottom:'12px', flexWrap:'wrap' }}>
              {IDENTITY_CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setActiveCat(cat.id)}
                  style={{ padding:'5px 10px', borderRadius:'6px', border:`1px solid ${activeCat===cat.id ? T.accent : T.border}`, background:activeCat===cat.id ? `${T.accent}15` : 'transparent', fontSize:'10px', fontWeight:activeCat===cat.id ? 700 : 500, color:activeCat===cat.id ? T.accent : T.sub, cursor:'pointer', transition:'all .12s', display:'flex', alignItems:'center', gap:'4px' }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Preset grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
              {IDENTITY_CATEGORIES.find(c=>c.id===activeCat)?.presets.map(pid => {
                const p = IDENTITY_PRESETS[pid]
                const selected = presetId === pid
                return (
                  <button key={pid} type="button" onClick={() => setPresetId(pid)}
                    style={{ padding:'11px 10px', borderRadius:'10px', border:`1.5px solid ${selected ? T.accent : T.border}`, background:selected ? `${T.accent}12` : 'rgba(255,255,255,.02)', cursor:'pointer', textAlign:'left', transition:'all .15s', boxShadow:selected ? `0 0 0 1px ${T.accent}40` : 'none' }}
                    onMouseEnter={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=T.borderHi }}
                    onMouseLeave={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=T.border }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                      <span style={{ fontSize:'18px' }}>{p.icon}</span>
                      <div>
                        <div style={{ fontSize:'11px', fontWeight:700, color:selected ? T.accent : T.text }}>{p.label}</div>
                      </div>
                      {selected && <Check size={11} color={T.accent} style={{ marginLeft:'auto', flexShrink:0 }}/>}
                    </div>
                    <div style={{ fontSize:'10px', color:T.muted, lineHeight:1.4 }}>{p.desc}</div>
                  </button>
                )
              })}
            </div>

            {/* Selected preset info */}
            {currentPreset && (
              <div style={{ marginTop:'10px', padding:'9px 11px', borderRadius:'8px', background:`${T.accent}08`, border:`1px solid ${T.accent}25` }}>
                <div style={{ fontSize:'11px', color:T.accent, fontWeight:600, marginBottom:'2px' }}>
                  {currentPreset.icon} {currentPreset.label}
                </div>
                <div style={{ fontSize:'10px', color:T.sub, lineHeight:1.5 }}>{currentPreset.desc}</div>
              </div>
            )}
          </div>

          {/* Skin tone override */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <Palette size={14} color={T.accent}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Skin Tone</span>
              <span style={{ fontSize:'9px', color:T.muted, padding:'2px 6px', borderRadius:'4px', background:'rgba(255,255,255,.06)' }}>Override Opsional</span>
            </div>
            <div style={{ display:'flex', gap:'7px' }}>
              {SKIN_TONE_OPTIONS.map(st => {
                const selected = skinTone === st.id
                return (
                  <button key={st.id} type="button" onClick={() => setSkinTone(skinTone === st.id ? '' : st.id)}
                    style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', padding:'8px 6px', borderRadius:'8px', border:`1.5px solid ${selected ? T.accent : T.border}`, background:'transparent', cursor:'pointer', transition:'all .12s' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:st.hex, border:`2px solid ${selected ? T.accent : 'rgba(255,255,255,.15)'}`, boxShadow:selected ? `0 0 0 2px ${T.accent}40` : 'none' }}/>
                    <div style={{ fontSize:'9px', color:selected ? T.accent : T.muted, fontWeight:selected ? 700 : 500 }}>{st.label}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop:'8px', fontSize:'10px', color:T.muted, textAlign:'center' }}>Kosong = gunakan skin tone default preset</div>
          </div>

          {/* Hairstyle */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <Scissors size={14} color={T.accent}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Hairstyle</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px' }}>
              {HAIRSTYLE_OPTIONS.map(h => {
                const selected = hairstyle === h.id
                return (
                  <button key={h.id} type="button" onClick={() => setHairstyle(h.id)}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 9px', borderRadius:'7px', border:`1px solid ${selected ? T.accent : T.border}`, background:selected ? `${T.accent}12` : 'transparent', cursor:'pointer', transition:'all .12s' }}>
                    <span style={{ fontSize:'13px' }}>{h.icon}</span>
                    <span style={{ fontSize:'10px', fontWeight:selected ? 700 : 500, color:selected ? T.accent : T.sub, textAlign:'left', lineHeight:1.3 }}>{h.label}</span>
                    {selected && <Check size={10} color={T.accent} style={{ marginLeft:'auto', flexShrink:0 }}/>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Body type + Swap mode */}
          <div style={{ padding:'16px', borderRadius:'14px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'12px' }}>
              <Sparkles size={14} color={T.accent}/>
              <span style={{ fontSize:'12px', fontWeight:700, color:T.white, textTransform:'uppercase', letterSpacing:'0.06em' }}>Pengaturan Swap</span>
            </div>

            {/* Body type */}
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'11px', color:T.sub, fontWeight:600, marginBottom:'7px' }}>Body Type</div>
              <div style={{ display:'flex', gap:'5px' }}>
                {BODY_TYPE_OPTIONS.map(bt => (
                  <button key={bt.id} type="button" onClick={() => setBodyType(bt.id)}
                    style={{ flex:1, padding:'7px 4px', borderRadius:'7px', border:`1px solid ${bodyType===bt.id ? T.accent : T.border}`, background:bodyType===bt.id ? `${T.accent}12` : 'transparent', fontSize:'9px', fontWeight:bodyType===bt.id ? 700 : 500, color:bodyType===bt.id ? T.accent : T.sub, cursor:'pointer', transition:'all .12s' }}>
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Swap intensity */}
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'11px', color:T.sub, fontWeight:600, marginBottom:'7px' }}>Intensitas Swap</div>
              <div style={{ display:'flex', gap:'5px' }}>
                {(['subtle','balanced','strong'] as const).map(mode => {
                  const m = swapModeLabel[mode]
                  return (
                    <button key={mode} type="button" onClick={() => setSwapMode(mode)}
                      style={{ flex:1, padding:'7px 4px', borderRadius:'7px', border:`1px solid ${swapMode===mode ? m.color : T.border}`, background:swapMode===mode ? `${m.color}12` : 'transparent', cursor:'pointer', transition:'all .12s' }}>
                      <div style={{ fontSize:'10px', fontWeight:swapMode===mode ? 700 : 500, color:swapMode===mode ? m.color : T.sub }}>{m.label}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop:'6px', fontSize:'10px', color:T.muted, lineHeight:1.5 }}>
                {swapModeLabel[swapMode].desc}
              </div>
            </div>

            {/* Number of results */}
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'11px', color:T.sub, fontWeight:600, marginBottom:'7px' }}>Jumlah Variasi</div>
              <div style={{ display:'flex', gap:'5px' }}>
                {RESULT_COUNT_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setNumResults(opt.value)}
                    style={{ flex:1, padding:'7px 4px', borderRadius:'7px', border:`1px solid ${numResults===opt.value ? T.accent : T.border}`, background:numResults===opt.value ? `${T.accent}12` : 'transparent', fontSize:'10px', fontWeight:numResults===opt.value ? 700 : 500, color:numResults===opt.value ? T.accent : T.sub, cursor:'pointer', transition:'all .12s' }}>
                    {opt.value}×
                  </button>
                ))}
              </div>
              <div style={{ marginTop:'6px', fontSize:'10px', color:T.muted }}>
                Lebih banyak variasi = lebih lama (parallel generate)
              </div>
            </div>

            {/* Custom prompt */}
            <div>
              <div style={{ fontSize:'11px', color:T.sub, fontWeight:600, marginBottom:'7px' }}>Custom Instruksi (Opsional)</div>
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder='Contoh: "natural makeup, friendly smile" atau "beard stubble, sunglasses"'
                maxLength={200}
                rows={2}
                style={{ width:'100%', background:'rgba(255,255,255,.04)', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'9px 11px', fontSize:'11px', color:T.text, resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.5, transition:'border-color .15s', boxSizing:'border-box' }}
                onFocus={e=>(e.target as HTMLElement).style.borderColor=T.accent}
                onBlur={e=>(e.target as HTMLElement).style.borderColor=T.border}
              />
              <div style={{ fontSize:'10px', color:T.muted, marginTop:'3px', textAlign:'right' }}>{customText.length}/200</div>
            </div>
          </div>

          {/* Tips */}
          <div style={{ padding:'14px', borderRadius:'12px', background:'rgba(16,185,129,.06)', border:`1px solid ${T.accent}25` }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:T.accent, marginBottom:'7px', display:'flex', alignItems:'center', gap:'5px' }}>
              <Info size={12}/> Tips — {currentPreset?.label}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'6px', fontSize:'11px', color:T.sub }}>
                  <span style={{ color:T.accent, marginTop:'2px', flexShrink:0 }}>✓</span>
                  <span style={{ lineHeight:1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generate}
            disabled={!sourceFile || generating}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              padding:'14px', borderRadius:'12px', width:'100%', border:'none', cursor: !sourceFile || generating ? 'not-allowed' : 'pointer',
              background: !sourceFile || generating ? T.muted : `linear-gradient(135deg,${T.accent},${T.accent2})`,
              color:'#fff', fontSize:'14px', fontWeight:700, opacity: !sourceFile || generating ? .5 : 1,
              transition:'all .18s', boxShadow: !sourceFile || generating ? 'none' : '0 4px 20px rgba(16,185,129,.35)',
              fontFamily:'inherit',
            }}
            onMouseEnter={e=>{ if(sourceFile&&!generating)(e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}>
            {generating ? (
              <>
                <Loader2 size={16} style={{ animation:'spin .8s linear infinite' }}/>
                Swap AI sedang berjalan... {seconds}s
              </>
            ) : (
              <>
                <Sparkles size={16}/>
                Jalankan Model Swap {numResults > 1 ? `(${numResults} variasi)` : ''}
              </>
            )}
          </button>

          {/* Spec reminder */}
          <div style={{ padding:'12px 14px', borderRadius:'10px', background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:'10px', color:T.muted, lineHeight:1.8 }}>
              <div style={{ color:T.sub, fontWeight:600, marginBottom:'4px' }}>🔄 Model Swap vs fitur lain</div>
              <div><span style={{ color:T.accent }}>Model Swap</span> → ada model, ganti orangnya</div>
              <div><span style={{ color:'#A855F7' }}>Product to Model</span> → foto produk, tambah model baru</div>
              <div><span style={{ color:'#EC4899' }}>AI Try-On</span> → foto model + foto baju baru</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            RIGHT PANEL — Results
        ════════════════════════════════════════════════════ */}
        <div>
          {/* Result header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <div>
              <div style={{ fontSize:'15px', fontWeight:700, color:T.gold }}>Hasil Model Swap</div>
              <div style={{ fontSize:'11px', color:T.muted, marginTop:'2px' }}>
                {results.length > 0
                  ? `${results.length} variasi • ${currentPreset?.label} • ${elapsed ? `${elapsed}s` : '–'}`
                  : 'Upload foto dan konfigurasi identitas untuk memulai'}
              </div>
            </div>
            {results.length > 0 && (
              <div style={{ display:'flex', gap:'7px' }}>
                {results.length > 1 && (
                  <button type="button" onClick={() => setShowBA(!showBA)}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'8px', border:`1px solid ${showBA ? T.accent : T.border}`, background:showBA ? `${T.accent}12` : 'transparent', color:showBA ? T.accent : T.sub, fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all .12s', fontFamily:'inherit' }}>
                    <ZoomIn size={13}/> Before/After
                  </button>
                )}
                <button type="button" onClick={generate} disabled={generating || !sourceFile}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'transparent', color:T.sub, fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all .12s', fontFamily:'inherit' }}>
                  <RefreshCw size={13}/> Ulang
                </button>
              </div>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div style={{ padding:'14px', borderRadius:'12px', background:`${T.red}12`, border:`1px solid ${T.red}40`, display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'14px' }}>
              <AlertCircle size={16} color={T.red} style={{ flexShrink:0, marginTop:'1px' }}/>
              <div>
                <div style={{ fontSize:'13px', fontWeight:600, color:T.red, marginBottom:'2px' }}>Generate Gagal</div>
                <div style={{ fontSize:'12px', color:'#FCA5A5', lineHeight:1.5 }}>{error}</div>
                {error.includes('Upgrade') && (
                  <Link href="/billing" style={{ display:'inline-flex', alignItems:'center', gap:'4px', marginTop:'8px', padding:'6px 12px', borderRadius:'7px', background:`linear-gradient(135deg,${T.gold},#D97706)`, color:'#fff', fontSize:'11px', fontWeight:700, textDecoration:'none' }}>
                    <ChevronRight size={11}/> Upgrade ke Pro
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Loading state */}
          {generating && (
            <div style={{ borderRadius:'16px', background:T.card, border:`1px solid ${T.border}`, padding:'48px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ position:'relative', width:'64px', height:'64px' }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid ${T.accent}25`, animation:'none' }}/>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid transparent`, borderTopColor:T.accent, animation:'spin .9s linear infinite' }}/>
                <div style={{ position:'absolute', inset:'16px', borderRadius:'50%', background:`${T.accent}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>🔄</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:T.white, marginBottom:'6px' }}>
                  AI sedang mengganti model...
                </div>
                <div style={{ fontSize:'12px', color:T.muted, marginBottom:'4px' }}>
                  {numResults > 1 ? `Generate ${numResults} variasi secara parallel` : 'Generate 1 variasi'}
                </div>
                <div style={{ fontSize:'11px', color:T.dimmed }}>
                  Outfit, pose & background dipertahankan · {seconds}s berjalan
                </div>
              </div>
              {/* Progress steps */}
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {[
                  { label:'Analisis foto', done: seconds > 5 },
                  { label:'Build prompt', done: seconds > 10 },
                  { label:'AI generate', done: seconds > 25 },
                  { label:'Finalisasi', done: false },
                ].map((step, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', color:step.done ? T.accent : T.muted }}>
                    {step.done ? <CheckCircle2 size={12} color={T.accent}/> : <div style={{ width:'12px', height:'12px', borderRadius:'50%', border:`1.5px solid ${T.border}` }}/>}
                    {step.label}
                    {i < 3 && <ChevronRight size={10} color={T.border}/>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty / placeholder */}
          {!generating && results.length === 0 && !error && (
            <div style={{ borderRadius:'16px', background:T.card, border:`1.5px dashed ${T.border}`, padding:'48px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'18px', background:`${T.accent}10`, border:`1.5px dashed ${T.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px' }}>🔄</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:T.sub, marginBottom:'6px' }}>Hasil Swap Muncul di Sini</div>
                <div style={{ fontSize:'12px', color:T.muted, lineHeight:1.6, maxWidth:'320px' }}>
                  Upload foto fashion dengan model yang ada →<br/>
                  Pilih identitas baru →<br/>
                  AI ganti orangnya, pertahankan outfit & pose
                </div>
              </div>
              {/* Feature matrix */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%', maxWidth:'400px', marginTop:'8px' }}>
                {[
                  { icon:'✅', label:'Outfit dipertahankan', color:T.accent },
                  { icon:'✅', label:'Pose tetap sama', color:T.accent },
                  { icon:'✅', label:'Background terjaga', color:T.accent },
                  { icon:'✅', label:'Lighting konsisten', color:T.accent },
                  { icon:'🔄', label:'Wajah diganti', color:T.gold },
                  { icon:'🔄', label:'Kulit & rambut baru', color:T.gold },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 10px', borderRadius:'8px', background:'rgba(255,255,255,.03)', border:`1px solid ${T.border}`, fontSize:'11px', color:T.sub }}>
                    <span style={{ fontSize:'13px' }}>{item.icon}</span>
                    <span style={{ color:item.color }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !generating && (
            <div>
              {/* Before/After toggle view */}
              {showBA && sourcePreview && results[activeResult] ? (
                <div style={{ marginBottom:'14px' }}>
                  <BeforeAfterSlider before={sourcePreview} after={results[activeResult]}/>
                  <div style={{ marginTop:'8px', fontSize:'11px', color:T.muted, textAlign:'center' }}>
                    Drag slider untuk perbandingan · Variasi {activeResult + 1}
                  </div>
                </div>
              ) : (
                /* Main result */
                <div style={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${T.border}`, marginBottom:'12px', position:'relative', background:T.surface }}>
                  <img
                    src={results[activeResult]}
                    alt={`Model Swap — ${currentPreset?.label}`}
                    style={{ width:'100%', display:'block', maxHeight:'600px', objectFit:'contain' }}
                  />
                  {/* Preset badge */}
                  <div style={{ position:'absolute', top:'12px', left:'12px', padding:'4px 10px', borderRadius:'7px', background:'rgba(0,0,0,.65)', fontSize:'10px', fontWeight:700, color:T.accent, backdropFilter:'blur(6px)', display:'flex', alignItems:'center', gap:'5px' }}>
                    {currentPreset?.icon} {currentPreset?.label}
                  </div>
                  {/* Swap mode badge */}
                  <div style={{ position:'absolute', top:'12px', right:'12px', padding:'4px 10px', borderRadius:'7px', background:'rgba(0,0,0,.65)', fontSize:'10px', fontWeight:700, color:T.white, backdropFilter:'blur(6px)' }}>
                    {swapModeLabel[swapMode].label}
                  </div>
                  {/* Download overlay */}
                  <div style={{ position:'absolute', bottom:'12px', right:'12px', display:'flex', gap:'6px' }}>
                    <button type="button" onClick={() => setShowBA(!showBA)}
                      style={{ width:'34px', height:'34px', borderRadius:'8px', background:'rgba(0,0,0,.65)', border:`1px solid rgba(255,255,255,.15)`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(6px)' }}>
                      <ZoomIn size={15} color={T.white}/>
                    </button>
                    <button type="button" onClick={() => download(results[activeResult], activeResult)}
                      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:`linear-gradient(135deg,${T.accent},${T.accent2})`, border:'none', color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', boxShadow:'0 2px 12px rgba(16,185,129,.4)', fontFamily:'inherit' }}>
                      <Download size={13}/> Download
                    </button>
                  </div>
                </div>
              )}

              {/* Thumbnail strip (multiple results) */}
              {results.length > 1 && (
                <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                  {results.map((url, i) => (
                    <div key={i} onClick={() => { setActiveResult(i); setShowBA(false) }}
                      style={{ flex:1, borderRadius:'10px', overflow:'hidden', border:`2px solid ${activeResult===i ? T.accent : T.border}`, cursor:'pointer', transition:'all .15s', position:'relative', maxWidth:'180px' }}>
                      <img src={url} alt={`Variasi ${i+1}`} style={{ width:'100%', aspectRatio:'1/1', objectFit:'cover', display:'block' }}/>
                      <div style={{ position:'absolute', bottom:'5px', left:'50%', transform:'translateX(-50%)', padding:'2px 7px', borderRadius:'5px', background:'rgba(0,0,0,.7)', fontSize:'9px', fontWeight:700, color:T.white, whiteSpace:'nowrap' }}>
                        Variasi {i + 1}
                      </div>
                      {activeResult === i && (
                        <div style={{ position:'absolute', inset:0, border:`2px solid ${T.accent}`, borderRadius:'8px', pointerEvents:'none' }}/>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'7px', marginBottom:'14px' }}>
                {[
                  { icon:<Download size={14}/>,   label:'Download',   action:()=>download(results[activeResult],activeResult), color:T.accent },
                  { icon:<ZoomIn size={14}/>,     label:'Before/After',action:()=>setShowBA(!showBA), color:T.blue },
                  { icon:<RefreshCw size={14}/>,  label:'Generate Ulang', action:generate, color:T.sub },
                  { icon:<Maximize2 size={14}/>, label:'Upscale 4K',  action:()=>{}, color:T.gold },
                ].map((btn, i) => (
                  <button key={i} type="button" onClick={btn.action}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', padding:'10px 6px', borderRadius:'10px', border:`1px solid ${T.border}`, background:T.card, color:btn.color, cursor:'pointer', transition:'all .15s', fontFamily:'inherit' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=btn.color;(e.currentTarget as HTMLElement).style.background=`${btn.color}10`}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=T.border;(e.currentTarget as HTMLElement).style.background=T.card}}>
                    {btn.icon}
                    <span style={{ fontSize:'10px', fontWeight:600 }}>{btn.label}</span>
                  </button>
                ))}
              </div>

              {/* Success info */}
              <div style={{ padding:'12px 14px', borderRadius:'11px', background:`${T.accent}08`, border:`1px solid ${T.accent}25`, display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <CheckCircle2 size={16} color={T.accent} style={{ flexShrink:0, marginTop:'1px' }}/>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:T.accent, marginBottom:'3px' }}>
                    Model Swap Selesai — {currentPreset?.label} · {elapsed}s
                  </div>
                  <div style={{ fontSize:'11px', color:T.sub, lineHeight:1.6 }}>
                    Outfit, pose, lighting & background dipertahankan sepenuhnya.
                    {results.length > 1 && ` ${results.length} variasi tersedia — klik thumbnail untuk pilih.`}
                  </div>
                  <div style={{ display:'flex', gap:'6px', marginTop:'8px', flexWrap:'wrap' }}>
                    {[
                      { icon:'✅', label:'Outfit terjaga' },
                      { icon:'✅', label:'Pose dipertahankan' },
                      { icon:'🔄', label:`Identitas: ${currentPreset?.label}` },
                    ].map((tag, i) => (
                      <span key={i} style={{ fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'99px', background:'rgba(255,255,255,.06)', color:T.sub }}>
                        {tag.icon} {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* What's next */}
              <div style={{ marginTop:'12px', padding:'14px', borderRadius:'12px', background:T.card, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:T.white, marginBottom:'10px' }}>Langkah Selanjutnya</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
                  {[
                    { icon:'🔍', label:'Upscale 4K', href:'/studio/image/upscale', color:T.gold },
                    { icon:'✍️', label:'Edit Lanjut', href:'/studio/image/edit', color:T.blue },
                    { icon:'📐', label:'Crop Marketplace', href:'/quick-tools', color:T.accent },
                  ].map((item, i) => (
                    <Link key={i} href={item.href}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', padding:'10px 6px', borderRadius:'9px', border:`1px solid ${T.border}`, background:'rgba(255,255,255,.02)', textDecoration:'none', transition:'all .15s' }}
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
        * { box-sizing: border-box }
        @keyframes spin { to { transform: rotate(360deg) } }
        textarea::placeholder { color: #52525B }
        ::-webkit-scrollbar { width: 5px }
        ::-webkit-scrollbar-track { background: #111115 }
        ::-webkit-scrollbar-thumb { background: #3F3F46; border-radius: 3px }

        @media (max-width: 900px) {
          div[style*="grid-template-columns: 380px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}