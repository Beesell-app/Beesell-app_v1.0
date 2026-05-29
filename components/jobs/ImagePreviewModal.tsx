'use client'

type Props = {
  open?: boolean
  media_url?: string | null
  onClose?: () => void
   metadata?: {
    durationMs?: number
   }
}

export function ImagePreviewModal({
  open = false,
  media_url,
  onClose,
  metadata
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div className="max-w-4xl max-h-[90vh] p-4">
        {media_url ? (
          <img
            src={media_url}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-xl"
          />
        ) : (
          <div className="text-white">
            No image available
          </div>
        )}
      </div>
    </div>
  )
}