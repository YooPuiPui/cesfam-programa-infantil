import { useId, useState } from 'react';
import type { Ref } from 'react';
import { Search, X } from 'lucide-react';
import type { Diagnostico } from '../../types';
import { compararDiagnosticos, filtrarDiagnosticos, nombreDiagnostico } from '../../utils/diagnosticos';

type Props = {
    etiqueta: string;
    opciones: Diagnostico[];
    seleccionados: number[];
    onChange: (ids: number[]) => void;
    error?: boolean;
    placeholder?: string;
    cargando?: boolean;
    errorCarga?: string;
    inputRef?: Ref<HTMLInputElement>;     // para enfocar el buscador cuando el formulario marca el error
};

//* lista con buscador para marcar uno o mas diagnosticos del catalogo
export default function SelectorDiagnosticos({
    etiqueta, opciones, seleccionados, onChange, error = false, placeholder = 'Buscar diagnóstico...', cargando = false, errorCarga, inputRef,
}: Props) {
    const [busqueda, setBusqueda] = useState('');
    const idEtiqueta = useId();

    //? la lista y las etiquetas van en orden alfabetico, "seleccionados" conserva el orden en que se marco
    const porNombre = (a: Diagnostico, b: Diagnostico) => compararDiagnosticos(a.nombre, b.nombre);
    const visibles = [...filtrarDiagnosticos(opciones, busqueda)].sort(porNombre);
    const marcados = seleccionados
        .map((id) => opciones.find((d) => d.id_diagnostico === id))
        .filter((d): d is Diagnostico => d !== undefined)
        .sort(porNombre);

    const alternar = (id: number) => {
        onChange(seleccionados.includes(id) ? seleccionados.filter((s) => s !== id) : [...seleccionados, id]);
    };

    return (
        <div role="group" aria-labelledby={idEtiqueta}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <span id={idEtiqueta} className="text-sm font-bold text-slate-700">{etiqueta}</span>
                <span className="text-xs font-bold text-slate-500">{seleccionados.length} seleccionado(s)</span>
            </div>

            <div className={`overflow-hidden rounded-xl border bg-white ${error ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-300'}`}>
                {marcados.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
                        {marcados.map((d) => (
                            <span key={d.id_diagnostico} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-bold text-blue-900">
                                {nombreDiagnostico(d.nombre)}
                                <button
                                    type="button"
                                    onClick={() => alternar(d.id_diagnostico)}
                                    aria-label="Quitar"
                                    className="rounded-full p-0.5 transition-colors hover:bg-blue-200"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="border-b border-slate-200 p-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            //! Enter no debe enviar el formulario que contiene al selector
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            placeholder={placeholder}
                            aria-label={placeholder}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                    </div>
                </div>

                <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto">
                    {cargando ? (
                        <p className="px-4 py-3 text-center text-sm font-medium text-slate-500">Cargando diagnósticos...</p>
                    ) : errorCarga && opciones.length === 0 ? (
                        <p className="px-4 py-3 text-center text-sm font-bold text-red-500">{errorCarga}</p>
                    ) : visibles.length === 0 ? (
                        <p className="px-4 py-3 text-center text-sm font-medium text-slate-500">Sin resultados.</p>
                    ) : (
                        visibles.map((d) => (
                            <label key={d.id_diagnostico} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-blue-50">
                                <input
                                    type="checkbox"
                                    checked={seleccionados.includes(d.id_diagnostico)}
                                    onChange={() => alternar(d.id_diagnostico)}
                                    className="h-4 w-4 rounded border-slate-300 accent-blue-700"
                                />
                                {nombreDiagnostico(d.nombre)}
                            </label>
                        ))
                    )}
                </div>
            </div>

            {/* con la lista cargada a medias (ej: solo los del paciente) igual se avisa la falla */}
            {errorCarga && opciones.length > 0 && <span className="mt-1.5 block text-sm font-bold text-red-500">{errorCarga}</span>}
        </div>
    );
}
