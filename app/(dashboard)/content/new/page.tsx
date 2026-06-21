'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Loader2, Sparkles, Download, Lock, AlertCircle, 
  ImageIcon, UploadCloud, X, Palette
} from 'lucide-react'
import { ToolGate }        from '@/components/studio/ToolGate'
import { ToolAccessBadge } from '@/components/studio/ToolAccessBadge'
import { useFeatureGate }  from '@/hooks/use-feature-gate'
import { IMAGE_QUALITY }   from '@/lib/ai/image/quality-tiers'
import { meetsTier }       from '@/components/dashboard/studio-menu-config'

const FEATURE_ID = 'ai-image-generator'

// ── 1. Expanded Styles (Mesin Visual Marketing) ──
const STYLES = [
  { id: 'studio',       label: 'Foto Produk Studio', emoji: '📸' },
  { id: 'lifestyle',    label: 'Lifestyle Image',    emoji: '🌿' },
  { id: 'model',        label: 'Dipegang Model',     emoji: '🧍‍♀️' },
  { id: 'banner',       label: 'Banner Promo',       emoji: '🎯' },
  { id: 'discount',     label: 'Poster Diskon',      emoji: '🏷️' },
  { id: 'instagram',    label: 'Konten Instagram',   emoji: '📱' },
  { id: 'hero',         label: 'Hero Website',       emoji: '💻' },
  { id: 'custom-bg',    label: 'Pantai, Kafe, dll',  emoji: '🏖️' },
]

const RATIOS = ['1:1', '4:5', '9:16', '16:9', '4:3']
const QUALITIES = Object.values(IMAGE_QUALITY)

// ── 2. Preset Palette Warna ──
const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#F3F4F6', // Basic: White, Black, Light Gray
  '#F59E0B', '#EF4444', '#3B82F6', // Vibrant: Amber, Red, Blue
  '#10B981', '#8B5CF6', '#EC4899', // Vibrant: Green, Purple, Pink
  '#FEF3C7', '#DBEAFE', '#FCE7F3', // Pastel: Yellow, Blue, Pink
]

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function ImageGeneratorPage() {
  return (
    <ToolGate featureId={FEATURE_ID} theme="light">
      <Inner />
    </ToolGate>
  )
}

function Inner() {
  const router = useRouter()
  const gate = useFeatureGate(FEATURE_ID)         // { userTier, isSuperuser, upgradeHref, ... }
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── States ──
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text')
  const [productName, setProductName] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  
  const [style, setStyle]   = useState('studio')
  const [ratio, setRatio]   = useState('1:1')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [quality, setQuality] = useState('standard')
  const [count, setCount]   = useState(1)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError]   = useState('')
  const [results, setResults] = useState<string[]>([])

  const canUse = (minTier: string) => gate.isSuperuser || meetsTier(gate.userTier ?? 'free', minTier as any)

  // ── Handlers ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setUploadedImage(url)
    }
  }

  const removeImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function pollJob(id: string): Promise<string> {
    for (let i = 0; i < 48; i++) {
      await sleep(2500)
      const r = await fetch(`/api/jobs/${id}/status`)
      if (!r.ok) continue
      const j = await r.json()
      if (j.status === 'completed' && j.result?.imageUrl) return j.result.imageUrl
      if (j.status === 'failed') throw new Error(j.error || 'Generate gagal')
    }
    throw new Error('Timeout — coba lagi sebentar')
  }

  async function handleGenerate() {
    if (inputMode === 'text' && productName.trim().length < 2) { 
      setError('Nama produk minimal 2 karakter.'); return 
    }
    if (inputMode === 'image' && !uploadedImage) {
      setError('Silakan upload foto produk terlebih dahulu.'); return
    }

    setLoading(true); setError(''); setResults([]); setProgress('Mengirim permintaan…')

    try {
      const payload = {
        inputMode,
        productName: inputMode === 'text' ? productName : undefined,
        productDesc,
        uploadedImage: inputMode === 'image' ? uploadedImage : undefined, // Idealnya base64 atau URL S3
        style, ratio, bgColor, quality, count
      }

      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 402) {
        const e = await res.json()
        setError(`Kualitas ini butuh plan ${String(e.requiredTier).toUpperCase()}.`)
        setLoading(false)
        return
      }
      if (res.status === 429) {
        const e = await res.json()
        setError(e.message || 'Kuota habis.'); setLoading(false); return
      }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.message || 'Gagal generate.')
      }

      const data = await res.json()
      const ids: string[] = data.jobIds ?? []
      setProgress(`Memproses ${ids.length} gambar…`)

      const urls = await Promise.all(ids.map(pollJob))
      setResults(urls)
      setProgress('')
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-amber-900">
            <span className="text-amber-500">🖼️</span> AI Visual Marketing Engine
          </h1>
          <p className="mt-1 text-sm text-amber-700/80">
            Mesin pembuat berbagai visual marketing. Upload foto produk atau ketik prompt untuk menghasilkan Foto Studio, Banner, hingga Lifestyle Image.
          </p>
        </div>
        <ToolAccessBadge featureId={FEATURE_ID} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        
        {/* ════ LEFT COLUMN: FORM ════ */}
        <div className="p-6 space-y-8 bg-white border shadow-sm rounded-2xl border-amber-100">
          
          {/* Input Method Toggle */}
          <div>
            <div className="flex gap-2 p-1 border rounded-xl bg-amber-50/50 border-amber-100">
              {(['text', 'image'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    inputMode === mode 
                      ? 'bg-white text-amber-900 shadow-sm border border-amber-200/50' 
                      : 'text-amber-700 hover:bg-amber-100/50'
                  }`}
                >
                  {mode === 'text' ? '✍️ Dari Text Prompt' : '📸 Dari Foto Produk'}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Input Area */}
          <div className="p-5 border rounded-xl border-amber-100 bg-amber-50/30">
            {inputMode === 'text' ? (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-bold text-amber-900">Nama Produk / Objek Utama</label>
                  <input value={productName} onChange={e => setProductName(e.target.value)}
                    placeholder="Contoh: Sepatu Sneakers Putih, Botol Parfum Elegan..."
                    className="w-full px-4 py-2.5 text-sm border outline-none rounded-xl border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-bold text-amber-900">Detail & Suasana (Opsional)</label>
                  <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} rows={2}
                    placeholder="Contoh: Suasana pagi hari, pencahayaan dramatis, gaya minimalis modern..."
                    className="w-full px-4 py-2.5 text-sm border outline-none resize-none rounded-xl border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block mb-1.5 text-sm font-bold text-amber-900">Upload Foto Produk Asli</label>
                {!uploadedImage ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 transition-colors bg-white border-2 border-dashed cursor-pointer rounded-xl border-amber-200 hover:bg-amber-50 hover:border-amber-400"
                  >
                    <UploadCloud className="w-8 h-8 mb-3 text-amber-400" />
                    <p className="text-sm font-semibold text-amber-900">Klik untuk upload foto</p>
                    <p className="mt-1 text-xs text-amber-600/70">PNG, JPG up to 5MB (Rekomendasi: Background transparan)</p>
                  </div>
                ) : (
                  <div className="relative inline-block p-2 bg-white border rounded-xl border-amber-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedImage} alt="Uploaded" className="object-contain h-32 rounded-lg" />
                    <button 
                      onClick={removeImage}
                      className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full translate-x-1/3 -translate-y-1/3 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                
                <div>
                  <label className="block mt-4 mb-1.5 text-sm font-bold text-amber-900">Instruksi Tambahan (Opsional)</label>
                  <input value={productDesc} onChange={e => setProductDesc(e.target.value)}
                    placeholder="Contoh: Letakkan di atas meja kayu dengan kopi..."
                    className="w-full px-4 py-2.5 text-sm border outline-none rounded-xl border-amber-200 focus:border-amber-500" />
                </div>
              </div>
            )}
          </div>

          {/* Configuration Grid */}
          <div className="space-y-6">
            {/* Style Selection */}
            <div>
              <label className="block mb-2.5 text-sm font-bold text-amber-900">Jenis Visual (Output)</label>
              <div className="flex flex-wrap gap-2.5">
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      style === s.id 
                        ? 'border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-600/20'
                        : 'border-amber-200 text-amber-800 bg-white hover:border-amber-400 hover:bg-amber-50'
                    }`}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Options */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Ratio */}
              <div>
                <label className="block mb-2.5 text-sm font-bold text-amber-900">Rasio Gambar</label>
                <div className="flex flex-wrap gap-2">
                  {RATIOS.map(r => (
                    <button key={r} onClick={() => setRatio(r)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        ratio === r 
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                          : 'border-amber-200 text-amber-700 bg-white hover:bg-amber-50'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color Picker */}
              <div>
                <label className="flex items-center gap-2 mb-2.5 text-sm font-bold text-amber-900">
                  <Palette className="w-4 h-4 text-amber-600" /> Warna Latar Belakang
                </label>
                <div className="p-3 bg-white border shadow-sm rounded-xl border-amber-100">
                  {/* Preset Palette */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_COLORS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setBgColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                          bgColor.toUpperCase() === c ? 'border-amber-500 scale-110 shadow-md' : 'border-gray-200 shadow-sm'
                        }`}
                        style={{ backgroundColor: c }} 
                        title={c}
                      />
                    ))}
                  </div>
                  {/* Hex Input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-700/70">HEX</span>
                    <input 
                      type="text" 
                      value={bgColor} 
                      onChange={e => setBgColor(e.target.value)}
                      placeholder="#FFFFFF"
                      className="w-full uppercase rounded-lg border border-amber-200 px-3 py-1.5 text-sm outline-none focus:border-amber-500 transition-colors" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT COLUMN: SETTINGS & ACTION ════ */}
        <div className="sticky space-y-4 top-6">
          
          {/* Action Card */}
          <div className="p-5 bg-white border shadow-sm rounded-2xl border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-amber-900">Jumlah Gambar</label>
              <select value={count} onChange={e => setCount(Number(e.target.value))}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 outline-none">
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} Variasi</option>)}
              </select>
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className="flex items-center justify-center w-full gap-2 px-4 py-3.5 font-bold text-white transition-all rounded-xl bg-amber-600 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-600/20 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {progress || 'Memproses…'}</>
                       : <><Sparkles className="w-5 h-5" /> Buat Gambar Sekarang</>}
            </button>
            
            {error && (
              <div className="flex items-start gap-2 p-3 mt-4 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Quality Settings */}
          <div className="p-5 bg-white border shadow-sm rounded-2xl border-amber-100">
            <p className="mb-3 text-sm font-bold text-amber-900">Kualitas Render AI</p>
            <div className="space-y-2">
              {QUALITIES.map(q => {
                const locked = !canUse(q.minTier)
                const active = quality === q.id
                return (
                  <button key={q.id} disabled={locked}
                    onClick={() => locked ? router.push(gate.upgradeHref ?? '/billing') : setQuality(q.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-all ${
                      active ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                             : locked ? 'border-gray-100 bg-gray-50 opacity-60'
                                      : 'border-amber-200 hover:bg-amber-50/50'}`}>
                    <span>
                      <span className={`text-sm font-bold flex items-center gap-2 ${locked ? 'text-gray-500' : 'text-amber-900'}`}>
                        {q.icon} {q.label}
                      </span>
                      <span className="block mt-0.5 text-xs text-amber-700/70">{q.desc}</span>
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {locked ? <Lock className="w-4 h-4 text-gray-400" />
                              : gate.isSuperuser ? '∞' : `${q.cost} ⚡`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ════ BOTTOM SECTION: RESULTS ════ */}
      <div className="mt-10">
        {loading && results.length === 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center justify-center w-full bg-amber-100/50 rounded-2xl aspect-square animate-pulse">
                <ImageIcon className="w-10 h-10 text-amber-300" />
              </div>
            ))}
          </div>
        )}
        
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-amber-900">Hasil Render</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {results.map((url, i) => (
                <div key={i} className="relative overflow-hidden transition-all border shadow-sm group rounded-2xl border-amber-200 hover:shadow-md hover:border-amber-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`hasil-${i}`} className="object-cover w-full transition-transform duration-500 aspect-square group-hover:scale-105" />
                  
                  <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:opacity-100" />
                  
                  <a href={url} download target="_blank" rel="noreferrer"
                    className="absolute flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all translate-y-4 bg-white rounded-lg shadow-lg opacity-0 bottom-3 right-3 text-amber-900 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-amber-50">
                    <Download className="w-4 h-4 text-amber-600" /> Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}