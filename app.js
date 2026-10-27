// Camino: app de seguimiento para atletas de GRNT y ZN.
// Atleta: Hoy (check-in), Ruta (plan, equipo, insignias). Coach: Cabina (atletas, solicitudes, notas).
// Los datos viven en Firestore (backend-firebase.js). Con ?demo=1 usa datos ficticios (backend-demo.js).

const DEMO = new URLSearchParams(location.search).has('demo');
const be = DEMO ? (await import('./backend-demo.js')).default : (await import('./backend-firebase.js')).default;

/* ---------- Constantes ---------- */
const PREFKEY = 'camino-prefs-v1';
const GOAL = '2026-12-08';
const KM_GOAL_DEFAULT = 2000;
const TEAMS = { grnt: 'GRNT', zn: 'ZN' };
const MOODS = ['Muy mal', 'Mal', 'Normal', 'Bien', 'Excelente'];
const SLEEPH = ['Menos de 5 h', '5 a 6 h', '6 a 7 h', '7 a 8 h', 'Más de 8 h'];
const SLEEPQ = ['Muy bien', 'Bien', 'Más o menos', 'Mal'];
const LEGS = ['Pesadas', 'Normales', 'Livianas'];
const STRESS = ['Bajo', 'Medio', 'Alto'];
const HEAT = ['Frío', 'Templado', 'Caluroso', 'Muy caluroso'];
const PREVT = ['Comida abundante', 'Alcohol', 'Trasnoche', 'Viaje o jornada larga', 'Enfermedad leve', 'Otro'];
const HARDT = ['Subida', 'Viento en contra', 'Ritmo alto o sprint', 'Terreno técnico', 'Calor', 'Otro'];
const HARDD = ['Menos de 5 min', '5 a 20 min', 'Más de 20 min'];
const HARDE = ['Con fuerzas', 'Justo', 'Muy exigido'];
const ZONES = ['Cuello', 'Hombro', 'Espalda', 'Cadera', 'Muslo', 'Rodilla', 'Pantorrilla', 'Pie', 'Mano o muñeca'];
const SIDES = ['Izquierdo', 'Derecho', 'Ambos'];
const LEVELS = ['Leve', 'Moderada', 'Fuerte'];
const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WDL = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const NUMERIC = { sleepH: 1, sleepQ: 1, legs: 1, stress: 1, rpe: 1, heat: 1, mood: 1 };
const TONES = [
  { id: 'auto', name: 'Auto', sub: 'Sigue el tema de tu dispositivo', sw: ['#F3F4F7', '#0F1115', '#C2410C', '#FF7A3D'] },
  { id: 'noche', name: 'Noche', sub: 'Oscuro con naranja', sw: ['#0F1115', '#171A21', '#FF7A3D', '#4ADE9B'] },
  { id: 'tierra', name: 'Tierra', sub: 'Oliva y ocre, de gravel', sw: ['#12140E', '#1C1F15', '#E0A93B', '#8EDB8F'] },
  { id: 'dia', name: 'Día', sub: 'Claro, para leer al sol', sw: ['#F3F4F7', '#FFFFFF', '#C2410C', '#0B7A4B'] }
];
// Plan base de ejemplo: se reemplazará por el plan real de intervals.icu.
const PLAN = { 1: { name: 'Rodillo Z2', min: 60, km: 28, load: 52 }, 2: { name: 'Rodillo suave', min: 45, km: 18, load: 34 }, 3: null, 4: { name: 'Intervalos sweet spot', min: 80, km: 32, load: 78 }, 5: { name: 'Z2 corto', min: 40, km: 16, load: 30 }, 6: { name: 'Rodaje largo', min: 180, km: 85, load: 150 }, 0: { name: 'Rodaje suave', min: 70, km: 30, load: 48 } };
const ICONS = {
  racha: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1 1 1.5 2 1.5C11 8 11 5.5 12 3z"></path>',
  sueno: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path>',
  semana: '<rect x="4" y="5" width="16" height="15" rx="3"></rect><path d="M4 10h16M9 3v4M15 3v4"></path>',
  cinco: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"></path>'
};

/* ---------- Fechas y textos ---------- */
const pad = (n) => (n < 10 ? '0' + n : '' + n);
const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
const off = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hhmm = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
function relTime(ts) {
  const n = diffDays(ymd(new Date(ts)), off(0));
  if (n === 0) return 'hoy, ' + hhmm(ts);
  if (n === 1) return 'ayer, ' + hhmm(ts);
  return 'hace ' + n + ' días';
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const at = (arr, i) => String(arr[i] == null ? '' : arr[i]);
const firstName = (n) => String(n || '').split(' ')[0] || 'Atleta';

/* ---------- Preferencias locales (solo tono) ---------- */
let PREF = { tone: 'auto' };
try { const r = localStorage.getItem(PREFKEY); if (r) PREF = Object.assign(PREF, JSON.parse(r)); } catch (e) {}
if (!['auto', 'noche', 'tierra', 'dia'].includes(PREF.tone)) PREF.tone = 'auto'; /* tonos retirados vuelven a Auto */
const savePref = () => { try { localStorage.setItem(PREFKEY, JSON.stringify(PREF)); } catch (e) {} };

/* ---------- Estado ---------- */
const ST = { ready: false, user: null, profile: null, myPlan: null, myHist: null, athPlan: {}, athHist: {}, myCk: [], myNotes: [], teamKm: {}, teamMeta: {}, athletes: [], athCk: {}, athNotes: {}, pending: [], error: '' };
const UI = { view: 'hoy', lastView: null, flow: null, feedback: null, story: null, sel: null, reply: { id: null, text: '' }, draft: { comment: '', prevText: '' }, justSaved: null, busy: false, metaTeam: 'zn', metaDraft: null, planOpen: false, planDraft: null, histOpen: false, histDraft: null, asId: null, msg: '', msgKind: 'err' };
let ownUnsubs = [], dataUnsubs = [], dataKey = '', athSubs = {};

const isCoach = () => !!(ST.profile && ST.profile.role === 'coach');
const myTeam = () => (ST.profile && ST.profile.team) || null;

function meA() {
  let list = ST.myCk;
  if (UI.justSaved && !list.some((c) => c.date === UI.justSaved.date)) list = [UI.justSaved].concat(list);
  return { id: ST.user ? ST.user.uid : '', name: ST.user ? ST.user.name : '', first: firstName(ST.user && ST.user.name), checkins: list, notes: ST.myNotes, tsb: [] };
}
function athleteObjs() {
  return ST.athletes.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))).map((p) => ({ id: p.id, name: p.name, first: firstName(p.name), team: p.team, checkins: ST.athCk[p.id] || [], notes: ST.athNotes[p.id] || [], tsb: histDays(ST.athHist[p.id]).slice(-7).map((x) => Math.round(x.ctl - x.atl)) }));
}

/* ---------- Cálculos ---------- */
const latest = (a) => { let l = null; a.checkins.forEach((c) => { if (!l || c.date > l.date || (c.date === l.date && c.ts > l.ts)) l = c; }); return l; };
const on = (a, date) => { for (let i = 0; i < a.checkins.length; i++) if (a.checkins[i].date === date) return a.checkins[i]; return null; };
// Plan del atleta: lo carga su coach en Firestore (users/{uid}/plan/current). En modo demo, sin plan cargado, se usa el ejemplo.
const planFor = (date) => {
  const pl = ST.myPlan;
  if (pl && pl.sessions) return pl.sessions[date] || null;
  return DEMO && !pl ? PLAN[parse(date).getDay()] : null;
};
const dayNote = (date) => { const p = planFor(date), pl = ST.myPlan; return (p && p.note) || (pl && pl.notes && pl.notes[date]) || ''; };
const minText = (m) => (m >= 120 ? (Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + m % 60 + ' min' : '')) : m + ' min');
const planDesc = (p) => p.name + (p.min ? ' · ' + minText(p.min) : '') + (p.km ? ' · ' + p.km + ' km' : '');
function score(c) {
  const p = [];
  if (c.mood) p.push((c.mood - 1) / 4);
  if (c.sleepQ) p.push((4 - c.sleepQ) / 3);
  if (c.legs != null) p.push(c.legs / 2);
  if (c.stress != null) p.push((2 - c.stress) / 2);
  if (!p.length) return null;
  return Math.round(100 * p.reduce((x, y) => x + y, 0) / p.length);
}
function band(sc) {
  if (sc == null) return { k: 'none', label: 'Sin datos', color: 'var(--muted)' };
  if (sc >= 70) return { k: 'good', label: 'Listo para rodar', color: 'var(--good)' };
  if (sc >= 50) return { k: 'warn', label: 'Ve con calma', color: 'var(--warn)' };
  return { k: 'bad', label: 'Hoy toca cuidarte', color: 'var(--bad)' };
}
function summaryText(c, b) {
  const bits = [];
  if (c.sleepQ) bits.push(c.sleepQ <= 2 ? 'dormiste bien' : 'dormiste menos de lo ideal');
  if (c.legs != null) bits.push(c.legs === 0 ? 'tus piernas vienen pesadas' : (c.legs === 2 ? 'tus piernas vienen livianas' : 'tus piernas vienen estables'));
  let s = bits.length ? cap(bits.join(' y ')) + '.' : 'Según cómo te sentiste en tu último check-in.';
  const p = planFor(off(0));
  if (b.k === 'good' && p) s += ' Hoy toca ' + p.name.toLowerCase() + '.';
  else if (b.k === 'good') s += ' Hoy es día de descanso.';
  else if (b.k === 'warn') s += ' Rueda con calma y cuéntale a tu coach cómo vas.';
  else if (b.k === 'bad') s += ' Avísale a tu coach y baja la intensidad.';
  return s;
}
function streak(a) {
  const set = {}; a.checkins.forEach((c) => { set[c.date] = 1; });
  let n = 0; const start = set[off(0)] ? 0 : -1;
  for (let i = start; i > -500; i--) { if (set[off(i)]) n++; else break; }
  return { n, today: !!set[off(0)] };
}
function weekInfo(a) {
  const t = parse(off(0)), mon = (t.getDay() + 6) % 7, days = []; let planned = 0, done = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(t); d.setDate(t.getDate() - mon + i); d.setHours(12, 0, 0, 0);
    const date = ymd(d), p = planFor(date), c = on(a, date), isDone = !!(c && c.type === 'actividad');
    if (p) planned++;
    if (p && isDone) done++;
    days.push({ date, p, done: isDone, today: date === off(0), wd: parse(date).getDay() });
  }
  return { days, planned, done };
}
function badges(a) {
  const st = streak(a).n; let sg = 0;
  for (let k = -6; k <= 0; k++) { const c = on(a, off(k)); if (c && c.sleepH != null && c.sleepH >= 2 && c.sleepQ && c.sleepQ <= 2) sg++; }
  const wk = weekInfo(a), acts = a.checkins.filter((x) => x.type === 'actividad' && x.date >= off(-13)).length;
  return [
    { id: 'racha', label: '7 días seguidos', earned: st >= 7, prog: Math.min(st, 7) + ' de 7 días' },
    { id: 'sueno', label: 'Sueño parejo', earned: sg >= 5, prog: sg + ' de 5 noches' },
    { id: 'semana', label: 'Semana completa', earned: wk.planned > 0 && wk.done >= wk.planned, prog: wk.done + ' de ' + wk.planned + ' sesiones' },
    { id: 'cinco', label: 'Cinco actividades', earned: acts >= 5, prog: Math.min(acts, 5) + ' de 5 en 14 días' }
  ];
}
const series = (a) => { const o = []; for (let k = -6; k <= 0; k++) { const c = on(a, off(k)); o.push(c ? c.mood : null); } return o; };
const lastNote = (a) => (a.notes.length ? a.notes[a.notes.length - 1] : null);
function statusOf(a) {
  const l = latest(a), reasons = [];
  if (!l) return { k: 'none', reasons: ['Aún sin check-ins'] };
  const gap = diffDays(l.date, off(0));
  if (gap >= 2) return { k: 'none', reasons: ['Sin check-in hace ' + gap + ' días'] };
  const s = series(a).filter((v) => v != null); let warn = false;
  if (l.mood <= 2) { warn = true; reasons.push('Ánimo bajo en el último check-in'); }
  if (l.pain && l.pain.level !== 'Leve') { warn = true; reasons.push('Molestia ' + String(l.pain.level || '').toLowerCase() + ': ' + String(l.pain.zone || '').toLowerCase()); }
  else if (l.pain) reasons.push('Molestia leve: ' + String(l.pain.zone || '').toLowerCase());
  if (s.length >= 4 && s[s.length - 1] < s[s.length - 4] - 1) { warn = true; reasons.push('Bienestar a la baja en los últimos días'); }
  if (a.tsb && a.tsb.length) { const ts = a.tsb[a.tsb.length - 1]; if (ts <= -25) { warn = true; reasons.push('Forma (TSB) muy negativa: ' + ts); } }
  return { k: warn ? 'warn' : 'ok', reasons };
}
function needsReply(a) {
  if (statusOf(a).k === 'ok') return false;
  const l = latest(a), n = lastNote(a);
  if (!l) return false;
  if (!n) return true;
  return n.at < (l ? l.ts : 0);
}
function insightFor(c) {
  if (c.pain && c.pain.level !== 'Leve') return 'Gracias por avisar de la molestia. Tu coach lo verá hoy. Mientras tanto, baja la intensidad y cuida esa zona. Si el dolor aumenta o te limita, consulta a un profesional de salud.';
  if (c.mood <= 2) return 'Gracias por contarlo. Tu coach lo verá hoy y ajustará con calma: descansar también es entrenar.';
  if (c.type === 'actividad' && c.rpe && c.rpe >= 8) return 'Fue una sesión exigente. Tu coach la revisará y planificará bien tu recuperación.';
  if (c.mood === 3) return 'Anotado. Tu semana sigue estable y vas al día con el plan.';
  return 'Qué buena señal. Si el plan lo permite, es un buen día para rodar con ganas.';
}
function goalData() {
  const pl = ST.myPlan;
  if (pl && pl.goal && pl.goal.date) return { name: String(pl.goal.name || 'Tu meta'), date: pl.goal.date, dateText: String(pl.goal.dateText || pl.goal.date), detail: String(pl.goal.detail || '') };
  if (DEMO && !pl) return { name: 'Vuelta Santuario Lo Vasquez', date: GOAL, dateText: '8 de diciembre', detail: 'salida con el equipo' };
  return null;
}
function goalInfo() {
  const gd = goalData(); if (!gd) return null;
  const days = diffDays(off(0), gd.date), weeks = Math.max(0, Math.ceil(days / 7));
  return Object.assign({}, gd, { days, weeks, done: days < 0, phase: days < 0 ? 'meta' : (weeks > 2 ? 'construccion' : 'afinamiento') });
}
function phaseList(g) {
  const pl = ST.myPlan;
  if (pl && Array.isArray(pl.phases) && pl.phases.length) {
    let nowSet = false;
    const list = pl.phases.map((p) => { let st = 'done'; if (!(g.done || (p.to && p.to < off(0)))) { st = nowSet ? 'next' : 'now'; nowSet = true; } return { n: String(p.n || ''), s: String(p.s || ''), st }; });
    list.push({ n: g.name, s: g.dateText + (g.detail ? ' · ' + g.detail : ''), st: g.done ? 'done' : 'goal' });
    return list;
  }
  return [
    { n: 'Base', s: '8 semanas · completada', st: 'done' },
    { n: 'Construcción', s: g.phase === 'construccion' ? 'Quedan ' + Math.max(g.weeks - 2, 1) + ' semanas · más volumen, con descansos planificados' : 'Completada', st: g.phase === 'construccion' ? 'now' : 'done' },
    { n: 'Afinamiento', s: g.phase === 'afinamiento' ? 'Quedan ' + Math.max(g.weeks, 1) + ' semanas · menos volumen y piernas frescas' : (g.phase === 'meta' ? 'Completado' : '2 semanas · menos volumen y piernas frescas'), st: g.phase === 'afinamiento' ? 'now' : (g.phase === 'meta' ? 'done' : 'next') },
    { n: g.name, s: g.dateText + (g.detail ? ' · ' + g.detail : ''), st: g.phase === 'meta' ? 'done' : 'goal' }
  ];
}
const monthKey = () => off(0).slice(0, 7);
function teamTotals(team) {
  const rows = (ST.teamKm[team] || []).filter((r) => r.month === monthKey());
  const km = rows.reduce((s, r) => s + (Number(r.km) || 0), 0);
  const meta = ST.teamMeta[team] || {};
  return { km: Math.round(km), goal: Number(meta.goal) || KM_GOAL_DEFAULT, hito: meta.hito || '', members: rows.length };
}
function myMonthKm(extra) {
  const m = monthKey(); const base = ST.myCk.filter((c) => c.date.slice(0, 7) === m && c.date !== off(0)).reduce((s, c) => s + ((c.activity && c.activity.km) || 0), 0);
  return Math.round(base + (extra || 0));
}

/* ---------- Gráficos ---------- */
const xAt = (i) => 12 + i * 46;
const moodY = (v) => 68 - (v - 1) * 14;
function spark(a) {
  const s = series(a), pts = []; let last = null;
  s.forEach((v, i) => { if (v != null) { pts.push(xAt(i) + ',' + moodY(v)); last = [xAt(i), moodY(v)]; } });
  return '<svg width="320" height="84" viewBox="0 0 300 84" role="img" aria-label="Línea del ánimo de los últimos siete días"><line class="ln-g" x1="12" y1="68" x2="288" y2="68" stroke-width="1"></line><line class="ln-g" x1="12" y1="40" x2="288" y2="40" stroke-width="1" stroke-dasharray="3 4"></line>'
    + (pts.length > 1 ? '<polyline class="ln-a" points="' + pts.join(' ') + '" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>' : '')
    + (last ? '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="6" fill="var(--accent)"></circle>' : '') + '</svg>';
}
function miniSpark(a) {
  const s = series(a), pts = [];
  s.forEach((v, i) => { if (v != null) pts.push((4 + i * 13.3).toFixed(1) + ',' + (28 - (v - 1) / 4 * 24).toFixed(1)); });
  return '<svg width="84" height="32" viewBox="0 0 84 32" aria-hidden="true">' + (pts.length > 1 ? '<polyline class="ln-a" points="' + pts.join(' ') + '" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>' : '') + '</svg>';
}
function dualChart(a) {
  const s = series(a), w = [];
  s.forEach((v, i) => { if (v != null) w.push(xAt(i) + ',' + (90 - (v - 1) / 4 * 70).toFixed(1)); });
  const t = []; (a.tsb || []).forEach((v, i) => { const cv = Math.max(-40, Math.min(20, v)); t.push(xAt(i) + ',' + (90 - (cv + 40) / 60 * 70).toFixed(1)); });
  return '<svg width="320" height="104" viewBox="0 0 300 104" role="img" aria-label="Bienestar de los últimos siete días"><line class="ln-g" x1="12" y1="90" x2="288" y2="90" stroke-width="1"></line><line class="ln-g" x1="12" y1="55" x2="288" y2="55" stroke-width="1" stroke-dasharray="3 4"></line><line class="ln-g" x1="12" y1="20" x2="288" y2="20" stroke-width="1" stroke-dasharray="3 4"></line>'
    + (t.length > 1 ? '<polyline class="ln-i" points="' + t.join(' ') + '" fill="none" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round" stroke-linejoin="round"></polyline>' : '')
    + (w.length > 1 ? '<polyline class="ln-a" points="' + w.join(' ') + '" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>' : '') + '</svg>';
}
const icon = (id, size, color) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[id] + '</svg>';
const infoIcon = () => '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="9.5"></circle><path d="M12 11v6"></path><circle cx="12" cy="7.6" r=".6" fill="var(--info)"></circle></svg>';
const arrow = () => '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';
const check = (color, size) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';

/* ---------- Piezas de interfaz ---------- */
function chips(g, arr, sel, label, valFn) {
  return '<div class="chips" role="group" aria-label="' + esc(label) + '">' + arr.map((l, i) => {
    const v = valFn ? valFn(i, l) : i;
    return '<button type="button" class="chip" data-a="set" data-g="' + g + '" data-v="' + esc(v) + '" aria-pressed="' + (sel === v) + '">' + esc(l) + '</button>';
  }).join('') + '</div>';
}
function multiChips(g, arr, sel, label) {
  return '<div class="chips" role="group" aria-label="' + esc(label) + '">' + arr.map((x) => '<button type="button" class="chip" data-a="multi" data-g="' + g + '" data-v="' + esc(x) + '" aria-pressed="' + ((sel || []).indexOf(x) >= 0) + '">' + esc(x) + '</button>').join('') + '</div>';
}
const NAVIC = {
  hoy: '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3"></circle>',
  ruta: '<path d="M5 19c0-6 14-4 14-12"></path><circle cx="5" cy="19" r="2"></circle><circle cx="19" cy="6" r="2"></circle>',
  cabina: '<path d="M5 20V11M12 20V4M19 20v-6"></path>',
  datos: '<path d="M4 4v16h16"></path><path d="M8 15l4-5 3 3 5-7"></path>',
  guia: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"></path><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"></path>',
  ajustes: '<circle cx="12" cy="12" r="3"></circle><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"></path>'
};
const TABLBL = { guia: 'Guía' };
const coachMode = () => { if (!isCoach()) return false; if (UI.mode == null) { let v = null; try { v = localStorage.getItem('camino.mode'); } catch (e) { /* sin almacenamiento */ } UI.mode = v === 'atleta' ? 'atleta' : 'coach'; } return UI.mode === 'coach'; };
const tabs = () => (isCoach() ? (coachMode() ? (UI.asId ? ['cabina', 'hoy', 'datos', 'ruta', 'ajustes', 'guia'] : ['cabina', 'ajustes', 'guia']) : ['hoy', 'datos', 'ruta', 'ajustes', 'guia']) : ['hoy', 'datos', 'ruta', 'ajustes', 'guia']).map((id) => ({ id, label: TABLBL[id] || cap(id), ic: NAVIC[id] }));
const navHtml = () => '<div class="inner">' + tabs().map((t) => '<a href="#' + t.id + '"' + (UI.view === t.id ? ' aria-current="page"' : '') + '><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + t.ic + '</svg><span>' + t.label + '</span></a>').join('') + '</div>';
/* Logo segun el fondo: ciclista blanco sobre fondos oscuros, negro sobre fondos claros. */
function logoSrc() {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) { const n = parseInt(m[1], 16), l = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; return l < 0.45 ? './logo-blanco.svg' : './logo-negro.svg'; }
  } catch (e) { /* sin estilos: usa el logo negro */ }
  return './logo-negro.svg';
}
function topHtml() {
  let pills = '';
  if (DEMO) pills += '<span class="pill">Demo</span>';
  if (ST.profile) {
    const t = myTeam();
    if (t) pills += '<span class="pill">' + TEAMS[t] + '</span>';
    if (isCoach()) { const cm = coachMode(); pills += '<div class="modesw" role="group" aria-label="Cambiar de vista"><button type="button" data-a="mode" data-v="coach" aria-pressed="' + cm + '">Coach</button><button type="button" data-a="mode" data-v="atleta" aria-pressed="' + !cm + '">Atleta</button></div>'; }
    else pills += '<span class="pill role">Atleta</span>';
  }
  return '<div class="inner"><span class="brand row g8"><img class="brand-logo" src="' + logoSrc() + '" alt="" width="30" height="30">Camino</span><span class="row g8">' + pills + '</span></div>';
}
const head = (sub, title) => '<div class="col g4"><div class="muted" style="font-size:14px">' + esc(sub) + '</div><h1 class="title">' + esc(title) + '</h1></div>';
const msgBanner = () => (UI.msg ? '<div class="banner" role="status">' + infoIcon() + '<span>' + esc(UI.msg) + '</span></div>' : '');

/* ---------- Vista: ingreso y carga ---------- */
function viewLogin() {
  return '<div class="inner"><div class="login"><div class="logo" aria-hidden="true"><img src="' + logoSrc() + '" alt="" width="132" height="132"></div>'
    + '<div class="col g8"><h1 class="title" style="font-size:52px">Camino</h1><p class="soft" style="font-size:18px">Tu camino recorrido, día a día. Check-in corto, plan claro y tu coach al tanto.</p></div>'
    + msgBanner()
    + (DEMO
      ? '<div class="col g10"><button type="button" class="btn primary" data-a="login" data-v="atleta"><span>Entrar como atleta (demo)</span>' + arrow() + '</button><button type="button" class="btn" style="background:var(--surface)" data-a="login" data-v="coach"><span>Entrar como coach (demo)</span>' + arrow() + '</button><p class="muted" style="font-size:13px">Modo demostración: datos ficticios guardados solo en este navegador.</p></div>'
      : '<div class="col g10"><button type="button" class="btn google" data-a="login"' + (UI.busy ? ' disabled' : '') + '><span>Continuar con Google</span></button><p class="muted" style="font-size:13px">Tu coach ve tus check-ins y molestias. Tu equipo ve solo kilómetros, insignias e hitos.</p></div>')
    + '</div></div>';
}
const viewLoading = () => '<div class="inner"><div class="login"><p class="muted">Cargando…</p>' + msgBanner() + '</div></div>';

/* ---------- Vista: Hoy ---------- */
function viewHoy() {
  const a = meA(), l = latest(a), t = new Date(), todayC = on(a, off(0));
  const sub = cap(WD[t.getDay()]) + ' ' + t.getDate() + ' de ' + MONTHS[t.getMonth()];
  const sc = l ? score(l) : null, b = band(sc), pct = sc == null ? 0 : sc, circ = 339.292, dash = (pct / 100 * circ).toFixed(1);
  const basis = !l ? '' : (l.date === off(0) ? 'según tu check-in de hoy' : (l.date === off(-1) ? 'según tu check-in de ayer' : 'según tu último check-in'));
  const g = goalInfo();
  let out = '<div class="inner"><div class="stack">' + head(sub, 'Hola, ' + a.first) + msgBanner();
  if (ST.profile && ST.profile.pending) out += '<div class="banner" role="note">' + infoIcon() + '<span>Tu coach todavía no te asigna a un equipo. Puedes hacer tus check-ins desde ya; él los verá cuando te acepte.</span></div>';

  out += '<section class="card row g16" aria-label="Estado de hoy"><div style="position:relative;width:128px;height:128px;flex:none"><svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="54" fill="none" style="stroke:var(--track)" stroke-width="12"></circle><circle class="ring-fg" cx="64" cy="64" r="54" fill="none" style="stroke:' + b.color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + dash + ' ' + circ + '" transform="rotate(-90 64 64)"></circle></svg><div class="col" style="position:absolute;inset:0;align-items:center;justify-content:center"><span class="num" style="font-size:50px">' + (sc == null ? '–' : sc) + '</span><span class="muted" style="font-size:12px">de 100</span></div></div>'
    + '<div class="col g6 grow"><div class="eyebrow">Estado de hoy</div><div class="h2" style="color:' + b.color + '">' + b.label + '</div>'
    + (l ? '<p class="soft" style="font-size:14px">' + esc(summaryText(l, b)) + '</p><p class="muted" style="font-size:12px">' + basis + '</p>' : '<p class="soft" style="font-size:14px">Haz tu primer check-in para ver tu estado.</p>') + '</div></section>';

  let segs = ''; const total = Math.min(Math.max(g ? g.weeks : 1, 1), 10);
  if (g && !g.done) for (let i = 0; i < total; i++) { const fromEnd = total - 1 - i, col = i === 0 ? 'var(--accent)' : (fromEnd < 2 ? 'var(--accent2)' : 'var(--track)'); segs += '<i style="background:' + col + '"></i>'; }
  if (!g) out += '<section class="card" aria-label="Próxima meta"><div class="eyebrow">Próxima meta</div><p class="soft" style="margin-top:8px">Tu coach cargará aquí tu próxima meta y tu plan de entrenamiento.</p></section>';
  else {
    const pls = phaseList(g), curP = pls.filter((x) => x.st === 'now')[0], nxtP = pls.filter((x) => x.st === 'next')[0];
    out += '<section class="card" aria-label="Próxima meta"><div class="eyebrow">Próxima meta</div>' + (g.done ? '<div class="h2" style="margin-top:8px">' + esc(g.name) + ': ¡lo lograron!</div>'
      : '<div class="row g16" style="align-items:flex-end;margin-top:8px"><div class="row g6" style="align-items:baseline;flex:none"><span class="num" style="font-size:68px;color:var(--accent)">' + g.days + '</span><span class="muted">' + (g.days === 1 ? 'día' : 'días') + '</span></div><div class="col" style="padding-bottom:4px;min-width:0"><div style="font-weight:600;line-height:1.3">' + esc(g.name) + '</div><div class="muted" style="font-size:13px">' + esc(g.dateText) + ' · ' + (g.days <= 7 ? 'esta semana' : g.weeks + ' semanas') + '</div></div></div><div class="seg" style="margin-top:16px" aria-hidden="true">' + segs + '</div><div class="muted" style="font-size:12px;margin-top:6px">Bloque actual: ' + esc(curP ? curP.n : 'Meta cumplida') + (nxtP ? ' · luego ' + esc(nxtP.n) : '') + '</div>') + '</section>';
  }

  const fiH = formaInfo(ST.myHist); if (fiH) out += formaCard(fiH, true);
  const wk = weekInfo(a); let cols = '';
  wk.days.forEach((d) => {
    const ph = d.p ? Math.min(64, Math.max(8, Math.round((d.p.min || 30) / 180 * 64))) : 4, dh = d.done && d.p ? ph : 0, bd = d.p ? (d.today ? '1.5px dashed var(--accent)' : '1.5px dashed var(--muted)') : '1.5px solid var(--line)';
    cols += '<div class="col" style="flex:1;align-items:center;gap:6px"><div style="position:relative;width:100%;height:64px" aria-hidden="true"><div style="position:absolute;left:0;right:0;bottom:0;border-radius:8px;height:' + ph + 'px;border:' + bd + '"></div><div style="position:absolute;left:0;right:0;bottom:0;border-radius:8px;background:var(--accent);height:' + dh + 'px"></div></div><span style="font-size:12px;font-weight:600;color:' + (d.today ? 'var(--accent)' : 'var(--muted)') + '">' + WDL[d.wd] + '</span></div>';
  });
  const pToday = planFor(off(0)); let wkLine;
  if (todayC && todayC.type === 'actividad') wkLine = 'Hoy registraste ' + (todayC.activity ? todayC.activity.name.toLowerCase() : 'tu actividad') + '. Vas al día con el plan.';
  else if (pToday) wkLine = 'Hoy: ' + pToday.name + (pToday.min ? ' de ' + minText(pToday.min) : '') + '. Llevas ' + wk.done + ' de ' + wk.planned + ' sesiones de la semana.';
  else wkLine = 'Hoy es día de descanso. Llevas ' + wk.done + ' de ' + wk.planned + ' sesiones de la semana.';
  const nTxt = dayNote(off(0));
  if (nTxt && !(todayC && todayC.type === 'actividad')) wkLine += ' ' + nTxt;
  out += '<section class="card" aria-label="Tu semana"><div class="row between"><div class="eyebrow">Tu semana</div><div class="muted" style="font-size:13px">' + (DEMO && !ST.myPlan ? 'Plan de ejemplo y lo hecho' : 'Tu plan y lo hecho') + '</div></div><div class="row g8" style="align-items:flex-start;margin-top:14px">' + cols + '</div><p class="soft" style="margin-top:14px;font-size:15px">' + esc(wkLine) + '</p></section>';

  const n = lastNote(a);
  if (n) out += '<section class="card" aria-label="Nota de tu coach"><div class="eyebrow">Nota de tu coach · ' + relTime(n.at) + '</div><p class="soft" style="margin-top:8px">“' + esc(n.text) + '”</p></section>';
  if (todayC) out += '<button type="button" class="btn done" data-a="feedback"><span class="col"><span style="color:var(--good);font-weight:600">Check-in enviado</span><span class="soft" style="font-size:13px;font-weight:500">Toca para ver tu resumen</span></span>' + check('var(--good)', 24) + '</button>';
  if (todayC) out += ckActions();
  else out += '<button type="button" class="btn primary" data-a="start"><span><span>Hacer mi check-in</span><small>1 minuto · pocos pasos</small></span>' + arrow() + '</button>';
  return out + '</div></div>';
}

/* ---------- Vista: Ruta ---------- */
function teamCard(team, label) {
  const tt = teamTotals(team), pct = Math.min(100, Math.round(tt.km / tt.goal * 100));
  return '<section class="card" aria-label="Meta del equipo"><div class="row between"><div class="eyebrow">Meta del mes · ' + label + '</div><div class="muted" style="font-size:13px">' + tt.members + (tt.members === 1 ? ' atleta' : ' atletas') + '</div></div>'
    + '<div class="row g8" style="align-items:baseline;margin-top:10px"><span class="num" style="font-size:56px;color:var(--good)">' + tt.km.toLocaleString('es-CL') + '</span><span class="muted">de ' + tt.goal.toLocaleString('es-CL') + ' km</span></div><div class="bar" style="margin-top:12px" aria-hidden="true"><i style="width:' + pct + '%;background:var(--good)"></i></div><p class="soft" style="margin-top:12px;font-size:14px">Van al ' + pct + '%. Cada salida suma, también las suaves.</p>'
    + (tt.hito ? '<div class="eyebrow" style="margin-top:14px">Hito de la semana</div><p style="margin-top:6px">' + esc(tt.hito) + '</p>' : '') + '</section>';
}
function viewRuta() {
  const a = meA(), g = goalInfo();
  let out = '<div class="inner"><div class="stack">' + head(g ? 'Hacia ' + g.name : 'Tu camino', 'Tu ruta') + msgBanner();
  if (!g) out += '<section class="card" aria-label="Fases del plan"><div class="eyebrow">Fases del plan</div><p class="soft" style="margin-top:8px">Tu coach aún no carga tu plan. Cuando lo haga, verás aquí cada fase hasta tu meta.</p></section>';
  else {
    const ph = phaseList(g);
    out += '<section class="card" aria-label="Fases del plan" style="padding-bottom:8px"><div class="eyebrow" style="margin-bottom:14px">Fases del plan</div>';
    ph.forEach((p, i) => {
      const nodeBd = p.st === 'done' || p.st === 'now' ? 'var(--accent)' : (p.st === 'goal' ? 'var(--good)' : 'var(--muted)'), nodeBg = p.st === 'done' ? 'var(--accent)' : 'var(--bg)';
      const inner = p.st === 'done' ? check('var(--on-accent)', 14) : (p.st === 'now' ? '<i style="width:8px;height:8px;border-radius:50%;background:var(--accent);display:block"></i>' : '');
      out += '<div class="row g14" style="align-items:stretch"><div class="col" style="align-items:center;width:24px;flex:none"><div class="row" style="width:24px;height:24px;border-radius:50%;border:2px solid ' + nodeBd + ';background:' + nodeBg + ';justify-content:center;flex:none">' + inner + '</div>' + (i < ph.length - 1 ? '<div style="width:2px;flex:1;min-height:18px;background:' + (p.st === 'done' ? 'var(--accent)' : 'var(--line)') + '"></div>' : '') + '</div><div style="padding-bottom:18px;min-width:0"><div class="row g8 wrap"><span class="h3" style="color:' + (p.st === 'goal' ? 'var(--good)' : 'var(--text)') + '">' + esc(p.n) + '</span>' + (p.st === 'now' ? '<span class="tag">Estás aquí</span>' : '') + '</div><div class="muted" style="font-size:14px">' + esc(p.s) + '</div></div></div>';
    });
    out += '</section>';
  }
  out += '<section class="card col g12" aria-label="Resumen de tu bloque" style="background:var(--accent);color:var(--on-accent)"><div class="eyebrow" style="color:var(--on-accent)">Tu camino recorrido</div><div class="h2" style="font-size:34px">Mira lo que has construido</div><button type="button" data-a="story" data-v="0" class="btn" style="width:auto;min-height:48px;font-size:16px;background:var(--on-accent);color:var(--accent);align-self:flex-start">Ver mi resumen</button></section>';
  if (isCoach()) out += teamCard('grnt', 'GRNT') + teamCard('zn', 'ZN');
  else if (myTeam()) out += teamCard(myTeam(), TEAMS[myTeam()]);
  else out += '<section class="card"><div class="eyebrow">Equipo</div><p class="soft" style="margin-top:8px">Cuando tu coach te asigne a GRNT o ZN verás aquí los kilómetros del equipo.</p></section>';
  const bs = badges(a);
  out += '<section class="card" aria-label="Insignias de constancia"><div class="eyebrow">Insignias de constancia</div><div class="grid5" style="grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px">' + bs.map((b) => '<div class="col g6" style="align-items:center;text-align:center"><div class="row" style="width:60px;height:60px;border-radius:50%;justify-content:center;border:2px ' + (b.earned ? 'solid var(--accent)' : 'dashed var(--muted)') + ';background:' + (b.earned ? 'var(--accent-soft)' : 'transparent') + '">' + icon(b.id, 28, b.earned ? 'var(--accent)' : 'var(--muted)') + '</div><div style="font-size:13px;font-weight:600;line-height:1.25">' + b.label + '</div><div style="font-size:12px;color:' + (b.earned ? 'var(--good)' : 'var(--muted)') + '">' + (b.earned ? 'Lograda' : b.prog) + '</div></div>').join('') + '</div></section>';
  return out + '</div></div>';
}

/* ---------- Vista: Cabina (coach) ---------- */
const zoneTxt = (l) => (l && l.pain ? String(l.pain.zone || 'esa zona').toLowerCase() : 'esa zona');
function cabinaPresets(st, a) {
  const n = a ? a.first : '', l = a ? latest(a) : null;
  if (st.k === 'warn') return [l && l.pain ? n + ', cuida esa molestia (' + zoneTxt(l) + '): baja la intensidad y cuéntame cómo sigue.' : n + ', bajamos la intensidad hoy. ¿Cómo vienes?', 'Descansa hoy y me cuentas mañana.', 'Hablemos hoy, ¿te llamo?'];
  if (st.k === 'none') return ['¿Todo bien, ' + n + '? Cuando puedas, cuéntame cómo vas.', 'Retomemos con un check-in corto hoy.', 'Te escribo para saber cómo estás.'];
  return ['Todo bien, ' + n + '. Sigue con el plan.', 'Buen trabajo esta semana, ' + n + '.', 'Hoy puedes sumar un poco más.'];
}
const pencil = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"></path><path d="M13.5 6.5l4 4"></path></svg>';
function replyBlock(a, st, l, n) {
  const need = needsReply(a), pr = cabinaPresets(st, a), un = UI.undo && UI.undo.id === a.id ? UI.undo : null, len = (UI.reply.text || '').length;
  let out = '';
  if (n && l && n.at >= l.ts) out += '<div class="row g12" style="background:var(--good-soft);border:1.5px solid var(--good);border-radius:16px;padding:12px 14px;align-items:flex-start"><span style="flex:none;margin-top:2px">' + check('var(--good)', 20) + '</span><span class="soft" style="font-size:14px">Nota enviada ' + relTime(n.at) + ': “' + esc(n.text) + '”</span></div>';
  out += '<div class="col g10" id="replyBox"><div class="row between g8" style="align-items:center"><div class="eyebrow">Responder a ' + esc(a.first) + '</div><span class="tag out" style="' + (need ? 'color:var(--accent);border-color:var(--accent)' : '') + '">' + (need ? 'Pendiente' : 'Al día') + '</span></div>';
  if (un) {
    const el = Math.max(0, (Date.now() - un.start) / 1000);
    out += '<div class="undo" role="status"><div class="row between g12" style="align-items:center"><span class="soft" style="font-size:14px">Se enviará a ' + esc(a.first) + ' en unos segundos.</span><button type="button" class="chip" data-a="qrUndo" style="min-height:40px">Deshacer</button></div><div class="undo-bar" aria-hidden="true"><i style="animation-delay:-' + el.toFixed(2) + 's"></i></div></div>';
  } else {
    out += '<div class="col g8" role="group" aria-label="Respuestas rápidas">' + pr.map((p, i) => '<div class="qr"><button type="button" class="qr-main" data-a="qrSend" data-v="' + i + '"><span>' + esc(p) + '</span><span class="qr-go" aria-hidden="true">Enviar</span></button><button type="button" class="qr-edit" data-a="preset" data-v="' + i + '" aria-label="Editar antes de enviar">' + pencil() + '</button></div>').join('') + '</div><p class="muted" style="font-size:12px">Toca una respuesta para enviarla (puedes deshacer unos segundos) o el lápiz para editarla antes.</p>';
  }
  out += '<label for="replyText" class="muted" style="font-size:13px">O escribe tu propio mensaje</label><textarea id="replyText" rows="3" maxlength="600" placeholder="Escribe aquí">' + esc(UI.reply.text) + '</textarea><div class="row between g8" style="align-items:center"><span class="muted" style="font-size:12px" id="replyCount">' + len + ' / 600</span><button type="button" class="btn primary" data-a="sendReply" style="width:auto;min-height:48px;padding:0 20px;justify-content:center" ' + (UI.reply.text.trim() && !UI.busy ? '' : 'disabled') + '>' + (UI.reply.text.trim() ? 'Enviar a ' + esc(a.first) : 'Enviar') + '</button></div></div>';
  return out;
}
function viewCabina() {
  const list = athleteObjs(), cnt = { ok: 0, warn: 0, none: 0 }; let queue = 0;
  list.forEach((a) => { cnt[statusOf(a).k]++; if (needsReply(a)) queue++; });
  let out = '<div class="inner"><div class="stack">' + head('Vista del coach', 'Cabina') + msgBanner();
  if (ST.pending.filter((p) => p.id !== (ST.user && ST.user.uid)).length) {
    out += '<section class="card col g12" aria-label="Solicitudes nuevas" style="border:1.5px solid var(--accent)"><div class="eyebrow" style="color:var(--accent)">Solicitudes nuevas</div>' + ST.pending.filter((p) => p.id !== ST.user.uid).map((p) => '<div class="col g10"><div style="font-weight:600">' + esc(p.name) + '</div><div class="row g8 wrap"><button type="button" class="chip" data-a="accept" data-v="' + esc(p.id) + '" data-t="grnt">Aceptar en GRNT</button><button type="button" class="chip" data-a="accept" data-v="' + esc(p.id) + '" data-t="zn">Aceptar en ZN</button></div></div>').join('') + '</section>';
  }
  out += '<section class="row g10" aria-label="Resumen del equipo">' + [['Al día', cnt.ok, 'var(--good)'], ['Atención', cnt.warn, 'var(--warn)'], ['Sin check-in', cnt.none, 'var(--muted)']].map((x) => '<div class="card tight grow"><div class="num" style="font-size:40px;color:' + x[2] + '">' + x[1] + '</div><div class="soft" style="font-size:13px;margin-top:4px">' + x[0] + '</div></div>').join('') + '</section>';
  out += '<button type="button" class="row between g12" data-a="nextReply" ' + (queue === 0 ? 'disabled' : '') + ' style="width:100%;min-height:52px;text-align:left;background:var(--accent-soft);border:1.5px solid var(--accent);border-radius:16px;padding:12px 16px"><span style="font-weight:600">' + (queue === 0 ? 'Todo respondido por hoy' : queue + ' por responder') + '</span><span class="muted" style="font-size:13px">' + (queue === 0 ? 'Cola de respuestas' : 'Ir a responder ›') + '</span></button>';
  if (!list.length) { out += '<section class="card"><p class="soft">Aún no tienes atletas asignados. Cuando alguien entre con Google aparecerá arriba como solicitud nueva.</p></section></div></div>'; return out; }
  if (!UI.sel || !list.some((a) => a.id === UI.sel)) UI.sel = list[0].id;
  out += '<section class="col g10" aria-label="Atletas"><div class="eyebrow">Atletas · toca uno para ver el detalle</div>';
  list.forEach((a) => {
    const st = statusOf(a), l = latest(a), col = st.k === 'ok' ? 'var(--good)' : (st.k === 'warn' ? 'var(--warn)' : 'var(--muted)'), lab = st.k === 'ok' ? 'Al día' : (st.k === 'warn' ? 'Atención' : 'Sin check-in');
    out += '<button type="button" data-a="sel" data-v="' + esc(a.id) + '" aria-pressed="' + (UI.sel === a.id) + '" class="row g12" style="width:100%;min-height:72px;padding:12px 14px;border-radius:18px;text-align:left;border:1.5px solid ' + (UI.sel === a.id ? 'var(--accent)' : 'var(--line)') + ';background:' + (UI.sel === a.id ? 'var(--surface2)' : 'var(--surface)') + '"><span class="dot" style="background:' + col + '" aria-hidden="true"></span><span class="col grow g4"><span style="font-weight:600;font-size:16px">' + esc(a.name) + (a.team ? ' <span class="muted" style="font-weight:500;font-size:13px">· ' + TEAMS[a.team] + '</span>' : '') + '</span><span style="font-size:13px;color:' + col + '">' + lab + '</span><span class="muted" style="font-size:12px">Último check-in: ' + (l ? relTime(l.ts) : 'ninguno') + '</span></span>' + miniSpark(a) + '</button>';
  });
  out += '</section>';
  const a = list.find((x) => x.id === UI.sel), st = statusOf(a), l = latest(a), n = lastNote(a), col = st.k === 'ok' ? 'var(--good)' : (st.k === 'warn' ? 'var(--warn)' : 'var(--muted)'), lab = st.k === 'ok' ? 'Al día' : (st.k === 'warn' ? 'Atención' : 'Sin check-in');
  if (UI.reply.id !== a.id) UI.reply = { id: a.id, text: '' };
  out += '<section class="card col g14" aria-label="Detalle del atleta"><div class="row between g8" style="align-items:baseline"><h2 class="h2">' + esc(a.name) + '</h2><span style="font-weight:600;font-size:14px;color:' + col + '">' + lab + '</span></div>';
  out += '<button type="button" class="btn" data-a="verComo" data-v="' + esc(a.id) + '" style="width:100%;min-height:52px;justify-content:space-between;border:1.5px solid var(--accent2);color:var(--accent2);background:transparent"><span style="font-weight:600">Ver la app como ' + esc(a.first) + '</span><span aria-hidden="true">' + arrow() + '</span></button>';
  out += st.reasons.length ? '<ul style="margin:0;padding-left:18px" class="soft">' + st.reasons.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' : '<p class="soft">Todo en orden. Su bienestar acompaña bien a la carga.</p>';
  if (l && l.pain) out += '<div class="row g8 wrap"><span class="muted" style="font-size:13px">Molestia reportada:</span><span class="tag out">Zona: ' + esc(String(l.pain.zone || '').toLowerCase()) + ' (' + esc(String(l.pain.side || '').toLowerCase()) + ')</span><span class="tag out">Intensidad: ' + esc(String(l.pain.level || '').toLowerCase()) + '</span></div>';
  if (l) {
    const bits = ['Ánimo: ' + at(MOODS, l.mood - 1)];
    if (l.sleepH != null) bits.push('Sueño: ' + at(SLEEPH, l.sleepH) + (l.sleepQ ? ' (' + at(SLEEPQ, l.sleepQ - 1).toLowerCase() + ')' : ''));
    if (l.legs != null) bits.push('Piernas: ' + at(LEGS, l.legs).toLowerCase());
    if (l.stress != null) bits.push('Estrés: ' + at(STRESS, l.stress).toLowerCase());
    if (l.rpe) bits.push('RPE ' + l.rpe);
    if (l.hard === 'si') { const hi = l.hardInfo || {}, hp = [hi.type, hi.dur, hi.end].filter(Boolean).map((x) => String(x).toLowerCase()); bits.push('Tramo duro' + (hp.length ? ': ' + hp.join(', ') : '')); }
    if (l.prevInfo) { const pi = l.prevInfo, pp = (pi.items || []).map((x) => String(x).toLowerCase()).join(', '); bits.push('Ayer fuera de lo habitual' + (pp ? ': ' + pp : '') + (pi.text ? ' ("' + pi.text + '")' : '')); }
    out += '<div class="col g6"><div class="eyebrow">Último check-in · ' + relTime(l.ts) + '</div><p class="soft" style="font-size:15px">' + esc(bits.join(' · ')) + '</p>' + (l.comment ? '<p class="muted" style="font-size:14px">“' + esc(l.comment) + '”</p>' : '') + '</div>';
  }
  out += replyBlock(a, st, l, n);
  out += '<div><div class="eyebrow">Bienestar · 7 días</div><div style="margin-top:8px">' + dualChart(a) + '</div><div class="row g16 wrap soft" style="font-size:13px;margin-top:4px"><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--accent)"></i>Bienestar</span></div></div>' + histBlock(a);
  out += '</section>';
  out += manageCard(a);
  return out + '</div></div>';
}

/* ---------- Historial de forma y salidas (lo carga el coach desde intervals.icu) ---------- */
const histDays = (h) => (h && Array.isArray(h.days) ? h.days.filter((x) => x && x.d && isFinite(x.ctl) && isFinite(x.atl)).sort((a, b) => (a.d < b.d ? -1 : 1)) : []);
const f1 = (v) => Number(v).toLocaleString('es-CL', { maximumFractionDigits: 1 });
function formaInfo(h) { const ds = histDays(h); if (!ds.length) return null; const last = ds[ds.length - 1]; return { ds, last, tsb: Math.round(last.ctl - last.atl) }; }
/* ---------- Grafico de forma (aptitud, fatiga, forma) ---------- */
const FC_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
let fcSeq = 0;
const fcDate = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); };
const fcYmd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fcDiff = (a, b) => Math.round((fcDate(b) - fcDate(a)) / 86400000);
const fcLbl = (s) => { const d = fcDate(s); return d.getDate() + ' ' + FC_MES[d.getMonth()]; };
const fcNum = (v) => (Math.round(v * 10) / 10).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fcSgn = (v) => (v > 0 ? '+' : '') + Math.round(v);
/* Curva suave que no se pasa de los datos (cubica monotona), fiel a un promedio movil exponencial. */
function fcPath(P) {
  const n = P.length; if (n < 2) return '';
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1][0] - P[i][0]; m[i] = (P[i + 1][1] - P[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = 'M' + P[0][0].toFixed(1) + ',' + P[0][1].toFixed(1);
  for (let i = 0; i < n - 1; i++) d += 'C' + (P[i][0] + dx[i] / 3).toFixed(1) + ',' + (P[i][1] + t[i] * dx[i] / 3).toFixed(1) + ' ' + (P[i + 1][0] - dx[i] / 3).toFixed(1) + ',' + (P[i + 1][1] - t[i + 1] * dx[i] / 3).toFixed(1) + ' ' + P[i + 1][0].toFixed(1) + ',' + P[i + 1][1].toFixed(1);
  return d;
}
function fcNice(mx) { const raw = mx / 3, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p, s = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10; return s * p; }
/* Proyecta aptitud y fatiga con las cargas del plan (modelo 42 y 7 dias). */
function fcProject(last, sessions, endDate) {
  const out = []; let ctl = last.ctl, atl = last.atl, d = fcDate(last.d);
  const n = Math.min(fcDiff(last.d, endDate), 60);
  for (let i = 0; i < n; i++) { d.setDate(d.getDate() + 1); const k = fcYmd(d), s = sessions && sessions[k], l = s && s.load != null ? s.load : 0; ctl += (l - ctl) / 42; atl += (l - atl) / 7; out.push({ d: k, ctl, atl }); }
  return out;
}
/* ds: [{d,ctl,atl}] ; o: {range, proj:[...], goal:{date,name}} */
function formaChart(ds, o) {
  o = o || {}; const id = ++fcSeq;
  let rows = ds.slice(); if (o.range && rows.length > o.range) rows = rows.slice(-o.range);
  const proj = o.proj || [], all = rows.concat(proj);
  const d0 = rows[0].d, N = fcDiff(d0, all[all.length - 1].d) + 1;
  const W = 340, L = 30, R = 10, PW = W - L - R, X = (s) => L + fcDiff(d0, s) * PW / Math.max(N - 1, 1);
  const vals = rows.map((r) => Math.max(r.ctl, r.atl)).sort((a, b) => a - b), p95 = vals[Math.floor(vals.length * 0.95)] || 10;
  const lastR = rows[rows.length - 1], realMax = vals[vals.length - 1];
  const topWanted = Math.max(p95 * 1.2, lastR.ctl * 1.6, 20), clip = realMax > topWanted * 1.15;
  const hasProj = proj.length > 0, pmax = hasProj ? Math.max.apply(null, proj.map((r) => Math.max(r.ctl, r.atl))) : 0;
  const need = Math.max(clip ? topWanted : realMax, pmax, 10), step = fcNice(need), top = Math.ceil(need * 1.05 / step) * step;
  const T1 = 10, H1 = 118, Y1 = (v) => T1 + H1 - v / top * H1, B1 = T1 + H1;
  const two = o.panels !== 1, T2 = B1 + 34, H2 = 62;
  const tsbOf = (r) => r.ctl - r.atl, tv = all.map(tsbOf), tmin = Math.min.apply(null, tv.concat([-30])), tmax = Math.max.apply(null, tv.concat([20]));
  const lo = Math.floor(tmin / 10) * 10, hi = Math.ceil(tmax / 10) * 10, Y2 = (v) => T2 + H2 - (v - lo) / (hi - lo) * H2, Z2 = Y2(0);
  const H = two ? T2 + H2 + 22 : B1 + 22, axisY = two ? T2 + H2 + 14 : B1 + 14;
  const pts = (arr, k) => arr.map((r) => [X(r.d), Y1(r[k])]);
  let s = '<svg class="fc-svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Curvas de aptitud, fatiga y forma" style="display:block;touch-action:pan-y"><defs><clipPath id="fcc' + id + '"><rect x="' + L + '" y="' + T1 + '" width="' + PW + '" height="' + H1 + '"></rect></clipPath><clipPath id="fct' + id + '"><rect x="' + L + '" y="' + T2 + '" width="' + PW + '" height="' + H2 + '"></rect></clipPath></defs>';
  // rejilla y ejes del panel 1
  for (let v = 0; v <= top + 0.01; v += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y1(v).toFixed(1) + '" y2="' + Y1(v).toFixed(1) + '" stroke="var(--line)" stroke-width="1"></line><text x="' + (L - 6) + '" y="' + (Y1(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + Math.round(v) + '</text>';
  // zona de proyeccion
  if (hasProj) { const px = X(lastR.d); s += '<rect x="' + px.toFixed(1) + '" y="' + T1 + '" width="' + (W - R - px).toFixed(1) + '" height="' + (two ? T2 + H2 - T1 : H1) + '" fill="var(--surface2)" opacity=".55"></rect><text x="' + (px + 5).toFixed(1) + '" y="' + (T1 + 11) + '" font-size="10" fill="var(--muted)">Plan (estimado)</text>'; }
  // aptitud: area + linea
  const cPts = pts(rows, 'ctl'), aPts = pts(rows, 'atl'), cp = fcPath(cPts);
  s += '<g clip-path="url(#fcc' + id + ')"><path d="' + cp + 'L' + cPts[cPts.length - 1][0].toFixed(1) + ',' + B1 + 'L' + cPts[0][0].toFixed(1) + ',' + B1 + 'Z" fill="var(--accent2)" opacity=".12"></path><path d="' + cp + '" fill="none" stroke="var(--accent2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="' + fcPath(aPts) + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>';
  if (hasProj) { const base = [lastR].concat(proj); s += '<path d="' + fcPath(pts(base, 'ctl')) + '" fill="none" stroke="var(--accent2)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"></path><path d="' + fcPath(pts(base, 'atl')) + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"></path>'; }
  s += '</g>';
  // pico recortado
  if (clip) { let pi = 0; rows.forEach((r, i) => { if (Math.max(r.ctl, r.atl) > Math.max(rows[pi].ctl, rows[pi].atl)) pi = i; }); const px = Math.min(Math.max(X(rows[pi].d), L + 22), W - R - 22); s += '<text x="' + px.toFixed(1) + '" y="' + (T1 + 9) + '" text-anchor="middle" font-size="10" fill="var(--accent)">▲ pico ' + Math.round(realMax) + '</text>'; }
  // punto final
  s += '<circle cx="' + cPts[cPts.length - 1][0].toFixed(1) + '" cy="' + cPts[cPts.length - 1][1].toFixed(1) + '" r="4" fill="var(--accent2)" stroke="var(--surface)" stroke-width="2"></circle><circle cx="' + aPts[aPts.length - 1][0].toFixed(1) + '" cy="' + aPts[aPts.length - 1][1].toFixed(1) + '" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"></circle>';
  // meta
  if (o.goal && fcDiff(d0, o.goal.date) <= N - 1 && fcDiff(d0, o.goal.date) >= 0) { const gx = X(o.goal.date); s += '<line x1="' + gx.toFixed(1) + '" x2="' + gx.toFixed(1) + '" y1="' + T1 + '" y2="' + (two ? T2 + H2 : B1) + '" stroke="var(--good)" stroke-width="1.5"></line><text x="' + (gx - 4).toFixed(1) + '" y="' + (T1 + 24) + '" text-anchor="end" font-size="10" fill="var(--good)">Meta</text>'; }
  // panel 2: forma
  if (two) {
    s += '<text x="' + L + '" y="' + (T2 - 10) + '" font-size="11" font-weight="600" fill="var(--soft)">Forma (aptitud − fatiga)</text>';
    for (let v = lo; v <= hi; v += 10) if (v % 20 === 0 || v === 0) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y2(v).toFixed(1) + '" y2="' + Y2(v).toFixed(1) + '" stroke="' + (v === 0 ? 'var(--muted)' : 'var(--line)') + '" stroke-width="1" ' + (v === 0 ? 'opacity=".6"' : '') + '></line><text x="' + (L - 6) + '" y="' + (Y2(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + fcSgn(v) + '</text>';
    if (lo < -25) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y2(-25).toFixed(1) + '" y2="' + Y2(-25).toFixed(1) + '" stroke="var(--bad)" stroke-width="1" opacity=".55"></line><text x="' + (L + 3) + '" y="' + (Y2(-25) - 3).toFixed(1) + '" font-size="9" fill="var(--bad)">alerta −25</text>';
    const fr = rows.map((r) => [X(r.d), Y2(tsbOf(r))]), fp = fcPath(fr), z = Z2.toFixed(1);
    s += '<g clip-path="url(#fct' + id + ')"><clipPath id="fcu' + id + '"><rect x="' + L + '" y="' + T2 + '" width="' + PW + '" height="' + (Z2 - T2).toFixed(1) + '"></rect></clipPath><clipPath id="fcd' + id + '"><rect x="' + L + '" y="' + z + '" width="' + PW + '" height="' + (T2 + H2 - Z2).toFixed(1) + '"></rect></clipPath>';
    const area = fp + 'L' + fr[fr.length - 1][0].toFixed(1) + ',' + z + 'L' + fr[0][0].toFixed(1) + ',' + z + 'Z';
    s += '<path d="' + area + '" clip-path="url(#fcu' + id + ')" fill="var(--good)" opacity=".22"></path><path d="' + area + '" clip-path="url(#fcd' + id + ')" fill="var(--accent)" opacity=".18"></path><path d="' + fp + '" fill="none" stroke="var(--text)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>';
    if (hasProj) s += '<path d="' + fcPath([fr[fr.length - 1]].concat(proj.map((r) => [X(r.d), Y2(tsbOf(r))]))) + '" fill="none" stroke="var(--text)" stroke-width="1.75" stroke-linecap="round" stroke-dasharray="2 4"></path>';
    s += '</g><circle cx="' + fr[fr.length - 1][0].toFixed(1) + '" cy="' + fr[fr.length - 1][1].toFixed(1) + '" r="4" fill="var(--text)" stroke="var(--surface)" stroke-width="2"></circle>';
  }
  // eje x
  let lastLbl = -99; const weekly = N <= 45;
  for (let i = 0; i < N; i++) { const dd = fcDate(d0); dd.setDate(dd.getDate() + i); const tick = weekly ? ((dd.getDay() + 6) % 7 === 0) : dd.getDate() === 1; if (!tick) continue; const x = L + i * PW / Math.max(N - 1, 1); if (x - lastLbl < 38) continue; lastLbl = x; s += '<text x="' + x.toFixed(1) + '" y="' + axisY + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + (weekly ? dd.getDate() + ' ' + FC_MES[dd.getMonth()] : FC_MES[dd.getMonth()]) + '</text>'; }
  // lectura al tocar
  s += '<line class="fc-x" x1="0" x2="0" y1="' + T1 + '" y2="' + (two ? T2 + H2 : B1) + '" stroke="var(--text)" stroke-width="1" opacity="0"></line><rect class="fc-hit" x="' + L + '" y="' + T1 + '" width="' + PW + '" height="' + (H - T1 - 16) + '" fill="transparent"></rect></svg>';
  const L1 = lastR, tsb = Math.round(L1.ctl - L1.atl), data = rows.concat(proj).map((r) => [r.d, Math.round(r.ctl * 10) / 10, Math.round(r.atl * 10) / 10]);
  const head = '<div class="fc-read" aria-live="polite" style="font-size:13px;min-height:20px;margin-top:2px"><span class="fc-rd muted">' + fcLbl(L1.d) + '</span> · <span style="color:var(--accent2);font-weight:600">Aptitud <b class="fc-rc">' + fcNum(L1.ctl) + '</b></span> · <span style="color:var(--accent);font-weight:600">Fatiga <b class="fc-ra">' + fcNum(L1.atl) + '</b></span> · <span style="font-weight:600">Forma <b class="fc-rt">' + fcSgn(tsb) + '</b></span></div>';
  let note = '';
  if (hasProj) { const e = proj[proj.length - 1], et = Math.round(e.ctl - e.atl); note = '<p class="muted" style="font-size:12px;margin-top:6px">Con las cargas de tu plan, tu forma el ' + fcLbl(e.d) + ' sería <b style="color:var(--text)">' + fcSgn(et) + '</b> (estimado).</p>'; }
  const tbl = '<details style="margin-top:8px"><summary class="muted" style="font-size:12px;cursor:pointer;min-height:32px">Ver tabla</summary><div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:6px"><thead><tr class="muted"><th align="left">Día</th><th align="right">Aptitud</th><th align="right">Fatiga</th><th align="right">Forma</th></tr></thead><tbody>' + rows.slice(-14).reverse().map((r) => '<tr style="border-top:1px solid var(--line)"><td>' + fcLbl(r.d) + '</td><td align="right">' + fcNum(r.ctl) + '</td><td align="right">' + fcNum(r.atl) + '</td><td align="right">' + fcSgn(r.ctl - r.atl) + '</td></tr>').join('') + '</tbody></table></div></details>';
  const rng = '<div class="row g6 wrap" role="group" aria-label="Periodo" style="margin-top:6px">' + [[30, '30 días'], [60, '60 días'], [90, '90 días']].map((x) => '<button type="button" class="chip" data-a="fcRange" data-v="' + x[0] + '" aria-pressed="' + ((o.range || 60) === x[0]) + '" style="min-height:36px;padding:0 12px;font-size:13px">' + x[1] + '</button>').join('') + '</div>';
  const legend = '<div class="row g16 wrap soft" style="font-size:13px;margin-top:6px"><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--accent2)"></i>Aptitud (CTL)</span><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--accent)"></i>Fatiga (ATL)</span>' + (two ? '<span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--text)"></i>Forma (TSB)</span>' : '') + '</div>';
  return '<div class="fcw" data-fc="' + String(JSON.stringify(data)).replace(/"/g, '&quot;') + '" data-l="' + L + '" data-pw="' + PW + '" data-n="' + N + '" data-d0="' + d0 + '" data-nr="' + rows.length + '">' + (o.noRange ? '' : rng) + '' + head + s + legend + note + (o.canProj ? '<div style="margin-top:4px"><button type="button" class="fcsw" role="switch" aria-checked="' + !!o.projOn + '" data-a="fcProj"><span class="fcsw-t"><i></i></span><span>Proyección del plan</span></button></div>' : '') + (o.noTable ? '' : tbl) + '</div>';
}
/* Lectura al tocar o pasar el dedo por el grafico */
function fcMove(e) {
  const w = e.target.closest && e.target.closest('.fcw'); if (!w || !e.target.classList.contains('fc-hit')) return;
  const svg = w.querySelector('.fc-svg'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, sx = vb.width / r.width, x = (e.clientX - r.left) * sx;
  const L = +w.dataset.l, PW = +w.dataset.pw, N = +w.dataset.n, i0 = Math.max(0, Math.min(N - 1, Math.round((x - L) * (N - 1) / PW)));
  let data; try { data = JSON.parse(w.dataset.fc); } catch (er) { return; }
  const dd = fcDate(w.dataset.d0); dd.setDate(dd.getDate() + i0); const key = fcYmd(dd), row = data.filter((q) => q[0] === key)[0]; if (!row) return;
  const xx = L + i0 * PW / Math.max(N - 1, 1), ln = w.querySelector('.fc-x'); ln.setAttribute('x1', xx); ln.setAttribute('x2', xx); ln.setAttribute('opacity', '.5');
  w.querySelector('.fc-rd').textContent = fcLbl(row[0]); w.querySelector('.fc-rc').textContent = fcNum(row[1]); w.querySelector('.fc-ra').textContent = fcNum(row[2]); w.querySelector('.fc-rt').textContent = fcSgn(row[1] - row[2]);
}

/* Proyeccion hasta la meta del plan (o hasta la ultima sesion), maximo 60 dias. */
function fcProjFor(plan, last) {
  if (!plan || !plan.sessions || !last) return { proj: [], goal: null };
  const today = last.d, goal = plan.goal && plan.goal.date && plan.goal.date > today ? plan.goal : null;
  let end = goal ? goal.date : Object.keys(plan.sessions).filter((k) => k > today).sort().pop();
  if (!end) return { proj: [], goal: null };
  return { proj: fcProject(last, plan.sessions, end), goal };
}

const fcProjOn = () => { if (UI.fp == null) { let v = null; try { v = localStorage.getItem('camino.fproj'); } catch (e) { /* sin almacenamiento */ } UI.fp = v !== '0'; } return UI.fp; };
const fcOpts = (plan, fi) => { const pj = fcProjFor(plan, fi.last), can = pj.proj.length > 0, on = can && fcProjOn(); return { range: UI.fr || 60, proj: on ? pj.proj : [], goal: on ? pj.goal : null, canProj: can, projOn: on }; };
/* Salidas por semana: dias con actividad, ultimas 8 semanas, contra lo planificado. */
function weekBars(h, plan) {
  const mon = (d) => { const t = parse(d), m = new Date(t); m.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return ymd(m); };
  const wk = {}, seen = {};
  ((h && h.acts) || []).forEach((d) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || seen[d]) return; seen[d] = 1; const k = mon(d); wk[k] = (wk[k] || 0) + 1; });
  const pw = {}; if (plan && plan.sessions) Object.keys(plan.sessions).forEach((d) => { const k = mon(d); pw[k] = (pw[k] || 0) + 1; });
  const now = parse(off(0)), mon0 = new Date(now); mon0.setDate(now.getDate() - ((now.getDay() + 6) % 7)); const weeks = [];
  for (let i = 7; i >= 0; i--) { const m = new Date(mon0); m.setDate(mon0.getDate() - i * 7); const k = ymd(m); weeks.push({ k, v: wk[k] || 0, p: pw[k] || 0, cur: i === 0 }); }
  const mxw = Math.max.apply(null, weeks.map((x) => Math.max(x.v, x.p)).concat([2])), step = mxw <= 6 ? 2 : (mxw <= 12 ? 4 : 5), top = Math.ceil(mxw / step) * step;
  const W = 340, L = 30, R = 10, PW = W - L - R, T = 22, H = 96, B = T + H, slot = PW / 8, bw = Math.min(24, slot - 10);
  const done = weeks.filter((x) => !x.cur), avg = done.reduce((a, x) => a + x.v, 0) / Math.max(done.length, 1), bestV = Math.max.apply(null, weeks.map((x) => x.v));
  const Y = (v) => B - v / top * H;
  const lab = (k) => { const d = parse(k); return d.getDate() + ' ' + FC_MES[d.getMonth()]; };
  const txt = (x) => 'Semana del ' + lab(x.k) + ': ' + x.v + (x.v === 1 ? ' salida' : ' salidas') + (x.p ? ' · plan ' + x.p : '') + (x.cur ? ' (en curso)' : '');
  let s = '<svg viewBox="0 0 ' + W + ' ' + (B + 24) + '" width="100%" role="img" aria-label="Salidas por semana. ' + esc(weeks.map(txt).join('. ')) + '" style="display:block">';
  for (let v = 0; v <= top; v += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--line)" stroke-width="1"></line><text x="' + (L - 6) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + v + '</text>';
  weeks.forEach((x, i) => {
    const cx = L + slot * i + slot / 2, x0 = cx - bw / 2;
    if (x.p) s += '<rect x="' + x0.toFixed(1) + '" y="' + Y(x.p).toFixed(1) + '" width="' + bw + '" height="' + (B - Y(x.p)).toFixed(1) + '" rx="4" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3" opacity=".8"></rect>';
    if (x.v) { const y = Y(x.v), r = Math.min(4, (B - y) / 2); s += '<path class="wb-bar" d="M' + x0.toFixed(1) + ',' + B + 'L' + x0.toFixed(1) + ',' + (y + r).toFixed(1) + 'Q' + x0.toFixed(1) + ',' + y.toFixed(1) + ' ' + (x0 + r).toFixed(1) + ',' + y.toFixed(1) + 'L' + (x0 + bw - r).toFixed(1) + ',' + y.toFixed(1) + 'Q' + (x0 + bw).toFixed(1) + ',' + y.toFixed(1) + ' ' + (x0 + bw).toFixed(1) + ',' + (y + r).toFixed(1) + 'L' + (x0 + bw).toFixed(1) + ',' + B + 'Z" fill="' + (x.cur ? 'var(--accent)' : 'var(--accent2)') + '" opacity="' + (x.cur ? 1 : .55) + '"></path>'; }
    if (x.cur || (x.v === bestV && bestV > 0)) s += '<text x="' + cx.toFixed(1) + '" y="' + (Y(Math.max(x.v, x.p)) - 5).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + (x.cur ? 'var(--accent)' : 'var(--soft)') + '">' + x.v + '</text>';
    if (i % 2 === 1 || x.cur) s += '<text x="' + cx.toFixed(1) + '" y="' + (B + 16) + '" text-anchor="middle" font-size="10" fill="' + (x.cur ? 'var(--text)' : 'var(--muted)') + '"' + (x.cur ? ' font-weight="700"' : '') + '>' + (x.cur ? 'Esta' : lab(x.k)) + '</text>';
    s += '<rect class="wb-hit" x="' + (cx - slot / 2).toFixed(1) + '" y="' + (T - 14) + '" width="' + slot.toFixed(1) + '" height="' + (H + 40) + '" fill="transparent" data-t="' + esc(txt(x)) + '"></rect>';
  });
  if (done.some((x) => x.v) && avg > 0) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(avg).toFixed(1) + '" y2="' + Y(avg).toFixed(1) + '" stroke="var(--text)" stroke-width="1" opacity=".55"></line>';
  s += '</svg>';
  const cur = weeks[7], hasPlan = weeks.some((x) => x.p);
  return '<div class="wbw"><div class="wb-read" aria-live="polite" style="font-size:13px;min-height:20px">' + esc(txt(cur)) + '</div>' + s
    + '<div class="row g16 wrap soft" style="font-size:12px;margin-top:4px"><span class="row g6"><i style="display:block;width:12px;height:12px;border-radius:3px;background:var(--accent)"></i>Esta semana</span><span class="row g6"><i style="display:block;width:12px;height:12px;border-radius:3px;background:var(--accent2);opacity:.55"></i>Semanas anteriores</span>' + (hasPlan ? '<span class="row g6"><i style="display:block;width:12px;height:12px;border-radius:3px;border:1.5px dashed var(--muted)"></i>Plan</span>' : '') + (avg > 0 && done.some((x) => x.v) ? '<span class="row g6"><i style="display:block;width:14px;height:2px;background:var(--text);opacity:.55"></i>Promedio ' + (Math.round(avg * 10) / 10).toLocaleString('es-CL') + '</span>' : '') + '</div></div>';
}
function wbMove(e) {
  const t = e.target; if (!t || !t.classList || !t.classList.contains('wb-hit')) return;
  const w = t.closest('.wbw'), r = w && w.querySelector('.wb-read'); if (r) r.textContent = t.getAttribute('data-t') || '';
}
function histBlock(a) {
  const h = ST.athHist[a.id], fi = formaInfo(h);
  if (!fi) return '<div><div class="eyebrow">Forma y carga</div><p class="muted" style="font-size:13px;margin-top:6px">Aún sin historial. Se sincroniza solo desde intervals.icu o puedes cargarlo en “Gestionar a ' + esc(a.first) + '”.</p></div>';
  const tsb = fi.tsb, lectura = tsb <= -25 ? 'muy cargado: cuida la recuperación' : (tsb <= -10 ? 'cargado, en zona de trabajo' : (tsb <= 5 ? 'equilibrado' : (tsb <= 20 ? 'fresco' : 'muy fresco')));
  return '<div><div class="eyebrow">Forma y carga · ' + fi.ds.length + ' días</div>' + formaChart(fi.ds, fcOpts(ST.athPlan[a.id], fi))
    + '<p class="soft" style="font-size:15px;margin-top:8px">Forma (TSB) ' + (tsb > 0 ? '+' : '') + tsb + ' al ' + esc(fi.last.d) + ': ' + lectura + '.</p>'
    + '<div class="eyebrow" style="margin-top:14px">Salidas por semana · últimas 8</div>' + weekBars(h, ST.athPlan[a.id])
    + '<div class="muted" style="font-size:12px;margin-top:6px">Datos de intervals.icu' + (h.updatedAt ? ' · cargado ' + relTime(h.updatedAt) : '') + '. De Strava llegan solo las fechas de las salidas, sin duración ni potencia.</div></div>';
}
const formaLectura = (tsb) => (tsb <= -25 ? 'Vienes con mucha carga. Prioriza dormir, comer bien y bajar la intensidad.' : (tsb <= -10 ? 'Vienes cargado, y es normal cuando se entrena: tu cuerpo está asimilando el trabajo.' : (tsb <= 5 ? 'Carga y descanso están en un buen equilibrio.' : (tsb <= 20 ? 'Tus piernas vienen frescas: buen momento para rendir.' : 'Vienes muy fresco. Mantén algo de actividad suave para no enfriarte.'))));
function formaCard(fi, link) {
  const t = fi.tsb;
  return '<section class="card col g10" aria-label="Tu forma"><div class="row between"><div class="eyebrow">Tu forma</div>' + (link ? '<a href="#datos" class="muted" style="font-size:13px;text-decoration:underline">Ver mis datos</a>' : '') + '</div><div class="row g16" style="align-items:flex-end"><div class="col"><span class="num" style="font-size:48px;color:var(--accent)">' + (t > 0 ? '+' : '') + t + '</span><span class="muted" style="font-size:12px">Forma</span></div><div class="col"><span class="num" style="font-size:28px">' + f1(fi.last.ctl) + '</span><span class="muted" style="font-size:12px">Aptitud</span></div><div class="col"><span class="num" style="font-size:28px">' + f1(fi.last.atl) + '</span><span class="muted" style="font-size:12px">Fatiga</span></div></div><p class="soft" style="font-size:15px">' + formaLectura(t) + '</p></section>';
}
/* ---------- Vista: Datos (historial del propio atleta) ---------- */
function viewDatos() {
  const a = meA(), fi = formaInfo(ST.myHist);
  let out = '<div class="inner"><div class="stack">' + head('Tu historial', 'Mis datos') + msgBanner();
  if (!fi) out += '<section class="card" aria-label="Forma y carga"><div class="eyebrow">Forma y carga</div><p class="soft" style="margin-top:8px">Tu coach cargará aquí tu historial de forma, fatiga y salidas. Mientras tanto, tus check-ins ya cuentan.</p></section>';
  else {
    out += formaCard(fi, false);
    out += '<section class="card" aria-label="Curva de forma"><div class="eyebrow">Aptitud y fatiga · ' + fi.ds.length + ' días</div>' + formaChart(fi.ds, fcOpts(ST.myPlan, fi))
      + '<p class="muted" style="font-size:13px;margin-top:10px"><b>Aptitud</b>: la base que has construido entrenando. <b>Fatiga</b>: el cansancio de tus últimos días. <b>Forma</b>: aptitud menos fatiga; positiva significa piernas frescas, negativa significa que estás cargando trabajo.</p></section>';
    out += '<section class="card" aria-label="Salidas por semana"><div class="eyebrow">Salidas por semana · últimas 8</div>' + weekBars(ST.myHist, ST.myPlan) + '<p class="muted" style="font-size:12px;margin-top:8px">Cuenta los días con actividad. La barra naranja es la semana en curso y el contorno punteado, lo que marcaba tu plan. Datos de intervals.icu' + (ST.myHist.updatedAt ? ', cargados ' + relTime(ST.myHist.updatedAt) : '') + '.</p></section>';
  }
  const cks = a.checkins.slice().sort((x, y) => (x.date < y.date ? 1 : (x.date > y.date ? -1 : 0))).slice(0, 10), sk = streak(a);
  out += '<section class="card" aria-label="Bienestar"><div class="row between"><div class="eyebrow">Tu bienestar · 7 días</div><div class="muted" style="font-size:13px">Racha: ' + sk.n + (sk.n === 1 ? ' día' : ' días') + '</div></div><div style="margin-top:8px">' + dualChart(a) + '</div></section>';
  out += '<section class="card col g10" aria-label="Tus check-ins"><div class="eyebrow">Tus últimos check-ins</div>' + (cks.length ? cks.map((c) => {
    const d = parse(c.date), sc = score(c), b = band(sc);
    return '<div class="row between g12" style="align-items:flex-start;padding-top:8px;border-top:1px solid var(--line)"><div class="col g4" style="min-width:0"><span style="font-weight:600">' + cap(WD[d.getDay()]) + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + '</span><span class="muted" style="font-size:13px">' + (c.type === 'actividad' ? (c.activity && c.activity.name ? esc(c.activity.name) : 'Actividad') : (c.type === 'descanso' ? 'Descanso' : 'Bienestar')) + ' · Ánimo ' + esc(at(MOODS, c.mood - 1).toLowerCase()) + (c.rpe ? ' · RPE ' + c.rpe : '') + '</span></div><span style="font-weight:600;font-size:14px;color:' + b.color + ';flex:none">' + (sc == null ? '–' : sc + ' · ' + b.label) + '</span></div>';
  }).join('') : '<p class="soft">Aún no hay check-ins. Tu primer registro aparecerá aquí.</p>') + '</section>';
  return out + '</div></div>';
}
function histForm(a) {
  if (!UI.histDraft || UI.histDraft.id !== a.id) UI.histDraft = { id: a.id, text: '' };
  return '<div class="col g12 mform"><div class="info" role="note">' + infoIcon() + '<span>Normalmente no necesitas hacer esto: el historial se sincroniza solo cada hora. Úsalo para cargarlo a mano; reemplaza el anterior.</span></div><label for="histText" class="muted" style="font-size:13px">Historial en JSON (days con d, ctl y atl; acts con fechas)</label><textarea id="histText" spellcheck="false" placeholder="{ &quot;days&quot;: [{ &quot;d&quot;: &quot;2026-10-27&quot;, &quot;ctl&quot;: 29.8, &quot;atl&quot;: 49.7 }], &quot;acts&quot;: [&quot;2026-10-25&quot;] }" style="min-height:200px;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + esc(UI.histDraft.text) + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="saveHist" style="justify-content:center;width:auto;padding:0 20px;min-height:48px"' + (UI.busy ? ' disabled' : '') + '>Guardar historial</button><button type="button" class="chip" data-a="histToggle">Cerrar</button></div></div>';
}
function parseHist(text) {
  let o; try { o = JSON.parse(text); } catch (e) { return { err: 'El texto no es un JSON válido. Revisa comillas y comas.' }; }
  const D = /^\d{4}-\d{2}-\d{2}$/;
  if (!o || typeof o !== 'object' || !Array.isArray(o.days)) return { err: 'Falta la lista days con d, ctl y atl.' };
  if (o.days.length > 120) return { err: 'Hay demasiados días (máximo 120).' };
  const days = [];
  for (const x of o.days) { if (!x || !D.test(x.d || '') || !(x.ctl >= 0 && x.ctl <= 500) || !(x.atl >= 0 && x.atl <= 500)) return { err: 'Revisa el día ' + (x && x.d) + ': fecha AAAA-MM-DD y ctl/atl entre 0 y 500.' }; days.push({ d: x.d, ctl: Math.round(x.ctl * 10) / 10, atl: Math.round(x.atl * 10) / 10 }); }
  const acts = o.acts == null ? [] : o.acts;
  if (!Array.isArray(acts) || acts.length > 200 || acts.some((d) => !D.test(d))) return { err: 'acts debe ser una lista de hasta 200 fechas AAAA-MM-DD.' };
  return { hist: { days, acts } };
}
const PLAN_TEMPLATE = { goal: { name: 'Nombre de la meta', date: 'AAAA-MM-DD', dateText: '1 de noviembre', detail: 'lugar · distancia' }, phases: [{ n: 'Base', s: 'Semanas 1 a 4 · completada', to: 'AAAA-MM-DD' }], sessions: { 'AAAA-MM-DD': { name: 'Rodillo Z2', min: 45, km: 0, load: 35, note: 'Opcional' } }, notes: { 'AAAA-MM-DD': 'Mensaje para ese día' } };
const planToText = (pl) => { const o = pl ? { goal: pl.goal, phases: pl.phases, sessions: pl.sessions, notes: pl.notes } : PLAN_TEMPLATE; try { return JSON.stringify(o, null, 1); } catch (e) { return ''; } };
function planForm(a) {
  const pl = ST.athPlan[a.id];
  if (!UI.planDraft || UI.planDraft.id !== a.id) UI.planDraft = { id: a.id, text: planToText(pl) };
  return '<div class="col g12 mform"><div class="info" role="note">' + infoIcon() + '<span>Pega el plan en formato JSON: meta, fases, sesiones por fecha y notas por día. El atleta lo ve en Hoy y en Ruta.</span></div><label for="planText" class="muted" style="font-size:13px">Plan en JSON</label><textarea id="planText" spellcheck="false" style="min-height:260px;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + esc(UI.planDraft.text) + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="savePlan" style="justify-content:center;width:auto;padding:0 20px;min-height:48px"' + (UI.busy ? ' disabled' : '') + '>Guardar plan</button><button type="button" class="chip" data-a="planToggle">Cerrar</button></div></div>';
}
const dShort = (k) => { const d = parse(k); return d.getDate() + ' ' + FC_MES[d.getMonth()]; };
const mrow = (dot, title, lines, btn) => '<div class="mrow"><div class="col grow g4" style="min-width:0"><span class="row g8" style="font-weight:600;font-size:16px;align-items:center"><span class="dot" style="background:' + dot + ';flex:none" aria-hidden="true"></span>' + title + '</span>' + lines.map((l) => '<span class="muted" style="font-size:13px">' + l + '</span>').join('') + '</div>' + btn + '</div>';
/* Gestion del atleta: plan, historial y vista, en una sola tarjeta. */
function manageCard(a) {
  const pl = ST.athPlan[a.id], h = ST.athHist[a.id], today = off(0);
  let out = '<section class="card col g4" aria-label="Gestionar atleta" style="padding-bottom:8px"><div class="eyebrow" style="margin-bottom:6px">Gestionar a ' + esc(a.first) + '</div>';
  // plan
  let dot = 'var(--muted)', lines = ['Sin plan cargado', 'Pégalo en JSON y lo verá en Hoy y Ruta'], btn = '<button type="button" class="chip" data-a="planToggle" style="border-color:var(--accent);color:var(--accent);font-weight:600">' + (UI.planOpen ? 'Cerrar' : 'Cargar plan') + '</button>';
  if (pl) {
    const fut = Object.keys(pl.sessions || {}).filter((k) => k >= today).sort(), g = pl.goal;
    dot = fut.length ? 'var(--good)' : 'var(--warn)'; lines = [];
    if (g) lines.push(esc(g.name) + (g.date >= today ? ' · en ' + diffDays(today, g.date) + ' días' : ' · ya pasó'));
    lines.push(fut.length ? fut.length + (fut.length === 1 ? ' sesión' : ' sesiones') + ' por delante · próxima el ' + dShort(fut[0]) : 'Sin sesiones por delante: conviene cargar el siguiente bloque');
    if (pl.updatedAt) lines.push('Actualizado ' + relTime(pl.updatedAt));
    btn = '<button type="button" class="chip" data-a="planToggle">' + (UI.planOpen ? 'Cerrar' : 'Editar') + '</button>';
  }
  out += mrow(dot, 'Plan', lines, btn) + (UI.planOpen ? planForm(a) : '');
  // historial
  const nd = histDays(h).length, na = h && Array.isArray(h.acts) ? h.acts.length : 0, age = h && h.updatedAt ? diffDays(ymd(new Date(h.updatedAt)), today) : null;
  dot = !h ? 'var(--muted)' : (age != null && age > 3 ? 'var(--warn)' : 'var(--good)');
  lines = h ? [nd + ' días de forma · ' + na + ' salidas', (h.updatedAt ? 'Sincronizado ' + relTime(h.updatedAt) : 'Cargado a mano') + (age != null && age > 3 ? ' · desactualizado' : '')] : ['Sin historial aún', 'Se sincroniza solo cada hora'];
  out += mrow(dot, 'Historial de forma', lines, '<button type="button" class="chip" data-a="histToggle">' + (UI.histOpen ? 'Cerrar' : 'Cargar a mano') + '</button>') + (UI.histOpen ? histForm(a) : '');
  // vista del atleta
  out += mrow('var(--accent2)', 'Ver la app como ' + esc(a.first), ['Solo lectura: Hoy, Datos y Ruta tal como los ve'], '<button type="button" class="chip" data-a="verComo" data-v="' + esc(a.id) + '">Abrir</button>');
  return out + '</section>';
}
function parsePlan(text) {
  let o; try { o = JSON.parse(text); } catch (e) { return { err: 'El texto no es un JSON válido. Revisa comillas y comas.' }; }
  const D = /^\d{4}-\d{2}-\d{2}$/, str = (v, n) => typeof v === 'string' && v.length <= n;
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { err: 'El plan debe ser un objeto con meta, fases y sesiones.' };
  const out = {};
  if (o.goal != null) { const g = o.goal; if (!g || !str(g.name, 80) || !D.test(g.date || '') || !str(g.dateText || '', 40) || !str(g.detail || '', 120)) return { err: 'La meta necesita name y date con formato AAAA-MM-DD.' }; out.goal = { name: g.name, date: g.date, dateText: g.dateText || '', detail: g.detail || '' }; }
  out.phases = [];
  if (o.phases != null) { if (!Array.isArray(o.phases) || o.phases.length > 12) return { err: 'Las fases deben ser una lista de hasta 12.' }; for (const p of o.phases) { if (!p || !str(p.n, 60) || !str(p.s || '', 160) || (p.to != null && !D.test(p.to))) return { err: 'Cada fase necesita n, s y to con formato AAAA-MM-DD.' }; out.phases.push({ n: p.n, s: p.s || '', to: p.to || null }); } }
  out.sessions = {};
  if (o.sessions != null) { const ks = Object.keys(o.sessions); if (ks.length > 120) return { err: 'Hay demasiadas sesiones (máximo 120).' }; for (const k of ks) { const x = o.sessions[k]; if (!D.test(k) || !x || !str(x.name, 80) || !str(x.note || '', 400) || (x.min != null && !(x.min >= 0 && x.min <= 1000)) || (x.km != null && !(x.km >= 0 && x.km <= 1000)) || (x.load != null && !(x.load >= 0 && x.load <= 2000))) return { err: 'Revisa la sesión del ' + k + ': fecha AAAA-MM-DD, nombre y números válidos.' }; out.sessions[k] = { name: x.name, min: x.min == null ? null : Number(x.min), km: x.km == null ? 0 : Number(x.km), load: x.load == null ? null : Number(x.load), note: x.note || '' }; } }
  out.notes = {};
  if (o.notes != null) { for (const k of Object.keys(o.notes)) { if (!D.test(k) || !str(o.notes[k], 300)) return { err: 'Revisa la nota del ' + k + '.' }; out.notes[k] = o.notes[k]; } }
  return { plan: out };
}


/* ---------- Vista: Guía (como se llenan los datos) ---------- */
const GUIA = [
  { k: 'Hoy', t: 'Tu estado de hoy', ic: 'hoy', p: ['El círculo es un puntaje de 0 a 100 que sale de tu último check-in: ánimo, calidad del sueño, sensación de piernas y estrés. Se promedian y se muestra como semáforo.', '<b>70 o más</b>: listo para rodar. <b>50 a 69</b>: ve con calma. <b>Menos de 50</b>: hoy toca cuidarte y avisar a tu coach.', 'Si hoy no hiciste check-in, usa el de ayer o el último que tengas, y lo dice debajo.'] },
  { k: 'Check-in', t: 'Cómo se llena el check-in', ic: 'sueno', p: ['Lo llenas tú en Hoy, en 1 minuto. Hay tres tipos: <b>actividad</b> (saliste a entrenar), <b>bienestar</b> (cómo amaneciste) y <b>descanso</b>.', 'Si registras una molestia, tu coach la ve de inmediato y puede escribirte una nota. Esa nota aparece en Hoy.', 'Los check-ins son privados: solo los ven tú y tu coach. El equipo nunca ve tu bienestar ni tus molestias.'] },
  { k: 'Aptitud', t: 'Aptitud: lo que has construido', ic: 'datos', p: ['La aptitud (CTL) es tu base de entrenamiento. Es un promedio ponderado de tu carga de los últimos 42 días aproximadamente.', 'Sube lento, con semanas constantes, y baja lento si paras. Una sola salida larga casi no la mueve.', 'Más aptitud significa que tu cuerpo tolera más trabajo. Es la línea que más importa mirar en el largo plazo.'] },
  { k: 'Fatiga', t: 'Fatiga: el cansancio reciente', ic: 'racha', p: ['La fatiga (ATL) es el promedio de tu carga de los últimos 7 días aproximadamente.', 'Sube rápido con una salida dura y baja rápido con un par de días suaves. Es normal que se dispare después de un fin de semana largo.', 'Por sí sola no es mala: solo dice cuánto trabajo acumulaste esta semana.'] },
  { k: 'Forma', t: 'Forma: aptitud menos fatiga', ic: 'cinco', p: ['La forma (TSB) es la resta: aptitud menos fatiga. Es el número grande que ves en "Tu forma".', '<b>Positiva</b>: piernas frescas, buen momento para una prueba o carrera. <b>Cerca de cero</b>: equilibrio. <b>Negativa</b>: estás cargando trabajo, que es normal en bloques de construcción.', 'Si baja de -25, tu coach lo marca como alerta. Antes de una meta, el plan busca que llegues con forma positiva.'] },
  { k: 'Datos', t: 'De dónde salen los números', ic: 'datos', p: ['Aptitud, fatiga y salidas vienen de intervals.icu, donde se conectan tus actividades de Strava o Garmin. Un proceso automático las trae <b>cada hora</b> a Camino.', 'Las salidas por semana cuentan los días con actividad registrada. Los kilómetros y minutos no se traen desde Strava por una limitación de la conexión.', 'Tu bienestar, racha e insignias vienen solo de tus check-ins en Camino, no de intervals.icu.'] },
  { k: 'Semana', t: 'Tu semana', ic: 'semana', p: ['Cada columna es un día. El contorno punteado es lo que dice tu plan y el relleno es lo que ya hiciste.', 'Una sesión cuenta como hecha cuando haces un check-in de tipo <b>actividad</b> ese día.', 'El plan lo carga tu coach. Si no ves sesiones, es que aún no te carga ese bloque.'] },
  { k: 'Racha', t: 'Racha e insignias', ic: 'racha', p: ['<b>Racha</b>: días seguidos con check-in, de cualquier tipo. Si hoy aún no lo haces, cuenta desde ayer. Si saltas un día, vuelve a 0.', '<b>7 días seguidos</b>: siete días consecutivos con check-in. <b>Sueño parejo</b>: 5 noches de los últimos 7 con buen sueño. <b>Semana completa</b>: cumplir todas las sesiones del plan de esta semana. <b>Cinco actividades</b>: 5 actividades registradas en 14 días.', 'La barra de progreso de cada insignia dice cuánto te falta. Las que logras quedan encendidas.'] },
  { k: 'Camino', t: 'Tu camino recorrido', ic: 'ruta', p: ['En Ruta, "Ver mi resumen" muestra tres pantallas: tus <b>salidas registradas</b>, tu <b>mejor semana</b> y lo que ha hecho tu <b>equipo</b> este mes.', 'Las salidas salen del historial de intervals.icu y de tus check-ins de actividad. La mejor semana usa los minutos registrados, y si no hay minutos, usa la cantidad de salidas.', 'Mientras más constante seas con los check-ins, más completo queda el resumen.'] },
  { k: 'Equipo', t: 'Meta del equipo', ic: 'cabina', p: ['Cuando tu coach te asigna a GRNT o ZN, en Ruta ves los kilómetros del equipo y la meta del mes.', 'Esos kilómetros salen de lo que cada atleta anota en su check-in de actividad, no de intervals.icu. Por eso, si no anotas km, no suman.', 'El equipo ve solo kilómetros, metas e hitos. Nunca bienestar, molestias ni notas.'] }
];
function viewGuia() {
  const n = GUIA.length;
  const slides = GUIA.map((g, i) => '<article class="gslide" aria-roledescription="diapositiva" aria-label="' + (i + 1) + ' de ' + n + '"><div class="card col g12" style="min-height:100%"><div class="row g12" style="align-items:center"><span class="gic">' + (NAVIC[g.ic] ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + NAVIC[g.ic] + '</svg>' : icon(g.ic, 26, 'var(--accent)')) + '</span><div class="eyebrow">' + esc(g.k) + ' · ' + (i + 1) + ' de ' + n + '</div></div><h2 class="h2">' + esc(g.t) + '</h2>' + g.p.map((x) => '<p class="soft">' + x + '</p>').join('') + '</div></article>').join('');
  const dots = GUIA.map((g, i) => '<button type="button" class="gdot" data-a="guiaGo" data-v="' + i + '" aria-label="Ir a ' + esc(g.k) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>').join('');
  return '<div class="inner"><div class="stack">' + head('Cómo funciona Camino', 'Guía') + '<p class="muted" style="font-size:14px">Desliza hacia el lado para ver cómo se llena cada dato.</p><div class="gdots" id="gdots" role="group" aria-label="Diapositivas">' + dots + '</div><div class="gtrack" id="gtrack" tabindex="0">' + slides + '</div></div></div>';
}

/* ---------- Vista: Ajustes ---------- */
/* Fila de ajuste con interruptor: titulo y ayuda a la izquierda, interruptor a la derecha. */
const setRow = (title, sub, on, act, val) => '<button type="button" class="setrow" role="switch" aria-checked="' + !!on + '" data-a="' + act + '"' + (val != null ? ' data-v="' + val + '"' : '') + '><span class="col grow g4" style="min-width:0"><span style="font-weight:600;font-size:16px">' + title + '</span>' + (sub ? '<span class="muted" style="font-size:13px;font-weight:500">' + sub + '</span>' : '') + '</span><span class="fcsw-t" aria-hidden="true"><i></i></span></button>';
const initial = (n) => esc(String(n || '?').trim().charAt(0).toUpperCase() || '?');
function viewAjustes() {
  const p = ST.profile || {}, remOn = !!p.reminder, rem = p.reminder || PREF.lastRem || '19:30';
  let out = '<div class="inner"><div class="stack">' + head('Preferencias', 'Ajustes') + msgBanner();
  // perfil
  out += '<section class="card col g14" aria-label="Cuenta"><div class="row g14" style="align-items:center"><span class="avatar" aria-hidden="true">' + initial(p.name) + '</span><div class="col grow g4" style="min-width:0"><span style="font-weight:700;font-size:20px;overflow-wrap:anywhere">' + esc(p.name || '') + '</span><span class="muted" style="font-size:13px;overflow-wrap:anywhere">' + esc(p.email || (ST.user && ST.user.email) || '') + '</span></div></div><div class="row g8 wrap"><span class="tag out" style="color:var(--soft);border-color:var(--line)">' + (isCoach() ? 'Coach' : 'Atleta') + '</span>' + (p.team ? '<span class="tag out" style="color:var(--soft);border-color:var(--line)">Equipo ' + TEAMS[p.team] + '</span>' : '') + (p.pending ? '<span class="tag out" style="color:var(--warn);border-color:var(--warn)">Pendiente de asignación</span>' : '') + '</div></section>';
  // apariencia
  out += '<section class="card col g12" aria-label="Apariencia"><div class="eyebrow">Apariencia</div><div class="tones" role="group" aria-label="Tono visual">' + TONES.map((t) => '<button type="button" class="tone" data-a="tone" data-v="' + t.id + '" aria-pressed="' + (PREF.tone === t.id) + '"><span class="sw">' + t.sw.map((c) => '<i style="background:' + c + '"></i>').join('') + '</span><span class="col g4" style="text-align:left"><span style="font-weight:600">' + t.name + '</span><span class="muted" style="font-size:12px;font-weight:500">' + t.sub + '</span></span></button>').join('') + '</div>'
    + '<div class="setlist">' + setRow('Reducir animaciones', 'Quita transiciones y movimientos', !!PREF.calm, 'pref', 'calm') + '</div></section>';
  // avisos
  out += '<section class="card col g12" aria-label="Avisos"><div class="eyebrow">Check-in y avisos</div><div class="setlist">' + setRow('Recordatorio diario', remOn ? 'Todos los días a las ' + esc(rem) : 'Desactivado', remOn, 'remToggle')
    + (remOn ? '<div class="col g10" style="padding:4px 0 12px"><div class="chips" role="group" aria-label="Hora del recordatorio">' + ['07:00', '12:00', '19:30', '21:00'].map((h) => '<button type="button" class="chip" data-a="remSet" data-v="' + h + '" aria-pressed="' + (rem === h) + '" style="min-height:40px">' + h + '</button>').join('') + '</div><div class="row g10" style="align-items:center"><label for="reminder" class="muted" style="font-size:13px">Otra hora</label><input type="time" id="reminder" value="' + esc(rem) + '"></div><p class="muted" style="font-size:12px">La hora queda guardada en tu perfil. Los avisos llegarán en una próxima versión, con la app instalada.</p></div>' : '')
    + setRow('Vibración al enviar', 'Un toque suave al terminar tu check-in', PREF.haptic !== false, 'pref', 'haptic') + '</div></section>';
  // grafico
  out += '<section class="card col g12" aria-label="Datos y gráficos"><div class="eyebrow">Datos y gráficos</div><div class="setlist">' + setRow('Proyección del plan', 'Muestra en el gráfico de forma cómo llegarías a tu meta', fcProjOn(), 'fcProj') + '</div></section>';
  if (isCoach()) {
    const team = UI.metaTeam, m = ST.teamMeta[team] || {}, d = UI.metaDraft && UI.metaDraft.team === team ? UI.metaDraft : { team, goal: m.goal || KM_GOAL_DEFAULT, hito: m.hito || '' };
    out += '<section class="card col g12" aria-label="Meta del equipo"><div class="eyebrow">Meta e hito del equipo</div><div class="seggroup" role="group" aria-label="Equipo">' + Object.keys(TEAMS).map((t) => '<button type="button" data-a="metaTeam" data-v="' + t + '" aria-pressed="' + (team === t) + '">' + TEAMS[t] + '</button>').join('') + '</div><label for="metaGoal" class="soft">Meta del mes (km)</label><input class="field" id="metaGoal" type="number" inputmode="numeric" min="0" value="' + esc(d.goal) + '"><label for="metaHito" class="soft">Hito de la semana (opcional)</label><textarea id="metaHito" placeholder="Por ejemplo: Camila hizo su rodaje más largo">' + esc(d.hito) + '</textarea><button type="button" class="btn primary" data-a="saveMeta" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '>Guardar para ' + TEAMS[team] + '</button></section>';
  }
  out += '<section class="card col g12" aria-label="Privacidad"><div class="eyebrow">Quién ve qué</div><div class="col g10">' + [['Tu coach', 'Check-ins, molestias y notas'], ['Tu equipo', 'Solo kilómetros, insignias e hitos'], ['Nadie más', 'Tu bienestar y tus molestias son privados']].map((x) => '<div class="row g12" style="align-items:baseline"><span style="font-weight:600;min-width:84px">' + x[0] + '</span><span class="soft" style="font-size:14px">' + x[1] + '</span></div>').join('') + '</div></section>';
  out += '<details class="card" aria-label="Instalar"><summary style="font-weight:600;min-height:32px;cursor:pointer">Instalar en el teléfono</summary><p class="soft" style="font-size:15px;margin-top:8px">En Android: menú de Chrome y “Instalar aplicación”. En iPhone: Compartir y “Agregar a inicio”.</p></details>';
  if (DEMO) out += '<section class="card col g10" aria-label="Datos de demostración"><div class="eyebrow">Modo demostración</div><button type="button" class="chip" data-a="resetDemo" style="align-self:flex-start">Restablecer datos de demostración</button></section>';
  out += '<button type="button" class="btn ghost" data-a="logout" style="justify-content:center;border:1.5px solid var(--line)">Cerrar sesión</button>';
  return out + '</div></div>';
}

/* ---------- Overlay: check-in ---------- */
const stepList = (kind) => (kind === 'actividad' ? ['mood', 'infl', 'act', 'molestia'] : ['mood', 'infl', 'molestia']);
function flowHtml() {
  const f = UI.flow, d = f.d; let out = '<div class="inner"><div class="stack" style="gap:18px">';
  if (f.step === 'tipo') {
    const p = planFor(off(0)), todayDone = on(meA(), off(0)) && on(meA(), off(0)).type === 'actividad';
    out += '<div class="row between"><button type="button" class="link" data-a="close">Cerrar</button><span class="muted" style="font-size:13px">Check-in</span></div><div class="col g8"><h2 class="title">¿Qué quieres registrar hoy?</h2><p class="muted">Elige una opción para empezar.</p></div>';
    let opts = [{ k: 'actividad', t: 'Terminé una actividad', s: p ? 'Del plan de hoy: ' + planDesc(p) : 'Registra una salida que hiciste' }, { k: 'bienestar', t: 'Solo cómo me siento', s: 'Sin actividad hoy' }, { k: 'descanso', t: 'Día de descanso', s: 'También cuenta para tu constancia' }];
    if (!p || todayDone) opts = [opts[1], opts[0], opts[2]];
    out += '<div class="col g10">' + opts.map((o) => '<button type="button" class="opt" data-a="kind" data-v="' + o.k + '" aria-pressed="false"><span><span>' + o.t + '</span><span class="sub">' + esc(o.s) + '</span></span></button>').join('') + '</div>';
  } else {
    const steps = stepList(f.kind), cur = steps[f.i], n = steps.length;
    out += '<div class="row between"><button type="button" class="link" data-a="back">Atrás</button><span class="muted" style="font-size:13px">Paso ' + (f.i + 1) + ' de ' + n + (cur === 'mood' ? '' : ' · opcional') + '</span></div><div class="bar" aria-hidden="true"><i style="width:' + Math.round((f.i + 1) / n * 100) + '%;background:var(--accent)"></i></div>';
    if (cur === 'mood') out += '<div class="col g8"><h2 class="title">¿Cómo te sientes hoy?</h2><p class="muted">Toca una opción. Tarda unos segundos.</p></div><div class="col g10">' + MOODS.map((m, i) => '<button type="button" class="opt" data-a="mood" data-v="' + (i + 1) + '" aria-pressed="' + (d.mood === i + 1) + '"><span>' + m + '</span><span class="meter" aria-hidden="true"><i style="width:' + ((i + 1) * 20) + '%"></i></span></button>').join('') + '</div>';
    if (cur === 'infl') {
      out += '<div class="col g8"><h2 class="title">¿Qué influyó en tu día?</h2><p class="muted">Si quieres, cuéntanos más. Tu coach lo ve y ajusta contigo.</p></div>'
        + '<div class="col g10"><div style="font-weight:600">¿Cuánto dormiste?</div>' + chips('sleepH', SLEEPH, d.sleepH, 'Horas de sueño') + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Cómo dormiste?</div>' + chips('sleepQ', SLEEPQ, d.sleepQ, 'Calidad del sueño', (i) => i + 1) + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Cómo sientes las piernas?</div>' + chips('legs', LEGS, d.legs, 'Piernas') + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Y el estrés?</div>' + chips('stress', STRESS, d.stress, 'Estrés') + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Algo fuera de lo habitual ayer? <span class="muted" style="font-weight:500;font-size:14px">(comida abundante, alcohol, trasnoche)</span></div>' + chips('prev', ['No', 'Sí'], d.prev, 'Ayer', (i) => (i ? 'si' : 'no')) + '</div>'
        + (d.prev === 'si' ? '<div class="card col g14" style="background:var(--surface2);border:1.5px solid var(--line)" aria-label="Detalle de lo habitual de ayer"><div class="info" role="note">' + infoIcon() + '<span>Cuéntanos qué fue distinto. Así tu coach entiende cómo llegas hoy y no lo toma como un mal día.</span></div><div class="col g10"><div style="font-weight:600">¿Qué pasó? <span class="muted" style="font-weight:500;font-size:14px">(puedes marcar varias)</span></div>' + multiChips('prevItems', PREVT, d.prevItems, 'Qué pasó ayer') + '</div><div class="col g8"><label for="prevText" style="font-weight:600">¿Quieres explicar un poco más?</label><textarea id="prevText" placeholder="Opcional. Por ejemplo: cena tarde con la familia, dormí 4 horas">' + esc(UI.draft.prevText || '') + '</textarea></div></div>' : '')
        + '<div class="col g8"><button type="button" class="btn primary" data-a="next" style="justify-content:center">Continuar</button><button type="button" class="btn ghost" data-a="next">Omitir</button></div>';
    }
    if (cur === 'act') {
      const act = d.activity;
      out += '<div class="col g8"><h2 class="title">Tu actividad</h2>' + (act && act.min ? '<div class="card tight row g12" style="background:var(--surface2)"><span class="col grow"><span class="eyebrow">Del plan de hoy</span><span style="font-weight:600">' + esc(act.name) + '</span><span class="muted" style="font-size:14px">' + esc(planDesc({ name: '', min: act.min, km: act.km }).replace(/^ · /, '')) + '</span></span>' + check('var(--good)', 22) + '</div>' : '<p class="muted">Cuéntanos cómo fue.</p>') + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Qué tan duro fue? <span class="muted" style="font-weight:500;font-size:14px">(1 = muy fácil, 10 = máximo)</span></div><div class="grid5" role="group" aria-label="Esfuerzo percibido">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => '<button type="button" class="chip" data-a="set" data-g="rpe" data-v="' + v + '" aria-pressed="' + (d.rpe === v) + '" style="min-height:52px">' + v + '</button>').join('') + '</div></div>'
        + '<div class="col g10"><div style="font-weight:600">¿Cómo sentiste el clima?</div>' + chips('heat', HEAT, d.heat, 'Clima') + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Hubo un tramo bastante más duro que el resto?</div>' + chips('hard', ['No', 'Sí'], d.hard, 'Tramo duro', (i) => (i ? 'si' : 'no')) + '</div>'
        + (d.hard === 'si' ? '<div class="card col g14" style="background:var(--surface2);border:1.5px solid var(--line)" aria-label="Detalle del tramo duro"><div class="info" role="note">' + infoIcon() + '<span>Cuéntanos un poco más de ese tramo. Ayuda a tu coach a ajustar las próximas sesiones.</span></div><div class="col g10"><div style="font-weight:600">¿Qué lo hizo duro?</div>' + chips('hardType', HARDT, d.hardType, 'Tipo de tramo', (i, l) => l) + '</div><div class="col g10"><div style="font-weight:600">¿Cuánto duró?</div>' + chips('hardDur', HARDD, d.hardDur, 'Duración del tramo', (i, l) => l) + '</div><div class="col g10"><div style="font-weight:600">¿Cómo lo terminaste?</div>' + chips('hardEnd', HARDE, d.hardEnd, 'Cómo terminaste', (i, l) => l) + '</div></div>' : '')
        + '<div class="col g8"><button type="button" class="btn primary" data-a="next" style="justify-content:center">Continuar</button><button type="button" class="btn ghost" data-a="next">Omitir</button></div>';
    }
    if (cur === 'molestia') {
      out += '<div class="col g8"><h2 class="title">¿Alguna molestia?</h2><p class="muted">Si hay, dinos dónde y cuánto. Es lo que más ayuda a tu coach.</p></div>' + chips('painYes', ['Ninguna', 'Sí, tengo una'], d.painYes, 'Molestia', (i) => (i ? 'si' : 'no'));
      if (d.painYes === 'si') {
        const zs = d.zones || [];
        out += '<div class="col g10"><div class="row between g8"><div style="font-weight:600">Zona</div><span class="muted" style="font-size:13px;font-weight:600" aria-live="polite">' + zs.length + ' de 3</span></div><div class="info" role="note">' + infoIcon() + '<span>Puedes marcar hasta 3 zonas si la molestia se siente en más de un lugar. Toca otra vez una zona para quitarla.</span></div><div class="chips" role="group" aria-label="Zonas">' + ZONES.map((z) => { const o = zs.indexOf(z) >= 0; return '<button type="button" class="chip" data-a="zone" data-v="' + z + '" aria-pressed="' + o + '"' + (!o && zs.length >= 3 ? ' style="opacity:.45"' : '') + '>' + z + '</button>'; }).join('') + '</div></div>'
          + '<div class="col g10"><div style="font-weight:600">Lado</div>' + chips('side', SIDES, d.side, 'Lado', (i, l) => l) + '</div><div class="col g10"><div style="font-weight:600">Intensidad</div>' + chips('level', LEVELS, d.level, 'Intensidad', (i, l) => l) + '</div>'
          + (d.level === 'Fuerte' || d.level === 'Moderada' ? '<div class="info" role="note">' + infoIcon() + '<span>' + (d.level === 'Fuerte' ? 'Una molestia fuerte merece atención. Tu coach la verá hoy, pero si te limita o aumenta, consulta también a un profesional de salud.' : 'Tu coach verá esta molestia hoy y ajustará la carga. Si empeora, avísale y considera consultar a un profesional de salud.') + '</span></div>' : '');
      }
      out += '<div class="col g8"><label for="comment" style="font-weight:600">¿Algo más que quieras contarle a tu coach?</label><textarea id="comment" placeholder="Opcional">' + esc(UI.draft.comment) + '</textarea></div><div class="col g8"><button type="button" class="btn primary" data-a="send" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '>' + (UI.busy ? 'Enviando…' : 'Enviar check-in') + '</button></div>';
    }
  }
  return out + '</div></div>';
}

const ckActions = () => {
  const c = on(meA(), off(0)); if (!c) return '';
  if (UI.confirmDel) return '<section class="card col g10" aria-label="Borrar check-in" style="border:1.5px solid var(--bad)"><div class="h3">¿Borrar el check-in de hoy?</div><p class="soft" style="font-size:14px">Se elimina de tu historial y tu coach dejará de verlo. Después puedes hacer uno nuevo.</p><div class="row g8 wrap"><button type="button" class="chip" data-a="delCk" style="border-color:var(--bad);color:var(--bad)">Sí, borrar</button><button type="button" class="chip" data-a="delNo">Cancelar</button></div></section>';
  return '<div class="row g8 wrap"><button type="button" class="chip" data-a="editCk">Corregir check-in</button><button type="button" class="chip" data-a="delAsk">Borrar check-in</button></div>';
};
function feedbackHtml() {
  const a = meA(), c = UI.feedback && UI.feedback.checkin ? UI.feedback.checkin : on(a, off(0)), newB = UI.feedback ? UI.feedback.newBadges : [];
  if (!c) return '';
  const st = streak(a); let dots = '';
  for (let k = -6; k <= 0; k++) {
    const ci = on(a, off(k)); let bg = 'transparent', bd = 'var(--muted)';
    if (ci && ci.type === 'descanso') { bg = 'transparent'; bd = 'var(--accent)'; } else if (ci) { bg = 'var(--accent)'; bd = 'var(--accent)'; }
    if (k === 0 && ci) { bg = 'var(--good)'; bd = 'var(--good)'; }
    dots += '<i style="flex:1;height:10px;border-radius:5px;border:1.5px solid ' + bd + ';background:' + bg + '"></i>';
  }
  const n = lastNote(a);
  let out = '<div class="inner"><div class="stack"><div class="row g14 pop"><div class="row" style="width:56px;height:56px;border-radius:50%;justify-content:center;background:var(--good-soft);border:1.5px solid var(--good);flex:none">' + check('var(--good)', 28) + '</div><div class="col g4"><h2 class="h2" style="font-size:34px">Listo, gracias ' + esc(a.first) + '</h2><div class="muted" style="font-size:14px">Check-in enviado a tu coach</div></div></div><section class="card"><div class="eyebrow">Lo que vemos</div><p style="margin-top:8px;font-size:17px">' + esc(insightFor(c)) + '</p></section>';
  if (newB && newB.length) out += newB.map((b) => '<section class="card row g14 pop" style="border:1.5px solid var(--accent);background:var(--accent-soft)"><div class="row" style="width:56px;height:56px;border-radius:50%;justify-content:center;border:2px solid var(--accent);flex:none">' + icon(b.id, 28, 'var(--accent)') + '</div><div class="col g4"><div class="eyebrow" style="color:var(--accent)">Nueva insignia</div><div class="h3">' + esc(b.label) + '</div></div></section>').join('');
  out += '<section class="card"><div class="row between g8" style="align-items:baseline"><div class="eyebrow">Tu ánimo · 7 días</div><div class="muted" style="font-size:13px">hoy: ' + at(MOODS, c.mood - 1).toLowerCase() + '</div></div><div style="margin-top:10px">' + spark(a) + '</div></section><section class="card"><div class="eyebrow">Tu constancia</div><div class="row g8" style="margin-top:12px" aria-hidden="true">' + dots + '</div><p class="soft" style="margin-top:12px">' + st.n + (st.n === 1 ? ' día' : ' días') + ' seguidos. Los días de descanso cuentan.</p></section>';
  if (n) out += '<section class="card"><div class="eyebrow">Nota de tu coach · ' + relTime(n.at) + '</div><p class="soft" style="margin-top:8px">“' + esc(n.text) + '”</p></section>';
  out += ckActions();
  return out + '<div class="col g8"><a href="#ruta" data-a="closeFb" class="btn primary"><span>Ver mi ruta</span>' + arrow() + '</a><button type="button" class="btn ghost" data-a="closeFb">Volver a Hoy</button></div></div></div>';
}
const overlayHtml = () => (UI.flow ? flowHtml() : (UI.feedback ? feedbackHtml() : ''));

/* ---------- Historia: tu camino recorrido ---------- */
function bestWeekMin(a) {
  const w = {};
  a.checkins.forEach((c) => { if (c.type === 'actividad' && c.activity && c.activity.min) { const d = parse(c.date), mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = ymd(mon); w[k] = (w[k] || 0) + c.activity.min; } });
  const v = Object.keys(w).map((k) => w[k]); return v.length ? Math.max.apply(null, v) : 0;
}
/* Salidas: dias con actividad del historial sincronizado + dias con check-in de actividad (sin repetir). */
function outingDays(a) {
  const set = {};
  const h = ST.myHist;
  if (h && Array.isArray(h.acts)) h.acts.forEach((d) => { if (typeof d === 'string') set[d.slice(0, 10)] = 1; });
  a.checkins.forEach((c) => { if (c.type === 'actividad') set[c.date] = 1; });
  return Object.keys(set).sort();
}
function bestWeekOutings(days) {
  const w = {}; let max = 0;
  days.forEach((ds) => { const d = parse(ds), mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = ymd(mon); w[k] = (w[k] || 0) + 1; if (w[k] > max) max = w[k]; });
  return max;
}
function storyHtml() {
  if (UI.story == null) return '';
  const a = meA(), od = outingDays(a), nOut = od.length, total = a.checkins.length, bw = bestWeekMin(a), bwo = bestWeekOutings(od), t = myTeam() ? teamTotals(myTeam()) : null;
  const first = od.length ? od[0] : null, spanDays = first ? Math.max(1, diffDays(first, off(0)) + 1) : 0;
  const s0 = nOut
    ? { big: String(nOut), unit: nOut === 1 ? 'salida registrada' : 'salidas registradas', line: 'En ' + spanDays + ' días de historia' + (total ? ' y ' + total + (total === 1 ? ' check-in' : ' check-ins') : '') + '. Tu constancia es lo que más construye.' }
    : { big: String(total), unit: total === 1 ? 'check-in' : 'check-ins', line: 'Cuando se sumen tus salidas, aquí verás todo lo que has construido.' };
  const s1 = bw
    ? { big: Math.floor(bw / 60) + ' h ' + pad(bw % 60), unit: 'de actividad', line: 'Sostuviste el volumen y te recuperaste. Esa es tu base para la meta.' }
    : (bwo ? { big: String(bwo), unit: bwo === 1 ? 'salida en tu mejor semana' : 'salidas en tu mejor semana', line: 'Sostuviste el volumen y te recuperaste. Esa es tu base para la meta.' } : { big: '–', unit: 'aún sin datos', line: 'Cuando registres actividades, aquí verás tu semana más larga.' });
  const s2 = t
    ? (t.members ? { big: t.km.toLocaleString('es-CL'), unit: 'km juntos este mes', line: 'Entre ' + t.members + (t.members === 1 ? ' atleta' : ' atletas') + ' ya van al ' + Math.min(100, Math.round(t.km / t.goal * 100)) + '% de la meta del mes. Cada salida suma.' }
        : { big: '0', unit: 'km juntos este mes', line: 'El equipo parte desde cero este mes. Cada check-in con km suma a la meta de ' + t.goal.toLocaleString('es-CL') + ' km.' })
    : { big: '–', unit: 'sin equipo aún', line: 'Cuando tu coach te asigne a un equipo verás aquí lo que logran juntos.' };
  const sl = [
    Object.assign({ c: 's0', k: 'Tu camino hasta hoy', btn: 'Siguiente' }, s0),
    Object.assign({ c: 's1', k: 'Tu semana más larga', btn: 'Siguiente' }, s1),
    Object.assign({ c: 's2', k: 'Tu equipo', btn: 'Terminar' }, s2)
  ];
  const s = sl[UI.story];
  return '<div class="story ' + s.c + '" role="dialog" aria-label="Tu camino recorrido"><div class="inner"><div class="row g8" aria-hidden="true">' + sl.map((x, i) => '<i style="flex:1;height:4px;border-radius:2px;background:currentColor;opacity:' + (i <= UI.story ? 1 : .3) + '"></i>').join('') + '</div><div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="x" data-a="storyClose">Cerrar</button></div><div class="col g10" style="flex:1;justify-content:center"><div style="font-size:13px;letter-spacing:.12em;font-weight:600;text-transform:uppercase">' + s.k + '</div><div class="bigv">' + esc(s.big) + '</div><div style="font-family:var(--font-d);font-weight:600;font-size:34px;line-height:1.1">' + s.unit + '</div><p style="font-size:19px;margin-top:12px;line-height:1.45">' + esc(s.line) + '</p></div><button type="button" class="sbtn" data-a="storyNext">' + s.btn + '</button></div></div>';
}

/* ---------- Render ---------- */
function applyPrefs() { const r = document.documentElement; if (PREF.calm) r.setAttribute('data-calm', ''); else r.removeAttribute('data-calm'); }
function applyTone() { const r = document.documentElement; if (PREF.tone === 'auto') r.removeAttribute('data-tone'); else r.setAttribute('data-tone', PREF.tone); }
const VIEWS = { hoy: viewHoy, datos: viewDatos, ruta: viewRuta, cabina: viewCabina, guia: viewGuia, ajustes: viewAjustes };
let softPending = false;
function soft() { const t = document.activeElement; if (t && /^(TEXTAREA|INPUT)$/.test(t.tagName)) { softPending = true; return; } render(); }
/* Vista del coach "como atleta": solo lectura. Muestra Hoy o Ruta con el plan, los check-ins y las notas del atleta elegido (lo que su coach ya puede leer por las reglas). */
function asRun(fn) {
  const id = UI.asId, who = ST.athletes.find((x) => x.id === id);
  if (!who) return null;
  const sv = { user: ST.user, profile: ST.profile, myPlan: ST.myPlan, myHist: ST.myHist, myCk: ST.myCk, myNotes: ST.myNotes, js: UI.justSaved };
  try {
    ST.user = { uid: id, name: who.name }; ST.profile = { name: who.name, role: 'athlete', team: who.team || null, pending: false };
    ST.myPlan = ST.athPlan[id] || null; ST.myHist = ST.athHist[id] || null; ST.myCk = ST.athCk[id] || []; ST.myNotes = ST.athNotes[id] || []; UI.justSaved = null;
    return fn();
  } finally { ST.user = sv.user; ST.profile = sv.profile; ST.myPlan = sv.myPlan; ST.myHist = sv.myHist; ST.myCk = sv.myCk; ST.myNotes = sv.myNotes; UI.justSaved = sv.js; }
}
function viewAs() {
  const id = UI.asId, who = ST.athletes.find((x) => x.id === id);
  if (!who) { UI.asId = null; return VIEWS[UI.view](); }
  let html = asRun(() => VIEWS[UI.view]());
  html = html.replace(/data-a="(start|feedback|editCk|delAsk|delCk)"/g, 'disabled data-x="$1"');
  const bar = '<section class="card col g10" aria-label="Vista de coach" style="border:1.5px dashed var(--accent)"><div class="eyebrow" style="color:var(--accent)">Vista de ' + esc(firstName(who.name)) + ' · solo lectura</div><p class="soft" style="font-size:14px">Así ve la app tu atleta. Los check-ins de esta vista llegan de sus últimos 14 días, así que las insignias pueden verse más bajas que las suyas.</p><button type="button" class="chip" data-a="verComoSalir" style="align-self:flex-start">Volver a Cabina</button></section>';
  return html.replace('<div class="stack">', '<div class="stack">' + bar);
}
function render() {
  softPending = false;
  const main = document.getElementById('view'), top = document.getElementById('top'), nav = document.getElementById('nav'), ov = document.getElementById('overlay'), story = document.getElementById('story');
  const st = main.scrollTop;
  if (!ST.ready) { main.innerHTML = viewLoading(); top.innerHTML = topHtml(); nav.innerHTML = ''; ov.hidden = true; story.innerHTML = ''; return; }
  if (!ST.user || !ST.profile) { main.innerHTML = ST.user ? viewLoading() : viewLogin(); top.innerHTML = topHtml(); nav.innerHTML = ''; ov.hidden = true; ov.innerHTML = ''; story.innerHTML = ''; return; }
  const ids = tabs().map((t) => t.id); if (ids.indexOf(UI.view) < 0) UI.view = ids[0];
  main.innerHTML = (UI.asId && isCoach() && (UI.view === 'hoy' || UI.view === 'datos' || UI.view === 'ruta')) ? viewAs() : VIEWS[UI.view]();
  main.scrollTop = (UI.lastView === UI.view) ? st : 0; UI.lastView = UI.view;
  top.innerHTML = topHtml(); nav.innerHTML = navHtml();
  const h = overlayHtml(), keep = ov.scrollTop;
  ov.innerHTML = h; ov.hidden = !h; if (h) ov.scrollTop = keep;
  story.innerHTML = (UI.asId && isCoach() && UI.story != null) ? (asRun(storyHtml) || '') : storyHtml();
}
function route() { const ids = tabs().map((t) => t.id); let h = location.hash.slice(1); if (ids.indexOf(h) < 0) h = ids[0]; UI.view = h; if (h === 'cabina' || h === 'ajustes') UI.asId = null; render(); }
let msgTimer = null;
function say(msg, kind) { UI.msg = msg; UI.msgKind = kind || 'err'; clearTimeout(msgTimer); if (msg) msgTimer = setTimeout(() => { UI.msg = ''; render(); }, 8000); render(); }
const friendly = (e) => {
  const c = e && e.code ? String(e.code) : '';
  if (c.indexOf('permission-denied') >= 0) return 'No tienes permiso para esa acción. Si crees que es un error, avísale a tu coach.';
  if (c.indexOf('unavailable') >= 0 || c.indexOf('network') >= 0) return 'Sin conexión por ahora. Reintenta cuando vuelva la señal.';
  if (c.indexOf('unauthorized-domain') >= 0) return 'Este sitio aún no está autorizado para iniciar sesión. Avísale a tu coach.';
  return 'Algo no salió bien. Intenta de nuevo.';
};

/* ---------- Datos en vivo ---------- */
function stopData() { dataUnsubs.forEach((u) => { try { u(); } catch (e) {} }); dataUnsubs = []; Object.keys(athSubs).forEach((k) => athSubs[k].forEach((u) => { try { u(); } catch (e) {} })); athSubs = {}; dataKey = ''; }
function stopAll() { ownUnsubs.forEach((u) => { try { u(); } catch (e) {} }); ownUnsubs = []; stopData(); }
function setupData() {
  const p = ST.profile; if (!p || !ST.user) return;
  const key = [ST.user.uid, p.role, p.team || ''].join('|'); if (key === dataKey) return;
  stopData(); // se reinician solo las lecturas de equipo y de coach
  dataKey = key;
  const teams = p.role === 'coach' ? ['grnt', 'zn'] : (p.team ? [p.team] : []);
  teams.forEach((t) => {
    dataUnsubs.push(be.listenTeamKm(t, (rows) => { ST.teamKm[t] = rows; soft(); }));
    dataUnsubs.push(be.listenTeamMeta(t, (m) => { ST.teamMeta[t] = m || {}; soft(); }));
  });
  if (p.role === 'coach') {
    dataUnsubs.push(be.listenAthletes(ST.user.uid, (rows) => {
      ST.athletes = rows; /* incluye al propio coach si su documento tiene coachId = su uid (para cargar su plan e historial) */
      const ids = ST.athletes.map((r) => r.id);
      Object.keys(athSubs).forEach((k) => { if (ids.indexOf(k) < 0) { athSubs[k].forEach((u) => u()); delete athSubs[k]; } });
      ids.forEach((id) => { if (!athSubs[id]) athSubs[id] = [be.listenCheckins(id, (c) => { ST.athCk[id] = c; soft(); }, 14), be.listenNotes(id, (n) => { ST.athNotes[id] = n; soft(); }), be.listenPlan(id, (pl) => { ST.athPlan[id] = pl; soft(); }), be.listenHistory(id, (h) => { ST.athHist[id] = h; soft(); })]; });
      soft();
    }));
    dataUnsubs.push(be.listenPending((rows) => { ST.pending = rows; soft(); }));
  }
}
function startSession(user) {
  stopAll();
  ST.user = user; ST.profile = null; ST.myCk = []; ST.myNotes = []; ST.athletes = []; ST.athCk = {}; ST.athNotes = {}; ST.athPlan = {}; ST.athHist = {}; ST.myPlan = null; ST.myHist = null; UI.planDraft = null; UI.planOpen = false; UI.histDraft = null; UI.histOpen = false; UI.asId = null; ST.pending = []; ST.teamKm = {}; ST.teamMeta = {}; UI.justSaved = null; UI.flow = null; UI.feedback = null;
  if (!user) { ST.ready = true; soft(); return; }
  be.ensureProfile(user).catch((e) => say(friendly(e)));
  ownUnsubs.push(be.listenProfile(user.uid, (p) => { ST.profile = p; ST.ready = true; setupData(); route(); }));
  ownUnsubs.push(be.listenCheckins(user.uid, (rows) => { ST.myCk = rows; if (UI.justSaved && rows.some((c) => c.date === UI.justSaved.date)) UI.justSaved = null; soft(); }, 120));
  ownUnsubs.push(be.listenNotes(user.uid, (rows) => { ST.myNotes = rows; soft(); }));
  ownUnsubs.push(be.listenPlan(user.uid, (pl) => { ST.myPlan = pl; soft(); }));
  ownUnsubs.push(be.listenHistory(user.uid, (h) => { ST.myHist = h; soft(); }));
}

/* ---------- Acciones ---------- */
async function finishFlow() {
  const f = UI.flow, d = f.d, a = meA(), uid = ST.user.uid;
  const before = badges(a).filter((b) => b.earned).map((b) => b.id);
  const act = f.kind === 'actividad' ? (d.activity || { name: 'Actividad libre', min: null, km: 0, load: null }) : null;
  const pain = (d.painYes === 'si' && d.zones && d.zones.length) ? { zone: d.zones.join(', '), side: d.side || 'Ambos', level: d.level || 'Leve' } : null;
  const c = {
    date: off(0), type: f.kind, mood: d.mood || 3, sleepH: d.sleepH != null ? d.sleepH : null, sleepQ: d.sleepQ || null, legs: d.legs != null ? d.legs : null, stress: d.stress != null ? d.stress : null,
    rpe: d.rpe || null, heat: d.heat != null ? d.heat : null, hard: d.hard || null, hardInfo: d.hard === 'si' ? { type: d.hardType || null, dur: d.hardDur || null, end: d.hardEnd || null } : null,
    prev: d.prev || null, prevInfo: d.prev === 'si' ? { items: d.prevItems || [], text: (UI.draft.prevText || '').trim() } : null, pain, comment: (UI.draft.comment || '').trim(), activity: act, ts: Date.now()
  };
  UI.busy = true; render();
  try {
    await be.saveCheckin(uid, c);
  } catch (e) { UI.busy = false; say(friendly(e)); return; }
  UI.busy = false; UI.justSaved = c;
  const t = myTeam();
  if (t) { be.saveKm(t, uid, { name: ST.profile.name || ST.user.name, month: monthKey(), km: myMonthKm(act && act.km ? act.km : 0), updatedAt: Date.now() }).catch(() => {}); }
  const projected = meA(), after = badges(projected).filter((b) => b.earned), fresh = after.filter((b) => before.indexOf(b.id) < 0);
  UI.feedback = { checkin: c, newBadges: fresh }; UI.flow = null; UI.draft = { comment: '', prevText: '' };
  try { if (PREF.haptic !== false && navigator.vibrate) navigator.vibrate(30); } catch (e) {}
  render();
}
const ACT = {
  pref(v) { PREF[v] = v === 'haptic' ? !(PREF.haptic !== false) : !PREF[v]; savePref(); applyPrefs(); render(); },
  remToggle() {
    if (!ST.user) return; const on = !!(ST.profile && ST.profile.reminder);
    if (on) { PREF.lastRem = ST.profile.reminder; savePref(); }
    const v = on ? '' : (PREF.lastRem || '19:30'); ST.profile = Object.assign({}, ST.profile, { reminder: v }); render();
    be.saveProfile(ST.user.uid, { reminder: v }).catch(() => {});
  },
  remSet(v) { if (!ST.user) return; PREF.lastRem = v; savePref(); ST.profile = Object.assign({}, ST.profile, { reminder: v }); render(); be.saveProfile(ST.user.uid, { reminder: v }).catch(() => {}); },
  mode(v) {
    UI.mode = v === 'atleta' ? 'atleta' : 'coach'; try { localStorage.setItem('camino.mode', UI.mode); } catch (e) { /* sin almacenamiento */ }
    UI.asId = null; UI.story = null; const t = '#' + (UI.mode === 'coach' ? 'cabina' : 'hoy'); if (location.hash === t) render(); else location.hash = t;
  },
  nextReply() {
    const a = athleteObjs().filter((x) => needsReply(x))[0]; if (!a) return;
    UI.sel = a.id; UI.reply = { id: a.id, text: '' }; UI.planDraft = null; UI.histDraft = null; UI.histOpen = false; render();
    const el = document.getElementById('replyBox'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  },
  qrSend(v) {
    const a = athleteObjs().find((x) => x.id === UI.sel); if (!a || UI.busy || UI.undo) return;
    const text = cabinaPresets(statusOf(a), a)[Number(v)]; if (!text) return;
    const u = { id: a.id, text, start: Date.now() };
    u.timer = setTimeout(async () => {
      if (UI.undo !== u) return; UI.undo = null;
      try { await be.sendNote(a.id, { text: text.slice(0, 600), at: Date.now(), from: ST.user.uid }); say('Nota enviada a ' + a.first + '.', 'ok'); } catch (e) { say(friendly(e)); }
      render();
    }, 5000);
    UI.undo = u; render();
  },
  qrUndo() { if (UI.undo) { clearTimeout(UI.undo.timer); UI.undo = null; render(); } },
  fcProj() { UI.fp = !fcProjOn(); try { localStorage.setItem('camino.fproj', UI.fp ? '1' : '0'); } catch (e) { /* sin almacenamiento */ } render(); },
  fcRange(v) { UI.fr = +v; render(); },
  editCk() {
    const c = on(meA(), off(0)); if (!c) return;
    const d = { mood: c.mood, sleepH: c.sleepH == null ? undefined : c.sleepH, sleepQ: c.sleepQ || undefined, legs: c.legs == null ? undefined : c.legs, stress: c.stress == null ? undefined : c.stress, rpe: c.rpe || undefined, heat: c.heat == null ? undefined : c.heat, hard: c.hard || undefined, prev: c.prev || undefined };
    if (c.hardInfo) { d.hardType = c.hardInfo.type || undefined; d.hardDur = c.hardInfo.dur || undefined; d.hardEnd = c.hardInfo.end || undefined; }
    if (c.prevInfo) d.prevItems = (c.prevInfo.items || []).slice();
    if (c.pain) { d.painYes = 'si'; d.zones = String(c.pain.zone || '').split(', ').filter(Boolean); d.side = c.pain.side; d.level = c.pain.level; } else d.painYes = 'no';
    if (c.activity) d.activity = Object.assign({}, c.activity);
    UI.flow = { kind: c.type, step: 'run', i: 0, d }; UI.draft = { comment: c.comment || '', prevText: (c.prevInfo && c.prevInfo.text) || '' }; UI.feedback = null; UI.confirmDel = false; render();
  },
  delAsk() { UI.confirmDel = true; render(); },
  delNo() { UI.confirmDel = false; render(); },
  async delCk() {
    const uid = ST.user.uid; UI.busy = true; render();
    try { await be.deleteCheckin(uid, off(0)); } catch (e) { UI.busy = false; UI.confirmDel = false; say(friendly(e)); return; }
    UI.busy = false; UI.confirmDel = false; UI.feedback = null; UI.justSaved = null;
    ST.myCk = ST.myCk.filter((c) => c.date !== off(0));
    const t = myTeam();
    if (t) { be.saveKm(t, uid, { name: ST.profile.name || ST.user.name, month: monthKey(), km: myMonthKm(0), updatedAt: Date.now() }).catch(() => {}); }
    say('Check-in borrado. Puedes hacer uno nuevo cuando quieras.', 'ok');
  },
  guiaGo: (v) => { const tr = document.getElementById('gtrack'); if (tr) tr.scrollTo({ left: (+v) * tr.clientWidth, behavior: 'smooth' }); },
  async login(v) { UI.busy = true; UI.msg = ''; render(); try { await be.signIn(v); } catch (e) { say(friendly(e)); } UI.busy = false; render(); },
  async logout() { await be.signOut(); },
  start() { UI.flow = { kind: null, step: 'tipo', i: 0, d: {} }; UI.draft = { comment: '', prevText: '' }; render(); },
  close() { UI.flow = null; UI.draft = { comment: '', prevText: '' }; render(); },
  kind(v) { const p = planFor(off(0)), d = {}; if (v === 'actividad') d.activity = p ? { name: p.name, min: p.min || null, km: p.km || 0, load: p.load == null ? null : p.load } : { name: 'Actividad libre', min: null, km: 0, load: null }; UI.flow = { kind: v, step: 'run', i: 0, d }; render(); },
  mood(v) { UI.flow.d.mood = Number(v); UI.flow.i++; render(); },
  set(v, t) { const g = t.dataset.g, val = NUMERIC[g] ? Number(v) : v; UI.flow.d[g] = (UI.flow.d[g] === val) ? undefined : val; render(); },
  multi(v, t) { const g = t.dataset.g, z = UI.flow.d[g] || [], i = z.indexOf(v); if (i >= 0) z.splice(i, 1); else z.push(v); UI.flow.d[g] = z; render(); },
  zone(v) { const z = UI.flow.d.zones || [], i = z.indexOf(v); if (i >= 0) z.splice(i, 1); else if (z.length < 3) z.push(v); UI.flow.d.zones = z; render(); },
  next() { UI.flow.i++; render(); },
  back() { const f = UI.flow; if (f.step === 'run' && f.i > 0) f.i--; else { f.step = 'tipo'; f.i = 0; } render(); },
  send() { if (!UI.busy) finishFlow(); },
  feedback() { UI.feedback = { checkin: on(meA(), off(0)), newBadges: [] }; render(); },
  closeFb() { UI.feedback = null; render(); },
  story(v) { UI.story = Number(v) || 0; render(); },
  storyNext() { UI.story = UI.story >= 2 ? null : UI.story + 1; render(); },
  storyClose() { UI.story = null; render(); },
  sel(v) { UI.sel = v; UI.reply = { id: v, text: '' }; UI.planDraft = null; UI.histDraft = null; UI.histOpen = false; render(); },
  preset(v) { const a = athleteObjs().find((x) => x.id === UI.sel); if (!a) return; UI.reply = { id: a.id, text: cabinaPresets(statusOf(a), a)[Number(v)] }; render(); const t = document.getElementById('replyText'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } },
  async sendReply() {
    const a = athleteObjs().find((x) => x.id === UI.sel), txt = (UI.reply.text || '').trim(); if (!a || !txt || UI.busy) return;
    UI.busy = true; render();
    try { await be.sendNote(a.id, { text: txt.slice(0, 600), at: Date.now(), from: ST.user.uid }); UI.reply = { id: a.id, text: '' }; } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  planToggle() { UI.planOpen = !UI.planOpen; UI.planDraft = null; render(); },
  histToggle() { UI.histOpen = !UI.histOpen; UI.histDraft = null; render(); },
  async saveHist() {
    const a = athleteObjs().find((x) => x.id === UI.sel); if (!a || UI.busy) return;
    const r = parseHist(UI.histDraft ? UI.histDraft.text : ''); if (r.err) { say(r.err); return; }
    UI.busy = true; render();
    try { await be.saveHistory(a.id, Object.assign(r.hist, { updatedAt: Date.now() })); UI.histDraft = null; UI.histOpen = false; say('Historial guardado para ' + a.first + '.', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  verComo(v) { UI.asId = v; if (location.hash === '#hoy') render(); else location.hash = '#hoy'; },
  verComoSalir() { UI.asId = null; if (location.hash === '#cabina') render(); else location.hash = '#cabina'; },
  async savePlan() {
    const a = athleteObjs().find((x) => x.id === UI.sel); if (!a || UI.busy) return;
    const r = parsePlan(UI.planDraft ? UI.planDraft.text : ''); if (r.err) { say(r.err); return; }
    UI.busy = true; render();
    try { await be.savePlan(a.id, Object.assign(r.plan, { updatedAt: Date.now() })); UI.planDraft = null; UI.planOpen = false; say('Plan guardado para ' + a.first + '.', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  async accept(v, t) { try { await be.acceptAthlete(v, ST.user.uid, t.dataset.t); } catch (e) { say(friendly(e)); } },
  tone(v) { PREF.tone = v; savePref(); applyTone(); render(); },
  metaTeam(v) { UI.metaTeam = v; UI.metaDraft = null; render(); },
  async saveMeta() {
    const team = UI.metaTeam, goal = Number((UI.metaDraft && UI.metaDraft.goal) != null ? UI.metaDraft.goal : (ST.teamMeta[team] || {}).goal || KM_GOAL_DEFAULT), hito = UI.metaDraft ? UI.metaDraft.hito : ((ST.teamMeta[team] || {}).hito || '');
    UI.busy = true; render();
    try { await be.saveTeamMeta(team, { goal: goal > 0 ? goal : KM_GOAL_DEFAULT, hito: String(hito || '').slice(0, 200) }); UI.metaDraft = null; say('Guardado para ' + TEAMS[team] + '.', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  resetDemo() { try { localStorage.removeItem('camino-demo-v1'); sessionStorage.removeItem('camino-demo-user'); } catch (e) {} location.reload(); }
};
function guiaSync() {
  const tr = document.getElementById('gtrack'); if (!tr) return;
  const i = Math.round(tr.scrollLeft / Math.max(tr.clientWidth, 1));
  document.querySelectorAll('#gdots .gdot').forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
}
document.addEventListener('pointermove', fcMove);
document.addEventListener('pointermove', wbMove);
document.addEventListener('pointerdown', wbMove);
document.addEventListener('pointerdown', fcMove);
document.addEventListener('scroll', (e) => { if (e.target && e.target.id === 'gtrack') guiaSync(); }, true);
document.addEventListener('click', (e) => { const t = e.target.closest('[data-a]'); if (!t) return; const fn = ACT[t.dataset.a]; if (fn) fn(t.dataset.v, t); });
document.addEventListener('input', (e) => {
  const id = e.target.id;
  if (id === 'comment') UI.draft.comment = e.target.value;
  if (id === 'prevText') UI.draft.prevText = e.target.value;
  if (id === 'replyText') { UI.reply.text = e.target.value; const b = document.querySelector('[data-a="sendReply"]'); if (b) { const has = !!e.target.value.trim(); b.disabled = !has || UI.busy; const a = athleteObjs().find((x) => x.id === UI.sel); b.textContent = has ? 'Enviar a ' + (a ? a.first : '') : 'Enviar'; } const cn = document.getElementById('replyCount'); if (cn) cn.textContent = e.target.value.length + ' / 600'; }
  if (id === 'planText') UI.planDraft = { id: UI.sel, text: e.target.value };
  if (id === 'histText') UI.histDraft = { id: UI.sel, text: e.target.value };
  if (id === 'reminder' && ST.user) { be.saveProfile(ST.user.uid, { reminder: e.target.value }).catch(() => {}); }
  if (id === 'metaGoal' || id === 'metaHito') { const cur = UI.metaDraft && UI.metaDraft.team === UI.metaTeam ? UI.metaDraft : { team: UI.metaTeam, goal: (ST.teamMeta[UI.metaTeam] || {}).goal || KM_GOAL_DEFAULT, hito: (ST.teamMeta[UI.metaTeam] || {}).hito || '' }; if (id === 'metaGoal') cur.goal = e.target.value; else cur.hito = e.target.value; UI.metaDraft = cur; }
});
window.addEventListener('hashchange', route);
document.addEventListener('focusout', () => { setTimeout(() => { const t = document.activeElement; if (softPending && !(t && /^(TEXTAREA|INPUT)$/.test(t.tagName))) render(); }, 0); });

/* ---------- Arranque ---------- */
applyTone();
applyPrefs();
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { render(); }); } catch (e) { /* navegador sin matchMedia */ }
be.setErrorHandler((where, err) => say(friendly(err)));
render();
be.onAuth((user) => startSession(user));
if ('serviceWorker' in navigator && !DEMO && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
