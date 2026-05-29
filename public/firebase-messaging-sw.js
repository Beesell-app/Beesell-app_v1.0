// apps/web-app/public/firebase-messaging-sw.js
// ── Firebase Cloud Messaging Service Worker ───────────────────
// Must be at root /public — served at /firebase-messaging-sw.js
// NO import() or require() — service worker has limited APIs

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Config injected at build time via __NEXT_PUBLIC_FIREBASE_*
// Using self.__FIREBASE_CONFIG pattern to avoid hardcoding
const firebaseConfig = {
  apiKey:            self.__FIREBASE_API_KEY            || '',
  authDomain:        self.__FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.__FIREBASE_PROJECT_ID         || '',
  storageBucket:     self.__FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             self.__FIREBASE_APP_ID             || '',
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

// ── Background message handler ────────────────────────────────
// Called when app is in background or closed
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload)

  const { title, body, icon, image, data } = payload.notification ?? {}
  const notifData = payload.data ?? {}

  // Build notification options
  const options = {
    body:    body  ?? notifData.body  ?? 'BeeSell AI notification',
    icon:    icon  ?? '/icon-192.png',
    image:   image ?? notifData.media_url,
    badge:   '/badge-72.png',
    tag:     notifData.tag     ?? 'beesell-notification',
    renotify: true,
    data: {
      url:      notifData.url ?? '/',
      postId:   notifData.postId,
      platform: notifData.platform,
      type:     notifData.type,
    },
    actions: buildActions(notifData.type),
    vibrate: [200, 100, 200],
    requireInteraction: notifData.type === 'publish_failed',
  }

  self.registration.showNotification(
    title ?? notifData.title ?? 'BeeSell AI',
    options,
  )
})

// ── Notification click handler ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data ?? {}
  let targetUrl = data.url ?? '/'

  // Handle action buttons
  if (event.action === 'view_post') {
    targetUrl = data.permalink ?? data.url ?? '/scheduler'
  } else if (event.action === 'retry') {
    targetUrl = `/scheduler?retry=${data.postId}`
  } else if (event.action === 'view_library') {
    targetUrl = '/library'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})

// ── Push subscription change ──────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed')
  // Re-subscribe handled by client
})

// ── Build action buttons per notification type ───────────────
function buildActions(type) {
  switch (type) {
    case 'publish_success':
      return [
        { action: 'view_post',    title: '🔗 Lihat Post' },
        { action: 'view_library', title: '📚 Library' },
      ]
    case 'publish_failed':
      return [
        { action: 'retry',        title: '🔄 Coba Lagi' },
        { action: 'view_library', title: '📚 Library' },
      ]
    default:
      return []
  }
}