import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Paciente } from '../../types';
import { calcularEdadDetallada, formatearRUT } from '../../utils/formatters';

export interface PacienteCitadoProps {
    paciente: Paciente;
    onVerDetalle: (id: number) => void;
}

const PacienteCitado = React.memo(({ paciente, onVerDetalle }: PacienteCitadoProps) => {
    const edad = calcularEdadDetallada(paciente.fecha_nacimiento);
    const tieneRiesgos = paciente.es_naneas_prematuro || paciente.es_sename || paciente.es_migrante;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {paciente.nombre} {paciente.apellido}
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">{edad} · {paciente.sexo_biologico}</p>
                </div>
                {paciente.prevision && (
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full whitespace-nowrap ml-2 mt-0.5">
                        {paciente.prevision}
                    </span>
                )}
            </div>

            <div className="border-b border-slate-100 my-4" />

            {/* Info */}
            <div className="space-y-1.5 mb-4">
                {paciente.tutor && (
                    <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-400">Tutor:</span>{' '}
                        {paciente.tutor.nombre} {paciente.tutor.apellido}
                        <span className="text-slate-400 text-xs ml-1">({paciente.tutor.parentesco})</span>
                    </p>
                )}
                <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-400">RUT:</span>{' '}
                    {formatearRUT(paciente.rut)}
                </p>
                {paciente.nhc && (
                    <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-400">NHC:</span>{' '}
                        {paciente.nhc}
                    </p>
                )}
            </div>

            {/* Risk badges */}
            {tieneRiesgos && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {paciente.es_naneas_prematuro && (
                        <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
                            ⚠️ Prematuro
                        </span>
                    )}
                    {paciente.es_sename && (
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                            🛡️ SENAME
                        </span>
                    )}
                    {paciente.es_migrante && (
                        <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                            🌍 Migrante
                        </span>
                    )}
                </div>
            )}

            {/* CTA */}
            <div className="mt-auto">
                <button
                    onClick={() => onVerDetalle(paciente.id_paciente)}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 text-sm"
                >
                    Ver Historial
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
});

PacienteCitado.displayName = 'PacienteCitado';

export default PacienteCitado;
