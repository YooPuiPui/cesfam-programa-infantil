import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { controlSchema, ControlFormValues } from '../../validation/controlClinicoSchema';
import { API_BASE_URL } from '../../service/api';
import { calcularEdadEnMeses } from '../../utils/formatters';

const fieldClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 ${hasError
        ? "border-red-400 ring-4 ring-red-50"
        : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-white"
    }`;

const fieldClassDisabled =
    "w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-400 outline-none cursor-not-allowed";

export default function NuevoControl() {
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const rutPaciente = queryParams.get('rut');

    const [paciente, setPaciente] = useState<any>(null);
    const [cargandoEntorno, setCargandoEntorno] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [ultimoControl, setUltimoControl] = useState<any>(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ControlFormValues>({
        resolver: zodResolver(controlSchema) as any,
        defaultValues: {
            motivo_consulta: '',
            anamnesis: '',
            peso_kg: '' as unknown as number,
            talla_cm: '' as unknown as number,
            perimetro_cefalico: undefined,
            exploracion_fisica: '',
            problemas_diagnosticados: '',
            indicaciones_acuerdos: '',
            fecha_proximoControl: '',
        }
    });

    useEffect(() => {
        const fetchContexto = async () => {
            if (!rutPaciente) {
                console.warn("No se detectó un RUT en la URL.");
                setCargandoEntorno(false);
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const headers = { 'Authorization': `Bearer ${token}` };

                const response = await fetch(`${API_BASE_URL}/pacientes/rut/${rutPaciente}`, { headers });
                if (!response.ok) throw new Error('Paciente no encontrado en la base de datos');
                const dataPaciente = await response.json();
                setPaciente(dataPaciente);

                const resControles = await fetch(`${API_BASE_URL}/control/${rutPaciente}`, { headers });
                if (resControles.ok) {
                    const dataControles = await resControles.json();
                    if (dataControles && dataControles.length > 0) {
                        setUltimoControl(dataControles[0]);
                    }
                }
            } catch (error) {
                console.error("Error al cargar contexto del paciente o controles", error);
            } finally {
                setCargandoEntorno(false);
            }
        };
        fetchContexto();
    }, [rutPaciente]);

    const edadMesesActual = paciente?.fecha_nacimiento ? calcularEdadEnMeses(paciente.fecha_nacimiento) : null;
    const aplicaPerimetroCefalico = edadMesesActual !== null && edadMesesActual <= 36;

    const onSubmit = async (data: ControlFormValues) => {
        setGuardando(true);
        try {
            const token = localStorage.getItem("token");
            const rutDoctor = localStorage.getItem("rut_profesional");

            if (!rutDoctor) {
                alert("Sesión expirada o inválida. Por favor, inicie sesión nuevamente.");
                navigate('/login');
                return;
            }

            const payload = {
                paciente: { rut: rutPaciente },
                control: {
                    motivo_consulta: data.motivo_consulta,
                    anamnesis: data.anamnesis,
                    peso_kg: data.peso_kg,
                    talla_cm: data.talla_cm,
                    perimetro_cefalico: aplicaPerimetroCefalico ? data.perimetro_cefalico : null,
                    exploracion_fisica: data.exploracion_fisica,
                    problemas_diagnosticados: data.problemas_diagnosticados,
                    indicaciones_acuerdos: data.indicaciones_acuerdos,
                    rut_profesional: rutDoctor,
                    edad_meses: paciente?.fecha_nacimiento ? calcularEdadEnMeses(paciente.fecha_nacimiento) : 0,
                    imc: parseFloat((data.peso_kg / Math.pow(data.talla_cm / 100, 2)).toFixed(2)),
                    fecha_proximoControl: data.fecha_proximoControl || new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString()
                }
            };

            const response = await fetch(`${API_BASE_URL}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorDelBackend = await response.json().catch(() => ({}));
                console.error("Respuesta del Backend:", errorDelBackend);
                throw new Error(errorDelBackend.error || 'Error desconocido en el servidor');
            }

            navigate(`/ficha/${rutPaciente}`);

        } catch (error: any) {
            console.error("Falla en la petición:", error);
            alert(`Hubo un problema al guardar: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    if (cargandoEntorno) return <div className="h-screen flex flex-col justify-center items-center text-blue-700 bg-slate-50"><Loader2 className="animate-spin h-12 w-12 mb-4" /><span className="text-lg font-bold">Preparando entorno clínico...</span></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* BARRA SUPERIOR DE ACCIÓN */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Registro de Atención Clínica</h1>
                    <p className="mt-1 text-sm font-medium text-slate-900">Completa los datos del control para este paciente.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a la Ficha
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        disabled={guardando}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {guardando ? "Guardando..." : "Guardar Control"}
                    </button>
                </div>
            </div>

            {/* DOCUMENTO CLÍNICO ÚNICO */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-md">

                {/* ENCABEZADO: DATOS DEL PACIENTE */}
                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xl font-black text-slate-900 capitalize">{paciente?.nombre?.toLowerCase()} {paciente?.apellido?.toLowerCase()}</p>
                        <p className="text-sm font-semibold text-slate-000">RUT: <span className="text-slate-700">{paciente?.rut}</span></p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-900">Último control registrado</p>
                        {ultimoControl ? (
                            <p className="font-semibold text-slate-700">
                                {new Date(ultimoControl.fecha_control).toLocaleDateString('es-CL', { timeZone: 'UTC' })} — {ultimoControl.peso_kg} kg / {ultimoControl.talla_cm} cm / IMC {ultimoControl.imc}
                            </p>
                        ) : (
                            <p className="font-medium italic text-slate-500">No registra controles previos</p>
                        )}
                    </div>
                </div>

                {/* 1. ENTREVISTA CLÍNICA */}
                <div className="border-b border-slate-200 p-6">
                    <h2 className="mb-5 text-base font-bold uppercase tracking-wide text-slate-800">1. Entrevista Clínica</h2>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Motivo de Consulta</label>
                            <input
                                type="text"
                                {...register("motivo_consulta")}
                                className={fieldClass(Boolean(errors.motivo_consulta))}
                                placeholder="Ej: Consulta salud mental"
                            />
                            {errors.motivo_consulta && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.motivo_consulta.message}</span>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Anamnesis</label>
                            <textarea
                                {...register("anamnesis")}
                                rows={4}
                                className={`${fieldClass(Boolean(errors.anamnesis))} resize-none`}
                                placeholder="Describa la situación relatada por el tutor/paciente..."
                            />
                            {errors.anamnesis && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.anamnesis.message}</span>}
                        </div>

                    </div>
                </div>

                {/* 2. MEDIDAS */}
                <div className="border-b border-slate-200 p-6">
                    <h2 className="mb-5 text-base font-bold uppercase tracking-wide text-slate-800">2. Medidas</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Peso (kg)</label>
                            <input
                                type="number" step="0.1"
                                {...register("peso_kg")}
                                className={fieldClass(Boolean(errors.peso_kg))}
                                placeholder="0.0"
                            />
                            {errors.peso_kg && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.peso_kg.message}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Talla (cm)</label>
                            <input
                                type="number" step="0.1"
                                {...register("talla_cm")}
                                className={fieldClass(Boolean(errors.talla_cm))}
                                placeholder="0.0"
                            />
                            {errors.talla_cm && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.talla_cm.message}</span>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Perímetro Cefálico (cm)</label>
                            <input
                                type="number" step="0.1"
                                {...register("perimetro_cefalico")}
                                disabled={!aplicaPerimetroCefalico}
                                className={aplicaPerimetroCefalico ? fieldClass(Boolean(errors.perimetro_cefalico)) : fieldClassDisabled}
                                placeholder={aplicaPerimetroCefalico ? "0.0" : "No aplica (mayor de 3 años)"}
                            />
                            {errors.perimetro_cefalico && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.perimetro_cefalico.message}</span>}
                        </div>
                    </div>
                </div>

                {/* 3. EVALUACIÓN Y PLAN */}
                <div className="p-6">
                    <h2 className="mb-5 text-base font-bold uppercase tracking-wide text-slate-800">3. Evaluación y Plan</h2>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Exploración / Examen Físico</label>
                            <textarea
                                {...register("exploracion_fisica")}
                                rows={3}
                                className={`${fieldClass(Boolean(errors.exploracion_fisica))} resize-none`}
                                placeholder="Detalle el examen físico realizado..."
                            />
                            {errors.exploracion_fisica && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.exploracion_fisica.message}</span>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Diagnóstico(s)</label>
                            <textarea
                                {...register("problemas_diagnosticados")}
                                rows={2}
                                className={`${fieldClass(Boolean(errors.problemas_diagnosticados))} resize-none`}
                                placeholder=""
                            />
                            {errors.problemas_diagnosticados && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.problemas_diagnosticados.message}</span>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Actuación / Plan</label>
                            <textarea
                                {...register("indicaciones_acuerdos")}
                                rows={4}
                                className={`${fieldClass(Boolean(errors.indicaciones_acuerdos))} resize-none`}
                                placeholder="Derivaciones, indicaciones, terapia indicada..."
                            />
                            {errors.indicaciones_acuerdos && <span className="mt-1.5 block text-sm font-bold text-red-500">{errors.indicaciones_acuerdos.message}</span>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Fecha próximo control</label>
                            <input
                                type="date"
                                {...register("fecha_proximoControl")}
                                className={fieldClass(false)}
                            />
                            <p className="mt-1.5 text-xs font-medium text-slate-900">Si no se completa, se registrará por defecto a 6 meses.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}