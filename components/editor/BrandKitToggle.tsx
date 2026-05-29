'use client'

import type { Canvas } from 'fabric'

type Props = {
  canvas?: Canvas | null
  enabled?: boolean
  onToggle?: () => void
}

export function BrandKitToggle({
  canvas,
  enabled = false,
  onToggle,
}: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="px-3 py-2 rounded-lg border text-sm"
    >
      {enabled ? 'Brand Kit ON' : 'Brand Kit OFF'}
    </button>
  )
}