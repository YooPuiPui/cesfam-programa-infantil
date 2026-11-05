import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginacionProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

//* numeros de pagina a mostrar: primera, ultima y las vecinas de la actual (null = "…")
const obtenerPaginasVisibles = (actual: number, total: number): (number | null)[] => {
    const paginas = new Set([1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total));
    const ordenadas = [...paginas].sort((a, b) => a - b);

    const resultado: (number | null)[] = [];
    ordenadas.forEach((n, i) => {
        if (i > 0 && n - ordenadas[i - 1] > 1) resultado.push(null);
        resultado.push(n);
    });
    return resultado;
};

export default function Paginacion({ page, totalPages, onChange }: PaginacionProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <span className="text-sm font-medium text-slate-600">Página {page} de {totalPages}</span>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    disabled={page === 1}
                    onClick={() => onChange(1)}
                    title="Primera página"
                    aria-label="Primera página"
                    className="flex items-center px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                    disabled={page === 1}
                    onClick={() => onChange(page - 1)}
                    className="flex items-center px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </button>

                {obtenerPaginasVisibles(page, totalPages).map((n, i) =>
                    n === null ? (
                        <span key={`gap-${i}`} className="px-1 text-sm font-semibold text-slate-500">…</span>
                    ) : (
                        <button
                            key={n}
                            onClick={() => onChange(n)}
                            aria-current={n === page ? "page" : undefined}
                            className={`min-w-9 px-3 py-2 text-sm font-semibold rounded-lg border ${n === page ? "bg-blue-700 border-blue-700 text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"}`}
                        >
                            {n}
                        </button>
                    )
                )}

                <button
                    disabled={page >= totalPages}
                    onClick={() => onChange(page + 1)}
                    className="flex items-center px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white"
                >
                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </button>
                <button
                    disabled={page >= totalPages}
                    onClick={() => onChange(totalPages)}
                    title="Última página"
                    aria-label="Última página"
                    className="flex items-center px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
