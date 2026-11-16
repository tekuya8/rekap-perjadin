/* Rekap Perjadin — service worker (cache aplikasi agar cepat & bisa dibuka offline) */
const VERSI = 'perjadin-v2';
const ASET = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(ASET)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSI).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // API (POST) selalu langsung ke internet
  const url = new URL(req.url);
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  if (url.origin === location.origin) {
    // File aplikasi: ambil versi terbaru, kalau offline pakai cache
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSI).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else {
    // Font & Chart.js dari CDN: cache dulu
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSI).then(c => c.put(req, copy));
      return res;
    })));
  }
});
