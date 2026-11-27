// Service worker de Camino Ruta (v2): guarda la carcasa de la app (y el SDK de Firebase y las fuentes) para abrirla sin conexion.
// Los datos los maneja Firestore con su propia cache local. Cache propia: no se mezcla con la de Camino.
// v2: la red tiene 4 s para responder; si no, se usa lo guardado (mala cobertura = igual abre rapido). Solo se guardan respuestas correctas.
const CACHE = 'ruta-shell-v2', FONTS = 'ruta-fonts-v1', WAIT = 4000;
const SHELL = ['./', 'index.html', 'app.js', 'data.js', 'ruta.css', 'manifest.webmanifest', '../styles.css', '../firebase-config.js', '../icon-180.png', '../icon-192.png', '../icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => { /* un archivo ausente no bloquea la instalacion */ })))).then(() => self.skipWaiting())); });
// Solo borra versiones antiguas de ESTA app; nunca las cachés de Camino u otras apps del mismo sitio.
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('ruta-shell-') === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
const good = (res) => res && (res.ok || res.type === 'opaque');
const keep = (name, r, res) => { if (good(res)) { const cp = res.clone(); caches.open(name).then((c) => c.put(r, cp)).catch(() => {}); } return res; };
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  // SDK de Firebase (version fija en la URL): primero cache, asi la app abre sin senal.
  if (u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(r).then((m) => m || fetch(r).then((res) => keep(CACHE, r, res)))));
    return;
  }
  // Fuentes de Google: lo guardado primero y se renueva en segundo plano.
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then((c) => c.match(r).then((m) => { const net = fetch(r).then((res) => keep(FONTS, r, res)).catch(() => m); return m || net; })));
    return;
  }
  if (u.origin !== location.origin) return;
  // Archivos de la app: red con tiempo limite; si tarda o falla, lo guardado. La red sigue en segundo plano y renueva la copia.
  const net = fetch(r).then((res) => keep(CACHE, r, res));
  e.waitUntil(net.catch(() => {}));
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((hit) => {
    if (!hit) return net.catch(() => caches.match('index.html'));
    return Promise.race([net.then((res) => (good(res) ? res : hit), () => hit), new Promise((ok) => setTimeout(() => ok(hit), WAIT))]);
  }));
});
