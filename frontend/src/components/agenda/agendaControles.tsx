import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CalendarDays, ArrowRight, ArrowLeft, SearchX, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ControlClinico, Paciente } from "../../types";
import { API_BASE_URL } from '../../service/api';

type ControlAgenda = ControlClinico & {
    paciente?: Pick<Paciente, "rut" | "nombre" | "apellido">;
};

type FiltroAgenda = "hoy" | "atrasados" | "semana" | "mes" | "todos";

type Conteos = {
    hoy: number;
    atrasados: number;
    semana: number;
    mes: number;
    todos: number;
};

const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return "Sin fecha";
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) return "Sin fecha";
    return parsed.toLocaleDateString("es-CL", { timeZone: "UTC" });
};

const hoyMedianoche = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy;
};

const inicioSemana = (referencia: Date) => {
    const fecha = new Date(referencia);
    const dia = fecha.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;
    fecha.setDate(fecha.getDate() + diff);
    fecha.setHours(0, 0, 0, 0);
    return fecha;
};

const finSemana = (referencia: Date) => {
    const inicio = inicioSemana(referencia);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
    return fin;
};

const formatearFechaCorta = (fecha: Date) =>
    fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" });

const obtenerClaveFechaCalendario = (fecha: string | Date) => {
    if (typeof fecha === "string") {
        return fecha.slice(0, 10);
    }

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const convertirClaveFechaACodeDias = (claveFecha: string) => {
    const [year, month, day] = claveFecha.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
};

const MESES_LARGO = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const FILTROS: { key: FiltroAgenda; label: string }[] = [
    { key: "hoy", label: "Hoy" },
    { key: "atrasados", label: "Atrasados" },
    { key: "semana", label: "Esta semana" },
    { key: "mes", label: "Este mes" },
    { key: "todos", label: "Todos" },
];

const LIMITE_POR_PAGINA = 30;

export default function AgendaControles() {
    const navigate = useNavigate();
    const [controles, setControles] = useState<ControlAgenda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [filtro, setFiltro] = useState<FiltroAgenda>("semana");

    const [conteos, setConteos] = useState<Conteos>({ hoy: 0, atrasados: 0, semana: 0, mes: 0, todos: 0 });
    const [cargandoConteos, setCargandoConteos] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    // Carga los conteos globales una sola vez (independiente de la paginación/filtro)
    useEffect(() => {
        const cargarConteos = async () => {
            setCargandoConteos(true);
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/control/agenda/conteos`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("No se pudieron cargar los conteos de la agenda.");

                const data: Conteos = await response.json();
                setConteos(data);
            } catch (err) {
                console.error("Error al cargar conteos de agenda:", err);
            } finally {
                setCargandoConteos(false);
            }
        };

        cargarConteos();
    }, []);

    // Vuelve a página 1 cada vez que cambia el filtro
    useEffect(() => {
        setPage(1);
    }, [filtro]);

    // Carga los controles paginados según filtro + página actual
    useEffect(() => {
        const cargarAgenda = async () => {
            setCargando(true);
            setError("");

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${API_BASE_URL}/control/agenda/paginado?page=${page}&limit=${LIMITE_POR_PAGINA}&filtro=${filtro}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("No se pudo cargar la agenda de controles.");
                }

                const respuestaJson = await response.json();

                setControles(respuestaJson.data);
                setTotalPages(respuestaJson.meta.totalPages);
                setTotalRegistros(respuestaJson.meta.total);
            } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo cargar la agenda de controles.");
            } finally {
                setCargando(false);
            }
        };

        cargarAgenda();
    }, [filtro, page]);

    // Solo se calcula esAtrasado/diasAtraso sobre la página actual (ya viene filtrada del backend)
    const controlesConCategoria = useMemo(() => {
        const hoy = hoyMedianoche();
        const claveHoy = obtenerClaveFechaCalendario(hoy);
        const fechaHoyCalendario = convertirClaveFechaACodeDias(claveHoy);
        const inicioSemanaCalendario = convertirClaveFechaACodeDias(obtenerClaveFechaCalendario(inicioSemana(hoy)));
        const finSemanaCalendario = convertirClaveFechaACodeDias(obtenerClaveFechaCalendario(finSemana(hoy)));
        const inicioMesCalendario = convertirClaveFechaACodeDias(obtenerClaveFechaCalendario(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
        const finMesCalendario = convertirClaveFechaACodeDias(obtenerClaveFechaCalendario(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)));

        return controles
            .filter((control) => !!control.fecha_proximoControl)
            .filter((control) => {
                const claveFecha = obtenerClaveFechaCalendario(control.fecha_proximoControl as string);
                const fechaCalendario = convertirClaveFechaACodeDias(claveFecha);

                switch (filtro) {
                    case "hoy":
                        return fechaCalendario === fechaHoyCalendario;
                    case "atrasados":
                        return fechaCalendario < fechaHoyCalendario;
                    case "semana":
                        return fechaCalendario >= inicioSemanaCalendario && fechaCalendario <= finSemanaCalendario;
                    case "mes":
                        return fechaCalendario >= inicioMesCalendario && fechaCalendario <= finMesCalendario;
                    case "todos":
                    default:
                        return true;
                }
            })
            .map((control) => {
                const claveFecha = obtenerClaveFechaCalendario(control.fecha_proximoControl as string);
                const fechaCalendario = convertirClaveFechaACodeDias(claveFecha);
                const esAtrasado = fechaCalendario < fechaHoyCalendario;
                const diasAtraso = esAtrasado
                    ? Math.floor((fechaHoyCalendario - fechaCalendario) / (1000 * 60 * 60 * 24))
                    : 0;

                return { ...control, _fecha: new Date(fechaCalendario), esAtrasado, diasAtraso };
            });
    }, [controles, filtro]);

    const subtitulo = useMemo(() => {
        const hoy = hoyMedianoche();

        switch (filtro) {
            case "hoy":
                return `Controles programados para hoy, ${formatearFechaCorta(hoy)}.`;
            case "atrasados":
                return "Controles cuya fecha programada ya pasó.";
            case "semana": {
                const inicio = inicioSemana(hoy);
                const fin = finSemana(hoy);
                return `Semana del ${formatearFechaCorta(inicio)} al ${formatearFechaCorta(fin)}.`;
            }
            case "mes": {
                const nombreMes = MESES_LARGO[hoy.getMonth()];
                return `Controles de ${nombreMes} de ${hoy.getFullYear()}.`;
            }
            case "todos":
            default:
                return "Todos los controles clínicos programados.";
        }
    }, [filtro]);

    if (error) {
        return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:flex-row md:items-center md:justify-between">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Controles agendados</h1>
                    <p className="mt-1 text-sm font-bold text-slate-900">{subtitulo}</p>
                </div>
                {/*
                <div className="rounded-2xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-bold text-slate-100">
                    Mostrando: {totalRegistros}
                </div>
                */}
            </div>

            {/* Chips de filtro */}
            <div className="flex flex-wrap gap-2">
                {FILTROS.map(({ key, label }) => {
                    const activo = filtro === key;
                    const conteo = conteos[key];
                    const esAtrasadosConPendientes = key === "atrasados" && conteo > 0;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFiltro(key)}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${activo
                                ? esAtrasadosConPendientes
                                    ? "border-red-600 bg-red-600 text-white"
                                    : "border-blue-600 bg-blue-600 text-white"
                                : esAtrasadosConPendientes
                                    ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                                }`}
                        >
                            {key === "atrasados" && esAtrasadosConPendientes && <AlertTriangle className="h-4 w-4" />}
                            {label}
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${activo ? "bg-white/20" : "bg-slate-100"
                                    }`}
                            >
                                {cargandoConteos ? "…" : conteo}
                            </span>
                        </button>
                    );
                })}
            </div>

            {cargando ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 text-slate-900">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-lg font-bold">Cargando agenda...</span>
                    </div>
                </div>
            ) : controlesConCategoria.length === 0 ? (
                filtro === "atrasados" ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-green-300 bg-green-50/40 px-6 text-center shadow-sm">
                        <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">¡Sin controles atrasados!</h2>
                        <p className="mt-2 max-w-lg text-sm font-bold text-slate-900">
                            Estás al día. Ningún paciente tiene un control clínico pendiente vencido.
                        </p>
                    </div>
                ) : filtro === "hoy" ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 px-6 text-center shadow-sm">
                        <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-600">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Sin controles para hoy</h2>
                        <p className="mt-2 max-w-lg text-sm font-bold text-slate-900">
                            No hay pacientes agendados para el día de hoy.
                        </p>
                    </div>
                ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
                        <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-900">
                            <SearchX className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">No hay controles en esta categoría</h2>
                        <p className="mt-2 max-w-lg text-sm font-bold text-slate-900">
                            Prueba con otro filtro, o revisa "Todos" para ver la agenda completa.
                        </p>
                    </div>
                )
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-300 text-xs uppercase tracking-wider text-slate-900">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Paciente</th>
                                    <th className="px-6 py-4 font-bold">RUT</th>
                                    <th className="px-6 py-4 font-bold">Fecha próximo control</th>
                                    <th className="px-6 py-4 text-right font-bold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {controlesConCategoria.map((control) => {
                                    const rutPaciente = control.paciente?.rut || control.rut_paciente;
                                    const nombrePaciente = control.paciente
                                        ? `${control.paciente.nombre} ${control.paciente.apellido}`
                                        : control.rut_paciente;

                                    return (
                                        <tr
                                            key={control.id_control}
                                            className={`transition-colors ${control.esAtrasado ? "bg-red-100/80" : "hover:bg-blue-50/60"
                                                }`}
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-900">{nombrePaciente}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">{rutPaciente}</td>
                                            <td
                                                className={`px-6 py-4 font-bold ${control.esAtrasado ? "text-red-700" : "text-slate-900"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {control.esAtrasado ? (
                                                        <AlertTriangle className="h-4 w-4" />
                                                    ) : (
                                                        <CalendarDays className="h-4 w-4" />
                                                    )}
                                                    {formatearFecha(control.fecha_proximoControl)}
                                                    {control.esAtrasado && (
                                                        <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                                                            Atrasado hace {control.diasAtraso} día{control.diasAtraso === 1 ? '' : 's'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/ficha/${rutPaciente}`)}
                                                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-100 hover:text-blue-700"
                                                >
                                                    Ir a ficha
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4">
                        <span className="text-sm font-medium text-slate-600">Página {page} de {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}