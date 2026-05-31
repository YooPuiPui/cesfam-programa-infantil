import { useState, useEffect, useMemo, useCallback } from 'react';
import { Paciente } from '../../../types';
import { PACIENTES_MOCK } from '../constants';

export interface Stats {
    totalActivos: number;
    citadosHoy: number;
    alertasPrematuridad: number;
    riesgoSocial: number;
}

interface UsePacketesReturn {
    pacientes: Paciente[];
    cargando: boolean;
    error: string | null;
    stats: Stats;
    handleVerDetalle: (id: number) => void;
    refetch: () => void;
}

/**
 * Hook personalizado que maneja la lógica de datos de pacientes
 * Integración futura con API: reemplaza PACIENTES_MOCK con fetch a localhost:3000/api/pacientes
 */
export function usePacketes(): UsePacketesReturn {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Simula la carga desde una API
     * TODO: Reemplazar con: const res = await fetch('http://localhost:3000/api/pacientes');
     */
    const fetchPacientes = useCallback(async () => {
        try {
            setCargando(true);
            setError(null);
            
            // Simula latencia de red
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // TODO: Integración con backend
            // const res = await fetch('http://localhost:3000/api/pacientes');
            // if (!res.ok) throw new Error('Error al obtener pacientes');
            // const data = await res.json();
            // setPacientes(data);
            
            // Por ahora, usa datos mock
            setPacientes(PACIENTES_MOCK);
            setCargando(false);
        } catch (err) {
            setError('Error al cargar los pacientes. Por favor, intenta más tarde.');
            setCargando(false);
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchPacientes();
    }, [fetchPacientes]);

    /**
     * Calcula estadísticas con memoización para evitar recálculos
     */
    const stats = useMemo(() => {
        return {
            totalActivos: pacientes.filter(p => p.activo).length,
            citadosHoy: pacientes.length, // Mock: todos están citados hoy
            alertasPrematuridad: pacientes.filter(p => p.es_naneas_prematuro).length,
            riesgoSocial: pacientes.filter(p => p.es_sename || p.es_migrante).length,
        };
    }, [pacientes]);

    /**
     * Manejador para ver detalles de un paciente
     * TODO: Navegar a /pacientes/:id/detalle
     */
    const handleVerDetalle = useCallback((id: number) => {
        console.log('Ver detalle paciente:', id);
        // router.push(`/pacientes/${id}/detalle`);
    }, []);

    return {
        pacientes,
        cargando,
        error,
        stats,
        handleVerDetalle,
        refetch: fetchPacientes,
    };
}
