'use client'
// components/studio/PublishToTikTokButton.tsx
// ══════════════════════════════════════════════════════════════
// BEESELL AI — Tombol "Publish ke TikTok"
// ──────────────────────────────────────────────────────────────
// Drop-in di halaman manapun yang sudah punya URL video jadi
// (mis. UGC Video Generator setelah render ke R2). Menulis handoff
// lalu navigasi ke /studio/video/tiktok → tab Publish auto-terisi.
//
// Pemakaian:
//   <PublishToTikTokButton videoUrl={r2Url} caption={finalCaption} />
// ══════════════════════════════════════════════════════════════

import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { setPublishHandoff } from '@/lib/studio/tiktok/handoff'

export default function PublishToTikTokButton({
  videoUrl,
  caption,
  productName,
  source = 'ugc',
  label = 'Publish ke TikTok',
  disabled,
  fullWidth,
  style,
}: {
  videoUrl: string
  caption?: string
  productName?: string
  source?: string
  label?: string
  disabled?: boolean
  fullWidth?: boolean
  style?: React.CSSProperties
}) {
  const router = useRouter()

  const go = () => {
    if (!videoUrl) return
    setPublishHandoff({ videoUrl, caption, productName, source })
    router.push('/studio/video/tiktok?from=ugc')
  }

  const off = disabled || !videoUrl

  return (
    <button
      type="button"
      onClick={go}
      disabled={off}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        padding: '12px 16px',
        borderRadius: '11px',
        border: 'none',
        background: off ? '#A8A29E' : '#1C1917', // bee black
        color: '#fff',
        fontSize: '13px',
        fontWeight: 800,
        cursor: off ? 'not-allowed' : 'pointer',
        opacity: off ? 0.55 : 1,
        fontFamily: 'inherit',
        transition: 'all .18s',
        ...style,
      }}
    >
      <Send size={15} /> {label}
    </button>
  )
}