

export interface Tutor {
    id_tutor: number;
    rut: string;
    nombre: string;
    apellido: string;
    telefono: string;
    parentesco: string;
    correo?: string;
    direccion: string;
    sector?: string;
    comuna: string;
}

export interface Paciente {
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
    comuna: string;
    nhc?: string;
    prevision?: string;        // fonasa. isapre etc
    fecha_inscripcion: string;
    activo: boolean;
    
    //* flags de riesgo social
    es_sename?: boolean;
    es_naneas_prematuro?: boolean;
    es_poblacion_trans?: boolean;
    es_migrante?: boolean;

    //* relacion con tutor
    tutor?: Tutor;

    creado_en?: string;     // tiempo creacion
    id_tutor_principal: number;
}

// ctrl alt b

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
<<<<<<< HEAD
  id_control?: number;                 // ID único (generado por BD)
  id_paciente: number;                 // FK a Paciente
  id_profesional: number;              // FK a Profesional (quién atendió)
  fecha_control: string;               // ISO format: "2026-05-30T10:30:00Z"
  peso_kg?: number;                    // Peso en kilogramos
  talla_cm?: number;                   // Talla en centímetros
  perimetro_cefalico_cm?: number;      // Para menores de 2 años
  diagnostico?: string;                // Diagnóstico de la atención
  observaciones?: string;              // Notas adicionales
  proxima_cita?: string;               // Fecha próxima atención
  creado_en?: string;                  // Timestamp creación
=======
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
  presion_arterial?: string | null;
  diagnostico_nutricional?: string | null;
  tipo_lactancia?: string | null;
  resultado_dpm?: string | null;
  meses_dpm_aplicado?: number | null;
  score_ira?: string | null;
  problemas_diagnosticados?: string | null;
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
>>>>>>> feat/vista-ficha-pacientes
}


export interface ApiResponse<T> {

    success: boolean;       // se logro hacer la peticion?
    data?: T;            //datos retornados
    message?: string;       // mensaje del servidor
    error?: string;         // error (si esxiste)
    statusCode?: number;    // http status

}

export interface FormCrearPaciente {
    paciente: Omit<Paciente, 'id_paciente' | 'creado_en'>;
    tutor: Omit<Tutor, 'id_tutor'>;
}

