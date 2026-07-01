import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CalendarDays, ArrowRight, SearchX } from "lucide-react";
import type { ControlClinico, Paciente } from "../../types";
import { API_BASE_URL } from '../../service/api';


type ControlAgenda = ControlClinico & {
    paciente?: Pick<Paciente, "rut" | "nombre" | "apellido">;
};

const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return "Sin fecha";
    const parsed = new Date(fecha);
    return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleDateString("es-CL");
};

const fechaLocalHoy = () => {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    return new Date(hoy.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export default function AgendaControles() {
    const navigate = useNavigate();
    const [controles, setControles] = useState<ControlAgenda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const cargarAgenda = async () => {
            setCargando(true);
            setError("");

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/control`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("No se pudo cargar la agenda de controles.");
                }

                const data: ControlAgenda[] = await response.json();
                const hoy = fechaLocalHoy();

                const agenda = data
                    .filter((control) => control.fecha_proximoControl && control.fecha_proximoControl.slice(0, 10) >= hoy)
                    .sort((a, b) => {
                        const fechaA = new Date(a.fecha_proximoControl as string).getTime();
                        const fechaB = new Date(b.fecha_proximoControl as string).getTime();
                        return fechaA - fechaB;
                    });

                setControles(agenda);
            } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo cargar la agenda de controles.");
            } finally {
                setCargando(false);
            }
        };

        cargarAgenda();
    }, []);

    const total = useMemo(() => controles.length, [controles]);

    if (cargando) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 text-blue-700">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-lg font-bold">Cargando agenda...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Agenda clínica</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Controles agendados</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Próximos controles clínicos programados desde hoy en adelante.</p>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                    Total agendados: {total}
                </div>
            </div>

            {controles.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
                    <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
                        <SearchX className="h-10 w-10" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">No hay controles agendados</h2>
                    <p className="mt-2 max-w-lg text-sm font-medium text-slate-500">
                        Cuando un control clínico tenga fecha de próximo control, aparecerá aquí ordenado por fecha.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Paciente</th>
                                    <th className="px-6 py-4 font-bold">RUT</th>
                                    <th className="px-6 py-4 font-bold">Fecha próximo control</th>
                                    <th className="px-6 py-4 text-right font-bold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {controles.map((control) => {
                                    const rutPaciente = control.paciente?.rut || control.rut_paciente;
                                    const nombrePaciente = control.paciente
                                        ? `${control.paciente.nombre} ${control.paciente.apellido}`
                                        : control.rut_paciente;

                                    return (
                                        <tr key={control.id_control} className="transition-colors hover:bg-blue-50/60">
                                            <td className="px-6 py-4 font-semibold text-slate-900">{nombrePaciente}</td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{rutPaciente}</td>
                                            <td className="px-6 py-4 font-semibold text-blue-700">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {formatearFecha(control.fecha_proximoControl)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/ficha/${rutPaciente}`)}
                                                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-blue-700"
                                                >
                                                    Ir a ficha
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}