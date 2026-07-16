import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

const COLORES_RIESGO = {
    regular: "#475569",   // slate oscuro, en vez del gris pálido
    sename: "#dc2626",    // rojo más saturado
    naneas: "#ea580c",    // naranja más intenso
    trans: "#9333ea",     // púrpura más vivo
    migrante: "#2563eb",  // azul más fuerte
};

export default function Dashboard() {
    const [conteosPacientes, setConteosPacientes] = useState<ConteosPacientes | null>(null);
    const [conteosAgenda, setConteosAgenda] = useState<ConteosAgenda | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const renderRiesgoLabel = ({ cx, cy, midAngle, outerRadius, name, value }: any) => {
        const RADIAN = Math.PI / 180;
        const labelRadius = outerRadius + 42;
        const lineStartRadius = outerRadius + 10;
        const lineEndRadius = outerRadius + 30;
        const sin = Math.sin(-midAngle * RADIAN);
        const cos = Math.cos(-midAngle * RADIAN);

        const sx = cx + lineStartRadius * cos;
        const sy = cy + lineStartRadius * sin;
        const mx = cx + lineEndRadius * cos;
        const my = cy + lineEndRadius * sin;
        const ex = cx + labelRadius * cos;
        const ey = cy + labelRadius * sin;
        const textAnchor = cos >= 0 ? "start" : "end";
        const dx = cos >= 0 ? 6 : -6;

        return (
            <g>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#94a3b8" fill="none" />
                <text x={ex + dx} y={ey} fill="#334155" textAnchor={textAnchor} dominantBaseline="central" fontSize={12}>
                    {`${name}: ${value}`}
                </text>
            </g>
        );
    };

    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            setError("");
            try {
                const token = localStorage.getItem("token");
                const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

                const [resPacientes, resAgenda] = await Promise.all([
                    fetch(`${API_BASE_URL}/pacientes/estadisticas/riesgo`, { headers }),
                    fetch(`${API_BASE_URL}/control/agenda/conteos`, { headers }),
                ]);

                if (!resPacientes.ok || !resAgenda.ok) {
                    throw new Error("No se pudieron cargar las estadísticas del dashboard.");
                }

                const dataPacientes: ConteosPacientes = await resPacientes.json();
                const dataAgenda: ConteosAgenda = await resAgenda.json();

                setConteosPacientes(dataPacientes);
                setConteosAgenda(dataAgenda);
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

    if (error || !conteosPacientes || !conteosAgenda) {
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
                <div className="rounded-2x1 border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-7 text-lg font-bold text-slate-900">Distribución por Riesgo Social</h2>
                    <ResponsiveContainer width="100%" height={340}>
                        <PieChart margin={{ top: 8, right: 12, bottom: 44, left: 12 }}>
                            <Pie
                                data={datosRiesgo}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="48%"
                                outerRadius={92}
                                paddingAngle={2}
                                labelLine={false}
                                label={renderRiesgoLabel}
                            >
                                {datosRiesgo.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ paddingTop: 24 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-slate-800">Agenda de Controles</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={datosAgenda}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {datosAgenda.map((entry, index) => (
                                    <Cell key={index} fill={entry.name === "Atrasados" ? "#dc2626" : "#1d4ed8"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}