// Modo demostración (?demo=1): mismos métodos que backend-firebase.js, pero con datos
// ficticios guardados en este navegador. No usa red. Sirve para probar el diseño y los flujos.
const KEY = 'camino-demo-v1';
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

function seed() {
  const users = {};
  const diegoCk = [];
  const moods = [3, 4, 3, 4, 4, 4], sh = [2, 3, 3, 2, 3, 3], sq = [3, 2, 2, 3, 2, 2], lg = [1, 1, 2, 1, 1, 1], st = [1, 0, 0, 1, 0, 0];
  for (let k = 0; k < 6; k++) {
    const date = off(-6 + k), wd = new Date(date + 'T12:00:00').getDay(), p = PLAN[wd];
    diegoCk.push({ id: date, date, type: p ? 'actividad' : 'descanso', mood: moods[k], sleepH: sh[k], sleepQ: sq[k], legs: lg[k], stress: st[k], rpe: p ? 5 : null, heat: p ? 1 : null, hard: p ? 'no' : null, pain: null, comment: '', activity: p ? { ...p } : null, ts: tsOf(date, 20, 5) });
  }
  users.demoAtleta = { profile: { id: 'demoAtleta', name: 'Diego (demo)', role: 'athlete', team: 'zn', coachId: 'demoCoach', pending: false, reminder: '19:30' }, checkins: diegoCk, notes: [{ id: 'n0', text: 'Buen trabajo con el rodillo suave. Mañana mantenemos zona 2 y vemos cómo responden las piernas.', at: tsOf(off(-1), 21, 40), from: 'demoCoach' }] };
  users.demoCoach = { profile: { id: 'demoCoach', name: 'Coach (demo)', role: 'coach', team: null, pending: false, reminder: '19:30' }, checkins: [], notes: [] };
  const ath = (id, name, team, arr, last, pain) => { users[id] = { profile: { id, name, role: 'athlete', team, coachId: 'demoCoach', pending: false }, checkins: mkCheckins(arr, last, pain), notes: [] }; };
  ath('camila', 'Camila R.', 'grnt', [4, 4, 3, 4, 4, 5, 4], { sleepH: 3, sleepQ: 2, legs: 1, stress: 0, rpe: 6, comment: 'Salida suave con el grupo, todo bien.', ts: tsOf(off(0), 8, 10) });
  ath('joaquin', 'Joaquín P.', 'zn', [4, 4, 3, 3, 2, 2, 2], { sleepH: 1, sleepQ: 3, legs: 0, stress: 2, rpe: 7, comment: 'Me molesta un poco el muslo al pedalear fuerte.', ts: tsOf(off(0), 7, 45) }, { zone: 'Muslo', side: 'Derecho', level: 'Leve' });
  ath('matias', 'Matías S.', 'grnt', [3, 3, 4, 4, 3, 4, null], { sleepH: 3, sleepQ: 1, legs: 2, stress: 0, rpe: 5, ts: tsOf(off(-1), 21, 30) });
  ath('valentina', 'Valentina T.', 'zn', [4, 4, 3, 4, null, null, null], { sleepH: 2, sleepQ: 2, legs: 1, stress: 1, rpe: 4, ts: tsOf(off(-3), 19, 50) });
  users.nuevo = { profile: { id: 'nuevo', name: 'Atleta nuevo (demo)', role: 'athlete', pending: true }, checkins: [], notes: [] };
  return { users, km: { zn: { demoAtleta: { name: 'Diego (demo)', month: ymd(new Date()).slice(0, 7), km: 190 }, joaquin: { name: 'Joaquín P.', month: ymd(new Date()).slice(0, 7), km: 310 }, valentina: { name: 'Valentina T.', month: ymd(new Date()).slice(0, 7), km: 240 } }, grnt: { camila: { name: 'Camila R.', month: ymd(new Date()).slice(0, 7), km: 420 }, matias: { name: 'Matías S.', month: ymd(new Date()).slice(0, 7), km: 280 } } }, meta: { zn: { goal: 2000, hito: 'Camila R. hizo su rodaje más largo hasta ahora: 3 h 20 min.' }, grnt: { goal: 2000, hito: '' } } };
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
  listenProfile(uid, cb) { return live(() => cb({ ...store.users[uid].profile })); },
  async saveProfile(uid, patch) { Object.assign(store.users[uid].profile, patch); notify(); },
  listenCheckins(uid, cb) { return live(() => cb([...store.users[uid].checkins].sort(byDateDesc).map(c => ({ ...c })))); },
  async saveCheckin(uid, c) { const u = store.users[uid]; u.checkins = u.checkins.filter(x => x.date !== c.date); u.checkins.push({ id: c.date, ...c }); notify(); },
  listenNotes(uid, cb) { return live(() => cb(store.users[uid].notes.map(n => ({ ...n })))); },
  listenPlan(uid, cb) { return live(() => cb(store.users[uid] && store.users[uid].plan ? JSON.parse(JSON.stringify(store.users[uid].plan)) : null)); },
  async savePlan(uid, data) { store.users[uid].plan = data; notify(); },
  listenHistory(uid, cb) { return live(() => cb(store.users[uid] && store.users[uid].history ? JSON.parse(JSON.stringify(store.users[uid].history)) : null)); },
  async saveHistory(uid, data) { store.users[uid].history = data; notify(); },
  listenTeamKm(team, cb) { return live(() => cb(Object.entries(store.km[team] || {}).map(([id, v]) => ({ id, ...v })))); },
  async saveKm(team, uid, data) { (store.km[team] = store.km[team] || {})[uid] = data; notify(); },
  listenTeamMeta(team, cb) { return live(() => cb(store.meta[team] ? { ...store.meta[team] } : null)); },
  async saveTeamMeta(team, data) { store.meta[team] = { ...(store.meta[team] || {}), ...data }; notify(); },
  listenAthletes(coachUid, cb) { return live(() => cb(Object.values(store.users).filter(u => u.profile.coachId === coachUid).map(u => ({ ...u.profile })))); },
  listenPending(cb) { return live(() => cb(Object.values(store.users).filter(u => u.profile.pending === true).map(u => ({ ...u.profile })))); },
  async acceptAthlete(uid, coachUid, team) { Object.assign(store.users[uid].profile, { coachId: coachUid, team, pending: false }); notify(); },
  async sendNote(uid, note) { store.users[uid].notes.push({ id: 'n' + Date.now(), ...note }); notify(); }
};
export default be;
