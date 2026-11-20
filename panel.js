/* Panel semanal ("Tu semana"): informe interactivo de cada atleta.
   Dibuja con d3 desde un documento de Firestore (users/{uid}/panel/{semana}); no lleva datos incrustados.
   Todo lo que depende de la semana o del atleta (zonas, cadencia meta, textos, misiones) sale del documento.
   La "Carga" es la de intervals.icu calculada con pulso, no TSS de potencia: la aclaración es fija y visible. */

let d3p = null;
export function loadD3() {
  if (window.d3) return Promise.resolve(window.d3);
  if (!d3p) d3p = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'd3.min.js?v=7.9.0';
    s.onload = () => res(window.d3);
    s.onerror = () => { d3p = null; rej(new Error('d3')); };
    document.head.appendChild(s);
  });
  return d3p;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIAL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
// Íconos del Panel -> Phosphor (los dibuja app.js con ph())
const IC = { heart: 'heart', pulse: 'heartbeat', flame: 'flame', battery: 'battery-medium', bolt: 'lightning', clock: 'clock', wheel: 'gear-six', trophy: 'trophy', target: 'target', lock: 'lock', bulb: 'lightbulb', cal: 'calendar-blank', up: 'trend-up', check: 'check', x: 'x', plus: 'plus', dot: 'dot-outline', moon: 'moon', scale: 'scales', info: 'info', star: 'star', shield: 'shield', route: 'path' };
const TONE = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)', info: 'var(--info)', mute: 'var(--muted)' };
const ZC = { 1: '#6BAED6', 2: '#4CAF8F', 3: '#F2C14E', 4: '#F28C4E', 5: '#D9534F' };
const ZN = { 1: 'Z1 recuperación', 2: 'Z2 aeróbica', 3: 'Z3 tempo', 4: 'Z4 umbral', 5: 'Z5 máximo' };
const WK = ['#4CAF8F', '#F2C14E', '#3B82C4', '#8E6BBF'];

export function mountPanel(root, doc, deps) {
  const d3 = window.d3;
  deps = deps || {};
  const icoStr = (k, size) => (deps.icon ? deps.icon(IC[k] || 'info', size || 18) : '');
  const R = Object.assign({ zones: [[96, 112], [112, 128], [128, 144], [144, 160]], z2: [96, 112], ceiling: 128, cad: [85, 90], hrrcGood: 25, goalSessions: 3, hrLoad: true }, doc.refs || {});
  R.zones = (R.zones || []).map((z) => (Array.isArray(z) ? z : [z.lo, z.hi]));
  const T = doc.texts || {};
  const P = d3.utcParse('%Y-%m-%d');
  const fd = (d) => d.getUTCDate() + ' ' + MES[d.getUTCMonth()];
  const fmt1 = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
  const sg = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);
  const nz = (v) => (v == null || v === '' ? null : +v);
  const show = (v) => (v == null || Number.isNaN(v) ? '—' : v);
  const num = (r, k) => nz(r[k]);

  /* ---------- Datos: el adaptador entre Firestore y los dibujos ---------- */
  const S = (doc.sessions || []).map((r) => ({
    fecha: r.f, d: P(r.f), dia: r.dia, nombre: r.n, semana: +r.w, dur: num(r, 'dur'), dist: num(r, 'km'), int: num(r, 'int'), carga: num(r, 'carga'), trimp: num(r, 'trimp'),
    fc: num(r, 'fc'), fcmax: num(r, 'fcx'), fcmaxp: num(r, 'fcxp'), hrrc: num(r, 'hrr'), cad: num(r, 'cad'), cal: num(r, 'cal'), peso: num(r, 'peso'), clase: r.clase || '', apt: num(r, 'apt'), fat: num(r, 'fat'), forma: num(r, 'forma')
  })).filter((s) => s.d).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const BL = doc.blocks || {};
  const B = (f) => (BL[f] || []).map((b) => ({ o: +b.o, s: +b.s, fc: +b.fc, pct: +b.pct, z: +b.z })).sort((a, b) => a.o - b.o);
  const PL = (doc.plan || []).map((r) => ({ semana: +r.w, fecha: r.f, dia: r.dia, sesion: r.s, tipo: r.t, plan: +r.p || 0, hecho: nz(r.h), estado: r.e }));
  const WKS = (doc.weeks || []).map((r) => ({ w: +r.w, ctl: nz(r.ctl) })).sort((a, b) => a.w - b.w);
  const HI = (doc.hist || []).map((r) => ({ d: P(r.f), w: +r.w, f: nz(r.fc), m: nz(r.m), i: nz(r.i), c: nz(r.c) })).filter((r) => r.d);
  const TR = ((doc.tramos || {}).rows || []).map((r) => ({ o: +r.o, c: +r.c, f: +r.f, s: +r.s }));
  const TRF = (doc.tramos || {}).date || '';
  const cur = +doc.week || (S.length ? S[S.length - 1].semana : 0);
  const ser = (k) => S.map((s) => s[k]);
  const sumW = (k, w) => d3.sum(S.filter((s) => s.semana === w), (s) => s[k] || 0);
  const weekly = (() => {
    const out = {};
    PL.filter((r) => r.tipo === 'principal' && r.estado !== 'pendiente').forEach((r) => { const o = out[r.semana] = out[r.semana] || { semana: r.semana, plan: 0, hecho: 0 }; o.plan += r.plan; o.hecho += (r.hecho || 0); });
    return Object.values(out).sort((a, b) => a.semana - b.semana).map((o) => ({ semana: o.semana, plan: Math.round(o.plan), hecho: Math.round(o.hecho * 10) / 10, pct: o.plan ? Math.round(100 * o.hecho / o.plan) : 0 }));
  })();
  const hWeeks = [...new Set(HI.map((r) => r.w))].sort((a, b) => a - b);
  const hFirst = hWeeks.length ? hWeeks[0] : cur - 3;
  const semFc = (() => {
    const out = {};
    HI.forEach((r) => { const o = out[r.w] = out[r.w] || { semana: r.w, n: 0, min: 0, fcw: 0, intw: 0, carga: 0 }; const dm = r.m || 0; o.n += 1; o.min += dm; o.fcw += dm * (r.f || 0); o.intw += dm * (r.i || 0); o.carga += (r.c || 0); });
    return Object.values(out).map((o) => ({ semana: o.semana, sesiones: o.n, min: Math.round(o.min), fc: o.min ? Math.round(o.fcw / o.min) : null, int: o.min ? Math.round(o.intw / o.min) : null, carga: o.carga }));
  })();
  const gSF = (w) => semFc.find((r) => r.semana === w) || {};
  const lastDate = S.length ? S[S.length - 1].d : P(doc.asOf || '2000-01-01');
  const monday = (d) => { const x = new Date(d.getTime()); const wd = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - wd); return x; };
  const wStart = doc.weekStart && P(doc.weekStart) ? P(doc.weekStart) : monday(lastDate);
  const asOfD = P(doc.asOf || '') || lastDate;
  const partial = doc.partial !== false;
  const cutoff = (() => { const done = PL.filter((r) => r.tipo === 'principal' && r.estado !== 'pendiente' && r.semana === cur).map((r) => r.fecha).sort(); return done.length ? P(done[done.length - 1]) : null; })();
  const E = { state: { sel: S.length ? S[S.length - 1].fecha : '', zone: 0, node: 'fat', day: S.length ? S[S.length - 1].fecha : '' } };

  /* ---------- Utilidades de dibujo ---------- */
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const icon = (k, size) => { const s = document.createElement('span'); s.className = 'ed-i'; s.innerHTML = icoStr(k, size); return s; };
  const mk = (host, h, legend) => {
    const w = Math.max(260, host.clientWidth || 320); host.replaceChildren();
    const wrap = d3.select(host).append('div').style('position', 'relative');
    if (legend) { const lg = wrap.append('div').attr('class', 'ed-leg'); legend.forEach((l) => { const s = lg.append('span'); s.append('i').attr('class', 'ed-sw').style('background', l[1]); s.append('span').text(l[0]); }); }
    const svg = wrap.append('svg').attr('viewBox', '0 0 ' + w + ' ' + h).attr('width', '100%').attr('role', 'img').style('display', 'block').style('overflow', 'visible');
    return { w, h, wrap, svg };
  };
  const tipOn = (c, sel, fn) => {
    if (!c.tip) c.tip = c.wrap.append('div').attr('class', 'ed-tip').style('display', 'none');
    const t = c.tip;
    sel.on('pointermove', (ev, d) => { const r = c.wrap.node().getBoundingClientRect(); t.style('display', 'block').text(fn(d)); const w = t.node().offsetWidth; t.style('left', Math.max(0, Math.min(ev.clientX - r.left + 12, r.width - w)) + 'px').style('top', Math.max(0, ev.clientY - r.top - 34) + 'px'); }).on('pointerleave', () => t.style('display', 'none'));
  };
  const txt = (sel, x, y, s, anchor, color, w, size) => sel.append('text').attr('x', x).attr('y', y).attr('text-anchor', anchor || 'middle').style('font-size', (size || 11) + 'px').style('font-weight', w || 400).style('fill', color || 'var(--muted)').text(s);
  const grid = (c, y, m, t) => { c.svg.append('g').selectAll('line').data(y.ticks(t || 5)).join('line').attr('x1', m.l).attr('x2', c.w - m.r).attr('y1', (d) => y(d)).attr('y2', (d) => y(d)).style('stroke', 'var(--line)'); };
  const yax = (c, y, m, t) => { const g = c.svg.append('g').attr('transform', 'translate(' + m.l + ',0)').call(d3.axisLeft(y).ticks(t || 5).tickSize(0).tickPadding(6)); g.select('.domain').remove(); g.selectAll('text').style('fill', 'var(--muted)').style('font-size', '11px'); };
  const xax = (c, x, m, f, vals) => { const g = c.svg.append('g').attr('transform', 'translate(0,' + (c.h - m.b) + ')'); const ax = d3.axisBottom(x).tickSize(0).tickPadding(8); if (vals) ax.tickValues(vals); if (f) ax.tickFormat(f); g.call(ax); g.select('.domain').remove(); g.selectAll('text').style('fill', 'var(--muted)').style('font-size', '11px'); };
  const pearson = (a, b) => { const n = a.length; const ma = d3.mean(a), mb = d3.mean(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) * (a[i] - ma); sb += (b[i] - mb) * (b[i] - mb); } return s / Math.sqrt(sa * sb); };
  const zoneBand = (i) => R.zones[Math.min(i, R.zones.length - 1)];
  const missing = (...a) => !S.length || a.some((x) => !x);

  /* ---------- Esqueleto de la página ---------- */
  const title = 'Semana ' + cur;
  const rangeTxt = S.length ? fd(S[0].d) + ' al ' + fd(S[S.length - 1].d) : '';
  const hasTr = TR.length > 0;
  const missions = Array.isArray(T.missions) ? T.missions.slice(0, 6) : [];
  const gaps = Array.isArray(T.gaps) ? T.gaps.slice(0, 8) : [];
  const safeUrl = (u) => (typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u) ? u : '');
  const aviso = (partial ? '<b>Semana ' + cur + ' parcial.</b> Los datos llegan hasta el ' + DIAL[asOfD.getUTCDay()] + ' ' + fd(asOfD) + '. ' : '') + (R.hrLoad ? 'Sin potencia no existe TSS: la «Carga» de intervals.icu es su equivalente calculado con el pulso.' : '');
  const sec = (id, ic, tone, label, how) => '<h2 id="ed_' + id + '"><span class="ed-ico" style="--tone:' + TONE[tone] + '">' + icoStr(ic, 18) + '</span>' + label + '</h2>' + (how ? '<p class="how">' + how + '</p>' : '');
  let h = '<div class="ed"><header class="ed-hero"><div class="ed-hero-t"><span class="ed-ico" style="--tone:' + TONE.good + '">' + icoStr('bolt', 18) + '</span><h1>' + esc(title) + '</h1></div><p class="ed-hero-s">Tu semana en datos: lo que va bien, lo que se puede ajustar y el siguiente paso.</p><p class="ed-hero-l" data-draw="hero">—</p>' + (aviso ? '<div class="ed-note">' + aviso + '</div>' : '') + (T.note ? '<div class="ed-coach"><b>Nota de tu entrenador</b><p>' + esc(T.note) + '</p></div>' : '') + '</header>';
  h += sec('estado', 'pulse', 'info', 'Tablero de estado', 'Toca cualquier tarjeta para darle la vuelta: te explica qué es, cómo va y una pista. La línea pequeña muestra las ' + S.length + ' salidas del ' + esc(rangeTxt) + '.') + '<div class="ed-grid" data-draw="estado">—</div><h3>Termómetro de forma</h3><p class="how">Forma = fitness − fatiga. Cada punto es una salida.</p><div class="ed-chart" data-draw="forma">—</div>';
  h += sec('ses', 'clock', 'good', 'Sesión por sesión', 'Elige una salida: las tarjetas, la línea de bloques y el gráfico de zonas se actualizan juntos.') + '<div class="ed-pills" data-draw="pills"></div><div data-draw="panel"></div><h3>Línea de bloques por zona</h3><p class="how">Cada tramo es un bloque de intervals.icu: su ancho es el tiempo y su altura el pulso medio. La línea punteada roja es el techo del plan (fin de Z3).</p><div class="ed-chart" data-draw="bloquesChart">—</div><h3>Tiempo en cada zona</h3><p class="how">Toca una zona de la leyenda para resaltarla en todas las salidas. La salida elegida arriba lleva borde.</p><div class="ed-chart" data-draw="zonasChart">—</div>';
  h += sec('disp', 'wheel', 'warn', 'Mapa de puntos: pulso frente a cadencia', 'Cada burbuja grande es una salida (su tamaño es la carga).' + (hasTr ? ' Los puntos pequeños son los tramos de la salida del ' + esc(TRF ? fd(P(TRF)) : '') + '.' : '') + ' El rectángulo dorado es el objetivo: cadencia de ' + R.cad[0] + ' a ' + R.cad[1] + ' rpm con el pulso dentro de Z2 (' + R.z2[0] + ' a ' + R.z2[1] + ' lpm).') + '<div class="ed-chart" data-draw="dispersion">—</div>' + (hasTr ? '<p class="how" data-draw="dispNota">—</p>' : '');
  h += sec('cal', 'cal', 'info', 'Calendario: programado frente a realizado', 'Dos semanas. Verde: hecho; ámbar: parcial; rojo: omitido; azul: extra; gris punteado: pendiente. Toca un día para ver el detalle.') + '<div class="ed-week">' + ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((d) => '<div class="ed-wd">' + d + '</div>').join('') + '</div><div class="ed-week" data-draw="calendario"></div><div class="ed-card" data-draw="calDetalle" style="margin-top:10px">—</div><h3>Minutos principales: lo programado y lo hecho</h3><p class="how">Barra gris: programado; color: realizado (verde desde 85%, ámbar desde 70%, rojo menos).' + (partial && cutoff ? ' Semana ' + cur + '* cuenta solo lo vencido hasta el ' + DIAL[cutoff.getUTCDay()] + ' ' + cutoff.getUTCDate() + '.' : '') + '</p><div class="ed-chart" data-draw="barras">—</div>';
  h += sec('tend', 'up', 'good', 'Tendencia: fitness, fatiga y forma', 'Cómo se movieron los tres indicadores tras cada salida. Pasa el cursor por los puntos.') + '<div class="ed-chart" data-draw="tendencia">—</div>' + (HI.length ? '<h3>El mes en pulsos</h3><p class="how">Cada punto es una salida desde la semana ' + hFirst + ' (pulso medio). Las franjas son las zonas del perfil; sobre la roja está el techo del plan.</p><div class="ed-chart" data-draw="historial">—</div>' : '');
  h += sec('mapa', 'target', 'warn', 'Mapa conceptual: cómo se conectan los datos', 'Toca un recuadro: se iluminan sus conexiones y abajo aparece qué mide, qué dicen los datos y qué hacer. «Suma» empuja el valor hacia arriba; «resta» lo baja.') + '<div class="ed-chart" data-draw="mapa">—</div><div class="ed-card" data-draw="mapaDetalle">—</div>';
  h += sec('logros', 'trophy', 'good', 'Logros de la semana', 'Lo que ya se está haciendo bien. Los apagados todavía no se cumplen.') + '<div class="ed-badges" data-draw="logros"></div>';
  if (missions.length) {
    h += sec('miss', 'star', 'info', 'Misiones para los próximos días', 'Sugerencias para decidir con tu entrenador. Marca las que te comprometes a intentar.') + '<div class="ed-miss">' + missions.map((m, i) => {
      const u = safeUrl(m.url);
      return '<div class="ed-m"><span class="ed-ico" style="--tone:' + (TONE[m.tone] || TONE.info) + '">' + icoStr(IC[m.ic] ? m.ic : 'star', 18) + '</span><div><b>' + esc(m.t) + '</b><p>' + esc(m.d) + (u ? ' <a href="' + esc(u) + '" target="_blank" rel="noopener">Abrir enlace</a>' : '') + '</p><button type="button" aria-pressed="false" data-mis="' + i + '" data-t0="' + esc(m.cta || 'Lo intento') + '">' + esc(m.cta || 'Lo intento') + '</button></div></div>';
    }).join('') + '</div>';
  }
  if (gaps.length) {
    h += sec('falta', 'lock', 'mute', 'Lo que aún no vemos', 'Datos que existen o podrían existir pero no llegaron a este informe.') + '<div class="ed-cols">' + gaps.map((g) => '<div class="ed-lock"><span class="ed-ico" style="--tone:' + TONE.mute + '">' + icoStr(IC[g.ic] ? g.ic : 'info', 18) + '</span><div><b>' + esc(g.t) + '</b><p>' + esc(g.d) + '</p></div></div>').join('') + '</div>';
  }
  h += '<details><summary>Criterios y supuestos</summary><p class="how">Se usó tu perfil: zonas de pulso ' + R.zones.map((z) => z[0] + ' a ' + z[1]).join(' / ') + ' lpm, techo de Z3 en ' + R.ceiling + ' lpm y cadencia ' + R.cad[0] + ' a ' + R.cad[1] + ' rpm' + (R.fcmax ? '; FC máxima de referencia ' + R.fcmax + ' lpm' : '') + '. Las zonas de intervals.icu usan otra referencia, por eso sus porcentajes no coinciden con las del perfil. Fitness, fatiga y forma por salida vienen de intervals.icu; la forma entre −10 y +5 se llama zona gris en esa plataforma. ' + (R.hrLoad ? 'La «Carga» se calcula con el pulso, no con potencia. ' : '') + 'Los datos son una lectura del ' + fd(asOfD) + ' de ' + asOfD.getUTCFullYear() + ' y no se actualizan solos.</p></details></div>';
  root.innerHTML = h;

  /* ---------- Dibujos ---------- */
  const draws = {};
  const draw = (n) => root.querySelectorAll('[data-draw="' + n + '"]').forEach((e) => { try { draws[n](e); } catch (err) { e.textContent = '—'; console.warn('panel ' + n, err && err.message); } });
  const spark = (vals, tone) => {
    const ns = 'http://www.w3.org/2000/svg'; const v = vals.filter((x) => x != null); const w = 100, hh = 26;
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hh); svg.setAttribute('width', '100%'); svg.setAttribute('height', hh); svg.setAttribute('aria-hidden', 'true');
    if (v.length < 2) return svg;
    const x = d3.scaleLinear([0, v.length - 1], [4, w - 4]); let lo = d3.min(v), hi = d3.max(v); if (lo === hi) { lo -= 1; hi += 1; }
    const y = d3.scaleLinear([lo, hi], [hh - 4, 4]); const pts = v.map((a, i) => [x(i), y(a)]);
    const pl = document.createElementNS(ns, 'polyline'); pl.setAttribute('points', pts.map((p) => p.join(',')).join(' ')); pl.setAttribute('fill', 'none'); pl.style.stroke = TONE[tone]; pl.setAttribute('stroke-width', '2'); svg.appendChild(pl);
    pts.forEach((p, i) => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', i === pts.length - 1 ? 3.5 : 2); c.style.fill = TONE[tone]; svg.appendChild(c); });
    return svg;
  };
  const card = (o) => {
    const b = el('button', 'ed-c'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.style.setProperty('--tone', TONE[o.tone]);
    const f = el('div', 'ed-cf'); const top = el('div', 'ed-ct'); const ib = el('span', 'ed-ib'); ib.append(icon(o.icon, 16)); top.append(ib, el('span', 'ed-cl', o.label));
    const v = el('div', 'ed-cv'); v.append(el('span', 'n', o.val), el('span', 'u', o.unit || ''));
    f.append(top, v, el('div', 'ed-cd', o.delta)); if (o.spark) f.append(spark(o.spark, o.tone)); f.append(el('div', 'ed-hint', 'toca para entender'));
    const k = el('div', 'ed-cb'); [['Qué es', o.que], ['Cómo va', o.como], ['Pista', o.hacer]].forEach((p) => { k.append(el('b', null, p[0]), el('span', null, p[1])); });
    b.append(f, k); b.addEventListener('click', () => { const on = b.classList.toggle('flip'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    return b;
  };
  const formaZona = (v) => (v < -30 ? 'Riesgo' : v < -10 ? 'Óptima' : v < 5 ? 'Zona gris' : v < 20 ? 'Fresca' : 'Transición');
  const formaTone = (v) => (v < -30 ? 'bad' : v < -10 ? 'good' : v < 5 ? 'info' : v < 20 ? 'info' : 'warn');
  const formaMsg = { 'Riesgo': 'carga muy alta: conviene descansar.', 'Óptima': 'zona donde se construye base sin acumular de más.', 'Zona gris': 'ni fresco para competir ni cargado para progresar.', 'Fresca': 'descansado, listo para una sesión de calidad.', 'Transición': 'muy descansado: ojo con perder base.' };
  const formaHacer = { 'Riesgo': 'Baja el volumen y duerme bien antes de volver a apretar.', 'Óptima': 'Sigue así: mantén la regularidad.', 'Zona gris': 'Más volumen suave la lleva a una forma levemente negativa, donde se construye base.', 'Fresca': 'Buen momento para una sesión de calidad o una salida más larga.', 'Transición': 'Retoma volumen suave poco a poco.' };

  draws.ico = () => {};
  draws.hero = (e) => {
    if (T.headline) { e.textContent = T.headline; return; }
    if (S.length < 2) { e.textContent = '—'; return; }
    const hr = ser('hrrc').filter((v) => v != null); const L = S[S.length - 1];
    e.textContent = S.length + ' salidas en 7 días' + (hr.length ? ', recuperación de pulso de ' + d3.min(hr) + ' a ' + d3.max(hr) + ' lpm en el primer minuto' : '') + ' y un fitness de ' + L.apt + '. Sigue sumando minutos suaves y constancia.';
  };
  draws.estado = (e) => {
    e.replaceChildren(); if (S.length < 2) { e.textContent = '—'; return; }
    const L = S[S.length - 1], F0 = S[0]; const base = WKS.length ? WKS[0] : null; const f0 = gSF(hFirst), fp = gSF(cur - 1), fc = gSF(cur);
    const hr = ser('hrrc').filter((v) => v != null); const cads = ser('cad').filter((v) => v != null);
    const apRange = d3.max(ser('apt')) - d3.min(ser('apt'));
    const cards = [];
    cards.push({ icon: 'shield', label: 'Fitness (aptitud)', val: L.apt, unit: 'CTL', delta: (base ? 'Semana ' + base.w + ': ' + base.ctl + ' · ' : '') + (apRange <= 1 ? 'estable en la semana' : sg(L.apt - F0.apt) + ' desde el ' + fd(F0.d)), tone: base && base.ctl != null ? (L.apt > base.ctl ? 'good' : L.apt === base.ctl ? 'info' : 'warn') : 'info', spark: ser('apt'), que: 'Tu base acumulada: promedio de la carga de las últimas semanas. Sube con volumen constante.', como: base && base.ctl != null ? 'Pasó de ' + base.ctl + ' (semana ' + base.w + ') a ' + L.apt + (apRange <= 1 ? ' y esta semana se mantuvo estable.' : '.') : 'Hoy está en ' + L.apt + '.', hacer: base && base.ctl != null && L.apt < base.ctl ? 'Para subirla hay que sumar minutos suaves cada semana, no intensidad.' : 'Mantén la constancia: los minutos suaves sostienen y elevan la base.' });
    cards.push({ icon: 'flame', label: 'Fatiga', val: L.fat, unit: 'ATL', delta: sg(L.fat - F0.fat) + ' desde el ' + fd(F0.d), tone: L.fat > L.apt * 1.3 ? 'warn' : 'info', spark: ser('fat'), que: 'Carga reciente (aprox. la última semana). Sube rápido al entrenar y baja rápido al descansar.', como: 'Pasó de ' + F0.fat + ' a ' + L.fat + (L.fat > L.apt ? ', por encima del fitness: la carga reciente supera a la base.' : ', a la par o por debajo del fitness.'), hacer: 'Un día liviano o un rodaje corto en Z1 a Z2 la baja sin perder base.' });
    const zf = formaZona(L.forma);
    cards.push({ icon: 'battery', label: 'Forma', val: L.forma, unit: 'TSB', delta: 'Era ' + F0.forma + ' el ' + fd(F0.d), tone: formaTone(L.forma), spark: ser('forma'), que: 'Fitness menos fatiga. Positiva: descansado. Negativa: cargado.', como: 'Con ' + L.forma + ' estás en «' + zf + '»: ' + formaMsg[zf], hacer: formaHacer[zf] });
    cards.push({ icon: 'bolt', label: 'Carga (≈ TSS por pulso)', val: sumW('carga', cur), unit: 'pts sem. ' + cur, delta: 'Sem. ' + (cur - 1) + ': ' + sumW('carga', cur - 1) + ' · cada salida pesa ' + d3.min(ser('carga')) + ' a ' + d3.max(ser('carga')), tone: 'info', spark: ser('carga'), que: 'Es la carga de intervals.icu calculada con el pulso, no TSS de potencia: una hora justo en tu umbral vale cerca de 100.', como: S.length + ' salidas con ' + d3.min(ser('carga')) + ' a ' + d3.max(ser('carga')) + ' puntos cada una.', hacer: 'Sube la suma semanal alargando los rodajes, no apretándolos.' });
    const tmax = S.reduce((a, s) => ((s.trimp || 0) > (a.trimp || 0) ? s : a), S[0]);
    cards.push({ icon: 'pulse', label: 'TRIMP', val: sumW('trimp', cur), unit: 'sem. ' + cur, delta: 'Sem. ' + (cur - 1) + ': ' + sumW('trimp', cur - 1), tone: 'info', spark: ser('trimp'), que: 'Impulso de entrenamiento de Banister: pesa el tiempo según qué tan alto fue el pulso. Es un segundo medidor para contrastar la carga.', como: 'La salida de mayor TRIMP fue la del ' + fd(tmax.d) + ' (' + tmax.trimp + ').', hacer: 'Úsalo junto con la carga: si ambos suben, el estímulo real sube.' });
    if (f0.int != null && fc.int != null) { const di = fc.int - f0.int; cards.push({ icon: 'target', label: 'Intensidad media', val: fc.int, unit: '% sem. ' + cur, delta: 'Sem. ' + hFirst + ': ' + f0.int + '% (' + sg(di) + ' pts)', tone: di >= 5 ? 'warn' : di <= -5 ? 'good' : 'info', que: 'Porcentaje del pulso de referencia (umbral) promedio de la semana, ponderado por duración.', como: 'Pasó de ' + f0.int + '% en la semana ' + hFirst + ' a ' + fc.int + '% en la ' + cur + '.', hacer: di > 0 ? 'Vuelve a la sensación de la semana ' + hFirst + ': más tiempo, menos pulso.' : 'Mantén esa sensación: tiempo suave y repetible.' }); }
    if (fc.fc != null) { const top = R.z2[1]; cards.push({ icon: 'heart', label: 'FC media ponderada', val: fc.fc, unit: 'lpm sem. ' + cur, delta: f0.fc != null ? 'Sem. ' + hFirst + ': ' + f0.fc + ' (' + sg(fc.fc - f0.fc) + ' lpm)' : '', tone: fc.fc <= top ? 'good' : fc.fc <= top + 8 ? 'warn' : 'bad', spark: ser('fc'), que: 'Pulso promedio de la semana. La Zona 2 del perfil es de ' + R.z2[0] + ' a ' + R.z2[1] + ' lpm.', como: 'Las salidas rondan ' + d3.min(ser('fc')) + ' a ' + d3.max(ser('fc')) + ' lpm' + (fc.fc > top ? ': sobre el techo de Z2.' : ': dentro de Z2.'), hacer: fc.fc > top ? 'Baja la resistencia 1 o 2 marchas y deja que el pulso se acomode.' : 'Buen control: mantén el pulso dentro de la zona.' }); }
    if (hr.length) cards.push({ icon: 'heart', label: 'Recuperación de FC', val: Math.round(d3.mean(hr)), unit: 'lpm en 1 min', delta: 'Mediciones: ' + hr.join(' y '), tone: d3.mean(hr) >= R.hrrcGood ? 'good' : 'warn', que: 'Cuánto cae el pulso el primer minuto tras parar. Más alto, mejor recuperación.', como: d3.mean(hr) >= R.hrrcGood ? 'El corazón responde y baja rápido. Es una buena señal.' : 'La caída es moderada; conviene mirarla junto con el descanso.', hacer: 'Si cae de forma sostenida, es señal de fatiga: descansa un día.' });
    if (cads.length) { const cm = Math.round(d3.mean(cads)); cards.push({ icon: 'wheel', label: 'Cadencia media', val: cm, unit: 'rpm', delta: 'Meta ' + R.cad[0] + ' a ' + R.cad[1] + ' rpm', tone: cm >= R.cad[0] ? 'good' : cm >= R.cad[0] - 10 ? 'warn' : 'bad', spark: ser('cad'), que: 'Pedaladas por minuto. Una cadencia más alta reparte el esfuerzo y cuida las articulaciones.', como: 'Las salidas quedaron entre ' + d3.min(cads) + ' y ' + d3.max(cads) + ' rpm' + (cm >= R.cad[0] ? '.' : ', bajo la meta.'), hacer: 'Practica bloques cortos a ' + R.cad[0] + ' a ' + R.cad[1] + ' con la marcha más liviana.' }); }
    const cals = ser('cal').filter((v) => v != null);
    if (cals.length) cards.push({ icon: 'flame', label: 'Calorías', val: d3.sum(cals), unit: 'kcal en ' + S.length + ' salidas', delta: 'Entre ' + d3.min(cals) + ' y ' + d3.max(cals) + ' por salida', tone: 'info', spark: ser('cal'), que: 'Gasto estimado por el reloj a partir del pulso y tu peso.', como: 'La salida de mayor gasto fue la del ' + fd(S.reduce((a, s) => ((s.cal || 0) > (a.cal || 0) ? s : a), S[0]).d) + '.', hacer: 'En salidas de más de 60 min, lleva algo para comer.' });
    if (fc.min != null) cards.push({ icon: 'clock', label: 'Tiempo pedaleado', val: fc.min, unit: 'min sem. ' + cur + (partial ? ' (parcial)' : ''), delta: (fp.min != null ? 'Sem. ' + (cur - 1) + ': ' + fp.min + ' min' : '') + (f0.min != null ? ' · sem. ' + hFirst + ': ' + f0.min + ' min' : ''), tone: 'info', que: 'Minutos totales con la bici en la semana.', como: f0.min != null ? 'Frente a la semana ' + hFirst + ': ' + sg(fc.min - f0.min) + ' min.' : 'Total de la semana hasta hoy.', hacer: 'El volumen es la palanca principal del fitness: suma 5 a 10 min por salida de forma gradual.' });
    const pesos = ser('peso').filter((v) => v != null);
    if (pesos.length) cards.push({ icon: 'scale', label: 'Peso', val: L.peso != null ? L.peso : pesos[pesos.length - 1], unit: 'kg', delta: d3.min(pesos) === d3.max(pesos) ? 'Estable en las ' + S.length + ' salidas' : 'Entre ' + d3.min(pesos) + ' y ' + d3.max(pesos) + ' kg', tone: 'info', que: 'Peso registrado en tu reloj al momento de cada salida.', como: 'Sirve de referencia para las calorías y para cuando haya potencia.', hacer: 'Mídete siempre en condiciones parecidas para que el dato sea comparable.' });
    cards.forEach((o) => e.append(card(o)));
  };
  draws.forma = (e) => {
    if (!S.length) { e.textContent = '—'; return; }
    const c = mk(e, 150); const m = { l: 12, r: 12, t: 34, b: 20 }; const x = d3.scaleLinear([-35, 30], [m.l, c.w - m.r]);
    [[-35, -30, '#D9534F', 'Riesgo'], [-30, -10, '#4CAF8F', 'Óptima'], [-10, 5, '#9AA0A6', 'Zona gris'], [5, 20, '#6BAED6', 'Fresca'], [20, 30, '#F2C14E', 'Transición']].forEach((z) => { c.svg.append('rect').attr('x', x(z[0])).attr('width', x(z[1]) - x(z[0])).attr('y', m.t).attr('height', 26).attr('fill', z[2]).attr('opacity', 0.85); if (x(z[1]) - x(z[0]) > 46) txt(c.svg, (x(z[0]) + x(z[1])) / 2, m.t + 44, z[3], 'middle'); });
    [-30, -10, 5, 20].forEach((t) => txt(c.svg, x(t), m.t - 6, t, 'middle'));
    const pts = S.map((s) => ({ x: x(Math.max(-35, Math.min(30, s.forma))), y: m.t + 13, s }));
    c.svg.append('path').attr('d', d3.line()(pts.map((p) => [p.x, p.y]))).style('fill', 'none').style('stroke', 'var(--text)').style('stroke-width', 1.5).style('stroke-dasharray', '3 3');
    const dots = c.svg.append('g').selectAll('circle').data(pts).join('circle').attr('cx', (p) => p.x).attr('cy', (p) => p.y).attr('r', (p, i) => (i === pts.length - 1 ? 8 : 5)).style('fill', 'var(--surface)').style('stroke', 'var(--text)').style('stroke-width', 2.5);
    tipOn(c, dots, (p) => fd(p.s.d) + ' · forma ' + p.s.forma + ' (fitness ' + p.s.apt + ', fatiga ' + p.s.fat + ')');
    c.svg.attr('aria-label', 'Termómetro de forma con las ' + S.length + ' salidas del ' + rangeTxt);
  };
  draws.pills = (e) => { e.replaceChildren(); S.forEach((s) => { const b = el('button', 'ed-pill', s.dia + ' ' + fd(s.d) + (s.clase ? ' · ' + s.clase : '')); b.type = 'button'; b.setAttribute('aria-pressed', s.fecha === E.state.sel ? 'true' : 'false'); b.onclick = () => { E.state.sel = s.fecha; ['pills', 'panel', 'bloquesChart', 'zonasChart'].forEach(draw); }; e.append(b); }); };
  const tile = (ic, label, val, unit) => { const t = el('div', 'ed-tile'); const l = el('div', 'l'); l.append(icon(ic, 13), document.createTextNode(label)); const v = el('div', 'v', val == null ? '—' : val); if (unit && val != null) v.append(el('span', 'u', unit)); t.append(l, v); return t; };
  draws.panel = (e) => {
    e.replaceChildren(); if (!S.length) { e.textContent = '—'; return; }
    const s = S.find((r) => r.fecha === E.state.sel) || S[S.length - 1]; const Bk = B(s.fecha); const tot = d3.sum(Bk, (b) => b.s) || 0;
    const head = el('div', 'ed-row'); head.append(el('b', null, s.nombre || ''));
    if (s.clase) { const bd = el('span', 'ed-badge', 'Clase ' + s.clase); bd.style.setProperty('--tone', TONE.info); head.append(bd); }
    e.append(head);
    if (tot) { const low = Math.round(100 * d3.sum(Bk.filter((b) => b.z <= 2), (b) => b.s) / tot); e.append(el('p', 'how', low + '% del tiempo en zonas 1 y 2 de intervals y ' + (100 - low) + '% en zona 3 o más.' + (s.fcmax != null ? ' Pico de ' + s.fcmax + ' lpm' + (s.fcmaxp != null ? ' (' + s.fcmaxp + '% de tu FC máxima de referencia)' : '') + '.' : ''))); }
    const g = el('div', 'ed-tiles'); g.append(tile('clock', 'Duración', s.dur != null ? Math.round(s.dur) : null, 'min'), tile('route', 'Distancia', s.dist, 'km'), tile('bolt', 'Carga', s.carga, 'pts'), tile('pulse', 'TRIMP', s.trimp), tile('heart', 'FC media', s.fc, 'lpm'), tile('heart', 'FC máx.', s.fcmax, 'lpm'), tile('heart', 'Recuperación', s.hrrc, 'lpm'), tile('wheel', 'Cadencia', s.cad, 'rpm'), tile('flame', 'Calorías', s.cal, 'kcal'), tile('target', 'Intensidad', s.int, '%'), tile('shield', 'Fitness', s.apt), tile('flame', 'Fatiga', s.fat), tile('battery', 'Forma', s.forma));
    e.append(g);
  };
  draws.calendario = (e) => {
    e.replaceChildren(); if (!PL.length) return;
    const st = { hecha: ['good', 'check', 'Hecha'], parcial: ['warn', 'check', 'Parcial'], omitida: ['bad', 'x', 'Omitida'], excedida: ['good', 'plus', 'Superada'], sin_plan: ['info', 'plus', 'Extra'], pendiente: ['mute', 'dot', 'Pendiente'] };
    const start = wStart.getTime() - 7 * 86400000;
    for (let i = 0; i < 14; i++) {
      const d = new Date(start + i * 86400000); const f = d.toISOString().slice(0, 10); const items = PL.filter((r) => r.fecha === f);
      const b = el('button', 'ed-day'); b.type = 'button'; b.setAttribute('aria-pressed', f === E.state.day ? 'true' : 'false'); b.append(el('div', 'd', d.getUTCDate() + ' ' + MES[d.getUTCMonth()]));
      if (!items.length) { b.classList.add('free'); b.append(el('div', 'm', 'libre')); }
      else {
        const it = items.find((r) => r.tipo === 'principal') || items[0]; const s = st[it.estado] || st.pendiente; b.style.setProperty('--tone', TONE[s[0]]); if (it.estado === 'pendiente') b.classList.add('pend');
        const ic = el('div', 'ed-dayic'); ic.style.color = TONE[s[0]]; ic.append(icon(s[1], 18));
        b.append(ic, el('div', 'm', it.plan === 0 ? Math.round(it.hecho || 0) + ' min extra' : (it.hecho == null ? '—' : Math.round(it.hecho)) + '/' + Math.round(it.plan) + ' min')); if (items.length > 1) b.append(el('div', 'd', '+' + (items.length - 1) + ' más'));
      }
      b.onclick = () => { E.state.day = f; draw('calendario'); draw('calDetalle'); }; e.append(b);
    }
  };
  draws.calDetalle = (e) => {
    e.replaceChildren(); const f = E.state.day; if (!f) { e.textContent = '—'; return; }
    const items = PL.filter((r) => r.fecha === f); const Sd = S.filter((s) => s.fecha === f); e.append(el('b', null, 'Detalle del ' + fd(P(f))));
    if (!items.length && !Sd.length) { e.append(el('p', 'how', 'Día libre: sin sesión programada ni salida registrada.')); return; }
    const tn = { hecha: 'good', parcial: 'warn', omitida: 'bad', excedida: 'good', sin_plan: 'info', pendiente: 'mute' };
    items.forEach((r) => { const row = el('p', 'ed-row'); const bd = el('span', 'ed-badge', r.estado); bd.style.setProperty('--tone', TONE[tn[r.estado] || 'mute']); row.append(bd, document.createTextNode(r.sesion + ' · programado ' + r.plan + ' min · hecho ' + (r.hecho == null ? '—' : Math.round(r.hecho)) + ' min')); e.append(row); });
    Sd.forEach((s) => e.append(el('p', 'how', 'Registro: FC media ' + show(s.fc) + ' lpm, máxima ' + show(s.fcmax) + ' lpm, cadencia ' + show(s.cad) + ' rpm, carga ' + show(s.carga) + '.')));
  };
  draws.logros = (e) => {
    e.replaceChildren(); if (!S.length) return;
    const L = S[S.length - 1]; const hr = ser('hrrc').filter((v) => v != null); const goal = R.goalSessions;
    const longest = S.reduce((a, s) => ((s.dur || 0) > (a.dur || 0) ? s : a), S[0]); const Bl = B(longest.fecha); const base = Bl.length > 0 && Bl.every((b) => b.z <= 2);
    const t85 = hasTr ? TR.filter((r) => r.c >= R.cad[0]).length : S.filter((s) => s.cad != null && s.cad >= R.cad[0]).length;
    const lastPlan = PL.find((r) => r.fecha === L.fecha && r.tipo === 'complementaria');
    const L2 = [
      { ic: 'heart', t: 'Corazón que recupera', d: hr.length ? hr.join(' y ') + ' lpm de caída en el primer minuto.' : 'Aún sin mediciones de recuperación.', ok: hr.length > 0 && d3.mean(hr) >= R.hrrcGood, tone: 'good' },
      { ic: 'cal', t: S.length + ' salidas en 7 días', d: S.length + ' salidas entre el ' + fd(S[0].d) + ' y el ' + fd(L.d) + '.', ok: S.length >= goal, tone: 'good' },
      { ic: 'shield', t: 'Fitness estable', d: 'Hoy está en ' + L.apt + ' (empezó la semana en ' + S[0].apt + ').', ok: L.apt >= S[0].apt, tone: 'info' },
      { ic: 'check', t: 'Rodaje de manual', d: 'El ' + fd(longest.d) + ', la salida más larga, todos los bloques quedaron en zonas 1 y 2.', ok: base, tone: 'good' },
      { ic: 'wheel', t: 'Cadencia alcanzada', d: hasTr ? t85 + ' tramos del ' + fd(P(TRF)) + ' llegaron a ' + R.cad[0] + ' rpm o más.' : t85 + ' salidas con cadencia media de ' + R.cad[0] + ' rpm o más.', ok: t85 > 0, tone: 'warn' }
    ];
    if (lastPlan) L2.push({ ic: 'plus', t: 'Soltura de más', d: 'El ' + fd(L.d) + ' se pedaleó ' + Math.round(L.dur || 0) + ' min frente a ' + lastPlan.plan + ' programados.', ok: (L.dur || 0) > lastPlan.plan, tone: 'info' });
    L2.forEach((o) => { const b = el('div', 'ed-bd' + (o.ok ? '' : ' off')); b.style.setProperty('--tone', TONE[o.tone]); const r = el('div', 'r'); r.append(icon(o.ic, 22)); const tx = el('div', null); tx.append(el('b', null, o.t), el('span', null, o.d)); b.append(r, tx); e.append(b); });
  };
  draws.barras = (e) => {
    if (!weekly.length) { e.textContent = '—'; return; }
    const rows = weekly; const c = mk(e, 250, [['Programado', 'var(--track)'], ['Realizado desde 85%', '#2E9E6B'], ['Realizado 70 a 84%', '#E0A21B'], ['Realizado bajo 70%', '#D9534F']]);
    const m = { t: 20, r: 8, b: 46, l: 36 }; const x = d3.scaleBand().domain(rows.map((r) => r.semana)).range([m.l, c.w - m.r]).padding(0.25); const x1 = d3.scaleBand().domain(['plan', 'hecho']).range([0, x.bandwidth()]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(rows, (r) => Math.max(r.plan, r.hecho)) * 1.12 || 1]).nice().range([c.h - m.b, m.t]); grid(c, y, m); yax(c, y, m);
    const tone = (p) => (p >= 85 ? '#2E9E6B' : p >= 70 ? '#E0A21B' : '#D9534F');
    const g = c.svg.append('g').selectAll('g').data(rows).join('g').attr('transform', (r) => 'translate(' + x(r.semana) + ',0)');
    ['plan', 'hecho'].forEach((k) => {
      const bars = g.append('rect').attr('x', x1(k)).attr('width', x1.bandwidth()).attr('y', (r) => y(r[k])).attr('height', (r) => Math.max(0, y(0) - y(r[k]))).attr('rx', 4).style('fill', (r) => (k === 'plan' ? 'var(--track)' : tone(r.pct)));
      tipOn(c, bars, (r) => 'Sem ' + r.semana + ' · ' + (k === 'plan' ? 'programado ' : 'realizado ') + r[k] + ' min');
      g.append('text').attr('x', x1(k) + x1.bandwidth() / 2).attr('y', (r) => y(r[k]) - 4).attr('text-anchor', 'middle').style('font-size', '11px').style('fill', 'var(--text)').text((r) => Math.round(r[k]));
    });
    g.append('text').attr('x', x.bandwidth() / 2).attr('y', c.h - m.b + 16).attr('text-anchor', 'middle').style('font-size', '11px').style('fill', 'var(--muted)').text((r) => 'Sem ' + r.semana + (partial && r.semana === cur ? '*' : ''));
    g.append('text').attr('x', x.bandwidth() / 2).attr('y', c.h - m.b + 34).attr('text-anchor', 'middle').style('font-size', '13px').style('font-weight', 700).style('fill', (r) => tone(r.pct)).text((r) => r.pct + '%');
    c.svg.attr('aria-label', 'Minutos principales programados frente a realizados por semana');
  };
  draws.bloquesChart = (e) => {
    const Bk = B(E.state.sel); if (!Bk.length) { e.textContent = 'Esta salida no trae bloques de intervals.icu.'; return; }
    const c = mk(e, 270, [['Z1', ZC[1]], ['Z2', ZC[2]], ['Z3', ZC[3]], ['Z4', ZC[4]]]); const m = { t: 22, r: 8, b: 36, l: 38 };
    const tot = d3.sum(Bk, (b) => b.s); const x = d3.scaleLinear([0, tot], [m.l, c.w - m.r]);
    const lo = Math.min(R.zones[0][0] - 11, d3.min(Bk, (b) => b.fc) - 8), hi = Math.max(R.zones[R.zones.length - 1][0] + 1, d3.max(Bk, (b) => b.fc) + 8); const y = d3.scaleLinear([lo, hi], [c.h - m.b, m.t]);
    [[zoneBand(0), 0.06], [zoneBand(1), 0.1]].forEach((z) => c.svg.append('rect').attr('x', m.l).attr('width', c.w - m.l - m.r).attr('y', y(z[0][1])).attr('height', y(z[0][0]) - y(z[0][1])).style('fill', 'var(--text)').style('opacity', z[1]));
    c.svg.append('line').attr('x1', m.l).attr('x2', c.w - m.r).attr('y1', y(R.ceiling)).attr('y2', y(R.ceiling)).style('stroke', '#D9534F').style('stroke-dasharray', '5 4').style('stroke-width', 1.5);
    yax(c, y, m, 5); let acc = 0; Bk.forEach((b) => { b.x0 = acc; acc += b.s; b.x1 = acc; });
    c.svg.append('g').selectAll('line').data(Bk.slice(1)).join('line').attr('x1', (b) => x(b.x0)).attr('x2', (b) => x(b.x0)).attr('y1', (b, i) => y(Bk[i].fc)).attr('y2', (b) => y(b.fc)).style('stroke', 'var(--muted)');
    c.svg.append('g').selectAll('rect').data(Bk).join('rect').attr('x', (b) => x(b.x0) + 1).attr('width', (b) => Math.max(2, x(b.x1) - x(b.x0) - 2)).attr('y', (b) => y(b.fc) - 4).attr('height', 8).attr('rx', 4).style('fill', (b) => ZC[b.z] || ZC[2]);
    c.svg.append('g').selectAll('text').data(Bk.filter((b) => x(b.x1) - x(b.x0) > 30)).join('text').attr('x', (b) => (x(b.x0) + x(b.x1)) / 2).attr('y', (b) => y(b.fc) - 10).attr('text-anchor', 'middle').style('font-size', '11px').style('font-weight', 600).style('fill', 'var(--text)').text((b) => b.fc);
    const hov = c.svg.append('g').selectAll('rect').data(Bk).join('rect').attr('x', (b) => x(b.x0)).attr('width', (b) => x(b.x1) - x(b.x0)).attr('y', m.t).attr('height', c.h - m.b - m.t).style('fill', 'transparent');
    tipOn(c, hov, (b) => { const mm = Math.floor(b.s / 60), ss = b.s % 60; return 'Bloque ' + b.o + ' · ' + mm + ':' + (ss < 10 ? '0' : '') + ss + ' · ' + b.fc + ' lpm · ' + b.pct + '% · ' + (ZN[b.z] || ''); });
    xax(c, x, m, (s) => Math.round(s / 60), d3.range(0, tot + 1, tot > 2000 ? 600 : 300)); txt(c.svg, c.w - m.r, c.h - 4, 'minutos', 'end'); txt(c.svg, m.l, m.t - 8, 'lpm', 'start');
    c.svg.attr('aria-label', 'Pulso medio por bloque de la salida del ' + E.state.sel + ', coloreado por zona');
  };
  draws.zonasChart = (e) => {
    if (!S.length) { e.textContent = '—'; return; }
    const c = mk(e, 60 + S.length * 46); const m = { t: 34, r: 10, b: 6, l: 64 }; const x = d3.scaleLinear([0, 100], [m.l, c.w - m.r]); const y = d3.scaleBand().domain(S.map((s) => s.fecha)).range([m.t, c.h - m.b]).padding(0.25); const zs = [1, 2, 3, 4, 5];
    const lg = c.svg.append('g'); let lx = m.l;
    zs.forEach((z) => { const g = lg.append('g').style('cursor', 'pointer').attr('transform', 'translate(' + lx + ',4)').on('click', () => { E.state.zone = E.state.zone === z ? 0 : z; draw('zonasChart'); }); g.append('rect').attr('width', 12).attr('height', 12).attr('rx', 3).style('fill', ZC[z]).style('opacity', !E.state.zone || E.state.zone === z ? 1 : 0.3); g.append('text').attr('x', 17).attr('y', 10).style('font-size', '11px').style('fill', 'var(--muted)').text(ZN[z].split(' ')[0]); lx += 48; });
    const rows = []; S.forEach((s) => { const Bk = B(s.fecha); const tot = d3.sum(Bk, (b) => b.s) || 1; let a = 0; zs.forEach((z) => { const sec = d3.sum(Bk.filter((b) => b.z === z), (b) => b.s); if (sec > 0) { rows.push({ s, z, x0: 100 * a / tot, w: 100 * sec / tot, sec }); a += sec; } }); });
    c.svg.append('g').selectAll('text').data(S).join('text').attr('x', m.l - 8).attr('y', (s) => y(s.fecha) + y.bandwidth() / 2 + 4).attr('text-anchor', 'end').style('font-size', '11px').style('fill', 'var(--muted)').text((s) => fd(s.d));
    const segs = c.svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(r.x0) + 1).attr('width', (r) => Math.max(1, x(r.x0 + r.w) - x(r.x0) - 2)).attr('y', (r) => y(r.s.fecha)).attr('height', y.bandwidth()).attr('rx', 5).style('fill', (r) => ZC[r.z]).style('opacity', (r) => (!E.state.zone || E.state.zone === r.z ? 1 : 0.2)).style('stroke', (r) => (r.s.fecha === E.state.sel ? 'var(--text)' : 'none')).style('stroke-width', 2);
    tipOn(c, segs, (r) => fd(r.s.d) + ' · ' + ZN[r.z] + ' · ' + Math.round(r.sec / 60 * 10) / 10 + ' min (' + Math.round(r.w) + '%)');
    c.svg.append('g').selectAll('text').data(rows.filter((r) => x(r.x0 + r.w) - x(r.x0) > 34)).join('text').attr('x', (r) => x(r.x0 + r.w / 2)).attr('y', (r) => y(r.s.fecha) + y.bandwidth() / 2 + 4).attr('text-anchor', 'middle').style('font-size', '11px').style('font-weight', 700).style('fill', '#1b1b1b').style('pointer-events', 'none').text((r) => Math.round(r.w) + '%');
    c.svg.attr('aria-label', 'Porcentaje del tiempo en cada zona para las ' + S.length + ' salidas');
  };
  draws.dispersion = (e) => {
    const ok = S.filter((s) => s.cad != null && s.fc != null); if (!ok.length) { e.textContent = 'Sin datos de cadencia en esta semana.'; return; }
    const wks = [...new Set(ok.map((s) => s.semana))].sort((a, b) => a - b); const wc = (w) => ['#3B82C4', '#8E6BBF', '#4CAF8F', '#F2C14E'][wks.indexOf(w) % 4];
    const leg = wks.map((w) => ['Salida sem. ' + w, wc(w)]); if (hasTr) leg.push(['Tramo del ' + fd(P(TRF)), 'var(--track)']); leg.push(['Zona dorada', '#F2C14E']);
    const c = mk(e, 330, leg); const m = { t: 14, r: 12, b: 44, l: 42 };
    const cads = ok.map((s) => s.cad).concat(TR.map((t) => t.c)); const fcs = ok.map((s) => s.fc).concat(TR.map((t) => t.f));
    const x = d3.scaleLinear([Math.min(58, d3.min(cads) - 3), Math.max(95, d3.max(cads) + 3)], [m.l, c.w - m.r]); const y = d3.scaleLinear([Math.min(90, d3.min(fcs) - 4), Math.max(145, d3.max(fcs) + 4)], [c.h - m.b, m.t]);
    c.svg.append('rect').attr('x', x(R.cad[0])).attr('width', x(R.cad[1]) - x(R.cad[0])).attr('y', y(R.z2[1])).attr('height', y(R.z2[0]) - y(R.z2[1])).style('fill', '#F2C14E').style('opacity', 0.45).attr('rx', 6);
    txt(c.svg, (x(R.cad[0]) + x(R.cad[1])) / 2, y(R.z2[0]) + 14, 'meta', 'middle', 'var(--text)', 700); grid(c, y, m, 5); yax(c, y, m, 5); xax(c, x, m, null, d3.range(Math.ceil(x.domain()[0] / 5) * 5, x.domain()[1] + 1, 5));
    txt(c.svg, (m.l + c.w - m.r) / 2, c.h - 6, 'cadencia (rpm)', 'middle'); txt(c.svg, m.l, m.t - 2, 'pulso medio (lpm)', 'start');
    c.svg.append('line').attr('x1', m.l).attr('x2', c.w - m.r).attr('y1', y(R.ceiling)).attr('y2', y(R.ceiling)).style('stroke', '#D9534F').style('stroke-dasharray', '5 4');
    const small = c.svg.append('g').selectAll('circle').data(TR).join('circle').attr('cx', (t) => x(t.c)).attr('cy', (t) => y(t.f)).attr('r', 5).style('fill', 'var(--track)').style('stroke', 'var(--surface)').style('stroke-width', 1.5);
    tipOn(c, small, (t) => 'Tramo ' + t.o + ' · ' + t.c + ' rpm · ' + t.f + ' lpm');
    const cs = ok.map((s) => s.carga || 0); const r = d3.scaleSqrt([Math.min(20, d3.min(cs)), Math.max(45, d3.max(cs))], [9, 17]);
    const big = c.svg.append('g').selectAll('circle').data(ok).join('circle').attr('cx', (s) => x(s.cad)).attr('cy', (s) => y(s.fc)).attr('r', (s) => r(s.carga || 0)).style('fill', (s) => wc(s.semana)).style('fill-opacity', 0.8).style('stroke', 'var(--surface)').style('stroke-width', 2);
    tipOn(c, big, (s) => fd(s.d) + ' · ' + s.cad + ' rpm · ' + s.fc + ' lpm · carga ' + s.carga);
    c.svg.append('g').selectAll('text').data(ok).join('text').attr('x', (s) => x(s.cad)).attr('y', (s) => y(s.fc) - r(s.carga || 0) - 4).attr('text-anchor', 'middle').style('font-size', '11px').style('font-weight', 600).style('fill', 'var(--text)').text((s) => fd(s.d));
    c.svg.attr('aria-label', 'Pulso medio frente a cadencia por salida, con la zona objetivo marcada');
  };
  draws.dispNota = (e) => {
    if (TR.length < 3) { e.textContent = ''; return; }
    const r = pearson(TR.map((t) => t.c), TR.map((t) => t.f));
    e.textContent = 'Lectura: en los ' + TR.length + ' tramos del ' + fd(P(TRF)) + ', ' + (r > 0.3 ? 'cuando la cadencia sube también sube el pulso' : r < -0.3 ? 'cuando la cadencia sube el pulso baja' : 'la cadencia y el pulso casi no se relacionan') + ' (correlación r = ' + fmt1(r) + '). ' + (r > 0.3 ? 'Es decir, las cadencias altas se lograron a costa de pulso; el reto es lograrlas con poca fuerza y quedar en la zona dorada.' : 'Sigue practicando cadencias de ' + R.cad[0] + ' a ' + R.cad[1] + ' rpm con poca fuerza.');
  };
  draws.tendencia = (e) => {
    if (!S.length) { e.textContent = '—'; return; }
    const sr = [{ k: 'apt', n: 'Fitness', c: '#3B82C4', d: 'base acumulada' }, { k: 'fat', n: 'Fatiga', c: '#F28C4E', d: 'carga reciente' }, { k: 'forma', n: 'Forma', c: '#4CAF8F', d: 'fitness menos fatiga' }];
    const c = mk(e, 240, sr.map((s) => [s.n, s.c])); const m = { t: 20, r: c.w < 520 ? 66 : 40, b: 30, l: 36 }; const x = d3.scalePoint().domain(S.map((s) => s.fecha)).range([m.l + 14, c.w - m.r]);
    const vals = S.flatMap((s) => [s.apt, s.fat, s.forma]).filter((v) => v != null); const y = d3.scaleLinear([Math.min(0, d3.min(vals) - 2), Math.max(22, d3.max(vals) + 2)], [c.h - m.b, m.t]);
    grid(c, y, m, 4); yax(c, y, m, 4); xax(c, x, m, (f) => fd(P(f)));
    sr.forEach((s) => {
      c.svg.append('path').attr('d', d3.line().x((d) => x(d.fecha)).y((d) => y(d[s.k]))(S)).style('fill', 'none').style('stroke', s.c).style('stroke-width', 3).style('stroke-linecap', 'round');
      const dots = c.svg.append('g').selectAll('circle').data(S).join('circle').attr('cx', (d) => x(d.fecha)).attr('cy', (d) => y(d[s.k])).attr('r', 5).style('fill', s.c).style('stroke', 'var(--surface)').style('stroke-width', 2);
      tipOn(c, dots, (d) => s.n + ' (' + s.d + ') · ' + fd(d.d) + ' · ' + d[s.k]); const l = S[S.length - 1];
      txt(c.svg, x(l.fecha) + 10, y(l[s.k]) + (s.k === 'fat' ? 9 : s.k === 'apt' ? 0 : 4), s.n + ' ' + l[s.k], 'start', s.c, 700);
    });
    c.svg.attr('aria-label', 'Fitness, fatiga y forma tras cada una de las ' + S.length + ' salidas');
  };
  draws.historial = (e) => {
    const rows = HI.filter((r) => r.f != null); if (!rows.length) { e.textContent = '—'; return; }
    const wks = [...new Set(rows.map((r) => r.w))].sort((a, b) => a - b); const col = (w) => WK[wks.indexOf(w) % WK.length];
    const c = mk(e, 260, wks.map((w) => ['Sem. ' + w, col(w)])); const m = { t: 14, r: 30, b: 30, l: 36 };
    const d0 = new Date(d3.min(rows, (r) => r.d).getTime() - 86400000); const d1 = new Date(Math.max(wStart.getTime() + 6 * 86400000, d3.max(rows, (r) => r.d).getTime()) + 86400000);
    const x = d3.scaleUtc([d0, d1], [m.l, c.w - m.r]); const ylo = Math.min(90, d3.min(rows, (r) => r.f) - 4), yhi = Math.max(135, d3.max(rows, (r) => r.f) + 4); const y = d3.scaleLinear([ylo, yhi], [c.h - m.b, m.t]);
    R.zones.slice(0, 3).forEach((z, i) => { const top = Math.min(z[1], yhi); c.svg.append('rect').attr('x', m.l).attr('width', c.w - m.l - m.r).attr('y', y(top)).attr('height', Math.max(0, y(z[0]) - y(top))).style('fill', i === 2 ? '#D9534F' : 'var(--text)').style('opacity', [0.05, 0.1, 0.14][i]); txt(c.svg, c.w - m.r + 4, y((z[0] + top) / 2) + 4, 'Z' + (i + 2), 'start'); });
    yax(c, y, m, 4); xax(c, x, m, fd, x.ticks(d3.utcMonday.every(1)));
    const dots = c.svg.append('g').selectAll('circle').data(rows).join('circle').attr('cx', (r) => x(r.d)).attr('cy', (r) => y(r.f)).attr('r', (r) => 4 + Math.sqrt(r.m || 0) / 2).style('fill', (r) => col(r.w)).style('fill-opacity', 0.85).style('stroke', 'var(--surface)').style('stroke-width', 2);
    tipOn(c, dots, (r) => fd(r.d) + ' · ' + Math.round(r.m || 0) + ' min · FC media ' + r.f + ' lpm');
    c.svg.attr('aria-label', 'FC media de cada salida desde la semana ' + hFirst + ' sobre las zonas del perfil');
  };
  /* Mapa conceptual: los nodos salen de los datos de la semana */
  const nodes = () => {
    const L = S[S.length - 1], F0 = S[0]; const f0 = gSF(hFirst), fp = gSF(cur - 1), fc = gSF(cur);
    const c0 = WKS.length ? WKS[0] : { ctl: '—' }; const cN = WKS.find((r) => r.w === cur) || WKS[WKS.length - 1] || { ctl: '—' };
    const om = PL.filter((r) => r.tipo === 'principal' && r.estado === 'omitida'); const omMin = d3.sum(om, (o) => o.plan);
    const r = TR.length > 2 ? pearson(TR.map((t) => t.c), TR.map((t) => t.f)) : null; const cads = ser('cad').filter((v) => v != null); const cad = cads.length ? Math.round(d3.mean(cads)) : null;
    const hr = ser('hrrc').filter((v) => v != null); const hrm = hr.length ? Math.round(d3.mean(hr)) : null; const v = (a) => show(a);
    return [
      { id: 'jue', t: 'Sesiones omitidas', v: om.length + ' · ' + omMin + ' min', tone: om.length ? 'bad' : 'good', icon: 'cal', que: 'Rodajes principales que estaban en el plan y no se hicieron.', datos: om.length ? om.length + ' sesiones principales omitidas: ' + omMin + ' min que no se acumularon.' : 'No hubo sesiones principales omitidas en este período.', hacer: 'Si un día no funciona, mover la sesión al día siguiente en vez de perderla.' },
      { id: 'vol', t: 'Volumen semanal', v: v(f0.min) + ' → ' + v(fp.min != null ? fp.min : fc.min) + ' min', tone: f0.min != null && (fp.min != null ? fp.min : fc.min) < f0.min ? 'bad' : 'good', icon: 'clock', que: 'Minutos totales con la bici en la semana.', datos: 'Pasó de ' + v(f0.min) + ' min en la semana ' + hFirst + ' a ' + v(fp.min != null ? fp.min : fc.min) + ' en la ' + (fp.min != null ? cur - 1 : cur) + '.', hacer: 'Sumar 5 a 10 min por salida, de forma gradual.' },
      { id: 'fit', t: 'Fitness', v: v(c0.ctl) + ' → ' + v(cN.ctl), tone: c0.ctl != null && cN.ctl != null && cN.ctl < c0.ctl ? 'warn' : 'good', icon: 'shield', que: 'Base acumulada de carga de las últimas semanas.', datos: 'Pasó de ' + v(c0.ctl) + ' a ' + v(cN.ctl) + '; hoy está en ' + L.apt + '.', hacer: 'Volumen suave y constante: es lo único que la sube.' },
      { id: 'meta', t: 'Base aeróbica', v: 'objetivo', tone: 'info', icon: 'target', que: 'Lo que el plan busca construir: sostener esfuerzo suave por mucho tiempo.', datos: 'Se construye con volumen constante; hoy el fitness está en ' + L.apt + '.', hacer: 'Cuidar que cada salida se sienta fácil y repetible.' },
      { id: 'int', t: 'Intensidad', v: v(f0.int) + '% → ' + v(fc.int) + '%', tone: f0.int != null && fc.int != null && fc.int - f0.int >= 5 ? 'bad' : 'info', icon: 'target', que: 'Porcentaje del pulso de referencia durante la salida.', datos: 'Pasó de ' + v(f0.int) + '% en la semana ' + hFirst + ' a ' + v(fc.int) + '% hoy.', hacer: 'Volver a la sensación de rodaje suave de la semana ' + hFirst + '.' },
      { id: 'fc', t: 'FC media', v: v(f0.fc) + ' → ' + v(fc.fc) + ' lpm', tone: fc.fc != null && fc.fc > R.z2[1] ? 'warn' : 'good', icon: 'heart', que: 'Pulso promedio ponderado por duración.', datos: 'Pasó de ' + v(f0.fc) + ' a ' + v(fc.fc) + ' lpm; el techo de Z2 es ' + R.z2[1] + '.', hacer: 'Bajar 1 o 2 marchas y dejar que el pulso se acomode.' },
      { id: 'fat', t: 'Fatiga', v: F0.fat + ' → ' + L.fat, tone: L.fat > L.apt * 1.3 ? 'warn' : 'info', icon: 'flame', que: 'Carga reciente; sube rápido y baja rápido.', datos: 'Pasó de ' + F0.fat + ' a ' + L.fat + ' en ' + S.length + ' salidas; el fitness está en ' + L.apt + '.', hacer: 'Un día liviano o un rodaje corto en Z1 a Z2 la baja.' },
      { id: 'forma', t: 'Forma', v: String(L.forma), tone: formaTone(L.forma), icon: 'battery', que: 'Fitness menos fatiga.', datos: 'Pasó de ' + F0.forma + ' a ' + L.forma + ': está en «' + formaZona(L.forma) + '».', hacer: formaHacer[formaZona(L.forma)] },
      { id: 'cad', t: 'Cadencia', v: cad != null ? cad + ' rpm' : '—', tone: cad == null ? 'mute' : cad >= R.cad[0] ? 'good' : 'bad', icon: 'wheel', que: 'Pedaladas por minuto; la meta es ' + R.cad[0] + ' a ' + R.cad[1] + '.', datos: cads.length ? 'Quedan entre ' + d3.min(cads) + ' y ' + d3.max(cads) + ' rpm.' + (r != null ? ' En los tramos, la relación entre cadencia y pulso es r = ' + fmt1(r) + '.' : '') : 'Sin datos de cadencia.', hacer: 'Bloques cortos con la marcha más liviana.' },
      { id: 'con', t: 'Constancia', v: S.length + ' salidas / 7 d', tone: S.length >= R.goalSessions ? 'good' : 'warn', icon: 'cal', que: 'Cuántas veces sale a pedalear.', datos: S.length + ' salidas entre el ' + fd(F0.d) + ' y el ' + fd(L.d) + '.', hacer: 'Mantener esa regularidad: es la base de todo lo demás.' },
      { id: 'hrr', t: 'Recuperación FC', v: hrm != null ? hrm + ' lpm' : '—', tone: hrm == null ? 'mute' : hrm >= R.hrrcGood ? 'good' : 'warn', icon: 'heart', que: 'Caída del pulso en el primer minuto tras parar.', datos: hr.length ? 'Mediciones de ' + hr.join(' y ') + ' lpm.' : 'Sin mediciones esta semana.', hacer: 'Usarla como semáforo: si cae de forma sostenida, descansar.' }
    ];
  };
  const EDGES = [['jue', 'vol', '+'], ['vol', 'fit', '+'], ['fit', 'meta', '+'], ['con', 'fit', '+'], ['int', 'fc', '+'], ['cad', 'fc', '~'], ['fc', 'fat', '+'], ['hrr', 'fat', '-'], ['fat', 'forma', '-']];
  const ELAB = { '+': 'suma', '-': 'resta', '~': 'van juntas' }; const ECOL = { '+': '#3B82C4', '-': '#D9534F', '~': '#8A8F98' };
  const clip = (a, b, bw, bh, pad) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const tx = dx ? (bw / 2 + pad) / Math.abs(dx) : Infinity, ty = dy ? (bh / 2 + pad) / Math.abs(dy) : Infinity; const t = Math.min(tx, ty); return [a[0] + dx * t, a[1] + dy * t]; };
  draws.mapa = (e) => {
    if (S.length < 2) { e.textContent = '—'; return; }
    const N = nodes(); const w0 = e.clientWidth || 600; const wide = w0 >= 560; const W = wide ? 720 : 360, H = wide ? 345 : 490;
    const POS = wide ? { jue: [75, 50], vol: [255, 50], fit: [435, 50], meta: [615, 50], int: [75, 170], fc: [255, 170], fat: [435, 170], forma: [615, 170], cad: [75, 290], con: [255, 290], hrr: [435, 290] } : { jue: [95, 45], vol: [265, 45], con: [95, 125], fit: [265, 125], meta: [265, 205], int: [95, 285], fc: [265, 285], cad: [95, 365], fat: [265, 365], hrr: [95, 445], forma: [265, 445] };
    const bw = wide ? 124 : 140, bh = 52; e.replaceChildren();
    const svg = d3.select(e).append('svg').attr('viewBox', '0 0 ' + W + ' ' + H).attr('width', '100%').attr('role', 'img').attr('aria-label', 'Mapa conceptual de cómo se conectan volumen, intensidad, fitness, fatiga y forma').style('display', 'block');
    const defs = svg.append('defs'); Object.keys(ECOL).forEach((k, i) => { defs.append('marker').attr('id', 'edar' + i).attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 9).attr('markerHeight', 9).attr('orient', 'auto').append('path').attr('d', 'M0 0L10 5L0 10z').style('fill', ECOL[k]); });
    const sel = E.state.node; const near = {}; near[sel] = 1; EDGES.forEach((ed) => { if (ed[0] === sel || ed[1] === sel) { near[ed[0]] = 1; near[ed[1]] = 1; } });
    EDGES.forEach((ed) => {
      const a = POS[ed[0]], b = POS[ed[1]]; const p = clip(a, b, bw, bh, 2), q = clip(b, a, bw, bh, 7); const on = ed[0] === sel || ed[1] === sel;
      svg.append('line').attr('x1', p[0]).attr('y1', p[1]).attr('x2', q[0]).attr('y2', q[1]).style('stroke', ECOL[ed[2]]).style('stroke-width', on ? 3 : 1.8).style('stroke-dasharray', ed[2] === '-' ? '6 4' : ed[2] === '~' ? '2 4' : 'none').style('opacity', on ? 1 : 0.35).attr('marker-end', 'url(#edar' + Object.keys(ECOL).indexOf(ed[2]) + ')');
      svg.append('text').attr('x', (p[0] + q[0]) / 2).attr('y', (p[1] + q[1]) / 2 - 5).attr('text-anchor', 'middle').style('font-size', '10px').style('font-weight', on ? 700 : 400).style('fill', ECOL[ed[2]]).style('opacity', on ? 1 : 0.5).text(ELAB[ed[2]]);
    });
    N.forEach((n) => {
      const p = POS[n.id]; const g = svg.append('g').attr('transform', 'translate(' + (p[0] - bw / 2) + ',' + (p[1] - bh / 2) + ')').attr('tabindex', 0).attr('role', 'button').attr('aria-label', n.t + ': ' + n.v).style('cursor', 'pointer').style('opacity', near[n.id] ? 1 : 0.4);
      g.append('rect').attr('width', bw).attr('height', bh).attr('rx', 14).style('fill', 'var(--surface)').style('stroke', TONE[n.tone]).style('stroke-width', n.id === sel ? 4 : 2);
      const ic = g.append('g').attr('transform', 'translate(8,5) scale(.0703)').style('fill', TONE[n.tone]); ic.node().innerHTML = deps.icon ? deps.iconInner(IC[n.icon] || 'info') : '';
      g.append('text').attr('x', 30).attr('y', 20).style('font-size', '12px').style('font-weight', 700).style('fill', 'var(--text)').text(n.t);
      g.append('text').attr('x', bw / 2).attr('y', 41).attr('text-anchor', 'middle').style('font-size', '13px').style('font-weight', 600).style('fill', TONE[n.tone]).text(n.v);
      const pick = () => { E.state.node = n.id; draw('mapa'); draw('mapaDetalle'); };
      g.on('click', pick).on('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
    });
  };
  draws.mapaDetalle = (e) => {
    e.replaceChildren(); if (S.length < 2) { e.textContent = '—'; return; }
    const N = nodes(); const n = N.find((x) => x.id === E.state.node) || N[0];
    const head = el('div', 'ed-row'); const ib = el('span', 'ed-ib'); ib.style.setProperty('--tone', TONE[n.tone]); ib.append(icon(n.icon, 16)); const bd = el('span', 'ed-badge', n.v); bd.style.setProperty('--tone', TONE[n.tone]); head.append(ib, el('b', null, n.t), bd); e.append(head);
    [['Qué mide', n.que], ['Qué dicen los datos', n.datos], ['Qué hacer', n.hacer]].forEach((p) => { const d = el('p', null); d.append(el('b', null, p[0] + ': '), document.createTextNode(p[1])); e.append(d); });
    const rel = EDGES.filter((ed) => ed[0] === n.id || ed[1] === n.id).map((ed) => { const o = N.find((x) => x.id === (ed[0] === n.id ? ed[1] : ed[0])); return (ed[0] === n.id ? 'afecta a ' : 'recibe de ') + o.t + ' (' + ELAB[ed[2]] + ')'; });
    if (rel.length) e.append(el('p', 'how', 'Conexiones: ' + rel.join('; ') + '.'));
  };

  /* ---------- Misiones (el compromiso queda solo en este dispositivo) ---------- */
  const mkey = 'camino.panel.mis.' + (deps.key || 'x') + '.' + cur;
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(mkey) || '{}') || {}; } catch (er) { saved = {}; }
  root.querySelectorAll('button[data-mis]').forEach((b) => {
    const i = b.getAttribute('data-mis'); const set = (on) => { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? '¡Comprometido!' : b.getAttribute('data-t0'); };
    set(!!saved[i]); b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; set(on); if (on) saved[i] = 1; else delete saved[i]; try { localStorage.setItem(mkey, JSON.stringify(saved)); } catch (er) { /* sin almacenamiento */ } };
  });

  /* ---------- Dibujar todo y redibujar al cambiar el ancho ---------- */
  const all = ['hero', 'estado', 'forma', 'pills', 'panel', 'bloquesChart', 'zonasChart', 'dispersion', 'dispNota', 'calendario', 'calDetalle', 'logros', 'barras', 'tendencia', 'historial', 'mapa', 'mapaDetalle'];
  const charts = ['forma', 'bloquesChart', 'zonasChart', 'dispersion', 'barras', 'tendencia', 'historial', 'mapa'];
  all.forEach(draw);
  let lastW = root.clientWidth, tm = null, ro = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => { const w = root.clientWidth; if (!w || Math.abs(w - lastW) < 8) return; lastW = w; clearTimeout(tm); tm = setTimeout(() => charts.forEach(draw), 150); });
    ro.observe(root);
  }
  return { destroy() { if (ro) ro.disconnect(); clearTimeout(tm); root.replaceChildren(); } };
}
