'use client'
// app/(dashboard)/quick-tools/page.tsx
// ══════════════════════════════════════════════════════════════
// QUICK TOOLS — Updated dengan Remove Object Canvas
// Semua tools + interactive brush canvas untuk Remove Object
// ══════════════════════════════════════════════════════════════
import { useToolAccess } from '@/hooks/use-tool-access'
import { useUserRole }   from '@/hooks/use-user-role'
import {
  useState, useCallback, useRef, useEffect, useMemo,
} from 'react'
import Link from 'next/link'
import {
  Zap, Download, RotateCcw, ArrowLeft, Loader2,
  Brush, Eraser, Undo2, Redo2, ZoomIn, ZoomOut,
  Eye, EyeOff, Trash2, Wand2, Move,
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────
const C = {
  amber:    '#F59E0B', amberDk:'#D97706', amb50:'#FFFBEB', amberLt:'#FEF3C7',
  white:    '#FFFFFF', slate50:'#F8FAFC', slate100:'#F1F5F9',
  slate200: '#E2E8F0', slate300:'#CBD5E1', slate400:'#94A3B8',
  slate500: '#64748B', slate600:'#475569', slate700:'#334155',
  slate900: '#0F172A',
  pink:     '#EC4899', pnk50:'#FDF2F8',
  green:    '#059669', grn50:'#ECFDF5',
  blue:     '#3B82F6', blu50:'#EFF6FF',
  purple:   '#7C3AED', pur50:'#F5F3FF',
  orange:   '#F97316', orn50:'#FFF7ED',
  teal:     '#0D9488', tel50:'#F0FDFA',
  sh:       '0 1px 3px rgba(0,0,0,.06)',
  sm:       '0 4px 16px rgba(0,0,0,.08)',
  sa:       '0 6px 20px rgba(245,158,11,.22)',
}

// ── Tool definitions ──────────────────────────────────────────
const TOOLS = [
  {
    id: 'remove-bg', icon: '🗑️', label: 'Remove BG',
    desc: 'Hapus background foto produk secara otomatis dengan AI BRIA RMBG-2.0',
    shortDesc: 'Hapus background', color: C.purple, bg: C.pur50,
    badge: 'AI', badgeBg: C.purple,
    endpoint: '/api/tools/remove-bg', outputFormat: 'Background dihapus',
    tips: ['Pastikan produk terlihat jelas dan tidak blur','Foto dengan kontras tinggi antara produk dan background memberi hasil terbaik'],
    hasOptions: true,
    options: {
      label: 'Background Pengganti',
      key: 'option',
      items: [
        { v:'transparent', l:'⬜ Transparan',  desc:'PNG transparan — siap compositing & overlay' },
        { v:'white',       l:'⬜ Putih',        desc:'Background putih — wajib Shopee/Tokopedia' },
        { v:'black',       l:'⬛ Hitam',        desc:'Background hitam — premium, luxury vibe' },
        { v:'gradient',    l:'🌊 Gradient',     desc:'Gradien putih → abu — studio modern' },
      ],
    },
  },
  {
  id: 'upscale',
  icon: '🔍',
  label: 'AI Upscale',
  desc: 'Perbesar dan tingkatkan detail foto dengan AI Clarity Pro',
  shortDesc: 'Perbesar resolusi',
  color: C.blue,
  bg: C.blu50,
  badge: 'HD',
  badgeBg: C.blue,
  endpoint: '/api/tools/upscale',
  outputFormat: 'Foto HD',
  tips: [
    'Gunakan 2× untuk marketplace dan katalog produk',
    'Mode AI Enhance cocok untuk banner dan materi promosi',
    'Creativity tinggi dapat mengubah detail produk'
  ],
  hasOptions: true,
  options: {
    label: 'Mode Upscale',
    key: 'option',
    items: [
      {
        v: '2x',
        l: '2× Standard',
        desc: 'Cepat dan akurat untuk produk'
      },
      {
        v: '4x',
        l: '4× HD',
        desc: 'Resolusi tinggi untuk banner'
      },
      {
        v: '2x-enhance',
        l: '2× AI Enhance',
        desc: 'Lebih tajam dan detail'
      },
      {
        v: '4x-enhance',
        l: '4× AI Enhance',
        desc: 'Kualitas premium marketing'
      },
    ],
  },
},
  {
    id: 'resize', icon: '📐', label: 'Resize & Crop',
    desc: 'Sesuaikan ukuran foto ke format platform: Shopee, TikTok, Instagram, dan lainnya',
    shortDesc: 'Sesuaikan ukuran', color: C.teal, bg: C.tel50,
    badge: '', badgeBg: C.teal,
    endpoint: '/api/tools/resize', outputFormat: 'Foto terskalakan',
    tips: ['Shopee produk butuh minimal 500×500px','TikTok dan Reels optimal di 9:16 (1080×1920)'],
    hasOptions: true,
    options: {
      label: 'Format & Ukuran',
      key: 'option',
      items: [
        { v:'shopee',          l:'🛍️ Shopee Produk',     desc:'800×800px (1:1)' },
        { v:'tokopedia',       l:'🛒 Tokopedia',         desc:'700×700px (1:1)' },
        { v:'whatsapp-catalog',l:'💬 WhatsApp Katalog',  desc:'800×800px (1:1)' },
        { v:'instagram-sq',    l:'📸 Instagram Post',    desc:'1080×1080px (1:1)' },
        { v:'instagram-story', l:'📱 IG Story',          desc:'1080×1920px (9:16)' },
        { v:'tiktok-story',    l:'🎵 TikTok/Reels',      desc:'1080×1920px (9:16)' },
        { v:'facebook-post',   l:'👤 Facebook Post',     desc:'1200×630px' },
        { v:'youtube-thumb',   l:'▶️ YouTube Thumbnail', desc:'1280×720px' },
      ],
    },
  },
  {
    id: 'relight', icon: '💡', label: 'AI Relight',
    desc: 'Perbaiki pencahayaan foto produk — dari foto gelap/salah cahaya jadi foto studio profesional',
    shortDesc: 'Perbaiki cahaya', color: C.amber, bg: C.amb50,
    badge: 'Beta', badgeBg: C.amber,
    endpoint: '/api/tools/relight', outputFormat: 'Pencahayaan optimal',
    tips: ['Terbaik untuk foto indoor dengan pencahayaan tidak merata','Studio = cahaya putih bersih seperti studio foto'],
    hasOptions: true,
    options: {
      label: 'Mood Pencahayaan',
      key:   'option',
      items: [
        { v:'studio',   l:'🏢 Studio',     desc:'Putih bersih, profesional — marketplace' },
        { v:'natural',  l:'🌿 Natural',    desc:'Hangat, alami, nyaman' },
        { v:'golden',   l:'✨ Golden',     desc:'Golden hour, premium, mewah' },
        { v:'dramatic', l:'🌙 Dramatic',   desc:'Kontras tinggi, bold, eye-catching' },
        { v:'soft',     l:'🕊️ Soft Light', desc:'Lembut, beauty product, skincare' },
        { v:'cool',     l:'❄️ Cool Tone',  desc:'Biru sejuk, tech, gadget modern' }
      ],
    },
  },
  {
    id: 'remove-object', icon: '✏️', label: 'Remove Object',
    desc: 'Hapus objek spesifik dari foto — brush langsung di foto untuk tandai area yang ingin dihapus',
    shortDesc: 'Hapus objek', color: C.pink, bg: C.pnk50,
    badge: 'AI Magic', badgeBg: C.pink,
    endpoint: '/api/tools/remove-object', outputFormat: 'Objek terhapus',
    tips: ['Brush area yang ingin dihapus — AI akan mengisi dengan background yang sesuai','Gunakan brush lebih besar untuk area yang luas'],
    hasOptions: true,
    options: {
      label: 'Isi dengan',
      key:   'prompt',
      items: [
         { v:'auto',       l:'✨ Auto',         desc:'AI analisis & pilih fill terbaik' },
        { v:'background', l:'⬜ Background',   desc:'Isi dengan background putih studio' },
        { v:'blur',       l:'🌫️ Blur',          desc:'Efek blur bokeh — fokus ke produk' },
        { v:'match',      l:'🎨 Match',         desc:'Lanjutkan warna & pola sekitar area' },
        { v:'texture',    l:'🧱 Texture',       desc:'Isi dengan tekstur matching sekitar' },
      ],
    },
  },
] as const

type ToolId  = typeof TOOLS[number]['id']
type ToolDef = typeof TOOLS[number]

// ══════════════════════════════════════════════════════════════
// REMOVE OBJECT CANVAS COMPONENT
// Interactive brush untuk menandai area yang ingin dihapus
// ══════════════════════════════════════════════════════════════
interface RemoveObjectCanvasProps {
  imageFile:   File
  previewSrc:  string
  onMaskReady: (maskBlob: Blob) => void
  disabled:    boolean
  color:       string
}

type BrushMode = 'brush' | 'eraser'

function RemoveObjectCanvas({
  imageFile, previewSrc, onMaskReady, disabled, color,
}: RemoveObjectCanvasProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const maskRef     = useRef<HTMLCanvasElement>(null)   // offscreen mask (B&W)
  const containerRef= useRef<HTMLDivElement>(null)
  const isDrawing   = useRef(false)
  const lastPos     = useRef<{ x:number; y:number } | null>(null)
  const history     = useRef<ImageData[]>([])
  const historyIdx  = useRef(-1)

  const [brushSize,    setBrushSize]    = useState(24)
  const [brushMode,    setBrushMode]    = useState<BrushMode>('brush')
  const [showMask,     setShowMask]     = useState(true)
  const [hasMask,      setHasMask]      = useState(false)
  const [naturalSize,  setNaturalSize]  = useState({ w:0, h:0 })
  const [canvasSize,   setCanvasSize]   = useState({ w:0, h:0 })

  // Load image onto display canvas
  // Fix: use requestAnimationFrame to wait for container paint,
  // then measure clientWidth correctly
  useEffect(() => {
    let cancelled = false

    const loadImage = (containerW: number) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'  // allow canvas readback (getImageData)
      img.onload = () => {
        if (cancelled) return
        const maxW = Math.max(containerW, 300)  // fallback minimum 300px
        const maxH = 420
        const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
        const w = Math.max(1, Math.round(img.naturalWidth  * ratio))
        const h = Math.max(1, Math.round(img.naturalHeight * ratio))

        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
        setCanvasSize({ w, h })

        // Draw image on next tick after state updates applied
        requestAnimationFrame(() => {
          if (cancelled) return
          const canvas = canvasRef.current
          if (!canvas) return
          canvas.width = w; canvas.height = h
          const ctx = canvas.getContext('2d')!
          ctx.clearRect(0, 0, w, h)
          ctx.drawImage(img, 0, 0, w, h)

          const mask = maskRef.current
          if (!mask) return
          mask.width = img.naturalWidth; mask.height = img.naturalHeight
          const mCtx = mask.getContext('2d')!
          mCtx.fillStyle = '#000000'
          mCtx.fillRect(0, 0, mask.width, mask.height)

          history.current = [ctx.getImageData(0, 0, w, h)]
          historyIdx.current = 0
        })
      }
      img.onerror = () => console.error('[canvas] failed to load image')
      img.src = previewSrc
    }

    // Wait for container to be painted and have real dimensions
    const tryLoad = () => {
      const container = containerRef.current
      if (container && container.clientWidth > 0) {
        loadImage(container.clientWidth)
      } else {
        // Container not ready yet — retry on next frame
        requestAnimationFrame(tryLoad)
      }
    }

    requestAnimationFrame(tryLoad)
    return () => { cancelled = true }
  }, [previewSrc])

  // Get canvas-relative position from pointer event
  const getPos = useCallback((e: React.PointerEvent): { x:number; y:number } => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvasSize.w / rect.width),
      y: (e.clientY - rect.top)  * (canvasSize.h / rect.height),
    }
  }, [canvasSize])

  // Map display coords → natural image coords
  const toNatural = useCallback((x:number, y:number) => ({
    nx: (x / canvasSize.w) * naturalSize.w,
    ny: (y / canvasSize.h) * naturalSize.h,
    nr: (brushSize / canvasSize.w) * naturalSize.w,
  }), [canvasSize, naturalSize, brushSize])

  const draw = useCallback((x:number, y:number, fromX:number|null, fromY:number|null) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx    = canvas.getContext('2d')!
    const mask   = maskRef.current;  if (!mask) return
    const mCtx   = mask.getContext('2d')!

    const isErase  = brushMode === 'eraser'
    const { nx, ny, nr } = toNatural(x, y)

    // ── Draw on display canvas (semi-transparent overlay) ────
    ctx.globalCompositeOperation = isErase ? 'destination-out' : 'source-over'

    if (!isErase) {
      // Pink overlay for brushed area
      ctx.fillStyle   = `${color}88`   // 53% opacity
      ctx.strokeStyle = `${color}88`
    } else {
      ctx.fillStyle   = 'rgba(0,0,0,1)'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    }

    ctx.lineWidth   = brushSize
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    if (fromX !== null && fromY !== null) {
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'

    // ── Update mask canvas (B&W, full res) ──────────────────
    mCtx.fillStyle = isErase ? '#000000' : '#FFFFFF'
    mCtx.beginPath()
    mCtx.arc(nx, ny, nr / 2, 0, Math.PI * 2)
    mCtx.fill()

    if (fromX !== null && fromY !== null) {
      const { nx:fnx, ny:fny } = toNatural(fromX, fromY)
      mCtx.lineWidth   = nr
      mCtx.lineCap     = 'round'
      mCtx.strokeStyle = isErase ? '#000000' : '#FFFFFF'
      mCtx.beginPath()
      mCtx.moveTo(fnx, fny)
      mCtx.lineTo(nx, ny)
      mCtx.stroke()
    }
  }, [brushMode, brushSize, color, toNatural])

  const saveHistory = useCallback(() => {
    const ctx = canvasRef.current!.getContext('2d')!
    const { w, h } = canvasSize
    if (w === 0 || h === 0) return
    const snapshot = ctx.getImageData(0, 0, w, h)
    history.current = history.current.slice(0, historyIdx.current + 1)
    history.current.push(snapshot)
    historyIdx.current = history.current.length - 1
  }, [canvasSize])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    isDrawing.current = true
    const pos = getPos(e)
    lastPos.current = pos
    draw(pos.x, pos.y, null, null)
    setHasMask(true)
  }, [disabled, getPos, draw])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing.current || disabled) return
    const pos = getPos(e)
    draw(pos.x, pos.y, lastPos.current?.x ?? null, lastPos.current?.y ?? null)
    lastPos.current = pos
  }, [disabled, getPos, draw])

  const onPointerUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    lastPos.current   = null
    saveHistory()
    // Export mask and notify parent
    maskRef.current!.toBlob(blob => {
      if (blob) onMaskReady(blob)
    }, 'image/png')
  }, [saveHistory, onMaskReady])

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return
    historyIdx.current--
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.putImageData(history.current[historyIdx.current], 0, 0)
  }, [])

  const redo = useCallback(() => {
    if (historyIdx.current >= history.current.length - 1) return
    historyIdx.current++
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.putImageData(history.current[historyIdx.current], 0, 0)
  }, [])

  const clearMask = useCallback(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.current; if (!canvas) return
      const ctx    = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)
      ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h)
      const mask   = maskRef.current;  if (!mask) return
      const mCtx   = mask.getContext('2d')!
      mCtx.fillStyle = '#000000'
      mCtx.fillRect(0, 0, naturalSize.w, naturalSize.h)
      history.current   = [ctx.getImageData(0, 0, canvasSize.w, canvasSize.h)]
      historyIdx.current = 0
      setHasMask(false)
    }
    img.src = previewSrc
  }, [previewSrc, canvasSize, naturalSize])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:C.slate50, borderRadius:'10px', border:`1px solid ${C.slate200}`, flexWrap:'wrap' }}>
        {/* Brush / Eraser */}
        <div style={{ display:'flex', gap:'4px' }}>
          {([['brush','🖌️','Brush'], ['eraser','⬜','Hapus brush']] as const).map(([m,ic,label])=>(
            <button key={m} type="button" title={label} onClick={()=>setBrushMode(m)}
              style={{ width:'32px', height:'32px', borderRadius:'7px', border:`1.5px solid ${brushMode===m?color:C.slate200}`, background:brushMode===m?`${color}15`:C.white, cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s' }}>
              {ic}
            </button>
          ))}
        </div>

        {/* Brush size */}
        <div style={{ display:'flex', alignItems:'center', gap:'6px', flex:1, minWidth:'100px' }}>
          <span style={{ fontSize:'10px', color:C.slate500, whiteSpace:'nowrap' }}>Ukuran: <strong>{brushSize}px</strong></span>
          <input type="range" min={8} max={80} step={4} value={brushSize}
            onChange={e=>setBrushSize(+e.target.value)}
            style={{ flex:1, accentColor:color, cursor:'pointer' }}/>
        </div>

        {/* Undo / Redo */}
        <div style={{ display:'flex', gap:'3px' }}>
          <button type="button" onClick={undo} title="Undo"
            style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${C.slate200}`, background:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Undo2 size={13} color={C.slate500}/>
          </button>
          <button type="button" onClick={redo} title="Redo"
            style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${C.slate200}`, background:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Redo2 size={13} color={C.slate500}/>
          </button>
        </div>

        {/* Clear */}
        <button type="button" onClick={clearMask} title="Hapus semua brush"
          style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${C.slate200}`, background:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Trash2 size={13} color={C.slate400}/>
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef}
        style={{ position:'relative', borderRadius:'12px', overflow:'hidden', border:`2px solid ${hasMask?color:C.slate200}`, background:'#111', cursor:brushMode==='brush'?'crosshair':'cell', userSelect:'none', transition:'border-color .2s' }}>
        <canvas ref={canvasRef}
          width={canvasSize.w} height={canvasSize.h}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ display:'block', width:'100%', touchAction:'none' }}/>
        {/* Hidden mask canvas (offscreen) */}
        <canvas ref={maskRef} style={{ display:'none' }}/>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', fontSize:'11px', color:C.slate500 }}>
        <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
          <div style={{ width:'14px', height:'14px', borderRadius:'3px', background:`${color}60` }}/>
          <span>Area yang akan dihapus (brush)</span>
        </div>
        <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
          <div style={{ width:'14px', height:'14px', borderRadius:'3px', background:C.slate200 }}/>
          <span>Area yang dipertahankan</span>
        </div>
        {!hasMask && <span style={{ color:C.amber, fontWeight:600 }}>⬆ Brush area yang ingin dihapus dulu</span>}
        {hasMask && <span style={{ color:C.green, fontWeight:600 }}>✅ Area sudah ditandai — klik "Hapus Objek"</span>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// DROP ZONE (for non-remove-object tools)
// ══════════════════════════════════════════════════════════════
function DropZone({ onFile, preview, disabled }: {
  onFile: (f:File)=>void; preview:string|null; disabled:boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const onDrop = useCallback((e:React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) onFile(f)
  }, [onFile])

  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={e=>{ e.preventDefault(); setDrag(true) }}
      onDragLeave={()=>setDrag(false)}
      onDrop={onDrop}
      style={{
        width:'100%', aspectRatio:'1/1', maxHeight:'320px',
        borderRadius:'14px', border:`2px dashed ${drag?C.amber:C.slate200}`,
        background: drag ? C.amb50 : (preview ? 'transparent' : C.slate50),
        cursor: disabled ? 'default' : 'pointer', overflow:'hidden', position:'relative',
        display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
      }}>
      {preview
        ? <img src={preview} style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
        : <div style={{ textAlign:'center', padding:'24px' }}>
            <div style={{ fontSize:'36px', marginBottom:'12px' }}>📁</div>
            <div style={{ fontSize:'14px', fontWeight:600, color:C.slate600 }}>Klik atau drag foto ke sini</div>
            <div style={{ fontSize:'12px', color:C.slate400, marginTop:'4px' }}>JPG, PNG, WebP · Maks 10MB</div>
          </div>}
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e=>{ const f=e.target.files?.[0]; if(f) onFile(f); e.target.value='' }}/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function QuickToolsPage() {
  const [activeId,    setActiveId]    = useState<ToolId>('remove-bg')
  const [file,        setFile]        = useState<File|null>(null)
  const [previewSrc,  setPreviewSrc]  = useState<string|null>(null)
  const [maskBlob,    setMaskBlob]    = useState<Blob|null>(null)
  const [option,      setOption]      = useState('')
  const [loading,     setLoading]     = useState(false)
  const [progress,    setProgress]    = useState(0)
  const [error,       setError]       = useState('')
  const [resultSrc,   setResultSrc]   = useState<string|null>(null)
  const [showBefore,  setShowBefore]  = useState(false)

  const { access } = useToolAccess()
  const { isSuperuser } = useUserRole()
  const tool = TOOLS.find(t => t.id === activeId)!
  const ta = access[activeId]
  // Superuser BYPASS semua locking
  const toolLocked = !isSuperuser && !!ta && !ta.available

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setPreviewSrc(URL.createObjectURL(f))
    setResultSrc(null); setError(''); setProgress(0); setShowBefore(false); setMaskBlob(null)
    const t = TOOLS.find(x => x.id === activeId)!
    setOption(t.hasOptions ? (t as any).options.items[0].v : '')
  }, [activeId])

  const switchTool = (id: ToolId) => {
    setActiveId(id); setFile(null); setPreviewSrc(null); setResultSrc(null)
    setError(''); setProgress(0); setShowBefore(false); setMaskBlob(null)
    const t = TOOLS.find(x => x.id === id)!
    setOption(t.hasOptions ? (t as any).options.items[0].v : '')
  }

  const process = async () => {
    if (toolLocked) { setError(ta?.reason ?? 'Tool ini sedang tidak tersedia.'); return }
    if (!file) { setError('Upload gambar dulu ya!'); return }
    if (activeId === 'remove-object' && !maskBlob) {
      setError('Brush area yang ingin dihapus dulu di foto!')
      return
    }

    setLoading(true); setError(''); setResultSrc(null); setProgress(10); setShowBefore(false)

    try {
      const fd = new FormData()
      fd.append('image', file)

      if (activeId === 'remove-object') {
        // Send mask as separate field
        fd.append('mask',   maskBlob!, 'mask.png')
        fd.append('prompt', option)
      } else {
        if (option) fd.append('option', option)
      }

      const progInterval = setInterval(() => setProgress(p => p < 80 ? p + 8 : p), 800)
      const res = await fetch(tool.endpoint, { method:'POST', body:fd })
      clearInterval(progInterval); setProgress(90)

      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as Record<string,string>
        throw new Error(j.message ?? j.error ?? `Error ${res.status}`)
      }

      const ct = res.headers.get('content-type') ?? ''
      let blobUrl: string

      if (ct.startsWith('image/') || ct.includes('octet-stream')) {
        const blob = await res.blob()
        blobUrl = URL.createObjectURL(blob)
      } else {
        const j = await res.json() as Record<string,string>
        blobUrl = j.url ?? j.imageUrl ?? j.output
        if (!blobUrl) throw new Error('Tidak ada hasil dari server.')
      }

      setResultSrc(blobUrl); setProgress(100)
    } catch (e: any) {
      setError(e.message ?? 'Gagal memproses. Coba lagi.')
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!resultSrc) return
    const a = document.createElement('a')
    a.href = resultSrc
    // Detect extension dari content type header (kalau blob) atau default jpg
    const isPng = activeId === 'remove-bg' && option === 'transparent'
    const ext = isPng ? 'png' : 'jpg'
    a.download = `beesell-${activeId}${option ? '-' + option : ''}-${Date.now()}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const reset = () => {
    setFile(null); setPreviewSrc(null); setResultSrc(null)
    setError(''); setProgress(0); setShowBefore(false); setMaskBlob(null)
  }

  const isRemoveObject = activeId === 'remove-object'
  const canProcess     = file && (!isRemoveObject || maskBlob)

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', fontFamily:"'DM Sans',sans-serif", color:C.slate900 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box }
        input[type=range] { height:4px; cursor:pointer }
        ::-webkit-scrollbar { height:3px; width:3px }
        ::-webkit-scrollbar-thumb { background:${C.slate200}; border-radius:2px }
      `}</style>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'4px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={16} color="#fff"/>
          </div>
          <h1 style={{ fontSize:'22px', fontWeight:700 }}>Quick Tools</h1>
          <span style={{ padding:'3px 9px', borderRadius:'20px', background:'linear-gradient(135deg,#FEF3C7,#FDE68A)', border:'1px solid #FCD34D', fontSize:'11px', fontWeight:700, color:C.amber }}>⚡ Visual AI</span>
        </div>
        <p style={{ fontSize:'13px', color:C.slate500 }}>Edit foto produk dengan AI — cepat, sekali klik, siap upload marketplace</p>
      </div>

      {/* ── Tool Selector ─────────────────────────────────────── */}
      <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'10px', marginBottom:'20px', scrollbarWidth:'none' }}>
        {TOOLS.map(t => {
          const active = activeId === t.id
          return (
            <button key={t.id} type="button" onClick={() => switchTool(t.id as ToolId)}
              style={{ display:'flex', flexDirection:'column', gap:'5px', padding:'12px 14px', borderRadius:'14px', flexShrink:0, minWidth:'155px', border:`2px solid ${active?t.color:C.slate200}`, background:active?`${t.color}0d`:C.white, cursor:'pointer', textAlign:'left', position:'relative', boxShadow:active?`0 4px 16px ${t.color}25`:'none', transition:'all .14s', fontFamily:'inherit' }}>
              {(() => {
                const a = access[t.id]
                if (isSuperuser) {
                  return <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'#fff' }}>∞</div>
                }
                if (a && !a.available) {
                  const lbl = a.status === 'coming-soon' ? 'SOON' : a.locked ? '🔒' : 'OFF'
                  return <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background:a.status==='coming-soon'?C.amber:C.slate400, color:'#fff' }}>{lbl}</div>
                }
                if (a?.beta) return <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background:C.blue, color:'#fff' }}>BETA</div>
                return t.badge ? <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background:t.badgeBg ?? t.color, color:'#fff' }}>{t.badge}</div> : null
              })()}
              <span style={{ fontSize:'22px' }}>{t.icon}</span>
              <span style={{ fontSize:'12px', fontWeight:700, color:active?t.color:C.slate900 }}>{t.label}</span>
              <span style={{ fontSize:'10px', color:C.slate400, lineHeight:1.4 }}>{t.shortDesc}</span>
            </button>
          )
        })}
      </div>

      {/* ── Workspace ─────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: isRemoveObject ? '1fr' : '1fr 1fr', gap:'18px' }}>

        {/* LEFT: Input ─────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Tool info */}
          <div style={{ padding:'12px 14px', borderRadius:'12px', background:`${tool.color}0d`, border:`1.5px solid ${tool.color}25` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
              <span style={{ fontSize:'18px' }}>{tool.icon}</span>
              <span style={{ fontSize:'14px', fontWeight:700, color:tool.color }}>{tool.label}</span>
              {isRemoveObject && (
                <span style={{ marginLeft:'auto', fontSize:'11px', color:C.slate500, fontStyle:'italic' }}>
                  Brush → pilih isi → Hapus Objek
                </span>
              )}
            </div>
            <p style={{ fontSize:'12px', color:C.slate500, margin:0 }}>{tool.desc}</p>
          </div>

          {/* Remove Object: Show canvas after image loaded, else show dropzone */}
          {toolLocked ? (
            <div style={{ padding:'36px 20px', borderRadius:'14px', border:`1.5px solid ${ta?.status==='coming-soon'?C.amber+'55':C.slate200}`, background:ta?.status==='coming-soon'?C.amb50:C.slate50, textAlign:'center' }}>
              <div style={{ fontSize:'42px', marginBottom:'12px' }}>{ta?.status==='coming-soon'?'⏳':ta?.locked?'🔒':'🚧'}</div>
              <div style={{ fontSize:'16px', fontWeight:700, color:C.slate700, marginBottom:'6px' }}>
                {ta?.status==='coming-soon'?'Segera Hadir':ta?.locked?'Fitur Terkunci':'Tool Dinonaktifkan'}
              </div>
              <div style={{ fontSize:'12px', color:C.slate500, lineHeight:1.6, maxWidth:'340px', margin:'0 auto 16px' }}>{ta?.reason}</div>
              {ta?.locked && (
                <Link href="/billing" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'11px 20px', borderRadius:'10px', background:`linear-gradient(135deg,${C.amber},${C.amberDk})`, color:'#fff', fontSize:'13px', fontWeight:700, textDecoration:'none', boxShadow:C.sa }}>
                  ⚡ Upgrade Paket
                </Link>
              )}
            </div>
          ) : isRemoveObject ? (
            previewSrc && file ? (
              // ── Interactive Canvas Mode ──────────────────────
              <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'16px', alignItems:'start' }}>
                <RemoveObjectCanvas
                  imageFile={file}
                  previewSrc={previewSrc}
                  onMaskReady={setMaskBlob}
                  disabled={loading}
                  color={tool.color}
                />
                {/* Right panel: options + process */}
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {/* Reset image button */}
                  <button type="button" onClick={reset}
                    style={{ padding:'9px 14px', borderRadius:'9px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.slate600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px' }}>
                    <RotateCcw size={13}/> Ganti Foto
                  </button>

                  {/* Fill mode options */}
                  <div style={{ background:C.slate50, borderRadius:'12px', padding:'14px', border:`1px solid ${C.slate200}` }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:C.slate700, marginBottom:'10px' }}>Isi area dihapus dengan:</div>
                    {(tool as any).options.items.map((item: any) => (
                      <label key={item.v}
                        style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom:'8px', cursor:'pointer' }}>
                        <input type="radio" name="fill-mode" value={item.v} checked={option===item.v}
                          onChange={()=>setOption(item.v)}
                          style={{ marginTop:'2px', accentColor:tool.color }}/>
                        <div>
                          <div style={{ fontSize:'12px', fontWeight:600, color:C.slate700 }}>{item.l}</div>
                          <div style={{ fontSize:'10px', color:C.slate400 }}>{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Tips */}
                  <div style={{ padding:'12px', borderRadius:'10px', background:C.amb50, border:`1px solid ${C.amberLt}` }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:C.amberDk, marginBottom:'6px' }}>💡 Tips</div>
                    {tool.tips.map((tip,i)=>(
                      <div key={i} style={{ fontSize:'11px', color:C.slate600, lineHeight:1.5, marginBottom:'4px' }}>• {tip}</div>
                    ))}
                  </div>

                  {/* Process button */}
                  <button type="button" onClick={process} disabled={loading || !canProcess}
                    style={{ padding:'13px', borderRadius:'11px', border:'none', background:canProcess&&!loading?`linear-gradient(135deg,${tool.color},${tool.color}cc)`:C.slate300, color:'#fff', fontSize:'14px', fontWeight:700, cursor:canProcess&&!loading?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:canProcess&&!loading?`0 4px 16px ${tool.color}35`:'none', transition:'all .2s' }}>
                    {loading ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Memproses...</>
                              : <><Wand2 size={15}/> Hapus Objek</>}
                  </button>

                  {/* Progress */}
                  {loading && (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:C.slate500, marginBottom:'4px' }}>
                        <span>{progress < 40 ? 'Menganalisis area...' : progress < 70 ? 'AI inpainting...' : 'Finishing...'}</span>
                        <span>{progress}%</span>
                      </div>
                      <div style={{ height:'5px', background:C.slate100, borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${tool.color},${tool.color}bb)`, borderRadius:'3px', transition:'width .4s ease' }}/>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div style={{ padding:'10px 12px', borderRadius:'9px', background:'#FEF2F2', border:'1px solid #FECACA', fontSize:'12px', color:'#B91C1C' }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Result */}
                  {resultSrc && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      <div style={{ borderRadius:'12px', overflow:'hidden', border:`1px solid ${C.slate200}` }}>
                        <img src={resultSrc} style={{ width:'100%', display:'block' }}/>
                      </div>
                      <button type="button" onClick={download}
                        style={{ padding:'10px', borderRadius:'9px', border:'none', background:C.green, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                        <Download size={14}/> Download
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // ── Dropzone mode (belum upload foto) ───────────
              <DropZone onFile={handleFile} preview={null} disabled={false}/>
            )
          ) : (
            // ── Standard dropzone untuk tools lain ──────────
            <>
              <DropZone onFile={handleFile} preview={previewSrc} disabled={loading}/>
              {file && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', background:C.slate50, borderRadius:'8px', border:`1px solid ${C.slate200}` }}>
                  <span style={{ fontSize:'11px', color:C.slate600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{file.name}</span>
                  <span style={{ fontSize:'11px', color:C.slate400, marginLeft:'8px', flexShrink:0 }}>{(file.size/1024/1024).toFixed(1)} MB</span>
                  <button onClick={reset} style={{ background:'none', border:'none', cursor:'pointer', color:C.slate400, marginLeft:'6px', padding:0, lineHeight:1 }}>✕</button>
                </div>
              )}

              {/* Options */}
              {tool.hasOptions && (
                <div style={{ padding:'14px 16px', background:C.slate50, borderRadius:'12px', border:`1px solid ${C.slate200}` }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:C.slate700, marginBottom:'10px' }}>
                    {(tool as any).options.label}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {(tool as any).options.items.map((item: any) => (
                      <label key={item.v}
                        style={{ display:'flex', gap:'10px', alignItems:'center', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${option===item.v?tool.color:C.slate200}`, background:option===item.v?`${tool.color}08`:C.white, cursor:'pointer', transition:'all .12s' }}>
                        <input type="radio" name="tool-option" value={item.v} checked={option===item.v}
                          onChange={()=>setOption(item.v)} style={{ accentColor:tool.color }}/>
                        <div>
                          <div style={{ fontSize:'12px', fontWeight:600, color:option===item.v?tool.color:C.slate700 }}>{item.l}</div>
                          <div style={{ fontSize:'10px', color:C.slate400 }}>{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Process button */}
              <button type="button" onClick={process} disabled={!file||loading}
                style={{ padding:'13px', borderRadius:'11px', border:'none', background:file&&!loading?`linear-gradient(135deg,${tool.color},${tool.color}cc)`:C.slate300, color:'#fff', fontSize:'14px', fontWeight:700, cursor:file&&!loading?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:file&&!loading?`0 4px 16px ${tool.color}35`:'none', transition:'all .2s' }}>
                {loading ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Memproses...</>
                          : <><Wand2 size={15}/> Proses dengan AI</>}
              </button>

              {/* Progress */}
              {loading && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:C.slate500, marginBottom:'4px' }}>
                    <span>{progress < 30 ? 'Mengirim ke AI...' : progress < 60 ? 'AI memproses...' : progress < 90 ? 'Hampir selesai...' : 'Finishing...'}</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ height:'5px', background:C.slate100, borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${tool.color},${tool.color}bb)`, borderRadius:'3px', transition:'width .4s ease' }}/>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ padding:'10px 12px', borderRadius:'9px', background:'#FEF2F2', border:'1px solid #FECACA', fontSize:'12px', color:'#B91C1C' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Tips */}
              <div style={{ padding:'12px 14px', background:C.amb50, borderRadius:'10px', border:`1px solid ${C.amberLt}` }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:C.amberDk, marginBottom:'5px' }}>💡 Tips</div>
                {tool.tips.map((t,i)=>(
                  <div key={i} style={{ fontSize:'11px', color:C.slate600, lineHeight:1.5, marginBottom:'3px' }}>• {t}</div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Result (non-remove-object only) ─────────── */}
        {!isRemoveObject && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ padding:'12px 14px', borderRadius:'12px', background:resultSrc?`${C.green}08`:`${C.slate100}`, border:`1.5px solid ${resultSrc?C.green:C.slate200}`, minHeight:'280px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:resultSrc?'flex-start':'center', gap:'10px' }}>
              {resultSrc ? (
                <>
                  <div style={{ width:'100%', borderRadius:'10px', overflow:'hidden', background:'#f0f0f0', position:'relative' }}>
                    <img src={showBefore&&previewSrc ? previewSrc : resultSrc} style={{ width:'100%', display:'block', maxHeight:'320px', objectFit:'contain' }}/>
                    <div style={{ position:'absolute', top:'8px', left:'8px', padding:'3px 8px', borderRadius:'5px', background:'rgba(0,0,0,.6)', fontSize:'10px', fontWeight:700, color:'#fff' }}>
                      {showBefore ? 'SEBELUM' : 'SESUDAH'}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px', width:'100%' }}>
                    <button type="button"
                      onMouseDown={()=>setShowBefore(true)} onMouseUp={()=>setShowBefore(false)}
                      onTouchStart={()=>setShowBefore(true)} onTouchEnd={()=>setShowBefore(false)}
                      style={{ flex:1, padding:'9px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', fontWeight:600, color:C.slate600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                      <Eye size={13}/> Tahan = Sebelum
                    </button>
                    <button type="button" onClick={download}
                      style={{ flex:1, padding:'9px', borderRadius:'8px', border:'none', background:C.green, color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                      <Download size={13}/> Download
                    </button>
                  </div>
                  <button type="button" onClick={reset}
                    style={{ width:'100%', padding:'8px', borderRadius:'8px', border:`1px solid ${C.slate200}`, background:C.white, fontSize:'12px', color:C.slate500, cursor:'pointer', fontFamily:'inherit' }}>
                    Proses Foto Lain
                  </button>
                </>
              ) : (
                <div style={{ textAlign:'center', color:C.slate400 }}>
                  <div style={{ fontSize:'40px', marginBottom:'12px' }}>{tool.icon}</div>
                  <div style={{ fontSize:'13px', fontWeight:600, marginBottom:'4px' }}>Hasil akan muncul di sini</div>
                  <div style={{ fontSize:'11px' }}>{tool.outputFormat}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}