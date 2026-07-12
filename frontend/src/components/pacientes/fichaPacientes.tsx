import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Calendar, History, ArrowLeft } from 'lucide-react';
import type { ControlClinico, Paciente } from '../../types';
import { API_BASE_URL } from '../../service/api';


type RiesgoSocial = {
    label: string;
    color: string;
};

export default function FichaPaciente() {
    const { rut } = useParams();
    const navigate = useNavigate();

    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [controles, setControles] = useState<ControlClinico[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // calculo de edad detallada
    const obtenerEdadDetallada = (fechaNac?: string) => {
        if (!fechaNac) return "N/A";
        const birthDate = new Date(fechaNac);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
            years--;
            months += 12;
        }
        return `${years} años y ${months} meses`;
    };

    // procesar múltiples riesgos
    const obtenerRiesgosSociales = (p: Paciente | null): RiesgoSocial[] => {
        const riesgos: RiesgoSocial[] = [];
        if (p?.es_sename) riesgos.push({ label: "Sename", color: "bg-red-100 text-red-800 border border-red-200" });
        if (p?.es_naneas_prematuro) riesgos.push({ label: "Naneas/Prematuro", color: "bg-amber-100 text-amber-800 border border-amber-200" });
        if (p?.es_migrante) riesgos.push({ label: "Migrante", color: "bg-blue-100 text-blue-800 border border-blue-200" });
        if (p?.es_poblacion_trans) riesgos.push({ label: "Población Trans", color: "bg-purple-100 text-purple-800 border border-purple-200" });
        return riesgos;
    };

    useEffect(() => {
        const cargarDatosFicha = async () => {
            if (!rut) {
                setError("No se detectó RUT en la URL.");
                setCargando(false);
                return;
            }

            setCargando(true);
            try {
                const token = localStorage.getItem("token");
                const headers = { 'Authorization': `Bearer ${token}` };

                // buscar paciente
                const resPaciente = await fetch(`${API_BASE_URL}/pacientes/rut/${rut}`, { headers });
                if (!resPaciente.ok) throw new Error('Error al cargar datos del paciente');
                const dataPaciente: Paciente = await resPaciente.json();
                setPaciente(dataPaciente);

                // buscar controles
                const resControles = await fetch(`${API_BASE_URL}/control/${rut}`, { headers });
                if (resControles.ok) {
                    const dataControles: ControlClinico[] = await resControles.json();
                    setControles(dataControles);
                } else if (resControles.status === 404) {
                    setControles([]);
                } else if (resControles.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("usuario");
                    navigate("/login");
                    return;
                } else {
                    throw new Error('No se pudo cargar el historial de controles. Intente nuevamente.');
                }

            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Error al cargar la ficha clínica.');
            } finally {
                setCargando(false);
            }
        };

        cargarDatosFicha();
    }, [rut]);

    if (cargando) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-blue-700 font-bold text-lg animate-pulse">Cargando expediente clínico...</div></div>;
    if (error) return <div className="p-10 text-center text-red-600 font-bold bg-red-50 m-6 rounded-lg border border-red-200">{error}</div>;

    const riesgos = obtenerRiesgosSociales(paciente);

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* ENCABEZADO DE LA FICHA */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                    {paciente?.es_poblacion_trans && paciente?.nombre_social ? (
                        <>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{paciente.nombre} {paciente.apellido}</h1>
                            <p className="mt-1 flex items-center gap-2 text-lg font-bold text-purple-700">
                                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-purple-700">
                                    Nombre social
                                </span>
                                {paciente.nombre_social} {paciente.apellido}
                            </p>
                        </>
                    ) : (
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{paciente?.nombre} {paciente?.apellido}</h1>
                    )}
                    <p className="text-slate-000 font-medium mt-1">RUT: <span className="text-slate-000">{paciente?.rut}</span></p>
                </div>
                <button
                    onClick={() => navigate(`/nuevo-control?rut=${rut}`)}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl transition shadow-md hover:shadow-lg w-full md:w-auto active:scale-95"
                >
                    + Iniciar Nuevo Control
                </button>
            </div>

            {/* CUERPO DE LA FICHA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Antecedentes */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                        <h2 className="text-xs font-bold text-slate-000 uppercase tracking-wider mb-5 border-b pb-2">Antecedentes Generales</h2>
                        <dl className="space-y-5">
                            <div>
                                <dt className="text-sm font-semibold text-slate-000 uppercase tracking-wide">Edad Actual</dt>
                                <dd className="text-sm font-bold text-slate-800 mt-1">{obtenerEdadDetallada(paciente?.fecha_nacimiento)}</dd>
                            </div>

                            {/* Riesgos Sociales Dinámicos */}
                            <div>
                                <dt className="text-sm font-semibold text-slate-000 uppercase tracking-wide mb-2">Riesgos Socioclínicos</dt>
                                <dd className="flex flex-wrap gap-2">
                                    {riesgos.length > 0 ? (
                                        riesgos.map((r, i) => (
                                            <span key={i} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${r.color} shadow-sm`}>
                                                {r.label}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm font-medium text-slate-000 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">Sin riesgos registrados</span>
                                    )}
                                </dd>
                            </div>

                            {paciente?.es_poblacion_trans && paciente?.identidad_genero && (
                                <div className="font-bold  border-slate-100">
                                    <dt className="text-sm font-semibold text-slate-000 uppercase tracking-wide">Identidad de Género</dt>
                                    <dd className="text-sm font-bold text-blue-700 mt-1">{paciente.identidad_genero}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Tutor */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                        <h2 className="text-sm font-bold text-slate-000 uppercase tracking-wider mb-4 border-b pb-2">Tutor Legal / Cuidador</h2>
                        <p className="text-base font-bold text-slate-000">
                            {paciente?.tutor ? `${paciente.tutor.nombre} ${paciente.tutor.apellido}` : 'Sin tutor registrado'}
                        </p>
                        <p className="text-sm font-medium text-slate-000 mt-1">Tel: {paciente?.tutor?.telefono || 'No disponible'}</p>
                    </div>
                </div>

                {/* COLUMNA DERECHA (Historial de Controles) */}
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-slate-200 lg:col-span-8">

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <History className="h-6 w-6 mr-2 text-blue-600" />
                            Historial de Atenciones
                        </h2>
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                            Total: {controles.length}
                        </span>
                    </div>

                    {controles.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                            <Calendar className="h-10 w-10 mb-3 text-slate-300" />
                            <p className="font-semibold text-slate-500">No existen registros médicos previos.</p>
                            <p className="text-sm mt-1">Inicie un nuevo control para generar el expediente.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-000 uppercase tracking-wider">Fecha de Atención</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-000 uppercase tracking-wider">Resumen Clínico</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-000 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {controles.map((control) => (
                                        <tr key={control.id_control} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900">{new Date(control.fecha_control).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[300px]" title={control.motivo_consulta}>
                                                    {control.motivo_consulta || 'Control Sano'}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 line-clamp-1 max-w-[300px]" title={control.problemas_diagnosticados}>
                                                    {control.problemas_diagnosticados || 'Sin diagnóstico registrado'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => navigate(`/detalle/${control.id_control}`)}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-900 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                                                >
                                                    <FileText className="h-4 w-4 mr-1.5" />
                                                    Ver Plantilla
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
