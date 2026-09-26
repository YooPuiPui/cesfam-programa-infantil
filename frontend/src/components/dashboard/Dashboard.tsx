import { useEffect, useState } from "react";
import { Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, Users, AlertTriangle, CalendarClock } from "lucide-react";
import { API_BASE_URL } from '../../service/api';











type ConteosPacientes = {
    total: number;
    sename: number;
    naneas: number;
    trans: number;
    migrante: number;
    regular: number;
};

type ConteosAgenda = {
    hoy: number;
    atrasados: number;
    semana: number;
    mes: number;
    todos: number;
};

type ItemGrafico = {
    name: string;
    value: number;
};

type Caracterizacion = {
    edad: ItemGrafico[];
    estado: ItemGrafico[];
    diagnosticos: ItemGrafico[];
    credencial_discapacidad: ItemGrafico[];
    cuidador: ItemGrafico[];
};

const COLORES_RIESGO = {
    regular: "#475569",   // slate oscuro, en vez del gris pálido
    sename: "#dc2626",    // rojo más saturado
    naneas: "#ea580c",    // naranja más intenso
    trans: "#9333ea",     // púrpura más vivo
    migrante: "#2563eb",  // azul más fuerte
};

const COLOR_CARACTERIZACION = "#1d4ed8";

const CHART_TICK_STYLE = { fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, fill: "#0f172a" };

const BAR_SIZE_MAX = 110;

export default function Dashboard() {
    const [conteosPacientes, setConteosPacientes] = useState<ConteosPacientes | null>(null);
    const [conteosAgenda, setConteosAgenda] = useState<ConteosAgenda | null>(null);
    const [caracterizacion, setCaracterizacion] = useState<Caracterizacion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const cargarDatos = async () => {
            setCargando(true);
            setError("");
            try {
                const token = localStorage.getItem("token");
                const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

                const [resPacientes, resAgenda, resCaracterizacion] = await Promise.all([
                    fetch(`${API_BASE_URL}/pacientes/estadisticas/riesgo`, { headers }),
                    fetch(`${API_BASE_URL}/control/agenda/conteos`, { headers }),
                    fetch(`${API_BASE_URL}/pacientes/estadisticas/caracterizacion`, { headers }),
                ]);

                if (!resPacientes.ok || !resAgenda.ok || !resCaracterizacion.ok) {
                    throw new Error("No se pudieron cargar las estadísticas del dashboard.");
                }

                const dataPacientes: ConteosPacientes = await resPacientes.json();
                const dataAgenda: ConteosAgenda = await resAgenda.json();
                const dataCaracterizacion: Caracterizacion = await resCaracterizacion.json();

                setConteosPacientes(dataPacientes);
                setConteosAgenda(dataAgenda);
                setCaracterizacion(dataCaracterizacion);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al cargar el dashboard.");
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    if (cargando) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-700">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-lg font-bold">Cargando dashboard...</span>
                </div>
            </div>
        );
    }

    if (error || !conteosPacientes || !conteosAgenda || !caracterizacion) {
        return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700">{error || "No hay datos disponibles."}</div>;
    }

    const datosRiesgo = [
        { name: "Población Regular", value: conteosPacientes.regular, color: COLORES_RIESGO.regular },
        { name: "SENAME", value: conteosPacientes.sename, color: COLORES_RIESGO.sename },
        { name: "Prematuro/NANEAS", value: conteosPacientes.naneas, color: COLORES_RIESGO.naneas },
        { name: "Población Trans", value: conteosPacientes.trans, color: COLORES_RIESGO.trans },
        { name: "Migrante", value: conteosPacientes.migrante, color: COLORES_RIESGO.migrante },
    ].filter((d) => d.value > 0);

    const datosAgenda = [
        { name: "Hoy", value: conteosAgenda.hoy },
        { name: "Atrasados", value: conteosAgenda.atrasados },
        { name: "Esta semana", value: conteosAgenda.semana },
        { name: "Este mes", value: conteosAgenda.mes },
    ];

    // Diagnósticos: separar categorías con ≥2 pacientes (gráfico) de las con exactamente 1 (lista)
    const diagnosticosOrdenados = [...caracterizacion.diagnosticos].sort((a, b) => b.value - a.value);
    const diagnosticosMulti = diagnosticosOrdenados.filter(d => d.value >= 2);
    const diagnosticosSingle = diagnosticosOrdenados
        .filter(d => d.value === 1)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    return (
        <div className="space-y-6">
            {/* TARJETAS RESUMEN */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Total pacientes</p>
                            <p className="text-2xl font-black text-slate-900">{conteosPacientes.total}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-red-100 p-3 text-red-700">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Controles atrasados</p>
                            <p className="text-2xl font-black text-slate-900">{conteosAgenda.atrasados}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-100 p-3 text-emerald-700">
                            <CalendarClock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Controles este mes</p>
                            <p className="text-2xl font-black text-slate-900">{conteosAgenda.mes}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRÁFICOS */}
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-slate-900">Distribución por Riesgo Social</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={datosRiesgo}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={CHART_TICK_STYLE} />
                            <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} />
                            <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif" }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={BAR_SIZE_MAX}>
                                {datosRiesgo.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-slate-900">Agenda de Controles</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={datosAgenda}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={CHART_TICK_STYLE} />
                            <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} />
                            <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif" }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={BAR_SIZE_MAX}>
                                {datosAgenda.map((entry, index) => (
                                    <Cell key={index} fill={entry.name === "Atrasados" ? "#dc2626" : "#1d4ed8"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CARACTERIZACIÓN DE LA POBLACIÓN */}
            <div>
                <h2 className="mb-4 text-lg font-bold text-slate-900">Caracterización de la Población</h2>
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Edad</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={caracterizacion.edad}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={CHART_TICK_STYLE} />
                                <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} />
                                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif" }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={COLOR_CARACTERIZACION} maxBarSize={BAR_SIZE_MAX} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Estado</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={caracterizacion.estado}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={CHART_TICK_STYLE} />
                                <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} />
                                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif" }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={COLOR_CARACTERIZACION} maxBarSize={BAR_SIZE_MAX} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Credencial de Discapacidad</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={caracterizacion.credencial_discapacidad}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={CHART_TICK_STYLE} />
                                <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} />
                                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif" }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={COLOR_CARACTERIZACION} maxBarSize={BAR_SIZE_MAX} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Cuidador</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={caracterizacion.cuidador}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={CHART_TICK_STYLE} />
                                <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} />
                                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif" }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={COLOR_CARACTERIZACION} maxBarSize={BAR_SIZE_MAX} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Diagnósticos</h3>
                        <p className="mb-4 text-sm text-slate-400">{diagnosticosMulti.length} categorías con 2 o más pacientes</p>
                        <ResponsiveContainer width="100%" height={Math.max(320, diagnosticosMulti.length * 40)}>
                            <BarChart data={diagnosticosMulti} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={CHART_TICK_STYLE} />
                                <YAxis type="category" dataKey="name" width={200} tick={CHART_TICK_STYLE} interval={0} />
                                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif" }} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={COLOR_CARACTERIZACION} />
                            </BarChart>
                        </ResponsiveContainer>

                        <div className="mt-5 border-t border-slate-100 pt-4">
                            <p className="mb-2.5 text-sm font-semibold text-slate-800">
                                {diagnosticosSingle.length} categorías con 1 paciente 
                            </p>
                            <div className="grid grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                                {diagnosticosSingle.map((d, i) => (
                                    <p key={i} className="truncate text-sm text-slate-800" title={d.name}>
                                        {d.name}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}