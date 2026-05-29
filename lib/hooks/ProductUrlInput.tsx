'use client'
// apps/web-app/components/scraper/ProductUrlInput.tsx
// ── Input URL produk dengan auto-scrape + fallback manual ────
// Flow:
//   1. User paste URL → tombol "Ambil Info"
//   2. Loading 10 detik max
//   3a. Success → tampilkan preview + confirm button
//   3b. Fallback → switch ke form manual
//   3c. Error → toast + opsi retry / manual
import { useState, useEffect }  from 'react'
import { Loader2, Link2, Check, AlertCircle, Edit3 } from 'lucide-react'
import { useScrapeProduct }     from '@/lib/hooks/useScrapeProduct'

export interface ProductData {
  name:         string
  price:        string
  description:  string
  images:       string[]
  sourceUrl?:   string
  marketplace?: string
}

interface Props {
  onConfirm: (product: ProductData) => void
  initialUrl?: string
}

export function ProductUrlInput({ onConfirm, initialUrl = '' }: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [manualMode, setManualMode] = useState(false)

  // Manual input fields
  const [manualName,        setManualName]        = useState('')
  const [manualPrice,       setManualPrice]       = useState('')
  const [manualDescription, setManualDescription] = useState('')

  const { state, scrape, reset, isScraping, isSuccess, isFallback, isError, data, error, fallbackMsg } = useScrapeProduct()

  // Auto-enter manual mode kalau backend return fallback
  useEffect(() => {
    if (isFallback) {
      setManualMode(true)
    }
  }, [isFallback])

  const handleScrape = () => {
    if (!url.trim()) return
    scrape(url.trim())
  }

  const handleConfirmScraped = () => {
    if (!data) return
    onConfirm({
      name:        data.name,
      price:       data.price ?? '',
      description: data.description ?? '',
      images:      data.images,
      sourceUrl:   data.url,
      marketplace: data.marketplace,
    })
  }

  const handleConfirmManual = () => {
    if (!manualName.trim()) return
    onConfirm({
      name:        manualName.trim(),
      price:       manualPrice.trim(),
      description: manualDescription.trim(),
      images:      [],
    })
  }

  const handleSwitchToManual = () => {
    setManualMode(true)
    reset()
  }

  // ── Styles ─────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width:     '100%',
    padding:   '11px 14px',
    border:    '1px solid #E2E8F0',
    borderRadius: '10px',
    fontSize:  '14px',
    color:     '#0F172A',
    outline:   'none',
    fontFamily: "'DM Sans', sans-serif",
  }

  const labelStyle: React.CSSProperties = {
    display:    'block',
    fontSize:   '13px',
    fontWeight: 600,
    color:      '#334155',
    marginBottom: '6px',
  }

  // ── Manual mode ─────────────────────────────────────────
  if (manualMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'DM Sans', sans-serif" }}>
        {fallbackMsg && (
          <div style={{
            padding: '12px 14px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '10px',
            display: 'flex', alignItems: 'start', gap: '10px',
            fontSize: '13px', color: '#92400E',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Scrape gagal</strong>
              {fallbackMsg}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Nama produk <span style={{ color: '#EF4444' }}>*</span></label>
          <input
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            placeholder="Contoh: Tas Wanita Kulit Premium"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>Harga</label>
          <input
            value={manualPrice}
            onChange={e => setManualPrice(e.target.value)}
            placeholder="Contoh: Rp 299.000"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Deskripsi / keunggulan</label>
          <textarea
            value={manualDescription}
            onChange={e => setManualDescription(e.target.value)}
            placeholder="Material kulit asli, muat laptop 14 inch..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => { setManualMode(false); reset(); }}
            style={{
              padding: '11px 16px',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#334155',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ← Pakai URL lagi
          </button>

          <button
            type="button"
            onClick={handleConfirmManual}
            disabled={!manualName.trim()}
            style={{
              flex: 1,
              padding: '11px',
              background: manualName.trim()
                ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                : '#CBD5E1',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: manualName.trim() ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Gunakan Produk Ini →
          </button>
        </div>
      </div>
    )
  }

  // ── URL mode ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: "'DM Sans', sans-serif" }}>
      {/* URL input */}
      <div>
        <label style={labelStyle}>Link produk dari Shopee / Tokopedia / Lazada</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Link2 size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScrape()}
              placeholder="https://shopee.co.id/..."
              style={{ ...inputStyle, paddingLeft: '38px' }}
              disabled={isScraping}
            />
          </div>
          <button
            type="button"
            onClick={handleScrape}
            disabled={!url.trim() || isScraping}
            style={{
              padding: '0 18px',
              background: url.trim() && !isScraping
                ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                : '#CBD5E1',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: url.trim() && !isScraping ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {isScraping
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Ambil...</>
              : 'Ambil Info'
            }
          </button>
        </div>
        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
          Atau{' '}
          <button
            type="button"
            onClick={handleSwitchToManual}
            style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: 0, fontSize: '11px', textDecoration: 'underline' }}
          >
            input manual tanpa link
          </button>
        </p>
      </div>

      {/* Loading state */}
      {isScraping && (
        <div style={{
          padding: '20px',
          background: '#F8FAFC',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px dashed #CBD5E1',
        }}>
          <Loader2 size={20} color="#2563EB" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Mengambil data produk... (max 10 detik)
          </p>
        </div>
      )}

      {/* Error state with manual fallback */}
      {isError && (
        <div style={{
          padding: '14px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '10px',
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '13px', color: '#991B1B' }}>{error}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleScrape}
              style={{ padding: '6px 12px', background: '#fff', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '12px', color: '#991B1B', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              Coba lagi
            </button>
            <button
              type="button"
              onClick={handleSwitchToManual}
              style={{ padding: '6px 12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              Input manual →
            </button>
          </div>
        </div>
      )}

      {/* Success preview */}
      {isSuccess && data && (
        <div style={{
          padding: '14px',
          background: '#F0FDF4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Check size={14} color="#16A34A" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803D' }}>
              Berhasil diambil dari {data.marketplace} · {data.strategy}
            </span>
          </div>

          {/* Preview card */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            {data.images[0] && (
              <img
                src={data.images[0]}
                alt={data.name}
                style={{
                  width: '72px', height: '72px',
                  objectFit: 'cover', borderRadius: '8px',
                  flexShrink: 0, border: '1px solid #E2E8F0',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '2px', lineHeight: 1.4 }}>
                {data.name}
              </p>
              {data.price && (
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#2563EB', marginBottom: '2px' }}>
                  {data.price}
                </p>
              )}
              {data.sellerName && (
                <p style={{ fontSize: '11px', color: '#64748B' }}>
                  {data.sellerName}{data.location ? ` · ${data.location}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSwitchToManual}
              style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'DM Sans', sans-serif" }}
            >
              <Edit3 size={12} /> Edit manual
            </button>
            <button
              type="button"
              onClick={handleConfirmScraped}
              style={{
                flex: 1,
                padding: '8px 14px',
                background: '#16A34A',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Gunakan Produk Ini →
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}