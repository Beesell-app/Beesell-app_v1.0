'use client'
// apps/web-app/app/(dashboard)/content/[id]/page.tsx
import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useContent, useUpdateContent, useContentAction, useDeleteContent } from '@/hooks/useContents'
import { ArrowLeft, Copy, Check, Archive, Trash2, Edit3, Save, X, Loader2, Hash, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: content, isLoading, error } = useContent(id)
  const { mutate: update, isPending: updating } = useUpdateContent()
  const { mutate: action } = useContentAction()
  const { mutate: deleteContent } = useDeleteContent()

  const [editMode, setEditMode]   = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleEdit = () => {
    setEditCaption(content?.caption_text ?? '')
    setEditTitle(content?.title ?? '')
    setEditMode(true)
  }

  const handleSave = () => {
    update(
      { id, caption_text: editCaption, title: editTitle },
      { onSuccess: () => setEditMode(false) },
    )
  }

  const handleArchive = () => {
    if (!confirm('Arsipkan konten ini?')) return
    action({ id, action: 'archive' })
  }

  const handleDelete = () => {
    if (!confirm('Hapus konten ini? Tidak bisa di-undo.')) return
    deleteContent(id, {
      onSuccess: () => router.push('/content'),
    })
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', fontFamily: "'DM Sans', sans-serif" }}>
        <Loader2 size={20} color="#2563EB" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '13px', color: '#64748B' }}>Memuat...</p>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div style={{
        maxWidth: '640px', margin: '0 auto',
        padding: '40px 24px', textAlign: 'center',
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
          Konten tidak ditemukan
        </p>
        <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>
          Konten mungkin sudah dihapus atau ID tidak valid.
        </p>
        <Link href="/content" style={{
          padding: '10px 20px', background: '#2563EB',
          color: '#fff', textDecoration: 'none', borderRadius: '10px',
          fontSize: '13px', fontWeight: 600,
        }}>
          Kembali ke Library
        </Link>
      </div>
    )
  }

  const variants = (content.caption_variants as any[]) ?? []

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Back link */}
      <Link href="/content" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontSize: '13px', color: '#64748B', textDecoration: 'none',
        marginBottom: '16px',
      }}>
        <ArrowLeft size={13} /> Kembali ke library
      </Link>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: '16px', marginBottom: '20px', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editMode ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Judul konten..."
              style={{
                width: '100%',
                fontFamily: "'Fraunces', serif",
                fontSize: '24px', fontWeight: 600,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                padding: '6px 8px',
                border: '1px solid #E2E8F0', borderRadius: '8px',
                outline: 'none',
                marginBottom: '8px',
              }}
            />
          ) : (
            <h1 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '26px', fontWeight: 600,
              color: '#0F172A', letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}>
              {content.title || 'Untitled'}
            </h1>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px', color: '#64748B' }}>
            <StatusBadge status={content.status} />
            <span>·</span>
            <span style={{ textTransform: 'capitalize' }}>{content.type}</span>
            {content.primary_platform && (
              <>
                <span>·</span>
                <span style={{ textTransform: 'capitalize' }}>{content.primary_platform}</span>
              </>
            )}
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} />
              {new Date(content.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                style={{
                  padding: '8px 14px', background: '#fff',
                  border: '1px solid #E2E8F0', borderRadius: '9px',
                  fontSize: '13px', fontWeight: 500, color: '#475569',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <X size={13} /> Batal
              </button>
              <button
                onClick={handleSave}
                disabled={updating}
                style={{
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#fff', border: 'none', borderRadius: '9px',
                  fontSize: '13px', fontWeight: 600,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: updating ? 0.6 : 1,
                }}
              >
                {updating
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
                  : <><Save size={13} /> Simpan</>
                }
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                style={{
                  padding: '8px 14px', background: '#fff',
                  border: '1px solid #E2E8F0', borderRadius: '9px',
                  fontSize: '13px', fontWeight: 500, color: '#475569',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Edit3 size={13} /> Edit
              </button>
              <button
                onClick={handleArchive}
                style={{
                  padding: '8px', background: '#fff',
                  border: '1px solid #E2E8F0', borderRadius: '9px',
                  cursor: 'pointer', color: '#64748B',
                }}
                title="Arsipkan"
              >
                <Archive size={13} />
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px', background: '#fff',
                  border: '1px solid #FECACA', borderRadius: '9px',
                  cursor: 'pointer', color: '#DC2626',
                }}
                title="Hapus"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit mode caption */}
      {editMode && (
        <div style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '16px',
        }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
            Caption
          </label>
          <textarea
            value={editCaption}
            onChange={e => setEditCaption(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E2E8F0', borderRadius: '10px',
              fontSize: '13px', lineHeight: 1.6, color: '#0F172A',
              outline: 'none', resize: 'vertical',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
      )}

      {/* Variants — display mode */}
      {!editMode && variants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {variants.map((v: any, i: number) => {
            const fullText = [
              v.caption,
              v.cta && `\n\n${v.cta}`,
              v.hashtags?.length > 0 && `\n\n${v.hashtags.map((t: string) => `#${t}`).join(' ')}`,
            ].filter(Boolean).join('')

            return (
              <div key={i} style={{
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '20px',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '12px',
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: '#94A3B8', letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    Variasi {i + 1}
                  </span>
                  <button
                    onClick={() => copyToClipboard(fullText, i)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px',
                      background: copiedIndex === i ? '#16A34A' : '#F8FAFC',
                      border: copiedIndex === i ? 'none' : '1px solid #E2E8F0',
                      borderRadius: '7px',
                      fontSize: '11px', fontWeight: 600,
                      color: copiedIndex === i ? '#fff' : '#475569',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all .15s',
                    }}
                  >
                    {copiedIndex === i
                      ? <><Check size={11} /> Copied</>
                      : <><Copy size={11} /> Copy semua</>
                    }
                  </button>
                </div>

                {/* Caption body */}
                {v.caption && (
                  <p style={{
                    fontSize: '14px', color: '#0F172A',
                    lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    marginBottom: v.cta || v.hashtags?.length > 0 ? '14px' : 0,
                  }}>
                    {v.caption}
                  </p>
                )}

                {/* CTA */}
                {v.cta && (
                  <div style={{
                    padding: '10px 14px',
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    borderRadius: '9px',
                    marginBottom: v.hashtags?.length > 0 ? '12px' : 0,
                  }}>
                    <p style={{
                      fontSize: '13px', color: '#1E3A8A',
                      fontWeight: 600, lineHeight: 1.5,
                    }}>
                      👉 {v.cta}
                    </p>
                  </div>
                )}

                {/* Hashtags */}
                {v.hashtags?.length > 0 && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '5px',
                    paddingTop: '12px',
                    borderTop: '1px solid #F1F5F9',
                  }}>
                    <Hash size={13} color="#94A3B8" style={{ marginTop: '3px' }} />
                    {v.hashtags.map((tag: string, ti: number) => (
                      <span key={ti} style={{
                        padding: '3px 9px',
                        background: '#F1F5F9',
                        color: '#475569',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 500,
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Fallback kalau tidak ada variants */}
      {!editMode && variants.length === 0 && content.caption_text && (
        <div style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
        }}>
          <p style={{
            fontSize: '14px', color: '#0F172A',
            lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}>
            {content.caption_text}
          </p>
        </div>
      )}

      {/* Product info */}
      {content.product_data && Object.keys(content.product_data as any).length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '16px 20px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Info Produk
          </p>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: '12px' }}>
            {(content.product_data as any).name && (
              <>
                <dt style={{ color: '#64748B' }}>Nama:</dt>
                <dd style={{ color: '#0F172A', fontWeight: 500 }}>{(content.product_data as any).name}</dd>
              </>
            )}
            {(content.product_data as any).price && (
              <>
                <dt style={{ color: '#64748B' }}>Harga:</dt>
                <dd style={{ color: '#0F172A', fontWeight: 500 }}>{(content.product_data as any).price}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}