/* Service Worker: guarda solo los archivos de la aplicación. */
const VERSION = '7938f4c01c3e';
const CACHE = 'lw-' + VERSION;
const ASSETS = ["./", "app.js", "apple-touch-icon.png", "content.js", "favicon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "index.html", "logo.png", "manifest.json", "mark.png", "qr.png", "styles.css"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' })))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('languway-spanish-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // enlaces externos: sin caché
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
