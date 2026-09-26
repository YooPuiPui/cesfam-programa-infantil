import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck, Loader2, Search, TriangleAlert, X } from "lucide-react";
import { API_BASE_URL } from "../../service/api";
import { calcularEdad, formatearRUT } from "../../utils/formatters";

type EstadoAsistencia = "pendiente" | "asiste" | "no_asiste";

interface PacienteInscrito {
    rut: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
}

interface Inscripcion {
    id_inscripcion: number;
    rut_paciente: string;
    estado_asistencia: EstadoAsistencia;
    paciente: PacienteInscrito;
}

interface SesionDetalle {
    id_sesion: number;
    fecha: string;
    cupo_maximo: number | null;
    rut_profesional: string | null;
    profesional_externo: string | null;
    profesional: { nombre: string; apellido: string } | null;
    taller: { id_taller: number; nombre: string };
    inscripciones: Inscripcion[];
}

interface PacienteBusqueda {
    rut: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
}

const responsableSesion = (sesion: SesionDetalle): string => {
    if (sesion.profesional) return `${sesion.profesional.nombre} ${sesion.profesional.apellido}`;
    if (sesion.profesional_externo) return sesion.profesional_externo;
    return "Sin asignar";
};

const iniciales = (nombre: string, apellido: string): string => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
};

const opcionesAsistencia: { valor: EstadoAsistencia; etiqueta: string; bg: string; fg: string }[] = [
    { valor: "pendiente", etiqueta: "Pendiente", bg: "bg-amber-100", fg: "text-amber-800" },
    { valor: "asiste", etiqueta: "Asistió", bg: "bg-green-100", fg: "text-green-800" },
    { valor: "no_asiste", etiqueta: "No asistió", bg: "bg-red-100", fg: "text-red-700" },
];

export default function DetalleSesion() {
    const { idSesion } = useParams<{ idSesion: string }>();
    const navigate = useNavigate();

    const [sesion, setSesion] = useState<SesionDetalle | null>(null);
    const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [errorAccion, setErrorAccion] = useState("");

    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState<PacienteBusqueda[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [agregando, setAgregando] = useState(false);
    const [aQuitar, setAQuitar] = useState<Inscripcion | null>(null);
    const [quitando, setQuitando] = useState(false);

    useEffect(() => {
        const obtenerSesion = async () => {
            setCargando(true);
            setError("");
            try {
                const token = localStorage.getItem("token");
                const respuesta = await fetch(`${API_BASE_URL}/sesiones/${idSesion}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!respuesta.ok) throw new Error("No se pudo obtener la sesión solicitada");

                const data: SesionDetalle = await respuesta.json();
                setSesion(data);
                setInscripciones(data.inscripciones);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                setCargando(false);
            }
        };

        obtenerSesion();
    }, [idSesion]);

    useEffect(() => {
        if (busqueda.trim().length < 2) {
            setResultados([]);
            return;
        }

        const timer = setTimeout(async () => {
            setBuscando(true);
            try {
                const token = localStorage.getItem("token");
                const respuesta = await fetch(
                    `${API_BASE_URL}/pacientes?busqueda=${encodeURIComponent(busqueda.trim())}&limit=5`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!respuesta.ok) throw new Error();

                const data = await respuesta.json();
                setResultados(data.data ?? []);
            } catch {
                setResultados([]);
            } finally {
                setBuscando(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [busqueda]);

    const agregarPaciente = async (paciente: PacienteBusqueda) => {
        if (!sesion) return;

        setAgregando(true);
        setErrorAccion("");
        try {
            const token = localStorage.getItem("token");
            const respuesta = await fetch(`${API_BASE_URL}/sesiones/${sesion.id_sesion}/inscripciones`, {
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
                paciente: {
                    rut: paciente.rut,
                    nombre: paciente.nombre,
                    apellido: paciente.apellido,
                    fecha_nacimiento: paciente.fecha_nacimiento,
                },
            };

            setInscripciones((prev) => [...prev, nuevaInscripcion]);
            setBusqueda("");
            setResultados([]);
        } catch (err) {
            setErrorAccion(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setAgregando(false);
        }
    };

    const cambiarAsistencia = async (idInscripcion: number, nuevoEstado: EstadoAsistencia) => {
        // optimista: la UI cambia al toque, se revierte si el backend falla
        const anteriores = inscripciones;

        setInscripciones((prev) =>
            prev.map((i) => (i.id_inscripcion === idInscripcion ? { ...i, estado_asistencia: nuevoEstado } : i))
        );

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
            setInscripciones(anteriores);
            setErrorAccion("No se pudo actualizar la asistencia, intenta de nuevo.");
        }
    };

    const confirmarQuitar = async () => {
        if (!aQuitar) return;

        setQuitando(true);
        try {
            const token = localStorage.getItem("token");
            const respuesta = await fetch(`${API_BASE_URL}/inscripciones/${aQuitar.id_inscripcion}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!respuesta.ok) throw new Error();

            setInscripciones((prev) => prev.filter((i) => i.id_inscripcion !== aQuitar.id_inscripcion));
            setAQuitar(null);
        } catch {
            setErrorAccion("No se pudo quitar al paciente, intenta de nuevo.");
        } finally {
            setQuitando(false);
        }
    };

    const rutsInscritos = new Set(inscripciones.map((i) => i.rut_paciente));
    const resultadosSinInscritos = resultados.filter((p) => !rutsInscritos.has(p.rut));
    const countAsiste = inscripciones.filter((i) => i.estado_asistencia === "asiste").length;
    const countNoAsiste = inscripciones.filter((i) => i.estado_asistencia === "no_asiste").length;

    return (
        <div className="max-w-[860px] flex flex-col gap-5">
            <button
                type="button"
                onClick={() => (sesion ? navigate(`/talleres/${sesion.taller.id_taller}`) : navigate("/talleres"))}
                className="self-start inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
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

            {!cargando && !error && sesion && (
                <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <CalendarCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500">{sesion.taller.nombre}</p>
                                <h1 className="mt-0.5 text-xl font-extrabold text-slate-900">
                                    Sesión del{" "}
                                    {new Date(sesion.fecha).toLocaleDateString("es-CL", {
                                        timeZone: "UTC",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </h1>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 px-4 py-3.5">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Responsable</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">{responsableSesion(sesion)}</p>
                            </div>
                            <div className="rounded-xl bg-blue-50 px-4 py-3.5">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Inscritos</p>
                                <p className="mt-1 text-sm font-extrabold text-blue-700">
                                    {inscripciones.length} niño{inscripciones.length === 1 ? "" : "s"}
                                </p>
                            </div>
                        </div>
                        <p className="mt-3 text-xs font-medium text-slate-400">
                            Este taller no tiene cupo máximo: cualquier paciente puede inscribirse.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-[15px] font-bold text-slate-800">Agregar niño a la sesión</h2>
                        <p className="mt-1 mb-3.5 text-xs font-medium text-slate-400">
                            Busca por nombre o RUT y selecciona un paciente para inscribirlo
                        </p>
                        <div className="relative max-w-[420px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Ej: Martina o 19.884.221-3"
                                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                            />

                            {busqueda.trim().length >= 2 && (
                                <div className="absolute z-10 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                                    {buscando && (
                                        <p className="px-3.5 py-2.5 text-center text-sm font-medium text-slate-400">Buscando...</p>
                                    )}

                                    {!buscando && resultadosSinInscritos.length === 0 && (
                                        <p className="px-3.5 py-2.5 text-center text-sm font-medium text-slate-400">Sin resultados</p>
                                    )}

                                    {!buscando && resultadosSinInscritos.map((p) => (
                                        <button
                                            key={p.rut}
                                            type="button"
                                            disabled={agregando}
                                            onClick={() => agregarPaciente(p)}
                                            className="flex w-full items-center justify-between gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-left last:border-0 hover:bg-blue-50 disabled:opacity-50"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-800">{p.nombre} {p.apellido}</p>
                                                <p className="text-xs font-medium text-slate-500">
                                                    {formatearRUT(p.rut)} · {calcularEdad(p.fecha_nacimiento)}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-xs font-bold text-blue-700">Agregar</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {errorAccion && (
                        <p className="text-sm font-semibold text-red-600">{errorAccion}</p>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 px-6 py-4">
                            <h2 className="text-[15px] font-bold text-slate-800">Niños inscritos</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                {inscripciones.length} inscritos ·{" "}
                                <span className="text-green-800">{countAsiste} asistieron</span> ·{" "}
                                <span className="text-red-700">{countNoAsiste} no asistieron</span>
                            </p>
                        </div>

                        {inscripciones.length === 0 && (
                            <p className="px-6 py-10 text-center text-sm font-bold text-slate-400">
                                Todavía no hay niños inscritos en esta sesión.
                            </p>
                        )}

                        {inscripciones.length > 0 && (
                            <div>
                                {inscripciones.map((i) => (
                                    <div
                                        key={i.id_inscripcion}
                                        className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-6 py-3.5 last:border-0"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                                            {iniciales(i.paciente.nombre, i.paciente.apellido)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-slate-800">
                                                {i.paciente.nombre} {i.paciente.apellido}
                                            </p>
                                            <p className="text-xs font-medium text-slate-500">
                                                {formatearRUT(i.paciente.rut)} · {calcularEdad(i.paciente.fecha_nacimiento)}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 gap-1 rounded-full bg-slate-100 p-1">
                                            {opcionesAsistencia.map((opcion) => (
                                                <button
                                                    key={opcion.valor}
                                                    type="button"
                                                    onClick={() => cambiarAsistencia(i.id_inscripcion, opcion.valor)}
                                                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${i.estado_asistencia === opcion.valor
                                                        ? `${opcion.bg} ${opcion.fg}`
                                                        : "text-slate-400 hover:text-slate-600"
                                                        }`}
                                                >
                                                    {opcion.etiqueta}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setAQuitar(i)}
                                            title="Quitar de la sesión"
                                            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {aQuitar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
                    <div className="w-full max-w-95 rounded-2xl bg-white p-7 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                <TriangleAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">¿Quitar de la sesión?</h2>
                                <p className="mt-1.5 text-sm font-medium text-slate-600">
                                    <span className="font-bold text-slate-900">{aQuitar.paciente.nombre} {aQuitar.paciente.apellido}</span> dejará
                                    de estar inscrito en esta sesión y se perderá su registro de asistencia. Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={confirmarQuitar}
                                disabled={quitando}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                                {quitando && <Loader2 className="h-4 w-4 animate-spin" />}
                                Sí, quitar
                            </button>
                            <button
                                type="button"
                                onClick={() => setAQuitar(null)}
                                disabled={quitando}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
