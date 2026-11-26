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
let idComuna = null; // id real de una comuna, se obtiene de GET /comunas después de iniciar sesión

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
      sexo_biologico: 'Femenino', direccion: 'Calle de prueba 123', id_comuna: idComuna, sector: 'Sector 1 - Azul',
      prevision: 'FONASA', es_naneas_prematuro: true, ...extra,
    },
    tutor: {
      rut: rutAleatorio(), nombre: 'Tutor', apellido: 'De Prueba', telefono: '+56911111111', parentesco: 'Madre',
      correo: 'prueba@ejemplo.cl', direccion: 'Calle de prueba 123', id_comuna: idComuna,
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
const comunas = (await pedir('GET', '/comunas')).datos;
idComuna = Array.isArray(comunas) && comunas.length > 0 ? comunas[0].id_comuna : null;
if (!idComuna) { console.error('No hay comunas en la base (corre el seed o la migración).'); process.exit(1); }

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
if (idInactivo) { creados.pacientes.push(idInactivo); await pedir('PUT', `/pacientes/${idInactivo}`, { cuerpo: { activo: false, motivo_desactivacion: 'TRASLADO' } }); }
await caso('API-16', 'Controles', 'Registrar un control para un paciente desactivado', 400, () => pedir('POST', '/control', { cuerpo: { ...control(), paciente: { rut: rutInactivo } } }));

// --- Diagnósticos (catálogo, pacientes y controles)
const SIN_DIAGNOSTICO = 'Selecciona al menos un diagnóstico o descríbelo en «Otro».';
const iguales = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...b].sort());
// compara los diagnosticos devueltos (nombres e ids, en el mismo orden) con los del catálogo esperados
function revisarDiagnosticos(obj, esperados) {
  if (!obj || !Array.isArray(obj.diagnosticos) || !Array.isArray(obj.diagnosticos_ids)) return 'no devolvió diagnosticos y diagnosticos_ids';
  const nombres = esperados.map((d) => d.nombre), ids = esperados.map((d) => d.id_diagnostico);
  if (!iguales(obj.diagnosticos, nombres)) return `diagnosticos: ${JSON.stringify(obj.diagnosticos)}, se esperaba ${JSON.stringify(nombres)}`;
  if (!iguales(obj.diagnosticos_ids, ids)) return `diagnosticos_ids: ${JSON.stringify(obj.diagnosticos_ids)}, se esperaba ${JSON.stringify(ids)}`;
  const desordenado = obj.diagnosticos_ids.some((id, i) => esperados.find((d) => d.id_diagnostico === id)?.nombre !== obj.diagnosticos[i]);
  return desordenado ? 'diagnosticos y diagnosticos_ids no van en el mismo orden' : '';
}
function revisarCatalogo(r, tipo) {
  if (!Array.isArray(r.datos) || r.datos.length === 0) return 'no devolvió una lista con diagnósticos';
  const campos = 'codigo_cie10,id_diagnostico,nombre,tipo';
  if (r.datos.some((d) => Object.keys(d).sort().join(',') !== campos)) return 'los campos no son los esperados';
  return r.datos.every((d) => d.tipo === tipo) ? '' : `incluye diagnósticos que no son ${tipo}`;
}

await caso('API-37', 'Diagnósticos', 'Consultar el catálogo sin token', 401, () => pedir('GET', '/diagnosticos?tipo=CONTROL', { conToken: false }));
const r38 = await caso('API-38', 'Diagnósticos', 'Consultar el catálogo de condiciones de base', 200, () => pedir('GET', '/diagnosticos?tipo=CONDICION'), { extra: (r) => revisarCatalogo(r, 'CONDICION') });
const r39 = await caso('API-39', 'Diagnósticos', 'Consultar el catálogo de diagnósticos de control', 200, () => pedir('GET', '/diagnosticos?tipo=CONTROL'), { extra: (r) => revisarCatalogo(r, 'CONTROL') });
await caso('API-40', 'Diagnósticos', 'Consultar el catálogo con un tipo que no existe', 400, () => pedir('GET', '/diagnosticos?tipo=OTRO'));
const condiciones = Array.isArray(r38?.datos) ? r38.datos : [];
const deControl = Array.isArray(r39?.datos) ? r39.datos : [];
if (condiciones.length < 3 || deControl.length < 3) { console.error('El catálogo de diagnósticos está incompleto (aplica las migraciones).'); process.exit(1); }
const [condA, condB, condC] = condiciones;
const [ctrlA, ctrlB, ctrlC] = deControl;

const rutDx = rutAleatorio();
const p41 = await caso('API-41', 'Diagnósticos', 'Inscribir un paciente con condiciones de base válidas', 201,
  () => pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutDx, { diagnosticos_ids: [condB.id_diagnostico, condA.id_diagnostico, condA.id_diagnostico] }) }),
  { extra: (r) => revisarDiagnosticos(r.datos?.datos, [condA, condB]) });
const idDx = buscar(p41?.datos, ['id_paciente']);
if (idDx) creados.pacientes.push(idDx);
const rutRechazado = rutAleatorio();
const p42 = await caso('API-42', 'Diagnósticos', 'Inscribir un paciente con un diagnóstico de tipo control', 400,
  () => pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutRechazado, { diagnosticos_ids: [condA.id_diagnostico, ctrlA.id_diagnostico] }) }));
if (p42?.status === 201) { const id = buscar(p42.datos, ['id_paciente']); if (id) creados.pacientes.push(id); }
await caso('API-43', 'Diagnósticos', 'El paciente rechazado no quedó guardado', 404, () => pedir('GET', `/pacientes/rut/${rutRechazado}`));
await caso('API-44', 'Diagnósticos', 'Inscribir un paciente con un diagnóstico inexistente', 400,
  () => pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutAleatorio(), { diagnosticos_ids: [999999] }) }));
await caso('API-45', 'Diagnósticos', 'La ficha del paciente devuelve sus diagnósticos', 200, () => pedir('GET', `/pacientes/rut/${rutDx}`),
  { extra: (r) => revisarDiagnosticos(r.datos, [condA, condB]) });
await caso('API-46', 'Diagnósticos', 'Editar un paciente reemplaza sus diagnósticos', 200,
  () => pedir('PUT', `/pacientes/${idDx}`, { cuerpo: { diagnosticos_ids: [condB.id_diagnostico, condC.id_diagnostico] } }),
  { extra: (r) => revisarDiagnosticos(r.datos?.datos, [condB, condC]) });
await caso('API-47', 'Diagnósticos', 'Editar otro dato del paciente conserva sus diagnósticos', 200,
  () => pedir('PUT', `/pacientes/${idDx}`, { cuerpo: { nombre: 'Prueba editada' } }),
  { extra: (r) => revisarDiagnosticos(r.datos?.datos, [condB, condC]) });
await caso('API-48', 'Diagnósticos', 'Editar un paciente con un diagnóstico de tipo control', 400,
  () => pedir('PUT', `/pacientes/${idDx}`, { cuerpo: { diagnosticos_ids: [ctrlA.id_diagnostico] } }));
await caso('API-49', 'Diagnósticos', 'El listado de pacientes devuelve los diagnósticos', 200, () => pedir('GET', `/pacientes?busqueda=${rutDx}`),
  { extra: (r) => revisarDiagnosticos(r.datos?.data?.[0], [condB, condC]) });

const controlDx = (extra = {}) => ({ ...control({ problemas_diagnosticados: undefined, ...extra }), paciente: { rut: rutDx } });
const c50 = await caso('API-50', 'Diagnósticos', 'Registrar un control con diagnósticos válidos y sin texto', 201,
  () => pedir('POST', '/control', { cuerpo: controlDx({ diagnosticos_ids: [ctrlB.id_diagnostico, ctrlA.id_diagnostico] }) }),
  { extra: (r) => revisarDiagnosticos(r.datos?.datos, [ctrlA, ctrlB]) || (r.datos?.datos?.problemas_diagnosticados === null ? '' : 'el texto debía quedar vacío') });
const idControlDx = buscar(c50?.datos, ['id_control']);
if (idControlDx) creados.controles.push(idControlDx);
const c51 = await caso('API-51', 'Diagnósticos', 'Registrar un control sin diagnósticos ni texto', 400,
  () => pedir('POST', '/control', { cuerpo: controlDx({ diagnosticos_ids: [], problemas_diagnosticados: '   ' }) }),
  { extra: (r) => (r.datos?.error === SIN_DIAGNOSTICO ? '' : `mensaje distinto: "${r.datos?.error}"`) });
if (c51?.status === 201) { const id = buscar(c51.datos, ['id_control']); if (id) creados.controles.push(id); }
const c52 = await caso('API-52', 'Diagnósticos', 'Registrar un control solo con el texto de «Otro»', 201,
  () => pedir('POST', '/control', { cuerpo: controlDx({ problemas_diagnosticados: '  Dermatitis del pañal  ' }) }),
  { extra: (r) => revisarDiagnosticos(r.datos?.datos, []) || (r.datos?.datos?.problemas_diagnosticados === 'Dermatitis del pañal' ? '' : 'el texto no se guardó sin espacios') });
const idControlTexto = buscar(c52?.datos, ['id_control']);
if (idControlTexto) creados.controles.push(idControlTexto);
const c53 = await caso('API-53', 'Diagnósticos', 'Registrar un control con una condición de base', 400,
  () => pedir('POST', '/control', { cuerpo: controlDx({ diagnosticos_ids: [condA.id_diagnostico], problemas_diagnosticados: 'Texto' }) }));
if (c53?.status === 201) { const id = buscar(c53.datos, ['id_control']); if (id) creados.controles.push(id); }
await caso('API-54', 'Diagnósticos', 'El detalle del control devuelve diagnósticos y profesional', 200, () => pedir('GET', `/control/detalle/${idControlDx}`),
  { extra: (r) => revisarDiagnosticos(r.datos, [ctrlA, ctrlB]) || revisarDiagnosticos(r.datos?.paciente, [condB, condC]) || (r.datos?.Profesional?.rut ? '' : 'falta el profesional') });
const revisarProfesional = (c) => (Object.keys(c?.Profesional || {}).sort().join(',') === 'apellido,estamento,nombre' ? '' : 'Profesional debe traer solo nombre, apellido y estamento');
await caso('API-55', 'Diagnósticos', 'Los controles de un paciente devuelven diagnósticos y profesional', 200, () => pedir('GET', `/control/${rutDx}`),
  { extra: (r) => { const c = r.datos?.find?.((x) => x.id_control === idControlDx); return revisarDiagnosticos(c, [ctrlA, ctrlB]) || revisarProfesional(c); } });
await caso('API-56', 'Diagnósticos', 'El listado general de controles devuelve diagnósticos y profesional', 200, () => pedir('GET', '/control'),
  { extra: (r) => { const c = r.datos?.find?.((x) => x.id_control === idControlDx); return revisarDiagnosticos(c, [ctrlA, ctrlB]) || revisarDiagnosticos(c?.paciente, [condB, condC]) || revisarProfesional(c); } });
await caso('API-57', 'Diagnósticos', 'La agenda paginada devuelve diagnósticos y profesional', 200, () => pedir('GET', `/control/agenda/paginado?busqueda=${rutDx}`),
  { extra: (r) => { const c = r.datos?.data?.[0]; return revisarDiagnosticos(c, c?.id_control === idControlDx ? [ctrlA, ctrlB] : []) || revisarDiagnosticos(c?.paciente, [condB, condC]) || revisarProfesional(c); } });
await caso('API-58', 'Diagnósticos', 'Editar un control reemplaza sus diagnósticos', 200,
  () => pedir('PUT', `/control/${idControlDx}`, { cuerpo: { diagnosticos_ids: [ctrlB.id_diagnostico, ctrlC.id_diagnostico] } }),
  { extra: (r) => revisarDiagnosticos(r.datos?.datos, [ctrlB, ctrlC]) });
await caso('API-59', 'Diagnósticos', 'Editar otro dato del control conserva sus diagnósticos', 200,
  () => pedir('PUT', `/control/${idControlDx}`, { cuerpo: { motivo_consulta: 'Motivo editado' } }),
  { extra: (r) => revisarDiagnosticos(r.datos?.datos, [ctrlB, ctrlC]) });
await caso('API-60', 'Diagnósticos', 'Editar un control dejándolo sin diagnósticos ni texto', 400,
  () => pedir('PUT', `/control/${idControlDx}`, { cuerpo: { diagnosticos_ids: [] } }));
await caso('API-61', 'Diagnósticos', 'Borrar el texto de un control que no tiene diagnósticos', 400,
  () => pedir('PUT', `/control/${idControlTexto}`, { cuerpo: { problemas_diagnosticados: '' } }));
await caso('API-62', 'Diagnósticos', 'Editar un control con una condición de base', 400,
  () => pedir('PUT', `/control/${idControlDx}`, { cuerpo: { diagnosticos_ids: [condA.id_diagnostico] } }));
await caso('API-63', 'Diagnósticos', 'La caracterización cuenta los diagnósticos por nombre', 200, () => pedir('GET', '/pacientes/estadisticas/caracterizacion'),
  { extra: (r) => {
    const lista = r.datos?.diagnosticos;
    if (!Array.isArray(lista) || lista.some((d) => Object.keys(d).sort().join(',') !== 'name,value' || typeof d.value !== 'number')) return 'formato distinto de {name, value}';
    return lista.some((d) => d.name === condC.nombre && d.value >= 1) ? '' : `no cuenta "${condC.nombre}"`;
  } });

// --- Motivo de desactivación
// compara los datos de desactivación devueltos; con motivo, la fecha debe ser la de recién
function revisarEstado(p, activo, motivo = null, detalle = null) {
  if (!p) return 'no devolvió el paciente';
  const campos = ['motivo_desactivacion', 'detalle_desactivacion', 'fecha_desactivacion'];
  if (campos.some((c) => !(c in p))) return 'faltan campos de desactivación';
  if (p.activo !== activo) return `activo: ${p.activo}`;
  if (p.motivo_desactivacion !== motivo) return `motivo: ${p.motivo_desactivacion}`;
  if (p.detalle_desactivacion !== detalle) return `detalle: ${JSON.stringify(p.detalle_desactivacion)}`;
  if (!motivo) return p.fecha_desactivacion === null ? '' : 'la fecha debía quedar vacía';
  return Math.abs(Date.now() - Date.parse(p.fecha_desactivacion)) < 5 * 60 * 1000 ? '' : `fecha incorrecta: ${p.fecha_desactivacion}`;
}
const rutBaja = rutAleatorio();
const pBaja = await pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutBaja) });
const idBaja = buscar(pBaja.datos, ['id_paciente']);
if (idBaja) creados.pacientes.push(idBaja);
const editarBaja = (cuerpo) => () => pedir('PUT', `/pacientes/${idBaja}`, { cuerpo });
const rechazos = [
  ['API-64', 'Desactivar sin indicar el motivo', { activo: false }],
  ['API-65', 'Desactivar con un motivo que no existe', { activo: false, motivo_desactivacion: 'VACACIONES' }],
  ['API-66', 'Desactivar por «Otro» sin detalle', { activo: false, motivo_desactivacion: 'OTRO' }],
  ['API-67', 'Desactivar por «Otro» con un detalle en blanco', { activo: false, motivo_desactivacion: 'OTRO', detalle_desactivacion: '   ' }],
  ['API-68', 'Desactivar con un detalle de más de 200 caracteres', { activo: false, motivo_desactivacion: 'OTRO', detalle_desactivacion: 'x'.repeat(201) }],
  ['API-69', 'Enviar un motivo junto con activo en true', { activo: true, motivo_desactivacion: 'TRASLADO' }],
  ['API-70', 'Enviar un detalle junto con activo en true', { activo: true, detalle_desactivacion: 'Texto' }],
  ['API-71', 'Enviar un motivo sin el campo activo', { motivo_desactivacion: 'TRASLADO' }],
  ['API-72', 'Enviar activo como texto', { activo: 'false', motivo_desactivacion: 'TRASLADO' }],
];
for (const [id, descripcion, cuerpo] of rechazos) await caso(id, 'Desactivación', descripcion, 400, editarBaja(cuerpo), { extra: (r) => (r.datos?.error ? '' : 'sin mensaje de error') });
await caso('API-73', 'Desactivación', 'Los intentos rechazados no cambian al paciente', 200, () => pedir('GET', `/pacientes/${idBaja}`),
  { extra: (r) => revisarEstado(r.datos, true) });
await caso('API-74', 'Desactivación', 'Desactivar con un motivo válido guarda el motivo y la fecha', 200,
  editarBaja({ activo: false, motivo_desactivacion: 'EGRESO_POR_EDAD', fecha_desactivacion: '2000-01-01T00:00:00.000Z' }),
  { extra: (r) => revisarEstado(r.datos?.datos, false, 'EGRESO_POR_EDAD') });
await caso('API-75', 'Desactivación', 'Desactivar un paciente que ya está desactivado', 400, editarBaja({ activo: false, motivo_desactivacion: 'TRASLADO' }));
await caso('API-76', 'Desactivación', 'La ficha por id muestra los datos de la desactivación', 200, () => pedir('GET', `/pacientes/${idBaja}`),
  { extra: (r) => revisarEstado(r.datos, false, 'EGRESO_POR_EDAD') });
await caso('API-77', 'Desactivación', 'La ficha por RUT muestra los datos de la desactivación', 200, () => pedir('GET', `/pacientes/rut/${rutBaja}`),
  { extra: (r) => revisarEstado(r.datos, false, 'EGRESO_POR_EDAD') });
await caso('API-78', 'Desactivación', 'El listado muestra los datos de la desactivación', 200, () => pedir('GET', `/pacientes?busqueda=${rutBaja}`),
  { extra: (r) => revisarEstado(r.datos?.data?.[0], false, 'EGRESO_POR_EDAD') });
await caso('API-79', 'Desactivación', 'Editar los datos de un paciente desactivado', 400, editarBaja({ nombre: 'Prueba baja' }),
  { extra: (r) => (r.datos?.error ? '' : 'sin mensaje de error') });
await caso('API-84', 'Desactivación', 'Editar los diagnósticos de un paciente desactivado', 400, editarBaja({ diagnosticos_ids: [condA.id_diagnostico] }));
const idTutorBaja = buscar(pBaja.datos, ['id_tutor']);
await caso('API-85', 'Desactivación', 'Editar el tutor de un paciente desactivado', 400, () => pedir('PUT', `/tutores/${idTutorBaja}`, { cuerpo: { nombre: 'Tutor editado' } }));
await caso('API-86', 'Desactivación', 'Las ediciones rechazadas no cambian al paciente', 200, () => pedir('GET', `/pacientes/${idBaja}`),
  { extra: (r) => revisarEstado(r.datos, false, 'EGRESO_POR_EDAD') || (r.datos?.nombre === 'Prueba' && r.datos?.tutor?.nombre === 'Tutor' && r.datos?.diagnosticos?.length === 0 ? '' : 'se modificaron sus datos') });
await caso('API-80', 'Desactivación', 'Reactivar deja los tres campos vacíos', 200, editarBaja({ activo: true }),
  { extra: (r) => revisarEstado(r.datos?.datos, true) });
await caso('API-87', 'Desactivación', 'Editar un paciente reactivado', 200, editarBaja({ nombre: 'Prueba reactivada' }),
  { extra: (r) => (r.datos?.datos?.nombre === 'Prueba reactivada' ? '' : 'no guardó el cambio') });
await caso('API-88', 'Desactivación', 'Editar el tutor de un paciente reactivado', 200, () => pedir('PUT', `/tutores/${idTutorBaja}`, { cuerpo: { nombre: 'Tutor editado' } }));
await caso('API-81', 'Desactivación', 'Desactivar por «Otro» guarda el detalle sin espacios sobrantes', 200,
  editarBaja({ activo: false, motivo_desactivacion: 'OTRO', detalle_desactivacion: '  Cambio de centro  ' }),
  { extra: (r) => revisarEstado(r.datos?.datos, false, 'OTRO', 'Cambio de centro') });
const rutSinMotivo = rutAleatorio();
const p82 = await caso('API-82', 'Desactivación', 'Inscribir un paciente desactivado sin motivo', 400, () => pedir('POST', '/pacientes', { cuerpo: pacienteDePrueba(rutSinMotivo, { activo: false }) }));
if (p82?.status === 201) { const id = buscar(p82.datos, ['id_paciente']); if (id) creados.pacientes.push(id); }
await caso('API-83', 'Desactivación', 'El paciente rechazado no quedó guardado', 404, () => pedir('GET', `/pacientes/rut/${rutSinMotivo}`));

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
