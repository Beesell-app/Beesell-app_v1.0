'use client'
// app/(dashboard)/studio/video/tiktok/page.tsx
// ══════════════════════════════════════════════════════════════
// BEESELL AI — TIKTOK REELS AI
// Script + Hook + Caption + Hashtag + Publish (TikTok API ready)
// ──────────────────────────────────────────────────────────────
// REDESIGN: Tema Lebah/Madu (light mode) 🐝🍯
//   ✓ Konfigurasi Script dirombak: layout stacked (bukan 1fr 1fr)
//   ✓ Bahasa = segmented toggle premium (gaya iOS/macOS)
//   ✓ Tone = high-contrast pills (gelap saat aktif) + wrap rapi
//   ✓ Durasi = stepped slider presisi
//   ✓ FIX: hapus token undefined (C.amber*, C.bg, C.bgAlt ganda)
//   ✓ FIX: hapus blok Tone duplikat (scrollable chips)
//   ✓ minHeight 100% (di dalam dashboard shell)
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Sparkles, Loader2, Copy, Check, RefreshCw,
  AlertCircle, Hash, FileText, Zap, CheckCircle2,
  Music, Send, Globe, Lock,
} from 'lucide-react'
import {
  SCRIPT_VARIANTS,
  PLATFORMS,
  DURATION_OPTIONS,
  VISUAL_SEQUENCES,
  TIKTOK_POST_PRESETS,
  TIKTOK_TRENDING_SOUND_TYPES,
  HASHTAG_STRATEGY,
  buildTikTokPostPayload,
  type ScriptVariantId,
  type PlatformId,
  type NicheId,
  type DurationSec,
} from '@/lib/studio/tiktok/presets'

// ── Design tokens — TEMA LEBAH / MADU (light) ─────────────────
const C = {
  honey:    '#F59E0B',   // madu utama
  honeyDk:  '#D97706',
  honeyDp:  '#B45309',   // madu pekat
  honeyLt:  '#FEF3C7',
  honeyXlt: '#FFFBEB',
  cream:    '#FFFCF5',   // background halaman (krem hangat)
  bgAlt:    '#F4ECD9',   // track segmented control (beige hangat)
  white:    '#FFFFFF',
  surface:  '#FFFFFF',
  bee:      '#1C1917',   // hitam lebah (high-contrast)
  beeSoft:  '#292524',
  border:   '#F0E6D2',   // border hangat
  borderHi: '#E6D5AE',
  ink:      '#1C1917',
  inkSub:   '#44403C',
  inkMuted: '#78716C',
  inkDim:   '#A8A29E',
  green:    '#059669',
  greenLt:  '#ECFDF5',
  blue:     '#2563EB',
  blueLt:   '#EFF6FF',
  purple:   '#7C3AED',
  purpleLt: '#F5F3FF',
  red:      '#DC2626',
  redLt:    '#FEF2F2',
  sh:  '0 1px 3px rgba(120,80,10,.06)',
  sm:  '0 4px 16px rgba(120,80,10,.08)',
  sa:  '0 6px 20px rgba(245,158,11,.25)',
}

// ── Pola honeycomb (data URI, halus) ──────────────────────────
const COMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23F59E0B' fill-opacity='0.05'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l11 6.35 11-6.35V17.9l-11-6.35L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"

// ── Niches ────────────────────────────────────────────────────
const NICHES: { id: NicheId; label: string; icon: string }[] = [
  { id:'general',  label:'General',  icon:'🏪' },
  { id:'fashion',  label:'Fashion',  icon:'👗' },
  { id:'beauty',   label:'Beauty',   icon:'💄' },
  { id:'skincare', label:'Skincare', icon:'🧴' },
  { id:'food',     label:'Food',     icon:'🍜' },
  { id:'gadget',   label:'Gadget',   icon:'📱' },
  { id:'health',   label:'Herbal',   icon:'🌿' },
  { id:'home',     label:'Home',     icon:'🏡' },
  { id:'baby',     label:'Baby',     icon:'👶' },
  { id:'hijab',    label:'Hijab',    icon:'🧕' },
]

const TONES = ['casual','energetik','profesional','luxury','gen-z','islami']

// ── Output tab types ──────────────────────────────────────────
type OutputTab = 'script' | 'hooks' | 'visual' | 'caption' | 'hashtag' | 'publish'

// ── Result shape ──────────────────────────────────────────────
interface ScriptResult {
  script: {
    hook:         string
    fullScript:   string
    caption:      string
    cta:          string
    visualNotes:  string
    visualScenes: string[]
  }
  hooks:    string[]
  hashtags: {
    trending: string[]
    niche:    string[]
    general:  string[]
    product:  string[]
  }
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

// ── Pill button ───────────────────────────────────────────────
function Pill({
  label, selected, onClick, color = C.honey, icon,
}: {
  label: string; selected: boolean; onClick: () => void; color?: string; icon?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:'4px',
        padding:'6px 13px', borderRadius:'99px',
        border:`1.5px solid ${selected ? color : C.border}`,
        background:selected ? `${color}12` : C.surface,
        color:selected ? color : C.inkMuted,
        fontSize:'12px', fontWeight:selected ? 700 : 500,
        cursor:'pointer', transition:'all .12s',
        whiteSpace:'nowrap', fontFamily:'inherit',
        boxShadow:selected ? `0 0 0 1px ${color}20` : 'none',
      }}
      onMouseEnter={e => { if (!selected)(e.currentTarget as HTMLElement).style.borderColor = color }}
      onMouseLeave={e => { if (!selected)(e.currentTarget as HTMLElement).style.borderColor = C.border }}
    >
      {icon && <span style={{ fontSize:'13px' }}>{icon}</span>}
      {label}
    </button>
  )
}

// ── Copy button ───────────────────────────────────────────────
function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent */ }
  }
  return (
    <button
      onClick={copy}
      style={{
        display:'flex', alignItems:'center', gap:'4px',
        padding:small ? '4px 8px' : '6px 11px', borderRadius:'7px',
        border:`1px solid ${copied ? C.green : C.border}`,
        background:copied ? C.greenLt : C.surface,
        color:copied ? C.green : C.inkDim,
        fontSize:'11px', fontWeight:600,
        cursor:'pointer', transition:'all .15s', fontFamily:'inherit',
      }}
    >
      {copied ? <><Check size={11} /> Tersalin</> : <><Copy size={11} /> Salin</>}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────
function Card({
  children, title, icon, badge, color = C.honey, style,
}: {
  children: React.ReactNode; title?: string; icon?: string;
  badge?: string; color?: string; style?: React.CSSProperties
}) {
  return (
    <div style={{
      background:C.surface, borderRadius:'14px',
      border:`1px solid ${C.border}`, boxShadow:C.sh,
      overflow:'hidden', ...style,
    }}>
      {title && (
        <div style={{
          padding:'13px 16px 11px', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', gap:'8px',
        }}>
          {icon && <span style={{ fontSize:'16px' }}>{icon}</span>}
          <span style={{ fontSize:'13px', fontWeight:700, color:C.ink, flex:1 }}>{title}</span>
          {badge && (
            <div style={{
              fontSize:'10px', fontWeight:700, padding:'2px 8px',
              borderRadius:'99px', background:`${color}18`, color,
            }}>
              {badge}
            </div>
          )}
        </div>
      )}
      <div style={{ padding:'14px 16px' }}>{children}</div>
    </div>
  )
}

// ── Input field ───────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, textarea, rows = 2, required, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean; rows?: number;
  required?: boolean; hint?: string
}) {
  const baseStyle: React.CSSProperties = {
    width:'100%', padding:'9px 11px', borderRadius:'8px',
    border:`1px solid ${C.border}`, fontSize:'12px', color:C.ink,
    outline:'none', fontFamily:'inherit', transition:'border-color .15s',
    boxSizing:'border-box', background:C.white, resize:'vertical',
  }
  const onFocus  = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = C.honey
  const onBlur   = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = C.border

  return (
    <div>
      <label style={{
        fontSize:'11px', fontWeight:700, color:C.inkSub,
        display:'flex', gap:'4px', marginBottom:'5px',
      }}>
        {label}
        {required && <span style={{ color:C.red }}>*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={baseStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={baseStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}
      {hint && (
        <div style={{ fontSize:'10px', color:C.inkDim, marginTop:'4px', lineHeight:1.5 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

// ── Hashtag chip ──────────────────────────────────────────────
function HashChip({ tag, color }: { tag: string; color: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tag)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* silent */ }
  }
  return (
    <button
      onClick={copy}
      style={{
        padding:'4px 9px', borderRadius:'99px',
        border:`1px solid ${color}30`, background:`${color}10`,
        color, fontSize:'11px', fontWeight:600,
        cursor:'pointer', transition:'all .12s',
        fontFamily:'inherit', display:'flex', alignItems:'center', gap:'3px',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${color}20`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${color}10`}
    >
      {copied ? <Check size={10} /> : <Hash size={9} />}
      {tag.replace('#', '')}
    </button>
  )
}

// ── Hook variant card ─────────────────────────────────────────
function HookCard({
  hook, label, version, color,
}: {
  hook: string; label: string; version: string; color: string
}) {
  return (
    <div style={{
      padding:'13px 14px', borderRadius:'11px',
      border:`1.5px solid ${color}30`, background:`${color}08`,
    }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px',
      }}>
        <div style={{
          fontSize:'11px', fontWeight:800, color,
          textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          Version {version} · {label}
        </div>
        <CopyBtn text={hook} small />
      </div>
      <div style={{ fontSize:'13px', color:C.ink, lineHeight:1.6, fontStyle:'italic' }}>
        &ldquo;{hook}&rdquo;
      </div>
    </div>
  )
}

// ── Scene card ────────────────────────────────────────────────
function SceneCard({ scene, idx }: { scene: string; idx: number }) {
  return (
    <div style={{
      display:'flex', gap:'10px', alignItems:'flex-start',
      padding:'9px 11px', borderRadius:'9px',
      background:C.honeyXlt, border:`1px solid ${C.border}`,
    }}>
      <div style={{
        width:'26px', height:'26px', borderRadius:'7px',
        background:`linear-gradient(135deg,${C.honey},${C.honeyDp})`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'11px', fontWeight:800, color:'#fff', flexShrink:0,
      }}>
        {idx}
      </div>
      <div style={{ flex:1, fontSize:'12px', color:C.inkSub, lineHeight:1.5, paddingTop:'2px' }}>
        {scene}
      </div>
    </div>
  )
}

// ── Progress steps ────────────────────────────────────────────
function ProgressSteps({ seconds }: { seconds: number }) {
  const steps   = ['Analisis produk','Buat hook','Tulis script','Optimize CTA']
  const thresh  = [2, 5, 10, 18]
  return (
    <div style={{
      display:'flex', gap:'10px', alignItems:'center',
      fontSize:'10px', color:C.inkMuted,
      flexWrap:'wrap', justifyContent:'center',
    }}>
      {steps.map((step, i) => {
        const done = seconds > thresh[i]
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px', color:done ? C.green : C.inkMuted }}>
            {done ? (
              <CheckCircle2 size={11} color={C.green} />
            ) : (
              <div style={{
                width:'10px', height:'10px', borderRadius:'50%',
                border:`1.5px solid ${C.border}`,
              }} />
            )}
            {step}
            {i < steps.length - 1 && (
              <span style={{ color:C.borderHi }}>→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function TikTokReelsPage() {

  // ── Input mode ────────────────────────────────────────────
  const [inputMode,     setInputMode]     = useState<'url' | 'manual'>('manual')
  const [productUrl,    setProductUrl]    = useState('')
  const [analyzing,     setAnalyzing]     = useState(false)
  const [analyzed,      setAnalyzed]      = useState(false)
  const [analyzeSeconds,setAnalyzeSeconds]= useState(0)

  // ── Product info ─────────────────────────────────────────
  const [productName,   setProductName]   = useState('')
  const [productPrice,  setProductPrice]  = useState('')
  const [targetMarket,  setTargetMarket]  = useState('')
  const [mainBenefit,   setMainBenefit]   = useState('')
  const [painPoint,     setPainPoint]     = useState('')
  const [socialProof,   setSocialProof]   = useState('')
  const [affiliateCode, setAffiliateCode] = useState('')
  const [niche,         setNiche]         = useState<NicheId>('general')

  // ── Script config ─────────────────────────────────────────
  const [variantId,     setVariantId]     = useState<ScriptVariantId>('ugc-review')
  const [platform,      setPlatform]      = useState<PlatformId>('tiktok')
  const [duration,      setDuration]      = useState<DurationSec>(30)
  const [language,      setLanguage]      = useState<'indonesia' | 'english'>('indonesia')
  const [tone,          setTone]          = useState('casual')

  // ── Generate state ────────────────────────────────────────
  const [generating,    setGenerating]    = useState(false)
  const [genVariants,   setGenVariants]   = useState(false)
  const [genSeconds,    setGenSeconds]    = useState(0)

  // ── Output ────────────────────────────────────────────────
  const [result,        setResult]        = useState<ScriptResult | null>(null)
  const [allVariants,   setAllVariants]   = useState<Record<string, string> | null>(null)
  const [error,         setError]         = useState('')
  const [activeOutput,  setActiveOutput]  = useState<OutputTab>('script')

  // ── Publish (TikTok API) state ────────────────────────────
  const [postPresetId,  setPostPresetId]  = useState<string>('organic')

  // ── Timers ────────────────────────────────────────────────
  const analyzeTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const genTimer     = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analyzeTimer.current) clearInterval(analyzeTimer.current)
      if (genTimer.current)     clearInterval(genTimer.current)
    }
  }, [])

  // ── Helpers ───────────────────────────────────────────────
  const stopAnalyzeTimer = () => {
    if (analyzeTimer.current) { clearInterval(analyzeTimer.current); analyzeTimer.current = null }
  }
  const stopGenTimer = () => {
    if (genTimer.current) { clearInterval(genTimer.current); genTimer.current = null }
  }

  // ── Analyze URL ───────────────────────────────────────────
  const analyzeUrl = useCallback(async () => {
    if (!productUrl.trim()) return
    setAnalyzing(true); setError(''); setAnalyzeSeconds(0)
    analyzeTimer.current = setInterval(() => setAnalyzeSeconds(s => s + 1), 1000)
    try {
      const res  = await fetch('/api/studio/video/tiktok?action=analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productUrl }),
      })
      const data = await res.json()
      if (data.productName)  setProductName(data.productName)
      if (data.price)        setProductPrice(data.price)
      if (data.targetMarket) setTargetMarket(data.targetMarket)
      if (data.mainBenefit)  setMainBenefit(data.mainBenefit)
      if (data.painPoint)    setPainPoint(data.painPoint)
      if (data.socialProof)  setSocialProof(data.socialProof)
      if (data.niche)        setNiche(data.niche as NicheId)
      setAnalyzed(true)
      setError('')
    } catch (e: any) {
      setError(e?.message ?? 'Analisis URL gagal. Coba mode Manual.')
    } finally {
      stopAnalyzeTimer()
      setAnalyzing(false)
    }
  }, [productUrl])

  // ── Generate single script ────────────────────────────────
  const generate = useCallback(async (overrideVariantId?: ScriptVariantId) => {
    const vid = overrideVariantId ?? variantId
    if (!productName.trim()) { setError('Masukkan nama produk terlebih dulu'); return }
    setGenerating(true); setError(''); setResult(null); setGenSeconds(0)
    genTimer.current = setInterval(() => setGenSeconds(s => s + 1), 1000)
    try {
      const res = await fetch('/api/studio/video/tiktok?action=script', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          variantId: vid, platform, duration,
          productName, productPrice, targetMarket,
          mainBenefit, painPoint, socialProof,
          niche, language, tone, affiliateCode,
        }),
      })
      stopGenTimer()
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? `Error ${res.status}`)
      }
      const data = await res.json()
      setResult({ script: data.script, hooks: data.hooks, hashtags: data.hashtags })
      setAllVariants(null)
      setActiveOutput('script')
    } catch (e: any) {
      setError(e?.message ?? 'Generate gagal. Coba lagi.')
    } finally {
      stopGenTimer()
      setGenerating(false)
    }
  }, [variantId, platform, duration, productName, productPrice, targetMarket, mainBenefit, painPoint, socialProof, niche, language, tone, affiliateCode])

  // ── Generate all 12 variants ──────────────────────────────
  const generateAllVariants = useCallback(async () => {
    if (!productName.trim()) { setError('Masukkan nama produk terlebih dulu'); return }
    setGenVariants(true); setError(''); setAllVariants(null); setResult(null); setGenSeconds(0)
    genTimer.current = setInterval(() => setGenSeconds(s => s + 1), 1000)
    try {
      const res = await fetch('/api/studio/video/tiktok?action=variants', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          productName, productPrice, targetMarket,
          mainBenefit, painPoint, socialProof,
          niche, platform, duration,
        }),
      })
      stopGenTimer()
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? `Error ${res.status}`)
      }
      const data = await res.json()
      setAllVariants(data.variantScripts ?? {})
    } catch (e: any) {
      setError(e?.message ?? 'Generate semua variasi gagal.')
    } finally {
      stopGenTimer()
      setGenVariants(false)
    }
  }, [productName, productPrice, targetMarket, mainBenefit, painPoint, socialProof, niche, platform, duration])

  // ── Derived ───────────────────────────────────────────────
  const selectedVariant  = SCRIPT_VARIANTS.find(v => v.id === variantId)
  const selectedPlatform = PLATFORMS.find(p => p.id === platform)!
  const selectedPreset   = TIKTOK_POST_PRESETS.find(p => p.id === postPresetId) ?? TIKTOK_POST_PRESETS[0]
  const canGenerate      = !!productName.trim() && !generating && !genVariants
  const hookVersions     = result?.hooks.slice(0, 3) ?? []

  // Saran sound sesuai jenis script terpilih
  const suggestedSounds  = TIKTOK_TRENDING_SOUND_TYPES.filter(s => s.useFor.includes(variantId))
  const soundList        = suggestedSounds.length ? suggestedSounds : TIKTOK_TRENDING_SOUND_TYPES.slice(0, 2)

  const OUTPUT_TABS: { id: OutputTab; label: string }[] = [
    { id:'script',  label:'📝 Script'      },
    { id:'hooks',   label:'🎣 Hooks A/B/C' },
    { id:'visual',  label:'🎬 Visual'      },
    { id:'caption', label:'💬 Caption'     },
    { id:'hashtag', label:'#️⃣ Hashtag'    },
    { id:'publish', label:'🚀 Publish'     },
  ]

  // ── Shared caption text builder ───────────────────────────
  const captionFor = (plat: typeof PLATFORMS[0]) => {
    if (!result) return ''
    const base = result.script.caption || `${result.script.hook}\n\n${result.script.cta}`
    const tags  = [
      ...result.hashtags.trending,
      ...result.hashtags.niche,
      ...result.hashtags.general,
      ...result.hashtags.product,
    ].slice(0, plat.hashtagLimit).join(' ')
    return `${base}\n\n${tags}`
  }

  // ── Build TikTok API payload (Publish tab) ────────────────
  const allHashtags = result ? [
    ...result.hashtags.trending,
    ...result.hashtags.niche,
    ...result.hashtags.general,
    ...result.hashtags.product,
  ] : []

  const publishPayload = result ? buildTikTokPostPayload({
    platform,
    caption: result.script.caption || `${result.script.hook}\n\n${result.script.cta}`,
    hashtags: allHashtags,
    postPreset: selectedPreset,
    suggestedSound: soundList[0]?.label,
  }) : null

  // ════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight:'100%', background:C.cream, backgroundImage:`url("${COMB}")`,
      fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink,
    }}>

      {/* ── Top bar ─────────────────────────────────────── */}
      <div style={{
        background:C.surface, borderBottom:`1px solid ${C.border}`,
        backgroundImage:`url("${COMB}")`,
        padding:'11px 20px', display:'flex', alignItems:'center', gap:'14px',
        position:'sticky', top:0, zIndex:100, boxShadow:C.sh,
      }}>
        <Link
          href="/studio"
          style={{ display:'flex', alignItems:'center', gap:'5px', color:C.inkMuted, textDecoration:'none', fontSize:'13px' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.inkMuted}
        >
          <ArrowLeft size={15} /> Studio
        </Link>
        <div style={{ width:'1px', height:'16px', background:C.border }} />
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{
            width:'30px', height:'30px', borderRadius:'9px',
            background:`linear-gradient(135deg,${C.honey},${C.honeyDp})`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px',
            boxShadow:C.sa,
          }}>
            🐝
          </div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>
              TikTok Reels AI <span style={{ color:C.honeyDk }}>🍯</span>
            </div>
            <div style={{ fontSize:'10px', color:C.inkMuted }}>
              Script + Hook + Caption + Hashtag + Publish untuk TikTok, Reels &amp; Shorts
            </div>
          </div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <div style={{
            padding:'3px 10px', borderRadius:'6px',
            background:C.honeyLt, border:`1px solid ${C.honey}30`,
            fontSize:'11px', fontWeight:600, color:C.honeyDk,
          }}>
            Pro+
          </div>
        </div>
      </div>

      {/* ── 2-panel layout ──────────────────────────────── */}
      <div
        style={{ maxWidth:'1440px', margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'440px 1fr', gap:'22px', alignItems:'flex-start' }}
        className="tiktok-layout"
      >

        {/* ════ LEFT — Input & Config ════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Input mode toggle */}
          <div style={{ display:'flex', gap:'5px', background:C.honeyXlt, borderRadius:'10px', padding:'3px', border:`1px solid ${C.border}` }}>
            {(['url', 'manual'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setInputMode(m)}
                style={{
                  flex:1, padding:'8px', borderRadius:'8px', border:'none',
                  background:inputMode === m ? C.surface : 'transparent',
                  fontSize:'12px', fontWeight:inputMode === m ? 700 : 500,
                  color:inputMode === m ? C.ink : C.inkMuted,
                  cursor:'pointer', boxShadow:inputMode === m ? C.sh : 'none',
                  transition:'all .15s', fontFamily:'inherit',
                }}
              >
                {m === 'url' ? '🔗 URL Produk' : '✍️ Input Manual'}
              </button>
            ))}
          </div>

          {/* URL analyzer */}
          {inputMode === 'url' && (
            <Card title="URL Produk" icon="🔗">
              <div style={{ display:'flex', gap:'7px' }}>
                <input
                  value={productUrl}
                  onChange={e => setProductUrl(e.target.value)}
                  placeholder="https://shopee.co.id/produk... atau tiktok.com/..."
                  style={{
                    flex:1, padding:'9px 11px', borderRadius:'8px',
                    border:`1px solid ${C.border}`, fontSize:'12px',
                    outline:'none', fontFamily:'inherit', transition:'border-color .15s',
                  }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = C.honey}
                  onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
                  onKeyDown={e => e.key === 'Enter' && analyzeUrl()}
                />
                <button
                  type="button"
                  onClick={analyzeUrl}
                  disabled={!productUrl.trim() || analyzing}
                  style={{
                    display:'flex', alignItems:'center', gap:'5px',
                    padding:'9px 14px', borderRadius:'8px',
                    background:`linear-gradient(135deg,${C.honey},${C.honeyDp})`,
                    border:'none', color:'#fff',
                    fontSize:'12px', fontWeight:700,
                    cursor:productUrl.trim() && !analyzing ? 'pointer' : 'not-allowed',
                    opacity:!productUrl.trim() || analyzing ? 0.6 : 1,
                    fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:C.sa,
                  }}
                >
                  {analyzing ? (
                    <Loader2 size={13} style={{ animation:'spin .8s linear infinite' }} />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  {analyzing ? `${analyzeSeconds}s` : 'Analisis'}
                </button>
              </div>
              <div style={{ marginTop:'8px', fontSize:'10px', color:C.inkMuted }}>
                Support: Shopee, TikTok Shop, Tokopedia, landing page
              </div>
              {analyzed && (
                <div style={{
                  marginTop:'8px', padding:'8px 10px', borderRadius:'8px',
                  background:C.greenLt, border:`1px solid ${C.green}30`,
                  display:'flex', gap:'6px', alignItems:'center',
                  fontSize:'11px', color:C.green,
                }}>
                  <CheckCircle2 size={13} /> Produk berhasil dianalisis — form terisi otomatis
                </div>
              )}
            </Card>
          )}

          {/* Product info */}
          <Card title="Info Produk" icon="📦">
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <Field label="Nama Produk" value={productName} onChange={setProductName}
                placeholder="Contoh: Serum Vitamin C 30ml" required />
              <Field label="Harga" value={productPrice} onChange={setProductPrice}
                placeholder="Contoh: Rp 89.000"
                hint="Digunakan di hook dan CTA" />
              <Field label="Target Market" value={targetMarket} onChange={setTargetMarket}
                placeholder="Contoh: Wanita 20-35 tahun, kulit bermasalah" />
              <Field label="Benefit Utama" value={mainBenefit} onChange={setMainBenefit}
                placeholder="Contoh: Kulit glowing dalam 7 hari" />
              <Field label="Pain Point" value={painPoint} onChange={setPainPoint}
                placeholder="Contoh: Kulit kusam, susah glowing, mahal" />
              <Field label="Social Proof" value={socialProof} onChange={setSocialProof}
                placeholder="Contoh: 4.9 bintang · 10.000+ terjual" />
              <Field label="Kode Affiliate (opsional)" value={affiliateCode} onChange={setAffiliateCode}
                placeholder="Contoh: NAMA10"
                hint="Untuk script tipe Affiliate — disertakan di CTA" />
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>
                  Niche / Kategori Produk
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {NICHES.map(n => (
                    <Pill
                      key={n.id}
                      label={`${n.icon} ${n.label}`}
                      selected={niche === n.id}
                      onClick={() => setNiche(n.id)}
                      color={C.purple}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ════ Konfigurasi Script — REDESIGN PREMIUM (stacked) ════ */}
          <Card title="Konfigurasi Script" icon="⚙️">
            <div style={{ display:'flex', flexDirection:'column', gap:'22px' }}>

              {/* ── 1. Jenis Script (Premium Horizontal Slider) ── */}
              <div style={{ width: '100%', minWidth: 0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <label style={{ fontSize:'11px', fontWeight:800, color:C.inkSub, textTransform:'uppercase', letterSpacing:'0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Jenis Script 
                    <span style={{ textTransform: 'none', color: C.inkDim, fontWeight: 600, fontSize: '10px' }}>(Geser / Scroll ➔)</span>
                  </label>
                  <span style={{
                    fontSize:'10px', fontWeight:700, color:C.honeyDk,
                    background:C.honeyXlt, padding:'2px 8px', borderRadius:'5px',
                    border:`1px solid ${C.honey}25`,
                  }}>
                    ⚡ Didukung AI
                  </span>
                </div>
                
                {/* FIX: Custom CSS untuk Scrollbar Elegan & Fungsional di PC */}
                <style>{`
                  .script-slider {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    padding-bottom: 12px; /* Ruang untuk shadow & scrollbar */
                    width: 100%;
                    scroll-behavior: smooth;
                    scroll-snap-type: x mandatory;
                  }
                  /* Scrollbar Tipis Premium */
                  .script-slider::-webkit-scrollbar {
                    height: 6px;
                  }
                  .script-slider::-webkit-scrollbar-track {
                    background: #F0E6D2; /* C.border */
                    border-radius: 8px;
                  }
                  .script-slider::-webkit-scrollbar-thumb {
                    background: #F59E0B; /* C.honey */
                    border-radius: 8px;
                  }
                  .script-slider::-webkit-scrollbar-thumb:hover {
                    background: #D97706; /* C.honeyDk */
                  }
                `}</style>

                {/* Container Slider */}
                <div className="script-slider">
                  {SCRIPT_VARIANTS.map(v => {
                    const sel = variantId === v.id
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        style={{
                          flex: '0 0 250px', // FIX: Lebar dikunci di 250px agar tidak mengecil (shrink)
                          scrollSnapAlign: 'start',
                          display:'flex', gap:'10px', alignItems:'flex-start',
                          padding:'14px', borderRadius:'14px',
                          border:`1.5px solid ${sel ? C.honey : C.border}`,
                          background:sel ? C.honeyXlt : C.white,
                          cursor:'pointer', textAlign:'left',
                          transition:'all .25s cubic-bezier(.4,0,.2,1)', fontFamily:'inherit',
                          boxShadow:sel ? `0 6px 16px ${C.honey}18` : '0 2px 4px rgba(0,0,0,.02)',
                        }}
                        onMouseEnter={e => { 
                          if (!sel) {
                            (e.currentTarget as HTMLElement).style.borderColor = C.borderHi;
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={e => { 
                          if (!sel) {
                            (e.currentTarget as HTMLElement).style.borderColor = C.border;
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {/* Radio indicator */}
                        <div style={{
                          width:'16px', height:'16px', borderRadius:'50%', flexShrink:0, marginTop:'2px',
                          border:`2px solid ${sel ? C.honey : C.borderHi}`, background:C.white,
                          display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s',
                        }}>
                          {sel && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:C.honey }} />}
                        </div>
                        
                        {/* Konten teks */}
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px', flexWrap:'wrap' }}>
                            <span style={{ fontSize:'13px', fontWeight:800, color:sel ? C.honeyDk : C.ink }}>
                              {v.label}
                            </span>
                            {v.badge && (
                              <span style={{
                                fontSize:'9px', fontWeight:800, padding:'2px 6px',
                                borderRadius:'4px', background:C.honey, color:'#fff',
                              }}>
                                {v.badge}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize:'11px', color:C.inkMuted, lineHeight:1.5 }}>
                            {v.desc}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── 2. Platform (segmented control) ── */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:800, color:C.inkSub, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:'10px' }}>
                  Platform Target
                </label>
                <div style={{ display:'flex', background:C.bgAlt, padding:'4px', borderRadius:'11px', gap:'4px', border:`1px solid ${C.border}` }}>
                  {PLATFORMS.map(p => {
                    const sel = platform === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        style={{
                          flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
                          padding:'10px', borderRadius:'8px', border:'none',
                          background:sel ? C.white : 'transparent',
                          color:sel ? C.ink : C.inkMuted,
                          fontSize:'12px', fontWeight:sel ? 800 : 600,
                          cursor:'pointer', fontFamily:'inherit', transition:'all .2s',
                          boxShadow:sel ? '0 2px 6px rgba(120,80,10,.10)' : 'none',
                        }}
                      >
                        <span style={{ fontSize:'14px' }}>{p.icon}</span> {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── 3. Durasi (stepped slider presisi) ── */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'16px' }}>
                  <label style={{ fontSize:'11px', fontWeight:800, color:C.inkSub, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    Durasi Video
                  </label>
                  <div style={{ fontSize:'16px', fontWeight:900, color:C.honeyDk, fontFamily:'ui-monospace,Menlo,monospace' }}>
                    {duration}<span style={{ fontSize:'12px', color:C.inkMuted, fontWeight:700 }}> detik</span>
                  </div>
                </div>

                <div style={{ position:'relative', height:'24px', display:'flex', alignItems:'center', padding:'0 10px' }}>
                  {/* track dasar */}
                  <div style={{ position:'absolute', left:'16px', right:'16px', height:'4px', background:C.border, borderRadius:'2px', zIndex:1 }} />
                  {/* track aktif */}
                  {(() => {
                    const idx = DURATION_OPTIONS.findIndex(d => d.value === duration)
                    const pct = idx === -1 ? 0 : (idx / (DURATION_OPTIONS.length - 1)) * 100
                    return (
                      <div style={{
                        position:'absolute', left:'16px',
                        width:`calc(${pct}% - ${pct === 100 ? 32 : 16}px)`,
                        height:'4px', background:C.honey, borderRadius:'2px', zIndex:2,
                        transition:'width .3s cubic-bezier(.4,0,.2,1)',
                      }} />
                    )
                  })()}
                  {/* node */}
                  <div style={{ display:'flex', justifyContent:'space-between', width:'100%', position:'relative', zIndex:3 }}>
                    {DURATION_OPTIONS.map(d => {
                      const sel = duration === d.value
                      return (
                        <div
                          key={d.value}
                          onClick={() => setDuration(d.value)}
                          style={{ display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer' }}
                        >
                          <div style={{
                            width:sel ? '18px' : '12px', height:sel ? '18px' : '12px', borderRadius:'50%',
                            background:sel ? C.white : C.borderHi,
                            border:`3px solid ${sel ? C.honey : C.cream}`,
                            transition:'all .2s', boxShadow:sel ? `0 0 0 4px ${C.honey}22` : 'none',
                          }} />
                          <div style={{
                            position:'absolute', top:'26px', fontSize:'10px',
                            fontWeight:sel ? 800 : 600, color:sel ? C.ink : C.inkMuted,
                            whiteSpace:'nowrap', transition:'all .2s',
                          }}>
                            {d.label}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{ height:'18px' }} />{/* spacer label */}
              </div>

              {/* divider */}
              <div style={{ borderTop:`1px dashed ${C.border}` }} />

              {/* ── 4. Bahasa (segmented toggle premium) ── */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:800, color:C.inkSub, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'12px' }}>
                  🌐 Bahasa Output
                </label>
                <div style={{ display:'inline-flex', background:C.bgAlt, padding:'4px', borderRadius:'12px', gap:'4px', border:`1px solid ${C.border}` }}>
                  {(['indonesia', 'english'] as const).map(l => {
                    const sel = language === l
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLanguage(l)}
                        style={{
                          padding:'9px 26px', borderRadius:'8px', border:'none',
                          background:sel ? C.white : 'transparent',
                          color:sel ? C.ink : C.inkMuted,
                          fontSize:'12px', fontWeight:sel ? 800 : 600,
                          cursor:'pointer', fontFamily:'inherit',
                          transition:'all .25s cubic-bezier(.4,0,.2,1)',
                          boxShadow:sel ? '0 2px 8px rgba(120,80,10,.10), 0 1px 2px rgba(0,0,0,.04)' : 'none',
                          display:'flex', alignItems:'center', gap:'7px',
                        }}
                      >
                        <span style={{ fontSize:'15px' }}>{l === 'indonesia' ? '🇮🇩' : '🇺🇸'}</span>
                        {l === 'indonesia' ? 'Indonesia' : 'English'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── 5. Tone (high-contrast pills, wrap rapi) ── */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:800, color:C.inkSub, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'12px' }}>
                  🎭 Gaya Penyampaian (Tone)
                </label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {TONES.map(t => {
                    const sel = tone === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        style={{
                          padding:'8px 16px', borderRadius:'99px',
                          border:`1.5px solid ${sel ? C.bee : C.border}`,
                          background:sel ? C.bee : C.white,
                          color:sel ? C.white : C.inkSub,
                          fontSize:'12px', fontWeight:sel ? 700 : 600,
                          cursor:'pointer', fontFamily:'inherit',
                          transition:'all .2s cubic-bezier(.4,0,.2,1)',
                          display:'flex', alignItems:'center', gap:'6px',
                          boxShadow:sel ? '0 4px 12px rgba(28,25,23,.18)' : '0 1px 2px rgba(0,0,0,.02)',
                        }}
                        onMouseEnter={e => { if (!sel)(e.currentTarget as HTMLElement).style.borderColor = C.borderHi }}
                        onMouseLeave={e => { if (!sel)(e.currentTarget as HTMLElement).style.borderColor = C.border }}
                      >
                        {sel && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:C.honey }} />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>
          </Card>

          {/* Error banner */}
          {error && (
            <div style={{
              padding:'11px 13px', borderRadius:'10px',
              background:C.redLt, border:`1px solid ${C.red}30`,
              display:'flex', gap:'8px', alignItems:'flex-start',
              fontSize:'12px', color:'#B91C1C',
            }}>
              <AlertCircle size={14} style={{ flexShrink:0, marginTop:'1px' }} />
              {error}
            </div>
          )}

          {/* Generate buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <button
              type="button"
              onClick={() => generate()}
              disabled={!canGenerate}
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                padding:'13px', borderRadius:'11px', border:'none',
                background:canGenerate
                  ? `linear-gradient(135deg,${C.honey},${C.honeyDp})`
                  : C.inkDim,
                color:'#fff', fontSize:'14px', fontWeight:800,
                cursor:canGenerate ? 'pointer' : 'not-allowed',
                opacity:canGenerate ? 1 : 0.45,
                boxShadow:canGenerate ? C.sa : 'none',
                fontFamily:'inherit', transition:'all .18s',
              }}
              onMouseEnter={e => { if (canGenerate)(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              {generating ? (
                <>
                  <Loader2 size={16} style={{ animation:'spin .8s linear infinite' }} />
                  Generating {selectedVariant?.label}... {genSeconds}s
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate {selectedVariant?.label ?? 'Script'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={generateAllVariants}
              disabled={!productName.trim() || genVariants || generating}
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                padding:'11px', borderRadius:'11px',
                border:`1.5px solid ${C.honey}`,
                background:C.surface, color:C.honeyDk,
                fontSize:'13px', fontWeight:700,
                cursor:productName.trim() && !genVariants && !generating ? 'pointer' : 'not-allowed',
                opacity:!productName.trim() || genVariants || generating ? 0.5 : 1,
                fontFamily:'inherit', transition:'all .18s',
              }}
            >
              {genVariants ? (
                <>
                  <Loader2 size={14} style={{ animation:'spin .8s linear infinite' }} />
                  Generate Semua 12... {genSeconds}s
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Generate Semua 12 Jenis Sekaligus
                </>
              )}
            </button>

            {!productName.trim() && (
              <div style={{ fontSize:'10px', color:C.inkMuted, textAlign:'center' }}>
                Isi nama produk dulu untuk mulai generate
              </div>
            )}
          </div>
        </div>

        {/* ════ RIGHT — Output ════ */}
        <div>

          {/* ── Empty state ─────────────────────────────── */}
          {!result && !allVariants && !generating && !genVariants && (
            <div style={{
              borderRadius:'16px', border:`1.5px dashed ${C.borderHi}`,
              background:C.surface, backgroundImage:`url("${COMB}")`,
              padding:'52px 24px',
              display:'flex', flexDirection:'column', alignItems:'center',
              gap:'16px', textAlign:'center',
            }}>
              <div style={{
                width:'72px', height:'72px', borderRadius:'22px',
                background:`linear-gradient(135deg,${C.honey},${C.honeyDp})`,
                display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'34px', boxShadow:C.sa,
              }}>
                🐝
              </div>
              <div style={{ fontSize:'17px', fontWeight:800, color:C.ink }}>
                TikTok Reels AI Siap Bekerja 🍯
              </div>
              <div style={{ fontSize:'13px', color:C.inkMuted, maxWidth:'360px', lineHeight:1.7 }}>
                Isi info produk di kiri → pilih jenis script → klik Generate.<br />
                Atau klik <strong>&ldquo;Generate Semua 12 Jenis&rdquo;</strong> untuk semua variasi sekaligus.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', width:'100%', maxWidth:'460px', marginTop:'8px' }}>
                {[
                  { icon:'🎣', label:'6 Viral Hooks',    desc:'A/B/C testing ready' },
                  { icon:'📝', label:'Full Script',       desc:'Hook → CTA siap baca' },
                  { icon:'🎬', label:'Visual Sequence',  desc:'5 scene shot list' },
                  { icon:'💬', label:'Auto Caption',     desc:'TikTok/Reels/Shorts' },
                  { icon:'#️⃣',label:'Hashtag Set',      desc:'Trending + niche + produk' },
                  { icon:'🚀', label:'Publish Ready',    desc:'Payload TikTok API' },
                ].map((f, i) => (
                  <div key={i} style={{
                    padding:'10px 8px', borderRadius:'10px',
                    background:C.honeyXlt, border:`1px solid ${C.border}`, textAlign:'center',
                  }}>
                    <div style={{ fontSize:'18px', marginBottom:'4px' }}>{f.icon}</div>
                    <div style={{ fontSize:'11px', fontWeight:700, color:C.ink, marginBottom:'2px' }}>{f.label}</div>
                    <div style={{ fontSize:'9px', color:C.inkMuted }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading ──────────────────────────────────── */}
          {(generating || genVariants) && (
            <div style={{
              borderRadius:'16px', background:C.surface,
              border:`1px solid ${C.border}`, padding:'52px 24px',
              display:'flex', flexDirection:'column', alignItems:'center',
              gap:'18px', boxShadow:C.sh,
            }}>
              <div style={{ position:'relative', width:'70px', height:'70px' }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid ${C.honey}25` }} />
                <div style={{
                  position:'absolute', inset:0, borderRadius:'50%',
                  border:`3px solid transparent`, borderTopColor:C.honey,
                  animation:'spin .9s linear infinite',
                }} />
                <div style={{ position:'absolute', inset:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>
                  🐝
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:C.ink, marginBottom:'6px' }}>
                  {genVariants
                    ? 'Generating 12 variasi script sekaligus...'
                    : `Generating ${selectedVariant?.label ?? 'script'}...`}
                </div>
                <div style={{ fontSize:'12px', color:C.inkMuted }}>
                  {genSeconds}s · Claude AI sedang menulis
                </div>
              </div>
              <ProgressSteps seconds={genSeconds} />
            </div>
          )}

          {/* ── Single result ─────────────────────────────── */}
          {result && !generating && (
            <div>
              {/* Tab bar */}
              <div style={{
                display:'flex', gap:'5px', background:C.honeyXlt,
                borderRadius:'10px', padding:'3px',
                border:`1px solid ${C.border}`, marginBottom:'16px', flexWrap:'wrap',
              }}>
                {OUTPUT_TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveOutput(tab.id)}
                    style={{
                      flex:1, minWidth:'80px', padding:'7px 10px', borderRadius:'7px',
                      border:'none',
                      background:activeOutput === tab.id ? C.surface : 'transparent',
                      fontSize:'11px', fontWeight:activeOutput === tab.id ? 700 : 500,
                      color:activeOutput === tab.id ? C.ink : C.inkMuted,
                      cursor:'pointer',
                      boxShadow:activeOutput === tab.id ? C.sh : 'none',
                      transition:'all .15s', fontFamily:'inherit', whiteSpace:'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => generate()}
                  style={{
                    padding:'7px 10px', borderRadius:'7px',
                    border:`1px solid ${C.border}`, background:C.surface,
                    fontSize:'11px', color:C.inkMuted, cursor:'pointer',
                    fontFamily:'inherit', display:'flex', alignItems:'center', gap:'4px',
                  }}
                >
                  <RefreshCw size={11} /> Ulang
                </button>
              </div>

              {/* ── Script tab ──────────────────────────── */}
              {activeOutput === 'script' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {/* Hook */}
                  <Card title="🎣 Hook (3 Detik Pertama)" badge="Stop the Scroll" color={C.red}>
                    <div style={{
                      fontSize:'15px', fontWeight:700, color:C.ink,
                      lineHeight:1.6, marginBottom:'10px', fontStyle:'italic',
                    }}>
                      &ldquo;{result.script.hook || 'Hook muncul di sini...'}&rdquo;
                    </div>
                    <CopyBtn text={result.script.hook} />
                  </Card>

                  {/* Full script */}
                  <Card title="📝 Full Script" badge={`${duration}s · ${selectedVariant?.label ?? ''}`} color={C.honey}>
                    <div style={{
                      fontSize:'13px', color:C.inkSub, lineHeight:1.8,
                      whiteSpace:'pre-wrap', marginBottom:'12px',
                      maxHeight:'320px', overflowY:'auto',
                      padding:'10px', borderRadius:'8px',
                      background:C.honeyXlt, border:`1px solid ${C.border}`,
                    }}>
                      {result.script.fullScript || 'Script muncul di sini...'}
                    </div>
                    <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', alignItems:'center' }}>
                      <CopyBtn text={result.script.fullScript} />
                      <div style={{ fontSize:'11px', color:C.inkDim, display:'flex', alignItems:'center', gap:'4px' }}>
                        <FileText size={11} />
                        ~{Math.round((result.script.fullScript?.split(' ').length ?? 0) / 2.5)}s baca
                        &nbsp;·&nbsp;
                        {result.script.fullScript?.split(' ').length ?? 0} kata
                      </div>
                    </div>
                  </Card>

                  {/* Structure */}
                  <Card title="📋 Struktur Script" icon="📋">
                    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                      {selectedVariant?.structure.map((step, i) => (
                        <div key={i} style={{
                          display:'flex', gap:'9px', alignItems:'center',
                          padding:'7px 10px', borderRadius:'8px',
                          background:C.honeyXlt, border:`1px solid ${C.border}`,
                        }}>
                          <div style={{
                            width:'22px', height:'22px', borderRadius:'6px',
                            background:`${C.honey}20`, display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:'10px', fontWeight:800,
                            color:C.honeyDk, flexShrink:0,
                          }}>
                            {i + 1}
                          </div>
                          <span style={{ fontSize:'12px', color:C.inkSub }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* CTA */}
                  <Card title="🎯 CTA (Call to Action)" badge={selectedPlatform.label} color={C.green}>
                    <div style={{
                      fontSize:'13px', color:C.ink, lineHeight:1.7,
                      marginBottom:'10px', padding:'10px',
                      background:C.greenLt, borderRadius:'8px',
                      border:`1px solid ${C.green}25`,
                    }}>
                      {result.script.cta || 'CTA muncul di sini...'}
                    </div>
                    <CopyBtn text={result.script.cta} />
                  </Card>
                </div>
              )}

              {/* ── Hooks A/B/C tab ─────────────────────── */}
              {activeOutput === 'hooks' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div style={{
                    padding:'12px 14px', borderRadius:'11px',
                    background:C.honeyXlt, border:`1px solid ${C.honey}30`,
                    fontSize:'12px', color:C.honeyDk, lineHeight:1.6,
                  }}>
                    🔬 3 variasi hook untuk A/B testing. Posting 3 video berbeda dengan hook yang berbeda untuk lihat mana yang paling viral.
                  </div>
                  {hookVersions.map((hook, i) => (
                    <HookCard
                      key={i}
                      hook={hook}
                      label={(['Curiosity gap', 'Social proof', 'Price anchor'] as string[])[i] ?? 'Variant'}
                      version={(['A', 'B', 'C'] as string[])[i] ?? String(i + 1)}
                      color={([C.honey, C.purple, C.blue] as string[])[i] ?? C.honey}
                    />
                  ))}
                  {result.hooks.length > 3 && result.hooks.slice(3).map((hook, i) => (
                    <div key={`extra-${i}`} style={{
                      padding:'11px 13px', borderRadius:'10px',
                      border:`1px solid ${C.border}`, background:C.surface,
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, color:C.inkDim, textTransform:'uppercase' }}>
                          Hook #{i + 4}
                        </span>
                        <CopyBtn text={hook} small />
                      </div>
                      <div style={{ fontSize:'13px', color:C.ink, fontStyle:'italic' }}>&ldquo;{hook}&rdquo;</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Visual sequence tab ──────────────────── */}
              {activeOutput === 'visual' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div style={{
                    padding:'12px 14px', borderRadius:'11px',
                    background:C.purpleLt, border:`1px solid ${C.purple}25`,
                    fontSize:'12px', color:C.purple, lineHeight:1.6,
                  }}>
                    🎬 Shot list untuk video kamu. Setiap scene = satu klip/cut dalam video.
                  </div>
                  <Card title="Visual Sequence" icon="🎬" badge={selectedVariant?.label} color={C.purple}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {(VISUAL_SEQUENCES[variantId] ?? []).map((scene, i) => (
                        <SceneCard key={i} scene={scene} idx={i + 1} />
                      ))}
                    </div>
                  </Card>
                  {result.script.visualNotes && (
                    <Card title="Notes dari AI" icon="💡">
                      <div style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                        {result.script.visualNotes}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* ── Caption tab ──────────────────────────── */}
              {activeOutput === 'caption' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div style={{
                    padding:'12px 14px', borderRadius:'11px',
                    background:C.honeyXlt, border:`1px solid ${C.honey}30`,
                    fontSize:'12px', color:C.honeyDk,
                  }}>
                    💬 Caption yang dioptimalkan per platform. Klik salin, paste langsung saat upload.
                  </div>
                  {PLATFORMS.map(plat => (
                    <Card
                      key={plat.id}
                      title={`${plat.icon} ${plat.label}`}
                      badge={`Max ${plat.hashtagLimit} hashtag`}
                      color={C.honey}
                    >
                      <div style={{
                        fontSize:'13px', color:C.ink, lineHeight:1.7,
                        marginBottom:'10px', padding:'10px', background:C.honeyXlt,
                        borderRadius:'8px', border:`1px solid ${C.border}`,
                        whiteSpace:'pre-wrap', maxHeight:'200px', overflowY:'auto',
                      }}>
                        {captionFor(plat) || '—'}
                      </div>
                      <CopyBtn text={captionFor(plat)} />
                    </Card>
                  ))}
                </div>
              )}

              {/* ── Hashtag tab ──────────────────────────── */}
              {activeOutput === 'hashtag' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {/* Strategi hashtag dari presets */}
                  <div style={{
                    padding:'12px 14px', borderRadius:'11px',
                    background:C.blueLt, border:`1px solid ${C.blue}25`,
                    fontSize:'12px', color:C.blue, lineHeight:1.6,
                  }}>
                    🧮 Formula rekomendasi: <strong>{HASHTAG_STRATEGY.formula}</strong>. Hindari spam — TikTok lebih suka 3-8 hashtag relevan.
                  </div>

                  <Card title="Semua Hashtag" icon="#️⃣" badge={selectedPlatform.label} color={C.blue}>
                    <div style={{ marginBottom:'10px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {allHashtags
                        .slice(0, selectedPlatform.hashtagLimit)
                        .map((tag, i) => <HashChip key={i} tag={tag} color={C.blue} />)}
                    </div>
                    <CopyBtn
                      text={allHashtags.slice(0, selectedPlatform.hashtagLimit).join(' ')}
                    />
                    <div style={{ marginTop:'7px', fontSize:'10px', color:C.inkDim }}>
                      Limit {selectedPlatform.label}: {selectedPlatform.hashtagLimit} hashtag
                    </div>
                  </Card>

                  {([
                    { label:'🔥 Trending', key:'trending' as const, color:C.red,    desc:'Hashtag viral saat ini' },
                    { label:'🎯 Niche',    key:'niche'    as const, color:C.purple, desc:'Spesifik kategori produkmu' },
                    { label:'🌐 General',  key:'general'  as const, color:C.blue,   desc:'Jangkauan luas' },
                    { label:'📦 Produk',   key:'product'  as const, color:C.honey,  desc:'Spesifik produk' },
                  ]).map(cat => (
                    <Card key={cat.key} title={cat.label} badge={cat.desc} color={cat.color}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'8px' }}>
                        {result.hashtags[cat.key].map((tag, i) => (
                          <HashChip key={i} tag={tag} color={cat.color} />
                        ))}
                      </div>
                      <CopyBtn text={result.hashtags[cat.key].join(' ')} />
                    </Card>
                  ))}
                </div>
              )}

              {/* ── Publish tab (TikTok API ready) ───────── */}
              {activeOutput === 'publish' && publishPayload && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div style={{
                    padding:'12px 14px', borderRadius:'11px',
                    background:C.honeyXlt, border:`1px solid ${C.honey}30`,
                    fontSize:'12px', color:C.honeyDk, lineHeight:1.6,
                    display:'flex', gap:'8px', alignItems:'flex-start',
                  }}>
                    <Send size={15} style={{ flexShrink:0, marginTop:'1px' }} />
                    <span>
                      Metadata siap-publish ke <strong>{selectedPlatform.label}</strong>. Saat ini menghasilkan
                      payload untuk Content Posting API — auto-posting butuh koneksi akun (OAuth) di langkah berikutnya.
                    </span>
                  </div>

                  {/* Pilih preset posting */}
                  <Card title="Pengaturan Posting" icon="⚙️">
                    <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                      {TIKTOK_POST_PRESETS.map(p => {
                        const sel = postPresetId === p.id
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPostPresetId(p.id)}
                            style={{
                              display:'flex', gap:'10px', alignItems:'flex-start', textAlign:'left',
                              padding:'10px 12px', borderRadius:'10px',
                              border:`1.5px solid ${sel ? C.honey : C.border}`,
                              background:sel ? C.honeyXlt : C.surface,
                              cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                              boxShadow:sel ? C.sa : 'none',
                            }}
                          >
                            <span style={{ fontSize:'18px', flexShrink:0 }}>{p.icon}</span>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:'12px', fontWeight:700, color:sel ? C.honeyDk : C.ink, marginBottom:'2px' }}>
                                {p.label}
                              </div>
                              <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.4 }}>
                                {p.desc}
                              </div>
                            </div>
                            {sel && <CheckCircle2 size={15} color={C.honey} style={{ flexShrink:0, marginLeft:'auto' }} />}
                          </button>
                        )
                      })}
                    </div>
                    {/* Ringkasan privacy */}
                    <div style={{
                      marginTop:'10px', display:'flex', gap:'8px', flexWrap:'wrap',
                      fontSize:'10px', color:C.inkSub,
                    }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 8px', borderRadius:'99px', background:C.honeyXlt, border:`1px solid ${C.border}` }}>
                        {selectedPreset.privacyLevel === 'SELF_ONLY'
                          ? <><Lock size={10} /> Privat</>
                          : <><Globe size={10} /> {selectedPreset.privacyLevel.replace(/_/g, ' ').toLowerCase()}</>}
                      </span>
                      {selectedPreset.brandedContent && (
                        <span style={{ padding:'4px 8px', borderRadius:'99px', background:C.purpleLt, color:C.purple, border:`1px solid ${C.purple}25` }}>
                          Paid partnership
                        </span>
                      )}
                      {selectedPreset.brandOrganic && (
                        <span style={{ padding:'4px 8px', borderRadius:'99px', background:C.greenLt, color:C.green, border:`1px solid ${C.green}25` }}>
                          Brand sendiri
                        </span>
                      )}
                    </div>
                  </Card>

                  {/* Saran trending sound */}
                  <Card title="Saran Trending Sound" icon="🎵" color={C.purple}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                      {soundList.map(s => (
                        <div key={s.id} style={{
                          display:'flex', gap:'9px', alignItems:'flex-start',
                          padding:'9px 11px', borderRadius:'9px',
                          background:C.purpleLt, border:`1px solid ${C.purple}20`,
                        }}>
                          <Music size={14} color={C.purple} style={{ flexShrink:0, marginTop:'2px' }} />
                          <div>
                            <div style={{ fontSize:'12px', fontWeight:700, color:C.ink }}>
                              {s.icon} {s.label}
                            </div>
                            <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.5, marginTop:'2px' }}>
                              {s.tip}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:'8px', fontSize:'10px', color:C.inkDim, lineHeight:1.5 }}>
                      Data sound viral real-time bisa ditarik dari TikTok Creative Center / Display API saat akun terkoneksi.
                    </div>
                  </Card>

                  {/* Caption final (title API) */}
                  <Card title="Caption / Title (API)" icon="💬" color={C.honey}>
                    <div style={{
                      fontSize:'13px', color:C.ink, lineHeight:1.7,
                      marginBottom:'10px', padding:'10px', background:C.honeyXlt,
                      borderRadius:'8px', border:`1px solid ${C.border}`,
                      whiteSpace:'pre-wrap', maxHeight:'180px', overflowY:'auto',
                    }}>
                      {publishPayload.post_info.title}
                    </div>
                    <CopyBtn text={publishPayload.post_info.title} />
                  </Card>

                  {/* Payload JSON */}
                  <Card title="Payload TikTok Content Posting API" icon="🧩" badge="JSON" color={C.bee}>
                    <pre style={{
                      margin:0, fontSize:'11px', color:C.inkSub, lineHeight:1.6,
                      whiteSpace:'pre-wrap', wordBreak:'break-word',
                      padding:'11px', borderRadius:'8px',
                      background:C.honeyXlt, border:`1px solid ${C.border}`,
                      maxHeight:'280px', overflowY:'auto', fontFamily:'ui-monospace,Menlo,monospace',
                    }}>
                      {JSON.stringify(publishPayload, null, 2)}
                    </pre>
                    <div style={{ marginTop:'10px', display:'flex', gap:'7px', flexWrap:'wrap', alignItems:'center' }}>
                      <CopyBtn text={JSON.stringify(publishPayload, null, 2)} />
                      <span style={{ fontSize:'10px', color:C.inkDim, lineHeight:1.5 }}>
                        Kirim payload ini ke route <code>/api/studio/video/tiktok/publish</code> (perlu dibuat) yang
                        meneruskan ke TikTok dengan access_token user.
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ── All 12 variants ───────────────────────────── */}
          {allVariants && !genVariants && (
            <div>
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:'16px', flexWrap:'wrap', gap:'10px',
              }}>
                <div>
                  <div style={{ fontSize:'16px', fontWeight:800, color:C.ink, marginBottom:'4px' }}>
                    ⚡ Semua 12 Script Sekaligus
                  </div>
                  <div style={{ fontSize:'12px', color:C.inkMuted }}>
                    Satu produk, 12 gaya script berbeda. Klik salin per variasi atau expand ke Full Script.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generateAllVariants}
                  style={{
                    display:'flex', alignItems:'center', gap:'5px',
                    padding:'7px 12px', borderRadius:'8px',
                    border:`1px solid ${C.border}`, background:C.surface,
                    fontSize:'12px', fontWeight:600, color:C.inkMuted,
                    cursor:'pointer', fontFamily:'inherit',
                  }}
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              <div
                style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}
                className="variants-grid"
              >
                {SCRIPT_VARIANTS.map(v => {
                  const scriptText = allVariants[v.id] ?? ''
                  return (
                    <div
                      key={v.id}
                      style={{
                        background:C.surface, borderRadius:'13px',
                        border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden',
                      }}
                    >
                      {/* Header */}
                      <div style={{
                        padding:'10px 13px', borderBottom:`1px solid ${C.border}`,
                        display:'flex', alignItems:'center', gap:'7px',
                      }}>
                        <span style={{ fontSize:'16px' }}>{v.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                            <span style={{ fontSize:'12px', fontWeight:700, color:C.ink }}>
                              {v.label}
                            </span>
                            {v.badge && (
                              <span style={{
                                fontSize:'8px', fontWeight:700, padding:'1px 4px',
                                borderRadius:'3px', background:C.honeyLt, color:C.honeyDk,
                              }}>
                                {v.badge}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize:'10px', color:C.inkMuted }}>
                            {v.idealDuration}s · CVR {v.cvr.toUpperCase()}
                          </div>
                        </div>
                        <CopyBtn text={scriptText} small />
                      </div>

                      {/* Script preview */}
                      <div style={{ padding:'11px 13px' }}>
                        {scriptText ? (
                          <div style={{
                            fontSize:'12px', color:C.inkSub, lineHeight:1.65,
                            maxHeight:'90px', overflowY:'auto',
                          }}>
                            {scriptText}
                          </div>
                        ) : (
                          <div style={{ fontSize:'11px', color:C.inkDim, fontStyle:'italic' }}>
                            Tidak ter-generate
                          </div>
                        )}
                      </div>

                      {/* Footer: expand to full */}
                      <div style={{
                        padding:'8px 13px', borderTop:`1px solid ${C.border}`,
                        display:'flex', gap:'6px',
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            setVariantId(v.id)
                            setAllVariants(null)
                            generate(v.id)
                          }}
                          style={{
                            flex:1, padding:'6px', borderRadius:'7px',
                            border:`1px solid ${C.honey}30`, background:C.honeyXlt,
                            color:C.honeyDk, fontSize:'10px', fontWeight:700,
                            cursor:'pointer', fontFamily:'inherit',
                          }}
                        >
                          Full Script →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Global styles ─────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes spin { to { transform:rotate(360deg) } }
        input::placeholder, textarea::placeholder { color:#A8A29E }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#E6D5AE; border-radius:2px }
        select { appearance:auto }
        code { background:#FEF3C7; padding:1px 5px; border-radius:4px; font-size:10px }
        .tiktok-layout  { grid-template-columns: 440px 1fr !important }
        .variants-grid  { grid-template-columns: repeat(2,1fr) !important }
        @media (max-width:1100px) {
          .tiktok-layout { grid-template-columns: 1fr !important }
        }
        @media (max-width:639px) {
          .variants-grid { grid-template-columns: 1fr !important }
        }
      `}</style>
    </div>
  )
}