// Service worker mínimo: guarda la "carcasa" de la app para abrirla sin conexión.
// Los datos los maneja Firestore con su propia caché local.
const CACHE = 'camino-shell-v3';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'backend-firebase.js', 'firebase-config.js', 'manifest.webmanifest', './icon-192.png', './icon-512.png', './logo-negro.svg', './logo-blanco.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
