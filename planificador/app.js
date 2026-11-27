/* Camino Ruta · Planificar y modo en vivo como app independiente (v1).
   El bloque de Planificar (calculo de horarios, GPX, nutricion, modo en vivo) se copia tal cual de Camino v79
   (app.js, lineas 2841-3322); alrededor va una capa propia: sesion, datos, cierre del evento y registro en Camino.
   Sin claves: la configuracion web de Firebase se importa de ../firebase-config.js. */
import { be } from './data.js';

const RUTA_VER = 1;
const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const pad = (n) => (n < 10 ? '0' + n : '' + n);
const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
const off = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const firstName = (n) => String(n || '').split(' ')[0] || 'Atleta';
const FC_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const shortDate = (ds) => { const d = parse(ds); return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); };
const PH = {
  'arrow-right': ['<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>', '<path d="M221.66,133.66l-72,72A8,8,0,0,1,136,200V136H40a8,8,0,0,1,0-16h96V56a8,8,0,0,1,13.66-5.66l72,72A8,8,0,0,1,221.66,133.66Z"/>'],
  'caret-right': ['<path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>', '<path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>'],
  'check': ['<path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>', '<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/>'],
  'flag': ['<path d="M48,216V48 M48,48H208l-28,44,28,44H48" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>', '<path d="M40,40a8,8,0,0,1,8,8v8H208a8,8,0,0,1,6.9,12.1L187.9,92l27,39.9A8,8,0,0,1,208,144H56v72a8,8,0,0,1-16,0V48A8,8,0,0,1,40,40Z"/>'],
  'info': ['<path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"/>', '<path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z"/>']
};
const ph = (n, size, color, on) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 256 256" fill="' + (color || 'currentColor') + '" aria-hidden="true" focusable="false">' + (PH[n][on ? 1 : 0] || PH[n][0]) + '</svg>';
const infoIcon = () => ph('info', 22, 'var(--info)').replace('<svg ', '<svg style="flex:none;margin-top:1px" ');
const head = (sub, title) => '<div class="col g4"><div class="muted" style="font-size:14px">' + esc(sub) + '</div><h1 class="title">' + esc(title) + '</h1></div>';
const msgBanner = () => (UI.msg ? '<div class="banner toast" role="status" aria-live="polite">' + infoIcon() + '<span>' + esc(UI.msg) + '</span></div>' : '');
let PREF = { tone: 'auto' };
try { const r = localStorage.getItem('camino-prefs-v1'); if (r) PREF = Object.assign(PREF, JSON.parse(r)); } catch (e) { /* sin preferencias */ }
(function applyPrefs() { const r = document.documentElement; if (PREF.calm) r.setAttribute('data-calm', ''); if (PREF.tone && PREF.tone !== 'auto') r.setAttribute('data-tone', PREF.tone); })();

const ST = { user: null, profile: null, myEvents: [], bio: null, authDone: false, profLoaded: false, evLoaded: false };
const UI = { pl: null, liveOpen: false, busy: false, msg: '', msgKind: '' };
const ACT = {};
let msgTimer = null;
function say(msg, kind) { UI.msg = msg; UI.msgKind = kind || 'err'; clearTimeout(msgTimer); if (msg) msgTimer = setTimeout(() => { UI.msg = ''; render(); }, (kind || 'err') === 'ok' ? 6000 : 10000); render(); }
const friendly = (e) => {
  const c = e && e.code ? String(e.code) : '';
  if (c.indexOf('permission-denied') >= 0) return 'No tienes permiso para esa acción. Si crees que es un error, avísale a tu coach.';
  if (c.indexOf('unavailable') >= 0 || c.indexOf('network') >= 0) return 'Sin conexión por ahora. Reintenta cuando vuelva la señal.';
  if (c.indexOf('unauthorized-domain') >= 0) return 'Este sitio aún no está autorizado para iniciar sesión. Avísale a tu coach.';
  return 'Algo no salió bien. Intenta de nuevo.';
};
/* Planificar solo para el coach y para quienes el coach habilita (users/{id}.features.planificar), igual que en Camino. */
const plannerOn = () => !!(ST.profile && (ST.profile.role === 'coach' || (ST.profile.features && ST.profile.features.planificar === true)));
const isOwner = () => false;
const bioMeas = () => (ST.bio && ST.bio.measures) || {};
const bioMain = () => { const b = ST.bio || {}; return Object.assign({}, b.main || {}, b.private && b.private.emergency ? { emergency: b.private.emergency } : {}); };
const ageOf = () => null;
function decodePoly(str) {
  const out = []; let i = 0, la = 0, lo = 0;
  while (i < str.length) {
    let b, sh = 0, r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32 && i <= str.length); la += (r & 1) ? ~(r >> 1) : (r >> 1);
    sh = 0; r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32 && i <= str.length); lo += (r & 1) ? ~(r >> 1) : (r >> 1);
    out.push([la / 1e5, lo / 1e5]);
  }
  return out;
}
function routeSvg(r) {
  const P = decodePoly(String(r.p || '')); if (P.length < 2) return '';
  const W = 342, H = 300, la = P.map((q) => q[0]), lo = P.map((q) => q[1]), y0 = Math.min.apply(null, la), y1 = Math.max.apply(null, la), x0 = Math.min.apply(null, lo), x1 = Math.max.apply(null, lo), k = Math.cos((y0 + y1) / 2 * Math.PI / 180);
  const sc = Math.min((W - 40) / Math.max((x1 - x0) * k, 1e-6), (H - 40) / Math.max(y1 - y0, 1e-6)), ox = (W - (x1 - x0) * k * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
  const xy = P.map((q) => [ox + (q[1] - x0) * k * sc, oy + (y1 - q[0]) * sc]);
  let far = 0, fd = -1; xy.forEach((q, j) => { const d = Math.hypot(q[0] - xy[0][0], q[1] - xy[0][1]); if (d > fd) { fd = d; far = j; } });
  const path = 'M' + xy.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Trazo del recorrido de la salida" style="display:block;border-radius:16px;background:var(--track);max-height:340px"><path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<circle cx="' + xy[0][0].toFixed(1) + '" cy="' + xy[0][1].toFixed(1) + '" r="6" fill="var(--good)" stroke="var(--surface)" stroke-width="2"/>'
    + (fd > 14 ? '<circle cx="' + xy[far][0].toFixed(1) + '" cy="' + xy[far][1].toFixed(1) + '" r="6" fill="var(--text)" stroke="var(--surface)" stroke-width="2"/><text x="' + (xy[far][0] > W / 2 ? (xy[far][0] - 11).toFixed(1) : (xy[far][0] + 11).toFixed(1)) + '" y="' + (xy[far][1] + 4).toFixed(1) + '" font-size="12" font-weight="700" fill="var(--text)" text-anchor="' + (xy[far][0] > W / 2 ? 'end' : 'start') + '">Más lejano</text>' : '') + '</svg>';
}
function elevSvg(r) {
  const A = Array.isArray(r.a) ? r.a.filter((v) => typeof v === 'number') : []; if (A.length < 3) return '';
  const mn = Math.min.apply(null, A), mx = Math.max.apply(null, A), sp = Math.max(mx - mn, 1), n = A.length;
  const pts = A.map((v, i) => (i / (n - 1) * 342).toFixed(1) + ' ' + (80 - (v - mn) / sp * 70).toFixed(1));
  return '<svg viewBox="0 0 342 90" width="100%" role="img" aria-label="Perfil de altitud de ' + Math.round(mn) + ' a ' + Math.round(mx) + ' metros" style="display:block"><path d="M' + pts.join(' L') + ' L342 90 L0 90Z" fill="var(--accent)" fill-opacity=".18" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/></svg>';
}
function plCtlLocked() { const P = UI.pl; return !!(LV && P && P.id && LV.ev && LV.ev.id === P.id); }
/* ---------- Planificar: eventos, track GPX y controles (v55) ---------- */
const PL_BRV = [200, 300, 400, 600, 1000];
const PL_BANDS = [[0, 200, 34, 15], [200, 400, 32, 15], [400, 600, 30, 15], [600, 1000, 28, 11.428], [1000, 1300, 26, 13.333]];
const PL_FIN = { 200: 13.5, 300: 20, 400: 27, 600: 40, 1000: 75 };
const plHav = (a, b) => { const r = Math.PI / 180, dl = (b[0] - a[0]) * r, dn = (b[1] - a[1]) * r, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dn / 2) * Math.sin(dn / 2); return 12742.0176 * Math.asin(Math.sqrt(x)); };
function plEncPoly(P) { let o = '', pa = 0, po = 0; const e = (v) => { v = v < 0 ? ~(v << 1) : v << 1; let s = ''; while (v >= 32) { s += String.fromCharCode((32 | (v & 31)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); }; P.forEach((q) => { const la = Math.round(q[0] * 1e5), lo = Math.round(q[1] * 1e5); o += e(la - pa) + e(lo - po); pa = la; po = lo; }); return o; }
/* Simplifica con Ramer-Douglas-Peucker (iterativo) sobre metros planos. */
function plRdp(X, Y, eps) {
  const n = X.length, keep = new Uint8Array(n); keep[0] = 1; keep[n - 1] = 1; const st = [[0, n - 1]];
  while (st.length) {
    const s = st.pop(), a = s[0], b = s[1]; if (b <= a + 1) continue;
    const dx = X[b] - X[a], dy = Y[b] - Y[a], L = Math.hypot(dx, dy); let mx = -1, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = L < 1e-9 ? Math.hypot(X[i] - X[a], Y[i] - Y[a]) : Math.abs(dy * (X[i] - X[a]) - dx * (Y[i] - Y[a])) / L; if (d > mx) { mx = d; mi = i; } }
    if (mx > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  const out = []; for (let i = 0; i < n; i++) if (keep[i]) out.push(i); return out;
}
/* Lee un GPX (track o ruta) y devuelve el trazo simplificado con la forma de los recorridos de Camino. */
function plParseGpx(text) {
  let doc; try { doc = new DOMParser().parseFromString(text, 'application/xml'); } catch (e) { return { err: 'No pude leer el archivo.' }; }
  if (!doc || doc.getElementsByTagName('parsererror').length) return { err: 'El archivo no es un GPX válido.' };
  let nodes = doc.getElementsByTagName('trkpt'); if (!nodes.length) nodes = doc.getElementsByTagName('rtept');
  if (nodes.length < 10) return { err: 'El GPX no trae un recorrido con puntos suficientes.' };
  if (nodes.length > 250000) return { err: 'El GPX es demasiado grande. Prueba con uno más corto.' };
  const P = []; for (let i = 0; i < nodes.length; i++) { const la = parseFloat(nodes[i].getAttribute('lat')), lo = parseFloat(nodes[i].getAttribute('lon')); if (!isFinite(la) || !isFinite(lo)) continue; const el = nodes[i].getElementsByTagName('ele')[0], ev = el ? parseFloat(el.textContent) : NaN; P.push([la, lo, isFinite(ev) ? ev : null]); }
  if (P.length < 10) return { err: 'El GPX no trae un recorrido con puntos suficientes.' };
  const nm = doc.getElementsByTagName('name')[0];
  const T = [P[0]], cum = [0]; let tot = 0, last = P[0];
  for (let i = 1; i < P.length; i++) { const d = plHav(last, P[i]); if (d >= 0.003 || i === P.length - 1) { tot += d; T.push(P[i]); cum.push(tot); last = P[i]; } }
  const allEle = T.every((q) => q[2] != null);
  let gain = 0, ref = allEle ? T[0][2] : 0; if (allEle) T.forEach((q) => { const v = q[2]; if (v - ref >= 3) { gain += v - ref; ref = v; } else if (ref - v >= 3) ref = v; });
  const la0 = T[0][0], kx = Math.cos(la0 * Math.PI / 180) * 111320, X = T.map((q) => q[1] * kx), Y = T.map((q) => q[0] * 110540);
  let eps = 8, idx = plRdp(X, Y, eps); while (idx.length > 400 && eps < 400) { eps *= 1.5; idx = plRdp(X, Y, eps); }
  const S = idx.map((i) => T[i]);
  const tr = { p: plEncPoly(S), km: Math.round(tot * 10) / 10, n: S.length };
  if (allEle) { const A = S.map((q) => Math.round(q[2])); tr.a = A; tr.max = Math.max.apply(null, A); tr.min = Math.min.apply(null, A); tr.gain = Math.round(gain); }
  return { track: tr, name: nm && nm.textContent ? nm.textContent.trim().slice(0, 80) : '' };
}
/* Ventanas ACP de cada control (minutos desde la salida). */
function plWindow(km, nominal) {
  let o = 0, c = 0; PL_BANDS.forEach((b) => { const seg = Math.max(0, Math.min(km, b[1]) - b[0]); o += seg / b[2]; c += seg / b[3]; });
  let open = Math.round(o * 60), close = Math.round(c * 60);
  if (km <= 60) close = Math.round((km / 20 + 1) * 60);
  if (km >= nominal && PL_FIN[nominal]) close = Math.round(PL_FIN[nominal] * 60);
  if (km === 0) close = 60;
  return { open, close };
}
const plMin = (x) => Math.round(x);
function plClock(startHm, plus) { const p = String(startHm || '06:00').split(':'), t = (+p[0] || 0) * 60 + (+p[1] || 0) + plus, d = Math.floor(t / 1440), m = ((t % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60) + (d > 0 ? ' (+' + d + ' d)' : ''); }
const plDur = (m) => { m = Math.round(m); return Math.floor(m / 60) + ':' + pad(m % 60) + ' h'; };
function plCalc(d) {
  const brv = d.kind === 'brevet', total = Number(d.km) || 0, v = Number(d.speed) || 0, def = Number(d.stop);
  if (!(total > 0) || !(v > 0)) return null;
  const cs = (d.ctl || []).map((c) => ({ n: c.name || '', km: Number(c.km), stop: c.stop === '' || c.stop == null ? (isFinite(def) ? def : 10) : Number(c.stop) })).filter((c) => c.km > 0 && c.km < total).sort((a, b) => a.km - b.km);
  cs.push({ n: 'Meta', km: total, stop: 0, meta: true });
  let t = 0, prev = 0, rows = [], ok = true;
  cs.forEach((c) => {
    const arr = t + (c.km - prev) / v * 60; let rec = arr, wait = 0, w = null, margin = null, flag = '';
    if (brv) { w = plWindow(c.km, total); if (arr < w.open) { wait = w.open - arr; rec = w.open; flag = 'wait'; } margin = w.close - rec; if (margin < 0) { flag = 'late'; ok = false; } }
    rows.push({ n: c.n, km: c.km, meta: !!c.meta, arr: Math.round(arr), rec: Math.round(rec), wait: Math.round(wait), w, margin: margin == null ? null : Math.round(margin), stop: c.stop, flag });
    t = rec + c.stop; prev = c.km;
  });
  const last = rows[rows.length - 1];
  return { rows, ok, finish: last.rec, moving: Math.round(total / v * 60), stops: cs.reduce((s, c) => s + (c.meta ? 0 : c.stop), 0), waits: rows.reduce((s, r) => s + r.wait, 0) };
}
function plResHtml(d) {
  const r = plCalc(d), brv = d.kind === 'brevet';
  if (!r) return '<p class="soft" style="font-size:14px">Indica la distancia y tu velocidad media para ver los horarios.</p>';
  const rows = r.rows.map((x) => {
    const nm = x.meta ? 'Meta' : (x.n ? esc(x.n) : 'Control'), ln1 = brv ? 'Abre ' + plClock(d.start, x.w.open) + ' · cierra ' + plClock(d.start, x.w.close) : '';
    let ln2 = 'Llegas ' + plClock(d.start, x.rec); if (x.flag === 'wait') ln2 += ' (esperas ' + plDur(x.wait) + ' a que abra)';
    const tag = brv ? (x.flag === 'late' ? '<span class="pill" style="border-color:var(--warn);color:var(--text);font-weight:700">Fuera de tiempo</span>' : '<span class="muted" style="font-size:12px">Margen ' + plDur(x.margin) + '</span>') : '';
    return '<div class="mrow"><div class="col grow g4" style="min-width:0"><span style="font-weight:600;font-size:16px">' + nm + ' · km ' + String(x.km).replace('.', ',') + '</span>' + (ln1 ? '<span class="muted" style="font-size:13px">' + ln1 + '</span>' : '') + '<span class="muted" style="font-size:13px">' + ln2 + '</span></div>' + tag + '</div>';
  }).join('');
  const sum = '<div class="row g12 wrap" style="margin-top:6px"><div class="col g4"><span class="num" style="font-size:22px">' + plDur(r.finish) + '</span><span class="muted" style="font-size:12px">Tiempo total</span></div><div class="col g4"><span class="num" style="font-size:22px">' + plDur(r.moving) + '</span><span class="muted" style="font-size:12px">En movimiento</span></div><div class="col g4"><span class="num" style="font-size:22px">' + plDur(r.stops + r.waits) + '</span><span class="muted" style="font-size:12px">Paradas y esperas</span></div></div>';
  const msg = brv ? (r.ok ? '<p class="soft" style="font-size:13px;margin-top:8px">Con ese ritmo llegas dentro de todas las ventanas. Las ventanas siguen las reglas de Audax (ACP).</p>' : '<p style="font-size:13px;margin-top:8px;font-weight:600">Con ese ritmo llegarías después del cierre de al menos un control. Prueba con más velocidad o paradas más cortas.</p>') : '';
  return rows + sum + msg;
}
/* ---------- Nutrición e hidratación del evento (v60) ---------- */

/* ---------- v61: nutrición cruzada con el perfil del atleta ---------- */
function plProf() {
  const ms = bioMeas(), m = bioMain() || {}, kg = Number(ms.weightKg), ok = isFinite(kg) && kg >= 30 && kg <= 200;
  return { kg: ok ? kg : null, upd: ok ? ms.updatedAt || null : null, level: (m.hist && m.hist.level) || '', years: (m.hist && m.hist.years) || '', age: ageOf(m.birthDate), sex: m.sex || '' };
}
function plSug(h) {
  const P = plProf(); if (!P.kg) return null;
  const cap = P.level === 'Competitivo' ? 90 : P.level === 'Recreativo' ? 70 : 80, capY = P.years === 'Menos de 1 año' ? 60 : cap;
  let g = Math.max(60, Math.min(capY, plR5(P.kg * 1.0)));
  if (h > 0 && h < 2) g = Math.min(g, 60);
  const ml = Math.max(450, Math.min(800, Math.round(P.kg * 8 / 50) * 50)), na = Math.max(300, Math.min(700, Math.round(P.kg * 7 / 50) * 50));
  const load = h >= 6 ? [8, 10, 'carga completa, 3 días antes'] : h >= 3 ? [6, 7, 'carga moderada, 1 a 2 días antes'] : [5, 6, 'sin carga especial'];
  return { g, ml, na, kg: P.kg, load, loadG: [Math.round(P.kg * load[0] / 10) * 10, Math.round(P.kg * load[1] / 10) * 10], caf: [Math.round(P.kg * 1.5 / 5) * 5, Math.round(P.kg * 3 / 5) * 5], capNote: capY < 80 ? (P.years === 'Menos de 1 año' ? 'tope de 60 g/h por tu poca experiencia' : 'tope de ' + capY + ' g/h por tu nivel') : '', P };
}
function plMovH(d) { const k = Number(d.km), v = Number(d.speed); return k > 0 && v > 0 ? k / v : 0; }
function plProfBox(d) {
  const h = plMovH(d), S = plSug(h), n = plNutFix(d.nut);
  if (!S) return '<div class="info" role="note">' + infoIcon() + '<span>Con tu peso en el perfil, Camino ajusta estos números a ti. Agrégalo en Perfil, medidas, y tu coach lo aprueba.</span></div>';
  const same = n.gph === S.g && n.mlph === S.ml && n.naph === S.na;
  return '<div class="card col g8" style="background:var(--surface2)" aria-label="Sugerido según tu perfil"><div class="eyebrow">Sugerido para ti</div><p class="soft" style="font-size:14px">Con tu peso de ' + String(S.kg).replace('.', ',') + ' kg' + (S.P.level ? ' y nivel ' + esc(S.P.level.toLowerCase()) : '') + (h ? ' y ' + plDur(h * 60) + ' en movimiento' : '') + ': <b>' + S.g + ' g/h</b> de carbohidratos, <b>' + S.ml + ' ml/h</b> de líquido y <b>' + S.na + ' mg/h</b> de sodio.' + (S.capNote ? ' (' + S.capNote + ')' : '') + '</p>'
    + '<p class="muted" style="font-size:13px">Antes: ' + S.load[2] + ', ' + S.load[0] + ' a ' + S.load[1] + ' g/kg al día (' + S.loadG[0] + ' a ' + S.loadG[1] + ' g). Cafeína opcional: ' + S.caf[0] + ' a ' + S.caf[1] + ' mg (1,5 a 3 mg/kg), probada antes en entrenamiento.</p>'
    + '<button type="button" class="btn" data-a="plNutProf" ' + (same ? 'disabled' : '') + ' style="min-height:48px">' + (same ? 'Ya usas estos valores' : 'Usar estos valores') + '</button>'
    + '<p class="muted" style="font-size:12px">Punto de partida de coaching, no consejo médico. Ajusta según tu tolerancia, el calor y tu tasa de sudor.</p></div>';
}
const PL_NUT0 = () => ({ mode: 'hora', gph: 70, mlph: 600, naph: 500, seg: {}, prods: { drink: { on: true, g: 40, ml: 750 }, gel: { on: true, g: 25 }, bar: { on: true, g: 30 } } });
const plNum = (v, def, mn, mx) => { const x = Number(v); return v !== '' && v != null && isFinite(x) ? Math.max(mn, Math.min(mx, x)) : def; };
function plNutFix(n) {
  const b = PL_NUT0(); n = n || {}; const p = n.prods || {};
  return { mode: ['hora', 'tramo', 'producto'].indexOf(n.mode) >= 0 ? n.mode : 'hora', gph: plNum(n.gph, b.gph, 0, 200), mlph: plNum(n.mlph, b.mlph, 0, 2000), naph: plNum(n.naph, b.naph, 0, 2000), seg: n.seg && typeof n.seg === 'object' ? n.seg : {},
    prods: { drink: { on: !p.drink || p.drink.on !== false, g: plNum(p.drink && p.drink.g, 40, 1, 200), ml: plNum(p.drink && p.drink.ml, 750, 100, 2000) }, gel: { on: !p.gel || p.gel.on !== false, g: plNum(p.gel && p.gel.g, 25, 1, 100) }, bar: { on: !p.bar || p.bar.on !== false, g: plNum(p.bar && p.bar.g, 30, 1, 100) } } };
}
const plR5 = (x) => Math.round(x / 5) * 5;
const plL = (ml) => (Math.round(ml / 100) / 10).toFixed(1).replace('.', ',') + ' L';
function plTramos(d) {
  const c = plCalc(d); if (!c) return []; let prev = 0, pn = 'Salida', k = 0;
  return c.rows.map((r) => { const nm = r.meta ? 'Meta' : (r.n || 'Control ' + (++k)), t = { name: pn + ' → ' + nm, to: r.km, km: r.km - prev, h: (r.km - prev) / Number(d.speed) }; prev = r.km; pn = nm; return t; });
}
function plNutCalc(d) {
  const n = plNutFix(d.nut), T = plTramos(d); if (!T.length) return null; const P = n.prods; let sh = { drink: 0, gel: 0, bar: 0 };
  const rows = T.map((t) => {
    const ml = Math.round(n.mlph * t.h), na = Math.round(n.naph * t.h); let g, cnt = null;
    if (n.mode === 'hora') g = Math.round(n.gph * t.h);
    else if (n.mode === 'tramo') g = n.seg[String(t.to)] != null ? Number(n.seg[String(t.to)]) : plR5(n.gph * t.h);
    else {
      const Tg = n.gph * t.h; let bid = P.drink.on ? Math.round(ml / P.drink.ml) : 0; if (bid * P.drink.g > Tg * 1.15) bid = Math.floor(Tg / P.drink.g);
      const R = Math.max(0, Tg - bid * (P.drink.on ? P.drink.g : 0)), bars = P.bar.on ? Math.round(R * (P.gel.on ? 0.35 : 1) / P.bar.g) : 0, gels = P.gel.on ? Math.max(0, Math.round((R - bars * P.bar.g) / P.gel.g)) : 0;
      g = bid * (P.drink.on ? P.drink.g : 0) + bars * P.bar.g + gels * P.gel.g; cnt = { drink: bid, gel: gels, bar: bars }; sh.drink += bid; sh.gel += gels; sh.bar += bars;
    }
    return Object.assign({}, t, { g, ml, na, gph: t.h > 0 ? g / t.h : 0, cnt });
  });
  const tot = rows.reduce((s, r) => ({ g: s.g + r.g, ml: s.ml + r.ml, na: s.na + r.na, h: s.h + r.h }), { g: 0, ml: 0, na: 0, h: 0 });
  return { n, rows, tot, shop: sh, target: Math.round(n.gph * tot.h) };
}
function plNutResHtml(d) {
  const r = plNutCalc(d); if (!r) return '<p class="soft" style="font-size:14px">Indica la distancia y tu velocidad media para calcular la nutrición.</p>';
  const n = r.n, hh = (h) => plDur(h * 60);
  let out = r.rows.map((x) => '<div class="col g4" style="border-top:1px solid var(--line);padding:8px 0"><div class="row between"><span style="font-weight:600;font-size:15px">' + esc(x.name) + '</span><span class="muted" style="font-size:13px">' + hh(x.h) + '</span></div><span class="soft" style="font-size:14px">' + x.g + ' g carbohidratos · ' + plL(x.ml) + ' · ' + x.na.toLocaleString('es-CL') + ' mg sodio' + (n.mode === 'tramo' ? ' · ' + Math.round(x.gph) + ' g por hora' : '') + '</span>' + (x.cnt ? '<span class="muted" style="font-size:13px">' + [x.cnt.drink ? x.cnt.drink + (x.cnt.drink === 1 ? ' bidón' : ' bidones') : '', x.cnt.gel ? x.cnt.gel + (x.cnt.gel === 1 ? ' gel' : ' geles') : '', x.cnt.bar ? x.cnt.bar + (x.cnt.bar === 1 ? ' barra' : ' barras') : ''].filter(Boolean).join(' · ') + '</span>' : '') + '</div>').join('');
  out += '<div class="row g12 wrap" style="border-top:1px solid var(--line);padding-top:10px"><div class="col g4"><span class="num" style="font-size:22px">' + r.tot.g + ' g</span><span class="muted" style="font-size:12px">Carbohidratos</span></div><div class="col g4"><span class="num" style="font-size:22px">' + plL(r.tot.ml) + '</span><span class="muted" style="font-size:12px">Líquido</span></div><div class="col g4"><span class="num" style="font-size:22px">' + (Math.round(r.tot.na / 100) / 10).toFixed(1).replace('.', ',') + ' g</span><span class="muted" style="font-size:12px">Sodio</span></div></div>';
  out += '<p class="soft" style="font-size:13px">Promedio en movimiento: ' + (r.tot.h > 0 ? Math.round(r.tot.g / r.tot.h) : 0) + ' g/h durante ' + hh(r.tot.h) + '.</p>';
  if (n.mode === 'producto') out += '<div class="col g4" style="border-top:1px solid var(--line);padding-top:8px"><span class="eyebrow">Lista de compras y carga</span><div class="row g12 wrap">' + [['drink', 'Bidones de ' + n.prods.drink.g + ' g'], ['gel', 'Geles'], ['bar', 'Barras']].map((k) => '<div class="col g4"><span class="num" style="font-size:22px">' + r.shop[k[0]] + '</span><span class="muted" style="font-size:12px">' + k[1] + '</span></div>').join('') + '</div><p class="soft" style="font-size:13px">Total planificado ' + r.tot.g + ' g, frente a ' + r.target + ' g de meta.</p></div>';
  return out;
}
function plNutBox(d) {
  const n = plNutFix(d.nut), rr = (id, t, v, k, mx) => '<div class="col g8 grow">' + '<label for="' + id + '" class="muted" style="font-size:13px">' + t + '</label><input class="field" id="' + id + '" data-pl="' + k + '" type="number" inputmode="numeric" min="0" max="' + mx + '" value="' + esc(v) + '"></div>', T = plTramos(d);
  let out = '<div id="pl-prof">' + plProfBox(d) + '</div><div class="seggroup" role="group" aria-label="Tipo de planificación de carbohidratos">' + [['hora', 'Por hora'], ['tramo', 'Por tramo'], ['producto', 'Por producto']].map((m) => '<button type="button" data-a="plNutMode" data-v="' + m[0] + '" aria-pressed="' + (n.mode === m[0]) + '">' + m[1] + '</button>').join('') + '</div>';
  out += '<p class="soft" style="font-size:13px">' + ({ hora: 'Fijas los gramos por hora y la app reparte el total entre los tramos.', tramo: 'Defines los gramos de cada tramo entre controles y la app calcula cuánto equivale por hora.', producto: 'Eliges qué productos llevas y la app arma cuántos consumir en cada tramo para llegar a la meta.' }[n.mode]) + '</p>';
  if (n.mode !== 'tramo') out += '<div class="row g8">' + rr('pl-ng', 'Carbos (g/h)', n.gph, 'ng', 200) + rr('pl-nm', 'Líquido (ml/h)', n.mlph, 'nm', 2000) + rr('pl-nn', 'Sodio (mg/h)', n.naph, 'nn', 2000) + '</div>';
  else out += '<div class="row g8">' + rr('pl-nm', 'Líquido (ml/h)', n.mlph, 'nm', 2000) + rr('pl-nn', 'Sodio (mg/h)', n.naph, 'nn', 2000) + '</div>' + T.map((t) => { const g = n.seg[String(t.to)] != null ? Number(n.seg[String(t.to)]) : plR5(n.gph * t.h); return '<div class="row g8" style="align-items:center;border-top:1px solid var(--line);padding-top:8px"><div class="col grow g4" style="min-width:0"><span style="font-weight:600;font-size:15px">' + esc(t.name) + '</span><span class="muted" style="font-size:13px">' + plDur(t.h * 60) + ' · ' + Math.round(g / t.h) + ' g por hora</span></div><button type="button" class="chip" data-a="plNutSeg" data-v="' + t.to + '|-5" aria-label="Bajar 5 gramos en ' + esc(t.name) + '" style="min-width:44px;justify-content:center">−</button><span class="num" style="min-width:56px;text-align:center;font-size:18px">' + g + ' g</span><button type="button" class="chip" data-a="plNutSeg" data-v="' + t.to + '|5" aria-label="Subir 5 gramos en ' + esc(t.name) + '" style="min-width:44px;justify-content:center">+</button></div>'; }).join('');
  if (n.mode === 'producto') out += '<div class="col g8" style="border-top:1px solid var(--line);padding-top:8px"><span class="eyebrow">Tus productos</span>' + [['drink', 'Bebida con carbohidratos', 'g por bidón'], ['gel', 'Gel', 'g por unidad'], ['bar', 'Barra', 'g por unidad']].map((p) => '<div class="row g8" style="align-items:center"><div class="col grow g4"><span style="font-weight:600;font-size:15px">' + p[1] + '</span><div class="row g8" style="align-items:center"><input class="field" style="width:84px;min-height:44px" id="pl-p-' + p[0] + '" data-pl="np" data-k="' + p[0] + '" type="number" inputmode="numeric" min="1" max="200" value="' + n.prods[p[0]].g + '" aria-label="' + p[2] + ' de ' + p[1] + '"><span class="muted" style="font-size:13px">' + p[2] + '</span></div></div><button type="button" class="chip" data-a="plProd" data-v="' + p[0] + '" aria-pressed="' + n.prods[p[0]].on + '">Incluido</button></div>').join('') + '</div>';
  return out + '<div id="pl-nutres">' + plNutResHtml(d) + '</div>';
}
function plNutSave(d) { const n = plNutFix(d.nut), ks = plTramos(d).map((t) => String(t.to)), seg = {}; ks.forEach((k) => { if (n.seg[k] != null) seg[k] = Number(n.seg[k]); }); n.seg = seg; return n; }
function plNew() { const nut = PL_NUT0(), S = plSug(200 / 24); if (S) { nut.gph = S.g; nut.mlph = S.ml; nut.naph = S.na; } return { id: null, d: { name: '', date: off(30), start: '06:00', kind: 'brevet', km: 200, speed: 24, stop: 10, track: null, ctl: [], nut, safe: Object.assign(plSafeFix(null), plSafeProfile()) } }; }
function plFromEv(e) { return { id: e.id, d: { name: e.name || '', date: e.date || off(30), start: e.start || '06:00', kind: e.kind === 'otro' ? 'otro' : 'brevet', km: e.km || '', speed: e.speed || 24, stop: e.stop != null ? e.stop : 10, track: e.track || null, ctl: (e.ctl || []).map((c) => ({ km: c.km, name: c.name || '', stop: c.stop == null ? '' : c.stop, reg: c.reg || null })), nut: plNutFix(e.nut), safe: plSafeFix(e.safe) } }; }
function plEvName(e) { return e.name || 'Evento'; }
function viewPlanificar() {
  if (!plannerOn()) return '<div class="inner"><div class="stack">' + head('Función no disponible', 'Planificar') + '<section class="card"><p class="soft">Esta función no está habilitada en tu cuenta. Si te interesa, pídesela a tu coach.</p></section></div></div>';
  if (LV && UI.liveOpen) return liveHtml();
  const P = UI.pl;
  if (P) return plEditHtml(P);
  const evs = (ST.myEvents || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))), today = off(0);
  let out = '<div class="inner"><div class="stack">' + head('Organiza tu próximo reto', 'Planificar') + msgBanner();
  if (LV) out += '<section class="card col g8" aria-label="Evento en curso"><div class="eyebrow">' + (LV.mode === 'fin' ? 'Evento terminado' : 'Evento en curso') + '</div><p class="soft">' + esc(LV.ev.name) + '</p><button type="button" class="btn primary" data-a="lvOpen"><span>' + (LV.mode === 'fin' ? 'Ver resumen' : 'Continuar') + '</span>' + ph('arrow-right', 22) + '</button></section>';
  if (!evs.length) out += '<section class="card col g12" aria-label="Sin eventos"><div class="eyebrow">Tus eventos</div><p class="soft">Crea un evento, carga su recorrido y calcula horarios y controles antes de salir. Sirve para un brevet o para cualquier salida larga.</p></section>';
  else {
    out += '<section class="card" aria-label="Tus eventos" style="padding-bottom:8px"><div class="eyebrow" style="margin-bottom:6px">Tus eventos</div>' + evs.map((e) => {
      const dd = e.date >= today ? diffDays(today, e.date) : -1, when = dd < 0 ? 'ya pasó' : (dd === 0 ? 'hoy' : 'en ' + dd + (dd === 1 ? ' día' : ' días')), dt = parse(e.date);
      return '<button type="button" class="mrow" data-a="plOpen" data-v="' + esc(e.id) + '" style="width:100%;text-align:left;background:transparent;border:0;border-top:1px solid var(--line);min-height:64px"><span class="col grow g4" style="min-width:0"><span style="font-weight:600;font-size:16px">' + esc(plEvName(e)) + '</span><span class="muted" style="font-size:13px">' + cap(WD[dt.getDay()]) + ' ' + dt.getDate() + ' ' + FC_MES[dt.getMonth()] + ' · ' + when + '</span><span class="muted" style="font-size:13px">' + (e.kind === 'brevet' ? 'Brevet ' : '') + (e.km ? String(e.km).replace('.', ',') + ' km' : '') + (e.track ? ' · con recorrido' : '') + ((e.ctl || []).length ? ' · ' + e.ctl.length + (e.ctl.length === 1 ? ' control' : ' controles') : '') + '</span></span>' + ph('caret-right', 20, 'var(--muted)') + '</button>';
    }).join('') + '</section>';
  }
  out += '<button type="button" class="btn primary" data-a="plNew"><span>Nuevo evento</span>' + ph('arrow-right', 22) + '</button></div></div>';
  return out;
}
function plEditHtml(P) {
  const d = P.d, brv = d.kind === 'brevet', tr = d.track, lab = (id, t) => '<label for="' + id + '" class="muted" style="font-size:13px">' + t + '</label>';
  const f = (id, t, inner) => '<div class="col g8">' + lab(id, t) + inner + '</div>';
  let out = '<div class="inner"><div class="stack"><div class="row between"><div class="col g4" style="min-width:0"><div class="muted" style="font-size:14px">' + (P.id ? 'Editar evento' : 'Nuevo evento') + '</div><h1 class="title">' + esc(d.name || 'Evento') + '</h1></div><button type="button" class="chip" data-a="plClose">Cerrar</button></div>' + msgBanner();
  out += '<section class="card col g12" aria-label="Datos del evento"><div class="eyebrow">El evento</div>'
    + f('pl-name', 'Nombre', '<input class="field" id="pl-name" data-pl="name" type="text" maxlength="80" value="' + esc(d.name) + '" placeholder="Ejemplo: Brevet 200 km">')
    + '<div class="row g8"><div class="col g8 grow">' + lab('pl-date', 'Fecha') + '<input class="field" id="pl-date" data-pl="date" type="date" value="' + esc(d.date) + '"></div><div class="col g8 grow">' + lab('pl-start', 'Hora de salida') + '<input class="field" id="pl-start" data-pl="start" type="time" value="' + esc(d.start) + '"></div></div>'
    + '<div class="col g8"><span class="muted" style="font-size:13px">Tipo</span><div class="seggroup" role="group" aria-label="Tipo de evento"><button type="button" data-a="plKind" data-v="brevet" aria-pressed="' + brv + '">Brevet</button><button type="button" data-a="plKind" data-v="otro" aria-pressed="' + !brv + '">Otro</button></div></div>'
    + (brv ? '<div class="col g8"><span class="muted" style="font-size:13px">Distancia del brevet</span><div class="chips" role="group" aria-label="Distancia del brevet">' + PL_BRV.map((k) => '<button type="button" class="chip" data-a="plBrv" data-v="' + k + '" aria-pressed="' + (Number(d.km) === k) + '">' + k + ' km</button>').join('') + '</div></div>' : f('pl-km', 'Distancia (km)', '<input class="field" id="pl-km" data-pl="km" type="number" inputmode="decimal" min="1" max="2000" value="' + esc(d.km) + '">'))
    + '</section>';
  out += '<section class="card col g12" aria-label="Recorrido"><div class="eyebrow">Recorrido</div>';
  if (tr) {
    const near = brv && Math.abs(tr.km - Number(d.km)) > Number(d.km) * 0.1;
    out += routeSvg(tr) + (tr.a ? elevSvg(tr) : '') + '<div class="row g12 wrap"><div class="col g4"><span class="num" style="font-size:22px">' + String(tr.km).replace('.', ',') + ' km</span><span class="muted" style="font-size:12px">Distancia</span></div>' + (tr.gain != null ? '<div class="col g4"><span class="num" style="font-size:22px">' + tr.gain.toLocaleString('es-CL') + ' m</span><span class="muted" style="font-size:12px">Desnivel positivo</span></div><div class="col g4"><span class="num" style="font-size:22px">' + tr.max + ' m</span><span class="muted" style="font-size:12px">Altitud máxima</span></div>' : '') + '</div>'
      + (near ? '<p style="font-size:13px;font-weight:600">La ruta mide ' + String(tr.km).replace('.', ',') + ' km y el brevet es de ' + d.km + ' km. Revisa que sea la ruta correcta.</p>' : '')
      + '<div class="row g8 wrap"><label class="chip" for="pl-file" style="display:inline-flex;align-items:center;cursor:pointer">Cambiar archivo</label><button type="button" class="chip" data-a="plNoTrack">Quitar recorrido</button></div>';
  } else out += '<p class="soft" style="font-size:14px">Carga el archivo GPX del recorrido para ver el mapa, la distancia y el desnivel. Lo descargas desde Garmin Connect, RideWithGPS o Strava (en una ruta o actividad, opción exportar GPX).</p><label class="btn primary" for="pl-file" style="cursor:pointer;justify-content:center"><span>Cargar archivo GPX</span></label>';
  out += '<input id="pl-file" data-pl="file" type="file" accept=".gpx,application/gpx+xml,text/xml,application/xml" style="position:absolute;left:-9999px;width:1px;height:1px" aria-label="Archivo GPX"><p class="muted" style="font-size:12px">El archivo se procesa en tu teléfono y solo se guarda un trazo simplificado.</p></section>';
  out += '<section class="card col g12" aria-label="Controles"><div class="eyebrow">' + (brv ? 'Controles' : 'Paradas') + '</div><p class="soft" style="font-size:13px">' + (brv ? 'Escribe el kilómetro de cada control intermedio. La meta se agrega sola.' : 'Escribe el kilómetro de cada parada planificada.') + '</p>';
  const lockCtl = !!(LV && P.id && LV.ev && LV.ev.id === P.id);
  (d.ctl || []).forEach((c, i) => {
    const regDt = c.reg ? new Date(c.reg) : null, regHm = regDt ? pad(regDt.getHours()) + ':' + pad(regDt.getMinutes()) : '';
    const ctlLabel = c.name || ('control ' + (i + 1));
    const regBtn = regDt
      ? '<button type="button" class="chip" data-a="plCtlReg" data-v="' + i + '" aria-pressed="true"' + (lockCtl ? ' disabled' : '') + ' style="width:100%;justify-content:center;padding:0 6px" aria-label="Quitar el registro de paso por ' + esc(ctlLabel) + ', registrado a las ' + regHm + '">' + regHm + '</button>'
      : '<button type="button" class="chip" data-a="plCtlReg" data-v="' + i + '" style="width:100%;justify-content:center;padding:0 6px" aria-label="Registrar que acabas de pasar por ' + esc(ctlLabel) + '">Registrar</button>';
    out += '<div class="col g8" style="border-top:1px solid var(--line);padding-top:10px"><div class="row g8"><div class="col g4 grow">' + lab('plc-k' + i, 'Kilómetro') + '<input class="field" id="plc-k' + i + '" data-pl="ck" data-i="' + i + '" type="number" inputmode="decimal" min="1" value="' + esc(c.km) + '"></div><div class="col g4" style="width:84px;flex:none">' + lab('plc-s' + i, 'Parada (min)') + '<input class="field" id="plc-s' + i + '" data-pl="cs" data-i="' + i + '" type="number" inputmode="numeric" min="0" max="600" value="' + esc(c.stop) + '" placeholder="' + esc(d.stop) + '" style="width:84px"></div><div class="col g4" style="width:92px;flex:none"><span class="muted" style="font-size:13px">Paso</span>' + regBtn + '</div></div><div class="row g8"><input class="field grow" id="plc-n' + i + '" data-pl="cn" data-i="' + i + '" type="text" maxlength="40" value="' + esc(c.name) + '" placeholder="Nombre del control (opcional)" aria-label="Nombre del control ' + (i + 1) + '">' + (lockCtl ? '' : '<button type="button" class="chip" data-a="plCtlDel" data-v="' + i + '" aria-label="Quitar control ' + (i + 1) + '">Quitar</button>') + '</div></div>';
  });
  out += '<button type="button" class="chip" data-a="plCtlAdd" style="align-self:flex-start;border-color:var(--accent);color:var(--accent);font-weight:600">Agregar ' + (brv ? 'control' : 'parada') + '</button></section>';
  out += '<section class="card col g12" aria-label="Tu ritmo"><div class="eyebrow">Tu ritmo</div><div class="row g8"><div class="col g8 grow">' + lab('pl-speed', 'Velocidad media (km/h)') + '<input class="field" id="pl-speed" data-pl="speed" type="number" inputmode="decimal" min="5" max="60" value="' + esc(d.speed) + '"></div><div class="col g8 grow">' + lab('pl-stop', 'Parada típica (min)') + '<input class="field" id="pl-stop" data-pl="stop" type="number" inputmode="numeric" min="0" max="600" value="' + esc(d.stop) + '"></div></div><p class="muted" style="font-size:12px">La velocidad es en movimiento, sin contar las paradas.</p></section>';
  out += '<section class="card col g12" aria-label="Nutrición e hidratación"><div class="eyebrow">Nutrición e hidratación</div><div id="pl-nut" class="col g12">' + plNutBox(d) + '</div><p class="muted" style="font-size:12px">Son valores de partida: ajústalos a lo que te funciona y a lo que acuerdes con tu nutricionista. Se calculan sobre el tiempo en movimiento.</p></section>';
  out += '<section class="card col g8" aria-label="Horarios"><div class="eyebrow">' + (brv ? 'Horarios y ventanas de control' : 'Horarios estimados') + '</div><div id="pl-res">' + plResHtml(d) + '</div></section>';
  out += '<section class="card col g12" aria-label="Hoja de seguridad"><div class="eyebrow">Hoja de seguridad</div><p class="soft" style="font-size:13px">Opcional. Deja a tu gente informada: cómo seguirte, a quién llamar y desde qué hora preocuparse.</p><div id="pl-safe" class="col g12">' + plSafeBox(d) + '</div></section>';
  out += '<button type="button" class="btn primary" data-a="plSave"' + (UI.busy ? ' disabled' : '') + '><span>Guardar evento</span>' + ph('check', 22) + '</button>';
  if (P.id) out += '<button type="button" class="btn" data-a="lvStart" data-v="' + esc(P.id) + '"><span>Iniciar evento<small style="display:block;font-size:13px;font-weight:500;color:var(--muted)">Sigue tu avance en vivo. Usa la versión guardada.</small></span>' + ph('arrow-right', 22) + '</button>';
  else out += '<p class="muted" style="font-size:13px">Guarda el evento para poder iniciarlo en vivo.</p>';
  if (P.id) out += P.del ? '<div class="row g8 wrap"><button type="button" class="chip" data-a="plDelYes" style="border-color:var(--warn);font-weight:700">Sí, eliminar este evento</button><button type="button" class="chip" data-a="plDelNo">No, conservarlo</button></div>' : '<button type="button" class="btn ghost" data-a="plDel">Eliminar evento</button>';
  return out + '</div></div>';
}
function plInput(t) {
  const P = UI.pl, k = t.dataset && t.dataset.pl; if (!P || !k) return false; const d = P.d, v = t.value;
  if (k === 'file') return true;
  if (k === 'sl' || k === 'sn' || k === 'sp' || k === 'su' || k === 'dk') { d.safe = plSafeFix(d.safe); if (k === 'sl') d.safe.link = v.trim(); else if (k === 'sn') d.safe.name = v; else if (k === 'sp') d.safe.phone = v; else if (k === 'su') d.safe.until = v; else { const r = d.safe.dead[+t.dataset.i]; if (r) r[t.dataset.w] = v; } plSafeRefresh(); return true; }
  if (k === 'name') { d.name = v; const h = document.querySelector('h1.title'); if (h) h.textContent = v || 'Evento'; return true; }
  if (k === 'ng' || k === 'nm' || k === 'nn' || k === 'np') { d.nut = plNutFix(d.nut); if (k === 'np') d.nut.prods[t.dataset.k].g = plNum(v, d.nut.prods[t.dataset.k].g, 1, 200); else { const f = { ng: 'gph', nm: 'mlph', nn: 'naph' }[k]; d.nut[f] = plNum(v, d.nut[f], 0, f === 'gph' ? 200 : 2000); } }
  else if (k === 'date' || k === 'start' || k === 'km' || k === 'speed' || k === 'stop') d[k] = v;
  else { const c = d.ctl[+t.dataset.i]; if (!c) return true; if (k === 'ck') c.km = v; else if (k === 'cs') c.stop = v; else if (k === 'cn') c.name = v; }
  const r = document.getElementById('pl-res'); if (r) r.innerHTML = plResHtml(d);
  const nb = document.getElementById('pl-nut'); if (nb) { if (nb.contains(t)) { const nr = document.getElementById('pl-nutres'); if (nr) nr.innerHTML = plNutResHtml(d); const pp = document.getElementById('pl-prof'); if (pp) pp.innerHTML = plProfBox(d); } else nb.innerHTML = plNutBox(d); }
  return true;
}
function plValid(d) {
  if (!String(d.name || '').trim()) return 'Ponle un nombre al evento.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) return 'Elige la fecha del evento.';
  if (!/^\d{2}:\d{2}$/.test(d.start || '')) return 'Indica la hora de salida.';
  const km = Number(d.km); if (!(km > 0 && km <= 2000)) return 'Indica la distancia del evento.';
  const v = Number(d.speed); if (!(v >= 5 && v <= 60)) return 'La velocidad media debe estar entre 5 y 60 km/h.';
  for (const c of d.ctl || []) { const k = Number(c.km); if (!(k > 0 && k < km)) return 'Cada control debe estar entre 0 y ' + km + ' km.'; if (c.stop !== '' && c.stop != null && !(Number(c.stop) >= 0 && Number(c.stop) <= 600)) return 'Las paradas van de 0 a 600 minutos.'; }
  const sf = plSafeFix(d.safe); if (sf.link && !/^https:\/\/[^\s]+$/i.test(sf.link)) return 'El enlace de seguimiento debe empezar con https://';
  for (const r of sf.dead) { if (r.a === '' && r.b === '') continue; if (!(Number(r.a) >= 0 && Number(r.b) > Number(r.a) && Number(r.b) <= km)) return 'Cada tramo sin señal debe ir desde un km menor a uno mayor, dentro de ' + km + ' km.'; }
  return '';
}
Object.assign(ACT, {
  plNutProf() { const d = UI.pl.d, S = plSug(plMovH(d)); if (!S) return; d.nut = plNutFix(d.nut); d.nut.gph = S.g; d.nut.mlph = S.ml; d.nut.naph = S.na; document.getElementById('pl-nut').innerHTML = plNutBox(d); say('Valores de tu perfil aplicados: ' + S.g + ' g/h, ' + S.ml + ' ml/h, ' + S.na + ' mg/h.', 'ok'); },
  plNutMode(v) { const d = UI.pl.d; d.nut = plNutFix(d.nut); d.nut.mode = v; document.getElementById('pl-nut').innerHTML = plNutBox(d); },
  plNutSeg(v) { const d = UI.pl.d, q = String(v).split('|'), to = q[0], dl = Number(q[1]); d.nut = plNutFix(d.nut); const t = plTramos(d).find((x) => String(x.to) === to); if (!t) return; const cur = d.nut.seg[to] != null ? Number(d.nut.seg[to]) : plR5(d.nut.gph * t.h); d.nut.seg[to] = Math.max(0, Math.min(1000, cur + dl)); document.getElementById('pl-nut').innerHTML = plNutBox(d); },
  plProd(v) { const d = UI.pl.d; d.nut = plNutFix(d.nut); d.nut.prods[v].on = !d.nut.prods[v].on; document.getElementById('pl-nut').innerHTML = plNutBox(d); },
  plNew() { UI.pl = plNew(); render(); window.scrollTo(0, 0); },
  plOpen(v) { const e = (ST.myEvents || []).find((x) => x.id === v); if (!e) return; UI.pl = plFromEv(e); render(); window.scrollTo(0, 0); },
  plClose() { UI.pl = null; render(); },
  plKind(v) { const d = UI.pl.d; if (d.kind === v) return; d.kind = v; if (v === 'brevet' && PL_BRV.indexOf(Number(d.km)) < 0) d.km = 200; render(); },
  plBrv(v) { UI.pl.d.km = Number(v); render(); },
  plCtlAdd() { UI.pl.d.ctl.push({ km: '', name: '', stop: '', reg: null }); render(); },
  plCtlDel(v) { if (plCtlLocked()) { say('El evento está en curso: ya no se pueden quitar controles.'); return; } UI.pl.d.ctl.splice(+v, 1); render(); },
  plCtlReg(v) { const c = UI.pl.d.ctl[+v]; if (!c) return; if (c.reg && plCtlLocked()) { say('El evento está en curso: el registro del paso no se puede quitar.'); return; } c.reg = c.reg ? null : Date.now(); render(); },
  plNoTrack() { UI.pl.d.track = null; render(); },
  plDel() { UI.pl.del = true; render(); },
  plDelNo() { UI.pl.del = false; render(); },
  async plDelYes() { const P = UI.pl; if (!P || !P.id || !ST.user) return; UI.busy = true; try { await be.deleteEvent(ST.user.uid, P.id); UI.pl = null; say('Evento eliminado.', 'ok'); } catch (e) { say(friendly(e)); } UI.busy = false; render(); },
  async plSave() {
    const P = UI.pl; if (!P || !ST.user || UI.busy) return; const d = P.d, er = plValid(d); if (er) { say(er); return; }
    const ctl = (d.ctl || []).filter((c) => Number(c.km) > 0).map((c) => ({ km: Number(c.km), name: String(c.name || '').slice(0, 40), stop: c.stop === '' || c.stop == null ? null : Number(c.stop), reg: c.reg || null })).sort((a, b) => a.km - b.km);
    const data = { name: String(d.name).trim().slice(0, 80), date: d.date, start: d.start, kind: d.kind, km: Number(d.km), speed: Number(d.speed), stop: Number(d.stop) || 0, track: d.track || null, ctl, nut: plNutSave(d), safe: plSafeSave(d), updatedAt: Date.now() };
    const old = (ST.myEvents || []).find((x) => x.id === P.id); if (old && old.result) data.result = old.result;
    UI.busy = true; render();
    try { await be.saveEvent(ST.user.uid, P.id || ('e' + Date.now().toString(36)), data); UI.pl = null; say('Evento guardado.', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  }
});
async function plFile(f) {
  const P = UI.pl; if (!P || !f) return;
  if (f.size > 12 * 1024 * 1024) { say('El archivo pesa demasiado (máximo 12 MB).'); return; }
  let txt; try { txt = await f.text(); } catch (e) { say('No pude leer el archivo.'); return; }
  const r = plParseGpx(txt); if (r.err) { say(r.err); return; }
  P.d.track = r.track; if (!String(P.d.name).trim() && r.name) P.d.name = r.name;
  if (P.d.kind === 'otro' && !(Number(P.d.km) > 0)) P.d.km = Math.round(r.track.km);
  say('Recorrido cargado: ' + String(r.track.km).replace('.', ',') + ' km.', 'ok');
}
document.addEventListener('change', (e) => { const t = e.target; if (t && t.dataset && t.dataset.pl === 'file' && t.files && t.files[0]) { const f = t.files[0]; t.value = ''; plFile(f); } });

/* ---------- Modo en vivo del evento (v56) ---------- */
var LV = null;
const lvKey = () => 'camino-live-v1-' + (ST.user ? ST.user.uid : '');
const lvLoad = () => { try { const r = JSON.parse(localStorage.getItem(lvKey()) || 'null'); if (r && r.ev) { r.confirmEnd = 0; r.gpsBusy = false; return r; } return null; } catch (e) { return null; } };
const lvSave = () => { try { if (LV) localStorage.setItem(lvKey(), JSON.stringify(LV)); else localStorage.removeItem(lvKey()); } catch (e) { /* sin almacenamiento */ } };
const lvClock = (ms) => { const d = new Date(ms), s = new Date(LV && LV.start ? LV.start : ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + (ymd(d) !== ymd(s) ? ' (+' + Math.max(1, Math.round((parse(ymd(d)) - parse(ymd(s))) / 86400000)) + ' d)' : ''); };
const lvHMS = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return Math.floor(t / 3600) + ':' + pad(Math.floor(t % 3600 / 60)) + ':' + pad(t % 60); };
const lvKm1 = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const lvMinTxt = (m) => { m = Math.abs(Math.round(m)); return m < 60 ? m + ' min' : plDur(m); };
let lvPtsC = { p: '', v: null };
function lvPts(tr) {
  if (lvPtsC.p === tr.p && lvPtsC.v) return lvPtsC.v;
  const P = decodePoly(tr.p), cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + plHav(P[i - 1], P[i]));
  const k = tr.km / (cum[cum.length - 1] || 1), C = cum.map((x) => x * k); lvPtsC = { p: tr.p, v: { P, C } }; return lvPtsC.v;
}
/* Proyecta un punto GPS sobre el recorrido, solo hacia adelante desde el último km conocido. */
function lvProject(tr, lat, lon, kmFrom, maxAdv) {
  const { P, C } = lvPts(tr), kx = Math.cos(lat * Math.PI / 180) * 111320, ky = 110540; let best = null;
  for (let i = 0; i < P.length - 1; i++) {
    if (C[i + 1] < kmFrom - 3 || C[i] > kmFrom + maxAdv) continue;
    const ax = (P[i][1] - lon) * kx, ay = (P[i][0] - lat) * ky, bx = (P[i + 1][1] - lon) * kx, by = (P[i + 1][0] - lat) * ky, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    let t = L2 > 0 ? -(ax * dx + ay * dy) / L2 : 0; t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ax + t * dx, ay + t * dy); if (!best || d < best.dist) best = { dist: d, km: C[i] + t * (C[i + 1] - C[i]) };
  }
  return best;
}
function lvPlanAt(c, v, km) { let prev = { km: 0, dep: 0 }; for (const r of c.rows) { if (km <= r.km) return prev.dep + (km - prev.km) / v * 60; prev = { km: r.km, dep: r.rec + r.stop }; } return prev.dep; }
function lvPaused(a, b) { let s = 0; (LV.rec || []).forEach((e) => { if (e.type !== 'detencion') return; s += Math.max(0, Math.min(e.end || Date.now(), b) - Math.max(e.start, a)); }); return s; }
function lvAna() {
  const c = plCalc(plFromEv(LV.ev).d), r = c.rows[LV.idx], v = Number(LV.ev.speed), brv = LV.ev.kind === 'brevet';
  const at = LV.lastKmAt || LV.depMs, km = Math.max(LV.lastKm, LV.depKm), segKm = km - LV.depKm, rem = Math.max(0, r.km - km), mov = (at - LV.depMs) - lvPaused(LV.depMs, at);
  const avg = segKm >= 1 && mov >= 300000 ? segKm / (mov / 3600000) : null;
  let etaMs = at + rem / (avg || v) * 3600000, wait = false; if (brv) { const op = LV.start + r.w.open * 60000; if (etaMs < op) { etaMs = op; wait = true; } }
  const delay = (at - LV.start) / 60000 - lvPlanAt(c, v, km), marg = brv ? r.w.close - (etaMs - LV.start) / 60000 : null;
  const stopsMs = LV.log.reduce((s, x) => s + Math.max(0, (x.dep || at) - x.arr), 0), movAll = (at - LV.start) - stopsMs - lvPaused(LV.start, at), avgAll = km >= 1 && movAll >= 300000 ? km / (movAll / 3600000) : null;
  return { c, r, v, brv, km, rem, avg, avgAll, etaMs, wait, delay, marg, at };
}
function lvStatus(a) {
  const d = a.delay; let lv = 'ok', t, ch;
  if (d <= -3) { t = 'Vas ' + lvMinTxt(d) + ' adelantado'; ch = 'Adelantado'; } else if (d < 3) { t = 'Vas según el programa'; ch = 'En horario'; } else if (d <= 15) { t = 'Vas ' + lvMinTxt(d) + ' atrasado'; ch = 'Atrasado'; lv = 'warn'; } else { t = 'Vas ' + lvMinTxt(d) + ' atrasado'; ch = 'Muy atrasado'; lv = 'warn'; }
  if (a.brv && a.marg != null && a.marg < 0) { ch = 'Riesgo de cierre'; lv = 'warn'; }
  return { t, ch, lv };
}
function lvShareText() {
  const a = lvAna(), nm = (ST.profile && ST.profile.name) || (ST.user && ST.user.name) || 'Yo', f = firstName(nm), st = lvStatus(a);
  let s = f + ' · ' + LV.ev.name + '. Salió a las ' + lvClock(LV.start) + '. ' + (LV.mode === 'fin' ? 'Terminó el evento a las ' + lvClock(LV.end) + '.' : 'Va en el km ' + lvKm1(a.km) + ' de ' + LV.ev.km + ' (' + st.t.replace('Vas ', 'va ') + '). Próximo control: ' + (a.r.meta ? 'la meta' : (a.r.n || 'control')) + ' km ' + a.r.km + ', llegada estimada ' + lvClock(a.etaMs) + (a.brv ? ', cierra ' + lvClock(LV.start + a.r.w.close * 60000) : '') + '.');
  if (LV.msg && LV.msg.trim()) s += ' ' + LV.msg.trim();
  return s;
}
function lvTile(l, v, id) { return '<div class="col g4" style="background:var(--surface);border-radius:16px;padding:12px 14px;min-width:0"><span class="num" style="font-size:22px;line-height:1.05"' + (id ? ' id="' + id + '"' : '') + '>' + v + '</span><span class="muted" style="font-size:12px">' + l + '</span></div>'; }
function lvStatCard(chip, big, sub, subId, warn) { return '<section class="card col g4" style="text-align:center;align-items:center"><span class="pill" style="' + (warn ? 'border-color:var(--warn);color:var(--text);font-weight:700' : 'border-color:var(--good);color:var(--text);font-weight:700') + '">' + chip + '</span><div class="num" style="font-size:clamp(26px,8vw,36px);line-height:1.1">' + big + '</div><div class="muted" style="font-size:13px"' + (subId ? ' id="' + subId + '"' : '') + '>' + sub + '</div></section>'; }
/* ---------- v64: Hoja de seguridad del evento ---------- */
function plSafeFix(x) {
  x = x && typeof x === 'object' ? x : {};
  return { link: String(x.link || '').trim().slice(0, 300), name: String(x.name || '').slice(0, 80), phone: String(x.phone || '').slice(0, 30), until: /^\d{2}:\d{2}$/.test(x.until || '') ? x.until : '',
    dead: (Array.isArray(x.dead) ? x.dead : []).slice(0, 10).map((r) => ({ a: r && r.a != null ? r.a : '', b: r && r.b != null ? r.b : '' })) };
}
function plSafeProfile() { const e = (bioMain() || {}).emergency || {}; return { name: e.name || '', phone: e.phone || '' }; }
function plSafeAutoUntil(d) { const c = plCalc(d); if (!c) return ''; const p = String(d.start || '06:00').split(':'), t = ((+p[0] || 0) * 60 + (+p[1] || 0) + c.finish + 120) % 1440; return pad(Math.floor(t / 60)) + ':' + pad(t % 60); }
function plSafeText(d) {
  const s = plSafeFix(d.safe), c = plCalc(d), kmf = (n) => String(Number(n)).replace('.', ',');
  const dead = s.dead.filter((r) => Number(r.b) > Number(r.a) && Number(r.a) >= 0).map((r) => 'km ' + kmf(r.a) + ' al ' + kmf(r.b));
  let t = 'Hola, salgo a hacer ' + (d.name || 'mi evento') + ' (' + kmf(d.km) + ' km) el ' + shortDate(d.date) + ' a las ' + d.start + '.';
  if (c) t += ' Llegada estimada: ' + plClock(d.start, c.finish) + '.';
  if (s.link) t += ' Puedes seguir mi ubicación aquí: ' + s.link;
  if (dead.length) t += ' Tramos sin señal celular: ' + dead.join(', ') + '.';
  if (s.until) t += ' Si no tienes noticias mías después de las ' + s.until + ', intenta llamarme' + (s.name || s.phone ? ' y, si no respondo, avisa a ' + [s.name, s.phone].filter(Boolean).join(' · ') : '') + '.';
  return t;
}
function plSafeBox(d) {
  const s = plSafeFix(d.safe), lab = (id, t) => '<label for="' + id + '" class="muted" style="font-size:13px">' + t + '</label>', hasProf = !!(plSafeProfile().name || plSafeProfile().phone);
  let out = '<div class="col g8">' + lab('pl-sl', 'Enlace de seguimiento en vivo (Garmin LiveTrack, Beacon u otro)') + '<input class="field" id="pl-sl" data-pl="sl" type="url" inputmode="url" maxlength="300" placeholder="https://..." value="' + esc(s.link) + '"></div>';
  out += '<div class="col g8"><span class="eyebrow">Contacto responsable</span><div class="row g8"><div class="col g8 grow">' + lab('pl-sn', 'Nombre') + '<input class="field" id="pl-sn" data-pl="sn" type="text" maxlength="80" value="' + esc(s.name) + '"></div><div class="col g8 grow">' + lab('pl-sp', 'Teléfono') + '<input class="field" id="pl-sp" data-pl="sp" type="tel" inputmode="tel" maxlength="30" value="' + esc(s.phone) + '"></div></div>' + (hasProf ? '<button type="button" class="chip" data-a="plSafeProf" style="align-self:flex-start">Usar el contacto de emergencia de mi perfil</button>' : '') + '</div>';
  out += '<div class="col g8">' + lab('pl-su', 'Si no hay noticias mías después de las') + '<div class="row g8" style="align-items:center"><input class="field" id="pl-su" data-pl="su" type="time" value="' + esc(s.until) + '" style="max-width:160px"><button type="button" class="chip" data-a="plSafeAuto">Llegada estimada + 2 h</button></div></div>';
  out += '<div class="col g8"><span class="eyebrow">Tramos sin señal celular</span>' + s.dead.map((r, i) => '<div class="row g8" style="align-items:flex-end"><div class="col g4 grow">' + lab('pl-da' + i, 'Desde el km') + '<input class="field" id="pl-da' + i + '" data-pl="dk" data-w="a" data-i="' + i + '" type="number" inputmode="decimal" min="0" value="' + esc(r.a) + '"></div><div class="col g4 grow">' + lab('pl-db' + i, 'Hasta el km') + '<input class="field" id="pl-db' + i + '" data-pl="dk" data-w="b" data-i="' + i + '" type="number" inputmode="decimal" min="0" value="' + esc(r.b) + '"></div><button type="button" class="chip" data-a="plDeadDel" data-v="' + i + '" aria-label="Quitar tramo ' + (i + 1) + '">Quitar</button></div>').join('') + (s.dead.length < 10 ? '<button type="button" class="chip" data-a="plDeadAdd" style="align-self:flex-start">Agregar tramo sin señal</button>' : '') + '</div>';
  out += '<div class="col g8"><span class="eyebrow">Mensaje para tu grupo</span><p class="soft" id="pl-safemsg" style="font-size:14px;background:var(--surface2);border-radius:14px;padding:12px 14px">' + esc(plSafeText(d)) + '</p><div class="row g8 wrap"><button type="button" class="btn primary" data-a="plSafeWa" style="width:auto;padding:0 18px"><span>Compartir por WhatsApp</span></button><button type="button" class="btn" data-a="plSafeCopy" style="width:auto;padding:0 18px"><span>Copiar mensaje</span></button></div></div>';
  out += '<div class="info" role="note" style="border-color:var(--warn)">' + infoIcon() + '<span>Quien reciba el enlace verá dónde estás mientras dure el seguimiento. Compártelo solo con personas de confianza y desactívalo al terminar.</span></div>';
  return out;
}
function plSafeSave(d) { const s = plSafeFix(d.safe); s.dead = s.dead.filter((r) => r.a !== '' && r.b !== '' && Number(r.b) > Number(r.a)).map((r) => ({ a: Number(r.a), b: Number(r.b) })); return s; }
async function safeShare(d, how) {
  const t = plSafeText(d);
  if (how === 'wa') { window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener'); return; }
  try { await navigator.clipboard.writeText(t); say('Mensaje copiado.', 'ok'); } catch (e) { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let okc = false; try { okc = document.execCommand('copy'); } catch (e2) { /* sin portapapeles */ } ta.remove(); say(okc ? 'Mensaje copiado.' : 'No pude copiar. Mantén presionado el texto para copiarlo.', okc ? 'ok' : 'err'); }
}
function plSafeRefresh() { const m = document.getElementById('pl-safemsg'); if (m && UI.pl) m.textContent = plSafeText(UI.pl.d); }
Object.assign(ACT, {
  plSafeProf() { const d = UI.pl.d, p = plSafeProfile(); d.safe = plSafeFix(d.safe); d.safe.name = p.name; d.safe.phone = p.phone; document.getElementById('pl-safe').innerHTML = plSafeBox(d); },
  plSafeAuto() { const d = UI.pl.d, u = plSafeAutoUntil(d); if (!u) { say('Indica primero la distancia y tu velocidad media.'); return; } d.safe = plSafeFix(d.safe); d.safe.until = u; document.getElementById('pl-safe').innerHTML = plSafeBox(d); },
  plDeadAdd() { const d = UI.pl.d; d.safe = plSafeFix(d.safe); if (d.safe.dead.length < 10) d.safe.dead.push({ a: '', b: '' }); document.getElementById('pl-safe').innerHTML = plSafeBox(d); },
  plDeadDel(v) { const d = UI.pl.d; d.safe = plSafeFix(d.safe); d.safe.dead.splice(+v, 1); document.getElementById('pl-safe').innerHTML = plSafeBox(d); },
  plSafeWa() { safeShare(UI.pl.d, 'wa'); },
  plSafeCopy() { safeShare(UI.pl.d, 'copy'); },
  lvSafeWa() { if (LV) safeShare(plFromEv(LV.ev).d, 'wa'); },
  lvSafeCopy() { if (LV) safeShare(plFromEv(LV.ev).d, 'copy'); }
});
function liveHtml() {
  const ev = LV.ev; let out = '<div class="inner"><div class="stack"><div class="row between"><div class="col g4" style="min-width:0"><div class="muted" style="font-size:14px">' + (LV.mode === 'fin' ? 'Evento terminado' : 'Evento en curso') + '</div><h1 class="title">' + esc(ev.name) + '</h1></div><button type="button" class="chip" data-a="lvHide">Salir</button></div>' + msgBanner();
  if (LV.mode === 'pre') {
    out += '<section class="card col g12"><div class="eyebrow">Antes de salir</div><p class="soft">Salida programada: <b>' + esc(ev.start) + '</b>. Toca el botón en el momento exacto de la salida: desde ahí corre el cronómetro y se calculan los horarios.</p><button type="button" class="btn primary" data-a="lvGo"><span>Confirmar salida ahora</span>' + ph('arrow-right', 22) + '</button><div class="col g8"><label for="lv-ago" class="muted" style="font-size:13px">¿Ya saliste? Indica hace cuántos minutos</label><div class="row g8"><input class="field" id="lv-ago" type="number" inputmode="numeric" min="0" max="600" placeholder="Ejemplo: 20"><button type="button" class="chip" data-a="lvGoAgo">Aplicar</button></div></div></section><button type="button" class="btn ghost" data-a="lvDrop">Cancelar, no voy a salir</button>';
    { const sf = plSafeFix(ev.safe); if (sf.link || sf.name || sf.phone || sf.until) out += '<section class="card col g8" aria-label="Hoja de seguridad"><div class="eyebrow">Hoja de seguridad</div><p class="soft" style="font-size:14px">' + esc(plSafeText(plFromEv(ev).d)) + '</p><div class="row g8 wrap"><button type="button" class="btn primary" data-a="lvSafeWa" style="width:auto;padding:0 18px"><span>Compartir por WhatsApp</span></button><button type="button" class="btn" data-a="lvSafeCopy" style="width:auto;padding:0 18px"><span>Copiar mensaje</span></button></div></section>'; }
    return out + '</div></div>';
  }
  if (LV.mode === 'fin') {
    const tot = (LV.end - LV.start) / 60000, last = LV.log[LV.log.length - 1], done = last && last.meta;
    out += lvStatCard(done ? 'Meta' : 'Terminado antes', done ? '¡Llegaste!' : 'Evento cerrado', lvClock(LV.end) + ' · ' + plDur(tot) + ' en total', '', !done)
      + '<section class="card col g8"><div class="eyebrow">Resumen</div>' + (LV.log.length ? LV.log.map((x) => '<div class="mrow"><div class="col grow g4" style="min-width:0"><span style="font-weight:600">' + esc(x.name) + ' · km ' + String(x.km).replace('.', ',') + '</span><span class="muted" style="font-size:13px">Llegada ' + lvClock(x.arr) + ' · ' + lvKm1(x.speed || 0) + ' km/h en el tramo</span></div><span class="muted" style="font-size:12px">' + (x.delay >= 3 ? lvMinTxt(x.delay) + ' atraso' : x.delay <= -3 ? lvMinTxt(x.delay) + ' adelanto' : 'En horario') + '</span></div>').join('') : '<p class="soft">No se registraron controles.</p>') + '</section>'
      + '<section class="card col g8"><div class="eyebrow">Compartir</div><textarea id="lv-msg" rows="2" maxlength="200" placeholder="Mensaje personal (opcional)" aria-label="Mensaje personal">' + esc(LV.msg || '') + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="lvWa" style="width:auto;padding:0 20px;min-height:48px;justify-content:center">Compartir por WhatsApp</button><button type="button" class="chip" data-a="lvCopy">Copiar mensaje</button></div></section>'
      + finForm() + '<button type="button" class="btn primary" data-a="lvSaveEnd"><span>Guardar resultado y cerrar</span>' + ph('check', 22) + '</button><button type="button" class="btn ghost" data-a="lvDropEnd">Cerrar sin guardar</button>';
    return out + '</div></div>';
  }
  const a = lvAna(), r = a.r, rn = r.meta ? 'Meta' : (r.n || 'Control'), tot = Date.now() - LV.start;
  if (LV.mode === 'stop') {
    const lg = LV.log[LV.log.length - 1], st = lg.delay >= 3 ? lvMinTxt(lg.delay) + ' atrasado' : lg.delay <= -3 ? lvMinTxt(lg.delay) + ' adelantado' : 'en horario', nx = a.r;
    out += lvStatCard('Llegada registrada', esc(lg.name), 'Llegaste a las ' + lvClock(lg.arr) + ' · ' + st, '', lg.delay >= 3)
      + lvStatCard('Detenido en este control', '<span id="lv-stop">' + lvHMS(Date.now() - LV.arrMs) + '</span>', 'Parada planificada: ' + (lg.stopPlan || 0) + ' min', '', false)
      + '<div class="grid2" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + lvTile('Tiempo del tramo', plDur(lg.moveMs / 60000)) + lvTile('Ritmo del tramo', lvKm1(lg.speed || 0) + ' km/h') + (a.brv ? lvTile('Margen al cierre', (lg.margClose < 0 ? '-' : '') + plDur(Math.abs(lg.margClose))) : '') + lvTile('Tiempo total', '<span id="lv-tot">' + lvHMS(tot) + '</span>') + '</div>'
      + '<section class="card col g4"><div class="eyebrow">Tramo que viene</div><p class="soft">' + esc(nx.meta ? 'Meta' : (nx.n || 'Control')) + ' · km ' + String(nx.km).replace('.', ',') + ' · ' + lvKm1(nx.km - lg.km) + ' km</p>' + (a.brv ? '<p class="muted" style="font-size:13px">Abre ' + lvClock(LV.start + nx.w.open * 60000) + ' · cierra ' + lvClock(LV.start + nx.w.close * 60000) + '</p>' : '') + '</section>'
      + (() => { const nu2 = plNutCalc(plFromEv(ev).d), nt2 = nu2 && nu2.rows[LV.idx + 1]; return nt2 ? '<section class="card col g4"><div class="eyebrow">Nutrición del tramo que viene</div><p style="font-size:16px;font-weight:600">' + nt2.g + ' g carbohidratos · ' + plL(nt2.ml) + ' · ' + nt2.na.toLocaleString('es-CL') + ' mg sodio</p><p class="muted" style="font-size:12px">Aprovecha esta parada para reabastecer agua y comer algo sólido.</p></section>' : ''; })()
      + '<button type="button" class="btn primary" data-a="lvDepart"><span>Marcar salida de este control</span>' + ph('arrow-right', 22) + '</button><p class="muted" style="font-size:13px">Toca esto cuando retomes la bicicleta: desde ahí se mide el tramo siguiente.</p><button type="button" class="btn ghost" data-a="lvUndo">Deshacer esta llegada</button>';
    return out + '</div></div>';
  }
  const st = lvStatus(a), age = Math.round((Date.now() - (LV.lastKmAt || LV.depMs)) / 60000), openD = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end);
  out += lvStatCard(st.ch, st.t, LV.lastKmAt && LV.lastKm > LV.depKm ? 'Según tu posición de hace <span id="lv-age">' + age + '</span> min' : 'Dime dónde estás para calcular tu avance', '', st.lv === 'warn');
  if (openD) out += '<section class="card col g8" style="text-align:center"><div class="eyebrow">Detención en curso</div><div class="num" id="lv-det" style="font-size:34px">' + lvHMS(Date.now() - openD.start) + '</div><button type="button" class="btn" data-a="lvEvEnd" style="justify-content:center"><span>Finalizar detención</span></button></section>';
  out += '<section class="card col g12"><div class="eyebrow">Próximo control: ' + esc(rn) + ' · km ' + String(r.km).replace('.', ',') + '</div><button type="button" class="btn primary" data-a="lvGps"' + (LV.gpsBusy ? ' disabled' : '') + '><span>' + (LV.gpsBusy ? 'Buscando señal GPS…' : 'Dime dónde estoy') + '</span>' + ph('flag', 22) + '</button>'
    + '<div class="col g8"><label for="lv-km" class="muted" style="font-size:13px">O ingresa el km de tu ciclocomputador</label><div class="row g8"><input class="field" id="lv-km" type="number" inputmode="decimal" min="0" step="0.1" placeholder="Km"><button type="button" class="chip" data-a="lvCalc">Calcular</button></div></div>'
    + (LV.posMsg ? '<p class="soft" style="font-size:13px">' + esc(LV.posMsg) + '</p>' : '') + '<button type="button" class="btn" data-a="lvArrive" style="justify-content:center"><span>Llegué a ' + esc(rn) + '</span></button><p class="muted" style="font-size:12px">Úsalo cuando estés en el control, aunque el km del GPS no coincida exactamente.</p></section>';
  out += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + lvTile('Km recorridos', lvKm1(a.km)) + lvTile('Faltan al control', lvKm1(a.rem) + ' km') + lvTile('Ritmo del tramo', a.avg ? lvKm1(a.avg) + ' km/h' : '—') + lvTile('Ritmo total', a.avgAll ? lvKm1(a.avgAll) + ' km/h' : '—')
    + lvTile('Llegada estimada', lvClock(a.etaMs) + (a.wait ? '*' : '')) + lvTile('Programa', lvClock(LV.start + r.rec * 60000)) + (a.brv ? lvTile('Cierra', lvClock(LV.start + r.w.close * 60000)) + lvTile('Margen al cierre', (a.marg < 0 ? '-' : '') + plDur(Math.abs(a.marg))) : '') + lvTile('Tiempo total', '<span id="lv-tot">' + lvHMS(tot) + '</span>') + '</div>';
  if (a.wait) out += '<p class="muted" style="font-size:12px">* Llegarías antes de que abra el control: esperas hasta la apertura.</p>';
  const nu = plNutCalc(plFromEv(ev).d), nt = nu && nu.rows[LV.idx];
  if (nt) out += '<section class="card col g4"><div class="eyebrow">Nutrición de este tramo</div><p style="font-size:16px;font-weight:600">' + nt.g + ' g carbohidratos · ' + plL(nt.ml) + ' · ' + nt.na.toLocaleString('es-CL') + ' mg sodio</p>' + (nt.cnt ? '<p class="soft" style="font-size:14px">' + [nt.cnt.drink ? nt.cnt.drink + (nt.cnt.drink === 1 ? ' bidón' : ' bidones') : '', nt.cnt.gel ? nt.cnt.gel + (nt.cnt.gel === 1 ? ' gel' : ' geles') : '', nt.cnt.bar ? nt.cnt.bar + (nt.cnt.bar === 1 ? ' barra' : ' barras') : ''].filter(Boolean).join(' · ') + '</p>' : '') + '<p class="muted" style="font-size:12px">Para todo el tramo hasta ' + esc(nt.name.split(' → ')[1]) + '.</p></section>';
  out += '<section class="card col g8"><div class="eyebrow">Registrar algo</div><select class="field" id="lv-evt" aria-label="Tipo de registro"><option value="detencion">Detención (pinchazo, baño, mecánica)</option><option value="botellas">Botellas / hidratación</option><option value="comida">Comida extra</option><option value="sales">Sales / electrolitos</option><option value="sensacion">Sensación</option><option value="otro">Otro</option></select><input class="field" id="lv-evd" type="text" maxlength="80" placeholder="Detalle (opcional)" aria-label="Detalle"><button type="button" class="btn" data-a="lvEv" style="justify-content:center"><span>Registrar</span></button><p class="muted" style="font-size:12px">La detención pausa el cálculo del ritmo. El resto solo queda anotado con la hora.</p></section>';
  out += '<section class="card col g8"><div class="eyebrow">Compartir avance</div><textarea id="lv-msg" rows="2" maxlength="200" placeholder="Mensaje personal (opcional)" aria-label="Mensaje personal">' + esc(LV.msg || '') + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="lvWa" style="width:auto;padding:0 20px;min-height:48px;justify-content:center">Compartir por WhatsApp</button><button type="button" class="chip" data-a="lvCopy">Copiar mensaje</button></div><p class="muted" style="font-size:12px">El mensaje dice tu km y tu próximo control, no tu ubicación exacta.</p></section>';
  if ((LV.rec || []).length) out += '<details class="card"><summary style="font-weight:600;min-height:44px;display:flex;align-items:center">Eventos registrados (' + LV.rec.length + ')</summary>' + LV.rec.map((e) => '<div class="mrow"><div class="col grow g4"><span style="font-weight:600">' + ({ detencion: 'Detención', botellas: 'Botellas', comida: 'Comida extra', sales: 'Sales', sensacion: 'Sensación', otro: 'Otro' }[e.type] || 'Otro') + ' · ' + lvClock(e.start) + '</span><span class="muted" style="font-size:13px">' + esc(e.detail || '') + (e.type === 'detencion' && e.end ? ' · ' + lvHMS(e.end - e.start) : '') + '</span></div></div>').join('') + '</details>';
  const lvSafe = '<button type="button" class="btn primary" data-a="lvEndNo" style="justify-content:center;min-height:60px"><span>Seguir en el evento</span></button>';
  out += LV.confirmEnd === 1 ? '<section class="card col g12" role="alertdialog" aria-label="Terminar el evento: paso 1 de 2" style="border:2px solid var(--warn)"><div class="eyebrow">Terminar el evento · paso 1 de 2</div><p style="font-size:17px;font-weight:700;line-height:1.3">¿Quieres dejar de registrar este evento?</p><p class="soft" style="font-size:14px">Si sigues, tendrás que confirmar una vez más.</p>' + lvSafe + '<button type="button" class="chip" data-a="lvEndYes" style="min-height:56px;justify-content:center;border-color:var(--warn);font-weight:700">Quiero terminar el evento</button></section>'
    : LV.confirmEnd === 2 ? '<section class="card col g12" role="alertdialog" aria-label="Terminar el evento: paso 2 de 2" style="border:2px solid var(--warn)"><div class="eyebrow">Terminar el evento · paso 2 de 2</div><p style="font-size:17px;font-weight:700;line-height:1.3">El evento se cerrará y no podrás retomarlo.</p><p class="soft" style="font-size:14px">Tus controles registrados quedarán guardados.</p>' + lvSafe + '<button type="button" class="chip" data-a="lvEndFinal" style="min-height:56px;justify-content:center;border-color:var(--warn);font-weight:700">Terminar el evento ahora</button></section>'
    : '<button type="button" class="btn ghost" data-a="lvEnd">Terminar el evento aquí</button>';
  return out + '</div></div>';
}
function lvMsg(m) { if (LV) { LV.posMsg = m; LV.gpsBusy = false; lvSave(); render(); } }
function lvSetKm(km) { LV.lastKm = Math.max(0, Math.min(km, Number(LV.ev.km))); LV.lastKmAt = Date.now(); }
Object.assign(ACT, {
  lvStart(v) {
    if (LV && LV.ev.id !== v) { say('Ya tienes un evento en curso. Termínalo o ciérralo antes de iniciar otro.'); return; }
    if (LV) { UI.liveOpen = true; render(); return; }
    const e = (ST.myEvents || []).find((x) => x.id === v); if (!e) return; const d = plFromEv(e).d; if (!plCalc(d)) { say('Completa la distancia y tu velocidad media para iniciar.'); return; }
    LV = { ev: { id: e.id, name: e.name, date: e.date, start: e.start, kind: e.kind, km: e.km, speed: e.speed, stop: e.stop, track: e.track || null, ctl: e.ctl || [], nut: e.nut || null, safe: e.safe || null }, mode: 'pre', start: null, idx: 0, depMs: null, depKm: 0, lastKm: 0, lastKmAt: null, log: [], rec: [], msg: '', posMsg: '' };
    UI.pl = null; UI.liveOpen = true; lvSave(); render(); window.scrollTo(0, 0);
  },
  lvOpen() { UI.liveOpen = true; UI.pl = null; render(); },
  lvHide() { LV.confirmEnd = 0; UI.liveOpen = false; render(); },
  lvGo() { lvGo(0); },
  lvGoAgo() { const n = Number((document.getElementById('lv-ago') || {}).value); if (!(n >= 0 && n <= 600)) { say('Indica los minutos entre 0 y 600.'); return; } lvGo(n); },
  lvDrop() { LV = null; lvSave(); UI.liveOpen = false; render(); },
  lvDropEnd() { LV = null; lvSave(); UI.liveOpen = false; render(); },
  lvCalc() { const raw = String((document.getElementById('lv-km') || {}).value || '').replace(',', '.'), k = parseFloat(raw); if (!(k >= 0) || k > Number(LV.ev.km)) { say('Ingresa un km entre 0 y ' + LV.ev.km + '.'); return; } if (k < LV.depKm - 1) { say('Ese km queda antes del último control. Revisa el valor.'); return; } lvSetKm(k); LV.posMsg = 'Posición manual: km ' + lvKm1(k) + '.'; lvSave(); render(); },
  lvGps() {
    if (!navigator.geolocation) { lvMsg('Este teléfono no permite usar el GPS desde la app. Ingresa el km a mano.'); return; }
    if (!LV.ev.track) { lvMsg('Este evento no tiene recorrido cargado. Ingresa el km a mano.'); return; }
    LV.gpsBusy = true; render();
    navigator.geolocation.getCurrentPosition((pos) => {
      if (!LV) return; const hrs = (Date.now() - (LV.lastKmAt || LV.depMs)) / 3600000, p = lvProject(LV.ev.track, pos.coords.latitude, pos.coords.longitude, Math.max(LV.lastKm, LV.depKm), Math.max(30, (hrs + 1) * 45));
      if (!p) { lvMsg('No encontré tu posición en el recorrido. Ingresa el km a mano.'); return; }
      if (p.dist > 1000) { lvMsg('Estás a ' + Math.round(p.dist) + ' m de la ruta, demasiado lejos para calcular el km. Ingresa el km a mano.'); return; }
      lvSetKm(p.km); lvMsg('GPS: km ' + lvKm1(p.km) + ' · a ' + Math.round(p.dist) + ' m de la ruta · precisión ±' + Math.round(pos.coords.accuracy || 0) + ' m.');
    }, (err) => { lvMsg(err && err.code === 1 ? 'No diste permiso de ubicación. Actívalo en el navegador o ingresa el km a mano.' : 'No pude obtener el GPS. Reintenta al aire libre o ingresa el km a mano.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 20000 });
  },
  lvArrive() {
    const now = Date.now(), a = lvAna(), r = a.r, op = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end); if (op) op.end = now;
    const mov = (now - LV.depMs) - lvPaused(LV.depMs, now), dist = r.km - LV.depKm, el = (now - LV.start) / 60000;
    LV.log.push({ i: LV.idx, name: r.meta ? 'Meta' : (r.n || 'Control'), km: r.km, meta: !!r.meta, arr: now, dep: null, depMs: LV.depMs, depKm: LV.depKm, moveMs: mov, speed: mov > 0 ? dist / (mov / 3600000) : 0, margClose: a.brv ? r.w.close - el : null, delay: el - lvPlanAt(a.c, a.v, r.km), stopPlan: r.stop });
    LV.arrMs = now; LV.lastKm = r.km; LV.lastKmAt = now; LV.posMsg = '';
    if (r.meta) { LV.mode = 'fin'; LV.end = now; } else LV.mode = 'stop';
    lvSave(); render(); window.scrollTo(0, 0);
  },
  lvDepart() { const now = Date.now(), lg = LV.log[LV.log.length - 1]; lg.dep = now; LV.idx = lg.i + 1; LV.depMs = now; LV.depKm = lg.km; LV.lastKm = lg.km; LV.lastKmAt = now; LV.mode = 'ride'; LV.posMsg = ''; lvSave(); render(); window.scrollTo(0, 0); },
  lvUndo() { const lg = LV.log.pop(); if (!lg) return; LV.idx = lg.i; LV.depMs = lg.depMs; LV.depKm = lg.depKm; LV.lastKm = lg.depKm; LV.lastKmAt = lg.depMs; LV.mode = 'ride'; LV.end = null; lvSave(); render(); },
  lvEv() { const t = (document.getElementById('lv-evt') || {}).value || 'otro', d = String((document.getElementById('lv-evd') || {}).value || '').slice(0, 80), now = Date.now(); LV.rec = LV.rec || []; if (t === 'detencion') { if (LV.rec.some((e) => e.type === 'detencion' && !e.end)) { say('Ya hay una detención en curso.'); return; } LV.rec.push({ type: t, detail: d, start: now, end: null }); } else LV.rec.push({ type: t, detail: d, start: now, end: now }); lvSave(); render(); },
  lvEvEnd() { const op = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end); if (op) op.end = Date.now(); lvSave(); render(); },
  lvEnd() { LV.confirmEnd = 1; render(); },
  lvEndNo() { LV.confirmEnd = 0; render(); },
  lvEndYes() { LV.confirmEnd = 2; render(); },
  lvEndFinal() { if (LV.confirmEnd !== 2) return; const now = Date.now(), op = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end); if (op) op.end = now; LV.confirmEnd = 0; LV.mode = 'fin'; LV.end = now; lvSave(); render(); window.scrollTo(0, 0); },
  lvWa() { const t = lvShareText(); try { window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener'); } catch (e) { say('No pude abrir WhatsApp. Usa Copiar mensaje.'); } },
  async lvCopy() { const t = lvShareText(); try { await navigator.clipboard.writeText(t); say('Mensaje copiado.', 'ok'); } catch (e) { say('No pude copiar. Mantén presionado este mensaje para copiarlo: ' + t); } },
  async lvSaveEnd() {
    const e = (ST.myEvents || []).find((x) => x.id === LV.ev.id); if (!e || !ST.user) { LV = null; lvSave(); UI.liveOpen = false; render(); return; }
    const last = LV.log[LV.log.length - 1], res = { start: LV.start, end: LV.end, done: !!(last && last.meta), controls: LV.log.map((x) => ({ n: x.name, km: x.km, arr: Math.round((x.arr - LV.start) / 60000), delay: Math.round(x.delay) })), stops: (LV.rec || []).filter((x) => x.type === 'detencion').length };
    const data = { name: e.name, date: e.date, start: e.start, kind: e.kind, km: e.km, speed: e.speed, stop: e.stop || 0, track: e.track || null, ctl: e.ctl || [], nut: e.nut || null, safe: e.safe || null, result: res, updatedAt: Date.now() };
    UI.busy = true; try { await be.saveEvent(ST.user.uid, e.id, data); LV = null; lvSave(); UI.liveOpen = false; say('Resultado guardado en el evento.', 'ok'); } catch (er) { say(friendly(er)); } UI.busy = false; render();
  }
});
async function lvWake() { try { if (navigator.wakeLock) LV.wl = await navigator.wakeLock.request('screen'); } catch (e) { /* sin wake lock */ } }
function lvGo(ago) { const now = Date.now(); LV.start = now - ago * 60000; LV.mode = 'ride'; LV.depMs = LV.start; LV.depKm = 0; LV.lastKm = 0; LV.lastKmAt = now; LV.posMsg = ''; lvSave(); render(); window.scrollTo(0, 0); lvWake(); }
setInterval(() => {
  if (!LV || !UI.liveOpen || LV.mode === 'pre' || LV.mode === 'fin') return; const q = (id) => document.getElementById(id), now = Date.now();
  if (q('lv-tot')) q('lv-tot').textContent = lvHMS(now - LV.start);
  if (q('lv-stop') && LV.arrMs) q('lv-stop').textContent = lvHMS(now - LV.arrMs);
  const op = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end); if (q('lv-det') && op) q('lv-det').textContent = lvHMS(now - op.start);
  if (q('lv-age')) q('lv-age').textContent = Math.round((now - (LV.lastKmAt || LV.depMs)) / 60000);
}, 1000);
document.addEventListener('input', (e) => { if (LV && e.target && e.target.id === 'lv-msg') { LV.msg = e.target.value; lvSave(); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && LV && UI.liveOpen && LV.mode !== 'pre' && LV.mode !== 'fin') { lvWake(); render(); } });

/* ====================================================================
   Capa propia de Camino Ruta (no viene de Camino)
   ==================================================================== */

/* ---------- Cierre del evento: formulario y registro en Camino ---------- */
const HEAT = ['Frío', 'Templado', 'Caluroso', 'Muy caluroso'], CARBS = ['No', 'Parcial', 'Sí'], HYDRA = ['Poca', 'Normal', 'Bastante'], ENERGY = ['Baja', 'Normal', 'Alta'];
const FIN_KINDS = [['ruta', 'Ruta'], ['gravel', 'Gravel'], ['mtb', 'MTB']];
const KINDKEY = 'camino-ruta-kind-v1', PENDKEY = 'camino-ruta-pend-v1';
const lastKind = () => { try { const k = localStorage.getItem(KINDKEY); return k === 'gravel' || k === 'mtb' ? k : 'ruta'; } catch (e) { return 'ruta'; } };
const finGet = () => { LV.fin = LV.fin || { reg: true, kind: lastKind(), rpe: null, heat: null, carbs: null, hydra: null, energy: null, gi: null, note: '' }; return LV.fin; };

/* Reparte la salida en los dias del calendario que cruza: minutos en movimiento (sin paradas ni detenciones) y km por dia. */
function ridePartsByDay() {
  if (!LV || !LV.start || !LV.end) return [];
  const S = LV.start, E = LV.end, last = LV.log[LV.log.length - 1];
  const endKm = last && last.meta ? Number(LV.ev.km) : Math.max(LV.lastKm || 0, last ? last.km : 0);
  const pts = [[S, 0]]; LV.log.forEach((x) => { pts.push([x.arr, x.km]); if (x.dep) pts.push([x.dep, x.km]); }); pts.push([E, endKm]); pts.sort((a, b) => a[0] - b[0]);
  const kmAt = (t) => { if (t <= pts[0][0]) return 0; for (let i = 1; i < pts.length; i++) { if (t <= pts[i][0]) { const a = pts[i - 1], b = pts[i], f = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return a[1] + (b[1] - a[1]) * f; } } return endKm; };
  const stops = []; LV.log.forEach((x) => stops.push([x.arr, x.dep || E])); (LV.rec || []).forEach((x) => { if (x.type === 'detencion') stops.push([x.start, x.end || E]); });
  const stopMs = (a, b) => {
    const iv = stops.map((s) => [Math.max(s[0], a), Math.min(s[1], b)]).filter((s) => s[1] > s[0]).sort((p, q) => p[0] - q[0]); let tot = 0, cur = null;
    iv.forEach((s) => { if (!cur) cur = s.slice(); else if (s[0] <= cur[1]) cur[1] = Math.max(cur[1], s[1]); else { tot += cur[1] - cur[0]; cur = s.slice(); } });
    if (cur) tot += cur[1] - cur[0]; return tot;
  };
  const out = [], d0 = new Date(S); d0.setHours(0, 0, 0, 0);
  for (let d = new Date(d0); d.getTime() < E; d.setDate(d.getDate() + 1)) {
    const nx = new Date(d); nx.setDate(nx.getDate() + 1);
    const a = Math.max(S, d.getTime()), b = Math.min(E, nx.getTime()); if (b <= a) continue;
    const km = kmAt(b) - kmAt(a), min = Math.round(((b - a) - stopMs(a, b)) / 60000);
    if (min < 5 && km < 0.5) continue;
    out.push({ d: ymd(d), min: Math.max(0, min), km: Math.round(km * 10) / 10 });
  }
  return out;
}
function finForm() {
  const F = finGet(), parts = ridePartsByDay();
  const chips = (k, labels, cur, title, vals) => '<div class="col g8"><div style="font-weight:600">' + title + '</div><div class="chips" role="group" aria-label="' + title + '">' + labels.map((t, i) => { const v = vals ? vals[i] : i; return '<button type="button" class="chip" data-a="finSet" data-v="' + k + '|' + v + '" aria-pressed="' + (cur === v) + '">' + t + '</button>'; }).join('') + '</div></div>';
  let out = '<section class="card col g12" aria-label="Registrar en Camino"><div class="eyebrow">Registrar en Camino</div>'
    + '<div class="col g8"><div class="chips" role="group" aria-label="Registrar esta salida en Camino"><button type="button" class="chip" data-a="finSet" data-v="reg|1" aria-pressed="' + !!F.reg + '">Registrar en Camino</button><button type="button" class="chip" data-a="finSet" data-v="reg|0" aria-pressed="' + !F.reg + '">Solo guardar el evento</button></div></div>';
  if (F.reg) {
    out += '<p class="soft" style="font-size:14px">Se agrega como actividad en tu día de Camino (Hoy y Datos), sin borrar lo que ya hayas anotado ese día.</p>'
      + (parts.length ? '<div class="col g4">' + parts.map((p) => { const d = parse(p.d); return '<div class="row between" style="border-top:1px solid var(--line);padding:8px 0"><span style="font-weight:600">' + cap(WD[d.getDay()]) + ' ' + d.getDate() + ' ' + FC_MES[d.getMonth()] + '</span><span class="muted" style="font-size:14px">' + plDur(p.min) + ' en movimiento · ' + String(p.km).replace('.', ',') + ' km</span></div>'; }).join('') + '<p class="muted" style="font-size:12px">Los kilómetros por día se estiman entre los controles registrados. Las paradas no cuentan como tiempo de esfuerzo.</p></div>' : '<p class="soft" style="font-size:14px">No hay tiempo suficiente para registrar.</p>')
      + chips('kind', FIN_KINDS.map((x) => x[1]), F.kind, 'Tipo de salida', FIN_KINDS.map((x) => x[0]))
      + chips('rpe', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], F.rpe, 'Esfuerzo percibido (1 suave, 10 máximo)', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      + chips('heat', HEAT, F.heat, 'Calor')
      + chips('carbs', CARBS, F.carbs, '¿Cargaste carbohidratos antes o durante?')
      + chips('hydra', HYDRA, F.hydra, 'Hidratación')
      + chips('energy', ENERGY, F.energy, 'Energía')
      + chips('gi', ['Sí', 'No'], F.gi, '¿Molestias digestivas?', ['si', 'no'])
      + '<div class="col g8"><label for="fin-note" class="muted" style="font-size:13px">Comentario para tu coach (opcional)</label><textarea id="fin-note" rows="3" maxlength="400" placeholder="Cómo te sentiste, qué pasó en la ruta">' + esc(F.note || '') + '</textarea></div>'
      + '<p class="muted" style="font-size:12px">La carga, la aptitud y la fatiga se actualizan cuando la actividad de tu Garmin o Strava llega a intervals.icu. Camino cruza ambas fuentes.</p>';
  }
  return out + '</section>';
}
function buildCheckin(ex, p, P) {
  const base = ex || {}, c = Object.assign({}, base), S = { name: P.name, min: p.min, km: p.km, kind: P.kind };
  c.date = p.d; c.type = 'actividad'; c.ts = Date.now();
  let cm = typeof base.comment === 'string' ? base.comment : ''; if (P.note) cm = (cm ? cm + '\n' : '') + P.note; c.comment = cm.slice(0, 1000);
  if (!base.activity) { c.activity = S; c.rpe = P.rpe; c.heat = P.heat == null ? (base.heat == null ? null : base.heat) : P.heat; c.hard = null; c.hardInfo = null; c.skip = null; }
  else c.act2 = Object.assign({}, S, { rpe: P.rpe, heat: P.heat == null ? null : P.heat });
  if (P.fuel) c.fuel = Object.assign({}, base.fuel || {}, P.fuel);
  return c;
}
/* Escribe un check-in por dia, fusionando con el que ya exista. Si no se puede leer el dia (sin senal), queda pendiente. */
async function applyCheckins(P) {
  const res = { ok: 0, skip: [], pend: 0 };
  for (const p of P.parts) {
    if (p.done) continue;
    let ex = null; try { ex = await be.getCheckin(P.uid, p.d); } catch (e) { res.pend++; continue; }
    const same = (A) => A && A.name === P.name && Math.abs((A.km || 0) - p.km) < 0.15 && Math.abs((A.min || 0) - p.min) <= 1;
    if (ex && (same(ex.activity) || same(ex.act2))) { p.done = true; res.ok++; continue; }
    if (ex && ex.activity && ex.act2) { p.done = true; res.skip.push(p.d); continue; }
    try { await be.settle(be.saveCheckin(P.uid, buildCheckin(ex, p, P)), 8000); p.done = true; res.ok++; } catch (e) { res.err = e; res.pend++; }
  }
  return res;
}
const pendLoad = () => { try { const a = JSON.parse(localStorage.getItem(PENDKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
const pendSave = (a) => { try { if (a.length) localStorage.setItem(PENDKEY, JSON.stringify(a)); else localStorage.removeItem(PENDKEY); } catch (e) { /* sin almacenamiento */ } };
let flushing = false;
async function flushPend() {
  if (!ST.user || flushing) return; const all = pendLoad(); if (!all.some((p) => p.uid === ST.user.uid)) return;
  flushing = true; let done = 0;
  try { for (const P of all) { if (P.uid !== ST.user.uid) continue; const r = await applyCheckins(P); if (!r.pend) { P.finished = true; done++; } } } finally { flushing = false; }
  pendSave(all.filter((p) => !p.finished));
  if (done) say('Se registró en Camino la salida que había quedado pendiente.', 'ok');
}
window.addEventListener('online', () => { flushPend(); });

Object.assign(ACT, {
  finSet(v) {
    if (!LV) return; const F = finGet(), q = String(v).split('|'), k = q[0], x = q[1];
    if (k === 'reg') F.reg = x === '1';
    else if (k === 'kind') F.kind = x;
    else if (k === 'gi') F.gi = F.gi === x ? null : x;
    else { const n = Number(x); F[k] = F[k] === n ? null : n; }
    lvSave(); render();
  },
  async lvSaveEnd() {
    if (UI.busy || !LV || LV.mode !== 'fin') return;
    const F = finGet(), e = (ST.myEvents || []).find((x) => x.id === LV.ev.id);
    if (!e || !ST.user) { LV = null; lvSave(); UI.liveOpen = false; render(); return; }
    if (F.reg && !(F.rpe >= 1 && F.rpe <= 10)) { say('Indica tu esfuerzo de 1 a 10 para registrar la salida en Camino, o elige «Solo guardar el evento».'); return; }
    const parts = ridePartsByDay(), last = LV.log[LV.log.length - 1], uid = ST.user.uid;
    const km = last && last.meta ? Number(LV.ev.km) : Math.max(LV.lastKm || 0, last ? last.km : 0);
    const res = { start: LV.start, end: LV.end, done: !!(last && last.meta), controls: LV.log.map((x) => ({ n: x.name, km: x.km, arr: Math.round((x.arr - LV.start) / 60000), delay: Math.round(x.delay) })), stops: (LV.rec || []).filter((x) => x.type === 'detencion').length,
      km: Math.round(km * 10) / 10, min: parts.reduce((s, p) => s + p.min, 0), rpe: F.reg ? F.rpe : null, src: 'ruta', reg: !!F.reg,
      rec: (LV.rec || []).slice(0, 60).map((x) => ({ t: x.type, s: Math.round(x.start / 1000), e: x.end ? Math.round(x.end / 1000) : null, d: String(x.detail || '').slice(0, 80) })) };
    const ctl = (e.ctl || []).map((c) => { const lg = LV.log.find((x) => !x.meta && Number(x.km) === Number(c.km)); return lg ? Object.assign({}, c, { reg: lg.arr }) : c; });
    UI.busy = true; render();
    try {
      const mv = await be.settle(be.mergeEvent(uid, e.id, { result: res, ctl, updatedAt: Date.now() }), 8000);
      let note = mv === 'timeout' ? 'Resultado guardado en el teléfono; se sincroniza al volver la señal.' : 'Resultado guardado en el evento.';
      if (F.reg && parts.length) {
        const fuel = {}; ['carbs', 'hydra', 'energy'].forEach((k) => { if (F[k] != null) fuel[k] = F[k]; }); if (F.gi) fuel.gi = F.gi;
        const P = { uid, name: String(LV.ev.name || 'Evento').slice(0, 80), kind: F.kind, rpe: F.rpe, heat: F.heat, fuel: Object.keys(fuel).length ? fuel : null, note: String(F.note || '').trim(), parts: parts.map((p) => Object.assign({ done: false }, p)) };
        const r = await applyCheckins(P);
        if (r.pend) { const all = pendLoad(); all.push(P); pendSave(all); note += ' Falta registrar ' + r.pend + (r.pend === 1 ? ' día' : ' días') + ' en Camino: se reintenta solo cuando haya señal.'; }
        else note += ' Registrado en Camino.';
        if (r.skip.length) note += ' ' + r.skip.length + (r.skip.length === 1 ? ' día ya tenía' : ' días ya tenían') + ' dos sesiones anotadas y no se agregó.';
        try { localStorage.setItem(KINDKEY, F.kind); } catch (er) { /* sin almacenamiento */ }
      }
      LV = null; lvSave(); UI.liveOpen = false; UI.busy = false; say(note, 'ok'); return;
    } catch (er) { say(friendly(er)); }
    UI.busy = false; render();
  },
  async signIn() { try { await be.signIn(); } catch (e) { say(friendly(e)); } },
  async signOut() { try { await be.signOut(); } catch (e) { say(friendly(e)); } }
});
document.addEventListener('input', (e) => {
  const t = e.target; if (!t) return;
  if (t.id === 'fin-note' && LV) { finGet().note = t.value.slice(0, 400); lvSave(); return; }
  if (UI.pl && t.dataset && t.dataset.pl) plInput(t);
});

/* ---------- Pantalla, sesion y datos ---------- */
const loadingHtml = (t) => '<div class="inner"><div class="stack"><section class="card"><p class="soft">' + esc(t) + '</p></section></div></div>';
function loginHtml() {
  return '<div class="inner"><div class="stack">' + head('Planificar y modo en vivo', 'Camino Ruta') + msgBanner()
    + '<section class="card col g12"><p class="soft">Entra con la misma cuenta de Google que usas en Camino. Aquí planificas tu recorrido y llevas tu avance en vivo; al terminar, tu salida queda registrada en Camino.</p><button type="button" class="btn primary" data-a="signIn"><span>Entrar con Google</span></button></section></div></div>';
}
function rootHtml() {
  if (!ST.authDone) return loadingHtml('Abriendo…');
  if (!ST.user) return loginHtml();
  if (!ST.profLoaded) return loadingHtml('Cargando tu perfil…');
  return viewPlanificar() + '<div class="inner"><p class="muted" style="font-size:12px;text-align:center;padding:4px 0 24px">Camino Ruta v' + RUTA_VER + ' · <button type="button" class="chip" data-a="signOut" style="min-height:32px">Cerrar sesión</button></p></div>';
}
function render() {
  const top = document.getElementById('top'), view = document.getElementById('view'), nav = document.getElementById('nav'); if (!view) return;
  if (nav) nav.style.display = 'none';
  if (top) top.innerHTML = '<div class="inner row between" style="align-items:center;min-height:56px"><span class="eyebrow">Camino · Ruta</span><a class="chip" href="../" style="display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px">Abrir Camino</a></div>';
  view.innerHTML = rootHtml();
}
const softRender = () => { if (UI.pl) return; const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return; render(); };
let unW = [];
const stopWatch = () => { unW.forEach((f) => { try { f(); } catch (e) { /* ya cancelado */ } }); unW = []; };
async function loadBio(uid) { try { ST.bio = await be.getBio(uid); } catch (e) { ST.bio = null; } softRender(); }
be.onAuth((u) => {
  ST.authDone = true; ST.user = u; stopWatch(); ST.profile = null; ST.profLoaded = false; ST.myEvents = []; ST.evLoaded = false; ST.bio = null; UI.pl = null;
  if (u) {
    LV = lvLoad(); UI.liveOpen = !!(LV && LV.start);
    unW.push(be.watchProfile(u.uid, (p) => { ST.profile = p; ST.profLoaded = true; softRender(); }, () => { ST.profLoaded = true; softRender(); }));
    unW.push(be.watchEvents(u.uid, (rows) => { ST.myEvents = rows; ST.evLoaded = true; softRender(); }, () => { ST.evLoaded = true; softRender(); }));
    loadBio(u.uid); flushPend();
  } else LV = null;
  render();
});
document.addEventListener('click', (e) => { const t = e.target.closest('[data-a]'); if (!t || t.disabled) return; const fn = ACT[t.dataset.a]; if (fn) { try { const r = fn(t.dataset.v, t); if (r && r.catch) r.catch((er) => say(friendly(er))); } catch (er) { say(friendly(er)); } } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* sin service worker */ });
render();
