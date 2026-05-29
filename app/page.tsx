'use client'
// app/page.tsx — BeeSell AI Landing Page v4
// Light theme · #F59E0B Bee Amber · Full responsive · Hero video+dashboard · Results gallery · FAQ

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  ArrowRight,
  Zap,
  Star,
  ChevronRight,
  ChevronLeft,
  Play,
  Menu,
  CircleX
} from 'lucide-react'
import Image from 'next/image'
// ── Design Tokens ─────────────────────────────────────────────
const C = {
  amber: '#F59E0B', amberDk: '#D97706', amberLt: '#FEF3C7', amberXlt: '#FFFBEB',
  amberGlow: 'rgba(245,158,11,.18)',
  white: '#FFFFFF', bg: '#FAFAF8', bgAlt: '#F4F3EF', border: '#E5E2D8',
  ink: '#18170F', inkSub: '#3B3830', inkMuted: '#66625A', inkDim: '#9E9A93',
  green: '#059669', greenLt: '#ECFDF5',
  purple: '#7C3AED', purpleLt: '#F5F3FF',
  sh: '0 1px 3px rgba(24,23,15,.05)',
  sm: '0 4px 16px rgba(24,23,15,.07)',
  lg: '0 16px 48px rgba(24,23,15,.11)',
  sa: '0 8px 24px rgba(245,158,11,.26)',
}
const B = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  amberGlow:'rgba(245,158,11,.20)', amberMid:'#FBBF24',
  white:'#FFFFFF', bg:'#FAFAF8', bgAlt:'#F5F4F0', border:'#E8E4DC',
  ink:'#1A1810', inkSub:'#3D3830', inkMuted:'#6B6459', inkDim:'#9B9289',
  purple:'#7C3AED', purpleLt:'#F5F3FF', green:'#059669', greenLt:'#ECFDF5',
  ss:'0 1px 3px rgba(26,24,16,.06),0 1px 2px rgba(26,24,16,.04)',
  sm:'0 4px 16px rgba(26,24,16,.08),0 2px 6px rgba(26,24,16,.04)',
  lg:'0 20px 56px rgba(26,24,16,.13),0 6px 20px rgba(26,24,16,.06)',
  sa:'0 8px 28px rgba(245,158,11,.28)',
}

// ── Data ──────────────────────────────────────────────────────
const PLATFORMS = ['Shopee','Tokopedia','TikTok Shop','Lazada','Instagram','Facebook','WhatsApp','YouTube']

// ── Data ─────────────────────────────────────────────────────
const TOOLS = [
  { icon: '🪄', label: 'Remove BG',    color: '#7C3AED', lt: '#F5F3FF', desc: 'Hapus background 1 detik. PNG transparan siap marketplace.' },
  { icon: '🔍', label: 'AI Upscale',   color: '#2563EB', lt: '#EFF6FF', desc: 'Foto low-res → 4K HD. Tajam, bebas noise.' },
  { icon: '📐', label: 'Resize Smart', color: '#059669', lt: '#ECFDF5', desc: '1 foto → 20 ukuran Shopee, TikTok, IG, YouTube otomatis.' },
  { icon: '💡', label: 'AI Relight',   color: '#D97706', lt: '#FEF3C7', desc: 'Perbaiki pencahayaan gelap. Studio, natural, dramatic.' },
  { icon: '✏️', label: 'Remove Object',color: '#DB2777', lt: '#FDF2F8', desc: 'Hapus watermark, tangan, latar berantakan.' },
]


const AI_IMAGES = [
  { icon: '🌟', label: 'AI Photoshoot',    desc: 'Foto produk → lifestyle premium. 10 preset: Luxury, Korean, Cinematic.', badge: 'Terpopuler', color: C.amber,   href: '/studio/image/photoshoot' },
  { icon: '📦', label: 'AI Packshot',      desc: 'Studio ecommerce otomatis. 17 preset: White Studio, Floating Product.', badge: null,         color: '#7C3AED', href: '/studio/image/packshot' },
  { icon: '🧑‍🦰', label: 'Product to Model', desc: 'Produk → foto model. 16 model lokal Indonesia: hijab, anak, global.',   badge: 'New',         color: '#DB2777', href: '/studio/image/product-to-model' },
  { icon: '👗', label: 'AI Try-On',        desc: 'Upload pakaian + model → AI fitting otomatis. Pose & identitas terjaga.', badge: null,         color: '#7C3AED', href: '/studio/image/tryon' },
  { icon: '🔄', label: 'Model Swap',       desc: 'Ganti model foto fashion. Lokal, hijab, western.',                        badge: null,         color: '#059669', href: '/studio/image/model-swap' },
  { icon: '😊', label: 'Face Swap',        desc: 'Ganti wajah model. Owner branding, affiliate personal branding.',         badge: null,         color: '#2563EB', href: '/studio/image/face-swap' },
  { icon: '✨', label: 'AI Enhancer',      desc: 'Foto rumah → aesthetic premium: Shopee Clean, TikTok Viral.',             badge: null,         color: '#9333EA', href: '/studio/image/enhancer' },
]

const VIDEO_ENGINE = [
  { icon:'🎬', label:'Product Video AI',    desc:'Video produk sinematik otomatis dari foto. Tanpa kamera, tanpa editing.' },
  { icon:'📱', label:'UGC Video Generator', desc:'Unboxing, review, daily use — gaya UGC authentic yang convert.' },
  { icon:'🎵', label:'TikTok Reels AI',     desc:'Script + visual TikTok/Reels siap posting. Foto jadi video viral.' },
]

const MARKETING = [
  { icon: '✍️', label: 'Caption',       desc: 'Soft selling, storytelling' },
  { icon: '🎣', label: 'Hook',          desc: 'FOMO, curiosity, emotional' },
  { icon: '🎯', label: 'CTA',           desc: 'Urgency, affiliate, WA' },
  { icon: '📋', label: 'Deskripsi',     desc: 'SEO marketplace optimized' },
  { icon: '#️⃣', label: 'Hashtag',     desc: 'TikTok, IG, Shopee trending' },
  { icon: '📈', label: 'Ad Copy',       desc: 'FB Ads, TikTok Ads' },
]

const STEPS = [
  { num: '1', icon: '📸', title: 'Upload foto produk',       desc: 'Drag & drop. PNG, JPG, WEBP.' },
  { num: '2', icon: '🎨', title: 'Pilih fitur & preset',    desc: '7 AI Image, 5 Quick Tools, 3 Video.' },
  { num: '3', icon: '⚡', title: 'Generate — 20-40 detik',  desc: 'AI proses & generate scene.' },
  { num: '4', icon: '🚀', title: 'Download + marketing',    desc: 'PNG HD + caption & hashtag.' },
]

// ── Pricing — Updated ──────────────────────────────────────────
const PRICING = [
  {
    id: 'starter', name: 'Starter', price: 0, badge: null, highlight: false,
    cta: 'Coba Gratis', href: '/register', note: '5 generate total (lifetime, 1 HP + 1 email)',
    features: [
      { ok: true,  t: '5 generate TOTAL seumur hidup' },
      { ok: true,  t: 'Remove BG (3x/hari)' },
      { ok: true,  t: 'Resize 3 preset' },
      { ok: true,  t: 'Upscale 2× only' },
      { ok: true,  t: 'Watermark wajib' },
      { ok: false, t: 'AI Photoshoot & Packshot' },
      { ok: false, t: 'Product to Model & Try-On' },
      { ok: false, t: 'Marketing Tools' },
    ],
  },
  {
    id: 'basic', name: 'Basic', price: 149_000, badge: '🐝 UMKM', highlight: false,
    cta: '7 Hari Gratis', href: '/register?plan=basic', note: '200 generate/bulan',
    features: [
      { ok: true,  t: '200 generate/bulan' },
      { ok: true,  t: 'Semua 5 Quick Tools' },
      { ok: true,  t: 'AI Photoshoot (10 preset)' },
      { ok: true,  t: 'AI Packshot (17 preset)' },
      { ok: true,  t: 'Caption + Hook + CTA + Hashtag' },
      { ok: true,  t: 'Tanpa watermark' },
      { ok: false, t: 'Product to Model & Try-On' },
      { ok: false, t: 'Video Generator' },
    ],
  },
  {
    id: 'pro', name: 'Pro', price: 399_000, badge: '🔥 Terlaris', highlight: true,
    cta: '7 Hari Gratis', href: '/register?plan=pro', note: '400 img + 5 video + 20 try-on/bln',
    features: [
      { ok: true, t: '400 generate/bulan' },
      { ok: true, t: '5 video + 20 try-on/bulan' },
      { ok: true, t: 'Semua 7 AI Image fitur' },
      { ok: true, t: 'Product to Model (16 model)' },
      { ok: true, t: 'AI Try-On + Face Swap' },
      { ok: true, t: 'Video AI (Product, UGC, Reels)' },
      { ok: true, t: 'Semua Marketing Tools + Ad Copy' },
      { ok: true, t: 'Tanpa watermark' },
    ],
  },
  {
    id: 'business', name: 'Business', price: 999_000, badge: null, highlight: false,
    cta: 'Hubungi Sales', href: '/register?plan=business', note: '1.000 img + 20 video + 100 try-on',
    features: [
      { ok: true, t: '1.000 generate/bulan' },
      { ok: true, t: '20 video + 100 try-on/bulan' },
      { ok: true, t: 'Semua fitur Pro' },
      { ok: true, t: 'Team workspace 5 seat' },
      { ok: true, t: 'Bulk Engine (100 produk/batch)' },
      { ok: true, t: 'Auto-Post Scheduler' },
      { ok: true, t: 'API Access + White Label' },
    ],
  },
]
const ADDONS = [
  { icon: '🎬', label: 'Video Pack 5x',    price: 89_000,  qty: '5 video AI',       badge: null },
  { icon: '🎬', label: 'Video Pack 10x',   price: 149_000, qty: '10 video AI',      badge: 'Hemat' },
  { icon: '👗', label: 'Try-On Pack 20x',  price: 99_000,  qty: '20 AI Try-On',     badge: null },
  { icon: '😊', label: 'Face Swap 10x',    price: 59_000,  qty: '10 swap',          badge: null },
  { icon: '⚡', label: 'Topup 50 gen',     price: 49_000,  qty: '50 generate',      badge: null },
  { icon: '⚡', label: 'Topup 200 gen',    price: 149_000, qty: '200 generate',     badge: 'Hemat' },
]
const ADDONS_COMINGSOON = [
  { icon:'📅', label:'Auto-Post Scheduler',        price:99_000,  desc:'Jadwal posting ke IG, TikTok, Shopee, FB', eta:'Q2 2025' },
  { icon:'⚡', label:'Bulk Content Engine (Pro)',  price:299_000, desc:'100 produk sekaligus dalam 1 batch',        eta:'Q3 2025' },
  { icon:'🔌', label:'API Access',                price:499_000, desc:'10.000 API call/bln untuk integrasi',       eta:'Q4 2025' },
  { icon:'🏷️', label:'White Label',               price:999_000, desc:'Custom branding, hapus logo BeeSell',      eta:'Q4 2025' },
]
// Feature lock matrix — used across codebase
const PLAN_FEATURES: Record<string, Record<string, boolean|string>> = {
  starter: {
    removeBg:'limited', upscale:'2x', resize:'3', relight:false, removeObject:false,
    photoshoot:false, packshot:false, productToModel:false, tryon:false,
    modelSwap:false, faceSwap:false, enhancer:false,
    videoProduct:false, videoUgc:false, videoTiktok:false,
    caption:false, hook:false, cta:false, desc:false, hashtag:false, adCopy:false,
    watermark:true, bulkEngine:false, teamWorkspace:false, apiAccess:false,
  },
  basic: {
    removeBg:true, upscale:'4x', resize:true, relight:true, removeObject:true,
    photoshoot:true, packshot:true, productToModel:false, tryon:false,
    modelSwap:false, faceSwap:false, enhancer:true,
    videoProduct:false, videoUgc:false, videoTiktok:false,
    caption:true, hook:true, cta:true, desc:true, hashtag:true, adCopy:false,
    watermark:false, bulkEngine:false, teamWorkspace:false, apiAccess:false,
  },
  pro: {
    removeBg:true, upscale:'4x', resize:true, relight:true, removeObject:true,
    photoshoot:true, packshot:true, productToModel:true, tryon:true,
    modelSwap:true, faceSwap:true, enhancer:true,
    videoProduct:true, videoUgc:true, videoTiktok:true,
    caption:true, hook:true, cta:true, desc:true, hashtag:true, adCopy:true,
    watermark:false, bulkEngine:false, teamWorkspace:false, apiAccess:false,
  },
  business: {
    removeBg:true, upscale:'4x', resize:true, relight:true, removeObject:true,
    photoshoot:true, packshot:true, productToModel:true, tryon:true,
    modelSwap:true, faceSwap:true, enhancer:true,
    videoProduct:true, videoUgc:true, videoTiktok:true,
    caption:true, hook:true, cta:true, desc:true, hashtag:true, adCopy:true,
    watermark:false, bulkEngine:true, teamWorkspace:true, apiAccess:true,
  },
}
const TESTIMONIALS = [
  { name: 'Sari Dewi',       role: 'Seller Skincare · Shopee',  avatar: '👩',  stars: 5, text: 'Foto produk saya langsung kayak dari studio mahal. Orderan naik 3x dalam seminggu!' },
  { name: 'Rizky Pratama',   role: 'Affiliator · TikTok',       avatar: '👨',  stars: 5, text: 'Product to Model AI gila sih. Upload kaos, langsung jadi foto model realistis. Konversi naik signifikan.' },
  { name: 'Fitri Handayani', role: 'Brand Owner · Tokopedia',   avatar: '🧕',  stars: 5, text: 'Try-On Fashion mengubah workflow saya. Ga perlu sewa model beneran. Hemat jutaan per bulan!' },
  { name: 'Bagas Saputra',   role: 'Reseller Fashion · Shopee', avatar: '👨‍💻', stars: 5, text: 'Remove BG-nya 1 detik langsung beres. Dulu bayar editor Rp50rb per foto. Sekarang unlimited!' },
  { name: 'Dewi Nurlaela',   role: 'UMKM Kosmetik · IG',        avatar: '💄',  stars: 5, text: 'Caption Generator paham banget bahasa jualan Indonesia. Engagement naik 4x!' },
  { name: 'Ahmad Fauzi',     role: 'Dropshipper · TikTok Shop', avatar: '📦',  stars: 5, text: 'Konten 1 bulan bisa dibuat dalam sehari. ROI langsung keliatan dari minggu pertama.' },
]

const STATS = [
  { num:'50K+', label:'Seller aktif' },
  { num:'2M+',  label:'Konten dibuat' },
  { num:'3.8×', label:'Rata-rata ROAS naik' },
  { num:'< 3m', label:'Per konten' },
]

// ── Coming Soon ────────────────────────────────────────────────
const COMING_SOON = [
  { icon:'🤖', label:'AI Avatar Video',     desc:'Video presenter AI berbicara otomatis. Upload produk → avatar presentasi.', eta:'Q1 2025', phase:'Phase 2' },
  { icon:'🗣️', label:'Voice AI Seller',    desc:'Ubah teks caption menjadi narasi suara natural bahasa Indonesia.',          eta:'Q1 2025', phase:'Phase 2' },
  { icon:'📊', label:'Auto Analytics AI',   desc:'Dashboard analitik konten otomatis — engagement, CTR, best time to post.',  eta:'Q2 2025', phase:'Phase 2' },
  { icon:'📅', label:'Auto-Post Scheduler', desc:'Jadwalkan dan posting otomatis ke semua platform dari satu dashboard.',     eta:'Q2 2025', phase:'Phase 2' },
  { icon:'🏷️', label:'Brand Center AI',    desc:'Kelola brand identity, color palette, tone, dan template kustom.',           eta:'Q2 2025', phase:'Phase 3' },
  { icon:'👥', label:'Team Workspace',      desc:'Kolaborasi tim dalam satu workspace. Role-based access untuk agency.',      eta:'Q3 2025', phase:'Phase 3' },
  { icon:'⚡', label:'Bulk Content Engine', desc:'Generate 10-100 konten sekaligus dari satu batch upload produk.',           eta:'Q3 2025', phase:'Phase 3' },
  { icon:'🔌', label:'API & White Label',   desc:'Integrasikan BeeSell AI ke dalam platform atau aplikasi milikmu.',          eta:'Q4 2025', phase:'Phase 4' },
]

// ── FAQs ──────────────────────────────────────────────────────
const FAQS = [
  { q: 'Apakah bisa dipakai pemula tanpa skill design?', a: 'Bisa. Cukup upload foto produk dan klik preset — BeeSell AI proses sisanya. Tidak perlu belajar editing atau copywriting.' },
  { q: 'Berapa lama proses generate AI?', a: 'Quick Tools: 1-10 detik. AI Packshot & Photoshoot: 10-30 detik. Product to Model & Try-On: 20-50 detik. Video AI: 1-3 menit.' },
  { q: 'Apa perbedaan Starter vs Basic?', a: 'Starter: 5 generate TOTAL seumur hidup (coba sekali, watermark wajib). Basic: 200 generate per bulan, semua Quick Tools, Photoshoot & Packshot, tanpa watermark.' },
  { q: 'Marketplace apa yang didukung?', a: 'Shopee, Tokopedia, TikTok Shop, Lazada, Instagram, Facebook, WhatsApp Catalog, YouTube — semua ada preset ukurannya di Resize Smart AI.' },
  { q: 'Apakah bisa cancel kapan saja?', a: 'Ya. Tidak ada kontrak. Cancel dari dashboard, langsung efektif, tanpa biaya tambahan.' },
  { q: 'Apakah data foto produk aman?', a: 'Ya. Foto yang diupload diproses secara aman dan tidak digunakan untuk melatih model AI pihak ketiga.' },
]

// ── Swipe Carousel ───────────────────────────────────────────
function Carousel({
  items, renderItem, peek = 20, gap = 10, className
}: {
  items: any[]
  renderItem: (item: any, idx: number, active: boolean) => React.ReactNode
  peek?: number
  gap?: number
  className?: string
}) {
  const [idx, setIdx] = useState(0)
  const startX = useRef(0)
  const startIdx = useRef(0)
 
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startIdx.current = idx
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) > 44) {
      if (dx < 0) setIdx(i => Math.min(i + 1, items.length - 1))
      else setIdx(i => Math.max(i - 1, 0))
    }
  }
 
  return (
    <div className={className}>
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ overflow: 'hidden', paddingRight: `${peek}px`, cursor: 'grab' }}
      >
        <div style={{
          display: 'flex', gap: `${gap}px`,
          transition: 'transform .35s cubic-bezier(.25,.46,.45,.94)',
          transform: `translateX(calc(-${idx} * (100% + ${gap}px - ${peek}px / ${items.length})))`
        }}>
          {items.map((item, i) => (
            <div key={i} style={{ flexShrink: 0, width: `calc(100% - ${peek}px)`, transition: 'transform .3s, opacity .3s', transform: i === idx ? 'scale(1)' : 'scale(.97)', opacity: i === idx ? 1 : .65 }}>
              {renderItem(item, i, i === idx)}
            </div>
          ))}
        </div>
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '12px' }}>
        {items.map((_, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)}
            style={{ width: i === idx ? '18px' : '5px', height: '5px', borderRadius: '3px', border: 'none', background: i === idx ? C.amber : C.border, cursor: 'pointer', transition: 'all .22s', padding: 0 }} />
        ))}
      </div>
    </div>
  )
}

 
// ── InView ───────────────────────────────────────────────────
function useInView(thr = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: thr })
    obs.observe(el); return () => obs.disconnect()
  }, [thr])
  return { ref, inView: v }
}

// ── Helpers ──────────────────────────────────────────────────
const W = { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' } as const
 
function SL({ text }: { text: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: C.amberLt, border: `1px solid ${C.amber}40`, fontSize: '10px', fontWeight: 700, color: C.amberDk, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
      🐝 {text}
    </div>
  )
}

// ── Animated section ─────────────────────────────────────────
function Sec({ children, id, bg, py = '56px' }: { children: React.ReactNode; id?: string; bg?: string; py?: string }) {
  const { ref, inView } = useInView()
  return (
    <section id={id} ref={ref} style={{ background: bg ?? C.bg, padding: `${py} 0`, transition: 'opacity .55s, transform .55s', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)' }}>
      {children}
    </section>
  )
}


function SectionLabel({ text }: { text:string }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'5px 14px', borderRadius:'99px', background:B.amberLt, border:`1px solid ${B.amber}40`, fontSize:'11px', fontWeight:700, color:B.amberDk, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'14px' }}>
      🐝 {text}
    </div>
  )
}
function Section({ children, id, bg, py }: { children:React.ReactNode; id?:string; bg?:string; py?:string }) {
  const { ref, inView } = useInView()
  return (
    <section id={id} ref={ref} style={{ background:bg??B.bg, padding:`${py??'72px'} 0`, transition:'opacity .65s, transform .65s', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(24px)' }}>
      {children}
    </section>
  )
}

// ── Particle BG ───────────────────────────────────────────────
function HoneycombBg() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      <div style={{ position:'absolute', top:'-15%', right:'-8%', width:'min(700px,80vw)', height:'min(700px,80vw)', borderRadius:'50%', background:`radial-gradient(circle, ${B.amberLt} 0%, transparent 70%)`, opacity:.8 }}/>
      <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:'min(500px,60vw)', height:'min(500px,60vw)', borderRadius:'50%', background:`radial-gradient(circle, ${B.amberLt} 0%, transparent 70%)`, opacity:.5 }}/>
      {Array.from({length:30}).map((_,i) => (
        <div key={i} style={{ position:'absolute', left:`${(i*17.3+13)%100}%`, top:`${(i*23.7+7)%100}%`, width:i%3===0?'7px':i%3===1?'4px':'2px', height:i%3===0?'7px':i%3===1?'4px':'2px', borderRadius:'50%', background:i%4===0?B.amber:i%4===1?B.amberMid:B.border, opacity:i%4===0?.5:.25, animation:`float ${3+i%4}s ease-in-out ${i*.18}s infinite alternate` }}/>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// NAVBAR
// ════════════════════════════════════════════════════════════
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
 
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: scrolled ? 'rgba(250,250,248,.96)' : C.bg, backdropFilter: scrolled ? 'blur(18px)' : 'none', borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`, transition: 'all .22s', boxShadow: scrolled ? C.sh : 'none' }}>
        <div style={{ ...W, padding: '11px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src="/logo-beesell-white.png"
              alt="BeeSell AI"
              width={160}
              height={40}
              style={{
                width: 'auto',
                height: '30px',
                objectFit: 'contain'
              }}
            />
            <span style={{ display: 'none', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: C.sa }}>🐝</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em' }}>BeeSell<span style={{ color: C.amber }}> AI</span></span>
            </span>
          </Link>
 
          {/* Desktop nav */}
          <nav className="nav-d" style={{ display: 'flex', gap: '24px', flex: 1, justifyContent: 'center' }}>
            {[['#fitur', 'Fitur'], ['#cara-kerja', 'Cara Kerja'], ['#harga', 'Harga'], ['#faq', 'FAQ']].map(([h, l]) => (
              <a key={h} href={h} style={{ fontSize: '13px', fontWeight: 500, color: C.inkMuted, textDecoration: 'none', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.ink}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.inkMuted}>{l}</a>
            ))}
          </nav>
 
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center', marginLeft: 'auto' }}>
            <Link href="/login" className="nav-d" style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: C.inkMuted, textDecoration: 'none', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.white }}>Masuk</Link>
            <Link href="/register" style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, color: '#fff', textDecoration: 'none', borderRadius: '9px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, boxShadow: C.sa, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', transition: 'transform .15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
              Mulai Gratis 🐝
            </Link>
            {/* Hamburger — mobile only */}
            <button onClick={() => setOpen(p => !p)} className="nav-m" style={{ width: '34px', height: '34px', borderRadius: '7px', border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center' }}>
              {open ? <CircleX size={16} color={C.inkMuted} /> : <Menu size={16} color={C.inkMuted} />}
            </button>
          </div>
        </div>
      </header>
 
      {/* Mobile menu overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 190, background: 'rgba(24,23,15,.5)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)}>
          <div style={{ position: 'absolute', top: '56px', left: 0, right: 0, background: C.white, borderBottom: `1px solid ${C.border}`, padding: '12px 20px 20px', boxShadow: C.lg }} onClick={e => e.stopPropagation()}>
            {[['#fitur', '✨ Fitur'], ['#cara-kerja', '🎯 Cara Kerja'], ['#harga', '💰 Harga'], ['#faq', '❓ FAQ']].map(([h, l]) => (
              <a key={h} href={h} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', fontSize: '15px', fontWeight: 600, color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.border}` }}>
                {l} <ChevronRight size={16} color={C.inkDim} />
              </a>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
              <Link href="/login" onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: '12px', borderRadius: '10px', border: `1.5px solid ${C.border}`, fontSize: '14px', fontWeight: 600, color: C.inkMuted, textDecoration: 'none' }}>Masuk</Link>
              <Link href="/register" onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: '12px', borderRadius: '10px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, fontSize: '14px', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>Mulai Gratis</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
 

// ════════════════════════════════════════════════════════════
// HERO — Mobile: stacked card stack, Desktop: 2-col
// ════════════════════════════════════════════════════════════
function Hero() {
  const [slide, setSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()

    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
  if (!isMobile) return

  const timer = setInterval(() => {
    setSlide(prev => (prev + 1) % 3)
  }, 3500)

  return () => clearInterval(timer)
}, [isMobile])
  
  const resultCards = [
    { before: '📦', after: '🌟', label: 'AI Photoshoot', sub: 'Luxury Studio', color: C.amber },
    { before: '📸', after: '🧑‍🦰', label: 'Product to Model', sub: 'Wanita Asia Muda', color: '#DB2777' },
    { before: '👗', after: '👗', label: 'AI Try-On', sub: 'Fitting otomatis', color: C.purple },
    { before: '🖼️', after: '✨', label: 'AI Enhancer', sub: 'TikTok Viral', color: '#059669' },
  ]
 
  return (
    <section style={{ position: 'relative', background: C.bg, padding: 'clamp(32px,6vw,72px) 0 clamp(36px,7vw,80px)', overflow: 'hidden' }}>
      {/* BG blobs */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-15%', width: 'min(600px,80vw)', height: 'min(600px,80vw)', borderRadius: '50%', background: `radial-gradient(circle,${C.amberLt},transparent 68%)`, opacity: .7 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 'min(400px,60vw)', height: 'min(400px,60vw)', borderRadius: '50%', background: `radial-gradient(circle,${C.amberLt},transparent 70%)`, opacity: .5 }} />
      </div>
 
      <div style={{ ...W, position: 'relative', zIndex: 1 }}>
        <div className="hero-grid">
          {/* ── TEXT ─────────────────────────── */}
          <div className="hero-text">
            {/* New badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 12px', borderRadius: '99px', background: C.white, border: `1px solid ${C.border}`, boxShadow: C.sh, fontSize: '11px', fontWeight: 700, color: C.inkMuted, marginBottom: '18px', animation: 'fadeDown .5s ease both' }}>
              <span style={{ padding: '2px 7px', borderRadius: '99px', background: C.amberLt, color: C.amberDk, fontSize: '10px', fontWeight: 800 }}>🆕 NEW</span>
              AI Try-On Fashion
              <ChevronRight size={10} color={C.amber} />
            </div>
 
            <h1 style={{ fontSize: 'clamp(30px,5.5vw,60px)', fontWeight: 900, color: C.ink, letterSpacing: '-0.04em', lineHeight: 1.07, marginBottom: '14px', animation: 'fadeUp .6s .1s ease both' }}>
              AI Visual untuk<br />
              <span style={{ color: C.amber }}>Seller & Affiliator</span><br />
              Indonesia
            </h1>
 
            <p style={{ fontSize: 'clamp(13px,1.6vw,16px)', color: C.inkMuted, lineHeight: 1.7, marginBottom: '18px', animation: 'fadeUp .6s .2s ease both' }}>
              Foto produk biasa → visual premium siap jual dalam 20 detik. <strong style={{ color: C.ink }}>Tanpa skill design.</strong>
            </p>
 
            {/* Feature chips — scrollable */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', animation: 'fadeUp .6s .25s ease both' } as React.CSSProperties}>
              {['🌟 Photoshoot', '📦 Packshot', '🧑‍🦰 To Model', '👗 Try-On', '🪄 Remove BG'].map(f => (
                <span key={f} style={{ fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '99px', background: C.white, border: `1px solid ${C.border}`, color: C.inkMuted, boxShadow: C.sh, whiteSpace: 'nowrap', flexShrink: 0 }}>{f}</span>
              ))}
            </div>
 
            {/* CTAs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px', animation: 'fadeUp .6s .3s ease both' }}>
              <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '13px 22px', borderRadius: '12px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: C.sa, transition: 'transform .2s', flex: '1 0 auto' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                <Zap size={14} /> Mulai Gratis
              </Link>
              <a href="#cara-kerja" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '13px 18px', borderRadius: '12px', background: C.white, color: C.ink, fontSize: '14px', fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border}`, boxShadow: C.sh }}>
                <Play size={13} fill={C.ink} /> Demo
              </a>
            </div>
 
            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', animation: 'fadeUp .6s .35s ease both' }}>
              <div style={{ display: 'flex' }}>
                {['👩', '👨', '🧕', '👩‍💻', '👨‍💼'].map((av, i) => (
                  <div key={i} style={{ width: '26px', height: '26px', borderRadius: '50%', background: C.amberLt, border: `2px solid ${C.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', marginLeft: i > 0 ? '-7px' : '0', zIndex: 5 - i }}>{av}</div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '2px' }}>{[...Array(5)].map((_, i) => <Star key={i} size={11} fill={C.amber} color={C.amber} />)}</div>
                <div style={{ fontSize: '10px', color: C.inkMuted }}>50.000+ seller Indonesia</div>
              </div>
            </div>
          </div>
 
          {/* ── PANEL (right / top on mobile) ─ */}
          <div className="hero-panel">
            {/* Slide tabs */}
            <div style={{ display: isMobile ? 'none' : 'flex', gap: '3px', background: C.bgAlt, borderRadius: '10px', padding: '3px', marginBottom: '10px', border: `1px solid ${C.border}` }}>
              {['🎬 Video', '🖥️ Dashboard', '✨ Hasil'].map((l, i) => (
                <button key={i} type="button" onClick={() => setSlide(i)}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: '7px', border: 'none', background: slide === i ? C.white : 'transparent', fontSize: '10px', fontWeight: slide === i ? 700 : 500, color: slide === i ? C.ink : C.inkMuted, cursor: 'pointer', transition: 'all .15s', boxShadow: slide === i ? C.sh : 'none' }}>{l}</button>
              ))}
            </div>
 
            {/* S0: Video fallback */}
            {slide === 0 && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: C.lg, border: `1.5px solid ${C.border}`, position: 'relative', background: C.amberXlt, minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: C.sa }}>🐝</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: C.ink, marginBottom: '4px' }}>Demo Video BeeSell AI</div>
                  <div style={{ fontSize: '11px', color: C.inkMuted }}>Taruh <code style={{ background: C.bgAlt, padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>demo-video.mp4</code> di /public/</div>
                </div>
                {[{ icon: '🌟', l: 'AI Photoshoot', s: 'Luxury Studio' }, { icon: '🧑‍🦰', l: 'Product to Model', s: '16 model' }, { icon: '👗', l: 'AI Try-On', s: 'Auto fitting' }].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,.8)', border: `1px solid ${C.border}`, width: '100%', maxWidth: '220px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: C.amberLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink }}>{item.l}</div>
                      <div style={{ fontSize: '9px', color: C.inkMuted }}>{item.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* S1: Dashboard mockup */}
            {slide === 1 && (
              <div style={{ borderRadius: '14px', overflow: 'hidden', boxShadow: C.lg, border: `1px solid ${C.border}` }}>
                <div style={{ background: C.bgAlt, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: '4px' }}>{['#FF5F57', '#FFBD2E', '#28C840'].map(cc => <div key={cc} style={{ width: '9px', height: '9px', borderRadius: '50%', background: cc }} />)}</div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ padding: '2px 12px', borderRadius: '4px', background: C.white, border: `1px solid ${C.border}`, fontSize: '9px', color: C.inkDim }}>🔒 app.beesell.ai</div>
                  </div>
                </div>
                <div style={{ background: C.white, padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', paddingBottom: '9px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🐝</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink }}>AI Studio</div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                      {['Tools ⚡', 'Studio 🎨'].map(l => <div key={l} style={{ padding: '3px 7px', borderRadius: '4px', background: C.bgAlt, fontSize: '9px', fontWeight: 600, color: C.inkMuted }}>{l}</div>)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '10px' }}>
                    {[{ icon: '🌟', l: 'Photoshoot', bg: '#EFF6FF', ac: '#2563EB' }, { icon: '📦', l: 'Packshot', bg: '#F5F3FF', ac: '#7C3AED' }, { icon: '🧑‍🦰', l: 'To Model', bg: '#FDF2F8', ac: '#DB2777' }, { icon: '👗', l: 'Try-On', bg: C.amberLt, ac: C.amberDk }, { icon: '🪄', l: 'Remove BG', bg: '#ECFDF5', ac: '#059669' }, { icon: '🔍', l: 'Upscale', bg: '#EFF6FF', ac: '#2563EB' }, { icon: '📐', l: 'Resize', bg: '#F0FDF4', ac: '#16A34A' }, { icon: '🎬', l: 'Video AI', bg: '#FDF4FF', ac: '#9333EA' }].map((cc, i) => (
                      <div key={i} style={{ padding: '8px 4px', borderRadius: '7px', background: cc.bg, textAlign: 'center' }}>
                        <div style={{ fontSize: '17px', marginBottom: '3px' }}>{cc.icon}</div>
                        <div style={{ fontSize: '8px', fontWeight: 700, color: cc.ac, lineHeight: 1.2 }}>{cc.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px', borderRadius: '8px', background: C.bgAlt, border: `1px solid ${C.border}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: C.amberLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>✨</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: C.ink }}>Foto Produk → Lifestyle · 28 dtk</div>
                      <div style={{ fontSize: '8px', color: C.inkMuted }}>White Studio preset</div>
                    </div>
                    <div style={{ padding: '3px 8px', borderRadius: '5px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, fontSize: '8px', fontWeight: 700, color: '#fff' }}>Save</div>
                  </div>
                </div>
              </div>
            )}
 
            {/* S2: Results */}
            {slide === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: C.inkDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Contoh Hasil BeeSell AI</div>
                {resultCards.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: C.white, border: `1px solid ${C.border}`, boxShadow: C.sh }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: C.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{r.before}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                        <div style={{ width: '14px', height: '1.5px', background: C.border }} />
                        <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={6} color="#fff" /></div>
                        <div style={{ width: '14px', height: '1.5px', background: C.border }} />
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${r.color}18`, border: `1.5px solid ${r.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{r.after}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink, marginBottom: '2px' }}>{r.label}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: r.color, padding: '1px 6px', borderRadius: '99px', background: `${r.color}15`, display: 'inline-block' }}>{r.sub}</div>
                    </div>
                    <div style={{ fontSize: '16px', flexShrink: 0 }}>✅</div>
                  </div>
                ))}
              </div>
            )}
 
            {/* Mini stats */}
            {isMobile && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '14px',
                  marginBottom: '14px'
                }}
              >
                {[0, 1, 2].map(i => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    style={{
                      width: slide === i ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all .3s ease',
                      background:
                        slide === i
                          ? `linear-gradient(135deg,${C.amber},${C.amberDk})`
                          : C.border
                    }}
                  />
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '5px', marginTop: '9px' }}>
              {[{ num: '20s', l: 'Generate' }, { num: '16+', l: 'Model Lokal' }, { num: '17', l: 'Preset' }].map((s, i) => (
                <div key={i} style={{ padding: '8px', borderRadius: '9px', background: C.white, border: `1px solid ${C.border}`, textAlign: 'center', boxShadow: C.sh }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: C.amber }}>{s.num}</div>
                  <div style={{ fontSize: '8px', color: C.inkMuted, marginTop: '1px' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


// ════════════════════════════════════════════════════════════
// STATS BAR
// ════════════════════════════════════════════════════════════
function StatsBar() {
  return (
    <div style={{ background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, padding: '18px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
        {[{ num: '50K+', l: 'Seller aktif' }, { num: '2M+', l: 'Konten dibuat' }, { num: '3.8×', l: 'ROAS naik' }, { num: '<3m', l: 'Per konten' }].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(20px,3vw,34px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: 'clamp(9px,1.5vw,12px)', color: 'rgba(255,255,255,.8)', marginTop: '2px' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// RESULTS GALLERY — Video + Photo showcase
// ═══════════════════════════════════════════════════════════════
function ResultsGallery() {
  const videos = [
    { src:'/results/packshot-demo.mp4', poster:'/results/packshot-thumb.jpg', label:'AI Packshot', sub:'White Studio preset', color:B.amber },
    { src:'/results/tryon-demo.mp4',    poster:'/results/tryon-thumb.jpg',    label:'AI Try-On',   sub:'IDM-VTON model',     color:'#DB2777' },
    { src:'/results/model-demo.mp4',    poster:'/results/model-thumb.jpg',    label:'To Model AI', sub:'Hijab wanita muda',   color:B.purple },
  ]
  const photos = [
    { src:'/results/photo-luxury.jpg', fb:'🌟', label:'Luxury Studio', tag:'AI Packshot' },
    { src:'/results/photo-korean.jpg', fb:'🌸', label:'Korean Aesthetic', tag:'AI Photoshoot' },
    { src:'/results/photo-tryon.jpg',  fb:'👗', label:'Fashion Try-On',  tag:'AI Try-On' },
    { src:'/results/photo-model.jpg',  fb:'🧑‍🦰', label:'To Model AI',  tag:'Product to Model' },
    { src:'/results/photo-enhancer.jpg',fb:'✨', label:'Product Enhancer',tag:'AI Enhancer' },
    { src:'/results/photo-packshot.jpg',fb:'📦', label:'Floating Product',tag:'AI Packshot' },
  ]

  return (
    <Section id="hasil-ai" bg={B.bgAlt} py="72px">
      <div style={W}>
        <div style={{ textAlign:'center', marginBottom:'44px' }}>
          <SectionLabel text="Hasil BeeSell AI"/>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, color:B.ink, letterSpacing:'-0.03em', marginBottom:'12px' }}>
            Lihat hasilnya — bukan sekedar janji
          </h2>
          <p style={{ fontSize:'clamp(13px,1.8vw,16px)', color:B.inkMuted, maxWidth:'480px', margin:'0 auto' }}>
            Semua dibuat menggunakan BeeSell AI. Foto produk biasa → visual premium dalam hitungan detik.
          </p>
        </div>

        {/* Video showcase */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
          {videos.map((v,i) => (
            <div key={i} style={{ position:'relative', borderRadius:'16px', overflow:'hidden', aspectRatio:'9/16', background:'#000', boxShadow:`0 12px 36px rgba(26,24,16,.14)`, border:`1px solid ${B.border}` }}>
              <video autoPlay loop muted playsInline poster={v.poster} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}>
                <source src={v.src} type="video/mp4"/>
              </video>
              {/* Fallback */}
              <div style={{ position:'absolute', inset:0, background:`linear-gradient(160deg,${v.color}18,${B.bg})`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
                <div style={{ fontSize:'48px' }}>
                  {['🌟', '📸', '👗'][i]}
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:800, color:B.ink, marginBottom:'3px' }}>{v.label}</div>
                  <div style={{ fontSize:'11px', color:B.inkMuted }}>{v.sub}</div>
                </div>
                <div style={{ fontSize:'10px', color:B.inkMuted, fontStyle:'italic' }}>Taruh video di /public/results/</div>
              </div>
              <div style={{ position:'absolute', bottom:'10px', left:'10px', padding:'4px 9px', borderRadius:'7px', background:'rgba(0,0,0,.6)', fontSize:'10px', color:'#fff', fontWeight:700, backdropFilter:'blur(5px)' }}>{v.label}</div>
              <div style={{ position:'absolute', top:'10px', right:'10px', padding:'3px 8px', borderRadius:'6px', background:v.color, fontSize:'9px', color:'#fff', fontWeight:800 }}>AI</div>
            </div>
          ))}
        </div>

        {/* Photo grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
          {photos.map((p,i) => (
            <div key={i} style={{ position:'relative', borderRadius:'14px', overflow:'hidden', aspectRatio:'1/1', background:B.bgAlt, border:`1px solid ${B.border}`, boxShadow:B.ss }}>
              <img src={p.src} alt={p.label} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; const fb=e.currentTarget.nextSibling as HTMLElement; if(fb)fb.style.display='flex' }}/>
              {/* Fallback */}
              <div style={{ position:'absolute', inset:0, display:'none', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${B.amberLt},${B.bgAlt})`, gap:'8px' }}>
                <div style={{ fontSize:'36px' }}>{p.fb}</div>
                <div style={{ fontSize:'11px', fontWeight:700, color:B.inkMuted, textAlign:'center', padding:'0 8px' }}>{p.label}</div>
              </div>
              {/* Label overlay */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'24px 12px 10px', background:'linear-gradient(to top, rgba(26,24,16,.7), transparent)' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:'#fff' }}>{p.label}</div>
                <div style={{ fontSize:'9px', color:'rgba(255,255,255,.7)' }}>{p.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════════════════
// QUICK TOOLS — Mobile: swipe carousel
// ════════════════════════════════════════════════════════════
function QuickTools() {
  const [active, setActive] = useState(0)
  const tool = TOOLS[active]
 
  return (
    <Sec id="quick-tools">
      <div style={W}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <SL text="Quick Tools" />
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,36px)', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', marginBottom: '8px' }}>Edit foto ⚡ sekali klik</h2>
          <p style={{ fontSize: 'clamp(12px,1.8vw,14px)', color: C.inkMuted }}>5 AI tools — cepat, mobile-friendly.</p>
        </div>
 
        {/* Mobile: swipe carousel */}
        <div className="m-show">
          <Carousel items={TOOLS} peek={28} renderItem={(t) => (
            <div style={{ padding: '20px', borderRadius: '18px', background: t.lt, border: `2px solid ${t.color}40`, boxShadow: `0 8px 24px ${t.color}15` }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: `${t.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '13px' }}>{t.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: t.color, marginBottom: '8px' }}>{t.label}</div>
              <div style={{ fontSize: '13px', color: C.inkMuted, lineHeight: 1.6, marginBottom: '16px' }}>{t.desc}</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ l: 'Waktu', v: '<3 dtk' }, { l: 'Output', v: 'HD' }, { l: 'Format', v: 'PNG' }].map((s, j) => (
                  <div key={j} style={{ flex: 1, padding: '7px 5px', borderRadius: '8px', background: 'rgba(255,255,255,.65)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink }}>{s.v}</div>
                    <div style={{ fontSize: '9px', color: C.inkDim }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )} />
          <Link href="/quick-tools" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '13px', borderRadius: '12px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: C.sa, marginTop: '16px' }}>
            Coba Quick Tools <ArrowRight size={14} />
          </Link>
        </div>
 
        {/* Desktop: split */}
        <div className="d-show" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TOOLS.map((t, i) => (
              <button key={i} type="button" onClick={() => setActive(i)}
                style={{ display: 'flex', gap: '11px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '12px', border: `1.5px solid ${active === i ? t.color : C.border}`, background: active === i ? t.lt : C.white, cursor: 'pointer', textAlign: 'left', transition: 'all .18s', boxShadow: active === i ? `0 4px 14px ${t.color}18` : C.sh }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: active === i ? `${t.color}18` : C.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: active === i ? t.color : C.ink, marginBottom: '2px' }}>{t.label}</div>
                  <div style={{ fontSize: '11px', color: C.inkMuted, lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ borderRadius: '18px', background: C.white, border: `1px solid ${C.border}`, boxShadow: C.lg, overflow: 'hidden' }}>
            <div style={{ padding: '15px 18px', background: `linear-gradient(135deg,${tool.lt},${C.white})`, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${tool.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px' }}>{tool.icon}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: tool.color }}>{tool.label}</div>
                <div style={{ fontSize: '10px', color: C.inkMuted }}>Quick Tools · AI Powered</div>
              </div>
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ borderRadius: '10px', background: C.bgAlt, aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>📦</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '22px', height: '2px', background: C.border }} />
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={9} color="#fff" /></div>
                  <div style={{ width: '22px', height: '2px', background: C.border }} />
                </div>
                <div style={{ borderRadius: '10px', background: tool.lt, border: `1.5px solid ${tool.color}40`, aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{tool.icon}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ l: 'Waktu', v: '<3 dtk' }, { l: 'Kualitas', v: 'HD' }, { l: 'Format', v: 'PNG/JPG' }].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: '6px', borderRadius: '7px', background: C.bgAlt, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink }}>{s.v}</div>
                    <div style={{ fontSize: '8px', color: C.inkDim }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '0 18px 16px' }}>
              <Link href="/quick-tools" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '10px', borderRadius: '10px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', boxShadow: C.sa }}>
                Coba {tool.label} <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  )
}
// ════════════════════════════════════════════════════════════
// AI IMAGE ENGINE — Mobile: carousel
// ════════════════════════════════════════════════════════════
function ImageEngine() {
  const { ref, inView } = useInView()
  return (
    <Sec id="fitur" bg={C.bgAlt}>
      <div style={W}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <SL text="AI Image Generator" />
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,36px)', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', marginBottom: '8px' }}>7 Fitur AI Image</h2>
          <p style={{ fontSize: 'clamp(12px,1.8vw,14px)', color: C.inkMuted, maxWidth: '400px', margin: '0 auto' }}>Foto produk biasa → visual premium. Tanpa kamera, tanpa studio.</p>
        </div>
 
        {/* Hero card — always visible */}
        <Link href={AI_IMAGES[0].href} style={{ textDecoration: 'none', display: 'block', marginBottom: '10px' }}>
          <div style={{ padding: 'clamp(14px,3vw,22px)', borderRadius: '16px', background: `linear-gradient(135deg,${C.amberLt},${C.white})`, border: `1.5px solid ${C.amber}40`, boxShadow: C.sm, display: 'flex', alignItems: 'center', gap: '14px', transition: 'all .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = C.lg }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = C.sm }}>
            <div style={{ width: 'clamp(44px,6vw,56px)', height: 'clamp(44px,6vw,56px)', borderRadius: '14px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(22px,3vw,28px)', flexShrink: 0, boxShadow: C.sa }}>🌟</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'clamp(13px,2vw,16px)', fontWeight: 800, color: C.ink }}>AI Product Photoshoot</span>
                <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '99px', background: C.amber, color: '#fff' }}>⭐ Terpopuler</span>
              </div>
              <p style={{ fontSize: 'clamp(11px,1.5vw,13px)', color: C.inkMuted, lineHeight: 1.6, margin: '0 0 7px' }}>Foto produk → lifestyle premium. 10 preset scene.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {['Luxury', 'Korean', 'Minimal', 'Dark Moody'].map(p => (
                  <span key={p} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', background: C.amberLt, border: `1px solid ${C.amber}40`, color: C.amberDk, fontWeight: 600 }}>{p}</span>
                ))}
              </div>
            </div>
            <ChevronRight size={15} color={C.amber} style={{ flexShrink: 0 }} />
          </div>
        </Link>
 
        {/* Mobile: carousel */}
        <div className="m-show">
          <Carousel items={AI_IMAGES.slice(1)} peek={24} renderItem={(t) => (
            <div style={{ padding: '16px', borderRadius: '14px', background: C.white, border: `1.5px solid ${C.border}`, boxShadow: C.sh }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: C.amberLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '21px', flexShrink: 0 }}>{t.icon}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.ink }}>{t.label}</span>
                    {t.badge && <span style={{ fontSize: '8px', fontWeight: 800, padding: '2px 5px', borderRadius: '99px', background: C.amber, color: '#fff' }}>{t.badge}</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: C.inkMuted, lineHeight: 1.5, margin: 0 }}>{t.desc}</p>
                </div>
              </div>
              <div style={{ padding: '7px 9px', borderRadius: '8px', background: C.bgAlt, fontSize: '11px', color: C.amber, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                ✅ Pro & Business <ChevronRight size={10} />
              </div>
            </div>
          )} />
        </div>
 
        {/* Desktop: grid */}
        <div ref={ref} className="d-show" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px' }}>
          {AI_IMAGES.slice(1).map((t, i) => (
            <Link key={i} href={t.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '14px 16px', borderRadius: '13px', background: C.white, border: `1.5px solid ${C.border}`, boxShadow: C.sh, display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'all .18s', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(12px)', transitionDelay: `${i * 50}ms` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.amber; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${C.amberGlow}`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.boxShadow = C.sh; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.amberLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.ink }}>{t.label}</span>
                    {t.badge && <span style={{ fontSize: '8px', fontWeight: 800, padding: '2px 5px', borderRadius: '99px', background: C.amber, color: '#fff' }}>{t.badge}</span>}
                  </div>
                  <p style={{ fontSize: '11px', color: C.inkMuted, lineHeight: 1.5, margin: 0 }}>{t.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Sec>
  )
}

// ═══════════════════════════════════════════════════════════════
// VIDEO ENGINE
// ═══════════════════════════════════════════════════════════════
function VideoEngineSection() {
  return (
    <Section bg={B.bg} py="72px">
      <div style={W}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <SectionLabel text="Core Engine 2"/>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, color:B.ink, letterSpacing:'-0.03em', marginBottom:'12px' }}>AI Video Generator</h2>
          <p style={{ fontSize:'clamp(13px,1.8vw,16px)', color:B.inkMuted, maxWidth:'440px', margin:'0 auto' }}>
            Foto produk → video sinematik, UGC authentic, atau TikTok Reels. Tanpa kamera.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
          {VIDEO_ENGINE.map((v,i) => (
            <div key={i} style={{ padding:'22px', borderRadius:'18px', background:B.white, border:`1.5px solid ${B.border}`, boxShadow:B.ss, textAlign:'center', transition:'all .18s', cursor:'pointer' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=B.amber;(e.currentTarget as HTMLElement).style.boxShadow=`0 8px 28px ${B.amberGlow}`;(e.currentTarget as HTMLElement).style.transform='translateY(-3px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=B.border;(e.currentTarget as HTMLElement).style.boxShadow=B.ss;(e.currentTarget as HTMLElement).style.transform='translateY(0)'}}>
              <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:B.amberLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', margin:'0 auto 12px' }}>{v.icon}</div>
              <div style={{ fontSize:'14px', fontWeight:700, color:B.ink, marginBottom:'6px' }}>{v.label}</div>
              <p style={{ fontSize:'12px', color:B.inkMuted, lineHeight:1.6, margin:'0 0 12px' }}>{v.desc}</p>
              <div style={{ fontSize:'11px', color:B.amber, fontWeight:700, display:'flex', alignItems:'center', gap:'4px', justifyContent:'center' }}>Coming Soon <ChevronRight size={11}/></div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════════════════
// MARKETING TOOLS — 3×2 responsive grid
// ════════════════════════════════════════════════════════════
function MarketingTools() {
  return (
    <Sec>
      <div style={W}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <SL text="AI Marketing Tools" />
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,36px)', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Marketing assets <span style={{ color: C.amber }}>auto-generate</span>
          </h2>
          <p style={{ fontSize: 'clamp(12px,1.5vw,14px)', color: C.inkMuted, maxWidth: '380px', margin: '0 auto 20px' }}>Caption, hook, CTA, hashtag, ad copy — siap copy-paste setelah generate gambar.</p>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '10px 18px', borderRadius: '10px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', boxShadow: C.sa }}>
            Coba Gratis <ArrowRight size={13} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px' }}>
          {MARKETING.map((m, i) => (
            <div key={i} style={{ padding: '13px 11px', borderRadius: '12px', background: C.white, border: `1px solid ${C.border}`, boxShadow: C.sh, textAlign: 'center', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.amber; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px ${C.amberGlow}` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.boxShadow = C.sh }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: C.amberLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', margin: '0 auto 8px' }}>{m.icon}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink, marginBottom: '3px' }}>{m.label}</div>
              <div style={{ fontSize: '9px', color: C.inkMuted, lineHeight: 1.4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  )
}

// ════════════════════════════════════════════════════════════
// HOW IT WORKS — Mobile: vertical stepper with line connector
// ════════════════════════════════════════════════════════════
function HowItWorks() {
  return (
    <Sec id="cara-kerja" bg={C.bgAlt}>
      <div style={W}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <SL text="Cara Kerja" />
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,36px)', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', marginBottom: '8px' }}>4 langkah, hasil premium</h2>
          <p style={{ fontSize: 'clamp(12px,1.8vw,14px)', color: C.inkMuted }}>Dari foto biasa ke visual siap jual — kurang dari 3 menit.</p>
        </div>
 
        {/* Mobile: vertical stepper */}
        <div className="m-show" style={{ display: 'flex', flexDirection: 'column' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              {/* Left: circle + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: C.sa, position: 'relative', flexShrink: 0 }}>
                  <span style={{ fontSize: '22px' }}>{s.icon}</span>
                  <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '18px', height: '18px', borderRadius: '50%', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: '#fff', border: `2px solid ${C.bg}` }}>{s.num}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: '2px', height: '40px', background: `linear-gradient(${C.amber},${C.border})`, margin: '4px 0' }} />
                )}
              </div>
              {/* Right: content */}
              <div style={{ paddingTop: '8px', paddingBottom: i < STEPS.length - 1 ? '24px' : '0', flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: C.ink, marginBottom: '4px' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: C.inkMuted, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
 
        {/* Desktop: 4-col */}
        <div className="d-show" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '37px', left: '12.5%', right: '12.5%', height: '1.5px', background: `linear-gradient(90deg,${C.amber},${C.amberDk})`, opacity: .2 }} />
          {STEPS.map((s, i) => (
            <div key={i} style={{ position: 'relative', zIndex: 1, padding: '20px 16px', borderRadius: '14px', background: C.white, border: `1.5px solid ${C.border}`, boxShadow: C.sh, textAlign: 'center', transition: 'all .18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.amber; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${C.amberGlow}`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.boxShadow = C.sh; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 11px', boxShadow: C.sa, position: 'relative' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 800, color: '#fff', border: `2px solid ${C.bg}` }}>{s.num}</div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: C.ink, marginBottom: '5px' }}>{s.title}</div>
              <p style={{ fontSize: '11px', color: C.inkMuted, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMING SOON
// ═══════════════════════════════════════════════════════════════
function ComingSoonSection() {
  return (
    <Section bg={B.bgAlt} py="72px">
      <div style={W}>
        <div style={{ textAlign:'center', marginBottom:'44px' }}>
          <SectionLabel text="Roadmap"/>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, color:B.ink, letterSpacing:'-0.03em', marginBottom:'12px' }}>
            Fitur AI yang akan datang 🚀
          </h2>
          <p style={{ fontSize:'clamp(13px,1.8vw,16px)', color:B.inkMuted, maxWidth:'480px', margin:'0 auto' }}>
            BeeSell AI terus berkembang. Berikut fitur-fitur yang sedang dibangun untuk seller Indonesia.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,260px),1fr))', gap:'10px' }}>
          {COMING_SOON.map((f,i) => (
            <div key={i} style={{ padding:'18px 20px', borderRadius:'14px', background:B.white, border:`1px dashed ${B.border}`, boxShadow:B.ss, display:'flex', gap:'12px', alignItems:'flex-start', position:'relative', overflow:'hidden', transition:'all .18s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=B.amber;(e.currentTarget as HTMLElement).style.borderStyle='solid'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=B.border;(e.currentTarget as HTMLElement).style.borderStyle='dashed'}}>
              {/* Coming soon ribbon */}
              <div style={{ position:'absolute', top:'10px', right:'10px', padding:'2px 8px', borderRadius:'99px', background:B.amberLt, fontSize:'9px', fontWeight:700, color:B.amberDk }}>
                {f.eta}
              </div>
              <div style={{ width:'40px', height:'40px', borderRadius:'11px', background:B.bgAlt, border:`1px solid ${B.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{f.icon}</div>
              <div style={{ flex:1, paddingRight:'36px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:B.ink, marginBottom:'3px' }}>{f.label}</div>
                <div style={{ fontSize:'11px', color:B.inkMuted, lineHeight:1.5 }}>{f.desc}</div>
                <div style={{ marginTop:'7px', fontSize:'10px', fontWeight:600, color:B.inkDim }}>{f.phase}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:'24px', padding:'16px 20px', borderRadius:'14px', background:`linear-gradient(135deg,${B.amberLt},${B.amberXlt})`, border:`1px solid ${B.amber}40`, display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontSize:'24px' }}>🐝</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:B.ink, marginBottom:'2px' }}>Mau request fitur baru?</div>
            <div style={{ fontSize:'12px', color:B.inkMuted }}>Join komunitas BeeSell AI dan vote fitur yang paling kamu butuhkan.</div>
          </div>
          <Link href="/register" style={{ padding:'9px 18px', borderRadius:'10px', background:`linear-gradient(135deg,${B.amber},${B.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, textDecoration:'none', boxShadow:B.sa, whiteSpace:'nowrap' }}>
            Gabung Sekarang
          </Link>
        </div>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════════════════
// TESTIMONIALS — Mobile: carousel
// ════════════════════════════════════════════════════════════
function Testimonials() {
  return (
    <Sec id="testimonial">
      <div style={W}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <SL text="Testimoni" />
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,36px)', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', marginBottom: '7px' }}>Seller sudah merasakan hasilnya</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={C.amber} color={C.amber} />)}
            <span style={{ fontSize: '12px', color: C.inkMuted, fontWeight: 500, marginLeft: '6px' }}>4.9 dari 50.000+ seller</span>
          </div>
        </div>
 
        {/* Mobile: carousel */}
        <div className="m-show">
          <Carousel items={TESTIMONIALS} peek={24} renderItem={(t) => (
            <div style={{ padding: '18px', borderRadius: '16px', background: C.white, border: `1.5px solid ${C.border}`, boxShadow: C.sm }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '11px' }}>{[...Array(t.stars)].map((_, j) => <Star key={j} size={12} fill={C.amber} color={C.amber} />)}</div>
              <p style={{ fontSize: '13px', color: C.inkSub, lineHeight: 1.7, marginBottom: '14px', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '11px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.amberLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: C.ink }}>{t.name}</div>
                  <div style={{ fontSize: '10px', color: C.inkMuted }}>{t.role}</div>
                </div>
              </div>
            </div>
          )} />
        </div>
 
        {/* Desktop: 3-col */}
        <div className="d-show" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '11px' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ padding: '18px', borderRadius: '15px', background: C.white, border: `1px solid ${C.border}`, boxShadow: C.sh, transition: 'all .18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = C.sm; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = C.sh; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>{[...Array(t.stars)].map((_, j) => <Star key={j} size={12} fill={C.amber} color={C.amber} />)}</div>
              <p style={{ fontSize: '12px', color: C.inkSub, lineHeight: 1.7, marginBottom: '13px', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '11px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: C.amberLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: C.ink }}>{t.name}</div>
                  <div style={{ fontSize: '10px', color: C.inkMuted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  )
}

// ════════════════════════════════════════════════════════════
// PRICING — Mobile: swipe carousel with peek next card
// ════════════════════════════════════════════════════════════
function Pricing() {
  const PCard = ({ p }: { p: typeof PRICING[0] }) => (
    <div style={{ borderRadius: '20px', overflow: 'hidden', background: p.highlight ? `linear-gradient(170deg,${C.amber},${C.amberDk})` : C.white, border: `2px solid ${p.highlight ? C.amber : C.border}`, boxShadow: p.highlight ? `0 20px 48px ${C.amberGlow}` : C.sm, height: '100%' }}>
      {p.badge && <div style={{ background: 'rgba(0,0,0,.15)', padding: '5px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#fff' }}>{p.badge}</div>}
      <div style={{ padding: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: p.highlight ? 'rgba(255,255,255,.7)' : C.inkMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{p.name}</div>
        <div style={{ fontSize: '30px', fontWeight: 900, color: p.highlight ? '#fff' : C.ink, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '3px' }}>
          {p.price === 0 ? 'Gratis' : `Rp ${(p.price / 1000).toFixed(0)}K`}
        </div>
        {p.price > 0 && <div style={{ fontSize: '11px', color: p.highlight ? 'rgba(255,255,255,.65)' : C.inkMuted, marginBottom: '6px' }}>per bulan</div>}
        <div style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', background: p.highlight ? 'rgba(255,255,255,.15)' : C.amberLt, color: p.highlight ? '#fff' : C.amberDk, display: 'inline-block', marginBottom: '14px' }}>📊 {p.note}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' }}>
          {p.features.map((f, j) => (
            <div key={j} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <div style={{ width: '13px', height: '13px', borderRadius: '50%', flexShrink: 0, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.ok ? (p.highlight ? 'rgba(255,255,255,.2)' : C.amberLt) : (p.highlight ? 'rgba(255,255,255,.07)' : C.bgAlt) }}>
                {f.ok ? <Check size={7} color={p.highlight ? '#fff' : C.amberDk} /> : <X size={7} color={p.highlight ? 'rgba(255,255,255,.3)' : C.inkDim} />}
              </div>
              <span style={{ fontSize: '10px', color: p.highlight ? (f.ok ? '#fff' : 'rgba(255,255,255,.4)') : (f.ok ? C.ink : C.inkDim), lineHeight: 1.4 }}>{f.t}</span>
            </div>
          ))}
        </div>
        <Link href={p.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '11px', borderRadius: '11px', background: p.highlight ? '#fff' : `linear-gradient(135deg,${C.amber},${C.amberDk})`, color: p.highlight ? C.amberDk : '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', boxShadow: p.highlight ? 'none' : C.sa }}>
          {p.cta} <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
 
  return (
    <Sec id="harga" bg={C.bgAlt}>
      <div style={W}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <SL text="Harga" />
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,36px)', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', marginBottom: '8px' }}>Mulai gratis, upgrade kapan saja</h2>
          <p style={{ fontSize: 'clamp(12px,1.8vw,14px)', color: C.inkMuted, maxWidth: '360px', margin: '0 auto' }}>Tidak ada biaya tersembunyi. Kuota jelas, cancel kapan saja.</p>
        </div>
 
        {/* Mobile: swipe carousel */}
        <div className="m-show">
          <Carousel items={PRICING} peek={32} renderItem={(p) => <PCard p={p} />} />
        </div>
 
        {/* Desktop: 4-col */}
        <div className="d-show" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
          {PRICING.map((p, i) => <PCard key={i} p={p} />)}
        </div>
 
        {/* Add-ons: horizontal scroll always */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>🐝 Add-On — Beli Terpisah</div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' } as React.CSSProperties}>
            {ADDONS.map((a, i) => (
              <div key={i} style={{ flexShrink: 0, padding: '12px 13px', borderRadius: '13px', background: C.white, border: `1.5px solid ${C.border}`, boxShadow: C.sh, width: 'clamp(145px,42vw,190px)', position: 'relative', transition: 'all .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.amber; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px ${C.amberGlow}` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.boxShadow = C.sh }}>
                {a.badge && <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '99px', background: C.amber, color: '#fff' }}>{a.badge}</div>}
                <div style={{ fontSize: '19px', marginBottom: '6px' }}>{a.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink, marginBottom: '2px' }}>{a.label}</div>
                <div style={{ fontSize: '10px', color: C.amber, fontWeight: 600, marginBottom: '8px' }}>{a.qty}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: C.ink }}>Rp{(a.price / 1000).toFixed(0)}K</span>
                  <button type="button" style={{ padding: '4px 9px', borderRadius: '6px', border: 'none', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, color: '#fff', fontSize: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: C.sa, fontFamily: 'inherit' }}>Beli</button>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* Guarantees */}
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px' }}>
          {[{ icon: '🔒', t: 'Pembayaran Aman', d: 'Visa, QRIS, OVO, GoPay.' }, { icon: '↩️', t: 'Garansi 7 Hari', d: 'Refund penuh, no questions.' }, { icon: '❌', t: 'Cancel Kapan Saja', d: 'Tidak ada kontrak.' }].map((g, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: '12px', background: C.white, border: `1px solid ${C.border}`, display: 'flex', gap: '8px', alignItems: 'flex-start', boxShadow: C.sh }}>
              <div style={{ fontSize: '16px', flexShrink: 0 }}>{g.icon}</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink, marginBottom: '2px' }}>{g.t}</div>
                <div style={{ fontSize: '10px', color: C.inkMuted, lineHeight: 1.4 }}>{g.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  )
}
// ══════════════════════════════════════════════════════════════
// FEATURE COMPARISON TABLE — Full detail
// ══════════════════════════════════════════════════════════════
function FeatureComparisonTable() {
  const { ref, inView } = useInView()
  const rows = [
    { cat:'Quick Tools', feature:'Remove Background',    s:'limited', b:true,  p:true,  biz:true  },
    { cat:'Quick Tools', feature:'AI Upscale',           s:'2× only', b:'4×',  p:'4×',  biz:'4×'  },
    { cat:'Quick Tools', feature:'Resize Smart AI',      s:'3 preset',b:true,  p:true,  biz:true  },
    { cat:'Quick Tools', feature:'AI Relight',           s:false,     b:true,  p:true,  biz:true  },
    { cat:'Quick Tools', feature:'Remove Object',        s:false,     b:true,  p:true,  biz:true  },
    { cat:'AI Image',    feature:'AI Product Photoshoot',s:false,     b:true,  p:true,  biz:true  },
    { cat:'AI Image',    feature:'AI Packshot Generator',s:false,     b:true,  p:true,  biz:true  },
    { cat:'AI Image',    feature:'Product Enhancer AI',  s:false,     b:true,  p:true,  biz:true  },
    { cat:'AI Image',    feature:'Product to Model AI',  s:false,     b:false, p:true,  biz:true  },
    { cat:'AI Image',    feature:'AI Try-On Fashion',    s:false,     b:false, p:true,  biz:true  },
    { cat:'AI Image',    feature:'Model Swap AI',        s:false,     b:false, p:true,  biz:true  },
    { cat:'AI Image',    feature:'Face Swap AI',         s:false,     b:false, p:true,  biz:true  },
    { cat:'Video AI',    feature:'Product Video AI',     s:false,     b:false, p:'5/bln',biz:'20/bln'},
    { cat:'Video AI',    feature:'UGC Video Generator',  s:false,     b:false, p:'5/bln',biz:'20/bln'},
    { cat:'Video AI',    feature:'TikTok Reels AI',      s:false,     b:false, p:'5/bln',biz:'20/bln'},
    { cat:'Marketing',   feature:'Caption + Hook + CTA', s:false,     b:true,  p:true,  biz:true  },
    { cat:'Marketing',   feature:'Deskripsi + Hashtag',  s:false,     b:true,  p:true,  biz:true  },
    { cat:'Marketing',   feature:'Ad Copy Generator',    s:false,     b:false, p:true,  biz:true  },
    { cat:'Platform',    feature:'Watermark',            s:true,      b:false, p:false, biz:false },
    { cat:'Platform',    feature:'Result Page',          s:false,     b:true,  p:true,  biz:true  },
    { cat:'Platform',    feature:'Asset Library',        s:false,     b:true,  p:true,  biz:true  },
    { cat:'Platform',    feature:'Team Workspace',       s:false,     b:false, p:false, biz:'5 seat'},
    { cat:'Platform',    feature:'Bulk Engine',          s:false,     b:false, p:false, biz:true  },
    { cat:'Platform',    feature:'API Access',           s:false,     b:false, p:false, biz:true  },
    { cat:'Platform',    feature:'White Label',          s:false,     b:false, p:false, biz:true  },
  ]
 
  type CellVal = boolean | string
 
  function Cell({ val, highlight }: { val: CellVal; highlight?: boolean }) {
    if (val === false) return <div style={{ display:'flex', justifyContent:'center' }}><X size={14} color={highlight?'rgba(255,255,255,.3)':'#CBD5E1'}/></div>
    if (val === true)  return <div style={{ display:'flex', justifyContent:'center' }}><Check size={14} color={highlight?'#fff':B.green}/></div>
    return <div style={{ textAlign:'center', fontSize:'11px', fontWeight:600, color:highlight?'rgba(255,255,255,.9)':B.ink }}>{val as string}</div>
  }
 
  const cats = [...new Set(rows.map(r => r.cat))]
  const thStyle: React.CSSProperties = { padding:'10px 12px', fontSize:'11px', fontWeight:700, textAlign:'center', color:B.inkMuted, letterSpacing:'0.05em' }
 
  return (
    <Section bg={B.bg} py="72px">
      <div style={W}>
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <SectionLabel text="Perbandingan Fitur"/>
          <h2 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:800, color:B.ink, letterSpacing:'-0.03em' }}>Semua fitur per plan — transparan</h2>
        </div>
        <div ref={ref} style={{ background:B.white, borderRadius:'18px', border:`1px solid ${B.border}`, overflow:'hidden', boxShadow:B.sm, opacity:inView?1:0, transition:'opacity .6s' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr repeat(4,140px)', background:B.bgAlt, borderBottom:`1px solid ${B.border}` }}>
            <div style={{ padding:'14px 16px', fontSize:'12px', fontWeight:700, color:B.inkMuted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Fitur</div>
            {[
              {n:'Starter', c:B.inkMuted, h:false},
              {n:'Basic',   c:B.green,    h:false},
              {n:'Pro',     c:B.amber,    h:true },
              {n:'Business',c:B.purple,   h:false},
            ].map((col,i)=>(
              <div key={i} style={{ ...thStyle, color:col.c, background:col.h?`linear-gradient(135deg,${B.amber},${B.amberDk})`:undefined }}>
                {col.h && <div style={{ fontSize:'8px', color:'rgba(255,255,255,.8)', marginBottom:'2px' }}>TERLARIS</div>}
                <div style={{ color:col.h?'#fff':col.c }}>{col.n}</div>
              </div>
            ))}
          </div>
 
          {/* Rows by category */}
          {cats.map(cat => (
            <div key={cat}>
              <div style={{ padding:'8px 16px', background:B.bgAlt, borderBottom:`1px solid ${B.border}`, fontSize:'10px', fontWeight:800, color:B.inkDim, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {cat}
              </div>
              {rows.filter(r=>r.cat===cat).map((row,j) => (
                <div key={j} style={{ display:'grid', gridTemplateColumns:'1fr repeat(4,140px)', borderBottom:`1px solid ${B.border}`, background: j%2===0?B.white:B.bg }}>
                  <div style={{ padding:'11px 16px', fontSize:'12px', color:B.ink, fontWeight:500 }}>{row.feature}</div>
                  <div style={{ padding:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}><Cell val={row.s}/></div>
                  <div style={{ padding:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}><Cell val={row.b}/></div>
                  <div style={{ padding:'11px', display:'flex', alignItems:'center', justifyContent:'center', background:`${B.amber}06` }}><Cell val={row.p} highlight={false}/></div>
                  <div style={{ padding:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}><Cell val={row.biz}/></div>
                </div>
              ))}
            </div>
          ))}
 
          {/* Price footer */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr repeat(4,140px)', background:B.bgAlt, borderTop:`2px solid ${B.border}` }}>
            <div style={{ padding:'16px', fontSize:'12px', fontWeight:700, color:B.ink }}>Harga per bulan</div>
            {[
              {price:'Gratis',     note:'5 gen lifetime', href:'/register',                  amber:false},
              {price:'Rp 149K',    note:'7 hari gratis',  href:'/register?plan=basic',       amber:false},
              {price:'Rp 399K',    note:'7 hari gratis',  href:'/register?plan=pro',         amber:true},
              {price:'Rp 999K',    note:'Hubungi sales',  href:'/register?plan=business',    amber:false},
            ].map((col,i)=>(
              <div key={i} style={{ padding:'12px', textAlign:'center' }}>
                <div style={{ fontSize:'16px', fontWeight:900, color:col.amber?B.amber:B.ink, marginBottom:'4px' }}>{col.price}</div>
                <Link href={col.href} style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'8px', background:col.amber?`linear-gradient(135deg,${B.amber},${B.amberDk})`:B.bgAlt, color:col.amber?'#fff':B.ink, fontSize:'10px', fontWeight:700, textDecoration:'none', boxShadow:col.amber?B.sa:'none' }}>
                  {col.note} <ArrowRight size={10}/>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
// ══════════════════════════════════════════════════════════════
// STARTER WARNING SECTION
// ══════════════════════════════════════════════════════════════
function StarterWarningBanner() {
  return (
    <div style={{ background:`linear-gradient(135deg,#FFF7ED,#FFFBEB)`, border:`1px solid ${B.amber}40`, borderRadius:'14px', padding:'16px 20px', display:'flex', gap:'14px', alignItems:'flex-start', marginBottom:'20px' }}>
      <div style={{ fontSize:'24px', flexShrink:0 }}>⚠️</div>
      <div>
        <div style={{ fontSize:'14px', fontWeight:700, color:B.ink, marginBottom:'5px' }}>Paket Starter — Gratis BUKAN per bulan</div>
        <div style={{ fontSize:'12px', color:B.inkMuted, lineHeight:1.7 }}>
          Starter memberikan <b>5 generate TOTAL seumur hidup</b> — bukan per hari atau per bulan.
          Tujuannya: merasakan kualitas output BeeSell AI, bukan untuk kerja harian.
          Verifikasi <b>1 nomor HP + 1 email</b> wajib (tidak bisa buat akun baru dari HP yang sama).
        </div>
        <div style={{ display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap' }}>
          {['5 generate total','Watermark wajib','1 HP + 1 email','Tidak reset bulanan'].map(t=>(
            <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'99px', background:B.amberLt, color:B.amberDk, border:`1px solid ${B.amber}40` }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// FAQ — Single-col accordion, works great on mobile
// ════════════════════════════════════════════════════════════
function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <Sec id="faq">
      <div style={W}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <SL text="FAQ" />
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,36px)', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', marginBottom: '7px' }}>Pertanyaan yang sering ditanya</h2>
        </div>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderRadius: '12px', border: `1.5px solid ${isOpen ? C.amber : C.border}`, background: isOpen ? C.amberXlt : C.white, overflow: 'hidden', transition: 'all .2s', boxShadow: isOpen ? `0 4px 16px ${C.amberGlow}` : C.sh }}>
                <button type="button" onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: '100%', padding: '14px 15px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: isOpen ? `linear-gradient(135deg,${C.amber},${C.amberDk})` : C.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all .2s', boxShadow: isOpen ? C.sa : 'none' }}>
                    <span style={{ fontSize: '11px', color: isOpen ? '#fff' : C.inkMuted, fontWeight: 700, lineHeight: 1 }}>{isOpen ? '−' : '+'}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: isOpen ? 700 : 600, color: isOpen ? C.ink : C.inkSub, lineHeight: 1.5, flex: 1 }}>{faq.q}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 15px 13px 45px' }}>
                    <p style={{ fontSize: '12px', color: C.inkMuted, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ maxWidth: '680px', margin: '14px auto 0', padding: '14px 16px', borderRadius: '12px', background: `linear-gradient(135deg,${C.amberLt},${C.amberXlt})`, border: `1.5px solid ${C.amber}40`, display: 'flex', gap: '11px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '18px' }}>🐝</div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.ink, marginBottom: '1px' }}>Masih ada pertanyaan?</div>
            <div style={{ fontSize: '11px', color: C.inkMuted }}>Tim support siap membantu via WhatsApp.</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <a href="https://wa.me/628xxxxxxxxxx" target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '7px 12px', borderRadius: '8px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, color: '#fff', fontSize: '11px', fontWeight: 700, textDecoration: 'none', boxShadow: C.sa, whiteSpace: 'nowrap' }}>💬 WhatsApp</a>
            <a href="mailto:hello@beesell.ai" style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '7px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.white, color: C.ink, fontSize: '11px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>✉️ Email</a>
          </div>
        </div>
      </div>
    </Sec>
  )
}

// ════════════════════════════════════════════════════════════
// FINAL CTA
// ════════════════════════════════════════════════════════════
function FinalCTA() {
  return (
    <section style={{ background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, padding: 'clamp(44px,7vw,72px) 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ fontSize: 'clamp(38px,7vw,52px)', marginBottom: '12px' }}>🐝</div>
        <h2 style={{ fontSize: 'clamp(22px,4.5vw,42px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '10px' }}>Mulai sekarang, gratis selamanya</h2>
        <p style={{ fontSize: 'clamp(13px,2vw,15px)', color: 'rgba(255,255,255,.85)', lineHeight: 1.65, marginBottom: '24px' }}>Bergabung dengan 50.000+ seller Indonesia menggunakan BeeSell AI setiap hari.</p>
        <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '13px 26px', borderRadius: '12px', background: '#fff', color: C.amberDk, fontSize: 'clamp(13px,2vw,15px)', fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,.18)', transition: 'transform .2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
          <Zap size={15} /> Mulai Gratis Sekarang
        </Link>
        <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,.65)' }}>✓ Tanpa kartu kredit &nbsp;·&nbsp; ✓ Cancel kapan saja &nbsp;·&nbsp; ✓ 5 generate gratis</div>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer style={{ background: C.ink, padding: 'clamp(28px,5vw,44px) 20px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }} className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '9px' }}>
              <img src="/logo-beesell-black.png" alt="BeeSell AI" height={26} style={{ objectFit: 'contain', maxWidth: '100px' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.style && ((e.currentTarget.nextSibling as HTMLElement).style.display = 'flex') }} />
              <span style={{ display: 'none', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🐝</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>BeeSell<span style={{ color: C.amber }}> AI</span></span>
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#71717A', lineHeight: 1.7, marginBottom: '10px' }}>Platform AI visual terlengkap untuk seller & affiliator Indonesia.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {['Shopee', 'Tokopedia', 'TikTok', 'Instagram'].map(p => <span key={p} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,.06)', color: '#71717A' }}>{p}</span>)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[{ title: 'Produk', links: ['AI Image Generator', 'Quick Tools', 'Marketing Tools', 'Harga'] }, { title: 'Perusahaan', links: ['Tentang Kami', 'Privacy Policy', 'Terms of Service', 'Kontak'] }].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: '11px', color: '#71717A', textDecoration: 'none', transition: 'color .12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.amber}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#71717A'}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '7px' }}>
          <div style={{ fontSize: '10px', color: '#52525B' }}>© 2025 BeeSell AI · Made in Indonesia 🇮🇩</div>
          <div style={{ fontSize: '10px', color: '#52525B' }}>Seperti lebah — bekerja keras 🐝</div>
        </div>
      </div>
    </footer>
  )
}

// ════════════════════════════════════════════════════════════
// MOBILE BOTTOM BAR — fixed, scroll-triggered
// ════════════════════════════════════════════════════════════
function MobileBottomBar() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 280)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <div className="m-show" style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150, background: 'rgba(250,250,248,.97)', backdropFilter: 'blur(18px)', borderTop: `1px solid ${C.border}`, padding: '10px 16px 10px', boxShadow: '0 -4px 24px rgba(24,23,15,.09)', transition: 'transform .3s', transform: show ? 'translateY(0)' : 'translateY(100%)', gap: '8px' }}>
      <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: '11px', border: `1.5px solid ${C.border}`, fontSize: '13px', fontWeight: 600, color: C.inkMuted, textDecoration: 'none', background: C.white }}>Masuk</Link>
      <Link href="/register" style={{ flex: 2, textAlign: 'center', padding: '11px', borderRadius: '11px', background: `linear-gradient(135deg,${C.amber},${C.amberDk})`, fontSize: '13px', fontWeight: 700, color: '#fff', textDecoration: 'none', boxShadow: C.sa, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <Zap size={13} /> Mulai Gratis 🐝
      </Link>
    </div>
  )
}
// ════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div style={{ background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <StatsBar />
      <ResultsGallery />
      <QuickTools />
      <ImageEngine />
      <VideoEngineSection />
      <MarketingTools />
      <HowItWorks />
      <ComingSoonSection />
      <Testimonials />
      <Pricing />
      <FeatureComparisonTable/>
      <StarterWarningBanner/>
      <FAQ />
      <FinalCTA />
      <Footer />
      <MobileBottomBar />
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
 
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100% }
        img { max-width: 100% }
        button { -webkit-tap-highlight-color: transparent }
        a { -webkit-tap-highlight-color: transparent }
 
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-12px)} to { opacity: 1; transform: translateY(0) } }
 
        ::-webkit-scrollbar { width: 4px; height: 4px }
        ::-webkit-scrollbar-thumb { background: #D4CFC4; border-radius: 2px }
 
        /* Hide horizontal scrollbar on addons + chips */
        [style*="overflowX: auto"]::-webkit-scrollbar,
        [style*="overflow-x: auto"]::-webkit-scrollbar { display: none }
 
        /* Desktop */
        @media (min-width:1024px){

          .hero-grid{
            display:grid !important;
            grid-template-columns: 1.1fr 1fr !important;
            gap:48px !important;
            align-items:center !important;
          }

        }

        /* Tablet */
        @media (min-width:768px) and (max-width:1023px){

          .hero-grid{
            display:grid !important;
            grid-template-columns:1fr !important;
            gap:32px !important;
          }

        }

        /* Mobile */
        @media (max-width:767px){

          .hero-text{
            order:1 !important;
          }

          .hero-panel{
            order:2 !important;
          }

        }

        }
        /* ── Visibility helpers ───────────────── */
        .m-show    { display: block }
        .d-show    { display: none !important }
        .nav-m     { display: flex !important }
        .nav-d     { display: none !important }
 
        /* Mobile default: hero text below panel */
        .hero-text  { order: 2 }
        .hero-panel { order: 1 }
 
        /* ── Footer 2-col always ──────────────── */
        .footer-grid { grid-template-columns: 1fr 1fr }
 
        /* ── Tablet 640–1023px ────────────────── */
        @media (min-width: 640px) {
          .m-show { display: none !important }
          .d-show { display: grid !important }
          .nav-m  { display: none !important }
          .nav-d  { display: flex !important }
          .hero-grid { grid-template-columns: 1fr 1fr }
          .hero-text  { order: 1 }
          .hero-panel { order: 2 }
        }
 
        /* ── Mobile bottom bar only ───────────── */
        @media (min-width: 640px) {
          /* MobileBottomBar hidden on ≥640 via m-show override */
          footer { padding-bottom: 0 !important }
        }
 
        /* ── Extra small <380px ─────────────────── */
        @media (max-width: 379px) {
          .hero-grid { gap: 16px }
        }
 
        /* ── Mobile: footer 1-col ─────────────── */
        @media (max-width: 639px) {
          .footer-grid { grid-template-columns: 1fr !important }
          footer { padding-bottom: 80px !important }
          /* stats 2×2 */
          section + div > div[style*="repeat(4,1fr)"] {
            grid-template-columns: repeat(2,1fr) !important;
          }
        }
 
        /* ── Desktop 1024+ ───────────────────── */
        @media (min-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr 1fr }
        }
      `}</style>
    </div>
  )
}