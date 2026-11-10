// Pruebas técnicas de la API REST de SGPI.
// Se ejecutan contra una instalación LOCAL con datos de prueba (seed). No usar con datos reales.
//
// Uso (desde la carpeta pruebas/):
//   PRUEBA_RUT=11111111-1 PRUEBA_CLAVE=tuClave node api/pruebas-api.mjs
// En Windows (PowerShell):
//   $env:PRUEBA_RUT="11111111-1"; $env:PRUEBA_CLAVE="tuClave"; node api/pruebas-api.mjs
//
// Variables opcionales: API_URL (por defecto http://localhost:3000/api).
// Requiere Node 18 o superior. No necesita instalar dependencias.

import { writeFileSync } from 'node:fs';

const API = (process.env.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const RUT = process.env.PRUEBA_RUT;
const CLAVE = process.env.PRUEBA_CLAVE;

if (!RUT || !CLAVE) {
  console.error('Faltan PRUEBA_RUT y PRUEBA_CLAVE (usuario de login de la instalación local).');
  process.exit(1);
}
if (!/\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(API) && process.env.PERMITIR_REMOTO !== 'si') {
  console.error(`La API ${API} no es local. Estas pruebas crean y modifican datos: córrelas solo en una instalación local.`);
  process.exit(1);
}

// ---------------------------------------------------------------- utilidades
const resultados = [];
let token = null;

function hoyChile() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function sumarDias(fechaISO, dias) {
  const d = new Date(fechaISO + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
function dv(numero) {
  let suma = 0, factor = 2;
  for (const c of String(numero).split('').reverse()) { suma += Number(c) * factor; factor = factor === 7 ? 2 : factor + 1; }
  const r = 11 - (suma % 11);
  return r === 11 ? '0' : r === 10 ? 'K' : String(r);
}
function rutAleatorio() {
  const n = 30000000 + Math.floor(Math.random() * 900000);
  return `${n}-${dv(n)}`;
}
function rutConDvMalo() {
  const n = 30000000 + Math.floor(Math.random() * 900000);
  const correcto = dv(n);
  return `${n}-${correcto === '1' ? '2' : '1'}`;
}
// busca recursivamente la primera propiedad con alguno de los nombres indicados
function buscar(obj, nombres) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const n of nombres) if (obj[n] !== undefined && obj[n] !== null) return obj[n];
  for (const v of Object.values(obj)) {
    const r = buscar(v, nombres);
    if (r !== undefined) return r;
  }
  return undefined;
}

async function pedir(metodo, ruta, { cuerpo, conToken = true, tokenManual, formData } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  const t = tokenManual !== undefined ? tokenManual : (conToken ? token : null);
  if (t) headers.Authorization = `Bearer ${t}`;
  const inicio = performance.now();
  const res = await fetch(API + ruta, { method: metodo, headers, body: formData ?? (cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined) });
  const ms = Math.round(performance.now() - inicio);
  let datos = null;
  try { datos = await res.json(); } catch { datos = null; }
  return { status: res.status, ms, datos };
}

// esperado: número de estado HTTP. limiteMs: tiempo máximo (opcional). extra: función que devuelve '' si está bien o un texto con el problema.
async function caso(id, modulo, descripcion, esperado, accion, { limiteMs, extra } = {}) {
  let r, error = '';
  try { r = await accion(); } catch (e) { error = String(e.message || e); }
  let estado = 'APROBADO', obtenido = r ? r.status : 'sin respuesta', nota = '';
  if (!r) { estado = 'FALLIDO'; nota = error; }
  else {
    if (r.status !== esperado) { estado = 'FALLIDO'; nota = r.datos?.error ? `respuesta: ${r.datos.error}` : ''; }
    if (limiteMs && r.ms > limiteMs) { estado = 'FALLIDO'; nota = `${r.ms} ms supera ${limiteMs} ms`; }
    if (extra && estado === 'APROBADO') { const p = extra(r); if (p) { estado = 'FALLIDO'; nota = p; } }
  }
  resultados.push({ id, modulo, descripcion, esperado: limiteMs ? `${esperado} en ≤ ${limiteMs} ms` : String(esperado), obtenido: String(obtenido), ms: r?.ms ?? null, estado, nota });
  console.log(`${estado === 'APROBADO' ? 'OK   ' : 'FALLA'} ${id} ${descripcion} -> ${obtenido}${r ? ` (${r.ms} ms)` : ''}${nota ? ' | ' + nota : ''}`);
  return r;
}

function pacienteDePrueba(rut, extra = {}) {
  return {
    paciente: {
      rut, nombre: 'Prueba', apellido: 'Técnica API', fecha_nacimiento: sumarDias(hoyChile(), -700),
      sexo_biologico: 'Femenino', direccion: 'Calle de prueba 123', comuna: 'Concepción', sector: 'Sector 1 - Azul',
      prevision: 'FONASA', es_naneas_prematuro: true, ...extra,
    },
    tutor: {
      rut: rutAleatorio(), nombre: 'Tutor', apellido: 'De Prueba', telefono: '+56911111111', parentesco: 'Madre',
      correo: 'prueba@ejemplo.cl', direccion: 'Calle de prueba 123', comuna: 'Concepción',
    },
  };
}

// ---------------------------------------------------------------- pruebas
const creados = { pacientes: [], tutores: [], controles: [], inscripciones: [], sesiones: [] };

console.log(`Pruebas de API contra ${API} — ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}\n`);

// --- Acceso
await caso('API-01', 'Acceso', 'Consultar pacientes sin token', 401, () => pedir('GET', '/pacientes', { conToken: false }));
await caso('API-02', 'Acceso', 'Consultar pacientes con un token alterado', 403, () => pedir('GET', '/pacientes', { tokenManual: 'eyJhbGciOiJIUzI1NiJ9.e30.firmaFalsa' }));
await caso('API-03', 'Acceso', 'Iniciar sesión sin contraseña', 400, () => pedir('POST', '/auth/login', { cuerpo: { rut: RUT }, conToken: false }));
const r04 = await caso('API-04', 'Acceso', 'Iniciar sesión con contraseña incorrecta', 401, () => pedir('POST', '/auth/login', { cuerpo: { rut: RUT, password: CLAVE + 'x' }, conToken: false }));
await caso('API-05', 'Acceso', 'Iniciar sesión con un RUT no registrado entrega el mismo mensaje', 401,
  () => pedir('POST', '/auth/login', { cuerpo: { rut: rutAleatorio(), password: 'cualquiera123' }, conToken: false }),
  { extra: (r) => (r.datos?.error === r04?.datos?.error ? '' : `mensaje distinto: "${r.datos?.error}" vs "${r04?.datos?.error}"`) });
const login = await caso('API-06', 'Acceso', 'Iniciar sesión con credenciales correctas', 200,
  () => pedir('POST', '/auth/login', { cuerpo: { rut: RUT, password: CLAVE }, conToken: false }),
  { extra: (r) => (r.datos?.token ? '' : 'no entregó token') });
token = login?.datos?.token;
if (!token) {
  console.error('\nNo se pudo iniciar sesión: revisa PRUEBA_RUT y PRUEBA_CLAVE. Se detienen las pruebas.');
  process.exit(1);
}

// --- Datos de apoyo
const profesionales = (await pedir('GET', '/profesionales')).datos || [];
const profesional = (Array.isArray(profesionales) ? profesionales : buscar(profesionales, ['datos']) || []).find((p) => p.activo !== false);
if (!profesional) { console.error('No hay profesionales activos en la base (corre el seed).'); process.exit(1); }

// --- Pacientes
const rutPaciente = rutAleatorio();
const p07 = await caso('API-07', 'Pacientes', 'Inscribir un paciente con sus datos y los de su tutor', 201, () => pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutPaciente) }));
const idPaciente = buscar(p07?.datos, ['id_paciente']);
if (idPaciente) creados.pacientes.push(idPaciente);
await caso('API-08', 'Pacientes', 'Inscribir un paciente con un RUT ya registrado', 400, () => pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutPaciente) }));
await caso('API-09', 'Pacientes', 'Inscribir un paciente sin los datos del tutor', 400, () => pedir('POST', '/pacientes', { cuerpo: { paciente: pacienteDePrueba(rutAleatorio()).paciente } }));
const p10 = await caso('API-10', 'Pacientes', 'Inscribir un paciente con un RUT de dígito verificador incorrecto', 400, () => pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutConDvMalo()) }));
if (p10?.status === 201) { const id = buscar(p10.datos, ['id_paciente']); if (id) creados.pacientes.push(id); }

// --- Controles clínicos
const control = (extra = {}) => ({
  paciente: { rut: rutPaciente },
  control: {
    motivo_consulta: 'Control de prueba', anamnesis: 'Registro generado por las pruebas técnicas', edad_meses: 23,
    peso_kg: 11.5, talla_cm: 85, exploracion_fisica: 'Examen normal', problemas_diagnosticados: 'Sin problemas',
    indicaciones_acuerdos: 'Control en seis meses', fecha_proximoControl: sumarDias(hoyChile(), 180),
    rut_profesional: profesional.rut, ...extra,
  },
});
const c11 = await caso('API-11', 'Controles', 'Registrar un control clínico válido', 201, () => pedir('POST', '/control', { cuerpo: control() }));
const idControl = buscar(c11?.datos, ['id_control', 'id']);
if (idControl) creados.controles.push(idControl);
await caso('API-12', 'Controles', 'Registrar un control sin peso', 400, () => pedir('POST', '/control', { cuerpo: control({ peso_kg: undefined }) }));
const c13 = await caso('API-13', 'Controles', 'Registrar un control con un peso fuera de rango (500 kg)', 400, () => pedir('POST', '/control', { cuerpo: control({ peso_kg: 500 }) }));
if (c13?.status === 201) { const id = buscar(c13.datos, ['id_control', 'id']); if (id) creados.controles.push(id); }
await caso('API-14', 'Controles', 'Registrar un control con una fecha de próximo control inexistente (2026-02-30)', 400, () => pedir('POST', '/control', { cuerpo: control({ fecha_proximoControl: '2026-02-30' }) }));
await caso('API-15', 'Controles', 'Registrar un control para un RUT no registrado', 404, () => pedir('POST', '/control', { cuerpo: { ...control(), paciente: { rut: rutAleatorio() } } }));
const rutInactivo = rutAleatorio();
const pInactivo = await pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutInactivo) });
const idInactivo = buscar(pInactivo.datos, ['id_paciente']);
if (idInactivo) { creados.pacientes.push(idInactivo); await pedir('PUT', `/pacientes/${idInactivo}`, { cuerpo: { activo: false } }); }
await caso('API-16', 'Controles', 'Registrar un control para un paciente desactivado', 400, () => pedir('POST', '/control', { cuerpo: { ...control(), paciente: { rut: rutInactivo } } }));

// --- Rendimiento de consultas (RNF_01 y RNF_06)
await caso('API-17', 'Rendimiento', 'Consultar los conteos de la agenda de controles', 200, () => pedir('GET', '/control/agenda/conteos'), { limiteMs: 2000 });
await caso('API-18', 'Rendimiento', 'Consultar la primera página del listado de pacientes', 200, () => pedir('GET', '/pacientes?page=1&limit=30'), { limiteMs: 2000 });
await caso('API-19', 'Rendimiento', 'Consultar la caracterización de la población del Dashboard', 200, () => pedir('GET', '/pacientes/estadisticas/caracterizacion'), { limiteMs: 2000 });
const listaReportes = await pedir('GET', '/reportes?page=1&limit=30');
const rutReporte = buscar(listaReportes.datos, ['rut']) || rutPaciente;
await caso('API-20', 'Rendimiento', 'Generar el reporte de evolución de un paciente con controles', 200, () => pedir('GET', `/reportes/${rutReporte}`), { limiteMs: 3000 });

// --- Talleres y sesiones
const nombreTaller = `Taller de prueba técnica ${Date.now()}`;
await caso('API-21', 'Talleres', 'Crear un taller con edad mínima mayor que la máxima', 400, () => pedir('POST', '/talleres', { cuerpo: { nombre: nombreTaller, edad_min: 10, edad_max: 5 } }));
const t22 = await caso('API-22', 'Talleres', 'Crear un taller válido', 201, () => pedir('POST', '/talleres', { cuerpo: { nombre: nombreTaller, descripcion: 'Creado por las pruebas técnicas', edad_min: 0, edad_max: 18 } }));
const idTaller = buscar(t22?.datos, ['id_taller', 'id']);
await caso('API-23', 'Talleres', 'Crear un taller con un nombre ya registrado', 409, () => pedir('POST', '/talleres', { cuerpo: { nombre: nombreTaller } }));
await caso('API-24', 'Talleres', 'Crear una sesión con una fecha inexistente (2026-02-30)', 400, () => pedir('POST', `/talleres/${idTaller}/sesiones`, { cuerpo: { fecha: '2026-02-30', profesional_externo: 'Profesional de prueba' } }));
const sFutura = await pedir('POST', `/talleres/${idTaller}/sesiones`, { cuerpo: { fecha: sumarDias(hoyChile(), 7), profesional_externo: 'Profesional de prueba' } });
const idSesionFutura = buscar(sFutura.datos, ['id_sesion', 'id']);
if (idSesionFutura) creados.sesiones.push(idSesionFutura);
const i25 = await caso('API-25', 'Talleres', 'Inscribir un paciente activo en una sesión', 201, () => pedir('POST', `/sesiones/${idSesionFutura}/inscripciones`, { cuerpo: { rut_paciente: rutPaciente } }));
const idInscripcionFutura = buscar(i25?.datos, ['id_inscripcion', 'id']);
if (idInscripcionFutura) creados.inscripciones.push(idInscripcionFutura);
await caso('API-26', 'Talleres', 'Inscribir otra vez al mismo paciente en la sesión', 409, () => pedir('POST', `/sesiones/${idSesionFutura}/inscripciones`, { cuerpo: { rut_paciente: rutPaciente } }));
await caso('API-27', 'Talleres', 'Inscribir un paciente desactivado', 400, () => pedir('POST', `/sesiones/${idSesionFutura}/inscripciones`, { cuerpo: { rut_paciente: rutInactivo } }));
await caso('API-28', 'Talleres', 'Registrar asistencia en una sesión que aún no ocurre', 400, () => pedir('PUT', `/inscripciones/${idInscripcionFutura}`, { cuerpo: { estado_asistencia: 'asiste' } }));
await caso('API-29', 'Talleres', 'Terminar una sesión antes de su fecha', 400, () => pedir('POST', `/sesiones/${idSesionFutura}/terminar`));
const sHoy = await pedir('POST', `/talleres/${idTaller}/sesiones`, { cuerpo: { fecha: hoyChile(), profesional_externo: 'Profesional de prueba' } });
const idSesionHoy = buscar(sHoy.datos, ['id_sesion', 'id']);
const iHoy = await pedir('POST', `/sesiones/${idSesionHoy}/inscripciones`, { cuerpo: { rut_paciente: rutPaciente } });
const idInscripcionHoy = buscar(iHoy.datos, ['id_inscripcion', 'id']);
await caso('API-30', 'Talleres', 'Registrar la convocatoria y la asistencia en la sesión del día', 200, () => pedir('PUT', `/inscripciones/${idInscripcionHoy}`, { cuerpo: { estado_convocatoria: 'confirma', estado_asistencia: 'asiste' } }));
await caso('API-31', 'Talleres', 'Terminar la sesión del día', 200, () => pedir('POST', `/sesiones/${idSesionHoy}/terminar`));
await caso('API-32', 'Talleres', 'Modificar la asistencia de una sesión terminada', 400, () => pedir('PUT', `/inscripciones/${idInscripcionHoy}`, { cuerpo: { estado_asistencia: 'no_asiste' } }));
await pedir('DELETE', `/inscripciones/${idInscripcionFutura}`);
await pedir('DELETE', `/sesiones/${idSesionFutura}`);
await pedir('DELETE', `/talleres/${idTaller}`); // desactiva el taller
await caso('API-33', 'Talleres', 'Crear una sesión en un taller desactivado', 400, () => pedir('POST', `/talleres/${idTaller}/sesiones`, { cuerpo: { fecha: sumarDias(hoyChile(), 7), profesional_externo: 'Profesional de prueba' } }));

// --- Importación (en modo simulación, no guarda datos)
await caso('API-34', 'Importación', 'Importar sin adjuntar un archivo', 400, () => pedir('POST', '/importacion/excel', { formData: new FormData() }));
await caso('API-35', 'Importación', 'Importar un archivo que no es una planilla Excel', 400, () => {
  const fd = new FormData();
  fd.append('archivo', new Blob(['esto no es una planilla'], { type: 'text/plain' }), 'notas.txt');
  return pedir('POST', '/importacion/excel', { formData: fd });
});

// --- Profesionales
await caso('API-36', 'Profesionales', 'Registrar un profesional con un RUT ya registrado', 409, () => pedir('POST', '/profesionales', { cuerpo: { rut: profesional.rut, nombre: 'Duplicado', apellido: 'De Prueba', estamento: profesional.estamento } }));

// ---------------------------------------------------------------- limpieza
for (const id of creados.controles) await pedir('DELETE', `/control/${id}`);
for (const id of creados.pacientes) await pedir('DELETE', `/pacientes/${id}`);

// ---------------------------------------------------------------- resumen
const aprobados = resultados.filter((r) => r.estado === 'APROBADO').length;
console.log(`\nResumen: ${aprobados} aprobados y ${resultados.length - aprobados} fallidos de ${resultados.length} casos.`);
console.log('Quedan en la base local el taller desactivado, su sesión terminada y el paciente inscrito en ella (la API no permite borrarlos). Para dejar la base como antes, vuelve a cargar el seed.');
writeFileSync(new URL('./resultados-api.json', import.meta.url), JSON.stringify({ api: API, fecha: new Date().toISOString(), resultados }, null, 2));
console.log('Detalle guardado en pruebas/api/resultados-api.json');
