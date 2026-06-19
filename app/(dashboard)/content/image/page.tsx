'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Download, Lock, AlertCircle, ImageIcon } from 'lucide-react'
import { ToolGate }        from '@/components/studio/ToolGate'
import { ToolAccessBadge } from '@/components/studio/ToolAccessBadge'
import { useFeatureGate } from '@/hooks/use-feature-gate'
import { IMAGE_QUALITY }  from '@/lib/ai/image/quality-tiers'
import { meetsTier }      from '@/components/dashboard/studio-menu-config'

const FEATURE_ID = 'ai-image-generator'

const STYLES = [
  { id: 'product-photo', label: 'Foto Produk', emoji: '📦' },
  { id: 'lifestyle',     label: 'Lifestyle',   emoji: '🌿' },
  { id: 'banner',        label: 'Banner Promo', emoji: '🎯' },
  { id: 'infographic',   label: 'Infografis',  emoji: '📊' },
  { id: 'social-media',  label: 'Social Media', emoji: '📱' },
  { id: 'thumbnail',     label: 'Thumbnail',   emoji: '🔥' },
]
const RATIOS = ['1:1', '4:5', '9:16', '16:9', '4:3']
const QUALITIES = Object.values(IMAGE_QUALITY)

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

  const [productName, setProductName] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [style, setStyle]   = useState('product-photo')
  const [ratio, setRatio]   = useState('1:1')
  const [bgColor, setBgColor] = useState('')
  const [quality, setQuality] = useState('standard')
  const [count, setCount]   = useState(1)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError]   = useState('')
  const [results, setResults] = useState<string[]>([])

  const canUse = (minTier: string) => gate.isSuperuser || meetsTier(gate.userTier ?? 'free', minTier as any)

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
    if (productName.trim().length < 2) { setError('Nama produk minimal 2 karakter.'); return }
    setLoading(true); setError(''); setResults([]); setProgress('Mengirim permintaan…')

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, productDesc, style, ratio, bgColor, quality, count }),
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
    <div className="max-w-5xl px-4 py-6 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-amber-900">
            <span className="text-amber-500">🖼️</span> AI Image Generator
          </h1>
          <p className="text-sm text-amber-700/70">Generate foto produk, banner & konten visual dari teks.</p>
        </div>
        <ToolAccessBadge featureId={FEATURE_ID} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        {/* Form */}
        <div className="p-5 space-y-5 bg-white border shadow-sm rounded-2xl border-amber-100">
          <div>
            <label className="block mb-1 text-sm font-semibold text-amber-900">Nama Produk</label>
            <input value={productName} onChange={e => setProductName(e.target.value)}
              placeholder="Serum Vitamin C 30ml"
              className="w-full px-3 py-2 text-sm border outline-none rounded-xl border-amber-200 focus:border-amber-400" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-amber-900">Deskripsi (opsional)</label>
            <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} rows={2}
              placeholder="Botol kaca amber, tekstur clear serum…"
              className="w-full px-3 py-2 text-sm border outline-none resize-none rounded-xl border-amber-200 focus:border-amber-400" />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-amber-900">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                    style === s.id ? 'border-amber-500 bg-amber-50 text-amber-900'
                                   : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-amber-900">Rasio</label>
            <div className="flex flex-wrap gap-2">
              {RATIOS.map(r => (
                <button key={r} onClick={() => setRatio(r)}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                    ratio === r ? 'border-amber-500 bg-amber-50 text-amber-900'
                                : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-amber-900">Warna BG</label>
            <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)}
              placeholder="#FFFFFF / kosongkan"
              className="w-32 rounded-xl border border-amber-200 px-3 py-1.5 text-sm outline-none focus:border-amber-400" />
            <label className="ml-auto text-sm font-semibold text-amber-900">Jumlah</label>
            <select value={count} onChange={e => setCount(Number(e.target.value))}
              className="rounded-xl border border-amber-200 px-3 py-1.5 text-sm">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Quality + generate */}
        <div className="space-y-4">
          <div className="p-4 bg-white border shadow-sm rounded-2xl border-amber-100">
            <p className="mb-3 text-sm font-semibold text-amber-900">Kualitas</p>
            <div className="space-y-2">
              {QUALITIES.map(q => {
                const locked = !canUse(q.minTier)
                const active = quality === q.id
                return (
                  <button key={q.id} disabled={locked}
                    onClick={() => locked ? router.push(gate.upgradeHref ?? '/billing') : setQuality(q.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                      active ? 'border-amber-500 bg-amber-50'
                             : locked ? 'border-amber-100 bg-amber-50/40 opacity-70'
                                      : 'border-amber-200 hover:bg-amber-50'}`}>
                    <span>
                      <span className="text-sm font-semibold text-amber-900">{q.icon} {q.label}</span>
                      <span className="block text-xs text-amber-700/70">{q.desc}</span>
                    </span>
                    <span className="text-xs font-semibold text-amber-700">
                      {locked ? <Lock className="w-4 h-4" />
                              : gate.isSuperuser ? '∞' : `${q.cost} ⚡`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center justify-center w-full gap-2 px-4 py-3 font-semibold text-white transition rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Memproses…'}</>
                     : <><Sparkles className="w-4 h-4" /> Generate</>}
          </button>
        </div>
      </div>

      {/* Hasil */}
      <div className="mt-8">
        {loading && results.length === 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center justify-center aspect-square rounded-xl bg-amber-50">
                <ImageIcon className="w-8 h-8 animate-pulse text-amber-300" />
              </div>
            ))}
          </div>
        )}
        {results.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {results.map((url, i) => (
              <div key={i} className="relative overflow-hidden border group rounded-xl border-amber-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`hasil-${i}`} className="object-cover w-full aspect-square" />
                <a href={url} download target="_blank" rel="noreferrer"
                  className="absolute p-2 transition rounded-lg shadow opacity-0 bottom-2 right-2 bg-white/90 group-hover:opacity-100">
                  <Download className="w-4 h-4 text-amber-700" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}