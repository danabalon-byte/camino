// Seguimiento en ruta (Camino Ruta v3). Página pública, sin cuenta y sin SDK de Firebase: lee UN documento
// (tracks/{token}) por la API REST de Firestore. La regla solo permite "get" si el token existe y no venció.
// Todo el contenido se pinta con textContent (nada de innerHTML): los datos vienen de un documento de terceros.
import { firebaseConfig as C } from '../firebase-config.js';

const app = document.getElementById('app');
const tk = (location.hash.match(/[#&]t=([A-Za-z0-9_-]{22,40})/) || [])[1];
const POLL = 30000;
let last = null, lastOkAt = 0, offline = false, gone = false, timer = null;

const h = (tag, cls, txt, kids) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; (kids || []).forEach((k) => k && e.appendChild(k)); return e; };
const pad = (n) => (n < 10 ? '0' + n : '' + n);
let TZ;
const fmt = (ms, withDay) => {
  try { return new Intl.DateTimeFormat('es-CL', { timeZone: TZ || undefined, weekday: withDay === false ? undefined : 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(ms).replace('.', ''); }
  catch (e) { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
};
const dur = (min) => { min = Math.max(0, Math.round(min)); return min < 60 ? min + ' min' : Math.floor(min / 60) + ' h ' + pad(min % 60) + ' min'; };
const ago = (ms) => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? 'hace instantes' : 'hace ' + dur(m); };
const km1 = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');

function num(f) { if (!f) return null; if (f.integerValue != null) return Number(f.integerValue); if (f.doubleValue != null) return Number(f.doubleValue); return null; }
async function fetchDoc() {
  const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(C.projectId) + '/databases/(default)/documents/tracks/' + tk + '?key=' + encodeURIComponent(C.apiKey);
  let r;
  try { r = await fetch(url, { cache: 'no-store', referrerPolicy: 'no-referrer' }); } catch (e) { offline = true; return; }
  if (r.status === 403 || r.status === 404) { gone = true; last = null; return; }
  if (!r.ok) { offline = true; return; }
  const doc = await r.json(), f = doc.fields || {};
  let j; try { j = JSON.parse((f.j || {}).stringValue || ''); } catch (e) { offline = true; return; }
  if (!j || j.v !== 1) { offline = true; return; }
  offline = false; lastOkAt = Date.now(); last = { j, u: num(f.u) || 0, exp: num(f.exp) || 0 };
}

function phase(j) {
  if (j.mode === 'pre') return { t: 'Aún no sale', c: '' };
  if (j.mode === 'fin') return { t: j.pos >= j.km ? 'Llegó a la meta' : 'Terminó', c: '' };
  if (j.mode === 'stop') return { t: 'Detenido en ' + (j.stopAt || 'un control'), c: '' };
  return { t: 'En ruta', c: '' };
}
function railEl(j) {
  const tot = j.km || 1, pc = (k) => Math.max(0, Math.min(100, (k / tot) * 100)).toFixed(1) + '%';
  const r = h('div', 'rail'); r.setAttribute('role', 'img'); r.setAttribute('aria-label', 'Avance: ' + km1(j.pos) + ' de ' + tot + ' kilómetros');
  const fill = h('div', 'fill'); fill.style.width = pc(j.pos); r.appendChild(fill);
  (j.ctl || []).forEach((c) => { if (c.n === 'Meta') return; const i = h('i', c.k <= j.pos ? 'on' : ''); i.style.left = pc(c.k); r.appendChild(i); });
  const b = h('b'); b.style.left = pc(j.pos); r.appendChild(b); return r;
}

function render() {
  app.replaceChildren();
  if (!tk) { app.appendChild(h('div', 'card', null, [h('h1', '', 'Seguimiento en ruta'), h('p', 'sub', 'Este enlace está incompleto. Pide que te lo reenvíen.')])); return; }
  if (gone) { app.appendChild(h('div', 'card', null, [h('h1', '', 'Seguimiento en ruta'), h('p', 'sub', 'Este enlace no existe, venció o fue desactivado.')])); return; }
  if (!last) { app.appendChild(h('div', 'card', null, [h('h1', '', 'Seguimiento en ruta'), h('p', 'sub', offline ? 'No pude cargar los datos. Reintentando…' : 'Cargando…')])); return; }
  const { j, u } = last; TZ = j.tz || undefined; const ph = phase(j), now = Date.now(), live = j.mode === 'ride' || j.mode === 'stop', age = now - u;
  document.title = (j.who ? j.who + ' · ' : '') + j.ev;

  const head = h('div', 'card', null, [h('h1', '', (j.who ? j.who + ' · ' : '') + j.ev), h('span', 'pill', ph.t)]);
  if (j.st && live) head.appendChild(h('div', 'sub', j.delay != null ? (j.delay >= 3 ? 'Va ' + dur(j.delay) + ' atrasado' : j.delay <= -3 ? 'Va ' + dur(-j.delay) + ' adelantado' : 'Va según el programa') : j.st));
  app.appendChild(head);

  // avisos
  if (live && j.un && now > j.un && age > 10 * 60000) app.appendChild(h('div', 'banner bad', 'Ya pasó la hora acordada (' + fmt(j.un) + ') y no hay noticias desde ' + fmt(u) + '. Intenta llamar.'));
  else if (live && age > 10 * 60000) app.appendChild(h('div', 'banner', 'Sin actualizaciones desde ' + fmt(u) + ' (' + ago(u) + '). Puede estar en un tramo sin señal celular. Última posición conocida: km ' + km1(j.pos) + '.'));
  if (offline) app.appendChild(h('div', 'banner', 'Sin conexión: se muestra lo último recibido (' + ago(lastOkAt) + ').'));
  if (j.msg) app.appendChild(h('div', 'card', j.msg));

  if (j.mode === 'pre') {
    app.appendChild(h('div', 'card', null, [h('div', 'sub', 'Salida programada'), h('div', 'big', fmt(j.start)), h('div', 'sub', j.km + ' km · ' + (j.ctl || []).filter((c) => c.n !== 'Meta').length + ' controles')]));
  } else {
    const pct = Math.round((j.pos / (j.km || 1)) * 100);
    const prog = h('div', 'card', null, [h('div', 'row', null, [h('div', 'big', km1(j.pos) + ' ', [h('small', '', '/ ' + j.km + ' km')]), h('div', 'sub', pct + ' %')]), railEl(j)]);
    if (j.mode === 'fin' && j.end) prog.appendChild(h('div', 'sub', 'Terminó ' + fmt(j.end) + ' · tiempo total ' + dur((j.end - j.start) / 60000)));
    else prog.appendChild(h('div', 'sub', 'Salió ' + fmt(j.start) + ' · último dato ' + fmt(j.at || u) + ' (' + ago(j.at || u) + ')'));
    app.appendChild(prog);
    if (j.next && live) {
      const n = j.next, el = [h('div', 'sub', 'Próximo control'), h('div', 'big', n.n + ' ', [h('small', '', 'km ' + n.k)]), h('div', 'sub', 'Llegada estimada ' + fmt(n.eta) + (n.c ? ' · cierra ' + fmt(n.c) : ''))];
      if (j.brv && j.pm != null) el.push(h('div', 'sub', j.pm >= 0 ? 'Margen proyectado a meta: ' + dur(j.pm) : 'A este ritmo llegaría ' + dur(-j.pm) + ' después del cierre de meta'));
      app.appendChild(h('div', 'card', null, el));
    }
  }

  const rows = (j.ctl || []);
  if (rows.length) {
    const box = h('div', 'card', null, [h('div', 'sub', 'Controles')]);
    rows.forEach((c) => {
      const row = h('div', 'ctl' + (c.a ? ' done' : ''), null, [h('span', 'n', c.n + ' · km ' + c.k), h('span', 't', c.a ? fmt(c.a) : fmt(c.p))]);
      const m = c.a ? 'Llegó' + (c.p ? ' (plan ' + fmt(c.p, false) + ')' : '') : 'Plan' + (c.c ? ' · cierre ' + fmt(c.c, false) : '');
      row.appendChild(h('span', 'm', m)); row.appendChild(h('span', 'm', c.a && c.d ? 'salió ' + fmt(c.d, false) : '')); box.appendChild(row);
    });
    app.appendChild(box);
  }
  const bt = h('button', '', 'Actualizar ahora'); bt.type = 'button'; bt.addEventListener('click', () => refresh());
  app.appendChild(bt);
  app.appendChild(h('p', 'note', 'Se actualiza sola cada 30 segundos. Muestra el km y los controles, no la ubicación exacta. Horas de ' + (TZ || 'la ruta') + '.'));
}

async function refresh() { await fetchDoc(); render(); }
function schedule() { clearInterval(timer); timer = setInterval(() => { if (!document.hidden && !gone) refresh(); else if (!gone) render(); }, POLL); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && !gone) refresh(); });
setInterval(() => { if (!document.hidden && last && !gone) render(); }, 20000);
render(); if (tk) { refresh(); schedule(); }
