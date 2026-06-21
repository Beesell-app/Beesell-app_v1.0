'use client'
// app/(dashboard)/studio/video/ugc/page.tsx
// ══════════════════════════════════════════════════════════════
// UGC VIDEO GENERATOR — Light Theme with Bee Accents, 2-Panel, 8-Step Workflow
// Kredit BERJENJANG per durasi (segmen 10 detik) + COGS transparan
// ══════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react'
import Step3Character from '@/components/studio/ugc/Step3Character'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, Upload, X, Play, Pause,
  Download, RefreshCw, Sparkles, Loader2, AlertCircle,
  ChevronRight, Info, Wand2, FileText, Video, Mic,
  Music, Captions, Image, Star, Lock, CheckCircle2,
  ChevronDown, ChevronUp, Clock, Monitor, Zap,
  Lightbulb, MailWarning
} from 'lucide-react'

import {
  CONTENT_TYPES,
  CHARACTER_PRESETS, CHARACTER_FEMALE, CHARACTER_MALE,
  LANGUAGE_OPTIONS,
  VIDEO_PRESETS,
  DURATION_OPTIONS,
  RESOLUTION_OPTIONS,
  SUBTITLE_STYLES,
  CTA_OVERLAYS,
  MUSIC_CATEGORIES,
  PRODUCT_CATEGORIES,
} from '@/lib/studio/ugc/presets'
import type {
  UgcStep, ContentTypeId, LanguageId, AccentId,
  VideoPresetId, DurationSec, SubtitleStyle,
  CtaOverlay, MusicCategory, ProductCategoryId,
  OutputResolution, ScriptMode, CharacterPreset,
} from '@/lib/studio/ugc/types'
// SSoT durasi → segmen → kredit → COGS (dipakai bareng route)
import { ugcCost, formatRp } from '@/lib/studio/ugc/credit-tiers'

// Import hooks for access control & credits
import { useUserRole } from '@/hooks/use-user-role'
import { useDailyUsage } from '@/hooks/use-daily-usage'

// ── Design tokens — LIGHT theme, Amber (Bee) primary ────────────────
// Aksen Lebah: Amber/Kuning Madu, Ink Sub untuk detail Hitam Lebah
const C = {
  amber:    '#F59E0B',
  amberDk:  '#D97706',
  amberLt:  '#FEF3C7',
  amberXlt: '#FFFBEB',
  amberGlow:'rgba(245,158,11,.15)',
  white:    '#FFFFFF',
  bg:       '#FAFAFA',
  bgAlt:    '#F3F4F6',
  surface:  '#FFFFFF',
  border:   '#E5E7EB',
  borderHi: '#D1D5DB',
  ink:      '#111827',
  inkSub:   '#374151',
  inkMuted: '#6B7280',
  inkDim:   '#9CA3AF',
  green:    '#10B981',
  greenLt:  '#ECFDF5',
  blue:     '#3B82F6',
  blueLt:   '#EFF6FF',
  purple:   '#8B5CF6',
  purpleLt: '#F5F3FF',
  red:      '#EF4444',
  redLt:    '#FEF2F2',
  orange:   '#F97316',
  sh:  '0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)',
  sm:  '0 4px 16px rgba(0,0,0,.07)',
  lg:  '0 16px 48px rgba(0,0,0,.10)',
  sa:  '0 8px 24px rgba(245,158,11,.25)',
}

// ── Step metadata ─────────────────────────────────────────────
const STEPS = [
  { num:1, label:'Tipe Konten',  icon:'🎬' },
  { num:2, label:'Produk',       icon:'📸' },
  { num:3, label:'Karakter',     icon:'🧑' },
  { num:4, label:'Bahasa',       icon:'🗣️' },
  { num:5, label:'Skrip',        icon:'✍️' },
  { num:6, label:'Gaya Video',   icon:'🎯' },
  { num:7, label:'Durasi',       icon:'⏱️' },
  { num:8, label:'Selesai',      icon:'🚀' },
] as const
const STORAGE_KEY = 'beesell:ugc:draft:v1'
// ── Stepper ───────────────────────────────────────────────────
function Stepper({ current, completed }: { current:number; completed:Set<number> }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0', marginBottom:'24px', overflowX:'auto', paddingBottom:'8px', scrollbarWidth:'none' }}>
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      {STEPS.map((step, i) => {
        const done = completed.has(step.num)
        const active = current === step.num
        return (
          <div key={step.num} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:done ? C.green : active ? C.amber : C.bgAlt, border:`2px solid ${done ? C.green : active ? C.amber : C.border}`, transition:'all .2s', fontSize:'13px', fontWeight:700, color:done||active ? '#fff' : C.inkMuted, boxShadow:active ? C.sa : 'none' }}>
                {done ? <Check size={14}/> : step.icon}
              </div>
              <div style={{ fontSize:'10px', fontWeight:active ? 700 : 600, color:active ? C.amberDk : done ? C.green : C.inkMuted, whiteSpace:'nowrap' }}>
                {step.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width:'min(3vw, 24px)', height:'2px', background:done ? C.green : C.border, margin:'0 4px', marginBottom:'16px', transition:'background .2s' }}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────
function Card({ children, title, icon, accent }: { children: React.ReactNode; title?: string; icon?: string; accent?: string }) {
  return (
    <div style={{ background:C.white, borderRadius:'16px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden', marginBottom:'16px', minWidth:0 }}>
      {title && (
        <div style={{ padding:'14px 18px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:'8px', background: C.bgAlt }}>
          {icon && <span style={{ fontSize:'16px' }}>{icon}</span>}
          <span style={{ fontSize:'14px', fontWeight:700, color:C.ink }}>{title}</span>
          {accent && <div style={{ marginLeft:'auto', fontSize:'10px', fontWeight:800, padding:'4px 10px', borderRadius:'99px', background:`${C.amber}18`, color:C.amberDk, whiteSpace:'nowrap', flexShrink:0 }}>{accent}</div>}
        </div>
      )}
      <div style={{ padding:'18px' }}>{children}</div>
    </div>
  )
}

// ── Info Tip Box ──────────────────────────────────────────────
function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'12px 16px', background:C.amberXlt, border:`1px solid ${C.amber}30`, borderRadius:'12px', marginTop:'12px' }}>
      <Lightbulb size={16} color={C.amberDk} style={{ flexShrink:0, marginTop:'2px' }}/>
      <div style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.6, minWidth:0 }}>
        {children}
      </div>
    </div>
  )
}

// ── Nav button ────────────────────────────────────────────────
function NavBtn({ onClick, disabled, variant='primary', children }: { onClick:()=>void; disabled?:boolean; variant?:'primary'|'ghost'; children:React.ReactNode }) {
  const isPrimary = variant === 'primary'
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 20px', borderRadius:'10px', border:`1.5px solid ${isPrimary ? C.amber : C.border}`, background:isPrimary ? `linear-gradient(135deg,${C.amber},${C.amberDk})` : C.white, color:isPrimary ? '#fff' : C.inkSub, fontSize:'14px', fontWeight:700, cursor:disabled ? 'not-allowed' : 'pointer', opacity:disabled ? .5 : 1, transition:'all .2s', boxShadow:isPrimary && !disabled ? C.sa : 'none', fontFamily:'inherit', whiteSpace:'nowrap' }}
      onMouseEnter={e=>{ if(!disabled&&isPrimary)(e.currentTarget as HTMLElement).style.transform='translateY(-2px)' }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}>
      {children}
    </button>
  )
}

// ── Option pill ───────────────────────────────────────────────
function Pill({ label, selected, onClick, color, icon }: { label:string; selected:boolean; onClick:()=>void; color?:string; icon?:string }) {
  const c = color ?? C.amber
  return (
    <button type="button" onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'99px', border:`1.5px solid ${selected ? c : C.border}`, background:selected ? `${c}12` : C.white, color:selected ? c : C.inkMuted, fontSize:'13px', fontWeight:selected ? 700 : 500, cursor:'pointer', transition:'all .2s', boxShadow:selected ? `0 0 0 1px ${c}30` : 'none', fontFamily:'inherit', whiteSpace:'nowrap' }}
      onMouseEnter={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=c }}
      onMouseLeave={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=C.border }}>
      {icon && <span style={{ fontSize:'14px' }}>{icon}</span>}
      {label}
    </button>
  )
}

// ── Upload zone ───────────────────────────────────────────────
function ImageUploadZone({ files, onAdd, onRemove }: { files:File[]; onAdd:(f:File)=>void; onRemove:(i:number)=>void }) {
  const ref           = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    Array.from(e.dataTransfer.files).slice(0, 5 - files.length).forEach(f => {
      if (['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) onAdd(f)
    })
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).slice(0, 5 - files.length).forEach(f => onAdd(f))
    e.target.value = ''
  }

  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={handleDrop}
        style={{ borderRadius:'14px', border:`2px dashed ${drag ? C.amber : C.borderHi}`, background:drag ? C.amberXlt : C.bg, cursor:'pointer', padding:'32px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', transition:'all .2s', marginBottom:'16px' }}
        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=C.amber}
        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.borderHi}
      >
        <div style={{ width:'50px', height:'50px', borderRadius:'14px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>📸</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'14px', fontWeight:700, color:C.ink, marginBottom:'4px' }}>Upload Foto Produk Anda</div>
          <div style={{ fontSize:'12px', color:C.inkMuted }}>Tarik & lepas file di sini, atau klik untuk memilih.<br/>Maksimal 5 gambar (JPG, PNG, WEBP).</div>
        </div>
        {drag && <div style={{ fontSize:'13px', fontWeight:800, color:C.amber }}>Lepaskan foto di sini ✓</div>}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleChange}/>

      {previews.length > 0 && (
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
          {previews.map((url, i) => (
            <div key={i} style={{ position:'relative', width:'80px', height:'80px', borderRadius:'12px', overflow:'hidden', border:`2px solid ${C.border}`, background:C.bg }}>
              <img src={url} alt={`Produk ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              <button onClick={() => onRemove(i)}
                style={{ position:'absolute', top:'4px', right:'4px', width:'20px', height:'20px', borderRadius:'50%', background:'rgba(0,0,0,.6)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=C.red}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,.6)'}>
                <X size={12} color="#fff"/>
              </button>
              {i === 0 && <div style={{ position:'absolute', bottom:'0', left:'0', right:'0', fontSize:'9px', fontWeight:800, padding:'4px', background:'rgba(245,158,11,0.9)', color:'#fff', textAlign:'center', backdropFilter:'blur(2px)' }}>Utama</div>}
            </div>
          ))}
          {files.length < 5 && (
            <button onClick={() => ref.current?.click()}
              style={{ width:'80px', height:'80px', borderRadius:'12px', border:`2px dashed ${C.borderHi}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', transition:'all .2s', color:C.inkMuted }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.amber; (e.currentTarget as HTMLElement).style.color=C.amber}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.borderHi; (e.currentTarget as HTMLElement).style.color=C.inkMuted}}>
              +
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Video player ──────────────────────────────────────────────
function VideoPlayer({ src, poster }: { src:string; poster?:string }) {
  const ref           = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => { if(!ref.current)return; playing?ref.current.pause():ref.current.play() }
  const fmtTime = (s:number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  return (
    <div style={{ borderRadius:'16px', overflow:'hidden', background:C.bg, border:`1px solid ${C.border}`, boxShadow:C.sm }}>
      <video ref={ref} src={src} poster={poster} loop playsInline preload="auto"
        style={{ width:'100%', display:'block', aspectRatio:'9/16', objectFit:'contain', background:C.ink, maxHeight:'520px' }}
        onPlay={()=>setPlaying(true)}
        onPause={()=>setPlaying(false)}
        onTimeUpdate={()=>{ if(ref.current) setProgress(ref.current.currentTime) }}
        onLoadedMetadata={()=>{ if(ref.current) setDuration(ref.current.duration) }}
        onClick={toggle}
      />
      <div style={{ padding:'14px 16px', background:C.white, borderTop:`1px solid ${C.border}` }}>
        <div onClick={(e) => {
          if(!ref.current||!duration)return
          const r = e.currentTarget.getBoundingClientRect()
          ref.current.currentTime = ((e.clientX-r.left)/r.width)*duration
        }} style={{ height:'6px', background:C.bgAlt, borderRadius:'3px', cursor:'pointer', marginBottom:'12px', overflow:'hidden' }}>
          <div style={{ height:'100%', background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, borderRadius:'3px', width:`${duration?(progress/duration)*100:0}%`, transition:'width .1s linear' }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={toggle}
            style={{ width:'40px', height:'40px', borderRadius:'50%', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:C.sa, flexShrink:0, transition:'transform .2s' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.05)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>
            {playing ? <Pause size={16} fill="#fff" color="#fff"/> : <Play size={16} fill="#fff" color="#fff" style={{marginLeft:'3px'}}/>}
          </button>
          <span style={{ fontSize:'13px', fontWeight:600, color:C.inkSub }}>{fmtTime(progress)} <span style={{color:C.inkDim, fontWeight:400}}>/ {fmtTime(duration)}</span></span>
          <div style={{ marginLeft:'auto', fontSize:'10px', fontWeight:800, color:C.inkMuted, background:C.bgAlt, padding:'4px 8px', borderRadius:'6px' }}>LOOP</div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function UgcVideoPage() {
  const router = useRouter()
  const { isSuperuser } = useUserRole()
  const { credits } = useDailyUsage()

  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [avatarSource, setAvatarSource] = useState<'preset' | 'collection' | 'custom' | null>(null)

  // ── Step state ────────────────────────────────────────
  const [currentStep,    setCurrentStep]    = useState<UgcStep>(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // ── Form state ────────────────────────────────────────
  const [contentType,    setContentType]    = useState<ContentTypeId | null>(null)
  const [productImages,  setProductImages]  = useState<File[]>([])
  const [character,      setCharacter]      = useState<string | null>(null)
  const [charTab,        setCharTab]        = useState<'female'|'male'>('female')
  const [language,       setLanguage]       = useState<LanguageId>('indonesia')
  const [accent,         setAccent]         = useState<AccentId>('natural-id')
  const [scriptMode,     setScriptMode]     = useState<ScriptMode>('auto')
  const [productName,    setProductName]    = useState('')
  const [targetMarket,   setTargetMarket]   = useState('')
  const [mainBenefit,    setMainBenefit]    = useState('')
  const [painPoint,      setPainPoint]      = useState('')
  const [manualScript,   setManualScript]   = useState('')
  const [generatedScript,setGeneratedScript]= useState('')
  const [scriptLoading,  setScriptLoading]  = useState(false)
  const [videoPreset,    setVideoPreset]    = useState<VideoPresetId | null>(null)
  const [productCategory,setProductCategory]= useState<ProductCategoryId | null>(null)
  const [duration,       setDuration]       = useState<DurationSec>(30)
  const [subtitleStyle,  setSubtitleStyle]  = useState<SubtitleStyle>('tiktok')
  const [ctaOverlay,     setCtaOverlay]     = useState<CtaOverlay>('shop-now')
  const [musicCategory,  setMusicCategory]  = useState<MusicCategory>('trending')

  // ── Result state ──────────────────────────────────────
  type Status = 'idle'|'preparing'|'generating'|'rendering'|'completed'|'error'
  const [status,    setStatus]    = useState<Status>('idle')
  const [progress,  setProgress]  = useState(0)
  const [videoUrl,  setVideoUrl]  = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [elapsed,   setElapsed]   = useState<number | null>(null)
  const [resolution,setResolution]= useState<OutputResolution>('vertical')

  const [seconds,   setSeconds]   = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if(timerRef.current) clearInterval(timerRef.current) }, [])
    // ── Draft persistence: restore saat mount ─────────────────
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (typeof d.currentStep === 'number') setCurrentStep(d.currentStep as UgcStep)
        if (Array.isArray(d.completedSteps)) setCompletedSteps(new Set(d.completedSteps))
        if (d.contentType != null) setContentType(d.contentType)
        if (d.character != null) setCharacter(d.character)
        if (d.charTab) setCharTab(d.charTab)
        if (d.language) setLanguage(d.language)
        if (d.accent) setAccent(d.accent)
        if (d.scriptMode) setScriptMode(d.scriptMode)
        if (typeof d.productName === 'string') setProductName(d.productName)
        if (typeof d.targetMarket === 'string') setTargetMarket(d.targetMarket)
        if (typeof d.mainBenefit === 'string') setMainBenefit(d.mainBenefit)
        if (typeof d.painPoint === 'string') setPainPoint(d.painPoint)
        if (typeof d.manualScript === 'string') setManualScript(d.manualScript)
        if (typeof d.generatedScript === 'string') setGeneratedScript(d.generatedScript)
        if (d.videoPreset != null) setVideoPreset(d.videoPreset)
        if (d.productCategory != null) setProductCategory(d.productCategory)
        if (d.duration != null) setDuration(d.duration)
        if (d.subtitleStyle) setSubtitleStyle(d.subtitleStyle)
        if (d.ctaOverlay) setCtaOverlay(d.ctaOverlay)
        if (d.musicCategory) setMusicCategory(d.musicCategory)
        if (d.resolution) setResolution(d.resolution)
        if (d.selectedAvatarId != null) setSelectedAvatarId(d.selectedAvatarId)
        if (d.avatarSource != null) setAvatarSource(d.avatarSource)
      }
    } catch {}
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Draft persistence: simpan tiap berubah (sesudah hydrate) ──
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStep, completedSteps: [...completedSteps],
        contentType, character, charTab, language, accent,
        scriptMode, productName, targetMarket, mainBenefit, painPoint,
        manualScript, generatedScript,
        videoPreset, productCategory, duration,
        subtitleStyle, ctaOverlay, musicCategory, resolution,
        selectedAvatarId, avatarSource,
      }))
    } catch {}
  }, [hydrated, currentStep, completedSteps, contentType, character, charTab, language, accent, scriptMode, productName, targetMarket, mainBenefit, painPoint, manualScript, generatedScript, videoPreset, productCategory, duration, subtitleStyle, ctaOverlay, musicCategory, resolution, selectedAvatarId, avatarSource])
  // ── Helpers ───────────────────────────────────────────
  const markDone = (step: number) => setCompletedSteps(p => new Set([...p, step]))
  const goNext   = () => { markDone(currentStep); setCurrentStep(s => Math.min(8, s+1) as UgcStep) }
  const goPrev   = () => setCurrentStep((s: UgcStep) => Math.max(1, s - 1) as UgcStep)

  const canNext: Record<number, boolean> = {
    1: !!contentType,
    2: productImages.length > 0,
    3: !!selectedAvatarId,
    4: !!language && !!accent,
    5: scriptMode === 'auto'
      ? generatedScript.trim().length > 20
      : manualScript.trim().length > 20,
    6: !!videoPreset,
    7: !!duration,
    8: false,
  }

  // ── Script generation ─────────────────────────────────
  const generateScript = useCallback(async () => {
  if (!contentType || !selectedAvatarId) return // videoPreset (Langkah 6) TIDAK lagi wajib
  setScriptLoading(true)
  setError(null)
  try {
    const res = await fetch('/api/studio/video/ugc?action=script', {
      method:  'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        contentType, selectedAvatarId, avatarSource, videoPreset,
        language, accent, duration, productCategory,
        productName, targetMarket, mainBenefit, painPoint,
      }),
    })
    const data = await res.json()
    if (data.success && data.script) {
      setGeneratedScript(data.script)
      setManualScript(data.script) // ⭐ masuk ke kolom "ketik/edit skrip sendiri"
      setScriptMode('manual')      // ⭐ langsung tampilkan editor agar bisa diedit
    } else {
      setError(data.error ?? 'Gagal membuat skrip otomatis')
    }
      } catch (e: any) {
        setError(e?.message ?? 'Koneksi bermasalah')
      } finally {
        setScriptLoading(false)
      }
    }, [selectedAvatarId, avatarSource, videoPreset, contentType, language, accent, duration, productCategory, productName, targetMarket, mainBenefit, painPoint])
      // ── Video generation ──────────────────────────────────
      const generateVideo = useCallback(async () => {
        if (!selectedAvatarId || !videoPreset) return

        const cost = ugcCost(duration)   // kredit berjenjang sesuai durasi

        // Check credits (dinamis sesuai durasi)
        if (credits < cost.credits && !isSuperuser) {
          router.push('/billing?upgrade=premium')
          return
        }

    const finalScript = scriptMode === 'auto' ? generatedScript : manualScript
    if (!finalScript.trim()) { 
      setError('Skrip belum tersedia')
      return 
    }

    setStatus('preparing')
    setError(null)
    setVideoUrl(null)
    setProgress(0)
    setSeconds(0)

    const statusFlow: [Status,string,number,number][] = [
      ['preparing',  'Menyiapkan AI Avatar...',     5,  3000],
      ['generating', 'AI sedang membuat video...',  35, 8000],
      ['rendering',  'Rendering & sinkronisasi audio...',    75, 6000],
    ]

    let tick = 0
    timerRef.current = setInterval(() => {
      setSeconds(s => s+1)
      tick++
      if (tick < 5)  setProgress(5  + tick * 2)
      else if (tick < 20) setProgress(20 + tick * 1.5)
      else if (tick < 45) setProgress(55 + tick * 0.5)
    }, 1000)

    for (const [st, msg, pct, delay] of statusFlow) {
      setStatus(st)
      setProgress(pct)
      await new Promise(r => setTimeout(r, delay))
    }

    try {
      const fd = new FormData()
      if (productImages[0]) fd.append('image', productImages[0])
      fd.append('script',      finalScript)
      fd.append('language',    language)
      fd.append('accent',      accent)
      fd.append('videoPreset', videoPreset)
      fd.append('duration',    String(duration))
      fd.append('subtitle',    subtitleStyle)
      fd.append('cta',         ctaOverlay)
      fd.append('music',       musicCategory)
      fd.append('resolution',  resolution)
      fd.append('avatarId',    selectedAvatarId ?? '')
      fd.append('avatarSource',avatarSource ?? 'preset')
      fd.append('characterId', selectedAvatarId!)
      
      const res = await fetch('/api/studio/video/ugc', {
        method: 'POST',
        body: fd,
      })

      if (timerRef.current) { 
        clearInterval(timerRef.current)
        timerRef.current = null 
      }

      if (res.status === 402) {
        router.push('/billing?upgrade=premium')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data.error ?? data.message ?? `Kesalahan sistem ${res.status}`)
      }

      const data = await res.json()
      if (data.success) {
        setStatus('completed')
        setProgress(100)
        setElapsed(data.estimatedWaitMs ? Math.round(data.estimatedWaitMs / 1000) : null)
        // In real app, poll for statusUrl to get final videoUrl
        // Simulating success here
        setVideoUrl("https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4") // Placeholder mock
      } else {
        throw new Error(data.message ?? 'Pembuatan video gagal')
      }
    } catch (e: any) {
      if (timerRef.current) { 
        clearInterval(timerRef.current)
        timerRef.current = null 
      }
      setStatus('error')
      setError(e?.message ?? 'Gagal membuat video UGC')
    }
  }, [character, selectedAvatarId, avatarSource, videoPreset, scriptMode, generatedScript, manualScript, productImages, language, accent, duration, subtitleStyle, ctaOverlay, musicCategory, resolution, credits, isSuperuser, router])

  const download = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `beesell-ugc-${videoPreset}-${duration}s.mp4`
    a.click()
  }

  const langOptions  = LANGUAGE_OPTIONS.find(l => l.id === language)
  const activeCharacterId = selectedAvatarId ?? character
  const charSelected = CHARACTER_PRESETS.find(c => c.id === activeCharacterId)
  
  // Status config
  const statusConfig: Record<string, { label:string; color:string; icon:string }> = {
    idle:       { label:'Siap Digunakan',  color:C.inkMuted, icon:'✨' },
    preparing:  { label:'Menyiapkan Aset...', color:C.blue,     icon:'⚙️' },
    generating: { label:'Membuat Video...', color:C.amber,    icon:'🎬' },
    rendering:  { label:'Proses Akhir...',  color:C.purple,   icon:'⏳' },
    completed:  { label:'Video Selesai!', color:C.green,    icon:'✅' },
    error:      { label:'Gagal Memproses', color:C.red,      icon:'❌' },
  }
  const sc = statusConfig[status]

  // ── Active script + biaya berjenjang ──────────────────────
  const activeScript = scriptMode === 'auto' ? generatedScript : manualScript
  const cost = ugcCost(duration)   // { segments, credits, cogsRp, targetWords }

  function handleSelectAvatar(avatarId: string, source: 'preset' | 'collection' | 'custom') {
    setSelectedAvatarId(avatarId)
    setAvatarSource(source)
    setCharacter(avatarId) // Fallback for old API
  }

  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:'100%', maxWidth:'100%', overflowX:'hidden', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* ── Top bar ─────────────────────────────────── */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'14px 24px', display:'flex', alignItems:'center', gap:'16px', position:'sticky', top:0, zIndex:100, boxShadow:C.sh }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'6px', color:C.inkMuted, textDecoration:'none', fontSize:'14px', fontWeight:600, transition:'color .2s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.amberDk}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.inkMuted}>
          <ArrowLeft size={16}/> Kembali
        </Link>
        <div style={{ width:'1px', height:'20px', background:C.border }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:C.amberXlt, border:`1px solid ${C.amber}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>🎬</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:'15px', fontWeight:800, color:C.ink, lineHeight:1.2 }}>Generator Video UGC AI</div>
            <div style={{ fontSize:'11px', color:C.inkMuted, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Ubah foto produk jadi video User Generated Content profesional</div>
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
          <div style={{ padding:'6px 12px', borderRadius:'8px', background:isSuperuser ? C.purpleLt : C.amberLt, border:`1px solid ${isSuperuser ? C.purple : C.amber}30`, fontSize:'12px', fontWeight:700, color:isSuperuser ? C.purple : C.amberDk, display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}>
            <Star size={14}/> {isSuperuser ? 'AKSES SUPERUSER' : `${credits} Kredit Tersedia`}
          </div>
        </div>
      </div>

      {/* ── Hero Edukasi ────────────────────────────── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'20px 24px', display:'flex', gap:'16px', alignItems:'center' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:C.greenLt, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Monitor size={24} color={C.green} />
          </div>
          <div style={{ minWidth:0 }}>
            <h2 style={{ fontSize:'16px', fontWeight:800, color:C.ink, margin:'0 0 4px 0' }}>Solusi Cerdas Video Marketing</h2>
            <p style={{ fontSize:'13px', color:C.inkSub, margin:0, lineHeight:1.5, maxWidth:'800px' }}>
              Tidak perlu menyewa aktor atau studio mahal. AI kami mengubah skrip dan foto produk Anda menjadi video promosi bergaya <strong>UGC (Testimoni Pengguna)</strong> yang terbukti meningkatkan klik dan konversi di TikTok, Instagram Reels, maupun Facebook Ads.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2-Panel layout ─────────────────────────── */}
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'24px', display:'grid', gridTemplateColumns:'minmax(0, 1fr) 380px', gap:'24px', alignItems:'flex-start' }} className="ugc-main-layout">

        {/* ════ LEFT PANEL — Workflow ════ */}
        <div style={{ display:'flex', flexDirection:'column', width:'100%', minWidth:0 }}>
          {/* Stepper */}
          <Stepper current={currentStep} completed={completedSteps}/>

          {/* ── Step 1: Content Type ────────────────── */}
          {/* ── Step 1: Content Type ────────────────── */}
          {currentStep === 1 && (
            <Card title="Pilih Tujuan Konten Video" icon="🎬" accent="Langkah 1/8">
              <p style={{ fontSize:'13px', color:C.inkMuted, marginBottom:'16px' }}>
                Setiap tujuan konten akan menyesuaikan gaya bahasa, struktur skrip, dan Call to Action (CTA) agar performa video lebih maksimal di platform media sosial.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px,100%), 1fr))', gap:'12px' }}>
                {CONTENT_TYPES.map(ct => {
                  const sel = contentType === ct.id
                  return (
                    <button key={ct.id} type="button" onClick={() => setContentType(ct.id)}
                      style={{ 
                        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
                        padding:'16px', borderRadius:'14px', border:`2px solid ${sel ? ct.color : C.border}`, 
                        background:sel ? `${ct.color}10` : C.white, cursor:'pointer', textAlign:'left', 
                        transition:'all .2s', boxShadow:sel ? `0 4px 12px ${ct.color}20` : 'none', 
                        fontFamily:'inherit', minWidth:0, overflow: 'hidden'
                      }}
                      onMouseEnter={e=>{ if(!sel)(e.currentTarget as HTMLElement).style.borderColor=ct.color }}
                      onMouseLeave={e=>{ if(!sel)(e.currentTarget as HTMLElement).style.borderColor=C.border }}>
                      
                      {/* Icon & Badge - Lebar 100% agar space-between bekerja */}
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px', width: '100%', gap: '8px' }}>
                        <span style={{ fontSize:'28px', flexShrink: 0 }}>{ct.icon}</span>
                        {ct.badge && <span style={{ fontSize:'10px', fontWeight:800, padding:'4px 8px', borderRadius:'6px', background:`${ct.color}20`, color:ct.color, flexShrink:0, textAlign: 'right' }}>{ct.badge}</span>}
                      </div>

                      {/* Judul, Deskripsi & Platform - Tambahan whiteSpace normal & wordBreak agar teks turun ke bawah */}
                      <div style={{ fontSize:'14px', fontWeight:800, color:sel ? ct.color : C.ink, marginBottom:'6px', width: '100%', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {ct.label}
                      </div>
                      <div style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.5, width: '100%', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {ct.desc}
                      </div>
                      
                      {/* mt-auto akan menekan elemen ini selalu ke bawah jika ada kartu yang lebih panjang di sebelahnya */}
                      <div style={{ fontSize:'10px', color:ct.color, marginTop:'auto', paddingTop:'12px', fontWeight:700, textTransform:'uppercase', width: '100%', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        Platform: {ct.platform}
                      </div>
                    </button>
                  )
                })}
              </div>
              <TipBox>
                <strong>Tahukah Anda?</strong> Format bergaya Review Produk sangat disukai algoritma TikTok dan Reels karena terlihat lebih natural dan tidak hardsell (terlalu memaksa berjualan).
              </TipBox>
            </Card>
          )}

          {/* ── Step 2: Upload Product ──────────────── */}
          {currentStep === 2 && (
            <Card title="Visual Produk Anda" icon="📸" accent="Langkah 2/8">
              <p style={{ fontSize:'13px', color:C.inkMuted, marginBottom:'16px' }}>
                Unggah foto produk yang jelas. AI Avatar akan menggunakan foto utama untuk menunjuk, menjelaskan, atau memegang produk secara virtual dalam video.
              </p>
              <ImageUploadZone
                files={productImages}
                onAdd={(f) => setProductImages(p => [...p, f].slice(0,5))}
                onRemove={(i) => setProductImages(p => p.filter((_,j) => j !== i))}
              />
              {productImages.length > 0 && (
                <div style={{ marginTop:'16px', padding:'12px 16px', borderRadius:'10px', background:C.greenLt, border:`1px solid ${C.green}40`, display:'flex', gap:'10px', alignItems:'center', fontSize:'13px', fontWeight:600, color:C.green }}>
                  <CheckCircle2 size={18}/> {productImages.length} foto produk telah disiapkan. AI akan fokus pada foto dengan label "Utama".
                </div>
              )}
              <TipBox>
                Pastikan foto produk memiliki pencahayaan yang terang dan latar belakang (background) yang rapi, atau gunakan foto berlatar putih agar AI dapat mendeteksi tepi produk dengan sempurna.
              </TipBox>
            </Card>
          )}

          {/* ── Step 3: Character ───────────────────── */}
          {currentStep === 3 && (
            <Card title="Pilih Wajah & Karakter AI" icon="🧑" accent="Langkah 3/8">
              <p style={{ fontSize:'13px', color:C.inkMuted, marginBottom:'16px' }}>
                Karakter ini akan menjadi "wajah" dari merek Anda. Pilih dari koleksi foto avatar yang tersedia, atau unggah avatar sendiri — yang demografinya paling cocok dengan target pasar Anda.
              </p>
              <Step3Character
                selectedAvatarId={selectedAvatarId}
                avatarSource={avatarSource}
                onSelectAvatar={handleSelectAvatar}
              />
              {selectedAvatarId && (
                <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: C.greenLt, border: `1px solid ${C.green}40`, fontSize: '13px', fontWeight:600, color: C.green, display:'flex', alignItems:'center', gap:'8px' }}>
                  <CheckCircle2 size={18}/> Aktor AI berhasil dipilih dan siap menjalankan skrip Anda.
                </div>
              )}
            </Card>
          )}

          {/* ── Step 4: Language ─────────────────────── */}
          {currentStep === 4 && (
            <Card title="Pengaturan Suara & Aksen" icon="🗣️" accent="Langkah 4/8">
              <p style={{ fontSize:'13px', color:C.inkMuted, marginBottom:'20px' }}>
                Sesuaikan gaya bicara aktor agar relevan dengan audiens lokal Anda.
              </p>
              <div style={{ marginBottom:'20px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'10px' }}>Pilih Bahasa Utama</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(140px,100%), 1fr))', gap:'12px' }}>
                  {LANGUAGE_OPTIONS.map(lang => (
                    <button key={lang.id} type="button" onClick={() => { setLanguage(lang.id); setAccent(lang.accents[0].id as AccentId) }}
                      style={{ padding:'16px', borderRadius:'12px', border:`2px solid ${language===lang.id ? C.amber : C.border}`, background:language===lang.id ? C.amberXlt : C.white, cursor:'pointer', transition:'all .2s', fontFamily:'inherit', boxShadow:language===lang.id ? C.sa : 'none', display:'flex', flexDirection:'column', alignItems:'center', minWidth:0 }}>
                      <div style={{ fontSize:'32px', marginBottom:'8px' }}>{lang.flag}</div>
                      <div style={{ fontSize:'14px', fontWeight:800, color:language===lang.id ? C.amberDk : C.ink }}>{lang.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'10px' }}>Pilih Variasi Aksen & Dialek</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                  {langOptions?.accents.map((ac: { id: AccentId; label: string }) => (
                    <Pill
                      key={ac.id}
                      label={ac.label}
                      selected={accent === ac.id}
                      onClick={() => setAccent(ac.id)}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ── Step 5: Script ──────────────────────── */}
          {currentStep === 5 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <Card title="Penyusunan Skrip Video" icon="✍️" accent="Langkah 5/8">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
                  {(['auto','manual'] as ScriptMode[]).map(m => (
                    <button key={m} type="button" onClick={() => setScriptMode(m)}
                      style={{ padding:'12px', borderRadius:'10px', border:`2px solid ${scriptMode===m ? C.amber : C.border}`, background:scriptMode===m ? C.amberXlt : C.white, fontSize:'14px', fontWeight:scriptMode===m ? 800 : 600, color:scriptMode===m ? C.amberDk : C.inkMuted, cursor:'pointer', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'inherit', minWidth:0 }}>
                      {m === 'auto' ? <><Wand2 size={16}/> Dibuat Otomatis oleh AI</> : <><FileText size={16}/> Ketik / Edit Skrip Sendiri</>}
                    </button>
                  ))}
                </div>

                {scriptMode === 'auto' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'10px' }}>Kategori Bisnis/Produk (Opsional)</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                        {PRODUCT_CATEGORIES.map(cat => (
                          <Pill key={cat.id} label={`${cat.icon} ${cat.label}`} selected={productCategory===cat.id} onClick={() => setProductCategory(productCategory===cat.id ? null : cat.id)} color={C.purple}/>
                        ))}
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(240px,100%), 1fr))', gap:'16px' }}>
                      {[
                        { field:'productName',  label:'Nama Spesifik Produk',     ph:'Contoh: BrightSkin Serum Vit C 30ml',                val:productName,   set:setProductName },
                        { field:'targetMarket', label:'Siapa Pembelinya?',        ph:'Contoh: Mahasiswi 20-25th, kulit berminyak',         val:targetMarket,  set:setTargetMarket },
                        { field:'mainBenefit',  label:'Keunggulan Terbesar',      ph:'Contoh: Wajah glowing & bebas jerawat dalam 7 hari', val:mainBenefit,   set:setMainBenefit },
                        { field:'painPoint',    label:'Masalah yang Diselesaikan', ph:'Contoh: Sering begadang, wajah kusam & bruntusan',  val:painPoint,     set:setPainPoint },
                      ].map(item => (
                        <div key={item.field} style={{ minWidth:0 }}>
                          <label style={{ fontSize:'12px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>{item.label}</label>
                          <input
                            value={item.val}
                            onChange={e => item.set(e.target.value)}
                            placeholder={item.ph}
                            style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:`2px solid ${C.border}`, fontSize:'13px', color:C.ink, outline:'none', transition:'all .2s', boxSizing:'border-box', background:C.white, fontFamily:'inherit' }}
                            onFocus={e=>{(e.target as HTMLElement).style.borderColor=C.amber; (e.target as HTMLElement).style.boxShadow=`0 0 0 3px ${C.amber}20`}}
                            onBlur={e=>{(e.target as HTMLElement).style.borderColor=C.border; (e.target as HTMLElement).style.boxShadow='none'}}
                          />
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={generateScript} disabled={scriptLoading || !selectedAvatarId}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'14px', marginTop:'8px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'14px', fontWeight:800, cursor:scriptLoading ? 'not-allowed' : 'pointer', opacity:scriptLoading ? .7 : 1, boxShadow:C.sa, fontFamily:'inherit', transition:'all .2s' }}>
                      {scriptLoading ? <><Loader2 size={16} style={{ animation:'spin .8s linear infinite' }}/> AI Sedang Menulis Skrip...</> : <><Sparkles size={16}/> Minta AI Tuliskan Skrip</>}
                    </button>

                    {!selectedAvatarId && (
                      <div style={{ fontSize:'12px', color:C.red, textAlign:'center', fontWeight:600 }}>
                        ⚠️ Pilih Aktor AI dulu di Langkah 3 agar AI tahu persona yang menulis skrip.
                      </div>
                    )}
                    <div style={{ fontSize:'11px', color:C.inkMuted, textAlign:'center' }}>
                      Skrip otomatis disesuaikan ke ±{cost.targetWords} kata agar pas durasi {duration} detik. Setelah jadi, skrip masuk ke editor dan bisa langsung kamu ubah.
                    </div>
                  </div>
                )}

                {scriptMode === 'manual' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', flexWrap:'wrap', gap:'8px' }}>
                      <label style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>Teks yang Akan Diucapkan Aktor</label>
                      <button type="button" onClick={generateScript} disabled={scriptLoading || !selectedAvatarId}
                        style={{ fontSize:'12px', fontWeight:700, color:C.amberDk, background:C.amberXlt, border:`1px solid ${C.amber}40`, borderRadius:'8px', padding:'6px 12px', cursor:scriptLoading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:'6px', fontFamily:'inherit', opacity:scriptLoading ? .7 : 1 }}>
                        {scriptLoading ? <><Loader2 size={12} style={{ animation:'spin .8s linear infinite' }}/> Menulis...</> : <><Wand2 size={12}/> Tulis ulang dgn AI</>}
                      </button>
                    </div>
                    <textarea
                      value={manualScript}
                      onChange={e => setManualScript(e.target.value)}
                      placeholder='Halo semuanya! Hari ini aku mau kasih tahu rahasia wajah glowing aku...'
                      rows={10}
                      style={{ width:'100%', padding:'14px', borderRadius:'12px', border:`2px solid ${C.border}`, fontSize:'14px', color:C.ink, outline:'none', resize:'vertical', fontFamily:'inherit', lineHeight:1.7, transition:'all .2s', boxSizing:'border-box', background:C.white }}
                      onFocus={e=>{(e.target as HTMLElement).style.borderColor=C.amber; (e.target as HTMLElement).style.boxShadow=`0 0 0 3px ${C.amber}20`}}
                      onBlur={e=>{(e.target as HTMLElement).style.borderColor=C.border; (e.target as HTMLElement).style.boxShadow='none'}}
                    />
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px', fontSize:'11px', color:C.inkMuted, fontWeight:600, flexWrap:'wrap', gap:'8px' }}>
                      <span>Target ±{cost.targetWords} kata untuk durasi {duration} detik</span>
                      <span>{manualScript.trim() ? manualScript.trim().split(/\s+/).length : 0} kata · {manualScript.length} karakter</span>
                    </div>
                    <TipBox>
                      Skrip hasil AI muncul di kolom ini dan <strong>sepenuhnya bisa kamu edit</strong> — ganti hook, sesuaikan gaya bahasa, tambah promo, atau rapikan CTA sesuai kebutuhanmu sebelum lanjut.
                    </TipBox>
                  </div>
                )}

                {/* Generated script display */}
                {generatedScript && scriptMode === 'auto' && (
                  <div style={{ marginTop:'20px', padding:'16px', borderRadius:'12px', background:C.amberXlt, border:`1px solid ${C.amber}40` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
                      <div style={{ fontSize:'13px', fontWeight:800, color:C.amberDk, display:'flex', alignItems:'center', gap:'6px' }}>
                        <Wand2 size={16}/> Skrip Hasil AI
                      </div>
                      <button type="button" onClick={generateScript} disabled={scriptLoading}
                        style={{ fontSize:'12px', fontWeight:700, color:C.amberDk, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontFamily:'inherit' }}>
                        <RefreshCw size={12}/> Tulis Ulang
                      </button>
                    </div>
                    <p style={{ fontSize:'14px', color:C.inkSub, lineHeight:1.8, margin:0, whiteSpace:'pre-wrap' }}>{generatedScript}</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── Step 6: Video Preset ─────────────────── */}
          {currentStep === 6 && (
            <Card title="Pilih Gaya Visual Video" icon="🎯" accent="Langkah 6/8">
              <p style={{ fontSize: '13px', color: C.inkMuted, marginBottom: '16px', textAlign: 'center' }}>
                Gaya video menentukan ekspresi wajah AI Avatar, warna penyuntingan, dan transisi kamera secara otomatis.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px,100%), 1fr))', gap: '16px' }}>
                {VIDEO_PRESETS.map(p => {
                  const sel = videoPreset === p.id
                  return (
                    <button key={p.id} type="button" onClick={() => setVideoPreset(p.id)}
                      style={{
                        // PERBAIKAN UTAMA: Gunakan Flex Column & Center
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center', // Teks di dalam ikut rata tengah

                        padding: '20px', // Beri ruang lebih
                        borderRadius: '14px',
                        border: `2px solid ${sel ? C.amber : C.border}`,
                        background: sel ? C.amberXlt : C.white,
                        cursor: 'pointer',
                        transition: 'all .2s',
                        boxShadow: sel ? C.sa : 'none',
                        fontFamily: 'inherit',
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%', // Agar tinggi card sama dalam satu baris grid
                        minWidth: 0,
                      }}
                      onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.borderColor = C.amber }}
                      onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.borderColor = C.border }}>

                      {/* Container Icon & Label - Dibuat Center */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column', // Icon di atas label
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        width: '100%'
                      }}>
                        <span style={{ fontSize: '32px' }}>{p.icon}</span>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: sel ? C.amberDk : C.ink, whiteSpace: 'normal' }}>
                          {p.label}
                        </span>
                      </div>

                      {/* Deskripsi - Rata Tengah, Beri Max-Width agar enak dibaca jika box lebar */}
                      <div style={{
                        fontSize: '12px',
                        color: C.inkSub,
                        lineHeight: 1.6, // Beri spasi antar baris
                        marginBottom: '12px',
                        width: '100%',
                        maxWidth: '300px', // Mencegah teks terlalu melar ke samping
                        whiteSpace: 'normal', // Mengizinkan teks turun baris
                      }}>
                        {p.desc}
                      </div>

                      {/* Badge Platform - mt-auto agar selalu menempel di bawah box */}
                      <div style={{
                        marginTop: 'auto',
                        fontSize: '10px',
                        color: sel ? C.amberDk : C.inkDim,
                        fontWeight: 700,
                        padding: '6px 12px',
                        background: sel ? `${C.amber}20` : C.bgAlt,
                        borderRadius: '99px', // Pill shape
                        display: 'inline-block',
                        whiteSpace: 'normal'
                      }}>
                        {p.platform} • Durasi Ideal: {p.durationHint} dtk
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Selected preset detail */}
              {videoPreset && (
                <div style={{ marginTop:'16px', padding:'14px 16px', borderRadius:'12px', background:C.amberXlt, border:`1px solid ${C.amber}30` }}>
                  {(() => {
                    const p = VIDEO_PRESETS.find(vp => vp.id === videoPreset)!
                    return (
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:800, color:C.amberDk, marginBottom:'8px' }}>Detail Gaya "{p.label}"</div>
                        <div style={{ fontSize:'12px', color:C.inkSub, display:'grid', gap:'6px' }}>
                          <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                            <span style={{fontWeight:700, minWidth:'120px', flexShrink:0}}>🎭 Ekspresi (Tone):</span>
                            <span style={{flex: 1, minWidth: 0, wordBreak: 'break-word'}}>{p.toneStyle}</span>
                          </div>
                          <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                            <span style={{fontWeight:700, minWidth:'120px', flexShrink:0}}>🪝 Tipe Tarikan:</span>
                            <span style={{flex: 1, minWidth: 0, wordBreak: 'break-word'}}>{p.hook}</span>
                          </div>
                          <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                            <span style={{fontWeight:700, minWidth:'120px', flexShrink:0}}>🛒 Pola Ajakan:</span>
                            <span style={{flex: 1, minWidth: 0, wordBreak: 'break-word'}}>{p.cta}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </Card>
          )}

          {/* ── Step 7: Duration ────────────────────── */}
          {currentStep === 7 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <Card title="Pengaturan Durasi Akhir" icon="⏱️" accent="Langkah 7/8">
                <p style={{ fontSize:'13px', color:C.inkMuted, marginBottom:'16px' }}>
                  Video yang lebih pendek (15-30 detik) memiliki persentase penonton selesai (Watch Time) yang jauh lebih tinggi. Kredit dihitung per segmen 10 detik.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px' }}>
                  {DURATION_OPTIONS.map(opt => {
                    const sel = duration === opt.value
                    const oc  = ugcCost(opt.value)
                    return (
                      <button key={opt.value} type="button" onClick={() => setDuration(opt.value)}
                        style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 20px', borderRadius:'14px', border:`2px solid ${sel ? C.amber : C.border}`, background:sel ? C.amberXlt : C.white, cursor:'pointer', transition:'all .2s', boxShadow:sel ? C.sa : 'none', fontFamily:'inherit', minWidth:0 }}>
                        <span style={{ fontSize:'24px', flexShrink: 0 }}>{opt.icon}</span>
                        <div style={{ flex:1, minWidth: 0, textAlign:'left' }}>
                          <div style={{ fontSize:'15px', fontWeight:800, color:sel ? C.amberDk : C.ink, marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{opt.label}</div>
                          <div style={{ fontSize:'12px', color:C.inkMuted }}>{opt.desc}</div>
                        </div>
                        <div style={{ flexShrink:0, textAlign:'right' }}>
                          <div style={{ fontSize:'14px', fontWeight:900, color:sel ? C.amberDk : C.ink, whiteSpace:'nowrap' }}>{oc.credits} kredit</div>
                          <div style={{ fontSize:'10px', color:C.inkMuted, fontWeight:600, whiteSpace:'nowrap' }}>{oc.segments} segmen × 10</div>
                        </div>
                        {sel && <CheckCircle2 size={22} color={C.amber} style={{ flexShrink: 0 }}/>}
                      </button>
                    )
                  })}
                </div>
                <TipBox>
                  <strong>Cara kerja durasi & kredit:</strong> Video di-generate per segmen 10 detik. Durasi <strong>{duration} detik = {cost.segments} segmen → {cost.credits} kredit</strong>. Skrip otomatis di-size ke ±{cost.targetWords} kata supaya panjang audio = durasi video, jadi hasil akhirnya pas dengan yang kamu set.
                </TipBox>
              </Card>

              {/* Additional features */}
              <Card title="Elemen Estetika Tambahan" icon="🎨">
                <div style={{ display:'grid', gap:'20px' }}>
                  {/* Subtitle */}
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:800, color:C.ink, marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}><Captions size={16} color={C.blue}/> Model Teks Subtitle</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                      {SUBTITLE_STYLES.map(s => (
                        <Pill key={s.id} label={s.label} selected={subtitleStyle===s.id} onClick={() => setSubtitleStyle(s.id)} color={C.blue}/>
                      ))}
                    </div>
                  </div>
                  {/* CTA Overlay */}
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:800, color:C.ink, marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}><Zap size={16} color={C.orange}/> Teks Pop-up Ajakan (CTA)</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                      {CTA_OVERLAYS.map(c => (
                        <Pill key={c.id} label={`${c.icon} ${c.label}`} selected={ctaOverlay===c.id} onClick={() => setCtaOverlay(c.id)} color={C.orange}/>
                      ))}
                    </div>
                  </div>
                  {/* Music */}
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:800, color:C.ink, marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}><Music size={16} color={C.purple}/> Musik Latar (Otomatis menyesuaikan beat)</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                      {MUSIC_CATEGORIES.map(m => (
                        <Pill key={m.id} label={`${m.icon} ${m.label}`} selected={musicCategory===m.id} onClick={() => setMusicCategory(m.id)} color={C.purple}/>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── Step 8: Generate ────────────────────── */}
          {currentStep === 8 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {/* Summary */}
              <Card title="Konfirmasi & Tinjau Ulang" icon="📋" accent="Terakhir">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(160px,100%), 1fr))', gap:'12px' }}>
                  {[
                    { label:'Format Video',   val:CONTENT_TYPES.find(c=>c.id===contentType)?.label ?? 'Belum Dipilih' },
                    { label:'Aktor AI',       val:charSelected?.label ?? 'Belum Dipilih' },
                    { label:'Bahasa Bicara',  val:LANGUAGE_OPTIONS.find(l=>l.id===language)?.label ?? 'Belum Dipilih' },
                    { label:'Gaya Visual',    val:VIDEO_PRESETS.find(v=>v.id===videoPreset)?.label ?? 'Belum Dipilih' },
                    { label:'Durasi Max',     val:`${duration} Detik` },
                    { label:'Rasio Layar',    val:RESOLUTION_OPTIONS.find(r=>r.id===resolution)?.label ?? 'Belum Dipilih' },
                    { label:'Gaya Teks',      val:SUBTITLE_STYLES.find(s=>s.id===subtitleStyle)?.label ?? 'Tidak Ada' },
                    { label:'Grafis Ajakan',  val:CTA_OVERLAYS.find(c=>c.id===ctaOverlay)?.label ?? 'Tidak Ada' },
                    { label:'Musik Audio',    val:MUSIC_CATEGORIES.find(m=>m.id===musicCategory)?.label ?? 'Bisu' },
                    { label:'Aset Gambar',    val:`${productImages.length} Foto Siap` },
                    { label:'Estimasi Kredit',val:`${cost.credits} kredit · ${cost.segments} segmen` },
                    ...(isSuperuser ? [{ label:'COGS (Internal)', val: formatRp(cost.cogsRp) }] : []),
                  ].map((item, i) => (
                    <div key={i} style={{ padding:'12px', borderRadius:'10px', background:C.bg, border:`1px solid ${C.border}`, minWidth:0 }}>
                      <div style={{ fontSize:'10px', color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px', fontWeight:700 }}>{item.label}</div>
                      <div style={{ fontSize:'13px', fontWeight:800, color:C.ink, wordBreak:'break-word' }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Script preview */}
              {activeScript && (
                <Card title="Tinjauan Skrip Akhir" icon="📝">
                  <p style={{ fontSize:'14px', color:C.inkSub, lineHeight:1.8, margin:0, whiteSpace:'pre-wrap' }}>{activeScript}</p>
                  <div style={{ marginTop:'12px', fontSize:'11px', fontWeight:600, color:C.inkMuted, display:'flex', gap:'12px', background:C.bgAlt, padding:'8px 12px', borderRadius:'8px', width:'fit-content', flexWrap:'wrap' }}>
                    <span>🔠 {activeScript.trim().split(/\s+/).length} Kata</span>
                    <span>⏱️ Estimasi Waktu Bicara: ~{Math.round(activeScript.trim().split(/\s+/).length / 2.3)} Detik</span>
                  </div>
                </Card>
              )}

              {/* Output resolution */}
              <Card title="Optimasi Ukuran Layar" icon="📱">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(140px,100%), 1fr))', gap:'12px' }}>
                  {RESOLUTION_OPTIONS.map(res => {
                    const sel = resolution === res.id
                    return (
                      <button key={res.id} type="button" onClick={() => setResolution(res.id)}
                        style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding:'16px', 
                          borderRadius:'12px', 
                          border:`2px solid ${sel ? C.amber : C.border}`, 
                          background:sel ? C.amberXlt : C.white, 
                          cursor:'pointer', 
                          textAlign:'center', 
                          transition:'all .2s', 
                          fontFamily:'inherit', 
                          boxShadow:sel ? C.sa : 'none', 
                          minWidth:0,
                          height: '100%' // Memastikan tinggi semua box sama dalam grid
                        }}>
                        <div style={{ fontSize:'28px', marginBottom:'8px', flexShrink: 0 }}>
                          {res.icon}
                        </div>
                        <div style={{ fontSize:'14px', fontWeight:800, color:sel ? C.amberDk : C.ink, marginBottom:'4px', width: '100%', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {res.label}
                        </div>
                        <div style={{ fontSize:'11px', fontWeight:600, color:C.inkMuted, width: '100%', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {res.size} · {res.ratio}
                        </div>
                        
                        {/* marginTop: 'auto' akan mendorong deskripsi ini ke paling bawah agar seragam jika ada box sebelah yang teksnya lebih panjang */}
                        <div style={{ fontSize:'11px', color:sel ? C.amber : C.inkDim, marginTop:'auto', paddingTop: '8px', lineHeight:1.4, width: '100%', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {res.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Card>

              {/* Error Handling */}
              {error && (
                <div style={{ padding:'16px', borderRadius:'14px', background:C.redLt, border:`1px solid ${C.red}30`, display:'flex', gap:'12px', alignItems:'flex-start' }}>
                  <AlertCircle size={20} color={C.red} style={{ flexShrink:0, marginTop:'2px' }}/>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:800, color:C.red, marginBottom:'4px' }}>Proses Terhenti</div>
                    <div style={{ fontSize:'13px', color:'#991B1B', lineHeight:1.6 }}>{error}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Generate Video */}
              {status !== 'completed' && (
                <>
                  <button type="button" onClick={generateVideo}
                    disabled={status !== 'idle' && status !== 'error'}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'18px', borderRadius:'14px', border:'none', background:status === 'error' ? `linear-gradient(135deg,${C.orange},${C.red})` : `linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'16px', fontWeight:900, cursor:status !== 'idle' && status !== 'error' ? 'not-allowed' : 'pointer', boxShadow:status === 'idle' ? `0 8px 32px ${C.amber}50` : 'none', fontFamily:'inherit', transition:'all .2s', opacity:status !== 'idle' && status !== 'error' ? .7 : 1 }}>
                    {status === 'idle'      && <><Video size={20}/> Mulai Pembuatan Video AI</>}
                    {status === 'preparing' && <><Loader2 size={20} style={{ animation:'spin .8s linear infinite' }}/> Sedang Menyiapkan Karakter... ({seconds}s)</>}
                    {status === 'generating'&& <><Loader2 size={20} style={{ animation:'spin .8s linear infinite' }}/> Membangun Visualisasi... ({seconds}s)</>}
                    {status === 'rendering' && <><Loader2 size={20} style={{ animation:'spin .8s linear infinite' }}/> Menyelesaikan Tahap Akhir... ({seconds}s)</>}
                    {status === 'error'     && <><RefreshCw size={20}/> Terjadi Kesalahan. Coba Lagi!</>}
                  </button>
                  {(status === 'idle' || status === 'error') && (
                    <div style={{ textAlign:'center', fontSize:'12px', fontWeight:600, color:C.inkMuted }}>
                      {isSuperuser
                        ? `Mode Superuser — tidak memotong kredit · COGS internal ${formatRp(cost.cogsRp)}`
                        : `Akan memotong ${cost.credits} kredit (${cost.segments} segmen × 10) · saldo kamu ${credits}`}
                    </div>
                  )}
                </>
              )}

              {/* Progress Tracker */}
              {status !== 'idle' && status !== 'error' && (
                <div style={{ padding:'20px', borderRadius:'14px', background:C.white, border:`1px solid ${C.border}`, boxShadow:C.sh }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'15px', fontWeight:800, color:sc.color }}>
                      <span>{sc.icon}</span> {sc.label}
                    </div>
                    <div style={{ fontSize:'16px', fontWeight:900, color:C.amber }}>{progress}%</div>
                  </div>
                  <div style={{ height:'8px', background:C.bgAlt, borderRadius:'4px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, borderRadius:'4px', width:`${progress}%`, transition:'width .5s ease' }}/>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'16px', marginTop:'16px', fontSize:'11px' }}>
                    {(['preparing','generating','rendering','completed'] as Status[]).map((st, i) => {
                      const statusOrder = ['preparing','generating','rendering','completed']
                      const currentIdx  = statusOrder.indexOf(status)
                      const done = i < currentIdx || status === 'completed'
                      const active = status === st
                      const lbl = st === 'preparing' ? 'Persiapan' : st === 'generating' ? 'Memproses' : st === 'rendering' ? 'Rendering' : 'Selesai'
                      return (
                        <div key={st} style={{ display:'flex', alignItems:'center', gap:'6px', color:done ? C.green : active ? C.amberDk : C.inkDim }}>
                          {done ? <CheckCircle2 size={14} color={C.green}/> : <div style={{ width:'14px', height:'14px', borderRadius:'50%', border:`2px solid ${active ? C.amber : C.border}`, background:active ? `${C.amber}20` : 'transparent' }}/>}
                          <span style={{ fontWeight:active||done ? 800 : 600 }}>{lbl}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step navigation ──────────────────────── */}
          <div style={{ display:'flex', gap:'12px', marginTop:'24px', justifyContent:'space-between', alignItems:'center', paddingTop:'20px', borderTop:`1px solid ${C.border}` }}>
            <NavBtn onClick={goPrev} disabled={currentStep <= 1} variant="ghost">
              <ArrowLeft size={16}/> Kembali
            </NavBtn>
            {currentStep < 8 && (
              <NavBtn onClick={goNext} disabled={!canNext[currentStep]}>
                Lanjutkan Langkah <ArrowRight size={16}/>
              </NavBtn>
            )}
          </div>
        </div>

        {/* ════ RIGHT PANEL — Live Preview ════ */}
        <div style={{ position:'sticky', top:'90px', width:'100%', minWidth:0 }}>
          <div style={{ background:C.white, borderRadius:'20px', border:`1px solid ${C.border}`, boxShadow:C.lg, overflow:'hidden' }}>

            {/* Preview header */}
            <div style={{ padding:'16px 20px', background:C.ink, display:'flex', alignItems:'center', gap:'10px' }}>
              <Monitor size={18} color={C.amber}/>
              <span style={{ fontSize:'15px', fontWeight:800, color:C.white }}>Pratinjau Hasil Video</span>
            </div>

            {/* Video result */}
            {videoUrl ? (
              <div style={{ padding:'16px' }}>
                <VideoPlayer src={videoUrl}/>

                {/* Download panel */}
                <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  <button type="button" onClick={download}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'14px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit', transition:'all .2s' }}>
                    <Download size={18}/> Unduh Video MP4
                  </button>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <button type="button" onClick={generateVideo}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px', borderRadius:'10px', border:`2px solid ${C.border}`, background:C.white, color:C.inkSub, fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'background .2s', minWidth:0 }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=C.bgAlt}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=C.white}>
                      <RefreshCw size={14}/> Buat Versi Lain
                    </button>
                    <Link href="/gallery" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px', borderRadius:'10px', border:`2px solid ${C.border}`, background:C.white, color:C.inkSub, fontSize:'13px', fontWeight:700, textDecoration:'none', transition:'background .2s', minWidth:0 }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=C.bgAlt}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=C.white}>
                      📁 Lihat di Galeri
                    </Link>
                  </div>
                </div>
                {elapsed && (
                  <div style={{ marginTop:'12px', textAlign:'center', fontSize:'11px', fontWeight:600, color:C.inkMuted }}>
                    Kecepatan AI: Render selesai dalam {elapsed} detik · Kualitas {RESOLUTION_OPTIONS.find(r=>r.id===resolution)?.size}
                  </div>
                )}
              </div>
            ) : (
              /* Preview placeholder */
              <div style={{ padding:'24px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>

                {/* Phone mockup */}
                <div style={{ width:'160px', height:'280px', borderRadius:'24px', background:C.bg, border:`4px solid ${C.border}`, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'inset 0 4px 12px rgba(0,0,0,0.05)' }}>

                  {/* Step-aware preview content */}
                  {currentStep >= 3 && charSelected ? (
                    <div style={{ textAlign:'center', padding:'16px' }}>
                      <div style={{ fontSize:'64px', marginBottom:'12px', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>{charSelected.icon}</div>
                      <div style={{ fontSize:'12px', fontWeight:800, color:C.ink, marginBottom:'4px' }}>{charSelected.label}</div>
                      <div style={{ fontSize:'10px', fontWeight:600, color:C.inkMuted }}>{charSelected.age}</div>
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'16px' }}>
                      <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.6 }}>🎥</div>
                      <div style={{ fontSize:'11px', fontWeight:600, color:C.inkMuted, lineHeight:1.6 }}>Ruang pratinjau.<br/>Video akan tampil di sini.</div>
                    </div>
                  )}

                  {/* Skeleton overlay when generating */}
                  {status !== 'idle' && status !== 'completed' && status !== 'error' && (
                    <div style={{ position:'absolute', inset:0, background:`rgba(255,255,255,0.7)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
                      <Loader2 size={32} color={C.amber} style={{ animation:'spin .8s linear infinite', marginBottom:'8px' }}/>
                      <div style={{ fontSize:'10px', fontWeight:800, color:C.amberDk }}>{progress}%</div>
                    </div>
                  )}

                  {/* Subtitle overlay preview */}
                  {subtitleStyle !== 'none' && currentStep >= 7 && (
                    <div style={{ position:'absolute', bottom:'16px', left:'12px', right:'12px', padding:'6px 8px', borderRadius:'6px', background:subtitleStyle==='tiktok'?'rgba(0,0,0,.8)':subtitleStyle==='reels'?'rgba(255,255,255,.95)':'rgba(0,0,0,.6)', textAlign:'center', fontSize:'9px', fontWeight:800, color:subtitleStyle==='reels'?C.ink:'#fff', border: subtitleStyle==='reels' ? `1px solid ${C.border}` : 'none' }}>
                      GAYA TEKS {subtitleStyle.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Config summary dynamic builder */}
                <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'8px', marginTop:'8px' }}>
                  {[
                    { label:'Platform Tujuan',   val:CONTENT_TYPES.find(c=>c.id===contentType)?.label,        show:!!contentType,  icon:'📱' },
                    { label:'Wajah & Aktor AI',  val:charSelected?.label,                                     show:!!selectedAvatarId, icon:'🎭' },
                    { label:'Gaya Bahasa',       val:LANGUAGE_OPTIONS.find(l=>l.id===language)?.label,        show:currentStep>=4, icon:'💬' },
                    { label:'Format Editing',    val:VIDEO_PRESETS.find(v=>v.id===videoPreset)?.label,        show:!!videoPreset,  icon:'✂️' },
                    { label:'Batas Waktu',       val:`${duration} Detik`,                                     show:currentStep>=7, icon:'⏳' },
                    { label:'Estimasi Kredit',   val:`${cost.credits} kredit · ${cost.segments} segmen`,      show:currentStep>=7, icon:'🪙' },
                  ].filter(item => item.show && item.val).map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'8px 12px', borderRadius:'8px', background:C.bgAlt, border:`1px solid ${C.border}`, fontSize:'12px', minWidth:0 }}>
                      <span style={{ fontSize:'14px', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
                      <span style={{ color:C.inkSub, flexShrink:0, fontWeight:600 }}>{item.label}:</span>
                      <span style={{ color:C.ink, fontWeight:800, flex: 1, minWidth: 0, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* Script preview snippet */}
                {activeScript && (
                  <div style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', background:C.amberXlt, border:`1px solid ${C.amber}40`, marginTop:'4px' }}>
                    <div style={{ fontSize:'11px', fontWeight:800, color:C.amberDk, marginBottom:'6px', display:'flex', gap:'6px', alignItems:'center' }}><Mic size={14}/> Bacaan Narator</div>
                    <p style={{ fontSize:'11px', color:C.inkSub, lineHeight:1.6, margin:0, wordBreak:'break-word' }}>
                      "{activeScript.substring(0, 150)}{activeScript.length > 150 ? '...' : ''}"
                    </p>
                  </div>
                )}

                {/* Progress status */}
                {status !== 'idle' && (
                  <div style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', background:C.white, border:`1px solid ${C.border}`, boxShadow:C.sh, marginTop:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                      <div style={{ fontSize:'12px', fontWeight:800, color:sc.color }}>{sc.icon} {sc.label}</div>
                      <div style={{ fontSize:'12px', fontWeight:800, color:C.amber }}>{progress}%</div>
                    </div>
                    <div style={{ height:'6px', background:C.bgAlt, borderRadius:'3px', overflow:'hidden' }}>
                      <div style={{ height:'100%', background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, width:`${progress}%`, transition:'width .5s ease' }}/>
                    </div>
                  </div>
                )}

                {/* Empty state encouragement */}
                {status === 'idle' && !videoUrl && currentStep < 8 && (
                  <div style={{ textAlign:'center', fontSize:'12px', fontWeight:600, color:C.inkMuted, lineHeight:1.6, marginTop:'12px', padding:'16px', background:C.bg, borderRadius:'12px', border:`1px dashed ${C.borderHi}` }}>
                    Tersisa {8-currentStep} langkah lagi.<br/>Selesaikan pengaturan di sisi kiri untuk memunculkan tombol Generate.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes spin { to { transform:rotate(360deg) } }
        input::placeholder, textarea::placeholder { color:#9CA3AF }

        div::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { width:6px; height:6px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:3px }

        @media (max-width: 960px) {
          .ugc-main-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}