/**
 * Simple Service Worker for De Aquí y De Allá
 * Satisfies PWA installability requirements.
 */

const CACHE_NAME = 'deaquiydealla-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/images/logo.png',
  '/notification.mp3',
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

  const url = new URL(event.request.url);

  // Omitir por completo peticiones a la API, Supabase o telemetría para evitar respuestas cacheadas
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('vercel')
  ) {
    return;
  }

  // ESTRATEGIA: Network-First para páginas HTML y navegaciones (siempre ver en vivo, con fallback offline)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // ESTRATEGIA: Cache-First con Network Fallback para otros recursos estáticos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano revalidamos los recursos dinámicos de Next.js (JS, CSS) para futuras visitas
        if (url.pathname.includes('_next/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {/* Silenciar errores de red en revalidación background */});
        }
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
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
      // Vibración masiva: 5 ráfagas de 1 segundo para llamar la atención en la cocina
      vibrate: [1000, 250, 1000, 250, 1000, 250, 1000, 250, 1000],
      tag: data.tag || 'nuevo-pedido',
      renotify: true,
      silent: false,
      requireInteraction: true,
      sound: '/notification.mp3',
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
        vibrate: [1000, 250, 1000, 250, 1000, 250, 1000, 250, 1000],
        silent: false,
        requireInteraction: true,
        sound: '/notification.mp3',
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

