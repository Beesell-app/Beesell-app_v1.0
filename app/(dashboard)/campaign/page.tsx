'use client'
// app/(dashboard)/campaign/page.tsx
// ══════════════════════════════════════════════════════════════
// CAMPAIGN BUILDER AI — Full campaign structure generator
// Meta Ads · TikTok Ads · Google Display
// 4-step wizard · Light theme · Amber primary
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Sparkles, Loader2, Check,
  CheckCircle2, AlertCircle, Copy, RefreshCw, Download,
  Plus, X, ChevronDown, ChevronUp, Zap, Star, Target,
  TrendingUp, DollarSign, Users, Image, FileText,
  BarChart3, Eye, MousePointer, ShoppingBag, Brain,
} from 'lucide-react'
import {
  PLATFORMS, OBJECTIVES, CTA_OPTIONS, COPY_ANGLES,
  CREATIVE_FORMATS, BUDGET_PRESETS, NICHES_OPTIONS,
  fmtRp, fmtN, estimateReach,
  type PlatformId, type ObjectiveId,
  type AdCopyVariant, type CreativeVariant, type AdSet,
} from '@/lib/campaign/types'

// ── Design tokens ─────────────────────────────────────────────
const C = {
  amber:    '#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:    '#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:   '#E5E7EB', borderHi:'#D1D5DB',
  ink:      '#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:    '#059669', greenLt:'#ECFDF5',
  blue:     '#3B82F6', blueLt:'#EFF6FF',
  purple:   '#7C3AED', purpleLt:'#F5F3FF',
  red:      '#EF4444', redLt:'#FEF2F2',
  orange:   '#F97316', orangeLt:'#FFF7ED',
  meta:     '#1877F2', tiktok:'#010101', google:'#4285F4',
  sh:  '0 1px 3px rgba(0,0,0,.06)',
  sm:  '0 4px 16px rgba(0,0,0,.07)',
  sa:  '0 6px 20px rgba(245,158,11,.22)',
}

// ── Constants not in types.ts ─────────────────────────────────
const NICHES_OPTIONS = [
  { id:'fashion', l:'Fashion' }, { id:'beauty', l:'Beauty & Skincare' },
  { id:'food', l:'F&B' }, { id:'gadget', l:'Gadget' },
  { id:'health', l:'Kesehatan' }, { id:'home', l:'Home Decor' },
  { id:'baby', l:'Baby & Kids' }, { id:'general', l:'Umum' },
]

const AGE_RANGES  = ['18-24','25-34','35-44','45-54','55+']
const GENDERS     = [{ id:'all', l:'Semua' }, { id:'female', l:'Wanita' }, { id:'male', l:'Pria' }]
const LOCATIONS   = ['Jakarta','Bandung','Surabaya','Medan','Semarang','Bali','Yogyakarta','Seluruh Indonesia']
const INTERESTS_MAP: Record<string, string[]> = {
  fashion: ['Fashion & Style','Online Shopping','Beauty','Lifestyle','Instagram Shopping'],
  beauty:  ['Skincare','Beauty Products','Makeup','Health & Wellness','K-beauty'],
  food:    ['Food & Beverage','Culinary','Cooking','Snacks','Local Food'],
  gadget:  ['Technology','Gadgets','Electronics','Gaming','Mobile Phones'],
  health:  ['Health & Wellness','Fitness','Herbal','Supplement','Natural Health'],
  home:    ['Home Decor','Interior Design','DIY','Furniture','Lifestyle'],
  baby:    ['Parenting','Baby Products','Motherhood','Kids Fashion','Toys'],
  general: ['Shopping','Online Shopping','Deals','Lifestyle','Consumer Goods'],
}

// ── Steps ─────────────────────────────────────────────────────
const STEPS = [
  { id:1, label:'Produk',   icon:'📦' },
  { id:2, label:'Platform', icon:'📱' },
  { id:3, label:'Audience', icon:'👥' },
  { id:4, label:'Campaign', icon:'⚡' },
]

// ── Utility atoms ─────────────────────────────────────────────
function Pill({ label, selected, onClick, color=C.amber }: {
  label:string; selected:boolean; onClick:()=>void; color?:string
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'5px 12px', borderRadius:'99px', border:`1.5px solid ${selected?color:C.border}`, background:selected?`${color}12`:C.surface, color:selected?color:C.inkMuted, fontSize:'12px', fontWeight:selected?700:500, cursor:'pointer', transition:'all .12s', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:selected?`0 0 0 1px ${color}20`:'none' }}
      onMouseEnter={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=color }}
      onMouseLeave={e=>{ if(!selected)(e.currentTarget as HTMLElement).style.borderColor=C.border }}>
      {label}
    </button>
  )
}

function CopyBtn({ text, small }: { text:string; small?:boolean }) {
  const [cp, setCp] = useState(false)
  return (
    <button onClick={async()=>{ await navigator.clipboard.writeText(text); setCp(true); setTimeout(()=>setCp(false),2000) }}
      style={{ display:'flex', alignItems:'center', gap:'4px', padding:small?'3px 7px':'5px 10px', borderRadius:'7px', border:`1px solid ${cp?C.green:C.border}`, background:cp?C.greenLt:C.surface, color:cp?C.green:C.inkDim, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', flexShrink:0 }}>
      {cp ? <><Check size={11}/> OK</> : <><Copy size={11}/> Salin</>}
    </button>
  )
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:C.surface, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.sh, overflow:'hidden', ...style }}>{children}</div>
}

function SectionHead({ icon, title, sub, badge, color=C.amber }: { icon:string; title:string; sub?:string; badge?:string; color?:string }) {
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

function Field({ label, value, onChange, placeholder, textarea, rows=2, hint, required }: {
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string;
  textarea?:boolean; rows?:number; hint?:string; required?:boolean
}) {
  const base: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', color:C.ink, outline:'none', fontFamily:'inherit', transition:'border-color .15s', boxSizing:'border-box', background:C.white, resize:'vertical' }
  return (
    <div>
      <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', gap:'3px', marginBottom:'5px' }}>
        {label}{required && <span style={{ color:C.red }}>*</span>}
      </label>
      {textarea
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber} onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
        : <input    value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}       style={base} onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber} onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
      }
      {hint && <div style={{ fontSize:'10px', color:C.inkDim, marginTop:'4px', lineHeight:1.5 }}>{hint}</div>}
    </div>
  )
}

// ── Score bar ─────────────────────────────────────────────────
function ScoreBar({ score, label, color=C.amber }: { score:number; label:string; color?:string }) {
  return (
    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
      <div style={{ width:'44px', fontSize:'11px', fontWeight:700, color, flexShrink:0, textAlign:'right' }}>{score}</div>
      <div style={{ flex:1, height:'6px', background:`${C.border}`, borderRadius:'3px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${score}%`, background:`linear-gradient(90deg,${color}99,${color})`, borderRadius:'3px', transition:'width .6s ease' }}/>
      </div>
      <div style={{ fontSize:'10px', color:C.inkDim, width:'80px', flexShrink:0 }}>{label}</div>
    </div>
  )
}

// ── Copy card ─────────────────────────────────────────────────
function CopyCard({ v, rank }: { v: AdCopyVariant; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 0)
  const bgCol = rank === 0 ? C.amberXlt : C.surface
  const bdCol = rank === 0 ? `${C.amber}40` : C.border

  return (
    <div style={{ borderRadius:'13px', border:`1.5px solid ${bdCol}`, background:bgCol, overflow:'hidden', boxShadow:rank===0?C.sa:C.sh }}>
      <div onClick={() => setExpanded(p => !p)}
        style={{ padding:'12px 14px', display:'flex', gap:'10px', alignItems:'center', cursor:'pointer' }}>
        {rank === 0 && <span style={{ fontSize:'12px', fontWeight:800, padding:'2px 8px', borderRadius:'99px', background:C.amber, color:'#fff', flexShrink:0 }}>🏆 Best</span>}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
            <span style={{ fontSize:'12px', fontWeight:700, color:rank===0?C.amberDk:C.ink }}>{v.label}</span>
            <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'4px', background:`${C.blue}12`, color:C.blue, fontWeight:600 }}>{v.angle}</span>
          </div>
          <div style={{ fontSize:'12px', color:C.inkSub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {v.headline}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          {v.score && (
            <div style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'6px', background:`${C.green}15`, color:C.green }}>{v.score}/100</div>
          )}
          {expanded ? <ChevronUp size={14} color={C.inkMuted}/> : <ChevronDown size={14} color={C.inkMuted}/>}
        </div>
      </div>

      {expanded && (
        <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${C.border}`, background:C.surface }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', paddingTop:'12px' }}>
            {[
              { label:'Headline', val:v.headline,    limit:'40 karakter',  color:C.purple },
              { label:'Primary Text', val:v.primaryText, limit:'125 karakter', color:C.blue },
              ...(v.description ? [{ label:'Description', val:v.description, limit:'30 karakter', color:C.teal ?? C.green }] : []),
            ].map(f => (
              <div key={f.label} style={{ padding:'10px 12px', borderRadius:'10px', background:C.bg, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
                  <span style={{ fontSize:'10px', fontWeight:700, color:f.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</span>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <span style={{ fontSize:'9px', color:C.inkDim }}>{f.val.length}/{f.limit}</span>
                    <CopyBtn text={f.val} small/>
                  </div>
                </div>
                <div style={{ fontSize:'13px', color:C.ink, lineHeight:1.6 }}>{f.val}</div>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'11px', color:C.inkMuted }}>CTA Button:</span>
              <span style={{ fontSize:'12px', fontWeight:700, padding:'4px 12px', borderRadius:'7px', background:`${C.meta}15`, color:C.meta, border:`1px solid ${C.meta}25` }}>{v.cta}</span>
              <CopyBtn text={`Headline: ${v.headline}\n\n${v.primaryText}\n\nCTA: ${v.cta}`}/>
            </div>
            {v.score && (
              <ScoreBar score={v.score} label="Predicted CTR" color={rank===0?C.amber:C.green}/>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Creative card ─────────────────────────────────────────────
function CreativeCard({ v, sourceImage, onGenerate, generating }: {
  v:CreativeVariant; sourceImage:string|null; onGenerate:()=>void; generating:boolean
}) {
  const fmt  = CREATIVE_FORMATS.find(f => f.id === v.format)
  const pCol = v.platform.includes('meta') ? C.meta : v.platform.includes('tiktok') ? C.teal ?? '#0D9488' : C.google

  return (
    <div style={{ borderRadius:'13px', border:`1px solid ${C.border}`, background:C.surface, overflow:'hidden', boxShadow:C.sh }}>
      {/* Preview area */}
      <div style={{ position:'relative', background:C.bg, minHeight:'140px', display:'flex', alignItems:'center', justifyContent:'center', borderBottom:`1px solid ${C.border}` }}>
        {v.imageUrl ? (
          <img src={v.imageUrl} alt={v.label} style={{ width:'100%', height:'160px', objectFit:'cover', display:'block' }}/>
        ) : v.status === 'generating' || generating ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', padding:'24px' }}>
            <Loader2 size={28} color={C.amber} style={{ animation:'spin .9s linear infinite' }}/>
            <div style={{ fontSize:'11px', color:C.inkMuted }}>AI generating...</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', padding:'24px', textAlign:'center' }}>
            <div style={{ fontSize:'28px' }}>🎨</div>
            <div style={{ fontSize:'11px', color:C.inkMuted, lineHeight:1.4 }}>{v.description}</div>
          </div>
        )}
        {/* Format badge */}
        {fmt && (
          <div style={{ position:'absolute', top:'8px', left:'8px', padding:'2px 7px', borderRadius:'5px', background:'rgba(0,0,0,.6)', fontSize:'9px', fontWeight:700, color:'#fff' }}>
            {fmt.ratio}
          </div>
        )}
        {/* Platform badge */}
        <div style={{ position:'absolute', top:'8px', right:'8px', padding:'2px 7px', borderRadius:'5px', background:`${pCol}dd`, fontSize:'9px', fontWeight:700, color:'#fff' }}>
          {v.platform.map(p => PLATFORMS.find(pl=>pl.id===p)?.icon ?? '').join('')}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'11px 12px' }}>
        <div style={{ fontSize:'11px', fontWeight:700, color:C.ink, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.label}</div>
        <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.4, marginBottom:'10px' }}>{v.headline}</div>
        {/* Generate button */}
        {v.status !== 'done' && (
          <button type="button" onClick={onGenerate} disabled={generating || !sourceImage}
            style={{ width:'100%', padding:'7px', borderRadius:'8px', border:'none', background:sourceImage&&!generating?`linear-gradient(135deg,${C.amber},${C.amberDk})`:C.inkDim, color:'#fff', fontSize:'11px', fontWeight:700, cursor:sourceImage&&!generating?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', opacity:sourceImage&&!generating?1:.5 }}>
            {generating ? <><Loader2 size={11} style={{ animation:'spin .8s linear infinite' }}/> Generating...</> : <><Sparkles size={11}/> Generate</>}
          </button>
        )}
        {v.status === 'done' && v.imageUrl && (
          <a href={v.imageUrl} download={`beesell-creative-${v.id}.png`}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', width:'100%', padding:'7px', borderRadius:'8px', background:C.greenLt, border:`1px solid ${C.green}25`, color:C.green, fontSize:'11px', fontWeight:700, textDecoration:'none' }}>
            <Download size={11}/> Download
          </a>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function CampaignBuilderPage() {
  const [step,         setStep]         = useState(1)

  // Step 1 — Product
  const [productName,  setProductName]  = useState('')
  const [productDesc,  setProductDesc]  = useState('')
  const [productUrl,   setProductUrl]   = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [niche,        setNiche]        = useState('general')
  const [imageFile,    setImageFile]    = useState<File|null>(null)
  const [imagePreview, setImagePreview] = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 2 — Platform + Budget + Objective
  const [platforms,    setPlatforms]    = useState<PlatformId[]>(['meta'])
  const [objective,    setObjective]    = useState<ObjectiveId>('sales')
  const [budgetTotal,  setBudgetTotal]  = useState(1_500_000)
  const [budgetDays,   setBudgetDays]   = useState(14)
  const [budgetPreset, setBudgetPreset] = useState(1) // index
  const [language,     setLanguage]     = useState<'id'|'en'>('id')

  // Step 3 — Audience
  const [ageRanges,    setAgeRanges]    = useState<string[]>(['25-34','35-44'])
  const [gender,       setGender]       = useState('all')
  const [locations,    setLocations]    = useState<string[]>(['Seluruh Indonesia'])
  const [interests,    setInterests]    = useState<string[]>([])
  const [customAud,    setCustomAud]    = useState('')

  // Step 4 — Output
  const [generating,   setGenerating]   = useState(false)
  const [result,       setResult]       = useState<any>(null)
  const [error,        setError]        = useState('')
  const [activeTab,    setActiveTab]    = useState<'copy'|'creative'|'adsets'|'insights'>('copy')
  const [genSeconds,   setGenSeconds]   = useState(0)
  const [genCreative,  setGenCreative]  = useState<string|null>(null)  // id of currently generating creative
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // Auto-select interests based on niche
  useEffect(() => {
    setInterests((INTERESTS_MAP[niche] ?? INTERESTS_MAP.general).slice(0, 3))
  }, [niche])

  const togglePlatform = (p: PlatformId) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev, p])
  }
  const toggleAge = (a: string) => setAgeRanges(p => p.includes(a) ? p.filter(x=>x!==a) : [...p, a])
  const toggleLocation = (l: string) => setLocations(p => p.includes(l) ? p.filter(x=>x!==l) : [...p, l])
  const toggleInterest = (i: string) => setInterests(p => p.includes(i) ? p.filter(x=>x!==i) : [...p, i])

  const canProceed = {
    1: !!productName.trim(),
    2: platforms.length > 0 && budgetTotal >= 100_000,
    3: ageRanges.length > 0,
    4: true,
  }

  const dailyBudget = Math.floor(budgetTotal / budgetDays)
  const estReach    = result ? { min:result.estimatedReach?.min??0, max:result.estimatedReach?.max??0 }
                             : platforms[0] ? estimateReach(budgetTotal, platforms[0]) : { min:0, max:0 }

  // ── Generate campaign ────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!productName.trim()) return
    setGenerating(true); setError(''); setResult(null); setGenSeconds(0)
    timerRef.current = setInterval(() => setGenSeconds(s => s + 1), 1000)
    try {
      const res  = await fetch('/api/campaign/generate', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({
          productName, productDesc, productUrl, productPrice,
          objective, platforms,
          totalBudget: budgetTotal, days: budgetDays,
          audience: { ageRange:ageRanges, gender, locations, interests, customAudience:customAud },
          niche, language, copyCount:5, creativeCount:8,
        }),
      })
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (!res.ok) {
        const d = await res.json().catch(()=>({}))
        setError(d.upgrade ? '🔒 Campaign Builder memerlukan plan Pro. Upgrade sekarang.' : d.error ?? `Error ${res.status}`)
        return
      }
      const data = await res.json()
      setResult(data)
      setActiveTab('copy')
    } catch (e: any) {
      setError(e?.message ?? 'Generate gagal')
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setGenerating(false)
    }
  }, [productName, productDesc, productUrl, productPrice, objective, platforms, budgetTotal, budgetDays, ageRanges, gender, locations, interests, customAud, niche, language])

  // ── Generate single creative ─────────────────────────────────
  const generateCreativeImage = useCallback(async (creativeId: string) => {
    if (!result || !imagePreview) return
    const variant = result.creativeVariants.find((v: any) => v.id === creativeId)
    if (!variant) return
    setGenCreative(creativeId)
    try {
      // Upload image first if needed (get URL)
      let sourceUrl = imagePreview
      if (imageFile) {
        const fd = new FormData(); fd.append('file', imageFile)
        const up = await fetch('/api/storage/upload', { method:'POST', body:fd })
        if (up.ok) { const upd = await up.json(); sourceUrl = upd.url ?? imagePreview }
      }
      const res = await fetch('/api/campaign/creative', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({
          campaignId:    result.campaignId,
          creativeId,
          sourceImageUrl:sourceUrl,
          promptText:    variant.promptText,
          presetId:      variant.presetId,
          formatId:      variant.format,
        }),
      })
      const data = await res.json()
      if (data.success && data.imageUrl) {
        setResult((prev: any) => ({
          ...prev,
          creativeVariants: prev.creativeVariants.map((v: any) =>
            v.id === creativeId ? { ...v, imageUrl:data.imageUrl, status:'done' } : v
          ),
        }))
      }
    } catch { /* silent fail — user can retry */ }
    finally { setGenCreative(null) }
  }, [result, imageFile, imagePreview])

  const generateAllCreatives = useCallback(async () => {
    if (!result?.creativeVariants) return
    for (const v of result.creativeVariants) {
      if (v.status !== 'done') {
        await generateCreativeImage(v.id)
        await new Promise(r => setTimeout(r, 800))
      }
    }
  }, [result, generateCreativeImage])

  const nav = (dir: 1 | -1) => {
    const next = step + dir
    if (next === 4 && !result) { generate(); setStep(4) }
    else setStep(Math.min(4, Math.max(1, next)))
  }

  const platColor = (id: PlatformId) => id === 'meta' ? C.meta : id === 'tiktok' ? C.teal ?? '#0D9488' : C.google

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* ── Top bar ──────────────────────────────────── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'11px 20px', display:'flex', alignItems:'center', gap:'14px', position:'sticky', top:0, zIndex:100, boxShadow:C.sh }}>
        <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:'5px', color:C.inkMuted, textDecoration:'none', fontSize:'13px' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.ink}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.inkMuted}>
          <ArrowLeft size={15}/> Dashboard
        </Link>
        <div style={{ width:'1px', height:'16px', background:C.border }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🎯</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>Campaign Builder AI</div>
            <div style={{ fontSize:'10px', color:C.inkMuted }}>Meta Ads · TikTok Ads · Google Display</div>
          </div>
        </div>
        <div style={{ marginLeft:'auto', padding:'3px 10px', borderRadius:'6px', background:C.purpleLt, border:`1px solid ${C.purple}25`, fontSize:'11px', fontWeight:600, color:C.purple }}>Pro+</div>
      </div>

      <div style={{ maxWidth:'1060px', margin:'0 auto', padding:'24px 20px' }}>

        {/* ── Step indicator ─────────────────────────── */}
        <div style={{ display:'flex', gap:'0', marginBottom:'28px' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', flex:i < STEPS.length-1 ? 1 : 'none' }}>
              <div onClick={() => s.id < step && setStep(s.id)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', cursor:s.id < step ? 'pointer' : 'default', padding:'0 4px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:`2px solid ${step===s.id?C.amber:step>s.id?C.green:C.border}`, background:step===s.id?C.amberXlt:step>s.id?C.greenLt:C.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', transition:'all .2s' }}>
                  {step > s.id ? <Check size={16} color={C.green}/> : s.icon}
                </div>
                <div style={{ fontSize:'10px', fontWeight:step===s.id?700:500, color:step===s.id?C.amberDk:step>s.id?C.green:C.inkDim, whiteSpace:'nowrap' }}>{s.label}</div>
              </div>
              {i < STEPS.length-1 && (
                <div style={{ flex:1, height:'2px', background:step > s.id ? C.green : C.border, margin:'0 4px 18px', transition:'background .2s', minWidth:'30px' }}/>
              )}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            STEP 1: PRODUCT
        ══════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:900, color:C.ink, marginBottom:'6px' }}>📦 Info Produk</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>AI akan generate campaign structure berdasarkan info produk kamu.</p>
            </div>
            <Card>
              <SectionHead icon="📦" title="Detail Produk"/>
              <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px' }}>
                  <Field label="Nama Produk" value={productName} onChange={setProductName} placeholder="Contoh: Serum Vitamin C Brightening 30ml" required/>
                  <Field label="Harga" value={productPrice} onChange={setProductPrice} placeholder="Rp 89.000"/>
                </div>
                <Field label="Deskripsi Produk" value={productDesc} onChange={setProductDesc} placeholder="Benefit utama, keunggulan, untuk siapa produk ini..." textarea rows={3}/>
                <Field label="URL Landing Page / Toko" value={productUrl} onChange={setProductUrl} placeholder="https://shopee.co.id/produk..." hint="Opsional — untuk CTA yang lebih spesifik"/>
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'7px' }}>Kategori Niche</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {NICHES_OPTIONS.map(n => <Pill key={n.id} label={n.l} selected={niche===n.id} onClick={()=>setNiche(n.id)} color={C.purple}/>)}
                  </div>
                </div>
                {/* Image upload */}
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'7px' }}>Foto Produk <span style={{ fontWeight:400, textTransform:'none', letterSpacing:'0', color:C.inkDim }}>(untuk generate creative variants)</span></label>
                  {imagePreview ? (
                    <div style={{ position:'relative', width:'120px', height:'120px', borderRadius:'10px', overflow:'hidden', border:`1px solid ${C.border}` }}>
                      <img src={imagePreview} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                        style={{ position:'absolute', top:'4px', right:'4px', width:'20px', height:'20px', borderRadius:'50%', background:'rgba(0,0,0,.6)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <X size={11}/>
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => fileRef.current?.click()}
                      style={{ borderRadius:'10px', border:`2px dashed ${C.border}`, background:C.bg, cursor:'pointer', padding:'20px 16px', display:'flex', gap:'12px', alignItems:'center', transition:'border-color .15s' }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=C.amber}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.border}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:C.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>📸</div>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:600, color:C.ink, marginBottom:'2px' }}>Upload Foto Produk</div>
                        <div style={{ fontSize:'11px', color:C.inkMuted }}>JPG, PNG, WEBP — digunakan AI untuk generate creative visual variants</div>
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
                    e.target.value = ''
                  }}/>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2: PLATFORM + BUDGET + OBJECTIVE
        ══════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:900, color:C.ink, marginBottom:'6px' }}>📱 Platform, Budget & Objective</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>Pilih platform iklan, tujuan campaign, dan alokasikan budget kamu.</p>
            </div>

            {/* Platforms */}
            <Card>
              <SectionHead icon="📱" title="Platform Iklan" sub="Pilih 1-3 platform target"/>
              <div style={{ padding:'16px 18px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {PLATFORMS.map(p => {
                  const sel = platforms.includes(p.id)
                  return (
                    <div key={p.id} onClick={() => togglePlatform(p.id)}
                      style={{ padding:'14px', borderRadius:'13px', border:`1.5px solid ${sel?p.color:C.border}`, background:sel?p.colorLt:C.surface, cursor:'pointer', transition:'all .15s', boxShadow:sel?`0 0 0 1px ${p.color}20`:C.sh }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                        <span style={{ fontSize:'22px' }}>{p.icon}</span>
                        {sel && <CheckCircle2 size={16} color={p.color}/>}
                      </div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:sel?p.color:C.ink, marginBottom:'3px' }}>{p.label}</div>
                      <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.4, marginBottom:'8px' }}>{p.desc}</div>
                      <div style={{ display:'flex', gap:'8px', fontSize:'10px' }}>
                        <div><div style={{ color:C.inkDim }}>Min/hari</div><div style={{ fontWeight:700 }}>{fmtRp(p.minBudget)}</div></div>
                        <div><div style={{ color:C.inkDim }}>CTR avg</div><div style={{ fontWeight:700, color:p.color }}>{p.ctrBenchmark}%</div></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Objective */}
            <Card>
              <SectionHead icon="🎯" title="Campaign Objective" sub="Tujuan utama campaign kamu"/>
              <div style={{ padding:'16px 18px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'9px' }}>
                {(Object.entries(OBJECTIVES) as [ObjectiveId, any][]).map(([id, obj]) => {
                  const sel = objective === id
                  return (
                    <div key={id} onClick={() => setObjective(id)}
                      style={{ padding:'12px', borderRadius:'11px', border:`1.5px solid ${sel?obj.color:C.border}`, background:sel?`${obj.color}10`:C.surface, cursor:'pointer', transition:'all .15s', boxShadow:sel?`0 0 0 1px ${obj.color}20`:C.sh }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                        <span style={{ fontSize:'20px' }}>{obj.icon}</span>
                        {sel && <CheckCircle2 size={13} color={obj.color}/>}
                      </div>
                      <div style={{ fontSize:'12px', fontWeight:700, color:sel?obj.color:C.ink, marginBottom:'2px' }}>{obj.label}</div>
                      <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.3 }}>{obj.kpi}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Budget */}
            <Card>
              <SectionHead icon="💰" title="Budget Campaign"/>
              <div style={{ padding:'16px 18px' }}>
                {/* Budget presets */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'9px', marginBottom:'14px' }}>
                  {BUDGET_PRESETS.map((bp, i) => (
                    <div key={i} onClick={() => { if (bp.total > 0) { setBudgetTotal(bp.total); setBudgetDays(bp.days); setBudgetPreset(i) } else setBudgetPreset(i) }}
                      style={{ padding:'11px 10px', borderRadius:'11px', border:`1.5px solid ${budgetPreset===i?C.amber:C.border}`, background:budgetPreset===i?C.amberXlt:C.surface, cursor:'pointer', transition:'all .15s', textAlign:'center', boxShadow:budgetPreset===i?C.sa:C.sh }}>
                      <div style={{ fontSize:'18px', marginBottom:'4px' }}>{bp.icon}</div>
                      <div style={{ fontSize:'12px', fontWeight:700, color:budgetPreset===i?C.amberDk:C.ink, marginBottom:'2px' }}>{bp.label}</div>
                      <div style={{ fontSize:'9px', color:C.inkMuted, lineHeight:1.4 }}>{bp.desc}</div>
                      {budgetPreset===i && <CheckCircle2 size={13} color={C.amber} style={{ margin:'5px auto 0', display:'block' }}/>}
                    </div>
                  ))}
                </div>
                {/* Custom budget input */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'4px' }}>Total Budget (IDR)</label>
                    <input type="number" value={budgetTotal} onChange={e=>setBudgetTotal(+e.target.value)}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:C.white }}
                      onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                      onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                  </div>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'4px' }}>Durasi (hari)</label>
                    <input type="number" value={budgetDays} onChange={e=>setBudgetDays(+e.target.value)} min={3} max={90}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'13px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:C.white }}
                      onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                      onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                  </div>
                </div>
                {/* Budget summary */}
                <div style={{ marginTop:'12px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
                  {[
                    { label:'Daily Budget', val:fmtRp(dailyBudget), color:C.amber },
                    { label:'Est. Reach', val:`${fmtN(estReach.min)}–${fmtN(estReach.max)}`, color:C.blue },
                    { label:'Est. CPM', val:fmtRp(platforms[0] ? (PLATFORMS.find(p=>p.id===platforms[0])?.cpmRange.min ?? 0) + Math.floor(((PLATFORMS.find(p=>p.id===platforms[0])?.cpmRange.max ?? 0) - (PLATFORMS.find(p=>p.id===platforms[0])?.cpmRange.min ?? 0))/2) : 0), color:C.purple },
                  ].map((s, i) => (
                    <div key={i} style={{ padding:'11px 12px', borderRadius:'10px', background:C.bg, border:`1px solid ${C.border}`, textAlign:'center' }}>
                      <div style={{ fontSize:'16px', fontWeight:800, color:s.color, marginBottom:'2px' }}>{s.val}</div>
                      <div style={{ fontSize:'10px', color:C.inkDim }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Language */}
                <div style={{ marginTop:'12px', display:'flex', gap:'6px', alignItems:'center' }}>
                  <span style={{ fontSize:'11px', color:C.inkMuted }}>Bahasa copy:</span>
                  {([['id','🇮🇩 Indonesia'],['en','🇺🇸 English']] as const).map(([l, lb]) => (
                    <Pill key={l} label={lb} selected={language===l} onClick={()=>setLanguage(l)} color={C.green}/>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 3: AUDIENCE
        ══════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:900, color:C.ink, marginBottom:'6px' }}>👥 Target Audience</h2>
              <p style={{ fontSize:'13px', color:C.inkMuted }}>AI akan segmentasi audience per platform berdasarkan profil ini.</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }} className="aud-grid">
              <Card>
                <SectionHead icon="🎂" title="Demografi"/>
                <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Rentang Usia</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {AGE_RANGES.map(a => <Pill key={a} label={a} selected={ageRanges.includes(a)} onClick={()=>toggleAge(a)} color={C.blue}/>)}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Gender</label>
                    <div style={{ display:'flex', gap:'5px' }}>
                      {GENDERS.map(g => <Pill key={g.id} label={g.l} selected={gender===g.id} onClick={()=>setGender(g.id)} color={C.purple}/>)}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Lokasi</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {LOCATIONS.map(l => <Pill key={l} label={l} selected={locations.includes(l)} onClick={()=>toggleLocation(l)} color={C.teal ?? '#0D9488'}/>)}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHead icon="🎯" title="Interest & Behavior"/>
                <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'6px' }}>Interest Targeting</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {(INTERESTS_MAP[niche] ?? INTERESTS_MAP.general).map(i => (
                        <Pill key={i} label={i} selected={interests.includes(i)} onClick={()=>toggleInterest(i)} color={C.orange}/>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'5px' }}>Custom Audience (opsional)</label>
                    <textarea value={customAud} onChange={e=>setCustomAud(e.target.value)} rows={3}
                      placeholder="Contoh: Pengunjung website 30 hari, customer list, atau lookalike 1% dari customer existing..."
                      style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.border}`, fontSize:'12px', resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.5, boxSizing:'border-box', background:C.white }}
                      onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                      onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
                  </div>
                  {/* Audience summary */}
                  <div style={{ padding:'11px 12px', borderRadius:'10px', background:C.amberXlt, border:`1px solid ${C.amber}30` }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:C.amberDk, marginBottom:'5px' }}>📊 Audience Summary</div>
                    <div style={{ fontSize:'11px', color:C.amberDk, lineHeight:1.6 }}>
                      {[
                        ageRanges.length > 0 && `Usia: ${ageRanges.join(', ')}`,
                        `Gender: ${GENDERS.find(g=>g.id===gender)?.l}`,
                        locations.length > 0 && `Lokasi: ${locations.join(', ')}`,
                        interests.length > 0 && `Interest: ${interests.slice(0,3).join(', ')}`,
                      ].filter(Boolean).map((line, i) => (
                        <div key={i}>• {line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 4: CAMPAIGN OUTPUT
        ══════════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Loading */}
            {generating && (
              <Card style={{ padding:'48px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' }}>
                <div style={{ position:'relative', width:'80px', height:'80px' }}>
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`4px solid ${C.amber}20` }}/>
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`4px solid transparent`, borderTopColor:C.amber, animation:'spin .9s linear infinite' }}/>
                  <div style={{ position:'absolute', inset:'18px', fontSize:'28px', display:'flex', alignItems:'center', justifyContent:'center' }}>🎯</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'16px', fontWeight:800, color:C.ink, marginBottom:'5px' }}>AI Generating Campaign Structure...</div>
                  <div style={{ fontSize:'12px', color:C.inkMuted }}>
                    {genSeconds}s · Claude AI sedang membuat copy variants, creative briefs & ad sets
                  </div>
                </div>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center', fontSize:'10px', color:C.inkMuted }}>
                  {[['Ad Copy 5 variasi', 5], ['Creative Briefs 8 variasi', 10], ['Ad Sets per platform', 18], ['AI Insights & Strategy', 25]].map(([label, threshold], i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px', color:genSeconds > (threshold as number) ? C.green : C.inkMuted }}>
                      {genSeconds > (threshold as number) ? <CheckCircle2 size={11} color={C.green}/> : <div style={{ width:'10px', height:'10px', borderRadius:'50%', border:`1.5px solid ${C.border}` }}/>}
                      {label}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Error */}
            {error && !generating && (
              <div style={{ padding:'14px 16px', background:C.redLt, border:`1px solid ${C.red}30`, borderRadius:'12px', display:'flex', gap:'9px', alignItems:'flex-start', fontSize:'13px', color:'#B91C1C' }}>
                <AlertCircle size={15} style={{ flexShrink:0, marginTop:'1px' }}/>
                <div style={{ flex:1 }}>{error}</div>
                {error.includes('Pro') && (
                  <Link href="/billing" style={{ flexShrink:0, padding:'6px 12px', borderRadius:'8px', background:C.amber, color:'#fff', fontSize:'12px', fontWeight:700, textDecoration:'none' }}>Upgrade →</Link>
                )}
                <button onClick={() => { setError(''); setStep(1) }}
                  style={{ flexShrink:0, padding:'5px 10px', borderRadius:'7px', border:`1px solid ${C.red}30`, background:C.redLt, color:C.red, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  Ulangi
                </button>
              </div>
            )}

            {/* Empty — not yet generated */}
            {!generating && !result && !error && (
              <Card style={{ padding:'48px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', textAlign:'center' }}>
                <span style={{ fontSize:'48px' }}>🎯</span>
                <div style={{ fontSize:'17px', fontWeight:800, color:C.ink }}>Siap Generate Campaign</div>
                <div style={{ fontSize:'13px', color:C.inkMuted, maxWidth:'400px', lineHeight:1.7 }}>
                  AI akan generate: <strong>5 ad copy variants</strong>, <strong>8 creative variants</strong>, <strong>ad sets per platform</strong>, dan <strong>strategic insights</strong> untuk kamu.
                </div>
                <button type="button" onClick={generate}
                  style={{ display:'flex', alignItems:'center', gap:'8px', padding:'13px 24px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit' }}>
                  <Zap size={16}/> Generate Campaign Sekarang
                </button>
              </Card>
            )}

            {/* Results */}
            {result && !generating && (
              <div>
                {/* Campaign summary bar */}
                <div style={{ padding:'14px 18px', borderRadius:'13px', background:C.amberXlt, border:`1px solid ${C.amber}30`, marginBottom:'16px', display:'flex', gap:'14px', flexWrap:'wrap', alignItems:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:800, color:C.amberDk, flex:1 }}>
                    ✅ Campaign "{result.name}" — AI generated in {Math.round((result.elapsedMs??0)/1000)}s
                  </div>
                  <div style={{ display:'flex', gap:'10px', fontSize:'11px', flexWrap:'wrap' }}>
                    {[
                      { l:'Durasi',    v:`${result.days}h`, color:C.amber },
                      { l:'Budget',    v:fmtRp(result.totalBudget??0), color:C.purple },
                      { l:'Est. Reach',v:`${fmtN(result.estimatedReach?.min??0)}–${fmtN(result.estimatedReach?.max??0)}`, color:C.blue },
                      { l:'Est. CTR',  v:`${result.estimatedCTR??0}%`, color:C.green },
                    ].map((s,i) => (
                      <div key={i} style={{ textAlign:'center' }}>
                        <div style={{ fontWeight:700, color:s.color }}>{s.v}</div>
                        <div style={{ color:C.inkDim }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => { setResult(null); generate() }}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.amber}30`, background:C.surface, color:C.amberDk, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                    <RefreshCw size={12}/> Regenerate
                  </button>
                </div>

                {/* Output tabs */}
                <div style={{ display:'flex', gap:'5px', marginBottom:'16px', overflowX:'auto', paddingBottom:'2px' }}>
                  {[
                    { id:'copy'     as const, l:'📝 Ad Copy', count:result.copyVariants?.length },
                    { id:'creative' as const, l:'🎨 Creative', count:result.creativeVariants?.length },
                    { id:'adsets'   as const, l:'📋 Ad Sets', count:result.adSets?.length },
                    { id:'insights' as const, l:'💡 Insights', count:result.aiInsights?.length },
                  ].map(tab => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 16px', borderRadius:'99px', border:`1.5px solid ${activeTab===tab.id?C.amber:C.border}`, background:activeTab===tab.id?C.amberXlt:C.surface, fontSize:'12px', fontWeight:activeTab===tab.id?700:500, color:activeTab===tab.id?C.amberDk:C.inkMuted, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap', fontFamily:'inherit', flexShrink:0, boxShadow:activeTab===tab.id?C.sa:C.sh }}>
                      {tab.l}
                      {tab.count && <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'99px', background:activeTab===tab.id?`${C.amber}30`:C.bg, fontWeight:700 }}>{tab.count}</span>}
                    </button>
                  ))}
                </div>

                {/* ── TAB: AD COPY ─────────────────────────── */}
                {activeTab === 'copy' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'2px' }}>
                      🏆 5 Ad Copy Variants — sorted by predicted CTR
                    </div>
                    <div style={{ fontSize:'11px', color:C.inkMuted, marginBottom:'8px' }}>
                      Setiap variant pakai angle copywriting yang berbeda. A/B test minimal 2-3 untuk temukan winner.
                    </div>
                    {(result.copyVariants ?? [])
                      .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
                      .map((v: AdCopyVariant, i: number) => (
                        <CopyCard key={v.id} v={v} rank={i}/>
                      ))
                    }
                    {/* All copy in one */}
                    <div style={{ marginTop:'4px' }}>
                      <CopyBtn text={
                        (result.copyVariants ?? []).map((v: AdCopyVariant) =>
                          `=== ${v.label} (${v.angle}) ===\nHeadline: ${v.headline}\n${v.primaryText}\nCTA: ${v.cta}`
                        ).join('\n\n')
                      }/>
                    </div>
                  </div>
                )}

                {/* ── TAB: CREATIVE ────────────────────────── */}
                {activeTab === 'creative' && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'8px' }}>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>🎨 Creative Variants — AI Visual Generation</div>
                        <div style={{ fontSize:'11px', color:C.inkMuted }}>
                          {imageFile ? 'Foto produk siap — generate setiap variant, atau semua sekaligus.' : '⚠️ Upload foto produk (Step 1) untuk enable creative generation.'}
                        </div>
                      </div>
                      {imageFile && (
                        <button type="button" onClick={generateAllCreatives} disabled={!!genCreative}
                          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, cursor:genCreative?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:C.sa, opacity:genCreative?.7:1 }}>
                          {genCreative ? <Loader2 size={13} style={{ animation:'spin .8s linear infinite' }}/> : <Sparkles size={13}/>}
                          Generate Semua ({result.creativeVariants?.filter((v: any) => v.status !== 'done').length ?? 0})
                        </button>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'12px' }}>
                      {(result.creativeVariants ?? []).map((v: CreativeVariant) => (
                        <CreativeCard
                          key={v.id}
                          v={v}
                          sourceImage={imagePreview}
                          onGenerate={() => generateCreativeImage(v.id)}
                          generating={genCreative === v.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB: AD SETS ─────────────────────────── */}
                {activeTab === 'adsets' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'4px' }}>📋 Ad Sets — Campaign Structure</div>
                    {(result.adSets ?? []).map((adset: AdSet, i: number) => {
                      const platConf = PLATFORMS.find(p => p.id === adset.platform)!
                      return (
                        <Card key={adset.id}>
                          <div style={{ padding:'12px 16px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
                            <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${platConf?.color ?? C.blue}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{platConf?.icon ?? '📱'}</div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'3px' }}>{adset.name}</div>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', fontSize:'11px', color:C.inkMuted, marginBottom:'10px' }}>
                                <span>💰 {fmtRp(adset.budget.daily)}/hari</span>
                                <span>📅 {adset.budget.days} hari</span>
                                <span>🎯 {adset.audience.locations.join(', ')}</span>
                                <span>🏷️ {adset.bidStrategy}</span>
                              </div>
                              {/* Audience quick view */}
                              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                                {adset.audience.ageRange.map(a => (
                                  <span key={a} style={{ fontSize:'9px', fontWeight:600, padding:'1px 6px', borderRadius:'99px', background:`${platConf?.color ?? C.blue}12`, color:platConf?.color ?? C.blue }}>{a}</span>
                                ))}
                                <span style={{ fontSize:'9px', fontWeight:600, padding:'1px 6px', borderRadius:'99px', background:`${C.purple}12`, color:C.purple }}>{adset.audience.gender}</span>
                                {adset.placements.slice(0,2).map(pl => (
                                  <span key={pl} style={{ fontSize:'9px', fontWeight:600, padding:'1px 6px', borderRadius:'99px', background:C.bg, color:C.inkMuted, border:`1px solid ${C.border}` }}>{pl}</span>
                                ))}
                              </div>
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <div style={{ fontSize:'15px', fontWeight:800, color:C.amber }}>{fmtRp(adset.budget.total)}</div>
                              <div style={{ fontSize:'9px', color:C.inkDim }}>Total budget</div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* ── TAB: INSIGHTS ────────────────────────── */}
                {activeTab === 'insights' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'4px' }}>
                      💡 AI Strategic Insights & Recommendations
                    </div>
                    {(result.aiInsights ?? []).map((insight: string, i: number) => (
                      <div key={i} style={{ display:'flex', gap:'12px', padding:'14px 16px', borderRadius:'12px', border:`1px solid ${i===0?C.amber+'40':C.border}`, background:i===0?C.amberXlt:C.surface, boxShadow:i===0?C.sa:C.sh }}>
                        <div style={{ width:'26px', height:'26px', borderRadius:'8px', background:i===0?`linear-gradient(135deg,${C.amber},${C.amberDk})`:`${C.amber}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, color:i===0?'#fff':C.amberDk, flexShrink:0, marginTop:'1px' }}>{i+1}</div>
                        <div style={{ fontSize:'13px', color:C.inkSub, lineHeight:1.7, flex:1 }}>{insight}</div>
                      </div>
                    ))}

                    {/* Next actions */}
                    <div style={{ marginTop:'4px', padding:'14px 16px', borderRadius:'12px', background:C.purpleLt, border:`1px solid ${C.purple}25` }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:C.purple, marginBottom:'10px' }}>🚀 Langkah Selanjutnya</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                        {[
                          { label:'Export ke Meta Ads Manager', icon:'📘', href:'#', color:C.meta },
                          { label:'Download Semua Copy', icon:'📋', href:'#', color:C.purple },
                          { label:'Generate Video Ads', icon:'🎬', href:'/studio/video/generator', color:C.amber },
                        ].map((action, i) => (
                          <Link key={i} href={action.href}
                            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 12px', borderRadius:'9px', border:`1px solid ${action.color}25`, background:`${action.color}08`, textDecoration:'none', transition:'all .15s' }}
                            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${action.color}18`}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`${action.color}08`}}>
                            <span style={{ fontSize:'16px' }}>{action.icon}</span>
                            <span style={{ fontSize:'11px', fontWeight:700, color:action.color }}>{action.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ──────────────────────────────── */}
        {!(step === 4 && generating) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'24px', flexWrap:'wrap', gap:'10px' }}>
            <button type="button" onClick={() => nav(-1)} disabled={step === 1}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'13px', fontWeight:600, color:step===1?C.inkDim:C.inkSub, cursor:step===1?'not-allowed':'pointer', opacity:step===1?.4:1, fontFamily:'inherit' }}>
              <ArrowLeft size={14}/> Sebelumnya
            </button>
            <div style={{ fontSize:'11px', color:C.inkMuted }}>
              Langkah {step} dari {STEPS.length} · {STEPS[step-1]?.label}
            </div>
            {step < 4 ? (
              <button type="button" onClick={() => nav(1)} disabled={!(canProceed as any)[step]}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 20px', borderRadius:'10px', border:'none', background:(canProceed as any)[step]?`linear-gradient(135deg,${C.amber},${C.amberDk})`:C.inkDim, color:'#fff', fontSize:'13px', fontWeight:700, cursor:(canProceed as any)[step]?'pointer':'not-allowed', opacity:(canProceed as any)[step]?1:.4, fontFamily:'inherit', boxShadow:(canProceed as any)[step]?C.sa:'none' }}>
                Lanjut <ArrowRight size={14}/>
              </button>
            ) : result && (
              <button type="button" onClick={generate}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'10px', border:`1px solid ${C.amber}30`, background:C.amberXlt, color:C.amberDk, fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                <RefreshCw size={14}/> Regenerate
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box }
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        textarea::placeholder, input::placeholder { color:#9CA3AF }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
        .aud-grid { grid-template-columns: 1fr 1fr !important }
        @media (max-width: 768px) { .aud-grid { grid-template-columns: 1fr !important } }
      `}</style>
    </div>
  )
}