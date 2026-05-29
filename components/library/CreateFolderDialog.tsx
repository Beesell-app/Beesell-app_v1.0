'use client'
// apps/web-app/components/library/CreateFolderDialog.tsx
// Dialog untuk create folder baru atau rename existing
// Includes color picker (8 preset colors)
import { useState, useEffect, useRef } from 'react'
import { X, Folder as FolderIcon, Check, Loader2, AlertCircle } from 'lucide-react'
import { useCreateFolder, useUpdateFolder } from '@/lib/hooks/useFolders'
import type { Folder } from '@/lib/folder-types'
import { FOLDER_COLORS, DEFAULT_COLOR } from '@/lib/folder-types'

interface Props {
  parentId:  string | null     // null = root level
  editing?:  Folder             // kalau ada, mode rename + change color
  onClose:   () => void
}

export function CreateFolderDialog({ parentId, editing, onClose }: Props) {
  const [name, setName]   = useState(editing?.name ?? '')
  const [color, setColor] = useState(editing?.color ?? DEFAULT_COLOR)
  const inputRef = useRef<HTMLInputElement>(null)

  const createMutation = useCreateFolder()
  const updateMutation = useUpdateFolder()
  const isLoading = createMutation.isPending || updateMutation.isPending
  const error     = createMutation.error ?? updateMutation.error

  const isEditMode = !!editing

  // Auto-focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) return

    try {
      if (isEditMode && editing) {
        await updateMutation.mutateAsync({
          id:    editing.id,
          name:  trimmed,
          color,
        })
      } else {
        await createMutation.mutateAsync({
          name:     trimmed,
          parentId,
          color,
        })
      }
      onClose()
    } catch (err) {
      // Error sudah di-handle di mutation state
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,.5)',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn .2s ease-out',
        }}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(420px, 92vw)',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px rgba(15,23,42,.25)',
          zIndex: 101,
          fontFamily: "'DM Sans', sans-serif",
          animation: 'slideUp .25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '18px',
            fontWeight: 600,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FolderIcon size={16} color={color} />
            {isEditMode ? 'Edit Folder' : 'Buat Folder Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '28px', height: '28px',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Name input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Nama folder
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Marketing Q1"
              maxLength={100}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '9px',
                fontSize: '14px',
                color: '#0F172A',
                outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all .15s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#2563EB'
                e.target.style.background = '#fff'
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.1)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E2E8F0'
                e.target.style.background = '#F8FAFC'
                e.target.style.boxShadow = 'none'
              }}
            />
            {parentId && (
              <p style={{
                fontSize: '10px',
                color: '#94A3B8',
                marginTop: '4px',
                fontStyle: 'italic',
              }}>
                Akan dibuat sebagai sub-folder
              </p>
            )}
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: '4px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Warna folder
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '6px',
            }}>
              {FOLDER_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  style={{
                    aspectRatio: '1',
                    background: c.value,
                    border: c.value.toLowerCase() === color.toLowerCase()
                      ? '2px solid #0F172A'
                      : '1px solid #E2E8F0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative',
                    transition: 'transform .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {c.value.toLowerCase() === color.toLowerCase() && (
                    <Check
                      size={12}
                      color="#fff"
                      style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#991B1B',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <AlertCircle size={12} />
              {error.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          background: '#F8FAFC',
          borderRadius: '0 0 16px 16px',
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 14px',
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#475569',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              background: !name.trim() || isLoading
                ? '#CBD5E1'
                : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isLoading || !name.trim() ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: name.trim() && !isLoading ? '0 2px 8px rgba(37,99,235,.25)' : 'none',
            }}
          >
            {isLoading ? (
              <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
            ) : (
              isEditMode ? 'Simpan Perubahan' : 'Buat Folder'
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%) scale(.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}