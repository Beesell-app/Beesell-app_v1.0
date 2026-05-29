'use client'
// apps/web-app/components/creator/UrlInputPanel.tsx
// Pakai ProductUrlInput yang sudah ada — wire ke contentCreatorStore
import { ProductUrlInput } from '@/components/scraper/ProductUrlInput'
import { useContentCreatorStore } from '@/store/contentCreatorStore'

export function UrlInputPanel() {
  const productUrl     = useContentCreatorStore(s => s.productUrl)
  const setProductName = useContentCreatorStore(s => s.setProductName)
  const setProductPrice = useContentCreatorStore(s => s.setProductPrice)
  const setProductBenefits = useContentCreatorStore(s => s.setProductBenefits)
  const setProductUrl  = useContentCreatorStore(s => s.setProductUrl)
  const setScrapedData = useContentCreatorStore(s => s.setScrapedData)
  const setMode        = useContentCreatorStore(s => s.setMode)

  const handleConfirm = (product: any) => {
    setProductName(product.name ?? '')
    setProductPrice(product.price ?? '')
    setProductBenefits(product.description ?? '')

    if (product.sourceUrl) setProductUrl(product.sourceUrl)
    setScrapedData(product)

    // Setelah confirm → auto-pindah ke tab Manual
    // supaya user bisa lihat hasil + edit kalau perlu
    setMode('manual')
  }

  return (
    <div>
      <div style={{
        marginBottom: '14px',
        padding: '12px 14px',
        background: '#F0F9FF',
        border: '1px solid #BAE6FD',
        borderRadius: '10px',
        fontSize: '12px',
        color: '#075985',
        lineHeight: 1.5,
      }}>
        💡 Paste link produk dari Shopee, Tokopedia, atau Lazada. AI akan otomatis baca info produk dalam 5-10 detik.
      </div>

      <ProductUrlInput
        initialUrl={productUrl}
        onConfirm={handleConfirm}
      />
    </div>
  )
}