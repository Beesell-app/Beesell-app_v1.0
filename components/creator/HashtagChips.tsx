'use client'
// apps/web-app/components/creator/HashtagChips.tsx
// Hashtag chips editable inline
// - Click chip → remove
// - Input "+ Tambah" → add new
// - Drag-drop nanti (Phase 2)
import { useState, useRef, KeyboardEvent } from 'react'
import { Hash, X, Plus } from 'lucide-react'

interface Props {
  hashtags:    string[]
  onChange:    (newHashtags: string[]) => void
  maxHashtags?: number
}

export function HashtagChips({ hashtags, onChange, maxHashtags = 30 }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [editing,    setEditing]    = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const trimmed = inputValue.trim()
      .replace(/^#+/, '')          // strip leading #
      .replace(/[\s\,]+/g, '')      // no spaces/commas

    if (!trimmed) {
      setInputValue('')
      setEditing(false)
      return
    }

    // Validate: no duplicates, max 30 chars per hashtag
    if (hashtags.includes(trimmed)) {
      // Visual feedback: shake input briefly
      inputRef.current?.classList.add('shake')
      setTimeout(() => inputRef.current?.classList.remove('shake'), 400)
      return
    }

    if (trimmed.length > 30) {
      return
    }

    if (hashtags.length >= maxHashtags) {
      return
    }

    onChange([...hashtags, trimmed])
    setInputValue('')
    // Keep focus untuk add cepat berurutan
    inputRef.current?.focus()
  }

  const handleRemove = (index: number) => {
    onChange(hashtags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      handleAdd()
    } else if (e.key === 'Backspace' && inputValue === '' && hashtags.length > 0) {
      // Backspace di input kosong → hapus chip terakhir
      handleRemove(hashtags.length - 1)
    } else if (e.key === 'Escape') {
      setInputValue('')
      setEditing(false)
      inputRef.current?.blur()
    }
  }

  const canAddMore = hashtags.length < maxHashtags

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      alignItems: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Hash size={12} color="#94A3B8" style={{ flexShrink: 0 }} />

      {/* Existing chips */}
      {hashtags.map((tag, i) => (
        <button
          key={`${tag}-${i}`}
          type="button"
          onClick={() => handleRemove(i)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px 3px 9px',
            background: '#F1F5F9',
            color: '#475569',
            border: '1px solid #E2E8F0',
            borderRadius: '5px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'DM Mono', monospace",
            transition: 'all .15s',
            position: 'relative',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEF2F2'
            e.currentTarget.style.borderColor = '#FECACA'
            e.currentTarget.style.color = '#DC2626'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#F1F5F9'
            e.currentTarget.style.borderColor = '#E2E8F0'
            e.currentTarget.style.color = '#475569'
          }}
          title="Klik untuk hapus"
        >
          #{tag}
          <X size={10} style={{ flexShrink: 0 }} />
        </button>
      ))}

      {/* Add new input */}
      {canAddMore && (
        editing ? (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) handleAdd()
              else setEditing(false)
            }}
            placeholder="hashtag"
            autoFocus
            style={{
              padding: '3px 8px',
              border: '1px solid #2563EB',
              borderRadius: '5px',
              fontSize: '11px',
              fontFamily: "'DM Mono', monospace",
              outline: 'none',
              background: '#fff',
              color: '#0F172A',
              minWidth: '90px',
              maxWidth: '160px',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 8px',
              background: '#fff',
              color: '#64748B',
              border: '1px dashed #CBD5E1',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#2563EB'
              e.currentTarget.style.color = '#2563EB'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#CBD5E1'
              e.currentTarget.style.color = '#64748B'
            }}
          >
            <Plus size={10} /> Tambah
          </button>
        )
      )}

      {/* Counter saat udah penuh atau hampir penuh */}
      {hashtags.length >= maxHashtags - 5 && (
        <span style={{
          fontSize: '10px',
          color: hashtags.length >= maxHashtags ? '#DC2626' : '#94A3B8',
          marginLeft: 'auto',
          fontFamily: "'DM Mono', monospace",
        }}>
          {hashtags.length}/{maxHashtags}
        </span>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .shake { animation: shake .3s ease-in-out; border-color: #DC2626 !important; }
      `}</style>
    </div>
  )
}