// Capa de datos real: Firebase Auth (Google) + Firestore.
// Misma interfaz que backend-demo.js. Todas las lecturas en vivo devuelven una función para cancelar.
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { initializeFirestore, terminate, clearIndexedDbPersistence, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getDocFromServer, setDoc, updateDoc, deleteDoc, writeBatch, collection, query, where, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  db = initializeFirestore(app, {});
}

let onError = () => {};
const fail = (where, quiet) => (err) => { console.warn(where, err && err.code); if (!quiet) onError(where, err); };
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

  // Perfil del atleta: datos que él mismo completa (main) y medidas que aprueba su coach (meas, con propuestas en meas.prop)
  // opts.priv: leer también salud/emergencia (profile/private); solo la persona y el coach principal.
  // opts.quiet: un coach de apoyo puede no tener permiso (nivel perfil apagado): se trata como vacío, sin avisos.
  // opts.migrate: la propia persona mueve health/emergency desde main a private (una sola vez, automático).
  listenBio(uid, cb, opts = {}) {
    let main = null, meas = null, priv = null, migrating = false, privSeen = !opts.priv; const emit = () => cb({ main: main ? { ...main, ...(priv || {}) } : (priv ? { ...priv } : null), meas, privReady: privSeen });
    const q = !!opts.quiet;
    const u1 = onSnapshot(doc(db, 'users', uid, 'profile', 'main'), (s) => {
      main = s.exists() ? s.data() : null;
      if (opts.migrate && main && (main.health || main.emergency) && !migrating) {
        migrating = true;
        const { health, emergency, ...rest } = main;
        const wb = writeBatch(db);
        wb.set(doc(db, 'users', uid, 'profile', 'private'), clean({ health: health || null, emergency: emergency || null, updatedAt: Date.now() }));
        wb.set(doc(db, 'users', uid, 'profile', 'main'), clean(rest));
        wb.commit()
          .catch((e) => { migrating = false; console.warn('migrar perfil', e && e.code); });
      }
      emit();
    }, fail('perfil del atleta', q));
    const u2 = onSnapshot(doc(db, 'users', uid, 'profile', 'measures'), (s) => { meas = s.exists() ? s.data() : null; emit(); }, fail('medidas', q));
    const u3 = opts.priv ? onSnapshot(doc(db, 'users', uid, 'profile', 'private'), (s) => { priv = s.exists() ? s.data() : null; privSeen = true; emit(); }, fail('datos privados', q)) : () => {};
    return () => { u1(); u2(); u3(); };
  },
  // main (sin salud ni emergencia) + private (salud y emergencia) en dos documentos.
  async saveBio(uid, data) {
    const { health, emergency, ...main } = data || {};
    const wb = writeBatch(db);
    wb.set(doc(db, 'users', uid, 'profile', 'private'), clean({ health: health || null, emergency: emergency || null, updatedAt: Date.now() }));
    wb.set(doc(db, 'users', uid, 'profile', 'main'), clean(main));
    return wb.commit();
  },
  // v48: guardado por secciones. main se mezcla (merge) y private se reemplaza entera (solo salud y emergencia).
  saveMainPart(uid, data) { return setDoc(doc(db, 'users', uid, 'profile', 'main'), clean(data), { merge: true }); },
  savePriv(uid, data) { return setDoc(doc(db, 'users', uid, 'profile', 'private'), clean({ health: data.health || null, emergency: data.emergency || null, updatedAt: Date.now() })); },
  // El atleta solo propone (campo prop); el coach aprueba y escribe las medidas.
  propose(uid, prop) { return setDoc(doc(db, 'users', uid, 'profile', 'measures'), clean({ prop }), { merge: true }); },
  saveMeas(uid, data) { return setDoc(doc(db, 'users', uid, 'profile', 'measures'), clean(data)); },

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
  // Recorrido simplificado de una salida (lo escribe el sync; lo leen el atleta y su coach)
  async getRoute(uid, id) { const s = await getDoc(doc(db, 'users', uid, 'routes', String(id))); return s.exists() ? s.data() : null; },
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
  // Coach de apoyo: solo los equipos y atletas que el coach principal le abrió (access). Una consulta por equipo y un documento por atleta suelto.
  listenAthletesScoped(coachUid, access, cb) {
    const acc = access || {}; const parts = {}; const emit = () => cb(Object.values(parts).flat());
    const unsubs = [];
    (acc.teams || []).forEach((t) => {
      const q = query(collection(db, 'users'), where('coachId', '==', coachUid), where('role', '==', 'athlete'), where('team', '==', t));
      unsubs.push(onSnapshot(q, (s) => { parts['t:' + t] = rows(s); emit(); }, fail('atletas del equipo ' + t, true)));
    });
    (acc.athletes || []).forEach((id) => {
      unsubs.push(onSnapshot(doc(db, 'users', id), (s) => { parts['a:' + id] = s.exists() ? [{ id: s.id, ...s.data() }] : []; emit(); }, fail('atleta', true)));
    });
    if (!unsubs.length) cb([]);
    return () => unsubs.forEach((u) => u());
  },
  // Permisos del coach de apoyo (solo los escribe el coach principal)
  setAccess(viewerUid, access) { return updateDoc(doc(db, 'users', viewerUid), { access: clean(access) }); },
  // Propuestas del coach de apoyo (atleta o grupo nuevo); las resuelve el coach principal
  // Mensajes coach principal <-> coach de apoyo (hilo por coach de apoyo: coachChat/{vid}/msgs)
  listenChat(vid, cb) { const q = query(collection(db, 'coachChat', vid, 'msgs'), orderBy('ts', 'desc'), limit(50)); return onSnapshot(q, (s) => cb(rows(s)), fail('mensajes entre coaches')); },
  sendChat(vid, m) { return setDoc(doc(collection(db, 'coachChat', vid, 'msgs')), clean(m)); },
  sendProposal(p) { return setDoc(doc(collection(db, 'proposals')), clean(p)); },
  listenProposals(cb, byUid) {
    const q = byUid ? query(collection(db, 'proposals'), where('by', '==', byUid)) : query(collection(db, 'proposals'), orderBy('ts', 'desc'), limit(50));
    return onSnapshot(q, (s) => cb(rows(s).sort((a, b) => b.ts - a.ts)), fail('propuestas'));
  },
  resolveProposal(id, status) { return updateDoc(doc(db, 'proposals', id), { status, decidedAt: Date.now() }); },
  removeProposal(id) { return deleteDoc(doc(db, 'proposals', id)); },
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
