# Camino Ruta (planificador independiente) · v2

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

## Novedades v2 (27-nov-2026)
- **Velocidad por tramo**: cada control puede llevar la velocidad del tramo que termina en él, y la meta una velocidad propia para el último tramo; sin dato usa la general. Con un solo valor el resultado es idéntico a v1.
- **Margen a meta** en el modo en vivo (brevet): con el plan más tu atraso actual y con tu ritmo real frente al del plan.
- **Barra de ruta** con los controles como marcas y el punto de avance.
- **Copia del registro en vivo** en el evento (`liveBak`, cada 20 s como máximo): si se pierde el teléfono o se borra la app, la lista de eventos ofrece «Recuperar registro». Se borra al guardar o cerrar el evento.
- **Resultado real por tramo** y botón para crear un evento nuevo con tu ritmo real; la lista muestra si el evento está terminado y su tiempo.
- La salida de cada control se guarda ahora en el resultado (`controls[].dep`).
- **Service worker** `ruta-shell-v2`: la red tiene 4 s; si no responde, abre lo guardado. No guarda respuestas con error. Fuentes en caché y carga no bloqueante.
- Corregido: «Tramo que viene» (parada en un control) mostraba el mismo control con 0,0 km; ahora muestra el siguiente. El mismo error existe en el código de Camino v79 del que se copió.

## Pruebas
`pruebas/` no se publica; se corrieron 19 pruebas del cálculo con el Brevet 1000 (Plan A reproducido al minuto) y 7 del service worker.
