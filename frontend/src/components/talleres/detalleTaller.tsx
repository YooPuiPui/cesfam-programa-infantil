import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Loader2, Pencil, Plus, Power, Save, TriangleAlert, UserRound, GraduationCap } from "lucide-react";
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

// rut_profesional y profesional_externo son excluyentes
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

const EDAD_TOPE_TALLER = 18;

type FormTaller = {

    nombre: string;
    descripcion: string;
    edad_min: string;
    edad_max: string;

};

export default function DetalleTaller() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [taller, setTaller] = useState<TallerConSesiones | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [guardandoTaller, setGuardandoTaller] = useState(false);
    const [editando, setEditando] = useState(false);
    const [confirmandoEstado, setConfirmandoEstado] = useState(false);
    const [cambiandoEstado, setCambiandoEstado] = useState(false);
    const [formTaller, setFormTaller] = useState<FormTaller>({ nombre: "", descripcion: "", edad_min: "", edad_max: "" });
    const [errorCampoTaller, setErrorCampoTaller] = useState<Partial<Record<keyof FormTaller, string>>>({});
    const [errorTaller, setErrorTaller] = useState("");

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

            // un solo fetch: las sesiones ya vienen incluidas 
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
    }, [id]); 

    const abrirFormSesion = async () => {
        setMostrarFormSesion(true);
        setErrorFormSesion("");
        setErrorCampo({});
        setFormSesion(initialFormSesion);

        if (profesionales.length > 0) return; 

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

    const abrirEdicion = () => {

        if(!taller) return;
        setFormTaller({

            nombre: taller.nombre,
            descripcion: taller.descripcion ?? "",
            edad_min: String(taller.edad_min),
            edad_max: String(taller.edad_max),
        });

        setErrorCampoTaller({});
        setErrorTaller("");
        setEditando(true);

    };


    const actualizarCampoTaller = (campo: keyof FormTaller, valor: string) => {
        setFormTaller((anterior) => ({ ...anterior, [campo]: valor }));
        setErrorCampoTaller((anterior) => {
            if (!anterior[campo]) return anterior;
            const siguiente = { ...anterior };
            delete siguiente[campo];
            return siguiente;
        });
    };

    const validarTaller = (): boolean => {
        const errores: Partial<Record<keyof FormTaller, string>> = {};

        if (!formTaller.nombre.trim()) errores.nombre = "El nombre del taller es obligatorio.";

        const edadMin = parseInt(formTaller.edad_min);
        const edadMax = parseInt(formTaller.edad_max);

        if (isNaN(edadMin) || edadMin < 0) errores.edad_min = "Debe ser un número entero mayor o igual a cero.";
        else if (edadMin > EDAD_TOPE_TALLER) errores.edad_min = `No puede ser mayor a ${EDAD_TOPE_TALLER} años.`;

        if (isNaN(edadMax) || edadMax < 0) errores.edad_max = "Debe ser un número entero mayor o igual a cero.";
        else if (edadMax > EDAD_TOPE_TALLER) errores.edad_max = `No puede ser mayor a ${EDAD_TOPE_TALLER} años.`;

        if (!errores.edad_min && !errores.edad_max && edadMin > edadMax) {
            errores.edad_min = "La edad mínima no puede ser mayor que la máxima.";
        }

        setErrorCampoTaller(errores);
        return Object.keys(errores).length === 0;
    };


    const guardarTaller = async (e: FormEvent) => {
    e.preventDefault();
    setErrorTaller("");
    if (!validarTaller()) return;

    setGuardandoTaller(true);
    try {
        const token = localStorage.getItem("token");

        const respuesta = await fetch(`${API_BASE_URL}/talleres/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                nombre: formTaller.nombre.trim(),
                descripcion: formTaller.descripcion.trim() || null,
                edad_min: parseInt(formTaller.edad_min),
                edad_max: parseInt(formTaller.edad_max),
            }),
        });

        const data = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(data?.error || "No fue posible guardar los cambios.");

        setEditando(false);
        await obtenerTaller(); // vuelve a pedir el taller para mostrar los datos nuevos
    } catch (err) {
        setErrorTaller(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
    } finally {
        setGuardandoTaller(false);
    }
};

const cambiarEstado = async () => {
    if (!taller) return;

    const accion = taller.activo ? "desactivar" : "reactivar";

    setErrorTaller("");
    setCambiandoEstado(true);
    try {
        const token = localStorage.getItem("token");

        const respuesta = await fetch(`${API_BASE_URL}/talleres/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ activo: !taller.activo }), // solo este campo; el resto no se toca
        });

        const data = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(data?.error || `No fue posible ${accion} el taller.`);

        await obtenerTaller();
    } catch (err) {
        setErrorTaller(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
    } finally {
        setCambiandoEstado(false);
        setConfirmandoEstado(false);
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

                        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={editando ? () => setEditando(false) : abrirEdicion}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                                <Pencil className="h-4 w-4" />
                                {editando ? "Cancelar edición" : "Editar taller"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmandoEstado(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                                <Power className="h-4 w-4" />
                                {taller.activo ? "Desactivar" : "Reactivar"}
                            </button>
                        </div>

                        {errorTaller && !editando && (
                            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                                {errorTaller}
                            </div>
                        )}

                        {editando && (
                            <form onSubmit={guardarTaller} className="mt-4 space-y-3.5 border-t border-slate-100 pt-4">
                                {errorTaller && (
                                    <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                                        {errorTaller}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={formTaller.nombre}
                                        onChange={(e) => actualizarCampoTaller("nombre", e.target.value)}
                                        className={fieldClass(!!errorCampoTaller.nombre)}
                                    />
                                    {errorCampoTaller.nombre && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampoTaller.nombre}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
                                    <textarea
                                        value={formTaller.descripcion}
                                        onChange={(e) => actualizarCampoTaller("descripcion", e.target.value)}
                                        className={fieldClass(false)}
                                        rows={2}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Edad mínima</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={EDAD_TOPE_TALLER}
                                            value={formTaller.edad_min}
                                            onChange={(e) => actualizarCampoTaller("edad_min", e.target.value)}
                                            className={`${fieldClass(!!errorCampoTaller.edad_min)} max-w-32`}
                                        />
                                        {errorCampoTaller.edad_min && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampoTaller.edad_min}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Edad máxima</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={EDAD_TOPE_TALLER}
                                            value={formTaller.edad_max}
                                            onChange={(e) => actualizarCampoTaller("edad_max", e.target.value)}
                                            className={`${fieldClass(!!errorCampoTaller.edad_max)} max-w-32`}
                                        />
                                        {errorCampoTaller.edad_max && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampoTaller.edad_max}</p>}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={guardandoTaller}
                                    className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {guardandoTaller ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Guardar cambios
                                </button>
                            </form>
                        )}
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

            {confirmandoEstado && taller && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
                    <div className="w-full max-w-95 rounded-2xl bg-white p-7 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                <TriangleAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    {taller.activo ? "¿Desactivar taller?" : "¿Reactivar taller?"}
                                </h2>
                                <p className="mt-1.5 text-sm font-medium text-slate-600">
                                    {taller.activo
                                        ? <>El taller <span className="font-bold text-slate-900">{taller.nombre}</span> dejará de estar disponible para nuevas sesiones. Podrás reactivarlo cuando quieras.</>
                                        : <>El taller <span className="font-bold text-slate-900">{taller.nombre}</span> volverá a estar disponible para nuevas sesiones.</>}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={cambiarEstado}
                                disabled={cambiandoEstado}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50 ${taller.activo ? "bg-red-600 hover:bg-red-700" : "bg-blue-700 hover:bg-blue-800"}`}
                            >
                                {cambiandoEstado && <Loader2 className="h-4 w-4 animate-spin" />}
                                {taller.activo ? "Sí, desactivar" : "Sí, reactivar"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmandoEstado(false)}
                                disabled={cambiandoEstado}
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
