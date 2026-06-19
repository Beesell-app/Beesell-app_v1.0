'use client'
// app/(dashboard)/studio/writing/hook/page.tsx
// ══════════════════════════════════════════════════════════════
// Hook Generator — Tool Page
// API: POST /api/studio/writing/hook
// Daily limit: Basic 5 | Pro 15 | Business 40
// ══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, RefreshCw, Target, Lightbulb } from 'lucide-react'
import { useDailyUsage } from '@/hooks/use-daily-usage'
import { 
  ToolLayout, TwoColLayout, FormStyles, EmptyOutputState,
  callToolAPI, type ToolLimitError,
} from '@/components/tool-shared/tool-layout'
import { DailyLimitModal } from '@/components/daily-limit/daily-limit-modal'

const C = {
  purple:'#7C3AED', purpleBg:'#F5F3FF',
  pink:'#EC4899', green:'#10B981', amber:'#F59E0B',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate200:'#E2E8F0',
  slate100:'#F1F5F9', slate50:'#F8FAFC',
}

interface HookVariant {
  hook:   string
  why:    string
}

const NICHES = [
  { id: '', label: 'Pilih niche (opsional)' },
  { id: 'fashion',        label: '👗 Fashion & Aksesoris' },
  { id: 'beauty',         label: '💄 Beauty & Skincare' },
  { id: 'food',           label: '🍔 Food & Beverage' },
  { id: 'electronics',    label: '📱 Electronics & Gadget' },
  { id: 'home',           label: '🏠 Home & Furniture' },
  { id: 'baby-kids',      label: '👶 Baby & Kids' },
  { id: 'health',         label: '💊 Health & Fitness' },
  { id: 'automotive',     label: '🚗 Automotive' },
  { id: 'hobby',          label: '🎨 Hobby & Craft' },
]

export default function HookGeneratorPage() {
  const [product, setProduct] = useState('')
  const [niche, setNiche] = useState('')
  const [painPoint, setPainPoint] = useState('')

  const [results, setResults] = useState<HookVariant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitError, setLimitError] = useState<ToolLimitError | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const { refresh: refreshUsage } = useDailyUsage()

  const handleGenerate = async () => {
    if (product.trim().length < 3) {
      setError('Nama produk minimal 3 karakter')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([])

    const res = await callToolAPI<{ hooks: HookVariant[] }>(
      '/api/studio/writing/hook',
      { 
        product, 
        niche: niche || undefined, 
        pain_point: painPoint || undefined,
      },
    )

    setIsLoading(false)

    if (!res.ok) {
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

    setResults(res.data.hooks || [])
    refreshUsage()
  }

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
      toolId="hook"
      toolLabel="Hook Generator"
      icon="🎯"
      category="Writing AI"
      description="Hook 3-detik untuk caption TikTok/Reels yang viral"
    >
      <TwoColLayout
        form={
          <div style={FormStyles.card}>
            <div style={{ marginBottom:18 }}>
              <label style={FormStyles.label}>
                Nama produk <span style={{ color: C.purple }}>*</span>
              </label>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Contoh: Lip cream matte tahan 24 jam untuk bibir kering"
                style={FormStyles.textarea}
                maxLength={500}
              />
              <div style={{ fontSize:11, color: C.slate400, marginTop:4 }}>
                {product.length}/500 karakter
              </div>
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={FormStyles.label}>Niche produk (opsional)</label>
              <select value={niche} onChange={(e) => setNiche(e.target.value)}
                style={FormStyles.select}>
                {NICHES.map(n => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={FormStyles.label}>
                Pain point audience (opsional)
              </label>
              <input
                type="text"
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
                placeholder="Contoh: Bibir kering & pecah-pecah, lipstik luntur cepat"
                style={FormStyles.input}
                maxLength={200}
              />
              <div style={{ fontSize:11, color: C.slate500, marginTop:6, lineHeight:1.5 }}>
                💡 Tip: Hook lebih powerful kalau menyebutkan masalah spesifik yang dialami audience
              </div>
            </div>

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
                  Generate 5 Hook Viral
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
              <LoadingState message="Generating 5 hook viral dengan Claude Haiku 4.5..."/>
            ) : results.length === 0 ? (
              <EmptyOutputState message="5 hook viral akan muncul di sini"/>
            ) : (
              <div>
                <div style={{
                  fontSize:11, color: C.slate500, marginBottom:14,
                  fontWeight:700, letterSpacing:'0.06em',
                }}>
                  🎯 {results.length} HOOK VARIANT
                </div>
                {results.map((r, i) => (
                  <div key={i} style={FormStyles.card}>
                    <div style={{
                      display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                      gap:12, marginBottom:12,
                    }}>
                      <div style={{ flex:1 }}>
                        <div style={{
                          display:'inline-flex', alignItems:'center', gap:4,
                          padding:'3px 9px', borderRadius:99,
                          background: C.purpleBg, color: C.purple,
                          fontSize:10, fontWeight:800, marginBottom:8,
                          letterSpacing:'0.04em',
                        }}>
                          <Target size={10}/> HOOK #{i + 1}
                        </div>
                        <div style={{
                          fontSize:18, fontWeight:800, color: C.slate900,
                          lineHeight:1.4, letterSpacing:'-0.01em',
                        }}>
                          "{r.hook}"
                        </div>
                      </div>
                      <button onClick={() => handleCopy(r.hook, i)}
                        style={{
                          ...FormStyles.secondaryButton,
                          padding:'6px 12px', fontSize:11,
                          display:'inline-flex', alignItems:'center', gap:5,
                          flexShrink:0,
                        }}>
                        {copiedIndex === i ? (
                          <><Check size={11} color={C.green}/> Copied!</>
                        ) : (
                          <><Copy size={11}/> Copy</>
                        )}
                      </button>
                    </div>

                    {r.why && (
                      <div style={{
                        marginTop:10, padding:'10px 12px', borderRadius:8,
                        background: C.amber + '10', borderLeft:`3px solid ${C.amber}`,
                        display:'flex', alignItems:'flex-start', gap:8,
                      }}>
                        <Lightbulb size={14} color={C.amber}
                          style={{ flexShrink:0, marginTop:2 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{
                            fontSize:10, fontWeight:800, color: C.amber,
                            letterSpacing:'0.06em', marginBottom:3,
                          }}>
                            KENAPA POWERFUL
                          </div>
                          <div style={{
                            fontSize:12, color: C.slate700, lineHeight:1.5,
                          }}>
                            {r.why}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      />

      {limitError && (
        <DailyLimitModal
          isOpen={!!limitError}
          onClose={() => setLimitError(null)}
          toolId={limitError.tool_id}
          toolLabel="Hook"
          currentTier={limitError.current_tier}
          limit={limitError.limit}
          resetAt={limitError.reset_at}
          upgradeSuggestion={limitError.upgrade_suggestion}
        />
      )}
    </ToolLayout>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <div style={FormStyles.loadingBox}>
      <RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }}/>
      <span>{message}</span>
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}