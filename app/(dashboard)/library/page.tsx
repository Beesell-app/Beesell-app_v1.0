'use client'
// app/(dashboard)/library/page.tsx
// ══════════════════════════════════════════════════════════════
// ASSET LIBRARY v3 — Gallery dengan Library + Collections tab
// - Date-grouped grid, newest first
// - Filter by tool/type/liked, search, sort
// - Click → detail panel (full info, use-in, inputs)
// - Bulk select → download / add to collection / delete
// - Import external image
// - Export for Web (format + quality)
// - Storage usage bar + plan limits
// - Expiry warnings (14-day grace period)
// - Collections management
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Download, Trash2, Heart, FolderPlus, X, Check,
  Filter, Upload, Search, Grid, List, ChevronRight,
  ZoomIn, ZoomOut, RotateCcw, Copy, ExternalLink,
  AlertTriangle, Clock, Plus, MoreHorizontal,
  Image as ImageIcon, Video, FileText, Archive,
  FolderOpen, Tag, Calendar, Info, ChevronDown,
  Loader2, RefreshCw, Star,
} from 'lucide-react'
import type {
  Asset, Collection, StorageUsage, FilterTab,
  SortBy, ExportFormat, AssetType, 
} from '../../../lib/library/types'
import {
  TOOL_REGISTRY, fmtBytes, fmtDateTime, fmtDate, daysUntilExpiry,
} from '../../../lib/library/types'

// ── Tokens ────────────────────────────────────────────────────
const C = {
  amber:'#F59E0B', amberDk:'#D97706', amberLt:'#FEF3C7', amberXlt:'#FFFBEB',
  white:'#FFFFFF', bg:'#F9FAFB', surface:'#FFFFFF',
  border:'#E5E7EB', borderHi:'#D1D5DB',
  ink:'#111827', inkSub:'#374151', inkMuted:'#6B7280', inkDim:'#9CA3AF',
  green:'#059669', greenLt:'#ECFDF5',
  blue:'#3B82F6', blueLt:'#EFF6FF',
  purple:'#7C3AED', purpleLt:'#F5F3FF',
  red:'#EF4444', redLt:'#FEF2F2',
  orange:'#F97316', orangeLt:'#FFF7ED',
  sh:'0 1px 3px rgba(0,0,0,.06)',
  sm:'0 4px 16px rgba(0,0,0,.07)',
  sa:'0 6px 20px rgba(245,158,11,.22)',
}

// ── All tool filter options ───────────────────────────────────
const TOOL_FILTER_GROUPS = [
  {
    label: 'AI Image',
    tools: ['photoshoot','packshot','product-to-model','tryon','model-swap','face-swap','enhancer'] as AssetType[],
  },
  {
    label: 'Quick Tools',
    tools: ['remove-bg','upscale','resize','relight','remove-object'] as AssetType[],
  },
  {
    label: 'Video AI',
    tools: ['ugc-video','image-to-video'] as AssetType[],
  },
  {
    label: 'Marketing Kit',
    tools: ['caption','hook','cta','description','hashtag','ad-copy','wa-reply','soft-selling','hard-selling','marketplace-copy','headline','bio'] as AssetType[],
  },
]

// ── Skeleton ──────────────────────────────────────────────────
function Sk({ w='100%', h='14px', r='6px' }: { w?:string; h?:string; r?:string }) {
  return <div style={{ width:w, height:h, borderRadius:r, background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite' }}/>
}

// ── Storage bar ───────────────────────────────────────────────
function StorageBar({ usage }: { usage: StorageUsage | null }) {
  if (!usage) return null
  const pct     = Math.min(Math.round((usage.used_bytes / usage.limit_bytes) * 100), 100)
  const color   = pct >= 95 ? C.red : pct >= 80 ? C.orange : C.green
  const colorLt = pct >= 95 ? C.redLt : pct >= 80 ? C.orangeLt : C.greenLt

  return (
    <div style={{ padding:'12px 16px', borderRadius:'12px', background:C.surface, border:`1px solid ${pct >= 80 ? color + '40' : C.border}`, boxShadow:C.sh, display:'flex', gap:'14px', alignItems:'center', flexWrap:'wrap' }}>
      <Archive size={16} color={color} style={{ flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:'200px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
          <span style={{ fontSize:'12px', fontWeight:700, color:C.ink }}>Storage Asset Library</span>
          <span style={{ fontSize:'11px', fontWeight:700, color }}>{pct}% — {fmtBytes(usage.used_bytes)} / {fmtBytes(usage.limit_bytes)}</span>
        </div>
        <div style={{ height:'6px', background:C.bg, borderRadius:'3px', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'3px', transition:'width .5s ease' }}/>
        </div>
        <div style={{ display:'flex', gap:'12px', marginTop:'5px', fontSize:'10px', color:C.inkDim }}>
          <span>🖼️ {usage.image_count} gambar</span>
          <span>🎬 {usage.video_count} video</span>
          <span>✍️ {usage.text_count} teks</span>
        </div>
      </div>
      {pct >= 80 && (
        <Link href="/billing" style={{ flexShrink:0, padding:'6px 12px', borderRadius:'8px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'11px', fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>
          Upgrade →
        </Link>
      )}
    </div>
  )
}

// ── Expiry warning banner ─────────────────────────────────────
function ExpiryBanner({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null || daysLeft > 14) return null
  const isUrgent = daysLeft <= 3
  return (
    <div style={{ padding:'12px 16px', borderRadius:'12px', background:isUrgent ? C.redLt : C.amberXlt, border:`1px solid ${isUrgent ? C.red + '40' : C.amber + '40'}`, display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
      <AlertTriangle size={16} color={isUrgent ? C.red : C.amberDk} style={{ flexShrink:0 }}/>
      <div style={{ flex:1, fontSize:'13px', color:isUrgent ? '#B91C1C' : C.amberDk, fontWeight:600 }}>
        {daysLeft <= 0
          ? '🚨 Plan sudah expired — aset akan dihapus dalam 14 hari grace period!'
          : `⏳ Plan berakhir dalam ${daysLeft} hari — aset akan dihapus 14 hari setelah expired`}
      </div>
      <Link href="/billing" style={{ flexShrink:0, padding:'6px 12px', borderRadius:'8px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'11px', fontWeight:700, textDecoration:'none' }}>
        Perpanjang →
      </Link>
    </div>
  )
}

// ── Asset thumbnail ───────────────────────────────────────────
function AssetThumb({ asset, selected, onSelect, onClick, showSelect }: {
  asset: Asset; selected: boolean; onSelect: ()=>void; onClick: ()=>void; showSelect: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const tool = TOOL_REGISTRY[asset.type] ?? TOOL_REGISTRY.other
  const daysLeft = daysUntilExpiry(asset.expires_at)
  const isExpiringSoon = daysLeft !== null && daysLeft <= 14

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position:'relative', borderRadius:'12px', overflow:'hidden', border:`2px solid ${selected ? C.amber : hovered ? C.borderHi : C.border}`, background:C.bg, cursor:'pointer', transition:'all .15s', aspectRatio: tool.kind === 'video' ? '9/16' : tool.kind === 'text' ? 'auto' : '1/1', boxShadow:selected ? C.sa : hovered ? C.sh : 'none' }}>

      {/* Checkbox */}
      {(showSelect || hovered) && (
        <div onClick={e => { e.stopPropagation(); onSelect() }}
          style={{ position:'absolute', top:'8px', left:'8px', zIndex:10, width:'22px', height:'22px', borderRadius:'6px', border:`2px solid ${selected ? C.amber : 'rgba(255,255,255,.9)'}`, background:selected ? C.amber : 'rgba(255,255,255,.85)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', transition:'all .12s' }}>
          {selected && <Check size={12} color="#fff"/>}
        </div>
      )}

      {/* Expiry warning badge */}
      {isExpiringSoon && (
        <div style={{ position:'absolute', top:'8px', right:'8px', zIndex:10, padding:'2px 6px', borderRadius:'5px', background:C.red, fontSize:'9px', fontWeight:800, color:'#fff' }}>
          {daysLeft}d
        </div>
      )}

      {/* Content */}
      <div onClick={onClick} style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
        {tool.kind === 'image' || tool.kind === 'video' ? (
          asset.file_url ? (
            <div style={{ flex:1, background:'#000', position:'relative', overflow:'hidden' }}>
              {tool.kind === 'video' ? (
                <video src={asset.file_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} muted playsInline/>
              ) : (
                <img src={asset.file_url} alt={asset.title ?? asset.type} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              )}
              {/* Hover overlay */}
              {hovered && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ZoomIn size={20} color="#fff"/>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:tool.colorLt, fontSize:'32px' }}>{tool.icon}</div>
          )
        ) : (
          /* Text asset */
          <div style={{ flex:1, padding:'12px', background:tool.colorLt, display:'flex', flexDirection:'column', gap:'6px', minHeight:'100px' }}>
            <div style={{ fontSize:'16px' }}>{tool.icon}</div>
            <div style={{ fontSize:'11px', fontWeight:700, color:tool.color }}>{tool.label}</div>
            <div style={{ fontSize:'10px', color:C.inkMuted, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' } as React.CSSProperties}>
              {asset.text_content?.substring(0, 120)}
            </div>
          </div>
        )}

        {/* Bottom info */}
        <div style={{ padding:'6px 8px', background:C.surface, borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 5px', borderRadius:'4px', background:tool.colorLt, color:tool.color, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'80px' }}>{tool.label}</span>
          {asset.is_liked && <Heart size={10} fill={C.red} color={C.red} style={{ flexShrink:0 }}/>}
          <span style={{ fontSize:'9px', color:C.inkDim, marginLeft:'auto', flexShrink:0 }}>
            {new Date(asset.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Asset detail panel ────────────────────────────────────────
function DetailPanel({ asset, onClose, onLike, onDelete, onDownload }: {
  asset: Asset; onClose: ()=>void; onLike: ()=>void; onDelete: ()=>void; onDownload: ()=>void
}) {
  const tool = TOOL_REGISTRY[asset.type] ?? TOOL_REGISTRY.other
  const [copied, setCopied] = useState(false)
  const [showInputs, setShowInputs] = useState(false)
  const [imgZoom, setImgZoom] = useState(1)
  const daysLeft = daysUntilExpiry(asset.expires_at)

  const copy = async () => {
    if (!asset.text_content) return
    await navigator.clipboard.writeText(asset.text_content)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex' }}>
      {/* Overlay */}
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)' }}/>

      {/* Panel */}
      <div style={{ position:'absolute', inset:0, display:'flex', maxWidth:'1100px', width:'100%', margin:'0 auto', padding:'16px', gap:'12px', alignItems:'stretch', zIndex:1 }}>
        {/* Left: Image/Video */}
        <div style={{ flex:1, borderRadius:'16px', overflow:'hidden', background:'#000', position:'relative', minHeight:'0' }}>
          {asset.file_url && (tool.kind === 'image') && (
            <>
              <img src={asset.file_url} alt={asset.title ?? ''} style={{ width:'100%', height:'100%', objectFit:'contain', transform:`scale(${imgZoom})`, transition:'transform .2s', display:'block' }}/>
              {/* Zoom controls */}
              <div style={{ position:'absolute', top:'12px', left:'12px', display:'flex', gap:'4px' }}>
                {([
                    ['−', () => setImgZoom(p => Math.max(.5, p - .25))],
                    ['+', () => setImgZoom(p => Math.min(3, p + .25))],
                    ['↺', () => setImgZoom(1)],
                  ] as [string, () => void][])
                  .map(([l, fn], i) => (
                    <button
                      key={i}
                      onClick={fn}
                      style={{
                        width:'30px',
                        height:'30px',
                        borderRadius:'8px',
                        border:'none',
                        background:'rgba(0,0,0,.55)',
                        color:'#fff',
                        fontSize:'14px',
                        cursor:'pointer',
                        backdropFilter:'blur(4px)',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                      }}
                    >
                      {l}
                    </button>
                  ))}
              </div>
            </>
          )}
          {asset.file_url && tool.kind === 'video' && (
            <video src={asset.file_url} controls style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
          )}
          {tool.kind === 'text' && (
            <div style={{ padding:'24px', height:'100%', background:`${tool.colorLt}`, display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ fontSize:'48px' }}>{tool.icon}</div>
              <div style={{ fontSize:'14px', fontWeight:700, color:tool.color }}>{tool.label}</div>
              <div style={{ fontSize:'14px', color:C.inkSub, lineHeight:1.8, flex:1, overflow:'auto' }}>{asset.text_content}</div>
            </div>
          )}
          <button onClick={onClose} style={{ position:'absolute', top:'12px', right:'12px', width:'32px', height:'32px', borderRadius:'8px', border:'none', background:'rgba(0,0,0,.55)', color:'#fff', cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16}/>
          </button>
        </div>

        {/* Right: Info panel */}
        <div style={{ width:'300px', borderRadius:'16px', background:C.surface, border:`1px solid ${C.border}`, boxShadow:C.sm, display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>
          {/* Top actions */}
          <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:'6px' }}>
            {[
              { icon:<Download size={15}/>,                          action:onDownload,             title:'Download' },
              { icon:<ExternalLink size={15}/>,                      action:()=>window.open(asset.file_url??'','_blank'), title:'Buka baru' },
              { icon:<Heart size={15} fill={asset.is_liked?C.red:undefined} color={asset.is_liked?C.red:C.inkMuted}/>, action:onLike, title:'Suka' },
              { icon:<Trash2 size={15}/>,                            action:onDelete,               title:'Hapus', danger:true },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} title={btn.title}
                style={{ flex:1, height:'34px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s', color: btn.danger ? C.red : C.inkMuted }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=btn.danger?C.redLt:C.amberXlt}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=C.bg}}>
                {btn.icon}
              </button>
            ))}
          </div>

          {/* Info */}
          <div style={{ flex:1, overflowY:'auto', padding:'14px' }}>
            {/* Expiry warning */}
            {daysLeft !== null && daysLeft <= 14 && (
              <div style={{ padding:'9px 11px', borderRadius:'9px', background:daysLeft <= 3 ? C.redLt : C.amberXlt, border:`1px solid ${daysLeft <= 3 ? C.red : C.amber}40`, display:'flex', gap:'7px', alignItems:'flex-start', marginBottom:'12px', fontSize:'11px', color:daysLeft <= 3 ? '#B91C1C' : C.amberDk }}>
                <AlertTriangle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>
                <span>Aset ini akan terhapus dalam <strong>{daysLeft} hari</strong>. Perpanjang plan untuk mempertahankannya.</span>
              </div>
            )}

            {/* Metadata */}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
              <div>
                <div style={{ fontSize:'10px', color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'3px' }}>Dibuat</div>
                <div style={{ fontSize:'12px', color:C.ink }}>{fmtDateTime(asset.created_at)}</div>
              </div>
              <div>
                <div style={{ fontSize:'10px', color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'3px' }}>Dibuat dengan</div>
                <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontSize:'14px' }}>{tool.icon}</span>
                  <span style={{ fontSize:'12px', fontWeight:600, color:tool.color }}>{tool.label}</span>
                </div>
              </div>
              {asset.file_size_bytes > 0 && (
                <div>
                  <div style={{ fontSize:'10px', color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'3px' }}>Ukuran File</div>
                  <div style={{ fontSize:'12px', color:C.ink }}>{fmtBytes(asset.file_size_bytes)}{asset.width && ` · ${asset.width}×${asset.height}`}</div>
                </div>
              )}
              {asset.duration_sec && (
                <div>
                  <div style={{ fontSize:'10px', color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'3px' }}>Durasi</div>
                  <div style={{ fontSize:'12px', color:C.ink }}>{asset.duration_sec.toFixed(1)}s</div>
                </div>
              )}
              {asset.preset_used && (
                <div>
                  <div style={{ fontSize:'10px', color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'3px' }}>Preset</div>
                  <div style={{ fontSize:'12px', color:C.ink }}>{asset.preset_used}</div>
                </div>
              )}
            </div>

            {/* Use in tools */}
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, marginBottom:'8px' }}>Gunakan di</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px' }}>
                {[
                  { label:'Upscale', href:'/quick-tools?tool=upscale', icon:'🔍' },
                  { label:'Edit', href:'/studio', icon:'✏️' },
                  { label:'Image to Video', href:'/studio/video/image-to-video', icon:'🎬' },
                  { label:'Model Swap', href:'/studio/image/model-swap', icon:'🔄' },
                ].map((u, i) => (
                  <Link key={i} href={u.href}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 8px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.bg, textDecoration:'none', fontSize:'10px', color:C.inkSub, transition:'all .12s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.amber;(e.currentTarget as HTMLElement).style.background=C.amberXlt;(e.currentTarget as HTMLElement).style.color=C.amberDk}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.background=C.bg;(e.currentTarget as HTMLElement).style.color=C.inkSub}}>
                    <span>{u.icon}</span><span style={{ fontWeight:600 }}>{u.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Text content copy */}
            {asset.text_content && (
              <div style={{ marginBottom:'14px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, marginBottom:'6px' }}>Konten</div>
                <div style={{ padding:'10px', borderRadius:'9px', background:C.bg, border:`1px solid ${C.border}`, fontSize:'12px', color:C.inkSub, lineHeight:1.7, maxHeight:'140px', overflowY:'auto', marginBottom:'7px' }}>
                  {asset.text_content}
                </div>
                <button onClick={copy}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:copied ? C.greenLt : C.bg, color:copied ? C.green : C.inkMuted, fontSize:'11px', fontWeight:600, cursor:'pointer', transition:'all .15s', fontFamily:'inherit' }}>
                  {copied ? <><Check size={12}/> Tersalin!</> : <><Copy size={12}/> Copy Text</>}
                </button>
              </div>
            )}

            {/* Inputs (prompt, source images) */}
            {(asset.prompt || asset.source_urls?.length) && (
              <div>
                <button onClick={() => setShowInputs(p => !p)}
                  style={{ display:'flex', alignItems:'center', gap:'5px', width:'100%', padding:'7px 9px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.bg, fontSize:'11px', fontWeight:700, color:C.inkSub, cursor:'pointer', fontFamily:'inherit', justifyContent:'space-between' }}>
                  <span>Inputs & Parameters</span>
                  <ChevronDown size={12} style={{ transform:showInputs?'rotate(180deg)':'rotate(0)', transition:'transform .2s' }}/>
                </button>
                {showInputs && (
                  <div style={{ marginTop:'8px', padding:'10px', borderRadius:'9px', background:C.bg, border:`1px solid ${C.border}`, fontSize:'11px', color:C.inkMuted, lineHeight:1.6 }}>
                    {asset.prompt && <div style={{ marginBottom:'8px' }}><strong>Prompt:</strong><br/>{asset.prompt.substring(0,300)}</div>}
                    {asset.source_urls?.map((u, i) => <img key={i} src={u} alt={`Source ${i+1}`} style={{ width:'48px', height:'48px', objectFit:'cover', borderRadius:'6px', border:`1px solid ${C.border}`, marginRight:'5px' }}/>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Export dialog ─────────────────────────────────────────────
function ExportDialog({ count, onClose, onExport }: { count:number; onClose:()=>void; onExport:(fmt:ExportFormat,q:number)=>void }) {
  const [fmt, setFmt]     = useState<ExportFormat>('webp')
  const [quality, setQuality] = useState(95)
  const estSize = fmt === 'webp' ? Math.round(quality * 0.05) : fmt === 'jpeg' ? Math.round(quality * 0.08) : 100

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:C.surface, borderRadius:'18px', border:`1px solid ${C.border}`, boxShadow:C.sm, width:'380px', padding:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <div style={{ fontSize:'16px', fontWeight:800, color:C.ink }}>📤 Export for Web</div>
          <button onClick={onClose} style={{ width:'28px', height:'28px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
        </div>
        <div style={{ fontSize:'12px', color:C.inkMuted, marginBottom:'20px' }}>{count} item{count > 1 ? 's' : ''} akan di-export</div>

        {/* Format */}
        <div style={{ marginBottom:'16px' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, marginBottom:'8px' }}>Format</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px' }}>
            {(['original','jpeg','png','webp'] as ExportFormat[]).map(f => (
              <button key={f} onClick={() => setFmt(f)}
                style={{ padding:'8px 4px', borderRadius:'8px', border:`1.5px solid ${fmt===f?C.amber:C.border}`, background:fmt===f?C.amberXlt:C.bg, fontSize:'11px', fontWeight:fmt===f?700:500, color:fmt===f?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
                {f === 'original' ? 'ORI' : f.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ fontSize:'10px', color:C.inkDim, marginTop:'5px' }}>
            {fmt === 'webp' ? '✅ Direkomendasikan untuk web. Support transparansi.' : fmt === 'jpeg' ? '⚠️ Tidak support transparansi. File kecil.' : fmt === 'png' ? '✅ Support transparansi. File besar.' : '🔄 Format asli dari generate AI.'}
          </div>
        </div>

        {/* Quality */}
        {(fmt === 'jpeg' || fmt === 'webp') && (
          <div style={{ marginBottom:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:C.inkSub }}>Kualitas</div>
              <div style={{ fontSize:'12px', fontWeight:700, color:C.amber }}>{quality}%</div>
            </div>
            <input type="range" min={50} max={100} value={quality} onChange={e => setQuality(+e.target.value)} style={{ width:'100%', accentColor:C.amber }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:C.inkDim, marginTop:'2px' }}>
              <span>File kecil</span><span>Kualitas tinggi</span>
            </div>
          </div>
        )}

        {/* Size estimate */}
        <div style={{ padding:'10px 12px', borderRadius:'9px', background:C.bg, border:`1px solid ${C.border}`, fontSize:'12px', color:C.inkMuted, marginBottom:'18px' }}>
          📊 Estimasi ukuran per file: ~{estSize}-{estSize * 3} KB &nbsp;·&nbsp; {fmt === 'webp' ? '95% WebP rekomendasi untuk semua web' : ''}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          <button onClick={onClose}
            style={{ padding:'11px', borderRadius:'10px', border:`1px solid ${C.border}`, background:C.bg, fontSize:'13px', fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>Batal</button>
          <button onClick={() => onExport(fmt, quality)}
            style={{ padding:'11px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit' }}>
            Export {count} File
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New collection dialog ─────────────────────────────────────
function NewCollectionDialog({ onClose, onCreate }: { onClose:()=>void; onCreate:(name:string,color:string)=>void }) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState('#F59E0B')
  const colors = [C.amber,'#10B981','#3B82F6','#7C3AED','#EF4444','#F97316','#0284C7','#DB2777']

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:C.surface, borderRadius:'16px', border:`1px solid ${C.border}`, width:'360px', padding:'22px' }}>
        <div style={{ fontSize:'16px', fontWeight:800, color:C.ink, marginBottom:'16px' }}>📁 Buat Koleksi Baru</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama koleksi..." autoFocus
          style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, fontSize:'13px', outline:'none', marginBottom:'14px', fontFamily:'inherit', boxSizing:'border-box' }}
          onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
          onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
        <div style={{ fontSize:'11px', fontWeight:700, color:C.inkSub, marginBottom:'8px' }}>Warna</div>
        <div style={{ display:'flex', gap:'7px', marginBottom:'18px' }}>
          {colors.map(c => (
            <button key={c} onClick={() => setColor(c)}
              style={{ width:'28px', height:'28px', borderRadius:'50%', background:c, border:`3px solid ${color===c?C.ink:'transparent'}`, cursor:'pointer', transition:'border .12s' }}/>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          <button onClick={onClose} style={{ padding:'10px', borderRadius:'9px', border:`1px solid ${C.border}`, background:C.bg, fontSize:'13px', fontWeight:600, color:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>Batal</button>
          <button onClick={() => name.trim() && onCreate(name.trim(), color)} disabled={!name.trim()}
            style={{ padding:'10px', borderRadius:'9px', border:'none', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:name.trim()?'pointer':'not-allowed', fontFamily:'inherit', opacity:name.trim()?1:.5 }}>
            Buat Koleksi
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function LibraryPage() {
  // ── Tab state ─────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<'library'|'collections'>('library')

  // ── Library state ─────────────────────────────────────────
  const [items,        setItems]        = useState<Asset[]>([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState<FilterTab>('all')
  const [toolFilter,   setToolFilter]   = useState<AssetType|''>('')
  const [sortBy,       setSortBy]       = useState<SortBy>('newest')
  const [search,       setSearch]       = useState('')
  const [showFilters,  setShowFilters]  = useState(false)

  // ── Selection ─────────────────────────────────────────────
  const [selectMode,   setSelectMode]   = useState(false)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())

  // ── Detail panel ──────────────────────────────────────────
  const [detailAsset,  setDetailAsset]  = useState<Asset | null>(null)

  // ── Dialogs ───────────────────────────────────────────────
  const [showExport,   setShowExport]   = useState(false)
  const [showNewCol,   setShowNewCol]   = useState(false)

  // ── Collections ───────────────────────────────────────────
  const [collections,  setCollections]  = useState<Collection[]>([])
  const [activeColId,  setActiveColId]  = useState<string|''>('')

  // ── Storage + expiry ──────────────────────────────────────
  const [storage,      setStorage]      = useState<StorageUsage | null>(null)
  const [planDaysLeft, setPlanDaysLeft] = useState<number | null>(null)

  const PER_PAGE = 24

  // ── Fetch items ───────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:      String(page),
        perPage:   String(PER_PAGE),
        filter,
        sort:      sortBy,
        ...(toolFilter  ? { tool:       toolFilter }  : {}),
        ...(search.trim() ? { search:   search.trim() } : {}),
        ...(activeColId ? { collection: activeColId }  : {}),
      })
      const res  = await fetch(`/api/library/items?${params}`)
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, filter, sortBy, toolFilter, search, activeColId])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── Fetch storage + collections ───────────────────────────
  useEffect(() => {
    // Storage usage
    fetch('/api/library/storage').then(r => r.json()).then(d => setStorage(d.storage ?? null))
    // Collections
    fetch('/api/library/collections').then(r => r.json()).then(d => setCollections(d.collections ?? []))
    // Plan expiry (from profile)
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.plan_expires_at) setPlanDaysLeft(daysUntilExpiry(d.plan_expires_at))
    }).catch(() => {})
  }, [])

  // ── Handlers ──────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  const selectAll  = () => setItems(items => { setSelected(new Set(items.map(i => i.id))); return items })
  const clearSel   = () => { setSelected(new Set()); setSelectMode(false) }

  const handleLike = async (asset: Asset) => {
    await fetch(`/api/library/items/${asset.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ is_liked:!asset.is_liked }) })
    setItems(p => p.map(a => a.id === asset.id ? { ...a, is_liked:!a.is_liked } : a))
    if (detailAsset?.id === asset.id) setDetailAsset(p => p ? { ...p, is_liked:!p.is_liked } : p)
  }

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Hapus ${ids.length} aset? Tindakan ini tidak dapat dibatalkan.`)) return
    await fetch('/api/library/items', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ids }) })
    setItems(p => p.filter(a => !ids.includes(a.id)))
    setTotal(p => p - ids.length)
    setSelected(new Set())
    setDetailAsset(null)
  }

  const handleDownload = async (ids: string[], fmt: ExportFormat = 'original', quality = 95) => {
    if (ids.length === 1) {
      // Single download
      const asset = items.find(a => a.id === ids[0]) ?? detailAsset
      if (!asset) return
      if (asset.file_url) {
        const a = document.createElement('a')
        a.href = asset.file_url; a.download = `beesell-${asset.type}-${ids[0].slice(0,8)}.jpg`; a.click()
      } else if (asset.text_content) {
        const blob = new Blob([asset.text_content], { type:'text/plain' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob); a.download = `beesell-${asset.type}-${ids[0].slice(0,8)}.txt`; a.click()
      }
      return
    }
    // Bulk — get manifest and download each
    const res  = await fetch('/api/library/export', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ids, format:fmt, quality }) })
    const data = await res.json()
    // Download each file from manifest
    for (const item of data.manifest ?? []) {
      if (item.url) {
        await new Promise(r => setTimeout(r, 300))
        const a = document.createElement('a')
        a.href = item.url; a.download = item.filename; a.click()
      } else if (item.text) {
        const blob = new Blob([item.text], { type:'text/plain' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = item.filename; a.click()
      }
    }
  }

  const handleCreateCollection = async (name: string, color: string) => {
    const res  = await fetch('/api/library/collections', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name, color }) })
    const data = await res.json()
    if (data.collection) {
      setCollections(p => [data.collection, ...p])
      if (selected.size > 0) {
        await fetch('/api/library/collections/items', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ collectionId:data.collection.id, assetIds:[...selected] }) })
        clearSel()
      }
    }
    setShowNewCol(false)
  }

  const handleAddToCollection = async (colId: string) => {
    await fetch('/api/library/collections/items', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ collectionId:colId, assetIds:[...selected] }) })
    clearSel()
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.multiple = true
    input.onchange = async (e: any) => {
      for (const file of Array.from(e.target.files as FileList)) {
        const fd = new FormData(); fd.append('file', file as File); fd.append('title', (file as File).name)
        await fetch('/api/library/items', { method:'POST', body:fd })
      }
      fetchItems()
    }
    input.click()
  }

  // ── Group items by date ────────────────────────────────────
  const groupedItems = items.reduce<Record<string, Asset[]>>((acc, item) => {
    const dateKey = fmtDate(item.created_at)
    acc[dateKey] = acc[dateKey] ?? []
    acc[dateKey].push(item)
    return acc
  }, {})

  const bulkCount = selected.size

  return (
    <div style={{ maxWidth:'1300px', margin:'0 auto' }}>

      {/* ── Storage + expiry warnings ──────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
        <StorageBar usage={storage}/>
        <ExpiryBanner daysLeft={planDaysLeft}/>
      </div>

      {/* ── Header ────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'clamp(18px,3vw,24px)', fontWeight:800, color:C.ink, letterSpacing:'-0.03em', marginBottom:'4px' }}>📁 Asset Library</h1>
          <p style={{ fontSize:'12px', color:C.inkMuted }}>{loading ? '...' : `${total} aset tersimpan dari semua fitur BeeSell AI`}</p>
        </div>
        <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
          {selectMode ? (
            <>
              <button onClick={() => setShowExport(true)} disabled={bulkCount === 0}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkSub, cursor:bulkCount?'pointer':'not-allowed', fontFamily:'inherit', opacity:bulkCount?1:.5 }}>
                <Download size={13}/> Download ({bulkCount})
              </button>
              <button onClick={() => setShowNewCol(true)} disabled={bulkCount === 0}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkSub, cursor:bulkCount?'pointer':'not-allowed', fontFamily:'inherit', opacity:bulkCount?1:.5 }}>
                <FolderPlus size={13}/> Koleksi
              </button>
              <button onClick={() => handleDelete([...selected])} disabled={bulkCount === 0}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.red}30`, background:C.redLt, fontSize:'12px', fontWeight:600, color:C.red, cursor:bulkCount?'pointer':'not-allowed', fontFamily:'inherit', opacity:bulkCount?1:.5 }}>
                <Trash2 size={13}/> Hapus ({bulkCount})
              </button>
              <button onClick={selectAll} style={{ padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkSub, cursor:'pointer', fontFamily:'inherit' }}>Pilih Semua</button>
              <button onClick={clearSel} style={{ padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkSub, cursor:'pointer', fontFamily:'inherit' }}>Batal</button>
            </>
          ) : (
            <>
              <button onClick={() => setSelectMode(true)}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkSub, cursor:'pointer', fontFamily:'inherit' }}>
                <Check size={13}/> Pilih
              </button>
              <button onClick={handleImport}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkSub, cursor:'pointer', fontFamily:'inherit' }}>
                <Upload size={13}/> Import
              </button>
              <button onClick={() => setShowNewCol(true)}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkSub, cursor:'pointer', fontFamily:'inherit' }}>
                <Plus size={13}/> Koleksi
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────── */}
      <div style={{ display:'flex', gap:'4px', background:C.bg, borderRadius:'10px', padding:'3px', border:`1px solid ${C.border}`, marginBottom:'16px', width:'fit-content' }}>
        {([['library','📚 Library'],['collections','📁 Koleksi']] as const).map(([tab, label]) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            style={{ padding:'7px 18px', borderRadius:'7px', border:'none', background:activeTab===tab?C.surface:'transparent', fontSize:'13px', fontWeight:activeTab===tab?700:500, color:activeTab===tab?C.ink:C.inkMuted, cursor:'pointer', boxShadow:activeTab===tab?C.sh:'none', transition:'all .15s', fontFamily:'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── LIBRARY TAB ───────────────────────────────── */}
      {activeTab === 'library' && (
        <>
          {/* Search + filter bar */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap', alignItems:'center' }}>
            {/* Search */}
            <div style={{ position:'relative', flex:1, minWidth:'200px', maxWidth:'360px' }}>
              <Search size={14} color={C.inkDim} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Cari caption, prompt, judul..."
                style={{ width:'100%', padding:'8px 12px 8px 32px', borderRadius:'9px', border:`1px solid ${C.border}`, fontSize:'12px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:C.surface }}
                onFocus={e=>(e.target as HTMLElement).style.borderColor=C.amber}
                onBlur={e=>(e.target as HTMLElement).style.borderColor=C.border}/>
            </div>

            {/* Filter tabs */}
            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
              {([['all','Semua'],['image','🖼️ Gambar'],['video','🎬 Video'],['text','✍️ Teks'],['liked','❤️ Suka']] as [FilterTab,string][]).map(([f, l]) => (
                <button key={f} type="button" onClick={() => { setFilter(f); setPage(1); setToolFilter('') }}
                  style={{ padding:'6px 12px', borderRadius:'99px', border:`1.5px solid ${filter===f?C.amber:C.border}`, background:filter===f?C.amberXlt:C.surface, fontSize:'11px', fontWeight:filter===f?700:500, color:filter===f?C.amberDk:C.inkMuted, cursor:'pointer', transition:'all .12s', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Sort + Advanced filter */}
            <div style={{ display:'flex', gap:'6px', marginLeft:'auto' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
                style={{ padding:'7px 10px', borderRadius:'8px', border:`1px solid ${C.border}`, fontSize:'12px', color:C.inkSub, background:C.surface, outline:'none', cursor:'pointer', fontFamily:'inherit' }}>
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="size">Ukuran</option>
                <option value="type">Tipe</option>
              </select>
              <button onClick={() => setShowFilters(p => !p)}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1px solid ${showFilters?C.amber:C.border}`, background:showFilters?C.amberXlt:C.surface, fontSize:'12px', color:showFilters?C.amberDk:C.inkSub, cursor:'pointer', fontFamily:'inherit' }}>
                <Filter size={13}/> Filter Tool
              </button>
            </div>
          </div>

          {/* Advanced filter — tool-level */}
          {showFilters && (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'12px', padding:'14px 16px', marginBottom:'14px' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'14px' }}>
                {TOOL_FILTER_GROUPS.map(group => (
                  <div key={group.label}>
                    <div style={{ fontSize:'9px', fontWeight:700, color:C.inkDim, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' }}>{group.label}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                      {group.tools.map(t => {
                        const tm = TOOL_REGISTRY[t]
                        const sel = toolFilter === t
                        return (
                          <button key={t} onClick={() => { setToolFilter(sel ? '' : t); setPage(1) }}
                            style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 9px', borderRadius:'99px', border:`1px solid ${sel?tm.color:C.border}`, background:sel?tm.colorLt:C.bg, fontSize:'10px', fontWeight:sel?700:500, color:sel?tm.color:C.inkMuted, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                            {tm.icon} {tm.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'10px' }}>
              {Array.from({length:12}).map((_,i) => <Sk key={i} h="200px" r="12px"/>)}
            </div>
          ) : items.length === 0 ? (
            <div style={{ borderRadius:'16px', border:`1.5px dashed ${C.border}`, padding:'60px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px', textAlign:'center', background:C.surface }}>
              <span style={{ fontSize:'48px' }}>📂</span>
              <div style={{ fontSize:'16px', fontWeight:700, color:C.inkMuted }}>
                {search || filter !== 'all' || toolFilter ? 'Tidak ada aset ditemukan' : 'Library masih kosong'}
              </div>
              <div style={{ fontSize:'13px', color:C.inkDim, maxWidth:'320px', lineHeight:1.6 }}>
                {search || filter !== 'all' || toolFilter ? 'Coba ubah filter atau kata kunci pencarian.' : 'Semua hasil dari AI Studio, Quick Tools, dan Marketing Kit akan tersimpan di sini secara otomatis.'}
              </div>
              {!search && filter === 'all' && (
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center' }}>
                  <Link href="/studio" style={{ padding:'9px 16px', borderRadius:'9px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, textDecoration:'none' }}>Buat Konten AI</Link>
                  <button onClick={handleImport} style={{ padding:'9px 16px', borderRadius:'9px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', fontWeight:600, color:C.inkSub, cursor:'pointer', fontFamily:'inherit' }}>Import Gambar</button>
                </div>
              )}
            </div>
          ) : (
            Object.entries(groupedItems).map(([dateKey, dateItems]) => (
              <div key={dateKey} style={{ marginBottom:'24px' }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:C.inkMuted, marginBottom:'10px', display:'flex', alignItems:'center', gap:'7px' }}>
                  <Calendar size={13}/> {dateKey}
                  <span style={{ fontSize:'11px', fontWeight:500, color:C.inkDim }}>({dateItems.length} aset)</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'10px' }}>
                  {dateItems.map(asset => (
                    <AssetThumb
                      key={asset.id}
                      asset={asset}
                      selected={selected.has(asset.id)}
                      showSelect={selectMode}
                      onSelect={() => { setSelectMode(true); toggleSelect(asset.id) }}
                      onClick={() => setDetailAsset(asset)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', gap:'6px', justifyContent:'center', alignItems:'center', marginTop:'24px', flexWrap:'wrap' }}>
              <button onClick={() => setPage(1)} disabled={page === 1}
                style={{ padding:'6px 10px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', color:C.inkMuted, cursor:page===1?'not-allowed':'pointer', opacity:page===1?.4:1, fontFamily:'inherit' }}>«</button>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding:'6px 10px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', color:C.inkMuted, cursor:page===1?'not-allowed':'pointer', opacity:page===1?.4:1, fontFamily:'inherit' }}>‹</button>
              {Array.from({length:Math.min(5,totalPages)}, (_,i) => {
                const p = Math.max(1, Math.min(totalPages-4, page-2)) + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width:'34px', height:'34px', borderRadius:'8px', border:`1.5px solid ${page===p?C.amber:C.border}`, background:page===p?C.amberXlt:C.surface, fontSize:'12px', fontWeight:page===p?700:500, color:page===p?C.amberDk:C.inkMuted, cursor:'pointer', fontFamily:'inherit' }}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                style={{ padding:'6px 10px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', color:C.inkMuted, cursor:page===totalPages?'not-allowed':'pointer', opacity:page===totalPages?.4:1, fontFamily:'inherit' }}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                style={{ padding:'6px 10px', borderRadius:'7px', border:`1px solid ${C.border}`, background:C.surface, fontSize:'12px', color:C.inkMuted, cursor:page===totalPages?'not-allowed':'pointer', opacity:page===totalPages?.4:1, fontFamily:'inherit' }}>»</button>
              <span style={{ fontSize:'12px', color:C.inkMuted }}>Halaman {page} dari {totalPages} · {total} total</span>
            </div>
          )}
        </>
      )}

      {/* ── COLLECTIONS TAB ───────────────────────────── */}
      {activeTab === 'collections' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ fontSize:'14px', color:C.inkMuted }}>{collections.length} koleksi</div>
            <button onClick={() => setShowNewCol(true)}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'12px', fontWeight:700, border:'none', cursor:'pointer', boxShadow:C.sa, fontFamily:'inherit' }}>
              <Plus size={13}/> Koleksi Baru
            </button>
          </div>

          {collections.length === 0 ? (
            <div style={{ borderRadius:'16px', border:`1.5px dashed ${C.border}`, padding:'60px 20px', textAlign:'center', background:C.surface }}>
              <div style={{ fontSize:'48px', marginBottom:'12px' }}>📁</div>
              <div style={{ fontSize:'16px', fontWeight:700, color:C.inkMuted, marginBottom:'6px' }}>Belum ada koleksi</div>
              <div style={{ fontSize:'13px', color:C.inkDim }}>Buat koleksi untuk mengorganisir aset berdasarkan kampanye, klien, atau kategori.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'12px' }}>
              {collections.map(col => (
                <button key={col.id} onClick={() => { setActiveTab('library'); setActiveColId(col.id) }}
                  style={{ borderRadius:'14px', border:`1.5px solid ${C.border}`, background:C.surface, cursor:'pointer', overflow:'hidden', textAlign:'left', transition:'all .18s', boxShadow:C.sh, fontFamily:'inherit' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=col.color;(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow=C.sm}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow=C.sh}}>
                  {/* Cover */}
                  <div style={{ height:'120px', background:`linear-gradient(135deg,${col.color}20,${col.color}08)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                    {col.cover_url ? (
                      <img src={col.cover_url} alt={col.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    ) : (
                      <FolderOpen size={40} color={col.color} style={{ opacity:.5 }}/>
                    )}
                    {col.is_pinned && <span style={{ position:'absolute', top:'8px', right:'8px', fontSize:'14px' }}>📌</span>}
                  </div>
                  {/* Info */}
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:C.ink, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{col.name}</div>
                    <div style={{ fontSize:'11px', color:C.inkMuted }}>{col.item_count} item · {fmtDate(col.updated_at)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────── */}
      {detailAsset && (
        <DetailPanel
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onLike={() => handleLike(detailAsset)}
          onDelete={() => handleDelete([detailAsset.id])}
          onDownload={() => handleDownload([detailAsset.id])}
        />
      )}

      {showExport && (
        <ExportDialog
          count={selected.size || 1}
          onClose={() => setShowExport(false)}
          onExport={(fmt, q) => { handleDownload([...selected], fmt, q); setShowExport(false) }}
        />
      )}

      {showNewCol && (
        <NewCollectionDialog
          onClose={() => setShowNewCol(false)}
          onCreate={handleCreateCollection}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        input::placeholder { color:#9CA3AF }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px }
        @media (max-width:639px) {
          div[style*="auto-fill,minmax(160px"] { grid-template-columns: repeat(2,1fr) !important }
        }
      `}</style>
    </div>
  )
}