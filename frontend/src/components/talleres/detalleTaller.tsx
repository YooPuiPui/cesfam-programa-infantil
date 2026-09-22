import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, CalendarDays, UserRound } from "lucide-react";
import { API_BASE_URL } from '../../service/api';
import { formatearFecha } from '../../utils/formatters';

interface SesionTaller {
    id_sesion: number;
    fecha: string;
    cupo_maximo: number | null;
    rut_profesional: string | null;
    profesional_externo: string | null;
    observaciones: string | null;
}

interface TallerConSesiones {
    id_taller: number;
    nombre: string;
    descripcion: string | null;
    edad_min: number;
    edad_max: number;
    sesiones: SesionTaller[];
}

// rut_profesional y profesional_externo son mutuamente excluyentes (Tema 4)
const responsableSesion = (sesion: SesionTaller): string => {
    if (sesion.rut_profesional) return sesion.rut_profesional;
    if (sesion.profesional_externo) return sesion.profesional_externo;
    return "Sin asignar";
};

export default function DetalleTaller() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [taller, setTaller] = useState<TallerConSesiones | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const obtenerTaller = async () => {
            setCargando(true);
            setError("");
            try {
                const token = localStorage.getItem("token");

                const respuesta = await fetch(`${API_BASE_URL}/talleres/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!respuesta.ok) throw new Error("No se pudo obtener el taller solicitado");

                // un solo fetch: las sesiones ya vienen incluidas (Tema 4)
                const data: TallerConSesiones = await respuesta.json();
                setTaller(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                setCargando(false);
            }
        };

        obtenerTaller();
    }, [id]); // se re-ejecuta si cambia el id de la URL (Tema 4)

    return (
        <div>
            <button
                type="button"
                onClick={() => navigate("/talleres")}
                className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </button>

            {cargando && (
                <div className="flex justify-center items-center p-12 text-blue-700">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-3 font-semibold text-lg">Cargando...</span>
                </div>
            )}

            {error && !cargando && (
                <div className="p-8 text-center text-red-600 font-bold text-lg">{error}</div>
            )}

            {!cargando && !error && taller && (
                <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
                        <h1 className="text-xl font-semibold text-slate-800 mb-2">{taller.nombre}</h1>
                        <p className="text-sm text-slate-600 mb-2">{taller.descripcion || "Sin descripción"}</p>
                        <p className="text-xs font-semibold text-slate-500">
                            Edad: {taller.edad_min} a {taller.edad_max} años
                        </p>
                    </div>

                    <h2 className="text-lg font-semibold text-slate-800 mb-3">Sesiones</h2>

                    {taller.sesiones.length === 0 && (
                        <div className="p-8 text-center text-slate-500 font-semibold">
                            Este taller no tiene sesiones registradas todavía.
                        </div>
                    )}

                    {taller.sesiones.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {taller.sesiones.map((sesion) => (
                                <div
                                    key={sesion.id_sesion}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <div className="flex items-center gap-2 mb-2 text-slate-800">
                                        <CalendarDays className="h-4 w-4 text-blue-700" />
                                        {/* toLocaleDateString con timeZone: 'UTC' (Tema 5), viene de utils/formatters.ts */}
                                        <span className="font-semibold">{formatearFecha(sesion.fecha)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <UserRound className="h-4 w-4 text-slate-400" />
                                        <span>{responsableSesion(sesion)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
