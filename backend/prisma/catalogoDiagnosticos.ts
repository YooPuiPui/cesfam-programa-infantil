//* catalogo inicial de diagnosticos, lo usa el seed
//? es el mismo que inserta la migracion diagnosticos_catalogo
//? el nombre es una etiqueta propia del sistema, NO la glosa oficial de la CIE-10
//! codigo_cie10 es de referencia (CIE-10 MINSAL/DEIS v2018), null si no hay equivalente: no inventar codigos
//? seed y frontend comparan los nombres de CONDICION exactos; el importador ignora mayusculas, tildes y espacios repetidos

export interface DiagnosticoCatalogo {
    nombre: string;
    codigo_cie10: string | null;
}

const dx = (nombre: string, codigo_cie10: string | null = null): DiagnosticoCatalogo => ({ nombre, codigo_cie10 });

//* condiciones de base del paciente
export const CATALOGO_CONDICION: DiagnosticoCatalogo[] = [
    dx('TEA', 'F84.0'),
    dx('Obs TEA', 'Z03.2'),
    dx('TEA Grado 1'),
    dx('TEA Grado 2'),
    dx('TEA GRADO 3'),
    dx('TEA NO VERBAL'),
    dx('TEA (SD DE ASPERGER)'),
    dx('SINDROME DE ASPERGER'),
    dx('Trastornos Generalizados del Desarrollo', 'F84.9'),
    dx('TDAH', 'F90.0'),
    dx('TOD'),
    dx('Trastorno Conductual'),
    dx('Trastorno Ansioso', 'F41.9'),
    dx('MUTISMO'),
    dx('TEL'),
    dx('TEL Expresivo', 'F80.1'),
    dx('Apraxia del Habla'),
    dx('Dispraxia'),
    dx('DI'),
    dx('DI leve'),
    dx('RETRASO DSM'),
    dx('FIL'),
    dx('TIS'),
    dx('Epilepsia', 'G40.9'),
    dx('Parálisis Cerebral', 'G80.9'),
    dx('HIDROCEFALIA'),
    dx('MICROCEFALIA'),
    dx('CHIARI G1'),
    dx('OBS NEUROFIBROMATOSIS'),
    dx('Síndrome de Down', 'Q90.9'),
    dx('En Estudio de Genética'),
    dx('HIPOTONIA CONGENITA'),
    dx('MALFORMACIÓN ANORRECTAL'),
    dx('SIFILIS CONGENITA'),
    dx('PREMATURA'),
    dx('PREMATURA 34 SEMANAS'),
    dx('PREMATURO 30 SEMANAS'),
    dx('PREMATURO 31 SEMANAS'),
    dx('Asma', 'J45.9'),
    dx('RINITIS'),
    dx('Hipotiroidismo', 'E03.9'),
    dx('DIABETES MELLITUS'),
    dx('HIPERTENSION ARTERIAL'),
    dx('DEPENDIENTE SEVERO'),
];

//* diagnosticos de un control clinico
export const CATALOGO_CONTROL: DiagnosticoCatalogo[] = [
    dx('Estado nutricional normal'),
    dx('Riesgo de desnutrir'),
    dx('Desnutrición', 'E46'),
    dx('Sobrepeso'),
    dx('Obesidad', 'E66.9'),
    dx('Requiere seguimiento nutricional'),
    dx('Desarrollo psicomotor acorde a la edad'),
    dx('Riesgo de retraso del desarrollo psicomotor'),
    dx('Retraso del desarrollo psicomotor', 'R62.0'),
    dx('Rinofaringitis aguda (resfriado común)', 'J00'),
    dx('Síndrome febril sin foco aparente', 'R50.9'),
    dx('Amigdalitis aguda', 'J03.9'),
    dx('Síndrome bronquial obstructivo'),
    dx('Gastroenteritis aguda', 'A09.9'),
    dx('Adolescente sano', 'Z00.3'),
    dx('Apto para inmunización según esquema PNI'),
    dx('Esquema de inmunización incompleto'),
    dx('Seguimiento NANEAS sin descompensación'),
    dx('Seguimiento NANEAS con descompensación'),
    dx('Evolución favorable en terapias'),
    dx('Episodios de desregulación'),
    dx('En observación, sin diagnóstico definido', 'Z03.9'),
];
