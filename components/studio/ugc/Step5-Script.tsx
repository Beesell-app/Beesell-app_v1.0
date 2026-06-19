// components/studio/ugc/Step5-Script.tsx
// ══════════════════════════════════════════════════════════════
// STEP 5: Generate & Review Script
// Generate script (free, unlimited) atau manual input

'use client'

import { useState } from 'react'
import { Loader2, RotateCcw, Copy, Check } from 'lucide-react'

interface Step5Props {
  formState: {
    contentType: string
    language: string
    productName: string
    targetMarket: string
    mainBenefit: string
    painPoint: string
    script: string
    scriptWordCount: number
  }
  onUpdate: (updates: Partial<Step5Props['formState']>) => void
  onNext: () => void
}

const C = {
  amber: '#F59E0B',
  amberDk: '#D97706',
  amberLt: '#FEF3C7',
  white: '#FFFFFF',
  bg: '#FAFAFA',
  border: '#E5E7EB',
  ink: '#111827',
  inkMuted: '#6B7280',
  green: '#059669',
  red: '#EF4444',
  sh: '0 1px 3px rgba(0,0,0,.06)',
}

export function Step5Script({
  formState,
  onUpdate,
  onNext,
}: Step5Props) {
  // ── State ───────────────────────────────────────────────
  const [generatingScript, setGeneratingScript] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isEditingScript, setIsEditingScript] = useState(false)

  // ── Generate Script Handler ─────────────────────────────
  const handleGenerateScript = async () => {
    // Validate inputs
    if (!formState.contentType || !formState.productName) {
      setScriptError('Lengkapi: Jenis Konten & Nama Produk di Step 1')
      return
    }

    if (!formState.language) {
      setScriptError('Pilih Bahasa terlebih dahulu')
      return
    }

    setGeneratingScript(true)
    setScriptError(null)

    try {
      // ── Call API to generate script ─────────────────────
      const response = await fetch('/api/studio/video/ugc?action=script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: formState.contentType,
          language: formState.language,
          accent: 'natural',
          duration: 30,
          productName: formState.productName,
          targetMarket: formState.targetMarket || 'general',
          mainBenefit: formState.mainBenefit || 'quality',
          painPoint: formState.painPoint || 'quality',
          productCategory: 'general',
          characterId: 'char-fem-01', // default
          videoPresetId: 'authentic-story', // default
        }),
      })

      // ── Handle response ─────────────────────────────────
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message ||
          errorData.error ||
          `Error: ${response.status}`
        )
      }

      const data = await response.json()

      // ── Update form with generated script ────────────────
      if (data.script) {
        onUpdate({
          script: data.script,
          scriptWordCount: data.wordCount || data.script.split(' ').length,
        })
        setIsEditingScript(false)
      } else {
        throw new Error('No script in response')
      }
    } catch (err: any) {
      console.error('[generateScript] Error:', err)
      setScriptError(err.message || 'Gagal generate script')
    } finally {
      setGeneratingScript(false)
    }
  }

  // ── Copy to clipboard ───────────────────────────────────
  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(formState.script)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[copyScript] Error:', err)
    }
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.ink, marginBottom: '6px' }}>
          Buat Script Video
        </h2>
        <p style={{ fontSize: '12px', color: C.inkMuted, margin: 0 }}>
          AI akan generate script otomatis. Atau edit manual. Gratis & unlimited regenerate.
        </p>
      </div>

      {/* GENERATE BUTTON */}
      <div
        style={{
          padding: '16px 14px',
          borderRadius: '10px',
          background: C.amberLt,
          border: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: C.ink, marginBottom: '2px' }}>
            {formState.script ? '✓ Script siap' : '💡 Generate script otomatis'}
          </div>
          <div style={{ fontSize: '10px', color: C.inkMuted }}>
            {formState.script
              ? `${formState.scriptWordCount} words`
              : 'Klik tombol di samping'}
          </div>
        </div>

        <button
          onClick={handleGenerateScript}
          disabled={generatingScript}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: 'none',
            background: generatingScript ? '#ddd' : C.amber,
            color: '#fff',
            fontWeight: 700,
            fontSize: '11px',
            cursor: generatingScript ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all .2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            if (!generatingScript) {
              (e.currentTarget as HTMLElement).style.background = C.amberDk
            }
          }}
          onMouseLeave={e => {
            if (!generatingScript) {
              (e.currentTarget as HTMLElement).style.background = C.amber
            }
          }}
        >
          {generatingScript ? (
            <>
              <Loader2
                size={12}
                style={{
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Generating...
            </>
          ) : formState.script ? (
            <>
              <RotateCcw size={12} />
              Regenerate
            </>
          ) : (
            <>
              Mulai Generate
            </>
          )}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {scriptError && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: '#FEF2F2',
            border: `1px solid ${C.red}40`,
            fontSize: '11px',
            color: C.red,
            fontWeight: 600,
          }}
        >
          ⚠️ {scriptError}
        </div>
      )}

      {/* SCRIPT EDITOR */}
      {formState.script && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 2px',
            }}
          >
            <div style={{ fontSize: '10px', color: C.inkMuted, fontWeight: 600 }}>
              {formState.scriptWordCount} kata
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCopyScript}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color: C.ink,
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = C.bg
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = C.white
                }}
              >
                {copied ? (
                  <>
                    <Check size={10} color={C.green} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    Copy
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEditingScript(!isEditingScript)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${C.border}`,
                  background: isEditingScript ? C.amberLt : C.white,
                  color: C.ink,
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                {isEditingScript ? 'Done' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Script textarea atau display */}
          {isEditingScript ? (
            <textarea
              value={formState.script}
              onChange={e => onUpdate({ script: e.target.value })}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                borderRadius: '10px',
                border: `1px solid ${C.amber}`,
                fontFamily: '"Courier New", monospace',
                fontSize: '12px',
                lineHeight: 1.6,
                color: C.ink,
                resize: 'vertical',
                outline: 'none',
              }}
              onFocus={e => {
                (e.target as HTMLElement).style.borderColor = C.amberDk
              }}
              onBlur={e => {
                (e.target as HTMLElement).style.borderColor = C.amber
              }}
            />
          ) : (
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: C.bg,
                border: `1px solid ${C.border}`,
                fontSize: '12px',
                lineHeight: 1.7,
                color: C.ink,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {formState.script}
            </div>
          )}
        </div>
      )}

      {/* NEXT BUTTON */}
      <button
        onClick={onNext}
        disabled={!formState.script}
        style={{
          padding: '12px 16px',
          borderRadius: '10px',
          border: 'none',
          background: formState.script ? C.amber : '#ccc',
          color: '#fff',
          fontWeight: 700,
          fontSize: '13px',
          cursor: formState.script ? 'pointer' : 'not-allowed',
          transition: 'all .2s',
        }}
        onMouseEnter={e => {
          if (formState.script) {
            (e.currentTarget as HTMLElement).style.background = C.amberDk
          }
        }}
        onMouseLeave={e => {
          if (formState.script) {
            (e.currentTarget as HTMLElement).style.background = C.amber
          }
        }}
      >
        Lanjut ke Step 6 →
      </button>

      {/* STYLE: Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Step5Script