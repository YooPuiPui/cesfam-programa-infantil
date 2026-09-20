import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, UserRound, UsersRound, UserCheck, ShieldAlert, CheckCircle2, CircleAlert } from "lucide-react";
import { API_BASE_URL } from '../../service/api';

type FormFieldValue = string | boolean;

type FormState = {
    id_paciente: number | null;
    id_tutor: number | null;
    rut: string;
    nombre: string;
    apellido: string;
    sexo_biologico: string;
    nacionalidad: string;
    direccion: string;
    sector: string;
    comuna: string;
    prevision: string;
    es_sename: boolean;
    es_naneas_prematuro: boolean;
    es_migrante: boolean;
    es_poblacion_trans: boolean;
    nombre_social: string;
    identidad_genero: string;
    dx_tea: boolean;
    dx_epilepsia: boolean;
    dx_tgd: boolean;
    dx_sindrome_down: boolean;
    dx_paralisis_cerebral: boolean;
    dx_otro: boolean;
    dx_otro_texto: string;
    es_salud_mental: boolean;
    credencial_discapacidad: string;
    credencial_discapacidad_detalle: string;
    cuidador_nombre: string;
    cuidador_telefono: string;
    cuidador_parentesco: string;
    tutor_nombre: string;
    tutor_apellido: string;
    tutor_telefono: string;
    tutor_telefono_secundario: string;
    tutor_parentesco: string;
    tutor_correo: string;
    tutor_direccion: string;
    tutor_sector: string;
    tutor_comuna: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const OPCIONES_SECTOR = ["Sector 1 - Azul", "Sector 2 - Rojo"];
const OPCIONES_COMUNA = ["Concepción"];
const OPCIONES_PARENTESCO = ["Madre", "Padre", "Abuela/o", "Tutor legal", "Otro familiar"];

const DIAGNOSTICOS_CONOCIDOS = [
    { campo: "dx_tea" as const, nombre: "TEA" },
    { campo: "dx_epilepsia" as const, nombre: "Epilepsia" },
    { campo: "dx_tgd" as const, nombre: "Trastornos Generalizados del Desarrollo" },
    { campo: "dx_sindrome_down" as const, nombre: "Síndrome de Down" },
    { campo: "dx_paralisis_cerebral" as const, nombre: "Parálisis Cerebral" },
];

const initialState: FormState = {
    id_paciente: null,
    id_tutor: null,
    rut: "",
    nombre: "",
    apellido: "",
    sexo_biologico: "",
    nacionalidad: "Chilena",
    direccion: "",
    sector: "",
    comuna: "Concepción",
    prevision: "",
    es_sename: false,
    es_naneas_prematuro: false,
    es_migrante: false,
    es_poblacion_trans: false,
    nombre_social: "",
    identidad_genero: "",
    dx_tea: false,
    dx_epilepsia: false,
    dx_tgd: false,
    dx_sindrome_down: false,
    dx_paralisis_cerebral: false,
    dx_otro: false,
    dx_otro_texto: "",
    es_salud_mental: false,
    credencial_discapacidad: "sin_dato",
    credencial_discapacidad_detalle: "",
    cuidador_nombre: "",
    cuidador_telefono: "",
    cuidador_parentesco: "",
    tutor_nombre: "",
    tutor_apellido: "",
    tutor_telefono: "",
    tutor_telefono_secundario: "",
    tutor_parentesco: "",
    tutor_correo: "",
    tutor_direccion: "",
    tutor_sector: "",
    tutor_comuna: "",
};

const fieldClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 ${hasError
        ? "border-red-400 ring-4 ring-red-50"
        : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-white"
    }`;

const fieldClassDisabled =
    "w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-400 outline-none cursor-not-allowed";

const checkboxClass = "h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600";

export default function EditarPaciente() {
    const navigate = useNavigate();
    const { rut } = useParams();

    const [form, setForm] = useState<FormState>(initialState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [errorGeneral, setErrorGeneral] = useState("");
    const [errorCarga, setErrorCarga] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

    useEffect(() => {
        const cargarPaciente = async () => {
            if (!rut) {
                setErrorCarga("No se detectó RUT en la URL.");
                setCargando(false);
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/pacientes/rut/${rut}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("No se pudo cargar la ficha del paciente.");
                const p = await response.json();

                const diagnosticosExistentes: string[] = Array.isArray(p.diagnosticos) ? p.diagnosticos : [];
                const nombresConocidos = DIAGNOSTICOS_CONOCIDOS.map((d) => d.nombre);
                const desconocidos = diagnosticosExistentes.filter((d) => !nombresConocidos.includes(d));

                setForm({
                    id_paciente: p.id_paciente,
                    id_tutor: p.tutor?.id_tutor ?? null,
                    rut: p.rut ?? "",
                    nombre: p.nombre ?? "",
                    apellido: p.apellido ?? "",
                    sexo_biologico: p.sexo_biologico ?? "",
                    nacionalidad: p.nacionalidad ?? "Chilena",
                    direccion: p.direccion ?? "",
                    sector: p.sector ?? "",
                    comuna: p.comuna ?? "Concepción",
                    prevision: p.prevision ?? "",
                    es_sename: Boolean(p.es_sename),
                    es_naneas_prematuro: Boolean(p.es_naneas_prematuro),
                    es_migrante: Boolean(p.es_migrante),
                    es_poblacion_trans: Boolean(p.es_poblacion_trans),
                    nombre_social: p.nombre_social ?? "",
                    identidad_genero: p.identidad_genero ?? "",
                    dx_tea: diagnosticosExistentes.includes("TEA"),
                    dx_epilepsia: diagnosticosExistentes.includes("Epilepsia"),
                    dx_tgd: diagnosticosExistentes.includes("Trastornos Generalizados del Desarrollo"),
                    dx_sindrome_down: diagnosticosExistentes.includes("Síndrome de Down"),
                    dx_paralisis_cerebral: diagnosticosExistentes.includes("Parálisis Cerebral"),
                    dx_otro: desconocidos.length > 0,
                    dx_otro_texto: desconocidos.join(", "),
                    es_salud_mental: Boolean(p.es_salud_mental),
                    credencial_discapacidad: p.credencial_discapacidad ?? "sin_dato",
                    credencial_discapacidad_detalle: p.credencial_discapacidad_detalle ?? "",
                    cuidador_nombre: p.cuidador_nombre ?? "",
                    cuidador_telefono: p.cuidador_telefono ?? "",
                    cuidador_parentesco: p.cuidador_parentesco ?? "",
                    tutor_nombre: p.tutor?.nombre ?? "",
                    tutor_apellido: p.tutor?.apellido ?? "",
                    tutor_telefono: p.tutor?.telefono ?? "",
                    tutor_telefono_secundario: p.tutor?.telefono_secundario ?? "",
                    tutor_parentesco: p.tutor?.parentesco ?? "",
                    tutor_correo: p.tutor?.correo ?? "",
                    tutor_direccion: p.tutor?.direccion ?? "",
                    tutor_sector: p.tutor?.sector ?? "",
                    tutor_comuna: p.tutor?.comuna ?? "",
                });
            } catch (err) {
                setErrorCarga(err instanceof Error ? err.message : "Error al cargar el paciente.");
            } finally {
                setCargando(false);
            }
        };

        cargarPaciente();
    }, [rut]);

    useEffect(() => {
        if (!mensajeExito) return;
        const timeout = window.setTimeout(() => {
            navigate(`/ficha/${rut}`);
        }, 1200);
        return () => window.clearTimeout(timeout);
    }, [mensajeExito, navigate, rut]);

    const actualizarCampo = (campo: keyof FormState, valor: FormFieldValue) => {
        setForm((anterior) => ({ ...anterior, [campo]: valor }));
        setErrors((anterior) => {
            if (!anterior[campo]) return anterior;
            const siguiente = { ...anterior };
            delete siguiente[campo];
            return siguiente;
        });
    };

    const validar = () => {
        const nextErrors: FormErrors = {};
        const requiredFields: Array<[keyof FormState, string]> = [
            ["nombre", "El nombre del paciente es obligatorio."],
            ["apellido", "El apellido del paciente es obligatorio."],
            ["sexo_biologico", "El sexo biológico es obligatorio."],
            ["direccion", "La dirección del paciente es obligatoria."],
            ["sector", "El sector es obligatorio."],
            ["comuna", "La comuna es obligatoria."],
            ["prevision", "La previsión es obligatoria."],
            ["tutor_nombre", "El nombre del tutor es obligatorio."],
            ["tutor_apellido", "El apellido del tutor es obligatorio."],
            ["tutor_telefono", "El teléfono del tutor es obligatorio."],
            ["tutor_parentesco", "El parentesco del tutor es obligatorio."],
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

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const payload = useMemo(() => ({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        sexo_biologico: form.sexo_biologico.trim(),
        nacionalidad: form.nacionalidad.trim() || "Chilena",
        direccion: form.direccion.trim(),
        sector: form.sector.trim(),
        comuna: form.comuna.trim(),
        prevision: form.prevision.trim(),
        es_sename: form.es_sename,
        es_naneas_prematuro: form.es_naneas_prematuro,
        es_migrante: form.es_migrante,
        es_poblacion_trans: form.es_poblacion_trans,
        nombre_social: form.es_poblacion_trans ? form.nombre_social.trim() : "",
        identidad_genero: form.es_poblacion_trans ? form.identidad_genero.trim() : "",
        diagnosticos: [
            ...(form.dx_tea ? ["TEA"] : []),
            ...(form.dx_epilepsia ? ["Epilepsia"] : []),
            ...(form.dx_tgd ? ["Trastornos Generalizados del Desarrollo"] : []),
            ...(form.dx_sindrome_down ? ["Síndrome de Down"] : []),
            ...(form.dx_paralisis_cerebral ? ["Parálisis Cerebral"] : []),
            ...(form.dx_otro && form.dx_otro_texto.trim() ? [form.dx_otro_texto.trim()] : []),
        ],
        es_salud_mental: form.es_salud_mental,
        credencial_discapacidad: form.credencial_discapacidad,
        credencial_discapacidad_detalle: form.credencial_discapacidad !== "sin_dato" ? form.credencial_discapacidad_detalle.trim() : "",
        cuidador_nombre: form.cuidador_nombre.trim(),
        cuidador_telefono: form.cuidador_telefono.trim(),
        cuidador_parentesco: form.cuidador_parentesco.trim(),
    }), [form]);

    const payloadTutor = useMemo(() => ({
        nombre: form.tutor_nombre.trim(),
        apellido: form.tutor_apellido.trim(),
        telefono: form.tutor_telefono.trim(),
        telefono_secundario: form.tutor_telefono_secundario.trim() || null,
        parentesco: form.tutor_parentesco.trim(),
        correo: form.tutor_correo.trim(),
        direccion: form.tutor_direccion.trim(),
        sector: form.tutor_sector.trim(),
        comuna: form.tutor_comuna.trim(),
    }), [form]);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorGeneral("");
        setMensajeExito("");

        if (!validar()) return;
        if (!form.id_paciente) {
            setErrorGeneral("No se pudo determinar el id del paciente. Vuelve a intentarlo.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        setGuardando(true);
        try {
            const response = await fetch(`${API_BASE_URL}/pacientes/${form.id_paciente}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setErrorGeneral(data?.detalle || data?.error || "No fue posible guardar los cambios.");
                return;
            }

            if (form.id_tutor) {
                const responseTutor = await fetch(`${API_BASE_URL}/tutores/${form.id_tutor}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payloadTutor),
                });

                const dataTutor = await responseTutor.json().catch(() => ({}));

                if (!responseTutor.ok) {
                    setErrorGeneral(dataTutor?.detalle || dataTutor?.error || "Los datos del paciente se guardaron, pero no fue posible actualizar el tutor.");
                    return;
                }
            }

            setMensajeExito("Cambios guardados con éxito. Volviendo a la ficha...");
        } catch (error) {
            setErrorGeneral(error instanceof Error ? error.message : "No se pudo conectar con el servidor.");
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
            </div>
        );
    }

    if (errorCarga) {
        return (
            <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                {errorCarga}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Editar registro</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{form.nombre} {form.apellido}</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">RUT: <span className="text-slate-900 font-bold">{form.rut}</span></p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => navigate(`/ficha/${rut}`)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="editar-paciente-form"
                        disabled={guardando}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </div>

            {errorGeneral && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-bold">No se pudieron guardar los cambios</p>
                        <p className="text-sm font-medium">{errorGeneral}</p>
                    </div>
                </div>
            )}

            {mensajeExito && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-bold">Cambios guardados</p>
                        <p className="text-sm font-medium">{mensajeExito}</p>
                    </div>
                </div>
            )}

            <form id="editar-paciente-form" onSubmit={onSubmit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                    <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><UserRound className="h-6 w-6" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Datos del paciente</h2>
                            <p className="text-sm font-medium text-slate-500">El RUT y la fecha de nacimiento no se pueden editar aquí.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">RUT</label>
                            <input type="text" value={form.rut} disabled className={fieldClassDisabled} />
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
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Nombre *</label>
                            <input type="text" value={form.nombre} onChange={(e) => actualizarCampo("nombre", e.target.value)} className={fieldClass(Boolean(errors.nombre))} />
                            {errors.nombre && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.nombre}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Apellido *</label>
                            <input type="text" value={form.apellido} onChange={(e) => actualizarCampo("apellido", e.target.value)} className={fieldClass(Boolean(errors.apellido))} />
                            {errors.apellido && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.apellido}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Nacionalidad</label>
                            <select value={form.nacionalidad} onChange={(e) => actualizarCampo("nacionalidad", e.target.value)} className={fieldClass(false)}>
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
                            <input type="text" value={form.direccion} onChange={(e) => actualizarCampo("direccion", e.target.value)} className={fieldClass(Boolean(errors.direccion))} />
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
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Credencial de discapacidad</label>
                            <select value={form.credencial_discapacidad} onChange={(e) => actualizarCampo("credencial_discapacidad", e.target.value)} className={fieldClass(false)}>
                                <option value="sin_dato">Sin dato</option>
                                <option value="si">Sí</option>
                                <option value="no">No</option>
                                <option value="en_tramite">En trámite</option>
                            </select>
                        </div>
                        {form.credencial_discapacidad !== "sin_dato" && (
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Detalle (porcentaje, vigencia, etc.)</label>
                                <input type="text" value={form.credencial_discapacidad_detalle} onChange={(e) => actualizarCampo("credencial_discapacidad_detalle", e.target.value)} className={fieldClass(false)} placeholder="Ej: 35%, vigente hasta 2030" />
                            </div>
                        )}
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
                            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                                <input type="checkbox" checked={form.es_salud_mental} onChange={(e) => actualizarCampo("es_salud_mental", e.target.checked)} className={checkboxClass} />
                                Programa de salud mental
                            </label>
                        </div>

                        {form.es_poblacion_trans && (
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Nombre social *</label>
                                    <input type="text" value={form.nombre_social} onChange={(e) => actualizarCampo("nombre_social", e.target.value)} className={fieldClass(Boolean(errors.nombre_social))} />
                                    {errors.nombre_social && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.nombre_social}</span>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Identidad de género *</label>
                                    <input type="text" value={form.identidad_genero} onChange={(e) => actualizarCampo("identidad_genero", e.target.value)} className={fieldClass(Boolean(errors.identidad_genero))} />
                                    {errors.identidad_genero && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.identidad_genero}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
                            <ShieldAlert className="h-4 w-4 text-blue-700" />
                            Diagnósticos
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {DIAGNOSTICOS_CONOCIDOS.map(({ campo, nombre }) => (
                                <label key={campo} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                                    <input type="checkbox" checked={form[campo]} onChange={(e) => actualizarCampo(campo, e.target.checked)} className={checkboxClass} />
                                    {nombre}
                                </label>
                            ))}
                            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                                <input type="checkbox" checked={form.dx_otro} onChange={(e) => actualizarCampo("dx_otro", e.target.checked)} className={checkboxClass} />
                                Otro (especificar)
                            </label>
                        </div>
                        {form.dx_otro && (
                            <div className="mt-4">
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Especifica el diagnóstico</label>
                                <input type="text" value={form.dx_otro_texto} onChange={(e) => actualizarCampo("dx_otro_texto", e.target.value)} className={fieldClass(false)} placeholder="Nombre del diagnóstico" />
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                    <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><UserCheck className="h-6 w-6" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Tutor legal</h2>
                            <p className="text-sm font-medium text-slate-500">Guardar estos datos confirma al tutor como verificado.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Nombre *</label>
                            <input type="text" value={form.tutor_nombre} onChange={(e) => actualizarCampo("tutor_nombre", e.target.value)} className={fieldClass(Boolean(errors.tutor_nombre))} />
                            {errors.tutor_nombre && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_nombre}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Apellido *</label>
                            <input type="text" value={form.tutor_apellido} onChange={(e) => actualizarCampo("tutor_apellido", e.target.value)} className={fieldClass(Boolean(errors.tutor_apellido))} />
                            {errors.tutor_apellido && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_apellido}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Teléfono *</label>
                            <input type="text" value={form.tutor_telefono} onChange={(e) => actualizarCampo("tutor_telefono", e.target.value)} className={fieldClass(Boolean(errors.tutor_telefono))} placeholder="+56912345678" />
                            {errors.tutor_telefono && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_telefono}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Teléfono alternativo</label>
                            <input type="text" value={form.tutor_telefono_secundario} onChange={(e) => actualizarCampo("tutor_telefono_secundario", e.target.value)} className={fieldClass(false)} placeholder="+56912345678 (opcional)" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Parentesco *</label>
                            <select value={form.tutor_parentesco} onChange={(e) => actualizarCampo("tutor_parentesco", e.target.value)} className={fieldClass(Boolean(errors.tutor_parentesco))}>
                                <option value="">Seleccionar...</option>
                                {OPCIONES_PARENTESCO.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            {errors.tutor_parentesco && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_parentesco}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Correo (opcional)</label>
                            <input type="email" value={form.tutor_correo} onChange={(e) => actualizarCampo("tutor_correo", e.target.value)} className={fieldClass(false)} placeholder="correo@ejemplo.com" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Dirección *</label>
                            <input type="text" value={form.tutor_direccion} onChange={(e) => actualizarCampo("tutor_direccion", e.target.value)} className={fieldClass(Boolean(errors.tutor_direccion))} />
                            {errors.tutor_direccion && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.tutor_direccion}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Sector</label>
                            <select value={form.tutor_sector} onChange={(e) => actualizarCampo("tutor_sector", e.target.value)} className={fieldClass(false)}>
                                <option value="">Seleccionar...</option>
                                {OPCIONES_SECTOR.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
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

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                    <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><UsersRound className="h-6 w-6" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Cuidador (opcional)</h2>
                            <p className="text-sm font-medium text-slate-500">Solo si es distinto del tutor legal.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Nombre</label>
                            <input type="text" value={form.cuidador_nombre} onChange={(e) => actualizarCampo("cuidador_nombre", e.target.value)} className={fieldClass(false)} placeholder="Nombre del cuidador" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Teléfono</label>
                            <input type="text" value={form.cuidador_telefono} onChange={(e) => actualizarCampo("cuidador_telefono", e.target.value)} className={fieldClass(false)} placeholder="+56912345678" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Parentesco</label>
                            <input type="text" value={form.cuidador_parentesco} onChange={(e) => actualizarCampo("cuidador_parentesco", e.target.value)} className={fieldClass(false)} placeholder="Ej: tía, vecina, etc." />
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
}