'use client'
// hooks/use-tool-access.ts
// ── Hook akses tool untuk komponen client ─────────────────────
// const { access, tier, loaded } = useToolAccess()
// access[toolId] → { available, status, beta, locked, reason }

import { useState, useEffect } from 'react'
import type { ToolAccess } from '@/lib/tools/access'

export function useToolAccess() {
  const [access, setAccess] = useState<Record<string, ToolAccess>>({})
  const [tier,   setTier]   = useState('starter')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/tools/access', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (alive && d) { setAccess(d.access ?? {}); setTier(d.tier ?? 'starter') }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true) })
    return () => { alive = false }
  }, [])

  return { access, tier, loaded }
}