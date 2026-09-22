import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Loader2, Plus, Save, UserRound, GraduationCap } from "lucide-react";
import { API_BASE_URL } from '../../service/api';
import { formatearFecha } from '../../utils/formatters';

interface SesionTaller {
    id_sesion: number;
    fecha: string;
    rut_profesional: string | null;
    profesional_externo: string | null;
    profesional: { nombre: string; apellido: string } | null;
    observaciones: string | null;
    inscritosCount: number;
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

interface Profesional {
    rut: string;
    nombre: string;
    apellido: string;
}

// rut_profesional y profesional_externo son mutuamente excluyentes (Tema 4)
const responsableSesion = (sesion: SesionTaller): string => {
    if (sesion.profesional) return `${sesion.profesional.nombre} ${sesion.profesional.apellido}`;
    if (sesion.profesional_externo) return sesion.profesional_externo;
    return "Sin asignar";
};

type TipoResponsable = "interno" | "externo";

const fieldClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-all ${hasError
        ? "border-red-400 ring-4 ring-red-50"
        : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-white"
    }`;

const initialFormSesion = {
    fecha: "",
    tipoResponsable: "interno" as TipoResponsable,
    rutProfesional: "",
    profesionalExterno: "",
    observaciones: "",
};

type FormSesion = typeof initialFormSesion;

export default function DetalleTaller() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [taller, setTaller] = useState<TallerConSesiones | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [mostrarFormSesion, setMostrarFormSesion] = useState(false);
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [formSesion, setFormSesion] = useState<FormSesion>(initialFormSesion);
    const [errorCampo, setErrorCampo] = useState<Partial<Record<keyof FormSesion, string>>>({});
    const [errorFormSesion, setErrorFormSesion] = useState("");
    const [guardandoSesion, setGuardandoSesion] = useState(false);

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

    useEffect(() => {
        obtenerTaller();
    }, [id]); // se re-ejecuta si cambia el id de la URL (Tema 4)

    const abrirFormSesion = async () => {
        setMostrarFormSesion(true);
        setErrorFormSesion("");
        setErrorCampo({});
        setFormSesion(initialFormSesion);

        if (profesionales.length > 0) return; // ya en cache

        try {
            const token = localStorage.getItem("token");
            const respuesta = await fetch(`${API_BASE_URL}/profesionales`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!respuesta.ok) throw new Error();

            const data: Profesional[] = await respuesta.json();
            setProfesionales(data);
        } catch {
            setProfesionales([]);
        }
    };

    const actualizarCampoSesion = (campo: keyof FormSesion, valor: string) => {
        setFormSesion((anterior) => ({ ...anterior, [campo]: valor }));
        setErrorCampo((anterior) => {
            if (!anterior[campo]) return anterior;
            const siguiente = { ...anterior };
            delete siguiente[campo];
            return siguiente;
        });
    };

    const crearSesion = async (e: FormEvent) => {
        e.preventDefault();
        setErrorFormSesion("");

        const nextErrors: Partial<Record<keyof FormSesion, string>> = {};

        if (!formSesion.fecha) nextErrors.fecha = "La fecha de la sesión es obligatoria.";

        if (formSesion.tipoResponsable === "interno" && !formSesion.rutProfesional) {
            nextErrors.rutProfesional = "Selecciona un profesional del CESFAM.";
        }

        if (formSesion.tipoResponsable === "externo" && !formSesion.profesionalExterno.trim()) {
            nextErrors.profesionalExterno = "Indica el nombre del profesional externo.";
        }

        setErrorCampo(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setGuardandoSesion(true);
        try {
            const token = localStorage.getItem("token");

            const payload = {
                fecha: formSesion.fecha,
                rut_profesional: formSesion.tipoResponsable === "interno" ? formSesion.rutProfesional : undefined,
                profesional_externo: formSesion.tipoResponsable === "externo" ? formSesion.profesionalExterno.trim() : undefined,
                observaciones: formSesion.observaciones.trim() || undefined,
            };

            const respuesta = await fetch(`${API_BASE_URL}/talleres/${id}/sesiones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) throw new Error(data?.error || "No fue posible crear la sesión.");

            setMostrarFormSesion(false);
            await obtenerTaller();
        } catch (err) {
            setErrorFormSesion(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
        } finally {
            setGuardandoSesion(false);
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

                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-slate-800">Sesiones</h2>
                        <button
                            type="button"
                            onClick={() => (mostrarFormSesion ? setMostrarFormSesion(false) : abrirFormSesion())}
                            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva sesión
                        </button>
                    </div>

                    {mostrarFormSesion && (
                        <form onSubmit={crearSesion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-4 space-y-3.5">
                            {errorFormSesion && (
                                <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                                    {errorFormSesion}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    value={formSesion.fecha}
                                    onChange={(e) => actualizarCampoSesion("fecha", e.target.value)}
                                    className={`${fieldClass(!!errorCampo.fecha)} max-w-55`}
                                />
                                {errorCampo.fecha && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.fecha}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Responsable</label>
                                <div className="flex gap-4 mb-2">
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <input
                                            type="radio"
                                            checked={formSesion.tipoResponsable === "interno"}
                                            onChange={() => actualizarCampoSesion("tipoResponsable", "interno")}
                                        />
                                        Profesional del CESFAM
                                    </label>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <input
                                            type="radio"
                                            checked={formSesion.tipoResponsable === "externo"}
                                            onChange={() => actualizarCampoSesion("tipoResponsable", "externo")}
                                        />
                                        Profesional externo
                                    </label>
                                </div>

                                {formSesion.tipoResponsable === "interno" ? (
                                    <>
                                        <select
                                            value={formSesion.rutProfesional}
                                            onChange={(e) => actualizarCampoSesion("rutProfesional", e.target.value)}
                                            className={fieldClass(!!errorCampo.rutProfesional)}
                                        >
                                            <option value="">Selecciona un profesional...</option>
                                            {profesionales.map((p) => (
                                                <option key={p.rut} value={p.rut}>{p.nombre} {p.apellido}</option>
                                            ))}
                                        </select>
                                        {errorCampo.rutProfesional && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.rutProfesional}</p>}
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={formSesion.profesionalExterno}
                                            onChange={(e) => actualizarCampoSesion("profesionalExterno", e.target.value)}
                                            placeholder="Ej: Ana Torres (fonoaudióloga externa)"
                                            className={fieldClass(!!errorCampo.profesionalExterno)}
                                        />
                                        {errorCampo.profesionalExterno && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.profesionalExterno}</p>}
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones</label>
                                <textarea
                                    value={formSesion.observaciones}
                                    onChange={(e) => actualizarCampoSesion("observaciones", e.target.value)}
                                    className={fieldClass(false)}
                                    rows={2}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={guardandoSesion}
                                className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {guardandoSesion ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar sesión
                            </button>
                        </form>
                    )}

                    {taller.sesiones.length === 0 && (
                        <div className="p-8 text-center text-slate-500 font-semibold">
                            Este taller no tiene sesiones registradas todavía.
                        </div>
                    )}

                    {taller.sesiones.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5">
                                <h2 className="text-[15px] font-bold text-slate-800">Todas las sesiones</h2>
                                <span className="text-xs font-semibold text-slate-400">
                                    {taller.sesiones.length} registrada{taller.sesiones.length === 1 ? "" : "s"}
                                </span>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Fecha</th>
                                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Responsable</th>
                                        <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Observaciones</th>
                                        <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">Asistentes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taller.sesiones.map((sesion) => (
                                        <tr
                                            key={sesion.id_sesion}
                                            onClick={() => navigate(`/talleres/sesiones/${sesion.id_sesion}`)}
                                            className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-3 font-bold text-slate-800 whitespace-nowrap">
                                                {formatearFecha(sesion.fecha)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    <UserRound className="h-3.5 w-3.5 text-slate-400" />
                                                    {responsableSesion(sesion)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 font-medium">
                                                {sesion.observaciones || "Sin observaciones"}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700">
                                                    {sesion.inscritosCount} inscrito{sesion.inscritosCount === 1 ? "" : "s"}
                                                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
