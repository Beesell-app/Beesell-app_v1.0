// components/studio/ugc/Step3-Character-Complete.tsx
// ══════════════════════════════════════════════════════════════
// STEP 3: Choose Avatar
// 3 tabs: Preset | Collection | Custom Upload
// Collection avatars dengan display besar (140px × 160px)

'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Check, Loader2, AlertCircle, Info } from 'lucide-react'
import { CHARACTER_FEMALE, CHARACTER_MALE } from '@/lib/studio/ugc/presets'
import { AVATAR_COLLECTION, getAvailableCategories } from '@/lib/studio/avatars'
import type { Avatar, CollectionAvatar, CustomAvatar } from '@/lib/studio/avatars'

const C = {
  amber: '#F59E0B',
  amberDk: '#D97706',
  amberLt: '#FEF3C7',
  white: '#FFFFFF',
  bg: '#FAFAFA',
  border: '#E5E7EB',
  ink: '#111827',
  inkMuted: '#6B7280',
  green: '#10B981',
  blue: '#3B82F6',
  red: '#EF4444',
}

interface Step3Props {
  selectedAvatarId: string | null
  avatarSource: 'preset' | 'collection' | 'custom' | null
  onSelectAvatar: (avatarId: string, source: 'preset' | 'collection' | 'custom') => void
  // onNext dihapus karena navigasi sudah ditangani oleh page.tsx utama
}

export default function Step3Character({
  selectedAvatarId,
  avatarSource,
  onSelectAvatar,
}: Step3Props) {
  // ── Tabs ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'preset' | 'collection' | 'custom'>('preset')
  const [charTab, setCharTab] = useState<'female' | 'male'>('female')
  const [collectionCategory, setCollectionCategory] = useState<string>('beauty')

  // ── Custom avatar state ─────────────────────────────────
  const [customAvatars, setCustomAvatars] = useState<CustomAvatar[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [processingAvatars, setProcessingAvatars] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load custom avatars on mount ────────────────────────
  useEffect(() => {
    loadCustomAvatars()
  }, [])

  // ── Poll status of processing avatars ───────────────────
  useEffect(() => {
    if (processingAvatars.size === 0) return

    const interval = setInterval(async () => {
      for (const avatarId of processingAvatars) {
        try {
          const res = await fetch(`/api/studio/avatars/${avatarId}/status`)
          if (!res.ok) continue

          const data = await res.json()
          setCustomAvatars(prev =>
            prev.map(a =>
              a.id === avatarId
                ? {
                    ...a,
                    status: data.status as 'processing' | 'ready' | 'failed',
                  }
                : a
            )
          )

          if (data.status === 'ready' || data.status === 'failed') {
            setProcessingAvatars(prev => {
              const next = new Set(prev)
              next.delete(avatarId)
              return next
            })
          }
        } catch (err) {
          console.error('[step3] Poll error:', err)
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [processingAvatars])

  // ── Load custom avatars ─────────────────────────────────
  async function loadCustomAvatars() {
    try {
      const res = await fetch('/api/studio/avatars?type=custom')
      if (!res.ok) return

      const data = await res.json()
      const processing = data.avatars
        .filter((a: CustomAvatar) => a.status === 'processing')
        .map((a: CustomAvatar) => a.id)

      setCustomAvatars(data.avatars)
      if (processing.length > 0) {
        setProcessingAvatars(new Set(processing))
      }
    } catch (err) {
      console.error('[step3] Load custom avatars error:', err)
    }
  }

  // ── Handle file upload ──────────────────────────────────
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError('Format harus JPG atau PNG')
      return
    }

    // Validate size
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 10MB')
      return
    }

    // Validate dimensions
    const img = new Image()
    img.onload = async () => {
      if (img.width < 512 || img.height < 512) {
        setUploadError('Resolusi minimal 512×512 pixels')
        return
      }

      // All validations passed → upload
      await uploadFile(file)
    }

    img.onerror = () => {
      setUploadError('File tidak valid')
    }

    img.src = URL.createObjectURL(file)
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setUploadError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', file.name.replace(/\.[^/.]+$/, ''))

      const res = await fetch('/api/studio/avatars/upload', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Upload failed')
      }

      const data = await res.json()

      // Create avatar object
      const newAvatar: CustomAvatar = {
        id: data.id,
        user_id: '',
        name: file.name.replace(/\.[^/.]+$/, ''),
        original_image_url: data.original_image_url,
        processed_image_url: data.original_image_url,
        dIdImageUrl: data.d_id_image_url || '',
        created_at: new Date().toISOString(),
        type: 'custom',
        status: data.status || 'processing',
      }

      setCustomAvatars(prev => [newAvatar, ...prev])

      if (newAvatar.status === 'processing') {
        setProcessingAvatars(prev => new Set([...prev, newAvatar.id]))
      } else {
        onSelectAvatar(newAvatar.id, 'custom')
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload gagal')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Delete custom avatar ────────────────────────────────
  async function deleteCustomAvatar(avatarId: string) {
    if (!confirm('Hapus avatar ini?')) return

    try {
      const res = await fetch(`/api/studio/avatars/${avatarId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setCustomAvatars(prev => prev.filter(a => a.id !== avatarId))
        if (selectedAvatarId === avatarId) {
          onSelectAvatar('', 'custom')
        }
      }
    } catch (err) {
      console.error('[step3] Delete error:', err)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* TABS */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {(['preset', 'collection', 'custom'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9px',
              border: `1.5px solid ${activeTab === tab ? C.amber : C.border}`,
              background: activeTab === tab ? `${C.amber}10` : C.white,
              fontSize: '12px',
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? C.amber : C.inkMuted,
              cursor: 'pointer',
              transition: 'all .15s',
              fontFamily: 'inherit',
            }}
          >
            {tab === 'preset' && '✨ Preset'}
            {tab === 'collection' && '🎬 Koleksi'}
            {tab === 'custom' && '📸 Upload'}
          </button>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* PRESET TAB                                           */}
      {/* ═════════════════════════════════════════════════════ */}
      {activeTab === 'preset' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Gender filter */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '4px',
              background: C.bg,
              borderRadius: '9px',
              border: `1px solid ${C.border}`,
            }}
          >
            {(['female', 'male'] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setCharTab(g)}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '7px',
                  border: 'none',
                  background: charTab === g ? C.white : 'transparent',
                  fontWeight: charTab === g ? 700 : 500,
                  fontSize: '12px',
                  color: charTab === g ? C.ink : C.inkMuted,
                  cursor: 'pointer',
                  boxShadow: charTab === g ? `0 1px 3px rgba(0,0,0,.06)` : 'none',
                  transition: 'all .15s',
                  fontFamily: 'inherit',
                }}
              >
                {g === 'female' ? '👩 Wanita' : '👨 Pria'}
              </button>
            ))}
          </div>

          {/* Preset grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {(charTab === 'female' ? CHARACTER_FEMALE : CHARACTER_MALE).map(c => {
              const sel = selectedAvatarId === c.id && avatarSource === 'preset'
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectAvatar(c.id, 'preset')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: `1.5px solid ${sel ? C.amber : C.border}`,
                    background: sel ? `${C.amber}10` : C.white,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all .15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    if (!sel) (e.currentTarget as HTMLElement).style.borderColor = C.amber
                  }}
                  onMouseLeave={e => {
                    if (!sel) (e.currentTarget as HTMLElement).style.borderColor = C.border
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: c.avatarBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      margin: '0 auto 8px',
                      border: sel ? `2px solid ${C.amber}` : '2px solid transparent',
                    }}
                  >
                    {c.icon}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: sel ? 700 : 500,
                      color: sel ? C.amberDk : C.ink,
                      marginBottom: '3px',
                    }}
                  >
                    {c.label}
                  </div>
                  {sel && <Check size={12} color={C.amber} style={{ margin: '0 auto' }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════ */}
      {/* COLLECTION TAB (IMPROVED SIZE)                       */}
      {/* ═════════════════════════════════════════════════════ */}
      {activeTab === 'collection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Category filter */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {getAvailableCategories().map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCollectionCategory(cat)}
                style={{
                  padding: '7px 13px',
                  borderRadius: '99px',
                  border: `1.5px solid ${collectionCategory === cat ? C.amber : C.border}`,
                  background: collectionCategory === cat ? `${C.amber}12` : C.white,
                  color: collectionCategory === cat ? C.amber : C.inkMuted,
                  fontSize: '12px',
                  fontWeight: collectionCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all .15s',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Collection grid — LARGE AVATARS (140px × 160px) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px',
            }}
          >
            {AVATAR_COLLECTION.filter(a => a.category === collectionCategory).map(a => {
              const sel = selectedAvatarId === a.id && avatarSource === 'collection'
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectAvatar(a.id, 'collection')}
                  style={{
                    padding: '0',
                    borderRadius: '11px',
                    border: `1.5px solid ${sel ? C.amber : C.border}`,
                    background: sel ? `${C.amber}10` : C.white,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all .15s',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={e => {
                    if (!sel) (e.currentTarget as HTMLElement).style.borderColor = C.amber
                  }}
                  onMouseLeave={e => {
                    if (!sel) (e.currentTarget as HTMLElement).style.borderColor = C.border
                  }}
                >
                  {/* LARGE THUMBNAIL — 140px × 160px */}
                  <div
                    style={{
                      width: '100%',
                      height: '160px',
                      background: C.bg,
                      backgroundImage: `url(${a.thumbnail})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                      position: 'relative',
                      border: sel ? `2px solid ${C.amber}` : 'none',
                    }}
                  >
                    {/* Hover overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background .2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.3)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'
                      }}
                    >
                      <div style={{ fontSize: '28px', color: '#fff', opacity: 0.8 }}>✓</div>
                    </div>
                  </div>

                  {/* Info section */}
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: sel ? C.amberDk : C.ink,
                        marginBottom: '2px',
                      }}
                    >
                      {a.label}
                    </div>
                    <div
                      style={{
                        fontSize: '9px',
                        color: C.inkMuted,
                        marginBottom: '3px',
                        flex: 1,
                      }}
                    >
                      {a.description}
                    </div>
                    <div
                      style={{
                        fontSize: '9px',
                        color: C.green,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={9} /> Ready
                    </div>
                  </div>

                  {sel && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: '28px',
                        height: '28px',
                        background: C.amber,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={14} color="#fff" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════ */}
      {/* CUSTOM UPLOAD TAB                                    */}
      {/* ═════════════════════════════════════════════════════ */}
      {activeTab === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Upload box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              borderRadius: '12px',
              border: `2px dashed ${uploadError ? C.red : C.border}`,
              background: C.bg,
              cursor: 'pointer',
              padding: '28px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              transition: 'all .18s',
            }}
            onMouseEnter={e => {
              if (!uploading && !uploadError)
                (e.currentTarget as HTMLElement).style.borderColor = C.amber
            }}
            onMouseLeave={e => {
              if (!uploading && !uploadError)
                (e.currentTarget as HTMLElement).style.borderColor = C.border
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: C.amberLt,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📸
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink, marginBottom: '3px' }}>
                Upload Foto Sendiri
              </div>
              <div style={{ fontSize: '11px', color: C.inkMuted }}>Klik atau drag foto di sini</div>
              <div style={{ fontSize: '10px', color: C.inkMuted, marginTop: '5px' }}>
                JPG/PNG • Min 512×512px • Max 10MB
              </div>
            </div>
            {uploading && (
              <div style={{ fontSize: '12px', fontWeight: 700, color: C.amber }}>
                <Loader2
                  size={16}
                  style={{ animation: 'spin .8s linear infinite', display: 'inline', marginRight: '5px' }}
                />
                Uploading...
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />

          {/* Error */}
          {uploadError && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '9px',
                background: '#FEF2F2',
                border: `1px solid ${C.red}30`,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                fontSize: '11px',
                color: C.red,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Custom avatars list */}
          {customAvatars.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.ink }}>Avatar Anda</div>
              {customAvatars.map(avatar => {
                const sel = selectedAvatarId === avatar.id && avatarSource === 'custom'
                const isProcessing = avatar.status === 'processing'

                return (
                  <div
                    key={avatar.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${sel ? C.amber : C.border}`,
                      background: sel ? `${C.amber}10` : C.white,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                    onClick={() => !isProcessing && onSelectAvatar(avatar.id, 'custom')}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: C.bg,
                        backgroundImage: `url(${avatar.processed_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {isProcessing && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Loader2
                            size={16}
                            color="#fff"
                            style={{ animation: 'spin .8s linear infinite' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: C.ink, marginBottom: '2px' }}>
                        📷 {avatar.name}
                      </div>
                      <div style={{ fontSize: '9px', color: C.inkMuted }}>
                        {isProcessing && 'Sedang diproses...'}
                        {avatar.status === 'ready' && 'Siap digunakan ✓'}
                        {avatar.status === 'failed' && 'Gagal diproses'}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isProcessing && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          deleteCustomAvatar(avatar.id)
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: `1px solid ${C.border}`,
                          background: C.white,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all .15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.red}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                      >
                        <X size={14} color={C.red} />
                      </button>
                    )}

                    {sel && <Check size={14} color={C.amber} />}
                  </div>
                )
              })}
            </div>
          )}

          {/* Info box */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '9px',
              background: '#EFF6FF',
              border: `1px solid ${C.blue}30`,
              display: 'flex',
              gap: '8px',
              fontSize: '10px',
              color: C.blue,
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              Avatar akan diproses dalam 2-3 menit. Anda bisa lanjut ke step berikutnya sambil menunggu.
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}