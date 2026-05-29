'use client'
// apps/web-app/components/library/Breadcrumb.tsx
// Breadcrumb path navigation
// Click intermediate node → navigate ke folder itu
import { ChevronRight, Folder as FolderIcon, Library } from 'lucide-react'
import type { BreadcrumbItem } from '@/lib/folder-types'

interface Props {
  path:           BreadcrumbItem[]
  onNavigate:     (folderId: string | null) => void
}

export function Breadcrumb({ path, onNavigate }: Props) {
  if (path.length <= 1) return null

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '4px',
      padding: '8px 12px',
      background: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: "'DM Sans', sans-serif",
      marginBottom: '14px',
    }}>
      {path.map((item, i) => {
        const isLast = i === path.length - 1
        const isFirst = i === 0

        return (
          <div
            key={item.id ?? 'root'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <button
              onClick={() => !isLast && onNavigate(item.id)}
              disabled={isLast}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 7px',
                background: isLast ? '#fff' : 'transparent',
                border: isLast ? '1px solid #E2E8F0' : 'none',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: isLast ? 600 : 500,
                color: isLast ? '#0F172A' : '#475569',
                cursor: isLast ? 'default' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background .15s',
              }}
              onMouseEnter={e => {
                if (!isLast) e.currentTarget.style.background = '#F1F5F9'
              }}
              onMouseLeave={e => {
                if (!isLast) e.currentTarget.style.background = 'transparent'
              }}
            >
              {isFirst ? (
                <Library size={11} color="#94A3B8" />
              ) : (
                <FolderIcon size={11} color={item.color} />
              )}
              {item.name}
            </button>

            {!isLast && (
              <ChevronRight size={11} color="#CBD5E1" />
            )}
          </div>
        )
      })}
    </nav>
  )
}