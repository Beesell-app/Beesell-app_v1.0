'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:'#FFFFFF', bg:'#FAFAFA', bgAlt:'#F3F4F6', border:'#E5E7EB', borderHi:'#D1D5DB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#10B981', greenLt:'#ECFDF5', blue:'#3B82F6', purple:'#8B5CF6', red:'#EF4444', redLt:'#FEF2F2',
  sh:'0 1px 3px rgba(0,0,0,.06)', sm:'0 4px 16px rgba(0,0,0,.07)', sa:'0 8px 24px rgba(245,158,11,.25)',
}

type Row = {
  smart_link_id:string; slug:string; title:string|null; product_name:string|null
  content_id:string|null; platform:string|null; campaign:string|null
  destination:string; is_active:boolean; created_at:string
  clicks:number; add_to_cart:number; orders:number; gmv_rp:number
}

const num  = (n:number)=> (n??0).toLocaleString('id-ID')
const pct  = (x:number)=> `${(x*100).toFixed(1)}%`
const rpShort = (n:number)=> n>=1e9?`Rp ${(n/1e9).toFixed(1)} M`:n>=1e6?`Rp ${(n/1e6).toFixed(1)} jt`:n>=1e3?`Rp ${(n/1e3).toFixed(0)} rb`:`Rp ${n||0}`

const PLATFORMS = [
  { id:'tiktok',    label:'TikTok',    color:'#000000' },
  { id:'shopee',    label:'Shopee',    color:'#EE4D2D' },
  { id:'instagram', label:'Instagram', color:'#C13584' },
  { id:'lainnya',   label:'Lainnya',   color:C.inkMuted },
]

export default function SmartLinksPage() {
  const [rows, setRows]       = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string|null>(null)
  const [sort, setSort]       = useState<'gmv'|'clicks'|'cvr'>('gmv')

  // create form
  const [showForm, setShowForm] = useState(false)
  const [dest, setDest]         = useState('')
  const [title, setTitle]       = useState('')
  const [product, setProduct]   = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [creating, setCreating] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<string|null>(null)
  const [copied, setCopied]     = useState<string|null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/smart-links/funnel')
      const data = await res.json()
      if (data.success) setRows(data.rows)
      else setError(data.error ?? 'Gagal memuat data')
    } catch (e:any) { setError(e?.message ?? 'Koneksi bermasalah') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const createLink = async () => {
    if (!/^https?:\/\//.test(dest)) { setError('Destination URL harus diawali http(s)://'); return }
    setCreating(true); setError(null); setCreatedUrl(null)
    try {
      const res = await fetch('/api/smart-links', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ destination:dest, title, productName:product, platform }),
      })
      const data = await res.json()
      if (data.success) {
        setCreatedUrl(data.link.shortUrl)
        setDest(''); setTitle(''); setProduct('')
        load()
      } else setError(data.error ?? 'Gagal membuat link')
    } catch (e:any) { setError(e?.message ?? 'Koneksi bermasalah') }
    finally { setCreating(false) }
  }

  const copy = (txt:string) => { navigator.clipboard.writeText(txt); setCopied(txt); setTimeout(()=>setCopied(null), 1500) }

  // totals
  const t = useMemo(() => rows.reduce((a,r)=>({
    clicks:a.clicks+r.clicks, atc:a.atc+r.add_to_cart, orders:a.orders+r.orders, gmv:a.gmv+r.gmv_rp,
  }), { clicks:0, atc:0, orders:0, gmv:0 }), [rows])
  const cvr = t.clicks ? t.orders/t.clicks : 0
  const aov = t.orders ? t.gmv/t.orders : 0

  const sorted = useMemo(() => [...rows].sort((a,b)=>{
    if (sort==='clicks') return b.clicks-a.clicks
    if (sort==='cvr')    return (b.clicks? b.orders/b.clicks:0)-(a.clicks? a.orders/a.clicks:0)
    return b.gmv_rp-a.gmv_rp
  }), [rows, sort])

  return (
    <div style={{ minHeight:'100%', background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif", color:C.ink }}>
      {/* Header */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'18px 24px', display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:C.amberXlt, border:`1px solid ${C.amber}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>🔗</div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:'16px', fontWeight:800 }}>Smart Links — Attribution</div>
          <div style={{ fontSize:'12px', color:C.inkMuted }}>Lacak perjalanan konten → klik → keranjang → order → GMV</div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)}
          style={{ padding:'10px 18px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', boxShadow:C.sa }}>
          {showForm ? '× Tutup' : '+ Buat Smart Link'}
        </button>
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'24px' }}>

        {/* Create form */}
        {showForm && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:'16px', boxShadow:C.sh, padding:'18px', marginBottom:'20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap:'12px' }}>
              <Field label="Destination URL (wajib)" value={dest} onChange={setDest} ph="https://shopee.co.id/product/... (idealnya link affiliate)" />
              <Field label="Nama Internal" value={title} onChange={setTitle} ph="Serum Vit C - bio TikTok" />
              <Field label="Nama Produk" value={product} onChange={setProduct} ph="BrightSkin Serum Vit C" />
              <div style={{ minWidth:0 }}>
                <label style={{ fontSize:'12px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>Platform</label>
                <select value={platform} onChange={e=>setPlatform(e.target.value)}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:`2px solid ${C.border}`, fontSize:'13px', background:C.white, fontFamily:'inherit', color:C.ink, outline:'none' }}>
                  {PLATFORMS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginTop:'14px', flexWrap:'wrap' }}>
              <button onClick={createLink} disabled={creating}
                style={{ padding:'12px 22px', borderRadius:'10px', border:'none', background:creating?C.inkDim:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'14px', fontWeight:800, cursor:creating?'not-allowed':'pointer' }}>
                {creating ? 'Membuat...' : 'Buat Link'}
              </button>
              {createdUrl && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'10px', background:C.greenLt, border:`1px solid ${C.green}40`, fontSize:'13px', fontWeight:700, color:C.green }}>
                  ✓ {createdUrl}
                  <button onClick={()=>copy(createdUrl)} style={{ border:'none', background:'none', color:C.amberDk, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                    {copied===createdUrl?'Tersalin!':'Salin'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding:'12px 16px', borderRadius:'12px', background:C.redLt, border:`1px solid ${C.red}30`, color:C.red, fontSize:'13px', fontWeight:600, marginBottom:'16px' }}>{error}</div>
        )}

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(150px,100%),1fr))', gap:'12px', marginBottom:'20px' }}>
          <Kpi label="Total Klik"   value={num(t.clicks)} icon="👆" color={C.blue} />
          <Kpi label="Add to Cart"  value={num(t.atc)}    icon="🛒" color={C.amber} sub={t.clicks?`${pct(t.atc/t.clicks)} dari klik`:undefined} />
          <Kpi label="Order"        value={num(t.orders)} icon="📦" color={C.purple} sub={t.atc?`${pct(t.orders/t.atc)} dari ATC`:undefined} />
          <Kpi label="GMV"          value={rpShort(t.gmv)} icon="💰" color={C.green} />
          <Kpi label="CVR (klik→order)" value={pct(cvr)} icon="🎯" color={C.amberDk} sub={`AOV ${rpShort(aov)}`} />
        </div>

        {/* Sort */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
          <span style={{ fontSize:'12px', fontWeight:700, color:C.inkMuted }}>Urutkan:</span>
          {([['gmv','GMV'],['clicks','Klik'],['cvr','CVR']] as const).map(([k,l])=>(
            <button key={k} onClick={()=>setSort(k)}
              style={{ padding:'6px 14px', borderRadius:'99px', border:`1.5px solid ${sort===k?C.amber:C.border}`, background:sort===k?`${C.amber}12`:C.white, color:sort===k?C.amberDk:C.inkMuted, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
          ))}
          <button onClick={load} style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:'99px', border:`1.5px solid ${C.border}`, background:C.white, color:C.inkSub, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>↻ Refresh</button>
        </div>

        {/* Link funnel cards */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'48px', color:C.inkMuted, fontSize:'14px' }}>Memuat data funnel...</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 24px', background:C.white, borderRadius:'16px', border:`1px dashed ${C.borderHi}` }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🔗</div>
            <div style={{ fontSize:'15px', fontWeight:800, marginBottom:'6px' }}>Belum ada Smart Link</div>
            <div style={{ fontSize:'13px', color:C.inkMuted }}>Buat link pertamamu, pasang di bio/caption TikTok, lalu data funnel akan muncul di sini.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {sorted.map(r => <LinkCard key={r.smart_link_id} r={r} origin={origin} onCopy={copy} copied={copied} />)}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        input::placeholder { color:#9CA3AF }
      `}</style>
    </div>
  )
}

// ── Sub-komponen ──────────────────────────────────────────────
function Field({ label, value, onChange, ph }:{ label:string; value:string; onChange:(v:string)=>void; ph:string }) {
  return (
    <div style={{ minWidth:0 }}>
      <label style={{ fontSize:'12px', fontWeight:700, color:C.inkSub, display:'block', marginBottom:'6px' }}>{label}</label>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={ph}
        style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:`2px solid ${C.border}`, fontSize:'13px', color:C.ink, outline:'none', background:C.white, fontFamily:'inherit' }}
        onFocus={e=>{(e.target as HTMLElement).style.borderColor=C.amber}}
        onBlur={e=>{(e.target as HTMLElement).style.borderColor=C.border}} />
    </div>
  )
}

function Kpi({ label, value, icon, color, sub }:{ label:string; value:string; icon:string; color:string; sub?:string }) {
  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:'14px', padding:'16px', boxShadow:C.sh, minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
        <span style={{ fontSize:'18px' }}>{icon}</span>
        <span style={{ fontSize:'11px', fontWeight:700, color:C.inkMuted, textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize:'22px', fontWeight:900, color, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:'11px', color:C.inkDim, fontWeight:600, marginTop:'4px' }}>{sub}</div>}
    </div>
  )
}

function LinkCard({ r, origin, onCopy, copied }:{ r:Row; origin:string; onCopy:(t:string)=>void; copied:string|null }) {
  const shortUrl = `${origin}/l/${r.slug}`
  const atcRate   = r.clicks ? r.add_to_cart/r.clicks : 0
  const orderRate = r.add_to_cart ? r.orders/r.add_to_cart : 0
  const cvr       = r.clicks ? r.orders/r.clicks : 0
  const aov       = r.orders ? r.gmv_rp/r.orders : 0
  const max = Math.max(r.clicks, 1)
  const p = PLATFORMS.find(x=>x.id===r.platform)

  const Bar = ({ label, val, w, color }:{ label:string; val:number; w:number; color:string }) => (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <div style={{ width:'58px', fontSize:'11px', fontWeight:700, color:C.inkMuted, flexShrink:0 }}>{label}</div>
      <div style={{ flex:1, height:'22px', background:C.bgAlt, borderRadius:'6px', overflow:'hidden', minWidth:0 }}>
        <div style={{ height:'100%', width:`${Math.max(w*100,2)}%`, background:`linear-gradient(90deg,${color},${color}cc)`, borderRadius:'6px', transition:'width .4s' }}/>
      </div>
      <div style={{ width:'64px', textAlign:'right', fontSize:'13px', fontWeight:800, color:C.ink, flexShrink:0 }}>{num(val)}</div>
    </div>
  )

  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:'16px', boxShadow:C.sh, padding:'18px' }}>
      {/* head */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', marginBottom:'14px', flexWrap:'wrap' }}>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'15px', fontWeight:800 }}>{r.title || r.product_name || r.slug}</span>
            {p && <span style={{ fontSize:'10px', fontWeight:800, padding:'3px 8px', borderRadius:'6px', background:`${p.color}18`, color:p.color }}>{p.label}</span>}
            {!r.is_active && <span style={{ fontSize:'10px', fontWeight:800, padding:'3px 8px', borderRadius:'6px', background:C.bgAlt, color:C.inkMuted }}>NONAKTIF</span>}
          </div>
          <button onClick={()=>onCopy(shortUrl)} style={{ marginTop:'4px', fontSize:'12px', color:C.amberDk, fontWeight:700, background:'none', border:'none', padding:0, cursor:'pointer', fontFamily:'inherit' }}>
            {copied===shortUrl ? '✓ Link tersalin' : `${origin.replace(/^https?:\/\//,'')}/l/${r.slug} · salin`}
          </button>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:'18px', fontWeight:900, color:C.green }}>{rpShort(r.gmv_rp)}</div>
          <div style={{ fontSize:'10px', color:C.inkMuted, fontWeight:700 }}>GMV · CVR {pct(cvr)}</div>
        </div>
      </div>

      {/* funnel */}
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        <Bar label="Klik"  val={r.clicks}      w={r.clicks/max}      color={C.blue} />
        <div style={{ fontSize:'10px', color:C.inkDim, fontWeight:700, paddingLeft:'68px' }}>↓ {pct(atcRate)} klik → keranjang</div>
        <Bar label="ATC"   val={r.add_to_cart} w={r.add_to_cart/max} color={C.amber} />
        <div style={{ fontSize:'10px', color:C.inkDim, fontWeight:700, paddingLeft:'68px' }}>↓ {pct(orderRate)} keranjang → order</div>
        <Bar label="Order" val={r.orders}      w={r.orders/max}      color={C.purple} />
      </div>

      {/* footer metrics */}
      <div style={{ display:'flex', gap:'16px', marginTop:'14px', paddingTop:'12px', borderTop:`1px solid ${C.border}`, flexWrap:'wrap', fontSize:'11px', fontWeight:700, color:C.inkMuted }}>
        <span>AOV: <b style={{ color:C.ink }}>{rpShort(aov)}</b></span>
        <span>Konversi total: <b style={{ color:C.ink }}>{pct(cvr)}</b></span>
        {r.campaign && <span>Campaign: <b style={{ color:C.ink }}>{r.campaign}</b></span>}
      </div>
    </div>
  )
}