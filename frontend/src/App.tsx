import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PatientList from "./components/pacientes/listaPacientes";
import Login from "./components/login/Login";
import CrearControl from "./components/controles/crearControl";
import FichaPacientes from "./components/pacientes/fichaPacientes";
import PlantillaControl from './components/controles/plantillaControl';
import InscribirPaciente from "./components/pacientes/inscribirPaciente";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />


        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <div className="p-6">pronto...</div>
            </DashboardLayout>
          }
        />

        <Route
          path="/pacientes"
          element={
            <DashboardLayout>
              <PatientList />
            </DashboardLayout>
          }
        />

        <Route
          path="/inscribir-paciente"
          element={
            <DashboardLayout>
              <InscribirPaciente />
            </DashboardLayout>
          }
        />

        <Route
          path="/nuevo-control"
          element={
            <DashboardLayout>
              <CrearControl />
            </DashboardLayout>
          }
        />

        <Route
          path="/ficha/:rut"
          element={
            <DashboardLayout>
              <FichaPacientes />
            </DashboardLayout>
          }
        />

        <Route
          path="/detalle/:id_control"
          element={
            <DashboardLayout>
              <PlantillaControl />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}