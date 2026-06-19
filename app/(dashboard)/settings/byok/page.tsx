'use client'
// app/(dashboard)/settings/byok/page.tsx
// ══════════════════════════════════════════════════════════════
// BYOK (Bring Your Own Key) — Setup Wizard
// Untuk tier Lifetime BYOK yang akan dirilis setelah 1.000 user
// UX: sangat mudah, guidance lengkap, non-technical user
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, AlertCircle, ExternalLink, Eye, EyeOff, Loader2, CheckCircle2, Copy } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
type KeyStatus = 'idle' | 'testing' | 'valid' | 'invalid'

interface ServiceConfig {
  id:        string
  name:      string
  icon:      string
  desc:      string
  required:  boolean
  color:     string
  keyPrefix: string
  getUrl:    string
  steps:     string[]
  freeQuota: string
  costNote:  string
}

// ── Services ──────────────────────────────────────────────────
const SERVICES: ServiceConfig[] = [
  {
    id: 'replicate', name: 'Replicate', icon: '🤖', required: true,
    color: '#3B82F6', keyPrefix: 'r8_',
    desc: 'Untuk generate foto produk (AI Packshot, Enhancer, Remove Background)',
    getUrl: 'https://replicate.com/account/api-tokens',
    steps: ['Buka replicate.com dan daftar akun gratis','Klik menu nama kamu di pojok kanan atas','Pilih "API Tokens" dari dropdown','Klik "Create token", beri nama "BeeSell"','Copy token yang dimulai dengan r8_...'],
    freeQuota: '$5 kredit gratis saat daftar (~5.000 foto)',
    costNote: '~$0.001–0.003 per foto (Rp15–45/foto)',
  },
  {
    id: 'anthropic', name: 'Anthropic (Claude)', icon: '🧠', required: true,
    color: '#D97706', keyPrefix: 'sk-ant-',
    desc: 'Untuk Caption AI, Hook Generator, Campaign Builder, AI Script',
    getUrl: 'https://console.anthropic.com/settings/keys',
    steps: ['Buka console.anthropic.com dan daftar akun','Verifikasi email kamu','Di sidebar, klik "API Keys"','Klik "Create Key", beri nama "BeeSell"','Copy key yang dimulai dengan sk-ant-...'],
    freeQuota: '$5 free credit saat pertama kali',
    costNote: '~$0.003 per 1.000 kata (caption = hampir nol)',
  },
  {
    id: 'elevenlabs', name: 'ElevenLabs', icon: '🎙️', required: false,
    color: '#7C3AED', keyPrefix: '',
    desc: 'Untuk TTS (Text-to-Speech) di UGC Video dan Talking Head',
    getUrl: 'https://elevenlabs.io/app/settings/api-keys',
    steps: ['Buka elevenlabs.io dan daftar akun gratis','Klik ikon profil di pojok kanan atas','Pilih "Profile & API Key"','Copy API key yang tampil di halaman tersebut'],
    freeQuota: '10.000 karakter/bulan gratis (~20 video pendek)',
    costNote: '~$0.0003/karakter untuk plan berbayar',
  },
  {
    id: 'openai', name: 'OpenAI (Whisper)', icon: '📝', required: false,
    color: '#10A37F', keyPrefix: 'sk-',
    desc: 'Untuk subtitle otomatis (Whisper transcription)',
    getUrl: 'https://platform.openai.com/api-keys',
    steps: ['Buka platform.openai.com dan login/daftar','Di sidebar, klik "API Keys"','Klik "+ Create new secret key"','Beri nama "BeeSell Whisper"','Copy key — hanya ditampilkan sekali!'],
    freeQuota: '$5 free credit (expired 3 bulan)',
    costNote: '~$0.006/menit audio (~Rp93/menit)',
  },
]

// ── Token ─────────────────────────────────────────────────────
const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  surface:'#FFFFFF', bg:'#F9FAFB', border:'#E5E7EB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5',
  blue:'#3B82F6', blueLt:'#EFF6FF',
  red:'#EF4444', redLt:'#FEF2F2',
  sh:'0 1px 3px rgba(0,0,0,.06)', sm:'0 4px 16px rgba(0,0,0,.08)',
}

export default function BYOKWizardPage() {
  const [step,         setStep]         = useState(1)  // 1=intro, 2=replicate, 3=anthropic, 4=optional, 5=test, 6=done
  const [keys,         setKeys]         = useState<Record<string,string>>({})
  const [show,         setShow]         = useState<Record<string,boolean>>({})
  const [status,       setStatus]       = useState<Record<string,KeyStatus>>({})
  const [saving,       setSaving]       = useState(false)
  const [copied,       setCopied]       = useState('')

  const serviceSteps = [null, null, SERVICES[0], SERVICES[1], null, null, null]
  const TOTAL_STEPS  = 6

  const testKey = useCallback(async (svcId: string) => {
    const key = keys[svcId]
    if (!key?.trim()) return
    setStatus(p => ({ ...p, [svcId]: 'testing' }))
    try {
      const res = await fetch('/api/byok/test', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ service: svcId, key: key.trim() }),
      })
      const ok = (await res.json()).valid === true
      setStatus(p => ({ ...p, [svcId]: ok ? 'valid' : 'invalid' }))
    } catch {
      setStatus(p => ({ ...p, [svcId]: 'invalid' }))
    }
  }, [keys])

  const saveKeys = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('/api/byok/save', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ keys }),
      })
      setStep(6)
    } catch {
      /* show error */
    } finally {
      setSaving(false)
    }
  }, [keys])

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div style={{ maxWidth:'680px', margin:'0 auto', fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink, padding:'32px 24px 80px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box }
        input:focus { outline:none; border-color:${C.amber} !important; box-shadow:0 0 0 3px ${C.amberLt} }
        input::placeholder { color:${C.inkDim} }
        details summary { list-style:none }
        details summary::-webkit-details-marker { display:none }
      `}</style>

      {/* ── Back link ───────────────────────────────────────── */}
      <Link href="/settings" style={{ display:'inline-flex', alignItems:'center', gap:6, color:C.inkMuted, textDecoration:'none', fontSize:13, marginBottom:28 }}>
        <ArrowLeft size={14}/> Kembali ke Settings
      </Link>

      {/* ── Progress bar ────────────────────────────────────── */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.inkDim, marginBottom:8 }}>
          <span>Langkah {Math.min(step, TOTAL_STEPS)} dari {TOTAL_STEPS}</span>
          <span style={{ color:C.amber, fontWeight:700 }}>{Math.round((Math.min(step,TOTAL_STEPS)/TOTAL_STEPS)*100)}%</span>
        </div>
        <div style={{ height:6, background:C.border, borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(Math.min(step,TOTAL_STEPS)/TOTAL_STEPS)*100}%`, background:`linear-gradient(90deg,${C.amber},${C.amberDk})`, borderRadius:3, transition:'width .4s ease' }}/>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          STEP 1: INTRO
      ══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🔑</div>
            <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.02em', marginBottom:12 }}>Setup API Key Kamu</h1>
            <p style={{ fontSize:15, color:C.inkMuted, lineHeight:1.7, maxWidth:480, margin:'0 auto' }}>
              Dengan plan BYOK (Bring Your Own Key), kamu pakai API key milikmu sendiri.
              BeeSell menjadi software-nya, kamu yang tanggung biaya generate.
            </p>
          </div>

          {/* Kenapa BYOK */}
          <div style={{ background:C.amberXlt, border:`1px solid ${C.amber}30`, borderRadius:14, padding:'24px', marginBottom:24 }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Apa keuntungan BYOK?</h3>
            {[
              ['💰 Bayar sekali seumur hidup', 'Akses semua tools BeeSell tanpa langganan bulanan'],
              ['📊 Kontrol penuh', 'Lihat sendiri berapa yang kamu habiskan per gambar/video'],
              ['🔒 Data privasimu sendiri', 'API key di akun kamu — kami tidak menyimpan key final di server'],
              ['⚡ Biaya lebih rendah', 'Langsung ke provider tanpa markup — Rp15-45 per foto'],
            ].map(([t,d])=>(
              <div key={t} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{t.split(' ')[0]}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{t.substring(3)}</div>
                  <div style={{ fontSize:13, color:C.inkMuted }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* What you need */}
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px', marginBottom:32 }}>
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Yang kamu butuhkan:</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SERVICES.map(s=>(
                <div key={s.id} style={{ display:'flex', gap:10, alignItems:'center', fontSize:13 }}>
                  <span>{s.icon}</span>
                  <span style={{ fontWeight:600 }}>{s.name}</span>
                  {s.required
                    ? <span style={{ fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:99, background:`${s.color}15`, color:s.color }}>WAJIB</span>
                    : <span style={{ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:99, background:C.bg, color:C.inkDim, border:`1px solid ${C.border}` }}>Opsional</span>}
                  <span style={{ color:C.inkMuted, marginLeft:'auto', fontSize:12 }}>{s.freeQuota}</span>
                </div>
              ))}
            </div>
          </div>

            <div style={{
              display:'flex',
              flexDirection:'column',
              rowGap:'10px'
            }}>
            <button type="button" onClick={() => setStep(2)}
              style={{ padding:'14px', borderRadius:11, border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 6px 20px ${C.amber}35`, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              Mulai Setup <ArrowRight size={16} />
            </button>
            <Link href="/billing" style={{ padding:'13px', borderRadius:11, border:`1.5px solid ${C.border}`, color:C.inkMuted, fontSize:14, fontWeight:600, textAlign:'center', textDecoration:'none' }}>
              Lebih suka langganan bulanan? Lihat pricing →
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 2 & 3: SERVICE KEY SETUP
      ══════════════════════════════════════════════════════ */}
      {(step === 2 || step === 3) && (() => {
        const svc = SERVICES[step - 2]
        const keyVal = keys[svc.id] ?? ''
        const sts = status[svc.id] ?? 'idle'
        return (
          <div>
            {/* Service header */}
            <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:28 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${svc.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{svc.icon}</div>
              <div>
                <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:4 }}>Setup {svc.name}</h2>
                <p style={{ fontSize:13, color:C.inkMuted }}>{svc.desc}</p>
              </div>
            </div>

            {/* Steps how to get key */}
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px', marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ fontSize:14, fontWeight:700 }}>Cara mendapatkan API key {svc.name}:</h3>
                <a href={svc.getUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:svc.color, textDecoration:'none' }}>
                  Buka {svc.name} <ExternalLink size={12}/>
                </a>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {svc.steps.map((s,i)=>(
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', fontSize:13 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:`${svc.color}15`, color:svc.color, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</div>
                    <span style={{ color:C.inkSub, lineHeight:1.5, paddingTop:2 }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, padding:'10px 12px', borderRadius:8, background:`${svc.color}08`, border:`1px solid ${svc.color}20`, fontSize:12, color:C.inkMuted }}>
                💡 {svc.costNote} · {svc.freeQuota}
              </div>
            </div>

            {/* Key input */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:700, display:'block', marginBottom:8 }}>
                Paste API key {svc.name} di sini:
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={show[svc.id] ? 'text' : 'password'}
                  value={keyVal}
                  onChange={e => { setKeys(p=>({...p,[svc.id]:e.target.value})); setStatus(p=>({...p,[svc.id]:'idle'})) }}
                  placeholder={`${svc.keyPrefix}...`}
                  style={{ width:'100%', padding:'12px 44px 12px 14px', borderRadius:10, border:`1.5px solid ${sts==='valid'?C.green:sts==='invalid'?C.red:C.border}`, fontSize:13, fontFamily:'monospace', background:sts==='valid'?C.greenLt:sts==='invalid'?'#FEF2F2':C.surface, transition:'all .15s' }}
                />
                <button type="button" onClick={()=>setShow(p=>({...p,[svc.id]:!p[svc.id]}))}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.inkDim }}>
                  {show[svc.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {sts === 'valid'   && <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:8, fontSize:12, color:C.green }}><CheckCircle2 size={13}/> API key valid dan terhubung!</div>}
              {sts === 'invalid' && <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:8, fontSize:12, color:C.red }}><AlertCircle size={13}/> Key tidak valid. Pastikan kamu copy seluruh key tanpa spasi di awal/akhir.</div>}
            </div>

            {/* Test button */}
            <button type="button" onClick={()=>testKey(svc.id)} disabled={!keyVal.trim()||sts==='testing'}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bg, color:C.inkSub, fontSize:14, fontWeight:600, cursor:keyVal.trim()?'pointer':'not-allowed', fontFamily:'inherit', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:keyVal.trim()?1:.5 }}>
              {sts==='testing' ? <><Loader2 size={15} style={{animation:'spin .8s linear infinite'}}/> Testing key...</> : '🔍 Test Koneksi API'}
            </button>

            {/* Nav */}
            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={()=>setStep(step-1)}
                style={{ padding:'12px 20px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                <ArrowLeft size={14}/> Kembali
              </button>
              <button type="button" onClick={()=>setStep(step+1)} disabled={!keyVal.trim()||sts==='invalid'}
                style={{ flex:1, padding:'12px', borderRadius:10, border:'none', background:sts==='valid'?`linear-gradient(135deg,${C.green},#047857)`:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:14, fontWeight:700, cursor:keyVal.trim()&&sts!=='invalid'?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:!keyVal.trim()||sts==='invalid'?.5:1 }}>
                {sts==='valid'?'✅ Lanjut':'Lanjut'} <ArrowRight size={15}/>
              </button>
            </div>
            <p style={{ textAlign:'center', fontSize:12, color:C.inkDim, marginTop:14 }}>API key disimpan terenkripsi dan hanya digunakan untuk generate konten kamu.</p>
          </div>
        )
      })()}

      {/* ══════════════════════════════════════════════════════
          STEP 4: OPTIONAL SERVICES
      ══════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.02em', marginBottom:8 }}>Services Opsional</h2>
          <p style={{ fontSize:14, color:C.inkMuted, marginBottom:28 }}>Tambahkan untuk mengaktifkan fitur video dan subtitle. Bisa dilewati dan ditambahkan nanti.</p>
          {SERVICES.slice(2).map(svc=>(
            <div key={svc.id} style={{ background:C.bg, border:`1px solid ${keys[svc.id]?svc.color:C.border}20`, borderRadius:13, padding:'20px', marginBottom:14 }}>
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:24 }}>{svc.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{svc.name}</div>
                  <div style={{ fontSize:12, color:C.inkMuted }}>{svc.desc}</div>
                </div>
                {status[svc.id]==='valid' && <CheckCircle2 size={18} color={C.green}/>}
              </div>
              <details style={{ marginBottom:12 }}>
                <summary style={{ fontSize:12, fontWeight:600, color:svc.color, cursor:'pointer' }}>📋 Cara mendapat key {svc.name} →</summary>
                <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                  {svc.steps.map((s,i)=>(
                    <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:C.inkSub }}>
                      <span style={{ flexShrink:0, color:svc.color, fontWeight:700 }}>{i+1}.</span>{s}
                    </div>
                  ))}
                  <a href={svc.getUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:6, fontSize:12, color:svc.color, fontWeight:600 }}>Buka {svc.name} <ExternalLink size={11}/></a>
                </div>
              </details>
              <div style={{ position:'relative' }}>
                <input type={show[svc.id]?'text':'password'} value={keys[svc.id]??''} placeholder={`${svc.keyPrefix}API key ${svc.name}...`}
                  onChange={e=>{setKeys(p=>({...p,[svc.id]:e.target.value}));setStatus(p=>({...p,[svc.id]:'idle'}))}}
                  style={{ width:'100%', padding:'10px 40px 10px 12px', borderRadius:8, border:`1.5px solid ${status[svc.id]==='valid'?C.green:C.border}`, fontSize:13, fontFamily:'monospace', background:status[svc.id]==='valid'?C.greenLt:C.surface }}/>
                <button type="button" onClick={()=>setShow(p=>({...p,[svc.id]:!p[svc.id]}))} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.inkDim }}><Eye size={14}/></button>
              </div>
              {keys[svc.id]?.trim() && status[svc.id]!=='valid' && (
                <button type="button" onClick={()=>testKey(svc.id)}
                  style={{ marginTop:8, padding:'7px 14px', borderRadius:7, border:`1px solid ${C.border}`, background:C.surface, fontSize:12, fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                  {status[svc.id]==='testing'?<Loader2 size={12} style={{animation:'spin .8s linear infinite'}}/>:'🔍'} Test Key
                </button>
              )}
            </div>
          ))}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={()=>setStep(3)} style={{ padding:'12px 20px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}><ArrowLeft size={14}/> Kembali</button>
            <button onClick={()=>setStep(5)} style={{ flex:1, padding:'12px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              Lanjut ke Test Final <ArrowRight size={15}/>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 5: TEST ALL + SAVE
      ══════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Konfirmasi & Simpan</h2>
          <p style={{ fontSize:14, color:C.inkMuted, marginBottom:28 }}>Review semua key yang sudah kamu setup, lalu simpan untuk mulai pakai BeeSell BYOK.</p>
          {SERVICES.map(svc=>(
            <div key={svc.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'14px 16px', background:C.bg, borderRadius:10, border:`1px solid ${C.border}`, marginBottom:10 }}>
              <span style={{ fontSize:20 }}>{svc.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{svc.name}</div>
                <div style={{ fontSize:12, color:C.inkDim, fontFamily:'monospace' }}>
                  {keys[svc.id] ? `${keys[svc.id].substring(0,8)}${'•'.repeat(12)}` : 'Tidak diisi'}
                </div>
              </div>
              {keys[svc.id]
                ? (status[svc.id]==='valid'
                    ? <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:C.green, fontWeight:700 }}><CheckCircle2 size={14}/>Valid</div>
                    : <div style={{ fontSize:12, color:C.amber }}>Belum ditest</div>)
                : <div style={{ fontSize:12, color:svc.required?C.red:C.inkDim }}>{svc.required?'WAJIB — belum diisi':'Opsional'}</div>}
            </div>
          ))}
          <div style={{ padding:'14px 16px', borderRadius:10, background:C.bg, border:`1px solid ${C.border}`, fontSize:13, color:C.inkMuted, marginBottom:28, marginTop:4, lineHeight:1.7 }}>
            🔒 Key disimpan terenkripsi (AES-256) di server kami. Kami tidak bisa membaca key aslimu — hanya digunakan untuk melakukan API call atas namamu.
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setStep(4)} style={{ padding:'12px 20px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.inkMuted, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}><ArrowLeft size={14}/> Kembali</button>
            <button onClick={saveKeys} disabled={saving||!keys['replicate']||!keys['anthropic']}
              style={{ flex:1, padding:'14px', borderRadius:10, border:'none', background:saving?C.inkDim:`linear-gradient(135deg,${C.green},#047857)`, color:'#fff', fontSize:14, fontWeight:700, cursor:(!keys['replicate']||!keys['anthropic'])?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:(!keys['replicate']||!keys['anthropic'])?.5:1 }}>
              {saving?<><Loader2 size={15} style={{animation:'spin .8s linear infinite'}}/>Menyimpan...</>:<>✅ Simpan & Aktifkan BYOK</>}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 6: DONE
      ══════════════════════════════════════════════════════ */}
      {step === 6 && (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:20 }}>🎉</div>
          <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.02em', marginBottom:12 }}>BYOK Berhasil Diaktifkan!</h2>
          <p style={{ fontSize:15, color:C.inkMuted, lineHeight:1.7, maxWidth:440, margin:'0 auto 32px' }}>
            Semua API key kamu sudah tersimpan. BeeSell AI siap digunakan dengan akun kamu.
            Nikmati akses penuh ke semua tools.
          </p>
          <div style={{ background:C.greenLt, border:`1px solid ${C.green}25`, borderRadius:14, padding:'24px', textAlign:'left', marginBottom:28 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.green, marginBottom:12 }}>Apa selanjutnya?</h3>
            {[
              ['🎨 Coba AI Packshot', 'Upload foto produk pertamamu', '/studio/image/packshot'],
              ['✍️ Generate Caption', 'Buat caption gratis tanpa limit', '/quick-tools?tool=caption'],
              ['🎭 Setup Avatar Presenter', 'Pilih avatar untuk video produkmu', '/studio/video/talking-head'],
            ].map(([icon,desc,href])=>(
              <Link key={icon} href={href} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px', borderRadius:9, background:'#fff', marginBottom:8, textDecoration:'none' }}>
                <span style={{ fontSize:22 }}>{icon.split(' ')[0]}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:C.ink }}>{icon.substring(3)}</div>
                  <div style={{ fontSize:12, color:C.inkMuted }}>{desc}</div>
                </div>
                <ArrowRight size={14} color={C.green} style={{ marginLeft:'auto' }}/>
              </Link>
            ))}
          </div>
          <Link href="/studio" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 28px', borderRadius:11, background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:`0 6px 20px ${C.amber}35` }}>
            Buka AI Studio <ArrowRight size={16}/>
          </Link>
        </div>
      )}

      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}