// Capa de datos real: Firebase Auth (Google) + Firestore.
// Misma interfaz que backend-demo.js. Todas las lecturas en vivo devuelven una función para cancelar.
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { initializeFirestore, terminate, clearIndexedDbPersistence, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getDocFromServer, setDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  db = initializeFirestore(app, {});
}

let onError = () => {};
const fail = (where) => (err) => { console.warn(where, err && err.code); onError(where, err); };
const rows = (snap) => snap.docs.map(d => ({ id: d.id, ...d.data() }));
const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === undefined ? null : v)));

const be = {
  mode: 'firebase',
  setErrorHandler(fn) { onError = fn; },

  onAuth(cb) {
    getRedirectResult(auth).catch(fail('redirect'));
    return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, name: u.displayName || 'Atleta', email: u.email || null } : null));
  },
  async signIn() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
        await signInWithRedirect(auth, provider);
      } else if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) {
        return;
      } else {
        throw e;
      }
    }
  },
  async signOut() {
    // Al cerrar sesión se borra la caché local (bienestar y molestias) para no dejarla en equipos compartidos.
    await signOut(auth);
    try { await terminate(db); await clearIndexedDbPersistence(db); } catch (e) { /* si falla, igual se recarga */ }
    location.reload();
  },

  // Perfil propio (se crea en el primer ingreso como atleta pendiente de asignación)
  async ensureProfile(user) {
    const ref = doc(db, 'users', user.uid);
    let snap;
    // Solo se crea el perfil si el SERVIDOR confirma que no existe (la caché local vacía no cuenta).
    try { snap = await getDocFromServer(ref); } catch (e) { return; }
    if (!snap.exists()) {
      try { await setDoc(ref, { name: String(user.name).slice(0, 80), email: user.email, role: 'athlete', pending: true, reminder: '19:30', createdAt: Date.now() }); } catch (e) { e.step = 'crear-perfil'; throw e; }
    }
  },
  listenProfile(uid, cb) {
    return onSnapshot(doc(db, 'users', uid), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), fail('perfil'));
  },
  saveProfile(uid, patch) { return updateDoc(doc(db, 'users', uid), clean(patch)); },

  listenCheckins(uid, cb, n = 120) {
    const q = query(collection(db, 'users', uid, 'checkins'), orderBy('date', 'desc'), limit(n));
    return onSnapshot(q, (s) => cb(rows(s)), fail('check-ins'));
  },
  deleteCheckin(uid, date) { return deleteDoc(doc(db, 'users', uid, 'checkins', date)); },
  // El coach importa historial (solo crea; si el día ya existe, Firestore lo rechaza y no se pisa nada).
  importCheckin(uid, c) { return setDoc(doc(db, 'users', uid, 'checkins', c.date), clean(c)); },
  saveCheckin(uid, c) { return setDoc(doc(db, 'users', uid, 'checkins', c.date), clean(c)); },
  listenNotes(uid, cb) {
    const q = query(collection(db, 'users', uid, 'notes'), orderBy('at', 'desc'), limit(20));
    return onSnapshot(q, (s) => cb(rows(s).reverse()), fail('notas'));
  },

  // Plan del atleta (lo escribe su coach, lo lee el atleta)
  listenPlan(uid, cb) {
    return onSnapshot(doc(db, 'users', uid, 'plan', 'current'), (s) => cb(s.exists() ? s.data() : null), fail('plan'));
  },
  savePlan(uid, data) { return setDoc(doc(db, 'users', uid, 'plan', 'current'), clean(data)); },
  listenHistory(uid, cb) {
    return onSnapshot(doc(db, 'users', uid, 'history', 'current'), (s) => cb(s.exists() ? s.data() : null), fail('historial'));
  },
  saveHistory(uid, data) { return setDoc(doc(db, 'users', uid, 'history', 'current'), clean(data)); },

  // Equipo: kilómetros por persona (solo nombre, mes y km) y meta/hito que fija el coach
  listenTeamKm(team, cb) {
    return onSnapshot(collection(db, 'teams', team, 'km'), (s) => cb(rows(s)), fail('km del equipo'));
  },
  removeKm(team, uid) { return deleteDoc(doc(db, 'teams', team, 'km', uid)); },
  saveKm(team, uid, data) { return setDoc(doc(db, 'teams', team, 'km', uid), clean(data)); },
  listenTeamMeta(team, cb) {
    return onSnapshot(doc(db, 'teams', team, 'meta', 'current'), (s) => cb(s.exists() ? s.data() : null), fail('meta del equipo'));
  },
  saveTeamMeta(team, data) { return setDoc(doc(db, 'teams', team, 'meta', 'current'), clean(data), { merge: true }); },

  // Coach
  listenAthletes(coachUid, cb) {
    const q = query(collection(db, 'users'), where('coachId', '==', coachUid));
    return onSnapshot(q, (s) => cb(rows(s)), fail('atletas'));
  },
  listenPending(cb) {
    const q = query(collection(db, 'users'), where('pending', '==', true));
    return onSnapshot(q, (s) => cb(rows(s)), fail('solicitudes'));
  },
  acceptAthlete(uid, coachUid, team) {
    return updateDoc(doc(db, 'users', uid), { coachId: coachUid, team, pending: false });
  },
  sendNote(uid, note) {
    return setDoc(doc(collection(db, 'users', uid, 'notes')), clean(note));
  },
  // Consultas, ideas y comentarios de los atletas (los lee y gestiona solo el coach).
  sendFeedback(fb) {
    return setDoc(doc(collection(db, 'feedback')), clean(fb));
  },
  listenFeedback(cb) {
    const q = query(collection(db, 'feedback'), orderBy('ts', 'desc'), limit(50));
    return onSnapshot(q, (s) => cb(rows(s)), fail('comentarios'));
  },
  markFeedback(id, read) {
    return updateDoc(doc(db, 'feedback', id), { read: !!read });
  },
  removeFeedback(id) {
    return deleteDoc(doc(db, 'feedback', id));
  }
};

export default be;
