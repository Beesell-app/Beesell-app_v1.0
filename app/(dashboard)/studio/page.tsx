'use client'
// app/(dashboard)/studio/page.tsx — AI Studio v2
// 2 Core Engines: AI Image Generator + AI Video Generator
// + AI Marketing Tools

import Link from 'next/link'
import { Lock, ChevronRight, Sparkles, Zap } from 'lucide-react'

const C = {
  brand:'#2563EB', b50:'#EFF6FF', b100:'#DBEAFE',
  purple:'#7C3AED', p50:'#F5F3FF',
  green:'#059669', g50:'#ECFDF5',
  amber:'#D97706', a50:'#FFFBEB',
  red:'#DC2626', r50:'#FEF2F2',
  pink:'#DB2777', pk50:'#FDF2F8',
  cyan:'#0891B2', c50:'#ECFEFF',
  orange:'#EA580C', o50:'#FFF7ED',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569', slate500:'#64748B',
  slate400:'#94A3B8', slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', w:'#fff',
}

// ── 1. AI IMAGE GENERATOR — 7 Sub Features ────────────────────
const IMAGE_ENGINE = [
  {
    href:  '/studio/image/photoshoot',
    icon:  '🌟',
    label: 'AI Product Photoshoot',
    desc:  'Foto produk biasa → lifestyle photography premium. Skincare luxury, coffee cinematic, fashion editorial.',
    color:  C.brand,
    bg:     C.b50,
    badge: 'Most Popular',
    badgeColor: C.brand,
    presets: ['Luxury', 'Korean', 'Minimal', 'Dark Mood', 'Warm Lifestyle'],
    phase: 1,
  },
  {
    href:  '/studio/image/packshot',
    icon:  '📦',
    label: 'AI Packshot Generator',
    desc:  'Foto studio ecommerce otomatis. White studio, floating product, cosmetic studio, marketplace style.',
    color:  C.purple,
    bg:     C.p50,
    badge: null,
    presets: [
      'White Studio',
      'Premium Black',
      'Soft Shadow',
      'Floating Product',
      'Cosmetic Studio',
      'Marketplace Style',
      'Fashion Catalog'
    ],
    phase: 1,
  },
  {
    href:  '/studio/image/product-to-model',
    icon:  '🧑‍🦰',
    label: 'Product to Model AI',
    desc:  'Foto produk fashion → foto model AI realistis. Pilih model, pose, background, ekspresi.',
    color:  C.pink,
    bg:     C.pk50,
    badge: 'New',
    badgeColor: C.pink,
    presets: ['Female Asian', 'Hijab Woman', 'Korean Female', 'Male Asian'],
    phase: 1,
  },
  {
    href:  '/studio/image/tryon',
    icon:  '👗',
    label: 'AI Try-On Fashion',
    desc:  'Virtual try-on AI. Upload pakaian + model, AI fitting otomatis. Studio, outdoor, korean fashion.',
    color:  C.amber,
    bg:     C.a50,
    badge: null,
    presets: ['Studio Fashion', 'Korean Fashion', 'Streetwear', 'Luxury Fashion'],
    phase: 1,
  },
  {
    href:  '/studio/image/model-swap',
    icon:  '🔄',
    label: 'Model Swap AI',
    desc:  'Ganti model di foto produk fashion. Model lokal, hijab, western, ganti gender model.',
    color:  C.orange,
    bg:     C.o50,
    badge: null,
    presets: ['Model Lokal', 'Hijab Model', 'Western Model', 'Gender Swap'],
    phase: 1,
  },
  {
    href:  '/studio/image/face-swap',
    icon:  '😊',
    label: 'Face Swap AI',
    desc:  'Ganti wajah model dengan AI. Owner branding, affiliate personal branding, custom creator ads.',
    color:  C.cyan,
    bg:     C.c50,
    badge: null,
    presets: ['Personal Branding', 'Creator Ads', 'Owner Face'],
    phase: 1,
  },
  {
    href:  '/studio/image/enhancer',
    icon:  '✨',
    label: 'Product Enhancer AI',
    desc:  'Foto produk biasa → aesthetic premium ecommerce. Shopee clean, TikTok viral, luxury ads.',
    color:  C.green,
    bg:     C.g50,
    badge: null,
    presets: ['Shopee Clean', 'TikTok Viral', 'Luxury Ads', 'Korean Minimal'],
    phase: 1,
  },
]

// ── 2. AI VIDEO GENERATOR ─────────────────────────────────────
const VIDEO_ENGINE = [
  {
    href: '/studio/video/product',
    icon: '🎬', label: 'Product Video AI',
    desc: 'Video produk sinematik otomatis dari foto produk.',
    color: C.purple, phase: 1,
  },
  {
    href: '/studio/video/ugc',
    icon: '📱', label: 'UGC Video Generator',
    desc: 'Unboxing, review, daily use — gaya UGC authentic.',
    color: C.pink, phase: 1,
  },
  {
    href: '/studio/video/tiktok',
    icon: '🎵', label: 'TikTok Reels AI',
    desc: 'Script + visual TikTok/Reels siap posting.',
    color: C.brand, phase: 1,
  },
  {
    href: '/studio/video/avatar',
    icon: '🤖', label: 'AI Avatar Video',
    desc: 'Video presenter AI berbicara otomatis.',
    color: C.amber, phase: 2,
  },
]

// ── 3. AI MARKETING TOOLS ─────────────────────────────────────
const MARKETING_TOOLS = [
  { icon:'✍️', label:'Caption Generator',     desc:'Soft selling, hard selling, storytelling',   color:C.brand,  href:'/quick-tools?tool=caption', phase:1 },
  { icon:'🎣', label:'Hook Generator',        desc:'Scroll stopper, FOMO, curiosity hook',        color:C.purple, href:'/quick-tools?tool=hook',    phase:1 },
  { icon:'🎯', label:'CTA Generator',         desc:'Urgency, affiliate, marketplace, WhatsApp',   color:C.red,    href:'/quick-tools?tool=cta',     phase:1 },
  { icon:'📋', label:'Product Description',   desc:'Marketplace & SEO optimized',                 color:C.green,  href:'/quick-tools?tool=desc',    phase:1 },
  { icon:'#️⃣', label:'Hashtag Generator',    desc:'TikTok, Instagram, Shopee trending',          color:C.cyan,   href:'/quick-tools?tool=hashtag', phase:1 },
  { icon:'📈', label:'Ad Copy Generator',     desc:'Facebook Ads, TikTok Ads, Shopee Ads',        color:C.amber,  href:'/quick-tools?tool=adcopy',  phase:2 },
]

// ── Component: Engine Section ─────────────────────────────────
function EngineHeader({ number, title, subtitle, gradient, icon }: {
  number: string; title: string; subtitle: string; gradient: string; icon: string
}) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'14px', marginBottom:'18px' }}>
      <div style={{ width:'52px', height:'52px', borderRadius:'15px', background:gradient, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0, boxShadow:`0 6px 20px rgba(0,0,0,.12)` }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:'10px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'3px' }}>
          Core Engine {number}
        </div>
        <h2 style={{ fontSize:'18px', fontWeight:700, color:C.slate900, marginBottom:'2px', letterSpacing:'-0.01em' }}>{title}</h2>
        <p style={{ fontSize:'12px', color:C.slate500 }}>{subtitle}</p>
      </div>
    </div>
  )
}

export default function StudioPage() {
  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── PAGE HEADER ──────────────────────────────────────── */}
      <div style={{ marginBottom:'28px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#7C3AED,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🎨</div>
          <h1 style={{ fontSize:'24px', fontWeight:700, color:C.slate900, letterSpacing:'-0.02em' }}>AI Studio</h1>
          <span style={{ padding:'3px 10px', borderRadius:'20px', background:'linear-gradient(135deg,#EFF6FF,#F5F3FF)', border:`1px solid ${C.b100}`, fontSize:'11px', fontWeight:700, color:C.brand }}>
            2 Core Engines
          </span>
        </div>
        <p style={{ fontSize:'13px', color:C.slate500, lineHeight:1.5 }}>
          Ubah foto produk biasa menjadi visual premium siap jual. Didukung AI terdepan untuk seller & affiliator Indonesia.
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════
          ENGINE 1: AI IMAGE GENERATOR
      ════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:'40px' }}>
        <EngineHeader
          number="1"
          icon="🖼️"
          title="AI Image Generator"
          subtitle="7 fitur unggulan untuk mengubah foto produk menjadi visual premium yang menjual"
          gradient="linear-gradient(135deg,#2563EB,#7C3AED)"
        />

        {/* Hero card — Photoshoot (most popular) */}
        <Link href={IMAGE_ENGINE[0].href} style={{ textDecoration:'none', display:'block', marginBottom:'12px' }}>
          <div style={{ padding:'22px 24px', borderRadius:'18px', background:`linear-gradient(135deg, ${C.brand}10, ${C.purple}08)`, border:`2px solid ${C.brand}30`, cursor:'pointer', display:'flex', alignItems:'center', gap:'18px', position:'relative', overflow:'hidden', transition:'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.brand; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${C.brand}20` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.brand}30`; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            {/* Background decoration */}
            <div style={{ position:'absolute', right:'24px', top:'50%', transform:'translateY(-50%)', fontSize:'80px', opacity:.07 }}>🌟</div>

            <div style={{ width:'64px', height:'64px', borderRadius:'18px', background:`linear-gradient(135deg,${C.brand},${C.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px', flexShrink:0 }}>
              {IMAGE_ENGINE[0].icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                <span style={{ fontSize:'16px', fontWeight:700, color:C.slate900 }}>{IMAGE_ENGINE[0].label}</span>
                <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:C.brand, color:'#fff' }}>
                  ⭐ {IMAGE_ENGINE[0].badge}
                </span>
              </div>
              <p style={{ fontSize:'13px', color:C.slate600, marginBottom:'10px', lineHeight:1.5 }}>{IMAGE_ENGINE[0].desc}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {IMAGE_ENGINE[0].presets.map(p => (
                  <span key={p} style={{ fontSize:'10px', padding:'3px 9px', borderRadius:'20px', background:C.b50, border:`1px solid ${C.b100}`, color:C.brand, fontWeight:600 }}>{p}</span>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'9px 18px', borderRadius:'11px', background:C.brand, color:'#fff', fontSize:'13px', fontWeight:700, flexShrink:0 }}>
              Buka <ChevronRight size={14}/>
            </div>
          </div>
        </Link>

        {/* Grid — 6 other sub features */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,320px),1fr))', gap:'10px' }}>
          {IMAGE_ENGINE.slice(1).map((t, i) => (
            <Link key={i} href={t.href} style={{ textDecoration:'none' }}>
              <div style={{ padding:'16px 18px', borderRadius:'14px', background:C.w, border:`1.5px solid ${C.slate200}`, cursor:'pointer', display:'flex', gap:'13px', alignItems:'flex-start', transition:'all .15s', position:'relative', overflow:'hidden', height:'100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = t.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${t.color}18` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, ${t.color}, ${t.color}60)` }}/>
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{t.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                    <span style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>{t.label}</span>
                    {t.badge && <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background:t.badgeColor??t.color, color:'#fff' }}>{t.badge}</span>}
                  </div>
                  <p style={{ fontSize:'11px', color:C.slate500, lineHeight:1.5, marginBottom:'8px' }}>{t.desc}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                    {t.presets.slice(0,3).map(p => (
                      <span key={p} style={{ fontSize:'9px', padding:'2px 7px', borderRadius:'20px', background:t.bg, color:t.color, fontWeight:600, border:`1px solid ${t.color}25` }}>{p}</span>
                    ))}
                    {t.presets.length > 3 && <span style={{ fontSize:'9px', color:C.slate400 }}>+{t.presets.length-3}</span>}
                  </div>
                  <div style={{ marginTop:'8px', fontSize:'11px', fontWeight:700, color:t.color, display:'flex', alignItems:'center', gap:'3px' }}>
                    Buka Studio <ChevronRight size={11}/>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          ENGINE 2: AI VIDEO GENERATOR
      ════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:'40px' }}>
        <EngineHeader
          number="2"
          icon="🎬"
          title="AI Video Generator"
          subtitle="Buat video produk, UGC, TikTok Reels dan AI presenter — tanpa kamera, tanpa editing"
          gradient="linear-gradient(135deg,#7C3AED,#DB2777)"
        />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,260px),1fr))', gap:'10px' }}>
          {VIDEO_ENGINE.map((t, i) => {
            const isLocked = t.phase > 1
            return (
              <div key={i} style={{ position:'relative' }}>
                {isLocked && (
                  <div style={{ position:'absolute', inset:0, borderRadius:'14px', background:'rgba(248,250,252,.7)', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
                    <div style={{ textAlign:'center' }}>
                      <Lock size={14} color={C.slate400}/>
                      <div style={{ fontSize:'10px', color:C.slate400, marginTop:'4px', fontWeight:600 }}>Phase 2</div>
                    </div>
                  </div>
                )}
                <Link href={isLocked ? '#' : t.href} style={{ textDecoration:'none', pointerEvents: isLocked ? 'none' : 'auto' }}>
                  <div style={{ padding:'18px', borderRadius:'14px', background: isLocked ? C.slate50 : C.w, border:`1.5px solid ${isLocked?C.slate100:C.slate200}`, cursor:isLocked?'default':'pointer', transition:'all .15s', opacity:isLocked?.7:1 }}
                    onMouseEnter={e => { if (!isLocked) { (e.currentTarget as HTMLElement).style.borderColor = t.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${t.color}20` }}}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isLocked?C.slate100:C.slate200; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ fontSize:'30px', marginBottom:'10px' }}>{t.icon}</div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900, marginBottom:'4px' }}>{t.label}</div>
                    <div style={{ fontSize:'11px', color:C.slate500, lineHeight:1.5 }}>{t.desc}</div>
                    {!isLocked && (
                      <div style={{ marginTop:'10px', fontSize:'11px', fontWeight:700, color:t.color, display:'flex', alignItems:'center', gap:'3px' }}>
                        Generate Video <ChevronRight size={11}/>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          AI MARKETING TOOLS (Pendukung)
      ════════════════════════════════════════════════════════ */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'18px' }}>
          <div style={{ width:'52px', height:'52px', borderRadius:'15px', background:'linear-gradient(135deg,#D97706,#DC2626)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0, boxShadow:'0 6px 20px rgba(0,0,0,.12)' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'3px' }}>Pendukung</div>
            <h2 style={{ fontSize:'18px', fontWeight:700, color:C.slate900, marginBottom:'2px', letterSpacing:'-0.01em' }}>AI Marketing Tools</h2>
            <p style={{ fontSize:'12px', color:C.slate500 }}>Auto-generate marketing assets setelah gambar/video selesai dibuat</p>
          </div>
        </div>

        {/* Marketing flow info */}
        <div style={{ padding:'14px 16px', background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border:`1px solid #FCD34D`, borderRadius:'13px', marginBottom:'14px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
          <Sparkles size={16} color={C.amber} style={{ flexShrink:0, marginTop:'1px' }}/>
          <div>
            <div style={{ fontSize:'12px', fontWeight:700, color:C.amber, marginBottom:'4px' }}>
              Smart Marketing Assistant — Otomatis setelah generate gambar
            </div>
            <div style={{ fontSize:'11px', color:C.slate700, lineHeight:1.6 }}>
              Setelah AI Image selesai → BeeSell otomatis generate caption, hook, CTA, hashtag, dan ad copy yang relevan dengan gambar yang dibuat.
              Hasil tersedia di <b>Result Page</b> dengan tab terpisah per format.
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,200px),1fr))', gap:'8px' }}>
          {MARKETING_TOOLS.map((t, i) => {
            const isLocked = t.phase > 1
            return (
              <Link key={i} href={isLocked ? '#' : t.href} style={{ textDecoration:'none', pointerEvents:isLocked?'none':'auto' }}>
                <div style={{ padding:'13px 14px', borderRadius:'12px', background:isLocked?C.slate50:C.w, border:`1.5px solid ${isLocked?C.slate100:C.slate200}`, cursor:isLocked?'default':'pointer', display:'flex', gap:'10px', alignItems:'flex-start', opacity:isLocked?.6:1, transition:'all .13s' }}
                  onMouseEnter={e => { if (!isLocked) { (e.currentTarget as HTMLElement).style.borderColor = t.color; (e.currentTarget as HTMLElement).style.background = `${t.color}08` }}}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isLocked?C.slate100:C.slate200; (e.currentTarget as HTMLElement).style.background = isLocked?C.slate50:C.w }}
                >
                  <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:`${t.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', flexShrink:0 }}>{t.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:isLocked?C.slate400:C.slate900, marginBottom:'2px', display:'flex', alignItems:'center', gap:'5px' }}>
                      {t.label}
                      {isLocked && <Lock size={10} color={C.slate300}/>}
                    </div>
                    <div style={{ fontSize:'10px', color:C.slate400, lineHeight:1.4 }}>{t.desc}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Result Page Info ───────────────────────────────── */}
      <div style={{ marginTop:'28px', padding:'18px 20px', borderRadius:'16px', background:`linear-gradient(135deg, ${C.slate900}, #1E293B)`, color:C.w, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:'20px', top:'50%', transform:'translateY(-50%)', fontSize:'70px', opacity:.06 }}>✨</div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'14px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>🖥️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'14px', fontWeight:700, marginBottom:'5px', display:'flex', alignItems:'center', gap:'7px' }}>
              Result Page Experience
              <span style={{ fontSize:'9px', padding:'2px 7px', borderRadius:'20px', background:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.8)', fontWeight:600 }}>Canva-like UI</span>
            </div>
            <p style={{ fontSize:'12px', opacity:.75, lineHeight:1.6, marginBottom:'12px' }}>
              Setiap generate selesai → tampil halaman hasil premium dengan before/after slider, marketing assets siap pakai, dan bulk download.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {[
                '🔄 Before/After Slider',
                '⬆️ Upscale HD',
                '💾 Download PNG/JPG/ZIP',
                '🔁 Regenerate Variasi',
                '✍️ Caption Tab',
                '🎣 Hook Tab',
                '🎯 CTA Tab',
                '#️⃣ Hashtag Tab',
                '📈 Ad Copy Tab',
                '📋 Copy All',
              ].map(item => (
                <span key={item} style={{ fontSize:'10px', padding:'4px 10px', borderRadius:'20px', background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.85)', fontWeight:500, display:'flex', alignItems:'center', gap:'4px' }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`* { box-sizing:border-box }`}</style>
    </div>
  )
}