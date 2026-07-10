import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { API_BASE_URL } from '../../service/api';

interface ControlHistorial {
    fecha: string;
    peso_kg: number;
    talla_cm: number;
    imc: number;
    edad_meses: number;
}

interface ReporteDetalleData {
    rut: string;
    nombre: string;
    historial: ControlHistorial[];
}

export default function ReporteDetalle() {
    const { rut } = useParams<{ rut: string }>();
    const navigate = useNavigate();
    const [reporte, setReporte] = useState<ReporteDetalleData | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const obtenerDetalle = async () => {
            setCargando(true);
            try {
                const token = localStorage.getItem("token");
                const respuesta = await fetch(`${API_BASE_URL}/reportes/${rut}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!respuesta.ok) throw new Error("No se pudo obtener el detalle del paciente");

                const data: ReporteDetalleData = await respuesta.json();
                setReporte(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };

        if (rut) obtenerDetalle();
    }, [rut]);

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-12 text-blue-700">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-3 font-semibold text-lg">Cargando evolución...</span>
            </div>
        );
    }

    if (error || !reporte) {
        return <div className="p-8 text-center text-red-600 font-bold text-lg">{error || "Paciente no encontrado"}</div>;
    }

    // Datos formateados para el eje X del gráfico (fecha corta + edad en meses)
    const datosGrafico = reporte.historial.map((c) => ({
        ...c,
        fechaLabel: new Date(c.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-6">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a Reportes
            </button>

            <h2 className="text-xl font-bold text-slate-900 capitalize mb-1">{reporte.nombre.toLowerCase()}</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">{reporte.rut} · {reporte.historial.length} control{reporte.historial.length !== 1 ? 'es' : ''} registrado{reporte.historial.length !== 1 ? 's' : ''}</p>

            {reporte.historial.length < 2 ? (
                <div className="p-8 text-center text-slate-500 font-semibold bg-slate-50 rounded-lg border border-slate-200">
                    Este paciente aún no tiene suficientes controles para graficar una evolución (se necesitan al menos 2).
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">Evolución de Peso (kg)</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={datosGrafico}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="peso_kg" name="Peso (kg)" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">Evolución de Talla (cm)</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={datosGrafico}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="talla_cm" name="Talla (cm)" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}