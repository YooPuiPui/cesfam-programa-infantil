import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarCheck, FileBarChart, Stethoscope, LogOut } from "lucide-react";

const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/pacientes", label: "Pacientes", icon: Users },
    { path: "/agenda", label: "Agenda de Controles", icon: CalendarCheck },
    { path: "/reportes", label: "Reportes", icon: FileBarChart },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
            {/* SIDEBAR */}
            <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
                <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Stethoscope className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-800">CESFAM Pediátrico</p>
                </div>

                <nav className="flex flex-1 flex-col gap-1 p-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                location.pathname === item.path ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* HEADER FIJO (Siempre visible) */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
                    <h1 className="text-base font-semibold text-slate-800">
                        {navItems.find(i => i.path === location.pathname)?.label || "Panel"}
                    </h1>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                MG
                            </div>
                            <div className="hidden leading-tight sm:block">
                                <p className="text-sm font-medium text-slate-800">Dra. María González</p>
                                <p className="text-xs text-slate-500">Pediatra</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </header>

                {/* AQUÍ SE RENDERIZA EL CONTENIDO DE CADA PÁGINA */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}