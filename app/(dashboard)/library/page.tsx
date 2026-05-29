'use client'
// apps/web-app/app/(dashboard)/library/page.tsx
// Asset Library — semua konten tersimpan

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Image as ImageIcon, Video, FileText, Copy, Download, Trash2, Check, Filter } from 'lucide-react'

const C = {
  brand:'#2563EB', brand50:'#EFF6FF', purple:'#7C3AED', pur50:'#F5F3FF',
  green:'#059669', grn50:'#ECFDF5', amber:'#D97706',
  red:'#DC2626', red50:'#FEF2F2',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569', slate500:'#64748B',
  slate400:'#94A3B8', slate300:'#CBD5E1', slate200:'#E2E8F0',
  slate100:'#F1F5F9', slate50:'#F8FAFC', white:'#fff',
}

const TYPE_ICON: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  caption:  { icon:<FileText size={15}/>,  bg:C.brand50, color:C.brand },
  image:    { icon:<ImageIcon size={15}/>, bg:C.pur50,   color:C.purple },
  video:    { icon:<Video size={15}/>,     bg:'#FDF2F8',  color:'#DB2777' },
}

const FILTERS = ['Semua', 'Caption', 'Gambar', 'Video']

async function fetchLibrary() {
  const res = await fetch('/api/library')
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export default function LibraryPage() {
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [copiedId, setCopiedId] = useState<string|null>(null)

  const { data, isLoading } = useQuery({ queryKey:['library'], queryFn: fetchLibrary, staleTime: 2*60_000 })
  const contents = data?.contents ?? []

  const filtered = contents.filter((c: any) => {
    if (activeFilter === 'Caption') return c.type === 'caption'
    if (activeFilter === 'Gambar')  return c.type === 'image'
    if (activeFilter === 'Video')   return c.type === 'video'
    return true
  })

  const copy = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) } catch {}
  }

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:'clamp(20px,3.5vw,26px)', fontWeight:600, color:C.slate900, letterSpacing:'-0.02em', marginBottom:'3px' }}>Asset Library 📂</h1>
          <p style={{ fontSize:'13px', color:C.slate500 }}>{contents.length} konten tersimpan</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Link href="/quick-tools" style={{ padding:'8px 16px', borderRadius:'10px', background:'linear-gradient(135deg, #2563EB, #7C3AED)', color:'white', textDecoration:'none', fontSize:'13px', fontWeight:700, display:'flex', alignItems:'center', gap:'5px' }}>
            <Sparkles size={13}/> Buat Baru
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'16px' }}>
        {FILTERS.map(f => (
          <button key={f} type="button" onClick={() => setActiveFilter(f)}
            style={{ padding:'6px 14px', borderRadius:'99px', border:`1.5px solid ${activeFilter===f ? C.brand : C.slate200}`, background: activeFilter===f ? C.brand50 : C.white, cursor:'pointer', fontSize:'12px', fontWeight:700, color: activeFilter===f ? C.brand : C.slate600, transition:'all .12s' }}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,280px),1fr))', gap:'10px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height:'120px', borderRadius:'12px', background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite' }}/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', borderRadius:'16px', border:`2px dashed ${C.slate200}`, background:C.slate50 }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
          <div style={{ fontSize:'15px', fontWeight:700, color:C.slate900, marginBottom:'4px' }}>Library masih kosong</div>
          <div style={{ fontSize:'13px', color:C.slate500, marginBottom:'16px' }}>Mulai buat konten dan simpan ke library</div>
          <Link href="/quick-tools" style={{ padding:'9px 20px', background:`linear-gradient(135deg, ${C.brand}, #1D4ED8)`, color:'white', textDecoration:'none', borderRadius:'10px', fontSize:'13px', fontWeight:700 }}>
            + Buat Konten Pertama
          </Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%,280px),1fr))', gap:'10px' }}>
          {filtered.map((c: any) => {
            const meta = TYPE_ICON[c.type] ?? TYPE_ICON.caption
            return (
              <div key={c.id} style={{ borderRadius:'12px', border:`1px solid ${C.slate200}`, background:C.white, overflow:'hidden', transition:'all .12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.brand50; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(37,99,235,.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.slate200; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                {c.imageUrl ? (
                  <div style={{ height:'120px', overflow:'hidden', background:C.slate100 }}>
                    <img src={c.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  </div>
                ) : (
                  <div style={{ height:'70px', background: meta.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                  </div>
                )}
                <div style={{ padding:'10px 12px' }}>
                  <div style={{ fontSize:'12px', fontWeight:600, color:C.slate900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'4px' }}>{c.title || 'Tanpa judul'}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'10px', color:C.slate400 }}>{new Date(c.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>
                    <div style={{ display:'flex', gap:'4px' }}>
                      {c.captionText && (
                        <button onClick={() => copy(c.captionText, c.id)} style={{ width:'26px', height:'26px', borderRadius:'6px', border:`1px solid ${C.slate200}`, background: copiedId===c.id ? C.grn50 : C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {copiedId===c.id ? <Check size={11} color={C.green}/> : <Copy size={11} color={C.slate400}/>}
                        </button>
                      )}
                      {c.imageUrl && (
                        <a href={c.imageUrl} download target="_blank" rel="noreferrer" style={{ width:'26px', height:'26px', borderRadius:'6px', border:`1px solid ${C.slate200}`, background:C.white, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Download size={11} color={C.slate400}/>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}