'use client'
// apps/web-app/app/(dashboard)/settings/brand-kit/page.tsx
// ── Brand kit settings page ───────────────────────────────────
// List kits, create new, edit selected (real-time preview)
import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Upload,
  Star,
  StarOff,
  Loader2,
  Check,
  AlertCircle,
  Palette,
  Type as TypeIcon,
  X,
} from 'lucide-react'
import {
  useBrandKitList, useCreateBrandKit, useUpdateBrandKit,
  useDeleteBrandKit, useSetDefaultKit,
} from '@/hooks/useBrandKit'
import type { BrandKit } from '@/hooks/useBrandKit'
import { BrandKitPreview } from '@/components/brand-kit/BrandKitPreview'
const AVAILABLE_FONTS = [
  'DM Sans', 'Fraunces', 'Poppins', 'Montserrat', 'Inter',
  'Playfair Display', 'Bebas Neue', 'Oswald', 'Raleway', 'Nunito',
]

const TONE_OPTIONS = [
  { value: 'casual',        label: 'Santai 😎' },
  { value: 'friendly',      label: 'Ramah 😊' },
  { value: 'professional',  label: 'Profesional 👔' },
  { value: 'energetic',     label: 'Hype 🔥' },
  { value: 'luxury',        label: 'Mewah 💎' },
  { value: 'playful',       label: 'Lucu 🎉' },
  { value: 'authoritative', label: 'Autoritas 📊' },
]

const LANGUAGE_OPTIONS = [
  { value: 'indonesian_casual', label: 'ID Gaul' },
  { value: 'indonesian_formal', label: 'ID Formal' },
  { value: 'mixed_english',     label: 'ID-EN Campur' },
  { value: 'full_english',      label: 'English' },
]

type EditorState = Partial<Omit<BrandKit, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>

const DEFAULT_NEW_KIT: EditorState = {
  name:           'Brand Kit Baru',
  primaryColor:   '#2563EB',
  secondaryColor: '#1D4ED8',
  accentColor:    '#FFE600',
  bgColor:        '#FFFFFF',
  textColor:      '#0F172A',
  primaryFont:    'DM Sans',
  secondaryFont:  'Fraunces',
  defaultTone:    'casual',
  defaultLanguage: 'indonesian_casual',
  brandKeywords:  '',
  avoidWords:     '',
  isDefault:      false,
}

export default function BrandKitPage() {
  const { data: kits = [], isLoading } = useBrandKitList()
  const { mutate: create, isPending: creating } = useCreateBrandKit()
  const { mutate: update, isPending: saving }   = useUpdateBrandKit()
  const { mutate: remove, isPending: deleting } = useDeleteBrandKit()
  const setDefault = useSetDefaultKit()

  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)
  const [form,       setForm]       = useState<EditorState>(DEFAULT_NEW_KIT)
  const [saved,      setSaved]      = useState(false)
  const [err,        setErr]        = useState<string | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)

  // Merge preview with form data
  const previewKit: BrandKit = {
    id:             selectedId ?? 'preview',
    tenant_id:       '',
    isActive:       true,
    created_at:      '',
    updated_at:      '',
    description:    null,
    logoUrl:        null,
    logoStoragePath: null,
    ...DEFAULT_NEW_KIT,
    ...form,
    name: form.name ?? 'Preview',
  } as BrandKit

  const handleSelect = (kit: BrandKit) => {
    setSelectedId(kit.id)
    setForm({
      name:           kit.name,
      description:    kit.description ?? '',
      primaryColor:   kit.primaryColor,
      secondaryColor: kit.secondaryColor,
      accentColor:    kit.accentColor,
      bgColor:        kit.bgColor,
      textColor:      kit.textColor,
      primaryFont:    kit.primaryFont,
      secondaryFont:  kit.secondaryFont,
      defaultTone:    kit.defaultTone,
      defaultLanguage: kit.defaultLanguage,
      brandKeywords:  kit.brandKeywords ?? '',
      avoidWords:     kit.avoidWords ?? '',
      logoUrl:        kit.logoUrl,
      isDefault:      kit.isDefault,
    })
    setErr(null)
    setSaved(false)
  }

  const handleNew = () => {
    setSelectedId('new')
    setForm(DEFAULT_NEW_KIT)
    setErr(null)
    setSaved(false)
  }

  const handleSave = () => {
    setErr(null)
    if (!form.name?.trim()) { setErr('Nama brand kit tidak boleh kosong.'); return }

    if (selectedId === 'new') {
      create(form as any, {
        onSuccess: (kit) => {
          setSelectedId(kit.id)
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
        onError: (e: any) => setErr(e.message),
      })
    } else if (selectedId) {
      update({ id: selectedId, ...form } as any, {
        onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) },
        onError:   (e: any) => setErr(e.message),
      })
    }
  }

  const handleDelete = () => {
    if (!selectedId || selectedId === 'new') return
    if (!confirm('Hapus brand kit ini?')) return
    remove(selectedId, {
      onSuccess: () => { setSelectedId(null); setForm(DEFAULT_NEW_KIT) },
      onError:   (e: any) => setErr(e.message),
    })
  }

  const patch = (key: keyof EditorState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B', textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Pengaturan
        </Link>
        <span style={{ color: '#CBD5E1' }}>/</span>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
          Brand Kit
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>

        {/* ── Left: Kit list ─────────────────────────────── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleNew}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
              padding: '10px',
              background: '#fff', border: '1.5px dashed #CBD5E1', borderRadius: '10px',
              fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#CBD5E1'}
          >
            <Plus size={13} /> Brand Kit Baru
          </button>

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Loader2 size={16} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {kits.map(kit => (
            <button
              key={kit.id}
              onClick={() => handleSelect(kit)}
              style={{
                padding:      '10px 12px',
                background:   selectedId === kit.id ? '#EFF6FF' : '#fff',
                border:       `1px solid ${selectedId === kit.id ? '#2563EB' : '#E2E8F0'}`,
                borderRadius: '10px',
                cursor:       'pointer',
                textAlign:    'left',
                fontFamily:   "'DM Sans', sans-serif",
                transition:   'all .12s',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                {[kit.primaryColor, kit.secondaryColor, kit.accentColor].map((c, i) => (
                  <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, border: '1px solid #E2E8F0' }} />
                ))}
                {kit.isDefault && <Star size={11} color="#F59E0B" style={{ marginLeft: 'auto' }} />}
              </div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{kit.name}</p>
              <p style={{ fontSize: '10px', color: '#94A3B8' }}>{kit.primaryFont}</p>
            </button>
          ))}
        </aside>

        {/* ── Right: Editor ──────────────────────────────── */}
        {!selectedId ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#F8FAFC', borderRadius: '14px', border: '1px dashed #CBD5E1',
            padding: '60px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <Palette size={28} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Pilih atau buat brand kit
              </p>
              <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                Warna, font, dan tone default untuk konten kamu
              </p>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>

            {/* Editor header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 20px', borderBottom: '1px solid #E2E8F0',
            }}>
              <input
                value={form.name ?? ''}
                onChange={e => patch('name', e.target.value)}
                placeholder="Nama brand kit..."
                style={{
                  flex: 1, fontSize: '15px', fontWeight: 700, color: '#0F172A',
                  border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif",
                  background: 'transparent',
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {selectedId !== 'new' && (
                  <>
                    <button
                      onClick={() => setDefault(selectedId)}
                      title={form.isDefault ? 'Already default' : 'Set as default'}
                      style={{
                        padding: '6px 10px', background: form.isDefault ? '#FEF3C7' : '#F8FAFC',
                        border: `1px solid ${form.isDefault ? '#FDE68A' : '#E2E8F0'}`,
                        borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '11px', fontWeight: 500,
                        color: form.isDefault ? '#92400E' : '#64748B',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {form.isDefault ? <Star size={12} color="#F59E0B" /> : <StarOff size={12} />}
                      {form.isDefault ? 'Default' : 'Jadikan Default'}
                    </button>

                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{
                        padding: '6px', background: '#FEF2F2', border: '1px solid #FECACA',
                        borderRadius: '8px', cursor: 'pointer', color: '#DC2626',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || creating}
                  style={{
                    padding: '7px 16px',
                    background: saving || creating ? '#CBD5E1' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    display: 'flex', alignItems: 'center', gap: '5px',
                  }}
                >
                  {saving || creating
                    ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
                    : saved
                    ? <><Check size={12} /> Tersimpan</>
                    : <><Save size={12} /> Simpan</>
                  }
                </button>
              </div>
            </div>

            {err && (
              <div style={{ padding: '10px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', fontSize: '12px', color: '#DC2626', display: 'flex', gap: '6px' }}>
                <AlertCircle size={14} /> {err}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '0' }}>

              {/* ── Form ──────────────────────────── */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* COLORS */}
                <section>
                  <SectionTitle icon={<Palette size={13} />}>Warna Brand</SectionTitle>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {([
                      { key: 'primaryColor',   label: 'Primary' },
                      { key: 'secondaryColor', label: 'Secondary' },
                      { key: 'accentColor',    label: 'Aksen' },
                      { key: 'bgColor',        label: 'Background' },
                      { key: 'textColor',      label: 'Teks' },
                    ] as const).map(({ key, label }) => (
                      <div key={key}>
                        <label style={fieldLabel}>{label}</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={(form as any)[key] ?? '#000000'}
                            onChange={e => patch(key, e.target.value)}
                            style={{ width: '36px', height: '28px', padding: '1px 2px', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={(form as any)[key] ?? ''}
                            onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && patch(key, e.target.value)}
                            style={{ ...inputStyle, flex: 1, fontFamily: "'DM Mono', monospace", fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* FONTS */}
                <section>
                  <SectionTitle icon={<TypeIcon size={13} />}>Typography</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={fieldLabel}>Font Utama</label>
                      <select value={form.primaryFont} onChange={e => patch('primaryFont', e.target.value)} style={inputStyle}>
                        {AVAILABLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={fieldLabel}>Font Display</label>
                      <select value={form.secondaryFont} onChange={e => patch('secondaryFont', e.target.value)} style={inputStyle}>
                        {AVAILABLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* VOICE */}
                <section>
                  <SectionTitle>Tone & Bahasa Default</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={fieldLabel}>Tone</label>
                      <select value={form.defaultTone} onChange={e => patch('defaultTone', e.target.value)} style={inputStyle}>
                        {TONE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={fieldLabel}>Bahasa</label>
                      <select value={form.defaultLanguage} onChange={e => patch('defaultLanguage', e.target.value)} style={inputStyle}>
                        {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* KEYWORDS */}
                <section>
                  <SectionTitle>Keywords Brand</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={fieldLabel}>Wajib sebut (comma-separated)</label>
                      <input
                        value={form.brandKeywords ?? ''}
                        onChange={e => patch('brandKeywords', e.target.value)}
                        placeholder="Contoh: premium, terpercaya, garansi 1 tahun"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabel}>Hindari kata-kata</label>
                      <input
                        value={form.avoidWords ?? ''}
                        onChange={e => patch('avoidWords', e.target.value)}
                        placeholder="Contoh: murah, diskon murahan"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* ── Preview ──────────────────────── */}
              <div style={{
                padding:     '20px',
                borderLeft:  '1px solid #E2E8F0',
                background:  '#F8FAFC',
                display:     'flex',
                flexDirection: 'column',
                gap:         '12px',
                alignItems:  'center',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'flex-start' }}>
                  Preview
                </p>

                <BrandKitPreview kit={previewKit} size="md" />

                {/* Logo upload */}
                <div style={{ width: '100%' }}>
                  <label style={fieldLabel}>Logo</label>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      width: '100%', padding: '8px', background: '#fff',
                      border: '1.5px dashed #CBD5E1', borderRadius: '8px',
                      fontSize: '11px', fontWeight: 500, color: '#64748B',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    }}
                  >
                    <Upload size={12} /> {form.logoUrl ? 'Ganti Logo' : 'Upload Logo'}
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/webp"
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      // Preview via object URL (full upload handled via /api/upload/photo)
                      const url = URL.createObjectURL(file)
                      patch('logoUrl', url)
                    }}
                  />
                  {form.logoUrl && (
                    <button
                      onClick={() => patch('logoUrl', null)}
                      style={{
                        marginTop: '4px', width: '100%', padding: '4px',
                        background: 'transparent', border: 'none',
                        fontSize: '10px', color: '#DC2626', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <X size={10} /> Hapus logo
                    </button>
                  )}
                </div>

                <div style={{ padding: '10px', background: '#EFF6FF', borderRadius: '8px', width: '100%' }}>
                  <p style={{ fontSize: '10px', color: '#1E40AF', lineHeight: 1.5 }}>
                    💡 Brand kit dipakai otomatis saat generate caption — tone, bahasa, dan keywords akan di-inject ke prompt AI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────
function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 700, color: '#64748B',
      textTransform: 'uppercase', letterSpacing: '0.04em',
      marginBottom: '10px',
      display: 'flex', alignItems: 'center', gap: '5px',
    }}>
      {icon} {children}
    </p>
  )
}

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: '#64748B', marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  border: '1px solid #E2E8F0', borderRadius: '8px',
  fontSize: '12px', color: '#0F172A', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", background: '#fff',
}