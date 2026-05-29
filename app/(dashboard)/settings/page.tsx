'use client'
// apps/web-app/app/(dashboard)/settings/page.tsx
// Full settings: profil user, data onboarding, usage limit, navigasi sub-settings

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User, Store, Palette, Plug, CreditCard, ChevronRight,
  Edit3, Save, X, Check, AlertCircle, Loader2,
  Package, Target, Globe, Zap, BarChart3, RefreshCw,
  Eye, TrendingUp, Calendar, Clock,
} from 'lucide-react'

const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE', brand700:'#1D4ED8',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  slate900:'#0F172A', slate800:'#1E293B', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#fff',
}

const PLAN_LIMITS: Record<string,{
  label:string; color:string;
  daily:{ caption:number; image:number; video:number };
  monthly:{ caption:number; image:number; video:number };
  features: string[];
}> = {
  free:    { label:'Gratis',   color:C.slate500, daily:{caption:3,image:1,video:0},     monthly:{caption:50,image:10,video:0},      features:['Caption Generator','Foto Produk dasar','Asset Library','Quick Tools 3 engine'] },
  starter: { label:'Starter',  color:C.slate500, daily:{caption:3,image:1,video:0},     monthly:{caption:50,image:10,video:0},      features:['Semua fitur Free'] },
  basic:   { label:'Basic',    color:C.green,    daily:{caption:15,image:5,video:0},    monthly:{caption:250,image:50,video:0},     features:['Caption Generator','Semua Studio P1','Scheduler 1 platform','Brand Kit','Library unlimited'] },
  pro:     { label:'Pro',      color:C.purple,   daily:{caption:50,image:20,video:2},   monthly:{caption:1000,image:200,video:20},  features:['Semua Basic','Video AI','Auto-post semua platform','Analytics','Bee Assistant','Bulk 50 produk'] },
  business:{ label:'Business', color:C.amber,    daily:{caption:200,image:100,video:10},monthly:{caption:5000,image:1000,video:100},features:['Semua Pro','Unlimited caption','Team 5 seat','API access','Dedicated manager'] },
}

const SELLER_LABEL: Record<string,string> = {
  seller:'Marketplace Seller',affiliator:'Affiliator',dropshipper:'Dropshipper',
  brand:'Brand Owner',agency:'Agency',reseller:'Reseller',creator:'Content Creator',umkm:'UMKM',
}
const NICHE_EMOJI: Record<string,string> = {
  fashion:'👗',skincare:'✨',food:'🍜',beverage:'🥤',electronics:'📱',furniture:'🛋️',
  jewelry:'💍',bag:'👜',shoes:'👟',watch:'⌚',health:'💊',digital:'💻',other:'📦',
}
const PLATFORM_EMOJI: Record<string,string> = {
  instagram:'📸','tiktok-shop':'🎵',tiktok:'🎵',shopee:'🛍️',tokopedia:'🛒',
  whatsapp:'💬',facebook:'👥',lazada:'📦',youtube:'▶️',twitter:'𝕏',
}

interface SettingsData {
  // User
  name: string; email: string; avatarUrl: string|null
  // Tenant
  storeName: string; whatsapp: string; plan: string; planLabel: string; memberSince: string|null
  // AI Memory — from onboarding
  niche: string|null; subNiche: string|null; sellerType: string|null; businessScale: string|null; experience: string|null
  productType: string|null; productCount: string|null; priceRange: string|null
  targetAudience: string[]; mainGoals: string[]
  primaryPlatform: string|null; platforms: string[]
  contentTypes: string[]; postingFrequency: string|null
  visualStyle: string|null; colorTone: string|null; moodTone: string|null; primaryColor: string
  brandTagline: string|null
  tone: string|null; language: string|null; emoji: string|null; ctaStyle: string|null
  brandKeywords: string|null; avoidWords: string|null; usp: string|null
  // Usage
  dailyUsed: number; dailyMax: number
  monthlyUsed: number; monthlyMax: number
  imageToday: number; imageMonth: number
  videoToday: number; videoMonth: number
}

function Shimmer({ w='100%', h='14px', r='5px' }: { w?:string; h?:string; r?:string }) {
  return <div style={{ width:w, height:h, borderRadius:r, background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite' }}/>
}

function Section({ title, icon, children, action }: { title:string; icon:React.ReactNode; children:React.ReactNode; action?:React.ReactNode }) {
  return (
    <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, overflow:'hidden', marginBottom:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:`1px solid ${C.slate100}`, background:C.slate50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'13px', fontWeight:700, color:C.slate900 }}>
          <span style={{ color:C.slate500 }}>{icon}</span>{title}
        </div>
        {action}
      </div>
      <div style={{ padding:'16px 18px' }}>{children}</div>
    </div>
  )
}

function Field({ label, value, subvalue }: { label:string; value:string|null|undefined; subvalue?:string }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:'8px', alignItems:'start', padding:'8px 0', borderBottom:`1px solid ${C.slate100}` }}>
      <span style={{ fontSize:'12px', color:C.slate500 }}>{label}</span>
      <div>
        <span style={{ fontSize:'13px', color:value?C.slate900:C.slate400, fontWeight:value?500:400 }}>{value||'—'}</span>
        {subvalue && <div style={{ fontSize:'11px', color:C.slate400, marginTop:'1px' }}>{subvalue}</div>}
      </div>
    </div>
  )
}

function UsageBar({ label, used, max, color }: { label:string; used:number; max:number; color:string }) {
  const pct = max > 0 ? Math.min(Math.round(used/max*100), 100) : 0
  return (
    <div style={{ marginBottom:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
        <span style={{ fontSize:'12px', color:C.slate700, fontWeight:500 }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'12px', fontWeight:800, color: pct>=100?C.red:C.slate900 }}>{used}</span>
          <span style={{ fontSize:'11px', color:C.slate400 }}>/ {max}</span>
          <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'4px', background: pct>=100?C.red50:pct>=80?C.amb50:C.slate50, color: pct>=100?C.red:pct>=80?C.amber:C.slate500 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height:'5px', borderRadius:'3px', background:C.slate100, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:'3px', background: pct>=100?C.red:pct>=80?C.amber:color, transition:'width .5s' }}/>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [data,    setData]    = useState<SettingsData|null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  const [form,    setForm]    = useState<Partial<SettingsData>>({})

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(({ data:d }) => {
      if (!d) return
      const s = d.store?.settings ?? {}
      const profile: SettingsData = {
        name:         d.user?.name ?? '',
        email:        d.user?.email ?? '',
        avatarUrl:    d.user?.avatarUrl ?? null,
        storeName:    d.store?.name ?? '',
        whatsapp:     s.whatsapp ?? '',
        plan:         d.store?.plan ?? 'free',
        planLabel:    d.store?.planLabel ?? 'Gratis',
        memberSince:  d.store?.memberSince ?? null,
        niche:        s.niche ?? d.store?.niche ?? null,
        subNiche:     s.subNiche ?? null,
        sellerType:   s.sellerType ?? d.store?.sellerType ?? null,
        businessScale:s.businessScale ?? null,
        experience:   s.experience ?? null,
        productType:  s.productType ?? null,
        productCount: s.productCount ?? null,
        priceRange:   s.priceRange ?? null,
        targetAudience:s.targetAudience ?? [],
        mainGoals:    s.mainGoals ?? d.store?.mainGoals ?? [],
        primaryPlatform:s.primaryPlatform ?? d.store?.primaryPlatform ?? null,
        platforms:    s.platforms ?? d.store?.platforms ?? [],
        contentTypes: s.contentTypes ?? [],
        postingFrequency:s.postingFrequency ?? null,
        visualStyle:  s.visualStyle ?? null,
        colorTone:    s.colorTone ?? null,
        moodTone:     s.moodTone ?? null,
        primaryColor: s.primaryColor ?? '#2563EB',
        brandTagline: s.brandTagline ?? null,
        tone:         s.defaultTone ?? d.store?.tone ?? null,
        language:     s.defaultLanguage ?? d.store?.language ?? null,
        emoji:        s.defaultEmoji ?? null,
        ctaStyle:     s.defaultCtaStyle ?? null,
        brandKeywords:s.brandKeywords ?? null,
        avoidWords:   s.avoidWords ?? null,
        usp:          s.usp ?? null,
        dailyUsed:    d.dailyUsed ?? 0,
        dailyMax:     d.dailyMax ?? 3,
        monthlyUsed:  d.monthlyUsed ?? 0,
        monthlyMax:   d.monthlyMax ?? 50,
        imageToday:   0, imageMonth: 0,
        videoToday:   0, videoMonth: 0,
      }
      setData(profile)
      setForm(profile)
    }).catch(() => setError('Gagal memuat profil')).finally(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/settings/profile', {
        method:'PATCH', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ name:form.name, storeName:form.storeName, whatsapp:form.whatsapp }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      setData(prev => ({ ...prev!, ...form } as SettingsData))
      setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e:any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const plan      = data?.plan ?? 'free'
  const planLimits= PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const isFree    = plan === 'free' || plan === 'starter'

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${C.slate200}`, fontSize:'13px', fontFamily:"'DM Sans',sans-serif", color:C.slate900, outline:'none', boxSizing:'border-box', background:C.white }

  return (
    <div style={{ maxWidth:'780px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(20px,3.5vw,26px)', fontWeight:600, color:C.slate900, letterSpacing:'-0.02em', marginBottom:'2px' }}>Pengaturan</h1>
          <p style={{ fontSize:'12px', color:C.slate500 }}>Profil, AI memory, dan penggunaan akun</p>
        </div>
        {!loading && !editing && (
          <button onClick={() => setEditing(true)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.slate700, cursor:'pointer' }}>
            <Edit3 size={13}/> Edit Profil
          </button>
        )}
        {editing && (
          <div style={{ display:'flex', gap:'7px' }}>
            <button onClick={() => { setEditing(false); setForm(data||{}) }} style={{ padding:'7px 14px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.slate600, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
              <X size={13}/> Batal
            </button>
            <button onClick={saveProfile} disabled={saving} style={{ padding:'7px 14px', borderRadius:'9px', border:'none', background:C.brand, fontSize:'12px', fontWeight:700, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
              {saving ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={13}/>} Simpan
            </button>
          </div>
        )}
      </div>

      {saved && <div style={{ padding:'9px 14px', background:C.grn50, border:`1px solid #BBF7D0`, borderRadius:'10px', marginBottom:'12px', fontSize:'12px', color:C.green, fontWeight:600, display:'flex', gap:'6px', alignItems:'center' }}><Check size={13}/> Profil berhasil disimpan!</div>}
      {error && <div style={{ padding:'9px 14px', background:C.red50, border:`1px solid #FECACA`, borderRadius:'10px', marginBottom:'12px', fontSize:'12px', color:C.red, display:'flex', gap:'6px', alignItems:'center' }}><AlertCircle size={13}/>{error}</div>}

      {/* ── USAGE LIMIT SECTION ─────────────────────────────── */}
      <Section title="Penggunaan & Limit" icon={<BarChart3 size={15}/>} action={
        <Link href="/billing" style={{ fontSize:'11px', color:C.brand, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}>
          Upgrade <ChevronRight size={11}/>
        </Link>
      }>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>{[1,2,3].map(i=><Shimmer key={i} h="32px"/>)}</div>
        ) : (
          <>
            {/* Plan badge */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background: isFree?C.slate50:C.pur50, borderRadius:'10px', border:`1px solid ${isFree?C.slate200:'#DDD6FE'}`, marginBottom:'16px' }}>
              <div>
                <div style={{ fontSize:'12px', fontWeight:700, color:planLimits.color }}>Plan {planLimits.label}</div>
                <div style={{ fontSize:'11px', color:C.slate500, marginTop:'2px' }}>
                  {data?.memberSince ? `Bergabung ${new Date(data.memberSince).toLocaleDateString('id-ID',{month:'long',year:'numeric'})}` : ''}
                </div>
              </div>
              {isFree && (
                <Link href="/billing" style={{ padding:'6px 14px', borderRadius:'8px', background:'linear-gradient(135deg, #7C3AED, #2563EB)', color:'#fff', textDecoration:'none', fontSize:'11px', fontWeight:700 }}>
                  Upgrade →
                </Link>
              )}
            </div>

            {/* Usage bars */}
            <div style={{ marginBottom:'8px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Hari Ini</div>
              <UsageBar label="Caption AI" used={data?.dailyUsed??0} max={planLimits.daily.caption} color={C.brand}/>
              <UsageBar label="Gambar AI" used={data?.imageToday??0} max={planLimits.daily.image} color={C.purple}/>
              <UsageBar label="Video AI"  used={data?.videoToday??0} max={planLimits.daily.video} color={C.amber}/>
            </div>
            <div>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Bulan Ini</div>
              <UsageBar label="Caption AI" used={data?.monthlyUsed??0} max={planLimits.monthly.caption} color={C.brand}/>
              <UsageBar label="Gambar AI" used={data?.imageMonth??0} max={planLimits.monthly.image} color={C.purple}/>
              <UsageBar label="Video AI"  used={data?.videoMonth??0} max={planLimits.monthly.video} color={C.amber}/>
            </div>

            {/* Plan features */}
            <div style={{ marginTop:'12px', padding:'10px 13px', background:C.slate50, borderRadius:'9px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.slate500, marginBottom:'6px' }}>Fitur plan {planLimits.label}:</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {planLimits.features.map((f,i) => (
                  <span key={i} style={{ fontSize:'10px', color:C.slate600, background:C.white, border:`1px solid ${C.slate200}`, padding:'2px 8px', borderRadius:'4px' }}>✓ {f}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      {/* ── USER PROFILE ──────────────────────────────────────── */}
      <Section title="Akun & Profil" icon={<User size={15}/>}>
        {loading ? <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>{[1,2,3].map(i=><Shimmer key={i}/>)}</div> : (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px', paddingBottom:'14px', borderBottom:`1px solid ${C.slate100}` }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg, #2563EB, #7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0, overflow:'hidden' }}>
                {data?.avatarUrl ? <img src={data.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : '👤'}
              </div>
              <div>
                <div style={{ fontSize:'15px', fontWeight:700, color:C.slate900 }}>{data?.name || data?.email}</div>
                <div style={{ fontSize:'12px', color:C.slate500 }}>{data?.email}</div>
                <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background: isFree?C.slate100:C.pur50, color: isFree?C.slate500:C.purple, marginTop:'4px', display:'inline-block' }}>
                  {planLimits.label}
                </span>
              </div>
            </div>
            {editing ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.slate600, display:'block', marginBottom:'4px' }}>Nama Lengkap</label>
                  <input style={inp} value={form.name??''} onChange={e => setForm(p=>({...p, name:e.target.value}))}/>
                </div>
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.slate600, display:'block', marginBottom:'4px' }}>Nama Toko</label>
                  <input style={inp} value={form.storeName??''} onChange={e => setForm(p=>({...p, storeName:e.target.value}))}/>
                </div>
                <div>
                  <label style={{ fontSize:'11px', fontWeight:700, color:C.slate600, display:'block', marginBottom:'4px' }}>WhatsApp</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:C.slate400 }}>+62</span>
                    <input style={{ ...inp, paddingLeft:'40px' }} value={form.whatsapp??''} onChange={e => setForm(p=>({...p, whatsapp:e.target.value}))} inputMode="numeric"/>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Field label="Nama" value={data?.name}/>
                <Field label="Email" value={data?.email}/>
                <Field label="Nama Toko" value={data?.storeName}/>
                <Field label="WhatsApp" value={data?.whatsapp ? `+62 ${data.whatsapp}` : null}/>
              </>
            )}
          </>
        )}
      </Section>

      {/* ── AI MEMORY — PROFIL BISNIS ─────────────────────────── */}
      <Section title="AI Memory — Profil Bisnis" icon={<Package size={15}/>} action={
        <Link href="/onboarding" style={{ fontSize:'11px', color:C.brand, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}>
          Update <ChevronRight size={11}/>
        </Link>
      }>
        {loading ? <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>{[1,2,3,4].map(i=><Shimmer key={i}/>)}</div> : (
          <>
            <div style={{ padding:'8px 12px', background:C.brand50, borderRadius:'9px', border:`1px solid ${C.brand100}`, marginBottom:'12px', fontSize:'11px', color:C.slate600 }}>
              💡 Data ini dipakai AI untuk personalisasi semua output — caption, gambar, strategi, dan rekomendasi.
            </div>
            <Field label="Tipe Seller" value={SELLER_LABEL[data?.sellerType??''] || data?.sellerType}/>
            <Field label="Kategori" value={data?.niche ? `${NICHE_EMOJI[data.niche]||'📦'} ${data.niche}${data.subNiche?` › ${data.subNiche}`:''}` : null}/>
            <Field label="Jenis Produk" value={data?.productType}/>
            <Field label="Jumlah SKU" value={data?.productCount}/>
            <Field label="Range Harga" value={data?.priceRange}/>
            <Field label="Skala Bisnis" value={data?.businessScale}/>
            <Field label="Level AI" value={data?.experience}/>
            {(data?.targetAudience?.length ?? 0) > 0 && (
              <div style={{ padding:'8px 0', borderBottom:`1px solid ${C.slate100}` }}>
                <span style={{ fontSize:'12px', color:C.slate500, display:'block', marginBottom:'6px' }}>Target Audience</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {data!.targetAudience.map(a => <span key={a} style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:600, background:C.pur50, color:C.purple }}>{a.replace(/-/g,' ')}</span>)}
                </div>
              </div>
            )}
            {(data?.mainGoals?.length ?? 0) > 0 && (
              <div style={{ padding:'8px 0', borderBottom:`1px solid ${C.slate100}` }}>
                <span style={{ fontSize:'12px', color:C.slate500, display:'block', marginBottom:'6px' }}>Tujuan Bisnis</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {data!.mainGoals.map(g => <span key={g} style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:600, background:C.amb50, color:C.amber }}>{g.replace(/-/g,' ')}</span>)}
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      {/* ── AI MEMORY — PLATFORM ─────────────────────────────── */}
      <Section title="AI Memory — Platform & Konten" icon={<Globe size={15}/>}>
        {loading ? <Shimmer h="80px"/> : (
          <>
            <Field label="Platform Utama" value={data?.primaryPlatform ? `${PLATFORM_EMOJI[data.primaryPlatform]||'📱'} ${data.primaryPlatform}` : null}/>
            <Field label="Frekuensi" value={data?.postingFrequency?.replace('/',' per ')}/>
            {(data?.platforms?.length ?? 0) > 0 && (
              <div style={{ padding:'8px 0', borderBottom:`1px solid ${C.slate100}` }}>
                <span style={{ fontSize:'12px', color:C.slate500, display:'block', marginBottom:'5px' }}>Platform Aktif</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {data!.platforms.map(p => <span key={p} style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:600, background:C.brand50, color:C.brand }}>{PLATFORM_EMOJI[p]||'📱'} {p}</span>)}
                </div>
              </div>
            )}
            {(data?.contentTypes?.length ?? 0) > 0 && (
              <div style={{ padding:'8px 0' }}>
                <span style={{ fontSize:'12px', color:C.slate500, display:'block', marginBottom:'5px' }}>Jenis Konten</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {data!.contentTypes.map(c => <span key={c} style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:600, background:C.slate100, color:C.slate600 }}>{c}</span>)}
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      {/* ── AI MEMORY — VISUAL & VOICE ──────────────────────── */}
      <Section title="AI Memory — Visual & Brand Voice" icon={<Palette size={15}/>}>
        {loading ? <Shimmer h="80px"/> : (
          <>
            <div style={{ display:'flex', gap:'8px', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${C.slate100}` }}>
              <span style={{ fontSize:'12px', color:C.slate500, flex:'0 0 140px' }}>Warna Brand</span>
              <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'5px', background:data?.primaryColor??'#2563EB', border:`1px solid ${C.slate200}` }}/>
                <span style={{ fontSize:'13px', color:C.slate900, fontWeight:500 }}>{data?.primaryColor??'—'}</span>
              </div>
            </div>
            <Field label="Gaya Visual" value={data?.visualStyle?.replace(/-/g,' ')}/>
            <Field label="Color Tone" value={data?.colorTone?.replace(/-/g,' ')}/>
            <Field label="Mood" value={data?.moodTone}/>
            <Field label="Tagline" value={data?.brandTagline}/>
            <Field label="Tone AI" value={data?.tone}/>
            <Field label="Bahasa AI" value={data?.language?.replace(/-/g,' ')}/>
            <Field label="Emoji" value={data?.emoji}/>
            <Field label="CTA Style" value={data?.ctaStyle}/>
            <Field label="Keyword Brand" value={data?.brandKeywords}/>
            <Field label="USP" value={data?.usp}/>
            <Field label="Hindari Kata" value={data?.avoidWords}/>
          </>
        )}
      </Section>

      {/* ── SUB-SETTINGS NAV ──────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'32px' }}>
        {[
          { href:'/settings/brand-kit',   icon:<Palette size={15} color={C.amber}/>,   label:'Brand Kit',           desc:'Logo, warna, font, panduan brand',  bg:C.amb50 },
          { href:'/settings/connections', icon:<Plug size={15} color={C.green}/>,     label:'Koneksi Platform',    desc:'Instagram, TikTok, Shopee, dll.',   bg:C.grn50 },
          { href:'/billing',              icon:<CreditCard size={15} color={C.purple}/>, label:'Billing & Credits',  desc:`Plan: ${planLimits.label} · Upgrade untuk lebih banyak`, bg:C.pur50 },
          { href:'/onboarding',           icon:<RefreshCw size={15} color={C.brand}/>, label:'Update AI Memory',    desc:'Perbarui data untuk hasil AI lebih akurat', bg:C.brand50 },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px', borderRadius:'12px', background:C.white, border:`1px solid ${C.slate200}`, transition:'all .12s', cursor:'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.slate300}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.slate200}
            >
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>{item.label}</div>
                <div style={{ fontSize:'11px', color:C.slate500 }}>{item.desc}</div>
              </div>
              <ChevronRight size={14} color={C.slate300}/>
            </div>
          </Link>
        ))}
      </div>

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}} @keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
    </div>
  )
}