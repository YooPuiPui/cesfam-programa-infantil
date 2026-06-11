import { useState } from "react"
import {
    Search,
    Users,
    CalendarCheck,
    AlertTriangle,
    ClipboardPlus,
    History,
    type LucideIcon,
} from "lucide-react"

// ===================== TIPOS =====================
type ControlStatus = "al-dia" | "pendiente" | "atrasado"

interface Patient {
    id: number
    nombre: string
    rut: string
    edad: string
    estado: ControlStatus
}

interface Metric {
    label: string
    value: number
    icon: LucideIcon
    iconClass: string
    valueClass: string
}

// ===================== DATOS DE EJEMPLO =====================
const metrics: Metric[] = [
    {
        label: "Total de niños registrados",
        value: 1248,
        icon: Users,
        iconClass: "bg-blue-100 text-blue-700",
        valueClass: "text-blue-700",
    },
    {
        label: "Controles al día",
        value: 932,
        icon: CalendarCheck,
        iconClass: "bg-emerald-100 text-emerald-700",
        valueClass: "text-emerald-700",
    },
    {
        label: "Pendientes de rescate",
        value: 64,
        icon: AlertTriangle,
        iconClass: "bg-amber-100 text-amber-700",
        valueClass: "text-amber-700",
    },
]

const patients: Patient[] = [
    { id: 1, nombre: "Sofía Martínez Rojas", rut: "25.481.902-3", edad: "3 años", estado: "al-dia" },
    { id: 2, nombre: "Benjamín Soto Díaz", rut: "24.103.557-K", edad: "5 años", estado: "pendiente" },
    { id: 3, nombre: "Isidora Pérez Lagos", rut: "26.220.418-1", edad: "1 año", estado: "atrasado" },
    { id: 4, nombre: "Matías Fuentes Vega", rut: "25.778.034-9", edad: "7 años", estado: "al-dia" },
    { id: 5, nombre: "Florencia Núñez Cáceres", rut: "26.001.776-4", edad: "2 años", estado: "pendiente" },
    { id: 6, nombre: "Agustín Morales Pinto", rut: "24.559.183-7", edad: "9 años", estado: "al-dia" },
]

// ===================== CONFIG DE BADGES =====================
const statusConfig: Record<ControlStatus, { label: string; className: string }> = {
    "al-dia": { label: "Al día", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
    pendiente: { label: "Pendiente", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
    atrasado: { label: "Atrasado", className: "bg-red-50 text-red-700 ring-red-600/20" },
}

function StatusBadge({ estado }: { estado: ControlStatus }) {
    const { label, className } = statusConfig[estado]
    return (
        <span
            className={
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset " +
                className
            }
        >
            {label}
        </span>
    )
}

// ===================== COMPONENTE PRINCIPAL =====================
export default function GestionPacientes() {
    const [query, setQuery] = useState("")

    const filtered = patients.filter((p) => {
        const term = query.trim().toLowerCase()
        if (!term) return true
        return p.nombre.toLowerCase().includes(term) || p.rut.toLowerCase().includes(term)
    })

    return (
        <div className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Encabezado */}
                <header className="mb-6">
                    <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Gestión de Pacientes</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Resumen y seguimiento de los controles pediátricos del centro.
                    </p>
                </header>

                {/* ===================== TARJETAS DE RESUMEN ===================== */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {metrics.map((metric) => {
                        const Icon = metric.icon
                        return (
                            <div
                                key={metric.label}
                                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
                            >
                                <div className={"flex h-12 w-12 items-center justify-center rounded-lg " + metric.iconClass}>
                                    <Icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">{metric.label}</p>
                                    <p className={"text-2xl font-semibold " + metric.valueClass}>
                                        {metric.value.toLocaleString("es-CL")}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </section>

                {/* ===================== BUSCADOR ===================== */}
                <div className="mt-6">
                    <div className="relative max-w-md">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre o RUT..."
                            aria-label="Buscar paciente por nombre o RUT"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* ===================== TABLA DE PACIENTES ===================== */}
                <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-6 py-3.5 font-medium text-slate-500">Nombre</th>
                                    <th className="px-6 py-3.5 font-medium text-slate-500">Edad</th>
                                    <th className="px-6 py-3.5 font-medium text-slate-500">Estado de Control</th>
                                    <th className="px-6 py-3.5 text-right font-medium text-slate-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{patient.nombre}</div>
                                            <div className="text-xs text-slate-400">{patient.rut}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{patient.edad}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge estado={patient.estado} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    title="Nueva ficha"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
                                                    <span className="hidden sm:inline">Nueva ficha</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Ver histórico"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
                                                >
                                                    <History className="h-4 w-4" aria-hidden="true" />
                                                    <span className="hidden sm:inline">Ver histórico</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                                            No se encontraron pacientes para “{query}”.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    )
}