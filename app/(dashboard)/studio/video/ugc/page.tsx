// app/(dashboard)/studio/video/ugc/page.tsx (FIXED)
// ══════════════════════════════════════════════════════════════
// UGC VIDEO GENERATOR — Light Theme, 2-Panel, 8-Step Workflow
// FIXES:
//  - Removed undefined dispatch() call
//  - Fixed API endpoint paths
//  - Added proper error handling
//  - Integrated with feature access control
// ══════════════════════════════════════════════════════════════

'use client'

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


// Import hooks for access control & credits
import { useUserRole } from '@/hooks/use-user-role'
import { useDailyUsage } from '@/hooks/use-daily-usage'

// ── Design tokens — LIGHT theme, Amber primary ────────────────
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
  { num:1, label:'Jenis Konten',  icon:'🎬' },
  { num:2, label:'Upload Produk', icon:'📸' },
  { num:3, label:'Karakter',      icon:'🧑' },
  { num:4, label:'Bahasa',        icon:'🗣️' },
  { num:5, label:'Script',        icon:'✍️' },
  { num:6, label:'Preset Video',  icon:'🎯' },
  { num:7, label:'Durasi',        icon:'⏱️' },
  { num:8, label:'Generate',      icon:'🚀' },
] as const

// ── Stepper ───────────────────────────────────────────────────
function Stepper({ current, completed }: { current:number; completed:Set<number> }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0', marginBottom:'24px', overflowX:'auto', paddingBottom:'4px' }}>
      {STEPS.map((step, i) => {
        const done = completed.has(step.num)
        const active = current === step.num
        return (
          <div key={step.num} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:done ? C.green : active ? C.amber : C.bgAlt, border:`2px solid ${done ? C.green : active ? C.amber : C.border}`, transition:'all .2s', fontSize:'13px', fontWeight:700, color:done||active ? '#fff' : C.inkMuted, boxShadow:active ? C.sa : 'none' }}>
                {done ? <Check size={14}/> : step.icon}
              </div>
              <div style={{ fontSize:'9px', fontWeight:active ? 700 : 500, color:active ? C.amber : done ? C.green : C.inkMuted, whiteSpace:'nowrap', letterSpacing:'0.01em' }}>
                {step.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width:'24px', height:'2px', background:done ? C.green : C.border, margin:'0 2px', marginBottom:'14px', transition:'background .2s' }}/>
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
    <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden' }}>
      {title && (
        <div style={{ padding:'14px 18px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:'8px' }}>
          {icon && <span style={{ fontSize:'16px' }}>{icon}</span>}
          <span style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>{title}</span>
          {accent && <div style={{ marginLeft:'auto', fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background:`${C.amber}18`, color:C.amber }}>{accent}</div>}
        </div>
      )}
      <div style={{ padding:'16px 18px' }}>{children}</div>
    </div>
  )
}

// ── Nav button ────────────────────────────────────────────────
function NavBtn({ onClick, disabled, variant='primary', children }: { onClick:()=>void; disabled?:boolean; variant?:'primary'|'ghost'; children:React.ReactNode }) {
  const isPrimary = variant === 'primary'
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'9px', border:`1.5px solid ${isPrimary ? C.amber : C.border}`, background:isPrimary ? `linear-gradient(135deg,${C.amber},${C.amberDk})` : C.white, color:isPrimary ? '#fff' : C.inkMuted, fontSize:'13px', fontWeight:600, cursor:disabled ? 'not-allowed' : 'pointer', opacity:disabled ? .45 : 1, transition:'all .18s', boxShadow:isPrimary && !disabled ? C.sa : 'none', fontFamily:'inherit' }}
      onMouseEnter={e=>{ if(!disabled&&isPrimary)(e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
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
      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'99px', border:`1.5px solid ${selected ? c : C.border}`, background:selected ? `${c}12` : C.white, color:selected ? c : C.inkMuted, fontSize:'12px', fontWeight:selected ? 700 : 500, cursor:'pointer', transition:'all .15s', boxShadow:selected ? `0 0 0 1px ${c}30` : 'none', fontFamily:'inherit', whiteSpace:'nowrap' }}
      onMouseEnter={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=c }}
      onMouseLeave={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=C.border }}>
      {icon && <span style={{ fontSize:'13px' }}>{icon}</span>}
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
        style={{ borderRadius:'12px', border:`2px dashed ${drag ? C.amber : C.border}`, background:drag ? C.amberXlt : C.bg, cursor:'pointer', padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', transition:'all .18s', marginBottom:'12px' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>📸</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'13px', fontWeight:600, color:C.ink, marginBottom:'3px' }}>Upload Foto Produk</div>
          <div style={{ fontSize:'11px', color:C.inkMuted }}>Drag & drop atau klik · JPG, PNG, WEBP · Maks 5 gambar</div>
        </div>
        {drag && <div style={{ fontSize:'12px', fontWeight:700, color:C.amber }}>Drop foto di sini ✓</div>}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleChange}/>
      {previews.length > 0 && (
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          {previews.map((url, i) => (
            <div key={i} style={{ position:'relative', width:'72px', height:'72px', borderRadius:'10px', overflow:'hidden', border:`1.5px solid ${C.border}`, background:C.bg }}>
              <img src={url} alt={`Produk ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              <button onClick={() => onRemove(i)}
                style={{ position:'absolute', top:'3px', right:'3px', width:'18px', height:'18px', borderRadius:'50%', background:'rgba(0,0,0,.6)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={10} color="#fff"/>
              </button>
              {i === 0 && <div style={{ position:'absolute', bottom:'3px', left:'3px', fontSize:'8px', fontWeight:700, padding:'1px 4px', borderRadius:'3px', background:C.amber, color:'#fff' }}>Main</div>}
            </div>
          ))}
          {files.length < 5 && (
            <button onClick={() => ref.current?.click()}
              style={{ width:'72px', height:'72px', borderRadius:'10px', border:`2px dashed ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', transition:'border-color .15s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=C.amber}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.border}>
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
    <div style={{ borderRadius:'14px', overflow:'hidden', background:C.bg, border:`1px solid ${C.border}`, boxShadow:C.sm }}>
      <video ref={ref} src={src} poster={poster} loop playsInline preload="auto"
        style={{ width:'100%', display:'block', aspectRatio:'9/16', objectFit:'contain', background:C.ink, maxHeight:'480px' }}
        onPlay={()=>setPlaying(true)}
        onPause={()=>setPlaying(false)}
        onTimeUpdate={()=>{ if(ref.current) setProgress(ref.current.currentTime) }}
        onLoadedMetadata={()=>{ if(ref.current) setDuration(ref.current.duration) }}
        onClick={toggle}
      />
      <div style={{ padding:'12px 14px', background:C.white, borderTop:`1px solid ${C.border}` }}>
        <div onClick={(e) => {
          if(!ref.current||!duration)return
          const r = e.currentTarget.getBoundingClientRect()
          ref.current.currentTime = ((e.clientX-r.left)/r.width)*duration
        }} style={{ height:'4px', background:C.bgAlt, borderRadius:'2px', cursor:'pointer', marginBottom:'10px' }}>
          <div style={{ height:'100%', background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, borderRadius:'2px', width:`${duration?(progress/duration)*100:0}%`, transition:'width .1s linear' }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button onClick={toggle}
            style={{ width:'36px', height:'36px', borderRadius:'50%', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:C.sa, flexShrink:0 }}>
            {playing ? <Pause size={14} fill="#fff" color="#fff"/> : <Play size={14} fill="#fff" color="#fff"/>}
          </button>
          <span style={{ fontSize:'11px', color:C.inkMuted }}>{fmtTime(progress)} / {fmtTime(duration)}</span>
          <div style={{ marginLeft:'auto', fontSize:'9px', color:C.inkDim, background:C.bgAlt, padding:'2px 7px', borderRadius:'4px' }}>LOOP</div>
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
  const [selectedAvatarId, setSelectedAvatarId] =
  useState<string | null>(null)

const [avatarSource, setAvatarSource] =
  useState<'preset' | 'collection' | 'custom' | null>(null)
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
    if (
      !contentType ||
      !selectedAvatarId ||
      !videoPreset
    ) return
    setScriptLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/studio/video/ugc?action=script', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          contentType,
          selectedAvatarId,
          avatarSource,
          videoPreset,
          language,
          accent,
          duration,
          productCategory,
          productName,
          targetMarket,
          mainBenefit,
          painPoint,
        }),
      })
      const data = await res.json()
      if (data.success && data.script) {
        setGeneratedScript(data.script)
      } else {
        setError(data.error ?? 'Gagal generate script')
      }
    } catch (e: any) {
      setError(e?.message ?? 'Network error')
    } finally {
      setScriptLoading(false)
    }
      }, [
      selectedAvatarId,
      avatarSource,
      videoPreset,
      scriptMode,
      generatedScript,
      manualScript,
      productImages,
      language,
      accent,
      subtitleStyle,
      ctaOverlay,
      musicCategory,
      resolution,
      duration,
      credits,
      isSuperuser,
      router,
    ])

  // ── Video generation ──────────────────────────────────
  const generateVideo = useCallback(async () => {
    if (
      !selectedAvatarId ||
      !videoPreset
    ) return
    
    // Check credits
    if (credits < 30 && !isSuperuser) {
      router.push('/billing?upgrade=premium')
      return
    }

    const finalScript = scriptMode === 'auto' ? generatedScript : manualScript
    if (!finalScript.trim()) { 
      setError('Script belum tersedia')
      return 
    }

    setStatus('preparing')
    setError(null)
    setVideoUrl(null)
    setProgress(0)
    setSeconds(0)

    const statusFlow: [Status,string,number,number][] = [
      ['preparing',  'Menyiapkan karakter AI...',     5,  3000],
      ['generating', 'AI sedang generating video...',  35, 8000],
      ['rendering',  'Rendering & proses audio...',    75, 6000],
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
      fd.append('subtitle',    subtitleStyle)
      fd.append('cta',         ctaOverlay)
      fd.append('music',       musicCategory)
      fd.append('resolution',  resolution)
      fd.append(
        'avatarId',
        selectedAvatarId ?? ''
      )

      fd.append(
        'avatarSource',
        avatarSource ?? 'preset'
      )
      fd.append(
        'characterId',
        selectedAvatarId!
      )
      const res = await fetch('/api/studio/video/ugc', {
        method: 'POST',
        body: fd,
      })

      if (timerRef.current) { 
        clearInterval(timerRef.current)
        timerRef.current = null 
      }

      if (res.status === 402) {
        // Insufficient credits
        router.push('/billing?upgrade=premium')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data.message ?? `Error ${res.status}`)
      }

      const data = await res.json()
      if (data.success) {
        setStatus('completed')
        setProgress(100)
        setElapsed(data.estimatedWaitMs ? Math.round(data.estimatedWaitMs / 1000) : null)
        // In real app, poll for statusUrl to get final videoUrl
        // For now, store jobId for later retrieval
      } else {
        throw new Error(data.message ?? 'Generation failed')
      }
    } catch (e: any) {
      if (timerRef.current) { 
        clearInterval(timerRef.current)
        timerRef.current = null 
      }
      setStatus('error')
      setError(e?.message ?? 'Video generation gagal')
    }
  }, [character, videoPreset, scriptMode, generatedScript, manualScript, productImages, language, accent, subtitleStyle, ctaOverlay, musicCategory, resolution, credits, isSuperuser, router])

  const download = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `beesell-ugc-${videoPreset}-${duration}s.mp4`
    a.click()
  }

  const langOptions  = LANGUAGE_OPTIONS.find(l => l.id === language)
  const activeCharacterId =
  selectedAvatarId ?? character

  const charSelected =
    CHARACTER_PRESETS.find(
      c => c.id === activeCharacterId
    )
  
  // Status config
  const statusConfig: Record<string, { label:string; color:string; icon:string }> = {
    idle:       { label:'Siap',          color:C.inkMuted, icon:'⏳' },
    preparing:  { label:'Menyiapkan...', color:C.blue,     icon:'⚙️' },
    generating: { label:'Generating...',  color:C.amber,    icon:'✨' },
    rendering:  { label:'Rendering...',   color:C.purple,   icon:'🎬' },
    completed:  { label:'Selesai!',       color:C.green,    icon:'✅' },
    error:      { label:'Error',          color:C.red,      icon:'❌' },
  }
  const sc = statusConfig[status]

  // ── Active script ─────────────────────────────────────────
  const activeScript = scriptMode === 'auto' ? generatedScript : manualScript
  
function handleSelectAvatar(
  avatarId: string,
  source: 'preset' | 'collection' | 'custom'
) {
  setSelectedAvatarId(avatarId)
  setAvatarSource(source)

  // kompatibel dengan API lama
  setCharacter(avatarId)
}

  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* ── Top bar ─────────────────────────────────── */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'12px 20px', display:'flex', alignItems:'center', gap:'14px', position:'sticky', top:0, zIndex:100, boxShadow:C.sh }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'5px', color:C.inkMuted, textDecoration:'none', fontSize:'13px', transition:'color .12s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.ink}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.inkMuted}>
          <ArrowLeft size={15}/> Studio
        </Link>
        <div style={{ width:'1px', height:'16px', background:C.border }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:C.amberLt, border:`1px solid ${C.amber}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>🎬</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>UGC Video Generator</div>
            <div style={{ fontSize:'10px', color:C.inkMuted }}>Buat video UGC otomatis dengan AI Avatar</div>
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ padding:'4px 10px', borderRadius:'6px', background:isSuperuser ? C.purpleLt : C.amberLt, border:`1px solid ${isSuperuser ? C.purple : C.amber}30`, fontSize:'11px', fontWeight:600, color:isSuperuser ? C.purple : C.amberDk }}>
            {isSuperuser ? '∞ SUPERUSER' : `${credits} Credits`}
          </div>
        </div>
      </div>

      {/* ── 2-Panel layout ─────────────────────────── */}
      <div style={{ maxWidth:'1320px', margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'1fr 360px', gap:'20px', alignItems:'flex-start' }}>

        {/* ════ LEFT PANEL — Workflow ════ */}
        <div>
          {/* Stepper */}
          <Stepper current={currentStep} completed={completedSteps}/>

          {/* ── Step 1: Content Type ────────────────── */}
          {currentStep === 1 && (
            <Card title="Pilih Jenis Konten" icon="🎬" accent="Step 1/8">
              <p style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'16px' }}>
                Pilih format UGC yang ingin dibuat. Setiap jenis punya script, gaya, dan CTA yang berbeda.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                {CONTENT_TYPES.map(ct => {
                  const sel = contentType === ct.id
                  return (
                    <button key={ct.id} type="button" onClick={() => setContentType(ct.id)}
                      style={{ padding:'12px 10px', borderRadius:'11px', border:`1.5px solid ${sel ? ct.color : C.border}`, background:sel ? `${ct.color}10` : C.white, cursor:'pointer', textAlign:'left', transition:'all .15s', boxShadow:sel ? `0 0 0 1px ${ct.color}30` : 'none', fontFamily:'inherit' }}
                      onMouseEnter={e=>{ if(!sel)(e.currentTarget as HTMLElement).style.borderColor=ct.color }}
                      onMouseLeave={e=>{ if(!sel)(e.currentTarget as HTMLElement).style.borderColor=C.border }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'6px' }}>
                        <span style={{ fontSize:'20px' }}>{ct.icon}</span>
                        {ct.badge && <span style={{ fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'4px', background:`${ct.color}20`, color:ct.color }}>{ct.badge}</span>}
                      </div>
                      <div style={{ fontSize:'11px', fontWeight:700, color:sel ? ct.color : C.ink, marginBottom:'3px' }}>{ct.label}</div>
                      <div style={{ fontSize:'9px', color:C.inkMuted, lineHeight:1.4 }}>{ct.desc}</div>
                      <div style={{ fontSize:'9px', color:ct.color, marginTop:'4px', fontWeight:600 }}>{ct.platform}</div>
                    </button>
                  )
                })}
              </div>
            </Card>
          )}

          {/* ── Step 2: Upload Product ──────────────── */}
          {currentStep === 2 && (
            <Card title="Upload Foto Produk" icon="📸" accent="Step 2/8">
              <p style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'14px' }}>
                Upload 1-5 foto produk. Foto pertama jadi foto utama yang digunakan AI untuk generate video.
              </p>
              <ImageUploadZone
                files={productImages}
                onAdd={(f) => setProductImages(p => [...p, f].slice(0,5))}
                onRemove={(i) => setProductImages(p => p.filter((_,j) => j !== i))}
              />
              {productImages.length > 0 && (
                <div style={{ marginTop:'12px', padding:'10px 12px', borderRadius:'9px', background:C.greenLt, border:`1px solid ${C.green}30`, display:'flex', gap:'7px', alignItems:'center', fontSize:'11px', color:C.green }}>
                  <CheckCircle2 size={14}/> {productImages.length} foto produk siap — foto pertama sebagai main visual AI
                </div>
              )}
              <div style={{ marginTop:'10px', padding:'10px 12px', borderRadius:'9px', background:C.amberXlt, border:`1px solid ${C.amber}30`, fontSize:'11px', color:C.inkMuted, lineHeight:1.6 }}>
                💡 Tips: Gunakan foto produk berkualitas tinggi dengan background bersih untuk hasil video terbaik.
              </div>
            </Card>
          )}

    
          {/* ── Step 3: Character ───────────────────── */}
          {currentStep === 3 && (
          <Card
            title="Pilih Karakter AI Avatar"
            icon="🧑"
            accent="Step 3/8"
          >
            <Step3Character
              selectedAvatarId={selectedAvatarId}
              avatarSource={avatarSource}
              onSelectAvatar={handleSelectAvatar}
            />

            {selectedAvatarId && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: '9px',
                  background: C.amberXlt,
                  border: `1px solid ${C.amber}30`,
                  fontSize: '11px',
                  color: C.inkSub,
                }}
              >
                ✅ Avatar siap digunakan untuk generate video
              </div>
            )}
          </Card>
        )}

          {/* ── Step 4: Language ─────────────────────── */}
          {currentStep === 4 && (
            <Card title="Pilih Bahasa & Aksen" icon="🗣️" accent="Step 4/8">
              <p style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'14px' }}>
                Pilih bahasa dan gaya bicara karakter AI untuk video UGC.
              </p>
              <div style={{ marginBottom:'16px' }}>
                <div style={{ fontSize:'12px', fontWeight:600, color:C.inkSub, marginBottom:'8px' }}>Bahasa</div>
                <div style={{ display:'flex', gap:'8px' }}>
                  {LANGUAGE_OPTIONS.map(lang => (
                    <button key={lang.id} type="button" onClick={() => { setLanguage(lang.id); setAccent(lang.accents[0].id as AccentId) }}
                      style={{ flex:1, padding:'12px', borderRadius:'11px', border:`1.5px solid ${language===lang.id ? C.amber : C.border}`, background:language===lang.id ? C.amberXlt : C.white, cursor:'pointer', transition:'all .15s', fontFamily:'inherit', boxShadow:language===lang.id ? C.sa : 'none' }}>
                      <div style={{ fontSize:'24px', marginBottom:'6px' }}>{lang.flag}</div>
                      <div style={{ fontSize:'12px', fontWeight:700, color:language===lang.id ? C.amberDk : C.ink }}>{lang.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:'12px', fontWeight:600, color:C.inkSub, marginBottom:'8px' }}>Gaya Bicara / Aksen</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
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
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <Card title="Script Video" icon="✍️" accent="Step 5/8">
                <div style={{ display:'flex', gap:'7px', marginBottom:'16px' }}>
                  {(['auto','manual'] as ScriptMode[]).map(m => (
                    <button key={m} type="button" onClick={() => setScriptMode(m)}
                      style={{ flex:1, padding:'10px', borderRadius:'9px', border:`1.5px solid ${scriptMode===m ? C.amber : C.border}`, background:scriptMode===m ? C.amberXlt : C.white, fontSize:'12px', fontWeight:scriptMode===m ? 700 : 500, color:scriptMode===m ? C.amberDk : C.inkMuted, cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', fontFamily:'inherit' }}>
                      {m === 'auto' ? <><Wand2 size={13}/> Auto Generate</> : <><FileText size={13}/> Manual Script</>}
                    </button>
                  ))}
                </div>

                {scriptMode === 'auto' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {/* Product category */}
                    <div>
                      <div style={{ fontSize:'11px', fontWeight:600, color:C.inkSub, marginBottom:'7px' }}>Kategori Produk (Opsional)</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                        {PRODUCT_CATEGORIES.map(cat => (
                          <Pill key={cat.id} label={`${cat.icon} ${cat.label}`} selected={productCategory===cat.id} onClick={() => setProductCategory(productCategory===cat.id ? null : cat.id)} color={C.purple}/>
                        ))}
                      </div>
                    </div>
                    {/* Inputs */}
                    {[
                      { field:'productName',  label:'Nama Produk',    ph:'Contoh: Serum Vitamin C Brightening 30ml', val:productName,   set:setProductName },
                      { field:'targetMarket', label:'Target Market',  ph:'Contoh: Wanita 20-35 tahun, kulit kusam',  val:targetMarket,  set:setTargetMarket },
                      { field:'mainBenefit',  label:'Benefit Utama',  ph:'Contoh: Kulit glowing dalam 7 hari',       val:mainBenefit,   set:setMainBenefit },
                      { field:'painPoint',    label:'Pain Point',     ph:'Contoh: Kulit kusam, jerawat, tidak merata',val:painPoint,    set:setPainPoint },
                    ].map(item => (
                      <div key={item.field}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:C.inkSub, display:'block', marginBottom:'5px' }}>{item.label}</label>
                        <input
                          value={item.val}
                          onChange={e => item.set(e.target.value)}
                          placeholder={item.ph}
                          style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, fontSize:'12px', color:C.ink, outline:'none', transition:'border-color .15s', boxSizing:'border-box', background:C.white, fontFamily:'inherit' }}
                          onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                          onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}
                        />
                      </div>
                    ))}
                    <button type="button" onClick={generateScript} disabled={
                          scriptLoading ||
                          !videoPreset ||
                          !selectedAvatarId
                        }
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'11px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:scriptLoading ? 'not-allowed' : 'pointer', opacity:scriptLoading ? .7 : 1, boxShadow:C.sa, fontFamily:'inherit', transition:'all .15s' }}>
                      {scriptLoading ? <><Loader2 size={14} style={{ animation:'spin .8s linear infinite' }}/> Generating Script...</> : <><Sparkles size={14}/> Generate Script Otomatis</>}
                    </button>
                    {(!videoPreset || !character) && (
                      <div style={{ fontSize:'10px', color:C.inkMuted, textAlign:'center' }}>
                        ⚠️ Pilih Avatar (Step 3) terlebih dahulu. Script AI membutuhkan Preset Video yang dipilih pada Step 6.
                      </div>
                    )}
                  </div>
                )}

                {scriptMode === 'manual' && (
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:600, color:C.inkSub, display:'block', marginBottom:'5px' }}>Tulis Script Manual</label>
                    <textarea
                      value={manualScript}
                      onChange={e => setManualScript(e.target.value)}
                      placeholder='Tulis script yang akan dibacakan oleh AI avatar...'
                      rows={8}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:'9px', border:`1px solid ${C.border}`, fontSize:'12px', color:C.ink, outline:'none', resize:'vertical', fontFamily:'inherit', lineHeight:1.6, transition:'border-color .15s', boxSizing:'border-box', background:C.white }}
                      onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                      onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}
                    />
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px', fontSize:'10px', color:C.inkDim }}>
                      <span>Panduan: Hook (3s) → Konten → CTA (5s)</span>
                      <span>{manualScript.length} karakter</span>
                    </div>
                  </div>
                )}

                {/* Generated script display */}
                {generatedScript && scriptMode === 'auto' && (
                  <div style={{ marginTop:'12px', padding:'14px', borderRadius:'10px', background:C.bg, border:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:C.green, display:'flex', alignItems:'center', gap:'5px' }}>
                        <CheckCircle2 size={13}/> Script Berhasil di-generate
                      </div>
                      <button type="button" onClick={generateScript} disabled={scriptLoading}
                        style={{ fontSize:'10px', color:C.amber, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'3px', fontFamily:'inherit' }}>
                        <RefreshCw size={10}/> Ulang
                      </button>
                    </div>
                    <p style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.8, margin:0 }}>{generatedScript}</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── Step 6: Video Preset ─────────────────── */}
          {currentStep === 6 && (
            <Card title="Preset Video" icon="🎯" accent="Step 6/8">
              <p style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'14px' }}>
                Pilih gaya dan format video. Setiap preset otomatis mengatur tone, hook, ekspresi, dan CTA.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' }}>
                {VIDEO_PRESETS.map(p => {
                  const sel = videoPreset === p.id
                  return (
                    <button key={p.id} type="button" onClick={() => setVideoPreset(p.id)}
                      style={{ padding:'13px', borderRadius:'12px', border:`1.5px solid ${sel ? C.amber : C.border}`, background:sel ? C.amberXlt : C.white, cursor:'pointer', textAlign:'left', transition:'all .15s', boxShadow:sel ? C.sa : 'none', fontFamily:'inherit' }}
                      onMouseEnter={e=>{ if(!sel)(e.currentTarget as HTMLElement).style.borderColor=C.amber }}
                      onMouseLeave={e=>{ if(!sel)(e.currentTarget as HTMLElement).style.borderColor=C.border }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'7px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                          <span style={{ fontSize:'18px' }}>{p.icon}</span>
                          <span style={{ fontSize:'12px', fontWeight:700, color:sel ? C.amberDk : C.ink }}>{p.label}</span>
                        </div>
                        {p.badge && <span style={{ fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'4px', background:C.amber, color:'#fff' }}>{p.badge}</span>}
                      </div>
                      <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.4, marginBottom:'5px' }}>{p.desc}</div>
                      <div style={{ fontSize:'9px', color:sel ? C.amber : C.inkDim, fontWeight:600 }}>{p.platform} · {p.durationHint}s ideal</div>
                    </button>
                  )
                })}
              </div>
              {/* Selected preset detail */}
              {videoPreset && (
                <div style={{ marginTop:'12px', padding:'12px 14px', borderRadius:'10px', background:C.amberXlt, border:`1px solid ${C.amber}30` }}>
                  {(() => {
                    const p = VIDEO_PRESETS.find(vp => vp.id === videoPreset)!
                    return (
                      <div>
                        <div style={{ fontSize:'11px', fontWeight:700, color:C.amberDk, marginBottom:'6px' }}>{p.icon} {p.label}</div>
                        <div style={{ fontSize:'10px', color:C.inkMuted, display:'flex', flexDirection:'column', gap:'3px' }}>
                          <div><strong>Tone:</strong> {p.toneStyle}</div>
                          <div><strong>Hook:</strong> {p.hook}</div>
                          <div><strong>CTA:</strong> {p.cta}</div>
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
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <Card title="Durasi Video" icon="⏱️" accent="Step 7/8">
                <p style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'14px' }}>
                  Pilih durasi video. Lebih pendek = lebih mudah dikontrol & lebih viral.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
                  {DURATION_OPTIONS.map(opt => {
                    const sel = duration === opt.value
                    return (
                      <button key={opt.value} type="button" onClick={() => setDuration(opt.value)}
                        style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 15px', borderRadius:'11px', border:`1.5px solid ${sel ? C.amber : C.border}`, background:sel ? C.amberXlt : C.white, cursor:'pointer', transition:'all .15s', boxShadow:sel ? C.sa : 'none', fontFamily:'inherit' }}>
                        <span style={{ fontSize:'20px' }}>{opt.icon}</span>
                        <div style={{ flex:1, textAlign:'left' }}>
                          <div style={{ fontSize:'13px', fontWeight:700, color:sel ? C.amberDk : C.ink }}>{opt.label}</div>
                          <div style={{ fontSize:'10px', color:C.inkMuted }}>{opt.desc}</div>
                        </div>
                        {sel && <CheckCircle2 size={16} color={C.amber}/>}
                      </button>
                    )
                  })}
                </div>
              </Card>

              {/* Additional features */}
              <Card title="Fitur Tambahan" icon="🎨">
                {/* Subtitle */}
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, marginBottom:'8px', display:'flex', alignItems:'center', gap:'5px' }}><Captions size={12}/> Subtitle</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {SUBTITLE_STYLES.map(s => (
                      <Pill key={s.id} label={s.label} selected={subtitleStyle===s.id} onClick={() => setSubtitleStyle(s.id)} color={C.blue}/>
                    ))}
                  </div>
                </div>
                {/* CTA Overlay */}
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, marginBottom:'8px', display:'flex', alignItems:'center', gap:'5px' }}><Zap size={12}/> CTA Overlay</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {CTA_OVERLAYS.map(c => (
                      <Pill key={c.id} label={`${c.icon} ${c.label}`} selected={ctaOverlay===c.id} onClick={() => setCtaOverlay(c.id)} color={C.orange}/>
                    ))}
                  </div>
                </div>
                {/* Music */}
                <div>
                  <div style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, marginBottom:'8px', display:'flex', alignItems:'center', gap:'5px' }}><Music size={12}/> Background Music</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {MUSIC_CATEGORIES.map(m => (
                      <Pill key={m.id} label={`${m.icon} ${m.label}`} selected={musicCategory===m.id} onClick={() => setMusicCategory(m.id)} color={C.purple}/>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── Step 8: Generate ────────────────────── */}
          {currentStep === 8 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {/* Summary */}
              <Card title="Ringkasan Konfigurasi" icon="📋">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  {[
                    { label:'Jenis Konten',   val:CONTENT_TYPES.find(c=>c.id===contentType)?.label ?? '–' },
                    { label:'Karakter',        val:charSelected?.label ?? '–' },
                    { label:'Bahasa',          val:LANGUAGE_OPTIONS.find(l=>l.id===language)?.label ?? '–' },
                    { label:'Video Preset',    val:VIDEO_PRESETS.find(v=>v.id===videoPreset)?.label ?? '–' },
                    { label:'Durasi',          val:`${duration}s` },
                    { label:'Resolusi',        val:RESOLUTION_OPTIONS.find(r=>r.id===resolution)?.label ?? '–' },
                    { label:'Subtitle',        val:SUBTITLE_STYLES.find(s=>s.id===subtitleStyle)?.label ?? '–' },
                    { label:'CTA',             val:CTA_OVERLAYS.find(c=>c.id===ctaOverlay)?.label ?? '–' },
                    { label:'Musik',           val:MUSIC_CATEGORIES.find(m=>m.id===musicCategory)?.label ?? '–' },
                    { label:'Foto Produk',     val:`${productImages.length} foto` },
                  ].map((item, i) => (
                    <div key={i} style={{ padding:'8px 10px', borderRadius:'8px', background:C.bg, border:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:'9px', color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>{item.label}</div>
                      <div style={{ fontSize:'12px', fontWeight:600, color:C.ink }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Script preview */}
              {activeScript && (
                <Card title="Script yang Akan Dibacakan" icon="📝">
                  <p style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.8, margin:0 }}>{activeScript}</p>
                  <div style={{ marginTop:'10px', fontSize:'10px', color:C.inkDim }}>
                    {activeScript.split(' ').length} kata · estimasi {Math.round(activeScript.split(' ').length / 2.5)}s
                  </div>
                </Card>
              )}

              {/* Output resolution */}
              <Card title="Format Output" icon="📱">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' }}>
                  {RESOLUTION_OPTIONS.map(res => {
                    const sel = resolution === res.id
                    return (
                      <button key={res.id} type="button" onClick={() => setResolution(res.id)}
                        style={{ padding:'11px', borderRadius:'10px', border:`1.5px solid ${sel ? C.amber : C.border}`, background:sel ? C.amberXlt : C.white, cursor:'pointer', textAlign:'center', transition:'all .15s', fontFamily:'inherit', boxShadow:sel ? C.sa : 'none' }}>
                        <div style={{ fontSize:'20px', marginBottom:'5px' }}>{res.icon}</div>
                        <div style={{ fontSize:'11px', fontWeight:700, color:sel ? C.amberDk : C.ink, marginBottom:'2px' }}>{res.label}</div>
                        <div style={{ fontSize:'9px', color:C.inkMuted }}>{res.size} · {res.ratio}</div>
                        <div style={{ fontSize:'9px', color:sel ? C.amber : C.inkDim, marginTop:'2px' }}>{res.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </Card>

              {/* Error */}
              {error && (
                <div style={{ padding:'14px', borderRadius:'12px', background:C.redLt, border:`1px solid ${C.red}30`, display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <AlertCircle size={16} color={C.red} style={{ flexShrink:0, marginTop:'1px' }}/>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:C.red, marginBottom:'2px' }}>Generate Gagal</div>
                    <div style={{ fontSize:'12px', color:'#B91C1C', lineHeight:1.5 }}>{error}</div>
                  </div>
                </div>
              )}

              {/* Generate button */}
              {status !== 'completed' && (
                <button type="button" onClick={generateVideo}
                  disabled={status !== 'idle' && status !== 'error'}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'15px', borderRadius:'12px', border:'none', background:status === 'error' ? `linear-gradient(135deg,${C.orange},${C.red})` : `linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', boxShadow:`0 6px 24px ${C.amber}40`, fontFamily:'inherit', transition:'all .18s', opacity:status !== 'idle' && status !== 'error' ? .7 : 1 }}>
                  {status === 'idle'      && <><Video size={17}/> Generate Video UGC Sekarang</>}
                  {status === 'preparing' && <><Loader2 size={17} style={{ animation:'spin .8s linear infinite' }}/> Menyiapkan AI Avatar...</>}
                  {status === 'generating'&& <><Loader2 size={17} style={{ animation:'spin .8s linear infinite' }}/> Generating Video... {seconds}s</>}
                  {status === 'rendering' && <><Loader2 size={17} style={{ animation:'spin .8s linear infinite' }}/> Rendering Final... {seconds}s</>}
                  {status === 'error'     && <><RefreshCw size={17}/> Coba Lagi</>}
                </button>
              )}

              {/* Progress bar */}
              {status !== 'idle' && status !== 'error' && (
                <div style={{ padding:'14px 16px', borderRadius:'12px', background:C.white, border:`1px solid ${C.border}`, boxShadow:C.sh }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:700, color:sc.color }}>
                      <span>{sc.icon}</span> {sc.label}
                    </div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:C.amber }}>{progress}%</div>
                  </div>
                  <div style={{ height:'6px', background:C.bgAlt, borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, borderRadius:'3px', width:`${progress}%`, transition:'width .5s ease' }}/>
                  </div>
                  <div style={{ display:'flex', gap:'16px', marginTop:'10px', fontSize:'10px', color: C.inkMuted }}>
                    {(['preparing','generating','rendering','completed'] as Status[]).map((st, i) => {
                      const statusOrder = ['preparing','generating','rendering','completed']
                      const currentIdx  = statusOrder.indexOf(status)
                      const done = i < currentIdx || status === 'completed'
                      const active = status === st
                      return (
                        <div key={st} style={{ display:'flex', alignItems:'center', gap:'4px', color:done ? C.green : active ? C.amber : C.inkDim }}>
                          {done ? <CheckCircle2 size={11} color={C.green}/> : <div style={{ width:'11px', height:'11px', borderRadius:'50%', border:`1.5px solid ${active ? C.amber : C.border}`, background:active ? `${C.amber}20` : 'transparent' }}/>}
                          <span style={{ fontWeight:active ? 700 : 400, textTransform:'capitalize' }}>{st}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step navigation ──────────────────────── */}
          <div style={{ display:'flex', gap:'8px', marginTop:'16px', justifyContent:'space-between', alignItems:'center' }}>
            <NavBtn onClick={goPrev} disabled={currentStep <= 1} variant="ghost">
              <ArrowLeft size={14}/> Sebelumnya
            </NavBtn>
            {currentStep < 8 && (
              <NavBtn onClick={goNext} disabled={!canNext[currentStep]}>
                Selanjutnya <ArrowRight size={14}/>
              </NavBtn>
            )}
          </div>
        </div>

        {/* ════ RIGHT PANEL — Live Preview ════ */}
        <div style={{ position:'sticky', top:'70px' }}>
          <div style={{ background:C.white, borderRadius:'16px', border:`1px solid ${C.border}`, boxShadow:C.sm, overflow:'hidden' }}>
            {/* Preview header */}
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:'8px' }}>
              <Video size={14} color={C.amber}/>
              <span style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>Live Preview</span>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:sc.color, fontWeight:600 }}>
                <span>{sc.icon}</span>{sc.label}
              </div>
            </div>

            {/* Video result */}
            {videoUrl ? (
              <div style={{ padding:'14px' }}>
                <VideoPlayer src={videoUrl}/>
                {/* Download panel */}
                <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'7px' }}>
                  <button type="button" onClick={download}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'11px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit', transition:'all .15s' }}>
                    <Download size={15}/> Download Video
                  </button>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                    <button type="button" onClick={generateVideo}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'9px', borderRadius:'9px', border:`1.5px solid ${C.border}`, background:C.white, color:C.inkMuted, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      <RefreshCw size={13}/> Regenerate
                    </button>
                    <Link href="/gallery" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'9px', borderRadius:'9px', border:`1.5px solid ${C.border}`, background:C.white, color:C.inkMuted, fontSize:'12px', fontWeight:600, textDecoration:'none' }}>
                      📁 Galeri
                    </Link>
                  </div>
                </div>
                {elapsed && (
                  <div style={{ marginTop:'8px', textAlign:'center', fontSize:'10px', color:C.inkDim }}>
                    Selesai dalam {elapsed}s · {RESOLUTION_OPTIONS.find(r=>r.id===resolution)?.size}
                  </div>
                )}
              </div>
            ) : (
              /* Preview placeholder */
              <div style={{ padding:'24px 18px', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
                {/* Phone mockup */}
                <div style={{ width:'140px', height:'240px', borderRadius:'18px', background:C.bgAlt, border:`2px solid ${C.border}`, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {/* Step-aware preview content */}
                  {currentStep >= 3 && charSelected ? (
                    <div style={{ textAlign:'center', padding:'12px' }}>
                      <div style={{ fontSize:'48px', marginBottom:'8px' }}>{charSelected.icon}</div>
                      <div style={{ fontSize:'10px', fontWeight:700, color:C.ink, marginBottom:'3px' }}>{charSelected.label}</div>
                      <div style={{ fontSize:'9px', color:C.inkMuted }}>{charSelected.age}</div>
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'12px' }}>
                      <div style={{ fontSize:'32px', marginBottom:'8px' }}>🎬</div>
                      <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.5 }}>Preview video muncul setelah generate</div>
                    </div>
                  )}
                  {/* Skeleton overlay when generating */}
                  {status !== 'idle' && status !== 'completed' && status !== 'error' && (
                    <div style={{ position:'absolute', inset:0, background:`${C.amber}12`, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
                      <Loader2 size={24} color={C.amber} style={{ animation:'spin .8s linear infinite' }}/>
                    </div>
                  )}
                  {/* Subtitle overlay preview */}
                  {subtitleStyle !== 'none' && currentStep >= 7 && (
                    <div style={{ position:'absolute', bottom:'12px', left:'10px', right:'10px', padding:'4px 7px', borderRadius:'5px', background:subtitleStyle==='tiktok'?'rgba(0,0,0,.75)':subtitleStyle==='reels'?'rgba(255,255,255,.85)':'rgba(0,0,0,.5)', textAlign:'center', fontSize:'9px', fontWeight:700, color:subtitleStyle==='reels'?C.ink:'#fff' }}>
                      {subtitleStyle.toUpperCase()} STYLE
                    </div>
                  )}
                </div>

                {/* Config summary */}
                <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'6px' }}>
                  {[
                    { label:'Konten',   val:CONTENT_TYPES.find(c=>c.id===contentType)?.label,       show:!!contentType,  icon:'🎬' },
                    { label:'Karakter', val:charSelected?.label,                                      show:!!character,    icon:'🧑' },
                    { label:'Bahasa',   val:LANGUAGE_OPTIONS.find(l=>l.id===language)?.label,         show:currentStep>=4, icon:'🗣️' },
                    { label:'Preset',   val:VIDEO_PRESETS.find(v=>v.id===videoPreset)?.label,         show:!!videoPreset,  icon:'🎯' },
                    { label:'Durasi',   val:`${duration}s`,                                           show:currentStep>=7, icon:'⏱️' },
                  ].filter(item => item.show && item.val).map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'6px 9px', borderRadius:'7px', background:C.bg, border:`1px solid ${C.border}`, fontSize:'11px' }}>
                      <span>{item.icon}</span>
                      <span style={{ color:C.inkMuted, flexShrink:0 }}>{item.label}:</span>
                      <span style={{ color:C.ink, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* Script preview */}
                {activeScript && (
                  <div style={{ width:'100%', padding:'10px 12px', borderRadius:'9px', background:C.amberXlt, border:`1px solid ${C.amber}30` }}>
                    <div style={{ fontSize:'10px', fontWeight:700, color:C.amberDk, marginBottom:'5px' }}>📝 Script Preview</div>
                    <p style={{ fontSize:'10px', color:C.inkSub, lineHeight:1.7, margin:0 }}>
                      {activeScript.substring(0, 180)}{activeScript.length > 180 ? '...' : ''}
                    </p>
                  </div>
                )}

                {/* Progress status */}
                {status !== 'idle' && (
                  <div style={{ width:'100%', padding:'10px 12px', borderRadius:'9px', background:C.bg, border:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:sc.color }}>{sc.icon} {sc.label}</div>
                      <div style={{ fontSize:'11px', fontWeight:700, color:C.amber }}>{progress}%</div>
                    </div>
                    <div style={{ height:'4px', background:C.bgAlt, borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, width:`${progress}%`, transition:'width .5s ease' }}/>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {status === 'idle' && !videoUrl && currentStep < 8 && (
                  <div style={{ textAlign:'center', fontSize:'11px', color:C.inkDim, lineHeight:1.7 }}>
                    Selesaikan {8-currentStep} langkah lagi<br/>untuk generate video UGC
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
        ::-webkit-scrollbar { width:5px; height:5px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:3px }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 360px"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="repeat(3,1fr)"] { grid-template-columns: 1fr 1fr !important }
          div[style*="repeat(4,1fr)"] { grid-template-columns: 1fr 1fr !important }
        }
      `}
      </style>
    </div>
  )
}