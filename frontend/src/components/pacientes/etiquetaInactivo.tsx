import type { DatosDesactivacion } from '../../types';
import { SIN_MOTIVO, textoInactivo } from '../../utils/desactivacion';

//* etiqueta de un paciente desactivado, el detalle (si hay) se ve al pasar el cursor
export default function EtiquetaInactivo({ paciente, className = '' }: { paciente: DatosDesactivacion; className?: string }) {
    const conMotivo = Boolean(paciente.motivo_desactivacion);

    return (
        <span className={`inline-flex flex-wrap items-center gap-1.5 align-middle normal-case tracking-normal ${className}`}>
            <span title={paciente.detalle_desactivacion ?? undefined} className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {conMotivo ? textoInactivo(paciente) : 'Inactivo'}
            </span>
            {!conMotivo && <span className="text-xs font-medium text-slate-500">{SIN_MOTIVO}</span>}
        </span>
    );
}
