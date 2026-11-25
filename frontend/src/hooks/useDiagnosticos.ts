import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../service/api';
import type { Diagnostico, TipoDiagnostico } from '../types';

const MENSAJE_ERROR = 'No se pudo cargar la lista de diagnósticos. Recarga la página.';

//* catalogo de diagnosticos de un tipo, desde GET /diagnosticos
export function useDiagnosticos(tipo: TipoDiagnostico) {
    const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        //? si la vista se cierra antes de que responda, se cancela la peticion
        const cancelacion = new AbortController();

        const cargar = async () => {
            setCargando(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const respuesta = await fetch(`${API_BASE_URL}/diagnosticos?tipo=${tipo}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: cancelacion.signal,
                });
                if (!respuesta.ok) throw new Error(MENSAJE_ERROR);

                const lista: Diagnostico[] = await respuesta.json();
                setDiagnosticos(lista);
            } catch (err) {
                if (cancelacion.signal.aborted) return;
                console.error('Error al cargar los diagnósticos', err);
                setError(MENSAJE_ERROR);
            } finally {
                if (!cancelacion.signal.aborted) setCargando(false);
            }
        };

        cargar();
        return () => cancelacion.abort();
    }, [tipo]);

    return { diagnosticos, cargando, error };
}
