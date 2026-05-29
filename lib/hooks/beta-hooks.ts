'use client'
// apps/web-app/lib/hooks/beta-hooks.ts
// ── All beta-related hooks ─────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

// ══════════════════════════════════════════════════════════════
// useNpsSurvey — checks D+3/7/30 and shows modal
// ══════════════════════════════════════════════════════════════
export function useNpsSurvey() {
  const [show, setShow]         = useState(false)
  const [surveyDay, setSurveyDay] = useState(3)

  useEffect(() => {
    // Don't show on initial page load — wait 10 seconds
    const timer = setTimeout(async () => {
      // Check localStorage first (dismiss for 24h if already seen)
      const lastSeen = localStorage.getItem('nps_last_seen')
      if (lastSeen) {
        const daysSince = (Date.now() - Number(lastSeen)) / (1000 * 60 * 60 * 24)
        if (daysSince < 1) return  // shown in last 24h
      }

      try {
        const res  = await fetch('/api/nps?day=3')
        const data = await res.json()
        if (data.show) {
          setSurveyDay(data.surveyDay ?? 3)
          setShow(true)
          localStorage.setItem('nps_last_seen', String(Date.now()))
        }
      } catch {}
    }, 10_000)

    return () => clearTimeout(timer)
  }, [])

  const dismiss = useCallback(() => setShow(false), [])

  return { show, surveyDay, dismiss }
}

// ══════════════════════════════════════════════════════════════
// useFeedbackOnLogout — intercept logout to show feedback modal
// ══════════════════════════════════════════════════════════════
export function useFeedbackOnLogout() {
  const [showModal, setShowModal] = useState(false)
  const [pendingLogout, setPendingLogout] = useState<(() => void) | null>(null)

  const interceptLogout = useCallback((logoutFn: () => void) => {
    // Check if user has given feedback before (skip if yes)
    const hasGivenFeedback = localStorage.getItem('logout_feedback_given')
    const sessionCount = parseInt(localStorage.getItem('session_count') ?? '0')

    // Only show on 2nd+ logout, not every time
    if (hasGivenFeedback || sessionCount < 1) {
      logoutFn()
      return
    }

    setShowModal(true)
    setPendingLogout(() => logoutFn)
  }, [])

  const handleFeedbackSubmit = useCallback(() => {
    localStorage.setItem('logout_feedback_given', 'true')
    pendingLogout?.()
    setShowModal(false)
  }, [pendingLogout])

  const handleSkip = useCallback(() => {
    pendingLogout?.()
    setShowModal(false)
  }, [pendingLogout])

  // Track session count
  useEffect(() => {
    const count = parseInt(localStorage.getItem('session_count') ?? '0')
    localStorage.setItem('session_count', String(count + 1))
  }, [])

  return { showModal, interceptLogout, handleFeedbackSubmit, handleSkip }
}

// ══════════════════════════════════════════════════════════════
// useOnboardingTracking — track step completions
// ══════════════════════════════════════════════════════════════
export function useOnboardingTracking() {
  const trackStep = useCallback(async (step: string) => {
    try {
      await fetch('/api/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ step }),
      })
    } catch {}
  }, [])

  return { trackStep }
}

// ══════════════════════════════════════════════════════════════
// Hotjar initialization (call from root layout client component)
// ══════════════════════════════════════════════════════════════
export function initHotjar(hjid: number, hjsv: number = 6) {
  if (typeof window === 'undefined') return
  if ((window as any).hj) return  // already loaded

  const script = document.createElement('script')
  script.innerHTML = `
    (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:${hjid},hjsv:${hjsv}};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `
  document.head.appendChild(script)
}

export function useHotjar() {
  useEffect(() => {
    const hjid = parseInt(process.env.NEXT_PUBLIC_HOTJAR_ID ?? '0')
    if (hjid) initHotjar(hjid)
  }, [])
}