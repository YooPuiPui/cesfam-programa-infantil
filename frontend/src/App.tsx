import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PatientList from "./components/pacientes/listaPacientes";
import Login from "./components/login/Login";
import CrearControl from "./components/controles/crearControl";
import FichaPacientes from "./components/pacientes/fichaPacientes";
import PlantillaControl from './components/controles/plantillaControl';
import InscribirPaciente from "./components/pacientes/inscribirPaciente";
import AgendaControles from "./components/agenda/agendaControles";
import Dashboard from "./components/dashboard/Dashboard";
import RutaProtegida from "./components/login/rutaProtegida";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />


        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/pacientes"
          element={
            <RutaProtegida>
              <DashboardLayout>
                <PatientList />
              </DashboardLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/inscribir-paciente"
          element={
            <RutaProtegida>
              <DashboardLayout>
                <InscribirPaciente />
              </DashboardLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/agenda"
          element={
            <RutaProtegida>
              <DashboardLayout>
                <AgendaControles />
              </DashboardLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/nuevo-control"
          element={
            <RutaProtegida>
              <DashboardLayout>
                <CrearControl />
              </DashboardLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/ficha/:rut"
          element={
            <RutaProtegida>
              <DashboardLayout>
                <FichaPacientes />
              </DashboardLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/detalle/:id_control"
          element={
            <RutaProtegida>
              <DashboardLayout>
                <PlantillaControl />
              </DashboardLayout>
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}