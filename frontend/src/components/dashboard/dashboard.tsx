import { useState, useEffect } from 'react';
import {
    Users,
    Clock,
    AlertCircle,
    Activity,
    PlusCircle,
    TrendingUp,
    ChevronRight,
    Stethoscope,
    Calendar,
} from 'lucide-react';

//* Types 

interface Tutor {
    id_tutor: number;
    rut?: string;
    nombre: string;
    apellido: string;
    telefono: string;
    parentesco: string;
    correo?: string;
    direccion: string;
    sector?: string;
    comuna: string;
}

interface Paciente {
    id_paciente: number;
    rut: string;
    nombre: string;
    apellido: string;
    nombre_social?: string;
    fecha_nacimiento: string;
    sexo_biologico: string;
    identidad_genero: string;
    nacionalidad?: string;
    direccion: string;
    sector?: string;
    comuna: string;
    nhc?: string;
    prevision?: string;
    fecha_inscripcion: string;
    activo: boolean;
    es_sename?: boolean;
    es_naneas_prematuro?: boolean;
    es_poblacion_trans?: boolean;
    es_migrante?: boolean;
    id_tutor_principal: number;
    tutor?: Tutor;
    creado_en?: string;
}

//*  Formatters

function calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
}

function calcularEdadDetallada(fechaNacimiento: string): string {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    const años = calcularEdad(fechaNacimiento);
    if (años === 0) {
        const meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + hoy.getMonth() - nacimiento.getMonth();
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
    return `${años} ${años === 1 ? 'año' : 'años'}`;
}

function formatearRUT(rut: string): string {
    return rut; // already formatted in mock data
}

//* Mock data

const PACIENTES_MOCK: Paciente[] = [
    {
        id_paciente: 1,
        rut: '19.876.543-K',
        nombre: 'Carlos',
        apellido: 'Mendoza',
        fecha_nacimiento: '2022-03-15',
        sexo_biologico: 'Masculino',
        identidad_genero: 'Masculino',
        nacionalidad: 'Chilena',
        direccion: 'Calle 5, #123',
        sector: 'Centro',
        comuna: 'La Granja',
        nhc: 'HC-2022-001',
        prevision: 'FONASA',
        fecha_inscripcion: '2022-03-15',
        activo: true,
        es_sename: false,
        es_naneas_prematuro: false,
        es_poblacion_trans: false,
        es_migrante: false,
        id_tutor_principal: 1,
        tutor: {
            id_tutor: 1,
            rut: '12.345.678-K',
            nombre: 'María',
            apellido: 'González',
            telefono: '+56912345678',
            parentesco: 'Madre',
            correo: 'maria@example.com',
            direccion: 'Calle 5, #123',
            sector: 'Centro',
            comuna: 'La Granja',
        },
    },
    {
        id_paciente: 2,
        rut: '19.654.321-J',
        nombre: 'Sofía',
        apellido: 'López',
        fecha_nacimiento: '2023-07-22',
        sexo_biologico: 'Femenino',
        identidad_genero: 'Femenino',
        nacionalidad: 'Chilena',
        direccion: 'Avenida Principal, #456',
        sector: 'Oriente',
        comuna: 'Ñuñoa',
        nhc: 'HC-2023-002',
        prevision: 'ISAPRE',
        fecha_inscripcion: '2023-07-22',
        activo: true,
        es_sename: false,
        es_naneas_prematuro: true,
        es_poblacion_trans: false,
        es_migrante: false,
        id_tutor_principal: 2,
        tutor: {
            id_tutor: 2,
            rut: '11.222.333-K',
            nombre: 'Roberto',
            apellido: 'López',
            telefono: '+56987654321',
            parentesco: 'Padre',
            correo: 'roberto@example.com',
            direccion: 'Avenida Principal, #456',
            sector: 'Oriente',
            comuna: 'Ñuñoa',
        },
    },
    {
        id_paciente: 3,
        rut: '19.555.666-L',
        nombre: 'Lucas',
        apellido: 'Sánchez',
        fecha_nacimiento: '2024-01-10',
        sexo_biologico: 'Masculino',
        identidad_genero: 'Masculino',
        nacionalidad: 'Chilena',
        direccion: 'Pasaje 10, #789',
        sector: 'Poniente',
        comuna: 'Maipú',
        nhc: 'HC-2024-003',
        prevision: 'FONASA',
        fecha_inscripcion: '2024-01-10',
        activo: true,
        es_sename: false,
        es_naneas_prematuro: false,
        es_poblacion_trans: false,
        es_migrante: true,
        id_tutor_principal: 3,
        tutor: {
            id_tutor: 3,
            rut: '13.456.789-2',
            nombre: 'Ana',
            apellido: 'Sánchez',
            telefono: '+56911223344',
            parentesco: 'Madre',
            correo: 'ana@example.com',
            direccion: 'Pasaje 10, #789',
            sector: 'Poniente',
            comuna: 'Maipú',
        },
    },
];

//* sub components 

type ColorKey = 'blue' | 'green' | 'orange' | 'red';

const colorMap: Record<ColorKey, {
    bg: string; border: string; text: string; iconBg: string; dot: string;
}> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-600', dot: 'bg-blue-400' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', iconBg: 'bg-green-600', dot: 'bg-green-400' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', iconBg: 'bg-orange-500', dot: 'bg-orange-400' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', iconBg: 'bg-red-600', dot: 'bg-red-400' },
};

interface IndicadorProps {
    titulo: string;
    valor: number;
    icono: React.ReactNode;
    color: ColorKey;
    descripcion?: string;
}

function Indicador({ titulo, valor, icono, color, descripcion }: IndicadorProps) {
    const c = colorMap[color];
    return (
        <div
            className={`
        ${c.bg} ${c.border} border-2 rounded-2xl p-8 relative
        transition-all duration-200 cursor-default
        hover:scale-[1.03] hover:shadow-lg group
      `}
        >
            {/* Icon */}
            <div className={`absolute top-6 right-6 ${c.iconBg} text-white p-3 rounded-xl shadow-sm`}>
                {icono}
            </div>

            {/* Pulse dot */}
            <span className={`absolute top-7 right-7 w-2 h-2 rounded-full ${c.dot} opacity-0 group-hover:opacity-100 animate-ping transition-opacity`} />

            {/* Content */}
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">{titulo}</p>
            <p className={`text-6xl font-black ${c.text} leading-none mb-3`}>{valor}</p>
            {descripcion && (
                <p className="text-sm text-slate-500 font-medium">{descripcion}</p>
            )}
        </div>
    );
}

interface PacienteCitadoProps {
    paciente: Paciente;
    onVerDetalle: (id: number) => void;
}

function PacienteCitado({ paciente, onVerDetalle }: PacienteCitadoProps) {
    const edad = calcularEdadDetallada(paciente.fecha_nacimiento);
    const tieneRiesgos = paciente.es_naneas_prematuro || paciente.es_sename || paciente.es_migrante;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {paciente.nombre} {paciente.apellido}
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">{edad} · {paciente.sexo_biologico}</p>
                </div>
                {paciente.prevision && (
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full whitespace-nowrap ml-2 mt-0.5">
                        {paciente.prevision}
                    </span>
                )}
            </div>

            <div className="border-b border-slate-100 my-4" />

            {/* Info */}
            <div className="space-y-1.5 mb-4">
                {paciente.tutor && (
                    <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-400">Tutor:</span>{' '}
                        {paciente.tutor.nombre} {paciente.tutor.apellido}
                        <span className="text-slate-400 text-xs ml-1">({paciente.tutor.parentesco})</span>
                    </p>
                )}
                <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-400">RUT:</span>{' '}
                    {formatearRUT(paciente.rut)}
                </p>
                {paciente.nhc && (
                    <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-400">NHC:</span>{' '}
                        {paciente.nhc}
                    </p>
                )}
            </div>

            {/* Risk badges */}
            {tieneRiesgos && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {paciente.es_naneas_prematuro && (
                        <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
                            ⚠️ Prematuro
                        </span>
                    )}
                    {paciente.es_sename && (
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                            🛡️ SENAME
                        </span>
                    )}
                    {paciente.es_migrante && (
                        <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                            🌍 Migrante
                        </span>
                    )}
                </div>
            )}

            {/* CTA */}
            <div className="mt-auto">
                <button
                    onClick={() => onVerDetalle(paciente.id_paciente)}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 text-sm"
                >
                    Ver Historial
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simula carga desde API
        const timer = setTimeout(() => {
            try {
                setPacientes(PACIENTES_MOCK);
                setCargando(false);
            } catch {
                setError('Error al cargar los pacientes.');
                setCargando(false);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const totalActivos = pacientes.filter(p => p.activo).length;
    const citadosHoy = pacientes.length; // mock: todos citados hoy
    const alertasPrematuridad = pacientes.filter(p => p.es_naneas_prematuro).length;
    const riesgoSocial = pacientes.filter(p => p.es_sename || p.es_migrante).length;

    const hoy = new Date().toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

                {/* ── 1. Header ── */}
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-sm">
                                <Stethoscope size={22} />
                            </div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">CESFAM · Programa Infantil</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            Dashboard
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-base">
                            Resumen de actividades del Programa Infantil
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm self-start md:self-auto">
                        <Calendar size={15} className="text-slate-400" />
                        <span className="capitalize">{hoy}</span>
                    </div>
                </header>

                {/* ── 2. KPI Cards ── */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Indicador
                            titulo="Total Pacientes"
                            valor={cargando ? 0 : totalActivos}
                            icono={<Users size={20} />}
                            color="blue"
                            descripcion="Activos en el programa"
                        />
                        <Indicador
                            titulo="Citados Hoy"
                            valor={cargando ? 0 : citadosHoy}
                            icono={<Clock size={20} />}
                            color="green"
                            descripcion="Atenciones programadas"
                        />
                        <Indicador
                            titulo="Alertas Prematuridad"
                            valor={cargando ? 0 : alertasPrematuridad}
                            icono={<AlertCircle size={20} />}
                            color="orange"
                            descripcion="Requieren seguimiento"
                        />
                        <Indicador
                            titulo="Riesgo Social"
                            valor={cargando ? 0 : riesgoSocial}
                            icono={<TrendingUp size={20} />}
                            color="red"
                            descripcion="Requieren protección"
                        />
                    </div>
                </section>

                {/* ── 3. CTA Buttons ── */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button className="
              py-8 px-8 rounded-2xl font-bold text-lg text-white
              bg-gradient-to-br from-blue-600 to-blue-700
              shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200
              flex items-center justify-center gap-3
            ">
                            <PlusCircle size={24} />
                            Nuevo Paciente
                        </button>
                        <button className="
              py-8 px-8 rounded-2xl font-bold text-lg text-white
              bg-gradient-to-br from-green-600 to-green-700
              shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200
              flex items-center justify-center gap-3
            ">
                            <Activity size={24} />
                            Registrar Control
                        </button>
                    </div>
                </section>

                {/* ── 4. Pacientes Citados Hoy ── */}
                <section>
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
                        {/* Section header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-600 text-white p-2.5 rounded-xl">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                        Pacientes Citados Hoy
                                    </h2>
                                    {!cargando && (
                                        <p className="text-sm text-slate-400 font-medium mt-0.5">
                                            {citadosHoy} {citadosHoy === 1 ? 'paciente programado' : 'pacientes programados'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!cargando && citadosHoy > 0 && (
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-4 py-1.5 rounded-full self-start sm:self-auto">
                                    {citadosHoy} hoy
                                </span>
                            )}
                        </div>

                        {/* States */}
                        {cargando ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-slate-100 rounded-2xl h-64 animate-pulse" />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <AlertCircle size={48} className="text-red-300 mb-4" />
                                <p className="text-slate-600 font-semibold">{error}</p>
                            </div>
                        ) : pacientes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Clock size={56} className="text-slate-200 mb-5" />
                                <p className="text-slate-500 font-medium text-lg">No hay pacientes citados para hoy</p>
                                <p className="text-slate-400 text-sm mt-1">Las citas aparecerán aquí una vez registradas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pacientes.map(p => (
                                    <PacienteCitado
                                        key={p.id_paciente}
                                        paciente={p}
                                        onVerDetalle={(id) => console.log('Ver detalle paciente', id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
}
