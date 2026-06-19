'use client'
// app/(dashboard)/studio/video/talking-head/page.tsx
// ══════════════════════════════════════════════════════════════
// AI TALKING HEAD & AVATAR PRESENTER
// 5-step studio: Avatar → Script AI → Voice & Emosi → Komposisi → Render
// 20+ avatar · 18+ suara · Emotion engine · Background · PiP · Lower third
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Sparkles, Loader2, Play, Pause,
  RefreshCw, Check, X, Upload, Volume2, VolumeX,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  Download, Brain, Star, Zap, Camera, Mic, Monitor,
  Layers, Settings2, Eye, Lock, Info,
} from 'lucide-react'
import {
  AVATAR_LIBRARY, VOICE_LIBRARY, EMOTION_SETTINGS,
  BACKGROUND_PRESETS, LOWER_THIRD_STYLES, PLATFORM_RATIOS,
  fmtDuration, getVoicesByLanguage, suggestVoiceForAvatar,
  type AvatarDef, type VoiceDef, type VoiceLanguage,
  type VoiceEmotion, type AvatarStyle, type ScriptSegment,
  type LowerThirdStyle, type AspectRatio, type PiPPosition,
} from '@/lib/avatar/types'

// ── Tokens ────────────────────────────────────────────────────
const C = {
  amber:   '#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:   '#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:  '#E5E7EB',
  ink:     '#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:   '#059669', greenLt:'#ECFDF5',
  blue:    '#3B82F6', blueLt:'#EFF6FF',
  purple:  '#7C3AED', purpleLt:'#F5F3FF',
  red:     '#EF4444', redLt:'#FEF2F2',
  orange:  '#F97316', orangeLt:'#FFF7ED',
  sh: '0 1px 3px rgba(0,0,0,.06)',
  sm: '0 4px 16px rgba(0,0,0,.08)',
  sa: '0 6px 20px rgba(245,158,11,.22)',
}

// ── Wizard steps ──────────────────────────────────────────────
const STEPS = [
  { id:1, label:'Avatar',    icon:'🎭', desc:'Pilih presenter' },
  { id:2, label:'Script AI', icon:'✍️', desc:'Tulis atau generate' },
  { id:3, label:'Suara',     icon:'🎙️', desc:'Voice & emosi' },
  { id:4, label:'Komposisi', icon:'🎬', desc:'Background & PiP' },
  { id:5, label:'Render',    icon:'⚡', desc:'Generate video' },
]

const STYLE_TABS: { id:AvatarStyle|'all'; label:string }[] = [
  { id:'all',           label:'🔀 Semua'      },
  { id:'casual',        label:'😊 Kasual'     },
  { id:'professional',  label:'💼 Profesional'},
  { id:'hijab',         label:'🧕 Hijab'      },
  { id:'sporty',        label:'🏃 Sporty'     },
  { id:'artsy',         label:'🎨 Artsy'      },
  { id:'formal',        label:'👔 Formal'     },
]

const LANG_TABS: { id:VoiceLanguage; label:string }[] = [
  { id:'id-formal', label:'🇮🇩 Indonesia'     },
  { id:'id-gaul',   label:'🤙 Gaul Jakarta'  },
  { id:'jawa',      label:'🌾 Jawa'           },
  { id:'sunda',     label:'🌺 Sunda'          },
  { id:'minang',    label:'⚡ Minang'          },
  { id:'mix-en',    label:'🌐 Mix English'    },
]

const EMOTION_ORDER: VoiceEmotion[] = ['neutral','excited','calm','urgent','empathetic','whispering']

// ── Atoms ─────────────────────────────────────────────────────
function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:C.surface, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden', ...style }}>{children}</div>
}
function CardH({ icon, title, sub, badge, color=C.amber }: { icon:string; title:string; sub?:string; badge?:string; color?:string }) {
  return (
    <div style={{ padding:'13px 18px', borderBottom:`1px solid ${C.border}`, background:C.bg, display:'flex', alignItems:'center', gap:'9px' }}>
      <span style={{ fontSize:'18px' }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>{title}</div>
        {sub && <div style={{ fontSize:'10px', color:C.inkMuted, marginTop:'1px' }}>{sub}</div>}
      </div>
      {badge && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'99px', background:`${color}18`, color }}>{badge}</span>}
    </div>
  )
}
function Tab({ id, label, active, onClick }: { id:string; label:string; active:boolean; onClick:()=>void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'5px 12px', borderRadius:'7px', border:`1.5px solid ${active?C.amber:C.border}`, background:active?C.amberXlt:C.surface, fontSize:'11px', fontWeight:active?700:500, color:active?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit', transition:'all .12s', whiteSpace:'nowrap' }}>
      {label}
    </button>
  )
}
function Pill({ label, selected, onClick, color=C.amber }: { label:string; selected:boolean; onClick:()=>void; color?:string }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'4px 10px', borderRadius:'99px', border:`1.5px solid ${selected?color:C.border}`, background:selected?`${color}12`:C.surface, color:selected?color:C.inkMuted, fontSize:'11px', fontWeight:selected?700:500, cursor:'pointer', fontFamily:'inherit', transition:'all .12s', whiteSpace:'nowrap' }}>
      {label}
    </button>
  )
}

// ── Avatar card ────────────────────────────────────────────────
function AvatarCard({ av, selected, onSelect }: { av:AvatarDef; selected:boolean; onSelect:()=>void }) {
  return (
    <div onClick={onSelect}
      style={{ padding:'13px 12px', borderRadius:'13px', border:`2px solid ${selected?C.amber:C.border}`, background:selected?C.amberXlt:C.surface, cursor:'pointer', transition:'all .15s', boxShadow:selected?C.sa:C.sh, position:'relative' }}>
      {av.isPremium && <span style={{ position:'absolute', top:'7px', right:'7px', fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'3px', background:`${C.purple}20`, color:C.purple }}>PRO</span>}
      {av.monthlyNew && <span style={{ position:'absolute', top:'7px', left:'7px', fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'3px', background:`${C.green}20`, color:C.green }}>NEW</span>}
      {av.isCustom && <span style={{ position:'absolute', top:'7px', right:'7px', fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'3px', background:`${C.blue}20`, color:C.blue }}>CUSTOM</span>}
      <div style={{ textAlign:'center', marginBottom:'8px' }}>
        <span style={{ fontSize:'36px', display:'block' }}>{av.emoji}</span>
      </div>
      <div style={{ fontSize:'11px', fontWeight:700, color:selected?C.amberDk:C.ink, textAlign:'center', marginBottom:'3px' }}>{av.label}</div>
      <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.4, textAlign:'center' }}>{av.desc}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'3px', marginTop:'7px', justifyContent:'center' }}>
        {av.niche.slice(0,2).map(n => (
          <span key={n} style={{ fontSize:'8px', fontWeight:600, padding:'1px 5px', borderRadius:'3px', background:C.bg, color:C.inkMuted, border:`1px solid ${C.border}` }}>{n}</span>
        ))}
      </div>
      {selected && <CheckCircle2 size={16} color={C.amber} style={{ position:'absolute', bottom:'8px', right:'8px' }}/>}
    </div>
  )
}

// ── Voice card ────────────────────────────────────────────────
function VoiceCard({ v, selected, onSelect, onPreview, previewing }: {
  v:VoiceDef; selected:boolean; onSelect:()=>void; onPreview:()=>void; previewing:boolean
}) {
  return (
    <div style={{ padding:'12px 13px', borderRadius:'12px', border:`1.5px solid ${selected?C.amber:C.border}`, background:selected?C.amberXlt:C.surface, transition:'all .15s', boxShadow:selected?C.sa:C.sh }}>
      <div style={{ display:'flex', gap:'9px', alignItems:'flex-start' }}>
        <div onClick={onSelect} style={{ flex:1, cursor:'pointer' }}>
          <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'3px' }}>
            <span style={{ fontSize:'12px', fontWeight:700, color:selected?C.amberDk:C.ink }}>{v.label}</span>
            <span style={{ fontSize:'8px', fontWeight:800, padding:'1px 5px', borderRadius:'3px', background:v.gender==='female'?`${C.purple}20`:`${C.blue}20`, color:v.gender==='female'?C.purple:C.blue }}>
              {v.gender === 'female' ? '♀' : '♂'}
            </span>
          </div>
          <div style={{ fontSize:'10px', color:C.inkMuted, marginBottom:'6px', lineHeight:1.4 }}>{v.desc}</div>
          <div style={{ fontSize:'10px', color:C.inkDim, fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>"{v.sampleText.substring(0,60)}..."</div>
        </div>
        {/* Preview button */}
        <button type="button" onClick={onPreview}
          style={{ width:'32px', height:'32px', borderRadius:'8px', border:`1px solid ${selected?C.amber:C.border}`, background:selected?C.amberLt:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .12s' }}>
          {previewing
            ? <Loader2 size={13} color={C.amber} style={{ animation:'spin .8s linear infinite' }}/>
            : <Play size={13} color={selected?C.amber:C.inkMuted}/>
          }
        </button>
      </div>
      {/* Emotion badges */}
      <div style={{ display:'flex', gap:'3px', marginTop:'8px', flexWrap:'wrap' }}>
        {v.emotion.map(em => {
          const cfg = EMOTION_SETTINGS[em]
          return <span key={em} style={{ fontSize:'9px', fontWeight:600, padding:'1px 5px', borderRadius:'3px', background:`${C.bg}`, color:C.inkMuted, border:`1px solid ${C.border}` }}>{cfg.icon} {cfg.label}</span>
        })}
      </div>
    </div>
  )
}

// ── Segment editor ─────────────────────────────────────────────
function SegmentEditor({ seg, index, total, onChange, onDelete }: {
  seg:ScriptSegment; index:number; total:number; onChange:(s:ScriptSegment)=>void; onDelete:()=>void
}) {
  const emotionCfg = EMOTION_SETTINGS[seg.emotion]
  return (
    <div style={{ padding:'12px 13px', borderRadius:'12px', background:C.bg, border:`1px solid ${C.border}`, marginBottom:'8px' }}>
      <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'8px' }}>
        <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:800, color:'#fff', flexShrink:0 }}>{index+1}</div>
        {/* Emotion selector */}
        <select value={seg.emotion} onChange={e=>onChange({...seg,emotion:e.target.value as VoiceEmotion})}
          style={{ flex:1, padding:'4px 8px', borderRadius:'7px', border:`1px solid ${C.border}`, fontSize:'11px', fontFamily:'inherit', background:C.surface, cursor:'pointer' }}>
          {EMOTION_ORDER.map(em => {
            const cfg=EMOTION_SETTINGS[em]
            return <option key={em} value={em}>{cfg.icon} {cfg.label}</option>
          })}
        </select>
        {/* Speed */}
        <span style={{ fontSize:'10px', color:C.inkMuted, flexShrink:0 }}>Speed: {seg.speed.toFixed(2)}x</span>
        <input type="range" min={0.75} max={1.5} step={0.05} value={seg.speed}
          onChange={e=>onChange({...seg,speed:+e.target.value})}
          style={{ width:'60px', accentColor:C.amber }}/>
        {total > 1 && (
          <button onClick={onDelete} style={{ width:'22px', height:'22px', borderRadius:'5px', border:`1px solid ${C.border}`, background:C.surface, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.inkDim }}>
            <X size={11}/>
          </button>
        )}
      </div>
      <textarea value={seg.text} onChange={e=>onChange({...seg,text:e.target.value})} rows={2}
        style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', border:`1px solid ${C.border}`, fontSize:'12px', fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.5 }}/>
      <div style={{ display:'flex', gap:'6px', alignItems:'center', marginTop:'5px', fontSize:'10px', color:C.inkDim }}>
        <span>{emotionCfg.icon} {emotionCfg.desc}</span>
        <span>·</span>
        <span>Pause setelah: {seg.pause}s</span>
        <input type="range" min={0} max={2} step={0.5} value={seg.pause}
          onChange={e=>onChange({...seg,pause:+e.target.value})}
          style={{ width:'50px', accentColor:C.purple }}/>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function TalkingHeadPage() {
  const [step,            setStep]            = useState(1)
  const [styleFilter,     setStyleFilter]     = useState<AvatarStyle|'all'>('all')
  const [selAvatar,       setSelAvatar]       = useState<AvatarDef|null>(null)
  const [customFile,      setCustomFile]      = useState<File|null>(null)
  const [customPreview,   setCustomPreview]   = useState<string|null>(null)
  const [customUrl,       setCustomUrl]       = useState<string|null>(null)
  const [consentGiven,    setConsentGiven]    = useState(false)
  const [showConsent,     setShowConsent]     = useState(false)
  const [uploadingCustom, setUploadingCustom] = useState(false)

  // Script
  const [productName,  setProductName]  = useState('')
  const [productDesc,  setProductDesc]  = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [duration,     setDuration]     = useState(30)
  const [segments,     setSegments]     = useState<ScriptSegment[]>([
    { id:'s1', text:'', emotion:'neutral', speed:1.0, pause:0 },
  ])
  const [fullScript,   setFullScript]   = useState('')
  const [scriptLoading,setScriptLoading]= useState(false)
  const [aiHook,       setAiHook]       = useState('')
  const [aiCTA,        setAiCTA]        = useState('')
  const [directorNotes,setDirectorNotes]= useState('')

  // Voice
  const [langFilter,   setLangFilter]   = useState<VoiceLanguage>('id-formal')
  const [selVoice,     setSelVoice]     = useState<VoiceDef|null>(null)
  const [baseSpeed,    setBaseSpeed]    = useState(1.0)
  const [mainEmotion,  setMainEmotion]  = useState<VoiceEmotion>('neutral')
  const [previewing,   setPreviewing]   = useState<string|null>(null)
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  // Composition
  const [selBg,        setSelBg]        = useState('white')
  const [customBgFile, setCustomBgFile] = useState<File|null>(null)
  const [aspectRatio,  setAspectRatio]  = useState<AspectRatio>('9:16')
  const [platform,     setPlatform]     = useState('tiktok')
  const [pipEnabled,   setPipEnabled]   = useState(false)
  const [pipPosition,  setPipPosition]  = useState<PiPPosition>('bottom-right')
  const [pipSize,      setPipSize]      = useState(30)
  const [pipFile,      setPipFile]      = useState<File|null>(null)
  const [ltEnabled,    setLtEnabled]    = useState(true)
  const [ltStyle,      setLtStyle]      = useState<LowerThirdStyle>('bold')
  const [ltProduct,    setLtProduct]    = useState('')
  const [ltTagline,    setLtTagline]    = useState('')
  const [ltPrice,      setLtPrice]      = useState('')
  const [ltBadge,      setLtBadge]      = useState('')

  // Render
  const [rendering,    setRendering]    = useState(false)
  const [renderJob,    setRenderJob]    = useState<string|null>(null)
  const [renderStatus, setRenderStatus] = useState<'idle'|'tts'|'did'|'done'|'error'>('idle')
  const [renderPct,    setRenderPct]    = useState(0)
  const [outputUrl,    setOutputUrl]    = useState<string|null>(null)
  const [renderError,  setRenderError]  = useState('')
  const [elapsed,      setElapsed]      = useState(0)
  const timerRef = useRef<any>(null)

  // Auto-select voice when avatar changes
  useEffect(() => {
    if (selAvatar) {
      const suggested = suggestVoiceForAvatar(selAvatar.id)
      if (suggested) setSelVoice(suggested)
    }
  }, [selAvatar])

  // Sync platform → aspect ratio
  useEffect(() => {
    setAspectRatio(PLATFORM_RATIOS[platform]?.ratio ?? '9:16')
  }, [platform])

  // Sync fullScript to first segment
  useEffect(() => {
    if (segments.length === 1 && fullScript && !segments[0].text) {
      setSegments([{ ...segments[0], text:fullScript }])
    }
  }, [fullScript])

  const bgPreset = BACKGROUND_PRESETS.find(b => b.id === selBg)

  // ── Preview TTS ───────────────────────────────────────────
  const previewVoice = useCallback(async (voice: VoiceDef) => {
    if (previewing) return
    setPreviewing(voice.id)
    try {
      const res = await fetch('/api/studio/video/talking-head?action=tts-preview', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({ text:voice.sampleText, voiceId:voice.id, emotion:mainEmotion, speed:baseSpeed }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() }
    } catch { /* silent */ }
    finally { setPreviewing(null) }
  }, [previewing, mainEmotion, baseSpeed])

  // ── Generate script ────────────────────────────────────────
  const generateScript = useCallback(async () => {
    if (!productName.trim()) return
    setScriptLoading(true)
    try {
      const res  = await fetch('/api/studio/video/talking-head?action=generate-script', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          productName, productDesc, productPrice, duration,
          niche: selAvatar?.niche?.[0] ?? 'general',
          language: selVoice?.language ?? 'id-formal',
          avatarStyle: selAvatar?.style ?? 'casual',
          tone: selVoice?.character ?? 'friendly',
        }),
      })
      const data = await res.json()
      if (data.script) {
        setFullScript(data.script)
        setAiHook(data.hook ?? '')
        setAiCTA(data.cta ?? '')
        setDirectorNotes(data.directorNotes ?? '')
        if (data.segments?.length > 0) {
          setSegments(data.segments.map((s:any,i:number) => ({ ...s, id:`s${i+1}` })))
        }
      }
    } catch { /* silent */ }
    finally { setScriptLoading(false) }
  }, [productName, productDesc, productPrice, duration, selAvatar, selVoice])

  // ── Upload custom avatar ───────────────────────────────────
  const uploadCustomAvatar = useCallback(async (file: File) => {
    if (!consentGiven) { setShowConsent(true); return }
    setUploadingCustom(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('consentGiven', 'true')
      const res  = await fetch('/api/studio/video/talking-head?action=upload-custom-avatar', { method:'POST', body:fd })
      const data = await res.json()
      if (data.avatarUrl) {
        setCustomUrl(data.avatarUrl)
        const customAv = AVATAR_LIBRARY.find(a => a.isCustom)!
        setSelAvatar({ ...customAv, didAvatarUrl:data.avatarUrl })
      }
    } catch { /* silent */ }
    finally { setUploadingCustom(false) }
  }, [consentGiven])

  // ── Render flow ────────────────────────────────────────────
  const startRender = useCallback(async () => {
    if (!selAvatar || !selVoice || segments.every(s=>!s.text)) return
    setRendering(true); setRenderError(''); setRenderStatus('tts'); setRenderPct(5)
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(e => e+1), 1000)

    try {
      const jobId = `th_${Date.now()}`

      // 1. Full TTS
      setRenderPct(15)
      const ttsRes = await fetch('/api/studio/video/talking-head?action=full-tts', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ voiceId:selVoice.id, segments, jobId }),
      })
      if (!ttsRes.ok) throw new Error('TTS generation gagal')
      const { audioUrl } = await ttsRes.json()
      setRenderPct(40); setRenderStatus('did')

      // 2. D-ID render
      const renderRes = await fetch('/api/studio/video/talking-head?action=render-talking-head', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          avatarId:     selAvatar.id,
          customImageUrl: selAvatar.isCustom ? (selAvatar.didAvatarUrl||undefined) : undefined,
          consentGiven,
          voiceId:      selVoice.id,
          language:     selVoice.language,
          baseSpeed,
          emotion:      mainEmotion,
          script:       fullScript || segments.map(s=>s.text).join(' '),
          segments,
          aiGenerated:  false,
          backgroundId: selBg,
          aspectRatio,
          duration,
          lowerThird: {
            enabled:     ltEnabled,
            style:       ltStyle,
            productName: ltProduct || productName,
            tagline:     ltTagline,
            price:       ltPrice,
            badge:       ltBadge,
            showDuration:duration,
            position:    'bottom',
            color:       C.amber,
          },
          pip: { enabled:pipEnabled, position:pipPosition, size:pipSize, mediaUrl:'', mediaType:'image', border:true, shadow:true },
          quality:  'balanced',
          platform,
          audioUrl,
        }),
      })
      if (!renderRes.ok) { const d=await renderRes.json(); throw new Error(d.error||'Render gagal') }
      const renderData = await renderRes.json()
      setRenderJob(renderData.jobId)
      setRenderPct(55)

      // 3. Poll status (simulate via timeout since D-ID webhooks are async)
      // In production: Supabase Realtime subscription to talking_head_jobs
      let pollAttempts = 0
      const poll = setInterval(async () => {
        pollAttempts++
        setRenderPct(Math.min(95, 55 + pollAttempts * 4))
        // After ~3 min simulate completion for demo
        if (pollAttempts > 45) {
          clearInterval(poll)
          setRenderStatus('done')
          setRenderPct(100)
          setOutputUrl('/placeholder-talking-head.mp4') // would be real URL from webhook
        }
      }, 4000)

    } catch (err:any) {
      setRenderError(err.message)
      setRenderStatus('error')
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setRendering(false)
    }
  }, [selAvatar, selVoice, segments, consentGiven, baseSpeed, mainEmotion, fullScript, selBg, aspectRatio, duration, ltEnabled, ltStyle, ltProduct, ltTagline, ltPrice, ltBadge, pipEnabled, pipPosition, pipSize, productName, platform])

  const canNext: Record<number,boolean> = {
    1: !!selAvatar,
    2: segments.some(s => s.text.trim().length > 0),
    3: !!selVoice,
    4: true,
    5: true,
  }

  const filteredAvatars = styleFilter === 'all'
    ? AVATAR_LIBRARY
    : AVATAR_LIBRARY.filter(a => a.style === styleFilter || a.isCustom)

  const filteredVoices = getVoicesByLanguage(langFilter)

  const ratioStyle: Record<AspectRatio, React.CSSProperties> = {
    '9:16': { width:'120px', height:'213px' },
    '1:1':  { width:'160px', height:'160px' },
    '16:9': { width:'240px', height:'135px' },
    '4:5':  { width:'160px', height:'200px' },
  }

  return (
    <div style={{ maxWidth:'1140px', margin:'0 auto', fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>
      <audio ref={audioRef} style={{ display:'none' }}/>

      {/* ── Topbar ────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
        <Link href="/studio" style={{ display:'flex', alignItems:'center', gap:'5px', color:C.inkMuted, textDecoration:'none', fontSize:'13px' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.ink}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.inkMuted}>
          <ArrowLeft size={14}/> Studio
        </Link>
        <div style={{ width:'1px', height:'16px', background:C.border }}/>
        <div>
          <div style={{ fontSize:'18px', fontWeight:800, color:C.ink, letterSpacing:'-0.02em' }}>🎭 AI Talking Head & Avatar Presenter</div>
          <div style={{ fontSize:'11px', color:C.inkMuted }}>20+ avatar · 18+ suara · Lipsync · Emotion engine · Video komposisi</div>
        </div>
        <div style={{ marginLeft:'auto', padding:'4px 10px', borderRadius:'6px', background:C.purpleLt, border:`1px solid ${C.purple}25`, fontSize:'11px', fontWeight:600, color:C.purple }}>Pro+</div>
      </div>

      {/* ── Step indicator ────────────────────────────────── */}
      <div style={{ display:'flex', gap:'0', marginBottom:'24px' }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display:'flex', alignItems:'center', flex:i<STEPS.length-1?1:'none' }}>
            <div onClick={()=>s.id<step&&setStep(s.id)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', cursor:s.id<step?'pointer':'default', padding:'0 4px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', border:`2px solid ${step===s.id?C.amber:step>s.id?C.green:C.border}`, background:step===s.id?C.amberXlt:step>s.id?C.greenLt:C.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', transition:'all .2s' }}>
                {step>s.id?<Check size={16} color={C.green}/>:s.icon}
              </div>
              <div style={{ fontSize:'10px', fontWeight:step===s.id?700:500, color:step===s.id?C.amberDk:step>s.id?C.green:C.inkDim, whiteSpace:'nowrap', textAlign:'center' }}>
                <div>{s.label}</div>
                <div style={{ fontSize:'9px', color:C.inkDim }}>{s.desc}</div>
              </div>
            </div>
            {i<STEPS.length-1&&<div style={{ flex:1, height:'2px', background:step>s.id?C.green:C.border, margin:'0 4px 22px', transition:'background .2s', minWidth:'20px' }}/>}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          STEP 1: AVATAR LIBRARY
      ══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <Card>
            <CardH icon="🎭" title="Pilih Avatar Presenter" sub={`${AVATAR_LIBRARY.length} avatar tersedia · Update bulanan`}
              badge="20+ avatar"/>
            <div style={{ padding:'14px 18px' }}>
              {/* Style filter */}
              <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'14px' }}>
                {STYLE_TABS.map(t => (
                  <Tab key={t.id} id={t.id} label={t.label} active={styleFilter===t.id} onClick={()=>setStyleFilter(t.id as any)}/>
                ))}
              </div>
              {/* Avatar grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:'10px' }}>
                {filteredAvatars.map(av => (
                  <AvatarCard key={av.id} av={av} selected={selAvatar?.id===av.id}
                    onSelect={() => av.isCustom ? setShowConsent(true) : setSelAvatar(av)}/>
                ))}
              </div>
            </div>
          </Card>

          {/* Custom avatar upload */}
          <Card>
            <CardH icon="🤳" title="Custom Avatar — Upload Wajahmu" sub="Upload foto → AI generate talking head personalmu" badge="Beta"/>
            <div style={{ padding:'14px 18px' }}>
              {showConsent ? (
                <div style={{ padding:'14px 16px', borderRadius:'12px', background:C.amberXlt, border:`1px solid ${C.amber}30` }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:C.amberDk, marginBottom:'10px' }}>⚠️ Verifikasi Consent Wajah</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'12px' }}>
                    {[
                      'Foto yang diupload adalah wajah saya sendiri atau orang yang telah memberikan izin tertulis',
                      'Saya memahami bahwa AI akan menganimasikan wajah tersebut untuk berbicara',
                      'Saya tidak akan menggunakan fitur ini untuk membuat konten menyesatkan',
                      'Saya bertanggung jawab penuh atas penggunaan avatar custom ini',
                    ].map((point, i) => (
                      <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', fontSize:'12px', color:C.inkSub }}>
                        <CheckCircle2 size={14} color={C.green} style={{ flexShrink:0, marginTop:'1px' }}/>
                        {point}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button type="button" onClick={() => { setConsentGiven(true); setShowConsent(false); fileRef.current?.click() }}
                      style={{ padding:'8px 18px', borderRadius:'9px', border:'none', background:C.amber, color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      ✅ Saya Setuju — Lanjut Upload
                    </button>
                    <button type="button" onClick={() => setShowConsent(false)}
                      style={{ padding:'8px 14px', borderRadius:'9px', border:`1px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      Batalkan
                    </button>
                  </div>
                </div>
              ) : customPreview ? (
                <div style={{ display:'flex', gap:'14px', alignItems:'center' }}>
                  <img src={customPreview} style={{ width:'80px', height:'80px', borderRadius:'10px', objectFit:'cover' }}/>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'4px' }}>Foto custom ready</div>
                    {customUrl
                      ? <div style={{ fontSize:'11px', color:C.green, display:'flex', gap:'5px' }}><CheckCircle2 size={13}/> Uploaded ke server</div>
                      : <div style={{ fontSize:'11px', color:C.amber }}>Uploading...</div>}
                    <button type="button" onClick={() => { setCustomFile(null); setCustomPreview(null); setCustomUrl(null) }}
                      style={{ marginTop:'7px', padding:'4px 10px', borderRadius:'6px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'11px', color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                      Ganti Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={() => consentGiven ? fileRef.current?.click() : setShowConsent(true)}
                  style={{ borderRadius:'11px', border:`2px dashed ${C.border}`, background:C.bg, cursor:'pointer', padding:'24px', display:'flex', gap:'12px', alignItems:'center', transition:'border-color .15s' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=C.amber}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.border}>
                  <Camera size={28} color={C.inkDim}/>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:C.ink, marginBottom:'3px' }}>Upload Foto Wajah</div>
                    <div style={{ fontSize:'11px', color:C.inkMuted }}>JPG/PNG/WEBP · Max 10MB · Foto wajah menghadap depan, pencahayaan baik</div>
                  </div>
                  <Lock size={14} color={C.inkDim} style={{ marginLeft:'auto' }}/>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={async e => {
                const f = e.target.files?.[0]
                if (!f) return
                setCustomFile(f); setCustomPreview(URL.createObjectURL(f))
                await uploadCustomAvatar(f)
                e.target.value = ''
              }}/>
            </div>
          </Card>

          {selAvatar && (
            <div style={{ padding:'12px 16px', borderRadius:'12px', background:C.greenLt, border:`1px solid ${C.green}30`, display:'flex', gap:'10px', alignItems:'center' }}>
              <span style={{ fontSize:'24px' }}>{selAvatar.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.green }}>Avatar dipilih: {selAvatar.label}</div>
                <div style={{ fontSize:'11px', color:C.inkMuted }}>{selAvatar.desc}</div>
              </div>
              <CheckCircle2 size={18} color={C.green}/>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 2: SCRIPT AI
      ══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'16px' }} className="script-grid">
          {/* Script editor */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <Card>
              <CardH icon="✍️" title="Script Presenter" sub="Tulis sendiri atau generate dengan AI"/>
              <div style={{ padding:'14px 18px' }}>
                {/* Product info for AI */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
                  {[
                    { label:'Nama Produk *', val:productName, set:setProductName, placeholder:'Contoh: Serum Vitamin C 30ml' },
                    { label:'Harga',         val:productPrice, set:setProductPrice, placeholder:'Contoh: Rp89.000' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, display:'block', marginBottom:'4px' }}>{f.label}</label>
                      <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder}
                        style={{ width:'100%', padding:'8px 11px', borderRadius:'8px', border:`1.5px solid ${C.border}`, fontSize:'12px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                        onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                        onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:'10px' }}>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, display:'block', marginBottom:'4px' }}>Deskripsi & Benefit</label>
                  <textarea value={productDesc} onChange={e=>setProductDesc(e.target.value)} rows={2}
                    placeholder="Apa manfaat utama produk? Pain point yang diselesaikan?"
                    style={{ width:'100%', padding:'8px 11px', borderRadius:'8px', border:`1.5px solid ${C.border}`, fontSize:'12px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', resize:'vertical' }}
                    onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                    onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                </div>
                {/* Duration + Generate */}
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-end', marginBottom:'14px' }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, display:'block', marginBottom:'4px' }}>Durasi: <strong>{duration}s</strong></label>
                    <div style={{ display:'flex', gap:'5px' }}>
                      {[15,30,60,90].map(d => (
                        <button key={d} type="button" onClick={()=>setDuration(d)}
                          style={{ padding:'5px 11px', borderRadius:'7px', border:`1.5px solid ${duration===d?C.amber:C.border}`, background:duration===d?C.amberXlt:C.surface, fontSize:'11px', fontWeight:duration===d?700:500, color:duration===d?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={generateScript} disabled={!productName.trim()||scriptLoading}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'10px', border:'none', background:!productName.trim()?C.inkDim:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, cursor:!productName.trim()?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:productName.trim()?C.sa:'none', flexShrink:0, opacity:!productName.trim()?.5:1 }}>
                    {scriptLoading?<Loader2 size={13} style={{ animation:'spin .8s linear infinite' }}/>:<Brain size={13}/>}
                    {scriptLoading?'Generating...':'AI Generate Script'}
                  </button>
                </div>

                {/* AI insights */}
                {aiHook && (
                  <div style={{ marginBottom:'12px', padding:'10px 13px', borderRadius:'10px', background:C.amberXlt, border:`1px solid ${C.amber}30` }}>
                    <div style={{ fontSize:'10px', fontWeight:800, color:C.amberDk, marginBottom:'5px' }}>🪝 Hook (5 detik pertama)</div>
                    <div style={{ fontSize:'12px', color:C.inkSub }}>{aiHook}</div>
                    {aiCTA && <>
                      <div style={{ fontSize:'10px', fontWeight:800, color:C.amberDk, marginTop:'7px', marginBottom:'3px' }}>📣 CTA</div>
                      <div style={{ fontSize:'12px', color:C.inkSub }}>{aiCTA}</div>
                    </>}
                  </div>
                )}

                {/* Segments */}
                <div style={{ marginBottom:'10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.ink }}>🎬 Segmen Script ({segments.length})</div>
                  <button type="button" onClick={() => setSegments(p => [...p, { id:`s${p.length+1}`, text:'', emotion:'neutral', speed:1.0, pause:0 }])}
                    style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.bg, fontSize:'11px', fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                    + Segmen
                  </button>
                </div>
                {segments.map((seg, i) => (
                  <SegmentEditor key={seg.id} seg={seg} index={i} total={segments.length}
                    onChange={s => setSegments(p => p.map((x,j) => j===i?s:x))}
                    onDelete={() => setSegments(p => p.filter((_,j) => j!==i))}/>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar hints */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {/* Director notes */}
            {directorNotes && (
              <Card>
                <CardH icon="🎬" title="Catatan Sutradara" sub="Tips dari AI untuk delivery terbaik"/>
                <div style={{ padding:'12px 14px', fontSize:'12px', color:C.inkSub, lineHeight:1.7, whiteSpace:'pre-line' }}>{directorNotes}</div>
              </Card>
            )}
            <Card>
              <CardH icon="💡" title="Tips Script Presenter"/>
              <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'7px' }}>
                {[
                  '🪝 Hook 5 detik pertama paling kritis — langsung sebutkan pain point atau manfaat',
                  '✅ Gunakan bahasa percakapan, bukan teks iklan kaku',
                  '⏸️ Tambahkan [JEDA] untuk pause natural antar kalimat',
                  '🔥 Segmen "excited" untuk pembukaan dan CTA, "calm" untuk penjelasan',
                  '📏 30 detik = 75 kata, 60 detik = 150 kata, 90 detik = 220 kata',
                ].map((tip,i) => (
                  <div key={i} style={{ fontSize:'11px', color:C.inkSub, lineHeight:1.5 }}>{tip}</div>
                ))}
              </div>
            </Card>
            <Card>
              <CardH icon="🌐" title="Bahasa & Dialek"/>
              <div style={{ padding:'12px 14px', fontSize:'11px', color:C.inkSub, lineHeight:1.7 }}>
                AI akan menyesuaikan gaya bahasa dengan suara yang dipilih di Step 3. Pilih avatar dan suara dulu untuk hasil terbaik.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 3: VOICE & EMOTION ENGINE
      ══════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'16px' }} className="voice-grid">
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {/* Language filter */}
            <Card>
              <CardH icon="🎙️" title="Pilih Suara Presenter" sub="18+ karakter suara · Preview langsung"/>
              <div style={{ padding:'14px 18px' }}>
                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'14px' }}>
                  {LANG_TABS.map(t => (
                    <Tab key={t.id} id={t.id} label={t.label} active={langFilter===t.id} onClick={()=>setLangFilter(t.id)}/>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {filteredVoices.map(v => (
                    <VoiceCard key={v.id} v={v} selected={selVoice?.id===v.id}
                      onSelect={() => setSelVoice(v)}
                      onPreview={() => previewVoice(v)}
                      previewing={previewing===v.id}/>
                  ))}
                  {filteredVoices.length === 0 && (
                    <div style={{ padding:'32px', textAlign:'center', color:C.inkMuted, fontSize:'13px' }}>Belum ada suara untuk dialek ini. Coming soon! 🚧</div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Emotion + Speed config */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <Card>
              <CardH icon="😊" title="Emosi & Kecepatan"/>
              <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                {/* Main emotion */}
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'7px' }}>Emosi Utama</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px' }}>
                    {EMOTION_ORDER.map(em => {
                      const cfg = EMOTION_SETTINGS[em]
                      const active = mainEmotion === em
                      return (
                        <button key={em} type="button" onClick={() => setMainEmotion(em)}
                          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 9px', borderRadius:'9px', border:`1.5px solid ${active?C.amber:C.border}`, background:active?C.amberXlt:C.surface, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                          <span style={{ fontSize:'15px' }}>{cfg.icon}</span>
                          <div style={{ textAlign:'left' }}>
                            <div style={{ fontSize:'11px', fontWeight:active?700:500, color:active?C.amberDk:C.ink }}>{cfg.label}</div>
                            <div style={{ fontSize:'9px', color:C.inkDim, lineHeight:1.3 }}>{cfg.desc.substring(0,28)}...</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Speed */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Kecepatan Dasar</label>
                    <span style={{ fontSize:'12px', fontWeight:800, color:C.amber }}>{baseSpeed.toFixed(2)}x</span>
                  </div>
                  <input type="range" min={0.75} max={1.5} step={0.05} value={baseSpeed}
                    onChange={e => setBaseSpeed(+e.target.value)}
                    style={{ width:'100%', accentColor:C.amber }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:C.inkDim, marginTop:'3px' }}>
                    <span>0.75x (Lambat)</span><span>1.5x (Cepat)</span>
                  </div>
                </div>

                {/* Preview selected voice */}
                {selVoice && (
                  <div style={{ padding:'10px 12px', borderRadius:'10px', background:C.greenLt, border:`1px solid ${C.green}25` }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:C.green, marginBottom:'4px' }}>✅ Suara dipilih: {selVoice.label}</div>
                    <div style={{ fontSize:'10px', color:C.inkMuted }}>{selVoice.desc}</div>
                    <button type="button" onClick={() => previewVoice(selVoice)}
                      style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'7px', padding:'5px 11px', borderRadius:'7px', border:`1px solid ${C.green}30`, background:C.surface, color:C.green, fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      {previewing===selVoice.id ? <Loader2 size={12} style={{ animation:'spin .8s linear infinite' }}/> : <Play size={12}/>}
                      Preview Suara
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Segment emotions quick summary */}
            <Card>
              <CardH icon="🎭" title="Emosi Per Segmen" sub="Dari Step 2"/>
              <div style={{ padding:'12px 14px' }}>
                {segments.map((seg, i) => {
                  const cfg = EMOTION_SETTINGS[seg.emotion]
                  return (
                    <div key={seg.id} style={{ display:'flex', gap:'8px', alignItems:'center', padding:'5px 0', borderBottom:i<segments.length-1?`1px solid ${C.border}`:'none' }}>
                      <span style={{ fontSize:'14px' }}>{cfg.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'10px', fontWeight:600, color:C.ink }}>Segmen {i+1} — {cfg.label}</div>
                        <div style={{ fontSize:'10px', color:C.inkDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{seg.text.substring(0,40)||'(kosong)'}</div>
                      </div>
                      <span style={{ fontSize:'10px', color:C.inkMuted }}>{seg.speed}x</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 4: KOMPOSISI VIDEO
      ══════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'16px' }} className="comp-grid">
          {/* Preview canvas */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {/* Video preview */}
            <Card style={{ padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, alignSelf:'flex-start' }}>🖥️ Preview Komposisi</div>
              {/* Canvas mockup */}
              <div style={{ ...ratioStyle[aspectRatio], background:bgPreset?.preview ?? '#fff', borderRadius:'12px', border:`2px solid ${C.border}`, position:'relative', overflow:'hidden', boxShadow:C.sm, flexShrink:0 }}>
                {/* Avatar placeholder */}
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'48px', opacity:.5 }}>
                  {selAvatar?.emoji ?? '🎭'}
                </div>
                {/* PiP overlay */}
                {pipEnabled && (
                  <div style={{
                    position:'absolute',
                    ...(pipPosition==='bottom-right'?{bottom:'8px',right:'8px'}:pipPosition==='bottom-left'?{bottom:'8px',left:'8px'}:pipPosition==='top-right'?{top:'8px',right:'8px'}:{top:'8px',left:'8px'}),
                    width:`${pipSize}%`, aspectRatio:'1/1', background:`${C.amber}30`, borderRadius:'8px', border:`2px solid ${C.amber}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px',
                  }}>📦</div>
                )}
                {/* Lower third */}
                {ltEnabled && (
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px', background:ltStyle==='bold'?C.amber:ltStyle==='gradient'?`linear-gradient(transparent,rgba(0,0,0,.7))`:'rgba(0,0,0,.5)', borderRadius:'0 0 10px 10px' }}>
                    <div style={{ fontSize:'9px', fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ltProduct||productName||'Nama Produk'}</div>
                    {ltPrice && <div style={{ fontSize:'8px', color:'rgba(255,255,255,.8)' }}>{ltPrice}</div>}
                    {ltBadge && <div style={{ fontSize:'7px', fontWeight:800, background:'#ef4444', color:'#fff', padding:'1px 4px', borderRadius:'3px', display:'inline-block', marginTop:'2px' }}>{ltBadge}</div>}
                  </div>
                )}
              </div>
              <div style={{ fontSize:'10px', color:C.inkMuted }}>
                {aspectRatio} · {PLATFORM_RATIOS[platform]?.label}
              </div>
            </Card>

            {/* Background */}
            <Card>
              <CardH icon="🖼️" title="Background" sub="Solid · Gradien · Virtual Studio · Custom"/>
              <div style={{ padding:'14px 18px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))', gap:'7px' }}>
                  {BACKGROUND_PRESETS.map(bg => (
                    <div key={bg.id} onClick={() => setSelBg(bg.id)}
                      style={{ borderRadius:'9px', overflow:'hidden', cursor:'pointer', border:`2px solid ${selBg===bg.id?C.amber:C.border}`, transition:'all .15s', boxShadow:selBg===bg.id?C.sa:C.sh }}>
                      <div style={{ height:'44px', background:bg.preview }}/>
                      <div style={{ padding:'4px 5px', fontSize:'9px', fontWeight:selBg===bg.id?700:500, color:selBg===bg.id?C.amberDk:C.inkMuted, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bg.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right controls */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {/* Platform & ratio */}
            <Card>
              <CardH icon="📱" title="Platform & Format"/>
              <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Platform</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {Object.entries(PLATFORM_RATIOS).map(([p,cfg]) => (
                      <Pill key={p} label={`${p==='tiktok'?'🎵':p==='instagram'?'📸':p==='youtube'?'▶️':p==='shopee'?'🛍️':'🌐'} ${p}`} selected={platform===p} onClick={()=>setPlatform(p)}/>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* PiP */}
            <Card>
              <CardH icon="🖼️" title="PiP Produk" sub="Picture-in-Picture foto/video produk"/>
              <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'9px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <button type="button" onClick={() => setPipEnabled(p=>!p)}
                    style={{ width:'38px', height:'21px', borderRadius:'11px', border:'none', background:pipEnabled?C.amber:C.inkDim, cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:'2px', left:pipEnabled?'19px':'2px', width:'17px', height:'17px', borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                  </button>
                  <span style={{ fontSize:'12px', fontWeight:600, color:C.ink }}>Aktifkan PiP Produk</span>
                </div>
                {pipEnabled && (
                  <>
                    <div>
                      <div style={{ fontSize:'11px', fontWeight:600, color:C.inkMuted, marginBottom:'5px' }}>Posisi</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                        {([['top-left','↖ Kiri Atas'],['top-right','↗ Kanan Atas'],['bottom-left','↙ Kiri Bawah'],['bottom-right','↘ Kanan Bawah']] as const).map(([pos,label]) => (
                          <button key={pos} type="button" onClick={() => setPipPosition(pos as PiPPosition)}
                            style={{ padding:'5px', borderRadius:'7px', border:`1px solid ${pipPosition===pos?C.amber:C.border}`, background:pipPosition===pos?C.amberXlt:C.surface, fontSize:'10px', fontWeight:pipPosition===pos?700:500, color:pipPosition===pos?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'4px' }}>
                        <span style={{ color:C.inkMuted }}>Ukuran PiP</span>
                        <span style={{ fontWeight:700 }}>{pipSize}%</span>
                      </div>
                      <input type="range" min={15} max={45} step={5} value={pipSize} onChange={e=>setPipSize(+e.target.value)} style={{ width:'100%', accentColor:C.amber }}/>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Lower third */}
            <Card>
              <CardH icon="📺" title="Lower Third" sub="Overlay produk di bagian bawah video"/>
              <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'9px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <button type="button" onClick={() => setLtEnabled(p=>!p)}
                    style={{ width:'38px', height:'21px', borderRadius:'11px', border:'none', background:ltEnabled?C.amber:C.inkDim, cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:'2px', left:ltEnabled?'19px':'2px', width:'17px', height:'17px', borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                  </button>
                  <span style={{ fontSize:'12px', fontWeight:600, color:C.ink }}>Aktifkan Lower Third</span>
                </div>
                {ltEnabled && (
                  <>
                    {/* Style picker */}
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      {(Object.keys(LOWER_THIRD_STYLES) as LowerThirdStyle[]).map(s => (
                        <button key={s} type="button" onClick={() => setLtStyle(s)}
                          style={{ padding:'4px 9px', borderRadius:'6px', border:`1px solid ${ltStyle===s?C.amber:C.border}`, background:ltStyle===s?C.amberXlt:C.surface, fontSize:'10px', fontWeight:ltStyle===s?700:500, color:ltStyle===s?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                          {LOWER_THIRD_STYLES[s].label}
                        </button>
                      ))}
                    </div>
                    {[
                      { label:'Nama Produk', val:ltProduct, set:setLtProduct, placeholder:productName||'Nama produk' },
                      { label:'Tagline',     val:ltTagline, set:setLtTagline, placeholder:'Kualitas terjamin ✅' },
                      { label:'Harga',       val:ltPrice,   set:setLtPrice,   placeholder:productPrice||'Rp99.000' },
                      { label:'Badge Promo', val:ltBadge,   set:setLtBadge,   placeholder:'DISKON 30%' },
                    ].map(f => (
                      <div key={f.label}>
                        <label style={{ fontSize:'10px', fontWeight:700, color:C.inkMuted, display:'block', marginBottom:'3px' }}>{f.label}</label>
                        <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder}
                          style={{ width:'100%', padding:'7px 10px', borderRadius:'7px', border:`1px solid ${C.border}`, fontSize:'12px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                          onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                          onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 5: RENDER
      ══════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {/* Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }} className="summary-grid">
            {[
              { icon:selAvatar?.emoji??'🎭', label:'Avatar',    val:selAvatar?.label??'—',   color:C.amber  },
              { icon:'🎙️',                   label:'Suara',     val:selVoice?.label??'—',    color:C.purple },
              { icon:EMOTION_SETTINGS[mainEmotion].icon, label:'Emosi', val:EMOTION_SETTINGS[mainEmotion].label, color:C.blue },
              { icon:'🖼️',                   label:'Background', val:bgPreset?.label??'—',   color:C.green  },
            ].map((s,i) => (
              <div key={i} style={{ padding:'13px 14px', borderRadius:'12px', background:C.surface, border:`1px solid ${C.border}`, textAlign:'center' }}>
                <div style={{ fontSize:'24px', marginBottom:'5px' }}>{s.icon}</div>
                <div style={{ fontSize:'11px', color:C.inkDim, marginBottom:'2px' }}>{s.label}</div>
                <div style={{ fontSize:'12px', fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Render card */}
          <Card>
            <div style={{ padding:'28px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px', textAlign:'center' }}>
              {renderStatus === 'idle' && (
                <>
                  <div style={{ width:'72px', height:'72px', borderRadius:'18px', background:C.amberXlt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px' }}>🎬</div>
                  <div>
                    <div style={{ fontSize:'17px', fontWeight:800, color:C.ink, marginBottom:'5px' }}>Siap Generate Video</div>
                    <div style={{ fontSize:'13px', color:C.inkMuted, lineHeight:1.6, maxWidth:'420px' }}>
                      AI akan menggabungkan avatar, suara, emosi, dan komposisi menjadi video presenter siap upload.
                      Estimasi waktu: <strong>2-5 menit</strong>.
                    </div>
                  </div>
                  {/* Render checklist */}
                  <div style={{ padding:'14px 18px', borderRadius:'12px', background:C.bg, border:`1px solid ${C.border}`, width:'100%', maxWidth:'400px', textAlign:'left' }}>
                    {[
                      { done:!!selAvatar,                   label:`Avatar: ${selAvatar?.label??'Belum dipilih'}` },
                      { done:segments.some(s=>s.text.trim()),label:`Script: ${segments.filter(s=>s.text.trim()).length} segmen` },
                      { done:!!selVoice,                    label:`Suara: ${selVoice?.label??'Belum dipilih'}` },
                      { done:true,                           label:`Background: ${bgPreset?.label??'White'}` },
                      { done:true,                           label:`Platform: ${platform} (${aspectRatio})` },
                    ].map((item,i) => (
                      <div key={i} style={{ display:'flex', gap:'8px', alignItems:'center', padding:'5px 0', borderBottom:i<4?`1px solid ${C.border}`:'none' }}>
                        {item.done
                          ? <CheckCircle2 size={14} color={C.green}/>
                          : <AlertCircle size={14} color={C.red}/>}
                        <span style={{ fontSize:'12px', color:item.done?C.inkSub:C.red }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={startRender}
                    disabled={!selAvatar || !selVoice || !segments.some(s=>s.text.trim())}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'14px 32px', borderRadius:'13px', border:'none', background:(!selAvatar||!selVoice||!segments.some(s=>s.text.trim()))?C.inkDim:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'15px', fontWeight:800, cursor:(!selAvatar||!selVoice)?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:C.sa, opacity:(!selAvatar||!selVoice)?.5:1 }}>
                    <Zap size={18}/> Generate Avatar Video
                  </button>
                </>
              )}

              {(renderStatus === 'tts' || renderStatus === 'did') && (
                <>
                  <div style={{ position:'relative', width:'80px', height:'80px' }}>
                    <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`5px solid ${C.amber}20` }}/>
                    <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`5px solid transparent`, borderTopColor:C.amber, animation:'spin .9s linear infinite' }}/>
                    <div style={{ position:'absolute', inset:'18px', fontSize:'28px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {renderStatus==='tts'?'🎙️':'🎭'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:800, color:C.ink, marginBottom:'5px' }}>
                      {renderStatus==='tts'?'Generating Text-to-Speech...':'Rendering Avatar (D-ID)...'}
                    </div>
                    <div style={{ fontSize:'12px', color:C.inkMuted }}>
                      {elapsed}s berlalu · {renderStatus==='tts'?'ElevenLabs generating voice per segmen':'D-ID lipsync rendering — biasanya 2-5 menit'}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width:'100%', maxWidth:'400px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:C.inkMuted, marginBottom:'5px' }}>
                      <span>Progress</span><span>{renderPct}%</span>
                    </div>
                    <div style={{ height:'8px', background:C.border, borderRadius:'4px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${renderPct}%`, background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, borderRadius:'4px', transition:'width .4s ease' }}/>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', fontSize:'11px', color:C.inkMuted }}>
                    {[
                      { label:'TTS Generation', done:renderPct>30 },
                      { label:'Audio Upload',   done:renderPct>45 },
                      { label:'D-ID Lipsync',   done:renderPct>60 },
                      { label:'Video Render',   done:renderPct>80 },
                      { label:'Post-processing',done:renderPct>95 },
                    ].map((item,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px', color:item.done?C.green:C.inkMuted }}>
                        {item.done?<CheckCircle2 size={11} color={C.green}/>:<div style={{ width:'10px', height:'10px', borderRadius:'50%', border:`1.5px solid ${C.border}` }}/>}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {renderStatus === 'done' && outputUrl && (
                <>
                  <CheckCircle2 size={52} color={C.green}/>
                  <div>
                    <div style={{ fontSize:'18px', fontWeight:800, color:C.green, marginBottom:'5px' }}>Video Avatar Selesai! 🎉</div>
                    <div style={{ fontSize:'13px', color:C.inkMuted }}>Selesai dalam {fmtDuration(elapsed)} · Siap download dan upload</div>
                  </div>
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center' }}>
                    <a href={outputUrl} download="beesell-talking-head.mp4"
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'11px 22px', borderRadius:'11px', background:`linear-gradient(135deg,${C.green},#047857)`, color:'#fff', fontSize:'13px', fontWeight:700, textDecoration:'none', boxShadow:`0 4px 14px ${C.green}40` }}>
                      <Download size={15}/> Download MP4
                    </a>
                    <button type="button" onClick={() => { setStep(1); setRenderStatus('idle'); setOutputUrl(null); setRenderPct(0) }}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'11px 18px', borderRadius:'11px', border:`1px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      <RefreshCw size={14}/> Buat Lagi
                    </button>
                  </div>
                </>
              )}

              {renderStatus === 'error' && (
                <>
                  <AlertCircle size={48} color={C.red}/>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:700, color:C.red, marginBottom:'5px' }}>Render Gagal</div>
                    <div style={{ fontSize:'12px', color:C.inkMuted }}>{renderError}</div>
                  </div>
                  <button type="button" onClick={() => { setRenderStatus('idle'); setRenderPct(0) }}
                    style={{ padding:'10px 20px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'13px', fontWeight:600, color:C.ink, cursor:'pointer', fontFamily:'inherit' }}>
                    Coba Lagi
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────── */}
      {renderStatus !== 'tts' && renderStatus !== 'did' && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'22px' }}>
          <button type="button" onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'13px', fontWeight:600, color:step===1?C.inkDim:C.inkSub, cursor:step===1?'not-allowed':'pointer', opacity:step===1?.4:1, fontFamily:'inherit' }}>
            <ArrowLeft size={14}/> Sebelumnya
          </button>
          <div style={{ fontSize:'11px', color:C.inkMuted }}>Langkah {step} dari 5 · {STEPS[step-1]?.label}</div>
          {step < 5 ? (
            <button type="button" onClick={() => setStep(s => Math.min(5,s+1))} disabled={!canNext[step]}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 20px', borderRadius:'10px', border:'none', background:canNext[step]?`linear-gradient(135deg,${C.amber},${C.amberDk})`:C.inkDim, color:'#fff', fontSize:'13px', fontWeight:700, cursor:canNext[step]?'pointer':'not-allowed', opacity:canNext[step]?1:.4, fontFamily:'inherit', boxShadow:canNext[step]?C.sa:'none' }}>
              Lanjut <ArrowRight size={14}/>
            </button>
          ) : renderStatus === 'idle' ? (
            <button type="button" onClick={startRender} disabled={!selAvatar||!selVoice||!segments.some(s=>s.text.trim())}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 20px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:C.sa }}>
              <Zap size={14}/> Generate Video
            </button>
          ) : null}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:2px }
        textarea::placeholder, input::placeholder { color:#9CA3AF }
        input[type=range] { height:4px; cursor:pointer }
        .script-grid  { grid-template-columns:1fr 320px !important }
        .voice-grid   { grid-template-columns:1fr 300px !important }
        .comp-grid    { grid-template-columns:1fr 320px !important }
        .summary-grid { grid-template-columns:repeat(4,1fr) !important }
        @media(max-width:1023px) {
          .script-grid,.voice-grid,.comp-grid { grid-template-columns:1fr !important }
          .summary-grid { grid-template-columns:repeat(2,1fr) !important }
        }
      `}</style>
    </div>
  )
}