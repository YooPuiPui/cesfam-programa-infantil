import { useEffect, useState } from "react";

// interface

interface Paciente {

    id_paciente: number;
    rut: string;
    nombre: string;
    apellido: string;
    nombre_social?: string;
    fecha_nacimiento: string;
    sexo_biologico: string;
    identidad_genero: string;
    nacionalidad?: string;
    direccion: string;
    sector?: string;
    comuna: string;
    nhc?: string | null;
    prevision?: string | null;
    fecha_inscripcion: string;
    activo: boolean;
}

export default function listaPaciente() {

    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {

        const obtenerPacientes = async () => {
            try {

                const respuesta = await fetch('http:localhost:3000/api/pacientes');

                if (!respuesta.ok) {
                    throw new Error('Error al conectar con el servidor clinico');
                }


                const datos = await respuesta.json();
                setPacientes(datos);

            } catch (error: any) {
                setError(error.message);
            } finally {
                setCargando(false);
            }
        };

        obtenerPacientes();
    }, []);


    if (cargando) return <div className="text-center text-blue-600 font-bold mt-10 animate-pulse">Conectando con la base de datos...</div>;
    if (error) return <div className="text-center text-red-500 font-bold mt-10">⚠️ Fallo de conexión: {error}</div>;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Directorio de Pacientes</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                    Total: {pacientes.length}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Identificación</th>
                            <th className="px-6 py-4 font-semibold">Paciente</th>
                            <th className="px-6 py-4 font-semibold">Previsión / NHC</th>
                            <th className="px-6 py-4 font-semibold">Sector</th>
                            <th className="px-6 py-4 font-semibold text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {pacientes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No hay pacientes registrados en el sistema.
                                </td>
                            </tr>
                        ) : (
                            pacientes.map((paciente) => (
                                <tr key={paciente.id_paciente} className="hover:bg-slate-50 transition-colors">

                                    {/* Columna Identificación: RUT e ID */}
                                    <td className="px-6 py-4">
                                        <span className="block text-slate-900 font-medium">{paciente.rut}</span>
                                        <span className="block text-xs text-slate-400">ID: #{paciente.id_paciente}</span>
                                    </td>

                                    {/* Columna Paciente: Nombre oficial y Nombre Social si existe */}
                                    <td className="px-6 py-4">
                                        <span className="block font-bold text-blue-700">
                                            {paciente.nombre} {paciente.apellido}
                                        </span>
                                        {paciente.nombre_social && (
                                            <span className="block text-sm text-slate-500 italic">
                                                Social: {paciente.nombre_social}
                                            </span>
                                        )}
                                    </td>

                                    {/* Columna Datos Administrativos Clínicos */}
                                    <td className="px-6 py-4">
                                        <span className="block text-slate-800 font-medium">
                                            {paciente.prevision || 'Sin registro'}
                                        </span>
                                        <span className="block text-sm text-slate-500">
                                            NHC: {paciente.nhc || 'Pendiente'}
                                        </span>
                                    </td>

                                    {/* Columna Sector */}
                                    <td className="px-6 py-4">
                                        <span className="block text-slate-800">{paciente.sector || 'No asignado'}</span>
                                        <span className="block text-sm text-slate-500">{paciente.comuna}</span>
                                    </td>

                                    {/* Columna Estado Visual (Activo/Inactivo) */}
                                    <td className="px-6 py-4 text-center">
                                        {paciente.activo ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Inactivo
                                            </span>
                                        )}
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
