'use client'
// apps/web-app/app/(dashboard)/caption/page.tsx
// ── BeeSell AI — Caption Generator Pro ────────────────────────
// 18 dimensi input + AI Memory (Supabase) + 12 engine
// Mode: Simple (2 input) | Advanced (semua 18 dimensi)
// Fitur extra: image upload (Dim 14 vision), rewrite mode, multi-platform export

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Sparkles, ChevronDown, ChevronUp, Copy, Check, Loader2,
  BookmarkPlus, RefreshCw, AlertCircle, ArrowLeft,
  Brain, Upload, X, Image as ImageIcon, Wand2, Eye,
  RotateCcw, Share2, Settings2, Zap,
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────
const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE', brand700:'#1D4ED8',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  orange:'#EA580C', org50:'#FFF7ED',
  pink:'#DB2777', pnk50:'#FDF2F8',
  teal:'#0D9488', teal50:'#F0FDFA',
  slate900:'#0F172A', slate800:'#1E293B', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#fff',
}

// ── 12 Engines ────────────────────────────────────────────────
const ENGINES = [
  { id:'caption',     icon:'✍️', label:'Caption',       desc:'Caption lengkap siap post',          color:C.brand,  bg:C.brand50 },
  { id:'hook',        icon:'🎣', label:'Hook',          desc:'Baris pertama scroll-stopper',        color:C.amber,  bg:C.amb50 },
  { id:'cta',         icon:'🎯', label:'CTA',           desc:'Call-to-action yang convert',         color:C.red,    bg:C.red50 },
  { id:'soft-selling',icon:'💫', label:'Soft Selling',  desc:'Edukasi → nurturing → closing',       color:C.purple, bg:C.pur50 },
  { id:'hard-selling',icon:'🔥', label:'Hard Selling',  desc:'Direct offer + urgency + FOMO',       color:'#EF4444',bg:'#FEF2F2' },
  { id:'viral',       icon:'🚀', label:'Viral',         desc:'Potensi FYP & share tinggi',          color:C.orange, bg:C.org50 },
  { id:'affiliate',   icon:'🤝', label:'Affiliate',     desc:'"Racun produk" review authentic',     color:C.green,  bg:C.grn50 },
  { id:'storytelling',icon:'📖', label:'Storytelling',  desc:'Kisah yang relate & menyentuh',       color:C.pink,   bg:C.pnk50 },
  { id:'engagement',  icon:'💬', label:'Engagement',    desc:'Dorong komentar, share, interaksi',   color:'#0284C7',bg:'#E0F2FE' },
  { id:'description', icon:'📋', label:'Deskripsi',     desc:'Detail produk + benefit + specs',     color:C.green,  bg:C.grn50 },
  { id:'marketplace', icon:'🛍️', label:'Marketplace',  desc:'Judul SEO + deskripsi Shopee/Tokped', color:'#0369A1',bg:'#E0F2FE' },
  { id:'launching',   icon:'🎉', label:'Launching',     desc:'Hype produk baru, pre-order, FOMO',   color:C.purple, bg:C.pur50 },
  { id:'rewrite',     icon:'✨', label:'Rewrite AI',    desc:'Improve caption existing jadi kuat',  color:C.teal,   bg:C.teal50 },
]

// ── Options data ──────────────────────────────────────────────
const OBJECTIVES = [
  {v:'hard-selling',l:'💰 Hard Selling'},{v:'soft-selling',l:'💫 Soft Selling'},
  {v:'branding',l:'🏷️ Branding'},{v:'awareness',l:'📢 Awareness'},
  {v:'engagement',l:'💬 Engagement'},{v:'viral',l:'🚀 Viral'},
  {v:'affiliate',l:'🤝 Affiliate'},{v:'lead-gen',l:'📥 Lead Gen'},
  {v:'marketplace-convert',l:'🛒 Marketplace'},{v:'launching',l:'🎉 Launching'},
  {v:'flash-sale',l:'⚡ Flash Sale'},
]
const PLATFORMS = [
  {v:'instagram',l:'📸 Instagram'},{v:'tiktok',l:'🎵 TikTok'},
  {v:'tiktok-shop',l:'🛒 TikTok Shop'},{v:'shopee',l:'🛍️ Shopee'},
  {v:'tokopedia',l:'🟢 Tokopedia'},{v:'facebook',l:'👥 Facebook'},
  {v:'whatsapp',l:'💬 WhatsApp'},{v:'twitter',l:'𝕏 Twitter'},
]
const AUDIENCES = [
  'Gen Z','Milenial','Ibu Rumah Tangga','Pria Dewasa','Wanita Karir',
  'Mahasiswa','Pebisnis','Beauty Enthusiast','Luxury Buyer','Gamer',
]
const TONES = [
  {v:'casual',l:'😊 Santai'},{v:'friendly',l:'🤝 Friendly'},
  {v:'professional',l:'💼 Profesional'},{v:'energetic',l:'⚡ Energik'},
  {v:'luxury',l:'💎 Luxury'},{v:'playful',l:'🎉 Playful'},
  {v:'emotional',l:'💝 Emotional'},{v:'islami',l:'☪️ Islami'},
  {v:'gen-z',l:'🔥 Gen Z'},{v:'motivational',l:'🚀 Motivasional'},
]
const STYLES = [
  {v:'storytelling',l:'📖 Storytelling'},{v:'problem-solution',l:'⚡ Problem-Solution'},
  {v:'pas',l:'🎯 PAS Framework'},{v:'aida',l:'📈 AIDA'},
  {v:'hook-viral',l:'🚀 Hook Viral'},{v:'listicle',l:'📋 Listicle'},
  {v:'testimonial',l:'⭐ Testimonial'},{v:'edukasi',l:'🎓 Edukasi'},
  {v:'fomo',l:'😱 FOMO'},{v:'minimalis',l:'✨ Minimalis'},
  {v:'cta-heavy',l:'🎯 CTA Heavy'},{v:'cinematic',l:'🎬 Cinematic'},
]
const HOOK_TYPES = [
  {v:'question',l:'❓ Pertanyaan'},{v:'shock',l:'😱 Shock'},
  {v:'pain-point',l:'😩 Pain Point'},{v:'curiosity',l:'🤔 Curiosity'},
  {v:'statistic',l:'📊 Statistik'},{v:'viral',l:'🔥 Viral Style'},
  {v:'emotional',l:'💝 Emotional'},{v:'humor',l:'😂 Humor'},
  {v:'fomo',l:'⚡ FOMO'},
]
const LANGUAGES = [
  {v:'indonesian-casual',l:'🇮🇩 Indonesia Santai'},
  {v:'indonesian-formal',l:'🇮🇩 Indonesia Formal'},
  {v:'mixed-english',l:'🌐 Mix Indo-English'},
  {v:'gen-z',l:'⚡ Full Gen Z'},
  {v:'jaksel',l:'🏙️ Jaksel Style'},
  {v:'full-english',l:'🇬🇧 Full English'},
]
const LENGTHS = [
  {v:'short',l:'Short',d:'3 kalimat'},{v:'medium',l:'Medium',d:'3-5 paragraf'},
  {v:'long',l:'Long',d:'8+ paragraf'},{v:'thread',l:'Thread',d:'format list'},
  {v:'carousel',l:'Carousel',d:'per slide'},
]
const EMOJIS = [
  {v:'none',l:'None'},{v:'minimal',l:'Minimal'},{v:'moderate',l:'Sedang'},{v:'heavy',l:'Banyak'},
]
const EMOTIONS = [
  {v:'penasaran',l:'🤔 Penasaran'},{v:'percaya',l:'🤝 Percaya'},
  {v:'urgent',l:'⏰ Urgent'},{v:'excited',l:'🎉 Excited'},
  {v:'fomo',l:'😱 FOMO'},{v:'nyaman',l:'😌 Nyaman'},
  {v:'premium',l:'💎 Premium'},{v:'inspired',l:'🚀 Inspired'},
]
const KPIS = [
  {v:'ctr',l:'📈 CTR'},{v:'save-share',l:'💾 Save & Share'},
  {v:'checkout',l:'🛒 Checkout'},{v:'engagement',l:'💬 Engagement'},
  {v:'affiliate-click',l:'🔗 Affiliate Click'},
]
const ALL_PLATFORMS = ['instagram','tiktok','tiktok-shop','shopee','tokopedia','facebook','whatsapp','twitter']

// ── UI Components ─────────────────────────────────────────────
function Shimmer({ h='14px', w='100%' }: { h?:string; w?:string }) {
  return <div style={{ height:h, width:w, borderRadius:'5px', background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }}/>
}

function MemBadge({ label, value }: { label:string; value:string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:700, background:'linear-gradient(135deg,#EFF6FF,#F5F3FF)', color:C.brand, border:`1px solid ${C.brand100}` }}>
      <Brain size={8}/> {label}: {value}
    </span>
  )
}

function Chip({ label, selected, onClick, color=C.brand, bg=C.brand50 }: {
  label:string; selected:boolean; onClick:()=>void; color?:string; bg?:string
}) {
  return (
    <button type="button" onClick={onClick} style={{ padding:'6px 12px', borderRadius:'99px', border:`1.5px solid ${selected?color:C.slate200}`, background:selected?bg:C.white, cursor:'pointer', fontSize:'12px', fontWeight:selected?700:500, color:selected?color:C.slate700, transition:'all .12s', whiteSpace:'nowrap' }}>
      {label}
    </button>
  )
}

function Section({ title, open, onToggle, children, badge }: {
  title:string; open:boolean; onToggle:()=>void; children:React.ReactNode; badge?:string
}) {
  return (
    <div style={{ borderRadius:'12px', border:`1px solid ${C.slate200}`, overflow:'hidden', marginBottom:'8px' }}>
      <button type="button" onClick={onToggle} style={{ width:'100%', padding:'11px 14px', background:open?C.white:C.slate50, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontFamily:"'DM Sans',sans-serif" }}>
        <span style={{ fontSize:'13px', fontWeight:700, color:C.slate900, flex:1, textAlign:'left' }}>{title}</span>
        {badge && <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'4px', background:C.brand50, color:C.brand, flexShrink:0 }}>{badge}</span>}
        {open ? <ChevronUp size={13} color={C.slate400}/> : <ChevronDown size={13} color={C.slate400}/>}
      </button>
      {open && <div style={{ padding:'14px', borderTop:`1px solid ${C.slate100}` }}>{children}</div>}
    </div>
  )
}

const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'10px', border:`1.5px solid ${C.slate200}`, fontSize:'13px', fontFamily:"'DM Sans',sans-serif", color:C.slate900, outline:'none', boxSizing:'border-box', background:C.white, transition:'border-color .15s' }
const lbl: React.CSSProperties = { fontSize:'11px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:'5px' }

// ── MAIN PAGE ──────────────────────────────────────────────────
export default function CaptionPage() {
  // AI Memory
  const [mem,    setMem]    = useState<any>(null)
  const [memOK,  setMemOK]  = useState(false)

  // Mode & engine
  const [mode,   setMode]   = useState<'simple'|'advanced'>('simple')
  const [engine, setEngine] = useState('caption')

  // ── Dim 1: Product ────────────────────────────────────────
  const [pName,  setPName]  = useState('')
  const [pType,  setPType]  = useState('')
  const [pCat,   setPCat]   = useState('')
  const [pDesc,  setPDesc]  = useState('')
  const [pFn,    setPFn]    = useState('')
  const [pHi,    setPHi]    = useState('')
  const [pUSP,   setPUSP]   = useState('')
  const [pBen,   setPBen]   = useState('')
  const [pProb,  setPProb]  = useState('')
  const [pPrice, setPPrice] = useState('')
  const [pPromo, setPPromo] = useState('')
  const [pGuar,  setPGuar]  = useState('')
  const [pPack,  setPPack]  = useState('')
  const [pCert,  setPCert]  = useState('')

  // ── Dim 2-18 config ───────────────────────────────────────
  const [objective,  setObjective]  = useState('hard-selling')
  const [platform,   setPlatform]   = useState('instagram')
  const [audience,   setAudience]   = useState<string[]>([])
  const [tone,       setTone]       = useState('casual')
  const [capStyle,   setCapStyle]   = useState('')
  const [hookType,   setHookType]   = useState('')
  const [ctaText,    setCtaText]    = useState('')
  const [ctaStyle,   setCtaStyle]   = useState('medium')
  const [keywords,   setKeywords]   = useState('')
  const [language,   setLanguage]   = useState('indonesian-casual')
  const [length,     setLength]     = useState('medium')
  const [emoji,      setEmoji]      = useState('moderate')
  const [hashtag,    setHashtag]    = useState(true)
  const [imgPreview, setImgPreview] = useState<string|null>(null) // Dim 14
  const [imgDesc,    setImgDesc]    = useState('')
  const [imgMood,    setImgMood]    = useState('')
  const [emotion,    setEmotion]    = useState('')    // Dim 15
  const [compStyle,  setCompStyle]  = useState('')    // Dim 16
  const [kpi,        setKpi]        = useState('')    // Dim 18
  const [variants,   setVariants]   = useState(3)

  // Rewrite mode
  const [rewriteSrc, setRewriteSrc] = useState('')

  // Section open state
  const [sec, setSec] = useState<Record<string,boolean>>({
    product:true, dim2:false, dim3:false, dim4:false, dim5:false,
    dim6:false, dim7:false, dim8:false, dim9:false, dim10:false,
    dim11:false, dim12:false, dim13:false, dim14:false, dim15:false,
    dim16:false, dim17:false, dim18:false,
  })
  const tog = (k:string) => setSec(p=>({...p,[k]:!p[k]}))

  // Results
  const [results,  setResults]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [copiedId, setCopiedId] = useState<string|null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [genCount, setGenCount] = useState(0)
  const [exportPlatform, setExportPlatform] = useState<string|null>(null)
  const [exportLoading,  setExportLoading]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeEng = ENGINES.find(e => e.id === engine) ?? ENGINES[0]

  // ── Load AI Memory ────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/ai-memory').then(r=>r.json()).then(m=>{
      setMem(m)
      if (m.tone)            setTone(m.tone)
      if (m.language)        setLanguage(m.language)
      if (m.emoji)           setEmoji(m.emoji)
      if (m.ctaStyle)        setCtaStyle(m.ctaStyle)
      if (m.primaryPlatform) setPlatform(m.primaryPlatform)
      if (m.targetAudience?.length) setAudience((m.targetAudience as string[]).slice(0,3))
      if (m.usp)             setPUSP(m.usp)
      if (m.niche)           setPCat(m.niche)
      setMemOK(true)
    }).catch(()=>setMemOK(true))
  }, [])

  // ── Dim 14: Image upload ──────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setImgPreview(ev.target?.result as string) }
    reader.readAsDataURL(file)
  }

  // ── Generate ──────────────────────────────────────────────
  const generate = useCallback(async (overridePlatform?: string) => {
    const targetPlatform = overridePlatform ?? platform
    if (!pName.trim() && engine !== 'rewrite') { setError('Nama produk wajib diisi'); return }
    if (engine === 'rewrite' && !rewriteSrc.trim()) { setError('Masukkan caption yang ingin di-rewrite'); return }
    setError(''); setLoading(true)

    try {
      const body: Record<string,any> = {
        engine,
        productName:       pName.trim() || 'Produk',
        productType:       pType  || undefined,
        productCategory:   pCat   || mem?.niche || undefined,
        productDesc:       pDesc  || undefined,
        productFunction:   pFn    || undefined,
        productHighlights: pHi    || undefined,
        productUSP:        pUSP   || mem?.usp || undefined,
        productBenefits:   pBen   || undefined,
        productProblem:    pProb  || undefined,
        productPrice:      pPrice || undefined,
        productPromo:      pPromo || undefined,
        productGuarantee:  pGuar  || undefined,
        productPackaging:  pPack  || undefined,
        productCert:       pCert  || undefined,
        objective, platform: targetPlatform,
        targetAudience:    audience.length ? audience : undefined,
        tone, style: capStyle || undefined, hookType: hookType || undefined,
        ctaText: ctaText || undefined, ctaStyle, keywords: keywords || undefined,
        language, length, emoji, generateHashtag: hashtag,
        emotionTarget: emotion || undefined,
        competitorStyle: compStyle || undefined,
        conversionKPI: kpi || undefined,
        variants: overridePlatform ? 2 : variants,
        originalCaption: engine === 'rewrite' ? rewriteSrc : undefined,
        useAIMemory: true,
      }

      // Dim 14 visual context
      if (imgPreview || imgDesc || imgMood) {
        body.visualContext = {
          imageUrl:   imgPreview?.startsWith('data:') ? undefined : imgPreview,
          aiDescription: imgDesc || undefined,
          mood:       imgMood || undefined,
        }
      }

      const res = await fetch('/api/generate/caption', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? `Error ${res.status}`)
        return
      }

      if (overridePlatform) {
        // Multi-platform export: append results
        setResults(prev => [...data.items.map((it:any) => ({
          ...it, platform: overridePlatform, isExport: true,
        })), ...prev])
      } else {
        setResults(data.items ?? [])
        setGenCount(c=>c+1)
      }
    } catch (e:any) {
      setError(e.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false); setExportLoading(false)
    }
  }, [engine, pName, pType, pCat, pDesc, pFn, pHi, pUSP, pBen, pProb, pPrice, pPromo, pGuar, pPack, pCert, objective, platform, audience, tone, capStyle, hookType, ctaText, ctaStyle, keywords, language, length, emoji, hashtag, imgPreview, imgDesc, imgMood, emotion, compStyle, kpi, variants, rewriteSrc, mem])

  const copy = async (text:string, id:string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(()=>setCopiedId(null),2000) } catch {}
  }

  const exportAllPlatforms = async () => {
    setExportLoading(true)
    for (const pl of ALL_PLATFORMS) {
      if (pl === platform) continue
      await generate(pl)
      await new Promise(r => setTimeout(r, 600)) // stagger requests
    }
    setExportLoading(false)
  }

  const mainResults  = results.filter((r:any) => !r.isExport)
  const exportResults= results.filter((r:any) => r.isExport)

  const quotaPct = mem ? Math.round((mem.quotaUsed / mem.quotaMax) * 100) : 0
  const quotaWarn = quotaPct >= 80

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* HEADER */}
      <div style={{ marginBottom:'18px' }}>
        <Link href="/quick-tools" style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', color:C.slate400, textDecoration:'none', marginBottom:'8px' }}>
          <ArrowLeft size={12}/> Quick Tools
        </Link>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
          <div>
            <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(20px,3.5vw,26px)', fontWeight:600, color:C.slate900, letterSpacing:'-0.02em', marginBottom:'2px' }}>
              Caption Generator Pro ✍️
            </h1>
            <p style={{ fontSize:'13px', color:C.slate500 }}>
              18 dimensi · 12 engine · AI Memory otomatis dari profilmu
            </p>
          </div>
          <div style={{ display:'flex', gap:'6px', background:C.slate100, borderRadius:'10px', padding:'3px' }}>
            {[{v:'simple',l:'⚡ Simple'},{v:'advanced',l:'⚙️ Advanced'}].map(m => (
              <button key={m.v} type="button" onClick={() => setMode(m.v as any)}
                style={{ padding:'6px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700, background:mode===m.v?C.white:'transparent', color:mode===m.v?C.slate900:C.slate500, boxShadow:mode===m.v?'0 1px 4px rgba(0,0,0,.1)':'none', transition:'all .15s' }}>
                {m.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI MEMORY INDICATOR */}
      {memOK && mem && (
        <div style={{ padding:'10px 14px', background:'linear-gradient(135deg,#EFF6FF,#F5F3FF)', borderRadius:'12px', border:`1px solid ${C.brand100}`, marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
          <Brain size={14} color={C.brand} style={{ flexShrink:0 }}/>
          <div style={{ flex:1, display:'flex', flexWrap:'wrap', gap:'4px', minWidth:0 }}>
            {mem.tone          && <MemBadge label="Tone"     value={mem.tone}/>}
            {mem.language      && <MemBadge label="Bahasa"   value={mem.language.replace(/-/g,' ')}/>}
            {mem.niche         && <MemBadge label="Niche"    value={mem.niche}/>}
            {mem.storeName     && <MemBadge label="Brand"    value={mem.storeName}/>}
            {mem.ctaStyle      && <MemBadge label="CTA"      value={mem.ctaStyle}/>}
            {mem.primaryPlatform&&<MemBadge label="Platform" value={mem.primaryPlatform}/>}
          </div>
          {/* Quota */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            <div style={{ width:'60px', height:'4px', borderRadius:'2px', background:C.slate200, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${quotaPct}%`, background:quotaWarn?C.red:C.brand, borderRadius:'2px' }}/>
            </div>
            <span style={{ fontSize:'10px', color:quotaWarn?C.red:C.slate500, fontWeight:600 }}>
              {mem.quotaUsed}/{mem.quotaMax}
            </span>
            {quotaWarn && <Link href="/billing" style={{ fontSize:'10px', color:C.brand, fontWeight:700, textDecoration:'none' }}>Upgrade</Link>}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,380px) minmax(0,1fr)', gap:'14px', alignItems:'start' }}>

        {/* ── LEFT: CONFIG ─────────────────────────────────── */}
        <div>

          {/* ENGINE SELECTOR */}
          <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, padding:'14px', marginBottom:'10px' }}>
            <label style={lbl}>🎯 Engine AI</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
              {ENGINES.map(e => (
                <button key={e.id} type="button" onClick={() => { setEngine(e.id); setResults([]) }} title={e.desc}
                  style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 10px', borderRadius:'99px', border:`1.5px solid ${engine===e.id?e.color:C.slate200}`, background:engine===e.id?e.bg:C.white, cursor:'pointer', fontSize:'11px', fontWeight:engine===e.id?700:500, color:engine===e.id?e.color:C.slate600, transition:'all .12s', whiteSpace:'nowrap' }}>
                  {e.icon}{e.label}
                </button>
              ))}
            </div>
            <div style={{ padding:'7px 10px', background:activeEng.bg, borderRadius:'8px', fontSize:'12px', color:activeEng.color, fontWeight:600 }}>
              {activeEng.icon} {activeEng.desc}
            </div>
          </div>

          {/* REWRITE MODE — show text area */}
          {engine === 'rewrite' && (
            <div style={{ padding:'14px', background:C.teal50, borderRadius:'12px', border:`1px solid ${C.teal}30`, marginBottom:'10px' }}>
              <label style={{ ...lbl, color:C.teal }}>📝 Caption yang ingin di-improve</label>
              <textarea value={rewriteSrc} onChange={e=>setRewriteSrc(e.target.value)} rows={4}
                placeholder="Tempel caption lama di sini. AI akan memperbaiki menjadi lebih powerful dan high-converting..."
                style={{ ...inp, resize:'vertical' }}/>
            </div>
          )}

          {/* DIM 1: PRODUCT */}
          <Section title="📦 Informasi Produk" open={sec.product} onToggle={()=>tog('product')} badge="WAJIB">
            <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
              <div>
                <label style={lbl}>Nama Produk <span style={{ color:C.red }}>*</span></label>
                <input value={pName} onChange={e=>{setPName(e.target.value);setError('')}}
                  placeholder="Serum Vitamin C Brightening 30ml"
                  style={{ ...inp, borderColor:!pName&&error?C.red:C.slate200 }}
                  onFocus={e=>(e.target as HTMLInputElement).style.borderColor=activeEng.color}
                  onBlur={e=>(e.target as HTMLInputElement).style.borderColor=C.slate200}
                  onKeyDown={e=>e.key==='Enter'&&!loading&&generate()}
                />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div>
                  <label style={lbl}>Harga</label>
                  <input value={pPrice} onChange={e=>setPPrice(e.target.value)} style={inp} placeholder="Rp 89.000"/>
                </div>
                <div>
                  <label style={lbl}>Promo / Diskon</label>
                  <input value={pPromo} onChange={e=>setPPromo(e.target.value)} style={inp} placeholder="Disc 30%, Gratis ongkir"/>
                </div>
              </div>
              <div>
                <label style={lbl}>Keunggulan Utama</label>
                <input value={pHi} onChange={e=>setPHi(e.target.value)} style={inp} placeholder="BPOM, niacinamide 10%, glowing 7 hari"/>
              </div>
              {mode === 'advanced' && (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    <div>
                      <label style={lbl}>Jenis Produk</label>
                      <input value={pType} onChange={e=>setPType(e.target.value)} style={inp} placeholder="kemasan botol, serum"/>
                    </div>
                    <div>
                      <label style={lbl}>Kategori</label>
                      <input value={pCat} onChange={e=>setPCat(e.target.value)} style={inp} placeholder="skincare" defaultValue={mem?.niche}/>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Deskripsi Produk</label>
                    <textarea value={pDesc} onChange={e=>setPDesc(e.target.value)} rows={2} style={{...inp,resize:'vertical'}} placeholder="Deskripsi lengkap..."/>
                  </div>
                  <div>
                    <label style={lbl}>Fungsi Utama</label>
                    <input value={pFn} onChange={e=>setPFn(e.target.value)} style={inp} placeholder="Mencerahkan kulit dalam 7 hari"/>
                  </div>
                  <div>
                    <label style={lbl}>USP (Unique Selling Point)</label>
                    <input value={pUSP} onChange={e=>setPUSP(e.target.value)} style={inp} placeholder="Satu-satunya yang..." defaultValue={mem?.usp}/>
                  </div>
                  <div>
                    <label style={lbl}>Benefit Bagi User</label>
                    <textarea value={pBen} onChange={e=>setPBen(e.target.value)} rows={2} style={{...inp,resize:'vertical'}} placeholder="Kulit glowing, percaya diri..."/>
                  </div>
                  <div>
                    <label style={lbl}>Masalah yang Diselesaikan</label>
                    <input value={pProb} onChange={e=>setPProb(e.target.value)} style={inp} placeholder="Kulit kusam, noda hitam..."/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                    <div>
                      <label style={lbl}>Garansi</label>
                      <input value={pGuar} onChange={e=>setPGuar(e.target.value)} style={inp} placeholder="7 hari uang kembali"/>
                    </div>
                    <div>
                      <label style={lbl}>Packaging</label>
                      <input value={pPack} onChange={e=>setPPack(e.target.value)} style={inp} placeholder="Box premium"/>
                    </div>
                    <div>
                      <label style={lbl}>Sertifikasi</label>
                      <input value={pCert} onChange={e=>setPCert(e.target.value)} style={inp} placeholder="BPOM, Halal"/>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* DIM 2+3: OBJECTIVE + PLATFORM */}
          <Section title="🎯 Tujuan & Platform" open={sec.dim2} onToggle={()=>tog('dim2')}>
            <label style={lbl}>Tujuan Marketing</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
              {OBJECTIVES.map(o => <Chip key={o.v} label={o.l} selected={objective===o.v} onClick={()=>setObjective(o.v)} color={C.red} bg={C.red50}/>)}
            </div>
            <label style={lbl}>Platform</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {PLATFORMS.map(p => <Chip key={p.v} label={p.l} selected={platform===p.v} onClick={()=>setPlatform(p.v)}/>)}
            </div>
          </Section>

          {/* DIM 4+5: AUDIENCE + TONE */}
          <Section title="👥 Audience & Tone" open={sec.dim4} onToggle={()=>tog('dim4')}>
            <label style={lbl}>Target Audience {mem?.targetAudience?.length?<span style={{ fontSize:'9px', color:C.brand, marginLeft:'4px' }}>dari Memory</span>:null}</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
              {AUDIENCES.map(a => <Chip key={a} label={a} selected={audience.includes(a)} onClick={()=>setAudience(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a])} color={C.purple} bg={C.pur50}/>)}
            </div>
            <label style={lbl}>Tone of Voice {mem?.tone?<span style={{ fontSize:'9px', color:C.brand, marginLeft:'4px' }}>Memory: {mem.tone}</span>:null}</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {TONES.map(t => <Chip key={t.v} label={t.l} selected={tone===t.v} onClick={()=>setTone(t.v)} color={C.amber} bg={C.amb50}/>)}
            </div>
          </Section>

          {/* DIM 6+7: STYLE + HOOK */}
          {mode==='advanced' && (
            <Section title="✍️ Style & Hook" open={sec.dim6} onToggle={()=>tog('dim6')}>
              <label style={lbl}>Style Caption</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
                {STYLES.map(s => <Chip key={s.v} label={s.l} selected={capStyle===s.v} onClick={()=>setCapStyle(p=>p===s.v?'':s.v)} color={C.purple} bg={C.pur50}/>)}
              </div>
              <label style={lbl}>Jenis Hook</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {HOOK_TYPES.map(h => <Chip key={h.v} label={h.l} selected={hookType===h.v} onClick={()=>setHookType(p=>p===h.v?'':h.v)} color={C.amber} bg={C.amb50}/>)}
              </div>
            </Section>
          )}

          {/* DIM 8: CTA */}
          {mode==='advanced' && (
            <Section title="📣 CTA Preference" open={sec.dim8} onToggle={()=>tog('dim8')}>
              <label style={lbl}>CTA Style {mem?.ctaStyle?<span style={{ fontSize:'9px', color:C.brand, marginLeft:'4px' }}>Memory: {mem.ctaStyle}</span>:null}</label>
              <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
                {[{v:'soft',l:'💫 Soft'},{v:'medium',l:'🎯 Medium'},{v:'aggressive',l:'🔥 Aggressive'}].map(c => (
                  <button key={c.v} type="button" onClick={()=>setCtaStyle(c.v)}
                    style={{ flex:1, padding:'8px', borderRadius:'9px', border:`1.5px solid ${ctaStyle===c.v?C.red:C.slate200}`, background:ctaStyle===c.v?C.red50:C.white, cursor:'pointer', fontSize:'11px', fontWeight:ctaStyle===c.v?700:500, color:ctaStyle===c.v?C.red:C.slate700 }}>
                    {c.l}
                  </button>
                ))}
              </div>
              <label style={lbl}>Custom CTA (opsional)</label>
              <input value={ctaText} onChange={e=>setCtaText(e.target.value)} style={inp} placeholder="Klik keranjang kuning sekarang!"/>
            </Section>
          )}

          {/* DIM 9+10+11+12+13: LANGUAGE, LENGTH, EMOJI, KEYWORDS, HASHTAG */}
          <Section title="📝 Format & Bahasa" open={sec.dim10} onToggle={()=>tog('dim10')}>
            <label style={lbl}>Bahasa {mem?.language?<span style={{ fontSize:'9px', color:C.brand, marginLeft:'4px' }}>Memory: {mem.language.replace(/-/g,' ')}</span>:null}</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
              {LANGUAGES.map(l => <Chip key={l.v} label={l.l} selected={language===l.v} onClick={()=>setLanguage(l.v)} color={C.green} bg={C.grn50}/>)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'10px' }}>
              <div>
                <label style={lbl}>Panjang Caption</label>
                <div style={{ display:'flex', gap:'4px' }}>
                  {LENGTHS.map(l => (
                    <button key={l.v} type="button" title={l.d} onClick={()=>setLength(l.v)}
                      style={{ flex:1, padding:'6px 2px', borderRadius:'8px', border:`1.5px solid ${length===l.v?C.brand:C.slate200}`, background:length===l.v?C.brand:C.white, color:length===l.v?C.white:C.slate700, cursor:'pointer', fontSize:'10px', fontWeight:700, textAlign:'center' }}>
                      {l.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Emoji</label>
                <div style={{ display:'flex', gap:'4px' }}>
                  {EMOJIS.map(e => (
                    <button key={e.v} type="button" onClick={()=>setEmoji(e.v)}
                      style={{ flex:1, padding:'6px 2px', borderRadius:'8px', border:`1.5px solid ${emoji===e.v?C.amber:C.slate200}`, background:emoji===e.v?C.amb50:C.white, color:emoji===e.v?C.amber:C.slate700, cursor:'pointer', fontSize:'10px', fontWeight:700, textAlign:'center' }}>
                      {e.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {mode==='advanced' && (
              <>
                <label style={lbl}>Keywords / SEO</label>
                <input value={keywords} onChange={e=>setKeywords(e.target.value)} style={{ ...inp, marginBottom:'10px' }} placeholder="serum glowing, skincare viral, niacinamide..."/>
              </>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <button type="button" onClick={()=>setHashtag(h=>!h)}
                style={{ width:'34px', height:'19px', borderRadius:'10px', background:hashtag?C.brand:C.slate200, border:'none', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:'2px', left:hashtag?'17px':'2px', width:'15px', height:'15px', borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
              </button>
              <span style={{ fontSize:'12px', color:C.slate700 }}>Auto-generate hashtag</span>
            </div>
          </Section>

          {/* DIM 14: VISUAL CONTEXT — IMAGE UPLOAD */}
          <Section title="🖼️ Visual Context" open={sec.dim14} onToggle={()=>tog('dim14')} badge="BARU">
            <div style={{ padding:'8px 10px', background:'#ECFDF5', borderRadius:'8px', border:`1px solid #BBF7D0`, marginBottom:'12px', fontSize:'11px', color:C.green, lineHeight:1.5 }}>
              💡 Upload foto produkmu → AI analisis gambar → caption disesuaikan dengan visual, warna, dan suasana foto secara otomatis
            </div>
            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ border:`2px dashed ${imgPreview?C.green:C.slate300}`, borderRadius:'12px', padding:'16px', textAlign:'center', cursor:'pointer', background:imgPreview?C.grn50:'#FAFAFA', transition:'all .15s', position:'relative', overflow:'hidden', marginBottom:'10px' }}>
              {imgPreview ? (
                <>
                  <img src={imgPreview} alt="preview" style={{ maxHeight:'120px', maxWidth:'100%', objectFit:'contain', borderRadius:'8px' }}/>
                  <button type="button" onClick={e=>{e.stopPropagation();setImgPreview(null)}}
                    style={{ position:'absolute', top:'6px', right:'6px', width:'22px', height:'22px', borderRadius:'50%', background:'rgba(0,0,0,.5)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <X size={12} color="white"/>
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon size={28} color={C.slate300} style={{ marginBottom:'8px' }}/>
                  <div style={{ fontSize:'13px', fontWeight:600, color:C.slate600, marginBottom:'2px' }}>Upload Foto Produk</div>
                  <div style={{ fontSize:'11px', color:C.slate400 }}>PNG, JPG — AI akan analisis warna, mood & setting</div>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }}/>

            {/* Manual description */}
            <label style={lbl}>Atau deskripsikan gambar secara manual</label>
            <input value={imgDesc} onChange={e=>setImgDesc(e.target.value)} style={{ ...inp, marginBottom:'8px' }} placeholder="Foto produk skincare di meja marmer dengan bunga putih..."/>
            <label style={lbl}>Mood / Suasana Gambar</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {['elegant','cozy','fresh','luxury','minimal','vibrant','dark-moody','aesthetic','natural'].map(m => (
                <Chip key={m} label={m} selected={imgMood===m} onClick={()=>setImgMood(p=>p===m?'':m)} color={C.purple} bg={C.pur50}/>
              ))}
            </div>
          </Section>

          {/* DIM 15+16+18: EMOTION + COMPETITOR + KPI */}
          {mode==='advanced' && (
            <Section title="🧠 Emotion, KPI & Advanced" open={sec.dim15} onToggle={()=>tog('dim15')}>
              <label style={lbl}>Emosi Target Audience (Dim 15)</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
                {EMOTIONS.map(e => <Chip key={e.v} label={e.l} selected={emotion===e.v} onClick={()=>setEmotion(p=>p===e.v?'':e.v)} color={C.pink} bg={C.pnk50}/>)}
              </div>
              <label style={lbl}>Referensi Competitor / Style Viral (Dim 16)</label>
              <input value={compStyle} onChange={e=>setCompStyle(e.target.value)} style={{ ...inp, marginBottom:'12px' }} placeholder="Style @influencer atau brand viral tertentu..."/>
              <label style={lbl}>KPI Konversi (Dim 18)</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {KPIS.map(k => <Chip key={k.v} label={k.l} selected={kpi===k.v} onClick={()=>setKpi(p=>p===k.v?'':k.v)} color={C.green} bg={C.grn50}/>)}
              </div>
            </Section>
          )}

          {/* VARIANTS */}
          <div style={{ background:C.white, borderRadius:'12px', border:`1px solid ${C.slate200}`, padding:'12px 14px', marginBottom:'10px' }}>
            <label style={lbl}>Jumlah Variasi</label>
            <div style={{ display:'flex', gap:'6px' }}>
              {[1,2,3,5].map(n => (
                <button key={n} type="button" onClick={()=>setVariants(n)}
                  style={{ flex:1, padding:'9px', borderRadius:'9px', border:`1.5px solid ${variants===n?activeEng.color:C.slate200}`, background:variants===n?activeEng.bg:C.white, cursor:'pointer', fontSize:'14px', fontWeight:variants===n?800:500, color:variants===n?activeEng.color:C.slate700 }}>
                  {n}×
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'10px 12px', background:C.red50, border:`1px solid #FECACA`, borderRadius:'10px', fontSize:'12px', color:C.red, display:'flex', gap:'6px', alignItems:'flex-start', marginBottom:'8px' }}>
              <AlertCircle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>{error}
            </div>
          )}

          {/* GENERATE BUTTON */}
          <button type="button" onClick={() => generate()} disabled={loading||(!pName.trim()&&engine!=='rewrite')}
            style={{ width:'100%', padding:'14px', borderRadius:'13px', border:'none', background: loading||(!pName.trim()&&engine!=='rewrite') ? C.slate200 : `linear-gradient(135deg, ${activeEng.color}, ${activeEng.color}CC)`, color: loading||(!pName.trim()&&engine!=='rewrite') ? C.slate400 : C.white, fontSize:'14px', fontWeight:700, cursor: loading||(!pName.trim()&&engine!=='rewrite') ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow: loading ? 'none' : `0 6px 20px ${activeEng.color}45`, transition:'all .15s' }}>
            {loading
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Generating {variants} variasi...</>
              : <><Sparkles size={15}/>Generate {activeEng.icon} {activeEng.label} ({variants} variasi)</>
            }
          </button>
          <p style={{ fontSize:'11px', color:C.slate400, textAlign:'center', marginTop:'6px' }}>
            {mem?.storeName ? `🧠 Brand "${mem.storeName}" · tone & bahasa otomatis dari AI Memory` : 'Lengkapi profil untuk personalisasi AI lebih baik'}
          </p>
        </div>

        {/* ── RIGHT: RESULTS ────────────────────────────────── */}
        <div>

          {/* Loading */}
          {loading && mainResults.length === 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', fontWeight:700, color:C.slate900 }}>
                <Loader2 size={14} style={{ animation:'spin 1s linear infinite', color:activeEng.color }}/>
                AI membuat {variants} variasi {activeEng.label}...
              </div>
              {Array.from({length:variants}).map((_,i) => (
                <div key={i} style={{ padding:'16px', borderRadius:'12px', border:`1px solid ${C.slate200}`, background:C.white }}>
                  <Shimmer w="55%" h="12px"/><div style={{ marginTop:'8px' }}>
                  <Shimmer w="100%" h="11px"/></div><div style={{ marginTop:'4px' }}>
                  <Shimmer w="90%" h="11px"/></div><div style={{ marginTop:'4px' }}>
                  <Shimmer w="75%" h="11px"/></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && mainResults.length === 0 && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'380px', borderRadius:'20px', border:`2px dashed ${C.slate200}`, background:C.slate50 }}>
              <div style={{ fontSize:'52px', opacity:.35, marginBottom:'12px' }}>{activeEng.icon}</div>
              <div style={{ fontSize:'15px', fontWeight:700, color:C.slate700, marginBottom:'4px' }}>
                {activeEng.label} siap dijalankan
              </div>
              <div style={{ fontSize:'12px', color:C.slate400, maxWidth:'260px', textAlign:'center', lineHeight:1.6, marginBottom:'16px' }}>
                Isi nama produk di kiri → pilih engine & platform → klik Generate
              </div>
              {mem && (
                <div style={{ padding:'10px 16px', background:'linear-gradient(135deg,#EFF6FF,#F5F3FF)', borderRadius:'10px', border:`1px solid ${C.brand100}`, fontSize:'11px', color:C.brand, fontWeight:600, maxWidth:'280px', textAlign:'center' }}>
                  🧠 AI Memory siap · Tone: {mem.tone || '—'} · {mem.niche || 'Niche belum diatur'}
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {mainResults.length > 0 && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>
                  {mainResults.length} hasil · {activeEng.icon} {activeEng.label}
                  {genCount > 1 && <span style={{ fontSize:'10px', color:C.slate400, marginLeft:'6px', fontWeight:400 }}>· regenerasi #{genCount}</span>}
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button type="button" onClick={() => generate()}
                    style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer' }}>
                    <RefreshCw size={10}/> Ulang
                  </button>
                  <button type="button" onClick={exportAllPlatforms} disabled={exportLoading}
                    style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'8px', border:`1px solid ${C.brand100}`, background:C.brand50, fontSize:'11px', fontWeight:600, color:C.brand, cursor:'pointer' }}>
                    {exportLoading ? <Loader2 size={10} style={{ animation:'spin 1s linear infinite' }}/> : <Share2 size={10}/>}
                    Export semua platform
                  </button>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'14px' }}>
                {mainResults.map((r:any, i:number) => (
                  <div key={r.id||i} style={{ padding:'16px', borderRadius:'13px', border:`1.5px solid ${C.slate200}`, background:C.white, transition:'all .13s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=`${activeEng.color}60`}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.slate200}}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px', flexWrap:'wrap', gap:'5px' }}>
                      <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'4px', background:activeEng.bg, color:activeEng.color, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                          {r.meta?.type || r.meta?.style || `Variasi ${i+1}`}
                        </span>
                        {r.meta?.score && <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'4px', background:C.grn50, color:C.green }}>Score {r.meta.score}/10</span>}
                        {mem?.tone && <span style={{ fontSize:'9px', padding:'2px 6px', borderRadius:'4px', background:'linear-gradient(135deg,#EFF6FF,#F5F3FF)', color:C.brand, display:'flex', alignItems:'center', gap:'2px' }}>
                          <Brain size={7}/> {mem.tone}
                        </span>}
                      </div>
                      <div style={{ display:'flex', gap:'4px' }}>
                        <button onClick={() => copy(r.text, r.id||String(i))}
                          style={{ display:'flex', alignItems:'center', gap:'3px', padding:'4px 10px', borderRadius:'7px', border:`1px solid ${C.slate200}`, background: copiedId===(r.id||String(i)) ? C.grn50 : C.white, fontSize:'11px', fontWeight:600, color: copiedId===(r.id||String(i)) ? C.green : C.slate600, cursor:'pointer' }}>
                          {copiedId===(r.id||String(i)) ? <><Check size={10}/>Tersalin!</> : <><Copy size={10}/>Salin</>}
                        </button>
                        <button onClick={() => setSavedIds(p => new Set([...p, r.id||String(i)]))}
                          style={{ display:'flex', alignItems:'center', gap:'3px', padding:'4px 9px', borderRadius:'7px', border:`1px solid ${C.slate200}`, background: savedIds.has(r.id||String(i)) ? C.grn50 : C.white, fontSize:'11px', fontWeight:600, color: savedIds.has(r.id||String(i)) ? C.green : C.slate600, cursor:'pointer' }}>
                          {savedIds.has(r.id||String(i)) ? <Check size={10}/> : <BookmarkPlus size={10}/>}
                        </button>
                      </div>
                    </div>
                    {r.meta?.title && <div style={{ padding:'5px 9px', background:C.slate50, borderRadius:'6px', fontSize:'12px', fontWeight:700, color:C.slate900, marginBottom:'7px', border:`1px solid ${C.slate200}` }}>📌 {r.meta.title}</div>}
                    <p style={{ fontSize:'13px', color:C.slate800, lineHeight:1.75, whiteSpace:'pre-wrap', margin:0 }}>{r.text}</p>
                    {r.meta?.hashtags && <div style={{ marginTop:'7px', fontSize:'11px', color:C.brand, fontWeight:500, lineHeight:1.6 }}>{r.meta.hashtags}</div>}
                    {r.meta?.bullets && (
                      <div style={{ marginTop:'7px', display:'flex', flexDirection:'column', gap:'2px' }}>
                        {r.meta.bullets.split('|||').filter(Boolean).map((b:string,j:number) => (
                          <div key={j} style={{ fontSize:'12px', color:C.slate600, display:'flex', gap:'5px' }}>
                            <span style={{ color:C.green, flexShrink:0 }}>✓</span>{b}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px', paddingTop:'7px', borderTop:`1px solid ${C.slate100}` }}>
                      <span style={{ fontSize:'10px', color:C.slate300 }}>{r.text.length} karakter</span>
                      <span style={{ fontSize:'9px', color:C.slate300 }}>{platform} · {tone} · {language.replace(/-/g,' ')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Export results */}
              {exportResults.length > 0 && (
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.slate600, marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                    <Share2 size={12}/> Caption untuk platform lain:
                  </div>
                  {exportResults.map((r:any, i:number) => (
                    <div key={`ex-${i}`} style={{ padding:'12px 14px', borderRadius:'11px', border:`1px solid ${C.brand100}`, background:C.brand50, marginBottom:'6px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, color:C.brand }}>📱 {r.platform}</span>
                        <button onClick={() => copy(r.text, `ex-${i}`)}
                          style={{ display:'flex', alignItems:'center', gap:'3px', padding:'3px 8px', borderRadius:'6px', border:`1px solid ${C.brand100}`, background:C.white, fontSize:'10px', fontWeight:600, color:C.brand, cursor:'pointer' }}>
                          {copiedId===`ex-${i}` ? <><Check size={9}/>OK</> : <><Copy size={9}/>Salin</>}
                        </button>
                      </div>
                      <p style={{ fontSize:'12px', color:C.slate700, lineHeight:1.6, margin:0, whiteSpace:'pre-wrap' }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick engine switch */}
              <div style={{ padding:'14px', background:C.slate50, borderRadius:'12px', border:`1px solid ${C.slate200}` }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:C.slate600, marginBottom:'8px' }}>
                  ⚡ Generate dengan engine lain untuk produk yang sama:
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {ENGINES.filter(e=>e.id!==engine).map(e => (
                    <button key={e.id} type="button"
                      onClick={() => { setEngine(e.id); setResults([]); setTimeout(()=>generate(),100) }}
                      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'99px', border:`1px solid ${e.color}40`, background:`${e.color}08`, cursor:'pointer', fontSize:'11px', fontWeight:600, color:e.color, transition:'all .12s', whiteSpace:'nowrap' }}>
                      {e.icon} {e.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (max-width:767px) {
          div[style*="grid-template-columns:minmax(0,380px)"] { grid-template-columns:1fr!important }
        }
        * { box-sizing: border-box }
      `}</style>
    </div>
  )
}