# Camino Ruta (planificador independiente) · v1

App web instalable, en carpeta propia del sitio de Camino (`/camino/planificador/`). Es la sección **Planificar y modo en vivo** de Camino como app aparte: misma cuenta, mismos datos, funciona sin abrir Camino.

## Qué hace
- Planificar: evento, GPX, controles (con «Reg PC»), horarios y ventanas ACP, nutrición e hidratación. Mismo cálculo que Camino.
- Modo en vivo: cronómetro, adelanto/atraso, próximo control, posición por **GPS** o por el **km del ciclocomputador** (manual), detenciones, nutrición del tramo.
- Al terminar: guarda el resultado en el evento y registra la salida en Camino (un check-in de actividad por día, sin pisar lo que ya exista ese día). La carga, la aptitud y la fatiga las calcula intervals.icu cuando llega la actividad de Garmin o Strava.
- Sin señal: el estado vive en el teléfono; lo que no se pueda escribir queda pendiente y se envía solo al volver la conexión.

## Datos (Firestore, sin cambiar reglas)
`users/{uid}/events/{id}` (el evento y su `result`), `users/{uid}/checkins/{AAAA-MM-DD}` (actividad del día). El estado en vivo usa la misma clave local que Camino (`camino-live-v1-<uid>`): un evento iniciado en una app se puede continuar en la otra, pero no usar las dos a la vez.

## Archivos
`index.html`, `app.js` (bloque de Planificar de Camino v79 + capa propia), `data.js` (Firebase), `sw.js` (caché propia `ruta-shell-vN`), `manifest.webmanifest`, `ruta.css`. Usa `../styles.css` y `../firebase-config.js`. No contiene claves.

## Habilitación
Igual que Planificar: `users/{id}.features.planificar === true` (Biblioteca, por atleta) o coach.

## Publicar
Subir la carpeta `planificador/` al repositorio y aplicar el cambio de `sw.js` de Camino (la línea de `activate` solo borra cachés `camino-shell-*`).
