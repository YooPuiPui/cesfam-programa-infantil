import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PatientList from "./components/pacientes/listaPacientes"; // Asumiendo que ya lo creaste

export default function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<div className="p-6">Bienvenida al Dashboard</div>} />
          <Route path="/pacientes" element={<PatientList />} />
          {/* Aquí agregarás tus rutas futuras */}
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}