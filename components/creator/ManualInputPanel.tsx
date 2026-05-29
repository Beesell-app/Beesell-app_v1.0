'use client'
// apps/web-app/components/creator/ManualInputPanel.tsx
// Manual input — semua field product di sini
// Juga jadi "final form" karena URL/Photo akan apply data ke field-field ini
import { useContentCreatorStore } from '@/store/contentCreatorStore'
import { Package, Tag, Sparkles, Users } from 'lucide-react'

export function ManualInputPanel() {
  const productName     = useContentCreatorStore(s => s.productName)
  const productPrice    = useContentCreatorStore(s => s.productPrice)
  const productBenefits = useContentCreatorStore(s => s.productBenefits)
  const targetAudience  = useContentCreatorStore(s => s.targetAudience)

  const setProductName     = useContentCreatorStore(s => s.setProductName)
  const setProductPrice    = useContentCreatorStore(s => s.setProductPrice)
  const setProductBenefits = useContentCreatorStore(s => s.setProductBenefits)
  const setTargetAudience  = useContentCreatorStore(s => s.setTargetAudience)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: "'DM Sans', sans-serif" }}>

      <Field
        icon={<Package size={13} />}
        label="Nama produk"
        required
        hint={productName.length > 0 && productName.length < 3 ? 'Minimal 3 karakter' : undefined}
        hintError={productName.length > 0 && productName.length < 3}
      >
        <input
          value={productName}
          onChange={e => setProductName(e.target.value)}
          placeholder="Contoh: Tas Wanita Kulit Premium"
          style={inputStyle}
          autoFocus
        />
      </Field>

      <Field
        icon={<Tag size={13} />}
        label="Harga"
        hint="Optional — boleh kosong kalau mau AI auto-skip"
      >
        <input
          value={productPrice}
          onChange={e => setProductPrice(e.target.value)}
          placeholder="Contoh: Rp 299.000"
          style={inputStyle}
        />
      </Field>

      <Field
        icon={<Sparkles size={13} />}
        label="Keunggulan / benefit produk"
        hint={`${productBenefits.length}/500 karakter`}
      >
        <textarea
          value={productBenefits}
          onChange={e => e.target.value.length <= 500 && setProductBenefits(e.target.value)}
          placeholder="Contoh: Material kulit asli, muat laptop 14 inch, garansi 1 tahun"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: 1.5 }}
        />
      </Field>

      <Field
        icon={<Users size={13} />}
        label="Target audiens"
        hint="Optional — bantu AI fine-tune bahasa & angle"
      >
        <input
          value={targetAudience}
          onChange={e => setTargetAudience(e.target.value)}
          placeholder="Contoh: wanita 25-35 tahun, pekerja kantoran"
          style={inputStyle}
        />
      </Field>
    </div>
  )
}

// ── Reusable Field wrapper ──────────────────────────────────
function Field({ icon, label, required, hint, hintError, children }: {
  icon:       React.ReactNode
  label:      string
  required?:  boolean
  hint?:      string
  hintError?: boolean
  children:   React.ReactNode
}) {
  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '12px', fontWeight: 600,
        color: '#334155',
        marginBottom: '6px',
      }}>
        <span style={{ color: '#94A3B8' }}>{icon}</span>
        {label}
        {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{
          fontSize: '11px',
          color: hintError ? '#DC2626' : '#94A3B8',
          marginTop: '4px',
        }}>
          {hint}
        </p>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  fontSize: '13px',
  color: '#0F172A',
  background: '#fff',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'border-color .15s, box-shadow .15s',
}