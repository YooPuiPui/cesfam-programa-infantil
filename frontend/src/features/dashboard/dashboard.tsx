import { useState, useMemo } from 'react';
import {
    Users,
    Clock,
    AlertCircle,
    TrendingUp,
    PlusCircle,
    Activity,
    Stethoscope,
    Calendar,
} from 'lucide-react';
import {
    Indicador,
    PacienteCitado,
    Filtros,
    filtrarPacientes,
    Graficos,
} from '../../components/dashboard';
import { FiltrosState } from '../../components/dashboard';
import { usePacketes } from './hooks/usePacketes';
import { obtenerFechaHoy } from '../../utils/formatters';


export default function Dashboard() {
    // Hook personalizado que maneja la lógica de datos
    const { pacientes, cargando, error, stats, handleVerDetalle } = usePacketes();

    // Estado de filtros
    const [filtros, setFiltros] = useState<FiltrosState>({
        busqueda: '',
        comuna: '',
        prevision: '',
        riesgo: 'todos',
    });

    // Pacientes filtrados (memoizado para optimización)
    const pacientesFiltrados = useMemo(
        () => filtrarPacientes(pacientes, filtros),
        [pacientes, filtros]
    );

    // Fecha actual
    const hoy = obtenerFechaHoy();

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

                {/* ── 1. Header ── */}
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-sm">
                                <Stethoscope size={22} />
                            </div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                CESFAM · Programa Infantil
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            Dashboard
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-base">
                            Resumen de actividades del Programa Infantil
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm self-start md:self-auto">
                        <Calendar size={15} className="text-slate-400" />
                        <span className="capitalize">{hoy}</span>
                    </div>
                </header>

                {/* ── 2. KPI Cards ── */}
                <section aria-label="Indicadores clave">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Indicador
                            titulo="Total Pacientes"
                            valor={cargando ? 0 : stats.totalActivos}
                            icono={<Users size={20} />}
                            color="blue"
                            descripcion="Activos en el programa"
                        />
                        <Indicador
                            titulo="Citados Hoy"
                            valor={cargando ? 0 : stats.citadosHoy}
                            icono={<Clock size={20} />}
                            color="green"
                            descripcion="Atenciones programadas"
                        />
                        <Indicador
                            titulo="Alertas Prematuridad"
                            valor={cargando ? 0 : stats.alertasPrematuridad}
                            icono={<AlertCircle size={20} />}
                            color="orange"
                            descripcion="Requieren seguimiento"
                        />
                        <Indicador
                            titulo="Riesgo Social"
                            valor={cargando ? 0 : stats.riesgoSocial}
                            icono={<TrendingUp size={20} />}
                            color="red"
                            descripcion="Requieren protección"
                        />
                    </div>
                </section>

                {/* ── 3. CTA Buttons ── */}
                <section aria-label="Acciones rápidas">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button className="
              py-8 px-8 rounded-2xl font-bold text-lg text-white
              bg-gradient-to-br from-blue-600 to-blue-700
              shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200
              flex items-center justify-center gap-3
            ">
                            <PlusCircle size={24} />
                            Nuevo Paciente
                        </button>
                        <button className="
              py-8 px-8 rounded-2xl font-bold text-lg text-white
              bg-gradient-to-br from-green-600 to-green-700
              shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200
              flex items-center justify-center gap-3
            ">
                            <Activity size={24} />
                            Registrar Control
                        </button>
                    </div>
                </section>

                {/* ── 4. Estadísticas ── */}
                <Graficos pacientes={pacientes} />

                {/* ── 5. Filtros ── */}
                <Filtros
                    pacientes={pacientes}
                    filtros={filtros}
                    onFiltrosChange={setFiltros}
                />

                {/* ── 6. Pacientes Citados ── */}
                <section aria-label="Pacientes citados hoy">
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
                        {/* Section header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-600 text-white p-2.5 rounded-xl">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                        Pacientes Citados Hoy
                                    </h2>
                                    {!cargando && (
                                        <p className="text-sm text-slate-400 font-medium mt-0.5">
                                            {pacientesFiltrados.length} de {stats.citadosHoy}{' '}
                                            {pacientesFiltrados.length === 1 ? 'paciente mostrado' : 'pacientes mostrados'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!cargando && pacientesFiltrados.length > 0 && (
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-4 py-1.5 rounded-full self-start sm:self-auto">
                                    {pacientesFiltrados.length} resultados
                                </span>
                            )}
                        </div>

                        {/* States */}
                        {cargando ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-slate-100 rounded-2xl h-64 animate-pulse" />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <AlertCircle size={48} className="text-red-300 mb-4" />
                                <p className="text-slate-600 font-semibold">{error}</p>
                            </div>
                        ) : pacientesFiltrados.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Clock size={56} className="text-slate-200 mb-5" />
                                <p className="text-slate-500 font-medium text-lg">
                                    {filtros.busqueda || filtros.comuna || filtros.prevision || filtros.riesgo !== 'todos'
                                        ? 'No se encontraron pacientes con los filtros aplicados'
                                        : 'No hay pacientes citados para hoy'}
                                </p>
                                <p className="text-slate-400 text-sm mt-1">
                                    {filtros.busqueda || filtros.comuna || filtros.prevision || filtros.riesgo !== 'todos'
                                        ? 'Intenta cambiar los criterios de búsqueda'
                                        : 'Las citas aparecerán aquí una vez registradas'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pacientesFiltrados.map(p => (
                                    <PacienteCitado
                                        key={p.id_paciente}
                                        paciente={p}
                                        onVerDetalle={handleVerDetalle}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
}

