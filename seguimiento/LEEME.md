# Seguimiento en ruta (sin cuenta) · Camino Ruta v3

Página pública `/camino/seguimiento/#t=<token>` para que familia o amigos vean el avance de un evento sin cuenta ni app.

## Cómo funciona
- En el planificador (Hoja de seguridad) se crea un enlace: se genera un token aleatorio (24 caracteres) y se crea el documento `tracks/{token}`. El token se guarda en el evento (`safe.trk`).
- Con el modo en vivo abierto, el planificador publica el estado: al cambiar algo (máx. cada ~4 s) y cada 2 min como señal de vida. Sin señal, Firestore lo envía al volver la conexión.
- La página lee ese único documento por la API REST de Firestore (sin SDK ni inicio de sesión) cada 30 s.
- Se publica: nombre de pila, nombre del evento, km, controles (plan, llegada real, cierre), atraso, próximo control, mensaje corto. **No** se publican coordenadas, teléfono, contacto ni nombre completo.
- Avisos: «sin actualizaciones» (más de 10 min) y «ya pasó la hora acordada» (la de la Hoja de seguridad) si no hay noticias.
- Vence solo: 72 h después de la última actualización (48 h tras terminar; máximo 7 días por regla). «Desactivar y borrar enlace» lo elimina al instante.
- La página no usa innerHTML (todo textContent), tiene política CSP, `noindex` y no envía referrer.

## Regla de Firestore (obligatoria, una sola vez)
Agregar el bloque de `reglas-firestore.txt` dentro de las reglas desplegadas, sin tocar las demás. Mientras no esté, «Crear enlace» muestra «Falta activar la regla de seguimiento en Firebase». Probar con el Simulador de reglas: `get` sin autenticar sobre `/tracks/<token existente>` debe permitirse; `list` sobre `/tracks` debe denegarse; escribir sin sesión debe denegarse.

## Riesgos conocidos
- Quien tenga el enlace ve el avance hasta que venza o se desactive: compartirlo solo con gente de confianza.
- Cualquier persona con sesión en Camino puede crear documentos `tracks` propios (tamaño máximo 9.000 caracteres, 7 días). Costo despreciable.
- La clave de API de Firebase es pública por diseño; la protegen las reglas y las restricciones de dominio.
