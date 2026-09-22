import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Users } from "lucide-react";
import { API_BASE_URL } from "../../service/api";









interface Taller {

    id_taller: number;
    nombre: string;
    descripcion: string;
    edad_min: number;
    edad_max: number;
    activo: boolean;
    creado_en: string;

}


export default function Talleres() {

    const navigate = useNavigate();
    const [talleres, setTalleres] = useState<Taller[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");



    useEffect(() => {

        const obtenerTalleres = async () => {

            setCargando(true);
            setError("");

            try {
                const token = localStorage.getItem("token");

                const respuesta = await fetch(`${API_BASE_URL}/talleres`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if(!respuesta.ok) throw new Error("No se pudo obtener la lista de talleres");

                const data: Taller[] = await respuesta.json();
                setTalleres(data);

            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            }finally {
                setCargando(false);
            }


        }

        obtenerTalleres();

    },[]);



    return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-semibold text-slate-800">Talleres</h1>
                    <button
                        type="button"
                        onClick={() => navigate("/talleres/nuevo")}
                        className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Nuevo taller
                    </button>
                </div>

                {cargando && (
                    <div className="flex justify-center items-center p-12 text-blue-700">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-3 font-semibold text-lg">Cargando...</span>
                    </div>
                )}

                {error && !cargando && (
                    <div className="p-8 text-center text-red-600 font-bold text-lg">{error}</div>
                )}

                {!cargando && !error && talleres.length === 0 && (
                    <div className="p-8 text-center text-slate-500 font-semibold">
                        No hay talleres registrados todavía.
                    </div>
                )}

                {!cargando && !error && talleres.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {talleres.map((taller) => (
                            <button
                                key={taller.id_taller}
                                type="button"
                                onClick={() => navigate(`/talleres/${taller.id_taller}`)}
                                className="text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-5 w-5 text-blue-700" />
                                    <h2 className="font-semibold text-slate-800">{taller.nombre}</h2>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">
                                    {taller.descripcion || "Sin descripción"}
                                </p>
                                <p className="text-xs font-semibold text-slate-500">
                                    Edad: {taller.edad_min} a {taller.edad_max} años
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
}







