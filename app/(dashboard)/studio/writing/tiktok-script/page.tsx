'use client'
// app/(dashboard)/studio/writing/tiktok-script/page.tsx
// ══════════════════════════════════════════════════════════════
// TikTok Script — Tool Page
// API: POST /api/studio/writing/tiktok-script
// Daily limit: Basic 2 | Pro 8 | Business 20
// ══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, RefreshCw, Clock, Camera, Download } from 'lucide-react'
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
  red:'#EF4444', redBg:'#FEE2E2',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate200:'#E2E8F0',
  slate100:'#F1F5F9', slate50:'#F8FAFC',
}

interface ScriptSegment {
  section:     string
  time:        string
  script:      string
  visual_note: string
}

interface TikTokScript {
  title:               string
  duration_sec:        number
  segments:            ScriptSegment[]
  caption_pendamping?: string
  hashtags?:           string[]
}

const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
  'HOOK':     { bg: C.redBg,   text: C.red },
  'PROBLEM':  { bg: C.amberBg, text: C.amber },
  'SOLUTION': { bg: C.blueBg,  text: C.blue },
  'PROOF':    { bg: C.greenBg, text: C.green },
  'CTA':      { bg: C.purpleBg, text: C.purple },
}

const GOALS = [
  { id: 'conversion',  label: '🎯 Conversion (Drive Sales)' },
  { id: 'awareness',   label: '📢 Awareness (Build Brand)' },
  { id: 'engagement',  label: '💬 Engagement (Comments & Likes)' },
]

const DURATIONS = [
  { id: 15, label: '15 detik (snappy)' },
  { id: 30, label: '30 detik (recommended)' },
  { id: 60, label: '60 detik (storytelling)' },
]

export default function TiktokScriptPage() {
  const [product, setProduct] = useState('')
  const [goal, setGoal] = useState<'awareness' | 'conversion' | 'engagement'>('conversion')
  const [duration, setDuration] = useState<15 | 30 | 60>(30)

  const [result, setResult] = useState<TikTokScript | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitError, setLimitError] = useState<ToolLimitError | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [copiedFull, setCopiedFull] = useState(false)

  const { refresh: refreshUsage } = useDailyUsage()

  const handleGenerate = async () => {
    if (product.trim().length < 3) {
      setError('Nama produk minimal 3 karakter')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    const res = await callToolAPI<{ script: TikTokScript }>(
      '/api/studio/writing/tiktok-script',
      { product, goal, duration },
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

    setResult(res.data.script)
    refreshUsage()
  }

  const handleCopySegment = async (segment: ScriptSegment) => {
    try {
      await navigator.clipboard.writeText(segment.script)
      setCopiedSection(segment.section)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleCopyFull = async () => {
    if (!result) return
    const fullText = result.segments
      .map(s => `[${s.section} ${s.time}]\n${s.script}\n\nVisual: ${s.visual_note}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedFull(true)
      setTimeout(() => setCopiedFull(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleDownload = () => {
    if (!result) return
    
    const content = `TIKTOK SCRIPT: ${result.title}
Durasi: ${result.duration_sec} detik
═══════════════════════════════════════

${result.segments.map(s => 
`[${s.section} • ${s.time}]
${s.script}

📹 Visual: ${s.visual_note}
`).join('\n───────────────────\n\n')}

═══════════════════════════════════════
${result.caption_pendamping ? `
CAPTION PENDAMPING:
${result.caption_pendamping}
` : ''}
${result.hashtags && result.hashtags.length > 0 ? `
HASHTAGS:
${result.hashtags.join(' ')}
` : ''}`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tiktok-script-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout
      toolId="tiktok-script"
      toolLabel="TikTok Script"
      icon="🎙️"
      category="Writing AI"
      description="Script video TikTok 30-60 detik dengan struktur viral"
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
                placeholder="Contoh: Lip cream matte tahan 24 jam, formula moisturizing, 12 warna nude tone"
                style={FormStyles.textarea}
                maxLength={500}
              />
              <div style={{ fontSize:11, color: C.slate400, marginTop:4 }}>
                {product.length}/500 karakter
              </div>
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={FormStyles.label}>Goal video</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value as any)}
                style={FormStyles.select}>
                {GOALS.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={FormStyles.label}>Durasi video</label>
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8,
              }}>
                {DURATIONS.map(d => (
                  <button key={d.id} onClick={() => setDuration(d.id as any)}
                    style={{
                      padding:'10px 8px', borderRadius:8,
                      background: duration === d.id ? C.purpleBg : '#fff',
                      color: duration === d.id ? C.purple : C.slate700,
                      border: `1.5px solid ${duration === d.id ? C.purple : C.slate200}`,
                      fontSize:11, fontWeight:700, cursor:'pointer',
                      fontFamily:'inherit', lineHeight:1.4,
                    }}>
                    {d.label}
                  </button>
                ))}
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
                  Generating script...
                </>
              ) : (
                <>
                  <Sparkles size={16}/>
                  Generate Script TikTok
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
              <LoadingState message="Building script dengan struktur HOOK→PROBLEM→SOLUTION→PROOF→CTA..."/>
            ) : !result ? (
              <EmptyOutputState message="Script TikTok akan muncul di sini dengan struktur per segmen"/>
            ) : (
              <div>
                {/* Header dengan title + action buttons */}
                <div style={{
                  ...FormStyles.card,
                  background: `linear-gradient(135deg, ${C.purple}08, ${C.pink}08)`,
                  borderLeft: `4px solid ${C.purple}`,
                }}>
                  <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                    gap:12, marginBottom:8,
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{
                        fontSize:10, fontWeight:800, color: C.purple,
                        letterSpacing:'0.06em', marginBottom:6,
                      }}>
                        🎙️ SCRIPT BERHASIL DI-GENERATE
                      </div>
                      <h3 style={{
                        fontSize:18, fontWeight:800, color: C.slate900,
                        marginBottom:6, lineHeight:1.3,
                      }}>
                        {result.title}
                      </h3>
                      <div style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        fontSize:12, color: C.slate600,
                      }}>
                        <Clock size={12}/>
                        Durasi: <strong>{result.duration_sec} detik</strong> •{' '}
                        <strong>{result.segments.length} segmen</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:14 }}>
                    <button onClick={handleCopyFull}
                      style={{
                        ...FormStyles.secondaryButton,
                        padding:'8px 14px', fontSize:12,
                        display:'inline-flex', alignItems:'center', gap:6,
                      }}>
                      {copiedFull ? (
                        <><Check size={12} color={C.green}/> Full Copied!</>
                      ) : (
                        <><Copy size={12}/> Copy Full Script</>
                      )}
                    </button>
                    <button onClick={handleDownload}
                      style={{
                        ...FormStyles.secondaryButton,
                        padding:'8px 14px', fontSize:12,
                        display:'inline-flex', alignItems:'center', gap:6,
                      }}>
                      <Download size={12}/> Download .txt
                    </button>
                  </div>
                </div>

                {/* Segments */}
                {result.segments.map((seg, i) => {
                  const colorScheme = SECTION_COLORS[seg.section] ?? { bg: C.slate100, text: C.slate600 }
                  return (
                    <div key={i} style={{
                      ...FormStyles.card,
                      borderLeft: `3px solid ${colorScheme.text}`,
                    }}>
                      <div style={{
                        display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                        gap:12, marginBottom:12,
                      }}>
                        <div style={{ flex:1 }}>
                          <div style={{
                            display:'inline-flex', alignItems:'center', gap:8,
                            marginBottom:6,
                          }}>
                            <span style={{
                              padding:'3px 10px', borderRadius:99,
                              background: colorScheme.bg, color: colorScheme.text,
                              fontSize:10, fontWeight:800, letterSpacing:'0.06em',
                            }}>
                              {seg.section}
                            </span>
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:4,
                              fontSize:11, color: C.slate500, fontWeight:600,
                            }}>
                              <Clock size={11}/> {seg.time}
                            </span>
                          </div>
                          <div style={{
                            fontSize:14, color: C.slate900, lineHeight:1.6,
                            whiteSpace:'pre-wrap',
                          }}>
                            {seg.script}
                          </div>
                        </div>
                        <button onClick={() => handleCopySegment(seg)}
                          style={{
                            ...FormStyles.secondaryButton,
                            padding:'6px 12px', fontSize:11,
                            display:'inline-flex', alignItems:'center', gap:5,
                            flexShrink:0,
                          }}>
                          {copiedSection === seg.section ? (
                            <><Check size={11} color={C.green}/> Copied!</>
                          ) : (
                            <><Copy size={11}/></>
                          )}
                        </button>
                      </div>

                      {seg.visual_note && (
                        <div style={{
                          marginTop:10, padding:'10px 12px', borderRadius:8,
                          background: C.slate50, border:`1px solid ${C.slate100}`,
                          display:'flex', alignItems:'flex-start', gap:8,
                        }}>
                          <Camera size={14} color={C.slate500}
                            style={{ flexShrink:0, marginTop:2 }}/>
                          <div style={{ flex:1 }}>
                            <div style={{
                              fontSize:9, fontWeight:800, color: C.slate500,
                              letterSpacing:'0.06em', marginBottom:3,
                            }}>
                              VISUAL NOTE
                            </div>
                            <div style={{
                              fontSize:12, color: C.slate700, lineHeight:1.5,
                            }}>
                              {seg.visual_note}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Caption pendamping */}
                {result.caption_pendamping && (
                  <div style={FormStyles.card}>
                    <div style={{
                      fontSize:10, fontWeight:800, color: C.slate500,
                      letterSpacing:'0.06em', marginBottom:6,
                    }}>
                      💬 CAPTION PENDAMPING UNTUK POST
                    </div>
                    <div style={{
                      fontSize:13, color: C.slate900, lineHeight:1.6,
                    }}>
                      {result.caption_pendamping}
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {result.hashtags && result.hashtags.length > 0 && (
                  <div style={FormStyles.card}>
                    <div style={{
                      fontSize:10, fontWeight:800, color: C.slate500,
                      letterSpacing:'0.06em', marginBottom:8,
                    }}>
                      #️⃣ HASHTAGS REKOMENDASI
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {result.hashtags.map((tag, i) => (
                        <span key={i} style={{
                          padding:'4px 10px', borderRadius:99,
                          background: C.purpleBg, color: C.purple,
                          fontSize:12, fontWeight:600,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
          toolLabel="TikTok Script"
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