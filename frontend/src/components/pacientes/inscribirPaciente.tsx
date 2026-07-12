import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, UserRound, UsersRound, ShieldAlert, CheckCircle2, CircleAlert } from "lucide-react";
import { API_BASE_URL } from '../../service/api';


type FormFieldValue = string | boolean;

type FormState = {
    rut: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    sexo_biologico: string;
    nacionalidad: string;
    direccion: string;
    sector: string;
    comuna: string;
    prevision: string;
    fecha_inscripcion: string;
    es_sename: boolean;
    es_naneas_prematuro: boolean;
    es_migrante: boolean;
    es_poblacion_trans: boolean;
    nombre_social: string;
    identidad_genero: string;
    tutor_rut: string;
    tutor_nombre: string;
    tutor_apellido: string;
    tutor_telefono: string;
    tutor_parentesco: string;
    tutor_correo: string;
    tutor_direccion: string;
    tutor_comuna: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const hoyLocal = () => {
    const fecha = new Date();
    const offset = fecha.getTimezoneOffset();
    const local = new Date(fecha.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 10);
};

// Inserta el guion automáticamente antes del dígito verificador mientras se escribe.
// Ej: "211183977" -> "21118397-7"
function formatearRut(valor: string): string {
    const limpio = valor.replace(/[^0-9kK]/g, "").toUpperCase();
    if (limpio.length <= 1) return limpio;
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    return `${cuerpo}-${dv}`;
}


const OPCIONES_SECTOR = ["Sector 1 - Azul", "Sector 2 - Rojo"];


const OPCIONES_COMUNA = ["Concepción"];

const initialState: FormState = {
    rut: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    sexo_biologico: "",
    nacionalidad: "Chilena",
    direccion: "",
    sector: "",
    comuna: "Concepción",
    prevision: "",
    fecha_inscripcion: hoyLocal(),
    es_sename: false,
    es_naneas_prematuro: false,
    es_migrante: false,
    es_poblacion_trans: false,
    nombre_social: "",
    identidad_genero: "",
    tutor_rut: "",
    tutor_nombre: "",
    tutor_apellido: "",
    tutor_telefono: "+569",
    tutor_parentesco: "",
    tutor_correo: "",
    tutor_direccion: "",
    tutor_comuna: "Concepción",
};

const fieldClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 ${hasError
        ? "border-red-400 ring-4 ring-red-50"
        : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-white"
    }`;

const checkboxClass = "h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600";

export default function InscribirPaciente() {
    const navigate = useNavigate();
    const [form, setForm] = useState<FormState>(initialState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [guardando, setGuardando] = useState(false);
    const [errorGeneral, setErrorGeneral] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

    useEffect(() => {
        if (!mensajeExito) return;

        const timeout = window.setTimeout(() => {
            navigate("/pacientes");
        }, 1200);

        return () => window.clearTimeout(timeout);
    }, [mensajeExito, navigate]);

    const validar = () => {
        const nextErrors: FormErrors = {};
        const requiredFields: Array<[keyof FormState, string]> = [
            ["rut", "El RUT del paciente es obligatorio."],
            ["nombre", "El nombre del paciente es obligatorio."],
            ["apellido", "El apellido del paciente es obligatorio."],
            ["fecha_nacimiento", "La fecha de nacimiento es obligatoria."],
            ["sexo_biologico", "El sexo biológico es obligatorio."],
            ["direccion", "La dirección del paciente es obligatoria."],
            ["sector", "El sector es obligatorio."],
            ["comuna", "La comuna es obligatoria."],
            ["prevision", "La previsión es obligatoria."],
            ["fecha_inscripcion", "La fecha de inscripción es obligatoria."],
            ["tutor_rut", "El RUT del tutor es obligatorio."],
            ["tutor_nombre", "El nombre del tutor es obligatorio."],
            ["tutor_apellido", "El apellido del tutor es obligatorio."],
            ["tutor_telefono", "El teléfono del tutor es obligatorio."],
            ["tutor_parentesco", "El parentesco es obligatorio."],
            ["tutor_direccion", "La dirección del tutor es obligatoria."],
            ["tutor_comuna", "La comuna del tutor es obligatoria."],
        ];

        requiredFields.forEach(([field, message]) => {
            const value = form[field];
            if (typeof value === "string" && !value.trim()) {
                nextErrors[field] = message;
            }
        });

        if (form.es_poblacion_trans) {
            if (!form.nombre_social.trim()) {
                nextErrors.nombre_social = "El nombre social es obligatorio cuando se marca población trans.";
            }
            if (!form.identidad_genero.trim()) {
                nextErrors.identidad_genero = "La identidad de género es obligatoria cuando se marca población trans.";
            }
        }

        // El correo del tutor es opcional; solo se valida el formato si se ingresó algo.
        if (form.tutor_correo.trim() && !/^\S+@\S+\.\S+$/.test(form.tutor_correo.trim())) {
            nextErrors.tutor_correo = "Ingresa un correo válido.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const actualizarCampo = (campo: keyof FormState, valor: FormFieldValue) => {
        setForm((anterior) => ({ ...anterior, [campo]: valor }));
        setErrors((anterior) => {
            if (!anterior[campo]) return anterior;
            const siguiente = { ...anterior };
            delete siguiente[campo];
            return siguiente;
        });
    };

    const actualizarRut = (campo: "rut" | "tutor_rut", valorCrudo: string) => {
        actualizarCampo(campo, formatearRut(valorCrudo));
    };

    function formatearTelefono(valor: string): string {
        const PREFIJO = "+569";

        // Si el valor entrante es más corto que el prefijo (el usuario borró parte de él),
        // simplemente volvemos al prefijo completo, sin intentar rescatar dígitos sueltos.
        if (valor.length <= PREFIJO.length) {
            return PREFIJO;
        }

        // A partir de acá, el valor es al menos tan largo como el prefijo.
        // Tomamos solo lo que viene después, filtramos que sean dígitos, y limitamos a 8.
        const resto = valor.slice(PREFIJO.length).replace(/[^0-9]/g, "");
        return PREFIJO + resto.slice(0, 8);
    }

    const payload = useMemo(() => ({
        paciente: {
            rut: form.rut.trim(),
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            fecha_nacimiento: form.fecha_nacimiento,
            sexo_biologico: form.sexo_biologico.trim(),
            nacionalidad: form.nacionalidad.trim() || "Chilena",
            direccion: form.direccion.trim(),
            sector: form.sector.trim(),
            comuna: form.comuna.trim(),
            prevision: form.prevision.trim(),
            fecha_inscripcion: form.fecha_inscripcion,
            es_sename: form.es_sename,
            es_naneas_prematuro: form.es_naneas_prematuro,
            es_migrante: form.es_migrante,
            es_poblacion_trans: form.es_poblacion_trans,
            nombre_social: form.es_poblacion_trans ? form.nombre_social.trim() : "",
            identidad_genero: form.es_poblacion_trans ? form.identidad_genero.trim() : "",
        },
        tutor: {
            rut: form.tutor_rut.trim(),
            nombre: form.tutor_nombre.trim(),
            apellido: form.tutor_apellido.trim(),
            telefono: form.tutor_telefono.trim(),
            parentesco: form.tutor_parentesco.trim(),
            correo: form.tutor_correo.trim(),
            direccion: form.tutor_direccion.trim(),
            comuna: form.tutor_comuna.trim(),
        },
    }), [form]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorGeneral("");
        setMensajeExito("");

        if (!validar()) return;

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        setGuardando(true);

        try {
            const response = await fetch(`${API_BASE_URL}/pacientes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const backendMessage = data?.detalle || data?.error || "No fue posible inscribir al paciente.";

                if (response.status === 400) {
                    if (data?.error === 'RUT duplicado') {
                        setErrorGeneral("Ya existe un paciente registrado con ese RUT. Verifica el número ingresado.");
                        setErrors(prev => ({ ...prev, rut: "Este RUT ya está registrado." }));

                    } else {
                        setErrorGeneral(backendMessage);
                    }
                } else if (response.status === 500) {
                    setErrorGeneral("Error interno del servidor. Intenta nuevamente o contacta al administrador.");
                } else {
                    setErrorGeneral(backendMessage);
                }
                return;
            }

            setMensajeExito("Paciente inscrito con éxito. Redirigiendo a la lista...");
        } catch (error) {
            setErrorGeneral(error instanceof Error ? error.message : "No se pudo conectar con el servidor.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Nuevo registro</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Inscripción de Paciente</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Completa los datos del paciente y de su tutor para crear el expediente inicial.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => navigate("/pacientes")}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="inscribir-paciente-form"
                        disabled={guardando}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {guardando ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>

            {errorGeneral && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-bold">No se pudo completar la inscripción</p>
                        <p className="text-sm font-medium">{errorGeneral}</p>
                    </div>
                </div>
            )}

            {mensajeExito && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-bold">Inscripción completada</p>
                        <p className="text-sm font-medium">{mensajeExito}</p>
                    </div>
                </div>
            )}

            <form id="inscribir-paciente-form" onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><UserRound className="h-6 w-6" /></div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Datos del paciente</h2>
                                <p className="text-sm font-medium text-slate-500">Información clínica y administrativa básica.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">RUT *</label>
                                <input
                                    type="text"
                                    value={form.rut}
                                    onChange={(e) => actualizarRut("rut", e.target.value)}
                                    className={fieldClass(Boolean(errors.rut))}
                                    placeholder="12345678-9"
                                    maxLength={10}
                                />
                                {errors.rut && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.rut}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Fecha de nacimiento *</label>
                                <input type="date" value={form.fecha_nacimiento} onChange={(e) => actualizarCampo("fecha_nacimiento", e.target.value)} className={fieldClass(Boolean(errors.fecha_nacimiento))} />
                                {errors.fecha_nacimiento && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.fecha_nacimiento}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Nombre *</label>
                                <input type="text" value={form.nombre} onChange={(e) => actualizarCampo("nombre", e.target.value)} className={fieldClass(Boolean(errors.nombre))} placeholder="Nombre" />
                                {errors.nombre && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.nombre}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Apellido *</label>
                                <input type="text" value={form.apellido} onChange={(e) => actualizarCampo("apellido", e.target.value)} className={fieldClass(Boolean(errors.apellido))} placeholder="Apellido" />
                                {errors.apellido && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.apellido}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Sexo biológico *</label>
                                <select value={form.sexo_biologico} onChange={(e) => actualizarCampo("sexo_biologico", e.target.value)} className={fieldClass(Boolean(errors.sexo_biologico))}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                </select>
                                {errors.sexo_biologico && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.sexo_biologico}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Nacionalidad</label>
                                <select value={form.nacionalidad} onChange={(e) => actualizarCampo("nacionalidad", e.target.value)} className={fieldClass(Boolean(errors.nacionalidad))}>
                                    <option value="Chilena">Chilena</option>
                                    <option value="Venezolana">Venezolana</option>
                                    <option value="Peruana">Peruana</option>
                                    <option value="Colombiana">Colombiana</option>
                                    <option value="Boliviana">Boliviana</option>
                                    <option value="Argentina">Argentina</option>
                                    <option value="Haitiana">Haitiana</option>
                                    <option value="Ecuatoriana">Ecuatoriana</option>
                                    <option value="Otra">Otra</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Dirección *</label>
                                <input type="text" value={form.direccion} onChange={(e) => actualizarCampo("direccion", e.target.value)} className={fieldClass(Boolean(errors.direccion))} placeholder="Calle, número, villa" />
                                {errors.direccion && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.direccion}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Sector *</label>
                                <select value={form.sector} onChange={(e) => actualizarCampo("sector", e.target.value)} className={fieldClass(Boolean(errors.sector))}>
                                    <option value="">Seleccionar...</option>
                                    {OPCIONES_SECTOR.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                {errors.sector && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.sector}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Comuna *</label>
                                <select value={form.comuna} onChange={(e) => actualizarCampo("comuna", e.target.value)} className={fieldClass(Boolean(errors.comuna))}>
                                    <option value="">Seleccionar...</option>
                                    {OPCIONES_COMUNA.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                {errors.comuna && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.comuna}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Previsión *</label>
                                <select value={form.prevision} onChange={(e) => actualizarCampo("prevision", e.target.value)} className={fieldClass(Boolean(errors.prevision))}>
                                    <option value="">Seleccionar...</option>
                                    <option value="FONASA">FONASA</option>
                                    <option value="ISAPRE">ISAPRE</option>
                                    <option value="FFAA">FFAA</option>
                                    <option value="Sin previsión">Sin previsión</option>
                                </select>
                                {errors.prevision && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.prevision}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Fecha de inscripción *</label>
                                <input type="date" value={form.fecha_inscripcion} onChange={(e) => actualizarCampo("fecha_inscripcion", e.target.value)} className={fieldClass(Boolean(errors.fecha_inscripcion))} />
                                {errors.fecha_inscripcion && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.fecha_inscripcion}</span>}
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
                                <ShieldAlert className="h-4 w-4 text-blue-700" />
                                Riesgos sociales
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                                    <input type="checkbox" checked={form.es_sename} onChange={(e) => actualizarCampo("es_sename", e.target.checked)} className={checkboxClass} />
                                    Es SENAME
                                </label>
                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                                    <input type="checkbox" checked={form.es_naneas_prematuro} onChange={(e) => actualizarCampo("es_naneas_prematuro", e.target.checked)} className={checkboxClass} />
                                    Es NANEAS / Prematuro
                                </label>
                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                                    <input type="checkbox" checked={form.es_migrante} onChange={(e) => actualizarCampo("es_migrante", e.target.checked)} className={checkboxClass} />
                                    Es migrante
                                </label>
                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                                    <input type="checkbox" checked={form.es_poblacion_trans} onChange={(e) => actualizarCampo("es_poblacion_trans", e.target.checked)} className={checkboxClass} />
                                    Es población trans
                                </label>
                            </div>

                            {form.es_poblacion_trans && (
                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Nombre social *</label>
                                        <input type="text" value={form.nombre_social} onChange={(e) => actualizarCampo("nombre_social", e.target.value)} className={fieldClass(Boolean(errors.nombre_social))} placeholder="Nombre social" />
                                        {errors.nombre_social && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.nombre_social}</span>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Identidad de género *</label>
                                        <input type="text" value={form.identidad_genero} onChange={(e) => actualizarCampo("identidad_genero", e.target.value)} className={fieldClass(Boolean(errors.identidad_genero))} placeholder="Identidad de género" />
                                        {errors.identidad_genero && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.identidad_genero}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><UsersRound className="h-6 w-6" /></div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Datos del tutor</h2>
                                <p className="text-sm font-medium text-slate-500">Persona responsable del paciente.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">RUT *</label>
                                <input
                                    type="text"
                                    value={form.tutor_rut}
                                    onChange={(e) => actualizarRut("tutor_rut", e.target.value)}
                                    className={fieldClass(Boolean(errors.tutor_rut))}
                                    placeholder="12345678-9"
                                    maxLength={10}
                                />
                                {errors.tutor_rut && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_rut}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Teléfono *</label>
                                <input
                                    type="text"
                                    value={form.tutor_telefono}
                                    onChange={(e) => actualizarCampo("tutor_telefono", formatearTelefono(e.target.value))}
                                    className={fieldClass(Boolean(errors.tutor_telefono))}
                                    placeholder="+56912345678"
                                    maxLength={12}
                                />
                                {errors.tutor_telefono && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_telefono}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Nombre *</label>
                                <input type="text" value={form.tutor_nombre} onChange={(e) => actualizarCampo("tutor_nombre", e.target.value)} className={fieldClass(Boolean(errors.tutor_nombre))} placeholder="Nombre" />
                                {errors.tutor_nombre && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_nombre}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Apellido *</label>
                                <input type="text" value={form.tutor_apellido} onChange={(e) => actualizarCampo("tutor_apellido", e.target.value)} className={fieldClass(Boolean(errors.tutor_apellido))} placeholder="Apellido" />
                                {errors.tutor_apellido && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_apellido}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Parentesco *</label>
                                <select value={form.tutor_parentesco} onChange={(e) => actualizarCampo("tutor_parentesco", e.target.value)} className={fieldClass(Boolean(errors.tutor_parentesco))}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Madre">Madre</option>
                                    <option value="Padre">Padre</option>
                                    <option value="Abuela/o">Abuela/o</option>
                                    <option value="Tutor legal">Tutor legal</option>
                                    <option value="Otro familiar">Otro familiar</option>
                                </select>
                                {errors.tutor_parentesco && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_parentesco}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Correo</label>
                                <input type="email" value={form.tutor_correo} onChange={(e) => actualizarCampo("tutor_correo", e.target.value)} className={fieldClass(Boolean(errors.tutor_correo))} placeholder="correo@dominio.cl (opcional)" />
                                {errors.tutor_correo && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_correo}</span>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Dirección *</label>
                                <input type="text" value={form.tutor_direccion} onChange={(e) => actualizarCampo("tutor_direccion", e.target.value)} className={fieldClass(Boolean(errors.tutor_direccion))} placeholder="Dirección del tutor" />
                                {errors.tutor_direccion && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_direccion}</span>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Comuna *</label>
                                <select value={form.tutor_comuna} onChange={(e) => actualizarCampo("tutor_comuna", e.target.value)} className={fieldClass(Boolean(errors.tutor_comuna))}>
                                    <option value="">Seleccionar...</option>
                                    {OPCIONES_COMUNA.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                {errors.tutor_comuna && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_comuna}</span>}
                            </div>
                        </div>
                    </section>
                </div>

            </form>
        </div>
    );
}