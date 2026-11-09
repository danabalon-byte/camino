// Camino: app de seguimiento para atletas de GRNT y ZN.
// Atleta: Hoy (check-in), Ruta (plan, equipo, insignias). Coach: Cabina (atletas, solicitudes, notas).
// Los datos viven en Firestore (backend-firebase.js). Con ?demo=1 usa datos ficticios (backend-demo.js).

const DEMO_Q = new URLSearchParams(location.search), DEMO = DEMO_Q.has('demo'), DEMO_ROLE = ({ atleta: 'athlete', athlete: 'athlete', coach: 'coach' })[DEMO_Q.get('demo')] || null;
import { BODY } from './body.js';
const be = DEMO ? (await import('./backend-demo.js')).default : (await import('./backend-firebase.js')).default;

/* ---------- Constantes ---------- */
const PREFKEY = 'camino-prefs-v1';
const GOAL = '2026-12-08';
const KM_GOAL_DEFAULT = 2000;
const TEAMS = { grnt: 'GRNT', zn: 'ZN' };
const MOODS = ['Muy mal', 'Mal', 'Normal', 'Bien', 'Excelente'];
const SLEEPH = ['Menos de 5 h', '5 a 6 h', '6 a 7 h', '7 a 8 h', 'Más de 8 h'];
const SLEEPQ = ['Muy bien', 'Bien', 'Más o menos', 'Mal'];
const LEGS = ['Pesadas', 'Normales', 'Livianas'];
const STRESS = ['Bajo', 'Medio', 'Alto'];
const HEAT = ['Frío', 'Templado', 'Caluroso', 'Muy caluroso'];
const PREVT = ['Comida abundante', 'Alcohol', 'Trasnoche', 'Viaje o jornada larga', 'Enfermedad leve', 'Otro'];
const HARDT = ['Subida', 'Viento en contra', 'Ritmo alto o sprint', 'Terreno técnico', 'Calor', 'Otro'];
const HARDD = ['Menos de 5 min', '5 a 20 min', 'Más de 20 min'];
const HARDE = ['Con fuerzas', 'Justo', 'Muy exigido'];
const CK_KEYS = ['act2', 'date', 'type', 'mood', 'sleepH', 'sleepQ', 'legs', 'stress', 'rpe', 'heat', 'hard', 'hardInfo', 'prev', 'prevInfo', 'pain', 'comment', 'activity', 'fuel', 'skip', 'ts'];
const CARBS = ['No', 'Parcial', 'Sí'];
const HYDRA = ['Poca', 'Normal', 'Bastante'];
const ENERGY = ['Baja', 'Normal', 'Alta'];
const SKIPR = ['Trabajo', 'Viaje', 'Malestar físico', 'Imprevisto', 'Otro'];
const ZONES = ['Cuello', 'Hombro', 'Espalda', 'Cadera', 'Muslo', 'Rodilla', 'Pantorrilla', 'Pie', 'Mano o muñeca'];
const SIDES = ['Izquierdo', 'Derecho', 'Ambos'];
const LEVELS = ['Leve', 'Moderada', 'Fuerte'];
const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WDL = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const NUMERIC = { gdur: 1, odur: 1, gfeel: 1, sleepH: 1, sleepQ: 1, legs: 1, stress: 1, rpe: 1, heat: 1, mood: 1, carbs: 1, hydra: 1, energy: 1 };
const TONES = [
  { id: 'auto', name: 'Auto', sub: 'Sigue el tema de tu dispositivo', sw: ['#F3F4F7', '#0F1115', '#C2410C', '#FF7A3D'] },
  { id: 'noche', name: 'Noche', sub: 'Oscuro con naranja', sw: ['#0F1115', '#171A21', '#FF7A3D', '#4ADE9B'] },
  { id: 'tierra', name: 'Tierra', sub: 'Oliva y ocre, de gravel', sw: ['#12140E', '#1C1F15', '#E0A93B', '#8EDB8F'] },
  { id: 'dia', name: 'Día', sub: 'Claro, para leer al sol', sw: ['#F3F4F7', '#FFFFFF', '#C2410C', '#0B7A4B'] }
];
// Plan base de ejemplo: se reemplazará por el plan real de intervals.icu.
const PLAN = { 1: { name: 'Rodillo Z2', min: 60, km: 28, load: 52 }, 2: { name: 'Rodillo suave', min: 45, km: 18, load: 34 }, 3: null, 4: { name: 'Intervalos sweet spot', min: 80, km: 32, load: 78 }, 5: { name: 'Z2 corto', min: 40, km: 16, load: 30 }, 6: { name: 'Rodaje largo', min: 180, km: 85, load: 150 }, 0: { name: 'Rodaje suave', min: 70, km: 30, load: 48 } };
/* Iconografía: Phosphor Icons (MIT, https://phosphoricons.com). Una sola familia: rejilla 256, trazo regular; relleno para el estado activo. */
const PH = {
  'user': ['<path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>', '<path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z"/>'],
  'shield': ['<path d="M208,40H48A16,16,0,0,0,32,56v58.78c0,89.61,75.82,119.34,91,124.39a15.53,15.53,0,0,0,10,0c15.2-5.05,91-34.78,91-124.39V56A16,16,0,0,0,208,40Zm0,74.79c0,78.42-66.35,104.62-80,109.18-13.53-4.51-80-30.69-80-109.18V56H208Z"/>', '<path d="M208,40H48A16,16,0,0,0,32,56v58.78c0,89.61,75.82,119.34,91,124.39a15.53,15.53,0,0,0,10,0c15.2-5.05,91-34.78,91-124.39V56A16,16,0,0,0,208,40Z"/>'],
  'calendar-check': ['<path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-38.34-85.66a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L116,164.69l42.34-42.35A8,8,0,0,1,169.66,122.34Z"/>', '<path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM169.66,133.66l-48,48a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L116,164.69l42.34-42.35a8,8,0,0,1,11.32,11.32ZM48,80V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80Z"/>'],
  'path': ['<path d="M200,168a32.06,32.06,0,0,0-31,24H72a32,32,0,0,1,0-64h96a40,40,0,0,0,0-80H72a8,8,0,0,0,0,16h96a24,24,0,0,1,0,48H72a48,48,0,0,0,0,96h97a32,32,0,1,0,31-40Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,200,216Z"/>', '<path d="M228,200a28,28,0,0,1-54.83,8H72a48,48,0,0,1,0-96h96a24,24,0,0,0,0-48H72a8,8,0,0,1,0-16h96a40,40,0,0,1,0,80H72a32,32,0,0,0,0,64H173.17A28,28,0,0,1,228,200Z"/>'],
  'gauge': ['<path d="M207.06,72.67A111.24,111.24,0,0,0,128,40h-.4C66.07,40.21,16,91,16,153.13V176a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V152A111.25,111.25,0,0,0,207.06,72.67ZM224,176H119.71l54.76-75.3a8,8,0,0,0-12.94-9.42L99.92,176H32V153.13c0-3.08.15-6.12.43-9.13H56a8,8,0,0,0,0-16H35.27c10.32-38.86,44-68.24,84.73-71.66V80a8,8,0,0,0,16,0V56.33A96.14,96.14,0,0,1,221,128H200a8,8,0,0,0,0,16h23.67c.21,2.65.33,5.31.33,8Z"/>', '<path d="M240,152v24a16,16,0,0,1-16,16H115.93a4,4,0,0,1-3.24-6.35L174.27,101a8.21,8.21,0,0,0-1.37-11.3,8,8,0,0,0-11.37,1.61l-72,99.06A4,4,0,0,1,86.25,192H32a16,16,0,0,1-16-16V153.13c0-1.79,0-3.57.13-5.33a4,4,0,0,1,4-3.8H48a8,8,0,0,0,8-8.53A8.17,8.17,0,0,0,47.73,128H23.92a4,4,0,0,1-3.87-5c12-43.84,49.66-77.13,95.52-82.28a4,4,0,0,1,4.43,4V72a8,8,0,0,0,8.53,8A8.17,8.17,0,0,0,136,71.73V44.67a4,4,0,0,1,4.43-4A112.18,112.18,0,0,1,236.23,123a4,4,0,0,1-3.88,5H208.27a8.17,8.17,0,0,0-8.25,7.47,8,8,0,0,0,8,8.53h27.92a4,4,0,0,1,4,3.86C240,149.23,240,150.61,240,152Z"/>'],
  'chart-line-up': ['<path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31l-56,56V200H224A8,8,0,0,1,232,208Z"/>', '<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM200,192H56a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v76.69l34.34-34.35a8,8,0,0,1,11.32,0L128,132.69,172.69,88H144a8,8,0,0,1,0-16h48a8,8,0,0,1,8,8v48a8,8,0,0,1-16,0V99.31l-50.34,50.35a8,8,0,0,1-11.32,0L104,131.31l-40,40V176H200a8,8,0,0,1,0,16Z"/>'],
  'book-open': ['<path d="M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z"/>', '<path d="M240,56V200a8,8,0,0,1-8,8H160a24,24,0,0,0-24,23.94,7.9,7.9,0,0,1-5.12,7.55A8,8,0,0,1,120,232a24,24,0,0,0-24-24H24a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8H88a32,32,0,0,1,32,32v87.73a8.17,8.17,0,0,0,7.47,8.25,8,8,0,0,0,8.53-8V80a32,32,0,0,1,32-32h64A8,8,0,0,1,240,56Z"/>'],
  'gear-six': ['<path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm109.94-52.79a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A112.1,112.1,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.62a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21Zm-15,34.91-28.57,16.25a8,8,0,0,0-3,3c-.58,1-1.19,2.06-1.81,3.06a7.94,7.94,0,0,0-1.22,4.21l-.15,32.25a95.89,95.89,0,0,1-25.37,14.3L134,199.13a8,8,0,0,0-3.91-1h-.19c-1.21,0-2.43,0-3.64,0a8.08,8.08,0,0,0-4.1,1l-28.84,16.1A96,96,0,0,1,67.88,201l-.11-32.2a8,8,0,0,0-1.22-4.22c-.62-1-1.23-2-1.8-3.06a8.09,8.09,0,0,0-3-3.06l-28.6-16.29a90.49,90.49,0,0,1,0-28.26L61.67,97.63a8,8,0,0,0,3-3c.58-1,1.19-2.06,1.81-3.06a7.94,7.94,0,0,0,1.22-4.21l.15-32.25a95.89,95.89,0,0,1,25.37-14.3L122,56.87a8,8,0,0,0,4.1,1c1.21,0,2.43,0,3.64,0a8.08,8.08,0,0,0,4.1-1l28.84-16.1A96,96,0,0,1,188.12,55l.11,32.2a8,8,0,0,0,1.22,4.22c.62,1,1.23,2,1.8,3.06a8.09,8.09,0,0,0,3,3.06l28.6,16.29A90.49,90.49,0,0,1,222.9,142.12Z"/>', '<path d="M237.94,107.21a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A111.92,111.92,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.63a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z"/>'],
  'flame': ['<path d="M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48ZM96,184c0-27.67,22.53-47.28,32-54.3,9.48,7,32,26.63,32,54.3a32,32,0,0,1-64,0Zm77.27,15.93A47.8,47.8,0,0,0,176,184c0-44-42.09-69.79-43.88-70.86a8,8,0,0,0-8.24,0C122.09,114.21,80,140,80,184a47.8,47.8,0,0,0,2.73,15.93A71.88,71.88,0,0,1,56,144c0-34.41,20.4-63.15,37.52-81.19A216.21,216.21,0,0,1,128,33.54a215.77,215.77,0,0,1,34.48,29.27C193.49,95.5,200,125,200,144A71.88,71.88,0,0,1,173.27,199.93Z"/>', '<path d="M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48ZM96,184c0-27.67,22.53-47.28,32-54.3,9.48,7,32,26.63,32,54.3a32,32,0,0,1-64,0Z"/>'],
  'moon': ['<path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z"/>', '<path d="M235.54,150.21a104.84,104.84,0,0,1-37,52.91A104,104,0,0,1,32,120,103.09,103.09,0,0,1,52.88,57.48a104.84,104.84,0,0,1,52.91-37,8,8,0,0,1,10,10,88.08,88.08,0,0,0,109.8,109.8,8,8,0,0,1,10,10Z"/>'],
  'calendar-blank': ['<path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/>', '<path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,48H48V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24Z"/>'],
  'lightning': ['<path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17ZM109.37,214l10.47-52.38a8,8,0,0,0-5-9.06L62,132.71l84.62-90.66L136.16,94.43a8,8,0,0,0,5,9.06l52.8,19.8Z"/>', '<path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z"/>'],
  'bell': ['<path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"/>', '<path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216Z"/>'],
  'pencil-simple': ['<path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/>', '<path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM192,108.68,147.31,64l24-24L216,84.68Z"/>'],
  'flag': ['<path d="M48,216V48 M48,48H208l-28,44,28,44H48" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>', '<path d="M40,40a8,8,0,0,1,8,8v8H208a8,8,0,0,1,6.9,12.1L187.9,92l27,39.9A8,8,0,0,1,208,144H56v72a8,8,0,0,1-16,0V48A8,8,0,0,1,40,40Z"/>'],
  'arrows-out': ['<path d="M216,48V96a8,8,0,0,1-16,0V67.31l-42.34,42.35a8,8,0,0,1-11.32-11.32L188.69,56H160a8,8,0,0,1,0-16h48A8,8,0,0,1,216,48ZM98.34,146.34,56,188.69V160a8,8,0,0,0-16,0v48a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16H67.31l42.35-42.34a8,8,0,0,0-11.32-11.32ZM208,152a8,8,0,0,0-8,8v28.69l-42.34-42.35a8,8,0,0,0-11.32,11.32L188.69,200H160a8,8,0,0,0,0,16h48a8,8,0,0,0,8-8V160A8,8,0,0,0,208,152ZM67.31,56H96a8,8,0,0,0,0-16H48a8,8,0,0,0-8,8V96a8,8,0,0,0,16,0V67.31l42.34,42.35a8,8,0,0,0,11.32-11.32Z"/>', '<path d="M109.66,146.34a8,8,0,0,1,0,11.32L83.31,184l18.35,18.34A8,8,0,0,1,96,216H48a8,8,0,0,1-8-8V160a8,8,0,0,1,13.66-5.66L72,172.69l26.34-26.35A8,8,0,0,1,109.66,146.34ZM83.31,72l18.35-18.34A8,8,0,0,0,96,40H48a8,8,0,0,0-8,8V96a8,8,0,0,0,13.66,5.66L72,83.31l26.34,26.35a8,8,0,0,0,11.32-11.32ZM208,40H160a8,8,0,0,0-5.66,13.66L172.69,72,146.34,98.34a8,8,0,0,0,11.32,11.32L184,83.31l18.34,18.35A8,8,0,0,0,216,96V48A8,8,0,0,0,208,40Zm3.06,112.61a8,8,0,0,0-8.72,1.73L184,172.69l-26.34-26.35a8,8,0,0,0-11.32,11.32L172.69,184l-18.35,18.34A8,8,0,0,0,160,216h48a8,8,0,0,0,8-8V160A8,8,0,0,0,211.06,152.61Z"/>'],
  'caret-right': ['<path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>', '<path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>'],
  'caret-down': ['<path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>', '<path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>'],
  'info': ['<path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"/>', '<path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z"/>'],
  'arrow-right': ['<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>', '<path d="M221.66,133.66l-72,72A8,8,0,0,1,136,200V136H40a8,8,0,0,1,0-16h96V56a8,8,0,0,1,13.66-5.66l72,72A8,8,0,0,1,221.66,133.66Z"/>'],
  'check': ['<path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>', '<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/>'],
  'bicycle': ['<path d="M208,112a47.81,47.81,0,0,0-16.93,3.09L165.93,72H192a8,8,0,0,1,8,8,8,8,0,0,0,16,0,24,24,0,0,0-24-24H152a8,8,0,0,0-6.91,12l11.65,20H99.26L82.91,60A8,8,0,0,0,76,56H48a8,8,0,0,0,0,16H71.41L85.12,95.51,69.41,117.06a48.13,48.13,0,1,0,12.92,9.44l11.59-15.9L125.09,164A8,8,0,1,0,138.91,156l-30.32-52h57.48l11.19,19.17A48,48,0,1,0,208,112ZM80,160a32,32,0,1,1-20.21-29.74l-18.25,25a8,8,0,1,0,12.92,9.42l18.25-25A31.88,31.88,0,0,1,80,160Zm128,32a32,32,0,0,1-22.51-54.72L201.09,164A8,8,0,1,0,214.91,156L199.3,129.21A32,32,0,1,1,208,192Z"/>', '<path d="M54.46,164.71,82.33,126.5a48,48,0,1,1-12.92-9.44L41.54,155.29a8,8,0,1,0,12.92,9.42ZM208,112a47.81,47.81,0,0,0-16.93,3.09L214.91,156A8,8,0,1,1,201.09,164l-23.83-40.86A48,48,0,1,0,208,112ZM165.93,72H192a8,8,0,0,1,8,8,8,8,0,0,0,16,0,24,24,0,0,0-24-24H152a8,8,0,0,0-6.91,12l11.65,20H99.26L82.91,60A8,8,0,0,0,76,56H48a8,8,0,0,0,0,16H71.41L85.12,95.51,69.41,117.06a47.87,47.87,0,0,1,12.92,9.44l11.59-15.9L125.09,164A8,8,0,1,0,138.91,156l-30.32-52h57.48l11.19,19.17a48.11,48.11,0,0,1,13.81-8.08Z"/>'],
  'barbell': ['<path d="M248,120h-8V88a16,16,0,0,0-16-16H208V64a16,16,0,0,0-16-16H168a16,16,0,0,0-16,16v56H104V64A16,16,0,0,0,88,48H64A16,16,0,0,0,48,64v8H32A16,16,0,0,0,16,88v32H8a8,8,0,0,0,0,16h8v32a16,16,0,0,0,16,16H48v8a16,16,0,0,0,16,16H88a16,16,0,0,0,16-16V136h48v56a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16v-8h16a16,16,0,0,0,16-16V136h8a8,8,0,0,0,0-16ZM32,168V88H48v80Zm56,24H64V64H88V192Zm104,0H168V64h24V175.82c0,.06,0,.12,0,.18s0,.12,0,.18V192Zm32-24H208V88h16Z"/>', '<path d="M200,64V192a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V136H104v56a16,16,0,0,1-16,16H72a16,16,0,0,1-16-16V64A16,16,0,0,1,72,48H88a16,16,0,0,1,16,16v56h48V64a16,16,0,0,1,16-16h16A16,16,0,0,1,200,64ZM36,72H32A16,16,0,0,0,16,88v32H8.27A8.18,8.18,0,0,0,0,127.47,8,8,0,0,0,8,136h8v32a16,16,0,0,0,16,16h4a4,4,0,0,0,4-4V76A4,4,0,0,0,36,72Zm220,55.47a8.18,8.18,0,0,0-8.25-7.47H240V88a16,16,0,0,0-16-16h-4a4,4,0,0,0-4,4V180a4,4,0,0,0,4,4h4a16,16,0,0,0,16-16V136h8A8,8,0,0,0,256,127.47Z"/>'],
  'person-simple-run': ['<path d="M152,88a32,32,0,1,0-32-32A32,32,0,0,0,152,88Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,152,40Zm67.31,100.68c-.61.28-7.49,3.28-19.67,3.28-13.85,0-34.55-3.88-60.69-20a169.31,169.31,0,0,1-15.41,32.34,104.29,104.29,0,0,1,31.31,15.81C173.92,186.65,184,207.35,184,232a8,8,0,0,1-16,0c0-41.7-34.69-56.71-54.14-61.85-.55.7-1.12,1.41-1.69,2.1-19.64,23.8-44.25,36.18-71.63,36.18A92.29,92.29,0,0,1,31.2,208,8,8,0,0,1,32.8,192c25.92,2.58,48.47-7.49,67-30,12.49-15.14,21-33.61,25.25-47C86.13,92.35,61.27,111.63,61,111.84A8,8,0,1,1,51,99.36c1.5-1.2,37.22-29,89.51,6.57,45.47,30.91,71.93,20.31,72.18,20.19a8,8,0,1,1,6.63,14.56Z"/>', '<path d="M120,56a32,32,0,1,1,32,32A32,32,0,0,1,120,56Zm103.28,74.08a8,8,0,0,0-10.6-4c-.25.12-26.71,10.72-72.18-20.19-52.29-35.54-88-7.77-89.51-6.57a8,8,0,1,0,10,12.48c.26-.21,25.12-19.5,64.07,3.27-4.25,13.35-12.76,31.82-25.25,47-18.56,22.48-41.11,32.56-67,30A8,8,0,0,0,31.2,208a92.29,92.29,0,0,0,9.34.47c27.38,0,52-12.38,71.63-36.18.57-.69,1.14-1.4,1.69-2.1C133.31,175.29,168,190.3,168,232a8,8,0,0,0,16,0c0-24.65-10.08-45.35-29.15-59.86a104.29,104.29,0,0,0-31.31-15.81A169.31,169.31,0,0,0,139,124c26.14,16.09,46.84,20,60.69,20,12.18,0,19.06-3,19.67-3.28A8,8,0,0,0,223.28,130.08Z"/>']
};
const ph = (n, size, color, on) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 256 256" fill="' + (color || 'currentColor') + '" aria-hidden="true" focusable="false">' + PH[n][on ? 1 : 0] + '</svg>';
const ICONS = { racha: 'flame', sueno: 'moon', semana: 'calendar-blank', cinco: 'lightning' };

/* ---------- Fechas y textos ---------- */
const pad = (n) => (n < 10 ? '0' + n : '' + n);
const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
const off = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hhmm = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
function relTime(ts) {
  const n = diffDays(ymd(new Date(ts)), off(0));
  if (n === 0) return 'hoy, ' + hhmm(ts);
  if (n === 1) return 'ayer, ' + hhmm(ts);
  return 'hace ' + n + ' días';
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const at = (arr, i) => String(arr[i] == null ? '' : arr[i]);
const firstName = (n) => String(n || '').split(' ')[0] || 'Atleta';

/* ---------- Preferencias locales (solo tono) ---------- */
let PREF = { tone: 'auto' };
try { const r = localStorage.getItem(PREFKEY); if (r) PREF = Object.assign(PREF, JSON.parse(r)); } catch (e) {}
if (!['auto', 'noche', 'tierra', 'dia'].includes(PREF.tone)) PREF.tone = 'auto'; /* tonos retirados vuelven a Auto */
const savePref = () => { try { localStorage.setItem(PREFKEY, JSON.stringify(PREF)); } catch (e) {} };

/* ---------- Estado ---------- */
const ST = { props: [], ready: false, user: null, myBio: null, athBio: {}, profile: null, myPlan: null, myHist: null, myEvents: [], athPlan: {}, athHist: {}, myCk: [], myNotes: [], teamKm: {}, teamMeta: {}, fbk: [], athletes: [], athCk: {}, athNotes: {}, pending: [], error: '' };
const UI = { view: 'hoy', lastView: null, flow: null, feedback: null, story: null, sel: null, reply: { id: null, text: '' }, draft: { comment: '', prevText: '' }, justSaved: null, busy: false, metaTeam: 'zn', metaDraft: null, planOpen: false, planDraft: null, histOpen: false, histDraft: null, asId: null, msg: '', msgKind: 'err' };
let ownUnsubs = [], dataUnsubs = [], dataKey = '', athSubs = {}, chatSubs = {};

const isViewer = () => !!(ST.profile && ST.profile.role === 'viewer');
const isOwner = () => !!(ST.profile && ST.profile.role === 'coach');
const vAcc = () => (ST.profile && ST.profile.access) || {};
const canEdit = () => isOwner() || (isViewer() && vAcc().edit === true);
const canProfile = () => isOwner() || (isViewer() && vAcc().profile === true);
const isCoach = () => !!(ST.profile && (ST.profile.role === 'coach' || ST.profile.role === 'viewer'));
const myTeam = () => (ST.profile && ST.profile.team) || null;

function meA() {
  let list = ST.myCk;
  if (UI.justSaved && !list.some((c) => c.date === UI.justSaved.date)) list = [UI.justSaved].concat(list);
  return { id: ST.user ? ST.user.uid : '', name: ST.user ? ST.user.name : '', first: firstName(ST.user && ST.user.name), checkins: list, notes: ST.myNotes, tsb: [], hist: ST.myHist, plan: ST.myPlan };
}
function athleteObjs() {
  return ST.athletes.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))).map((p) => ({ id: p.id, name: p.name, first: firstName(p.name), team: p.team, features: p.features, checkins: ST.athCk[p.id] || [], notes: ST.athNotes[p.id] || [], tsb: histDays(ST.athHist[p.id]).slice(-7).map((x) => Math.round(x.ctl - x.atl)), hist: ST.athHist[p.id], plan: ST.athPlan[p.id] }));
}

/* ---------- Cálculos ---------- */
const latest = (a) => { let l = null; a.checkins.forEach((c) => { if (!l || c.date > l.date || (c.date === l.date && c.ts > l.ts)) l = c; }); return l; };
const on = (a, date) => { for (let i = 0; i < a.checkins.length; i++) if (a.checkins[i].date === date) return a.checkins[i]; return null; };
// Plan del atleta: lo carga su coach en Firestore (users/{uid}/plan/current). En modo demo, sin plan cargado, se usa el ejemplo.
const planFor = (date) => {
  const pl = ST.myPlan;
  if (pl && pl.sessions) return pl.sessions[date] || null;
  return DEMO && !pl ? PLAN[parse(date).getDay()] : null;
};
const dayNote = (date) => { const p = planFor(date), pl = ST.myPlan; return (p && p.note) || (pl && pl.notes && pl.notes[date]) || ''; };
const minText = (m) => (m >= 120 ? (Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + m % 60 + ' min' : '')) : m + ' min');
const planDesc = (p) => p.name + (p.min ? ' · ' + minText(p.min) : '') + (p.km ? ' · ' + p.km + ' km' : '');
function score(c) {
  const p = [];
  if (c.mood) p.push((c.mood - 1) / 4);
  if (c.sleepQ) p.push((4 - c.sleepQ) / 3);
  if (c.legs != null) p.push(c.legs / 2);
  if (c.stress != null) p.push((2 - c.stress) / 2);
  if (!p.length) return null;
  return Math.round(100 * p.reduce((x, y) => x + y, 0) / p.length);
}
function band(sc) {
  if (sc == null) return { k: 'none', label: 'Sin datos', color: 'var(--muted)' };
  if (sc >= 70) return { k: 'good', label: 'Listo para rodar', color: 'var(--good)' };
  if (sc >= 50) return { k: 'warn', label: 'Ve con calma', color: 'var(--warn)' };
  return { k: 'bad', label: 'Hoy toca cuidarte', color: 'var(--bad)' };
}
function summaryText(c, b) {
  const bits = [];
  if (c.sleepQ) bits.push(c.sleepQ <= 2 ? 'dormiste bien' : 'dormiste menos de lo ideal');
  if (c.legs != null) bits.push(c.legs === 0 ? 'tus piernas vienen pesadas' : (c.legs === 2 ? 'tus piernas vienen livianas' : 'tus piernas vienen estables'));
  let s = bits.length ? cap(bits.join(' y ')) + '.' : 'Según cómo te sentiste en tu último check-in.';
  const p = planFor(off(0));
  if (b.k === 'good' && p) s += ' Hoy toca ' + p.name.toLowerCase() + '.';
  else if (b.k === 'good') s += ' Hoy es día de descanso.';
  else if (b.k === 'warn') s += ' Rueda con calma y cuéntale a tu coach cómo vas.';
  else if (b.k === 'bad') s += ' Avísale a tu coach y baja la intensidad.';
  return s;
}
function streak(a) {
  const set = {}; a.checkins.forEach((c) => { set[c.date] = 1; });
  let n = 0; const start = set[off(0)] ? 0 : -1;
  for (let i = start; i > -500; i--) { if (set[off(i)]) n++; else break; }
  return { n, today: !!set[off(0)] };
}
function weekInfo(a, shift) {
  const t = parse(off(0)); t.setDate(t.getDate() + 7 * (shift || 0)); const mon = (t.getDay() + 6) % 7, days = []; let planned = 0, done = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(t); d.setDate(t.getDate() - mon + i); d.setHours(12, 0, 0, 0);
    const date = ymd(d), p = planFor(date), c = on(a, date), isDone = !!(c && c.type === 'actividad');
    if (p) planned++;
    if (p && isDone) done++;
    days.push({ date, p, done: isDone, today: date === off(0), wd: parse(date).getDay() });
  }
  return { days, planned, done };
}
function badges(a) {
  const st = streak(a).n; let sg = 0;
  for (let k = -6; k <= 0; k++) { const c = on(a, off(k)); if (c && c.sleepH != null && c.sleepH >= 2 && c.sleepQ && c.sleepQ <= 2) sg++; }
  const wk = weekInfo(a), acts = a.checkins.filter((x) => x.type === 'actividad' && x.date >= off(-13)).length;
  return [
    { id: 'racha', label: '7 días seguidos', earned: st >= 7, prog: Math.min(st, 7) + ' de 7 días' },
    { id: 'sueno', label: 'Sueño parejo', earned: sg >= 5, prog: sg + ' de 5 noches' },
    { id: 'semana', label: 'Semana completa', earned: wk.planned > 0 && wk.done >= wk.planned, prog: wk.done + ' de ' + wk.planned + ' sesiones' },
    { id: 'cinco', label: 'Cinco actividades', earned: acts >= 5, prog: Math.min(acts, 5) + ' de 5 en 14 días' }
  ];
}
const series = (a) => { const o = []; for (let k = -6; k <= 0; k++) { const c = on(a, off(k)); o.push(c ? c.mood : null); } return o; };
const lastNote = (a) => (a.notes.length ? a.notes[a.notes.length - 1] : null);
const gymMolOf = (c) => (c ? gzMol(c.activity).concat(gzMol(c.act2)) : []);
function statusOf(a) {
  const l = latest(a), reasons = [];
  if (!l) return { k: 'none', reasons: ['Aún sin check-ins'] };
  const gap = diffDays(l.date, off(0));
  if (gap >= 2) return { k: 'none', reasons: ['Sin check-in hace ' + gap + ' días'] };
  const s = series(a).filter((v) => v != null); let warn = false;
  if (l.mood != null && l.mood <= 2) { warn = true; reasons.push('Ánimo bajo en el último check-in'); }
  if (l.pain && l.pain.level !== 'Leve') { warn = true; reasons.push('Molestia ' + String(l.pain.level || '').toLowerCase() + ': ' + String(l.pain.zone || '').toLowerCase()); }
  else if (l.pain) reasons.push('Molestia leve: ' + String(l.pain.zone || '').toLowerCase());
  const gm = gymMolOf(l); if (gm.length) { warn = true; reasons.push('Molestia tras el gym: ' + gm.map((z) => z[1].toLowerCase()).join(', ')); }
  if (s.length >= 4 && s[s.length - 1] < s[s.length - 4] - 1) { warn = true; reasons.push('Bienestar a la baja en los últimos días'); }
  if (a.tsb && a.tsb.length) { const ts = a.tsb[a.tsb.length - 1]; if (ts <= -25) { warn = true; reasons.push('Forma (TSB) muy negativa: ' + ts); } }
  { const li = a.hist ? loadInfo(a) : null; if (li && li.ratio != null && li.base >= RAMP_MIN_BASE && li.ratio > 1 + RAMP_WARN) { warn = true; reasons.push('Carga 7 días +' + Math.round((li.ratio - 1) * 100) + ' % sobre su promedio de 4 semanas'); } }
  return { k: warn ? 'warn' : 'ok', reasons };
}
function needsReply(a) {
  if (statusOf(a).k === 'ok') return false;
  const l = latest(a), n = lastNote(a);
  if (!l) return false;
  if (!n) return true;
  return n.at < (l ? l.ts : 0);
}
function insightFor(c) {
  if (c.pain && c.pain.level !== 'Leve') return 'Gracias por avisar de la molestia. Tu coach lo verá hoy. Mientras tanto, baja la intensidad y cuida esa zona. Si el dolor aumenta o te limita, consulta a un profesional de salud.';
  if (c.mood != null && c.mood <= 2) return 'Gracias por contarlo. Tu coach lo verá hoy y ajustará con calma: descansar también es entrenar.';
  if (c.type === 'actividad' && c.rpe && c.rpe >= 8) return 'Fue una sesión exigente. Tu coach la revisará y planificará bien tu recuperación.';
  if (c.mood == null) return 'Sesión registrada. Con esto tu coach ajusta la carga y tu recuperación.';
  if (c.mood === 3) return 'Anotado. Tu semana sigue estable y vas al día con el plan.';
  return 'Qué buena señal. Si el plan lo permite, es un buen día para rodar con ganas.';
}
function goalData() {
  const pl = ST.myPlan;
  if (pl && pl.goal && pl.goal.date) return { name: String(pl.goal.name || 'Tu meta'), date: pl.goal.date, dateText: String(pl.goal.dateText || pl.goal.date), detail: String(pl.goal.detail || '') };
  if (DEMO && !pl) return { name: 'Vuelta Santuario Lo Vasquez', date: GOAL, dateText: '8 de diciembre', detail: 'salida con el equipo' };
  return null;
}
function goalInfo() {
  const gd = goalData(); if (!gd) return null;
  const days = diffDays(off(0), gd.date), weeks = Math.max(0, Math.ceil(days / 7));
  return Object.assign({}, gd, { days, weeks, done: days < 0, phase: days < 0 ? 'meta' : (weeks > 2 ? 'construccion' : 'afinamiento') });
}
function phaseList(g) {
  const pl = ST.myPlan;
  if (pl && Array.isArray(pl.phases) && pl.phases.length) {
    let nowSet = false;
    const list = pl.phases.map((p) => { let st = 'done'; if (!(g.done || (p.to && p.to < off(0)))) { st = nowSet ? 'next' : 'now'; nowSet = true; } return { n: String(p.n || ''), s: String(p.s || ''), st }; });
    list.push({ n: g.name, s: g.dateText + (g.detail ? ' · ' + g.detail : ''), st: g.done ? 'done' : 'goal' });
    return list;
  }
  return [
    { n: 'Base', s: '8 semanas · completada', st: 'done' },
    { n: 'Construcción', s: g.phase === 'construccion' ? 'Quedan ' + Math.max(g.weeks - 2, 1) + ' semanas · más volumen, con descansos planificados' : 'Completada', st: g.phase === 'construccion' ? 'now' : 'done' },
    { n: 'Afinamiento', s: g.phase === 'afinamiento' ? 'Quedan ' + Math.max(g.weeks, 1) + ' semanas · menos volumen y piernas frescas' : (g.phase === 'meta' ? 'Completado' : '2 semanas · menos volumen y piernas frescas'), st: g.phase === 'afinamiento' ? 'now' : (g.phase === 'meta' ? 'done' : 'next') },
    { n: g.name, s: g.dateText + (g.detail ? ' · ' + g.detail : ''), st: g.phase === 'meta' ? 'done' : 'goal' }
  ];
}
const monthKey = () => off(0).slice(0, 7);
function teamTotals(team) {
  const rows = (ST.teamKm[team] || []).filter((r) => r.month === monthKey());
  const km = rows.reduce((s, r) => s + (Number(r.km) || 0), 0);
  const meta = ST.teamMeta[team] || {};
  return { km: Math.round(km), goal: Number(meta.goal) || KM_GOAL_DEFAULT, hito: meta.hito || '', members: rows.length };
}
function teamsTotal() {
  const a = teamTotals('grnt'), b = teamTotals('zn');
  return { km: a.km + b.km, goal: a.goal + b.goal, hito: '', members: a.members + b.members };
}
function myMonthKm(extra) {
  const m = monthKey(); const base = ST.myCk.filter((c) => c.date.slice(0, 7) === m && c.date !== off(0)).reduce((s, c) => s + ((c.activity && c.activity.km) || 0), 0);
  return Math.round(base + (extra || 0));
}

/* ---------- Gráficos ---------- */
const xAt = (i) => 12 + i * 46;
const moodY = (v) => 68 - (v - 1) * 14;
function spark(a) {
  const s = series(a), pts = []; let last = null;
  s.forEach((v, i) => { if (v != null) { pts.push(xAt(i) + ',' + moodY(v)); last = [xAt(i), moodY(v)]; } });
  return '<svg width="320" height="84" viewBox="0 0 300 84" role="img" aria-label="Línea del ánimo de los últimos siete días"><line class="ln-g" x1="12" y1="68" x2="288" y2="68" stroke-width="1"></line><line class="ln-g" x1="12" y1="40" x2="288" y2="40" stroke-width="1" stroke-dasharray="3 4"></line>'
    + (pts.length > 1 ? '<polyline class="ln-a" points="' + pts.join(' ') + '" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>' : '')
    + (last ? '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="6" fill="var(--accent)"></circle>' : '') + '</svg>';
}
function miniSpark(a) {
  const s = series(a), pts = [];
  s.forEach((v, i) => { if (v != null) pts.push((4 + i * 13.3).toFixed(1) + ',' + (28 - (v - 1) / 4 * 24).toFixed(1)); });
  return '<svg width="84" height="32" viewBox="0 0 84 32" aria-hidden="true">' + (pts.length > 2 ? '<polyline class="ln-a" points="' + pts.join(' ') + '" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>' : '') + '</svg>';
}
function dualChart(a) {
  const s = series(a), w = [];
  s.forEach((v, i) => { if (v != null) w.push(xAt(i) + ',' + (90 - (v - 1) / 4 * 70).toFixed(1)); });
  const t = []; (a.tsb || []).forEach((v, i) => { const cv = Math.max(-40, Math.min(20, v)); t.push(xAt(i) + ',' + (90 - (cv + 40) / 60 * 70).toFixed(1)); });
  return '<svg width="320" height="104" viewBox="0 0 300 104" role="img" aria-label="Bienestar de los últimos siete días"><line class="ln-g" x1="12" y1="90" x2="288" y2="90" stroke-width="1"></line><line class="ln-g" x1="12" y1="55" x2="288" y2="55" stroke-width="1" stroke-dasharray="3 4"></line><line class="ln-g" x1="12" y1="20" x2="288" y2="20" stroke-width="1" stroke-dasharray="3 4"></line>'
    + (t.length > 1 ? '<polyline class="ln-i" points="' + t.join(' ') + '" fill="none" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round" stroke-linejoin="round"></polyline>' : '')
    + (w.length > 1 ? '<polyline class="ln-a" points="' + w.join(' ') + '" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>' : '') + '</svg>';
}
const dualLegend = () => '<div class="row g16 wrap soft" style="font-size:13px;margin-top:4px"><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--accent)"></i>Bienestar</span><span class="row g6"><svg width="18" height="4" viewBox="0 0 18 4" aria-hidden="true"><line x1="1" y1="2" x2="17" y2="2" stroke="var(--info)" stroke-width="3" stroke-dasharray="4 3" stroke-linecap="round"></line></svg>Forma (aptitud − fatiga)</span></div>';
const icon = (id, size, color) => ph(ICONS[id], size, color);
const crt = () => ph('caret-right', 18).replace('<svg ', '<svg style="vertical-align:-3px" ');
const dcar = () => '<span class="dcar">' + ph('caret-down', 16) + '</span>';
const infoIcon = () => ph('info', 22, 'var(--info)').replace('<svg ', '<svg style="flex:none;margin-top:1px" ');
const arrow = () => ph('arrow-right', 22);
const check = (color, size) => ph('check', size, color);

/* ---------- Piezas de interfaz ---------- */
/* Opciones de texto plano: sin marcos; la profundidad aparece solo en la elegida.
   El verde solo se usa en categorías neutras; en respuestas con valencia (sueño, piernas, estrés, molestia...) la elegida se hunde sin color. */
const GDURS = ['-30', '30-60', '60-90', '+90'];
const GREENG = ['heat', 'hardType', 'hardDur', 'side', 'gdur', 'odur', 'gfocus', 'carbs', 'bkind'];
const autoCols = (arr) => { const n = arr.length, long = arr.some((l) => String(l).length > 9); return n <= 3 ? n : (n === 4 ? (long ? 2 : 4) : 3); };
function plainOpts(g, arr, sel, label, cols, valFn, neu, act, isOn) {
  return '<div class="po po' + cols + (neu ? ' neu' : '') + '" role="group" aria-label="' + esc(label) + '">' + arr.map((l, i) => {
    const v = valFn ? valFn(i, l) : i;
    return '<button type="button" class="pob" data-a="' + (act || 'set') + '" data-g="' + g + '" data-v="' + esc(v) + '" aria-pressed="' + (isOn ? isOn(l, v) : sel === v) + '">' + esc(l) + '</button>';
  }).join('') + '</div>';
}
const chips = (g, arr, sel, label, valFn) => plainOpts(g, arr, sel, label, autoCols(arr), valFn, GREENG.indexOf(g) < 0);
const multiChips = (g, arr, sel, label) => plainOpts(g, arr, null, label, autoCols(arr), (i, l) => l, true, 'multi', (l, v) => (sel || []).indexOf(l) >= 0);
const NAVIC = { planificar: 'flag', perfil: 'user', hoy: 'calendar-check', ruta: 'path', cabina: 'gauge', datos: 'chart-line-up', guia: 'book-open', ajustes: 'gear-six' };
const TABLBL = { guia: 'Guía', planificar: 'Planificar' };
const sharesKm = () => !(ST.profile && ST.profile.shareKm === false);
const coachMode = () => { if (!isCoach()) return false; if (UI.mode == null) { let v = null; try { v = localStorage.getItem('camino.mode'); } catch (e) { /* sin almacenamiento */ } UI.mode = v === 'atleta' ? 'atleta' : 'coach'; } return UI.mode === 'coach'; };
const ATABS = ['hoy', 'datos', 'ruta', 'perfil', 'ajustes', 'guia'], ATABS_P = ['hoy', 'datos', 'ruta', 'planificar', 'perfil', 'ajustes', 'guia'];
/* Planificar y modo en vivo: solo el coach principal y los atletas a quienes él lo habilita (users/{id}.features.planificar). */
const plannerOn = () => !!(ST.profile && (ST.profile.role === 'coach' || (ST.profile.features && ST.profile.features.planificar === true)));
const atabs = () => (plannerOn() ? ATABS_P : ATABS);
const tabsIds = () => (isCoach() ? (coachMode() ? (UI.asId ? ['cabina', 'hoy', 'datos', 'ruta', 'ajustes', 'guia'] : ['cabina', 'ajustes', 'guia']) : atabs()) : atabs());
/* La Guía de los atletas vive dentro de Ajustes (hide): sigue siendo una ruta válida, pero no ocupa lugar en la barra. */
const tabs = () => { const ids = tabsIds(), ath = ids === ATABS || ids === ATABS_P; return ids.map((id) => ({ id, label: TABLBL[id] || cap(id), ic: NAVIC[id], hide: ath && id === 'guia' })); };
const navHtml = () => '<div class="inner">' + tabs().filter((t) => !t.hide).map((t) => '<a href="#' + t.id + '"' + (UI.view === t.id || (t.id === 'ajustes' && UI.view === 'guia' && tabs().some((x) => x.hide)) ? ' aria-current="page"' : '') + '>' + ph(t.ic, 26, 'currentColor', UI.view === t.id) + '<span>' + t.label + '</span></a>').join('') + '</div>';
/* Logo segun el fondo: ciclista blanco sobre fondos oscuros, negro sobre fondos claros. */
function logoSrc() {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) { const n = parseInt(m[1], 16), l = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; return l < 0.45 ? './logo-blanco.svg' : './logo-negro.svg'; }
  } catch (e) { /* sin estilos: usa el logo negro */ }
  return './logo-negro.svg';
}

/* ---------- Mensajes: globo con el número de pendientes ---------- */
const seenKey = () => 'camino.seen.' + (ST.user ? ST.user.uid : '');
function seenAt() {
  let v = null; try { v = localStorage.getItem(seenKey()); } catch (e) { /* sin almacenamiento */ }
  if (v == null) { v = String(Date.now()); try { localStorage.setItem(seenKey(), v); } catch (e) { /* sin almacenamiento */ } }
  return Number(v) || 0;
}
const unreadNotes = () => { const t = seenAt(); return (ST.myNotes || []).filter((n) => Number(n.at) > t); };
const replyQueue = () => athleteObjs().filter((a) => needsReply(a));
const unreadFbk = () => (ST.fbk || []).filter((x) => !x.read);
/* Propuestas de coaches de apoyo: el coach principal ve las abiertas; quien propuso ve las ya resueltas que aún no abrió. */
/* Mensajes entre coaches: un hilo por coach de apoyo (id del hilo = uid del coach de apoyo). */
const chatKey = (vid) => 'camino.chat.' + (ST.user ? ST.user.uid : '') + '.' + vid;
function chatSeen(vid) { let v = null; try { v = localStorage.getItem(chatKey(vid)); } catch (e) { /* sin almacenamiento */ } return Number(v) || 0; }
function chatMark(vid) { const mx = Math.max(Date.now(), ...((ST.chat || {})[vid] || []).map((m) => Number(m.ts) || 0)); try { localStorage.setItem(chatKey(vid), String(mx)); } catch (e) { /* sin almacenamiento */ } }
const chatRows = (vid) => ((ST.chat || {})[vid] || []).slice().sort((a, b) => Number(a.ts) - Number(b.ts));
const chatUnread = (vid) => { const t = chatSeen(vid), me = ST.user ? ST.user.uid : ''; return chatRows(vid).filter((m) => m.by !== me && Number(m.ts) > t).length; };
const chatVids = () => (isOwner() ? viewersList().map((v) => v.id) : (isViewer() && ST.user ? [ST.user.uid] : []));
const chatBell = () => chatVids().reduce((n, v) => n + chatUnread(v), 0);
function chatThread(vid, who) {
  const L = chatRows(vid).slice(-15), me = ST.user ? ST.user.uid : '', draft = (UI.chatDraft || {})[vid] || '';
  if (UI.chatOpen === vid) chatMark(vid);
  return '<div class="col g10" id="chat-' + esc(vid) + '">' + (L.length ? '<div class="col g8" role="log" aria-label="Mensajes con ' + esc(who) + '">' + L.map((m) => { const mine = m.by === me; return '<div class="col g4" style="align-self:' + (mine ? 'flex-end' : 'flex-start') + ';max-width:88%;background:' + (mine ? 'var(--accent-soft)' : 'var(--surface2)') + ';border-radius:14px;padding:10px 12px"><div class="muted" style="font-size:12px">' + (mine ? 'Tú' : esc(firstName(m.byName || who))) + ' · ' + relTime(m.ts) + '</div><div style="white-space:pre-wrap;overflow-wrap:anywhere">' + esc(m.text) + '</div></div>'; }).join('') + '</div>' : '<p class="soft" style="font-size:14px">Aún no hay mensajes. Escribe el primero.</p>')
    + '<label for="chatText-' + esc(vid) + '" class="muted" style="font-size:13px">Mensaje para ' + esc(who) + '</label><textarea id="chatText-' + esc(vid) + '" data-vid="' + esc(vid) + '" maxlength="600" rows="2" placeholder="Escribe aquí">' + esc(draft) + '</textarea><button type="button" class="btn primary" data-a="chatSend" data-v="' + esc(vid) + '" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '><span>Enviar</span></button></div>';
}
function chatCard(vid, who, id) {
  const n = chatUnread(vid), open = UI.chatOpen === vid;
  return '<section class="card col g12" id="' + id + '" aria-label="Mensajes con ' + esc(who) + '"' + (n ? ' style="border:1.5px solid var(--accent)"' : '') + '><button type="button" class="row between g12" data-a="chatTgl" data-v="' + esc(vid) + '" aria-expanded="' + open + '" style="text-align:left;min-height:48px;font:inherit;color:inherit;background:transparent;border:0;padding:0"><span class="col g4"><span class="eyebrow">Mensajes con ' + esc(who) + '</span><span style="font-weight:600">' + (n ? '<span style="color:var(--accent)">' + n + (n === 1 ? ' mensaje nuevo' : ' mensajes nuevos') + '</span>' : (chatRows(vid).length ? 'Ver conversación' : 'Escribir un mensaje')) + '</span></span>' + dcar() + '</button>' + (open ? chatThread(vid, who) : '') + '</section>';
}
const openPropsN = () => (ST.props || []).filter((x) => x.status === 'open');
const newDecisions = () => { const t = seenAt(); return (ST.props || []).filter((x) => x.status !== 'open' && Number(x.decidedAt) > t); };
function bellCount() {
  if (!ST.profile || !ST.user) return 0;
  return isCoach() ? replyQueue().length + unreadFbk().length + (isOwner() ? openPropsN().length : (isViewer() ? newDecisions().length : 0)) + chatBell() : unreadNotes().length;
}
const bellHtml = () => {
  const n = bellCount();
  return '<button type="button" class="bell" data-a="inbox" aria-label="Mensajes' + (n ? ': ' + n + (n === 1 ? ' pendiente' : ' pendientes') : ': sin pendientes') + '">' + ph('bell', 22) + (n ? '<span class="bellb" aria-hidden="true">' + (n > 9 ? '9+' : n) + '</span>' : '') + '</button>';
};
function inboxHtml() {
  let out = '<div class="inner"><div class="stack"><div class="row between"><div class="col g4"><div class="muted" style="font-size:14px">' + (isCoach() ? 'Pendientes por revisar' : 'De tu coach') + '</div><h1 class="title">Mensajes</h1></div><button type="button" class="x" data-a="inboxClose" style="color:var(--text);min-height:44px;border:0;background:transparent;font-weight:600">Cerrar</button></div>';
  if (isCoach()) {
    const cv = chatVids().filter((v) => chatUnread(v) > 0), q = replyQueue(), f = unreadFbk(), po = isOwner() ? openPropsN() : [], dec = isViewer() ? (ST.props || []).filter((x) => x.status !== 'open').sort((a, b) => Number(b.decidedAt) - Number(a.decidedAt)).slice(0, 8) : [], tS = UI.inboxSeen || 0;
    if (!q.length && !f.length && !po.length && !dec.length && !cv.length) out += '<section class="card"><p class="soft">Todo al día. No tienes atletas esperando respuesta ni comentarios nuevos.</p></section>';
    if (cv.length) out += '<section class="col g10"><div class="eyebrow">Mensajes entre coaches · ' + cv.reduce((n, v) => n + chatUnread(v), 0) + '</div>' + cv.map((v) => { const w = isOwner() ? ((ST.athletes.find((r) => r.id === v) || {}).name || 'Coach de apoyo') : 'el coach principal', last = chatRows(v).filter((m) => m.by !== (ST.user && ST.user.uid)).slice(-1)[0]; return '<button type="button" class="card row between g12" data-a="inboxChat" data-v="' + esc(v) + '" style="text-align:left;min-height:64px"><span class="col"><b>' + (isOwner() ? esc(w) : 'Tu coach principal') + '</b><span class="muted" style="font-size:13px">' + esc(String((last || {}).text || '').slice(0, 70)) + '</span></span><span class="muted" aria-hidden="true">' + crt() + '</span></button>'; }).join('') + '</section>';
    if (po.length) out += '<section class="col g10"><div class="eyebrow">Propuestas por autorizar · ' + po.length + '</div><button type="button" class="card row between g12" data-a="inboxProp" style="text-align:left;min-height:64px"><span class="col"><b>' + po.length + (po.length === 1 ? ' propuesta nueva' : ' propuestas nuevas') + '</b><span class="muted" style="font-size:13px">De ' + esc(po[0].byName || 'un coach de apoyo') + ': ' + esc(String(po[0].name || '').slice(0, 60)) + '</span></span><span class="muted" aria-hidden="true">' + crt() + '</span></button></section>';
    if (dec.length) out += '<section class="col g10"><div class="eyebrow">Respuestas a tus propuestas</div>' + dec.map((x) => '<div class="card col g6" style="' + (Number(x.decidedAt) > tS ? 'border:1.5px solid var(--accent)' : '') + '"><div class="eyebrow">' + (Number(x.decidedAt) > tS ? '<span style="color:var(--accent)">Nuevo</span> · ' : '') + relTime(x.decidedAt) + '</div><p class="soft" style="font-size:16px">' + (x.kind === 'athlete' ? 'Atleta' : 'Grupo') + ' «' + esc(x.name) + '»: <b>' + (x.status === 'ok' ? 'autorizado por el coach principal' : 'no autorizado') + '</b></p></div>').join('') + '</section>';
    if (q.length) out += '<section class="col g10"><div class="eyebrow">Atletas por responder · ' + q.length + '</div>' + q.map((a) => '<button type="button" class="card row between g12" data-a="inboxGo" data-v="' + esc(a.id) + '" style="text-align:left;min-height:64px"><span class="col"><b>' + esc(a.name || 'Atleta') + '</b><span class="muted" style="font-size:13px">' + esc(statusOf(a).k === 'warn' ? 'Necesita atención' : 'Check-in sin respuesta') + '</span></span><span class="muted" aria-hidden="true">' + crt() + '</span></button>').join('') + '</section>';
    if (f.length) out += '<section class="col g10"><div class="eyebrow">Ideas y consultas nuevas · ' + f.length + '</div><button type="button" class="card row between g12" data-a="inboxFb" style="text-align:left;min-height:64px"><span class="col"><b>' + f.length + (f.length === 1 ? ' mensaje nuevo' : ' mensajes nuevos') + '</b><span class="muted" style="font-size:13px">' + esc(String(f[0].text).slice(0, 70)) + '</span></span><span class="muted" aria-hidden="true">' + crt() + '</span></button></section>';
  } else {
    const L = (ST.myNotes || []).slice().sort((a, b) => Number(b.at) - Number(a.at)).slice(0, 15), t = UI.inboxSeen || 0;
    if (!L.length) out += '<section class="card"><p class="soft">Aún no tienes mensajes de tu coach. Cuando te escriba, aparecerá aquí con un número en la campana.</p></section>';
    else out += '<section class="col g10">' + L.map((n) => '<div class="card col g6" style="' + (Number(n.at) > t ? 'border:1.5px solid var(--accent)' : '') + '"><div class="eyebrow">' + (Number(n.at) > t ? '<span style="color:var(--accent)">Nuevo</span> · ' : '') + relTime(n.at) + '</div><p class="soft" style="font-size:16px;white-space:pre-wrap">' + esc(n.text) + '</p></div>').join('') + '</section>';
  }
  return out + '</div></div>';
}
/* Logos de equipo: SVG negro sobre transparente; en fondos oscuros se invierte a blanco, y sobre color se usa blanco. Para sumar otro equipo, agrega su entrada aqui. */
const demoLink = (r) => location.origin + location.pathname + (r === 'real' ? '' : '?demo=' + (r === 'coach' ? 'coach' : 'atleta'));
const TEAM_LOGO = { grnt: { name: 'GRANITO', full: './grnt-logo.svg', fullR: 780.16 / 664.3, mark: './grnt-mark.svg', markR: 678.1 / 507.11 } };
const bgDark = () => logoSrc() === './logo-blanco.svg';
function teamLogo(team, kind, h, onColor) {
  const L = TEAM_LOGO[team]; if (!L) return '';
  const r = kind === 'full' ? L.fullR : L.markR, src = kind === 'full' ? L.full : L.mark, cls = 'tlogo' + (onColor ? ' tw' : (bgDark() ? ' tinv' : ''));
  return '<img class="' + cls + '" src="' + src + '" alt="Equipo ' + L.name + '" height="' + h + '" width="' + Math.round(h * r) + '" style="height:' + h + 'px;width:auto">';
}
function topHtml() {
  let pills = '';
  if (DEMO) pills += '<span class="pill">Demo</span>';
  if (ST.profile) {
    const t = myTeam();
    if (t && !TEAM_LOGO[t]) pills += '<span class="pill">' + TEAMS[t] + '</span>';
    if (isViewer() && coachMode()) pills += '<span class="pill role">' + (canEdit() ? 'Coach de apoyo' : 'Solo lectura') + '</span>';
    if (isCoach()) { const cm = coachMode(); pills += '<div class="modesw" role="group" aria-label="Cambiar de vista"><button type="button" data-a="mode" data-v="coach" aria-pressed="' + cm + '">Coach</button><button type="button" data-a="mode" data-v="atleta" aria-pressed="' + !cm + '">Atleta</button></div>'; }
    else pills += '<span class="pill role">Atleta</span>';
    pills += bellHtml();
    if (t && TEAM_LOGO[t] && UI.view !== 'ruta') pills += teamLogo(t, 'mark', 30);
  }
  return '<div class="inner"><span class="brand row g8"><img class="brand-logo" src="' + logoSrc() + '" alt="" width="30" height="30">Camino</span><span class="row g8">' + pills + '</span></div>';
}
const head = (sub, title) => '<div class="col g4"><div class="muted" style="font-size:14px">' + esc(sub) + '</div><h1 class="title">' + esc(title) + '</h1></div>';
const msgBanner = () => (UI.msg ? '<div class="banner toast" role="status" aria-live="polite">' + infoIcon() + '<span>' + esc(UI.msg) + '</span></div>' : '');

/* ---------- Vista: ingreso y carga ---------- */
function viewLogin() {
  return '<div class="inner"><div class="login"><div class="logo" aria-hidden="true"><img src="' + logoSrc() + '" alt="" width="132" height="132"></div>'
    + '<div class="col g8"><h1 class="title" style="font-size:52px">Camino</h1><p class="soft" style="font-size:18px">Tu camino recorrido, día a día. Check-in corto, plan claro y tu coach al tanto.</p></div>'
    + msgBanner()
    + (DEMO
      ? '<div class="col g10"><button type="button" class="btn primary" data-a="login" data-v="atleta"><span>Entrar como atleta (demo)</span>' + arrow() + '</button><button type="button" class="btn" style="background:var(--surface)" data-a="login" data-v="coach"><span>Entrar como coach (demo)</span>' + arrow() + '</button><p class="muted" style="font-size:13px">Modo demostración: datos ficticios guardados solo en este navegador.</p></div>'
      : '<div class="col g10"><button type="button" class="btn google" data-a="login"' + (UI.busy ? ' disabled' : '') + '><span>Continuar con Google</span></button><p class="muted" style="font-size:13px">Tu coach ve tus check-ins y molestias. Tu equipo ve solo kilómetros, insignias e hitos.</p></div>')
    + '</div></div>';
}
const viewLoading = () => '<div class="inner"><div class="login"><p class="muted">Cargando…</p>' + msgBanner() + (ST.user ? '<button type="button" class="btn ghost" data-a="logout" style="justify-content:center;border:1.5px solid var(--line);margin-top:14px">Cerrar sesión</button>' : '') + '</div></div>';

/* ---------- Vista: Hoy ---------- */
function viewHoy() {
  const a = meA(), l = latest(a), t = new Date(), todayC = on(a, off(0));
  const sub = cap(WD[t.getDay()]) + ' ' + t.getDate() + ' de ' + MONTHS[t.getMonth()];
  const sc = l ? score(l) : null, b = band(sc), pct = sc == null ? 0 : sc, circ = 339.292, dash = (pct / 100 * circ).toFixed(1);
  const basis = !l ? '' : (l.date === off(0) ? 'según tu check-in de hoy' : (l.date === off(-1) ? 'según tu check-in de ayer' : 'según tu último check-in'));
  const g = goalInfo();
  let out = '<div class="inner"><div class="stack">' + head(sub, 'Hola, ' + a.first) + msgBanner();
  if (ST.profile && ST.profile.pending) out += '<div class="banner" role="note">' + infoIcon() + '<span>Tu coach todavía no te asigna a un equipo. Puedes hacer tus check-ins desde ya; él los verá cuando te acepte.</span></div>';

  out += tocaCard(a, todayC);
  out += '<section class="card row g16" aria-label="Estado de hoy"><div style="position:relative;width:128px;height:128px;flex:none"><svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="54" fill="none" style="stroke:var(--track)" stroke-width="12"></circle><circle class="ring-fg" cx="64" cy="64" r="54" fill="none" style="stroke:' + b.color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + dash + ' ' + circ + '" transform="rotate(-90 64 64)"></circle></svg><div class="col" style="position:absolute;inset:0;align-items:center;justify-content:center"><span class="num" style="font-size:50px">' + (sc == null ? '–' : sc) + '</span><span class="muted" style="font-size:12px">de 100</span></div></div>'
    + '<div class="col g6 grow"><div class="eyebrow">Estado de hoy</div><div class="h2" style="color:' + b.color + '">' + b.label + '</div>'
    + (l ? '<p class="soft" style="font-size:14px">' + esc(summaryText(l, b)) + '</p><p class="muted" style="font-size:12px">' + basis + '</p>' : '<p class="soft" style="font-size:14px">Haz tu primer check-in para ver tu estado.</p>') + '</div></section>';

  let segs = ''; const total = Math.min(Math.max(g ? g.weeks : 1, 1), 10);
  if (g && !g.done) for (let i = 0; i < total; i++) { const fromEnd = total - 1 - i, col = i === 0 ? 'var(--accent)' : (fromEnd < 2 ? 'var(--accent2)' : 'var(--track)'); segs += '<i style="background:' + col + '"></i>'; }
  if (!g) out += '<section class="card" aria-label="Próxima meta"><div class="eyebrow">Próxima meta</div><p class="soft" style="margin-top:8px">Tu coach cargará aquí tu próxima meta y tu plan de entrenamiento.</p></section>';
  else {
    const pls = phaseList(g), curP = pls.filter((x) => x.st === 'now')[0], nxtP = pls.filter((x) => x.st === 'next')[0];
    out += '<section class="card" aria-label="Próxima meta"><div class="eyebrow">Próxima meta</div>' + (g.done ? '<div class="h2" style="margin-top:8px">' + esc(g.name) + ': ¡lo lograron!</div>'
      : '<div class="row g16" style="align-items:flex-end;margin-top:8px"><div class="row g6" style="align-items:baseline;flex:none"><span class="num" style="font-size:68px;color:var(--accent)">' + g.days + '</span><span class="muted">' + (g.days === 1 ? 'día' : 'días') + '</span></div><div class="col" style="padding-bottom:4px;min-width:0"><div style="font-weight:600;line-height:1.3">' + esc(g.name) + '</div><div class="muted" style="font-size:13px">' + esc(g.dateText) + ' · ' + (g.days <= 7 ? 'esta semana' : g.weeks + ' semanas') + '</div></div></div><div class="seg" style="margin-top:16px" aria-hidden="true">' + segs + '</div><div class="muted" style="font-size:12px;margin-top:6px">Bloque actual: ' + esc(curP ? curP.n : 'Meta cumplida') + (nxtP ? ' · luego ' + esc(nxtP.n) : '') + '</div>') + '</section>';
  }

  const fiH = formaInfo(ST.myHist); if (fiH) out += formaCard(fiH, true);
  out += recentCard(ST.myHist, 3);
  const wk = weekInfo(a); let cols = '';
  wk.days.forEach((d) => {
    const ph = d.p ? Math.min(64, Math.max(8, Math.round((d.p.min || 30) / 180 * 64))) : 4, dh = d.done && d.p ? ph : 0, bd = d.p ? (d.today ? '1.5px dashed var(--accent)' : '1.5px dashed var(--muted)') : '1.5px solid var(--line)';
    cols += '<div class="col" data-a="wkOpen" data-v="' + d.date + '" style="flex:1;align-items:center;gap:6px"><div style="position:relative;width:100%;height:64px" aria-hidden="true"><div style="position:absolute;left:0;right:0;bottom:0;border-radius:8px;height:' + ph + 'px;border:' + bd + '"></div><div style="position:absolute;left:0;right:0;bottom:0;border-radius:8px;background:var(--accent);height:' + dh + 'px"></div></div><span style="font-size:12px;font-weight:600;color:' + (d.today ? 'var(--accent)' : 'var(--muted)') + '">' + WDL[d.wd] + '</span></div>';
  });
  const pToday = planFor(off(0)); let wkLine;
  if (todayC && todayC.type === 'actividad') wkLine = 'Hoy registraste ' + (todayC.activity ? todayC.activity.name.toLowerCase() : 'tu actividad') + '. Vas al día con el plan.';
  else if (pToday) wkLine = 'Llevas ' + wk.done + ' de ' + wk.planned + ' sesiones de la semana.';
  else wkLine = 'Hoy es día de descanso. Llevas ' + wk.done + ' de ' + wk.planned + ' sesiones de la semana.';
  const nTxt = dayNote(off(0));
  out += '<section class="card wkcard" role="button" tabindex="0" data-a="wkOpen" aria-label="Tu semana: toca para ver el detalle del plan"><div class="row between"><div class="eyebrow">Tu semana</div><div class="muted" style="font-size:13px">' + (DEMO && !ST.myPlan ? 'Plan de ejemplo y lo hecho' : 'Tu plan y lo hecho') + '</div></div><div class="row g8" style="align-items:flex-start;margin-top:14px">' + cols + '</div><p class="soft" style="margin-top:14px;font-size:15px">' + esc(wkLine) + '</p><div class="wkmore">Ver el detalle de la semana <span aria-hidden="true">' + crt() + '</span></div></section>';

  const n = lastNote(a);
  if (n) { const age = Math.floor((Date.now() - Number(n.at)) / 86400000), old = age >= 7; out += '<section class="card' + (old ? ' oldnote' : '') + '" aria-label="Nota de tu coach"><div class="eyebrow">Nota de tu coach · ' + relTime(n.at) + '</div><p class="soft" style="margin-top:8px">“' + esc(n.text) + '”</p>' + (old ? '<p class="muted" style="font-size:13px;margin-top:8px">Es una nota antigua (hace ' + age + ' días): puede no reflejar tu plan de ahora.</p>' : '') + '</section>'; }
  out += dayCard(a, todayC);
  return out + '</div></div>';
}

/* ---------- Tarjeta "Tu día" (Hoy) ---------- */
/* Tarjeta "Hoy toca": la sesión del plan primero; si el check-in dice descanso y el plan pide entrenar, lo pregunta en vez de mostrar dos mensajes opuestos. */
function tocaCard(a, c) {
  const p = planFor(off(0)); if (!p) return '';
  const did = !!(c && c.type === 'actividad'), skip = !!(c && c.skip), rested = !!(c && c.type === 'descanso' && !c.skip);
  const nt = dayNote(off(0));
  let out = '<section class="card col g12" aria-label="Hoy toca"><div class="row between g8"><div class="eyebrow">Hoy toca</div>' + (did ? '<span class="dbadge">Hecho</span>' : '') + '</div><div class="h2" style="font-size:26px">' + esc(p.name) + '</div><div class="muted" style="font-size:14px">' + esc((p.min ? minText(p.min) : '') + (p.km ? (p.min ? ' · ' : '') + p.km + ' km' : '')) + '</div>' + (nt ? '<p class="soft" style="font-size:15px">' + esc(nt) + '</p>' : '');
  if (rested && !(c && c.restOk)) out += '<div class="conflict" role="group" aria-label="Tu plan y tu check-in no coinciden"><p style="font-weight:600">Tu check-in dice descanso, pero tu plan marcaba esta sesión. ¿Qué pasó?</p><div class="row g8 wrap"><button type="button" class="chip" data-a="kind" data-v="post" data-s="1">Sí la hice</button><button type="button" class="chip" data-a="restOk" data-v="' + off(0) + '"' + (UI.busy ? ' disabled' : '') + '>Descansé, no la hice</button></div></div>';
  else if (rested) out += '<p class="muted" style="font-size:13px">Confirmaste que hoy descansaste, aunque el plan marcaba entrenar. Tu coach lo ve.</p>';
  else if (skip) out += '<p class="muted" style="font-size:13px">Hoy no entrenaste. Lo ve tu coach.</p>';
  return out + '</section>';
}
function dayCard(a, c) {
  const hasD = !!(c && c.mood != null), S1 = sessOf(c, 1), S2 = sessOf(c, 2), hasP = !!S1, isSkip = !!(c && c.skip), isRest = !!(c && c.type === 'descanso' && !c.skip), p = planFor(off(0));
  const complete = hasD && (hasP || isSkip || isRest), st = streak(a);
  const ring = (done, ic) => '<span class="dring ' + (done ? 'done' : 'todo') + '" aria-hidden="true">' + (done ? check('currentColor', 22) : ic) + '</span>';
  let dsum = '';
  if (hasD) { const bits = []; if (c.sleepH != null) bits.push('Dormiste ' + String(at(SLEEPH, c.sleepH)).toLowerCase()); if (c.legs != null) bits.push('piernas ' + String(at(LEGS, c.legs)).toLowerCase()); if (!bits.length) bits.push('Ánimo: ' + String(at(MOODS, c.mood - 1)).toLowerCase()); dsum = bits.join(' · '); }
  let out = '<section class="card dcard" aria-label="Tu día"><div class="row between"><div class="eyebrow">Tu día</div>' + (complete ? '<span class="dbadge">Día completo</span>' : (!hasP ? '<button type="button" class="link" data-a="alt" style="min-height:44px;font-size:14px">Hoy fue distinto</button>' : '')) + '</div><div class="dnodes">';
  // nodo 1
  out += '<div class="dnode ' + (hasP || true ? 'dl' : '') + '">' + ring(hasD, kIcon('otra', 22).replace('<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.6l1.1-6L3.4 9.4l6-.8z"></path>', '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"></path>')) + '<div class="col grow g4" style="min-width:0"><div class="row between g8"><span class="dt1">Estado del día</span>' + (hasD ? '<button type="button" class="dedit" data-a="kind" data-v="diario" aria-label="Editar el estado del día">Editar</button>' : '') + '</div>'
    + (hasD ? '<span class="dt2">' + esc(dsum) + '</span>' : '<span class="dt2">Sueño, piernas, estrés y ánimo · 1 minuto</span><button type="button" class="btn primary dbtn" data-a="kind" data-v="diario"><span>Hacer mi estado del día</span>' + arrow() + '</button>') + '</div></div>';
  // nodo 2
  out += '<div class="dnode">' + ring(hasP || isSkip || isRest, kIcon('gravel', 22)) + '<div class="col grow g4" style="min-width:0"><span class="dt1">Sensaciones post-entreno</span>';
  [S1, S2].forEach((S, i) => { if (!S) return; const L = sessLine(S, a); out += '<div class="dsess"><span class="dmini">' + kIcon(L.k === 'gym' ? 'gym' : (BKINDS[L.k] ? 'gravel' : 'otra'), 20) + '</span><span class="col grow" style="min-width:0"><span class="dst">' + L.title + '</span>' + (L.sub ? '<span class="dt2">' + esc(L.sub) + '</span>' : '') + '</span><button type="button" class="dedit" data-a="kind" data-v="post" data-s="' + (i + 1) + '" aria-label="Editar sesión ' + (i + 1) + '">Editar</button></div>'; });
  if (isSkip) out += '<span class="dt2">Hoy no entrenaste' + ((c.skip.items || []).length ? ': ' + esc(c.skip.items.join(', ').toLowerCase()) : '') + '</span>';
  else if (isRest) out += '<span class="dt2">Hoy descansas. También suma a tu constancia.</span>';
  if (!hasP) out += '<span class="dt2">' + (p ? 'Del plan: ' + esc(planDesc(p)) : 'Cuéntalo cuando termines tu salida o tu gym') + '</span><button type="button" class="btn ' + (hasD ? 'primary' : 'outline') + ' dbtn" data-a="kind" data-v="post" data-s="1"><span>' + (isSkip || isRest ? 'Registrar una sesión' : 'Registrar mi sesión') + '</span>' + arrow() + '</button>';
  else if (!S2) out += '<button type="button" class="daddl" data-a="kind" data-v="post" data-s="2">+ Agregar otra sesión</button>';
  out += '</div></div></div></section>';
  out += '<div class="row between g12" style="padding:0 6px;align-items:center"><span class="muted" style="font-size:14px">Racha: ' + st.n + (st.n === 1 ? ' día' : ' días') + '</span>' + (c ? '<button type="button" class="link" data-a="feedback" style="min-height:44px;font-size:14px;font-weight:700">Mi resumen</button>' : '') + '</div>';
  return out;
}

/* ---------- Vista: Ruta ---------- */
function teamCard(team, label) {
  const tt = teamTotals(team), pct = Math.min(100, Math.round(tt.km / tt.goal * 100));
  return '<section class="card" aria-label="Meta del equipo"><div class="row between g12" style="align-items:center"><div class="col g4"><div class="eyebrow">Meta del mes · ' + label + '</div><div class="muted" style="font-size:13px">' + tt.members + (tt.members === 1 ? ' atleta' : ' atletas') + '</div></div>' + teamLogo(team, 'full', 56) + '</div>'
    + '<div class="row g8" style="align-items:baseline;margin-top:10px"><span class="num" style="font-size:56px;color:var(--good)">' + tt.km.toLocaleString('es-CL') + '</span><span class="muted">de ' + tt.goal.toLocaleString('es-CL') + ' km</span></div><div class="bar" style="margin-top:12px" aria-hidden="true"><i style="width:' + pct + '%;background:var(--good)"></i></div><p class="soft" style="margin-top:12px;font-size:14px">Van al ' + pct + '%. Cada salida suma, también las suaves.</p>'
    + (tt.hito ? '<div class="eyebrow" style="margin-top:14px">Hito de la semana</div><p style="margin-top:6px">' + esc(tt.hito) + '</p>' : '') + '</section>';
}
function viewRuta() {
  const a = meA(), g = goalInfo();
  let out = '<div class="inner"><div class="stack">' + head(g ? 'Hacia ' + g.name : 'Tu camino', 'Tu ruta') + msgBanner();
  if (!g) out += '<section class="card" aria-label="Fases del plan"><div class="eyebrow">Fases del plan</div><p class="soft" style="margin-top:8px">Tu coach aún no carga tu plan. Cuando lo haga, verás aquí cada fase hasta tu meta.</p></section>';
  else {
    const ph = phaseList(g);
    out += '<section class="card" aria-label="Fases del plan" style="padding-bottom:8px"><div class="eyebrow" style="margin-bottom:14px">Fases del plan</div>';
    ph.forEach((p, i) => {
      const nodeBd = p.st === 'done' || p.st === 'now' ? 'var(--accent)' : (p.st === 'goal' ? 'var(--good)' : 'var(--muted)'), nodeBg = p.st === 'done' ? 'var(--accent)' : 'var(--bg)';
      const inner = p.st === 'done' ? check('var(--on-accent)', 14) : (p.st === 'now' ? '<i style="width:8px;height:8px;border-radius:50%;background:var(--accent);display:block"></i>' : '');
      out += '<div class="row g14" style="align-items:stretch"><div class="col" style="align-items:center;width:24px;flex:none"><div class="row" style="width:24px;height:24px;border-radius:50%;border:2px solid ' + nodeBd + ';background:' + nodeBg + ';justify-content:center;flex:none">' + inner + '</div>' + (i < ph.length - 1 ? '<div style="width:2px;flex:1;min-height:18px;background:' + (p.st === 'done' ? 'var(--accent)' : 'var(--line)') + '"></div>' : '') + '</div><div style="padding-bottom:18px;min-width:0"><div class="row g8 wrap"><span class="h3" style="color:' + (p.st === 'goal' ? 'var(--good)' : 'var(--text)') + '">' + esc(p.n) + '</span>' + (p.st === 'now' ? '<span class="tag">Estás aquí</span>' : '') + '</div><div class="muted" style="font-size:14px">' + esc(p.s) + '</div></div></div>';
    });
    out += '</section>';
  }
  out += '<section class="card col g12" aria-label="Resumen de tu bloque" style="background:var(--accent);color:var(--on-accent)"><div class="eyebrow" style="color:var(--on-accent)">Tu camino recorrido</div><div class="h2" style="font-size:34px">Mira lo que has construido</div><button type="button" data-a="story" data-v="0" class="btn" style="width:auto;min-height:48px;font-size:16px;background:var(--on-accent);color:var(--accent);align-self:flex-start">Ver mi resumen</button></section>';
  if (isCoach()) out += teamCard('grnt', 'GRNT') + teamCard('zn', 'ZN');
  else if (myTeam()) out += teamCard(myTeam(), TEAMS[myTeam()]);
  else out += '<section class="card"><div class="eyebrow">Equipo</div><p class="soft" style="margin-top:8px">Cuando tu coach te asigne a GRNT o ZN verás aquí los kilómetros del equipo.</p></section>';
  const bs = badges(a);
  out += '<section class="card" aria-label="Insignias de constancia"><div class="eyebrow">Insignias de constancia</div><div class="grid5" style="grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px">' + bs.map((b) => '<div class="col g6" style="align-items:center;text-align:center"><div class="row" style="width:60px;height:60px;border-radius:50%;justify-content:center;border:2px ' + (b.earned ? 'solid var(--accent)' : 'dashed var(--muted)') + ';background:' + (b.earned ? 'var(--accent-soft)' : 'transparent') + '">' + icon(b.id, 28, b.earned ? 'var(--accent)' : 'var(--muted)') + '</div><div style="font-size:13px;font-weight:600;line-height:1.25">' + b.label + '</div><div style="font-size:12px;color:' + (b.earned ? 'var(--good)' : 'var(--muted)') + '">' + (b.earned ? 'Lograda' : b.prog) + '</div></div>').join('') + '</div></section>';
  return out + '</div></div>';
}

/* ---------- Vista: Cabina (coach) ---------- */
const zoneTxt = (l) => (l && l.pain ? String(l.pain.zone || 'esa zona').toLowerCase() : 'esa zona');
function cabinaPresets(st, a) {
  const n = a ? a.first : '', l = a ? latest(a) : null;
  if (st.k === 'warn') return [l && l.pain ? n + ', cuida esa molestia (' + zoneTxt(l) + '): baja la intensidad y cuéntame cómo sigue.' : n + ', bajamos la intensidad hoy. ¿Cómo vienes?', 'Descansa hoy y me cuentas mañana.', 'Hablemos hoy, ¿te llamo?'];
  if (st.k === 'none') return ['¿Todo bien, ' + n + '? Cuando puedas, cuéntame cómo vas.', 'Retomemos con un check-in corto hoy.', 'Te escribo para saber cómo estás.'];
  return ['Todo bien, ' + n + '. Sigue con el plan.', 'Buen trabajo esta semana, ' + n + '.', 'Hoy puedes sumar un poco más.'];
}
const pencil = () => ph('pencil-simple', 20);
function replyBlock(a, st, l, n) {
  const need = needsReply(a), pr = cabinaPresets(st, a), un = UI.undo && UI.undo.id === a.id ? UI.undo : null, len = (UI.reply.text || '').length;
  let out = '';
  if (n && l && n.at >= l.ts) out += '<div class="row g12" style="background:var(--good-soft);border:1.5px solid var(--good);border-radius:16px;padding:12px 14px;align-items:flex-start"><span style="flex:none;margin-top:2px">' + check('var(--good)', 20) + '</span><span class="soft" style="font-size:14px">Nota enviada ' + relTime(n.at) + ': “' + esc(n.text) + '”</span></div>';
  out += '<div class="col g10" id="replyBox"><div class="row between g8" style="align-items:center"><div class="eyebrow">Responder a ' + esc(a.first) + '</div><span class="tag out" style="' + (need ? 'color:var(--accent);border-color:var(--accent)' : '') + '">' + (need ? 'Pendiente' : 'Al día') + '</span></div>';
  if (un) {
    const el = Math.max(0, (Date.now() - un.start) / 1000);
    out += '<div class="undo" role="status"><div class="row between g12" style="align-items:center"><span class="soft" style="font-size:14px">Se enviará a ' + esc(a.first) + ' en unos segundos.</span><button type="button" class="chip" data-a="qrUndo" style="min-height:44px">Deshacer</button></div><div class="undo-bar" aria-hidden="true"><i style="animation-delay:-' + el.toFixed(2) + 's"></i></div></div>';
  } else {
    out += '<div class="col g8" role="group" aria-label="Respuestas rápidas">' + pr.map((p, i) => '<div class="qr"><button type="button" class="qr-main" data-a="qrSend" data-v="' + i + '"><span>' + esc(p) + '</span><span class="qr-go" aria-hidden="true">Enviar</span></button><button type="button" class="qr-edit" data-a="preset" data-v="' + i + '" aria-label="Editar antes de enviar">' + pencil() + '</button></div>').join('') + '</div><p class="muted" style="font-size:12px">Toca una respuesta para enviarla (puedes deshacer unos segundos) o el lápiz para editarla antes.</p>';
  }
  out += '<label for="replyText" class="muted" style="font-size:13px">O escribe tu propio mensaje</label><textarea id="replyText" rows="3" maxlength="600" placeholder="Escribe aquí">' + esc(UI.reply.text) + '</textarea><div class="row between g8" style="align-items:center"><span class="muted" style="font-size:12px" id="replyCount">' + len + ' / 600</span><button type="button" class="btn primary" data-a="sendReply" style="width:auto;min-height:48px;padding:0 20px;justify-content:center" ' + (UI.reply.text.trim() && !UI.busy ? '' : 'disabled') + '>' + (UI.reply.text.trim() ? 'Enviar a ' + esc(a.first) : 'Enviar') + '</button></div></div>';
  return out;
}
/* Urgencia: quien espera respuesta y está en alerta primero; luego sin check-in (más días = más arriba); al final los que están al día. */
function urgency(a) {
  const st = statusOf(a), l = latest(a), gap = l ? Math.max(0, diffDays(l.date, off(0))) : 99;
  return (needsReply(a) ? 1000 : 0) + (st.k === 'warn' ? 500 : (st.k === 'none' ? 300 + Math.min(gap, 60) : 0)) + st.reasons.length;
}
function viewCabina() {
  const list = athleteObjs().sort((x, y) => urgency(y) - urgency(x) || String(x.name).localeCompare(String(y.name), 'es')), cnt = { ok: 0, warn: 0, none: 0 }; let queue = 0;
  list.forEach((a) => { cnt[statusOf(a).k]++; if (needsReply(a)) queue++; });
  let out = '<div class="inner"><div class="stack">' + head('Vista del coach', 'Cabina') + msgBanner();
  if (isOwner() && ST.pending.filter((p) => p.id !== (ST.user && ST.user.uid)).length) {
    out += '<section class="card col g12" aria-label="Solicitudes nuevas" style="border:1.5px solid var(--accent)"><div class="eyebrow" style="color:var(--accent)">Solicitudes nuevas</div>' + ST.pending.filter((p) => p.id !== ST.user.uid).map((p) => '<div class="col g10"><div style="font-weight:600">' + esc(p.name) + '</div>' + propBadge(p) + '<div class="row g8 wrap"><button type="button" class="chip" data-a="accept" data-v="' + esc(p.id) + '" data-t="grnt">Aceptar en GRNT</button><button type="button" class="chip" data-a="accept" data-v="' + esc(p.id) + '" data-t="zn">Aceptar en ZN</button></div></div>').join('') + '</section>';
  }
  out += '<section class="row g10" aria-label="Resumen del equipo">' + [['Al día', cnt.ok, 'var(--good)'], ['Atención', cnt.warn, 'var(--warn)'], ['Sin check-in', cnt.none, 'var(--muted)']].map((x) => '<div class="card tight grow"><div class="num" style="font-size:40px;color:' + x[2] + '">' + x[1] + '</div><div class="soft" style="font-size:13px;margin-top:4px">' + x[0] + '</div></div>').join('') + '</section>';
  out += '<button type="button" class="row between g12" data-a="nextReply" ' + (queue === 0 ? 'disabled' : '') + ' style="width:100%;min-height:52px;text-align:left;background:var(--accent-soft);border:1.5px solid var(--accent);border-radius:16px;padding:12px 16px"><span style="font-weight:600">' + (queue === 0 ? 'Todo respondido por hoy' : queue + ' por responder') + '</span><span class="muted" style="font-size:13px">' + (queue === 0 ? 'Cola de respuestas' : 'Ir a responder ›') + '</span></button>';
  if (!list.length) { out += '<section class="card"><p class="soft">Aún no tienes atletas asignados. Cuando alguien entre con Google aparecerá arriba como solicitud nueva.</p></section></div></div>'; return out; }
  if (!UI.sel || !list.some((a) => a.id === UI.sel)) UI.sel = list[0].id;
  out += '<section class="col g10" aria-label="Atletas"><div class="eyebrow">Atletas · los más urgentes primero</div>';
  list.forEach((a) => {
    const st = statusOf(a), l = latest(a), col = st.k === 'ok' ? 'var(--good)' : (st.k === 'warn' ? 'var(--warn)' : 'var(--muted)'), lab = st.k === 'ok' ? 'Al día' : (st.k === 'warn' ? 'Atención' : 'Sin check-in');
    out += '<button type="button" data-a="sel" data-v="' + esc(a.id) + '" aria-pressed="' + (UI.sel === a.id) + '" class="row g12" style="width:100%;min-height:72px;padding:12px 14px;border-radius:18px;text-align:left;border:1.5px solid ' + (UI.sel === a.id ? 'var(--accent)' : 'var(--line)') + ';background:' + (UI.sel === a.id ? 'var(--surface2)' : 'var(--surface)') + '"><span class="dot" style="background:' + col + '" aria-hidden="true"></span><span class="col grow g4"><span style="font-weight:600;font-size:16px">' + esc(a.name) + (a.team ? ' <span class="muted" style="font-weight:500;font-size:13px">· ' + TEAMS[a.team] + '</span>' : '') + '</span><span style="font-size:13px;color:' + col + '">' + lab + '</span>' + (st.k === 'none' ? '' : '<span class="soft" style="font-size:13px">' + esc(st.reasons[0] || 'Todo en orden') + '</span>') + '<span class="muted" style="font-size:12px">Último check-in: ' + (l ? relTime(l.ts) : 'ninguno') + (needsReply(a) ? ' · espera respuesta' : '') + '</span></span>' + miniSpark(a) + '</button>';
  });
  out += '</section>';
  const a = list.find((x) => x.id === UI.sel), st = statusOf(a), l = latest(a), n = lastNote(a), col = st.k === 'ok' ? 'var(--good)' : (st.k === 'warn' ? 'var(--warn)' : 'var(--muted)'), lab = st.k === 'ok' ? 'Al día' : (st.k === 'warn' ? 'Atención' : 'Sin check-in');
  if (UI.reply.id !== a.id) UI.reply = { id: a.id, text: '' };
  out += '<section class="card col g14" aria-label="Detalle del atleta"><div class="row between g8" style="align-items:baseline"><h2 class="h2">' + esc(a.name) + '</h2><span style="font-weight:600;font-size:14px;color:' + col + '">' + lab + '</span></div>';
  out += '<button type="button" class="btn" data-a="verComo" data-v="' + esc(a.id) + '" style="width:100%;min-height:52px;justify-content:space-between;border:1.5px solid var(--accent2);color:var(--accent2);background:transparent"><span style="font-weight:600">Ver la app como ' + esc(a.first) + '</span><span aria-hidden="true">' + arrow() + '</span></button>';
  out += st.reasons.length ? '<ul style="margin:0;padding-left:18px" class="soft">' + st.reasons.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' : '<p class="soft">Todo en orden. Su bienestar acompaña bien a la carga.</p>';
  if (l && l.pain) out += '<div class="row g8 wrap"><span class="muted" style="font-size:13px">Molestia reportada:</span><span class="tag out">Zona: ' + esc(String(l.pain.zone || '').toLowerCase()) + ' (' + esc(String(l.pain.side || '').toLowerCase()) + ')</span><span class="tag out">Intensidad: ' + esc(String(l.pain.level || '').toLowerCase()) + '</span></div>';
  if (l && gymMolOf(l).length) out += '<div class="col g6"><span class="muted" style="font-size:13px">Molestias tras el gym:</span>' + [l.activity, l.act2].filter(Boolean).map((S) => gzMol(S).map((z) => '<span class="tag out">' + esc(z[1]) + (gzOf(S)[z[0]].t ? ': ' + esc(gzOf(S)[z[0]].t) : '') + '</span>').join('')).join('') + '</div>';
  if (l && (gzList(l.activity).length || gzList(l.act2).length)) out += '<div class="row g8 wrap"><span class="muted" style="font-size:13px">Zonas de gym:</span>' + [l.activity, l.act2].filter(Boolean).map((S) => gzList(S).map((z) => '<span class="tag out">' + esc(z[1]) + ' · ' + GZI[gzOf(S)[z[0]].i == null ? 1 : gzOf(S)[z[0]].i].toLowerCase() + '</span>').join('')).join('') + '</div>';
  if (l) {
    const bits = l.mood != null ? ['Ánimo: ' + at(MOODS, l.mood - 1)] : [];
    if (l.sleepH != null) bits.push('Sueño: ' + at(SLEEPH, l.sleepH) + (l.sleepQ ? ' (' + at(SLEEPQ, l.sleepQ - 1).toLowerCase() + ')' : ''));
    if (l.legs != null) bits.push('Piernas: ' + at(LEGS, l.legs).toLowerCase());
    if (l.stress != null) bits.push('Estrés: ' + at(STRESS, l.stress).toLowerCase());
    if (l.rpe) bits.push('RPE ' + l.rpe);
    if (l.hard === 'si') { const hi = l.hardInfo || {}, hp = [hi.type, hi.dur, hi.end].filter(Boolean).map((x) => String(x).toLowerCase()); bits.push('Tramo duro' + (hp.length ? ': ' + hp.join(', ') : '')); }
    if (l.fuel) { const F = l.fuel, fp = []; if (F.carbs != null) fp.push('carbos: ' + at(CARBS, F.carbs).toLowerCase()); if (F.hydra != null) fp.push('hidratación: ' + at(HYDRA, F.hydra).toLowerCase()); if (F.energy != null) fp.push('energía: ' + at(ENERGY, F.energy).toLowerCase()); if (F.gi === 'si') fp.push('molestias digestivas'); if (F.pre) fp.push('antes: ' + F.pre); if (F.post) fp.push('después: ' + F.post); if (fp.length) bits.push('Nutrición — ' + fp.join(', ')); }
    if (l.restOk) bits.push('Confirmó que descansó, aunque el plan marcaba entrenar');
    if (l.skip) bits.push('No entrenó' + ((l.skip.items || []).length ? ': ' + l.skip.items.map((x) => String(x).toLowerCase()).join(', ') : '') + (l.skip.text ? ' ("' + l.skip.text + '")' : ''));
    if (l.hardInfo && l.hardInfo.text) bits.push('Tramo: ' + l.hardInfo.text);
    if (l.prevInfo) { const pi = l.prevInfo, pp = (pi.items || []).map((x) => String(x).toLowerCase()).join(', '); bits.push('Ayer fuera de lo habitual' + (pp ? ': ' + pp : '') + (pi.text ? ' ("' + pi.text + '")' : '')); }
    out += '<div class="col g6"><div class="eyebrow">Último check-in · ' + relTime(l.ts) + '</div><p class="soft" style="font-size:15px">' + esc(bits.join(' · ')) + '</p>' + (l.comment ? '<p class="muted" style="font-size:14px">“' + esc(l.comment) + '”</p>' : '') + '</div>';
  }
  { const ll = loadLine(loadInfo(a)); if (ll) out += '<p class="soft" style="font-size:14px">' + esc(ll) + '</p>'; }
  if (canEdit()) out += replyBlock(a, st, l, n);
  out += '<div><div class="eyebrow">Bienestar · 7 días</div><div style="margin-top:8px">' + dualChart(a) + '</div>' + dualLegend() + '</div>' + histBlock(a);
  out += '</section>';
  if (canEdit()) { out += manageCard(a); if (isOwner()) out += fbInbox(); } else if (canProfile() && ST.athBio[a.id] && ST.athBio[a.id].main) out += '<section class="card col g4" aria-label="Perfil"><div class="eyebrow">Perfil</div>' + bioPanel(a, true) + '</section>';
  return out + '</div></div>';
}

/* ---------- Historial de forma y salidas (lo carga el coach desde intervals.icu) ---------- */
const histDays = (h) => (h && Array.isArray(h.days) ? h.days.filter((x) => x && x.d && isFinite(x.ctl) && isFinite(x.atl)).sort((a, b) => (a.d < b.d ? -1 : 1)) : []);
const f1 = (v) => Number(v).toLocaleString('es-CL', { maximumFractionDigits: 1 });
/* ---------- Carga de entrenamiento (TSS) ----------
   Jerarquía de fuentes: 1) TSS real de intervals.icu (carga diaria exacta o derivada del historial; alta confianza);
   2) carga del plan cuando el atleta cumplió su sesión (media); 3) estimación: minutos × TSS por hora propio del atleta, ajustado por esfuerzo (aproximada).
   Gym y otras actividades NO se suman al TSS de bici: se muestran aparte en UA (RPE × minutos). */
const TPH_DEFAULT = 50; // TSS por hora típico si aún no hay historial propio (medianas reales: 40 a 62 en los atletas del grupo)
const RAMP_LABEL = 0.25, RAMP_WARN = 0.5, RAMP_MIN_BASE = 120; // orientativos, no validados como predictores de lesión
const rpeFactor = (rpe) => (rpe >= 1 ? Math.max(0.8, Math.min(1.25, 1 + 0.06 * (rpe - 5))) : 1); // el esfuerzo ajusta como máximo ±20 %: en los datos reales no ordena bien la intensidad por hora
/* TSS diario real: si el historial trae la carga exacta del día (l), se usa; si no, se deriva de la fatiga: TSS = ATL_ayer + 7·(ATL_hoy − ATL_ayer). */
function histDaily(h) {
  const ds = histDays(h), o = {};
  for (let i = 0; i < ds.length; i++) {
    if (ds[i].l != null && isFinite(ds[i].l)) { o[ds[i].d] = Math.max(0, Math.round(ds[i].l)); continue; }
    if (i && diffDays(ds[i - 1].d, ds[i].d) === 1) { const v = Math.round(ds[i - 1].atl + 7 * (ds[i].atl - ds[i - 1].atl)); o[ds[i].d] = v < 6 ? 0 : v; } // bajo 6 es ruido del redondeo
  }
  return o;
}
const median = (v) => { const x = v.slice().sort((p, q) => p - q), m = x.length >> 1; return x.length % 2 ? x[m] : (x[m - 1] + x[m]) / 2; };
/* TSS por hora propio del atleta: 1) días con check-in de bici y carga real del historial; 2) su plan (carga/min); 3) valor típico del grupo. */
const TPH_CACHE = {};
function tphOf(a) {
  const hs = histDays(a.hist), key = [a.id, a.checkins.length, hs.length ? hs[hs.length - 1].d + hs[hs.length - 1].atl : 0].join('|');
  if (TPH_CACHE[a.id] && TPH_CACHE[a.id].key === key) return TPH_CACHE[a.id].v;
  const hd = histDaily(a.hist), pairs = [];
  a.checkins.forEach((c) => { const S1 = sessOf(c, 1), S2 = sessOf(c, 2), ss = [S1, S2].filter(Boolean); if (!ss.length || hd[c.date] == null || hd[c.date] < 10) return; let min = 0, bike = true; ss.forEach((S) => { const k = kindOfAct(S, a) || 'otra'; if (!BKINDS[k]) bike = false; min += S.min || 0; }); if (bike && min >= 20) pairs.push(hd[c.date] / (min / 60)); });
  const pl = a.plan && a.plan.sessions ? Object.keys(a.plan.sessions).map((d) => a.plan.sessions[d]).filter((x) => x && x.load > 0 && x.min >= 20).map((x) => x.load / (x.min / 60)) : [];
  const v = pairs.length >= 5 ? { tph: median(pairs), src: 'hist', n: pairs.length } : (pl.length >= 3 ? { tph: median(pl), src: 'plan', n: pl.length } : { tph: TPH_DEFAULT, src: 'def', n: 0 });
  TPH_CACHE[a.id] = { key, v }; return v;
}
function sessLoad(S, a) {
  const k = kindOfAct(S, a) || 'otra', bike = !!BKINDS[k], ua = S.rpe && S.min ? Math.round(S.rpe * S.min) : null;
  if (!bike) return { k, tss: null, src: null, ua };
  if (S.load != null && S.load > 0) return { k, tss: Math.round(S.load), src: 'plan', ua: null };
  if (!(S.min > 0)) return { k, tss: null, src: null, ua: null };
  return { k, tss: Math.round(S.min / 60 * tphOf(a).tph * rpeFactor(S.rpe)), src: 'rpe', ua: null };
}
function dayLoad(a, hd, date) {
  const c = on(a, date); let est = 0, src = null, ua = 0;
  if (c) [sessOf(c, 1), sessOf(c, 2)].forEach((S) => { if (!S) return; const L = sessLoad(S, a); if (L.tss != null) { est += L.tss; src = (src === 'rpe' || L.src === 'rpe') ? 'rpe' : 'plan'; } if (L.ua) ua += L.ua; });
  const h = hd[date];
  if (h != null && h > 0) return { tss: h, src: 'hist', ua };
  if (est > 0) return { tss: est, src, ua };
  return { tss: 0, src: null, ua };
}
const LOAD_CACHE = {};
function loadInfo(a) {
  const h = a.hist, hs = histDays(h), l = latest(a);
  const key = [a.id, a.checkins.length, l ? l.ts : 0, hs.length ? hs[hs.length - 1].d + hs[hs.length - 1].atl : 0, off(0)].join('|');
  if (LOAD_CACHE[a.id] && LOAD_CACHE[a.id].key === key) return LOAD_CACHE[a.id].v;
  const hd = histDaily(h), cache = {}, day = (k) => cache[k] || (cache[k] = dayLoad(a, hd, off(k)));
  const sum = (from, to) => { const r = { t: 0, ua: 0, by: { hist: 0, plan: 0, rpe: 0 }, vals: [] }; for (let k = from; k <= to; k++) { const d = day(k); r.t += d.tss; r.ua += d.ua; if (d.src) r.by[d.src] += d.tss; r.vals.push(d.tss); } return r; };
  const w7 = sum(-6, 0), prev = [sum(-13, -7), sum(-20, -14), sum(-27, -21), sum(-34, -28)].filter((x) => x.t > 0);
  const base = prev.length >= 2 ? prev.reduce((t, x) => t + x.t, 0) / prev.length : null, ratio = base && base > 0 ? w7.t / base : null;
  const mean = w7.t / 7, sd = Math.sqrt(w7.vals.reduce((t, v) => t + (v - mean) * (v - mean), 0) / 7), mono = sd > 0 && w7.t > 0 ? mean / sd : null;
  const t = parse(off(0)), mon0 = new Date(t); mon0.setDate(t.getDate() - ((t.getDay() + 6) % 7)); const weeks = [];
  const pl = a.plan && a.plan.sessions ? a.plan.sessions : null;
  for (let i = 7; i >= 0; i--) { let tt = 0, pp = 0; for (let j = 0; j < 7; j++) { const d = new Date(mon0); d.setDate(mon0.getDate() - i * 7 + j); const k = diffDays(off(0), ymd(d)); if (k <= 0) tt += day(k).tss; const x = pl && pl[ymd(d)]; if (x && x.load) pp += x.load; } const m0 = new Date(mon0); m0.setDate(mon0.getDate() - i * 7); weeks.push({ k: i, m: ymd(m0), t: tt, p: pp }); }
  const planWeek = weeks[7].p;
  const v = { w7, base, ratio, mono, strain: mono ? w7.t * mono : null, weeks, planWeek, weekT: weeks[7].t, has: w7.t > 0 || base != null || w7.ua > 0 };
  LOAD_CACHE[a.id] = { key, v }; return v;
}
const srcLine = (by) => { const t = by.hist + by.plan + by.rpe; if (!t) return ''; const p = (x) => Math.round(x / t * 100), o = []; if (by.hist) o.push(p(by.hist) + ' % de intervals.icu'); if (by.plan) o.push(p(by.plan) + ' % del plan cumplido'); if (by.rpe) o.push(p(by.rpe) + ' % estimado con tus minutos y tu esfuerzo (aproximado)'); return o.join(' · '); };
const rampWord = (r) => (r == null ? { n: 'Reuniendo datos', c: 'var(--muted)', t: 'Con unas semanas de historial podremos comparar tu carga con tu promedio.' }
  : (r < 0.8 ? { n: 'Más suave que tu promedio', c: 'var(--soft)', t: 'Buena semana para asimilar lo trabajado.' }
  : (r <= 1 + RAMP_LABEL * 0.5 ? { n: 'Similar a tu promedio', c: 'var(--good)', t: 'Vas con un ritmo parejo y sostenible.' }
  : (r <= 1 + RAMP_LABEL ? { n: 'Algo más exigente', c: 'var(--soft)', t: 'Un poco por sobre tu promedio: cuida el sueño y la comida.' }
  : { n: 'Subió bastante', c: 'var(--warn)', t: 'Subió rápido respecto a tu promedio. Descansa bien y cuéntale a tu coach cómo te sientes.' }))));
/* Medidor de carga: misma lectura y posicion que el de la forma (izquierda mas cargado, derecha mas suave). Sin verde ni rojo: la carga no es buena ni mala. Calido = mas que tu promedio, frio = menos. Zonas = frases (0,8 / 1,125 / 1,25). */
function loadGauge(r) {
  const pos = Math.max(0, Math.min(100, (1.5 - r) / 1.0 * 100)), n = rampWord(r).n;
  return '<div style="position:relative;margin-top:6px" role="img" aria-label="Carga frente a tu promedio: ' + n + '"><div class="gauge" aria-hidden="true"><i style="flex:25;background:var(--accent)"></i><i style="flex:12.5;background:var(--accent);opacity:.55"></i><i style="flex:32.5;background:var(--track)"></i><i style="flex:30;background:var(--accent2);opacity:.6"></i></div><span class="gmk" style="left:calc(' + pos.toFixed(1) + '% - 2px)"></span></div><div class="gl" aria-hidden="true"><span>Subió bastante</span><span>Similar</span><span>Más suave</span></div>';
}
/* TSS por semana: mismo grafico y lectura al tocar que "Salidas por semana" (barras, plan punteado, promedio). */
function tssBars(li) {
  const weeks = li.weeks, FM = FC_MES;
  const lab = (k) => { const d = parse(k); return d.getDate() + ' ' + FM[d.getMonth()]; };
  const cur = weeks[7], done = weeks.slice(0, 7), avg = li.base != null ? li.base : 0;
  const txt = (x, i) => 'Semana del ' + lab(x.m) + ': ' + Math.round(x.t) + ' TSS' + (x.p ? ' · plan ' + Math.round(x.p) : '') + (i === 7 ? ' (en curso)' : '');
  const mxw = Math.max.apply(null, weeks.map((x) => Math.max(x.t, x.p)).concat([100])), step = mxw <= 300 ? 100 : (mxw <= 600 ? 200 : 300), top = Math.ceil(mxw / step) * step;
  const W = 340, L = 34, R = 10, PW = W - L - R, T = 22, H = 96, B = T + H, slot = PW / 8, bw = Math.min(24, slot - 10), Y = (v) => B - v / top * H;
  let s = '<svg viewBox="0 0 ' + W + ' ' + (B + 24) + '" width="100%" role="img" aria-label="TSS por semana. ' + esc(weeks.map(txt).join('. ')) + '" style="display:block">';
  for (let v = 0; v <= top; v += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--line)" stroke-width="1"></line><text x="' + (L - 6) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + v + '</text>';
  weeks.forEach((x, i) => {
    const c = i === 7, cx = L + slot * i + slot / 2, x0 = cx - bw / 2;
    if (x.p) s += '<rect x="' + x0.toFixed(1) + '" y="' + Y(x.p).toFixed(1) + '" width="' + bw + '" height="' + (B - Y(x.p)).toFixed(1) + '" rx="4" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3" opacity=".8"></rect>';
    if (x.t > 0) { const y = Y(x.t), r = Math.min(4, (B - y) / 2); s += '<path class="wb-bar" d="M' + x0.toFixed(1) + ',' + B + 'L' + x0.toFixed(1) + ',' + (y + r).toFixed(1) + 'Q' + x0.toFixed(1) + ',' + y.toFixed(1) + ' ' + (x0 + r).toFixed(1) + ',' + y.toFixed(1) + 'L' + (x0 + bw - r).toFixed(1) + ',' + y.toFixed(1) + 'Q' + (x0 + bw).toFixed(1) + ',' + y.toFixed(1) + ' ' + (x0 + bw).toFixed(1) + ',' + (y + r).toFixed(1) + 'L' + (x0 + bw).toFixed(1) + ',' + B + 'Z" fill="' + (c ? 'var(--accent)' : 'var(--accent2)') + '" opacity="' + (c ? 1 : .55) + '"></path>'; }
    if (c) s += '<text x="' + cx.toFixed(1) + '" y="' + (Y(Math.max(x.t, x.p)) - 5).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="var(--accent)">' + Math.round(x.t) + '</text>';
    if (i % 2 === 1 || c) s += '<text x="' + cx.toFixed(1) + '" y="' + (B + 16) + '" text-anchor="middle" font-size="10" fill="' + (c ? 'var(--text)' : 'var(--muted)') + '"' + (c ? ' font-weight="700"' : '') + '>' + (c ? 'Esta' : lab(x.m)) + '</text>';
    s += '<rect class="wb-hit" x="' + (cx - slot / 2).toFixed(1) + '" y="' + (T - 14) + '" width="' + slot.toFixed(1) + '" height="' + (H + 40) + '" fill="transparent" data-t="' + esc(txt(x, i)) + '"></rect>';
  });
  if (avg > 0) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(avg).toFixed(1) + '" y2="' + Y(avg).toFixed(1) + '" stroke="var(--text)" stroke-width="1" opacity=".55"></line>';
  s += '</svg>';
  const hasPlan = weeks.some((x) => x.p), sw = (st) => '<i style="display:block;width:12px;height:12px;border-radius:3px;' + st + '"></i>';
  return '<div class="wbw"><div class="wb-read" aria-live="polite" style="font-size:13px;min-height:20px">' + esc(txt(cur, 7)) + '</div>' + s
    + '<div class="row g16 wrap soft" style="font-size:12px;margin-top:4px"><span class="row g6">' + sw('background:var(--accent)') + 'Esta semana</span><span class="row g6">' + sw('background:var(--accent2);opacity:.55') + 'Semanas anteriores</span>' + (hasPlan ? '<span class="row g6">' + sw('border:1.5px dashed var(--muted)') + 'Plan</span>' : '') + (avg > 0 ? '<span class="row g6"><i style="display:block;width:14px;height:2px;background:var(--text);opacity:.55"></i>Promedio ' + Math.round(avg) + '</span>' : '') + '</div></div>';
}
function loadCard(li) {
  if (!li || !li.has) return '';
  const w = rampWord(li.ratio), pct = li.ratio != null ? Math.round((li.ratio - 1) * 100) : null;
  const cols = [[String(Math.round(li.w7.t)), 'var(--accent)', '7 días', 38], [li.base != null ? String(Math.round(li.base)) : '–', 'var(--accent2)', 'Promedio', 38], [pct != null ? (pct > 0 ? '+' : '') + pct + '%' : '–', 'var(--text)', 'Variación', 34]];
  return '<section class="card col g10" aria-label="Tu carga"><div class="eyebrow">Tu carga (TSS)</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr">' + cols.map(function (x, i) { return '<div class="col g6" style="align-items:center;text-align:center;padding:4px 4px;' + (i ? 'border-left:1px solid var(--line)' : '') + '"><span class="num" style="font-size:' + x[3] + 'px;line-height:1;color:' + x[1] + '">' + x[0] + '</span><span class="muted" style="font-size:13px">' + x[2] + '</span></div>'; }).join('') + '</div>'
    + (li.ratio != null ? loadGauge(li.ratio) : '')
    + '<p class="soft" style="font-size:15px;margin-top:4px"><b style="color:var(--text)">' + w.n + '.</b> ' + w.t + '</p>'
    + '<div class="eyebrow" style="margin-top:6px">TSS por semana · últimas 8</div>' + tssBars(li)
    + (li.w7.ua ? '<p class="soft" style="font-size:14px">Fuerza y otras actividades: <b>' + Math.round(li.w7.ua) + ' UA</b> (esfuerzo × minutos). Se cuentan aparte porque cansan distinto que la bici.</p>' : '')
    + '<p class="muted" style="font-size:12px">Fuente: ' + srcLine(li.w7.by) + '.</p>'
    + '<details><summary class="muted" style="font-size:13px;cursor:pointer;min-height:32px"><span>¿Qué es el TSS?</span>' + dcar() + '</summary><p class="muted" style="font-size:13px;margin-top:6px">El TSS mide cuánto te costó entrenar: una hora rodando justo a tu umbral vale 100. Sube con más duración y más intensidad. Sirve para ver tu tendencia, no para juzgar un día: cuando es estimado con tus minutos es aproximado, y no mide el sueño, el estrés ni la comida.</p></details></section>';
}
const loadLine = (li) => (li && li.has ? 'Carga 7 días: ' + Math.round(li.w7.t) + ' TSS' + (li.ratio != null ? ' (' + (li.ratio >= 1 ? '+' : '') + Math.round((li.ratio - 1) * 100) + ' % vs. su promedio de 4 semanas)' : '') + (li.mono != null ? ' · monotonía ' + li.mono.toFixed(1) : '') + (li.w7.ua ? ' · fuerza ' + Math.round(li.w7.ua) + ' UA' : '') + (srcLine(li.w7.by) ? ' · ' + srcLine(li.w7.by).replace('estimado con tus minutos y tu esfuerzo', 'estimado') : '') : '');

function formaInfo(h) { const ds = histDays(h); if (!ds.length) return null; const last = ds[ds.length - 1]; return { ds, last, tsb: Math.round(last.ctl - last.atl) }; }
/* ---------- Grafico de forma (aptitud, fatiga, forma) ---------- */
const FC_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
let fcSeq = 0;
const fcDate = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); };
const fcYmd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fcDiff = (a, b) => Math.round((fcDate(b) - fcDate(a)) / 86400000);
const fcLbl = (s) => { const d = fcDate(s); return d.getDate() + ' ' + FC_MES[d.getMonth()]; };
const fcNum = (v) => (Math.round(v * 10) / 10).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fcSgn = (v) => (v > 0 ? '+' : '') + Math.round(v);
/* Curva suave que no se pasa de los datos (cubica monotona), fiel a un promedio movil exponencial. */
function fcPath(P) {
  const n = P.length; if (n < 2) return '';
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1][0] - P[i][0]; m[i] = (P[i + 1][1] - P[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = 'M' + P[0][0].toFixed(1) + ',' + P[0][1].toFixed(1);
  for (let i = 0; i < n - 1; i++) d += 'C' + (P[i][0] + dx[i] / 3).toFixed(1) + ',' + (P[i][1] + t[i] * dx[i] / 3).toFixed(1) + ' ' + (P[i + 1][0] - dx[i] / 3).toFixed(1) + ',' + (P[i + 1][1] - t[i + 1] * dx[i] / 3).toFixed(1) + ' ' + P[i + 1][0].toFixed(1) + ',' + P[i + 1][1].toFixed(1);
  return d;
}
function fcNice(mx) { const raw = mx / 3, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p, s = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10; return s * p; }
/* Proyecta aptitud y fatiga con las cargas del plan (modelo 42 y 7 dias). */
function fcProject(last, sessions, endDate) {
  const out = []; let ctl = last.ctl, atl = last.atl, d = fcDate(last.d);
  const n = Math.min(fcDiff(last.d, endDate), 60);
  for (let i = 0; i < n; i++) { d.setDate(d.getDate() + 1); const k = fcYmd(d), s = sessions && sessions[k], l = s && s.load != null ? s.load : 0; ctl += (l - ctl) / 42; atl += (l - atl) / 7; out.push({ d: k, ctl, atl }); }
  return out;
}
/* ds: [{d,ctl,atl}] ; o: {range, proj:[...], goal:{date,name}} */
function formaChart(ds, o) {
  o = o || {}; const id = ++fcSeq;
  let rows = ds.slice(); if (o.range && rows.length > o.range) rows = rows.slice(-o.range);
  const proj = o.proj || [], all = rows.concat(proj);
  const d0 = rows[0].d, N = fcDiff(d0, all[all.length - 1].d) + 1;
  const W = o.W || 340, L = 30, R = 10, PW = W - L - R, X = (s) => L + fcDiff(d0, s) * PW / Math.max(N - 1, 1);
  const vals = rows.map((r) => Math.max(r.ctl, r.atl)).sort((a, b) => a - b), p95 = vals[Math.floor(vals.length * 0.95)] || 10;
  const lastR = rows[rows.length - 1], realMax = vals[vals.length - 1];
  const topWanted = Math.max(p95 * 1.2, lastR.ctl * 1.6, 20), clip = realMax > topWanted * 1.15;
  const hasProj = proj.length > 0, pmax = hasProj ? Math.max.apply(null, proj.map((r) => Math.max(r.ctl, r.atl))) : 0;
  const need = Math.max(clip ? topWanted : realMax, pmax, 10), step = fcNice(need), top = Math.ceil(need * 1.05 / step) * step;
  const T1 = 20, H1 = o.H1 || 118, Y1 = (v) => T1 + H1 - v / top * H1, B1 = T1 + H1;
  const two = o.panels !== 1, T2 = B1 + 34, H2 = o.H2 || 62;
  const tsbOf = (r) => r.ctl - r.atl, tv = all.map(tsbOf), tmin = Math.min.apply(null, tv.concat([-30])), tmax = Math.max.apply(null, tv.concat([20]));
  const lo = Math.floor(tmin / 10) * 10, hi = Math.ceil(tmax / 10) * 10, Y2 = (v) => T2 + H2 - (v - lo) / (hi - lo) * H2, Z2 = Y2(0);
  const H = two ? T2 + H2 + 22 : B1 + 22, axisY = two ? T2 + H2 + 14 : B1 + 14;
  const pts = (arr, k) => arr.map((r) => [X(r.d), Y1(r[k])]);
  let s = '<svg class="fc-svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Curvas de aptitud, fatiga y forma" style="display:block;touch-action:pan-y"><defs><clipPath id="fcc' + id + '"><rect x="' + L + '" y="' + T1 + '" width="' + PW + '" height="' + H1 + '"></rect></clipPath><clipPath id="fct' + id + '"><rect x="' + L + '" y="' + T2 + '" width="' + PW + '" height="' + H2 + '"></rect></clipPath></defs>';
  // rejilla y ejes del panel 1
  for (let v = 0; v <= top + 0.01; v += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y1(v).toFixed(1) + '" y2="' + Y1(v).toFixed(1) + '" stroke="var(--line)" stroke-width="1"></line><text x="' + (L - 6) + '" y="' + (Y1(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + Math.round(v) + '</text>';
  // zona de proyeccion
  if (hasProj) { const px = X(lastR.d); s += '<rect x="' + px.toFixed(1) + '" y="' + T1 + '" width="' + (W - R - px).toFixed(1) + '" height="' + (two ? T2 + H2 - T1 : H1) + '" fill="var(--surface2)" opacity=".55"></rect><text x="' + (px + 5).toFixed(1) + '" y="' + (T1 + 11) + '" font-size="10" fill="var(--muted)">Plan (estimado)</text>'; }
  // aptitud: area + linea
  const cPts = pts(rows, 'ctl'), aPts = pts(rows, 'atl'), cp = fcPath(cPts);
  s += '<g clip-path="url(#fcc' + id + ')"><path d="' + cp + 'L' + cPts[cPts.length - 1][0].toFixed(1) + ',' + B1 + 'L' + cPts[0][0].toFixed(1) + ',' + B1 + 'Z" fill="var(--accent2)" opacity=".12"></path><path d="' + cp + '" fill="none" stroke="var(--accent2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="' + fcPath(aPts) + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>';
  if (hasProj) { const base = [lastR].concat(proj); s += '<path d="' + fcPath(pts(base, 'ctl')) + '" fill="none" stroke="var(--accent2)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"></path><path d="' + fcPath(pts(base, 'atl')) + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"></path>'; }
  s += '</g>';
  // pico recortado
  if (clip) { let pi = 0; rows.forEach((r, i) => { if (Math.max(r.ctl, r.atl) > Math.max(rows[pi].ctl, rows[pi].atl)) pi = i; }); const px = Math.min(Math.max(X(rows[pi].d), L + 22), W - R - 22); s += '<text x="' + px.toFixed(1) + '" y="' + (T1 - 5) + '" text-anchor="middle" font-size="10" fill="var(--accent)">▲ pico ' + Math.round(realMax) + '</text>'; }
  // punto final
  s += '<circle cx="' + cPts[cPts.length - 1][0].toFixed(1) + '" cy="' + cPts[cPts.length - 1][1].toFixed(1) + '" r="4" fill="var(--accent2)" stroke="var(--surface)" stroke-width="2"></circle><circle cx="' + aPts[aPts.length - 1][0].toFixed(1) + '" cy="' + aPts[aPts.length - 1][1].toFixed(1) + '" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"></circle>';
  // meta
  if (o.goal && fcDiff(d0, o.goal.date) <= N - 1 && fcDiff(d0, o.goal.date) >= 0) { const gx = X(o.goal.date); s += '<line x1="' + gx.toFixed(1) + '" x2="' + gx.toFixed(1) + '" y1="' + T1 + '" y2="' + (two ? T2 + H2 : B1) + '" stroke="var(--good)" stroke-width="1.5"></line><text x="' + (gx - 4).toFixed(1) + '" y="' + (T1 + 24) + '" text-anchor="end" font-size="10" fill="var(--good)">Meta</text>'; }
  // panel 2: forma
  if (two) {
    s += '<text x="' + L + '" y="' + (T2 - 10) + '" font-size="11" font-weight="600" fill="var(--soft)">Forma (aptitud − fatiga)</text>';
    for (let v = lo; v <= hi; v += 10) if (v % 20 === 0 || v === 0) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y2(v).toFixed(1) + '" y2="' + Y2(v).toFixed(1) + '" stroke="' + (v === 0 ? 'var(--muted)' : 'var(--line)') + '" stroke-width="1" ' + (v === 0 ? 'opacity=".6"' : '') + '></line><text x="' + (L - 6) + '" y="' + (Y2(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + fcSgn(v) + '</text>';
    if (lo < -25) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y2(-25).toFixed(1) + '" y2="' + Y2(-25).toFixed(1) + '" stroke="var(--bad)" stroke-width="1" opacity=".55"></line><text x="' + (L + 3) + '" y="' + (Y2(-25) - 3).toFixed(1) + '" font-size="9" fill="var(--bad)">alerta −25</text>';
    const fr = rows.map((r) => [X(r.d), Y2(tsbOf(r))]), fp = fcPath(fr), z = Z2.toFixed(1);
    s += '<g clip-path="url(#fct' + id + ')"><clipPath id="fcu' + id + '"><rect x="' + L + '" y="' + T2 + '" width="' + PW + '" height="' + (Z2 - T2).toFixed(1) + '"></rect></clipPath><clipPath id="fcd' + id + '"><rect x="' + L + '" y="' + z + '" width="' + PW + '" height="' + (T2 + H2 - Z2).toFixed(1) + '"></rect></clipPath>';
    const area = fp + 'L' + fr[fr.length - 1][0].toFixed(1) + ',' + z + 'L' + fr[0][0].toFixed(1) + ',' + z + 'Z';
    s += '<path d="' + area + '" clip-path="url(#fcu' + id + ')" fill="var(--good)" opacity=".22"></path><path d="' + area + '" clip-path="url(#fcd' + id + ')" fill="var(--accent)" opacity=".18"></path><path d="' + fp + '" fill="none" stroke="var(--text)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>';
    if (hasProj) s += '<path d="' + fcPath([fr[fr.length - 1]].concat(proj.map((r) => [X(r.d), Y2(tsbOf(r))]))) + '" fill="none" stroke="var(--text)" stroke-width="1.75" stroke-linecap="round" stroke-dasharray="2 4"></path>';
    s += '</g><circle cx="' + fr[fr.length - 1][0].toFixed(1) + '" cy="' + fr[fr.length - 1][1].toFixed(1) + '" r="4" fill="var(--text)" stroke="var(--surface)" stroke-width="2"></circle>';
  }
  // eje x
  let lastLbl = -99; const weekly = N <= 45;
  for (let i = 0; i < N; i++) { const dd = fcDate(d0); dd.setDate(dd.getDate() + i); const tick = weekly ? ((dd.getDay() + 6) % 7 === 0) : dd.getDate() === 1; if (!tick) continue; const x = L + i * PW / Math.max(N - 1, 1); if (x - lastLbl < 38) continue; lastLbl = x; s += '<text x="' + x.toFixed(1) + '" y="' + axisY + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + (weekly ? dd.getDate() + ' ' + FC_MES[dd.getMonth()] : FC_MES[dd.getMonth()]) + '</text>'; }
  // lectura al tocar
  s += '<line class="fc-x" x1="0" x2="0" y1="' + T1 + '" y2="' + (two ? T2 + H2 : B1) + '" stroke="var(--text)" stroke-width="1" opacity="0"></line><rect class="fc-hit" x="' + L + '" y="' + T1 + '" width="' + PW + '" height="' + (H - T1 - 16) + '" fill="transparent"></rect></svg>';
  const L1 = lastR, tsb = Math.round(L1.ctl - L1.atl), data = rows.concat(proj).map((r) => [r.d, Math.round(r.ctl * 10) / 10, Math.round(r.atl * 10) / 10]);
  const head = '<div class="fc-read" aria-live="polite" style="font-size:13px;min-height:20px;margin-top:2px"><span class="fc-rd muted">' + fcLbl(L1.d) + '</span> · <span style="color:var(--accent2);font-weight:600">Aptitud <b class="fc-rc">' + fcNum(L1.ctl) + '</b></span> · <span style="color:var(--accent);font-weight:600">Fatiga <b class="fc-ra">' + fcNum(L1.atl) + '</b></span> · <span style="font-weight:600">Forma <b class="fc-rt">' + fcSgn(tsb) + '</b></span></div>';
  let note = '';
  if (hasProj) { const e = proj[proj.length - 1], et = Math.round(e.ctl - e.atl); note = '<p class="muted" style="font-size:12px;margin-top:6px">Con las cargas de tu plan, tu forma el ' + fcLbl(e.d) + ' sería <b style="color:var(--text)">' + fcSgn(et) + '</b> (estimado).</p>'; }
  const tbl = '<details style="margin-top:8px"><summary class="muted" style="font-size:12px;cursor:pointer;min-height:32px"><span>Ver tabla</span>' + dcar() + '</summary><div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:6px"><thead><tr class="muted"><th align="left">Día</th><th align="right">Aptitud</th><th align="right">Fatiga</th><th align="right">Forma</th></tr></thead><tbody>' + rows.slice(-14).reverse().map((r) => '<tr style="border-top:1px solid var(--line)"><td>' + fcLbl(r.d) + '</td><td align="right">' + fcNum(r.ctl) + '</td><td align="right">' + fcNum(r.atl) + '</td><td align="right">' + fcSgn(r.ctl - r.atl) + '</td></tr>').join('') + '</tbody></table></div></details>';
  const rng = '<div class="row g6 wrap" role="group" aria-label="Periodo" style="margin-top:6px">' + [[30, '30 días'], [60, '60 días'], [90, '90 días']].map((x) => '<button type="button" class="chip" data-a="fcRange" data-v="' + x[0] + '" aria-pressed="' + ((o.range || 60) === x[0]) + '" style="min-height:36px;padding:0 12px;font-size:13px">' + x[1] + '</button>').join('') + '</div>';
  const legend = '<div class="row g16 wrap soft" style="font-size:13px;margin-top:6px"><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--accent2)"></i>Aptitud (CTL)</span><span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--accent)"></i>Fatiga (ATL)</span>' + (two ? '<span class="row g6"><i style="display:block;width:18px;height:3px;border-radius:2px;background:var(--text)"></i>Forma (TSB)</span>' : '') + '</div>';
  return '<div class="fcw" data-fc="' + String(JSON.stringify(data)).replace(/"/g, '&quot;') + '" data-l="' + L + '" data-pw="' + PW + '" data-n="' + N + '" data-d0="' + d0 + '" data-nr="' + rows.length + '">' + (o.noRange ? '' : rng) + '' + head + s + legend + (o.noNote ? '' : note) + (o.canProj ? '<div style="margin-top:4px"><button type="button" class="fcsw" role="switch" aria-checked="' + !!o.projOn + '" data-a="fcProj"><span class="fcsw-t"><i></i></span><span>Proyección del plan</span></button></div>' : '') + (o.noTable ? '' : tbl) + '</div>';
}
/* Lectura al tocar o pasar el dedo por el grafico */
function fcMove(e) {
  const w = e.target.closest && e.target.closest('.fcw'); if (!w || !e.target.classList.contains('fc-hit')) return;
  const svg = w.querySelector('.fc-svg'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, sx = vb.width / r.width, x = (e.clientX - r.left) * sx;
  const L = +w.dataset.l, PW = +w.dataset.pw, N = +w.dataset.n, i0 = Math.max(0, Math.min(N - 1, Math.round((x - L) * (N - 1) / PW)));
  let data; try { data = JSON.parse(w.dataset.fc); } catch (er) { return; }
  const dd = fcDate(w.dataset.d0); dd.setDate(dd.getDate() + i0); const key = fcYmd(dd), row = data.filter((q) => q[0] === key)[0]; if (!row) return;
  const xx = L + i0 * PW / Math.max(N - 1, 1), ln = w.querySelector('.fc-x'); ln.setAttribute('x1', xx); ln.setAttribute('x2', xx); ln.setAttribute('opacity', '.5');
  w.querySelector('.fc-rd').textContent = fcLbl(row[0]); w.querySelector('.fc-rc').textContent = fcNum(row[1]); w.querySelector('.fc-ra').textContent = fcNum(row[2]); w.querySelector('.fc-rt').textContent = fcSgn(row[1] - row[2]);
}


/* ---------- Gráfico ampliado (pantalla completa; también al girar el teléfono) ---------- */
let FZ = { fi: null, plan: null };
const zoomBtn = () => '<button type="button" class="chip fzbtn" data-a="fcZoom" aria-label="Ampliar el gráfico a pantalla completa">' + ph('arrows-out', 16) + '<span>Ampliar</span></button>';
const fzLand = () => window.innerWidth > window.innerHeight;
function fzHtml() {
  if (!UI.fz || !FZ.fi) return '';
  const land = fzLand(), size = land ? { W: 640, H1: 96, H2: 48, noNote: true } : { W: 340, H1: 210, H2: 100 };
  return '<div class="inner fzin"><div class="row between"><div class="eyebrow">Aptitud y fatiga · ' + Math.min(FZ.fi.ds.length, UI.fr || 60) + ' días</div><button type="button" class="x" data-a="fcZoomClose" style="color:var(--text);min-height:44px;border:0;background:transparent;font-weight:600;font-size:16px">Cerrar</button></div>'
    + (land ? '' : '<p class="muted" style="font-size:13px">Gira el teléfono para verlo más ancho.</p>')
    + formaChart(FZ.fi.ds, Object.assign({}, fcOpts(FZ.plan, FZ.fi), size, { noTable: true })) + '</div>';
}
async function fzOpen(auto) {
  UI.fz = true; UI.fzAuto = !!auto; render();
  if (auto || !(window.matchMedia && matchMedia('(pointer:coarse)').matches)) return;
  try { if (document.documentElement.requestFullscreen && !document.fullscreenElement) await document.documentElement.requestFullscreen(); if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { /* no disponible en este navegador */ }
}
function fzClose() {
  UI.fz = false; UI.fzAuto = false; render();
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); } catch (e) { /* sin soporte */ }
}
let fzT = null;
function fzCheck() {
  clearTimeout(fzT);
  fzT = setTimeout(() => {
    const land = fzLand(), phone = window.matchMedia && matchMedia('(max-height:520px)').matches;
    if (land && phone && !UI.fz && UI.view === 'datos' && FZ.fi && PREF.rotZoom !== false && !UI.flow && !UI.feedback && !UI.inbox && !TS && ST.user) fzOpen(true);
    else if (!land && UI.fz && UI.fzAuto) { UI.fz = false; UI.fzAuto = false; render(); }
    else if (UI.fz) render();
  }, 150);
}
window.addEventListener('resize', fzCheck);
window.addEventListener('orientationchange', fzCheck);
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && UI.fz && !UI.fzAuto && fzLand()) { /* el usuario salió de pantalla completa */ } });

/* Proyeccion hasta la meta del plan (o hasta la ultima sesion), maximo 60 dias. */
function fcProjFor(plan, last) {
  if (!plan || !plan.sessions || !last) return { proj: [], goal: null };
  const today = last.d, goal = plan.goal && plan.goal.date && plan.goal.date > today ? plan.goal : null;
  let end = goal ? goal.date : Object.keys(plan.sessions).filter((k) => k > today).sort().pop();
  if (!end) return { proj: [], goal: null };
  return { proj: fcProject(last, plan.sessions, end), goal };
}

const fcProjOn = () => { if (UI.fp == null) { let v = null; try { v = localStorage.getItem('camino.fproj'); } catch (e) { /* sin almacenamiento */ } UI.fp = v !== '0'; } return UI.fp; };
const fcOpts = (plan, fi) => { const pj = fcProjFor(plan, fi.last), can = pj.proj.length > 0, on = can && fcProjOn(); return { range: UI.fr || 60, proj: on ? pj.proj : [], goal: on ? pj.goal : null, canProj: can, projOn: on }; };
/* Salidas por semana: dias con actividad, ultimas 8 semanas, contra lo planificado. */
function weekBars(h, plan) {
  const mon = (d) => { const t = parse(d), m = new Date(t); m.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return ymd(m); };
  const wk = {}, seen = {};
  ((h && h.acts) || []).forEach((d) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || seen[d]) return; seen[d] = 1; const k = mon(d); wk[k] = (wk[k] || 0) + 1; });
  const pw = {}; if (plan && plan.sessions) Object.keys(plan.sessions).forEach((d) => { const k = mon(d); pw[k] = (pw[k] || 0) + 1; });
  const now = parse(off(0)), mon0 = new Date(now); mon0.setDate(now.getDate() - ((now.getDay() + 6) % 7)); const weeks = [];
  for (let i = 7; i >= 0; i--) { const m = new Date(mon0); m.setDate(mon0.getDate() - i * 7); const k = ymd(m); weeks.push({ k, v: wk[k] || 0, p: pw[k] || 0, cur: i === 0 }); }
  const mxw = Math.max.apply(null, weeks.map((x) => Math.max(x.v, x.p)).concat([2])), step = mxw <= 6 ? 2 : (mxw <= 12 ? 4 : 5), top = Math.ceil(mxw / step) * step;
  const W = 340, L = 30, R = 10, PW = W - L - R, T = 22, H = 96, B = T + H, slot = PW / 8, bw = Math.min(24, slot - 10);
  const done = weeks.filter((x) => !x.cur), avg = done.reduce((a, x) => a + x.v, 0) / Math.max(done.length, 1), bestV = Math.max.apply(null, weeks.map((x) => x.v));
  const Y = (v) => B - v / top * H;
  const lab = (k) => { const d = parse(k); return d.getDate() + ' ' + FC_MES[d.getMonth()]; };
  const txt = (x) => 'Semana del ' + lab(x.k) + ': ' + x.v + (x.v === 1 ? ' salida' : ' salidas') + (x.p ? ' · plan ' + x.p : '') + (x.cur ? ' (en curso)' : '');
  let s = '<svg viewBox="0 0 ' + W + ' ' + (B + 24) + '" width="100%" role="img" aria-label="Salidas por semana. ' + esc(weeks.map(txt).join('. ')) + '" style="display:block">';
  for (let v = 0; v <= top; v += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--line)" stroke-width="1"></line><text x="' + (L - 6) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + v + '</text>';
  weeks.forEach((x, i) => {
    const cx = L + slot * i + slot / 2, x0 = cx - bw / 2;
    if (x.p) s += '<rect x="' + x0.toFixed(1) + '" y="' + Y(x.p).toFixed(1) + '" width="' + bw + '" height="' + (B - Y(x.p)).toFixed(1) + '" rx="4" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3" opacity=".8"></rect>';
    if (x.v) { const y = Y(x.v), r = Math.min(4, (B - y) / 2); s += '<path class="wb-bar" d="M' + x0.toFixed(1) + ',' + B + 'L' + x0.toFixed(1) + ',' + (y + r).toFixed(1) + 'Q' + x0.toFixed(1) + ',' + y.toFixed(1) + ' ' + (x0 + r).toFixed(1) + ',' + y.toFixed(1) + 'L' + (x0 + bw - r).toFixed(1) + ',' + y.toFixed(1) + 'Q' + (x0 + bw).toFixed(1) + ',' + y.toFixed(1) + ' ' + (x0 + bw).toFixed(1) + ',' + (y + r).toFixed(1) + 'L' + (x0 + bw).toFixed(1) + ',' + B + 'Z" fill="' + (x.cur ? 'var(--accent)' : 'var(--accent2)') + '" opacity="' + (x.cur ? 1 : .55) + '"></path>'; }
    if (x.cur || (x.v === bestV && bestV > 0)) s += '<text x="' + cx.toFixed(1) + '" y="' + (Y(Math.max(x.v, x.p)) - 5).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + (x.cur ? 'var(--accent)' : 'var(--soft)') + '">' + x.v + '</text>';
    if (i % 2 === 1 || x.cur) s += '<text x="' + cx.toFixed(1) + '" y="' + (B + 16) + '" text-anchor="middle" font-size="10" fill="' + (x.cur ? 'var(--text)' : 'var(--muted)') + '"' + (x.cur ? ' font-weight="700"' : '') + '>' + (x.cur ? 'Esta' : lab(x.k)) + '</text>';
    s += '<rect class="wb-hit" x="' + (cx - slot / 2).toFixed(1) + '" y="' + (T - 14) + '" width="' + slot.toFixed(1) + '" height="' + (H + 40) + '" fill="transparent" data-t="' + esc(txt(x)) + '"></rect>';
  });
  if (done.some((x) => x.v) && avg > 0) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(avg).toFixed(1) + '" y2="' + Y(avg).toFixed(1) + '" stroke="var(--text)" stroke-width="1" opacity=".55"></line>';
  s += '</svg>';
  const cur = weeks[7], hasPlan = weeks.some((x) => x.p);
  return '<div class="wbw"><div class="wb-read" aria-live="polite" style="font-size:13px;min-height:20px">' + esc(txt(cur)) + '</div>' + s
    + '<div class="row g16 wrap soft" style="font-size:12px;margin-top:4px"><span class="row g6"><i style="display:block;width:12px;height:12px;border-radius:3px;background:var(--accent)"></i>Esta semana</span><span class="row g6"><i style="display:block;width:12px;height:12px;border-radius:3px;background:var(--accent2);opacity:.55"></i>Semanas anteriores</span>' + (hasPlan ? '<span class="row g6"><i style="display:block;width:12px;height:12px;border-radius:3px;border:1.5px dashed var(--muted)"></i>Plan</span>' : '') + (avg > 0 && done.some((x) => x.v) ? '<span class="row g6"><i style="display:block;width:14px;height:2px;background:var(--text);opacity:.55"></i>Promedio ' + (Math.round(avg * 10) / 10).toLocaleString('es-CL') + '</span>' : '') + '</div></div>';
}
function wbMove(e) {
  const t = e.target; if (!t || !t.classList || !t.classList.contains('wb-hit')) return;
  const w = t.closest('.wbw'), r = w && w.querySelector('.wb-read'); if (r) r.textContent = t.getAttribute('data-t') || '';
}
function histBlock(a) {
  const h = ST.athHist[a.id], fi = formaInfo(h);
  if (!fi) return '<div><div class="eyebrow">Forma y carga</div><p class="muted" style="font-size:13px;margin-top:6px">Aún sin historial. Se sincroniza solo desde intervals.icu o puedes cargarlo en “Gestionar a ' + esc(a.first) + '”.</p></div>';
  const tsb = fi.tsb, lectura = tsb <= -25 ? 'muy cargado: cuida la recuperación' : (tsb <= -10 ? 'cargado, en zona de trabajo' : (tsb <= 5 ? 'equilibrado' : (tsb <= 20 ? 'fresco' : 'muy fresco')));
  FZ = { fi: fi, plan: ST.athPlan[a.id] };
  return '<div><div class="row between"><div class="eyebrow">Forma y carga · ' + fi.ds.length + ' días</div>' + zoomBtn() + '</div>' + formaChart(fi.ds, fcOpts(ST.athPlan[a.id], fi))
    + '<p class="soft" style="font-size:15px;margin-top:8px">Forma (TSB) ' + (tsb > 0 ? '+' : '') + tsb + ' al ' + esc(fi.last.d) + ': ' + lectura + '.</p>'
    + '<div class="eyebrow" style="margin-top:14px">Salidas por semana · últimas 8</div>' + weekBars(h, ST.athPlan[a.id])
    + '<div class="muted" style="font-size:12px;margin-top:6px">Datos de intervals.icu' + (h.updatedAt ? ' · cargado ' + relTime(h.updatedAt) : '') + '. De Strava llegan solo las fechas de las salidas, sin duración ni potencia.</div></div>';
}
const formaLectura = (tsb) => (tsb <= -25 ? 'Vienes con mucha carga. Prioriza dormir, comer bien y bajar la intensidad.' : (tsb <= -10 ? 'Vienes cargado, y es normal cuando se entrena: tu cuerpo está asimilando el trabajo.' : (tsb <= 5 ? 'Carga y descanso están en un buen equilibrio.' : (tsb <= 20 ? 'Tus piernas vienen frescas: buen momento para rendir.' : 'Vienes muy fresco. Mantén algo de actividad suave para no enfriarte.'))));
/* Zona de la forma: el numero toma el color de su estado; aptitud y fatiga, los del grafico. */
const FZ_RNG = { 'Muy cargado': 'menos de −25', 'Cargado': '−25 a −10', 'Equilibrio': '−10 a +5', 'Fresco': '+5 a +20', 'Muy fresco': 'más de +20' };
const formaZona = (t) => (t <= -25 ? { c: 'var(--bad)', n: 'Muy cargado' } : (t <= -10 ? { c: 'var(--warn)', n: 'Cargado' } : (t <= 5 ? { c: 'var(--soft)', n: 'Equilibrio' } : (t <= 20 ? { c: 'var(--good)', n: 'Fresco' } : { c: 'var(--good)', n: 'Muy fresco' }))));
function formaGauge(t) {
  const pos = Math.max(0, Math.min(100, (t + 40) / 80 * 100));
  return '<div style="position:relative;margin-top:6px" role="img" aria-label="Forma ' + t + ': ' + formaZona(t).n + '"><div class="gauge" aria-hidden="true"><i style="flex:15;background:var(--bad);opacity:.85"></i><i style="flex:15;background:var(--warn);opacity:.9"></i><i style="flex:15;background:var(--track)"></i><i style="flex:15;background:var(--good);opacity:.7"></i><i style="flex:20;background:var(--good)"></i></div><span class="gmk" style="left:calc(' + pos.toFixed(1) + '% - 2px)"></span></div><div class="gl" aria-hidden="true"><span>Muy cargado −25</span><span>Equilibrio</span><span>+20 Muy fresco</span></div>';
}
function formaCard(fi, link) {
  const t = fi.tsb, z = formaZona(t);
  return '<section class="card col g10" aria-label="Tu forma"><div class="row between"><div class="eyebrow">Tu forma</div>' + (link ? '<a href="#datos" class="muted" style="font-size:13px;text-decoration:underline">Ver mis datos</a>' : '') + '</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr">' + [[(t > 0 ? '+' : '') + t, z.c, 'Forma'], [f1(fi.last.ctl), 'var(--accent2)', 'Aptitud'], [f1(fi.last.atl), 'var(--accent)', 'Fatiga']].map(function (x, i) { return '<div class="col g6" style="align-items:center;text-align:center;padding:4px 4px;' + (i ? 'border-left:1px solid var(--line)' : '') + '"><span class="num" style="font-size:38px;line-height:1;color:' + x[1] + '">' + x[0] + '</span><span class="muted" style="font-size:13px">' + x[2] + '</span></div>'; }).join('') + '</div><div class="fzone" style="border-color:' + z.c + '"><b style="color:' + z.c + '">' + z.n + '</b><span class="muted">Forma ' + (t > 0 ? '+' : '') + t + ' · zona de ' + FZ_RNG[z.n] + '</span></div>' + formaGauge(t) + '<p class="soft" style="font-size:15px;margin-top:4px">' + formaLectura(t) + '</p></section>';
}
/* ---------- Vista: Datos (historial del propio atleta) ---------- */
/* Ultimas actividades (desde intervals.icu): las que estaban en el plan y las que el atleta hizo por su cuenta. */
/* Salidas triviales (menos de 2 km o de 10 min) no se listan: suelen ser pruebas de sensor o inicios accidentales. */
const trivialAct = (x) => (x.km != null && Number(x.km) < 2) || (x.min != null && Number(x.min) < 10);
const recentActs = (h) => (h && Array.isArray(h.recent) ? h.recent.filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(String(x.d || '')) && !trivialAct(x)).slice(0, 25) : []);
/* Nombres por defecto de Garmin en inglés, a español. */
const ACTNM = [[/\bIndoor Cycling\b/i, 'Ciclismo indoor'], [/\bVirtual Cycling\b/i, 'Ciclismo virtual'], [/\bRoad Cycling\b/i, 'Ciclismo de ruta'], [/\b(Gravel|Unpaved) Cycling\b/i, 'Ciclismo gravel'], [/\bMountain Biking\b/i, 'Mountain bike'], [/\bStrength Training\b/i, 'Fuerza'], [/\bCycling\b/i, 'Ciclismo']];
const actName = (n) => { let t = String(n || 'Actividad'); for (let i = 0; i < ACTNM.length; i++) if (ACTNM[i][0].test(t)) { t = t.replace(ACTNM[i][0], ACTNM[i][1]); break; } return t; };
function syncAgo(h) {
  if (!h || !h.updatedAt) return null; const hrs = Math.floor((Date.now() - Number(h.updatedAt)) / 3600000);
  return { hrs, late: hrs >= 48, txt: hrs < 1 ? 'hace menos de 1 hora' : hrs < 24 ? 'hace ' + hrs + (hrs === 1 ? ' hora' : ' horas') : 'hace ' + Math.floor(hrs / 24) + (Math.floor(hrs / 24) === 1 ? ' día' : ' días') };
}
function recentCard(h, n) {
  const rs = recentActs(h).slice(0, n || 5), sy = syncAgo(h); if (!rs.length && !sy) return '';
  const rows = rs.map((x, i) => {
    const d = parse(x.d), meta = [x.km ? String(x.km).replace('.', ',') + ' km' : '', x.min ? minText(x.min) : '', x.l ? 'carga ' + x.l : ''].filter(Boolean).join(' · ');
    return '<button type="button" class="row between g12" data-a="actOpen" data-v="' + i + '" aria-label="Ver detalle de ' + esc(actName(x.n)) + '" style="align-items:center;width:100%;min-height:56px;padding:8px 0 0;border:0;border-top:1px solid var(--line);background:transparent;font:inherit;color:inherit;text-align:left;cursor:pointer"><span class="col g4" style="min-width:0"><span style="font-weight:600">' + esc(actName(x.n)) + '</span><span class="muted" style="font-size:13px">' + cap(WD[d.getDay()]) + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + (meta ? ' · ' + esc(meta) : '') + '</span></span><span class="row g8" style="align-items:center"><span class="pill">' + (x.p ? 'Del plan' : 'Extra') + '</span>' + (x.r ? '<span class="pill" title="Tiene recorrido">Mapa</span>' : '') + '<span aria-hidden="true" style="display:inline-flex">' + ph('caret-right', 16) + '</span></span></button>';
  }).join('');
  return '<section class="card col g10" aria-label="Últimas actividades"><div class="eyebrow">Últimas actividades</div>' + (rows || '<p class="soft">Cuando se sincronice una salida, aparecerá aquí.</p>')
    + (sy ? '<p class="muted" style="font-size:12px;margin-top:6px">Sincronizado con intervals.icu ' + sy.txt + '.' + (sy.late ? ' Hace tiempo que no llegan datos nuevos: avísale a tu coach para revisarlo.' : '') + '</p>' : '') + '</section>';
}

/* ---------- Detalle de actividad y recorrido ---------- */
function decodePoly(str) {
  const out = []; let i = 0, la = 0, lo = 0;
  while (i < str.length) {
    let b, sh = 0, r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32 && i <= str.length); la += (r & 1) ? ~(r >> 1) : (r >> 1);
    sh = 0; r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32 && i <= str.length); lo += (r & 1) ? ~(r >> 1) : (r >> 1);
    out.push([la / 1e5, lo / 1e5]);
  }
  return out;
}
function routeSvg(r) {
  const P = decodePoly(String(r.p || '')); if (P.length < 2) return '';
  const W = 342, H = 300, la = P.map((q) => q[0]), lo = P.map((q) => q[1]), y0 = Math.min.apply(null, la), y1 = Math.max.apply(null, la), x0 = Math.min.apply(null, lo), x1 = Math.max.apply(null, lo), k = Math.cos((y0 + y1) / 2 * Math.PI / 180);
  const sc = Math.min((W - 40) / Math.max((x1 - x0) * k, 1e-6), (H - 40) / Math.max(y1 - y0, 1e-6)), ox = (W - (x1 - x0) * k * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
  const xy = P.map((q) => [ox + (q[1] - x0) * k * sc, oy + (y1 - q[0]) * sc]);
  let far = 0, fd = -1; xy.forEach((q, j) => { const d = Math.hypot(q[0] - xy[0][0], q[1] - xy[0][1]); if (d > fd) { fd = d; far = j; } });
  const path = 'M' + xy.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Trazo del recorrido de la salida" style="display:block;border-radius:16px;background:var(--track);max-height:340px"><path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<circle cx="' + xy[0][0].toFixed(1) + '" cy="' + xy[0][1].toFixed(1) + '" r="6" fill="var(--good)" stroke="var(--surface)" stroke-width="2"/>'
    + (fd > 14 ? '<circle cx="' + xy[far][0].toFixed(1) + '" cy="' + xy[far][1].toFixed(1) + '" r="6" fill="var(--text)" stroke="var(--surface)" stroke-width="2"/><text x="' + (xy[far][0] > W / 2 ? (xy[far][0] - 11).toFixed(1) : (xy[far][0] + 11).toFixed(1)) + '" y="' + (xy[far][1] + 4).toFixed(1) + '" font-size="12" font-weight="700" fill="var(--text)" text-anchor="' + (xy[far][0] > W / 2 ? 'end' : 'start') + '">Más lejano</text>' : '') + '</svg>';
}
function elevSvg(r) {
  const A = Array.isArray(r.a) ? r.a.filter((v) => typeof v === 'number') : []; if (A.length < 3) return '';
  const mn = Math.min.apply(null, A), mx = Math.max.apply(null, A), sp = Math.max(mx - mn, 1), n = A.length;
  const pts = A.map((v, i) => (i / (n - 1) * 342).toFixed(1) + ' ' + (80 - (v - mn) / sp * 70).toFixed(1));
  return '<svg viewBox="0 0 342 90" width="100%" role="img" aria-label="Perfil de altitud de ' + Math.round(mn) + ' a ' + Math.round(mx) + ' metros" style="display:block"><path d="M' + pts.join(' L') + ' L342 90 L0 90Z" fill="var(--accent)" fill-opacity=".18" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/></svg>';
}
function actSheetHtml() {
  const A = UI.act, x = A.x, r = A.route, d = parse(x.d);
  const tile = (v, l) => '<div class="col g4" style="background:var(--surface);border-radius:16px;padding:12px 14px"><span class="num" style="font-size:24px;line-height:1.05">' + v + '</span><span class="muted" style="font-size:12px">' + l + '</span></div>';
  const km = x.km || (r && r.km) || 0, tiles = [];
  if (km) tiles.push(tile(String(km).replace('.', ',') + ' km', 'Distancia'));
  if (x.min) tiles.push(tile(minText(x.min), 'Tiempo en movimiento'));
  const stopped = (x.el && x.min && x.el >= x.min) ? x.el - x.min : null;
  if (x.el) tiles.push(tile(minText(x.el), 'Tiempo total'));
  if (stopped != null) tiles.push(tile(minText(stopped), 'Tiempo detenido'));
  if (km && x.min) tiles.push(tile(f1(km / (x.min / 60)) + ' km/h', 'Velocidad media'));
  if (r && r.gain != null) tiles.push(tile(r.gain + ' m', 'Desnivel positivo'));
  if (r && r.max != null) tiles.push(tile(r.max + ' m', 'Altitud máxima'));
  if (x.np) tiles.push(tile(x.np + ' W', 'Potencia normalizada'));
  if (x.w) tiles.push(tile(x.w + ' W', 'Potencia media'));
  if (x.hr) tiles.push(tile(x.hr + ' lpm', 'FC media' + (x.hrx ? ' · máx. ' + x.hrx : '')));
  if (x.l) tiles.push(tile(x.l, 'Carga de la salida'));
  let body;
  if (r === undefined) body = '<section class="card" aria-live="polite"><p class="soft">Cargando recorrido…</p></section>';
  else if (!r) body = '<section class="card col g8"><div class="eyebrow">Recorrido</div><p class="soft">' + (A.err ? 'No pudimos cargar el recorrido ahora. Reintenta en un momento.' : 'Esta salida no trae recorrido. Ocurre cuando viene de Strava o se grabó sin GPS.') + '</p></section>';
  else body = '<section class="card col g10" aria-label="Recorrido">' + routeSvg(r) + '<div class="row g12" style="font-size:12px;flex-wrap:wrap"><span class="row g8" style="align-items:center"><i style="width:10px;height:10px;border-radius:5px;background:var(--good);display:inline-block"></i>Salida</span><span class="row g8" style="align-items:center"><i style="width:10px;height:10px;border-radius:5px;background:var(--text);display:inline-block"></i>Punto más lejano</span></div><p class="muted" style="font-size:12px">Solo la ven tú y tu coach. No se comparte con nadie más.</p></section>'
    + (elevSvg(r) ? '<section class="card col g6" aria-label="Perfil de altitud"><div class="row between"><div class="eyebrow">Perfil de altitud</div><span class="muted" style="font-size:12px">' + r.min + ' – ' + r.max + ' m</span></div>' + elevSvg(r) + '</section>' : '');
  return '<div class="inner"><div class="stack"><div class="row between"><div class="col g4" style="min-width:0"><div class="muted" style="font-size:14px">' + cap(WD[d.getDay()]) + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + '</div><h1 class="title">' + esc(actName(x.n)) + '</h1></div><button type="button" class="x" data-a="actClose" style="color:var(--text);min-height:44px;border:0;background:transparent;font-weight:600;font-size:16px">Cerrar</button></div>'
    + '<div class="row g8"><span class="pill">' + (x.p ? 'Del plan' : 'Extra') + '</span></div>' + body
    + (stopped != null && x.el > 0 ? '<section class="card col g8" aria-label="Pedaleado y detenido"><div class="eyebrow">Pedaleado vs. detenido</div><div role="img" aria-label="' + Math.round(x.min / x.el * 100) + ' por ciento del tiempo en movimiento y ' + Math.round(stopped / x.el * 100) + ' por ciento detenido" style="display:flex;height:16px;border-radius:8px;overflow:hidden;background:var(--track)"><i style="flex:' + x.min + ';background:var(--accent)"></i><i style="flex:' + Math.max(stopped, 0) + ';background:var(--track)"></i></div><div class="row between" style="font-size:13px"><span><b>' + Math.round(x.min / x.el * 100) + '%</b> en movimiento · ' + minText(x.min) + '</span><span><b>' + Math.round(stopped / x.el * 100) + '%</b> detenido · ' + minText(stopped) + '</span></div></section>' : '')
    + (tiles.length ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + tiles.join('') + '</div>' : '') + '</div></div>';
}
function viewDatos() {
  const a = meA(), fi = formaInfo(ST.myHist);
  let out = '<div class="inner"><div class="stack">' + head('Tu historial', 'Mis datos') + msgBanner();
  if (!fi) out += loadCard(loadInfo(a)) + '<section class="card" aria-label="Forma y carga"><div class="eyebrow">Forma y carga</div><p class="soft" style="margin-top:8px">Tu coach cargará aquí tu historial de forma, fatiga y salidas. Mientras tanto, tus check-ins ya cuentan.</p></section>';
  else {
    out += formaCard(fi, false);
    out += loadCard(loadInfo(a));
    FZ = { fi: fi, plan: ST.myPlan };
    out += '<section class="card" aria-label="Curva de forma"><div class="row between"><div class="eyebrow">Aptitud y fatiga · ' + Math.min(fi.ds.length, UI.fr || 60) + ' días</div>' + zoomBtn() + '</div>' + formaChart(fi.ds, fcOpts(ST.myPlan, fi))
      + '<p class="muted" style="font-size:13px;margin-top:10px"><b>Aptitud</b>: la base que has construido entrenando. <b>Fatiga</b>: el cansancio de tus últimos días. <b>Forma</b>: aptitud menos fatiga; positiva significa piernas frescas, negativa significa que estás cargando trabajo.</p></section>';
    out += '<section class="card" aria-label="Salidas por semana"><div class="eyebrow">Salidas por semana · últimas 8</div>' + weekBars(ST.myHist, ST.myPlan) + '<p class="muted" style="font-size:12px;margin-top:8px">Cuenta los días con actividad. La barra naranja es la semana en curso y el contorno punteado, lo que marcaba tu plan. Datos de intervals.icu' + (ST.myHist.updatedAt ? ', cargados ' + relTime(ST.myHist.updatedAt) : '') + '.</p></section>';
  }
  out += recentCard(ST.myHist, 8);
  const cks = a.checkins.slice().sort((x, y) => (x.date < y.date ? 1 : (x.date > y.date ? -1 : 0))).slice(0, 10), sk = streak(a);
  out += '<section class="card" aria-label="Bienestar"><div class="row between"><div class="eyebrow">Tu bienestar · 7 días</div><div class="muted" style="font-size:13px">Racha: ' + sk.n + (sk.n === 1 ? ' día' : ' días') + '</div></div><div style="margin-top:8px">' + dualChart(a) + '</div>' + dualLegend() + '</section>';
  out += '<section class="card col g10" aria-label="Tus check-ins"><div class="eyebrow">Tus últimos check-ins</div>' + (cks.length ? cks.map((c) => {
    const d = parse(c.date), sc = score(c), b = band(sc);
    return '<div class="row between g12" style="align-items:flex-start;padding-top:8px;border-top:1px solid var(--line)"><div class="col g4" style="min-width:0"><span style="font-weight:600">' + cap(WD[d.getDay()]) + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + '</span><span class="muted" style="font-size:13px">' + (c.type === 'actividad' ? (c.activity && c.activity.name ? esc(c.activity.name) : 'Actividad') : (c.type === 'descanso' ? 'Descanso' : 'Bienestar')) + ' · Ánimo ' + esc(at(MOODS, c.mood - 1).toLowerCase()) + (c.rpe ? ' · RPE ' + c.rpe : '') + '</span></div><span style="font-weight:600;font-size:14px;color:' + b.color + ';flex:none">' + (sc == null ? '–' : sc + ' · ' + b.label) + '</span></div>';
  }).join('') : '<p class="soft">Aún no hay check-ins. Tu primer registro aparecerá aquí.</p>') + '</section>';
  return out + '</div></div>';
}
function histForm(a) {
  if (!UI.histDraft || UI.histDraft.id !== a.id) UI.histDraft = { id: a.id, text: '' };
  return '<div class="col g12 mform"><div class="info" role="note">' + infoIcon() + '<span>Normalmente no necesitas hacer esto: el historial se sincroniza solo cada 30 minutos. Úsalo para cargarlo a mano; reemplaza el anterior.</span></div><label for="histText" class="muted" style="font-size:13px">Historial en JSON (days con d, ctl y atl; acts con fechas)</label><textarea id="histText" spellcheck="false" placeholder="{ &quot;days&quot;: [{ &quot;d&quot;: &quot;2026-10-27&quot;, &quot;ctl&quot;: 29.8, &quot;atl&quot;: 49.7 }], &quot;acts&quot;: [&quot;2026-10-25&quot;] }" style="min-height:200px;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + esc(UI.histDraft.text) + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="saveHist" style="justify-content:center;width:auto;padding:0 20px;min-height:48px"' + (UI.busy ? ' disabled' : '') + '>Guardar historial</button><button type="button" class="chip" data-a="histToggle">Cerrar</button></div></div>';
}
function parseHist(text) {
  let o; try { o = JSON.parse(text); } catch (e) { return { err: 'El texto no es un JSON válido. Revisa comillas y comas.' }; }
  const D = /^\d{4}-\d{2}-\d{2}$/;
  if (!o || typeof o !== 'object' || !Array.isArray(o.days)) return { err: 'Falta la lista days con d, ctl y atl.' };
  if (o.days.length > 120) return { err: 'Hay demasiados días (máximo 120).' };
  const days = [];
  for (const x of o.days) { if (!x || !D.test(x.d || '') || !(x.ctl >= 0 && x.ctl <= 500) || !(x.atl >= 0 && x.atl <= 500)) return { err: 'Revisa el día ' + (x && x.d) + ': fecha AAAA-MM-DD y ctl/atl entre 0 y 500.' }; const dd = { d: x.d, ctl: Math.round(x.ctl * 10) / 10, atl: Math.round(x.atl * 10) / 10 }; if (x.l != null && x.l >= 0 && x.l <= 2000) dd.l = Math.round(x.l); days.push(dd); }
  const acts = o.acts == null ? [] : o.acts;
  if (!Array.isArray(acts) || acts.length > 200 || acts.some((d) => !D.test(d))) return { err: 'acts debe ser una lista de hasta 200 fechas AAAA-MM-DD.' };
  return { hist: { days, acts } };
}
const PLAN_TEMPLATE = { goal: { name: 'Nombre de la meta', date: 'AAAA-MM-DD', dateText: '1 de noviembre', detail: 'lugar · distancia' }, phases: [{ n: 'Base', s: 'Semanas 1 a 4 · completada', to: 'AAAA-MM-DD' }], sessions: { 'AAAA-MM-DD': { name: 'Rodillo Z2', min: 45, km: 0, load: 35, note: 'Opcional' } }, notes: { 'AAAA-MM-DD': 'Mensaje para ese día' } };
const planToText = (pl) => { const o = pl ? { goal: pl.goal, phases: pl.phases, sessions: pl.sessions, notes: pl.notes } : PLAN_TEMPLATE; try { return JSON.stringify(o, null, 1); } catch (e) { return ''; } };
function planForm(a) {
  const pl = ST.athPlan[a.id];
  if (!UI.planDraft || UI.planDraft.id !== a.id) UI.planDraft = { id: a.id, text: planToText(pl) };
  return '<div class="col g12 mform"><div class="info" role="note">' + infoIcon() + '<span>Pega el plan en formato JSON: meta, fases, sesiones por fecha y notas por día. El atleta lo ve en Hoy y en Ruta.</span></div><label for="planText" class="muted" style="font-size:13px">Plan en JSON</label><textarea id="planText" spellcheck="false" style="min-height:260px;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + esc(UI.planDraft.text) + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="savePlan" style="justify-content:center;width:auto;padding:0 20px;min-height:48px"' + (UI.busy ? ' disabled' : '') + '>Guardar plan</button><button type="button" class="chip" data-a="planToggle">Cerrar</button></div></div>';
}
const dShort = (k) => { const d = parse(k); return d.getDate() + ' ' + FC_MES[d.getMonth()]; };
const mrow = (dot, title, lines, btn) => '<div class="mrow"><div class="col grow g4" style="min-width:0"><span class="row g8" style="font-weight:600;font-size:16px;align-items:center"><span class="dot" style="background:' + dot + ';flex:none" aria-hidden="true"></span>' + title + '</span>' + lines.map((l) => '<span class="muted" style="font-size:13px">' + l + '</span>').join('') + '</div>' + btn + '</div>';
/* Gestion del atleta: plan, historial y vista, en una sola tarjeta. */
function manageCard(a) {
  const pl = ST.athPlan[a.id], h = ST.athHist[a.id], today = off(0);
  let out = '<section class="card col g4" aria-label="Gestionar atleta" style="padding-bottom:8px"><div class="eyebrow" style="margin-bottom:6px">Gestionar a ' + esc(a.first) + '</div>';
  // plan
  let dot = 'var(--muted)', lines = ['Sin plan cargado', 'Pégalo en JSON y lo verá en Hoy y Ruta'], btn = '<button type="button" class="chip" data-a="planToggle" style="border-color:var(--accent);color:var(--accent);font-weight:600">' + (UI.planOpen ? 'Cerrar' : 'Cargar plan') + '</button>';
  if (pl) {
    const fut = Object.keys(pl.sessions || {}).filter((k) => k >= today).sort(), g = pl.goal;
    dot = fut.length ? 'var(--good)' : 'var(--warn)'; lines = [];
    if (g) lines.push(esc(g.name) + (g.date >= today ? ' · en ' + diffDays(today, g.date) + ' días' : ' · ya pasó'));
    lines.push(fut.length ? fut.length + (fut.length === 1 ? ' sesión' : ' sesiones') + ' por delante · próxima el ' + dShort(fut[0]) : 'Sin sesiones por delante: conviene cargar el siguiente bloque');
    if (pl.updatedAt) lines.push('Actualizado ' + relTime(pl.updatedAt));
    btn = '<button type="button" class="chip" data-a="planToggle">' + (UI.planOpen ? 'Cerrar' : 'Editar') + '</button>';
  }
  out += mrow(dot, 'Plan', lines, btn) + (UI.planOpen ? planForm(a) : '');
  // historial
  const nd = histDays(h).length, na = h && Array.isArray(h.acts) ? h.acts.length : 0, age = h && h.updatedAt ? diffDays(ymd(new Date(h.updatedAt)), today) : null;
  dot = !h ? 'var(--muted)' : (age != null && age > 3 ? 'var(--warn)' : 'var(--good)');
  lines = h ? [nd + ' días de forma · ' + na + ' salidas', (h.updatedAt ? 'Sincronizado ' + relTime(h.updatedAt) : 'Cargado a mano') + (age != null && age > 3 ? ' · desactualizado' : '')] : ['Sin historial aún', 'Se sincroniza solo cada hora'];
  out += mrow(dot, 'Historial de forma', lines, '<button type="button" class="chip" data-a="histToggle">' + (UI.histOpen ? 'Cerrar' : 'Cargar a mano') + '</button>') + (UI.histOpen ? histForm(a) : '');
  // perfil y medidas
  if (canProfile()) { const b = ST.athBio[a.id] || {}, np = Object.keys((b.meas && b.meas.prop) || {}).length, lines2 = b.main ? [[ageOf(b.main.birthDate) != null ? ageOf(b.main.birthDate) + ' años' : '', b.main.heightCm ? b.main.heightCm + ' cm' : '', b.main.sport || ''].filter(Boolean).join(' · ') || 'Perfil iniciado'] : ['Aún no completa su perfil'];
    if (np) lines2.push(np + (np === 1 ? ' propuesta' : ' propuestas') + ' por revisar');
    out += mrow(np ? 'var(--accent)' : (b.main ? 'var(--good)' : 'var(--muted)'), 'Perfil y medidas', lines2, '<button type="button" class="chip" data-a="bioTgl" data-v="' + esc(a.id) + '">' + (UI.bioOpen === a.id ? 'Cerrar' : (np ? 'Revisar' : 'Ver')) + '</button>') + (UI.bioOpen === a.id ? bioPanel(a) : ''); }
  // vista del atleta
  if (isOwner()) { const on = !!(a.features && a.features.planificar === true); out += mrow(on ? 'var(--good)' : 'var(--muted)', 'Planificar y modo en vivo', ['Pestaña para planificar eventos y seguirlos en vivo', on ? 'Habilitado para ' + esc(a.first) : 'No habilitado'], '<button type="button" class="chip" role="switch" aria-checked="' + on + '" aria-pressed="' + on + '" aria-label="Habilitar Planificar para ' + esc(a.first) + '" data-a="featToggle" data-v="' + esc(a.id) + '"' + (UI.busy ? ' disabled' : '') + '>Habilitado</button>'); }
  out += mrow('var(--accent2)', 'Ver la app como ' + esc(a.first), ['Solo lectura: Hoy, Datos y Ruta tal como los ve'], '<button type="button" class="chip" data-a="verComo" data-v="' + esc(a.id) + '">Abrir</button>');
  if (isOwner()) out += mrow('var(--muted)', 'Historial de Tally', ['Trae sus check-ins anteriores a la app', 'No pisa los días que ya tiene'], '<button type="button" class="chip" data-a="importTally" data-v="' + esc(a.id) + '"' + (UI.busy ? ' disabled' : '') + '>Importar</button>');
  return out + '</section>';
}
function parsePlan(text) {
  let o; try { o = JSON.parse(text); } catch (e) { return { err: 'El texto no es un JSON válido. Revisa comillas y comas.' }; }
  const D = /^\d{4}-\d{2}-\d{2}$/, str = (v, n) => typeof v === 'string' && v.length <= n;
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { err: 'El plan debe ser un objeto con meta, fases y sesiones.' };
  const out = {};
  if (o.goal != null) { const g = o.goal; if (!g || !str(g.name, 80) || !D.test(g.date || '') || !str(g.dateText || '', 40) || !str(g.detail || '', 120)) return { err: 'La meta necesita name y date con formato AAAA-MM-DD.' }; out.goal = { name: g.name, date: g.date, dateText: g.dateText || '', detail: g.detail || '' }; }
  out.phases = [];
  if (o.phases != null) { if (!Array.isArray(o.phases) || o.phases.length > 12) return { err: 'Las fases deben ser una lista de hasta 12.' }; for (const p of o.phases) { if (!p || !str(p.n, 60) || !str(p.s || '', 160) || (p.to != null && !D.test(p.to))) return { err: 'Cada fase necesita n, s y to con formato AAAA-MM-DD.' }; out.phases.push({ n: p.n, s: p.s || '', to: p.to || null }); } }
  out.sessions = {};
  if (o.sessions != null) { const ks = Object.keys(o.sessions); if (ks.length > 120) return { err: 'Hay demasiadas sesiones (máximo 120).' }; for (const k of ks) { const x = o.sessions[k]; if (!D.test(k) || !x || !str(x.name, 80) || !str(x.note || '', 400) || (x.min != null && !(x.min >= 0 && x.min <= 1000)) || (x.km != null && !(x.km >= 0 && x.km <= 1000)) || (x.load != null && !(x.load >= 0 && x.load <= 2000))) return { err: 'Revisa la sesión del ' + k + ': fecha AAAA-MM-DD, nombre y números válidos.' }; out.sessions[k] = { name: x.name, min: x.min == null ? null : Number(x.min), km: x.km == null ? 0 : Number(x.km), load: x.load == null ? null : Number(x.load), note: x.note || '' }; } }
  out.notes = {};
  if (o.notes != null) { for (const k of Object.keys(o.notes)) { if (!D.test(k) || !str(o.notes[k], 300)) return { err: 'Revisa la nota del ' + k + '.' }; out.notes[k] = o.notes[k]; } }
  return { plan: out };
}


/* ---------- Vista: Guía (como se llenan los datos) ---------- */
const GUIA_BASE = [
  { k: 'Hoy', t: 'Tu estado de hoy', ic: 'hoy', p: ['El círculo es un puntaje de 0 a 100 que sale de tu último check-in: ánimo, calidad del sueño, sensación de piernas y estrés. Se promedian y se muestra como semáforo.', '<b>70 o más</b>: listo para rodar. <b>50 a 69</b>: ve con calma. <b>Menos de 50</b>: hoy toca cuidarte y avisar a tu coach.', 'Si hoy no hiciste check-in, usa el de ayer o el último que tengas, y lo dice debajo.'] },
  { k: 'Constancia', t: 'Por qué el check-in diario importa', ic: 'sueno', p: ['Camino se completa, en gran medida, con las respuestas de tus <b>check-ins diarios</b>. Cada uno suma una pieza: cómo dormiste, cómo están tus piernas, tu ánimo y tu esfuerzo.', 'Con esas piezas tu coach ve cómo respondes al entrenamiento, reconoce tu esfuerzo y ajusta el plan a tu momento real. Sin ellas, el plan se queda solo en números.', 'No necesitas que sea perfecto: <b>1 minuto al día</b> basta. Mientras más constante seas, más claro se ve tu progreso.', 'Son <b>dos registros independientes</b>: el <b>Estado del día</b> (sueño, piernas, estrés, ánimo) y las <b>Sensaciones post-entreno</b> (esfuerzo, clima, comida e hidratación). Haz uno, el otro o ambos, y corrígelos cuando quieras. En el post-entreno eliges <b>Bici</b> (MTB, Ruta o Gravel), <b>Gym</b> u <b>Otra</b>, y puedes registrar hasta <b>2 sesiones</b> en un día. Si hoy fue distinto, toca <b>“Hoy fue distinto”</b>.'] },
  { k: 'Check-in', t: 'Cómo se llena el check-in', ic: 'sueno', p: ['Lo llenas tú en Hoy, en 1 minuto. Hay tres tipos: <b>actividad</b> (saliste a entrenar), <b>bienestar</b> (cómo amaneciste) y <b>descanso</b>.', 'Si registras una molestia, tu coach la ve de inmediato y puede escribirte una nota. Esa nota aparece en Hoy.', 'Los check-ins son privados: solo los ven tú y tu coach. El equipo nunca ve tu bienestar ni tus molestias.'] },
  { k: 'Aptitud', t: 'Aptitud: lo que has construido', ic: 'datos', p: ['La aptitud (CTL) es tu base de entrenamiento. Es un promedio ponderado de tu carga de los últimos 42 días aproximadamente.', 'Sube lento, con semanas constantes, y baja lento si paras. Una sola salida larga casi no la mueve.', 'Más aptitud significa que tu cuerpo tolera más trabajo. Es la línea que más importa mirar en el largo plazo.'] },
  { k: 'Fatiga', t: 'Fatiga: el cansancio reciente', ic: 'racha', p: ['La fatiga (ATL) es el promedio de tu carga de los últimos 7 días aproximadamente.', 'Sube rápido con una salida dura y baja rápido con un par de días suaves. Es normal que se dispare después de un fin de semana largo.', 'Por sí sola no es mala: solo dice cuánto trabajo acumulaste esta semana.'] },
  { k: 'Forma', t: 'Forma: aptitud menos fatiga', ic: 'cinco', p: ['La forma (TSB) es la resta: aptitud menos fatiga. Es el número grande que ves en "Tu forma".', 'Debajo de los tres números, una etiqueta dice tu zona con palabras y con su rango: <b>Muy cargado</b> (menos de −25), <b>Cargado</b> (−25 a −10), <b>Equilibrio</b> (−10 a +5), <b>Fresco</b> (+5 a +20) y <b>Muy fresco</b> (más de +20). El color acompaña, pero el texto es lo que manda.', '<b>Positiva</b>: piernas frescas, buen momento para una prueba o carrera. <b>Cerca de cero</b>: equilibrio. <b>Negativa</b>: estás cargando trabajo, que es normal en bloques de construcción.', 'Si baja de -25, tu coach lo marca como alerta. Antes de una meta, el plan busca que llegues con forma positiva.'] },
  { k: 'Datos', t: 'De dónde salen los números', ic: 'datos', p: ['Aptitud, fatiga y salidas vienen de intervals.icu, donde se conectan tus actividades de Strava o Garmin. Un proceso automático las trae <b>cada hora</b> a Camino.', 'Las salidas por semana cuentan los días con actividad registrada. Los kilómetros y minutos no se traen desde Strava por una limitación de la conexión.', 'Tu bienestar, racha e insignias vienen solo de tus check-ins en Camino, no de intervals.icu.'] },
  { k: 'Sensores', t: 'Equípate para medir tu esfuerzo', ic: 'datos', p: ['Para medir tu esfuerzo y planificar con precisión conviene salir con <b>tres sensores</b>: de <b>frecuencia cardíaca</b> (banda pectoral o de brazo), de <b>cadencia</b> y de <b>velocidad</b>.', 'La frecuencia cardíaca y la cadencia permiten estimar la carga de tus salidas y leer tu fatiga. Un sensor óptico de muñeca falla más en intervalos, frío y terreno irregular; una banda de brazo o pectoral es más fiable.', 'Si ya tienes alguno guardado, revisa primero la pila. Y recuerda: sin medidor de potencia no se calculan vatios, pero la carga estimada por frecuencia cardíaca mejora mucho con buenos sensores.'] },
  { k: 'Semana', t: 'Tu semana', ic: 'semana', p: ['Cada columna es un día. El contorno punteado es lo que dice tu plan y el relleno es lo que ya hiciste.', 'Una sesión cuenta como hecha cuando haces un check-in de tipo <b>actividad</b> ese día.', '<b>Toca la tarjeta</b> (o una columna) para abrir el detalle: cada día con lo planificado, lo que hiciste y las notas de tu coach, más el resumen de sesiones, tiempo y kilómetros. Con las flechas de abajo ves semanas anteriores y la próxima.', 'El plan lo carga tu coach. Si no ves sesiones, es que aún no te carga ese bloque.'] },
  { k: 'Racha', t: 'Racha e insignias', ic: 'racha', p: ['<b>Racha</b>: días seguidos con check-in, de cualquier tipo. Si hoy aún no lo haces, cuenta desde ayer. Si saltas un día, vuelve a 0.', '<b>7 días seguidos</b>: siete días consecutivos con check-in. <b>Sueño parejo</b>: 5 noches de los últimos 7 con buen sueño. <b>Semana completa</b>: cumplir todas las sesiones del plan de esta semana. <b>Cinco actividades</b>: 5 actividades registradas en 14 días.', 'La barra de progreso de cada insignia dice cuánto te falta. Las que logras quedan encendidas.'] },
  { k: 'Camino', t: 'Tu camino recorrido', ic: 'ruta', p: ['En Ruta, "Ver mi resumen" muestra tres pantallas: tus <b>salidas registradas</b>, tu <b>mejor semana</b> y lo que ha hecho tu <b>equipo</b> este mes.', 'Las salidas salen del historial de intervals.icu y de tus check-ins de actividad. La mejor semana usa los minutos registrados, y si no hay minutos, usa la cantidad de salidas.', 'Mientras más constante seas con los check-ins, más completo queda el resumen.'] },
  { k: 'Equipo', t: 'Meta del equipo', ic: 'cabina', p: ['"Equipo" es el <b>grupo de atletas</b> al que te asigna tu coach (GRNT o ZN). No se refiere a tu bicicleta ni a tus kilómetros personales.', 'La lámina "Tu equipo" suma los <b>kilómetros del grupo en el mes</b> y los compara con la meta mensual. Ejemplo: "1.240 km juntos este mes. Entre 4 atletas ya van al 62%".', 'Esos kilómetros salen de lo que cada atleta anota en su check-in de actividad, no de intervals.icu. Si no anotas km, no suman. Si prefieres no aparecer, apaga <b>Compartir mis km con el equipo</b> en Ajustes.', 'El equipo ve solo kilómetros, metas e hitos. Nunca bienestar, molestias ni notas. Si eres coach, esa lámina suma los dos equipos.'] }
];

const GUIA_NUEVAS = {
  toca: { k: 'Hoy toca', t: 'Lo que toca hoy', ic: 'hoy', p: ['Al abrir Hoy, lo primero es la tarjeta <b>Hoy toca</b>: la sesión de tu plan con su duración, sus kilómetros y la nota del día si tu coach dejó una.', 'Si tu check-in dice <b>descanso</b> pero tu plan marcaba una sesión, Camino te pregunta qué pasó: <b>Sí la hice</b> abre el registro de tu sesión y <b>Descansé, no la hice</b> deja guardado que el descanso fue a propósito, y tu coach lo ve en tu último check-in. Así no ve dos mensajes distintos.', 'Si el plan de hoy está vacío, la tarjeta no aparece: es un día libre.'] },
  proy: { k: 'Proyección', t: 'Proyección del plan', ic: 'cinco', p: ['En Datos, el interruptor <b>Proyección del plan</b> (verde) añade al gráfico una zona punteada hasta tu meta.', 'Se calcula con las cargas de cada sesión de tu plan, usando el mismo modelo de aptitud (42 días) y fatiga (7 días). Por eso es una <b>estimación</b>: si el plan no trae cargas, la línea queda plana.', 'La frase de abajo te dice cómo llegarías a la meta: positiva significa piernas frescas ese día. También puedes activarlo en Ajustes.'] },
  ampliar: { k: 'Ampliar', t: 'Ver el gráfico más grande', ic: 'datos', p: ['En Datos, toca <b>Ampliar</b> (arriba a la derecha del gráfico) para verlo a pantalla completa. Los rangos de 30, 60 y 90 días, la lectura al arrastrar el dedo y la proyección funcionan igual.', '<b>Gira el teléfono</b> a horizontal estando en Datos y el gráfico se abre solo, más ancho. Al volver a vertical se cierra. Si no te gusta, apaga <b>Ampliar el gráfico al girar</b> en Ajustes.', 'En algunos teléfonos, como los iPhone, la pantalla no se puede bloquear en horizontal: gira el teléfono tú mismo. Para salir, toca <b>Cerrar</b>.'] },
  alerta: { k: 'Alerta', t: 'La línea roja de −25', ic: 'racha', p: ['En el panel de forma, la línea roja marca −25. Por debajo de ese valor tu coach recibe una alerta de carga muy alta.', 'No es un error ni un castigo: ocurre después de bloques largos o eventos grandes, como un brevet. Lo importante es que venga seguido de descanso.', 'Si te ves cerca de la línea, avisa cómo te sientes en tu check-in.'] },
  salidas: { k: 'Salidas', t: 'Salidas por semana', ic: 'semana', p: ['Cada barra es una semana, de lunes a domingo, y cuenta los <b>días con actividad</b>. Toca una barra para leer su detalle arriba.', 'La barra naranja es la semana en curso, que aún está incompleta. El contorno punteado es lo que marcaba tu plan, y la línea fina es tu promedio.', 'Los datos vienen de intervals.icu y se actualizan cada hora.'] },
  corregir: { k: 'Corregir', t: 'Corregir o borrar un check-in', ic: 'sueno', p: ['Si te equivocaste, en Hoy toca <b>Corregir check-in</b>: se abre con tus respuestas y al enviar reemplaza el de hoy.', '<b>Borrar check-in</b> lo elimina de tu historial, de tu racha y de los kilómetros del equipo de ese día. Pide confirmación antes de borrar.', 'Solo se puede corregir o borrar el check-in de hoy.'] },
  coach: { k: 'Coach', t: 'Responder y gestionar', ic: 'cabina', p: ['En Cabina, los atletas aparecen <b>ordenados por urgencia</b>: primero quien espera respuesta o está en alerta, luego quien lleva días sin check-in, y al final los que están al día. Cada fila dice el motivo. <b>N por responder</b> te lleva al primer atleta pendiente. Las respuestas rápidas se envían con un toque y tienes 5 segundos para <b>Deshacer</b>. El lápiz las abre para editarlas.', '<b>Ver la app como…</b> muestra Hoy, Datos y Ruta tal como los ve ese atleta, en solo lectura.', 'En <b>Gestionar</b> ves el estado de su plan e historial. El historial se sincroniza solo cada hora; cargarlo a mano es el respaldo.', 'El interruptor Coach / Atleta de arriba cambia entre esta vista y la tuya como atleta.'] }
};
function guiaSlides() {
  const B = GUIA_BASE.slice(), N = GUIA_NUEVAS, at = (k) => B.findIndex((x) => x.k === k);
  B.splice(at('Hoy') + 1, 0, N.toca);
  B.splice(at('Forma') + 1, 0, N.ampliar, N.proy, N.alerta);
  B.splice(at('Semana') + 1, 0, N.salidas);
  B.splice(at('Check-in') + 1, 0, N.corregir);
  if (isCoach()) B.push(N.coach);
  return B;
}
function viewGuia() {
  const GUIA = guiaSlides(), n = GUIA.length;
  const slides = GUIA.map((g, i) => '<article class="gslide" aria-roledescription="diapositiva" aria-label="' + (i + 1) + ' de ' + n + '"><div class="card col g12" style="min-height:100%"><div class="row g12" style="align-items:center"><span class="gic">' + (NAVIC[g.ic] ? ph(NAVIC[g.ic], 28, 'var(--accent)') : icon(g.ic, 28, 'var(--accent)')) + '</span><div class="eyebrow">' + esc(g.k) + ' · ' + (i + 1) + ' de ' + n + '</div></div><h2 class="h2">' + esc(g.t) + '</h2>' + g.p.map((x) => '<p class="soft">' + x + '</p>').join('') + '</div></article>').join('');
  const dots = GUIA.map((g, i) => '<button type="button" class="gdot" data-a="guiaGo" data-v="' + i + '" aria-label="Ir a ' + esc(g.k) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>').join('');
  return '<div class="inner"><div class="stack">' + head('Cómo funciona Camino', 'Guía') + '<p class="muted" style="font-size:14px">Desliza hacia el lado para ver cómo se llena cada dato.</p><button type="button" class="btn ghost" data-a="tour" style="border:1.5px solid var(--line);color:var(--text)"><span>Ver recorrido de bienvenida</span></button><section class="card col g12" aria-label="Tutoriales animados"><div class="eyebrow">Tutoriales animados</div><p class="soft" style="font-size:15px">Mira paso a paso dónde tocar y qué puedes hacer en cada pantalla. Puedes repetirlos cuando quieras.</p><div class="tutgrid">' + tutIds().map((k) => '<button type="button" class="tutcard" data-a="tutOpen" data-v="' + k + '"><span class="gic">' + tutIc(TUT[k].ic) + '</span><span class="col" style="text-align:left"><b>' + esc(TUT[k].t) + '</b><span class="muted" style="font-size:12px">' + esc(TUT[k].sub) + '</span></span></button>').join('') + '</div></section><div class="gdots" id="gdots" role="group" aria-label="Diapositivas">' + dots + '</div><div class="gtrack" id="gtrack" tabindex="0">' + slides + '</div>' + fbForm() + '<p class="muted" style="font-size:13px;text-align:center;margin-top:8px">Camino · versión ' + APP_VER + '</p></div></div>';
}



/* ---------- Versión y novedades ---------- */
const APP_VER = 57;
const NEWS = [
  'Planificar y el modo en vivo se habilitan atleta por atleta desde la tarjeta Gestionar de cada uno.',
  'Planificar ahora tiene modo en vivo: inicia tu evento, di dónde estás con el GPS o el km del ciclocomputador, y ve si vas adelantado o atrasado y cuánto falta para el próximo control.',
  'Nueva pestaña Planificar: crea un evento (por ejemplo un brevet), carga su recorrido en GPX y calcula tus horarios con las ventanas de apertura y cierre de cada control.',
  'El detalle de la actividad ahora incluye potencia, frecuencia cardíaca y tiempo pedaleado frente a detenido. Las salidas muy cortas ya no se listan y los nombres de Garmin salen en español.',
  'Ahora puedes tocar una actividad para ver su detalle: distancia, tiempo, desnivel y el recorrido dibujado con su perfil de altitud. Solo lo ves tú y tu coach.',
  // Más nueva primero. El aviso de actualización muestra solo las primeras NEWS_SHOW para que quepan en pantalla.
  'Nueva tarjeta de últimas actividades: ves lo que hiciste, con nombre, km y carga, y si estaba en tu plan o fue extra. Tu plan se sincroniza solo desde intervals.icu.',
  'Los coaches de apoyo ahora tienen el interruptor Coach/Atleta: pueden ver su propia forma, aptitud y plan como cualquier atleta.',
  'Mensajes entre coaches: el coach principal y cada coach de apoyo pueden escribirse desde Ajustes, con aviso en la campana.',
  'Las propuestas de los coaches de apoyo ahora avisan en la campana: el coach principal ve las nuevas y quien propuso ve la respuesta.',
  'Nueva pestaña Perfil: completa tu ficha por secciones (equipamiento, disponibilidad, objetivos y más) para que tu plan se ajuste mejor. La Guía ahora está dentro de Ajustes.',
  'Check-in más corto cuando descansas o no pudiste entrenar, y el botón Atrás vuelve a donde estabas.',
  'Coaches de apoyo: el coach principal define qué equipos y atletas ve cada uno, si puede editar y si ve perfiles. Tu salud y tu contacto de emergencia ahora van en un lugar aparte, solo para ti y tu coach principal.',
  'Hoy empieza por lo que toca hoy y te pregunta si hubo un cambio entre tu plan y tu check-in.',
  'Tu forma ahora dice su estado con palabras y rangos, no solo con color.',
  'Cabina ordena a los atletas por urgencia y muestra el motivo de cada uno.',
  'Las notas del coach con más de una semana se marcan como antiguas.',
  'Botones más grandes y bordes más visibles en todos los temas.',
  'Nuevo perfil: tus datos, medidas que confirma tu coach y control de tu información.',
  'Gym más simple: todo en una pantalla y una pregunta de carga según lo que trabajaste.',
  'Íconos nuevos y botones planos que se hunden al elegirlos.',
  'En Gym, una figura humana para marcar las zonas que trabajaste y si hubo molestia.',
  'Registra dos sesiones el mismo día.',
  'Modo oscuro con luz y filete al elegir, y tutoriales renovados.',
  'Aviso automático cuando hay una versión nueva de la app.',
  'Nueva tarjeta de carga (TSS) en Datos: cuánto te costó la semana, comparado con tu promedio.',
  'Los avisos aparecen abajo, junto a donde tocas, y el gráfico de bienestar explica cada línea.'
];
const NEWS_SHOW = 4;
const newsKey = () => 'camino.news.' + (ST.user ? ST.user.uid : '');
/* ---------- Recorrido de bienvenida (primera vez y desde Guía/Ajustes) ---------- */
function tourSlides() {
  const sl = [
    { c: 's0', ic: 'hoy', k: 'Bienvenida', t: 'Esto es Camino', p: 'Tu coach y tú en un solo lugar. Camino se completa con tus check-ins diarios: con ellos tu coach refleja tu esfuerzo y ajusta tu plan. En 1 minuto te muestro cómo se usa.' },
    { c: 's1', ic: 'hoy', k: 'Hoy', t: 'Tu check-in diario', p: 'En Hoy ves primero lo que toca según tu plan y respondes cómo dormiste, tus piernas, tu ánimo y tu estrés, y registras tu sesión: bici, gym u otra, con tu esfuerzo y, en gym, las zonas que trabajaste en una figura. Tu coach lo ve al instante. Si te equivocas, puedes corregirlo o borrarlo.' },
    { c: 's2', ic: 'datos', k: 'Datos', t: 'Aptitud, fatiga y forma', p: 'Aptitud es lo que has construido, fatiga es el cansancio de esta semana y forma es la resta entre ambas. Activa "Proyección del plan" para ver cómo llegarías a tu meta.' },
    { c: 's0', ic: 'ruta', k: 'Ruta', t: 'Tu plan y tu camino', p: 'Aquí ves la semana, tus sesiones, tu meta y "Ver mi resumen" con tus salidas, tu mejor semana y los kilómetros de tu equipo.' },
    { c: 's1', ic: 'ajustes', k: 'Ajustes', t: 'Hazla tuya', p: 'Cambia el tono visual, activa el recordatorio diario y decide con un interruptor si compartes tus km con el equipo.' },
    { c: 's2', ic: 'guia', k: 'Guía', t: 'Si te queda una duda', p: 'En la pestaña Guía desliza las tarjetas para ver cómo se llena cada dato. Puedes volver a este recorrido cuando quieras desde ahí.', btn: 'Empezar' }
  ];
  if (UI.tourNews) sl.unshift({ c: 's1', ic: 'hoy', k: 'Novedades', t: 'Camino se actualizó', p: '', list: NEWS.slice(0, NEWS_SHOW), btn: 'Ver el recorrido' });
  if (isCoach()) sl.splice(UI.tourNews ? 5 : 4, 0, { c: 's0', ic: 'cabina', k: 'Cabina', t: 'Tu panel de coach', p: 'En Cabina ves a los atletas ordenados por urgencia, con el motivo de cada uno, abres a cada atleta, cargas su plan e historial y usas "Ver la app como" para ver lo que ve cada uno. El interruptor de arriba cambia entre tu vista de coach y la tuya.' });
  return sl;
}
function tourHtml() {
  if (UI.tour == null) return '';
  const sl = tourSlides(), i = Math.min(UI.tour, sl.length - 1), s = sl[i], last = i === sl.length - 1;
  const ico = (i === 0 && s.k !== 'Novedades' && myTeam() && TEAM_LOGO[myTeam()]) ? teamLogo(myTeam(), 'full', 120, true) : (NAVIC[s.ic] ? ph(NAVIC[s.ic], 64) : '');
  return '<div class="story tour ' + s.c + '" role="dialog" aria-label="Recorrido de bienvenida" id="tourbox"><div class="inner"><div class="row g8" aria-hidden="true">' + sl.map((x, k) => '<i style="flex:1;height:4px;border-radius:2px;background:currentColor;opacity:' + (k <= i ? 1 : .3) + '"></i>').join('') + '</div><div class="row between" style="margin-top:6px"><button type="button" class="x" data-a="tourBack"' + (i === 0 ? ' style="visibility:hidden"' : '') + '>Atrás</button><button type="button" class="x" data-a="tourClose">Saltar</button></div><div class="col g14" style="flex:1;min-height:0;' + (s.list ? 'overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 0' : 'justify-content:center') + '"><div>' + ico + '</div><div style="font-size:13px;letter-spacing:.12em;font-weight:600;text-transform:uppercase">' + esc(s.k) + ' · ' + (i + 1) + ' de ' + sl.length + '</div><div style="font-family:var(--font-d);font-weight:700;font-size:clamp(36px,11vw,52px);line-height:1.05">' + esc(s.t) + '</div>' + (s.list ? '<ul style="font-size:18px;line-height:1.4;padding-left:20px;display:grid;gap:8px">' + s.list.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p style="font-size:19px;line-height:1.45">' + esc(s.p) + '</p>') + '</div><button type="button" class="sbtn" data-a="tourNext">' + (last ? (s.btn || 'Empezar') : 'Siguiente') + '</button></div></div>';
}
const tourKey = () => 'camino.tour.' + (ST.user ? ST.user.uid : '');
function tourMaybeOpen() {
  if (UI.tourChecked === (ST.user && ST.user.uid) || !ST.ready || !ST.user || !ST.profile) return;
  UI.tourChecked = ST.user.uid;
  let seen = null, nv = null; try { seen = localStorage.getItem(tourKey()); nv = localStorage.getItem(newsKey()); } catch (e) { /* sin almacenamiento */ }
  if (!seen) { UI.tour = 0; UI.tourNews = false; try { localStorage.setItem(newsKey(), String(APP_VER)); } catch (e) { /* sin almacenamiento */ } }
  else if (Number(nv || 0) < APP_VER) { UI.tourNews = true; UI.tour = 0; }
}
function tourDone() { UI.tour = null; UI.tourNews = false; try { localStorage.setItem(tourKey(), '1'); localStorage.setItem(newsKey(), String(APP_VER)); } catch (e) { /* sin almacenamiento */ } render(); }

/* ---------- Tutoriales animados (se pueden repetir desde Guía) ---------- */
const tmN = (id) => '<span class="tmn" id="m-nav-' + id + '">' + (NAVIC[id] ? ph(NAVIC[id], 20) : '') + '</span>';
const tmNav = (ids) => '<div class="tmnav">' + ids.map(tmN).join('') + '</div>';
const tmTop = (r) => '<div class="tmtop"><b>CAMINO</b><span class="tmchip"' + (r ? ' id="m-mode"' : '') + '>' + (r || 'Atleta') + '</span></div>';
const tmSw = (id, k) => '<span class="tmsw" id="' + id + '" data-on="' + k + '"><i></i></span>';
const tmL = (w) => '<i class="tml" style="width:' + w + '%"></i>';
const TNAV = () => (isCoach() ? ['cabina', 'ajustes', 'guia'] : ['hoy', 'datos', 'ruta', 'perfil', 'ajustes']);
const TUT = {
  hoy: {
    t: 'Hoy', ic: 'hoy', sub: 'Tu check-in y tu semana',
    mock: () => tmTop() + '<div class="tmc col g6" id="m-toca"><span class="tml" style="width:60%"></span><div class="row g6"><span class="tmopt">Sí la hice</span><span class="tmopt">Descansé</span></div></div><div class="tmc row g10" id="m-score"><span class="tmring">78</span><div class="col g6" style="flex:1">' + tmL(70) + tmL(45) + '</div></div><div class="tmbtn" id="m-btn">Hacer check-in</div><div class="tmc col g6" id="m-chips"><div class="tml" style="width:35%"></div><div class="tmpo"><span>Mal</span><span data-on="3">Bien</span><span>Genial</span></div></div><div class="row g8"><div class="tmc" id="m-week" style="flex:1"><div class="tmwk"><i style="height:60%"></i><i style="height:35%"></i><i style="height:80%"></i><i style="height:20%"></i><i style="height:55%"></i></div></div><div class="tmc col g4" id="m-streak" style="width:34%"><b style="font-size:18px">5</b><span class="tml" style="width:80%"></span></div></div><div class="tmpill" id="m-edit">Corregir check-in</div>' + tmNav(TNAV()),
    steps: [
      { at: 'm-nav-hoy', say: 'Abajo, toca <b>Hoy</b>. Es tu pantalla de inicio.' },
      { at: 'm-toca', say: 'Arriba está <b>Hoy toca</b>: la sesión de tu plan. Si tu check-in dice descanso y el plan pedía entrenar, Camino te pregunta cuál fue: <b>Sí la hice</b> o <b>Descansé</b>, y tu coach ve tu respuesta.' },
      { at: 'm-score', say: 'Este círculo es tu puntaje de hoy, de 0 a 100. Se calcula con tu último check-in: en verde estás listo para rodar.' },
      { at: 'm-btn', say: 'Toca <b>Hacer check-in</b>. Son pocas preguntas y toma 1 minuto. Si entrenaste, también registras tu sesión (mira el tutorial <b>Registro</b>).' },
      { at: 'm-chips', say: 'Responde tocando una opción de texto en cada pregunta: la que eliges se <b>hunde</b>, como un botón pulsado. Al final toca <b>Enviar</b>.' },
      { at: 'm-week', say: '<b>Tu semana</b>: el contorno es lo que dice tu plan y el relleno lo que ya hiciste. <b>Tócala</b> para ver el detalle de cada día y la próxima semana.' },
      { at: 'm-streak', say: 'La <b>racha</b> cuenta tus días seguidos con check-in. Si saltas un día, vuelve a 0.' },
      { at: 'm-edit', say: '¿Te equivocaste? Toca <b>Corregir check-in</b> para cambiarlo, o bórralo desde ahí.' }
    ]
  },
  registro: {
    t: 'Registro', ic: 'hoy', sub: 'Tu sesión: bici, gym u otra',
    mock: () => tmTop() + '<div class="tmtiles" id="m-types"><span class="tmt">' + ph('bicycle', 16) + 'Bici</span><span class="tmt" data-on="0">' + ph('barbell', 16) + 'Gym</span><span class="tmt">' + ph('person-simple-run', 16) + 'Otra</span></div><div class="tmc col g6" id="m-dur"><div class="tml" style="width:50%"></div><div class="tmpo"><span>-30</span><span data-on="1">30-60</span><span>60-90</span><span>+90</span></div></div><div class="tmc col g6" id="m-rpe"><div class="tmrpe">' + [1,2,3,4,5,6,7,8,9,10].map((n) => '<i style="height:' + (14 + n * 5) + 'px"' + (n === 7 ? ' data-on="2"' : '') + '></i>').join('') + '</div></div><div class="tmc row g10" id="m-zones" style="align-items:center"><div class="tmfig">' + gzFigure('front', { chest: 1, quads: 1, shoulders: 1 }, null) + '</div><div class="col g6" style="flex:1">' + tmL(80) + tmL(55) + '</div></div><div class="tmc row g8" id="m-mol" style="align-items:center;justify-content:space-between"><span class="tml" style="width:45%"></span>' + tmSw('m-molsw', 4) + '</div><div class="tmpill" id="m-two">+ Segunda sesión</div>',
    steps: [
      { at: 'm-types', say: 'Elige el tipo de sesión: <b>Bici</b>, <b>Gym</b> u <b>Otra</b>. Cada tipo hace sus propias preguntas.' },
      { at: 'm-dur', say: 'Las opciones son <b>texto sobre el fondo</b>: la que eliges se hunde. Va en verde si el dato es neutro (como la duración).' },
      { at: 'm-rpe', say: 'Marca tu <b>esfuerzo</b> (RPE) tocando una barra: más alta, más duro. Debajo verás la descripción en palabras.' },
      { at: 'm-zones', say: 'En Gym, toca la <b>figura humana</b> para marcar las zonas que trabajaste y su intensidad. Cambia entre Frente y Espalda.' },
      { at: 'm-mol', say: 'Si una zona te molestó, activa el interruptor <b>Molestia</b> y descríbela. Tu coach recibe el aviso al instante.' },
      { at: 'm-two', say: '¿Entrenaste dos veces hoy? Toca <b>Segunda sesión</b> y repite el registro. Quedan las dos en el mismo día.' }
    ]
  },
  datos: {
    t: 'Datos', ic: 'datos', sub: 'Aptitud, fatiga y forma',
    mock: () => tmTop() + '<div class="tmc row g10" id="m-load" style="align-items:flex-end"><b style="font-size:26px">385</b><span class="tmrpe" style="flex:1;height:30px"><i style="height:60%"></i><i style="height:70%"></i><i style="height:55%"></i><i style="height:80%"></i></span></div><div class="tmc col g6" id="m-forma"><div class="tm3"><b style="color:var(--good)">+12</b><b style="color:var(--accent2)">47</b><b style="color:var(--accent)">35</b></div><div class="tmgauge"><i></i></div></div><div class="row g6" id="m-rng"><span class="tmchip2">30 d</span><span class="tmchip2">60 d</span><span class="tmchip2" data-on="2">90 d</span></div><div class="row between"><span class="tml" style="width:40%"></span><span class="tmchip2" id="m-zoom">Ampliar</span></div><div class="tmc" id="m-chart"><svg viewBox="0 0 200 70" width="100%" height="70" aria-hidden="true"><path d="M0 50 C30 48 40 20 70 30 S110 52 140 34 S180 20 200 28" fill="none" stroke="var(--accent)" stroke-width="2.5"/><path d="M0 56 C40 54 80 46 120 44 S170 40 200 38" fill="none" stroke="var(--accent2)" stroke-width="2.5"/></svg></div><div class="row between tmc" id="m-sw-row"><span class="tml" style="width:50%"></span>' + tmSw('m-sw', 5) + '</div><div class="tmc" id="m-bars"><div class="tmwk"><i style="height:30%"></i><i style="height:70%"></i><i style="height:50%"></i><i style="height:90%"></i><i style="height:40%"></i></div></div>' + tmNav(TNAV()),
    steps: [
      { at: 'm-nav-datos', say: 'Toca <b>Datos</b> en el menú de abajo.' },
      { at: 'm-forma', say: '<b>Tu forma</b> junto a tu aptitud (azul) y tu fatiga (naranja). Una etiqueta escrita te dice tu zona (Equilibrio, Cargado, Fresco…) con su rango, y el medidor la muestra.' },
      { at: 'm-load', say: '<b>Tu carga</b> (TSS): cuánto te costó entrenar en 7 días, comparado con tu promedio. Una hora a tu umbral vale 100. Úsalo para ver tu tendencia.' },
      { at: 'm-rng', say: 'Cambia el rango del gráfico: <b>30, 60 o 90 días</b>.' },
      { at: 'm-chart', swipe: true, say: '<b>Arrastra el dedo</b> sobre el gráfico para leer el valor de cada día.' },
      { at: 'm-zoom', say: 'Toca <b>Ampliar</b> para ver el gráfico a pantalla completa. También se abre solo si <b>giras el teléfono</b> a horizontal.' },
      { at: 'm-sw', say: 'Activa <b>Proyección del plan</b> para ver cómo llegarías a tu meta con las cargas de tu plan.' },
      { at: 'm-bars', say: '<b>Salidas por semana</b>: toca una barra para ver el detalle de esa semana.' }
    ]
  },
  ruta: {
    t: 'Ruta', ic: 'ruta', sub: 'Tu plan y tu camino',
    mock: () => tmTop() + '<div class="tmc col g6" id="m-ph"><div class="tmphase"><i style="flex:3;background:var(--good)"></i><i style="flex:4;background:var(--accent)"></i><i style="flex:2"></i></div>' + tmL(60) + '</div><div class="tmbtn" id="m-res" style="background:var(--accent)">Ver mi resumen</div><div class="tmc col g6" id="m-team"><b style="font-size:20px">1.240 km</b>' + tmL(70) + '<div class="tmgauge"><i style="left:62%"></i></div></div><div class="tmc row g6" id="m-badges"><span class="tmbadge"></span><span class="tmbadge"></span><span class="tmbadge off"></span><span class="tmbadge off"></span></div>' + tmNav(TNAV()),
    steps: [
      { at: 'm-nav-ruta', say: 'Toca <b>Ruta</b> en el menú de abajo.' },
      { at: 'm-ph', say: '<b>Fases del plan</b>: dónde estás hoy y cuánto falta para tu meta.' },
      { at: 'm-res', say: 'Toca <b>Ver mi resumen</b>: se abren tres pantallas con tus salidas, tu mejor semana y tu equipo. Pasa con <b>Siguiente</b> o deslizando.' },
      { at: 'm-team', say: 'Aquí ves los <b>kilómetros del equipo</b> en el mes y qué tan cerca van de la meta.' },
      { at: 'm-badges', say: 'Las <b>insignias</b> premian tu constancia: las que están apagadas aún no las consigues.' }
    ]
  },
  ajustes: {
    t: 'Ajustes', ic: 'ajustes', sub: 'Hazla tuya',
    mock: () => tmTop() + '<div class="tmc row g10"><span class="tmav">D</span><div class="col g6" style="flex:1">' + tmL(60) + tmL(40) + '</div></div><div class="tmc row g8" id="m-tone"><span class="tmtone" style="background:#c2410c"></span><span class="tmtone" style="background:#2563eb" data-on="1"></span><span class="tmtone" style="background:#15803d"></span><span class="tmtone" style="background:#475569"></span></div><div class="tmc row between" id="m-rem-row"><span class="tml" style="width:55%"></span>' + tmSw('m-rem', 2) + '</div><div class="tmc row between" id="m-share-row"><span class="tml" style="width:62%"></span>' + tmSw('m-share', 3) + '</div>' + tmNav(TNAV()),
    steps: [
      { at: 'm-nav-ajustes', say: 'Toca <b>Ajustes</b> en el menú de abajo.' },
      { at: 'm-tone', say: 'Elige un <b>tono visual</b> con un toque. Se guarda en tu teléfono.' },
      { at: 'm-rem', say: 'Activa el <b>recordatorio diario</b> y escoge la hora que prefieras.' },
      { at: 'm-share', say: 'Decide con un interruptor si <b>compartes tus km con el equipo</b>. Tu coach siempre ve tus check-ins.' }
    ]
  },
  cabina: {
    t: 'Cabina', ic: 'cabina', sub: 'Panel del coach', coach: true,
    mock: () => tmTop('Coach') + '<div class="tmbtn" id="m-pend" style="background:var(--accent-soft);color:var(--accent);border:1.5px solid var(--accent)">3 por responder</div><div class="tmc col g6" id="m-qr"><span class="tml" style="width:65%"></span><div class="row g6"><span class="tmopt">Enviar</span><span class="tmopt">Editar</span></div></div><div class="tmc row g8" id="m-ath"><span class="tmav">C</span><div class="col g6" style="flex:1">' + tmL(55) + tmL(35) + '</div></div><div class="tmc row between" id="m-as"><span class="tml" style="width:55%"></span><span class="tmchip2">Ver como</span></div>' + tmNav(TNAV()),
    steps: [
      { at: 'm-mode', say: 'El interruptor de arriba cambia entre tu <b>vista de coach</b> y tu <b>vista de atleta</b>.' },
      { at: 'm-pend', say: '<b>N por responder</b> te lleva al primer atleta que espera respuesta.' },
      { at: 'm-qr', say: 'Las <b>respuestas rápidas</b> se envían con un toque. Tienes 5 segundos para <b>Deshacer</b>; el lápiz las abre para editarlas.' },
      { at: 'm-ath', say: 'Los atletas van <b>ordenados por urgencia</b> y cada uno muestra su motivo. Toca uno para ver su detalle, cargar su plan e historial o aceptar solicitudes.' },
      { at: 'm-as', say: '<b>Ver la app como</b>: mira exactamente lo que ve ese atleta en Hoy, Datos y Ruta.' }
    ]
  },
  guia: {
    t: 'Guía', ic: 'guia', sub: 'Aprende y escríbenos',
    mock: () => tmTop() + '<div class="tmc col g6" id="m-slide"><div class="tml" style="width:45%;height:12px"></div>' + tmL(90) + tmL(80) + tmL(60) + '</div><div class="tmdots"><i></i><i></i><i></i><i></i></div><div class="tmc col g6" id="m-fb"><div class="row g6"><span class="tmopt">Consulta</span><span class="tmopt" data-on="2">Idea</span><span class="tmopt">Comentario</span></div><div class="tmarea"></div><div class="tmbtn" style="min-height:26px">Enviar</div></div>' + tmNav(TNAV()),
    steps: [
      { at: 'm-nav-guia', say: 'Toca <b>Guía</b> en el menú de abajo.' },
      { at: 'm-slide', swipe: true, say: '<b>Desliza hacia el lado</b> para recorrer cada explicación: aptitud, fatiga, bienestar, racha y más.' },
      { at: 'm-fb', say: 'Al final puedes enviar una <b>consulta, idea o comentario</b>: elige el tipo, escribe y toca Enviar. Tu coach lo recibe.' }
    ]
  }
};
const tutIc = (id) => ph(NAVIC[id] || 'calendar-check', 24, 'var(--accent)');
const tutIds = () => ['hoy', 'registro', 'datos', 'ruta', 'ajustes'].filter((k) => !isCoach() || k !== 'hoy' || true).concat(isCoach() ? ['cabina'] : []).concat(['guia']);
let TS = null;
const tutReduced = () => !!(PREF.calm || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches));
function tutDraw() {
  const T = TUT[TS.id], el = document.getElementById('tut'), n = T.steps.length;
  el.innerHTML = '<div class="tuthead"><div class="col"><div class="eyebrow">Tutorial · ' + esc(T.t) + '</div><div class="muted" style="font-size:13px">' + esc(T.sub) + '</div></div><button type="button" class="x" data-a="tutClose" style="color:var(--text)">Cerrar</button></div>'
    + '<div class="tutbody"><div class="tstage" id="tstage"><div class="tph" id="tph">' + T.mock() + '</div><span class="tfing" id="tfing" aria-hidden="true"><i></i></span></div>'
    + '<div class="tcap" id="tcap" role="status" aria-live="polite"></div>'
    + '<div class="row g8" id="tdots" style="justify-content:center" aria-hidden="true">' + T.steps.map((s, i) => '<i class="tdot" data-a="tutGo" data-v="' + i + '"></i>').join('') + '</div>'
    + '<div class="row g10 tctl"><button type="button" class="tbtn" data-a="tutPrev" aria-label="Paso anterior">Anterior</button><button type="button" class="tbtn main" data-a="tutPlay" id="tplay"></button><button type="button" class="tbtn" data-a="tutNext" aria-label="Paso siguiente">Siguiente</button></div>'
    + '<details class="tdet"><summary><span>Ver los pasos en texto</span>' + dcar() + '</summary><ol>' + T.steps.map((s) => '<li>' + s.say + '</li>').join('') + '</ol></details>'
    + (TS.id !== 'guia' ? '<div class="row g8" style="flex-wrap:wrap;justify-content:center"><span class="muted" style="font-size:13px;align-self:center">Otros tutoriales:</span>' + tutIds().filter((k) => k !== TS.id).map((k) => '<button type="button" class="tchip" data-a="tutOpen" data-v="' + k + '">' + esc(TUT[k].t) + '</button>').join('') + '</div>' : '') + '</div>';
}
function tutGo(i) {
  if (!TS) return;
  const T = TUT[TS.id], n = T.steps.length; i = ((i % n) + n) % n; TS.i = i; clearTimeout(TS.timer);
  const st = T.steps[i], stage = document.getElementById('tstage'), tg = document.getElementById(st.at), f = document.getElementById('tfing');
  if (!stage || !tg) return;
  document.querySelectorAll('#tph [data-on]').forEach((x) => x.classList.toggle('on', i >= Number(x.dataset.on)));
  document.querySelectorAll('#tph .tl').forEach((x) => x.classList.remove('tl'));
  tg.classList.add('tl');
  const sr = stage.getBoundingClientRect(), r = tg.getBoundingClientRect();
  const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + Math.min(r.height / 2, 30);
  f.classList.remove('tap'); f.style.transition = 'none';
  if (st.swipe && !tutReduced()) { f.style.left = (cx + r.width * 0.32) + 'px'; f.style.top = cy + 'px'; void f.offsetWidth; f.style.transition = ''; setTimeout(() => { if (TS && TS.i === i) { f.style.left = (cx - r.width * 0.32) + 'px'; } }, 450); }
  else { f.style.transition = tutReduced() ? 'none' : ''; f.style.left = cx + 'px'; f.style.top = cy + 'px'; }
  setTimeout(() => { if (TS && TS.i === i) f.classList.add('tap'); }, tutReduced() ? 0 : 950);
  document.getElementById('tcap').innerHTML = '<span class="tnum">' + (i + 1) + '</span><span>' + st.say + '</span>';
  document.querySelectorAll('#tdots .tdot').forEach((d, k) => { d.classList.toggle('cur', k === i); });
  const pl = document.getElementById('tplay'); if (pl) pl.textContent = TS.play ? 'Pausar' : 'Reproducir';
  if (TS.play) TS.timer = setTimeout(() => tutGo(i + 1), 4800);
}
function tutOpen(id) {
  if (!TUT[id]) return; tutClose();
  const el = document.createElement('div'); el.id = 'tut'; el.className = 'tut'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Tutorial de ' + TUT[id].t);
  document.body.appendChild(el); TS = { id, i: 0, play: !tutReduced(), timer: null }; tutDraw(); tutGo(0);
  const x = el.querySelector('.x'); if (x) x.focus();
}
function tutClose() { if (TS) clearTimeout(TS.timer); TS = null; const el = document.getElementById('tut'); if (el) el.remove(); }
document.addEventListener('keydown', (e) => { if (UI.wk && e.key === 'Escape') { UI.wk = null; render(); return; } const rb = e.target && e.target.closest && e.target.closest('[role=button][data-a]'); if (rb && (e.key === 'Enter' || e.key === ' ') && !/^(BUTTON|A|INPUT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); rb.click(); return; } if (!TS) return; if (e.key === 'Escape') tutClose(); else if (e.key === 'ArrowRight') tutGo(TS.i + 1); else if (e.key === 'ArrowLeft') tutGo(TS.i - 1); });

/* ---------- Comentarios: consultas, ideas y comentarios ---------- */
const FBK = [['consulta', 'Consulta'], ['idea', 'Idea'], ['comentario', 'Comentario']];
function fbForm() {
  const k = UI.fbKind || 'comentario', txt = UI.fbDraft || '';
  return '<section class="card col g12" id="fbbox" aria-label="Consultas, ideas y comentarios"><div class="eyebrow">Consultas, ideas y comentarios</div><p class="soft" style="font-size:15px">¿No entiendes algo, se te ocurrió una mejora o quieres contarnos cómo te va con la app? Escríbelo aquí y tu coach lo recibe.</p>'
    + '<div class="chips" role="group" aria-label="Tipo de mensaje">' + FBK.map((x) => '<button type="button" class="chip" data-a="fbKind" data-v="' + x[0] + '" aria-pressed="' + (k === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'
    + '<textarea id="fbText" maxlength="1000" rows="4" placeholder="Escribe tu mensaje…" aria-label="Mensaje">' + esc(txt) + '</textarea>'
    + '<div class="row between"><span class="muted" style="font-size:13px" id="fbCount">' + txt.length + ' / 1000</span>' + (UI.fbOk ? '<span style="color:var(--good);font-weight:600;font-size:14px">Enviado, ¡gracias!</span>' : '') + '</div>'
    + '<button type="button" class="btn primary" data-a="fbSend" id="fbSend"' + ((txt.trim() && !UI.busy) ? '' : ' disabled') + '><span>Enviar</span></button></section>';
}
function fbInbox() {
  const L = ST.fbk || [], unread = L.filter((x) => !x.read).length;
  if (!L.length) return '<section class="card col g10" aria-label="Comentarios recibidos"><div class="eyebrow">Ideas y consultas</div><p class="soft" style="font-size:15px">Aún no hay mensajes. Cuando alguien escriba desde Guía aparecerá aquí.</p></section>';
  return '<section class="col g10" id="fbinbox" aria-label="Comentarios recibidos"><div class="eyebrow">Ideas y consultas' + (unread ? ' · <span style="color:var(--accent)">' + unread + ' nueva' + (unread === 1 ? '' : 's') + '</span>' : '') + '</div>' + L.slice(0, 12).map((x) => {
    const d = new Date(x.ts || 0).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }), kn = (FBK.find((q) => q[0] === x.kind) || [0, 'Mensaje'])[1];
    return '<div class="card col g8" style="' + (x.read ? 'opacity:.7' : 'border:1.5px solid var(--accent)') + '"><div class="row between g8"><span style="font-weight:600">' + esc(x.name || 'Atleta') + (x.team ? ' · ' + esc(String(x.team).toUpperCase()) : '') + '</span><span class="muted" style="font-size:13px">' + esc(kn) + ' · ' + d + '</span></div><p class="soft" style="font-size:15px;white-space:pre-wrap">' + esc(x.text) + '</p><div class="row g8"><button type="button" class="chip" data-a="fbMark" data-v="' + esc(x.id) + '">' + (x.read ? 'Marcar como nuevo' : 'Marcar como leído') + '</button><button type="button" class="chip" data-a="fbDel" data-v="' + esc(x.id) + '">Borrar</button></div></div>';
  }).join('') + '</section>';
}


/* ---------- Detalle de la semana (se abre al tocar "Tu semana") ---------- */
const WDF = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const shortDate = (ds) => { const d = parse(ds); return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); };
const hm = (m) => (m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60 ? pad(m % 60) + ' min' : '').trim() : m + ' min');
function weekSheetHtml() {
  const a = meA(), sh = UI.wk.shift || 0, w = weekInfo(a, sh), today = off(0);
  let pMin = 0, pKm = 0, dMin = 0, dKm = 0;
  w.days.forEach((d) => { if (d.p) { pMin += d.p.min || 0; pKm += d.p.km || 0; } const c = on(a, d.date); if (c && c.type === 'actividad' && c.activity) { dMin += (c.activity.min || 0) + ((c.act2 && c.act2.min) || 0); dKm += (c.activity.km || 0) + ((c.act2 && c.act2.km) || 0); } });
  const first = w.days[0].date, last = w.days[6].date, ttl = sh === 0 ? 'Esta semana' : (sh === 1 ? 'Próxima semana' : (sh === -1 ? 'Semana pasada' : (sh < 0 ? 'Hace ' + (-sh) + ' semanas' : 'En ' + sh + ' semanas')));
  const tile = (v, u, l, c) => '<div class="col g4" style="align-items:center;text-align:center;flex:1;padding:4px"><span class="num" style="font-size:24px;line-height:1.05;color:' + c + '">' + v + '</span><span class="muted" style="font-size:12px">' + l + '</span></div>';
  const pct = pMin ? Math.min(100, Math.round(dMin / pMin * 100)) : 0;
  let out = '<div class="inner"><div class="stack"><div class="row between"><div class="col g4"><div class="muted" style="font-size:14px">' + esc(shortDate(first)) + ' – ' + esc(shortDate(last)) + '</div><h1 class="title">' + ttl + '</h1></div><button type="button" class="x" data-a="wkClose" style="color:var(--text);min-height:44px;border:0;background:transparent;font-weight:600;font-size:16px">Cerrar</button></div>';
  out += '<section class="card col g12" aria-label="Resumen de la semana"><div class="eyebrow">Resumen</div><div class="row" style="align-items:stretch">' + tile(w.done + ' / ' + w.planned, '', 'Sesiones hechas', 'var(--accent)') + '<div style="width:1px;background:var(--line)"></div>' + tile(hm(dMin), '', 'de ' + (pMin ? hm(pMin) : '–') + ' planificados', 'var(--good)') + '<div style="width:1px;background:var(--line)"></div>' + tile(dKm + ' km', '', 'de ' + (pKm || '–') + ' km', 'var(--accent2)') + '</div>' + (pMin ? '<div class="bar" aria-hidden="true"><i style="width:' + pct + '%;background:var(--good)"></i></div>' : '') + '</section>';
  out += '<section class="col g10" aria-label="Días de la semana">';
  w.days.forEach((d) => {
    const c = on(a, d.date), isAct = !!(c && c.type === 'actividad'), past = d.date < today, isToday = d.date === today, note = dayNoteFor(d.date), p = d.p;
    let st, col, bg;
    if (isAct) { st = 'Hecho'; col = 'var(--good)'; bg = 'var(--good-soft)'; }
    else if (isToday) { st = p ? 'Hoy' : 'Hoy · descanso'; col = 'var(--accent)'; bg = 'var(--accent-soft)'; }
    else if (past && p) { st = 'Sin registrar'; col = 'var(--warn)'; bg = 'var(--surface2)'; }
    else if (!past && p) { st = 'Por hacer'; col = 'var(--muted)'; bg = 'var(--surface2)'; }
    else { st = 'Descanso'; col = 'var(--muted)'; bg = 'var(--surface2)'; }
    let body = '';
    if (p) body += '<div class="col g4"><div class="eyebrow">Plan</div><div style="font-weight:600;font-size:16px">' + esc(p.name) + '</div><div class="muted" style="font-size:14px">' + [p.min ? minText(p.min) : '', p.km ? p.km + ' km' : ''].filter(Boolean).join(' · ') + '</div></div>';
    if (c) {
      const A = c.activity; let did;
      if (isAct) did = (A ? esc(A.name) + (A.min ? ' · ' + minText(A.min) : '') + (A.km ? ' · ' + A.km + ' km' : '') : 'Actividad registrada') + (c.rpe ? ' · esfuerzo ' + c.rpe + '/10' : '');
      else did = c.type === 'descanso' ? 'Día de descanso registrado' : 'Registraste cómo te sientes';
      body += '<div class="col g4"><div class="eyebrow" style="color:' + (isAct ? 'var(--good)' : 'var(--muted)') + '">' + (isAct ? 'Lo que hiciste' : 'Tu check-in') + '</div><div style="font-size:15px">' + did + '</div>' + (c.comment ? '<div class="muted" style="font-size:14px">“' + esc(c.comment) + '”</div>' : '') + '</div>';
    }
    if (note) body += '<div class="col g4"><div class="eyebrow">Nota de tu coach</div><div class="soft" style="font-size:15px">' + esc(note) + '</div></div>';
    if (!body) body = '<div class="muted" style="font-size:14px">' + (past ? 'Sin sesión planificada ni registro.' : 'Sin sesión planificada.') + '</div>';
    out += '<div class="card col g10" id="wkd-' + d.date + '" style="' + (isToday ? 'border:1.5px solid var(--accent)' : '') + (UI.wk.focus === d.date ? ';box-shadow:0 0 0 3px var(--accent-soft)' : '') + '"><div class="row between g8" style="align-items:center"><div style="font-weight:700;font-size:17px;text-transform:capitalize">' + WDF[d.wd] + ' <span class="muted" style="font-weight:500;font-size:14px;text-transform:none">' + esc(shortDate(d.date)) + '</span></div><span style="padding:3px 10px;border-radius:999px;background:' + bg + ';color:' + col + ';font-size:12px;font-weight:700;white-space:nowrap">' + st + '</span></div>' + body + '</div>';
  });
  out += '</section>';
  if (sh === 0) { const nx = weekInfo(a, 1); if (nx.planned) out += '<button type="button" class="card row between g12" data-a="wkShift" data-v="1" style="text-align:left;min-height:64px"><span class="col"><b>Lo que viene: próxima semana</b><span class="muted" style="font-size:13px">' + nx.planned + (nx.planned === 1 ? ' sesión' : ' sesiones') + ' planificadas</span></span><span class="muted" aria-hidden="true">' + crt() + '</span></button>'; }
  out += '<div class="row g10" style="justify-content:space-between"><button type="button" class="chip" data-a="wkShift" data-v="' + (sh - 1) + '"' + (sh <= -8 ? ' disabled' : '') + '>‹ Semana anterior</button>' + (sh !== 0 ? '<button type="button" class="chip" data-a="wkShift" data-v="0">Esta semana</button>' : '') + '<button type="button" class="chip" data-a="wkShift" data-v="' + (sh + 1) + '"' + (sh >= 12 ? ' disabled' : '') + '>Semana siguiente ›</button></div>';
  return out + '</div></div>';
}
const dayNoteFor = (date) => dayNote(date);

/* ---------- Vista: Ajustes ---------- */
/* Fila de ajuste con interruptor: titulo y ayuda a la izquierda, interruptor a la derecha. */
const setRow = (title, sub, on, act, val) => '<button type="button" class="setrow" role="switch" aria-checked="' + !!on + '" data-a="' + act + '"' + (val != null ? ' data-v="' + val + '"' : '') + '><span class="col grow g4" style="min-width:0"><span style="font-weight:600;font-size:16px">' + title + '</span>' + (sub ? '<span class="muted" style="font-size:13px;font-weight:500">' + sub + '</span>' : '') + '</span><span class="fcsw-t" aria-hidden="true"><i></i></span></button>';
const initial = (n) => esc(String(n || '?').trim().charAt(0).toUpperCase() || '?');

/* ---------- Coach de apoyo (v46): permisos que define el coach principal + propuestas ---------- */
const propBadge = (p) => { const m = (ST.props || []).filter((x) => x.kind === 'athlete' && x.status !== 'no' && p.email && String(x.email || '').toLowerCase() === String(p.email).toLowerCase())[0]; return m ? '<div class="muted" style="font-size:13px">Propuesto por ' + esc(firstName(m.byName)) + ' para ' + esc(TEAMS[m.team] || '') + (m.status === 'ok' ? ' · ya aprobado' : '') + '</div>' : ''; };
const viewersList = () => ST.athletes.filter((r) => r.role === 'viewer');
const accOf = (v) => { const a = v.access || {}; return { teams: (a.teams || []).slice(), athletes: (a.athletes || []).slice(), edit: a.edit === true, profile: a.profile === true }; };
function supportCard() {
  if (!isOwner()) return '';
  const vs = viewersList(), openProps = (ST.props || []).filter((x) => x.status === 'open');
  if (!vs.length && !openProps.length) return '';
  let out = '';
  if (openProps.length) out += '<section class="card col g12" id="propsCard" aria-label="Propuestas" style="border:1.5px solid var(--accent)"><div class="eyebrow" style="color:var(--accent)">Propuestas por autorizar</div>' + openProps.map((x) => '<div class="col g8" style="padding:6px 0"><div style="font-weight:600">' + (x.kind === 'athlete' ? 'Atleta nuevo: ' : 'Grupo nuevo: ') + esc(x.name) + '</div><div class="muted" style="font-size:13px">De ' + esc(x.byName) + (x.kind === 'athlete' ? ' · ' + esc(x.email || '') + ' · equipo ' + esc(TEAMS[x.team] || x.team || '') : '') + (x.note ? ' · “' + esc(x.note) + '”' : '') + '</div><div class="row g8 wrap"><button type="button" class="chip" data-a="propOk" data-v="' + esc(x.id) + '">Autorizar</button><button type="button" class="chip" data-a="propNo" data-v="' + esc(x.id) + '">Rechazar</button></div></div>').join('') + '<p class="muted" style="font-size:13px">Al autorizar un atleta, cuando se registre con ese correo te aparecerá en Solicitudes nuevas marcado como propuesto. Los grupos nuevos quedan anotados y los activas tú.</p></section>';
  vs.forEach((v) => {
    const a = accOf(v), others = ST.athletes.filter((r) => r.role === 'athlete' && a.teams.indexOf(r.team) < 0).sort((x, y) => String(x.name).localeCompare(String(y.name), 'es'));
    out += chatCard(v.id, v.name, 'chat-card-' + v.id);
    out += '<section class="card col g12" aria-label="Equipo de apoyo"><div class="eyebrow">Equipo de apoyo · ' + esc(v.name) + '</div><p class="soft" style="font-size:14px">Tú mantienes el control total. Aquí eliges qué ve ' + esc(firstName(v.name)) + ' y qué puede hacer.</p>'
      + '<div class="col g8"><span class="eyebrow">Equipos que ve</span><div class="chips" role="group" aria-label="Equipos visibles">' + Object.keys(TEAMS).map((t) => '<button type="button" class="chip" data-a="accTeam" data-v="' + esc(v.id) + '|' + t + '" aria-pressed="' + (a.teams.indexOf(t) >= 0) + '">' + TEAMS[t] + '</button>').join('') + '</div></div>'
      + (others.length ? '<div class="col g8"><span class="eyebrow">Atletas sueltos (de otros equipos)</span><div class="chips" role="group" aria-label="Atletas visibles">' + others.map((r) => '<button type="button" class="chip" data-a="accAth" data-v="' + esc(v.id) + '|' + esc(r.id) + '" aria-pressed="' + (a.athletes.indexOf(r.id) >= 0) + '">' + esc(firstName(r.name)) + ' · ' + esc(TEAMS[r.team] || '') + '</button>').join('') + '</div></div>' : '')
      + '<div class="setlist">' + setRow('Puede editar', a.edit ? 'Responde, edita planes y gestiona a sus atletas como tú' : 'Solo lectura: ve, pero no cambia nada', a.edit, 'accEdit', esc(v.id)) + setRow('Ve perfil y medidas', a.profile ? 'Edad, estatura, deporte y medidas (peso, FTP, FC)' : 'No ve el perfil de los atletas', a.profile, 'accProf', esc(v.id)) + '</div>'
      + '<p class="muted" style="font-size:13px">La salud y el contacto de emergencia los ves solo tú. Los cambios aplican en segundos.</p></section>';
  });
  return out;
}
function proposeCard() {
  if (!isViewer()) return '';
  const a = vAcc(), teams = (a.teams || []).filter((t) => TEAMS[t]), pr = UI.prop || (UI.prop = { kind: 'athlete', name: '', email: '', note: '', team: teams[0] || '' });
  const mine = (ST.props || []).slice(0, 6), stTxt = { open: 'Pendiente', ok: 'Autorizada', no: 'Rechazada' };
  let out = '<section class="card col g12" aria-label="Proponer"><div class="eyebrow">Proponer al coach principal</div><p class="soft" style="font-size:14px">Puedes proponer un atleta nuevo o un grupo nuevo. El coach principal lo autoriza antes de que exista.</p><div class="seggroup" role="group" aria-label="Qué propones"><button type="button" data-a="propKind" data-v="athlete" aria-pressed="' + (pr.kind === 'athlete') + '">Atleta</button><button type="button" data-a="propKind" data-v="group" aria-pressed="' + (pr.kind === 'group') + '">Grupo</button></div>'
    + '<input class="field" id="propName" type="text" maxlength="80" placeholder="' + (pr.kind === 'athlete' ? 'Nombre del atleta' : 'Nombre del grupo') + '" value="' + esc(pr.name) + '">'
    + (pr.kind === 'athlete' ? '<input class="field" id="propEmail" type="email" maxlength="120" placeholder="Correo con el que se registrará" value="' + esc(pr.email) + '">' + (teams.length > 1 ? '<div class="chips" role="group" aria-label="Equipo">' + teams.map((t) => '<button type="button" class="chip" data-a="propTeam" data-v="' + t + '" aria-pressed="' + (pr.team === t) + '">' + TEAMS[t] + '</button>').join('') + '</div>' : '<p class="muted" style="font-size:13px">Equipo: ' + esc(TEAMS[pr.team] || 'sin equipo asignado') + '</p>') : '')
    + '<input class="field" id="propNote" type="text" maxlength="300" placeholder="Nota para el coach (opcional)" value="' + esc(pr.note) + '">'
    + '<button type="button" class="btn" data-a="propSend"' + (UI.busy ? ' disabled' : '') + '><span>Enviar propuesta</span></button>';
  if (mine.length) out += '<div class="col g6" style="margin-top:4px"><span class="eyebrow">Tus propuestas</span>' + mine.map((x) => '<div class="row between g10"><span>' + (x.kind === 'athlete' ? 'Atleta' : 'Grupo') + ': ' + esc(x.name) + '</span><span class="muted" style="font-size:13px">' + stTxt[x.status] + '</span></div>').join('') + '</div>';
  return out + '</section>';
}
function viewAjustes() {
  const p = ST.profile || {}, remOn = !!p.reminder, rem = p.reminder || PREF.lastRem || '19:30';
  let out = '<div class="inner"><div class="stack">' + head('Preferencias', 'Ajustes') + msgBanner();
  // perfil
  out += '<section class="card col g14" aria-label="Cuenta"><div class="row g14" style="align-items:center"><span class="avatar" aria-hidden="true">' + initial(p.name) + '</span><div class="col grow g4" style="min-width:0"><span style="font-weight:700;font-size:20px;overflow-wrap:anywhere">' + esc(p.name || '') + '</span><span class="muted" style="font-size:13px;overflow-wrap:anywhere">' + esc(p.email || (ST.user && ST.user.email) || '') + '</span></div></div><div class="row g8 wrap"><span class="tag out" style="color:var(--soft);border-color:var(--line)">' + (isCoach() ? 'Coach' : 'Atleta') + '</span>' + (p.team ? '<span class="tag out" style="color:var(--soft);border-color:var(--line)">Equipo ' + TEAMS[p.team] + '</span>' : '') + (p.pending ? '<span class="tag out" style="color:var(--warn);border-color:var(--warn)">Pendiente de asignación</span>' : '') + '</div></section>';
  if (tabs().some((t) => t.hide)) out += '<a class="card row g14" href="#guia" style="text-decoration:none;color:inherit;align-items:center;border:1.5px solid var(--line)"><span class="col grow g4" style="min-width:0"><span class="eyebrow">Guía</span><span style="font-weight:600">Tutoriales y cómo escribirnos</span><span class="muted" style="font-size:14px">Cómo se llena cada dato y envío de ideas</span></span>' + arrow() + '</a>';
  out += (isViewer() && ST.user ? chatCard(ST.user.uid, 'tu coach principal', 'chatCard') : '') + supportCard() + proposeCard();
  // apariencia
  out += '<section class="card col g12" aria-label="Apariencia"><div class="eyebrow">Apariencia</div><div class="tones" role="group" aria-label="Tono visual">' + TONES.map((t) => '<button type="button" class="tone" data-a="tone" data-v="' + t.id + '" aria-pressed="' + (PREF.tone === t.id) + '"><span class="sw">' + t.sw.map((c) => '<i style="background:' + c + '"></i>').join('') + '</span><span class="col g4" style="text-align:left"><span style="font-weight:600">' + t.name + '</span><span class="muted" style="font-size:12px;font-weight:500">' + t.sub + '</span></span></button>').join('') + '</div>'
    + '<div class="setlist">' + setRow('Ampliar el gráfico al girar', 'Con el teléfono en horizontal, en Datos, el gráfico de forma se abre a pantalla completa', PREF.rotZoom !== false, 'pref', 'rotZoom') + setRow('Reducir animaciones', 'Quita transiciones y movimientos', !!PREF.calm, 'pref', 'calm') + '</div></section>';
  // avisos
  out += '<section class="card col g12" aria-label="Avisos"><div class="eyebrow">Check-in y avisos</div><div class="setlist">' + setRow('Recordatorio diario', remOn ? 'Todos los días a las ' + esc(rem) : 'Desactivado', remOn, 'remToggle')
    + (remOn ? '<div class="col g10" style="padding:4px 0 12px"><div class="chips" role="group" aria-label="Hora del recordatorio">' + ['07:00', '12:00', '19:30', '21:00'].map((h) => '<button type="button" class="chip" data-a="remSet" data-v="' + h + '" aria-pressed="' + (rem === h) + '" style="min-height:40px">' + h + '</button>').join('') + '</div><div class="row g10" style="align-items:center"><label for="reminder" class="muted" style="font-size:13px">Otra hora</label><input type="time" id="reminder" value="' + esc(rem) + '"></div><p class="muted" style="font-size:12px">La hora queda guardada en tu perfil. Los avisos llegarán en una próxima versión, con la app instalada.</p></div>' : '')
    + setRow('Vibración al enviar', 'Un toque suave al terminar tu check-in', PREF.haptic !== false, 'pref', 'haptic') + '</div></section>';
  // grafico
  out += '<section class="card col g12" aria-label="Datos y gráficos"><div class="eyebrow">Datos y gráficos</div><div class="setlist">' + setRow('Proyección del plan', 'Muestra en el gráfico de forma cómo llegarías a tu meta', fcProjOn(), 'fcProj') + '</div></section>';
  if (isOwner()) {
    const team = UI.metaTeam, m = ST.teamMeta[team] || {}, d = UI.metaDraft && UI.metaDraft.team === team ? UI.metaDraft : { team, goal: m.goal || KM_GOAL_DEFAULT, hito: m.hito || '' };
    out += '<section class="card col g12" aria-label="Meta del equipo"><div class="eyebrow">Meta e hito del equipo</div><div class="seggroup" role="group" aria-label="Equipo">' + Object.keys(TEAMS).map((t) => '<button type="button" data-a="metaTeam" data-v="' + t + '" aria-pressed="' + (team === t) + '">' + TEAMS[t] + '</button>').join('') + '</div><label for="metaGoal" class="soft">Meta del mes (km)</label><input class="field" id="metaGoal" type="number" inputmode="numeric" min="0" value="' + esc(d.goal) + '"><label for="metaHito" class="soft">Hito de la semana (opcional)</label><textarea id="metaHito" placeholder="Por ejemplo: Camila hizo su rodaje más largo">' + esc(d.hito) + '</textarea><button type="button" class="btn primary" data-a="saveMeta" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '>Guardar para ' + TEAMS[team] + '</button></section>';
  }
  if (p.team && !isCoach()) out += '<section class="card col g12" aria-label="Compartir kilómetros"><div class="eyebrow">Tu equipo</div><div class="setlist">' + setRow('Compartir mis km con el equipo', sharesKm() ? 'Tu nombre y tus km del mes suman a la meta de ' + TEAMS[p.team] : 'Tus km no aparecen ni suman a la meta del equipo', sharesKm(), 'shareKm') + '</div></section>';
  if (isOwner() && !DEMO) {
    const dRow = (r, ttl, sub) => { const dl = demoLink(r); return '<div class="col g8"><div><b>' + ttl + '</b><div class="muted" style="font-size:13px">' + sub + '</div></div><div class="demolink" id="demolink-' + r + '" tabindex="0">' + esc(dl) + '</div><div class="row g10 wrap"><button type="button" class="btn primary" data-a="copyDemo" data-v="' + r + '" style="flex:1;min-width:130px;justify-content:center;white-space:nowrap"><span>Copiar enlace</span></button><a class="btn" href="' + esc(dl) + '" target="_blank" rel="noopener" style="flex:1;min-width:130px;background:var(--surface2);text-decoration:none;color:var(--text);justify-content:center;white-space:nowrap"><span>' + (r === 'real' ? 'Abrir app' : 'Abrir demo') + '</span></a></div></div>'; };
    out += '<section class="card col g14" aria-label="Compartir la app"><div class="eyebrow">Compartir la app</div>' + dRow('real', 'App real', 'Para atletas y coaches que ya tienes: entran con su cuenta de Google y quedan pendientes hasta que los autorices.') + '<div style="height:1px;background:var(--line)"></div><p class="soft" style="font-size:15px">Para mostrarla, cualquiera puede probar Camino con <b>datos ficticios</b>, sin iniciar sesión ni usar su Gmail. No toca datos reales ni los de tus atletas.</p>' + dRow('atleta', 'Demo de atleta', 'Entra directo como atleta: Hoy, Datos, Ruta, Ajustes y Guía.') + '<div style="height:1px;background:var(--line)"></div>' + dRow('coach', 'Demo de coach', 'Entra directo a la Cabina, con atletas, alertas y buzón.') + '</section>';
  }
  if (isOwner() && !DEMO && ST.user) out += '<section class="card col g12" aria-label="Importar historial"><div class="eyebrow">Historial de Tally</div><p class="soft" style="font-size:14px">Trae tus check-ins anteriores de Tally a tu propia cuenta. No pisa los días que ya tienes.</p><button type="button" class="btn ghost" data-a="importTally" data-v="' + esc(ST.user.uid) + '" style="border:1.5px solid var(--line);color:var(--text)"' + (UI.busy ? ' disabled' : '') + '><span>Importar mi historial</span></button></section>';
  out += '<section class="card col g8" aria-label="Créditos"><div class="eyebrow">Créditos</div><p class="soft" style="font-size:14px">Iconos: Phosphor Icons (licencia MIT). Figura del cuerpo: body-muscles de Ivan Vulović (licencia Apache-2.0), adaptada por Camino. Los textos de licencia están junto a la app, en los archivos LICENSE-phosphor-icons.txt, LICENSE-body-muscles.txt y NOTICE-body-muscles.txt.</p></section>';
  if (!isCoach() || !DEMO) { const tc = ST.user ? on(meA(), off(0)) : null; if (tc) out += '<section class="card col g10" aria-label="Mis datos"><div class="eyebrow">Mis datos</div>' + (UI.confirmDel ? '<p class="soft" style="font-size:14px">¿Borrar el registro de hoy? Se elimina de tu historial y tu coach dejará de verlo.</p><div class="row g8 wrap"><button type="button" class="chip" data-a="delCk" style="border-color:var(--bad);color:var(--bad)">Sí, borrar</button><button type="button" class="chip" data-a="delNo">Cancelar</button></div>' : '<button type="button" class="btn ghost" data-a="delAsk" style="border:1.5px solid var(--line);color:var(--bad)"><span>Borrar el registro de hoy</span></button>') + '</section>'; }
  out += '<section class="card col g12" aria-label="Ayuda"><div class="eyebrow">Ayuda</div><button type="button" class="btn ghost" data-a="tour" style="border:1.5px solid var(--line);color:var(--text)"><span>Ver recorrido de bienvenida</span></button></section>';
  out += '<section class="card col g12" aria-label="Privacidad"><div class="eyebrow">Quién ve qué</div><div class="col g10">' + [['Tu coach', 'Check-ins, molestias y notas'], ['Tu equipo', 'Solo kilómetros, insignias e hitos'], ['Nadie más', 'Tu bienestar y tus molestias son privados']].map((x) => '<div class="row g12" style="align-items:baseline"><span style="font-weight:600;min-width:84px">' + x[0] + '</span><span class="soft" style="font-size:14px">' + x[1] + '</span></div>').join('') + '</div></section>';
  out += '<details class="card" aria-label="Instalar"><summary style="font-weight:600;min-height:32px;cursor:pointer"><span>Instalar en el teléfono</span>' + dcar() + '</summary><p class="soft" style="font-size:15px;margin-top:8px">En Android: menú de Chrome y “Instalar aplicación”. En iPhone: Compartir y “Agregar a inicio”.</p></details>';
  if (DEMO) out += '<section class="card col g10" aria-label="Datos de demostración"><div class="eyebrow">Modo demostración</div><button type="button" class="chip" data-a="resetDemo" style="align-self:flex-start">Restablecer datos de demostración</button></section>';
  if (!DEMO_ROLE) out += '<button type="button" class="btn ghost" data-a="logout" style="justify-content:center;border:1.5px solid var(--line)">Cerrar sesión</button>';
  return out + '</div></div>';
}

/* ---------- Overlay: check-in ---------- */

/* ---------- Sesiones del día (bici, gym, otra) ---------- */
const BKINDS = { gravel: 'Gravel', ruta: 'Ruta', mtb: 'MTB' };
const KIND_LABEL = { gravel: 'Gravel', ruta: 'Ruta', mtb: 'MTB', gym: 'Gym', otra: 'Otra' };
const GFOCUS = ['Piernas', 'Tren superior', 'Cuerpo completo', 'Core y movilidad'];
const GDUR = ['Menos de 30 min', '30-60 min', '60-90 min', 'Más de 90 min'];
const DURMIN = [20, 45, 75, 100];
const GLEGS = ['Frescas', 'Algo cargadas', 'Muy cargadas'];
const RPEW = ['', 'Muy suave', 'Muy suave', 'Suave', 'Suave', 'Moderado', 'Moderado', 'Duro', 'Duro', 'Muy duro', 'Máximo'];
const RPEC = ['', '#0B7A4B', '#2F7A38', '#527A26', '#767B13', '#9A7B00', '#A76804', '#B55408', '#C2410C', '#BB3218', '#B42323'];
const GYMRX = /fuerza|gym|gimnasio|pesas/i;
function planKind(p) { if (!p) return null; const n = String(p.name || ''); if (GYMRX.test(n)) return 'gym'; if (/mtb|monta/i.test(n)) return 'mtb'; if (/gravel/i.test(n)) return 'gravel'; if (/ruta|road/i.test(n)) return 'ruta'; return 'bici'; }
function lastBikeKind(a) { const cnt = {}; ((a && a.checkins) || []).forEach((c) => { const k = c.activity && c.activity.kind; if (BKINDS[k]) cnt[k] = (cnt[k] || 0) + 1; }); const ks = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]); return ks[0] || 'ruta'; }
const kindOfAct = (A, a) => (!A ? null : (A.kind || (GYMRX.test(A.name || '') ? 'gym' : lastBikeKind(a))));
function sessOf(c, slot) { if (!c) return null; if (slot === 2) return c.act2 || null; return c.activity ? Object.assign({}, c.activity, { rpe: c.rpe, heat: c.heat, hard: c.hard, hardInfo: c.hardInfo }) : null; }
function kIcon(k, size) { return ph(k === 'gym' ? 'barbell' : (k === 'otra' ? 'person-simple-run' : 'bicycle'), size); }
function rpeBar(v) {
  let o = '<div class="rpebar" role="group" aria-label="Esfuerzo percibido, del 1 al 10">';
  for (let i = 1; i <= 10; i++) {
    const fill = v && i <= v, c = RPEC[i], h = Math.round(26 + (i - 1) * 8.6);
    o += '<button type="button" class="rcol' + (v === i ? ' cur' : '') + '" data-a="rpe" data-v="' + i + '" aria-pressed="' + (v === i) + '" aria-label="' + i + ', ' + RPEW[i] + '"><span class="rbar" style="height:' + h + 'px;border-color:' + c + ';background:' + (fill ? c : c + '14') + '"></span><span class="rnum">' + i + '</span></button>';
  }
  return o + '</div><div class="rpeword" aria-live="polite">' + (v ? '<b>' + v + '</b> · ' + RPEW[v] : 'Toca una barra para llenar la escala') + '</div>';
}
/* ---------- Zonas del cuerpo (gym) ----------
   Se guardan con ids propios (versionados) y ZSTRAVA los relaciona con los 15 músculos del mapa de Strava. */
const GZ = [
  ['quads', 'Cuádriceps', 'inf'], ['hamstrings', 'Isquiotibiales', 'inf'], ['glutes', 'Glúteos', 'inf'], ['hip', 'Cadera y aductores', 'inf'], ['calves', 'Pantorrillas', 'inf'],
  ['core', 'Abdomen y core', 'tro'], ['lower_back', 'Lumbar', 'tro'], ['upper_back', 'Espalda alta', 'tro'], ['lats', 'Dorsales', 'tro'],
  ['chest', 'Pecho', 'sup'], ['shoulders', 'Hombros', 'sup'], ['arms', 'Bíceps y antebrazo', 'sup'], ['triceps', 'Tríceps', 'sup']
];
const GZN = {}; GZ.forEach((z) => { GZN[z[0]] = z[1]; });
const GZG = [['inf', 'Tren inferior'], ['tro', 'Tronco'], ['sup', 'Tren superior']];
const ZSTRAVA = { quads: ['quads'], hamstrings: ['hamstrings'], glutes: ['glutes', 'abductors'], hip: ['adductors'], calves: ['calves'], core: ['abs'], lower_back: ['lower_back'], upper_back: ['upper_back'], lats: ['lats'], chest: ['chest'], shoulders: ['shoulders'], arms: ['biceps', 'forearms'], triceps: ['triceps'] };
const GZI = ['Suave', 'Media', 'Dura'];
const gzOf = (S) => (S && S.gym && S.gym.zones && typeof S.gym.zones === 'object' ? S.gym.zones : {});
const gzList = (S) => GZ.filter((z) => gzOf(S)[z[0]]);
const gzMol = (S) => GZ.filter((z) => { const v = gzOf(S)[z[0]]; return v && v.m; });
function gzFigure(view, zs, act) {
  const B = BODY[view], on = (id) => !!(zs && zs[id]);
  let o = '<svg viewBox="' + B.vb + '" class="gzfig" role="img" aria-label="Figura humana, vista ' + (view === 'front' ? 'frontal' : 'posterior') + '. Toca una zona para marcarla.">';
  o += B.deco.map((d) => '<path class="gzd" d="' + d + '"/>').join('');
  Object.keys(B.zones).forEach((id) => { o += '<g class="gzz' + (on(id) ? ' on' : '') + (act === id ? ' act' : '') + '" data-a="gfig" data-v="' + id + '" aria-hidden="true">' + B.zones[id].map((d) => '<path d="' + d + '"/>').join('') + '</g>'; });
  return o + '</svg>';
}
function gzBlock(d) {
  const zs = d.gzones || {}, view = UI.gview === 'back' ? 'back' : 'front', ids = GZ.filter((z) => zs[z[0]]), n = ids.length;
  const act = zs[UI.gact] ? UI.gact : (ids[0] ? ids[0][0] : null);
  const side = (k, t) => '<button type="button" class="gzseg' + (view === k ? ' on' : '') + '" data-a="gview" data-v="' + k + '" aria-pressed="' + (view === k) + '">' + t + '</button>';
  let o = '<div class="col g10"><div style="font-weight:600">¿Qué zonas trabajaste? <span class="muted" style="font-weight:500;font-size:14px">(opcional)</span></div>'
    + '<div class="gzsegs" role="group" aria-label="Vista del cuerpo">' + side('front', 'Frente') + side('back', 'Espalda') + '</div>'
    + '<div class="gzstage"><span class="gzcnt" aria-live="polite"><b>' + n + '</b> ' + (n === 1 ? 'zona' : 'zonas') + '</span>' + gzFigure(view, zs, act) + '</div>';
  if (act) {
    const v = zs[act], nm = GZN[act];
    o += '<div class="gzpanel" role="group" aria-label="Detalle de ' + nm + '"><div class="row between" style="align-items:center"><span class="gzname">' + nm + '</span><button type="button" class="gzlink" data-a="gzone" data-v="' + act + '">Quitar</button></div>'
      + '<div class="gzmini" role="group" aria-label="Intensidad en ' + nm + '">' + GZI.map((t, i) => '<button type="button" class="gzseg sm" data-a="gint" data-v="' + i + '" data-z="' + act + '" aria-pressed="' + (v.i === i) + '"' + (v.i === i ? ' data-on="1"' : '') + '>' + t + '</button>').join('') + '</div>'
      + '<button type="button" class="gzr flat' + (v.m ? ' on' : '') + '" role="switch" aria-checked="' + !!v.m + '" data-a="gmol" data-v="' + act + '"><span>¿Quedó con molestia?</span><span class="gzsw' + (v.m ? ' on' : '') + '"><span></span></span></button>'
      + (v.m ? '<label class="col g6"><span class="muted" style="font-size:13px">Cuéntale a tu coach qué sentiste <span id="gzc-' + act + '">' + String(v.t || '').length + '/200</span></span><textarea id="gzt-' + act + '" maxlength="200" placeholder="Por ejemplo: tirón leve al bajar la sentadilla">' + esc(v.t || '') + '</textarea></label>' : '') + '</div>';
  } else {
    o += '<p class="gzhint">Toca una zona de la figura para marcarla.</p>';
  }
  if (UI.gundo && !zs[UI.gundo.id]) o += '<div class="gzundo" role="status">Quitaste ' + esc(GZN[UI.gundo.id]) + '. <button type="button" class="gzlink" data-a="gundo">Deshacer</button></div>';
  if (n) o += '<div class="gzsum" role="group" aria-label="Zonas marcadas">' + ids.map((z) => '<button type="button" class="gztag' + (act === z[0] ? ' cur' : '') + '" data-a="gact" data-v="' + z[0] + '" aria-pressed="' + (act === z[0]) + '">' + z[1] + (zs[z[0]].m ? '<i title="Con molestia" aria-label="con molestia"></i>' : '') + '</button>').join('') + '<button type="button" class="gzlink" data-a="gset" data-v="none">Limpiar</button></div>';
  o += '<button type="button" class="gzmore" data-a="glist" aria-expanded="' + !!UI.glist + '" aria-controls="gzlist"><span>Ver lista de zonas</span><span class="gzchev' + (UI.glist ? ' up' : '') + '" aria-hidden="true"></span></button>';
  if (UI.glist) {
    o += '<div class="gzlist" id="gzlist">';
    GZG.forEach((g) => {
      o += '<div class="gzgh"><span>' + g[1] + '</span><button type="button" class="gzlink" data-a="gset" data-v="' + g[0] + '">Todo</button></div>';
      GZ.filter((z) => z[2] === g[0]).forEach((z) => { const on = !!zs[z[0]]; o += '<button type="button" class="gzr' + (on ? ' on' : '') + '" role="switch" aria-checked="' + on + '" data-a="gzone" data-v="' + z[0] + '"><span>' + z[1] + '</span><span class="gzsw' + (on ? ' on' : '') + '"><span></span></span></button>'; });
    });
    o += '</div>';
  }
  return o + '</div>';
}
function sessLine(S, a) {
  const k = kindOfAct(S, a) || 'otra', g = S.gym || {};
  let title = k === 'gym' ? 'Gym' + (g.focus ? ' · ' + String(g.focus).toLowerCase() : '') : (BKINDS[k] ? KIND_LABEL[k] : esc(S.name || 'Actividad'));
  if (S.min) title += ' · ' + minText(S.min);
  const sub = [S.rpe ? 'Esfuerzo ' + S.rpe : '', k === 'gym' && (g.feel != null || g.legs != null) ? (g.feel != null ? 'carga ' : 'piernas ') + (g.feel != null ? GFEEL_N[g.feel] : String(at(GLEGS, g.legs)).toLowerCase()) : '', (k === 'gym' && gzList(S).length ? 'zonas: ' + gzList(S).slice(0, 3).map((z) => z[1].toLowerCase()).join(', ') + (gzList(S).length > 3 ? ' +' + (gzList(S).length - 3) : '') : ''), (k === 'gym' && gzMol(S).length ? 'molestia en ' + gzMol(S).map((z) => z[1].toLowerCase()).join(', ') : ''), BKINDS[k] && S.heat != null ? String(at(HEAT, S.heat)).toLowerCase() : '', (() => { const L = sessLoad(S, a); return L.tss != null ? (L.src === 'rpe' ? '≈' : '') + L.tss + ' TSS' : ''; })()].filter(Boolean).join(' · ');
  return { k, title, sub };
}
const stepList = (f) => (f.kind === 'post' ? (f.needMood ? ['mood'] : []).concat(f.d && f.d.tipo === 'gym' ? ['sesion', 'fuel', 'molestia'] : ['sesion', 'how', 'fuel', 'molestia']) : (f.kind === 'skip' ? (['mood', 'skip']).concat(((f.d && f.d.skipItems) || []).indexOf('Malestar físico') >= 0 ? ['molestia'] : []) : ['mood', 'molestia']));
const GFEEL_WHO = { 'Piernas': ['¿Cómo quedaron tus piernas?', ['Frescas', 'Algo cargadas', 'Muy cargadas']], 'Tren superior': ['¿Cómo quedaron brazos, pecho y espalda?', ['Frescos', 'Algo cargados', 'Muy cargados']], 'Core y movilidad': ['¿Cómo quedó tu zona media?', ['Fresca', 'Algo cargada', 'Muy cargada']] };
const GFEEL_DEF = ['¿Cómo quedó tu cuerpo?', ['Fresco', 'Algo cargado', 'Muy cargado']];
const GFEEL_N = ['fresco', 'algo cargado', 'muy cargado'];
const gymFields = (d) => '<div class="col g10"><div style="font-weight:600">¿Qué trabajaste?</div>' + plainOpts('gfocus', GFOCUS, d.gfocus, 'Foco', 2, (i, l) => l) + '</div>' + gzBlock(d)
  + '<div class="col g10"><div style="font-weight:600">¿Cuántos minutos trabajaste?</div>' + plainOpts('gdur', GDURS, d.gdur, 'Minutos', 4) + '</div>'
  + '<div class="col g10"><div style="font-weight:600">¿Qué tan duro fue? <span class="muted" style="font-weight:500;font-size:14px">(1 muy suave, 10 máximo)</span></div>' + rpeBar(d.rpe) + '</div>'
  + (() => { const q = GFEEL_WHO[d.gfocus] || GFEEL_DEF; return '<div class="col g10"><div style="font-weight:600">' + q[0] + '</div>' + chips('gfeel', q[1], d.gfeel, 'Carga tras el gym') + '<p class="muted" style="font-size:14px;margin:0">Si alguna zona quedó con molestia, márcala arriba: tu coach la ve.</p></div>'; })();
function flowHtml() {
  const f = UI.flow, d = f.d; let out = '<div class="inner flowsel"><div class="stack" style="gap:18px">';
  if (f.step === 'alt') {
    out += '<div class="row between"><button type="button" class="link" data-a="close">Cerrar</button><span class="muted" style="font-size:13px">Hoy fue distinto</span></div><div class="col g8"><h2 class="title">¿Hoy fue distinto?</h2><p class="muted">Cuéntalo sin culpa: también cuenta para tu constancia.</p></div><div class="col g10"><button type="button" class="opt" data-a="kind" data-v="descanso" aria-pressed="false"><span><span>Día de descanso</span><span class="sub">Descanso planificado</span></span></button><button type="button" class="opt" data-a="kind" data-v="skip" aria-pressed="false"><span><span>No pude entrenar</span><span class="sub">Cuéntanos qué pasó</span></span></button></div>';
  } else if (f.step === 'tipo') {
    const p = planFor(off(0)), ex = on(meA(), off(0)), hasD = !!(ex && ex.mood != null), hasP = !!(ex && ex.activity);
    out += '<div class="row between"><button type="button" class="link" data-a="close">Cerrar</button><span class="muted" style="font-size:13px">Check-in</span></div><div class="col g8"><h2 class="title">¿Qué quieres registrar?</h2><p class="muted">Son dos registros independientes. Puedes hacer uno, el otro o ambos, y volver a corregirlos hoy.</p></div>';
    const opt = (k, t, sub, done) => '<button type="button" class="opt" data-a="kind" data-v="' + k + '" aria-pressed="false"><span><span>' + t + '</span><span class="sub">' + esc(sub) + '</span></span>' + (done ? '<span style="color:var(--good);font-weight:600;font-size:13px">Hecho · corregir</span>' : '') + '</button>';
    out += '<div class="col g10">' + opt('diario', 'Estado del día', 'Sueño, piernas, estrés, ánimo y molestias', hasD) + opt('post', 'Sensaciones post-entreno', p ? 'Del plan de hoy: ' + planDesc(p) : 'Esfuerzo, clima, comida e hidratación de una salida', hasP) + '</div>';
    if (!hasP) out += '<div class="col g8"><div class="eyebrow">Otras opciones</div><div class="col g10">' + opt('skip', 'No pude entrenar hoy', 'Cuéntanos qué pasó', ex && ex.skip) + opt('descanso', 'Día de descanso', 'También cuenta para tu constancia', ex && ex.type === 'descanso' && !ex.skip) + '</div></div>';
  } else {
    const steps = stepList(f), cur = steps[f.i], n = steps.length;
    out += '<div class="row between"><button type="button" class="link" data-a="back">Atrás</button><span class="muted" style="font-size:13px">Paso ' + (f.i + 1) + ' de ' + n + (['infl', 'skip', 'fuel', 'molestia'].indexOf(cur) < 0 ? '' : ' · opcional') + '</span></div><div class="bar" aria-hidden="true"><i style="width:' + Math.round((f.i + 1) / n * 100) + '%;background:var(--accent)"></i></div>';
    if (cur === 'mood') out += '<div class="col g8"><h2 class="title">¿Cómo te sientes hoy?</h2><p class="muted">Toca una opción. Tarda unos segundos.</p></div><div class="col g10">' + MOODS.map((m, i) => '<button type="button" class="opt" data-a="mood" data-v="' + (i + 1) + '" aria-pressed="' + (d.mood === i + 1) + '"><span>' + m + '</span><span class="meter" aria-hidden="true"><i style="width:' + ((i + 1) * 20) + '%"></i></span></button>').join('') + '</div>';
    if (cur === 'infl') {
      out += '<div class="col g8"><h2 class="title">¿Qué influyó en tu día?</h2><p class="muted">Si quieres, cuéntanos más. Tu coach lo ve y ajusta contigo.</p></div>'
        + '<div class="col g10"><div style="font-weight:600">¿Cuánto dormiste?</div>' + chips('sleepH', SLEEPH, d.sleepH, 'Horas de sueño') + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Cómo dormiste?</div>' + chips('sleepQ', SLEEPQ, d.sleepQ, 'Calidad del sueño', (i) => i + 1) + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Cómo sientes las piernas?</div>' + chips('legs', LEGS, d.legs, 'Piernas') + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Y el estrés?</div>' + chips('stress', STRESS, d.stress, 'Estrés') + '</div>'
        + '<div class="col g10"><div style="font-weight:600">¿Algo fuera de lo habitual ayer? <span class="muted" style="font-weight:500;font-size:14px">(comida abundante, alcohol, trasnoche)</span></div>' + chips('prev', ['No', 'Sí'], d.prev, 'Ayer', (i) => (i ? 'si' : 'no')) + '</div>'
        + (d.prev === 'si' ? '<div class="card col g14" style="background:var(--surface2);border:1.5px solid var(--line)" aria-label="Detalle de lo habitual de ayer"><div class="info" role="note">' + infoIcon() + '<span>Cuéntanos qué fue distinto. Así tu coach entiende cómo llegas hoy y no lo toma como un mal día.</span></div><div class="col g10"><div style="font-weight:600">¿Qué pasó? <span class="muted" style="font-weight:500;font-size:14px">(puedes marcar varias)</span></div>' + multiChips('prevItems', PREVT, d.prevItems, 'Qué pasó ayer') + '</div><div class="col g8"><label for="prevText" style="font-weight:600">¿Quieres explicar un poco más?</label><textarea id="prevText" placeholder="Opcional. Por ejemplo: cena tarde con la familia, dormí 4 horas">' + esc(UI.draft.prevText || '') + '</textarea></div></div>' : '')
        + '<div class="col g8"><button type="button" class="btn primary" data-a="next" style="justify-content:center">Continuar</button><button type="button" class="btn ghost" data-a="next">Omitir</button></div>';
    }
    if (cur === 'sesion') {
      const p = planFor(off(0)), pk = f.slot === 2 ? null : planKind(p), tp = (k) => (pk && ((k === 'gym' && pk === 'gym') || (k === 'bici' && pk !== 'gym')));
      const ok = d.tipo === 'gym' || d.tipo === 'otra' || (d.tipo === 'bici' && d.bkind);
      const pdot = (on) => '<span class="pdot"' + (on ? '' : ' hidden') + ' role="img" aria-label="Sugerido por tu plan"></span>';
      const tile = (k, t) => '<button type="button" class="bigopt" data-a="pick" data-g="tipo" data-v="' + k + '" aria-pressed="' + (d.tipo === k) + '">' + kIcon(k, 24) + '<span>' + t + '</span>' + pdot(tp(k)) + '</button>';
      out += '<div class="col g8"><h2 class="title">' + (f.slot === 2 ? 'Tu segunda sesión' : '¿Qué hiciste?') + '</h2><p class="muted">Elige el tipo de sesión.</p></div><div class="row g10" style="align-items:stretch">' + tile('bici', 'Bici') + tile('gym', 'Gym') + '</div>'
        + (d.tipo === 'bici' ? '<div class="col g10"><div style="font-weight:600">¿Qué tipo de bici?</div><div class="po po3" role="group" aria-label="Tipo de bici">' + Object.keys(BKINDS).map((k) => '<button type="button" class="pob" data-a="pick" data-g="bkind" data-v="' + k + '" aria-pressed="' + (d.bkind === k) + '">' + BKINDS[k] + pdot(pk === k) + '</button>').join('') + '</div></div>' : '')
        + '<button type="button" data-a="pick" data-g="tipo" data-v="otra" aria-pressed="' + (d.tipo === 'otra') + '" class="opt ico">' + kIcon('otra', 24) + '<span>Otra</span><span class="sub" style="margin-left:auto">Trote, natación…</span></button>'
        + (d.tipo === 'gym' ? gymFields(d) : '')
        + (pk ? '<div class="plegend"><span class="pdot" aria-hidden="true"></span>Sugerido por tu plan</div>' : '')
        + '<div class="col g8"><button type="button" class="btn primary" data-a="next" style="justify-content:center"' + (ok ? '' : ' disabled') + '>Continuar</button></div>';
    }
    if (cur === 'how') {
      const act = d.activity, p = planFor(off(0)), pk = planKind(p), planOk = f.slot !== 2 && p && ((d.tipo === 'gym' && pk === 'gym') || (d.tipo === 'bici' && pk !== 'gym'));
      const cont = '<div class="col g8"><button type="button" class="btn primary" data-a="next" style="justify-content:center">Continuar</button><button type="button" class="btn ghost" data-a="next">Omitir</button></div>';
      if (d.tipo === 'bici') {
        out += '<div class="col g8"><h2 class="title">Tu salida</h2>' + (planOk && act && act.min ? '<div class="card tight row g12" style="background:var(--surface2)"><span class="col grow"><span class="eyebrow">Del plan de hoy · ' + BKINDS[d.bkind] + '</span><span style="font-weight:600">' + esc(act.name) + '</span><span class="muted" style="font-size:14px">' + esc(planDesc({ name: '', min: act.min, km: act.km }).replace(/^ · /, '')) + '</span></span>' + check('var(--good)', 22) + '</div>' : '<p class="muted">Cuéntanos cómo fue.</p>') + '</div>'
          + '<div class="col g10"><div style="font-weight:600">¿Qué tan duro fue? <span class="muted" style="font-weight:500;font-size:14px">(1 muy suave, 10 máximo)</span></div>' + rpeBar(d.rpe) + '</div>'
          + '<div class="col g10"><div style="font-weight:600">¿Cómo estuvo el clima?</div>' + chips('heat', HEAT, d.heat, 'Clima') + '</div>'
          + '<div class="col g10"><div style="font-weight:600">¿Hubo un tramo bastante más duro que el resto?</div>' + chips('hard', ['No', 'Sí'], d.hard, 'Tramo duro', (i) => (i ? 'si' : 'no')) + '</div>'
          + (d.hard === 'si' ? '<div class="card col g14" style="background:var(--surface2);border:1.5px solid var(--line)" aria-label="Detalle del tramo duro"><div class="info" role="note">' + infoIcon() + '<span>Cuéntanos un poco más de ese tramo. Ayuda a tu coach a ajustar las próximas sesiones.</span></div><div class="col g10"><div style="font-weight:600">¿Qué lo hizo duro?</div>' + chips('hardType', HARDT, d.hardType, 'Tipo de tramo', (i, l) => l) + '</div><div class="col g10"><div style="font-weight:600">¿Cuánto duró?</div>' + chips('hardDur', HARDD, d.hardDur, 'Duración del tramo', (i, l) => l) + '</div><div class="col g10"><div style="font-weight:600">¿Cómo lo terminaste?</div>' + chips('hardEnd', HARDE, d.hardEnd, 'Cómo terminaste', (i, l) => l) + '</div><div class="col g8"><label for="hardText" style="font-weight:600">¿Qué tramo fue? <span class="muted" style="font-weight:500;font-size:14px">(opcional)</span></label><input class="field" id="hardText" type="text" maxlength="200" placeholder="Por ejemplo: los últimos 10 min del repecho" value="' + esc(UI.draft.hardText || '') + '"></div></div>' : '') + cont;
      } else {
        out += '<div class="col g8"><h2 class="title">Tu sesión</h2></div>'
          + '<div class="col g8"><label for="oname" style="font-weight:600">¿Qué hiciste?</label><input class="field" id="oname" type="text" maxlength="80" placeholder="Por ejemplo: trote suave" value="' + esc(UI.draft.oname || '') + '"></div>'
          + '<div class="col g10"><div style="font-weight:600">¿Cuántos minutos duró?</div>' + plainOpts('odur', GDURS, d.odur, 'Minutos', 4) + '</div>'
          + '<div class="col g10"><div style="font-weight:600">¿Qué tan duro fue?</div>' + rpeBar(d.rpe) + '</div>' + cont;
      }
    }
    if (cur === 'skip') {
      out += '<div class="col g8"><h2 class="title">¿Qué pasó hoy?</h2><p class="muted">Sin culpa: saberlo ayuda a tu coach a reordenar la semana.</p></div><div class="col g10"><div style="font-weight:600">Motivo <span class="muted" style="font-weight:500;font-size:14px">(puedes marcar varios)</span></div>' + multiChips('skipItems', SKIPR, d.skipItems, 'Motivo') + '</div><div class="col g8"><label for="skipText" style="font-weight:600">Cuéntanos un poco más</label><textarea id="skipText" placeholder="Opcional">' + esc(UI.draft.skipText || '') + '</textarea></div><div class="col g8"><button type="button" class="btn primary" data-a="next" style="justify-content:center">Continuar</button><button type="button" class="btn ghost" data-a="next">Omitir</button></div>';
    }
    if (cur === 'fuel') {
      const gym = d.tipo === 'gym', more = UI.fuelMore || !!(UI.draft.preText || UI.draft.postText);
      out += '<div class="col g8"><h2 class="title">Comida e hidratación</h2><p class="muted">Opcional. Ayuda a tu coach y a tu nutricionista.</p></div>'
        + (gym ? '' : '<div class="col g10"><div style="font-weight:600">¿Cargaste carbohidratos antes o durante?</div>' + chips('carbs', CARBS, d.carbs, 'Carbohidratos') + '</div><div class="col g10"><div style="font-weight:600">¿Cómo fue tu hidratación?</div>' + chips('hydra', HYDRA, d.hydra, 'Hidratación') + '</div><div class="col g10"><div style="font-weight:600">¿Tuviste molestias digestivas?</div>' + chips('gi', ['No', 'Sí'], d.gi, 'Digestivas', (i) => (i ? 'si' : 'no')) + '</div>')
        + '<div class="col g10"><div style="font-weight:600">¿Cómo fue tu energía general?</div>' + chips('energy', ENERGY, d.energy, 'Energía') + '</div>'
        + (more ? '<div class="col g8"><label for="preText" style="font-weight:600">¿Qué comiste antes de entrenar?</label><input class="field" id="preText" type="text" maxlength="200" placeholder="Por ejemplo: avena con banana" value="' + esc(UI.draft.preText || '') + '"></div><div class="col g8"><label for="postText" style="font-weight:600">¿Qué comiste después?</label><input class="field" id="postText" type="text" maxlength="200" placeholder="Por ejemplo: batido de proteína" value="' + esc(UI.draft.postText || '') + '"></div>' : '<button type="button" class="link" data-a="fuelMore" style="align-self:flex-start;min-height:44px;color:var(--accent);font-weight:700">+ Contar qué comí antes y después</button>')
        + '<div class="col g8"><button type="button" class="btn primary" data-a="next" style="justify-content:center">Continuar</button><button type="button" class="btn ghost" data-a="next">Omitir</button></div>';
    }
    if (cur === 'molestia') {
      out += '<div class="col g8"><h2 class="title">¿Alguna molestia?</h2><p class="muted">Si hay, dinos dónde y cuánto. Es lo que más ayuda a tu coach.</p></div>' + chips('painYes', ['Ninguna', 'Sí, tengo una'], d.painYes, 'Molestia', (i) => (i ? 'si' : 'no'));
      if (d.painYes === 'si') {
        const zs = d.zones || [];
        out += '<div class="col g10"><div class="row between g8"><div style="font-weight:600">Zona</div><span class="muted" style="font-size:13px;font-weight:600" aria-live="polite">' + zs.length + ' de 3</span></div><div class="info" role="note">' + infoIcon() + '<span>Puedes marcar hasta 3 zonas si la molestia se siente en más de un lugar. Toca otra vez una zona para quitarla.</span></div><div class="chips" role="group" aria-label="Zonas">' + ZONES.map((z) => { const o = zs.indexOf(z) >= 0; return '<button type="button" class="chip" data-a="zone" data-v="' + z + '" aria-pressed="' + o + '"' + (!o && zs.length >= 3 ? ' style="opacity:.45"' : '') + '>' + z + '</button>'; }).join('') + '</div></div>'
          + '<div class="col g10"><div style="font-weight:600">Lado</div>' + chips('side', SIDES, d.side, 'Lado', (i, l) => l) + '</div><div class="col g10"><div style="font-weight:600">Intensidad</div>' + chips('level', LEVELS, d.level, 'Intensidad', (i, l) => l) + '</div>'
          + (d.level === 'Fuerte' || d.level === 'Moderada' ? '<div class="info" role="note">' + infoIcon() + '<span>' + (d.level === 'Fuerte' ? 'Una molestia fuerte merece atención. Tu coach la verá hoy, pero si te limita o aumenta, consulta también a un profesional de salud.' : 'Tu coach verá esta molestia hoy y ajustará la carga. Si empeora, avísale y considera consultar a un profesional de salud.') + '</span></div>' : '');
      }
      out += '<div class="col g8"><label for="comment" style="font-weight:600">¿Algo más que quieras contarle a tu coach?</label><textarea id="comment" placeholder="Opcional">' + esc(UI.draft.comment) + '</textarea></div><div class="col g8"><button type="button" class="btn primary" data-a="send" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '>' + (UI.busy ? 'Enviando…' : (f.kind === 'post' ? 'Enviar sesión' : 'Enviar check-in')) + '</button>' + (f.kind === 'post' && f.slot === 1 && !(on(meA(), off(0)) || {}).act2 ? '<button type="button" class="btn ghost" data-a="sendMore"' + (UI.busy ? ' disabled' : '') + '>Guardar y agregar otra sesión</button>' : '') + '</div>';
    }
  }
  if (f.step !== 'alt' && stepList(f)[f.i] === 'molestia') out = out.replace('class="inner flowsel"', 'class="inner flowsel nopos"');
  return out + '</div></div>';
}

const ckActions = () => {
  const c = on(meA(), off(0)); if (!c) return '';
  if (UI.confirmDel) return '<section class="card col g10" aria-label="Borrar check-in" style="border:1.5px solid var(--bad)"><div class="h3">¿Borrar el check-in de hoy?</div><p class="soft" style="font-size:14px">Se elimina de tu historial y tu coach dejará de verlo. Después puedes hacer uno nuevo.</p><div class="row g8 wrap"><button type="button" class="chip" data-a="delCk" style="border-color:var(--bad);color:var(--bad)">Sí, borrar</button><button type="button" class="chip" data-a="delNo">Cancelar</button></div></section>';
  return '<div class="row g8 wrap"><button type="button" class="chip" data-a="editCk">Corregir check-in</button><button type="button" class="chip" data-a="delAsk">Borrar check-in</button></div>';
};
/* ---------- Perfil del atleta (datos propios + medidas que aprueba el coach) ---------- */
const PF_SEX = [['f', 'Mujer'], ['m', 'Hombre'], ['o', 'Prefiero no decirlo']];
const PF_SPORT = ['Ruta', 'MTB', 'Gravel', 'Fuerza / Gym', 'Otra'];
const PF_MEAS = [['weightKg', 'Peso', 'kg', 30, 200], ['ftp', 'FTP', 'W', 50, 600], ['fcmax', 'FC máx', 'ppm', 120, 230], ['lthr', 'LTHR', 'ppm', 100, 220]];
const ageOf = (b) => { if (!b || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return null; const d = parse(b), t = new Date(); let a = t.getFullYear() - d.getFullYear(); if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--; return a >= 10 && a <= 100 ? a : null; };
const bioMain = () => (ST.myBio && ST.myBio.main) || null;
const bioMeas = () => (ST.myBio && ST.myBio.meas) || {};
const bioDone = (m) => { if (!m) return 0; const h = m.health || {}; return [m.birthDate, m.heightCm, m.sport, (m.emergency || {}).name && (m.emergency || {}).phone].filter(Boolean).length; };
/* ---------- Perfil v48: 8 secciones (p = ruta de guardado; c = cuenta para el avance) ---------- */
const PF_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const PSEC = [
  { id: 's1', t: 'Datos personales', sub: 'Nacimiento, estatura, disciplina y ciudad', f: [
    { p: 'birthDate', y: 'date', l: 'Fecha de nacimiento', c: 1 },
    { p: 'heightCm', y: 'num', l: 'Estatura (cm)', c: 1 },
    { p: 'sex', y: 'one', l: 'Sexo', h: '(opcional, ajusta algunas referencias fisiológicas)', o: PF_SEX },
    { p: 'sport', y: 'one', l: 'Disciplina principal', c: 1, o: PF_SPORT },
    { p: 'city', y: 'text', l: 'Ciudad', c: 1, max: 60 }] },
  { id: 's2', t: 'Salud', sub: 'Privada: solo tú y tu coach principal', priv: 1, f: [
    { p: 'health.conditions', y: 'cond', l: '¿Tienes alguna condición de salud que tu coach deba conocer?', c: 1 },
    { p: 'health.meds', y: 'area', l: 'Medicamentos habituales' },
    { p: 'health.injuries', y: 'area', l: 'Lesiones o molestias de largo plazo' },
    { p: 'health.allergies', y: 'area', l: 'Alergias' },
    { p: 'emergency.name', y: 'text', l: 'Contacto de emergencia: nombre y relación', c: 1, max: 80 },
    { p: 'emergency.phone', y: 'tel', l: 'Contacto de emergencia: teléfono', c: 1, max: 30 }] },
  { id: 's3', g: 'hist', t: 'Historial deportivo', sub: 'Años, disciplinas, nivel y volumen', f: [
    { p: 'hist.years', y: 'one', l: 'Años pedaleando', c: 1, o: ['Menos de 1 año', '1 a 3 años', '3 a 6 años', 'Más de 6 años'] },
    { p: 'hist.level', y: 'one', l: 'Tu nivel hoy', c: 1, o: ['Recreativo', 'Aficionado', 'Competitivo'] },
    { p: 'hist.discs', y: 'multi', l: 'Disciplinas que practicas', c: 1, o: ['Ruta', 'MTB', 'Gravel', 'Pista', 'Ciclocross', 'Gimnasio', 'Running', 'Natación'] },
    { p: 'hist.volume', y: 'one', l: 'Horas de entrenamiento por semana', c: 1, o: ['Menos de 4 h', '4 a 6 h', '6 a 8 h', '8 a 12 h', 'Más de 12 h'] }] },
  { id: 's4', g: 'equip', t: 'Equipamiento', sub: 'Bicis, sensores y ciclocomputador', f: [
    { p: 'equip.bikes', y: 'multi', l: 'Bicicletas que usas', c: 1, o: ['Ruta', 'MTB', 'Gravel', 'Pista', 'Rodillo'] },
    { p: 'equip.pm', y: 'multi', l: 'Potenciómetro', h: '(indica en qué bici lo tienes)', c: 1, o: ['Ruta', 'MTB', 'Gravel', 'Ninguno'] },
    { p: 'equip.trainer', y: 'one', l: 'Rodillo', c: 1, o: ['No tengo', 'Inteligente', 'Clásico'] },
    { p: 'equip.sensors', y: 'multi', l: 'Sensores que usas', c: 1, o: ['Banda de pulso', 'Pulso en muñeca', 'Cadencia', 'Velocidad'] },
    { p: 'equip.computer', y: 'one', l: 'Ciclocomputador o reloj', c: 1, o: ['Garmin', 'Wahoo', 'iGPSPORT', 'Hammerhead', 'Solo el celular', 'Otro'] },
    { p: 'equip.scale', y: 'one', l: 'Báscula', o: ['Sin báscula', 'Común', 'Bioimpedancia'] },
    { p: 'equip.icu', y: 'text', l: 'Correo de intervals.icu (opcional)', max: 80 }] },
  { id: 's5', g: 'avail', t: 'Disponibilidad', sub: 'Días, horario y dónde entrenas', f: [
    { p: 'avail.days', y: 'multi', l: 'Días en que puedes entrenar', c: 1, o: PF_DAYS },
    { p: 'avail.slot', y: 'multi', l: 'Horario habitual', c: 1, o: ['Mañana temprano', 'Mediodía', 'Tarde', 'Noche'] },
    { p: 'avail.where', y: 'multi', l: 'Dónde entrenas', c: 1, o: ['Outdoor', 'Indoor'] },
    { p: 'avail.hours', y: 'one', l: 'Horas que puedes dedicar por semana', c: 1, o: ['Hasta 4 h', '4 a 6 h', '6 a 8 h', 'Más de 8 h'] }] },
  { id: 's6', g: 'goals', t: 'Calendario y objetivos', sub: 'Objetivo A, fecha y qué buscas', f: [
    { p: 'goals.objA', y: 'text', l: 'Objetivo A: tu evento o meta principal', c: 1, max: 100 },
    { p: 'goals.objDate', y: 'date', l: 'Fecha del objetivo A', c: 1, any: 1 },
    { p: 'goals.why', y: 'one', l: 'Qué buscas', c: 1, o: ['Terminar con buenas sensaciones', 'Mejorar mi tiempo', 'Salud y constancia', 'Competir por el podio'] },
    { p: 'goals.others', y: 'area', l: 'Otras carreras o metas del año' }] },
  { id: 's7', g: 'diet', t: 'Alimentación', sub: 'Dieta, combustible y suplementos', f: [
    { p: 'diet.type', y: 'one', l: 'Tu alimentación', c: 1, o: ['Sin restricciones', 'Vegetariana', 'Vegana', 'Sin gluten', 'Otra'] },
    { p: 'diet.fuel', y: 'multi', l: 'Qué usas para comer sobre la bici', c: 1, o: ['Geles', 'Barras', 'Bebida isotónica', 'Comida real'] },
    { p: 'diet.supps', y: 'text', l: 'Suplementos que tomas', c: 1, max: 100 },
    { p: 'diet.notes', y: 'area', l: 'Algo más que tu nutricionista deba saber' }] },
  { id: 's8', g: 'gymp', t: 'Gimnasio y fuerza', sub: 'Rutina, días y objetivo', f: [
    { p: 'gymp.does', y: 'one', l: '¿Haces gimnasio?', c: 1, o: ['Sí', 'No'] },
    { p: 'gymp.days', y: 'multi', l: 'Días de gimnasio', c: 1, o: PF_DAYS },
    { p: 'gymp.focus', y: 'multi', l: 'Foco habitual', c: 1, o: ['Piernas', 'Tren superior', 'Cuerpo completo', 'Core y movilidad'] },
    { p: 'gymp.exp', y: 'one', l: 'Experiencia con pesas', c: 1, o: ['Principiante', 'Intermedio', 'Avanzado'] }] }
];
const PF_MIN = [['birthDate', 'fecha de nacimiento'], ['heightCm', 'estatura'], ['sport', 'disciplina'], ['goals.objA', 'objetivo A'], ['avail.days', 'días disponibles']];
const pfGet = (o, p) => p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
const pfHas = (v) => (Array.isArray(v) ? v.length > 0 : (v != null && String(v).trim() !== ''));
function pfStatus(sec, m) {
  const fs = sec.f.filter((f) => f.c), n = fs.filter((f) => pfHas(pfGet(m || {}, f.p))).length, t = fs.length;
  return { n, t, txt: n >= t ? 'Completa' : (n ? n + ' de ' + t : 'Pendiente'), tone: n >= t ? 'ok' : (n ? 'part' : 'none') };
}
const pfMissing = (m) => PF_MIN.filter((x) => !pfHas(pfGet(m || {}, x[0])));
function profDraft(sec) {
  const m = bioMain() || {}, d = {};
  sec.f.forEach((f) => { let v = pfGet(m, f.p); if (f.y === 'multi') v = Array.isArray(v) ? v.slice() : []; else if (v == null) v = ''; d[f.p] = (f.y === 'num' && v !== '') ? String(v) : v; });
  if (sec.id === 's1') d.showWeight = !!m.showWeight;
  if (sec.id === 's2') { const c = d['health.conditions']; d._cq = c === 'Ninguna' ? 'no' : (c ? 'si' : ''); }
  return d;
}
const pfOpt = (o) => (Array.isArray(o) ? o : [o, o]);
function pfField(f, d) {
  const id = 'pf-' + f.p, v = d[f.p], hint = f.h ? ' <span class="muted" style="font-weight:500;font-size:14px">' + esc(f.h) + '</span>' : '';
  const lab = '<label for="' + id + '" style="font-weight:600">' + esc(f.l) + hint + '</label>';
  const grp = (act, sel, g, opts) => '<div class="col g10"><div style="font-weight:600">' + esc(f.l) + hint + '</div><div class="chips" role="group" aria-label="' + esc(f.l) + '">' + opts.map((o) => { const x = pfOpt(o); return '<button type="button" class="chip" data-a="' + act + '" data-g="' + esc(g) + '" data-v="' + esc(x[0]) + '" aria-pressed="' + sel(x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>';
  if (f.y === 'date') return '<div class="col g8">' + lab + '<input class="field" id="' + id + '" type="date"' + (f.any ? '' : ' max="' + off(0) + '"') + ' value="' + esc(v) + '"></div>';
  if (f.y === 'num') return '<div class="col g8">' + lab + '<input class="field" id="' + id + '" type="number" inputmode="numeric" min="100" max="230" value="' + esc(v) + '"></div>';
  if (f.y === 'text' || f.y === 'tel') return '<div class="col g8">' + lab + '<input class="field" id="' + id + '" type="' + (f.y === 'tel' ? 'tel' : 'text') + '"' + (f.y === 'tel' ? ' inputmode="tel"' : '') + ' maxlength="' + (f.max || 80) + '" value="' + esc(v) + '"></div>';
  if (f.y === 'area') return '<div class="col g8">' + lab + '<textarea id="' + id + '" maxlength="300" rows="2">' + esc(v) + '</textarea></div>';
  if (f.y === 'one') return grp('pfSet', (x) => v === x, f.p, f.o);
  if (f.y === 'multi') return grp('pfMul', (x) => (v || []).indexOf(x) >= 0, f.p, f.o);
  if (f.y === 'cond') return grp('pfSet', (x) => d._cq === x, '_cq', [['no', 'No'], ['si', 'Sí, tengo algo que contar']]) + (d._cq === 'si' ? '<div class="col g8" style="margin-top:10px"><label for="' + id + '" style="font-weight:600">Cuéntale a tu coach</label><textarea id="' + id + '" maxlength="300" rows="3">' + esc(v === 'Ninguna' ? '' : v) + '</textarea></div>' : '');
  return '';
}
function profHtml() {
  const P = UI.prof, sec = PSEC.find((s) => s.id === P.sec), d = P.d, idx = PSEC.indexOf(sec) + 1, meas = bioMeas(), prop = meas.prop || {};
  let out = '<div class="inner flowsel nopos"><div class="stack" style="gap:18px"><div class="row between"><button type="button" class="link" data-a="profClose" style="min-height:44px">Volver</button><span class="muted" style="font-size:13px">Perfil · sección ' + idx + ' de ' + PSEC.length + '</span></div>'
    + '<div class="col g8"><h2 class="title">' + esc(sec.t) + '</h2><p class="muted">' + (sec.priv ? 'Comparte solo lo que quieras. Sirve para cuidarte mejor y no reemplaza una evaluación médica.' : 'Todo es opcional y puedes dejarlo a medias: se guarda cuando tocas «Guardar sección».') + '</p></div>';
  if (sec.priv) out += '<div class="info" role="note">' + infoIcon() + '<span><b>Información privada.</b> La ven solo tú y tu coach principal. Los coaches de apoyo y tu equipo no tienen acceso.</span></div>';
  out += '<section class="card col g14" aria-label="' + esc(sec.t) + '">' + sec.f.map((f) => pfField(f, d)).join('') + '</section>';
  if (sec.id === 's1') {
    out += '<section class="card col g12" aria-label="Medidas"><div class="eyebrow">Medidas de tu coach</div><p class="soft" style="font-size:14px">Las confirma tu coach para que sus cálculos sean consistentes. Si cambiaron, propón el nuevo valor y él lo revisa.</p><div class="setlist">'
      + PF_MEAS.map((x) => {
        const k = x[0], cur = meas[k], pr = prop[k], hide = k === 'weightKg' && !d.showWeight && cur != null;
        const val = cur == null ? 'Sin dato' : (hide ? 'Oculto' : cur + ' ' + x[2]);
        let row = '<div class="col g8" style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="row between g10" style="align-items:center"><span class="col g4" style="min-width:0"><span style="font-weight:600">' + x[1] + '</span><span class="muted" style="font-size:14px">' + val + (cur != null && meas.updatedAt ? ' · ' + relTime(meas.updatedAt) : '') + '</span></span>'
          + (pr ? '<span class="tag">En revisión · ' + pr.v + ' ' + x[2] + '</span>' : '<button type="button" class="chip" data-a="pfOpen" data-v="' + k + '" aria-pressed="' + (P.open === k) + '">Proponer cambio</button>') + '</div>';
        if (pr) row += '<div class="row g10 wrap" style="align-items:center"><span class="muted" style="font-size:13px">Enviado ' + relTime(pr.ts) + (pr.note ? ' · “' + esc(pr.note) + '”' : '') + '</span><button type="button" class="link" data-a="pfWithdraw" data-v="' + k + '">Retirar</button></div>';
        if (!pr && P.open === k) row += '<div class="col g10"><input class="field" id="pp-' + k + '" type="number" inputmode="decimal" placeholder="Nuevo valor (' + x[2] + ')" min="' + x[3] + '" max="' + x[4] + '"><input class="field" id="pp-note" type="text" maxlength="120" placeholder="Nota para tu coach (opcional)"><button type="button" class="btn primary" data-a="pfProp" data-v="' + k + '" style="justify-content:center"><span>Enviar a mi coach</span></button></div>';
        return row + '</div>';
      }).join('') + setRow('Mostrar mi peso en pantalla', d.showWeight ? 'Tu peso se ve en esta pantalla' : 'Oculto por defecto: tu coach igual lo usa en sus cálculos', d.showWeight, 'pfSw') + '</div></section>';
  }
  return out + '<div class="col g8"><button type="button" class="btn primary" data-a="profSave" style="justify-content:center"' + (UI.busy ? ' disabled' : '') + '><span>Guardar sección</span></button><button type="button" class="btn ghost" data-a="profClose">Cancelar</button></div></div></div>';
}
/* Pre-carga: lo que Camino ya sabe por tus check-ins y lo que tu coach tiene registrado; se confirma con un toque. */
function pfSuggest() {
  const m = bioMain() || {}, pre = m.pre || {}, a = meA(), cks = (a && a.checkins) || [], out = [];
  const kinds = []; cks.forEach((c) => { const k = c.activity && c.activity.kind; if (BKINDS[k] && kinds.indexOf(k) < 0) kinds.push(k); });
  if (!pfHas(m.sport) && pre.sport == null && kinds.length) { const k = lastBikeKind(a); out.push({ id: 'sport', l: 'Disciplina principal: ' + BKINDS[k], patch: { sport: BKINDS[k] } }); }
  if (!pfHas((m.equip || {}).bikes) && pre.bikes == null && kinds.length) { const ls = kinds.map((k) => BKINDS[k]); out.push({ id: 'bikes', l: 'Bicicletas que usas: ' + ls.join(', '), patch: { equip: Object.assign({}, m.equip || {}, { bikes: ls }) } }); }
  if (!pfHas((m.gymp || {}).does) && pre.gym == null && cks.some((c) => (c.activity && c.activity.kind === 'gym') || (c.act2 && c.act2.kind === 'gym'))) out.push({ id: 'gym', l: 'Haces gimnasio', patch: { gymp: Object.assign({}, m.gymp || {}, { does: 'Sí' }) } });
  return out;
}
function pfKnown() { const ms = bioMeas(), m = bioMain() || {}; return PF_MEAS.filter((x) => ms[x[0]] != null && (x[0] !== 'weightKg' || m.showWeight)).map((x) => x[1] + ' ' + ms[x[0]] + ' ' + x[2]); }
function viewPerfil() {
  const m = bioMain(), secs = PSEC.map((s) => Object.assign({ s }, pfStatus(s, m))), tot = secs.reduce((a, x) => a + x.t, 0), done = secs.reduce((a, x) => a + x.n, 0), pct = tot ? Math.round(done / tot * 100) : 0, full = secs.filter((x) => x.n >= x.t).length, miss = pfMissing(m), sug = pfSuggest(), known = pfKnown();
  const circ = 213.6, chip = { ok: 'background:var(--good-soft);color:var(--good)', part: 'background:var(--surface2);color:var(--text)', none: 'background:var(--accent-soft);color:var(--accent)' };
  let out = '<div class="inner"><div class="stack">' + head('Tu ficha de atleta', 'Perfil') + msgBanner() + '<p class="soft" style="font-size:15px">Cuanto más completo, mejor ajusta Camino tu plan. Tómate tu tiempo: cada sección se guarda por separado.</p>';
  out += '<section class="card row g14" aria-label="Avance del perfil" style="align-items:center"><svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label="' + pct + '% completado" style="flex:none"><circle cx="42" cy="42" r="34" fill="none" stroke="var(--line)" stroke-width="9"/><circle cx="42" cy="42" r="34" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - pct / 100)).toFixed(1) + '" transform="rotate(-90 42 42)"/><text x="42" y="48" text-anchor="middle" font-family="var(--font-d)" font-weight="700" font-size="24" fill="var(--text)">' + pct + '%</text></svg>'
    + '<div class="col g6"><div style="font-weight:700;font-size:17px">' + full + ' de ' + PSEC.length + ' secciones</div>'
    + (miss.length ? '<div style="font-size:14px;color:var(--accent);font-weight:600">Para tu plan falta: ' + miss.map((x) => x[1]).join(', ') + '</div>' : '<div class="row g6" style="align-items:center;font-size:14px;color:var(--good);font-weight:600">' + ph('check', 18, 'var(--good)') + 'Mínimo para tu plan: listo</div>')
    + '<div class="muted" style="font-size:13px">Lo demás es opcional y se completa cuando quieras.</div></div></section>';
  const nPre = sug.length + known.length;
  if (nPre) {
    out += '<section class="card col g10" aria-label="Datos que ya conocemos" style="background:var(--accent-soft);border:1.5px solid var(--accent)"><div style="font-size:15px;line-height:1.4"><b>Tu coach y Camino ya conocen ' + nPre + (nPre === 1 ? ' dato' : ' datos') + ' tuyos.</b> Confírmalos con un toque, sin escribir nada.</div><button type="button" class="btn primary" data-a="pfPre" aria-expanded="' + !!UI.pfPre + '" style="align-self:flex-start;min-height:44px;padding:0 18px;width:auto;flex:none"><span>' + (UI.pfPre ? 'Cerrar' : 'Revisar') + '</span></button>';
    if (UI.pfPre) {
      out += '<div class="col g8">' + sug.map((x) => '<div class="col g8" style="padding:8px 0;border-top:1px solid var(--line)"><span style="font-weight:600">' + esc(x.l) + '</span><div class="row g8 wrap"><button type="button" class="chip" data-a="pfPreOk" data-v="' + x.id + '">Sí, es así</button><button type="button" class="chip" data-a="pfPreNo" data-v="' + x.id + '">No es así</button></div></div>').join('')
        + (known.length ? '<div style="padding:8px 0;border-top:1px solid var(--line)"><span class="eyebrow">Tu coach ya tiene registrado</span><div style="margin-top:4px">' + esc(known.join(' · ')) + '</div><div class="muted" style="font-size:13px;margin-top:4px">Si algo cambió, propón el nuevo valor en «Datos personales».</div></div>' : '') + '</div>';
    }
    out += '</section>';
  }
  out += '<div class="col g10">' + secs.map((x, i) => '<button type="button" class="card row g12" data-a="profOpen" data-v="' + x.s.id + '" style="text-align:left;width:100%;align-items:center;border:1.5px solid var(--line);font:inherit;color:inherit;min-height:64px"><span aria-hidden="true" style="width:36px;height:36px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-weight:700;font-size:20px;flex:none">' + (i + 1) + '</span><span class="col grow g4" style="min-width:0"><span style="font-weight:700;font-size:16px">' + esc(x.s.t) + '</span><span class="muted" style="font-size:13px">' + esc(x.s.sub) + '</span></span><span style="font-size:13px;font-weight:700;border-radius:999px;padding:4px 10px;flex:none;' + chip[x.tone] + '">' + x.txt + '</span>' + arrow() + '</button>').join('') + '</div>';
  out += '<section class="card col g10" aria-label="Tus datos"><div class="row g8" style="align-items:flex-start"><span style="flex:none;margin-top:2px">' + ph('shield', 18, 'var(--muted)') + '</span><p class="soft" style="font-size:14px">Tu salud y tu contacto de emergencia los ven solo tú y tu coach principal. El resto lo ven tu coach y, si tiene permiso, tus coaches de apoyo.</p></div><div class="col g8"><button type="button" class="btn ghost" data-a="pfExport" style="justify-content:center;border:1.5px solid var(--line)"><span>Descargar mis datos</span></button>'
    + (UI.pfDel ? '<p class="soft" style="font-size:14px">Se enviará una solicitud a tu coach para eliminar tu cuenta y todos tus registros. ¿Confirmas?</p><div class="row g10"><button type="button" class="btn primary" data-a="pfDelReq" style="flex:1;justify-content:center"><span>Sí, solicitar</span></button><button type="button" class="btn ghost" data-a="pfDelNo" style="flex:1;justify-content:center"><span>Cancelar</span></button></div>' : '<button type="button" class="btn ghost" data-a="pfDelAsk" style="justify-content:center;border:1.5px solid var(--line)"><span>Solicitar eliminar mi cuenta</span></button>') + '</div></section>';
  return out + '</div></div>';
}
/* Ficha en la Cabina: resumen de las secciones nuevas y alertas útiles para planificar. */
function bioExtra(m, showHealth) {
  const j = (v) => (Array.isArray(v) ? v.join(', ') : (v || '')), g = (n) => m[n] || {};
  const row = (l, v) => v ? '<div class="col g4"><span class="eyebrow">' + l + '</span><span style="overflow-wrap:anywhere">' + esc(v) + '</span></div>' : '';
  const al = [];
  const inj = (m.health || {}).injuries;
  if (showHealth && pfHas(inj) && String(inj).trim().toLowerCase() !== 'ninguna') al.push('Molestias o lesiones declaradas: revisa su ficha de salud antes de subir la carga.');
  if (Array.isArray(g('equip').pm) && g('equip').pm.indexOf('Ninguno') >= 0 && g('equip').pm.length === 1) al.push('Sin potenciómetro: dosifica con frecuencia cardíaca y RPE.');
  else if (Array.isArray(g('equip').pm) && g('equip').pm.length && g('equip').pm.indexOf('Ninguno') < 0) al.push('Potenciómetro en: ' + g('equip').pm.join(', ') + '. En las demás bicis usa FC y RPE.');
  if (!pfHas(g('avail').days)) al.push('Disponibilidad pendiente: pídele que complete la sección 5.');
  return (al.length ? '<div class="col g6">' + al.map((x) => '<div class="info" role="note">' + infoIcon() + '<span>' + esc(x) + '</span></div>').join('') + '</div>' : '')
    + row('Ciudad', m.city) + row('Historial', [g('hist').years, g('hist').level, j(g('hist').discs), g('hist').volume].filter(pfHas).join(' · '))
    + row('Equipamiento', [j(g('equip').bikes) && 'Bicis: ' + j(g('equip').bikes), g('equip').computer, j(g('equip').sensors), g('equip').trainer && 'Rodillo: ' + g('equip').trainer, g('equip').scale].filter(Boolean).join(' · '))
    + row('Disponibilidad', [j(g('avail').days), j(g('avail').slot), j(g('avail').where), g('avail').hours].filter(pfHas).join(' · '))
    + row('Objetivos', [g('goals').objA, g('goals').objDate, g('goals').why, g('goals').others].filter(pfHas).join(' · '))
    + row('Alimentación', [g('diet').type, j(g('diet').fuel), g('diet').supps, g('diet').notes].filter(pfHas).join(' · '))
    + row('Gimnasio', [g('gymp').does, j(g('gymp').days), j(g('gymp').focus), g('gymp').exp].filter(pfHas).join(' · '));
}
function bioPanel(a, ro) {
  const b = ST.athBio[a.id] || {}, m = b.main, ms = b.meas || {}, prop = ms.prop || {}, h = (m && m.health) || {}, e = (m && m.emergency) || {};
  const row = (l, v) => v ? '<div class="col g4"><span class="eyebrow">' + l + '</span><span style="overflow-wrap:anywhere">' + esc(v) + '</span></div>' : '';
  let out = '<div class="col g12" style="padding:6px 0 12px">';
  if (!m) out += '<p class="soft" style="font-size:14px">' + esc(a.first) + ' aún no completa su perfil.</p>';
  else out += row('Edad y estatura', [ageOf(m.birthDate) != null ? ageOf(m.birthDate) + ' años' : '', m.heightCm ? m.heightCm + ' cm' : '', m.sport || ''].filter(Boolean).join(' · ')) + ((ro || !isOwner()) ? '' : row('Lesiones', h.injuries) + row('Condiciones', h.conditions) + row('Medicamentos', h.meds) + row('Alergias', h.allergies) + row('Emergencia', [e.name, e.phone].filter(Boolean).join(' · ')))
    + bioExtra(m, !(ro || !isOwner()));
  out += '<div class="col g10"><span class="eyebrow">Medidas confirmadas</span>' + PF_MEAS.map((x) => {
    const k = x[0], pr = prop[k];
    return '<div class="col g8" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="row between g10" style="align-items:center"><span style="font-weight:600">' + x[1] + ' <span class="muted" style="font-weight:500">' + (ms[k] != null ? ms[k] + ' ' + x[2] : 'sin dato') + '</span></span>'
      + (pr && !ro ? '<span class="row g8"><button type="button" class="chip" data-a="bioOk" data-v="' + esc(a.id) + '|' + k + '">Aprobar ' + pr.v + '</button><button type="button" class="chip" data-a="bioNo" data-v="' + esc(a.id) + '|' + k + '">Rechazar</button></span>' : '') + '</div>'
      + (pr && pr.note ? '<span class="muted" style="font-size:13px">“' + esc(pr.note) + '”</span>' : '')
      + (ro ? '' : '<div class="row g8"><input class="field" id="bm-' + k + '" type="number" inputmode="decimal" placeholder="Fijar ' + x[1] + ' (' + x[2] + ')" style="min-height:40px"><button type="button" class="chip" data-a="bioSet" data-v="' + esc(a.id) + '|' + k + '">Guardar</button></div>') + '</div>';
  }).join('') + '</div></div>';
  return out;
}
function feedbackHtml() {
  const a = meA(), c = UI.feedback && UI.feedback.checkin ? UI.feedback.checkin : on(a, off(0)), newB = UI.feedback ? UI.feedback.newBadges : [];
  if (!c) return '';
  const st = streak(a); let dots = '';
  for (let k = -6; k <= 0; k++) {
    const ci = on(a, off(k)); let bg = 'transparent', bd = 'var(--muted)';
    if (ci && ci.type === 'descanso') { bg = 'transparent'; bd = 'var(--accent)'; } else if (ci) { bg = 'var(--accent)'; bd = 'var(--accent)'; }
    if (k === 0 && ci) { bg = 'var(--good)'; bd = 'var(--good)'; }
    dots += '<i style="flex:1;height:10px;border-radius:5px;border:1.5px solid ' + bd + ';background:' + bg + '"></i>';
  }
  const n = lastNote(a);
  let out = '<div class="inner"><div class="stack"><div class="row g14 pop"><div class="row" style="width:56px;height:56px;border-radius:50%;justify-content:center;background:var(--good-soft);border:1.5px solid var(--good);flex:none">' + check('var(--good)', 28) + '</div><div class="col g4"><h2 class="h2" style="font-size:34px">Listo, gracias, ' + esc(a.first) + '</h2><div class="muted" style="font-size:14px">Check-in enviado a tu coach</div></div></div><section class="card"><div class="eyebrow">Lo que vemos</div><p style="margin-top:8px;font-size:17px">' + esc(insightFor(c)) + '</p></section>';
  if (newB && newB.length) out += newB.map((b) => '<section class="card row g14 pop" style="border:1.5px solid var(--accent);background:var(--accent-soft)"><div class="row" style="width:56px;height:56px;border-radius:50%;justify-content:center;border:2px solid var(--accent);flex:none">' + icon(b.id, 28, 'var(--accent)') + '</div><div class="col g4"><div class="eyebrow" style="color:var(--accent)">Nueva insignia</div><div class="h3">' + esc(b.label) + '</div></div></section>').join('');
  out += '<section class="card"><div class="row between g8" style="align-items:baseline"><div class="eyebrow">Tu ánimo · 7 días</div><div class="muted" style="font-size:13px">hoy: ' + (c.mood != null ? at(MOODS, c.mood - 1).toLowerCase() : 'sin registrar') + '</div></div><div style="margin-top:10px">' + spark(a) + '</div></section><section class="card"><div class="eyebrow">Tu constancia</div><div class="row g8" style="margin-top:12px" aria-hidden="true">' + dots + '</div><p class="soft" style="margin-top:12px">' + st.n + (st.n === 1 ? ' día' : ' días') + ' seguidos. Los días de descanso cuentan.</p></section>';
  if (n) out += '<section class="card"><div class="eyebrow">Nota de tu coach · ' + relTime(n.at) + '</div><p class="soft" style="margin-top:8px">“' + esc(n.text) + '”</p></section>';
  out += ckActions();
  return out + '<div class="col g8"><a href="#ruta" data-a="closeFb" class="btn primary"><span>Ver mi ruta</span>' + arrow() + '</a><button type="button" class="btn ghost" data-a="closeFb">Volver a Hoy</button></div></div></div>';
}
const overlayHtml = () => (UI.act ? actSheetHtml() : UI.prof ? profHtml() : (UI.flow ? flowHtml() : (UI.feedback ? feedbackHtml() : (UI.inbox ? inboxHtml() : (UI.fz ? fzHtml() : (UI.wk ? weekSheetHtml() : ''))))));

/* ---------- Historia: tu camino recorrido ---------- */
function bestWeekMin(a) {
  const w = {};
  a.checkins.forEach((c) => { if (c.type === 'actividad' && c.activity && c.activity.min) { const d = parse(c.date), mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = ymd(mon); w[k] = (w[k] || 0) + c.activity.min; } });
  const v = Object.keys(w).map((k) => w[k]); return v.length ? Math.max.apply(null, v) : 0;
}
/* Salidas: dias con actividad del historial sincronizado + dias con check-in de actividad (sin repetir). */
function outingDays(a) {
  const set = {};
  const h = ST.myHist;
  if (h && Array.isArray(h.acts)) h.acts.forEach((d) => { if (typeof d === 'string') set[d.slice(0, 10)] = 1; });
  a.checkins.forEach((c) => { if (c.type === 'actividad') set[c.date] = 1; });
  return Object.keys(set).sort();
}
function bestWeekOutings(days) {
  const w = {}; let max = 0;
  days.forEach((ds) => { const d = parse(ds), mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = ymd(mon); w[k] = (w[k] || 0) + 1; if (w[k] > max) max = w[k]; });
  return max;
}
function storyHtml() {
  if (UI.story == null) return '';
  const a = meA(), od = outingDays(a), nOut = od.length, total = a.checkins.length, bw = bestWeekMin(a), bwo = bestWeekOutings(od), t = myTeam() ? teamTotals(myTeam()) : (isCoach() ? teamsTotal() : null);
  const first = od.length ? od[0] : null, spanDays = first ? Math.max(1, diffDays(first, off(0)) + 1) : 0;
  const s0 = nOut
    ? { big: String(nOut), unit: nOut === 1 ? 'salida registrada' : 'salidas registradas', line: 'En ' + spanDays + ' días de historia' + (total ? ' y ' + total + (total === 1 ? ' check-in' : ' check-ins') : '') + '. Tu constancia es lo que más construye.' }
    : { big: String(total), unit: total === 1 ? 'check-in' : 'check-ins', line: 'Cuando se sumen tus salidas, aquí verás todo lo que has construido.' };
  const s1 = bw
    ? { big: Math.floor(bw / 60) + ' h ' + pad(bw % 60), unit: 'de actividad', line: 'Sostuviste el volumen y te recuperaste. Esa es tu base para la meta.' }
    : (bwo ? { big: String(bwo), unit: bwo === 1 ? 'salida en tu mejor semana' : 'salidas en tu mejor semana', line: 'Sostuviste el volumen y te recuperaste. Esa es tu base para la meta.' } : { big: '–', unit: 'aún sin datos', line: 'Cuando registres actividades, aquí verás tu semana más larga.' });
  const s2 = t
    ? (t.members ? { big: t.km.toLocaleString('es-CL'), unit: 'km juntos este mes', line: 'Entre ' + t.members + (t.members === 1 ? ' atleta' : ' atletas') + ' ya van al ' + Math.min(100, Math.round(t.km / t.goal * 100)) + '% de la meta del mes. Cada salida suma.' }
        : { big: '0', unit: 'km juntos este mes', line: 'El equipo parte desde cero este mes. Cada check-in con km suma a la meta de ' + t.goal.toLocaleString('es-CL') + ' km.' })
    : { big: '–', unit: 'sin equipo aún', line: 'Cuando tu coach te asigne a un equipo verás aquí lo que logran juntos.' };
  const sl = [
    Object.assign({ c: 's0', k: 'Tu camino hasta hoy', btn: 'Siguiente' }, s0),
    Object.assign({ c: 's1', k: 'Tu semana más larga', btn: 'Siguiente' }, s1),
    Object.assign({ c: 's2', k: 'Tu equipo', btn: 'Terminar' }, s2)
  ];
  const s = sl[UI.story];
  return '<div class="story ' + s.c + '" role="dialog" aria-label="Tu camino recorrido"><div class="inner"><div class="row g8" aria-hidden="true">' + sl.map((x, i) => '<i style="flex:1;height:4px;border-radius:2px;background:currentColor;opacity:' + (i <= UI.story ? 1 : .3) + '"></i>').join('') + '</div><div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="x" data-a="storyClose">Cerrar</button></div><div class="col g10" style="flex:1;justify-content:center">' + (s.c === 's2' && myTeam() ? '<div>' + teamLogo(myTeam(), 'full', 110, true) + '</div>' : '') + '<div style="font-size:13px;letter-spacing:.12em;font-weight:600;text-transform:uppercase">' + s.k + '</div><div class="bigv">' + esc(s.big) + '</div><div style="font-family:var(--font-d);font-weight:600;font-size:34px;line-height:1.1">' + s.unit + '</div><p style="font-size:19px;margin-top:12px;line-height:1.45">' + esc(s.line) + '</p></div><button type="button" class="sbtn" data-a="storyNext">' + s.btn + '</button></div></div>';
}

/* ---------- Render ---------- */
function applyPrefs() { const r = document.documentElement; if (PREF.calm) r.setAttribute('data-calm', ''); else r.removeAttribute('data-calm'); }
function applyTone() { const r = document.documentElement; if (PREF.tone === 'auto') r.removeAttribute('data-tone'); else r.setAttribute('data-tone', PREF.tone); }
const VIEWS = { hoy: viewHoy, datos: viewDatos, ruta: viewRuta, planificar: viewPlanificar, cabina: viewCabina, guia: viewGuia, ajustes: viewAjustes, perfil: viewPerfil };
let softPending = false;
function soft() { const t = document.activeElement; if (t && /^(TEXTAREA|INPUT)$/.test(t.tagName)) { softPending = true; return; } render(); }
/* Vista del coach "como atleta": solo lectura. Muestra Hoy o Ruta con el plan, los check-ins y las notas del atleta elegido (lo que su coach ya puede leer por las reglas). */
function asRun(fn) {
  const id = UI.asId, who = ST.athletes.find((x) => x.id === id);
  if (!who) return null;
  const sv = { user: ST.user, profile: ST.profile, myPlan: ST.myPlan, myHist: ST.myHist, myCk: ST.myCk, myNotes: ST.myNotes, js: UI.justSaved };
  try {
    ST.user = { uid: id, name: who.name }; ST.profile = { name: who.name, role: 'athlete', team: who.team || null, pending: false };
    ST.myPlan = ST.athPlan[id] || null; ST.myHist = ST.athHist[id] || null; ST.myCk = ST.athCk[id] || []; ST.myNotes = ST.athNotes[id] || []; UI.justSaved = null;
    return fn();
  } finally { ST.user = sv.user; ST.profile = sv.profile; ST.myPlan = sv.myPlan; ST.myHist = sv.myHist; ST.myCk = sv.myCk; ST.myNotes = sv.myNotes; UI.justSaved = sv.js; }
}
function viewAs() {
  const id = UI.asId, who = ST.athletes.find((x) => x.id === id);
  if (!who) { UI.asId = null; return VIEWS[UI.view](); }
  let html = asRun(() => VIEWS[UI.view]());
  html = html.replace(/data-a="(start|feedback|editCk|delAsk|delCk)"/g, 'disabled data-x="$1"');
  const bar = '<section class="card col g10" aria-label="Vista de coach" style="border:1.5px dashed var(--accent)"><div class="eyebrow" style="color:var(--accent)">Vista de ' + esc(firstName(who.name)) + ' · solo lectura</div><p class="soft" style="font-size:14px">Así ve la app tu atleta. Los check-ins de esta vista llegan de sus últimos 14 días, así que las insignias pueden verse más bajas que las suyas.</p><button type="button" class="chip" data-a="verComoSalir" style="align-self:flex-start">Volver a Cabina</button></section>';
  return html.replace('<div class="stack">', '<div class="stack">' + bar);
}
function render() {
  softPending = false;
  const main = document.getElementById('view'), top = document.getElementById('top'), nav = document.getElementById('nav'), ov = document.getElementById('overlay'), story = document.getElementById('story');
  const st = main.scrollTop;
  if (!ST.ready) { main.innerHTML = viewLoading(); top.innerHTML = topHtml(); nav.innerHTML = ''; ov.hidden = true; story.innerHTML = ''; return; }
  if (!ST.user || !ST.profile) { main.innerHTML = ST.user ? viewLoading() : viewLogin(); top.innerHTML = topHtml(); nav.innerHTML = ''; ov.hidden = true; ov.innerHTML = ''; story.innerHTML = ''; return; }
  const ids = tabs().map((t) => t.id); if (ids.indexOf(UI.view) < 0) UI.view = ids[0];
  main.innerHTML = (UI.asId && isCoach() && (UI.view === 'hoy' || UI.view === 'datos' || UI.view === 'ruta')) ? viewAs() : VIEWS[UI.view]();
  main.scrollTop = (UI.lastView === UI.view) ? st : 0; UI.lastView = UI.view;
  top.innerHTML = topHtml(); nav.innerHTML = navHtml();
  const h = (UI.wk && UI.asId && isCoach()) ? (asRun(overlayHtml) || '') : overlayHtml(), keep = ov.scrollTop;
  ov.innerHTML = h; ov.hidden = !h; if (h) ov.scrollTop = keep;
  tourMaybeOpen();
  story.innerHTML = UI.tour != null ? tourHtml() : ((UI.asId && isCoach() && UI.story != null) ? (asRun(storyHtml) || '') : storyHtml());
}
function route() { const ids = tabs().map((t) => t.id); let h = location.hash.slice(1); if (ids.indexOf(h) < 0) h = ids[0]; UI.view = h; if (h === 'cabina' || h === 'ajustes') UI.asId = null; render(); }
let msgTimer = null;
function say(msg, kind) { UI.msg = msg; UI.msgKind = kind || 'err'; clearTimeout(msgTimer); if (msg) msgTimer = setTimeout(() => { UI.msg = ''; render(); }, (kind || 'err') === 'ok' ? 6000 : 10000); render(); }
const friendly = (e) => {
  const c = e && e.code ? String(e.code) : '';
  if (c.indexOf('permission-denied') >= 0) return 'No tienes permiso para esa acción. Si crees que es un error, avísale a tu coach.';
  if (c.indexOf('unavailable') >= 0 || c.indexOf('network') >= 0) return 'Sin conexión por ahora. Reintenta cuando vuelva la señal.';
  if (c.indexOf('unauthorized-domain') >= 0) return 'Este sitio aún no está autorizado para iniciar sesión. Avísale a tu coach.';
  return 'Algo no salió bien. Intenta de nuevo.';
};

/* ---------- Datos en vivo ---------- */
function stopData() { dataUnsubs.forEach((u) => { try { u(); } catch (e) {} }); dataUnsubs = []; Object.keys(chatSubs).forEach((k) => { try { chatSubs[k](); } catch (e) {} }); chatSubs = {}; Object.keys(athSubs).forEach((k) => athSubs[k].forEach((u) => { try { u(); } catch (e) {} })); athSubs = {}; dataKey = ''; }
function stopAll() { ownUnsubs.forEach((u) => { try { u(); } catch (e) {} }); ownUnsubs = []; stopData(); }
function setupData() {
  const p = ST.profile; if (!p || !ST.user) return;
  const key = [ST.user.uid, p.role, p.team || '', p.role === 'viewer' ? JSON.stringify(p.access || {}) : ''].join('|'); if (key === dataKey) return;
  stopData(); // se reinician solo las lecturas de equipo y de coach
  if (p.role === 'viewer') { ST.athletes = []; ST.athCk = {}; ST.athNotes = {}; ST.athPlan = {}; ST.athHist = {}; ST.athBio = {}; ST.teamKm = {}; ST.teamMeta = {}; }
  dataKey = key;
  const teams = p.role === 'coach' ? ['grnt', 'zn'] : p.role === 'viewer' ? ((p.access && p.access.teams) || []).filter((t) => TEAMS[t]) : (p.team ? [p.team] : []);
  teams.forEach((t) => {
    dataUnsubs.push(be.listenTeamKm(t, (rows) => { ST.teamKm[t] = rows; soft(); }));
    dataUnsubs.push(be.listenTeamMeta(t, (m) => { ST.teamMeta[t] = m || {}; soft(); }));
  });
  if (p.role === 'coach' || p.role === 'viewer') {
    if (p.role === 'coach') dataUnsubs.push(be.listenFeedback((rows) => { ST.fbk = rows; soft(); }));
    dataUnsubs.push(p.role === 'viewer' ? be.listenProposals((rows) => { ST.props = rows; soft(); }, ST.user.uid) : be.listenProposals((rows) => { ST.props = rows; soft(); }));
    const onAth = (rows) => {
      if (p.role === 'viewer') rows = rows.filter((r) => r.role !== 'viewer'); ST.athletes = rows; /* incluye al propio coach si su documento tiene coachId = su uid (para cargar su plan e historial) */
      const ids = ST.athletes.map((r) => r.id);
      if (p.role === 'coach') { const vids = ST.athletes.filter((r) => r.role === 'viewer').map((r) => r.id); Object.keys(chatSubs).forEach((k) => { if (vids.indexOf(k) < 0) { try { chatSubs[k](); } catch (e) {} delete chatSubs[k]; } }); vids.forEach((id) => { if (!chatSubs[id]) chatSubs[id] = be.listenChat(id, (rs) => { (ST.chat = ST.chat || {})[id] = rs; soft(); }); }); }
      Object.keys(athSubs).forEach((k) => { if (ids.indexOf(k) < 0) { athSubs[k].forEach((u) => u()); delete athSubs[k]; } });
      ids.forEach((id) => { if (!athSubs[id]) athSubs[id] = [be.listenCheckins(id, (c) => { ST.athCk[id] = c; soft(); }, 14), be.listenNotes(id, (n) => { ST.athNotes[id] = n; soft(); }), be.listenPlan(id, (pl) => { ST.athPlan[id] = pl; soft(); }), be.listenHistory(id, (h) => { ST.athHist[id] = h; soft(); }), ].concat(p.role === 'coach' || (p.role === 'viewer' && (p.access || {}).profile === true) ? [be.listenBio(id, (b) => { ST.athBio[id] = b; soft(); }, p.role === 'coach' ? { priv: true } : { quiet: true })] : []); });
      soft();
    };
    if (p.role === 'viewer') dataUnsubs.push(be.listenChat(ST.user.uid, (rs) => { (ST.chat = ST.chat || {})[ST.user.uid] = rs; soft(); }));
    if (p.role === 'viewer') dataUnsubs.push(be.listenAthletesScoped(p.coachId, p.access || {}, (rows) => { const seen = {}; onAth(rows.filter((r) => r.role === 'athlete' && !seen[r.id] && (seen[r.id] = 1))); }));
    else dataUnsubs.push(be.listenAthletes(ST.user.uid, onAth));
    if (p.role === 'coach') dataUnsubs.push(be.listenPending((rows) => { ST.pending = rows; soft(); }));
  }
}
function startSession(user) {
  stopAll();
  ST.user = user; ST.profile = null; ST.myCk = []; ST.myNotes = []; ST.athletes = []; ST.athCk = {}; ST.athNotes = {}; ST.athPlan = {}; ST.athHist = {}; ST.myPlan = null; ST.myHist = null; ST.myEvents = []; UI.pl = null; LV = lvLoad(); UI.liveOpen = !!(LV && LV.start); if (UI.liveOpen && LV.mode !== 'fin') { try { history.replaceState(null, '', '#planificar'); } catch (e) { /* sin historial */ } } ST.myBio = null; ST.athBio = {}; UI.planDraft = null; UI.planOpen = false; UI.histDraft = null; UI.histOpen = false; UI.asId = null; ST.pending = []; ST.fbk = []; UI.fbDraft = ''; UI.fbOk = false; ST.teamKm = {}; ST.teamMeta = {}; ST.chat = {}; UI.chatOpen = null; UI.chatDraft = {}; UI.justSaved = null; UI.flow = null; UI.feedback = null;
  if (!user) { ST.ready = true; soft(); return; }
  be.ensureProfile(user).catch((e) => say(friendly(e) + ' [' + ((e && e.step) || 'perfil') + ': ' + String((e && e.code) || '').replace('firestore/', '') + ' | ' + (user.email || 'sin correo') + ' | ' + String(user.uid).slice(0, 6) + ']'));
  ownUnsubs.push(be.listenProfile(user.uid, (p) => { ST.profile = p; ST.ready = true; setupData(); route(); }));
  ownUnsubs.push(be.listenCheckins(user.uid, (rows) => { ST.myCk = rows; if (UI.justSaved && rows.some((c) => c.date === UI.justSaved.date)) UI.justSaved = null; soft(); }, 120));
  ownUnsubs.push(be.listenNotes(user.uid, (rows) => { ST.myNotes = rows; soft(); }));
  ownUnsubs.push(be.listenPlan(user.uid, (pl) => { ST.myPlan = pl; soft(); }));
  ownUnsubs.push(be.listenHistory(user.uid, (h) => { ST.myHist = h; soft(); }));
  ownUnsubs.push(be.listenEvents(user.uid, (rows) => { ST.myEvents = rows; soft(); }));
  ownUnsubs.push(be.listenBio(user.uid, (b) => { ST.myBio = b; soft(); }, { priv: true, migrate: true }));
}

/* ---------- Acciones ---------- */
async function finishFlow(more) {
  const f = UI.flow, d = f.d, a = meA(), uid = ST.user.uid;
  const before = badges(a).filter((b) => b.earned).map((b) => b.id);
  const ex = on(a, off(0)) || {}, base = {}; CK_KEYS.forEach((k) => { if (ex[k] !== undefined) base[k] = ex[k]; });
  const dr = UI.draft, tx = (v) => String(v || '').trim().slice(0, 200);
  const pain = (d.painYes === 'si' && d.zones && d.zones.length) ? { zone: d.zones.join(', '), side: d.side || 'Ambos', level: d.level || 'Leve' } : null;
  const comment = (dr.comment || '').trim();
  let c;
  if (f.kind === 'diario') {
    c = Object.assign(base, { date: off(0), type: ex.activity ? 'actividad' : 'bienestar', mood: d.mood || 3, sleepH: d.sleepH != null ? d.sleepH : null, sleepQ: d.sleepQ || null, legs: d.legs != null ? d.legs : null, stress: d.stress != null ? d.stress : null, prev: d.prev || null, prevInfo: d.prev === 'si' ? { items: d.prevItems || [], text: (dr.prevText || '').trim() } : null, pain, comment, ts: Date.now() });
    if (ex.skip) c.skip = null;
  } else if (f.kind === 'post') {
    const fuel = { carbs: d.carbs != null ? d.carbs : null, pre: tx(dr.preText) || null, hydra: d.hydra != null ? d.hydra : null, gi: d.gi || null, energy: d.energy != null ? d.energy : null, post: tx(dr.postText) || null };
    const hasFuel = Object.keys(fuel).some((k) => fuel[k] != null);
    const p = planFor(off(0)), pk = planKind(p), tipo = d.tipo || 'otra', kind = tipo === 'bici' ? (d.bkind || lastBikeKind(a)) : tipo, bike = tipo === 'bici';
    const planOk = f.slot !== 2 && p && ((tipo === 'gym' && pk === 'gym') || (bike && pk && pk !== 'gym'));
    let name, min = null, km = 0, load = null, gym = null;
    if (bike) { if (planOk || (d.activity && d.activity.name && d.activity.kind === undefined && f.slot === 1 && ex.activity && kindOfAct(ex.activity, a) === kind)) { const A = d.activity || { name: p.name, min: p.min || null, km: p.km || 0, load: p.load == null ? null : p.load }; name = A.name; min = A.min || null; km = A.km || 0; load = A.load == null ? null : A.load; } else { name = 'Salida en ' + KIND_LABEL[kind]; } }
    else if (tipo === 'gym') { name = 'Gym' + (d.gfocus ? ' · ' + d.gfocus : ''); min = d.gdur != null ? DURMIN[d.gdur] : (planOk && p.min ? p.min : null); load = planOk && p.load != null ? p.load : null; gym = { focus: d.gfocus || null, dur: d.gdur != null ? d.gdur : null, feel: d.gfeel != null ? d.gfeel : null }; const zo = {}; Object.keys(d.gzones || {}).forEach((k) => { const v = d.gzones[k]; if (GZN[k] && v) { zo[k] = { i: v.i == null ? 1 : v.i, m: v.m ? 1 : 0 }; if (v.m && tx(v.t)) zo[k].t = tx(v.t).slice(0, 200); } }); if (Object.keys(zo).length) gym.zones = zo; }
    else { name = tx(dr.oname) || 'Otra actividad'; min = d.odur != null ? DURMIN[d.odur] : null; }
    const S = { kind, name, min, km, load, rpe: d.rpe || null, heat: bike && d.heat != null ? d.heat : null, hard: bike ? (d.hard || null) : null, hardInfo: bike && d.hard === 'si' ? { type: d.hardType || null, dur: d.hardDur || null, end: d.hardEnd || null, text: tx(dr.hardText) || null } : null };
    if (gym) S.gym = gym; if (tipo === 'otra') S.dur = d.odur != null ? d.odur : null;
    c = Object.assign(base, { date: off(0), type: 'actividad', mood: d.mood || ex.mood || null, skip: null, fuel: hasFuel ? fuel : (ex.fuel || null), pain: pain || ex.pain || null, comment: comment || ex.comment || '', ts: Date.now() });
    if (f.slot === 2) { c.act2 = S; if (!c.activity) c.activity = { name: S.name, min: S.min, km: S.km, load: S.load, kind: S.kind }; }
    else { const A = { name: S.name, min: S.min, km: S.km, load: S.load, kind: S.kind }; if (S.gym) A.gym = S.gym; if (S.dur != null) A.dur = S.dur; c.activity = A; c.rpe = S.rpe; c.heat = S.heat; c.hard = S.hard; c.hardInfo = S.hardInfo; }
  } else {
    c = Object.assign(base, { date: off(0), type: 'descanso', mood: d.mood || 3, skip: f.kind === 'skip' ? { items: d.skipItems || [], text: String(dr.skipText || '').trim().slice(0, 300) } : null, activity: null, rpe: null, heat: null, hard: null, hardInfo: null, fuel: null, pain, comment, ts: Date.now() });
  }
  if (c.comment == null) c.comment = '';
  const act = c.activity;
  UI.busy = true; render();
  try {
    await be.saveCheckin(uid, c);
  } catch (e) { UI.busy = false; say(friendly(e)); return; }
  UI.busy = false; UI.justSaved = c;
  const t = myTeam();
  if (t && sharesKm()) { be.saveKm(t, uid, { name: ST.profile.name || ST.user.name, month: monthKey(), km: myMonthKm(act && act.km ? act.km : 0), updatedAt: Date.now() }).catch(() => {}); }
  const projected = meA(), after = badges(projected).filter((b) => b.earned), fresh = after.filter((b) => before.indexOf(b.id) < 0);
  if (more) { UI.draft = { comment: '', prevText: '' }; ACT.kind('post', { dataset: { s: '2' } }); return; }
  UI.feedback = { checkin: c, newBadges: fresh }; UI.flow = null; UI.draft = { comment: '', prevText: '' };
  try { if (PREF.haptic !== false && navigator.vibrate) navigator.vibrate(30); } catch (e) {}
  render();
}
const ACT = {
  async shareKm() {
    if (!ST.user || !ST.profile || UI.busy) return; const uid = ST.user.uid, t = myTeam(), on = !sharesKm();
    ST.profile = Object.assign({}, ST.profile, { shareKm: on }); render();
    try {
      await be.saveProfile(uid, { shareKm: on });
      if (t) { if (on) await be.saveKm(t, uid, { name: ST.profile.name || ST.user.name, month: monthKey(), km: myMonthKm(0), updatedAt: Date.now() }); else await be.removeKm(t, uid); }
    } catch (e) { ST.profile = Object.assign({}, ST.profile, { shareKm: !on }); say(friendly(e)); }
  },
  pref(v) { PREF[v] = (v === 'haptic' || v === 'rotZoom') ? !(PREF[v] !== false) : !PREF[v]; savePref(); applyPrefs(); render(); },
  remToggle() {
    if (!ST.user) return; const on = !!(ST.profile && ST.profile.reminder);
    if (on) { PREF.lastRem = ST.profile.reminder; savePref(); }
    const v = on ? '' : (PREF.lastRem || '19:30'); ST.profile = Object.assign({}, ST.profile, { reminder: v }); render();
    be.saveProfile(ST.user.uid, { reminder: v }).catch(() => {});
  },
  remSet(v) { if (!ST.user) return; PREF.lastRem = v; savePref(); ST.profile = Object.assign({}, ST.profile, { reminder: v }); render(); be.saveProfile(ST.user.uid, { reminder: v }).catch(() => {}); },
  mode(v) {
    UI.mode = v === 'atleta' ? 'atleta' : 'coach'; try { localStorage.setItem('camino.mode', UI.mode); } catch (e) { /* sin almacenamiento */ }
    UI.asId = null; UI.story = null; const t = '#' + (UI.mode === 'coach' ? 'cabina' : 'hoy'); if (location.hash === t) render(); else location.hash = t;
  },
  nextReply() {
    const a = athleteObjs().filter((x) => needsReply(x))[0]; if (!a) return;
    UI.sel = a.id; UI.reply = { id: a.id, text: '' }; UI.planDraft = null; UI.histDraft = null; UI.histOpen = false; render();
    const el = document.getElementById('replyBox'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  },
  qrSend(v) {
    const a = athleteObjs().find((x) => x.id === UI.sel); if (!a || UI.busy || UI.undo) return;
    const text = cabinaPresets(statusOf(a), a)[Number(v)]; if (!text) return;
    const u = { id: a.id, text, start: Date.now() };
    u.timer = setTimeout(async () => {
      if (UI.undo !== u) return; UI.undo = null;
      try { await be.sendNote(a.id, { text: text.slice(0, 600), at: Date.now(), from: ST.user.uid }); say('Nota enviada a ' + a.first + '.', 'ok'); } catch (e) { say(friendly(e)); }
      render();
    }, 5000);
    UI.undo = u; render();
  },
  qrUndo() { if (UI.undo) { clearTimeout(UI.undo.timer); UI.undo = null; render(); } },
  fcProj() { UI.fp = !fcProjOn(); try { localStorage.setItem('camino.fproj', UI.fp ? '1' : '0'); } catch (e) { /* sin almacenamiento */ } render(); },
  fcRange(v) { UI.fr = +v; render(); },
  fcZoom() { fzOpen(false); },
  fcZoomClose() { fzClose(); },
  editCk() { UI.feedback = null; UI.confirmDel = false; ACT.start(); },
  async importTally(v) {
    if (UI.busy || !v) return;
    const p = (ST.athletes || []).find((x) => x.id === v) || (ST.user && ST.user.uid === v ? ST.profile : null); if (!p) return;
    UI.busy = true; render();
    try {
      const r = await fetch('./tally-import.json', { cache: 'no-store' }); if (!r.ok) throw new Error('Falta el archivo tally-import.json en el repositorio.');
      const data = await r.json(), em = String(p.email || '').toLowerCase(), fn = firstName(p.name || '').toLowerCase();
      const ds = (data.datasets || []).find((x) => x.email && x.email === em) || (data.datasets || []).find((x) => String(x.name || '').toLowerCase() === fn);
      if (!ds) { say('No encuentro historial de Tally para ' + (p.name || 'este atleta') + '.'); UI.busy = false; render(); return; }
      let ok = 0, skip = 0, bad = 0;
      for (const c of ds.checkins) {
        try { await be.importCheckin(v, c); ok++; } catch (e) { if (e && /permission|denied|exists/i.test(String(e.code || e.message))) skip++; else bad++; }
      }
      say(ok + ' días importados' + (skip ? ', ' + skip + ' ya existían y se dejaron igual' : '') + (bad ? ', ' + bad + ' con error' : '') + '.', bad ? 'err' : 'ok');
    } catch (e) { say(e && e.message ? e.message : friendly(e)); }
    UI.busy = false; render();
  },
  delAsk() { UI.confirmDel = true; render(); },
  delNo() { UI.confirmDel = false; render(); },
  async delCk() {
    const uid = ST.user.uid; UI.busy = true; render();
    try { await be.deleteCheckin(uid, off(0)); } catch (e) { UI.busy = false; UI.confirmDel = false; say(friendly(e)); return; }
    UI.busy = false; UI.confirmDel = false; UI.feedback = null; UI.justSaved = null;
    ST.myCk = ST.myCk.filter((c) => c.date !== off(0));
    const t = myTeam();
    if (t && sharesKm()) { be.saveKm(t, uid, { name: ST.profile.name || ST.user.name, month: monthKey(), km: myMonthKm(0), updatedAt: Date.now() }).catch(() => {}); }
    say('Check-in borrado. Puedes hacer uno nuevo cuando quieras.', 'ok');
  },
  guiaGo: (v) => { const tr = document.getElementById('gtrack'); if (tr && tr.children[1]) { const step = tr.children[1].offsetLeft - tr.children[0].offsetLeft; tr.scrollTo({ left: (+v) * step, behavior: 'smooth' }); } },
  async login(v) { UI.busy = true; UI.msg = ''; render(); try { await be.signIn(v); } catch (e) { say(friendly(e)); } UI.busy = false; render(); },
  async logout() { await be.signOut(); },
  start() { UI.flow = { kind: null, step: 'tipo', i: 0, d: {} }; UI.draft = { comment: '', prevText: '' }; render(); },
  close() { UI.flow = null; UI.draft = { comment: '', prevText: '' }; render(); },
  kind(v, t) {
    const a = meA(), c = on(a, off(0)) || null, p = planFor(off(0)), d = {}, slot = v === 'post' ? (Number(t && t.dataset && t.dataset.s) === 2 ? 2 : 1) : 1;
    if (c) {
      if (c.mood != null) d.mood = c.mood;
      d.sleepH = c.sleepH == null ? undefined : c.sleepH; d.sleepQ = c.sleepQ || undefined; d.legs = c.legs == null ? undefined : c.legs; d.stress = c.stress == null ? undefined : c.stress;
      d.prev = c.prev || undefined;
      if (c.prevInfo) d.prevItems = (c.prevInfo.items || []).slice();
      if (c.fuel) { d.carbs = c.fuel.carbs == null ? undefined : c.fuel.carbs; d.hydra = c.fuel.hydra == null ? undefined : c.fuel.hydra; d.gi = c.fuel.gi || undefined; d.energy = c.fuel.energy == null ? undefined : c.fuel.energy; }
      if (c.skip) d.skipItems = (c.skip.items || []).slice();
      if (c.pain) { d.painYes = 'si'; d.zones = String(c.pain.zone || '').split(', ').filter(Boolean); d.side = c.pain.side; d.level = c.pain.level; } else if (c.mood != null || c.activity) d.painYes = 'no';
    }
    let oname = '';
    if (v === 'post') {
      const S = sessOf(c, slot), k = kindOfAct(S, a), pk = planKind(p);
      if (S) {
        d.rpe = S.rpe || undefined; d.heat = S.heat == null ? undefined : S.heat; d.hard = S.hard || undefined;
        if (S.hardInfo) { d.hardType = S.hardInfo.type || undefined; d.hardDur = S.hardInfo.dur || undefined; d.hardEnd = S.hardInfo.end || undefined; }
        d.activity = { name: S.name, min: S.min || null, km: S.km || 0, load: S.load == null ? null : S.load };
        if (k === 'gym') { d.tipo = 'gym'; const g = S.gym || {}; d.gfocus = g.focus || undefined; d.gdur = g.dur == null ? undefined : g.dur; { const fv = g.feel != null ? g.feel : g.legs; d.gfeel = fv == null ? undefined : fv; } if (g.zones) { d.gzones = {}; Object.keys(g.zones).forEach((k) => { if (GZN[k]) d.gzones[k] = { i: g.zones[k].i == null ? 1 : g.zones[k].i, m: g.zones[k].m ? 1 : 0, t: g.zones[k].t || '' }; }); } }
        else if (BKINDS[k]) { d.tipo = 'bici'; d.bkind = k; }
        else { d.tipo = 'otra'; oname = S.name || ''; d.odur = S.dur == null ? undefined : S.dur; }
      } else if (slot === 1 && pk) {
        if (pk === 'gym') d.tipo = 'gym'; else { d.tipo = 'bici'; d.bkind = BKINDS[pk] ? pk : lastBikeKind(a); }
        d.activity = { name: p.name, min: p.min || null, km: p.km || 0, load: p.load == null ? null : p.load };
      }
    }
    UI.flow = { from: (UI.flow && UI.flow.step === 'alt') ? 'alt' : 'tipo', kind: v, step: 'run', i: 0, d, slot, needMood: v === 'post' && slot === 1 && !(c && c.mood != null) };
    UI.fuelMore = false; UI.gact = null; UI.glist = false; UI.gundo = null; UI.gview = 'front';
    UI.draft = { comment: (c && c.comment) || '', prevText: (c && c.prevInfo && c.prevInfo.text) || '', preText: (c && c.fuel && c.fuel.pre) || '', postText: (c && c.fuel && c.fuel.post) || '', hardText: '', skipText: (c && c.skip && c.skip.text) || '', oname };
    if (v === 'post') { const S2 = sessOf(c, slot); UI.draft.hardText = (S2 && S2.hardInfo && S2.hardInfo.text) || ''; }
    UI.feedback = null; render();
  },
  pick(v, t) { UI.flow.d[t.dataset.g] = v; if (t.dataset.g === 'tipo' && v === 'bici' && !UI.flow.d.bkind) UI.flow.d.bkind = undefined; render(); },
  rpe(v) { UI.flow.d.rpe = Number(v); render(); },
  fuelMore() { UI.fuelMore = true; render(); },
  gview(v) { UI.gview = v === 'back' ? 'back' : 'front'; render(); },
  gfig(v) { const d = UI.flow.d; if (!GZN[v]) return; d.gzones = d.gzones || {}; UI.gundo = null; if (!d.gzones[v]) { d.gzones[v] = { i: 1, m: 0, t: '' }; UI.gact = v; } else if (UI.gact === v) ACT.gzone(v); else UI.gact = v; render(); },
  gzone(v) { const d = UI.flow.d; if (!GZN[v]) return; d.gzones = d.gzones || {}; if (d.gzones[v]) { const x = d.gzones[v]; UI.gundo = (x.m || x.i !== 1) ? { id: v, val: x } : null; delete d.gzones[v]; if (UI.gact === v) UI.gact = Object.keys(d.gzones)[0] || null; } else { UI.gundo = null; d.gzones[v] = { i: 1, m: 0, t: '' }; UI.gact = v; } render(); },
  gundo() { const u = UI.gundo, d = UI.flow.d; if (u && GZN[u.id]) { d.gzones = d.gzones || {}; d.gzones[u.id] = u.val; UI.gact = u.id; } UI.gundo = null; render(); },
  gact(v) { if (UI.flow.d.gzones && UI.flow.d.gzones[v]) { UI.gact = v; render(); } },
  glist() { UI.glist = !UI.glist; render(); },
  gset(v) { const d = UI.flow.d; d.gzones = d.gzones || {}; UI.gundo = null; if (v === 'none') { d.gzones = {}; UI.gact = null; } else { GZ.forEach((z) => { if ((v === 'all' || z[2] === v) && !d.gzones[z[0]]) d.gzones[z[0]] = { i: 1, m: 0, t: '' }; }); if (!UI.gact || !d.gzones[UI.gact]) UI.gact = Object.keys(d.gzones)[0] || null; } render(); },
  gint(v, t) { const z = UI.flow.d.gzones && UI.flow.d.gzones[t.dataset.z]; if (z) { z.i = Number(v); render(); } },
  gmol(v) { const z = UI.flow.d.gzones && UI.flow.d.gzones[v]; if (z) { z.m = z.m ? 0 : 1; if (!z.m) z.t = ''; render(); } },
  alt() { UI.flow = { kind: null, step: 'alt', i: 0, d: {} }; UI.draft = { comment: '', prevText: '' }; render(); },
  sendMore() { if (!UI.busy) finishFlow(true); },
  mood(v) { UI.flow.d.mood = Number(v); UI.flow.i++; render(); },
  set(v, t) { const g = t.dataset.g, val = NUMERIC[g] ? Number(v) : v; UI.flow.d[g] = (UI.flow.d[g] === val) ? undefined : val; render(); },
  multi(v, t) { const g = t.dataset.g, z = UI.flow.d[g] || [], i = z.indexOf(v); if (i >= 0) z.splice(i, 1); else z.push(v); UI.flow.d[g] = z; render(); },
  zone(v) { const z = UI.flow.d.zones || [], i = z.indexOf(v); if (i >= 0) z.splice(i, 1); else if (z.length < 3) z.push(v); UI.flow.d.zones = z; render(); },
  next() { UI.flow.i++; render(); },
  back() { const f = UI.flow; if (f.step === 'run' && f.i > 0) f.i--; else { f.step = f.from || 'tipo'; f.i = 0; } render(); },
  send() { if (!UI.busy) finishFlow(); },
  feedback() { UI.feedback = { checkin: on(meA(), off(0)), newBadges: [] }; render(); },
  profOpen(v) {
    const sec = PSEC.find((s) => s.id === v); if (!sec) return;
    if (sec.id === 's2' && ST.myBio && ST.myBio.privReady === false) { say('Estamos cargando tus datos privados. Intenta de nuevo en un momento.'); return; }
    UI.prof = { sec: v, d: profDraft(sec), open: null }; render();
    const ov = document.getElementById('overlay'); if (ov) ov.scrollTop = 0;
  },
  profClose() { UI.prof = null; render(); const ov = document.getElementById('overlay'); if (ov) ov.scrollTop = 0; },
  pfSet(v, t) {
    if (!UI.prof) return; const g = t.dataset.g, d = UI.prof.d; d[g] = d[g] === v ? '' : v;
    if (g === '_cq') { if (d._cq === 'no') d['health.conditions'] = 'Ninguna'; else if (d['health.conditions'] === 'Ninguna') d['health.conditions'] = ''; }
    render();
  },
  pfMul(v, t) { if (!UI.prof) return; const a = UI.prof.d[t.dataset.g], i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); render(); },
  pfSw() { if (!UI.prof) return; UI.prof.d.showWeight = !UI.prof.d.showWeight; render(); },
  pfOpen(v) { if (!UI.prof) return; UI.prof.open = UI.prof.open === v ? null : v; render(); },
  pfPre() { UI.pfPre = !UI.pfPre; render(); },
  async pfPreOk(v) {
    const x = pfSuggest().find((s) => s.id === v); if (!x || !ST.user) return; const old = bioMain() || {};
    try { await be.saveMainPart(ST.user.uid, Object.assign({}, x.patch, { pre: Object.assign({}, old.pre || {}, { [v]: true }), consentTs: old.consentTs || Date.now(), updatedAt: Date.now() })); say('Dato confirmado', 'ok'); } catch (e) { say(friendly(e)); }
  },
  async pfPreNo(v) {
    if (!ST.user) return; const old = bioMain() || {};
    try { await be.saveMainPart(ST.user.uid, { pre: Object.assign({}, old.pre || {}, { [v]: false }), consentTs: old.consentTs || Date.now(), updatedAt: Date.now() }); } catch (e) { say(friendly(e)); }
  },
  pfDelAsk() { UI.pfDel = true; render(); },
  pfDelNo() { UI.pfDel = false; render(); },
  async profSave() {
    const P = UI.prof; if (!P || !ST.user || UI.busy) return; const sec = PSEC.find((s) => s.id === P.sec), d = P.d, t = (x, n) => String(x || '').trim().slice(0, n || 200);
    const val = (f) => { const v = d[f.p]; if (f.y === 'multi') return (v || []).slice(0, 12).map((x) => String(x).slice(0, 40)); return t(v, f.y === 'area' ? 300 : (f.max || 80)); };
    const old = bioMain() || {};
    let main = { consentTs: old.consentTs || Date.now(), updatedAt: Date.now() }, priv = null;
    if (sec.id === 's1') {
      const h = d.heightCm === '' ? null : Number(d.heightCm); if (h != null && !(h >= 100 && h <= 230)) { say('La estatura debe estar entre 100 y 230 cm.'); return; }
      if (d.birthDate && ageOf(d.birthDate) == null) { say('Revisa la fecha de nacimiento.'); return; }
      main = Object.assign(main, { birthDate: d.birthDate || null, heightCm: h, sex: d.sex || null, sport: d.sport || null, city: t(d.city, 60), showWeight: !!d.showWeight });
    } else if (sec.id === 's2') {
      priv = { health: { conditions: t(d['health.conditions'], 300), meds: t(d['health.meds'], 300), injuries: t(d['health.injuries'], 300), allergies: t(d['health.allergies'], 300) }, emergency: { name: t(d['emergency.name'], 80), phone: t(d['emergency.phone'], 30) } };
    } else {
      const o = {}; sec.f.forEach((f) => { o[f.p.split('.')[1]] = val(f); }); main[sec.g] = o;
    }
    UI.busy = true; render();
    try { if (priv) await be.savePriv(ST.user.uid, priv); else await be.saveMainPart(ST.user.uid, main); UI.prof = null; say('Sección guardada', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  async pfProp(v) {
    const P = UI.prof, m = PF_MEAS.find((x) => x[0] === v), el = document.getElementById('pp-' + v), nt = document.getElementById('pp-note'); if (!P || !m || !el || !ST.user) return;
    const n = Number(String(el.value).replace(',', '.')); if (!(n >= m[3] && n <= m[4])) { say('Ingresa un valor entre ' + m[3] + ' y ' + m[4] + ' ' + m[2] + '.'); return; }
    const prop = Object.assign({}, bioMeas().prop || {}); prop[v] = { v: Math.round(n * 10) / 10, note: nt ? String(nt.value || '').trim().slice(0, 120) : '', ts: Date.now() };
    try { await be.propose(ST.user.uid, prop); P.open = null; say('Enviado a tu coach', 'ok'); } catch (e) { say(friendly(e)); }
    render();
  },
  async pfWithdraw(v) { if (!ST.user) return; const prop = Object.assign({}, bioMeas().prop || {}); delete prop[v]; try { await be.propose(ST.user.uid, prop); } catch (e) { say(friendly(e)); } },
  pfExport() {
    const data = { exportado: new Date().toISOString(), cuenta: ST.profile ? { nombre: ST.profile.name, correo: ST.profile.email || null, equipo: ST.profile.team || null } : null, perfil: ST.myBio || null, checkins: ST.myCk || [], notasDelCoach: ST.myNotes || [] };
    try { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = 'camino-mis-datos.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); say('Descarga lista', 'ok'); } catch (e) { say('No se pudo descargar. Intenta de nuevo.'); }
  },
  async pfDelReq() {
    if (!ST.user || UI.busy) return; UI.busy = true; render();
    try { await be.sendFeedback({ uid: ST.user.uid, name: String((ST.profile && ST.profile.name) || 'Atleta').slice(0, 80), team: String((ST.profile && ST.profile.team) || ''), kind: 'consulta', text: 'Solicito eliminar mi cuenta y todos mis datos de Camino.', ts: Date.now(), read: false }); UI.pfDel = false; say('Solicitud enviada a tu coach', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  bioTgl(v) { UI.bioOpen = UI.bioOpen === v ? null : v; render(); },
  async bioOk(v) { const [id, k] = String(v).split('|'), b = ST.athBio[id] || {}, ms = Object.assign({}, b.meas || {}), pr = Object.assign({}, ms.prop || {}); if (!pr[k] || !ST.user) return; ms[k] = pr[k].v; delete pr[k]; ms.prop = pr; ms.updatedAt = Date.now(); ms.by = ST.user.uid; try { await be.saveMeas(id, ms); say('Medida aprobada', 'ok'); } catch (e) { say(friendly(e)); } },
  async bioNo(v) { const [id, k] = String(v).split('|'), b = ST.athBio[id] || {}, ms = Object.assign({}, b.meas || {}), pr = Object.assign({}, ms.prop || {}); if (!pr[k] || !ST.user) return; delete pr[k]; ms.prop = pr; ms.by = ST.user.uid; try { await be.saveMeas(id, ms); say('Propuesta rechazada', 'ok'); } catch (e) { say(friendly(e)); } },
  async bioSet(v) {
    const [id, k] = String(v).split('|'), m = PF_MEAS.find((x) => x[0] === k), el = document.getElementById('bm-' + k); if (!m || !el || !ST.user) return;
    const n = Number(String(el.value).replace(',', '.')); if (!(n >= m[3] && n <= m[4])) { say('Ingresa un valor entre ' + m[3] + ' y ' + m[4] + ' ' + m[2] + '.'); return; }
    const ms = Object.assign({}, (ST.athBio[id] || {}).meas || {}); ms[k] = Math.round(n * 10) / 10; ms.updatedAt = Date.now(); ms.by = ST.user.uid;
    try { await be.saveMeas(id, ms); say('Medida guardada', 'ok'); } catch (e) { say(friendly(e)); }
  },
  async restOk(v) {
    const c = ST.user ? on(meA(), v) : null; if (!c || c.type !== 'descanso' || v !== off(0) || UI.busy) return;
    const out = {}; CK_KEYS.forEach((k) => { if (c[k] !== undefined) out[k] = c[k]; }); out.restOk = true; // ts no cambia: no reabre la cola de respuestas del coach
    UI.busy = true; render();
    try { await be.saveCheckin(ST.user.uid, out); say('Listo, tu coach verá que descansaste', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  closeFb() { UI.feedback = null; render(); },
  wkOpen(v) { const t0 = parse(off(0)); t0.setDate(t0.getDate() - ((t0.getDay() + 6) % 7)); const sh = v ? Math.floor(diffDays(ymd(t0), v) / 7) : 0; UI.wk = { shift: sh, focus: v || null }; render(); if (v) { const el = document.getElementById('wkd-' + v); if (el) el.scrollIntoView({ block: 'center' }); } },
  wkClose() { UI.wk = null; render(); },
  actOpen(v) {
    const coachView = !!(UI.asId && isCoach()), h = coachView ? ST.athHist[UI.asId] : ST.myHist, x = recentActs(h)[Number(v)]; if (!x) return;
    const uid = coachView ? UI.asId : (ST.user && ST.user.uid), cur = UI.act = { x: x, uid: uid, route: (x.r && x.id) ? undefined : null };
    render(); if (cur.route !== undefined || !uid) return;
    be.getRoute(uid, x.id).then((r) => { if (UI.act === cur) { cur.route = r || null; render(); } }).catch(() => { if (UI.act === cur) { cur.route = null; cur.err = true; render(); } });
  },
  actClose() { UI.act = null; render(); },
  wkShift(v) { UI.wk = { shift: Math.max(-8, Math.min(12, Number(v) || 0)), focus: null }; render(); const ov = document.getElementById('overlay'); if (ov) ov.scrollTop = 0; },
  async copyDemo(v) {
    const dl = demoLink(v); let ok = false;
    try { await navigator.clipboard.writeText(dl); ok = true; } catch (e) { try { const el = document.getElementById('demolink-' + v), r = document.createRange(); r.selectNodeContents(el); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); ok = document.execCommand('copy'); } catch (e2) { ok = false; } }
    say(ok ? (v === 'real' ? 'Enlace de la app copiado.' : 'Enlace de la demo de ' + (v === 'coach' ? 'coach' : 'atleta') + ' copiado.') + ' Pégalo donde quieras compartirlo.' : 'No pude copiarlo solo: mantén presionado el enlace y cópialo.', ok ? 'ok' : 'err');
  },
  inbox() { UI.inboxSeen = (!isCoach() || isViewer()) ? seenAt() : 0; UI.inbox = true; if (!isCoach() || isViewer()) { const mx = Math.max(Date.now(), ...(ST.myNotes || []).map((n) => Number(n.at) || 0), ...(ST.props || []).map((x) => Number(x.decidedAt) || 0)); try { localStorage.setItem(seenKey(), String(mx)); } catch (e) { /* sin almacenamiento */ } } render(); },
  inboxClose() { UI.inbox = false; render(); },
  inboxGo(v) { UI.inbox = false; UI.mode = 'coach'; try { localStorage.setItem('camino.mode', 'coach'); } catch (e) { /* sin almacenamiento */ } UI.asId = null; UI.sel = v; UI.reply = { id: v, text: '' }; location.hash = '#cabina'; UI.view = 'cabina'; render(); const el = document.getElementById('replyBox'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
  inboxChat(v) { UI.inbox = false; UI.mode = 'coach'; try { localStorage.setItem('camino.mode', 'coach'); } catch (e) { /* sin almacenamiento */ } UI.asId = null; UI.chatOpen = v; location.hash = '#ajustes'; UI.view = 'ajustes'; render(); const el = document.getElementById(isOwner() ? 'chat-card-' + v : 'chatCard'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
  chatTgl(v) { UI.chatOpen = UI.chatOpen === v ? null : v; if (UI.chatOpen) chatMark(v); render(); },
  async chatSend(v) {
    if (!ST.user || UI.busy) return; const text = String(((UI.chatDraft || {})[v]) || '').trim().slice(0, 600); if (!text) { say('Escribe un mensaje antes de enviar.'); return; }
    UI.busy = true; render();
    try { await be.sendChat(v, { by: ST.user.uid, byName: String((ST.profile && ST.profile.name) || 'Coach').slice(0, 80), text, ts: Date.now() }); UI.chatDraft = Object.assign({}, UI.chatDraft || {}, { [v]: '' }); chatMark(v); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  inboxProp() { UI.inbox = false; UI.mode = 'coach'; try { localStorage.setItem('camino.mode', 'coach'); } catch (e) { /* sin almacenamiento */ } UI.asId = null; location.hash = '#ajustes'; UI.view = 'ajustes'; render(); const el = document.getElementById('propsCard'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
  inboxFb() { UI.inbox = false; UI.mode = 'coach'; try { localStorage.setItem('camino.mode', 'coach'); } catch (e) { /* sin almacenamiento */ } UI.asId = null; location.hash = '#cabina'; UI.view = 'cabina'; render(); const el = document.getElementById('fbinbox'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
  story(v) { UI.story = Number(v) || 0; render(); },
  storyNext() { UI.story = UI.story >= 2 ? null : UI.story + 1; render(); },
  storyClose() { UI.story = null; render(); },
  tour() { UI.tour = 0; UI.tourNews = true; render(); },
  tourNext() { if (UI.tour >= tourSlides().length - 1) tourDone(); else { UI.tour += 1; render(); } },
  tourBack() { if (UI.tour > 0) { UI.tour -= 1; render(); } },
  tourClose() { tourDone(); },
  tutOpen(v) { tutOpen(v); },
  tutClose() { tutClose(); },
  tutNext() { if (TS) { TS.play = false; tutGo(TS.i + 1); } },
  tutPrev() { if (TS) { TS.play = false; tutGo(TS.i - 1); } },
  tutGo(v) { if (TS) { TS.play = false; tutGo(Number(v) || 0); } },
  tutPlay() { if (TS) { TS.play = !TS.play; tutGo(TS.i); } },
  fbKind(v) { UI.fbKind = v; UI.fbOk = false; render(); },
  async fbSend() {
    const text = (UI.fbDraft || '').trim(); if (!text || UI.busy || !ST.user) return;
    UI.busy = true; render();
    try { await be.sendFeedback({ uid: ST.user.uid, name: String((ST.profile && ST.profile.name) || 'Atleta').slice(0, 80), team: String((ST.profile && ST.profile.team) || ''), kind: UI.fbKind || 'comentario', text: text.slice(0, 1000), ts: Date.now(), read: false }); UI.fbDraft = ''; UI.fbOk = true; } catch (e) { UI.busy = false; say(friendly(e)); return; }
    UI.busy = false; render();
  },
  async fbMark(v) { const x = (ST.fbk || []).find((f) => f.id === v); try { await be.markFeedback(v, !(x && x.read)); } catch (e) { say(friendly(e)); } },
  async fbDel(v) { try { await be.removeFeedback(v); } catch (e) { say(friendly(e)); } },
  sel(v) { UI.sel = v; UI.reply = { id: v, text: '' }; UI.planDraft = null; UI.histDraft = null; UI.histOpen = false; render(); },
  preset(v) { const a = athleteObjs().find((x) => x.id === UI.sel); if (!a) return; UI.reply = { id: a.id, text: cabinaPresets(statusOf(a), a)[Number(v)] }; render(); const t = document.getElementById('replyText'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } },
  async sendReply() {
    const a = athleteObjs().find((x) => x.id === UI.sel), txt = (UI.reply.text || '').trim(); if (!a || !txt || UI.busy) return;
    UI.busy = true; render();
    try { await be.sendNote(a.id, { text: txt.slice(0, 600), at: Date.now(), from: ST.user.uid }); UI.reply = { id: a.id, text: '' }; } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  planToggle() { UI.planOpen = !UI.planOpen; UI.planDraft = null; render(); },
  histToggle() { UI.histOpen = !UI.histOpen; UI.histDraft = null; render(); },
  async saveHist() {
    const a = athleteObjs().find((x) => x.id === UI.sel); if (!a || UI.busy) return;
    const r = parseHist(UI.histDraft ? UI.histDraft.text : ''); if (r.err) { say(r.err); return; }
    UI.busy = true; render();
    try { await be.saveHistory(a.id, Object.assign(r.hist, { updatedAt: Date.now() })); UI.histDraft = null; UI.histOpen = false; say('Historial guardado para ' + a.first + '.', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  verComo(v) { UI.asId = v; if (location.hash === '#hoy') render(); else location.hash = '#hoy'; },
  verComoSalir() { UI.asId = null; if (location.hash === '#cabina') render(); else location.hash = '#cabina'; },
  async savePlan() {
    const a = athleteObjs().find((x) => x.id === UI.sel); if (!a || UI.busy) return;
    const r = parsePlan(UI.planDraft ? UI.planDraft.text : ''); if (r.err) { say(r.err); return; }
    UI.busy = true; render();
    try { await be.savePlan(a.id, Object.assign(r.plan, { updatedAt: Date.now() })); UI.planDraft = null; UI.planOpen = false; say('Plan guardado para ' + a.first + '.', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  async accSave(vid, fn) { const v = ST.athletes.filter((r) => r.id === vid)[0]; if (!v) return; const a = accOf(v); fn(a); try { await be.setAccess(vid, a); } catch (e) { say(friendly(e)); } },
  accTeam(v) { const [vid, t] = String(v).split('|'); ACT.accSave(vid, (a) => { const i = a.teams.indexOf(t); if (i >= 0) a.teams.splice(i, 1); else a.teams.push(t); }); },
  accAth(v) { const [vid, id] = String(v).split('|'); ACT.accSave(vid, (a) => { const i = a.athletes.indexOf(id); if (i >= 0) a.athletes.splice(i, 1); else a.athletes.push(id); }); },
  accEdit(v) { ACT.accSave(v, (a) => { a.edit = !a.edit; }); },
  accProf(v) { ACT.accSave(v, (a) => { a.profile = !a.profile; }); },
  async propOk(id) { try { await be.resolveProposal(id, 'ok'); say('Propuesta autorizada', 'ok'); } catch (e) { say(friendly(e)); } },
  async propNo(id) { try { await be.resolveProposal(id, 'no'); say('Propuesta rechazada', 'ok'); } catch (e) { say(friendly(e)); } },
  propKind(v) { UI.prop = Object.assign(UI.prop || {}, { kind: v === 'group' ? 'group' : 'athlete' }); render(); },
  propTeam(v) { UI.prop = Object.assign(UI.prop || {}, { team: v }); render(); },
  async propSend() {
    const pr = UI.prop || {}, name = String(pr.name || '').trim().slice(0, 80), email = String(pr.email || '').trim().toLowerCase().slice(0, 120), a = vAcc(), team = pr.team || ((a.teams || [])[0] || '');
    if (!name) { say('Escribe un nombre.'); return; }
    if (pr.kind !== 'group' && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !team)) { say(!team ? 'Aún no tienes un equipo asignado para proponer atletas.' : 'Escribe un correo válido.'); return; }
    const o = { by: ST.user.uid, byName: ST.user.name || 'Coach', kind: pr.kind === 'group' ? 'group' : 'athlete', name, ts: Date.now(), status: 'open' };
    if (o.kind === 'athlete') { o.email = email; o.team = team; } if (pr.note && pr.note.trim()) o.note = pr.note.trim().slice(0, 300);
    UI.busy = true; render(); try { await be.sendProposal(o); UI.prop = null; say('Propuesta enviada. Tu coach la revisará.', 'ok'); } catch (e) { say(friendly(e)); } UI.busy = false; render();
  },
  async accept(v, t) { try { await be.acceptAthlete(v, ST.user.uid, t.dataset.t); } catch (e) { say(friendly(e)); } },
  tone(v) { PREF.tone = v; savePref(); applyTone(); render(); },
  metaTeam(v) { UI.metaTeam = v; UI.metaDraft = null; render(); },
  async saveMeta() {
    const team = UI.metaTeam, goal = Number((UI.metaDraft && UI.metaDraft.goal) != null ? UI.metaDraft.goal : (ST.teamMeta[team] || {}).goal || KM_GOAL_DEFAULT), hito = UI.metaDraft ? UI.metaDraft.hito : ((ST.teamMeta[team] || {}).hito || '');
    UI.busy = true; render();
    try { await be.saveTeamMeta(team, { goal: goal > 0 ? goal : KM_GOAL_DEFAULT, hito: String(hito || '').slice(0, 200) }); UI.metaDraft = null; say('Guardado para ' + TEAMS[team] + '.', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  },
  resetDemo() { try { localStorage.removeItem('camino-demo-v4'); sessionStorage.removeItem('camino-demo-user'); } catch (e) {} location.reload(); }
};
function guiaSync() {
  const tr = document.getElementById('gtrack'); if (!tr) return;
  const step = tr.children[1] ? tr.children[1].offsetLeft - tr.children[0].offsetLeft : tr.clientWidth, i = Math.round(tr.scrollLeft / Math.max(step, 1));
  document.querySelectorAll('#gdots .gdot').forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
}
let tourX = null;
document.addEventListener('touchstart', (e) => { tourX = (UI.tour != null && e.target.closest && e.target.closest('#tourbox') && e.touches[0]) ? e.touches[0].clientX : null; }, { passive: true });
document.addEventListener('touchend', (e) => { if (tourX == null || UI.tour == null) return; const dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : tourX) - tourX; tourX = null; if (dx < -50) ACT.tourNext(); else if (dx > 50) ACT.tourBack(); }, { passive: true });
document.addEventListener('pointermove', fcMove);
document.addEventListener('pointermove', wbMove);
document.addEventListener('pointerdown', wbMove);
document.addEventListener('pointerdown', fcMove);
document.addEventListener('scroll', (e) => { if (e.target && e.target.id === 'gtrack') guiaSync(); }, true);

['accept','saveMeta','importTally','fbMark','fbDel','preset','copyDemo','accTeam','accAth','accEdit','accProf','propOk','propNo'].forEach((k) => { const f = ACT[k]; if (typeof f === 'function') ACT[k] = function () { if (!isOwner()) { say('Solo el coach principal puede hacer esto.'); return; } return f.apply(this, arguments); }; });
['sendReply','nextReply','saveHist','savePlan'].forEach((k) => { const f = ACT[k]; if (typeof f === 'function') ACT[k] = function () { if (!canEdit()) { say('Tu cuenta está en solo lectura: pídele al coach principal el permiso para editar.'); return; } return f.apply(this, arguments); }; });
['bioOk','bioNo','bioSet'].forEach((k) => { const f = ACT[k]; if (typeof f === 'function') ACT[k] = function () { if (!(canEdit() && canProfile())) { say('Necesitas permiso de edición y de perfil para cambiar medidas.'); return; } return f.apply(this, arguments); }; });
/* ---------- Planificar: eventos, track GPX y controles (v55) ---------- */
const PL_BRV = [200, 300, 400, 600, 1000];
const PL_BANDS = [[0, 200, 34, 15], [200, 400, 32, 15], [400, 600, 30, 15], [600, 1000, 28, 11.428], [1000, 1300, 26, 13.333]];
const PL_FIN = { 200: 13.5, 300: 20, 400: 27, 600: 40, 1000: 75 };
const plHav = (a, b) => { const r = Math.PI / 180, dl = (b[0] - a[0]) * r, dn = (b[1] - a[1]) * r, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dn / 2) * Math.sin(dn / 2); return 12742.0176 * Math.asin(Math.sqrt(x)); };
function plEncPoly(P) { let o = '', pa = 0, po = 0; const e = (v) => { v = v < 0 ? ~(v << 1) : v << 1; let s = ''; while (v >= 32) { s += String.fromCharCode((32 | (v & 31)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); }; P.forEach((q) => { const la = Math.round(q[0] * 1e5), lo = Math.round(q[1] * 1e5); o += e(la - pa) + e(lo - po); pa = la; po = lo; }); return o; }
/* Simplifica con Ramer-Douglas-Peucker (iterativo) sobre metros planos. */
function plRdp(X, Y, eps) {
  const n = X.length, keep = new Uint8Array(n); keep[0] = 1; keep[n - 1] = 1; const st = [[0, n - 1]];
  while (st.length) {
    const s = st.pop(), a = s[0], b = s[1]; if (b <= a + 1) continue;
    const dx = X[b] - X[a], dy = Y[b] - Y[a], L = Math.hypot(dx, dy); let mx = -1, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = L < 1e-9 ? Math.hypot(X[i] - X[a], Y[i] - Y[a]) : Math.abs(dy * (X[i] - X[a]) - dx * (Y[i] - Y[a])) / L; if (d > mx) { mx = d; mi = i; } }
    if (mx > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  const out = []; for (let i = 0; i < n; i++) if (keep[i]) out.push(i); return out;
}
/* Lee un GPX (track o ruta) y devuelve el trazo simplificado con la forma de los recorridos de Camino. */
function plParseGpx(text) {
  let doc; try { doc = new DOMParser().parseFromString(text, 'application/xml'); } catch (e) { return { err: 'No pude leer el archivo.' }; }
  if (!doc || doc.getElementsByTagName('parsererror').length) return { err: 'El archivo no es un GPX válido.' };
  let nodes = doc.getElementsByTagName('trkpt'); if (!nodes.length) nodes = doc.getElementsByTagName('rtept');
  if (nodes.length < 10) return { err: 'El GPX no trae un recorrido con puntos suficientes.' };
  if (nodes.length > 250000) return { err: 'El GPX es demasiado grande. Prueba con uno más corto.' };
  const P = []; for (let i = 0; i < nodes.length; i++) { const la = parseFloat(nodes[i].getAttribute('lat')), lo = parseFloat(nodes[i].getAttribute('lon')); if (!isFinite(la) || !isFinite(lo)) continue; const el = nodes[i].getElementsByTagName('ele')[0], ev = el ? parseFloat(el.textContent) : NaN; P.push([la, lo, isFinite(ev) ? ev : null]); }
  if (P.length < 10) return { err: 'El GPX no trae un recorrido con puntos suficientes.' };
  const nm = doc.getElementsByTagName('name')[0];
  const T = [P[0]], cum = [0]; let tot = 0, last = P[0];
  for (let i = 1; i < P.length; i++) { const d = plHav(last, P[i]); if (d >= 0.003 || i === P.length - 1) { tot += d; T.push(P[i]); cum.push(tot); last = P[i]; } }
  const allEle = T.every((q) => q[2] != null);
  let gain = 0, ref = allEle ? T[0][2] : 0; if (allEle) T.forEach((q) => { const v = q[2]; if (v - ref >= 3) { gain += v - ref; ref = v; } else if (ref - v >= 3) ref = v; });
  const la0 = T[0][0], kx = Math.cos(la0 * Math.PI / 180) * 111320, X = T.map((q) => q[1] * kx), Y = T.map((q) => q[0] * 110540);
  let eps = 8, idx = plRdp(X, Y, eps); while (idx.length > 400 && eps < 400) { eps *= 1.5; idx = plRdp(X, Y, eps); }
  const S = idx.map((i) => T[i]);
  const tr = { p: plEncPoly(S), km: Math.round(tot * 10) / 10, n: S.length };
  if (allEle) { const A = S.map((q) => Math.round(q[2])); tr.a = A; tr.max = Math.max.apply(null, A); tr.min = Math.min.apply(null, A); tr.gain = Math.round(gain); }
  return { track: tr, name: nm && nm.textContent ? nm.textContent.trim().slice(0, 80) : '' };
}
/* Ventanas ACP de cada control (minutos desde la salida). */
function plWindow(km, nominal) {
  let o = 0, c = 0; PL_BANDS.forEach((b) => { const seg = Math.max(0, Math.min(km, b[1]) - b[0]); o += seg / b[2]; c += seg / b[3]; });
  let open = Math.round(o * 60), close = Math.round(c * 60);
  if (km <= 60) close = Math.round((km / 20 + 1) * 60);
  if (km >= nominal && PL_FIN[nominal]) close = Math.round(PL_FIN[nominal] * 60);
  if (km === 0) close = 60;
  return { open, close };
}
const plMin = (x) => Math.round(x);
function plClock(startHm, plus) { const p = String(startHm || '06:00').split(':'), t = (+p[0] || 0) * 60 + (+p[1] || 0) + plus, d = Math.floor(t / 1440), m = ((t % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60) + (d > 0 ? ' (+' + d + ' d)' : ''); }
const plDur = (m) => { m = Math.round(m); return Math.floor(m / 60) + ':' + pad(m % 60) + ' h'; };
function plCalc(d) {
  const brv = d.kind === 'brevet', total = Number(d.km) || 0, v = Number(d.speed) || 0, def = Number(d.stop);
  if (!(total > 0) || !(v > 0)) return null;
  const cs = (d.ctl || []).map((c) => ({ n: c.name || '', km: Number(c.km), stop: c.stop === '' || c.stop == null ? (isFinite(def) ? def : 10) : Number(c.stop) })).filter((c) => c.km > 0 && c.km < total).sort((a, b) => a.km - b.km);
  cs.push({ n: 'Meta', km: total, stop: 0, meta: true });
  let t = 0, prev = 0, rows = [], ok = true;
  cs.forEach((c) => {
    const arr = t + (c.km - prev) / v * 60; let rec = arr, wait = 0, w = null, margin = null, flag = '';
    if (brv) { w = plWindow(c.km, total); if (arr < w.open) { wait = w.open - arr; rec = w.open; flag = 'wait'; } margin = w.close - rec; if (margin < 0) { flag = 'late'; ok = false; } }
    rows.push({ n: c.n, km: c.km, meta: !!c.meta, arr: Math.round(arr), rec: Math.round(rec), wait: Math.round(wait), w, margin: margin == null ? null : Math.round(margin), stop: c.stop, flag });
    t = rec + c.stop; prev = c.km;
  });
  const last = rows[rows.length - 1];
  return { rows, ok, finish: last.rec, moving: Math.round(total / v * 60), stops: cs.reduce((s, c) => s + (c.meta ? 0 : c.stop), 0), waits: rows.reduce((s, r) => s + r.wait, 0) };
}
function plResHtml(d) {
  const r = plCalc(d), brv = d.kind === 'brevet';
  if (!r) return '<p class="soft" style="font-size:14px">Indica la distancia y tu velocidad media para ver los horarios.</p>';
  const rows = r.rows.map((x) => {
    const nm = x.meta ? 'Meta' : (x.n ? esc(x.n) : 'Control'), ln1 = brv ? 'Abre ' + plClock(d.start, x.w.open) + ' · cierra ' + plClock(d.start, x.w.close) : '';
    let ln2 = 'Llegas ' + plClock(d.start, x.rec); if (x.flag === 'wait') ln2 += ' (esperas ' + plDur(x.wait) + ' a que abra)';
    const tag = brv ? (x.flag === 'late' ? '<span class="pill" style="border-color:var(--warn);color:var(--text);font-weight:700">Fuera de tiempo</span>' : '<span class="muted" style="font-size:12px">Margen ' + plDur(x.margin) + '</span>') : '';
    return '<div class="mrow"><div class="col grow g4" style="min-width:0"><span style="font-weight:600;font-size:16px">' + nm + ' · km ' + String(x.km).replace('.', ',') + '</span>' + (ln1 ? '<span class="muted" style="font-size:13px">' + ln1 + '</span>' : '') + '<span class="muted" style="font-size:13px">' + ln2 + '</span></div>' + tag + '</div>';
  }).join('');
  const sum = '<div class="row g12 wrap" style="margin-top:6px"><div class="col g4"><span class="num" style="font-size:22px">' + plDur(r.finish) + '</span><span class="muted" style="font-size:12px">Tiempo total</span></div><div class="col g4"><span class="num" style="font-size:22px">' + plDur(r.moving) + '</span><span class="muted" style="font-size:12px">En movimiento</span></div><div class="col g4"><span class="num" style="font-size:22px">' + plDur(r.stops + r.waits) + '</span><span class="muted" style="font-size:12px">Paradas y esperas</span></div></div>';
  const msg = brv ? (r.ok ? '<p class="soft" style="font-size:13px;margin-top:8px">Con ese ritmo llegas dentro de todas las ventanas. Las ventanas siguen las reglas de Audax (ACP).</p>' : '<p style="font-size:13px;margin-top:8px;font-weight:600">Con ese ritmo llegarías después del cierre de al menos un control. Prueba con más velocidad o paradas más cortas.</p>') : '';
  return rows + sum + msg;
}
function plNew() { return { id: null, d: { name: '', date: off(30), start: '06:00', kind: 'brevet', km: 200, speed: 24, stop: 10, track: null, ctl: [] } }; }
function plFromEv(e) { return { id: e.id, d: { name: e.name || '', date: e.date || off(30), start: e.start || '06:00', kind: e.kind === 'otro' ? 'otro' : 'brevet', km: e.km || '', speed: e.speed || 24, stop: e.stop != null ? e.stop : 10, track: e.track || null, ctl: (e.ctl || []).map((c) => ({ km: c.km, name: c.name || '', stop: c.stop == null ? '' : c.stop })) } }; }
function plEvName(e) { return e.name || 'Evento'; }
function viewPlanificar() {
  if (!plannerOn()) return '<div class="inner"><div class="stack">' + head('Función no disponible', 'Planificar') + '<section class="card"><p class="soft">Esta función no está habilitada en tu cuenta. Si te interesa, pídesela a tu coach.</p></section></div></div>';
  if (LV && UI.liveOpen) return liveHtml();
  const P = UI.pl;
  if (P) return plEditHtml(P);
  const evs = (ST.myEvents || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))), today = off(0);
  let out = '<div class="inner"><div class="stack">' + head('Organiza tu próximo reto', 'Planificar') + msgBanner();
  if (LV) out += '<section class="card col g8" aria-label="Evento en curso"><div class="eyebrow">' + (LV.mode === 'fin' ? 'Evento terminado' : 'Evento en curso') + '</div><p class="soft">' + esc(LV.ev.name) + '</p><button type="button" class="btn primary" data-a="lvOpen"><span>' + (LV.mode === 'fin' ? 'Ver resumen' : 'Continuar') + '</span>' + ph('arrow-right', 22) + '</button></section>';
  if (!evs.length) out += '<section class="card col g12" aria-label="Sin eventos"><div class="eyebrow">Tus eventos</div><p class="soft">Crea un evento, carga su recorrido y calcula horarios y controles antes de salir. Sirve para un brevet o para cualquier salida larga.</p></section>';
  else {
    out += '<section class="card" aria-label="Tus eventos" style="padding-bottom:8px"><div class="eyebrow" style="margin-bottom:6px">Tus eventos</div>' + evs.map((e) => {
      const dd = e.date >= today ? diffDays(today, e.date) : -1, when = dd < 0 ? 'ya pasó' : (dd === 0 ? 'hoy' : 'en ' + dd + (dd === 1 ? ' día' : ' días')), dt = parse(e.date);
      return '<button type="button" class="mrow" data-a="plOpen" data-v="' + esc(e.id) + '" style="width:100%;text-align:left;background:transparent;border:0;border-top:1px solid var(--line);min-height:64px"><span class="col grow g4" style="min-width:0"><span style="font-weight:600;font-size:16px">' + esc(plEvName(e)) + '</span><span class="muted" style="font-size:13px">' + cap(WD[dt.getDay()]) + ' ' + dt.getDate() + ' ' + FC_MES[dt.getMonth()] + ' · ' + when + '</span><span class="muted" style="font-size:13px">' + (e.kind === 'brevet' ? 'Brevet ' : '') + (e.km ? String(e.km).replace('.', ',') + ' km' : '') + (e.track ? ' · con recorrido' : '') + ((e.ctl || []).length ? ' · ' + e.ctl.length + (e.ctl.length === 1 ? ' control' : ' controles') : '') + '</span></span>' + ph('caret-right', 20, 'var(--muted)') + '</button>';
    }).join('') + '</section>';
  }
  out += '<button type="button" class="btn primary" data-a="plNew"><span>Nuevo evento</span>' + ph('arrow-right', 22) + '</button></div></div>';
  return out;
}
function plEditHtml(P) {
  const d = P.d, brv = d.kind === 'brevet', tr = d.track, lab = (id, t) => '<label for="' + id + '" class="muted" style="font-size:13px">' + t + '</label>';
  const f = (id, t, inner) => '<div class="col g8">' + lab(id, t) + inner + '</div>';
  let out = '<div class="inner"><div class="stack"><div class="row between"><div class="col g4" style="min-width:0"><div class="muted" style="font-size:14px">' + (P.id ? 'Editar evento' : 'Nuevo evento') + '</div><h1 class="title">' + esc(d.name || 'Evento') + '</h1></div><button type="button" class="chip" data-a="plClose">Cerrar</button></div>' + msgBanner();
  out += '<section class="card col g12" aria-label="Datos del evento"><div class="eyebrow">El evento</div>'
    + f('pl-name', 'Nombre', '<input class="field" id="pl-name" data-pl="name" type="text" maxlength="80" value="' + esc(d.name) + '" placeholder="Ejemplo: Brevet 200 km">')
    + '<div class="row g8"><div class="col g8 grow">' + lab('pl-date', 'Fecha') + '<input class="field" id="pl-date" data-pl="date" type="date" value="' + esc(d.date) + '"></div><div class="col g8 grow">' + lab('pl-start', 'Hora de salida') + '<input class="field" id="pl-start" data-pl="start" type="time" value="' + esc(d.start) + '"></div></div>'
    + '<div class="col g8"><span class="muted" style="font-size:13px">Tipo</span><div class="seggroup" role="group" aria-label="Tipo de evento"><button type="button" data-a="plKind" data-v="brevet" aria-pressed="' + brv + '">Brevet</button><button type="button" data-a="plKind" data-v="otro" aria-pressed="' + !brv + '">Otro</button></div></div>'
    + (brv ? '<div class="col g8"><span class="muted" style="font-size:13px">Distancia del brevet</span><div class="chips" role="group" aria-label="Distancia del brevet">' + PL_BRV.map((k) => '<button type="button" class="chip" data-a="plBrv" data-v="' + k + '" aria-pressed="' + (Number(d.km) === k) + '">' + k + ' km</button>').join('') + '</div></div>' : f('pl-km', 'Distancia (km)', '<input class="field" id="pl-km" data-pl="km" type="number" inputmode="decimal" min="1" max="2000" value="' + esc(d.km) + '">'))
    + '</section>';
  out += '<section class="card col g12" aria-label="Recorrido"><div class="eyebrow">Recorrido</div>';
  if (tr) {
    const near = brv && Math.abs(tr.km - Number(d.km)) > Number(d.km) * 0.1;
    out += routeSvg(tr) + (tr.a ? elevSvg(tr) : '') + '<div class="row g12 wrap"><div class="col g4"><span class="num" style="font-size:22px">' + String(tr.km).replace('.', ',') + ' km</span><span class="muted" style="font-size:12px">Distancia</span></div>' + (tr.gain != null ? '<div class="col g4"><span class="num" style="font-size:22px">' + tr.gain.toLocaleString('es-CL') + ' m</span><span class="muted" style="font-size:12px">Desnivel positivo</span></div><div class="col g4"><span class="num" style="font-size:22px">' + tr.max + ' m</span><span class="muted" style="font-size:12px">Altitud máxima</span></div>' : '') + '</div>'
      + (near ? '<p style="font-size:13px;font-weight:600">La ruta mide ' + String(tr.km).replace('.', ',') + ' km y el brevet es de ' + d.km + ' km. Revisa que sea la ruta correcta.</p>' : '')
      + '<div class="row g8 wrap"><label class="chip" for="pl-file" style="display:inline-flex;align-items:center;cursor:pointer">Cambiar archivo</label><button type="button" class="chip" data-a="plNoTrack">Quitar recorrido</button></div>';
  } else out += '<p class="soft" style="font-size:14px">Carga el archivo GPX del recorrido para ver el mapa, la distancia y el desnivel. Lo descargas desde Garmin Connect, RideWithGPS o Strava (en una ruta o actividad, opción exportar GPX).</p><label class="btn primary" for="pl-file" style="cursor:pointer;justify-content:center"><span>Cargar archivo GPX</span></label>';
  out += '<input id="pl-file" data-pl="file" type="file" accept=".gpx,application/gpx+xml,text/xml,application/xml" style="position:absolute;left:-9999px;width:1px;height:1px" aria-label="Archivo GPX"><p class="muted" style="font-size:12px">El archivo se procesa en tu teléfono y solo se guarda un trazo simplificado.</p></section>';
  out += '<section class="card col g12" aria-label="Controles"><div class="eyebrow">' + (brv ? 'Controles' : 'Paradas') + '</div><p class="soft" style="font-size:13px">' + (brv ? 'Escribe el kilómetro de cada control intermedio. La meta se agrega sola.' : 'Escribe el kilómetro de cada parada planificada.') + '</p>';
  (d.ctl || []).forEach((c, i) => { out += '<div class="col g8" style="border-top:1px solid var(--line);padding-top:10px"><div class="row g8"><div class="col g4 grow">' + lab('plc-k' + i, 'Kilómetro') + '<input class="field" id="plc-k' + i + '" data-pl="ck" data-i="' + i + '" type="number" inputmode="decimal" min="1" value="' + esc(c.km) + '"></div><div class="col g4 grow">' + lab('plc-s' + i, 'Parada (min)') + '<input class="field" id="plc-s' + i + '" data-pl="cs" data-i="' + i + '" type="number" inputmode="numeric" min="0" max="600" value="' + esc(c.stop) + '" placeholder="' + esc(d.stop) + '"></div></div><div class="row g8"><input class="field grow" id="plc-n' + i + '" data-pl="cn" data-i="' + i + '" type="text" maxlength="40" value="' + esc(c.name) + '" placeholder="Nombre del control (opcional)" aria-label="Nombre del control ' + (i + 1) + '"><button type="button" class="chip" data-a="plCtlDel" data-v="' + i + '" aria-label="Quitar control ' + (i + 1) + '">Quitar</button></div></div>'; });
  out += '<button type="button" class="chip" data-a="plCtlAdd" style="align-self:flex-start;border-color:var(--accent);color:var(--accent);font-weight:600">Agregar ' + (brv ? 'control' : 'parada') + '</button></section>';
  out += '<section class="card col g12" aria-label="Tu ritmo"><div class="eyebrow">Tu ritmo</div><div class="row g8"><div class="col g8 grow">' + lab('pl-speed', 'Velocidad media (km/h)') + '<input class="field" id="pl-speed" data-pl="speed" type="number" inputmode="decimal" min="5" max="60" value="' + esc(d.speed) + '"></div><div class="col g8 grow">' + lab('pl-stop', 'Parada típica (min)') + '<input class="field" id="pl-stop" data-pl="stop" type="number" inputmode="numeric" min="0" max="600" value="' + esc(d.stop) + '"></div></div><p class="muted" style="font-size:12px">La velocidad es en movimiento, sin contar las paradas.</p></section>';
  out += '<section class="card col g8" aria-label="Horarios"><div class="eyebrow">' + (brv ? 'Horarios y ventanas de control' : 'Horarios estimados') + '</div><div id="pl-res">' + plResHtml(d) + '</div></section>';
  out += '<button type="button" class="btn primary" data-a="plSave"' + (UI.busy ? ' disabled' : '') + '><span>Guardar evento</span>' + ph('check', 22) + '</button>';
  if (P.id) out += '<button type="button" class="btn" data-a="lvStart" data-v="' + esc(P.id) + '"><span>Iniciar evento<small style="display:block;font-size:13px;font-weight:500;color:var(--muted)">Sigue tu avance en vivo. Usa la versión guardada.</small></span>' + ph('arrow-right', 22) + '</button>';
  else out += '<p class="muted" style="font-size:13px">Guarda el evento para poder iniciarlo en vivo.</p>';
  if (P.id) out += P.del ? '<div class="row g8 wrap"><button type="button" class="chip" data-a="plDelYes" style="border-color:var(--warn);font-weight:700">Sí, eliminar este evento</button><button type="button" class="chip" data-a="plDelNo">No, conservarlo</button></div>' : '<button type="button" class="btn ghost" data-a="plDel">Eliminar evento</button>';
  return out + '</div></div>';
}
function plInput(t) {
  const P = UI.pl, k = t.dataset && t.dataset.pl; if (!P || !k) return false; const d = P.d, v = t.value;
  if (k === 'file') return true;
  if (k === 'name') { d.name = v; const h = document.querySelector('h1.title'); if (h) h.textContent = v || 'Evento'; return true; }
  if (k === 'date' || k === 'start' || k === 'km' || k === 'speed' || k === 'stop') d[k] = v;
  else { const c = d.ctl[+t.dataset.i]; if (!c) return true; if (k === 'ck') c.km = v; else if (k === 'cs') c.stop = v; else if (k === 'cn') c.name = v; }
  const r = document.getElementById('pl-res'); if (r) r.innerHTML = plResHtml(d);
  return true;
}
function plValid(d) {
  if (!String(d.name || '').trim()) return 'Ponle un nombre al evento.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) return 'Elige la fecha del evento.';
  if (!/^\d{2}:\d{2}$/.test(d.start || '')) return 'Indica la hora de salida.';
  const km = Number(d.km); if (!(km > 0 && km <= 2000)) return 'Indica la distancia del evento.';
  const v = Number(d.speed); if (!(v >= 5 && v <= 60)) return 'La velocidad media debe estar entre 5 y 60 km/h.';
  for (const c of d.ctl || []) { const k = Number(c.km); if (!(k > 0 && k < km)) return 'Cada control debe estar entre 0 y ' + km + ' km.'; if (c.stop !== '' && c.stop != null && !(Number(c.stop) >= 0 && Number(c.stop) <= 600)) return 'Las paradas van de 0 a 600 minutos.'; }
  return '';
}
Object.assign(ACT, {
  plNew() { UI.pl = plNew(); render(); window.scrollTo(0, 0); },
  plOpen(v) { const e = (ST.myEvents || []).find((x) => x.id === v); if (!e) return; UI.pl = plFromEv(e); render(); window.scrollTo(0, 0); },
  plClose() { UI.pl = null; render(); },
  plKind(v) { const d = UI.pl.d; if (d.kind === v) return; d.kind = v; if (v === 'brevet' && PL_BRV.indexOf(Number(d.km)) < 0) d.km = 200; render(); },
  plBrv(v) { UI.pl.d.km = Number(v); render(); },
  plCtlAdd() { UI.pl.d.ctl.push({ km: '', name: '', stop: '' }); render(); },
  plCtlDel(v) { UI.pl.d.ctl.splice(+v, 1); render(); },
  plNoTrack() { UI.pl.d.track = null; render(); },
  plDel() { UI.pl.del = true; render(); },
  plDelNo() { UI.pl.del = false; render(); },
  async plDelYes() { const P = UI.pl; if (!P || !P.id || !ST.user) return; UI.busy = true; try { await be.deleteEvent(ST.user.uid, P.id); UI.pl = null; say('Evento eliminado.', 'ok'); } catch (e) { say(friendly(e)); } UI.busy = false; render(); },
  async plSave() {
    const P = UI.pl; if (!P || !ST.user || UI.busy) return; const d = P.d, er = plValid(d); if (er) { say(er); return; }
    const ctl = (d.ctl || []).filter((c) => Number(c.km) > 0).map((c) => ({ km: Number(c.km), name: String(c.name || '').slice(0, 40), stop: c.stop === '' || c.stop == null ? null : Number(c.stop) })).sort((a, b) => a.km - b.km);
    const data = { name: String(d.name).trim().slice(0, 80), date: d.date, start: d.start, kind: d.kind, km: Number(d.km), speed: Number(d.speed), stop: Number(d.stop) || 0, track: d.track || null, ctl, updatedAt: Date.now() };
    UI.busy = true; render();
    try { await be.saveEvent(ST.user.uid, P.id || ('e' + Date.now().toString(36)), data); UI.pl = null; say('Evento guardado.', 'ok'); } catch (e) { say(friendly(e)); }
    UI.busy = false; render();
  }
});
async function plFile(f) {
  const P = UI.pl; if (!P || !f) return;
  if (f.size > 12 * 1024 * 1024) { say('El archivo pesa demasiado (máximo 12 MB).'); return; }
  let txt; try { txt = await f.text(); } catch (e) { say('No pude leer el archivo.'); return; }
  const r = plParseGpx(txt); if (r.err) { say(r.err); return; }
  P.d.track = r.track; if (!String(P.d.name).trim() && r.name) P.d.name = r.name;
  if (P.d.kind === 'otro' && !(Number(P.d.km) > 0)) P.d.km = Math.round(r.track.km);
  say('Recorrido cargado: ' + String(r.track.km).replace('.', ',') + ' km.', 'ok');
}
document.addEventListener('change', (e) => { const t = e.target; if (t && t.dataset && t.dataset.pl === 'file' && t.files && t.files[0]) { const f = t.files[0]; t.value = ''; plFile(f); } });

/* ---------- Modo en vivo del evento (v56) ---------- */
var LV = null;
const lvKey = () => 'camino-live-v1-' + (ST.user ? ST.user.uid : '');
const lvLoad = () => { try { const r = JSON.parse(localStorage.getItem(lvKey()) || 'null'); return r && r.ev ? r : null; } catch (e) { return null; } };
const lvSave = () => { try { if (LV) localStorage.setItem(lvKey(), JSON.stringify(LV)); else localStorage.removeItem(lvKey()); } catch (e) { /* sin almacenamiento */ } };
const lvClock = (ms) => { const d = new Date(ms), s = new Date(LV && LV.start ? LV.start : ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + (ymd(d) !== ymd(s) ? ' (+' + Math.max(1, Math.round((parse(ymd(d)) - parse(ymd(s))) / 86400000)) + ' d)' : ''); };
const lvHMS = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return Math.floor(t / 3600) + ':' + pad(Math.floor(t % 3600 / 60)) + ':' + pad(t % 60); };
const lvKm1 = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const lvMinTxt = (m) => { m = Math.abs(Math.round(m)); return m < 60 ? m + ' min' : plDur(m); };
let lvPtsC = { p: '', v: null };
function lvPts(tr) {
  if (lvPtsC.p === tr.p && lvPtsC.v) return lvPtsC.v;
  const P = decodePoly(tr.p), cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + plHav(P[i - 1], P[i]));
  const k = tr.km / (cum[cum.length - 1] || 1), C = cum.map((x) => x * k); lvPtsC = { p: tr.p, v: { P, C } }; return lvPtsC.v;
}
/* Proyecta un punto GPS sobre el recorrido, solo hacia adelante desde el último km conocido. */
function lvProject(tr, lat, lon, kmFrom, maxAdv) {
  const { P, C } = lvPts(tr), kx = Math.cos(lat * Math.PI / 180) * 111320, ky = 110540; let best = null;
  for (let i = 0; i < P.length - 1; i++) {
    if (C[i + 1] < kmFrom - 3 || C[i] > kmFrom + maxAdv) continue;
    const ax = (P[i][1] - lon) * kx, ay = (P[i][0] - lat) * ky, bx = (P[i + 1][1] - lon) * kx, by = (P[i + 1][0] - lat) * ky, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    let t = L2 > 0 ? -(ax * dx + ay * dy) / L2 : 0; t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ax + t * dx, ay + t * dy); if (!best || d < best.dist) best = { dist: d, km: C[i] + t * (C[i + 1] - C[i]) };
  }
  return best;
}
function lvPlanAt(c, v, km) { let prev = { km: 0, dep: 0 }; for (const r of c.rows) { if (km <= r.km) return prev.dep + (km - prev.km) / v * 60; prev = { km: r.km, dep: r.rec + r.stop }; } return prev.dep; }
function lvPaused(a, b) { let s = 0; (LV.rec || []).forEach((e) => { if (e.type !== 'detencion') return; s += Math.max(0, Math.min(e.end || Date.now(), b) - Math.max(e.start, a)); }); return s; }
function lvAna() {
  const c = plCalc(plFromEv(LV.ev).d), r = c.rows[LV.idx], v = Number(LV.ev.speed), brv = LV.ev.kind === 'brevet';
  const at = LV.lastKmAt || LV.depMs, km = Math.max(LV.lastKm, LV.depKm), segKm = km - LV.depKm, rem = Math.max(0, r.km - km), mov = (at - LV.depMs) - lvPaused(LV.depMs, at);
  const avg = segKm >= 1 && mov >= 300000 ? segKm / (mov / 3600000) : null;
  let etaMs = at + rem / (avg || v) * 3600000, wait = false; if (brv) { const op = LV.start + r.w.open * 60000; if (etaMs < op) { etaMs = op; wait = true; } }
  const delay = (at - LV.start) / 60000 - lvPlanAt(c, v, km), marg = brv ? r.w.close - (etaMs - LV.start) / 60000 : null;
  const stopsMs = LV.log.reduce((s, x) => s + Math.max(0, (x.dep || at) - x.arr), 0), movAll = (at - LV.start) - stopsMs - lvPaused(LV.start, at), avgAll = km >= 1 && movAll >= 300000 ? km / (movAll / 3600000) : null;
  return { c, r, v, brv, km, rem, avg, avgAll, etaMs, wait, delay, marg, at };
}
function lvStatus(a) {
  const d = a.delay; let lv = 'ok', t, ch;
  if (d <= -3) { t = 'Vas ' + lvMinTxt(d) + ' adelantado'; ch = 'Adelantado'; } else if (d < 3) { t = 'Vas según el programa'; ch = 'En horario'; } else if (d <= 15) { t = 'Vas ' + lvMinTxt(d) + ' atrasado'; ch = 'Atrasado'; lv = 'warn'; } else { t = 'Vas ' + lvMinTxt(d) + ' atrasado'; ch = 'Muy atrasado'; lv = 'warn'; }
  if (a.brv && a.marg != null && a.marg < 0) { ch = 'Riesgo de cierre'; lv = 'warn'; }
  return { t, ch, lv };
}
function lvShareText() {
  const a = lvAna(), nm = (ST.profile && ST.profile.name) || (ST.user && ST.user.name) || 'Yo', f = firstName(nm), st = lvStatus(a);
  let s = f + ' · ' + LV.ev.name + '. Salió a las ' + lvClock(LV.start) + '. ' + (LV.mode === 'fin' ? 'Terminó el evento a las ' + lvClock(LV.end) + '.' : 'Va en el km ' + lvKm1(a.km) + ' de ' + LV.ev.km + ' (' + st.t.replace('Vas ', 'va ') + '). Próximo control: ' + (a.r.meta ? 'la meta' : (a.r.n || 'control')) + ' km ' + a.r.km + ', llegada estimada ' + lvClock(a.etaMs) + (a.brv ? ', cierra ' + lvClock(LV.start + a.r.w.close * 60000) : '') + '.');
  if (LV.msg && LV.msg.trim()) s += ' ' + LV.msg.trim();
  return s;
}
function lvTile(l, v, id) { return '<div class="col g4" style="background:var(--surface);border-radius:16px;padding:12px 14px;min-width:0"><span class="num" style="font-size:22px;line-height:1.05"' + (id ? ' id="' + id + '"' : '') + '>' + v + '</span><span class="muted" style="font-size:12px">' + l + '</span></div>'; }
function lvStatCard(chip, big, sub, subId, warn) { return '<section class="card col g4" style="text-align:center;align-items:center"><span class="pill" style="' + (warn ? 'border-color:var(--warn);color:var(--text);font-weight:700' : 'border-color:var(--good);color:var(--text);font-weight:700') + '">' + chip + '</span><div class="num" style="font-size:clamp(26px,8vw,36px);line-height:1.1">' + big + '</div><div class="muted" style="font-size:13px"' + (subId ? ' id="' + subId + '"' : '') + '>' + sub + '</div></section>'; }
function liveHtml() {
  const ev = LV.ev; let out = '<div class="inner"><div class="stack"><div class="row between"><div class="col g4" style="min-width:0"><div class="muted" style="font-size:14px">' + (LV.mode === 'fin' ? 'Evento terminado' : 'Evento en curso') + '</div><h1 class="title">' + esc(ev.name) + '</h1></div><button type="button" class="chip" data-a="lvHide">Salir</button></div>' + msgBanner();
  if (LV.mode === 'pre') {
    out += '<section class="card col g12"><div class="eyebrow">Antes de salir</div><p class="soft">Salida programada: <b>' + esc(ev.start) + '</b>. Toca el botón en el momento exacto de la salida: desde ahí corre el cronómetro y se calculan los horarios.</p><button type="button" class="btn primary" data-a="lvGo"><span>Confirmar salida ahora</span>' + ph('arrow-right', 22) + '</button><div class="col g8"><label for="lv-ago" class="muted" style="font-size:13px">¿Ya saliste? Indica hace cuántos minutos</label><div class="row g8"><input class="field" id="lv-ago" type="number" inputmode="numeric" min="0" max="600" placeholder="Ejemplo: 20"><button type="button" class="chip" data-a="lvGoAgo">Aplicar</button></div></div></section><button type="button" class="btn ghost" data-a="lvDrop">Cancelar, no voy a salir</button>';
    return out + '</div></div>';
  }
  if (LV.mode === 'fin') {
    const tot = (LV.end - LV.start) / 60000, last = LV.log[LV.log.length - 1], done = last && last.meta;
    out += lvStatCard(done ? 'Meta' : 'Terminado antes', done ? '¡Llegaste!' : 'Evento cerrado', lvClock(LV.end) + ' · ' + plDur(tot) + ' en total', '', !done)
      + '<section class="card col g8"><div class="eyebrow">Resumen</div>' + (LV.log.length ? LV.log.map((x) => '<div class="mrow"><div class="col grow g4" style="min-width:0"><span style="font-weight:600">' + esc(x.name) + ' · km ' + String(x.km).replace('.', ',') + '</span><span class="muted" style="font-size:13px">Llegada ' + lvClock(x.arr) + ' · ' + lvKm1(x.speed || 0) + ' km/h en el tramo</span></div><span class="muted" style="font-size:12px">' + (x.delay >= 3 ? lvMinTxt(x.delay) + ' atraso' : x.delay <= -3 ? lvMinTxt(x.delay) + ' adelanto' : 'En horario') + '</span></div>').join('') : '<p class="soft">No se registraron controles.</p>') + '</section>'
      + '<section class="card col g8"><div class="eyebrow">Compartir</div><textarea id="lv-msg" rows="2" maxlength="200" placeholder="Mensaje personal (opcional)" aria-label="Mensaje personal">' + esc(LV.msg || '') + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="lvWa" style="width:auto;padding:0 20px;min-height:48px;justify-content:center">Compartir por WhatsApp</button><button type="button" class="chip" data-a="lvCopy">Copiar mensaje</button></div></section>'
      + '<button type="button" class="btn primary" data-a="lvSaveEnd"><span>Guardar resultado y cerrar</span>' + ph('check', 22) + '</button><button type="button" class="btn ghost" data-a="lvDropEnd">Cerrar sin guardar</button>';
    return out + '</div></div>';
  }
  const a = lvAna(), r = a.r, rn = r.meta ? 'Meta' : (r.n || 'Control'), tot = Date.now() - LV.start;
  if (LV.mode === 'stop') {
    const lg = LV.log[LV.log.length - 1], st = lg.delay >= 3 ? lvMinTxt(lg.delay) + ' atrasado' : lg.delay <= -3 ? lvMinTxt(lg.delay) + ' adelantado' : 'en horario', nx = a.r;
    out += lvStatCard('Llegada registrada', esc(lg.name), 'Llegaste a las ' + lvClock(lg.arr) + ' · ' + st, '', lg.delay >= 3)
      + lvStatCard('Detenido en este control', '<span id="lv-stop">' + lvHMS(Date.now() - LV.arrMs) + '</span>', 'Parada planificada: ' + (lg.stopPlan || 0) + ' min', '', false)
      + '<div class="grid2" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + lvTile('Tiempo del tramo', plDur(lg.moveMs / 60000)) + lvTile('Ritmo del tramo', lvKm1(lg.speed || 0) + ' km/h') + (a.brv ? lvTile('Margen al cierre', (lg.margClose < 0 ? '-' : '') + plDur(Math.abs(lg.margClose))) : '') + lvTile('Tiempo total', '<span id="lv-tot">' + lvHMS(tot) + '</span>') + '</div>'
      + '<section class="card col g4"><div class="eyebrow">Tramo que viene</div><p class="soft">' + esc(nx.meta ? 'Meta' : (nx.n || 'Control')) + ' · km ' + String(nx.km).replace('.', ',') + ' · ' + lvKm1(nx.km - lg.km) + ' km</p>' + (a.brv ? '<p class="muted" style="font-size:13px">Abre ' + lvClock(LV.start + nx.w.open * 60000) + ' · cierra ' + lvClock(LV.start + nx.w.close * 60000) + '</p>' : '') + '</section>'
      + '<button type="button" class="btn primary" data-a="lvDepart"><span>Marcar salida de este control</span>' + ph('arrow-right', 22) + '</button><p class="muted" style="font-size:13px">Toca esto cuando retomes la bicicleta: desde ahí se mide el tramo siguiente.</p><button type="button" class="btn ghost" data-a="lvUndo">Deshacer esta llegada</button>';
    return out + '</div></div>';
  }
  const st = lvStatus(a), age = Math.round((Date.now() - (LV.lastKmAt || LV.depMs)) / 60000), openD = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end);
  out += lvStatCard(st.ch, st.t, LV.lastKmAt && LV.lastKm > LV.depKm ? 'Según tu posición de hace <span id="lv-age">' + age + '</span> min' : 'Dime dónde estás para calcular tu avance', '', st.lv === 'warn');
  if (openD) out += '<section class="card col g8" style="text-align:center"><div class="eyebrow">Detención en curso</div><div class="num" id="lv-det" style="font-size:34px">' + lvHMS(Date.now() - openD.start) + '</div><button type="button" class="btn" data-a="lvEvEnd" style="justify-content:center"><span>Finalizar detención</span></button></section>';
  out += '<section class="card col g12"><div class="eyebrow">Próximo control: ' + esc(rn) + ' · km ' + String(r.km).replace('.', ',') + '</div><button type="button" class="btn primary" data-a="lvGps"' + (LV.gpsBusy ? ' disabled' : '') + '><span>' + (LV.gpsBusy ? 'Buscando señal GPS…' : 'Dime dónde estoy') + '</span>' + ph('flag', 22) + '</button>'
    + '<div class="col g8"><label for="lv-km" class="muted" style="font-size:13px">O ingresa el km de tu ciclocomputador</label><div class="row g8"><input class="field" id="lv-km" type="number" inputmode="decimal" min="0" step="0.1" placeholder="Km"><button type="button" class="chip" data-a="lvCalc">Calcular</button></div></div>'
    + (LV.posMsg ? '<p class="soft" style="font-size:13px">' + esc(LV.posMsg) + '</p>' : '') + '<button type="button" class="btn" data-a="lvArrive" style="justify-content:center"><span>Llegué a ' + esc(rn) + '</span></button><p class="muted" style="font-size:12px">Úsalo cuando estés en el control, aunque el km del GPS no coincida exactamente.</p></section>';
  out += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + lvTile('Km recorridos', lvKm1(a.km)) + lvTile('Faltan al control', lvKm1(a.rem) + ' km') + lvTile('Ritmo del tramo', a.avg ? lvKm1(a.avg) + ' km/h' : '—') + lvTile('Ritmo total', a.avgAll ? lvKm1(a.avgAll) + ' km/h' : '—')
    + lvTile('Llegada estimada', lvClock(a.etaMs) + (a.wait ? '*' : '')) + lvTile('Programa', lvClock(LV.start + r.rec * 60000)) + (a.brv ? lvTile('Cierra', lvClock(LV.start + r.w.close * 60000)) + lvTile('Margen al cierre', (a.marg < 0 ? '-' : '') + plDur(Math.abs(a.marg))) : '') + lvTile('Tiempo total', '<span id="lv-tot">' + lvHMS(tot) + '</span>') + '</div>';
  if (a.wait) out += '<p class="muted" style="font-size:12px">* Llegarías antes de que abra el control: esperas hasta la apertura.</p>';
  out += '<section class="card col g8"><div class="eyebrow">Registrar algo</div><select class="field" id="lv-evt" aria-label="Tipo de registro"><option value="detencion">Detención (pinchazo, baño, mecánica)</option><option value="botellas">Botellas / hidratación</option><option value="comida">Comida extra</option><option value="sales">Sales / electrolitos</option><option value="sensacion">Sensación</option><option value="otro">Otro</option></select><input class="field" id="lv-evd" type="text" maxlength="80" placeholder="Detalle (opcional)" aria-label="Detalle"><button type="button" class="btn" data-a="lvEv" style="justify-content:center"><span>Registrar</span></button><p class="muted" style="font-size:12px">La detención pausa el cálculo del ritmo. El resto solo queda anotado con la hora.</p></section>';
  out += '<section class="card col g8"><div class="eyebrow">Compartir avance</div><textarea id="lv-msg" rows="2" maxlength="200" placeholder="Mensaje personal (opcional)" aria-label="Mensaje personal">' + esc(LV.msg || '') + '</textarea><div class="row g8 wrap"><button type="button" class="btn primary" data-a="lvWa" style="width:auto;padding:0 20px;min-height:48px;justify-content:center">Compartir por WhatsApp</button><button type="button" class="chip" data-a="lvCopy">Copiar mensaje</button></div><p class="muted" style="font-size:12px">El mensaje dice tu km y tu próximo control, no tu ubicación exacta.</p></section>';
  if ((LV.rec || []).length) out += '<details class="card"><summary style="font-weight:600;min-height:44px;display:flex;align-items:center">Eventos registrados (' + LV.rec.length + ')</summary>' + LV.rec.map((e) => '<div class="mrow"><div class="col grow g4"><span style="font-weight:600">' + ({ detencion: 'Detención', botellas: 'Botellas', comida: 'Comida extra', sales: 'Sales', sensacion: 'Sensación', otro: 'Otro' }[e.type] || 'Otro') + ' · ' + lvClock(e.start) + '</span><span class="muted" style="font-size:13px">' + esc(e.detail || '') + (e.type === 'detencion' && e.end ? ' · ' + lvHMS(e.end - e.start) : '') + '</span></div></div>').join('') + '</details>';
  out += LV.confirmEnd ? '<section class="card col g8"><p class="soft">¿Terminar el evento aquí? Quedará guardado con lo recorrido hasta ahora.</p><div class="row g8 wrap"><button type="button" class="chip" data-a="lvEndYes" style="border-color:var(--warn);font-weight:700">Sí, terminar</button><button type="button" class="chip" data-a="lvEndNo">No, seguir</button></div></section>' : '<button type="button" class="btn ghost" data-a="lvEnd">Terminar el evento aquí</button>';
  return out + '</div></div>';
}
function lvMsg(m) { if (LV) { LV.posMsg = m; LV.gpsBusy = false; lvSave(); render(); } }
function lvSetKm(km) { LV.lastKm = Math.max(0, Math.min(km, Number(LV.ev.km))); LV.lastKmAt = Date.now(); }
Object.assign(ACT, {
  async featToggle(v) {
    if (!isOwner()) return; const a = ST.athletes.find((x) => x.id === v); if (!a) return; const on = !(a.features && a.features.planificar === true);
    try { await be.saveProfile(v, { features: { planificar: on } }); say(on ? 'Planificar habilitado para ' + a.first + '.' : 'Planificar deshabilitado para ' + a.first + '.', 'ok'); } catch (e) { say(friendly(e)); }
  },
  lvStart(v) {
    if (LV && LV.ev.id !== v) { say('Ya tienes un evento en curso. Termínalo o ciérralo antes de iniciar otro.'); return; }
    if (LV) { UI.liveOpen = true; render(); return; }
    const e = (ST.myEvents || []).find((x) => x.id === v); if (!e) return; const d = plFromEv(e).d; if (!plCalc(d)) { say('Completa la distancia y tu velocidad media para iniciar.'); return; }
    LV = { ev: { id: e.id, name: e.name, date: e.date, start: e.start, kind: e.kind, km: e.km, speed: e.speed, stop: e.stop, track: e.track || null, ctl: e.ctl || [] }, mode: 'pre', start: null, idx: 0, depMs: null, depKm: 0, lastKm: 0, lastKmAt: null, log: [], rec: [], msg: '', posMsg: '' };
    UI.pl = null; UI.liveOpen = true; lvSave(); render(); window.scrollTo(0, 0);
  },
  lvOpen() { UI.liveOpen = true; UI.pl = null; render(); },
  lvHide() { UI.liveOpen = false; render(); },
  lvGo() { lvGo(0); },
  lvGoAgo() { const n = Number((document.getElementById('lv-ago') || {}).value); if (!(n >= 0 && n <= 600)) { say('Indica los minutos entre 0 y 600.'); return; } lvGo(n); },
  lvDrop() { LV = null; lvSave(); UI.liveOpen = false; render(); },
  lvDropEnd() { LV = null; lvSave(); UI.liveOpen = false; render(); },
  lvCalc() { const raw = String((document.getElementById('lv-km') || {}).value || '').replace(',', '.'), k = parseFloat(raw); if (!(k >= 0) || k > Number(LV.ev.km)) { say('Ingresa un km entre 0 y ' + LV.ev.km + '.'); return; } if (k < LV.depKm - 1) { say('Ese km queda antes del último control. Revisa el valor.'); return; } lvSetKm(k); LV.posMsg = 'Posición manual: km ' + lvKm1(k) + '.'; lvSave(); render(); },
  lvGps() {
    if (!navigator.geolocation) { lvMsg('Este teléfono no permite usar el GPS desde la app. Ingresa el km a mano.'); return; }
    if (!LV.ev.track) { lvMsg('Este evento no tiene recorrido cargado. Ingresa el km a mano.'); return; }
    LV.gpsBusy = true; render();
    navigator.geolocation.getCurrentPosition((pos) => {
      if (!LV) return; const hrs = (Date.now() - (LV.lastKmAt || LV.depMs)) / 3600000, p = lvProject(LV.ev.track, pos.coords.latitude, pos.coords.longitude, Math.max(LV.lastKm, LV.depKm), Math.max(30, (hrs + 1) * 45));
      if (!p) { lvMsg('No encontré tu posición en el recorrido. Ingresa el km a mano.'); return; }
      if (p.dist > 1000) { lvMsg('Estás a ' + Math.round(p.dist) + ' m de la ruta, demasiado lejos para calcular el km. Ingresa el km a mano.'); return; }
      lvSetKm(p.km); lvMsg('GPS: km ' + lvKm1(p.km) + ' · a ' + Math.round(p.dist) + ' m de la ruta · precisión ±' + Math.round(pos.coords.accuracy || 0) + ' m.');
    }, (err) => { lvMsg(err && err.code === 1 ? 'No diste permiso de ubicación. Actívalo en el navegador o ingresa el km a mano.' : 'No pude obtener el GPS. Reintenta al aire libre o ingresa el km a mano.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 20000 });
  },
  lvArrive() {
    const now = Date.now(), a = lvAna(), r = a.r, op = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end); if (op) op.end = now;
    const mov = (now - LV.depMs) - lvPaused(LV.depMs, now), dist = r.km - LV.depKm, el = (now - LV.start) / 60000;
    LV.log.push({ i: LV.idx, name: r.meta ? 'Meta' : (r.n || 'Control'), km: r.km, meta: !!r.meta, arr: now, dep: null, depMs: LV.depMs, depKm: LV.depKm, moveMs: mov, speed: mov > 0 ? dist / (mov / 3600000) : 0, margClose: a.brv ? r.w.close - el : null, delay: el - lvPlanAt(a.c, a.v, r.km), stopPlan: r.stop });
    LV.arrMs = now; LV.lastKm = r.km; LV.lastKmAt = now; LV.posMsg = '';
    if (r.meta) { LV.mode = 'fin'; LV.end = now; } else LV.mode = 'stop';
    lvSave(); render(); window.scrollTo(0, 0);
  },
  lvDepart() { const now = Date.now(), lg = LV.log[LV.log.length - 1]; lg.dep = now; LV.idx = lg.i + 1; LV.depMs = now; LV.depKm = lg.km; LV.lastKm = lg.km; LV.lastKmAt = now; LV.mode = 'ride'; LV.posMsg = ''; lvSave(); render(); window.scrollTo(0, 0); },
  lvUndo() { const lg = LV.log.pop(); if (!lg) return; LV.idx = lg.i; LV.depMs = lg.depMs; LV.depKm = lg.depKm; LV.lastKm = lg.depKm; LV.lastKmAt = lg.depMs; LV.mode = 'ride'; LV.end = null; lvSave(); render(); },
  lvEv() { const t = (document.getElementById('lv-evt') || {}).value || 'otro', d = String((document.getElementById('lv-evd') || {}).value || '').slice(0, 80), now = Date.now(); LV.rec = LV.rec || []; if (t === 'detencion') { if (LV.rec.some((e) => e.type === 'detencion' && !e.end)) { say('Ya hay una detención en curso.'); return; } LV.rec.push({ type: t, detail: d, start: now, end: null }); } else LV.rec.push({ type: t, detail: d, start: now, end: now }); lvSave(); render(); },
  lvEvEnd() { const op = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end); if (op) op.end = Date.now(); lvSave(); render(); },
  lvEnd() { LV.confirmEnd = true; render(); },
  lvEndNo() { LV.confirmEnd = false; render(); },
  lvEndYes() { const now = Date.now(), op = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end); if (op) op.end = now; LV.confirmEnd = false; LV.mode = 'fin'; LV.end = now; lvSave(); render(); window.scrollTo(0, 0); },
  lvWa() { const t = lvShareText(); try { window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener'); } catch (e) { say('No pude abrir WhatsApp. Usa Copiar mensaje.'); } },
  async lvCopy() { const t = lvShareText(); try { await navigator.clipboard.writeText(t); say('Mensaje copiado.', 'ok'); } catch (e) { say('No pude copiar. Mantén presionado este mensaje para copiarlo: ' + t); } },
  async lvSaveEnd() {
    const e = (ST.myEvents || []).find((x) => x.id === LV.ev.id); if (!e || !ST.user) { LV = null; lvSave(); UI.liveOpen = false; render(); return; }
    const last = LV.log[LV.log.length - 1], res = { start: LV.start, end: LV.end, done: !!(last && last.meta), controls: LV.log.map((x) => ({ n: x.name, km: x.km, arr: Math.round((x.arr - LV.start) / 60000), delay: Math.round(x.delay) })), stops: (LV.rec || []).filter((x) => x.type === 'detencion').length };
    const data = { name: e.name, date: e.date, start: e.start, kind: e.kind, km: e.km, speed: e.speed, stop: e.stop || 0, track: e.track || null, ctl: e.ctl || [], result: res, updatedAt: Date.now() };
    UI.busy = true; try { await be.saveEvent(ST.user.uid, e.id, data); LV = null; lvSave(); UI.liveOpen = false; say('Resultado guardado en el evento.', 'ok'); } catch (er) { say(friendly(er)); } UI.busy = false; render();
  }
});
async function lvWake() { try { if (navigator.wakeLock) LV.wl = await navigator.wakeLock.request('screen'); } catch (e) { /* sin wake lock */ } }
function lvGo(ago) { const now = Date.now(); LV.start = now - ago * 60000; LV.mode = 'ride'; LV.depMs = LV.start; LV.depKm = 0; LV.lastKm = 0; LV.lastKmAt = now; LV.posMsg = ''; lvSave(); render(); window.scrollTo(0, 0); lvWake(); }
setInterval(() => {
  if (!LV || !UI.liveOpen || LV.mode === 'pre' || LV.mode === 'fin') return; const q = (id) => document.getElementById(id), now = Date.now();
  if (q('lv-tot')) q('lv-tot').textContent = lvHMS(now - LV.start);
  if (q('lv-stop') && LV.arrMs) q('lv-stop').textContent = lvHMS(now - LV.arrMs);
  const op = (LV.rec || []).find((e) => e.type === 'detencion' && !e.end); if (q('lv-det') && op) q('lv-det').textContent = lvHMS(now - op.start);
  if (q('lv-age')) q('lv-age').textContent = Math.round((now - (LV.lastKmAt || LV.depMs)) / 60000);
}, 1000);
document.addEventListener('input', (e) => { if (LV && e.target && e.target.id === 'lv-msg') { LV.msg = e.target.value; lvSave(); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && LV && UI.liveOpen && LV.mode !== 'pre' && LV.mode !== 'fin') { lvWake(); render(); } });

document.addEventListener('click', (e) => { const t = e.target.closest('[data-a]'); if (!t) return; const fn = ACT[t.dataset.a]; if (fn) fn(t.dataset.v, t); });
document.addEventListener('input', (e) => {
  if (plInput(e.target)) return;
  const id = e.target.id;
  if (id === 'fbText') { UI.fbDraft = e.target.value; UI.fbOk = false; const c = document.getElementById('fbCount'), b = document.getElementById('fbSend'); if (c) c.textContent = e.target.value.length + ' / 1000'; if (b) b.disabled = !e.target.value.trim() || UI.busy; }
  if (id && id.indexOf('pf-') === 0 && UI.prof) UI.prof.d[id.slice(3)] = e.target.value;
  if (id === 'comment') UI.draft.comment = e.target.value;
  if (id && id.indexOf('chatText-') === 0) { UI.chatDraft = Object.assign({}, UI.chatDraft || {}, { [e.target.dataset.vid]: e.target.value }); }
  if (id === 'propName' || id === 'propEmail' || id === 'propNote') { UI.prop = UI.prop || { kind: 'athlete' }; UI.prop[id.slice(4).toLowerCase()] = e.target.value; }
  if (id && id.indexOf('gzt-') === 0 && UI.flow && UI.flow.d.gzones && UI.flow.d.gzones[id.slice(4)]) { UI.flow.d.gzones[id.slice(4)].t = e.target.value; const cc = document.getElementById('gzc-' + id.slice(4)); if (cc) cc.textContent = e.target.value.length + '/200'; }
  if (id === 'prevText') UI.draft.prevText = e.target.value;
  if (id === 'preText' || id === 'postText' || id === 'hardText' || id === 'skipText' || id === 'oname') UI.draft[id] = e.target.value;
  if (id === 'replyText') { UI.reply.text = e.target.value; const b = document.querySelector('[data-a="sendReply"]'); if (b) { const has = !!e.target.value.trim(); b.disabled = !has || UI.busy; const a = athleteObjs().find((x) => x.id === UI.sel); b.textContent = has ? 'Enviar a ' + (a ? a.first : '') : 'Enviar'; } const cn = document.getElementById('replyCount'); if (cn) cn.textContent = e.target.value.length + ' / 600'; }
  if (id === 'planText') UI.planDraft = { id: UI.sel, text: e.target.value };
  if (id === 'histText') UI.histDraft = { id: UI.sel, text: e.target.value };
  if (id === 'reminder' && ST.user) { be.saveProfile(ST.user.uid, { reminder: e.target.value }).catch(() => {}); }
  if (id === 'metaGoal' || id === 'metaHito') { const cur = UI.metaDraft && UI.metaDraft.team === UI.metaTeam ? UI.metaDraft : { team: UI.metaTeam, goal: (ST.teamMeta[UI.metaTeam] || {}).goal || KM_GOAL_DEFAULT, hito: (ST.teamMeta[UI.metaTeam] || {}).hito || '' }; if (id === 'metaGoal') cur.goal = e.target.value; else cur.hito = e.target.value; UI.metaDraft = cur; }
});
window.addEventListener('hashchange', route);
document.addEventListener('focusout', () => { setTimeout(() => { const t = document.activeElement; if (softPending && !(t && /^(TEXTAREA|INPUT)$/.test(t.tagName))) render(); }, 0); });

/* ---------- Arranque ---------- */
applyTone();
applyPrefs();
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { render(); }); } catch (e) { /* navegador sin matchMedia */ }
be.setErrorHandler((where, err) => say(friendly(err) + (err && err.code ? ' [' + where + ': ' + String(err.code).replace('firestore/', '') + ']' : '')));
render();
be.onAuth((user) => startSession(user));

/* ---------- Aviso de versión nueva ---------- */
let updShown = false;
async function checkUpdate() {
  if (DEMO || updShown || location.protocol.indexOf('http') !== 0) return;
  try {
    const r = await fetch('./sw.js?v=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
    const m = /camino-shell-v(\d+)/.exec(await r.text()); if (!m || Number(m[1]) <= APP_VER) return;
    updShown = true;
    const el = document.createElement('div'); el.className = 'updbar'; el.setAttribute('role', 'status');
    el.innerHTML = '<span>Hay una versión nueva de Camino.</span><button type="button" id="updgo">Actualizar</button>';
    document.body.appendChild(el);
    document.getElementById('updgo').onclick = async () => {
      try { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((x) => x.unregister())); const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } catch (e) { /* igual se recarga */ }
      try { await Promise.all(['./', './index.html', './app.js', './styles.css', './backend-firebase.js', './backend-demo.js', './sw.js'].map((u) => fetch(u, { cache: 'reload' }).catch(() => null))); } catch (e) { /* igual se recarga */ }
      location.reload();
    };
  } catch (e) { /* sin conexión: se reintenta luego */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
setInterval(checkUpdate, 30 * 60 * 1000);
setTimeout(checkUpdate, 3000);
if ('serviceWorker' in navigator && !DEMO && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
