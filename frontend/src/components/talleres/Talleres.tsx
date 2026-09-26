import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, CalendarDays, Search, Filter, GraduationCap } from "lucide-react";
import { API_BASE_URL } from "../../service/api";
import { normalizarTexto } from "../../utils/formatters";









interface Taller {

    id_taller: number;
    nombre: string;
    descripcion: string;
    edad_min: number;
    edad_max: number;
    activo: boolean;
    creado_en: string;
    sesionesCount: number;

}


export default function Talleres() {

    const navigate = useNavigate();
    const [talleres, setTalleres] = useState<Taller[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos");



    useEffect(() => {

        const obtenerTalleres = async () => {

            setCargando(true);
            setError("");

            try {
                const token = localStorage.getItem("token");

                const respuesta = await fetch(`${API_BASE_URL}/talleres`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!respuesta.ok) throw new Error("No se pudo obtener la lista de talleres");

                const data: Taller[] = await respuesta.json();
                setTalleres(data);

            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido ");
            } finally {
                setCargando(false);
            }


        }

        obtenerTalleres();

    }, []);

    const talleresFiltrados = talleres.filter((taller) => {
        const coincideBusqueda = normalizarTexto(taller.nombre).includes(normalizarTexto(busqueda));
        const coincideEstado =
            filtroEstado === "todos" ||
            (filtroEstado === "activos" && taller.activo) ||
            (filtroEstado === "inactivos" && !taller.activo);

        return coincideBusqueda && coincideEstado;
    });


    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-300">
            <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                <div className="flex flex-col sm:flex-row w-full md:w-2/3 gap-3">
                    <div className="relative w-full sm:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar taller..."
                            className="bg-white border border-slate-400 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full pl-10 p-2.5 outline-none transition-all shadow-sm"
                        />
                    </div>

                    <div className="relative w-full sm:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Filter className="h-5 w-5 text-slate-500" />
                        </div>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value as "todos" | "activos" | "inactivos")}
                            className="bg-white border border-slate-400 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full pl-10 p-2.5 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activos">Activos</option>
                            <option value="inactivos">Inactivos</option>
                        </select>
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 flex-shrink-0">
                    <div className="flex items-center justify-center bg-blue-700 text-white font-bold rounded-lg text-sm px-4 py-2.5 shadow-sm whitespace-nowrap">
                        Total: {talleres.length}
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/talleres/nuevo")}
                        className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Nuevo taller
                    </button>
                </div>
            </div>

            {cargando && (
                <div className="flex justify-center items-center p-12 text-blue-700">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-3 font-semibold text-lg">Cargando...</span>
                </div>
            )}

            {error && !cargando && (
                <div className="p-8 text-center text-red-600 font-bold text-lg">{error}</div>
            )}

            {!cargando && !error && talleres.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-semibold">
                    No hay talleres registrados todavía.
                </div>
            )}

            {!cargando && !error && talleres.length > 0 && talleresFiltrados.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-semibold">
                    Ningún taller coincide con la búsqueda.
                </div>
            )}

            {!cargando && !error && talleresFiltrados.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {talleresFiltrados.map((taller) => (
                        <button
                            key={taller.id_taller}
                            type="button"
                            onClick={() => navigate(`/talleres/${taller.id_taller}`)}
                            className="text-left flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                        <GraduationCap className="h-4.5 w-4.5" />
                                    </div>
                                    <h2 className="font-bold text-slate-800 truncate">{taller.nombre}</h2>
                                </div>
                                <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${taller.activo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                                        }`}
                                >
                                    {taller.activo ? "Activo" : "Inactivo"}
                                </span>
                            </div>

                            <p className="text-sm text-slate-600 font-medium leading-snug line-clamp-2 min-h-[2.5rem]">
                                {taller.descripcion || "Sin descripción"}
                            </p>

                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                    {taller.edad_min}–{taller.edad_max} años
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {taller.sesionesCount ?? 0} sesiones
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}







