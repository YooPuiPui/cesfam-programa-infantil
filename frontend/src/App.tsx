// ============================================
// APP.TSX - ROUTER PRINCIPAL DE LA APLICACIÓN
// ============================================

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Home, Users } from 'lucide-react';
import Dashboard from './features/dashboard';
import PatientList from './features/pacientes/listaPacientes';


function Navbar() {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* LOGO / TÍTULO */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              CESFAM Santa Sabina - Programa Infantil
            </h1>
          </div>

          {/* LINKS DE NAVEGACIÓN */}
          <nav className="flex gap-6">
            <Link
              to="/dashboard"
              className="
                flex items-center gap-2 px-4 py-2 rounded
                hover:bg-blue-700 transition-colors
              "
            >
              <Home size={20} />
              Dashboard
            </Link>

            <Link
              to="/pacientes"
              className="
                flex items-center gap-2 px-4 py-2 rounded
                hover:bg-blue-700 transition-colors
              "
            >
              <Users size={20} />
              Pacientes
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

/**
 * ============================================
 * COMPONENTE PRINCIPAL: APP
 * ============================================
 */
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        {/* NAVBAR GLOBAL */}
        <Navbar />

        {/* CONTENEDOR PRINCIPAL */}
        <main>
          <Routes>
            {/* RUTA POR DEFECTO: Redirecciona a Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* RUTA: DASHBOARD */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* RUTA: LISTA DE PACIENTES */}
            <Route path="/pacientes" element={<PatientList />} />

            {/* RUTA COMODÍN: Si no encuentra la ruta, redirecciona a dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;