// Capa de datos de Camino Ruta: Firebase Auth (Google) + Firestore, igual que Camino.
// Usa el mismo proyecto y la misma sesion: la configuracion web viene de ../firebase-config.js (no es un secreto;
// los datos los protegen las reglas de Firestore).
import { firebaseConfig } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { initializeFirestore, terminate, clearIndexedDbPersistence, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, deleteDoc, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); } catch (e) { db = initializeFirestore(app, {}); }

const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === undefined ? null : v)));
const one = async (path) => { try { const s = await getDoc(doc(db, ...path)); return s.exists() ? s.data() : null; } catch (e) { return null; } };

export const be = {
  onAuth(cb) {
    getRedirectResult(auth).catch(() => {});
    return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, name: u.displayName || 'Atleta', email: u.email || null } : null));
  },
  async signIn() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { await signInWithPopup(auth, provider); }
    catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) await signInWithRedirect(auth, provider);
      else if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return;
      else throw e;
    }
  },
  async signOut() {
    await signOut(auth);
    try { await terminate(db); await clearIndexedDbPersistence(db); } catch (e) { /* si falla, igual se recarga */ }
    location.reload();
  },
  watchProfile(uid, cb, err) { return onSnapshot(doc(db, 'users', uid), (s) => cb(s.exists() ? s.data() : null), err); },
  watchEvents(uid, cb, err) { return onSnapshot(collection(db, 'users', uid, 'events'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), err); },
  // Perfil para sugerir nutricion (solo lectura; si no hay permiso o dato, se omite).
  async getBio(uid) {
    const [main, priv, measures] = await Promise.all([one(['users', uid, 'profile', 'main']), one(['users', uid, 'profile', 'private']), one(['users', uid, 'profile', 'measures'])]);
    return { main, private: priv, measures };
  },
  saveEvent(uid, id, data) { return setDoc(doc(db, 'users', uid, 'events', String(id)), clean(data)); },
  mergeEvent(uid, id, part) { return setDoc(doc(db, 'users', uid, 'events', String(id)), clean(part), { merge: true }); },
  deleteEvent(uid, id) { return deleteDoc(doc(db, 'users', uid, 'events', String(id))); },
  async getCheckin(uid, date) { const s = await getDoc(doc(db, 'users', uid, 'checkins', date)); return s.exists() ? s.data() : null; },
  saveCheckin(uid, c) { return setDoc(doc(db, 'users', uid, 'checkins', c.date), clean(c)); },
  // Sin senal, Firestore guarda la escritura en el telefono y la promesa tarda: se da por encolada tras `ms`.
  settle(p, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => resolve('timeout'), ms);
      p.then(() => { clearTimeout(t); resolve('ok'); }, (e) => { clearTimeout(t); reject(e); });
    });
  }
};
