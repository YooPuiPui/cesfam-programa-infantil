import { useState, useEffect } from "react";
import { Search, Plus, FolderOpen, Loader2, ChevronLeft, ChevronRight, Filter, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../../service/api';

interface Paciente {
    id_paciente: number;
    rut: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    es_sename: boolean;
    es_naneas_prematuro: boolean;
    es_poblacion_trans: boolean;
    es_migrante: boolean;
}

type FiltroRiesgo = "todos" | "sename" | "naneas" | "trans" | "migrante" | "regular";

const OPCIONES_RIESGO: { value: FiltroRiesgo; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "regular", label: "Población Regular" },
    { value: "sename", label: "SENAME" },
    { value: "naneas", label: "Prematuro/NANEAS" },
    { value: "trans", label: "Población Trans" },
    { value: "migrante", label: "Migrante" },
];

const calcularEdadPediatrica = (fechaIso: string) => {
    if (!fechaIso) return "N/A";
    const nacimiento = new Date(fechaIso);
    const hoy = new Date();
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) { anios--; meses += 12; }
    if (anios === 0 && meses === 0) return "Recién nacido";
    if (anios === 0) return `${meses} mes${meses > 1 ? 'es' : ''}`;
    if (meses === 0) return `${anios} año${anios > 1 ? 's' : ''}`;
    return `${anios} año${anios > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
};

const renderRiesgoSocial = (paciente: Paciente) => {
    const riesgos = [];
    if (paciente.es_sename) riesgos.push({ label: "SENAME", color: "bg-red-100 text-red-900 border-red-300" });
    if (paciente.es_naneas_prematuro) riesgos.push({ label: "Prematuro/NANEAS", color: "bg-orange-100 text-orange-900 border-orange-300" });
    if (paciente.es_poblacion_trans) riesgos.push({ label: "Trans", color: "bg-purple-100 text-purple-900 border-purple-300" });
    if (paciente.es_migrante) riesgos.push({ label: "Migrante", color: "bg-blue-100 text-blue-900 border-blue-300" });

    if (riesgos.length === 0) return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">Población Regular</span>;

    return (
        <div className="flex flex-wrap gap-1.5">
            {riesgos.map((riesgo, index) => (
                <span key={index} className={`px-2.5 py-1 text-xs font-bold rounded-full border ${riesgo.color}`}>
                    {riesgo.label}
                </span>
            ))}
        </div>
    );
};

export default function PatientList() {
    const navigate = useNavigate();
    const [busqueda, setBusqueda] = useState("");
    const [busquedaDebounced, setBusquedaDebounced] = useState("");
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [riesgo, setRiesgo] = useState<FiltroRiesgo>("todos");

    // Debounce: espera 400ms de silencio antes de aplicar la búsqueda real
    useEffect(() => {
        const timeout = setTimeout(() => {
            setBusquedaDebounced(busqueda.trim());
        }, 400);
        return () => clearTimeout(timeout);
    }, [busqueda]);

    // Cualquier cambio de filtro (riesgo o búsqueda) vuelve a página 1
    useEffect(() => {
        setPage(1);
    }, [riesgo, busquedaDebounced]);

    useEffect(() => {
        const obtenerPacientes = async () => {
            setCargando(true);
            try {
                const token = localStorage.getItem("token");

                const params = new URLSearchParams({
                    page: String(page),
                    limit: "30",
                });
                if (riesgo !== "todos") params.set("riesgo", riesgo);
                const pareceRut = /\d/.test(busquedaDebounced);
                if (busquedaDebounced !== "" && pareceRut) params.set("busqueda", busquedaDebounced);

                const respuesta = await fetch(`${API_BASE_URL}/pacientes?${params.toString()}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!respuesta.ok) throw new Error("Error al obtener los datos");

                const respuestaJson = await respuesta.json();

                setPacientes(respuestaJson.data);
                setTotalPages(respuestaJson.meta.totalPages);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };

        obtenerPacientes();
    }, [page, riesgo, busquedaDebounced]);

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
                            placeholder="Buscar paciente por RUT..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    <div className="relative w-full sm:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Filter className="h-5 w-5 text-slate-500" />
                        </div>
                        <select
                            value={riesgo}
                            onChange={(e) => setRiesgo(e.target.value as FiltroRiesgo)}
                            className="bg-white border border-slate-400 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full pl-10 p-2.5 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            {OPCIONES_RIESGO.map((opcion) => (
                                <option key={opcion.value} value={opcion.value}>
                                    {opcion.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center justify-end flex-shrink-0">
                    <button type="button" onClick={() => navigate("/inscribir-paciente")} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm">
                        <Plus className="h-5 w-5 mr-2" />
                        Inscribir Paciente
                    </button>
                </div>
            </div>

            {cargando && <div className="flex justify-center items-center p-12 text-blue-700"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-3 font-semibold text-lg">Cargando...</span></div>}
            {error && !cargando && <div className="p-8 text-center text-red-600 font-bold text-lg">{error}</div>}

            {!cargando && !error && (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-800">
                            <thead className="text-xs text-slate-900 uppercase bg-slate-300 border-b border-slate-300 font-bold">
                                <tr>
                                    <th className="px-5 py-4">RUT</th>
                                    <th className="px-5 py-4">Nombre del Paciente</th>
                                    <th className="px-5 py-4">Edad</th>
                                    <th className="px-5 py-4">Riesgo Social / Condición</th>
                                    <th className="px-5 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pacientes.map((paciente) => (
                                    <tr key={paciente.id_paciente} className="border-b border-slate-200 hover:bg-blue-50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-slate-900">{paciente.rut}</td>
                                        <td className="px-5 py-3 font-medium text-slate-900 capitalize">{paciente.nombre.toLowerCase()} {paciente.apellido.toLowerCase()}</td>
                                        <td className="px-5 py-3 text-blue-800 font-semibold">{calcularEdadPediatrica(paciente.fecha_nacimiento)}</td>
                                        <td className="px-5 py-3">{renderRiesgoSocial(paciente)}</td>
                                        <td className="px-5 py-3 flex items-center justify-end">
                                            <button
                                                onClick={() => navigate(`/ficha/${paciente.rut}`)}
                                                className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 transition-colors shadow-sm"
                                            >
                                                <FolderOpen className="h-4 w-4" /> Ver Ficha
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pacientes.length === 0 && (
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