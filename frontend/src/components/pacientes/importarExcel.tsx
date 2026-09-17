import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Upload,
    FileSpreadsheet,
    Loader2,
    CheckCircle2,
    CircleAlert,
    TriangleAlert,
    Check,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { API_BASE_URL } from "../../service/api";

interface ResumenImportacion {
    modo_simulacion: boolean;
    total_filas_leidas: number;
    creados: number;
    actualizados: number;
    detalle_creados: { rut: string; nombre: string }[];
    detalle_actualizados: { rut: string }[];
    errores: { rut: string; motivo: string }[];
}

type Paso = "idle" | "procesando" | "preview" | "aplicando" | "listo";

const PASOS = [
    { id: 1, label: "Subir archivo" },
    { id: 2, label: "Revisar resultado" },
    { id: 3, label: "Confirmar cambios" },
];

function pasoActualNumero(paso: Paso): number {
    if (paso === "idle" || paso === "procesando") return 1;
    if (paso === "preview" || paso === "aplicando") return 2;
    return 3;
}

function formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImportarExcel() {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const [archivo, setArchivo] = useState<File | null>(null);
    const [paso, setPaso] = useState<Paso>("idle");
    const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
    const [confirmAbierto, setConfirmAbierto] = useState(false);
    const [error, setError] = useState("");
    const [arrastrando, setArrastrando] = useState(false);
    const [gruposAbiertos, setGruposAbiertos] = useState<Set<string>>(new Set());

    const pasoNumero = pasoActualNumero(paso);

    // Agrupa errores repetidos ("Falta nombre o fecha..." x25) en un solo bloque
    // con contador, en vez de mostrar la misma frase muchas veces seguidas.
    const erroresAgrupados = useMemo(() => {
        if (!resumen) return [];
        const grupos = resumen.errores.reduce<Record<string, string[]>>((acc, e) => {
            (acc[e.motivo] ||= []).push(e.rut);
            return acc;
        }, {});
        return Object.entries(grupos)
            .map(([motivo, ruts]) => ({ motivo, ruts }))
            .sort((a, b) => b.ruts.length - a.ruts.length);
    }, [resumen]);

    const alternarGrupo = (motivo: string) => {
        setGruposAbiertos((anterior) => {
            const siguiente = new Set(anterior);
            if (siguiente.has(motivo)) siguiente.delete(motivo);
            else siguiente.add(motivo);
            return siguiente;
        });
    };

    const elegirArchivo = (f: File | null) => {
        if (!f) return;
        if (!f.name.toLowerCase().endsWith(".xlsx")) {
            setError("Solo se aceptan archivos .xlsx.");
            return;
        }
        setError("");
        setArchivo(f);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setArrastrando(false);
        elegirArchivo(e.dataTransfer.files?.[0] || null);
    };

    const enviar = async (dryRun: boolean) => {
        if (!archivo) return;

        setError("");
        setPaso(dryRun ? "procesando" : "aplicando");

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("archivo", archivo);
            formData.append("dryRun", dryRun ? "true" : "false");

            const response = await fetch(`${API_BASE_URL}/importacion/excel`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data?.detalle || data?.error || "No se pudo procesar el archivo.");
                setPaso(dryRun ? "idle" : "preview");
                return;
            }

            setResumen(data.resumen);
            setPaso(dryRun ? "preview" : "listo");
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
            setPaso(dryRun ? "idle" : "preview");
        }
    };

    const confirmarGuardado = () => {
        setConfirmAbierto(false);
        enviar(false);
    };

    const reiniciar = () => {
        setArchivo(null);
        setPaso("idle");
        setResumen(null);
        setError("");
        setGruposAbiertos(new Set());
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="mx-auto max-w-[860px] space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Importar planilla Excel</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Actualiza pacientes existentes y crea los que falten, a partir del catastro NANEAS/TEA.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/pacientes")}
                        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </button>
                </div>

                {/* Indicador de pasos */}
                <div className="mt-6 flex items-center">
                    {PASOS.map((p, i) => {
                        const estado = p.id < pasoNumero ? "done" : p.id === pasoNumero ? "active" : "upcoming";
                        return (
                            <div key={p.id} className="flex flex-1 items-center last:flex-none">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${estado === "done"
                                            ? "bg-blue-700 text-white"
                                            : estado === "active"
                                                ? "border-2 border-blue-700 bg-blue-50 text-blue-700"
                                                : "bg-slate-100 text-slate-400"
                                            }`}
                                    >
                                        {estado === "done" ? <Check className="h-4 w-4" /> : p.id}
                                    </div>
                                    <span
                                        className={`hidden text-sm font-bold sm:inline ${estado === "upcoming" ? "text-slate-400" : "text-slate-700"
                                            }`}
                                    >
                                        {p.label}
                                    </span>
                                </div>
                                {i < PASOS.length - 1 && (
                                    <div className={`mx-3 h-0.5 flex-1 ${p.id < pasoNumero ? "bg-blue-700" : "bg-slate-200"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Paso 1: carga */}
            {(paso === "idle" || paso === "procesando") && (
                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                    {paso === "procesando" ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                            <Loader2 className="h-9 w-9 animate-spin text-blue-700" />
                            <p className="text-sm font-bold text-slate-700">Analizando {archivo?.name}…</p>
                        </div>
                    ) : (
                        <>
                            {!archivo ? (
                                <div
                                    onClick={() => inputRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setArrastrando(true);
                                    }}
                                    onDragLeave={() => setArrastrando(false)}
                                    onDrop={onDrop}
                                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed px-6 py-12 text-center transition-colors ${arrastrando ? "border-blue-700 bg-blue-50" : "border-slate-300 hover:border-blue-700 hover:bg-blue-50"
                                        }`}
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <p className="text-base font-bold text-slate-800">Arrastra tu archivo aquí</p>
                                    <p className="text-sm font-medium text-slate-500">o haz clic para buscar en tu computador</p>
                                    <p className="text-xs font-semibold text-slate-400">
                                        Formato .xlsx — hojas "NANEAS" y "TEA" con encabezados originales
                                    </p>
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={(e) => elegirArchivo(e.target.files?.[0] || null)}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-5 py-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                        <FileSpreadsheet className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-emerald-900">{archivo.name}</p>
                                        <p className="text-xs font-semibold text-emerald-700">{formatearTamano(archivo.size)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={reiniciar}
                                        className="shrink-0 text-sm font-bold text-blue-700 hover:text-blue-800 hover:underline"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => enviar(true)}
                                disabled={!archivo}
                                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Analizar archivo
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Paso 2/3: aplicando */}
            {paso === "aplicando" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                        <Loader2 className="h-9 w-9 animate-spin text-blue-700" />
                        <p className="text-sm font-bold text-slate-700">Guardando cambios en la base de datos…</p>
                    </div>
                </div>
            )}

            {/* Paso 2: preview / Paso 3: listo */}
            {(paso === "preview" || paso === "listo") && resumen && (
                <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                    {paso === "preview" ? (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                            <p className="text-sm font-bold">
                                Vista previa — todavía no se ha guardado nada. Revisa los datos y confirma para aplicar los cambios.
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                            <p className="text-sm font-bold">Cambios guardados correctamente en la base de datos.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                            <p className="text-[22px] font-black text-slate-900">{resumen.total_filas_leidas}</p>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Filas leídas</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-4 text-center">
                            <p className="text-[22px] font-black text-blue-700">{resumen.actualizados}</p>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Actualizados</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-4 text-center">
                            <p className="text-[22px] font-black text-emerald-700">{resumen.creados}</p>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Creados</p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-4 text-center">
                            <p className="text-[22px] font-black text-red-700">{resumen.errores.length}</p>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Errores</p>
                        </div>
                    </div>

                    {resumen.detalle_creados.length > 0 && (
                        <div>
                            <h3 className="mb-2 text-sm font-bold text-slate-800">
                                Pacientes que se {paso === "preview" ? "crearían" : "crearon"}
                            </h3>
                            <div className="max-h-[180px] overflow-y-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <tbody className="divide-y divide-slate-100">
                                        {resumen.detalle_creados.map((p) => (
                                            <tr key={p.rut}>
                                                <td className="px-4 py-2 font-semibold text-slate-700">{p.rut}</td>
                                                <td className="px-4 py-2 text-slate-600">{p.nombre}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {resumen.errores.length > 0 && (
                        <div>
                            <h3 className="mb-2 text-sm font-bold text-red-700">Errores ({resumen.errores.length})</h3>
                            <div className="space-y-2">
                                {erroresAgrupados.map(({ motivo, ruts }) => {
                                    const abierto = gruposAbiertos.has(motivo);
                                    return (
                                        <div key={motivo} className="overflow-hidden rounded-xl border border-red-200">
                                            <button
                                                type="button"
                                                onClick={() => alternarGrupo(motivo)}
                                                className="flex w-full items-center justify-between gap-3 bg-red-50 px-4 py-3 text-left transition hover:bg-red-100"
                                            >
                                                <span className="text-sm font-semibold text-red-800">{motivo}</span>
                                                <span className="flex shrink-0 items-center gap-2">
                                                    <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-bold text-red-700">
                                                        {ruts.length}
                                                    </span>
                                                    {abierto ? (
                                                        <ChevronDown className="h-4 w-4 text-red-700" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-red-700" />
                                                    )}
                                                </span>
                                            </button>
                                            {abierto && (
                                                <div className="flex flex-wrap gap-2 bg-white px-4 py-3">
                                                    {ruts.map((r) => (
                                                        <span
                                                            key={r}
                                                            className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                                                        >
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                        <button
                            type="button"
                            onClick={reiniciar}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                            {paso === "preview" ? "Elegir otro archivo" : "Importar otro archivo"}
                        </button>
                        {paso === "preview" && (
                            <button
                                type="button"
                                onClick={() => setConfirmAbierto(true)}
                                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800"
                            >
                                Confirmar y guardar cambios
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de confirmación */}
            {confirmAbierto && resumen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
                    <div className="w-full max-w-[380px] rounded-2xl bg-white p-7 shadow-xl">
                        <h2 className="text-lg font-black text-slate-900">¿Confirmar importación?</h2>
                        <p className="mt-2 text-sm font-medium text-slate-600">
                            Se crearán <span className="font-bold text-slate-900">{resumen.creados}</span> pacientes nuevos y se
                            actualizarán <span className="font-bold text-slate-900">{resumen.actualizados}</span> existentes. Esta
                            acción escribirá los cambios en la base de datos.
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={confirmarGuardado}
                                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800"
                            >
                                Sí, guardar cambios
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmAbierto(false)}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
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