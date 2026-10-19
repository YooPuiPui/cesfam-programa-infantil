import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Plus, Search, Filter, Pencil, Power, Save, TriangleAlert } from "lucide-react";
import { API_BASE_URL } from "../../service/api";
import { normalizarTexto } from "../../utils/formatters";

interface Profesional {
    id_profesional: number;
    rut: string;
    nombre: string;
    apellido: string;
    estamento: string;
    activo: boolean;
    creado_en: string;
}

const ESTAMENTOS_SUGERIDOS = [
    "Médico",
    "Enfermera/o",
    "Nutricionista",
    "Psicóloga/o",
    "Fonoaudióloga/o",
    "Terapeuta Ocupacional",
    "Kinesióloga/o",
    "Matrona",
    "Trabajador/a Social",
    "Educadora de Párvulos",
];

const REGEX_RUT = /^\d{7,8}-[0-9K]$/;

// Ej: 211183977 -> 21118397-7
function formatearRut(valor: string): string {
    const limpio = valor.replace(/[^0-9kK]/g, "").toUpperCase();
    if (limpio.length <= 1) return limpio;
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    return `${cuerpo}-${dv}`;
}

const fieldClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-all ${hasError
        ? "border-red-400 ring-4 ring-red-50"
        : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-white"
    }`;

const botonSecundarioClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50";

const botonDesactivarClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-bold text-red-700 shadow-sm transition-colors hover:border-red-600 hover:bg-red-50 disabled:opacity-50";

const botonReactivarClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-sm font-bold text-green-700 shadow-sm transition-colors hover:border-green-600 hover:bg-green-50 disabled:opacity-50";

const thClass = "px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200";

const initialForm = {
    rut: "",
    nombre: "",
    apellido: "",
    estamento: "",
};

type FormProfesional = typeof initialForm;

export default function Profesionales() {
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos");

    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState<Profesional | null>(null);
    const [form, setForm] = useState<FormProfesional>(initialForm);
    const [errorCampo, setErrorCampo] = useState<Partial<Record<keyof FormProfesional, string>>>({});
    const [errorForm, setErrorForm] = useState("");
    const [guardando, setGuardando] = useState(false);

    const [errorEstado, setErrorEstado] = useState("");
    const [profesionalPorCambiar, setProfesionalPorCambiar] = useState<Profesional | null>(null);
    const [cambiandoEstado, setCambiandoEstado] = useState(false);

    const obtenerProfesionales = async () => {
        setError("");

        try {
            const token = localStorage.getItem("token");

            const respuesta = await fetch(`${API_BASE_URL}/profesionales`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!respuesta.ok) throw new Error("No se pudo obtener la lista de profesionales");

            const data: Profesional[] = await respuesta.json();
            setProfesionales(
                [...data].sort(
                    (a, b) => a.apellido.localeCompare(b.apellido, "es") || a.nombre.localeCompare(b.nombre, "es")
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerProfesionales();
    }, []);

    const profesionalesFiltrados = profesionales.filter((p) => {
        const termino = normalizarTexto(busqueda);
        const coincideBusqueda = [p.nombre, p.apellido, p.rut, p.estamento].some((texto) =>
            normalizarTexto(texto).includes(termino)
        );
        const coincideEstado =
            filtroEstado === "todos" ||
            (filtroEstado === "activos" && p.activo) ||
            (filtroEstado === "inactivos" && !p.activo);

        return coincideBusqueda && coincideEstado;
    });

    const abrirCrear = () => {
        setEditando(null);
        setForm(initialForm);
        setErrorCampo({});
        setErrorForm("");
        setMostrarForm(true);
    };

    const abrirEdicion = (p: Profesional) => {
        setEditando(p);
        setForm({ rut: p.rut, nombre: p.nombre, apellido: p.apellido, estamento: p.estamento });
        setErrorCampo({});
        setErrorForm("");
        setMostrarForm(true);
    };

    const cerrarForm = () => {
        setMostrarForm(false);
        setEditando(null);
    };

    const actualizarCampo = (campo: keyof FormProfesional, valor: string) => {
        setForm((anterior) => ({ ...anterior, [campo]: valor }));
        setErrorCampo((anterior) => {
            if (!anterior[campo]) return anterior;
            const siguiente = { ...anterior };
            delete siguiente[campo];
            return siguiente;
        });
    };

    const validar = (): boolean => {
        const errores: Partial<Record<keyof FormProfesional, string>> = {};

        if (!editando) {
            if (!form.rut.trim()) errores.rut = "El RUT es obligatorio.";
            else if (!REGEX_RUT.test(form.rut.trim())) errores.rut = "Ingresa un RUT válido, ej: 21118397-7.";
        }

        if (!form.nombre.trim()) errores.nombre = "El nombre es obligatorio.";
        if (!form.apellido.trim()) errores.apellido = "El apellido es obligatorio.";
        if (!form.estamento.trim()) errores.estamento = "El estamento es obligatorio.";

        setErrorCampo(errores);
        return Object.keys(errores).length === 0;
    };

    const guardarProfesional = async (e: FormEvent) => {
        e.preventDefault();
        setErrorForm("");
        if (!validar()) return;

        setGuardando(true);
        try {
            const token = localStorage.getItem("token");

            const datos = {
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                estamento: form.estamento.trim(),
            };

            const respuesta = await fetch(
                editando ? `${API_BASE_URL}/profesionales/${editando.id_profesional}` : `${API_BASE_URL}/profesionales`,
                {
                    method: editando ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    // el RUT es la clave que usan sesiones y controles: solo se envía al crear
                    body: JSON.stringify(editando ? datos : { rut: form.rut.trim(), ...datos }),
                }
            );

            const data = await respuesta.json().catch(() => ({}));

            if (respuesta.status === 409) {
                setErrorCampo({ rut: "Ya existe un profesional con ese RUT." });
                return;
            }

            if (!respuesta.ok) {
                throw new Error(data?.error || "No fue posible guardar el profesional.");
            }

            cerrarForm();
            await obtenerProfesionales();
        } catch (err) {
            setErrorForm(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
        } finally {
            setGuardando(false);
        }
    };

    const cambiarEstado = async () => {
        if (!profesionalPorCambiar) return;

        const p = profesionalPorCambiar;
        const accion = p.activo ? "desactivar" : "reactivar";

        setErrorEstado("");
        setCambiandoEstado(true);
        try {
            const token = localStorage.getItem("token");

            const respuesta = await fetch(`${API_BASE_URL}/profesionales/${p.id_profesional}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ activo: !p.activo }), // solo este campo; el resto no se toca
            });

            const data = await respuesta.json().catch(() => ({}));
            if (!respuesta.ok) throw new Error(data?.error || `No fue posible ${accion} al profesional.`);

            await obtenerProfesionales();
        } catch (err) {
            setErrorEstado(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
        } finally {
            setCambiandoEstado(false);
            setProfesionalPorCambiar(null);
        }
    };

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
                            placeholder="Buscar profesional..."
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
                        Total: {profesionales.length}
                    </div>
                    <button
                        type="button"
                        onClick={abrirCrear}
                        className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Nuevo profesional
                    </button>
                </div>
            </div>

            {mostrarForm && (
                <div className="p-4 pb-0">
                    <form onSubmit={guardarProfesional} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                        <div>
                            <h2 className="text-[15px] font-bold text-slate-800">
                                {editando ? "Editar profesional" : "Nuevo profesional"}
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Los profesionales activos aparecen en la lista de responsables al crear sesiones de taller.
                            </p>
                        </div>

                        {errorForm && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                                {errorForm}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">RUT</label>
                                <input
                                    type="text"
                                    value={form.rut}
                                    onChange={(e) => actualizarCampo("rut", formatearRut(e.target.value))}
                                    disabled={!!editando}
                                    placeholder="Ej: 21118397-7"
                                    className={`${fieldClass(!!errorCampo.rut)} disabled:cursor-not-allowed disabled:opacity-60`}
                                />
                                {editando && <p className="mt-1 text-xs font-semibold text-slate-500">El RUT no se puede modificar.</p>}
                                {errorCampo.rut && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.rut}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Estamento</label>
                                <input
                                    type="text"
                                    list="estamentos-profesionales"
                                    value={form.estamento}
                                    onChange={(e) => actualizarCampo("estamento", e.target.value)}
                                    placeholder="Ej: Enfermera/o"
                                    className={fieldClass(!!errorCampo.estamento)}
                                />
                                <datalist id="estamentos-profesionales">
                                    {ESTAMENTOS_SUGERIDOS.map((estamento) => (
                                        <option key={estamento} value={estamento} />
                                    ))}
                                </datalist>
                                {errorCampo.estamento && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.estamento}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={(e) => actualizarCampo("nombre", e.target.value)}
                                    className={fieldClass(!!errorCampo.nombre)}
                                />
                                {errorCampo.nombre && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.nombre}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Apellido</label>
                                <input
                                    type="text"
                                    value={form.apellido}
                                    onChange={(e) => actualizarCampo("apellido", e.target.value)}
                                    className={fieldClass(!!errorCampo.apellido)}
                                />
                                {errorCampo.apellido && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.apellido}</p>}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                disabled={guardando}
                                className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                {editando ? "Guardar cambios" : "Guardar profesional"}
                            </button>
                            <button
                                type="button"
                                onClick={cerrarForm}
                                disabled={guardando}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {cargando && (
                <div className="flex justify-center items-center p-12 text-blue-700">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-3 font-semibold text-lg">Cargando...</span>
                </div>
            )}

            {error && !cargando && (
                <div className="p-8 text-center text-red-600 font-bold text-lg">{error}</div>
            )}

            {errorEstado && !cargando && !error && (
                <div className="mx-4 mt-4 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                    {errorEstado}
                </div>
            )}

            {!cargando && !error && profesionales.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-semibold">
                    No hay profesionales registrados todavía.
                </div>
            )}

            {!cargando && !error && profesionales.length > 0 && profesionalesFiltrados.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-semibold">
                    Ningún profesional coincide con la búsqueda.
                </div>
            )}

            {!cargando && !error && profesionalesFiltrados.length > 0 && (
                <div className="p-4">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className={thClass}>Nombre</th>
                                        <th className={thClass}>RUT</th>
                                        <th className={thClass}>Estamento</th>
                                        <th className={thClass}>Estado</th>
                                        <th className={thClass}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profesionalesFiltrados.map((p) => (
                                        <tr key={p.id_profesional} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                                                {p.nombre} {p.apellido}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{p.rut}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{p.estamento}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${p.activo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                                                        }`}
                                                >
                                                    {p.activo ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirEdicion(p)}
                                                        className={botonSecundarioClass}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProfesionalPorCambiar(p)}
                                                        className={p.activo ? botonDesactivarClass : botonReactivarClass}
                                                    >
                                                        <Power className="h-4 w-4" />
                                                        {p.activo ? "Desactivar" : "Reactivar"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {profesionalPorCambiar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
                    <div className="w-full max-w-95 rounded-2xl bg-white p-7 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                <TriangleAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    {profesionalPorCambiar.activo ? "¿Desactivar profesional?" : "¿Reactivar profesional?"}
                                </h2>
                                <p className="mt-1.5 text-sm font-medium text-slate-600">
                                    {profesionalPorCambiar.activo
                                        ? <><span className="font-bold text-slate-900">{profesionalPorCambiar.nombre} {profesionalPorCambiar.apellido}</span> dejará de aparecer al crear sesiones de taller. Las sesiones ya registradas se mantienen y podrás reactivarlo cuando quieras.</>
                                        : <><span className="font-bold text-slate-900">{profesionalPorCambiar.nombre} {profesionalPorCambiar.apellido}</span> volverá a aparecer al crear sesiones de taller.</>}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={cambiarEstado}
                                disabled={cambiandoEstado}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50 ${profesionalPorCambiar.activo ? "bg-red-600 hover:bg-red-700" : "bg-blue-700 hover:bg-blue-800"}`}
                            >
                                {cambiandoEstado && <Loader2 className="h-4 w-4 animate-spin" />}
                                {profesionalPorCambiar.activo ? "Sí, desactivar" : "Sí, reactivar"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setProfesionalPorCambiar(null)}
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
