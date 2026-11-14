// Service Worker voor Doomscroll Escape PWA (v27 - Visuele Captchas, 32 Themataken, Geen Foutmeldingen)
const CACHE_NAME = 'doomscroll-escape-v33';

// Essentiële core bestanden voor offline werking en data-besparing
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/digibord.html',
  '/manifest.json',
  '/css/app.css',
  '/js/itemsData.js?v=30',
  '/js/podium.js?v=33',
  '/js/playerApp.js?v=33',
  '/js/soundEffects.js?v=30',
  '/js/notifications.js?v=30',
  '/assets/sounds/whatsapp.wav',
  '/assets/sounds/snapchat.wav',
  '/assets/sounds/instagram.wav',
  '/assets/sounds/bereal.wav',
  '/assets/sounds/tiktok.wav',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('Pre-cache fout (niet blokkerend):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Verwijder oude service worker cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Socket.IO & API calls: Nooit cachen (realtime multiplayer)
  if (url.pathname.includes('/socket.io/') || url.pathname.includes('/api/')) {
    return;
  }

  // 2. Afbeeldingen & Media (Unsplash, Picsum, Pravatar, lokale graphics):
  // CACHE-FIRST: Voorkomt herhaaldelijk downloaden over 4G/5G tijdens scrollen
  const isImage = request.destination === 'image' ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('picsum.photos') ||
    url.hostname.includes('pravatar.cc') ||
    /\.(png|jpg|jpeg|webp|gif|svg|ico)$/i.test(url.pathname);

  if (isImage && request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 3. Scripts, Stijlen en Fonts: Network-First zodat updates direct doorkomen
  const isStaticAsset = request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js');

  if (isStaticAsset && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 4. Navigatie (HTML): Network-First met fallback naar cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // 5. Overige GET-requests: Standaard netwerk met fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
