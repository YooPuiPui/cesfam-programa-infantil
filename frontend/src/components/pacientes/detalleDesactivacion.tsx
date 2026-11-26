import type { DatosDesactivacion } from '../../types';
import { ETIQUETAS_MOTIVO, SIN_MOTIVO, fechaEnChile } from '../../utils/desactivacion';

//* ventana de solo lectura con los datos de la desactivacion
export default function DetalleDesactivacion({ paciente, onCerrar }: { paciente: DatosDesactivacion; onCerrar: () => void }) {
    const { motivo_desactivacion, detalle_desactivacion, fecha_desactivacion } = paciente;

    const filas = [
        { titulo: 'Motivo', valor: motivo_desactivacion ? ETIQUETAS_MOTIVO[motivo_desactivacion] : SIN_MOTIVO },
        { titulo: 'Fecha', valor: fecha_desactivacion ? fechaEnChile(fecha_desactivacion) : 'Sin fecha registrada' },
        { titulo: 'Detalle', valor: detalle_desactivacion || 'Sin detalle' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
            <div role="dialog" aria-modal="true" aria-labelledby="titulo-detalle-desactivacion" className="w-full max-w-95 rounded-2xl bg-white p-7 shadow-xl">
                <h2 id="titulo-detalle-desactivacion" className="text-lg font-black text-slate-900">Detalle de la desactivación</h2>
                <dl className="mt-5 space-y-4">
                    {filas.map((fila) => (
                        <div key={fila.titulo}>
                            <dt className="text-sm font-medium text-slate-500">{fila.titulo}</dt>
                            <dd className="mt-1 whitespace-pre-wrap wrap-break-word text-sm font-bold text-slate-900">{fila.valor}</dd>
                        </div>
                    ))}
                </dl>
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onCerrar}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
