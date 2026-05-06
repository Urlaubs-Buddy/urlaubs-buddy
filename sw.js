// Urlaubs-Buddy Service Worker
const CACHE = 'urlaubs-buddy-v1';
const FILES = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Network first for APIs, cache first for app files
  var url = e.request.url;
  if (url.includes('overpass') || url.includes('nominatim') || url.includes('openstreetmap.org/export')) {
    // Always try network for map/search APIs
    e.respondWith(fetch(e.request).catch(function() {
      return new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}});
    }));
  } else {
    // Cache first for app files
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
          return response;
        });
      })
    );
  }
});
