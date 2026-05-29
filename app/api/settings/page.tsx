'use client'
// app/(dashboard)/settings/page.tsx — v2
// Menampilkan SEMUA data yang diisi di onboarding:
//  - Identity (step 1)
//  - Produk & niche (step 2)
//  - Platform & konten (step 3) — dengan content weight
//  - Visual (step 4)
//  - Suara brand (step 5)
//  - Usage & plan

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User, Store, Palette, Plug, CreditCard, ChevronRight,
  Edit3, Save, X, Check, AlertCircle, Loader2,
  Package, Target, Globe, BarChart3, RefreshCw,
  Mic, Zap, Brain, Info,
} from 'lucide-react'
import { CONTENT_ENGINE_OPTIONS, getContentWeight } from '@/lib/validations/onboarding'

const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#fff',
}

const PLAN_LIMITS: Record<string,{ label:string; color:string; daily:{caption:number;image:number;video:number}; monthly:{caption:number;image:number;video:number}; features:string[] }> = {
  starter: { label:'Starter', color:C.slate500, daily:{caption:3,image:1,video:0},     monthly:{caption:50,image:10,video:0},      features:['Caption Generator','Foto Produk dasar','Asset Library'] },
  free:    { label:'Gratis',  color:C.slate500, daily:{caption:3,image:1,video:0},     monthly:{caption:50,image:10,video:0},      features:['Caption Generator','Foto Produk dasar','Asset Library'] },
  basic:   { label:'Basic',   color:C.green,    daily:{caption:15,image:5,video:0},    monthly:{caption:250,image:50,video:0},     features:['Caption Generator','Studio P1','Scheduler 1 platform','Brand Kit'] },
  pro:     { label:'Pro',     color:C.purple,   daily:{caption:50,image:20,video:2},   monthly:{caption:1000,image:200,video:20},  features:['Semua Basic','Video AI','Auto-post','Analytics','Bulk 50 produk'] },
  business:{ label:'Business',color:C.amber,    daily:{caption:200,image:100,video:10},monthly:{caption:5000,image:1000,video:100},features:['Semua Pro','Unlimited caption','Team 5 seat','API access'] },
}

const SELLER_LABEL: Record<string,string> = {
  seller:'Marketplace Seller',affiliator:'Affiliator / Kreator',dropshipper:'Dropshipper',
  brand:'Brand Owner',agency:'Agency',reseller:'Reseller',creator:'Content Creator',umkm:'UMKM',
}
const NICHE_EMOJI: Record<string,string> = {
  fashion:'👗',skincare:'✨',food:'🍜',beverage:'🥤',electronics:'📱',furniture:'🛋️',
  jewelry:'💍',bag:'👜',shoes:'👟',health:'💊',digital:'💻',other:'📦',
}
const PLATFORM_EMOJI: Record<string,string> = {
  instagram:'📸','tiktok-shop':'🎵',tiktok:'🎵',shopee:'🛍️',tokopedia:'🛒',
  whatsapp:'💬',facebook:'👥',lazada:'📦',youtube:'▶️',
}
const AUDIENCE_LABEL: Record<string,string> = {
  remaja:'Remaja',mahasiswa:'Mahasiswa','ibu-rt':'Ibu RT','pria-dewasa':'Pria Dewasa',
  'wanita-karir':'Wanita Karir','gen-z':'Gen Z',milenial:'Milenial',luxury:'Luxury Buyer',
}
const GOAL_LABEL: Record<string,string> = {
  'more-sales':'Tambah Sales','save-time':'Hemat Waktu','better-content':'Konten Bagus',
  'viral-content':'Konten Viral','branding':'Branding','affiliate-conversion':'Affiliate',
}
const PAIN_LABEL: Record<string,string> = {
  'no-time':'Tidak ada waktu','no-idea':'Kehabisan ide','bad-result':'Hasil kurang menjual',
  'inconsistent':'Sulit konsisten','too-expensive':'Tim kreatif mahal',
  'no-skill':'Minim skill desain','no-engagement':'Engagement sepi',
}
const FREQ_LABEL: Record<string,string> = {
  '1-2/week':'1-2x seminggu','3-4/week':'3-4x seminggu','daily':'Tiap hari','multiple-daily':'2+ kali/hari',
}
const VISUAL_LABEL: Record<string,string> = {
  realistic:'Realistic',minimalist:'Minimalist',luxury:'Luxury',
  'clean-studio':'Clean Studio',korean:'Korean Style','dark-moody':'Dark Moody',
  cinematic:'Cinematic','viral-tiktok':'Viral TikTok',
}
const COLOR_LABEL: Record<string,string> = {
  warm:'Warm',  'soft-pastel':'Soft Pastel','monochrome':'Monochrome',
  'gold-luxury':'Gold Luxury','black-premium':'Black Premium',
  'clean-white':'Clean White','vibrant':'Vibrant','earth-tone':'Earth Tone',
}
const TONE_LABEL: Record<string,string> = {
  casual:'😊 Santai',friendly:'🤝 Friendly',professional:'💼 Profesional',
  energetic:'⚡ Energik',luxury:'💎 Luxury',playful:'🎉 Playful',
  islami:'☪️ Islami',motivational:'🚀 Motivasional',
}
const LANG_LABEL: Record<string,string> = {
  'indonesian-casual':'Indonesia Santai','indonesian-formal':'Indonesia Formal',
  'mixed-english':'Mix Indo-English','full-english':'Full English',
}

// ── Shared UI ─────────────────────────────────────────────────
function Shimmer({ h='14px' }: { h?: string }) {
  return <div style={{ width:'100%', height:h, borderRadius:'6px', background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize:'200%', animation:'shimmer 1.4s ease-in-out infinite' }}/>
}

function Section({ title, icon, children, action, accent }: {
  title:string; icon:React.ReactNode; children:React.ReactNode; action?:React.ReactNode; accent?:string
}) {
  return (
    <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.slate200}`, overflow:'hidden', marginBottom:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 16px', borderBottom:`1px solid ${C.slate100}`, background:C.slate50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:accent??C.brand50, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
          <span style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding:'12px 16px' }}>{children}</div>
    </div>
  )
}

// Display-only field row
function Row({ label, value, pill, pillColor, pillBg }: {
  label:string; value?:string|null; pill?:boolean; pillColor?:string; pillBg?:string
}) {
  if (!value) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.slate100}` }}>
      <span style={{ fontSize:'12px', color:C.slate400 }}>{label}</span>
      <span style={{ fontSize:'12px', color:C.slate300, fontStyle:'italic' }}>Belum diisi</span>
    </div>
  )
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.slate100}`, gap:'10px' }}>
      <span style={{ fontSize:'12px', color:C.slate500, flexShrink:0 }}>{label}</span>
      {pill
        ? <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 10px', borderRadius:'20px', background:pillBg??C.brand50, color:pillColor??C.brand }}>{value}</span>
        : <span style={{ fontSize:'13px', color:C.slate900, fontWeight:500, textAlign:'right' }}>{value}</span>
      }
    </div>
  )
}

// Tag chip
function Tag({ label, color=C.brand, bg=C.brand50 }: { label:string; color?:string; bg?:string }) {
  return <span style={{ fontSize:'11px', fontWeight:600, padding:'3px 9px', borderRadius:'20px', background:bg, color, lineHeight:1.3 }}>{label}</span>
}

// Tags row
function TagRow({ label, items, color, bg, emptyLabel='Belum diisi' }: {
  label:string; items:string[]; color?:string; bg?:string; emptyLabel?:string
}) {
  return (
    <div style={{ padding:'8px 0', borderBottom:`1px solid ${C.slate100}` }}>
      <div style={{ fontSize:'12px', color:C.slate500, marginBottom:'6px' }}>{label}</div>
      {items.length === 0
        ? <span style={{ fontSize:'12px', color:C.slate300, fontStyle:'italic' }}>{emptyLabel}</span>
        : <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>{items.map(t => <Tag key={t} label={t} color={color} bg={bg}/>)}</div>
      }
    </div>
  )
}

function UsageBar({ label, used, max, color }: { label:string; used:number; max:number; color:string }) {
  const pct = max > 0 ? Math.min(Math.round(used/max*100), 100) : 0
  return (
    <div style={{ marginBottom:'10px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
        <span style={{ fontSize:'12px', color:C.slate700 }}>{label}</span>
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <span style={{ fontSize:'12px', fontWeight:800, color:pct>=100?C.red:C.slate900 }}>{used}</span>
          <span style={{ fontSize:'11px', color:C.slate400 }}>/ {max}</span>
          <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 5px', borderRadius:'4px', background:pct>=100?C.red50:pct>=80?C.amb50:C.slate50, color:pct>=100?C.red:pct>=80?C.amber:C.slate500 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height:'5px', borderRadius:'3px', background:C.slate100, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:'3px', background:pct>=100?C.red:pct>=80?C.amber:color, transition:'width .5s' }}/>
      </div>
    </div>
  )
}

// Input helper
const inp: React.CSSProperties = {
  width:'100%', padding:'9px 12px', borderRadius:'9px',
  border:`1.5px solid ${C.slate200}`, fontSize:'13px',
  fontFamily:"'DM Sans',sans-serif", color:C.slate900,
  outline:'none', boxSizing:'border-box', background:C.white,
  transition:'border-color .15s',
}
const lbl: React.CSSProperties = {
  fontSize:'11px', fontWeight:700, color:C.slate500,
  textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'5px',
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function SettingsPage() {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  const [form,    setForm]    = useState<any>({})
  const [section, setSection] = useState<string|null>(null) // which section is editing

  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(({ data: d }) => {
        if (!d) return
        setData(d)
        setForm(d)
      })
      .catch(() => setError('Gagal memuat data profil'))
      .finally(() => setLoading(false))
  }, [])

  const saveSection = async (fields: string[]) => {
    setSaving(true); setError('')
    const patch: any = {}
    fields.forEach(f => { patch[f] = form[f] })
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      setData((prev: any) => ({ ...prev, ...patch }))
      setSection(null)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const planLimits = PLAN_LIMITS[data?.plan ?? 'starter'] ?? PLAN_LIMITS.starter
  const isFree = !data?.plan || data.plan === 'starter' || data.plan === 'free'

  function EditBtn({ s }: { s: string }) {
    return section === s
      ? <div style={{ display:'flex', gap:'6px' }}>
          <button onClick={() => { setSection(null); setForm(data) }} style={{ padding:'4px 10px', borderRadius:'7px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer', display:'flex', alignItems:'center', gap:'3px' }}>
            <X size={11}/> Batal
          </button>
          <button onClick={() => {
            const sectionFields: Record<string,string[]> = {
              identity: ['storeName','ownerName','whatsapp','sellerType','businessScale','experience'],
              product:  ['niche','subNiche','productType','productCount','priceRange','targetAudience','mainGoals','usp'],
              platform: ['platforms','primaryPlatform','contentTypes','postingFrequency','painPoints'],
              visual:   ['visualStyle','colorTone','moodTone','primaryColor','brandTagline'],
              voice:    ['tone','language','emoji','ctaStyle','brandKeywords','avoidWords','competitors','usp'],
            }
            saveSection(sectionFields[s] ?? [])
          }} disabled={saving} style={{ padding:'4px 12px', borderRadius:'7px', border:'none', background:C.brand, fontSize:'11px', fontWeight:700, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:'3px' }}>
            {saving ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={11}/>} Simpan
          </button>
        </div>
      : <button onClick={() => setSection(s)} style={{ padding:'4px 10px', borderRadius:'7px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'11px', fontWeight:600, color:C.slate600, cursor:'pointer', display:'flex', alignItems:'center', gap:'3px' }}>
          <Edit3 size={11}/> Edit
        </button>
  }

  const f = form // shorthand
  const d = data // shorthand

  // Toggle array helper
  const togArr = (field: string, val: string) => {
    const cur = Array.isArray(f[field]) ? f[field] : []
    setForm((p: any) => ({ ...p, [field]: cur.includes(val) ? cur.filter((x: string) => x !== val) : [...cur, val] }))
  }

  const chipBtn = (active: boolean, label: string, onClick: () => void, color=C.brand, bg=C.brand50) => (
    <button type="button" onClick={onClick}
      style={{ padding:'5px 11px', borderRadius:'99px', border:`1.5px solid ${active?color:C.slate200}`, background:active?bg:C.white, cursor:'pointer', fontSize:'12px', fontWeight:active?700:500, color:active?color:C.slate700, transition:'all .12s' }}>
      {label}
    </button>
  )

  return (
    <div style={{ maxWidth:'780px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:700, color:C.slate900, marginBottom:'2px' }}>Pengaturan</h1>
        <p style={{ fontSize:'12px', color:C.slate500 }}>Profil, AI Memory, dan penggunaan akun</p>
      </div>

      {saved && <div style={{ padding:'9px 14px', background:C.grn50, border:`1px solid #BBF7D0`, borderRadius:'10px', marginBottom:'12px', fontSize:'12px', color:C.green, fontWeight:600, display:'flex', gap:'6px', alignItems:'center' }}><Check size={13}/> Tersimpan!</div>}
      {error && <div style={{ padding:'9px 14px', background:C.red50, border:`1px solid #FECACA`, borderRadius:'10px', marginBottom:'12px', fontSize:'12px', color:C.red, display:'flex', gap:'6px', alignItems:'center' }}><AlertCircle size={13}/>{error}</div>}

      {/* ── USAGE & PLAN ─────────────────────────────────────── */}
      <Section title="Penggunaan & Plan" icon={<BarChart3 size={14} color={C.purple}/>} accent={C.pur50}
        action={<Link href="/billing" style={{ fontSize:'11px', color:C.brand, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}>Upgrade <ChevronRight size={11}/></Link>}>
        {loading ? <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>{[1,2,3].map(i=><Shimmer key={i} h="28px"/>)}</div> : (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', background:isFree?C.slate50:C.pur50, borderRadius:'10px', border:`1px solid ${isFree?C.slate200:'#DDD6FE'}`, marginBottom:'14px' }}>
              <div>
                <div style={{ fontSize:'12px', fontWeight:700, color:planLimits.color }}>Plan {planLimits.label}</div>
                <div style={{ fontSize:'11px', color:C.slate500 }}>
                  {d?.memberSince ? `Bergabung ${new Date(d.memberSince).toLocaleDateString('id-ID',{month:'long',year:'numeric'})}` : 'Akun aktif'}
                </div>
              </div>
              {isFree && <Link href="/billing" style={{ padding:'6px 14px', borderRadius:'8px', background:'linear-gradient(135deg,#7C3AED,#2563EB)', color:'#fff', textDecoration:'none', fontSize:'11px', fontWeight:700 }}>Upgrade →</Link>}
            </div>
            <div style={{ marginBottom:'12px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.slate400, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'9px' }}>Hari Ini</div>
              <UsageBar label="Caption AI" used={0} max={planLimits.daily.caption} color={C.brand}/>
              <UsageBar label="Gambar AI"  used={0} max={planLimits.daily.image}   color={C.purple}/>
              <UsageBar label="Video AI"   used={0} max={planLimits.daily.video}   color={C.amber}/>
            </div>
            <div style={{ padding:'9px 12px', background:C.slate50, borderRadius:'9px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.slate500, marginBottom:'6px' }}>Fitur plan {planLimits.label}:</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {planLimits.features.map((ft,i) => <Tag key={i} label={`✓ ${ft}`} color={C.slate600} bg={C.white}/>)}
              </div>
            </div>
          </>
        )}
      </Section>

      {/* ── USER PROFILE ─────────────────────────────────────── */}
      <Section title="Akun & Profil" icon={<User size={14} color={C.brand}/>} accent={C.brand50}
        action={<EditBtn s="identity"/>}>
        {loading ? <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>{[1,2,3].map(i=><Shimmer key={i}/>)}</div> : (
          <>
            {/* Avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px', paddingBottom:'12px', borderBottom:`1px solid ${C.slate100}` }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0, overflow:'hidden' }}>
                {d?.avatarUrl ? <img src={d.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : '👤'}
              </div>
              <div>
                <div style={{ fontSize:'15px', fontWeight:700, color:C.slate900 }}>{d?.name || d?.email}</div>
                <div style={{ fontSize:'12px', color:C.slate500 }}>{d?.email}</div>
                <Tag label={planLimits.label} color={planLimits.color} bg={isFree?C.slate100:C.pur50}/>
              </div>
            </div>

            {section === 'identity' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={lbl}>Nama Toko</label>
                    <input style={inp} value={f.storeName??''} onChange={e=>setForm((p:any)=>({...p,storeName:e.target.value}))} placeholder="Nama toko"/>
                  </div>
                  <div>
                    <label style={lbl}>Nama Owner</label>
                    <input style={inp} value={f.ownerName??''} onChange={e=>setForm((p:any)=>({...p,ownerName:e.target.value}))} placeholder="Nama lengkap"/>
                  </div>
                </div>
                <div>
                  <label style={lbl}>WhatsApp</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:C.slate400 }}>+62</span>
                    <input style={{ ...inp, paddingLeft:'40px' }} value={f.whatsapp??''} onChange={e=>setForm((p:any)=>({...p,whatsapp:e.target.value}))} inputMode="numeric"/>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Tipe Bisnis</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {Object.entries(SELLER_LABEL).map(([v,l]) => chipBtn(f.sellerType===v, l, ()=>setForm((p:any)=>({...p,sellerType:v}))))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={lbl}>Skala Bisnis</label>
                    <div style={{ display:'flex', gap:'4px' }}>
                      {[{v:'solo',l:'Solo'},{v:'small',l:'Kecil'},{v:'medium',l:'Medium'},{v:'large',l:'Besar'}].map(s=>chipBtn(f.businessScale===s.v,s.l,()=>setForm((p:any)=>({...p,businessScale:s.v}))))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Level AI</label>
                    <div style={{ display:'flex', gap:'4px' }}>
                      {[{v:'beginner',l:'Pemula'},{v:'intermediate',l:'Menengah'},{v:'advanced',l:'Mahir'}].map(s=>chipBtn(f.experience===s.v,s.l,()=>setForm((p:any)=>({...p,experience:s.v})),C.purple,C.pur50))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Row label="Nama Toko"   value={d?.storeName}/>
                <Row label="Nama Owner"  value={d?.ownerName}/>
                <Row label="WhatsApp"    value={d?.whatsapp ? `+62 ${d.whatsapp}` : null}/>
                <Row label="Email"       value={d?.email}/>
                <Row label="Tipe Bisnis" value={SELLER_LABEL[d?.sellerType]||d?.sellerType} pill pillColor={C.brand} pillBg={C.brand50}/>
                <Row label="Skala Bisnis"value={d?.businessScale}/>
                <Row label="Level AI"    value={d?.experience}/>
              </>
            )}
          </>
        )}
      </Section>

      {/* ── AI MEMORY: PRODUK & NICHE ─────────────────────────── */}
      <Section title="AI Memory — Produk & Niche" icon={<Package size={14} color={C.green}/>} accent={C.grn50}
        action={<EditBtn s="product"/>}>
        {loading ? <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>{[1,2,3,4].map(i=><Shimmer key={i}/>)}</div> : (
          <>
            <div style={{ padding:'7px 10px', background:C.brand50, border:`1px solid ${C.brand100}`, borderRadius:'9px', fontSize:'11px', color:C.slate600, marginBottom:'10px', display:'flex', gap:'6px', alignItems:'center' }}>
              <Brain size={11} color={C.brand}/> Data ini dipakai AI untuk personalisasi caption, gambar, dan rekomendasi konten.
            </div>
            {section === 'product' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div>
                  <label style={lbl}>Kategori Niche</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {Object.entries(NICHE_EMOJI).map(([v,emoji]) => chipBtn(f.niche===v, `${emoji} ${v}`, ()=>setForm((p:any)=>({...p,niche:v}))))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={lbl}>Sub-niche</label>
                    <input style={inp} value={f.subNiche??''} onChange={e=>setForm((p:any)=>({...p,subNiche:e.target.value}))} placeholder="Contoh: serum vitamin C"/>
                  </div>
                  <div>
                    <label style={lbl}>Range Harga</label>
                    <select style={{ ...inp, height:'38px' }} value={f.priceRange??''} onChange={e=>setForm((p:any)=>({...p,priceRange:e.target.value}))}>
                      <option value="">Pilih...</option>
                      {['<50k','50k-200k','200k-500k','500k-2jt','2jt+'].map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={lbl}>USP (Keunggulan Unik)</label>
                  <textarea style={{ ...inp, resize:'vertical' }} rows={2} value={f.usp??''} onChange={e=>setForm((p:any)=>({...p,usp:e.target.value}))} placeholder="Apa yang buat brand kamu beda?"/>
                </div>
                <div>
                  <label style={lbl}>Target Audience</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {Object.entries(AUDIENCE_LABEL).map(([v,l]) => chipBtn((f.targetAudience??[]).includes(v), l, ()=>togArr('targetAudience',v), C.purple, C.pur50))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Tujuan Bisnis</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {Object.entries(GOAL_LABEL).map(([v,l]) => chipBtn((f.mainGoals??[]).includes(v), l, ()=>togArr('mainGoals',v), C.amber, C.amb50))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Row label="Kategori Niche" value={d?.niche ? `${NICHE_EMOJI[d.niche]||'📦'} ${d.niche}${d.subNiche?` › ${d.subNiche}`:''}` : null}/>
                <Row label="Range Harga"   value={d?.priceRange}/>
                <Row label="USP"           value={d?.usp}/>
                <Row label="Jenis Produk"  value={d?.productType}/>
                <Row label="Jumlah SKU"    value={d?.productCount}/>
                <TagRow label="Target Audience" items={(d?.targetAudience??[]).map((a:string)=>AUDIENCE_LABEL[a]||a)} color={C.purple} bg={C.pur50}/>
                <TagRow label="Tujuan Bisnis"   items={(d?.mainGoals??[]).map((g:string)=>GOAL_LABEL[g]||g)} color={C.amber} bg={C.amb50}/>
              </>
            )}
          </>
        )}
      </Section>

      {/* ── AI MEMORY: PLATFORM & KONTEN ──────────────────────── */}
      <Section title="AI Memory — Platform & Konten" icon={<Globe size={14} color={C.brand}/>} accent={C.brand50}
        action={<EditBtn s="platform"/>}>
        {loading ? <Shimmer h="100px"/> : (
          <>
            {section === 'platform' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div>
                  <label style={lbl}>Platform Jualan</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {Object.entries(PLATFORM_EMOJI).map(([v,emoji]) => chipBtn((f.platforms??[]).includes(v), `${emoji} ${v}`, ()=>togArr('platforms',v)))}
                  </div>
                </div>
                {(f.platforms??[]).length > 0 && (
                  <div>
                    <label style={lbl}>Platform Utama</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {(f.platforms as string[]).map((p: string) => chipBtn(f.primaryPlatform===p, `${PLATFORM_EMOJI[p]||'📱'} ${p}${f.primaryPlatform===p?' ⭐':''}`, ()=>setForm((prev:any)=>({...prev,primaryPlatform:p})), C.green, C.grn50))}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                    <label style={{ ...lbl, marginBottom:0 }}>Format Content Engine</label>
                    {(f.contentTypes??[]).length > 0 && (
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:C.brand50, color:C.brand }}>
                        Total: {getContentWeight(f.contentTypes??[])} format
                      </span>
                    )}
                  </div>
                  <div style={{ padding:'7px 10px', background:C.amb50, borderRadius:'8px', fontSize:'11px', color:C.amber, marginBottom:'8px' }}>
                    💡 Video/Reels & Feed = 2 format · Story & Ads = 1 format masing-masing
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                    {CONTENT_ENGINE_OPTIONS.map(opt => {
                      const sel = (f.contentTypes??[]).includes(opt.v)
                      return (
                        <button key={opt.v} type="button" onClick={()=>togArr('contentTypes',opt.v)}
                          style={{ padding:'10px', borderRadius:'10px', border:`1.5px solid ${sel?C.purple:C.slate200}`, background:sel?C.pur50:C.white, cursor:'pointer', textAlign:'left', position:'relative' }}>
                          <div style={{ position:'absolute', top:'7px', right:'7px', fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'20px', background:opt.weight===2?`${C.amber}20`:`${C.green}20`, color:opt.weight===2?C.amber:C.green }}>{opt.weight} format</div>
                          <div style={{ fontSize:'15px', marginBottom:'2px' }}>{opt.i}</div>
                          <div style={{ fontSize:'12px', fontWeight:700, color:sel?C.purple:C.slate900 }}>{opt.l}</div>
                          <div style={{ fontSize:'10px', color:C.slate400 }}>{opt.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Frekuensi Posting</label>
                  <div style={{ display:'flex', gap:'5px' }}>
                    {Object.entries(FREQ_LABEL).map(([v,l]) => chipBtn(f.postingFrequency===v, l, ()=>setForm((p:any)=>({...p,postingFrequency:v}))))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Tantangan Terbesar</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {Object.entries(PAIN_LABEL).map(([v,l]) => chipBtn((f.painPoints??[]).includes(v), l, ()=>togArr('painPoints',v), C.red, C.red50))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Row label="Platform Utama" value={d?.primaryPlatform ? `${PLATFORM_EMOJI[d.primaryPlatform]||'📱'} ${d.primaryPlatform}` : null}/>
                <Row label="Frekuensi"      value={FREQ_LABEL[d?.postingFrequency] || d?.postingFrequency}/>
                <TagRow label="Semua Platform" items={(d?.platforms??[]).map((p:string)=>`${PLATFORM_EMOJI[p]||'📱'} ${p}`)} color={C.brand} bg={C.brand50}/>
                {/* Content Engine dengan weight */}
                <div style={{ padding:'8px 0', borderBottom:`1px solid ${C.slate100}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'7px' }}>
                    <span style={{ fontSize:'12px', color:C.slate500 }}>Format Content Engine</span>
                    {(d?.contentWeight ?? 0) > 0 && (
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:C.brand50, color:C.brand }}>
                        Total {d.contentWeight} format
                      </span>
                    )}
                  </div>
                  {(d?.contentTypes??[]).length === 0
                    ? <span style={{ fontSize:'12px', color:C.slate300, fontStyle:'italic' }}>Belum diisi</span>
                    : <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                        {(d.contentTypes as string[]).map((ct:string) => {
                          const opt = CONTENT_ENGINE_OPTIONS.find(o => o.v === ct)
                          return (
                            <div key={ct} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', borderRadius:'8px', background:C.pur50, border:`1px solid #DDD6FE` }}>
                              <span style={{ fontSize:'12px', fontWeight:600, color:C.purple }}>{opt?.i} {opt?.l || ct}</span>
                              <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 7px', borderRadius:'20px', background:opt?.weight===2?`${C.amber}20`:`${C.green}20`, color:opt?.weight===2?C.amber:C.green }}>
                                {opt?.weight??1} format
                              </span>
                            </div>
                          )
                        })}
                      </div>
                  }
                </div>
                <TagRow label="Tantangan" items={(d?.painPoints??[]).map((p:string)=>PAIN_LABEL[p]||p)} color={C.red} bg={C.red50} emptyLabel="Tidak diisi"/>
              </>
            )}
          </>
        )}
      </Section>

      {/* ── AI MEMORY: VISUAL ─────────────────────────────────── */}
      <Section title="AI Memory — Gaya Visual" icon={<Palette size={14} color={C.amber}/>} accent={C.amb50}
        action={<EditBtn s="visual"/>}>
        {loading ? <Shimmer h="80px"/> : (
          section === 'visual' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={lbl}>Gaya Visual AI</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {Object.entries(VISUAL_LABEL).map(([v,l]) => chipBtn(f.visualStyle===v, l, ()=>setForm((p:any)=>({...p,visualStyle:v}))))}
                </div>
              </div>
              <div>
                <label style={lbl}>Color Tone</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {Object.entries(COLOR_LABEL).map(([v,l]) => chipBtn(f.colorTone===v, l, ()=>setForm((p:any)=>({...p,colorTone:v})), C.purple, C.pur50))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div>
                  <label style={lbl}>Warna Brand</label>
                  <div style={{ display:'flex', gap:'7px', alignItems:'center' }}>
                    <input type="color" value={f.primaryColor??'#2563EB'} onChange={e=>setForm((p:any)=>({...p,primaryColor:e.target.value}))} style={{ width:'38px', height:'38px', borderRadius:'8px', border:`1px solid ${C.slate200}`, cursor:'pointer', padding:'2px' }}/>
                    <input style={{ ...inp, flex:1 }} value={f.primaryColor??''} onChange={e=>setForm((p:any)=>({...p,primaryColor:e.target.value}))} placeholder="#2563EB"/>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Tagline Brand</label>
                  <input style={inp} value={f.brandTagline??''} onChange={e=>setForm((p:any)=>({...p,brandTagline:e.target.value}))} placeholder="Tagline brand kamu"/>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 0', borderBottom:`1px solid ${C.slate100}` }}>
                <span style={{ fontSize:'12px', color:C.slate500, flexShrink:0 }}>Warna Brand</span>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginLeft:'auto' }}>
                  <div style={{ width:'18px', height:'18px', borderRadius:'4px', background:d?.primaryColor??'#2563EB', border:`1px solid ${C.slate200}` }}/>
                  <span style={{ fontSize:'13px', color:C.slate900, fontWeight:500 }}>{d?.primaryColor??'—'}</span>
                </div>
              </div>
              <Row label="Gaya Visual" value={VISUAL_LABEL[d?.visualStyle]||d?.visualStyle}/>
              <Row label="Color Tone"  value={COLOR_LABEL[d?.colorTone]||d?.colorTone}/>
              <Row label="Mood Tone"   value={d?.moodTone}/>
              <Row label="Tagline"     value={d?.brandTagline}/>
            </>
          )
        )}
      </Section>

      {/* ── AI MEMORY: SUARA BRAND ─────────────────────────────── */}
      <Section title="AI Memory — Suara Brand" icon={<Mic size={14} color={C.purple}/>} accent={C.pur50}
        action={<EditBtn s="voice"/>}>
        {loading ? <Shimmer h="80px"/> : (
          section === 'voice' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={lbl}>Tone Komunikasi</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {Object.entries(TONE_LABEL).map(([v,l]) => chipBtn(f.tone===v, l, ()=>setForm((p:any)=>({...p,tone:v}))))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div>
                  <label style={lbl}>Bahasa Output AI</label>
                  <select style={{ ...inp, height:'38px' }} value={f.language??''} onChange={e=>setForm((p:any)=>({...p,language:e.target.value}))}>
                    {Object.entries(LANG_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>CTA Style</label>
                  <div style={{ display:'flex', gap:'4px' }}>
                    {[{v:'soft',l:'💫 Soft'},{v:'medium',l:'🎯 Medium'},{v:'aggressive',l:'🔥 Aggressive'}].map(s => chipBtn(f.ctaStyle===s.v, s.l, ()=>setForm((p:any)=>({...p,ctaStyle:s.v})), C.red, C.red50))}
                  </div>
                </div>
              </div>
              <div>
                <label style={lbl}>Emoji Level</label>
                <div style={{ display:'flex', gap:'4px' }}>
                  {[{v:'none',l:'None'},{v:'minimal',l:'Sedikit'},{v:'moderate',l:'Sedang'},{v:'heavy',l:'Banyak'}].map(s => chipBtn(f.emoji===s.v, s.l, ()=>setForm((p:any)=>({...p,emoji:s.v})), C.amber, C.amb50))}
                </div>
              </div>
              <div>
                <label style={lbl}>Keyword Brand</label>
                <input style={inp} value={f.brandKeywords??''} onChange={e=>setForm((p:any)=>({...p,brandKeywords:e.target.value}))} placeholder="Natural, Premium, Halal..."/>
              </div>
              <div>
                <label style={lbl}>USP (Keunggulan Unik)</label>
                <textarea style={{ ...inp, resize:'vertical' }} rows={2} value={f.usp??''} onChange={e=>setForm((p:any)=>({...p,usp:e.target.value}))} placeholder="Apa yang membuat brand kamu berbeda?"/>
              </div>
              <div>
                <label style={lbl}>Kata yang Dihindari AI</label>
                <input style={inp} value={f.avoidWords??''} onChange={e=>setForm((p:any)=>({...p,avoidWords:e.target.value}))} placeholder="Murah, murahan..."/>
              </div>
              <div>
                <label style={lbl}>Kompetitor</label>
                <input style={inp} value={f.competitors??''} onChange={e=>setForm((p:any)=>({...p,competitors:e.target.value}))} placeholder="Nama brand pesaing..."/>
              </div>
            </div>
          ) : (
            <>
              <Row label="Tone"          value={TONE_LABEL[d?.tone]||d?.tone} pill pillColor={C.brand} pillBg={C.brand50}/>
              <Row label="Bahasa AI"     value={LANG_LABEL[d?.language]||d?.language}/>
              <Row label="Emoji"         value={d?.emoji}/>
              <Row label="CTA Style"     value={d?.ctaStyle}/>
              <Row label="Keyword Brand" value={d?.brandKeywords}/>
              <Row label="USP"           value={d?.usp}/>
              <Row label="Hindari Kata"  value={d?.avoidWords}/>
              <Row label="Kompetitor"    value={d?.competitors}/>
            </>
          )
        )}
      </Section>

      {/* ── AI Memory info bar ────────────────────────────────── */}
      {d?.memorySavedAt && (
        <div style={{ padding:'8px 14px', background:C.grn50, border:`1px solid #BBF7D0`, borderRadius:'9px', fontSize:'11px', color:C.green, marginBottom:'12px', display:'flex', gap:'6px', alignItems:'center' }}>
          <Check size={12}/> AI Memory tersimpan: {new Date(d.memorySavedAt).toLocaleDateString('id-ID',{ day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'32px' }}>
        {[
          { href:'/settings/brand-kit',   icon:<Palette size={15} color={C.amber}/>,    label:'Brand Kit',          desc:'Logo, warna, font, panduan visual', bg:C.amb50 },
          { href:'/settings/connections', icon:<Plug size={15} color={C.green}/>,       label:'Koneksi Platform',   desc:'Instagram, TikTok, Shopee, dll.',   bg:C.grn50 },
          { href:'/billing',              icon:<CreditCard size={15} color={C.purple}/>, label:'Billing & Credits',  desc:`Plan: ${planLimits.label}`,          bg:C.pur50 },
          { href:'/onboarding',           icon:<RefreshCw size={15} color={C.brand}/>,  label:'Reset AI Memory',    desc:'Isi ulang data untuk AI yang lebih akurat', bg:C.brand50 },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'12px', background:C.white, border:`1px solid ${C.slate200}`, cursor:'pointer' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:C.slate900 }}>{item.label}</div>
                <div style={{ fontSize:'11px', color:C.slate500 }}>{item.desc}</div>
              </div>
              <ChevronRight size={13} color={C.slate300}/>
            </div>
          </Link>
        ))}
      </div>

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}} @keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} select{appearance:auto}`}</style>
    </div>
  )
}