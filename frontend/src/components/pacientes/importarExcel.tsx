import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, CheckCircle2, CircleAlert, TriangleAlert } from "lucide-react";
import { API_BASE_URL } from '../../service/api';

interface ResumenImportacion {
    modo_simulacion: boolean;
    total_filas_leidas: number;
    creados: number;
    actualizados: number;
    detalle_creados: { rut: string; nombre: string }[];
    detalle_actualizados: { rut: string }[];
    errores: { rut: string; motivo: string }[];
}

export default function ImportarExcel() {
    const navigate = useNavigate();
    const [archivo, setArchivo] = useState<File | null>(null);
    const [modoSimulacion, setModoSimulacion] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
    const [error, setError] = useState("");

    const onSubmit = async () => {
        if (!archivo) {
            setError("Selecciona un archivo Excel (.xlsx) primero.");
            return;
        }

        setError("");
        setResumen(null);
        setProcesando(true);

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("archivo", archivo);
            formData.append("dryRun", modoSimulacion ? "true" : "false");

            const response = await fetch(`${API_BASE_URL}/importacion/excel`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data?.detalle || data?.error || "No se pudo procesar el archivo.");
                return;
            }

            setResumen(data.resumen);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Datos NANEAS</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Importar planilla Excel</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Actualiza pacientes existentes y crea los que falten, a partir del catastro NANEAS/TEA.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/pacientes")}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-5">
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Archivo Excel (.xlsx)</label>
                    <input
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                    />
                    <p className="mt-1.5 text-xs font-medium text-slate-500">Debe tener las hojas "NANEAS" y "TEA" con sus encabezados originales.</p>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <input
                        type="checkbox"
                        checked={modoSimulacion}
                        onChange={(e) => setModoSimulacion(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span className="text-sm font-semibold text-amber-900">
                        Modo simulación (recomendado): muestra qué haría, sin guardar ningún cambio en la base de datos.
                        Desmárcalo solo cuando ya revisaste el resultado y quieres aplicar los cambios de verdad.
                    </span>
                </label>

                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={procesando}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {procesando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {procesando ? "Procesando..." : modoSimulacion ? "Simular importación" : "Importar y guardar cambios"}
                </button>

                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
            </div>

            {resumen && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
                    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${resumen.modo_simulacion ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                        {resumen.modo_simulacion ? <TriangleAlert className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
                        <p className="text-sm font-bold">
                            {resumen.modo_simulacion ? 'Esto fue una simulación — no se guardó nada todavía.' : 'Cambios guardados en la base de datos.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                            <p className="text-2xl font-black text-slate-900">{resumen.total_filas_leidas}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">Filas leídas</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-4 text-center">
                            <p className="text-2xl font-black text-blue-700">{resumen.actualizados}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">Actualizados</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-4 text-center">
                            <p className="text-2xl font-black text-emerald-700">{resumen.creados}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">Creados</p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-4 text-center">
                            <p className="text-2xl font-black text-red-700">{resumen.errores.length}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">Errores</p>
                        </div>
                    </div>

                    {resumen.detalle_creados.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-2">Pacientes {resumen.modo_simulacion ? 'que se crearían' : 'creados'} (tutor queda pendiente de confirmar)</h3>
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <tbody className="divide-y divide-slate-100">
                                        {resumen.detalle_creados.map((p) => (
                                            <tr key={p.rut}>
                                                <td className="px-4 py-2 font-medium text-slate-700">{p.rut}</td>
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
                            <h3 className="text-sm font-bold text-red-700 mb-2">Errores</h3>
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-red-200">
                                <table className="min-w-full divide-y divide-red-200 text-sm">
                                    <tbody className="divide-y divide-red-100">
                                        {resumen.errores.map((e, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2 font-medium text-red-700">{e.rut}</td>
                                                <td className="px-4 py-2 text-red-600">{e.motivo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}