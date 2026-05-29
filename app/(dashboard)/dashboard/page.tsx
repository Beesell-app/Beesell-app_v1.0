'use client'
// app/(dashboard)/dashboard/page.tsx — v3
// AI Image Generator section dengan tooltip popup per fitur

import Link from 'next/link'
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Copy, RefreshCw, ChevronRight, FileText, Check,
  ArrowRight, Zap, Palette, CreditCard, Settings,
  Archive, ImageIcon, X, Clock, Sparkles, Play,
} from 'lucide-react'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  PACKSHOT_PRESETS,
  type PackshotPreset
} from '@/lib/studio/packshot-presets'

type ImageTool = {
  href: string
  icon: string
  label: string
  badge: string | null
  badgeBg: string | null
  color: string
  bg: string
  title: string
  tagline: string
  desc: string
  useCase: string
  presets: string[]
  time: string
  credit: string
  bestFor: string[]
}
const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE', brand700:'#1D4ED8',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  orange:'#EA580C', o50:'#FFF7ED',
  cyan:'#0891B2', c50:'#ECFEFF',
  pink:'#DB2777', pk50:'#FDF2F8',
  slate900:'#0F172A', slate800:'#1E293B', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#ffffff',
}

function Shimmer({ w='100%', h='14px', r='6px' }: { w?:string; h?:string; r?:string }) {
  return <div style={{ width:w, height:h, borderRadius:r, background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite' }}/>
}

const PLATFORM_EMOJI: Record<string,string> = {
  instagram:'📸','tiktok-shop':'🎵',tiktok:'🎵',shopee:'🛍️',tokopedia:'🛒',
  whatsapp:'💬',facebook:'👥',lazada:'📦',twitter:'𝕏',threads:'🧵',
}
const NICHE_EMOJI: Record<string,string> = {
  fashion:'👗',skincare:'✨',food:'🍜',electronics:'📱',home:'🏠',health:'💊',digital:'💻',other:'📦',
}
const SELLER_LABEL: Record<string,string> = {
  seller:'Marketplace Seller',affiliator:'Affiliator',dropshipper:'Dropshipper',
  brand:'Brand Owner',agency:'Agency',reseller:'Reseller',
}
const PLAN_COLOR: Record<string,string> = {
  free:C.slate500,starter:C.slate500,basic:C.green,pro:C.purple,business:C.amber,
}

// ── Quick Tools ───────────────────────────────────────────────
const QUICK_TOOLS = [
  { href:'/quick-tools?tool=remove-bg',     icon:'🪄', label:'Remove BG',    desc:'Hapus background otomatis', color:C.brand,  bg:C.brand50,  badge:'Populer' },
  { href:'/quick-tools?tool=upscale',       icon:'🔍', label:'AI Upscale',   desc:'Tingkatkan resolusi ke HD', color:C.purple, bg:C.pur50,    badge:null },
  { href:'/quick-tools/resize',             icon:'📐', label:'Resize Smart', desc:'1 foto → semua platform',   color:C.green,  bg:C.grn50,    badge:'Smart' },
  { href:'/quick-tools?tool=relight',       icon:'💡', label:'AI Relight',   desc:'Perbaiki pencahayaan foto', color:C.amber,  bg:C.amb50,    badge:'Beta' },
  { href:'/quick-tools?tool=remove-object', icon:'✏️', label:'Remove Object',desc:'Hapus objek mengganggu',   color:C.pink,   bg:C.pk50,     badge:null },
]

// ── AI Image Generator — 7 sub fitur dengan popup detail ──────
const IMAGE_TOOLS: ImageTool[] = [
  {
    href: '/studio/image/photoshoot',
    icon: '🌟', label: 'Product Photoshoot', badge: '⭐ Terpopuler', badgeBg: C.brand,
    color: C.brand, bg: C.brand50,
    title: 'AI Product Photoshoot',
    tagline: 'Foto biasa → lifestyle photography premium',
    desc: 'AI mengubah foto produk dari HP menjadi visual lifestyle photography berkualitas studio. Latar, pencahayaan, dan suasana berubah sesuai style yang kamu pilih.',
    useCase: 'Foto skincare di meja → jadi foto luxury marble studio. Foto kopi → cinematic cafe aesthetic.',
    presets: ['Luxury','Korean Aesthetic','Minimal Clean','Dark Moody','Warm Lifestyle','Fashion Editorial','Natural Light','Marble Studio','Soft Morning'],
    time: '~15 detik',
    credit: '2 kredit/generate',
    bestFor: ['Seller skincare','Brand fashion','FMCG & food','Affiliator lifestyle'],
  },
  {
  href: '/studio/image/packshot',
  icon: '📦',
  label: 'Packshot Generator',

  badge: null,
  badgeBg: null,

  color: C.purple,
  bg: C.pur50,

  title: 'AI Packshot Generator',

  tagline: 'Foto ecommerce studio otomatis',

  desc: 'Generate foto studio ecommerce siap marketplace secara otomatis. Bayangan sempurna, latar bersih, dan tampilan profesional tanpa perlu fotografer atau studio fisik.',

  useCase: 'Upload foto produk → langsung jadi foto toko bersih seperti brand premium.',

  presets: PACKSHOT_PRESETS
    .filter((p: PackshotPreset) => p.popular)
    .map((p: PackshotPreset) => p.label),

  time: '~12 detik',

  credit: '1 kredit/generate',

  bestFor: [
    'Semua seller marketplace',
    'Tokopedia & Shopee',
    'Brand owner',
    'Dropshipper',
  ],
},
  {
    href: '/studio/image/product-to-model',
    icon: '🧑‍🦰', label: 'Product to Model', badge: '✨ New', badgeBg: C.pink,
    color: C.pink, bg: C.pk50,
    title: 'Product to Model AI',
    tagline: 'Foto produk → foto model memakai produk',
    desc: 'Upload foto baju atau aksesoris — AI otomatis menempatkan produk ke model AI realistis pilihanmu. Pilih tipe model, pose, ekspresi, dan background.',
    useCase: 'Upload foto kaos polos → model Asia perempuan memakai kaos tersebut, difoto studio.',
    presets: ['Female Asian','Hijab Woman','Korean Female','Male Asian','Western Female','Streetwear Male'],
    time: '~20 detik',
    credit: '3 kredit/generate',
    bestFor: ['Seller fashion','Seller hijab','Brand pakaian','Affiliator fashion'],
  },
  {
    href: '/studio/image/tryon',
    icon: '👗', label: 'AI Try-On Fashion', badge: null, badgeBg: null,
    color: C.amber, bg: C.amb50,
    title: 'AI Try-On Fashion',
    tagline: 'Virtual fitting pakaian ke model',
    desc: 'Upload foto pakaian + foto model pilihanmu. AI secara otomatis mem-fitting pakaian ke model secara realistis — hasilnya seperti foto profesional.',
    useCase: 'Punya foto baju dan foto model — AI gabungkan jadi foto fashion yang menjual.',
    presets: ['Studio Fashion','Korean Fashion','Outdoor Streetwear','Luxury Fashion','Casual Daily'],
    time: '~25 detik',
    credit: '3 kredit/generate',
    bestFor: ['Brand fashion','Seller pakaian','Online boutique','Affiliator fashion'],
  },
  {
    href: '/studio/image/model-swap',
    icon: '🔄', label: 'Model Swap AI', badge: null, badgeBg: null,
    color: C.orange, bg: C.o50,
    title: 'Model Swap AI',
    tagline: 'Ganti model di foto fashion yang sudah ada',
    desc: 'Punya foto produk fashion tapi model-nya kurang cocok? AI ganti model di foto tersebut sesuai pilihan — tanpa perlu foto ulang.',
    useCase: 'Foto fashion dengan model barat → ganti ke model Indonesia/Hijab yang lebih relevan.',
    presets: ['Model Lokal','Hijab Model','Korean Female','Western Model','Gender Swap'],
    time: '~18 detik',
    credit: '2 kredit/generate',
    bestFor: ['Reseller fashion','Dropshipper','Affiliator','Brand yang rebranding'],
  },
  {
    href: '/studio/image/face-swap',
    icon: '😊', label: 'Face Swap AI', badge: null, badgeBg: null,
    color: C.cyan, bg: C.c50,
    title: 'Face Swap AI',
    tagline: 'Ganti wajah model dengan wajah sendiri',
    desc: 'Upload foto wajahmu — AI ganti wajah model di foto iklan dengan wajahmu secara natural. Cocok untuk personal branding dan creator ads.',
    useCase: 'Foto iklan dengan model → wajah diganti wajah owner untuk branding lebih personal dan dipercaya.',
    presets: ['Personal Branding','Creator Ads','Owner Face Branding'],
    time: '~10 detik',
    credit: '2 kredit/generate',
    bestFor: ['Affiliator personal branding','Owner usaha','Content creator','Seller dengan fanbase'],
  },
  {
    href: '/studio/image/enhancer',
    icon: '✨', label: 'Product Enhancer', badge: null, badgeBg: null,
    color: C.green, bg: C.grn50,
    title: 'Product Enhancer AI',
    tagline: 'Foto biasa → aesthetic premium siap jual',
    desc: 'Foto produk asal dari HP yang terlihat biasa? AI perbaiki pencahayaan, detail, estetika, dan tampilan keseluruhan menjadi visual premium.',
    useCase: 'Foto produk di lantai dengan cahaya jelek → clean ecommerce aesthetic siap upload Shopee.',
    presets: ['Shopee Clean','TikTok Viral','Luxury Ads','Korean Minimal','Bright Catalog','Dark Premium'],
    time: '~10 detik',
    credit: '1 kredit/generate',
    bestFor: ['Semua seller','UMKM','Dropshipper','Reseller dengan foto seadanya'],
  },
]

// ── Tooltip Popup Component ────────────────────────────────────
function ToolPopup({ tool, onClose, anchorRef }: {
  tool: typeof IMAGE_TOOLS[0]
  onClose: () => void
  anchorRef: React.RefObject<HTMLDivElement>
}) {
  const popupRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose, anchorRef])

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(15,23,42,.35)', backdropFilter:'blur(2px)' }} onClick={onClose}/>

      {/* Popup panel */}
      <div ref={popupRef} style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        zIndex:1001, width:'min(520px, 92vw)',
        background:C.white, borderRadius:'20px', overflow:'hidden',
        boxShadow:'0 20px 60px rgba(15,23,42,.2), 0 4px 16px rgba(15,23,42,.1)',
        animation:'popupIn .18s ease-out',
      }}>
        {/* Header */}
        <div style={{ padding:'20px 22px 16px', background:`linear-gradient(135deg, ${tool.color}12, ${tool.color}06)`, borderBottom:`1px solid ${tool.color}20`, position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:'14px', right:'14px', width:'28px', height:'28px', borderRadius:'50%', border:'none', background:`${tool.color}15`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:tool.color }}>
            <X size={13}/>
          </button>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'13px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:`linear-gradient(135deg, ${tool.color}, ${tool.color}cc)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', flexShrink:0 }}>
              {tool.icon}
            </div>
            <div>
              {tool.badge && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:tool.badgeBg??tool.color, color:'#fff', marginBottom:'4px' }}>
                  {tool.badge}
                </div>
              )}
              <div style={{ fontSize:'17px', fontWeight:700, color:C.slate900, marginBottom:'2px' }}>{tool.title}</div>
              <div style={{ fontSize:'12px', color:tool.color, fontWeight:600 }}>{tool.tagline}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'16px 22px', maxHeight:'60vh', overflowY:'auto' }}>
          {/* Description */}
          <p style={{ fontSize:'13px', color:C.slate700, lineHeight:1.7, marginBottom:'14px' }}>{tool.desc}</p>

          {/* Use Case */}
          <div style={{ padding:'10px 13px', background:`${tool.color}0a`, border:`1px solid ${tool.color}20`, borderRadius:'10px', marginBottom:'14px' }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:tool.color, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px', display:'flex', alignItems:'center', gap:'4px' }}>
              <Sparkles size={10}/> Contoh Use Case
            </div>
            <p style={{ fontSize:'12px', color:C.slate700, lineHeight:1.6, margin:0 }}>{tool.useCase}</p>
          </div>

          {/* Presets */}
          <div style={{ marginBottom:'14px' }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'7px' }}>Style Presets Tersedia</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {tool.presets.map(p => (
                <span key={p} style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'20px', background:tool.bg, color:tool.color, fontWeight:600, border:`1px solid ${tool.color}20` }}>{p}</span>
              ))}
            </div>
          </div>

          {/* Best for */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'7px' }}>Cocok Untuk</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {tool.bestFor.map(b => (
                <span key={b} style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'20px', background:C.slate100, color:C.slate600, fontWeight:500 }}>✓ {b}</span>
              ))}
            </div>
          </div>

          {/* Meta info */}
          <div style={{ display:'flex', gap:'10px', padding:'10px 0', borderTop:`1px solid ${C.slate100}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:C.slate500 }}>
              <Clock size={11} color={C.slate400}/>{tool.time}
            </div>
            <div style={{ width:'1px', background:C.slate200 }}/>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:C.slate500 }}>
              <Sparkles size={11} color={C.slate400}/>{tool.credit}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ padding:'14px 22px', borderTop:`1px solid ${C.slate100}`, display:'flex', gap:'8px' }}>
          <button onClick={onClose} style={{ padding:'10px 16px', borderRadius:'10px', border:`1.5px solid ${C.slate200}`, background:C.white, color:C.slate600, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Tutup
          </button>
          <Link href={tool.href} style={{ flex:1, textDecoration:'none' }}>
            <button style={{ width:'100%', padding:'10px 16px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg, ${tool.color}, ${tool.color}cc)`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', boxShadow:`0 4px 12px ${tool.color}35` }}>
              <Play size={13}/> Buka {tool.title}
            </button>
          </Link>
        </div>
      </div>
    </>
  )
}

// ── Image Tool Card ───────────────────────────────────────────
function ImageToolCard({ tool, onInfoClick }: {
  tool: typeof IMAGE_TOOLS[0]
  onInfoClick: (tool: typeof IMAGE_TOOLS[0], ref: React.RefObject<HTMLDivElement>) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ borderRadius:'13px', background:C.white, border:`1.5px solid ${hovered ? tool.color : C.slate200}`, overflow:'hidden', transition:'all .15s', transform:hovered?'translateY(-2px)':'translateY(0)', boxShadow:hovered?`0 8px 24px ${tool.color}18`:'none', cursor:'default' }}
      >
        {/* Color top bar */}
        <div style={{ height:'3px', background:`linear-gradient(90deg, ${tool.color}, ${tool.color}60)` }}/>

        <div style={{ padding:'13px 14px' }}>
          {/* Icon + badge */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'8px' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'11px', background:tool.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'21px' }}>
              {tool.icon}
            </div>
            {tool.badge && (
              <span style={{ fontSize:'8px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background:tool.badgeBg??tool.color, color:'#fff', marginTop:'3px', whiteSpace:'nowrap' }}>
                {tool.badge}
              </span>
            )}
          </div>

          {/* Label */}
          <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900, marginBottom:'3px' }}>{tool.label}</div>
          <div style={{ fontSize:'11px', color:C.slate500, lineHeight:1.4, marginBottom:'10px' }}>{tool.tagline}</div>

          {/* Preset pills (first 3) */}
          <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'10px' }}>
            {tool.presets.slice(0,3).map(p => (
              <span key={p} style={{ fontSize:'9px', padding:'2px 7px', borderRadius:'20px', background:tool.bg, color:tool.color, fontWeight:600 }}>{p}</span>
            ))}
            {tool.presets.length > 3 && (
              <span style={{ fontSize:'9px', padding:'2px 7px', borderRadius:'20px', background:C.slate100, color:C.slate500, fontWeight:500 }}>+{tool.presets.length-3}</span>
            )}
          </div>

          {/* Action row */}
          <div style={{ display:'flex', gap:'6px' }}>
            {/* Info popup button */}
            <button
              onClick={() => onInfoClick(tool, ref)}
              style={{ padding:'7px 10px', borderRadius:'8px', border:`1.5px solid ${C.slate200}`, background:C.white, fontSize:'11px', fontWeight:600, color:C.slate500, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', transition:'all .12s' }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = tool.color; (e.currentTarget).style.color = tool.color; (e.currentTarget).style.background = tool.bg }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = C.slate200; (e.currentTarget).style.color = C.slate500; (e.currentTarget).style.background = C.white }}
              title="Lihat penjelasan lengkap"
            >
              ℹ️ Info
            </button>

            {/* Go to tool */}
            <Link href={tool.href} style={{ flex:1, textDecoration:'none' }}>
              <button style={{ width:'100%', padding:'7px', borderRadius:'8px', border:'none', background:`linear-gradient(135deg, ${tool.color}, ${tool.color}cc)`, color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', boxShadow:`0 2px 8px ${tool.color}30`, fontFamily:"'DM Sans',sans-serif" }}>
                Buka <ChevronRight size={11}/>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AI Image Generator Section ────────────────────────────────
function AIImageSection() {
  const [activePopup, setActivePopup] = useState<typeof IMAGE_TOOLS[0] | null>(null)
  const [anchorRef, setAnchorRef] = useState<React.RefObject<HTMLDivElement> | null>(null)

  const handleInfo = (tool: typeof IMAGE_TOOLS[0], ref: React.RefObject<HTMLDivElement>) => {
    setActivePopup(tool)
    setAnchorRef(ref)
  }

  return (
    <>
      {/* Section header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🖼️</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>AI Image Generator</div>
            <div style={{ fontSize:'10px', color:C.slate500 }}>7 fitur · Klik ℹ️ untuk penjelasan lengkap</div>
          </div>
        </div>
        <Link href="/studio" style={{ fontSize:'11px', color:C.brand, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}>
          Lihat semua <ChevronRight size={11}/>
        </Link>
      </div>

      {/* Tools grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 185px), 1fr))', gap:'10px', marginBottom:'8px' }}>
        {IMAGE_TOOLS.map((t, i) => (
          <ImageToolCard key={i} tool={t} onInfoClick={handleInfo}/>
        ))}
      </div>

      {/* Hint text */}
      <div style={{ textAlign:'center', fontSize:'11px', color:C.slate400, marginBottom:'4px' }}>
        💡 Klik tombol <b>ℹ️ Info</b> pada setiap fitur untuk melihat penjelasan, contoh use case, dan preset lengkap
      </div>

      {/* Popup */}
      {activePopup && anchorRef && (
        <ToolPopup
          tool={activePopup}
          onClose={() => { setActivePopup(null); setAnchorRef(null) }}
          anchorRef={anchorRef as React.RefObject<HTMLDivElement>}
        />
      )}
    </>
  )
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────
export default function DashboardPage() {
  const { data:d, isLoading, refetch, isFetching } = useDashboard()
  const [copied, setCopied] = useState<string|null>(null)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 11) return 'Selamat pagi'
    if (h < 15) return 'Selamat siang'
    if (h < 18) return 'Selamat sore'
    return 'Selamat malam'
  })()

  const copyText = useCallback(async (text:string, id:string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(()=>setCopied(null),2000) } catch {}
  }, [])

  const dailyPct   = d?.dailyMax   ? Math.min(Math.round((d.dailyUsed??0)   /d.dailyMax  *100),100) : 0
  const monthlyPct = d?.monthlyMax ? Math.min(Math.round((d.monthlyUsed??0) /d.monthlyMax*100),100) : 0
  const isFree     = d?.store?.plan === 'free' || d?.store?.plan === 'starter'

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── GREETING ─────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'22px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          {isLoading ? (<><Shimmer w="190px" h="26px" r="5px"/><div style={{marginTop:'5px'}}><Shimmer w="250px" h="13px" r="4px"/></div></>) : (
            <>
              <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(20px,3.5vw,28px)', fontWeight:600, color:C.slate900, letterSpacing:'-0.02em', marginBottom:'3px' }}>
                {greeting}, {d?.user?.name?.split(' ')[0] || 'Seller'} 👋
              </h1>
              <p style={{ fontSize:'13px', color:C.slate500 }}>
                {d?.store?.niche
                  ? <>{NICHE_EMOJI[d.store.niche]||'🏪'} {d.store.name} · {SELLER_LABEL[d.store.sellerType||'']||'Seller'}</>
                  : 'Selamat datang di BeeSell AI — AI Sales Platform untuk Seller & Affiliator Indonesia'}
              </p>
            </>
          )}
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {d && (
            <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:700, background:isFree?C.slate100:C.pur50, color:isFree?C.slate500:PLAN_COLOR[d.store.plan]||C.slate500, border:`1px solid ${isFree?C.slate200:'#DDD6FE'}` }}>
              {d.store.planLabel}
            </span>
          )}
          <button onClick={()=>refetch()} disabled={isFetching} style={{ width:'32px', height:'32px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={13} color={C.slate400} style={{ animation:isFetching?'spin 1s linear infinite':'none' }}/>
          </button>
        </div>
      </div>

      {/* ── QUICK TOOLS ──────────────────────────────────────── */}
      <div style={{ marginBottom:'22px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
          <div style={{ fontSize:'12px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:'6px' }}>
            <Zap size={12} color={C.amber}/> Quick Tools — Visual AI
          </div>
          <Link href="/quick-tools" style={{ fontSize:'11px', color:C.brand, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}>Semua tools <ChevronRight size={11}/></Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 185px), 1fr))', gap:'8px' }}>
          {QUICK_TOOLS.map((t, i) => (
            <Link key={i} href={t.href} style={{ textDecoration:'none' }}>
              <div style={{ padding:'12px 13px', borderRadius:'12px', background:C.white, border:`1.5px solid ${C.slate200}`, cursor:'pointer', transition:'all .13s', position:'relative', overflow:'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=t.color; (e.currentTarget as HTMLElement).style.boxShadow=`0 4px 14px ${t.color}20`; (e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor=C.slate200; (e.currentTarget as HTMLElement).style.boxShadow='none'; (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}
              >
                {t.badge && <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'8px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background:t.color, color:'#fff' }}>{t.badge}</div>}
                <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'19px', marginBottom:'7px' }}>{t.icon}</div>
                <div style={{ fontSize:'12px', fontWeight:700, color:C.slate900, marginBottom:'2px' }}>{t.label}</div>
                <div style={{ fontSize:'10px', color:C.slate400, lineHeight:1.3 }}>{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── RESIZE SMART BANNER ──────────────────────────────── */}
      <Link href="/quick-tools/resize" style={{ textDecoration:'none', display:'block', marginBottom:'22px' }}>
        <div style={{ padding:'14px 18px', borderRadius:'15px', background:'linear-gradient(135deg, #059669 0%, #0D9488 50%, #0891B2 100%)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', boxShadow:'0 4px 18px rgba(5,150,105,.22)', cursor:'pointer', transition:'all .15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 26px rgba(5,150,105,.32)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 18px rgba(5,150,105,.22)' }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>📐</div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'2px' }}>
                <span style={{ fontSize:'14px', fontWeight:700 }}>Resize Smart AI</span>
                <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:'rgba(255,255,255,.25)' }}>NEW</span>
              </div>
              <div style={{ fontSize:'11px', opacity:.85 }}>1 foto → Shopee, Tokopedia, Instagram, TikTok + 15 platform — otomatis</div>
            </div>
          </div>
          <div style={{ padding:'7px 14px', borderRadius:'9px', background:'rgba(255,255,255,.2)', fontSize:'12px', fontWeight:700, flexShrink:0, display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' }}>
            Coba <ChevronRight size={12}/>
          </div>
        </div>
      </Link>

      {/* ── AI IMAGE GENERATOR ─────────────────────────────── */}
      <div style={{ marginBottom:'24px' }}>
        <AIImageSection/>
      </div>

      {/* ── QUOTA + STATS ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap:'10px', marginBottom:'22px' }}>
        <div style={{ padding:'16px', borderRadius:'14px', background:C.white, border:`1px solid ${dailyPct>=100?C.red+'40':C.slate200}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
            <div>
              <div style={{ fontSize:'10px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Kuota Hari Ini</div>
              {isLoading ? <Shimmer w="80px" h="24px"/> : (
                <div style={{ fontSize:'24px', fontWeight:800, color:dailyPct>=100?C.red:C.slate900, lineHeight:1 }}>
                  {d?.dailyUsed??0}<span style={{ fontSize:'13px', color:C.slate400, fontWeight:400 }}>/{d?.dailyMax??3}</span>
                </div>
              )}
            </div>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:`conic-gradient(${dailyPct>=100?C.red:C.brand} ${dailyPct*3.6}deg, ${C.slate100} 0deg)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:C.slate700 }}>{dailyPct}%</div>
            </div>
          </div>
          <div style={{ height:'4px', borderRadius:'2px', background:C.slate100, overflow:'hidden', marginBottom:'5px' }}>
            <div style={{ height:'100%', width:`${dailyPct}%`, background:dailyPct>=100?C.red:C.brand, borderRadius:'2px', transition:'width .5s' }}/>
          </div>
          <div style={{ fontSize:'10px', color:C.slate400 }}>Reset: {d?.dailyReset??'Tengah malam WIB'}</div>
        </div>

        <div style={{ padding:'16px', borderRadius:'14px', background:C.white, border:`1px solid ${monthlyPct>=90?C.amber+'40':C.slate200}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
            <div>
              <div style={{ fontSize:'10px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Kuota Bulan Ini</div>
              {isLoading ? <Shimmer w="80px" h="24px"/> : (
                <div style={{ fontSize:'24px', fontWeight:800, color:monthlyPct>=90?C.amber:C.slate900, lineHeight:1 }}>
                  {d?.monthlyUsed??0}<span style={{ fontSize:'13px', color:C.slate400, fontWeight:400 }}>/{d?.monthlyMax??50}</span>
                </div>
              )}
            </div>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:`conic-gradient(${monthlyPct>=90?C.amber:C.purple} ${monthlyPct*3.6}deg, ${C.slate100} 0deg)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:C.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:C.slate700 }}>{monthlyPct}%</div>
            </div>
          </div>
          <div style={{ height:'4px', borderRadius:'2px', background:C.slate100, overflow:'hidden', marginBottom:'5px' }}>
            <div style={{ height:'100%', width:`${monthlyPct}%`, background:monthlyPct>=90?C.amber:C.purple, borderRadius:'2px', transition:'width .5s' }}/>
          </div>
          <div style={{ fontSize:'10px', color:C.slate400 }}>Reset: {d?.monthlyReset??'—'}</div>
        </div>

        <div style={{ padding:'16px', borderRadius:'14px', background:C.white, border:`1px solid ${C.slate200}`, display:'flex', flexDirection:'column', gap:'10px' }}>
          {[
            { l:'Caption dibuat',   v:d?.captionsGenerated??0, ic:'✍️', c:C.brand,  bg:C.brand50 },
            { l:'Gambar dibuat',    v:d?.imageCount??0,        ic:'📸', c:C.purple, bg:C.pur50 },
            { l:'Konten bulan ini', v:d?.contentsThisMonth??0, ic:'📅', c:C.green,  bg:C.grn50 },
          ].map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'26px', height:'26px', borderRadius:'7px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>{s.ic}</div>
                <span style={{ fontSize:'12px', color:C.slate600 }}>{s.l}</span>
              </div>
              {isLoading ? <Shimmer w="24px" h="14px"/> : <span style={{ fontSize:'16px', fontWeight:800, color:C.slate900 }}>{s.v}</span>}
            </div>
          ))}
        </div>

        {isFree && !isLoading && (
          <Link href="/billing" style={{ textDecoration:'none' }}>
            <div style={{ padding:'16px', borderRadius:'14px', background:'linear-gradient(135deg, #1E1B4B, #7C3AED)', color:C.white, height:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:'120px', boxShadow:'0 4px 14px rgba(124,58,237,.25)', cursor:'pointer' }}>
              <div>
                <div style={{ fontSize:'20px', marginBottom:'6px' }}>🚀</div>
                <div style={{ fontSize:'13px', fontWeight:700, marginBottom:'3px' }}>Upgrade ke Basic</div>
                <div style={{ fontSize:'11px', opacity:.8 }}>15 caption/hari + gambar AI + scheduler</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:700, marginTop:'12px', opacity:.9 }}>
                Dari Rp 99K/bln <ArrowRight size={11}/>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ── CHART ──────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,220px)', gap:'10px', marginBottom:'22px' }}>
        <div style={{ padding:'18px', borderRadius:'14px', background:C.white, border:`1px solid ${C.slate200}`, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>Aktivitas 14 Hari</div>
              <div style={{ fontSize:'11px', color:C.slate400 }}>Caption + Gambar dibuat</div>
            </div>
            <div style={{ display:'flex', gap:'10px', fontSize:'9px', color:C.slate400 }}>
              <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><span style={{ width:'7px', height:'7px', borderRadius:'2px', background:C.brand, display:'inline-block' }}/>Caption</span>
              <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><span style={{ width:'7px', height:'7px', borderRadius:'2px', background:C.purple, display:'inline-block' }}/>Gambar</span>
            </div>
          </div>
          {isLoading ? <Shimmer h="120px" r="8px"/> : (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={d?.chartData?.slice(-14)??[]} barGap={2}>
                <XAxis dataKey="label" tick={{ fontSize:8, fill:C.slate400 }} axisLine={false} tickLine={false} interval={2}/>
                <YAxis hide allowDecimals={false}/>
                <Tooltip contentStyle={{ borderRadius:'8px', border:`1px solid ${C.slate200}`, fontSize:'11px', fontFamily:"'DM Sans',sans-serif" }} formatter={(v, n) => [
                  v ?? 0,
                  n === 'captions' ? 'Caption' : 'Gambar',
                ]}/>
                <Bar dataKey="captions" fill={C.brand}  radius={[3,3,0,0]} maxBarSize={18}/>
                <Bar dataKey="images"   fill={C.purple} radius={[3,3,0,0]} maxBarSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ padding:'18px', borderRadius:'14px', background:C.white, border:`1px solid ${C.slate200}` }}>
          <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900, marginBottom:'4px' }}>Per Platform</div>
          <div style={{ fontSize:'10px', color:C.slate400, marginBottom:'14px' }}>Distribusi konten</div>
          {isLoading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>{[1,2,3].map(i=><Shimmer key={i} h="28px" r="6px"/>)}</div>
          ) : (d?.platformStats?.length??0)===0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:C.slate400, fontSize:'12px' }}>
              <div style={{ fontSize:'24px', marginBottom:'5px' }}>📭</div>Belum ada data
            </div>
          ) : (
            d!.platformStats.slice(0,4).map((p,i)=>{
              const pct = d!.platformStats[0].count>0 ? Math.round(p.count/d!.platformStats[0].count*100) : 0
              return (
                <div key={i} style={{ marginBottom:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                    <span style={{ fontSize:'11px', color:C.slate700 }}>{PLATFORM_EMOJI[p.platform||'']||'📱'} {p.platform||'Lainnya'}</span>
                    <span style={{ fontSize:'11px', fontWeight:700, color:C.slate900 }}>{p.count}</span>
                  </div>
                  <div style={{ height:'3px', borderRadius:'2px', background:C.slate100 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:[C.brand,C.purple,C.green,C.amber][i]||C.brand, borderRadius:'2px' }}/>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── RECENT ───────────────────────────────────────────── */}
      <div style={{ marginBottom:'22px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
          <div style={{ fontSize:'12px', fontWeight:700, color:C.slate500, textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:'6px' }}>
            <Archive size={12} color={C.slate400}/> Konten Terbaru
          </div>
          <Link href="/library" style={{ fontSize:'11px', color:C.brand, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}>
            Lihat semua <ChevronRight size={11}/>
          </Link>
        </div>
        {isLoading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>{[1,2,3].map(i=><Shimmer key={i} h="54px" r="10px"/>)}</div>
        ) : (d?.recentContents?.length??0)===0 ? (
          <div style={{ padding:'28px', textAlign:'center', borderRadius:'14px', border:`1.5px dashed ${C.slate200}`, background:C.slate50 }}>
            <div style={{ fontSize:'28px', marginBottom:'8px' }}>✨</div>
            <div style={{ fontSize:'14px', fontWeight:700, color:C.slate900, marginBottom:'4px' }}>Belum ada konten</div>
            <div style={{ fontSize:'12px', color:C.slate500, marginBottom:'14px' }}>Mulai dari AI Image Generator untuk buat visual pertamamu</div>
            <Link href="/studio" style={{ padding:'8px 18px', background:`linear-gradient(135deg,${C.brand},${C.brand700})`, color:C.white, textDecoration:'none', borderRadius:'10px', fontSize:'12px', fontWeight:700 }}>
              🎨 Buka AI Studio
            </Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
            {d!.recentContents.map(c=>(
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 13px', borderRadius:'11px', background:C.white, border:`1px solid ${C.slate200}`, transition:'all .12s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.brand100;(e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(37,99,235,.06)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.slate200;(e.currentTarget as HTMLElement).style.boxShadow='none'}}
              >
                <div style={{ width:'36px', height:'36px', borderRadius:'8px', flexShrink:0, overflow:'hidden', background:c.type==='image'?C.pur50:C.brand50, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {c.media_url?<img src={c.media_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:c.type==='image'?<ImageIcon size={15} color={C.purple}/>:<FileText size={15} color={C.brand}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'13px', fontWeight:600, color:C.slate900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'2px' }}>
                    <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'4px', background:c.status==='ready'?C.grn50:c.status==='published'?C.brand50:C.slate100, color:c.status==='ready'?C.green:c.status==='published'?C.brand:C.slate500 }}>
                      {c.status==='ready'?'✓ Siap':c.status==='published'?'↑ Published':c.status==='scheduled'?'⏰ Terjadwal':c.status}
                    </span>
                    {c.primary_platform&&<span style={{ fontSize:'9px', color:C.slate400 }}>{PLATFORM_EMOJI[c.primary_platform]||'📱'} {c.primary_platform}</span>}
                    <span style={{ fontSize:'9px', color:C.slate300, marginLeft:'auto' }}>{new Date(c.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>
                  </div>
                </div>
                {c.type!=='image'&&(
                  <button onClick={()=>copyText(c.title,c.id)} style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.slate200}`, background:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {copied===c.id?<Check size={12} color={C.green}/>:<Copy size={12} color={C.slate400}/>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SHORTCUTS ────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,190px),1fr))', gap:'8px', marginBottom:'24px' }}>
        {[
          { href:'/library',             icon:<Archive size={14} color={C.slate500}/>,    label:'Asset Library',     desc:'Semua konten',      bg:C.slate100 },
          { href:'/settings/brand-kit',  icon:<Palette size={14} color={C.amber}/>,       label:'Brand Kit',         desc:'Tone, warna, gaya', bg:C.amb50 },
          { href:'/settings/connections',icon:<Settings size={14} color={C.green}/>,      label:'Koneksi Platform',  desc:'Instagram, TikTok', bg:C.grn50 },
          { href:'/billing',             icon:<CreditCard size={14} color={C.purple}/>,   label:'Billing & Credits', desc:'Plan & penggunaan',  bg:C.pur50 },
          { href:'/settings',            icon:<Settings size={14} color={C.slate500}/>,   label:'Pengaturan',        desc:'Profil & AI Memory',bg:C.slate100 },
        ].map(item=>(
          <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>
            <div style={{ padding:'11px 13px', borderRadius:'11px', background:C.white, border:`1px solid ${C.slate200}`, display:'flex', alignItems:'center', gap:'9px', transition:'all .12s', cursor:'pointer' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor=C.slate300}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=C.slate200}
            >
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{item.icon}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:C.slate900 }}>{item.label}</div>
                <div style={{ fontSize:'10px', color:C.slate400 }}>{item.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes popupIn { from{opacity:0;transform:translate(-50%,-48%) scale(.96)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        * { box-sizing:border-box }
        @media (max-width:767px) {
          div[style*="grid-template-columns:minmax(0,1fr) minmax(0,220px)"] { grid-template-columns:1fr!important }
        }
      `}</style>
    </div>
  )
}