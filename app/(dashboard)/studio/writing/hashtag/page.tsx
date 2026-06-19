'use client'
// app/(dashboard)/studio/writing/hashtag/page.tsx
// ══════════════════════════════════════════════════════════════
// Hashtag AI — Tool Page
// API: POST /api/studio/writing/hashtag
// Daily limit: Basic 5 | Pro 15 | Business 40
// ══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, RefreshCw, TrendingUp, Layers, Crosshair } from 'lucide-react'
import { useDailyUsage } from '@/hooks/use-daily-usage'
import { 
  ToolLayout, TwoColLayout, FormStyles, EmptyOutputState,
  callToolAPI, type ToolLimitError,
} from '@/components/tool-shared/tool-layout'
import { DailyLimitModal } from '@/components/daily-limit/daily-limit-modal'

const C = {
  purple:'#7C3AED', purpleBg:'#F5F3FF',
  pink:'#EC4899', green:'#10B981', greenBg:'#D1FAE5',
  amber:'#F59E0B', amberBg:'#FEF3C7',
  blue:'#3B82F6', blueBg:'#DBEAFE',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate200:'#E2E8F0',
  slate100:'#F1F5F9', slate50:'#F8FAFC',
}

interface HashtagOutput {
  high_volume: string[]
  mid_volume:  string[]
  niche:       string[]
}

const LOCATIONS = [
  { id: '', label: 'Tidak spesifik' },
  { id: 'Jakarta',     label: 'Jakarta' },
  { id: 'Surabaya',    label: 'Surabaya' },
  { id: 'Bandung',     label: 'Bandung' },
  { id: 'Medan',       label: 'Medan' },
  { id: 'Yogyakarta',  label: 'Yogyakarta' },
  { id: 'Semarang',    label: 'Semarang' },
  { id: 'Makassar',    label: 'Makassar' },
  { id: 'Denpasar',    label: 'Denpasar' },
]

export default function HashtagAIPage() {
  const [product, setProduct] = useState('')
  const [niche, setNiche] = useState('')
  const [location, setLocation] = useState('')

  const [results, setResults] = useState<HashtagOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitError, setLimitError] = useState<ToolLimitError | null>(null)
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const { refresh: refreshUsage } = useDailyUsage()

  const handleGenerate = async () => {
    if (product.trim().length < 3) {
      setError('Nama produk minimal 3 karakter')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    const res = await callToolAPI<{ hashtags: HashtagOutput }>(
      '/api/studio/writing/hashtag',
      { 
        product, 
        niche: niche || undefined, 
        location: location || undefined,
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

    setResults(res.data.hashtags)
    refreshUsage()
  }

  const handleCopyCategory = async (tags: string[], category: string) => {
    try {
      await navigator.clipboard.writeText(tags.join(' '))
      setCopiedCategory(category)
      setTimeout(() => setCopiedCategory(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleCopyAll = async () => {
    if (!results) return
    const all = [
      ...results.high_volume,
      ...results.mid_volume,
      ...results.niche,
    ].join(' ')
    try {
      await navigator.clipboard.writeText(all)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <ToolLayout
      toolId="hashtag"
      toolLabel="Hashtag AI"
      icon="#️⃣"
      category="Writing AI"
      description="Hashtag mix populer + niche untuk reach maksimal"
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
                placeholder="Contoh: Lip cream matte tahan 24 jam"
                style={FormStyles.textarea}
                maxLength={500}
              />
              <div style={{ fontSize:11, color: C.slate400, marginTop:4 }}>
                {product.length}/500 karakter
              </div>
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={FormStyles.label}>Niche (opsional)</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Contoh: beauty, fashion, F&B, gadget"
                style={FormStyles.input}
                maxLength={100}
              />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={FormStyles.label}>Target lokasi (opsional)</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)}
                style={FormStyles.select}>
                {LOCATIONS.map(l => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
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
                  Generate Hashtag Mix
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
              <LoadingState message="Generating hashtag mix dengan strategy 3-tier..."/>
            ) : !results ? (
              <EmptyOutputState message="Hashtag mix akan muncul di sini"/>
            ) : (
              <div>
                {/* Copy All button */}
                <div style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  marginBottom:14,
                }}>
                  <div style={{
                    fontSize:11, color: C.slate500,
                    fontWeight:700, letterSpacing:'0.06em',
                  }}>
                    #️⃣ {results.high_volume.length + results.mid_volume.length + results.niche.length} HASHTAG TOTAL
                  </div>
                  <button onClick={handleCopyAll}
                    style={{
                      ...FormStyles.primaryButton(false),
                      padding:'8px 16px', fontSize:12,
                    }}>
                    {copiedAll ? (
                      <><Check size={13}/> All Copied!</>
                    ) : (
                      <><Copy size={13}/> Copy Semua</>
                    )}
                  </button>
                </div>

                {/* High Volume */}
                <HashtagSection
                  title="High Volume"
                  subtitle="Reach besar (1M+ posts)"
                  description="Untuk discovery, tapi competisi tinggi"
                  tags={results.high_volume}
                  color={C.green}
                  bgColor={C.greenBg}
                  icon={<TrendingUp size={14}/>}
                  isCopied={copiedCategory === 'high_volume'}
                  onCopy={() => handleCopyCategory(results.high_volume, 'high_volume')}
                />

                {/* Mid Volume */}
                <HashtagSection
                  title="Mid Volume"
                  subtitle="Sweet spot (100K-1M posts)"
                  description="Balance antara reach & engagement"
                  tags={results.mid_volume}
                  color={C.blue}
                  bgColor={C.blueBg}
                  icon={<Layers size={14}/>}
                  isCopied={copiedCategory === 'mid_volume'}
                  onCopy={() => handleCopyCategory(results.mid_volume, 'mid_volume')}
                />

                {/* Niche */}
                <HashtagSection
                  title="Niche"
                  subtitle="Targeted (<100K posts)"
                  description="Tertarget tinggi, audience spesifik"
                  tags={results.niche}
                  color={C.purple}
                  bgColor={C.purpleBg}
                  icon={<Crosshair size={14}/>}
                  isCopied={copiedCategory === 'niche'}
                  onCopy={() => handleCopyCategory(results.niche, 'niche')}
                />

                <div style={{
                  marginTop:14, padding:'12px 14px', borderRadius:10,
                  background: C.amberBg, borderLeft:`3px solid ${C.amber}`,
                  fontSize:12, color: C.slate700, lineHeight:1.6,
                }}>
                  💡 <strong>Strategi optimal:</strong> Pakai 5 high-volume + 10 mid-volume + 10 niche.
                  Total 25 hashtag yang balance untuk maximize reach + targeting.
                </div>
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
          toolLabel="Hashtag"
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
function HashtagSection({ title, subtitle, description, tags, color, bgColor, icon, isCopied, onCopy }: {
  title: string
  subtitle: string
  description: string
  tags: string[]
  color: string
  bgColor: string
  icon: React.ReactNode
  isCopied: boolean
  onCopy: () => void
}) {
  return (
    <div style={{
      ...FormStyles.card,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        gap:12, marginBottom:12,
      }}>
        <div style={{ flex:1 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:5,
            padding:'3px 9px', borderRadius:99,
            background: bgColor, color,
            fontSize:10, fontWeight:800, letterSpacing:'0.06em',
            marginBottom:6,
          }}>
            {icon} {title.toUpperCase()}
          </div>
          <div style={{ fontSize:13, fontWeight:700, color: C.slate900, marginBottom:2 }}>
            {subtitle}
          </div>
          <div style={{ fontSize:11, color: C.slate500 }}>
            {description} • {tags.length} hashtag
          </div>
        </div>
        <button onClick={onCopy}
          style={{
            ...FormStyles.secondaryButton,
            padding:'6px 12px', fontSize:11,
            display:'inline-flex', alignItems:'center', gap:5,
            flexShrink:0,
          }}>
          {isCopied ? (
            <><Check size={11} color={C.green}/> Copied!</>
          ) : (
            <><Copy size={11}/> Copy</>
          )}
        </button>
      </div>

      <div style={{
        display:'flex', flexWrap:'wrap', gap:6,
        padding:'12px 14px', borderRadius:8,
        background: C.slate50, border:`1px solid ${C.slate100}`,
      }}>
        {tags.map((tag, i) => (
          <span key={i} style={{
            padding:'4px 10px', borderRadius:99,
            background: color + '15', color,
            fontSize:12, fontWeight:600,
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
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