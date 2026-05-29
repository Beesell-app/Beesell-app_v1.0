'use client'
// app/(onboarding)/onboarding/page.tsx — v4
// Key changes:
//  - Step 3: Content Engine menampilkan weight (video-reels=2, feed=2, story=1, ads=1)
//  - Semua data onboarding disimpan lengkap ke AI Memory + settings/profile
//  - contentTypes payload dikirim dengan weight info

import { useState, useCallback, useRef } from 'react'
import { useRouter }    from 'next/navigation'
import { useForm }      from 'react-hook-form'
import { zodResolver }  from '@hookform/resolvers/zod'
import {
  step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, step6Schema,
  CONTENT_ENGINE_OPTIONS, getContentWeight,
  type Step1Data, type Step2Data, type Step3Data, type Step4Data,
  type Step5Data, type Step6Data, type OnboardingAllData,
} from '@/lib/validations/onboarding'
import { ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, RefreshCw, Info } from 'lucide-react'

const C = {
  brand:'#2563EB', brand50:'#EFF6FF', brand100:'#DBEAFE',
  purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5',
  amber:'#D97706', amb50:'#FFFBEB',
  red:'#DC2626', red50:'#FEF2F2',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569', slate500:'#64748B',
  slate400:'#94A3B8', slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#fff',
}

const STEPS = [
  { n:1, icon:'🏪', title:'Identitas Bisnis',  sub:'Nama toko & tipe bisnis' },
  { n:2, icon:'📦', title:'Niche & Produk',    sub:'Apa yang kamu jual?' },
  { n:3, icon:'📱', title:'Platform & Konten', sub:'Di mana & apa yang kamu buat?' },
  { n:4, icon:'🎨', title:'Gaya Visual',       sub:'Tampilan brand kamu' },
  { n:5, icon:'✍️', title:'Suara Brand',       sub:'Tone komunikasi AI' },
  { n:6, icon:'💳', title:'Pilih Plan',         sub:'Mulai gratis kapan saja' },
  { n:7, icon:'✅', title:'Simpan & Mulai',    sub:'Masuk ke dashboard' },
]

const SELLER_TYPES = [
  {v:'seller',l:'Seller',i:'🛍️'},{v:'affiliator',l:'Affiliator',i:'🎵'},
  {v:'dropshipper',l:'Dropshipper',i:'📦'},{v:'brand',l:'Brand',i:'🏷️'},
  {v:'agency',l:'Agency',i:'🏢'},{v:'reseller',l:'Reseller',i:'🔄'},
  {v:'creator',l:'Creator',i:'🎬'},{v:'umkm',l:'UMKM',i:'🏭'},
]
const NICHES = [
  {v:'fashion',l:'Fashion',i:'👗'},{v:'skincare',l:'Skincare',i:'✨'},
  {v:'food',l:'Makanan',i:'🍜'},{v:'beverage',l:'Minuman',i:'🥤'},
  {v:'electronics',l:'Elektronik',i:'📱'},{v:'health',l:'Kesehatan',i:'💊'},
  {v:'jewelry',l:'Perhiasan',i:'💍'},{v:'digital',l:'Digital',i:'💻'},
  {v:'bag',l:'Tas',i:'👜'},{v:'shoes',l:'Sepatu',i:'👟'},
  {v:'furniture',l:'Furniture',i:'🛋️'},{v:'other',l:'Lainnya',i:'📦'},
]
const PLATFORMS = [
  {v:'shopee',l:'Shopee',i:'🛍️'},{v:'tokopedia',l:'Tokopedia',i:'🛒'},
  {v:'tiktok-shop',l:'TikTok Shop',i:'🎵'},{v:'instagram',l:'Instagram',i:'📸'},
  {v:'facebook',l:'Facebook',i:'👥'},{v:'whatsapp',l:'WhatsApp',i:'💬'},
  {v:'lazada',l:'Lazada',i:'📦'},{v:'youtube',l:'YouTube',i:'▶️'},
]
const AUDIENCES = [
  {v:'remaja',l:'Remaja',i:'🧑'},{v:'mahasiswa',l:'Mahasiswa',i:'🎓'},
  {v:'ibu-rt',l:'Ibu RT',i:'👩‍👧'},{v:'pria-dewasa',l:'Pria Dewasa',i:'👨'},
  {v:'wanita-karir',l:'Wanita Karir',i:'💼'},{v:'gen-z',l:'Gen Z',i:'⚡'},
  {v:'milenial',l:'Milenial',i:'🌟'},{v:'luxury',l:'Luxury',i:'💎'},
]
const VISUAL_STYLES = [
  {v:'realistic',l:'Realistic',i:'📸'},{v:'minimalist',l:'Minimalist',i:'⬜'},
  {v:'luxury',l:'Luxury',i:'💎'},{v:'clean-studio',l:'Clean Studio',i:'🏢'},
  {v:'korean',l:'Korean',i:'🌸'},{v:'dark-moody',l:'Dark Moody',i:'🌑'},
  {v:'cinematic',l:'Cinematic',i:'🎬'},{v:'viral-tiktok',l:'Viral TikTok',i:'🔥'},
]
const COLOR_TONES = [
  {v:'warm',l:'Warm',hex:'#F59E0B'},{v:'soft-pastel',l:'Pastel',hex:'#F9A8D4'},
  {v:'monochrome',l:'Mono',hex:'#374151'},{v:'gold-luxury',l:'Gold',hex:'#D97706'},
  {v:'clean-white',l:'White',hex:'#F9FAFB'},{v:'vibrant',l:'Vibrant',hex:'#EF4444'},
]
const TONES = [
  {v:'casual',l:'😊 Santai'},{v:'friendly',l:'🤝 Friendly'},
  {v:'professional',l:'💼 Profesional'},{v:'energetic',l:'⚡ Energik'},
  {v:'luxury',l:'💎 Luxury'},{v:'playful',l:'🎉 Playful'},
  {v:'islami',l:'☪️ Islami'},{v:'motivational',l:'🚀 Motivasi'},
]
const PLANS = [
  { id:'free',    label:'Gratis',  price:0,      features:['3 caption/hari','1 gambar/hari'], color:C.slate500, bg:C.slate50 },
  { id:'basic',   label:'Basic',   price:99_000, features:['15 caption/hari','20 gambar/bln','Scheduler'], color:C.green, bg:C.grn50 },
  { id:'pro',     label:'Pro',     price:299_000,features:['50 caption/hari','100 gambar/bln','Auto-post'], color:C.purple, bg:C.pur50, badge:'🔥 Terlaris' },
  { id:'business',label:'Business',price:799_000,features:['Unlimited','500 gambar/bln','Team 5 seat'], color:C.amber, bg:C.amb50 },
]
const PAIN_POINTS = [
  {v:'no-time',l:'⏰ Tidak ada waktu'},{v:'no-idea',l:'💭 Kehabisan ide'},
  {v:'bad-result',l:'📉 Hasil kurang menjual'},{v:'inconsistent',l:'📅 Sulit konsisten'},
  {v:'too-expensive',l:'💸 Tim kreatif mahal'},{v:'no-skill',l:'🎨 Minim skill desain'},
  {v:'no-engagement',l:'👥 Engagement sepi'},
]

const inp = (err?: boolean): React.CSSProperties => ({
  width:'100%', padding:'11px 14px', borderRadius:'10px',
  border:`1.5px solid ${err ? C.red : C.slate200}`,
  background: err ? C.red50 : C.white, fontSize:'13px',
  fontFamily:"'DM Sans',sans-serif", color:C.slate900,
  outline:'none', boxSizing:'border-box' as const, transition:'border-color .15s',
})
const lbl = (): React.CSSProperties => ({
  fontSize:'11px', fontWeight:700, color:C.slate500,
  textTransform:'uppercase' as const, letterSpacing:'0.07em', display:'block', marginBottom:'6px',
})

function ProgressBar({ current }: { current: number }) {
  return (
    <div style={{ marginBottom:'22px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
        <div style={{ fontSize:'12px', fontWeight:700, color:C.slate500 }}>Langkah {current} dari 7</div>
        <div style={{ fontSize:'12px', fontWeight:700, color:C.brand }}>{Math.round((current-1)/7*100)}%</div>
      </div>
      <div style={{ display:'flex', alignItems:'center' }}>
        {STEPS.map((s, i) => (
          <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < 6 ? '1' : 'none' }}>
            <div style={{ width:'26px', height:'26px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, background:current>s.n?C.green:current===s.n?C.brand:C.slate200, color:current>=s.n?C.white:C.slate400, transition:'all .2s', border:current===s.n?`2px solid ${C.brand}`:'none' }}>
              {current > s.n ? <Check size={11}/> : s.n}
            </div>
            {i < 6 && <div style={{ flex:1, height:'2px', background:current>s.n?C.green:C.slate200, transition:'background .3s' }}/>}
          </div>
        ))}
      </div>
      <div style={{ textAlign:'center', marginTop:'12px' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:C.slate900 }}>{STEPS[current-1].icon} {STEPS[current-1].title}</div>
        <div style={{ fontSize:'12px', color:C.slate500 }}>{STEPS[current-1].sub}</div>
      </div>
    </div>
  )
}

function Nav({ label='Lanjut →', onBack, isFirst=false }: { label?:string; onBack?:()=>void; isFirst?:boolean }) {
  return (
    <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
      {!isFirst && onBack && (
        <button type="button" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'12px 16px', borderRadius:'12px', border:`1.5px solid ${C.slate200}`, background:C.white, color:C.slate600, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          <ChevronLeft size={14}/> Kembali
        </button>
      )}
      <button type="submit" style={{ flex:1, padding:'12px 20px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', boxShadow:'0 4px 14px rgba(37,99,235,.25)' }}>
        {label} <ChevronRight size={14}/>
      </button>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router    = useRouter()
  const [step,    setStep]    = useState(1)
  const [data,    setData]    = useState<OnboardingAllData>({})
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [saveCode,setSaveCode]= useState<number|null>(null)
  const saveRef = useRef(false)

  const next = useCallback((stepData: any, key: keyof OnboardingAllData) => {
    setData(prev => ({ ...prev, [key]: stepData }))
    setStep(s => Math.min(s + 1, 7))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const prev = useCallback(() => {
    setStep(s => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const submit = async () => {
    if (saveRef.current) return
    saveRef.current = true
    setSaving(true); setSaveErr(''); setSaveCode(null)

    const d1 = data.step1
    if (!d1?.storeName) {
      setSaveErr('Nama toko (langkah 1) wajib diisi.'); setSaving(false); saveRef.current = false; setStep(1); return
    }

    const d2 = data.step2; const d3 = data.step3
    const d4 = data.step4; const d5 = data.step5; const d6 = data.step6

    const payload = {
      storeName:        d1.storeName,
      ownerName:        d1.ownerName        ?? '',
      whatsapp:         d1.whatsapp         ?? '',
      sellerType:       d1.sellerType       ?? 'seller',
      businessScale:    d1.businessScale    ?? 'solo',
      experience:       d1.experience       ?? 'beginner',
      niche:            d2?.niche            ?? '',
      subNiche:         d2?.subNiche         ?? '',
      productType:      d2?.productType      ?? 'physical',
      productCount:     d2?.productCount     ?? '1-5',
      priceRange:       d2?.priceRange       ?? '',
      targetAudience:   d2?.targetAudience   ?? [],
      mainGoals:        d2?.mainGoals        ?? [],
      usp:              d5?.usp              ?? '',
      platforms:        d3?.platforms        ?? [],
      primaryPlatform:  d3?.primaryPlatform  ?? 'instagram',
      contentTypes:     d3?.contentTypes     ?? [],
      postingFrequency: d3?.postingFrequency ?? '3-4/week',
      painPoints:       d3?.painPoints       ?? [],
      visualStyle:      d4?.visualStyle      ?? 'realistic',
      colorTone:        d4?.colorTone        ?? 'clean-white',
      moodTone:         d4?.moodTone         ?? 'trustworthy',
      primaryColor:     d4?.primaryColor     ?? '#2563EB',
      brandTagline:     d4?.brandTagline     ?? '',
      tone:             d5?.tone             ?? 'casual',
      language:         d5?.language         ?? 'indonesian-casual',
      emoji:            d5?.emoji            ?? 'moderate',
      ctaStyle:         d5?.ctaStyle         ?? 'medium',
      brandKeywords:    d5?.brandKeywords    ?? '',
      avoidWords:       d5?.avoidWords       ?? '',
      competitors:      d5?.competitors      ?? '',
      planId:           d6?.planId           ?? 'free',
    }

    try {
      const res  = await fetch('/api/onboarding/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      if (!res.ok) {
        setSaveCode(res.status)
        let msg = `Error ${res.status}`
        try { const j = JSON.parse(text); msg = j.message ?? j.error ?? msg } catch {}
        if (res.status === 401) msg = 'Sesi habis. Refresh halaman dan login ulang.'
        if (res.status === 404) msg = 'Akun tidak ditemukan. Jalankan SQL migration 016 di Supabase.'
        throw new Error(msg)
      }
      try { localStorage.removeItem('beesell-onboarding-v3') } catch {}
      window.location.href = '/dashboard?welcome=true'
    } catch (e: any) {
      setSaveErr(e.message ?? 'Terjadi kesalahan. Coba lagi.')
      setSaving(false); saveRef.current = false
    }
  }

  const StepForm = () => {
    switch (step) {
      case 1: return <Step1 dv={data.step1} onNext={d => next(d,'step1')}/>
      case 2: return <Step2 dv={data.step2} onNext={d => next(d,'step2')} onBack={prev}/>
      case 3: return <Step3 dv={data.step3} onNext={d => next(d,'step3')} onBack={prev}/>
      case 4: return <Step4 dv={data.step4} onNext={d => next(d,'step4')} onBack={prev}/>
      case 5: return <Step5 dv={data.step5} onNext={d => next(d,'step5')} onBack={prev}/>
      case 6: return <Step6 dv={data.step6} onNext={d => next(d,'step6')} onBack={prev}/>
      case 7: return <Step7 saving={saving} saveErr={saveErr} saveCode={saveCode} onFinish={submit} onBack={prev}/>
      default: return null
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 60%,#ECFDF5 100%)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'36px 16px 40px', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:'620px' }}>
        <div style={{ textAlign:'center', marginBottom:'22px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px' }}>🐝</div>
            <span style={{ fontFamily:"Georgia,serif", fontSize:'19px', fontWeight:700, color:C.slate900 }}>BeeSell AI</span>
          </div>
          <div style={{ fontSize:'11px', color:C.slate400, marginTop:'3px' }}>Setup 3 menit · AI Memory tersimpan otomatis</div>
        </div>
        <div style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.slate200}`, padding:'26px', boxShadow:'0 4px 24px rgba(37,99,235,.05)' }}>
          <ProgressBar current={step}/>
          <div style={{ borderTop:`1px solid ${C.slate100}`, paddingTop:'22px' }}>
            <StepForm/>
          </div>
        </div>
        <p style={{ textAlign:'center', fontSize:'11px', color:C.slate400, marginTop:'12px' }}>
          Data tersimpan di AI Memory · Digunakan untuk personalisasi semua fitur
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
    </div>
  )
}

// ── STEP 1 ─────────────────────────────────────────────────────
function Step1({ dv, onNext }: { dv?:Step1Data; onNext:(d:Step1Data)=>void }) {
  const { register, handleSubmit, watch, setValue, formState:{errors} } = useForm({
    resolver:zodResolver(step1Schema),
    defaultValues:dv??{businessScale:'solo',experience:'beginner'},
  })
  const v = watch() as any
  return (
    <form onSubmit={handleSubmit(onNext as any)} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <div>
          <label style={lbl()}>Nama Toko <span style={{color:C.red}}>*</span></label>
          <input {...register('storeName')} placeholder="Nama toko / brand" style={inp(!!errors.storeName)}/>
          {errors.storeName && <p style={{fontSize:'11px',color:C.red,marginTop:'3px'}}>{errors.storeName.message as string}</p>}
        </div>
        <div>
          <label style={lbl()}>Nama Owner <span style={{color:C.red}}>*</span></label>
          <input {...register('ownerName')} placeholder="Nama lengkap" style={inp(!!errors.ownerName)}/>
          {errors.ownerName && <p style={{fontSize:'11px',color:C.red,marginTop:'3px'}}>{errors.ownerName.message as string}</p>}
        </div>
      </div>
      <div>
        <label style={lbl()}>No WhatsApp</label>
        <div style={{position:'relative'}}>
          <span style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:C.slate400}}>+62</span>
          <input {...register('whatsapp')} placeholder="812xxxxxxx" inputMode="numeric" style={{...inp(!!errors.whatsapp),paddingLeft:'46px'}}/>
        </div>
      </div>
      <div>
        <label style={lbl()}>Tipe Bisnis <span style={{color:C.red}}>*</span></label>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px'}}>
          {SELLER_TYPES.map(t=>(
            <button key={t.v} type="button" onClick={()=>setValue('sellerType',t.v as any,{shouldValidate:true})}
              style={{padding:'9px 4px',borderRadius:'10px',border:`1.5px solid ${v.sellerType===t.v?C.brand:C.slate200}`,background:v.sellerType===t.v?C.brand50:C.white,cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:'17px',marginBottom:'2px'}}>{t.i}</div>
              <div style={{fontSize:'10px',fontWeight:700,color:v.sellerType===t.v?C.brand:C.slate700}}>{t.l}</div>
            </button>
          ))}
        </div>
        {errors.sellerType && <p style={{fontSize:'11px',color:C.red,marginTop:'4px'}}>Pilih tipe bisnis</p>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <div>
          <label style={lbl()}>Skala Bisnis</label>
          <div style={{display:'flex',gap:'4px'}}>
            {[{v:'solo',l:'Solo'},{v:'small',l:'Kecil'},{v:'medium',l:'Medium'},{v:'large',l:'Besar'}].map(s=>(
              <button key={s.v} type="button" onClick={()=>setValue('businessScale',s.v as any)}
                style={{flex:1,padding:'8px 2px',borderRadius:'8px',border:`1.5px solid ${v.businessScale===s.v?C.brand:C.slate200}`,background:v.businessScale===s.v?C.brand:C.white,color:v.businessScale===s.v?C.white:C.slate600,cursor:'pointer',fontSize:'10px',fontWeight:700}}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={lbl()}>Level AI</label>
          <div style={{display:'flex',gap:'4px'}}>
            {[{v:'beginner',l:'Pemula'},{v:'intermediate',l:'Menengah'},{v:'advanced',l:'Mahir'}].map(s=>(
              <button key={s.v} type="button" onClick={()=>setValue('experience',s.v as any)}
                style={{flex:1,padding:'8px 2px',borderRadius:'8px',border:`1.5px solid ${v.experience===s.v?C.purple:C.slate200}`,background:v.experience===s.v?C.pur50:C.white,color:v.experience===s.v?C.purple:C.slate600,cursor:'pointer',fontSize:'10px',fontWeight:700}}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Nav label="Lanjut ke Niche & Produk" isFirst/>
    </form>
  )
}

// ── STEP 2 ─────────────────────────────────────────────────────
function Step2({ dv, onNext, onBack }: { dv?:Step2Data; onNext:(d:Step2Data)=>void; onBack:()=>void }) {
  const { handleSubmit, watch, setValue } = useForm({
    resolver:zodResolver(step2Schema),
    defaultValues:dv??{productType:'physical',productCount:'1-5',targetAudience:[],mainGoals:[]},
  })
  const v = watch() as any
  const tog = (f:'targetAudience'|'mainGoals', val:string) => {
    const cur=(v[f] as string[])??[]
    setValue(f,(cur.includes(val)?cur.filter((x:string)=>x!==val):[...cur,val]) as any,{shouldValidate:true})
  }
  return (
    <form onSubmit={handleSubmit(onNext as any)} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div>
        <label style={lbl()}>Kategori Produk <span style={{fontSize:'10px',fontWeight:400,color:C.slate400}}>(opsional)</span></label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {NICHES.map(n=>(
            <button key={n.v} type="button" onClick={()=>setValue('niche',v.niche===n.v?undefined:n.v as any,{shouldValidate:true})}
              style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 11px',borderRadius:'99px',border:`1.5px solid ${v.niche===n.v?C.brand:C.slate200}`,background:v.niche===n.v?C.brand50:C.white,cursor:'pointer',fontSize:'12px',fontWeight:v.niche===n.v?700:500,color:v.niche===n.v?C.brand:C.slate700}}>
              {n.i}{n.l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={lbl()}>Target Audience</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {AUDIENCES.map(a=>{
            const sel=(v.targetAudience??[]).includes(a.v)
            return (
              <button key={a.v} type="button" onClick={()=>tog('targetAudience',a.v)}
                style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 11px',borderRadius:'99px',border:`1.5px solid ${sel?C.purple:C.slate200}`,background:sel?C.pur50:C.white,cursor:'pointer',fontSize:'12px',fontWeight:sel?700:500,color:sel?C.purple:C.slate700}}>
                {a.i}{a.l}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label style={lbl()}>Tujuan Utama</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {[{v:'more-sales',l:'💰 Tambah Sales'},{v:'save-time',l:'⏱️ Hemat Waktu'},{v:'better-content',l:'✨ Konten Bagus'},{v:'viral-content',l:'🔥 Viral'},{v:'branding',l:'🏷️ Branding'},{v:'affiliate-conversion',l:'🎵 Affiliate'}].map(g=>{
            const sel=(v.mainGoals??[]).includes(g.v)
            return (
              <button key={g.v} type="button" onClick={()=>tog('mainGoals',g.v)}
                style={{padding:'6px 11px',borderRadius:'99px',border:`1.5px solid ${sel?C.amber:C.slate200}`,background:sel?C.amb50:C.white,cursor:'pointer',fontSize:'12px',fontWeight:sel?700:500,color:sel?C.amber:C.slate700}}>
                {g.l}
              </button>
            )
          })}
        </div>
      </div>
      <Nav label="Lanjut ke Platform" onBack={onBack}/>
    </form>
  )
}

// ── STEP 3 — Content Engine dengan weight logic ─────────────────
function Step3({ dv, onNext, onBack }: { dv?:Step3Data; onNext:(d:Step3Data)=>void; onBack:()=>void }) {
  const { handleSubmit, watch, setValue, formState:{errors} } = useForm({
    resolver:zodResolver(step3Schema),
    defaultValues:dv??{platforms:[],contentTypes:[],postingFrequency:'3-4/week',painPoints:[]},
  })
  const v = watch() as any

  const togPlatform = (val: string) => {
    const cur = (v.platforms as string[]) ?? []
    const updated = cur.includes(val) ? cur.filter(x=>x!==val) : [...cur, val]
    setValue('platforms', updated as any, { shouldValidate: true })
    // Auto-set primary platform
    if (updated.length === 1) setValue('primaryPlatform', updated[0] as any)
    else if (!updated.includes(v.primaryPlatform)) setValue('primaryPlatform', updated[0] as any)
    else if (updated.length === 0) setValue('primaryPlatform', undefined as any)
  }

  const togContent = (val: string) => {
    const cur = (v.contentTypes as string[]) ?? []
    const updated = cur.includes(val) ? cur.filter(x=>x!==val) : [...cur, val]
    setValue('contentTypes', updated as any, { shouldValidate: true })
  }

  const togPain = (val: string) => {
    const cur = (v.painPoints as string[]) ?? []
    setValue('painPoints', (cur.includes(val)?cur.filter(x=>x!==val):[...cur,val]) as any)
  }

  const selectedTypes   = (v.contentTypes as string[]) ?? []
  const totalWeight     = getContentWeight(selectedTypes)

  return (
    <form onSubmit={handleSubmit(onNext as any)} style={{display:'flex',flexDirection:'column',gap:'16px'}}>

      {/* Platform */}
      <div>
        <label style={lbl()}>Platform Jualan <span style={{color:C.red}}>*</span></label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'8px'}}>
          {PLATFORMS.map(p=>{
            const sel=(v.platforms??[]).includes(p.v)
            return (
              <button key={p.v} type="button" onClick={()=>togPlatform(p.v)}
                style={{display:'flex',alignItems:'center',gap:'5px',padding:'7px 12px',borderRadius:'99px',border:`1.5px solid ${sel?C.brand:C.slate200}`,background:sel?C.brand50:C.white,cursor:'pointer',fontSize:'12px',fontWeight:sel?700:500,color:sel?C.brand:C.slate700}}>
                {p.i}{p.l}
              </button>
            )
          })}
        </div>
        {errors.platforms && <p style={{fontSize:'11px',color:C.red}}>Pilih minimal 1 platform</p>}
        {(v.platforms??[]).length > 1 && (
          <div style={{background:C.slate50,padding:'10px 12px',borderRadius:'10px',border:`1px solid ${C.slate200}`}}>
            <label style={{...lbl(),marginBottom:'6px'}}>Platform Utama (AI prioritas)</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
              {(v.platforms as string[]).map(p=>{
                const meta=PLATFORMS.find(x=>x.v===p)
                const isPrimary=v.primaryPlatform===p
                return (
                  <button key={p} type="button" onClick={()=>setValue('primaryPlatform',p as any)}
                    style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'8px',border:`1.5px solid ${isPrimary?C.green:C.slate200}`,background:isPrimary?C.grn50:C.white,cursor:'pointer',fontSize:'11px',fontWeight:isPrimary?700:500,color:isPrimary?C.green:C.slate600}}>
                    {meta?.i}{meta?.l}{isPrimary&&' ⭐'}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content Engine — LOGIC: video-reels=2, feed=2, story=1, ads=1 */}
      <div>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
          <label style={{...lbl(),marginBottom:0}}>Format Content Engine <span style={{color:C.red}}>*</span></label>
          {totalWeight > 0 && (
            <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'20px',background:C.brand50,color:C.brand}}>
              Total: {totalWeight} format
            </span>
          )}
        </div>

        {/* Info box */}
        <div style={{padding:'8px 12px',background:'#FFFBEB',border:`1px solid #FCD34D`,borderRadius:'9px',fontSize:'11px',color:C.amber,marginBottom:'10px',display:'flex',gap:'6px',alignItems:'flex-start'}}>
          <Info size={13} style={{flexShrink:0,marginTop:'1px'}}/>
          <span>
            <b>Video/Reels & Feed Post</b> dihitung 2 format karena membutuhkan 2 jenis konten sekaligus.
            <b> Story & Ads</b> dihitung 1 format masing-masing. Story+Ads = 2 format total.
          </span>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
          {CONTENT_ENGINE_OPTIONS.map(opt=>{
            const sel = selectedTypes.includes(opt.v)
            return (
              <button key={opt.v} type="button" onClick={()=>togContent(opt.v)}
                style={{padding:'12px',borderRadius:'12px',border:`1.5px solid ${sel?C.purple:C.slate200}`,background:sel?C.pur50:C.white,cursor:'pointer',textAlign:'left',transition:'all .12s',position:'relative'}}>
                {/* Weight badge */}
                <div style={{position:'absolute',top:'8px',right:'8px',fontSize:'9px',fontWeight:700,padding:'2px 7px',borderRadius:'20px',background:opt.weight===2?`${C.amber}20`:`${C.green}20`,color:opt.weight===2?C.amber:C.green}}>
                  {opt.weight===2?'2 format':'1 format'}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <span style={{fontSize:'20px'}}>{opt.i}</span>
                  <span style={{fontSize:'13px',fontWeight:700,color:sel?C.purple:C.slate900}}>{opt.l}</span>
                </div>
                <div style={{fontSize:'11px',color:C.slate500,lineHeight:1.4}}>{opt.desc}</div>
                {sel && (
                  <div style={{marginTop:'6px',fontSize:'10px',color:C.purple,fontWeight:600}}>
                    ✓ {opt.note}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {errors.contentTypes && <p style={{fontSize:'11px',color:C.red,marginTop:'5px'}}>Pilih minimal 1 format konten</p>}

        {/* Summary */}
        {totalWeight > 0 && (
          <div style={{marginTop:'10px',padding:'10px 12px',background:C.grn50,border:`1px solid #BBF7D0`,borderRadius:'9px',fontSize:'12px',color:C.green}}>
            <b>Ringkasan:</b> Kamu memilih {selectedTypes.length} tipe format dengan total <b>{totalWeight} jenis konten</b> yang akan AI generate setiap produk.
          </div>
        )}
      </div>

      {/* Posting frequency */}
      <div>
        <label style={lbl()}>Frekuensi Posting</label>
        <div style={{display:'flex',gap:'4px'}}>
          {[{v:'1-2/week',l:'1-2x/mgg'},{v:'3-4/week',l:'3-4x/mgg'},{v:'daily',l:'Tiap hari'},{v:'multiple-daily',l:'2+/hari'}].map(f=>(
            <button key={f.v} type="button" onClick={()=>setValue('postingFrequency',f.v as any)}
              style={{flex:1,padding:'8px 2px',borderRadius:'8px',border:`1.5px solid ${v.postingFrequency===f.v?C.brand:C.slate200}`,background:v.postingFrequency===f.v?C.brand:C.white,color:v.postingFrequency===f.v?C.white:C.slate600,cursor:'pointer',fontSize:'10px',fontWeight:700,textAlign:'center'}}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Pain points */}
      <div>
        <label style={lbl()}>Tantangan Terbesar <span style={{fontWeight:400,color:C.slate400}}>(opsional)</span></label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {PAIN_POINTS.map(p=>{
            const sel=(v.painPoints??[]).includes(p.v)
            return (
              <button key={p.v} type="button" onClick={()=>togPain(p.v)}
                style={{padding:'6px 11px',borderRadius:'99px',border:`1.5px solid ${sel?C.red:C.slate200}`,background:sel?C.red50:C.white,cursor:'pointer',fontSize:'12px',fontWeight:sel?700:500,color:sel?C.red:C.slate700}}>
                {p.l}
              </button>
            )
          })}
        </div>
      </div>

      <Nav label="Lanjut ke Gaya Visual" onBack={onBack}/>
    </form>
  )
}

// ── STEP 4 ─────────────────────────────────────────────────────
function Step4({ dv, onNext, onBack }: { dv?:Step4Data; onNext:(d:Step4Data)=>void; onBack:()=>void }) {
  const { handleSubmit, watch, setValue } = useForm({
    resolver:zodResolver(step4Schema),
    defaultValues:dv??{visualStyle:'realistic',colorTone:'clean-white',moodTone:'trustworthy',primaryColor:'#2563EB'},
  })
  const v = watch() as any
  return (
    <form onSubmit={handleSubmit(onNext as any)} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div>
        <label style={lbl()}>Gaya Visual AI</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {VISUAL_STYLES.map(s=>(
            <button key={s.v} type="button" onClick={()=>setValue('visualStyle',s.v as any)}
              style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 11px',borderRadius:'99px',border:`1.5px solid ${v.visualStyle===s.v?C.brand:C.slate200}`,background:v.visualStyle===s.v?C.brand50:C.white,cursor:'pointer',fontSize:'12px',fontWeight:v.visualStyle===s.v?700:500,color:v.visualStyle===s.v?C.brand:C.slate700}}>
              {s.i}{s.l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={lbl()}>Color Tone</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {COLOR_TONES.map(c=>(
            <button key={c.v} type="button" onClick={()=>setValue('colorTone',c.v as any)}
              style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 11px',borderRadius:'99px',border:`1.5px solid ${v.colorTone===c.v?C.purple:C.slate200}`,background:v.colorTone===c.v?C.pur50:C.white,cursor:'pointer',fontSize:'12px',fontWeight:v.colorTone===c.v?700:500,color:v.colorTone===c.v?C.purple:C.slate700}}>
              <span style={{width:'10px',height:'10px',borderRadius:'50%',background:c.hex,border:'1px solid rgba(0,0,0,.1)',flexShrink:0}}/>
              {c.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <div>
          <label style={lbl()}>Warna Brand</label>
          <div style={{display:'flex',gap:'7px',alignItems:'center'}}>
            <input type="color" value={v.primaryColor} onChange={e=>setValue('primaryColor',e.target.value)} style={{width:'40px',height:'40px',borderRadius:'8px',border:`1px solid ${C.slate200}`,cursor:'pointer',padding:'2px'}}/>
            <input value={v.primaryColor} onChange={e=>setValue('primaryColor',e.target.value)} style={{...inp(),flex:1}} placeholder="#2563EB"/>
          </div>
        </div>
        <div>
          <label style={lbl()}>Tagline Brand</label>
          <input value={v.brandTagline??''} onChange={e=>setValue('brandTagline',e.target.value||undefined)} style={inp()} placeholder="Tagline brand kamu..."/>
        </div>
      </div>
      <Nav label="Lanjut ke Suara Brand" onBack={onBack}/>
    </form>
  )
}

// ── STEP 5 ─────────────────────────────────────────────────────
function Step5({ dv, onNext, onBack }: { dv?:Step5Data; onNext:(d:Step5Data)=>void; onBack:()=>void }) {
  const { handleSubmit, watch, setValue, register } = useForm({
    resolver:zodResolver(step5Schema),
    defaultValues:dv??{tone:'casual',language:'indonesian-casual',emoji:'moderate',ctaStyle:'medium'},
  })
  const v = watch() as any
  return (
    <form onSubmit={handleSubmit(onNext as any)} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div>
        <label style={lbl()}>Tone Komunikasi</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {TONES.map(t=>(
            <button key={t.v} type="button" onClick={()=>setValue('tone',t.v as any)}
              style={{padding:'6px 11px',borderRadius:'99px',border:`1.5px solid ${v.tone===t.v?C.brand:C.slate200}`,background:v.tone===t.v?C.brand50:C.white,cursor:'pointer',fontSize:'12px',fontWeight:v.tone===t.v?700:500,color:v.tone===t.v?C.brand:C.slate700}}>
              {t.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <div>
          <label style={lbl()}>Bahasa Output AI</label>
          <select value={v.language} onChange={e=>setValue('language',e.target.value as any)} style={{...inp(),padding:'9px 12px',height:'40px'}}>
            {[{v:'indonesian-casual',l:'Indonesia Santai'},{v:'indonesian-formal',l:'Indonesia Formal'},{v:'mixed-english',l:'Mix Indo-English'},{v:'full-english',l:'Full English'}].map(l=>(
              <option key={l.v} value={l.v}>{l.l}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl()}>CTA Style</label>
          <div style={{display:'flex',gap:'4px'}}>
            {[{v:'soft',l:'💫 Soft'},{v:'medium',l:'🎯 Medium'},{v:'aggressive',l:'🔥 Aggressive'}].map(c=>(
              <button key={c.v} type="button" onClick={()=>setValue('ctaStyle',c.v as any)}
                style={{flex:1,padding:'8px 2px',borderRadius:'8px',border:`1.5px solid ${v.ctaStyle===c.v?C.red:C.slate200}`,background:v.ctaStyle===c.v?C.red50:C.white,color:v.ctaStyle===c.v?C.red:C.slate600,cursor:'pointer',fontSize:'10px',fontWeight:700}}>
                {c.l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label style={lbl()}>Keyword Brand (pisahkan koma)</label>
        <input {...register('brandKeywords')} placeholder="Natural, Premium, Halal, Garansi" style={inp()}/>
      </div>
      <div>
        <label style={lbl()}>Kata yang Dihindari AI</label>
        <input {...register('avoidWords')} placeholder="Murah, murahan, jelek..." style={inp()}/>
      </div>
      <div>
        <label style={lbl()}>USP (Keunggulan Unik)</label>
        <textarea {...register('usp')} rows={2} style={{...inp(),resize:'vertical'}} placeholder="Apa yang membuat brand kamu berbeda?"/>
      </div>
      <Nav label="Lanjut ke Pilih Plan" onBack={onBack}/>
    </form>
  )
}

// ── STEP 6 ─────────────────────────────────────────────────────
function Step6({ dv, onNext, onBack }: { dv?:Step6Data; onNext:(d:Step6Data)=>void; onBack:()=>void }) {
  const { handleSubmit, watch, setValue } = useForm({
    resolver:zodResolver(step6Schema),
    defaultValues:dv??{planId:'free',billingCycle:'monthly'},
  })
  const v = watch() as any
  return (
    <form onSubmit={handleSubmit(onNext as any)} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'9px'}}>
        {PLANS.map(p=>(
          <button key={p.id} type="button" onClick={()=>setValue('planId',p.id as any)}
            style={{padding:'14px 11px',borderRadius:'13px',border:`2px solid ${v.planId===p.id?p.color:C.slate200}`,background:v.planId===p.id?p.bg:C.white,cursor:'pointer',textAlign:'left',position:'relative',boxShadow:v.planId===p.id?`0 0 0 1px ${p.color}`:undefined}}>
            {(p as any).badge&&<div style={{position:'absolute',top:'-9px',right:'8px',background:C.purple,color:'#fff',fontSize:'9px',fontWeight:700,padding:'2px 7px',borderRadius:'4px'}}>{(p as any).badge}</div>}
            <div style={{fontSize:'11px',fontWeight:700,color:p.color,marginBottom:'2px'}}>{p.label}</div>
            <div style={{fontSize:'18px',fontWeight:800,color:C.slate900,marginBottom:'6px',lineHeight:1}}>
              {p.price===0?'Gratis':`Rp ${(p.price/1000).toFixed(0)}K`}
              {p.price>0&&<span style={{fontSize:'9px',color:C.slate400,fontWeight:400}}>/bln</span>}
            </div>
            {p.features.map((f,i)=>(
              <div key={i} style={{fontSize:'10px',color:C.slate600,display:'flex',gap:'3px',marginBottom:'2px'}}>
                <Check size={9} color={p.color} style={{flexShrink:0,marginTop:'2px'}}/>{f}
              </div>
            ))}
          </button>
        ))}
      </div>
      <p style={{fontSize:'11px',color:C.slate400,textAlign:'center'}}>Cancel kapan saja · Tidak ada biaya tersembunyi</p>
      <Nav label="Selesai & Simpan →" onBack={onBack}/>
    </form>
  )
}

// ── STEP 7 ─────────────────────────────────────────────────────
function Step7({ saving, saveErr, saveCode, onFinish, onBack }: {
  saving:boolean; saveErr:string; saveCode:number|null; onFinish:()=>void; onBack:()=>void
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div style={{padding:'20px',background:'linear-gradient(135deg,#EFF6FF,#F5F3FF)',borderRadius:'14px',border:`1px solid ${C.brand100}`,textAlign:'center'}}>
        <div style={{fontSize:'32px',marginBottom:'6px'}}>🎉</div>
        <div style={{fontSize:'17px',fontWeight:700,color:C.slate900}}>Setup Selesai!</div>
        <div style={{fontSize:'13px',color:C.slate500,lineHeight:1.6,marginTop:'4px'}}>
          AI Memory tersimpan · Semua fitur sudah terpersonalisasi untuk brand kamu
        </div>
      </div>
      {[
        '🧠 AI Memory tersimpan di profil — semua generate otomatis pakai data brandmu',
        '✍️ Caption, gambar, video AI akan sesuai tone, niche, dan target audiensmu',
        '⚙️ Bisa diubah kapan saja di Settings → Profil',
      ].map((item, i) => (
        <div key={i} style={{display:'flex',gap:'8px',alignItems:'flex-start',fontSize:'13px',color:C.slate700}}>
          <span>{item}</span>
        </div>
      ))}
      {saveErr && (
        <div style={{padding:'13px',background:C.red50,border:`1px solid #FECACA`,borderRadius:'12px'}}>
          <div style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
            <AlertCircle size={15} color={C.red} style={{flexShrink:0,marginTop:'1px'}}/>
            <div>
              <div style={{fontSize:'13px',fontWeight:700,color:C.red,marginBottom:'4px'}}>
                Gagal Menyimpan{saveCode?` (HTTP ${saveCode})`:''}
              </div>
              <div style={{fontSize:'12px',color:'#991B1B',lineHeight:1.5}}>{saveErr}</div>
              {saveCode===401&&<div style={{marginTop:'6px',fontSize:'11px',color:'#7F1D1D',background:'rgba(0,0,0,.05)',padding:'6px 10px',borderRadius:'6px'}}>💡 Sesi habis. Buka tab baru → login → kembali klik simpan.</div>}
              {saveCode===404&&<div style={{marginTop:'6px',fontSize:'11px',color:'#7F1D1D',background:'rgba(0,0,0,.05)',padding:'6px 10px',borderRadius:'6px'}}>💡 Jalankan SQL migration 016 di Supabase SQL Editor.</div>}
            </div>
          </div>
        </div>
      )}
      <div style={{display:'flex',gap:'10px'}}>
        <button type="button" onClick={onBack} disabled={saving} style={{display:'flex',alignItems:'center',gap:'4px',padding:'13px 16px',borderRadius:'12px',border:`1.5px solid ${C.slate200}`,background:C.white,color:C.slate600,fontSize:'13px',fontWeight:600,cursor:saving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif"}}>
          <ChevronLeft size={14}/> Kembali
        </button>
        <button type="button" onClick={onFinish} disabled={saving}
          style={{flex:1,padding:'13px 20px',borderRadius:'12px',border:'none',background:saving?C.slate200:'linear-gradient(135deg,#059669,#0D9488)',color:saving?C.slate400:'#fff',fontSize:'14px',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',boxShadow:saving?'none':'0 5px 16px rgba(5,150,105,.25)'}}>
          {saving?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Menyimpan...</>:'🎉 Masuk ke Dashboard →'}
        </button>
      </div>
      {saveErr&&(
        <button type="button" onClick={onFinish} disabled={saving}
          style={{width:'100%',padding:'9px',borderRadius:'10px',border:`1px solid ${C.slate200}`,background:C.white,fontSize:'12px',fontWeight:600,color:C.slate600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>
          <RefreshCw size={12}/> Coba simpan ulang
        </button>
      )}
    </div>
  )
}