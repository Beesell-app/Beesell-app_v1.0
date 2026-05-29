'use client'
// apps/web-app/components/library/SearchBar.tsx
// Search input dengan debounce 300ms
// Keyboard shortcut: "/" untuk focus
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  value:    string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Cari konten...' }: Props) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local value dengan prop saat external changes (e.g. clear filter)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced update parent
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [localValue, onChange, value])

  // Keyboard shortcut "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }

      // Esc untuk blur + clear
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
        setLocalValue('')
        onChange('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onChange])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div style={{
      position: 'relative',
      flex: 1,
      maxWidth: '420px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Search
        size={14}
        color="#94A3B8"
        style={{
          position: 'absolute',
          left: '13px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />

      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 36px 9px 38px',
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: '9px',
          fontSize: '13px',
          color: '#0F172A',
          outline: 'none',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'border-color .15s, box-shadow .15s',
        }}
        onFocus={e => {
          e.target.style.borderColor = '#2563EB'
          e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.1)'
        }}
        onBlur={e => {
          e.target.style.borderColor = '#E2E8F0'
          e.target.style.boxShadow = 'none'
        }}
      />

      {/* Keyboard hint or clear button */}
      {localValue ? (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '22px',
            height: '22px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
          }}
          title="Clear (Esc)"
        >
          <X size={11} />
        </button>
      ) : (
        <kbd style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '2px 6px',
          background: '#F1F5F9',
          border: '1px solid #E2E8F0',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#94A3B8',
          fontFamily: "'DM Mono', monospace",
          fontWeight: 600,
        }}>
          /
        </kbd>
      )}
    </div>
  )
}