import { useState, useEffect } from "react";
import { Search, TrendingUp, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Filter, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../../service/api';

interface ReportePaciente {
    rut: string;
    nombre: string;
    edad_meses: number | null;
    ultimo_control: string | null;
    totalControles: number;
    tasaPesoKgMes: number | null;
    tasaTallaCmMes: number | null;
    alerta: string | null;
}

type FiltroReporte = "todos" | "alerta" | "con_datos" | "sin_datos";

const OPCIONES_FILTRO: { value: FiltroReporte; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "alerta", label: "Con alerta" },
    { value: "con_datos", label: "Con datos suficientes" },
    { value: "sin_datos", label: "Datos insuficientes" },
];

const formatearFechaCorta = (fechaIso: string | null) => {
    if (!fechaIso) return "Sin controles";
    return new Date(fechaIso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const renderTasa = (valor: number | null, unidad: string) => {
    if (valor === null) return <span className="text-slate-400 font-medium">Datos insuficientes</span>;
    const signo = valor > 0 ? '+' : '';
    return <span className="font-bold text-slate-800">{signo}{valor} {unidad}</span>;
};

const renderAlerta = (alerta: string | null) => {
    if (!alerta) {
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">Sin alerta</span>;
    }
    return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-900 border border-orange-300 w-fit">
            <AlertTriangle className="h-3.5 w-3.5" />
            {alerta}
        </span>
    );
};

export default function ReportesList() {
    const navigate = useNavigate();
    const [busqueda, setBusqueda] = useState("");
    const [busquedaDebounced, setBusquedaDebounced] = useState("");
    const [reportes, setReportes] = useState<ReportePaciente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filtro, setFiltro] = useState<FiltroReporte>("todos");

    useEffect(() => {
        const timeout = setTimeout(() => setBusquedaDebounced(busqueda.trim()), 400);
        return () => clearTimeout(timeout);
    }, [busqueda]);

    useEffect(() => {
        setPage(1);
    }, [filtro, busquedaDebounced]);

    useEffect(() => {
        const obtenerReportes = async () => {
            setCargando(true);
            try {
                const token = localStorage.getItem("token");

                const params = new URLSearchParams({ page: String(page), limit: "30" });
                if (filtro !== "todos") params.set("filtro", filtro);
                if (busquedaDebounced !== "") params.set("busqueda", busquedaDebounced);

                const respuesta = await fetch(`${API_BASE_URL}/reportes?${params.toString()}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!respuesta.ok) throw new Error("Error al obtener los reportes");

                const respuestaJson = await respuesta.json();
                setReportes(respuestaJson.data);
                setTotalPages(respuestaJson.meta.totalPages);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };

        obtenerReportes();
    }, [page, filtro, busquedaDebounced]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-300">
            <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                <div className="flex flex-col sm:flex-row w-full md:w-2/3 gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>

                    <div className="relative w-full sm:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-slate-400 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full pl-10 p-2.5 outline-none transition-all shadow-sm"
                            placeholder="Buscar por RUT o nombre..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    <div className="relative w-full sm:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Filter className="h-5 w-5 text-slate-500" />
                        </div>
                        <select
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value as FiltroReporte)}
                            className="bg-white border border-slate-400 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full pl-10 p-2.5 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            {OPCIONES_FILTRO.map((opcion) => (
                                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {cargando && <div className="flex justify-center items-center p-12 text-blue-700"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-3 font-semibold text-lg">Cargando reportes...</span></div>}
            {error && !cargando && <div className="p-8 text-center text-red-600 font-bold text-lg">{error}</div>}

            {!cargando && !error && (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-800">
                            <thead className="text-xs text-slate-900 uppercase bg-slate-300 border-b border-slate-300 font-bold">
                                <tr>
                                    <th className="px-5 py-4">RUT</th>
                                    <th className="px-5 py-4">Nombre del Paciente</th>
                                    <th className="px-5 py-4">Último Control</th>
                                    <th className="px-5 py-4">Variación Peso</th>
                                    <th className="px-5 py-4">Variación Talla</th>
                                    <th className="px-5 py-4">Alerta</th>
                                    <th className="px-5 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportes.map((r) => (
                                    <tr key={r.rut} className="border-b border-slate-200 hover:bg-blue-50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-slate-900">{r.rut}</td>
                                        <td className="px-5 py-3 font-medium text-slate-900 capitalize">{r.nombre.toLowerCase()}</td>
                                        <td className="px-5 py-3 text-slate-700 font-semibold">{formatearFechaCorta(r.ultimo_control)}</td>
                                        <td className="px-5 py-3">{renderTasa(r.tasaPesoKgMes, 'kg/mes')}</td>
                                        <td className="px-5 py-3">{renderTasa(r.tasaTallaCmMes, 'cm/mes')}</td>
                                        <td className="px-5 py-3">{renderAlerta(r.alerta)}</td>
                                        <td className="px-5 py-3 flex items-center justify-end">
                                            <button
                                                onClick={() => navigate(`/reportes/${r.rut}`)}
                                                className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 transition-colors shadow-sm"
                                            >
                                                <TrendingUp className="h-4 w-4" /> Ver Evolución
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {reportes.length === 0 && (
                        <div className="p-8 text-center text-slate-500 font-semibold">
                            No se encontraron pacientes con los filtros aplicados.
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                        <span className="text-sm font-medium text-slate-600">Página {page} de {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                            >
                                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}