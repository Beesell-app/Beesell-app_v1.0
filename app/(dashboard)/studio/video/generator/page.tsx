'use client'
// app/(dashboard)/studio/video/generator/page.tsx
// ══════════════════════════════════════════════════════════════
// AI VIDEO GENERATOR — Marketing-Ready Video Tanpa Skill Editing
// Modules: Slideshow + Talking Head + Subtitle + Sound + Duration
// 7-step wizard · Light theme · Amber primary
// ══════════════════════════════════════════════════════════════

import {
  useState, useCallback, useEffect, useRef, useMemo,
} from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Sparkles, Loader2, Check,
  CheckCircle2, AlertCircle, Play, Download, RefreshCw,
  Upload, X, Volume2, Music, Mic, ChevronDown,
  ChevronUp, Copy, Video, Image, FileText, Zap,
  Settings2, Eye, Hash, Clock, Layers, Star,
} from 'lucide-react'
import {
  VIDEO_MODULES, PLATFORMS, AVATAR_PRESETS,
  SUBTITLE_STYLES, SLIDE_LAYOUTS, TRANSITIONS,
  TEXT_ANIMATIONS, DURATION_OPTIONS, NICHES,
  type VideoModuleId, type PlatformId, type DurationSec,
  type NicheId, type AvatarId, type SubtitleStyle,
} from '@/lib/studio/video/video-generator-presets'
import { useVideoJob } from '@/lib/runway/useVideoJob'

// ── Tokens ────────────────────────────────────────────────────
const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB', borderHi:'#D1D5DB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5',
  blue:'#3B82F6', blueLt:'#EFF6FF',
  purple:'#7C3AED', purpleLt:'#F5F3FF',
  red:'#EF4444', redLt:'#FEF2F2',
  teal:'#0D9488',
  sh:'0 1px 3px rgba(0,0,0,.06)',
  sm:'0 4px 16px rgba(0,0,0,.07)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

// ── Steps ─────────────────────────────────────────────────────
const STEPS = [
  { id:1, label:'Modul',     icon:'🎬', key:'module' },
  { id:2, label:'Platform',  icon:'📱', key:'platform' },
  { id:3, label:'Produk',    icon:'📦', key:'product' },
  { id:4, label:'Script',    icon:'📝', key:'script' },
  { id:5, label:'Visual',    icon:'🎨', key:'visual' },
  { id:6, label:'Subtitle',  icon:'💬', key:'subtitle' },
  { id:7, label:'Generate',  icon:'⚡', key:'generate' },
]

// ── Small atoms ────────────────────────────────────────────────
function Pill({ label, selected, onClick, color=C.amber, icon }: {
  label:string; selected:boolean; onClick:()=>void; color?:string; icon?:string
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 13px', borderRadius:'99px', border:`1.5px solid ${selected?color:C.border}`, background:selected?`${color}12`:C.surface, color:selected?color:C.inkMuted, fontSize:'12px', fontWeight:selected?700:500, cursor:'pointer', transition:'all .12s', whiteSpace:'nowrap', fontFamily:'inherit', boxShadow:selected?`0 0 0 1px ${color}25`:'none' }}
      onMouseEnter={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=color }}
      onMouseLeave={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=C.border }}>
      {icon && <span style={{ fontSize:'13px' }}>{icon}</span>}{label}
    </button>
  )
}

function CopyBtn({ text }: { text:string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 10px', borderRadius:'7px', border:`1px solid ${copied?C.green:C.border}`, background:copied?C.greenLt:C.surface, color:copied?C.green:C.inkDim, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
      {copied ? <><Check size={11}/> Tersalin</> : <><Copy size={11}/> Salin</>}
    </button>
  )
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:C.surface, borderRadius:'16px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden', ...style }}>{children}</div>
}

function CardH({ title, icon, sub, badge, color=C.amber }: { title:string; icon?:string; sub?:string; badge?:string; color?:string }) {
  return (
    <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:'9px', background:C.bg }}>
      {icon && <span style={{ fontSize:'18px' }}>{icon}</span>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>{title}</div>
        {sub && <div style={{ fontSize:'10px', color:C.inkMuted, marginTop:'1px' }}>{sub}</div>}
      </div>
      {badge && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 7px', borderRadius:'99px', background:`${color}18`, color }}>{badge}</span>}
    </div>
  )
}

// ── Progress ring for job ─────────────────────────────────────
function JobProgress({ progress, status, elapsed, remaining }: { progress:number; status:string; elapsed:number; remaining:number }) {
  const r = 44, circ = 2*Math.PI*r, dash = (progress/100)*circ
  const statusColor = status === 'completed' ? C.green : status === 'failed' ? C.red : C.amber
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
      <div style={{ position:'relative', width:'110px', height:'110px' }}>
        <svg width="110" height="110" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke={C.border} strokeWidth="7"/>
          <circle cx="55" cy="55" r={r} fill="none" stroke={statusColor} strokeWidth="7"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray .4s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          {status === 'completed' ? <CheckCircle2 size={32} color={C.green}/> :
           status === 'failed'    ? <AlertCircle  size={32} color={C.red}/> :
           <Loader2 size={28} color={C.amber} style={{ animation:'spin .9s linear infinite' }}/>}
        </div>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'14px', fontWeight:700, color:C.ink, marginBottom:'3px' }}>
          {status === 'completed' ? '✅ Video Selesai!' :
           status === 'failed'    ? '❌ Generate Gagal' :
           status === 'processing'? `AI Merender... ${progress}%` : 'Mengirim ke AI...'}
        </div>
        <div style={{ fontSize:'11px', color:C.inkMuted }}>
          {status === 'completed' ? 'Video siap didownload' :
           `${elapsed}s berlalu · Sisa ~${remaining}s`}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function VideoGeneratorPage() {
  const [step,         setStep]         = useState(1)

  // Step 1 — Module
  const [moduleId,     setModuleId]     = useState<VideoModuleId>('slideshow')
  // Step 2 — Platform + Duration
  const [platform,     setPlatform]     = useState<PlatformId>('tiktok')
  const [duration,     setDuration]     = useState<DurationSec>(30)
  // Step 3 — Product info
  const [productName,  setProductName]  = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [benefit,      setBenefit]      = useState('')
  const [painPoint,    setPainPoint]    = useState('')
  const [cta,          setCta]          = useState('Order sekarang!')
  const [niche,        setNiche]        = useState<NicheId>('general')
  const [language,     setLanguage]     = useState<'indonesia'|'english'>('indonesia')
  const [tone,         setTone]         = useState('energik dan friendly')
  // Step 4 — Script
  const [script,       setScript]       = useState('')
  const [scriptHooks,  setScriptHooks]  = useState<string[]>([])
  const [scriptLoading,setScriptLoading]= useState(false)
  const [slideTexts,   setSlideTexts]   = useState<{heading:string;sub:string}[]>([])
  // Step 5 — Visual
  const [images,       setImages]       = useState<File[]>([])
  const [imagePreviews,setImagePreviews]= useState<string[]>([])
  const [avatarId,     setAvatarId]     = useState<AvatarId>('f-indo-young')
  const [soundId,      setSoundId]      = useState<string>('')
  const [sounds,       setSounds]       = useState<any[]>([])
  const [soundsLoading,setSoundsLoading]= useState(false)
  const [ttsPlaying,   setTtsPlaying]   = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Step 6 — Subtitle
  const [subtitleStyle,setSubtitleStyle]= useState<SubtitleStyle>('tiktok-bold')
  const [manualSubs,   setManualSubs]   = useState('')
  const [autoSubs,     setAutoSubs]     = useState<any[]>([])
  const [subsLoading,  setSubsLoading]  = useState(false)
  // Step 7 — Generate
  const { dispatch, status, progress, videoUrl, error:jobError, elapsedSec, remainingSec, isWorking, cancel, reset } = useVideoJob()
  const [hashtags,     setHashtags]     = useState<string[]>([])
  const [genError,     setGenError]     = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  // Selected configs
  const selModule   = VIDEO_MODULES.find(m => m.id === moduleId)!
  const selPlatform = PLATFORMS.find(p => p.id === platform)!
  const selDuration = DURATION_OPTIONS.find(d => d.sec === duration)!
  const selAvatar   = AVATAR_PRESETS.find(a => a.id === avatarId)!

  const hasAvatar     = moduleId === 'talking-head' || moduleId === 'slideshow-avatar'
  const hasSlideshow  = moduleId === 'slideshow'    || moduleId === 'slideshow-avatar'

  // ── Step validation ───────────────────────────────────────
  const canProceed = useMemo(() => ({
    1: !!moduleId,
    2: !!platform && !!duration,
    3: !!productName.trim(),
    4: !!script.trim() || (hasSlideshow && slideTexts.length > 0),
    5: (hasSlideshow ? images.length > 0 : true) && (hasAvatar ? !!avatarId : true),
    6: true,
    7: true,
  }), [moduleId, platform, duration, productName, script, hasSlideshow, hasAvatar, images, avatarId, slideTexts])

  // ── API calls ─────────────────────────────────────────────
  const generateScript = useCallback(async () => {
    if (!productName.trim()) return
    setScriptLoading(true)
    try {
      const res  = await fetch('/api/studio/video/generator?action=script', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ productName, productPrice, benefit, painPoint, cta, niche, platform, duration, tone, language }),
      })
      const data = await res.json()
      if (data.script)    setScript(data.script)
      if (data.hooks)     setScriptHooks(data.hooks)
      if (data.slideTexts)setSlideTexts(data.slideTexts)
      if (data.hashtags)  setHashtags(data.hashtags)
    } catch { /* keep existing */ } finally { setScriptLoading(false) }
  }, [productName, productPrice, benefit, painPoint, cta, niche, platform, duration, tone, language])

  const generateSubtitles = useCallback(async () => {
    if (!script.trim() || subtitleStyle === 'none' || subtitleStyle === 'manual') return
    setSubsLoading(true)
    try {
      const res  = await fetch('/api/studio/video/generator?action=subtitle', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ script, duration, style:subtitleStyle }),
      })
      const data = await res.json()
      if (data.subtitles) setAutoSubs(data.subtitles)
    } catch { /* silent */ } finally { setSubsLoading(false) }
  }, [script, duration, subtitleStyle])

  const loadSounds = useCallback(async () => {
    setSoundsLoading(true)
    try {
      const res  = await fetch('/api/studio/video/generator?action=sounds', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ niche, platform, duration }),
      })
      const data = await res.json()
      if (data.sounds) setSounds(data.sounds)
    } catch { /* silent */ } finally { setSoundsLoading(false) }
  }, [niche, platform, duration])

  useEffect(() => { if (step === 5) loadSounds() }, [step])
  useEffect(() => { if (step === 6) generateSubtitles() }, [step, subtitleStyle])

  // TTS preview
  const playTtsPreview = useCallback(async () => {
    if (!script.trim() || !hasAvatar) return
    setTtsPlaying(true)
    try {
      const res = await fetch('/api/studio/video/generator?action=tts-preview', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ text:script.substring(0,120), avatarId, language }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src) }
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => setTtsPlaying(false)
        audio.play()
      }
    } catch { /* silent */ } finally { setTimeout(() => setTtsPlaying(false), 5000) }
  }, [script, avatarId, hasAvatar, language])

  // Image upload
  const handleImages = useCallback((files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 10 - images.length)
    const previews = newFiles.map(f => URL.createObjectURL(f))
    setImages(p => [...p, ...newFiles])
    setImagePreviews(p => [...p, ...previews])
  }, [images])

  // Generate video
  const generateVideo = useCallback(async () => {
    setGenError('')
    const fd = new FormData()
    fd.append('module',        moduleId)
    fd.append('platform',      platform)
    fd.append('duration',      String(duration))
    fd.append('script',        script)
    fd.append('niche',         niche)
    fd.append('subtitleStyle', subtitleStyle)
    fd.append('slideTexts',    JSON.stringify(slideTexts))
    if (avatarId && hasAvatar) fd.append('avatarId', avatarId)
    if (soundId) fd.append('soundId', soundId)
    images.forEach((img, i) => fd.append(`image${i}`, img))
    await dispatch(fd)
  }, [moduleId, platform, duration, script, niche, subtitleStyle, slideTexts, avatarId, hasAvatar, soundId, images, dispatch])

  const nav = (dir: 1 | -1) => setStep(p => Math.min(STEPS.length, Math.max(1, p + dir)))

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* ── Top bar ────────────────────────────────────── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'11px 20px', display:'flex', alignItems:'center', gap:'14px', position:'sticky', top:0, zIndex:100, boxShadow:C.sh }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'5px', color:C.inkMuted, textDecoration:'none', fontSize:'13px' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.ink}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.inkMuted}>
          <ArrowLeft size={15}/> Studio
        </Link>
        <div style={{ width:'1px', height:'16px', background:C.border }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🎬</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>AI Video Generator</div>
            <div style={{ fontSize:'10px', color:C.inkMuted }}>Video marketing-ready tanpa skill editing</div>
          </div>
        </div>
        <div style={{ marginLeft:'auto', padding:'3px 10px', borderRadius:'6px', background:C.amberLt, border:`1px solid ${C.amber}30`, fontSize:'11px', fontWeight:600, color:C.amberDk }}>Basic+</div>
      </div>

      <div style={{ maxWidth:'980px', margin:'0 auto', padding:'24px 20px' }}>

        {/* ── Step progress ────────────────────────────── */}
        <div style={{ display:'flex', gap:'0', marginBottom:'28px', overflowX:'auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', flex:i < STEPS.length-1 ? 1 : 'none' }}>
              <div
                onClick={() => s.id < step && setStep(s.id)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', cursor:s.id < step ? 'pointer' : 'default', padding:'0 4px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:`2px solid ${step === s.id ? C.amber : step > s.id ? C.green : C.border}`, background:step === s.id ? C.amberXlt : step > s.id ? C.greenLt : C.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', transition:'all .2s' }}>
                  {step > s.id ? <Check size={16} color={C.green}/> : s.icon}
                </div>
                <div style={{ fontSize:'10px', fontWeight:step===s.id?700:500, color:step===s.id?C.amberDk:step>s.id?C.green:C.inkDim, whiteSpace:'nowrap' }}>{s.label}</div>
              </div>
              {i < STEPS.length-1 && (
                <div style={{ flex:1, height:'2px', background:step > s.id ? C.green : C.border, margin:'0 4px 18px', transition:'background .2s', minWidth:'20px' }}/>
              )}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            STEP 1: MODULE
        ══════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:C.ink, marginBottom:'6px' }}>🎬 Pilih Modul Video</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>Setiap modul menghasilkan jenis video marketing yang berbeda — pilih sesuai kebutuhan kamu.</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'14px' }}>
              {VIDEO_MODULES.map(mod => (
                <div key={mod.id} onClick={() => setModuleId(mod.id)}
                  style={{ borderRadius:'16px', border:`2px solid ${moduleId===mod.id?mod.color:C.border}`, background:moduleId===mod.id?mod.colorLt:C.surface, cursor:'pointer', transition:'all .18s', boxShadow:moduleId===mod.id?`0 0 0 1px ${mod.color}20,${C.sm}`:C.sh, overflow:'hidden' }}>
                  <div style={{ padding:'18px 18px 14px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
                      <div style={{ width:'50px', height:'50px', borderRadius:'14px', background:`${mod.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>{mod.icon}</div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                        {mod.badge && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'99px', background:mod.color, color:'#fff' }}>{mod.badge}</span>}
                        {moduleId===mod.id && <CheckCircle2 size={18} color={mod.color}/>}
                      </div>
                    </div>
                    <div style={{ fontSize:'15px', fontWeight:800, color:moduleId===mod.id?mod.color:C.ink, marginBottom:'5px' }}>{mod.label}</div>
                    <div style={{ fontSize:'12px', color:C.inkMuted, lineHeight:1.6, marginBottom:'12px' }}>{mod.desc}</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      {mod.features.map((f, i) => (
                        <div key={i} style={{ display:'flex', gap:'6px', fontSize:'11px', color:C.inkSub }}>
                          <span style={{ color:mod.color, fontWeight:700, flexShrink:0 }}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2: PLATFORM + DURATION
        ══════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:C.ink, marginBottom:'6px' }}>📱 Platform & Durasi</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>Pilih platform tujuan posting — AI akan otomatis menyesuaikan format, rasio, dan gaya konten.</p>
            </div>
            <Card>
              <CardH title="Platform Tujuan" icon="📱" sub="Pilih 1 platform utama — bisa export ke lainnya nanti"/>
              <div style={{ padding:'16px 18px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'10px' }}>
                {PLATFORMS.map(p => (
                  <div key={p.id} onClick={() => setPlatform(p.id)}
                    style={{ padding:'13px', borderRadius:'12px', border:`1.5px solid ${platform===p.id?C.amber:C.border}`, background:platform===p.id?C.amberXlt:C.bg, cursor:'pointer', transition:'all .15s', textAlign:'center', boxShadow:platform===p.id?C.sa:'none' }}>
                    <div style={{ fontSize:'24px', marginBottom:'6px' }}>{p.icon}</div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:platform===p.id?C.amberDk:C.ink, marginBottom:'2px' }}>{p.label}</div>
                    <div style={{ fontSize:'10px', color:C.inkMuted, marginBottom:'5px' }}>{p.ratio} · {p.size}</div>
                    <div style={{ fontSize:'9px', color:C.inkDim }}>{p.desc}</div>
                    {platform===p.id && <CheckCircle2 size={14} color={C.amber} style={{ margin:'5px auto 0', display:'block' }}/>}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardH title="Durasi Video" icon="⏱️" sub="Pilih durasi sesuai platform dan tujuan konten"/>
              <div style={{ padding:'16px 18px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {DURATION_OPTIONS.filter(d => selPlatform?.durations.includes(d.sec)).map(d => (
                  <div key={d.sec} onClick={() => setDuration(d.sec)}
                    style={{ padding:'16px 14px', borderRadius:'13px', border:`1.5px solid ${duration===d.sec?C.amber:C.border}`, background:duration===d.sec?C.amberXlt:C.surface, cursor:'pointer', transition:'all .15s', textAlign:'center', boxShadow:duration===d.sec?C.sa:C.sh }}>
                    <div style={{ fontSize:'28px', marginBottom:'6px' }}>{d.icon}</div>
                    <div style={{ fontSize:'16px', fontWeight:800, color:duration===d.sec?C.amberDk:C.ink, marginBottom:'4px' }}>{d.label}</div>
                    <div style={{ fontSize:'11px', color:C.inkMuted, lineHeight:1.6, marginBottom:'6px' }}>{d.desc}</div>
                    <div style={{ fontSize:'10px', color:C.inkDim, lineHeight:1.4 }}>Max {d.maxSlides} slide · ~{d.maxWords} kata</div>
                    <div style={{ marginTop:'8px', fontSize:'10px', fontWeight:600, color:duration===d.sec?C.amberDk:C.inkMuted, padding:'3px 8px', borderRadius:'99px', background:duration===d.sec?C.amberLt:`${C.amber}08`, display:'inline-block' }}>{d.idealFor}</div>
                    {duration===d.sec && <CheckCircle2 size={14} color={C.amber} style={{ margin:'6px auto 0', display:'block' }}/>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 3: PRODUCT INFO
        ══════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:C.ink, marginBottom:'6px' }}>📦 Info Produk</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>Isi info produk — AI akan generate script dan visual yang disesuaikan dengan produk kamu secara otomatis.</p>
            </div>
            <Card>
              <CardH title="Detail Produk" icon="📦"/>
              <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:'12px' }}>
                {/* Niche */}
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'7px' }}>Kategori Niche</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {NICHES.map(n => <Pill key={n.id} label={`${n.icon} ${n.label}`} selected={niche===n.id} onClick={()=>setNiche(n.id)} color={C.purple}/>)}
                  </div>
                </div>
                {/* Nama produk + harga */}
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px' }}>
                  {[
                    { label:'Nama Produk *', val:productName, set:setProductName, placeholder:'Contoh: Serum Vitamin C 30ml' },
                    { label:'Harga', val:productPrice, set:setProductPrice, placeholder:'Rp 89.000' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'4px' }}>{f.label}</label>
                      <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder}
                        style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:C.white }}
                        onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                        onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                    </div>
                  ))}
                </div>
                {/* Benefit + pain + CTA */}
                {[
                  { label:'Benefit Utama', val:benefit, set:setBenefit, placeholder:'Contoh: Kulit glowing dalam 7 hari' },
                  { label:'Pain Point Pelanggan', val:painPoint, set:setPainPoint, placeholder:'Contoh: Kulit kusam, susah cerah meski sudah skincare' },
                  { label:'Call to Action', val:cta, set:setCta, placeholder:'Contoh: Order sekarang! Gratis ongkir!' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'4px' }}>{f.label}</label>
                    <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:C.white }}
                      onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                      onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                  </div>
                ))}
                {/* Bahasa + Tone */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Bahasa</label>
                    <div style={{ display:'flex', gap:'6px' }}>
                      {(['indonesia','english'] as const).map(l => (
                        <Pill key={l} label={l==='indonesia'?'🇮🇩 Indonesia':'🇺🇸 English'} selected={language===l} onClick={()=>setLanguage(l)} color={C.green}/>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'4px' }}>Tone</label>
                    <select value={tone} onChange={e=>setTone(e.target.value)}
                      style={{ width:'100%', padding:'8px 11px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', fontFamily:'inherit', background:C.white, outline:'none', cursor:'pointer' }}>
                      {['energik dan friendly','casual santai','profesional','luxury premium','gen-z gaul','motivasional'].map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 4: SCRIPT
        ══════════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
              <div>
                <h2 style={{ fontSize:'20px', fontWeight:800, color:C.ink, marginBottom:'6px' }}>📝 Script Video</h2>
                <p style={{ fontSize:'13px', color:C.inkMuted }}>Generate script otomatis dengan AI, atau edit sesuai kebutuhan kamu.</p>
              </div>
              <button type="button" onClick={generateScript} disabled={!productName.trim() || scriptLoading}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 18px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:!productName.trim()||scriptLoading?'not-allowed':'pointer', opacity:!productName.trim()||scriptLoading?.5:1, fontFamily:'inherit', boxShadow:C.sa }}>
                {scriptLoading ? <Loader2 size={14} style={{ animation:'spin .8s linear infinite' }}/> : <Sparkles size={14}/>}
                {scriptLoading ? 'Generating...' : 'Generate dengan AI'}
              </button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }} className="script-grid">
              {/* Script editor */}
              <Card>
                <CardH title="Script Narasi" sub={`${duration}s · Max ~${selDuration?.maxWords ?? 70} kata`}
                  badge={`${script.split(/\s+/).filter(Boolean).length} kata`}/>
                <div style={{ padding:'14px 16px' }}>
                  <textarea value={script} onChange={e=>setScript(e.target.value)}
                    placeholder={`Tulis atau generate script ${duration} detik kamu di sini...\n\nContoh:\n"${productName || 'Produk'} ini yang bikin semua orang penasaran! Dalam ${duration >= 60 ? '14' : '7'} hari pakai, hasilnya bisa kamu lihat sendiri..."`}
                    rows={12}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:`1.5px solid ${C.border}`, fontSize:'13px', lineHeight:1.7, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:C.white, color:C.ink }}
                    onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                    onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                  <div style={{ display:'flex', gap:'8px', marginTop:'10px', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' }}>
                    <div style={{ fontSize:'11px', color:C.inkDim }}>
                      ~{Math.round(script.split(/\s+/).filter(Boolean).length/2.5)}s bicara · {selDuration?.maxWords??70} kata ideal untuk {duration}s
                    </div>
                    <div style={{ display:'flex', gap:'6px' }}>
                      {hasAvatar && (
                        <button type="button" onClick={playTtsPreview} disabled={!script.trim() || ttsPlaying}
                          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'8px', border:`1px solid ${C.border}`, background:ttsPlaying?C.amberXlt:C.surface, fontSize:'11px', fontWeight:600, color:ttsPlaying?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                          {ttsPlaying ? <Loader2 size={11} style={{ animation:'spin .8s linear infinite' }}/> : <Volume2 size={11}/>}
                          Preview Suara
                        </button>
                      )}
                      <CopyBtn text={script}/>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Hooks + slide texts */}
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {/* Hook variants */}
                {scriptHooks.length > 0 && (
                  <Card>
                    <CardH title="🎣 Hook Variants" sub="3 pilihan hook A/B test" badge="AI Generated" color={C.red}/>
                    <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'8px' }}>
                      {scriptHooks.slice(0,3).map((hook, i) => (
                        <div key={i} style={{ padding:'10px 12px', borderRadius:'10px', border:`1px solid ${i===0?C.amber+'30':C.border}`, background:i===0?C.amberXlt:C.bg }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
                            <span style={{ fontSize:'10px', fontWeight:800, color:i===0?C.amberDk:C.inkDim }}>Version {['A','B','C'][i]}</span>
                            <button type="button" onClick={()=>setScript(p => hook + '\n\n' + p.split('\n\n').slice(1).join('\n\n'))}
                              style={{ fontSize:'10px', color:C.amber, fontWeight:700, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                              Pakai →
                            </button>
                          </div>
                          <div style={{ fontSize:'12px', color:C.ink, fontStyle:'italic', lineHeight:1.5 }}>"{hook}"</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Slide texts */}
                {hasSlideshow && slideTexts.length > 0 && (
                  <Card>
                    <CardH title="📋 Slide Texts" sub={`${slideTexts.length} slide untuk ${duration}s video`}/>
                    <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'7px', maxHeight:'260px', overflowY:'auto' }}>
                      {slideTexts.map((s, i) => (
                        <div key={i} style={{ display:'flex', gap:'10px', alignItems:'center', padding:'8px 10px', borderRadius:'8px', background:C.bg, border:`1px solid ${C.border}` }}>
                          <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:`${C.amber}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:800, color:C.amberDk, flexShrink:0 }}>{i+1}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.heading}</div>
                            <div style={{ fontSize:'10px', color:C.inkMuted }}>{s.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Hashtags */}
                {hashtags.length > 0 && (
                  <Card>
                    <CardH title="#️⃣ Hashtag" sub="Auto-generated per niche + platform"/>
                    <div style={{ padding:'12px 14px', display:'flex', flexWrap:'wrap', gap:'6px' }}>
                      {hashtags.map((h, i) => (
                        <span key={i} style={{ fontSize:'11px', fontWeight:600, padding:'4px 10px', borderRadius:'99px', background:`${C.blue}12`, color:C.blue, cursor:'pointer' }}
                          onClick={() => navigator.clipboard.writeText(h)}>{h}</span>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 5: VISUAL (Images + Avatar + Sound)
        ══════════════════════════════════════════════ */}
        {step === 5 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:C.ink, marginBottom:'6px' }}>🎨 Visual & Audio</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>Upload foto produk, pilih avatar presenter, dan music trending yang sesuai niche kamu.</p>
            </div>

            {/* Image upload (slideshow modules) */}
            {hasSlideshow && (
              <Card>
                <CardH title="📸 Foto Produk" sub={`Upload ${selDuration?.maxSlides ?? 7} foto — urutan sesuai slide`} badge={`${images.length}/${selDuration?.maxSlides ?? 7} foto`}/>
                <div style={{ padding:'14px 16px' }}>
                  {/* Thumbnails */}
                  {imagePreviews.length > 0 && (
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px' }}>
                      {imagePreviews.map((src, i) => (
                        <div key={i} style={{ position:'relative', width:'72px', height:'72px', borderRadius:'10px', overflow:'hidden', border:`1px solid ${C.border}` }}>
                          <img src={src} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          <button onClick={() => { setImages(p=>p.filter((_,j)=>j!==i)); setImagePreviews(p=>p.filter((_,j)=>j!==i)) }}
                            style={{ position:'absolute', top:'2px', right:'2px', width:'18px', height:'18px', borderRadius:'50%', background:'rgba(0,0,0,.6)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <X size={10}/>
                          </button>
                          <div style={{ position:'absolute', bottom:'2px', left:'4px', fontSize:'9px', fontWeight:700, color:'#fff', background:'rgba(0,0,0,.5)', padding:'1px 4px', borderRadius:'3px' }}>{i+1}</div>
                        </div>
                      ))}
                      {images.length < (selDuration?.maxSlides ?? 7) && (
                        <button onClick={() => fileRef.current?.click()}
                          style={{ width:'72px', height:'72px', borderRadius:'10px', border:`2px dashed ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px', color:C.inkDim, fontSize:'10px' }}>
                          <Upload size={16}/> Add
                        </button>
                      )}
                    </div>
                  )}
                  {imagePreviews.length === 0 && (
                    <div onClick={() => fileRef.current?.click()}
                      style={{ borderRadius:'12px', border:`2px dashed ${C.border}`, background:C.bg, cursor:'pointer', padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', textAlign:'center' }}>
                      <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>📸</div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>Upload Foto Produk</div>
                      <div style={{ fontSize:'11px', color:C.inkMuted }}>Drag & drop · JPG, PNG, WEBP · Hingga {selDuration?.maxSlides ?? 7} foto</div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => handleImages(e.target.files)}/>
                </div>
              </Card>
            )}

            {/* Avatar picker (talking head modules) */}
            {hasAvatar && (
              <Card>
                <CardH title="🎭 Avatar Presenter" sub="AI Talking Head — membacakan script kamu secara natural" badge="D-ID + ElevenLabs"/>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'8px' }}>
                    {AVATAR_PRESETS.map(av => (
                      <div key={av.id} onClick={() => setAvatarId(av.id)}
                        style={{ padding:'11px 10px', borderRadius:'12px', border:`1.5px solid ${avatarId===av.id?C.purple:C.border}`, background:avatarId===av.id?C.purpleLt:av.bg, cursor:'pointer', transition:'all .15s', textAlign:'center', boxShadow:avatarId===av.id?`0 0 0 1px ${C.purple}20`:C.sh }}>
                        <div style={{ fontSize:'28px', marginBottom:'5px' }}>{av.icon}</div>
                        <div style={{ fontSize:'11px', fontWeight:700, color:avatarId===av.id?C.purple:C.ink, marginBottom:'2px' }}>{av.label}</div>
                        <div style={{ fontSize:'9px', color:C.inkMuted, lineHeight:1.3 }}>{av.age} · {av.style}</div>
                        {avatarId===av.id && <CheckCircle2 size={13} color={C.purple} style={{ margin:'5px auto 0', display:'block' }}/>}
                      </div>
                    ))}
                  </div>
                  {/* TTS preview button */}
                  {script.trim() && (
                    <div style={{ marginTop:'12px', padding:'11px 14px', borderRadius:'10px', background:C.purpleLt, border:`1px solid ${C.purple}25`, display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'24px' }}>{selAvatar?.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'12px', fontWeight:700, color:C.purple }}>{selAvatar?.label}</div>
                        <div style={{ fontSize:'10px', color:C.inkMuted }}>{selAvatar?.desc}</div>
                      </div>
                      <button type="button" onClick={playTtsPreview} disabled={ttsPlaying}
                        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'8px', border:'none', background:C.purple, color:'#fff', fontSize:'11px', fontWeight:700, cursor:ttsPlaying?'not-allowed':'pointer', fontFamily:'inherit' }}>
                        {ttsPlaying ? <Loader2 size={12} style={{ animation:'spin .8s linear infinite' }}/> : <Volume2 size={12}/>}
                        Preview Suara
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Trending sounds */}
            <Card>
              <CardH title="🎵 Trending Sound Detector" sub={`Rekomendasi audio trending untuk niche ${niche} di ${selPlatform?.label ?? platform}`} badge="Auto-detect"/>
              <div style={{ padding:'14px 16px' }}>
                {soundsLoading ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {[1,2,3].map(i => <div key={i} style={{ height:'56px', borderRadius:'9px', background:C.bg, border:`1px solid ${C.border}`, animation:'pulse 1.5s ease-in-out infinite' }}/>)}
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {/* No sound option */}
                    <div onClick={() => setSoundId('')}
                      style={{ display:'flex', gap:'12px', alignItems:'center', padding:'10px 12px', borderRadius:'10px', border:`1.5px solid ${soundId===''?C.border:C.border}`, background:soundId===''?C.bg:C.surface, cursor:'pointer', transition:'all .15s' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:C.bg, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🔇</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'12px', fontWeight:600, color:C.ink }}>Tanpa Musik</div>
                        <div style={{ fontSize:'10px', color:C.inkMuted }}>Video narasi saja</div>
                      </div>
                      {soundId==='' && <CheckCircle2 size={15} color={C.amber}/>}
                    </div>

                    {sounds.map((s: any) => (
                      <div key={s.id} onClick={() => setSoundId(s.id)}
                        style={{ display:'flex', gap:'12px', alignItems:'center', padding:'10px 12px', borderRadius:'10px', border:`1.5px solid ${soundId===s.id?C.amber:C.border}`, background:soundId===s.id?C.amberXlt:C.surface, cursor:'pointer', transition:'all .15s', boxShadow:soundId===s.id?C.sa:C.sh }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${C.amber}15`, border:`1px solid ${C.amber}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>🎵</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                            <div style={{ fontSize:'12px', fontWeight:700, color:C.ink }}>{s.title}</div>
                            {s.trending && <span style={{ fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'4px', background:C.red, color:'#fff' }}>TRENDING</span>}
                          </div>
                          <div style={{ fontSize:'10px', color:C.inkMuted }}>{s.artist} · {s.duration}s · {s.bpm} BPM · {s.mood}</div>
                        </div>
                        <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                          <span style={{ fontSize:'9px', fontWeight:600, padding:'2px 7px', borderRadius:'99px', background:`${C.blue}12`, color:C.blue }}>{s.license === 'royalty-free' ? 'Free' : 'Commercial'}</span>
                          {soundId===s.id && <CheckCircle2 size={15} color={C.amber}/>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 6: SUBTITLE
        ══════════════════════════════════════════════ */}
        {step === 6 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:C.ink, marginBottom:'6px' }}>💬 Subtitle & Caption</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>Pilih style subtitle — auto-generated dari script atau input manual dengan timing kustom.</p>
            </div>

            {/* Style picker */}
            <Card>
              <CardH title="Style Subtitle" sub="Pilih gaya tampilan subtitle video kamu"/>
              <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'10px' }}>
                {SUBTITLE_STYLES.map(ss => (
                  <div key={ss.id} onClick={() => setSubtitleStyle(ss.id)}
                    style={{ padding:'13px', borderRadius:'12px', border:`1.5px solid ${subtitleStyle===ss.id?ss.color:C.border}`, background:subtitleStyle===ss.id?`${ss.color}10`:C.surface, cursor:'pointer', transition:'all .15s', boxShadow:subtitleStyle===ss.id?`0 0 0 1px ${ss.color}20`:C.sh }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                      <span style={{ fontSize:'18px' }}>{ss.icon}</span>
                      {subtitleStyle===ss.id && <CheckCircle2 size={14} color={ss.color}/>}
                    </div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:subtitleStyle===ss.id?ss.color:C.ink, marginBottom:'3px' }}>{ss.label}</div>
                    <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.4 }}>{ss.desc}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Preview / Manual input */}
            {subtitleStyle === 'manual' ? (
              <Card>
                <CardH title="✍️ Subtitle Manual" sub="Tulis subtitle dengan timing kustom (format SRT)"/>
                <div style={{ padding:'14px 16px' }}>
                  <textarea value={manualSubs} onChange={e=>setManualSubs(e.target.value)}
                    rows={10} placeholder={`Format SRT:\n1\n00:00:00,000 --> 00:00:03,000\nHai! Ini dia produk viral yang...\n\n2\n00:00:03,000 --> 00:00:06,000\nMengapa semua orang membelinya?`}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:`1.5px solid ${C.border}`, fontSize:'12px', fontFamily:'monospace', lineHeight:1.6, resize:'vertical', outline:'none', boxSizing:'border-box', background:C.white }}
                    onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                    onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                </div>
              </Card>
            ) : subtitleStyle !== 'none' && (
              <Card>
                <CardH title="Auto Subtitle Preview" sub={`${autoSubs.length} baris subtitle dari script kamu`} badge={subsLoading?'Loading...':'Generated'} color={C.green}/>
                <div style={{ padding:'14px 16px' }}>
                  {subsLoading ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                      {[1,2,3,4].map(i=><div key={i} style={{ height:'44px', borderRadius:'8px', background:C.bg, border:`1px solid ${C.border}` }}/>)}
                    </div>
                  ) : autoSubs.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'280px', overflowY:'auto' }}>
                      {autoSubs.slice(0,8).map((s: any) => (
                        <div key={s.id} style={{ display:'flex', gap:'10px', alignItems:'center', padding:'9px 11px', borderRadius:'9px', background:C.bg, border:`1px solid ${C.border}` }}>
                          <div style={{ fontSize:'9px', fontWeight:700, color:C.inkDim, flexShrink:0, width:'60px' }}>{s.start.toFixed(1)}s</div>
                          <div style={{ flex:1, fontSize:'12px', color:C.ink, fontWeight:subtitleStyle==='tiktok-bold'?700:400 }}>
                            {s.text}
                          </div>
                        </div>
                      ))}
                      {autoSubs.length > 8 && <div style={{ fontSize:'11px', color:C.inkDim, textAlign:'center', padding:'6px' }}>+{autoSubs.length-8} baris lagi</div>}
                    </div>
                  ) : (
                    <div style={{ padding:'20px', textAlign:'center', color:C.inkDim, fontSize:'12px' }}>
                      Generate script terlebih dulu untuk auto-subtitle
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 7: GENERATE
        ══════════════════════════════════════════════ */}
        {step === 7 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:C.ink, marginBottom:'6px' }}>⚡ Generate Video</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>Review konfigurasi kamu, lalu klik generate — AI akan membuat video marketing-ready untuk kamu.</p>
            </div>

            {/* Summary */}
            {!isWorking && status !== 'completed' && (
              <Card>
                <CardH title="📋 Ringkasan Konfigurasi" sub="Pastikan semua sudah benar sebelum generate"/>
                <div style={{ padding:'14px 18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  {[
                    { label:'Modul',     val:selModule?.label, icon:'🎬' },
                    { label:'Platform',  val:`${selPlatform?.icon} ${selPlatform?.label}`, icon:'📱' },
                    { label:'Durasi',    val:`${duration} detik`, icon:'⏱️' },
                    { label:'Produk',    val:productName || '—', icon:'📦' },
                    { label:'Avatar',    val:hasAvatar ? `${selAvatar?.icon} ${selAvatar?.label}` : 'Tidak ada', icon:'🎭' },
                    { label:'Subtitle',  val:SUBTITLE_STYLES.find(s=>s.id===subtitleStyle)?.label ?? '—', icon:'💬' },
                    { label:'Musik',     val:sounds.find(s=>s.id===soundId)?.title ?? 'Tanpa musik', icon:'🎵' },
                    { label:'Foto',      val:hasSlideshow ? `${images.length} foto` : 'N/A', icon:'📸' },
                  ].map((item, i) => (
                    <div key={i} style={{ display:'flex', gap:'10px', alignItems:'center', padding:'10px 12px', borderRadius:'10px', background:C.bg, border:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:'16px' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize:'10px', color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.06em' }}>{item.label}</div>
                        <div style={{ fontSize:'12px', fontWeight:700, color:C.ink }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'14px 18px 18px', borderTop:`1px solid ${C.border}` }}>
                  {genError && (
                    <div style={{ padding:'10px 13px', borderRadius:'9px', background:C.redLt, border:`1px solid ${C.red}30`, display:'flex', gap:'7px', alignItems:'center', fontSize:'12px', color:C.red, marginBottom:'12px' }}>
                      <AlertCircle size={14}/> {genError}
                    </div>
                  )}
                  <button type="button" onClick={generateVideo}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'14px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit', transition:'all .18s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='translateY(0)'}>
                    <Zap size={18}/> Generate Video Sekarang
                  </button>
                  <div style={{ textAlign:'center', marginTop:'8px', fontSize:'11px', color:C.inkMuted }}>
                    Estimasi: {Math.floor(duration * 3 + 30)}s · Video akan siap di Library setelah selesai
                  </div>
                </div>
              </Card>
            )}

            {/* Job progress */}
            {(isWorking || status === 'completed' || status === 'failed') && (
              <Card>
                <div style={{ padding:'32px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' }}>
                  <JobProgress progress={progress} status={status} elapsed={elapsedSec} remaining={remainingSec}/>

                  {/* Processing steps */}
                  {isWorking && (
                    <div style={{ display:'flex', gap:'8px', alignItems:'center', fontSize:'10px', color:C.inkMuted, flexWrap:'wrap', justifyContent:'center' }}>
                      {[
                        ['Script AI', elapsedSec > 3],
                        ['Generate Audio', elapsedSec > 10],
                        ['Render Slides', elapsedSec > 20],
                        ['Add Subtitle', elapsedSec > 35],
                        ['Final Export', elapsedSec > 45],
                      ].map(([label, done], i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px', color:done?C.green:C.inkMuted }}>
                          {done ? <CheckCircle2 size={11} color={C.green}/> : <div style={{ width:'10px', height:'10px', borderRadius:'50%', border:`1.5px solid ${C.border}` }}/>}
                          {label}
                          {i < 4 && <span style={{ color:C.border }}>→</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cancel */}
                  {isWorking && (
                    <button type="button" onClick={cancel}
                      style={{ padding:'7px 16px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                      Batalkan
                    </button>
                  )}

                  {/* Result */}
                  {status === 'completed' && videoUrl && (
                    <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'12px' }}>
                      <video src={videoUrl} controls autoPlay loop playsInline
                        style={{ width:'100%', maxHeight:'480px', borderRadius:'12px', background:'#000', objectFit:'contain' }}/>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                        <a href={videoUrl} download={`beesell-video-${duration}s-${Date.now()}.mp4`}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'11px', borderRadius:'10px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', textDecoration:'none', fontSize:'13px', fontWeight:700, boxShadow:C.sa }}>
                          <Download size={15}/> Download
                        </a>
                        <Link href="/library"
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'11px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.surface, color:C.inkSub, textDecoration:'none', fontSize:'13px', fontWeight:600 }}>
                          📁 Library
                        </Link>
                        <button type="button" onClick={reset}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'11px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.surface, color:C.inkSub, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                          <RefreshCw size={14}/> Buat Baru
                        </button>
                      </div>
                    </div>
                  )}

                  {status === 'failed' && (
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button type="button" onClick={generateVideo}
                        style={{ padding:'9px 18px', borderRadius:'9px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        Coba Lagi
                      </button>
                      <button type="button" onClick={reset}
                        style={{ padding:'9px 14px', borderRadius:'9px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Navigation ─────────────────────────────── */}
        {status !== 'completed' && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'24px', flexWrap:'wrap', gap:'10px' }}>
            <button type="button" onClick={() => nav(-1)} disabled={step === 1}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'13px', fontWeight:600, color:step===1?C.inkDim:C.inkSub, cursor:step===1?'not-allowed':'pointer', opacity:step===1?.4:1, fontFamily:'inherit' }}>
              <ArrowLeft size={14}/> Sebelumnya
            </button>

            <div style={{ fontSize:'11px', color:C.inkMuted }}>
              Langkah {step} dari {STEPS.length} — {STEPS[step-1].label}
            </div>

            {step < STEPS.length ? (
              <button type="button" onClick={() => nav(1)} disabled={!(canProceed as any)[step]}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 20px', borderRadius:'10px', border:'none', background:(canProceed as any)[step]?`linear-gradient(135deg,${C.amber},${C.amberDk})`:C.inkDim, color:'#fff', fontSize:'13px', fontWeight:700, cursor:(canProceed as any)[step]?'pointer':'not-allowed', opacity:(canProceed as any)[step]?1:.4, fontFamily:'inherit', boxShadow:(canProceed as any)[step]?C.sa:'none' }}>
                Lanjut <ArrowRight size={14}/>
              </button>
            ) : (
              <div style={{ width:'120px' }}/>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        textarea::placeholder, input::placeholder { color:#9CA3AF }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
        select { appearance:auto }
        .script-grid { grid-template-columns: 1fr 1fr !important }
        @media (max-width:768px) { .script-grid { grid-template-columns: 1fr !important } }
      `}</style>
    </div>
  )
}