'use client'

type Props = {
  lines?: number
}

export function JobSkeleton({
  lines = 3,
}: Props) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-gray-200"
        />
      ))}
    </div>
  )
}