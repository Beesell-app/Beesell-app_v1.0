'use client'
// app/(dashboard)/studio/writing/caption/page.tsx
// ══════════════════════════════════════════════════════════════
// Caption Generator — Tool Page
// API: POST /api/studio/writing/caption
// Daily limit: Basic 5 | Pro 15 | Business 40
// ══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { useDailyUsage } from '@/hooks/use-daily-usage'
import { 
  ToolLayout, TwoColLayout, FormStyles, EmptyOutputState,
  callToolAPI, type ToolLimitError,
} from '@/components/tool-shared/tool-layout'
import { DailyLimitModal } from '@/components/daily-limit/daily-limit-modal'

const C = {
  purple:'#7C3AED', purpleBg:'#F5F3FF',
  pink:'#EC4899', green:'#10B981',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate200:'#E2E8F0',
  slate100:'#F1F5F9', slate50:'#F8FAFC',
}

interface CaptionVariant {
  style:   string
  caption: string
}

const PLATFORMS = [
  { id: 'shopee',         label: 'Shopee' },
  { id: 'tokopedia',      label: 'Tokopedia' },
  { id: 'tiktok-shop',    label: 'TikTok Shop' },
  { id: 'instagram',      label: 'Instagram' },
]

const TONES = [
  { id: 'casual',         label: 'Santai & Friendly' },
  { id: 'professional',   label: 'Profesional' },
  { id: 'energetic',      label: 'Energetik & Excited' },
  { id: 'storytelling',   label: 'Storytelling' },
  { id: 'urgency',        label: 'Urgency & Promo' },
]

export default function CaptionGeneratorPage() {
  // Form state
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('casual')
  const [platform, setPlatform] = useState('shopee')
  
  // Output state
  const [results, setResults] = useState<CaptionVariant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitError, setLimitError] = useState<ToolLimitError | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const { refresh: refreshUsage } = useDailyUsage()

  // ── Handle submit ─────────────────────────────────────────
  const handleGenerate = async () => {
    if (product.trim().length < 3) {
      setError('Nama produk minimal 3 karakter')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([])

    const res = await callToolAPI<{ captions: CaptionVariant[] }>(
      '/api/studio/writing/caption',
      { product, audience: audience || undefined, tone, platform },
    )

    setIsLoading(false)

    if (!res.ok) {
      // 429 = daily limit hit
      if (res.status === 429 && res.error.upgrade_suggestion) {
        setLimitError({
          message:            res.error.message,
          tool_id:            res.error.tool_id,
          current_tier:       res.error.current_tier,
          limit:              res.error.limit,
          reset_at:           res.error.reset_at,
          upgrade_suggestion: res.error.upgrade_suggestion,
        })
        return
      }
      
      setError(res.error.message || 'Generation gagal, coba lagi')
      return
    }

    setResults(res.data.captions || [])
    refreshUsage()  // Update daily usage badge
  }

  // ── Copy to clipboard ─────────────────────────────────────
  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <ToolLayout
      toolId="caption"
      toolLabel="Caption Generator"
      icon="📝"
      category="Writing AI"
      description="Caption Shopee/Tokopedia yang convert dalam Bahasa Indonesia"
    >
      <TwoColLayout
        form={
          <div style={FormStyles.card}>
            {/* Product */}
            <div style={{ marginBottom:18 }}>
              <label style={FormStyles.label}>
                Nama produk <span style={{ color: C.purple }}>*</span>
              </label>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Contoh: Sepatu sneakers casual untuk pria, warna hitam, bahan kulit sintetis premium, cocok untuk kerja kantor maupun hangout"
                style={FormStyles.textarea}
                maxLength={500}
              />
              <div style={{ fontSize:11, color: C.slate400, marginTop:4 }}>
                {product.length}/500 karakter
              </div>
            </div>

            {/* Target audience */}
            <div style={{ marginBottom:18 }}>
              <label style={FormStyles.label}>Target audience (opsional)</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Contoh: Pria 25-35 tahun, pekerja kantoran"
                style={FormStyles.input}
                maxLength={200}
              />
            </div>

            {/* Tone */}
            <div style={{ marginBottom:18 }}>
              <label style={FormStyles.label}>Tone bahasa</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)}
                style={FormStyles.select}>
                {TONES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Platform */}
            <div style={{ marginBottom:24 }}>
              <label style={FormStyles.label}>Platform target</label>
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8,
              }}>
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)}
                    style={{
                      padding:'10px 12px', borderRadius:8,
                      background: platform === p.id ? C.purpleBg : '#fff',
                      color: platform === p.id ? C.purple : C.slate700,
                      border: `1.5px solid ${platform === p.id ? C.purple : C.slate200}`,
                      fontSize:12, fontWeight:700, cursor:'pointer',
                      fontFamily:'inherit',
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleGenerate} 
              disabled={isLoading || product.trim().length < 3}
              style={{
                ...FormStyles.primaryButton(isLoading || product.trim().length < 3),
                width:'100%', justifyContent:'center',
              }}>
              {isLoading ? (
                <>
                  <RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }}/>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16}/>
                  Generate 3 Caption
                </>
              )}
            </button>

            {error && (
              <div style={FormStyles.errorBox}>
                <strong style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <AlertCircle size={14}/> Error
                </strong>
                <div style={{ marginTop:4 }}>{error}</div>
              </div>
            )}

            <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
          </div>
        }
        output={
          <div>
            {isLoading ? (
              <LoadingState message="Generating 3 caption variants dengan Claude Haiku 4.5..."/>
            ) : results.length === 0 ? (
              <EmptyOutputState message="Hasil 3 caption akan muncul di sini"/>
            ) : (
              <div>
                <div style={{
                  fontSize:11, color: C.slate500, marginBottom:14,
                  fontWeight:700, letterSpacing:'0.06em',
                }}>
                  ✨ {results.length} VARIANT BERHASIL DI-GENERATE
                </div>
                {results.map((r, i) => (
                  <div key={i} style={FormStyles.card}>
                    <div style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      marginBottom:12,
                    }}>
                      <span style={{
                        padding:'4px 10px', borderRadius:99,
                        background: C.purpleBg, color: C.purple,
                        fontSize:11, fontWeight:800,
                      }}>
                        Variant {i + 1} • {r.style}
                      </span>
                      <button onClick={() => handleCopy(r.caption, i)}
                        style={{
                          ...FormStyles.secondaryButton,
                          padding:'6px 12px', fontSize:11,
                          display:'inline-flex', alignItems:'center', gap:5,
                        }}>
                        {copiedIndex === i ? (
                          <><Check size={11} color={C.green}/> Copied!</>
                        ) : (
                          <><Copy size={11}/> Copy</>
                        )}
                      </button>
                    </div>
                    <div style={{
                      fontSize:14, color: C.slate900, lineHeight:1.7,
                      whiteSpace:'pre-wrap',
                    }}>
                      {r.caption}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* Daily Limit Modal */}
      {limitError && (
        <DailyLimitModal
          isOpen={!!limitError}
          onClose={() => setLimitError(null)}
          toolId={limitError.tool_id}
          toolLabel="Caption"
          currentTier={limitError.current_tier}
          limit={limitError.limit}
          resetAt={limitError.reset_at}
          upgradeSuggestion={limitError.upgrade_suggestion}
        />
      )}
    </ToolLayout>
  )
}

// ══════════════════════════════════════════════════════════════
function LoadingState({ message }: { message: string }) {
  return (
    <div style={FormStyles.loadingBox}>
      <RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }}/>
      <span>{message}</span>
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}