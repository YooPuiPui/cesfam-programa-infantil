import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [rut, setRut] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // evita que la página se recargue al enviar el form
        setError("");

        try {
            // post a la api 
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ rut, password }),
            });

            const data = await response.json();

            // validacion de contraseña 
            if (!response.ok) {
                throw new Error(data.error || "Error al iniciar sesión");
            }

            // 
            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", JSON.stringify(data.usuario));

            // Redirigimos diractamente al dashboard
            navigate("/dashboard");

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-blue-300 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">

                {/* Encabezado */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800"> Acceso a Gestion Programa Infantil</h1>
                </div>

                {/* Mensaje de Error (solo aparece si hay error) */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-000 mb-1">
                            RUT Profesional
                        </label>
                        <input
                            type="text"
                            value={rut}
                            onChange={(e) => setRut(e.target.value)}
                            placeholder="Ej: 12345678-9"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-000 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        Acceder
                    </button>
                </form>

            </div>
        </div>
    );
}