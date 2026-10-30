// Modo demostración (?demo=1): mismos métodos que backend-firebase.js, pero con datos
// ficticios guardados en este navegador. No usa red. Sirve para probar el diseño y los flujos.
const KEY = 'camino-demo-v4';
const pad = (n) => (n < 10 ? '0' + n : '' + n);
const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const off = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return ymd(d); };
const tsOf = (date, h, m) => { const [y, mo, da] = date.split('-').map(Number); return new Date(y, mo - 1, da, h, m || 0).getTime(); };
const PLAN = { 1: { name: 'Rodillo Z2', min: 60, km: 28, load: 52 }, 2: { name: 'Rodillo suave', min: 45, km: 18, load: 34 }, 3: null, 4: { name: 'Intervalos sweet spot', min: 80, km: 32, load: 78 }, 5: { name: 'Z2 corto', min: 40, km: 16, load: 30 }, 6: { name: 'Rodaje largo', min: 180, km: 85, load: 150 }, 0: { name: 'Rodaje suave', min: 70, km: 30, load: 48 } };

function mkCheckins(arr, last, pain) {
  const list = [];
  arr.forEach((m, i) => {
    if (m == null) return;
    const date = off(-6 + i);
    list.push({ id: date, date, type: 'bienestar', mood: m, sleepH: null, sleepQ: null, legs: null, stress: null, rpe: null, heat: null, hard: null, pain: null, comment: '', activity: null, ts: tsOf(date, 8, 10) });
  });
  const l = list[list.length - 1];
  if (l && last) Object.assign(l, last);
  if (l && pain) for (let j = Math.max(0, list.length - 3); j < list.length; j++) list[j].pain = pain;
  return list;
}


/* ---- Datos ficticios ricos: historial de forma, plan y check-ins generados con fechas relativas a hoy ---- */
const WK = { 1: 55, 2: 70, 3: 0, 4: 88, 5: 32, 6: 150, 0: 95 }; // carga base por dia de la semana (lunes=1 ... domingo=0)
const wkOf = (n) => new Date(off(n) + 'T12:00:00').getDay();
// factor de carga por semana (n = semanas atras): rampa, semana de descarga cada 4 y bloque fuerte reciente
const wkFactor = (w, lvl) => (w <= 0 ? 1 : 1) && lvl * (w >= 12 ? 0.62 : w >= 9 ? 0.78 : w >= 8 ? 0.55 : w >= 5 ? 0.92 : w >= 4 ? 0.6 : w >= 2 ? 1.08 : w >= 1 ? 1.15 : 1.0);
function loadAt(n, lvl) { const w = Math.floor(-n / 7), base = WK[wkOf(n)] || 0; if (!base || (Math.abs(n) * 5 + w * 3) % 9 === 0) return 0; const noise = 1 + 0.12 * Math.sin(n * 1.7) + 0.05 * Math.cos(n * 0.9); return Math.round(base * wkFactor(w, lvl) * noise); }
function mkHistory(lvl, nDays, ctl0, atl0, noL) {
  const days = [], acts = []; let ctl = ctl0, atl = atl0;
  for (let n = -(nDays - 1); n <= 0; n++) {
    const L = loadAt(n, lvl); ctl += (L - ctl) / 42; atl += (L - atl) / 7;
    days.push(Object.assign({ d: off(n), ctl: Math.round(ctl * 10) / 10, atl: Math.round(atl * 10) / 10 }, noL ? {} : { l: L }));
    if (L > 0 && n < 0) acts.push(off(n));
  }
  return { days: days.slice(-120), acts: acts.slice(-200), updatedAt: Date.now() - 50 * 60000 };
}
const SES = { 1: ['Z2 con cadencia', 1.0, 0.45], 2: ['Sweet spot 3x15', 1.0, 0.55], 4: ['Umbral 4x8', 1.0, 0.7], 5: ['Activación suave', 1.0, 0.3], 6: ['Fondo largo', 1.0, 1.4], 0: ['Rodaje de recuperación', 1.0, 0.65] };
function mkPlan(lvl, goalName, goalDetail, goalIn) {
  const sessions = {};
  for (let n = -10; n <= goalIn; n++) {
    const wd = wkOf(n), t = SES[wd]; if (!t) continue;
    const ahead = n > 0 ? n : 0, taper = goalIn - n < 8 ? 0.65 : (goalIn - n < 22 ? 1.05 : 0.95);
    const load = Math.round((WK[wd] || 40) * lvl * 1.05 * taper), min = Math.round(load * 0.95 + 15);
    sessions[off(n)] = { name: t[0], min, km: Math.round(min * (wd === 6 ? 0.5 : 0.36)), load };
  }
  sessions[off(goalIn)] = { name: goalName, min: 240, km: 120, load: 260 };
  const dt = new Date(off(goalIn) + 'T12:00:00'), meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return { goal: { name: goalName, date: off(goalIn), dateText: dt.getDate() + ' de ' + meses[dt.getMonth()], detail: goalDetail },
    phases: [{ n: 'Base y volumen', s: 'Rodajes aeróbicos y constancia', to: off(-1) }, { n: 'Construcción', s: 'Sweet spot, umbral y fondos largos', to: off(Math.round(goalIn * 0.55)) }, { n: 'Intensidad específica', s: 'Repeticiones largas al ritmo de la meta', to: off(goalIn - 8) }, { n: 'Afinamiento', s: 'Menos volumen y piernas frescas', to: off(goalIn - 1) }],
    sessions, notes: { [off(Math.min(goalIn - 1, 6))]: 'Día de descanso completo: hidrátate y duerme bien.', [off(goalIn - 1)]: 'Revisa la bicicleta, prepara tu nutrición y descansa. ¡Ya estás listo!' }, updatedAt: Date.now() - 3600000 };
}
function mkRichCheckins(hist, days) {
  const list = [], tsbOf = {}; hist.days.forEach((r) => { tsbOf[r.d] = r.ctl - r.atl; });
  const comments = { 3: 'Salida con viento en contra pero me sentí fuerte.', 6: 'Buen fondo con el grupo, subí con ganas.', 9: 'Piernas pesadas al comenzar, mejoraron a los 20 minutos.', 13: 'Rodaje tranquilo, escuchando música.', 17: 'Lluvia: lo hice en rodillo.' };
  for (let k = days - 1; k >= 0; k--) {
    const date = off(-k), wd = wkOf(-k), L = loadAt(-k, 1), tsb = tsbOf[date] != null ? tsbOf[date] : 0;
    if (k > 16 && (k * 7) % 5 === 0) continue; // saltos ocasionales antes de la racha actual
    const act = L > 0 && k !== 0, mood = Math.max(1, Math.min(5, Math.round(3.6 + tsb / 25 + 0.6 * Math.sin(k)))), p = SES[wd];
    const c = { id: date, date, type: act ? 'actividad' : (L > 0 ? 'bienestar' : 'descanso'), mood, sleepH: 1 + ((k * 3) % 3), sleepQ: 1 + ((k * 5) % 4), legs: tsb < -12 ? 0 : (tsb < 0 ? 1 : 2), stress: (k * 7) % 3 === 0 ? 1 : 0, rpe: act ? Math.max(3, Math.min(9, Math.round(L / 18))) : null, heat: act ? 1 : null, hard: act ? (L > 120 ? 'si' : 'no') : null, pain: null, comment: comments[k] || '', activity: act ? { name: p ? p[0] : 'Salida', min: Math.round(L * 0.95 + 15), km: Math.round((L * 0.95 + 15) * (wd === 6 ? 0.5 : 0.36)), load: L } : null, ts: tsOf(date, 8, 10 + (k % 40)) };
    if (c.hard === 'si') c.hardInfo = { type: 'Subida larga', dur: '20 min', end: 'Ok' };
    if (k === 10) c.pain = { zone: 'Rodilla', side: 'Izquierdo', level: 'Leve' };
    if (k === 2) { c.type = 'actividad'; c.rpe = 6; c.activity = { name: 'Gym · piernas', min: 60, km: 0, load: null, kind: 'gym', gym: { focus: 'Piernas', dur: 2, feel: 1, zones: { quads: { i: 2, m: 1, t: 'Tirón leve al bajar escaleras' }, glutes: { i: 1, m: 0 }, hamstrings: { i: 1, m: 0 } } } }; c.heat = null; c.hard = null; }
    if (k === 4) { c.type = 'actividad'; c.act2 = { kind: 'gym', name: 'Gym · tren superior', min: 45, km: 0, load: null, rpe: 6, gym: { focus: 'Tren superior', dur: 1, zones: { chest: { i: 1, m: 0 }, shoulders: { i: 1, m: 0 }, upper_back: { i: 2, m: 0 } } } }; if (!c.activity) { c.activity = { name: 'Rodaje', min: 50, km: 20, load: null, kind: 'ruta' }; c.rpe = 4; c.heat = 1; c.hard = 'no'; } }
    list.push(c);
  }
  return list;
}

function seed() {
  const users = {};
  const diegoCk = [];
  const moods = [3, 4, 3, 4, 4, 4], sh = [2, 3, 3, 2, 3, 3], sq = [3, 2, 2, 3, 2, 2], lg = [1, 1, 2, 1, 1, 1], st = [1, 0, 0, 1, 0, 0];
  for (let k = 0; k < 6; k++) {
    const date = off(-6 + k), wd = new Date(date + 'T12:00:00').getDay(), p = PLAN[wd];
    diegoCk.push({ id: date, date, type: p ? 'actividad' : 'descanso', mood: moods[k], sleepH: sh[k], sleepQ: sq[k], legs: lg[k], stress: st[k], rpe: p ? 5 : null, heat: p ? 1 : null, hard: p ? 'no' : null, pain: null, comment: '', activity: p ? { ...p } : null, ts: tsOf(date, 20, 5) });
  }
  const hA = mkHistory(1.0, 100, 38, 34), ckA = mkRichCheckins(hA, 60);
  users.demoAtleta = { profile: { id: 'demoAtleta', name: 'Tomás (demo)', role: 'athlete', team: 'grnt', coachId: 'demoCoach', pending: false, reminder: '19:30' }, checkins: ckA, history: hA, plan: mkPlan(1.0, 'Gran Fondo Cordillera', '120 km · 2.400 m D+ · objetivo principal', 49), notes: [
    { id: 'n0', text: 'Buen trabajo con el rodillo suave. Mañana mantenemos zona 2 y vemos cómo responden las piernas.', at: tsOf(off(-1), 21, 40), from: 'demoCoach' },
    { id: 'n1', text: 'Ojo con la molestia de rodilla: si vuelve, avísame antes de la próxima salida larga.', at: tsOf(off(-8), 20, 15), from: 'demoCoach' },
    { id: 'n2', text: 'Semana de construcción lista. Tu aptitud va subiendo de forma pareja, ¡sigue así!', at: tsOf(off(-14), 19, 30), from: 'demoCoach' }] };
  const hC = mkHistory(0.95, 100, 36, 31);
  users.demoCoach = { profile: { id: 'demoCoach', name: 'Coach (demo)', role: 'coach', team: null, pending: false, reminder: '19:30' }, checkins: mkRichCheckins(hC, 40), history: hC, plan: mkPlan(0.95, 'Travesía de montaña', '160 km · 3.000 m D+ · tu propio objetivo', 63), notes: [] };
  const ath = (id, name, team, arr, last, pain, lvl, plan) => { users[id] = { profile: { id, name, role: 'athlete', team, coachId: 'demoCoach', pending: false }, checkins: mkCheckins(arr, last, pain), notes: [], history: mkHistory(lvl || 0.9, 100, 30, 28, id === 'valentina') }; if (plan) users[id].plan = mkPlan(lvl || 0.9, plan[0], plan[1], plan[2]); };
  ath('camila', 'Camila R.', 'grnt', [4, 4, 3, 4, 4, 5, 4], { sleepH: 3, sleepQ: 2, legs: 1, stress: 0, rpe: 6, comment: 'Salida suave con el grupo, todo bien.', ts: tsOf(off(0), 8, 10) }, null, 1.05, ['Vuelta al Lago', '90 km · 1.200 m D+', 35]);
  ath('joaquin', 'Joaquín P.', 'zn', [4, 4, 3, 3, 2, 2, 2], { sleepH: 1, sleepQ: 3, legs: 0, stress: 2, rpe: 7, comment: 'Me molesta un poco el muslo al pedalear fuerte.', ts: tsOf(off(0), 7, 45) }, { zone: 'Muslo', side: 'Derecho', level: 'Leve' }, 1.5, ['Cuesta Barriga', '40 km · 1.100 m D+', 28]);
  ath('matias', 'Matías S.', 'grnt', [3, 3, 4, 4, 3, 4, null], { sleepH: 3, sleepQ: 1, legs: 2, stress: 0, rpe: 5, ts: tsOf(off(-1), 21, 30) }, null, 0.85);
  ath('valentina', 'Valentina T.', 'zn', [4, 4, 3, 4, null, null, null], { sleepH: 2, sleepQ: 2, legs: 1, stress: 1, rpe: 4, ts: tsOf(off(-3), 19, 50) }, null, 0.7);
  users.demoAtleta.bioMain = { birthDate: '1988-04-12', heightCm: 176, sex: null, sport: 'Ruta', health: { conditions: '', meds: '', injuries: 'Tendón rotuliano derecho (2024), ya recuperado', allergies: '' }, emergency: { name: 'Marta (pareja)', phone: '+56 9 1234 5678' }, showWeight: false, consentTs: tsOf(off(-10), 9, 0), updatedAt: tsOf(off(-10), 9, 0) };
  users.demoAtleta.bioMeas = { weightKg: 72, ftp: 245, fcmax: 188, lthr: 168, updatedAt: tsOf(off(-20), 10, 0), by: 'demoCoach' };
  users.camila.bioMain = { birthDate: '1992-09-03', heightCm: 165, sex: 'f', sport: 'Gravel', health: { conditions: '', meds: '', injuries: '', allergies: '' }, emergency: { name: '', phone: '' }, showWeight: false, consentTs: tsOf(off(-30), 9, 0), updatedAt: tsOf(off(-30), 9, 0) };
  users.camila.bioMeas = { weightKg: 58, ftp: 205, fcmax: 191, updatedAt: tsOf(off(-30), 9, 0), by: 'demoCoach', prop: { weightKg: { v: 57, note: 'Me pesé esta mañana', ts: tsOf(off(-1), 8, 0) }, ftp: { v: 212, note: 'Test de 20 min del domingo', ts: tsOf(off(-1), 8, 0) } } };
  users.demoLector = { profile: { id: 'demoLector', name: 'Leo (demo, solo lectura)', role: 'viewer', coachId: 'demoCoach', team: null, pending: false }, checkins: [], notes: [] };
  users.nuevo = { profile: { id: 'nuevo', name: 'Atleta nuevo (demo)', role: 'athlete', pending: true }, checkins: [], notes: [] };
  const mo = ymd(new Date()).slice(0, 7), k = (name, km) => ({ name, month: mo, km });
  return { users, km: { grnt: { demoAtleta: k('Tomás (demo)', 412), camila: k('Camila R.', 520), matias: k('Matías S.', 380), lucas: k('Lucas V.', 290), sofia: k('Sofía M.', 345) }, zn: { joaquin: k('Joaquín P.', 310), valentina: k('Valentina T.', 260), emilia: k('Emilia C.', 405), nicolas: k('Nicolás A.', 220) } }, meta: { grnt: { goal: 2500, hito: 'Salida grupal del sábado: 70 km por el camino costero, ritmo conversado.' }, zn: { goal: 1800, hito: 'Semana de recuperación activa: rodajes suaves y movilidad.' } },
    feedback: [{ id: 'f1', uid: 'camila', name: 'Camila R.', team: 'grnt', kind: 'idea', text: 'Sería genial ver el clima del día en la pantalla Hoy, para decidir a qué hora salir.', ts: Date.now() - 3 * 3600000, read: false }, { id: 'f2', uid: 'matias', name: 'Matías S.', team: 'grnt', kind: 'consulta', text: '¿Cómo se calcula la fatiga? No me queda claro por qué sube tanto después del fondo largo.', ts: Date.now() - 30 * 3600000, read: true }] };
}

let store;
try { const r = localStorage.getItem(KEY); store = r ? JSON.parse(r) : null; } catch (e) { store = null; }
if (!store || !store.users) store = seed();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
const subs = new Set();
const notify = () => { persist(); [...subs].forEach(f => f()); };
const live = (fn) => { subs.add(fn); fn(); return () => subs.delete(fn); };
const byDateDesc = (a, b) => (a.date < b.date ? 1 : -1);

let authCb = null, current = null;
const be = {
  mode: 'demo',
  setErrorHandler() {},
  onAuth(cb) {
    authCb = cb;
    let saved = null;
    try { saved = sessionStorage.getItem('camino-demo-user'); } catch (e) {}
    // Enlaces directos: ?demo=atleta entra solo como atleta y ?demo=coach solo como coach (sin pantalla de ingreso)
    const q = new URLSearchParams(location.search).get('demo');
    const forced = (q === 'lector') ? 'demoLector' : (q === 'coach') ? 'demoCoach' : ((q === 'atleta' || q === 'athlete') ? 'demoAtleta' : null);
    if (forced) { saved = forced; try { sessionStorage.setItem('camino-demo-user', forced); } catch (e) {} }
    setTimeout(() => cb(saved && store.users[saved] ? { uid: saved, name: store.users[saved].profile.name } : null), 0);
    return () => { authCb = null; };
  },
  async signIn(which) {
    const uid = which === 'coach' ? 'demoCoach' : 'demoAtleta';
    try { sessionStorage.setItem('camino-demo-user', uid); } catch (e) {}
    current = uid;
    authCb && authCb({ uid, name: store.users[uid].profile.name });
  },
  async signOut() { try { sessionStorage.removeItem('camino-demo-user'); } catch (e) {} current = null; authCb && authCb(null); },
  async ensureProfile() {},
  listenBio(uid, cb) { return live(() => { const u = store.users[uid] || {}; cb(JSON.parse(JSON.stringify({ main: u.bioMain || null, meas: u.bioMeas || null }))); }); },
  async saveBio(uid, data) { store.users[uid].bioMain = data; notify(); },
  async propose(uid, prop) { const u = store.users[uid]; u.bioMeas = Object.assign({}, u.bioMeas || {}, { prop }); notify(); },
  async saveMeas(uid, data) { store.users[uid].bioMeas = data; notify(); },
  listenProfile(uid, cb) { return live(() => cb({ ...store.users[uid].profile })); },
  async saveProfile(uid, patch) { Object.assign(store.users[uid].profile, patch); notify(); },
  listenCheckins(uid, cb) { return live(() => cb([...store.users[uid].checkins].sort(byDateDesc).map(c => ({ ...c })))); },
  async deleteCheckin(uid, date) { const u = store.users[uid]; u.checkins = u.checkins.filter(x => x.date !== date); notify(); },
  async importCheckin(uid, c) { const u = store.users[uid]; if (u.checkins.some(x => x.date === c.date)) throw Object.assign(new Error('exists'), { code: 'permission-denied' }); u.checkins.push({ id: c.date, ...c }); notify(); },
  async saveCheckin(uid, c) { const u = store.users[uid]; u.checkins = u.checkins.filter(x => x.date !== c.date); u.checkins.push({ id: c.date, ...c }); notify(); },
  listenNotes(uid, cb) { return live(() => cb(store.users[uid].notes.map(n => ({ ...n })))); },
  listenPlan(uid, cb) { return live(() => cb(store.users[uid] && store.users[uid].plan ? JSON.parse(JSON.stringify(store.users[uid].plan)) : null)); },
  async savePlan(uid, data) { store.users[uid].plan = data; notify(); },
  listenHistory(uid, cb) { return live(() => cb(store.users[uid] && store.users[uid].history ? JSON.parse(JSON.stringify(store.users[uid].history)) : null)); },
  async saveHistory(uid, data) { store.users[uid].history = data; notify(); },
  listenTeamKm(team, cb) { return live(() => cb(Object.entries(store.km[team] || {}).map(([id, v]) => ({ id, ...v })))); },
  async removeKm(team, uid) { if (store.km[team]) delete store.km[team][uid]; notify(); },
  async saveKm(team, uid, data) { (store.km[team] = store.km[team] || {})[uid] = data; notify(); },
  listenTeamMeta(team, cb) { return live(() => cb(store.meta[team] ? { ...store.meta[team] } : null)); },
  async saveTeamMeta(team, data) { store.meta[team] = { ...(store.meta[team] || {}), ...data }; notify(); },
  listenAthletes(coachUid, cb) { return live(() => cb(Object.values(store.users).filter(u => u.profile.coachId === coachUid).map(u => ({ ...u.profile })))); },
  listenPending(cb) { return live(() => cb(Object.values(store.users).filter(u => u.profile.pending === true).map(u => ({ ...u.profile })))); },
  async acceptAthlete(uid, coachUid, team) { Object.assign(store.users[uid].profile, { coachId: coachUid, team, pending: false }); notify(); },
  async sendNote(uid, note) { store.users[uid].notes.push({ id: 'n' + Date.now(), ...note }); notify(); },
  async sendFeedback(fb) { (store.feedback = store.feedback || []).unshift({ id: 'f' + Date.now(), ...fb }); notify(); },
  listenFeedback(cb) { return live(() => cb([...(store.feedback || [])])); },
  async markFeedback(id, read) { const x = (store.feedback || []).find(f => f.id === id); if (x) x.read = !!read; notify(); },
  async removeFeedback(id) { store.feedback = (store.feedback || []).filter(f => f.id !== id); notify(); }
};
export default be;
