import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { calcularEdad } from '../../utils/formatters';
import type { ControlClinicoDetalle } from '../../types';
import { API_BASE_URL } from '../../service/api'
export default function PlantillaControl() {
    const navigate = useNavigate();
    const { id_control } = useParams();

    const [controlData, setControlData] = useState<ControlClinicoDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetalleControl = async () => {
            if (!id_control) {
                setError('No se detectó el ID del control en la URL.');
                setCargando(false);
                return;
            }
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/control/detalle/${id_control}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('No se pudo recuperar el documento clínico.');

                const data: ControlClinicoDetalle = await response.json();
                setControlData(data);
            } catch (err: unknown) {
                console.error(err);
                setError(err instanceof Error ? err.message : 'No se pudo recuperar el documento clínico.');
            } finally {
                setCargando(false);
            }
        };

        fetchDetalleControl();
    }, [id_control]);

    const handleImprimir = () => {
        window.print();
    };

    const formatearFecha = (fechaStr: string) => {
        if (!fechaStr) return '';
        return new Date(fechaStr).toLocaleDateString('es-CL');
    };

    if (cargando) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-blue-700">
            <Loader2 className="animate-spin h-10 w-10 mb-2" />
            <span className="font-bold">Recuperando documento oficial...</span>
        </div>
    );

    if (error) return <div className="p-10 text-center text-red-600 font-bold bg-red-50 m-6 rounded-lg border border-red-200">{error}</div>;
    if (!controlData) return <div className="p-10 text-center text-red-600 font-bold bg-red-50 m-6 rounded-lg border border-red-200">No se encontraron datos del control clínico.</div>;

    const { paciente } = controlData;

    return (
        <div className="min-h-screen bg-slate-000 p-6 md:p-8 font-sans">

            {/* BOTONES DE ACCIÓN*/}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-300 print:hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-000 hover:text-black font-bold transition-colors px-4 py-2 bg-slate-100 rounded-lg border border-slate-300"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" /> Volver
                </button>
                <button
                    onClick={handleImprimir}
                    className="flex items-center text-white bg-blue-800 hover:bg-blue-900 font-bold px-6 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Printer className="h-5 w-5 mr-2" /> Imprimir Hoja de Evolución
                </button>
            </div>

            {/* DOCUMENTO OFICIAL TIPO IMPRENTA (Blanco y Negro) */}
            <div className="max-w-4xl mx-auto bg-white p-10 shadow-lg min-h-[1056px] text-black text-sm print:shadow-none print:p-0">

                {/* ENCABEZADO INSTITUCIONAL */}
                <div className="flex justify-between items-center border-2 border-black p-3 mb-6">
                    <div className="w-1/3 text-left">
                    </div>
                    <div className="w-1/3 text-center">
                        <h1 className="font-black text-base uppercase">Hoja de Evolución Clínica</h1>
                    </div>
                    <div className="w-1/3 text-right text-xs">
                        <p><span className="font-bold">Folio N°:</span> {controlData.id_control}</p>
                        <p><span className="font-bold">Fecha:</span> {formatearFecha(controlData.fecha_control)}</p>
                    </div>
                </div>

                {/* 1. IDENTIFICACIÓN DEL PACIENTE */}
                <div className="border-2 border-black mb-6">
                    <div className="bg-gray-200 border-b-2 border-black p-1.5">
                        <h2 className="font-bold uppercase tracking-wider ml-1 text-xs">1.- Identificación del Paciente</h2>
                    </div>
                    <div className="grid grid-cols-4 divide-x-2 divide-black">
                        <div className="col-span-3 p-2 border-b border-black">
                            <span className="font-bold">Nombre Completo:</span> <span className="uppercase">{paciente?.nombre} {paciente?.apellido}</span>
                        </div>
                        <div className="p-2 border-b border-black">
                            <span className="font-bold">RUT:</span> {paciente?.rut}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 divide-x-2 divide-black">
                        <div className="p-2">
                            <span className="font-bold">Edad:</span>
                            {paciente?.fecha_nacimiento ? calcularEdad(paciente.fecha_nacimiento) : '---'}
                        </div>
                        <div className="col-span-2 p-2">
                            <span className="font-bold">Tutor:</span> {paciente?.tutor?.nombre} {paciente?.tutor?.apellido}
                        </div>
                        <div className="p-2">
                            <span className="font-bold">Teléfono:</span> {paciente?.tutor?.telefono || '---'}
                        </div>
                    </div>
                </div>

                {/* 2. REGISTRO CLÍNICO (Sincronizado con Zod Form) */}
                <div className="border-2 border-black mb-8 flex-1">
                    <div className="bg-gray-200 border-b-2 border-black p-1.5">
                        <h2 className="font-bold uppercase tracking-wider ml-1 text-xs">2.- Registro de Atención</h2>
                    </div>

                    {/* MOTIVO */}
                    <div className="p-3 border-b-2 border-black min-h-[80px]">
                        <p className="font-bold mb-1 uppercase underline underline-offset-2">Motivo de Consulta:</p>
                        <p className="uppercase">{controlData.motivo_consulta || '---'}</p>
                    </div>

                    {/* ANAMNESIS */}
                    <div className="p-3 border-b-2 border-black min-h-[160px]">
                        <p className="font-bold mb-1 uppercase underline underline-offset-2">Anamnesis:</p>

                        <p className="uppercase whitespace-pre-wrap break-words">
                            {controlData.anamnesis || '---'}
                        </p>
                    </div>

                    {/* EXPLORACIÓN FÍSICA Y MEDIDAS (Peso y Talla integrados aquí) */}
                    <div className="p-3 border-b-2 border-black min-h-[160px]">
                        <div className="flex justify-between items-start mb-2">
                            <p className="font-bold uppercase underline underline-offset-2">Exploración Física:</p>
                            <div className="text-xs font-bold bg-white px-3 py-1 border-2 border-black rounded shadow-sm">
                                PESO: {controlData.peso_kg ? `${controlData.peso_kg} kg` : '---'} &nbsp;|&nbsp; TALLA: {controlData.talla_cm ? `${controlData.talla_cm} cm` : '---'}
                            </div>
                        </div>
                        <p className="uppercase whitespace-pre-wrap">{controlData.exploracion_fisica || '---'}</p>
                    </div>

                    {/* DIAGNÓSTICO (Con fallback preventivo por si viene con el nombre de Prisma) */}
                    <div className="p-3 border-b-2 border-black min-h-[120px]">
                        <p className="font-bold mb-1 uppercase underline underline-offset-2">Diagnóstico:</p>
                        <p className="uppercase whitespace-pre-wrap">
                            {controlData.problemas_diagnosticados || '---'}
                        </p>
                    </div>

                    {/* ACTUACIÓN / PLAN (Con fallback preventivo) */}
                    <div className="p-3 min-h-[160px]">
                        <p className="font-bold mb-1 uppercase underline underline-offset-2">Actuación / Plan / Indicaciones:</p>
                        <p className="uppercase whitespace-pre-wrap">
                            {controlData.indicaciones_acuerdos || '---'}
                        </p>
                        <p className="mt-4 font-bold uppercase underline underline-offset-2">Próximo control:</p>
                        <p className="uppercase">
                            {controlData.fecha_proximoControl
                                ? new Date(controlData.fecha_proximoControl).toLocaleDateString('es-CL')
                                : 'Sin fecha de próximo control agendada'}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
