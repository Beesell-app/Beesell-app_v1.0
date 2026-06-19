'use client'
// app/(dashboard)/studio/page.tsx
// ══════════════════════════════════════════════════════════════
// BeeSell AI Studio — Real User Mode (CLEAN VERSION)
//
// PERBAIKAN dari versi sebelumnya:
// ✓ Hapus hooks yang dipanggil di module level (selectedAvatarId, avatarSource)
//   → itu ILEGAL, hooks hanya boleh di dalam component
// ✓ Tambah koma yang hilang di import (getStudioBySub, type Category)
// ✓ Hapus getStudioBySub() yang dipanggil di module level
// ✓ TIDAK ADA kode API/auth/upload di sini (itu file terpisah!)
// ══════════════════════════════════════════════════════════════

import Link from 'next/link'
import { useState } from 'react'
import {
  Sparkles, ArrowRight, Lock, Crown, Wand2, Video,
  Package, Image as ImageIcon, Search, Infinity as InfinityIcon,
} from 'lucide-react'
import { FEATURES } from '@/components/dashboard/studio-menu-config'
import {
  CATEGORY_INFO, CATEGORY_ORDER, SUB_INFO,
  type Category, type StudioSub, type FeatureItem,
} from '@/components/dashboard/studio-menu-config'
import { useUserRole }   from '@/hooks/use-user-role'
import { useDailyUsage } from '@/hooks/use-daily-usage'

// ── Amber Lebah tokens ────────────────────────────────────────
const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  honey:'#FDE68A', honeyDk:'#FBBF24',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB', borderHi:'#D1D5DB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5',
  red:'#EF4444', purple:'#7C3AED', blue:'#3B82F6',
  sh:'0 1px 3px rgba(0,0,0,.06)',
  sm:'0 4px 16px rgba(0,0,0,.08)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

const HERO_IDS = ['ai-image-generator', 'ai-video-generator', 'packshot', 'ugc-generator']
const TIER_ORDER: Record<string, number> = { starter:0, free:0, basic:1, pro:2, business:3 }

export default function StudioPage() {
  // ── Sumber kebenaran user — DARI HOOK ASLI ──────────────────
  const { isSuperuser } = useUserRole()
  const { tier: userTier } = useDailyUsage()

  const [search, setSearch] = useState('')

  // Filter by search
  const filtered = search
    ? FEATURES.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase())
      )
    : FEATURES

  // Hero items (defensive — skip kalau id tidak ada di registry)
  const heroItems = HERO_IDS
    .map(id => FEATURES.find(f => f.id === id))
    .filter(Boolean) as FeatureItem[]

  // Helpers
  const sortItems = (arr: FeatureItem[]) =>
    [...arr].sort((a, b) =>
      (a.sortOrder ?? 100) - (b.sortOrder ?? 100) || a.name.localeCompare(b.name))

  return (
    <div style={{ maxWidth:1240, margin:'0 auto', fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom:18 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'5px 12px', borderRadius:99,
          background: isSuperuser ? `linear-gradient(135deg,${C.amber},${C.amberDk})` : C.amberLt,
          color: isSuperuser ? '#fff' : C.amberDk,
          fontSize:11, fontWeight:800, letterSpacing:'0.06em', marginBottom:12,
        }}>
          {isSuperuser ? <><Crown size={11}/> SUPERUSER MODE — UNLIMITED</> : <><Sparkles size={11}/> 🐝 BEESELL AI STUDIO</>}
        </div>
        <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, letterSpacing:'-0.03em', color:C.ink, margin:'0 0 6px' }}>
          Mau bikin konten apa hari ini?
        </h1>
        <p style={{ fontSize:13, color:C.inkMuted, margin:0 }}>
          {isSuperuser
            ? <>Akses penuh tanpa batas · <strong style={{color:C.amberDk}}>{FEATURES.length}</strong> tool semua unlocked</>
            : <>{FEATURES.length} tool tersedia · Tier kamu: <strong style={{color:C.amberDk}}>{userTier?.toUpperCase() ?? 'STARTER'}</strong></>
          }
        </p>
      </div>

      {/* ── Search ────────────────────────────────────────── */}
      <div style={{ position:'relative', marginBottom:24, maxWidth:480 }}>
        <Search size={15} color={C.inkDim} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)' }}/>
        <input
          type="text" placeholder="Cari tool — mis. video, packshot, caption…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width:'100%', padding:'10px 14px 10px 36px',
            borderRadius:10, border:`1px solid ${C.border}`,
            background:C.surface, fontSize:13, fontFamily:'inherit',
            outline:'none', boxShadow:C.sh, color:C.ink,
          }}
          onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
          onBlur ={e => (e.target as HTMLElement).style.borderColor = C.border}
        />
        {search && (
          <div style={{ marginTop:6, fontSize:11, color:C.inkMuted }}>
            {filtered.length} hasil untuk "{search}"
          </div>
        )}
      </div>

      {/* ── HERO ROW ──────────────────────────────────────── */}
      {!search && heroItems.length > 0 && (
        <section style={{ marginBottom:30 }}>
          <h2 style={{ fontSize:13, fontWeight:800, color:C.inkSub, marginBottom:12, letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ width:24, height:3, borderRadius:2, background:C.amber }}/>
            ✨ FITUR UTAMA
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }} className="hero-grid">
            {heroItems.map(item => (
              <HeroCard key={item.id} item={item} userTier={userTier} isSuperuser={isSuperuser}/>
            ))}
          </div>
        </section>
      )}

      {/* ── Kategori utama (non-studio) ───────────────────── */}
      {CATEGORY_ORDER.map(cat => {
        if (cat === 'studio') return null
        const items = sortItems(
          (search ? filtered : FEATURES).filter(f =>
            f.category === cat && (search || !HERO_IDS.includes(f.id))
          )
        )
        if (items.length === 0) return null
        return <CategorySection key={cat} cat={cat} items={items} userTier={userTier} isSuperuser={isSuperuser}/>
      })}

      {/* ── Studio (image + video) ────────────────────────── */}
      {(() => {
        const src = search ? filtered : FEATURES
        const image = sortItems(src.filter(f => f.category === 'studio' && (f.subCategory ?? 'image') === 'image' && (search || !HERO_IDS.includes(f.id))))
        const video = sortItems(src.filter(f => f.category === 'studio' && f.subCategory === 'video' && (search || !HERO_IDS.includes(f.id))))
        if (image.length === 0 && video.length === 0) return null
        const info = CATEGORY_INFO.studio
        return (
          <section style={{ marginBottom:32 }}>
            <CategoryHeader emoji={info.emoji} label={info.label} description={info.description} count={image.length + video.length}/>
            {image.length > 0 && <SubSection sub="image" items={image} userTier={userTier} isSuperuser={isSuperuser}/>}
            {video.length > 0 && <SubSection sub="video" items={video} userTier={userTier} isSuperuser={isSuperuser}/>}
          </section>
        )
      })()}

      {/* ── Empty state ───────────────────────────────────── */}
      {search && filtered.length === 0 && (
        <div style={{ padding:'48px 20px', textAlign:'center', borderRadius:12, background:C.bg, border:`1px dashed ${C.border}` }}>
          <div style={{ fontSize:38, marginBottom:10 }}>🔍</div>
          <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:4 }}>Tidak ada tool yang cocok</div>
          <div style={{ fontSize:12, color:C.inkMuted }}>Coba kata kunci lain</div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        .hero-grid { grid-template-columns:repeat(4,1fr) !important }
        @media (max-width:1024px) { .hero-grid { grid-template-columns:repeat(2,1fr) !important } }
        @media (max-width:520px)  { .hero-grid { grid-template-columns:1fr !important } }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Locking helper — SATU sumber kebenaran untuk semua kartu
// ══════════════════════════════════════════════════════════════
function isLocked(item: FeatureItem, userTier: string | undefined, isSuperuser: boolean): boolean {
  if (isSuperuser) return false  // superuser bypass SEMUANYA
  const have = TIER_ORDER[userTier ?? 'starter'] ?? 0
  const need = TIER_ORDER[item.tierRequired] ?? 0
  return have < need
}

// ══════════════════════════════════════════════════════════════
// HERO CARD
// ══════════════════════════════════════════════════════════════
function HeroCard({ item, userTier, isSuperuser }: { item: FeatureItem; userTier: string | undefined; isSuperuser: boolean }) {
  const locked = isLocked(item, userTier, isSuperuser)
  const href   = locked ? `/billing?upgrade=${item.tierRequired}` : item.href

  const Icon =
    item.id === 'ai-image-generator' ? Wand2 :
    item.id === 'ai-video-generator' ? Video :
    item.id === 'packshot'           ? Package :
    item.id === 'ugc-generator'      ? ImageIcon : Sparkles

  return (
    <Link href={href} style={{ textDecoration:'none' }}>
      <div style={{
        padding:'18px 18px', borderRadius:14, minHeight:175,
        background: locked ? C.bg : `linear-gradient(135deg,${C.amberXlt} 0%,${C.amberLt} 60%,${C.honey}55 100%)`,
        border: `1.5px solid ${locked ? C.border : C.amber + '50'}`,
        boxShadow: locked ? C.sh : C.sa,
        position:'relative', overflow:'hidden',
        transition:'all .2s', cursor:'pointer',
        opacity: locked ? 0.82 : 1,
        display:'flex', flexDirection:'column',
      }}
        onMouseEnter={e => { if (!locked) { (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 12px 30px ${C.amber}30` } }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow = locked ? C.sh : C.sa }}>
        <div aria-hidden style={{ position:'absolute', top:-20, right:-20, fontSize:96, opacity:0.08, lineHeight:1, pointerEvents:'none' }}>🍯</div>

        {locked && (
          <div style={{ position:'absolute', top:11, right:11, padding:'3px 8px', borderRadius:99, background:'#fff', border:`1px solid ${C.border}`, fontSize:9, fontWeight:800, color:C.inkMuted, display:'inline-flex', alignItems:'center', gap:3 }}>
            <Lock size={10}/> {item.tierRequired.toUpperCase()}
          </div>
        )}
        {!locked && isSuperuser && (
          <div style={{ position:'absolute', top:11, right:11, padding:'3px 8px', borderRadius:99, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, fontSize:9, fontWeight:800, color:'#fff', letterSpacing:'0.04em', display:'inline-flex', alignItems:'center', gap:3 }}>
            <InfinityIcon size={10}/>
          </div>
        )}
        {!locked && !isSuperuser && item.badge && (
          <div style={{ position:'absolute', top:11, right:11, padding:'3px 8px', borderRadius:99, background:'#fff', border:`1px solid ${C.amber}40`, fontSize:9, fontWeight:800, color:C.amberDk, letterSpacing:'0.04em' }}>
            {item.badge}
          </div>
        )}

        <div style={{ width:42, height:42, borderRadius:10, background:'#fff', boxShadow:C.sh, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:11 }}>
          <Icon size={20} color={C.amberDk}/>
        </div>
        <div style={{ fontSize:14, fontWeight:800, color:C.ink, marginBottom:4, letterSpacing:'-0.01em' }}>{item.name}</div>
        <div style={{ fontSize:11, color:C.inkSub, lineHeight:1.5, marginBottom:12, flex:1 }}>
          {truncate(item.description, 90)}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:C.amberDk }}>
            {locked ? 'Upgrade' : 'Mulai'} <ArrowRight size={11}/>
          </span>
          {item.isMetered && (
            <span style={{ fontSize:10, fontWeight:700, color:C.amberDk, background:'#fff', padding:'2px 7px', borderRadius:99, border:`1px solid ${C.amber}30` }}>
              {isSuperuser ? <InfinityIcon size={10} style={{verticalAlign:'middle'}}/> : `${item.credit}⚡`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ══════════════════════════════════════════════════════════════
// SECTIONS
// ══════════════════════════════════════════════════════════════
function CategorySection({ cat, items, userTier, isSuperuser }: {
  cat: Category; items: FeatureItem[]; userTier: string | undefined; isSuperuser: boolean
}) {
  const info = CATEGORY_INFO[cat]
  return (
    <section style={{ marginBottom:30 }}>
      <CategoryHeader emoji={info.emoji} label={info.label} description={info.description} count={items.length}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
        {items.map(it => <ToolCard key={it.id} item={it} userTier={userTier} isSuperuser={isSuperuser}/>)}
      </div>
    </section>
  )
}

function SubSection({ sub, items, userTier, isSuperuser }: {
  sub: StudioSub; items: FeatureItem[]; userTier: string | undefined; isSuperuser: boolean
}) {
  const info = SUB_INFO[sub]
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:9, padding:'0 2px' }}>
        <span style={{ fontSize:13 }}>{info.emoji}</span>
        <span style={{ fontSize:11, fontWeight:800, color:C.inkSub, letterSpacing:'0.06em', textTransform:'uppercase' }}>{info.label}</span>
        <span style={{ flex:1, height:1, background:C.border, marginLeft:6 }}/>
        <span style={{ fontSize:10, color:C.inkDim }}>{items.length} tool</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
        {items.map(it => <ToolCard key={it.id} item={it} userTier={userTier} isSuperuser={isSuperuser}/>)}
      </div>
    </div>
  )
}

function CategoryHeader({ emoji, label, description, count }: { emoji:string; label:string; description:string; count:number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
      <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, color:'#fff', boxShadow:`0 4px 12px ${C.amber}30` }}>{emoji}</div>
      <div style={{ flex:1 }}>
        <h2 style={{ fontSize:16, fontWeight:800, color:C.ink, margin:'0 0 2px' }}>{label}</h2>
        <p style={{ fontSize:11, color:C.inkMuted, margin:0 }}>{description}</p>
      </div>
      <span style={{ padding:'4px 11px', borderRadius:99, background:C.amberXlt, color:C.amberDk, fontSize:11, fontWeight:700, border:`1px solid ${C.amber}30` }}>
        {count}
      </span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TOOL CARD
// ══════════════════════════════════════════════════════════════
function ToolCard({ item, userTier, isSuperuser }: { item: FeatureItem; userTier: string | undefined; isSuperuser: boolean }) {
  const locked = isLocked(item, userTier, isSuperuser)
  const href   = locked ? `/billing?upgrade=${item.tierRequired}` : item.href

  return (
    <Link href={href} style={{ textDecoration:'none' }}>
      <div style={{
        padding:14, borderRadius:12, background:C.surface,
        border:`1px solid ${C.border}`, boxShadow:C.sh,
        transition:'all .15s', cursor:'pointer',
        opacity: locked ? 0.72 : 1, position:'relative', minHeight:140,
      }}
        onMouseEnter={e => { if (!locked) { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=C.sm; (e.currentTarget as HTMLElement).style.borderColor=C.amber+'80' } }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow=C.sh; (e.currentTarget as HTMLElement).style.borderColor=C.border }}>

        {locked ? (
          <div style={{ position:'absolute', top:10, right:10, width:22, height:22, borderRadius:99, background:C.bg, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Lock size={10} color={C.inkMuted}/>
          </div>
        ) : isSuperuser ? (
          <div style={{ position:'absolute', top:10, right:10, padding:'2px 7px', borderRadius:99, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:9, fontWeight:800, display:'inline-flex', alignItems:'center', gap:2 }}>
            <InfinityIcon size={9}/>
          </div>
        ) : item.badge ? (
          <div style={{
            position:'absolute', top:10, right:10,
            padding:'2px 8px', borderRadius:99,
            background:
              item.badge === 'POPULAR'  ? C.amber :
              item.badge === 'NEW'      ? C.green :
              item.badge === 'BETA'     ? C.blue  :
              item.badge === 'BUSINESS' ? '#6366F1' :
              item.badge === 'PRO'      ? C.purple :
                                          C.amberDk,
            color:'#fff', fontSize:9, fontWeight:800, letterSpacing:'0.04em',
          }}>{item.badge}</div>
        ) : null}

        <div style={{
          width:36, height:36, borderRadius:9,
          background:`linear-gradient(135deg,${C.amberLt},${C.honey})`,
          border:`1px solid ${C.amber}30`,
          fontSize:18, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:8,
        }}>{item.icon}</div>

        <h3 style={{ fontSize:13, fontWeight:800, color:C.ink, margin:'0 0 3px' }}>{item.name}</h3>
        <p style={{ fontSize:11, color:C.inkMuted, lineHeight:1.5, margin:'0 0 11px', minHeight:30 }}>
          {truncate(item.description, 75)}
        </p>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:9, borderTop:`1px solid ${C.border}` }}>
          {item.isMetered ? (
            <span style={{ fontSize:10, fontWeight:700, color:C.amberDk, background:C.amberLt, padding:'3px 8px', borderRadius:99 }}>
              {isSuperuser ? <><InfinityIcon size={10} style={{verticalAlign:'middle'}}/> unlimited</> : `${item.credit}⚡ credit`}
            </span>
          ) : locked ? (
            <span style={{ fontSize:10, fontWeight:700, color:C.inkMuted }}>{item.tierRequired.toUpperCase()}+</span>
          ) : (
            <span style={{ fontSize:10, fontWeight:600, color:C.green }}>✓ Tersedia</span>
          )}
          <ArrowRight size={12} color={C.amberDk}/>
        </div>
      </div>
    </Link>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s
}