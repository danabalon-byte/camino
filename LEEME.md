# Camino

App de seguimiento para atletas de GRNT y ZN: check-in diario, plan, equipo y vista del coach.
Sitio estático (sin build) + Firebase (Auth con Google y Firestore, proyecto `camino-ciclista`).

## Archivos
- `index.html`, `styles.css`, `app.js`: la app.
- `panel.js` y `d3.min.js`: menú Panel (informe semanal con gráficos; d3 v7.9.0, licencia ISC). Los datos salen de `users/{uid}/panel/{AAAA-Www}` en Firestore.
- `backend-firebase.js`: datos reales. `backend-demo.js`: datos ficticios (abrir con `?demo=1`).
- `firebase-config.js`: configuración web (pública por diseño; los datos los protegen las reglas).
- `firestore.rules`: reglas de seguridad (se pegan en la consola de Firebase, no se publican desde aquí).
- `sw.js`, `manifest.webmanifest`, iconos y logos (en la raíz del sitio): instalación como app y uso sin conexión.

## Reglas
No guardar en este repositorio: correos personales, claves privadas, cuentas de servicio ni datos de atletas.
