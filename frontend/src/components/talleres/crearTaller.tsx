import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { API_BASE_URL } from '../../service/api';

type FormState = {
    nombre: string;
    descripcion: string;
    edad_min: string;
    edad_max: string;
};

const initialState: FormState = {
    nombre: "",
    descripcion: "",
    edad_min: "0",
    edad_max: "17",
};

const fieldClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 ${hasError
        ? "border-red-400 ring-4 ring-red-50"
        : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-white"
    }`;

export default function CrearTaller() {
    const navigate = useNavigate();
    const [form, setForm] = useState<FormState>(initialState);
    const [errorCampo, setErrorCampo] = useState<Partial<Record<keyof FormState, string>>>({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [guardando, setGuardando] = useState(false);

    const actualizarCampo = (campo: keyof FormState, valor: string) => {
        setForm((anterior) => ({ ...anterior, [campo]: valor }));
        setErrorCampo((anterior) => {
            if (!anterior[campo]) return anterior;
            const siguiente = { ...anterior };
            delete siguiente[campo];
            return siguiente;
        });
    };

    // Replica las mismas reglas que taller.controller.ts (Tema 1 y 3)
    const validar = (): boolean => {
        const nextErrors: Partial<Record<keyof FormState, string>> = {};

        if (!form.nombre.trim()) {
            nextErrors.nombre = "El nombre del taller es obligatorio.";
        }

        const edadMin = parseInt(form.edad_min);
        const edadMax = parseInt(form.edad_max);

        if (form.edad_min.trim() !== "" && (isNaN(edadMin) || edadMin < 0)) {
            nextErrors.edad_min = "La edad mínima debe ser un número entero mayor o igual a cero.";
        }

        if (form.edad_max.trim() !== "" && (isNaN(edadMax) || edadMax < 0)) {
            nextErrors.edad_max = "La edad máxima debe ser un número entero mayor o igual a cero.";
        }

        // mismos defaults del schema (0 y 17) cuando falta uno de los dos
        const minEfectiva = form.edad_min.trim() !== "" && !isNaN(edadMin) ? edadMin : 0;
        const maxEfectiva = form.edad_max.trim() !== "" && !isNaN(edadMax) ? edadMax : 17;

        if (!nextErrors.edad_min && !nextErrors.edad_max && minEfectiva > maxEfectiva) {
            nextErrors.edad_max = "La edad máxima no puede ser menor que la edad mínima.";
        }

        setErrorCampo(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorGeneral("");

        if (!validar()) return;

        setGuardando(true);
        try {
            const token = localStorage.getItem("token");

            const payload = {
                nombre: form.nombre.trim(),
                descripcion: form.descripcion.trim() || null,
                edad_min: form.edad_min.trim() !== "" ? Number(form.edad_min) : undefined,
                edad_max: form.edad_max.trim() !== "" ? Number(form.edad_max) : undefined,
            };

            const respuesta = await fetch(`${API_BASE_URL}/talleres`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                // acá llega, por ejemplo, el 409 de nombre duplicado que el cliente no puede anticipar (Tema 3)
                throw new Error(data?.error || "No fue posible crear el taller.");
            }

            navigate("/talleres");
        } catch (err) {
            setErrorGeneral(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="max-w-xl">
            <button
                type="button"
                onClick={() => navigate("/talleres")}
                className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </button>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h1 className="text-lg font-semibold text-slate-800">Nuevo taller</h1>

                {errorGeneral && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
                        {errorGeneral}
                    </div>
                )}

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
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
                    <textarea
                        value={form.descripcion}
                        onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                        className={fieldClass(false)}
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Edad mínima</label>
                        <input
                            type="number"
                            value={form.edad_min}
                            onChange={(e) => actualizarCampo("edad_min", e.target.value)}
                            className={fieldClass(!!errorCampo.edad_min)}
                        />
                        {errorCampo.edad_min && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.edad_min}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Edad máxima</label>
                        <input
                            type="number"
                            value={form.edad_max}
                            onChange={(e) => actualizarCampo("edad_max", e.target.value)}
                            className={fieldClass(!!errorCampo.edad_max)}
                        />
                        {errorCampo.edad_max && <p className="mt-1 text-xs font-semibold text-red-600">{errorCampo.edad_max}</p>}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={guardando}
                    className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm disabled:opacity-50"
                >
                    {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar
                </button>
            </form>
        </div>
    );
}
