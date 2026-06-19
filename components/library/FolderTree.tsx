'use client'
// apps/web-app/components/library/FolderTree.tsx
// Sidebar folder tree dengan dnd-kit
// Features: drag-and-drop, context menu, color picker, expand/collapse
import { useState, useMemo, useEffect } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor,
  TouchSensor, useSensor, useSensors, useDraggable, useDroppable,
  PointerSensor, KeyboardSensor,
} from '@dnd-kit/core'
import {
  Folder as FolderIcon, FolderOpen, ChevronRight, ChevronDown, MoreVertical,
  Plus, Pencil, Trash2, Palette, FolderInput, Inbox, Library,
} from 'lucide-react'
import {
  useFolders, useUpdateFolder, useDeleteFolder, useMoveContent,
} from '@/hooks/useFolders'
import type { Folder, DragData, DropData } from '@/lib/folder-types'
import { FOLDER_COLORS } from '@/lib/folder-types'
import { CreateFolderDialog } from './CreateFolderDialog'

interface Props {
  selectedFolderId: string | null
  onSelectFolder:   (folderId: string | null) => void
}

export function FolderTree({ selectedFolderId, onSelectFolder }: Props) {
  const { data, isLoading } = useFolders()
  const updateFolder = useUpdateFolder()
  const moveContent  = useMoveContent()
  const deleteFolder = useDeleteFolder()

  // Expanded state untuk parent folders
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Auto-expand parent kalau ada child yang ter-select
  useEffect(() => {
    if (!selectedFolderId || !data) return

    const findParent = (folders: Folder[], targetId: string): string | null => {
      for (const f of folders) {
        if (f.children?.some(c => c.id === targetId)) return f.id
        if (f.children) {
          const found = findParent(f.children, targetId)
          if (found) return found
        }
      }
      return null
    }

    const parentId = findParent(data.roots, selectedFolderId)
    if (parentId) {
      setExpanded(prev => new Set([...prev, parentId]))
    }
  }, [selectedFolderId, data])

  // Drag state
  const [draggingItem, setDraggingItem] = useState<DragData | null>(null)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },     // 5px movement untuk start drag
    }),
    useSensor(KeyboardSensor),
  )

  // ── Dialog state ───────────────────────────────────────
  const [createDialog, setCreateDialog] = useState<{
    open:     boolean
    parentId: string | null
    editing?: Folder
  }>({ open: false, parentId: null })

  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null)

  // ── Toggle expand ──────────────────────────────────────
  const toggleExpand = (folderId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  // ── Drag handlers ──────────────────────────────────────
  const handleDragStart = (e: DragStartEvent) => {
    setDraggingItem(e.active.data.current as DragData)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setDraggingItem(null)
    const dropData = e.over?.data.current as DropData | undefined
    const dragData = e.active.data.current as DragData | undefined

    if (!dragData || !dropData) return

    const targetFolderId = dropData.type === 'root-drop' ? null : dropData.folderId

    // Folder → Folder/Root
    if (dragData.type === 'folder') {
      // Skip kalau drop di dirinya sendiri atau parent yang sama
      if (dragData.folderId === targetFolderId) return
      if (dragData.parentId === targetFolderId) return

      try {
        await updateFolder.mutateAsync({
          id:       dragData.folderId,
          parentId: targetFolderId,
        })
      } catch (err: any) {
        alert(err.message ?? 'Gagal pindah folder')
      }
      return
    }

    // Content → Folder/Root
    if (dragData.type === 'content') {
      if (dragData.currentFolderId === targetFolderId) return

      try {
        await moveContent.mutateAsync({
          contentId: dragData.contentId,
          folderId:  targetFolderId,
        })
      } catch (err: any) {
        alert(err.message ?? 'Gagal pindah konten')
      }
    }
  }

  // ── Action handlers ────────────────────────────────────
  const handleDelete = async (folder: Folder) => {
    const confirmMsg = folder.contentCount && folder.contentCount > 0
      ? `Hapus folder "${folder.name}"? ${folder.contentCount} konten akan pindah ke folder parent.`
      : `Hapus folder "${folder.name}"?`

    if (!confirm(confirmMsg)) return

    try {
      await deleteFolder.mutateAsync(folder.id)
    } catch (err: any) {
      alert(err.message ?? 'Gagal hapus folder')
    }
  }

  const handleColorChange = async (folderId: string, color: string) => {
    setColorPickerFor(null)
    try {
      await updateFolder.mutateAsync({ id: folderId, color })
    } catch (err: any) {
      alert(err.message ?? 'Gagal ubah warna')
    }
  }

  // ── Loading / Empty ────────────────────────────────────
  if (isLoading) {
    return (
      <div style={containerStyle()}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ ...skeletonRow, animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <aside style={containerStyle()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <h2 style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <FolderIcon size={12} />
            Folders
          </h2>

          <button
            onClick={() => setCreateDialog({ open: true, parentId: null })}
            title="Buat folder baru"
            style={{
              width: '24px', height: '24px',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Root drop zone */}
        <RootDropZone
          selected={selectedFolderId === null}
          contentCount={data?.rootContentCount ?? 0}
          onClick={() => onSelectFolder(null)}
        />

        {/* Folder list */}
        <div style={{ marginTop: '6px' }}>
          {data?.roots.length === 0 && (
            <p style={{
              fontSize: '11px',
              color: '#94A3B8',
              textAlign: 'center',
              padding: '12px',
              fontStyle: 'italic',
            }}>
              Belum ada folder. Klik + untuk buat.
            </p>
          )}

          {data?.roots.map(folder => (
            <FolderNode
              key={folder.id}
              folder={folder}
              level={0}
              expanded={expanded}
              selectedFolderId={selectedFolderId}
              colorPickerOpen={colorPickerFor === folder.id}
              onSelect={onSelectFolder}
              onToggleExpand={toggleExpand}
              onCreateSubfolder={(parentId) => setCreateDialog({ open: true, parentId })}
              onRename={(f) => setCreateDialog({ open: true, parentId: f.parentId, editing: f })}
              onDelete={handleDelete}
              onChangeColor={(color) => handleColorChange(folder.id, color)}
              onOpenColorPicker={() => setColorPickerFor(folder.id)}
              onCloseColorPicker={() => setColorPickerFor(null)}
            />
          ))}
        </div>
      </aside>

      {/* Drag preview */}
      <DragOverlay dropAnimation={null}>
        {draggingItem && draggingItem.type === 'folder' && (
          <div style={{
            padding: '6px 10px',
            background: '#fff',
            border: '1px solid #2563EB',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 4px 12px rgba(37,99,235,.25)',
            color: '#0F172A',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <FolderIcon size={12} />
            Folder
          </div>
        )}
      </DragOverlay>

      {/* Create/Rename dialog */}
      {createDialog.open && (
        <CreateFolderDialog
          parentId={createDialog.parentId}
          editing={createDialog.editing}
          onClose={() => setCreateDialog({ open: false, parentId: null })}
        />
      )}
    </DndContext>
  )
}

// ══════════════════════════════════════════════════════════════
// ROOT DROP ZONE
// ══════════════════════════════════════════════════════════════
function RootDropZone({ selected, contentCount, onClick }: {
  selected:     boolean
  contentCount: number
  onClick:      () => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id:    'root-drop',
    data:  { type: 'root-drop' } as DropData,
  })

  return (
    <button
      ref={setNodeRef as any}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        background: isOver ? '#DBEAFE' : (selected ? '#EFF6FF' : 'transparent'),
        border: `1px solid ${isOver ? '#2563EB' : (selected ? '#BFDBFE' : 'transparent')}`,
        borderRadius: '7px',
        fontSize: '12px',
        fontWeight: selected ? 600 : 500,
        color: selected ? '#1E3A8A' : '#475569',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all .15s',
      }}
    >
      <Library size={13} color={selected ? '#2563EB' : '#94A3B8'} />
      <span style={{ flex: 1 }}>Library</span>
      {contentCount > 0 && (
        <span style={{
          fontSize: '10px',
          color: '#94A3B8',
          fontFamily: "'DM Mono', monospace",
        }}>
          {contentCount}
        </span>
      )}
    </button>
  )
}

// ══════════════════════════════════════════════════════════════
// FOLDER NODE (recursive)
// ══════════════════════════════════════════════════════════════
function FolderNode(props: {
  folder:           Folder
  level:            number
  expanded:         Set<string>
  selectedFolderId: string | null
  colorPickerOpen:  boolean
  onSelect:           (id: string) => void
  onToggleExpand:     (id: string) => void
  onCreateSubfolder:  (parentId: string) => void
  onRename:           (f: Folder) => void
  onDelete:           (f: Folder) => void
  onChangeColor:      (color: string) => void
  onOpenColorPicker:  () => void
  onCloseColorPicker: () => void
}) {
  const {
    folder, level, expanded, selectedFolderId, colorPickerOpen,
    onSelect, onToggleExpand, onCreateSubfolder, onRename, onDelete,
    onChangeColor, onOpenColorPicker, onCloseColorPicker,
  } = props

  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const isExpanded   = expanded.has(folder.id)
  const isSelected   = selectedFolderId === folder.id
  const hasChildren  = folder.children && folder.children.length > 0
  const canCreateSub = level === 0   // hanya root bisa punya children

  // Make folder draggable
  const drag = useDraggable({
    id:    `folder-${folder.id}`,
    data:  {
      type:     'folder',
      folderId: folder.id,
      parentId: folder.parentId,
    } as DragData,
  })

  // Make folder droppable
  const drop = useDroppable({
    id:    `folder-drop-${folder.id}`,
    data:  { type: 'folder-drop', folderId: folder.id } as DropData,
    // Hanya level 0 yang bisa accept drop folder lain (max 2 level)
    // tapi semua bisa accept content
  })

  // Combine refs
  const setRef = (el: HTMLElement | null) => {
    drag.setNodeRef(el)
    drop.setNodeRef(el)
  }

  return (
    <div style={{ marginBottom: '1px' }}>
      <div
        ref={setRef as any}
        {...drag.attributes}
        {...drag.listeners}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenuOpen(true)
        }}
        onClick={() => onSelect(folder.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          paddingLeft: `${8 + level * 14}px`,
          background: drop.isOver
            ? '#DBEAFE'
            : isSelected
              ? '#EFF6FF'
              : 'transparent',
          border: `1px solid ${drop.isOver
            ? '#2563EB'
            : isSelected
              ? '#BFDBFE'
              : 'transparent'}`,
          borderRadius: '7px',
          fontSize: '12px',
          fontWeight: isSelected ? 600 : 500,
          color: isSelected ? '#1E3A8A' : '#475569',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'all .15s',
          opacity: drag.isDragging ? 0.4 : 1,
          position: 'relative',
        }}
      >
        {/* Expand chevron */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(folder.id)
            }}
            style={{
              width: '14px', height: '14px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <span style={{ width: '14px', flexShrink: 0 }} />
        )}

        {/* Folder icon dengan color */}
        <span style={{
          color: folder.color,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          {isExpanded && hasChildren
            ? <FolderOpen size={13} />
            : <FolderIcon size={13} />
          }
        </span>

        {/* Name */}
        <span style={{
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {folder.name}
        </span>

        {/* Content count */}
        {folder.contentCount && folder.contentCount > 0 && (
          <span style={{
            fontSize: '10px',
            color: '#94A3B8',
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
          }}>
            {folder.contentCount}
          </span>
        )}

        {/* Context menu trigger (visible on hover/active) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setContextMenuOpen(true)
          }}
          style={{
            width: '20px', height: '20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#94A3B8',
            padding: 0,
            opacity: contextMenuOpen ? 1 : 0.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = contextMenuOpen ? '1' : '0.4'}
        >
          <MoreVertical size={11} />
        </button>

        {/* Context menu */}
        {contextMenuOpen && (
          <FolderContextMenu
            folder={folder}
            canCreateSub={canCreateSub}
            onClose={() => setContextMenuOpen(false)}
            onCreateSubfolder={() => {
              setContextMenuOpen(false)
              onCreateSubfolder(folder.id)
            }}
            onRename={() => {
              setContextMenuOpen(false)
              onRename(folder)
            }}
            onDelete={() => {
              setContextMenuOpen(false)
              onDelete(folder)
            }}
            onOpenColorPicker={() => {
              setContextMenuOpen(false)
              onOpenColorPicker()
            }}
          />
        )}

        {/* Color picker */}
        {colorPickerOpen && (
          <ColorPickerPopover
            currentColor={folder.color}
            onSelect={onChangeColor}
            onClose={onCloseColorPicker}
          />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && folder.children && (
        <div>
          {folder.children.map(child => (
            <FolderNode
              key={child.id}
              {...props}
              folder={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// CONTEXT MENU
// ══════════════════════════════════════════════════════════════
function FolderContextMenu({
  folder, canCreateSub, onClose, onCreateSubfolder, onRename, onDelete, onOpenColorPicker,
}: {
  folder:        Folder
  canCreateSub:  boolean
  onClose:       () => void
  onCreateSubfolder: () => void
  onRename:           () => void
  onDelete:           () => void
  onOpenColorPicker:  () => void
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 50 }}
      />
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        right: 0,
        zIndex: 51,
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(15,23,42,.12)',
        padding: '4px',
        minWidth: '180px',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {canCreateSub && (
          <MenuItem icon={<Plus size={11} />} label="Buat sub-folder" onClick={onCreateSubfolder} />
        )}
        <MenuItem icon={<Pencil size={11} />} label="Rename" onClick={onRename} />
        <MenuItem icon={<Palette size={11} />} label="Ganti warna" onClick={onOpenColorPicker} />
        <Separator />
        <MenuItem icon={<Trash2 size={11} />} label="Hapus" onClick={onDelete} variant="danger" />
      </div>
    </>
  )
}

function MenuItem({ icon, label, onClick, variant }: {
  icon:    React.ReactNode
  label:   string
  onClick: () => void
  variant?: 'danger'
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: '5px',
        fontSize: '12px',
        color: variant === 'danger' ? '#DC2626' : '#475569',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'background .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = variant === 'danger' ? '#FEF2F2' : '#F8FAFC'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      {label}
    </button>
  )
}

function Separator() {
  return <div style={{ height: '1px', background: '#F1F5F9', margin: '3px 0' }} />
}

// ══════════════════════════════════════════════════════════════
// COLOR PICKER POPOVER
// ══════════════════════════════════════════════════════════════
function ColorPickerPopover({ currentColor, onSelect, onClose }: {
  currentColor: string
  onSelect:     (color: string) => void
  onClose:      () => void
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 50 }}
      />
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        right: 0,
        zIndex: 51,
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(15,23,42,.12)',
        padding: '10px',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 700,
          color: '#94A3B8',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Pilih warna
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
        }}>
          {FOLDER_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onSelect(c.value)}
              title={c.label}
              style={{
                width: '28px',
                height: '28px',
                background: c.value,
                border: c.value.toLowerCase() === currentColor.toLowerCase()
                  ? '2px solid #0F172A'
                  : '1px solid #E2E8F0',
                borderRadius: '6px',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// STYLE HELPERS
// ══════════════════════════════════════════════════════════════
function containerStyle(): React.CSSProperties {
  return {
    width: '220px',
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '12px',
    fontFamily: "'DM Sans', sans-serif",
    flexShrink: 0,
    alignSelf: 'flex-start',
    position: 'sticky',
    top: '14px',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  }
}

const skeletonRow: React.CSSProperties = {
  height: '28px',
  background: 'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)',
  backgroundSize: '200% 100%',
  borderRadius: '6px',
  marginBottom: '6px',
  animation: 'shimmer 1.5s infinite',
}