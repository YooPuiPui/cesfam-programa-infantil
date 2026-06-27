<<<<<<< HEAD
import React, { useState } from 'react';

export default function CrearControl() {
    // Estado para guardar los datos del formulario
    const [formData, setFormData] = useState({
        rutPaciente: '',
        rutProfesional: '',
        edadMeses: '',
        peso: '',
        talla: '',
        imc: '',
        fechaProximoControl: '',
        diagnostico: '',
    });

    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Manejador de cambios en los inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // e ejecuta al presionar el botón guardar
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // --- 🚨 TRAMPA DE DEBUGGING AQUÍ 🚨 ---
        alert("¡El botón está conectado y la función se disparó!");
        console.log("Intentando guardar el control...");
        setMensaje({ texto: 'Guardando...', tipo: 'info' });

        // armamos json como lo pide el controller
        const payload = {
            paciente: {
                rut: formData.rutPaciente
            },
            control: {
                edad_meses: parseInt(formData.edadMeses),
                peso_kg: parseFloat(formData.peso),
                talla_cm: parseFloat(formData.talla),
                imc: parseFloat(formData.imc),
                fecha_proximoControl: new Date(formData.fechaProximoControl).toISOString(),
                rut_profesional: formData.rutProfesional,
                diagnostico_nutricional: formData.diagnostico // Opcional
            }
        };

        try {
            // manda a la ruta 
            const response = await fetch('http://localhost:3000/api/controles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al guardar el control');
            }

            // ok
            setMensaje({ texto: '¡Control guardado con éxito!', tipo: 'exito' });


        } catch (error: any) {
            setMensaje({ texto: error.message, tipo: 'error' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2">Registrar Nuevo Control Clínico</h2>

            {mensaje.texto && (
                <div className={`p-4 mb-6 rounded-md ${mensaje.tipo === 'error' ? 'bg-red-100 text-red-700' : mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Sección: Identificación */}
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">1. Identificación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">RUT Paciente *</label>
                            <input type="text" name="rutPaciente" required value={formData.rutPaciente} onChange={handleChange} placeholder="Ej: 12345678-9" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">RUT Profesional *</label>
                            <input type="text" name="rutProfesional" required value={formData.rutProfesional} onChange={handleChange} placeholder="Ej: 9876543-2" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Sección: Medidas Antropométricas */}
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">2. Antropometría</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Edad (Meses) *</label>
                            <input type="number" name="edadMeses" required value={formData.edadMeses} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Peso (Kg) *</label>
                            <input type="number" step="0.1" name="peso" required value={formData.peso} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Talla (cm) *</label>
                            <input type="number" step="0.1" name="talla" required value={formData.talla} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">IMC *</label>
                            <input type="number" step="0.1" name="imc" required value={formData.imc} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Sección: Gestión y Próximo Control */}
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">3. Gestión</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Fecha Próximo Control *</label>
                            <input type="date" name="fechaProximoControl" required value={formData.fechaProximoControl} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Diagnóstico Nutricional (Opcional)</label>
                            <input type="text" name="diagnostico" value={formData.diagnostico} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Botón de Envío */}
                <div className="flex justify-end">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1">
                        Guardar Control Médico
                    </button>
                </div>

            </form>
        </div>
    );
}
=======
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User, History, ClipboardEdit, Activity, Stethoscope } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { controlSchema, ControlFormValues } from '../../validation/controlClinicoSchema';

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
                exploracion_fisica: '',
                problemas_diagnosticados: '',
                indicaciones_acuerdos: '',
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

                // cargar datos de contexto del paciente
                const response = await fetch(`http://localhost:3000/api/pacientes/rut/${rutPaciente}`, { headers });
                if (!response.ok) throw new Error('Paciente no encontrado en la base de datos');
                const dataPaciente = await response.json();
                setPaciente(dataPaciente);

                //cargar último control  usando la ruta /api/control
                const resControles = await fetch(`http://localhost:3000/api/control/${rutPaciente}`, { headers });
                if (resControles.ok) {
                    const dataControles = await resControles.json();
                    if (dataControles && dataControles.length > 0) {
                        setUltimoControl(dataControles[0]); // El primero es el más nuevo (desc)
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

    const onSubmit = async (data: ControlFormValues) => {
        setGuardando(true);
        try {
            const token = localStorage.getItem("token");

            const rutDoctor = localStorage.getItem("rut_profesional");

            // Si por alguna razón se borró, lo enviamos al login de vuelta
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
                    exploracion_fisica: data.exploracion_fisica,
                    problemas_diagnosticados: data.problemas_diagnosticados,
                    indicaciones_acuerdos: data.indicaciones_acuerdos,
                    rut_profesional: rutDoctor, // <-- Dinámico y real
                    edad_meses: 120, // (Calcularemos esto después con la fecha de nacimiento)
                    imc: parseFloat((data.peso_kg / Math.pow(data.talla_cm / 100, 2)).toFixed(2)),
                    fecha_proximoControl: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString()
                }
            };

            const response = await fetch('http://localhost:3000/api/control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            // si el backend rechaza la petición
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
        <div className="max-w-7xl mx-auto space-y-6">

            {/* BARRA SUPERIOR DE ACCIÓN - Más elegante */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-md border border-slate-200 gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-000 hover:text-blue-700 font-bold transition-colors bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-lg"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" /> Volver a la Ficha
                </button>
                <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Atención Clínica</h1>
                </div>
                <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={guardando}
                    className="flex items-center bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95"
                >
                    {guardando ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                    {guardando ? 'Guardando...' : 'Guardar Control'}
                </button>
            </div>

            {/* ESTRUCTURA DE PANTALLA DIVIDIDA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* LADO IZQUIERDO: CONTEXTO (Fijo/Sticky) */}
                <div className="lg:col-span-4 space-y-6 sticky top-6">

                    {/* Tarjeta del Paciente */}
                    <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-t-blue-600 border-x border-b border-slate-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <User className="h-6 w-6" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Paciente Actual</h2>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 capitalize">{paciente?.nombre?.toLowerCase()} {paciente?.apellido?.toLowerCase()}</p>
                            <p className="text-slate-500 font-semibold mt-1">RUT: <span className="text-slate-700">{paciente?.rut}</span></p>
                        </div>
                    </div>

                    {/* Tarjeta de Último Control */}
                    <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-t-blue-600 border-x border-b border-slate-200">
                        <h3 className="text-xs font-bold text-blue-800 uppercase mb-2">Último Control Registrado</h3>
                        {ultimoControl ? (
                            <div className="space-y-1">
                                <p className="text-sm text-slate-000"><span className="font-semibold">Fecha:</span> {new Date(ultimoControl.fecha_control).toLocaleDateString('es-CL')}</p>
                                <p className="text-sm text-slate-950"><span className="font-semibold">Peso Anterior:</span> {ultimoControl.peso_kg} kg</p>
                                <p className="text-sm text-slate-950"><span className="font-semibold">Talla Anterior:</span> {ultimoControl.talla_cm} cm</p>
                                <p className="text-sm text-slate-950"><span className="font-semibold">IMC Anterior:</span> {ultimoControl.imc}</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-sm text-slate-500 italic">No registra controles previos</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* LADO DERECHO: FORMULARIO EDITABLE */}
                <div className="lg:col-span-8 space-y-6">

                    {/* 1. Motivo y Anamnesis*/}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-slate-200 border-l-4 border-l-blue-500 space-y-6 transition-all hover:shadow-lg">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ClipboardEdit className="h-6 w-6" /></div>
                            <h2 className="text-xl font-bold text-slate-800">1. Entrevista Clínica</h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Motivo de Consulta</label>
                                <input
                                    type="text"
                                    {...register("motivo_consulta")}
                                    className={`w-full p-3 bg-slate-50 border rounded-xl outline-none transition-all ${errors.motivo_consulta ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-white'}`}
                                    placeholder="Ej: Consulta salud mental"
                                />
                                {errors.motivo_consulta && <span className="text-red-500 text-sm font-bold mt-1.5 block">{errors.motivo_consulta.message}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Anamnesis</label>
                                <textarea
                                    {...register("anamnesis")}
                                    rows={4}
                                    className={`w-full p-3 bg-slate-50 border rounded-xl outline-none transition-all resize-none ${errors.anamnesis ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-white'}`}
                                    placeholder="Describa la situación relatada por el tutor/paciente..."
                                />
                                {errors.anamnesis && <span className="text-red-500 text-sm font-bold mt-1.5 block">{errors.anamnesis.message}</span>}
                            </div>
                        </div>
                    </div>

                    {/* 2. Antropometría (Esmeralda) */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-slate-200 border-l-4 border-l-emerald-500 transition-all hover:shadow-lg">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Activity className="h-6 w-6" /></div>
                            <h2 className="text-xl font-bold text-slate-800">2. Medidas</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Peso (kg)</label>
                                <input
                                    type="number" step="0.1"
                                    {...register("peso_kg")}
                                    className={`w-full p-3 bg-slate-50 border rounded-xl outline-none transition-all ${errors.peso_kg ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 hover:bg-white'}`}
                                    placeholder="0.0"
                                />
                                {errors.peso_kg && <span className="text-red-500 text-sm font-bold mt-1.5 block">{errors.peso_kg.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Talla (cm)</label>
                                <input
                                    type="number" step="0.1"
                                    {...register("talla_cm")}
                                    className={`w-full p-3 bg-slate-50 border rounded-xl outline-none transition-all ${errors.talla_cm ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 hover:bg-white'}`}
                                    placeholder="0.0"
                                />
                                {errors.talla_cm && <span className="text-red-500 text-sm font-bold mt-1.5 block">{errors.talla_cm.message}</span>}
                            </div>
                        </div>
                    </div>

                    {/* 3. Exploración, Diagnóstico y Plan (Púrpura) */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-slate-200 border-l-4 border-l-purple-500 space-y-6 transition-all hover:shadow-lg">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Stethoscope className="h-6 w-6" /></div>
                            <h2 className="text-xl font-bold text-slate-800">3. Evaluación y Plan</h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Exploración / Examen Físico</label>
                                <textarea
                                    {...register("exploracion_fisica")}
                                    rows={3}
                                    className={`w-full p-3 bg-slate-50 border rounded-xl outline-none transition-all resize-none ${errors.exploracion_fisica ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 hover:bg-white'}`}
                                    placeholder="Detalle el examen físico realizado..."
                                />
                                {errors.exploracion_fisica && <span className="text-red-500 text-sm font-bold mt-1.5 block">{errors.exploracion_fisica.message}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Diagnóstico(s)</label>
                                <textarea
                                    {...register("problemas_diagnosticados")}
                                    rows={2}
                                    className={`w-full p-3 bg-slate-50 border rounded-xl outline-none transition-all resize-none ${errors.problemas_diagnosticados ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 hover:bg-white'}`}
                                    placeholder=""
                                />
                                {errors.problemas_diagnosticados && <span className="text-red-500 text-sm font-bold mt-1.5 block">{errors.problemas_diagnosticados.message}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Actuación / Plan</label>
                                <textarea
                                    {...register("indicaciones_acuerdos")}
                                    rows={4}
                                    className={`w-full p-3 bg-slate-50 border rounded-xl outline-none transition-all resize-none ${errors.indicaciones_acuerdos ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 hover:bg-white'}`}
                                    placeholder="Derivaciones, indicaciones, terapia indicada..."
                                />
                                {errors.indicaciones_acuerdos && <span className="text-red-500 text-sm font-bold mt-1.5 block">{errors.indicaciones_acuerdos.message}</span>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
>>>>>>> feat/vista-ficha-pacientes
