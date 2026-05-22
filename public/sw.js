/**
 * Simple Service Worker for De Aquí y De Allá
 * Satisfies PWA installability requirements.
 */

const CACHE_NAME = 'deaquiydealla-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/images/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Opcional: retornar una página offline si falla la red
      });
    })
  );
});

// Evento push para recibir notificaciones en segundo plano
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/images/logo.png',
      badge: data.badge || '/images/logo.png',
      vibrate: data.vibrate || [200, 100, 200, 100, 400],
      tag: data.tag || 'nuevo-pedido',
      renotify: true,
      data: data.data || { url: '/admin' }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '¡Nuevo Pedido!', options)
    );
  } catch (err) {
    console.error('Error al procesar push event:', err);
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('🥡 ¡Nuevo Pedido Recibido! 🥡', {
        body: text,
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        vibrate: [200, 100, 200, 100, 400],
        data: { url: '/admin' }
      })
    );
  }
});

// Evento al hacer clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || '/admin', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Si la app ya está abierta, hacer focus
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no está abierta, abrir nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

