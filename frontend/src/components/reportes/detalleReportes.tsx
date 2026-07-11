import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { API_BASE_URL } from '../../service/api';

interface ControlHistorial {
    fecha: string;
    peso_kg: number;
    talla_cm: number;
    imc: number;
    edad_meses: number;
    perimetro_cefalico: number | null;
}

interface ReporteDetalleData {
    rut: string;
    nombre: string;
    historial: ControlHistorial[];
}

function calcularDominio(valores: number[]): [number, number] {
    const minReal = Math.min(...valores);
    const maxReal = Math.max(...valores);
    const rango = maxReal - minReal;

    const margen = rango > 0 ? rango * 0.15 : Math.max(maxReal * 0.05, 1);

    const min = Math.max(minReal - margen, 0);
    const max = maxReal + margen;

    return [Math.floor(min), Math.ceil(max)];
}

function mesesEntre(fechaA: string, fechaB: string): number {
    const dias = Math.abs(new Date(fechaB).getTime() - new Date(fechaA).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(dias / 30, 0.1);
}

function formatearFechaCorta(fechaIso: string): string {
    return new Date(fechaIso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DetalleReportes() {
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

    const datosGrafico = useMemo(() => {
        if (!reporte) return [];
        return reporte.historial.map((c) => ({
            ...c,
            fechaLabel: new Date(c.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        }));
    }, [reporte]);

    const datosPerimetro = useMemo(() => {
        return datosGrafico.filter(
            (d) => d.perimetro_cefalico !== null && d.perimetro_cefalico !== undefined
        );
    }, [datosGrafico]);

    const dominioPeso = useMemo(() => {
        if (datosGrafico.length === 0) return [0, 10] as [number, number];
        return calcularDominio(datosGrafico.map((d) => d.peso_kg));
    }, [datosGrafico]);

    const dominioTalla = useMemo(() => {
        if (datosGrafico.length === 0) return [0, 10] as [number, number];
        return calcularDominio(datosGrafico.map((d) => d.talla_cm));
    }, [datosGrafico]);

    const dominioPerimetro = useMemo(() => {
        if (datosPerimetro.length === 0) return [0, 10] as [number, number];
        return calcularDominio(datosPerimetro.map((d) => d.perimetro_cefalico as number));
    }, [datosPerimetro]);

    const resumenCambio = useMemo(() => {
        if (!reporte || reporte.historial.length < 2) return null;

        const primero = reporte.historial[0];
        const ultimo = reporte.historial[reporte.historial.length - 1];
        const meses = mesesEntre(primero.fecha, ultimo.fecha);

        const cambioPesoTotal = ultimo.peso_kg - primero.peso_kg;
        const tasaPesoMes = cambioPesoTotal / meses;

        const cambioTallaTotal = ultimo.talla_cm - primero.talla_cm;
        const tasaTallaMes = cambioTallaTotal / meses;

        let cambioPerimetroTotal: number | null = null;
        let tasaPerimetroMes: number | null = null;
        if (primero.perimetro_cefalico != null && ultimo.perimetro_cefalico != null) {
            cambioPerimetroTotal = ultimo.perimetro_cefalico - primero.perimetro_cefalico;
            tasaPerimetroMes = cambioPerimetroTotal / meses;
        }

        return {
            fechaDesde: primero.fecha,
            fechaHasta: ultimo.fecha,
            mesesTexto: Math.round(meses),
            cambioPesoTotal: Math.round(cambioPesoTotal * 10) / 10,
            tasaPesoMes: Math.round(tasaPesoMes * 100) / 100,
            cambioTallaTotal: Math.round(cambioTallaTotal * 10) / 10,
            tasaTallaMes: Math.round(tasaTallaMes * 100) / 100,
            cambioPerimetroTotal: cambioPerimetroTotal !== null ? Math.round(cambioPerimetroTotal * 10) / 10 : null,
            tasaPerimetroMes: tasaPerimetroMes !== null ? Math.round(tasaPerimetroMes * 100) / 100 : null,
        };
    }, [reporte]);

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

    const mostrarPerimetro = datosPerimetro.length >= 1;

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
            <p className="text-sm text-slate-900 font-medium mb-4">{reporte.rut} · {reporte.historial.length} control{reporte.historial.length !== 1 ? 'es' : ''} registrado{reporte.historial.length !== 1 ? 's' : ''}</p>

            {resumenCambio && (
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-800 mb-2">
                        Variación registrada en los últimos {resumenCambio.mesesTexto} meses ({formatearFechaCorta(resumenCambio.fechaDesde)} - {formatearFechaCorta(resumenCambio.fechaHasta)})
                    </p>
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                            {resumenCambio.cambioPesoTotal >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-orange-600" />
                            )}
                            <span className="text-sm font-semibold text-slate-900">
                                Peso: <span className="font-bold">{resumenCambio.cambioPesoTotal >= 0 ? '+' : ''}{resumenCambio.cambioPesoTotal} kg</span>
                                <span className="text-slate-700"> ({resumenCambio.tasaPesoMes >= 0 ? '+' : ''}{resumenCambio.tasaPesoMes} kg/mes)</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-slate-900">
                                Talla: <span className="font-bold">{resumenCambio.cambioTallaTotal >= 0 ? '+' : ''}{resumenCambio.cambioTallaTotal} cm</span>
                                <span className="text-slate-700"> ({resumenCambio.tasaTallaMes >= 0 ? '+' : ''}{resumenCambio.tasaTallaMes} cm/mes)</span>
                            </span>
                        </div>
                        {resumenCambio.cambioPerimetroTotal !== null && (
                            <div className="flex items-center gap-2">
                                {resumenCambio.cambioPerimetroTotal >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-purple-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-orange-600" />
                                )}
                                <span className="text-sm font-semibold text-slate-900">
                                    Perímetro cefálico: <span className="font-bold">{resumenCambio.cambioPerimetroTotal >= 0 ? '+' : ''}{resumenCambio.cambioPerimetroTotal} cm</span>
                                    <span className="text-slate-700"> ({(resumenCambio.tasaPerimetroMes ?? 0) >= 0 ? '+' : ''}{resumenCambio.tasaPerimetroMes} cm/mes)</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {reporte.historial.length === 0 ? (
                <div className="p-8 text-center text-slate-900 font-semibold bg-slate-50 rounded-lg border border-slate-200">
                    Este paciente aún no tiene controles clínicos registrados.
                </div>
            ) : (
                <div className="space-y-8">
                    {reporte.historial.length === 1 && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                            Este paciente tiene un solo control registrado, se muestra el dato disponible pero aún no hay evolución para graficar.
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">
                                {datosGrafico.length === 1 ? 'Peso registrado (kg)' : 'Evolución de Peso (kg)'}
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={datosGrafico}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        domain={dominioPeso}
                                        type="number"
                                        allowDataOverflow={false}
                                    />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="peso_kg" name="Peso (kg)" stroke="#2563eb" strokeWidth={2} dot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">
                                {datosGrafico.length === 1 ? 'Talla registrada (cm)' : 'Evolución de Talla (cm)'}
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={datosGrafico}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        domain={dominioTalla}
                                        type="number"
                                        allowDataOverflow={false}
                                    />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="talla_cm" name="Talla (cm)" stroke="#16a34a" strokeWidth={2} dot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {mostrarPerimetro && (
                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 uppercase">
                                    {datosPerimetro.length === 1 ? 'Perímetro Cefálico registrado (cm)' : 'Evolución de Perímetro Cefálico (cm)'}
                                </h3>
                            </div>
                            <div className="max-w-2xl">
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={datosPerimetro}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            domain={dominioPerimetro}
                                            type="number"
                                            allowDataOverflow={false}
                                        />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="perimetro_cefalico" name="Perímetro Cefálico (cm)" stroke="#9333ea" strokeWidth={2} dot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}