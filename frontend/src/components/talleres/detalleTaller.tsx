import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UserRound, GraduationCap, ChevronDown, Search, X, UserPlus } from "lucide-react";
import { API_BASE_URL } from '../../service/api';
import { formatearFecha } from '../../utils/formatters';

interface SesionTaller {
    id_sesion: number;
    fecha: string;
    cupo_maximo: number | null;
    rut_profesional: string | null;
    profesional_externo: string | null;
    observaciones: string | null;
}

interface TallerConSesiones {
    id_taller: number;
    nombre: string;
    descripcion: string | null;
    edad_min: number;
    edad_max: number;
    activo: boolean;
    sesiones: SesionTaller[];
}

type EstadoAsistencia = "pendiente" | "asiste" | "no_asiste";

interface Inscripcion {
    id_inscripcion: number;
    rut_paciente: string;
    estado_asistencia: EstadoAsistencia;
    paciente: {
        nombre: string;
        apellido: string;
    };
}

interface PacienteBusqueda {
    rut: string;
    nombre: string;
    apellido: string;
}

// rut_profesional y profesional_externo son mutuamente excluyentes (Tema 4)
const responsableSesion = (sesion: SesionTaller): string => {
    if (sesion.rut_profesional) return sesion.rut_profesional;
    if (sesion.profesional_externo) return sesion.profesional_externo;
    return "Sin asignar";
};

const estilosAsistencia: Record<EstadoAsistencia, string> = {
    pendiente: "bg-amber-100 text-amber-800",
    asiste: "bg-green-100 text-green-800",
    no_asiste: "bg-red-100 text-red-700",
};

export default function DetalleTaller() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [taller, setTaller] = useState<TallerConSesiones | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [sesionAbierta, setSesionAbierta] = useState<number | null>(null);
    const [inscripcionesPorSesion, setInscripcionesPorSesion] = useState<Record<number, Inscripcion[]>>({});
    const [cargandoInscripciones, setCargandoInscripciones] = useState(false);
    const [errorInscripcion, setErrorInscripcion] = useState("");

    const [busquedaPaciente, setBusquedaPaciente] = useState("");
    const [resultadosBusqueda, setResultadosBusqueda] = useState<PacienteBusqueda[]>([]);
    const [buscandoPaciente, setBuscandoPaciente] = useState(false);
    const [agregando, setAgregando] = useState(false);

    useEffect(() => {
        const obtenerTaller = async () => {
            setCargando(true);
            setError("");
            try {
                const token = localStorage.getItem("token");

                const respuesta = await fetch(`${API_BASE_URL}/talleres/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!respuesta.ok) throw new Error("No se pudo obtener el taller solicitado");

                // un solo fetch: las sesiones ya vienen incluidas (Tema 4)
                const data: TallerConSesiones = await respuesta.json();
                setTaller(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                setCargando(false);
            }
        };

        obtenerTaller();
    }, [id]); // se re-ejecuta si cambia el id de la URL (Tema 4)

    // busca pacientes por nombre/rut mientras se escribe, solo si hay una sesion desplegada
    useEffect(() => {
        if (!sesionAbierta || busquedaPaciente.trim().length < 2) {
            setResultadosBusqueda([]);
            return;
        }

        const timer = setTimeout(async () => {
            setBuscandoPaciente(true);
            try {
                const token = localStorage.getItem("token");
                const respuesta = await fetch(
                    `${API_BASE_URL}/pacientes?busqueda=${encodeURIComponent(busquedaPaciente.trim())}&limit=5`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!respuesta.ok) throw new Error();

                const data = await respuesta.json();
                setResultadosBusqueda(data.data ?? []);
            } catch {
                setResultadosBusqueda([]);
            } finally {
                setBuscandoPaciente(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [busquedaPaciente, sesionAbierta]);

    const alternarSesion = async (idSesion: number) => {
        if (sesionAbierta === idSesion) {
            setSesionAbierta(null);
            return;
        }

        setSesionAbierta(idSesion);
        setBusquedaPaciente("");
        setResultadosBusqueda([]);
        setErrorInscripcion("");

        if (inscripcionesPorSesion[idSesion]) return; // ya esta en cache, no se vuelve a pedir

        setCargandoInscripciones(true);
        try {
            const token = localStorage.getItem("token");
            const respuesta = await fetch(`${API_BASE_URL}/sesiones/${idSesion}/inscripciones`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!respuesta.ok) throw new Error("No se pudo obtener la lista de inscritos");

            const data: Inscripcion[] = await respuesta.json();
            setInscripcionesPorSesion((prev) => ({ ...prev, [idSesion]: data }));
        } catch (err) {
            setErrorInscripcion(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setCargandoInscripciones(false);
        }
    };

    const agregarPaciente = async (idSesion: number, paciente: PacienteBusqueda) => {
        setAgregando(true);
        setErrorInscripcion("");
        try {
            const token = localStorage.getItem("token");
            const respuesta = await fetch(`${API_BASE_URL}/sesiones/${idSesion}/inscripciones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ rut_paciente: paciente.rut }),
            });

            const data = await respuesta.json();

            if (!respuesta.ok) throw new Error(data.error || "No se pudo inscribir al paciente");

            const nuevaInscripcion: Inscripcion = {
                id_inscripcion: data.datos.id_inscripcion,
                rut_paciente: paciente.rut,
                estado_asistencia: "pendiente",
                paciente: { nombre: paciente.nombre, apellido: paciente.apellido },
            };

            setInscripcionesPorSesion((prev) => ({
                ...prev,
                [idSesion]: [...(prev[idSesion] ?? []), nuevaInscripcion],
            }));
            setBusquedaPaciente("");
            setResultadosBusqueda([]);
        } catch (err) {
            setErrorInscripcion(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setAgregando(false);
        }
    };

    const cambiarAsistencia = async (idSesion: number, idInscripcion: number, nuevoEstado: EstadoAsistencia) => {
        // optimista: la UI cambia al toque, se revierte si el backend falla
        const anteriores = inscripcionesPorSesion[idSesion];

        setInscripcionesPorSesion((prev) => ({
            ...prev,
            [idSesion]: prev[idSesion].map((i) =>
                i.id_inscripcion === idInscripcion ? { ...i, estado_asistencia: nuevoEstado } : i
            ),
        }));

        try {
            const token = localStorage.getItem("token");
            const respuesta = await fetch(`${API_BASE_URL}/inscripciones/${idInscripcion}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ estado_asistencia: nuevoEstado }),
            });

            if (!respuesta.ok) throw new Error();
        } catch {
            setInscripcionesPorSesion((prev) => ({ ...prev, [idSesion]: anteriores }));
            setErrorInscripcion("No se pudo actualizar la asistencia, intenta de nuevo.");
        }
    };

    const quitarInscripcion = async (idSesion: number, idInscripcion: number) => {
        try {
            const token = localStorage.getItem("token");
            const respuesta = await fetch(`${API_BASE_URL}/inscripciones/${idInscripcion}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!respuesta.ok) throw new Error();

            setInscripcionesPorSesion((prev) => ({
                ...prev,
                [idSesion]: prev[idSesion].filter((i) => i.id_inscripcion !== idInscripcion),
            }));
        } catch {
            setErrorInscripcion("No se pudo quitar al paciente, intenta de nuevo.");
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={() => navigate("/talleres")}
                className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </button>

            {cargando && (
                <div className="flex justify-center items-center p-12 text-blue-700">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-3 font-semibold text-lg">Cargando...</span>
                </div>
            )}

            {error && !cargando && (
                <div className="p-8 text-center text-red-600 font-bold text-lg">{error}</div>
            )}

            {!cargando && !error && taller && (
                <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex gap-3.5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h1 className="text-xl font-extrabold text-slate-900">{taller.nombre}</h1>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${taller.activo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}>
                                            {taller.activo ? "Activo" : "Inactivo"}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 max-w-[52ch] text-sm font-medium text-slate-500">
                                        {taller.descripcion || "Sin descripción"}
                                    </p>
                                </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700">
                                {taller.edad_min}–{taller.edad_max} años
                            </span>
                        </div>
                    </div>

                    {taller.sesiones.length === 0 && (
                        <>
                            <h2 className="text-lg font-semibold text-slate-800 mb-3">Sesiones</h2>
                            <div className="p-8 text-center text-slate-500 font-semibold">
                                Este taller no tiene sesiones registradas todavía.
                            </div>
                        </>
                    )}

                    {taller.sesiones.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5">
                                <h2 className="text-[15px] font-bold text-slate-800">Sesiones</h2>
                                <span className="text-xs font-semibold text-slate-400">
                                    {taller.sesiones.length} registrada{taller.sesiones.length === 1 ? "" : "s"}
                                </span>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Fecha</th>
                                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Responsable</th>
                                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Cupo máximo</th>
                                        <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Observaciones</th>
                                        <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Asistentes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taller.sesiones.map((sesion) => {
                                        const abierta = sesionAbierta === sesion.id_sesion;
                                        const inscritos = inscripcionesPorSesion[sesion.id_sesion];
                                        const resultadosSinInscritos = resultadosBusqueda.filter(
                                            (p) => !inscritos?.some((i) => i.rut_paciente === p.rut)
                                        );

                                        return (
                                            <Fragment key={sesion.id_sesion}>
                                                <tr className="border-b border-slate-100 last:border-0">
                                                    <td className="px-6 py-3 font-bold text-slate-800 whitespace-nowrap">
                                                        {formatearFecha(sesion.fecha)}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700 font-medium">
                                                        <span className="flex items-center gap-1.5">
                                                            <UserRound className="h-3.5 w-3.5 text-slate-400" />
                                                            {responsableSesion(sesion)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700 font-semibold">
                                                        {sesion.cupo_maximo ?? "—"}
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-500 font-medium">
                                                        {sesion.observaciones || "Sin observaciones"}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => alternarSesion(sesion.id_sesion)}
                                                            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700"
                                                        >
                                                            {inscritos?.length ?? "···"} inscrito{inscritos?.length === 1 ? "" : "s"}
                                                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${abierta ? "rotate-180" : ""}`} />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {abierta && (
                                                    <tr key={`${sesion.id_sesion}-panel`} className="border-b border-slate-100 last:border-0">
                                                        <td colSpan={5} className="bg-slate-50 px-6 py-4">
                                                            {cargandoInscripciones && !inscritos && (
                                                                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                    Cargando inscritos...
                                                                </div>
                                                            )}

                                                            {inscritos && (
                                                                <div className="space-y-3">
                                                                    <div className="relative max-w-sm">
                                                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                                        <input
                                                                            type="text"
                                                                            value={busquedaPaciente}
                                                                            onChange={(e) => setBusquedaPaciente(e.target.value)}
                                                                            placeholder="Buscar paciente por nombre o RUT..."
                                                                            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                                                                        />

                                                                        {busquedaPaciente.trim().length >= 2 && (
                                                                            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                                                                                {buscandoPaciente && (
                                                                                    <p className="px-3 py-2 text-xs font-semibold text-slate-400">Buscando...</p>
                                                                                )}

                                                                                {!buscandoPaciente && resultadosSinInscritos.length === 0 && (
                                                                                    <p className="px-3 py-2 text-xs font-semibold text-slate-400">Sin resultados.</p>
                                                                                )}

                                                                                {!buscandoPaciente && resultadosSinInscritos.map((p) => (
                                                                                    <button
                                                                                        key={p.rut}
                                                                                        type="button"
                                                                                        disabled={agregando}
                                                                                        onClick={() => agregarPaciente(sesion.id_sesion, p)}
                                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 disabled:opacity-50"
                                                                                    >
                                                                                        <UserPlus className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                                                        <span className="truncate">{p.nombre} {p.apellido}</span>
                                                                                        <span className="ml-auto shrink-0 text-xs text-slate-400">{p.rut}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {errorInscripcion && (
                                                                        <p className="text-xs font-semibold text-red-600">{errorInscripcion}</p>
                                                                    )}

                                                                    {inscritos.length === 0 && (
                                                                        <p className="text-sm font-medium text-slate-500">
                                                                            Todavía no hay pacientes inscritos en esta sesión.
                                                                        </p>
                                                                    )}

                                                                    {inscritos.length > 0 && (
                                                                        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                                                                            {inscritos.map((i) => (
                                                                                <li key={i.id_inscripcion} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                                                                    <div className="min-w-0">
                                                                                        <p className="truncate text-sm font-bold text-slate-800">
                                                                                            {i.paciente.nombre} {i.paciente.apellido}
                                                                                        </p>
                                                                                        <p className="text-xs text-slate-400">{i.rut_paciente}</p>
                                                                                    </div>
                                                                                    <div className="flex shrink-0 items-center gap-2">
                                                                                        <select
                                                                                            value={i.estado_asistencia}
                                                                                            onChange={(e) => cambiarAsistencia(sesion.id_sesion, i.id_inscripcion, e.target.value as EstadoAsistencia)}
                                                                                            className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${estilosAsistencia[i.estado_asistencia]}`}
                                                                                        >
                                                                                            <option value="pendiente">Pendiente</option>
                                                                                            <option value="asiste">Asistió</option>
                                                                                            <option value="no_asiste">No asistió</option>
                                                                                        </select>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => quitarInscripcion(sesion.id_sesion, i.id_inscripcion)}
                                                                                            title="Quitar de la sesión"
                                                                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                                                        >
                                                                                            <X className="h-3.5 w-3.5" />
                                                                                        </button>
                                                                                    </div>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
