// Service worker de Camino Ruta: guarda la carcasa de la app (y el SDK de Firebase) para abrirla sin conexion.
// Los datos los maneja Firestore con su propia cache local. Cache propia: no se mezcla con la de Camino.
const CACHE = 'ruta-shell-v1';
const SHELL = ['./', 'index.html', 'app.js', 'data.js', 'ruta.css', 'manifest.webmanifest', '../styles.css', '../firebase-config.js', '../icon-180.png', '../icon-192.png', '../icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => { /* un archivo ausente no bloquea la instalacion */ })))).then(() => self.skipWaiting())); });
// Solo borra versiones antiguas de ESTA app; nunca las cachés de Camino u otras apps del mismo sitio.
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('ruta-shell-') === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  // SDK de Firebase (version fija en la URL): primero cache, asi la app abre sin senal.
  if (u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(r).then((m) => m || fetch(r).then((res) => { if (res && res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); return res; }).catch(() => caches.match(r).then((m) => m || caches.match('index.html'))));
});
