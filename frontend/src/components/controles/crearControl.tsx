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