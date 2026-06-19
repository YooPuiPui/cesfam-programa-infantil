import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function FichaPaciente() {
    const { rut } = useParams();
    const navigate = useNavigate();

    const [paciente, setPaciente] = useState<any>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Cálculo de edad detallada
    const obtenerEdadDetallada = (fechaNac: string) => {
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

    // 2. Lógica corregida para procesar múltiples riesgos (incluyendo Trans y colores)
    const obtenerRiesgosSociales = (p: any) => {
        const riesgos = [];
        if (p?.es_sename) riesgos.push({ label: "Sename", color: "bg-red-100 text-red-800" });
        if (p?.es_naneas_prematuro) riesgos.push({ label: "Naneas/Prematuro", color: "bg-amber-100 text-amber-800" });
        if (p?.es_migrante) riesgos.push({ label: "Migrante", color: "bg-blue-100 text-blue-800" });
        if (p?.es_poblacion_trans) riesgos.push({ label: "Población Trans", color: "bg-purple-100 text-purple-800" });
        return riesgos;
    };

    useEffect(() => {
        const fetchPaciente = async () => {
            if (!rut) return;
            setCargando(true);
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:3000/api/pacientes/rut/${rut}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Error al cargar datos');
                const data = await response.json();
                setPaciente(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setCargando(false);
            }
        };
        fetchPaciente();
    }, [rut]);

    if (cargando) return <div className="p-10 text-center">Cargando...</div>;
    if (error) return <div className="p-10 text-center text-red-600">{error}</div>;

    const riesgos = obtenerRiesgosSociales(paciente);

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ENCABEZADO CORREGIDO: Muestra nombre social y legal */}
                <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        {paciente?.es_poblacion_trans && paciente?.nombre_social ? (
                            <>
                                <h1 className="text-3xl font-bold text-slate-900">{paciente.nombre_social} {paciente.apellido}</h1>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    <span className="font-semibold text-slate-600">Nombre legal:</span> {paciente.nombre} {paciente.apellido}
                                </p>
                            </>
                        ) : (
                            <h1 className="text-3xl font-bold text-slate-900">{paciente?.nombre} {paciente?.apellido}</h1>
                        )}
                        <p className="text-slate-500 font-medium mt-1">RUT: {paciente?.rut}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/nuevo-control?rut=${rut}`)}
                        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition shrink-0"
                    >
                        + Nuevo Control
                    </button>
                </div>

                {/* CUERPO */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        {/* Antecedentes */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Antecedentes</h2>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs text-slate-500">Edad</dt>
                                    <dd className="text-sm font-semibold text-slate-800">{obtenerEdadDetallada(paciente?.fecha_nacimiento)}</dd>
                                </div>

                                {/* Riesgos Sociales Dinámicos */}
                                <div>
                                    <dt className="text-xs text-slate-500 mb-2">Riesgos Sociales</dt>
                                    <dd className="flex flex-wrap gap-2">
                                        {riesgos.length > 0 ? (
                                            riesgos.map((r, i) => (
                                                <span key={i} className={`px-2 py-1 text-xs font-bold rounded-full ${r.color}`}>
                                                    {r.label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm font-semibold text-slate-500">No pertenece a ninguno</span>
                                        )}
                                    </dd>
                                </div>

                                {paciente?.es_poblacion_trans && paciente?.identidad_genero && (
                                    <div className="pt-2 border-t mt-4">
                                        <dt className="text-xs text-slate-500">Identidad de Género</dt>
                                        <dd className="text-sm font-semibold text-blue-700">{paciente.identidad_genero}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Tutor */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tutor Principal</h2>
                            <p className="text-sm font-semibold text-slate-800">
                                {paciente?.tutor ? `${paciente.tutor.nombre} ${paciente.tutor.apellido}` : 'Sin tutor'}
                            </p>
                            <p className="text-sm text-slate-500">{paciente?.tutor?.telefono || 'Sin teléfono'}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 lg:col-span-2">
                        <h2 className="text-lg font-bold text-slate-800 mb-6">Historial de Atenciones</h2>
                        {/* Tabla placeholder */}
                        <div className="border-2 border-dashed border-slate-200 rounded-lg py-16 flex flex-col items-center justify-center text-slate-400">
                            <p>No existen registros de controles previos.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}