import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PatientList from "./components/pacientes/listaPacientes"; 
import Login from "./components/login/Login";

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
      </Routes>
    </BrowserRouter>
  );
}