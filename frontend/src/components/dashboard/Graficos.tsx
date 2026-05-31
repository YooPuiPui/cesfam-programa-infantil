import React, { useMemo } from 'react';
import { Paciente } from '../../types';

export interface GraficosProps {
    pacientes: Paciente[];
}

const Graficos = React.memo(({ pacientes }: GraficosProps) => {
    /**
     * Calcula la distribución de pacientes por previsión
     */
    const distribucionPrevision = useMemo(() => {
        const dist: Record<string, number> = {};
        pacientes.forEach(p => {
            if (p.prevision) {
                dist[p.prevision] = (dist[p.prevision] || 0) + 1;
            }
        });
        return Object.entries(dist)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [pacientes]);

    /**
     * Calcula la distribución por rango de edad
     */
    const distribucionEdades = useMemo(() => {
        const rangos = {
            '0-1 años': 0,
            '1-3 años': 0,
            '3-5 años': 0,
            '5-7 años': 0,
            '7-10 años': 0,
            '10+ años': 0,
        };
        
        pacientes.forEach(p => {
            const fecha = new Date(p.fecha_nacimiento);
            const hoy = new Date();
            const edad = hoy.getFullYear() - fecha.getFullYear();
            
            if (edad < 1) rangos['0-1 años']++;
            else if (edad < 3) rangos['1-3 años']++;
            else if (edad < 5) rangos['3-5 años']++;
            else if (edad < 7) rangos['5-7 años']++;
            else if (edad < 10) rangos['7-10 años']++;
            else rangos['10+ años']++;
        });
        
        return Object.entries(rangos).map(([name, value]) => ({ name, value }));
    }, [pacientes]);

    /**
     * Calcula la tendencia de riesgos
     */
    const tendenciaRiesgos = useMemo(() => {
        return [
            { name: 'Prematuridad', value: pacientes.filter(p => p.es_naneas_prematuro).length },
            { name: 'SENAME', value: pacientes.filter(p => p.es_sename).length },
            { name: 'Migrante', value: pacientes.filter(p => p.es_migrante).length },
        ];
    }, [pacientes]);

    const total = pacientes.length || 1; // Evita división por cero

    return (
        <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Estadísticas del Programa
                </h2>
                <p className="text-slate-500 text-sm">
                    Análisis y métricas del programa infantil del CESFAM
                </p>
            </div>

            {/* Grid de gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Previsión */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                        Pacientes por Previsión
                    </h3>
                    <div className="space-y-3">
                        {distribucionPrevision.map(item => {
                            const percent = Math.round((item.value / total) * 100);
                            return (
                                <div key={item.name}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                        <span className="text-xs font-semibold text-slate-500">
                                            {item.value} ({percent}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Edades */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                        Distribución de Edades
                    </h3>
                    <div className="space-y-3">
                        {distribucionEdades.map(item => (
                            <div key={item.name} className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">{item.name}</span>
                                <span className="font-bold text-slate-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Riesgos */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                        Resumen de Riesgos
                    </h3>
                    <div className="space-y-3">
                        {tendenciaRiesgos.map((item, idx) => {
                            const colors = ['bg-orange-100', 'bg-red-100', 'bg-purple-100'];
                            const textColors = ['text-orange-700', 'text-red-700', 'text-purple-700'];
                            return (
                                <div
                                    key={item.name}
                                    className={`${colors[idx]} ${textColors[idx]} px-4 py-2 rounded-lg font-semibold text-sm flex justify-between items-center`}
                                >
                                    <span>{item.name}</span>
                                    <span>{item.value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Nota sobre gráficos interactivos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-slate-700">
                <p>
                    💡 <strong>Próximamente:</strong> Gráficos interactivos con Recharts (pie charts, bar charts, line charts). Para agregarlos, instala:
                </p>
                <code className="block mt-2 bg-slate-900 text-white px-3 py-1 rounded text-xs">
                    npm install recharts
                </code>
            </div>
        </section>
    );
});

Graficos.displayName = 'Graficos';

export default Graficos;
