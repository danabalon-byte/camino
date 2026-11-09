// Revisión quincenal de medidas (peso, FTP, FC máx, LTHR) desde intervals.icu.
// No pisa nada: deja PROPUESTAS en users/{uid}/profile/measures.prop (marcadas auto:true).
// El coach las aprueba o rechaza en la app; el atleta las ve en "Tus medidas".
// El registro es público: solo imprime conteos, nunca datos de atletas.
import admin from 'firebase-admin';

const DRY = process.env.DRY_RUN === 'true';
const sa = JSON.parse(process.env.FIREBASE_SA || '{}');
const map = JSON.parse(process.env.ICU_MAP || '{}');
const key = process.env.ICU_API_KEY;
if (!sa.project_id || !key || !Object.keys(map).length) { console.error('Faltan secretos (FIREBASE_SA, ICU_API_KEY o ICU_MAP).'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const auth = 'Basic ' + Buffer.from('API_KEY:' + key).toString('base64');
const RNG = { weightKg: [30, 200], ftp: [50, 600], fcmax: [120, 230], lthr: [100, 220] };
const NOTE = 'Detectado en intervals.icu (revisión automática)';

async function icu(path) {
  const r = await fetch('https://intervals.icu/api/v1' + path, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error('intervals.icu ' + r.status);
  return r.json();
}
const ymd = (d) => d.toISOString().slice(0, 10);
const ok = (k, v) => Number.isFinite(v) && v >= RNG[k][0] && v <= RNG[k][1];

// Cambio relevante: FTP ±3 %, peso ±1,5 kg, LTHR ±3 ppm, FC máx ±2 ppm; o dato que aún no existe.
function changed(k, now, cur) {
  if (cur == null) return true;
  if (k === 'ftp') return Math.abs(now - cur) / cur >= 0.03;
  if (k === 'weightKg') return Math.abs(now - cur) >= 1.5;
  if (k === 'lthr') return Math.abs(now - cur) >= 3;
  return Math.abs(now - cur) >= 2;
}

let proposed = 0, athletes = 0, errors = 0;
for (const [email, aid] of Object.entries(map)) {
  try {
    let snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) snap = await db.collection('users').where('email', '==', String(email).toLowerCase()).limit(1).get();
    if (snap.empty) continue; // aún no entró a la app
    const uid = snap.docs[0].id; athletes++;

    const a = await icu('/athlete/' + aid);
    const ss = (a.sportSettings || []).find((s) => (s.types || []).some((t) => /Ride/.test(t))) || (a.sportSettings || [])[0] || {};
    const found = { ftp: Number(ss.ftp) || null, lthr: Number(ss.lthr) || null, fcmax: Number(ss.max_hr) || null };
    const w = await icu('/athlete/' + aid + '/wellness?oldest=' + ymd(new Date(Date.now() - 30 * 864e5)) + '&newest=' + ymd(new Date()) + '&cols=id,weight').catch(() => []);
    const lastW = (Array.isArray(w) ? w : []).filter((x) => Number(x.weight) > 0).sort((x, y) => String(y.id).localeCompare(String(x.id)))[0];
    found.weightKg = lastW ? Math.round(Number(lastW.weight) * 10) / 10 : (Number(a.icu_weight) > 0 ? Math.round(Number(a.icu_weight) * 10) / 10 : null);

    const mref = db.doc('users/' + uid + '/profile/measures'), sref = db.doc('users/' + uid + '/profile/revision');
    const [ms, rs] = await Promise.all([mref.get(), sref.get()]);
    const cur = ms.exists ? ms.data() : {}, prop = Object.assign({}, cur.prop || {}), seen = Object.assign({}, rs.exists ? rs.data().seen : {});
    let n = 0;
    for (const k of Object.keys(RNG)) {
      const v = found[k]; if (!ok(k, v)) continue;
      if (!changed(k, v, cur[k])) continue;
      if (prop[k] && prop[k].v === v) continue;   // ya está pendiente
      if (seen[k] === v) continue;                 // ya se propuso antes y se descartó
      prop[k] = { v, note: NOTE, ts: Date.now(), auto: true }; seen[k] = v; n++;
    }
    if (n && !DRY) {
      await mref.set({ prop }, { merge: true });
      await sref.set({ seen, updatedAt: Date.now() });
    }
    proposed += n;
  } catch (e) { errors++; console.error('Error en un atleta:', e.message); }
}
console.log((DRY ? '[simulación] ' : '') + 'Atletas revisados: ' + athletes + ' · propuestas nuevas: ' + proposed + ' · errores: ' + errors);
if (errors && !athletes) process.exit(1);
