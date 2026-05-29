'use client'
// apps/web-app/lib/notifications/firebase-client.ts
// ── Firebase FCM client-side ──────────────────────────────────
// Handles: init, permission request, token fetch, subscription save
import { useEffect, useState, useCallback } from 'react'

// Lazy-load Firebase to avoid SSR issues
let messagingPromise: Promise<any> | null = null

async function getMessaging() {
  if (messagingPromise) return messagingPromise

  messagingPromise = (async () => {
    const { initializeApp, getApps }  = await import('firebase/app')
    const { getMessaging: getFCM, getToken, onMessage } = await import('firebase/messaging')

    const firebaseConfig = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    const app      = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    const messaging = getFCM(app)

    return { messaging, getToken, onMessage }
  })()

  return messagingPromise
}

// ── Request permission + get FCM token ────────────────────────
export async function requestPushPermission(): Promise<{
  granted: boolean
  token:   string | null
  error?:  string
}> {
  // Check browser support
  if (!('Notification' in window)) {
    return { granted: false, token: null, error: 'Browser tidak support notifikasi' }
  }
  if (!('serviceWorker' in navigator)) {
    return { granted: false, token: null, error: 'Service Worker tidak tersedia' }
  }

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { granted: false, token: null, error: 'Izin notifikasi ditolak' }
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' },
    )

    // Inject Firebase config into service worker
    if (registration.active) {
      registration.active.postMessage({
        type:   'FIREBASE_CONFIG',
        config: {
          __FIREBASE_API_KEY:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          __FIREBASE_AUTH_DOMAIN:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          __FIREBASE_PROJECT_ID:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          __FIREBASE_STORAGE_BUCKET:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          __FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          __FIREBASE_APP_ID:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        },
      })
    }

    // Get FCM token
    const { messaging, getToken } = await getMessaging()
    const token = await getToken(messaging, {
      vapidKey:            process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (!token) {
      return { granted: true, token: null, error: 'Gagal mendapat push token' }
    }

    return { granted: true, token }

  } catch (err: any) {
    console.error('[FCM] Token error:', err)
    return { granted: true, token: null, error: err.message }
  }
}

// ── Foreground message handler ────────────────────────────────
export async function listenForegroundMessages(
  onMessage: (payload: any) => void,
): Promise<() => void> {
  const { messaging, onMessage: fcmOnMessage } = await getMessaging()
  const unsubscribe = fcmOnMessage(messaging, onMessage)
  return unsubscribe
}

// ── useWebPush hook ───────────────────────────────────────────
export type PushState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

export function useWebPush() {
  const [state,   setState]   = useState<PushState>('idle')
  const [token,   setToken]   = useState<string | null>(null)
  const [message, setMessage] = useState<any | null>(null)

  // Check existing permission on mount
  useEffect(() => {
    if (!('Notification' in window)) { setState('unsupported'); return }

    if (Notification.permission === 'granted') {
      setState('granted')
      // Try to get existing token silently
      requestPushPermission()
        .then(r => { if (r.token) setToken(r.token) })
        .catch(() => {})
    } else if (Notification.permission === 'denied') {
      setState('denied')
    }
  }, [])

  // Listen foreground messages
  useEffect(() => {
    if (state !== 'granted') return
    let unsub: (() => void) | null = null

    listenForegroundMessages((payload) => {
      setMessage(payload)
      // Auto-clear after 8 seconds
      setTimeout(() => setMessage(null), 8_000)
    }).then(fn => { unsub = fn })

    return () => { unsub?.() }
  }, [state])

  // Save token to backend
  const saveToken = useCallback(async (fcmToken: string) => {
    try {
      await fetch('/api/notifications/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          token:    fcmToken,
          platform: 'web',
          ua:       navigator.userAgent.slice(0, 200),
        }),
      })
    } catch (err) {
      console.error('[FCM] Failed to save token:', err)
    }
  }, [])

  // Request push permission
  const requestPermission = useCallback(async () => {
    setState('requesting')
    const result = await requestPushPermission()

    if (result.granted && result.token) {
      setState('granted')
      setToken(result.token)
      await saveToken(result.token)
    } else if (!result.granted) {
      setState('denied')
    } else {
      setState('granted')
    }

    return result
  }, [saveToken])

  return { state, token, message, requestPermission, clearMessage: () => setMessage(null) }
}