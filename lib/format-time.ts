export function formatDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return '0s'

  const totalSeconds = Math.floor(ms / 1000)

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}

export function formatEta(
  estimatedTime?: number,
  elapsedMs?: number
) {
  if (!estimatedTime) return 'Calculating...'

  const remaining = Math.max(
    estimatedTime - (elapsedMs || 0),
    0
  )

  return formatDuration(remaining)
}