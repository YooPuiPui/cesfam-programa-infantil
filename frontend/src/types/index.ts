export interface Comuna {
    id_comuna: number;
    nombre: string;
}

export interface Cuidador {
    id_cuidador: number;
    nombre: string;
    apellidos?: string | null;
    telefono?: string | null;
    parentesco?: string | null;
}

export interface Tutor {
    id_tutor: number;
    rut: string;
    nombre: string;
    apellido: string;
    telefono: string;
    telefono_secundario?: string;
    parentesco: string;
    correo?: string;
    direccion: string;
    sector?: string;
    id_comuna: number;
    comuna?: Comuna;        // viene incluida en las respuestas del backend
    verificado: boolean;
}

//* diagnostico del catalogo, CONDICION = condicion de base del paciente, CONTROL = diagnostico de un control
export type TipoDiagnostico = 'CONDICION' | 'CONTROL';

export interface Diagnostico {
    id_diagnostico: number;
    nombre: string;
    tipo: TipoDiagnostico;
    codigo_cie10?: string | null;     // de referencia, no se muestra en la interfaz
}

export type MotivoDesactivacion =
    | 'TRASLADO'
    | 'EGRESO_POR_EDAD'
    | 'FALLECIMIENTO'
    | 'NO_DESEA_CONTINUAR'
    | 'INUBICABLE'
    | 'ERROR_DE_REGISTRO'
    | 'OTRO';

//* datos de la desactivacion, en null si el paciente esta activo o se desactivo antes de registrarlos
export interface DatosDesactivacion {
    motivo_desactivacion?: MotivoDesactivacion | null;
    detalle_desactivacion?: string | null;
    fecha_desactivacion?: string | null;
}

export interface Paciente extends DatosDesactivacion {
    id_paciente: number;
    rut: string;
    nombre: string;
    apellido: string;
    nombre_social?: string;
    fecha_nacimiento: string;
    sexo_biologico: string;
    identidad_genero: string;
    nacionalidad?: string;
    direccion: string;
    sector?: string;
    id_comuna: number;
    comuna?: Comuna;        // viene incluida en las respuestas del backend
    nhc?: string;
    prevision?: string;        // fonasa. isapre etc
    fecha_inscripcion: string;
    activo: boolean;

    //* flags de riesgo social
    es_sename?: boolean;
    es_naneas_prematuro?: boolean;
    es_poblacion_trans?: boolean;
    es_migrante?: boolean;
    es_salud_mental?: boolean;

    //* diagnosticos y credencial de discapacidad
    diagnosticos?: string[];          // nombres, solo en las respuestas del backend
    diagnosticos_ids?: number[];      // es lo que se envia al crear o editar
    credencial_discapacidad?: 'sin_dato' | 'si' | 'no' | 'en_tramite';
    credencial_discapacidad_detalle?: string;

    //* cuidador (distinto del tutor legal, opcional), viene en las respuestas del backend
    id_cuidador?: number | null;
    cuidador?: Cuidador | null;

    //* relacion con tutor
    tutor?: Tutor;

    creado_en?: string;     // tiempo creacion
    id_tutor_principal: number;
}



export interface Profesional {

    id_profesional: number;
    rut: string;
    nombre: string;
    apellido: string;
    estamento: string;
    activo: boolean;


    creado_en: string



}

export interface Control {
    id_control?: number;
    fecha_control: string;
    motivo_consulta?: string | null;
    anamnesis?: string | null;
    exploracion_fisica?: string | null;
    edad_meses: number;
    peso_kg: number;
    talla_cm: number;
    perimetro_cefalico?: number | null;
    imc: number;
    diagnosticos?: string[];          // nombres del catalogo, vacio en controles antiguos
    diagnosticos_ids?: number[];
    problemas_diagnosticados?: string | null;     // texto "Otro" (en controles antiguos, el diagnostico completo)
    indicaciones_acuerdos?: string | null;
    fecha_proximoControl: string;
    rut_paciente: string;
    rut_profesional: string;
    creado_en?: string;
}

export type ControlClinico = Control;

export interface ControlClinicoDetalle extends Control {
    paciente?: Paciente;
    Profesional?: Profesional;
    profesional?: Profesional;
}


export interface ApiResponse<T> {

    success: boolean;       // se logro hacer la peticion?
    data?: T;            //datos retornados
    message?: string;       // mensaje del servidor
    error?: string;         // error (si esxiste)
    statusCode?: number;    // http status

}

export interface FormCrearPaciente {
    //? en el request el cuidador se manda plano (cuidador_nombre/telefono/parentesco)
    paciente: Omit<Paciente, 'id_paciente' | 'creado_en' | 'comuna' | 'id_cuidador' | 'cuidador'> & {
        cuidador_nombre?: string;
        cuidador_apellidos?: string;
        cuidador_telefono?: string;
        cuidador_parentesco?: string;
    };
    tutor: Omit<Tutor, 'id_tutor' | 'comuna'>;
}