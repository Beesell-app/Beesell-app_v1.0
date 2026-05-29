'use client'
import { JobType } from '@/lib/hooks/useJobStatus'
// apps/web-app/components/jobs/ProgressBar.tsx
// Animated progress bar dengan smooth interpolation
// - Glow effect saat lagi processing
// - Auto green saat 100%
import { useEffect, useState } from 'react'

interface Props {
  value:    number      // 0-100
  height?:  number      // px (default 6)
  animated?: boolean    // glow + shimmer effect (default true saat <100)
  color?:   string
  showLabel?: boolean
  progress: number
  elapsedMs: number
  estimatedMs: number
  jobType?: JobType
  model?: string | null
}
export default function ProgressBar({
  progress,
  elapsedMs,
  estimatedMs,
  jobType,
  model,
}: Props): JSX.Element

export function ProgressBar({ value, height = 6, animated = true, color, showLabel }: Props) {
  // Smooth value interpolation untuk avoid jerky updates
  const [smoothValue, setSmoothValue] = useState(value)

  useEffect(() => {
    setSmoothValue(value)
  }, [value])

  const clamped = Math.min(Math.max(smoothValue, 0), 100)
  const isComplete = clamped >= 99.5
  const showAnimation = animated && !isComplete

  const fillColor = color ?? (isComplete ? '#16A34A' : '#2563EB')

  return (
    <div>
      <div style={{
        height: `${height}px`,
        background: '#F1F5F9',
        borderRadius: '99px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${clamped}%`,
          height: '100%',
          background: showAnimation
            ? `linear-gradient(90deg, ${fillColor}, ${fillColor}DD, ${fillColor})`
            : fillColor,
          backgroundSize: '200% 100%',
          borderRadius: '99px',
          transition: 'width .8s cubic-bezier(0.4, 0, 0.2, 1), background .3s',
          animation: showAnimation ? 'progress-shimmer 1.6s linear infinite' : undefined,
          boxShadow: showAnimation ? `0 0 12px ${fillColor}66` : undefined,
        }} />
      </div>

      {showLabel && (
        <div style={{
          marginTop: '6px',
          fontSize: '11px',
          color: isComplete ? '#16A34A' : '#64748B',
          fontFamily: "'DM Mono', monospace",
          textAlign: 'right',
          fontWeight: isComplete ? 600 : 500,
        }}>
          {Math.round(clamped)}%
        </div>
      )}

      <style>{`
        @keyframes progress-shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
    </div>
  )
}