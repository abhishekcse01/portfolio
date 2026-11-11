// Offline cache for Mini Arcade. Bump VERSION when files change.
const VERSION = 'arcade-v1';
const FILES = ['index.html', 'games.css', 'common.js', 'icon.svg', 'manifest.webmanifest',
  'memory.html', 'balloon.html', 'tictactoe.html', 'simon.html', 'math.html'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Network first so updates show up; fall back to cache offline.
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(VERSION).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});
