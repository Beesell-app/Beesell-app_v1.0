'use client'
// app/(dashboard)/settings/page.tsx
// ══════════════════════════════════════════════════════════════
// BEESELL AI — Settings Page v3
// ✅ Semua field editable (per-section, save partial)
// ✅ Data terintegrasi dengan onboarding (ai_memory)
// ✅ Promoting copy kontekstual per section
// ✅ Light theme — amber primary
// ✅ Responsive mobile/tablet/desktop
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  User, Store, Palette, Globe, Brain, CreditCard,
  Edit3, Save, X, Check, AlertCircle, Loader2,
  ChevronRight, Sparkles, Bell, Shield, LogOut,
  Target, Zap, Star, ArrowRight, RefreshCw,
  MessageCircle, Hash, Info, Package, Mic,
} from 'lucide-react'

// ── Tokens ────────────────────────────────────────────────────
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
  sh:  '0 1px 3px rgba(0,0,0,.06)',
  sm:  '0 4px 16px rgba(0,0,0,.07)',
  sa:  '0 6px 20px rgba(245,158,11,.22)',
}

// ── Lookup maps (same as onboarding) ─────────────────────────
const SELLER_TYPES   = [
  { v:'seller',     l:'Marketplace Seller' },
  { v:'affiliator', l:'Affiliator / Kreator' },
  { v:'dropshipper',l:'Dropshipper' },
  { v:'brand',      l:'Brand Owner' },
  { v:'umkm',       l:'UMKM' },
  { v:'reseller',   l:'Reseller' },
  { v:'creator',    l:'Content Creator' },
]
const NICHES = [
  { v:'fashion',    l:'👗 Fashion',     e:'👗' },
  { v:'skincare',   l:'✨ Skincare',    e:'✨' },
  { v:'beauty',     l:'💄 Beauty',      e:'💄' },
  { v:'food',       l:'🍜 Food',        e:'🍜' },
  { v:'beverage',   l:'🥤 Minuman',     e:'🥤' },
  { v:'gadget',     l:'📱 Gadget',      e:'📱' },
  { v:'electronics',l:'⚡ Elektronik',  e:'⚡' },
  { v:'health',     l:'💊 Kesehatan',   e:'💊' },
  { v:'furniture',  l:'🛋️ Furniture',   e:'🛋️' },
  { v:'hijab',      l:'🧕 Hijab',       e:'🧕' },
  { v:'baby',       l:'👶 Baby',        e:'👶' },
  { v:'home',       l:'🏡 Home Living', e:'🏡' },
  { v:'other',      l:'📦 Lainnya',     e:'📦' },
]
const PLATFORMS = [
  { v:'shopee',      l:'Shopee',          e:'🛍️' },
  { v:'tokopedia',   l:'Tokopedia',       e:'🟢' },
  { v:'tiktok-shop', l:'TikTok Shop',     e:'🎵' },
  { v:'instagram',   l:'Instagram',       e:'📸' },
  { v:'tiktok',      l:'TikTok',          e:'🎬' },
  { v:'facebook',    l:'Facebook',        e:'👥' },
  { v:'whatsapp',    l:'WhatsApp',        e:'💬' },
  { v:'youtube',     l:'YouTube',         e:'▶️' },
  { v:'lazada',      l:'Lazada',          e:'📦' },
]
const AUDIENCES = [
  { v:'remaja',       l:'Remaja' },
  { v:'mahasiswa',    l:'Mahasiswa' },
  { v:'ibu-rt',       l:'Ibu Rumah Tangga' },
  { v:'pria-dewasa',  l:'Pria Dewasa' },
  { v:'wanita-karir', l:'Wanita Karir' },
  { v:'gen-z',        l:'Gen Z' },
  { v:'milenial',     l:'Milenial' },
  { v:'luxury',       l:'Luxury Buyer' },
]
const GOALS = [
  { v:'more-sales',          l:'Tambah Sales' },
  { v:'save-time',           l:'Hemat Waktu' },
  { v:'better-content',      l:'Konten Berkualitas' },
  { v:'viral-content',       l:'Konten Viral' },
  { v:'branding',            l:'Branding Kuat' },
  { v:'affiliate-conversion',l:'Tingkatkan Konversi' },
]
const VISUAL_STYLES = [
  { v:'realistic',    l:'Realistic' },
  { v:'minimalist',   l:'Minimalist' },
  { v:'luxury',       l:'Luxury' },
  { v:'clean-studio', l:'Clean Studio' },
  { v:'korean',       l:'Korean Style' },
  { v:'dark-moody',   l:'Dark Moody' },
  { v:'cinematic',    l:'Cinematic' },
  { v:'viral-tiktok', l:'Viral TikTok' },
]
const COLOR_TONES = [
  { v:'warm',          l:'Warm' },
  { v:'soft-pastel',   l:'Soft Pastel' },
  { v:'monochrome',    l:'Monochrome' },
  { v:'gold-luxury',   l:'Gold Luxury' },
  { v:'black-premium', l:'Black Premium' },
  { v:'clean-white',   l:'Clean White' },
  { v:'vibrant',       l:'Vibrant' },
  { v:'earth-tone',    l:'Earth Tone' },
]
const TONES = [
  { v:'casual',       l:'😊 Santai & Friendly' },
  { v:'professional', l:'💼 Profesional' },
  { v:'energetic',    l:'⚡ Energik' },
  { v:'luxury',       l:'💎 Luxury' },
  { v:'playful',      l:'🎉 Playful' },
  { v:'islami',       l:'☪️ Islami' },
  { v:'motivational', l:'🚀 Motivasional' },
]
const LANGUAGES = [
  { v:'indonesian-casual', l:'🇮🇩 Indonesia Santai' },
  { v:'indonesian-formal', l:'🇮🇩 Indonesia Formal' },
  { v:'mixed-english',     l:'🌏 Mix Indo-English' },
  { v:'full-english',      l:'🇺🇸 English' },
]
const PRICE_RANGES = ['< Rp 50K','Rp 50K – 200K','Rp 200K – 500K','Rp 500K – 2Jt','> Rp 2Jt']
const FREQ_OPTIONS = [
  { v:'1-2/week',      l:'1-2× seminggu' },
  { v:'3-4/week',      l:'3-4× seminggu' },
  { v:'daily',         l:'Setiap hari' },
  { v:'multiple-daily',l:'2+ kali/hari' },
]

// ── Mini UI atoms ─────────────────────────────────────────────
function Shimmer({ h = '14px', w = '100%' }: { h?: string; w?: string }) {
  return (
    <div style={{ width:w, height:h, borderRadius:'7px', background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize:'200%', animation:'shimmer 1.4s ease-in-out infinite' }}/>
  )
}

function Chip({
  label, active, onClick, color = C.amber, size = 'md',
}: { label:string; active:boolean; onClick:()=>void; color?:string; size?:'sm'|'md' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding:      size === 'sm' ? '4px 10px' : '6px 13px',
        borderRadius: '99px',
        border:       `1.5px solid ${active ? color : C.border}`,
        background:   active ? `${color}12` : C.white,
        color:        active ? color : C.inkMuted,
        fontSize:     size === 'sm' ? '11px' : '12px',
        fontWeight:   active ? 700 : 500,
        cursor:       'pointer',
        transition:   'all .12s',
        fontFamily:   'inherit',
        whiteSpace:   'nowrap',
        boxShadow:    active ? `0 0 0 1px ${color}25` : 'none',
      }}
      onMouseEnter={e => { if (!active)(e.currentTarget as HTMLElement).style.borderColor = color }}
      onMouseLeave={e => { if (!active)(e.currentTarget as HTMLElement).style.borderColor = C.border }}
    >
      {label}
    </button>
  )
}

function TagPill({ label, color = C.amber }: { label:string; color?:string }) {
  return (
    <span style={{ fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'99px', background:`${color}12`, color, lineHeight:1.4 }}>
      {label}
    </span>
  )
}

// ── Input style ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:'100%', padding:'9px 12px', borderRadius:'9px',
  border:`1.5px solid ${C.border}`, fontSize:'13px',
  fontFamily:"'DM Sans',system-ui,sans-serif",
  color:C.ink, outline:'none', boxSizing:'border-box',
  background:C.white, transition:'border-color .15s',
}
const labelStyle: React.CSSProperties = {
  fontSize:'11px', fontWeight:700, color:C.inkMuted,
  textTransform:'uppercase', letterSpacing:'0.07em',
  display:'block', marginBottom:'5px',
}

// ── Field row (display) ───────────────────────────────────────
function FieldRow({ label, value, empty = 'Belum diisi' }: { label:string; value?:string|null; empty?:string }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}`, gap:'10px' }}>
      <span style={{ fontSize:'12px', color:C.inkMuted, flexShrink:0, minWidth:'110px' }}>{label}</span>
      {value
        ? <span style={{ fontSize:'13px', color:C.ink, fontWeight:500, textAlign:'right' }}>{value}</span>
        : <span style={{ fontSize:'12px', color:C.inkDim, fontStyle:'italic' }}>{empty}</span>}
    </div>
  )
}

function TagRow({ label, items, color = C.amber }: { label:string; items:string[]; color?:string }) {
  return (
    <div style={{ padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
      <div style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'6px' }}>{label}</div>
      {items.length === 0
        ? <span style={{ fontSize:'12px', color:C.inkDim, fontStyle:'italic' }}>Belum diisi</span>
        : <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
            {items.map((t, i) => <TagPill key={i} label={t} color={color}/>)}
          </div>}
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────
function Section({
  id, title, icon, children, editButton, promoBanner,
}: {
  id:string; title:string; icon:React.ReactNode;
  children:React.ReactNode; editButton:React.ReactNode;
  promoBanner?:React.ReactNode;
}) {
  return (
    <div
      id={`section-${id}`}
      style={{ background:C.surface, borderRadius:'16px', border:`1px solid ${C.border}`, boxShadow:C.sh, marginBottom:'14px', overflow:'hidden' }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:`1px solid ${C.border}`, background:C.bg }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:C.amberLt, border:`1px solid ${C.amber}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {icon}
          </div>
          <span style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>{title}</span>
        </div>
        {editButton}
      </div>
      {promoBanner}
      <div style={{ padding:'14px 18px' }}>{children}</div>
    </div>
  )
}

// ── Edit / Save / Cancel button group ─────────────────────────
function EditControls({
  sectionKey, editingSection, setEditingSection, onSave, saving, onCancel,
}: {
  sectionKey:string; editingSection:string|null;
  setEditingSection:(s:string|null)=>void;
  onSave:()=>void; saving:boolean; onCancel:()=>void;
}) {
  const isEditing = editingSection === sectionKey
  if (isEditing) {
    return (
      <div style={{ display:'flex', gap:'6px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}
        >
          <X size={12}/> Batal
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 13px', borderRadius:'8px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, fontSize:'12px', fontWeight:700, color:'#fff', cursor:saving?'not-allowed':'pointer', boxShadow:C.sa, fontFamily:'inherit', opacity:saving?.7:1 }}
        >
          {saving ? <Loader2 size={12} style={{ animation:'spin .8s linear infinite' }}/> : <Save size={12}/>}
          Simpan
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => setEditingSection(sectionKey)}
      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.amber; (e.currentTarget as HTMLElement).style.color = C.amberDk }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.inkMuted }}
    >
      <Edit3 size={12}/> Edit
    </button>
  )
}

// ── Promoting banner ──────────────────────────────────────────
function PromoBanner({
  icon, text, cta, href, color = C.amber,
}: { icon:string; text:string; cta?:string; href?:string; color?:string }) {
  return (
    <div style={{ padding:'10px 18px', background:`${color}08`, borderBottom:`1px solid ${color}20`, display:'flex', alignItems:'center', gap:'9px' }}>
      <span style={{ fontSize:'16px', flexShrink:0 }}>{icon}</span>
      <span style={{ fontSize:'12px', color:C.inkSub, lineHeight:1.5, flex:1 }}>{text}</span>
      {cta && href && (
        <Link href={href} style={{ flexShrink:0, fontSize:'11px', fontWeight:700, color, textDecoration:'none', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'3px' }}>
          {cta} <ArrowRight size={10}/>
        </Link>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [data,    setData]    = useState<Record<string,any>>({})
  const [form,    setForm]    = useState<Record<string,any>>({})
  const [loading, setLoading] = useState(true)
  const [editSec, setEditSec] = useState<string|null>(null)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  // Promoting hints returned by PATCH API — shown after save
  const [hints,   setHints]   = useState<string[]>([])

  // ── Load profile ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(({ data: d }) => {
        if (!d) return
        setData(d); setForm(d)
      })
      .catch(() => setError('Gagal memuat data profil. Refresh halaman.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Save section ──────────────────────────────────────────────
  const SECTION_FIELDS: Record<string, string[]> = {
    identity: ['storeName','ownerName','whatsapp','bio','sellerType','businessScale','experience'],
    product:  ['niche','subNiche','productType','priceRange','usp','targetAudience','mainGoals'],
    platform: ['platforms','primaryPlatform','postingFrequency','contentTypes'],
    visual:   ['visualStyle','colorTone','moodTone','primaryColor','brandTagline'],
    voice:    ['tone','language','emoji','ctaStyle','brandKeywords','avoidWords','competitors'],
    notif:    ['notifEmail','notifWhatsapp','notifQuota','notifPlan'],
  }

  const saveSection = useCallback(async (sectionKey: string) => {
    setSaving(true); setError(''); setHints([])
    const fields = SECTION_FIELDS[sectionKey] ?? []
    const patch: Record<string,any> = {}
    fields.forEach(f => { if (form[f] !== undefined) patch[f] = form[f] })

    try {
      const res = await fetch('/api/settings/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(patch),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? 'Simpan gagal')
      }
      const result = await res.json()
      // Merge saved fields into local data
      setData(prev => ({ ...prev, ...patch }))
      setEditSec(null)
      setSaved(true); setTimeout(() => setSaved(false), 4000)
      // Show promoting hints from API
      if (result.hints?.length) {
        setHints(result.hints)
        setTimeout(() => setHints([]), 8000)
      }
    } catch (e: any) {
      setError(e.message ?? 'Gagal menyimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }, [form])

  const cancelEdit = useCallback(() => {
    setForm(data)
    setEditSec(null)
    setError('')
  }, [data])

  // ── Form helpers ──────────────────────────────────────────────
  const set = (key: string, val: unknown) =>
    setForm(p => ({ ...p, [key]: val }))
  const tog = (key: string, val: string) =>
    setForm(p => {
      const cur = Array.isArray(p[key]) ? p[key] as string[] : []
      return { ...p, [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] }
    })

  const isEditing = (s: string) => editSec === s

  // ── Completion pct ────────────────────────────────────────────
  const completionFields = ['storeName','niche','platforms','visualStyle','tone','usp']
  const completedCount   = completionFields.filter(f => !!data[f]).length
  const completionPct    = Math.round((completedCount / completionFields.length) * 100)

  // ── Niche label helper ────────────────────────────────────────
  const nicheLabel = (v: string) => NICHES.find(n => n.v === v)?.l ?? v
  const platLabel  = (v: string) => `${PLATFORMS.find(p => p.v === v)?.e ?? '📱'} ${v}`

  // ── Plan badge ────────────────────────────────────────────────
  const plan      = data.plan ?? 'starter'
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const isProPlus = ['pro','business'].includes(plan)

  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth:'820px', margin:'0 auto', fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:800, color:C.ink, letterSpacing:'-0.03em', marginBottom:'4px' }}>
          ⚙️ Pengaturan
        </h1>
        <p style={{ fontSize:'13px', color:C.inkMuted }}>
          Profil bisnis, AI Memory, brand identity, dan preferensi akun
        </p>
      </div>

      {/* ── Global alerts ──────────────────────────────────── */}
      {saved && (
        <div style={{ padding:'10px 14px', background:C.greenLt, border:`1px solid ${C.green}30`, borderRadius:'10px', marginBottom:'14px', display:'flex', gap:'7px', alignItems:'center', fontSize:'13px', fontWeight:600, color:C.green }}>
          <Check size={15}/> Perubahan berhasil disimpan! AI Memory kamu sudah diperbarui.
        </div>
      )}
      {error && (
        <div style={{ padding:'10px 14px', background:C.redLt, border:`1px solid ${C.red}30`, borderRadius:'10px', marginBottom:'14px', display:'flex', gap:'7px', alignItems:'center', fontSize:'13px', color:C.red }}>
          <AlertCircle size={15}/> {error}
        </div>
      )}

      {/* ── Promoting hints (shown after save) ─────────────── */}
      {hints.length > 0 && (
        <div style={{ marginBottom:'14px', display:'flex', flexDirection:'column', gap:'6px' }}>
          {hints.map((hint, i) => (
            <div key={i} style={{ padding:'10px 14px', background:C.amberXlt, border:`1px solid ${C.amber}30`, borderRadius:'10px', display:'flex', gap:'8px', alignItems:'flex-start', fontSize:'12px', color:C.amberDk, lineHeight:1.6 }}>
              <Sparkles size={14} color={C.amber} style={{ flexShrink:0, marginTop:'1px' }}/>
              <span>{hint}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── AI Memory status + Onboarding completion ────────── */}
      {!loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
          {/* Completion progress */}
          {completionPct < 100 && (
            <div style={{ padding:'14px 18px', background:C.amberXlt, border:`1.5px solid ${C.amber}30`, borderRadius:'14px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.amberDk }}>
                  🧠 AI Memory {completionPct}% lengkap
                </div>
                <span style={{ fontSize:'12px', fontWeight:700, color:C.amberDk }}>{completedCount}/{completionFields.length}</span>
              </div>
              <div style={{ height:'6px', borderRadius:'3px', background:`${C.amber}25`, overflow:'hidden', marginBottom:'8px' }}>
                <div style={{ height:'100%', width:`${completionPct}%`, background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, borderRadius:'3px', transition:'width .5s' }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'5px', marginBottom:'8px' }}>
                {[
                  { field:'storeName',   label:'Profil Bisnis', icon:'🏪', section:'identity' },
                  { field:'niche',       label:'Niche Produk',  icon:'🎯', section:'product'  },
                  { field:'platforms',   label:'Platform',      icon:'📱', section:'platform' },
                  { field:'visualStyle', label:'Visual Brand',  icon:'🎨', section:'visual'   },
                  { field:'tone',        label:'Tone Suara',    icon:'🗣️', section:'voice'    },
                  { field:'usp',         label:'USP Produk',    icon:'⭐', section:'product'  },
                ].map(item => {
                  const done = !!data[item.field]
                  return (
                    <button
                      key={item.field}
                      type="button"
                      onClick={() => !done && setEditSec(item.section)}
                      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 9px', borderRadius:'8px', border:`1px solid ${done ? C.green + '30' : C.border}`, background:done ? C.greenLt : C.bg, cursor:done?'default':'pointer', fontFamily:'inherit', transition:'all .12s', fontSize:'11px', fontWeight:600, color:done ? C.green : C.inkMuted }}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                      {done
                        ? <Check size={10} color={C.green} style={{ marginLeft:'auto' }}/>
                        : <span style={{ marginLeft:'auto', fontSize:'9px', color:C.amber }}>Isi →</span>
                      }
                    </button>
                  )
                })}
              </div>
              <div style={{ fontSize:'11px', color:C.amberDk, lineHeight:1.5 }}>
                💡 Makin lengkap AI Memory kamu, makin akurat caption, gambar, dan video yang dihasilkan untuk brand-mu.{' '}
                <button type="button" onClick={() => setEditSec('identity')} style={{ background:'none', border:'none', color:C.amber, fontWeight:700, cursor:'pointer', fontSize:'11px', fontFamily:'inherit', textDecoration:'underline' }}>
                  Lengkapi sekarang →
                </button>
              </div>
            </div>
          )}

          {/* AI Memory active summary */}
          {completionPct === 100 && (
            <div style={{ padding:'12px 16px', background:C.greenLt, border:`1px solid ${C.green}30`, borderRadius:'12px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'20px' }}>🧠</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.green, marginBottom:'2px' }}>AI Memory 100% — Siap untuk hasil terbaik!</div>
                <div style={{ fontSize:'11px', color:'#065F46', lineHeight:1.5 }}>
                  Semua preferensi tersimpan. AI akan generate konten yang konsisten dengan brand identity kamu di semua fitur.
                </div>
              </div>
              <Sparkles size={16} color={C.green}/>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          1. PROFIL BISNIS (onboarding step: profil)
      ═══════════════════════════════════════════════════════ */}
      <Section
        id="identity"
        title="Profil Bisnis"
        icon={<Store size={15} color={C.amberDk}/>}
        editButton={
          <EditControls
            sectionKey="identity"
            editingSection={editSec}
            setEditingSection={setEditSec}
            onSave={() => saveSection('identity')}
            saving={saving}
            onCancel={cancelEdit}
          />
        }
        promoBanner={
          !isProPlus && (
            <PromoBanner
              icon="💡"
              text="Lengkapi profil bisnis → AI mengenal brand kamu → caption & gambar 3× lebih relevan untuk niche kamu."
              cta="Upgrade ke Pro"
              href="/billing"
              color={C.amber}
            />
          )
        }
      >
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
            {Array.from({length:5}).map((_,i) => <Shimmer key={i} h="20px"/>)}
          </div>
        ) : isEditing('identity') ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {/* Avatar preview */}
            <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 14px', borderRadius:'11px', background:C.bg, border:`1px solid ${C.border}` }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                {data.avatarUrl ? <img src={data.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/> : '🐝'}
              </div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.ink }}>{data.name || data.email || 'Seller'}</div>
                <div style={{ fontSize:'12px', color:C.inkMuted }}>{data.email}</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={labelStyle}>Nama Toko *</label>
                <input
                  style={inputStyle}
                  value={form.storeName ?? ''}
                  onChange={e => set('storeName', e.target.value)}
                  placeholder="Contoh: Toko Kecantikan Sari"
                  onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                  onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
                />
              </div>
              <div>
                <label style={labelStyle}>Nama Owner</label>
                <input
                  style={inputStyle}
                  value={form.ownerName ?? ''}
                  onChange={e => set('ownerName', e.target.value)}
                  placeholder="Nama lengkap kamu"
                  onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                  onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nomor WhatsApp</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'13px', color:C.inkMuted }}>+62</span>
                <input
                  style={{ ...inputStyle, paddingLeft:'42px' }}
                  value={form.whatsapp ?? ''}
                  onChange={e => set('whatsapp', e.target.value.replace(/\D/g,''))}
                  placeholder="812 3456 7890"
                  inputMode="numeric"
                  onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                  onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Bio / Tagline Toko</label>
              <textarea
                style={{ ...inputStyle, resize:'vertical' }}
                rows={2}
                value={form.bio ?? ''}
                onChange={e => set('bio', e.target.value)}
                placeholder="Contoh: Skincare lokal berkualitas untuk kulit tropis Indonesia 🌿"
                onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
              />
            </div>

            <div>
              <label style={labelStyle}>Tipe Bisnis *</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {SELLER_TYPES.map(t => (
                  <Chip key={t.v} label={t.l} active={form.sellerType === t.v} onClick={() => set('sellerType', t.v)}/>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={labelStyle}>Skala Bisnis</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {[{v:'solo',l:'Solo'},{v:'small',l:'Kecil (2-5)'},{v:'medium',l:'Medium (6-20)'},{v:'large',l:'Besar (20+)'}].map(s => (
                    <Chip key={s.v} label={s.l} active={form.businessScale===s.v} onClick={()=>set('businessScale',s.v)} size="sm"/>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Pengalaman AI</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {[{v:'beginner',l:'Pemula'},{v:'intermediate',l:'Menengah'},{v:'advanced',l:'Mahir'}].map(s => (
                    <Chip key={s.v} label={s.l} active={form.experience===s.v} onClick={()=>set('experience',s.v)} size="sm" color={C.purple}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Avatar display */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px', paddingBottom:'12px', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                {data.avatarUrl ? <img src={data.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/> : '🐝'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:C.ink }}>{data.storeName || data.name || data.email || 'Belum diisi'}</div>
                <div style={{ fontSize:'12px', color:C.inkMuted }}>{data.email}</div>
                <div style={{ display:'flex', gap:'5px', marginTop:'4px' }}>
                  <TagPill label={planLabel} color={isProPlus ? C.purple : C.inkMuted}/>
                  {data.sellerType && <TagPill label={SELLER_TYPES.find(t=>t.v===data.sellerType)?.l??data.sellerType} color={C.amber}/>}
                </div>
              </div>
            </div>
            <FieldRow label="Nama Toko"    value={data.storeName}/>
            <FieldRow label="Nama Owner"   value={data.ownerName}/>
            <FieldRow label="WhatsApp"     value={data.whatsapp ? `+62 ${data.whatsapp}` : null}/>
            <FieldRow label="Bio"          value={data.bio}/>
            <FieldRow label="Skala Bisnis" value={data.businessScale}/>
            <FieldRow label="Pengalaman AI"value={data.experience}/>
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════
          2. AI MEMORY — PRODUK & NICHE (onboarding: profil step)
      ═══════════════════════════════════════════════════════ */}
      <Section
        id="product"
        title="AI Memory — Produk & Niche"
        icon={<Brain size={15} color={C.amberDk}/>}
        editButton={
          <EditControls
            sectionKey="product"
            editingSection={editSec}
            setEditingSection={setEditSec}
            onSave={() => saveSection('product')}
            saving={saving}
            onCancel={cancelEdit}
          />
        }
        promoBanner={
          <PromoBanner
            icon="🧠"
            text="AI Memory adalah 'otak' BeeSell AI untuk brand kamu. Makin lengkap, makin personal & akurat hasilnya — caption, gambar, video, semua sesuai niche."
            color={C.blue}
          />
        }
      >
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
            {Array.from({length:4}).map((_,i) => <Shimmer key={i} h="20px"/>)}
          </div>
        ) : isEditing('product') ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={labelStyle}>Kategori Niche *</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {NICHES.map(n => (
                  <Chip key={n.v} label={n.l} active={form.niche===n.v} onClick={()=>set('niche',n.v)}/>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={labelStyle}>Sub-niche / Spesialisasi</label>
                <input
                  style={inputStyle}
                  value={form.subNiche ?? ''}
                  onChange={e => set('subNiche', e.target.value)}
                  placeholder="Contoh: serum vitamin C, hijab sifon"
                  onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                  onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
                />
              </div>
              <div>
                <label style={labelStyle}>Range Harga Produk</label>
                <select
                  style={{ ...inputStyle, height:'40px' }}
                  value={form.priceRange ?? ''}
                  onChange={e => set('priceRange', e.target.value)}
                >
                  <option value="">Pilih range harga...</option>
                  {PRICE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>USP — Keunggulan Unik Produk</label>
              <textarea
                style={{ ...inputStyle, resize:'vertical' }}
                rows={2}
                value={form.usp ?? ''}
                onChange={e => set('usp', e.target.value)}
                placeholder="Apa yang buat brand kamu berbeda? Contoh: Bahan BPOM, Halal certified, pengiriman same-day"
                onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
              />
            </div>

            <div>
              <label style={labelStyle}>Target Audience</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {AUDIENCES.map(a => (
                  <Chip key={a.v} label={a.l} active={(form.targetAudience??[]).includes(a.v)} onClick={()=>tog('targetAudience',a.v)} color={C.purple}/>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Tujuan Bisnis Utama</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {GOALS.map(g => (
                  <Chip key={g.v} label={g.l} active={(form.mainGoals??[]).includes(g.v)} onClick={()=>tog('mainGoals',g.v)} color={C.green}/>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <FieldRow label="Kategori Niche" value={data.niche ? nicheLabel(data.niche) : null}/>
            <FieldRow label="Sub-niche"      value={data.subNiche}/>
            <FieldRow label="Range Harga"    value={data.priceRange}/>
            <FieldRow label="USP"            value={data.usp}/>
            <TagRow   label="Target Audience"items={(data.targetAudience??[]).map((a:string) => AUDIENCES.find(x=>x.v===a)?.l??a)} color={C.purple}/>
            <TagRow   label="Tujuan Bisnis"  items={(data.mainGoals??[]).map((g:string) => GOALS.find(x=>x.v===g)?.l??g)} color={C.green}/>
            {!data.niche && (
              <div style={{ marginTop:'10px', padding:'10px 12px', borderRadius:'9px', background:C.amberXlt, border:`1px solid ${C.amber}30`, fontSize:'12px', color:C.amberDk }}>
                💡 Pilih niche → AI langsung bisa generate konten yang tepat untuk jenis produkmu.
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════
          3. AI MEMORY — PLATFORM (onboarding: platform step)
      ═══════════════════════════════════════════════════════ */}
      <Section
        id="platform"
        title="AI Memory — Platform & Konten"
        icon={<Globe size={15} color={C.amberDk}/>}
        editButton={
          <EditControls
            sectionKey="platform"
            editingSection={editSec}
            setEditingSection={setEditSec}
            onSave={() => saveSection('platform')}
            saving={saving}
            onCancel={cancelEdit}
          />
        }
        promoBanner={
          <PromoBanner
            icon="📱"
            text="Platform yang kamu pilih menentukan format konten yang AI buat — caption Shopee ≠ caption TikTok. Makin spesifik, makin on-point hasilnya."
            color={C.blue}
          />
        }
      >
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
            {Array.from({length:3}).map((_,i) => <Shimmer key={i} h="24px"/>)}
          </div>
        ) : isEditing('platform') ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={labelStyle}>Platform Jualan (pilih semua yang aktif) *</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {PLATFORMS.map(p => (
                  <Chip key={p.v} label={`${p.e} ${p.l}`} active={(form.platforms??[]).includes(p.v)} onClick={()=>tog('platforms',p.v)}/>
                ))}
              </div>
            </div>

            {(form.platforms?.length > 0) && (
              <div>
                <label style={labelStyle}>Platform Utama (yang paling fokus)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {(form.platforms as string[]).map((pv: string) => {
                    const plat = PLATFORMS.find(x => x.v === pv)
                    return (
                      <Chip
                        key={pv}
                        label={`${plat?.e ?? '📱'} ${plat?.l ?? pv}${form.primaryPlatform===pv?' ⭐':''}`}
                        active={form.primaryPlatform===pv}
                        onClick={() => set('primaryPlatform', pv)}
                        color={C.green}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Frekuensi Posting</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {FREQ_OPTIONS.map(f => (
                  <Chip key={f.v} label={f.l} active={form.postingFrequency===f.v} onClick={()=>set('postingFrequency',f.v)} color={C.purple}/>
                ))}
              </div>
            </div>

            {/* Content types */}
            <div>
              <label style={labelStyle}>Format Konten yang Dibuat</label>
              <div style={{ padding:'9px 11px', borderRadius:'9px', background:C.amberXlt, border:`1px solid ${C.amber}30`, fontSize:'11px', color:C.amberDk, marginBottom:'8px' }}>
                💡 Pilih format konten yang rutin kamu buat — AI akan otomatis menyesuaikan output.
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {[
                  { v:'feed-photo',  l:'📸 Feed Photo' },
                  { v:'reels-video', l:'🎬 Reels / Video' },
                  { v:'story',       l:'⬜ Story' },
                  { v:'caption',     l:'✍️ Caption' },
                  { v:'tiktok',      l:'🎵 TikTok' },
                  { v:'marketplace', l:'🛍️ Marketplace' },
                  { v:'ads',         l:'📢 Ads' },
                  { v:'ugc',         l:'🎭 UGC' },
                ].map(ct => (
                  <Chip key={ct.v} label={ct.l} active={(form.contentTypes??[]).includes(ct.v)} onClick={()=>tog('contentTypes',ct.v)} color={C.blue}/>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <TagRow label="Platform Aktif"   items={(data.platforms??[]).map((p:string)=>platLabel(p))} color={C.amber}/>
            <FieldRow label="Platform Utama" value={data.primaryPlatform ? platLabel(data.primaryPlatform) : null}/>
            <FieldRow label="Frekuensi"      value={FREQ_OPTIONS.find(f=>f.v===data.postingFrequency)?.l ?? data.postingFrequency}/>
            <TagRow   label="Format Konten"  items={data.contentTypes ?? []} color={C.blue}/>
            {!data.platforms?.length && (
              <div style={{ marginTop:'10px', padding:'10px 12px', borderRadius:'9px', background:C.amberXlt, border:`1px solid ${C.amber}30`, fontSize:'12px', color:C.amberDk }}>
                📱 Pilih platform → caption akan otomatis disesuaikan dengan gaya tiap platform.
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════
          4. AI MEMORY — VISUAL (onboarding: brandKit)
      ═══════════════════════════════════════════════════════ */}
      <Section
        id="visual"
        title="AI Memory — Brand Visual"
        icon={<Palette size={15} color={C.amberDk}/>}
        editButton={
          <EditControls
            sectionKey="visual"
            editingSection={editSec}
            setEditingSection={setEditSec}
            onSave={() => saveSection('visual')}
            saving={saving}
            onCancel={cancelEdit}
          />
        }
        promoBanner={
          isProPlus && (
            <PromoBanner
              icon="🎨"
              text="Visual style tersimpan → AI Enhancer & Packshot langsung generate foto dengan gaya yang konsisten. Tidak perlu atur ulang setiap generate."
              color={C.purple}
            />
          )
        }
      >
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
            {Array.from({length:3}).map((_,i) => <Shimmer key={i} h="20px"/>)}
          </div>
        ) : isEditing('visual') ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={labelStyle}>Gaya Visual Brand *</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'7px' }}>
                {VISUAL_STYLES.map(vs => (
                  <button
                    key={vs.v}
                    type="button"
                    onClick={() => set('visualStyle', vs.v)}
                    style={{
                      padding:'10px 8px', borderRadius:'10px',
                      border:`1.5px solid ${form.visualStyle===vs.v ? C.amber : C.border}`,
                      background:form.visualStyle===vs.v ? C.amberXlt : C.white,
                      cursor:'pointer', fontFamily:'inherit',
                      fontSize:'11px', fontWeight:form.visualStyle===vs.v ? 700 : 500,
                      color:form.visualStyle===vs.v ? C.amberDk : C.inkMuted,
                      transition:'all .12s',
                    }}
                  >
                    {vs.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Palet Warna</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {COLOR_TONES.map(ct => (
                  <Chip key={ct.v} label={ct.l} active={form.colorTone===ct.v} onClick={()=>set('colorTone',ct.v)} color={C.purple}/>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={labelStyle}>Warna Brand (hex)</label>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <input
                    type="color"
                    value={form.primaryColor ?? '#F59E0B'}
                    onChange={e => set('primaryColor', e.target.value)}
                    style={{ width:'40px', height:'40px', borderRadius:'8px', border:`1px solid ${C.border}`, cursor:'pointer', padding:'2px' }}
                  />
                  <input
                    style={{ ...inputStyle, flex:1 }}
                    value={form.primaryColor ?? ''}
                    onChange={e => set('primaryColor', e.target.value)}
                    placeholder="#F59E0B"
                    onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                    onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Tagline Brand</label>
                <input
                  style={inputStyle}
                  value={form.brandTagline ?? ''}
                  onChange={e => set('brandTagline', e.target.value)}
                  placeholder="Contoh: Cantik Alami, Terjangkau"
                  onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                  onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <FieldRow label="Gaya Visual"  value={VISUAL_STYLES.find(v=>v.v===data.visualStyle)?.l ?? data.visualStyle}/>
            <FieldRow label="Palet Warna"  value={COLOR_TONES.find(c=>c.v===data.colorTone)?.l ?? data.colorTone}/>
            <FieldRow label="Warna Brand"  value={data.primaryColor ? (
              // inline color preview
              `${data.primaryColor}`
            ) : null}/>
            <FieldRow label="Tagline"      value={data.brandTagline}/>
            {!data.visualStyle && (
              <div style={{ marginTop:'10px', padding:'10px 12px', borderRadius:'9px', background:`${C.purple}08`, border:`1px solid ${C.purple}25`, fontSize:'12px', color:C.purple }}>
                🎨 Pilih gaya visual → Setiap foto AI yang dibuat akan konsisten dengan brand identity kamu.
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════
          5. AI MEMORY — SUARA BRAND (onboarding: brandKit)
      ═══════════════════════════════════════════════════════ */}
      <Section
        id="voice"
        title="AI Memory — Suara Brand"
        icon={<Mic size={15} color={C.amberDk}/>}
        editButton={
          <EditControls
            sectionKey="voice"
            editingSection={editSec}
            setEditingSection={setEditSec}
            onSave={() => saveSection('voice')}
            saving={saving}
            onCancel={cancelEdit}
          />
        }
        promoBanner={
          <PromoBanner
            icon="🗣️"
            text="Tone & bahasa yang kamu pilih akan dipakai di semua caption, hook, CTA, dan script video — konsisten di semua platform tanpa perlu atur ulang."
            color={C.green}
          />
        }
      >
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
            {Array.from({length:4}).map((_,i) => <Shimmer key={i} h="20px"/>)}
          </div>
        ) : isEditing('voice') ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={labelStyle}>Tone Komunikasi *</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {TONES.map(t => (
                  <Chip key={t.v} label={t.l} active={form.tone===t.v} onClick={()=>set('tone',t.v)}/>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Bahasa & Gaya</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {LANGUAGES.map(l => (
                  <Chip key={l.v} label={l.l} active={form.language===l.v} onClick={()=>set('language',l.v)} color={C.blue}/>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={labelStyle}>Gaya Emoji</label>
                <div style={{ display:'flex', gap:'5px' }}>
                  {[{v:'many',l:'Banyak 🎉🌟✨'},{v:'some',l:'Sedikit 😊'},{v:'none',l:'Tanpa Emoji'}].map(e => (
                    <Chip key={e.v} label={e.l} active={form.emoji===e.v} onClick={()=>set('emoji',e.v)} size="sm" color={C.purple}/>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Gaya CTA</label>
                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                  {[{v:'soft',l:'Soft'},{v:'medium',l:'Medium'},{v:'hard',l:'Agresif'}].map(c => (
                    <Chip key={c.v} label={c.l} active={form.ctaStyle===c.v} onClick={()=>set('ctaStyle',c.v)} size="sm" color={C.red}/>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Kata Kunci Brand (pisahkan dengan koma)</label>
              <input
                style={inputStyle}
                value={(form.brandKeywords??[]).join(', ')}
                onChange={e => set('brandKeywords', e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean))}
                placeholder="Contoh: natural, halal, premium, glowing, terpercaya"
                onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
              />
            </div>

            <div>
              <label style={labelStyle}>Kata yang Dihindari</label>
              <input
                style={inputStyle}
                value={(form.avoidWords??[]).join(', ')}
                onChange={e => set('avoidWords', e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean))}
                placeholder="Contoh: murah banget, diskon gede, murahan"
                onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
              />
            </div>

            <div>
              <label style={labelStyle}>Kompetitor (untuk AI menghindari positioning serupa)</label>
              <input
                style={inputStyle}
                value={(form.competitors??[]).join(', ')}
                onChange={e => set('competitors', e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean))}
                placeholder="Contoh: Brand X, Toko Y"
                onFocus={e => (e.target as HTMLElement).style.borderColor = C.amber}
                onBlur={e  => (e.target as HTMLElement).style.borderColor = C.border}
              />
            </div>
          </div>
        ) : (
          <div>
            <FieldRow label="Tone"          value={TONES.find(t=>t.v===data.tone)?.l ?? data.tone}/>
            <FieldRow label="Bahasa"        value={LANGUAGES.find(l=>l.v===data.language)?.l ?? data.language}/>
            <FieldRow label="Gaya Emoji"    value={data.emoji}/>
            <FieldRow label="Gaya CTA"      value={data.ctaStyle}/>
            <TagRow   label="Kata Kunci"    items={data.brandKeywords ?? []} color={C.amber}/>
            <TagRow   label="Kata Dihindari"items={data.avoidWords    ?? []} color={C.red}/>
            {!data.tone && (
              <div style={{ marginTop:'10px', padding:'10px 12px', borderRadius:'9px', background:C.greenLt, border:`1px solid ${C.green}30`, fontSize:'12px', color:C.green }}>
                🗣️ Pilih tone → Semua caption akan otomatis ditulis dengan gaya yang sesuai karakter brand kamu.
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════
          6. NOTIFIKASI
      ═══════════════════════════════════════════════════════ */}
      <Section
        id="notif"
        title="Notifikasi"
        icon={<Bell size={15} color={C.amberDk}/>}
        editButton={
          <EditControls
            sectionKey="notif"
            editingSection={editSec}
            setEditingSection={setEditSec}
            onSave={() => saveSection('notif')}
            saving={saving}
            onCancel={cancelEdit}
          />
        }
      >
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
            {Array.from({length:3}).map((_,i) => <Shimmer key={i} h="18px"/>)}
          </div>
        ) : isEditing('notif') ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              { key:'notifEmail',    label:'Email notifikasi', desc:'Perpanjangan plan, storage, kuota' },
              { key:'notifWhatsapp', label:'WhatsApp notifikasi', desc:'Peringatan penting via WA' },
              { key:'notifQuota',    label:'Peringatan kuota habis', desc:'Saat kuota tinggal 20%' },
              { key:'notifPlan',     label:'Pengingat perpanjangan plan', desc:'14 hari & 3 hari sebelum expired' },
            ].map(item => (
              <label key={item.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 13px', borderRadius:'10px', border:`1px solid ${C.border}`, cursor:'pointer', background:C.bg }}>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:C.ink }}>{item.label}</div>
                  <div style={{ fontSize:'11px', color:C.inkMuted, marginTop:'2px' }}>{item.desc}</div>
                </div>
                <div
                  onClick={() => set(item.key, !form[item.key])}
                  style={{
                    width:'44px', height:'24px', borderRadius:'99px', flexShrink:0,
                    background:form[item.key] ? C.amber : C.border,
                    position:'relative', cursor:'pointer', transition:'background .2s',
                  }}
                >
                  <div style={{
                    position:'absolute', top:'2px',
                    left: form[item.key] ? '22px' : '2px',
                    width:'20px', height:'20px', borderRadius:'50%',
                    background:C.white, boxShadow:C.sh,
                    transition:'left .2s',
                  }}/>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {[
              { key:'notifEmail',    label:'Email notifikasi' },
              { key:'notifWhatsapp', label:'WhatsApp notifikasi' },
              { key:'notifQuota',    label:'Peringatan kuota' },
              { key:'notifPlan',     label:'Pengingat perpanjangan' },
            ].map(item => (
              <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:'13px', color:C.inkSub }}>{item.label}</span>
                <span style={{ fontSize:'12px', fontWeight:700, color:data[item.key] !== false ? C.green : C.inkDim }}>
                  {data[item.key] !== false ? '✓ Aktif' : '✗ Nonaktif'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════
          7. PLAN & UPGRADE
      ═══════════════════════════════════════════════════════ */}
      <Section
        id="plan"
        title="Plan & Billing"
        icon={<CreditCard size={15} color={C.amberDk}/>}
        editButton={
          <Link href="/billing" style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.inkMuted, textDecoration:'none', transition:'all .12s' }}>
            Kelola Plan <ChevronRight size={11}/>
          </Link>
        }
      >
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
            {Array.from({length:3}).map((_,i) => <Shimmer key={i} h="20px"/>)}
          </div>
        ) : (
          <div>
            {/* Current plan */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 15px', borderRadius:'12px', border:`1.5px solid ${isProPlus ? C.purple : C.border}`, background:isProPlus ? C.purpleLt : C.bg, marginBottom:'14px' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:isProPlus ? C.purple : C.ink }}>
                  Plan {planLabel} {isProPlus ? '✨' : ''}
                </div>
                <div style={{ fontSize:'12px', color:C.inkMuted, marginTop:'2px' }}>
                  {data.memberSince ? `Bergabung ${new Date(data.memberSince).toLocaleDateString('id-ID',{month:'long',year:'numeric'})}` : 'Akun aktif'}
                </div>
              </div>
              {!isProPlus && (
                <Link href="/billing" style={{ padding:'7px 14px', borderRadius:'9px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', textDecoration:'none', fontSize:'12px', fontWeight:700, boxShadow:C.sa, whiteSpace:'nowrap' }}>
                  Upgrade Sekarang →
                </Link>
              )}
            </div>

            {/* Upgrade benefits if not pro */}
            {!isProPlus && (
              <div style={{ padding:'13px 15px', borderRadius:'12px', background:C.amberXlt, border:`1px solid ${C.amber}30` }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:C.amberDk, marginBottom:'9px' }}>🚀 Dengan Pro (Rp399K/bln):</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px' }}>
                  {[
                    '400 generate gambar/bln',
                    '5 video AI/bln',
                    '20 AI Try-On/bln',
                    'Model Swap + Face Swap',
                    'UGC Video Generator',
                    'Semua Marketing Kit',
                    'Asset Library 20GB',
                    'Priority processing',
                  ].map((f, i) => (
                    <div key={i} style={{ display:'flex', gap:'5px', fontSize:'12px', color:C.inkSub }}>
                      <Check size={13} color={C.amber} style={{ flexShrink:0, marginTop:'1px' }}/> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Re-run onboarding — pre-filled with existing settings */}
            <div style={{ marginTop:'14px', padding:'13px 15px', borderRadius:'11px', border:`1px solid ${C.border}`, background:C.bg }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'10px', flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.ink, marginBottom:'2px' }}>🔄 Ulang Onboarding</div>
                  <div style={{ fontSize:'11px', color:C.inkMuted, lineHeight:1.5 }}>
                    Perbarui semua preferensi lewat flow onboarding. Data yang sudah ada akan otomatis terisi — kamu hanya perlu update yang berubah.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    // Pre-fetch existing data in onboarding format, then navigate
                    try {
                      const res = await fetch('/api/settings/onboarding-sync')
                      const { data: obData } = await res.json()
                      if (obData) {
                        // Store in sessionStorage so onboarding page can pre-fill
                        sessionStorage.setItem('onboarding-prefill', JSON.stringify(obData))
                      }
                    } catch { /* navigate anyway */ }
                    window.location.href = '/onboarding?reset=true&prefill=true'
                  }}
                  style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 13px', borderRadius:'9px', border:`1px solid ${C.amber}30`, background:C.amberXlt, fontSize:'12px', fontWeight:700, color:C.amberDk, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0 }}
                >
                  <RefreshCw size={12}/> Ulang Onboarding
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════
          8. KEAMANAN AKUN
      ═══════════════════════════════════════════════════════ */}
      <Section
        id="security"
        title="Keamanan Akun"
        icon={<Shield size={15} color={C.amberDk}/>}
        editButton={<div/>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 13px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.bg }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:600, color:C.ink }}>Password</div>
              <div style={{ fontSize:'11px', color:C.inkMuted }}>Ganti password akun kamu</div>
            </div>
            <Link href="/settings/change-password" style={{ fontSize:'12px', fontWeight:600, color:C.blue, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}>
              Ganti <ChevronRight size={11}/>
            </Link>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 13px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.bg }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:600, color:C.ink }}>Sesi Aktif</div>
              <div style={{ fontSize:'11px', color:C.inkMuted }}>Lihat & kelola sesi login</div>
            </div>
            <Link href="/settings/sessions" style={{ fontSize:'12px', fontWeight:600, color:C.blue, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}>
              Kelola <ChevronRight size={11}/>
            </Link>
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/signout', { method:'POST' })
              window.location.href = '/login'
            }}
            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 13px', borderRadius:'10px', border:`1px solid ${C.red}25`, background:C.redLt, color:C.red, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', width:'100%' }}
          >
            <LogOut size={14}/> Keluar dari Akun
          </button>
        </div>
      </Section>

      {/* Bottom spacer */}
      <div style={{ height:'32px' }}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        input::placeholder, textarea::placeholder { color:#9CA3AF }
        select { appearance:auto }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
      `}</style>
    </div>
  )
}