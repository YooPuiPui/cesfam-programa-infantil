import React, { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Paciente } from '../../types';

export interface FiltrosState {
    busqueda: string;
    comuna: string;
    prevision: string;
    riesgo: 'todos' | 'riesgo' | 'sin-riesgo';
}

export interface FiltrosProps {
    pacientes: Paciente[];
    filtros: FiltrosState;
    onFiltrosChange: (filtros: FiltrosState) => void;
}

/**
 * Filtra pacientes según los criterios proporcionados
 */
export function filtrarPacientes(pacientes: Paciente[], filtros: FiltrosState): Paciente[] {
    return pacientes.filter(p => {
        // Búsqueda por nombre, apellido o RUT
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            const coincide = 
                p.nombre.toLowerCase().includes(busqueda) ||
                p.apellido.toLowerCase().includes(busqueda) ||
                p.rut.toLowerCase().includes(busqueda);
            if (!coincide) return false;
        }

        // Filtro por comuna
        if (filtros.comuna && p.comuna !== filtros.comuna) return false;

        // Filtro por previsión
        if (filtros.prevision && p.prevision !== filtros.prevision) return false;

        // Filtro por riesgo
        if (filtros.riesgo !== 'todos') {
            const tieneRiesgo = p.es_sename || p.es_naneas_prematuro || p.es_migrante;
            if (filtros.riesgo === 'riesgo' && !tieneRiesgo) return false;
            if (filtros.riesgo === 'sin-riesgo' && tieneRiesgo) return false;
        }

        return true;
    });
}

const Filtros = React.memo(({ pacientes, filtros, onFiltrosChange }: FiltrosProps) => {
    // Opciones dinámicas basadas en los datos
    const comunas = useMemo(() => {
        const unique = [...new Set(pacientes.map(p => p.comuna))];
        return unique.sort();
    }, [pacientes]);

    const previsiones = useMemo(() => {
        const unique = [...new Set(pacientes.map(p => p.prevision).filter(Boolean))];
        return unique.sort();
    }, [pacientes]);

    const tieneAlgunFiltro = Boolean(
        filtros.busqueda || filtros.comuna || filtros.prevision || filtros.riesgo !== 'todos'
    );

    return (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4">
            {/* Búsqueda */}
            <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Buscar por nombre, apellido o RUT
                </label>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Carlos, López, 19.876.543-K..."
                        value={filtros.busqueda}
                        onChange={(e) => onFiltrosChange({ ...filtros, busqueda: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Selects */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Comuna */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">
                        Comuna
                    </label>
                    <select
                        value={filtros.comuna}
                        onChange={(e) => onFiltrosChange({ ...filtros, comuna: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todas las comunas</option>
                        {comunas.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Previsión */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">
                        Previsión
                    </label>
                    <select
                        value={filtros.prevision}
                        onChange={(e) => onFiltrosChange({ ...filtros, prevision: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todas las previsiones</option>
                        {previsiones.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {/* Estado de Riesgo */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">
                        Estado de Riesgo
                    </label>
                    <select
                        value={filtros.riesgo}
                        onChange={(e) => onFiltrosChange({ ...filtros, riesgo: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todos">Todos</option>
                        <option value="riesgo">Con riesgo</option>
                        <option value="sin-riesgo">Sin riesgo</option>
                    </select>
                </div>
            </div>

            {/* Botón limpiar (solo visible si hay filtros activos) */}
            {tieneAlgunFiltro && (
                <div className="flex justify-end pt-2">
                    <button
                        onClick={() => onFiltrosChange({ busqueda: '', comuna: '', prevision: '', riesgo: 'todos' })}
                        className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X size={16} />
                        Limpiar filtros
                    </button>
                </div>
            )}
        </div>
    );
});

Filtros.displayName = 'Filtros';

export default Filtros;
