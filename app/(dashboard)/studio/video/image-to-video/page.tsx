'use client'
// app/(dashboard)/studio/video/image-to-video/page.tsx
// ══════════════════════════════════════════════════════════════
// IMAGE TO VIDEO AI — Buat video pendek dari foto fashion
// ══════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, RefreshCw, X, Loader2, Sparkles,
  AlertCircle, ChevronRight, Info, CheckCircle2,
  Camera, Play, Video, Maximize2, Film, Clock,
  AlertTriangle, Zap, Monitor, Share2, Lock,
} from 'lucide-react'
import {
  MOTION_PRESETS,
  MOTION_CATEGORIES,
  RESOLUTION_OPTIONS,
  PLATFORM_TIPS,
  type MotionPresetId,
  type ResolutionId,
  type DurationOption,
} from '@/lib/studio/video-presets'

// ── Design tokens — BeeSell Premium Light Mode (Tema Lebah) ───
const T = {
  white: '#FFFFFF',
  bg: '#FAFAFA',          // Light Neutral Base Background
  surface: '#FFFFFF',     // Clean White Card Base
  border: '#E4E4E7',      // Zinc 200
  borderHi: '#D4D4D8',    // Zinc 300

  // Typography Ink Colors (Arang Gelap untuk Kontras Maksimal)
  ink: '#0F172A',         // Slate 900 (Main headings & titles)
  inkSub: '#334155',      // Slate 700 (Secondary parameter titles)
  inkMuted: '#64748B',    // Slate 500 (Descriptions & guides)
  inkDim: '#94A3B8',      // Slate 400 (Placeholders & disabled state)

  // Status Colors
  green: '#10B981',
  greenLt: 'rgba(16, 185, 129, 0.08)',
  blue: '#3B82F6',
  blueLt: 'rgba(59, 130, 246, 0.08)',
  red: '#EF4444',
  redLt: 'rgba(239, 68, 68, 0.08)',
  orange: '#F97316',
  orangeLt: 'rgba(249, 115, 22, 0.08)',

  // Signature Honey/Bee Accent
  accent: '#F59E0B',      // Kuning Lebah Madu Premium (Amber 500)
  accent2: '#D97706',     // Kuning Lebah Tua (Amber 600)
  accentLt: '#FEF3C7',    // Kuning Lebah Muda (Amber 100)
  accentLo: 'rgba(245, 158, 11, 0.05)',
  accentMd: 'rgba(245, 158, 11, 0.12)',

  sh: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
  sm: '0 4px 20px rgba(15,23,42,0.06)',
}

// ── Upload Zone ───────────────────────────────────────────────
interface UploadZoneProps {
  label: string
  sublabel: string
  icon: string
  preview: string | null
  onFile: (f: File) => void
  onClear: () => void
  accent?: string
  required?: boolean
  optional?: boolean
  tips?: string[]
  compact?: boolean
  lockMsg?: string   // show lock overlay if set
}

function UploadZone({ label, sublabel, icon, preview, onFile, onClear, accent = T.accent, required, optional, tips, compact, lockMsg }: UploadZoneProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const pick = () => { if (!lockMsg) ref.current?.click() }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    if (lockMsg) return
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = '' }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: T.inkSub }}>{label}</span>
          {required && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: `${accent}18`, color: T.accent2 }}>WAJIB</span>}
          {optional && <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 5px', borderRadius: '4px', background: '#F1F5F9', color: T.inkMuted }}>Opsional</span>}
        </div>
        {preview && !lockMsg && (
          <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: T.inkMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 5px', borderRadius: '4px', transition: 'color .12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.red}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.inkMuted}>
            <X size={11}/> Hapus
          </button>
        )}
      </div>
      <div
        onClick={lockMsg ? undefined : pick}
        onDragOver={e => { e.preventDefault(); if (!lockMsg) setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{ borderRadius: '12px', border: `1.5px dashed ${lockMsg ? T.border : drag ? accent : preview ? `${accent}60` : T.border}`, background: lockMsg ? '#F8FAFC' : drag ? `${accent}08` : preview ? T.surface : '#FAFAFA', cursor: lockMsg ? 'not-allowed' : 'pointer', overflow: 'hidden', transition: 'all .18s', minHeight: compact ? '130px' : '180px', position: 'relative' }}>
        
        {/* Lock overlay */}
        {lockMsg && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', backdropFilter: 'blur(2px)' }}>
            <Lock size={20} color={T.accent2}/>
            <div style={{ fontSize: '11px', color: T.inkSub, fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>{lockMsg}</div>
            <Link href="/billing" style={{ fontSize: '11px', fontWeight: 700, color: T.white, textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', background: `linear-gradient(135deg,${T.accent},${T.accent2})`, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(245,158,11,0.2)' }}>
              Upgrade Plan Berlangganan
            </Link>
          </div>
        )}

        {preview ? (
          <img src={preview} alt={label} style={{ width: '100%', minHeight: compact ? '130px' : '180px', objectFit: 'cover', display: 'block' }}/>
        ) : (
          <div style={{ padding: compact ? '20px 16px' : '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '9px', minHeight: compact ? '130px' : '180px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${accent}12`, border: `1.5px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{icon}</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.ink, marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '10px', color: T.inkMuted, lineHeight: 1.5 }}>{sublabel}</div>
            </div>
            {tips && !compact && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', maxWidth: '220px' }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: '10px', color: T.inkMuted }}>
                    <span style={{ color: accent, flexShrink: 0 }}>•</span><span style={{ lineHeight: 1.4 }}>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {drag && <div style={{ position: 'absolute', inset: 0, background: `${accent}08`, border: `2px solid ${accent}`, borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '12px', fontWeight: 700, color: T.accent2 }}>Lepaskan foto di sini ✓</div></div>}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange}/>
    </div>
  )
}

// ── Video Player ──────────────────────────────────────────────
function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => {
    if (!videoRef.current) return
    playing ? videoRef.current.pause() : videoRef.current.play()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * duration
  }

  const tryFullscreen = () => {
    if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen()
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', background: '#0F172A', position: 'relative', border: `1px solid ${T.border}`, boxShadow: T.sm }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop
        playsInline
        preload="auto"
        style={{ width: '100%', display: 'block', maxHeight: '560px', objectFit: 'contain', background: '#0F172A' }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => { if (videoRef.current) setProgress(videoRef.current.currentTime) }}
        onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration) }}
        onClick={toggle}
      />

      {/* Overlay controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(15,23,42,0.95))', padding: '32px 14px 12px' }}>
        {/* Progress bar */}
        <div onClick={seek}
          style={{ height: '3px', background: 'rgba(255,255,255,.2)', borderRadius: '2px', cursor: 'pointer', marginBottom: '10px', position: 'relative' }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,${T.accent},${T.accent2})`, borderRadius: '2px', width: `${duration ? (progress / duration) * 100 : 0}%`, transition: 'width .1s linear' }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Play/Pause */}
          <button onClick={toggle}
            style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg,${T.accent},${T.accent2})`, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }}>
            {playing ? '⏸' : <Play size={14} fill="#fff" color="#fff"/>}
          </button>
          {/* Time */}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.8)', flexShrink: 0, fontWeight: 500 }}>
            {fmtTime(progress)} / {fmtTime(duration)}
          </span>
          <div style={{ flex: 1 }}/>
          {/* Loop badge */}
          <span style={{ fontSize: '9px', color: T.accent, fontWeight: 700, background: `${T.accent}25`, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em' }}>LOOP</span>
          {/* Fullscreen */}
          <button onClick={tryFullscreen}
            style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,.1)', border: `1px solid rgba(255,255,255,.15)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Maximize2 size={12} color="rgba(255,255,255,.8)"/>
          </button>
        </div>
      </div>

      {/* Center play when paused */}
      {!playing && (
        <div onClick={toggle}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(15,23,42,0.15)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `linear-gradient(135deg,${T.accent},${T.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px rgba(245,158,11,0.4)` }}>
            <Play size={22} fill="#fff" color="#fff"/>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function ImageToVideoPage() {
  // ── Files ─────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [endImageFile, setEndImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [endPreview, setEndPreview] = useState<string | null>(null)

  // ── Config ────────────────────────────────────────────────
  const [activeCat, setActiveCat] = useState('natural')
  const [presetId, setPresetId] = useState<MotionPresetId>('auto')
  const [duration, setDuration] = useState<DurationOption>(5)
  const [resolution, setResolution] = useState<ResolutionId>('720p')
  const [customPrompt, setCustomPrompt] = useState('')

  // ── Result ────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; limit: number } | null>(null)

  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // Auto-set 1080p when end image is used
  useEffect(() => {
    if (endImageFile && resolution !== '1080p') setResolution('1080p')
  }, [endImageFile, resolution])

  // ── Handlers ──────────────────────────────────────────────
  const handleImage = useCallback((f: File) => {
    setImageFile(f); setVideoUrl(null); setError(null)
    const url = URL.createObjectURL(f); setImagePreview(url)
  }, [])
  const handleEndImage = useCallback((f: File) => {
    setEndImageFile(f)
    const url = URL.createObjectURL(f); setEndPreview(url)
  }, [])
  const clearImage = useCallback(() => { setImageFile(null); setImagePreview(null); setVideoUrl(null) }, [])
  const clearEndImage = useCallback(() => { setEndImageFile(null); setEndPreview(null) }, [])

  const userPlan = 'pro' // replace with real plan check
  const isProPlan = ['pro', 'business'].includes(userPlan)
  const res1080Lock = !isProPlan
  const endImgLock = !isProPlan ? 'End Image hanya tersedia untuk plan Pro dan Business. Upgrade untuk akses.' : undefined

  // ── Generate ──────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!imageFile) return
    setGenerating(true); setError(null); setVideoUrl(null); setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      if (endImageFile) fd.append('endImage', endImageFile)
      fd.append('preset', presetId)
      fd.append('duration', String(duration))
      fd.append('resolution', resolution)
      if (customPrompt.trim()) fd.append('customPrompt', customPrompt.trim())

      const res = await fetch('/api/studio/video/image-to-video', { method: 'POST', body: fd })
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.upgrade) setError('🔒 ' + data.error)
        else if (data.quotaExceeded) setError('⚠️ ' + data.error)
        else setError(data.error ?? `Error ${res.status}`)
        return
      }

      const data = await res.json()
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)
        setElapsed(Math.round((data.elapsedMs ?? 0) / 1000))
        if (data.quotaUsed) setQuotaInfo({ used: data.quotaUsed, limit: data.quotaLimit })
      } else {
        setError('Tidak ada output dari AI. Coba lagi.')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Kesalahan tak terduga')
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setGenerating(false)
    }
  }, [imageFile, endImageFile, presetId, duration, resolution, customPrompt])

  const download = useCallback(() => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl; a.download = `beesell-video-${presetId}-${duration}s-${resolution}.mp4`; a.click()
  }, [videoUrl, presetId, duration, resolution])

  const preset = MOTION_PRESETS[presetId]
  const canGenerate = !!imageFile && !generating

  const estimatedSec = duration === 5
    ? (resolution === '480p' ? 30 : resolution === '720p' ? 50 : 90)
    : (resolution === '480p' ? 55 : resolution === '720p' ? 90 : 150)

  return (
    <div className="font-sans" style={{ minHeight: '100vh', background: T.bg, color: T.ink, paddingBottom: '40px' }}>

      {/* ── Top Bar ─────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: T.surface, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <Link href="/studio" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: T.inkMuted, textDecoration: 'none', fontSize: '13px', transition: 'color .12s', fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.ink}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.inkMuted}>
          <ArrowLeft size={15}/> Studio
        </Link>
        <div style={{ width: '1px', height: '16px', background: T.border }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${T.accent}15`, border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🐝</div>
          <div>
            <div className="font-display" style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>Image to Video AI</div>
            <div style={{ fontSize: '11px', color: T.inkMuted }}>Ubah foto katalog fashion menjadi klip video kreatif berkualitas tinggi</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {quotaInfo && (
            <div style={{ padding: '4px 10px', borderRadius: '6px', background: T.bg, border: `1px solid ${T.border}`, fontSize: '11px', color: T.inkMuted, fontWeight: 500 }}>
              {quotaInfo.used}/{quotaInfo.limit} kuota digunakan
            </div>
          )}
          <div style={{ padding: '4px 10px', borderRadius: '6px', background: `${T.accent}15`, border: `1px solid ${T.accent}30`, fontSize: '11px', fontWeight: 600, color: T.accent2 }}>Pro Lebah</div>
        </div>
      </div>

      {/* ── Layout Grid ─────────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'flex-start' }}>

        {/* ════ LEFT PANEL — Controls ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Source Image */}
          <div style={{ padding: '16px', borderRadius: '14px', background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.sh }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <Camera size={14} color={T.accent2}/>
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Foto Sumber</span>
            </div>
            <UploadZone
              label="Upload Foto"
              sublabel="Foto on-model hasil jepretan AI Photoshoot. Pastikan latar belakang penuh."
              icon="📸"
              preview={imagePreview}
              onFile={handleImage}
              onClear={clearImage}
              accent={T.accent}
              required
              tips={[
                'Gunakan background utuh (bukan transparan)',
                'Resolusi foto minimal 512×512px',
                'Model pakaian harus terlihat jelas',
              ]}
            />
            
            {/* Warning: No Black Background */}
            <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: `${T.orange}08`, border: `1px solid ${T.orange}18`, display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <AlertTriangle size={12} color={T.orange} style={{ flexShrink: 0, marginTop: '2px' }}/>
              <div style={{ fontSize: '11px', color: T.inkSub, lineHeight: 1.4 }}>
                <strong style={{ color: T.orange }}>Rekomendasi:</strong> Latar transparan atau hitam pekat dapat mengurangi akurasi deteksi lekukan pakaian oleh modul AI.
              </div>
            </div>
          </div>

          {/* Duration & Resolution */}
          <div style={{ padding: '16px', borderRadius: '14px', background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.sh }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
              <Monitor size={14} color={T.accent2}/>
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Setelan Output</span>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: T.inkSub, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={12} color={T.inkMuted}/> Durasi Klip Video
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                {([5, 10] as DurationOption[]).map(d => (
                  <button key={d} type="button" onClick={() => setDuration(d)}
                    style={{ padding: '11px', borderRadius: '10px', border: `1.5px solid ${duration === d ? T.accent : T.border}`, background: duration === d ? `${T.accent}08` : 'transparent', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: duration === d ? T.accent2 : T.inkSub }}>{d}s</div>
                    <div style={{ fontSize: '10px', color: T.inkMuted, marginTop: '2px' }}>
                      {d === 5 ? 'Gerakan Stabil' : 'Eksplorasi Panjang'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: T.inkSub, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Film size={12} color={T.inkMuted}/> Resolusi Video
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(['480p', '720p', '1080p'] as ResolutionId[]).map(r => {
                  const opt = RESOLUTION_OPTIONS[r]
                  const sel = resolution === r
                  const locked = r === '1080p' && res1080Lock
                  return (
                    <button key={r} type="button" onClick={() => !locked && setResolution(r)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '9px', border: `1.5px solid ${sel ? T.accent : T.border}`, background: sel ? `${T.accent}05` : 'transparent', cursor: locked ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: locked ? .5 : 1, fontFamily: 'inherit', width: '100%' }}>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: sel ? T.accent2 : T.ink }}>{opt.label}</span>
                          {r === '480p' && <span style={{ fontSize: '9px', color: T.green, background: T.greenLt, padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>Pratinjau</span>}
                          {r === '720p' && <span style={{ fontSize: '9px', color: T.blue, background: T.blueLt, padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>Rekomendasi</span>}
                          {r === '1080p' && <span style={{ fontSize: '9px', color: T.accent2, background: T.accentLt, padding: '1px 5px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>HD Pro</span>}
                        </div>
                        <div style={{ fontSize: '10px', color: T.inkMuted, marginTop: '2px' }}>{opt.desc}</div>
                      </div>
                      {sel && <CheckCircle2 size={14} color={T.accent2} style={{ flexShrink: 0 }}/>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Motion Preset */}
          <div style={{ padding: '16px', borderRadius: '14px', background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.sh }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <Sparkles size={14} color={T.accent2}/>
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gaya Pergerakan</span>
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {MOTION_CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setActiveCat(cat.id)}
                  style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${activeCat === cat.id ? T.accent : T.border}`, background: activeCat === cat.id ? T.accentLt : 'transparent', fontSize: '11px', fontWeight: activeCat === cat.id ? 700 : 500, color: activeCat === cat.id ? T.accent2 : T.inkMuted, cursor: 'pointer', transition: 'all .12s', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Preset Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {MOTION_CATEGORIES.find(c => c.id === activeCat)?.presets.map(pid => {
                const p = MOTION_PRESETS[pid]
                const sel = presetId === pid
                return (
                  <button key={pid} type="button" onClick={() => setPresetId(pid)}
                    style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', padding: '10px 11px', borderRadius: '9px', border: `1.5px solid ${sel ? T.accent : T.border}`, background: sel ? `${T.accent}05` : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: 'inherit', width: '100%' }}
                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.borderColor = T.borderHi }}
                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.borderColor = T.border }}>
                    <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{p.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: sel ? T.accent2 : T.ink }}>{p.label}</span>
                        {p.badge && <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: T.accentLt, color: T.accent2 }}>{p.badge}</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: T.inkMuted, lineHeight: 1.4 }}>{p.desc}</div>
                    </div>
                    {sel && <CheckCircle2 size={12} color={T.accent2} style={{ flexShrink: 0, marginTop: '2px' }}/>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Prompt */}
          <div style={{ padding: '16px', borderRadius: '14px', background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.sh }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <Zap size={14} color={T.accent2}/>
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instruksi Tambahan</span>
              <span style={{ fontSize: '9px', color: T.inkMuted, padding: '2px 5px', borderRadius: '4px', background: '#F1F5F9' }}>Opsional</span>
            </div>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder='Contoh: "soft wind blowing dress fabric". Kosongkan untuk optimasi pergerakan alami otomatis.'
              maxLength={150}
              rows={2}
              style={{ width: '100%', background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '9px 11px', fontSize: '11px', color: T.ink, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px', color: T.inkMuted }}>
              <span>Gunakan bahasa Inggris sederhana untuk stabilitas gerakan render.</span>
              <span>{customPrompt.length}/150</span>
            </div>
          </div>

          {/* End Image — Pro Only */}
          <div style={{ padding: '16px', borderRadius: '14px', background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.sh }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
              <Film size={14} color={T.accent2}/>
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Frame Penutup</span>
              <span style={{ fontSize: '9px', color: T.accent2, fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: T.accentLt }}>PRO</span>
            </div>
            <div style={{ fontSize: '11px', color: T.inkMuted, lineHeight: 1.5, marginBottom: '12px' }}>
              Kunci pose akhir video (misal: unggah tampak belakang agar AI menghasilkan klip model berputar anggun).
            </div>
            <UploadZone
              label="Frame Akhir Video"
              sublabel="Otomatis menyelaraskan transisi antar dua foto katalog."
              icon="🎯"
              preview={endPreview}
              onFile={handleEndImage}
              onClear={clearEndImage}
              accent={T.accent}
              optional
              compact
              lockMsg={endImgLock}
            />
          </div>

          {/* Generate Button */}
          <button type="button" onClick={generate} disabled={!canGenerate}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', width: '100%', border: 'none', cursor: canGenerate ? 'pointer' : 'not-allowed', background: canGenerate ? `linear-gradient(135deg,${T.accent},${T.accent2})` : '#E2E8F0', color: canGenerate ? '#fff' : T.inkDim, fontSize: '14px', fontWeight: 700, transition: 'all .18s', boxShadow: canGenerate ? `0 4px 14px rgba(245,158,11,0.3)` : 'none', fontFamily: 'inherit' }}>
            {generating ? (
              <><Loader2 size={16} style={{ animation: 'spin .8s linear infinite' }}/> Menyusun Rangkaian Gerak... {seconds}s</>
            ) : (
              <><Video size={16}/> Hasilkan Video Fashion AI</>
            )}
          </button>
        </div>

        {/* ════ RIGHT PANEL — Result Player ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Header Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="font-display" style={{ fontSize: '16px', fontWeight: 700, color: T.ink }}>Pratinjau Hasil Kreatif AI</div>
              <div style={{ fontSize: '12px', color: T.inkMuted, marginTop: '2px' }}>
                {videoUrl ? `${preset.label} · ${duration}s · Berhasil Selesai` : 'Klip animasi Anda akan di-render di panel kanan ini.'}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ padding: '14px', borderRadius: '12px', background: `${T.red}10`, border: `1px solid ${T.red}20`, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertCircle size={16} color={T.red} style={{ flexShrink: 0, marginTop: '1px' }}/>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: T.red, marginBottom: '3px' }}>Gagal Memproses Antrean GPU</div>
                <div style={{ fontSize: '12px', color: T.inkSub, lineHeight: 1.5 }}>{error}</div>
              </div>
            </div>
          )}

          {/* Loading Animation Area */}
          {generating && (
            <div style={{ borderRadius: '16px', background: T.surface, border: `1px solid ${T.border}`, padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', boxShadow: T.sm }}>
              <div style={{ position: 'relative', width: '72px', height: '72px' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${T.accent}20` }}/>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid transparent`, borderTopColor: T.accent2, animation: 'spin .9s linear infinite' }}/>
                <div style={{ position: 'absolute', inset: '18px', borderRadius: '50%', background: `${T.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🐝</div>
              </div>
              <div style={{ textAlign: 'center', maxWidth: '440px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: T.ink, marginBottom: '6px' }}>AI sedang menghitung dinamika lipatan kain...</div>
                <div style={{ fontSize: '12px', color: T.inkMuted, lineHeight: 1.5 }}>Komputasi sekuensial frame video membutuhkan alokasi server yang lebih intensif dibandingkan pemrosesan foto katalog statis.</div>
              </div>
              
              {/* Progress Line */}
              <div style={{ width: '100%', maxWidth: '340px' }}>
                <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: `linear-gradient(90deg,${T.accent},${T.accent2})`, width: `${Math.min(95, (seconds / estimatedSec) * 100)}%`, transition: 'width .5s ease' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: T.inkMuted }}>
                  <span>Tahap: Neural Motion Diffusion</span>
                  <span style={{ fontWeight: 600, color: T.accent2 }}>{Math.min(95, Math.round((seconds / estimatedSec) * 100))}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty Screen View */}
          {!generating && !videoUrl && !error && (
            <div style={{ borderRadius: '16px', background: T.surface, border: `1.5px dashed ${T.border}`, padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', boxShadow: T.sh }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `${T.accent}10`, border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🎬</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: T.inkSub, marginBottom: '6px' }}>Belum Ada Materi Video Yang Diproduksi</div>
                <div style={{ fontSize: '12px', color: T.inkMuted, lineHeight: 1.6, maxWidth: '420px', margin: '0 auto' }}>
                  Unggah hasil foto katalog terbaik Anda di panel kontrol kiri. Mesin kecerdasan buatan akan mengonversinya menjadi video pendek sinematik untuk kebutuhan promosi media sosial.
                </div>
              </div>
            </div>
          )}

          {/* Video Result View */}
          {videoUrl && !generating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <VideoPlayer src={videoUrl} poster={imagePreview ?? undefined}/>

              {/* Action Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '7px' }}>
                {[
                  { icon: <Download size={14}/>, label: 'Simpan MP4', action: download, color: T.accent2, bg: T.accentLt },
                  { icon: <RefreshCw size={14}/>, label: 'Render Ulang', action: generate, color: T.inkSub, bg: T.surface },
                  { icon: <Share2 size={14}/>, label: 'Bagikan', action: () => {}, color: T.blue, bg: T.blueLt },
                  { icon: <Maximize2 size={14}/>, label: 'Upscale Kualitas', action: () => {}, color: T.green, bg: T.greenLt },
                ].map((btn, i) => (
                  <button key={i} type="button" onClick={btn.action}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '12px 6px', borderRadius: '10px', border: `1px solid ${T.border}`, background: btn.bg, color: btn.color, cursor: 'pointer', transition: 'all .12s', fontFamily: 'inherit', boxShadow: T.sh }}
                    onMouseEnter={e => { if(btn.bg === T.surface) (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                    onMouseLeave={e => { if(btn.bg === T.surface) (e.currentTarget as HTMLElement).style.background = T.surface }}>
                    {btn.icon}
                    <span style={{ fontSize: '10px', fontWeight: 600 }}>{btn.label}</span>
                  </button>
                ))}
              </div>

              {/* Troubleshoot Panel */}
              <div style={{ padding: '14px', borderRadius: '12px', background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.sh }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: T.inkSub, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={13} color={T.accent2}/> Hasil simulasi pergerakan kurang stabil atau terdistorsi?
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { p: 'Bentuk wajah bergoyang tidak natural', s: 'Prioritaskan penggunaan durasi standar (5 detik) untuk mempertahankan struktur anatomi model.' },
                    { p: 'Bagian pakaian robek atau berkedip', s: 'Gunakan preset gerakan yang lebih halus seperti "Subtle Breathing" untuk memperkecil radius perubahan piksel.' },
                    { p: 'Detail motif produk menghilang', s: 'Pastikan foto sumber memiliki pencahayaan tajam sebelum dieksekusi oleh mesin AI.' },
                  ].map((item, i) => (
                    <div key={i} style={{ fontSize: '11px', color: T.inkMuted, lineHeight: 1.5 }}>
                      <span style={{ color: T.orange, fontWeight: 600 }}>• {item.p}:</span> {item.s}
                    </div>
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
        ::-webkit-scrollbar { width: 6px }
        ::-webkit-scrollbar-thumb { background: #E4E4E7; border-radius: 3px }
        video { display: block }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 380px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}