import { Navigate } from "react-router-dom";
import { marcarSesionExpirada, tokenVencido } from "../../utils/sesion";

export default function RutaProtegida({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (tokenVencido(token)) {
        marcarSesionExpirada();
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}