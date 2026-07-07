import {
    ApiResponse,
    Paciente,
    Tutor,
    Profesional,
    Control,
    FormCrearPaciente,
} from '../types/index';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

//? obtener la lista de pacientes /api/pacientes

export async function obtenerTodosPacientes(): Promise<Paciente[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/pacientes`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo obtener pacientes`);

        }

        const data: ApiResponse<Paciente[]> = await response.json();
        return data.data || [];

    } catch (error) {
        console.error('Error en obtener todos los pacientes: ', error);
        throw error;
    }
}

//? obtener paciente especifico por id

export async function obtenerPacientePorId(id: number): Promise<Paciente> {
    try {
        const response = await fetch(`${API_BASE_URL}/pacientes/${id}`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: Paciente no encontrado`);
        }
        const data: ApiResponse<Paciente> = await response.json();
        return data.data!; // ! = Asegura que data.data existe
    } catch (error) {
        console.error(`Error en obtenerPacientePorId(${id}):`, error);
        throw error;
    }
}

//? crear un nuevo paciente 

export async function crearPaciente(formData: FormCrearPaciente): Promise<Paciente> {
    try {
        const response = await fetch(`${API_BASE_URL}/pacientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear paciente');
        }

        const data: ApiResponse<Paciente> = await response.json();
        return data.data!;
    } catch (error) {
        console.error('Error en crearPaciente:', error);
        throw error;
    }
}

export async function actualizarPaciente(
    id: number,
    datosActualizados: Partial<Omit<Paciente, 'id_paciente'>>
): Promise<Paciente> {
    try {
        const response = await fetch(`${API_BASE_URL}/pacientes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosActualizados),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo actualizar paciente`);
        }

        const data: ApiResponse<Paciente> = await response.json();
        return data.data!;
    } catch (error) {
        console.error(`Error en actualizarPaciente(${id}):`, error);
        throw error;
    }
}


export async function eliminarPaciente(id: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/pacientes/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo eliminar paciente`);
        }

        return true;
    } catch (error) {
        console.error(`Error en eliminarPaciente(${id}):`, error);
        throw error;
    }
}


//? crea un profesional /api/profesionales
export async function crearProfesional(profesional: Omit<Profesional, 'id_profesional' | 'creado_en'>): Promise<Profesional> {
    try {
        const response = await fetch(`${API_BASE_URL}/profesionales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profesional),
        });

        if (!response.ok) {
            throw new Error('Error al crear profesional');
        }

        const data: ApiResponse<Profesional> = await response.json();
        return data.data!;
    } catch (error) {
        console.error('Error en crearProfesional:', error);
        throw error;
    }
}


export async function obtenerTodosProfesionales(): Promise<Profesional[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/profesionales`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo obtener profesionales`);
        }
        const data: ApiResponse<Profesional[]> = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error en obtenerTodosProfesionales:', error);
        throw error;
    }
}



//? buscar  un profesional específico por su id /api/profesionales/:id

export async function obtenerProfesionalPorId(id: number): Promise<Profesional> {
    try {
        const response = await fetch(`${API_BASE_URL}/profesionales/${id}`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: Profesional no encontrado`);
        }
        const data: ApiResponse<Profesional> = await response.json();
        return data.data!;
    } catch (error) {
        console.error(`Error en obtenerProfesionalPorId(${id}):`, error);
        throw error;
    }
}

export function calcularEdad(fechaNacimiento: string): number {

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad= hoy.getFullYear() - nacimiento.getFullYear();


    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    const mesCumple = nacimiento.getMonth();
    const diaCumple = nacimiento.getDate();

    if (mesActual < mesCumple || (mesActual === mesCumple && diaActual < diaCumple)){
        edad--;
    }


    return edad;
}

export function formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}


//? validar formato de rut chileno

export function validarFormatoRUT(rut: string): boolean {
    const rutLimpio = rut.replace(/\./g, '').trim();
    const regex = /^\d{1,2}\.\d{3}\.\d{3}-[0-9kK]$/;
    return regex.test(rut);
}

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
