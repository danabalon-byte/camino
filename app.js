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
  { id: 'paleta', name: 'Paleta propia', sub: 'Azul marino con tus cinco colores', sw: ['#090D1F', '#11183A', '#F28705', '#04BF68'] },
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
  ajustes: '<circle cx="12" cy="12" r="3"></circle><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"></path>'
};
const tabs = () => (isCoach() ? ['cabina', 'hoy', 'datos', 'ruta', 'ajustes'] : ['hoy', 'datos', 'ruta', 'ajustes']).map((id) => ({ id, label: cap(id), ic: NAVIC[id] }));
const navHtml = () => '<div class="inner">' + tabs().map((t) => '<a href="#' + t.id + '"' + (UI.view === t.id ? ' aria-current="page"' : '') + '><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + t.ic + '</svg><span>' + t.label + '</span></a>').join('') + '</div>';
function topHtml() {
  let pills = '';
  if (DEMO) pills += '<span class="pill">Demo</span>';
  if (ST.profile) {
    const t = myTeam();
    if (t) pills += '<span class="pill">' + TEAMS[t] + '</span>';
    pills += '<span class="pill role">' + (isCoach() ? 'Coach' : 'Atleta') + '</span>';
  }
  return '<div class="inner"><span class="brand">Camino</span><span class="row g8">' + pills + '</span></div>';
}
const head = (sub, title) => '<div class="col g4"><div class="muted" style="font-size:14px">' + esc(sub) + '</div><h1 class="title">' + esc(title) + '</h1></div>';
const msgBanner = () => (UI.msg ? '<div class="banner" role="status">' + infoIcon() + '<span>' + esc(UI.msg) + '</span></div>' : '');

/* ---------- Vista: ingreso y carga ---------- */
function viewLogin() {
  return '<div class="inner"><div class="login"><div class="logo" aria-hidden="true"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-6 14-4 14-12"></path><circle cx="5" cy="19" r="2"></circle><circle cx="19" cy="6" r="2" stroke="var(--good)"></circle></svg></div>'
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
const cabinaPresets = (st) => (st.k === 'warn' ? ['Bajamos la intensidad hoy', 'Descansa hoy y me cuentas mañana', 'Hablemos hoy, ¿te llamo?'] : (st.k === 'none' ? ['¿Todo bien? Cuando puedas, cuéntame cómo vas.', 'Te escribo para saber cómo estás.', 'Retomemos con un check-in corto hoy.'] : ['Todo bien, sigue con el plan', 'Buen trabajo esta semana', 'Hoy puedes sumar un poco más']));
function viewCabina() {
  const list = athleteObjs(), cnt = { ok: 0, warn: 0, none: 0 }; let queue = 0;
  list.forEach((a) => { cnt[statusOf(a).k]++; if (needsReply(a)) queue++; });
  let out = '<div class="inner"><div class="stack">' + head('Vista del coach', 'Cabina') + msgBanner();
  if (ST.pending.filter((p) => p.id !== (ST.user && ST.user.uid)).length) {
    out += '<section class="card col g12" aria-label="Solicitudes nuevas" style="border:1.5px solid var(--accent)"><div class="eyebrow" style="color:var(--accent)">Solicitudes nuevas</div>' + ST.pending.filter((p) => p.id !== ST.user.uid).map((p) => '<div class="col g10"><div style="font-weight:600">' + esc(p.name) + '</div><div class="row g8 wrap"><button type="button" class="chip" data-a="accept" data-v="' + esc(p.id) + '" data-t="grnt">Aceptar en GRNT</button><button type="button" class="chip" data-a="accept" data-v="' + esc(p.id) + '" data-t="zn">Aceptar en ZN</button></div></div>').join('') + '</section>';
  }
  out += '<section class="row g10" aria-label="Resumen del equipo">' + [['Al día', cnt.ok, 'var(--good)'], ['Atención', cnt.warn, 'var(--warn)'], ['Sin check-in', cnt.none, 'var(--muted)']].map((x) => '<div class="card tight grow"><div class="num" style="font-size:40px;color:' + x[2] + '">' + x[1] + '</div><div class="soft" style="font-size:13px;margin-top:4px">' + x[0] + '</div></div>').join('') + '</section>';
  out += '<div class="row between g12" style="background:var(--accent-soft);border:1.5px solid var(--accent);border-radius:16px;padding:12px 16px"><span style="font-weight:600">' + (queue === 0 ? 'Todo respondido por hoy' : queue + ' por responder') + '</span><span class="muted" style="font-size:13px">Cola de respuestas</span></div>';
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
  out += '<div><div class="eyebrow">Bienestar · 7 días</div><div style="margin-top:8px">' + dualChart(a) + '</div><div class="row g16 wrap soft" style="font-size:13px;margin-top:4px"><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--accent)"></i>Bienestar</span></div></div>' + histBlock(a);
  if (n && l && n.at >= l.ts) out += '<div class="row g12" style="background:var(--good-soft);border:1.5px solid var(--good);border-radius:16px;padding:14px 16px;align-items:flex-start"><span style="flex:none;margin-top:2px">' + check('var(--good)', 22) + '</span><span class="soft" style="font-size:15px">Nota enviada ' + relTime(n.at) + ': “' + esc(n.text) + '”</span></div>';
  out += '<div class="col g10"><div style="font-weight:600">' + (needsReply(a) ? 'Responder con un toque' : 'Dejar una nota') + '</div><div class="chips">' + cabinaPresets(st).map((p, i) => '<button type="button" class="chip" data-a="preset" data-v="' + i + '">' + esc(p) + '</button>').join('') + '</div><label for="replyText" class="muted" style="font-size:13px">Mensaje para ' + esc(a.first) + '</label><textarea id="replyText" placeholder="Escribe o elige una respuesta">' + esc(UI.reply.text) + '</textarea><button type="button" class="btn primary" data-a="sendReply" style="justify-content:center" ' + (UI.reply.text.trim() && !UI.busy ? '' : 'disabled') + '>' + (UI.reply.text.trim() ? 'Enviar a ' + esc(a.first) : 'Escribe o elige una respuesta') + '</button></div></section>';
  out += planEditor(a) + histEditor(a);
  return out + '</div></div>';
}

/* ---------- Historial de forma y salidas (lo carga el coach desde intervals.icu) ---------- */
const histDays = (h) => (h && Array.isArray(h.days) ? h.days.filter((x) => x && x.d && isFinite(x.ctl) && isFinite(x.atl)).sort((a, b) => (a.d < b.d ? -1 : 1)) : []);
const f1 = (v) => Number(v).toLocaleString('es-CL', { maximumFractionDigits: 1 });
function formaInfo(h) { const ds = histDays(h); if (!ds.length) return null; const last = ds[ds.length - 1]; return { ds, last, tsb: Math.round(last.ctl - last.atl) }; }
function formaChart(ds) {
  const W = 320, H = 110, P = 6, n = ds.length, mx = Math.max.apply(null, ds.map((x) => Math.max(x.ctl, x.atl)).concat([10])) * 1.1;
  const X = (i) => P + (n > 1 ? i * (W - 2 * P) / (n - 1) : 0), Y = (v) => H - P - (v / mx) * (H - 2 * P);
  const line = (k) => ds.map((x, i) => X(i).toFixed(1) + ',' + Y(x[k]).toFixed(1)).join(' ');
  const last = ds[n - 1];
  return '<div style="margin-top:8px"><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Curva de aptitud y fatiga" style="display:block"><polyline fill="none" stroke="var(--warn)" stroke-width="2" stroke-linejoin="round" points="' + line('atl') + '"></polyline><polyline fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" points="' + line('ctl') + '"></polyline></svg></div>'
    + '<div class="row g16 wrap soft" style="font-size:13px;margin-top:4px"><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--accent)"></i>Aptitud (CTL) ' + f1(last.ctl) + '</span><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--warn)"></i>Fatiga (ATL) ' + f1(last.atl) + '</span></div>';
}
function weekBars(h) {
  const wk = {}; ((h && h.acts) || []).forEach((d) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return; const t = parse(d), m = new Date(t); m.setDate(t.getDate() - ((t.getDay() + 6) % 7)); const k = ymd(m); wk[k] = (wk[k] || 0) + 1; });
  const now = parse(off(0)), mon0 = new Date(now); mon0.setDate(now.getDate() - ((now.getDay() + 6) % 7)); const weeks = [];
  for (let i = 7; i >= 0; i--) { const m = new Date(mon0); m.setDate(mon0.getDate() - i * 7); const k = ymd(m); weeks.push({ k, v: wk[k] || 0 }); }
  const mxw = Math.max.apply(null, weeks.map((x) => x.v).concat([1]));
  return '<div class="row g6" style="align-items:flex-end;margin-top:8px">' + weeks.map((x, i) => '<div class="col" style="flex:1;align-items:center;gap:4px"><div style="position:relative;width:100%;height:44px"><div style="position:absolute;left:0;right:0;bottom:0;border-radius:6px;background:' + (i === 7 ? 'var(--accent)' : 'var(--muted)') + ';opacity:' + (x.v ? 1 : .25) + ';height:' + Math.max(3, Math.round(x.v / mxw * 44)) + 'px"></div></div><span style="font-size:11px;color:var(--muted)">' + x.v + '</span></div>').join('') + '</div>';
}
function histBlock(a) {
  const h = ST.athHist[a.id], fi = formaInfo(h);
  if (!fi) return '<div><div class="eyebrow">Forma y carga</div><p class="muted" style="font-size:13px;margin-top:6px">Aún sin historial. Cárgalo abajo, en “Historial de ' + esc(a.first) + '”.</p></div>';
  const tsb = fi.tsb, lectura = tsb <= -25 ? 'muy cargado: cuida la recuperación' : (tsb <= -10 ? 'cargado, en zona de trabajo' : (tsb <= 5 ? 'equilibrado' : (tsb <= 20 ? 'fresco' : 'muy fresco')));
  return '<div><div class="eyebrow">Forma y carga · ' + fi.ds.length + ' días</div>' + formaChart(fi.ds)
    + '<p class="soft" style="font-size:15px;margin-top:8px">Forma (TSB) ' + (tsb > 0 ? '+' : '') + tsb + ' al ' + esc(fi.last.d) + ': ' + lectura + '.</p>'
    + '<div class="eyebrow" style="margin-top:14px">Salidas por semana · últimas 8</div>' + weekBars(h)
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
    out += '<section class="card" aria-label="Curva de forma"><div class="eyebrow">Aptitud y fatiga · ' + fi.ds.length + ' días</div>' + formaChart(fi.ds)
      + '<p class="muted" style="font-size:13px;margin-top:10px"><b>Aptitud</b>: la base que has construido entrenando. <b>Fatiga</b>: el cansancio de tus últimos días. <b>Forma</b>: aptitud menos fatiga; positiva significa piernas frescas, negativa significa que estás cargando trabajo.</p></section>';
    out += '<section class="card" aria-label="Salidas por semana"><div class="eyebrow">Salidas por semana · últimas 8</div>' + weekBars(ST.myHist) + '<p class="muted" style="font-size:12px;margin-top:8px">La barra naranja es la semana actual. Datos de intervals.icu' + (ST.myHist.updatedAt ? ', cargados ' + relTime(ST.myHist.updatedAt) : '') + '.</p></section>';
  }
  const cks = a.checkins.slice().sort((x, y) => (x.date < y.date ? 1 : (x.date > y.date ? -1 : 0))).slice(0, 10), sk = streak(a);
  out += '<section class="card" aria-label="Bienestar"><div class="row between"><div class="eyebrow">Tu bienestar · 7 días</div><div class="muted" style="font-size:13px">Racha: ' + sk.n + (sk.n === 1 ? ' día' : ' días') + '</div></div><div style="margin-top:8px">' + dualChart(a) + '</div></section>';
  out += '<section class="card col g10" aria-label="Tus check-ins"><div class="eyebrow">Tus últimos check-ins</div>' + (cks.length ? cks.map((c) => {
    const d = parse(c.date), sc = score(c), b = band(sc);
    return '<div class="row between g12" style="align-items:flex-start;padding-top:8px;border-top:1px solid var(--line)"><div class="col g4" style="min-width:0"><span style="font-weight:600">' + cap(WD[d.getDay()]) + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + '</span><span class="muted" style="font-size:13px">' + (c.type === 'actividad' ? (c.activity && c.activity.name ? esc(c.activity.name) : 'Actividad') : (c.type === 'descanso' ? 'Descanso' : 'Bienestar')) + ' · Ánimo ' + esc(at(MOODS, c.mood - 1).toLowerCase()) + (c.rpe ? ' · RPE ' + c.rpe : '') + '</span></div><span style="font-weight:600;font-size:14px;color:' + b.color + ';flex:none">' + (sc == null ? '–' : sc + ' · ' + b.label) + '</span></div>';
  }).join('') : '<p class="soft">Aún no hay check-ins. Tu primer registro aparecerá aquí.</p>') + '</section>';
  return out + '</div></div>';
}
function histEditor(a) {
  const h = ST.athHist[a.id];
  let out = '<section class="card col g12" aria-label="Historial del atleta"><div class="row between g8" style="align-items:baseline"><div class="eyebrow">Historial de ' + esc(a.first) + '</div><span class="muted" style="font-size:13px">' + (h ? 'Cargado' : 'Sin historial') + '</span></div>';
  if (!UI.histOpen) return out + '<button type="button" class="chip" data-a="histToggle" style="align-self:flex-start">' + (h ? 'Actualizar historial' : 'Cargar historial') + '</button></section>';
  if (!UI.histDraft || UI.histDraft.id !== a.id) UI.histDraft = { id: a.id, text: '' };
  return out + '<div class="info" role="note">' + infoIcon() + '<span>Pega el historial en JSON: days con d, ctl y atl, y acts con las fechas de las salidas. Reemplaza el anterior.</span></div><label for="histText" class="muted" style="font-size:13px">Historial en JSON</label><textarea id="histText" spellcheck="false" placeholder="{ &quot;days&quot;: [{ &quot;d&quot;: &quot;2026-10-27&quot;, &quot;ctl&quot;: 29.8, &quot;atl&quot;: 49.7 }], &quot;acts&quot;: [&quot;2026-10-25&quot;] }" style="min-height:200px;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + esc(UI.histDraft.text) + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="saveHist" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '>Guardar historial de ' + esc(a.first) + '</button><button type="button" class="chip" data-a="histToggle">Cerrar</button></div></section>';
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
function planEditor(a) {
  const pl = ST.athPlan[a.id];
  let out = '<section class="card col g12" aria-label="Plan del atleta"><div class="row between g8" style="align-items:baseline"><div class="eyebrow">Plan de ' + esc(a.first) + '</div><span class="muted" style="font-size:13px">' + (pl ? 'Cargado' : 'Sin plan') + '</span></div>';
  if (!UI.planOpen) return out + '<div class="row g8 wrap"><button type="button" class="chip" data-a="planToggle">' + (pl ? 'Ver o editar plan' : 'Cargar plan') + '</button><button type="button" class="chip" data-a="verComo" data-v="' + esc(a.id) + '">Ver como ' + esc(a.first) + '</button></div></section>';
  if (!UI.planDraft || UI.planDraft.id !== a.id) UI.planDraft = { id: a.id, text: planToText(pl) };
  return out + '<div class="info" role="note">' + infoIcon() + '<span>Pega el plan en formato JSON: meta, fases, sesiones por fecha y notas por día. El atleta lo ve en Hoy y en Ruta.</span></div><label for="planText" class="muted" style="font-size:13px">Plan en JSON</label><textarea id="planText" spellcheck="false" style="min-height:260px;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + esc(UI.planDraft.text) + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="savePlan" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '>Guardar plan de ' + esc(a.first) + '</button><button type="button" class="chip" data-a="planToggle">Cerrar</button></div></section>';
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

/* ---------- Vista: Ajustes ---------- */
function viewAjustes() {
  const p = ST.profile || {};
  let out = '<div class="inner"><div class="stack">' + head(ST.user ? ST.user.name : '', 'Ajustes') + msgBanner();
  out += '<section class="card col g8" aria-label="Cuenta"><div class="eyebrow">Tu cuenta</div><p class="soft">' + esc(p.name || '') + ' · ' + (isCoach() ? 'Coach' : 'Atleta') + (p.team ? ' · equipo ' + TEAMS[p.team] : '') + (p.pending ? ' · pendiente de asignación' : '') + '</p><button type="button" class="chip" data-a="logout" style="align-self:flex-start">Cerrar sesión</button></section>';
  out += '<section class="card col g10" aria-label="Tono visual"><div class="eyebrow">Tono visual</div>' + TONES.map((t) => '<button type="button" class="swatch" data-a="tone" data-v="' + t.id + '" aria-pressed="' + (PREF.tone === t.id) + '"><span class="sw">' + t.sw.map((c) => '<i style="background:' + c + '"></i>').join('') + '</span><span class="col grow"><span>' + t.name + '</span><span class="muted" style="font-size:13px;font-weight:500">' + t.sub + '</span></span></button>').join('') + '</section>';
  out += '<section class="card col g10" aria-label="Recordatorio"><div class="eyebrow">Recordatorio del check-in</div><label for="reminder" class="soft">Hora que prefieres</label><div><input type="time" id="reminder" value="' + esc(p.reminder || '19:30') + '"></div><p class="muted" style="font-size:14px">Se guarda en tu perfil. Los avisos llegarán en una próxima versión, con la app instalada.</p></section>';
  if (isCoach()) {
    const team = UI.metaTeam, m = ST.teamMeta[team] || {}, d = UI.metaDraft && UI.metaDraft.team === team ? UI.metaDraft : { team, goal: m.goal || KM_GOAL_DEFAULT, hito: m.hito || '' };
    out += '<section class="card col g12" aria-label="Meta del equipo"><div class="eyebrow">Meta e hito del equipo</div><div class="seggroup" role="group" aria-label="Equipo">' + Object.keys(TEAMS).map((t) => '<button type="button" data-a="metaTeam" data-v="' + t + '" aria-pressed="' + (team === t) + '">' + TEAMS[t] + '</button>').join('') + '</div><label for="metaGoal" class="soft">Meta del mes (km)</label><input class="field" id="metaGoal" type="number" inputmode="numeric" min="0" value="' + esc(d.goal) + '"><label for="metaHito" class="soft">Hito de la semana (opcional)</label><textarea id="metaHito" placeholder="Por ejemplo: Camila hizo su rodaje más largo">' + esc(d.hito) + '</textarea><button type="button" class="btn primary" data-a="saveMeta" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '>Guardar para ' + TEAMS[team] + '</button></section>';
  }
  out += '<section class="card col g8" aria-label="Privacidad"><div class="eyebrow">Quién ve qué</div><p class="soft" style="font-size:15px">Tu coach ve tus check-ins, tus molestias y tus notas. Tu equipo ve solo los kilómetros, las insignias y los hitos. Nadie más ve tu bienestar ni tus molestias.</p></section>';
  out += '<section class="card col g8" aria-label="Instalar"><div class="eyebrow">Instalar en el teléfono</div><p class="soft" style="font-size:15px">En Android: menú de Chrome y “Instalar aplicación”. En iPhone: Compartir y “Agregar a inicio”.</p></section>';
  if (DEMO) out += '<section class="card col g10" aria-label="Datos de demostración"><div class="eyebrow">Modo demostración</div><button type="button" class="chip" data-a="resetDemo" style="align-self:flex-start">Restablecer datos de demostración</button></section>';
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
  return out + '<div class="col g8"><a href="#ruta" data-a="closeFb" class="btn primary"><span>Ver mi ruta</span>' + arrow() + '</a><button type="button" class="btn ghost" data-a="closeFb">Volver a Hoy</button></div></div></div>';
}
const overlayHtml = () => (UI.flow ? flowHtml() : (UI.feedback ? feedbackHtml() : ''));

/* ---------- Historia: tu camino recorrido ---------- */
function bestWeekMin(a) {
  const w = {};
  a.checkins.forEach((c) => { if (c.type === 'actividad' && c.activity && c.activity.min) { const d = parse(c.date), mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = ymd(mon); w[k] = (w[k] || 0) + c.activity.min; } });
  const v = Object.keys(w).map((k) => w[k]); return v.length ? Math.max.apply(null, v) : 0;
}
function storyHtml() {
  if (UI.story == null) return '';
  const a = meA(), acts = a.checkins.filter((c) => c.type === 'actividad').length, total = a.checkins.length, bw = bestWeekMin(a), t = myTeam() ? teamTotals(myTeam()) : null;
  const sl = [
    { c: 's0', k: 'Tu camino hasta hoy', big: String(total), unit: total === 1 ? 'check-in' : 'check-ins', line: acts + (acts === 1 ? ' actividad registrada' : ' actividades registradas') + '. Tu constancia es lo que más construye.', btn: 'Siguiente' },
    { c: 's1', k: 'Tu semana más larga', big: bw ? Math.floor(bw / 60) + ' h ' + pad(bw % 60) : '–', unit: bw ? 'de actividad' : 'aún sin datos', line: bw ? 'Sostuviste el volumen y te recuperaste. Esa es tu base para la meta.' : 'Cuando registres actividades, aquí verás tu semana más larga.', btn: 'Siguiente' },
    { c: 's2', k: 'Tu equipo', big: t ? t.km.toLocaleString('es-CL') : '–', unit: t ? 'km juntos este mes' : 'sin equipo aún', line: t ? 'Entre ' + t.members + (t.members === 1 ? ' atleta' : ' atletas') + ' ya van al ' + Math.min(100, Math.round(t.km / t.goal * 100)) + '% de la meta del mes. Cada salida suma.' : 'Cuando tu coach te asigne a un equipo verás aquí lo que logran juntos.', btn: 'Terminar' }
  ];
  const s = sl[UI.story];
  return '<div class="story ' + s.c + '" role="dialog" aria-label="Tu camino recorrido"><div class="inner"><div class="row g8" aria-hidden="true">' + sl.map((x, i) => '<i style="flex:1;height:4px;border-radius:2px;background:currentColor;opacity:' + (i <= UI.story ? 1 : .3) + '"></i>').join('') + '</div><div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="x" data-a="storyClose">Cerrar</button></div><div class="col g10" style="flex:1;justify-content:center"><div style="font-size:13px;letter-spacing:.12em;font-weight:600;text-transform:uppercase">' + s.k + '</div><div class="bigv">' + esc(s.big) + '</div><div style="font-family:var(--font-d);font-weight:600;font-size:34px;line-height:1.1">' + s.unit + '</div><p style="font-size:19px;margin-top:12px;line-height:1.45">' + esc(s.line) + '</p></div><button type="button" class="sbtn" data-a="storyNext">' + s.btn + '</button></div></div>';
}

/* ---------- Render ---------- */
function applyTone() { const r = document.documentElement; if (PREF.tone === 'auto') r.removeAttribute('data-tone'); else r.setAttribute('data-tone', PREF.tone); }
const VIEWS = { hoy: viewHoy, datos: viewDatos, ruta: viewRuta, cabina: viewCabina, ajustes: viewAjustes };
let softPending = false;
function soft() { const t = document.activeElement; if (t && /^(TEXTAREA|INPUT)$/.test(t.tagName)) { softPending = true; return; } render(); }
/* Vista del coach "como atleta": solo lectura. Muestra Hoy o Ruta con el plan, los check-ins y las notas del atleta elegido (lo que su coach ya puede leer por las reglas). */
function viewAs() {
  const id = UI.asId, who = ST.athletes.find((x) => x.id === id);
  if (!who) { UI.asId = null; return VIEWS[UI.view](); }
  const sv = { user: ST.user, profile: ST.profile, myPlan: ST.myPlan, myHist: ST.myHist, myCk: ST.myCk, myNotes: ST.myNotes, js: UI.justSaved };
  let html;
  try {
    ST.user = { uid: id, name: who.name }; ST.profile = { name: who.name, role: 'athlete', team: who.team || null, pending: false };
    ST.myPlan = ST.athPlan[id] || null; ST.myHist = ST.athHist[id] || null; ST.myCk = ST.athCk[id] || []; ST.myNotes = ST.athNotes[id] || []; UI.justSaved = null;
    html = VIEWS[UI.view]();
  } finally { ST.user = sv.user; ST.profile = sv.profile; ST.myPlan = sv.myPlan; ST.myHist = sv.myHist; ST.myCk = sv.myCk; ST.myNotes = sv.myNotes; UI.justSaved = sv.js; }
  html = html.replace(/data-a="(start|feedback|story)"/g, 'disabled data-x="$1"');
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
  story.innerHTML = storyHtml();
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
      ST.athletes = rows.filter((r) => r.id !== ST.user.uid);
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
  try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
  render();
}
const ACT = {
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
  preset(v) { const a = athleteObjs().find((x) => x.id === UI.sel); if (!a) return; UI.reply = { id: a.id, text: cabinaPresets(statusOf(a))[Number(v)] }; render(); },
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
document.addEventListener('click', (e) => { const t = e.target.closest('[data-a]'); if (!t) return; const fn = ACT[t.dataset.a]; if (fn) fn(t.dataset.v, t); });
document.addEventListener('input', (e) => {
  const id = e.target.id;
  if (id === 'comment') UI.draft.comment = e.target.value;
  if (id === 'prevText') UI.draft.prevText = e.target.value;
  if (id === 'replyText') { UI.reply.text = e.target.value; const b = document.querySelector('[data-a="sendReply"]'); if (b) { const has = !!e.target.value.trim(); b.disabled = !has || UI.busy; const a = athleteObjs().find((x) => x.id === UI.sel); b.textContent = has ? 'Enviar a ' + (a ? a.first : '') : 'Escribe o elige una respuesta'; } }
  if (id === 'planText') UI.planDraft = { id: UI.sel, text: e.target.value };
  if (id === 'histText') UI.histDraft = { id: UI.sel, text: e.target.value };
  if (id === 'reminder' && ST.user) { be.saveProfile(ST.user.uid, { reminder: e.target.value }).catch(() => {}); }
  if (id === 'metaGoal' || id === 'metaHito') { const cur = UI.metaDraft && UI.metaDraft.team === UI.metaTeam ? UI.metaDraft : { team: UI.metaTeam, goal: (ST.teamMeta[UI.metaTeam] || {}).goal || KM_GOAL_DEFAULT, hito: (ST.teamMeta[UI.metaTeam] || {}).hito || '' }; if (id === 'metaGoal') cur.goal = e.target.value; else cur.hito = e.target.value; UI.metaDraft = cur; }
});
window.addEventListener('hashchange', route);
document.addEventListener('focusout', () => { setTimeout(() => { const t = document.activeElement; if (softPending && !(t && /^(TEXTAREA|INPUT)$/.test(t.tagName))) render(); }, 0); });

/* ---------- Arranque ---------- */
applyTone();
be.setErrorHandler((where, err) => say(friendly(err)));
render();
be.onAuth((user) => startSession(user));
if ('serviceWorker' in navigator && !DEMO && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
