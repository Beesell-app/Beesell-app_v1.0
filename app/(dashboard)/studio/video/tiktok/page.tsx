'use client'
// app/(dashboard)/studio/video/tiktok/page.tsx
// ══════════════════════════════════════════════════════════════
// TIKTOK REELS AI — Script + Hook + Caption + Hashtag Generator
// FIXES v2:
//   ✓ Removed all unused lucide imports
//   ✓ Fixed syntax error: color:C.amberDk' → color:C.amberDk
//   ✓ Removed unused cvrColors variable
//   ✓ Separated analyze timer from generate timer (analyzeSeconds)
//   ✓ Fixed stale closure: "Full Script →" button now sets state
//     and navigates to result view instead of calling generate()
//     directly (which would use stale variantId)
//   ✓ Fixed showVariants state (was set but never read → removed)
//   ✓ useEffect cleanup for timerRef on unmount
//   ✓ All JSX properly closed and balanced
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Sparkles, Loader2, Copy, Check, RefreshCw,
  AlertCircle, Hash, FileText, Zap, CheckCircle2,
} from 'lucide-react'
import {
  SCRIPT_VARIANTS,
  PLATFORMS,
  DURATION_OPTIONS,
  VISUAL_SEQUENCES,
  type ScriptVariantId,
  type PlatformId,
  type NicheId,
  type DurationSec,
} from '@/lib/studio/tiktok/presets'

// ── Design tokens ─────────────────────────────────────────────
const C = {
  amber:    '#F59E0B',
  amberDk:  '#D97706',
  amberLt:  '#FEF3C7',
  amberXlt: '#FFFBEB',
  white:    '#FFFFFF',
  bg:       '#F9FAFB',
  surface:  '#FFFFFF',
  border:   '#E5E7EB',
  borderHi: '#D1D5DB',
  ink:      '#111827',
  inkSub:   '#374151',
  inkMuted: '#6B7280',
  inkDim:   '#9CA3AF',
  green:    '#059669',
  greenLt:  '#ECFDF5',
  blue:     '#3B82F6',
  blueLt:   '#EFF6FF',
  purple:   '#7C3AED',
  purpleLt: '#F5F3FF',
  red:      '#EF4444',
  redLt:    '#FEF2F2',
  orange:   '#F97316',
  tiktok:   '#010101',
  sh:  '0 1px 3px rgba(0,0,0,.06)',
  sm:  '0 4px 16px rgba(0,0,0,.07)',
  sa:  '0 6px 20px rgba(245,158,11,.22)',
}

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
type OutputTab = 'script' | 'hooks' | 'visual' | 'caption' | 'hashtag'

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
  label, selected, onClick, color = C.amber, icon,
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
  children, title, icon, badge, color = C.amber, style,
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
  const onFocus  = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = C.amber
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
        "{hook}"
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
      background:C.bg, border:`1px solid ${C.border}`,
    }}>
      <div style={{
        width:'26px', height:'26px', borderRadius:'7px',
        background:`linear-gradient(135deg,${C.amber},${C.amberDk})`,
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
              <span style={{ color:C.border }}>→</span>
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
  const canGenerate      = !!productName.trim() && !generating && !genVariants
  const hookVersions     = result?.hooks.slice(0, 3) ?? []

  const OUTPUT_TABS: { id: OutputTab; label: string }[] = [
    { id:'script',  label:'📝 Script'       },
    { id:'hooks',   label:'🎣 Hooks A/B/C'  },
    { id:'visual',  label:'🎬 Visual'       },
    { id:'caption', label:'💬 Caption'      },
    { id:'hashtag', label:'#️⃣ Hashtag'     },
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

  // ════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* ── Top bar ─────────────────────────────────────── */}
      <div style={{
        background:C.surface, borderBottom:`1px solid ${C.border}`,
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
            width:'30px', height:'30px', borderRadius:'8px',
            background:C.tiktok, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px',
          }}>
            🎵
          </div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>TikTok Reels AI</div>
            <div style={{ fontSize:'10px', color:C.inkMuted }}>
              Script + Hook + Caption + Hashtag untuk TikTok, Reels & Shorts
            </div>
          </div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <div style={{
            padding:'3px 10px', borderRadius:'6px',
            background:C.amberLt, border:`1px solid ${C.amber}30`,
            fontSize:'11px', fontWeight:600, color:C.amberDk,
          }}>
            Pro+
          </div>
        </div>
      </div>

      {/* ── 2-panel layout ──────────────────────────────── */}
      <div
        style={{ maxWidth:'1320px', margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'400px 1fr', gap:'20px', alignItems:'flex-start' }}
        className="tiktok-layout"
      >

        {/* ════ LEFT — Input & Config ════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Input mode toggle */}
          <div style={{ display:'flex', gap:'5px', background:C.bg, borderRadius:'10px', padding:'3px', border:`1px solid ${C.border}` }}>
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
                  onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
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
                    background:`linear-gradient(135deg,${C.amber},${C.amberDk})`,
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

          {/* Script config */}
          <Card title="Konfigurasi Script" icon="⚙️">
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

              {/* Script type grid */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'8px' }}>
                  Jenis Script
                </label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                  {SCRIPT_VARIANTS.map(v => {
                    const sel = variantId === v.id
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        style={{
                          display:'flex', gap:'7px', alignItems:'flex-start',
                          padding:'9px 10px', borderRadius:'9px',
                          border:`1.5px solid ${sel ? C.amber : C.border}`,
                          background:sel ? C.amberXlt : C.surface,
                          cursor:'pointer', textAlign:'left',
                          transition:'all .15s', fontFamily:'inherit',
                          boxShadow:sel ? C.sa : 'none',
                        }}
                        onMouseEnter={e => { if (!sel)(e.currentTarget as HTMLElement).style.borderColor = C.amber }}
                        onMouseLeave={e => { if (!sel)(e.currentTarget as HTMLElement).style.borderColor = C.border }}
                      >
                        <span style={{ fontSize:'16px', flexShrink:0 }}>{v.icon}</span>
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'2px', flexWrap:'wrap' }}>
                            <span style={{ fontSize:'11px', fontWeight:700, color:sel ? C.amberDk : C.ink }}>
                              {v.label}
                            </span>
                            {v.badge && (
                              <span style={{
                                fontSize:'8px', fontWeight:700, padding:'1px 4px',
                                borderRadius:'3px', background:C.amberLt, color:C.amberDk,
                              }}>
                                {v.badge}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize:'9px', color:C.inkMuted, lineHeight:1.3 }}>
                            {v.desc.substring(0, 50)}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Platform */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>
                  Platform
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {PLATFORMS.map(p => (
                    <Pill
                      key={p.id}
                      label={`${p.icon} ${p.label}`}
                      selected={platform === p.id}
                      onClick={() => setPlatform(p.id)}
                      color={C.blue}
                    />
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>
                  Durasi
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {DURATION_OPTIONS.map(d => (
                    <Pill
                      key={d.value}
                      label={d.label}
                      selected={duration === d.value}
                      onClick={() => setDuration(d.value)}
                      icon={d.icon}
                    />
                  ))}
                </div>
              </div>

              {/* Language + Tone */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>
                    Bahasa
                  </label>
                  <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                    {(['indonesia', 'english'] as const).map(l => (
                      <Pill
                        key={l}
                        label={l === 'indonesia' ? '🇮🇩 Indo' : '🇺🇸 EN'}
                        selected={language === l}
                        onClick={() => setLanguage(l)}
                        color={C.green}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    style={{
                      width:'100%', padding:'7px 10px', borderRadius:'8px',
                      border:`1px solid ${C.border}`, fontSize:'12px',
                      color:C.ink, background:C.surface,
                      outline:'none', cursor:'pointer', fontFamily:'inherit',
                    }}
                  >
                    {TONES.map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
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
                  ? `linear-gradient(135deg,${C.amber},${C.amberDk})`
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
                border:`1.5px solid ${C.amber}`,
                background:C.surface, color:C.amberDk,
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
              borderRadius:'16px', border:`1.5px dashed ${C.border}`,
              background:C.surface, padding:'52px 24px',
              display:'flex', flexDirection:'column', alignItems:'center',
              gap:'16px', textAlign:'center',
            }}>
              <div style={{
                width:'72px', height:'72px', borderRadius:'20px',
                background:C.tiktok, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'32px',
              }}>
                🎵
              </div>
              <div style={{ fontSize:'17px', fontWeight:800, color:C.ink }}>
                TikTok Reels AI Siap
              </div>
              <div style={{ fontSize:'13px', color:C.inkMuted, maxWidth:'360px', lineHeight:1.7 }}>
                Isi info produk di kiri → pilih jenis script → klik Generate.<br />
                Atau klik <strong>"Generate Semua 12 Jenis"</strong> untuk semua variasi sekaligus.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', width:'100%', maxWidth:'460px', marginTop:'8px' }}>
                {[
                  { icon:'🎣', label:'6 Viral Hooks',    desc:'A/B/C testing ready' },
                  { icon:'📝', label:'Full Script',       desc:'Hook → CTA siap baca' },
                  { icon:'🎬', label:'Visual Sequence',  desc:'5 scene shot list' },
                  { icon:'💬', label:'Auto Caption',     desc:'TikTok/Reels/Shorts' },
                  { icon:'#️⃣',label:'Hashtag Set',      desc:'Trending + niche + produk' },
                  { icon:'⚡', label:'12 Variasi',       desc:'Semua jenis sekaligus' },
                ].map((f, i) => (
                  <div key={i} style={{
                    padding:'10px 8px', borderRadius:'10px',
                    background:C.bg, border:`1px solid ${C.border}`, textAlign:'center',
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
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid ${C.amber}25` }} />
                <div style={{
                  position:'absolute', inset:0, borderRadius:'50%',
                  border:`3px solid transparent`, borderTopColor:C.amber,
                  animation:'spin .9s linear infinite',
                }} />
                <div style={{ position:'absolute', inset:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>
                  🎵
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
                display:'flex', gap:'5px', background:C.bg,
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
                      "{result.script.hook || 'Hook muncul di sini...'}"
                    </div>
                    <CopyBtn text={result.script.hook} />
                  </Card>

                  {/* Full script */}
                  <Card title="📝 Full Script" badge={`${duration}s · ${selectedVariant?.label ?? ''}`} color={C.amber}>
                    <div style={{
                      fontSize:'13px', color:C.inkSub, lineHeight:1.8,
                      whiteSpace:'pre-wrap', marginBottom:'12px',
                      maxHeight:'320px', overflowY:'auto',
                      padding:'10px', borderRadius:'8px',
                      background:C.bg, border:`1px solid ${C.border}`,
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
                          background:C.bg, border:`1px solid ${C.border}`,
                        }}>
                          <div style={{
                            width:'22px', height:'22px', borderRadius:'6px',
                            background:`${C.amber}20`, display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:'10px', fontWeight:800,
                            color:C.amberDk, flexShrink:0,
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
                    background:C.amberXlt, border:`1px solid ${C.amber}30`,
                    fontSize:'12px', color:C.amberDk, lineHeight:1.6,
                  }}>
                    🔬 3 variasi hook untuk A/B testing. Posting 3 video berbeda dengan hook yang berbeda untuk lihat mana yang paling viral.
                  </div>
                  {hookVersions.map((hook, i) => (
                    <HookCard
                      key={i}
                      hook={hook}
                      label={(['Curiosity gap', 'Social proof', 'Price anchor'] as string[])[i] ?? 'Variant'}
                      version={(['A', 'B', 'C'] as string[])[i] ?? String(i + 1)}
                      color={([C.amber, C.purple, C.blue] as string[])[i] ?? C.amber}
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
                      <div style={{ fontSize:'13px', color:C.ink, fontStyle:'italic' }}>"{hook}"</div>
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
                    background:C.amberXlt, border:`1px solid ${C.amber}30`,
                    fontSize:'12px', color:C.amberDk,
                  }}>
                    💬 Caption yang dioptimalkan per platform. Klik salin, paste langsung saat upload.
                  </div>
                  {PLATFORMS.map(plat => (
                    <Card
                      key={plat.id}
                      title={`${plat.icon} ${plat.label}`}
                      badge={`Max ${plat.hashtagLimit} hashtag`}
                      color={C.amber}
                    >
                      <div style={{
                        fontSize:'13px', color:C.ink, lineHeight:1.7,
                        marginBottom:'10px', padding:'10px', background:C.bg,
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
                  <Card title="Semua Hashtag" icon="#️⃣" badge={selectedPlatform.label} color={C.blue}>
                    <div style={{ marginBottom:'10px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {[
                        ...result.hashtags.trending,
                        ...result.hashtags.niche,
                        ...result.hashtags.general,
                        ...result.hashtags.product,
                      ]
                        .slice(0, selectedPlatform.hashtagLimit)
                        .map((tag, i) => <HashChip key={i} tag={tag} color={C.blue} />)}
                    </div>
                    <CopyBtn
                      text={[
                        ...result.hashtags.trending,
                        ...result.hashtags.niche,
                        ...result.hashtags.general,
                        ...result.hashtags.product,
                      ]
                        .slice(0, selectedPlatform.hashtagLimit)
                        .join(' ')}
                    />
                    <div style={{ marginTop:'7px', fontSize:'10px', color:C.inkDim }}>
                      Limit {selectedPlatform.label}: {selectedPlatform.hashtagLimit} hashtag
                    </div>
                  </Card>

                  {([
                    { label:'🔥 Trending', key:'trending' as const, color:C.red,    desc:'Hashtag viral saat ini' },
                    { label:'🎯 Niche',    key:'niche'    as const, color:C.purple, desc:'Spesifik kategori produkmu' },
                    { label:'🌐 General',  key:'general'  as const, color:C.blue,   desc:'Jangkauan luas' },
                    { label:'📦 Produk',   key:'product'  as const, color:C.amber,  desc:'Spesifik produk' },
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
                                borderRadius:'3px', background:C.amberLt, color:C.amberDk,
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
                            // Switch to single-result view with this variant
                            setVariantId(v.id)
                            setAllVariants(null)
                            generate(v.id)
                          }}
                          style={{
                            flex:1, padding:'6px', borderRadius:'7px',
                            border:`1px solid ${C.amber}30`, background:C.amberXlt,
                            color:C.amberDk, fontSize:'10px', fontWeight:700,
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
        input::placeholder, textarea::placeholder { color:#9CA3AF }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
        select { appearance:auto }
        .tiktok-layout  { grid-template-columns: 400px 1fr !important }
        .variants-grid  { grid-template-columns: repeat(2,1fr) !important }
        @media (max-width:1023px) {
          .tiktok-layout { grid-template-columns: 1fr !important }
        }
        @media (max-width:639px) {
          .variants-grid { grid-template-columns: 1fr !important }
        }
      `}</style>
    </div>
  )
}