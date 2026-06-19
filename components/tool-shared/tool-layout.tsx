'use client'
// components/tool-shared/tool-layout.tsx
// ══════════════════════════════════════════════════════════════
// Tool Layout — Shared wrapper untuk semua tool pages
// ══════════════════════════════════════════════════════════════

import { ReactNode, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { UsageProgressBadge } from '@/components/daily-limit/usage-progress-badge'

const C = {
  purple:'#7C3AED', purpleBg:'#F5F3FF',
  pink:'#EC4899', amber:'#F59E0B', green:'#10B981', red:'#EF4444',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC',
  white:'#FFFFFF',
}

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════
export interface ToolLimitError {
  message:       string
  tool_id:       string
  current_tier:  string
  limit:         number
  reset_at?:     string
  upgrade_suggestion?: {
    from_tier:   string
    to_tier:     string
    multiplier:  number
    cta_text:    string
    upgrade_url: string
  }
}

interface ToolLayoutProps {
  toolId:       string
  toolLabel:    string
  icon:         string
  category:     string
  description:  string
  children:     ReactNode
  showCredit?:  number      // untuk metered tools
}

// ══════════════════════════════════════════════════════════════
// TOOL LAYOUT WRAPPER
// ══════════════════════════════════════════════════════════════
export function ToolLayout({ 
  toolId, toolLabel, icon, category, description, children, showCredit,
}: ToolLayoutProps) {
  return (
    <div style={{
      maxWidth:1200, margin:'0 auto',
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box }
      `}</style>

      {/* Back link */}
      <Link href="/studio" style={{
        display:'inline-flex', alignItems:'center', gap:5,
        fontSize:13, color: C.slate500, textDecoration:'none',
        marginBottom:16, fontWeight:600,
      }}>
        <ArrowLeft size={14}/> Kembali ke Studio
      </Link>

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        gap:16, marginBottom:24, flexWrap:'wrap',
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          <div style={{
            width:48, height:48, borderRadius:12,
            background: C.purpleBg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24, flexShrink: 0,
          }}>{icon}</div>
          <div>
            <div style={{
              fontSize:11, color: C.purple, fontWeight:700, marginBottom:4,
              letterSpacing:'0.06em', textTransform:'uppercase',
            }}>{category}</div>
            <h1 style={{
              fontSize:26, fontWeight:900, color: C.slate900,
              marginBottom:6, letterSpacing:'-0.02em',
              margin: '0 0 6px 0',
            }}>{toolLabel}</h1>
            <p style={{ 
              fontSize:13, color: C.slate600, lineHeight:1.5,
              margin: 0,
            }}>
              {description}
            </p>
          </div>
        </div>

        {/* Usage badge / credit info */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          {showCredit !== undefined ? (
            <div style={{
              padding:'8px 14px', borderRadius:10,
              background: C.purpleBg, color: C.purple,
              fontSize:12, fontWeight:800,
              display:'inline-flex', alignItems:'center', gap:6,
            }}>
              <span style={{ fontSize:14 }}>⚡</span>
              {showCredit} credit per generate
            </div>
          ) : (
            <UsageProgressBadge toolId={toolId} variant="full"/>
          )}
        </div>
      </div>

      {/* Main content */}
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// API CALL HELPER dengan error handling
// ══════════════════════════════════════════════════════════════
export type APIResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: any; status: number }

export async function callToolAPI<TResponse = any>(
  endpoint: string,
  body: any,
): Promise<APIResult<TResponse>> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return { ok: false, error: data, status: res.status }
    }

    return { ok: true, data }
  } catch (err) {
    return { 
      ok: false, 
      error: { message: err instanceof Error ? err.message : 'Network error' }, 
      status: 0,
    }
  }
}

// ══════════════════════════════════════════════════════════════
// 2-COLUMN LAYOUT (Form Left, Output Right)
// ══════════════════════════════════════════════════════════════
export function TwoColLayout({ form, output }: { form: ReactNode; output: ReactNode }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'minmax(0, 1fr) minmax(0, 1.3fr)',
      gap:24,
    }} 
    className="two-col-layout">
      <style>{`
        @media (max-width: 900px) {
          .two-col-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div>{form}</div>
      <div>{output}</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// REUSABLE FORM STYLES
// ══════════════════════════════════════════════════════════════
export const FormStyles = {
  label: {
    display: 'block', fontSize:12, fontWeight:700,
    color: C.slate700, marginBottom:6, letterSpacing:'0.02em',
  } as React.CSSProperties,
  
  input: {
    width:'100%', padding:'10px 14px', borderRadius:10,
    border:`1.5px solid ${C.slate200}`, background: C.white,
    fontSize:14, fontFamily:'inherit', color: C.slate900,
    outline:'none', transition:'border 0.15s',
  } as React.CSSProperties,
  
  textarea: {
    width:'100%', padding:'12px 14px', borderRadius:10,
    border:`1.5px solid ${C.slate200}`, background: C.white,
    fontSize:14, fontFamily:'inherit', color: C.slate900,
    outline:'none', resize:'vertical' as const, minHeight:90,
  } as React.CSSProperties,
  
  select: {
    width:'100%', padding:'10px 14px', borderRadius:10,
    border:`1.5px solid ${C.slate200}`, background: C.white,
    fontSize:14, fontFamily:'inherit', color: C.slate900,
    outline:'none', cursor:'pointer',
  } as React.CSSProperties,

  primaryButton: (disabled = false): React.CSSProperties => ({
    padding:'12px 24px', borderRadius:10,
    background: disabled ? C.slate300 : `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
    color:'#fff', fontSize:14, fontWeight:800,
    border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily:'inherit',
    display:'inline-flex', alignItems:'center', gap:8,
  }),

  secondaryButton: {
    padding:'10px 18px', borderRadius:10,
    background: C.white, color: C.slate700,
    fontSize:13, fontWeight:700,
    border:`1.5px solid ${C.slate200}`,
    cursor:'pointer', fontFamily:'inherit',
  } as React.CSSProperties,

  card: {
    background: C.white, borderRadius:14,
    border:`1px solid ${C.slate200}`,
    padding:'20px', marginBottom:16,
  } as React.CSSProperties,
  
  errorBox: {
    padding:'12px 14px', borderRadius:8,
    background:'#FEF2F2', border:`1px solid #FECACA`,
    color:'#991B1B', fontSize:13,
    marginTop:12,
  } as React.CSSProperties,

  loadingBox: {
    padding:'14px 18px', borderRadius:10,
    background: C.purpleBg, border:`1px solid ${C.purple}30`,
    color: C.purple, fontSize:13, fontWeight:600,
    display:'flex', alignItems:'center', gap:10,
  } as React.CSSProperties,
}

// ══════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════
export function EmptyOutputState({ message = "Hasil akan muncul di sini" }: { message?: string }) {
  return (
    <div style={{
      padding:'60px 24px', borderRadius:14,
      background: C.slate50, border:`1px dashed ${C.slate200}`,
      textAlign:'center',
    }}>
      <div style={{ fontSize:36, marginBottom:12 }}>✨</div>
      <p style={{ fontSize:14, color: C.slate500, margin: 0 }}>{message}</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// IMAGE UPLOADER (DRAG & DROP)
// ══════════════════════════════════════════════════════════════
interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUploader({ 
  value, onChange, label = "Upload foto produk",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar')
      return
    }
    if (file.size > 10 * 1024 * 1024) {  // 10 MB
      alert('Ukuran file max 10 MB')
      return
    }

    setIsUploading(true)
    try {
      // ⚠️ PLACEHOLDER: base64 preview
      // TODO: Replace dengan upload ke R2 di production
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onChange(result)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Upload error:', err)
      setIsUploading(false)
    }
  }

  return (
    <div>
      <label style={FormStyles.label}>{label}</label>
      
      {value ? (
        <div style={{
          position:'relative', borderRadius:12, overflow:'hidden',
          border:`1.5px solid ${C.slate200}`,
        }}>
          <img src={value} alt="" style={{
            width:'100%', height:'auto', maxHeight:400,
            display:'block', objectFit:'contain',
          }}/>
          <button onClick={() => onChange('')} style={{
            position:'absolute', top:8, right:8,
            padding:'6px 12px', borderRadius:8,
            background:'rgba(15,23,42,0.85)', color:'#fff',
            fontSize:11, fontWeight:700, border:'none',
            cursor:'pointer', fontFamily:'inherit',
          }}>
            Ganti foto
          </button>
        </div>
      ) : (
        <label style={{
          display:'block', cursor:'pointer',
          padding:'40px 24px', borderRadius:12,
          background: isDragging ? C.purpleBg : C.slate50,
          border:`2px dashed ${isDragging ? C.purple : C.slate200}`,
          textAlign:'center', transition:'all 0.15s',
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}>
          <input type="file" accept="image/*" style={{ display:'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}/>
          <div style={{ fontSize:32, marginBottom:8 }}>📤</div>
          <div style={{ fontSize:14, fontWeight:700, color: C.slate900, marginBottom:4 }}>
            {isUploading ? 'Uploading...' : 'Drop foto di sini atau klik'}
          </div>
          <div style={{ fontSize:11, color: C.slate500 }}>
            JPG, PNG, WEBP • Max 10 MB
          </div>
        </label>
      )}
    </div>
  )
}